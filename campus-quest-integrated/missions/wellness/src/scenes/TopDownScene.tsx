import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useKeyPress, useKeysRef } from '../hooks/useKeyboard';
import { InteractionPrompt } from '../components/InteractionPrompt';
import './TopDownScene.css';

export interface ScenePoi {
  id: string;
  x: number; // percent of scene width
  y: number; // percent of scene height
  label: string;
  emoji: string;
}

export type SceneVariant = 'outdoor' | 'gate' | 'clinic';

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface Props {
  pois: ScenePoi[];
  onInteract: (id: string) => void;
  interactionEnabled: boolean;
  highlight?: string | null;
  signLabel: string;
  variant?: SceneVariant;
  spawn?: { x: number; y: number };
  bounds?: Bounds;
  /** Extra decorative elements rendered above the floor, below the player (e.g. a gate graphic). */
  decorations?: ReactNode;
}

const DEFAULT_BOUNDS: Bounds = { minX: 6, maxX: 94, minY: 14, maxY: 90 };
const INTERACT_RADIUS = 11;
const SPEED = 34;

export function TopDownScene({
  pois,
  onInteract,
  interactionEnabled,
  highlight,
  signLabel,
  variant = 'outdoor',
  spawn = { x: 10, y: 50 },
  bounds = DEFAULT_BOUNDS,
  decorations,
}: Props) {
  const keysRef = useKeysRef();
  const posRef = useRef(spawn);
  const [pos, setPos] = useState(spawn);
  const nearbyRef = useRef<string | null>(null);
  const [nearby, setNearby] = useState<string | null>(null);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

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
        const ny = posRef.current.y + (dy / len) * SPEED * dt * 1.3;
        const next = {
          x: Math.max(bounds.minX, Math.min(bounds.maxX, nx)),
          y: Math.max(bounds.minY, Math.min(bounds.maxY, ny)),
        };
        posRef.current = next;
        setPos(next);
      }

      let closest: string | null = null;
      let closestDist = Infinity;
      for (const poi of pois) {
        const d = Math.hypot(poi.x - posRef.current.x, poi.y - posRef.current.y);
        if (d < INTERACT_RADIUS && d < closestDist) {
          closest = poi.id;
          closestDist = d;
        }
      }
      if (closest !== nearbyRef.current) {
        nearbyRef.current = closest;
        setNearby(closest);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds, pois, spawn]);

  useKeyPress(
    'e',
    () => {
      if (nearbyRef.current) onInteract(nearbyRef.current);
    },
    interactionEnabled,
  );

  const nearbyPoi = pois.find((p) => p.id === nearby);

  return (
    <div className={`tds tds--${variant}`}>
      <div className="tds__floor" />
      <div className="tds__sign">{signLabel}</div>
      {decorations}

      {pois.map((poi) => (
        <div
          key={poi.id}
          className={`tds__poi${highlight === poi.id ? ' tds__poi--highlight' : ''}`}
          style={{ left: `${poi.x}%`, top: `${poi.y}%` }}
        >
          <span className="tds__poi-emoji">{poi.emoji}</span>
        </div>
      ))}

      <div className="tds__player" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
        🧑‍🎓
      </div>

      {nearbyPoi && interactionEnabled && (
        <InteractionPrompt left={`${nearbyPoi.x}%`} top={`${nearbyPoi.y - 9}%`} label={nearbyPoi.label} />
      )}
    </div>
  );
}
