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

export function isValidPassword(value: string): boolean {
  return value.length >= 6;
}
