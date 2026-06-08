import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from './ui';
import { categoryLabels } from '@/lib/format';
import { colors, radius, spacing, typography } from '@/theme';
import type { Business } from '@/types';

export function BusinessCard({
  business,
  onPress,
}: {
  business: Business;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
    >
      <Avatar name={business.name} />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {business.name}
        </Text>
        <Text style={styles.category}>{categoryLabels[business.category]}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={colors.textFaint} />
          <Text style={styles.meta} numberOfLines={1}>
            {business.district}
          </Text>
        </View>
      </View>
      <View style={styles.rating}>
        <Ionicons name="star" size={13} color={colors.gold} />
        <Text style={styles.ratingText}>{business.rating.toFixed(1)}</Text>
        <Text style={styles.reviewCount}>({business.reviewCount})</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
  },
  body: { flex: 1, gap: 2 },
  name: { ...typography.bodyStrong, color: colors.text },
  category: { ...typography.caption, color: colors.gold },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  meta: { ...typography.caption, color: colors.textMuted, flexShrink: 1 },
  rating: { alignItems: 'center', flexDirection: 'row', gap: 3 },
  ratingText: { ...typography.bodyStrong, color: colors.text },
  reviewCount: { ...typography.micro, color: colors.textFaint },
});
