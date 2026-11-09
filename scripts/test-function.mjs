import assert from 'node:assert/strict';
const env={SUPABASE_URL:'https://db.test',SUPABASE_SERVICE_ROLE_KEY:'test-key',TELEGRAM_BOT_TOKEN:'test-token',TELEGRAM_CHAT_ID:'test-chat'};
globalThis.Deno={env:{get:key=>env[key]},serve:()=>{}};
const {handler}=await import('../supabase/functions/tow-lead/index.ts');
let calls=[],rows=[],failure='';
globalThis.fetch=async(url,options={})=>{
 const method=options.method||'GET';const body=options.body?JSON.parse(options.body):null;
 calls.push({url,method,body});
 if(url.startsWith('https://db.test/rest/v1/tow_leads')){
  assert.equal(options.headers.Authorization,'Bearer test-key');
  if(failure==='db'||(failure==='patch'&&method==='PATCH'))return new Response('{}',{status:503});
  if(method==='GET'){assert(url.endsWith('?select=id&limit=1'));return new Response(JSON.stringify(rows.slice(0,1).map(r=>({id:r.id}))));}
  if(method==='POST'){const row={...body,id:rows.length+1};rows.push(row);return new Response(JSON.stringify([{id:row.id}]),{status:201});}
  if(method==='PATCH'){const id=Number(new URL(url).searchParams.get('id').slice(3));Object.assign(rows.find(r=>r.id===id),body);return new Response(null,{status:204});}
 }
 assert(url.startsWith('https://api.telegram.org/bot'));
 assert(rows.length>0,'Database insert must precede Telegram');
 if(failure==='telegram-network')throw new Error('Network');
 return new Response(JSON.stringify({ok:failure!=='telegram'}),{status:failure==='telegram'?500:200});
};
let ip=0;const request=(data,origin='http://localhost:4173',sameIp)=>new Request('https://example.com',{method:'POST',headers:{origin,'content-type':'application/json','x-forwarded-for':sameIp||String(++ip)},body:JSON.stringify(data)});
const good={phone:'+380635056586',privacy:true,vehicle:'car',name:'<b>Test & name</b>',from:'A',to:'B',comment:'<script>x</script>',calculation:{amount:1800,description:'City'},attribution:{utm_source:'google',gclid:'test'}};
assert.equal((await handler(request(good,'https://evil.example'))).status,403);
for(const data of [{...good,phone:''},{...good,privacy:false},{...good,calculation:{amount:-1,description:'x'}}])assert.equal((await handler(request(data))).status,400);
assert.equal((await handler(request({...good,comment:'x'.repeat(20000)}))).status,413);
assert.equal((await handler(request({...good,website:'spam'}))).status,200);assert.equal(calls.length,0);
assert.equal((await handler(request(good))).status,200);
assert.deepEqual(calls.map(c=>c.method),['POST','POST','PATCH']);
assert.equal(rows[0].tg_sent,true);assert.equal(rows[0].from_addr,'A');assert.equal(rows[0].to_addr,'B');assert.equal(rows[0].calc.amount,1800);assert.deepEqual(rows[0].utm,{utm_source:'google'});assert.equal(rows[0].gclid,'test');
assert(calls[1].body.text.includes('&lt;b&gt;Test &amp; name&lt;/b&gt;'));assert(!calls[1].body.text.includes('<script>'));
assert(calls[1].body.text.startsWith('<b>НОВА ЗАЯВКА</b>'));
calls=[];
assert.equal((await handler(request({...good,type:'calc',calculation:{amount:2700,description:'50 км × 2 × 27 грн',repeat:true}}))).status,200);
assert.equal(rows.at(-1).calc.type,'calc');assert.equal(rows.at(-1).calc.amount,2700);
assert(calls[1].body.text.startsWith('<b>РОЗРАХУНОК ВАРТОСТІ</b>\nповторний розрахунок'));
assert.equal((await handler(request({...good,type:'calc',from:''}))).status,400);
calls=[];
assert.equal((await handler(request({...good,vehicle:'help',calculation:{amount:null,description:'Допомога на дорозі'}}))).status,200);
assert.equal(rows.at(-1).calc.amount,null);assert(calls[1].body.text.includes('за домовленістю'));assert(!calls[1].body.text.includes('null грн'));
assert.equal((await handler(request({...good,vehicle:'car',calculation:{amount:null,description:'City'}}))).status,400);
for(const mode of ['telegram','telegram-network','patch']){
 failure=mode;calls=[];const response=await handler(request(good));assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true});assert.equal(rows.at(-1).tg_sent,false);
}
failure='db';calls=[];assert.equal((await handler(request(good))).status,503);assert.equal(calls.length,1);
failure='';delete env.TELEGRAM_BOT_TOKEN;calls=[];assert.equal((await handler(request(good))).status,200);assert.equal(calls.length,1);assert.equal(rows.at(-1).tg_sent,false);env.TELEGRAM_BOT_TOKEN='test-token';
calls=[];const ping=await handler(new Request('https://example.com?ping=1'));assert.equal(ping.status,200);assert.deepEqual(await ping.json(),{ok:true});assert.equal(calls.length,1);assert.equal(calls[0].method,'GET');
failure='db';assert.equal((await handler(new Request('https://example.com?ping=1'))).status,503);failure='';
assert.equal((await handler(new Request('https://example.com?ping=1',{headers:{origin:'https://evil.example'}}))).status,403);
for(let i=0;i<5;i++)assert.equal((await handler(request(good,undefined,'fixed'))).status,200);
assert.equal((await handler(request(good,undefined,'fixed'))).status,429);
for(const origin of ['https://evakuator-che.online','https://www.evakuator-che.online','https://tishinatyt.github.io','http://localhost:3000']){
 const response=await handler(new Request('https://example.com',{method:'OPTIONS',headers:{origin}}));assert.equal(response.status,204);assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);
}
console.log('PASS: save before Telegram, row mapping, tg_sent update, notification failure fallback, database failure, ping read only, CORS, validation, honeypot and rate limit. All services mocked.');
