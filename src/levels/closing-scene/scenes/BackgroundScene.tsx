/**
 * GenAI DECLARATION: This file was partially generated with the assistance of
 * GenAI (ChatGPT). AI-generated code was reviewed, modified, integrated, and
 * tested by the team.
 */


import { useEffect, useMemo, useRef, useState } from 'react';
import { useKeyPress, useKeysRef } from '../hooks/useKeyboard';
import { InteractionPrompt } from '../components/InteractionPrompt';
import './BackgroundScene.css';


export interface InteractionZone {
  id: string;
  x: number;
  y: number;
  radius: number;
  label: string;
}


export interface SceneNpc {
  id: string;
  x: number;
  y: number;
  spriteUrl?: string;
  emoji?: string;
  heightPct?: number;
  emojiSize?: number;
  interactionLabel?: string;
  interactionRadius?: number;
  flip?: boolean;
  decorationClass?: string;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface Props {
  backgroundSrc: string;
  playerSprites: { up: string; down: string; left: string; right: string };
  spawn: { x: number; y: number };
  bounds?: Bounds;
  zones?: InteractionZone[];
  npcs?: SceneNpc[];

  interactionEnabled: boolean;
  onInteract: (id: string) => void;
  hidePlayer?: boolean;

  playerLockPos?: { x: number; y: number };
 
  playerLockFacing?: 'up' | 'down' | 'left' | 'right';
  playerClass?: string;
  children?: React.ReactNode;
  overlay?: React.ReactNode;
}

const PLAYER_HEIGHT_PCT = 18;

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
  playerLockPos,
  playerLockFacing,
  playerClass,
  children,
  overlay,
}: Props) {
  const keysRef = useKeysRef();
  const posRef = useRef(spawn);
  const facingRef = useRef<Facing>('up');
  const [pos, setPos] = useState(spawn);
  const [facing, setFacing] = useState<Facing>('up');

  const nearbyRef = useRef<string | null>(null);
  const [nearby, setNearby] = useState<string | null>(null);

 
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

  useEffect(() => {
    posRef.current = spawn;
    setPos(spawn);
    facingRef.current = 'up';
    setFacing('up');
    nearbyRef.current = null;
    setNearby(null);
  }, [spawn.x, spawn.y]); 

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

   
      if (interactionEnabled && !playerLockPos) {
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


      const checkPos = playerLockPos ?? posRef.current;
      let closest: string | null = null;
      let closestDist = Infinity;
      for (const zone of allZones) {
        const d = Math.hypot(zone.x - checkPos.x, zone.y - checkPos.y);
        if (d < zone.radius && d < closestDist) {
          closest = zone.id;
          closestDist = d;
        }
      }
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
  }, [bounds.minX, bounds.maxX, bounds.minY, bounds.maxY, allZones, interactionEnabled, playerLockPos]);

  useKeyPress(
    'e',
    () => {
      if (nearbyRef.current) onInteract(nearbyRef.current);
    },
    interactionEnabled,
  );

  const nearbyZone = allZones.find((z) => z.id === nearby);
  const activeFacing = playerLockFacing ?? facing;
  const activePos = playerLockPos ?? pos;
  const playerSprite = playerSprites[activeFacing];

  return (
    <div className="bg-scene">
      <img className="bg-scene__image" src={backgroundSrc} alt="" draggable={false} />

      {children}

      {/* NPCs — drawn between the background and the player. Z-index nudged
          by y-coordinate so NPCs deeper in the scene sit behind ones closer
          to the viewer. */}
      {(npcs ?? []).map((npc) => (
        <div
          key={npc.id}
          className={`bg-scene__npc${npc.decorationClass ? ' ' + npc.decorationClass : ''}`}
          style={{
            left: `${npc.x}%`,
            top: `${npc.y}%`,
            height: npc.spriteUrl ? `${npc.heightPct ?? PLAYER_HEIGHT_PCT}%` : undefined,
            zIndex: Math.round(npc.y * 10) / 10,
          }}
        >
          {npc.spriteUrl ? (
            <img
              src={npc.spriteUrl}
              alt=""
              draggable={false}
              style={npc.flip ? { transform: 'scaleX(-1)' } : undefined}
            />
          ) : (
            <span
              className="bg-scene__npc-emoji"
              style={{ fontSize: `${npc.emojiSize ?? 56}px` }}
              aria-hidden="true"
            >
              {npc.emoji}
            </span>
          )}
        </div>
      ))}

      {!hidePlayer && (
        <div
          className={`bg-scene__player${playerClass ? ' ' + playerClass : ''}`}
          style={{
            left: `${activePos.x}%`,
            top: `${activePos.y}%`,
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

      {overlay}
    </div>
  );
}
