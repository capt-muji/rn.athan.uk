import fs from 'node:fs';
import { loadAdhan, evalFixed } from '$HOME/athan-gitree/census/o1k-wide/fit1/lib.mjs';
const W='$HOME/athan-gitree/census/o1l-city/thailand-provinces';
const coords=JSON.parse(fs.readFileSync(W+'/data/th-province-coordinates.json','utf8'));
const fit=JSON.parse(fs.readFileSync(W+'/data/th-fit.json','utf8'));
const adhan=await loadAdhan();
const COLS=['fajr','sunrise','dhuhr','asr','magrib','isha'];
const slug=en=>en.toLowerCase().replace(/ /g,'');
for(const [blk,suffix,year] of [['2569','2569',2026],['leap','2569-leap',2028]]){
  for(const [en,c0] of Object.entries(coords)){
    const rows=JSON.parse(fs.readFileSync(`${W}/data/th-cicot-${slug(en)}-${suffix}.json`,'utf8'));
    const keys=Object.keys(rows).sort();
    const c=new adhan.Coordinates(c0.lat,c0.lon);
    const bad=[];
    for(const p of COLS){
      const rec=fit.columns[p];
      const raw=[],chart=[];
      for(const k of keys){
        const [yy,mo,dd]=k.split('-').map(Number);
        const st=new adhan.SolarTime(new Date(yy,mo-1,dd),c);
        const at=h=>{const t=new adhan.TimeComponents(h).utcDate(yy,mo-1,dd);return t.getHours()*3600+t.getMinutes()*60+t.getSeconds();};
        raw.push(p==='fajr'?at(st.hourAngle(-19.8,false)):p==='isha'?at(st.hourAngle(-18.1,true)):p==='sunrise'?at(st.sunrise):p==='dhuhr'?at(st.transit):p==='asr'?at(st.afternoon(1)):at(st.sunset));
        const [hh,mi]=rows[k][p].split(':').map(Number); chart.push(hh*60+mi);
      }
      keys.forEach((k,i)=>{
        const mins=raw[i]/60+rec.margin;
        const v=rec.mode==='floor'?Math.floor(mins):rec.mode==='ceil'?Math.ceil(mins):Math.round(mins);
        if(Math.abs(v-chart[i])>1) bad.push([k,p,rows[k][p],v-chart[i]]);
      });
    }
    if(bad.length) console.log(blk,en,bad.length,JSON.stringify(bad.slice(0,12)));
  }
}
