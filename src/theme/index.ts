/**
 * İyiKiRandevu design tokens.
 *
 * The brand leans on a dark "charcoal" surface with a warm gold accent
 * (altın = gold), which reads as premium for the barber / beauty segment.
 * Every screen pulls spacing, colour and type from here so the look stays
 * consistent across web, iOS and Android.
 */

export const colors = {
  // Brand (gold) — deepened so it reads on light surfaces.
  gold: '#B5862B',
  goldSoft: '#D9B25A',
  goldDeep: '#8A6520',

  // Surfaces (light theme — airy, Getir-like)
  background: '#F4F4F7',
  surface: '#FFFFFF',
  surfaceAlt: '#EEEEF2',
  border: '#E4E4EA',

  // Text
  text: '#1B1B22',
  textMuted: '#6C6C77',
  textFaint: '#A6A6B0',
  onGold: '#241A05',

  // Status (appointment states)
  pending: '#D9882A',
  approved: '#2EA85C',
  rejected: '#D6483B',
  cancelled: '#9A9AA4',
  completed: '#3B7DD8',
  noShow: '#8A5A2B',

  // Misc
  danger: '#D6483B',
  success: '#2EA85C',
  overlay: 'rgba(0,0,0,0.45)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 28, fontWeight: '700' as const, letterSpacing: 0.2 },
  title: { fontSize: 22, fontWeight: '700' as const },
  heading: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  micro: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.6 },
} as const;

/**
 * Soft elevation presets. iOS reads shadow*; Android reads elevation;
 * react-native-web maps shadow* to box-shadow — so one object covers all three.
 */
export const elevation = {
  soft: {
    shadowColor: '#1B1B22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  card: {
    shadowColor: '#1B1B22',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  gold: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

/** Brand gradient ramps (start → end), consumed by expo-linear-gradient. */
export const gradients = {
  goldButton: ['#E2BE66', '#CFA23F', '#B5862B'],
} as const;

/** Per-category cover gradient + glyph, used on cards and detail heroes. */
export const categoryStyle: Record<
  string,
  { gradient: readonly [string, string]; icon: string }
> = {
  // Canonical
  berber: { gradient: ['#2C3A8E', '#161E45'], icon: 'cut' },
  kuafor: { gradient: ['#7E2E6E', '#3A1633'], icon: 'sparkles' },
  guzellik_merkezi: { gradient: ['#A8527A', '#46203A'], icon: 'flower' },
  nail_art: { gradient: ['#C25E86', '#5A2440'], icon: 'color-palette' },
  lazer_epilasyon: { gradient: ['#1F5A52', '#0F2A26'], icon: 'flash' },
  // Legacy → reuse the closest current style
  erkek_berberi: { gradient: ['#2C3A8E', '#161E45'], icon: 'cut' },
  kadin_kuaforu: { gradient: ['#7E2E6E', '#3A1633'], icon: 'sparkles' },
  barber_shop: { gradient: ['#2C3A8E', '#161E45'], icon: 'cut' },
};

/** Layout constraints — keeps content readable on wide (web) viewports. */
export const layout = {
  /** Max content column width; centered on large screens. */
  maxWidth: 640,
} as const;

/** Spread into a content/list container to center + cap width on web. */
export const centeredContent = {
  width: '100%',
  maxWidth: layout.maxWidth,
  alignSelf: 'center',
} as const;

export const theme = { colors, spacing, radius, typography, elevation, gradients, layout };
export type Theme = typeof theme;
