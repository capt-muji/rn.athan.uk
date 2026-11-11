// Generator for the recovered London Unified Prayer Timetable recipe.
// Usage: TZ=Europe/London node predict.mjs 2027   (prints the year as JSON)
import fs from 'fs';
import { solarDay, asrAltitude } from './solar.mjs';

const HERE = new URL('./', import.meta.url).pathname;
const RECIPE = JSON.parse(fs.readFileSync(HERE + 'recipe.json', 'utf8'));
const halfUp = (x) => Math.floor(x + 0.5);
const pad = (n) => String(n).padStart(2, '0');
const toClock = (minutes) => {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};
const offsetFor = (table, monthDay) => {
  if (table[monthDay] !== undefined) return table[monthDay];
  throw new Error(`recipe table has no entry for ${monthDay}`);
};

export function generateYear(year) {
  const { prayers } = RECIPE;
  const lat = RECIPE.coordinates.latitude;
  const lon = RECIPE.coordinates.longitude;
  const out = {};
  const days = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
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
    const fajr = sunrise - offsetFor(prayers.fajr.table, monthDay);
    const isha = magrib + offsetFor(prayers.isha.table, monthDay);

    out[dateStr] = {
      date: dateStr,
      fajr: toClock(fajr),
      sunrise: toClock(sunrise),
      dhuhr: toClock(dhuhr),
      asr: toClock(asr),
      magrib: toClock(magrib),
      isha: toClock(isha),
    };
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const year = Number(process.argv[2] || 2027);
  const table = generateYear(year);
  if (process.argv[3] === '--check') {
    const data = JSON.parse(fs.readFileSync(new URL('../data/2027.json', import.meta.url).pathname, 'utf8'));
    let exact = 0, within1 = 0, total = 0, worst = 0;
    const per = {};
    const min = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
    for (const k of Object.keys(data)) {
      for (const c of ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha']) {
        const e = Math.abs(min(table[k][c]) - min(data[k][c]));
        per[c] ??= { exact: 0, within1: 0, worst: 0 };
        if (e === 0) per[c].exact++;
        if (e <= 1) per[c].within1++;
        if (e > per[c].worst) per[c].worst = e;
        total++; if (e === 0) exact++; if (e <= 1) within1++; if (e > worst) worst = e;
      }
    }
    console.log(JSON.stringify({ year, days: Object.keys(table).length, per, all: { exact, within1, total, worst } }, null, 1));
  } else {
    console.log(JSON.stringify(table, null, 1));
  }
}
