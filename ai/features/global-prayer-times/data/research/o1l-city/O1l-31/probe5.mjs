import fs from 'node:fs';
import { loadFlex, makeContext45 } from './lib8.mjs';
const W = process.env.HOME + '/athan-gitree/census/o1l-city/O1l-31';
const cols = { fajr:'fajr', sunrise:'sunrise', dhuhr:'dhuhr', asr:'asr', maghrib:'maghrib', isha:'isha' };
const { slots } = loadFlex(W+'/data/no-irn-stavanger-2026.json', cols);
const pack = await makeContext45(59.102013,5.712610,slots); const ctx=pack.ctx;
const m=(d)=>isNaN(d.getTime())?null:d.getHours()*60+d.getMinutes()+d.getSeconds()/60;
function implied(i, target, after){
  let best=null;
  for(let a=6;a<=20;a+=0.01){
    const t=m(ctx.hourAngle(i,-a,after));
    if(t===null) continue;
    const d=Math.abs(t-target);
    if(best===null||d<best.d) best={a:+a.toFixed(2),d,t};
  }
  return best;
}
console.log('date  fajrImplied  ishaImplied   (degrees reproducing the printed minute)');
for (const k of ['2026-01-15','2026-03-01','2026-03-20','2026-03-25','2026-04-01','2026-04-10','2026-04-16','2026-04-21','2026-05-01','2026-05-21','2026-06-21','2026-07-21','2026-08-21','2026-09-10','2026-09-20','2026-10-01','2026-11-15','2026-12-15']){
  const i=slots.findIndex(s=>s.key===k); const s=slots[i];
  const fi=implied(i,s.chart.fajr,false), ii=implied(i,s.chart.isha,true);
  console.log(k, fi?fi.a:'-', ii?ii.a:'-', ' printed', s.chart.fajr, s.chart.isha, 'gapI', s.chart.isha-s.chart.maghrib);
}
