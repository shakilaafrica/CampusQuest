import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabaseClient';
import { isValidStudentNumber, normalizeStudentNumber } from '../lib/studentNumber';
import { AVATAR_OPTIONS } from '../lib/avatars';

export const DEV_UNLOCK_ALL_LEVELS = false;

function studentAuthEmail(studentNumber: string) {
  const projectHost = new URL(import.meta.env.VITE_SUPABASE_URL).hostname;
  return `${studentNumber.toLowerCase()}@${projectHost}`;
}

const HEARTBEAT_INTERVAL_MS = 30_000;

export interface Profile {
  id: string;
  auth_user_id: string | null;
  student_number: string | null;
  selected_avatar: string | null;
  role: 'student' | 'lecturer' | 'tutor';
  created_at: string;
  last_seen_at: string;
}

export interface MissionProgressRow {
  mission_number: number;
  completed: boolean;
  started_at: string | null;
  completed_at: string | null;
}

export type AuthResult =
  | { ok: true; kind: 'new' | 'student' | 'staff' }
  | { ok: false; message: string };

type Status = 'loading' | 'anonymous' | 'ready';

interface PlayerContextValue {
  status: Status;
  profile: Profile | null;
  progress: Record<number, MissionProgressRow>;
  missionsCompleted: number;
  supabaseConfigured: boolean;
  newGame: (rawStudentNumber: string, password: string) => Promise<AuthResult>;
  loadGame: (rawStudentNumber: string, password: string) => Promise<AuthResult>;
  staffRegister: (email: string, password: string) => Promise<AuthResult>;
  staffLogin: (email: string, password: string) => Promise<AuthResult>;
  chooseAvatar: (avatarId: string) => Promise<AuthResult>;
  completeMission: (missionNumber: number) => Promise<void>;
  logout: () => Promise<void>;
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
  const [status, setStatus] = useState<Status>('loading');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<Record<number, MissionProgressRow>>(emptyProgress());

  const sessionIdRef = useRef<string | null>(null);
  const heartbeatRef = useRef<number | null>(null);
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

  const hydrateProfile = useCallback(async (authUserId: string, startGameSession: boolean) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const currentProfile = data as Profile;
    setProfile(currentProfile);
    if (currentProfile.role === 'student') {
      await loadProgress(currentProfile.id);
      if (startGameSession) await startSession(currentProfile.id);
    } else {
      setProgress(emptyProgress());
    }
    return currentProfile;
  }, [loadProgress, startSession]);

  useEffect(() => {
    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && mounted) {
        setProfile(null);
        setProgress(emptyProgress());
        setStatus('anonymous');
      }
    });

    void supabase.auth.getSession().then(async ({ data, error }) => {
      if (!mounted) return;
      if (error || !data.session) {
        setStatus('anonymous');
        return;
      }
      try {
        const restored = await hydrateProfile(data.session.user.id, true);
        if (!restored) await supabase.auth.signOut();
        else if (mounted) setStatus('ready');
      } catch {
        await supabase.auth.signOut();
        if (mounted) setStatus('anonymous');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateProfile]);

  const authNotReady = (): AuthResult => ({
    ok: false,
    message: 'Campus Quest is not connected to Supabase. Ask your administrator to configure the app.',
  });

  const newGame = useCallback(async (rawStudentNumber: string, password: string): Promise<AuthResult> => {
    if (!isValidStudentNumber(rawStudentNumber)) {
      return { ok: false, message: 'Enter a valid student number: 6 letters followed by 3 numbers.' };
    }
    if (!supabaseConfigured) return authNotReady();

    const studentNumber = normalizeStudentNumber(rawStudentNumber);
    const email = studentAuthEmail(studentNumber);

    const { data: accountExists, error: lookupError } = await supabase.rpc(
      'campus_quest_student_number_exists',
      { requested_student_number: studentNumber }
    );
    if (lookupError) {
      return { ok: false, message: 'Could not start a new game. Please try again later.' };
    }
    if (accountExists) {
      return { ok: false, message: 'A game already exists for this student number. Choose Load Game.' };
    }

    if (password.length < 8) return { ok: false, message: 'Use a password with at least 8 characters.' };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { student_number: studentNumber } },
    });
    if (error) {
      const detail = error.message.toLowerCase();
      console.error('[Campus Quest] Student signup failed:', error);
      if (detail.includes('already') || detail.includes('duplicate')) {
        return { ok: false, message: 'A game already exists for this student number. Choose Load Game.' };
      }
      return { ok: false, message: 'Could not create a new game. Please check your details and try again.' };
    }
    if (!data.session || !data.user) {
      return { ok: false, message: 'Could not start a new game. Please try again later.' };
    }

    try {
      const createdProfile = await hydrateProfile(data.user.id, false);
      if (
        !createdProfile
        || createdProfile.auth_user_id !== data.user.id
        || createdProfile.student_number !== studentNumber
        || createdProfile.role !== 'student'
      ) {
        await supabase.auth.signOut();
        return { ok: false, message: 'Could not initialize this player profile.' };
      }
      setProgress(emptyProgress());
      setStatus('ready');
      return { ok: true, kind: 'new' };
    } catch (err) {
      await supabase.auth.signOut();
      return { ok: false, message: err instanceof Error ? err.message : 'Could not initialize this player profile.' };
    }
  }, [hydrateProfile, startSession]);

  const loadGame = useCallback(async (rawStudentNumber: string, password: string): Promise<AuthResult> => {
    if (!isValidStudentNumber(rawStudentNumber)) {
      return { ok: false, message: 'Enter a valid student number: 6 letters followed by 3 numbers.' };
    }
    if (!supabaseConfigured) return authNotReady();

    const studentNumber = normalizeStudentNumber(rawStudentNumber);
    const { data, error } = await supabase.auth.signInWithPassword({ email: studentAuthEmail(studentNumber), password });
    if (error || !data.user) {
      return { ok: false, message: 'Incorrect student number or password.' };
    }

    try {
      const savedProfile = await hydrateProfile(data.user.id, false);
      if (
        !savedProfile
        || savedProfile.auth_user_id !== data.user.id
        || savedProfile.student_number !== studentNumber
        || savedProfile.role !== 'student'
      ) {
        await supabase.auth.signOut();
        return { ok: false, message: 'No saved game found. Start a New Game first.' };
      }
      await startSession(savedProfile.id);
      setStatus('ready');
      return { ok: true, kind: 'student' };
    } catch {
      await supabase.auth.signOut();
      return { ok: false, message: 'Could not load this saved game. Try again.' };
    }
  }, [hydrateProfile, startSession]);

  const staffLogin = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabaseConfigured) return authNotReady();
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.user) return { ok: false, message: 'Email or password is incorrect.' };

    try {
      const staffProfile = await hydrateProfile(data.user.id, false);
      if (!staffProfile || !['lecturer', 'tutor'].includes(staffProfile.role)) {
        await supabase.auth.signOut();
        return { ok: false, message: 'This account is not authorised for staff statistics.' };
      }
      setStatus('ready');
      return { ok: true, kind: 'staff' };
    } catch {
      await supabase.auth.signOut();
      return { ok: false, message: 'Staff access could not be verified.' };
    }
  }, [hydrateProfile]);

  const staffRegister = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabaseConfigured) return authNotReady();
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return { ok: false, message: 'Enter a valid staff email address.' };
    }
    if (password.length < 8) return { ok: false, message: 'Use a password with at least 8 characters.' };

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: { data: { account_type: 'staff' } },
    });
    if (error || !data.user) {
      return {
        ok: false,
        message: 'Registration failed. Only emails pre-approved as lecturer or tutor by an administrator can register.',
      };
    }

    if (data.session) await supabase.auth.signOut();
    return { ok: true, kind: 'staff' };
  }, []);

  const chooseAvatar = useCallback(
    async (avatarId: string): Promise<AuthResult> => {
      if (!profile || profile.role !== 'student') {
        return { ok: false, message: 'Sign in to choose an avatar.' };
      }
      if (!AVATAR_OPTIONS.some((avatar) => avatar.id === avatarId)) {
        return { ok: false, message: 'Choose one of the available avatars.' };
      }
      const { data, error } = await supabase
        .from('profiles')
        .update({ selected_avatar: avatarId })
        .eq('id', profile.id)
        .select('*')
        .single();
      if (error) {
        return { ok: false, message: error.message };
      }
      setProfile(data as Profile);
      await startSession(profile.id);
      return { ok: true, kind: 'student' };
    },
    [profile, startSession]
  );

  const completeMission = useCallback(
    async (missionNumber: number) => {
      if (!profile || profile.role !== 'student') return;
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
    await endSession();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, [endSession]);

  const missionsCompleted = Object.values(progress).filter((p) => p.completed).length;

  const value: PlayerContextValue = {
    status,
    profile,
    progress,
    missionsCompleted,
    supabaseConfigured,
    newGame,
    loadGame,
    staffRegister,
    staffLogin,
    chooseAvatar,
    completeMission,
    logout,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within a PlayerProvider');
  return ctx;
}
