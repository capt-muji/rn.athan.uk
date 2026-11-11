import { loadFlex, makeContext45 } from './lib8.mjs';
const W=process.env.HOME+'/athan-gitree/census/o1l-city/O1l-31';
const cols={fajr:'fajr',sunrise:'sunrise',dhuhr:'dhuhr',asr:'asr',maghrib:'maghrib',isha:'isha'};
const {slots}=loadFlex(W+'/data/se-ifis-malmo-2026.json',cols);
const pack=await makeContext45(55.6050,13.0038,slots); const ctx=pack.ctx;
const hm=(d)=>isNaN(d.getTime())?'--':`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
for(const k of ['2026-01-01','2026-03-20','2026-06-21','2026-09-15','2026-12-21']){
  const i=slots.findIndex(s=>s.key===k), s=slots[i];
  const f18=ctx.hourAngle(i,-18,false), i16=ctx.hourAngle(i,-16,true);
  console.log(k,'printed f',s.chart.fajr,'adhan18',hm(f18),'| printed i',s.chart.isha,'adhan16',hm(i16),'| sr',s.chart.sunrise,hm(new Date(s.date.getFullYear(),s.date.getMonth(),s.date.getDate(),0,0,0)),'');
}
