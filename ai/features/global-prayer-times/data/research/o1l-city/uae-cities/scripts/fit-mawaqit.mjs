// mawaqit UAE mosque years: fit the record federal recipe; record the platform engine.
import fs from 'fs';
import adhan from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js';
const P=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const files = process.argv.slice(2);
function params(adj){const p=new adhan.CalculationParameters('Other',18.2,18.2);p.madhab=adhan.Madhab.Shafi;p.highLatitudeRule=adhan.HighLatitudeRule.MiddleOfTheNight;p.adjustments={...adj};p.rounding=adhan.Rounding.None;return p;}
function predict(dateStr,lat,lon,adj){const [y,m,d]=dateStr.split('-').map(Number);const ds=Date.UTC(y,m-1,d);
  const t=new adhan.PrayerTimes(new adhan.Coordinates(lat,lon),new Date(ds),params(adj));const o={};
  for(const k of P){const mins=(new Date(t[k]).getTime()-ds)/60000+240;o[k]=k==='sunrise'?Math.floor(mins+1e-9):Math.round(mins);}return o;}
const toMin=s=>{const [h,m]=s.split(':').map(Number);return h*60+m;};
const RECORD={fajr:0,sunrise:-3,dhuhr:2,asr:0,maghrib:2,isha:-1};
const out=[];
for (const f of files) {
  const d=JSON.parse(fs.readFileSync(f,'utf8'));
  const adj = f.includes('record') ? RECORD : RECORD;
  const acc={}; for(const k of P) acc[k]={n:0,e:0,w1:0,bias:0,worst:0};
  let rows=0;
  for (let mi=0; mi<d.calendar.length; mi++) {
    const month=d.calendar[mi];
    for (const day of Object.keys(month)) {
      const date=`2026-${String(mi+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const pr=predict(date,d.latitude,d.longitude,adj);
      const vals=month[day];
      rows++;
      P.forEach((k,i)=>{const diff=toMin(vals[i])-pr[k];const a=acc[k];a.n++;if(diff===0)a.e++;if(Math.abs(diff)<=1)a.w1++;a.bias+=diff;if(Math.abs(diff)>Math.abs(a.worst))a.worst=diff;});
    }
  }
  out.push(`### ${f} — ${d.name} (${d.latitude.toFixed(4)}, ${d.longitude.toFixed(4)}), ${rows} day-entries`);
  out.push(`| prayer | exact % | within1 % | bias | worst |`); out.push(`|---|---|---|---|---|`);
  for (const k of P) { const a=acc[k]; out.push(`| ${k} | ${(100*a.e/a.n).toFixed(1)} | ${(100*a.w1/a.n).toFixed(1)} | ${(a.bias/a.n).toFixed(2)} | ${a.worst} |`); }
  const tot=P.reduce((t,k)=>({n:t.n+acc[k].n,e:t.e+acc[k].e,w1:t.w1+acc[k].w1}),{n:0,e:0,w1:0});
  out.push(`totals: exact ${(100*tot.e/tot.n).toFixed(1)}% within1 ${(100*tot.w1/tot.n).toFixed(1)}%`);
  out.push('');
}
fs.writeFileSync('data/FIT-MAWAQIT.md', out.join('\n')+'\n');
console.log(out.join('\n'));
