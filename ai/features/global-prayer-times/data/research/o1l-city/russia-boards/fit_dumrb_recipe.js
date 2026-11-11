// DUM RB per-city scoring at the record's recipe.
//
// A free angle search on a winter-only set is degenerate: at 55 N the fajr time
// moves almost linearly with the angle, so an 18.5 deg curve with a +17 min
// margin reproduces a 16 deg curve with no margin to the same hundredth. The
// angle is therefore held at the record's 16/15 and the level read as the margin.
const fs = require('fs');
const path = require('path');
const G = require('./fitgeneric');

const TZ = 'Asia/Yekaterinburg';
const WINTER = ['12', '01', '02'];
const SUB_FAJR = { 2026: 90, 2025: 120 };

function bandDays(rows, pos, subFajr) {
  const band = new Set();
  for (const [iso, r] of Object.entries(rows)) {
    const t = G.model(pos.lat, pos.lon, iso, TZ, 16, 15);
    if (t.sunrise == null || t.maghrib == null) continue;
    if (Math.abs(r.fajr - (t.sunrise - subFajr)) <= 3) band.add(iso);
    if (Math.abs(r.isha - (t.maghrib + 90)) <= 3) band.add(iso);
  }
  return band;
}

const out = {};
for (const year of [2026, 2025]) {
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, `data/dumrb_${year}.json`), 'utf8'));
  out[year] = {};
  for (const [name, c] of Object.entries(d.cities)) {
    const pos = { lat: c.lat, lon: c.lon };
    const band = bandDays(c.rows, pos, SUB_FAJR[year]);
    const clean = Object.fromEntries(Object.entries(c.rows).filter(([iso]) => !band.has(iso)));
    const winter = Object.fromEntries(Object.entries(clean).filter(([iso]) => WINTER.includes(iso.slice(5, 7))));
    const noon = Object.fromEntries(Object.entries(c.rows).map(([k, v]) => [k, { ...v, dhuhr: v.zaual }]));
    const sunriseOff = Object.values(c.rows)
      .filter((r) => r.sunrise != null).length;
    const cols = G.analyse(winter, pos, TZ, { fajr: 16, isha: 15 }, null, true);
    const full = G.analyse(clean, pos, TZ, { fajr: 16, isha: 15 }, null, true);
    const sun = G.analyse(noon, pos, TZ, { fajr: 16, isha: 15 }, null, true);
    out[year][name] = {
      days: Object.keys(c.rows).length, band: band.size, winterDays: Object.keys(winter).length,
      cols, full, noon: sun.cols ? { sunrise: sun.sunrise, dhuhr: sun.dhuhr } : undefined,
      sunriseRows: sunriseOff,
    };
  }
}
fs.writeFileSync(path.join(__dirname, 'data/dumrb_recipe_fit.json'), JSON.stringify(out, null, 1));

const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
const p10 = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length * 0.1)];
for (const year of [2026, 2025]) {
  const rs = Object.entries(out[year]).filter(([, r]) => r.winterDays >= 40);
  console.log(`\n=== ${year}: ${rs.length} cities with a winter half at 16/15`);
  for (const c of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    const off = rs.map(([, r]) => r.cols[c].offset).filter((x) => x != null);
    const w1 = rs.map(([, r]) => r.cols[c].w1).filter((x) => x != null);
    console.log(`  ${c.padEnd(8)} margin median ${med(off).toFixed(2)} | within-1 P10 ${p10(w1)} median ${med(w1)} min ${Math.min(...w1)}`);
  }
  const bad = rs.filter(([, r]) => r.cols.fajr.w1 < 90 || r.cols.isha.w1 < 90)
    .map(([n, r]) => `${n}(f${r.cols.fajr.w1}/i${r.cols.isha.w1})`);
  console.log(`  below 90% within-1: ${bad.length ? bad.join(', ') : 'none'}`);
}
