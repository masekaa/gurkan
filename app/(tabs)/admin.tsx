import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Badge, Button, EmptyState, ErrorState, Field, ListSkeleton, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import {
  useAdminSetPassword,
  useAllAppointments,
  useAllBusinesses,
  useAllUsers,
  useApproveBusinessPhoto,
  useDeleteBusiness,
  useDeleteUser,
  useRejectBusinessPhoto,
  useSetBusinessApproved,
  useSetUserRole,
} from '@/hooks/queries';
import { categoryLabels, formatDateTime, statusMeta } from '@/lib/format';
import { PASSWORD_RULE, isValidPassword } from '@/lib/validators';
import {
  centeredContent,
  colors,
  elevation,
  gradients,
  radius,
  spacing,
  typography,
} from '@/theme';
import type { Appointment, Business, Profile, UserRole } from '@/types';

type Tab = 'businesses' | 'photos' | 'users' | 'appointments';
type Confirm = { kind: 'user' | 'business'; id: string; label: string };

const ROLE_META: Record<
  string,
  { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  admin: { label: 'Admin', color: colors.gold, icon: 'shield-checkmark-outline' },
  business: { label: 'İşletme', color: colors.approved, icon: 'storefront-outline' },
  user: { label: 'Müşteri', color: colors.completed, icon: 'person-outline' },
};

const ROLE_ORDER: UserRole[] = ['user', 'business', 'admin'];

export default function AdminScreen() {
  const [tab, setTab] = useState<Tab>('businesses');
  const { data: businesses, isLoading: loadingB, isError: errorB, refetch: refetchB } = useAllBusinesses();
  const { data: users, isLoading: loadingU, isError: errorU, refetch: refetchU } = useAllUsers();
  const { data: appointments, isLoading: loadingA, isError: errorA, refetch: refetchA } = useAllAppointments();
  const { profile } = useAuth();
  const selfId = profile?.id;
  const setApproved = useSetBusinessApproved();
  const approvePhoto = useApproveBusinessPhoto();
  const rejectPhoto = useRejectBusinessPhoto();
  const deleteUser = useDeleteUser();
  const deleteBusiness = useDeleteBusiness();
  const setPassword = useAdminSetPassword();
  const setUserRole = useSetUserRole();

  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [pwTarget, setPwTarget] = useState<{ id: string; name: string } | null>(null);
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [roleTarget, setRoleTarget] = useState<{ id: string; name: string; role: UserRole } | null>(null);
  const busy = deleteUser.isPending || deleteBusiness.isPending;

  function submitPassword() {
    if (!pwTarget) return;
    setPwError(null);
    if (!isValidPassword(pw.trim())) {
      setPwError(PASSWORD_RULE);
      return;
    }
    setPassword.mutate(
      { uid: pwTarget.id, newPassword: pw.trim() },
      {
        onSuccess: () => setPwTarget(null),
        onError: (e: any) =>
          setPwError(
            e?.message?.includes('functions') || e?.code === 'functions/not-found'
              ? 'Cloud Functions deploy edilmemiş (functions/ klasörünü deploy et).'
              : 'Şifre güncellenemedi. Yetki veya bağlantı sorunu.',
          ),
      },
    );
  }

  const pendingCount = useMemo(
    () => (businesses ?? []).filter((b) => !b.approved).length,
    [businesses],
  );

  const photoQueue = useMemo(
    () =>
      (businesses ?? [])
        .filter((b) => (b.pendingPhotos?.length ?? 0) > 0)
        .map((b) => ({ business: b, urls: b.pendingPhotos ?? [] })),
    [businesses],
  );
  const pendingPhotoCount = useMemo(
    () => photoQueue.reduce((n, q) => n + q.urls.length, 0),
    [photoQueue],
  );

  function runDelete() {
    if (!confirm) return;
    const opts = { onSuccess: () => setConfirm(null) };
    if (confirm.kind === 'user') deleteUser.mutate(confirm.id, opts);
    else deleteBusiness.mutate(confirm.id, opts);
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'businesses', label: 'İşletmeler' },
    { key: 'photos', label: pendingPhotoCount > 0 ? `Fotoğraflar (${pendingPhotoCount})` : 'Fotoğraflar' },
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
      ) : tab === 'photos' ? (
        loadingB ? (
          <ListSkeleton kind="card" count={3} />
        ) : errorB ? (
          <ErrorState onRetry={() => refetchB()} />
        ) : photoQueue.length === 0 ? (
          <EmptyState
            icon="images-outline"
            title="Bekleyen fotoğraf yok"
            subtitle="İşletmeler fotoğraf yükledikçe burada onayına düşer."
          />
        ) : (
          <FlatList
            data={photoQueue}
            keyExtractor={(q) => q.business.id}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            renderItem={({ item }) => (
              <AdminPhotoRow
                businessName={item.business.name}
                urls={item.urls}
                busy={approvePhoto.isPending || rejectPhoto.isPending}
                onApprove={(url) => approvePhoto.mutate({ businessId: item.business.id, url })}
                onReject={(url) => rejectPhoto.mutate({ businessId: item.business.id, url })}
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
                isSelf={item.id === selfId}
                onRole={() => setRoleTarget({ id: item.id, name: item.name, role: item.role })}
                onDelete={() => setConfirm({ kind: 'user', id: item.id, label: item.name })}
                onPassword={() => {
                  setPwTarget({ id: item.id, name: item.name });
                  setPw('');
                  setPwError(null);
                }}
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

      <Modal visible={pwTarget != null} transparent animationType="fade" onRequestClose={() => setPwTarget(null)}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Ionicons name="key-outline" size={26} color={colors.gold} />
            <Text style={styles.dialogTitle}>Şifre Güncelle</Text>
            <Text style={styles.dialogText}>{pwTarget?.name} için yeni şifre belirle.</Text>
            <View style={{ width: '100%', marginTop: spacing.sm }}>
              <Field
                placeholder="Yeni şifre (en az 8 karakter)"
                secureTextEntry
                value={pw}
                onChangeText={setPw}
              />
              {pwError ? <Text style={styles.pwError}>{pwError}</Text> : null}
            </View>
            <View style={styles.dialogActions}>
              <View style={{ flex: 1 }}>
                <Button label="Vazgeç" variant="secondary" onPress={() => setPwTarget(null)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Güncelle" loading={setPassword.isPending} onPress={submitPassword} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={roleTarget != null} transparent animationType="fade" onRequestClose={() => setRoleTarget(null)}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Ionicons name="shield-half-outline" size={26} color={colors.gold} />
            <Text style={styles.dialogTitle}>Rol Ata</Text>
            <Text style={styles.dialogText}>{roleTarget?.name} için rol seç.</Text>
            <View style={styles.roleList}>
              {ROLE_ORDER.map((r) => {
                const m = ROLE_META[r];
                const active = roleTarget?.role === r;
                return (
                  <Pressable
                    key={r}
                    disabled={setUserRole.isPending}
                    onPress={() =>
                      roleTarget &&
                      setUserRole.mutate(
                        { uid: roleTarget.id, role: r },
                        { onSuccess: () => setRoleTarget(null) },
                      )
                    }
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.roleOption, active && styles.roleOptionActive]}
                  >
                    <Ionicons name={m.icon} size={18} color={active ? colors.gold : colors.textMuted} />
                    <Text style={[styles.roleOptionText, active && { color: colors.gold }]}>
                      {m.label}
                    </Text>
                    {active ? <Ionicons name="checkmark" size={18} color={colors.gold} /> : null}
                  </Pressable>
                );
              })}
            </View>
            <View style={{ width: '100%', marginTop: spacing.sm }}>
              <Button label="Kapat" variant="secondary" onPress={() => setRoleTarget(null)} />
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
  const listed = business.approved;
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
      <Text style={[styles.listedNote, { color: listed ? colors.approved : colors.textFaint }]}>
        {listed ? '● Keşfet’te listeleniyor' : '○ Listede değil (yönetici onayı gerekir)'}
      </Text>
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

function AdminPhotoRow({
  businessName,
  urls,
  busy,
  onApprove,
  onReject,
}: {
  businessName: string;
  urls: string[];
  busy: boolean;
  onApprove: (url: string) => void;
  onReject: (url: string) => void;
}) {
  return (
    <View style={[styles.card, elevation.soft]}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{businessName}</Text>
          <Text style={styles.cardSub}>{urls.length} fotoğraf onay bekliyor</Text>
        </View>
        <Badge label="Onay Bekliyor" color={colors.pending} />
      </View>
      {urls.map((url) => (
        <View key={url} style={styles.photoModRow}>
          <Image source={{ uri: url }} style={styles.photoModThumb} contentFit="cover" transition={150} />
          <View style={styles.photoModActions}>
            <Pressable
              onPress={() => onApprove(url)}
              disabled={busy}
              style={[styles.photoModBtn, styles.photoModApprove]}
              accessibilityRole="button"
              accessibilityLabel="Fotoğrafı onayla"
            >
              <Ionicons name="checkmark" size={18} color={colors.approved} />
              <Text style={[styles.photoModBtnText, { color: colors.approved }]}>Onayla</Text>
            </Pressable>
            <Pressable
              onPress={() => onReject(url)}
              disabled={busy}
              style={[styles.photoModBtn, styles.photoModReject]}
              accessibilityRole="button"
              accessibilityLabel="Fotoğrafı reddet"
            >
              <Ionicons name="close" size={18} color={colors.danger} />
              <Text style={[styles.photoModBtnText, { color: colors.danger }]}>Reddet</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

function AdminUserRow({
  user,
  isSelf,
  onRole,
  onDelete,
  onPassword,
}: {
  user: Profile;
  isSelf: boolean;
  onRole: () => void;
  onDelete: () => void;
  onPassword: () => void;
}) {
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
        <Badge label={isSelf ? 'Sen' : meta.label} color={meta.color} />
      </View>
      {isSelf ? null : (
        <View style={styles.actions}>
          <View style={{ flex: 1 }}>
            <Button label="Rol" variant="secondary" icon="shield-half-outline" onPress={onRole} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Şifre" variant="secondary" icon="key-outline" onPress={onPassword} />
          </View>
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
      )}
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
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 4,
  },
  segBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: 9, alignItems: 'center' },
  segActive: { backgroundColor: colors.surface, ...elevation.soft },
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
  listedNote: { ...typography.caption, fontWeight: '600' },
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
  photoModRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  photoModThumb: {
    width: 96,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  photoModActions: { flex: 1, flexDirection: 'row', gap: spacing.sm },
  photoModBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  photoModApprove: { backgroundColor: colors.approved + '14', borderColor: colors.approved + '40' },
  photoModReject: { backgroundColor: colors.danger + '14', borderColor: colors.danger + '40' },
  photoModBtnText: { ...typography.caption, fontWeight: '700' },
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
  pwError: { ...typography.caption, color: colors.danger, marginTop: spacing.xs, marginLeft: spacing.xs },
  roleList: { width: '100%', gap: spacing.sm, marginTop: spacing.sm },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  roleOptionActive: { borderColor: colors.gold + '88', backgroundColor: colors.gold + '14' },
  roleOptionText: { ...typography.bodyStrong, color: colors.text, flex: 1 },
});
