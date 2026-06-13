# Altın100 — Proje Devir Dokümanı (HANDOFF)

> Bu dosya, projede şimdiye kadar yapılan her şeyi ve kaldığımız noktayı özetler.
> Yeni bir Claude oturumu bunu okuyarak bağlamı sıfırdan kavrayıp devam edebilir.
> **Son güncelleme:** İşletme paneli tamamlandıktan sonra.

---

## 1. Proje Nedir?

**Altın100** — berber, kuaför ve güzellik salonları için çok platformlu
**randevu + sadakat** platformu. Tek kod tabanı ile **web + iOS + Android**.

- Ürün kapsam dokümanı (PRD): [`docs/SCOPE.md`](docs/SCOPE.md)
- Veri modeli: [`firebase/DATA_MODEL.md`](firebase/DATA_MODEL.md)
- Kurulum/komutlar: [`README.md`](README.md)

İş bağlamı: Pilot bölge Bursa/Nilüfer, 10 berberle 30 günlük beta. Hedef:
manuel (telefon/WhatsApp) randevu trafiğini self-servis dijitale taşımak,
no-show'u düşürmek.

---

## 2. Teknoloji Yığını ve Önemli Kararlar

| Katman | Seçim | Not |
|---|---|---|
| İstemci | **Expo SDK 56** + **expo-router** | Dosya tabanlı routing |
| Çerçeve | React Native 0.85, React 19, TypeScript (strict) | |
| Web | react-native-web | Aynı kod tabanı |
| Veri/Durum | **TanStack Query** (`@tanstack/react-query`) | |
| Backend | **Firebase** — Auth + Firestore (JS SDK) | Native değil, **Web SDK** |
| Deploy (web) | **Vercel** (statik export + SPA rewrite) | |

**Karar geçmişi (önemli):**
- Backend başta Supabase olarak başladı, sonra **Firebase**'e geçildi (kullanıcı
  isteği). UI'da hiçbir şey değişmedi çünkü veri katmanı soyutlanmış.
- Firebase **JS SDK** kullanılıyor → tek **Web app** config'i web+iOS+Android'de
  çalışır. Native iOS/Android Firebase app'leri yalnızca ileride native push
  (FCM/APNs) için gerekecek.
- Kullanıcı **bulut-öncelikli** çalışıyor (yerel ortam yok); web Vercel'de
  yayınlanıyor. Bu yüzden terminal gerektirmeyen **uygulama içi seed** eklendi.
- Mobil "geçiş" gerekmiyor: kod zaten React Native; mağaza için ileride EAS Build.

---

## 3. Mimari (kritik kavram)

**Backend-agnostik veri katmanı.** Ekranlar Firebase'i ASLA doğrudan çağırmaz;
yalnızca şunları kullanır:
- `src/data/repository.ts` — tüm veri okuma/yazma
- `src/context/AuthContext.tsx` — oturum + rol

Her ikisi de "Firebase yapılandırılmış mı?" diye bakar:
- **Yapılandırılmışsa** → Firestore/Auth kullanır
- **Değilse (env boş)** → `src/data/mock.ts` içindeki **yerleşik mock veri** ile
  çalışır (DEMO MODU). Böylece sıfır kurulumla uygulama çalışır.

> Sonuç: Backend değiştirmek = sadece `repository.ts` + `AuthContext.tsx` +
> `lib/firebase.ts` dosyalarını değiştirmek. Ekranlar dokunulmadan kalır.

---

## 4. Dosya Yapısı

```
app/                          Ekranlar (expo-router)
  _layout.tsx                 Kök: SafeArea + QueryClient + AuthProvider + Stack
  index.tsx                   Giriş kapısı (oturum varsa tabs, yoksa login'e yönlendirir)
  (auth)/
    _layout.tsx               Oturum varsa tabs'a yönlendirir
    login.tsx                 Giriş (+ humanizeAuthError helper'ı burada export)
    register.tsx              Kayıt
  (tabs)/
    _layout.tsx               ROL BAZLI sekmeler (href:null ile gizleme)
    index.tsx                 Keşfet (müşteri) — business rolü → orders'a redirect; seed butonu
    appointments.tsx          Randevularım (müşteri) — yaklaşan/geçmiş, iptal
    loyalty.tsx               Sadakat (müşteri)
    orders.tsx                Gelen Randevular (işletme) — onayla/reddet/iptal/tamamla
    dashboard.tsx             Panel (işletme) — kazanç/doluluk/no-show KPI'ları
    profile.tsx               Profil — rol değiştirici, referans kodu, çıkış
  business/[id].tsx           İşletme detayı + hizmet listesi → booking'e yönlendirir
  booking/[businessId].tsx    Randevu akışı: tarih + saat seçimi → onay → başarı
src/
  theme/index.ts              Tasarım token'ları (açık + altın tema, Getir tarzı)
  types/index.ts              Alan modelleri (Profile, Business, Service, Appointment, Loyalty)
  lib/
    env.ts                    EXPO_PUBLIC_FIREBASE_* okuma + hasFirebase
    firebase.ts               Firebase init (yoksa null), auth/db export
    format.ts                 formatPrice/Date/Time, kategori & durum etiketleri
  data/
    mock.ts                   Seed veri (4 işletme, 9 hizmet, örnek randevular, loyalty)
    repository.ts             Firebase⇄mock veri katmanı + seedSampleData + loyalty
  context/AuthContext.tsx     Auth (signIn/Up/Out) + setRole (müşteri↔işletme)
  hooks/queries.ts            TanStack Query hook'ları
  components/
    ui.tsx                    Screen, Card, Button, Field, Badge, EmptyState, Avatar, SectionTitle
    BusinessCard.tsx          İşletme liste kartı
    AppointmentCard.tsx       Müşteri randevu kartı
firebase/
  firestore.rules             Güvenlik kuralları (rol bazlı)
  DATA_MODEL.md               Koleksiyon/alan dokümanı
scripts/seed.mjs              Admin SDK ile Firestore seed (serviceAccountKey.json gerekir)
docs/SCOPE.md                 Ürün kapsam dokümanı (PRD)
vercel.json                   Vercel build/output + SPA rewrite
.env.example                  Firebase env şablonu (gerçek .env git'e gitmez)
```

---

## 5. Şu Ana Kadar TAMAMLANANLAR ✅

**Kimlik (Auth)**
- E-posta/şifre ile kayıt, giriş, çıkış. Mock modda herhangi bir bilgiyle giriş.
- **Hesap türü kayıtta seçilir (Müşteri / İşletme).** İşletme seçilirse kayıt
  sırasında `repository.createBusiness` ile `ownerId`'li, `approved:false` bir
  işletme oluşturulur ve profil `role:'business'` + gerçek `businessId` ile yazılır.
  Müşteri/işletme **ayrışması** = profildeki `role` + rol bazlı sekmeler.
- **Roller güvenli ayrıştırıldı (production):** demo rol anahtarı KALDIRILDI
  (kendini admin/işletme yapma açığıydı); Profil'de rol salt-okunur rozet.
  Kurallar: profil `create` yalnızca `role in [user,business]` (admin asla
  self-register edilemez), `update` kendi `role/businessId`'sini değiştiremez
  (yalnızca admin). **Admin Console'dan atanır** (`profiles/{uid}.role='admin'`).
- Oturum kalıcılığı (AsyncStorage / web localStorage).
- Hata mesajları Türkçeleştirilmiş (`humanizeAuthError`).

**Müşteri tarafı**
- Keşfet: işletme listesi, arama, kategori filtresi.
- İşletme detayı: bilgiler, çalışma saatleri, hizmet listesi.
- Randevu oluşturma akışı: hizmet → tarih (14 gün) → saat (çalışma saatlerinden
  30 dk slotlar) → onay → başarı ekranı.
- **Çift rezervasyon engeli (FR-3.5):** dolu ve geçmiş saatler devre dışı; alımda
  Firestore transaction'lı **slot kilidi** (`slots/{businessId}__{ISO}`) yarış
  koşulunu da engeller; çakışmada Türkçe uyarı. İptal/red slotu serbest bırakır.
- Randevularım: yaklaşan/geçmiş sekmeleri, iptal etme.
- Sadakat: işletme bazında puan, ilerleme çubuğu, 10 puan = 1 ücretsiz hizmet.
- Randevu detay ekranı + müşteri profil düzenleme (ad/telefon).
- Şifre sıfırlama ekranı (Firebase `sendPasswordResetEmail`).
- **Yorum/puanlama:** işletme detayında ortalama + yıldızlı yorum listesi +
  "Yorum Yap" (1-5 yıldız + metin). `repository.listReviews/createReview`,
  `reviews` koleksiyonu (kurallar yayınlanmalı).
- Referans kodu gösterimi (profil).

**İşletme tarafı**
- İşletme hesabı **kayıtta** oluşur (`ownerId`'li, `approved:false`); admin onayı
  sonrası Keşfet'te görünür.
- Rol bazlı sekme menüsü (işletme: Gelen Randevular + Panel + İşletmem + Profil).
- **Gelen Randevular yalnızca KENDİ randevuları**: `businessOwnerId == sahip uid`
  ile sorgulanır (`profile.id`). `DEMO_BUSINESS_ID (b1)` sahipsiz olduğundan
  demo b1 hesabı veri göstermez; gerçek test için işletme hesabı kaydı gerekir.
- Gelen Randevular: Bekleyen/Onaylı/Geçmiş, **onayla/reddet/iptal/tamamla**.
- Panel (dashboard): günlük & aylık kazanç, toplam randevu, bekleyen sayısı,
  doluluk oranı %, no-show oranı % (hedef %15 üstü kırmızı).
- **İşletmem (FR-2):** işletme profili düzenleme (ad/hakkında/telefon/çalışma
  saatleri) + hizmet **ekle/düzenle/sil** (bottom-sheet form + silme onayı).
  `repository`: `createService/updateService/deleteService`, `updateBusiness`.

**Admin tarafı** (admin-özel **Yönetim** sekmesi; rol Console'dan atanır)
- 3 sekme: **İşletmeler** (onayla/pasife al + **sil**), **Kullanıcılar**
  (ad/e-posta/rol + **sil**; silme sahip olunan işletmeleri de kaldırır),
  **Randevular** (tümü). Özet: işletme/onay-bekleyen/kullanıcı sayısı.
- `repository.listAllBusinesses/listAllAppointments/listAllUsers/deleteUser/
  deleteBusiness`, `useSetBusinessApproved`. Kurallar `profiles/businesses`
  delete = `isAdmin`.
- ⚠️ `deleteUser` yalnızca app-içi profili + işletmelerini siler; Firebase **Auth
  hesabı** yalnızca sunucu tarafında (Admin SDK / Cloud Function) silinebilir.

**Görsel sistem (tasarım) — AÇIK TEMA (Getir tarzı)**
- **Açık (light) tema:** aydınlık zemin (`#F4F4F7`), beyaz kartlar, koyu metin,
  derinleştirilmiş altın marka (`#B5862B`). Yumuşak gölgeler (`elevation`).
  `StatusBar` dark; `app.json` userInterfaceStyle light.
- Gradient + elevation token sistemi (`theme`: `categoryStyle`, `elevation`,
  `gradients`); `expo-linear-gradient`. Altın gradient butonlar, kategori
  gradient kapaklar/hero'lar, durum renkli aksan şeritleri.
- **Keşfet = Getir düzeni:** yapışkan başlık+arama, promo banner carousel,
  kategori ızgarası (gradient tile), yatay carousel'ler ("Sana yakın", "En
  yüksek puanlılar") + "Tümünü gör"; arama/kategori → filtreli dikey liste.
  `BusinessCardCompact` carousel kartı.
- Segment sekmeleri: gri ray + beyaz aktif pill; input'lar beyaz; tab bar yüzen gölge.
- **Geri dönüş noktası:** git tag `v1.0-pre-ui-redesign` (UI yenilemesi öncesi).

**Altyapı**
- Firestore güvenlik kuralları + veri modeli dokümanı.
- Seed: hem uygulama içi buton (boş Firestore'da Keşfet'te) hem `scripts/seed.mjs`.
- Vercel yapılandırması (SPA rewrite dahil).
- **Doğrulama:** `npx tsc --noEmit` temiz; `npm run export:web` başarılı.

---

## 6. Backend / Deploy Durumu (kaldığımız nokta)

- Kullanıcı **Firebase projesini oluşturdu**. Web app config'ini Vercel ortam
  değişkenlerine (`EXPO_PUBLIC_FIREBASE_*`) girmesi gerekiyor.
- **Yapılması gerekenler (kullanıcı tarafı, doğrulanmadı):**
  1. Firebase Console → Authentication → Email/Password etkinleştir.
  2. Firestore Database oluştur (production, bölge: europe-west).
  3. `firebase/firestore.rules` içeriğini Console → Firestore → Rules'a yapıştır + Publish.
  4. Vercel → Settings → Environment Variables → 6 adet `EXPO_PUBLIC_FIREBASE_*`.
  5. Firebase → Authentication → Settings → Authorized domains → Vercel domaini ekle.
  6. Siteye girip Keşfet'teki "Örnek Verileri Yükle" butonuyla seed.
- Env boşken her şey **mock modda** çalışmaya devam eder (geliştirme bunu bekler).

---

## 6.5. Yeni Eklenen Özellikler ve Dış Kurulum Gereksinimleri (2026-06-13)

Bu turda eklenen özellikler ve çalışması için gereken **dış kurulum** (kod hazır,
bayrakla korunuyor; kurulum yapılmadan uygulama bozulmaz):

| Özellik | Durum | Gereken dış kurulum |
| --- | --- | --- |
| Form doğrulama (e-posta/telefon/şifre) | ✅ Tam çalışır | — |
| Onboarding (ilk açılış 3 slayt) | ✅ Tam çalışır | — |
| Dokunsal geri bildirim (haptics) | ✅ Native'de çalışır | — (web'de no-op) |
| Boş durum cilası + giriş animasyonu | ✅ Tam çalışır | — |
| Yol tarifi / tek dokunuşla arama | ✅ Tam çalışır | — (Linking, anahtarsız) |
| İşletme foto galerisi (görüntüleme) | ✅ Tam çalışır | — |
| Foto **moderasyonu** (yüklenen foto admin onayına düşer, onaysız yayınlanmaz) | ✅ Tam çalışır | **firestore.rules yeniden yayınla** (owner `photos`'a yazamaz) |
| Foto **yükleme** | ⏳ Bayraklı | **Firebase Storage** etkinleştir + `firebase/storage.rules` yayınla |
| Yerel randevu hatırlatması (1s önce) | ✅ Native'de çalışır | — (OS bildirim izni) |
| Uzak push (kampanya/işletme uyarısı) | ⏳ İskelet | **EAS projectId** + FCM/APNs kimlikleri |
| Analitik ölçüm | ⏳ İskelet (dev'de console) | Sağlayıcı bağla (`configureAnalytics`) |

**Storage'ı etkinleştirme:** Firebase Console → Storage → Başlat → sonra
`firebase/storage.rules` içeriğini Storage → Rules'a yapıştır + Publish. Bu
yapılınca uygulamadaki "Fotoğraf Ekle" butonu otomatik aktifleşir
(`isStorageEnabled` bayrağı).

**Uzak push:** `app.json`'a EAS `projectId` ekle, EAS Build ile native derle,
`registerForPushToken(projectId)` çağrısını başlangıçta tetikle.

**Bilinen küçük açık:** Yerel hatırlatma randevuyla birlikte iptal edilmiyor
(bildirim id'si randevuda saklanmıyor). İptal edilen randevu için hatırlatma yine
de tetiklenebilir — düşük etkili; ileride `appointment.reminderId` alanı eklenip
`cancelReminder()` çağrılarak çözülebilir.

---

## 7. SIRADAKİ İŞLER (yapılacaklar) ⏭️

Öncelik sırasıyla önerilen yol haritası:

1. **Bildirim altyapısı** (SCOPE Modül 4) — **backend gerektirir**:
   - Firebase Cloud Functions: randevu durum değişiminde push, 24s/1s hatırlatma.
   - Sadakat puanı ve referans ödülünü **sunucu tarafına** taşı (şu an mock).
   - Push için native build (EAS Build) + iOS APNs / Android google-services.json.

---

## 8. Bilinen Kısayollar / Teknik Borç ⚠️

- **Sadakat puanı** yalnızca mock modda artıyor (`repository.grantLoyaltyPoint`).
  Üretimde Cloud Function olmalı; kurallar istemcinin `loyalty` yazmasını engeller.
- ✅ **Çözüldü**: `appointments` okuma/güncelleme artık `customerId==uid ||
  businessOwnerId==uid || admin` ile sıkı; demo rol anahtarı kaldırıldı; profil
  rol değişimi (self) kurallarla engellendi. Admin Console'dan atanır.
- **Slot kilidi `delete` kuralı geniş** — şu an giriş yapan herkes silebilir
  (işletmenin red akışı için). İleride işletme sahibi/sahip kontrolüyle daraltılmalı.
- Mock kullanıcı tek (`MOCK_USER_ID`); işletme görünümündeki diğer müşteriler
  yalnızca isimden ibaret (`customerName`), profilleri yok.

---

## 9. Çalıştırma & Doğrulama Komutları

```bash
npm install
npm run web          # tarayıcı (http://localhost:8081)
npx expo start       # cihazda Expo Go ile (QR)
npm run typecheck    # tsc --noEmit (commit öncesi çalıştır)
npm run export:web   # üretim web derlemesi -> dist/
node scripts/seed.mjs  # Firestore'a örnek veri (serviceAccountKey.json gerekir)
```

> **Konvansiyon:** Değişiklikten sonra `npm run typecheck` ve gerekiyorsa
> `npm run export:web` ile doğrula. Türkçe arayüz metinleri; kod/yorumlar İngilizce.

---

## 10. Git / Repo

- Repo: `masekaa/gurkan`
- Aktif geliştirme dalı: **`claude/altin100-scope-document-HLfcT`**
- Tüm iş bu dalda; `main`'e merge/PR henüz yapılmadı (kullanıcı isterse yapılacak).

---

## 11. Açık Sorular (SCOPE §14)

1. Müşteri ve işletme **tek uygulamada rol bazlı** mı (✅ şu an böyle yapıldı),
   yoksa iki ayrı uygulama mı? → Şimdilik tek uygulama, rol bazlı.
2. Online ödeme / kapora v1.1'de mi gerekli?
3. Personel (çalışan) bazlı takvim MVP'de mi?
4. Yorum/puanlama yazımı MVP'de mi?

---

*Devam ederken: önce bu dosyayı ve `docs/SCOPE.md`'yi oku, sonra §7'deki sıradaki
işten birini seç. Mimari kuralı bozma: ekranlar yalnızca `repository.ts` ve
`AuthContext` üzerinden veriye erişir.*
