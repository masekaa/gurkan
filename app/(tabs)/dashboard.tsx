import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ErrorState, ListSkeleton, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useBusiness, useBusinessAppointments } from '@/hooks/queries';
import { formatPrice } from '@/lib/format';
import { centeredContent, colors, elevation, gradients, radius, spacing, typography } from '@/theme';
import type { Business } from '@/types';

/** Number of 30-minute slots a business offers per day. */
function dailySlotCount(b?: Business | null): number {
  if (!b) return 0;
  const [oh, om] = b.openingTime.split(':').map(Number);
  const [ch, cm] = b.closingTime.split(':').map(Number);
  return Math.max(0, Math.floor((ch * 60 + cm - (oh * 60 + om)) / 30));
}

export default function DashboardScreen() {
  const { profile } = useAuth();
  const businessId = profile?.businessId;
  const { data: business } = useBusiness(businessId ?? '');
  const { data, isLoading, isError, refetch } = useBusinessAppointments(profile?.id);

  const stats = useMemo(() => {
    const appts = data ?? [];
    const now = new Date();
    const sameDay = (iso: string) => {
      const d = new Date(iso);
      return d.toDateString() === now.toDateString();
    };
    const sameMonth = (iso: string) => {
      const d = new Date(iso);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };
    const price = (a: (typeof appts)[number]) => a.service?.price ?? 0;

    const completed = appts.filter((a) => a.status === 'completed');
    const daily = completed.filter((a) => sameDay(a.datetime)).reduce((s, a) => s + price(a), 0);
    const monthly = completed.filter((a) => sameMonth(a.datetime)).reduce((s, a) => s + price(a), 0);
    const pending = appts.filter((a) => a.status === 'pending').length;

    const slots = dailySlotCount(business);
    const bookedToday = appts.filter(
      (a) => sameDay(a.datetime) && ['pending', 'approved', 'completed'].includes(a.status),
    ).length;
    const occupancy = slots ? Math.round((bookedToday / slots) * 100) : 0;

    const past = appts.filter((a) => new Date(a.datetime).getTime() < now.getTime());
    const noShows = past.filter((a) => a.status === 'cancelled' || a.status === 'rejected').length;
    const noShowRate = past.length ? Math.round((noShows / past.length) * 100) : 0;

    return { daily, monthly, total: appts.length, pending, occupancy, noShowRate };
  }, [data, business]);

  if (isLoading) {
    return (
      <Screen>
        <ListSkeleton kind="card" count={4} />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ErrorState onRetry={() => refetch()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <Text style={styles.eyebrow}>PANEL</Text>
          <Text style={styles.hello}>{business?.name ?? 'İşletmem'}</Text>
          <Text style={styles.subtitle}>Bugünün özeti</Text>
        </View>

        <LinearGradient
          colors={gradients.goldButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.earnHero}
        >
          <Ionicons name="wallet" size={130} color="#00000010" style={styles.earnGlyph} />
          <Text style={styles.earnLabel}>Aylık Kazanç</Text>
          <Text style={styles.earnValue}>{formatPrice(stats.monthly)}</Text>
          <View style={styles.earnSub}>
            <Ionicons name="cash-outline" size={15} color="rgba(23,17,9,0.75)" />
            <Text style={styles.earnSubText}>Bugün {formatPrice(stats.daily)}</Text>
          </View>
        </LinearGradient>

        <View style={styles.grid}>
          <StatCard icon="calendar-outline" label="Toplam Randevu" value={String(stats.total)} />
          <StatCard icon="hourglass-outline" label="Bekleyen" value={String(stats.pending)} highlight={stats.pending > 0} />
        </View>

        <RateCard
          icon="speedometer-outline"
          label="Bugünkü Doluluk Oranı"
          percent={stats.occupancy}
          color={colors.approved}
        />
        <RateCard
          icon="alert-circle-outline"
          label="İptal/Red Oranı"
          percent={stats.noShowRate}
          color={stats.noShowRate > 15 ? colors.danger : colors.pending}
          hint={stats.noShowRate > 15 ? 'Hedefin (%15) üzerinde' : 'Hedef aralığında'}
        />
      </ScrollView>
    </Screen>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.stat, highlight && styles.statHighlight]}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={18} color={colors.gold} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function RateCard({
  icon,
  label,
  percent,
  color,
  hint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  percent: number;
  color: string;
  hint?: string;
}) {
  return (
    <View style={styles.rate}>
      <View style={styles.rateHeader}>
        <View style={styles.rateLabel}>
          <Ionicons name={icon} size={18} color={colors.textMuted} />
          <Text style={styles.rateText}>{label}</Text>
        </View>
        <Text style={[styles.ratePercent, { color }]}>%{percent}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(percent, 100)}%`, backgroundColor: color }]} />
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, ...centeredContent },
  eyebrow: { ...typography.micro, color: colors.gold, letterSpacing: 2, marginBottom: 2 },
  hello: { ...typography.title, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, marginTop: 2 },
  earnHero: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    overflow: 'hidden',
    ...elevation.gold,
  },
  earnGlyph: { position: 'absolute', right: -8, top: -6 },
  earnLabel: { ...typography.caption, color: 'rgba(23,17,9,0.75)', fontWeight: '600' },
  earnValue: { fontSize: 34, fontWeight: '800', color: colors.onGold, letterSpacing: 0.3 },
  earnSub: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  earnSubText: { ...typography.bodyStrong, color: 'rgba(23,17,9,0.85)' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  stat: {
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 8,
    ...elevation.soft,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.gold + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statHighlight: { borderColor: colors.gold + '88' },
  statValue: { ...typography.title, color: colors.text },
  statLabel: { ...typography.caption, color: colors.textMuted },
  rate: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    ...elevation.soft,
  },
  rateHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rateLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rateText: { ...typography.bodyStrong, color: colors.text },
  ratePercent: { ...typography.heading },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  hint: { ...typography.caption, color: colors.textMuted },
});
