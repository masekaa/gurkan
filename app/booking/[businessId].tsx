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

import { Button, Screen } from '@/components/ui';
import {
  SlotTakenError,
  useBusiness,
  useCreateAppointment,
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

  const { data: business } = useBusiness(businessId);
  const { data: services } = useServices(businessId);
  const { data: takenSlots, refetch: refetchTaken } = useTakenSlots(businessId);
  const createAppointment = useCreateAppointment();

  const service = useMemo(
    () => services?.find((s) => s.id === serviceId) ?? services?.[0],
    [services, serviceId],
  );

  const days = useMemo(() => nextDays(14), []);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
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

    const taken: [number, number][] = [];
    for (const slot of takenSlots ?? []) {
      const d = new Date(slot.datetime);
      if (
        d.getFullYear() === day.getFullYear() &&
        d.getMonth() === day.getMonth() &&
        d.getDate() === day.getDate()
      ) {
        const start = d.getHours() * 60 + d.getMinutes();
        taken.push([start, start + slot.durationMin]);
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
  }, [takenSlots, days, selectedDay, slots, service, business]);

  function pickDay(i: number) {
    setSelectedDay(i);
    setSelectedTime(null);
    setSlotError(null);
  }

  async function confirm() {
    if (!service || selectedTime == null) return;
    setSlotError(null);
    const date = new Date(days[selectedDay]);
    const [h, m] = selectedTime.split(':').map(Number);
    date.setHours(h, m, 0, 0);
    try {
      const appt = await createAppointment.mutateAsync({
        businessId,
        serviceId: service.id,
        datetime: date.toISOString(),
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
        {dayClosed ? (
          <View style={styles.closedBox}>
            <Ionicons name="moon-outline" size={20} color={colors.textMuted} />
            <Text style={styles.closedText}>İşletme bu gün kapalı. Lütfen başka bir gün seç.</Text>
          </View>
        ) : null}
        <View style={styles.slotGrid}>
          {slots.map((t) => {
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
      </ScrollView>

      <View style={styles.footer}>
        {slotError ? <Text style={styles.slotError}>{slotError}</Text> : null}
        <Button
          label="Randevuyu Onayla"
          onPress={confirm}
          loading={createAppointment.isPending}
          disabled={!service || selectedTime == null}
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
  summaryBiz: { ...typography.bodyStrong, color: colors.text },
  summaryService: { ...typography.caption, color: colors.gold, marginTop: 2 },
  summaryPrice: { ...typography.heading, color: colors.text },
  label: { ...typography.bodyStrong, color: colors.text, marginTop: spacing.sm },
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
