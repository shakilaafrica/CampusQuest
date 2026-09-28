import React, { useState } from 'react';
import { SOCIETIES } from '../societyData';

export default function PeopleSoft({
  unlockedCodes,
  onJoin,
}: {
  unlockedCodes: string[];
  onJoin: (code: string) => void;
}) {
  const [code, setCode] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const match = SOCIETIES.find(
    (s) => s.code.toLowerCase() === code.trim().toLowerCase() && unlockedCodes.includes(s.code)
  );

  if (confirmed && match) {
    return (
      <>
        <div className="phoneTop">PEOPLESOFT · STUDENT SOCIETIES</div>
        <h3>{match.name}</h3>
        <p className="phoneHint">Code: {match.code}</p>
        <button className="phoneAction" onClick={() => onJoin(match.code)}>
          JOIN SOCIETY
        </button>
      </>
    );
  }

  return (
    <>
      <div className="phoneTop">PEOPLESOFT · STUDENT SOCIETIES</div>
      <h3>Enter Society Code</h3>

      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="e.g. DEV"
        maxLength={4}
      />

      <p className="phoneHint">Unlocked codes:</p>

      <div className="searchResults">
        {unlockedCodes.map((c) => (
          <button
            key={c}
            className={code === c ? 'selected' : ''}
            onClick={() => setCode(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <button className="phoneAction" disabled={!match} onClick={() => setConfirmed(true)}>
        CONTINUE
      </button>
    </>
  );
}
