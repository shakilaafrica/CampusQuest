/**
 * Turns Supabase / Postgres errors into messages a player can act on.
 * Raw database errors are logged to the console, never shown on screen.
 */
export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

const KNOWN: { match: RegExp; code: string; message: string }[] = [
  { match: /invalid login credentials/i, code: 'BAD_CREDENTIALS', message: 'That username and password don’t match. Check both and try again.' },
  { match: /user already registered/i, code: 'USERNAME_TAKEN', message: 'That username is taken. Choose a different one.' },
  { match: /database error saving new user|duplicate key|profiles_username_lower_idx/i, code: 'USERNAME_TAKEN', message: 'That username is taken. Choose a different one.' },
  { match: /password should be|weak password|password is known/i, code: 'WEAK_PASSWORD', message: 'That password doesn’t meet the requirements. Make it longer or add more character types.' },
  { match: /rate limit|too many requests/i, code: 'RATE_LIMITED', message: 'Too many attempts. Wait a minute, then try again.' },
  { match: /failed to fetch|network|fetch failed/i, code: 'OFFLINE', message: 'Can’t reach the game server. Check your internet connection.' },
  { match: /MISSION_LOCKED/, code: 'MISSION_LOCKED', message: 'This mission isn’t unlocked yet. Finish the previous mission first.' },
  { match: /UNKNOWN_MISSION/, code: 'UNKNOWN_MISSION', message: 'The game sent an unknown mission. Progress wasn’t saved.' },
  { match: /NOT_AUTHENTICATED|JWT/i, code: 'NOT_AUTHENTICATED', message: 'Your session has ended. Log in again to keep playing.' },
  { match: /INVALID_CHARACTER/, code: 'INVALID_CHARACTER', message: 'Check your nickname and student number, then try again.' },
  { match: /NOT_AUTHORISED/, code: 'NOT_AUTHORISED', message: 'Only admin accounts can view these stats.' },
];

export function toNetworkError(err: unknown, fallback = 'Something went wrong talking to the server. Try again.'): NetworkError {
  if (err instanceof NetworkError) return err;
  const raw =
    typeof err === 'object' && err !== null && 'message' in err
      ? String((err as { message: unknown }).message)
      : String(err);

  // eslint-disable-next-line no-console
  console.error('[network]', err);

  const hit = KNOWN.find((k) => k.match.test(raw));
  return hit ? new NetworkError(hit.message, hit.code, err) : new NetworkError(fallback, 'UNKNOWN', err);
}
