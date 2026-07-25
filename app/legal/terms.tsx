import { LegalDoc, type LegalSection } from '@/components/LegalDoc';

const SECTIONS: LegalSection[] = [
  {
    heading: '1. Hizmet',
    body:
      'İyiKiRandevu, berber, kuaför ve güzellik merkezlerini keşfetmeni ve bu işletmelerden ' +
      'randevu almanı sağlayan bir platformdur. Randevu hizmetini işletmeler sunar; ' +
      'İyiKiRandevu işletme ile müşteriyi buluşturan aracıdır.',
  },
  {
    heading: '2. Hesap',
    body:
      'Doğru ve güncel bilgilerle hesap oluşturmayı kabul edersin. Hesabının güvenliğinden ' +
      've şifreni gizli tutmaktan sen sorumlusun.',
  },
  {
    heading: '3. Randevular',
    body:
      'Oluşturduğun randevular seçtiğin işletmenin onayına ve kurallarına tabidir. ' +
      'İptaller, işletmenin belirlediği iptal penceresi içinde yapılabilir. ' +
      'Hizmetin sunulmasından ilgili işletme sorumludur.',
  },
  {
    heading: '4. İşletme Hesapları ve Listeleme',
    body:
      'İşletmelerin Keşfet’te listelenmesi yönetici onayına bağlıdır ve ücretsizdir. ' +
      'İşletmeler yükledikleri içeriğin doğruluğundan ve haklarından sorumludur.',
  },
  {
    heading: '5. İçerik ve Yorumlar',
    body:
      'Yorumlar yalnızca ilgili işletmeden randevu almış kullanıcılar tarafından yapılabilir. ' +
      'Yüklenen fotoğraflar yönetici onayından geçer. Yasa dışı, yanıltıcı veya uygunsuz ' +
      'içerikler kaldırılabilir.',
  },
  {
    heading: '6. Sorumluluk Reddi',
    body:
      'İyiKiRandevu, işletmelerin sunduğu hizmetlerin kalitesi konusunda garanti vermez. ' +
      'Uygulama "olduğu gibi" sunulur; kesintisiz veya hatasız olacağı garanti edilmez.',
  },
  {
    heading: '7. Fesih',
    body:
      'Bu koşulları ihlal eden hesapları askıya alabilir veya kapatabiliriz. Hesabını ' +
      'istediğin an uygulama içinden silebilirsin.',
  },
  {
    heading: '8. İletişim',
    body: 'Sorularınız için: ahmetdemirexhesap@gmail.com',
  },
];

export default function TermsScreen() {
  return (
    <LegalDoc
      title="Kullanım Koşulları"
      updated="14 Haziran 2026"
      intro="İyiKiRandevu’yu kullanarak aşağıdaki koşulları kabul etmiş olursun."
      sections={SECTIONS}
    />
  );
}
