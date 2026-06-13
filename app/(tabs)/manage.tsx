import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Badge, Button, EmptyState, Field, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import {
  useAddBusinessPhoto,
  useBusiness,
  useCreateService,
  useDeleteService,
  useRemoveBusinessPhoto,
  useServices,
  useUpdateBusiness,
  useUpdateService,
} from '@/hooks/queries';
import { isStorageEnabled } from '@/lib/firebase';
import { formatDate, formatDuration, formatPrice } from '@/lib/format';
import { notifyError, notifySuccess } from '@/lib/haptics';
import { DAY_ORDER, DAY_SHORT, defaultHours, getDayHours } from '@/lib/hours';
import { isValidPhone } from '@/lib/validators';
import { centeredContent, colors, elevation, radius, spacing, typography } from '@/theme';
import type { DayHours } from '@/types';

/** Monthly listing fee (₺). Configurable; real charge runs via the provider. */
const MONTHLY_PRICE = 499;

type ServiceForm = {
  id?: string;
  name: string;
  durationMin: string;
  price: string;
};

export default function ManageScreen() {
  const { profile } = useAuth();
  const businessId = profile?.businessId ?? '';
  const { data: business } = useBusiness(businessId);
  const { data: services } = useServices(businessId);

  const updateBusiness = useUpdateBusiness(businessId);
  const createService = useCreateService(businessId);
  const updateService = useUpdateService(businessId);
  const deleteService = useDeleteService(businessId);

  const [editProfile, setEditProfile] = useState(false);
  const [subInfo, setSubInfo] = useState(false);
  const subActive = business?.subscriptionStatus === 'active';
  const [serviceForm, setServiceForm] = useState<ServiceForm | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!businessId) {
    return (
      <Screen>
        <EmptyState
          icon="storefront-outline"
          title="İşletme bulunamadı"
          subtitle="Profil sekmesinden İşletme moduna geçtiğinden emin ol."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>İşletmem</Text>

        {/* Business profile */}
        {editProfile && business ? (
          <ProfileEditor
            initial={business}
            saving={updateBusiness.isPending}
            onCancel={() => setEditProfile(false)}
            onSave={(patch) =>
              updateBusiness.mutate(patch, { onSuccess: () => setEditProfile(false) })
            }
          />
        ) : (
          <View style={[styles.card, elevation.soft]}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>{business?.name ?? 'İşletme'}</Text>
              <Pressable
                onPress={() => setEditProfile(true)}
                hitSlop={8}
                style={styles.editBtn}
                accessibilityRole="button"
                accessibilityLabel="İşletme bilgilerini düzenle"
              >
                <Ionicons name="create-outline" size={16} color={colors.gold} />
                <Text style={styles.editText}>Düzenle</Text>
              </Pressable>
            </View>
            {business?.about ? <Text style={styles.about}>{business.about}</Text> : null}
            <InfoLine icon="call-outline" text={business?.phone ?? '—'} />
            <InfoLine
              icon="time-outline"
              text={
                business
                  ? (() => {
                      const t = getDayHours(business, new Date().getDay());
                      return `${t.closed ? 'Bugün kapalı' : `Bugün ${t.open}–${t.close}`} · ${business.slotMinutes ?? 30} dk slot`;
                    })()
                  : '--'
              }
            />
            <InfoLine icon="location-outline" text={business?.district ?? '—'} />
          </View>
        )}

        {/* Subscription */}
        <View style={[styles.card, elevation.soft, { gap: spacing.sm }]}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Listeleme Aboneliği</Text>
            <Badge
              label={subActive ? 'Aktif' : 'Pasif'}
              color={subActive ? colors.approved : colors.cancelled}
            />
          </View>
          <Text style={styles.subPrice}>{formatPrice(MONTHLY_PRICE)}/ay</Text>
          <Text style={styles.subDesc}>
            {subActive
              ? `Aboneliğin aktif.${
                  business?.subscriptionEnd
                    ? ` Dönem sonu: ${formatDate(business.subscriptionEnd)}.`
                    : ''
                }`
              : 'İşletmenin Keşfet’te listelenmesi için aktif abonelik + admin onayı gerekir.'}
          </Text>
          <Button
            label={subActive ? 'Aboneliği Yönet' : 'Aboneliği Başlat'}
            icon="card-outline"
            variant={subActive ? 'secondary' : 'primary'}
            onPress={() => setSubInfo(true)}
          />
        </View>

        {/* Photo gallery */}
        {business ? <PhotoManager businessId={businessId} photos={business.photos ?? []} /> : null}

        {/* Services */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Hizmetler</Text>
          <Pressable
            onPress={() => setServiceForm({ name: '', durationMin: '30', price: '' })}
            style={styles.addBtn}
            hitSlop={8}
          >
            <Ionicons name="add" size={18} color={colors.onGold} />
            <Text style={styles.addText}>Ekle</Text>
          </Pressable>
        </View>

        {(services ?? []).length === 0 ? (
          <EmptyState
            icon="cut-outline"
            title="Henüz hizmet yok"
            subtitle="İlk hizmetini ekleyerek randevu almaya başla."
            actionLabel="Hizmet Ekle"
            actionIcon="add"
            onAction={() => setServiceForm({ name: '', durationMin: '30', price: '' })}
          />
        ) : (
          <View style={{ gap: spacing.md }}>
            {(services ?? []).map((s) => (
              <View key={s.id} style={[styles.serviceRow, elevation.soft]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceName}>{s.name}</Text>
                  <Text style={styles.serviceMeta}>
                    {formatDuration(s.durationMin)} · {formatPrice(s.price)}
                  </Text>
                </View>
                <Pressable
                  onPress={() =>
                    setServiceForm({
                      id: s.id,
                      name: s.name,
                      durationMin: String(s.durationMin),
                      price: String(s.price),
                    })
                  }
                  hitSlop={8}
                  style={styles.iconBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`${s.name} hizmetini düzenle`}
                >
                  <Ionicons name="create-outline" size={20} color={colors.textMuted} />
                </Pressable>
                <Pressable
                  onPress={() => setDeleteId(s.id)}
                  hitSlop={8}
                  style={styles.iconBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`${s.name} hizmetini sil`}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add / edit service modal */}
      <ServiceFormModal
        form={serviceForm}
        saving={createService.isPending || updateService.isPending}
        onChange={setServiceForm}
        onClose={() => setServiceForm(null)}
        onSubmit={(f) => {
          const payload = {
            name: f.name.trim(),
            durationMin: Math.max(5, parseInt(f.durationMin, 10) || 0),
            price: Math.max(0, parseInt(f.price, 10) || 0),
          };
          if (f.id) {
            updateService.mutate({ id: f.id, ...payload }, { onSuccess: () => setServiceForm(null) });
          } else {
            createService.mutate(payload, { onSuccess: () => setServiceForm(null) });
          }
        }}
      />

      {/* Delete confirm modal */}
      <Modal visible={deleteId != null} transparent animationType="fade" onRequestClose={() => setDeleteId(null)}>
        <View style={styles.overlayCenter}>
          <View style={styles.dialog}>
            <Ionicons name="trash-outline" size={28} color={colors.danger} />
            <Text style={styles.dialogTitle}>Hizmeti sil?</Text>
            <Text style={styles.dialogText}>Bu hizmet kalıcı olarak silinecek.</Text>
            <View style={styles.dialogActions}>
              <View style={{ flex: 1 }}>
                <Button label="Vazgeç" variant="secondary" onPress={() => setDeleteId(null)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Sil"
                  variant="danger"
                  loading={deleteService.isPending}
                  onPress={() => {
                    if (deleteId)
                      deleteService.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={subInfo} transparent animationType="fade" onRequestClose={() => setSubInfo(false)}>
        <View style={styles.overlayCenter}>
          <View style={styles.dialog}>
            <Ionicons name="card-outline" size={28} color={colors.gold} />
            <Text style={styles.dialogTitle}>Listeleme Aboneliği</Text>
            <Text style={styles.dialogText}>
              {formatPrice(MONTHLY_PRICE)}/ay ile işletmen Keşfet’te listelenir
              (aktif abonelik + admin onayı gerekir).
              {'\n\n'}
              Online kredi kartı ödemesi yakında aktif olacak (ödeme sağlayıcısı
              entegrasyonu). Şu an için aboneliği admin sizin için tanımlayabilir.
            </Text>
            <View style={{ width: '100%', marginTop: spacing.sm }}>
              <Button label="Tamam" onPress={() => setSubInfo(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function PhotoManager({ businessId, photos }: { businessId: string; photos: string[] }) {
  const addPhoto = useAddBusinessPhoto(businessId);
  const removePhoto = useRemoveBusinessPhoto(businessId);
  const [error, setError] = useState<string | null>(null);

  async function pick() {
    setError(null);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setError('Galeriye erişim izni gerekiyor.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (res.canceled || !res.assets?.[0]) return;
      await addPhoto.mutateAsync(res.assets[0].uri);
      notifySuccess();
    } catch (e: any) {
      notifyError();
      setError(
        e?.name === 'StorageDisabledError'
          ? 'Fotoğraf yükleme için Firebase Storage etkinleştirilmeli.'
          : 'Fotoğraf yüklenemedi. Lütfen tekrar dene.',
      );
    }
  }

  return (
    <View style={[styles.card, elevation.soft, { gap: spacing.sm }]}>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>Galeri</Text>
        <Badge label={`${photos.length} foto`} />
      </View>
      {photos.length === 0 ? (
        <Text style={styles.subDesc}>
          İşletmenden kareler ekle; müşteriler detay sayfasında görsün.
        </Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {photos.map((uri) => (
            <View key={uri} style={styles.photoWrap}>
              <Image source={{ uri }} style={styles.photoThumb} contentFit="cover" transition={150} />
              <Pressable
                onPress={() => removePhoto.mutate(uri)}
                style={styles.photoRemove}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Fotoğrafı kaldır"
              >
                <Ionicons name="close" size={14} color="#fff" />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
      {!isStorageEnabled ? (
        <View style={styles.storageNote}>
          <Ionicons name="information-circle-outline" size={15} color={colors.gold} />
          <Text style={styles.storageNoteText}>
            Yükleme için Firebase Storage gerekli. Etkinleştirilince butona basıp ekleyebilirsin.
          </Text>
        </View>
      ) : null}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
      <Button
        label="Fotoğraf Ekle"
        icon="image-outline"
        variant="secondary"
        loading={addPhoto.isPending}
        onPress={pick}
      />
    </View>
  );
}

function InfoLine({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.infoLine}>
      <Ionicons name={icon} size={16} color={colors.gold} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

function ProfileEditor({
  initial,
  saving,
  onSave,
  onCancel,
}: {
  initial: {
    name: string;
    about: string;
    phone: string;
    district: string;
    openingTime: string;
    closingTime: string;
    hours?: DayHours[];
    slotMinutes?: number;
    cancelWindowHours?: number;
  };
  saving: boolean;
  onSave: (patch: {
    name: string;
    about: string;
    phone: string;
    district: string;
    openingTime: string;
    closingTime: string;
    hours: DayHours[];
    slotMinutes: number;
    cancelWindowHours: number;
  }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [about, setAbout] = useState(initial.about);
  const [phone, setPhone] = useState(initial.phone);
  const [district, setDistrict] = useState(initial.district);
  const [hours, setHours] = useState<DayHours[]>(
    initial.hours ??
      defaultHours(initial.openingTime || '09:00', initial.closingTime || '20:00'),
  );
  const [slotMinutes, setSlotMinutes] = useState(initial.slotMinutes ?? 30);
  const [cancelWindowHours, setCancelWindowHours] = useState(initial.cancelWindowHours ?? 2);
  const phoneValid = isValidPhone(phone);

  const setDay = (i: number, patch: Partial<DayHours>) =>
    setHours((h) => h.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  return (
    <View style={[styles.card, elevation.soft, { gap: spacing.md }]}>
      <Text style={styles.cardTitle}>İşletme Bilgileri</Text>
      <Field label="İşletme adı" value={name} onChangeText={setName} icon="storefront-outline" />
      <Field label="Hakkında" value={about} onChangeText={setAbout} multiline />
      <Field label="Telefon" value={phone} onChangeText={setPhone} icon="call-outline" keyboardType="phone-pad" />
      {!phoneValid ? (
        <Text style={styles.fieldError}>Geçerli bir telefon numarası gir.</Text>
      ) : null}
      <Field label="İlçe / Bölge" value={district} onChangeText={setDistrict} icon="location-outline" placeholder="Nilüfer" />

      <View>
        <Text style={styles.slotLabel}>Çalışma saatleri (güne özel)</Text>
        <View style={{ gap: spacing.xs }}>
          {DAY_ORDER.map((i) => {
            const d = hours[i];
            return (
              <View key={i} style={styles.dayHourRow}>
                <Text style={styles.dayHourLabel}>{DAY_SHORT[i]}</Text>
                <Pressable
                  onPress={() => setDay(i, { closed: !d.closed })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: !d.closed }}
                  style={[styles.dayToggle, d.closed ? styles.dayToggleClosed : styles.dayToggleOpen]}
                >
                  <Text style={d.closed ? styles.dayToggleClosedText : styles.dayToggleOpenText}>
                    {d.closed ? 'Kapalı' : 'Açık'}
                  </Text>
                </Pressable>
                {d.closed ? (
                  <Text style={styles.dayHourMuted}>—</Text>
                ) : (
                  <View style={styles.dayTimeWrap}>
                    <TextInput
                      value={d.open}
                      onChangeText={(v) => setDay(i, { open: v })}
                      placeholder="09:00"
                      placeholderTextColor={colors.textFaint}
                      style={styles.dayTime}
                      maxLength={5}
                    />
                    <Text style={styles.dayDash}>–</Text>
                    <TextInput
                      value={d.close}
                      onChangeText={(v) => setDay(i, { close: v })}
                      placeholder="20:00"
                      placeholderTextColor={colors.textFaint}
                      style={styles.dayTime}
                      maxLength={5}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
      <View>
        <Text style={styles.slotLabel}>Randevu aralığı (dakika)</Text>
        <View style={styles.slotRow}>
          {[15, 30, 45, 60].map((m) => {
            const active = slotMinutes === m;
            return (
              <Pressable
                key={m}
                onPress={() => setSlotMinutes(m)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.slotChip, active && styles.slotChipActive]}
              >
                <Text style={[styles.slotChipText, active && styles.slotChipTextActive]}>
                  {m} dk
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View>
        <Text style={styles.slotLabel}>İptal penceresi (son ne kadar kala iptal edilemez)</Text>
        <View style={styles.slotRow}>
          {[0, 1, 2, 4, 24].map((h) => {
            const active = cancelWindowHours === h;
            return (
              <Pressable
                key={h}
                onPress={() => setCancelWindowHours(h)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.slotChip, active && styles.slotChipActive]}
              >
                <Text style={[styles.slotChipText, active && styles.slotChipTextActive]}>
                  {h === 0 ? 'Yok' : `${h} sa`}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={styles.dialogActions}>
        <View style={{ flex: 1 }}>
          <Button label="Vazgeç" variant="secondary" onPress={onCancel} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label="Kaydet"
            loading={saving}
            disabled={!name.trim() || !phoneValid}
            onPress={() => {
              const cleaned = hours.map((d) => ({
                open: d.open.trim() || '09:00',
                close: d.close.trim() || '20:00',
                closed: d.closed,
              }));
              const firstOpen = cleaned.find((d) => !d.closed);
              onSave({
                name: name.trim(),
                about: about.trim(),
                phone: phone.trim(),
                district: district.trim(),
                hours: cleaned,
                openingTime: firstOpen?.open ?? '09:00',
                closingTime: firstOpen?.close ?? '20:00',
                slotMinutes,
                cancelWindowHours,
              });
            }}
          />
        </View>
      </View>
    </View>
  );
}

function ServiceFormModal({
  form,
  saving,
  onChange,
  onSubmit,
  onClose,
}: {
  form: ServiceForm | null;
  saving: boolean;
  onChange: (f: ServiceForm) => void;
  onSubmit: (f: ServiceForm) => void;
  onClose: () => void;
}) {
  // Controlled by the parent's `serviceForm` state — no internal copy to sync.
  const f = form ?? { name: '', durationMin: '30', price: '' };
  const valid =
    f.name.trim().length > 0 && Number(f.price) > 0 && Number(f.durationMin) > 0;

  return (
    <Modal visible={form != null} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.dialogTitle}>{form?.id ? 'Hizmeti Düzenle' : 'Yeni Hizmet'}</Text>
          <Field
            label="Hizmet adı"
            value={f.name}
            onChangeText={(v) => onChange({ ...f, name: v })}
            icon="cut-outline"
            placeholder="Saç Kesimi"
          />
          <View style={styles.hourRow}>
            <View style={{ flex: 1 }}>
              <Field
                label="Süre (dk)"
                value={f.durationMin}
                onChangeText={(v) => onChange({ ...f, durationMin: v.replace(/[^0-9]/g, '') })}
                keyboardType="number-pad"
                placeholder="30"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Fiyat (₺)"
                value={f.price}
                onChangeText={(v) => onChange({ ...f, price: v.replace(/[^0-9]/g, '') })}
                keyboardType="number-pad"
                placeholder="350"
              />
            </View>
          </View>
          <View style={styles.dialogActions}>
            <View style={{ flex: 1 }}>
              <Button label="Vazgeç" variant="secondary" onPress={onClose} />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label="Kaydet"
                loading={saving}
                disabled={!valid}
                onPress={() => onSubmit(f)}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl, ...centeredContent },
  title: { ...typography.title, color: colors.text, marginTop: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subPrice: { ...typography.title, color: colors.gold },
  subDesc: { ...typography.caption, color: colors.textMuted, lineHeight: 18 },
  cardTitle: { ...typography.heading, color: colors.text },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editText: { ...typography.caption, color: colors.gold, fontWeight: '600' },
  about: { ...typography.body, color: colors.textMuted, lineHeight: 21 },
  infoLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  infoText: { ...typography.caption, color: colors.textMuted },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...typography.heading, color: colors.text },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  addText: { ...typography.caption, color: colors.onGold, fontWeight: '700' },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  serviceName: { ...typography.bodyStrong, color: colors.text },
  serviceMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  iconBtn: { padding: 4 },
  hourRow: { flexDirection: 'row', gap: spacing.md },
  dayHourRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dayHourLabel: { ...typography.bodyStrong, color: colors.text, width: 40 },
  dayToggle: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dayToggleOpen: { backgroundColor: colors.gold + '1A', borderColor: colors.gold + '66' },
  dayToggleClosed: { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
  dayToggleOpenText: { ...typography.caption, color: colors.goldDeep, fontWeight: '700' },
  dayToggleClosedText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  dayTimeWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'flex-end' },
  dayTime: {
    width: 58,
    textAlign: 'center',
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    color: colors.text,
    ...typography.caption,
  },
  dayDash: { color: colors.textFaint },
  dayHourMuted: { ...typography.caption, color: colors.textFaint, flex: 1, textAlign: 'right' },
  slotLabel: { ...typography.caption, color: colors.textMuted, marginLeft: spacing.xs, marginBottom: spacing.xs },
  fieldError: { ...typography.caption, color: colors.danger, marginLeft: spacing.xs, marginTop: -spacing.xs },
  photoWrap: { position: 'relative' },
  photoThumb: {
    width: 120,
    height: 90,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  photoRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storageNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.gold + '12',
    borderRadius: 10,
    padding: spacing.sm,
  },
  storageNoteText: { ...typography.caption, color: colors.textMuted, flex: 1, lineHeight: 18 },
  slotRow: { flexDirection: 'row', gap: spacing.sm },
  slotChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  slotChipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  slotChipText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  slotChipTextActive: { color: colors.onGold },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  overlayCenter: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    margin: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'center',
    maxWidth: 360,
    width: '88%',
  },
  dialogTitle: { ...typography.heading, color: colors.text, textAlign: 'center' },
  dialogText: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  dialogActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm, width: '100%' },
});
