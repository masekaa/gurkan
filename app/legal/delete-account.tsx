import { LegalDoc, type LegalSection } from '@/components/LegalDoc';

const SECTIONS: LegalSection[] = [
  {
    heading: '1. Uygulama içinden silme (anında)',
    body:
      'Altın100 uygulamasında: Profil sekmesi → "Hesabımı Sil" → şifreni doğrula → onayla. ' +
      'Hesabın ve profil bilgilerin anında ve kalıcı olarak silinir.',
  },
  {
    heading: '2. E-posta ile talep',
    body:
      'Uygulamaya erişemiyorsan, hesabını silmek için kayıtlı e-posta adresinle ' +
      'ahmetdemirexhesap@gmail.com adresine "Hesap silme talebi" konulu bir e-posta gönder. ' +
      'Talebini en geç 30 gün içinde işleme alır ve hesabını sileriz.',
  },
  {
    heading: '3. Silinen veriler',
    body:
      'Hesabın (kimlik doğrulama kaydı) ve profil bilgilerin (ad, e-posta, telefon, ' +
      'favoriler) kalıcı olarak silinir. İşletme hesabıysan işletme profilin ve ' +
      'yüklediğin içerikler de silinir. Silme işlemi geri alınamaz.',
  },
  {
    heading: '4. Saklanan veriler',
    body:
      'Yasal yükümlülükler gereği saklanması zorunlu olan kayıtlar (ör. mevzuat ' +
      'gerektiriyorsa işlem kayıtları) varsa, yalnızca gerekli süre boyunca ve ' +
      'kimliğinle ilişkilendirilmeden tutulabilir. Bunun dışında verilerin silinir.',
  },
];

export default function DeleteAccountScreen() {
  return (
    <LegalDoc
      title="Hesap Silme"
      updated="14 Haziran 2026"
      intro="Altın100 hesabını ve verilerini istediğin zaman silebilirsin. İki yol vardır:"
      sections={SECTIONS}
    />
  );
}
