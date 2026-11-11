// Generic multi-country fitter: one recipe per surface, per-year scores,
// between-year stability, seasonal amplitude. adhan 4.4.6, explicit rounding.
import fs from 'node:fs';
import { loadFlex, makeContext45, freeScan2D, amplitude } from './lib8.mjs';
import { bestMargin } from './lib.mjs';

const W = process.env.HOME + '/athan-gitree/census/o1l-city/O1l-31';
const OUT = W + '/fits/multi-fit.json';
const cols = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'maghrib', isha: 'isha' };
const angles = (a, b, s) => { const r = []; for (let v = a; v <= b + 1e-9; v += s) r.push(Math.round(v * 100) / 100); return r; };

const sec = (dt) => (isNaN(dt.getTime()) ? null : dt.getHours() * 3600 + dt.getMinutes() * 60 + dt.getSeconds());

function marginOn(secArr, chartArr, idx) {
  const s = [], c = [];
  for (const i of idx) {
    if (secArr[i] === null || Number.isNaN(secArr[i]) || Number.isNaN(chartArr[i])) continue;
    s.push(secArr[i]); c.push(chartArr[i]);
  }
  if (!s.length) return null;
  return bestMargin(Float64Array.from(s), Int32Array.from(c), { jMax: 60, m0: -15 });
}

function stats(secArr, chartArr, idx, margin, mode) {
  let exact = 0, within1 = 0, worst = 0, n = 0;
  for (const i of idx) {
    if (secArr[i] === null || Number.isNaN(secArr[i]) || Number.isNaN(chartArr[i])) continue;
    const v = (mode === 'floor' ? Math.floor : mode === 'ceil' ? Math.ceil : Math.round)(secArr[i] / 60 + margin);
    const d = Math.abs(v - chartArr[i]);
    if (d === 0) exact++; if (d <= 1) within1++; if (d > worst) worst = d; n++;
  }
  return { margin, mode, exact, within1, worst, coverage: n };
}

const out = { job: 'o1l-31-multi', meta: { engine: 'adhan 4.4.6', discipline: 'second resolution then explicit rounding; TZ per country' }, fits: [] };

function arg(name, dflt) {
  const i = process.argv.indexOf('--' + name);
  return i > 0 ? process.argv[i + 1] : dflt;
}

const only = arg('only', null);
const tables = JSON.parse(fs.readFileSync(W + '/fits/tables.json', 'utf8'));

for (const t of tables) {
  if (only && !t.tag.startsWith(only)) continue;
  const { slots } = loadFlex(W + '/data/' + t.file, cols);
  for (const s of slots) {
    if (s.chart.isha < 300) s.chart.isha += 1440;
    if (s.chart.maghrib < 600) s.chart.maghrib += 1440;
  }
  const pack = await makeContext45(t.lat, t.lng, slots);
  const ctx = pack.ctx;
  const n = slots.length;
  const years = [...new Set(slots.map((s) => s.key.slice(0, 4)))];
  const chart = (p) => slots.map((s) => s.chart[p]);
  const idx = [...Array(n).keys()];

  const solar = {
    sunrise: marginOn(ctx.raw.sunrise, chart('sunrise'), idx),
    dhuhr: marginOn(ctx.raw.dhuhr, chart('dhuhr'), idx),
    asr1: marginOn(ctx.raw.asr1, chart('asr'), idx),
    asr2: marginOn(ctx.raw.asr2, chart('asr'), idx),
    maghrib: marginOn(ctx.raw.maghrib, chart('maghrib'), idx),
  };

  // claim pair, bare
  const faT = [], isT = [];
  for (let i = 0; i < n; i++) {
    faT.push(sec(ctx.hourAngle(i, -t.fa, false)));
    let iv = sec(ctx.hourAngle(i, -t.is, true));
    if (iv !== null && iv < 36000) iv += 86400;
    isT.push(iv);
  }
  const fClaim = marginOn(faT, chart('fajr'), idx);
  const iClaim = marginOn(isT, chart('isha'), idx);
  const fStats = fClaim ? stats(faT, chart('fajr'), idx, fClaim.margin, fClaim.mode) : null;
  const iStats = iClaim ? stats(isT, chart('isha'), idx, iClaim.margin, iClaim.mode) : null;

  // per-year at the frozen claim margin
  const perYear = years.map((y) => {
    const yi = slots.map((s, i) => (s.key.startsWith(y) ? i : -1)).filter((i) => i >= 0);
    return {
      year: y, days: yi.length,
      fajr: fStats ? stats(faT, chart('fajr'), yi, fStats.margin, fStats.mode) : null,
      isha: iStats ? stats(isT, chart('isha'), yi, iStats.margin, iStats.mode) : null,
      sunrise: marginOn(ctx.raw.sunrise, chart('sunrise'), yi),
      maghrib: marginOn(ctx.raw.maghrib, chart('maghrib'), yi),
    };
  });

  // free scans (bare), plus portions fallbacks if requested
  const free = {
    fajr: freeScan2D(pack, slots, 'f', 'bare', { angles: angles(t.scanLo ?? 11, t.scanHi ?? 21, 0.25), other: t.is }).slice(0, 4),
    isha: freeScan2D(pack, slots, 'i', 'bare', { angles: angles(t.scanLo ?? 11, t.scanHi ?? 21, 0.25), other: t.fa }).slice(0, 4),
  };
  const amp = amplitude(pack, slots, { kind: 'bare', fa: t.fa, is: t.is });

  const res = { tag: t.tag, file: t.file, lat: t.lat, lng: t.lng, rows: n, years, claim: { fa: t.fa, is: t.is, fajr: fStats, isha: iStats }, solar, perYear, free, amplitude: amp };
  out.fits.push(res);
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  const s = (x) => x ? `m${x.margin} ${x.mode} ${x.exact}/${x.coverage} w1 ${x.within1} worst ${x.worst}` : '-';
  console.log(`\n${t.tag} rows ${n} years ${years.join(',')}`);
  console.log(`  claim ${t.fa}/${t.is}: fajr ${s(fStats)} | isha ${s(iStats)}`);
  console.log(`  solar sunrise ${s(solar.sunrise)} dhuhr ${s(solar.dhuhr)} asr1 ${s(solar.asr1)} asr2 ${s(solar.asr2)} maghrib ${s(solar.maghrib)}`);
  console.log(`  free fajr ${free.fajr.map((x) => x.params.fa + ':' + x.exact + '/' + x.coverage).join(' ')} | isha ${free.isha.map((x) => x.params.fa + ':' + x.exact + '/' + x.coverage).join(' ')}`);
  for (const p of perYear) console.log(`  ${p.year} fajr ${s(p.fajr)} isha ${s(p.isha)} sunrise ${s(p.sunrise)}`);
  console.log(`  amp ${JSON.stringify(amp)}`);
}
console.log('\nwrote fits/multi-fit.json');
