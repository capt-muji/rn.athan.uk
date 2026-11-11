// F5: India's isha line. Fit the isha column alone against 17 deg, 18 deg, a fixed interval,
// and a rounding convention, on the banked masjidbox city tables.
import fs from 'node:fs';
import * as adhan from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js';

const HOME = process.env.HOME;
const DIR = `${HOME}/athan-gitree/census/o1l-city/india-cities/data`;
const TZ = 'Asia/Kolkata';

// points recovered by O1l-11r (REPORT.md), lat/lon to 2dp
const CITIES = {
  'hyderabad-madinatul-ilm': [17.37, 78.37],
  'mumbai-anjuman-risalat': [19.09, 72.77],
  'mumbai-sunni-pathan': [18.97, 72.75],
  'bengaluru-rahmania': [13.06, 77.44],
  'kolkata-rafah': [22.68, 88.25],
  'kolkata-nandanpur': [22.48, 88.07],
  'srinagar-soqte': [34.09, 74.68],
  'ramban-noorani': [33.12, 75.20],
  'baharampur-fazle-elahi': [24.10, 88.14],
  'moradabad-chand': [29.19, 78.73],
};

const tzf = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const localMin = d => { const p = Object.fromEntries(tzf.formatToParts(d).map(x => [x.type, x.value])); return (+p.hour % 24) * 60 + +p.minute + +p.second / 60; };
const hm = s => { const [h, m] = String(s).split(':').map(Number); return h * 60 + m; };
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const sd = a => { const mu = mean(a); return Math.sqrt(mean(a.map(x => (x - mu) ** 2))); };

function compute(lat, lon, year, fajrAngle, ishaAngle, madhab) {
  const p = new adhan.CalculationParameters('Other', fajrAngle, ishaAngle);
  p.madhab = madhab;
  p.rounding = adhan.Rounding.None;
  const c = new adhan.Coordinates(lat, lon);
  const out = {};
  for (let m = 1; m <= 12; m++) {
    const dim = new Date(Date.UTC(year, m, 0)).getUTCDate();
    for (let d = 1; d <= dim; d++) {
      const pt = new adhan.PrayerTimes(c, new Date(Date.UTC(year, m - 1, d, 12)), p);
      out[`${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`] =
        { isha: localMin(pt.isha), maghrib: localMin(pt.maghrib) };
    }
  }
  return out;
}

const report = [];
for (const [slug, [lat, lon]] of Object.entries(CITIES)) {
  const file = `${DIR}/masjidbox-${slug}-2026.json`;
  if (!fs.existsSync(file)) { console.log(`MISSING ${file}`); continue; }
  const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
  const keys = Object.keys(rows).sort();
  const printed = keys.map(k => ({ k, isha: hm(rows[k].isha), maghrib: hm(rows[k].maghrib) })).filter(r => r.isha != null && r.maghrib != null);

  // the printed isha - maghrib interval: an interval rule has zero spread
  const gaps = printed.map(r => r.isha - r.maghrib);
  const gapSpread = Math.max(...gaps) - Math.min(...gaps);

  // angle scan on the isha column alone
  let bestA = { a: 0, w: -1 };
  const at = {};
  for (let ai = 1200; ai <= 2000; ai += 5) {
    const a = ai / 100;
    const eng = compute(lat, lon, 2026, 18, a, adhan.Madhab.Shafi);
    let e = 0, w = 0, worst = 0, sum = 0;
    for (const r of printed) {
      const d = r.isha - Math.round(eng[r.k].isha);
      sum += d; if (d === 0) e++; if (Math.abs(d) <= 1) w++; worst = Math.max(worst, Math.abs(d));
    }
    const s = { exact: e, within1: w, mean: sum / printed.length, worst };
    if (ai === 1700 || ai === 1800) at[a.toFixed(2)] = s;
    if (w > (bestA.w ?? -1)) bestA = { a: +a.toFixed(2), w, ...s };
  }
  const e17 = compute(lat, lon, 2026, 18, 17, adhan.Madhab.Shafi);
  const e18 = compute(lat, lon, 2026, 18, 18, adhan.Madhab.Shafi);
  // separation of the two candidate lines, in minutes
  const sep = printed.map(r => e18[r.k].isha - e17[r.k].isha);

  // fixed-interval test: isha = maghrib + N, best N
  const medGap = [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)];

  console.log(`\n=== ${slug} (${lat}, ${lon}) ${printed.length} rows ===`);
  console.log(`  printed isha-maghrib: mean ${mean(gaps).toFixed(1)} sd ${sd(gaps).toFixed(2)} min ${Math.min(...gaps)} max ${Math.max(...gaps)} spread ${gapSpread}`);
  console.log(`  isha 17: exact ${at['17.00'].exact} within1 ${at['17.00'].within1} mean ${at['17.00'].mean.toFixed(2)} worst ${at['17.00'].worst}`);
  console.log(`  isha 18: exact ${at['18.00'].exact} within1 ${at['18.00'].within1} mean ${at['18.00'].mean.toFixed(2)} worst ${at['18.00'].worst}`);
  console.log(`  best angle ${bestA.a}: exact ${bestA.exact} within1 ${bestA.within1} mean ${bestA.mean.toFixed(2)} worst ${bestA.worst}`);
  console.log(`  18-minus-17 separation: mean ${mean(sep).toFixed(2)} min ${Math.min(...sep)} max ${Math.max(...sep)}`);
  console.log(`  fixed interval maghrib+${medGap}: exact ${gaps.filter(g => g === medGap).length} within1 ${gaps.filter(g => Math.abs(g - medGap) <= 1).length}`);
  report.push({ slug, lat, lon, rows: printed.length, gapMean: +mean(gaps).toFixed(1), gapSd: +sd(gaps).toFixed(2), gapSpread, a17: at['17.00'], a18: at['18.00'], best: bestA, sepMean: +mean(sep).toFixed(2), medGap, intervalExact: gaps.filter(g => g === medGap).length, intervalW1: gaps.filter(g => Math.abs(g - medGap) <= 1).length });
}

fs.writeFileSync(`${HOME}/athan-gitree/census/o1l-city/flags2/data/india-isha.json`, JSON.stringify(report, null, 1));
