// R13 shared helpers: London published timetable versus computed candidates.
// Read-only against the repository's captured data. No network.

import fs from 'node:fs';
import * as adhan from 'adhan';

export const DATA = '/Users/muji/athan-global-wt/ai/features/moonsighting/data/london';

export const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

/** The app's current source: the London Prayer Times year captured by wave 1. */
export const readLpt = () => {
  const j = readJson(`${DATA}/lpt-2026.json`);
  return j.times;
};

/** An ELM timetable year, normalised onto the LPT field names. */
export const readElm = (year) => {
  const j = readJson(`${DATA}/elm_timetable_${year}.json`);
  const out = {};
  for (const [date, row] of Object.entries(j)) {
    out[date] = {
      date,
      fajr: row.fajr,
      sunrise: row.sunrise,
      dhuhr: row.dhuhr,
      asr: row.asr_1 ?? row.asr,
      asr_2: row.asr_2,
      magrib: row.magrib,
      isha: row.isha,
    };
  }
  return out;
};

export const ELM_YEARS = [2012, 2013, 2014, 2015, 2017, 2018, 2019, 2020, 2021, 2022, 2025, 2026];

const londonClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

/**
 * Minutes since local midnight of `anchorIso` in Europe/London, to the second.
 * A time that falls on the next London day reads above 1440 rather than wrapping to a small
 * number, which is what `MiddleOfTheNight` Isha needs at 51.5 degrees in summer.
 */
export const londonMinutesExact = (d, anchorIso) => {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  const parts = londonClock.formatToParts(d);
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  const minutes = get('hour') * 60 + get('minute') + get('second') / 60;
  if (!anchorIso) return minutes;
  const iso = `${get('year')}-${String(get('month')).padStart(2, '0')}-${String(get('day')).padStart(2, '0')}`;
  const dayShift = Math.round((Date.UTC(...iso.split('-').map((v, i) => (i === 1 ? Number(v) - 1 : Number(v)))) -
    Date.UTC(...anchorIso.split('-').map((v, i) => (i === 1 ? Number(v) - 1 : Number(v))))) / 86_400_000);
  return minutes + dayShift * 1440;
};

export const toMin = (hhmm) => {
  if (typeof hhmm !== 'string') return null;
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
};

export const fmt = (minutes) => {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

export const datesOf = (year) => {
  const out = [];
  const d = new Date(Date.UTC(year, 0, 1));
  while (d.getUTCFullYear() === year) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
};

/** A local Date at noon UTC on the given day, which is what adhan wants as its date argument. */
export const dayDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
};

export const LONDON_GENERIC = new adhan.Coordinates(51.5072, -0.1276);
export const LONDON_HIZBUL = new adhan.Coordinates(51.5, -0.165);

/**
 * Compute a candidate's six times for one day, as exact London minutes (unrounded).
 * `spec.build(date)` returns adhan CalculationParameters with rounding None.
 */
export const computeDay = (iso, coords, params) => {
  const p = new adhan.PrayerTimes(coords, dayDate(iso), params);
  return {
    fajr: londonMinutesExact(p.fajr, iso),
    sunrise: londonMinutesExact(p.sunrise, iso),
    dhuhr: londonMinutesExact(p.dhuhr, iso),
    asr: londonMinutesExact(p.asr, iso),
    magrib: londonMinutesExact(p.maghrib, iso),
    isha: londonMinutesExact(p.isha, iso),
  };
};

export const FIELDS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];

/** Distribution of signed deltas, candidate minus published, in whole minutes. */
export const summarise = (deltas) => {
  const n = deltas.length;
  if (n === 0) return null;
  const abs = deltas.map(Math.abs);
  const sorted = [...deltas].sort((a, b) => a - b);
  const exact = abs.filter((x) => x === 0).length;
  const w1 = abs.filter((x) => x <= 1).length;
  const w2 = abs.filter((x) => x <= 2).length;
  const w5 = abs.filter((x) => x <= 5).length;
  const mean = deltas.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(deltas.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
  return {
    n,
    exact,
    w1,
    w2,
    w5,
    pctExact: (100 * exact) / n,
    pct1: (100 * w1) / n,
    pct2: (100 * w2) / n,
    pct5: (100 * w5) / n,
    min: sorted[0],
    max: sorted[n - 1],
    worstAbs: Math.max(...abs),
    mean,
    sd,
  };
};

export const histogram = (deltas) => {
  const h = new Map();
  for (const d of deltas) h.set(d, (h.get(d) ?? 0) + 1);
  return [...h.entries()].sort((a, b) => a[0] - b[0]);
};

export { adhan };
