const { Coordinates, CalculationParameters, PrayerTimes, Madhab, Rounding } = require(`${process.env.HOME}/athan-gitree/census/adhan-build/node_modules/adhan`);
const fs = require('fs');

const raw = JSON.parse(fs.readFileSync(`${__dirname}/../data/raw-multan-parsed.json`, 'utf8'));
const YEAR = 2026;
const coords = new Coordinates(30.1978, 71.4697);

function params(fajr, isha, madhab) {
  const p = new CalculationParameters('x');
  p.fajrAngle = fajr;
  p.ishaAngle = isha;
  p.madhab = madhab;
  p.rounding = Rounding.None;
  p.methodAdjustments = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
  return p;
}

function local(dateObj) {
  return Number(dateObj.toLocaleString('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).split(':').reduce((a, v, i) => a + Number(v) * (i === 0 ? 60 : i === 1 ? 1 : 1 / 60), 0));
}

function norm(v, col) {
  // chart prints 12h without meridiem; afternoon columns need +12h
  if (['asr', 'maghrib', 'isha', 'zuhr', 'zawal'].includes(col) && v < 12 * 60) return v + 720;
  return v;
}

const chart = [];
for (let mon = 1; mon <= 12; mon++) {
  const entry = raw[mon - 1];
  for (const [day, vals] of entry[1]) {
    const [isha, maghrib, asr, zuhr, zawal, sunrise, fajr] = vals.map((s) => {
      const [h, m, sec] = s.split(':').map(Number);
      return h * 60 + m + sec / 60;
    });
    chart.push({ y: YEAR, m: mon, d: day, fajr: norm(fajr, 'fajr'), sunrise: norm(sunrise, 'sunrise'), zuhr: norm(zuhr, 'zuhr'), asr: norm(asr, 'asr'), maghrib: norm(maghrib, 'maghrib'), isha: norm(isha, 'isha'), zawal: norm(zawal, 'zawal') });
  }
}

const P = params(18, 18, Madhab.Hanafi);
const cols = ['fajr', 'sunrise', 'zuhr', 'asr', 'maghrib', 'isha'];
const acc = Object.fromEntries(cols.map((c) => [c, []]));
for (const row of chart) {
  const pt = new PrayerTimes(coords, new Date(Date.UTC(row.y, row.m - 1, row.d, 12)), P);
  for (const c of cols) {
    acc[c].push(row[c] - local(pt[c === 'zuhr' ? 'dhuhr' : c]));
  }
}

function robust(a) {
  const ok = a.filter((v) => Math.abs(v) < 15);
  return { kept: ok.length, dropped: a.length - ok.length, ...stat(ok) };
}
function stat(a) {
  const s = [...a].sort((x, y) => x - y);
  const mean = a.reduce((x, y) => x + y, 0) / a.length;
  const med = s[Math.floor(s.length / 2)];
  return { n: a.length, mean: +mean.toFixed(1), median: +med.toFixed(1), min: +s[0].toFixed(1), max: +s[s.length - 1].toFixed(1), within1: a.filter((v) => Math.abs(v) <= 1).length };
}

console.log(`rows ${chart.length}, year ${YEAR}, Karachi 18/18 Hanafi, adhan 4.4.6 Rounding.None`);
for (const c of cols) console.log(c.padEnd(8), JSON.stringify(robust(acc[c])));
console.log('--- per-quarter medians (robust) ---');
for (const c of cols) {
  const q = [0, 1, 2, 3].map((i) => {
    const seg = acc[c].filter((v, idx) => Math.floor(idx / 91.5) === i && Math.abs(v) < 15);
    seg.sort((x, y) => x - y);
    return seg[Math.floor(seg.length / 2)]?.toFixed(1);
  });
  console.log(c.padEnd(8), q.join(' | '));
}

// seasonal amplitude of the chart itself
const f = chart.map((r) => r.fajr);
const fm = chart.filter((r) => r.m === 1).map((r) => r.fajr);
const fj = chart.filter((r) => r.m === 7).map((r) => r.fajr);
console.log('fajr Jan mean', (fm.reduce((a, b) => a + b, 0) / fm.length / 60).toFixed(2), 'Jul mean', (fj.reduce((a, b) => a + b, 0) / fj.length / 60).toFixed(2));

// federal-recipe probe: maghrib = sunset+5, isha = 18deg ladder, zuhr = 13:00/13:15 clock
const mg = chart.map((r) => r.maghrib - local(new PrayerTimes(coords, new Date(Date.UTC(YEAR, r.m - 1, r.d, 12)), params(18, 18, Madhab.Hanafi)).maghrib));
const clockHits = chart.filter((r) => Math.abs(r.zuhr - (r.m >= 4 && r.m <= 9 ? 795 : 780)) <= 1).length;
console.log('maghrib vs sunset (adhan)', JSON.stringify(stat(mg)));
console.log('zuhr matching 13:00/13:15 clock', clockHits, '/', chart.length);
