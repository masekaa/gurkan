# Altın100 — Mağaza Yayını: Baştan Sona Kılavuz

Sıfırdan App Store ve Google Play'e yayınlama. Sırayla takip et. Kod/yapılandırma
hazır (`eas.json`, izinler, hesap silme, gizlilik sayfaları, görseller); aşağısı
hesap açma + konsol + komut işidir.

**Proje bilgileri (her yerde aynı olmalı):**
- Uygulama adı: **Altın100**
- Bundle ID / Package: **com.altin100.app**
- Sürüm: **1.0.0**
- EAS projectId: `09c25178-445e-4961-a7bf-e6b5d56e7038` (owner: maseka04)
- Gizlilik: https://gurkan-theta.vercel.app/legal/privacy
- Koşullar: https://gurkan-theta.vercel.app/legal/terms
- Görseller: `store-assets/ios`, `store-assets/android`, `store-assets/branding`
- Metinler: `STORE_LISTING.md`

---

## FAZ 0 — Önce bunları hazırla (yarım saat)
1. **Test hesapları oluştur** (inceleme ekipleri için). Uygulamaya gir, biri
   müşteri biri işletme iki hesap aç:
   - Müşteri: `test-musteri@altin100.com` / güçlü bir şifre
   - İşletme: `test-isletme@altin100.com` / güçlü bir şifre
   Bunları bir yere not et; mağaza inceleme notuna yazacağız.
2. **Firestore kurallarını yayınla** (henüz yapmadıysan): Firebase Console →
   Firestore → Rules → `firebase/firestore.rules` içeriğini yapıştır → Publish.
3. **Storage kurallarını yayınla**: Console → Storage → Rules → `firebase/storage.rules`.
4. Gizlilik/koşullar linklerinin açıldığını tarayıcıda doğrula.

---

# 🍎 BÖLÜM A — App Store (iOS)

## A1. Apple Developer Program'a kaydol (ÖNCE BUNU BAŞLAT — onay 24-48 saat sürebilir)
1. https://developer.apple.com/programs/enroll/ → Apple ID ile giriş.
2. Bireysel (Individual) ya da Şirket (Organization) seç. Bireysel daha hızlı.
3. 99 USD/yıl öde. Onay e-postasını bekle.

## A2. App Store Connect'te uygulamayı oluştur
1. https://appstoreconnect.apple.com → **My Apps → ➕ → New App**.
2. Doldur:
   - Platforms: **iOS**
   - Name: **Altın100** (App Store genelinde benzersiz olmalı; alınmışsa
     "Altın100 - Randevu" gibi bir varyant dene)
   - Primary Language: **Turkish**
   - Bundle ID: **com.altin100.app**
     - Listede yoksa: EAS ilk iOS build'inde otomatik kaydeder (A3'ten sonra
       buraya dönüp seç), veya Developer portalı → Identifiers → ➕ ile manuel ekle.
   - SKU: `altin100` (rastgele benzersiz bir metin)
   - User Access: Full Access
3. Create.

## A3. iOS production build al (EAS imzalamayı otomatik halleder)
```bash
npx eas-cli build --platform ios --profile production
```
- "Generate a new Apple Distribution Certificate?" → **Yes** (EAS yönetsin).
- Apple hesabınla giriş ister; sertifika + provisioning'i otomatik üretir.
- Build bitince `.ipa` EAS sunucusunda hazır olur.

## A4. App Store Connect API anahtarı oluştur (eas submit için)
1. App Store Connect → **Users and Access → Integrations → App Store Connect API**.
2. ➕ ile yeni anahtar: Access = **App Manager** → Generate.
3. İnen `.p8` dosyasını, **Key ID** ve **Issuer ID**'yi sakla (bir kez inilir).

## A5. Gönder
```bash
npx eas-cli submit --platform ios --profile production
```
- API anahtarı (.p8), Key ID, Issuer ID'yi soracak (ya da EAS'e kaydedebilirsin).
- Build'i App Store Connect'e yükler.

## A6. App Store listelemesini doldur (appstoreconnect.apple.com → uygulaman)
- **Screenshots:** `store-assets/ios/` içindeki 5 PNG'yi 6.7" alanına yükle.
- **Description / Keywords / Promo:** `STORE_LISTING.md`'den kopyala.
- **Support URL:** https://gurkan-theta.vercel.app
- **Privacy Policy URL:** https://gurkan-theta.vercel.app/legal/privacy
- **App Privacy** (App Privacy bölümü): `STORE_LISTING.md`'deki cevaplar
  (İletişim/Konum/Fotoğraf = App Functionality, izleme YOK).
- **App Review Information → Sign-In required: Yes** → test hesabı bilgilerini
  ve notu (`STORE_LISTING.md`'deki inceleme notu) gir.
- **Age rating** anketini doldur (içerik yok → düşük yaş).
- Build'i seç (A5 sonrası işlenince görünür) → **Add for Review → Submit**.

---

# 🤖 BÖLÜM B — Google Play (Android)

## B1. Google Play Developer hesabı aç
1. https://play.google.com/console → 25 USD (tek seferlik) öde.
2. **Kimlik doğrulama** iste­nir (kimlik + adres); onay birkaç gün sürebilir,
   erken başlat.

## B2. Play Console'da uygulamayı oluştur
1. **Create app**. Doldur:
   - App name: **Altın100**
   - Default language: **Türkçe**
   - App or game: **App**
   - Free / Paid: **Free**
   - Beyanları (yönergeler, ABD ihracat yasaları) onayla → Create app.

## B3. "Set up your app" görevlerini tamamla (sol menü → Dashboard)
- **App access:** Giriş gerekiyor → "All functionality requires sign-in" →
  test hesabı bilgilerini gir.
- **Ads:** Reklam yok.
- **Content rating:** Anketi doldur (şiddet/yok → düşük). Sertifika üretilir.
- **Target audience:** 18+ (veya 13+; çocuklara yönelik değil).
- **Data safety:** `STORE_LISTING.md`'deki Veri Güvenliği cevaplarını gir.
- **Privacy policy:** https://gurkan-theta.vercel.app/legal/privacy
- **Government app / Financial:** Hayır.

## B4. Store listing (Mağaza girişi)
- **App icon:** `store-assets/branding/icon-512.png` (512×512).
- **Feature graphic:** `store-assets/branding/feature-graphic.png` (1024×500).
- **Phone screenshots:** `store-assets/android/` içindeki 5 PNG.
- **Short / Full description:** `STORE_LISTING.md`'den.

## B5. Android production build al
```bash
npx eas-cli build --platform android --profile production
```
- "Generate a new Android Keystore?" → **Yes** (EAS yönetsin — kaybetme,
  güncellemeler için aynı keystore gerekir; EAS saklar).
- Build bitince `.aab` hazır olur.

## B6. Yükleme yolu (önerilen: önce İç Test)
**Seçenek 1 — eas submit (servis hesabı gerekir):**
1. Play Console → **Setup → API access** → bir **Google Cloud service account**
   oluştur/bağla → role: **Release Manager** → JSON anahtarını indir.
2. ```bash
   npx eas-cli submit --platform android --profile production
   ```
   (Servis hesabı JSON yolunu sorar; `eas.json`'a da eklenebilir.)

**Seçenek 2 — manuel (ilk seferde en garantisi):**
1. Play Console → **Testing → Internal testing → Create new release**.
2. EAS'in verdiği `.aab`'yi indir, sürükle-bırak yükle → Review → Rollout.
3. Test edip emin olunca **Production → Create release** ile aynı `.aab`'yi yayına al.

## B7. İncelemeye gönder
Tüm görevler yeşil olunca **Production → Send for review**. Google incelemesi
genelde birkaç saat–2 gün.

---

## Sık karşılaşılan engeller
- **Apple: "Hesap silme yok" reddi** → Var (Profil → Hesabımı Sil). İnceleme
  notunda belirt.
- **Apple/Google: giriş gerektiren uygulama** → mutlaka test hesabı ver, yoksa
  reddedilir.
- **Gizlilik politikası URL'si açılmıyor** → Vercel'in son commit'i deploy
  ettiğinden emin ol.
- **Android keystore / iOS sertifika** → EAS'e bırak; manuel uğraşma.
- **Sürüm güncelleme** → `app.json`'da `version`'ı yükselt, tekrar build+submit.

## Sıra önerisi
1. Bugün: Apple Developer + Google Play hesap başvurularını başlat (onay bekler).
2. Beklerken: test hesaplarını oluştur, kuralları yayınla, linkleri doğrula.
3. Onaylar gelince: iOS build+submit, Android build+upload.
4. Listelemeleri doldur, incele, gönder.
