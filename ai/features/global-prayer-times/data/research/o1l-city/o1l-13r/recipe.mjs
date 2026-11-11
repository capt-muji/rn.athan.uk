import {Adhan,hm,toMin} from './lib.mjs';
import {rows2026} from './fit.mjs';
import fs from 'fs';
const files=process.argv.slice(2);
const recipes=[
 {name:'IFB ridge 19.25/18.65 Hanafi',fajr:19.25,isha:18.65,mad:'hanafi'},
 {name:'IFB 18.95/18.65 Hanafi',fajr:18.95,isha:18.65,mad:'hanafi'},
 {name:'MWL 18/17 Shafi',fajr:18,isha:17,mad:'shafi'},
 {name:'mawaqit default 15/15 Shafi',fajr:15,isha:15,mad:'shafi'},
];
for(const f of files){
  const t=fs.readFileSync('captures/'+f,'utf8');
  const d=JSON.parse(t.match(/let confData = (\{[\s\S]*?\});/)[1]);
  const rows=rows2026(d);
  const co=new Adhan.Coordinates(d.latitude,d.longitude);
  console.log('==',f.replace('mawaqit-bd-','').replace('.html',''));
  for(const r of recipes){
    const p=new Adhan.CalculationParameters('Other');p.fajrAngle=r.fajr;p.ishaAngle=r.isha;p.ishaInterval=0;
    p.madhab=r.mad==='hanafi'?Adhan.Madhab.Hanafi:Adhan.Madhab.Shafi;
    const cols={fajr:[],sunrise:[],dhuhr:[],asr:[],maghrib:[],isha:[]};
    const obs={fajr:[],sunrise:[],dhuhr:[],asr:[],maghrib:[],isha:[]};
    rows.forEach(row=>{
      const [y,mo,da]=row.date.split('-').map(Number);
      const pt=new Adhan.PrayerTimes(co,new Date(Date.UTC(y,mo-1,da,6,0,0)),p);
      cols.fajr.push(toMin(hm(pt.fajr)));cols.sunrise.push(toMin(hm(pt.sunrise)));cols.dhuhr.push(toMin(hm(pt.dhuhr)));
      cols.asr.push(toMin(hm(pt.asr)));cols.maghrib.push(toMin(hm(pt.maghrib)));cols.isha.push(toMin(hm(pt.isha)));
      ['fajr','sunrise','dhuhr','asr','maghrib','isha'].forEach((c,i)=>obs[c].push(toMin(row.t[i])));
    });
    const out=[];
    for(const c of ['fajr','sunrise','dhuhr','asr','maghrib','isha']){
      const diffs=cols[c].map((v,i)=>obs[c][i]-v).sort((a,b)=>a-b);
      const med=diffs[Math.floor(diffs.length/2)];
      let w1=0,ex=0,ae=0;
      cols[c].forEach((v,i)=>{const dd=Math.abs(obs[c][i]-v-med);ae+=dd;if(dd<=1)w1++;if(dd<0.5)ex++;});
      out.push(`${c} ${med>=0?'+':''}${med} ${(w1/cols[c].length*100).toFixed(0)}%w1`);
    }
    console.log('   ',r.name.padEnd(28),out.join(' '));
  }
}
