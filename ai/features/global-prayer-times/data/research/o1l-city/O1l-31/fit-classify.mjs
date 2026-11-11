// Classifying fitter: score the claimed angle pair on angle-honest days only,
// size the substituted window, and test the two common high-latitude families
// (frozen latitude 45, night portions) on the window.
import fs from 'node:fs';
import { loadFlex, makeContext45, pairUnder } from './lib8.mjs';
import { bestMargin } from './lib.mjs';

const W = process.env.HOME + '/athan-gitree/census/o1l-city/O1l-31';
const cols = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'maghrib', isha: 'isha' };
const sec = (d) => (d === null || isNaN(d.getTime()) ? null : d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds());

function stats(secArr, chartArr, idx, tol = 1) {
  let exact = 0, within1 = 0, worst = 0, n = 0;
  for (const i of idx) {
    if (secArr[i] === null || Number.isNaN(chartArr[i])) continue;
    const d = Math.abs(Math.floor(secArr[i] / 60) - chartArr[i]);
    if (d === 0) exact++; if (d <= tol) within1++; if (d > worst) worst = d; n++;
  }
  return { exact, within1, worst, coverage: n };
}

const cfg = JSON.parse(fs.readFileSync(W + '/fits/classify-is.json', 'utf8'));
const out = { job: 'o1l-31-classify', meta: { engine: 'adhan 4.4.6', rule: 'angle-honest days at zero margin, floor' }, cities: [] };

for (const c of cfg) {
  const { slots } = loadFlex(W + '/data/' + c.file, cols);
  for (const s of slots) { if (s.chart.isha < 300) s.chart.isha += 1440; }
  const pack = await makeContext45(c.lat, c.lng, slots);
  const ctx = pack.ctx;
  const n = slots.length;
  const fa = c.fa, is = c.is;

  const fA = [], iA = [];
  for (let i = 0; i < n; i++) {
    fA.push(sec(ctx.hourAngle(i, -fa, false)));
    let v = sec(ctx.hourAngle(i, -is, true));
    if (v !== null && v < 36000) v += 86400;
    iA.push(v);
  }
  const chartF = slots.map((s) => s.chart.fajr), chartI = slots.map((s) => s.chart.isha);
  const honest = (arr, ch) => [...Array(n).keys()].filter((i) => arr[i] !== null && !Number.isNaN(ch[i]) && Math.abs(Math.floor(arr[i] / 60) - ch[i]) <= 1);
  const fH = honest(fA, chartF), iH = honest(iA, chartI);

  const win = (idx) => {
    const w = []; let cur = null;
    for (const i of idx) {
      if (cur && i === cur.end + 1) { cur.end = i; cur.n++; } else { if (cur) w.push(cur); cur = { start: i, end: i, n: 1 }; }
    }
    if (cur) w.push(cur);
    return w.filter((x) => x.n >= 4).map((x) => `${slots[x.start].key}..${slots[x.end].key} (${x.n}d)`);
  };
  const subF = [...Array(n).keys()].filter((i) => !fH.includes(i));
  const subI = [...Array(n).keys()].filter((i) => !iH.includes(i));

  // families on the substituted window
  const fam = (arr, ch, idx, label) => stats(arr, ch, idx);

  const f45 = [], i45 = [], f5 = [], i5 = [];
  for (let i = 0; i < n; i++) {
    const a = pairUnder(pack, i, fa, is, { kind: 'frozen45', fa, is });
    f45.push(a.f); i45.push(a.i === null ? null : a.i < 36000 ? a.i + 86400 : a.i);
    const b = pairUnder(pack, i, fa, is, { kind: 'portions', fajr: 1 / 5, isha: 1 / 5 });
    f5.push(b.f); i5.push(b.i === null ? null : b.i < 36000 ? b.i + 86400 : b.i);
  }

  const res = {
    tag: c.tag, lat: c.lat, lng: c.lng, rows: n, claim: `${fa}/${is}`,
    fajr: { honest: stats(fA, chartF, fH), honestDays: fH.length, window: win(subF), frozen45: fam(f45, chartF, subF), portions5: fam(f5, chartF, subF) },
    isha: { honest: stats(iA, chartI, iH), honestDays: iH.length, window: win(subI), frozen45: fam(i45, chartI, subI), portions5: fam(i5, chartI, subI) },
    solar: {
      sunrise: stats(ctx.raw.sunrise, slots.map((s) => s.chart.sunrise), [...Array(n).keys()], 2),
      dhuhr: stats(ctx.raw.dhuhr, slots.map((s) => s.chart.dhuhr), [...Array(n).keys()], 2),
      asr1: stats(ctx.raw.asr1, slots.map((s) => s.chart.asr), [...Array(n).keys()], 2),
      maghrib: stats(ctx.raw.maghrib, slots.map((s) => s.chart.maghrib), [...Array(n).keys()], 2),
    },
  };
  out.cities.push(res);
  fs.writeFileSync(W + '/fits/classify-fit.json', JSON.stringify(out, null, 1));
  const s = (x) => `${x.exact}/${x.coverage} exact, w1 ${x.within1}, worst ${x.worst}`;
  console.log(`\n${c.tag} rows ${n} claim ${fa}/${is}`);
  console.log(`  fajr honest ${fH.length}d: ${s(res.fajr.honest)} | window ${res.fajr.window.join(' ')}`);
  console.log(`    frozen45 ${s(res.fajr.frozen45)} | portions1/5 ${s(res.fajr.portions5)}`);
  console.log(`  isha honest ${iH.length}d: ${s(res.isha.honest)} | window ${res.isha.window.join(' ')}`);
  console.log(`    frozen45 ${s(res.isha.frozen45)} | portions1/5 ${s(res.isha.portions5)}`);
  console.log(`  solar (tol2) sr ${s(res.solar.sunrise)} dh ${s(res.solar.dhuhr)} asr ${s(res.solar.asr1)} mg ${s(res.solar.maghrib)}`);
}
