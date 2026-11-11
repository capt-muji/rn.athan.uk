import fs from 'node:fs';
import { loadFlex, makeContext45 } from './lib8.mjs';
const W = process.env.HOME + '/athan-gitree/census/o1l-city/O1l-31';
const cols = { fajr:'fajr', sunrise:'sunrise', dhuhr:'dhuhr', asr:'asr', maghrib:'maghrib', isha:'isha' };
for (const [city,lat,lng] of [['stavanger',59.102013,5.712610],['alesund',62.767125,6.168668]]) {
  const { slots } = loadFlex(W+'/data/no-irn-'+city+'-2026.json', cols);
  const pack = await makeContext45(lat,lng,slots); const ctx = pack.ctx;
  const sec=(d)=>isNaN(d.getTime())?null:d.getHours()*3600+d.getMinutes()*60+d.getSeconds();
  console.log('\n== '+city);
  for (let i=0;i<slots.length;i+=7){
    const s=slots[i];
    const f=sec(ctx.hourAngle(i,-16,false)), is=sec(ctx.hourAngle(i,-15,true));
    const sr=s.chart.sunrise*60, mg=s.chart.maghrib*60;
    const night=((sr+86400-mg)/60); // night minutes
    const fgap=(sr-s.chart.fajr*60)/60, igap=(s.chart.isha*60-mg)/60;
    const fr=fgap/night, ir=igap/night;
    console.log(s.key,'fNaN',f===null,'iNaN',is===null,'night',night.toFixed(0),'fgap',fgap.toFixed(1),'f/night',fr.toFixed(3),'igap',igap.toFixed(1),'i/night',ir.toFixed(3));
  }
}
