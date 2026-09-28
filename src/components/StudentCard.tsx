import { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { avatarById } from '../lib/avatars';

export default function StudentCard() {
  const { profile, missionsCompleted, logout } = usePlayer();
  const [open, setOpen] = useState(false);
  if (!profile) return null;

  const avatar = avatarById(profile.selected_avatar);
  const title = missionsCompleted >= 4 ? 'SCIKNIGHT' : 'SCIKNIGHT IN TRAINING';

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
            <div className="cq-card-missions">
              <div className="cq-card-dots">
                {[1, 2, 3, 4].map((n) => (
                  <i key={n} className={`cq-dot ${n <= missionsCompleted ? 'done' : ''}`} />
                ))}
              </div>
              <span>{missionsCompleted} / 4</span>
            </div>
            <button className="secondary cq-logout" onClick={() => { setOpen(false); void logout(); }}>
              LOG OUT
            </button>
          </div>
        </div>
      )}
    </>
  );
}
