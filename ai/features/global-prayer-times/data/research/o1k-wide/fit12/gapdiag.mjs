// Model selection for a one-month print: angle (offset free) vs fixed interval.
// The angle is identified by the drift of the sunrise-fajr gap across the
// window; a single month cannot separate angles within ~3 degrees of each
// other, so the output is a model class plus an angle band, never a point.
// adhan 4.4.6, second resolution. Run: TZ=Europe/London node gapdiag.mjs
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { pmFlag, parseCol } from './engine.mjs';

const HOME = process.env.HOME;
const ADHAN = HOME + '/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/';
const mod = await import(pathToFileURL(ADHAN + 'Adhan.js'));
const { default: SolarTime } = await import(pathToFileURL(ADHAN + 'SolarTime.js'));
const { default: TimeComponents } = await import(pathToFileURL(ADHAN + 'TimeComponents.js'));

const D = HOME + '/athan-gitree/census/o1k-wide/uktowns2/data/';
const S = HOME + '/athan-gitree/census/o1k-wide/ukscotland/data/';

const tables = [
  ['Luton', D + 'luton-central-mosque-2026-11.json', 51.8787, -0.4200],
  ['Brighton', D + 'brighton-almedinah-2026-11.json', 50.8225, -0.1372],
  ['Dudley', D + 'dudley-mcc-2026-11.json', 52.5120, -2.0810],
  ['Preston', D + 'preston-jamea-2026-11.json', 53.7632, -2.7031],
  ['Blackpool', D + 'blackpool-central-2026-11.json', 53.8175, -3.0357],
  ['Middlesbrough', D + 'middlesbrough-central-2026-11.json', 54.5742, -1.2350],
  ['Stockport', D + 'stockport-islamic-centre-2026-11.json', 53.4106, -2.1575],
  ['Watford', D + 'watford-jamia-2026-11.json', 51.6565, -0.3903],
  ['Ilford', D + 'ilford-2026-11.json', 51.5590, 0.0741],
  ['Cambridge', D + 'cambridge-central-2026-11.json', 52.2053, 0.1218],
  ['Stoke', D + 'stoke-citycentral-month.json', 53.0027, -2.1794],
  ['Edinburgh', S + 'edinburgh-central-mosque-2026-11.json', 55.9533, -3.1883],
  ['Birmingham', S + 'birmingham-central-mosque-2026-11.json', 52.4862, -1.8904],
  ['Leicester', S + 'leicester-masjid-umar-2026-11.json', 52.6369, -1.1398, null, { fajr: 'subh_sadiq', isha: 'esha' }],
  ['Cardiff', S + 'swicc-cardiff-2026-11.json', 51.4816, -3.1791],
  ['Hull', S + 'hull-mosque-2026.json', 53.7443, -0.3325, (k) => !k.startsWith('2026-11')],
  ['London (LUPT)', D + 'lupt-2027-11.json', 51.5074, -0.1278],
  ['Nottingham', D + 'nottingham-ic-2026.json', 52.9548, -1.1581, (k) => k >= '2026-04-20' && k <= '2026-08-15'],
  ['Aberdeen', S + 'aberdeen-amic-central-2026.json', 57.1497, -2.0943],
];

const min = (v) => { const [h, m] = v.split(':').map(Number); return h * 60 + m; };
const inst = (d, hours) => new TimeComponents(hours).utcDate(d.getFullYear(), d.getMonth(), d.getDate());
const secOf = (dt) => dt.getHours() * 3600 + dt.getMinutes() * 60 + dt.getSeconds();
const rms = (a) => Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length);
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

// median-centred residuals plus least-squares drift in min/day
function stats(chart, model) {
  const raw = chart.map((c, i) => c - model[i]);
  const off = median(raw);
  const r = raw.map((x) => x - off);
  const n = r.length, mx = (n - 1) / 2;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (i - mx) * (r[i] - r.reduce((a, b) => a + b, 0) / n); sxx += (i - mx) ** 2; }
  return { off: +off.toFixed(2), rms: +rms(r).toFixed(2), slope: +(sxy / sxx).toFixed(3), max: +Math.max(...r.map(Math.abs)).toFixed(1) };
}

const out = [];
for (const entry of tables) {
  const [town, file, lat, lng, drop, cols] = entry;
  const colF = cols?.fajr ?? 'fajr', colI = cols?.isha ?? 'isha';
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const keys = Object.keys(data).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k) && !(drop && drop(k))).sort();
  const coords = new mod.Coordinates(lat, lng);
  const n = keys.length;
  const sr = [], ss = [];
  const chart = { fajr: [], isha: [] };
  const rawF = keys.map((k) => String(data[k][colF] ?? '').trim());
  const rawI = keys.map((k) => String(data[k][colI] ?? '').trim());
  const pmF = pmFlag('fajr', rawF), pmI = pmFlag('isha', rawI);
  const pick = (raw, p, pm) => (/^\d{1,2}:\d{2}$/.test(raw) ? parseCol(raw, p, pm) : NaN);
  for (const k of keys) {
    const [y, m, d] = k.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const st = new SolarTime(date, coords);
    sr.push(secOf(inst(date, st.sunrise)) / 60);
    ss.push(secOf(inst(date, st.sunset)) / 60);
    chart.fajr.push(pick(String(data[k][colF] ?? '').trim(), 'fajr', pmF));
    chart.isha.push(pick(String(data[k][colI] ?? '').trim(), 'isha', pmI));
  }
  const angleMin = (i, a, after) => {
    const [y, m, d] = keys[i].split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return secOf(inst(date, new SolarTime(date, coords).hourAngle(a, after))) / 60;
  };

  const sweep = (prayer, after) => {
    const rows = [];
    for (let a = 12; a <= 21.001; a += 0.25) {
      const model = keys.map((_, i) => angleMin(i, -a, after));
      const ok = model.map((v, i) => (isNaN(v) || isNaN(chart[prayer][i]) ? null : v));
      const pairs = chart[prayer].map((c, i) => [c, ok[i]]).filter(([c, v]) => v !== null && !isNaN(c));
      if (pairs.length < n * 0.7) continue;
      rows.push({ a, cov: pairs.length, ...stats(pairs.map((p) => p[0]), pairs.map((p) => p[1])) });
    }
    rows.sort((x, y) => x.rms - y.rms);
    return rows;
  };

  const fSweep = sweep('fajr', false), iSweep = sweep('isha', true);
  const fFixed = stats(chart.fajr, sr), iFixed = stats(chart.isha, ss);
  const at18F = stats(chart.fajr, keys.map((_, i) => angleMin(i, -18, false)));
  const at18I = stats(chart.isha, keys.map((_, i) => angleMin(i, -18, true)));

  const model = (best, fixed) => {
    if (best.rms * 3 < fixed.rms) return 'angle';
    if (fixed.rms * 3 < best.rms) return 'interval';
    if (best.rms <= 0.6) return 'angle';
    if (fixed.rms <= 0.7) return 'interval';
    return 'stepwise-interval';
  };
  const monthly = (chartVals, modelVals) => {
    const acc = {};
    chartVals.forEach((c, i) => {
      if (isNaN(c) || isNaN(modelVals[i])) return;
      (acc[keys[i].slice(0, 7)] ??= []).push(c - modelVals[i]);
    });
    const o = {};
    for (const [m, a] of Object.entries(acc)) o[m] = { n: a.length, mean: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1), max: +Math.max(...a.map(Math.abs)).toFixed(1) };
    return o;
  };
  const selected = (chartVals, sweepRows, fixedRows, after) => {
    const useAngle = sweepRows[0].rms <= fixedRows.rms;
    const modelVals = useAngle
      ? keys.map((_, i) => angleMin(i, -sweepRows[0].a, after))
      : after ? ss : sr;
    return monthly(chartVals, modelVals);
  };
  const monthFajr = selected(chart.fajr, fSweep, fFixed, false);
  const monthIsha = selected(chart.isha, iSweep, iFixed, true);
  const amp = (ch, mv) => {
    const by = {};
    ch.forEach((c, i) => { if (!isNaN(c) && !isNaN(mv[i])) (by[keys[i].slice(5, 7)] ??= []).push(c); });
    const meanOf = (m) => { const a = by[m]; return a ? a.reduce((x, y) => x + y, 0) / a.length : null; };
    const jan = meanOf('01'), jul = meanOf('07');
    return jan !== null && jul !== null ? +(jul - jan).toFixed(1) : null;
  };
  const fajrModel = fSweep[0].rms <= fFixed.rms ? keys.map((_, i) => angleMin(i, -fSweep[0].a, false)) : sr;
  const ishaModel = iSweep[0].rms <= iFixed.rms ? keys.map((_, i) => angleMin(i, -iSweep[0].a, true)) : ss;
  out.push({
    town, days: n,
    fajr: {
      model: model(fSweep[0], fFixed), bestAngle: fSweep[0].a, angleRms: fSweep[0].rms, angleSlope: fSweep[0].slope,
      fixedRms: fFixed.rms, fixedSlope: fFixed.slope, gapMean: +(sr.reduce((s, v, i) => s + (v - chart.fajr[i]), 0) / n).toFixed(1),
      at18Rms: at18F.rms, at18Slope: at18F.slope,
      band: fSweep.filter((r) => r.rms <= fSweep[0].rms + 0.15).map((r) => r.a),
      months: monthFajr, janJulSpan: amp(chart.fajr, fajrModel),
    },
    isha: {
      model: model(iSweep[0], iFixed), bestAngle: iSweep[0].a, angleRms: iSweep[0].rms, angleSlope: iSweep[0].slope,
      fixedRms: iFixed.rms, fixedSlope: iFixed.slope, gapMean: +(chart.isha.reduce((s, v, i) => s + (v - ss[i]), 0) / n).toFixed(1),
      at18Rms: at18I.rms, at18Slope: at18I.slope,
      band: iSweep.filter((r) => r.rms <= iSweep[0].rms + 0.15).map((r) => r.a),
      months: monthIsha, janJulSpan: amp(chart.isha, ishaModel),
    },
    span: n === 30 || n === 31 || n === 32 ? keys[0] + '..' + keys[n - 1] : keys[0] + '..' + keys[n - 1],
  });
}

for (const r of out) {
  const band = (b) => (b.length ? `${Math.min(...b)}-${Math.max(...b)}` : '-');
  console.log(`${r.town.padEnd(14)} fajr ${r.fajr.model.padEnd(17)} angle ${String(r.fajr.bestAngle).padStart(5)} band ${band(r.fajr.band).padEnd(12)} rms ${String(r.fajr.angleRms).padStart(4)} | fixed rms ${String(r.fajr.fixedRms).padStart(4)} slope ${String(r.fajr.fixedSlope).padStart(6)} | gap ${String(r.fajr.gapMean).padStart(6)}`);
  console.log(`${''.padEnd(14)} isha ${r.isha.model.padEnd(17)} angle ${String(r.isha.bestAngle).padStart(5)} band ${band(r.isha.band).padEnd(12)} rms ${String(r.isha.angleRms).padStart(4)} | fixed rms ${String(r.isha.fixedRms).padStart(4)} slope ${String(r.isha.fixedSlope).padStart(6)} | gap ${String(r.isha.gapMean).padStart(6)}`);
}
fs.writeFileSync(HOME + '/athan-gitree/census/o1k-wide/fit12/gapdiag.json', JSON.stringify(out, null, 1));
