import { useEffect, useState } from 'react';
import JammieRush from './levels/jammie-rush/JammieRush';
import { StudentWellnessServicesWanted } from './levels/student-wellness/missions/StudentWellnessServicesWanted';
import SocietyFair from './levels/society-fair/SocietyFair';
import { OperationStudentCard } from './levels/student-card/missions/OperationStudentCard';

import { PlayerProvider, usePlayer, DEV_UNLOCK_ALL_LEVELS } from './context/PlayerContext';
import { AVATAR_OPTIONS, avatarById } from './lib/avatars';
import { STUDENT_NUMBER_EXAMPLE, isValidStudentNumber, normalizeStudentNumber } from './lib/studentNumber';
import { missionContent } from './lib/missionContent';
import StudentCard from './components/StudentCard';
import IntroModal from './components/IntroModal';
import MissionCompleteModal from './components/MissionCompleteModal';
import StatsForNerds from './components/StatsForNerds';

type Screen = 'login' | 'avatar' | 'intro' | 'map' | 'brief' | 'level';
type Pos = { x: number; y: number };

// Marker positions on public/assets/campus-map.png, as % of image size.
// Mission 1 kept at its existing correct spot (shuttle stop). Mission 2 kept
// at the existing NPC's spot. Mission 3 moved to the plaza in front of
// Sarah Baartman Hall; Mission 4 moved beside the Security office.
const missions = [
  { title: 'Jammie Rush', desc: 'MISSION: Make your way to the Jammie stop, navigate the route to Hiddingh Campus, and survive the Jammie Rush. Learn how to use the campus shuttle system before time runs out!', x: 84, y: 45 },
  { title: 'Student Wellness Services Wanted', desc: "MISSION: Kirah needs your help. Navigate across campus, find her, and discover where Student Wellness Services is located and how it can support you.", x: 63, y: 25 },
  { title: 'Society Fair', desc: 'MISSION: Head to the Society Fair in the plaza in front of Sarah Baartman Hall and explore campus life beyond lectures. Meet the societies, complete their challenges, and find a community that matches your interests.', x: 51, y: 32 },
  { title: 'Operation: Student Card', desc: 'MISSION: Your final orientation task is to secure your student card. Head to Access Control beside the Security office, complete the process, and unlock your official access to campus.', x: 12, y: 35 },
];

export default function App() {
  return (
    <PlayerProvider>
      <Root />
    </PlayerProvider>
  );
}

function Root() {
  const { status, errorMessage, profile, progress, missionsCompleted, completeMission, retry } = usePlayer();
  const [screen, setScreen] = useState<Screen>('login');
  const [mission, setMission] = useState(0); // 0-indexed, mirrors old app
  const [pos, setPos] = useState<Pos>({ x: 50, y: 92 });
  const [statsOpen, setStatsOpen] = useState(false);
  const [celebrateMission, setCelebrateMission] = useState<number | null>(null); // 1-4

  // Returning students land straight on the map once their profile+progress load.
  useEffect(() => {
    if (status === 'ready' && profile?.selected_avatar && screen === 'login') {
      setScreen('map');
    }
  }, [status, profile, screen]);

  const complete = async (missionNumber: number) => {
    await completeMission(missionNumber);
    setPos({ x: 50, y: 92 });
    setScreen('map'); // unmount the mission component before showing the popup
    setCelebrateMission(missionNumber);
  };

  if (status === 'loading') {
    return (
      <div className="screen map" style={{ display: 'grid', placeItems: 'center' }}>
        <div className="cq-loading-text">LOADING YOUR QUEST…</div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="screen map" style={{ display: 'grid', placeItems: 'center' }}>
        <div className="brief" style={{ textAlign: 'center' }}>
          <h1>WE COULDN'T LOAD YOUR QUEST</h1>
          <p>{errorMessage || 'Check your connection and try again.'}</p>
          <button className="primary" onClick={retry}>RETRY</button>
        </div>
      </div>
    );
  }

  if (screen === 'login' || !profile) {
    return <LoginScreen onNew={() => setScreen('avatar')} onStatsClick={() => setStatsOpen(true)} statsOpen={statsOpen} onCloseStats={() => setStatsOpen(false)} />;
  }

  if (screen === 'avatar') {
    return (
      <AvatarScreen
        onChosen={() => setScreen('intro')}
      />
    );
  }

  if (screen === 'intro') {
    return <IntroModal onBegin={() => setScreen('map')} />;
  }

  return (
    <>
      {screen === 'level' && (
        <Level
          mission={mission}
          complete={() => void complete(mission + 1)}
          exit={() => setScreen('map')}
        />
      )}
      {screen === 'brief' && (
        <Brief
          mission={mission}
          start={() => setScreen('level')}
          back={() => setScreen('map')}
        />
      )}
      {screen === 'map' && (
        <CampusMap
          pos={pos}
          setPos={setPos}
          progress={progress}
          missionsCompleted={missionsCompleted}
          openBrief={(i: number) => { setMission(i); setScreen('brief'); }}
        />
      )}
      {celebrateMission !== null && (
        <MissionCompleteModal
          missionNumber={celebrateMission}
          missionsCompleted={missionsCompleted}
          onContinue={() => { setCelebrateMission(null); setScreen('map'); }}
        />
      )}
      {statsOpen && <StatsForNerds onClose={() => setStatsOpen(false)} />}
    </>
  );
}

// ============================================================
// LOGIN
// ============================================================
function LoginScreen({
  onNew,
  onStatsClick,
  statsOpen,
  onCloseStats,
}: {
  onNew: () => void;
  onStatsClick: () => void;
  statsOpen: boolean;
  onCloseStats: () => void;
}) {
  const { login } = usePlayer();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (raw: string) => {
    setValue(raw.toUpperCase().slice(0, 9));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!isValidStudentNumber(value)) {
      setError("That doesn't look like a valid student number.\nUse 6 letters followed by 3 numbers.\nExample: AFRSHA002");
      return;
    }
    setSubmitting(true);
    const result = await login(normalizeStudentNumber(value));
    setSubmitting(false);
    if (!result.ok) {
      if (result.reason === 'invalid') {
        setError("That doesn't look like a valid student number.\nUse 6 letters followed by 3 numbers.\nExample: AFRSHA002");
      } else {
        setError(result.message);
      }
      return;
    }
    if (result.kind === 'new') onNew();
    // 'returning' is handled by Root's effect once status flips to 'ready'.
  };

  return (
    <div className="screen login">
      <div className="login-card cq-login-card">
        <div className="title">CAMPUS <span>QUEST</span></div>
        <div className="sub">YOUR CAMPUS ADVENTURE AWAITS</div>

        <div className="cq-login-panel">
          <div className="kicker">STUDENT LOGIN</div>
          <label className="cq-field-label">Student Number</label>
          <input
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={STUDENT_NUMBER_EXAMPLE}
            onKeyDown={(e) => e.key === 'Enter' && void handleSubmit()}
            maxLength={9}
            autoCapitalize="characters"
          />
          <small className="cq-hint">Student numbers contain 6 letters followed by 3 numbers.</small>
          {error && <div className="cq-error">{error.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>}
          <button className="primary" disabled={submitting} onClick={() => void handleSubmit()}>
            {submitting ? 'LOADING…' : 'ENTER CAMPUS'}
          </button>

          <div className="cq-login-divider" />
          <div className="cq-lecturer-row">
            <span>Lecturer?</span>
            <button className="secondary" onClick={onStatsClick}>📊 STATS FOR NERDS</button>
          </div>
        </div>
      </div>
      {statsOpen && <StatsForNerds onClose={onCloseStats} />}
    </div>
  );
}

// ============================================================
// AVATAR SELECTION (new students only)
// ============================================================
function AvatarScreen({ onChosen }: { onChosen: () => void }) {
  const { profile, chooseAvatar } = usePlayer();
  const [selected, setSelected] = useState(AVATAR_OPTIONS[0].id);
  const [saving, setSaving] = useState(false);

  return (
    <div className="screen login">
      <div className="login-card cq-login-card">
        <div className="title">WELCOME, <span>{profile?.student_number}</span></div>
        <div className="sub">CHOOSE YOUR PLAYER</div>
        <div className="cq-avatar-grid">
          {AVATAR_OPTIONS.map((a) => (
            <button
              key={a.id}
              className={`avatar ${selected === a.id ? 'sel' : ''}`}
              onClick={() => setSelected(a.id)}
            >
              <img src={a.portrait} alt={a.label} />
              <b>{a.label}</b>
            </button>
          ))}
        </div>
        <button
          className="primary"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await chooseAvatar(selected);
            setSaving(false);
            onChosen();
          }}
        >
          {saving ? 'SAVING…' : 'THIS IS ME'}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// CAMPUS MAP
// ============================================================
function CampusMap({
  pos,
  setPos,
  progress,
  missionsCompleted,
  openBrief,
}: {
  pos: Pos;
  setPos: (updater: (p: Pos) => Pos) => void;
  progress: Record<number, { completed: boolean }>;
  missionsCompleted: number;
  openBrief: (index: number) => void;
}) {
  const { profile } = usePlayer();
  const avatar = avatarById(profile?.selected_avatar);
  const walkSprite = `${avatar.walkBase}/down.png`;

  const stateFor = (index: number): 'locked' | 'available' | 'complete' => {
    const n = index + 1;
    if (progress[n]?.completed) return 'complete';
    if (DEV_UNLOCK_ALL_LEVELS) return 'available';
    if (n === 1) return 'available';
    return progress[n - 1]?.completed ? 'available' : 'locked';
  };

  useEffect(() => {
    const move = (e: KeyboardEvent) => {
      let dx = 0, dy = 0;
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') dx = -2;
      if (k === 'd' || k === 'arrowright') dx = 2;
      if (k === 'w' || k === 'arrowup') dy = -2;
      if (k === 's' || k === 'arrowdown') dy = 2;
      if (!dx && !dy) return;
      e.preventDefault();
      setPos((p) => {
        const next = { x: Math.max(4, Math.min(96, p.x + dx)), y: Math.max(8, Math.min(96, p.y + dy)) };
        for (let i = 0; i < missions.length; i++) {
          const t = missions[i];
          if (stateFor(i) === 'available' && Math.hypot(next.x - t.x, next.y - t.y) < 5) {
            setTimeout(() => openBrief(i), 0);
          }
        }
        return next;
      });
    };
    addEventListener('keydown', move);
    return () => removeEventListener('keydown', move);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  return (
    <div className="screen map">
      <img className="map-bg" src="/assets/campus-map.png" />
      <div className="shade" />

      <StudentCard />

      <div className="hud">
        <h2>🧭 Campus Quest</h2>
        <small>{profile?.student_number} · {avatar.label}</small>
        <div className="mission-card">
          <b>MISSIONS COMPLETED</b>
          <strong>{missionsCompleted} / 4</strong>
        </div>
        <div className="progress">
          {missions.map((_, i) => (
            <i key={i} className={`dot ${progress[i + 1]?.completed ? 'done' : stateFor(i) === 'available' ? 'active' : ''}`} />
          ))}
        </div>
      </div>

      {missions.map((q, i) => {
        const st = stateFor(i);
        return (
          <button
            key={i}
            className={`marker ${st === 'locked' ? 'lock' : ''} ${st === 'complete' ? 'done' : ''}`}
            style={{ left: `${q.x}%`, top: `${q.y}%` }}
            title={`MISSION ${i + 1}\n${missionContent(i + 1).title}`}
            onClick={() => { if (st !== 'locked') { setPos(() => ({ x: q.x, y: q.y })); openBrief(i); } }}
          >
            {st === 'complete' ? '✓' : st === 'locked' ? '🔒' : i + 1}
          </button>
        );
      })}

      <div className="player" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
        <img src={walkSprite} />
      </div>
      <div className="tip">WASD / arrow keys to explore · reach a glowing mission marker</div>
    </div>
  );
}

// ============================================================
// MISSION BRIEF
// ============================================================
function Brief({ mission, start, back }: { mission: number; start: () => void; back: () => void }) {
  const m = missions[mission];
  return (
    <div className="screen map">
      <img className="map-bg" src="/assets/campus-map.png" />
      <div className="shade" />
      <div className="modal">
        <div className="brief">
          <div className="kicker">MISSION {mission + 1}</div>
          <h1>{m.title}</h1>
          <p>{m.desc}</p>
          {mission === 0 && (
            <div className="route">
              <span className="stop">UPPER CAMPUS</span><i className="line" />
              <span className="stop">JAMMIE STOP</span><i className="line" />
              <span className="stop">J2 · HIDDINGH</span>
            </div>
          )}
          <button className="primary" onClick={start}>BEGIN MISSION</button>{' '}
          <button className="secondary" onClick={back}>BACK TO MAP</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MISSION LEVEL SWITCH — unchanged mini-game internals, just
// wired to the shared completion callback.
// ============================================================
function Level({ mission, complete, exit }: { mission: number; complete: () => void; exit: () => void }) {
  if (mission === 0) return <div className="level-shell level-jammie"><JammieRush onComplete={complete} onExit={exit} /></div>;
  if (mission === 1) return <div className="level-shell level-wellness"><StudentWellnessServicesWanted onMissionComplete={complete} onExitToMap={exit} /></div>;
  if (mission === 2) return <div className="level-shell level-society"><SocietyFair onComplete={complete} onExit={exit} /></div>;
  return <div className="level-shell level-card"><OperationStudentCard onMissionComplete={() => complete()} onExitToMap={exit} /></div>;
}
