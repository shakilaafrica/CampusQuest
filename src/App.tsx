import { useEffect, useState } from 'react';

import JammieRush from './levels/jammie-rush/JammieRush';

import { StudentWellnessServicesWanted } from './levels/student-wellness/missions/StudentWellnessServicesWanted';

import SocietyFair from './levels/society-fair/SocietyFair';

import { OperationStudentCard } from './levels/student-card/missions/OperationStudentCard';
import { SciKnightCeremony } from './levels/closing-scene/missions/SciKnightCeremony';



import { PlayerProvider, usePlayer, DEV_UNLOCK_ALL_LEVELS } from './context/PlayerContext';

import { AVATAR_OPTIONS, avatarById } from './lib/avatars';

import { STUDENT_NUMBER_EXAMPLE } from './lib/studentNumber';

import { missionContent } from './lib/missionContent';

import StudentCard from './components/StudentCard';

import IntroModal from './components/IntroModal';

import MissionCompleteModal from './components/MissionCompleteModal';

import StatsForNerds from './components/StatsForNerds';

import './campus-quest-entry.css';

import './campus-quest-mission-presentation.css';



type Screen = 'login' | 'avatar' | 'intro' | 'map' | 'brief' | 'level' | 'closing' | 'staff-stats' | 'exit';

type Pos = { x: number; y: number };



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

  const { status, profile, progress, missionsCompleted, completeMission, logout } = usePlayer();

  const [screen, setScreen] = useState<Screen>('login');

  const [mission, setMission] = useState(0); // 0-indexed, mirrors old app

  const [pos, setPos] = useState<Pos>({ x: 50, y: 92 });

  const [celebrateMission, setCelebrateMission] = useState<number | null>(null); // 1-4




  useEffect(() => {

    if (status !== 'ready' || !profile || screen !== 'login') return;

    if (profile.role === 'lecturer' || profile.role === 'tutor') setScreen('staff-stats');

    else setScreen(profile.selected_avatar ? 'map' : 'avatar');

  }, [status, profile, screen]);



  const complete = async (missionNumber: number) => {
    setPos({ x: 50, y: 92 });

    
    if (missionNumber === 4) {
      setCelebrateMission(null);
      setScreen('closing');
      await completeMission(missionNumber);
      return;
    }

    await completeMission(missionNumber);
    setScreen('map');
    setCelebrateMission(missionNumber);
  };



  if (status === 'loading') {

    return (

      <div className="screen map" style={{ display: 'grid', placeItems: 'center' }}>

        <div className="cq-loading-text">LOADING YOUR QUEST…</div>

      </div>

    );

  }



  if (status === 'anonymous' || !profile || screen === 'exit') {

    return (

      <LoginScreen

        onNew={() => setScreen('avatar')}

        onLoad={() => setScreen(profile?.selected_avatar ? 'map' : 'avatar')}

        onStaff={() => setScreen('staff-stats')}

        exited={screen === 'exit'}

        onExit={() => setScreen('exit')}

      />

    );

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



  if (screen === 'staff-stats') {

    return <StatsForNerds onLogout={() => { void logout().then(() => setScreen('login')); }} />;

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

      {screen === 'closing' && (
        <SciKnightCeremony
          onExitToMap={() => setScreen('map')}
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

          onStartFresh={() => { setPos({ x: 50, y: 92 }); setScreen('avatar'); }}

        />

      )}

      {celebrateMission !== null && (

        <MissionCompleteModal

          missionNumber={celebrateMission}

          missionsCompleted={missionsCompleted}

          onContinue={() => { setCelebrateMission(null); setScreen('map'); }}

        />

      )}

    </>

  );

}



function LoginScreen({

  onNew,

  onLoad,

  onStaff,

  exited,

  onExit,

}: {

  onNew: () => void;

  onLoad: () => void;

  onStaff: () => void;

  exited: boolean;

  onExit: () => void;

}) {

  const { newGame, loadGame, staffRegister, staffLogin } = usePlayer();

  const [mode, setMode] = useState<'welcome' | 'staff' | 'staff-register'>('welcome');

  const [value, setValue] = useState('');

  const [password, setPassword] = useState('');

  const [staffEmail, setStaffEmail] = useState('');

  const [staffPassword, setStaffPassword] = useState('');

  const [error, setError] = useState<string | null>(null);

  const [notice, setNotice] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);



  const handleChange = (raw: string) => {

    setValue(raw.toUpperCase().slice(0, 9));

    setError(null);

  };



  const handleStudentAction = async (action: 'new' | 'load') => {

    if (!value.trim() || !password) {

      setError('Enter your student number and password.');

      return;

    }

    setSubmitting(true);

    const result = action === 'new'

      ? await newGame(value, password)

      : await loadGame(value, password);

    setSubmitting(false);

    setPassword('');

    if (!result.ok) {

      setError(result.message);

      return;

    }

    if (result.kind === 'new') onNew();

    else onLoad();

  };



  const handleStaffLogin = async () => {

    if (!staffEmail.trim() || !staffPassword) {

      setError('Enter your staff email and password.');

      return;

    }

    setSubmitting(true);

    const result = await staffLogin(staffEmail, staffPassword);

    setSubmitting(false);

    if (!result.ok) {

      setError(result.message);

      return;

    }

    onStaff();

  };



  const handleStaffRegister = async () => {

    if (!staffEmail.trim() || !staffPassword) {

      setError('Enter your staff email and password.');

      return;

    }

    setSubmitting(true);

    const result = await staffRegister(staffEmail, staffPassword);

    setSubmitting(false);

    if (!result.ok) {

      setError(result.message);

      return;

    }

    setStaffPassword('');

    setError(null);

    setNotice('Registration submitted. Sign in with your staff email and password.');

    setMode('staff');

  };



  return (

    <div className="screen login cq-entry-screen">

      <div className="login-card cq-login-card cq-entry-card">

        <div className="title">CAMPUS <span>QUEST</span></div>

        <div className="sub">YOUR CAMPUS ADVENTURE AWAITS</div>



        {exited ? (

          <div className="cq-login-panel">

            <div className="kicker">GAME EXITED</div>

            <p className="cq-hint">Campus Quest has ended. You can close this tab.</p>

          </div>

        ) : mode === 'staff' || mode === 'staff-register' ? (

          <div className="cq-login-panel">

            <div className="kicker">{mode === 'staff-register' ? 'STAFF REGISTRATION' : 'LECTURER / TUTOR'}</div>

            <label className="cq-field-label" htmlFor="staff-email">Staff Email</label>

            <input id="staff-email" type="email" value={staffEmail} onChange={(event) => { setStaffEmail(event.target.value); setError(null); setNotice(null); }} autoComplete="username" />

            <label className="cq-field-label" htmlFor="staff-password">Password</label>

            <input id="staff-password" type="password" value={staffPassword} onChange={(event) => { setStaffPassword(event.target.value); setError(null); }} autoComplete="current-password" />

            {notice && <div className="cq-hint">{notice}</div>}

            {error && <div className="cq-error">{error}</div>}

            <button className="primary" disabled={submitting} onClick={() => void (mode === 'staff-register' ? handleStaffRegister() : handleStaffLogin())}>

              {submitting ? 'PLEASE WAIT…' : mode === 'staff-register' ? 'REGISTER STAFF ACCOUNT' : 'STAFF SIGN IN'}

            </button>

            {mode === 'staff' ? (

              <button className="secondary" disabled={submitting} onClick={() => { setMode('staff-register'); setError(null); setNotice(null); }}>REGISTER STAFF ACCOUNT</button>

            ) : (

              <button className="secondary" disabled={submitting} onClick={() => { setMode('staff'); setError(null); setNotice(null); }}>BACK TO STAFF SIGN IN</button>

            )}

            <button className="secondary" disabled={submitting} onClick={() => { setMode('welcome'); setError(null); setNotice(null); setStaffPassword(''); }}>BACK</button>

          </div>

        ) : (

          <div className="cq-login-panel">

            <div className="kicker">WELCOME TO CAMPUS QUEST</div>

            <label className="cq-field-label" htmlFor="student-number">Student Number</label>

            <input id="student-number" value={value} onChange={(event) => handleChange(event.target.value)} placeholder={STUDENT_NUMBER_EXAMPLE} maxLength={9} autoCapitalize="characters" autoComplete="username" />

            <label className="cq-field-label" htmlFor="student-password">Password</label>

            <input id="student-password" type="password" value={password} onChange={(event) => { setPassword(event.target.value); setError(null); }} autoComplete="current-password" />

            {error && <div className="cq-error">{error}</div>}

            <button className="primary" disabled={submitting} onClick={() => void handleStudentAction('new')}>

              {submitting ? 'PLEASE WAIT…' : 'NEW GAME'}

            </button>

            <button className="primary" disabled={submitting} onClick={() => void handleStudentAction('load')}>

              {submitting ? 'PLEASE WAIT…' : 'LOAD GAME'}

            </button>

            <button className="secondary" disabled={submitting} onClick={onExit}>EXIT</button>

            <button className="cq-staff-link" disabled={submitting} onClick={() => { setMode('staff'); setError(null); setPassword(''); }}>LECTURER / TUTOR</button>

          </div>

        )}

      </div>

    </div>

  );

}





function AvatarScreen({ onChosen }: { onChosen: () => void }) {

  const { profile, chooseAvatar } = usePlayer();

  const [selected, setSelected] = useState(profile?.selected_avatar ?? AVATAR_OPTIONS[0].id);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);



  return (

    <div className="screen login cq-entry-screen">

      <div className="login-card cq-login-card cq-entry-card">

        <div className="title">WELCOME, <span>{profile?.student_number}</span></div>

        <div className="sub">CHOOSE YOUR PLAYER</div>

        <div className="cq-avatar-grid">

          {AVATAR_OPTIONS.map((a) => (

            <button

              key={a.id}

              className={`avatar ${selected === a.id ? 'sel' : ''}`}

              onClick={() => setSelected(a.id)}

            >

              <img

                className={a.id === 'npc9' || a.id === 'npc10' ? 'is-wide' : ''}

                src={a.portrait}

                alt=""

              />

            </button>

          ))}

        </div>

        <button

          className="primary"

          disabled={saving}

          onClick={async () => {

            setSaving(true);

            const result = await chooseAvatar(selected);

            setSaving(false);

            if (!result.ok) setError(result.message);

            else onChosen();

          }}

        >

          {saving ? 'SAVING…' : 'CHOOSE AVATAR'}

        </button>

        {error && <div className="cq-error">{error}</div>}

      </div>

    </div>

  );

}




function CampusMap({

  pos,

  setPos,

  progress,

  missionsCompleted,

  openBrief,

  onStartFresh,

}: {

  pos: Pos;

  setPos: (updater: (p: Pos) => Pos) => void;

  progress: Record<number, { completed: boolean }>;

  missionsCompleted: number;

  openBrief: (index: number) => void;

  onStartFresh: () => void;

}) {

  const { profile } = usePlayer();

  const avatar = avatarById(profile?.selected_avatar);

  const walkSprite = avatar.sprites.down;



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



      <StudentCard onStartFresh={onStartFresh} />



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



      <div className={`player ${avatar.id === 'npc9' || avatar.id === 'npc10' ? 'player-wide' : ''}`} style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>

        <img src={walkSprite} />

      </div>

      <div className="tip">WASD / arrow keys to explore · reach a glowing mission marker</div>

    </div>

  );

}




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





function Level({ mission, complete, exit }: { mission: number; complete: () => void; exit: () => void }) {

  if (mission === 0) return <div className="level-shell level-jammie"><JammieRush onComplete={complete} onExit={exit} /></div>;

  if (mission === 1) return <div className="level-shell level-wellness"><StudentWellnessServicesWanted onMissionComplete={complete} onExitToMap={exit} /></div>;

  if (mission === 2) return <div className="level-shell level-society"><SocietyFair onComplete={complete} onExit={exit} /></div>;

  return <div className="level-shell level-card"><OperationStudentCard onMissionComplete={() => complete()} onExitToMap={exit} /></div>;

}