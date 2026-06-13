import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
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
import { centeredContent, colors, radius, spacing, typography } from '@/theme';

export default function ProfileScreen() {
  const { profile, signOut, updateProfile } = useAuth();
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

  async function onSignOut() {
    await signOut();
    router.replace('/(auth)/login');
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
});
