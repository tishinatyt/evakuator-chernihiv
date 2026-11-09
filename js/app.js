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
 if(validGa)gtag('event',kind==='form'?'generate_lead':kind==='call'?'click_to_call':'calculate_price',{event_category:'engagement'});
}
document.addEventListener('click',event=>{if(event.target.closest('a[href^="tel:"]'))conversion('call')});
const calc=$('#calc-form');let selectedCalculation=null;let currentCalculation=null;let calcTracked=false;
const vehicleNames={car:'Легковий автомобіль',suv:'Кросовер / позашляховик',minibus:'Мікроавтобус',moto:'Мотоцикл / квадроцикл',help:'Допомога на дорозі'};
const extraNames={nonRolling:'авто не на ходу',noKeys:'немає ключів',night:'21:00–23:00',winch:'витягування лебідкою'};
function updateCalc(track=false){
 const data=Object.fromEntries(new FormData(calc));
 const outside=data.mode==='outside',help=data.mode==='help';
 $('#km-field').hidden=!outside;$('#km').disabled=!outside;$('#km').required=outside;
 $('#tow-fields').hidden=help;$('#help-note').hidden=!help;
 const valid= !outside || $('#km').validity.valid;
 const amount=calculate(data,CONFIG.prices);
 const extras=help?[]:Object.keys(extraNames).filter(k=>data[k]);
 const description=help?'Допомога на дорозі':`${outside?'За місто, '+data.km+' км':'По місту'}; ${vehicleNames[data.vehicle]}${extras.length?'; '+extras.map(k=>extraNames[k]).join(', '):''}`;
 currentCalculation=valid?{amount,description,vehicle:help?'help':data.vehicle}:null;
 $('#calc-total').textContent=valid?'від '+amount.toLocaleString('uk-UA')+' грн':'Уточніть відстань';
 $('#order-calc').disabled=!valid;
 if(track&&valid&&!calcTracked){conversion('calc');calcTracked=true;}
}
if(calc){calc.addEventListener('input',()=>updateCalc(true));updateCalc();}
$('#order-calc')?.addEventListener('click',()=>{
 if(!currentCalculation)return;selectedCalculation={...currentCalculation};
 $('#vehicle').value=selectedCalculation.vehicle;
 $('#lead-calc-text').textContent=`${selectedCalculation.description}. Орієнтовно від ${selectedCalculation.amount} грн. Ціну потрібно підтвердити.`;
 $('#lead-calc').hidden=false;$('#request').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});$('#phone').focus({preventScroll:true});
});
function clearCalculation(){selectedCalculation=null;$('#lead-calc').hidden=true}
$('#clear-calc')?.addEventListener('click',clearCalculation);
$('#vehicle')?.addEventListener('change',()=>{if(selectedCalculation&&$('#vehicle').value!==selectedCalculation.vehicle)clearCalculation()});
const phone=$('#phone');
phone?.addEventListener('input',()=>{
 let d=phone.value.replace(/\D/g,'');if(d.startsWith('380'))d=d.slice(3);else if(d.startsWith('0'))d=d.slice(1);d=d.slice(0,9);
 phone.value=d?'+380 '+d.slice(0,2)+(d.length>2?' '+d.slice(2,5):'')+(d.length>5?' '+d.slice(5,7):'')+(d.length>7?' '+d.slice(7,9):''):'';
 phone.setCustomValidity(d.length===9?'':'Введіть номер у форматі +380 та 9 цифр.');
});
$('#lead-form')?.addEventListener('submit',async event=>{
 event.preventDefault();const form=event.currentTarget;const button=form.querySelector('[type=submit]');const status=$('#form-status');
 const data=Object.fromEntries(new FormData(form));data.phone='+'+data.phone.replace(/\D/g,'');
 if(!/^\+380\d{9}$/.test(data.phone)){phone.setCustomValidity('Введіть повний український номер телефону.');phone.reportValidity();return;}
 data.calculation=selectedCalculation;data.privacy=true;
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
