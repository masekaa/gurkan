# Altın100 — Ürün Kapsam Dokümanı (PRD)

| | |
|---|---|
| **Ürün** | Altın100 |
| **Versiyon** | MVP 1.0 |
| **Doküman Türü** | Ürün Gereksinim & Kapsam Dokümanı (PRD / Scope) |
| **Platformlar** | iOS, Android, Web (tek React Native + Expo kod tabanı) |
| **Backend** | Firebase (Auth · Firestore · Cloud Functions · Cloud Messaging) |
| **Hedef Sektör** | Berber, kuaför ve güzellik salonları |
| **Pilot Bölge** | Bursa / Nilüfer |
| **Durum** | Taslak — geliştirmeye hazır |

---

## 1. Yönetici Özeti

Altın100, berber, kuaför ve güzellik salonlarının randevu süreçlerini
dijitalleştiren; müşteri sadakatini, işletme doluluk oranını ve gelir
öngörülebilirliğini artırmayı hedefleyen çok platformlu bir randevu yönetim
platformudur. Sistem üç istemciden oluşur:

1. **Müşteri Uygulaması** — keşfet, randevu al, sadakat puanı kazan.
2. **İşletme Uygulaması** — randevu, hizmet ve takvim yönetimi, performans paneli.
3. **Admin Paneli** — platform operasyonu, işletme onayı, denetim.

MVP'nin temel başarı varsayımı: *telefon/WhatsApp ile yürüyen manuel randevu
trafiğini self-servis dijital akışa taşımak no-show oranını düşürür ve tekrar
kullanımı artırır.* Bu doküman; gereksinimleri, kabul kriterlerini, veri
modelini, mimariyi ve lansman planını bir geliştirici/ajansın doğrudan teklif
verip geliştirebileceği netlikte tanımlar.

---

## 2. Hedefler ve Başarı Kriterleri

### 2.1 İş Hedefleri

| Paydaş | Hedef |
|---|---|
| **İşletme** | Manuel randevu yükünü azaltmak, no-show'u düşürmek, doluluğu ve geliri görünür kılmak |
| **Müşteri** | Saniyeler içinde randevu, işletme keşfi, sadakat ödülleri |
| **Altın100** | Komisyon + premium üyelik geliri, bölgesel marketplace etkisi |

### 2.2 Başarı Metrikleri (İlk 6 Ay — Pilot Sonrası)

| Metrik | Hedef | Ölçüm |
|---|---|---|
| Aktif işletme | 50 | Son 30 günde ≥1 randevu işleyen |
| Kayıtlı kullanıcı | 5.000 | Toplam profil |
| Aylık randevu | 10.000 | `appointments` oluşturma |
| İşletme aktiflik oranı | %70 | Aktif / toplam onaylı işletme |
| Tekrar kullanım oranı | %30 | ≥2 randevu alan müşteri / toplam |
| No-show oranı | < %15 | `completed` dışı geçmiş randevular |

> **Kuzey Yıldızı Metriği:** *Aylık tamamlanan randevu sayısı.*

---

## 3. Kişiler (Personas)

| Persona | Profil | İhtiyaç | Sancı Noktası |
|---|---|---|---|
| **Müşteri — "Emre", 28** | Düzenli berbere giden, mobil-yerli | Hızlı randevu, sıra beklememe | Telefonla ulaşamama, dolu salon |
| **İşletme Sahibi — "Murat", 41** | 2 koltuklu berber | Takvim doluluğu, müşteri takibi | Defterle takip, gelmeyen müşteri |
| **Çalışan/Personel** | Salonda hizmet veren | Kendi takvimini görmek | Karışık randevu çakışmaları |
| **Admin — Operasyon** | Altın100 ekibi | İşletme onayı, denetim, destek | Sahte/spam kayıt, kötüye kullanım |

---

## 4. Roller ve Yetki Matrisi

| Yetenek | User | Business | Admin |
|---|:---:|:---:|:---:|
| İşletme keşfet / randevu al | ✅ | ✅ | ✅ |
| Kendi randevularını yönet | ✅ | ✅ | ✅ |
| İşletme profili & hizmet yönet | — | ✅ | ✅ |
| Gelen randevuyu onayla/iptal | — | ✅ | ✅ |
| İşletme onaylama/pasife alma | — | — | ✅ |
| Kullanıcı banla/askıya al | — | — | ✅ |
| Platform geneli raporlar | — | — | ✅ |

Roller `profiles.role` alanında tutulur ve Firestore güvenlik kurallarıyla
zorlanır (bkz. `firebase/firestore.rules`).

---

## 5. Fonksiyonel Gereksinimler

Gereksinimler izlenebilirlik için kimliklendirilmiştir (FR-x). Her birinin
**Kabul Kriteri (KK)** vardır.

### Modül 1 — Kimlik & Hesap (Auth)
- **FR-1.1** Kullanıcı e-posta + şifre ile kayıt olabilir (ad, e-posta, telefon, şifre).
  - *KK:* Geçerli bilgilerle kayıt sonrası kullanıcı oturum açmış olarak ana akışa yönlenir; `profiles` dokümanı oluşur ve benzersiz referans kodu atanır.
- **FR-1.2** Kullanıcı giriş yapabilir, çıkış yapabilir.
- **FR-1.3** Kullanıcı şifre sıfırlama e-postası talep edebilir.
- **FR-1.4** Profil bilgileri (ad, telefon) güncellenebilir.
- **FR-1.5** Oturum cihazda kalıcıdır (uygulama yeniden açıldığında giriş korunur).

### Modül 2 — İşletme & Hizmet Yönetimi
- **FR-2.1** İşletme; ad, kategori, logo, kapak, adres, telefon, çalışma saatleri ve açıklama tanımlar.
  - *KK:* Zorunlu alanlar dolmadan kayıt tamamlanamaz; kayıt `approved=false` başlar.
- **FR-2.2** İşletme hizmet ekler/düzenler/siler (ad, süre [dk], fiyat [₺]).
- **FR-2.3** Yalnızca `approved=true` işletmeler müşteri keşfetinde listelenir.
- **FR-2.4** İşletme kategorileri: Erkek Berberi, Kadın Kuaförü, Güzellik Merkezi, Barber Shop.

### Modül 3 — Randevu Sistemi
- **FR-3.1** Müşteri akışı: İşletme → Hizmet → Tarih → Saat → Onay.
  - *KK:* Çalışma saatleri dışında veya geçmiş saat için slot sunulmaz; oluşturulan randevu `pending` durumundadır.
- **FR-3.2** Randevu durumları: `pending → approved/rejected → completed`, ayrıca `cancelled`.
- **FR-3.3** İşletme gelen randevuları görüntüler, onaylar veya reddeder.
- **FR-3.4** Müşteri kendi `pending`/`approved` randevusunu iptal edebilir.
- **FR-3.5** Aynı işletme-hizmet-saat için çift rezervasyon engellenir (çakışma kontrolü).
- **FR-3.6** Müşteri randevularını "Yaklaşan / Geçmiş" olarak görür.

### Modül 4 — Bildirim Sistemi (Push / FCM)
- **FR-4.1** Müşteriye push: randevu onaylandı, reddedildi, yaklaşıyor.
- **FR-4.2** İşletmeye push: yeni randevu geldi, randevu iptal edildi.
- **FR-4.3** Otomatik hatırlatma: randevudan **24 saat** ve **1 saat** önce.
  - *KK:* Zamanlanmış görev ilgili pencerede tam bir kez bildirim üretir (idempotent).

### Modül 5 — Sadakat Sistemi
- **FR-5.1** Tamamlanan her randevu işletme bazında **+1 puan** kazandırır.
- **FR-5.2** **10 puan = 1 ücretsiz hizmet** hakkı.
- **FR-5.3** Kullanıcı; mevcut puan, kalan puan ve ücretsiz hizmet hakkını görür.
  - *KK:* Puan/ödül mantığı sunucu tarafında (Cloud Function) işlenir; istemci `loyalty` koleksiyonunu doğrudan yazamaz.

### Modül 6 — Referans Sistemi
- **FR-6.1** Her kullanıcıya benzersiz kod (`ALTIN1234` formatı) atanır.
- **FR-6.2** Yeni kullanıcı bu kodla kayıt olduğunda: **referans veren +2**, **kullanan +1** puan.
- **FR-6.3** Kod kötüye kullanımı (kendine referans, tekrar) engellenir.

### Modül 7 — İşletme Paneli (Dashboard)
- **FR-7.1** Günlük kazanç, aylık kazanç, toplam randevu, doluluk oranı (%), no-show oranı (%) gösterilir.
- **FR-7.2** Yaklaşan randevular zaman çizelgesi.

### Modül 8 — Admin Paneli
- **FR-8.1** Dashboard: toplam kullanıcı, işletme, randevu, günlük gelir.
- **FR-8.2** İşletmeler: onayla / pasife al / düzenle.
- **FR-8.3** Kullanıcılar: görüntüle / banla / askıya al.
- **FR-8.4** Randevular: listele / filtrele / durum güncelle.

---

## 6. Fonksiyonel Olmayan Gereksinimler (NFR)

| Alan | Gereksinim |
|---|---|
| **Performans** | Liste ekranları ilk içerik < 2 sn (3G dahil); etkileşim < 100 ms |
| **Erişilebilirlik** | WCAG AA renk kontrastı, min. 44pt dokunma hedefi, ekran okuyucu etiketleri |
| **Yerelleştirme** | Birincil dil Türkçe; i18n altyapısı v2 İngilizce'ye hazır |
| **Güvenlik** | Firestore Security Rules ile rol bazlı erişim; PII en aza indirgenmiş |
| **Gizlilik** | KVKK uyumu; açık rıza, veri silme talebi akışı (v1.1) |
| **Güvenilirlik** | Çevrimdışı önbellek (okuma), hata durumunda zarif bozulma |
| **Gözlemlenebilirlik** | Crash & analytics (Firebase Crashlytics + Analytics) |
| **Sürdürülebilirlik** | TypeScript strict, katmanlı mimari, %0 backend sızıntısı UI'da |

---

## 7. Teknik Mimari

```
┌─────────────────────────────────────────────┐
│  İstemciler (tek kod tabanı)                 │
│  React Native + Expo Router                  │
│  iOS · Android · Web (react-native-web)      │
└───────────────┬─────────────────────────────┘
                │  Repository katmanı (src/data)
                │  — UI backend'i bilmez —
                ▼
┌─────────────────────────────────────────────┐
│  Firebase                                    │
│  • Auth            (kimlik)                   │
│  • Firestore       (veri)                     │
│  • Cloud Functions (puan, bildirim tetik)     │
│  • Cloud Messaging (push)                     │
│  • Storage         (logo/kapak görselleri)    │
└─────────────────────────────────────────────┘
```

**Mimari ilkeler**
- **Backend-agnostik UI:** Tüm veri erişimi `src/data/repository.ts` ve
  `AuthContext` üzerinden. Backend değişimi yalnızca bu katmanı etkiler.
- **Demo modu:** Firebase yapılandırması yoksa uygulama yerleşik mock veriyle
  çalışır — sıfır kurulumla demo/geliştirme.
- **Sunucu-tarafı kritik mantık:** Puan, ödül ve bildirim üretimi Cloud
  Functions'ta; istemci `loyalty` koleksiyonunu yazamaz.

> Teknoloji notu: Orijinal kapsamdaki FlutterFlow yerine **React Native + Expo**
> seçildi; böylece **tek kod tabanı** ile web + iOS + Android hedeflenir ve ayrı
> bir Flutter Web admin paneline gerek kalmaz (admin de aynı kod tabanında web
> rotası olarak sunulabilir).

---

## 8. Veri Modeli

Koleksiyonlar ve alanlar `firebase/DATA_MODEL.md` dosyasında ayrıntılıdır.
Özet:

| Koleksiyon | Anahtar Alanlar |
|---|---|
| `profiles` | name, email, phone, role, referralCode, createdAt |
| `businesses` | name, category, address, phone, approved, openingTime, closingTime, rating |
| `services` | businessId, name, durationMin, price |
| `appointments` | customerId, businessId, serviceId, datetime, status, createdAt |
| `loyalty` | userId, businessId, points, freeServices |

İlişkiler `FK` alanlarıyla (ör. `businessId`) modellenir; Firestore'da sunucu
tarafı join olmadığından okuma katmanında uygulama-içi hidrasyon yapılır.

---

## 9. Bildirim Matrisi

| Olay | Alıcı | Kanal | Zamanlama |
|---|---|---|---|
| Yeni randevu | İşletme | Push | Anında |
| Randevu onaylandı | Müşteri | Push | Anında |
| Randevu reddedildi | Müşteri | Push | Anında |
| Randevu iptal edildi | İşletme | Push | Anında |
| Randevu hatırlatma | Müşteri | Push | 24 sa & 1 sa önce |

---

## 10. MVP Kapsamı

### 10.1 Kapsam İçi ✅
Kullanıcı kaydı · İşletme kaydı · Randevu oluşturma & onaylama · Push bildirim ·
Sadakat sistemi · Referans sistemi · İşletme paneli · Admin panel ·
Çok platform (web/iOS/Android) tek kod tabanı.

### 10.2 Kapsam Dışı (v2.0) ❌
Çoklu şube · Çoklu ülke · Online ödeme · Premium üyelik · Reklam sistemi ·
AI destekli öneriler · Dinamik fiyatlandırma · Yorum/puanlama yazma akışı.

---

## 11. Para Kazanma Modeli (Yol Haritası)

| Aşama | Model |
|---|---|
| MVP | Ücretsiz (büyüme önceliği), temel komisyon altyapısı hazır |
| v1.1 | Tamamlanan randevu başına komisyon |
| v2.0 | İşletme premium üyelik (öne çıkarma, gelişmiş rapor), reklam |

---

## 12. Riskler ve Önlemler

| Risk | Etki | Önlem |
|---|---|---|
| İşletme dijitale direnç | Yüksek | Pilotta birebir onboarding, basit arayüz |
| No-show'un sürmesi | Orta | Hatırlatma + (v1.1) iptal politikası |
| Sahte/spam kayıt | Orta | Admin onayı, e-posta doğrulama, rate-limit |
| Sezonluk talep dalgası | Düşük | Firebase otomatik ölçekleme |
| KVKK uyumu | Yüksek | Veri minimizasyonu, rıza akışı, silme talebi |

---

## 13. Lansman Planı

| Aşama | Detay |
|---|---|
| **Pilot bölge** | Bursa / Nilüfer |
| **Pilot işletme** | 10 berber |
| **Beta süresi** | 30 gün |
| **İlk hedef** | 50 işletme · 500 müşteri · 1.000 randevu |
| **Çıkış kriteri** | No-show < %15 ve işletme aktiflik > %60 sağlanınca genişleme |

---

## 14. Açık Sorular

1. İşletme uygulaması ve müşteri uygulaması **tek uygulamada rol bazlı** mı,
   yoksa **iki ayrı uygulama** olarak mı yayınlanacak? (Öneri: tek kod tabanı,
   rol bazlı akış.)
2. Online ödeme gerçekten v2'ye mi ertelenecek, yoksa kapora/no-show ücreti
   v1.1'de mi gerekli?
3. Personel (çalışan) bazlı takvim MVP'de mi, v2'de mi?
4. Yorum/puanlama yazımı MVP'de mi? (Şu an puanlar yalnızca gösterim amaçlı.)

---

*Bu doküman canlı bir belgedir; her sürümle güncellenir. Sürüm kontrolü için
değişiklikler git geçmişinde izlenir.*
