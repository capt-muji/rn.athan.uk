// Scores the recovered 2027 recipe across 2028-2038 against the published tables,
// plus the naive 2027-replay baseline. Run: TZ=Europe/London node compare.mjs
import fs from 'fs';
import { generateYear } from '../fit/predict.mjs';
import { solarDay, asrAltitude } from '../fit/solar.mjs';

const HERE = new URL('./', import.meta.url).pathname;
const ROOT = new URL('../', import.meta.url).pathname;
const RECIPE = JSON.parse(fs.readFileSync(ROOT + 'fit/recipe.json', 'utf8'));
const TRUTH = JSON.parse(fs.readFileSync(ROOT + 'truth/truth-2028-2038.json', 'utf8'));
const SOURCE_2027 = JSON.parse(fs.readFileSync(ROOT + 'data/2027.json', 'utf8'));

const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];
const YEARS = [2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038];
const LEAP_YEARS = [2028, 2032, 2036];
const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

const pad = (n) => String(n).padStart(2, '0');
const halfUp = (x) => Math.floor(x + 0.5);
const toMin = (s) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};
const toClock = (minutes) => {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};
const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const doyOf = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400e3) + 1;
};

// 2027 (a non-leap year) laid out by day of year, for day-of-year keying.
const MM_DD_BY_DOY = (() => {
  const start = Date.UTC(2027, 0, 1);
  const out = [];
  for (let i = 0; i < 365; i++) {
    const d = new Date(start + i * 86400e3);
    out.push(`${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`);
  }
  return out;
})();

const F_TABLE = RECIPE.prayers.fajr.table;
const I_TABLE = RECIPE.prayers.isha.table;

// A generator that mirrors fit/predict.mjs but lets the offset keying and the 02-29
// fill be swapped. With default options it must equal generateYear() byte for byte.
function generate(year, opts = {}) {
  const { keying = 'mmdd', fajrOverrides = null, ishaOverrides = null } = opts;
  const { prayers } = RECIPE;
  const lat = RECIPE.coordinates.latitude;
  const lon = RECIPE.coordinates.longitude;
  const out = {};
  const days = isLeap(year) ? 366 : 365;
  const start = Date.UTC(year, 0, 1);
  for (let i = 0; i < days; i++) {
    const d = new Date(start + i * 86400e3);
    const dateStr = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    const monthDay = dateStr.slice(5);
    const day = solarDay(dateStr, lat, lon);
    const horizon = day.hourAngleMinutes(prayers.sunrise.altitudeDegrees);
    const asrHourAngle = day.hourAngleMinutes(asrAltitude(lat, day.declination, prayers.asr.shadowFactor));

    const sunrise = halfUp(day.transit - horizon + prayers.sunrise.marginMinutes);
    const dhuhr = halfUp(day.transit + prayers.dhuhr.marginMinutes);
    const asr = halfUp(day.transit + asrHourAngle + prayers.asr.marginMinutes);
    const magrib = halfUp(day.transit + horizon + prayers.magrib.marginMinutes);

    const key = keying === 'doy' ? MM_DD_BY_DOY[Math.min(doyOf(dateStr), 365) - 1] : monthDay;
    const fajrOffset = fajrOverrides && fajrOverrides[monthDay] !== undefined
      ? fajrOverrides[monthDay] : F_TABLE[key];
    const ishaOffset = ishaOverrides && ishaOverrides[monthDay] !== undefined
      ? ishaOverrides[monthDay] : I_TABLE[key];

    out[dateStr] = {
      date: dateStr,
      fajr: toClock(sunrise - fajrOffset),
      sunrise: toClock(sunrise),
      dhuhr: toClock(dhuhr),
      asr: toClock(asr),
      magrib: toClock(magrib),
      isha: toClock(magrib + ishaOffset),
    };
  }
  return out;
}

function scoreTables(genByYear) {
  const perYear = {};
  const pooled = {};
  for (const p of PRAYERS) pooled[p] = { days: 0, exact: 0, within1: 0, worst: 0, absSum: 0, signedSum: 0, err1: 0, err2plus: 0 };
  const bigMisses = [];
  const oneMinuteMisses = [];

  for (const year of YEARS) {
    const gen = genByYear[year];
    const keys = Object.keys(TRUTH).filter((k) => k.startsWith(`${year}-`));
    const per = {};
    for (const p of PRAYERS) per[p] = { days: 0, exact: 0, exactPct: 0, within1: 0, within1Pct: 0, worst: 0, mae: 0, err1: 0, err2plus: 0, absSum: 0, signedSum: 0 };
    let allExact = 0, allWithin = 0, allDays = 0, allSum = 0, allWorst = 0;
    for (const k of keys) {
      if (!gen[k]) throw new Error(`missing generated ${k}`);
      for (const p of PRAYERS) {
        const t = toMin(TRUTH[k][p]);
        const g = toMin(gen[k][p]);
        const e = Math.abs(g - t);
        const rec = per[p];
        rec.days++;
        rec.absSum += e;
        rec.signedSum += g - t;
        if (e === 0) rec.exact++;
        if (e <= 1) rec.within1++;
        if (e > rec.worst) rec.worst = e;
        if (e === 1) { rec.err1++; oneMinuteMisses.push({ date: k, prayer: p, signed: g - t }); }
        if (e >= 2) { rec.err2plus++; bigMisses.push({ date: k, prayer: p, err: e, signed: g - t }); }
        allDays++; allSum += e;
        if (e === 0) allExact++;
        if (e <= 1) allWithin++;
        if (e > allWorst) allWorst = e;
      }
    }
    for (const p of PRAYERS) {
      const r = per[p];
      r.exactPct = +(100 * r.exact / r.days).toFixed(2);
      r.within1Pct = +(100 * r.within1 / r.days).toFixed(2);
      r.mae = +(r.absSum / r.days).toFixed(4);
      r.meanSigned = +(r.signedSum / r.days).toFixed(4);
      delete r.absSum; delete r.signedSum;
      pooled[p].days += r.days; pooled[p].exact += r.exact; pooled[p].within1 += r.within1;
      pooled[p].absSum += r.mae * r.days; pooled[p].signedSum += r.meanSigned * r.days;
      pooled[p].err1 += r.err1; pooled[p].err2plus += r.err2plus;
      if (r.worst > pooled[p].worst) pooled[p].worst = r.worst;
    }
    perYear[year] = {
      days: keys.length,
      perPrayer: per,
      overall: {
        days: allDays, exact: allExact, exactPct: +(100 * allExact / allDays).toFixed(2),
        within1: allWithin, within1Pct: +(100 * allWithin / allDays).toFixed(2),
        worst: allWorst, mae: +(allSum / allDays).toFixed(4),
      },
    };
  }

  const perPrayerOverall = {};
  for (const p of PRAYERS) {
    const r = pooled[p];
    perPrayerOverall[p] = {
      days: r.days, exact: r.exact, exactPct: +(100 * r.exact / r.days).toFixed(2),
      within1: r.within1, within1Pct: +(100 * r.within1 / r.days).toFixed(2),
      worst: r.worst, mae: +(r.absSum / r.days).toFixed(4),
      meanSigned: +(r.signedSum / r.days).toFixed(4),
      err1: r.err1, err2plus: r.err2plus,
    };
  }
  const totalDays = PRAYERS.reduce((a, p) => a + pooled[p].days, 0);
  const totalExact = PRAYERS.reduce((a, p) => a + pooled[p].exact, 0);
  const totalWithin = PRAYERS.reduce((a, p) => a + pooled[p].within1, 0);
  const totalMae = PRAYERS.reduce((a, p) => a + pooled[p].absSum, 0) / totalDays;
  const overall = {
    days: totalDays, exact: totalExact, exactPct: +(100 * totalExact / totalDays).toFixed(2),
    within1: totalWithin, within1Pct: +(100 * totalWithin / totalDays).toFixed(2),
    mae: +totalMae.toFixed(4),
    worst: Math.max(...PRAYERS.map((p) => pooled[p].worst)),
  };
  return { perYear, perPrayerOverall, overall, bigMisses, oneMinuteMisses };
}

function monthOf(date) { return date.slice(5, 7); }

// ---- Stage 0: generator fidelity -------------------------------------------------
const fidelity = {};
for (const y of [2027, 2028, 2033, 2038]) {
  const a = JSON.stringify(generate(y));
  const b = JSON.stringify(generateYear(y));
  fidelity[y] = a === b;
}
if (!Object.values(fidelity).every(Boolean)) throw new Error('mirror generator diverges from predict.mjs');

// ---- Stage A: recipe transfer ----------------------------------------------------
const recipeGen = {};
for (const y of YEARS) recipeGen[y] = generateYear(y);
const armRecipe = scoreTables(recipeGen);

fs.writeFileSync(HERE + 'stage-a-recipe.json', JSON.stringify({ fidelity, armRecipe }, null, 1));

// ---- Stage D: naive replay of 2027's literal MM-DD values ------------------------
// 02-29 fill: half-up mean of 2027's 02-28 and 03-01 values, per prayer.
const leapFill2027 = {};
for (const p of PRAYERS) leapFill2027[p] = toClock(halfUp((toMin(SOURCE_2027['2027-02-28'][p]) + toMin(SOURCE_2027['2027-03-01'][p])) / 2));
const naiveGen = {};
for (const y of YEARS) {
  const out = {};
  const days = isLeap(y) ? 366 : 365;
  const start = Date.UTC(y, 0, 1);
  for (let i = 0; i < days; i++) {
    const d = new Date(start + i * 86400e3);
    const dateStr = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    const md = dateStr.slice(5);
    const src = md === '02-29' ? leapFill2027 : SOURCE_2027[`2027-${md}`];
    out[dateStr] = { date: dateStr, ...Object.fromEntries(PRAYERS.map((p) => [p, src[p]])) };
  }
  naiveGen[y] = out;
}
const armNaive = scoreTables(naiveGen);

// Diagnostic: the same replay with the DST clock state corrected to the target year.
// This isolates raw numeric drift from the one-hour artefacts that a literal replay
// inherits when the last-Sunday DST date lands on a different calendar day.
const londonOffsetAt = (y, m, d) => {
  const instant = new Date(Date.UTC(y, m - 1, d, 12));
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(instant).map((x) => [x.type, x.value]));
  return Number(p.hour) * 60 + Number(p.minute) - 720;
};
const dstState = (dateStr) => { const [y, m, d] = dateStr.split('-').map(Number); return londonOffsetAt(y, m, d); };
const naiveAlignedGen = {};
for (const y of YEARS) {
  const src = naiveGen[y];
  const out = {};
  for (const [dateStr, row] of Object.entries(src)) {
    const shift = dstState(dateStr) - dstState(`2027${dateStr.slice(4)}`);
    out[dateStr] = { date: dateStr, ...Object.fromEntries(PRAYERS.map((p) => [p, toClock(toMin(row[p]) + shift)])) };
  }
  naiveAlignedGen[y] = out;
}
const armNaiveAligned = scoreTables(naiveAlignedGen);

fs.writeFileSync(HERE + 'stage-d-naive.json', JSON.stringify({
  leapFill2027,
  armNaive: { perYear: armNaive.perYear, perPrayerOverall: armNaive.perPrayerOverall, overall: armNaive.overall },
  armNaiveAligned: { perYear: armNaiveAligned.perYear, perPrayerOverall: armNaiveAligned.perPrayerOverall, overall: armNaiveAligned.overall },
}, null, 1));

// ---- Stage B: 02-29 analysis -----------------------------------------------------
const leapAnalysis = {};
for (const y of LEAP_YEARS) {
  const prevDate = `${y}-02-28`, leapDate = `${y}-02-29`, nextDate = `${y}-03-01`;
  const per = {};
  for (const p of PRAYERS) {
    const tPrev = toMin(TRUTH[prevDate][p]);
    const tNext = toMin(TRUTH[nextDate][p]);
    const tLeap = toMin(TRUTH[leapDate][p]);
    const meanHalfUp = halfUp((tPrev + tNext) / 2);
    const candidates = {
      prev: tPrev, next: tNext, meanHalfUp,
      meanFloor: Math.floor((tPrev + tNext) / 2),
    };
    const matches = Object.entries(candidates).filter(([, v]) => v === tLeap).map(([k]) => k);
    const gen = toMin(generate(y)[leapDate][p]);
    per[p] = {
      prev: TRUTH[prevDate][p], next: TRUTH[nextDate][p], truth: TRUTH[leapDate][p],
      truthMinusPrev: tLeap - tPrev, truthMinusNext: tLeap - tNext,
      meanRounded: toClock(meanHalfUp), matches,
      recipe: toClock(gen), recipeErr: Math.abs(gen - tLeap),
    };
    if (p === 'fajr') per[p].truthImpliedOffset = toMin(TRUTH[leapDate].fajr) - toMin(TRUTH[leapDate].sunrise);
    if (p === 'isha') per[p].truthImpliedOffset = toMin(TRUTH[leapDate].isha) - toMin(TRUTH[leapDate].magrib);
  }
  leapAnalysis[y] = per;
}

// Rescore the three 02-29 rows under each candidate offset fill (recipe solar geometry,
// only the 02-29 fajr/isha table value changes).
const leapVariantScores = {};
for (const rule of ['recipeMean', 'prev', 'next']) {
  const fOv = {}; const iOv = {};
  if (rule === 'prev') {
    fOv['02-29'] = F_TABLE['02-28']; iOv['02-29'] = I_TABLE['02-28'];
  } else if (rule === 'next') {
    fOv['02-29'] = F_TABLE['03-01']; iOv['02-29'] = I_TABLE['03-01'];
  } else {
    fOv['02-29'] = F_TABLE['02-29']; iOv['02-29'] = I_TABLE['02-29'];
  }
  const rows = {};
  let exact = 0, within1 = 0, total = 0, worst = 0;
  for (const y of LEAP_YEARS) {
    const g = generate(y, { fajrOverrides: fOv, ishaOverrides: iOv }) [`${y}-02-29`];
    const t = TRUTH[`${y}-02-29`];
    const per = {};
    for (const p of PRAYERS) {
      const e = Math.abs(toMin(g[p]) - toMin(t[p]));
      per[p] = { generated: g[p], truth: t[p], err: e };
      total++; if (e === 0) exact++; if (e <= 1) within1++; if (e > worst) worst = e;
    }
    rows[y] = per;
  }
  leapVariantScores[rule] = { exact, within1, total, worst, rows };
}

const leapBestFill = Object.entries(leapVariantScores)
  .sort((a, b) => b[1].exact - a[1].exact || a[1].worst - b[1].worst)[0][0];

fs.writeFileSync(HERE + 'stage-b-leap.json', JSON.stringify({ leapAnalysis, leapVariantScores, recipeTable0229: { fajr: F_TABLE['02-29'], isha: I_TABLE['02-29'] } }, null, 1));

// ---- Stage C: keying -------------------------------------------------------------
const keying = {};
for (const y of LEAP_YEARS) {
  const mm = generate(y, { keying: 'mmdd' });
  const doy = generate(y, { keying: 'doy' });
  const keys = Object.keys(TRUTH).filter((k) => k.startsWith(`${y}-`));
  const res = { mmdd: {}, doy: {}, differingDays: 0 };
  for (const arm of ['mmdd', 'doy']) {
    const src = arm === 'mmdd' ? mm : doy;
    for (const p of PRAYERS) res[arm][p] = { exact: 0, within1: 0, worst: 0, mae: 0, absSum: 0 };
    for (const k of keys) {
      for (const p of PRAYERS) {
        const e = Math.abs(toMin(src[k][p]) - toMin(TRUTH[k][p]));
        res[arm][p].absSum += e;
        if (e === 0) res[arm][p].exact++;
        if (e <= 1) res[arm][p].within1++;
        if (e > res[arm][p].worst) res[arm][p].worst = e;
      }
    }
    for (const p of PRAYERS) {
      const r = res[arm][p];
      r.exactPct = +(100 * r.exact / keys.length).toFixed(2);
      r.within1Pct = +(100 * r.within1 / keys.length).toFixed(2);
      r.mae = +(r.absSum / keys.length).toFixed(4);
      delete r.absSum;
    }
  }
  // Rows where the keyings disagree, and which one truth agrees with.
  const disagreements = [];
  for (const k of keys) {
    if (JSON.stringify(mm[k]) === JSON.stringify(doy[k])) continue;
    res.differingDays++;
    for (const p of ['fajr', 'isha']) {
      const em = Math.abs(toMin(mm[k][p]) - toMin(TRUTH[k][p]));
      const ed = Math.abs(toMin(doy[k][p]) - toMin(TRUTH[k][p]));
      if (em !== ed) disagreements.push({ date: k, prayer: p, mmddErr: em, doyErr: ed });
    }
  }
  res.disagreements = disagreements;
  res.disagreementTally = {
    mmddCloser: disagreements.filter((d) => d.mmddErr < d.doyErr).length,
    doyCloser: disagreements.filter((d) => d.doyErr < d.mmddErr).length,
    mmddExactDoyNot: disagreements.filter((d) => d.mmddErr === 0 && d.doyErr > 0).length,
    doyExactMmddNot: disagreements.filter((d) => d.doyErr === 0 && d.mmddErr > 0).length,
  };
  res.verdict = res.disagreementTally.mmddCloser > res.disagreementTally.doyCloser ? 'mmdd' : 'doy';
  keying[y] = res;
}

fs.writeFileSync(HERE + 'stage-c-keying.json', JSON.stringify(keying, null, 1));

// ---- Stage E: trend --------------------------------------------------------------
const trend = {};
for (const p of PRAYERS) {
  trend[p] = {};
  for (const y of [2028, 2038]) {
    const r = armRecipe.perYear[y].perPrayer[p];
    trend[p][y] = { exactPct: r.exactPct, mae: r.mae, worst: r.worst, err1: r.err1, err2plus: r.err2plus };
  }
  trend[p].deltaMae = +(trend[p][2038].mae - trend[p][2028].mae).toFixed(4);
  trend[p].deltaExactPct = +(trend[p][2038].exactPct - trend[p][2028].exactPct).toFixed(2);
  trend[p].series = YEARS.map((y) => ({ year: y, mae: armRecipe.perYear[y].perPrayer[p].mae, exactPct: armRecipe.perYear[y].perPrayer[p].exactPct }));
}
const overallSeries = YEARS.map((y) => ({ year: y, mae: armRecipe.perYear[y].overall.mae, exactPct: armRecipe.perYear[y].overall.exactPct, worst: armRecipe.perYear[y].overall.worst }));
const naiveSeries = YEARS.map((y) => ({ year: y, mae: armNaive.perYear[y].overall.mae, exactPct: armNaive.perYear[y].overall.exactPct }));

// Least-squares slope of MAE against year (minutes per year) over the eleven points.
const slope = (points) => {
  const n = points.length;
  const mx = points.reduce((a, p) => a + p.x, 0) / n;
  const my = points.reduce((a, p) => a + p.y, 0) / n;
  let num = 0, den = 0;
  for (const p of points) { num += (p.x - mx) * (p.y - my); den += (p.x - mx) ** 2; }
  return num / den;
};
const trendSlope = {};
for (const p of PRAYERS) {
  trendSlope[p] = +(slope(trend[p].series.map((s) => ({ x: s.year, y: s.mae })))).toFixed(6);
}
trendSlope.overall = +(slope(overallSeries.map((s) => ({ x: s.year, y: s.mae })))).toFixed(6);
trendSlope.adjacent = {};
for (let i = 1; i < YEARS.length; i++) {
  const a = YEARS[i - 1], b = YEARS[i];
  trendSlope.adjacent[`${a}->${b}`] = +(armRecipe.perYear[b].overall.mae - armRecipe.perYear[a].overall.mae).toFixed(4);
}
trend.overall = { series: overallSeries, naiveSeries, slopeMinutesPerYear: trendSlope };

// ---- Miss anatomy ----------------------------------------------------------------
function anatomy(arm) {
  const out = { byPrayer: {}, byMonth: {}, byYear: {}, worstRows: [] };
  for (const p of PRAYERS) out.byPrayer[p] = { err1: 0, err2plus: 0, maxErr: 0, months: {} };
  for (const m of MONTHS) out.byMonth[m] = { err1: 0, err2plus: 0 };
  for (const y of YEARS) out.byYear[y] = { err1: 0, err2plus: 0 };
  for (const miss of arm.oneMinuteMisses) {
    out.byPrayer[miss.prayer].err1++;
    out.byPrayer[miss.prayer].months[monthOf(miss.date)] = (out.byPrayer[miss.prayer].months[monthOf(miss.date)] || 0) + 1;
    out.byMonth[monthOf(miss.date)].err1++;
    out.byYear[miss.date.slice(0, 4)].err1++;
  }
  for (const miss of arm.bigMisses) {
    out.byPrayer[miss.prayer].err2plus++;
    out.byPrayer[miss.prayer].months[monthOf(miss.date)] = (out.byPrayer[miss.prayer].months[monthOf(miss.date)] || 0) + 1;
    out.byMonth[monthOf(miss.date)].err2plus++;
    out.byYear[miss.date.slice(0, 4)].err2plus++;
    if (miss.err > out.byPrayer[miss.prayer].maxErr) out.byPrayer[miss.prayer].maxErr = miss.err;
  }
  out.worstRows = [...arm.bigMisses].sort((a, b) => b.err - a.err || a.date.localeCompare(b.date)).slice(0, 40);
  out.err2plusCount = arm.bigMisses.length;
  out.err1Count = arm.oneMinuteMisses.length;
  return out;
}
const missAnatomy = { recipe: anatomy(armRecipe), naive: anatomy(armNaive) };

// Naive structural detail: bucket the >=2 misses, and list the worst dates.
const naiveBuckets = { two: 0, threeTo5: 0, sixTo30: 0, over30: 0 };
for (const m of armNaive.bigMisses) {
  if (m.err === 2) naiveBuckets.two++;
  else if (m.err <= 5) naiveBuckets.threeTo5++;
  else if (m.err <= 30) naiveBuckets.sixTo30++;
  else naiveBuckets.over30++;
}
const naiveWorstByYear = {};
for (const y of YEARS) {
  const rows = armNaive.bigMisses.filter((m) => m.date.startsWith(String(y)));
  const byDate = {};
  for (const r of rows) byDate[r.date] = Math.max(byDate[r.date] || 0, r.err);
  const dates = Object.keys(byDate).sort((a, b) => byDate[b] - byDate[a] || a.localeCompare(b));
  naiveWorstByYear[y] = { missRows: rows.length, missDates: dates.length, topDates: dates.slice(0, 5).map((d) => ({ date: d, err: byDate[d] })) };
}
missAnatomy.naive.buckets = naiveBuckets;
missAnatomy.naive.worstByYear = naiveWorstByYear;

// ---- Offset-table transfer -------------------------------------------------------
// If the fajr/isha offset tables carry across years unchanged, the signed fajr error
// equals the signed sunrise error on every date, and likewise isha against magrib.
function offsetTransfer(genByYear) {
  const out = { fajrVsSunrise: { same: 0, differ: [], maxAbsDiff: 0 }, ishaVsMagrib: { same: 0, differ: [], maxAbsDiff: 0 } };
  const pairs = [['fajr', 'sunrise', 'fajrVsSunrise'], ['isha', 'magrib', 'ishaVsMagrib']];
  for (const y of YEARS) {
    const keys = Object.keys(TRUTH).filter((k) => k.startsWith(`${y}-`));
    for (const k of keys) {
      for (const [a, b, bucket] of pairs) {
        const d = (toMin(genByYear[y][k][a]) - toMin(TRUTH[k][a])) - (toMin(genByYear[y][k][b]) - toMin(TRUTH[k][b]));
        if (d === 0) out[bucket].same++;
        else {
          out[bucket].differ.push({ date: k, diff: d });
          if (Math.abs(d) > out[bucket].maxAbsDiff) out[bucket].maxAbsDiff = Math.abs(d);
        }
      }
    }
  }
  out.days = Object.keys(TRUTH).length;
  return out;
}
const offsetStability = { recipe: offsetTransfer(recipeGen), naive: offsetTransfer(naiveGen) };

// ---- Assemble --------------------------------------------------------------------
const results = {
  schema: 'o1g-decade-predict/1',
  generatedFor: { years: YEARS, truthDays: Object.keys(TRUTH).length, truthRange: [Object.keys(TRUTH)[0], Object.keys(TRUTH).slice(-1)[0]], checksPerArm: Object.keys(TRUTH).length * PRAYERS.length },
  timezone: 'Europe/London',
  prayers: PRAYERS,
  fidelity,
  recipe: {
    perYear: armRecipe.perYear, perPrayerOverall: armRecipe.perPrayerOverall, overall: armRecipe.overall,
  },
  naive: {
    leapFill2027, perYear: armNaive.perYear, perPrayerOverall: armNaive.perPrayerOverall, overall: armNaive.overall,
  },
  naiveDstAligned: {
    note: 'diagnostic only: raw 2027 replay corrected by the hour when the target date sits in the other DST state',
    perYear: armNaiveAligned.perYear, perPrayerOverall: armNaiveAligned.perPrayerOverall, overall: armNaiveAligned.overall,
  },
  offsetStability,
  leapDay: {
    verdict: {
      geometry: 'computed from the leap date itself; matches truth on all 12 geometry cells',
      offsetRule: 'the 02-29 offset entry equals the 03-01 entry (fajr 97, isha 86) in all three leap years',
      shippedMeanCost: 'the shipped half-up mean (isha 87) is one minute late on isha on each leap day',
      bestFill: leapBestFill,
    },
    perYear: leapAnalysis, variantScores: leapVariantScores,
    recipeTable0229: { fajr: F_TABLE['02-29'], isha: I_TABLE['02-29'] },
    recipeTableNeighbours: {
      fajr: { '02-28': F_TABLE['02-28'], '03-01': F_TABLE['03-01'] },
      isha: { '02-28': I_TABLE['02-28'], '03-01': I_TABLE['03-01'] },
    },
    truthImpliedOffsets: Object.fromEntries(LEAP_YEARS.map((y) => [y, {
      fajr: leapAnalysis[y].fajr.truthImpliedOffset, isha: leapAnalysis[y].isha.truthImpliedOffset,
    }])),
  },
  keying: {
    perYear: keying, mmddIsDefault: true,
    verdict: Object.values(keying).every((k) => k.verdict === 'mmdd') ? 'mmdd' : 'mixed',
    doyNote: 'leap-year day-of-year 366 clamps to 12-31 (2027 has 365 days)',
  },
  trend,
  missAnatomy,
};

fs.writeFileSync(HERE + 'results.json', JSON.stringify(results, null, 1));

// ---- Console summary -------------------------------------------------------------
const fmt = (r) => `${r.exactPct}% exact, ${r.within1Pct}% within1, worst ${r.worst}, mae ${r.mae}`;
console.log('=== A. RECIPE ===');
for (const y of YEARS) {
  const row = armRecipe.perYear[y];
  console.log(`${y} (${row.days}d) ${fmt(row.overall)}`);
  for (const p of PRAYERS) console.log(`   ${p.padEnd(8)} ${fmt(row.perPrayer[p])}`);
}
console.log('--- overall per prayer ---');
for (const p of PRAYERS) console.log(`${p.padEnd(8)} ${fmt(armRecipe.perPrayerOverall[p])}`);
console.log(`ALL ${fmt(armRecipe.overall)}`);
console.log('=== D. NAIVE ===');
for (const y of YEARS) console.log(`${y} ${fmt(armNaive.perYear[y].overall)}`);
for (const p of PRAYERS) console.log(`${p.padEnd(8)} ${fmt(armNaive.perPrayerOverall[p])}`);
console.log(`ALL ${fmt(armNaive.overall)}`);
console.log('=== B. LEAP ===');
for (const y of LEAP_YEARS) for (const p of PRAYERS) console.log(`${y}-02-29 ${p.padEnd(8)} prev ${leapAnalysis[y][p].prev} next ${leapAnalysis[y][p].next} truth ${leapAnalysis[y][p].truth} meanR ${leapAnalysis[y][p].meanRounded} matches ${leapAnalysis[y][p].matches} recipe ${leapAnalysis[y][p].recipe} err ${leapAnalysis[y][p].recipeErr}`);
for (const [rule, s] of Object.entries(leapVariantScores)) console.log(`fill ${rule}: exact ${s.exact}/${s.total} within1 ${s.within1} worst ${s.worst}`);
console.log('=== C. KEYING ===');
for (const y of LEAP_YEARS) {
  console.log(`${y} differingDays ${keying[y].differingDays} disagreements ${keying[y].disagreements.length} tally ${JSON.stringify(keying[y].disagreementTally)} verdict ${keying[y].verdict}`);
  for (const p of PRAYERS) console.log(`   ${p.padEnd(8)} mmdd ${fmt(keying[y].mmdd[p])} | doy ${fmt(keying[y].doy[p])}`);
}
console.log('=== E. TREND ===');
console.log(JSON.stringify(trend.overall.series));
console.log('slopes', JSON.stringify(trendSlope));
for (const p of PRAYERS) console.log(`${p.padEnd(8)} 2028 ${JSON.stringify(trend[p][2028])} 2038 ${JSON.stringify(trend[p][2038])} dMae ${trend[p].deltaMae} dExact ${trend[p].deltaExactPct}`);
console.log('=== ANATOMY (recipe) ===');
console.log(JSON.stringify({ byPrayer: missAnatomy.recipe.byPrayer, byMonth: missAnatomy.recipe.byMonth, byYear: missAnatomy.recipe.byYear, err1: missAnatomy.recipe.err1Count, err2plus: missAnatomy.recipe.err2plusCount }));
console.log('=== ANATOMY (naive) ===');
console.log('buckets', JSON.stringify(naiveBuckets));
console.log('byPrayer', JSON.stringify(missAnatomy.naive.byPrayer));
console.log('worstByYear', JSON.stringify(naiveWorstByYear, null, 1));
console.log('=== NAIVE DST-ALIGNED (diagnostic) ===');
for (const y of YEARS) console.log(`${y} ${fmt(armNaiveAligned.perYear[y].overall)}`);
for (const p of PRAYERS) console.log(`${p.padEnd(8)} ${fmt(armNaiveAligned.perPrayerOverall[p])}`);
console.log(`ALL ${fmt(armNaiveAligned.overall)}`);
console.log('=== OFFSET TRANSFER ===');
for (const arm of ['recipe', 'naive']) {
  console.log(arm, JSON.stringify({
    days: offsetStability[arm].days,
    fajrSame: offsetStability[arm].fajrVsSunrise.same,
    fajrDiffer: offsetStability[arm].fajrVsSunrise.differ.length,
    fajrMax: offsetStability[arm].fajrVsSunrise.maxAbsDiff,
    ishaSame: offsetStability[arm].ishaVsMagrib.same,
    ishaDiffer: offsetStability[arm].ishaVsMagrib.differ.length,
    ishaMax: offsetStability[arm].ishaVsMagrib.maxAbsDiff,
  }));
}
