const fs = require('node:fs');
const sharp = require('sharp');
const files = fs.readdirSync('photos').filter(f => /jpg$/i.test(f)).sort();
const names = ['camaro-portrait','camaro','acura','poster-audi','mazda','poster-city','jeep','poster-sunset','bmw'];
const masks = {0:[88,667,76,29],1:[226,461,107,39],2:[42,625,25,30],6:[84,643,29,58]};
(async()=>{
 fs.mkdirSync('img',{recursive:true});
 for(let i=0;i<files.length;i++) {
   let original=fs.readFileSync('photos/'+files[i]);
   if(masks[i]) {const [left,top,width,height]=masks[i]; const blurred=await sharp(original).extract({left,top,width,height}).blur(14).toBuffer();original=await sharp(original).composite([{input:blurred,left,top}]).png().toBuffer();}
   for(const width of [800,1600]) await sharp(original).resize({width}).webp({quality:80}).toFile(`img/${names[i]}-${width}.webp`);
 }
 const svg=fs.readFileSync('favicon.svg');
 await sharp(svg).resize(180,180).png().toFile('apple-touch-icon.png');
 const overlay=Buffer.from(`<svg width="1200" height="630"><rect y="390" width="1200" height="240" fill="#111" fill-opacity=".94"/><rect y="390" width="1200" height="7" fill="#ff7a00"/><g font-family="Arial" font-weight="bold"><text x="54" y="468" fill="white" font-size="51">ЕВАКУАТОР ЧЕРНІГІВ</text><text x="54" y="535" fill="#ff8c1a" font-size="49">063 505 65 86</text><text x="55" y="584" fill="white" font-size="27">Місто та область · Щодня з 5:00 до 23:00</text></g></svg>`);
 await sharp('img/jeep-1600.webp').resize(1200,630,{fit:'cover'}).composite([{input:overlay}]).jpeg({quality:85}).toFile('img/og-image.jpg');
})();
