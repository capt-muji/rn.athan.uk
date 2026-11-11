// DUM RB winter-half fit: the summer substitute is structurally unfittable, so the
// recipe is fitted on December-February and scored there, per city and year, and the
// fixed jama'ah dhuhr column is reported separately from the solar noon (zaual).
const fs = require('fs');
const path = require('path');
const G = require('./fitgeneric');

const TZ = 'Asia/Yekaterinburg';
const load = (y) => JSON.parse(fs.readFileSync(path.join(__dirname, `data/dumrb_${y}.json`), 'utf8'));
const WINTER = ['12', '01', '02'];

const out = {};
for (const year of [2026, 2025]) {
  const d = load(year);
  out[year] = {};
  for (const [name, c] of Object.entries(d.cities)) {
    const rows = c.rows;
    const winter = Object.fromEntries(Object.entries(rows).filter(([iso]) => WINTER.includes(iso.slice(5, 7))));
    if (Object.keys(winter).length < 40) { out[year][name] = { note: 'no winter half', months: c.months.length }; continue; }
    const pos = { lat: c.lat, lon: c.lon };
    const f = G.fitAngle(winter, pos, TZ, 'fajr', 12, 18.6, 0.05, { isha: 15 });
    const i = G.fitAngle(winter, pos, TZ, 'isha', 11, 18.6, 0.05, { fajr: f.angle || 16 });
    const noon = Object.fromEntries(Object.entries(winter).map(([k, v]) => [k,
      { fajr: v.fajr, sunrise: v.sunrise, dhuhr: v.zaual, asr: v.asr, maghrib: v.maghrib, isha: v.isha }]));
    const cols = G.analyse(noon, pos, TZ, { fajr: f.angle || 16, isha: i.angle || 15 }, null, true);
    const dhuhrFixed = [...new Set(Object.values(winter).map((v) => v.dhuhr))].sort((a, b) => a - b);
    const suhur = Object.values(winter).map((v) => (v.suhur != null && v.fajr != null ? v.fajr - v.suhur : null)).filter((x) => x != null);
    out[year][name] = { months: c.months.length, winterDays: Object.keys(winter).length,
      fajrAngle: f.angle, ishaAngle: i.angle, dhuhrFixed, suhurMedian: suhur.length ? suhur.sort((a, b) => a - b)[Math.floor(suhur.length / 2)] : null,
      cols };
  }
}
fs.writeFileSync(path.join(__dirname, 'data/dumrb_winter_fit.json'), JSON.stringify(out, null, 1));

const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
for (const year of [2026, 2025]) {
  const rs = Object.values(out[year]).filter((r) => r.cols);
  console.log(`\n=== ${year}: ${rs.length} cities with a winter half`);
  console.log(`  fajr angle median ${med(rs.map((r) => r.fajrAngle))} range ${Math.min(...rs.map((r) => r.fajrAngle))}-${Math.max(...rs.map((r) => r.fajrAngle))}`);
  console.log(`  isha angle median ${med(rs.map((r) => r.ishaAngle))} range ${Math.min(...rs.map((r) => r.ishaAngle))}-${Math.max(...rs.map((r) => r.ishaAngle))}`);
  console.log(`  suhur offset median ${med(rs.map((r) => r.suhurMedian))} min`);
  for (const c of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    const v = rs.map((r) => r.cols[c].w1).filter((x) => x != null);
    const m = rs.map((r) => r.cols[c].mae).filter((x) => x != null);
    console.log(`  ${c.padEnd(8)} within-1 min P10 ${v.sort((a, b) => a - b)[Math.floor(v.length * 0.1)]} median ${med(v)} | MAE median ${med(m)}`);
  }
  const dh = {};
  for (const r of rs) dh[r.dhuhrFixed.join('+')] = (dh[r.dhuhrFixed.join('+')] || 0) + 1;
  console.log('  fixed dhuhr values', JSON.stringify(dh));
}
