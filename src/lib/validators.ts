/** Lightweight client-side form validators. */

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Empty is allowed (phone optional); otherwise expects a plausible number. */
export function isValidPhone(value: string): boolean {
  const v = value.trim();
  if (v === '') return true;
  const digits = v.replace(/[^0-9]/g, '');
  return /^[0-9+()\s-]+$/.test(v) && digits.length >= 10 && digits.length <= 15;
}

/**
 * Password policy: at least 8 characters, with at least one uppercase letter,
 * one lowercase letter, and one digit. Turkish letters count toward the
 * upper/lowercase requirements.
 */
export const PASSWORD_MIN_LENGTH = 8;

/** Human-readable statement of the password rule (used in hints and errors). */
export const PASSWORD_RULE =
  'Şifre en az 8 karakter olmalı ve en az bir büyük harf, bir küçük harf ve bir rakam içermeli.';

export function isValidPassword(value: string): boolean {
  return (
    value.length >= PASSWORD_MIN_LENGTH &&
    /[a-zçğıiöşü]/.test(value) &&
    /[A-ZÇĞIİÖŞÜ]/.test(value) &&
    /[0-9]/.test(value)
  );
}
