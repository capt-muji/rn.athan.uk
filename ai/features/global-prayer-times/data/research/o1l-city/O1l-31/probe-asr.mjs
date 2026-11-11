import fs from 'node:fs';
import { loadFlex, makeContext45 } from './lib8.mjs';
import { bestMargin } from './lib.mjs';
const W = process.env.HOME + '/athan-gitree/census/o1l-city/O1l-31';
const cols = { fajr:'fajr', sunrise:'sunrise', dhuhr:'dhuhr', asr:'asr', maghrib:'maghrib', isha:'isha' };
const isCEST=(d)=>{const y=d.getFullYear();return d>=new Date(y,2,29)&&d<new Date(y,9,25);};
function score(sec,chart,idx){const s=[],c=[];for(const i of idx){if(sec[i]===null||Number.isNaN(chart[i]))continue;s.push(sec[i]);c.push(chart[i]);}
 const r=bestMargin(Float64Array.from(s),Int32Array.from(c),{jMax:60,m0:-15});return `${r.mode} m${r.margin} ${r.exact}/${s.length}`;}
for (const [city,lat,lng] of [['stavanger',59.102013,5.712610],['oslo',59.972397,10.775729],['alta',70.049627,23.082535]]){
  const {slots}=loadFlex(W+'/data/no-irn-'+city+'-2026.json',cols);
  const pack=await makeContext45(lat,lng,slots); const ctx=pack.ctx;
  const chart=slots.map(s=>s.chart.asr);
  const cest=slots.map((s,i)=>[s,i]).filter(([s])=>isCEST(s.date)).map(([,i])=>i);
  const cet=slots.map((s,i)=>[s,i]).filter(([s])=>!isCEST(s.date)).map(([,i])=>i);
  console.log(city,'| CEST vs 1x:',score(ctx.raw.asr1,chart,cest),'| CET vs 2x:',score(ctx.raw.asr2,chart,cet));
}
