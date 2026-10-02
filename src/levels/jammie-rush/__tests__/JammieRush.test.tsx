import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import JammieRush from '../JammieRush';

vi.mock('../../../context/PlayerContext', () => ({
  usePlayer: () => ({ profile: { selected_avatar: 'npc6' } }),
}));

describe('Mission 1 - Jammie Rush', () => {
  it('loads the mission with the correct objective and starting timer', () => {
    render(<JammieRush onComplete={vi.fn()} onExit={vi.fn()} />);
    expect(screen.getByText(/make it to the jammie on time/i)).toBeInTheDocument();
    expect(screen.getByText('55s')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start boarding/i })).toBeInTheDocument();
  });

  it('starts the game when Start Boarding is selected', () => {
    render(<JammieRush onComplete={vi.fn()} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /start boarding/i }));
    expect(screen.queryByRole('button', { name: /start boarding/i })).not.toBeInTheDocument();
    expect(screen.getByText(/collisions:/i)).toBeInTheDocument();
  });

  it('returns to the map when the map button is selected', () => {
    const onExit = vi.fn();
    render(<JammieRush onComplete={vi.fn()} onExit={onExit} />);
    fireEvent.click(screen.getByRole('button', { name: /map/i }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
