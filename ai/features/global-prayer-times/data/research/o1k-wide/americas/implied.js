// Per-day implied twilight angle by linear interpolation between the 15 and 18 degree times.
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/Adhan.js');
const fs = require('fs');
const [domain, lat, lon, tz] = process.argv.slice(2);
const rows = JSON.parse(fs.readFileSync(`captures/dpt_${domain}.json`))[0];
const coords = new adhan.Coordinates(+lat, +lon);
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const p15 = new adhan.CalculationParameters('Other', 15, 15);
const p18 = new adhan.CalculationParameters('Other', 18, 18);
for (const p of [p15, p18]) p.madhab = adhan.Madhab.Shafi;
const byMonth = {};
for (const r of rows) {
  const [Y, M, D] = r.d_date.split('-').map(Number);
  const d = new Date(Y, M - 1, D);
  const a = new adhan.PrayerTimes(coords, d, p15), b = new adhan.PrayerTimes(coords, d, p18);
  const out = {};
  for (const k of ['fajr', 'isha']) {
    const t15 = toMin(fmt.format(a[k])), t18 = toMin(fmt.format(b[k]));
    const printed = toMin((k === 'fajr' ? r.fajr_begins : r.isha_begins).slice(0, 5));
    const span = t18 - t15;
    out[k] = Math.abs(span) < 1 ? null : +(15 + 3 * (printed - t15) / span).toFixed(1);
  }
  const b2 = byMonth[M] = byMonth[M] || {fajr: [], isha: []};
  if (out.fajr !== null && out.fajr > 2 && out.fajr < 30) b2.fajr.push(out.fajr);
  if (out.isha !== null && out.isha > 2 && out.isha < 30) b2.isha.push(out.isha);
}
const med = a => a.length ? a.sort((x, y) => x - y)[Math.floor(a.length / 2)] : null;
console.log(domain, tz);
const line = [];
for (const m of Object.keys(byMonth).map(Number).sort((x, y) => x - y)) {
  line.push(`${String(m).padStart(2, '0')}: f ${String(med(byMonth[m].fajr)).padStart(5)} i ${String(med(byMonth[m].isha)).padStart(5)}`);
}
console.log('  ' + line.join(' | '));
