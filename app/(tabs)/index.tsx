import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BusinessCard } from '@/components/BusinessCard';
import { EmptyState, Field, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useBusinesses } from '@/hooks/queries';
import { categoryLabels } from '@/lib/format';
import { colors, radius, spacing, typography } from '@/theme';
import type { BusinessCategory } from '@/types';

const FILTERS: ('all' | BusinessCategory)[] = [
  'all',
  'erkek_berberi',
  'kadin_kuaforu',
  'guzellik_merkezi',
  'barber_shop',
];

export default function DiscoverScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | BusinessCategory>('all');
  const { data, isLoading } = useBusinesses(search);

  const businesses = useMemo(
    () => (data ?? []).filter((b) => filter === 'all' || b.category === filter),
    [data, filter],
  );

  return (
    <Screen>
      <FlatList
        data={businesses}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.greetingRow}>
              <View>
                <Text style={styles.hello}>Merhaba{profile ? `, ${profile.name.split(' ')[0]}` : ''} 👋</Text>
                <Text style={styles.subtitle}>Bugün hangi hizmete ihtiyacın var?</Text>
              </View>
            </View>

            <Field
              icon="search-outline"
              placeholder="İşletme veya bölge ara"
              value={search}
              onChangeText={setSearch}
            />

            <View style={styles.chips}>
              {FILTERS.map((f) => {
                const active = filter === f;
                return (
                  <Pressable
                    key={f}
                    onPress={() => setFilter(f)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {f === 'all' ? 'Tümü' : categoryLabels[f]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <BusinessCard
            business={item}
            onPress={() =>
              router.push({ pathname: '/business/[id]', params: { id: item.id } })
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.xxl }} />
          ) : (
            <EmptyState
              icon="search-outline"
              title="Sonuç bulunamadı"
              subtitle="Arama veya filtre kriterlerini değiştirmeyi dene."
            />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md },
  header: { gap: spacing.lg, marginBottom: spacing.md },
  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hello: { ...typography.title, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { ...typography.caption, color: colors.textMuted },
  chipTextActive: { color: colors.onGold, fontWeight: '700' },
});
