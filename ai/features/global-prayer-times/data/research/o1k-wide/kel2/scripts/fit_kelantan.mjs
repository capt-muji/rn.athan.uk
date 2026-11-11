// Kelantan mufti zon 1 / zon 2: transcribe-then-fit at Kota Bharu.
// adhan 4.4.6, TZ pinned by the caller, no clock read anywhere.
import { readFileSync, writeFileSync } from 'node:fs';
import { loadAdhan, params, columns, sun, impliedDepression, tzOffsetMinutes, evalFixed, bestMargin, bestAngle, stats } from './lib.mjs';

const LAT = 6.12, LNG = 102.24, TZ = 'Asia/Kuala_Lumpur';
const KTN01_POINT = { lat: 6.1254, lng: 102.2381 };   // JAKIM Lampiran B, westernmost-point rule
const A = await loadAdhan();
const D = JSON.parse(readFileSync(new URL('../data/ktn-mufti-1441.json', import.meta.url), 'utf8'));

const MON = { jan: 1, feb: 2, mac: 3, apr: 4, mei: 5, jun: 6, jul: 7, julai: 7, ogos: 8, sep: 9, okt: 10, nov: 11, dis: 12 };
const COLS = ['subuh', 'syuruk', 'dhuha', 'zohor', 'asar', 'maghrib', 'isyak'];
const KEY = { subuh: 'fajr', syuruk: 'sunrise', zohor: 'dhuhr', asar: 'asr', maghrib: 'maghrib', isyak: 'isha' };

// Poster prints 12-hour times without a marker; only the four daytime columns precede noon.
function toMin(s, colIndex) {
  const [h, m] = s.split('.').map(Number);
  return (h % 12) * 60 + m + (colIndex >= 3 ? 720 : 0);
}

function rowsOf(month, zone) {
  return D.readings[month][zone].map((r) => {
    const [hijri, dateStr, weekday, ...times] = r;
    const [dd, mon] = dateStr.trim().split(/\s+/);
    const y = 2020, m = MON[mon.toLowerCase()], d = +dd;
    const min = times.map((t, i) => toMin(t, i));
    return { hijri, iso: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, y, m, d, min };
  });
}

// Local-minute columns from adhan at a point, for a list of rows, for one angle pair.
function calcColumns(point, rows, fajrAngle, ishaAngle, madhab = 'shafi') {
  const p = params(A, fajrAngle, ishaAngle, { madhab });
  const out = [];
  for (const r of rows) {
    const utc = new Date(Date.UTC(r.y, r.m - 1, r.d, 0));
    const c = columns(A, point, utc, p);
    const off = tzOffsetMinutes(TZ, new Date(Date.UTC(r.y, r.m - 1, r.d, 12)));
    out.push(Object.fromEntries(Object.entries(c).map(([k, v]) => [k, ((v / 60 + off) % 1440 + 1440) % 1440])));
  }
  return out;
}

const printedFor = (rows, col) => rows.map(r => r.min[COLS.indexOf(col)]);
const REPORT = { coordinate_fit: { lat: LAT, lng: LNG, tz: TZ }, ktn01_jakim_point: KTN01_POINT, months: {}, verdicts: {} };

function fitZone(month, zone, point) {
  const rows = rowsOf(month, zone);
  const base = calcColumns(point, rows, 18, 18);
  const pick = (calc, adhanKey) => calc.map(c => c[adhanKey]);
  const res = { n: rows.length, first: rows[0].iso, last: rows[rows.length - 1].iso, point };

  const fajrFit = bestAngle((a) => pick(calcColumns(point, rows, a, 18), 'fajr'), printedFor(rows, 'subuh'));
  const ishaFit = bestAngle((a) => pick(calcColumns(point, rows, 18, a), 'isha'), printedFor(rows, 'isyak'));
  res.fajr = fajrFit;
  res.isha = ishaFit;

  // Implied depression: the printed minute inverted against adhan's own solar position.
  const impF = [], impI = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const s = sun(A, point, new Date(Date.UTC(r.y, r.m - 1, r.d, 0)));
    const off = tzOffsetMinutes(TZ, new Date(Date.UTC(r.y, r.m - 1, r.d, 12)));
    const noon = s.transit * 60 + off;
    impF.push(impliedDepression(s, point.lat, (r.min[0] - noon) / 60));
    impI.push(impliedDepression(s, point.lat, (r.min[6] - noon) / 60));
  }
  res.implied = { fajr: stats(impF), isha: stats(impI) };

  const solar = {};
  for (const [col, adhanKey] of [['syuruk', 'sunrise'], ['zohor', 'dhuhr'], ['asar', 'asr'], ['maghrib', 'maghrib']]) {
    solar[col] = bestMargin(pick(base, adhanKey), printedFor(rows, col), { m0: -5, step: 0.5, jMax: 16 });
  }
  res.solar = solar;

  res.dhuha_gap = stats(rows.map(r => r.min[2] - r.min[1]));
  res.isha_gap = stats(rows.map(r => r.min[6] - r.min[5]));
  return res;
}

// Reproduce a printed table with a FIXED recipe (angles, margins, rounding) and score it.
function recipeScore(point, rows, recipe) {
  const calc = calcColumns(point, rows, recipe.fajrAngle, recipe.ishaAngle, recipe.madhab || 'shafi');
  const out = {};
  for (const col of COLS) {
    if (col === 'dhuha') continue;
    const key = KEY[col];
    const printed = printedFor(rows, col);
    out[col] = evalFixed(calc.map(c => c[key]), printed, recipe.margins[col] || 0, recipe.rounding[col] || 'nearest');
  }
  return out;
}

const JAKIM_ZON1 = {
  fajrAngle: 18, ishaAngle: 17, margins: { subuh: 2, syuruk: -1, zohor: 1.5, asar: 2, maghrib: 0, isyak: 2 },
  rounding: { subuh: 'ceil', syuruk: 'floor', zohor: 'nearest', asar: 'ceil', maghrib: 'ceil', isyak: 'ceil' },
};
const JAKIM_ZON1_ISHA18 = { ...JAKIM_ZON1, ishaAngle: 18 };

for (const month of ['zulkaedah', 'syawal']) {
  REPORT.months[month] = {};
  for (const zone of ['zon1', 'zon2']) {
    REPORT.months[month][zone] = fitZone(month, zone, { lat: LAT, lng: LNG });
  }
}

// The recipe test runs on the latest month (Zulkaedah) and is repeated on Syawal.
for (const month of ['zulkaedah', 'syawal']) {
  const rows1 = rowsOf(month, 'zon1'), rows2 = rowsOf(month, 'zon2');
  REPORT.months[month].recipe = {
    jakim_zon1_isha17_at_kb: recipeScore({ lat: LAT, lng: LNG }, rows1, JAKIM_ZON1),
    jakim_zon1_isha18_at_kb: recipeScore({ lat: LAT, lng: LNG }, rows1, JAKIM_ZON1_ISHA18),
    jakim_zon1_isha17_at_jakim_point: recipeScore(KTN01_POINT, rows1, JAKIM_ZON1),
    zon2_same_recipe_at_kb: recipeScore({ lat: LAT, lng: LNG }, rows2, JAKIM_ZON1),
  };
}

// Solve the zon 2 reference point implied by its sunrise/sunset pair.
function solvePoint(rows) {
  let best = null;
  for (let lat = 4.2; lat <= 6.4001; lat += 0.05) {
    for (let lng = 101.4; lng <= 102.5001; lng += 0.02) {
      const point = { lat: +lat.toFixed(2), lng: +lng.toFixed(2) };
      const calc = calcColumns(point, rows, 18, 18);
      const rs = bestMargin(calc.map(c => c.sunrise), printedFor(rows, 'syuruk'), { m0: -5, jMax: 16 });
      const rm = bestMargin(calc.map(c => c.maghrib), printedFor(rows, 'maghrib'), { m0: -5, jMax: 16 });
      const score = rs.mae + rm.mae;
      if (!best || score < best.score) best = { ...point, score: +score.toFixed(3), sunrise: rs, maghrib: rm };
    }
  }
  return best;
}

REPORT.point_solve = {};
for (const month of ['zulkaedah', 'syawal']) {
  REPORT.point_solve[month] = { zon1: solvePoint(rowsOf(month, 'zon1')), zon2: solvePoint(rowsOf(month, 'zon2')) };
}

// With each zone's own solved point, the printed subuh/isyak invert to a zone-local depth.
function impliedAt(point, rows) {
  const f = [], i = [];
  for (const r of rows) {
    const s = sun(A, point, new Date(Date.UTC(r.y, r.m - 1, r.d, 0)));
    const off = tzOffsetMinutes(TZ, new Date(Date.UTC(r.y, r.m - 1, r.d, 12)));
    const noon = s.transit * 60 + off;
    f.push(impliedDepression(s, point.lat, (r.min[0] - noon) / 60));
    i.push(impliedDepression(s, point.lat, (r.min[6] - noon) / 60));
  }
  return { fajr: stats(f), isha: stats(i) };
}
REPORT.implied_at_solved_point = {};
for (const month of ['zulkaedah', 'syawal']) {
  REPORT.implied_at_solved_point[month] = {};
  for (const zone of ['zon1', 'zon2']) {
    const p = REPORT.point_solve[month][zone];
    REPORT.implied_at_solved_point[month][zone] = impliedAt({ lat: p.lat, lng: p.lng }, rowsOf(month, zone));
  }
}

// Signed comparison against the emulated JAKIM recipe at its own declared point.
function signedDelta(point, rows, recipe) {
  const calc = calcColumns(point, rows, recipe.fajrAngle, recipe.ishaAngle, recipe.madhab || 'shafi');
  const out = {};
  for (const col of COLS) {
    if (col === 'dhuha') continue;
    const key = KEY[col];
    const printed = printedFor(rows, col);
    const d = printed.map((p, i) => p - (calc[i][key] + (recipe.margins[col] || 0)));
    out[col] = { mean: +(d.reduce((a, b) => a + b, 0) / d.length).toFixed(2), min: +Math.min(...d).toFixed(2), max: +Math.max(...d).toFixed(2) };
  }
  return out;
}
REPORT.jakim_signed_delta = {};
for (const month of ['zulkaedah', 'syawal']) {
  REPORT.jakim_signed_delta[month] = {
    zon1_isha17: signedDelta(KTN01_POINT, rowsOf(month, 'zon1'), JAKIM_ZON1),
    zon1_isha18: signedDelta(KTN01_POINT, rowsOf(month, 'zon1'), JAKIM_ZON1_ISHA18),
  };
}
REPORT.day_length = {};
for (const month of ['zulkaedah', 'syawal']) {
  REPORT.day_length[month] = {};
  for (const zone of ['zon1', 'zon2']) {
    const rows = rowsOf(month, zone);
    REPORT.day_length[month][zone] = stats(rows.map(r => r.min[5] - r.min[1]));
  }
  REPORT.day_length[month].delta_zon1_minus_zon2 = stats(
    rowsOf(month, 'zon1').map((r, i) => (r.min[5] - r.min[1]) - (rowsOf(month, 'zon2')[i].min[5] - rowsOf(month, 'zon2')[i].min[1])));
}

// Free fit of the twilight pair at each zone's own solved point.
REPORT.zon2_free_at_solved = {};
for (const month of ['zulkaedah', 'syawal']) {
  const pt = REPORT.point_solve[month].zon2;
  const rows = rowsOf(month, 'zon2');
  const at = { lat: pt.lat, lng: pt.lng };
  const calcAt = (fa, ia) => calcColumns(at, rows, fa, ia);
  REPORT.zon2_free_at_solved[month] = {
    point: at,
    fajr: bestAngle((a) => calcAt(a, 17).map(c => c.fajr), printedFor(rows, 'subuh')),
    isha: bestAngle((a) => calcAt(17, a).map(c => c.isha), printedFor(rows, 'isyak')),
    solar: Object.fromEntries([['syuruk', 'sunrise'], ['maghrib', 'maghrib'], ['zohor', 'dhuhr'], ['asar', 'asr']]
      .map(([col, key]) => [col, bestMargin(calcAt(18, 17).map(c => c[key]), printedFor(rows, col), { m0: -5, jMax: 16 })])),
    implied: impliedAt(at, rows),
  };
}

// --- verdicts -----------------------------------------------------------------
const z1 = REPORT.months.zulkaedah.zon1, z2 = REPORT.months.zulkaedah.zon2;
const r1 = REPORT.months.zulkaedah.recipe;

REPORT.verdicts = {
  zon1_is_jakim_recipe:
    r1.jakim_zon1_isha17_at_jakim_point.subuh.within1 === r1.jakim_zon1_isha17_at_jakim_point.subuh.n &&
    r1.jakim_zon1_isha17_at_jakim_point.isyak.within1 === r1.jakim_zon1_isha17_at_jakim_point.isyak.n,
  zon2_breaks_single_point_geometry:
    z2.solar.syuruk.mae + z2.solar.maghrib.mae > z1.solar.syuruk.mae + z1.solar.maghrib.mae + 1,
  zone_deltas: Object.fromEntries(COLS.map((col, i) => {
    const d = D.readings.zulkaedah.zon1.map((r, n) => toMin(r[3 + i], i) - toMin(D.readings.zulkaedah.zon2[n][3 + i], i));
    return [col, [...new Set(d)].sort((a, b) => a - b)];
  })),
};

writeFileSync(new URL('../kelantan.json', import.meta.url), JSON.stringify({ ...REPORT, transcription: D }, null, 1));

const f = (x) => `${x.angle !== undefined ? x.angle + ' deg ' : ''}margin ${x.margin} ${x.mode}: ${x.exact}/${x.n} exact, ${x.within1}/${x.n} within 1, MAE ${x.mae}`;
for (const month of ['zulkaedah', 'syawal']) {
  for (const zone of ['zon1', 'zon2']) {
    const z = REPORT.months[month][zone];
    console.log(`\n== ${month}/${zone} (n=${z.n})`);
    console.log('  fajr  ', f(z.fajr), '| implied', JSON.stringify(z.implied.fajr));
    console.log('  isha  ', f(z.isha), '| implied', JSON.stringify(z.implied.isha));
    for (const [k, v] of Object.entries(z.solar)) console.log(`  ${k.padEnd(8)}`, f(v));
    console.log('  dhuha-syuruk', JSON.stringify(z.dhuha_gap), 'isyak-maghrib', JSON.stringify(z.isha_gap));
  }
}
console.log('\n== JAKIM recipe residual (Zulkaedah zon1)');
for (const [name, sc] of Object.entries(REPORT.months.zulkaedah.recipe)) {
  console.log(' ', name, Object.entries(sc).map(([k, v]) => `${k}:${v.exact}/${v.n} MAE${v.mae}`).join(' '));
}
console.log('\n== point solve (sunrise+sunset, both margins free)');
for (const [month, zones] of Object.entries(REPORT.point_solve)) {
  for (const [zone, v] of Object.entries(zones)) {
    console.log(` ${month}/${zone}`, `lat ${v.lat} lng ${v.lng} score ${v.score}`,
      'sunrise', `${v.sunrise.margin}${v.sunrise.mode[0]} MAE${v.sunrise.mae}`,
      'maghrib', `${v.maghrib.margin}${v.maghrib.mode[0]} MAE${v.maghrib.mae}`);
  }
}
console.log('\n== implied depth at each zone\'s own solved point');
for (const [month, zones] of Object.entries(REPORT.implied_at_solved_point)) {
  for (const [zone, v] of Object.entries(zones)) console.log(` ${month}/${zone}`, 'fajr', JSON.stringify(v.fajr), 'isha', JSON.stringify(v.isha));
}
console.log('\n== signed delta, mufti minus emulated JAKIM at KTN01 point');
for (const [month, v] of Object.entries(REPORT.jakim_signed_delta)) {
  for (const [name, d] of Object.entries(v)) {
    console.log(` ${month} ${name}`, Object.entries(d).map(([k, x]) => `${k}:${x.mean >= 0 ? '+' : ''}${x.mean}[${x.min},${x.max}]`).join(' '));
  }
}
console.log('\n== day length (maghrib - syuruk)');
for (const [month, v] of Object.entries(REPORT.day_length)) console.log(` ${month}`, JSON.stringify(v));
console.log('\n== zon2 free fit at its own solved point');
for (const [month, v] of Object.entries(REPORT.zon2_free_at_solved)) {
  console.log(` ${month}`, JSON.stringify(v.point), 'fajr', f(v.fajr), '| isha', f(v.isha));
  console.log('   solar', Object.entries(v.solar).map(([k, x]) => `${k}:${x.margin}${x.mode[0]} ${x.exact}/${x.n} MAE${x.mae}`).join(' '));
  console.log('   implied', JSON.stringify(v.implied));
}
console.log('\nverdicts', JSON.stringify(REPORT.verdicts));
