const fs = require('node:fs');
const base = require('../js/config.js').siteUrl.replace(/\/$/, '') + '/';
async function main() {
 const results=[];const urls=new Set(['', 'privacy.html','404.html','robots.txt','sitemap.xml','favicon.svg','apple-touch-icon.png','img/og-image.jpg','data/places.json','data/places-meta.json'].map(p=>new URL(p,base).href));
 for(const file of ['index.html','privacy.html','404.html']){
  const html=fs.readFileSync(file,'utf8');
  for(const m of html.matchAll(/(?:href|src|data-image)="([^"]+)"/g)){const url=new URL(m[1],base);if(url.origin===new URL(base).origin && !url.hash)urls.add(url.href);}
  for(const m of html.matchAll(/srcset="([^"]+)"/g))for(const source of m[1].split(','))urls.add(new URL(source.trim().split(/\s+/)[0],base).href);
 }
 for(const url of urls){const response=await fetch(url,{signal:AbortSignal.timeout(30000)});const body=await response.arrayBuffer();if(url.endsWith('/data/places.json')&&response.ok){require('node:assert/strict').deepEqual(JSON.parse(Buffer.from(body).toString()),JSON.parse(fs.readFileSync('data/places.json','utf8')));}results.push({url,status:response.status,type:response.headers.get('content-type'),bytes:body.byteLength});}
 fs.mkdirSync('qa',{recursive:true});fs.writeFileSync('qa/published-assets.json',JSON.stringify(results,null,2));
 const failed=results.filter(r=>r.status!==200 || !r.bytes || !r.url.startsWith(base));
 console.log(JSON.stringify({checked:results.length,failed,results},null,2));if(failed.length)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
