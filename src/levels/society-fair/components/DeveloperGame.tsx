import React, { useEffect, useRef, useState } from 'react';

const WIN_SCORE = 100;
const GRAVITY = 22;
const JUMP_VELOCITY = 7.6;
const OBSTACLE_SPEED = 42;
const SCORE_SPEED = 18;

export default function DeveloperGame({ onComplete }: { onComplete: () => void }) {
  const [state, setState] = useState({
    y: 0,
    vy: 0,
    score: 0,
    obstacle: 100,
    over: false,
    won: false,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const jump = () => {
    const s = stateRef.current;
    if (s.over || s.y > 0.01) return;
    setState((prev) => ({ ...prev, vy: JUMP_VELOCITY }));
  };

  const retry = () =>
    setState({ y: 0, vy: 0, score: 0, obstacle: 100, over: false, won: false });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'e' || e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };

    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    let id = 0;
    let last = performance.now();

    const loop = (t: number) => {
      const dt = Math.min(0.035, (t - last) / 1000);
      last = t;

      setState((s) => {
        if (s.over) return s;

        let vy = s.vy - GRAVITY * dt;
        let y = Math.max(0, s.y + vy);
        if (y === 0 && vy < 0) vy = 0;

        let obstacle = s.obstacle - OBSTACLE_SPEED * dt;
        if (obstacle < -10) obstacle = 105;

        const score = Math.min(WIN_SCORE, s.score + dt * SCORE_SPEED);
        const hit = obstacle > 12 && obstacle < 27 && y < 1.15;

        if (hit) {
          return { ...s, y, vy, score, obstacle, over: true, won: false };
        }

        if (score >= WIN_SCORE) {
          return { y, vy, score: WIN_SCORE, obstacle, over: true, won: true };
        }

        return { y, vy, score, obstacle, over: false, won: false };
      });

      id = requestAnimationFrame(loop);
    };

    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (state.won) {
      const t = setTimeout(onComplete, 500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.won]);

  return (
    <>
      <div className="phoneTop">DEV SOC // RETRO RUNNER</div>
      <p className="phoneHint">[E] / Space to jump · reach 100</p>

      <div className="runner">
        <div className="score">{Math.floor(state.score).toString().padStart(3, '0')}</div>
        <div className="bot" style={{ bottom: 14 + state.y * 11 }}>
          ▣
        </div>
        <div className="obstacle" style={{ left: `${state.obstacle}%` }}>
          ▥
        </div>
        <div className="ground" />
      </div>

      {state.over && !state.won && (
        <button className="phoneAction" onClick={retry}>
          RETRY
        </button>
      )}

      {state.won && <p className="phoneFact">BUILD SUCCESSFUL ✓</p>}
    </>
  );
}
