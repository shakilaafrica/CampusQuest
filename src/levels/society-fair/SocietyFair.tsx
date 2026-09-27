import React, { useEffect, useRef, useState } from 'react';
import './style.css';

import plazaDay from './assets/plaza-day.png';

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

import Phone, { PhoneMode } from './components/Phone';
import SocietyPassport from './components/SocietyPassport';
import Confetti from './components/Confetti';
import {
  SOCIETIES,
  SOCIETY_BY_ID,
  SocietyId,
  SocietyStage,
  dist,
  Pt,
} from './societyData';

/* =========================================================
   TYPES & SPRITES
   ========================================================= */

type Dir = 'up' | 'down' | 'left' | 'right';

const SPRITES = {
  player: { up: playerUp, down: playerDown, left: playerLeft, right: playerRight },
  host: { up: hostUp, down: hostDown, left: hostLeft, right: hostRight },
  student: { up: studentUp, down: studentDown, left: studentLeft, right: studentRight },
};

const SCENE = { w: 1536, h: 1024, bg: plazaDay };

function face(a: Pt, b: Pt): Dir {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

function Sprite({
  kind = 'student',
  dir,
  x,
  y,
  size = 92,
}: {
  kind?: keyof typeof SPRITES;
  dir: Dir;
  x: number;
  y: number;
  size?: number;
}) {
  return (
    <div className="sprite" style={{ left: x, top: y, zIndex: Math.floor(y) }}>
      <img src={SPRITES[kind][dir]} style={{ height: size }} alt="" />
    </div>
  );
}

const INITIAL_STAGES: Record<SocietyId, SocietyStage> = {
  astronomy: 'notVisited',
  statistics: 'notVisited',
  math: 'notVisited',
  developers: 'notVisited',
};

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
    'Explore the Society Fair, meet UCT societies, and discover where you belong.'
  );

  const [pos, setPos] = useState<Pt>({ x: 760, y: 840 });
  const [dir, setDir] = useState<Dir>('up');
  const [zoom, setZoom] = useState(1.35);

  const [stages, setStages] = useState<Record<SocietyId, SocietyStage>>(INITIAL_STAGES);

  const [toast, setToast] = useState(
    'Walk up to a society representative and press E to greet them.'
  );

  const [speechBubble, setSpeechBubble] = useState<{
    id: SocietyId;
    text: string;
    onContinue: () => void;
  } | null>(null);

  const [phoneMode, setPhoneMode] = useState<PhoneMode | null>(null);
  const [passportOpen, setPassportOpen] = useState(false);
  const [joinedCode, setJoinedCode] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const [win, setWin] = useState({ w: window.innerWidth, h: window.innerHeight });

  const stagesRef = useRef(stages);
  useEffect(() => {
    stagesRef.current = stages;
  }, [stages]);

  const say = (s: string) => {
    setToast(s);
    setTimeout(() => setToast(''), 3000);
  };

  const current = SOCIETIES.find((s) => dist(pos, s.p) < 125) ?? null;

  const unlockedCount = SOCIETIES.filter((s) => stages[s.id] === 'codeUnlocked').length;
  const allUnlocked = unlockedCount === SOCIETIES.length;

  /* =======================================================
     WINDOW RESIZE
     ======================================================= */

  useEffect(() => {
    const resize = () => setWin({ w: window.innerWidth, h: window.innerHeight });
    addEventListener('resize', resize);
    return () => removeEventListener('resize', resize);
  }, []);

  /* =======================================================
     GREET / INTERACT
     ======================================================= */

  function greetOrReminder(id: SocietyId) {
    const society = SOCIETY_BY_ID[id];
    const stage = stagesRef.current[id];

    if (stage === 'notVisited') {
      setStages((s) => ({ ...s, [id]: 'introduced' }));

      setSpeechBubble({
        id,
        text: society.greeting,
        onContinue: () => {
          setStages((s) => ({ ...s, [id]: 'gameAvailable' }));
          setMission(
            `${society.name} greeted — press P near them to ${society.activityPrompt.toLowerCase()}.`
          );
          setSpeechBubble(null);
        },
      });

      return;
    }

    if (stage === 'gameAvailable') {
      setSpeechBubble({
        id,
        text: society.greeting,
        onContinue: () => setSpeechBubble(null),
      });

      return;
    }

    // gameCompleted / codeUnlocked
    setSpeechBubble({
      id,
      text: society.reminder,
      onContinue: () => setSpeechBubble(null),
    });
  }

  function openPhoneForCurrent() {
    if (speechBubble) return;

    if (current && stagesRef.current[current.id] === 'gameAvailable') {
      setPhoneMode(current.id);
      return;
    }

    if (allUnlocked && !joinedCode) {
      setPhoneMode('peoplesoft');
      return;
    }

    if (current && stagesRef.current[current.id] === 'notVisited') {
      say(`Greet ${current.name} first — press E.`);
      return;
    }

    if (current) {
      say('You have already tried this activity.');
      return;
    }

    say('Find a society representative, or explore all four to unlock PeopleSoft.');
  }

  /* =======================================================
     KEYBOARD — WORLD MOVEMENT + E/P
     ======================================================= */

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (phoneMode) return;

      const k = e.key.toLowerCase();

      if (k === 'e') {
        e.preventDefault();

        if (speechBubble) {
          speechBubble.onContinue();
          return;
        }

        if (current) {
          greetOrReminder(current.id);
        } else {
          say('Walk up to a society representative and press E.');
        }

        return;
      }

      if (k === 'p') {
        e.preventDefault();
        openPhoneForCurrent();
        return;
      }

      if (speechBubble) return;

      const step = 52;
      let dx = 0;
      let dy = 0;

      if (k === 'w' || k === 'arrowup') {
        dy = -step;
        setDir('up');
      }
      if (k === 's' || k === 'arrowdown') {
        dy = step;
        setDir('down');
      }
      if (k === 'a' || k === 'arrowleft') {
        dx = -step;
        setDir('left');
      }
      if (k === 'd' || k === 'arrowright') {
        dx = step;
        setDir('right');
      }

      if (dx || dy) {
        e.preventDefault();

        setPos((p) => ({
          x: Math.max(40, Math.min(SCENE.w - 40, p.x + dx)),
          y: Math.max(70, Math.min(SCENE.h - 25, p.y + dy)),
        }));
      }

      if (k === '+' || k === '=') setZoom((z) => Math.min(2.2, z + 0.1));
      if (k === '-') setZoom((z) => Math.max(1, z - 0.1));
    };

    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, [phoneMode, speechBubble, current, joinedCode, allUnlocked]);

  /* =======================================================
     PHONE CALLBACKS
     ======================================================= */

  function handleGameComplete() {
    const id = phoneMode as SocietyId;
    const society = SOCIETY_BY_ID[id];

    setStages((s) => ({ ...s, [id]: 'gameCompleted' }));
    setPhoneMode(null);

    // codeUnlocked follows gameCompleted immediately: the society hands over
    // the code the moment the activity finishes.
    setTimeout(() => {
      setStages((s) => ({ ...s, [id]: 'codeUnlocked' }));

      setSpeechBubble({
        id,
        text: society.afterComplete,
        onContinue: () => setSpeechBubble(null),
      });

      const done = Object.values({ ...stagesRef.current, [id]: 'codeUnlocked' }).filter(
        (v) => v === 'codeUnlocked'
      ).length;

      setMission(`${society.name} complete — ${done}/4 societies explored.`);
    }, 50);
  }

  function handleJoin(code: string) {
    setJoinedCode(code);
    setPhoneMode(null);
    setShowConfetti(true);
    setMission('Mission complete — you found your people!');
  }

  /* =======================================================
     CAMERA
     ======================================================= */

  const minZoom = Math.max(win.w / SCENE.w, win.h / SCENE.h);
  const z = Math.max(minZoom, zoom);

  const tx = Math.min(0, Math.max(win.w - SCENE.w * z, win.w / 2 - pos.x * z));
  const ty = Math.min(0, Math.max(win.h - SCENE.h * z, win.h / 2 - pos.y * z));

  const promptText = (() => {
    if (!current) return null;

    const stage = stages[current.id];

    if (stage === 'notVisited') return `Greet ${current.name}`;
    if (stage === 'gameAvailable') return current.activityPrompt;
    return `You already completed ${current.name}'s activity.`;
  })();

  return (
    <div className="society-fair app">
      {/* WORLD */}
      <div className="viewport">
        <div
          className="camera"
          style={{
            width: SCENE.w,
            height: SCENE.h,
            transform: `translate3d(${tx}px, ${ty}px, 0) scale(${z})`,
          }}
        >
          <img className="worldBg" src={SCENE.bg} alt="" />

          {SOCIETIES.map((society) => (
            <Sprite
              key={society.id}
              kind={society.npcKind}
              dir={face(society.p, pos)}
              x={society.p.x}
              y={society.p.y}
              size={70}
            />
          ))}

          <Sprite kind="player" dir={dir} x={pos.x} y={pos.y} size={102} />
        </div>
      </div>

      {/* HEADER */}
      <header>
        <div>
          <strong>CAMPUS QUEST</strong>
          <span>MISSION 3 · FIND YOUR PEOPLE</span>
        </div>
        <div>
          <b>{unlockedCount}/4 explored</b>
          {' · '}Zoom {z.toFixed(1)}×{' · +/-'}
        </div>
      </header>

      {/* MISSION BAR */}
      <div className="missionBar">
        <b>MISSION</b>
        <span>{mission}</span>
        <button onClick={onExit}>← MAP</button>
      </div>

      <SocietyPassport
        stages={stages}
        open={passportOpen}
        onToggle={() => setPassportOpen((o) => !o)}
      />

      {/* CONTEXTUAL PROMPT */}
      {!speechBubble && !phoneMode && promptText && (
        <div className="prompt">
          <kbd>{stages[current!.id] === 'gameAvailable' ? 'P' : 'E'}</kbd> {promptText}
        </div>
      )}

      {!speechBubble && !phoneMode && !current && allUnlocked && !joinedCode && (
        <div className="prompt">
          <kbd>P</kbd> Open your phone and join the society you liked most
        </div>
      )}

      {/* TOAST */}
      {toast && !speechBubble && <div className="toast">{toast}</div>}

      {/* SPEECH BUBBLE */}
      {speechBubble && (
        <div className="society-speech">
          <div className="society-speech-bubble">
            <b>
              {SOCIETY_BY_ID[speechBubble.id].emoji} {SOCIETY_BY_ID[speechBubble.id].name}
            </b>
            <p>{speechBubble.text}</p>
            <button onClick={speechBubble.onContinue}>CONTINUE [E]</button>
          </div>
        </div>
      )}

      {/* PHONE */}
      {phoneMode && (
        <Phone
          mode={phoneMode}
          orientation={
            phoneMode === 'peoplesoft' ? 'portrait' : SOCIETY_BY_ID[phoneMode].orientation
          }
          unlockedCodes={SOCIETIES.filter((s) => stages[s.id] === 'codeUnlocked').map(
            (s) => s.code
          )}
          onGameComplete={handleGameComplete}
          onJoin={handleJoin}
          onClose={() => setPhoneMode(null)}
        />
      )}

      {/* CONFETTI */}
      {showConfetti && <Confetti />}

      {/* MISSION COMPLETE */}
      {joinedCode && (
        <div className="overlay">
          <div className="modal">
            <small>MISSION COMPLETE</small>
            <h1>🏆 YOU FOUND YOUR PEOPLE!</h1>
            <p>
              You've explored some of UCT's student societies and learned how societies can
              be joined through PeopleSoft.
            </p>
            <p className="phoneFact">
              Orientation Tip: Societies are a great way to meet people who share your
              interests and become part of campus life.
            </p>
            <button onClick={onComplete}>RETURN TO CAMPUS MAP</button>
          </div>
        </div>
      )}
    </div>
  );
}
