// Job 3 fit: the held Saudi recipe across Hijri 1450-1500 at Makkah.
// fajr 18.5; isha = maghrib + 90 min, + 120 on the API's own Ramadan days;
// every non-sunrise column floor(raw + 1), sunrise floor(raw).
const fs = require('fs');
const path = require('path');
const L = require('./lib');

const ROOT = path.join(__dirname, '..');
const CAP = path.join(ROOT, 'captures');
const YEARS = [1450, 1460, 1470, 1480, 1490, 1500];
const LAT = 21.4225, LNG = 39.8262, ZONE = 3;

const fl = L.floorMin;

function loadYear(yh) {
  const raw = JSON.parse(fs.readFileSync(path.join(CAP, `sa-hijri-${yh}.json`), 'utf8'));
  const rows = raw.map((r) => ({
    date: r.date.slice(0, 10),
    hy: r.hijriDate.year, hm: r.hijriDate.month, hd: r.hijriDate.day,
    tab: r.prayerTimes,
  }));
  const inside = rows.filter((r) => r.hy === yh);
  const outside = rows.filter((r) => r.hy !== yh).map((r) => ({ date: r.date, hy: r.hy, hm: r.hm, hd: r.hd }));
  return { rows: inside, outside, raw: raw.length };
}

function predict(y, m, d, ramadan) {
  const p = L.paramsFor('sa');
  const A = L.A;
  const pt = new A.PrayerTimes(new A.Coordinates(LAT, LNG), new Date(y, m - 1, d), p);
  const out = {};
  for (const c of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib']) out[c] = fl(L.wallMinutes(pt[c], ZONE) + 1);
  out.sunrise = fl(L.wallMinutes(pt.sunrise, ZONE));
  const interval = ramadan ? 120 : 90;
  out.isha = out.maghrib + interval;
  return out;
}

function scoreRows(rows) {
  const out = {};
  let T = { n: 0, exact: 0, w1: 0, sum: 0, max: 0 };
  for (const c of L.COLS) out[c] = { n: 0, exact: 0, w1: 0, sum: 0, max: 0 };
  for (const r of rows) {
    const [y, m, d] = r.date.split('-').map(Number);
    const p = predict(y, m, d, r.hm === 9);
    for (const c of L.COLS) {
      const e = p[c] - L.tmin(r.tab[c]);
      const s = out[c];
      s.n++; if (e === 0) s.exact++; if (Math.abs(e) <= 1) s.w1++;
      s.sum += Math.abs(e); s.max = Math.max(s.max, Math.abs(e));
    }
  }
  const fin = {};
  for (const c of L.COLS) {
    const s = out[c];
    fin[c] = { exactPct: +(100 * s.exact / s.n).toFixed(1), w1Pct: +(100 * s.w1 / s.n).toFixed(1), mae: +(s.sum / s.n).toFixed(3), max: s.max };
    T.n += s.n; T.exact += s.exact; T.w1 += s.w1; T.sum += s.sum; T.max = Math.max(T.max, s.max);
  }
  T.exactPct = +(100 * T.exact / T.n).toFixed(1);
  T.w1Pct = +(100 * T.w1 / T.n).toFixed(1);
  T.mae = +(T.sum / T.n).toFixed(3);
  return { perColumn: fin, total: T };
}

const result = { job: 'SA Hijri 1450-1500', recipe: {}, years: {}, span: {}, ramadan: {} };
result.recipe = {
  source: 'umqserv.kacst.gov.sa GetPrayerHijriYear, one GET per Hijri year',
  coordinates: { lat: LAT, lng: LNG },
  clock: 'UTC+3 (zone=3)',
  fajr: '18.5 deg',
  isha: 'maghrib + 90 min; + 120 on the API’s own Ramadan days (hijri month 9)',
  offsets: { fajr: 1, sunrise: 0, dhuhr: 1, asr: 1, maghrib: 1, isha: 'inherits maghrib' },
  rounding: 'floor(raw + 1) single formulation; sunrise floor(raw)',
  highLat: 'MiddleOfTheNight',
  madhab: 'Shafi',
  engine: 'adhan-js 4.4.6 (Other 18.5/interval)',
};

const perYear = [];
for (const yh of YEARS) {
  const { rows, outside, raw } = loadYear(yh);
  const sc = scoreRows(rows);
  const interval = {};
  const byMonth = {};
  for (const r of rows) {
    const iv = (L.tmin(r.tab.isha) - L.tmin(r.tab.maghrib) + 1440) % 1440;
    interval[iv] = (interval[iv] || 0) + 1;
    (byMonth[r.hm] = byMonth[r.hm] || new Set()).add(iv);
  }
  const monthSet = {};
  for (const [m, s] of Object.entries(byMonth)) monthSet[m] = [...s].sort((a, b) => a - b).join('/');
  const ramadanDays = rows.filter((r) => r.hm === 9).length;
  const viol = Object.entries(monthSet).filter(([m, s]) => (Number(m) === 9 ? s !== '120' : s !== '90')).map(([m, s]) => ({ month: +m, intervals: s }));
  const first = rows.findIndex((r) => r.hm === 9);
  let switchRows = null;
  if (first > 0 && first + ramadanDays < rows.length) {
    switchRows = {
      on: [rows[first - 1], rows[first]].map((r) => ({ date: r.date, hm: r.hm, hd: r.hd, interval: (L.tmin(r.tab.isha) - L.tmin(r.tab.maghrib) + 1440) % 1440 })),
      off: [rows[first + ramadanDays - 1], rows[first + ramadanDays]].map((r) => ({ date: r.date, hm: r.hm, hd: r.hd, interval: (L.tmin(r.tab.isha) - L.tmin(r.tab.maghrib) + 1440) % 1440 })),
    };
  }
  const amp = {};
  for (const c of L.COLS) {
    const v = rows.map((r) => L.tmin(r.tab[c]));
    amp[c] = Math.max(...v) - Math.min(...v);
  }
  perYear.push({
    hijriYear: yh,
    rows: rows.length,
    rawRows: raw,
    boundaryRowsOutsideYear: outside,
    span: { from: rows[0].date, to: rows[rows.length - 1].date },
    score: sc,
    intervalHistogram: interval,
    intervalByHijriMonth: monthSet,
    ramadanDays,
    intervalViolations: viol,
    switchRows,
    amplitudeMin: amp,
  });
  result.years[yh] = perYear[perYear.length - 1];
}

const exacts = perYear.map((e) => e.score.total.exactPct);
const maes = perYear.map((e) => e.score.total.mae);
result.span.perYearExact = exacts;
result.span.perYearMae = maes;
result.span.exactSpread = +(Math.max(...exacts) - Math.min(...exacts)).toFixed(1);
result.span.maeSpread = +(Math.max(...maes) - Math.min(...maes)).toFixed(3);
result.span.intervalSets = [...new Set(perYear.flatMap((e) => Object.keys(e.intervalHistogram)))].sort((a, b) => a - b);
result.span.ramadanViolations = perYear.flatMap((e) => e.intervalViolations.map((v) => ({ hijriYear: e.hijriYear, ...v })));
result.span.heldOneRecipe = result.span.ramadanViolations.length === 0 && result.span.maeSpread <= 0.05;

result.ramadan = {
  rule: 'hijri month 9 => 120, every other month => 90, on the API’s own boundaries',
  daysPerYear: Object.fromEntries(perYear.map((e) => [e.hijriYear, e.ramadanDays])),
  intervalHistogramPerYear: Object.fromEntries(perYear.map((e) => [e.hijriYear, e.intervalHistogram])),
  violations: result.span.ramadanViolations.length,
  switchRows: Object.fromEntries(perYear.map((e) => [e.hijriYear, e.switchRows])),
  switchDayCheck: 'on = last day of Sha\u2019ban 90, first day of Ramadan 120; off = last day of Ramadan 120, first day of Shawwal 90',
};

fs.writeFileSync(path.join(ROOT, 'sa-deep.json'), JSON.stringify(result, null, 1));

for (const e of perYear) {
  console.log(`${e.hijriYear} rows=${e.rows} (raw ${e.rawRows}, outside ${e.boundaryRowsOutsideYear.length}) ${e.span.from}..${e.span.to} exact=${e.score.total.exactPct}% w1=${e.score.total.w1Pct}% mae=${e.score.total.mae} max=${e.score.total.max} ramadan=${e.ramadanDays} iv=${JSON.stringify(e.intervalHistogram)} viol=${e.intervalViolations.length}`);
}
console.log('per-column 1500:', JSON.stringify(result.years[1500].score.perColumn));
console.log('amplitude 1500:', JSON.stringify(result.years[1500].amplitudeMin));
console.log('span:', JSON.stringify({ exact: exacts, mae: maes, intervalSets: result.span.intervalSets, viol: result.span.ramadanViolations.length, held: result.span.heldOneRecipe }));
console.log('switch 1500:', JSON.stringify(result.years[1500].switchRows));
console.log('outside rows sample:', JSON.stringify(perYear.map((e) => [e.hijriYear, e.boundaryRowsOutsideYear])));
