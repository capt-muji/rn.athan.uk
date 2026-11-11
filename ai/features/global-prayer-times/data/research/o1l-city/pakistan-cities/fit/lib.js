const { Coordinates, CalculationParameters, PrayerTimes, Madhab, Rounding } = require(`${process.env.HOME}/athan-gitree/census/adhan-build/node_modules/adhan`);
const fs = require('fs');

const YEAR = 2026;
const cols = ['fajr', 'sunrise', 'zuhr', 'asr', 'maghrib', 'isha'];

function params(fajr, isha, madhab) {
  const p = new CalculationParameters('x');
  p.fajrAngle = fajr;
  p.ishaAngle = isha;
  p.madhab = madhab;
  p.rounding = Rounding.None;
  p.methodAdjustments = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
  return p;
}

function minutes(d) {
  const [h, m, s] = d.toLocaleString('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).split(':').map(Number);
  return h * 60 + m + s / 60;
}

function stat(a) {
  const s = [...a].sort((x, y) => x - y);
  return { n: a.length, median: +s[Math.floor(s.length / 2)].toFixed(1), mean: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1), min: +s[0].toFixed(1), max: +s[s.length - 1].toFixed(1), within1: a.filter((v) => Math.abs(v) <= 1).length };
}

function robust(a) {
  const ok = a.filter((v) => Math.abs(v) < 15);
  return { kept: ok.length, dropped: a.length - ok.length, ...stat(ok) };
}

function run(label, chart, lat, lon) {
  const coords = new Coordinates(lat, lon);
  const P = params(18, 18, Madhab.Hanafi);
  const acc = Object.fromEntries(cols.map((c) => [c, []]));
  for (const row of chart) {
    const pt = new PrayerTimes(coords, new Date(Date.UTC(YEAR, row.m - 1, row.d, 12)), P);
    for (const c of cols) acc[c].push(row[c] - minutes(pt[c === 'zuhr' ? 'dhuhr' : c]));
  }
  console.log(`\n### ${label} — ${chart.length} rows, ${YEAR}, Karachi 18/18 Hanafi, adhan 4.4.6 Rounding.None`);
  for (const c of cols) console.log(c.padEnd(8), JSON.stringify(robust(acc[c])));
  const q = cols.map((c) => {
    const segs = [0, 1, 2, 3].map((i) => {
      const seg = acc[c].filter((v, idx) => Math.floor(idx / (chart.length / 4)) === i && Math.abs(v) < 15).sort((x, y) => x - y);
      return seg.length ? seg[Math.floor(seg.length / 2)].toFixed(1) : "-";
    });
    return `${c}: ${segs.join(" | ")}`;
  });
  console.log("quarter medians  " + q.join("; "));
  const jan = chart.filter((r) => r.m === 1).map((r) => r.fajr);
  const jul = chart.filter((r) => r.m === 7).map((r) => r.fajr);
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  console.log(`seasonal amplitude fajr: Jan ${(avg(jan) / 60).toFixed(2)} Jul ${(avg(jul) / 60).toFixed(2)} span ${(Math.abs(avg(jul) - avg(jan))).toFixed(0)} min`);
  const clock = chart.filter((r) => Math.abs(r.zuhr - (r.m >= 4 && r.m <= 9 ? 795 : 780)) <= 1).length;
  console.log(`federal dhuhr clock hits: ${clock}/${chart.length}`);
  return acc;
}

module.exports = { run, params, minutes, YEAR };
