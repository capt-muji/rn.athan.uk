/* Score the FCNA/ISNA statement pair (13 deg fajr, 13 deg isha) against every surface,
   with no free margin beyond the single best integer offset per column. This is the test
   the record needs: does the council's stated 13/13 appear in any mosque's practice? */
const fs = require('fs');
const path = require('path');
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');

const DATA = path.join(__dirname, 'data');
const fits = JSON.parse(fs.readFileSync(path.join(DATA, 'fits.json'), 'utf8'));

function tzOffsetMin(tz, y, m, d) {
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const parts = Object.fromEntries(dtf.formatToParts(new Date(Date.UTC(y, m - 1, d, 12))).map((p) => [p.type, p.value]));
  return Math.round((Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute) - Date.UTC(y, m - 1, d, 12)) / 60000);
}
const toMin = (v) => { const [h, m] = v.split(':').map(Number); return h * 60 + m; };
const pubMin = (row, p) => {
  const v = toMin(row[p]);
  if (p === 'isha' && v < toMin(row.maghrib)) return v + 1440;
  if (p === 'fajr' && v > toMin(row.sunrise)) return v - 1440;
  return v;
};
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

const out = [];
for (const f of fits) {
  const file = f.file;
  const rows = JSON.parse(fs.readFileSync(path.join(DATA, file)));
  const p = new adhan.CalculationParameters('Other', 13, 13);
  p.madhab = adhan.Madhab.Shafi;
  p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  p.rounding = adhan.Rounding.None;
  const res = { prov: f.prov, city: f.city, label: f.label, file };
  for (const prayer of ['fajr', 'isha']) {
    const devs = Object.keys(rows).filter((iso) => rows[iso][prayer]).map((iso) => {
      const [y, m, d] = iso.split('-').map(Number);
      const pt = new adhan.PrayerTimes(new adhan.Coordinates(f.coords[0], f.coords[1]), new Date(Date.UTC(y, m - 1, d, 12)), p);
      const dt = prayer === 'fajr' ? pt.fajr : pt.isha;
      const off = tzOffsetMin(f.tz, y, m, d);
      let local = dt.getUTCHours() * 60 + dt.getUTCMinutes() + off;
      if (local < 0) local += 1440;
      if (local >= 1440) local -= 1440;
      const mg = toMin(rows[iso].maghrib);
      if (prayer === 'isha' && local < mg) local += 1440;
      if (prayer === 'fajr' && local > toMin(rows[iso].sunrise)) local -= 1440;
      return pubMin(rows[iso], prayer) - local;
    });
    const k = Math.round(median(devs));
    const abs = devs.reduce((a, v) => a + Math.abs(v - k), 0) / devs.length;
    const w1 = devs.filter((v) => Math.abs(Math.round(v - k)) <= 1).length;
    res[prayer] = { margin: k, meanAbs: +abs.toFixed(1), w1Pct: +(100 * w1 / devs.length).toFixed(1) };
  }
  out.push(res);
}
fs.writeFileSync(path.join(DATA, 'fcna-13-13.json'), JSON.stringify(out, null, 1));
for (const r of out) {
  console.log(`${r.prov} ${r.city.padEnd(13)} ${r.label.padEnd(30)} fajr mae ${String(r.fajr.meanAbs).padStart(5)} w1 ${String(r.fajr.w1Pct).padStart(5)}% | isha mae ${String(r.isha.meanAbs).padStart(5)} w1 ${String(r.isha.w1Pct).padStart(5)}%`);
}
