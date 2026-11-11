// Sweden IF national table: 18/16 with a high-latitude substitution window.
// Classifies angle-honest days vs the substituted window and tests the
// frozen-latitude-45 family on the window.
import fs from 'node:fs';
import { loadFlex, makeContext45, pairUnder } from './lib8.mjs';
import { bestMargin } from './lib.mjs';

const W = process.env.HOME + '/athan-gitree/census/o1l-city/O1l-31';
const cols = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'maghrib', isha: 'isha' };
const sec = (dt) => (dt === null || isNaN(dt.getTime()) ? null : dt.getHours() * 3600 + dt.getMinutes() * 60 + dt.getSeconds());

function score(secArr, chartArr, idx) {
  const s = [], c = [];
  for (const i of idx) {
    if (secArr[i] === null || Number.isNaN(secArr[i]) || Number.isNaN(chartArr[i])) continue;
    s.push(secArr[i]); c.push(chartArr[i]);
  }
  if (!s.length) return null;
  const r = bestMargin(Float64Array.from(s), Int32Array.from(c), { jMax: 60, m0: -15 });
  let exact = 0, within1 = 0, worst = 0, n = 0;
  for (let k = 0; k < s.length; k++) {
    const v = (r.mode === 'floor' ? Math.floor : r.mode === 'ceil' ? Math.ceil : Math.round)(s[k] / 60 + r.margin);
    const d = Math.abs(v - c[k]);
    if (d === 0) exact++; if (d <= 1) within1++; if (d > worst) worst = d; n++;
  }
  return { ...r, exact, within1, worst, coverage: n };
}

const cities = [
  ['malmo', 55.6050, 13.0038], ['linkoping', 58.4108, 15.6214], ['orebro', 59.2741, 15.2066],
  ['vasteras', 59.6099, 16.5448], ['umea', 63.8258, 20.2630], ['lulea', 65.5848, 22.1547],
  ['kiruna', 67.8558, 20.2253],
];
const out = { job: 'o1l-31-se-ifis', meta: { engine: 'adhan 4.4.6', claim: 'IF 18/16 + high-latitude substitution' }, cities: [] };

for (const [city, lat, lng] of cities) {
  const { slots } = loadFlex(W + '/data/se-ifis-' + city + '-2026.json', cols);
  for (const s of slots) { if (s.chart.isha < 300) s.chart.isha += 1440; }
  const pack = await makeContext45(lat, lng, slots);
  const ctx = pack.ctx;
  const n = slots.length;
  const all = [...Array(n).keys()];

  const f18 = [], i16 = [];
  for (let i = 0; i < n; i++) {
    f18.push(sec(ctx.hourAngle(i, -18, false)));
    let v = sec(ctx.hourAngle(i, -16, true)); if (v !== null && v < 36000) v += 86400; i16.push(v);
  }
  const chartF = slots.map((s) => s.chart.fajr), chartI = slots.map((s) => s.chart.isha);

  // angle-honest days: within 1 min at zero margin, floor
  const honest = (secArr, chartArr) => all.filter((i) => {
    if (secArr[i] === null || Number.isNaN(chartArr[i])) return false;
    return Math.abs(Math.floor(secArr[i] / 60) - chartArr[i]) <= 1;
  });
  const fHonest = honest(f18, chartF), iHonest = honest(i16, chartI);

  // frozen-45 substitution on the rest
  const f45 = [], i45 = [];
  for (let i = 0; i < n; i++) {
    const p = pairUnder(pack, i, 18, 16, { kind: 'frozen45', fa: 18, is: 16 });
    f45.push(p.f); i45.push(p.i === null ? null : p.i + (p.i < 36000 ? 86400 : 0));
  }
  const fSub = all.filter((i) => !fHonest.includes(i));
  const iSub = all.filter((i) => !iHonest.includes(i));

  const windows = (idx) => {
    const w = []; let cur = null;
    for (const i of idx) {
      if (cur && i === cur.end + 1) { cur.end = i; cur.n++; }
      else { if (cur) w.push(cur); cur = { start: i, end: i, n: 1 }; }
    }
    if (cur) w.push(cur);
    return w.filter((x) => x.n >= 3).map((x) => ({ from: slots[x.start].key, to: slots[x.end].key, days: x.n }));
  };

  const res = {
    city, lat, lng, rows: n,
    fajr: { claim: score(f18, chartF, all), honest: score(f18, chartF, fHonest), honestDays: fHonest.length, frozen45: score(f45, chartF, fSub), subDays: fSub.length, windows: windows(fSub) },
    isha: { claim: score(i16, chartI, all), honest: score(i16, chartI, iHonest), honestDays: iHonest.length, frozen45: score(i45, chartI, iSub), subDays: iSub.length, windows: windows(iSub) },
    solar: {
      sunrise: score(ctx.raw.sunrise, slots.map((s) => s.chart.sunrise), all),
      dhuhr: score(ctx.raw.dhuhr, slots.map((s) => s.chart.dhuhr), all),
      asr1: score(ctx.raw.asr1, slots.map((s) => s.chart.asr), all),
      asr2: score(ctx.raw.asr2, slots.map((s) => s.chart.asr), all),
      maghrib: score(ctx.raw.maghrib, slots.map((s) => s.chart.maghrib), all),
    },
  };
  out.cities.push(res);
  fs.writeFileSync(W + '/fits/se-ifis-fit.json', JSON.stringify(out, null, 1));
  const s = (x) => x ? `m${x.margin} ${x.mode} ${x.exact}/${x.coverage} w1 ${x.within1} worst ${x.worst}` : '-';
  console.log(`\n${city} rows ${n}`);
  console.log(`  fajr claim ${s(res.fajr.claim)} | honest(${res.fajr.honestDays}) ${s(res.fajr.honest)} | frozen45 on ${res.fajr.subDays} sub ${s(res.fajr.frozen45)}`);
  console.log(`  isha claim ${s(res.isha.claim)} | honest(${res.isha.honestDays}) ${s(res.isha.honest)} | frozen45 on ${res.isha.subDays} sub ${s(res.isha.frozen45)}`);
  console.log(`  windows fajr ${JSON.stringify(res.fajr.windows)} isha ${JSON.stringify(res.isha.windows)}`);
  console.log(`  solar sr ${s(res.solar.sunrise)} dh ${s(res.solar.dhuhr)} asr1 ${s(res.solar.asr1)} asr2 ${s(res.solar.asr2)} mg ${s(res.solar.maghrib)}`);
}
