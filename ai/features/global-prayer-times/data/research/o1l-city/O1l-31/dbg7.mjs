import { loadFlex, makeContext45 } from './lib8.mjs';
const W=process.env.HOME+'/athan-gitree/census/o1l-city/O1l-31';
const cols={fajr:'fajr',sunrise:'sunrise',dhuhr:'dhuhr',asr:'asr',maghrib:'maghrib',isha:'isha'};
const sec=(d)=>d===null||isNaN(d.getTime())?null:d.getHours()*3600+d.getMinutes()*60+d.getSeconds();
for(const [f,lat,lng] of [['fi-turku-2026',60.4518,22.2666],['fi-tampere-2026',61.4978,23.7610]]){
  const {slots}=loadFlex(W+'/data/'+f+'.json',cols);
  const pack=await makeContext45(lat,lng,slots); const ctx=pack.ctx;
  console.log('\n'+f);
  const best=[];
  for(let a=12;a<=19;a+=0.25){
    let f=0,i=0;
    for(let k=0;k<slots.length;k++){
      const v=sec(ctx.hourAngle(k,-a,false)); if(v!==null&&Math.abs(Math.floor(v/60)-slots[k].chart.fajr)<=1)f++;
      let w=sec(ctx.hourAngle(k,-a,true)); if(w!==null&&w<36000)w+=86400; if(w!==null&&Math.abs(Math.floor(w/60)-(slots[k].chart.isha<300?slots[k].chart.isha+1440:slots[k].chart.isha))<=1)i++;
    }
    best.push([a,f,i]);
  }
  best.sort((x,y)=>y[1]-x[1]); console.log('best fajr angles',best.slice(0,4));
  best.sort((x,y)=>y[2]-x[2]); console.log('best isha angles',best.slice(0,4));
}
