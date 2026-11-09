import assert from 'node:assert/strict';
globalThis.Deno={env:{get:key=>key==='TELEGRAM_BOT_TOKEN'?'test-token':'test-chat'},serve:()=>{}};
const {handler}=await import('../supabase/functions/tow-lead/index.ts');
let sent=null;globalThis.fetch=async(url,options)=>{sent=JSON.parse(options.body);return new Response('{"ok":true}',{status:200})};
let ip=0;const request=(data,origin='http://localhost:4173',sameIp)=>new Request('https://example.com',{method:'POST',headers:{origin,'content-type':'application/json','x-forwarded-for':sameIp||String(++ip)},body:JSON.stringify(data)});
const good={phone:'+380635056586',privacy:true,vehicle:'car',name:'<b>Test & name</b>',comment:'<script>x</script>',attribution:{utm_source:'google',gclid:'test'}};
assert.equal((await handler(request(good,'https://evil.example'))).status,403);
assert.equal((await handler(request({...good,phone:'123'}))).status,400);
assert.equal((await handler(request({...good,privacy:false}))).status,400);
assert.equal((await handler(request({...good,calculation:{amount:-1,description:'x'}}))).status,400);
assert.equal((await handler(request({...good,comment:'x'.repeat(20000)}))).status,413);
assert.equal((await handler(request({...good,website:'spam'}))).status,200);assert.equal(sent,null);
assert.equal((await handler(request(good))).status,200);assert(sent.text.includes('&lt;b&gt;Test &amp; name&lt;/b&gt;'));assert(sent.text.includes('tel:+380635056586'));assert(!sent.text.includes('<script>'));
for(let i=0;i<5;i++)assert.equal((await handler(request(good,undefined,'fixed'))).status,200);
assert.equal((await handler(request(good,undefined,'fixed'))).status,429);
globalThis.fetch=async()=>new Response('{"ok":false}',{status:400});assert.equal((await handler(request(good))).status,502);
const preflight=await handler(new Request('https://example.com',{method:'OPTIONS',headers:{origin:'http://localhost:4173'}}));assert.equal(preflight.status,204);assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),'http://localhost:4173');
for(const origin of ['https://evakuator-che.online','https://www.evakuator-che.online','https://tishinatyt.github.io','http://localhost:3000','http://127.0.0.1:4173']){
 const result=await handler(new Request('https://example.com',{method:'OPTIONS',headers:{origin}}));
 assert.equal(result.status,204);assert.equal(result.headers.get('Access-Control-Allow-Origin'),origin);
}
assert.equal((await handler(new Request('https://example.com',{method:'OPTIONS',headers:{origin:'https://evakuator-che.online.evil.example'}}))).status,403);
console.log('PASS: CORS, validation, body cap, honeypot, HTML escaping, Telegram success/failure, IP limit and preflight. Telegram mocked; no live message sent.');
