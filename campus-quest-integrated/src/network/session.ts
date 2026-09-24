/**
 * Framework-free session store: who is signed in, their profile, their last
 * save, and the live online count. The vanilla game shell and the React admin
 * panel both read from this one store, so there is only ever one login,
 * one save copy and one presence connection per tab.
 */
import type { User } from '@supabase/supabase-js';
import * as auth from './services/authService';
import * as saves from './services/saveService';
import { joinPresence, type PresenceHandle } from './services/presenceService';
import { isSupabaseConfigured } from './lib/supabaseClient';
import type { MissionId } from './config/missions';
import type { CharacterInfo, GameSave, GameScreen, MissionResult, PresenceSummary, Profile } from './types';
import { toNetworkError, type NetworkError } from './utils/errors';

export type SessionStatus = 'loading' | 'signedOut' | 'signedIn';

export interface SessionState {
  status: SessionStatus;
  /** False when .env is missing; the menu explains how to fix it. */
  configured: boolean;
  user: User | null;
  profile: Profile | null;
  /** Last save from the server. Changes only on login or a completed mission. */
  save: GameSave | null;
  online: PresenceSummary;
  /** Set when restoring or loading a session fails (not for form errors). */
  sessionError: NetworkError | null;
}

type Listener = () => void;

const EMPTY_ONLINE: PresenceSummary = { total: 0, byScreen: {} };

let state: SessionState = {
  status: 'loading',
  configured: isSupabaseConfigured,
  user: null,
  profile: null,
  save: null,
  online: EMPTY_ONLINE,
  sessionError: null,
};

const listeners = new Set<Listener>();
let initialised = false;
let loadedUserId: string | null = null;
let pendingLoad: { userId: string; promise: Promise<void> } | null = null;
let presence: PresenceHandle | null = null;
let currentScreen: GameScreen = 'main_menu';

function setState(patch: Partial<SessionState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

// ---------- Presence ----------

function startPresence() {
  if (presence) return;
  try {
    presence = joinPresence(currentScreen, (online) => setState({ online }));
  } catch (err) {
    console.warn('[network] presence unavailable', err);
  }
}

async function stopPresence() {
  const handle = presence;
  presence = null;
  setState({ online: EMPTY_ONLINE });
  if (handle) await handle.leave().catch(() => undefined);
}

// ---------- Loading a signed-in user ----------

function clearUser() {
  loadedUserId = null;
  setState({ status: 'signedOut', user: null, profile: null, save: null });
}

/** Loads profile + save for a user once, even if called from several places at the same time. */
function loadUser(user: User): Promise<void> {
  if (loadedUserId === user.id) return Promise.resolve();
  if (pendingLoad?.userId === user.id) return pendingLoad.promise;

  setState({ status: 'loading' });
  const promise = (async () => {
    try {
      const [profile, save] = await Promise.all([auth.fetchProfile(user.id), saves.loadSave()]);
      loadedUserId = user.id;
      setState({ status: 'signedIn', user, profile, save, sessionError: null });
      void auth.touchLastSeen();
      startPresence();
    } catch (err) {
      clearUser();
      throw toNetworkError(err);
    } finally {
      pendingLoad = null;
    }
  })();
  pendingLoad = { userId: user.id, promise };
  return promise;
}

// ---------- Public API ----------

export const session = {
  getState(): SessionState {
    return state;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** Restores a remembered login (if any) and starts listening for auth changes. Safe to call more than once. */
  async init(): Promise<void> {
    if (initialised) return;
    initialised = true;

    if (!isSupabaseConfigured) {
      setState({ status: 'signedOut' });
      return;
    }

    try {
      auth.onAuthChange((s) => {
        if (!s?.user) {
          if (loadedUserId) {
            void stopPresence();
            clearUser();
          }
          return;
        }
        loadUser(s.user).catch((err) => setState({ sessionError: toNetworkError(err) }));
      });
      const existing = await auth.getSession();
      if (existing?.user) await loadUser(existing.user);
      else setState({ status: 'signedOut' });
    } catch (err) {
      setState({ status: 'signedOut', sessionError: toNetworkError(err) });
    }
  },

  /** New Game: creates the account and its starting save, then signs the player in. */
  async signUp(username: string, password: string, character: CharacterInfo): Promise<void> {
    if (state.status === 'signedIn') await session.logOut();
    const user = await auth.signUp(username, password, character);
    await loadUser(user);
  },

  /** Load Game / Dev options: signs in an existing account and loads its last save. */
  async logIn(username: string, password: string): Promise<void> {
    if (state.status === 'signedIn') await session.logOut();
    const user = await auth.logIn(username, password);
    await loadUser(user);
  },

  async logOut(): Promise<void> {
    await stopPresence();
    try {
      if (isSupabaseConfigured) await auth.logOut();
    } finally {
      clearUser();
    }
  },

  /** The only save point in the game: call once when a mission is finished. */
  async completeMission(missionId: MissionId, result?: MissionResult): Promise<GameSave> {
    const save = await saves.completeMission(missionId, result);
    setState({ save });
    return save;
  },

  /** Reports the current screen through presence (drives the admin breakdown). */
  setScreen(screen: GameScreen): void {
    currentScreen = screen;
    presence?.setScreen(screen);
  },
};
