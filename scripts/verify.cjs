const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright');
const C=require('../js/config.js');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,timeout:30000,args:['--disable-gpu','--renderer-process-limit=1']});
 try{
 for(const width of [360,1280]){
  const context=await browser.newContext({viewport:{width,height:800}}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  const payloads=[];let release;
  await page.route(C.supabaseFunctionUrl,async r=>{payloads.push(r.request().postDataJSON());if(payloads.length===1)await new Promise(resolve=>release=resolve);await r.fulfill({status:payloads.length===3?503:200,contentType:'application/json',body:payloads.length===3?'{}':'{"ok":true}'});});
  await page.goto(base+'/?utm_source=qa&gclid=test');await page.locator('#cookie-accept').click();
  await page.locator('#calculate-submit').click();assert.equal(await page.locator('#calc-from').getAttribute('aria-invalid'),'true');assert.equal(payloads.length,0);
  await page.locator('#calc-from').fill('Чернігів');await page.locator('#calc-to').fill('Тест');await page.locator('#calc-phone').fill('0635056586');await page.locator('#calc-privacy').check();
  await page.locator('[name=mode][value=outside]').check();await page.locator('#km').fill('50');await page.locator('[name=blockedWheels]').check();
  await page.locator('#calculate-submit').click();await page.waitForFunction(()=>document.querySelector('#calc-total').textContent.includes('700'));
  assert.match(await page.locator('#calc-total').textContent(),/2\s?700/);assert.equal(await page.locator('#calc-send-status').textContent(),'Надсилаємо заявку…');
  const visible=await page.locator('#calc-result').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=60&&r.bottom<=innerHeight-75});assert(visible,'Result fully visible at '+width);
  assert.equal(payloads[0].type,'calc');assert.equal(payloads[0].calculation.amount,2700);assert.equal(payloads[0].calculation.repeat,false);assert.deepEqual(payloads[0].calculation.extras,['blockedWheels']);assert.equal(payloads[0].attribution.gclid,'test');
  release();await page.waitForFunction(()=>document.querySelector('#calc-send-status').textContent.startsWith('Заявку надіслано'));
  await page.locator('#calculate-submit').click();assert.equal(payloads.length,1);
  await page.locator('#km').fill('100');await page.locator('#calculate-submit').click();await page.waitForFunction(()=>document.querySelector('#calc-send-status').textContent.startsWith('Заявку надіслано'));assert.equal(payloads[1].calculation.repeat,true);assert.equal(payloads[1].calculation.amount,5400);
  await page.locator('[name=mode][value=help]').check();assert.equal(await page.locator('#calc-to').isDisabled(),true);await page.locator('#calculate-submit').click();await page.waitForFunction(()=>document.querySelector('#calc-send-status').textContent.includes('Не вдалося'));assert.equal(payloads[2].calculation.amount,null);assert.match(await page.locator('#calc-total').textContent(),/за домовленістю/);
  await page.locator('#calc-from').fill('Інше місце');await page.locator('#calculate-submit').click();assert.match(await page.locator('#calc-send-status').textContent(),/3 розрахунки/);assert.equal(payloads.length,3);
  await page.reload();await page.locator('#calc-from').fill('A');await page.locator('#calc-to').fill('B');await page.locator('#calc-phone').fill('0635056586');await page.locator('#calc-privacy').check();await page.locator('#calculate-submit').click();assert.match(await page.locator('#calc-send-status').textContent(),/3 розрахунки/);assert.equal(payloads.length,3);
  assert.equal(await page.locator('#order-calc').count(),0);assert.equal(await page.locator('#lead-form').count(),1);
  await page.locator('#phone').fill('0635056586');await page.locator('#lead-form [name=privacy]').check();await page.locator('#lead-form [type=submit]').click();await page.waitForFunction(()=>document.querySelector('#lead-form').hidden);assert.equal(payloads[3].calculation,null);assert.equal(payloads[3].type,undefined);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
  fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:`qa/calc-${width}.png`});await context.close();
 }
 console.log('PASS 360/1280: validation, immediate visible result before network, payload/attribution, repeat, dedup, session limit across reload, error retains price, help, separate lower form. All requests mocked.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
