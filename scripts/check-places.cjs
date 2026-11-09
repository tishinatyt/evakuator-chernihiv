const fs=require('node:fs'),assert=require('node:assert/strict'),R=require('../js/calculate.js'),C=require('../js/config.js');
const places=JSON.parse(fs.readFileSync('data/places.json')),meta=JSON.parse(fs.readFileSync('data/places-meta.json')),policy=require('./places-policy.json');
assert(places.length>1400);assert.equal(meta.count,places.length);const labels=new Set;
for(const p of places){assert(p.n&&p.d);assert(Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&Number.isFinite(p.km));assert(p.km>=0&&p.km<=3000);assert.equal(p.lat,Number(p.lat.toFixed(4)));assert.equal(p.lon,Number(p.lon.toFixed(4)));assert(!labels.has(p.n+'|'+p.d),'Ambiguous label '+p.n+' '+p.d);labels.add(p.n+'|'+p.d);assert(!policy.excludedNationalNames.includes(p.n));assert(!policy.excludedNationalRegions.includes(p.d));}
for(const name of ['Київ','Чернігів','Ніжин','Чернівці','Одеса','Полтава','Хмельницький','Кропивницький','Вінниця','Луцьк','Житомир','Ужгород','Івано-Франківськ','Львів','Рівне','Тернопіль','Черкаси'])assert.equal(places.filter(p=>p.n===name).length,1,name+' present exactly once');
assert.equal(places.filter(p=>p.n==='Миколаїв'&&p.d==='Миколаївська область').length,1);
const city=places.find(p=>p.n==='Чернігів');assert.equal(city.km,0);assert.equal(city.lat,51.4939);assert.equal(city.lon,31.2947);
assert(places.filter(p=>/район/.test(p.d)).length>1400,'District labels missing');
const examples=['Київ','Ніжин'].map(name=>{const p=places.find(p=>p.n===name);return {name,oneWayKm:p.km,...R.route({from:city,to:p},C.prices)};});
console.log(JSON.stringify({result:'PASS',places:places.length,bytes:fs.statSync('data/places.json').size,approx:places.filter(p=>p.approx).length,examples},null,2));
