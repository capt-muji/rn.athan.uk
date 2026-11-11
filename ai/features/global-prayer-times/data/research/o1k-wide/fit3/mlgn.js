// Mali + Guinea: Mawaqit full-year 2026 tables (community tier).
// Bamako Al Madina Al Mounawara (ml) and Nono Grande Mosquee (gn).
// Per-prayer free fit: fajr/isha angle sweeps, asr both madhabs, solar
// columns with margin sweep. Run: TZ=Africa/Bamako node mlgn.js
import * as fs from 'node:fs';
import { loadAdhan, params, parseHHMM, bestMargin, evalFixed, secOfDay, scoreLine, fmtMin } from './lib.mjs';

const HOME = process.env.HOME;
const DIR = HOME + '/athan-gitree/census/o1k-wide/sahel2/data/';
const FILES = {
  ml: { file: 'mali-bamako-al-madina-mounawara-mawaqit-2026.json', lat: 12.608605403242, lon: -7.9542249441147, tz: 'Africa/Bamako', city: 'Bamako' },
  gn: { file: 'guinea-nono-grande-mosquee-mawaqit-2026.json', lat: 10.876038673068, lon: -10.495964683475, tz: 'Africa/Conakry', city: 'Nono' },
};

const adhan = await loadAdhan();

for (const [key, F] of Object.entries(FILES)) {
  const raw = JSON.parse(fs.readFileSync(DIR + F.file, 'utf8'));
  const isos = Object.keys(raw.rows).sort();
  const rows = isos.map(iso => {
    const [y, m, d] = iso.split('-').map(Number);
    const r = raw.rows[iso];
    return { iso, y, m, d, fajr: parseHHMM(r.fajr), sunrise: parseHHMM(r.sunrise), dhuhr: parseHHMM(r.dhuhr), asr: parseHHMM(r.asr), magrib: parseHHMM(r.magrib), isha: parseHHMM(r.isha) };
  });
  console.log('== ' + key + ' ' + raw.mosque + ': rows ' + rows.length, rows[0].iso, '..', rows[rows.length - 1].iso, 'problems', JSON.stringify(raw.problems));

  const CITY = { lat: F.lat, lon: F.lon };
  const PICK = { fajr: t => t.fajr, sunrise: t => t.sunrise, dhuhr: t => t.dhuhr, asr: t => t.asr, magrib: t => t.maghrib, isha: t => t.isha };

  function computeAt(y, m, d, fA, iA, mad) {
    const p = params(adhan, fA, iA);
    if (mad) p.madhab = mad;
    return new adhan.PrayerTimes(new adhan.Coordinates(CITY.lat, CITY.lon), new Date(y, m - 1, d), p);
  }
  function fitAngle(printed, pick, lo, hi, step) {
    let best = null;
    for (let a = lo; a <= hi + 1e-9; a += step) {
      const ang = Math.round(a * 100) / 100;
      const sec = secOfDay(rows, (y, m, d) => computeAt(y, m, d, ang, ang), pick);
      const r = bestMargin(sec, printed);
      if (!best || r.exact > best.r.exact || (r.exact === best.r.exact && r.within1 > best.r.within1)) best = { angle: ang, r };
    }
    return best;
  }
  function refine(printed, pick, b) {
    let best = { angle: b.angle, r: evalFixed(secOfDay(rows, (y, m, d) => computeAt(y, m, d, b.angle, b.angle), pick), printed, b.r.margin, b.r.mode) };
    for (let a = b.angle - 0.1; a <= b.angle + 0.1 + 1e-9; a += 0.01) {
      const ang = Math.round(a * 100) / 100;
      const r = bestMargin(secOfDay(rows, (y, m, d) => computeAt(y, m, d, ang, ang), pick), printed);
      if (r.exact > best.r.exact || (r.exact === best.r.exact && r.within1 > best.r.within1)) best = { angle: ang, r };
    }
    return best;
  }

  const out = { country: key, publisher: raw.mosque + ' via Mawaqit (community tier)', source: 'sahel2/data/' + F.file, rows: rows.length, span: [rows[0].iso, rows[rows.length - 1].iso], tz: F.tz, coords: CITY, problems: raw.problems };
  out.fajr = refine(rows.map(r => r.fajr), PICK.fajr, fitAngle(rows.map(r => r.fajr), PICK.fajr, 12, 21, 0.1));
  out.isha = refine(rows.map(r => r.isha), PICK.isha, fitAngle(rows.map(r => r.isha), PICK.isha, 10, 20, 0.1));
  console.log('fajr', out.fajr.angle, scoreLine('fajr', out.fajr.r));
  console.log('isha', out.isha.angle, scoreLine('isha', out.isha.r));

  const solar = {};
  for (const col of ['sunrise', 'magrib']) {
    const sec = secOfDay(rows, (y, m, d) => computeAt(y, m, d, 90, 90), PICK[col]);
    solar[col] = bestMargin(sec, rows.map(r => r[col]));
    console.log(col, scoreLine(col, solar[col]));
  }
  for (const [mad, name] of [[adhan.Madhab.Shafi, 'asr_shafi'], [adhan.Madhab.Hanafi, 'asr_hanafi']]) {
    const sec = secOfDay(rows, (y, m, d) => computeAt(y, m, d, 90, 90, mad), PICK.asr);
    solar[name] = bestMargin(sec, rows.map(r => r.asr));
    console.log(name, scoreLine(name, solar[name]));
  }
  // dhuhr: Mawaqit Bamako rides transit (+28.5..29.5 implied, all year);
  // Nono prints a fixed clock time (13:45 on all 365 rows).
  const noonSec = rows.map(r => {
    const st = new adhan.SolarTime(new Date(r.y, r.m - 1, r.d), new adhan.Coordinates(CITY.lat, CITY.lon));
    const dt = new adhan.TimeComponents(st.transit).utcDate(r.y, r.m - 1, r.d);
    return dt.getHours() * 3600 + dt.getMinutes() * 60 + dt.getSeconds();
  });
  const dhHist = {};
  rows.forEach(r => { const k = fmtMin(r.dhuhr); dhHist[k] = (dhHist[k] || 0) + 1; });
  if (Object.keys(dhHist).length === 1) {
    const t = Object.keys(dhHist)[0];
    solar.dhuhr = { fixed_clock: t, exact: dhHist[t], n: rows.length };
    console.log('dhuhr FIXED ' + t + ' on all ' + dhHist[t] + ' rows');
  } else {
    let bestD = null;
    for (let K = 0; K <= 35; K++) {
      const r = evalFixed(noonSec, rows.map(x => x.dhuhr), K, 'floor');
      if (!bestD || r.exact > bestD.r.exact) bestD = { K, r };
    }
    solar.dhuhr = bestD;
    console.log('dhuhr transit+' + bestD.K, scoreLine('dhuhr', bestD.r));
  }
  out.solar = solar;
  if (key === 'gn') {
    out.anomalies = {
      dhuhr: 'fixed clock 13:45 on all 365 rows while every other column is computed: the mosque config pins dhuhr',
      maghrib: 'sunset floor fits Jan 1 - Oct 15 (exact), then a smooth drift hump 2026-10-16..2026-12-19 (+1.1 rising to +9.7 around late Nov, back to +1.2): a second convention active for that stretch, cause not resolvable from the table alone',
      fajr: 'smooth seasonal dawn curve, implied interval 75.6 min before sunrise (Dec) shrinking to 58.2 (May-Jun) and back: implied depression ~13.4 deg (winter) to ~17.5 (summer), i.e. roughly dep = 15.5 + 0.09*declination. No single angle (best 18 deg +0.5 floor, 240/365 exact, worst 19) and no fixed interval reproduces it; the winter-longer direction rules out a fixed-angle convention at this latitude. Everything else in the column sits within +-1 of the curve',
    };
  }
  if (key === 'ml') {
    out.notes = {
      dhuhr: 'transit + 28.5..29.5 through the whole year: computed, fixed ~+29 min allowance',
      asr: 'Shafi asr with a +6.6..+9.6 seasonal drift band; best single margin +8 floor, worst 2 min',
      fajr_isha: 'fajr at 19.0 deg +7.5 floor, isha at 17.0 deg +5.5 floor: 18/17-class angles with safety minutes',
    };
  }
  fs.writeFileSync(HOME + '/athan-gitree/census/o1k-wide/fit3/' + key + '.json', JSON.stringify(out, null, 1));
  console.log('wrote fit3/' + key + '.json');
}
