import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button, Screen } from '@/components/ui';
import { ONBOARDING_SEEN_KEY } from '@/lib/onboarding';
import { colors, radius, spacing, typography } from '@/theme';

type Slide = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    icon: 'search-outline',
    title: 'Yakınındaki en iyiler',
    body: 'Berber, kuaför ve güzellik merkezlerini keşfet. Puanlara, yorumlara ve açık olanlara göre filtrele.',
  },
  {
    icon: 'calendar-outline',
    title: 'Saniyeler içinde randevu',
    body: 'İstediğin hizmeti seç, sana uygun saati belirle ve randevunu anında oluştur. Çakışma yok, bekleme yok.',
  },
  {
    icon: 'sparkles-outline',
    title: 'Sadıklara altın puan',
    body: 'Her randevuda puan kazan, gerçek yorumları gör ve favori işletmelerini tek dokunuşla kaydet.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = Dimensions.get('window');
  const slideWidth = Math.min(width, 480);
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;

  async function finish() {
    try {
      await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, '1');
    } catch {
      // Ignore storage errors — worst case the user sees onboarding again.
    }
    // Guests browse without login (App Store 5.1.1); enter the app directly.
    router.replace('/(tabs)');
  }

  function onMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
    if (next !== index) setIndex(next);
  }

  function onNext() {
    if (isLast) {
      void finish();
      return;
    }
    const next = index + 1;
    scrollRef.current?.scrollTo({ x: next * slideWidth, animated: true });
    setIndex(next);
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => void finish()} hitSlop={10} accessibilityRole="button">
          <Text style={styles.skip}>Atla</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        style={{ flexGrow: 0 }}
      >
        {SLIDES.map((s) => (
          <View key={s.title} style={[styles.slide, { width: slideWidth }]}>
            <View style={styles.iconWrap}>
              <Ionicons name={s.icon} size={64} color={colors.gold} />
            </View>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <View key={s.title} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.footer}>
        <Button label={isLast ? 'Hadi Başlayalım' : 'Devam'} onPress={onNext} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  skip: { ...typography.bodyStrong, color: colors.textMuted },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  iconWrap: {
    width: 140,
    height: 140,
    borderRadius: 40,
    backgroundColor: colors.gold + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { ...typography.display, color: colors.text, textAlign: 'center' },
  body: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: colors.gold, width: 22 },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
});
