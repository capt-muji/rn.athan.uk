import fs from 'node:fs';
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36';
const provs=JSON.parse(fs.readFileSync('data/province-ilce.json','utf8'));
const out={};
for(const p of provs){
  const title=p.name.replace(/İ/g,'İ');
  const url=`https://tr.wikipedia.org/w/api.php?action=query&prop=coordinates&format=json&redirects=1&titles=${encodeURIComponent(title)}`;
  const r=await fetch(url,{headers:{'User-Agent':UA}});
  const j=await r.json().catch(()=>null);
  const pages=j?.query?.pages||{};
  const first=Object.values(pages)[0];
  const c=first?.coordinates?.[0];
  if(c) out[p.name]={lat:+c.lat.toFixed(4),lon:+c.lon.toFixed(4)};
  else console.log('MISS',p.name);
  await new Promise(r=>setTimeout(r,80));
}
fs.writeFileSync('data/province-coords.json',JSON.stringify(out,null,1));
console.log('resolved',Object.keys(out).length,'of',provs.length);
