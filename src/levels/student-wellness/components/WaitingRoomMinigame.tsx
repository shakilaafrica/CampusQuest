import { useCallback, useEffect, useRef, useState } from 'react';
import './WaitingRoomMinigame.css';

interface Props {
  targetName?: string;
  onWin: () => void;
  onFailWrongName: (calledName: string) => void;
  onFailMissedTarget: () => void;
}

const NAME_POOL = [
  'Aiden', 'Sarah', 'Thabo', 'Naledi', 'Michael',
  'Zanele', 'Liam', 'Aisha', 'Kagiso', 'Emma', 'Sipho', 'Chloe',
];

const CALL_DURATION_MS = 2000; // how long the doctor stays in the doorway
const GAP_MS = 1200; // pause between calls
const INITIAL_DELAY_MS = 900;

function pickFillerName(exclude: string | null) {
  const options = NAME_POOL.filter((n) => n !== exclude);
  return options[Math.floor(Math.random() * options.length)];
}

export function WaitingRoomMinigame({ targetName = 'Kirah', onWin, onFailWrongName, onFailMissedTarget }: Props) {
  const [phase, setPhase] = useState<'gap' | 'calling' | 'ended'>('gap');
  const [currentName, setCurrentName] = useState<string | null>(null);

  const timerRef = useRef<number | undefined>(undefined);
  const handledRef = useRef(false);
  const currentNameRef = useRef<string | null>(null);
  const fillerCountRef = useRef(0);
  const lastNameRef = useRef<string | null>(null);
  // Kirah is only eligible to be called after at least 5 other names — this
  // is rolled once per playthrough so it isn't always exactly 5.
  const thresholdRef = useRef(5 + Math.floor(Math.random() * 3)); // 5, 6, or 7

  const clearTimer = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  };

  const scheduleNextCall = useCallback(
    (delay: number) => {
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        const callTarget = fillerCountRef.current >= thresholdRef.current;
        const name = callTarget ? targetName : pickFillerName(lastNameRef.current);
        lastNameRef.current = name;
        currentNameRef.current = name;
        handledRef.current = false;
        setCurrentName(name);
        setPhase('calling');

        timerRef.current = window.setTimeout(() => {
          if (handledRef.current) return; // already resolved by a hand-raise
          handledRef.current = true;

          if (currentNameRef.current === targetName) {
            setPhase('ended');
            onFailMissedTarget();
          } else {
            fillerCountRef.current += 1;
            setPhase('gap');
            setCurrentName(null);
            scheduleNextCall(GAP_MS);
          }
        }, CALL_DURATION_MS);
      }, delay);
    },
    [targetName, onFailMissedTarget],
  );

  useEffect(() => {
    scheduleNextCall(INITIAL_DELAY_MS);
    return () => clearTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRaiseHand = () => {
    if (phase !== 'calling' || handledRef.current) return;
    handledRef.current = true;
    clearTimer();

    if (currentNameRef.current === targetName) {
      setPhase('ended');
      onWin();
    } else {
      setPhase('ended');
      onFailWrongName(currentNameRef.current ?? '');
    }
  };

  return (
    <div className="waiting-room">
      <div className="waiting-room__banner">Listening for your name…</div>

      <div className="waiting-room__stage">
        <div className="waiting-room__doorway">
          <div className={`waiting-room__doctor${phase === 'calling' ? ' waiting-room__doctor--visible' : ''}`}>
            <span className="waiting-room__doctor-emoji" aria-hidden="true">🩺</span>
            {phase === 'calling' && currentName && (
              <div className="waiting-room__bubble">Is {currentName} here?</div>
            )}
          </div>
        </div>
        <div className="waiting-room__seats" aria-hidden="true">🪑 🪑 🪑</div>
      </div>

      <button className="waiting-room__hand-btn" onClick={handleRaiseHand} disabled={phase !== 'calling'}>
        ✋ Raise Hand
      </button>

      <div className="waiting-room__hint">Only raise your hand when the doctor calls Kirah's name.</div>
    </div>
  );
}
