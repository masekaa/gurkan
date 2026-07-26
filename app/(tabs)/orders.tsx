import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Badge, Button, EmptyState, ErrorState, Field, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import {
  SlotTakenError,
  useBusinessAppointments,
  useCreateManualAppointment,
  useEmployeeAppointments,
  useEmployeeById,
  useRevertAppointment,
  useServices,
  useUpdateAppointmentStatus,
} from '@/hooks/queries';
import { formatDate, formatDuration, formatPrice, formatTime, statusMeta } from '@/lib/format';
import { colors, elevation, radius, spacing, typography } from '@/theme';
import type { Appointment, AppointmentStatus, Service } from '@/types';

type Tab = 'pending' | 'approved' | 'history';

const FILTERS: Record<Tab, AppointmentStatus[]> = {
  pending: ['pending'],
  approved: ['approved'],
  history: ['completed', 'no_show', 'cancelled', 'rejected'],
};

export default function OrdersScreen() {
  const { profile } = useAuth();
  const isEmployee = profile?.role === 'employee';
  const [tab, setTab] = useState<Tab>('pending');
  // Business owner reads their inbox by businessOwnerId; an employee reads only
  // the appointments assigned to them (employeeUserId == their uid).
  const businessData = useBusinessAppointments(isEmployee ? null : profile?.id);
  const employeeData = useEmployeeAppointments(isEmployee ? profile?.id : null);
  const { data, isLoading, isError, refetch } = isEmployee ? employeeData : businessData;
  const { data: myEmployee, isLoading: empLoading } = useEmployeeById(
    isEmployee ? profile?.employeeId : null,
  );
  const update = useUpdateAppointmentStatus();
  const revert = useRevertAppointment();
  const [actionError, setActionError] = useState<string | null>(null);

  // Business-only: manual (walk-in) appointment entry.
  const businessId = profile?.businessId ?? '';
  const { data: services } = useServices(!isEmployee ? businessId : '');
  const createManual = useCreateManualAppointment();
  const [manualOpen, setManualOpen] = useState(false);

  const items = useMemo(
    () => (data ?? []).filter((a) => FILTERS[tab].includes(a.status)),
    [data, tab],
  );

  const pendingCount = (data ?? []).filter((a) => a.status === 'pending').length;

  function onAction(id: string, status: AppointmentStatus) {
    setActionError(null);
    update.mutate(
      { id, status },
      { onError: () => setActionError('İşlem yapılamadı. Lütfen tekrar dene.') },
    );
  }

  function onRevert(id: string) {
    setActionError(null);
    revert.mutate(id, {
      onError: (e) =>
        setActionError(
          e instanceof SlotTakenError
            ? 'Bu saat başka bir müşteri tarafından alınmış; geri alınamadı.'
            : 'Geri alınamadı. Lütfen tekrar dene.',
        ),
    });
  }

  // Employee approval gate: no inbox until the business accepts the join request.
  if (isEmployee) {
    if (empLoading) {
      return (
        <Screen>
          <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.xxl }} />
        </Screen>
      );
    }
    if (!myEmployee) {
      return (
        <EmployeeGate
          icon="close-circle-outline"
          title="İşletmeye ekli değilsin"
          text="Katılım isteğin işletme tarafından kaldırılmış görünüyor. İşletme yöneticisiyle iletişime geçebilirsin."
        />
      );
    }
    if (myEmployee.approved !== true) {
      return (
        <EmployeeGate
          icon="hourglass-outline"
          title="Onay bekleniyor"
          text="İşletmeye katılım isteğin gönderildi. İşletme seni onayladıktan sonra sana atanan randevuları burada görüp yönetebileceksin."
        />
      );
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{isEmployee ? 'Randevularım' : 'Gelen Randevular'}</Text>
          {!isEmployee ? (
            <Pressable
              onPress={() => setManualOpen(true)}
              hitSlop={8}
              style={styles.manualBtn}
              accessibilityRole="button"
              accessibilityLabel="Manuel randevu ekle"
            >
              <Ionicons name="add" size={18} color={colors.onGold} />
              <Text style={styles.manualBtnText}>Manuel</Text>
            </Pressable>
          ) : null}
        </View>
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
          ListHeaderComponent={
            actionError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                <Text style={styles.errorBannerText}>{actionError}</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <OrderCard
              appointment={item}
              busy={update.isPending || revert.isPending}
              onAction={(status) => onAction(item.id, status)}
              onRevert={() => onRevert(item.id)}
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

      {!isEmployee ? (
        <ManualAppointmentModal
          visible={manualOpen}
          services={services ?? []}
          saving={createManual.isPending}
          onClose={() => setManualOpen(false)}
          onSubmit={(form) => {
            createManual.mutate(
              {
                businessId,
                businessOwnerId: profile?.id ?? '',
                datetime: form.datetime,
                customerName: form.customerName,
                serviceId: form.service?.id ?? null,
                note: form.note || null,
                durationMin: form.service?.durationMin ?? 30,
              },
              {
                onSuccess: () => setManualOpen(false),
                onError: (e) =>
                  setActionError(
                    e instanceof SlotTakenError
                      ? 'Bu saat dolu, başka bir saat seç.'
                      : 'Randevu eklenemedi. Lütfen tekrar dene.',
                  ),
              },
            );
          }}
        />
      ) : null}
    </Screen>
  );
}

function ManualAppointmentModal({
  visible,
  services,
  saving,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  services: Service[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (form: { customerName: string; datetime: string; service: Service | null; note: string }) => void;
}) {
  const [name, setName] = useState('');
  const [dayIdx, setDayIdx] = useState(0);
  const [time, setTime] = useState('10:00');
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, []);
  const dayFmt = useMemo(() => new Intl.DateTimeFormat('tr-TR', { weekday: 'short', day: 'numeric' }), []);

  function submit() {
    setError(null);
    if (!name.trim()) {
      setError('Müşteri adı gerekli.');
      return;
    }
    const [h, m] = time.split(':').map((n) => parseInt(n, 10));
    if (isNaN(h) || isNaN(m) || h > 23 || m > 59) {
      setError('Saati HH:MM biçiminde gir.');
      return;
    }
    const d = new Date(days[dayIdx]);
    d.setHours(h, m, 0, 0);
    onSubmit({
      customerName: name.trim(),
      datetime: d.toISOString(),
      service: services.find((s) => s.id === serviceId) ?? null,
      note: note.trim(),
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Manuel Randevu</Text>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.md }}>
            <Field label="Müşteri adı" value={name} onChangeText={setName} icon="person-outline" placeholder="Ad Soyad" />

            <Text style={styles.formLabel}>Gün</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {days.map((d, i) => {
                const active = i === dayIdx;
                return (
                  <Pressable
                    key={i}
                    onPress={() => setDayIdx(i)}
                    style={[styles.pickChip, active && styles.pickChipActive]}
                  >
                    <Text style={[styles.pickChipText, active && styles.pickChipTextActive]}>{dayFmt.format(d)}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-end' }}>
              <View style={{ width: 110 }}>
                <Text style={styles.formLabel}>Saat</Text>
                <TextInput
                  value={time}
                  onChangeText={setTime}
                  placeholder="10:00"
                  placeholderTextColor={colors.textFaint}
                  style={styles.timeInput}
                  maxLength={5}
                />
              </View>
            </View>

            {services.length > 0 ? (
              <View>
                <Text style={styles.formLabel}>Hizmet (isteğe bağlı)</Text>
                <View style={styles.svcWrap}>
                  {services.map((s) => {
                    const active = serviceId === s.id;
                    return (
                      <Pressable
                        key={s.id}
                        onPress={() => setServiceId(active ? null : s.id)}
                        style={[styles.pickChip, active && styles.pickChipActive]}
                      >
                        <Text style={[styles.pickChipText, active && styles.pickChipTextActive]}>
                          {s.name} · {formatDuration(s.durationMin)} · {formatPrice(s.price)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <Field label="Not (isteğe bağlı)" value={note} onChangeText={setNote} icon="chatbubble-ellipses-outline" multiline />
            {error ? <Text style={styles.formError}>{error}</Text> : null}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Button label="Vazgeç" variant="secondary" onPress={onClose} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Ekle" loading={saving} onPress={submit} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function EmployeeGate({
  icon,
  title,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
}) {
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Randevularım</Text>
      </View>
      <EmptyState icon={icon} title={title} subtitle={text} />
    </Screen>
  );
}

function OrderCard({
  appointment,
  onAction,
  onRevert,
  busy,
}: {
  appointment: Appointment;
  onAction: (status: AppointmentStatus) => void;
  onRevert: () => void;
  busy: boolean;
}) {
  const { customerName, service, status, datetime, employeeName, note } = appointment;
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

        {employeeName ? (
          <View style={styles.timeRow}>
            <Ionicons name="person-outline" size={14} color={colors.textFaint} />
            <Text style={styles.time}>{employeeName}</Text>
          </View>
        ) : null}

        {note ? (
          <View style={styles.noteBox}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.gold} />
            <Text style={styles.noteText}>{note}</Text>
          </View>
        ) : null}

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
          <View style={{ gap: spacing.sm }}>
            <View style={styles.actions}>
              <View style={{ flex: 1 }}>
                <Button label="Onayı Geri Al" variant="secondary" icon="arrow-undo-outline" onPress={onRevert} disabled={busy} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="İptal" variant="secondary" onPress={() => onAction('cancelled')} disabled={busy} />
              </View>
            </View>
            <View style={styles.actions}>
              <View style={{ flex: 1 }}>
                <Button label="Gelmedi" variant="danger" icon="person-remove-outline" onPress={() => onAction('no_show')} disabled={busy} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Geldi" icon="checkmark" onPress={() => onAction('completed')} disabled={busy} />
              </View>
            </View>
          </View>
        ) : null}

        {status === 'rejected' ? (
          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <Button label="Geri Al" variant="secondary" icon="arrow-undo-outline" onPress={onRevert} disabled={busy} />
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...typography.title, color: colors.text },
  manualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  manualBtnText: { ...typography.caption, color: colors.onGold, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
    maxHeight: '88%',
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center' },
  sheetTitle: { ...typography.heading, color: colors.text, textAlign: 'center' },
  formLabel: { ...typography.caption, color: colors.textMuted, marginLeft: spacing.xs },
  pickChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pickChipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  pickChipText: { ...typography.caption, color: colors.textMuted },
  pickChipTextActive: { color: colors.onGold, fontWeight: '700' },
  timeInput: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    color: colors.text,
    ...typography.body,
  },
  svcWrap: { gap: spacing.sm, marginTop: spacing.xs },
  formError: { ...typography.caption, color: colors.danger, marginLeft: spacing.xs },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 4,
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
  segActive: { backgroundColor: colors.surface, ...elevation.soft },
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.danger + '14',
    borderColor: colors.danger + '40',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorBannerText: { ...typography.caption, color: colors.danger, flex: 1 },
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
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: colors.gold + '12',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  noteText: { ...typography.caption, color: colors.text, flex: 1, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: spacing.md },
});
