import React, { useEffect, useRef, useState } from 'react';

const GAME_LENGTH_S = 30;
// Physics are in px/second and px/second^2 (matched to the `y` value, which is
// applied directly as a pixel offset via `bottom: 18 + state.y` in the JSX).
// Previous values (GRAVITY 28, SPACE_JUMP_VELOCITY 7.4) mixed px/s units with
// a velocity far too small for that gravity: jumpHeight = v^2 / (2*g) only
// worked out to ~1px, so the jump was technically firing but invisible.
const GRAVITY = 900; // px/s^2
const SPACE_JUMP_VELOCITY = 390; // px/s -> jumpHeight = 390^2 / (2*900) ≈ 84px
const MAX_JUMP_HEIGHT = 104; // safe ceiling for state.y, leaves headroom inside the runner frame
const OBSTACLE_HEIGHT = 28;

const STARTING_OBSTACLE_X = 100;

type Phase = 'ready' | 'running' | 'won' | 'lost';

export default function DeveloperGame({ onComplete }: { onComplete: () => void }) {
  const [state, setState] = useState({
    phase: 'ready' as Phase,
    y: 0,
    vy: 0,
    jumpQueued: false,
    score: 0,
    obstacleX: STARTING_OBSTACLE_X,
    timeLeft: GAME_LENGTH_S,
    hiScore: 0,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const startGame = (jumpOnStart = false) => {
    setState((prev) => ({
      ...prev,
      phase: 'running',
      y: 0,
      vy: jumpOnStart ? SPACE_JUMP_VELOCITY : 0,
      jumpQueued: false,
      score: 0,
      obstacleX: STARTING_OBSTACLE_X,
      timeLeft: GAME_LENGTH_S,
      hiScore: prev.hiScore,
    }));
  };

  const jump = () => {
    const s = stateRef.current;
    if (s.phase !== 'running') return;
    if (s.y > 1) {
      setState((prev) => ({ ...prev, jumpQueued: true }));
      return;
    }

    setState((prev) => ({
      ...prev,
      vy: SPACE_JUMP_VELOCITY,
      jumpQueued: false,
    }));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ' && e.key !== 'Spacebar') return;
      e.preventDefault();

      if (stateRef.current.phase === 'ready') {
        startGame(true);
        return;
      }

      jump();
    };

    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (state.phase !== 'running') return;

    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const elapsed = (now - last) / 1000;
      const dt = Math.min(0.033, elapsed);
      last = now;

      setState((prev) => {
        if (prev.phase !== 'running') return prev;

        let nextVY = prev.vy - GRAVITY * dt;
        let nextQueued = prev.jumpQueued;
        let nextY = prev.y + nextVY * dt;
        let nextTimeLeft = Math.max(0, prev.timeLeft - elapsed);
        let nextObstacleX = prev.obstacleX - (34 + (1 - nextTimeLeft / GAME_LENGTH_S) * 16) * dt;

        // Clamp to the ground and to the safe ceiling so the character can
        // never dip below the ground or punch through the top of the runner frame.
        if (nextY <= 0 && nextVY <= 0) {
          nextY = 0;
          if (nextQueued) {
            nextVY = SPACE_JUMP_VELOCITY;
            nextQueued = false;
          }
        }
        nextY = Math.min(nextY, MAX_JUMP_HEIGHT);

        if (nextObstacleX < -12) {
          nextObstacleX = 110 + Math.random() * 18;
        }

        const nextScore = prev.score + dt * 16;
        const nextHi = Math.max(prev.hiScore, Math.floor(nextScore));

        const hit =
          nextObstacleX > 15 &&
          nextObstacleX < 28 &&
          nextY < OBSTACLE_HEIGHT + 2 &&
          nextVY <= 0 &&
          !prev.jumpQueued;

        if (hit) {
          return {
            ...prev,
            phase: 'lost',
            y: nextY,
            vy: 0,
            obstacleX: nextObstacleX,
            score: nextScore,
            timeLeft: nextTimeLeft,
            hiScore: nextHi,
          };
        }

        if (nextTimeLeft <= 0) {
          const finalScore = Math.max(nextScore, prev.score);
          return {
            ...prev,
            phase: 'won',
            y: nextY,
            vy: 0,
            obstacleX: nextObstacleX,
            score: finalScore,
            timeLeft: 0,
            hiScore: Math.max(prev.hiScore, Math.floor(finalScore)),
          };
        }

        return {
          ...prev,
          y: nextY,
          vy: nextVY,
          jumpQueued: nextQueued,
          obstacleX: nextObstacleX,
          score: nextScore,
          timeLeft: nextTimeLeft,
          hiScore: nextHi,
        };
      });

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [state.phase]);

  useEffect(() => {
    if (state.phase !== 'won') return;

    const timeout = window.setTimeout(() => onComplete(), 650);
    return () => window.clearTimeout(timeout);
  }, [state.phase, onComplete]);

  const timeText = `${Math.ceil(state.timeLeft)}`;
  const displayScore = Math.floor(state.score).toString().padStart(4, '0');
  const displayHi = Math.floor(state.hiScore).toString().padStart(4, '0');

  return (
    <div className="phoneGame developer-game">
      <div className="developer-game__hud">
        <div className="developer-game__stat">
          <span>SCORE</span>
          <strong>{displayScore}</strong>
        </div>
        <div className="developer-game__stat">
          <span>TIME</span>
          <strong>{timeText}s</strong>
        </div>
        <div className="developer-game__stat">
          <span>HI-SCORE</span>
          <strong>{displayHi}</strong>
        </div>
        <div className="developer-game__stat">
          <span>STAGE</span>
          <strong>{state.phase === 'running' ? '01' : state.phase === 'won' ? 'CLR' : state.phase === 'lost' ? 'CRASH' : 'READY'}</strong>
        </div>
      </div>

      <div className="runner" aria-live="polite">
        {state.phase !== 'ready' && (
          <>
            <div className="runner__bot" style={{ bottom: 18 + state.y }}>
              ▣
            </div>
            <div className="runner__obstacle" style={{ left: `${state.obstacleX}%` }}>
              ▥
            </div>
            <div className="runner__ground" />
          </>
        )}

        {state.phase === 'won' && (
          <div className="runner__overlay runner__overlay--win">
            <h2>SHIFT COMPLETE</h2>
            <p>BUILD PASSED</p>
          </div>
        )}

        {state.phase === 'lost' && (
          <div className="runner__overlay runner__overlay--lose">
            <h2>GAME OVER</h2>
            <p>SCORE {displayScore}</p>
          </div>
        )}
      </div>

      <div className="runner__controls">[SPACE] JUMP</div>

      {state.phase !== 'running' && state.phase !== 'ready' && (
        <button className="phoneAction" onClick={() => startGame()}>
          {state.phase === 'won' ? 'PLAY AGAIN' : 'RETRY'}
        </button>
      )}
    </div>
  );
}
