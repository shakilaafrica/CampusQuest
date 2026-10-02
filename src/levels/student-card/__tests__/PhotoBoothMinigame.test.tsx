import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PhotoBoothMinigame } from '../components/PhotoBoothMinigame';

vi.mock('../hooks/useKeyboard', () => ({ useKeysRef: () => ({ current: new Set<string>() }) }));

describe('Operation Student Card - photoshoot mini-game', () => {
  it('loads the photoshoot controls and neutral player face', () => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    render(<PhotoBoothMinigame onWin={vi.fn()} onLose={vi.fn()} />);
    expect(screen.getByText(/hold space to rise/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/neutral expression/i)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
