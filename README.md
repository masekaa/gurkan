# Altın100

Berber, kuaför ve güzellik salonları için çok platformlu randevu ve sadakat
platformu. **Tek kod tabanı** ile web, iOS ve Android'de çalışır.

> 📄 Ürün kapsam dokümanı: [`docs/SCOPE.md`](docs/SCOPE.md)
> 🗄️ Veri modeli: [`firebase/DATA_MODEL.md`](firebase/DATA_MODEL.md)

## Teknoloji

| Katman | Seçim |
|---|---|
| İstemci | React Native + Expo (SDK 56), Expo Router |
| Web | react-native-web (aynı kod tabanı) |
| Dil | TypeScript (strict) |
| Veri/Durum | TanStack Query |
| Backend | Firebase — Auth · Firestore · Cloud Messaging |

## Mimari (kısaca)

Tüm ekranlar veriye yalnızca **repository katmanı** üzerinden erişir; backend'i
doğrudan tanımazlar. Bu sayede backend değişimi yalnızca birkaç dosyayı etkiler.

```
app/                 Ekranlar & yönlendirme (Expo Router)
  (auth)/            Giriş / kayıt
  (tabs)/            Keşfet · Randevular · Sadakat · Profil
  business/[id]      İşletme detayı
  booking/[...]      Randevu oluşturma akışı
src/
  components/        Yeniden kullanılabilir UI
  context/           AuthContext (oturum)
  data/              repository.ts (Firebase ⇄ mock), mock.ts
  hooks/             TanStack Query hook'ları
  lib/               firebase.ts, env.ts, format.ts
  theme/             Tasarım token'ları
  types/             Alan modelleri
firebase/            firestore.rules, DATA_MODEL.md
docs/                SCOPE.md (ürün kapsam dokümanı)
```

## Kurulum

```bash
npm install
npm run web      # tarayıcıda çalıştır
npm run ios      # iOS simülatör (macOS)
npm run android  # Android emülatör/cihaz
```

### Demo modu (sıfır kurulum)
Hiçbir ortam değişkeni tanımlamazsanız uygulama **yerleşik mock veriyle**
çalışır — herhangi bir e-posta/şifre ile giriş yapab, işletme keşfedebilir ve
randevu oluşturabilirsiniz. Backend'i bağlamadan denemek için idealdir.

### Firebase'i bağlama
1. [Firebase Console](https://console.firebase.google.com/)'da yeni proje açın.
2. **Authentication → Sign-in method → Email/Password** etkinleştirin.
3. **Firestore Database** oluşturun (production modu).
4. Bir **Web App** ekleyip SDK config değerlerini alın.
5. `.env.example` dosyasını `.env` olarak kopyalayıp doldurun:

```bash
cp .env.example .env
```

6. Güvenlik kurallarını dağıtın:

```bash
firebase deploy --only firestore:rules   # firebase/firestore.rules
```

`.env` dolu olduğunda uygulama otomatik olarak Firebase'e bağlanır; boşsa demo
moduna döner. (`EXPO_PUBLIC_` ön eki Expo'nun değerleri her platformda derleme
sırasında gömmesi için zorunludur.)

> **Not:** Web app ekledikten sonra sadece **Web** (`</>`) seçmeniz yeterli —
> kod Firebase JS SDK kullandığından aynı config web + iOS + Android'de çalışır.

### Örnek veri yükleme (seed)
Firebase'e bağlandığınızda Firestore **boştur**, dolayısıyla Keşfet ekranı boş
görünür. İki yöntem var:

**Yöntem 1 — Uygulama içinden (terminal gerekmez, bulut/Vercel için ideal):**
Siteye girip üye olun; Keşfet ekranı boşsa çıkan **"Örnek Verileri Yükle"**
butonuna dokunun. Örnek işletme ve hizmetler Firestore'a yazılır.
(Önce Firestore kurallarının yayınlanmış olması gerekir — bkz. yukarıdaki adım.)

**Yöntem 2 — Yerel script (Admin SDK):**

1. Firebase Console → **Project settings → Service accounts → Generate new
   private key** → indirilen dosyayı proje köküne `serviceAccountKey.json`
   adıyla kaydedin (git'e gitmez, `.gitignore`'da).
2. Çalıştırın:

```bash
node scripts/seed.mjs
```

Bu, 4 işletme ve 9 hizmeti Firestore'a ekler. (`serviceAccountKey.json` yalnızca
yerelde kullanılır; Vercel veya uygulama derlemesi için gerekmez.)

## Vercel ile Web Deploy

Web sürümü Expo'nun statik çıktısı (`expo export --platform web` → `dist/`) ile
Vercel'de yayınlanır. Yapılandırma `vercel.json` dosyasındadır:

| Ayar | Değer |
|---|---|
| Build Command | `npm run export:web` |
| Output Directory | `dist` |
| Rewrite | `/(.*) → /index.html` (SPA derin bağlantıları için) |

### Adımlar
1. [vercel.com](https://vercel.com) → **Add New → Project** → bu Git reposunu içe aktarın.
   Vercel `vercel.json`'u otomatik okur; build/output ayarlarını elle girmenize gerek yok.
2. **Settings → Environment Variables** altında Firebase değerlerini ekleyin
   (Production + Preview). Aynı isimler `.env.example`'daki gibi olmalı:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
   EXPO_PUBLIC_FIREBASE_PROJECT_ID
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   EXPO_PUBLIC_FIREBASE_APP_ID
   ```
   > Bu değişkenler **build sırasında** koda gömülür. Eklemezseniz site demo
   > modunda (mock veri) yayınlanır. Değişkenleri değiştirdikten sonra yeniden
   > deploy edin.
3. **Deploy.** Sonraki her `git push` otomatik deploy tetikler.
4. Firebase Console → **Authentication → Settings → Authorized domains** altına
   Vercel alan adınızı (`*.vercel.app` ve özel domain) ekleyin; aksi halde
   Firebase girişleri çalışmaz.

> CLI ile: `npm i -g vercel && vercel` (önizleme) / `vercel --prod` (canlı).

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run web` / `ios` / `android` | Platformda çalıştır |
| `npm run typecheck` | TypeScript denetimi |
| `npm run export:web` | Web üretim derlemesi (`dist/`) |

## Yol Haritası
MVP sonrası: Cloud Functions ile sunucu-tarafı puan/bildirim, işletme & admin
panel rotaları, online ödeme, çoklu şube. Ayrıntı için `docs/SCOPE.md` §10–11.
