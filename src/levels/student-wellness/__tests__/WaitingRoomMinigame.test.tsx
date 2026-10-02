import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WaitingRoomMinigame } from '../components/WaitingRoomMinigame';

describe('Student Wellness - doctor waiting-room mini-game', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0); // target is called after 5 filler names
  });
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

  it('fails when the player raises their hand for the wrong name', () => {
    const wrong = vi.fn();
    render(<WaitingRoomMinigame onWin={vi.fn()} onFailWrongName={wrong} onFailMissedTarget={vi.fn()} />);
    act(() => vi.advanceTimersByTime(500));
    const button = screen.getByRole('button', { name: /raise hand/i });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(wrong).toHaveBeenCalledTimes(1);
  });

  it('succeeds when Kirah is called and the player raises their hand', () => {
    const win = vi.fn();
    render(<WaitingRoomMinigame onWin={win} onFailWrongName={vi.fn()} onFailMissedTarget={vi.fn()} />);

    // Five filler calls: each appears, times out after 850 ms, then waits 500 ms.
    act(() => vi.advanceTimersByTime(500));
    for (let i = 0; i < 5; i++) {
      act(() => vi.advanceTimersByTime(850));
      act(() => vi.advanceTimersByTime(500));
    }

    const button = screen.getByRole('button', { name: /raise hand/i });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(win).toHaveBeenCalledTimes(1);
  });

  it('fails when Kirah is called and the player does not respond in time', () => {
    const missed = vi.fn();
    render(<WaitingRoomMinigame onWin={vi.fn()} onFailWrongName={vi.fn()} onFailMissedTarget={missed} />);
    act(() => vi.advanceTimersByTime(500));
    for (let i = 0; i < 5; i++) {
      act(() => vi.advanceTimersByTime(850));
      act(() => vi.advanceTimersByTime(500));
    }
    act(() => vi.advanceTimersByTime(850));
    expect(missed).toHaveBeenCalledTimes(1);
  });
});
