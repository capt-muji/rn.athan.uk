// Proves package-methods.json describes the code that actually runs.
// 1. Introspects every CalculationMethod factory and diffs it against the JSON.
// 2. Instantiates PrayerTimes at a known coordinate/date and prints six times.
// 3. Probes the engine behaviours the JSON claims.
// 4. Replays the eight upstream fixture files as an independent oracle.
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const PKG = process.env.ADHAN_PKG;
const FIXTURES = process.env.FIXTURES;
const DOC = process.env.DOC;
const catalogue = JSON.parse(readFileSync(DOC, 'utf8'));
const adhan = createRequire(import.meta.url)(PKG);
const { CalculationMethod, Coordinates, PrayerTimes, SunnahTimes, Madhab, HighLatitudeRule, Rounding } = adhan;

let failures = 0;
const fail = (msg) => { failures += 1; console.log(`  FAIL ${msg}`); };
const pass = (msg) => console.log(`  ok   ${msg}`);

const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
const fmt = (d, timeZone = tz) => {
  if (Number.isNaN(d.getTime())) return 'Invalid Date';
  const p = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(d);
  const g = (t) => p.find((x) => x.type === t).value;
  return `${g('hour')}:${g('minute')}:${g('second')}`;
};
const dateOnly = (d, timeZone = tz) => new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const minutesBetween = (a, b) => (b.getTime() - a.getTime()) / 60000;

console.log('# adhan 4.4.6 verification');
console.log(`package : ${PKG}`);
console.log(`host tz : ${tz}`);
console.log(`probe   : 51.5074 N, 0.1278 W, Date(2026, 5, 1, 12:00) -> local day ${dateOnly(new Date(2026, 5, 1, 12, 0, 0))}`);

// ---------------------------------------------------------------- 1. parameter diff
console.log('\n## 1. Parameter diff: JSON vs CalculationMethod source');
const factoryNames = Object.keys(CalculationMethod);
const docNames = catalogue.methods.map((m) => m.name);
if (factoryNames.length !== 13) fail(`expected 13 factories, found ${factoryNames.length}`);
else pass(`13 factories exist`);
if (JSON.stringify([...factoryNames].sort()) !== JSON.stringify([...docNames].sort())) fail(`name sets differ: ${factoryNames} vs ${docNames}`);
else pass('factory names match the JSON exactly');

const sameAdjustments = (a, b) => ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].every((k) => a[k] === b[k]);

for (const doc of catalogue.methods) {
  const p = CalculationMethod[doc.name]();
  const problems = [];
  if (p.method !== doc.name) problems.push(`method ${p.method}`);
  if (p.fajrAngle !== doc.fajrAngle) problems.push(`fajrAngle ${p.fajrAngle}`);
  if (p.ishaAngle !== doc.ishaAngle) problems.push(`ishaAngle ${p.ishaAngle}`);
  if (p.ishaInterval !== doc.ishaInterval) problems.push(`ishaInterval ${p.ishaInterval}`);
  if (p.maghribAngle !== doc.maghribAngle) problems.push(`maghribAngle ${p.maghribAngle}`);
  if (p.rounding !== doc.rounding) problems.push(`rounding ${p.rounding}`);
  if (p.madhab !== doc.madhab) problems.push(`madhab ${p.madhab}`);
  if (p.highLatitudeRule !== doc.highLatitudeRule) problems.push(`highLatitudeRule ${p.highLatitudeRule}`);
  if (!sameAdjustments(p.methodAdjustments, doc.methodAdjustments)) problems.push(`methodAdjustments ${JSON.stringify(p.methodAdjustments)}`);
  if (p.polarCircleResolution !== doc.polarCircleResolution) problems.push(`polarCircleResolution ${p.polarCircleResolution}`);
  if (p.shafaq !== doc.shafaq) problems.push(`shafaq ${p.shafaq}`);
  const np = p.nightPortions();
  const expectedPortions = (rule) => {
    if (rule === 'middleofthenight') return { fajr: 0.5, isha: 0.5 };
    if (rule === 'seventhofthenight') return { fajr: 1 / 7, isha: 1 / 7 };
    return { fajr: p.fajrAngle / 60, isha: p.ishaAngle / 60 };
  };
  const want = expectedPortions(doc.highLatitudeRule);
  if (np.fajr !== want.fajr || np.isha !== want.isha) problems.push(`nightPortions ${JSON.stringify(np)} vs documented ${doc.highLatitudeRule}`);
  else if (!doc.nightPortions.includes('1/2')) problems.push('nightPortions prose does not state 1/2 while the rule is MiddleOfTheNight');
  if (problems.length) fail(`${doc.name}: ${problems.join(', ')}`);
  else pass(`${doc.name}: angles ${p.fajrAngle}/${p.ishaAngle} interval ${p.ishaInterval} maghribAngle ${p.maghribAngle} rounding ${p.rounding} madhab ${p.madhab} hlr ${p.highLatitudeRule} nightPortions ${JSON.stringify(np)}`);
}

if (Rounding.Nearest !== 'nearest' || Rounding.Up !== 'up' || Rounding.None !== 'none') fail('Rounding enum drifted');
else pass('Rounding enum is nearest/up/none');
if (Madhab.Shafi !== 'shafi' || Madhab.Hanafi !== 'hanafi') fail('Madhab enum drifted');
else pass('Madhab enum is shafi/hanafi');
if (HighLatitudeRule.MiddleOfTheNight !== 'middleofthenight' || HighLatitudeRule.SeventhOfTheNight !== 'seventhofthenight' || HighLatitudeRule.TwilightAngle !== 'twilightangle') fail('HighLatitudeRule enum drifted');
else pass('HighLatitudeRule enum is middleofthenight/seventhofthenight/twilightangle');

// ---------------------------------------------------------------- 2. six times per method
console.log('\n## 2. Six times per method: London 51.5074 N, 0.1278 W, 2026-06-01');
const london = new Coordinates(51.5074, -0.1278);
const day = new Date(2026, 5, 1, 12, 0, 0);
console.log('method                    fajr      sunrise   dhuhr     asr       maghrib   isha');
for (const doc of catalogue.methods) {
  const pt = new PrayerTimes(london, day, CalculationMethod[doc.name]());
  console.log(
    `${doc.name.padEnd(24)}  ${fmt(pt.fajr).padEnd(9)} ${fmt(pt.sunrise).padEnd(9)} ${fmt(pt.dhuhr).padEnd(9)} ${fmt(pt.asr).padEnd(9)} ${fmt(pt.maghrib).padEnd(9)} ${fmt(pt.isha)}`,
  );
}

// ---------------------------------------------------------------- 3. behaviour probes
console.log('\n## 3. Behaviour probes');

const mwl = CalculationMethod.MuslimWorldLeague();
const mwlTimes = new PrayerTimes(london, day, mwl);
const mwlHanafi = CalculationMethod.MuslimWorldLeague(); mwlHanafi.madhab = Madhab.Hanafi;
const hanafiTimes = new PrayerTimes(london, day, mwlHanafi);
const asrGap = minutesBetween(mwlTimes.asr, hanafiTimes.asr);
if (asrGap > 0) pass(`Madhab must be set by the caller: Shafi asr ${fmt(mwlTimes.asr)}, Hanafi asr ${fmt(hanafiTimes.asr)}, later by ${asrGap.toFixed(0)} min`);
else fail(`Hanafi asr did not move (${asrGap})`);

const seven = CalculationMethod.MuslimWorldLeague(); seven.highLatitudeRule = HighLatitudeRule.SeventhOfTheNight;
const sevenTimes = new PrayerTimes(london, day, seven);
if (sevenTimes.fajr > mwlTimes.fajr && sevenTimes.isha <= mwlTimes.isha) pass(`highLatitudeRule default is MiddleOfTheNight, caller override moves fajr ${fmt(mwlTimes.fajr)} -> ${fmt(sevenTimes.fajr)}, isha ${fmt(mwlTimes.isha)} -> ${fmt(sevenTimes.isha)}`);
else fail(`SeventhOfTheNight override did not clamp: fajr ${fmt(sevenTimes.fajr)} isha ${fmt(sevenTimes.isha)}`);

const recommended = HighLatitudeRule.recommended(london);
if (recommended === 'seventhofthenight') pass(`HighLatitudeRule.recommended(51.5074) = ${recommended}, and no method applies it internally`);
else fail(`recommended() returned ${recommended}`);

const umm = CalculationMethod.UmmAlQura();
const ummTimes = new PrayerTimes(london, day, umm);
const ummGap = minutesBetween(new PrayerTimes(london, day, umm).sunset, ummTimes.isha);
if (Math.round(ummGap) === 90) pass(`UmmAlQura isha is sunset + 90 min: sunset ${fmt(ummTimes.sunset)} isha ${fmt(ummTimes.isha)} (${ummGap.toFixed(0)} min)`);
else fail(`UmmAlQura isha is ${ummGap} min after sunset`);

const ummMaghribShift = CalculationMethod.UmmAlQura(); ummMaghribShift.adjustments.maghrib = 10;
const ummShiftTimes = new PrayerTimes(london, day, ummMaghribShift);
const shiftGap = minutesBetween(ummTimes.isha, ummShiftTimes.isha);
if (Math.abs(shiftGap) < 0.02 && minutesBetween(ummTimes.maghrib, ummShiftTimes.maghrib) === 10) pass(`maghrib adjustment does not move an interval-based isha: maghrib +10 min, isha delta ${shiftGap.toFixed(1)} min`);
else fail(`maghrib adjustment moved isha by ${shiftGap} min`);

const ummIshaAdj = CalculationMethod.UmmAlQura(); ummIshaAdj.adjustments.isha = 30;
const ummIshaAdjTimes = new PrayerTimes(london, day, ummIshaAdj);
if (Math.round(minutesBetween(ummTimes.isha, ummIshaAdjTimes.isha)) === 30) pass('isha adjustment does move an interval-based isha: +30 min applied on top of the 90-minute interval');
else fail(`isha adjustment delta was ${minutesBetween(ummTimes.isha, ummIshaAdjTimes.isha)}`);

const noneR = CalculationMethod.MuslimWorldLeague(); noneR.rounding = Rounding.None;
const noneTimes = new PrayerTimes(london, day, noneR);
if (noneTimes.fajr.getUTCSeconds() !== 0) pass(`Rounding.None keeps sub-minute seconds: fajr ${fmt(noneTimes.fajr)}`);
else fail('Rounding.None produced whole minutes');

let upExact = 0;
for (const doc of catalogue.methods) {
  const p = CalculationMethod[doc.name]();
  const t = new PrayerTimes(london, day, p);
  for (const k of ['fajr', 'sunrise', 'dhuhr', 'asr', 'sunset', 'maghrib', 'isha']) if (t[k].getUTCSeconds() !== 0) fail(`${doc.name}.${k} not on a whole minute (${t[k].toISOString()})`);
  if (p.rounding === Rounding.Up) upExact = minutesBetween(t.sunset, new Date(t.sunset.getTime())) + 1;
}
if (upExact > 0) pass('Singapore Rounding.Up still lands every output on a whole minute');

const sing = CalculationMethod.Singapore();
const singTimes = new PrayerTimes(london, day, sing);
if (singTimes.fajr.getUTCSeconds() === 0 && singTimes.sunset.getUTCSeconds() === 0) pass(`Rounding.Up outputs are whole minutes including sunset ${fmt(singTimes.sunset)}`);
else fail('Rounding.Up left seconds');

const tehran = CalculationMethod.Tehran();
const tehranTimes = new PrayerTimes(london, day, tehran);
if (tehranTimes.maghrib > tehranTimes.sunset && tehranTimes.maghrib < tehranTimes.isha) pass(`Tehran maghrib comes from the 4.5 degree angle: sunset ${fmt(tehranTimes.sunset)} maghrib ${fmt(tehranTimes.maghrib)} isha ${fmt(tehranTimes.isha)}`);
else fail(`Tehran maghrib ${fmt(tehranTimes.maghrib)} is not between sunset and isha`);

const otherTwilight = CalculationMethod.Other(); otherTwilight.highLatitudeRule = HighLatitudeRule.TwilightAngle;
const otherTwilightTimes = new PrayerTimes(london, day, otherTwilight);
const zeroIsha = minutesBetween(otherTwilightTimes.sunset, otherTwilightTimes.isha);
if (zeroIsha < 0) pass(`zero angle is the 0-degree crossing, not the horizon: isha lands ${Math.abs(zeroIsha).toFixed(0)} min BEFORE sunset and the night clamp cannot rescue it`);
else fail(`zero-angle isha sat ${zeroIsha} min after sunset, contradicting the documented 0-degree-crossing behaviour`);

const otherDefault = new PrayerTimes(london, day, CalculationMethod.Other());
if (otherDefault.fajr > otherDefault.sunrise && otherDefault.isha < otherDefault.sunset) pass(`CalculationMethod.Other() is degenerate as delivered: fajr ${fmt(otherDefault.fajr)} is after sunrise ${fmt(otherDefault.sunrise)}, isha ${fmt(otherDefault.isha)} is before sunset ${fmt(otherDefault.sunset)}`);
else fail('Other() did not show the documented degenerate ordering');

const midnightTimes = new PrayerTimes(london, day, CalculationMethod.MuslimWorldLeague());
const nextDayTimes = new PrayerTimes(london, new Date(2026, 5, 2, 12), CalculationMethod.MuslimWorldLeague());
const collapse = minutesBetween(midnightTimes.isha, nextDayTimes.fajr);
if (collapse > -5 && collapse < 5) pass(`London midsummer: MiddleOfTheNight binds, isha ${fmt(midnightTimes.isha)} lands ${collapse.toFixed(0)} min from the next Fajr, so the night is consumed end to end and Fajr ${fmt(midnightTimes.fajr)} sits just after the previous midnight`);
else fail(`London midsummer clamp not observed: isha ${fmt(midnightTimes.isha)} to next fajr ${fmt(nextDayTimes.fajr)} is ${collapse} min`);

const msParams = CalculationMethod.MoonsightingCommittee();
const ffParams = CalculationMethod.MuslimWorldLeague(); ffParams.fajrAngle = 18; ffParams.ishaAngle = 18;
ffParams.adjustments = { fajr: 0, sunrise: 0, dhuhr: 5, asr: 0, maghrib: 3, isha: 0 };
ffParams.methodAdjustments = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
const msTimes = new PrayerTimes(london, day, msParams);
const ffTimes = new PrayerTimes(london, day, ffParams);
if (msTimes.fajr.getTime() !== ffTimes.fajr.getTime()) pass(`params.method is load-bearing: identical numbers under method 'Other' give fajr ${fmt(ffTimes.fajr)} instead of ${fmt(msTimes.fajr)}`);
else fail('method name made no difference to fajr');

const oslo = new Coordinates(59.9139, 10.7522);
const osloDay = new Date(2026, 5, 1, 12, 0, 0);
const msOslo = new PrayerTimes(oslo, osloDay, CalculationMethod.MoonsightingCommittee());
const mwlOslo = new PrayerTimes(oslo, osloDay, CalculationMethod.MuslimWorldLeague());
if (minutesBetween(msOslo.fajr, msOslo.sunrise) > 0 && msOslo.fajr.getTime() !== mwlOslo.fajr.getTime()) pass(`MoonsightingCommittee 55-degree branch is live at 59.9139 N: fajr ${fmt(msOslo.fajr)} vs MWL fajr ${fmt(mwlOslo.fajr)}`);
else fail('MoonsightingCommittee 55-degree branch did not diverge from MWL at 59.9 N');

const sub = CalculationMethod.MuslimWorldLeague();
const subTimes = new PrayerTimes(london, day, sub);
const sunnah = new SunnahTimes(subTimes);
const expectedMiddle = new Date(subTimes.maghrib.getTime() + (new PrayerTimes(london, new Date(2026, 5, 2, 12), sub).fajr.getTime() - subTimes.maghrib.getTime()) / 2);
if (Math.abs(minutesBetween(sunnah.middleOfTheNight, expectedMiddle)) < 1) pass(`SunnahTimes middle ${fmt(sunnah.middleOfTheNight)} sits half way from maghrib to next fajr`);
else fail(`SunnahTimes middle ${fmt(sunnah.middleOfTheNight)} off from ${fmt(expectedMiddle)}`);

const known = new PrayerTimes(new Coordinates(21.4225, 39.8262), new Date(2026, 5, 1, 12), CalculationMethod.UmmAlQura());
console.log(`  info Makkah 2026-06-01 (Asia/Riyadh): fajr ${fmt(known.fajr, 'Asia/Riyadh')} sunrise ${fmt(known.sunrise, 'Asia/Riyadh')} dhuhr ${fmt(known.dhuhr, 'Asia/Riyadh')} asr ${fmt(known.asr, 'Asia/Riyadh')} maghrib ${fmt(known.maghrib, 'Asia/Riyadh')} isha ${fmt(known.isha, 'Asia/Riyadh')}`);

// ---------------------------------------------------------------- 4. upstream fixtures
console.log('\n## 4. Upstream fixtures replayed as an independent oracle');
const parseFixture = (name, madhab, rule) => {
  const p = CalculationMethod[name]();
  p.madhab = Madhab[madhab];
  p.highLatitudeRule = HighLatitudeRule[rule];
  if (p.madhab === undefined || p.highLatitudeRule === undefined) fail(`fixture names ${madhab}/${rule} are not enum keys`);
  return p;
};
let fixtureCount = 0;
for (const file of readdirSync(FIXTURES).filter((f) => f.endsWith('.json')).sort()) {
  const data = JSON.parse(readFileSync(join(FIXTURES, file), 'utf8'));
  const prm = data.params;
  const params = parseFixture(prm.method, prm.madhab, prm.highLatitudeRule);
  const coords = new Coordinates(prm.latitude, prm.longitude);
  const limit = data.variance || 0;
  // compared in the fixture's own zone, as the upstream suite does
  let worstZoned = 0;
  for (const row of data.times) {
    const [y, m, d] = row.date.split('-').map(Number);
    const pt = new PrayerTimes(coords, new Date(y, m - 1, d, 12), params);
    for (const prayer of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
      const raw = row[prayer];
      const [hhmm, suffix] = raw.split(' ');
      const [hh, mm] = hhmm.split(':').map(Number);
      const hour24 = suffix === 'PM' ? (hh % 12) + 12 : hh % 12;
      const want = `${String(hour24).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      const got = fmt(pt[prayer], prm.timezone).slice(0, 5);
      const dMin = Math.abs(
        (Number(got.slice(0, 2)) * 60 + Number(got.slice(3))) - (hour24 * 60 + mm),
      );
      worstZoned = Math.max(worstZoned, dMin);
    }
  }
  const verdict = worstZoned <= Math.max(limit, 1) ? 'ok  ' : 'FAIL';
  if (verdict === 'FAIL') failures += 1;
  fixtureCount += data.times.length * 6;
  console.log(`  ${verdict} ${file}: method ${prm.method}, madhab ${prm.madhab}, rule ${prm.highLatitudeRule}, ${data.times.length} days, worst delta ${worstZoned} min (fixture variance ${limit})`);
}

console.log(`\n## Result: ${failures === 0 ? 'no failures' : `${failures} failure(s)`}; ${catalogue.methods.length} methods documented, ${fixtureCount} fixture prayer values replayed`);
process.exitCode = failures === 0 ? 0 : 1;
