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
