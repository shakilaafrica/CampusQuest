import { useCallback, useState } from 'react';
import { TopDownScene, type ScenePoi } from '../scenes/TopDownScene';
import { DialogueBox, type DialogueLine } from '../components/DialogueBox';
import { CardSwipeMinigame } from '../components/CardSwipeMinigame';
import { WaitingRoomMinigame } from '../components/WaitingRoomMinigame';
import './StudentWellnessServicesWanted.css';

type Stage =
  | 'intro'
  | 'find_kirah'
  | 'dialogue_kirah_request'
  | 'navigate_gate'
  | 'card_swipe'
  | 'dialogue_gate_opened'
  | 'navigate_building'
  | 'building_interior'
  | 'dialogue_receptionist'
  | 'waiting_minigame'
  | 'dialogue_fail'
  | 'dialogue_kirah_thanks'
  | 'complete';

type Location = 'courtyard' | 'gate' | 'path' | 'clinic';

const COURTYARD_POIS: ScenePoi[] = [{ id: 'kirah', x: 55, y: 55, label: 'Talk to Kirah', emoji: '🧕' }];
const GATE_POIS: ScenePoi[] = [{ id: 'gate', x: 55, y: 50, label: 'Swipe your card', emoji: '🚪' }];
const PATH_POIS: ScenePoi[] = [{ id: 'building_entrance', x: 55, y: 35, label: 'Enter the building', emoji: '🏥' }];
const CLINIC_POIS: ScenePoi[] = [{ id: 'receptionist', x: 76, y: 32, label: 'Talk to the receptionist', emoji: '🧑\u200d⚕️' }];

const KIRAH_REQUEST: DialogueLine[] = [
  {
    speaker: 'Kirah',
    portrait: '🧕',
    text: 'Hey! I need to go to the SWS clinic at Ivan Toms — can you help me get there?',
  },
];

const GATE_SUCCESS_LINE: DialogueLine[] = [
  { speaker: 'Access Control', portrait: '🔓', text: 'Access granted. The gate slides open.' },
];

const RECEPTIONIST_LINE: DialogueLine[] = [
  {
    speaker: 'Reception — Ivan Toms Clinic',
    portrait: '🧑\u200d⚕️',
    text: "You can have a seat and wait — I'll call Kirah's name when the doctor is ready.",
  },
];

const KIRAH_THANKS: DialogueLine[] = [
  { speaker: 'Kirah', portrait: '🧕', text: 'Thank you so much for helping me get here!' },
];

function locationForStage(stage: Stage): Location {
  switch (stage) {
    case 'find_kirah':
    case 'dialogue_kirah_request':
      return 'courtyard';
    case 'navigate_gate':
    case 'card_swipe':
    case 'dialogue_gate_opened':
      return 'gate';
    case 'navigate_building':
      return 'path';
    case 'building_interior':
    case 'dialogue_receptionist':
    case 'waiting_minigame':
    case 'dialogue_fail':
    case 'dialogue_kirah_thanks':
    default:
      return 'clinic';
  }
}

function objectiveFor(stage: Stage): string {
  switch (stage) {
    case 'intro':
      return 'Find Kirah on campus';
    case 'find_kirah':
      return 'Find Kirah — press E to talk';
    case 'navigate_gate':
      return 'Navigate to Lower Campus and reach the SWS gate';
    case 'card_swipe':
      return 'Swipe your student card to open the gate';
    case 'navigate_building':
      return 'Enter the Ivan Toms building';
    case 'building_interior':
      return 'Find the receptionist — press E to talk';
    case 'waiting_minigame':
      return "Raise your hand when the doctor calls Kirah's name";
    case 'complete':
      return 'Mission complete';
    default:
      return '';
  }
}

interface Props {
  onMissionComplete: () => void;
  onExitToMap: () => void;
}

export function StudentWellnessServicesWanted({ onMissionComplete, onExitToMap }: Props) {
  const [stage, setStage] = useState<Stage>('intro');
  const [failLine, setFailLine] = useState<DialogueLine[] | null>(null);
  const [failCount, setFailCount] = useState(0);

  const handleInteract = useCallback(
    (id: string) => {
      if (stage === 'find_kirah' && id === 'kirah') setStage('dialogue_kirah_request');
      else if (stage === 'navigate_gate' && id === 'gate') setStage('card_swipe');
      else if (stage === 'navigate_building' && id === 'building_entrance') setStage('building_interior');
      else if (stage === 'building_interior' && id === 'receptionist') setStage('dialogue_receptionist');
    },
    [stage],
  );

  const handleWaitingFailWrongName = (calledName: string) => {
    setFailCount((c) => c + 1);
    setFailLine([
      { speaker: 'Doctor', portrait: '🩺', text: `You're not ${calledName} — you need to wait your turn.` },
    ]);
    setStage('dialogue_fail');
  };

  const handleWaitingFailMissedTarget = () => {
    setFailCount((c) => c + 1);
    setFailLine([{ speaker: 'Doctor', portrait: '🩺', text: 'Since Kirah is not here, I am going on break.' }]);
    setStage('dialogue_fail');
  };

  const handleThanksDone = () => {
    onMissionComplete();
    setStage('complete');
  };

  const location = locationForStage(stage);
  const sceneVisible = stage !== 'intro' && stage !== 'complete';
  const interactionEnabled =
    stage === 'find_kirah' || stage === 'navigate_gate' || stage === 'navigate_building' || stage === 'building_interior';
  const highlight =
    stage === 'find_kirah' ? 'kirah'
    : stage === 'navigate_gate' ? 'gate'
    : stage === 'navigate_building' ? 'building_entrance'
    : stage === 'building_interior' ? 'receptionist'
    : null;

  return (
    <div className="sws-mission">
      <header className="sws-mission__hud">
        <div className="sws-mission__title">
          <span className="sws-mission__eyebrow">Mission 2 of 4</span>
          Student Wellness Services Wanted
        </div>
        <div className="sws-mission__objective">{objectiveFor(stage)}</div>
      </header>

      {stage === 'intro' && <IntroCard onStart={() => setStage('find_kirah')} />}

      {sceneVisible && (
        <>
          {location === 'courtyard' && (
            <TopDownScene
              pois={COURTYARD_POIS}
              onInteract={handleInteract}
              interactionEnabled={interactionEnabled}
              highlight={highlight}
              signLabel="Upper Campus Courtyard"
              variant="outdoor"
              spawn={{ x: 10, y: 65 }}
            />
          )}
          {location === 'gate' && (
            <TopDownScene
              pois={GATE_POIS}
              onInteract={handleInteract}
              interactionEnabled={interactionEnabled}
              highlight={highlight}
              signLabel="Lower Campus — SWS Access Gate"
              variant="gate"
              spawn={{ x: 10, y: 65 }}
              decorations={<GateGraphic open={stage === 'dialogue_gate_opened'} />}
            />
          )}
          {location === 'path' && (
            <TopDownScene
              pois={PATH_POIS}
              onInteract={handleInteract}
              interactionEnabled={interactionEnabled}
              highlight={highlight}
              signLabel="Ivan Toms Building — SWS Clinic"
              variant="outdoor"
              spawn={{ x: 55, y: 85 }}
            />
          )}
          {location === 'clinic' && (
            <TopDownScene
              pois={CLINIC_POIS}
              onInteract={handleInteract}
              interactionEnabled={interactionEnabled}
              highlight={highlight}
              signLabel="SWS Clinic — Waiting Room"
              variant="clinic"
              spawn={{ x: 15, y: 70 }}
            />
          )}
        </>
      )}

      {stage === 'dialogue_kirah_request' && (
        <DialogueBox lines={KIRAH_REQUEST} onComplete={() => setStage('navigate_gate')} />
      )}

      {stage === 'card_swipe' && <CardSwipeMinigame onSuccess={() => setStage('dialogue_gate_opened')} />}

      {stage === 'dialogue_gate_opened' && (
        <DialogueBox lines={GATE_SUCCESS_LINE} onComplete={() => setStage('navigate_building')} />
      )}

      {stage === 'dialogue_receptionist' && (
        <DialogueBox lines={RECEPTIONIST_LINE} onComplete={() => setStage('waiting_minigame')} />
      )}

      {stage === 'waiting_minigame' && (
        <WaitingRoomMinigame
          targetName="Kirah"
          onWin={() => setStage('dialogue_kirah_thanks')}
          onFailWrongName={handleWaitingFailWrongName}
          onFailMissedTarget={handleWaitingFailMissedTarget}
        />
      )}

      {stage === 'dialogue_fail' && failLine && (
        <DialogueBox lines={failLine} onComplete={() => setStage('building_interior')} />
      )}

      {stage === 'dialogue_kirah_thanks' && <DialogueBox lines={KIRAH_THANKS} onComplete={handleThanksDone} />}

      {stage === 'complete' && <CompleteCard failCount={failCount} onContinue={onExitToMap} />}
    </div>
  );
}

function GateGraphic({ open }: { open: boolean }) {
  return (
    <div className="gate-graphic" data-open={open} style={{ left: '55%', top: '50%' }}>
      <div className="gate-graphic__panel gate-graphic__panel--left" />
      <div className="gate-graphic__panel gate-graphic__panel--right" />
    </div>
  );
}

function IntroCard({ onStart }: { onStart: () => void }) {
  return (
    <div className="sws-mission__overlay">
      <div className="sws-mission__panel">
        <div className="sws-mission__panel-eyebrow">Mission 2 of 4</div>
        <h2>Student Wellness Services Wanted</h2>
        <p>
          Kirah needs to get to the SWS clinic at Ivan Toms. Find her, escort her through the Lower
          Campus access gate, and help her check in with the receptionist.
        </p>
        <ul className="sws-mission__controls">
          <li><span>WASD / Arrows</span>Move</li>
          <li><span>E</span>Interact / advance dialogue</li>
          <li><span>Click + drag</span>Swipe your card through the reader</li>
          <li><span>Click</span>Raise your hand when Kirah's name is called</li>
        </ul>
        <button className="sws-mission__btn" onClick={onStart}>
          Find Kirah
        </button>
      </div>
    </div>
  );
}

function CompleteCard({ failCount, onContinue }: { failCount: number; onContinue: () => void }) {
  return (
    <div className="sws-mission__overlay">
      <div className="sws-mission__panel sws-mission__panel--complete">
        <div className="sws-mission__panel-eyebrow">Mission complete</div>
        <h2>🩺 Kirah is checked in</h2>
        <p>
          {failCount > 0
            ? `Took a couple of tries in the waiting room, but Kirah's all set.`
            : 'Smooth run — Kirah is checked in and waiting for the doctor.'}
        </p>
        <button className="sws-mission__btn" onClick={onContinue}>
          Return to the map
        </button>
      </div>
    </div>
  );
}
