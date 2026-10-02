import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MathGame from '../components/MathGame';
import { SUDOKU_PUZZLE, SUDOKU_SOLUTION } from '../societyData';

describe('Society Fair - Math mini-game', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

  it('reports an unsuccessful attempt when the puzzle is incomplete', () => {
    const onComplete = vi.fn();
    render(<MathGame onComplete={onComplete} />);
    fireEvent.click(screen.getByRole('button', { name: /check solution/i }));
    expect(screen.getByText(/not quite/i)).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('completes when every blank cell is filled correctly', () => {
    const onComplete = vi.fn();
    const { container } = render(<MathGame onComplete={onComplete} />);
    const cells = Array.from(container.querySelectorAll<HTMLButtonElement>('.sudokuCell'));
    const numberPanel = container.querySelector('.numbers') as HTMLElement;

    SUDOKU_PUZZLE.forEach((row, r) => {
      row.forEach((value, c) => {
        if (value === 0) {
          const correct = SUDOKU_SOLUTION[r][c];
          fireEvent.click(within(numberPanel).getByRole('button', { name: String(correct) }));
          fireEvent.click(cells[r * 4 + c]);
        }
      });
    });

    fireEvent.click(screen.getByRole('button', { name: /check solution/i }));
    expect(screen.getByText(/puzzle solved/i)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(400));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
