// Job 1: KHGT decade fit. One recipe across 3 latitudes, 2 seasons, 6 years.
import fs from 'node:fs';
import path from 'node:path';
import { init, solarDay, rnd, score, round2, line, yearDates } from './lib.mjs';

const ROOT = path.resolve(process.env.HOME, 'athan-gitree/census/o1k-wide/deep3');
const CITIES = {
  jakarta: { lat: -6.2088, lng: 106.8456, tz: 'Asia/Jakarta' },
  surabaya: { lat: -7.2575, lng: 112.7521, tz: 'Asia/Jakarta' },
  jayapura: { lat: -2.5916, lng: 140.6690, tz: 'Asia/Jayapura' },
};
const YEARS = [2025, 2027, 2029, 2031, 2033, 2035];

await init();
const src = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/khgt-decade-rows.json'), 'utf8'));
const rows = src.rows;
const days = rows.map((r) => r.iso);

const tw = (key, angle) => rows.map((r) => {
  const c = CITIES[r.city];
  const d = solarDay(c.lat, c.lng, r.iso, c.tz);
  return key === 'fajr' ? d.fajr(angle) : d.isha(angle);
});

// Grid fit: is there a cell that scores better than 18.0 / ceil / +1?
function gridFit(key) {
  let best = null;
  const consider = (angle, mode, margin, s) => {
    const cand = { angle, mode, margin, ...s };
    if (!best || cand.exact > best.exact
      || (cand.exact === best.exact && cand.within1 > best.within1)
      || (cand.exact === best.exact && cand.within1 === best.within1 && cand.worst < best.worst)) best = cand;
  };
  for (let a10 = 160; a10 <= 200; a10++) {
    const angle = a10 / 10;
    const secs = tw(key, angle);
    if (secs.some((v) => v === null)) continue;
    for (const mode of ['floor', 'ceil', 'nearest']) {
      for (let k = -20; k <= 30; k++) {
        const margin = k / 10;
        consider(angle, mode, margin, score(days, rows.map((r) => r[key]), (d) => secs[d], mode, margin));
      }
    }
  }
  return best;
}
const fajrGrid = gridFit('fajr');
const ishaGrid = gridFit('isha');
console.log('grid best fajr', JSON.stringify(fajrGrid));
console.log('grid best isha', JSON.stringify(ishaGrid));

// Canonical rule: 18 deg, ceil to the minute, one minute of safety.
const RULE = { angle: 18, mode: 'ceil', margin: 1 };
const fajrSecs = tw('fajr', RULE.angle);
const ishaSecs = tw('isha', RULE.angle);
const fajrPrinted = rows.map((r) => r.fajr);
const ishaPrinted = rows.map((r) => r.isha);

const overall = {
  fajr: score(days, fajrPrinted, (d) => fajrSecs[d], RULE.mode, RULE.margin),
  isha: score(days, ishaPrinted, (d) => ishaSecs[d], RULE.mode, RULE.margin),
};

const perYear = {};
for (const y of YEARS) {
  const idx = rows.map((r, i) => r.year === y ? i : -1).filter((i) => i >= 0);
  perYear[y] = {
    n: idx.length,
    fajr: score(idx.map((i) => rows[i].iso), idx.map((i) => rows[i].fajr), (d) => fajrSecs[idx[d]], RULE.mode, RULE.margin),
    isha: score(idx.map((i) => rows[i].iso), idx.map((i) => rows[i].isha), (d) => ishaSecs[idx[d]], RULE.mode, RULE.margin),
  };
}

const perCity = {};
for (const city of Object.keys(CITIES)) {
  const idx = rows.map((r, i) => r.city === city ? i : -1).filter((i) => i >= 0);
  perCity[city] = {
    lat: CITIES[city].lat,
    n: idx.length,
    fajr: score(idx.map((i) => rows[i].iso), idx.map((i) => rows[i].fajr), (d) => fajrSecs[idx[d]], RULE.mode, RULE.margin),
    isha: score(idx.map((i) => rows[i].iso), idx.map((i) => rows[i].isha), (d) => ishaSecs[idx[d]], RULE.mode, RULE.margin),
  };
}

// Admissible margin window per year at 18 deg, ceil: every row of the year
// prints exactly for m in (lo, hi]. A window that walks is drift; a window that
// does not move is a rule.
function windows(key, secs) {
  const out = {};
  for (const y of YEARS) {
    let lo = -Infinity, hi = Infinity;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].year !== y) continue;
      const base = secs[i] / 60;
      const c = rows[i][key];
      lo = Math.max(lo, c - 1 - base);
      hi = Math.min(hi, c - base);
    }
    const bestKey = Math.round(((lo + hi) / 2) * 1000) / 1000;
    out[y] = { lo: Math.round(lo * 1000) / 1000, hi: Math.round(hi * 1000) / 1000,
      width: Math.round((hi - lo) * 1000) / 1000, centre: bestKey };
  }
  return out;
}
const marginWindows = { fajr: windows('fajr', fajrSecs), isha: windows('isha', ishaSecs) };

// Kemenag line: 20 deg fajr, ceil, +2 min (the printed ihtiyati measured in the
// indonesia pass). Delta is Kemenag minute minus KHGT printed minute: negative
// means the ministry prints earlier, i.e. KHGT sits later.
const kemenagDelta = { definition: 'delta = Kemenag minute - KHGT printed minute; negative means the KHGT print is later' };
for (const y of YEARS) {
  const perCityOut = {};
  const all = [];
  for (const city of Object.keys(CITIES)) {
    const v = rows.filter((r) => r.year === y && r.city === city).map((r) => {
      const c = CITIES[city];
      const s = solarDay(c.lat, c.lng, r.iso, c.tz).fajr(20);
      return s === null ? null : rnd(s, 'ceil', 2) - r.fajr;
    }).filter((x) => x !== null);
    all.push(...v);
    perCityOut[city] = { n: v.length, min: Math.min(...v), max: Math.max(...v), mean: round2(v.reduce((a, b) => a + b, 0) / v.length) };
  }
  kemenagDelta[y] = { n: all.length, min: Math.min(...all), max: Math.max(...all),
    mean: round2(all.reduce((a, b) => a + b, 0) / all.length), byCity: perCityOut };
}

// Seasonal amplitude: printed Jan and Jul means, plus the modelled whole-year
// swing of the fitted 18 deg line.
const amplitude = {};
for (const city of Object.keys(CITIES)) {
  const { lat, lng, tz } = CITIES[city];
  const jan = rows.filter((r) => r.city === city && r.month === 1);
  const jul = rows.filter((r) => r.city === city && r.month === 7);
  const mean = (arr, k) => round2(arr.reduce((a, r) => a + r[k], 0) / arr.length);
  const model = yearDates(2027).map((iso) => {
    const d = solarDay(lat, lng, iso, tz);
    return { fajr: d.fajr(18) / 60, isha: d.isha(18) / 60, sunrise: d.sunrise / 60, sunset: d.sunset / 60 };
  });
  const swing = (k) => {
    const v = model.map((x) => x[k]);
    return { min: round2(Math.min(...v)), max: round2(Math.max(...v)), span: round2(Math.max(...v) - Math.min(...v)) };
  };
  amplitude[city] = {
    lat,
    printedJan: { fajrMean: mean(jan, 'fajr'), ishaMean: mean(jan, 'isha'), fajrFirst: jan[0].fajr, fajrLast: jan.at(-1).fajr },
    printedJul: { fajrMean: mean(jul, 'fajr'), ishaMean: mean(jul, 'isha'), fajrFirst: jul[0].fajr, fajrLast: jul.at(-1).fajr },
    janMinusJulFajr: round2(mean(jan, 'fajr') - mean(jul, 'fajr')),
    janMinusJulIsha: round2(mean(jan, 'isha') - mean(jul, 'isha')),
    modelled2027: { fajr: swing('fajr'), isha: swing('isha'), sunrise: swing('sunrise'), sunset: swing('sunset') },
  };
}

// Other columns, best cell each (horizon, transit, asr, maghrib).
const otherColumns = {};
for (const [key, pick] of [['sunrise', 'sunrise'], ['dhuhr', 'transit'], ['asr', 'asr'], ['maghrib', 'sunset']]) {
  const secs = rows.map((r) => {
    const c = CITIES[r.city];
    const d = solarDay(c.lat, c.lng, r.iso, c.tz);
    return pick === 'asr' ? d.asr(1) : d[pick];
  });
  let best = null;
  for (const mode of ['floor', 'ceil', 'nearest']) {
    for (let k = -20; k <= 20; k++) {
      const s = score(days, rows.map((r) => r[key]), (d) => secs[d], mode, k / 10);
      if (!best || s.exact > best.exact) best = { mode, margin: k / 10, ...s };
    }
  }
  otherColumns[key] = best;
}

const out = {
  job: 'Muhammadiyah KHGT decade, 2025-2035',
  source: 'https://api-khgt.muhammadiyah.or.id/api/sholat/schedule',
  method: 'POST {lat,lng,date,mode:monthly_masehi}; whole month per request; elevation auto-detected',
  geometry: CITIES,
  elevation: src.meta,
  harvest: { years: YEARS, months: [1, 7], rows: rows.length, captures: 36 },
  rule: { ...RULE, note: 'fitted cell; margin folds in before rounding' },
  gridFit: { fajr: fajrGrid, isha: ishaGrid },
  overall, perYear, perCity, marginWindows, kemenagDelta, amplitude, otherColumns,
};
fs.writeFileSync(path.join(ROOT, 'muhammadiyah-deep.json'), JSON.stringify(out, null, 1));

console.log('RULE', JSON.stringify(RULE));
console.log(line('fajr', overall.fajr));
console.log(line('isha', overall.isha));
for (const y of YEARS) console.log(y, line('fajr', perYear[y].fajr), '|', line('isha', perYear[y].isha));
for (const c of Object.keys(CITIES)) console.log(c, line('fajr', perCity[c].fajr), '|', line('isha', perCity[c].isha));
console.log('windows fajr', JSON.stringify(marginWindows.fajr));
console.log('windows isha', JSON.stringify(marginWindows.isha));
for (const y of YEARS) console.log('kemenag', y, JSON.stringify(kemenagDelta[y]));
for (const c of Object.keys(CITIES)) console.log('amplitude', c, JSON.stringify(amplitude[c]));
for (const k of Object.keys(otherColumns)) console.log(k, JSON.stringify(otherColumns[k]));
