import {Adhan,hm,toMin} from './lib.mjs';
import {rows2026} from './fit.mjs';
import fs from 'fs';
const f='mawaqit-bd-bolura-sylhet.html';
const t=fs.readFileSync('captures/'+f,'utf8');
const d=JSON.parse(t.match(/let confData = (\{[\s\S]*?\});/)[1]);
const rows=rows2026(d);
const days=rows.map(r=>{const [y,mo,da]=r.date.split('-').map(Number);return new Date(Date.UTC(y,mo-1,da,6,0,0));});
const obsSh=rows.map(r=>toMin(r.t[1])), obsMg=rows.map(r=>toMin(r.t[4]));
const p=new Adhan.CalculationParameters('Other');p.fajrAngle=19.25;p.ishaAngle=18.65;p.ishaInterval=0;p.madhab=Adhan.Madhab.Hanafi;
let best=null;
for(let lat=22.0;lat<=27.0;lat+=0.05){
  for(let lon=89.5;lon<=93.5;lon+=0.05){
    const co=new Adhan.Coordinates(lat,lon);
    let e=0,n=0;
    for(let i=0;i<days.length;i+=3){
      const pt=new Adhan.PrayerTimes(co,days[i],p);
      e+=Math.abs(toMin(hm(pt.sunrise))-obsSh[i])+Math.abs(toMin(hm(pt.maghrib))-obsMg[i]);n+=2;
    }
    const mae=e/n;
    if(!best||mae<best.mae) best={lat,lon,mae};
  }
}
console.log('implied reference for the band table:',best.lat.toFixed(2),best.lon.toFixed(2),'MAE',best.mae.toFixed(2));
console.log('mosque coords:',d.latitude.toFixed(2),d.longitude.toFixed(2));
