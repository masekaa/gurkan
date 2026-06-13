import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { BusinessCard } from '@/components/BusinessCard';
import { EmptyState, ListSkeleton, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useFavoriteBusinesses } from '@/hooks/queries';
import { centeredContent, colors, spacing, typography } from '@/theme';

export default function FavoritesScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const ids = profile?.favorites ?? [];
  const { data, isLoading } = useFavoriteBusinesses(ids);

  return (
    <Screen edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Geri">
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Favorilerim</Text>
        <View style={{ width: 22 }} />
      </View>

      {ids.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="Henüz favorin yok"
          subtitle="İşletme sayfasındaki kalbe dokunarak favorilerine ekleyebilirsin."
        />
      ) : isLoading ? (
        <ListSkeleton kind="business" count={4} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }) => (
            <BusinessCard
              business={item}
              onPress={() => router.push({ pathname: '/business/[id]', params: { id: item.id } })}
            />
          )}
          ListEmptyComponent={
            <EmptyState icon="heart-outline" title="Favori işletmeler yüklenemedi" />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...centeredContent,
  },
  title: { ...typography.heading, color: colors.text },
  list: { padding: spacing.lg, flexGrow: 1, ...centeredContent },
});
