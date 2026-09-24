import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { session, type SessionState } from '../session';

/**
 * React view of the shared session store. The game shell is vanilla TypeScript,
 * so the store in ../session.ts is the source of truth; this provider just lets
 * React components (like AdminStatsPanel) read it and re-render on changes.
 */
export interface GameSessionValue extends SessionState {
  isAdmin: boolean;
  logOut: typeof session.logOut;
  completeMission: typeof session.completeMission;
  setScreen: typeof session.setScreen;
}

const GameSessionContext = createContext<GameSessionValue | null>(null);

export function GameSessionProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(session.subscribe, session.getState);

  useEffect(() => {
    void session.init();
  }, []);

  const value = useMemo<GameSessionValue>(
    () => ({
      ...state,
      isAdmin: state.profile?.role === 'admin',
      logOut: session.logOut,
      completeMission: session.completeMission,
      setScreen: session.setScreen,
    }),
    [state],
  );

  return <GameSessionContext.Provider value={value}>{children}</GameSessionContext.Provider>;
}

export function useGameSession(): GameSessionValue {
  const ctx = useContext(GameSessionContext);
  if (!ctx) throw new Error('useGameSession must be used inside <GameSessionProvider>.');
  return ctx;
}
