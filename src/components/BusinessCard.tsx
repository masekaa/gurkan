import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { categoryLabels } from '@/lib/format';
import {
  categoryStyle,
  colors,
  elevation,
  radius,
  spacing,
  typography,
} from '@/theme';
import type { Business } from '@/types';

/** True when `now` falls within the business's daily opening window. */
function isOpenNow(open: string, close: string): boolean {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = open.split(':').map(Number);
  const [ch, cm] = close.split(':').map(Number);
  return mins >= oh * 60 + om && mins < ch * 60 + cm;
}

export function BusinessCard({
  business,
  onPress,
}: {
  business: Business;
  onPress?: () => void;
}) {
  const cat = categoryStyle[business.category] ?? categoryStyle.erkek_berberi;
  const open = isOpenNow(business.openingTime, business.closingTime);
  const initials = business.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        elevation.card,
        pressed && styles.pressed,
      ]}
    >
      <LinearGradient
        colors={cat.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cover}
      >
        <Ionicons
          name={cat.icon as keyof typeof Ionicons.glyphMap}
          size={88}
          color="#ffffff14"
          style={styles.coverGlyph}
        />
        <View style={styles.ratingPill}>
          <Ionicons name="star" size={12} color={colors.gold} />
          <Text style={styles.ratingText}>{business.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({business.reviewCount})</Text>
        </View>
        <View style={[styles.statusPill, open ? styles.openPill : styles.closedPill]}>
          <View style={[styles.statusDot, { backgroundColor: open ? colors.success : colors.textFaint }]} />
          <Text style={[styles.statusText, { color: open ? colors.success : colors.textMuted }]}>
            {open ? 'Açık' : 'Kapalı'}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>{initials}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {business.name}
          </Text>
          <Text style={styles.category} numberOfLines={1}>
            {categoryLabels[business.category]}
          </Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color={colors.textFaint} />
            <Text style={styles.meta} numberOfLines={1}>
              {business.district}
            </Text>
            <Text style={styles.dotSep}>·</Text>
            <Ionicons name="time-outline" size={13} color={colors.textFaint} />
            <Text style={styles.meta}>
              {business.openingTime}–{business.closingTime}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.95 },
  cover: {
    height: 92,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    justifyContent: 'flex-start',
  },
  coverGlyph: { position: 'absolute', right: 8, bottom: -14 },
  ratingPill: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(14,14,18,0.72)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  ratingText: { ...typography.caption, fontWeight: '700', color: colors.text },
  reviewCount: { ...typography.micro, color: colors.textMuted },
  statusPill: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  openPill: { backgroundColor: 'rgba(70,178,106,0.16)' },
  closedPill: { backgroundColor: 'rgba(14,14,18,0.6)' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { ...typography.micro },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    marginTop: -34,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { ...typography.bodyStrong, color: colors.gold },
  info: { flex: 1, gap: 2 },
  name: { ...typography.bodyStrong, color: colors.text },
  category: { ...typography.caption, color: colors.gold },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  meta: { ...typography.caption, color: colors.textMuted, flexShrink: 1 },
  dotSep: { color: colors.textFaint, marginHorizontal: 2 },
});
