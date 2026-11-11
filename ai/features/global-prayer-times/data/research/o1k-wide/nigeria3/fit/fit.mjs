import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { Coordinates, CalculationMethod, PrayerTimes, Madhab } = require('$HOME/athan-gitree/census/adhan-build/node_modules/adhan');

const TZ = 'Africa/Lagos';
const KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const TABLE_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];

function fmt(date) {
  const s = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  return s === '24:00' ? '00:00' : s;
}
function toMin(hhmm) { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; }

const rows = [];
const raw = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
for (const [file, days] of Object.entries(raw)) {
  for (const [label, vals] of Object.entries(days)) {
    const d = new Date(label);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const rec = { date: iso };
    TABLE_KEYS.forEach((k, i) => { rec[k] = vals[i]; });
    rows.push(rec);
  }
}
rows.sort((a, b) => a.date.localeCompare(b.date));

function run(lat, lon, fajrAngle, ishaAngle, dhuhrOffsetMin, hanafi) {
  const coords = new Coordinates(lat, lon);
  const params = CalculationMethod.Other();
  params.fajrAngle = fajrAngle;
  params.ishaAngle = ishaAngle;
  params.madhab = hanafi ? Madhab.Hanafi : Madhab.Shafi;
  const diffs = KEYS.map(() => []);
  for (const r of rows) {
    const [y, m, dd] = r.date.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, dd, 12, 0, 0));
    const pt = new PrayerTimes(coords, date, params);
    const got = {
      fajr: fmt(pt.fajr),
      sunrise: fmt(pt.sunrise),
      dhuhr: fmt(new Date(pt.dhuhr.getTime() + dhuhrOffsetMin * 60000)),
      asr: fmt(pt.asr),
      magrib: fmt(pt.maghrib),
      isha: fmt(pt.isha),
    };
    KEYS.forEach((k, i) => {
      let d = toMin(got[TABLE_KEYS[i]]) - toMin(r[TABLE_KEYS[i]]);
      if (d > 720) d -= 1440;
      if (d < -720) d += 1440;
      diffs[i].push(d);
    });
  }
  const rmse = diffs.map((a) => Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length));
  const mean = diffs.map((a) => a.reduce((s, x) => s + x, 0) / a.length);
  return { rmse, mean, overall: Math.sqrt(rmse.reduce((s, x) => s + x * x, 0) / 6) };
}

function show(name, res) {
  const r = res.rmse.map((x) => x.toFixed(2)).join(' | ');
  const m = res.mean.map((x) => x.toFixed(2)).join(' | ');
  console.log(`${name.padEnd(34)} RMSE(min) ${r}  overall ${res.overall.toFixed(2)}`);
  console.log(`${''.padEnd(34)} MEAN(min) ${m}`);
}

const LAT = Number(process.env.LAT ?? 9.0579);
const LON = Number(process.env.LON ?? 7.4951);
console.log(`# rows ${rows.length}  coords ${LAT},${LON}  TZ ${TZ}`);
console.log('# prayer order: fajr sunrise dhuhr asr maghrib isha');
show('MWL 18/17 off0 shafi', run(LAT, LON, 18, 17, 0, false));
show('ISNA 15/15 off0 shafi', run(LAT, LON, 15, 15, 0, false));
show('Egyptian 19.5/17.5 off0 shafi', run(LAT, LON, 19.5, 17.5, 0, false));
show('Egyptian 19.5/17.5 off5 shafi', run(LAT, LON, 19.5, 17.5, 5, false));
show('MWL 18/17 off5 shafi', run(LAT, LON, 18, 17, 5, false));
show('MWL 18/17 off0 hanafi', run(LAT, LON, 18, 17, 0, true));

// free fit over angles + dhuhr offset at fixed coords
let best = null;
for (let fa = 14; fa <= 20.5001; fa += 0.1) {
  for (let ia = 14; ia <= 19.5001; ia += 0.1) {
    for (let off = 0; off <= 8; off += 1) {
      const res = run(LAT, LON, fa, ia, off, false);
      if (!best || res.overall < best.res.overall) best = { fa, ia, off, res };
    }
  }
}
console.log(`FREE(fixed coords) fajr ${best.fa.toFixed(1)} isha ${best.ia.toFixed(1)} dhuhrOff ${best.off} shafi`);
show('free', best.res);
fs.writeFileSync(process.env.FITOUT ?? 'fit-out.json', JSON.stringify({ rows, best: { ...best } }, null, 1));
