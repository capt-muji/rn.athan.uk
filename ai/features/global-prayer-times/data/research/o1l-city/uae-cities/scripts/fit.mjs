// UAE emirate-layer fit + Dubai-asr adjudication. Engine: adhan 4.4.6, TZ Asia/Dubai (UTC+4, no DST).
import fs from 'fs';
import adhan from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js';

const AREAS = JSON.parse(fs.readFileSync('data/areas.json','utf8'));
const P = ['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const FIELD = {fajr:'fajr',sunrise:'shurooq',dhuhr:'zuhr',asr:'asr',maghrib:'maghrib',isha:'isha'};
const EM = {1:'Abu Dhabi',2:'Dubai',3:'Sharjah',4:'Ajman',5:'Umm Al Quwain',6:'Ras Al Khaimah',7:'Fujairah'};

const files = process.argv.slice(2);
let rows = [];
for (const f of files) rows.push(...(JSON.parse(fs.readFileSync(f,'utf8')).prayerData||[]));
const areaById = new Map(AREAS.map(a=>[a.cityID,a]));

function params(adj) {
  const p = new adhan.CalculationParameters('Other',18.2,18.2);
  p.madhab = adhan.Madhab.Shafi;
  p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  p.adjustments = {...adj};
  p.rounding = adhan.Rounding.None;
  return p;
}
function predict(dateStr,lat,lon,adj) {
  const [y,m,d] = dateStr.split('-').map(Number);
  const dayStart = Date.UTC(y,m-1,d);
  const t = new adhan.PrayerTimes(new adhan.Coordinates(lat,lon), new Date(dayStart), params(adj));
  const out = {};
  for (const k of P) {
    const mins = (new Date(t[k]).getTime()-dayStart)/60000 + 240;  // Asia/Dubai fixed UTC+4
    out[k] = k==='sunrise' ? Math.floor(mins+1e-9) : Math.round(mins);
  }
  return out;
}
const obs = (row,k) => Number(row[FIELD[k]].slice(11,13))*60 + Number(row[FIELD[k]].slice(14,16));

const RECORD = {fajr:0,sunrise:-3,dhuhr:2,asr:0,maghrib:2,isha:-1};       // measured federal recipe
const PRESET = {fajr:0,sunrise:-3,dhuhr:3,asr:3,maghrib:3,isha:0};          // adhan 4.4.6 CalculationMethod.Dubai()

function score(rs, adj, label) {
  const acc = {}; for (const k of P) acc[k]={n:0,exact:0,w1:0,sum:0,bias:0,worst:0};
  const cache = new Map();
  for (const row of rs) {
    const a = areaById.get(row.areaID); if (!a) throw new Error('no coords '+row.areaID);
    const date = row.gDate.slice(0,10);
    const key = a.cityID+'|'+date;
    let pr = cache.get(key);
    if (!pr) { pr = predict(date,a.latitude,a.longitude,adj); cache.set(key,pr); }
    for (const k of P) {
      const d = obs(row,k)-pr[k]; const s=acc[k];
      s.n++; if(d===0)s.exact++; if(Math.abs(d)<=1)s.w1++; s.sum+=Math.abs(d); s.bias+=d;
      if(Math.abs(d)>Math.abs(s.worst))s.worst=d;
    }
  }
  const tot = P.reduce((t,k)=>({n:t.n+acc[k].n,exact:t.exact+acc[k].exact,w1:t.w1+acc[k].w1,sum:t.sum+acc[k].sum}),{n:0,exact:0,w1:0,sum:0});
  const line = P.map(k=>`${k} exact ${(100*acc[k].exact/acc[k].n).toFixed(1)} w1 ${(100*acc[k].w1/acc[k].n).toFixed(1)} bias ${(acc[k].bias/acc[k].n).toFixed(2)} worst ${acc[k].worst}`).join(' | ');
  return {label,rows:rs.length,exact:100*tot.exact/tot.n,w1:100*tot.w1/tot.n,mae:tot.sum/tot.n,acc,line};
}
const pct = x=>x.toFixed(1)+'%';
const out=[];
out.push(`# UAE emirate layer — fit run`);
out.push(`rows: ${rows.length} from ${files.join(', ')}`);
out.push(`dates: ${[...new Set(rows.map(r=>r.gDate.slice(0,10)))].sort()[0]} .. ${[...new Set(rows.map(r=>r.gDate.slice(0,10)))].sort().slice(-1)[0]}  areas: ${new Set(rows.map(r=>r.areaID)).size}`);
out.push('');
// 1. one recipe, whole country
const all = score(rows, RECORD, 'ALL areas, record recipe');
out.push(`## Whole country, record recipe (0/-3/+2/0/+2/-1)`);
out.push(`| scope | rows | exact | within1 | MAE |`);
out.push(`|---|---|---|---|---|`);
out.push(`| all 60 areas | ${all.rows} | ${pct(all.exact)} | ${pct(all.w1)} | ${all.mae.toFixed(3)} |`);
out.push('');
// 2. per emirate
out.push(`## Per emirate, the same record recipe`);
out.push(`| emirate | areas | rows | exact | within1 | MAE | per-prayer bias (min) |`);
out.push(`|---|---|---|---|---|---|---|`);
const perEm = {};
for (const e of [1,2,3,4,5,6,7]) {
  const ids = new Set(AREAS.filter(a=>a.emirate===e).map(a=>a.cityID));
  const rs = rows.filter(r=>ids.has(r.areaID));
  if (!rs.length) continue;
  const s = score(rs, RECORD, EM[e]);
  perEm[e]=s;
  out.push(`| ${EM[e]} | ${ids.size} | ${s.rows} | ${pct(s.exact)} | ${pct(s.w1)} | ${s.mae.toFixed(3)} | ${P.map(k=>k+' '+(s.acc[k].bias/s.acc[k].n).toFixed(2)).join(', ')} |`);
}
out.push('');
// 3. free per-area residual constants per emirate (are the constants emirate-uniform?)
out.push(`## Per-area residual constants vs raw 18.2/18.2 (mean obs - raw, minutes)`);
out.push(`| emirate | area | rows | ${P.join(' | ')} |`);
out.push(`|---|---|---|---|---|---|---|---|`);
const perArea = [];
for (const a of AREAS) {
  const rs = rows.filter(r=>r.areaID===a.cityID);
  if (!rs.length) continue;
  const acc={}; for(const k of P) acc[k]=0;
  for (const row of rs) { const pr = predict(row.gDate.slice(0,10),a.latitude,a.longitude,{fajr:0,sunrise:0,dhuhr:0,asr:0,maghrib:0,isha:0}); for(const k of P) acc[k]+=obs(row,k)-pr[k]; }
  const means = P.map(k=>acc[k]/rs.length);
  perArea.push({emirate:a.emirate,cityID:a.cityID,name:a.cityNameEn,rows:rs.length,means});
  out.push(`| ${EM[a.emirate]} | ${a.cityNameEn} | ${rs.length} | ${means.map(m=>m.toFixed(2)).join(' | ')} |`);
}
out.push('');
// 4. Dubai asr adjudication
const dubaiIds = new Set(AREAS.filter(a=>a.emirate===2).map(a=>a.cityID));
const dubaiRows = rows.filter(r=>dubaiIds.has(r.areaID));
const rec = score(dubaiRows, RECORD, 'Dubai record recipe');
const pre = score(dubaiRows, PRESET, 'Dubai adhan preset');
out.push(`## DUBAI: the asr question (cityID 32 Dubai city + 59 Rural Dubai + 60 Hatta, ${dubaiRows.length} rows)`);
out.push(`| recipe | exact | within1 | MAE |`);
out.push(`|---|---|---|---|`);
out.push(`| record (fajr 0, sunrise -3, dhuhr +2, asr 0, maghrib +2, isha -1) | ${pct(rec.exact)} | ${pct(rec.w1)} | ${rec.mae.toFixed(3)} |`);
out.push(`| adhan 4.4.6 preset Dubai (0, -3, +3, +3, +3, 0) | ${pct(pre.exact)} | ${pct(pre.w1)} | ${pre.mae.toFixed(3)} |`);
out.push('');
out.push(`Per prayer, preset vs the authority's own rows:`);
out.push(`| prayer | preset bias (min) | preset exact % | preset worst | record bias | record exact % |`);
out.push(`|---|---|---|---|---|---|`);
for (const k of P) out.push(`| ${k} | ${(pre.acc[k].bias/pre.acc[k].n).toFixed(2)} | ${pct(100*pre.acc[k].exact/pre.acc[k].n)} | ${pre.acc[k].worst} | ${(rec.acc[k].bias/rec.acc[k].n).toFixed(2)} | ${pct(100*rec.acc[k].exact/rec.acc[k].n)} |`);
out.push('');
// asr interval check: is the authority's asr literally the preset's asr - 3?
const asrDiff = dubaiRows.map(r=>obs(r,'asr') - predict(r.gDate.slice(0,10), areaById.get(r.areaID).latitude, areaById.get(r.areaID).longitude, PRESET).asr);
const hist = {}; for (const d of asrDiff) hist[d]=(hist[d]||0)+1;
out.push(`Asr residual histogram (authority - adhan Dubai preset): ${Object.keys(hist).sort((a,b)=>a-b).map(k=>`${k}:${hist[k]}`).join(' ')}`);
const dhuhrDiff = dubaiRows.map(r=>obs(r,'dhuhr') - predict(r.gDate.slice(0,10), areaById.get(r.areaID).latitude, areaById.get(r.areaID).longitude, PRESET).dhuhr);
const h2={}; for(const d of dhuhrDiff) h2[d]=(h2[d]||0)+1;
out.push(`Dhuhr residual histogram (authority - adhan Dubai preset): ${Object.keys(h2).sort((a,b)=>a-b).map(k=>`${k}:${h2[k]}`).join(' ')}`);
fs.writeFileSync('data/FIT-EMIRATES.md', out.join('\n')+'\n');
console.log(out.join('\n'));
