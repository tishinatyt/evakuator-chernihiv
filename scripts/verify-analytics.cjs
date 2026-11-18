const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const C=require('../js/config.js');const live=process.argv.includes('--live');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
 const page=await browser.newPage(),hits=[],errors=[];let fail=false,leads=0;
 page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>{
  if(!/google-analytics\.com\/g\/collect/.test(request.url()))return;
  const query=new URL(request.url()).searchParams;
  for(const line of (request.postData()||'').split(/\r?\n/)){
   const params=new URLSearchParams(query);new URLSearchParams(line).forEach((value,key)=>params.set(key,value));
   if(params.get('tid')===C.gaMeasurementId)hits.push({event:params.get('en'),params:Object.fromEntries(params)});
  }
 });
 if(!live)await page.route('https://evakuator-che.online/**',route=>{
  const url=new URL(route.request().url()),file=path.resolve(url.pathname==='/'?'index.html':'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(process.cwd()+path.sep))return route.abort();
  if(!fs.existsSync(file)||!fs.statSync(file).isFile())return route.abort();
  return route.fulfill({path:file,contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.json')?'application/json':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':undefined});
 });
 await page.route(/fonts\.(googleapis|gstatic)\.com/,route=>route.abort());
 await page.route(C.supabaseFunctionUrl,route=>route.fulfill({status:fail?503:200,json:fail?{ok:false}:{ok:true,id:'qa-analytics-'+(++leads)}}));
 await page.goto(C.siteUrl+'/?qa=analytics',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof track==='function');
 await page.evaluate(()=>document.addEventListener('click',event=>{if(event.target.closest('a')&&!event.target.closest('a').getAttribute('href').startsWith('#'))event.preventDefault()},true));
 const events=()=>page.evaluate(()=>dataLayer.map(item=>Array.from(item)).filter(item=>item[0]==='event'));
 await page.evaluate(()=>document.querySelector('a[href^="tel:"]').click());
 assert.equal((await events()).filter(item=>item[1]==='phone_click').length,0);
 const defaults=await page.evaluate(()=>dataLayer.map(item=>Array.from(item)).find(item=>item[0]==='consent'&&item[1]==='default')[2]);
 for(const key of ['analytics_storage','ad_storage','ad_user_data','ad_personalization'])assert.equal(defaults[key],'denied');
 await page.click('#cookie-accept');
 await page.evaluate(()=>gtag('set',{debug_mode:true}));
 assert.equal(await page.locator('script#tow-google-tag').count(),1);
 assert.equal(await page.locator('script[src*="/gtm.js"]').count(),0);
 const configs=await page.evaluate(()=>dataLayer.map(item=>Array.from(item)).filter(item=>item[0]==='config').map(item=>item[1]));
 assert(configs.includes(C.googleAdsId));assert(configs.includes(C.gaMeasurementId));
 await page.evaluate(()=>{
  document.querySelectorAll('a[href^="tel:"]').forEach(link=>link.click());
  for(const href of ['https://t.me/analytics_qa','viber://chat?number=000']){const link=document.createElement('a');link.href=href;document.querySelector('footer').append(link);link.click();link.remove()}
 });
 await page.fill('#name','QA_PRIVATE_NAME');await page.fill('#from','QA_PRIVATE_ADDRESS');await page.fill('#phone','+380000000000');await page.check('#lead-form [name=privacy]');
 fail=true;await page.click('#lead-form [type=submit]');await page.waitForFunction(()=>dataLayer.some(item=>item[0]==='event'&&item[1]==='lead_error'));
 fail=false;await page.click('#lead-form [type=submit]');await page.waitForFunction(()=>document.querySelector('#lead-form').hidden);
 await page.evaluate(()=>{fromPicker.choose(RouteCalculator.centre);toPicker.choose(RouteCalculator.centre)});
 await page.fill('#calc-phone','+380000000000');await page.check('#calc-privacy');await page.click('#calc-form [type=submit]');
 await page.waitForFunction(()=>dataLayer.filter(item=>item[0]==='event'&&item[1]==='lead_submit').length===2);
 const before=(await events()).filter(item=>item[1]==='conversion').length;
 await page.click('#calc-form [type=submit]');await page.waitForTimeout(300);
 assert.equal((await events()).filter(item=>item[1]==='conversion').length,before);
 assert.equal(before,2);
 assert.equal((await events()).filter(item=>item[1]==='calc_start').length,1);
 const expected=['phone_click','telegram_click','viber_click','calc_start','calc_result','lead_submit','lead_error'];
 for(let i=0;i<80&&(!expected.every(event=>hits.some(hit=>hit.event===event))||!['header','hero','calc','sticky_bar','footer'].every(location=>hits.some(hit=>hit.event==='phone_click'&&hit.params['ep.location']===location)));i++)await page.waitForTimeout(500);
 for(const event of expected)assert(hits.some(hit=>hit.event===event),'Missing GA4 Network request: '+event);
 const computed=hits.find(hit=>hit.event==='calc_result'&&hit.params['ep.mode']==='city');
 assert(computed);assert.equal(computed.params['epn.price'],'1800');assert.equal(computed.params['epn.km'],'0');
 const locations=hits.filter(hit=>hit.event==='phone_click').map(hit=>hit.params['ep.location']);
 assert.equal(await page.locator('script#tow-google-tag').count(),1);
 console.log('Observed phone locations:',locations);console.log('Google-managed scripts:',await page.locator('script[src*="googletagmanager"]').evaluateAll(nodes=>nodes.map(node=>node.src)));
 for(const location of ['header','hero','calc','sticky_bar','footer'])assert(locations.includes(location),'Missing phone location '+location);
 assert(hits.some(hit=>hit.event==='lead_submit'&&hit.params['ep.form']==='calc'));
 assert(hits.some(hit=>hit.event==='lead_submit'&&hit.params['ep.form']==='lead'));
 assert(!JSON.stringify(hits).includes('QA_PRIVATE_'));assert(!JSON.stringify(hits).includes('380000000000'));
 assert.deepEqual(errors,[]);
 const report={checked_at:new Date().toISOString(),measurementId:C.gaMeasurementId,mode:live?'deployed':'local',mocked_lead_endpoint:true,events:expected,locations,requests:hits.map(({event,params})=>({event,tid:params.tid,location:params['ep.location'],form:params['ep.form'],price:params['epn.price'],km:params['epn.km'],mode:params['ep.mode']}))};
 fs.mkdirSync('qa',{recursive:true});fs.writeFileSync('qa/analytics-network.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
