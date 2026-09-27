import React, { useEffect, useState } from 'react';
import {
  BOARD_SIZE,
  BOARD_SPECIALS,
  PROBABILITY_QUESTIONS,
  ProbQuestion,
  sleep,
} from '../societyData';

function boardOrder() {
  // Boustrophedon (snake) order across a 5x5 grid, square 1 bottom-left.
  const rows: number[][] = [];

  for (let r = 0; r < 5; r++) {
    const row = Array.from({ length: 5 }, (_, c) => r * 5 + c + 1);
    if (r % 2 === 1) row.reverse();
    rows.unshift(row);
  }

  return rows;
}

const ROWS = boardOrder();

export default function StatsGame({ onComplete }: { onComplete: () => void }) {
  const [square, setSquare] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [dice, setDice] = useState(1);
  const [quiz, setQuiz] = useState<ProbQuestion | null>(null);
  const [message, setMessage] = useState('Press E or ROLL to start!');

  const roll = async () => {
    if (rolling || quiz) return;
    setRolling(true);

    for (let i = 0; i < 6; i++) {
      setDice(1 + Math.floor(Math.random() * 6));
      await sleep(70);
    }

    const value = 1 + Math.floor(Math.random() * 6);
    setDice(value);

    const destination = Math.min(BOARD_SIZE, square + value);

    for (let n = square + 1; n <= destination; n++) {
      setSquare(n);
      await sleep(130);
    }

    setRolling(false);

    if (destination >= BOARD_SIZE) {
      setMessage('Final square reached!');
      setTimeout(onComplete, 500);
      return;
    }

    const special = BOARD_SPECIALS[destination];

    if (special?.kind === 'quiz') {
      setQuiz(
        PROBABILITY_QUESTIONS[Math.floor(Math.random() * PROBABILITY_QUESTIONS.length)]
      );
      return;
    }

    if (special?.kind === 'ladder') {
      setMessage('Ladder! Climbing up!');
      await sleep(500);
      setSquare(special.to);
    } else if (special?.kind === 'snake') {
      setMessage('Snake! Sliding down!');
      await sleep(500);
      setSquare(special.to);
    } else {
      setMessage('Press E or ROLL to continue.');
    }
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'e') {
        e.preventDefault();
        roll();
      }
    };

    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [square, rolling, quiz]);

  const answer = (i: number) => {
    if (!quiz) return;

    if (i === quiz.correct) {
      setMessage('Correct — stay right there!');
    } else {
      setMessage('Not quite — back 3 squares!');
      setSquare((s) => Math.max(1, s - 3));
    }

    setQuiz(null);
  };

  return (
    <>
      <div className="phoneTop">STATS SOC // PROBABILITY BOARD</div>
      <p className="phoneHint">Square {square}/{BOARD_SIZE} · [E] Roll dice</p>

      <div className="ladderBoard">
        {ROWS.map((row, ri) => (
          <div className="ladderRow" key={ri}>
            {row.map((n) => {
              const special = BOARD_SPECIALS[n];

              return (
                <div
                  key={n}
                  className={
                    'ladderSquare' +
                    (n === square ? ' is-here' : '') +
                    (special?.kind === 'ladder' ? ' is-ladder' : '') +
                    (special?.kind === 'snake' ? ' is-snake' : '') +
                    (special?.kind === 'quiz' ? ' is-quiz' : '')
                  }
                >
                  <span className="ladderNum">{n}</span>
                  {special?.kind === 'ladder' && <span className="ladderIcon">▲</span>}
                  {special?.kind === 'snake' && <span className="ladderIcon">▼</span>}
                  {special?.kind === 'quiz' && <span className="ladderIcon">?</span>}
                  {n === square && <span className="ladderToken">🧑</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="ladderControls">
        <div className="die">🎲 {dice}</div>
        <button className="phoneAction" onClick={roll} disabled={rolling || !!quiz}>
          ROLL [E]
        </button>
      </div>

      <p className="phoneFact">{message}</p>

      {quiz && (
        <div className="phoneQuiz">
          <small>PROBABILITY SQUARE</small>
          <p>{quiz.q}</p>
          <div className="answers">
            {quiz.options.map((opt, i) => (
              <button key={opt} onClick={() => answer(i)}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
