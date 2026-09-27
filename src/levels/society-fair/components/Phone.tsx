import React from 'react';
import phoneFrame from '../assets/phone-frame.png';
import { PhoneOrientation, SocietyId } from '../societyData';
import AstronomyGame from './AstronomyGame';
import StatsGame from './StatsGame';
import MathGame from './MathGame';
import DeveloperGame from './DeveloperGame';
import PeopleSoft from './PeopleSoft';

export type PhoneMode = SocietyId | 'peoplesoft';

export default function Phone({
  mode,
  orientation,
  unlockedCodes,
  onGameComplete,
  onJoin,
  onClose,
}: {
  mode: PhoneMode;
  orientation: PhoneOrientation;
  unlockedCodes: string[];
  onGameComplete: () => void;
  onJoin: (code: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="phoneOverlay">
      <div className={`phone ${orientation === 'landscape' ? 'is-landscape' : ''}`}>
        <img src={phoneFrame} alt="Phone frame" />

        <div className="phoneScreen">
          {mode === 'astronomy' && <AstronomyGame onComplete={onGameComplete} />}
          {mode === 'statistics' && <StatsGame onComplete={onGameComplete} />}
          {mode === 'math' && <MathGame onComplete={onGameComplete} />}
          {mode === 'developers' && <DeveloperGame onComplete={onGameComplete} />}
          {mode === 'peoplesoft' && (
            <PeopleSoft unlockedCodes={unlockedCodes} onJoin={onJoin} />
          )}
        </div>

        <button className="phoneExit" onClick={onClose}>
          EXIT
        </button>
      </div>
    </div>
  );
}
