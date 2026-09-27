import React from 'react';
import { SOCIETIES, SocietyId, SocietyStage } from '../societyData';

export default function SocietyPassport({
  stages,
  open,
  onToggle,
}: {
  stages: Record<SocietyId, SocietyStage>;
  open: boolean;
  onToggle: () => void;
}) {
  const completedCount = SOCIETIES.filter(
    (s) => stages[s.id] === 'codeUnlocked'
  ).length;

  return (
    <div className={`society-passport ${open ? 'is-open' : ''}`}>
      <button className="society-passport-tab" onClick={onToggle}>
        🎫 PASSPORT {completedCount}/4
      </button>

      {open && (
        <div className="society-passport-panel">
          <b>SOCIETY PASSPORT</b>

          <ul>
            {SOCIETIES.map((s) => {
              const unlocked = stages[s.id] === 'codeUnlocked';

              return (
                <li key={s.id} className={unlocked ? 'is-unlocked' : ''}>
                  <span>
                    {s.emoji} {s.name}
                  </span>
                  <code>{unlocked ? `${s.code} ✓` : '???'}</code>
                </li>
              );
            })}
          </ul>

          <div className="society-passport-count">
            {completedCount} / 4 SOCIETIES EXPLORED
          </div>
        </div>
      )}
    </div>
  );
}
