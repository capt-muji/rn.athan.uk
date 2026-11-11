import {Adhan,hm,toMin,templateDates} from './lib.mjs';
import fs from 'fs';
const files=['mawaqit-bd-bolura-sylhet.html','mawaqit-bd-sara-builder-dhaka.html'];
const params=new Adhan.CalculationParameters('Other');
params.fajrAngle=18;params.ishaAngle=17;params.madhab=Adhan.Madhab.Shafi;
for(const f of files){
  const t=fs.readFileSync('captures/'+f,'utf8');
  const d=JSON.parse(t.match(/let confData = (\{[\s\S]*?\});/)[1]);
  const seq=[];for(const mo of d.calendar)for(const day of Object.keys(mo).sort((a,b)=>a-b))seq.push(mo[day]);
  const coords=new Adhan.Coordinates(d.latitude,d.longitude);
  console.log('==',f);
  for(const year of [2024,2026,2028]){
    const leap=year%4===0;
    const dates=templateDates(year,leap);
    if(dates.length!==seq.length){console.log('  ',year,'len',dates.length);continue;}
    let e1=0,e2=0,n=0,mx=0;
    for(let i=0;i<dates.length;i++){
      const [y,mo,da]=dates[i];
      const pt=new Adhan.PrayerTimes(coords,new Date(Date.UTC(y,mo-1,da,6,0,0)),params);
      const sh=hm(pt.sunrise),mg=hm(pt.maghrib);
      e1+=Math.abs(toMin(sh)-toMin(seq[i][1]));
      e2+=Math.abs(toMin(mg)-toMin(seq[i][4]));
      mx=Math.max(mx,Math.abs(toMin(sh)-toMin(seq[i][1])),Math.abs(toMin(mg)-toMin(seq[i][4])));
      n++;
    }
    console.log('  ',year,'MAE shuruq',(e1/n).toFixed(2),'maghrib',(e2/n).toFixed(2),'max',mx);
  }
}
