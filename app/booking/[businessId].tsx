import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button, Field, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import {
  BookingLimitError,
  SlotTakenError,
  useBusiness,
  useCreateAppointment,
  useEmployees,
  useServices,
  useTakenSlots,
} from '@/hooks/queries';
import {
  formatDuration,
  formatPrice,
} from '@/lib/format';
import { track } from '@/lib/analytics';
import { notifyError, notifySuccess } from '@/lib/haptics';
import { scheduleAppointmentReminder } from '@/lib/notifications';
import { getDayHours } from '@/lib/hours';
import { centeredContent, colors, elevation, gradients, radius, spacing, typography } from '@/theme';

/** Build the next `count` calendar days starting today. */
function nextDays(count: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

/** Half-hour slots between opening and closing time ("HH:MM"). */
/** Slots between open and close at `step`-minute intervals (business-set). */
function slotsBetween(open: string, close: string, step: number): string[] {
  const [oh, om] = open.split(':').map(Number);
  const [ch, cm] = close.split(':').map(Number);
  const start = oh * 60 + om;
  const end = ch * 60 + cm;
  const interval = step >= 5 ? step : 30;
  const out: string[] = [];
  for (let t = start; t + interval <= end; t += interval) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
  return out;
}

const dayFmt = new Intl.DateTimeFormat('tr-TR', { weekday: 'short' });
const dateFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric' });

export default function BookingScreen() {
  const { businessId, serviceId } = useLocalSearchParams<{
    businessId: string;
    serviceId?: string;
  }>();
  const router = useRouter();
  const { profile } = useAuth();
  const suspended = !!profile?.suspended;

  const { data: business } = useBusiness(businessId);
  const { data: services } = useServices(businessId);
  const { data: employees } = useEmployees(businessId);
  const { data: takenSlots, refetch: refetchTaken } = useTakenSlots(businessId);
  const createAppointment = useCreateAppointment();

  const service = useMemo(
    () => services?.find((s) => s.id === serviceId) ?? services?.[0],
    [services, serviceId],
  );

  // Active staff, if any. When present the customer must pick one and each has
  // an independent schedule; otherwise booking is business-level (as before).
  const staff = useMemo(() => (employees ?? []).filter((e) => e.active), [employees]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const needsEmployee = staff.length > 0;
  const employeeChosen = !needsEmployee || selectedEmployee != null;

  const days = useMemo(() => nextDays(14), []);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);

  const [slotError, setSlotError] = useState<string | null>(null);

  const dayClosed = business
    ? getDayHours(business, days[selectedDay].getDay()).closed
    : false;

  const slots = useMemo(() => {
    if (!business) return [];
    const dh = getDayHours(business, days[selectedDay].getDay());
    if (dh.closed) return [];
    return slotsBetween(dh.open, dh.close, business.slotMinutes ?? 30);
  }, [business, days, selectedDay]);

  // Times that cannot be picked on the selected day: already booked, or past.
  // A start time is unavailable when it is in the past, when the chosen service
  // would run past closing, or when [start, start+duration) overlaps any booked
  // interval — accounting for BOTH services' durations, not just the start time.
  const unavailable = useMemo(() => {
    const day = days[selectedDay];
    const now = new Date();
    const isToday =
      day.getFullYear() === now.getFullYear() &&
      day.getMonth() === now.getMonth() &&
      day.getDate() === now.getDate();
    const dur = service?.durationMin ?? 30;
    const dh = business ? getDayHours(business, day.getDay()) : null;
    const [ch, cm] = (dh?.close ?? '23:59').split(':').map(Number);
    const closeMin = ch * 60 + cm;
    const nowMin = now.getHours() * 60 + now.getMinutes();

    const onDay = (d: Date) =>
      d.getFullYear() === day.getFullYear() &&
      d.getMonth() === day.getMonth() &&
      d.getDate() === day.getDate();

    const taken: [number, number][] = [];
    for (const slot of takenSlots ?? []) {
      // Only slots for the chosen scope block availability: the selected
      // employee's bookings, or business-level bookings when no staff.
      if ((slot.employeeId ?? null) !== (selectedEmployee ?? null)) continue;
      const d = new Date(slot.datetime);
      if (onDay(d)) {
        const start = d.getHours() * 60 + d.getMinutes();
        taken.push([start, start + slot.durationMin]);
      }
    }

    // Business temporary closures overlapping this day also block their slots.
    for (const c of business?.closures ?? []) {
      const cs = new Date(c.start);
      const ce = new Date(c.end);
      if (onDay(cs) || onDay(ce)) {
        const s = onDay(cs) ? cs.getHours() * 60 + cs.getMinutes() : 0;
        const e = onDay(ce) ? ce.getHours() * 60 + ce.getMinutes() : 24 * 60;
        taken.push([s, e]);
      }
    }

    const set = new Set<string>();
    for (const t of slots) {
      const [h, m] = t.split(':').map(Number);
      const s = h * 60 + m;
      const e = s + dur;
      const past = isToday && s <= nowMin;
      const overflow = e > closeMin;
      const overlaps = taken.some(([ts, te]) => s < te && e > ts);
      if (past || overflow || overlaps) set.add(t);
    }
    return set;
  }, [takenSlots, days, selectedDay, slots, service, business, selectedEmployee]);

  function pickDay(i: number) {
    setSelectedDay(i);
    setSelectedTime(null);
    setSlotError(null);
  }

  async function confirm() {
    if (!service || selectedTime == null || !employeeChosen) return;
    if (suspended) {
      setSlotError('Hesabın askıya alındığı için randevu oluşturamazsın.');
      return;
    }
    setSlotError(null);
    const date = new Date(days[selectedDay]);
    const [h, m] = selectedTime.split(':').map(Number);
    date.setHours(h, m, 0, 0);
    const employee = staff.find((e) => e.id === selectedEmployee) ?? null;
    try {
      const appt = await createAppointment.mutateAsync({
        businessId,
        serviceId: service.id,
        datetime: date.toISOString(),
        employeeId: employee?.id ?? null,
        employeeName: employee?.name ?? null,
        note: note.trim() || null,
        durationMin: service.durationMin,
      });
      notifySuccess();
      track('booking_created', { businessId, serviceId: service.id });
      void scheduleAppointmentReminder({
        appointmentId: appt.id,
        businessName: business?.name ?? 'Randevu',
        startIso: date.toISOString(),
        minutesBefore: 60,
      });
      setDone(true);
    } catch (e) {
      notifyError();
      if (e instanceof SlotTakenError) {
        setSlotError('Bu saat az önce doldu. Lütfen başka bir saat seç.');
        setSelectedTime(null);
        refetchTaken();
      } else if (e instanceof BookingLimitError) {
        setSlotError(e.message);
      } else {
        setSlotError('Randevu oluşturulamadı. Lütfen tekrar dene.');
      }
    }
  }

  if (done) {
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={styles.success}>
          <LinearGradient
            colors={gradients.goldButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.successIcon}
          >
            <Ionicons name="checkmark" size={44} color={colors.onGold} />
          </LinearGradient>
          <Text style={styles.successTitle}>Randevu Talebin Alındı!</Text>
          <Text style={styles.successText}>
            {business?.name} işletmesine randevu talebin iletildi. Onaylandığında
            sana bildirim göndereceğiz.
          </Text>
          <View style={{ width: '100%', gap: spacing.md, marginTop: spacing.lg }}>
            <Button
              label="Randevularıma Git"
              onPress={() => router.replace('/(tabs)/appointments')}
            />
            <Button
              label="Keşfetmeye Devam Et"
              variant="secondary"
              onPress={() => router.replace('/(tabs)')}
            />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Geri">
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Randevu Oluştur</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {service ? (
          <View style={styles.summary}>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryBiz}>{business?.name}</Text>
              <Text style={styles.summaryService}>
                {service.name} · {formatDuration(service.durationMin)}
              </Text>
            </View>
            <Text style={styles.summaryPrice}>{formatPrice(service.price)}</Text>
          </View>
        ) : null}

        {suspended ? (
          <View style={styles.suspendBox}>
            <Ionicons name="lock-closed" size={18} color={colors.danger} />
            <Text style={styles.suspendText}>
              Hesabın askıya alındı; şu an randevu oluşturamazsın. İtiraz için:
              ahmetdemirexhesap@gmail.com
            </Text>
          </View>
        ) : null}

        {needsEmployee ? (
          <>
            <Text style={styles.label}>Çalışan seç</Text>
            <View style={styles.staffGrid}>
              {staff.map((e) => {
                const active = e.id === selectedEmployee;
                return (
                  <Pressable
                    key={e.id}
                    onPress={() => {
                      setSelectedEmployee(e.id);
                      setSelectedTime(null);
                      setSlotError(null);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.staffChip, active && styles.staffChipActive]}
                  >
                    <Ionicons
                      name="person"
                      size={14}
                      color={active ? colors.onGold : colors.textMuted}
                    />
                    <Text style={[styles.staffText, active && styles.staffTextActive]}>
                      {e.name}
                      {e.title?.trim() ? ` · ${e.title.trim()}` : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        <Text style={styles.label}>Tarih seç</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
          {days.map((d, i) => {
            const active = i === selectedDay;
            const closed = business ? getDayHours(business, d.getDay()).closed : false;
            return (
              <Pressable
                key={i}
                onPress={() => pickDay(i)}
                accessibilityRole="button"
                accessibilityLabel={`${dayFmt.format(d)} ${dateFmt.format(d)}${closed ? ', kapalı' : ''}`}
                accessibilityState={{ selected: active }}
                style={[
                  styles.dayChip,
                  active && styles.dayChipActive,
                  closed && !active && styles.dayChipClosed,
                ]}
              >
                <Text style={[styles.dayName, active && styles.dayActiveText]}>
                  {dayFmt.format(d)}
                </Text>
                <Text style={[styles.dayNum, active && styles.dayActiveText]}>
                  {dateFmt.format(d)}
                </Text>
                {closed ? (
                  <Text style={[styles.dayClosedTag, active && styles.dayActiveText]}>Kapalı</Text>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.label}>Saat seç</Text>
        {!employeeChosen ? (
          <View style={styles.closedBox}>
            <Ionicons name="person-outline" size={20} color={colors.textMuted} />
            <Text style={styles.closedText}>Uygun saatleri görmek için önce bir çalışan seç.</Text>
          </View>
        ) : null}
        {dayClosed ? (
          <View style={styles.closedBox}>
            <Ionicons name="moon-outline" size={20} color={colors.textMuted} />
            <Text style={styles.closedText}>İşletme bu gün kapalı. Lütfen başka bir gün seç.</Text>
          </View>
        ) : null}
        <View style={styles.slotGrid}>
          {(employeeChosen ? slots : []).map((t) => {
            const active = t === selectedTime;
            const disabled = unavailable.has(t);
            return (
              <Pressable
                key={t}
                disabled={disabled}
                onPress={() => setSelectedTime(t)}
                accessibilityRole="button"
                accessibilityLabel={`Saat ${t}${disabled ? ', uygun değil' : ''}`}
                accessibilityState={{ disabled, selected: active }}
                style={[
                  styles.slot,
                  active && styles.slotActive,
                  disabled && styles.slotDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.slotText,
                    active && styles.slotActiveText,
                    disabled && styles.slotDisabledText,
                  ]}
                >
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>İşletmeye not (isteğe bağlı)</Text>
        <Field
          placeholder="Örn. istediğin model, özel bir not…"
          value={note}
          onChangeText={setNote}
          multiline
        />
      </ScrollView>

      <View style={styles.footer}>
        {slotError ? <Text style={styles.slotError}>{slotError}</Text> : null}
        <Button
          label="Randevuyu Onayla"
          onPress={confirm}
          loading={createAppointment.isPending}
          disabled={!service || selectedTime == null || !employeeChosen || suspended}
        />
      </View>
    </Screen>
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
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl, ...centeredContent },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    ...elevation.soft,
  },
  suspendBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.danger + '12',
    borderColor: colors.danger + '40',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  suspendText: { ...typography.caption, color: colors.text, flex: 1, lineHeight: 18 },
  summaryBiz: { ...typography.bodyStrong, color: colors.text },
  summaryService: { ...typography.caption, color: colors.gold, marginTop: 2 },
  summaryPrice: { ...typography.heading, color: colors.text },
  label: { ...typography.bodyStrong, color: colors.text, marginTop: spacing.sm },
  staffGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  staffChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  staffChipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  staffText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  staffTextActive: { color: colors.onGold },
  dayRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  dayChip: {
    width: 56,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 2,
  },
  dayChipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  dayChipClosed: { opacity: 0.55 },
  dayClosedTag: { ...typography.micro, color: colors.rejected, marginTop: 1 },
  closedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  closedText: { ...typography.caption, color: colors.textMuted, flex: 1 },
  dayName: { ...typography.micro, color: colors.textMuted },
  dayNum: { ...typography.heading, color: colors.text },
  dayActiveText: { color: colors.onGold },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slot: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  slotActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  slotDisabled: { backgroundColor: colors.background, opacity: 0.4 },
  slotText: { ...typography.body, color: colors.text },
  slotActiveText: { color: colors.onGold, fontWeight: '700' },
  slotDisabledText: { color: colors.textMuted, textDecorationLine: 'line-through' },
  footer: {
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  slotError: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
  },
  success: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...elevation.gold,
  },
  successTitle: { ...typography.title, color: colors.text, textAlign: 'center' },
  successText: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
