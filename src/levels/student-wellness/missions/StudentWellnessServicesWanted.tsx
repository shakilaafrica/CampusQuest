/**
 * GenAI DECLARATION: GenAI (ChatGPT) was used to assist in rewriting and
 * integrating portions of this code, particularly the mission flow, scene
 * transitions, interaction handling, and dialogue logic. The AI-assisted
 * code was reviewed, integrated, and tested by the team.
 */


import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackgroundScene, type InteractionZone, type SceneNpc } from '../scenes/BackgroundScene';
import { DialogueBox, type DialogueLine } from '../components/DialogueBox';
import { CardSwipeMinigame } from '../components/CardSwipeMinigame';
import { WaitingRoomMinigame } from '../components/WaitingRoomMinigame';

import steveBikoBg from '../assets/steve-biko-background.jfif';
import gateBg from '../assets/ivan-toms-gate.jfif';
import buildingBg from '../assets/ivan-toms-building.jfif';
import receptionBg from '../assets/ivan-toms-reception.jfif';
import minigameBg from '../assets/student-wellness-minigame-background.jfif';

import kirahSprite from '../assets/kirah.png';

import { usePlayer } from '../../../context/PlayerContext';
import { avatarById } from '../../../lib/avatars';
import './StudentWellnessServicesWanted.css';


type Scene =
  | 'intro'       
  | 'steveBiko'  
  | 'gate'       
  | 'cardSwipe'   
  | 'building'  
  | 'reception'   
  | 'minigame'    
  | 'success'     
  | 'complete';   


const STEVE_BIKO_SPAWN = { x: 18, y: 90 };
const STEVE_BIKO_BOUNDS = { minX: 6, maxX: 94, minY: 66, maxY: 94 };
const STEVE_BIKO_KIRAH: SceneNpc = {
  id: 'kirah',
  x: 62,
  y: 85,
  spriteUrl: kirahSprite,
  heightPct: 22,
  interactionLabel: 'Press E to talk to Kirah',
  interactionRadius: 13,
};

const GATE_SPAWN = { x: 60, y: 88 };
const GATE_BOUNDS = { minX: 6, maxX: 94, minY: 55, maxY: 94 };
const GATE_ZONE: InteractionZone = {
  id: 'accessControl',
  x: 27,
  y: 66,
  radius: 12,
  label: 'Press E to swipe your student card',
};
const GATE_KIRAH: SceneNpc = {
  id: 'kirah',
  x: 82,
  y: 82,
  spriteUrl: kirahSprite,
  heightPct: 20,
  interactionLabel: 'Press E to talk to Kirah',
  interactionRadius: 11,
};

const BUILDING_SPAWN = { x: 62, y: 92 };
const BUILDING_BOUNDS = { minX: 6, maxX: 94, minY: 55, maxY: 94 };
const BUILDING_ZONE: InteractionZone = {
  id: 'stairsApproach',
  x: 35,
  y: 82,
  radius: 13,
  label: 'Press E to enter Ivan Toms',
};
const BUILDING_KIRAH: SceneNpc = {
  id: 'kirah',
  x: 82,
  y: 84,
  spriteUrl: kirahSprite,
  heightPct: 20,
  interactionLabel: 'Press E to talk to Kirah',
  interactionRadius: 11,
};

const RECEPTION_SPAWN = { x: 42, y: 88 };
const RECEPTION_BOUNDS = { minX: 8, maxX: 92, minY: 55, maxY: 94 };
const RECEPTION_ZONE: InteractionZone = {
  id: 'receptionDesk',
  x: 50,
  y: 55,
  radius: 12,
  label: 'Press E to talk to the receptionist',
};
const RECEPTION_KIRAH: SceneNpc = {
  id: 'kirah',
  x: 82,
  y: 82,
  spriteUrl: kirahSprite,
  heightPct: 20,
  interactionLabel: 'Press E to talk to Kirah',
  interactionRadius: 11,
};


const SUCCESS_SPAWN = { x: 36, y: 88 };
const SUCCESS_BOUNDS = { minX: 20, maxX: 80, minY: 60, maxY: 94 };
const SUCCESS_KIRAH: SceneNpc = {
  id: 'kirah',
  x: 56,
  y: 88,
  spriteUrl: kirahSprite,
  heightPct: 30,
};


const KIRAH_INTRO_LINES: DialogueLine[] = [
  {
    speaker: 'Kirah',
    portrait: '🧕',
    text: "I'm not feeling well, and I was hoping you could help me get to the other Student Wellness Service clinic at Ivan Toms. The Steve Biko clinic is full.",
  },
  {
    speaker: 'Kirah',
    portrait: '🧕',
    text: "Let's take the shuttle and head to the clinic. It's near Lower Campus.",
  },
];

const KIRAH_GATE_HINT: DialogueLine[] = [
  {
    speaker: 'Kirah',
    portrait: '🧕',
    text: 'If you scan your student card at the access control system, we can enter through the gate.',
  },
];

const KIRAH_BUILDING_HINT: DialogueLine[] = [
  {
    speaker: 'Kirah',
    portrait: '🧕',
    text: "Let's head up the stairs together to enter the clinic.",
  },
];

const KIRAH_RECEPTION_HINT: DialogueLine[] = [
  {
    speaker: 'Kirah',
    portrait: '🧕',
    text: 'Could you ask the receptionist if I could see the doctor, please?',
  },
];

const RECEPTIONIST_LINES: DialogueLine[] = [
  {
    speaker: 'Reception — Ivan Toms Clinic',
    portrait: '🧑\u200d⚕️',
    text: 'Welcome to Student Wellness Services. Have a seat in the waiting room and the doctor will call Kirah\u2019s name shortly.',
  },
  {
    speaker: 'Reception — Ivan Toms Clinic',
    portrait: '🧑\u200d⚕️',
    text: 'Only raise your hand when you hear HER name — the doctor won\u2019t appreciate it otherwise.',
  },
];

const RECEPTIONIST_WRONG_NAME_LINES: DialogueLine[] = [
  {
    speaker: 'Reception — Ivan Toms Clinic',
    portrait: '🧑‍⚕️',
    text: 'That appointment was not for Kirah - you will have to try again.',
  },
];

const DOCTOR_MISSED_TARGET_LINES: DialogueLine[] = [
  {
    speaker: 'Doctor',
    portrait: '🩺',
    text: "Well, that's all my patients for now. I'll see the rest of my patients when I return from my break.",
  },
];

const KIRAH_THANKS_LINES: DialogueLine[] = [
  {
    speaker: 'Kirah',
    portrait: '🧕',
    text: 'Thank you so much for helping me! You are a lifesaver.',
  },
];


function objectiveFor(scene: Scene, dialogueOpen: boolean): string {
  if (dialogueOpen) return 'Press E to continue the dialogue';
  switch (scene) {
    case 'intro':
      return 'Meet Kirah at the Steve Biko clinic';
    case 'steveBiko':
      return 'Walk over to Kirah — press E to talk';
    case 'gate':
      return 'Swipe your card at the access-control machine';
    case 'cardSwipe':
      return 'Swipe your student card through the reader';
    case 'building':
      return 'Head up the stairs into Ivan Toms';
    case 'reception':
      return 'Talk to the receptionist at the counter';
    case 'minigame':
      return "Raise your hand only when the doctor calls Kirah's name";
    case 'success':
      return 'Kirah is checked in — hear her out';
    case 'complete':
      return 'Mission complete';
  }
}

interface Props {
  onMissionComplete: () => void;
  onExitToMap: () => void;
}


interface PendingDialogue {
  id: number;
  lines: DialogueLine[];
  onDone: () => void;
}

export function StudentWellnessServicesWanted({ onMissionComplete, onExitToMap }: Props) {
  const { profile } = usePlayer();
  const playerSprites = avatarById(profile?.selected_avatar).sprites;
  const [scene, setScene] = useState<Scene>('intro');
  const [dialogue, setDialogue] = useState<PendingDialogue | null>(null);
  const [failCount, setFailCount] = useState(0);

  const gateZones = useMemo(() => [GATE_ZONE], []);
  const gateNpcs = useMemo(() => [GATE_KIRAH], []);
  const buildingZones = useMemo(() => [BUILDING_ZONE], []);
  const buildingNpcs = useMemo(() => [BUILDING_KIRAH], []);
  const receptionZones = useMemo(() => [RECEPTION_ZONE], []);
  const receptionNpcs = useMemo(() => [RECEPTION_KIRAH], []);
  const steveBikoNpcs = useMemo(() => [STEVE_BIKO_KIRAH], []);
  const successNpcs = useMemo(() => [SUCCESS_KIRAH], []);

  const dialogueIdRef = useRef(0);
  const openDialogue = useCallback((lines: DialogueLine[], onDone: () => void) => {
    dialogueIdRef.current += 1;
    setDialogue({ id: dialogueIdRef.current, lines, onDone });
  }, []);

  const closeDialogue = useCallback(() => setDialogue(null), []);

  const handleSteveBikoInteract = useCallback((id: string) => {
    if (id === 'kirah') {
      openDialogue(KIRAH_INTRO_LINES, () => {
        closeDialogue();
        setScene('gate');
      });
    }
  }, [openDialogue, closeDialogue]);

  const handleGateInteract = useCallback((id: string) => {
    if (id === GATE_ZONE.id) {
      setScene('cardSwipe');
    } else if (id === 'kirah') {
      openDialogue(KIRAH_GATE_HINT, closeDialogue);
    }
  }, [openDialogue, closeDialogue]);

  const handleBuildingInteract = useCallback((id: string) => {
    if (id === BUILDING_ZONE.id) {
      setScene('reception');
    } else if (id === 'kirah') {
      openDialogue(KIRAH_BUILDING_HINT, closeDialogue);
    }
  }, [openDialogue, closeDialogue]);

  const handleReceptionInteract = useCallback((id: string) => {
    if (id === RECEPTION_ZONE.id) {
      openDialogue(RECEPTIONIST_LINES, () => {
        closeDialogue();
        setScene('minigame');
      });
    } else if (id === 'kirah') {
      openDialogue(KIRAH_RECEPTION_HINT, closeDialogue);
    }
  }, [openDialogue, closeDialogue]);

  const handleCardSwipeSuccess = useCallback(() => setScene('building'), []);

  const handleMinigameWin = useCallback(() => setScene('success'), []);

  const handleFailWrongName = useCallback(() => {

    setFailCount((c) => c + 1);
    setScene('reception');
    openDialogue(RECEPTIONIST_WRONG_NAME_LINES, closeDialogue);
  }, [openDialogue, closeDialogue]);

  const handleFailMissedTarget = useCallback(() => {

    openDialogue(DOCTOR_MISSED_TARGET_LINES, () => {
      closeDialogue();
      setFailCount((c) => c + 1);
      setScene('reception');
    });
  }, [openDialogue, closeDialogue]);

  useEffect(() => {
    if (scene !== 'success') return;
    const t = window.setTimeout(() => {
      openDialogue(KIRAH_THANKS_LINES, () => {
        closeDialogue();
        onMissionComplete();
        setScene('complete');
      });
    }, 700);
    return () => window.clearTimeout(t);
  }, [scene, openDialogue, closeDialogue, onMissionComplete]);

  const dialogueOpen = dialogue !== null;

  return (
    <div className="sws-mission">
      <header className="sws-mission__hud">
        <div className="sws-mission__title">
          <span className="sws-mission__eyebrow">MISSION 2 — STUDENT WELLNESS</span>
          Student Wellness Services Wanted
        </div>
        <div className="sws-mission__objective">{objectiveFor(scene, dialogueOpen)}</div>
      </header>

      <div className="sws-mission__stage">
        {scene === 'intro' && <IntroCard onStart={() => setScene('steveBiko')} />}

        {scene === 'steveBiko' && (
          <BackgroundScene
            backgroundSrc={steveBikoBg}
            playerSprites={playerSprites}
            spawn={STEVE_BIKO_SPAWN}
            bounds={STEVE_BIKO_BOUNDS}
            npcs={steveBikoNpcs}
            interactionEnabled={!dialogueOpen}
            onInteract={handleSteveBikoInteract}
          />
        )}

        {scene === 'gate' && (
          <BackgroundScene
            backgroundSrc={gateBg}
            playerSprites={playerSprites}
            spawn={GATE_SPAWN}
            bounds={GATE_BOUNDS}
            zones={gateZones}
            npcs={gateNpcs}
            interactionEnabled={!dialogueOpen}
            onInteract={handleGateInteract}
          />
        )}

        {scene === 'cardSwipe' && (
          <>
            {/* Keep the gate scene visible beneath the swipe overlay so the
                transition doesn't cut to a plain colour. Both movement and E
                are frozen because interactionEnabled is false. */}
            <BackgroundScene
              backgroundSrc={gateBg}
              playerSprites={playerSprites}
              spawn={{ x: GATE_ZONE.x + 4, y: GATE_ZONE.y + 8 }}
              bounds={GATE_BOUNDS}
              npcs={gateNpcs}
              interactionEnabled={false}
              onInteract={() => {}}
            />
            <CardSwipeMinigame onSuccess={handleCardSwipeSuccess} />
          </>
        )}

        {scene === 'building' && (
          <BackgroundScene
            backgroundSrc={buildingBg}
            playerSprites={playerSprites}
            spawn={BUILDING_SPAWN}
            bounds={BUILDING_BOUNDS}
            zones={buildingZones}
            npcs={buildingNpcs}
            interactionEnabled={!dialogueOpen}
            onInteract={handleBuildingInteract}
          />
        )}

        {scene === 'reception' && (
          <BackgroundScene
            backgroundSrc={receptionBg}
            playerSprites={playerSprites}
            spawn={RECEPTION_SPAWN}
            bounds={RECEPTION_BOUNDS}
            zones={receptionZones}
            npcs={receptionNpcs}
            interactionEnabled={!dialogueOpen}
            onInteract={handleReceptionInteract}
          />
        )}

        {scene === 'minigame' && (
          <WaitingRoomMinigame
            key={failCount}
            targetName="Kirah"
            onWin={handleMinigameWin}
            onFailWrongName={handleFailWrongName}
            onFailMissedTarget={handleFailMissedTarget}
          />
        )}

        {scene === 'success' && (
          <BackgroundScene
            backgroundSrc={minigameBg}
            playerSprites={playerSprites}
            spawn={SUCCESS_SPAWN}
            bounds={SUCCESS_BOUNDS}
            npcs={successNpcs}
            interactionEnabled={false}
            onInteract={() => {}}
          />
        )}

        {scene === 'complete' && (
          <CompleteCard failCount={failCount} onContinue={onExitToMap} />
        )}

        {dialogue && (
          <DialogueBox key={dialogue.id} lines={dialogue.lines} onComplete={dialogue.onDone} />
        )}
      </div>
    </div>
  );
}


function IntroCard({ onStart }: { onStart: () => void }) {
  return (
    <div className="sws-mission__overlay">
      <div className="sws-mission__panel">
        <div className="sws-mission__panel-eyebrow">MISSION 2 — STUDENT WELLNESS</div>
        <h2>Student Wellness Services Wanted</h2>
        <p>
          Kirah isn&rsquo;t well and the Steve Biko clinic is full. Find her outside
          Steve Biko, take the shuttle down to Ivan Toms, and see her through to the
          doctor.
        </p>
        <ul className="sws-mission__controls">
          <li><span>WASD / Arrows</span>Move</li>
          <li><span>E</span>Interact / advance dialogue</li>
          <li><span>Click + drag</span>Swipe your card through the reader</li>
          <li><span>Click</span>Raise your hand when Kirah&rsquo;s name is called</li>
        </ul>
        <button type="button" className="sws-mission__btn" onClick={onStart}>
          Find Kirah at Steve Biko
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
            ? 'Took a couple of tries in the waiting room, but Kirah is with the doctor.'
            : 'Smooth run — Kirah was called and you were right there. She\u2019s with the doctor now.'}
        </p>
        <button type="button" className="sws-mission__btn" onClick={onContinue}>
          Return to the map
        </button>
      </div>
    </div>
  );
}
