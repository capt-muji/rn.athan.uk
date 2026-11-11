import { loadFlex, makeContext45, pairUnder } from './lib8.mjs';
import { bestMargin } from './lib.mjs';
const W=process.env.HOME+'/athan-gitree/census/o1l-city/O1l-31';
const cols={fajr:'fajr',sunrise:'sunrise',dhuhr:'dhuhr',asr:'asr',maghrib:'maghrib',isha:'isha'};
const sec=(d)=>d===null||isNaN(d.getTime())?null:d.getHours()*3600+d.getMinutes()*60+d.getSeconds();
const {slots}=loadFlex(W+'/data/se-ifis-malmo-2026.json',cols);
for(const s of slots){ if(s.chart.isha<300) s.chart.isha+=1440; }
const pack=await makeContext45(55.6050,13.0038,slots); const ctx=pack.ctx;
const sub=slots.map((s,i)=>i).filter(i=>{const v=sec(ctx.hourAngle(i,-18,false)); return v===null||Math.abs(Math.floor(v/60)-slots[i].chart.fajr)>1;});
console.log('sub days',sub.length);
for(const fr of [1/2,1/3,1/4,1/5,1/6,1/7,1/8,1/10]){
  const f=[],ii=[];
  for(let i=0;i<slots.length;i++){const p=pairUnder(pack,i,18,16,{kind:'portions',fajr:fr,isha:fr}); f.push(p.f); ii.push(p.i===null?null:(p.i<36000?p.i+86400:p.i));}
  const sc=(arr,ch)=>{const s=[],c=[];for(const i of sub){if(arr[i]===null||Number.isNaN(ch[i]))continue;s.push(arr[i]);c.push(ch[i]);}if(!s.length)return null;const r=bestMargin(Float64Array.from(s),Int32Array.from(c),{jMax:60,m0:-15});let e=0,w=0;for(let k=0;k<s.length;k++){const v=(r.mode==='floor'?Math.floor:r.mode==='ceil'?Math.ceil:Math.round)(s[k]/60+r.margin);const d=Math.abs(v-c[k]);if(!d)e++;if(d<=1)w++;}return `${r.mode} m${r.margin} ${e}/${s.length} w1 ${w}`;};
  console.log('1/'+Math.round(1/fr), 'fajr', sc(f,slots.map(s=>s.chart.fajr)), '| isha', sc(ii,slots.map(s=>s.chart.isha)));
}
