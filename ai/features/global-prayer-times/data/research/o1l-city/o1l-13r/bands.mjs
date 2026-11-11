import fs from 'fs';
const j=JSON.parse(fs.readFileSync('data/bolura-sylhet.json','utf8'));
const dates=Object.keys(j.days).sort();
const cols=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const seq=cols.map(c=>dates.map(d=>j.days[d][c]));
function runs(v){const o=[];let p=null,n=0;for(const x of v){if(x===p)n++;else{if(p!==null)o.push([p,n]);p=x;n=1;}}o.push([p,n]);return o;}
console.log('days',dates.length);
const bounds=cols.map((c,i)=>runs(seq[i]).map(([v,n],k)=>n));
// band boundaries: index where value changes
const changeIdx=cols.map((c,i)=>{const idx=[];let p=null;seq[i].forEach((x,k)=>{if(x!==p){idx.push(k);p=x;}});return idx;});
for(let i=0;i<cols.length;i++) console.log(cols[i],'runs',changeIdx[i].length);
// alignment of boundaries across the 5 varying columns (exclude dhuhr)
const sets=changeIdx.map((s,i)=>new Set(s));
const base=changeIdx[0];
const aligned=base.filter(k=>changeIdx[1].includes(k)&&changeIdx[2].includes(k)&&changeIdx[3].includes(k)&&changeIdx[4].includes(k)&&changeIdx[5].includes(k));
console.log('fajr boundaries',base.length,'aligned across all six',aligned.length);
// print band table: start date, length, values
const r=runs(seq[0]);
let k=0;const rows=[];
for(const [v,n] of r){rows.push({start:dates[k],len:n,fajr:seq[0][k],sunrise:seq[1][k],dhuhr:seq[2][k],asr:seq[3][k],maghrib:seq[4][k],isha:seq[5][k]});k+=n;}
fs.writeFileSync('data/bolura-sylhet-bands.json',JSON.stringify(rows,null,1));
console.log('bands',rows.length);
console.log(rows.slice(0,6));
const lens={};r.forEach(([v,n])=>lens[n]=(lens[n]||0)+1);
console.log('band length histogram',lens);
