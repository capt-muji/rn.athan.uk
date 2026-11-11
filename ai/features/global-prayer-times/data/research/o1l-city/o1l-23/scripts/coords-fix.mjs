import fs from 'node:fs';
const UA='o1l-23-census/1.0 (prayer-times research)';
const M={'İ':'I','ı':'I','Ş':'S','Ğ':'G','Ü':'U','Ö':'O','Ç':'C','Â':'A'};
const fold=s=>s.split('').map(ch=>M[ch]??ch).join('').toUpperCase().replace(/[^A-Z0-9]/g,'');
const coords=JSON.parse(fs.readFileSync('data/district-coords.json','utf8'));
const raw=JSON.parse(fs.readFileSync('captures/nominatim-districts.json','utf8'));
const fixed=[];
for(const [prov,ds] of Object.entries(coords)){
  for(const [name,v] of Object.entries(ds)){
    const first=(v.display||'').split(',')[0];
    if(fold(first)===fold(name)) continue;
    const url=`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(name+', '+prov+', Türkiye')}`;
    const r=await fetch(url,{headers:{'User-Agent':UA}});
    const j=await r.json();
    const hit=j.find(x=>fold((x.display_name||'').split(',')[0])===fold(name));
    if(!hit){console.log('STILL MISS',prov,name);continue;}
    ds[name]={lat:+Number(hit.lat).toFixed(4),lon:+Number(hit.lon).toFixed(4),display:hit.display_name,corrected:true};
    fixed.push({prov,name,from:v.display,to:hit.display_name});
    console.log('fixed',prov,name,ds[name].lat,ds[name].lon);
    await new Promise(x=>setTimeout(x,1200));
  }
}
fs.writeFileSync('data/district-coords.json',JSON.stringify(coords,null,1));
fs.writeFileSync('data/coords-corrections.json',JSON.stringify(fixed,null,1));
console.log('corrections',fixed.length);
