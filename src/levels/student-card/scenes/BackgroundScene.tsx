import { useEffect, useMemo, useRef, useState } from 'react';
import { useKeyPress, useKeysRef } from '../hooks/useKeyboard';
import { InteractionPrompt } from '../components/InteractionPrompt';
import './BackgroundScene.css';

/**
 * A single proximity-based interaction zone anchored to a point on the
 * illustrated background. All coordinates are percentages of the scene's
 * width and height so the zone stays aligned with its visual target when
 * the background is resized.
 */
export interface InteractionZone {
  id: string;
  /** Zone centre, as % of scene width (0–100). */
  x: number;
  /** Zone centre, as % of scene height (0–100). */
  y: number;
  /** Interaction radius, as % (Euclidean in the same coordinate space). */
  radius: number;
  /** Prompt label — e.g. "Press E to enter Access Control". */
  label: string;
}

/**
 * A stationary NPC drawn on top of the background as an emoji "sprite".
 * If `interactionLabel` is provided, the NPC's position also becomes an
 * interaction zone under the same `id`, so the mission only has to declare
 * the character once.
 */
export interface SceneNpc {
  id: string;
  /** % of scene width. */
  x: number;
  /** % of scene height. */
  y: number;
  /** Emoji glyph used as a lightweight NPC "sprite". */
  emoji: string;
  /** Optional font size for the emoji, in px. Defaults to 40. */
  size?: number;
  /** If set, a "Press E to …" prompt appears when the player is within radius. */
  interactionLabel?: string;
  /** Interaction radius (% of scene). Defaults to DEFAULT_INTERACT_RADIUS. */
  interactionRadius?: number;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface Props {
  backgroundSrc: string;
  spawn: { x: number; y: number };
  bounds?: Bounds;
  /** Environment interaction zones (doors, desks, stools, …). */
  zones?: InteractionZone[];
  /** NPCs drawn on top of the background. May contribute their own zones. */
  npcs?: SceneNpc[];
  /**
   * When true, the player can move (WASD/arrows) and press E to interact.
   * When false, both are frozen — used to pause the scene behind a modal
   * dialogue or overlay so the character doesn't drift under it and stray
   * E-presses don't leak through to the scene.
   */
  interactionEnabled: boolean;
  onInteract: (id: string) => void;
  /** When true, the player emoji is not drawn (e.g. cutscene-only scenes). */
  hidePlayer?: boolean;
}

// The move speed uses the same units as the rest of the project — percent of
// scene per second. Vertical motion is boosted slightly because the scenes
// are wider than they are tall.
const SPEED = 34;
const Y_BOOST = 1.3;
const DEFAULT_INTERACT_RADIUS = 11;

const DEFAULT_BOUNDS: Bounds = { minX: 4, maxX: 96, minY: 20, maxY: 94 };

export function BackgroundScene({
  backgroundSrc,
  spawn,
  bounds = DEFAULT_BOUNDS,
  zones,
  npcs,
  interactionEnabled,
  onInteract,
  hidePlayer = false,
}: Props) {
  const keysRef = useKeysRef();
  const posRef = useRef(spawn);
  const [pos, setPos] = useState(spawn);

  const nearbyRef = useRef<string | null>(null);
  const [nearby, setNearby] = useState<string | null>(null);

  // NPC-derived zones are merged with the explicit environment zones so the
  // scene only has to look at one flat list when doing proximity checks.
  // Memoised so array identity is stable across renders (the RAF effect
  // depends on it).
  const allZones: InteractionZone[] = useMemo(() => {
    const npcZones: InteractionZone[] = (npcs ?? [])
      .filter((n) => n.interactionLabel)
      .map((n) => ({
        id: n.id,
        x: n.x,
        y: n.y,
        radius: n.interactionRadius ?? DEFAULT_INTERACT_RADIUS,
        label: n.interactionLabel!,
      }));
    return [...(zones ?? []), ...npcZones];
  }, [zones, npcs]);

  // Re-seat the player when the scene mounts (or the spawn point changes).
  // Each scene instance owns its own spawn coordinates, so a fresh mount
  // always begins from that location and any stale "nearby" is cleared.
  useEffect(() => {
    posRef.current = spawn;
    setPos(spawn);
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
      // interactionEnabled is false (dialogue/minigame overlay is up), the
      // player stays put and the RAF loop skips input entirely.
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
        }
      }

      // Proximity detection — pick the CLOSEST zone within its own radius.
      // Only one nearby zone is ever active, which guarantees a single
      // "Press E" prompt on-screen even if two zones sit near each other.
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

  // Single-press E. `useKeyPress` already ignores OS key-repeat, so holding
  // E cannot fire this handler more than once per physical press. The
  // handler is unregistered whenever interactionEnabled flips to false, so
  // an E-press meant for the dialogue box can't leak through to the scene.
  useKeyPress(
    'e',
    () => {
      if (nearbyRef.current) onInteract(nearbyRef.current);
    },
    interactionEnabled,
  );

  const nearbyZone = allZones.find((z) => z.id === nearby);

  return (
    <div className="bg-scene">
      <img className="bg-scene__image" src={backgroundSrc} alt="" draggable={false} />

      {/* NPCs — drawn between the background and the player so the player
          appears in front when overlapping. Z-index nudged by y-coordinate
          so NPCs deeper in the scene sit behind ones closer to the viewer. */}
      {(npcs ?? []).map((npc) => (
        <div
          key={npc.id}
          className="bg-scene__npc"
          style={{
            left: `${npc.x}%`,
            top: `${npc.y}%`,
            fontSize: `${npc.size ?? 40}px`,
            zIndex: Math.round(npc.y * 10) / 10,
          }}
        >
          <span aria-hidden="true">{npc.emoji}</span>
        </div>
      ))}

      {!hidePlayer && (
        <div
          className="bg-scene__player"
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        >
          🧑‍🎓
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
