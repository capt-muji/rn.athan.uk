import {Adhan,hm,toMin} from './lib.mjs';
import {rows2026} from './fit.mjs';
import fs from 'fs';
const f=process.argv[2];
const t=fs.readFileSync('captures/'+f,'utf8');
const d=JSON.parse(t.match(/let confData = (\{[\s\S]*?\});/)[1]);
const rows=rows2026(d);
const coords=new Adhan.Coordinates(d.latitude,d.longitude);
for(const madhab of ['shafi','hanafi']){
  const p=new Adhan.CalculationParameters('Other');
  p.fajrAngle=19.25;p.ishaAngle=18.65;p.ishaInterval=0;
  p.madhab=madhab==='hanafi'?Adhan.Madhab.Hanafi:Adhan.Madhab.Shafi;
  console.log('--- madhab',madhab);
  for(const idx of [0,30,90,180,270,364]){
    const r=rows[idx];const [y,mo,da]=r.date.split('-').map(Number);
    const pt=new Adhan.PrayerTimes(coords,new Date(Date.UTC(y,mo-1,da,6,0,0)),p);
    console.log(r.date,'obs',r.t.join(' '),'| pred',[hm(pt.fajr),hm(pt.sunrise),hm(pt.dhuhr),hm(pt.asr),hm(pt.maghrib),hm(pt.isha)].join(' '));
  }
}
