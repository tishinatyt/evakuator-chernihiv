const RouteCalculator = (() => {
 const centre={n:'Чернігів',d:'по місту',lat:51.4939,lon:31.2947,km:0};
 function haversine(a,b){const r=x=>x*Math.PI/180;return 6371*2*Math.asin(Math.min(1,Math.sqrt(Math.sin(r(b.lat-a.lat)/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(r(b.lon-a.lon)/2)**2)));}
 function isCity(p){return p&&p.n==='Чернігів'&&p.km===0&&!p.manual;}
 function route(input,prices){
  if(input.service==='help')return {amount:null,km:null,approx:false};
  const a=input.from,b=input.to;if(!a||!b)throw Error('Оберіть обидва пункти маршруту.');
  for(const p of [a,b])if(!Number.isFinite(p.km)||p.km<0||p.km>3000)throw Error('Вкажіть відстань від 0 до 3000 км.');
  if(isCity(a)&&isCity(b))return {amount:prices.cityBase,km:0,approx:false};
  let middle=0,approx=!!(a.approx||b.approx||a.manual||b.manual);
  if(isCity(a))middle=b.km;
  else if(isCity(b))middle=a.km;
  else if(!a.manual&&!b.manual&&a.lat===b.lat&&a.lon===b.lon)middle=0;
  else if(a.manual||b.manual){if(!Number.isFinite(input.betweenKm)||input.betweenKm<0||input.betweenKm>6000)throw Error('Вкажіть відстань між пунктами від 0 до 6000 км.');middle=input.betweenKm;approx=true;}
  else {middle=haversine(a,b)*1.3;approx=true;}
  // Keep full route precision; round only the final price up to 10 UAH.
  const km=a.km+middle+b.km;
  return {amount:Math.max(prices.cityBase,Math.ceil(km*prices.perKmOutside/10-1e-8)*10),km,approx};
 }
 function normalize(value){return String(value).toLocaleLowerCase('uk').replace(/[ʼ'’`\u02bc]/g,'').replace(/і/g,'и').replace(/є/g,'е').trim();}
 function matches(place,query){const words=normalize(place.n).split(/[\s-]+/);return normalize(query).split(/[\s-]+/).filter(Boolean).every(q=>words.some(w=>w.startsWith(q)));}
 return {centre,isCity,haversine,route,normalize,matches};
})();
if(typeof module!=='undefined')module.exports=RouteCalculator;
