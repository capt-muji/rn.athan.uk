// Job 3: the US mosque years. Dar al-Hijrah 2026 (dpt), six Masjidal mosques
// (3 years each, Antioch 2026 only), Toledo ICGT 2025 (DST-defective feed,
// shifted block excluded from the score and sized), San Antonio MCSA 2026.
// Verify 15/15 (FCNA) per year; report margins, rounding, asr school.
import fs from 'node:fs';
import { load, computeCols, chartOf, score, bestMargin, scanValue, line, parseMin, roundMin, r1 } from './lib.mjs';

const adhan = await load();
const H = process.env.HOME + '/athan-gitree/census/o1k-wide/';
const angles = [];
for (let a = 80; a <= 250; a++) angles.push(a / 10);
const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };

function fromMasjidal(path) {
  const raw = JSON.parse(fs.readFileSync(path)).data.salah;
  const dates = [], rows = [];
  for (const r of raw) {
    const m = /^([A-Za-z]+) (\d+), (\d+)$/.exec(r.date.replace(/^[A-Za-z]+,\s*/, ''));
    const mm = String(MONTHS[m[1]]).padStart(2, '0');
    const dd = String(+m[2]).padStart(2, '0');
    dates.push(`${m[3]}-${mm}-${dd}`);
    const t24 = (s) => {
      const t = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(s);
      let h = +t[1] % 12;
      if (/pm/i.test(t[3])) h += 12;
      return `${String(h).padStart(2, '0')}:${t[2]}`;
    };
    rows.push({ fajr: t24(r.fajr), sunrise: t24(r.sunrise), dhuhr: t24(r.zuhr), asr: t24(r.asr), maghrib: t24(r.maghrib), isha: t24(r.isha) });
  }
  return { dates, rows };
}
function fromDated(path, cols = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha']) {
  const raw = JSON.parse(fs.readFileSync(path));
  const dates = Object.keys(raw).sort();
  const rows = dates.map((d) => {
    const r = raw[d];
    const o = {};
    for (const c of cols) o[c === 'magrib' ? 'maghrib' : c] = r[c];
    return o;
  });
  return { dates, rows };
}

const MODES = ['nearest', 'floor', 'ceil'];
const out = {};

function fitSet(key, meta, data, opts = {}) {
  const { dates, rows } = data;
  const keep = opts.keep ? dates.map((d, i) => (opts.keep(d) ? i : -1)).filter((i) => i >= 0) : dates.map((_, i) => i);
  const chartAll = chartOf(rows, ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']);
  const chart = {};
  for (const c of Object.keys(chartAll)) chart[c] = keep.map((i) => chartAll[c][i]);
  const dts = keep.map((i) => dates[i]);
  const m15 = [-1, -0.5, 0, 0.5, 1, 1.5, -1.5];
  const perMode = {};
  for (const mode of MODES) {
    const fajr = scanValue(adhan, meta.coords, meta.tz, dts, chart.fajr, 'fajr', angles,
      (a) => ({ fajr: { kind: 'angle', v: a, after: false } }), { mode, marginBound: 1.5 });
    const geo = computeCols(adhan, meta.coords, meta.tz, dts, {
      fajr: { kind: 'angle', v: fajr.best.value, after: false },
      sunrise: { kind: 'sunrise' }, dhuhr: { kind: 'transit' },
      asr: { kind: 'asr', v: 'shafi' }, maghrib: { kind: 'sunset' },
    });
    const solar = {
      sunrise: bestMargin(geo.sunrise, chart.sunrise, { margins: m15, modes: [mode] }),
      dhuhr: bestMargin(geo.dhuhr, chart.dhuhr, { margins: m15, modes: [mode] }),
      maghrib: bestMargin(geo.maghrib, chart.maghrib, { margins: m15, modes: [mode] }),
    };
    const asrShafi = bestMargin(geo.asr, chart.asr, { margins: m15, modes: [mode] });
    const asrHanafi = bestMargin(computeCols(adhan, meta.coords, meta.tz, dts, { asr: { kind: 'asr', v: 'hanafi' } }).asr,
      chart.asr, { margins: m15, modes: [mode] });
    const ishaAngle = scanValue(adhan, meta.coords, meta.tz, dts, chart.isha, 'isha', angles,
      (a) => ({ isha: { kind: 'angle', v: a, after: true } }), { mode, marginBound: 1.5 });
    perMode[mode] = { fajr, solar, asrShafi, asrHanafi, ishaAngle };
  }
  const t = (x) => x.fajr.best.exact + x.solar.sunrise.exact + x.solar.dhuhr.exact + x.solar.maghrib.exact + x.asrShafi.exact + x.ishaAngle.best.exact;
  const chosen = MODES.map((m) => perMode[m]).sort((a, b) => t(b) - t(a) || Math.abs(a.fajr.best.margin) - Math.abs(b.fajr.best.margin))[0];
  const school = chosen.asrShafi.exact >= chosen.asrHanafi.exact ? 'Shafi' : 'Hanafi';
  const spec = {
    fajr: { kind: 'angle', v: chosen.fajr.best.value, after: false },
    sunrise: { kind: 'sunrise' }, dhuhr: { kind: 'transit' }, asr: { kind: 'asr', v: school.toLowerCase() },
    maghrib: { kind: 'sunset' }, isha: { kind: 'angle', v: chosen.ishaAngle.best.value, after: true },
  };
  const ser = computeCols(adhan, meta.coords, meta.tz, dts, spec);
  const margins = {
    fajr: chosen.fajr.best.margin, sunrise: chosen.solar.sunrise.margin, dhuhr: chosen.solar.dhuhr.margin,
    asr: school === 'Shafi' ? chosen.asrShafi.margin : chosen.asrHanafi.margin, maghrib: chosen.solar.maghrib.margin, isha: chosen.ishaAngle.best.margin,
  };
  const cols = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const colScore = {};
  let exact = 0, w1 = 0, worst = 0;
  for (const c of cols) {
    colScore[c] = score(ser[c], chart[c], margins[c], chosen.fajr.best.mode);
    exact += colScore[c].exact; w1 += colScore[c].within1; worst = Math.max(worst, colScore[c].worst);
  }
  // the 15/15 (FCNA) reading under the adopted rounding, full score objects
  const spec1515 = {
    fajr: { kind: 'angle', v: 15, after: false }, sunrise: { kind: 'sunrise' }, dhuhr: { kind: 'transit' },
    asr: { kind: 'asr', v: school.toLowerCase() },
    maghrib: { kind: 'sunset' }, isha: { kind: 'angle', v: 15, after: true },
  };
  const ser15 = computeCols(adhan, meta.coords, meta.tz, dts, spec1515);
  const s1515 = {
    fajr: bestMargin(ser15.fajr, chart.fajr, { margins: m15, modes: [chosen.fajr.best.mode] }),
    isha: bestMargin(ser15.isha, chart.isha, { margins: m15, modes: [chosen.ishaAngle.best.mode] }),
  };
  // seasonal wiggle of the fajr residual at exactly 15 deg, margin 0
  const wiggleBy = {};
  for (let i = 0; i < dts.length; i++) { const m = dts[i].slice(0, 7); (wiggleBy[m] ||= []).push(chart.fajr[i] - roundMin(ser15.fajr[i] / 60, chosen.fajr.best.mode)); }
  const wiggleMeans = Object.keys(wiggleBy).sort().map((m) => wiggleBy[m].reduce((a, x) => a + x, 0) / wiggleBy[m].length);
  const fajrWiggle15 = +(Math.max(...wiggleMeans) - Math.min(...wiggleMeans)).toFixed(2);
  const near15 = Math.abs(chosen.fajr.best.value - 15) <= 0.4 + 1e-9 && Math.abs(chosen.ishaAngle.best.value - 15) <= 0.4 + 1e-9;
  const ratio15 = (a, b) => (b.exact > 0 ? a.exact / b.exact : 0);
  const plateauHas15 = (p) => !!p && p.min - 1e-9 <= 15 && 15 <= p.max + 1e-9;
  const is15 = near15
    && ratio15(s1515.fajr, chosen.fajr.best) >= 0.85
    && ratio15(s1515.isha, chosen.ishaAngle.best) >= 0.85;
  const is15Strict = plateauHas15(chosen.fajr.plateau) && plateauHas15(chosen.ishaAngle.plateau);
  const rec = {
    ...meta, rows: dts.length, span: [dts[0], dts[dts.length - 1]],
    rounding: chosen.fajr.best.mode,
    fajrAngle: chosen.fajr.best.value, fajrPlateau: chosen.fajr.plateau, fajrMargin: margins.fajr,
    ishaAngle: chosen.ishaAngle.best.value, ishaPlateau: chosen.ishaAngle.plateau, ishaMargin: margins.isha,
    is15_15: is15,
    is15_15_strict: is15Strict,
    is15_15Rule: 'is15_15: best angles within 0.4 deg of 15 AND exact@15 >= 85% of best exact on both columns; is15_15_strict: the exact-max plateau contains 15.0 on both columns',
    at15_15: {
      fajr: { margin: s1515.fajr.margin, mode: s1515.fajr.mode, exact: s1515.fajr.exact, of: s1515.fajr.n, worst: s1515.fajr.worst },
      isha: { margin: s1515.isha.margin, mode: s1515.isha.mode, exact: s1515.isha.exact, of: s1515.isha.n, worst: s1515.isha.worst },
      bestFajrExact: chosen.fajr.best.exact, bestIshaExact: chosen.ishaAngle.best.exact,
      fajrWiggle15: fajrWiggle15,
      fajrMonthlyMeansAt15: wiggleMeans.map((x) => +x.toFixed(2)),
    },
    asrSchool: school,
    asrHanafiBest: { exact: chosen.asrHanafi.exact, of: chosen.asrHanafi.n, worst: chosen.asrHanafi.worst, margin: chosen.asrHanafi.margin },
    solarMargins: { sunrise: margins.sunrise, dhuhr: margins.dhuhr, maghrib: margins.maghrib },
    joint: { exact, within1: w1, worst, of: dts.length * 6 },
    perCol: Object.fromEntries(cols.map((c) => [c, { exact: colScore[c].exact, within1: colScore[c].within1, worst: colScore[c].worst }])),
  };
  out[key] = rec;
  console.log(`${key.padEnd(34)} ${String(dts.length).padStart(3)} rows  ${chosen.fajr.best.mode.padEnd(7)} fajr ${chosen.fajr.best.value.toFixed(1)} [${chosen.fajr.plateau ? chosen.fajr.plateau.min + '..' + chosen.fajr.plateau.max : '-'}] isha ${chosen.ishaAngle.best.value.toFixed(1)} [${chosen.ishaAngle.plateau ? chosen.ishaAngle.plateau.min + '..' + chosen.ishaAngle.plateau.max : '-'}] asr ${school}  15/15: ${is15 ? 'YES' : 'NO'} (fajr@15 ${s1515.fajr.exact}/${s1515.fajr.n}@${s1515.fajr.margin} best ${chosen.fajr.best.exact}, isha@15 ${s1515.isha.exact}/${s1515.isha.n}@${s1515.isha.margin} best ${chosen.ishaAngle.best.exact})  joint exact ${exact}/${dts.length * 6} within1 ${w1} worst ${worst}`);
  return rec;
}

// --- Dar al-Hijrah ---
fitSet('dar-al-hijrah-2026', { mosque: 'Dar Al-Hijrah', city: 'Falls Church VA', source: 'hijrah.org dpt year feed', coords: { lat: 38.8823, lon: -77.1711 }, tz: 'America/New_York', file: 'americas/data/us_daralhijrah_falls_church_va_2026.json' }, fromDated(H + 'americas/data/us_daralhijrah_falls_church_va_2026.json'));

// --- six Masjidal mosques ---
const MASJIDAL = [
  { key: 'memphis-1QL0gbKZ', id: '1QL0gbKZ', mosque: 'Memphis Islamic Center', city: 'Cordova TN', coords: { lat: 35.1580, lon: -89.7820 }, tz: 'America/Chicago', years: [2026, 2025, 2024] },
  { key: 'richmond-keLQn7AM', id: 'keLQn7AM', mosque: 'Richmond Islamic Community Center', city: 'Richmond TX', coords: { lat: 29.5900, lon: -95.7300 }, tz: 'America/Chicago', years: [2026, 2025, 2024] },
  { key: 'southbay-XEdoEvL7', id: 'XEdoEvL7', mosque: 'Islamic Center of South Bay', city: 'Lomita CA', coords: { lat: 33.7880, lon: -118.3160 }, tz: 'America/Los_Angeles', years: [2026, 2025, 2024] },
  { key: 'livonia-nL1JggAa', id: 'nL1JggAa', mosque: 'MAS Tarbiyah Center', city: 'Livonia MI', coords: { lat: 42.3700, lon: -83.3600 }, tz: 'America/Detroit', years: [2026, 2025, 2024] },
  { key: 'queens-z0AW66Lj', id: 'z0AW66Lj', mosque: 'Jamaica Muslim Center', city: 'Queens NY', coords: { lat: 40.7000, lon: -73.7900 }, tz: 'America/New_York', years: [2026, 2025, 2024] },
  { key: 'antioch-rdRvm3dG', id: 'rdRvm3dG', mosque: 'Islamic Center of Tennessee', city: 'Antioch TN', coords: { lat: 36.0660, lon: -86.6630 }, tz: 'America/Chicago', years: [2026] },
];
for (const m of MASJIDAL) {
  for (const y of m.years) {
    const p = `${H}americas2/captures/masjidal_${m.id}_${y}.json`;
    if (!fs.existsSync(p)) { console.log(`MISSING capture ${p}`); continue; }
    fitSet(`${m.key}-${y}`, { mosque: m.mosque, city: m.city, masjidalId: m.id, coords: m.coords, tz: m.tz, file: `americas2/captures/masjidal_${m.id}_${y}.json` }, fromMasjidal(p));
  }
}

// --- Toledo ICGT 2025, DST-defective ---
{
  const meta = { mosque: 'Islamic Center of Greater Toledo', city: 'Toledo OH', source: 'icgt.org dpt year feed (2025)', coords: { lat: 41.6770, lon: -83.6990 }, tz: 'America/New_York', file: 'americas2/data/us_icgt_toledo.json' };
  const data = fromDated(H + 'americas2/data/us_icgt_toledo.json');
  const inBlock = (d) => d >= '2025-03-09' && d <= '2025-11-01';
  const rec = fitSet('toledo-icgt-2025-clean', meta, data, { keep: (d) => !inBlock(d) });
  // size and characterise the defective block: printed vs computed (standard time + 60)
  const dates = data.dates;
  const block = dates.map((d, i) => (inBlock(d) ? i : -1)).filter((i) => i >= 0);
  const chartAll = chartOf(data.rows, ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']);
  const dts = block.map((i) => dates[i]);
  const ser = computeCols(adhan, meta.coords, meta.tz, dts, {
    fajr: { kind: 'angle', v: 15, after: false }, sunrise: { kind: 'sunrise' }, dhuhr: { kind: 'transit' },
    asr: { kind: 'asr', v: 'shafi' }, maghrib: { kind: 'sunset' }, isha: { kind: 'angle', v: 15, after: true },
  });
  const meanBias = {};
  for (const c of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    const bs = [];
    for (let i = 0; i < dts.length; i++) bs.push(chartAll[c][block[i]] - ser[c][i] / 60);
    meanBias[c] = { mean: +(bs.reduce((a, x) => a + x, 0) / bs.length).toFixed(1), min: +Math.min(...bs).toFixed(0), max: +Math.max(...bs).toFixed(0) };
  }
  const withShift = {};
  for (const c of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    // printed sits one hour early on standard time: repairing the PRINT means
    // comparing chart+60 against computed, i.e. margin -60 on the series
    const s = score(ser[c], block.map((i) => chartAll[c][i]), -60, 'nearest');
    withShift[c] = { exact: s.exact, of: s.n, worst: s.worst };
  }
  const sunShift = score(ser.sunrise, block.map((i) => chartAll.sunrise[i]), 0, 'nearest');
  // exceptions inside the block: fajr unshifted days, sunrise shifted days
  const fajrUnshifted = [];
  const sunriseShifted = [];
  const r60 = (sec) => Math.round(sec / 60);
  for (let i = 0; i < dts.length; i++) {
    const bf = chartAll.fajr[block[i]] - r60(ser.fajr[i]);
    const bs = chartAll.sunrise[block[i]] - r60(ser.sunrise[i]);
    if (bf > -30) fajrUnshifted.push(dts[i]);
    if (bs < -30) sunriseShifted.push(dts[i]);
  }
  rec.dstBlock = {
    window: '2025-03-09..2025-11-01', rows: block.length, of: dates.length,
    meanBiasMin: meanBias,
    fiveColsRepairedByShift60: Object.fromEntries(Object.entries(withShift).map(([k, v]) => [k, v.exact + '/' + v.of + ' worst ' + v.worst])),
    sunriseUnshifted: `${sunShift.exact}/${sunShift.n} worst ${sunShift.worst}`,
    fajrUnshiftedDays: { count: fajrUnshifted.length, dates: fajrUnshifted },
    sunriseShiftedDays: { count: sunriseShifted.length, dates: sunriseShifted },
    reading: 'the prayer columns print on standard time through the DST window (repair +60 on the print); fajr alone flips to wall time for May 2025 plus 2025-07-01/10-03/10-04, and sunrise alone prints standard time on 2025-11-01',
  };
  out['toledo-icgt-2025-dst-block'] = rec.dstBlock;
  console.log(`  toledo dst block: ${block.length}/${dates.length} rows (${dts[0]}..${dts[dts.length - 1]}), bias min/mean/max ${Object.entries(meanBias).map(([c, b]) => `${c} ${b.min}/${b.mean}/${b.max}`).join(', ')}`);
  console.log(`  +60 repair on the five cols: ${JSON.stringify(withShift)}; sunrise at 0: ${sunShift.exact}/${sunShift.n}`);
}

// --- San Antonio: four DST-transition-day asr cells carry the wrong-side time ---
{
  const meta = { mosque: 'Muslim Center of San Antonio', city: 'San Antonio TX', source: 'mcsamasjid.com dpt year feed', coords: { lat: 29.4430, lon: -98.4860 }, tz: 'America/Chicago', file: 'americas2/data/us_mcsamasjid_san_antonio.json' };
  const data = fromDated(H + 'americas2/data/us_mcsamasjid_san_antonio.json');
  const DEFECT = ['2026-03-08', '2026-03-09', '2026-11-01', '2026-11-02'];
  const rec = fitSet('san-antonio-mcsa-2026-clean', meta, data, { keep: (d) => !DEFECT.includes(d) });
  rec.defectDays = {
    dates: DEFECT,
    reading: 'the asr cell on the two DST-transition weekends carries the wrong-side value (16:07 on Mar 8-9 = pre-shift, 16:24 on Nov 1-2 = post-shift); excluded here, 4 of 365 rows',
  };
  out['san-antonio-mcsa-2026-asr-defect'] = rec.defectDays;
}

fs.writeFileSync('job3-us.json', JSON.stringify(out, null, 1));
console.log('wrote job3-us.json');
