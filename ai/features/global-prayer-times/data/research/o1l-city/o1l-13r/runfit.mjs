import {fit,rows2026} from './fit.mjs';
import fs from 'fs';
const files=process.argv.slice(2);
for(const f of files){
  const t=fs.readFileSync('captures/'+f,'utf8');
  const d=JSON.parse(t.match(/let confData = (\{[\s\S]*?\});/)[1]);
  const rows=rows2026(d);
  const r=fit({lat:d.latitude,lon:d.longitude,rows});
  const pct=b=>(b.w1/b.n*100).toFixed(1)+'%';
  const pctE=b=>(b.ex/b.n*100).toFixed(1)+'%';
  console.log('==',f.replace('mawaqit-bd-','').replace('.html',''),'lat',d.latitude.toFixed(2),'lon',d.longitude.toFixed(2));
  console.log('   fajr angle',r.fajr.fa.toFixed(2),'margin',r.fajr.m,'within1',pct(r.fajr),'exact',pctE(r.fajr),'MAE',(r.fajr.ae/r.fajr.n).toFixed(2));
  console.log('   isha',r.isha.ia?('angle '+r.isha.ia.toFixed(2)):('interval '+r.isha.interval),'margin',r.isha.m,'within1',pct(r.isha),'exact',pctE(r.isha),'MAE',(r.isha.ae/r.isha.n).toFixed(2));
  for(const c of ['sunrise','dhuhr','asr','maghrib'])
    console.log('   ',c,'margin',r[c].m,'within1',pct(r[c]),'exact',pctE(r[c]),'MAE',(r[c].ae/r[c].n).toFixed(2),'sd',r[c].sd.toFixed(2));
}
