import fs from 'node:fs';
import { loadFlex, makeContext45 } from './lib8.mjs';
const W = process.env.HOME + '/athan-gitree/census/o1l-city/O1l-31';
const cols = { fajr:'fajr', sunrise:'sunrise', dhuhr:'dhuhr', asr:'asr', maghrib:'maghrib', isha:'isha' };
const { slots } = loadFlex(W+'/data/no-irn-stavanger-2026.json', cols);
const pack = await makeContext45(59.102013,5.712610,slots); const ctx=pack.ctx;
const hm=(d)=>isNaN(d.getTime())?'--:--':`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
for (let i=0;i<slots.length;i++){
  const s=slots[i]; if(!(s.key>='2026-03-20'&&s.key<='2026-04-20')) continue;
  const is=ctx.hourAngle(i,-15,true), f=ctx.hourAngle(i,-16,false);
  console.log(s.key,'f16',hm(f),'fp',s.chart.fajr,'i15',hm(is),'ip',s.chart.isha,'gap',(s.chart.isha-s.chart.maghrib));
}
