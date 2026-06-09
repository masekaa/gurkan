import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, Button, ErrorState, ListSkeleton, Screen } from '@/components/ui';
import {
  useAllAppointments,
  useAllBusinesses,
  useAllUsers,
  useDeleteBusiness,
  useDeleteUser,
  useSetBusinessApproved,
} from '@/hooks/queries';
import { categoryLabels, formatDateTime, statusMeta } from '@/lib/format';
import {
  centeredContent,
  colors,
  elevation,
  gradients,
  radius,
  spacing,
  typography,
} from '@/theme';
import type { Appointment, Business, Profile } from '@/types';

type Tab = 'businesses' | 'users' | 'appointments';
type Confirm = { kind: 'user' | 'business'; id: string; label: string };

const ROLE_META: Record<string, { label: string; color: string }> = {
  admin: { label: 'Admin', color: colors.gold },
  business: { label: 'İşletme', color: colors.approved },
  user: { label: 'Müşteri', color: colors.completed },
};

export default function AdminScreen() {
  const [tab, setTab] = useState<Tab>('businesses');
  const { data: businesses, isLoading: loadingB, isError: errorB, refetch: refetchB } = useAllBusinesses();
  const { data: users, isLoading: loadingU, isError: errorU, refetch: refetchU } = useAllUsers();
  const { data: appointments, isLoading: loadingA, isError: errorA, refetch: refetchA } = useAllAppointments();
  const setApproved = useSetBusinessApproved();
  const deleteUser = useDeleteUser();
  const deleteBusiness = useDeleteBusiness();

  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const busy = deleteUser.isPending || deleteBusiness.isPending;

  const pendingCount = useMemo(
    () => (businesses ?? []).filter((b) => !b.approved).length,
    [businesses],
  );

  function runDelete() {
    if (!confirm) return;
    const opts = { onSuccess: () => setConfirm(null) };
    if (confirm.kind === 'user') deleteUser.mutate(confirm.id, opts);
    else deleteBusiness.mutate(confirm.id, opts);
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'businesses', label: 'İşletmeler' },
    { key: 'users', label: 'Kullanıcılar' },
    { key: 'appointments', label: 'Randevular' },
  ];

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
          <Text style={styles.summaryValue}>{users?.length ?? 0}</Text>
          <Text style={styles.summaryLabel}>Kullanıcı</Text>
        </View>
      </View>

      <View style={styles.segment}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.key }}
            accessibilityLabel={t.label}
            style={[styles.segBtn, tab === t.key && styles.segActive]}
          >
            <Text style={[styles.segText, tab === t.key && styles.segTextActive]}>{t.label}</Text>
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
                onDelete={() => setConfirm({ kind: 'business', id: item.id, label: item.name })}
              />
            )}
          />
        )
      ) : tab === 'users' ? (
        loadingU ? (
          <ListSkeleton kind="card" count={4} />
        ) : errorU ? (
          <ErrorState onRetry={() => refetchU()} />
        ) : (
          <FlatList
            data={users ?? []}
            keyExtractor={(u) => u.id}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            renderItem={({ item }) => (
              <AdminUserRow
                user={item}
                onDelete={() => setConfirm({ kind: 'user', id: item.id, label: item.name })}
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

      <Modal visible={confirm != null} transparent animationType="fade" onRequestClose={() => setConfirm(null)}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Ionicons name="trash-outline" size={28} color={colors.danger} />
            <Text style={styles.dialogTitle}>
              {confirm?.kind === 'user' ? 'Kullanıcıyı sil?' : 'İşletmeyi sil?'}
            </Text>
            <Text style={styles.dialogText}>
              {confirm?.label} kalıcı olarak silinecek
              {confirm?.kind === 'user' ? ' (sahip olduğu işletmeler dahil)' : ''}.
            </Text>
            <View style={styles.dialogActions}>
              <View style={{ flex: 1 }}>
                <Button label="Vazgeç" variant="secondary" onPress={() => setConfirm(null)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Sil" variant="danger" loading={busy} onPress={runDelete} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function AdminBusinessRow({
  business,
  onToggle,
  onDelete,
  busy,
}: {
  business: Business;
  onToggle: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  return (
    <View style={[styles.card, elevation.soft]}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{business.name}</Text>
          <Text style={styles.cardSub}>
            {categoryLabels[business.category]} · {business.district || '—'}
          </Text>
        </View>
        <Badge
          label={business.approved ? 'Onaylı' : 'Onay Bekliyor'}
          color={business.approved ? colors.approved : colors.pending}
        />
      </View>
      <View style={styles.actions}>
        <View style={{ flex: 1 }}>
          <Button
            label={business.approved ? 'Pasife Al' : 'Onayla'}
            variant={business.approved ? 'secondary' : 'primary'}
            icon={business.approved ? 'pause-outline' : 'checkmark'}
            onPress={onToggle}
            disabled={busy}
          />
        </View>
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          style={styles.deleteBtn}
          accessibilityRole="button"
          accessibilityLabel={`${business.name} işletmesini sil`}
        >
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </Pressable>
      </View>
    </View>
  );
}

function AdminUserRow({ user, onDelete }: { user: Profile; onDelete: () => void }) {
  const meta = ROLE_META[user.role] ?? ROLE_META.user;
  const initial = (user.name || '?').trim().charAt(0).toUpperCase();
  return (
    <View style={[styles.card, elevation.soft]}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{user.name || 'İsimsiz'}</Text>
          <Text style={styles.cardSub} numberOfLines={1}>{user.email}</Text>
        </View>
        <Badge label={meta.label} color={meta.color} />
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          style={styles.deleteBtn}
          accessibilityRole="button"
          accessibilityLabel={`${user.name} kullanıcısını sil`}
        >
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </Pressable>
      </View>
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
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardTitle: { ...typography.bodyStrong, color: colors.text },
  cardSub: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gold + '55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.bodyStrong, color: colors.gold },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger + '14',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.danger + '40',
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  time: { ...typography.caption, color: colors.textMuted },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
