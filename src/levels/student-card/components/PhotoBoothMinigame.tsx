import { useEffect, useRef, useState } from 'react';
import { useKeysRef } from '../hooks/useKeyboard';
import type { FaceExpression } from '../types/game';
import './PhotoBoothMinigame.css';

// --- tunable constants -------------------------------------------------
const TRACK_MIN = 0;
const TRACK_MAX = 100;
const BAR_HALF_HEIGHT = 9; // bar spans [pos-9, pos+9] on a 0-100 track
const TARGET_HALF_HEIGHT = 7;
const GRAVITY = 95; // %/s^2 pulling the bar down
const THRUST = 230; // %/s^2 pushing the bar up while space is held
const MAX_SPEED = 70; // %/s clamp, up or down
const WIN_CONTACT_SECONDS = 10; // total time-in-contact needed to win
const MAX_MISS_SECONDS = 2; // longest allowed unbroken miss before failing
// -------------------------------------------------------------------

interface Props {
  onWin: () => void;
  onLose: () => void;
}

interface RenderState {
  barPos: number;
  targetPos: number;
  contactTime: number;
  expression: FaceExpression;
  status: 'playing' | 'won' | 'lost';
}

export function PhotoBoothMinigame({ onWin, onLose }: Props) {
  const keysRef = useKeysRef();

  // Physics lives in refs so the 60fps loop doesn't fight React's scheduler;
  // we push one consolidated state update to the UI per frame.
  const barPosRef = useRef(50);
  const barVelRef = useRef(0);
  const contactTimeRef = useRef(0);
  const missTimeRef = useRef(0);
  const elapsedRef = useRef(0);
  const statusRef = useRef<RenderState['status']>('playing');

  const [render, setRender] = useState<RenderState>({
    barPos: 50,
    targetPos: 50,
    contactTime: 0,
    expression: 'neutral',
    status: 'playing',
  });

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (statusRef.current === 'playing') {
        // 1. bar physics: gravity down, thrust up while space is held
        const holding = keysRef.current.has(' ') || keysRef.current.has('spacebar');
        barVelRef.current += (holding ? THRUST : -GRAVITY) * dt;
        barVelRef.current = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, barVelRef.current));

        let nextBar = barPosRef.current + barVelRef.current * dt;
        if (nextBar <= TRACK_MIN) {
          nextBar = TRACK_MIN;
          barVelRef.current = 0;
        }
        if (nextBar >= TRACK_MAX) {
          nextBar = TRACK_MAX;
          barVelRef.current = 0;
        }
        barPosRef.current = nextBar;

        // 2. moving target — smooth wandering path
        elapsedRef.current += dt;
        const t = elapsedRef.current;
        const wander = 50 + 28 * Math.sin(t * 0.55) + 14 * Math.sin(t * 1.6 + 1.3);
        const nextTarget = Math.max(TARGET_HALF_HEIGHT, Math.min(TRACK_MAX - TARGET_HALF_HEIGHT, wander));

        // 3. contact check
        const barTop = nextBar + BAR_HALF_HEIGHT;
        const barBottom = nextBar - BAR_HALF_HEIGHT;
        const targetTop = nextTarget + TARGET_HALF_HEIGHT;
        const targetBottom = nextTarget - TARGET_HALF_HEIGHT;
        const inContact = barTop >= targetBottom && barBottom <= targetTop;

        let expression: FaceExpression;
        if (inContact) {
          expression = 'happy';
          missTimeRef.current = 0;
          contactTimeRef.current += dt;
          if (contactTimeRef.current >= WIN_CONTACT_SECONDS) {
            statusRef.current = 'won';
          }
        } else {
          expression = 'funny';
          missTimeRef.current += dt;
          if (missTimeRef.current >= MAX_MISS_SECONDS) {
            statusRef.current = 'lost';
          }
        }

        setRender({
          barPos: nextBar,
          targetPos: nextTarget,
          contactTime: contactTimeRef.current,
          expression,
          status: statusRef.current,
        });
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fire the win/lose callback once, after a short beat so the result reads
  useEffect(() => {
    if (render.status === 'won') {
      const t = setTimeout(onWin, 700);
      return () => clearTimeout(t);
    }
    if (render.status === 'lost') {
      const t = setTimeout(onLose, 700);
      return () => clearTimeout(t);
    }
  }, [render.status, onWin, onLose]);

  const faceExpression: FaceExpression =
    render.status === 'lost' ? 'funny' : render.status === 'won' ? 'happy' : render.expression;

  return (
    <div className="photobooth">
      <div className="photobooth__screen">
        <div className="photobooth__backdrop" />
        <FaceAvatar expression={faceExpression} />
        <div className="photobooth__flash" data-active={render.status === 'won'} />
      </div>

      <div className="photobooth__hud">
        <div className="photobooth__progress-label">Hold still for the camera…</div>
        <div className="photobooth__progress-track">
          <div
            className="photobooth__progress-fill"
            style={{ width: `${Math.min(100, (render.contactTime / WIN_CONTACT_SECONDS) * 100)}%` }}
          />
        </div>

        <div className="photobooth__track">
          <div
            className="photobooth__target"
            style={{ bottom: `${render.targetPos - TARGET_HALF_HEIGHT}%`, height: `${TARGET_HALF_HEIGHT * 2}%` }}
          />
          <div
            className="photobooth__bar"
            style={{ bottom: `${render.barPos - BAR_HALF_HEIGHT}%`, height: `${BAR_HALF_HEIGHT * 2}%` }}
          />
        </div>

        <div className="photobooth__instructions">Hold SPACE to rise · release to fall</div>
      </div>

      {render.status !== 'playing' && (
        <div className={`photobooth__result photobooth__result--${render.status}`}>
          {render.status === 'won' ? '📸 Got it!' : '💥 Blurry shot…'}
        </div>
      )}
    </div>
  );
}

function FaceAvatar({ expression }: { expression: FaceExpression }) {
  return (
    <svg
      className="face-avatar"
      viewBox="0 0 200 200"
      role="img"
      aria-label={`Avatar pulling a ${expression} expression`}
    >
      <circle cx="100" cy="100" r="86" className="face-avatar__head" />

      {expression === 'happy' && (
        <>
          <circle cx="70" cy="88" r="8" className="face-avatar__eye" />
          <circle cx="130" cy="88" r="8" className="face-avatar__eye" />
          <path d="M62 122 Q100 158 138 122" className="face-avatar__mouth" />
        </>
      )}

      {expression === 'funny' && (
        <>
          <path d="M58 80 L82 94 M82 80 L58 94" className="face-avatar__eye-x" />
          <path d="M118 80 L142 94 M142 80 L118 94" className="face-avatar__eye-x" />
          <path d="M64 130 Q100 108 136 130 Q100 150 64 130" className="face-avatar__mouth-funny" />
        </>
      )}

      {expression === 'neutral' && (
        <>
          <circle cx="70" cy="88" r="7" className="face-avatar__eye" />
          <circle cx="130" cy="88" r="7" className="face-avatar__eye" />
          <line x1="70" y1="130" x2="130" y2="130" className="face-avatar__mouth-neutral" />
        </>
      )}
    </svg>
  );
}
