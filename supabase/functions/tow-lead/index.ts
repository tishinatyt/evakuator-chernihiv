import { SITE_ORIGIN } from './site-config.ts';
const limits = new Map<string, { count: number; expires: number }>();
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const vehicles: Record<string,string> = {car:'Легковий автомобіль',suv:'Кросовер / позашляховик',minibus:'Мікроавтобус',moto:'Мотоцикл / квадроцикл',help:'Допомога на дорозі'};
export async function handler(request: Request): Promise<Response> {
 const origin=request.headers.get('origin') || '';
 let allowed = origin === SITE_ORIGIN;
 try {const u=new URL(origin);allowed ||= u.protocol==='http:' && ['localhost','127.0.0.1','[::1]'].includes(u.hostname);}catch{}
 const headers: Record<string,string> = {'Content-Type':'application/json; charset=utf-8','Vary':'Origin','Cache-Control':'no-store'};
 if(allowed)Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'content-type','Access-Control-Max-Age':'600'});
 const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers});
 if(!allowed)return reply(403,{error:'Origin not allowed'});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='POST')return reply(405,{error:'Method not allowed'});
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return reply(415,{error:'Expected JSON'});
 // Best effort per warm isolate, not a distributed limit.
 const now=Date.now();
 for(const [key,value] of limits)if(value.expires<now)limits.delete(key);
 const ip=(request.headers.get('x-forwarded-for')||request.headers.get('x-real-ip')||'unknown').split(',')[0].trim().slice(0,100);
 const entry=limits.get(ip)||{count:0,expires:now+600000};
 if(entry.count>=5)return reply(429,{error:'Too many requests'});
 if(limits.size>=10000&&!limits.has(ip))return reply(503,{error:'Please call'});
 entry.count++;limits.set(ip,entry);
 let data: Record<string,unknown>;
 try {
   if(Number(request.headers.get('content-length'))>16384)return reply(413,{error:'Payload too large'});
   const reader=request.body?.getReader();if(!reader)return reply(400,{error:'Missing body'});
   const chunks:Uint8Array[]=[];let total=0;
   while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>16384){await reader.cancel();return reply(413,{error:'Payload too large'});}chunks.push(value);}
   const bytes=new Uint8Array(total);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.byteLength;}
   data=JSON.parse(new TextDecoder().decode(bytes));
   if(!data||typeof data!=='object'||Array.isArray(data))return reply(400,{error:'Invalid payload'});
 }catch{return reply(400,{error:'Invalid JSON'});}
 if(data.website)return reply(200,{ok:true});
 const fields:Record<string,number>={name:80,phone:32,from:200,to:200,vehicle:30,comment:1000};
 for(const [key,max] of Object.entries(fields))if(data[key]!==undefined&&(typeof data[key]!=='string'||(data[key] as string).length>max))return reply(400,{error:'Invalid field: '+key});
 const phone=String(data.phone||'').replace(/[\s()-]/g,'');
 if(!/^\+380\d{9}$/.test(phone)||data.privacy!==true)return reply(400,{error:'Valid phone and consent required'});
 if(data.vehicle && !vehicles[String(data.vehicle)])return reply(400,{error:'Invalid vehicle'});
 const clean=(key:string)=>escape(String(data[key]||'Не вказано'));
 let calculation='Не було';
 if(data.calculation!==undefined&&data.calculation!==null){
   const c=data.calculation as Record<string,unknown>;
   if(typeof c!=='object'||typeof c.amount!=='number'||!Number.isFinite(c.amount)||c.amount<0||c.amount>10000000||typeof c.description!=='string'||c.description.length>600)return reply(400,{error:'Invalid calculation'});
   calculation=`${escape(c.description)} — від ${c.amount} грн (попередній розрахунок клієнта, підтвердити)`;
 }
 let attribution='Немає';
 if(data.attribution!==undefined){
   if(!data.attribution||typeof data.attribution!=='object'||Array.isArray(data.attribution))return reply(400,{error:'Invalid attribution'});
   const rows=Object.entries(data.attribution);if(rows.length>12)return reply(400,{error:'Too many attribution fields'});
   const out=[];
   for(const [k,v] of rows){if((!/^utm_[a-z0-9_]{1,40}$/.test(k)&&k!=='gclid')||typeof v!=='string'||v.length>300)return reply(400,{error:'Invalid attribution field'});out.push(`${escape(k)}: ${escape(v)}`);}
   attribution=out.join('\n')||'Немає';
 }
 const token=Deno.env.get('TELEGRAM_BOT_TOKEN');const chatId=Deno.env.get('TELEGRAM_CHAT_ID');
 if(!token||!chatId)return reply(503,{error:'Service unavailable'});
 const time=new Intl.DateTimeFormat('uk-UA',{timeZone:'Europe/Kyiv',dateStyle:'medium',timeStyle:'short'}).format(new Date());
 const text=`<b>НОВА ЗАЯВКА — Евакуатор</b>\n\n<b>Ім’я:</b> ${clean('name')}\n<b>Телефон:</b> <a href="tel:${phone}">${phone}</a>\n<b>Маршрут:</b> ${clean('from')} → ${clean('to')}\n<b>Тип авто:</b> ${escape(vehicles[String(data.vehicle)]||'Не вказано')}\n<b>Розрахунок:</b> ${calculation}\n<b>Коментар:</b> ${clean('comment')}\n\n<b>Джерело:</b>\n${attribution}\n\n<b>Час за Києвом:</b> ${time}`;
 if(text.length>4000)return reply(400,{error:'Please shorten comment or attribution'});
 try{
   const result=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:chatId,text,parse_mode:'HTML',link_preview_options:{is_disabled:true}}),signal:AbortSignal.timeout(10000)});
   const body=await result.json();if(!result.ok||body.ok!==true)return reply(502,{error:'Delivery failed'});
   return reply(200,{ok:true});
 }catch{return reply(502,{error:'Delivery failed'});}
}
Deno.serve(handler);
