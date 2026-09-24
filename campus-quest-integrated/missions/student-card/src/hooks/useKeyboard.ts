import { useEffect, useRef } from 'react';

/**
 * Tracks the set of currently-held keys in a ref (no re-renders on every
 * key event) so a requestAnimationFrame loop can poll continuous input —
 * WASD/arrow movement, or "hold space to rise" in the photobooth minigame.
 */
export function useKeysRef() {
  const keysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  return keysRef;
}

/**
 * Fires a callback once per discrete key press (ignores OS key-repeat),
 * e.g. "E" to interact/advance dialogue.
 */
export function useKeyPress(targetKey: string, onPress: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key.toLowerCase() === targetKey.toLowerCase()) {
        e.preventDefault();
        onPress();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey, enabled, onPress]);
}
