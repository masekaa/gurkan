import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Badge, Button } from './ui';
import {
  formatDate,
  formatDuration,
  formatPrice,
  formatTime,
  statusMeta,
} from '@/lib/format';
import { colors, radius, spacing, typography } from '@/theme';
import type { Appointment } from '@/types';

export function AppointmentCard({
  appointment,
  onCancel,
}: {
  appointment: Appointment;
  onCancel?: () => void;
}) {
  const { business, service, status, datetime } = appointment;
  const meta = statusMeta[status];
  const canCancel = status === 'pending' || status === 'approved';

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.dateBox}>
          <Text style={styles.day}>{formatDate(datetime).split(' ')[1]}</Text>
          <Text style={styles.month}>{formatTime(datetime)}</Text>
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
              {formatDate(datetime)} · {service ? formatDuration(service.durationMin) : ''}
            </Text>
          </View>
        </View>
        <Badge label={meta.label} color={meta.color} />
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.price}>
          {service ? formatPrice(service.price) : ''}
        </Text>
        {canCancel && onCancel ? (
          <View style={{ width: 130 }}>
            <Button label="İptal Et" variant="secondary" onPress={onCancel} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  topRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  dateBox: {
    width: 58,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
  },
  day: { ...typography.heading, color: colors.gold },
  month: { ...typography.micro, color: colors.textMuted },
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
