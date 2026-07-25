import { LegalDoc, type LegalSection } from '@/components/LegalDoc';

const SECTIONS: LegalSection[] = [
  {
    heading: '1. Topladığımız Veriler',
    body:
      'Hesap bilgileri: ad soyad, e-posta adresi ve (isteğe bağlı) telefon numarası. ' +
      'Randevu bilgileri: seçtiğin işletme, hizmet, tarih ve saat. ' +
      'Konum: yalnızca uygulama açıkken ve izin verdiğinde, sana yakın işletmeleri ve uzaklığı göstermek için. ' +
      'İşletme hesapları için: işletme adı, adresi, çalışma saatleri ve yüklenen galeri fotoğrafları.',
  },
  {
    heading: '2. Verileri Ne İçin Kullanıyoruz',
    body:
      'Hesabını oluşturmak ve oturumunu sürdürmek, randevularını yönetmek, sana yakın ' +
      'işletmeleri ve mesafeyi göstermek, işletmeleri listelemek ve uygulamayı ' +
      'güvenli tutmak için. Verilerini sana reklam göstermek için satmıyoruz.',
  },
  {
    heading: '3. Konum İzni',
    body:
      'Konumun yalnızca sen izin verdiğinde ve uygulamayı kullanırken alınır; arka planda ' +
      'takip edilmez. İzni istediğin zaman cihaz ayarlarından kapatabilirsin; bu durumda ' +
      'yalnızca uzaklık bilgisi gösterilmez, uygulamanın geri kalanı çalışmaya devam eder.',
  },
  {
    heading: '4. Üçüncü Taraf Hizmetler',
    body:
      'Verilerin Google Firebase altyapısında (Kimlik Doğrulama, Firestore veritabanı ve ' +
      'Cloud Storage) saklanır ve işlenir. Harita görüntüleri OpenStreetMap üzerinden gelir. ' +
      'Bu sağlayıcıların kendi gizlilik politikaları geçerlidir.',
  },
  {
    heading: '5. Fotoğraflar ve İçerik Denetimi',
    body:
      'İşletmelerin yüklediği fotoğraflar yayınlanmadan önce yönetici onayından geçer. ' +
      'Uygunsuz içerik reddedilir ve yayınlanmaz.',
  },
  {
    heading: '6. Veri Saklama ve Hesap Silme',
    body:
      'Verilerini hesabın aktif olduğu sürece saklarız. Hesabını ve profil bilgilerini ' +
      'uygulama içinden Profil → "Hesabımı Sil" ile istediğin an kalıcı olarak silebilirsin.',
  },
  {
    heading: '7. Çocukların Gizliliği',
    body:
      'Uygulama 13 yaşın altındaki kullanıcılara yönelik değildir ve bilerek bu yaş ' +
      'grubundan veri toplamayız.',
  },
  {
    heading: '8. İletişim',
    body:
      'Gizlilikle ilgili sorular için bizimle iletişime geçebilirsin: ahmetdemirexhesap@gmail.com',
  },
];

export default function PrivacyScreen() {
  return (
    <LegalDoc
      title="Gizlilik Politikası"
      updated="14 Haziran 2026"
      intro="İyiKiRandevu olarak gizliliğine önem veriyoruz. Bu politika, hangi verileri neden topladığımızı ve nasıl koruduğumuzu açıklar."
      sections={SECTIONS}
    />
  );
}
