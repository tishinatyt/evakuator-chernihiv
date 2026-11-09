// Deterministic social card from the existing SVG layout and real photograph.
const sharp=require('sharp'),C=require('../js/config.js');
(async()=>{
 const photo=await sharp('img/camaro-1600.webp').resize(590,510,{fit:'cover',position:'centre'}).png().toBuffer();
 const mask=Buffer.from('<svg width="590" height="510"><rect width="590" height="510" rx="36" fill="white"/></svg>');
 const rounded=await sharp(photo).composite([{input:mask,blend:'dest-in'}]).png().toBuffer();
 const svg=Buffer.from(`<svg width="1200" height="630"><rect width="1200" height="630" fill="#FFF8F0"/><circle cx="1100" cy="50" r="300" fill="#FFEFD9"/><circle cx="70" cy="610" r="150" fill="#FFEFD9"/><g font-family="Arial" fill="#23201D"><rect x="48" y="54" width="280" height="44" rx="22" fill="#FFC531"/><text x="68" y="83" font-size="20" font-weight="bold">ЧЕРНІГІВ ТА ОБЛАСТЬ</text><text x="48" y="190" font-size="52" font-weight="bold">Евакуатор</text><text x="48" y="255" font-size="52" font-weight="bold">Чернігів</text><text x="48" y="314" font-size="29">Подача від ${C.arrivalMinutes} хвилин</text><rect x="48" y="354" width="435" height="70" rx="35" fill="#FF7A00"/><text x="76" y="400" font-size="32" font-weight="bold">${C.phoneDisplay}</text><text x="48" y="475" font-size="27" font-weight="bold">По місту — ${C.prices.cityBase} грн</text><text x="48" y="520" font-size="23" fill="#6B625A">Щодня з 5:00 до 23:00</text><path d="M48 566H500" stroke="#C89650" stroke-width="3" stroke-dasharray="12 12"/></g></svg>`);
 await sharp(svg).composite([{input:rounded,left:562,top:60}]).jpeg({quality:88}).toFile('img/og-image.jpg');
})();
