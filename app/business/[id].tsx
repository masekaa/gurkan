import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Avatar, Badge, Screen } from '@/components/ui';
import { useBusiness, useServices } from '@/hooks/queries';
import {
  categoryLabels,
  formatDuration,
  formatPrice,
} from '@/lib/format';
import { colors, radius, spacing, typography } from '@/theme';

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: business, isLoading } = useBusiness(id);
  const { data: services } = useServices(id);

  if (isLoading || !business) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.xxl }} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>

        <View style={styles.hero}>
          <Avatar name={business.name} size={76} />
          <Text style={styles.name}>{business.name}</Text>
          <Badge label={categoryLabels[business.category]} />
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={15} color={colors.gold} />
            <Text style={styles.rating}>{business.rating.toFixed(1)}</Text>
            <Text style={styles.reviews}>({business.reviewCount} değerlendirme)</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <InfoRow icon="location-outline" text={`${business.address}\n${business.district}`} />
          <InfoRow icon="call-outline" text={business.phone} />
          <InfoRow
            icon="time-outline"
            text={`Çalışma saatleri: ${business.openingTime} - ${business.closingTime}`}
          />
        </View>

        {business.about ? (
          <View style={styles.about}>
            <Text style={styles.sectionTitle}>Hakkında</Text>
            <Text style={styles.aboutText}>{business.about}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Hizmetler</Text>
        <View style={{ gap: spacing.md }}>
          {(services ?? []).map((s) => (
            <Pressable
              key={s.id}
              onPress={() =>
                router.push({
                  pathname: '/booking/[businessId]',
                  params: { businessId: business.id, serviceId: s.id },
                })
              }
              style={({ pressed }) => [styles.serviceRow, pressed && { opacity: 0.85 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceName}>{s.name}</Text>
                <Text style={styles.serviceMeta}>{formatDuration(s.durationMin)}</Text>
              </View>
              <Text style={styles.servicePrice}>{formatPrice(s.price)}</Text>
              <View style={styles.bookBtn}>
                <Text style={styles.bookBtnText}>Randevu Al</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

function InfoRow({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={colors.gold} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  back: { width: 40, height: 40, justifyContent: 'center' },
  hero: { alignItems: 'center', gap: spacing.sm },
  name: { ...typography.title, color: colors.text, textAlign: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { ...typography.bodyStrong, color: colors.text },
  reviews: { ...typography.caption, color: colors.textMuted },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  infoText: { ...typography.body, color: colors.textMuted, flex: 1 },
  about: { gap: spacing.sm },
  aboutText: { ...typography.body, color: colors.textMuted, lineHeight: 22 },
  sectionTitle: { ...typography.heading, color: colors.text },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  serviceName: { ...typography.bodyStrong, color: colors.text },
  serviceMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  servicePrice: { ...typography.bodyStrong, color: colors.text },
  bookBtn: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  bookBtnText: { ...typography.micro, color: colors.onGold },
});
