import type {
  AppointmentStatus,
  BusinessCategory,
} from '@/types';
import { colors } from '@/theme';

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDuration(min: number): string {
  if (min < 60) return `${min} dk`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} sa ${m} dk` : `${h} sa`;
}

const dateFmt = new Intl.DateTimeFormat('tr-TR', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
});
const timeFmt = new Intl.DateTimeFormat('tr-TR', {
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

const dayFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric' });
const monthShortFmt = new Intl.DateTimeFormat('tr-TR', { month: 'short' });

/** Day-of-month number, e.g. "9". */
export function formatDay(iso: string): string {
  return dayFmt.format(new Date(iso));
}

/** Short month name, e.g. "Haz". Locale-safe (no string splitting). */
export function formatMonthShort(iso: string): string {
  return monthShortFmt.format(new Date(iso));
}

/** Hours from now until the given ISO datetime (negative if past). */
export function hoursUntil(iso: string): number {
  return (new Date(iso).getTime() - Date.now()) / 3600000;
}

/** True when the current local time is within [open, close) ("HH:MM"). */
export function isOpenNow(open: string, close: string): boolean {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = open.split(':').map(Number);
  const [ch, cm] = close.split(':').map(Number);
  return mins >= oh * 60 + om && mins < ch * 60 + cm;
}

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

export const categoryLabels: Record<BusinessCategory, string> = {
  erkek_berberi: 'Erkek Berberi',
  kadin_kuaforu: 'Kadın Kuaförü',
  guzellik_merkezi: 'Güzellik Merkezi',
  barber_shop: 'Barber Shop',
};

export const statusMeta: Record<
  AppointmentStatus,
  { label: string; color: string }
> = {
  pending: { label: 'Onay Bekliyor', color: colors.pending },
  approved: { label: 'Onaylandı', color: colors.approved },
  rejected: { label: 'Reddedildi', color: colors.rejected },
  cancelled: { label: 'İptal Edildi', color: colors.cancelled },
  completed: { label: 'Tamamlandı', color: colors.completed },
};
