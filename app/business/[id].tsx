import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge, Button, ErrorState, Field, ListSkeleton, Screen, Skeleton } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import {
  useAppointments,
  useBusiness,
  useCreateReview,
  useReviews,
  useServices,
} from '@/hooks/queries';
import { categoryLabels, formatDate, formatDuration, formatPrice } from '@/lib/format';
import { categoryStyle, centeredContent, colors, elevation, radius, spacing, typography } from '@/theme';
import type { Review } from '@/types';

function isOpenNow(open: string, close: string): boolean {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = open.split(':').map(Number);
  const [ch, cm] = close.split(':').map(Number);
  return mins >= oh * 60 + om && mins < ch * 60 + cm;
}

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { data: business, isLoading, isError, refetch } = useBusiness(id);
  const { data: services } = useServices(id);
  const { data: reviews } = useReviews(id);
  const { data: myAppointments } = useAppointments();
  const createReview = useCreateReview(id);

  // Only customers who booked at this business may review (proven via an appointment).
  const myAppt = (myAppointments ?? []).find((a) => a.businessId === id);
  const canReview = !!myAppt;

  const [reviewOpen, setReviewOpen] = useState(false);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');

  if (isError) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: false }} />
        <ErrorState onRetry={() => refetch()} />
      </Screen>
    );
  }

  if (isLoading || !business) {
    return (
      <Screen edges={[]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Skeleton width="100%" height={200} radius={0} />
        <ListSkeleton kind="card" count={3} />
      </Screen>
    );
  }

  const cat = categoryStyle[business.category] ?? categoryStyle.erkek_berberi;
  const open = isOpenNow(business.openingTime, business.closingTime);
  const initials = business.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={cat.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}
        >
          <Ionicons
            name={cat.icon as keyof typeof Ionicons.glyphMap}
            size={170}
            color="#ffffff12"
            style={styles.heroGlyph}
          />
          <Pressable
            onPress={() => router.back()}
            style={styles.back}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Geri"
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>

          <View style={styles.heroContent}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>{initials}</Text>
            </View>
            <Text style={styles.name}>{business.name}</Text>
            <View style={styles.heroMeta}>
              <View style={styles.starRow}>
                <Ionicons name="star" size={14} color={colors.gold} />
                <Text style={styles.rating}>{business.rating.toFixed(1)}</Text>
                <Text style={styles.reviews}>({business.reviewCount})</Text>
              </View>
              <View style={styles.heroDot} />
              <Text style={styles.category}>{categoryLabels[business.category]}</Text>
              <View style={styles.heroDot} />
              <Text style={[styles.openText, { color: open ? '#7BE3A0' : '#D6D3CC' }]}>
                {open ? 'Açık' : 'Kapalı'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.infoCard}>
            <InfoRow icon="location-outline" text={`${business.address}\n${business.district}`} />
            <View style={styles.divider} />
            <InfoRow icon="call-outline" text={business.phone} />
            <View style={styles.divider} />
            <InfoRow
              icon="time-outline"
              text={`Çalışma saatleri: ${business.openingTime} – ${business.closingTime}`}
            />
          </View>

          {business.about ? (
            <View style={styles.about}>
              <Text style={styles.sectionTitle}>Hakkında</Text>
              <Text style={styles.aboutText}>{business.about}</Text>
            </View>
          ) : null}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hizmetler</Text>
            <Badge label={`${services?.length ?? 0} hizmet`} />
          </View>
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
                style={({ pressed }) => [
                  styles.serviceRow,
                  pressed && { transform: [{ scale: 0.98 }], opacity: 0.95 },
                ]}
              >
                <View style={styles.serviceIcon}>
                  <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={18} color={colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceName}>{s.name}</Text>
                  <View style={styles.serviceMetaRow}>
                    <Ionicons name="time-outline" size={12} color={colors.textFaint} />
                    <Text style={styles.serviceMeta}>{formatDuration(s.durationMin)}</Text>
                  </View>
                </View>
                <View style={styles.servicePriceCol}>
                  <Text style={styles.servicePrice}>{formatPrice(s.price)}</Text>
                  <View style={styles.bookBtn}>
                    <Text style={styles.bookBtnText}>Randevu Al</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Reviews */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Değerlendirmeler</Text>
            {canReview ? (
              <Pressable
                onPress={() => {
                  setStars(5);
                  setComment('');
                  setReviewOpen(true);
                }}
                style={styles.reviewAdd}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Yorum yap"
              >
                <Ionicons name="create-outline" size={15} color={colors.gold} />
                <Text style={styles.reviewAddText}>Yorum Yap</Text>
              </Pressable>
            ) : null}
          </View>
          {!canReview ? (
            <Text style={styles.reviewHint}>
              Yorum yapabilmek için bu işletmeden randevu almış olmalısın.
            </Text>
          ) : null}

          {reviews && reviews.length > 0 ? (
            <View style={[styles.ratingSummary, elevation.soft]}>
              <Text style={styles.avgValue}>
                {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
              </Text>
              <View style={{ gap: 2 }}>
                <Stars
                  value={Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)}
                  size={16}
                />
                <Text style={styles.avgCount}>{reviews.length} değerlendirme</Text>
              </View>
            </View>
          ) : null}

          <View style={{ gap: spacing.md }}>
            {(reviews ?? []).length === 0 ? (
              <Text style={styles.noReviews}>Henüz yorum yok. İlk yorumu sen yap!</Text>
            ) : (
              (reviews ?? []).map((r) => <ReviewRow key={r.id} review={r} />)
            )}
          </View>
        </View>
      </ScrollView>

      {/* Write review bottom sheet */}
      <Modal visible={reviewOpen} transparent animationType="slide" onRequestClose={() => setReviewOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{business.name} için yorum</Text>
            <View style={styles.starPicker}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setStars(n)} hitSlop={6}>
                  <Ionicons
                    name={n <= stars ? 'star' : 'star-outline'}
                    size={34}
                    color={colors.gold}
                  />
                </Pressable>
              ))}
            </View>
            <Field
              placeholder="Deneyimini birkaç cümleyle anlat…"
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <View style={styles.sheetActions}>
              <View style={{ flex: 1 }}>
                <Button label="Vazgeç" variant="secondary" onPress={() => setReviewOpen(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Gönder"
                  loading={createReview.isPending}
                  disabled={comment.trim().length === 0}
                  onPress={() =>
                    myAppt &&
                    createReview.mutate(
                      {
                        userId: profile?.id ?? 'anon',
                        userName: profile?.name ?? 'Misafir',
                        rating: stars,
                        comment: comment.trim(),
                        appointmentId: myAppt.id,
                      },
                      { onSuccess: () => setReviewOpen(false) },
                    )
                  }
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
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

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={n <= value ? 'star' : 'star-outline'}
          size={size}
          color={colors.gold}
        />
      ))}
    </View>
  );
}

function ReviewRow({ review }: { review: Review }) {
  const initials = review.userName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View style={[styles.reviewRow, elevation.soft]}>
      <View style={styles.reviewHead}>
        <View style={styles.reviewAvatar}>
          <Text style={styles.reviewInitials}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.reviewName}>{review.userName}</Text>
          <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
        </View>
        <Stars value={review.rating} />
      </View>
      {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl, ...centeredContent },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    overflow: 'hidden',
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  heroGlyph: { position: 'absolute', right: -24, top: 24 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  heroContent: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  logo: {
    width: 76,
    height: 76,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(14,14,18,0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { ...typography.title, color: '#fff' },
  name: { ...typography.title, color: '#fff', textAlign: 'center' },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { ...typography.bodyStrong, color: '#fff' },
  reviews: { ...typography.caption, color: 'rgba(255,255,255,0.7)' },
  heroDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' },
  category: { ...typography.caption, color: 'rgba(255,255,255,0.85)' },
  openText: { ...typography.caption, fontWeight: '700' },
  body: { padding: spacing.lg, gap: spacing.lg, marginTop: spacing.sm },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...elevation.soft,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  infoText: { ...typography.body, color: colors.textMuted, flex: 1, lineHeight: 21 },
  about: { gap: spacing.sm },
  aboutText: { ...typography.body, color: colors.textMuted, lineHeight: 22 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...typography.heading, color: colors.text },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    ...elevation.soft,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceName: { ...typography.bodyStrong, color: colors.text },
  serviceMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  serviceMeta: { ...typography.caption, color: colors.textMuted },
  servicePriceCol: { alignItems: 'flex-end', gap: spacing.xs },
  servicePrice: { ...typography.bodyStrong, color: colors.text },
  bookBtn: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  bookBtnText: { ...typography.micro, color: colors.onGold },
  reviewAdd: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviewAddText: { ...typography.caption, color: colors.gold, fontWeight: '600' },
  reviewHint: { ...typography.caption, color: colors.textFaint, fontStyle: 'italic' },
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  avgValue: { fontSize: 36, fontWeight: '800', color: colors.gold },
  avgCount: { ...typography.caption, color: colors.textMuted },
  noReviews: { ...typography.caption, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
  reviewRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reviewAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gold + '55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewInitials: { ...typography.caption, color: colors.gold, fontWeight: '700' },
  reviewName: { ...typography.bodyStrong, color: colors.text },
  reviewDate: { ...typography.micro, color: colors.textFaint },
  reviewComment: { ...typography.body, color: colors.textMuted, lineHeight: 21 },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  sheetTitle: { ...typography.heading, color: colors.text, textAlign: 'center' },
  starPicker: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  sheetActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
});
