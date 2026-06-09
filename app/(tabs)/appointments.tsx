import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppointmentCard } from '@/components/AppointmentCard';
import { EmptyState, ErrorState, ListSkeleton, Screen } from '@/components/ui';
import { useAppointments, useUpdateAppointmentStatus } from '@/hooks/queries';
import { centeredContent, colors, spacing, typography } from '@/theme';
import type { Appointment } from '@/types';

type Tab = 'upcoming' | 'past';

export default function AppointmentsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('upcoming');
  const { data, isLoading, isError, refetch } = useAppointments();
  const updateStatus = useUpdateAppointmentStatus();

  const sections = useMemo(() => {
    const now = Date.now();
    const all = data ?? [];
    const isPast = (a: Appointment) =>
      new Date(a.datetime).getTime() < now ||
      a.status === 'completed' ||
      a.status === 'cancelled' ||
      a.status === 'rejected';

    const list = all.filter((a) => (tab === 'past' ? isPast(a) : !isPast(a)));
    return list.length ? [{ title: '', data: list }] : [];
  }, [data, tab]);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Randevularım</Text>
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
      </View>

      {isLoading ? (
        <ListSkeleton kind="card" count={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
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
  title: { ...typography.title, color: colors.text },
  segment: {
    flexDirection: 'row',
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
  list: { padding: spacing.lg, gap: spacing.md, flexGrow: 1, ...centeredContent },
});
