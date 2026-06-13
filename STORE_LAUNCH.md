# Altın100 — Mağaza Yayın Rehberi (App Store + Google Play)

Bu doküman, uygulamayı App Store ve Google Play'e yüklemek için **senin
yapman gereken** adımları sırasıyla anlatır. Kod tarafı (EAS yapılandırması,
izin metinleri, hesap silme) hazır — aşağısı hesap/komut işidir.

> Web (Vercel) zaten yayında: https://gurkan-theta.vercel.app — bu rehber
> yalnızca **native mobil uygulama** içindir.

---

## 0. Özet maliyet ve süre
- **Apple Developer Program:** 99 USD/yıl (zorunlu).
- **Google Play Developer:** 25 USD tek seferlik (zorunlu).
- **Expo (EAS):** ücretsiz başlangıç planı yeterli (build kuyruğu sırada bekler).
- **Süre:** ilk build ~30 dk; mağaza inceleme: Apple 1–3 gün, Google birkaç saat–2 gün.

---

## 1. Ön gereksinimler
1. **Expo hesabı** aç: https://expo.dev (ücretsiz).
2. **EAS CLI** (kurulum gerekmez, `npx` ile çalışır):
   ```bash
   npx eas-cli@latest login
   ```
3. Proje kökünde EAS projesini başlat (bir kez):
   ```bash
   npx eas-cli@latest init
   ```
   Bu, `app.json`'a `extra.eas.projectId` ekler. Çıkan değişikliği commit et.

---

## 2. Firebase ortam değişkenleri (KRİTİK)
Native build sırasında `EXPO_PUBLIC_FIREBASE_*` değişkenleri **derleme anında**
gömülür. Bunlar yoksa uygulama mağazada **demo (mock) moduna** düşer — yani
gerçek veriye bağlanmaz. Vercel'dekiyle birebir aynı 6 değeri EAS'e tanımla:

```bash
npx eas-cli@latest env:create --name EXPO_PUBLIC_FIREBASE_API_KEY --value "AIza..." --environment production
npx eas-cli@latest env:create --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "...firebaseapp.com" --environment production
npx eas-cli@latest env:create --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "..." --environment production
npx eas-cli@latest env:create --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "...appspot.com" --environment production
npx eas-cli@latest env:create --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "..." --environment production
npx eas-cli@latest env:create --name EXPO_PUBLIC_FIREBASE_APP_ID --value "1:...:web:..." --environment production
```
(Bu değerler Firebase Console → Proje Ayarları → "Web uygulaması" altında.)
Firebase web config'i gizli değildir; istemciye zaten gömülür — güvenlik
Firestore/Storage kurallarıyla sağlanır.

> `preview` profili için de aynı değişkenleri `--environment preview` ile ekle
> (test build'in gerçek backend'e bağlanması için).

---

## 3. Test build (önce bunu yap)
Gerçek cihazda denemek için dahili dağıtım build'i al:
```bash
# Android (APK — telefona doğrudan kurulur)
npx eas-cli@latest build --platform android --profile preview

# iOS (dahili test — cihaz UDID kaydı veya TestFlight gerekir)
npx eas-cli@latest build --platform ios --profile preview
```
Çıkan linkten APK'yı indirip Android telefonda kur, akışları test et:
giriş/kayıt, randevu, harita konum seçimi, mesafe, foto yükleme, hesap silme.

---

## 4. Production build
```bash
npx eas-cli@latest build --platform android --profile production   # .aab
npx eas-cli@latest build --platform ios --profile production       # .ipa
```
`eas.json`'da `autoIncrement: true` olduğu için sürüm/build numaraları
otomatik artar. Görünür sürüm (`1.0.0`) `app.json > expo.version`'dan gelir.

---

## 5. Mağaza hesapları ve listeleme varlıkları
Her iki mağaza için hazırla:
- **Uygulama adı:** Altın100
- **İkon:** 1024×1024 PNG (saydam olmayan). `assets/icon.png` bunu karşılamalı.
- **Ekran görüntüleri:** en az birkaç telefon ekranı (Keşfet, işletme detay +
  harita, randevu, profil). iOS 6.7" ve 5.5", Android telefon boyutları.
- **Kısa + uzun açıklama** (TR). Örn: "Berber, kuaför ve güzellik merkezlerinden
  saniyeler içinde randevu al; yakınındakileri haritada gör."
- **Kategori:** Lifestyle / Yaşam Tarzı.
- **Gizlilik Politikası URL'si (ZORUNLU):** veri topluyoruz (e-posta, konum,
  fotoğraf). Bir gizlilik politikası + kullanım koşulları sayfası yayınla
  (örn. Vercel sitesine `/gizlilik` ekleyebilirsin) ve URL'yi mağazaya gir.
- **Destek URL'si / e-posta.**

### Apple veri toplama beyanı (App Privacy)
Şunları "topluyor" olarak işaretle: E-posta (hesap), Konum (yakınlık),
Kullanıcı içeriği (fotoğraf). Reklam/izleme yok.

---

## 6. Mağazaya gönderim
```bash
npx eas-cli@latest submit --platform android --profile production
npx eas-cli@latest submit --platform ios --profile production
```
EAS, Apple/Google kimlik bilgilerini sorar (Apple için App Store Connect API
anahtarı veya Apple ID; Google için service account JSON — Play Console'dan).

---

## 7. Apple inceleme ipuçları (red yememek için)
- ✅ **Hesap silme uygulama içinde var** (Profil → "Hesabımı Sil"). Apple bunu
  zorunlu tutuyor (kural 5.1.1(v)) — eklendi.
- ✅ **Konum izni açıklaması** net (yalnızca yakınlık için) — eklendi.
- **Demo hesabı ver:** inceleme notuna test e-postası/şifresi yaz; bir de
  işletme hesabı ver ki işletme paneli görülebilsin.
- **Gizlilik politikası URL'si** çalışır durumda olmalı.

---

## 8. Sonraki sürümler
- Görünür sürümü değiştirmek için `app.json > expo.version`'ı yükselt
  (örn. 1.0.1), commit et, tekrar `build` + `submit`. Build numarası otomatik.

---

## 9. Bilinen kurulum bağımlılıkları (HANDOFF §6.5 ile aynı)
Uygulama bunlarsız da çalışır; ilgili özellik için gerekir:
- **Foto yükleme:** Firebase Storage etkin + `firebase/storage.rules` yayınlı olmalı.
- **Admin "kullanıcı sil / şifre güncelle" ve otomatik sadakat puanı:**
  `functions/` klasörü deploy edilmeli (Blaze planı + `firebase deploy --only functions`).
- **Uzak push bildirimleri:** EAS projectId + FCM/APNs (yerel hatırlatmalar
  bunsuz çalışır).

> ⚠️ Bu commit `firebase/firestore.rules`'ı değiştirdi (kullanıcı kendi
> profilini silebilsin diye). Firebase Console → Firestore → Rules'a güncel
> içeriği yapıştırıp **Publish** etmeyi unutma.
