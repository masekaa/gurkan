import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Badge, Button, EmptyState, ErrorState, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useBusinessAppointments, useUpdateAppointmentStatus } from '@/hooks/queries';
import { formatDate, formatTime, statusMeta } from '@/lib/format';
import { colors, elevation, radius, spacing, typography } from '@/theme';
import type { Appointment, AppointmentStatus } from '@/types';

type Tab = 'pending' | 'approved' | 'history';

const FILTERS: Record<Tab, AppointmentStatus[]> = {
  pending: ['pending'],
  approved: ['approved'],
  history: ['completed', 'cancelled', 'rejected'],
};

export default function OrdersScreen() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>('pending');
  const { data, isLoading, isError, refetch } = useBusinessAppointments(profile?.id);
  const update = useUpdateAppointmentStatus();

  const items = useMemo(
    () => (data ?? []).filter((a) => FILTERS[tab].includes(a.status)),
    [data, tab],
  );

  const pendingCount = (data ?? []).filter((a) => a.status === 'pending').length;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Gelen Randevular</Text>
        <View style={styles.segment}>
          {(['pending', 'approved', 'history'] as Tab[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t }}
              accessibilityLabel={t === 'pending' ? 'Bekleyen' : t === 'approved' ? 'Onaylı' : 'Geçmiş'}
              style={[styles.segBtn, tab === t && styles.segActive]}
            >
              <Text style={[styles.segText, tab === t && styles.segTextActive]}>
                {t === 'pending' ? 'Bekleyen' : t === 'approved' ? 'Onaylı' : 'Geçmiş'}
              </Text>
              {t === 'pending' && pendingCount > 0 ? (
                <View style={styles.count}>
                  <Text style={styles.countText}>{pendingCount}</Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.xxl }} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <OrderCard
              appointment={item}
              busy={update.isPending}
              onAction={(status) => update.mutate({ id: item.id, status })}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={
            <EmptyState
              icon="albums-outline"
              title="Bu listede randevu yok"
              subtitle="Yeni randevular geldikçe burada görünecek."
            />
          }
        />
      )}
    </Screen>
  );
}

function OrderCard({
  appointment,
  onAction,
  busy,
}: {
  appointment: Appointment;
  onAction: (status: AppointmentStatus) => void;
  busy: boolean;
}) {
  const { customerName, service, status, datetime } = appointment;
  const meta = statusMeta[status];
  const initial = (customerName ?? 'M').trim().charAt(0).toUpperCase();

  return (
    <View style={[styles.card, elevation.soft]}>
      <View style={[styles.accent, { backgroundColor: meta.color }]} />
      <View style={styles.inner}>
        <View style={styles.cardTop}>
          <View style={styles.customerAvatar}>
            <Text style={styles.customerInitial}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.customer}>{customerName ?? 'Müşteri'}</Text>
            <Text style={styles.service}>{service?.name ?? 'Hizmet'}</Text>
          </View>
          <Badge label={meta.label} color={meta.color} />
        </View>

        <View style={styles.timeRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.textFaint} />
          <Text style={styles.time}>
            {formatDate(datetime)} · {formatTime(datetime)}
          </Text>
        </View>

      {status === 'pending' ? (
        <View style={styles.actions}>
          <View style={{ flex: 1 }}>
            <Button label="Reddet" variant="secondary" onPress={() => onAction('rejected')} disabled={busy} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Onayla" onPress={() => onAction('approved')} disabled={busy} />
          </View>
        </View>
      ) : null}

        {status === 'approved' ? (
          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <Button label="İptal" variant="secondary" onPress={() => onAction('cancelled')} disabled={busy} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Tamamlandı" icon="checkmark" onPress={() => onAction('completed')} disabled={busy} />
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  title: { ...typography.title, color: colors.text },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  segBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: 9,
  },
  segActive: { backgroundColor: colors.surfaceAlt },
  segText: { ...typography.caption, color: colors.textMuted },
  segTextActive: { color: colors.text, fontWeight: '700' },
  count: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { ...typography.micro, color: colors.onGold },
  list: { padding: spacing.lg, flexGrow: 1 },
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
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gold + '55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInitial: { ...typography.bodyStrong, color: colors.gold },
  customer: { ...typography.bodyStrong, color: colors.text },
  service: { ...typography.caption, color: colors.gold, marginTop: 2 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  time: { ...typography.caption, color: colors.textMuted },
  actions: { flexDirection: 'row', gap: spacing.md },
});
