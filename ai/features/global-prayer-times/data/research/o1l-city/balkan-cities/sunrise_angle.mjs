// Solve each city's effective sunrise depression: the angle whose adhan "fajr" crossing
// (morning, sun at -angle) reproduces the published sunrise. Compare with the elevation dip.
import fs from 'node:fs';
import { loadRows, compute } from './fitlib.mjs';
const TZ='Europe/Sarajevo';
const coords=JSON.parse(fs.readFileSync('data/ba_coords.json','utf8'));
const elev=JSON.parse(fs.readFileSync('data/ba_elev.json','utf8'));
const index=JSON.parse(fs.readFileSync('data/ba_cities_index.json','utf8'));
const out=[];
for(const id of Object.keys(index).map(Number)){
  const meta=index[id], c=coords[id];
  const data=loadRows('data/'+meta.file);
  let best=null;
  for(let a=0.9;a<=2.6+1e-9;a+=0.01){
    const rows=compute(data,{lat:c.lat,lon:c.lon,tz:TZ,fajr:a,isha:16,madhab:'shafi'});
    const r=rows.map(x=>x.want.sunrise-x.got.fajr);
    const m=r.reduce((s,v)=>s+v,0)/r.length;
    const sd=Math.sqrt(r.reduce((s,v)=>s+(v-m)**2,0)/r.length);
    const loss=Math.abs(m)+sd;
    if(!best||loss<best.loss) best={a:+a.toFixed(2),m:+m.toFixed(2),sd:+sd.toFixed(2),loss};
  }
  const e=elev[id]?.cityElevationM;
  const dip=e?Math.acos(6371000/(6371000+e))*180/Math.PI:null;
  out.push({place:meta.place,lat:c.lat,elevM:e,angle:best.a,resMean:best.m,resSd:best.sd,dipDeg:dip?+dip.toFixed(3):null,horizon:best.a-0.833});
  console.error(meta.place.padEnd(16),'elev',String(e).padStart(5),'angle',best.a,'m',best.m,'sd',best.sd,'dip',dip?.toFixed(2));
}
fs.writeFileSync('data/ba_sunrise_angle.json',JSON.stringify(out,null,1));
const ang=out.map(o=>o.angle);
console.log('angle range',Math.min(...ang),Math.max(...ang));
const corr=(xs,ys)=>{const n=xs.length;const mx=xs.reduce((a,b)=>a+b,0)/n,my=ys.reduce((a,b)=>a+b,0)/n;let sxy=0,sxx=0,syy=0;for(let i=0;i<n;i++){sxy+=(xs[i]-mx)*(ys[i]-my);sxx+=(xs[i]-mx)**2;syy+=(ys[i]-my)**2;}return sxy/(sxx*syy)**.5;};
console.log('corr(angle, elev)',corr(out.map(o=>o.elevM),ang).toFixed(3));
console.log('corr(angle, lat)',corr(out.map(o=>o.lat),ang).toFixed(3));
console.log('corr(angle, lon)',corr(out.map(o=>coords[Object.keys(index).map(Number).find(i=>index[i].place===o.place)].lon),ang).toFixed(3));
