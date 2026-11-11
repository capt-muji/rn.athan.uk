// Minsk cap/recipe diagnostics: what law generates fajr and isha?
import fs from 'node:fs';
import { load, computeCols, chartOf, score, bestMargin, zoneMin, roundMin } from './lib.mjs';

const adhan = await load();
const H = process.env.HOME + '/athan-gitree/census/o1k-wide/nordics2/data/';
const raw = JSON.parse(fs.readFileSync(H + 'by-islambel-minsk-2025.json'));
const dates = Object.keys(raw).sort();
const rows = dates.map((d) => { const r = raw[d]; return { fajr: r.fajr, sunrise: r.sunrise, dhuhr: r.dhuhr, asr: r.asr, maghrib: r.magrib, isha: r.isha }; });
const coords = { lat: 53.9006, lon: 27.5590 };
const TZ = 'Europe/Minsk';
const chart = chartOf(rows, ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']);
const ser = computeCols(adhan, coords, TZ, dates, {
  fajr: { kind: 'angle', v: 18, after: false }, sunrise: { kind: 'sunrise' }, dhuhr: { kind: 'transit' },
  asr: { kind: 'asr', v: 'shafi' }, maghrib: { kind: 'sunset' }, isha: { kind: 'angle', v: 15.6, after: true },
});

// natural 18-deg fajr around the winter solstice: is the 7:16 plateau natural?
console.log('natural fajr(18) minutes-of-day, Dec 20 .. Jan 10:');
for (let dd = -5; dd <= 10; dd++) {
  const dt = new Date(Date.UTC(2025, 0, dd + 1, 12));
  const ds = dt.toISOString().slice(0, 10);
  void ds;
}
for (const d of ['2024-12-20', '2024-12-22', '2024-12-24', '2024-12-26', '2024-12-28', '2024-12-30', '2025-01-01', '2025-01-03', '2025-01-05', '2025-01-07', '2025-01-10']) {
  const s = computeCols(adhan, coords, TZ, [d], { fajr: { kind: 'angle', v: 18, after: false }, isha: { kind: 'angle', v: 15, after: true }, isha18: { kind: 'angle', v: 18, after: true } });
  const f = (sec) => { if (sec === null) return '---'; const m = Math.round(sec / 60); return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); };
  const printed = raw[d] ? `${raw[d].fajr}/${raw[d].isha}` : '(2024)';
  console.log(' ', d, 'fajr18', f(s.fajr[0]), 'isha15', f(s.isha[0]), 'isha18', f(s.isha18[0]), 'printed', printed);
}

// isha families on uncapped days
const cappedIsha = dates.map((_, i) => chart.isha[i] === 23 * 60 + 6);
const cappedFajr = dates.map((_, i) => chart.fajr[i] === 7 * 60 + 16);
const uncI = dates.map((_, i) => i).filter((i) => !cappedIsha[i]);
const uncF = dates.map((_, i) => i).filter((i) => !cappedFajr[i]);

// interval sweep for isha
const m6 = []; for (let j = -12; j <= 12; j++) m6.push(j / 2);
console.log('\nisha on uncapped days:');
{
  const ivs = []; for (let n = 55; n <= 140; n++) ivs.push(n);
  const res = [];
  for (const n of ivs) {
    const s = computeCols(adhan, coords, TZ, uncI.map((i) => dates[i]), { isha: { kind: 'interval', v: n } });
    res.push({ n, ...bestMargin(s.isha, uncI.map((i) => chart.isha[i]), { margins: m6, modes: ['nearest'] }) });
  }
  res.sort((a, b) => b.exact - a.exact || a.worst - b.worst);
  console.log('  best sunset+interval:', JSON.stringify(res.slice(0, 3).map((r) => ({ n: r.n, exact: r.exact, of: r.n2 ?? res[0].n, worst: r.worst, margin: r.margin, mode: r.mode }))));
  void res;
}
{
  const fr = [];
  for (let k = 120; k <= 360; k++) fr.push(k / 1000);
  const res = [];
  for (const q of fr) {
    const s = computeCols(adhan, coords, TZ, uncI.map((i) => dates[i]), { isha: { kind: 'angle', v: 0, after: true } });
    void s;
    // night fraction: isha = sunset + q*night, computed manually
  }
  // manual night-fraction isha
  const nres = [];
  for (const q of fr) {
    const vals = uncI.map((i) => {
      const nx = new Date(Date.UTC(+dates[i].slice(0, 4), +dates[i].slice(5, 7) - 1, +dates[i].slice(8, 10) + 1, 12));
      const st = new adhan.SolarTime(nx, new adhan.Coordinates(coords.lat, coords.lon));
      const tc = new adhan.TimeComponents(st.sunrise);
      const dt = new Date(Date.UTC(nx.getUTCFullYear(), nx.getUTCMonth(), nx.getUTCDate(), tc.hours, tc.minutes, tc.seconds));
      const srNext = zoneMin(dt, TZ);
      const sunset = ser.maghrib[i] / 60;
      return (sunset + q * ((srNext.min + srNext.sec / 60 - sunset + 1440) % 1440)) * 60;
    });
    const st = { margin: 0, mode: 'nearest' };
    const s = score(vals, uncI.map((i) => chart.isha[i]), st.margin, st.mode);
    nres.push({ q, exact: s.exact, of: s.n, worst: s.worst, mae: +s.mae.toFixed(2) });
  }
  nres.sort((a, b) => b.exact - a.exact || a.worst - b.worst);
  console.log('  best sunset+q*night:', JSON.stringify(nres.slice(0, 4)));
}
// fajr families on uncapped days
console.log('\nfajr on uncapped days:');
{
  const qf = [];
  for (let k = 60; k <= 300; k++) qf.push(k / 1000);
  const nres = [];
  for (const q of qf) {
    const vals = uncF.map((i) => {
      const sunset = ser.maghrib[i] / 60;
      return (chart.sunrise[i] - q * ((chart.sunrise[i] - sunset + 1440) % 1440)) * 60;
    });
    const s = score(vals, uncF.map((i) => chart.fajr[i]), 0, 'nearest');
    nres.push({ q, exact: s.exact, of: s.n, worst: s.worst, mae: +s.mae.toFixed(2) });
  }
  nres.sort((a, b) => b.exact - a.exact || a.worst - b.worst);
  console.log('  best sunrise-q*night(previous):', JSON.stringify(nres.slice(0, 4)));
}
// angle sweep refined for fajr with margins
{
  const angles = []; for (let a = 120; a <= 260; a++) angles.push(a / 10);
  const res = [];
  for (const a of angles) {
    const s = computeCols(adhan, coords, TZ, uncF.map((i) => dates[i]), { fajr: { kind: 'angle', v: a, after: false } });
    res.push({ a, ...bestMargin(s.fajr, uncF.map((i) => chart.fajr[i]), { margins: m6, modes: ['nearest'] }) });
  }
  res.sort((a2, b2) => b2.exact - a2.exact || a2.worst - b2.worst);
  console.log('  best angle:', JSON.stringify(res.slice(0, 4).map((r) => ({ a: r.a, exact: r.exact, of: r.of ?? uncF.length, worst: r.worst, margin: r.margin, mode: r.mode }))));
  void res;
}
