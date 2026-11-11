// Senegal: CERFI Dakar, 2011 edition (365 rows), two-dawn convention.
// The sheet's "fajr" and "sunrise" columns are tested as dawn gate 1 and
// dawn gate 2 respectively; dhuhr/asr/maghrib/isha fitted alongside; the
// 2026-11 sheet (both gates printed) is cross-checked on the same recipe.
// Run: TZ=Africa/Dakar node sn.js
import * as fs from 'node:fs';
import { loadAdhan, params, parseHHMM, bestMargin, secOfDay, scoreLine } from './lib.mjs';

const HOME = process.env.HOME;
const OUT = HOME + '/athan-gitree/census/o1k-wide/fit3/sn.json';
const CITY = { lat: 14.7167, lon: -17.4677 };

const adhan = await loadAdhan();
function loadRows(path, rowKey) {
  const raw = JSON.parse(fs.readFileSync(path, 'utf8'));
  const src = rowKey ? raw.rows : raw;
  return Object.keys(src).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort().map(iso => {
    const [y, m, d] = iso.split('-').map(Number);
    const r = src[iso];
    return { iso, y, m, d, fajr: parseHHMM(r.fajr ?? r.fajar), sunrise: parseHHMM(r.sunrise ?? r.suba), dhuhr: parseHHMM(r.dhuhr ?? r.tisbar), asr: parseHHMM(r.asr ?? r.takusan), magrib: parseHHMM(r.magrib ?? r.timis), isha: parseHHMM(r.isha ?? r.guewe) };
  });
}
const rows2011 = loadRows(HOME + '/athan-gitree/census/o1k-wide/sahel2/data/senegal-dakar-cerfi-2011.json', 'rows');
const raw2026 = JSON.parse(fs.readFileSync(HOME + '/athan-gitree/census/o1k-wide/africa/data/senegal-cerfi-dakar-2026-11.json', 'utf8')).rows;
const rows2026 = Object.keys(raw2026).sort().map(iso => {
  const [y, m, d] = iso.split('-').map(Number);
  const r = raw2026[iso];
  return { iso, y, m, d, fajr: parseHHMM(r.fajar), sunrise: parseHHMM(r.suba), dhuhr: parseHHMM(r.tisbar), asr: parseHHMM(r.takusan), magrib: parseHHMM(r.timis), isha: parseHHMM(r.guewe) };
});
console.log('rows 2011:', rows2011.length, 'rows 2026-11:', rows2026.length);

function computeAt(y, m, d, fajrA, ishaA, madhab) {
  const p = params(adhan, fajrA, ishaA);
  if (madhab) p.madhab = madhab;
  return new adhan.PrayerTimes(new adhan.Coordinates(CITY.lat, CITY.lon), new Date(y, m - 1, d), p);
}
function secFor(rows, pick, fA = 90, iA = 90, mad = null) {
  return rows.map(r => { const t = computeAt(r.y, r.m, r.d, fA, iA, mad); const d = pick(t); return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds(); });
}
function noonSecFor(rows) {
  return rows.map(r => {
    const st = new adhan.SolarTime(new Date(r.y, r.m - 1, r.d), new adhan.Coordinates(CITY.lat, CITY.lon));
    const dt = new adhan.TimeComponents(st.transit).utcDate(r.y, r.m - 1, r.d);
    return dt.getHours() * 3600 + dt.getMinutes() * 60 + dt.getSeconds();
  });
}
function fitAngle(rows, printed, pick, lo, hi, step) {
  let best = null;
  for (let a = lo; a <= hi + 1e-9; a += step) {
    const ang = Math.round(a * 100) / 100;
    const sec = secFor(rows, pick, ang, ang);
    const r = bestMargin(sec, printed);
    if (!best || r.exact > best.r.exact || (r.exact === best.r.exact && r.within1 > best.r.within1)) best = { angle: ang, r };
  }
  return best;
}

const out = { country: 'sn', publisher: 'CERFI Dakar (Séminaire des Imams standard hours)', coords: CITY, tz: 'Africa/Dakar (UTC+0, no DST)', edition_2011: { rows: rows2011.length, span: [rows2011[0].iso, rows2011[rows2011.length - 1].iso] } };

// printed-gap check: fajr -> "sunrise" interval histogram
const gap = {};
rows2011.forEach(r => { const v = r.sunrise - r.fajr; gap[v] = (gap[v] || 0) + 1; });
out.printed_fajr_to_sunrise_gap = gap;
console.log('printed (sunrise - fajr) gap histogram:', JSON.stringify(gap));

// dawn gate fits on the 2011 sheet: first refuted as angles, then fitted as
// fixed minutes-before-sunrise (implied offsets sit at -75.0..-76.6 and
// -60.0..-61.6 through the year: a fixed-interval convention, not an angle).
const fits = {};
fits.dhuhr = bestMargin(noonSecFor(rows2011), rows2011.map(r => r.dhuhr));
fits.asr_shafi = bestMargin(secFor(rows2011, t => t.asr, 90, 90, adhan.Madhab.Shafi), rows2011.map(r => r.asr));
fits.asr_hanafi = bestMargin(secFor(rows2011, t => t.asr, 90, 90, adhan.Madhab.Hanafi), rows2011.map(r => r.asr));
fits.maghrib = bestMargin(secFor(rows2011, t => t.maghrib), rows2011.map(r => r.magrib));

function fitFixedInterval(rows, printed, lo, hi) {
  // printed = round_mode(sunrise_event - K), sweep K
  const sunrise = rows.map(r => {
    const st = new adhan.SolarTime(new Date(r.y, r.m - 1, r.d), new adhan.Coordinates(CITY.lat, CITY.lon));
    const dt = new adhan.TimeComponents(st.sunrise).utcDate(r.y, r.m - 1, r.d);
    return dt.getHours() * 60 + dt.getMinutes() + dt.getSeconds() / 60;
  });
  let best = null;
  for (let K = lo; K <= hi + 1e-9; K += 0.5) {
    for (const mode of ['floor', 'ceil', 'nearest']) {
      let exact = 0, within1 = 0, worst = 0;
      rows.forEach((r, i) => {
        const v = Math.round(sunrise[i] - K);
        const diff = Math.abs(v - printed[i]);
        if (diff === 0) exact++;
        if (diff <= 1) within1++;
        if (diff > worst) worst = diff;
      });
      if (!best || exact > best.exact || (exact === best.exact && within1 > best.within1)) best = { K, mode, exact, within1, worst };
    }
  }
  return best;
}
out.dawn1_fajr_column_angle_fit = fitAngle(rows2011, rows2011.map(r => r.fajr), t => t.fajr, 10, 22, 0.1);
out.dawn1_fajr_column = fitFixedInterval(rows2011, rows2011.map(r => r.fajr), 70, 82);
out.dawn2_sunrise_column_angle_fit = fitAngle(rows2011, rows2011.map(r => r.sunrise), t => t.fajr, 8, 20, 0.1);
out.dawn2_sunrise_column = fitFixedInterval(rows2011, rows2011.map(r => r.sunrise), 55, 67);
console.log('dawn-1 (fajr col) as angle (refuted):', out.dawn1_fajr_column_angle_fit.angle, scoreLine('fajr', out.dawn1_fajr_column_angle_fit.r));
console.log('dawn-1 (fajr col) fixed interval:', 'K=-' + out.dawn1_fajr_column.K, out.dawn1_fajr_column.mode, 'exact', out.dawn1_fajr_column.exact + '/' + rows2011.length, 'within1', out.dawn1_fajr_column.within1, 'worst', out.dawn1_fajr_column.worst);
console.log('dawn-2 ("sunrise" col) as angle (refuted):', out.dawn2_sunrise_column_angle_fit.angle, scoreLine('suba', out.dawn2_sunrise_column_angle_fit.r));
console.log('dawn-2 ("sunrise" col) fixed interval:', 'K=-' + out.dawn2_sunrise_column.K, out.dawn2_sunrise_column.mode, 'exact', out.dawn2_sunrise_column.exact + '/' + rows2011.length, 'within1', out.dawn2_sunrise_column.within1, 'worst', out.dawn2_sunrise_column.worst);

// does the "sunrise" column fit astronomical sunrise? (it should NOT)
out.astronomical_sunrise_check = bestMargin(secFor(rows2011, t => t.sunrise), rows2011.map(r => r.sunrise));
console.log('"sunrise" col vs astronomical sunrise:', scoreLine('sunrise', out.astronomical_sunrise_check));

// isha: fixed interval from maghrib, plus angle-fit fallback
const ishaGap = {};
rows2011.forEach(r => { const v = r.isha - r.magrib; ishaGap[v] = (ishaGap[v] || 0) + 1; });
out.isha_minus_maghrib_gap = ishaGap;
const domIsha = Number(Object.entries(ishaGap).sort((a, b) => b[1] - a[1])[0][0]);
{
  let exact = 0, within1 = 0, worst = 0;
  rows2011.forEach(r => { const diff = Math.abs(r.magrib + domIsha - r.isha); if (diff === 0) exact++; if (diff <= 1) within1++; if (diff > worst) worst = diff; });
  out.isha_as_maghrib_plus = { interval: domIsha, exact, within1, worst, n: rows2011.length };
}
console.log('isha = maghrib +' + domIsha + ':', JSON.stringify(out.isha_as_maghrib_plus), 'gap hist', JSON.stringify(ishaGap));
Object.entries(fits).forEach(([k, v]) => console.log(k, scoreLine(k, v)));
out.fits_2011 = fits;

// cross-check: 2026-11 sheet, both gates printed, same fixed intervals
out.crosscheck_2026_11 = {
  fajar_minus76: fitFixedInterval(rows2026, rows2026.map(r => r.fajr), 70, 82),
  suba_minus61: fitFixedInterval(rows2026, rows2026.map(r => r.sunrise), 55, 67),
};
console.log('2026-11 fajar:', JSON.stringify(out.crosscheck_2026_11.fajar_minus76));
console.log('2026-11 suba:', JSON.stringify(out.crosscheck_2026_11.suba_minus61));
out.crosscheck_2026_11.tisbar_dhuhr = bestMargin(noonSecFor(rows2026), rows2026.map(r => r.dhuhr));
out.crosscheck_2026_11.takusan_asr = bestMargin(secFor(rows2026, t => t.asr, 90, 90, adhan.Madhab.Shafi), rows2026.map(r => r.asr));
out.crosscheck_2026_11.timis_maghrib = bestMargin(secFor(rows2026, t => t.maghrib), rows2026.map(r => r.magrib));
console.log('2026-11 tisbar', scoreLine('tisbar', out.crosscheck_2026_11.tisbar_dhuhr));
console.log('2026-11 takusan', scoreLine('takusan', out.crosscheck_2026_11.takusan_asr));
console.log('2026-11 timis', scoreLine('timis', out.crosscheck_2026_11.timis_maghrib));

fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('wrote', OUT);
