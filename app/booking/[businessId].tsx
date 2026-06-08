import { Ionicons } from '@expo/vector-icons';
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
import { colors, radius, spacing, typography } from '@/theme';

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
function slotsBetween(open: string, close: string): string[] {
  const [oh, om] = open.split(':').map(Number);
  const [ch, cm] = close.split(':').map(Number);
  const start = oh * 60 + om;
  const end = ch * 60 + cm;
  const out: string[] = [];
  for (let t = start; t + 30 <= end; t += 30) {
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

  const slots = useMemo(
    () =>
      business ? slotsBetween(business.openingTime, business.closingTime) : [],
    [business],
  );

  // Times that cannot be picked on the selected day: already booked, or past.
  const unavailable = useMemo(() => {
    const day = days[selectedDay];
    const now = new Date();
    const isToday =
      day.getFullYear() === now.getFullYear() &&
      day.getMonth() === now.getMonth() &&
      day.getDate() === now.getDate();
    const set = new Set<string>();
    for (const iso of takenSlots ?? []) {
      const d = new Date(iso);
      if (
        d.getFullYear() === day.getFullYear() &&
        d.getMonth() === day.getMonth() &&
        d.getDate() === day.getDate()
      ) {
        set.add(
          `${String(d.getHours()).padStart(2, '0')}:${String(
            d.getMinutes(),
          ).padStart(2, '0')}`,
        );
      }
    }
    if (isToday) {
      const nowMins = now.getHours() * 60 + now.getMinutes();
      for (const t of slots) {
        const [h, m] = t.split(':').map(Number);
        if (h * 60 + m <= nowMins) set.add(t);
      }
    }
    return set;
  }, [takenSlots, days, selectedDay, slots]);

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
      await createAppointment.mutateAsync({
        businessId,
        serviceId: service.id,
        datetime: date.toISOString(),
      });
      setDone(true);
    } catch (e) {
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
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={44} color={colors.onGold} />
          </View>
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
        <Pressable onPress={() => router.back()} hitSlop={10}>
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
            return (
              <Pressable
                key={i}
                onPress={() => pickDay(i)}
                style={[styles.dayChip, active && styles.dayChipActive]}
              >
                <Text style={[styles.dayName, active && styles.dayActiveText]}>
                  {dayFmt.format(d)}
                </Text>
                <Text style={[styles.dayNum, active && styles.dayActiveText]}>
                  {dateFmt.format(d)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.label}>Saat seç</Text>
        <View style={styles.slotGrid}>
          {slots.map((t) => {
            const active = t === selectedTime;
            const disabled = unavailable.has(t);
            return (
              <Pressable
                key={t}
                disabled={disabled}
                onPress={() => setSelectedTime(t)}
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
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
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
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  successTitle: { ...typography.title, color: colors.text, textAlign: 'center' },
  successText: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
