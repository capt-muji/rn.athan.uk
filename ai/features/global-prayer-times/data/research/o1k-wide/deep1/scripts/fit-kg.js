// Job 2 fit: the held Kyrgyz recipe across 2027-2035, on Jan + Jul windows.
// fajr 18 deg flat (floor); maghrib = sunset + 7 displayed; isha = displayed maghrib +
// round(k * (sunrise - fajr) + c), the twilight-ratio rule.
const fs = require('fs');
const path = require('path');
const L = require('./lib');

const ROOT = path.join(__dirname, '..');
const CAP = path.join(ROOT, 'captures');
const YEARS = [2027, 2029, 2031, 2033, 2035];
const LAT = 42.87, LNG = 74.59, TZ = 6;
const K_HELD = 7 / 9, C_HELD = 3.5;

const rh = L.roundHalfUp, fl = L.floorMin, ce = (x) => Math.ceil(x - 1e-9);
const mean = (v) => v.reduce((a, b) => a + b, 0) / v.length;
const sd = (v) => { const m = mean(v); return Math.sqrt(mean(v.map((x) => (x - m) ** 2))); };

function loadYear(year) {
  const rows = [];
  for (const w of ['jan', 'jul']) {
    const j = JSON.parse(fs.readFileSync(path.join(CAP, `kg-city1-${w}-${year}.json`), 'utf8'));
    for (const r of j.prayertimes) {
      const [d, m, y] = r.date.split('-').map(Number);
      rows.push({ day: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, tab: r });
    }
  }
  rows.sort((a, b) => a.day.localeCompare(b.day));
  for (const r of rows) {
    const [y, m, d] = r.day.split('-').map(Number);
    r.raw = L.rawTimes('kg', LAT, LNG, TZ, y, m, d);
    r.T = r.raw.sunrise - r.raw.fajr;
    r.maghrib = fl(r.raw.maghrib) + 7;
    r.Dpub = L.tmin(r.tab.isha) - L.tmin(r.tab.maghrib);
  }
  return rows;
}

function predict(r, k, c) {
  return {
    fajr: fl(r.raw.fajr),
    sunrise: fl(r.raw.sunrise),
    dhuhr: rh(r.raw.dhuhr),
    asr: ce(r.raw.asr) + 1,
    maghrib: r.maghrib,
    isha: r.maghrib + rh(k * r.T + c),
  };
}

function scoreRows(rows, k, c) {
  const out = {};
  let T = { n: 0, exact: 0, w1: 0, sum: 0, max: 0 };
  for (const col of L.COLS) out[col] = { n: 0, exact: 0, w1: 0, sum: 0, max: 0 };
  for (const r of rows) {
    const p = predict(r, k, c);
    for (const col of L.COLS) {
      const e = p[col] - L.tmin(r.tab[col]);
      const s = out[col];
      s.n++; if (e === 0) s.exact++; if (Math.abs(e) <= 1) s.w1++;
      s.sum += Math.abs(e); s.max = Math.max(s.max, Math.abs(e));
    }
  }
  const fin = {};
  for (const col of L.COLS) {
    const s = out[col];
    fin[col] = { exactPct: +(100 * s.exact / s.n).toFixed(1), w1Pct: +(100 * s.w1 / s.n).toFixed(1), mae: +(s.sum / s.n).toFixed(3), max: s.max };
    T.n += s.n; T.exact += s.exact; T.w1 += s.w1; T.sum += s.sum; T.max = Math.max(T.max, s.max);
  }
  T.exactPct = +(100 * T.exact / T.n).toFixed(1);
  T.w1Pct = +(100 * T.w1 / T.n).toFixed(1);
  T.mae = +(T.sum / T.n).toFixed(3);
  return { perColumn: fin, total: T };
}

// best additive constant at the held ratio, by exact count then MAE
function bestC(rows, k) {
  let best = null;
  for (let c = 1.0; c <= 6.0; c += 0.05) {
    const cc = +c.toFixed(2);
    let ok = 0, w1 = 0, sum = 0;
    for (const r of rows) {
      const e = r.maghrib + rh(k * r.T + cc) - L.tmin(r.tab.isha);
      if (e === 0) ok++; if (Math.abs(e) <= 1) w1++; sum += Math.abs(e);
    }
    const cand = { c: cc, exact: ok, w1, mae: +(sum / rows.length).toFixed(3) };
    if (!best || cand.w1 > best.w1 || (cand.w1 === best.w1 && cand.mae < best.mae)) best = cand;
  }
  return best;
}

const result = { job: 'KG 2027-2035', recipe: {}, years: {}, span: {} };

result.recipe = {
  source: 'muftiyat.kg documented JSON API, Bishkek (city 1)',
  coordinates: { lat: LAT, lng: LNG },
  clock: 'UTC+6',
  fajr: '18 deg, floor',
  sunrise: 'floor',
  dhuhr: 'round',
  asr: 'Hanafi, ceil(raw) + 1; the published column sits 1.25 min after adhan raw (range -0.3..+3.0)',
  maghrib: 'sunset + 7 min, displayed',
  isha: 'displayed maghrib + round(k * (sunrise - fajr) + c)',
  heldConstant: { k: +K_HELD.toFixed(4), c: C_HELD },
  windows: 'January (01-01..28-02) and July (01-07..31-08) of each year',
  engine: 'adhan-js 4.4.6 (Other 18/18, Hanafi, TwilightAngle)',
};

const perYear = [];
for (const year of YEARS) {
  const rows = loadYear(year);
  const held = scoreRows(rows, K_HELD, C_HELD);
  const bc = bestC(rows, K_HELD);
  const tuned = scoreRows(rows, K_HELD, bc.c);

  // the pure ratio test: base is the PUBLISHED maghrib, so the isha column alone is scored
  const kEff = rows.map((r) => (r.Dpub - C_HELD) / r.T);
  const cAt = rows.map((r) => r.Dpub - K_HELD * r.T);

  perYear.push({
    year,
    rows: rows.length,
    held,
    bestC: bc,
    tuned,
    ratio: {
      kEffMean: +mean(kEff).toFixed(5),
      kEffSd: +sd(kEff).toFixed(5),
      cMeanAtHeldK: +mean(cAt).toFixed(3),
      cSd: +sd(cAt).toFixed(3),
      offsetMin: Math.min(...rows.map((r) => r.Dpub)),
      offsetMax: Math.max(...rows.map((r) => r.Dpub)),
    },
    amplitude: {
      twilightRangeMin: +(Math.max(...rows.map((r) => r.T)) - Math.min(...rows.map((r) => r.T))).toFixed(1),
      ishaOffsetRangeMin: Math.max(...rows.map((r) => r.Dpub)) - Math.min(...rows.map((r) => r.Dpub)),
      maghribPublishedMinusSunsetSet: [...new Set(rows.map((r) => L.tmin(r.tab.maghrib) - L.tmin(r.tab.sunset)))].sort((a, b) => a - b),
    },
  });
  result.years[year] = perYear[perYear.length - 1];
}

// full-year 2027 control from the centralasia2 capture: annual amplitude and the same ratio test
const control = JSON.parse(fs.readFileSync(path.join(process.env.HOME, 'athan-gitree/census/o1k-wide/centralasia2/data/kg-bishkek-2027.json'), 'utf8'));
const ctlRows = Object.keys(control).sort().map((day) => ({ day, tab: { fajr: control[day].fajr, sunrise: control[day].sunrise, dhuhr: control[day].dhuhr, asr: control[day].asr, maghrib: control[day].maghrib, isha: control[day].isha } }));
for (const r of ctlRows) {
  const [y, m, d] = r.day.split('-').map(Number);
  r.raw = L.rawTimes('kg', LAT, LNG, TZ, y, m, d);
  r.T = r.raw.sunrise - r.raw.fajr;
  r.maghrib = fl(r.raw.maghrib) + 7;
  r.Dpub = L.tmin(r.tab.isha) - L.tmin(r.tab.maghrib);
}
const ctlHeld = scoreRows(ctlRows, K_HELD, C_HELD);
const ctlBest = bestC(ctlRows, K_HELD);
const ctlTuned = scoreRows(ctlRows, K_HELD, ctlBest.c);
const ctlKEff = ctlRows.map((r) => (r.Dpub - C_HELD) / r.T);
result.span.fullYear2027Control = {
  rows: ctlRows.length,
  held: { exact: ctlHeld.total.exactPct, w1: ctlHeld.total.w1Pct, mae: ctlHeld.total.mae, max: ctlHeld.total.max, isha: ctlHeld.perColumn.isha },
  bestC: ctlBest,
  tunedIsha: ctlTuned.perColumn.isha,
  ratio: { kEffMean: +mean(ctlKEff).toFixed(5), kEffSd: +sd(ctlKEff).toFixed(5), cMeanAtHeldK: +mean(ctlRows.map((r) => r.Dpub - K_HELD * r.T)).toFixed(3) },
  annualTwilightRangeMin: +(Math.max(...ctlRows.map((r) => r.T)) - Math.min(...ctlRows.map((r) => r.T))).toFixed(1),
  annualIshaOffsetRangeMin: Math.max(...ctlRows.map((r) => r.Dpub)) - Math.min(...ctlRows.map((r) => r.Dpub)),
};

const ks = perYear.map((e) => e.ratio.kEffMean);
const cs = perYear.map((e) => e.ratio.cMeanAtHeldK);
result.span.estimates = perYear.map((e) => ({ year: e.year, kEffMean: e.ratio.kEffMean, cMean: e.ratio.cMeanAtHeldK }));
result.span.k = { min: Math.min(...ks), max: Math.max(...ks), spread: +(Math.max(...ks) - Math.min(...ks)).toFixed(5) };
result.span.c = { min: Math.min(...cs), max: Math.max(...cs), spread: +(Math.max(...cs) - Math.min(...cs)).toFixed(3) };
result.span.verdict = result.span.k.spread <= 0.01 ? 'holds' : 'drifts';

fs.writeFileSync(path.join(ROOT, 'kg-deep.json'), JSON.stringify(result, null, 1));

console.log('year rows held(exact/w1/mae)  kEff  c  bestC  tuned(w1/mae)');
for (const e of perYear) {
  console.log(`${e.year} ${e.rows}  ${e.held.total.exactPct}/${e.held.total.w1Pct}/${e.held.total.mae}  ${e.ratio.kEffMean}  ${e.ratio.cMeanAtHeldK}  ${e.bestC.c}  ${e.tuned.total.w1Pct}/${e.tuned.total.mae}  ishaHeld w1=${e.held.perColumn.isha.w1Pct}`);
}
console.log('control', JSON.stringify(result.span.fullYear2027Control));
console.log('span k', JSON.stringify(result.span.k), 'c', JSON.stringify(result.span.c), result.span.verdict);
console.log('amplitude 2027', JSON.stringify(result.years[2027].amplitude));
