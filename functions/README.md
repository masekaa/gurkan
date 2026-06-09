# Altın100 — Admin Cloud Functions

Server-side (Firebase Admin SDK) functions that the admin client calls. These do
what the client SDK **cannot**: permanently delete a user's Auth account and set
a user's password. Each function verifies the caller is an admin by reading
`profiles/{uid}.role == 'admin'` in Firestore.

| Function | Ne yapar |
|---|---|
| `adminDeleteUser({ uid })` | Kullanıcının Auth hesabını + profilini + sahip olduğu işletmeleri siler |
| `adminSetPassword({ uid, newPassword })` | Kullanıcının şifresini günceller (min 6 karakter) |

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
