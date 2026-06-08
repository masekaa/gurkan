/**
 * Altın100 design tokens.
 *
 * The brand leans on a dark "charcoal" surface with a warm gold accent
 * (altın = gold), which reads as premium for the barber / beauty segment.
 * Every screen pulls spacing, colour and type from here so the look stays
 * consistent across web, iOS and Android.
 */

export const colors = {
  // Brand
  gold: '#D9B25A',
  goldSoft: '#E7CD8E',
  goldDeep: '#B8923C',

  // Surfaces (dark theme)
  background: '#0E0E12',
  surface: '#17171D',
  surfaceAlt: '#1F1F27',
  border: '#2A2A33',

  // Text
  text: '#F4F1EA',
  textMuted: '#A8A6A0',
  textFaint: '#6E6C68',
  onGold: '#171109',

  // Status (appointment states)
  pending: '#E2A33C',
  approved: '#46B26A',
  rejected: '#D85C5C',
  cancelled: '#8A8A93',
  completed: '#4C8DD8',

  // Misc
  danger: '#D85C5C',
  success: '#46B26A',
  overlay: 'rgba(0,0,0,0.55)',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 7,
  },
  gold: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

/** Brand gradient ramps (start → end), consumed by expo-linear-gradient. */
export const gradients = {
  goldButton: ['#EBD49B', '#D9B25A', '#C49A45'],
  hero: ['#21212B', '#14141A', '#0E0E12'],
  goldHalo: ['#D9B25A33', '#D9B25A00'],
} as const;

/** Per-category cover gradient + glyph, used on cards and detail heroes. */
export const categoryStyle: Record<
  string,
  { gradient: readonly [string, string]; icon: string }
> = {
  erkek_berberi: { gradient: ['#2C3A8E', '#161E45'], icon: 'cut' },
  kadin_kuaforu: { gradient: ['#7E2E6E', '#3A1633'], icon: 'sparkles' },
  guzellik_merkezi: { gradient: ['#A8527A', '#46203A'], icon: 'flower' },
  barber_shop: { gradient: ['#1F5A52', '#0F2A26'], icon: 'cut' },
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
