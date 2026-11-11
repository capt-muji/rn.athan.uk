import fs from 'node:fs';
const UA='o1l-23-census/1.0 (prayer-times research)';
const admin=JSON.parse(fs.readFileSync('data/admin-districts.json','utf8'));
const out={}; const raw={};
for(const [prov,districts] of Object.entries(admin)){
  out[prov]={};
  for(const d of districts){
    const q=`${d}, ${prov}, Türkiye`;
    const url=`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
    let hit=null;
    for(let a=0;a<3&&!hit;a++){
      try{
        const r=await fetch(url,{headers:{'User-Agent':UA}});
        const j=await r.json();
        if(Array.isArray(j)&&j[0]) hit=j[0];
      }catch(e){}
      if(!hit) await new Promise(x=>setTimeout(x,3000));
    }
    raw[q]=hit;
    if(hit) out[prov][d]={lat:+Number(hit.lat).toFixed(4),lon:+Number(hit.lon).toFixed(4),display:hit.display_name};
    else console.log('MISS',q);
    await new Promise(x=>setTimeout(x,1100));
  }
  console.log(prov,Object.keys(out[prov]).length,'of',districts.length);
}
fs.writeFileSync('captures/nominatim-districts.json',JSON.stringify(raw,null,1));
fs.writeFileSync('data/district-coords.json',JSON.stringify(out,null,1));
