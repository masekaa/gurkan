import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button, Field, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { isFirebaseEnabled } from '@/lib/firebase';
import { colors, spacing, typography } from '@/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    if (!email || !password) {
      setError('E-posta ve şifre gereklidir.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(humanizeAuthError(e?.code) ?? 'Giriş yapılamadı.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Ionicons name="cut" size={28} color={colors.onGold} />
            </View>
            <Text style={styles.title}>Altın100</Text>
            <Text style={styles.subtitle}>
              Berber & güzellik randevunu saniyeler içinde al.
            </Text>
          </View>

          {!isFirebaseEnabled ? (
            <View style={styles.demo}>
              <Ionicons name="flask-outline" size={15} color={colors.gold} />
              <Text style={styles.demoText}>
                Demo modu: herhangi bir e-posta/şifre ile giriş yapabilirsiniz.
              </Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Field
              label="E-posta"
              icon="mail-outline"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="ornek@altin100.com"
              value={email}
              onChangeText={setEmail}
            />
            <Field
              label="Şifre"
              icon="lock-closed-outline"
              secureTextEntry
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label="Giriş Yap" onPress={onSubmit} loading={loading} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Hesabın yok mu?</Text>
            <Link href="/(auth)/register" style={styles.link}>
              Kayıt Ol
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

export function humanizeAuthError(code?: string): string | null {
  switch (code) {
    case 'auth/invalid-email':
      return 'Geçersiz e-posta adresi.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-posta veya şifre hatalı.';
    case 'auth/email-already-in-use':
      return 'Bu e-posta zaten kayıtlı.';
    case 'auth/weak-password':
      return 'Şifre en az 6 karakter olmalı.';
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xl },
  brand: { alignItems: 'center', gap: spacing.sm },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { ...typography.display, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  demo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.gold + '14',
    borderColor: colors.gold + '40',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: spacing.md,
  },
  demoText: { ...typography.caption, color: colors.goldSoft, flex: 1 },
  form: { gap: spacing.md },
  error: { ...typography.caption, color: colors.danger, marginLeft: spacing.xs },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs },
  footerText: { ...typography.body, color: colors.textMuted },
  link: { ...typography.bodyStrong, color: colors.gold },
});
