import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppointmentCard } from '@/components/AppointmentCard';
import { MonthCalendar, dayKey } from '@/components/MonthCalendar';
import { EmptyState, ErrorState, ListSkeleton, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useAppointments, useUpdateAppointmentStatus } from '@/hooks/queries';
import { centeredContent, colors, elevation, radius, spacing, typography } from '@/theme';
import type { Appointment } from '@/types';

type Tab = 'upcoming' | 'past';

export default function AppointmentsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [calMode, setCalMode] = useState(false);
  const [selDay, setSelDay] = useState<string>(dayKey(new Date()));
  const [refreshing, setRefreshing] = useState(false);
  const { data, isLoading, isError, refetch } = useAppointments();
  const updateStatus = useUpdateAppointmentStatus();

  const noShowCount = useMemo(
    () => (data ?? []).filter((a) => a.status === 'no_show').length,
    [data],
  );

  const marked = useMemo(
    () => new Set((data ?? []).map((a) => dayKey(new Date(a.datetime)))),
    [data],
  );
  const dayItems = useMemo(
    () =>
      (data ?? [])
        .filter((a) => dayKey(new Date(a.datetime)) === selDay)
        .sort((a, b) => (a.datetime < b.datetime ? -1 : 1)),
    [data, selDay],
  );

  async function onRefresh() {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }

  const sections = useMemo(() => {
    const now = Date.now();
    const all = data ?? [];
    const isPast = (a: Appointment) =>
      new Date(a.datetime).getTime() < now ||
      a.status === 'completed' ||
      a.status === 'cancelled' ||
      a.status === 'rejected' ||
      a.status === 'no_show';

    const list = all.filter((a) => (tab === 'past' ? isPast(a) : !isPast(a)));
    return list.length ? [{ title: '', data: list }] : [];
  }, [data, tab]);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Randevularım</Text>
          <Pressable
            onPress={() => setCalMode((v) => !v)}
            hitSlop={8}
            style={styles.viewToggle}
            accessibilityRole="button"
            accessibilityLabel={calMode ? 'Liste görünümü' : 'Takvim görünümü'}
          >
            <Ionicons name={calMode ? 'list-outline' : 'calendar-outline'} size={18} color={colors.gold} />
            <Text style={styles.viewToggleText}>{calMode ? 'Liste' : 'Takvim'}</Text>
          </Pressable>
        </View>
        {!calMode ? (
          <View style={styles.segment}>
            {(['upcoming', 'past'] as Tab[]).map((t) => (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === t }}
                accessibilityLabel={t === 'upcoming' ? 'Yaklaşan' : 'Geçmiş'}
                style={[styles.segBtn, tab === t && styles.segActive]}
              >
                <Text style={[styles.segText, tab === t && styles.segTextActive]}>
                  {t === 'upcoming' ? 'Yaklaşan' : 'Geçmiş'}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {profile?.suspended ? (
          <View style={[styles.banner, styles.bannerDanger]}>
            <Ionicons name="lock-closed" size={18} color={colors.danger} />
            <Text style={styles.bannerText}>
              Hesabın askıya alındı; yeni randevu oluşturamazsın. Randevularına
              düzenli gelmediğin için uygulandı. İtiraz için: iyikirandevu@gmail.com
            </Text>
          </View>
        ) : noShowCount > 0 ? (
          <View style={[styles.banner, styles.bannerWarn]}>
            <Ionicons name="alert-circle" size={18} color={colors.noShow} />
            <Text style={styles.bannerText}>
              {noShowCount >= 3
                ? 'Birden çok randevuna gelmedin. Devam ederse hesabın askıya alınabilir; lütfen randevularına özen göster.'
                : 'Bir randevuna gelmedin. Randevularına gitmemek tekrarlanırsa hesabın askıya alınabilir.'}
            </Text>
          </View>
        ) : null}
      </View>

      {isLoading ? (
        <ListSkeleton kind="card" count={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : calMode ? (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />
          }
        >
          <MonthCalendar marked={marked} selected={selDay} onSelect={setSelDay} />
          <View style={{ height: spacing.lg }} />
          {dayItems.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="Bu günde randevu yok"
              subtitle="Takvimden başka bir gün seç."
            />
          ) : (
            dayItems.map((item) => (
              <View key={item.id} style={{ marginBottom: spacing.md }}>
                <AppointmentCard
                  appointment={item}
                  onPress={() =>
                    router.push({ pathname: '/appointment/[id]', params: { id: item.id } })
                  }
                  onCancel={() => updateStatus.mutate({ id: item.id, status: 'cancelled' })}
                />
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />
          }
          renderItem={({ item }) => (
            <AppointmentCard
              appointment={item}
              onPress={() =>
                router.push({ pathname: '/appointment/[id]', params: { id: item.id } })
              }
              onCancel={() =>
                updateStatus.mutate({ id: item.id, status: 'cancelled' })
              }
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title={tab === 'upcoming' ? 'Yaklaşan randevun yok' : 'Geçmiş randevu yok'}
              subtitle="Keşfet sekmesinden yeni bir randevu oluşturabilirsin."
              actionLabel={tab === 'upcoming' ? "Keşfet'e Git" : undefined}
              actionIcon="compass-outline"
              onAction={tab === 'upcoming' ? () => router.push('/(tabs)') : undefined}
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md, ...centeredContent },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...typography.title, color: colors.text },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.gold + '14',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gold + '40',
  },
  viewToggleText: { ...typography.caption, color: colors.gold, fontWeight: '700' },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 4,
  },
  segBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: 9, alignItems: 'center' },
  segActive: { backgroundColor: colors.surface, ...elevation.soft },
  segText: { ...typography.caption, color: colors.textMuted },
  segTextActive: { color: colors.text, fontWeight: '700' },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  bannerDanger: { backgroundColor: colors.danger + '12', borderColor: colors.danger + '40' },
  bannerWarn: { backgroundColor: colors.noShow + '14', borderColor: colors.noShow + '44' },
  bannerText: { ...typography.caption, color: colors.text, flex: 1, lineHeight: 18 },
  list: { padding: spacing.lg, gap: spacing.md, flexGrow: 1, ...centeredContent },
});
