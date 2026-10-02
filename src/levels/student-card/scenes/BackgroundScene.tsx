/**
 * GenAI DECLARATION: GenAI (ChatGPT) was used to assist in generating and
 * refining the player movement, directional facing, interaction-zone detection,
 * and NPC interaction logic in this file. The AI-assisted code was reviewed,
 * integrated, and tested by the team.
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
  emoji: string;
  size?: number;
  interactionLabel?: string;
  interactionRadius?: number;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export type Facing = 'up' | 'down' | 'left' | 'right';

interface Props {
  backgroundSrc: string;
  playerSprites?: Record<Facing, string>;
  spawn: { x: number; y: number };
  bounds?: Bounds;
  zones?: InteractionZone[];
  npcs?: SceneNpc[];
  
  interactionEnabled: boolean;
  onInteract: (id: string) => void;
  hidePlayer?: boolean;
}


const SPEED = 34;
const Y_BOOST = 1.3;
const DEFAULT_INTERACT_RADIUS = 11;

const DEFAULT_BOUNDS: Bounds = { minX: 4, maxX: 96, minY: 20, maxY: 94 };

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
}: Props) {
  const keysRef = useKeysRef();
  const posRef = useRef(spawn);
  const [pos, setPos] = useState(spawn);
  const [facing, setFacing] = useState<Facing>('down');

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
    nearbyRef.current = null;
    setNearby(null);
  }, [spawn.x, spawn.y]); 

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;


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

          const nextFacing: Facing =
            Math.abs(dx) > Math.abs(dy)
              ? dx > 0
                ? 'right'
                : 'left'
              : dy > 0
                ? 'down'
                : 'up';
          setFacing(nextFacing);
        }
      }


      let closest: string | null = null;
      let closestDist = Infinity;
      for (const zone of allZones) {
        const d = Math.hypot(zone.x - posRef.current.x, zone.y - posRef.current.y);
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
  }, [bounds.minX, bounds.maxX, bounds.minY, bounds.maxY, allZones, interactionEnabled]);

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
          {playerSprites ? (
            <img
              src={playerSprites[facing]}
              alt="Player"
              draggable={false}
            />
          ) : (
            '🧑‍🎓'
          )}
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
