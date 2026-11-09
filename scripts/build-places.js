// One-off dataset generation; no network requests during node build.js.
// node --use-system-ca scripts/build-places.js [--refresh]
const fs=require('node:fs'),path=require('node:path');
const policy=require('./places-policy.json');
const CENTER={lat:51.4939,lon:31.2947};
const cache=path.join(__dirname,'../qa/places-cache');fs.mkdirSync(cache,{recursive:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const refresh=process.argv.includes('--refresh');
const round=n=>Math.round(n*1e4)/1e4;
function hav(a,b){const r=x=>x*Math.PI/180;return 6371*2*Math.asin(Math.min(1,Math.sqrt(Math.sin(r(b.lat-a.lat)/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(r(b.lon-a.lon)/2)**2)));}
async function request(url,options={}){const r=await fetch(url,{...options,headers:{'User-Agent':'EvakuatorChernihivPlaces/1.0 (https://evakuator-che.online/)',...options.headers},signal:AbortSignal.timeout(180000)});if(!r.ok)throw Error('HTTP '+r.status);return r.json();}
async function overpass(key,query){
 const file=path.join(cache,key+'.json');if(!refresh&&fs.existsSync(file))return JSON.parse(fs.readFileSync(file));
 const endpoints=['https://ovp.dresel.systems/api/interpreter','https://overpass.private.coffee/api/interpreter'];
 for(let i=0;i<endpoints.length;i++){try{await pause(5000);console.log('Overpass:',key,endpoints[i]);const data=await request(endpoints[i]+'?'+new URLSearchParams({data:'[out:json][timeout:150];'+query}));if(data.remark)throw Error(data.remark);fs.writeFileSync(file,JSON.stringify(data));return data;}catch(e){console.warn(key,e.message);await pause(10000);}}
 throw Error('Overpass failed for '+key+'; cached files are retained for resuming.');
}
function rings(rel){const chunks=(rel.members||[]).filter(m=>m.role==='outer'&&m.geometry?.length).map(m=>m.geometry.map(p=>[p.lon,p.lat]));const out=[];
 const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
 while(chunks.length){let line=chunks.pop();let changed=true;while(!same(line[0],line.at(-1))&&changed){changed=false;for(let i=0;i<chunks.length;i++){let q=chunks[i];if(same(line.at(-1),q.at(-1)))q=q.slice().reverse();if(same(line.at(-1),q[0])){line.push(...q.slice(1));chunks.splice(i,1);changed=true;break;}if(same(line[0],q[0]))q=q.slice().reverse();if(same(line[0],q.at(-1))){line=q.slice(0,-1).concat(line);chunks.splice(i,1);changed=true;break;}}}if(same(line[0],line.at(-1)))out.push(line);}
 return out;
}
function inside(p,ring){let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const [x,y]=ring[i],[xj,yj]=ring[j];if((y>p.lat)!==(yj>p.lat)&&p.lon<(xj-x)*(p.lat-y)/(yj-y)+x)yes=!yes;}return yes;}
function boundaries(data){return data.elements.filter(e=>e.type==='relation').map(e=>({n:e.tags['name:uk']||e.tags.name,level:Number(e.tags.admin_level),rings:rings(e)}));}
function located(p,areas){return areas.filter(a=>a.rings.some(r=>inside(p,r)));}
function places(data){return data.elements.filter(e=>e.tags?.['name:uk']||e.tags?.name).map(e=>({n:e.tags['name:uk']||e.tags.name,lat:e.lat??e.center?.lat,lon:e.lon??e.center?.lon,t:e.tags,id:e.type+e.id})).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon));}
async function main(){
 const local=await overpass('chernihiv','area["ISO3166-2"="UA-74"]->.a;nwr(area.a)["place"~"^(city|town|village|hamlet)$"];out center tags;');
 const admin=await overpass('district-geometries','rel["boundary"="administrative"]["admin_level"="6"]["name"~"^(Чернігівський|Ніжинський|Прилуцький|Корюківський|Новгород-Сіверський) район$"];out body geom;');
 const national=await overpass('national','area["ISO3166-1"="UA"]["admin_level"="2"]->.a;nwr(area.a)["place"~"^(city|town)$"];out center tags;');
 const regions=await overpass('regions','rel["ISO3166-2"~"^UA-"]["admin_level"="4"];out tags;');
 const districts=boundaries(admin),oblasts=new Map(regions.elements.map(e=>[e.tags.katotth?.slice(2,4)||e.tags.koatuu?.slice(0,2)||e.tags['ISO3166-2'].slice(3),e.tags['name:uk']||e.tags.name]));const list=[];
 const districtCodes=new Map(admin.elements.map(e=>[e.tags.katotth?.slice(0,6),e.tags['name:uk']||e.tags.name]));
 for(const p of places(local)){const district=districtCodes.get(p.t.katotth?.slice(0,6))||located(p,districts).find(x=>x.level===6)?.n;p.d=district||p.t['addr:district']||p.t['is_in:district']||'Чернігівська область';list.push(p);}
 const nationalPlaces=places(national);
 for(const p of nationalPlaces){
  const pop=Number((p.t.population||'').replace(/[\s,]/g,''));if(!(policy.regionalCentres.includes(p.n)&&['2','4','yes'].includes(p.t.capital))&&!(pop>50000))continue;
  const peer=nationalPlaces.find(q=>q.id!==p.id&&q.n===p.n&&q.t.katotth&&((p.t.wikidata&&q.t.wikidata===p.t.wikidata)||hav(q,p)<3));
  const region=oblasts.get(p.t.katotth?.slice(2,4)||p.t.koatuu?.slice(0,2)||peer?.t.katotth?.slice(2,4))||p.t['addr:region'];
  if(policy.excludedNationalNames.includes(p.n)||policy.excludedNationalRegions.includes(region))continue;
  if(![...oblasts.values()].includes(region)&&!['Київ','Чернігів'].includes(p.n)){console.warn('Unknown region, omitted:',p.n);continue;}
  p.d=region||'м. Київ';list.push(p);
 }
 const unique=[];for(const p of list.sort((a,b)=>Number(b.id.startsWith('node'))-Number(a.id.startsWith('node')))){if(!unique.some(q=>q.id===p.id||(q.n===p.n&&((q.t.wikidata&&q.t.wikidata===p.t.wikidata)||(q.t.katotth&&q.t.katotth===p.t.katotth)||(hav(q,p)<3&&q.id.replace(/\d/g,'')!==p.id.replace(/\d/g,''))))))unique.push(p);}
 const base=unique.find(p=>p.n==='Чернігів');if(!base)throw Error('No Chernihiv');Object.assign(base,CENTER,{km:0});
 unique.sort((a,b)=>a.n.localeCompare(b.n,'uk')||a.d.localeCompare(b.d,'uk'));
 // 1 source + at most 99 destinations = at most 100 coordinates/request.
 for(let i=0;i<unique.length;i+=99){const batch=unique.slice(i,i+99);const coords=[CENTER,...batch].map(p=>round(p.lon)+','+round(p.lat)).join(';');const file=path.join(cache,'osrm-'+i+'.json');let result;
  try{if(!refresh&&fs.existsSync(file)){const saved=JSON.parse(fs.readFileSync(file));if(saved.coords===coords)result=saved.result;}
   if(!result){await pause(1500);result=await request('https://router.project-osrm.org/table/v1/driving/'+coords+'?sources=0&annotations=distance&generate_hints=false');if(result.code!=='Ok')throw Error(result.message||result.code);fs.writeFileSync(file,JSON.stringify({coords,result}));}
  }catch(e){console.warn('OSRM batch',i,e.message);}
  batch.forEach((p,j)=>{if(p===base)return;const meters=result?.distances?.[0]?.[j+1];if(Number.isFinite(meters)&&meters>0){p.km=Math.round(meters/100)/10;}else{p.km=Math.round(hav(CENTER,p)*1.3*10)/10;p.approx=true;}});
  console.log('Distances',Math.min(i+99,unique.length)+'/'+unique.length);
 }
 const counts=new Map;for(const p of unique){const key=p.n+'|'+p.d;counts.set(key,(counts.get(key)||0)+1);}for(const p of unique)if(counts.get(p.n+'|'+p.d)>1)p.d+=' ('+round(p.lat)+', '+round(p.lon)+')';
 const result=unique.map(p=>({n:p.n,d:p.d,lat:round(p.lat),lon:round(p.lon),km:p.km,...(p.approx?{approx:true}:{})}));
 if(result.length<1000)throw Error('Too few Chernihiv settlements: refusing incomplete output');
 fs.mkdirSync('data',{recursive:true});fs.writeFileSync('data/places.json',JSON.stringify(result));
 const report={generated:new Date().toISOString(),count:result.length,approximate:result.filter(p=>p.approx).length,bytes:fs.statSync('data/places.json').size,centre:CENTER,source:'OpenStreetMap via Overpass; OSRM table driving',license:'ODbL-1.0',nationalExclusions:policy.excludedNationalRegions,localRecords:places(local).length};fs.writeFileSync('data/places-meta.json',JSON.stringify(report,null,2)+'\n');console.log(report);
}
main().catch(e=>{console.error(e);process.exitCode=1});
