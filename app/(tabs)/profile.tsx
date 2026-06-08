import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Avatar, Button, Card } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { isFirebaseEnabled } from '@/lib/firebase';
import { colors, radius, spacing, typography } from '@/theme';

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  async function onSignOut() {
    await signOut();
    router.replace('/(auth)/login');
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profil</Text>

      <Card style={styles.identity}>
        <Avatar name={profile?.name ?? 'Misafir'} size={64} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{profile?.name ?? 'Misafir'}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
          {profile?.phone ? <Text style={styles.email}>{profile.phone}</Text> : null}
        </View>
      </Card>

      <Card style={styles.referral}>
        <View style={styles.referralTop}>
          <Ionicons name="ticket-outline" size={20} color={colors.gold} />
          <Text style={styles.referralTitle}>Referans Kodun</Text>
        </View>
        <Text style={styles.referralCode}>{profile?.referralCode ?? '—'}</Text>
        <Text style={styles.referralHint}>
          Arkadaşın bu kodla kayıt olduğunda sen +2, o +1 puan kazanır.
        </Text>
      </Card>

      <View style={styles.menu}>
        <MenuRow icon="notifications-outline" label="Bildirim Tercihleri" />
        <MenuRow icon="shield-checkmark-outline" label="Hesap Güvenliği" />
        <MenuRow icon="help-circle-outline" label="Yardım & Destek" />
        <MenuRow icon="document-text-outline" label="Kullanım Koşulları" />
      </View>

      <View style={styles.backendNote}>
        <Ionicons
          name={isFirebaseEnabled ? 'cloud-done-outline' : 'flask-outline'}
          size={14}
          color={colors.textFaint}
        />
        <Text style={styles.backendText}>
          {isFirebaseEnabled ? 'Firebase bağlı' : 'Demo modu (yerel veri)'}
        </Text>
      </View>

      <Button label="Çıkış Yap" variant="danger" icon="log-out-outline" onPress={onSignOut} />
    </ScrollView>
  );
}

function MenuRow({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.7 }]}>
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  title: { ...typography.title, color: colors.text, marginTop: spacing.md },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  name: { ...typography.heading, color: colors.text },
  email: { ...typography.caption, color: colors.textMuted, marginTop: 1 },
  referral: { gap: spacing.sm },
  referralTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  referralTitle: { ...typography.bodyStrong, color: colors.text },
  referralCode: {
    ...typography.display,
    color: colors.gold,
    letterSpacing: 2,
  },
  referralHint: { ...typography.caption, color: colors.textMuted },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuLabel: { ...typography.body, color: colors.text, flex: 1 },
  backendNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  backendText: { ...typography.caption, color: colors.textFaint },
});
