import React, { useEffect, useRef, useState } from 'react';
import './style.css';

/* =========================================================
   SOCIETY FAIR ASSETS
   Everything is now owned by this level module.
   ========================================================= */

import plazaDay from './assets/plaza-day.png';
import statsSociety from './assets/stats-society.png';
import mathSociety from './assets/math-society.png';
import phoneFrame from './assets/phone-frame.png';

// Player - NPC 6
import playerUp from './assets/npc6/up.png';
import playerDown from './assets/npc6/down.png';
import playerLeft from './assets/npc6/left.png';
import playerRight from './assets/npc6/right.png';

// Host - NPC 7
import hostUp from './assets/npc7/up.png';
import hostDown from './assets/npc7/down.png';
import hostLeft from './assets/npc7/left.png';
import hostRight from './assets/npc7/right.png';

// Student - NPC 8
import studentUp from './assets/npc8/up.png';
import studentDown from './assets/npc8/down.png';
import studentLeft from './assets/npc8/left.png';
import studentRight from './assets/npc8/right.png';

/* =========================================================
   TYPES
   ========================================================= */

type Pt = {
  x: number;
  y: number;
};

type Dir = 'up' | 'down' | 'left' | 'right';

type Scene = 'plaza' | 'stats' | 'math';

type Society =
  | 'stats'
  | 'math'
  | 'astronomy'
  | 'developers';

type PhoneMode =
  | 'astronomy'
  | 'developers'
  | 'peoplesoft';

/* =========================================================
   SPRITES
   ========================================================= */

const SPRITES = {
  player: {
    up: playerUp,
    down: playerDown,
    left: playerLeft,
    right: playerRight,
  },

  host: {
    up: hostUp,
    down: hostDown,
    left: hostLeft,
    right: hostRight,
  },

  student: {
    up: studentUp,
    down: studentDown,
    left: studentLeft,
    right: studentRight,
  },
};

/* =========================================================
   SCENES
   ========================================================= */

const SCENES = {
  plaza: {
    w: 1536,
    h: 1024,
    bg: plazaDay,
  },

  stats: {
    w: 1408,
    h: 768,
    bg: statsSociety,
  },

  math: {
    w: 1408,
    h: 768,
    bg: mathSociety,
  },
};

/* =========================================================
   PLAZA SOCIETIES
   ========================================================= */

const PLAZA: {
  id: Society;
  name: string;
  p: Pt;
  door?: Pt;
}[] = [
  {
    id: 'astronomy',
    name: 'Astronomy Society',
    p: { x: 310, y: 700 },
  },

  {
    id: 'stats',
    name: 'Stats Society',
    p: { x: 500, y: 555 },
    door: { x: 480, y: 365 },
  },

  {
    id: 'math',
    name: 'Mathematics Society',
    p: { x: 1175, y: 615 },
    door: { x: 1195, y: 455 },
  },

  {
    id: 'developers',
    name: 'Developers Society',
    p: { x: 1285, y: 760 },
  },
];

/* =========================================================
   HELPERS
   ========================================================= */

const dist = (a: Pt, b: Pt) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const sleep = (n: number) =>
  new Promise((resolve) => setTimeout(resolve, n));

function face(a: Pt, b: Pt): Dir {
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  }

  return dy > 0 ? 'down' : 'up';
}

/* =========================================================
   SPRITE COMPONENT
   ========================================================= */

function Sprite({
  kind = 'student',
  dir,
  x,
  y,
  size = 92,
  label,
}: {
  kind?: keyof typeof SPRITES;
  dir: Dir;
  x: number;
  y: number;
  size?: number;
  label?: string;
}) {
  return (
    <div
      className="sprite"
      style={{
        left: x,
        top: y,
        zIndex: Math.floor(y),
      }}
    >
      <img
        src={SPRITES[kind][dir]}
        style={{ height: size }}
        alt=""
      />

      {label && <label>{label}</label>}
    </div>
  );
}

/* =========================================================
   STATS SOCIETY - BOARD GAME
   ========================================================= */

const snakeSpecial: Record<
  number,
  {
    kind: 'ladder' | 'snake' | 'quiz';
    to?: number;
  }
> = {
  3: { kind: 'ladder', to: 11 },
  8: { kind: 'quiz' },
  12: { kind: 'snake', to: 5 },
  15: { kind: 'quiz' },
  18: { kind: 'ladder', to: 23 },
  21: { kind: 'quiz' },
  24: { kind: 'snake', to: 16 },
};

const probs = [
  {
    q: 'A fair die is rolled. P(even)?',
    a: ['1/6', '1/3', '1/2', '2/3'],
    c: 2,
  },

  {
    q: 'A coin is flipped. P(heads)?',
    a: ['1/4', '1/2', '3/4', '1'],
    c: 1,
  },

  {
    q: 'Bag: 3 red, 2 blue. P(red)?',
    a: ['2/5', '3/5', '1/2', '3/2'],
    c: 1,
  },
];

function boardCenters() {
  const out: Pt[] = [];

  const x = 487;
  const y = 267;
  const w = 445;
  const h = 327;

  for (let n = 1; n <= 25; n++) {
    const r = Math.floor((n - 1) / 5);
    const i = (n - 1) % 5;
    const c = r % 2 ? 4 - i : i;

    out[n] = {
      x: x + (c + 0.5) * w / 5,
      y: y + (4 - r + 0.5) * h / 5,
    };
  }

  return out;
}

const BC = boardCenters();

function StatsBoard() {
  return (
    <svg
      className="statsBoard"
      viewBox="0 0 1408 768"
    >
      <g>
        {Array.from({ length: 25 }, (_, i) => i + 1).map(
          (n) => (
            <g key={n}>
              <rect
                x={BC[n].x - 42}
                y={BC[n].y - 29}
                width="84"
                height="58"
              />

              <text
                x={BC[n].x}
                y={BC[n].y + 7}
              >
                {n}
              </text>

              {snakeSpecial[n]?.kind === 'quiz' && (
                <text
                  className="q"
                  x={BC[n].x + 25}
                  y={BC[n].y - 10}
                >
                  ?
                </text>
              )}
            </g>
          )
        )}
      </g>

      <g className="ladder">
        <line
          x1={BC[3].x}
          y1={BC[3].y}
          x2={BC[11].x}
          y2={BC[11].y}
        />

        <line
          x1={BC[18].x}
          y1={BC[18].y}
          x2={BC[23].x}
          y2={BC[23].y}
        />
      </g>

      <g className="snake">
        <path
          d={`M${BC[12].x},${BC[12].y}
              C${BC[12].x + 70},${BC[12].y + 25}
              ${BC[5].x - 70},${BC[5].y - 25}
              ${BC[5].x},${BC[5].y}`}
        />

        <path
          d={`M${BC[24].x},${BC[24].y}
              C${BC[24].x - 70},${BC[24].y + 25}
              ${BC[16].x + 70},${BC[16].y - 25}
              ${BC[16].x},${BC[16].y}`}
        />
      </g>
    </svg>
  );
}

/* =========================================================
   MATH SOCIETY - SUDOKU
   ========================================================= */

const sudokuPuzzle = [
  [1, 0, 3, 0],
  [0, 4, 0, 2],
  [2, 0, 4, 0],
  [0, 3, 0, 1],
];

const sudokuSol = [
  [1, 2, 3, 4],
  [3, 4, 1, 2],
  [2, 1, 4, 3],
  [4, 3, 2, 1],
];

/* =========================================================
   PHONE
   Astronomy / Developers / PeopleSoft
   ========================================================= */

function Phone({
  mode,
  onDone,
  onClose,
}: {
  mode: PhoneMode;
  onDone: () => void;
  onClose: () => void;
}) {
  const [stars, setStars] = useState([
    { x: 22, y: 72 },
    { x: 72, y: 70 },
    { x: 42, y: 30 },
    { x: 75, y: 28 },
  ]);

  const [runner, setRunner] = useState({
    y: 0,
    vy: 0,
    score: 0,
    over: false,
    obstacle: 100,
  });

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');

  const target = [
    { x: 25, y: 25 },
    { x: 48, y: 43 },
    { x: 68, y: 22 },
    { x: 75, y: 62 },
  ];

  /* -------------------------
     Developer Society Runner
     ------------------------- */

  useEffect(() => {
    if (mode !== 'developers') return;

    let id = 0;
    let last = performance.now();

    const jump = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();

        setRunner((s) =>
          s.over
            ? s
            : s.y <= 0.01
              ? { ...s, vy: 7.6 }
              : s
        );
      }
    };

    addEventListener('keydown', jump);

    const loop = (t: number) => {
      const dt = Math.min(0.035, (t - last) / 1000);
      last = t;

      setRunner((s) => {
        if (s.over) return s;

        let vy = s.vy - 22 * dt;
        const y = Math.max(0, s.y + vy);

        if (y === 0 && vy < 0) {
          vy = 0;
        }

        let obstacle = s.obstacle - 42 * dt;

        if (obstacle < -10) {
          obstacle = 105;
        }

        const score = Math.min(
          100,
          s.score + dt * 18
        );

        const hit =
          obstacle > 12 &&
          obstacle < 27 &&
          y < 1.15;

        if (hit) {
          return {
            ...s,
            y,
            vy,
            score,
            obstacle,
            over: true,
          };
        }

        if (score >= 100) {
          setTimeout(onDone, 0);

          return {
            y,
            vy,
            score: 100,
            obstacle,
            over: true,
          };
        }

        return {
          y,
          vy,
          score,
          obstacle,
          over: false,
        };
      });

      id = requestAnimationFrame(loop);
    };

    id = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(id);
      removeEventListener('keydown', jump);
    };
  }, [mode, onDone]);

  /* -------------------------
     Astronomy drag controls
     ------------------------- */

  const drag = (
    i: number,
    e: React.PointerEvent
  ) => {
    const box = (
      e.currentTarget.parentElement as HTMLElement
    ).getBoundingClientRect();

    const move = (ev: PointerEvent) => {
      setStars((s) =>
        s.map((p, j) =>
          j === i
            ? {
                x: Math.max(
                  8,
                  Math.min(
                    92,
                    ((ev.clientX - box.left) /
                      box.width) *
                      100
                  )
                ),

                y: Math.max(
                  8,
                  Math.min(
                    82,
                    ((ev.clientY - box.top) /
                      box.height) *
                      100
                  )
                ),
              }
            : p
        )
      );
    };

    const up = () => {
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
    };

    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
  };

  const checkStars = () => {
    const ok = stars.every(
      (p, i) =>
        Math.hypot(
          p.x - target[i].x,
          p.y - target[i].y
        ) < 14
    );

    if (ok) {
      onDone();
    } else {
      alert(
        'Almost! Drag the four stars closer to the constellation guide.'
      );
    }
  };

  /* -------------------------
     PeopleSoft
     ------------------------- */

  const societies = [
    'Statistics Society',
    'Mathematics Society',
    'Astronomy Society',
    'Developers Society',
  ];

  const matches = societies.filter((s) =>
    s
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <div className="phoneOverlay">
      <div className="phone">

        {/* LOCAL SOCIETY FAIR ASSET */}
        <img
          src={phoneFrame}
          alt="Phone frame"
        />

        <div className="phoneScreen">

          {/* =====================
              ASTRONOMY
              ===================== */}

          {mode === 'astronomy' && (
            <>
              <div className="phoneTop">
                ASTRONOMY LINK
              </div>

              <h3>
                Constellation Challenge
              </h3>

              <p>
                Drag the stars onto the faint
                targets.
              </p>

              <div className="starGame">
                <svg>
                  {target.map((p, i) => (
                    <circle
                      key={i}
                      cx={`${p.x}%`}
                      cy={`${p.y}%`}
                      r="8"
                      className="target"
                    />
                  ))}

                  {stars
                    .slice(0, -1)
                    .map((p, i) => (
                      <line
                        key={i}
                        x1={`${p.x}%`}
                        y1={`${p.y}%`}
                        x2={`${stars[i + 1].x}%`}
                        y2={`${stars[i + 1].y}%`}
                      />
                    ))}
                </svg>

                {stars.map((p, i) => (
                  <button
                    key={i}
                    onPointerDown={(e) =>
                      drag(i, e)
                    }
                    className="star"
                    style={{
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>

              <button onClick={checkStars}>
                CHECK CONSTELLATION
              </button>
            </>
          )}

          {/* =====================
              DEVELOPERS
              ===================== */}

          {mode === 'developers' && (
            <>
              <div className="phoneTop">
                DEV SOC // RETRO RUNNER
              </div>

              <p className="phoneHint">
                SPACE / ↑ to jump · Reach 100
              </p>

              <div className="runner">
                <div className="score">
                  {Math.floor(runner.score)
                    .toString()
                    .padStart(3, '0')}
                </div>

                <div
                  className="bot"
                  style={{
                    bottom:
                      14 + runner.y * 11,
                  }}
                >
                  ▣
                </div>

                <div
                  className="obstacle"
                  style={{
                    left: `${runner.obstacle}%`,
                  }}
                >
                  ▥
                </div>

                <div className="ground" />
              </div>

              {runner.over &&
                runner.score < 100 && (
                  <button
                    className="phoneAction"
                    onClick={() =>
                      setRunner({
                        y: 0,
                        vy: 0,
                        score: 0,
                        over: false,
                        obstacle: 100,
                      })
                    }
                  >
                    RETRY
                  </button>
                )}
            </>
          )}

          {/* =====================
              PEOPLESOFT
              ===================== */}

          {mode === 'peoplesoft' && (
            <>
              <div className="phoneTop">
                PEOPLESOFT · STUDENT SOCIETIES
              </div>

              <h3>
                Join a society
              </h3>

              <input
                value={query}
                onChange={(e) =>
                  setQuery(e.target.value)
                }
                placeholder="Type society name…"
              />

              {query && (
                <div className="searchResults">
                  {matches.map((s) => (
                    <button
                      className={
                        selected === s
                          ? 'selected'
                          : ''
                      }
                      onClick={() =>
                        setSelected(s)
                      }
                      key={s}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <button
                disabled={!selected}
                onClick={onDone}
              >
                JOIN{' '}
                {selected
                  ? selected.toUpperCase()
                  : ''}
              </button>
            </>
          )}
        </div>

        <button
          className="phoneExit"
          onClick={onClose}
        >
          EXIT
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN SOCIETY FAIR LEVEL
   ========================================================= */

export default function SocietyFair({
  onComplete,
  onExit,
}: {
  onComplete: () => void;
  onExit: () => void;
}) {
  const [mission, setMission] = useState(
    'Explore the plaza and greet each society representative.'
  );

  const [scene, setScene] =
    useState<Scene>('plaza');

  const [pos, setPos] = useState<Pt>({
    x: 760,
    y: 840,
  });

  const [dir, setDir] =
    useState<Dir>('up');

  const [zoom, setZoom] =
    useState(1.35);

  const [greeted, setGreeted] =
    useState<Record<Society, boolean>>({
      stats: false,
      math: false,
      astronomy: false,
      developers: false,
    });

  const [done, setDone] =
    useState<Record<Society, boolean>>({
      stats: false,
      math: false,
      astronomy: false,
      developers: false,
    });

  const [toast, setToast] = useState(
    'Visit all four societies and try their activities.'
  );

  const [phone, setPhone] =
    useState<PhoneMode | null>(null);

  const [statsActive, setStatsActive] =
    useState(false);

  const [sq, setSq] =
    useState(1);

  const [quiz, setQuiz] =
    useState<typeof probs[0] | null>(null);

  const [mathActive, setMathActive] =
    useState(false);

  const [sudoku, setSudoku] =
    useState(
      sudokuPuzzle.map((r) => [...r])
    );

  const [dragNum, setDragNum] =
    useState<number | null>(null);

  const [joined, setJoined] =
    useState('');

  const [win, setWin] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });

  const posRef = useRef(pos);

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  const say = (s: string) => {
    setToast(s);

    setTimeout(() => {
      setToast('');
    }, 2600);
  };

  const current = PLAZA.find(
    (s) => dist(pos, s.p) < 125
  );

  const interiorHost =
    scene === 'stats'
      ? { x: 1040, y: 345 }
      : scene === 'math'
        ? { x: 1040, y: 345 }
        : null;

  const completed =
    Object.values(done).filter(Boolean).length;

  /* =======================================================
     WINDOW RESIZE
     ======================================================= */

  useEffect(() => {
    const resize = () => {
      setWin({
        w: window.innerWidth,
        h: window.innerHeight,
      });
    };

    addEventListener('resize', resize);

    return () =>
      removeEventListener(
        'resize',
        resize
      );
  }, []);

  /* =======================================================
     PLAYER MOVEMENT
     ======================================================= */

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        phone ||
        statsActive ||
        mathActive
      ) {
        return;
      }

      const k = e.key.toLowerCase();

      if (k === 'e') {
        interact();
        return;
      }

      const step = 52;

      let dx = 0;
      let dy = 0;

      if (
        k === 'w' ||
        k === 'arrowup'
      ) {
        dy = -step;
        setDir('up');
      }

      if (
        k === 's' ||
        k === 'arrowdown'
      ) {
        dy = step;
        setDir('down');
      }

      if (
        k === 'a' ||
        k === 'arrowleft'
      ) {
        dx = -step;
        setDir('left');
      }

      if (
        k === 'd' ||
        k === 'arrowright'
      ) {
        dx = step;
        setDir('right');
      }

      if (dx || dy) {
        e.preventDefault();

        setPos((p) => {
          const sceneData =
            SCENES[scene];

          return {
            x: Math.max(
              40,
              Math.min(
                sceneData.w - 40,
                p.x + dx
              )
            ),

            y: Math.max(
              70,
              Math.min(
                sceneData.h - 25,
                p.y + dy
              )
            ),
          };
        });
      }

      if (
        k === '+' ||
        k === '='
      ) {
        setZoom((z) =>
          Math.min(2.2, z + 0.1)
        );
      }

      if (k === '-') {
        setZoom((z) =>
          Math.max(1, z - 0.1)
        );
      }
    };

    addEventListener('keydown', key);

    return () =>
      removeEventListener(
        'keydown',
        key
      );
  }, [
    scene,
    phone,
    statsActive,
    mathActive,
    greeted,
    done,
  ]);

  /* =======================================================
     INTERACTION
     ======================================================= */

  function interact() {
    if (scene === 'plaza') {
      const society = PLAZA.find(
        (x) =>
          dist(
            posRef.current,
            x.p
          ) < 125
      );

      if (!society) {
        return say(
          'Walk up to a society representative and press E.'
        );
      }

      if (!greeted[society.id]) {
        setGreeted((g) => ({
          ...g,
          [society.id]: true,
        }));

        const lines = {
          stats:
            'Welcome to Stats Society! We explore data, probability and patterns. Want a taste? Step inside and try our life-sized probability board.',

          math:
            'Welcome to Mathematics Society! We solve puzzles, share problem-solving ideas and host social events. Step inside and try our Sudoku board.',

          astronomy:
            'Welcome to Astronomy Society! We explore stars, planets and the night sky. Want a taste? Scan our constellation link, then open it on your phone.',

          developers:
            'Welcome to Developers Society! We build software, games and fun coding projects. We rebuilt a retro jump game — open the link on your phone and give it a try!',
        };

        const missions = {
          stats:
            'Stats Society greeted — enter the Stats tent and try the life-sized probability board.',

          math:
            'MathSoc greeted — enter the Mathematics tent and solve the Sudoku challenge.',

          astronomy:
            'Astronomy link received — press E by the Astronomy rep to open your phone and solve the constellation.',

          developers:
            'Developer link received — press E by the Developers rep to open your phone and play Retro Runner.',
        };

        setMission(
          missions[society.id]
        );

        say(lines[society.id]);

        return;
      }

      if (
        society.id === 'astronomy'
      ) {
        setPhone('astronomy');
        return;
      }

      if (
        society.id === 'developers'
      ) {
        setPhone('developers');
        return;
      }

      if (society.id === 'stats') {
        setScene('stats');

        setPos({
          x: 704,
          y: 690,
        });

        say(
          'Stats Society — walk to the host and press E.'
        );

        return;
      }

      if (society.id === 'math') {
        setScene('math');

        setPos({
          x: 704,
          y: 690,
        });

        say(
          'MathSoc — walk to the Sudoku host and press E.'
        );

        return;
      }
    }

    if (
      interiorHost &&
      dist(
        posRef.current,
        interiorHost
      ) < 150
    ) {
      if (scene === 'stats') {
        startStats();
      } else {
        setMathActive(true);
      }
    } else {
      say(
        'Find the society host inside.'
      );
    }
  }

  /* =======================================================
     COMPLETE SOCIETY ACTIVITY
     ======================================================= */

  const finish = (
    id: Society
  ) => {
    const name =
      id === 'stats'
        ? 'Stats'
        : id === 'math'
          ? 'Mathematics'
          : id[0].toUpperCase() +
            id.slice(1);

    setMission(
      `${name} activity complete — ${
        completed + 1
      }/4 societies explored.`
    );

    setDone((d) => ({
      ...d,
      [id]: true,
    }));

    setPhone(null);
    setStatsActive(false);
    setMathActive(false);

    say(
      `${id.toUpperCase()} activity complete!`
    );

    if (scene !== 'plaza') {
      setScene('plaza');

      setPos({
        x: 760,
        y: 840,
      });
    }
  };

  /* =======================================================
     STATS GAME
     ======================================================= */

  const startStats = () => {
    setStatsActive(true);
    setSq(1);

    say(
      'Press E or click ROLL to roll the probability die!'
    );
  };

  const rollStats = async () => {
    const roll =
      1 +
      Math.floor(
        Math.random() * 6
      );

    const destination =
      Math.min(
        25,
        sq + roll
      );

    for (
      let n = sq + 1;
      n <= destination;
      n++
    ) {
      setSq(n);
      await sleep(140);
    }

    if (destination === 25) {
      finish('stats');
      return;
    }

    const special =
      snakeSpecial[destination];

    if (
      special?.kind === 'quiz'
    ) {
      setQuiz(
        probs[
          Math.floor(
            Math.random() *
              probs.length
          )
        ]
      );

      return;
    }

    if (special?.to) {
      say(
        special.kind === 'ladder'
          ? 'Ladder! Climb up!'
          : 'Snake! Slide down!'
      );

      await sleep(600);

      setSq(special.to);
    }
  };

  useEffect(() => {
    if (!statsActive) return;

    const key = (
      e: KeyboardEvent
    ) => {
      if (
        e.key.toLowerCase() ===
          'e' &&
        !quiz
      ) {
        rollStats();
      }
    };

    addEventListener(
      'keydown',
      key
    );

    return () =>
      removeEventListener(
        'keydown',
        key
      );
  }, [
    statsActive,
    sq,
    quiz,
  ]);

  const answerQuiz = (
    i: number
  ) => {
    if (!quiz) return;

    if (i === quiz.c) {
      say(
        'Correct — stay there!'
      );

      setQuiz(null);
    } else {
      say(
        'Not quite — back 3 squares!'
      );

      setSq((s) =>
        Math.max(1, s - 3)
      );

      setQuiz(null);
    }
  };

  /* =======================================================
     SUDOKU
     ======================================================= */

  const dropCell = (
    r: number,
    c: number
  ) => {
    if (
      sudokuPuzzle[r][c] !== 0 ||
      dragNum === null
    ) {
      return;
    }

    setSudoku((board) =>
      board.map((row, ri) =>
        row.map((value, ci) =>
          ri === r && ci === c
            ? dragNum
            : value
        )
      )
    );
  };

  const checkSudoku = () => {
    const correct =
      sudoku.every(
        (row, i) =>
          row.every(
            (value, j) =>
              value ===
              sudokuSol[i][j]
          )
      );

    if (correct) {
      finish('math');
    } else {
      say(
        'Not quite — check the Sudoku and try again.'
      );
    }
  };

  /* =======================================================
     CAMERA
     ======================================================= */

  const sceneData =
    SCENES[scene];

  const minZoom =
    Math.max(
      win.w / sceneData.w,
      win.h / sceneData.h
    );

  const z =
    Math.max(
      minZoom,
      zoom
    );

  const focus =
    statsActive
      ? BC[sq]
      : pos;

  const tx =
    Math.min(
      0,
      Math.max(
        win.w -
          sceneData.w * z,
        win.w / 2 -
          focus.x * z
      )
    );

  const ty =
    Math.min(
      0,
      Math.max(
        win.h -
          sceneData.h * z,
        win.h / 2 -
          focus.y * z
      )
    );

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="app">

      {/* WORLD */}

      <div className="viewport">
        <div
          className="camera"
          style={{
            width: sceneData.w,
            height: sceneData.h,
            transform:
              `translate3d(${tx}px, ${ty}px, 0) scale(${z})`,
          }}
        >
          <img
            className="worldBg"
            src={sceneData.bg}
            alt=""
          />

          {/* PLAZA */}

          {scene === 'plaza' && (
            <>
              {PLAZA.map(
                (society, i) => (
                  <Sprite
                    key={society.id}
                    kind={
                      i % 2
                        ? 'host'
                        : 'student'
                    }
                    dir="down"
                    x={society.p.x}
                    y={society.p.y}
                    size={70}
                  />
                )
              )}

              <Sprite
                kind="player"
                dir={dir}
                x={pos.x}
                y={pos.y}
                size={102}
              />
            </>
          )}

          {/* STATS */}

          {scene === 'stats' && (
            <>
              {statsActive ? (
                <>
                  <StatsBoard />

                  <Sprite
                    kind="player"
                    dir="up"
                    x={BC[sq].x}
                    y={BC[sq].y}
                    size={58}
                  />
                </>
              ) : (
                <>
                  <Sprite
                    kind="host"
                    dir={face(
                      interiorHost!,
                      pos
                    )}
                    x={
                      interiorHost!.x
                    }
                    y={
                      interiorHost!.y
                    }
                    label="Stats Host"
                  />

                  <Sprite
                    kind="player"
                    dir={dir}
                    x={pos.x}
                    y={pos.y}
                  />
                </>
              )}
            </>
          )}

          {/* MATH */}

          {scene === 'math' && (
            <>
              <Sprite
                kind="host"
                dir={face(
                  interiorHost!,
                  pos
                )}
                x={interiorHost!.x}
                y={interiorHost!.y}
                label="MathSoc Host"
              />

              {!mathActive && (
                <Sprite
                  kind="player"
                  dir={dir}
                  x={pos.x}
                  y={pos.y}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* HEADER */}

      <header>
        <div>
          <strong>
            CAMPUS QUEST
          </strong>

          <span>
            MISSION 3 · FIND YOUR PEOPLE
          </span>
        </div>

        <div>
          <b>
            {completed}/4 explored
          </b>

          {' · '}
          Zoom {z.toFixed(1)}×
          {' · +/-'}
        </div>
      </header>

      {/* MISSION */}

      <div className="missionBar">
        <b>MISSION</b>

        <span>
          {mission}
        </span>

        <button onClick={onExit}>
          ← MAP
        </button>
      </div>

      {/* PLAZA INTERACTION */}

      {scene === 'plaza' &&
        current && (
          <div className="prompt">
            <kbd>E</kbd>{' '}

            {greeted[
              current.id
            ]
              ? current.id ===
                  'stats' ||
                current.id ===
                  'math'
                ? 'Enter / play activity'
                : 'Open activity on phone'
              : `Greet ${current.name}`}
          </div>
        )}

      {/* INTERIOR INTERACTION */}

      {scene !== 'plaza' &&
        !statsActive &&
        !mathActive &&
        interiorHost &&
        dist(
          pos,
          interiorHost
        ) < 150 && (
          <div className="prompt">
            <kbd>E</kbd>{' '}
            Start activity
          </div>
        )}

      {/* TOAST */}

      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}

      {/* STATS HUD */}

      {statsActive && (
        <div className="gameHud">
          <b>
            📊 LIFE-SIZED
            PROBABILITY BOARD
          </b>

          <span>
            Square {sq}/25
          </span>

          <button
            onClick={rollStats}
            disabled={!!quiz}
          >
            🎲 ROLL [E]
          </button>

          <button
            className="ghost"
            onClick={() =>
              setStatsActive(
                false
              )
            }
          >
            EXIT GAME
          </button>
        </div>
      )}

      {/* STATS QUIZ */}

      {quiz && (
        <div className="overlay">
          <div className="modal">
            <small>
              PROBABILITY SQUARE
            </small>

            <h2>
              {quiz.q}
            </h2>

            <div className="answers">
              {quiz.a.map(
                (answer, i) => (
                  <button
                    onClick={() =>
                      answerQuiz(i)
                    }
                    key={answer}
                  >
                    {answer}
                  </button>
                )
              )}
            </div>

            <button
              className="ghost exitGame"
              onClick={() => {
                setQuiz(null);
                setStatsActive(
                  false
                );
              }}
            >
              EXIT GAME
            </button>
          </div>
        </div>
      )}

      {/* MATH SUDOKU */}

      {mathActive && (
        <div className="overlay">
          <div className="sudokuModal">
            <small>
              🧮 MATHSOC · SUDOKU
            </small>

            <h2>
              Drag a number into
              each blank cell
            </h2>

            <div className="sudoku">
              {sudoku.map(
                (row, r) =>
                  row.map(
                    (value, c) => (
                      <div
                        onDragOver={(
                          e
                        ) =>
                          e.preventDefault()
                        }
                        onDrop={() =>
                          dropCell(
                            r,
                            c
                          )
                        }
                        className={
                          sudokuPuzzle[
                            r
                          ][c]
                            ? 'given'
                            : 'cell'
                        }
                        key={`${r}-${c}`}
                      >
                        {value || ''}
                      </div>
                    )
                  )
              )}
            </div>

            <div className="numbers">
              {[1, 2, 3, 4].map(
                (n) => (
                  <button
                    draggable
                    onDragStart={() =>
                      setDragNum(n)
                    }
                    key={n}
                  >
                    {n}
                  </button>
                )
              )}
            </div>

            <div className="modalActions">
              <button
                onClick={
                  checkSudoku
                }
              >
                DONE
              </button>

              <button
                className="ghost"
                onClick={() =>
                  setMathActive(
                    false
                  )
                }
              >
                EXIT GAME
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHONE */}

      {phone && (
        <Phone
          mode={phone}
          onClose={() =>
            setPhone(null)
          }
          onDone={() => {
            if (
              phone ===
              'astronomy'
            ) {
              finish(
                'astronomy'
              );
            } else if (
              phone ===
              'developers'
            ) {
              finish(
                'developers'
              );
            } else {
              setJoined(
                'Your chosen society'
              );

              setPhone(null);
            }
          }}
        />
      )}

      {/* ALL SOCIETIES COMPLETE */}

      {completed === 4 &&
        !joined && (
          <div className="missionComplete">
            <b>
              🎉 SOCIETY FAIR
              COMPLETE
            </b>

            <span>
              You tried all four
              activities.
              Registration is now
              unlocked.
            </span>

            <button
              onClick={() =>
                setPhone(
                  'peoplesoft'
                )
              }
            >
              📱 OPEN PEOPLESOFT
            </button>
          </div>
        )}

      {/* FINAL COMPLETION */}

      {joined && (
        <div className="overlay">
          <div className="modal">
            <small>
              MISSION COMPLETE
            </small>

            <h1>
              🏆 FOUND YOUR PEOPLE
            </h1>

            <p>
              Society registration
              complete. Welcome to
              campus life!
            </p>

            <button
              onClick={onComplete}
            >
              RETURN TO CAMPUS MAP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}