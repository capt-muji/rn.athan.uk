// o1n-22 Vladikavkaz 2026 repair: the inherited OCR transcript loses rows inside
// month blocks, so date labels drift. Re-date each month block by cross-correlating
// its sunrise series against the adhan model curve, verify on maghrib.
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
const fs = require('fs');
const doc = JSON.parse(fs.readFileSync(__dirname + '/vladikavkaz_islamosetia_2026.json', 'utf8'));
const coords = new adhan.Coordinates(43.202, 44.635);
function zoneClock(dateUTC) {
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Moscow', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const p = {};
  for (const x of dtf.formatToParts(dateUTC)) p[x.type] = x.value;
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute);
  const off = (asUTC - dateUTC.getTime()) / 60000;
  const s = new Date(dateUTC.getTime() + off * 60000);
  return s.getUTCHours() * 60 + s.getUTCMinutes();
}
function pm(s) { if (s == null) return null; const [h, m] = String(s).split(':').map(Number); if (Number.isNaN(h) || Number.isNaN(m)) return null; return h * 60 + m; }
function model(y, mo, d) {
  const p = adhan.CalculationMethod.Other();
  p.coordinates = coords; p.fajrAngle = 18; p.ishaAngle = 17;
  p.madhab = adhan.Madhab.Shafi; p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  const t = new adhan.PrayerTimes(coords, new Date(Date.UTC(y, mo - 1, d, 12)), p);
  return { sunrise: zoneClock(t.sunrise), maghrib: zoneClock(t.maghrib) };
}
const out = [];
const log = [];
// group rows into month blocks in file order, but blocks are dated by their label month
const blocks = {};
for (const r of doc.rows) {
  const mo = r.date.slice(0, 7);
  (blocks[mo] = blocks[mo] || []).push(r);
}
for (const [ym, rows] of Object.entries(blocks)) {
  const [y, m] = ym.split('-').map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  // candidate: assign block rows to consecutive days starting at s0
  let best = null;
  for (let s0 = 1; s0 <= Math.max(1, days - rows.length + 1); s0++) {
    let err = 0, n = 0;
    rows.forEach((r, i) => {
      const d = s0 + i;
      if (d > days) return;
      const mt = model(y, m, d);
      const vs = pm(r.sunrise), vg = pm(r.maghrib);
      if (vs != null) { err += Math.abs(vs - mt.sunrise); n++; }
      if (vg != null) { err += Math.abs(vg - mt.maghrib); n++; }
    });
    if (n < 4) continue;
    const e = err / n;
    if (!best || e < best.e) best = { s0, e, n };
  }
  log.push(`${ym}: rows=${rows.length} start=${best ? best.s0 : '?'} meanerr=${best ? best.e.toFixed(1) : '?'}min n=${best ? best.n : 0}`);
  if (!best) continue;
  rows.forEach((r, i) => {
    const d = best.s0 + i;
    if (d > days) return;
    const nd = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    out.push({ ...r, date: nd, origDate: r.date });
  });
}
out.sort((a, b) => a.date.localeCompare(b.date));
console.log(log.join('\n'));
console.log('rows after repair:', out.length);
fs.writeFileSync(__dirname + '/vladikavkaz_islamosetia_2026_repaired.json',
  JSON.stringify({ source: doc.source + ' ; o1n-22 repair: month blocks re-dated by sunrise/maghrib cross-correlation against adhan model (origDate kept)', city: 'Vladikavkaz', republic: 'North Ossetia', rows: out }, null, 1));
