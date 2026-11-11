import fs from 'node:fs';
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36';
const idx=JSON.parse(fs.readFileSync('data/ilce-index.json','utf8'));
const MAP={'İ':'i','ı':'i','Ş':'s','ş':'s','Ğ':'g','ğ':'g','Ü':'u','ü':'u','Ö':'o','ö':'o','Ç':'c','ç':'c','Â':'a','â':'a'};
const slugify=s=>s.split('').map(ch=>MAP[ch]??ch).join('').toLowerCase().replace(/[^a-z0-9]+/g,'');
const MONTHS={Ocak:1,'Şubat':2,Mart:3,Nisan:4,'Mayıs':5,Haziran:6,Temmuz:7,'Ağustos':8,'Eylül':9,Ekim:10,'Kasım':11,'Aralık':12};
const strip=s=>s.replace(/<[^>]*>/g,'').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').trim();
function parse(html){
  const i=html.indexOf('id="yourTable"');
  if(i<0) throw new Error('no table');
  const b=html.slice(i,html.indexOf('</table>',i));
  const out={};
  for(const r of b.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)){
    const c=[...r[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(m=>strip(m[1]));
    if(c.length<8) continue;
    const dm=c[0].match(/^(\d{1,2})\s+([A-Za-zÇĞİÖŞÜçğıöşüÂâ]+)\s+(\d{4})/);
    if(!dm||!MONTHS[dm[2]]) continue;
    const d=`${dm[3]}-${String(MONTHS[dm[2]]).padStart(2,'0')}-${String(dm[1]).padStart(2,'0')}`;
    out[d]={fajr:c[2],sunrise:c[3],dhuhr:c[4],asr:c[5],maghrib:c[6],isha:c[7]};
  }
  return out;
}
const manifest=[];
for(const [prov,info] of Object.entries(idx)){
  for(const d of info.districts){
    const isCap=d.ilce===info.capitalId;
    const slug=slugify(prov)+'--'+slugify(d.name);
    const file=`captures/tr-2026-${slug}-${d.ilce}.html`;
    const outFile=`data/tr-2026-${slug}.json`;
    if(fs.existsSync(outFile)){manifest.push({prov,district:d.name,ilce:d.ilce,isCapital:isCap,status:'held'});continue;}
    let html=null,status=0;
    for(let a=0;a<3&&!html;a++){
      const r=await fetch(`https://namazvakitleri.diyanet.gov.tr/tr-TR/${d.ilce}`,{headers:{'User-Agent':UA}});
      status=r.status; const t=await r.text();
      if(r.status===200&&t.includes('id="yourTable"')) html=t;
      else await new Promise(x=>setTimeout(x,1500));
    }
    if(!html){console.log('FAIL',prov,d.name,d.ilce,status);manifest.push({prov,district:d.name,ilce:d.ilce,status:'fail'});continue;}
    fs.writeFileSync(file,html);
    const rows=parse(html);
    const dates=Object.keys(rows).sort();
    fs.writeFileSync(outFile,JSON.stringify({
      _source:`Diyanet namazvakitleri.diyanet.gov.tr/tr-TR/${d.ilce}`,
      _captured:'2026-11-11',_ilce:d.ilce,_province:prov,_district:d.name,_isCapital:isCap,rows},null,1));
    manifest.push({prov,district:d.name,ilce:d.ilce,isCapital:isCap,days:dates.length,first:dates[0],last:dates.at(-1),status});
    console.log(prov,d.name,d.ilce,dates.length,dates[0],dates.at(-1));
    await new Promise(x=>setTimeout(x,700));
  }
}
fs.writeFileSync('data/capture-manifest.json',JSON.stringify(manifest,null,1));
const rows=manifest.reduce((a,m)=>a+(m.days||0),0);
console.log('pages',manifest.length,'rows',rows);
