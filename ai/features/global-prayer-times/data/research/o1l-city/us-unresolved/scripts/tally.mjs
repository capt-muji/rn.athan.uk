// Tally the fit outputs: per-surface verdict, rows, years, 15/15 family call.
import { readdirSync, readFileSync } from 'node:fs';

const files = readdirSync('out').filter((f) => f.endsWith('.json'));
const rows = [];
for (const f of files) {
  const d = JSON.parse(readFileSync(`out/${f}`, 'utf8'));
  for (const [y, v] of Object.entries(d.years)) {
    if (!v.parsed) continue;
    const fajr = v.fajrAngle?.angle ?? null;
    const isha = v.ishaAngleVsSunset?.angle ?? null;
    const ishaKind = v.ishaAngleVsSunset?.kind ?? null;
    const fWorst = v.isna.fajr?.worst ?? null;
    const iWorst = v.isna.isha?.worst ?? null;
    const near = (a, t) => a !== null && Math.abs(a - t) <= 0.3;
    let family = 'other';
    if (near(fajr, 15) && (near(isha, 15) || (ishaKind === 'interval' && iWorst !== null && Math.abs(iWorst) <= 2))) family = '15/15';
    else if (near(fajr, 15)) family = '15-family';
    else if (fajr !== null && fajr >= 17) family = '18-family';
    rows.push({
      id: d.id.replace(/^--rows=data\/rows_/, '').replace(/\.json$/, ''),
      year: y, parsed: v.parsed, geo: `${v.geo.lat},${v.geo.lon}`, rms: v.geo.resid,
      fajr, isha, ishaKind, asr: v.asr?.school,
      fajrWorst: fWorst, ishaWorst: iWorst,
      isnaFajrExact: v.isna.fajr?.exactPct ?? null, isnaIshaExact: v.isna.isha?.exactPct ?? null,
      family,
    });
  }
}
rows.sort((a, b) => a.id.localeCompare(b.id) || a.year.localeCompare(b.year));
const head = ['surface', 'year', 'rows', 'geo', 'solarRms', 'fajrDeg', 'ishaDeg', 'ishaKind', 'asr', 'isnaFajrExact%', 'fajrWorst', 'isnaIshaExact%', 'ishaWorst', 'family'];
console.log(head.join('\t'));
for (const r of rows) console.log([r.id, r.year, r.parsed, r.geo, r.rms, r.fajr, r.isha, r.ishaKind, r.asr, r.isnaFajrExact, r.fajrWorst, r.isnaIshaExact, r.ishaWorst, r.family].join('\t'));
const byFamily = {};
for (const r of rows) byFamily[r.family] = (byFamily[r.family] || 0) + 1;
console.error('MOSQUE-YEARS BY FAMILY', JSON.stringify(byFamily));
console.error('TOTAL ROWS', rows.reduce((s, r) => s + r.parsed, 0));
