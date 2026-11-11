import {Adhan,hm,toMin} from './lib.mjs';
import fs from 'fs';
const files=fs.readdirSync('captures').filter(f=>f.startsWith('mawaqit-bd-'));
const params=new Adhan.CalculationParameters('Other');params.fajrAngle=18;params.ishaAngle=17;params.madhab=Adhan.Madhab.Shafi;
function dateFor(i,mode,year){ // i 0-based template index
  const leap=[31,29,31,30,31,30,31,31,30,31,30,31];
  if(mode==='leap'){let n=i;for(let m=0;m<12;m++){if(n<leap[m])return [year,m+1,n+1];n-=leap[m];}return null;}
  // 2026 style: template index 59 is the padded Feb29
  let j=i; if(i>=59) j=i-1; // skip pad day
  const lens=[31,28,31,30,31,30,31,31,30,31,30,31];let n=j;
  for(let m=0;m<12;m++){if(n<lens[m])return [year,m+1,n+1];n-=lens[m];}
  return null;
}
for(const f of files){
  const t=fs.readFileSync('captures/'+f,'utf8');
  const d=JSON.parse(t.match(/let confData = (\{[\s\S]*?\});/)[1]);
  const seq=[];for(const mo of d.calendar)for(const day of Object.keys(mo).sort((a,b)=>a-b))seq.push(mo[day]);
  const coords=new Adhan.Coordinates(d.latitude,d.longitude);
  const out=[];
  for(const mode of ['leap2028','shift2026']){
    let e=0,n=0,mx=0;
    for(let i=0;i<seq.length;i++){
      let dt;
      if(mode==='leap2028') dt=dateFor(i,'leap',2028);
      else { if(i===59) continue; dt=dateFor(i,'2026',2026); }
      if(!dt) continue;
      const [y,mo,da]=dt;
      const pt=new Adhan.PrayerTimes(coords,new Date(Date.UTC(y,mo-1,da,6,0,0)),params);
      const sh=toMin(hm(pt.sunrise)),mg=toMin(hm(pt.maghrib));
      const d1=Math.abs(sh-toMin(seq[i][1])), d2=Math.abs(mg-toMin(seq[i][4]));
      e+=d1+d2;n+=2;mx=Math.max(mx,d1,d2);
    }
    out.push(`${mode}: MAE ${(e/n).toFixed(2)} max ${mx}`);
  }
  console.log(f.replace('mawaqit-bd-','').slice(0,34), out.join(' | '));
}
