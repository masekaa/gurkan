# Altın100 — Mağaza Listeleme İçeriği

App Store Connect ve Google Play Console'a girilecek hazır metinler. Kopyala-yapıştır.

---

## URL'ler (zorunlu alanlar)
Web sürümü Vercel'de yayında olduğundan bu sayfalar gerçek URL'dir:

- **Gizlilik Politikası:** https://gurkan-theta.vercel.app/legal/privacy
- **Kullanım Koşulları:** https://gurkan-theta.vercel.app/legal/terms
- **Destek e-postası:** iyikirandevu@gmail.com
- **Pazarlama/Destek URL'si:** https://gurkan-theta.vercel.app

> Not: Bu sayfalar uygulama içinde de açılır (Profil → Gizlilik Politikası / Kullanım Koşulları). Mağaza son commit'i Vercel'e deploy olunca URL'ler canlanır.

---

## Temel bilgiler
- **Uygulama adı:** Altın100
- **Alt başlık (App Store, en çok 30 karakter):** Berber & güzellik randevusu
- **Kısa açıklama (Google Play, en çok 80 karakter):** Yakınındaki berber ve güzellik salonlarından saniyeler içinde randevu al.
- **Kategori:** Yaşam Tarzı (Lifestyle)
- **Anahtar kelimeler (App Store, virgülle):** berber,kuaför,randevu,güzellik,salon,tıraş,saç,bakım,işletme,yakın

---

## Tam açıklama (TR)
```
Altın100 ile berber, kuaför ve güzellik merkezlerinden randevu almak çok kolay.

• Keşfet: Yakınındaki işletmeleri haritada gör, puanlara ve yorumlara göre sırala, sana en yakın olanı bul.
• Saniyeler içinde randevu: İstediğin hizmeti ve sana uygun saati seç, randevunu anında oluştur. Çakışma yok.
• Mesafe ve yol tarifi: İşletmenin sana uzaklığını gör, tek dokunuşla yol tarifi al.
• Gerçek yorumlar: Sadece o işletmeden randevu alanların yaptığı güvenilir yorumlar.
• Favoriler: Beğendiğin işletmeleri kaydet, tekrar kolayca ulaş.
• Hatırlatma: Randevundan önce bildirim al, unutma.

İşletme misin? Altın100'de yerini al:
• Hizmetlerini, çalışma saatlerini ve konumunu yönet.
• Gelen randevuları tek panelden takip et.
• Galerine fotoğraf ekle (yönetici onayından sonra yayınlanır).

Altın100 — berber ve güzellik randevun cebinde.
```

---

## Google Play — Veri Güvenliği (Data Safety) formu cevapları
Toplanan veri türleri ("toplanır", satılmaz, aktarımda şifrelenir):
- **Kişisel bilgiler:** Ad, E-posta adresi, Telefon numarası → Uygulama işlevselliği, Hesap yönetimi.
- **Konum:** Yaklaşık konum → Uygulama işlevselliği (yakınlık/mesafe). Yalnızca kullanım sırasında, isteğe bağlı.
- **Fotoğraflar:** Kullanıcı tarafından yüklenen işletme görselleri → Uygulama işlevselliği.
- **Uygulama etkinliği:** Randevular → Uygulama işlevselliği.

Diğer beyanlar:
- Veriler **aktarım sırasında şifrelenir** (HTTPS/Firebase): Evet.
- Kullanıcı **veri silmeyi talep edebilir**: Evet (uygulama içinde Profil → Hesabımı Sil).
- Veriler üçüncü taraflarla **satılmaz**: Doğru.

---

## App Store — App Privacy cevapları
"Veri toplanıyor, kullanıcıya bağlı" olarak işaretle:
- **İletişim Bilgisi:** Ad, E-posta, Telefon → App Functionality.
- **Konum:** Coarse Location → App Functionality (izleme/reklam YOK).
- **Kullanıcı İçeriği:** Fotoğraflar → App Functionality.
- **Kullanım Verisi:** Yok / izleme yok.
- **Tracking (izleme):** Hayır. (App Tracking Transparency gerektirmez.)

İnceleme notuna ekle (App Review Notes):
```
Demo hesapları:
- Müşteri: <test-müşteri-e-posta> / <şifre>
- İşletme: <test-işletme-e-posta> / <şifre>
Hesap silme: Profil sekmesi > "Hesabımı Sil".
Konum izni yalnızca yakındaki işletmelerin uzaklığını göstermek için kullanılır.
```
> Yukarıdaki <...> alanlarına Firebase'de oluşturduğun gerçek test hesaplarını yaz.

---

## Ekran görüntüleri (senin hazırlaman gerekenler)
Telefonda şu ekranların görüntüsünü al (durum çubuğu temiz, gerçekçi veriyle):
1. Keşfet (kart listesi + mesafe rozetleri)
2. İşletme detay (mini harita + "X km uzaklıkta")
3. Randevu oluşturma (saat seçimi)
4. İşletme galerisi / yorumlar
5. Profil

Boyutlar:
- **iOS:** 6.7" (1290×2796) ve 6.5"/5.5" setleri. Xcode Simulator veya cihazdan.
- **Android:** Telefon (en az 1080×1920), birkaç kare.

---

## Sürüm notları (ilk sürüm)
```
Altın100'ün ilk sürümü: berber ve güzellik salonlarından kolayca randevu al,
yakınındakileri haritada keşfet, favorilerini kaydet.
```
