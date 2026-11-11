import fs from 'node:fs';
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36';
const provs=JSON.parse(fs.readFileSync('data/province-ilce.json','utf8'));
const MAP={'İ':'i','ı':'i','Ş':'s','ş':'s','Ğ':'g','ğ':'g','Ü':'u','ü':'u','Ö':'o','ö':'o','Ç':'c','ç':'c'};
const slugify=s=>s.split('').map(ch=>MAP[ch]??ch).join('').toLowerCase().replace(/[^a-z0-9]+/g,'');
const MONTHS={Ocak:1,'Şubat':2,Mart:3,Nisan:4,'Mayıs':5,Haziran:6,Temmuz:7,'Ağustos':8,'Eylül':9,Ekim:10,'Kasım':11,'Aralık':12};
const strip=s=>s.replace(/<[^>]*>/g,'').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&nbsp;/g,' ').trim();
function parse(html){
  const i=html.indexOf('id="yourTable"'); if(i<0) throw new Error('no table');
  const b=html.slice(i,html.indexOf('</table>',i));
  const rows=[...b.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map(m=>m[1]);
  const out={};
  for(const r of rows){
    const c=[...r.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(m=>strip(m[1]));
    if(c.length<8) continue;
    const dm=c[0].match(/^(\d{1,2})\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)\s+(\d{4})/);
    if(!dm||!MONTHS[dm[2]]) continue;
    const d=`${dm[3]}-${String(MONTHS[dm[2]]).padStart(2,'0')}-${String(dm[1]).padStart(2,'0')}`;
    out[d]={fajr:c[2],sunrise:c[3],dhuhr:c[4],asr:c[5],maghrib:c[6],isha:c[7]};
  }
  return out;
}
const results=[];
for(const p of provs){
  const slug=slugify(p.name);
  const f=`data/tr-2026-${slug}.json`;
  if(fs.existsSync(f)){results.push({...p,slug,status:'held'});continue;}
  const url=`https://namazvakitleri.diyanet.gov.tr/tr-TR/${p.ilce}`;
  const r=await fetch(url,{headers:{'User-Agent':UA},redirect:'follow'});
  const html=await r.text();
  fs.writeFileSync(`captures/tr-2026-${slug}-${p.ilce}.html`,html);
  let rows={};
  try{rows=parse(html);}catch(e){console.log('PARSE FAIL',p.name,e.message);}
  const dates=Object.keys(rows).sort();
  fs.writeFileSync(f,JSON.stringify({_source:`Diyanet namazvakitleri.diyanet.gov.tr/tr-TR/${p.ilce}`,_captured:'2026-11-11',_ilce:p.ilce,_province:p.name,rows},null,1));
  results.push({...p,slug,days:dates.length,first:dates[0],last:dates.at(-1),status:r.status});
  console.log(p.name,p.ilce,r.status,dates.length,dates[0],dates.at(-1));
  await new Promise(r=>setTimeout(r,250));
}
fs.writeFileSync('data/capture-all.json',JSON.stringify(results,null,1));
