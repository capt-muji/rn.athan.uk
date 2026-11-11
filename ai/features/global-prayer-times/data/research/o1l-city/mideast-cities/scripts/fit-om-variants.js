// Comparator: the brief's 17.8/18.15 pair against the record's 18/18, both with the
// +5 ceil margins, across the six Oman second cities.
// Run: TZ=Asia/Muscat node scripts/fit-om-variants.js
const fs = require('fs');
const path = require('path');
const C = process.env.HOME + '/athan-gitree/census';
const L = require(C + '/o1k-wide/deep2/scripts/lib');

const ROOT = path.join(__dirname, '..');
const CITIES = [
  ['salalah', 17.0151, 54.0924], ['sohar', 24.3419, 56.7298], ['nizwa', 22.9333, 57.5333],
  ['sur', 22.5667, 59.5289], ['ibri', 23.2254, 56.5155], ['buraimi', 24.2500, 55.7833],
];
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const tmin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const VARIANTS = [
  { label: '18/18 round+5', fajr: 18, isha: 18, mode: 'round' },
  { label: '17.8/18.15 round+5', fajr: 17.8, isha: 18.15, mode: 'round' },
  { label: '18/18 ceil+5', fajr: 18, isha: 18, mode: 'ceil' },
  { label: '17.8/18.15 ceil+5', fajr: 17.8, isha: 18.15, mode: 'ceil' },
];

const out = {};
for (const [name, lat, lon] of CITIES) {
  const rows = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', `om-${name}.json`), 'utf8'));
  const days = Object.keys(rows).sort();
  const c = L.coords(lat, lon);
  out[name] = {};
  for (const v of VARIANTS) {
    let all = [];
    const per = {};
    for (const k of COLS) per[k] = [];
    for (const d of days) {
      const t = L.times(c, { fajrAngle: v.fajr, ishaAngle: v.isha, madhab: 'shafi' }, d);
      const model = {
        fajr: L.roundMin(t.fajr, 0, v.mode), sunrise: L.roundMin(t.sunrise, 0, v.mode),
        dhuhr: L.roundMin(t.dhuhr, 5, v.mode), asr: L.roundMin(t.asr, 5, v.mode),
        maghrib: L.roundMin(t.maghrib, 5, v.mode), isha: L.roundMin(t.isha, 0, v.mode),
      };
      for (const k of COLS) { per[k].push([tmin(rows[d][k]), model[k]]); all = all.concat([[tmin(rows[d][k]), model[k]]]); }
    }
    const s = L.score(all);
    out[name][v.label] = {
      exactPct: +(100 * s.exact / s.n).toFixed(1), w1Pct: +(100 * s.w1 / s.n).toFixed(1),
      mae: +s.mae.toFixed(3), max: s.maxAbs,
      perColumnW1: Object.fromEntries(COLS.map((k) => { const x = L.score(per[k]); return [k, +(100 * x.w1 / x.n).toFixed(1)]; })),
    };
    console.log(`${name.padEnd(8)} ${v.label.padEnd(20)} ${out[name][v.label].exactPct}/${out[name][v.label].w1Pct} mae ${out[name][v.label].mae} max ${out[name][v.label].max}`);
  }
}
fs.writeFileSync(path.join(ROOT, 'data', 'om-variant-comparison.json'), JSON.stringify(out, null, 1));
