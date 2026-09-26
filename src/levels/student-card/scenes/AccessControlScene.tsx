import { useEffect, useRef, useState } from 'react';
import { useKeyPress, useKeysRef } from '../hooks/useKeyboard';
import { InteractionPrompt } from '../components/InteractionPrompt';
import './AccessControlScene.css';

export type PoiId = 'worker' | 'chair';

interface Poi {
  id: PoiId;
  x: number; // percent of room width
  y: number; // percent of room height
  label: string;
  emoji: string;
}

const POIS: Poi[] = [
  { id: 'worker', x: 80, y: 30, label: 'Talk to the worker', emoji: '🧑‍💼' },
  { id: 'chair', x: 20, y: 74, label: 'Sit for your photo', emoji: '💺' },
];

const INTERACT_RADIUS = 11; // percent
const SPEED = 34; // percent of room per second
const BOUNDS = { minX: 6, maxX: 94, minY: 14, maxY: 90 };

interface Props {
  onInteract: (id: PoiId) => void;
  interactionEnabled: boolean;
  highlight?: PoiId | null;
}

export function AccessControlScene({ onInteract, interactionEnabled, highlight }: Props) {
  const keysRef = useKeysRef();
  const posRef = useRef({ x: 10, y: 50 });
  const [pos, setPos] = useState(posRef.current);
  const nearbyRef = useRef<PoiId | null>(null);
  const [nearby, setNearby] = useState<PoiId | null>(null);

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
          x: Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, nx)),
          y: Math.max(BOUNDS.minY, Math.min(BOUNDS.maxY, ny)),
        };
        posRef.current = next;
        setPos(next);
      }

      let closest: PoiId | null = null;
      let closestDist = Infinity;
      for (const poi of POIS) {
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
  }, [keysRef]);

  useKeyPress(
    'e',
    () => {
      if (nearbyRef.current) onInteract(nearbyRef.current);
    },
    interactionEnabled,
  );

  const nearbyPoi = POIS.find((p) => p.id === nearby);

  return (
    <div className="acc-scene">
      <div className="acc-scene__floor" />
      <div className="acc-scene__sign">Access Control Office</div>
      <div className="acc-scene__desk" />

      {POIS.map((poi) => (
        <div
          key={poi.id}
          className={`acc-scene__poi${highlight === poi.id ? ' acc-scene__poi--highlight' : ''}`}
          style={{ left: `${poi.x}%`, top: `${poi.y}%` }}
        >
          <span className="acc-scene__poi-emoji">{poi.emoji}</span>
        </div>
      ))}

      <div className="acc-scene__player" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
        🧑‍🎓
      </div>

      {nearbyPoi && interactionEnabled && (
        <InteractionPrompt left={`${nearbyPoi.x}%`} top={`${nearbyPoi.y - 9}%`} label={nearbyPoi.label} />
      )}
    </div>
  );
}
