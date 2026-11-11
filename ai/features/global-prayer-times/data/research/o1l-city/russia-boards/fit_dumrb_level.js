// DUM RB: identify the twilight angle by level, then score at it.
//
// On a winter half the angle and the constant margin are not separable by shape,
// so the angle is the one whose median residual is zero (the publisher carries no
// margin: 2026 fajr reads 0.4 min at 16 deg). Search 10-19 deg at 0.05, then
// score the winter half at the identified pair.
const fs = require('fs');
const path = require('path');
const G = require('./fitgeneric');

const TZ = 'Asia/Yekaterinburg';
const WINTER = ['12', '01', '02'];
const SUB = { 2026: 90, 2025: 120 };

function medianOf(a) {
  const s = [...a].sort((x, y) => x - y);
  return s.length ? s[Math.floor(s.length / 2)] : null;
}

function zeroAngle(rows, pos, which, other, sub) {
  let best = null;
  for (let a = 10; a <= 19.0001; a += 0.05) {
    const ds = [];
    for (const [iso, r] of Object.entries(rows)) {
      if (!WINTER.includes(iso.slice(5, 7))) continue;
      const t = G.model(pos.lat, pos.lon, iso, TZ,
        which === 'fajr' ? a : other.fajr, which === 'isha' ? a : other.isha);
      if (t[which] == null || r[which] == null) continue;
      const d = r[which] - t[which];
      if (Math.abs(d) > 120) continue;
      ds.push(d);
    }
    if (ds.length < 40) continue;
    const m = medianOf(ds);
    if (best === null || Math.abs(m) < Math.abs(best.margin)) best = { angle: +a.toFixed(2), margin: +m.toFixed(2) };
  }
  return best;
}

const out = {};
for (const year of [2026, 2025]) {
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, `data/dumrb_${year}.json`), 'utf8'));
  out[year] = {};
  for (const [name, c] of Object.entries(d.cities)) {
    const pos = { lat: c.lat, lon: c.lon };
    const winter = Object.fromEntries(Object.entries(c.rows).filter(([iso]) => WINTER.includes(iso.slice(5, 7))));
    if (Object.keys(winter).length < 40) { out[year][name] = { note: 'no winter half' }; continue; }
    const band = new Set();
    for (const [iso, r] of Object.entries(winter)) {
      const t = G.model(pos.lat, pos.lon, iso, TZ, 16, 15);
      if (t.sunrise != null && Math.abs(r.fajr - (t.sunrise - SUB[year])) <= 3) band.add(iso);
      if (t.maghrib != null && Math.abs(r.isha - (t.maghrib + 90)) <= 3) band.add(iso);
    }
    const clean = Object.fromEntries(Object.entries(winter).filter(([iso]) => !band.has(iso)));
    const f = zeroAngle(clean, pos, 'fajr', { isha: 15 }, SUB[year]);
    const i = zeroAngle(clean, pos, 'isha', { fajr: f.angle }, SUB[year]);
    const cols = G.analyse(clean, pos, TZ, { fajr: f.angle, isha: i.angle }, null, true);
    out[year][name] = { days: Object.keys(c.rows).length, winterDays: Object.keys(clean).length,
      band: band.size, fajr: f, isha: i, cols };
  }
}
fs.writeFileSync(path.join(__dirname, 'data/dumrb_level_fit.json'), JSON.stringify(out, null, 1));

const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
const p10 = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length * 0.1)];
for (const year of [2026, 2025]) {
  const rs = Object.entries(out[year]).filter(([, r]) => r.fajr);
  const fa = rs.map(([, r]) => r.fajr.angle);
  const ia = rs.map(([, r]) => r.isha.angle);
  console.log(`\n=== ${year}: ${rs.length} cities, winter half`);
  console.log(`  fajr angle median ${med(fa)} p10 ${p10(fa)} range ${Math.min(...fa)}-${Math.max(...fa)}`);
  console.log(`  isha angle median ${med(ia)} p10 ${p10(ia)} range ${Math.min(...ia)}-${Math.max(...ia)}`);
  for (const c of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    const w1 = rs.map(([, r]) => r.cols[c].w1).filter((x) => x != null);
    const mae = rs.map(([, r]) => r.cols[c].mae).filter((x) => x != null);
    console.log(`  ${c.padEnd(8)} within-1 P10 ${p10(w1)} median ${med(w1)} min ${Math.min(...w1)} | MAE median ${med(mae)}`);
  }
  const odd = rs.filter(([, r]) => Math.abs(r.fajr.angle - med(fa)) > 1 || Math.abs(r.isha.angle - med(ia)) > 1)
    .map(([n, r]) => `${n} ${r.fajr.angle}/${r.isha.angle}`);
  console.log(`  angles off the median by >1 deg: ${odd.length ? odd.join(', ') : 'none'}`);
}
