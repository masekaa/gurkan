import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { EmptyState, ListSkeleton, Screen } from '@/components/ui';
import { useLoyalty } from '@/hooks/queries';
import { centeredContent, colors, elevation, gradients, radius, spacing, typography } from '@/theme';
import type { Loyalty } from '@/types';

const POINTS_PER_REWARD = 10;

export default function LoyaltyScreen() {
  const { data, isLoading } = useLoyalty();
  const items = data ?? [];

  const totalPoints = items.reduce((s, l) => s + l.points, 0);
  const totalFree = items.reduce((s, l) => s + l.freeServices, 0);

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(l) => l.businessId}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={{ gap: spacing.lg, marginBottom: spacing.md }}>
            <Text style={styles.title}>Sadakat Puanların</Text>
            <LinearGradient
              colors={gradients.goldButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summary}
            >
              <Ionicons name="star" size={120} color="#00000010" style={styles.summaryGlyph} />
              <View style={styles.summaryItem}>
                <Ionicons name="star" size={20} color={colors.onGold} />
                <Text style={styles.summaryValue}>{totalPoints}</Text>
                <Text style={styles.summaryLabel}>Toplam Puan</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Ionicons name="gift" size={20} color={colors.onGold} />
                <Text style={styles.summaryValue}>{totalFree}</Text>
                <Text style={styles.summaryLabel}>Ücretsiz Hizmet</Text>
              </View>
            </LinearGradient>
            <Text style={styles.rule}>
              Her tamamlanan randevu +1 puan. {POINTS_PER_REWARD} puan = 1 ücretsiz hizmet.
            </Text>
          </View>
        }
        renderItem={({ item }) => <LoyaltyRow item={item} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          isLoading ? (
            <ListSkeleton kind="card" count={3} />
          ) : (
            <EmptyState
              icon="gift-outline"
              title="Henüz puanın yok"
              subtitle="İlk randevunu tamamla, puan kazanmaya başla."
            />
          )
        }
      />
    </Screen>
  );
}

function LoyaltyRow({ item }: { item: Loyalty }) {
  const progress = (item.points % POINTS_PER_REWARD) / POINTS_PER_REWARD;
  const remaining = POINTS_PER_REWARD - (item.points % POINTS_PER_REWARD);
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.business} numberOfLines={1}>
          {item.business?.name ?? 'İşletme'}
        </Text>
        <Text style={styles.points}>{item.points} puan</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.hint}>
        {item.freeServices > 0
          ? `🎉 ${item.freeServices} ücretsiz hizmet hakkın var!`
          : `Ücretsiz hizmet için ${remaining} puan kaldı.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, flexGrow: 1, ...centeredContent },
  title: { ...typography.title, color: colors.text },
  summary: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    padding: spacing.lg,
    overflow: 'hidden',
    ...elevation.gold,
  },
  summaryGlyph: { position: 'absolute', right: -10, top: -16 },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryDivider: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(23,17,9,0.2)' },
  summaryValue: { ...typography.display, color: colors.onGold },
  summaryLabel: { ...typography.caption, color: 'rgba(23,17,9,0.75)', fontWeight: '600' },
  rule: { ...typography.caption, color: colors.textFaint, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    ...elevation.soft,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  business: { ...typography.bodyStrong, color: colors.text, flex: 1 },
  points: { ...typography.bodyStrong, color: colors.gold },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.gold, borderRadius: 4 },
  hint: { ...typography.caption, color: colors.textMuted },
});
