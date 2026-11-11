// Shared fit engine: adhan 4.4.6 at second resolution, explicit rounding, no clock read.
import { pathToFileURL } from 'node:url';

const ADHAN = process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/';

export async function loadAdhan() {
  const mod = await import(pathToFileURL(ADHAN + 'Adhan.js'));
  const { default: Coordinates } = await import(pathToFileURL(ADHAN + 'Coordinates.js'));
  const { default: CalculationParameters } = await import(pathToFileURL(ADHAN + 'CalculationParameters.js'));
  const { default: PrayerTimes } = await import(pathToFileURL(ADHAN + 'PrayerTimes.js'));
  const { default: SolarTime } = await import(pathToFileURL(ADHAN + 'SolarTime.js'));
  return { ...mod, Coordinates, CalculationParameters, PrayerTimes, SolarTime };
}

export function secOfDay(date) {
  return date.getUTCHours() * 3600 + date.getUTCMinutes() * 60 + date.getUTCSeconds();
}

export function params(A, fajrAngle, ishaAngle, { madhab = 'shafi' } = {}) {
  const p = new A.CalculationParameters('Other', fajrAngle, ishaAngle);
  p.method = 'Other';
  p.madhab = madhab;
  return p;
}

export function columns(A, { lat, lng }, date, p) {
  const t = new A.PrayerTimes(new A.Coordinates(lat, lng), date, p);
  return {
    fajr: secOfDay(t.fajr), sunrise: secOfDay(t.sunrise), dhuhr: secOfDay(t.dhuhr),
    asr: secOfDay(t.asr), maghrib: secOfDay(t.maghrib), isha: secOfDay(t.isha),
  };
}

export function sun(A, { lat, lng }, date) {
  const st = new A.SolarTime(date, new A.Coordinates(lat, lng));
  return { decl: st.solar.declination, transit: st.transit };
}

export function impliedDepression({ decl, transit }, lat, hours) {
  const rad = Math.PI / 180;
  const H = hours * 15 * rad;
  const d = decl * rad, L = lat * rad;
  const sinAlt = Math.sin(L) * Math.sin(d) + Math.cos(L) * Math.cos(d) * Math.cos(H);
  return -Math.asin(Math.max(-1, Math.min(1, sinAlt))) / rad;
}

// IANA offset in minutes, derived from the platform tz database at the given instant.
export function tzOffsetMinutes(tz, utcDate) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const parts = Object.fromEntries(dtf.formatToParts(utcDate).map(p => [p.type, p.value]));
  const asUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute, +parts.second);
  return (asUTC - utcDate.getTime()) / 60000;
}

export function roundMin(v, mode) {
  if (mode === 'floor') return Math.floor(v);
  if (mode === 'ceil') return Math.ceil(v);
  return Math.round(v);
}

export function evalFixed(minsList, printed, margin, mode) {
  let exact = 0, within1 = 0, worst = 0, absErr = 0;
  for (let i = 0; i < minsList.length; i++) {
    const v = roundMin(minsList[i] + margin, mode);
    const diff = Math.abs(v - printed[i]);
    if (diff === 0) exact++;
    if (diff <= 1) within1++;
    if (diff > worst) worst = diff;
    absErr += Math.abs(minsList[i] + margin - printed[i]);
  }
  return { margin, mode, exact, within1, worst, mae: +(absErr / minsList.length).toFixed(2), n: minsList.length };
}

export function bestMargin(minsList, printed, { m0 = -5, step = 0.5, jMax = 12 } = {}) {
  let best = null;
  for (const mode of ['floor', 'ceil', 'nearest']) {
    for (let j = 0; j <= jMax; j++) {
      const margin = m0 + j * step;
      const r = evalFixed(minsList, printed, margin, mode);
      if (!best || r.exact > best.exact || (r.exact === best.exact && r.within1 > best.within1) ||
          (r.exact === best.exact && r.within1 === best.within1 && r.worst < best.worst)) best = r;
    }
  }
  return best;
}

// Best angle for one twilight column, margin swept independently at each angle.
export function bestAngle(minsListFor, printed, { lo = 14, hi = 20, step = 0.05, m0 = -5, jMax = 12 } = {}) {
  let best = null;
  for (let angle = lo; angle <= hi + 1e-9; angle += step) {
    const r = bestMargin(minsListFor(angle), printed, { m0, jMax });
    r.angle = +angle.toFixed(2);
    if (!best || r.exact > best.exact || (r.exact === best.exact && r.within1 > best.within1) ||
        (r.exact === best.exact && r.within1 === best.within1 && r.worst < best.worst)) best = r;
  }
  return best;
}

export function stats(arr) {
  const a = [...arr].sort((x, y) => x - y);
  const med = a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
  return { n: a.length, min: +a[0].toFixed(2), max: +a[a.length - 1].toFixed(2), med: +med.toFixed(2) };
}
