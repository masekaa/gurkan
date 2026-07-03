import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
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
import { useAuth } from '@/context/AuthContext';
import { isFirebaseEnabled } from '@/lib/firebase';
import { categoryLabels } from '@/lib/format';
import { PASSWORD_RULE, isValidEmail, isValidPassword, isValidPhone } from '@/lib/validators';
import { colors, radius, spacing, typography } from '@/theme';
import type { BusinessCategory, UserRole } from '@/types';
import { humanizeAuthError } from './login';

const CATEGORIES: BusinessCategory[] = [
  'erkek_berberi',
  'kadin_kuaforu',
  'guzellik_merkezi',
  'barber_shop',
];

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [accountType, setAccountType] = useState<UserRole>('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState<BusinessCategory>('erkek_berberi');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isBusiness = accountType === 'business';

  async function onSubmit() {
    setError(null);
    if (!name || !email || !password) {
      setError('Ad, e-posta ve şifre gereklidir.');
      return;
    }
    if (isBusiness && !businessName.trim()) {
      setError('İşletme adı gereklidir.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Geçerli bir e-posta adresi gir.');
      return;
    }
    if (phone.trim() && !isValidPhone(phone)) {
      setError('Geçerli bir telefon numarası gir.');
      return;
    }
    if (!isValidPassword(password)) {
      setError(PASSWORD_RULE);
      return;
    }
    setLoading(true);
    try {
      await signUp({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        accountType,
        businessName: businessName.trim(),
        businessCategory,
      });
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
            <View style={styles.typeRow}>
              {(
                [
                  { key: 'user', label: 'Müşteri', icon: 'person-outline' },
                  { key: 'business', label: 'İşletme', icon: 'storefront-outline' },
                ] as const
              ).map((t) => {
                const active = accountType === t.key;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => setAccountType(t.key)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.typeBtn, active && styles.typeBtnActive]}
                  >
                    <Ionicons name={t.icon} size={18} color={active ? colors.onGold : colors.textMuted} />
                    <Text style={[styles.typeText, active && styles.typeTextActive]}>{t.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {isBusiness ? (
              <>
                <Field
                  label="İşletme adı"
                  icon="storefront-outline"
                  placeholder="Örn. Altın Berber"
                  value={businessName}
                  onChangeText={setBusinessName}
                />
                <View>
                  <Text style={styles.catLabel}>Kategori</Text>
                  <View style={styles.catRow}>
                    {CATEGORIES.map((c) => {
                      const active = businessCategory === c;
                      return (
                        <Pressable
                          key={c}
                          onPress={() => setBusinessCategory(c)}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          style={[styles.catChip, active && styles.catChipActive]}
                        >
                          <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                            {categoryLabels[c]}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
                <View style={styles.bizNote}>
                  <Ionicons name="information-circle-outline" size={15} color={colors.gold} />
                  <Text style={styles.bizNoteText}>
                    Kaydından sonra işletmen admin onayına düşer; onaylanınca Keşfet'te
                    görünür. Hizmetlerini "İşletmem" sekmesinden ekleyebilirsin.
                  </Text>
                </View>
              </>
            ) : null}

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
              label="Telefon (isteğe bağlı)"
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
              placeholder="En az 8 karakter"
              value={password}
              onChangeText={setPassword}
            />
            <Text style={styles.hint}>{PASSWORD_RULE}</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              label={isBusiness ? 'İşletme Hesabı Oluştur' : 'Kayıt Ol'}
              onPress={onSubmit}
              loading={loading}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Zaten hesabın var mı?</Text>
            <Link href="/(auth)/login" style={styles.link}>
              Giriş Yap
            </Link>
          </View>

          <Button
            label="Hesapsız Devam Et"
            variant="secondary"
            icon="compass-outline"
            onPress={() => router.replace('/(tabs)')}
          />
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
  typeRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: 9,
  },
  typeBtnActive: { backgroundColor: colors.gold },
  typeText: { ...typography.bodyStrong, color: colors.textMuted },
  typeTextActive: { color: colors.onGold },
  catLabel: { ...typography.caption, color: colors.textMuted, marginLeft: spacing.xs, marginBottom: spacing.xs },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  catChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  catChipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  catChipText: { ...typography.caption, color: colors.textMuted },
  catChipTextActive: { color: colors.onGold, fontWeight: '700' },
  bizNote: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  bizNoteText: { ...typography.caption, color: colors.textMuted, flex: 1, lineHeight: 18 },
  hint: { ...typography.caption, color: colors.textMuted, marginLeft: spacing.xs, marginTop: -spacing.xs, lineHeight: 18 },
  error: { ...typography.caption, color: colors.danger, marginLeft: spacing.xs },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs },
  footerText: { ...typography.body, color: colors.textMuted },
  link: { ...typography.bodyStrong, color: colors.gold },
});
