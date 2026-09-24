import type { Session, User } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabaseClient';
import type { CharacterInfo, Profile } from '../types';
import { EXPLORERS } from '../types';
import { NetworkError, toNetworkError } from '../utils/errors';
import { checkPassword, validateNickname, validateStudentNumber, validateUsername } from '../utils/passwordPolicy';

/**
 * Supabase Auth signs in with an email address, but Campus Quest uses usernames.
 * Each username is mapped to a private, never-emailed address on a reserved domain.
 * "Confirm email" must be OFF in Supabase (Authentication > Providers > Email).
 */
const LOGIN_DOMAIN = 'players.campusquest.local';
const toLoginEmail = (username: string) => `${username.trim().toLowerCase()}@${LOGIN_DOMAIN}`;

export async function signUp(username: string, password: string, character: CharacterInfo): Promise<User> {
  const problem =
    validateUsername(username.trim()) ??
    (checkPassword(password).valid ? null : 'That password doesn’t meet every requirement yet.') ??
    validateNickname(character.nickname) ??
    validateStudentNumber(character.studentNumber) ??
    (EXPLORERS.includes(character.explorer) ? null : 'Choose an explorer.');
  if (problem) throw new NetworkError(problem, 'INVALID_INPUT');

  const { data, error } = await getSupabase().auth.signUp({
    email: toLoginEmail(username),
    password,
    options: {
      // Read by the handle_new_user trigger, which creates the profile and the starting save.
      data: {
        username: username.trim(),
        nickname: character.nickname.trim(),
        student_number: character.studentNumber.trim().toUpperCase(),
        explorer: character.explorer,
      },
    },
  });
  if (error) throw toNetworkError(error);
  if (!data.user) throw new NetworkError('Account creation didn’t finish. Try again.', 'SIGNUP_INCOMPLETE');
  if (!data.session) {
    throw new NetworkError(
      'Your account was created, but email confirmation is switched on in Supabase. Turn it off so players can start straight away.',
      'CONFIRMATION_REQUIRED',
    );
  }
  return data.user;
}

export async function logIn(username: string, password: string): Promise<User> {
  if (!username.trim() || !password) {
    throw new NetworkError('Enter your username and password.', 'MISSING_FIELDS');
  }
  const { data, error } = await getSupabase().auth.signInWithPassword({
    email: toLoginEmail(username),
    password,
  });
  if (error) throw toNetworkError(error);
  return data.user;
}

export async function logOut(): Promise<void> {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw toNetworkError(error);
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) throw toNetworkError(error);
  return data.session;
}

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('id, username, role, created_at, last_seen_at')
    .eq('id', userId)
    .single();
  if (error) throw toNetworkError(error, 'Couldn’t load your player profile.');
  return data as Profile;
}

export async function touchLastSeen(): Promise<void> {
  const { error } = await getSupabase().rpc('touch_last_seen');
  if (error) console.warn('[network] touch_last_seen failed', error);
}

export function onAuthChange(callback: (session: Session | null) => void): () => void {
  const { data } = getSupabase().auth.onAuthStateChange((_event, session) => {
    // Defer: calling Supabase inside this callback synchronously can deadlock the client.
    setTimeout(() => callback(session), 0);
  });
  return () => data.subscription.unsubscribe();
}
