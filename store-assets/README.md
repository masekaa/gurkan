# Mağaza Ekran Görüntüleri

Mağaza listelemesi için hazır, çerçeveli pazarlama görselleri. Uygulamanın
gerçek tasarım sistemiyle (altın tema, düzenler, Türkçe metinler) üretildi.

## Dosyalar
- `ios/*.png` — **1290×2796** (App Store, 6.7" iPhone)
- `android/*.png` — **1080×1920** (Google Play telefon)

5 ekran: Keşfet, İşletme detay (harita+mesafe), Randevu, Yorumlar+Galeri, Profil.

## Doğrudan kullanım
Bu PNG'ler App Store Connect ve Google Play Console'a olduğu gibi yüklenebilir.
- App Store: 6.7" seti zorunlu — `ios/` klasörünü yükle.
- Google Play: en az 2 telefon görseli — `android/` klasörünü yükle.

> İpucu: App Store diğer boyutları (6.5", 5.5") 6.7" görsellerden otomatik
> ölçekleyebilir; istersen `generate.mjs`'e farklı `--window-size` ile yeni
> ölçüler de üretebilirsin.

## Yeniden üretme / düzenleme
Metin veya düzeni değiştirmek istersen:
```bash
node store-assets/generate.mjs          # html/ klasörünü üretir
# sonra Chrome headless ile render (README sonundaki komut)
```

Render komutu (Windows, Chrome):
```bash
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
BASE="$(pwd)/store-assets"
for f in store-assets/html/*.html; do n=$(basename "$f" .html)
  "$CHROME" --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=1 --user-data-dir=/tmp/csa \
    --screenshot="$BASE/ios/$n.png" --window-size=1290,2796 "file:///$BASE/$f"
done
```

## Not
Bunlar **çerçeveli pazarlama görselleridir** (tasarımı birebir yansıtır).
İstersen gerçek cihaz ekran görüntüleriyle de değiştirebilirsin; mağazalar her
ikisini de kabul eder.
