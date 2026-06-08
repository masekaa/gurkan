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
import { humanizeAuthError } from './login';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    if (!name || !email || !password) {
      setError('Ad, e-posta ve şifre gereklidir.');
      return;
    }
    setLoading(true);
    try {
      await signUp({ name: name.trim(), email: email.trim(), phone: phone.trim(), password });
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(humanizeAuthError(e?.code) ?? 'Kayıt oluşturulamadı.');
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
              <Ionicons name="person-add" size={26} color={colors.onGold} />
            </View>
            <Text style={styles.title}>Hesap Oluştur</Text>
            <Text style={styles.subtitle}>Birkaç adımda Altın100 ailesine katıl.</Text>
          </View>

          {!isFirebaseEnabled ? (
            <View style={styles.demo}>
              <Ionicons name="flask-outline" size={15} color={colors.gold} />
              <Text style={styles.demoText}>
                Demo modu: bilgiler cihazda saklanır, gerçek hesap oluşturulmaz.
              </Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Field
              label="Ad Soyad"
              icon="person-outline"
              placeholder="Adınız Soyadınız"
              value={name}
              onChangeText={setName}
            />
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
              label="Telefon"
              icon="call-outline"
              keyboardType="phone-pad"
              placeholder="+90 5xx xxx xx xx"
              value={phone}
              onChangeText={setPhone}
            />
            <Field
              label="Şifre"
              icon="lock-closed-outline"
              secureTextEntry
              placeholder="En az 6 karakter"
              value={password}
              onChangeText={setPassword}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label="Kayıt Ol" onPress={onSubmit} loading={loading} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Zaten hesabın var mı?</Text>
            <Link href="/(auth)/login" style={styles.link}>
              Giriş Yap
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.xl,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
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
  title: { ...typography.display, color: colors.text, textAlign: 'center' },
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
