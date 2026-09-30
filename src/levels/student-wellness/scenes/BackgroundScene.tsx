import { useEffect, useMemo, useRef, useState } from 'react';
import { useKeyPress, useKeysRef } from '../hooks/useKeyboard';
import { InteractionPrompt } from '../components/InteractionPrompt';
import './BackgroundScene.css';

/**
 * A single interaction zone anchored to a point on the illustrated background.
 * All coordinates are percentages of scene width / height so the zone stays
 * aligned with the visual target when the background is scaled.
 */
export interface InteractionZone {
  id: string;
  /** Zone centre, as % of scene width (0–100). */
  x: number;
  /** Zone centre, as % of scene height (0–100). */
  y: number;
  /** Interaction radius, as % (Euclidean distance in the same coordinate space). */
  radius: number;
  /** Prompt label — e.g. "Press E to swipe your student card". */
  label: string;
}

/**
 * A stationary NPC drawn on top of the background. If `interactionLabel` is
 * given, the NPC's position also becomes an interaction zone under the same
 * `id`, so the mission only has to declare the character once.
 */
export interface SceneNpc {
  id: string;
  /** % of scene width — bottom-centre (the character's feet) sits here. */
  x: number;
  /** % of scene height — bottom-centre sits here. */
  y: number;
  spriteUrl: string;
  /** Sprite height as % of scene height. Defaults to the same as the player. */
  heightPct?: number;
  /** If set, a "Press E to …" prompt appears when the player is within radius. */
  interactionLabel?: string;
  /** Interaction radius (% of scene). Defaults to 12. */
  interactionRadius?: number;
  /** Optional mirror. */
  flip?: boolean;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface Props {
  backgroundSrc: string;
  /** URLs of the four-directional player sprites. */
  playerSprites: { up: string; down: string; left: string; right: string };
  spawn: { x: number; y: number };
  bounds?: Bounds;
  /** Environment interaction zones (card readers, doors, desks, …). */
  zones?: InteractionZone[];
  /** NPCs drawn on top of the background. May contribute their own zones. */
  npcs?: SceneNpc[];
  /**
   * When true, the player can move (WASD/arrows) and press E to interact.
   * When false, both are frozen — used to pause the scene behind a modal
   * dialogue or overlay so the character doesn't drift under it.
   */
  interactionEnabled: boolean;
  onInteract: (id: string) => void;
  /** When true, the player sprite is not drawn (e.g. cutscene-style scenes). */
  hidePlayer?: boolean;
  /** Extra elements rendered above the background, below the player (e.g. decorations). */
  children?: React.ReactNode;
}

// Player size is a percentage of scene height so it scales with the viewport.
const PLAYER_HEIGHT_PCT = 18;
// The move speed uses the same units as JammieRush's other scenes (percent of
// scene per second). Vertical motion is boosted slightly because the scenes
// are wider than they are tall.
const SPEED = 34;
const Y_BOOST = 1.3;
const DEFAULT_INTERACT_RADIUS = 12;

const DEFAULT_BOUNDS: Bounds = { minX: 4, maxX: 96, minY: 20, maxY: 94 };

type Facing = 'up' | 'down' | 'left' | 'right';

export function BackgroundScene({
  backgroundSrc,
  playerSprites,
  spawn,
  bounds = DEFAULT_BOUNDS,
  zones,
  npcs,
  interactionEnabled,
  onInteract,
  hidePlayer = false,
  children,
}: Props) {
  const keysRef = useKeysRef();
  const posRef = useRef(spawn);
  const facingRef = useRef<Facing>('down');
  const [pos, setPos] = useState(spawn);
  const [facing, setFacing] = useState<Facing>('down');

  const nearbyRef = useRef<string | null>(null);
  const [nearby, setNearby] = useState<string | null>(null);

  // NPC-derived zones are merged with the explicit zones. Memoised so array
  // identity is stable across renders (the RAF effect depends on it).
  const allZones: InteractionZone[] = useMemo(() => {
    const npcZones: InteractionZone[] = (npcs ?? [])
      .filter((n) => n.interactionLabel)
      .map((n) => ({
        id: n.id,
        x: n.x,
        y: n.y,
        // Interaction radius is set slightly below the NPC's midriff so the
        // "Press E" prompt appears at head height rather than at their feet.
        radius: n.interactionRadius ?? DEFAULT_INTERACT_RADIUS,
        label: n.interactionLabel!,
      }));
    return [...(zones ?? []), ...npcZones];
  }, [zones, npcs]);

  // Re-seat the player when the scene mounts. Each scene instance owns its own
  // spawn coordinates, so a fresh mount always begins from that location.
  useEffect(() => {
    posRef.current = spawn;
    setPos(spawn);
    facingRef.current = 'up';
    setFacing('up');
    nearbyRef.current = null;
    setNearby(null);
  }, [spawn.x, spawn.y]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // Movement is only sampled while the scene is active. When
      // interactionEnabled is false (dialogue or minigame overlay is up), the
      // player stays put and the RAF loop just skips input entirely.
      if (interactionEnabled) {
        const keys = keysRef.current;
        let dx = 0;
        let dy = 0;
        if (keys.has('w') || keys.has('arrowup')) dy -= 1;
        if (keys.has('s') || keys.has('arrowdown')) dy += 1;
        if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
        if (keys.has('d') || keys.has('arrowright')) dx += 1;

        if (dx !== 0 || dy !== 0) {
          const len = Math.hypot(dx, dy) || 1;
          const nx = posRef.current.x + (dx / len) * SPEED * dt;
          const ny = posRef.current.y + (dy / len) * SPEED * dt * Y_BOOST;
          const next = {
            x: Math.max(bounds.minX, Math.min(bounds.maxX, nx)),
            y: Math.max(bounds.minY, Math.min(bounds.maxY, ny)),
          };
          posRef.current = next;
          setPos(next);

          // Face the dominant axis of the latest movement.
          const nextFacing: Facing =
            Math.abs(dx) > Math.abs(dy)
              ? dx > 0
                ? 'right'
                : 'left'
              : dy > 0
                ? 'down'
                : 'up';
          if (nextFacing !== facingRef.current) {
            facingRef.current = nextFacing;
            setFacing(nextFacing);
          }
        }
      }

      // Proximity detection — pick the CLOSEST zone within its own radius.
      // Only one nearby zone is ever active, which means only one "Press E"
      // prompt appears at a time even if two zones sit near each other.
      let closest: string | null = null;
      let closestDist = Infinity;
      for (const zone of allZones) {
        const d = Math.hypot(zone.x - posRef.current.x, zone.y - posRef.current.y);
        if (d < zone.radius && d < closestDist) {
          closest = zone.id;
          closestDist = d;
        }
      }
      // Freeze the prompt while the scene is disabled — don't switch which
      // target it points at based on movement that isn't happening.
      if (interactionEnabled && closest !== nearbyRef.current) {
        nearbyRef.current = closest;
        setNearby(closest);
      } else if (!interactionEnabled && nearbyRef.current !== null) {
        nearbyRef.current = null;
        setNearby(null);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds.minX, bounds.maxX, bounds.minY, bounds.maxY, allZones, interactionEnabled]);

  useKeyPress(
    'e',
    () => {
      if (nearbyRef.current) onInteract(nearbyRef.current);
    },
    interactionEnabled,
  );

  const nearbyZone = allZones.find((z) => z.id === nearby);
  const playerSprite = playerSprites[facing];

  return (
    <div className="bg-scene">
      <img className="bg-scene__image" src={backgroundSrc} alt="" draggable={false} />

      {children}

      {/* NPCs — drawn between the background and the player so the player
          appears in front when overlapping. Z-index nudged by y-coordinate so
          NPCs deeper in the scene sit behind ones closer to the viewer. */}
      {(npcs ?? []).map((npc) => (
        <div
          key={npc.id}
          className="bg-scene__npc"
          style={{
            left: `${npc.x}%`,
            top: `${npc.y}%`,
            height: `${npc.heightPct ?? PLAYER_HEIGHT_PCT}%`,
            zIndex: Math.round(npc.y * 10) / 10,
          }}
        >
          <img
            src={npc.spriteUrl}
            alt=""
            draggable={false}
            style={npc.flip ? { transform: 'scaleX(-1)' } : undefined}
          />
        </div>
      ))}

      {!hidePlayer && (
        <div
          className="bg-scene__player"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            height: `${PLAYER_HEIGHT_PCT}%`,
          }}
        >
          <img src={playerSprite} alt="Player" draggable={false} />
        </div>
      )}

      {nearbyZone && interactionEnabled && (
        <InteractionPrompt
          left={`${nearbyZone.x}%`}
          top={`${Math.max(4, nearbyZone.y - nearbyZone.radius - 2)}%`}
          label={nearbyZone.label}
        />
      )}
    </div>
  );
}
