import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui';
import { centeredContent, colors, elevation, gradients, radius, spacing, typography } from '@/theme';

/**
 * Sadakat programı geçici olarak devre dışı. Sekme, gelecekte açılacağını
 * belli eden bir "geliştirme aşamasında" ekranıyla korunuyor. (Puan biriktirme
 * altyapısı arka planda duruyor; yalnızca müşteri arayüzü gizlendi.)
 */
export default function LoyaltyScreen() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Sadakat Puanların</Text>

        <LinearGradient
          colors={gradients.goldButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Ionicons name="gift" size={130} color="#00000010" style={styles.heroGlyph} />
          <View style={styles.badge}>
            <Ionicons name="construct-outline" size={26} color={colors.onGold} />
          </View>
          <Text style={styles.heroTitle}>Geliştirme Aşamasında</Text>
          <Text style={styles.heroText}>
            Sadakat programı üzerinde çalışıyoruz. Çok yakında her randevunda puan
            kazanıp ödüllere dönüştürebileceksin.
          </Text>
        </LinearGradient>

        <View style={styles.card}>
          <Row icon="star-outline" text="Her tamamlanan randevu puan kazandıracak." />
          <Row icon="gift-outline" text="Biriken puanlar ücretsiz hizmete dönüşecek." />
          <Row icon="notifications-outline" text="Program açıldığında seni haberdar edeceğiz." />
        </View>
      </ScrollView>
    </Screen>
  );
}

function Row({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.gold} />
      </View>
      <Text style={styles.rowText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, flexGrow: 1, ...centeredContent },
  title: { ...typography.title, color: colors.text },
  hero: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    overflow: 'hidden',
    ...elevation.gold,
  },
  heroGlyph: { position: 'absolute', right: -10, top: -16 },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(23,17,9,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  heroTitle: { ...typography.title, color: colors.onGold, textAlign: 'center' },
  heroText: {
    ...typography.body,
    color: 'rgba(23,17,9,0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...elevation.soft,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.gold + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { ...typography.body, color: colors.textMuted, flex: 1, lineHeight: 20 },
});
