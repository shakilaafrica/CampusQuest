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

const DOCTOR_VISIBLE_DURATION_MS = 850; 
const SPAWN_INTERVAL_MS = 500; 
const INITIAL_DELAY_MS = 500; 

function pickFillerName(exclude: string | null) {
  const options = NAME_POOL.filter((n) => n !== exclude);
  return options[Math.floor(Math.random() * options.length)];
}


export function WaitingRoomMinigame({
  targetName = 'Kirah',
  onWin,
  onFailWrongName,
  onFailMissedTarget,
}: Props) {
  const [phase, setPhase] = useState<'gap' | 'calling' | 'ended' | 'missed'>('gap');
  const [currentName, setCurrentName] = useState<string | null>(null);

  const roundStartTimerRef = useRef<number | null>(null);
  const reactionTimerRef = useRef<number | null>(null);

  const resolvedRef = useRef(true); // no active round at mount
  const currentNameRef = useRef<string | null>(null);
  const fillerCountRef = useRef(0);
  const lastNameRef = useRef<string | null>(null);

  const thresholdRef = useRef(5 + Math.floor(Math.random() * 3)); 

  
  const targetNameRef = useRef(targetName);
  const onWinRef = useRef(onWin);
  const onFailWrongNameRef = useRef(onFailWrongName);
  const onFailMissedTargetRef = useRef(onFailMissedTarget);
  useEffect(() => { targetNameRef.current = targetName; }, [targetName]);
  useEffect(() => { onWinRef.current = onWin; }, [onWin]);
  useEffect(() => { onFailWrongNameRef.current = onFailWrongName; }, [onFailWrongName]);
  useEffect(() => { onFailMissedTargetRef.current = onFailMissedTarget; }, [onFailMissedTarget]);


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
      const callTarget = fillerCountRef.current >= thresholdRef.current;
      const target = targetNameRef.current;
      const name = callTarget ? target : pickFillerName(lastNameRef.current);
      lastNameRef.current = name;
      currentNameRef.current = name;
      setCurrentName(name);
      resolvedRef.current = false; 
      setPhase('calling');

    
      clearReaction();
      reactionTimerRef.current = window.setTimeout(() => {
        reactionTimerRef.current = null;
        if (resolvedRef.current) return; // click already resolved this round
        resolvedRef.current = true;

        const target = targetNameRef.current;
        if (currentNameRef.current === target) {
          setPhase('missed');
          onFailMissedTargetRef.current();
        } else {
          fillerCountRef.current += 1;
          setPhase('gap');
          setCurrentName(null);
          scheduleNextCall(SPAWN_INTERVAL_MS);
        }
      }, DOCTOR_VISIBLE_DURATION_MS);
    };

    scheduleNextCall(INITIAL_DELAY_MS);

    return () => {
      clearRoundStart();
      clearReaction();
    };
  }, []);

  const handleRaiseHand = () => {

    if (phase !== 'calling' || resolvedRef.current) return;
    resolvedRef.current = true;

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
