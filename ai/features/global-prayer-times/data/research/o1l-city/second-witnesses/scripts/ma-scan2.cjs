// Morocco angle scan at the cities' known points, margins free. adhan 4.4.6.
process.env.TZ = 'Africa/Casablanca';
const fs=require('fs'), path=require('path');
const A=require(path.join(process.env.HOME,'athan-gitree/census/adhan-build/node_modules/adhan'));
const {Coordinates,CalculationMethod,PrayerTimes,Madhab,Rounding,HighLatitudeRule}=A;
const WB=path.join(process.env.HOME,'athan-gitree/census/c31-year2/data/wb/ma');
const LIVE=path.join(process.env.HOME,'repos/rn.athan.uk/ai/features/global-prayer-times/data/research/o1k-wide/morocco1/data');
function parseHijri(file,year,sm,sd){
  const h=fs.readFileSync(path.join(WB,file),'utf8');
  const rows=[...h.matchAll(/<tr align="center"[^>]*>([\s\S]*?)<\/tr>/g)]
    .map(m=>[...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(c=>c[1].replace(/\s+/g,' ').trim()))
    .filter(c=>c.length>=8 && /\d{2}:\d{2}/.test(c[3]));
  const out={}; let d=new Date(year,sm-1,sd,12,0,0,0);
  for(const c of rows){const iso=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    out[iso]={fajr:c[3],sunrise:c[4],dhuhr:c[5],asr:c[6],maghrib:c[7],isha:c[8]}; d=new Date(d.getTime()+86400000);}
  return out;
}
const hhmm=s=>{const[h,m]=s.trim().split(':').map(Number);return h*60+m;};
const mo=dt=>dt.getHours()*60+dt.getMinutes()+dt.getSeconds()/60;
function P(fa,ia){const p=CalculationMethod.Other();p.fajrAngle=fa;p.ishaAngle=ia;p.madhab=Madhab.Shafi;p.highLatitudeRule=HighLatitudeRule.MiddleOfTheNight;p.rounding=Rounding.None;return p;}
const D=iso=>{const[y,m,d]=iso.split('-').map(Number);return new Date(y,m-1,d,12,0,0,0);};
function scan(rows,lat,lng,kind){
  const days=Object.keys(rows).sort(), c=new Coordinates(lat,lng);
  const [lo,hi]=kind==='fajr'?[15,21]:[13,20]; const res=[];
  for(let a=lo;a<=hi+1e-9;a+=0.25){
    let best=null;
    for(let m=-4;m<=4;m+=0.5){
      let ex=0,w1=0,ab=0;
      for(const d of days){const pt=new PrayerTimes(c,D(d),P(kind==='fajr'?a:19,kind==='fajr'?17:a));
        const r=Math.round(mo(kind==='fajr'?pt.fajr:pt.isha)+m)-hhmm(rows[d][kind]);
        if(r===0)ex++; if(Math.abs(r)<=1)w1++; ab+=Math.abs(r);}
      const cd={m,ex,w1,mae:+(ab/days.length).toFixed(2)};
      if(!best||cd.ex>best.ex||(cd.ex===best.ex&&cd.mae<best.mae))best=cd;
    }
    res.push({a:+a.toFixed(2),...best});
  }
  res.sort((x,y)=>y.ex-x.ex||x.mae-y.mae);
  return res;
}
const cases={
 'Rabat 2024-02': {rows:parseHijri('horaire_hijri_2_ville_1_20240211141015.html',2024,2,11),lat:34.0209,lng:-6.8416},
 'Casablanca 2025-01': {rows:parseHijri('horaire_hijri_2_ville_58_20250120171540.html',2025,1,2),lat:33.5731,lng:-7.5898},
 'Laayoune 2024-06': {rows:parseHijri('horaire_hijri_2_ville_156_20240604140741.html',2024,6,4),lat:27.1536,lng:-13.2033},
};
for(const [k,c] of Object.entries(cases)){
  const days=Object.keys(c.rows).sort();
  console.log('==',k,c.rows[days[0]],'->',c.rows[days[days.length-1]],'n',days.length);
  const f=scan(c.rows,c.lat,c.lng,'fajr'), i=scan(c.rows,c.lat,c.lng,'isha');
  console.log('  fajr top:',f.slice(0,6).map(x=>`${x.a}:${x.ex}/${x.w1}(m${x.m},mae${x.mae})`).join(' '));
  console.log('  isha top:',i.slice(0,6).map(x=>`${x.a}:${x.ex}/${x.w1}(m${x.m},mae${x.mae})`).join(' '));
}
