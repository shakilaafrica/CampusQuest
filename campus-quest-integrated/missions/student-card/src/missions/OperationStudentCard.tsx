import { useCallback, useState } from 'react';
import { AccessControlScene, type PoiId } from '../scenes/AccessControlScene';
import { DialogueBox, type DialogueLine } from '../components/DialogueBox';
import { PhotoBoothMinigame } from '../components/PhotoBoothMinigame';
import type { InventoryItem, MissionStage } from '../types/game';
import './OperationStudentCard.css';

const WORKER_INTRO: DialogueLine[] = [
  {
    speaker: 'Thandiwe — Access Control',
    portrait: '🧑\u200d💼',
    text: "Hi there, first year! You'll need a student card before you can get into any building on campus.",
  },
  {
    speaker: 'Thandiwe — Access Control',
    portrait: '🧑\u200d💼',
    text: "Head over to the photobooth behind me and sit in the chair — press E when you're ready for your photo.",
  },
];

const RETAKE_LINE: DialogueLine[] = [
  {
    speaker: 'Thandiwe — Access Control',
    portrait: '🧑\u200d💼',
    text: "Hmm... that's not a good picture. Let's try that again — take a seat and press E.",
  },
];

const SUCCESS_LINE: DialogueLine[] = [
  {
    speaker: 'Thandiwe — Access Control',
    portrait: '😄',
    text: "Great smile! Here's your new student card — welcome to UCT.",
  },
];

interface Props {
  /** Called once, when the card is successfully issued, so the parent app can add it to inventory. */
  onMissionComplete: (item: InventoryItem) => void;
  /** Called when the player chooses to leave the completed mission and return to the map level. */
  onExitToMap: () => void;
}

export function OperationStudentCard({ onMissionComplete, onExitToMap }: Props) {
  const [stage, setStage] = useState<MissionStage>('intro');
  const [attempts, setAttempts] = useState(0);

  const handleInteract = useCallback(
    (id: PoiId) => {
      if (id === 'worker' && stage === 'explore_desk') setStage('dialogue_worker');
      if (id === 'chair' && stage === 'explore_booth') setStage('minigame');
    },
    [stage],
  );

  const handleWorkerDialogueDone = () => setStage('explore_booth');
  const handleMinigameWin = () => setStage('dialogue_result_win');
  const handleMinigameLose = () => {
    setAttempts((a) => a + 1);
    setStage('dialogue_result_lose');
  };

  const handleWinDialogueDone = () => {
    onMissionComplete({
      id: 'uct-student-card',
      name: 'UCT Student Card',
      description: 'Your official UCT student card. Grants access to buildings around campus.',
      icon: '🪪',
    });
    setStage('complete');
  };

  const handleLoseDialogueDone = () => setStage('explore_booth');

  const sceneVisible = stage !== 'intro' && stage !== 'complete';
  const sceneInteractionEnabled = stage === 'explore_desk' || stage === 'explore_booth';
  const highlight: PoiId | null =
    stage === 'explore_desk' ? 'worker' : stage === 'explore_booth' ? 'chair' : null;

  return (
    <div className="op-card">
      <header className="op-card__hud">
        <div className="op-card__title">
          <span className="op-card__eyebrow">Mission 1 of 4</span>
          Operation: Student Card
        </div>
        <div className="op-card__objective">{objectiveFor(stage)}</div>
      </header>

      {stage === 'intro' && <IntroCard onStart={() => setStage('explore_desk')} />}

      {sceneVisible && (
        <AccessControlScene
          onInteract={handleInteract}
          interactionEnabled={sceneInteractionEnabled}
          highlight={highlight}
        />
      )}

      {stage === 'dialogue_worker' && <DialogueBox lines={WORKER_INTRO} onComplete={handleWorkerDialogueDone} />}

      {stage === 'minigame' && (
        <PhotoBoothMinigame onWin={handleMinigameWin} onLose={handleMinigameLose} />
      )}

      {stage === 'dialogue_result_win' && <DialogueBox lines={SUCCESS_LINE} onComplete={handleWinDialogueDone} />}

      {stage === 'dialogue_result_lose' && <DialogueBox lines={RETAKE_LINE} onComplete={handleLoseDialogueDone} />}

      {stage === 'complete' && <CompleteCard attempts={attempts} onContinue={onExitToMap} />}
    </div>
  );
}

function objectiveFor(stage: MissionStage): string {
  switch (stage) {
    case 'intro':
      return 'Enter the Access Control Building';
    case 'explore_desk':
      return 'Find the front desk worker — press E to talk';
    case 'explore_booth':
      return 'Sit at the photobooth chair — press E to interact';
    case 'minigame':
      return 'Hold SPACE to keep the bar on the moving target';
    case 'complete':
      return 'Mission complete';
    default:
      return '';
  }
}

function IntroCard({ onStart }: { onStart: () => void }) {
  return (
    <div className="op-card__overlay">
      <div className="op-card__panel">
        <div className="op-card__panel-eyebrow">Mission 1 of 4</div>
        <h2>Operation: Student Card</h2>
        <p>
          Every first year needs a student card to get through the doors on campus. Head into the
          Access Control Building, find the front desk, and get your photo taken.
        </p>
        <ul className="op-card__controls">
          <li><span>WASD / Arrows</span>Move</li>
          <li><span>E</span>Interact / advance dialogue</li>
          <li><span>SPACE</span>Hold to rise in the photobooth, release to fall</li>
        </ul>
        <button className="op-card__btn" onClick={onStart}>
          Enter the building
        </button>
      </div>
    </div>
  );
}

function CompleteCard({ attempts, onContinue }: { attempts: number; onContinue: () => void }) {
  return (
    <div className="op-card__overlay">
      <div className="op-card__panel op-card__panel--complete">
        <div className="op-card__panel-eyebrow">Mission complete</div>
        <h2>🪪 UCT Student Card acquired</h2>
        <p>
          {attempts > 0
            ? `Took ${attempts + 1} tries, but it's a great photo now.`
            : 'First try, nice and easy.'}{' '}
          Your card has been added to your inventory.
        </p>
        <button className="op-card__btn" onClick={onContinue}>
          Return to the map
        </button>
      </div>
    </div>
  );
}
