import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BusinessCard } from '@/components/BusinessCard';
import { BusinessCardCompact } from '@/components/BusinessCardCompact';
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
import {
  categoryStyle,
  centeredContent,
  colors,
  elevation,
  radius,
  spacing,
  typography,
} from '@/theme';
import type { Business, BusinessCategory } from '@/types';

const CATEGORIES: BusinessCategory[] = [
  'erkek_berberi',
  'kadin_kuaforu',
  'guzellik_merkezi',
  'barber_shop',
];

const PROMOS: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: readonly [string, string];
}[] = [
  { title: 'Online randevu, sıfır bekleme', subtitle: 'Saniyeler içinde yerini ayır', icon: 'flash', gradient: ['#2C3A8E', '#161E45'] },
  { title: 'Sadakat puanı kazan', subtitle: '10 randevu = 1 ücretsiz hizmet', icon: 'gift', gradient: ['#7E2E6E', '#3A1633'] },
  { title: 'Bursa Nilüfer pilotu', subtitle: 'Bölgenin en iyi salonları', icon: 'sparkles', gradient: ['#1F5A52', '#0F2A26'] },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | BusinessCategory>('all');
  const [viewAll, setViewAll] = useState(false);
  const { data, isLoading, isError, refetch } = useBusinesses(search);
  const seed = useSeedSampleData();

  const showSeed =
    isFirebaseEnabled && !isLoading && !search && (data?.length ?? 0) === 0;
  const listMode = !!search.trim() || filter !== 'all' || viewAll;

  function selectCategory(f: 'all' | BusinessCategory) {
    setFilter(f);
    if (f === 'all') setViewAll(false);
  }
  function clearFilters() {
    setSearch('');
    setFilter('all');
    setViewAll(false);
  }

  const open = (id: string) =>
    router.push({ pathname: '/business/[id]', params: { id } });

  const all = data ?? [];
  const businesses = useMemo(
    () => all.filter((b) => filter === 'all' || b.category === filter),
    [all, filter],
  );
  const topRated = useMemo(
    () => [...all].sort((a, b) => b.rating - a.rating),
    [all],
  );

  // Business accounts use the order inbox instead of the customer discover feed.
  if (profile?.role === 'business') return <Redirect href="/(tabs)/orders" />;

  return (
    <Screen>
      {/* Sticky header: greeting + search */}
      <View style={styles.topHeader}>
        <View style={styles.greetingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>ALTIN100 · BURSA</Text>
            <Text style={styles.hello}>
              Merhaba{profile ? `, ${profile.name.split(' ')[0]}` : ''} 👋
            </Text>
          </View>
          {profile ? <Avatar name={profile.name} size={42} /> : null}
        </View>
        <Field
          icon="search-outline"
          placeholder="İşletme veya bölge ara"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading ? (
        <ListSkeleton kind="business" count={5} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : showSeed ? (
        <View style={styles.seedWrap}>
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
      ) : listMode ? (
        <FlatList
          data={businesses}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={<CategoryChips filter={filter} onSelect={selectCategory} />}
          renderItem={({ item }) => (
            <BusinessCard business={item} onPress={() => open(item.id)} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="Sonuç bulunamadı"
              subtitle="Arama veya kategori kriterlerini değiştirmeyi dene."
              actionLabel="Filtreleri Temizle"
              actionIcon="refresh"
              onAction={clearFilters}
            />
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Promo banners */}
          <FlatList
            data={PROMOS}
            keyExtractor={(p) => p.title}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hList}
            ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
            renderItem={({ item }) => (
              <LinearGradient
                colors={item.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.promo}
              >
                <Ionicons name={item.icon} size={86} color="#ffffff1c" style={styles.promoGlyph} />
                <Text style={styles.promoTitle}>{item.title}</Text>
                <Text style={styles.promoSub}>{item.subtitle}</Text>
              </LinearGradient>
            )}
          />

          {/* Category grid */}
          <Text style={styles.sectionTitle}>Kategoriler</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map((c) => {
              const cat = categoryStyle[c];
              return (
                <Pressable
                  key={c}
                  onPress={() => setFilter(c)}
                  accessibilityRole="button"
                  accessibilityLabel={categoryLabels[c]}
                  style={styles.catTile}
                >
                  <LinearGradient
                    colors={cat.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.catIcon}
                  >
                    <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={24} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.catLabel} numberOfLines={2}>{categoryLabels[c]}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Carousels */}
          <Carousel title="Sana yakın" data={all} onItem={open} onSeeAll={() => setViewAll(true)} />
          <Carousel title="En yüksek puanlılar" data={topRated} onItem={open} onSeeAll={() => setViewAll(true)} />
        </ScrollView>
      )}
    </Screen>
  );
}

function CategoryChips({
  filter,
  onSelect,
}: {
  filter: 'all' | BusinessCategory;
  onSelect: (f: 'all' | BusinessCategory) => void;
}) {
  const items: ('all' | BusinessCategory)[] = ['all', ...CATEGORIES];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chips}
    >
      {items.map((f) => {
        const active = filter === f;
        return (
          <Pressable
            key={f}
            onPress={() => onSelect(f)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {f === 'all' ? 'Tümü' : categoryLabels[f]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function Carousel({
  title,
  data,
  onItem,
  onSeeAll,
}: {
  title: string;
  data: Business[];
  onItem: (id: string) => void;
  onSeeAll?: () => void;
}) {
  if (data.length === 0) return null;
  return (
    <View style={{ marginTop: spacing.xl }}>
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onSeeAll ? (
          <Pressable onPress={onSeeAll} hitSlop={8}>
            <Text style={styles.seeAll}>Tümünü gör</Text>
          </Pressable>
        ) : null}
      </View>
      <FlatList
        data={data}
        keyExtractor={(b) => b.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hList}
        ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
        renderItem={({ item }) => (
          <BusinessCardCompact business={item} onPress={() => onItem(item.id)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    ...centeredContent,
  },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  eyebrow: { ...typography.micro, color: colors.gold, letterSpacing: 1.5, marginBottom: 2 },
  hello: { ...typography.title, color: colors.text },
  scroll: { paddingVertical: spacing.lg, paddingBottom: spacing.xxl, ...centeredContent },
  list: { padding: spacing.lg, gap: spacing.md, flexGrow: 1, ...centeredContent },
  seedWrap: { gap: spacing.lg, padding: spacing.lg, ...centeredContent },
  seedError: { ...typography.caption, color: colors.danger, textAlign: 'center' },
  hList: { paddingHorizontal: spacing.lg },
  promo: {
    width: 300,
    height: 132,
    borderRadius: radius.lg,
    padding: spacing.lg,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    ...elevation.soft,
  },
  promoGlyph: { position: 'absolute', right: -6, top: -8 },
  promoTitle: { ...typography.heading, color: '#fff' },
  promoSub: { ...typography.caption, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  sectionTitle: { ...typography.heading, color: colors.text, paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  seeAll: { ...typography.caption, color: colors.gold, fontWeight: '700' },
  catGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  catTile: { flex: 1, alignItems: 'center', gap: 6 },
  catIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.soft,
  },
  catLabel: { ...typography.micro, color: colors.textMuted, textAlign: 'center' },
  chips: { gap: spacing.sm, paddingBottom: spacing.md },
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
