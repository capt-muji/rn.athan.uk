// R3 fixture verification.
//
// The adhan family's strongest correctness claim is that eight JSON fixture files
// are shared byte-for-byte across the JS, Swift and Kotlin implementations, and
// that each fixture's values come from a named authority's own published
// timetable. This script tests the JS half of that claim by running `adhan` against
// every fixture and reporting whether it passes inside the fixture's own declared
// `variance`.
//
// It also reports what the fixtures do NOT cover, which is the more important
// result: the fixture suite is the entire CI evidence for correctness, so its
// gaps are the project's exposure.
//
// The fixtures must be downloaded first (see fetch_fixtures.sh).
//
// Run:  TZ=UTC node fixtures.mjs > fixtures.txt

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const adhan = await import('adhan');
const DIR = process.argv[2] ?? './fixtures/js';
const out = [];

function parseClock(s) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(s.trim());
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return h * 60 + Number(m[2]);
}

// The fixture times are wall clock in the fixture's own IANA zone, so the
// comparison has to be done in that zone rather than in UTC.
function localMinutes(date, tz) {
  if (!date || Number.isNaN(date.getTime())) return null;
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const h = Number(p.find((x) => x.type === 'hour').value) % 24;
  const mi = Number(p.find((x) => x.type === 'minute').value);
  return h * 60 + mi;
}

const METHODS = {
  MuslimWorldLeague: () => adhan.CalculationMethod.MuslimWorldLeague(),
  Egyptian: () => adhan.CalculationMethod.Egyptian(),
  Karachi: () => adhan.CalculationMethod.Karachi(),
  UmmAlQura: () => adhan.CalculationMethod.UmmAlQura(),
  Dubai: () => adhan.CalculationMethod.Dubai(),
  MoonsightingCommittee: () => adhan.CalculationMethod.MoonsightingCommittee(),
  NorthAmerica: () => adhan.CalculationMethod.NorthAmerica(),
  Kuwait: () => adhan.CalculationMethod.Kuwait(),
  Qatar: () => adhan.CalculationMethod.Qatar(),
  Singapore: () => adhan.CalculationMethod.Singapore(),
  Tehran: () => adhan.CalculationMethod.Tehran(),
  Turkey: () => adhan.CalculationMethod.Turkey(),
};

const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

out.push('## adhan@4.4.6 against its own shared fixtures');
out.push('');
out.push('`variance` is the fixture\'s own declared tolerance in minutes. `worst` is');
out.push('the largest absolute delta the library produced on that fixture. A fixture');
out.push('passes when `worst <= variance`, which is what `test/times.test.ts` L131');
out.push('asserts (it reads `data["variance"] || 0`, so a missing key means EXACT).');
out.push('');
out.push('| fixture | method | madhab | days | variance | worst | verdict | source authority |');
out.push('|---|---|---|---|---|---|---|---|');

let grandDays = 0;
const covered = new Set();

for (const file of readdirSync(DIR).filter((f) => f.endsWith('.json'))) {
  const raw = readFileSync(join(DIR, file), 'utf8');
  if (!raw.trim()) continue;
  const data = JSON.parse(raw);
  const p = data.params;
  const factory = METHODS[p.method];
  if (!factory) {
    out.push(`| ${file} | ${p.method} | - | - | - | - | METHOD NOT IN LIBRARY | - |`);
    continue;
  }
  covered.add(p.method);
  let worst = 0;
  let worstAt = '';
  for (const row of data.times) {
    const [y, m, d] = row.date.split('-').map(Number);
    const params = factory();
    params.madhab =
      p.madhab === 'Hanafi' ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;
    if (p.highLatitudeRule) {
      params.highLatitudeRule = adhan.HighLatitudeRule[p.highLatitudeRule];
    }
    const pt = new adhan.PrayerTimes(
      new adhan.Coordinates(p.latitude, p.longitude),
      new Date(Date.UTC(y, m - 1, d)),
      params,
    );
    for (const k of PRAYERS) {
      const expected = parseClock(row[k]);
      if (expected === null) continue;
      const got = localMinutes(pt[k], p.timezone);
      if (got === null) continue;
      let delta = got - expected;
      if (delta > 720) delta -= 1440;
      if (delta < -720) delta += 1440;
      if (Math.abs(delta) > worst) {
        worst = Math.abs(delta);
        worstAt = `${row.date} ${k} ${delta > 0 ? '+' : ''}${delta}`;
      }
    }
  }
  const variance = data.variance ?? 0;
  grandDays += data.times.length;
  const src = Array.isArray(data.source) ? data.source[0] : data.source;
  out.push(
    `| ${file.replace('.json', '')} | ${p.method} | ${p.madhab} | ${data.times.length} | ${variance} | ${worst} | ${worst <= variance ? 'PASS' : `FAIL (${worstAt})`} | ${src} |`,
  );
}

out.push('');
out.push(`Total fixture days across all files: ${grandDays}.`);
out.push('');
out.push('## Which of the library\'s 13 methods have any fixture at all');
out.push('');
out.push('| method | has a fixture |');
out.push('|---|---|');
for (const m of Object.keys(METHODS)) {
  out.push(`| ${m} | ${covered.has(m) ? 'yes' : 'NO'} |`);
}

console.log(out.join('\n'));
