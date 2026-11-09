const fs=require('node:fs');
const target=require('../js/config.js').siteUrl.replace(/\/$/, '') + '/';
// Never log the key or request URL. .env* files are ignored by Git.
let apiKey=process.env.PAGESPEED_API_KEY;
if(!apiKey&&fs.existsSync('.env.pagespeed')){
 const match=fs.readFileSync('.env.pagespeed','utf8').match(/^PAGESPEED_API_KEY\s*=\s*(.+)$/m);
 if(match)apiKey=match[1].trim().replace(/^['"]|['"]$/g,'');
}
async function run(strategy){
 const url=new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
 url.searchParams.set('url',target);url.searchParams.set('strategy',strategy);
 if(apiKey)url.searchParams.set('key',apiKey);
 for(const category of ['performance','accessibility','best-practices','seo'])url.searchParams.append('category',category);
 const response=await fetch(url,{signal:AbortSignal.timeout(240000)});const data=await response.json();
 fs.mkdirSync('qa',{recursive:true});fs.writeFileSync(`qa/pagespeed-${strategy}.json`,JSON.stringify(data,null,2));
 if(!response.ok){console.log(JSON.stringify({strategy,status:response.status,error:data.error},null,2));process.exitCode=1;return;}
 const l=data.lighthouseResult;if(!l)throw Error('Missing Lighthouse result');
 const scores=Object.fromEntries(Object.entries(l.categories).map(([k,v])=>[k,Math.round(v.score*100)]));
 const issues=Object.values(l.audits).filter(a=>a.score!==null&&a.score<1&&!['manual','notApplicable','informative'].includes(a.scoreDisplayMode)).sort((a,b)=>(b.details?.overallSavingsMs||0)-(a.details?.overallSavingsMs||0)||a.score-b.score).slice(0,5).map(a=>({id:a.id,title:a.title,score:a.score,display:a.displayValue,savingsMs:a.details?.overallSavingsMs}));
 console.log(JSON.stringify({strategy,fetchTime:l.fetchTime,scores,issues},null,2));
}
Promise.allSettled(['mobile','desktop'].map(run)).then(results=>{for(const result of results)if(result.status==='rejected'){console.error(result.reason);process.exitCode=1;}});
