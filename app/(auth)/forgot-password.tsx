import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button, Field, Screen } from '@/components/ui';
import { auth, isFirebaseEnabled } from '@/lib/firebase';
import { colors, spacing, typography } from '@/theme';
import { humanizeAuthError } from './login';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit() {
    setError(null);
    const value = email.trim();
    if (!value) {
      setError('E-posta adresini gir.');
      return;
    }
    setLoading(true);
    try {
      if (isFirebaseEnabled && auth) {
        await sendPasswordResetEmail(auth, value);
      }
      // Mock mode: nothing to send — still show success for a consistent flow.
      setSent(true);
    } catch (e: any) {
      setError(humanizeAuthError(e?.code) ?? 'Bağlantı gönderilemedi.');
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
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.back} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>

          {sent ? (
            <View style={styles.brand}>
              <View style={styles.successLogo}>
                <Ionicons name="mail-open-outline" size={30} color={colors.onGold} />
              </View>
              <Text style={styles.title}>E-postanı kontrol et</Text>
              <Text style={styles.subtitle}>
                {isFirebaseEnabled
                  ? `${email.trim()} adresine bir şifre sıfırlama bağlantısı gönderdik. Gelen kutunu ve spam klasörünü kontrol et.`
                  : 'Demo modunda gerçek e-posta gönderilmez. Firebase bağlıyken bu adrese sıfırlama bağlantısı iletilir.'}
              </Text>
              <View style={{ width: '100%', marginTop: spacing.lg }}>
                <Button label="Girişe Dön" onPress={() => router.replace('/(auth)/login')} />
              </View>
            </View>
          ) : (
            <>
              <View style={styles.brand}>
                <View style={styles.logo}>
                  <Ionicons name="key-outline" size={28} color={colors.onGold} />
                </View>
                <Text style={styles.title}>Şifreni mi unuttun?</Text>
                <Text style={styles.subtitle}>
                  Kayıtlı e-posta adresini gir, sana bir sıfırlama bağlantısı gönderelim.
                </Text>
              </View>

              {!isFirebaseEnabled ? (
                <View style={styles.demo}>
                  <Ionicons name="flask-outline" size={15} color={colors.gold} />
                  <Text style={styles.demoText}>
                    Demo modu: e-posta gönderilmez, akış simüle edilir.
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
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Button label="Sıfırlama Bağlantısı Gönder" onPress={onSubmit} loading={loading} />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xl, width: '100%', maxWidth: 480, alignSelf: 'center' },
  back: { position: 'absolute', top: spacing.md, left: spacing.lg, width: 40, height: 40, justifyContent: 'center' },
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
  successLogo: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { ...typography.display, color: colors.text, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
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
});
