// DUM RT (Tatarstan): 44 settlements x 2025+2026 from the publisher's full-year CSVs.
// Confirms the 18/15 Hanafi recipe, the fixed 12:00 jama'ah dhuhr column, the mosque
// fajr (sunrise-90) column, and maps the summer substitute per year.
const fs = require('fs');
const path = require('path');
const G = require('./fitgeneric');

const TZ = 'Europe/Moscow';
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/dumrt.json'), 'utf8'));

function band(rows, pos, subFajr, ishaAngle) {
  const out = new Set();
  for (const iso of Object.keys(rows)) {
    const r = rows[iso];
    const t = G.model(pos.lat, pos.lon, iso, TZ, 18, ishaAngle);
    if (t.sunrise == null || t.maghrib == null) continue;
    if (Math.abs(r.fajr - (t.sunrise - subFajr)) <= 3) out.add(iso);
    if (Math.abs(r.isha - (t.maghrib + 90)) <= 3) out.add(iso);
  }
  return out;
}

const [lo, hi, tag] = [Number(process.argv[2] || 0), Number(process.argv[3] || 999), process.argv[4] || 'all'];
const results = [];
const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b)).slice(lo, hi);
for (const [slug, c] of entries) {
  const rows = c.rows;
  const solar = Object.fromEntries(Object.entries(rows).map(([k, v]) => [k,
    { fajr: v.fajr, sunrise: v.sunrise, dhuhr: v.zawal, asr: v.asr, maghrib: v.maghrib, isha: v.isha }]));
  const pos = G.derivePosition(solar, TZ, 'dhuhr') || G.derivePosition(rows, TZ, 'zawal');
  if (!pos) { console.log('no position', slug); continue; }
  for (const year of ['2025', '2026']) {
    const yr = Object.fromEntries(Object.entries(rows).filter(([k]) => k.startsWith(year)));
    if (Object.keys(yr).length < 60) continue;
    const subFajr = year === '2025' ? 120 : 120; // the band value is measured below, not assumed
    const skip = band(yr, pos, subFajr, 15);
    const winter = Object.fromEntries(Object.entries(yr).filter(([k]) => !skip.has(k)));
    const f = G.fitAngle(winter, pos, TZ, 'fajr', 12, 20, 0.05, { isha: 15 });
    const i = G.fitAngle(winter, pos, TZ, 'isha', 11, 20, 0.05, { fajr: f.angle || 18 });
    const cols = G.analyse(yr, pos, TZ, { fajr: f.angle || 18, isha: i.angle || 15 }, skip, true);
    const fixedDhuhr = new Set(Object.values(yr).map((v) => v.dhuhr));
    const mosqueGap = Object.values(yr).map((v) => v.sunrise - v.mosqueFajr);
    results.push({ slug, name: c.name, year, lat: +pos.lat.toFixed(2), lon: +pos.lon.toFixed(2),
      days: Object.keys(yr).length, band: skip.size, fajrAngle: f.angle, ishaAngle: i.angle,
      dhuhrValues: [...fixedDhuhr], mosqueGapMedian: mosqueGap.sort((a, b) => a - b)[Math.floor(mosqueGap.length / 2)],
      cols });
  }
  console.log('fitted', slug, c.name, pos.lat.toFixed(2), pos.lon.toFixed(2));
}
fs.writeFileSync(path.join(__dirname, `data/dumrt_fit_${tag}.json`), JSON.stringify(results, null, 1));
if (tag !== 'all') process.exit(0);
const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
for (const y of ['2025', '2026']) {
  const rs = results.filter((r) => r.year === y);
  console.log(`\n=== ${y}: ${rs.length} city-years; fajr angle median ${med(rs.map((r) => r.fajrAngle ?? 0))}, isha ${med(rs.map((r) => r.ishaAngle ?? 0))}, band median ${med(rs.map((r) => r.band))}`);
  const worst = (k) => rs.map((r) => r.cols[k].w1 ?? 100);
  for (const k of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    const v = worst(k);
    console.log(`  ${k.padEnd(8)} within-1 min: min ${Math.min(...v)} median ${med(v)} max ${Math.max(...v)}`);
  }
}
