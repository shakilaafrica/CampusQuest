/**
 * Client-side username/password rules. These give instant feedback in the UI.
 * Set matching rules in Supabase: Authentication > Providers > Email > Password requirements,
 * because only the server-side rules actually protect accounts.
 */
export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

export interface PasswordRule {
  id: string;
  label: string;
  test: (pw: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { id: 'length', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { id: 'upper', label: 'An uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { id: 'lower', label: 'A lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { id: 'digit', label: 'A number', test: (pw) => /\d/.test(pw) },
  { id: 'symbol', label: 'A symbol, like ! or #', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export function checkPassword(pw: string) {
  const results = PASSWORD_RULES.map((r) => ({ ...r, passed: r.test(pw) }));
  return { results, valid: results.every((r) => r.passed) };
}

export function validateUsername(username: string): string | null {
  if (!username) return 'Enter a username.';
  if (!USERNAME_PATTERN.test(username)) {
    return 'Use 3 to 20 letters, numbers or underscores.';
  }
  return null;
}

export const NICKNAME_MAX = 24;
export const STUDENT_NUMBER_PATTERN = /^[A-Za-z0-9]{3,12}$/;

export function validateNickname(nickname: string): string | null {
  const n = nickname.trim();
  if (!n) return 'Enter a nickname.';
  if (n.length > NICKNAME_MAX) return `Keep your nickname to ${NICKNAME_MAX} characters or fewer.`;
  return null;
}

export function validateStudentNumber(num: string): string | null {
  const n = num.trim();
  if (!n) return 'Enter your student number.';
  if (!STUDENT_NUMBER_PATTERN.test(n)) return 'Student numbers use 3 to 12 letters and numbers, like SMTJOH001.';
  return null;
}
