// Builds recipe.json from the fitted parameters and the two offset tables.
// Run after fit.mjs: TZ=Europe/London node recipe-build.mjs
import fs from 'fs';


const OUT = new URL('./', import.meta.url).pathname;
const tables = JSON.parse(fs.readFileSync(OUT + 'stage5-tables.json', 'utf8'));
const scores = JSON.parse(fs.readFileSync(OUT + 'stage4-scores.json', 'utf8'));
const coords = JSON.parse(fs.readFileSync(OUT + 'stage12-coordinate-fit.json', 'utf8')).top[0];
const angleScan = JSON.parse(fs.readFileSync(OUT + 'stage3b-angle-scan.json', 'utf8'));
const runs = JSON.parse(fs.readFileSync(OUT + 'stage3-offset-runs.json', 'utf8'));

const lat = coords.lat;
const lon = coords.lon;
const margins = Object.fromEntries(['sunrise', 'dhuhr', 'asr', 'magrib'].map((c) => [c, coords.cols[c].margin]));

const tableF = tables.fajrLeadMinutes;
const tableI = tables.ishaLagMinutes;
const leap = (a, b) => Math.round((a + b) / 2);
const withLeapDay = (t) => {
  const out = {};
  const keys = Object.keys(t).sort();
  for (const k of keys) {
    if (k === '03-01') out['02-29'] = leap(t['02-28'], t['03-01']);
    out[k] = t[k];
  }
  return out;
};

const recipe = {
  schema: 'prayer-timetable-recipe/1',
  recoveredFrom: '2027.json (365 days, London Unified Prayer Timetable)',
  timezone: 'Europe/London',
  coordinates: {
    latitude: lat,
    longitude: lon,
    note: 'Fit parameter. Longitude trades off exactly against the per-prayer minute margins (1 minute of time = 0.25 degree of longitude), so the pair (longitude, margins) is what reproduces the table, not longitude alone.',
  },
  rounding: {
    rule: 'nearest-minute, halves up',
    formula: 'minute = floor(seconds/60 + 0.5)',
    note: 'Times are formed at second resolution, the margin is added, and only then is the result rounded to the whole minute.',
  },
  solarModel: {
    position: 'Meeus / Astronomical Algorithms solar position: apparent declination, right ascension, apparent sidereal time',
    transit: 'refined transit (approximate transit corrected with the previous and next solar right ascension)',
    declination: 'apparent solar declination evaluated once at 12:00 UT of the civil date and reused for every hour angle of that date',
    declinationEvidence: 'Using the declination at the event instant instead of 12:00 UT inflates the sunrise residual band from 1.02 to 2.05 minutes and the asr band from 1.02 to 3.55 minutes; a single noon evaluation collapses all four solar columns onto a one-minute rounding window.',
    horizonAltitudeDegrees: -0.8333,
    horizonNote: 'Standard refraction plus solar semidiameter. No other horizon angle improves the fit.',
    referenceImplementation: 'adhan-js 4.4.6 SolarTime (transit) + SolarCoordinates (julianDay + 0.5); any correct Meeus implementation reproduces this to under a second.',
  },
  prayers: {
    sunrise: { rule: 'horizon', altitudeDegrees: -0.8333, side: 'beforeTransit', marginMinutes: margins.sunrise },
    dhuhr: { rule: 'transit', marginMinutes: margins.dhuhr },
    asr: { rule: 'shadow', shadowFactor: 1, marginMinutes: margins.asr, note: 'Shadow length equal to the object height plus the noon shadow (Shafi). Shadow factor 2 (Hanafi) misses by 27 to 73 minutes.' },
    magrib: { rule: 'horizon', altitudeDegrees: -0.8333, side: 'afterTransit', marginMinutes: margins.magrib },
    fajr: {
      rule: 'offsetFromPrayer',
      base: 'sunrise',
      direction: 'before',
      unit: 'minutes',
      table: withLeapDay(tableF),
      note: 'Whole minutes before the published sunrise, keyed MM-DD. Not an angle: see FIT-REPORT.md.',
    },
    isha: {
      rule: 'offsetFromPrayer',
      base: 'magrib',
      direction: 'after',
      unit: 'minutes',
      table: withLeapDay(tableI),
      note: 'Whole minutes after the published maghrib, keyed MM-DD.',
    },
  },
  leapDay: {
    rule: '02-29 is absent from the 2027 source; both offset tables carry the rounded mean of 02-28 and 03-01.',
    fajrLeadMinutes: withLeapDay(tableF)['02-29'],
    ishaLagMinutes: withLeapDay(tableI)['02-29'],
  },
  dst: {
    rule: 'All times are London civil time. Compute the event as a UTC instant, then read the Europe/London offset for that instant (0 in winter, +60 minutes in summer). No fixed offset assumption.',
    transitions: 'last Sunday of March and last Sunday of October, 01:00 UTC',
  },
  algorithm: [
    'For a civil date D at the recipe coordinates, compute the solar transit as a UTC hour. Convert it to London wall-clock minutes with the Europe/London offset at that instant.',
    'Compute the apparent solar declination for 12:00 UT of D. Use that one declination for every hour angle of D.',
    'Hour angle in minutes: (180/pi) * acos((sin(h) - sin(lat)sin(dec)) / (cos(lat)cos(dec))) / 15 * 60, with h the event altitude in degrees.',
    'sunrise = transitMinutes - hourAngle(-0.8333) - 3, then round half up.',
    'magrib = transitMinutes + hourAngle(-0.8333) + 3, then round half up.',
    'dhuhr = transitMinutes + 5, then round half up.',
    'asr altitude = atan(1 / (1 + tan(|lat - dec|))) in degrees; asr = transitMinutes + hourAngle(asrAltitude) + 2, then round half up.',
    'fajr = (rounded sunrise) - fajrLeadMinutes[D.slice(5)].',
    'isha = (rounded magrib) + ishaLagMinutes[D.slice(5)].',
    'The offsets are applied to the already rounded sunrise and magrib, not to the raw solar times. This ordering is what makes the lead and lag exact whole minutes every day.',
  ],
  offsets: {
    fajrLeadMinutes: { min: runs.fajrLead.min, max: runs.fajrLead.max, distinctValues: runs.fajrLead.distinct.length, constantRuns: runs.fajrLead.runs.length },
    ishaLagMinutes: { min: runs.ishaLag.min, max: runs.ishaLag.max, distinctValues: runs.ishaLag.distinct.length, constantRuns: runs.ishaLag.runs.length },
  },
  inSampleScores2027: scores,
  alternatives: [
    {
      name: 'fixed-angle fajr and isha',
      verdict: 'rejected',
      evidence: 'Best angle over 14.00-21.00 degrees in 0.05 steps: fajr 14.00 with residual sd 15.84 minutes (range -41.6 to +15.6), isha 14.00 with sd 29.09 (range -10.4 to +83.8). At 18 degrees ' + JSON.stringify(angleScan.fajr.at18) + '. No single angle, and no night-fraction bound, survives the summer: the published fajr never falls more than 121 minutes before sunrise and the published isha never more than 97 minutes after maghrib, so no high-latitude rule is applied at all.',
    },
    {
      name: 'absolute MM-DD time table for fajr and isha',
      verdict: 'equivalent in sample, weaker structurally',
      evidence: 'fajr and isha can also be stored as whole times rather than offsets. It reproduces 2027 identically, but the exact constancy of the lead and lag (78 days at 97 minutes for fajr, 33 days at 97 minutes for isha, while the corresponding angular separation moves by 3 minutes) shows the table was built as sunrise +/- whole minutes, so the offset form is the generating one.',
    },
    {
      name: 'absolute MM-DD time table for all six columns',
      verdict: 'higher in-sample score, not adopted as primary',
      evidence: 'A 366-entry table for every column reproduces 2027 at 365/365 on all six. It is recorded because the four solar columns were demonstrably computed for 2027 itself: their residuals against 2027 astronomy stay inside 0.03 minutes, which no table reused from an earlier year would do. The astronomy form therefore generalises across years, which is what a generator for 2028-2038 needs.',
    },
    {
      name: 'high-latitude night-fraction rule',
      verdict: 'not needed, not detected',
      evidence: 'The only bounded season is the summer, and there the columns are pure offsets from sunrise and maghrib. No night-fraction clamp changes any published minute.',
    },
  ],
};

fs.writeFileSync(OUT + 'recipe.json', JSON.stringify(recipe, null, 1));
console.log('recipe.json written:', lat, lon, JSON.stringify(margins), 'leap', recipe.leapDay.fajrLeadMinutes, recipe.leapDay.ishaLagMinutes);
