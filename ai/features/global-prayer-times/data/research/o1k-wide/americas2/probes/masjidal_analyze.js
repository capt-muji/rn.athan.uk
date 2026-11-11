// Masjidal row analysis: per-month mean offset of the solar columns against an adhan calculation,
// and an angle fit once a month's offset is removed.
// node masjidal_analyze.js <jsonfile> <lat> <lon> <tz>
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/Adhan.js');
const fs = require('fs');
const [file, lat, lon, tz] = process.argv.slice(2);
const rows = JSON.parse(fs.readFileSync(file)).data.salah;
const coords = new adhan.Coordinates(+lat, +lon);
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
const toMin = s => {
  const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(s);
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return h * 60 + Number(m[2]);
};
const parseDate = s => new Date(s.replace(/^[A-Za-z]+,\s*/, ''));
const toMin24 = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const by = {};
const offsets = {};
for (const r of rows) {
  const dt = parseDate(r.date);
  const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
  const p = new adhan.CalculationParameters('Other', 15, 15);
  const t = new adhan.PrayerTimes(coords, new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()), p);
  const row = {
    fajr: toMin(r.fajr), sunrise: toMin(r.sunrise), dhuhr: toMin(r.zuhr),
    asr: toMin(r.asr), maghrib: toMin(r.maghrib), isha: toMin(r.isha),
  };
  const calc = {
    fajr: toMin24(fmt.format(t.fajr)), sunrise: toMin24(fmt.format(t.sunrise)), dhuhr: toMin24(fmt.format(t.dhuhr)),
    asr: toMin24(fmt.format(t.asr)), maghrib: toMin24(fmt.format(t.maghrib)), isha: toMin24(fmt.format(t.isha)),
  };
  by[key] = by[key] || { n: 0, fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
  const b = by[key]; b.n++;
  for (const k of Object.keys(row)) b[k] += row[k] - calc[k];
  offsets[dt.toISOString().slice(0, 10)] = row.sunrise - calc.sunrise;
}
const months = {};
for (const [k, b] of Object.entries(by)) {
  months[k] = {};
  for (const c of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) months[k][c] = +(b[c] / b.n).toFixed(1);
}
// shift runs on sunrise offset
const days = Object.keys(offsets).sort();
const runs = [];
for (const d of days) {
  const o = offsets[d];
  const bucket = Math.round(o / 30) * 30;
  const last = runs[runs.length - 1];
  if (last && last.bucket === bucket) last.to = d;
  else runs.push({ from: d, to: d, bucket });
}
console.log(JSON.stringify({ file, days: days.length, months, runs: runs.filter(r => r.bucket !== 0) }, null, 1));
