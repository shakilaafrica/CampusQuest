import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabaseClient';
import { isValidStudentNumber, normalizeStudentNumber } from '../lib/studentNumber';

// Flip to false before final submission — see README / task brief section 11.
export const DEV_UNLOCK_ALL_LEVELS = true;

const HEARTBEAT_INTERVAL_MS = 30_000;

export interface Profile {
  id: string;
  student_number: string;
  selected_avatar: string | null;
  role: 'student' | 'lecturer';
  created_at: string;
  last_seen_at: string;
}

export interface MissionProgressRow {
  mission_number: number;
  completed: boolean;
  started_at: string | null;
  completed_at: string | null;
}

type LoginOutcome =
  | { ok: true; kind: 'new' }
  | { ok: true; kind: 'returning' }
  | { ok: false; reason: 'invalid' }
  | { ok: false; reason: 'error'; message: string };

type Status = 'login' | 'loading' | 'ready' | 'error';

interface PlayerContextValue {
  status: Status;
  errorMessage: string | null;
  profile: Profile | null;
  progress: Record<number, MissionProgressRow>;
  missionsCompleted: number;
  isLecturer: boolean;
  supabaseConfigured: boolean;
  login: (rawStudentNumber: string) => Promise<LoginOutcome>;
  chooseAvatar: (avatarId: string) => Promise<void>;
  completeMission: (missionNumber: number) => Promise<void>;
  logout: () => Promise<void>;
  retry: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

function emptyProgress(): Record<number, MissionProgressRow> {
  return {
    1: { mission_number: 1, completed: false, started_at: null, completed_at: null },
    2: { mission_number: 2, completed: false, started_at: null, completed_at: null },
    3: { mission_number: 3, completed: false, started_at: null, completed_at: null },
    4: { mission_number: 4, completed: false, started_at: null, completed_at: null },
  };
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('login');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<Record<number, MissionProgressRow>>(emptyProgress());

  const sessionIdRef = useRef<string | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const lastLoginRef = useRef<string>('');

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current !== null) {
      window.clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const startSession = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .insert({ user_id: userId })
        .select('id')
        .single();
      if (error) throw error;
      sessionIdRef.current = data.id as string;

      stopHeartbeat();
      heartbeatRef.current = window.setInterval(async () => {
        if (!sessionIdRef.current) return;
        await supabase
          .from('game_sessions')
          .update({ last_activity_at: new Date().toISOString() })
          .eq('id', sessionIdRef.current);
      }, HEARTBEAT_INTERVAL_MS);
    } catch (err) {
      // A session-tracking hiccup shouldn't block play — just log it.
      // eslint-disable-next-line no-console
      console.error('[Campus Quest] Failed to start game session', err);
    }
  }, [stopHeartbeat]);

  const endSession = useCallback(async () => {
    stopHeartbeat();
    const id = sessionIdRef.current;
    sessionIdRef.current = null;
    if (!id) return;
    try {
      await supabase.from('game_sessions').update({ ended_at: new Date().toISOString() }).eq('id', id);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Campus Quest] Failed to close game session', err);
    }
  }, [stopHeartbeat]);

  const loadProgress = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('mission_progress')
      .select('mission_number, completed, started_at, completed_at')
      .eq('user_id', userId);
    if (error) throw error;
    const next = emptyProgress();
    for (const row of data ?? []) {
      next[row.mission_number as number] = row as MissionProgressRow;
    }
    setProgress(next);
  }, []);

  const login = useCallback(
    async (rawStudentNumber: string): Promise<LoginOutcome> => {
      if (!isValidStudentNumber(rawStudentNumber)) {
        return { ok: false, reason: 'invalid' };
      }
      if (!supabaseConfigured) {
        setStatus('error');
        setErrorMessage(
          'Campus Quest is not connected to Supabase yet. Ask your admin to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
        );
        return { ok: false, reason: 'error', message: 'Supabase not configured' };
      }

      const studentNumber = normalizeStudentNumber(rawStudentNumber);
      lastLoginRef.current = studentNumber;
      setStatus('loading');
      setErrorMessage(null);

      try {
        const { data: existing, error: findError } = await supabase
          .from('profiles')
          .select('*')
          .eq('student_number', studentNumber)
          .maybeSingle();
        if (findError) throw findError;

        if (existing) {
          await supabase
            .from('profiles')
            .update({ last_seen_at: new Date().toISOString() })
            .eq('id', existing.id);
          setProfile(existing as Profile);
          await loadProgress(existing.id as string);
          await startSession(existing.id as string);
          setStatus('ready');
          return { ok: true, kind: 'returning' };
        }

        const { data: created, error: createError } = await supabase
          .from('profiles')
          .insert({ student_number: studentNumber, role: 'student' })
          .select('*')
          .single();
        if (createError) throw createError;

        setProfile(created as Profile);
        setProgress(emptyProgress());
        setStatus('ready');
        // Session starts once avatar selection finishes (chooseAvatar), so a
        // new student's very first session reflects real play time, not the
        // avatar-picker screen.
        return { ok: true, kind: 'new' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong loading your quest.';
        setStatus('error');
        setErrorMessage(message);
        return { ok: false, reason: 'error', message };
      }
    },
    [loadProgress, startSession]
  );

  const chooseAvatar = useCallback(
    async (avatarId: string) => {
      if (!profile) return;
      const { data, error } = await supabase
        .from('profiles')
        .update({ selected_avatar: avatarId })
        .eq('id', profile.id)
        .select('*')
        .single();
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      setProfile(data as Profile);
      await startSession(profile.id);
    },
    [profile, startSession]
  );

  const completeMission = useCallback(
    async (missionNumber: number) => {
      if (!profile) return;
      const existing = progress[missionNumber];
      if (existing?.completed) return; // idempotent: already complete, nothing to do

      const nowIso = new Date().toISOString();
      // Optimistic local update first so the UI never stalls on the network.
      setProgress((prev) => ({
        ...prev,
        [missionNumber]: {
          mission_number: missionNumber,
          completed: true,
          started_at: prev[missionNumber]?.started_at ?? nowIso,
          completed_at: nowIso,
        },
      }));

      const { error } = await supabase.from('mission_progress').upsert(
        {
          user_id: profile.id,
          mission_number: missionNumber,
          completed: true,
          completed_at: nowIso,
        },
        { onConflict: 'user_id,mission_number' }
      );
      if (error) {
        // eslint-disable-next-line no-console
        console.error('[Campus Quest] Failed to persist mission completion', error);
      }
    },
    [profile, progress]
  );

  const logout = useCallback(async () => {
    // Nothing to sign out of — this demo authenticates by student number
    // alone, not a Supabase Auth session. Logging out just closes the
    // session record and clears local React state; saved progression in
    // Supabase is untouched, so logging back in restores everything.
    await endSession();
    setProfile(null);
    setProgress(emptyProgress());
    setErrorMessage(null);
    setStatus('login');
  }, [endSession]);

  const retry = useCallback(() => {
    setErrorMessage(null);
    if (lastLoginRef.current) {
      void login(lastLoginRef.current);
    } else {
      setStatus('login');
    }
  }, [login]);

  const missionsCompleted = Object.values(progress).filter((p) => p.completed).length;

  const value: PlayerContextValue = {
    status,
    errorMessage,
    profile,
    progress,
    missionsCompleted,
    isLecturer: profile?.role === 'lecturer',
    supabaseConfigured,
    login,
    chooseAvatar,
    completeMission,
    logout,
    retry,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within a PlayerProvider');
  return ctx;
}
