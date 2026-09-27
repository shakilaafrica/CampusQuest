import React, { useMemo } from 'react';

const COLORS = ['#f5c84c', '#8d4bd3', '#d7b8ff', '#8ef1c1', '#ff8bcf', '#ffffff'];

export default function Confetti({ pieces = 60 }: { pieces?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.2 + Math.random() * 1.6,
        rotation: Math.random() * 360,
        size: 6 + Math.random() * 8,
        color: COLORS[i % COLORS.length],
        drift: (Math.random() - 0.5) * 120,
      })),
    [pieces]
  );

  return (
    <div className="society-confetti" aria-hidden="true">
      {bits.map((b) => (
        <span
          key={b.id}
          className="society-confetti-bit"
          style={{
            left: `${b.left}%`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
            width: b.size,
            height: b.size * 0.5,
            background: b.color,
            transform: `rotate(${b.rotation}deg)`,
            // @ts-ignore custom property used by the animation keyframes
            '--drift': `${b.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
