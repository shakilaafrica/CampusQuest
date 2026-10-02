/**
 * GenAI DECLARATION: This code was debugged with the assistance of GenAI
 * (ChatGPT). GenAI was also used to assist with the development and refinement
 * of the Sudoku game logic. The resulting code was reviewed, integrated, and
 * tested by the team.
 */


import React, { useState } from 'react';
import { SUDOKU_PUZZLE, SUDOKU_SOLUTION } from '../societyData';

export default function MathGame({ onComplete }: { onComplete: () => void }) {
  const [board, setBoard] = useState(SUDOKU_PUZZLE.map((row) => [...row]));
  const [selected, setSelected] = useState<number | null>(null);
  const [badCell, setBadCell] = useState<string | null>(null);
  const [message, setMessage] = useState('Pick a number, then tap a blank cell.');

  const isGiven = (r: number, c: number) => SUDOKU_PUZZLE[r][c] !== 0;

  const placeInCell = (r: number, c: number) => {
    if (isGiven(r, c) || selected === null) return;

    setBoard((b) => b.map((row, ri) => row.map((v, ci) => (ri === r && ci === c ? selected : v))));
  };

  const checkSolution = () => {
    const rowsOk = board.every((row, r) => row.every((v, c) => v === SUDOKU_SOLUTION[r][c]));

    if (rowsOk) {
      setMessage('Puzzle solved!');
      setTimeout(onComplete, 400);
      return;
    }

    // flag the first wrong filled cell briefly for feedback
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!isGiven(r, c) && board[r][c] !== 0 && board[r][c] !== SUDOKU_SOLUTION[r][c]) {
          setBadCell(`${r}-${c}`);
          setTimeout(() => setBadCell(null), 500);
          break;
        }
      }
    }

    setMessage('Not quite — check the board and try again.');
  };

  return (
    <>
      <div className="phoneTop">MATHSOC · POCKET SUDOKU</div>
      <h3>4×4 Sudoku</h3>

      <div className="sudokuGrid">
        {board.map((row, r) =>
          row.map((value, c) => (
            <button
              key={`${r}-${c}`}
              className={
                'sudokuCell' +
                (isGiven(r, c) ? ' is-given' : '') +
                (badCell === `${r}-${c}` ? ' is-bad' : '')
              }
              onClick={() => placeInCell(r, c)}
              disabled={isGiven(r, c)}
            >
              {value || ''}
            </button>
          ))
        )}
      </div>

      <div className="numbers">
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            className={selected === n ? 'is-selected' : ''}
            onClick={() => setSelected(n)}
          >
            {n}
          </button>
        ))}
      </div>

      <p className="phoneFact">{message}</p>

      <button className="phoneAction" onClick={checkSolution}>
        CHECK SOLUTION
      </button>
    </>
  );
}
