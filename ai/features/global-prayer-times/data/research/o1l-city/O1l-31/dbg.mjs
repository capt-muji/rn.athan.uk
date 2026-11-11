import { loadFlex, makeContext45 } from './lib8.mjs';
const W=process.env.HOME+'/athan-gitree/census/o1l-city/O1l-31';
const cols={fajr:'fajr',sunrise:'sunrise',dhuhr:'dhuhr',asr:'asr',maghrib:'maghrib',isha:'isha'};
const {slots}=loadFlex(W+'/data/se-ifis-malmo-2026.json',cols);
for(const s of slots){ if(s.chart.isha<300) s.chart.isha+=1440; }
const pack=await makeContext45(55.6050,13.0038,slots); const ctx=pack.ctx;
const sec=(d)=>isNaN(d.getTime())?null:d.getHours()*3600+d.getMinutes()*60+d.getSeconds();
let worst=null;
slots.forEach((s,i)=>{
  let v=sec(ctx.hourAngle(i,-16,true)); if(v!==null&&v<300)v+=1440;
  if(v===null)return;
  const d=Math.abs(Math.floor(v/60+(-1))-s.chart.isha);
  if(!worst||d>worst.d) worst={d,k:s.key,v:v/60,chart:s.chart.isha};
});
console.log(worst);
const bad=slots.map((s,i)=>{let v=sec(ctx.hourAngle(i,-16,true)); if(v!==null&&v<300)v+=1440; return {k:s.key,v:v?Math.round(v/60):null,c:s.chart.isha};}).filter(x=>x.v!==null&&Math.abs(x.v-x.c)>3);
console.log('bad',bad.length, bad.slice(0,10));
