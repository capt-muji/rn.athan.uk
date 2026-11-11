import fs from 'node:fs';
import { loadRows, compute, PRAYERS } from './fitlib.mjs';
const TZ='Europe/Sarajevo';
const coords=JSON.parse(fs.readFileSync('data/ba_coords.json','utf8'));
const index=JSON.parse(fs.readFileSync('data/ba_cities_index.json','utf8'));
const want=['Sarajevo','Mostar','Banja Luka','Tuzla','Bihać','Trebinje'];
for(const id of Object.keys(index).map(Number)){
  const meta=index[id]; if(!want.includes(meta.place)) continue;
  const c=coords[id]; const data=loadRows('data/'+meta.file);
  const rows=compute(data,{lat:c.lat,lon:c.lon,tz:TZ,fajr:18,isha:16,madhab:'shafi'});
  const byMonth={};
  for(const r of rows){const m=r.date.slice(5,7); (byMonth[m]??=[]).push(r);}
  const line=(p)=>{
    const out=[];
    for(const m of Object.keys(byMonth).sort()){
      const rs=byMonth[m].map(x=>x.want[p]-x.got[p]);
      const mean=rs.reduce((a,b)=>a+b,0)/rs.length;
      const sd=Math.sqrt(rs.reduce((a,b)=>a+(b-mean)**2,0)/rs.length);
      out.push(`${m}:${mean.toFixed(1)}/${sd.toFixed(1)}`);
    }
    return out.join(' ');
  };
  console.log('###',meta.place,'lat',c.lat);
  for(const p of PRAYERS) console.log(' ',p.padEnd(8),line(p));
}
