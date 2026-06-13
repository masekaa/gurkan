import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, EmptyState, Screen } from '@/components/ui';
import { useAppointments, useUpdateAppointmentStatus } from '@/hooks/queries';
import {
  categoryLabels,
  formatDate,
  formatDuration,
  formatPrice,
  formatTime,
  hoursUntil,
  statusMeta,
} from '@/lib/format';
import { centeredContent, colors, elevation, radius, spacing, typography } from '@/theme';

const STATUS_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  pending: 'hourglass-outline',
  approved: 'checkmark-circle-outline',
  rejected: 'close-circle-outline',
  cancelled: 'ban-outline',
  completed: 'sparkles-outline',
};

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useAppointments();
  const update = useUpdateAppointmentStatus();
  const [confirm, setConfirm] = useState(false);

  const appointment = (data ?? []).find((a) => a.id === id);

  if (isLoading) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.xxl }} />
      </Screen>
    );
  }

  if (!appointment) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: false }} />
        <TopBar onBack={() => router.back()} />
        <EmptyState icon="calendar-outline" title="Randevu bulunamadı" />
      </Screen>
    );
  }

  const { business, service, status, datetime } = appointment;
  const meta = statusMeta[status];
  const cancelable = status === 'pending' || status === 'approved';
  const windowH = business?.cancelWindowHours ?? 2;
  const cancelLocked = cancelable && hoursUntil(datetime) < windowH;
  const canCancel = cancelable && !cancelLocked;

  return (
    <Screen edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <TopBar onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[meta.color + '33', meta.color + '08']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.statusHero, { borderColor: meta.color + '55' }]}
        >
          <View style={[styles.statusIcon, { backgroundColor: meta.color + '22' }]}>
            <Ionicons name={STATUS_ICON[status] ?? 'ellipse-outline'} size={30} color={meta.color} />
          </View>
          <Text style={[styles.statusLabel, { color: meta.color }]}>{meta.label}</Text>
          <Text style={styles.statusSub}>
            {formatDate(datetime)} · {formatTime(datetime)}
          </Text>
        </LinearGradient>

        <View style={[styles.card, elevation.soft]}>
          <Row icon="business-outline" label="İşletme" value={business?.name ?? '—'} />
          {business ? (
            <>
              <View style={styles.divider} />
              <Row icon="pricetag-outline" label="Kategori" value={categoryLabels[business.category]} />
            </>
          ) : null}
          <View style={styles.divider} />
          <Row icon="cut-outline" label="Hizmet" value={service?.name ?? '—'} />
          <View style={styles.divider} />
          <Row icon="calendar-outline" label="Tarih" value={formatDate(datetime)} />
          <View style={styles.divider} />
          <Row icon="time-outline" label="Saat" value={`${formatTime(datetime)}${service ? ` · ${formatDuration(service.durationMin)}` : ''}`} />
          <View style={styles.divider} />
          <Row icon="cash-outline" label="Ücret" value={service ? formatPrice(service.price) : '—'} accent />
        </View>

        {business ? (
          <Button
            label="İşletmeyi Gör"
            variant="secondary"
            icon="storefront-outline"
            onPress={() => router.push({ pathname: '/business/[id]', params: { id: business.id } })}
          />
        ) : null}

        {canCancel ? (
          <Button label="Randevuyu İptal Et" variant="danger" icon="close" onPress={() => setConfirm(true)} />
        ) : cancelLocked ? (
          <Text style={styles.cancelLocked}>
            Randevuya {windowH} saatten az kaldığı için iptal edilemez.
          </Text>
        ) : null}
      </ScrollView>

      <Modal visible={confirm} transparent animationType="fade" onRequestClose={() => setConfirm(false)}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Ionicons name="alert-circle-outline" size={30} color={colors.danger} />
            <Text style={styles.dialogTitle}>Randevu iptal edilsin mi?</Text>
            <Text style={styles.dialogText}>Bu işlem geri alınamaz. Saat tekrar boşa çıkar.</Text>
            <View style={styles.dialogActions}>
              <View style={{ flex: 1 }}>
                <Button label="Vazgeç" variant="secondary" onPress={() => setConfirm(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="İptal Et"
                  variant="danger"
                  loading={update.isPending}
                  onPress={() =>
                    update.mutate(
                      { id: appointment.id, status: 'cancelled' },
                      { onSuccess: () => { setConfirm(false); router.back(); } },
                    )
                  }
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function TopBar({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.topbar}>
      <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Geri">
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>
      <Text style={styles.topTitle}>Randevu Detayı</Text>
      <View style={{ width: 22 }} />
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLabel}>
        <Ionicons name={icon} size={17} color={colors.gold} />
        <Text style={styles.rowLabelText}>{label}</Text>
      </View>
      <Text style={[styles.rowValue, accent && styles.rowAccent]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  topTitle: { ...typography.heading, color: colors.text },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl, ...centeredContent },
  statusHero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: { ...typography.heading },
  statusSub: { ...typography.caption, color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  rowLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowLabelText: { ...typography.caption, color: colors.textMuted },
  rowValue: { ...typography.bodyStrong, color: colors.text, flexShrink: 1, textAlign: 'right' },
  rowAccent: { color: colors.gold },
  cancelLocked: { ...typography.caption, color: colors.textMuted, textAlign: 'center', fontStyle: 'italic' },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center' },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    width: '88%',
    maxWidth: 360,
  },
  dialogTitle: { ...typography.heading, color: colors.text, textAlign: 'center' },
  dialogText: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  dialogActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm, width: '100%' },
});
