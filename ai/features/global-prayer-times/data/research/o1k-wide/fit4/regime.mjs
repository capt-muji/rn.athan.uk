// Fajr/isha regime analyzer: angle vs night-fraction vs LUPT-style interval.
// Run: TZ=Europe/London node regime.mjs
import fs from 'node:fs';
import { loadTable, makeContext } from './engine.mjs';

const HOME = process.env.HOME;
const D = HOME + '/athan-gitree/census/o1k-wide/uktowns2/data/';
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };

const luptByMMDD = {};
for (const mo of ['01', '02', '04', '07', '11', '12']) {
  const d = JSON.parse(fs.readFileSync(`${D}lupt-2027-${mo}.json`, 'utf8'));
  for (const [k, row] of Object.entries(d)) luptByMMDD[k.slice(5)] = row;
}
const parseLu = (v) => {
  if (!/^\d{1,2}:\d{2}$/.test(v)) return null;
  let h = parseInt(v.slice(0, v.indexOf(':')), 10);
  const m = parseInt(v.slice(-2), 10);
  return h * 60 + m; // LUPT fajr/isha handled below via raw strings
};
// LUPT fajr/isha are 24h? check: 2027-01 fajr 06:26 (am, no pm needed), isha 05:42 -> pm
const luVal = (mmdd, col, pm) => {
  const v = String(luptByMMDD[mmdd]?.[col] ?? '').trim();
  if (!/^\d{1,2}:\d{2}$/.test(v)) return null;
  let h = parseInt(v.slice(0, v.indexOf(':')), 10);
  const m = parseInt(v.slice(-2), 10);
  if (pm && h < 12) h += 12;
  return h * 60 + m;
};

const towns = [
  { tag: 'reading', file: D + 'reading-amic-2026.json', cols: { fajr: 'fajr', maghrib: 'magrib', isha: 'isha' }, lat: 51.4543, lng: -0.9781 },
  { tag: 'coventry', file: D + 'coventry-zeenatul-islam-2026.json', cols: { fajr: 'fajr', sunrise: 'sunrise', maghrib: 'magrib', isha: 'isha' }, lat: 52.4068, lng: -1.5197 },
  { tag: 'rochdale', file: D + 'rochdale-golden-2026.json', cols: { fajr: 'fajr', sunrise: 'sunrise', maghrib: 'magrib', isha: 'isha' }, lat: 53.6097, lng: -2.1561 },
  { tag: 'bolton', file: D + 'bolton-zakariyya-2026.json', cols: { fajr: 'fajr', sunrise: 'sunrise', maghrib: 'magrib', isha: 'isha' }, lat: 53.5769, lng: -2.4282 },
];

for (const t of towns) {
  const tt = loadTable(t);
  const ctx = await makeContext(t.lat, t.lng, tt.slots);
  // pm flags for the town's own fajr/isha columns: fajr am; isha 12h if <=9 hour present
  const raw = (file, col) => { const d = JSON.parse(fs.readFileSync(file, 'utf8')); return Object.keys(d).sort().map((k) => String(d[k]?.[col] ?? '').trim()); };
  const ishaRaw = raw(t.file, t.cols.isha);
  const ishaPm = ishaRaw.some((v) => /^(\d{1,2}):/.exec(v) && parseInt(/^(\d{1,2}):/.exec(v)[1], 10) <= 9);
  const chartIsha = (v) => { let h = parseInt(v.slice(0, v.indexOf(':')), 10); const m = parseInt(v.slice(-2), 10); if (ishaPm && h < 12) h += 12; return h * 60 + m; };

  console.log(`\n### ${t.tag} (isha pm=${ishaPm})`);
  const leads = [], lags = [], fracs = [], luF = [], luI = [];
  for (let i = 0; i < tt.slots.length; i++) {
    const s = tt.slots[i];
    const srC = ctx.raw.sunrise[i] / 60, mgC = ctx.raw.maghrib[i] / 60;
    const night = ctx.night[i] / 60;
    const lead = srC - s.chart.fajr;
    const mgChart = s.chart.maghrib;
    const lag = chartIsha(ishaRaw[i]) - mgChart;
    leads.push(lead); lags.push(lag); fracs.push(lead / night);
    const luFajr = luVal(s.key.slice(5), 'fajr', false);
    const luSr = luVal(s.key.slice(5), 'sunrise', false);
    const luIsha = luVal(s.key.slice(5), 'isha', true);
    const luMg = luVal(s.key.slice(5), 'magrib', true);
    if (luFajr !== null && luSr !== null) luF.push(lead - (luSr - luFajr));
    if (luIsha !== null && luMg !== null) luI.push(lag - (luIsha - luMg));
  }
  // fraction regression: lead = p*night  -> p = sum(l*n)/sum(n*n)
  let sn = 0, snn = 0;
  for (let i = 0; i < tt.slots.length; i++) { const n = ctx.night[i] / 60; sn += leads[i] * n; snn += n * n; }
  const p = sn / snn;
  const fracRes = [];
  for (let i = 0; i < tt.slots.length; i++) fracRes.push(leads[i] - p * (ctx.night[i] / 60));
  console.log(`fajr lead: distinct ${new Set(leads).size}, median ${med(leads).toFixed(0)}, range ${Math.min(...leads)}..${Math.max(...leads)}`);
  console.log(`  fraction fit p=${p.toFixed(4)} residual sd ${(Math.sqrt(fracRes.reduce((a, r) => a + r * r, 0) / fracRes.length)).toFixed(1)} worst ${Math.max(...fracRes.map(Math.abs)).toFixed(0)}`);
  console.log(`  vs LUPT F (lead - F): mean ${(luF.reduce((a, b) => a + b, 0) / luF.length).toFixed(1)} sd ${(Math.sqrt(luF.reduce((a, r) => a + r * r, 0) / luF.length)).toFixed(1)} worst ${Math.max(...luF.map(Math.abs))} (n=${luF.length})`);
  const fRange = luF.map((x, i) => [x, i]);
  console.log(`  LUPT-F diff by month: ${Object.entries(Object.groupBy(luF, (x) => x)).length}`);
  let sn2 = 0, snn2 = 0;
  const nIsh = [];
  for (let i = 0; i < tt.slots.length; i++) nIsh.push(ctx.night[i] / 60);
  for (let i = 0; i < tt.slots.length; i++) { sn2 += lags[i] * nIsh[i]; snn2 += nIsh[i] * nIsh[i]; }
  const pI = sn2 / snn2;
  const lagFr = lags.map((l, i) => l - pI * nIsh[i]);
  console.log(`isha lag: distinct ${new Set(lags).size}, median ${med(lags).toFixed(0)}, range ${Math.min(...lags)}..${Math.max(...lags)}`);
  console.log(`  fraction fit pI=${pI.toFixed(4)} residual sd ${(Math.sqrt(lagFr.reduce((a, r) => a + r * r, 0) / lagFr.length)).toFixed(1)} worst ${Math.max(...lagFr.map(Math.abs)).toFixed(0)}`);
  console.log(`  vs LUPT I (lag - I): mean ${(luI.reduce((a, b) => a + b, 0) / luI.length).toFixed(1)} sd ${(Math.sqrt(luI.reduce((a, r) => a + r * r, 0) / luI.length)).toFixed(1)} worst ${Math.max(...luI.map(Math.abs))} (n=${luI.length})`);
  // month medians of lead-luptF to see drift shape
  const byMo = {};
  const luFpairs = [];
  for (let i = 0; i < tt.slots.length; i++) {
    const luFajr = luVal(tt.slots[i].key.slice(5), 'fajr', false);
    const luSr = luVal(tt.slots[i].key.slice(5), 'sunrise', false);
    const luIsha = luVal(tt.slots[i].key.slice(5), 'isha', true);
    const luMg = luVal(tt.slots[i].key.slice(5), 'magrib', true);
    if (luFajr !== null && luSr !== null) (byMo[tt.slots[i].key.slice(5, 7)] ??= []).push(leads[i] - (luSr - luFajr));
    if (luIsha !== null && luMg !== null) luFpairs.push([tt.slots[i].key.slice(5, 7), lags[i] - (luIsha - luMg)]);
  }
  console.log('  (lead-LUPT F) month medians: ' + Object.entries(byMo).map(([mo, a]) => `${mo}:${med(a).toFixed(1)}(n=${a.length})`).join(' '));
  const byMo2 = {};
  for (const [mo, v] of luFpairs) (byMo2[mo] ??= []).push(v);
  console.log('  (lag-LUPT I) month medians: ' + Object.entries(byMo2).map(([mo, a]) => `${mo}:${med(a).toFixed(1)}(n=${a.length})`).join(' '));
}
