// o1n-22 Ufa sheet anchoring: sheets list consecutive days but the printed day
// column can straddle a month boundary. Re-anchor every sheet by cross-correlating
// its sunrise/maghrib series against the adhan model over the whole year.
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const coords = new adhan.Coordinates(54.7352, 55.9587);
function zoneClock(dateUTC) {
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Yekaterinburg', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const p = {};
  for (const x of dtf.formatToParts(dateUTC)) p[x.type] = x.value;
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute);
  const off = (asUTC - dateUTC.getTime()) / 60000;
  const s = new Date(dateUTC.getTime() + off * 60000);
  return s.getUTCHours() * 60 + s.getUTCMinutes();
}
// model solar times for every day of 2026 (precomputed once)
function solar(y, mo, d) {
  const p = adhan.CalculationMethod.Other();
  p.coordinates = coords; p.fajrAngle = 16; p.ishaAngle = 15;
  p.madhab = adhan.Madhab.Hanafi;
  p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  const t = new adhan.PrayerTimes(coords, new Date(Date.UTC(y, mo - 1, d, 12)), p);
  return { sr: zoneClock(t.sunrise), mg: zoneClock(t.maghrib) };
}
const SOLAR = [];
for (let doy = 0; doy < 366; doy++) {
  const dt = new Date(Date.UTC(2026, 0, 1) + doy * 86400000);
  SOLAR.push(solar(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()));
}
function pm(s) { const [h, m] = s.split(':').map(Number); return h * 60 + m; }

// per sheet: parse cells + day column in order
function parseSheet(f) {
  const LTTextContainer = require(path.join(process.env.HOME, 'athan-gitree/census/adhan-build/node_modules/pdfminer-noop'), {});
  return null;
}
// pdfminer via python: dump rows as TSV from a helper (reuse the parse logic in python)
const raw = execSync(`python3 ${__dirname}/ufa_dump_rows.py`, { encoding: 'utf8' });
const sheets = JSON.parse(raw);
const outRows = [];
const log = [];
for (const sheet of sheets) {
  const rows = sheet.rows;
  let best = null;
  for (let a = 0; a + rows.length <= 366; a++) {
    let err = 0, n = 0;
    rows.forEach((r, i) => {
      const m = SOLAR[a + i];
      if (r.sunrise) { err += Math.abs(pm(r.sunrise) - m.sr); n++; }
      if (r.maghrib) { err += Math.abs(pm(r.maghrib) - m.mg); n++; }
    });
    const e = err / Math.max(1, n);
    if (!best || e < best.e) best = { a, e, n };
  }
  log.push(`${sheet.file}: n=${rows.length} anchor=${best.a} (doy) err=${best.e.toFixed(2)}`);
  rows.forEach((r, i) => {
    const dt = new Date(Date.UTC(2026, 0, 1) + (best.a + i) * 86400000);
    const date = dt.toISOString().slice(0, 10);
    outRows.push({ ...r, date });
  });
}
outRows.sort((a, b) => a.date.localeCompare(b.date) || Object.keys(a).length - Object.keys(b).length);
const seen = new Map();
for (const r of outRows) if (!seen.has(r.date)) seen.set(r.date, r);
const final = [...seen.values()];
console.log(log.join('\n'));
console.log('rows:', final.length);
fs.writeFileSync(__dirname + '/dumrb_ufa_2026.json', JSON.stringify({
  source: 'api.dumrb.com PrayerSchedule/generate cityId=1 (Ufa), DUM RB own schedule service, PDF text layer; sheet rows re-anchored by sunrise/maghrib cross-correlation (whole-year search)',
  city: 'Ufa', republic: 'Bashkortostan', rows: final }, null, 1));
