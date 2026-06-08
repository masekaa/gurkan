import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, Button, ErrorState, ListSkeleton, Screen } from '@/components/ui';
import {
  useAllAppointments,
  useAllBusinesses,
  useSetBusinessApproved,
} from '@/hooks/queries';
import { categoryLabels, formatDateTime, statusMeta } from '@/lib/format';
import { centeredContent, colors, elevation, gradients, radius, spacing, typography } from '@/theme';
import type { Appointment, Business } from '@/types';

type Tab = 'businesses' | 'appointments';

export default function AdminScreen() {
  const [tab, setTab] = useState<Tab>('businesses');
  const { data: businesses, isLoading: loadingB, isError: errorB, refetch: refetchB } = useAllBusinesses();
  const { data: appointments, isLoading: loadingA, isError: errorA, refetch: refetchA } = useAllAppointments();
  const setApproved = useSetBusinessApproved();

  const pendingCount = useMemo(
    () => (businesses ?? []).filter((b) => !b.approved).length,
    [businesses],
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>ADMIN</Text>
        <Text style={styles.title}>Yönetim Paneli</Text>
      </View>

      <View style={styles.summaryRow}>
        <LinearGradient
          colors={gradients.goldButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryHero}
        >
          <Text style={styles.summaryValueGold}>{businesses?.length ?? 0}</Text>
          <Text style={styles.summaryLabelGold}>İşletme</Text>
        </LinearGradient>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, pendingCount > 0 && { color: colors.pending }]}>
            {pendingCount}
          </Text>
          <Text style={styles.summaryLabel}>Onay Bekleyen</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{appointments?.length ?? 0}</Text>
          <Text style={styles.summaryLabel}>Randevu</Text>
        </View>
      </View>

      <View style={styles.segment}>
        {(['businesses', 'appointments'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.segBtn, tab === t && styles.segActive]}
          >
            <Text style={[styles.segText, tab === t && styles.segTextActive]}>
              {t === 'businesses' ? 'İşletmeler' : 'Randevular'}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'businesses' ? (
        loadingB ? (
          <ListSkeleton kind="card" count={4} />
        ) : errorB ? (
          <ErrorState onRetry={() => refetchB()} />
        ) : (
          <FlatList
            data={businesses ?? []}
            keyExtractor={(b) => b.id}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            renderItem={({ item }) => (
              <AdminBusinessRow
                business={item}
                busy={setApproved.isPending}
                onToggle={() => setApproved.mutate({ id: item.id, approved: !item.approved })}
              />
            )}
          />
        )
      ) : loadingA ? (
        <ListSkeleton kind="card" count={4} />
      ) : errorA ? (
        <ErrorState onRetry={() => refetchA()} />
      ) : (
        <FlatList
          data={appointments ?? []}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }) => <AdminAppointmentRow appointment={item} />}
        />
      )}
    </Screen>
  );
}

function AdminBusinessRow({
  business,
  onToggle,
  busy,
}: {
  business: Business;
  onToggle: () => void;
  busy: boolean;
}) {
  return (
    <View style={[styles.card, elevation.soft]}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{business.name}</Text>
          <Text style={styles.cardSub}>
            {categoryLabels[business.category]} · {business.district}
          </Text>
        </View>
        <Badge
          label={business.approved ? 'Onaylı' : 'Onay Bekliyor'}
          color={business.approved ? colors.approved : colors.pending}
        />
      </View>
      <Button
        label={business.approved ? 'Pasife Al' : 'Onayla'}
        variant={business.approved ? 'secondary' : 'primary'}
        icon={business.approved ? 'pause-outline' : 'checkmark'}
        onPress={onToggle}
        disabled={busy}
      />
    </View>
  );
}

function AdminAppointmentRow({ appointment }: { appointment: Appointment }) {
  const { business, service, status, datetime, customerName } = appointment;
  const meta = statusMeta[status];
  return (
    <View style={[styles.card, elevation.soft]}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{business?.name ?? 'İşletme'}</Text>
          <Text style={styles.cardSub} numberOfLines={1}>
            {customerName ?? 'Müşteri'} · {service?.name ?? 'Hizmet'}
          </Text>
        </View>
        <Badge label={meta.label} color={meta.color} />
      </View>
      <View style={styles.timeRow}>
        <Ionicons name="calendar-outline" size={13} color={colors.textFaint} />
        <Text style={styles.time}>{formatDateTime(datetime)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, ...centeredContent },
  eyebrow: { ...typography.micro, color: colors.gold, letterSpacing: 2, marginBottom: 2 },
  title: { ...typography.title, color: colors.text },
  summaryRow: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, ...centeredContent },
  summaryHero: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
    ...elevation.gold,
  },
  summaryValueGold: { fontSize: 26, fontWeight: '800', color: colors.onGold },
  summaryLabelGold: { ...typography.micro, color: 'rgba(23,17,9,0.8)' },
  summaryCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  summaryValue: { fontSize: 26, fontWeight: '800', color: colors.text },
  summaryLabel: { ...typography.micro, color: colors.textMuted },
  segment: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  segBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: 9, alignItems: 'center' },
  segActive: { backgroundColor: colors.surfaceAlt },
  segText: { ...typography.caption, color: colors.textMuted },
  segTextActive: { color: colors.text, fontWeight: '700' },
  list: { padding: spacing.lg, flexGrow: 1, ...centeredContent },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cardTitle: { ...typography.bodyStrong, color: colors.text },
  cardSub: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  time: { ...typography.caption, color: colors.textMuted },
});
