import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BusinessCard } from '@/components/BusinessCard';
import {
  Avatar,
  Button,
  EmptyState,
  ErrorState,
  Field,
  ListSkeleton,
  Screen,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useBusinesses, useSeedSampleData } from '@/hooks/queries';
import { isFirebaseEnabled } from '@/lib/firebase';
import { categoryLabels } from '@/lib/format';
import { centeredContent, colors, radius, spacing, typography } from '@/theme';
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
  const { data, isLoading, isError, refetch } = useBusinesses(search);
  const seed = useSeedSampleData();

  // Show a one-tap seed action when a freshly connected Firestore is empty.
  const showSeed =
    isFirebaseEnabled && !isLoading && !search && (data?.length ?? 0) === 0;

  const businesses = useMemo(
    () => (data ?? []).filter((b) => filter === 'all' || b.category === filter),
    [data, filter],
  );

  // Business accounts use the order inbox instead of the customer discover feed.
  if (profile?.role === 'business') return <Redirect href="/(tabs)/orders" />;

  return (
    <Screen>
      <FlatList
        data={businesses}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.greetingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>ALTIN100</Text>
                <Text style={styles.hello}>
                  Merhaba{profile ? `, ${profile.name.split(' ')[0]}` : ''} 👋
                </Text>
                <Text style={styles.subtitle}>Bugün hangi hizmete ihtiyacın var?</Text>
              </View>
              {profile ? <Avatar name={profile.name} size={46} /> : null}
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
            <ListSkeleton kind="business" count={5} />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : showSeed ? (
            <View style={{ gap: spacing.lg, marginTop: spacing.xl }}>
              <EmptyState
                icon="cloud-upload-outline"
                title="Henüz işletme yok"
                subtitle="Firebase'e bağlandın! Başlamak için örnek işletme ve hizmetleri tek dokunuşla yükleyebilirsin."
              />
              <Button
                label="Örnek Verileri Yükle"
                icon="sparkles-outline"
                loading={seed.isPending}
                onPress={() => seed.mutate()}
              />
              {seed.isError ? (
                <Text style={styles.seedError}>
                  Yüklenemedi. Firestore kurallarının yayınlandığından emin ol.
                </Text>
              ) : null}
            </View>
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
  list: { padding: spacing.lg, gap: spacing.md, ...centeredContent },
  header: { gap: spacing.lg, marginBottom: spacing.md },
  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  eyebrow: { ...typography.micro, color: colors.gold, letterSpacing: 2, marginBottom: 2 },
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
  seedError: { ...typography.caption, color: colors.danger, textAlign: 'center' },
});
