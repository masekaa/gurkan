# Altın100 — Admin Cloud Functions

Server-side (Firebase Admin SDK) functions that the admin client calls. These do
what the client SDK **cannot**: permanently delete a user's Auth account and set
a user's password. Each function verifies the caller is an admin by reading
`profiles/{uid}.role == 'admin'` in Firestore.

| Function | Tür | Ne yapar |
|---|---|---|
| `adminDeleteUser({ uid })` | callable | Auth hesabı + profil + sahip işletmeleri siler |
| `adminSetPassword({ uid, newPassword })` | callable | Şifre günceller (min 6 karakter) |
| `onAppointmentCompleted` | Firestore trigger | Randevu 'completed' olunca sadakat puanı +1 (10 puan = 1 ücretsiz hizmet). `loyalty` koleksiyonu istemciye kapalı olduğundan sunucu tarafında yazılır. |

## Önkoşullar
- Firebase projesi **Blaze (kullandıkça öde)** planında olmalı. Cloud Functions
  ücretsiz katmanı düşük kullanımda genelde **$0**'dır, ama Blaze şart.
- Firebase CLI: `npm i -g firebase-tools` → `firebase login`.

## Deploy
```bash
cd functions
npm install
npm run deploy        # = npm run build && firebase deploy --only functions
```
İlk deploy'da proje seçilmemişse: kök dizinde `firebase use --add` ile
`gurkan-92fcf` projesini seç.

## Bölge / region
Fonksiyonlar varsayılan **us-central1**'e deploy olur; istemci `getFunctions(app)`
de varsayılan us-central1'i kullanır — uyumlu. Değiştirirsen iki tarafı da güncelle.

## İstemci tarafı
`src/lib/firebase.ts` → `functions` export'u; `src/data/repository.ts` →
`adminDeleteUser` / `adminSetUserPassword` bunları `httpsCallable` ile çağırır.
Fonksiyonlar **deploy edilmemişse**: silme, istemci tarafı yedeğe düşer
(profil + işletme silinir, Auth hesabı kalır); şifre güncelleme hata verir.

## Not
`adminDeleteUser` Firestore güvenlik kurallarını **atlar** (Admin SDK ayrıcalıklı),
ama fonksiyon içinde admin kontrolü yapılır — yani yalnızca admin çağırabilir.

## Abonelik / ödeme (sağlayıcı seçilince eklenecek)
İşletme listeleme aboneliği (`businesses.subscriptionStatus`/`subscriptionEnd`)
**sağlayıcı-bağımsız** kuruldu: veri modeli + listeleme kilidi (Keşfet yalnızca
`approved && subscriptionStatus=='active'`) + admin manuel grant/iptal
(`repository.setSubscription`) + İşletmem abonelik kartı **çalışıyor**. Eksik olan
yalnızca gerçek kart işleme.

Sağlayıcı (iyzico / PayTR / Stripe) seçilince eklenecek fonksiyonlar:
- `createSubscriptionCheckout({ businessId })` (callable): işletme sahibi çağırır;
  sağlayıcıda abonelik/checkout oturumu açar, ödeme URL'i / iFrame token döner.
- **Webhook** (HTTPS): sağlayıcıdan ödeme/iptal/yenileme bildirimini alır,
  imza doğrular, **Admin SDK ile** `businesses/{id}.subscriptionStatus` +
  `subscriptionEnd` günceller (istemci bunu YAZAMAZ — kurallar engelliyor).
- Oto-aylık yenileme sağlayıcının abonelik ürünüyle; başarısız çekimde webhook
  `past_due`/`none` yapar → işletme listeden düşer.

Güvenlik: `subscriptionStatus` yalnızca admin/webhook tarafından yazılabilir
(firestore.rules), böylece işletme parasını ödemeden kendini listeleyemez.
