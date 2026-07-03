import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import LeafletMap from '@/components/LeafletMap';
import { Badge, Button, EmptyState, Field, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useUserLocation } from '@/context/LocationContext';
import {
  useAddBusinessPhoto,
  useBusiness,
  useCreateEmployee,
  useCreateService,
  useDeleteEmployee,
  useDeleteService,
  useEmployees,
  useRemoveApprovedPhoto,
  useRemovePendingPhoto,
  useServices,
  useUpdateBusiness,
  useUpdateEmployee,
  useUpdateService,
} from '@/hooks/queries';
import { isStorageEnabled } from '@/lib/firebase';
import { formatDate, formatDuration, formatPrice } from '@/lib/format';
import { DEFAULT_CENTER, hasLocation, type LatLng } from '@/lib/geo';
import { notifyError, notifySuccess } from '@/lib/haptics';
import { DAY_ORDER, DAY_SHORT, defaultHours, getDayHours } from '@/lib/hours';
import { isValidPhone } from '@/lib/validators';
import { centeredContent, colors, elevation, radius, spacing, typography } from '@/theme';
import type { DayHours } from '@/types';

type ServiceForm = {
  id?: string;
  name: string;
  durationMin: string;
  price: string;
};

type EmployeeForm = {
  id?: string;
  name: string;
  title: string;
  active: boolean;
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
  const approved = !!business?.approved;
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

        {/* Listing status — free, admin-approval only (no payment) */}
        <View style={[styles.card, elevation.soft, { gap: spacing.sm }]}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Yayın Durumu</Text>
            <Badge
              label={approved ? 'Yayında' : 'İncelemede'}
              color={approved ? colors.approved : colors.pending}
            />
          </View>
          <Text style={styles.subDesc}>
            {approved
              ? 'İşletmen Keşfet’te yayında. Listeleme ücretsizdir.'
              : 'İşletmen yönetici onayı bekliyor. Onaylanınca Keşfet’te ücretsiz olarak yayınlanır. Hizmetlerini ve bilgilerini eksiksiz doldurman onayı hızlandırır.'}
          </Text>
        </View>

        {/* Photo gallery */}
        {business ? (
          <PhotoManager
            businessId={businessId}
            photos={business.photos ?? []}
            pendingPhotos={business.pendingPhotos ?? []}
          />
        ) : null}

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

        {/* Employees / staff */}
        <EmployeesSection businessId={businessId} />
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

    </Screen>
  );
}

/** Maps a thrown upload error to a Turkish message, including the raw code. */
function photoUploadError(name?: string, code?: string): string {
  if (name === 'StorageDisabledError') {
    return 'Firebase bağlı değil; fotoğraf yüklenemez.';
  }
  switch (code) {
    case 'storage/unauthorized':
      return 'Storage kuralları izin vermiyor. firebase/storage.rules dosyasını Console’da yayınla.';
    case 'storage/unauthenticated':
      return 'Oturum doğrulanamadı. Çıkış yapıp tekrar giriş yap.';
    case 'storage/bucket-not-found':
    case 'storage/project-not-found':
      return 'Cloud Storage etkin değil. Firebase Console → Storage → Başlat.';
    case 'storage/retry-limit-exceeded':
      return 'Ağ sorunu: yükleme zaman aşımına uğradı. Tekrar dene.';
    case 'storage/quota-exceeded':
      return 'Storage kotası dolu.';
    default:
      return `Fotoğraf yüklenemedi${code ? ` (${code})` : ''}. Lütfen tekrar dene.`;
  }
}

function PhotoManager({
  businessId,
  photos,
  pendingPhotos,
}: {
  businessId: string;
  photos: string[];
  pendingPhotos: string[];
}) {
  const addPhoto = useAddBusinessPhoto(businessId);
  const removePending = useRemovePendingPhoto(businessId);
  const removeApproved = useRemoveApprovedPhoto();
  const [error, setError] = useState<string | null>(null);
  // Fullscreen preview of a tapped photo.
  const [viewer, setViewer] = useState<string | null>(null);
  // A live (published) photo pending the owner's delete confirmation.
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

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
      const code: string | undefined = e?.code;
      setError(photoUploadError(e?.name, code));
    }
  }

  const total = photos.length + pendingPhotos.length;

  return (
    <View style={[styles.card, elevation.soft, { gap: spacing.sm }]}>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>Galeri</Text>
        <Badge label={`${total} foto`} />
      </View>

      <View style={styles.moderationNote}>
        <Ionicons name="shield-checkmark-outline" size={15} color={colors.gold} />
        <Text style={styles.storageNoteText}>
          Eklediğin fotoğraflar admin onayından sonra Keşfet’te yayınlanır.
        </Text>
      </View>

      {total === 0 ? (
        <Text style={styles.subDesc}>
          İşletmenden kareler ekle; onaylandığında müşteriler detay sayfasında görür.
        </Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {pendingPhotos.map((uri) => (
            <View key={uri} style={styles.photoWrap}>
              <Pressable onPress={() => setViewer(uri)} accessibilityRole="imagebutton" accessibilityLabel="Fotoğrafı tam ekran gör">
                <Image source={{ uri }} style={styles.photoThumb} contentFit="cover" transition={150} />
              </Pressable>
              <View style={styles.photoStatePending}>
                <Ionicons name="time-outline" size={11} color="#fff" />
                <Text style={styles.photoStateText}>Onay bekliyor</Text>
              </View>
              <Pressable
                onPress={() => removePending.mutate(uri)}
                style={styles.photoRemove}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Bekleyen fotoğrafı kaldır"
              >
                <Ionicons name="close" size={14} color="#fff" />
              </Pressable>
            </View>
          ))}
          {photos.map((uri) => (
            <View key={uri} style={styles.photoWrap}>
              <Pressable onPress={() => setViewer(uri)} accessibilityRole="imagebutton" accessibilityLabel="Fotoğrafı tam ekran gör">
                <Image source={{ uri }} style={styles.photoThumb} contentFit="cover" transition={150} />
              </Pressable>
              <View style={styles.photoStateLive}>
                <Ionicons name="checkmark-circle" size={11} color="#fff" />
                <Text style={styles.photoStateText}>Yayında</Text>
              </View>
              <Pressable
                onPress={() => setConfirmRemove(uri)}
                style={styles.photoRemove}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Yayındaki fotoğrafı sil"
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

      {/* Fullscreen photo viewer */}
      <Modal visible={viewer != null} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        <Pressable style={styles.viewerBackdrop} onPress={() => setViewer(null)}>
          {viewer ? (
            <Image source={{ uri: viewer }} style={styles.viewerImage} contentFit="contain" transition={150} />
          ) : null}
          <View style={styles.viewerClose}>
            <Ionicons name="close" size={22} color="#fff" />
          </View>
        </Pressable>
      </Modal>

      {/* Confirm deletion of a published photo */}
      <Modal
        visible={confirmRemove != null}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmRemove(null)}
      >
        <View style={styles.overlayCenter}>
          <View style={styles.dialog}>
            <Ionicons name="trash-outline" size={28} color={colors.danger} />
            <Text style={styles.dialogTitle}>Fotoğrafı sil?</Text>
            <Text style={styles.dialogText}>Bu fotoğraf galeriden kalıcı olarak kaldırılacak.</Text>
            <View style={styles.dialogActions}>
              <View style={{ flex: 1 }}>
                <Button label="Vazgeç" variant="secondary" onPress={() => setConfirmRemove(null)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Sil"
                  variant="danger"
                  loading={removeApproved.isPending}
                  onPress={() => {
                    if (confirmRemove)
                      removeApproved.mutate(
                        { businessId, url: confirmRemove },
                        { onSuccess: () => setConfirmRemove(null) },
                      );
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
    lat?: number | null;
    lng?: number | null;
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
    lat: number | null;
    lng: number | null;
  }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [about, setAbout] = useState(initial.about);
  const [phone, setPhone] = useState(initial.phone);
  const [district, setDistrict] = useState(initial.district);
  const [coords, setCoords] = useState<LatLng | null>(
    hasLocation({ lat: initial.lat, lng: initial.lng })
      ? { lat: initial.lat as number, lng: initial.lng as number }
      : null,
  );
  const [mapReload, setMapReload] = useState(0);
  const [locating, setLocating] = useState(false);
  const { request: requestLocation } = useUserLocation();
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
        <Text style={styles.slotLabel}>Konum (haritadan işaretle)</Text>
        <LeafletMap
          center={coords ?? DEFAULT_CENTER}
          showMarker={!!coords}
          interactive
          height={200}
          reloadKey={mapReload}
          onPick={setCoords}
        />
        <View style={styles.mapMetaRow}>
          <Text style={styles.mapCoordText}>
            {coords
              ? `📍 ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
              : 'Henüz konum seçilmedi'}
          </Text>
          <Pressable
            onPress={async () => {
              setLocating(true);
              const c = await requestLocation();
              setLocating(false);
              if (c) {
                setCoords(c);
                setMapReload((n) => n + 1);
              }
            }}
            style={styles.locateBtn}
            accessibilityRole="button"
            accessibilityLabel="Konumumu kullan"
          >
            <Ionicons
              name={locating ? 'sync-outline' : 'navigate-outline'}
              size={15}
              color={colors.gold}
            />
            <Text style={styles.locateBtnText}>
              {locating ? 'Bulunuyor…' : 'Konumumu kullan'}
            </Text>
          </Pressable>
        </View>
      </View>

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
                lat: coords?.lat ?? null,
                lng: coords?.lng ?? null,
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
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
      </KeyboardAvoidingView>
    </Modal>
  );
}

function EmployeesSection({ businessId }: { businessId: string }) {
  const { data: employees } = useEmployees(businessId);
  const createEmp = useCreateEmployee(businessId);
  const updateEmp = useUpdateEmployee(businessId);
  const deleteEmp = useDeleteEmployee(businessId);
  const [form, setForm] = useState<EmployeeForm | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const list = employees ?? [];

  return (
    <>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Çalışanlar</Text>
        <Pressable
          onPress={() => setForm({ name: '', title: '', active: true })}
          style={styles.addBtn}
          hitSlop={8}
        >
          <Ionicons name="add" size={18} color={colors.onGold} />
          <Text style={styles.addText}>Ekle</Text>
        </Pressable>
      </View>

      <View style={styles.moderationNote}>
        <Ionicons name="people-outline" size={15} color={colors.gold} />
        <Text style={styles.storageNoteText}>
          Çalışan eklersen müşteriler randevu alırken çalışan seçer ve her
          çalışanın ayrı takvimi olur. Çalışan eklemezsen randevular işletme
          geneli olur.
        </Text>
      </View>

      {list.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="Henüz çalışan yok"
          subtitle="Çalışan ekleyerek her biri için ayrı randevu takvimi oluştur."
          actionLabel="Çalışan Ekle"
          actionIcon="add"
          onAction={() => setForm({ name: '', title: '', active: true })}
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          {list.map((e) => (
            <View key={e.id} style={[styles.serviceRow, elevation.soft]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceName}>{e.name}</Text>
                <Text style={styles.serviceMeta}>{e.title?.trim() || 'Çalışan'}</Text>
              </View>
              <Badge label={e.active ? 'Aktif' : 'Pasif'} color={e.active ? colors.approved : colors.cancelled} />
              <Pressable
                onPress={() => setForm({ id: e.id, name: e.name, title: e.title ?? '', active: e.active })}
                hitSlop={8}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel={`${e.name} çalışanını düzenle`}
              >
                <Ionicons name="create-outline" size={20} color={colors.textMuted} />
              </Pressable>
              <Pressable
                onPress={() => setDeleteId(e.id)}
                hitSlop={8}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel={`${e.name} çalışanını sil`}
              >
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <EmployeeFormModal
        form={form}
        saving={createEmp.isPending || updateEmp.isPending}
        onChange={setForm}
        onClose={() => setForm(null)}
        onSubmit={(f) => {
          const payload = { name: f.name.trim(), title: f.title.trim() };
          if (f.id) {
            updateEmp.mutate(
              { id: f.id, ...payload, active: f.active },
              { onSuccess: () => setForm(null) },
            );
          } else {
            createEmp.mutate(payload, { onSuccess: () => setForm(null) });
          }
        }}
      />

      <Modal visible={deleteId != null} transparent animationType="fade" onRequestClose={() => setDeleteId(null)}>
        <View style={styles.overlayCenter}>
          <View style={styles.dialog}>
            <Ionicons name="trash-outline" size={28} color={colors.danger} />
            <Text style={styles.dialogTitle}>Çalışanı sil?</Text>
            <Text style={styles.dialogText}>Bu çalışan kalıcı olarak silinecek.</Text>
            <View style={styles.dialogActions}>
              <View style={{ flex: 1 }}>
                <Button label="Vazgeç" variant="secondary" onPress={() => setDeleteId(null)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Sil"
                  variant="danger"
                  loading={deleteEmp.isPending}
                  onPress={() => {
                    if (deleteId) deleteEmp.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function EmployeeFormModal({
  form,
  saving,
  onChange,
  onSubmit,
  onClose,
}: {
  form: EmployeeForm | null;
  saving: boolean;
  onChange: (f: EmployeeForm) => void;
  onSubmit: (f: EmployeeForm) => void;
  onClose: () => void;
}) {
  const f = form ?? { name: '', title: '', active: true };
  const valid = f.name.trim().length > 0;

  return (
    <Modal visible={form != null} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.dialogTitle}>{form?.id ? 'Çalışanı Düzenle' : 'Yeni Çalışan'}</Text>
          <Field
            label="Ad Soyad"
            value={f.name}
            onChangeText={(v) => onChange({ ...f, name: v })}
            icon="person-outline"
            placeholder="Örn. Kemal Usta"
          />
          <Field
            label="Ünvan (isteğe bağlı)"
            value={f.title}
            onChangeText={(v) => onChange({ ...f, title: v })}
            icon="pricetag-outline"
            placeholder="Berber, Uzman…"
          />
          {form?.id ? (
            <View>
              <Text style={styles.slotLabel}>Durum</Text>
              <View style={styles.slotRow}>
                {([true, false] as const).map((v) => {
                  const active = f.active === v;
                  return (
                    <Pressable
                      key={String(v)}
                      onPress={() => onChange({ ...f, active: v })}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={[styles.slotChip, active && styles.slotChipActive]}
                    >
                      <Text style={[styles.slotChipText, active && styles.slotChipTextActive]}>
                        {v ? 'Aktif' : 'Pasif'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}
          <View style={styles.dialogActions}>
            <View style={{ flex: 1 }}>
              <Button label="Vazgeç" variant="secondary" onPress={onClose} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Kaydet" loading={saving} disabled={!valid} onPress={() => onSubmit(f)} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  mapMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  mapCoordText: { ...typography.caption, color: colors.textMuted, flex: 1 },
  locateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.gold + '14',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gold + '40',
  },
  locateBtnText: { ...typography.caption, color: colors.gold, fontWeight: '700' },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerImage: { width: '100%', height: '80%' },
  viewerClose: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  moderationNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.gold + '10',
    borderRadius: 10,
    padding: spacing.sm,
  },
  storageNoteText: { ...typography.caption, color: colors.textMuted, flex: 1, lineHeight: 18 },
  photoStatePending: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.pending,
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  photoStateLive: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.approved,
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  photoStateText: { ...typography.micro, color: '#fff', fontWeight: '700' },
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
