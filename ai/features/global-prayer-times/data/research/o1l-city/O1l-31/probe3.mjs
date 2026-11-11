import fs from 'node:fs';
const W = process.env.HOME + '/athan-gitree/census/o1l-city/O1l-31';
const d=JSON.parse(fs.readFileSync(W+'/data/no-irn-stavanger-2026.json','utf8'));
const keys=Object.keys(d).sort();
const m=(t)=>{const[a,b]=t.split(':').map(Number);return a*60+b;};
let prev=null, runs=[];
for(const k of keys){
  const f=m(d[k].fajr), i=m(d[k].isha), sr=m(d[k].sunrise), mg=m(d[k].maghrib);
  if(prev && f===prev.f) runs.push([k,'fajr',d[k].fajr]);
  prev={f};
}
// print fajr by 10-day steps
for(let i=0;i<keys.length;i+=10){const k=keys[i];console.log(k,d[k].fajr,d[k].sunrise,d[k].dhuhr,d[k].asr,d[k].maghrib,d[k].isha);}
