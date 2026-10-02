import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackgroundScene,
  type InteractionZone,
  type SceneNpc,
} from '../scenes/BackgroundScene';
import { DialogueBox, type DialogueLine } from '../components/DialogueBox';
import { PhotoBoothMinigame } from '../components/PhotoBoothMinigame';
import type { InventoryItem, PhotoResult, StudentCardScene } from '../types/game';
import { usePlayer } from '../../../context/PlayerContext';
import { avatarById } from '../../../lib/avatars';

import introBg from '../assets/intro-scene.jfif';
import accessControlBg from '../assets/access-control-entrance.jfif';
import receptionBg from '../assets/card-services-reception.jfif';

import './OperationStudentCard.css';


const ACCESS_CONTROL_SPAWN = { x: 82, y: 87 };
const ACCESS_CONTROL_BOUNDS = { minX: 8, maxX: 94, minY: 62, maxY: 94 };
const ACCESS_CONTROL_DOOR_ZONE: InteractionZone = {
  id: 'accessControlDoor',
  x: 45,
  y: 62,
  radius: 12,
  label: 'Press E to enter Access Control',
};

const RECEPTION_INITIAL_SPAWN = { x: 50, y: 82 };
const RECEPTION_RETRY_SPAWN = { x: 30, y: 55 };
const RECEPTION_BOUNDS = { minX: 10, maxX: 90, minY: 42, maxY: 88 };

const RECEPTIONIST_ZONE: InteractionZone = {
  id: 'receptionist',
  x: 51,
  y: 47,
  radius: 11,
  label: 'Press E to talk to the receptionist',
};

const PHOTOBOOTH_CHAIR_ZONE: InteractionZone = {
  id: 'photoboothChair',
  x: 17,
  y: 41,
  radius: 10,
  label: 'Press E to take your student card photo',
};


const PLAYER_INTRO_LINES: DialogueLine[] = [
  {
    speaker: 'You',
    portrait: '🧑\u200d🎓',
    text: "I guess it's time to head to lib—OH NO! I lost my student card!",
  },
  {
    speaker: 'You',
    portrait: '🧑\u200d🎓',
    text: 'I need my student card to access the library and other access-controlled facilities on campus!',
  },
  {
    speaker: 'You',
    portrait: '🧑\u200d🎓',
    text: "I'm going to head to the Access Control entrance and get a replacement student card.",
  },
];

const RECEPTIONIST_INTRO_LINES: DialogueLine[] = [
  {
    speaker: 'Receptionist — Card Services',
    portrait: '🧑\u200d💼',
    text: "Hi there. If you're here to get a new student card, head over to the photobooth to take a new student card photograph.",
  },
];

const RECEPTIONIST_SUCCESS_LINES: DialogueLine[] = [
  {
    speaker: 'Receptionist — Card Services',
    portrait: '😄',
    text: "This is a great photo! Here's your new student card—make sure to look after it.",
  },
];

const RECEPTIONIST_FAILURE_LINES: DialogueLine[] = [
  {
    speaker: 'Receptionist — Card Services',
    portrait: '🧑\u200d💼',
    text: "Oh no—you pulled a funny face. We'll have to retake your photograph.",
  },
];


const RECEPTIONIST_NPC: SceneNpc = {
  id: RECEPTIONIST_ZONE.id,
  x: RECEPTIONIST_ZONE.x,
  y: RECEPTIONIST_ZONE.y - 4,
  emoji: '🧑\u200d💼',
};
void RECEPTIONIST_NPC; 

function objectiveFor(scene: StudentCardScene, dialogueOpen: boolean): string {
  if (dialogueOpen) return 'Press E to continue the dialogue';
  switch (scene) {
    case 'introCard':
      return 'Get a replacement student card';
    case 'intro':
      return "You've lost your student card — head to Access Control";
    case 'accessControlEntrance':
      return 'Walk to the glass doors and press E to enter';
    case 'cardServicesReception':
      return 'Talk to the receptionist, then use the photobooth';
    case 'photoMinigame':
      return 'Hold SPACE to keep the bar on the moving target';
    case 'complete':
      return 'Mission complete';
  }
}
interface Props {
  onMissionComplete: (item: InventoryItem) => void;
  onExitToMap: () => void;
}


interface PendingDialogue {
  id: number;
  lines: DialogueLine[];
  onDone: () => void;
}


export function OperationStudentCard({ onMissionComplete, onExitToMap }: Props) {
  const { profile } = usePlayer();
  const playerSprites = avatarById(profile?.selected_avatar).sprites;
  const [scene, setScene] = useState<StudentCardScene>('introCard');
  const [photoResult, setPhotoResult] = useState<PhotoResult>('none');
  const [attempts, setAttempts] = useState(0);
  const [dialogue, setDialogue] = useState<PendingDialogue | null>(null);
  const accessControlZones = useMemo(() => [ACCESS_CONTROL_DOOR_ZONE], []);
  const receptionZones = useMemo(
    () => [RECEPTIONIST_ZONE, PHOTOBOOTH_CHAIR_ZONE],
    [],
  );

  const dialogueIdRef = useRef(0);
  const openDialogue = useCallback((lines: DialogueLine[], onDone: () => void) => {
    dialogueIdRef.current += 1;
    setDialogue({ id: dialogueIdRef.current, lines, onDone });
  }, []);
  const closeDialogue = useCallback(() => setDialogue(null), []);

  useEffect(() => {
    if (scene !== 'intro') return;
   
    const t = window.setTimeout(() => {
      openDialogue(PLAYER_INTRO_LINES, () => {
        closeDialogue();
        setScene('accessControlEntrance');
      });
    }, 350);
    return () => window.clearTimeout(t);
  }, [scene, openDialogue, closeDialogue]);

  useEffect(() => {
    if (scene !== 'cardServicesReception') return;
    if (photoResult === 'success') {
      openDialogue(RECEPTIONIST_SUCCESS_LINES, () => {
        closeDialogue();
    
        onMissionComplete({
          id: 'uct-student-card',
          name: 'UCT Student Card',
          description:
            'Your official UCT student card. Grants access to buildings around campus.',
          icon: '🪪',
        });
        setScene('complete');
      });
    } else if (photoResult === 'failure') {
      openDialogue(RECEPTIONIST_FAILURE_LINES, () => {
        closeDialogue();

        setPhotoResult('none');
      });
    }

  }, [scene, photoResult]);

  const handleAccessControlInteract = useCallback((id: string) => {
    if (id === ACCESS_CONTROL_DOOR_ZONE.id) {
      setScene('cardServicesReception');
    }
  }, []);

  const handleReceptionInteract = useCallback(
    (id: string) => {
      if (id === RECEPTIONIST_ZONE.id) {
        openDialogue(RECEPTIONIST_INTRO_LINES, closeDialogue);
      } else if (id === PHOTOBOOTH_CHAIR_ZONE.id) {
        setScene('photoMinigame');
      }
    },
    [openDialogue, closeDialogue],
  );


  const handleMinigameWin = useCallback(() => {
    setPhotoResult('success');
    setScene('cardServicesReception');
  }, []);
  const handleMinigameLose = useCallback(() => {
    setAttempts((a) => a + 1);
    setPhotoResult('failure');
    setScene('cardServicesReception');
  }, []);


  const receptionSpawn =
    photoResult === 'failure' ? RECEPTION_RETRY_SPAWN : RECEPTION_INITIAL_SPAWN;
  const receptionKey = `reception-${photoResult}`;

  const dialogueOpen = dialogue !== null;

  return (
    <div className="op-card">
      <header className="op-card__hud">
        <div className="op-card__title">
          <span className="op-card__eyebrow">MISSION 4 — OPERATION STUDENT CARD</span>
          Operation: Student Card
        </div>
      </header>

      <div className="op-card__stage">
        {scene === 'introCard' && <IntroCard onStart={() => setScene('intro')} />}

        {scene === 'intro' && (
          <BackgroundScene
            backgroundSrc={introBg}
            playerSprites={playerSprites}
            spawn={{ x: 50, y: 88 }}
            bounds={{ minX: 45, maxX: 55, minY: 85, maxY: 90 }}
            interactionEnabled={false}
            onInteract={() => {}}
          />
        )}

        {scene === 'accessControlEntrance' && (
          <BackgroundScene
            backgroundSrc={accessControlBg}
            playerSprites={playerSprites}
            spawn={ACCESS_CONTROL_SPAWN}
            bounds={ACCESS_CONTROL_BOUNDS}
            zones={accessControlZones}
            interactionEnabled={!dialogueOpen}
            onInteract={handleAccessControlInteract}
          />
        )}

        {scene === 'cardServicesReception' && (
          <BackgroundScene
            key={receptionKey}
            backgroundSrc={receptionBg}
            playerSprites={playerSprites}
            spawn={receptionSpawn}
            bounds={RECEPTION_BOUNDS}
            zones={receptionZones}
            interactionEnabled={!dialogueOpen}
            onInteract={handleReceptionInteract}
          />
        )}

        {scene === 'photoMinigame' && (

          <PhotoBoothMinigame onWin={handleMinigameWin} onLose={handleMinigameLose} />
        )}

        {scene === 'complete' && (
          <CompleteCard attempts={attempts} onContinue={onExitToMap} />
        )}

        {dialogue && (
          <DialogueBox key={dialogue.id} lines={dialogue.lines} onComplete={dialogue.onDone} />
        )}

        {!dialogueOpen && scene !== 'introCard' && scene !== 'complete' && (
          <div className="op-card__objective">{objectiveFor(scene, dialogueOpen)}</div>
        )}
      </div>
    </div>
  );
}


function IntroCard({ onStart }: { onStart: () => void }) {
  return (
    <div className="op-card__overlay">
      <div className="op-card__panel">
        <div className="op-card__panel-eyebrow">MISSION 4 — OPERATION STUDENT CARD</div>
        <h2>Operation: Student Card</h2>
        <p>
          You've misplaced your student card and can't get into any of the
          access-controlled buildings on campus. Head over to Access Control,
          talk to the receptionist, and get a new one issued at the photobooth.
        </p>
        <ul className="op-card__controls">
          <li><span>WASD / Arrows</span>Move</li>
          <li><span>E</span>Interact / advance dialogue</li>
          <li><span>SPACE</span>Hold to rise in the photobooth, release to fall</li>
        </ul>
        <button className="op-card__btn" onClick={onStart}>
          Start the mission
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
            ? `Took ${attempts + 1} tries at the photobooth, but it's a great photo now.`
            : 'Nailed the photo on the first try.'}{' '}
          Your card has been added to your inventory.
        </p>
        <button className="op-card__btn" onClick={onContinue}>
          Return to the map
        </button>
      </div>
    </div>
  );
}
