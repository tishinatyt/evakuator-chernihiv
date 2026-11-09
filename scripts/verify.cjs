const assert=require('node:assert/strict');const fs=require('node:fs');const {chromium}=require('playwright');
const C=require('../js/config.js'),calc=require('../js/calculate.js');
(async()=>{
 assert.equal(calc({mode:'city',vehicle:'car'},C.prices),900);
 assert.equal(calc({mode:'outside',vehicle:'suv',km:20,noKeys:true},C.prices),2100);
 assert.equal(calc({mode:'help',vehicle:'minibus',noKeys:true},C.prices),500);
 assert.equal(calc({mode:'city',vehicle:'moto',nonRolling:true,winch:true},C.prices),1220);
 fs.mkdirSync('qa',{recursive:true});
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-gpu','--renderer-process-limit=1']});
 const context=await browser.newContext();const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(process.env.OFFLINE_FONTS==='1')await page.route(/fonts\.(googleapis|gstatic)\.com/,route=>route.abort());
 for(const width of [360,390,768,1280,1440]){
   await page.setViewportSize({width,height:900});await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});await page.evaluate(()=>Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,3000))]));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow ${width}`);
   await page.screenshot({path:`qa/viewport-${width}.png`});
 }
 const graph=await page.locator('script[type="application/ld+json"]').evaluate(el=>JSON.parse(el.textContent)['@graph']);
 assert.equal(await page.locator('h1').count(),1);assert.equal(graph.length,4);
 const details=await page.locator('details').evaluateAll(items=>items.map(d=>({q:d.querySelector('summary').textContent,a:d.querySelector('p').textContent})));
 assert.deepEqual(details,graph[1].mainEntity.map(x=>({q:x.name,a:x.acceptedAnswer.text})));assert.equal(graph[0].hasOfferCatalog.itemListElement[0].price,C.prices.cityBase);
 assert.equal(await page.locator('script[src*="googletagmanager"]').count(),0);
 await page.locator('#cookie-decline').click();
 await page.locator('[name=mode][value=outside]').check();await page.locator('#km').fill('20');await page.locator('#calc-vehicle').selectOption('suv');await page.locator('[name=noKeys]').check();
 assert.match(await page.locator('#calc-total').textContent(),/2\s?100/);
 await page.locator('#order-calc').click();assert.equal(await page.locator('#vehicle').inputValue(),'suv');assert.match(await page.locator('#lead-calc-text').textContent(),/2100/);
 await page.locator('#phone').fill('0635056586');assert.equal(await page.locator('#phone').inputValue(),'+380 63 505 65 86');
 await page.locator('[name=privacy]').check();await page.locator('#lead-form [type=submit]').click();await page.waitForFunction(()=>document.querySelector('#form-status').textContent.includes('Не вдалося'));
 await page.evaluate(()=>{CONFIG.supabaseFunctionUrl='https://test.invalid/functions/v1/tow-lead'});
 let payload;await page.route('https://test.invalid/**',async route=>{payload=route.request().postDataJSON();await route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'})});
 await page.locator('#lead-form [type=submit]').click();await page.waitForFunction(()=>document.querySelector('#lead-form').hidden);assert.equal(payload.calculation.amount,2100);assert.deepEqual(payload.attribution,{});
 await page.locator('.gallery-open').first().click();assert.equal(await page.locator('#lightbox').evaluate(e=>e.open),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#lightbox').evaluate(e=>e.open),false);
 await page.goto('http://127.0.0.1:4173/?utm_source=google&gclid=test');await page.locator('[data-cookie-settings]').click();await page.locator('#cookie-accept').click();
 assert.deepEqual(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('tow-attribution'))),{utm_source:'google',gclid:'test'});
 assert.equal(await page.locator('script[src*="googletagmanager"]').count(),0);
 const words=await page.locator('main').innerText();console.log('Visible content words:',words.split(/\s+/).length);
 assert.equal(errors.length,0,errors.join('\n'));await browser.close();console.log('PASS: responsive widths, JSON-LD / FAQ match, calculator, mask, form success/error, lightbox, consent and attribution.');
})().catch(e=>{console.error(e);process.exit(1)});
