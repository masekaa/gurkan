import type { Business, DayHours } from '@/types';

/** Weekday labels indexed by Date.getDay() (0=Sun..6=Sat). */
export const DAY_LABELS = [
  'Pazar',
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
];
export const DAY_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

/** Monday-first ordering of getDay() indices, for editors and lists. */
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** A full week of identical hours, all days open. */
export function defaultHours(open = '09:00', close = '20:00'): DayHours[] {
  return Array.from({ length: 7 }, () => ({ open, close, closed: false }));
}

/**
 * Resolve a business's hours for a given weekday (Date.getDay()), falling back
 * to the legacy single openingTime/closingTime when `hours` is not set.
 */
export function getDayHours(
  b: Pick<Business, 'hours' | 'openingTime' | 'closingTime'>,
  dayIndex: number,
): DayHours {
  const d = b.hours?.[dayIndex];
  if (d) return d;
  return { open: b.openingTime, close: b.closingTime, closed: false };
}

/** True when the business is open right now, respecting today's per-day hours. */
export function isOpenToday(
  b: Pick<Business, 'hours' | 'openingTime' | 'closingTime'>,
): boolean {
  const d = getDayHours(b, new Date().getDay());
  if (d.closed) return false;
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = d.open.split(':').map(Number);
  const [ch, cm] = d.close.split(':').map(Number);
  return mins >= oh * 60 + om && mins < ch * 60 + cm;
}
