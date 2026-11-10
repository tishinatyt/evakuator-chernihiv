const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-gpu','--renderer-process-limit=1']});
 const results=[];
 try{
 for(const test of [{name:'city',expected:1800},{name:'manual20',km:20,expected:1800},{name:'manual50',km:50,expected:2900},{name:'manual100',km:100,expected:5800},{name:'Nizhyn',expected:6240}]){
  const context=await browser.newContext(),page=await context.newPage(),errors=[],payloads=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  await page.route(/googletagmanager\.com|googleadservices\.com/,r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));
  await page.route('**/functions/v1/tow-lead',r=>{payloads.push(r.request().postDataJSON());return r.fulfill({json:{ok:true}})});
  await page.addInitScript(()=>localStorage.setItem('tow-consent','denied'));
  await page.goto(base+'/?qa=rate-'+Date.now(),{waitUntil:'domcontentloaded'});
  async function choose(key,name){await page.locator('#calc-'+key).fill(name);await page.locator('#calc-'+key+'-list li').filter({hasText:name==='\u0427\u0435\u0440\u043d\u0456\u0433\u0456\u0432'?'\u0427\u0435\u0440\u043d\u0456\u0433\u0456\u0432 (\u043f\u043e \u043c\u0456\u0441\u0442\u0443)':name+', '}).first().click();}
  await choose('to','\u0427\u0435\u0440\u043d\u0456\u0433\u0456\u0432');
  if(test.km){await page.locator('#calc-from-manual-toggle').click();await page.locator('#calc-from').fill('\u0422\u0415\u0421\u0422 \u0440\u0443\u0447\u043d\u0438\u0439 \u043c\u0430\u0440\u0448\u0440\u0443\u0442');await page.locator('#calc-from-km').fill(String(test.km));}
  if(test.name==='Nizhyn')await choose('from','\u041d\u0456\u0436\u0438\u043d');
  await page.locator('#calc-phone').fill('+380000000000');await page.locator('#calc-privacy').check();await page.locator('#calculate-submit').click();
  await page.waitForFunction(()=>document.querySelector('#calc-send-status').textContent.startsWith('\u0417\u0430\u044f\u0432\u043a\u0443 \u043d\u0430\u0434\u0456\u0441\u043b\u0430\u043d\u043e'));
  assert.equal(Number((await page.locator('#calc-total').textContent()).replace(/\D/g,'')),test.expected);
  assert.equal(payloads.length,1);assert.equal(payloads[0].calculation.amount,test.expected);
  if(test.km)assert.equal(payloads[0].calculation.km,test.km*2);
  if(test.name==='Nizhyn')assert.equal(payloads[0].calculation.km,215);
  const schema=await page.locator('script[type="application/ld+json"]').evaluate(e=>JSON.parse(e.textContent));
  const graph=schema['@graph'],offer=graph[0].hasOfferCatalog.itemListElement.find(x=>x.itemOffered.name==='\u0415\u0432\u0430\u043a\u0443\u0430\u0446\u0456\u044f \u0437\u0430 \u043c\u0456\u0441\u0442\u043e');
  assert.equal(offer.price,29);assert.equal(offer.priceSpecification.price,29);
  assert.deepEqual(await page.locator('details').evaluateAll(ds=>ds.map(d=>[d.querySelector('summary').textContent,d.querySelector('p').textContent])),graph[1].mainEntity.map(x=>[x.name,x.acceptedAnswer.text]));
  assert(!/\b27\s*(?:\u0433\u0440\u043d|UAH|\u20b4)/.test(await page.content()));assert.deepEqual(errors,[]);
  results.push({case:test.name,km:payloads[0].calculation.km,amount:test.expected});await context.close();
 }
 console.log(JSON.stringify({result:'PASS',base,submissions:'mocked; no live leads or conversions',results},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
