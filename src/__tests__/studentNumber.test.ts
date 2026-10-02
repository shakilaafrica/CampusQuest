import { describe, expect, it } from 'vitest';
import { isValidStudentNumber, normalizeStudentNumber } from '../lib/studentNumber';

describe('Student number validation', () => {
  it('accepts six letters followed by three digits', () => {
    expect(isValidStudentNumber('AFRSHA002')).toBe(true);
  });

  it('accepts lowercase input when validating', () => {
    expect(isValidStudentNumber('afrsha002')).toBe(true);
  });

  it.each(['AFR002', 'AFRSHA02', 'AFRSHA0002', '123456789', 'AFR-SHA002'])('rejects invalid student number %s', (value) => {
    expect(isValidStudentNumber(value)).toBe(false);
  });

  it('normalises student numbers before authentication', () => {
    expect(normalizeStudentNumber('  afrsha002 ')).toBe('AFRSHA002');
  });
});
