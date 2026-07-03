import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { categoryLabels } from '@/lib/format';
import { categoryStyle, colors, elevation, radius, spacing, typography } from '@/theme';
import type { Business } from '@/types';

/** Fixed-width business card for horizontal carousels (Getir-style rows). */
export function BusinessCardCompact({
  business,
  onPress,
}: {
  business: Business;
  onPress?: () => void;
}) {
  const cat = categoryStyle[business.category] ?? categoryStyle.berber;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${business.name}, ${categoryLabels[business.category]}, ${business.rating.toFixed(1)} yıldız`}
      style={({ pressed }) => [styles.card, elevation.card, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={cat.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cover}
      >
        <Ionicons
          name={cat.icon as keyof typeof Ionicons.glyphMap}
          size={64}
          color="#ffffff1f"
          style={styles.glyph}
        />
        <View style={styles.ratingPill}>
          <Ionicons name="star" size={11} color={colors.goldSoft} />
          <Text style={styles.ratingText}>{business.rating.toFixed(1)}</Text>
        </View>
      </LinearGradient>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{business.name}</Text>
        <Text style={styles.category} numberOfLines={1}>{categoryLabels[business.category]}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={12} color={colors.textFaint} />
          <Text style={styles.meta} numberOfLines={1}>{business.district}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 184,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.95 },
  cover: { height: 76, padding: spacing.sm, justifyContent: 'flex-start' },
  glyph: { position: 'absolute', right: -6, bottom: -10 },
  ratingPill: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(20,18,14,0.72)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  ratingText: { ...typography.micro, color: '#fff', fontWeight: '700' },
  body: { padding: spacing.md, gap: 2 },
  name: { ...typography.bodyStrong, color: colors.text },
  category: { ...typography.caption, color: colors.gold },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  meta: { ...typography.caption, color: colors.textMuted, flexShrink: 1 },
});
