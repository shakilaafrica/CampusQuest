// UCT student numbers used by Campus Quest: 6 letters followed by 3 digits.
// e.g. AFRSHA002
export const STUDENT_NUMBER_REGEX = /^[A-Za-z]{6}[0-9]{3}$/;
export const STUDENT_NUMBER_EXAMPLE = 'AFRSHA002';

export function normalizeStudentNumber(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isValidStudentNumber(raw: string): boolean {
  return STUDENT_NUMBER_REGEX.test(raw.trim());
}
