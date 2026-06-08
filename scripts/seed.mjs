/**
 * Altın100 — Firestore seed script (örnek veri yükleme).
 *
 * Firestore boş olduğunda Keşfet ekranı boş görünür. Bu script örnek
 * işletmeleri ve hizmetleri yükler. Firebase Admin SDK kullanır; güvenlik
 * kurallarını atlar (sunucu tarafı).
 *
 * Kullanım:
 *   1) Firebase Console → Project settings → Service accounts →
 *      "Generate new private key" → indirilen dosyayı bu klasöre
 *      "serviceAccountKey.json" adıyla kaydet (git'e gitmez, .gitignore'da).
 *   2) npm install   (firebase-admin devDependency olarak ekli)
 *   3) node scripts/seed.mjs
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const keyPath = join(__dirname, '..', 'serviceAccountKey.json');

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
} catch {
  console.error(
    '\n❌ serviceAccountKey.json bulunamadı.\n' +
      '   Firebase Console → Project settings → Service accounts →\n' +
      '   "Generate new private key" ile indirip proje köküne koyun.\n',
  );
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const businesses = [
  { id: 'b1', name: 'Nilüfer Barber House', category: 'barber_shop', about: 'Nilüfer’in kalbinde modern erkek bakım deneyimi. Klasik tıraş ve saç tasarımı.', address: 'İhsaniye Mah. Kar Cad. No:12', district: 'Nilüfer / Bursa', phone: '+90 224 000 00 01', logoUrl: null, coverUrl: null, rating: 4.8, reviewCount: 214, approved: true, openingTime: '09:00', closingTime: '21:00' },
  { id: 'b2', name: 'Altın Makas Erkek Kuaförü', category: 'erkek_berberi', about: 'Mahallenin güvenilir berberi. Sıcak havlu sakak tıraşı uzmanı.', address: 'Beşevler Mah. Çiçek Sok. No:4', district: 'Nilüfer / Bursa', phone: '+90 224 000 00 02', logoUrl: null, coverUrl: null, rating: 4.6, reviewCount: 98, approved: true, openingTime: '08:30', closingTime: '20:00' },
  { id: 'b3', name: 'Belle Güzellik Merkezi', category: 'guzellik_merkezi', about: 'Cilt bakımı, lazer epilasyon ve profesyonel makyaj hizmetleri.', address: 'Görükle Mah. Üniversite Cad. No:88', district: 'Nilüfer / Bursa', phone: '+90 224 000 00 03', logoUrl: null, coverUrl: null, rating: 4.9, reviewCount: 167, approved: true, openingTime: '10:00', closingTime: '19:00' },
  { id: 'b4', name: 'Lina Kadın Kuaförü', category: 'kadin_kuaforu', about: 'Saç boyama, ombre ve özel gün saç tasarımı.', address: 'Konak Mah. Lale Cad. No:21', district: 'Nilüfer / Bursa', phone: '+90 224 000 00 04', logoUrl: null, coverUrl: null, rating: 4.7, reviewCount: 142, approved: true, openingTime: '09:30', closingTime: '20:30' },
];

const services = [
  { id: 's1', businessId: 'b1', name: 'Saç Kesimi', durationMin: 30, price: 350 },
  { id: 's2', businessId: 'b1', name: 'Sakal Tıraşı', durationMin: 20, price: 200 },
  { id: 's3', businessId: 'b1', name: 'Saç + Sakal', durationMin: 45, price: 500 },
  { id: 's4', businessId: 'b2', name: 'Saç Kesimi', durationMin: 30, price: 300 },
  { id: 's5', businessId: 'b2', name: 'Sıcak Havlu Sakal', durationMin: 25, price: 250 },
  { id: 's6', businessId: 'b3', name: 'Cilt Bakımı', durationMin: 60, price: 900 },
  { id: 's7', businessId: 'b3', name: 'Lazer Epilasyon (Bölge)', durationMin: 30, price: 700 },
  { id: 's8', businessId: 'b4', name: 'Saç Boyama', durationMin: 90, price: 1200 },
  { id: 's9', businessId: 'b4', name: 'Fön', durationMin: 30, price: 350 },
];

async function seed() {
  const batch = db.batch();
  for (const { id, ...data } of businesses) {
    batch.set(db.collection('businesses').doc(id), data, { merge: true });
  }
  for (const { id, ...data } of services) {
    batch.set(db.collection('services').doc(id), data, { merge: true });
  }
  await batch.commit();
  console.log(
    `\n✅ Yüklendi: ${businesses.length} işletme, ${services.length} hizmet.\n`,
  );
  process.exit(0);
}

seed().catch((e) => {
  console.error('Seed hatası:', e);
  process.exit(1);
});
