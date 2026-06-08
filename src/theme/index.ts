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

export const theme = { colors, spacing, radius, typography };
export type Theme = typeof theme;
