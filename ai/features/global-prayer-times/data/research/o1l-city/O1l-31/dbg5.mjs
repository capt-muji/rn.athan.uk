import { loadFlex, makeContext45 } from './lib8.mjs';
const W=process.env.HOME+'/athan-gitree/census/o1l-city/O1l-31';
const cols={fajr:'fajr',sunrise:'sunrise',dhuhr:'dhuhr',asr:'asr',maghrib:'maghrib',isha:'isha'};
const hm=(d)=>isNaN(d.getTime())?'--':`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
for(const [f,lat,lng] of [['fi-turku-2026',60.4518,22.2666],['fi-tampere-2026',61.4978,23.7610]]){
  const {slots}=loadFlex(W+'/data/'+f+'.json',cols);
  const pack=await makeContext45(lat,lng,slots); const ctx=pack.ctx;
  console.log('\n'+f);
  for(const k of ['2026-01-15','2026-03-25','2026-03-30','2026-04-15','2026-06-21','2026-08-15','2026-10-20','2026-10-26','2026-11-11','2026-12-15']){
    const i=slots.findIndex(s=>s.key===k); if(i<0){console.log(k,'missing');continue;}
    const s=slots[i];
    const sr=new Date(s.date.getFullYear(),s.date.getMonth(),s.date.getDate()); 
    console.log(k,'printed sr',s.chart.sunrise,'dh',s.chart.dhuhr,'mg',s.chart.maghrib,'| computed sr',hm(new Date(ctx.srDate[i])),'dh',hm(new Date(ctx.raw.dhuhr[i]*1000)),'mg',hm(new Date(ctx.ssDate[i])));
  }
}
