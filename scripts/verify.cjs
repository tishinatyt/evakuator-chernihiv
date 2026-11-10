const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
const C=require('../js/config.js'),R=require('../js/calculate.js');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:4173';
const real=fs.existsSync('data/places.json');
const places=real?JSON.parse(fs.readFileSync('data/places.json')):[R.centre,{n:'Київ',d:'м. Київ',km:150,lat:50.45,lon:30.52},{n:'Ніжин',d:'Ніжинський район',km:85,lat:51.05,lon:31.88}];
const place=n=>places.find(p=>p.n===n);
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,timeout:30000,args:['--disable-gpu','--renderer-process-limit=1']});
 async function setup(width=360,failPlaces=false,height=800){
  const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),state={payloads:[],dataRequests:0,errors:[],fail:false,hold:false,release:null};
  page.on('pageerror',e=>state.errors.push(e.message));await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  await page.route('**/data/places.json',async r=>{state.dataRequests++;await r.fulfill({status:failPlaces?503:200,contentType:'application/json',body:JSON.stringify(places)});});
  await page.route(C.supabaseFunctionUrl,async r=>{state.payloads.push(r.request().postDataJSON());if(state.hold)await new Promise(resolve=>state.release=resolve);await r.fulfill({status:state.fail?503:200,contentType:'application/json',body:state.fail?'{}':'{"ok":true}'});});
  await page.goto(base+'/?utm_source=qa&gclid=test',{waitUntil:'domcontentloaded'});await page.locator('#cookie-accept').click();assert.equal(state.dataRequests,0,'Dataset must not load on open');
  await page.locator('.hero [data-calc-link]').click();assert.equal(await page.locator('#calc-from').evaluate(e=>e===document.activeElement),true);await page.waitForFunction(()=>document.querySelector('#calc-from-hint').textContent!=='Завантажуємо населені пункти…');
  return {context,page,state};
 }
 async function choose(page,key,name){const input=page.locator('#calc-'+key);await input.fill(name);await page.locator('#calc-'+key+'-list').waitFor({state:'visible'});assert.match(await page.locator('#calc-'+key+'-list li').first().textContent(),/^Чернігів \(по місту\)/);await page.locator('#calc-'+key+'-list li').filter({hasText:name==='Чернігів'?'Чернігів (по місту)':name+', '}).first().click();}
 async function contact(page){await page.locator('#calc-phone').fill('0635056586');await page.locator('#calc-privacy').check();}
 async function submit(page,state,amount){await page.locator('#calculate-submit').click();await page.waitForFunction(()=>!document.querySelector('#calc-result').hidden);if(amount!==null)assert.equal((await page.locator('#calc-total').textContent()).replace(/\D/g,''),String(amount));else assert.match(await page.locator('#calc-total').textContent(),/за домовленістю/);}
 async function sent(page){await page.waitForFunction(()=>document.querySelector('#calc-send-status').textContent.startsWith('Заявку надіслано'));}
 try{
 for(const [width,height] of [[360,640],[360,800],[1280,800]]){
  const {context,page,state}=await setup(width,false,height);await page.waitForFunction(()=>{const r=document.querySelector('#calc-from').getBoundingClientRect();return r.top>=72&&r.bottom<=innerHeight-75;});await choose(page,'to','Чернігів');await contact(page);state.hold=true;
  await submit(page,state,1800);assert.equal(await page.locator('#calc-send-status').textContent(),'Надсилаємо заявку…');
  assert(await page.locator('#calc-result').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=60&&r.bottom<=innerHeight-75;}),'Immediate result fits viewport');
  await page.screenshot({path:`qa/route-result-${width}.png`});
  await page.waitForFunction(()=>document.querySelector('#calc-send-status').textContent==='Надсилаємо заявку…');while(!state.release)await page.waitForTimeout(10);state.release();state.hold=false;await sent(page);
  await submit(page,state,1800);assert.equal(state.payloads.length,1);
  await choose(page,'to','Київ');await submit(page,state,R.route({from:R.centre,to:place('Київ')},C.prices).amount);await sent(page);assert.equal(state.payloads[1].calculation.repeat,true);assert.equal(state.payloads[1].attribution.gclid,'test');assert.equal(state.payloads[1].type,'calc');
  await choose(page,'from','Ніжин');await choose(page,'to','Київ');await submit(page,state,R.route({from:place('Ніжин'),to:place('Київ')},C.prices).amount);await sent(page);assert.equal(state.payloads[2].calculation.approx,true);assert.match(await page.locator('#calc-breakdown').textContent(),/Відстань орієнтовна/);
  await page.locator('#calc-name').fill('Зміна');await submit(page,state,R.route({from:place('Ніжин'),to:place('Київ')},C.prices).amount);assert.match(await page.locator('#calc-send-status').textContent(),/3 розрахунки/);assert.equal(state.payloads.length,3);
  const broken=await page.locator('a[href^="#"]').evaluateAll(links=>links.map(a=>a.getAttribute('href')).filter(h=>h.length>1&&!document.getElementById(h.slice(1))));assert.deepEqual(broken,[]);
  await page.locator('.gallery-open').first().click();assert(await page.locator('#lightbox').evaluate(e=>e.open));await page.keyboard.press('Escape');assert.equal(await page.locator('#lightbox').evaluate(e=>e.open),false);
  assert.equal(await page.locator('script[src*="googletagmanager"]').count(),/^AW-\d+$/.test(C.googleAdsId)?1:0);
  for(const href of await page.locator('a[href^="tel:"]').evaluateAll(a=>a.map(x=>x.getAttribute('href'))))assert.equal(href,'tel:'+C.phone);
  await page.locator('details summary').first().click();assert(await page.locator('details').first().getAttribute('open')!==null);
  const graph=await page.locator('script[type="application/ld+json"]').evaluate(e=>JSON.parse(e.textContent)['@graph']);assert.deepEqual(await page.locator('details').evaluateAll(ds=>ds.map(d=>[d.querySelector('summary').textContent,d.querySelector('p').textContent])),graph[1].mainEntity.map(q=>[q.name,q.acceptedAnswer.text]));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(state.errors,[]);fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:`qa/routes-${width}.png`});await context.close();
 }
 // Manual fallback works even if the dictionary is unavailable.
 {
  const {context,page,state}=await setup(360,true);await page.locator('#calc-to').fill('Тестова адреса');await page.locator('#calc-to-manual-toggle').click();await page.locator('#calc-to-km').fill('40');await contact(page);state.fail=true;
  await submit(page,state,2160);await page.waitForFunction(()=>document.querySelector('#calc-send-status').textContent.includes('Не вдалося'));assert.equal(await page.locator('#calc-send-status a').getAttribute('href'),'tel:'+C.phone);assert.equal(state.payloads[0].calculation.km,80);
  await submit(page,state,2160);assert.equal(state.payloads.length,1);
  await page.locator('#calc-from-manual-toggle').click();await page.locator('#calc-from').fill('Інша адреса');await page.locator('#calc-from-km').fill('50');await page.locator('#between-km').fill('20');state.fail=false;await submit(page,state,2970);await sent(page);
  await page.locator('[name=service][value=help]').check();await page.locator('#calc-from').fill('Біля АЗС');assert(await page.locator('#calc-to').isDisabled());await submit(page,state,null);await sent(page);assert.equal(state.payloads[2].vehicle,'help');
  await page.locator('#phone').fill('0635056586');await page.locator('#lead-form [name=privacy]').check();state.fail=true;await page.locator('#lead-form [type=submit]').click();await page.waitForFunction(()=>document.querySelector('#form-status').textContent.includes('Не вдалося'));state.fail=false;await page.locator('#lead-form [type=submit]').click();await page.waitForFunction(()=>document.querySelector('#lead-form').hidden);assert.equal(state.payloads.at(-1).calculation,null);assert.deepEqual(state.errors,[]);await context.close();
 }
 // Keyboard autocomplete, invalid routes and phone, lazy once, persistent session limit.
 {
  const {context,page,state}=await setup();await page.locator('#calc-to').fill('ниж');await page.locator('#calc-to').press('ArrowDown');await page.locator('#calc-to').press('ArrowDown');await page.locator('#calc-to').press('Enter');assert.equal(await page.locator('#calc-to').inputValue(),'Ніжин');
  await page.locator('#calculate-submit').click();assert.equal(await page.locator('#calc-phone').getAttribute('aria-invalid'),'true');assert.equal(state.payloads.length,0);await contact(page);
  await page.locator('#calc-to').fill('Невідомий населений пункт');await page.locator('#calculate-submit').click();assert.equal(await page.locator('#calc-to').getAttribute('aria-invalid'),'true');assert.equal(state.payloads.length,0);
  await choose(page,'to','Ніжин');await submit(page,state,R.route({from:R.centre,to:place('Ніжин')},C.prices).amount);await sent(page);assert.equal(state.dataRequests,1);
  await page.reload({waitUntil:'domcontentloaded'});await choose(page,'to','Ніжин');await contact(page);await submit(page,state,R.route({from:R.centre,to:place('Ніжин')},C.prices).amount);assert.equal(state.payloads.length,1);assert.deepEqual(state.errors,[]);await context.close();
 }
 console.log('PASS 360/1280 client audit: no eager places request; CTA focus; city/region/intercity/help/manual/both manual; keyboard; validation; network failure; dedup/repeat/limit; lower form; phone links; anchors; FAQ/schema; overflow. Dataset: '+(real?'generated OSM':'temporary test fixtures'));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
