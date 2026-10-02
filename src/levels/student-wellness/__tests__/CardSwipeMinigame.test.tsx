import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CardSwipeMinigame } from '../components/CardSwipeMinigame';

describe('Student Wellness - card swipe mini-game', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

  function mockReaderWidth() {
    const reader = document.querySelector('.card-swipe__reader') as HTMLElement;
    vi.spyOn(reader, 'getBoundingClientRect').mockReturnValue({
      left: 0, right: 100, top: 0, bottom: 20, width: 100, height: 20,
      x: 0, y: 0, toJSON: () => ({}),
    } as DOMRect);
  }

  it('rejects a swipe that is too fast and prompts the player to retry', () => {
    const onSuccess = vi.fn();
    render(<CardSwipeMinigame onSuccess={onSuccess} />);
    mockReaderWidth();
    const card = screen.getByText('🪪');
    const clock = vi.spyOn(performance, 'now').mockReturnValue(1000);
    fireEvent.pointerDown(card, { pointerId: 1, clientX: 0 });
    clock.mockReturnValue(1050);
    fireEvent.pointerUp(card, { pointerId: 1, clientX: 100 });
    expect(screen.getByText(/too fast.*swipe again/i)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('accepts a complete swipe performed at a valid speed', () => {
    const onSuccess = vi.fn();
    render(<CardSwipeMinigame onSuccess={onSuccess} />);
    mockReaderWidth();
    const card = screen.getByText('🪪');
    const clock = vi.spyOn(performance, 'now').mockReturnValue(1000);
    fireEvent.pointerDown(card, { pointerId: 1, clientX: 0 });
    clock.mockReturnValue(1400);
    fireEvent.pointerUp(card, { pointerId: 1, clientX: 100 });
    expect(screen.getByText(/access granted!/i)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(650));
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});
