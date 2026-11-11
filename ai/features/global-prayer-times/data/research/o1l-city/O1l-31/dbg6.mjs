import { loadFlex, makeContext45 } from './lib8.mjs';
const W=process.env.HOME+'/athan-gitree/census/o1l-city/O1l-31';
const cols={fajr:'fajr',sunrise:'sunrise',dhuhr:'dhuhr',asr:'asr',maghrib:'maghrib',isha:'isha'};
const {slots}=loadFlex(W+'/data/fi-turku-2026.json',cols);
const pack=await makeContext45(60.4518,22.2666,slots); const ctx=pack.ctx;
const bad=[];
slots.forEach((s,i)=>{const v=Math.floor(ctx.raw.sunrise[i]/60); const d=v-s.chart.sunrise; if(Math.abs(d)>1) bad.push([s.key,d]);});
console.log('bad',bad.length); console.log(bad.slice(0,15)); console.log(bad.slice(-10));
