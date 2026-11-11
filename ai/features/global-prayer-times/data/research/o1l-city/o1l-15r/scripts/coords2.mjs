import fs from 'node:fs';
const UA='o1l-15r-census/1.0 (prayer-times research)';
const provs=JSON.parse(fs.readFileSync('data/province-ilce.json','utf8'));
const out={};
for(const p of provs){
  const q=encodeURIComponent(`${p.name}, Türkiye`);
  const url=`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&featureType=city`;
  let c=null;
  for(let attempt=0;attempt<2&&!c;attempt++){
    const r=await fetch(url,{headers:{'User-Agent':UA}});
    const j=await r.json().catch(()=>null);
    if(Array.isArray(j)&&j[0]) c={lat:+Number(j[0].lat).toFixed(4),lon:+Number(j[0].lon).toFixed(4)};
    else await new Promise(r=>setTimeout(r,1500));
  }
  if(c) out[p.name]=c; else console.log('MISS',p.name);
  await new Promise(r=>setTimeout(r,1100));
}
fs.writeFileSync('data/province-coords.json',JSON.stringify(out,null,1));
console.log('resolved',Object.keys(out).length,'of',provs.length);
