import { readFileSync, writeFileSync } from 'node:fs';
import { METHODS, methodDay, targetDay, truthDay, stats, ramadanSet, KEMENAG_ALIAS } from './lib.mjs';

const jobPath = process.argv[2];
const outPath = process.argv[3];
const job = JSON.parse(readFileSync(jobPath, 'utf8'));
const ramadan = ramadanSet([2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038]);

const seenZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const canonical = new Intl.DateTimeFormat('en-GB', { timeZone: job.tz }).resolvedOptions().timeZone;
if (seenZone !== canonical) {
  console.error(`TZ mismatch for ${job.id}: process is ${seenZone}, job is ${job.tz} (${canonical})`);
  process.exit(2);
}

const cells = {};
const targetDayCount = { fajr: 0, isha: 0 };
const devs = {};
for (const m of METHODS) devs[m.id] = { fajr: [], isha: [] };

for (const iso of job.dates) {
  const [y, mo, d] = iso.split('-').map(Number);
  const date = new Date(y, mo - 1, d);
  const isRamadan = ramadan.has(iso);
  const target = job.kind === 'truth'
    ? truthDay(job, iso)
    : targetDay({ ...job.recipe, lat: job.lat, lon: job.lon }, date, isRamadan);
  if (target && target.fajr !== null) targetDayCount.fajr += 1;
  if (target && target.isha !== null) targetDayCount.isha += 1;

  for (const m of METHODS) {
    const got = methodDay(m, job.lat, job.lon, date, isRamadan);
    if (target && target.fajr !== null && got.fajr !== null) {
      devs[m.id].fajr.push(Math.abs(normalise(got.fajr - target.fajr)));
    }
    if (target && target.isha !== null && got.isha !== null) {
      devs[m.id].isha.push(Math.abs(normalise(got.isha - target.isha)));
    }
  }
}

function normalise(minutes) {
  let d = minutes % 1440;
  if (d > 720) d -= 1440;
  if (d < -720) d += 1440;
  return d;
}

for (const m of METHODS) {
  const f = stats(devs[m.id].fajr);
  const i = stats(devs[m.id].isha);
  const combined = f.mean === null && i.mean === null
    ? null
    : (i.mean === null ? f.mean : (f.mean === null ? i.mean : (f.mean + i.mean) / 2));
  cells[m.id] = {
    fajr: f,
    isha: i,
    combined,
    asrMatch: m.asr === job.asrCountry,
  };
}

cells[KEMENAG_ALIAS].kemenagInstance = true;

writeFileSync(outPath, JSON.stringify({
  id: job.id,
  asrCountry: job.asrCountry,
  targetDays: targetDayCount,
  cells,
}, null, 1));
