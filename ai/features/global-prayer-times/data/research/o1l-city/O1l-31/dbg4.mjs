import { loadFlex, makeContext45 } from './lib8.mjs';
import { bestMargin } from './lib.mjs';
const W=process.env.HOME+'/athan-gitree/census/o1l-city/O1l-31';
const cols={fajr:'fajr',sunrise:'sunrise',dhuhr:'dhuhr',asr:'asr',maghrib:'maghrib',isha:'isha'};
const sec=(d)=>d===null||isNaN(d.getTime())?null:d.getHours()*3600+d.getMinutes()*60+d.getSeconds();
const files=[['dk-adan-aarhus-2026',56.1629,10.2039],['fi-tampere-2026',61.4978,23.7610],['fi-turku-2026',60.4518,22.2666],['fi-jyvaskyla-2026',62.2415,25.7209],['lt-klaipeda-diyanet',55.7033,21.1443]];
for(const [f,lat,lng] of files){
  const {slots}=loadFlex(W+'/data/'+f+'.json',cols);
  for(const s of slots){ if(s.chart.isha<300) s.chart.isha+=1440; }
  const pack=await makeContext45(lat,lng,slots); const ctx=pack.ctx;
  const sc=(arr,ch)=>{const s=[],c=[];for(let i=0;i<slots.length;i++){if(arr[i]===null||Number.isNaN(ch[i]))continue;s.push(arr[i]);c.push(ch[i]);}if(!s.length)return null;const r=bestMargin(Float64Array.from(s),Int32Array.from(c),{jMax:60,m0:-15});let e=0,w=0,worst=0;for(let k=0;k<s.length;k++){const v=(r.mode==='floor'?Math.floor:r.mode==='ceil'?Math.ceil:Math.round)(s[k]/60+r.margin);const d=Math.abs(v-c[k]);if(!d)e++;if(d<=1)w++;if(d>worst)worst=d;}return `${r.mode} m${r.margin} ${e}/${s.length} w1 ${w} worst ${worst}`;};
  const chartF=slots.map(s=>s.chart.fajr), chartI=slots.map(s=>s.chart.isha);
  console.log('\n'+f);
  for(const a of [15,15.5,16,16.5,17,17.5,18,18.5,19]){
    const fa=[],ii=[];
    for(let i=0;i<slots.length;i++){fa.push(sec(ctx.hourAngle(i,-a,false)));let v=sec(ctx.hourAngle(i,-a,true));ii.push(v===null?null:(v<36000?v+86400:v));}
    console.log(' ',a,'fajr',sc(fa,chartF),'| isha',sc(ii,chartI));
  }
}
