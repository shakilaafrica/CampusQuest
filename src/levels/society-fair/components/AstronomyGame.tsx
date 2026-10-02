import React, { useState } from 'react';
import { CONSTELLATIONS } from '../societyData';

export default function AstronomyGame({ onComplete }: { onComplete: () => void }) {
  const [level, setLevel] = useState(0);
  const [progress, setProgress] = useState(0);
  const [wrongStar, setWrongStar] = useState<number | null>(null);
  const [showFact, setShowFact] = useState(false);

  const constellation = CONSTELLATIONS[level];
  const finished = progress >= constellation.stars.length;

  const clickStar = (i: number) => {
    if (showFact) return;

    if (i === progress) {
      const next = progress + 1;
      setProgress(next);

      if (next >= constellation.stars.length) {
        setShowFact(true);
      }
    } else {
      setWrongStar(i);
      setTimeout(() => setWrongStar(null), 420);
    }
  };

  const nextConstellation = () => {
    if (level + 1 >= CONSTELLATIONS.length) {
      onComplete();
      return;
    }

    setLevel((l) => l + 1);
    setProgress(0);
    setShowFact(false);
  };

  return (
    <div className="phoneGame astronomy-game">
      <p className="phoneFact">Tap the stars in order to connect the constellation.</p>
      <div className={`starGame ${finished ? 'is-complete' : ''}`}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* faint dotted guide of the whole shape */}
          {constellation.stars.slice(0, -1).map((p, i) => (
            <line
              key={`guide-${i}`}
              x1={p.x}
              y1={p.y}
              x2={constellation.stars[i + 1].x}
              y2={constellation.stars[i + 1].y}
              className="guideLine"
            />
          ))}

          {/* solid glowing connections for stars already linked */}
          {constellation.stars.slice(0, Math.max(0, progress - 1)).map((p, i) => (
            <line
              key={`link-${i}`}
              x1={p.x}
              y1={p.y}
              x2={constellation.stars[i + 1].x}
              y2={constellation.stars[i + 1].y}
              className={finished ? 'litLine gold' : 'litLine'}
            />
          ))}
        </svg>

        {constellation.stars.map((p, i) => (
          <button
            key={i}
            className={
              'star' +
              (i < progress ? ' is-lit' : '') +
              (finished ? ' is-gold' : '') +
              (wrongStar === i ? ' is-wrong' : '')
            }
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            onClick={() => clickStar(i)}
          >
            {i < progress ? '★' : '☆'}
          </button>
        ))}
      </div>

      {showFact && (
        <button className="phoneAction" onClick={nextConstellation}>
          {level + 1 >= CONSTELLATIONS.length ? 'FINISH' : 'CONTINUE'}
        </button>
      )}
    </div>
  );
}
