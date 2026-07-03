import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Avatar, Button, Card, Field } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { isFirebaseEnabled } from '@/lib/firebase';
import { PASSWORD_RULE, isValidPassword } from '@/lib/validators';
import { centeredContent, colors, radius, spacing, typography } from '@/theme';

export default function ProfileScreen() {
  const { profile, signOut, updateProfile, deleteAccount, changePassword } = useAuth();
  const router = useRouter();

  const roleMeta =
    profile?.role === 'admin'
      ? { label: 'Admin', icon: 'shield-checkmark-outline' as const }
      : profile?.role === 'business'
        ? { label: 'İşletme', icon: 'storefront-outline' as const }
        : { label: 'Müşteri', icon: 'person-outline' as const };

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [delPw, setDelPw] = useState('');
  const [delError, setDelError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwDone, setPwDone] = useState(false);

  async function onSignOut() {
    await signOut();
    router.replace('/(auth)/login');
  }

  async function confirmDelete() {
    setDelError(null);
    if (isFirebaseEnabled && !delPw.trim()) {
      setDelError('Devam etmek için şifreni gir.');
      return;
    }
    setDeleting(true);
    try {
      await deleteAccount(delPw);
      setDeleteOpen(false);
      router.replace('/(auth)/login');
    } catch (e: any) {
      const code = e?.code as string | undefined;
      setDelError(
        code === 'auth/invalid-credential' ||
          code === 'auth/wrong-password'
          ? 'Şifre hatalı.'
          : code === 'auth/requires-recent-login'
            ? 'Güvenlik için tekrar giriş yapıp dene.'
            : 'Hesap silinemedi. Lütfen tekrar dene.',
      );
    } finally {
      setDeleting(false);
    }
  }

  function openChangePassword() {
    setCurPw('');
    setNewPw('');
    setNewPw2('');
    setPwError(null);
    setPwDone(false);
    setPwOpen(true);
  }

  async function confirmChangePassword() {
    setPwError(null);
    if (!curPw.trim()) {
      setPwError('Mevcut şifreni gir.');
      return;
    }
    if (!isValidPassword(newPw)) {
      setPwError(PASSWORD_RULE);
      return;
    }
    if (newPw !== newPw2) {
      setPwError('Yeni şifreler eşleşmiyor.');
      return;
    }
    if (newPw === curPw) {
      setPwError('Yeni şifre mevcut şifreden farklı olmalı.');
      return;
    }
    setPwSaving(true);
    try {
      await changePassword(curPw, newPw);
      setPwDone(true);
    } catch (e: any) {
      const code = e?.code as string | undefined;
      setPwError(
        code === 'auth/invalid-credential' || code === 'auth/wrong-password'
          ? 'Mevcut şifre hatalı.'
          : code === 'auth/requires-recent-login'
            ? 'Güvenlik için tekrar giriş yapıp dene.'
            : code === 'auth/weak-password'
              ? PASSWORD_RULE
              : 'Şifre değiştirilemedi. Lütfen tekrar dene.',
      );
    } finally {
      setPwSaving(false);
    }
  }

  function openEdit() {
    setName(profile?.name ?? '');
    setPhone(profile?.phone ?? '');
    setEditing(true);
  }

  async function saveEdit() {
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim() || null });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  // Guests browse without an account (App Store 5.1.1). Show a sign-in prompt
  // plus the public legal/help links instead of account management.
  if (!profile) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profil</Text>

        <Card style={styles.guestCard}>
          <Avatar name="Misafir" size={64} />
          <Text style={styles.guestTitle}>Misafir olarak geziyorsun</Text>
          <Text style={styles.guestSub}>
            Randevu almak, favorilere eklemek ve sadakat puanı kazanmak için giriş yap.
          </Text>
          <View style={{ width: '100%', gap: spacing.sm, marginTop: spacing.sm }}>
            <Button label="Giriş Yap" icon="log-in-outline" onPress={() => router.push('/(auth)/login')} />
            <Button label="Kayıt Ol" variant="secondary" icon="person-add-outline" onPress={() => router.push('/(auth)/register')} />
          </View>
        </Card>

        <View style={styles.menu}>
          <MenuRow icon="lock-closed-outline" label="Gizlilik Politikası" onPress={() => router.push('/legal/privacy')} />
          <MenuRow icon="document-text-outline" label="Kullanım Koşulları" onPress={() => router.push('/legal/terms')} />
          <MenuRow icon="help-circle-outline" label="Yardım & Destek" onPress={() => Linking.openURL('mailto:ahmetdemirexhesap@gmail.com')} />
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
      </ScrollView>
    );
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
        <Pressable
          onPress={openEdit}
          hitSlop={8}
          style={styles.editIcon}
          accessibilityRole="button"
          accessibilityLabel="Profili düzenle"
        >
          <Ionicons name="create-outline" size={20} color={colors.gold} />
        </Pressable>
      </Card>

      <View style={styles.roleCard}>
        <View style={styles.roleHeader}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.gold} />
          <Text style={styles.roleTitle}>Hesap Türü</Text>
        </View>
        <View style={styles.roleBadge}>
          <Ionicons name={roleMeta.icon} size={16} color={colors.gold} />
          <Text style={styles.roleBadgeText}>{roleMeta.label}</Text>
        </View>
        <Text style={styles.roleHint}>
          Hesap türü kayıt sırasında belirlenir. Değiştirmek için destek ile iletişime geç.
        </Text>
      </View>

      <View style={styles.menu}>
        <MenuRow icon="heart-outline" label="Favorilerim" onPress={() => router.push('/favorites')} />
        {isFirebaseEnabled ? (
          <MenuRow icon="key-outline" label="Şifre Değiştir" onPress={openChangePassword} />
        ) : null}
        <MenuRow icon="lock-closed-outline" label="Gizlilik Politikası" onPress={() => router.push('/legal/privacy')} />
        <MenuRow icon="document-text-outline" label="Kullanım Koşulları" onPress={() => router.push('/legal/terms')} />
        <MenuRow icon="help-circle-outline" label="Yardım & Destek" onPress={() => Linking.openURL('mailto:ahmetdemirexhesap@gmail.com')} />
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

      <Pressable
        onPress={() => {
          setDelPw('');
          setDelError(null);
          setDeleteOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel="Hesabımı sil"
        style={({ pressed }) => [styles.deleteLink, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="trash-outline" size={16} color={colors.danger} />
        <Text style={styles.deleteLinkText}>Hesabımı Sil</Text>
      </Pressable>

      <Modal visible={deleteOpen} transparent animationType="fade" onRequestClose={() => setDeleteOpen(false)}>
        <View style={[styles.overlay, { justifyContent: 'center', alignItems: 'center', padding: spacing.xl }]}>
          <View style={styles.deleteDialog}>
            <Ionicons name="warning-outline" size={28} color={colors.danger} />
            <Text style={styles.sheetTitle}>Hesabını sil?</Text>
            <Text style={styles.deleteText}>
              Bu işlem geri alınamaz. Hesabın ve profil bilgilerin kalıcı olarak silinir.
            </Text>
            {isFirebaseEnabled ? (
              <View style={{ width: '100%', marginTop: spacing.sm }}>
                <Field
                  label="Şifreni doğrula"
                  value={delPw}
                  onChangeText={setDelPw}
                  secureTextEntry
                  icon="lock-closed-outline"
                  placeholder="Mevcut şifren"
                />
              </View>
            ) : null}
            {delError ? <Text style={styles.deleteError}>{delError}</Text> : null}
            <View style={styles.sheetActions}>
              <View style={{ flex: 1 }}>
                <Button label="Vazgeç" variant="secondary" onPress={() => setDeleteOpen(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Sil" variant="danger" loading={deleting} onPress={confirmDelete} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={pwOpen} transparent animationType="fade" onRequestClose={() => setPwOpen(false)}>
        <View style={[styles.overlay, { justifyContent: 'center', alignItems: 'center', padding: spacing.xl }]}>
          <View style={styles.deleteDialog}>
            {pwDone ? (
              <>
                <Ionicons name="checkmark-circle-outline" size={30} color={colors.gold} />
                <Text style={styles.sheetTitle}>Şifren güncellendi</Text>
                <Text style={styles.deleteText}>
                  Yeni şifren aktif. Bir sonraki girişte yeni şifreni kullan.
                </Text>
                <View style={{ width: '100%', marginTop: spacing.sm }}>
                  <Button label="Tamam" onPress={() => setPwOpen(false)} />
                </View>
              </>
            ) : (
              <>
                <Ionicons name="key-outline" size={28} color={colors.gold} />
                <Text style={styles.sheetTitle}>Şifre Değiştir</Text>
                <View style={{ width: '100%', gap: spacing.md, marginTop: spacing.sm }}>
                  <Field
                    label="Mevcut şifre"
                    value={curPw}
                    onChangeText={setCurPw}
                    secureTextEntry
                    icon="lock-closed-outline"
                    placeholder="Mevcut şifren"
                  />
                  <Field
                    label="Yeni şifre"
                    value={newPw}
                    onChangeText={setNewPw}
                    secureTextEntry
                    icon="lock-closed-outline"
                    placeholder="En az 8 karakter"
                  />
                  <Field
                    label="Yeni şifre (tekrar)"
                    value={newPw2}
                    onChangeText={setNewPw2}
                    secureTextEntry
                    icon="lock-closed-outline"
                    placeholder="Yeni şifreyi tekrar gir"
                  />
                  <Text style={styles.pwHint}>{PASSWORD_RULE}</Text>
                </View>
                {pwError ? <Text style={styles.deleteError}>{pwError}</Text> : null}
                <View style={styles.sheetActions}>
                  <View style={{ flex: 1 }}>
                    <Button label="Vazgeç" variant="secondary" onPress={() => setPwOpen(false)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button label="Güncelle" loading={pwSaving} onPress={confirmChangePassword} />
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={editing} transparent animationType="slide" onRequestClose={() => setEditing(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Profili Düzenle</Text>
            <Field label="Ad Soyad" value={name} onChangeText={setName} icon="person-outline" />
            <Field
              label="Telefon"
              value={phone}
              onChangeText={setPhone}
              icon="call-outline"
              keyboardType="phone-pad"
              placeholder="05xx xxx xx xx"
            />
            <View style={styles.sheetActions}>
              <View style={{ flex: 1 }}>
                <Button label="Vazgeç" variant="secondary" onPress={() => setEditing(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Kaydet" loading={saving} disabled={!name.trim()} onPress={saveEdit} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl, ...centeredContent },
  title: { ...typography.title, color: colors.text, marginTop: spacing.md },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  guestCard: { alignItems: 'center', gap: spacing.sm },
  guestTitle: { ...typography.heading, color: colors.text, textAlign: 'center', marginTop: spacing.sm },
  guestSub: { ...typography.caption, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  editIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.gold + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  sheetActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  name: { ...typography.heading, color: colors.text },
  email: { ...typography.caption, color: colors.textMuted, marginTop: 1 },
  roleCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  roleHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  roleTitle: { ...typography.bodyStrong, color: colors.text },
  roleHint: { ...typography.caption, color: colors.textMuted },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: colors.gold + '1A',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gold + '55',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
  },
  roleBadgeText: { ...typography.bodyStrong, color: colors.gold },
  roleSegment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 4,
    marginTop: spacing.xs,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: 9,
  },
  roleBtnActive: { backgroundColor: colors.gold },
  roleBtnText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  roleBtnTextActive: { color: colors.onGold },
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
  deleteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
  },
  deleteLinkText: { ...typography.caption, color: colors.danger, fontWeight: '700' },
  deleteDialog: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    maxWidth: 360,
  },
  deleteText: { ...typography.caption, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  deleteError: { ...typography.caption, color: colors.danger, marginTop: spacing.xs, textAlign: 'center' },
  pwHint: { ...typography.caption, color: colors.textMuted, lineHeight: 18, marginLeft: spacing.xs },
});
