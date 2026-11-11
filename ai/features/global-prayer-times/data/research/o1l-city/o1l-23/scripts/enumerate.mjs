import fs from 'node:fs';
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36';
const PROVS={İSTANBUL:9541,ANKARA:9206,İZMİR:9560,KONYA:9676,BURSA:9335,ANTALYA:9225,DİYARBAKIR:9402,ERZURUM:9451};
const dec=s=>s.replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&amp;/g,'&').trim();
const out={};
for(const [prov,id] of Object.entries(PROVS)){
  const r=await fetch(`https://namazvakitleri.diyanet.gov.tr/tr-TR/${id}`,{headers:{'User-Agent':UA}});
  const html=await r.text();
  fs.writeFileSync(`captures/ilce-select-${prov.toLowerCase()}-${id}.html`,html);
  const i=html.indexOf('district-select');
  const blk=html.slice(i,html.indexOf('</select>',i));
  const opts=[...blk.matchAll(/<option[^>]*value="([^"]*)"[^>]*>([^<]*)<\/option>/g)]
    .map(m=>({ilce:+m[1],name:dec(m[2])}));
  out[prov]={capitalId:id,districts:opts};
  console.log(prov,id,r.status,'districts',opts.length);
  await new Promise(r=>setTimeout(r,300));
}
fs.writeFileSync('data/ilce-index.json',JSON.stringify(out,null,1));
const total=Object.values(out).reduce((a,p)=>a+p.districts.length,0);
console.log('total entries',total);
