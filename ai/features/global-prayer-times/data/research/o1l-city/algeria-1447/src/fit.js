// One frozen recipe against three ministry books for the whole of 1447.
// adhan-js 4.4.6, Rounding.None then an explicit integer margin, TZ pinned, no clock read.
// usage: TZ=Africa/Algiers node src/fit.js
import { readFileSync, writeFileSync } from 'node:fs';
import { PrayerTimes, Coordinates, CalculationMethod, Madhab, Rounding, HighLatitudeRule } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js';

const HOME = process.env.HOME;
const ROOT = `${HOME}/athan-gitree/census/o1l-city/algeria-1447`;
const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];
const MODES = { nearest: Math.round, floor: Math.floor, ceil: Math.ceil };

const SITES = {
  dz47: { name: 'Alger', lat: 36.7538, lon: 3.0588 },
  ad47: { name: 'Adrar', lat: 27.8743, lon: -0.2939 },
  dj47: { name: 'Djelfa', lat: 34.6703, lon: 3.2630 },
};

// fit2's 1448 recipe, frozen verbatim; nothing below is allowed to move it.
const RECIPE = {
  fajrAngle: 17.8,
  ishaAngle: 16.1,
  madhab: Madhab.Shafi,
  per: {
    fajr: { margin: 0, mode: 'floor' },
    sunrise: { margin: 1, mode: 'floor' },
    dhuhr: { margin: 1, mode: 'floor' },
    asr: { margin: 1, mode: 'floor' },
    magrib: { margin: 4, mode: 'floor' },
    isha: { margin: 5, mode: 'nearest' },
  },
};

const toMin = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(2));

function load(tag) {
  const doc = JSON.parse(readFileSync(`${ROOT}/data/${tag}-1447-all.json`, 'utf8'));
  const days = [];
  for (const [m, month] of Object.entries(doc.months)) {
    for (const [date, r] of Object.entries(month.rows)) {
      if (r.fajr == null) continue;
      const obs = {};
      for (const p of PRAYERS) obs[p] = toMin(r[p === 'magrib' ? 'maghrib' : p]);
      days.push({ date, month: Number(m), obs });
    }
  }
  return days.sort((a, b) => a.date.localeCompare(b.date));
}

// isha cells the Alger book prints an hour high (verified at 6x, see REPORT.md)
const ISHA_ARTIFACT = new Set([
  '2026-02-14', '2026-02-15', '2026-02-16', '2026-02-17', '2026-02-18',
  '2026-04-13', '2026-04-14', '2026-04-15', '2026-04-16', '2026-04-17', '2026-04-18',
]);

function rawSeries(day, site, { fajrAngle, ishaAngle, madhab = Madhab.Shafi }) {
  const p = CalculationMethod.Other();
  p.fajrAngle = fajrAngle;
  p.ishaAngle = ishaAngle;
  p.madhab = madhab;
  p.rounding = Rounding.None;
  p.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
  const [y, m, d] = day.date.split('-').map(Number);
  const t = new PrayerTimes(new Coordinates(site.lat, site.lon), new Date(y, m - 1, d), p);
  const mins = (dt) => dt.getHours() * 60 + dt.getMinutes() + dt.getSeconds() / 60;
  return { fajr: mins(t.fajr), sunrise: mins(t.sunrise), dhuhr: mins(t.dhuhr), asr: mins(t.asr), magrib: mins(t.maghrib), isha: mins(t.isha) };
}

function score(days, site, params, margins, skip = () => false) {
  const raws = days.map((d) => rawSeries(d, site, params));
  const per = {};
  for (const p of PRAYERS) {
    const { margin, mode } = margins[p];
    const f = MODES[mode];
    let exact = 0, within1 = 0, worst = 0, sum = 0, n = 0;
    days.forEach((d, i) => {
      if (skip(d, p)) return;
      const err = f(raws[i][p] + margin) - d.obs[p];
      n++;
      if (err === 0) exact++;
      if (Math.abs(err) <= 1) within1++;
      worst = Math.max(worst, Math.abs(err));
      sum += Math.abs(err);
    });
    per[p] = { margin, mode, exact, within1, worst, mae: +(sum / n).toFixed(3), n };
  }
  const tot = PRAYERS.reduce(
    (a, p) => ({ exact: a.exact + per[p].exact, within1: a.within1 + per[p].within1, n: a.n + per[p].n, worst: Math.max(a.worst, per[p].worst) }),
    { exact: 0, within1: 0, n: 0, worst: 0 },
  );
  return { ...tot, exactPct: +((100 * tot.exact) / tot.n).toFixed(1), within1Pct: +((100 * tot.within1) / tot.n).toFixed(1), per };
}

function bestMargin(raws, obsList) {
  let best = null;
  for (const mode of ['nearest', 'floor', 'ceil']) {
    for (let m = -15; m <= 15; m++) {
      const f = MODES[mode];
      let exact = 0, within1 = 0, worst = 0, sum = 0;
      for (let i = 0; i < raws.length; i++) {
        const err = f(raws[i] + m) - obsList[i];
        if (err === 0) exact++;
        if (Math.abs(err) <= 1) within1++;
        worst = Math.max(worst, Math.abs(err));
        sum += Math.abs(err);
      }
      const s = { margin: m, mode, exact, within1, worst, mae: +(sum / raws.length).toFixed(3), n: raws.length };
      if (!best || s.worst < best.worst || (s.worst === best.worst && s.mae < best.mae) || (s.worst === best.worst && s.mae === best.mae && s.exact > best.exact)) best = s;
    }
  }
  return best;
}

function fitAngle(days, site, which, madhab, step, center) {
  const grid = which === 'fajr' ? [15, 21] : [14, 21];
  const lo = center == null ? grid[0] : center - 0.15;
  const hi = center == null ? grid[1] : center + 0.15;
  const clean = days.filter((d) => !skipIshaArtifact(d, which));
  const out = [];
  for (let a = lo; a <= hi + 1e-9; a += step) {
    const angle = +a.toFixed(2);
    const params = { fajrAngle: which === 'fajr' ? angle : 18, ishaAngle: which === 'isha' ? angle : 17, madhab };
    const raws = clean.map((d) => rawSeries(d, site, params)[which]);
    const obs = clean.map((d) => d.obs[which]);
    const bm = bestMargin(raws, obs);
    out.push({ angle, ...bm });
  }
  return out.sort((x, y) => x.worst - y.worst || x.mae - y.mae || y.exact - x.exact);
}

// grid over a small box: which point does the book's own table imply?
function bestPoint(days, center, span = 0.6, step = 0.05) {
  const coarse = scanPoint(days, center, span, step);
  const fine = scanPoint(days, coarse, 0.06, 0.005);
  return { ...fine, coarse };
}

function scanPoint(days, center, span, step) {
  let best = null;
  for (let lat = center.lat - span; lat <= center.lat + span + 1e-9; lat += step) {
    for (let lon = center.lon - span; lon <= center.lon + span + 1e-9; lon += step) {
      const site = { lat: +lat.toFixed(4), lon: +lon.toFixed(4) };
      const s = score(days, site, RECIPE, RECIPE.per);
      const key = { exact: s.exact, mae: PRAYERS.reduce((a, p) => a + s.per[p].mae, 0) / 6 };
      if (!best || key.exact > best.exact || (key.exact === best.exact && key.mae < best.mae)) best = { ...site, exact: key.exact, mae: +key.mae.toFixed(3), worst: s.worst };
    }
  }
  return best;
}

// the defect is in the Alger book alone; the same dates print correctly at Adrar and Djelfa
const skipFor = (tag) => (d, p) => tag === 'dz47' && p === 'isha' && ISHA_ARTIFACT.has(d.date);
const skipIshaArtifact = skipFor('dz47');

const out = { meta: { engine: 'adhan-js 4.4.6', tz: process.env.TZ, recipe: RECIPE, sites: SITES, ishaArtifactDates: [...ISHA_ARTIFACT] } };

for (const [tag, site] of Object.entries(SITES)) {
  const days = load(tag);
  const skip = skipFor(tag);
  const clean = score(days, site, RECIPE, RECIPE.per, skip);
  const printed = score(days, site, RECIPE, RECIPE.per);
  const byMonth = {};
  for (const d of days) (byMonth[d.month] ??= []).push(d);
  const monthly = Object.fromEntries(
    Object.entries(byMonth).map(([m, ds]) => {
      const s = score(ds, site, RECIPE, RECIPE.per, skip);
      return [m, { n: s.n, exact: s.exact, exactPct: s.exactPct, within1: s.within1, worst: s.worst, per: s.per }];
    }),
  );
  // free fit: do the angles come back to 17.80/16.10 at this site?
  const fScan = fitAngle(days, site, 'fajr', Madhab.Shafi, 0.05);
  const iScan = fitAngle(days, site, 'isha', Madhab.Shafi, 0.05);
  const fFine = fitAngle(days, site, 'fajr', Madhab.Shafi, 0.01, fScan[0].angle);
  const iFine = fitAngle(days, site, 'isha', Madhab.Shafi, 0.01, iScan[0].angle);
  const params = { fajrAngle: fFine[0].angle, ishaAngle: iFine[0].angle, madhab: Madhab.Shafi };
  const cleanDays = days.filter((d) => !skipIshaArtifact(d, 'isha'));
  const margins = Object.fromEntries(PRAYERS.map((p) => {
    const ds = p === 'isha' ? cleanDays : days;
    return [p, bestMargin(ds.map((d) => rawSeries(d, site, params)[p]), ds.map((d) => d.obs[p]))];
  }));
  const free = score(days, site, params, margins, skip);
  // isha re-parameterised: same printed curve, angle and margin un-degenerated by the summer months
  const RECIPE_ISHA17 = { ...RECIPE, ishaAngle: 17.0, per: { ...RECIPE.per, isha: { margin: 0, mode: 'ceil' } } };
  const isha17 = score(days, site, RECIPE_ISHA17, RECIPE_ISHA17.per, skip);
  const point = bestPoint(days, site);
  out[tag] = {
    site,
    days: days.length,
    frozen: clean,
    frozenAsPrinted: printed,
    isha17,
    frozenByMonth: monthly,
    free: { angles: { fajr: fFine[0].angle, isha: iFine[0].angle }, margins: Object.fromEntries(PRAYERS.map((p) => [p, `${margins[p].margin}/${margins[p].mode}`])), score: free },
    fajrRidge: fFine.slice(0, 7).map((r) => ({ angle: r.angle, exact: r.exact, worst: r.worst })),
    ishaRidge: iFine.slice(0, 7).map((r) => ({ angle: r.angle, exact: r.exact, worst: r.worst })),
    impliedPoint: point,
    impliedOffsetKm: +((Math.hypot((point.lat - site.lat) * 111, (point.lon - site.lon) * 111 * Math.cos((site.lat * Math.PI) / 180))).toFixed(1)),
  };
}

// cross-book: do the books differ from each other exactly as the sites do?
const dz = load('dz47');
const ad = load('ad47');
const dj = load('dj47');
const cross = {};
for (const [tag, days, site] of [['adrar-alger', ad, SITES.ad47], ['djelfa-alger', dj, SITES.dj47]]) {
  const byDate = Object.fromEntries(dz.map((d) => [d.date, d.obs]));
  const rows = {};
  for (const p of PRAYERS) {
    const printed = [];
    const modelled = [];
    for (const d of days) {
      if (!byDate[d.date]) continue;
      if (p === 'isha' && ISHA_ARTIFACT.has(d.date)) continue;
      printed.push(d.obs[p] - byDate[d.date][p]);
      modelled.push(rawSeries(d, site, RECIPE)[p] - rawSeries(d, SITES.dz47, RECIPE)[p]);
    }
    const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
    const resid = printed.map((v, i) => v - modelled[i]);
    rows[p] = { printedMean: +mean(printed).toFixed(2), modelledMean: +mean(modelled).toFixed(2), residMean: +mean(resid).toFixed(2), residMax: +Math.max(...resid.map(Math.abs)).toFixed(2), identical: printed.filter((v) => v === 0).length, n: printed.length };
  }
  cross[tag] = rows;
}
out.crossBook = cross;

// seasonal amplitude: printed and modelled Jan-to-Jul fajr span at each site
const amp = {};
for (const [tag, site] of Object.entries(SITES)) {
  const days = load(tag);
  const jan = days.filter((d) => d.date.slice(5, 7) === '01');
  const jul = days.filter((d) => d.date.slice(5, 7) === '07');
  const span = (arr, p) => Math.max(...arr.map((d) => d.obs[p])) - Math.min(...arr.map((d) => d.obs[p]));
  const modSpan = (arr, p) => Math.max(...arr.map((d) => rawSeries(d, site, RECIPE)[p])) - Math.min(...arr.map((d) => rawSeries(d, site, RECIPE)[p]));
  amp[tag] = Object.fromEntries(PRAYERS.map((p) => [p, { printedJan: span(jan, p), printedJul: span(jul, p), modelledJan: +modSpan(jan, p).toFixed(1), modelledJul: +modSpan(jul, p).toFixed(1) }]));
}
out.seasonalAmplitude = amp;

// every cell the frozen recipe misses by 2 or more: a transcription error would land here
const misses = {};
for (const [tag, site] of Object.entries(SITES)) {
  const days = load(tag);
  misses[tag] = [];
  for (const d of days) {
    const r = rawSeries(d, site, RECIPE);
    for (const p of PRAYERS) {
      const { margin, mode } = RECIPE.per[p];
      const err = MODES[mode](r[p] + margin) - d.obs[p];
      if (Math.abs(err) >= 2) misses[tag].push({ date: d.date, prayer: p, err, artifact: ISHA_ARTIFACT.has(d.date) });
    }
  }
}
out.misses = misses;

// how far a user's own coordinates can sit from the book's reference point before the minutes move
const sensitivity = {};
for (const [tag, site] of Object.entries(SITES)) {
  const days = load(tag);
  sensitivity[tag] = {};
  for (const dLat of [0.25, 0.5, 1.0]) {
    for (const axis of ['lat', 'lon']) {
      const moved = { lat: site.lat + (axis === 'lat' ? dLat : 0), lon: site.lon + (axis === 'lon' ? dLat : 0) };
      const worst = Object.fromEntries(PRAYERS.map((p) => [p, +Math.max(...days.map((d) => Math.abs(rawSeries(d, moved, RECIPE)[p] - rawSeries(d, site, RECIPE)[p]))).toFixed(1)]));
      sensitivity[tag][`${axis}+${dLat}`] = worst;
    }
  }
}
out.coordinateSensitivity = sensitivity;

writeFileSync(`${ROOT}/data/dz-fit-1447-full.json`, JSON.stringify(out, null, 1));

const line = (n, s) => `${n}: exact ${s.exact}/${s.n} (${s.exactPct}%), within1 ${s.within1}/${s.n} (${s.within1Pct}%), worst ${s.worst}`;
for (const [tag, site] of Object.entries(SITES)) {
  const r = out[tag];
  console.log(`\n== ${site.name} ${site.lat}/${site.lon}  ${r.days} days`);
  console.log('  frozen :', line('clean', r.frozen));
  console.log('  printed:', line('as-is', r.frozenAsPrinted));
  console.log('  isha17 :', line('isha17', r.isha17), JSON.stringify(Object.fromEntries(PRAYERS.map((p) => [p, `${r.isha17.per[p].exact}/${r.isha17.per[p].n} w1 ${r.isha17.per[p].within1} wr ${r.isha17.per[p].worst}`]))));
  for (const p of PRAYERS) {
    const a = r.frozen.per[p];
    console.log(`    ${p.padEnd(8)} ${a.exact}/${a.n} w1 ${a.within1} worst ${a.worst} mae ${a.mae}`);
  }
  console.log('  free   :', line('free', r.free.score), JSON.stringify(r.free.angles), JSON.stringify(r.free.margins));
  console.log('  implied point', JSON.stringify(r.impliedPoint), 'offset', r.impliedOffsetKm, 'km');
}
console.log('\nCROSS-BOOK (printed minus Alger vs adhan minus Alger)');
for (const [k, rows] of Object.entries(cross)) {
  for (const p of PRAYERS) {
    const r = rows[p];
    console.log(`  ${k.padEnd(14)} ${p.padEnd(8)} printed ${r.printedMean} model ${r.modelledMean} resid ${r.residMean} max ${r.residMax} ident ${r.identical}/${r.n}`);
  }
}
console.log('\nMISSES >= 2 min');
for (const [tag, list] of Object.entries(misses)) {
  console.log(' ', tag, list.length, JSON.stringify(list.slice(0, 14)));
}
console.log('\nCOORDINATE SENSITIVITY (worst minutes per column at an offset point)');
for (const [tag, rows] of Object.entries(sensitivity)) for (const [k, v] of Object.entries(rows)) console.log(`  ${tag} ${k.padEnd(10)} ${PRAYERS.map((p) => `${p} ${v[p]}`).join('  ')}`);
console.log('\nSEASONAL (printed Jan span / Jul span, modelled)');
for (const [k, v] of Object.entries(amp)) console.log(' ', k, PRAYERS.map((p) => `${p} ${v[p].printedJan}/${v[p].printedJul} (m ${v[p].modelledJan}/${v[p].modelledJul})`).join('  '));
