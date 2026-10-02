import { describe, expect, it } from 'vitest';
import { MISSION_CONTENT, missionContent } from '../lib/missionContent';
import { SOCIETIES, SUDOKU_PUZZLE, SUDOKU_SOLUTION, dist } from '../levels/society-fair/societyData';

describe('Campus Quest mission data', () => {
  it('defines exactly four playable missions in the correct order', () => {
    expect(MISSION_CONTENT).toHaveLength(4);
    expect(MISSION_CONTENT.map((m) => m.title)).toEqual([
      'Jammie Rush',
      'Student Wellness Services Wanted',
      'Society Fair',
      'Operation: Student Card',
    ]);
  });

  it('returns the correct mission content', () => {
    expect(missionContent(1).badge).toBe('CAMPUS NAVIGATOR');
    expect(missionContent(4).badge).toBe('CARD CARRIER');
  });

  it('defines all four Society Fair societies with unique join codes', () => {
    expect(SOCIETIES).toHaveLength(4);
    expect(new Set(SOCIETIES.map((s) => s.code)).size).toBe(4);
  });

  it('contains a valid completed 4x4 Sudoku solution', () => {
    expect(SUDOKU_SOLUTION).toHaveLength(4);
    for (const row of SUDOKU_SOLUTION) expect([...row].sort()).toEqual([1, 2, 3, 4]);
    for (let c = 0; c < 4; c++) expect(SUDOKU_SOLUTION.map((r) => r[c]).sort()).toEqual([1, 2, 3, 4]);
  });

  it('keeps all given Sudoku cells equal to the solution', () => {
    SUDOKU_PUZZLE.forEach((row, r) => row.forEach((value, c) => {
      if (value !== 0) expect(value).toBe(SUDOKU_SOLUTION[r][c]);
    }));
  });

  it('calculates player/NPC distance correctly', () => {
    expect(dist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});
