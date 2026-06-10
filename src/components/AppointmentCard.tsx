import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, Button } from './ui';
import {
  formatDate,
  formatDay,
  formatDuration,
  formatMonthShort,
  formatPrice,
  formatTime,
  statusMeta,
} from '@/lib/format';
import { colors, elevation, radius, spacing, typography } from '@/theme';
import type { Appointment } from '@/types';

export function AppointmentCard({
  appointment,
  onCancel,
  onPress,
}: {
  appointment: Appointment;
  onCancel?: () => void;
  onPress?: () => void;
}) {
  const { business, service, status, datetime } = appointment;
  const meta = statusMeta[status];
  const canCancel = status === 'pending' || status === 'approved';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${business?.name ?? 'İşletme'}, ${service?.name ?? 'Hizmet'}, ${meta.label}, ${formatDate(datetime)} ${formatTime(datetime)}`}
      style={({ pressed }) => [
        styles.card,
        elevation.soft,
        pressed && onPress && { opacity: 0.9 },
      ]}
    >
      <View style={[styles.accent, { backgroundColor: meta.color }]} />
      <View style={styles.inner}>
        <View style={styles.topRow}>
          <View style={styles.dateBox}>
            <Text style={styles.day}>{formatDay(datetime)}</Text>
            <Text style={styles.month}>{formatMonthShort(datetime)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.business} numberOfLines={1}>
              {business?.name ?? 'İşletme'}
            </Text>
            <Text style={styles.service} numberOfLines={1}>
              {service?.name ?? 'Hizmet'}
            </Text>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={13} color={colors.textFaint} />
              <Text style={styles.meta}>
                {formatTime(datetime)}
                {service ? ` · ${formatDuration(service.durationMin)}` : ''}
              </Text>
            </View>
          </View>
          <Badge label={meta.label} color={meta.color} />
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.price}>{service ? formatPrice(service.price) : ''}</Text>
          {canCancel && onCancel ? (
            <View style={{ width: 130 }}>
              <Button label="İptal Et" variant="secondary" onPress={onCancel} />
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  accent: { width: 4 },
  inner: { flex: 1, padding: spacing.lg, gap: spacing.md },
  topRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  dateBox: {
    width: 56,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
  },
  day: { ...typography.title, color: colors.gold, lineHeight: 26 },
  month: { ...typography.micro, color: colors.textMuted, textTransform: 'uppercase' },
  business: { ...typography.bodyStrong, color: colors.text },
  service: { ...typography.caption, color: colors.gold, marginTop: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  meta: { ...typography.caption, color: colors.textMuted },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  price: { ...typography.heading, color: colors.text },
});
