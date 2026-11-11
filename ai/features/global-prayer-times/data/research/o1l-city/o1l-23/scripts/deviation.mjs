import fs from 'node:fs';
const COLS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const MONTHS={Ocak:1,'Şubat':2,Mart:3,Nisan:4,'Mayıs':5,Haziran:6,Temmuz:7,'Ağustos':8,'Eylül':9,Ekim:10,Kasım:11,Aralık:12};
const idx=JSON.parse(fs.readFileSync('data/ilce-index.json','utf8'));
const MAP={'İ':'i','ı':'i','Ş':'s','ş':'s','Ğ':'g','ğ':'g','Ü':'u','ü':'u','Ö':'o','ö':'o','Ç':'c','ç':'c','Â':'a','â':'a'};
const slugify=s=>s.split('').map(ch=>MAP[ch]??ch).join('').toLowerCase().replace(/[^a-z0-9]+/g,'');
const toMin=s=>{const[h,m]=s.split(':').map(Number);return h*60+m;};
const load=(prov,district)=>{
  const f=`data/tr-2026-${slugify(prov)}--${slugify(district)}.json`;
  return JSON.parse(fs.readFileSync(f,'utf8')).rows;
};
const out={}; const perDistrict=[];
for(const [prov,info] of Object.entries(idx)){
  const capEntry=info.districts.find(d=>d.ilce===info.capitalId);
  const base=load(prov,capEntry.name);
  const res={province:prov,capital:{district:capEntry.name,ilce:info.capitalId},districts:{}};
  for(const d of info.districts){
    if(d.ilce===info.capitalId) continue;
    const rows=load(prov,d.name);
    const per={}; for(const c of COLS) per[c]={abs:0,signed:0,n:0,worst:0};
    let absAll=0,nAll=0,worst=0,same=0,cells=0,daysDiffer=0;
    const dayMeans=[];
    for(const [day,row] of Object.entries(rows)){
      if(!base[day]) continue;
      let dayAbs=0;
      for(const c of COLS){
        const e=toMin(row[c])-toMin(base[day][c]);
        per[c].abs+=Math.abs(e); per[c].signed+=e; per[c].n++; if(Math.abs(e)>per[c].worst)per[c].worst=Math.abs(e);
        absAll+=Math.abs(e); nAll++; if(Math.abs(e)>worst)worst=Math.abs(e);
        cells++; if(e===0)same++;
        dayAbs+=Math.abs(e);
      }
      if(dayAbs>0) daysDiffer++;
      dayMeans.push(dayAbs/6);
    }
    const rec={
      district:d.name,ilce:d.ilce,days:Object.keys(rows).length,
      mae:+(absAll/nAll).toFixed(3), worst,
      identicalPct:+(100*same/cells).toFixed(1),
      daysDiffering:daysDiffer,
      perPrayer:Object.fromEntries(COLS.map(c=>[c,{mae:+(per[c].abs/per[c].n).toFixed(3),bias:+(per[c].signed/per[c].n).toFixed(3),worst:per[c].worst}]))
    };
    res.districts[d.name]=rec;
    perDistrict.push({province:prov,...rec});
  }
  out[prov]=res;
}
fs.writeFileSync('data/deviation.json',JSON.stringify(out,null,1));
fs.writeFileSync('data/deviation-flat.json',JSON.stringify(perDistrict,null,1));

const maes=perDistrict.map(d=>d.mae).sort((a,b)=>a-b);
const q=p=>maes[Math.min(maes.length-1,Math.floor(p*maes.length))];
console.log('districts',perDistrict.length);
console.log('mae min',maes[0],'median',q(0.5),'mean',+(maes.reduce((a,b)=>a+b,0)/maes.length).toFixed(3),'max',maes.at(-1));
console.log('histogram');
const buckets=[[0,0.25],[0.25,0.5],[0.5,0.75],[0.75,1],[1,1.5],[1.5,2],[2,3],[3,99]];
for(const [lo,hi] of buckets){
  const n=maes.filter(m=>m>=lo&&m<hi).length;
  console.log(`  ${lo}-${hi}: ${n}`);
}
console.log('worst district',perDistrict.reduce((a,b)=>a.worst>b.worst?a:b).district,perDistrict.reduce((a,b)=>a.worst>b.worst?a:b).worst);
const byCol={};
for(const c of COLS){const arr=perDistrict.map(d=>d.perPrayer[c].mae);byCol[c]=+(arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(3);}
console.log('mean MAE per prayer',byCol);
const samePcts=perDistrict.map(d=>d.identicalPct).sort((a,b)=>a-b);
console.log('identical-cell % min/median/max',samePcts[0],samePcts[Math.floor(samePcts.length/2)],samePcts.at(-1));
