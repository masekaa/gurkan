import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button, EmptyState, Field, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import {
  useBusiness,
  useCreateService,
  useDeleteService,
  useServices,
  useUpdateBusiness,
  useUpdateService,
} from '@/hooks/queries';
import { formatDuration, formatPrice } from '@/lib/format';
import { centeredContent, colors, elevation, radius, spacing, typography } from '@/theme';

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
              text={`${business?.openingTime ?? '--'} – ${business?.closingTime ?? '--'}`}
            />
            <InfoLine icon="location-outline" text={business?.district ?? '—'} />
          </View>
        )}

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
    </Screen>
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
    openingTime: string;
    closingTime: string;
  };
  saving: boolean;
  onSave: (patch: {
    name: string;
    about: string;
    phone: string;
    openingTime: string;
    closingTime: string;
  }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [about, setAbout] = useState(initial.about);
  const [phone, setPhone] = useState(initial.phone);
  const [open, setOpen] = useState(initial.openingTime);
  const [close, setClose] = useState(initial.closingTime);

  return (
    <View style={[styles.card, elevation.soft, { gap: spacing.md }]}>
      <Text style={styles.cardTitle}>İşletme Bilgileri</Text>
      <Field label="İşletme adı" value={name} onChangeText={setName} icon="storefront-outline" />
      <Field label="Hakkında" value={about} onChangeText={setAbout} multiline />
      <Field label="Telefon" value={phone} onChangeText={setPhone} icon="call-outline" keyboardType="phone-pad" />
      <View style={styles.hourRow}>
        <View style={{ flex: 1 }}>
          <Field label="Açılış" value={open} onChangeText={setOpen} icon="time-outline" placeholder="09:00" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Kapanış" value={close} onChangeText={setClose} icon="time-outline" placeholder="20:00" />
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
            disabled={!name.trim()}
            onPress={() =>
              onSave({
                name: name.trim(),
                about: about.trim(),
                phone: phone.trim(),
                openingTime: open.trim(),
                closingTime: close.trim(),
              })
            }
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
