import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { Coordinates, CalculationMethod, PrayerTimes, Madhab } = require('$HOME/athan-gitree/census/adhan-build/node_modules/adhan');
const TZ = 'Africa/Lagos';
const PK = ['fajr','sunrise','dhuhr','asr','magrib','isha'];
const f = (d) => new Intl.DateTimeFormat('en-GB',{timeZone:TZ,hour:'2-digit',minute:'2-digit',hour12:false}).format(d);
const mi = (s) => { const [a,b] = s.split(':').map(Number); return a*60+b; };

function parse(file) {
  const h = fs.readFileSync(file,'utf8');
  const rows = [];
  for (const t of h.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || []) {
    const day = /class="day">([^<]+)</.exec(t);
    const v = [...t.matchAll(/<td class="[a-z_]+">\s*(\d\d:\d\d)\s*<\/td>/g)].map(m => m[1]);
    if (day && v.length === 6) rows.push({ label: day[1].trim(), v });
  }
  return rows;
}

const file = process.argv[2];
const lat = Number(process.argv[3]);
const lon = Number(process.argv[4]);
const rows = parse(file);
const coords = new Coordinates(lat, lon);

function evaluate(fa, ia, off, hanafi) {
  const p = CalculationMethod.Other();
  p.fajrAngle = fa; p.ishaAngle = ia; p.madhab = hanafi ? Madhab.Hanafi : Madhab.Shafi;
  const diffs = PK.map(() => []);
  for (const r of rows) {
    const d = new Date(r.label);
    const pt = new PrayerTimes(coords, new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12)), p);
    const got = {
      fajr: f(pt.fajr), sunrise: f(pt.sunrise),
      dhuhr: f(new Date(pt.dhuhr.getTime() + off * 60000)),
      asr: f(pt.asr), magrib: f(pt.maghrib), isha: f(pt.isha),
    };
    PK.forEach((k, i) => {
      let x = mi(got[k]) - mi(r.v[i]);
      if (x > 720) x -= 1440; if (x < -720) x += 1440;
      diffs[i].push(x);
    });
  }
  const rmse = diffs.map(a => Math.sqrt(a.reduce((s,x)=>s+x*x,0)/a.length));
  return { rmse, overall: Math.sqrt(rmse.reduce((s,x)=>s+x*x,0)/6) };
}
const line = (n, r) => console.log(`${n.padEnd(26)} ${r.rmse.map(x=>x.toFixed(2).padStart(5)).join(' ')}  | overall ${r.overall.toFixed(2)}`);

console.log(`# ${file} rows ${rows.length} coords ${lat},${lon}`);
console.log(`${'method'.padEnd(26)} ${PK.map(k=>k.slice(0,5).padStart(5)).join(' ')}`);
line('MWL 18/17', evaluate(18,17,0,false));
line('ISNA 15/15', evaluate(15,15,0,false));
line('Egyptian 19.5/17.5', evaluate(19.5,17.5,0,false));
line('Egyptian +5 dhuhr', evaluate(19.5,17.5,5,false));
line('MWL hanafi asr', evaluate(18,17,0,true));
let best = null;
for (let fa = 14; fa <= 21.001; fa += 0.25) for (let ia = 14; ia <= 20.001; ia += 0.25) {
  const r = evaluate(fa, ia, 0, false);
  if (!best || r.overall < best.r.overall) best = { fa, ia, r };
}
for (let fa = best.fa - 0.25; fa <= best.fa + 0.2501; fa += 0.05) for (let ia = best.ia - 0.25; ia <= best.ia + 0.2501; ia += 0.05) {
  const r = evaluate(fa, ia, 0, false);
  if (r.overall < best.r.overall) best = { fa, ia, r };
}
line(`FREE ${best.fa.toFixed(2)}/${best.ia.toFixed(2)}`, best.r);
