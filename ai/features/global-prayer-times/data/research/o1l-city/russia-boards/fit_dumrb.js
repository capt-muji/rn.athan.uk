// DUM RB (Bashkortostan): per-city fit across 2025 and 2026.
//
// Two publisher defects shape the fit and are measured rather than assumed:
//  - the twilight columns carry a fixed-offset summer substitute (fajr = true
//    sunrise - 90, isha = true sunset + 90) and the fajr band runs wider than
//    16 deg reachability;
//  - the printed sunrise column runs early in late summer and autumn while
//    maghrib, fajr and isha stay on the astronomy. The band is therefore
//    classified against the model sunrise, never the printed one.
const fs = require('fs');
const path = require('path');
const G = require('./fitgeneric');

const TZ = 'Asia/Yekaterinburg';
const load = (y) => JSON.parse(fs.readFileSync(path.join(__dirname, `data/dumrb_${y}.json`), 'utf8'));

function classify(rows, pos, fajrAngle, ishaAngle, subFajr) {
  const band = new Set();
  let sunriseEarly = 0;
  for (const iso of Object.keys(rows)) {
    const r = rows[iso];
    const t = G.model(pos.lat, pos.lon, iso, TZ, fajrAngle, ishaAngle);
    if (t.fajr == null || t.sunrise == null || t.maghrib == null) continue;
    if (Math.abs(r.fajr - (t.sunrise - subFajr)) <= 3) band.add(iso);
    if (Math.abs(r.isha - (t.maghrib + 90)) <= 3) band.add(iso);
    if (Math.abs(r.sunrise - t.sunrise) > 4) sunriseEarly += 1;
  }
  return { band, sunriseEarly };
}

function fitCity(c, rows) {
  const pos = { lat: c.lat, lon: c.lon };
  const subFajr = 90; // 2026; the 2025 pass re-tests with 120
  let angles = { fajr: 16, isha: 15 };
  let cls;
  for (let pass = 0; pass < 2; pass += 1) {
    cls = classify(rows, pos, angles.fajr, angles.isha, subFajr);
    const clean = Object.fromEntries(Object.entries(rows).filter(([iso]) => !cls.band.has(iso)));
    if (Object.keys(clean).length < 40) break;
    const f = G.fitAngle(clean, pos, TZ, 'fajr', 12, 18.6, 0.1, { isha: angles.isha });
    const i = G.fitAngle(clean, pos, TZ, 'isha', 11, 18.6, 0.1, { fajr: f.angle || angles.fajr });
    angles = { fajr: f.angle || angles.fajr, isha: i.angle || angles.isha };
  }
  const cols = G.analyse(rows, pos, TZ, angles, cls.band, true);
  return { days: Object.keys(rows).length, band: cls.band.size, sunriseEarly: cls.sunriseEarly, angles, cols };
}

const [lo, hi, tag] = [Number(process.argv[2] || 0), Number(process.argv[3] || 999), process.argv[4] || 'all'];
const out = {};
for (const year of [2026, 2025]) {
  const d = load(year);
  out[year] = {};
  const names = Object.keys(d.cities).sort().slice(lo, hi);
  for (const name of names) {
    const c = d.cities[name];
    out[year][name] = { lat: c.lat, lon: c.lon, months: c.months.length, ...fitCity(c, c.rows) };
    console.log(year, name, 'done');
  }
}
fs.writeFileSync(path.join(__dirname, `data/dumrb_fit_${tag}.json`), JSON.stringify(out, null, 1));
if (tag !== 'all') process.exit(0);

for (const year of [2026, 2025]) {
  const rs = Object.values(out[year]);
  const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
  console.log(`\n=== ${year}: ${rs.length} cities, median band days ${med(rs.map((r) => r.band))}, `
    + `median fajr angle ${med(rs.map((r) => r.angles.fajr))}, median isha angle ${med(rs.map((r) => r.angles.isha))}`);
  console.log('city                              rows band  fa    ia   fajr  sun noon  asr magh isha  sunEarly');
  for (const n of Object.keys(out[year]).sort()) {
    const r = out[year][n];
    const c = r.cols;
    const p = (k) => (c[k].n ? String(c[k].w1).padStart(5) : '    -');
    console.log(n.slice(0, 33).padEnd(33), String(r.days).padStart(4), String(r.band).padStart(4),
      String(r.angles.fajr).padStart(4), String(r.angles.isha).padStart(4),
      p('fajr'), p('sunrise'), p('dhuhr'), p('asr'), p('maghrib'), p('isha'), String(r.sunriseEarly).padStart(6));
  }
}
