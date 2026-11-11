import fs from 'fs';
import path from 'path';
import adhan from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const DATA = path.join(HERE, 'data');
const OUT = path.join(HERE, 'fits');
const COORDS = JSON.parse(fs.readFileSync(path.join(HERE, 'coords.json'), 'utf8'));
fs.mkdirSync(OUT, { recursive: true });
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

function coordsFor(file, d) {
  if (d.latitude != null && d.longitude != null) return [d.latitude, d.longitude];
  const base = path.basename(file);
  let m = /^(.+?)-([A-Za-z0-9]{8})-athanplus\.json$/.exec(base);
  if (m) return (COORDS[`${m[1]}|${m[2]}`] || {}).geo?.slice(0, 2);
  m = /^(.+?)-(.+)-masjidbox\.json$/.exec(base);
  if (m) return (COORDS[`mb|${m[2]}`] || {}).geo?.slice(0, 2);
  return (COORDS[`city|${d.metro}`] || {}).geo?.slice(0, 2);
}

const TZ = {
  Albany: 'America/New_York', Baltimore: 'America/New_York', 'Baton Rouge': 'America/Chicago',
  Birmingham: 'America/Chicago', Dearborn: 'America/Detroit', Detroit: 'America/Detroit',
  Flint: 'America/Detroit', Gainesville: 'America/New_York', 'Grand Rapids': 'America/Detroit',
  Harrisburg: 'America/New_York', 'Kansas City': 'America/Chicago', Knoxville: 'America/New_York',
  Louisville: 'America/Kentucky/Louisville', Montgomery: 'America/Chicago',
  'New Orleans': 'America/Chicago', Norfolk: 'America/New_York', 'Oklahoma City': 'America/Chicago',
  Portland: 'America/Los_Angeles', Providence: 'America/New_York', Raleigh: 'America/New_York',
  Rochester: 'America/New_York', 'Salt Lake City': 'America/Denver', Tallahassee: 'America/New_York',
  Tucson: 'America/Phoenix', Wilmington: 'America/New_York',
};

const fmtCache = new Map();
function localMinutes(dt, tz) {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    fmtCache.set(tz, f);
  }
  const p = Object.fromEntries(f.formatToParts(dt).map(x => [x.type, x.value]));
  return (+p.hour % 24) * 60 + (+p.minute) + (+p.second) / 60;
}

function parseHM(s) {
  if (typeof s !== 'string') return null;
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?$/.exec(s.trim());
  if (!m) return null;
  let h = +m[1];
  const mi = +m[2];
  const ap = (m[3] || '').toLowerCase();
  if (ap === 'pm' && h !== 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  return h * 60 + mi;
}

function rowsFrom(file) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const metro = d.metro;
  const tz = TZ[metro];
  const out = {};  if (d.days) {
    for (const [date, v] of Object.entries(d.days)) {
      const row = {};
      for (const c of COLS) {
        const raw = v[c] != null ? v[c] : v[c + '_athan'] != null ? v[c + '_athan'] : v[c === 'dhuhr' ? 'dhur' : c];
        row[c] = parseHM(raw);
      }
      if (COLS.every(c => row[c] != null)) {
        // athanplus prints 12-hour times with no suffix: a column that reads earlier
        // than the prayer before it is a PM value
        if (row.dhuhr < row.sunrise) row.dhuhr += 720;
        for (const c of ['asr', 'maghrib', 'isha']) {
          if (row[c] < row.dhuhr) row[c] += 720;
        }
        out[date] = row;
      }
    }
  } else if (d.rows) {
    for (const [date, v] of Object.entries(d.rows)) {
      const row = {};
      for (const c of COLS) row[c] = v[c] ? parseHM(v[c].slice(11, 16)) : null;
      if (COLS.every(c => row[c] != null)) out[date] = row;
    }
  } else if (d.calendar) {
    const year = d.year || 2026;
    d.calendar.forEach((month, i) => {
      for (const [day, vals] of Object.entries(month)) {
        if (!Array.isArray(vals) || vals.length < 6) continue;
        // mawaqit stores six solar columns, or seven when the mosque pins an iqamah first
        const cols = vals.length >= 7 ? vals.slice(1, 7) : vals.slice(0, 6);
        const row = {};
        ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach((c, k) => { row[c] = parseHM(cols[k]); });
        if (COLS.every(c => row[c] != null)) out[`${year}-${String(i + 1).padStart(2, '0')}-${String(+day).padStart(2, '0')}`] = row;
      }
    });
  }
  return { metro, coords: coordsFor(file, d), tz, pub: out };
}

function compute(dates, lat, lng, tz, fajrAngle, isha, madhab) {
  const ishaAngle = isha[0] === 'angle' || isha[0] === 'angle_floor' ? isha[1] : 0;
  const ishaInterval = isha[0] === 'interval' ? isha[1] : 0;
  const params = new adhan.CalculationParameters('Other', fajrAngle, ishaAngle, ishaInterval);
  params.madhab = madhab === 'hanafi' ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;
  params.highLatitudeRule = adhan.HighLatitudeRule.TwilightAngle;
  params.rounding = adhan.Rounding.None;
  const coords = new adhan.Coordinates(lat, lng);
  const res = {};
  for (const date of dates) {
    const [y, m, dd] = date.split('-').map(Number);
    const t = new adhan.PrayerTimes(coords, new Date(Date.UTC(y, m - 1, dd, 18, 0)), params);
    const row = {};
    for (const c of COLS) row[c] = localMinutes(t[c], tz);
    if (isha[0] === 'angle_floor') row.isha = Math.max(row.isha, row.maghrib + isha[2]);
    res[date] = row;
  }
  return res;
}

function median(a) {
  const s = [...a].sort((x, y) => x - y);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

function score(pub, comp, margins) {
  const per = {};
  for (const c of COLS) {
    const diffs = Object.keys(pub).map(d => pub[d][c] - (comp[d][c] + (margins[c] || 0)));
    per[c] = {
      mae: +(diffs.reduce((a, x) => a + Math.abs(x), 0) / diffs.length).toFixed(2),
      bias: +median(diffs).toFixed(2),
      exact: +(100 * diffs.filter(x => Math.abs(x) < 0.5).length / diffs.length).toFixed(1),
      w1: +(100 * diffs.filter(x => Math.abs(x) <= 1.0).length / diffs.length).toFixed(1),
      worst: +Math.max(...diffs.map(Math.abs)).toFixed(1),
    };
  }
  return per;
}

function rms(pub, comp, col) {
  // score the shape, not a constant offset: the median bias is applied as a margin later
  const diffs = Object.keys(pub).map(d => pub[d][col] - comp[d][col]);
  const m = median(diffs);
  return Math.sqrt(diffs.reduce((a, x) => a + (x - m) * (x - m), 0) / diffs.length);
}

function fit(metro, coords, tz, pub, label) {
  const dates = Object.keys(pub).sort();
  const [lat, lng] = coords;
  let bestF = null;
  for (let i = 0; i <= 60; i++) {
    const a = +(13.0 + 0.1 * i).toFixed(1);
    const comp = compute(dates, lat, lng, tz, a, ['angle', 17], 'shafi');
    const r = rms(pub, comp, 'fajr');
    if (!bestF || r < bestF[1]) bestF = [a, r];
  }
  const fajrAngle = bestF[0];
  let bestI = null;
  for (let i = 0; i <= 90; i++) {
    const a = +(11.0 + 0.1 * i).toFixed(1);
    const comp = compute(dates, lat, lng, tz, fajrAngle, ['angle', a], 'shafi');
    const r = rms(pub, comp, 'isha');
    if (!bestI || r < bestI[1]) bestI = [['angle', a], r];
  }
  for (let iv = 60; iv <= 150; iv++) {
    const comp = compute(dates, lat, lng, tz, fajrAngle, ['interval', iv], 'shafi');
    const r = rms(pub, comp, 'isha');
    if (r < bestI[1]) bestI = [['interval', iv], r];
  }
  let isha = bestI[0];
  // A winter isha floor: several boards hold isha at a minimum interval after maghrib
  // while keeping the twilight angle on long days. Tested only for angle recipes.
  if (isha[0] === 'angle') {
    const base = compute(dates, lat, lng, tz, fajrAngle, isha, 'shafi');
    let bestFloor = null;
    for (let n = 55; n <= 135; n++) {
      const diffs = dates.map(d => pub[d].isha - Math.max(base[d].isha, base[d].maghrib + n));
      const r = Math.sqrt(diffs.reduce((a, x) => a + x * x, 0) / diffs.length);
      if (!bestFloor || r < bestFloor[1]) bestFloor = [n, r];
    }
    if (bestFloor[1] < bestI[1] * 0.75) isha = ['angle_floor', isha[1], bestFloor[0]];
  }
  const cand = {};
  for (const mad of ['shafi', 'hanafi']) {
    const comp = compute(dates, lat, lng, tz, fajrAngle, isha, mad);
    const margins = {};
    for (const c of COLS) margins[c] = Math.round(median(dates.map(d => pub[d][c] - comp[d][c])));
    const per = score(pub, comp, margins);
    cand[mad] = { w1: COLS.reduce((a, c) => a + per[c].w1, 0) / 6, margins, per, comp };
  }
  const madhab = cand.hanafi.w1 > cand.shafi.w1 ? 'hanafi' : 'shafi';
  const { margins, per, comp } = cand[madhab];
  const years = [...new Set(dates.map(d => d.slice(0, 4)))].sort();
  const perYear = {};
  for (const y of years) {
    const sub = Object.fromEntries(dates.filter(d => d.startsWith(y)).map(d => [d, pub[d]]));
    perYear[y] = score(sub, comp, margins);
  }
  const meanMonth = mm => {
    const v = dates.filter(d => d.slice(5, 7) === mm).map(d => pub[d].fajr);
    return v.length ? v.reduce((a, x) => a + x, 0) / v.length : null;
  };
  const jan = meanMonth('01'), jul = meanMonth('07');
  // fixed-recipe check: the plain ISNA 15/15 board, scored with constant margins
  const fixed = {};
  for (const mad of ['shafi', 'hanafi']) {
    const comp15 = compute(dates, lat, lng, tz, 15, ['angle', 15], mad);
    const m15 = {};
    for (const c of COLS) m15[c] = Math.round(median(dates.map(d => pub[d][c] - comp15[d][c])));
    const per15 = score(pub, comp15, m15);
    fixed[mad] = { margins: m15, per: per15,
      w1: COLS.reduce((a, c) => a + per15[c].w1, 0) / 6,
      exact: COLS.reduce((a, c) => a + per15[c].exact, 0) / 6 };
  }
  const fixedMad = fixed.hanafi.w1 > fixed.shafi.w1 ? 'hanafi' : 'shafi';
  const result = {
    metro, surface: label,
    isna_15_15: { madhab: fixedMad, margins: fixed[fixedMad].margins,
                  w1: +fixed[fixedMad].w1.toFixed(1), exact: +fixed[fixedMad].exact.toFixed(1),
                  per_column: fixed[fixedMad].per }, rows: dates.length, span: [dates[0], dates[dates.length - 1]],
    years, coords: [lat, lng], tz,
    recipe: { engine: 'adhan 4.4.6', fajr_angle: fajrAngle, isha, madhab, high_latitude: 'TwilightAngle', rounding: 'None', margins },
    per_column: per, per_year: perYear,
    seasonal_fajr_amplitude_min: jan != null && jul != null ? +Math.abs(jul - jan).toFixed(1) : null,
    fajr_later_in_january: jan != null && jul != null ? jan > jul : null,
  };
  fs.writeFileSync(path.join(OUT, `${metro}-${label}.json`), JSON.stringify(result, null, 1));
  return result;
}

const files = fs.readdirSync(DATA).filter(f => f.endsWith('.json')).sort();
const summary = [];
for (const f of files) {
  const { metro, coords, tz, pub } = rowsFrom(path.join(DATA, f));
  if (!Object.keys(pub).length || !coords || coords[0] == null) { console.log('SKIP', f, Object.keys(pub).length, coords); continue; }
  const label = f.replace(/\.json$/, '').split('-').slice(1).join('-');
  const r = fit(metro, coords, tz, pub, label);
  const pc = r.per_column;
  const w1 = (COLS.reduce((a, c) => a + pc[c].w1, 0) / 6).toFixed(1);
  const ex = (COLS.reduce((a, c) => a + pc[c].exact, 0) / 6).toFixed(1);
  console.log(`${metro.padEnd(15)} ${label.slice(0, 36).padEnd(36)} ${String(r.rows).padStart(5)} fajr=${r.recipe.fajr_angle} isha=${JSON.stringify(r.recipe.isha)} asr=${r.recipe.madhab} w1=${w1} exact=${ex} amp=${r.seasonal_fajr_amplitude_min}`);
  summary.push(r);
}
fs.writeFileSync(path.join(OUT, 'SUMMARY.json'), JSON.stringify(summary, null, 1));
