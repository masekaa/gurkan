import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
mkdirSync(`${here}/html`, { recursive: true });

const C = {
  gold: '#B5862B', goldSoft: '#D9B25A', goldDeep: '#8A6520',
  bg: '#F4F4F7', surface: '#FFFFFF', surfaceAlt: '#EEEEF2', border: '#E4E4EA',
  text: '#1B1B22', muted: '#6C6C77', faint: '#A6A6B0', onGold: '#241A05',
  pending: '#D9882A', approved: '#2EA85C', danger: '#D6483B', completed: '#3B7DD8',
};

const baseCss = `
*{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,"Segoe UI",Roboto,system-ui,sans-serif;}
html,body{width:100%;height:100%;overflow:hidden;}
body{display:flex;align-items:center;justify-content:center;
  background:linear-gradient(150deg, ${C.goldSoft} 0%, ${C.gold} 45%, ${C.goldDeep} 100%);}
.stage{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:3.2vh;padding:4vh 4vw;}
.caption{color:#fff;font-weight:800;font-size:4vh;line-height:1.15;text-align:center;max-width:90%;
  text-shadow:0 0.3vh 1.2vh rgba(0,0,0,.18);letter-spacing:-0.5px;}
.phone{height:80vh;width:calc(80vh * 0.462);background:#0E0E12;border-radius:6vh;padding:0.9vh;
  box-shadow:0 3vh 7vh rgba(0,0,0,.35);position:relative;}
.screen{width:100%;height:100%;border-radius:5.2vh;overflow:hidden;background:${C.bg};position:relative;display:flex;flex-direction:column;}
.sb{height:4.2vh;display:flex;align-items:center;justify-content:space-between;padding:0 5%;font-size:1.6vh;font-weight:700;color:#fff;}
.sb.dark{color:${C.text};}
.sb .r{display:flex;gap:0.7vh;align-items:center;font-size:1.5vh;}
.body{flex:1;overflow:hidden;}
/* shared bits */
.gold-head{background:linear-gradient(140deg, ${C.gold}, ${C.goldDeep});padding:0 5% 2.6vh;}
.row{display:flex;align-items:center;}
.pill{border-radius:999px;font-weight:700;}
.card{background:${C.surface};border:1px solid ${C.border};border-radius:2.4vh;}
.shadow{box-shadow:0 1.2vh 3vh rgba(27,27,34,.08);}
.muted{color:${C.muted};}
.gold{color:${C.gold};}
`;

// Authentic iOS status bar icons (cellular / wifi / battery), drawn as SVG so
// they inherit the bar color and scale with viewport height. Apple rejects
// non-iOS status bars in screenshots (Guideline 2.3.10).
const statusRight = `<span class="r">
<svg viewBox="0 0 18 12" style="height:1.15vh;width:auto"><g fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="2.8" width="3" height="9.2" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></g></svg>
<svg viewBox="0 0 16 12" style="height:1.15vh;width:auto"><path fill="currentColor" d="M8 2.2c2.4 0 4.6 1 6.2 2.6l-1.5 1.5C11.4 5 9.8 4.3 8 4.3 6.2 4.3 4.6 5 3.3 6.3L1.8 4.8C3.4 3.2 5.6 2.2 8 2.2z M8 6c1.3 0 2.6.6 3.5 1.5l-1.5 1.5C9.5 8.5 8.8 8.2 8 8.2c-.8 0-1.5.3-2 .8L4.5 7.5C5.4 6.6 6.7 6 8 6z M8 9.4l1.6 1.6c-.5.5-1 .7-1.6.7-.6 0-1.1-.2-1.6-.7L8 9.4z"/></svg>
<svg viewBox="0 0 27 13" style="height:1.25vh;width:auto"><rect x="0.6" y="0.6" width="22" height="11.8" rx="3" fill="none" stroke="currentColor" stroke-opacity="0.4" stroke-width="1"/><rect x="2.1" y="2.1" width="18.5" height="8.8" rx="1.6" fill="currentColor"/><rect x="24" y="4" width="2.2" height="5" rx="1" fill="currentColor" fill-opacity="0.5"/></svg>
</span>`;

const page = (caption, screenInner, sbDark = false) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseCss}</style></head>
<body><div class="stage"><div class="caption">${caption}</div>
<div class="phone"><div class="screen">
<div class="sb ${sbDark ? 'dark' : ''}"><span style="font-weight:600;letter-spacing:0.2px;">9:41</span>${statusRight}</div>
${screenInner}
</div></div></div></body></html>`;

// Reusable business card (discover)
const bizCard = (name, cat, icon, grad, rating, reviews, dist) => `
<div class="card shadow" style="overflow:hidden;margin-bottom:1.8vh;">
  <div style="height:9vh;background:linear-gradient(135deg,${grad[0]},${grad[1]});position:relative;display:flex;align-items:flex-start;justify-content:flex-end;padding:1.2vh;">
    <div style="position:absolute;left:1.4vh;bottom:-2vh;font-size:7vh;opacity:.14;">${icon}</div>
    <div class="pill" style="background:rgba(14,14,18,.72);color:#fff;font-size:1.4vh;padding:0.5vh 1.1vh;display:flex;gap:0.4vh;align-items:center;">★ ${rating} <span style="color:#bbb;font-weight:500;">(${reviews})</span></div>
  </div>
  <div class="row" style="padding:2.6vh 1.8vh 1.8vh;gap:1.4vh;">
    <div style="width:5.2vh;height:5.2vh;border-radius:1.6vh;background:${C.surfaceAlt};display:flex;align-items:center;justify-content:center;font-weight:800;color:${C.gold};font-size:2vh;">${name.split(' ').map(w=>w[0]).slice(0,2).join('')}</div>
    <div style="flex:1;">
      <div style="font-weight:700;color:${C.text};font-size:1.95vh;">${name}</div>
      <div class="row" style="gap:0.7vh;margin-top:0.5vh;font-size:1.45vh;color:${C.muted};">
        <span>📍 ${cat}</span><span>·</span><span class="gold" style="font-weight:700;">🚶 ${dist}</span>
      </div>
    </div>
    <span style="color:${C.faint};font-size:2vh;">›</span>
  </div>
</div>`;

const chip = (t, active) => `<span class="pill" style="padding:0.9vh 1.7vh;font-size:1.5vh;font-weight:700;white-space:nowrap;${active?`background:${C.gold};color:${C.onGold};`:`background:${C.surface};color:${C.muted};border:1px solid ${C.border};`}">${t}</span>`;

// 1) DISCOVER
const discover = `
<div class="gold-head" style="padding-top:1vh;">
  <div class="row" style="justify-content:space-between;">
    <div><div style="color:rgba(255,255,255,.8);font-size:1.5vh;font-weight:600;">Merhaba 👋</div>
      <div style="color:#fff;font-weight:800;font-size:2.9vh;">Altın100</div></div>
    <div style="width:5vh;height:5vh;border-radius:50%;background:rgba(255,255,255,.18);"></div>
  </div>
  <div class="row" style="background:#fff;border-radius:1.8vh;padding:1.4vh 1.6vh;margin-top:1.8vh;gap:1vh;">
    <span style="font-size:1.9vh;">🔍</span><span style="color:${C.faint};font-size:1.7vh;">Berber, kuaför, salon ara…</span>
  </div>
</div>
<div class="body" style="padding:2vh 5% 0;">
  <div class="row" style="gap:1vh;overflow:hidden;margin-bottom:1.8vh;">
    ${chip('Tümü',false)}${chip('Erkek Berberi',true)}${chip('Kadın Kuaförü',false)}${chip('Güzellik',false)}
  </div>
  <div class="row" style="gap:1vh;margin-bottom:2vh;">
    ${chip('🧭 Yakınımda',true)}${chip('★ Puan',false)}${chip('⏰ Açık',false)}
  </div>
  ${bizCard('Nilüfer Barber House','Berber Shop','💈',['#3B7DD8','#1B3A6B'],'4.8','214','1.2 km')}
  ${bizCard('Altın Makas','Erkek Berberi','✂️',[C.gold,C.goldDeep],'4.6','98','2.4 km')}
  ${bizCard('Belle Güzellik','Güzellik Merkezi','💅',['#C16B8E','#7B2E52'],'4.9','167','3.1 km')}
</div>`;

// 2) BUSINESS DETAIL
const detail = `
<div style="background:linear-gradient(140deg,#3B7DD8,#1B3A6B);padding:1vh 5% 3vh;position:relative;">
  <div class="row" style="justify-content:space-between;color:#fff;font-size:2.4vh;"><span>‹</span><span>♡</span></div>
  <div style="display:flex;flex-direction:column;align-items:center;margin-top:1vh;">
    <div style="width:8vh;height:8vh;border-radius:2.4vh;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;font-size:3.4vh;font-weight:800;color:#fff;">NB</div>
    <div style="color:#fff;font-weight:800;font-size:2.6vh;margin-top:1.2vh;">Nilüfer Barber House</div>
    <div class="row" style="gap:1vh;color:#fff;font-size:1.6vh;margin-top:0.8vh;">
      <span style="color:${C.goldSoft};">★ 4.8</span><span style="opacity:.7;">(214)</span><span>·</span><span>Berber Shop</span><span>·</span><span style="color:#7BE3A0;">Açık</span>
    </div>
  </div>
</div>
<div class="body" style="padding:2vh 5%;">
  <div class="card" style="padding:1.8vh;margin-bottom:1.8vh;">
    <div class="row" style="gap:1.2vh;font-size:1.6vh;color:${C.muted};"><span class="gold">📍</span> İhsaniye Mah. Kar Cad. No:12, Nilüfer</div>
    <div style="height:1px;background:${C.border};margin:1.4vh 0;"></div>
    <div class="row" style="gap:1.2vh;font-size:1.6vh;color:${C.muted};"><span class="gold">🚶</span> <b style="color:${C.text};">1.2 km</b> uzaklıkta</div>
    <div style="height:1px;background:${C.border};margin:1.4vh 0;"></div>
    <div class="row" style="gap:1.2vh;font-size:1.6vh;color:${C.muted};"><span class="gold">⏰</span> Bugün 09:00 – 21:00</div>
  </div>
  <div style="height:16vh;border-radius:2.4vh;overflow:hidden;position:relative;background:
    linear-gradient(0deg,#dfe7d8,#eef2ea);border:1px solid ${C.border};margin-bottom:1.8vh;">
    <div style="position:absolute;inset:0;background-image:
      linear-gradient(${C.border} 1px,transparent 1px),linear-gradient(90deg,${C.border} 1px,transparent 1px);
      background-size:3vh 3vh;opacity:.5;"></div>
    <div style="position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);font-size:3.4vh;">📍</div>
    <div class="pill" style="position:absolute;right:1.4vh;bottom:1.4vh;background:${C.gold};color:${C.onGold};font-size:1.4vh;font-weight:700;padding:0.8vh 1.4vh;">🧭 Yol Tarifi</div>
  </div>
  <div style="font-weight:800;color:${C.text};font-size:2vh;margin-bottom:1.2vh;">Hizmetler</div>
  ${['Saç Kesimi|30 dk|₺350','Saç + Sakal|45 dk|₺500'].map(s=>{const[a,b,c]=s.split('|');return `<div class="card row" style="padding:1.6vh;justify-content:space-between;margin-bottom:1.2vh;"><div><div style="font-weight:700;color:${C.text};font-size:1.8vh;">${a}</div><div class="muted" style="font-size:1.4vh;margin-top:0.3vh;">${b}</div></div><div class="gold" style="font-weight:800;font-size:1.9vh;">${c}</div></div>`}).join('')}
</div>`;

// 3) BOOKING
const slot = (t, st) => `<div style="text-align:center;padding:1.4vh 0;border-radius:1.4vh;font-size:1.6vh;font-weight:700;
  ${st==='on'?`background:${C.gold};color:${C.onGold};`:st==='off'?`background:${C.surfaceAlt};color:${C.faint};text-decoration:line-through;`:`background:${C.surface};color:${C.text};border:1px solid ${C.border};`}">${t}</div>`;
const day = (d,n,active) => `<div style="text-align:center;padding:1.4vh 0;border-radius:1.6vh;min-width:7vh;${active?`background:${C.gold};color:${C.onGold};`:`background:${C.surface};border:1px solid ${C.border};color:${C.muted};`}"><div style="font-size:1.4vh;">${d}</div><div style="font-weight:800;font-size:2.2vh;">${n}</div></div>`;
const booking = `
<div style="padding:2vh 5%;border-bottom:1px solid ${C.border};"><div class="row" style="gap:1.4vh;font-size:2.2vh;"><span>‹</span><b style="color:${C.text};">Randevu Al</b></div></div>
<div class="body" style="padding:2vh 5%;">
  <div class="card shadow" style="padding:1.8vh;margin-bottom:2vh;">
    <div class="muted" style="font-size:1.4vh;">Seçilen hizmet</div>
    <div class="row" style="justify-content:space-between;margin-top:0.6vh;"><b style="color:${C.text};font-size:2vh;">Saç + Sakal</b><span class="gold" style="font-weight:800;font-size:2vh;">₺500</span></div>
    <div class="muted" style="font-size:1.5vh;margin-top:0.4vh;">45 dk · Nilüfer Barber House</div>
  </div>
  <div style="font-weight:800;color:${C.text};font-size:1.9vh;margin-bottom:1.2vh;">Gün seç</div>
  <div class="row" style="gap:1.2vh;margin-bottom:2.2vh;">${day('Pzt','15',false)}${day('Sal','16',true)}${day('Çar','17',false)}${day('Per','18',false)}</div>
  <div style="font-weight:800;color:${C.text};font-size:1.9vh;margin-bottom:1.2vh;">Saat seç</div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1.2vh;margin-bottom:2.4vh;">
    ${slot('09:00','off')}${slot('09:45','')}${slot('10:30','on')}${slot('11:15','')}${slot('12:00','off')}${slot('12:45','')}
  </div>
  <div class="pill" style="background:linear-gradient(135deg,${C.gold},${C.goldDeep});color:${C.onGold};text-align:center;padding:1.9vh;font-weight:800;font-size:1.9vh;box-shadow:0 1.4vh 3vh rgba(181,134,43,.4);">Randevuyu Onayla</div>
</div>`;

// 4) REVIEWS + GALLERY
const review = (n,txt,stars) => `<div class="card" style="padding:1.6vh;margin-bottom:1.2vh;">
  <div class="row" style="justify-content:space-between;"><b style="color:${C.text};font-size:1.7vh;">${n}</b><span style="color:${C.gold};font-size:1.5vh;">${'★'.repeat(stars)}${'☆'.repeat(5-stars)}</span></div>
  <div class="muted" style="font-size:1.55vh;margin-top:0.7vh;line-height:1.45;">${txt}</div></div>`;
const reviews = `
<div style="padding:2vh 5%;border-bottom:1px solid ${C.border};"><div class="row" style="gap:1.4vh;font-size:2.2vh;"><span>‹</span><b style="color:${C.text};">Değerlendirmeler</b></div></div>
<div class="body" style="padding:2vh 5%;">
  <div style="font-weight:800;color:${C.text};font-size:1.9vh;margin-bottom:1.2vh;">Galeri</div>
  <div class="row" style="gap:1.2vh;margin-bottom:2.4vh;">
    ${[[C.gold,C.goldDeep],['#3B7DD8','#1B3A6B'],['#C16B8E','#7B2E52']].map(g=>`<div style="flex:1;height:11vh;border-radius:1.8vh;background:linear-gradient(135deg,${g[0]},${g[1]});display:flex;align-items:center;justify-content:center;font-size:3.4vh;opacity:.92;">💈</div>`).join('')}
  </div>
  <div class="row" style="justify-content:space-between;margin-bottom:1.2vh;">
    <div style="font-weight:800;color:${C.text};font-size:1.9vh;">Yorumlar</div>
    <div class="pill" style="background:${C.gold}1f;color:${C.gold};font-weight:700;font-size:1.4vh;padding:0.6vh 1.2vh;">★ 4.8 · 214</div>
  </div>
  ${review('Mehmet K.','Çok temiz ve özenli bir işçilik. Randevu tam saatinde başladı, kesinlikle tavsiye ederim.',5)}
  ${review('Emre T.','Sakal tıraşı harikaydı, sıcak havlu servisi çok iyiydi. Tekrar geleceğim.',5)}
  ${review('Burak A.','İlgili ekip, uygun fiyat. Randevu almak çok kolaydı.',4)}
</div>`;

// 5) PROFILE
const menuRow = (i,t) => `<div class="row" style="padding:2vh 1.8vh;gap:1.4vh;border-bottom:1px solid ${C.border};"><span style="font-size:1.9vh;">${i}</span><span style="flex:1;color:${C.text};font-size:1.8vh;">${t}</span><span style="color:${C.faint};">›</span></div>`;
const profile = `
<div class="body" style="padding:3vh 5% 0;">
  <div style="font-weight:800;color:${C.text};font-size:3vh;margin-bottom:2.4vh;">Profil</div>
  <div class="card row" style="padding:2vh;gap:1.6vh;margin-bottom:2vh;">
    <div style="width:8vh;height:8vh;border-radius:50%;background:linear-gradient(135deg,${C.gold},${C.goldDeep});display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:3vh;">A</div>
    <div style="flex:1;"><div style="font-weight:800;color:${C.text};font-size:2.1vh;">Ahmet Demir</div>
      <div class="muted" style="font-size:1.5vh;margin-top:0.3vh;">ahmet@altin100.com</div>
      <div class="muted" style="font-size:1.5vh;">+90 5xx xxx xx xx</div></div>
    <span class="gold" style="font-size:2vh;">✎</span>
  </div>
  <div class="card" style="padding:2vh;margin-bottom:2vh;">
    <div class="row" style="gap:1vh;color:${C.text};font-weight:700;font-size:1.7vh;"><span class="gold">🛡️</span> Hesap Türü</div>
    <div class="pill" style="display:inline-flex;align-items:center;gap:0.7vh;background:${C.gold}1f;border:1px solid ${C.gold}66;color:${C.gold};font-weight:700;padding:0.8vh 1.6vh;font-size:1.6vh;margin-top:1.2vh;">👤 Müşteri</div>
  </div>
  <div class="card" style="overflow:hidden;margin-bottom:2vh;">
    ${menuRow('♥','Favorilerim')}${menuRow('🔒','Gizlilik Politikası')}${menuRow('📄','Kullanım Koşulları')}
  </div>
  <div class="pill" style="background:${C.danger};color:#fff;text-align:center;padding:1.8vh;font-weight:800;font-size:1.8vh;">Çıkış Yap</div>
</div>`;

const screens = [
  ['01-discover', 'Yakınındaki en iyileri keşfet', discover, false],
  ['02-detail', 'İşletmeyi gör, mesafeyi öğren', detail, false],
  ['03-booking', 'Saniyeler içinde randevu al', booking, true],
  ['04-reviews', 'Gerçek yorumlar, gerçek kareler', reviews, true],
  ['05-profile', 'Hesabın senin kontrolünde', profile, true],
];

for (const [name, cap, inner, dark] of screens) {
  writeFileSync(`${here}/html/${name}.html`, page(cap, inner, dark));
}
console.log(`Wrote ${screens.length} HTML files to ${here}/html`);
