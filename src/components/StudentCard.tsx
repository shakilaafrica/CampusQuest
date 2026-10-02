/**
 * GenAI DECLARATION
 * ---------------------------------------------------------------------
 * Tool:    ChatGPT (OpenAI) [Model 5]
 * Scope:   GenAI was used to debug an error in the badges feature of
 *          the student card view. The badges were not displaying correctly.
 *          It explained the cause of the error and suggested a fix.
 * Human work: The team integrated the suggested fix and tested it and fully 
 *             understood the changes made to the codebase.
 * */




import { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { avatarById } from '../lib/avatars';
import { missionContent } from '../lib/missionContent';

export default function StudentCard({ onStartFresh }: { onStartFresh: () => void }) {
  const { profile, progress, missionsCompleted, logout, startFreshGame } = usePlayer();
  const [open, setOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  if (!profile) return null;

  const avatar = avatarById(profile.selected_avatar);
  const badges = [1, 2, 3, 4].map((number) => ({
    ...missionContent(number),
    earned: Boolean(progress[number]?.completed),
  }));
  const earnedCount = badges.filter((badge) => badge.earned).length;
  const title = missionsCompleted >= 4 ? 'SCIKNIGHT' : 'SCIKNIGHT IN TRAINING';

  const handleStartFresh = async () => {
    if (!window.confirm('Start a fresh game? Your mission progress will be permanently deleted.')) return;
    setResetting(true);
    setResetError(null);
    const result = await startFreshGame();
    setResetting(false);
    if (!result.ok) {
      setResetError(result.message);
      return;
    }
    setOpen(false);
    onStartFresh();
  };

  return (
    <>
      <button
        className="cq-card-icon"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open student card"
        title="Student card"
      >
        <img src={avatar.portrait} alt="" />
      </button>

      {open && (
        <div className="cq-card-overlay" onClick={() => setOpen(false)}>
          <div className="cq-card" onClick={(e) => e.stopPropagation()}>
            <div className="cq-card-kicker">CAMPUS QUEST</div>
            <div className="cq-card-sub">STUDENT ADVENTURER</div>
            <img className="cq-card-face" src={avatar.portrait} alt={avatar.label} />
            <div className="cq-card-number">{profile.student_number}</div>
            <div className="cq-card-title">{title}</div>
            <section className="cq-card-badges" aria-label="Your mission badges">
              <h2>YOUR BADGES</h2>
              <ul>
                {badges.map(({ number, badge, earned }) => (
                  <li key={number} className={earned ? 'earned' : 'locked'}>
                    <span className="cq-card-badge-icon" aria-hidden="true">{earned ? '🏅' : '🔒'}</span>
                    <span className="cq-card-badge-name">{badge}</span>
                    {earned && <span className="cq-card-badge-check" aria-label="Earned">✓</span>}
                  </li>
                ))}
              </ul>
              <strong>{earnedCount} / 4 EARNED</strong>
            </section>
            <div className="cq-card-missions">
              <div className="cq-card-dots">
                {[1, 2, 3, 4].map((n) => (
                  <i key={n} className={`cq-dot ${n <= missionsCompleted ? 'done' : ''}`} />
                ))}
              </div>
              <span>{missionsCompleted} / 4</span>
            </div>
            {resetError && <p role="alert">{resetError}</p>}
            <button className="secondary cq-logout" disabled={resetting} onClick={() => void handleStartFresh()}>
              {resetting ? 'STARTING FRESH…' : 'START FRESH GAME'}
            </button>
            <button className="secondary cq-logout" onClick={() => { setOpen(false); void logout(); }}>
              LOG OUT
            </button>
          </div>
        </div>
      )}
    </>
  );
}
