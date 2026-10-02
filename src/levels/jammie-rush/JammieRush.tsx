/**
 * GenAI DECLARATION
 * ---------------------------------------------------------------------
 * Tool: [ChatGPT (OpenAI)]
 * Extent: Approximately 99% of this file was rewritten by
 *         GenAI. The original structure was created by the team, but
 *         the code went through repeated rounds of error fixing and
 *         debugging with the AI, and the AI's corrected versions
 *         replaced most of the original code.
 * Human work: The team described the required behaviour, supplied the
 *         error messages, pasted the AI's fixes into the project,
 *         connected the file to the Supabase schema and the rest of
 *         the app, and tested the result.
 * ---------------------------------------------------------------------
 */

import React from 'react';

import './style.css';
import './campus-theme.css';

import { usePlayer } from '../../context/PlayerContext';
import { avatarById } from '../../lib/avatars';

import bg from './assets/jammie-rush-v2.jpg';
import cyclistSprite from './assets/cyclist-uct.png';
import carRed from './assets/car-red.png';
import carYellow from './assets/car-yellow.png';

import npc01 from './assets/npc-01.png';
import npc02 from './assets/npc-02.png';
import npc03 from './assets/npc-03.png';
import npc04 from './assets/npc-04.png';
import npc05 from './assets/npc-05.png';
import npc06 from './assets/npc-06.png';
import npc07 from './assets/npc-07.png';
import npc08 from './assets/npc-08.png';
import npc09 from './assets/npc-09.png';
import npc10 from './assets/npc-10.png';
import npc11 from './assets/npc-11.png';
import npc12 from './assets/npc-12.png';
import npc13 from './assets/npc-13.png';
import npc14 from './assets/npc-14.png';
import npc15 from './assets/npc-15.png';
import npc16 from './assets/npc-16.png';

type Point = {
  x: number;
  y: number;
};

type HazardKind =
  | 'student'
  | 'group'
  | 'phone'
  | 'runner'
  | 'cyclist'
  | 'car';

type Hazard = Point & {
  id: number;
  kind: HazardKind;
  dir: 1 | -1;
  speed: number;
  lane: number;
  variant: number;
  phase: number;
  carType?: 0 | 1;
};

const WORLD = { w: 1365, h: 768 };
const TILE = 38;
const START = { x: 682, y: 722 };
const ZOOM = 1.58;

const PERSON_H = 78;
const PERSON_W = 34;

const ROAD = {
  top: 466,
  bottom: 539,
  laneA: 486,
  laneB: 521,
};

const npcs = [
  npc01,
  npc02,
  npc03,
  npc04,
  npc05,
  npc06,
  npc07,
  npc08,
  npc09,
  npc10,
  npc11,
  npc12,
  npc13,
  npc14,
  npc15,
  npc16,
];

const clamp = (v: number, a: number, b: number) =>
  Math.max(a, Math.min(b, v));

const lanes = [650, 615, 575, 448, 412, 375, 338, 305];

function makeHazards(): Hazard[] {
  let id = 0;
  const out: Hazard[] = [];

  lanes.forEach((y, l) => {
    const count = l < 3 ? 5 : 6;

    for (let i = 0; i < count; i++) {
      out.push({
        id: id++,
        kind:
          l === 1 && i === 2
            ? 'phone'
            : l === 5 && i === 1
              ? 'runner'
              : 'student',
        x: 70 + (i * (WORLD.w - 140)) / count + (l % 2) * 55,
        y: y + (i % 2 ? 5 : -5),
        dir: (l % 2 ? 1 : -1) as 1 | -1,
        speed: (l === 5 ? 2.25 : 1.0 + l * 0.09) + (i % 3) * 0.12,
        lane: l,
        variant: (i + l * 3) % npcs.length,
        phase: i * 0.8,
      });
    }
  });

  out.push(
    {
      id: id++,
      kind: 'car',
      x: -150,
      y: ROAD.laneA,
      dir: 1,
      speed: 4.5,
      lane: 18,
      variant: 0,
      phase: 0,
      carType: 0,
    },
    {
      id: id++,
      kind: 'car',
      x: 540,
      y: ROAD.laneA,
      dir: 1,
      speed: 4.15,
      lane: 18,
      variant: 0,
      phase: 2,
      carType: 1,
    },
    {
      id: id++,
      kind: 'car',
      x: WORLD.w + 170,
      y: ROAD.laneB,
      dir: -1,
      speed: 4.9,
      lane: 19,
      variant: 0,
      phase: 1,
      carType: 1,
    },
    {
      id: id++,
      kind: 'car',
      x: 800,
      y: ROAD.laneB,
      dir: -1,
      speed: 4.35,
      lane: 19,
      variant: 0,
      phase: 3,
      carType: 0,
    },
    {
      id: id++,
      kind: 'cyclist',
      x: -100,
      y: 477,
      dir: 1,
      speed: 3.7,
      lane: 20,
      variant: 2,
      phase: 0,
    },
    {
      id: id++,
      kind: 'cyclist',
      x: WORLD.w + 120,
      y: 529,
      dir: -1,
      speed: 4.0,
      lane: 21,
      variant: 5,
      phase: 2,
    },
    {
      id: id++,
      kind: 'group',
      x: 150,
      y: 365,
      dir: 1,
      speed: 0.95,
      lane: 30,
      variant: 3,
      phase: 0,
    },
    {
      id: id++,
      kind: 'group',
      x: WORLD.w - 150,
      y: 325,
      dir: -1,
      speed: 1.05,
      lane: 31,
      variant: 6,
      phase: 1,
    },
  );

  return out;
}

function Student({
  variant,
  dir,
}: {
  variant: number;
  dir: 1 | -1;
}) {
  const height = PERSON_H * (0.96 + (variant % 5) * 0.02);

  return (
    <img
      className="npcSprite"
      src={npcs[variant % npcs.length]}
      style={{
        height,
        transform: `scaleX(${dir})`,
      }}
    />
  );
}

function Bicycle({
  dir,
}: {
  variant: number;
  dir: 1 | -1;
}) {
  return (
    <img
      className="cycleSprite"
      src={cyclistSprite}
      style={{
        transform: `scaleX(${dir})`,
      }}
    />
  );
}

function Car({
  type,
  dir,
}: {
  type: 0 | 1;
  dir: 1 | -1;
}) {
  return (
    <img
      className="carSprite"
      src={type === 0 ? carRed : carYellow}
      style={{
        transform: `scaleX(${dir})`,
      }}
    />
  );
}

function collides(p: Point, h: Hazard) {
  const px = p.x;
  const py = p.y;

  if (h.kind === 'car') {
    return Math.abs(px - h.x) < 57 && Math.abs(py - h.y) < 19;
  }

  if (h.kind === 'cyclist') {
    return Math.abs(px - h.x) < 38 && Math.abs(py - h.y) < 18;
  }

  if (h.kind === 'group') {
    return Math.abs(px - h.x) < 58 && Math.abs(py - h.y) < 15;
  }

  return Math.abs(px - h.x) < 18 && Math.abs(py - h.y) < 14;
}

export default function JammieRush({
  onComplete,
  onExit,
}: {
  onComplete: () => void;
  onExit: () => void;
}) {
  const { profile } = usePlayer();

  const playerAvatar = avatarById(profile?.selected_avatar);
  const activePlayerSprite = playerAvatar.sprites.down;

  const [player, setPlayer] = React.useState<Point>(START);
  const playerRef = React.useRef(START);

  const [hazards, setHazards] = React.useState(makeHazards);
  const hazardsRef = React.useRef(hazards);

  const [state, setState] = React.useState<
    'intro' | 'play' | 'hit' | 'win' | 'lose'
  >('intro');

  const [time, setTime] = React.useState(55);
  const [strikes, setStrikes] = React.useState(0);
  const [flash, setFlash] = React.useState('');

  const [hopping, setHopping] = React.useState(false);
  const moving = React.useRef(false);

  const [camera, setCamera] = React.useState({
    x: 0,
    y: 0,
  });

  const camRef = React.useRef({
    x: 0,
    y: 0,
  });

  const last = React.useRef(performance.now());
  const raf = React.useRef(0);

  const reset = React.useCallback(() => {
    playerRef.current = START;
    setPlayer(START);

    const h = makeHazards();

    hazardsRef.current = h;
    setHazards(h);

    setTime(55);
    setStrikes(0);
    setFlash('');
    setState('play');

    last.current = performance.now();
  }, []);

  const tryMove = React.useCallback(
    (dx: number, dy: number) => {
      if (state !== 'play' || moving.current) return;

      moving.current = true;

      const p = playerRef.current;

      const next = {
        x: clamp(p.x + dx * TILE, 40, WORLD.w - 40),
        y: clamp(p.y + dy * TILE, 245, WORLD.h - 25),
      };

      playerRef.current = next;
      setPlayer(next);
      setHopping(true);

      setTimeout(() => setHopping(false), 145);
      setTimeout(() => (moving.current = false), 120);
    },
    [state],
  );

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;

      const k = e.key.toLowerCase();

      let m: [number, number] | null = null;

      if (k === 'w' || k === 'arrowup') m = [0, -1];
      if (k === 's' || k === 'arrowdown') m = [0, 1];
      if (k === 'a' || k === 'arrowleft') m = [-1, 0];
      if (k === 'd' || k === 'arrowright') m = [1, 0];

      if (m) {
        e.preventDefault();
        tryMove(...m);
      }
    };

    addEventListener('keydown', down);

    return () => removeEventListener('keydown', down);
  }, [tryMove]);

  React.useEffect(() => {
    if (state !== 'play') return;

    const loop = (now: number) => {
      const dt = Math.min(2, (now - last.current) / 16.67);
      last.current = now;

      const hs = hazardsRef.current.map((o) => {
        const n = { ...o };

        const pause =
          o.kind === 'phone' &&
          Math.sin(now / 900 + o.phase) > 0.3;

        let sp = pause ? 0 : o.speed;

        if (o.kind === 'runner') {
          sp *= 1.45;
        }

        n.x += o.dir * sp * dt;

        const margin =
          o.kind === 'car'
            ? 220
            : o.kind === 'group'
              ? 150
              : o.kind === 'cyclist'
                ? 130
                : 65;

        if (o.dir === 1 && n.x > WORLD.w + margin) {
          n.x = -margin;
        }

        if (o.dir === -1 && n.x < -margin) {
          n.x = WORLD.w + margin;
        }

        return n;
      });

      hazardsRef.current = hs;
      setHazards(hs);

      const p = playerRef.current;
      const hit = hs.find((o) => collides(p, o));

      if (hit) {
        setState('hit');
        setStrikes((s) => s + 1);

        setFlash(
          hit.kind === 'car'
            ? 'CAR! Look both ways.'
            : hit.kind === 'cyclist'
              ? 'CYCLIST! Watch the lane.'
              : 'Oof! Back to the start.',
        );

        setTimeout(() => {
          playerRef.current = START;
          setPlayer(START);
          setState('play');
          setFlash('');
          last.current = performance.now();
        }, 650);

        return;
      }

      if (p.y < 270 && p.x > 570 && p.x < 805) {
        setState('win');
        return;
      }

      raf.current = requestAnimationFrame(loop);
    };

    raf.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(raf.current);
  }, [state]);

  React.useEffect(() => {
    if (state !== 'play') return;

    const t = setInterval(
      () =>
        setTime((v) => {
          if (v <= 1) {
            setState('lose');
            return 0;
          }

          return v - 1;
        }),
      1000,
    );

    return () => clearInterval(t);
  }, [state]);

  React.useEffect(() => {
    let id = 0;

    const follow = () => {
      const vw = window.innerWidth / ZOOM;
      const vh = window.innerHeight / ZOOM;

      const targetX = clamp(
        player.x - vw * 0.5,
        0,
        Math.max(0, WORLD.w - vw),
      );

      const targetY = clamp(
        player.y - vh * 0.57,
        0,
        Math.max(0, WORLD.h - vh),
      );

      const c = camRef.current;

      const n = {
        x: c.x + (targetX - c.x) * 0.10,
        y: c.y + (targetY - c.y) * 0.10,
      };

      camRef.current = n;
      setCamera(n);

      id = requestAnimationFrame(follow);
    };

    id = requestAnimationFrame(follow);

    return () => cancelAnimationFrame(id);
  }, [player]);

  const progress = Math.max(
    0,
    Math.min(
      100,
      ((START.y - player.y) / (START.y - 260)) * 100,
    ),
  );

  return (
    <main>
      <div className="game">
        <div
          className="world"
          style={{
            width: WORLD.w,
            height: WORLD.h,
            backgroundImage: `url(${bg})`,
            transform: `translate(${-camera.x * ZOOM}px,${
              -camera.y * ZOOM
            }px) scale(${ZOOM})`,
          }}
        >
          {hazards.map((hazard) =>
            hazard.kind === 'car' ? (
              <div
                key={hazard.id}
                className="hazard carHaz"
                style={{
                  left: hazard.x,
                  top: hazard.y,
                }}
              >
                <Car
                  type={hazard.carType ?? 0}
                  dir={hazard.dir}
                />
              </div>
            ) : hazard.kind === 'cyclist' ? (
              <div
                key={hazard.id}
                className="hazard cycleHaz"
                style={{
                  left: hazard.x,
                  top: hazard.y,
                }}
              >
                <Bicycle
                  variant={hazard.variant}
                  dir={hazard.dir}
                />
              </div>
            ) : hazard.kind === 'group' ? (
              <div
                key={hazard.id}
                className="hazard groupHaz"
                style={{
                  left: hazard.x,
                  top: hazard.y,
                }}
              >
                <Student
                  variant={hazard.variant}
                  dir={hazard.dir}
                />

                <Student
                  variant={hazard.variant + 2}
                  dir={hazard.dir}
                />

                <Student
                  variant={hazard.variant + 4}
                  dir={hazard.dir}
                />
              </div>
            ) : (
              <div
                key={hazard.id}
                className="hazard studentHaz"
                style={{
                  left: hazard.x,
                  top: hazard.y,
                }}
              >
                <Student
                  variant={hazard.variant}
                  dir={hazard.dir}
                />
              </div>
            ),
          )}

          <div
            className={`playerSprite ${hopping ? 'hop' : ''}`}
            style={{
              left: player.x,
              top: player.y,
            }}
          >
            <img
              className={
                playerAvatar.id === 'npc9' ||
                playerAvatar.id === 'npc10'
                  ? 'playerAvatarWide'
                  : ''
              }
              src={activePlayerSprite}
              alt=""
            />

            <i className="playerShadow" />
            <span>YOU</span>
          </div>
        </div>

        <header className="hud">
          <div className="brand">
            <b>MISSION 1 — JAMMIE RUSH</b>
            <small>HIDDINGH CAMPUS</small>
          </div>

          <div className="progress">
            <span>BOARDING PROGRESS</span>

            <div>
              <i style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className={`timer ${time < 10 ? 'danger' : ''}`}>
            {time}s
          </div>
        </header>

        <div className="mission">
          <strong>GET TO THE JAMMIE</strong>
          <em>COLLISIONS: {strikes}</em>
        </div>

        {flash && <div className="flash">{flash}</div>}

        {state !== 'play' && state !== 'hit' && (
          <div className="overlay">
            <div className="card">
              {state === 'intro' && (
                <>
                  <h1>JAMMIE RUSH</h1>

                  <p>
                    You have a lecture at Hiddingh Campus. Make it to
                    the Jammie on time!
                  </p>

                  <button onClick={reset}>
                    START BOARDING
                  </button>
                </>
              )}

              {state === 'win' && (
                <>
                  <h1>MADE IT!</h1>
                  <h2>You made it to Hiddingh Campus.</h2>

                  <p>
                    <b>{strikes}</b> collisions · <b>{time}s</b> left
                  </p>

                  <button onClick={onComplete}>
                    MISSION COMPLETE
                  </button>

                  <button onClick={reset}>
                    PLAY AGAIN
                  </button>
                </>
              )}

              {state === 'lose' && (
                <>
                  <h1>🚪 DOORS CLOSED</h1>

                  <p>
                    The Jammie left while you were still crossing
                    campus.
                  </p>

                  <button onClick={reset}>
                    TRY NEXT JAMMIE
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <footer>
          <span>
            <kbd>WASD</kbd> / <kbd>↑↓←→</kbd> Hop
          </span>

          <button
            className="mapExit"
            onClick={onExit}
          >
            ← MAP
          </button>
        </footer>
      </div>
    </main>
  );
}