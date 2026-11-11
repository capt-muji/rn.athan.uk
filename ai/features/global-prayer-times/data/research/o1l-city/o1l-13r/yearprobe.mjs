import * as Adhan from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js';
import fs from 'fs';
const files=['mawaqit-bd-bolura-sylhet.html','mawaqit-bd-sara-builder-dhaka.html','mawaqit-bd-mirpur-dohs-central-masjid-dhaka-1216-bangladesh.html'];
function parse(f){
  const t=fs.readFileSync('captures/'+f,'utf8');
  const m=t.match(/let confData = (\{[\s\S]*?\});/);
  const d=JSON.parse(m[1]);
  return d;
}
function datesFor(year,leapTemplate){
  const out=[];
  const lens=[31,29,31,30,31,30,31,31,30,31,30,31];
  let d=new Date(Date.UTC(year,0,1));
  for(let mo=0;mo<12;mo++){
    const n=lens[mo];
    for(let day=1;day<=n;day++){
      if(!leapTemplate && mo===1 && day===29) continue;
      out.push(`${year}-${String(mo+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`);
    }
  }
  return out;
}
const params=new Adhan.CalculationParameters('Other');
params.fajrAngle=18; params.ishaAngle=17; params.madhab=Adhan.Madhab.Shafi;
for(const f of files){
  const d=parse(f); const coords=new Adhan.Coordinates(d.latitude,d.longitude);
  const seq=[];
  for(const mo of d.calendar) for(const day of Object.keys(mo).sort((a,b)=>a-b)) seq.push(mo[day]);
  console.log('==',f,'templateDays',seq.length);
  for(const year of [2024,2025,2026,2028]){
    const leap = (year%4===0);
    const dates=datesFor(year, leap);
    if(dates.length!==seq.length){ console.log('  ',year,'len',dates.length,'skip'); continue; }
    let err=0,n=0,maxe=0;
    for(let i=0;i<dates.length;i++){
      const [y,mo,da]=dates[i].split('-').map(Number);
      const pt=new Adhan.PrayerTimes(coords,new Date(Date.UTC(y,mo-1,da,6,0,0)),params);
      const sh=pt.sunrise.toISOString().slice(11,16);
      const mg=pt.maghrib.toISOString().slice(11,16);
      const toMin=s=>{const[h,m]=s.split(':').map(Number);return h*60+m;};
      err+=Math.abs(toMin(sh)-toMin(seq[i][1]))+Math.abs(toMin(mg)-toMin(seq[i][4]));
      maxe=Math.max(maxe,Math.abs(toMin(sh)-toMin(seq[i][1])),Math.abs(toMin(mg)-toMin(seq[i][4])));
      n+=2;
    }
    console.log('  ',year,'MAE',(err/n).toFixed(2),'max',maxe);
  }
}
