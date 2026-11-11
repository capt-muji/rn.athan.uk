// Shared machinery for the T-25 moonsighting2 workspace. Census discipline:
// adhan 4.4.6 at second resolution, dates built from the data's own strings,
// no clock reads, TZ comes from the runner's env. Every number the reports
// carry is emitted by these functions.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const ADHAN = process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/';

export async function loadAdhan() {
  const mod = await import(pathToFileURL(ADHAN + 'Adhan.js'));
  const { default: SolarTime } = await import(pathToFileURL(ADHAN + 'SolarTime.js'));
  const { default: TimeComponents } = await import(pathToFileURL(ADHAN + 'TimeComponents.js'));
  return { ...mod, SolarTime, TimeComponents };
}

// "H:MM"/"HH:MM" -> minutes of day on the 24h clock.
export function parseHHMM24(str) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(str).trim());
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

// "07:03 AM"/"05:47 PM" -> minutes of day.
export function parse12h(str) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(str).trim());
  if (!m) return null;
  let h = parseInt(m[1], 10) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return h * 60 + parseInt(m[2], 10);
}

// A cell parse is null when absent or unprinted ("--:--"); callers carry the
// gap, never impute it. pm12 maps a 1-12 printed hour to the afternoon (the
// dpt-family feeds print "5:42" for 17:42); fajr is never pm12.
export function parseCell(str, pm12 = false) {
  const v = parse12h(str) ?? parseHHMM24(str);
  if (v == null || !pm12) return v;
  const h = Math.floor(v / 60);
  return h >= 1 && h < 12 ? v + 720 : v;
}

// Load one surface's rows. Accepts: a top-level date map; a city-keyed map of
// date maps (cfg.city); an optional cfg.year keeping one calendar year's keys;
// and cfg.alsoFiles merging further date maps (the London truth control). Any
// prayer cell absent/unprinted on a day stays null - the gap is carried, never
// imputed.
export function loadSurface(cfg) {
  const read = (p) => JSON.parse(fs.readFileSync(resolve(p), 'utf8'));
  let raw = [read(cfg.file), ...(cfg.alsoFiles ?? []).map(read)];
  let days = [];
  for (const part of raw) {
    let dates = part;
    if (cfg.city) {
      dates = part[cfg.city];
      if (!dates) throw new Error(`city ${cfg.city} not in a truth file`);
    }
    for (const key of Object.keys(dates).sort()) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue;
      if (cfg.year && !key.startsWith(cfg.year)) continue;
      const row = dates[key];
      if (!row || typeof row !== 'object') continue;
      const day = { key };
      for (const [prayer, col] of Object.entries(cols(cfg))) {
        if (col == null) { day[prayer] = null; continue; }
        day[prayer] = parseCell(row[col], cfg.pm12 && prayer !== 'fajr');
      }
      // Sunrise/maghrib feed the Tromsoe synthetic-day detector when present.
      day.sunrise = parseCell(row.sunrise ?? row.Sunrise);
      day.maghrib = parseCell(row.maghrib ?? row.magrib ?? row.Maghrib, cfg.pm12);
      days.push(day);
    }
  }
  days.sort((a, b) => (a.key < b.key ? -1 : 1));
  return { days };
}

function cols(cfg) {
  return cfg.cols || { fajr: 'fajr', isha: 'isha' };
}

function resolve(p) {
  const HOME = process.env.HOME;
  if (p === '$O1G/data/2027.json') return HOME + '/athan-gitree/census/o1g-decade/data/2027.json';
  if (p === '$O1G/truth/truth-2028-2038.json') return HOME + '/athan-gitree/census/o1g-decade/truth/truth-2028-2038.json';
  return new URL('../' + p, import.meta.url).pathname;
}

// Synthetic-day detector (fit8's rule): a real printed sunrise/maghrib pair
// straddles the computed transit symmetrically; a polar-substituted pair is
// off transit by an hour or more. A maghrib printed after midnight belongs to
// the same night, so it folds forward before the midpoint is taken.
export function syntheticDay(day, transitMin) {
  if (day.sunrise == null || day.maghrib == null) return false;
  const maghrib = day.maghrib < day.sunrise ? day.maghrib + 1440 : day.maghrib;
  const mid = (day.sunrise + maghrib) / 2;
  const diff = Math.abs(((mid - transitMin + 720) % 1440 + 1440) % 1440 - 720);
  return diff > 60;
}

export function stats(devs) {
  const n = devs.length;
  if (!n) return { days: 0, mean: null, worst: null, within2: null };
  let sum = 0, worst = 0, w2 = 0;
  for (const d of devs) {
    const a = Math.abs(d);
    sum += a;
    if (a > worst) worst = a;
    if (a <= 2) w2++;
  }
  return {
    days: n,
    mean: Math.round((sum / n) * 100) / 100,
    worst: Math.round(worst * 10) / 10,
    within2: Math.round((w2 / n) * 1000) / 10,
  };
}

export function monthMean(devs, days, month, key) {
  const sel = days.filter((d) => d.key.slice(5, 7) === month).map((d) => d[`dev_${key}`]).filter((v) => v != null);
  return stats(sel).mean;
}

// Score one surface: naked MoonsightingCommittee (adhan preset verbatim,
// Shafi madhab default, nearest-minute rounding) against every printed row.
// The method is never tuned: identical inputs reproduce identical output.
export async function scoreSurface(cfg) {
  const adhan = await loadAdhan();
  const coords = new adhan.Coordinates(cfg.lat, cfg.lon);
  const params = adhan.CalculationMethod.MoonsightingCommittee();
  const { days } = loadSurface(cfg);
  for (const day of days) {
    const [y, m, d] = day.key.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const pt = new adhan.PrayerTimes(coords, date, params);
    const st = new adhan.SolarTime(date, coords);
    const transit = new adhan.TimeComponents(st.transit).utcDate(y, m - 1, d);
    // A polar-night date yields no sunrise, so the naked preset prints no
    // fajr/isha there: carried as undefined (the o1h vocabulary), never
    // imputed - the committee's own documented rule for that case (slide
    // down in 0.1-degree steps) is not implemented by the library.
    const mcFajrRaw = pt.fajr, mcIshaRaw = pt.isha;
    day.mcFajr = isValidDate(mcFajrRaw) ? nearestMinute(mcFajrRaw) : null;
    day.mcIsha = isValidDate(mcIshaRaw) ? nearestMinute(mcIshaRaw) : null;
    day.dev_fajr = day.fajr != null && day.mcFajr != null ? day.mcFajr - day.fajr : null;
    day.dev_isha = day.isha != null && day.mcIsha != null ? day.mcIsha - day.isha : null;
    // 24h-circle read: an isha printed just after midnight belongs to the
    // same night, so a +/-12h gap folds back.
    for (const k of ['dev_fajr', 'dev_isha']) {
      if (day[k] != null && day[k] > 720) day[k] -= 1440;
      if (day[k] != null && day[k] < -720) day[k] += 1440;
    }
    const detector = syntheticDay(day, transit.getHours() * 60 + transit.getMinutes() + (transit.getSeconds() >= 30 ? 1 : 0));
    day.detectorSynthetic = detector || undefined;
    day.synthetic = cfg.syntheticRanges ? inRanges(day.key, cfg.syntheticRanges) : detector;
  }
  const honest = days.filter((d) => !d.synthetic);
  const scored = {
    id: cfg.id,
    place: cfg.place,
    lat: cfg.lat,
    band: cfg.band,
    tier: cfg.tier,
    source: cfg.source,
    rows: days.length,
    fajr: stats(days.filter((d) => d.dev_fajr != null).map((d) => d.dev_fajr)),
    isha: stats(days.filter((d) => d.dev_isha != null).map((d) => d.dev_isha)),
  };
  scored.fajr.jan = monthMean(days, days, '01', 'fajr');
  scored.fajr.jul = monthMean(days, days, '07', 'fajr');
  scored.isha.jan = monthMean(days, days, '01', 'isha');
  scored.isha.jul = monthMean(days, days, '07', 'isha');
  if (honest.length !== days.length) {
    scored.syntheticDays = days.length - honest.length;
    scored.honestFajr = stats(honest.filter((d) => d.dev_fajr != null).map((d) => d.dev_fajr));
    scored.honestIsha = stats(honest.filter((d) => d.dev_isha != null).map((d) => d.dev_isha));
  }
  scored.missingFajr = days.filter((d) => d.fajr == null).length;
  scored.missingIsha = days.filter((d) => d.isha == null).length;
  scored.undefinedFajr = days.filter((d) => d.fajr != null && d.mcFajr == null).length;
  scored.undefinedIsha = days.filter((d) => d.isha != null && d.mcIsha == null).length;
  return { scored, days };
}

function isValidDate(d) {
  return d instanceof Date && !isNaN(d.getTime());
}

function inRanges(key, ranges) {
  return ranges.some((r) => {
    const [lo, hi] = r.split('/');
    return key >= lo && key <= hi;
  });
}

function nearestMinute(date) {
  // Wall-clock nearest minute in the runner's TZ.
  return date.getHours() * 60 + date.getMinutes() + (date.getSeconds() >= 30 ? 1 : 0);
}
