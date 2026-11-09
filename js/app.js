'use strict';
const $ = s => document.querySelector(s);
const storage = {get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v)}catch{}}};
let consent = storage.get('tow-consent');
window.dataLayer = window.dataLayer || [];
window.gtag = function(){window.dataLayer.push(arguments)};
gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
let tagsLoaded = false;
const validAds = /^AW-\d+$/.test(CONFIG.googleAdsId);
const validGa = /^G-[A-Z0-9]+$/.test(CONFIG.gaMeasurementId) && !CONFIG.gaMeasurementId.includes('XXXX');
const attributionKeys = k => /^utm_[a-z0-9_]{1,40}$/.test(k) || k === 'gclid';
function captureAttribution(){
 if(consent !== 'granted') return;
 try {const params=new URLSearchParams(location.search);const data={};for(const [k,v] of params)if(attributionKeys(k))data[k]=v.slice(0,300);if(Object.keys(data).length)sessionStorage.setItem('tow-attribution',JSON.stringify(data));} catch {}
}
function loadTags(){
 if(tagsLoaded || consent!=='granted' || (!validAds&&!validGa))return;
 tagsLoaded=true;gtag('js',new Date());
 if(validAds)gtag('config',CONFIG.googleAdsId);
 if(validGa)gtag('config',CONFIG.gaMeasurementId);
 const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(validAds?CONFIG.googleAdsId:CONFIG.gaMeasurementId);document.head.append(script);
}
function applyConsent(value){
 consent=value;const granted=value==='granted';
 gtag('consent','update',{ad_storage:granted?'granted':'denied',analytics_storage:granted?'granted':'denied',ad_user_data:granted?'granted':'denied',ad_personalization:granted?'granted':'denied'});
 if(granted){captureAttribution();loadTags();}
}
if(consent==='granted')applyConsent(consent);
const banner=$('#cookie-banner');
if(banner && !consent)banner.hidden=false;
$('#cookie-accept')?.addEventListener('click',()=>{storage.set('tow-consent','granted');applyConsent('granted');banner.hidden=true});
$('#cookie-decline')?.addEventListener('click',()=>{const reload=tagsLoaded;storage.set('tow-consent','denied');applyConsent('denied');try{sessionStorage.removeItem('tow-attribution')}catch{}banner.hidden=true;if(reload)location.reload()});
document.querySelectorAll('[data-cookie-settings]').forEach(b=>b.addEventListener('click',()=>{banner.hidden=false;$('#cookie-accept').focus()}));
function conversion(kind){
 if(consent!=='granted')return;
 const label=CONFIG.googleAdsConversionLabels[kind];
 if(validAds && label && !/XXX|PLACEHOLDER/.test(label))gtag('event','conversion',{send_to:CONFIG.googleAdsId+'/'+label});
 if(validGa)gtag('event',kind==='form'?'generate_lead':'click_to_call',{event_category:'engagement'});
}
document.addEventListener('click',event=>{if(event.target.closest('a[href^="tel:"]'))conversion('call')});
const calc=$('#calc-form');
const vehicleNames={car:'Легковий автомобіль',suv:'Кросовер / позашляховик',minibus:'Мікроавтобус',moto:'Мотоцикл / квадроцикл',help:'Допомога на дорозі'};
const extraNames={nonRolling:'не на ходу',noKeys:'немає ключів',blockedWheels:'заблоковані колеса'};
function attribution(){try{return consent==='granted'?JSON.parse(sessionStorage.getItem('tow-attribution')||'{}'):{};}catch{return {}}}
async function sendLead(data){
 if(!/^https:\/\//.test(CONFIG.supabaseFunctionUrl)||CONFIG.supabaseFunctionUrl.includes('PLACEHOLDER'))throw new Error('Not configured');
 const response=await fetch(CONFIG.supabaseFunctionUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(30000)});
 const result=await response.json();if(!response.ok||result.ok!==true)throw new Error('Send failed');
}
function sendError(status){status.textContent='Не вдалося надіслати заявку — зателефонуйте нам: ';const link=document.createElement('a');link.href='tel:'+CONFIG.phone;link.textContent=CONFIG.phoneDisplay;status.append(link);}
for(const phone of document.querySelectorAll('input[type="tel"]'))phone.addEventListener('input',()=>{
 let d=phone.value.replace(/\D/g,'');if(d.startsWith('380'))d=d.slice(3);else if(d.startsWith('0'))d=d.slice(1);d=d.slice(0,9);
 phone.value=d?'+380 '+d.slice(0,2)+(d.length>2?' '+d.slice(2,5):'')+(d.length>5?' '+d.slice(5,7):'')+(d.length>7?' '+d.slice(7,9):''):'';
 phone.setCustomValidity(d.length===9?'':'Введіть номер у форматі +380 та 9 цифр.');
});
let calcHistory=[];
try{const saved=JSON.parse(sessionStorage.getItem('tow-calc-history')||'[]');if(Array.isArray(saved))calcHistory=saved.slice(0,3);}catch{}
let calcVersion=0;
function calcFields(){const mode=calc.elements.mode.value;$('#km-field').hidden=mode!=='outside';$('#km').disabled=mode!=='outside';$('#km').required=mode==='outside';$('#calc-to-field').hidden=mode==='help';$('#calc-to').disabled=mode==='help';$('#calc-to').required=mode!=='help';}
function fieldError(field){
 if(field.disabled)return '';
 if(field.name==='phone'&&!/^\+380\d{9}$/.test('+'+field.value.replace(/\D/g,'')))return 'Введіть повний номер: +380 та 9 цифр.';
 if(field.name==='privacy'&&!field.checked)return 'Підтвердьте згоду на обробку даних.';
 if(field.required&&!field.value.trim())return field.name==='from'?'Вкажіть адресу або місце подачі.':field.name==='to'?'Вкажіть адресу доставки.':'Вкажіть відстань від Чернігова.';
 if(!field.validity.valid)return field.name==='km'?'Введіть ціле число від 1 до 2000 км.':'Перевірте значення поля.';
 return '';
}
if(calc){
 calcFields();calc.addEventListener('input',event=>{calcFields();const field=event.target;const error=$('#'+field.id+'-error');if(error){error.textContent='';field.removeAttribute('aria-invalid');}});
 calc.addEventListener('submit',async event=>{
  event.preventDefault();let first=null;
  for(const field of calc.querySelectorAll('input[required]')){const message=fieldError(field);const error=$('#'+field.id+'-error');if(error)error.textContent=message;field.setAttribute('aria-invalid',String(!!message));if(message&&!first)first=field;}
  if(first){first.focus();return;}
  const data=Object.fromEntries(new FormData(calc));const help=data.mode==='help',outside=data.mode==='outside';
  const extras=Object.keys(extraNames).filter(k=>data[k]);const amount=calculate(data,CONFIG.prices);
  const breakdown=help?'':outside?`${data.km} км × 2 (туди й назад) × ${CONFIG.prices.perKmOutside} грн; мінімум ${CONFIG.prices.cityBase} грн.`:`По місту — фіксовано ${CONFIG.prices.cityBase} грн.`;
  const calculation={type:'calc',amount,mode:data.mode,km:outside?Number(data.km):null,vehicle:data.vehicle,extras,description:`${help?'Допомога на дорозі':breakdown}; ${vehicleNames[data.vehicle]}${extras.length?'; '+extras.map(k=>extraNames[k]).join(', '):''}`};
  const payload={type:'calc',from:data.from.trim(),to:help?'':data.to.trim(),phone:'+'+data.phone.replace(/\D/g,''),name:data.name.trim(),vehicle:help?'help':data.vehicle,website:data.website,privacy:true,calculation,attribution:attribution()};
  const version=++calcVersion;$('#calc-result').hidden=false;$('#calc-heading').hidden=help;
  $('#calc-total').textContent=help?'Вартість — за домовленістю, передзвонимо протягом 5 хвилин':'від '+amount.toLocaleString('uk-UA')+' грн';
  $('#calc-breakdown').textContent=breakdown;
  $('#calc-callback').textContent=help?'':'Диспетчер передзвонить протягом 5 хвилин, щоб підтвердити ціну та час подачі';
  const status=$('#calc-send-status');status.textContent='';
  // Reserve room below the button; keep the result in view even with a mobile keyboard open.
  document.activeElement?.blur();const area=$('.calc-submit-area');area.scrollIntoView({block:'center',behavior:'instant'});
  const fingerprint=JSON.stringify([payload.from,payload.to,payload.phone,payload.name,calculation]);
  // Store hashes only, never contact details, in sessionStorage.
  let hash=2166136261;for(const ch of fingerprint)hash=Math.imul(hash^ch.charCodeAt(0),16777619);const key=(hash>>>0).toString(16);
  const previous=calcHistory.find(x=>x.key===key);
  if(previous){if(previous.status==='failed')sendError(status);else status.textContent=previous.status==='sent'?'Цей розрахунок уже надіслано. Очікуйте дзвінка.':'Цей розрахунок уже надсилається.';return;}
  if(calcHistory.length>=3){status.textContent='Ви вже надіслали 3 розрахунки за цей сеанс. Для уточнення зателефонуйте нам.';return;}
  calculation.repeat=calcHistory.length>0;const entry={key,status:'pending'};calcHistory.push(entry);
  const save=()=>{try{sessionStorage.setItem('tow-calc-history',JSON.stringify(calcHistory));}catch{}};save();
  status.textContent='Надсилаємо заявку…';
  try{await sendLead(payload);entry.status='sent';if(version===calcVersion)status.textContent='Заявку надіслано. Очікуйте дзвінка диспетчера.';conversion('form');}
  catch{entry.status='failed';if(version===calcVersion)sendError(status);}finally{save();}
 });
}
const phone=$('#phone');
$('#lead-form')?.addEventListener('submit',async event=>{
 event.preventDefault();const form=event.currentTarget;const button=form.querySelector('[type=submit]');const status=$('#form-status');
 const data=Object.fromEntries(new FormData(form));data.phone='+'+data.phone.replace(/\D/g,'');
 if(!/^\+380\d{9}$/.test(data.phone)){phone.setCustomValidity('Введіть повний український номер телефону.');phone.reportValidity();return;}
 data.calculation=null;data.privacy=true;
 try{data.attribution=consent==='granted'?JSON.parse(sessionStorage.getItem('tow-attribution')||'{}'):{};}catch{data.attribution={}}
 button.disabled=true;button.textContent='Надсилаємо…';status.textContent='';
 try{
   if(!/^https:\/\//.test(CONFIG.supabaseFunctionUrl)||CONFIG.supabaseFunctionUrl.includes('PLACEHOLDER'))throw new Error('Not configured');
   const response=await fetch(CONFIG.supabaseFunctionUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(30000)});
   const result=await response.json();if(!response.ok||result.ok!==true)throw new Error('Send failed');
   form.hidden=true;status.innerHTML='<h3>Дякуємо! Передзвонимо протягом 5 хвилин</h3><p>У робочий час: щодня з 5:00 до 23:00. Заявки поза графіком опрацюємо наступного робочого ранку.</p>';status.focus();conversion('form');
 }catch{
   status.textContent='Не вдалося надіслати заявку. Спробуйте ще раз або зателефонуйте: ';const link=document.createElement('a');link.href='tel:'+CONFIG.phone;link.textContent=CONFIG.phoneDisplay;status.append(link);status.focus();
 }finally{button.disabled=false;button.textContent='Надіслати заявку ↗';}
});
const lightbox=$('#lightbox');let opener=null;
document.querySelectorAll('.gallery-open').forEach(button=>button.addEventListener('click',()=>{opener=button;$('#lightbox-image').src=button.dataset.image;$('#lightbox-image').alt=button.dataset.alt;$('#lightbox-caption').textContent=button.dataset.alt;lightbox.showModal();}));
$('#lightbox-close')?.addEventListener('click',()=>lightbox.close());
lightbox?.addEventListener('click',e=>{if(e.target===lightbox){const r=lightbox.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)lightbox.close()}});
lightbox?.addEventListener('close',()=>opener?.focus());
if('IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('pending');observer.unobserve(entry.target)}}),{threshold:.06});
 document.querySelectorAll('.reveal').forEach(el=>{if(el.getBoundingClientRect().top>innerHeight){el.classList.add('pending');observer.observe(el)}});
}
