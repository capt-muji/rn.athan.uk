const fs = require('fs');
const path = require('path');
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const COLS = [1, 2, 3, 4, 5, 6];

function margins(lat) {
  return lat < 48
    ? { fajr: 0, sunrise: -3, dhuhr: 3, asr: 3, maghrib: 3, isha: 0 }
    : { fajr: 0, sunrise: -5, dhuhr: 5, asr: 5, maghrib: 5, isha: 0 };
}
function params(lat) {
  const p = new adhan.CalculationParameters('Other', 15, 15);
  p.madhab = adhan.Madhab.Hanafi;
  p.highLatitudeRule = adhan.HighLatitudeRule.TwilightAngle;
  p.adjustments = margins(lat);
  p.rounding = adhan.Rounding.None;
  return p;
}
function predict(year, month, day, lat, lng, tz) {
  const dayStart = Date.UTC(year, month - 1, day);
  const t = new adhan.PrayerTimes(new adhan.Coordinates(lat, lng), new Date(dayStart), params(lat));
  const out = {};
  for (const k of PRAYERS) {
    const m = (new Date(t[k]).getTime() - dayStart) / 60000 + tz * 60;
    out[k] = Math.round(((m % 1440) + 1440) % 1440);
  }
  return out;
}
const parseObs = (c) => { const [h, m] = c.split(':').map(Number); return h * 60 + m; };

function run(file) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const lat = Number(d.lat), lng = Number(d.lng), tz = Number(d.tz);
  const acc = {};
  for (const k of PRAYERS) acc[k] = { n: 0, exact: 0, w1: 0, abs: 0, bias: 0, worst: 0 };
  const perDay = [];
  for (const row of d.rows) {
    const [dayStr, mon] = row[0].split(' ');
    const day = Number(dayStr), month = MONTHS.indexOf(mon) + 1;
    const year = Number(d.header[0]);
    if (!month) throw new Error('bad month ' + mon);
    const pred = predict(year, month, day, lat, lng, tz);
    const rec = { date: `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`, d: {} };
    for (let i = 0; i < PRAYERS.length; i++) {
      const k = PRAYERS[i];
      const cell = row[COLS[i]];
      if (!cell || !cell.includes(':')) continue;
      const diff = parseObs(cell) - pred[k];
      const s = acc[k];
      s.n++; if (diff === 0) s.exact++; if (Math.abs(diff) <= 1) s.w1++;
      s.abs += Math.abs(diff); s.bias += diff;
      if (Math.abs(diff) > Math.abs(s.worst)) s.worst = diff;
      rec.d[k] = diff;
    }
    perDay.push(rec);
  }
  let te = 0, tn = 0, tw = 0;
  for (const k of PRAYERS) { const s = acc[k]; te += s.exact; tw += s.w1; tn += s.n; }
  return { acc, perDay, year: Number(d.header[0]), lat, lng, n: tn, exactPct: 100*te/tn, w1Pct: 100*tw/tn };
}

function table(label, r) {
  const L = [`### ${label} — lat ${r.lat} (set ${r.lat < 48 ? 'A' : 'B'}) ${r.n/6} days`,
    '| prayer | exact % | within-1 % | MAE | bias | worst |', '|---|---|---|---|---|---|'];
  for (const k of PRAYERS) {
    const s = r.acc[k];
    L.push(`| ${k} | ${(100*s.exact/s.n).toFixed(2)} | ${(100*s.w1/s.n).toFixed(2)} | ${(s.abs/s.n).toFixed(3)} | ${(s.bias/s.n).toFixed(3)} | ${s.worst} |`);
  }
  L.push(`| ALL | ${r.exactPct.toFixed(2)} | ${r.w1Pct.toFixed(2)} | | | |`);
  return L.join('\n');
}

if (require.main === module) {
  const out = [];
  for (const f of process.argv.slice(2)) {
    try { out.push(table(path.basename(f, '.json'), run(f))); }
    catch (e) { out.push(`### ${f} FAILED ${e.message}`); }
  }
  console.log(out.join('\n\n'));
}
module.exports = { run, predict, margins, PRAYERS, table };
