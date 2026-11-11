import fs from 'node:fs';
import { loadRows, compute } from './fitlib.mjs';
const TZ='Europe/Sarajevo';
const coords=JSON.parse(fs.readFileSync('data/ba_coords.json','utf8'));
const index=JSON.parse(fs.readFileSync('data/ba_cities_index.json','utf8'));
const out=[];
for(const id of Object.keys(index).map(Number)){
  const meta=index[id], c=coords[id];
  const data=loadRows('data/'+meta.file);
  const rows=compute(data,{lat:c.lat,lon:c.lon,tz:TZ,fajr:18,isha:16,madhab:'shafi'});
  let dp=0,dt=0;
  for(const r of rows){ dp+=r.want.maghrib-r.want.sunrise; dt+=r.got.maghrib-r.got.sunrise; }
  const n=rows.length;
  const dayLen=(lat)=>{let s=0; for(const g of compute(data,{lat,lon:c.lon,tz:TZ,fajr:18,isha:16,madhab:'shafi'})) s+=g.got.maghrib-g.got.sunrise; return s/n;};
  let lo=40,hi=48;
  for(let k=0;k<34;k++){const mid=(lo+hi)/2; if(dayLen(mid)<dp/n) lo=mid; else hi=mid;}
  out.push({place:meta.place,trueLat:c.lat,dayPub:+(dp/n).toFixed(2),dayTrue:+(dt/n).toFixed(2),latImplied:+((lo+hi)/2).toFixed(2)});
}
fs.writeFileSync('data/ba_daylen.json',JSON.stringify(out,null,1));
function reg(xs,ys){const n=xs.length;const mx=xs.reduce((a,b)=>a+b,0)/n,my=ys.reduce((a,b)=>a+b,0)/n;let sxy=0,sxx=0;for(let i=0;i<n;i++){sxy+=(xs[i]-mx)*(ys[i]-my);sxx+=(xs[i]-mx)**2;}const b=sxy/sxx;return{slope:+b.toFixed(3),intercept:+(my-b*mx).toFixed(1)};}
console.log('dayPub vs dayTrue',JSON.stringify(reg(out.map(o=>o.dayTrue),out.map(o=>o.dayPub))));
console.log('latImplied vs trueLat',JSON.stringify(reg(out.map(o=>o.trueLat),out.map(o=>o.latImplied))));
for(const o of out.sort((a,b)=>a.trueLat-b.trueLat)) console.log(o.place.padEnd(16),o.trueLat.toFixed(2),'pub',o.dayPub.toFixed(1),'true',o.dayTrue.toFixed(1),'impl',o.latImplied.toFixed(2));
