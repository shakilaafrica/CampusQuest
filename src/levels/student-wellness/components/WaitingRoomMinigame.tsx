import { useEffect, useRef, useState } from 'react';
import bgImage from '../assets/student-wellness-minigame-background.jfif';
import doctorImage from '../assets/student-wellness-doctor.jfif';
import './WaitingRoomMinigame.css';

interface Props {
  targetName?: string;
  onWin: () => void;
  onFailWrongName: () => void;
  onFailMissedTarget: () => void;
}

const NAME_POOL = [
  'Aiden', 'Sarah', 'Thabo', 'Naledi', 'Michael',
  'Zanele', 'Liam', 'Aisha', 'Kagiso', 'Emma', 'Sipho', 'Chloe',
];

// --- Difficulty tuning ---------------------------------------------------
// Previously: DOCTOR_VISIBLE_DURATION_MS was 2000, SPAWN_INTERVAL_MS was 1200,
// INITIAL_DELAY_MS was 900 — a ~3.2s round felt sluggish.
// The doctor now stays visible for a shorter reaction window and reappears
// more quickly, dropping the round to ~1.35s while still being fair.
const DOCTOR_VISIBLE_DURATION_MS = 850; // how long the doctor stays in the doorway
const SPAWN_INTERVAL_MS = 500; // pause between calls
const INITIAL_DELAY_MS = 500; // delay before the first call

function pickFillerName(exclude: string | null) {
  const options = NAME_POOL.filter((n) => n !== exclude);
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * The waiting-room reaction game.
 *
 * Round lifecycle:
 *   gap → calling → gap (filler expired, no click)
 *                 → ended  (win or wrong-name click — parent takes over)
 *                 → missed (Kirah expired — doctor stays in the doorway while
 *                           the parent shows the doctor's dialogue)
 *
 * State model:
 *   - phase: React state, drives the doctor sprite + button enablement.
 *   - resolvedRef: authoritative "this round has been decided" flag. Flipped
 *     synchronously the moment the round resolves, BEFORE any state update or
 *     callback. Guards the click-vs-timeout race and rapid double-clicks.
 *   - currentNameRef: whatever name is currently being called. Always read
 *     synchronously — never trust a captured `currentName` from a stale render.
 *
 * There are exactly two timer lifetimes, given their own refs so they can't
 * be accidentally cleared by each other:
 *   - roundStartTimerRef: fires during 'gap' to begin the next call.
 *   - reactionTimerRef:   fires during 'calling' if the player doesn't react.
 *
 * Both are cancelled on unmount so no stray timeout can outlive the component.
 */
export function WaitingRoomMinigame({
  targetName = 'Kirah',
  onWin,
  onFailWrongName,
  onFailMissedTarget,
}: Props) {
  const [phase, setPhase] = useState<'gap' | 'calling' | 'ended' | 'missed'>('gap');
  const [currentName, setCurrentName] = useState<string | null>(null);

  // Two independent timer slots so clearing one can never clear the other.
  const roundStartTimerRef = useRef<number | null>(null);
  const reactionTimerRef = useRef<number | null>(null);

  // Round state
  const resolvedRef = useRef(true); // no active round at mount
  const currentNameRef = useRef<string | null>(null);
  const fillerCountRef = useRef(0);
  const lastNameRef = useRef<string | null>(null);
  // Kirah is only eligible to be called after N filler names, rolled once per
  // mount so a retry gets a fresh threshold.
  const thresholdRef = useRef(5 + Math.floor(Math.random() * 3)); // 5, 6, or 7

  // Callback refs — a timeout scheduled during one render might not fire until
  // several renders later. Reading via refs guarantees it invokes the latest
  // props, not the stale ones from when the timer was scheduled.
  const targetNameRef = useRef(targetName);
  const onWinRef = useRef(onWin);
  const onFailWrongNameRef = useRef(onFailWrongName);
  const onFailMissedTargetRef = useRef(onFailMissedTarget);
  useEffect(() => { targetNameRef.current = targetName; }, [targetName]);
  useEffect(() => { onWinRef.current = onWin; }, [onWin]);
  useEffect(() => { onFailWrongNameRef.current = onFailWrongName; }, [onFailWrongName]);
  useEffect(() => { onFailMissedTargetRef.current = onFailMissedTarget; }, [onFailMissedTarget]);

  // The main round loop lives inside a single mount-time effect so that it
  // never restarts on prop changes (props are read through refs above).
  useEffect(() => {
    const clearRoundStart = () => {
      if (roundStartTimerRef.current !== null) {
        window.clearTimeout(roundStartTimerRef.current);
        roundStartTimerRef.current = null;
      }
    };
    const clearReaction = () => {
      if (reactionTimerRef.current !== null) {
        window.clearTimeout(reactionTimerRef.current);
        reactionTimerRef.current = null;
      }
    };

    const scheduleNextCall = (delay: number) => {
      clearRoundStart();
      roundStartTimerRef.current = window.setTimeout(() => {
        roundStartTimerRef.current = null;
        beginCall();
      }, delay);
    };

    const beginCall = () => {
      // Decide who the doctor calls this round.
      const callTarget = fillerCountRef.current >= thresholdRef.current;
      const target = targetNameRef.current;
      const name = callTarget ? target : pickFillerName(lastNameRef.current);
      lastNameRef.current = name;
      currentNameRef.current = name;
      resolvedRef.current = false; // NEW round is now live
      setCurrentName(name);
      setPhase('calling');

      // Reaction window. If the player raises their hand first, the click
      // handler cancels this timer AND sets resolvedRef=true, so even if the
      // timeout has already fired and its callback is queued, the guard below
      // makes it a no-op.
      clearReaction();
      reactionTimerRef.current = window.setTimeout(() => {
        reactionTimerRef.current = null;
        if (resolvedRef.current) return; // click already resolved this round
        resolvedRef.current = true;

        const target = targetNameRef.current;
        if (currentNameRef.current === target) {
          // Player missed Kirah — end the mini-game.
          setPhase('missed');
          onFailMissedTargetRef.current();
        } else {
          // Filler expired without a click — legitimate, keep playing.
          fillerCountRef.current += 1;
          setPhase('gap');
          setCurrentName(null);
          scheduleNextCall(SPAWN_INTERVAL_MS);
        }
      }, DOCTOR_VISIBLE_DURATION_MS);
    };

    scheduleNextCall(INITIAL_DELAY_MS);

    // On unmount, guarantee both timers are dead. Even if one is idle, the
    // clear is a safe no-op — no leaks, no callbacks firing after unmount.
    return () => {
      clearRoundStart();
      clearReaction();
    };
  }, []);

  // Click handler — declared per render so it reads live `phase` state, but
  // authoritative guard is on the resolvedRef so it works even during the
  // one-render window between resolution and the phase='ended' commit.
  const handleRaiseHand = () => {
    // No live round → ignore. Also filters out rapid double-clicks: the first
    // click sets resolvedRef=true synchronously, the second click sees it and
    // returns before doing anything.
    if (phase !== 'calling' || resolvedRef.current) return;
    resolvedRef.current = true;

    // Cancel the pending reaction timeout so it can't fire a stale failure
    // after this click has resolved the round.
    if (reactionTimerRef.current !== null) {
      window.clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = null;
    }

    setPhase('ended');
    if (currentNameRef.current === targetNameRef.current) {
      onWinRef.current();
    } else {
      onFailWrongNameRef.current();
    }
  };

  const doctorVisible = phase === 'calling' || phase === 'missed';

  return (
    <div className="wrm">
      <img className="wrm__background" src={bgImage} alt="" draggable={false} />

      {/* Doctor overlay: positioned in front of the central double doors.
          Feet sit near the floor (bottom: 9%), centred at 51% horizontally,
          height is a percentage of the scene so aspect ratio is preserved. */}
      <img
        className={`wrm__doctor${doctorVisible ? ' wrm__doctor--visible' : ''}`}
        src={doctorImage}
        alt=""
        draggable={false}
      />

      {phase === 'calling' && currentName && (
        <div className="wrm__bubble">Is {currentName} here?</div>
      )}

      <div className="wrm__banner">Listening for your name…</div>

      <button
        type="button"
        className="wrm__hand-btn"
        onClick={handleRaiseHand}
        disabled={phase !== 'calling'}
      >
        ✋ Raise Hand
      </button>

      <div className="wrm__hint">
        Only raise your hand when the doctor calls {targetName}&apos;s name.
      </div>
    </div>
  );
}
