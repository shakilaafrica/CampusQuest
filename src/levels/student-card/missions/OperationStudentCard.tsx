import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackgroundScene,
  type InteractionZone,
  type SceneNpc,
} from '../scenes/BackgroundScene';
import { DialogueBox, type DialogueLine } from '../components/DialogueBox';
import { PhotoBoothMinigame } from '../components/PhotoBoothMinigame';
import type { InventoryItem, PhotoResult, StudentCardScene } from '../types/game';

import introBg from '../assets/intro-scene.jfif';
import accessControlBg from '../assets/access-control-entrance.jfif';
import receptionBg from '../assets/card-services-reception.jfif';

import './OperationStudentCard.css';

// -----------------------------------------------------------------------------
// Per-scene layout — spawn positions, movement bounds, environment zones, and
// NPCs. All coordinates are percentages of the scene's width and height so
// zones stay aligned with their visual targets when the viewport is resized.
// -----------------------------------------------------------------------------

// --- Access Control entrance -------------------------------------------------
// The Access Control Services building fills most of the frame. The main
// glass doors sit slightly left of centre; the "Access Control Services"
// sign is immediately to the right of the doors. Player spawns on the
// right-hand side of the paved foreground so they have to walk over to the
// doors and press E — they never spawn inside the door zone.
const ACCESS_CONTROL_SPAWN = { x: 82, y: 87 };
const ACCESS_CONTROL_BOUNDS = { minX: 8, maxX: 94, minY: 62, maxY: 94 };
const ACCESS_CONTROL_DOOR_ZONE: InteractionZone = {
  id: 'accessControlDoor',
  x: 45,
  y: 62,
  radius: 12,
  label: 'Press E to enter Access Control',
};

// --- Card Services reception -------------------------------------------------
// The reception counter spans the upper-middle of the frame with the
// receptionist seated behind its centre section. The photobooth (backdrop,
// stool, tripod camera) sits in the upper-left corner. Waiting chairs are
// along the lower-left; the entrance doors are at lower-centre. Movement is
// clamped to the visible floor so the player can't walk through the counter
// or off the sides of the room.
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

// -----------------------------------------------------------------------------
// Dialogue lines
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// NPCs
// -----------------------------------------------------------------------------
const RECEPTIONIST_NPC: SceneNpc = {
  id: RECEPTIONIST_ZONE.id,
  // The receptionist is already drawn into the reception background art at
  // approximately this location, so we do NOT render a separate emoji sprite
  // on top of her (that would double her up). Instead we anchor the
  // interaction zone here through the plain `zones` list and skip the NPC
  // sprite entirely. Kept as documentation only — see `receptionZones`
  // below for the actual zone wiring.
  x: RECEPTIONIST_ZONE.x,
  y: RECEPTIONIST_ZONE.y - 4,
  emoji: '🧑\u200d💼',
};
void RECEPTIONIST_NPC; // referenced for docs; sprite intentionally not rendered

// -----------------------------------------------------------------------------
// UI helpers
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------
interface Props {
  /** Called once the mission is fully completed (after success dialogue). */
  onMissionComplete: (item: InventoryItem) => void;
  /** Called when the player leaves the completed mission. */
  onExitToMap: () => void;
}

/**
 * A pending modal dialogue overlaying the current scene. While `dialogue` is
 * non-null, the underlying scene is passed `interactionEnabled={false}` so
 * movement and stray E-presses are frozen and can't leak through to it.
 */
interface PendingDialogue {
  /** Unique per open, used as the DialogueBox key so a fresh sequence always starts at line 1. */
  id: number;
  lines: DialogueLine[];
  onDone: () => void;
}

// -----------------------------------------------------------------------------
// Mission
// -----------------------------------------------------------------------------
export function OperationStudentCard({ onMissionComplete, onExitToMap }: Props) {
  const [scene, setScene] = useState<StudentCardScene>('introCard');
  const [photoResult, setPhotoResult] = useState<PhotoResult>('none');
  const [attempts, setAttempts] = useState(0);
  const [dialogue, setDialogue] = useState<PendingDialogue | null>(null);

  // Memoised layout arrays so BackgroundScene's RAF loop sees stable
  // references (its dependency array includes `allZones`).
  const accessControlZones = useMemo(() => [ACCESS_CONTROL_DOOR_ZONE], []);
  const receptionZones = useMemo(
    () => [RECEPTIONIST_ZONE, PHOTOBOOTH_CHAIR_ZONE],
    [],
  );

  // --- Dialogue helper ------------------------------------------------------
  const dialogueIdRef = useRef(0);
  const openDialogue = useCallback((lines: DialogueLine[], onDone: () => void) => {
    dialogueIdRef.current += 1;
    setDialogue({ id: dialogueIdRef.current, lines, onDone });
  }, []);
  const closeDialogue = useCallback(() => setDialogue(null), []);

  // --- Intro scene: auto-play the player's monologue on mount ---------------
  useEffect(() => {
    if (scene !== 'intro') return;
    // A short beat lets the background image settle before the dialogue box
    // slides up over it, matching the pacing of other levels' cutscenes.
    const t = window.setTimeout(() => {
      openDialogue(PLAYER_INTRO_LINES, () => {
        closeDialogue();
        setScene('accessControlEntrance');
      });
    }, 350);
    return () => window.clearTimeout(t);
  }, [scene, openDialogue, closeDialogue]);

  // --- Reception scene: auto-play the appropriate follow-up on re-entry ----
  // First visit (photoResult === 'none') needs no auto-dialogue — the player
  // walks up to the receptionist and presses E themself. On return from the
  // minigame, the mission requirement is that the receptionist speak
  // immediately, so we auto-open success/failure dialogue on mount.
  useEffect(() => {
    if (scene !== 'cardServicesReception') return;
    if (photoResult === 'success') {
      openDialogue(RECEPTIONIST_SUCCESS_LINES, () => {
        closeDialogue();
        // Mission is only marked complete AFTER the success dialogue closes,
        // so the completion overlay never appears mid-sentence.
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
        // Reset the result so a subsequent press of E on the receptionist
        // (before retrying) shows her initial line rather than the failure
        // line again, and so the next minigame outcome dispatches cleanly.
        setPhotoResult('none');
      });
    }
    // Deliberately depends on scene + photoResult so switching scenes with
    // the same result value re-triggers the correct dialogue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, photoResult]);

  // --- Interaction routers --------------------------------------------------
  const handleAccessControlInteract = useCallback((id: string) => {
    if (id === ACCESS_CONTROL_DOOR_ZONE.id) {
      setScene('cardServicesReception');
    }
  }, []);

  const handleReceptionInteract = useCallback(
    (id: string) => {
      if (id === RECEPTIONIST_ZONE.id) {
        // Pressing E on the receptionist always shows her initial "go to the
        // photobooth" line. This is intentional even on a repeat visit: if
        // the player wanders back to her, she just re-directs them. Success/
        // failure lines are only ever surfaced by the auto-dialogue effect
        // above, driven by photoResult — never from this handler.
        openDialogue(RECEPTIONIST_INTRO_LINES, closeDialogue);
      } else if (id === PHOTOBOOTH_CHAIR_ZONE.id) {
        setScene('photoMinigame');
      }
    },
    [openDialogue, closeDialogue],
  );

  // --- Minigame outcomes ----------------------------------------------------
  // The minigame component itself is untouched — we only bind our own
  // onWin/onLose to translate its result into a scene change + photoResult.
  const handleMinigameWin = useCallback(() => {
    setPhotoResult('success');
    setScene('cardServicesReception');
  }, []);
  const handleMinigameLose = useCallback(() => {
    setAttempts((a) => a + 1);
    setPhotoResult('failure');
    setScene('cardServicesReception');
  }, []);

  // The reception scene needs a per-visit spawn point:
  //  - first visit / after success dialogue: near the lower-centre entrance
  //  - after a failed attempt: nearer the photobooth so the retry is short
  // The BackgroundScene remounts (via keying) when the spawn changes, which
  // resets its internal position and any stale "nearby" prompt.
  const receptionSpawn =
    photoResult === 'failure' ? RECEPTION_RETRY_SPAWN : RECEPTION_INITIAL_SPAWN;
  const receptionKey = `reception-${photoResult}`;

  const dialogueOpen = dialogue !== null;

  return (
    <div className="op-card">
      <header className="op-card__hud">
        <div className="op-card__title">
          <span className="op-card__eyebrow">Mission 1 of 4</span>
          Operation: Student Card
        </div>
        <div className="op-card__objective">{objectiveFor(scene, dialogueOpen)}</div>
      </header>

      <div className="op-card__stage">
        {scene === 'introCard' && <IntroCard onStart={() => setScene('intro')} />}

        {scene === 'intro' && (
          <BackgroundScene
            backgroundSrc={introBg}
            spawn={{ x: 50, y: 88 }}
            bounds={{ minX: 45, maxX: 55, minY: 85, maxY: 90 }}
            interactionEnabled={false}
            onInteract={() => {}}
          />
        )}

        {scene === 'accessControlEntrance' && (
          <BackgroundScene
            backgroundSrc={accessControlBg}
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
            spawn={receptionSpawn}
            bounds={RECEPTION_BOUNDS}
            zones={receptionZones}
            interactionEnabled={!dialogueOpen}
            onInteract={handleReceptionInteract}
          />
        )}

        {scene === 'photoMinigame' && (
          // The existing photobooth minigame — mechanics, controls, scoring
          // and win/lose rules are all preserved. We only listen for its
          // callbacks and translate them into scene + photoResult changes.
          <PhotoBoothMinigame onWin={handleMinigameWin} onLose={handleMinigameLose} />
        )}

        {scene === 'complete' && (
          <CompleteCard attempts={attempts} onContinue={onExitToMap} />
        )}

        {dialogue && (
          <DialogueBox key={dialogue.id} lines={dialogue.lines} onComplete={dialogue.onDone} />
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------
function IntroCard({ onStart }: { onStart: () => void }) {
  return (
    <div className="op-card__overlay">
      <div className="op-card__panel">
        <div className="op-card__panel-eyebrow">Mission 1 of 4</div>
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
