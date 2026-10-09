// R14 part 5C: the decisive elevation test.
//
// JAKIM assigns separate zones to HIGH GROUND: PHG06 (Cameron Highlands, ~1,500 m),
// PRK07 (Bukit Larut, ~1,250 m), SBH06 (Gunung Kinabalu, ~1,500 m at Kinabalu Park HQ),
// KDH07 (Puncak Gunung Jerai, ~1,200 m). If JAKIM's published times for those zones
// already carry a horizon-dip correction, an app applying its OWN elevation correction
// would double-count and DIFFER from the authority.
//
// The test: compare each high zone's published Maghrib against a sea-level `adhan`
// computation at the same coordinate, and against the SAME comparison for a nearby
// LOW zone. If JAKIM applies a dip, the high zone's residual against a sea-level
// computation is larger (later Maghrib) than the low zone's by roughly the dip figure.
import fs from 'node:fs';
import { Coordinates, PrayerTimes, CalculationMethod, HighLatitudeRule, Rounding, Madhab } from './lib.mjs';
import { table } from './lib.mjs';

// Coordinates: the geographic centre of the named place in each zone, from GeoNames
// `cities15000` where the place is listed and from the place's own published coordinates
// otherwise. Elevations are the GeoNames `dem` value at that coordinate.
const ZONES = [
  { zone: 'PHG06', place: 'Cameron Highlands (Tanah Rata)', lat: 4.4694, lon: 101.3778, elev: 1440, high: true },
  { zone: 'PHG04', place: 'Raub', lat: 3.7944, lon: 101.8578, elev: 105, high: false, pairWith: 'PHG06' },
  { zone: 'PRK07', place: 'Bukit Larut', lat: 4.8631, lon: 100.7942, elev: 1250, high: true },
  { zone: 'PRK06', place: 'Taiping', lat: 4.85, lon: 100.7333, elev: 43, high: false, pairWith: 'PRK07' },
  { zone: 'SBH06', place: 'Gunung Kinabalu (Kinabalu Park)', lat: 6.0047, lon: 116.5581, elev: 1563, high: true },
  { zone: 'SBH07', place: 'Ranau', lat: 5.9544, lon: 116.6739, elev: 480, high: false, pairWith: 'SBH06' },
  { zone: 'KDH07', place: 'Puncak Gunung Jerai', lat: 5.7897, lon: 100.4361, elev: 1180, high: true },
  { zone: 'KDH02', place: 'Kuala Muda (Sungai Petani)', lat: 5.6472, lon: 100.4875, elev: 20, high: false, pairWith: 'KDH07' },
  { zone: 'SGR01', place: 'Shah Alam', lat: 3.0833, lon: 101.5333, elev: 30, high: false },
  { zone: 'WLY01', place: 'Kuala Lumpur', lat: 3.1412, lon: 101.6865, elev: 56, high: false },
];

const R = 6371000;
const dipDeg = (h) => (Math.acos(R / (R + h)) * 180) / Math.PI;

// Analytic sunset shift for an observer h metres up, at the given latitude and declination.
function sunsetShiftMin(latDeg, declDeg, h) {
  const lat = (latDeg * Math.PI) / 180;
  const dec = (declDeg * Math.PI) / 180;
  const H = (altDeg) => {
    const alt = (altDeg * Math.PI) / 180;
    const c = (Math.sin(alt) - Math.sin(lat) * Math.sin(dec)) / (Math.cos(lat) * Math.cos(dec));
    if (c < -1 || c > 1) return null;
    return (Math.acos(c) * 180) / Math.PI;
  };
  const a = H(-0.833);
  const b = H(-0.833 - dipDeg(h));
  if (a === null || b === null) return null;
  return ((b - a) / 15) * 60;
}

// Solar declination for a UTC date, low-precision but ample here.
function declination(date) {
  const n = (date.getTime() - Date.UTC(2026, 0, 1)) / 86400000;
  return -23.44 * Math.cos(((2 * Math.PI) / 365.25) * (n + 10));
}

const q = CalculationMethod.MuslimWorldLeague();
q.highLatitudeRule = HighLatitudeRule.SeventhOfTheNight;
q.rounding = Rounding.None;
q.madhab = Madhab.Shafi;

const CACHE = 'jakim-cache.json';
const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};

async function fetchZone(zone) {
  if (cache[zone]) return cache[zone];
  const url = `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=month&zone=${zone}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`${zone}: HTTP ${res.status}`);
  const j = await res.json();
  cache[zone] = j.prayerTime;
  fs.writeFileSync(CACHE, JSON.stringify(cache));
  return cache[zone];
}

const MON = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

function parseDay(row) {
  const [d, m, y] = row.date.split('-');
  return { y: Number(y), m: MON[m], d: Number(d) };
}

// Malaysia is UTC+8 with no DST, so the wall clock is a fixed offset from UTC.
const MY_OFFSET_MIN = 480;

function publishedMin(hhmmss) {
  const [h, mi] = hhmmss.split(':').map(Number);
  return h * 60 + mi;
}

function computedMin(lat, lon, ymd, key) {
  const date = new Date(Date.UTC(ymd.y, ymd.m, ymd.d, 12));
  const t = new PrayerTimes(new Coordinates(lat, lon), date, q);
  const v = t[key];
  if (!(v instanceof Date) || Number.isNaN(v.getTime())) return null;
  // convert the UTC instant to Malaysian wall-clock minutes of the day
  const utcMin = v.getTime() / 60000;
  const base = Date.UTC(ymd.y, ymd.m, ymd.d) / 60000;
  return utcMin - base + MY_OFFSET_MIN;
}

const out = [];
const say = (s = '') => out.push(s);

say('# R14 part 5C: does JAKIM already apply an elevation correction?');
say('');
say('JAKIM zone times fetched from `e-solat.gov.my` `esolatApi/takwimsolat`, `period=month`,');
say('on the date recorded in the report. Computed times from adhan@4.4.6 MWL, Rounding.None,');
say('at the named coordinate treated as SEA LEVEL. Residual = published minus computed, in');
say('minutes. A positive Maghrib residual means JAKIM publishes a LATER sunset than a');
say('sea-level computation, which is the signature of a horizon dip (or of a safety margin).');
say('');

for (const z of ZONES) await fetchZone(z.zone);

const results = [];
for (const z of ZONES) {
  const rows = cache[z.zone];
  const acc = { maghrib: [], syuruk: [], dhuhr: [] };
  for (const row of rows) {
    const ymd = parseDay(row);
    for (const [pub, key, name] of [
      [row.maghrib, 'maghrib', 'maghrib'],
      [row.syuruk, 'sunrise', 'syuruk'],
      [row.dhuhr, 'dhuhr', 'dhuhr'],
    ]) {
      const c = computedMin(z.lat, z.lon, ymd, key);
      if (c === null) continue;
      acc[name].push(publishedMin(pub) - c);
    }
  }
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const dec = mean(rows.map((r) => declination(new Date(Date.UTC(parseDay(r).y, parseDay(r).m, parseDay(r).d)))));
  results.push({
    ...z,
    n: acc.maghrib.length,
    maghrib: mean(acc.maghrib),
    syuruk: mean(acc.syuruk),
    dhuhr: mean(acc.dhuhr),
    decMean: dec,
    predictedDip: sunsetShiftMin(z.lat, dec, z.elev),
  });
}

say('## The residual of each zone against a sea-level computation at its own coordinate');
say('');
say(
  table(
    ['zone', 'place', 'elev m', 'days', 'Maghrib resid', 'Syuruk resid', 'Dhuhr resid', 'dip predicts'],
    results.map((r) => [
      '`' + r.zone + '`',
      r.place,
      String(r.elev),
      String(r.n),
      r.maghrib.toFixed(2),
      r.syuruk.toFixed(2),
      r.dhuhr.toFixed(2),
      r.high ? '+' + r.predictedDip.toFixed(2) : r.predictedDip.toFixed(2),
    ])
  )
);
say('');

say('## The decomposition that needs no elevation guess');
say('');
say('A horizon dip is ANTISYMMETRIC: it moves sunset later by X and sunrise earlier by X.');
say('A safety margin is SYMMETRIC: it moves both later. So from the two residuals:');
say('');
say('  dip component    = (maghribResid - syurukResid) / 2');
say('  margin component = (maghribResid + syurukResid) / 2');
say('');
say('The dip component is then inverted to the elevation that would produce it, which is a');
say('measurement of what JAKIM used rather than a guess at what the ground is.');
say('');
{
  // invert the dip: find h such that sunsetShiftMin(lat, dec, h) == target
  const solveElev = (lat, dec, target) => {
    if (target <= 0) return 0;
    let lo = 0;
    let hi = 9000;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      const v = sunsetShiftMin(lat, dec, mid);
      if (v === null || v < target) lo = mid;
      else hi = mid;
    }
    return lo;
  };
  const rows = results.map((r) => {
    const dip = (r.maghrib - r.syuruk) / 2;
    const margin = (r.maghrib + r.syuruk) / 2;
    const dec = r.decMean;
    return [
      '`' + r.zone + '`',
      r.place,
      String(r.elev),
      dip.toFixed(2),
      margin.toFixed(2),
      Math.round(solveElev(r.lat, dec, dip)).toLocaleString('en-GB'),
    ];
  });
  say(
    table(
      ['zone', 'place', 'assumed elev m', 'dip component min', 'symmetric margin min', 'elevation the dip implies, m'],
      rows
    )
  );
}
say('');

say('## The paired test: high zone against its low-ground neighbour');
say('');
say('If JAKIM applied a dip, the high zone would show a Maghrib residual LARGER than its');
say('low neighbour by roughly the dip difference, and a Syuruk residual SMALLER by the same.');
say('');
{
  const rows = [];
  for (const r of results) {
    if (!r.pairWith) continue;
    const h = results.find((x) => x.zone === r.pairWith);
    if (!h) continue;
    const dipDiff = h.predictedDip - r.predictedDip;
    rows.push([
      '`' + h.zone + '` ' + h.place,
      '`' + r.zone + '` ' + r.place,
      `${h.elev} vs ${r.elev}`,
      dipDiff.toFixed(2),
      (h.maghrib - r.maghrib).toFixed(2),
      (h.syuruk - r.syuruk).toFixed(2),
      Math.abs(h.maghrib - r.maghrib) < 1 ? 'NO dip applied' : 'inspect',
    ]);
  }
  say(
    table(
      ['high zone', 'low zone', 'elev m', 'dip diff predicts', 'observed Maghrib diff', 'observed Syuruk diff', 'verdict'],
      rows
    )
  );
}
say('');

fs.writeFileSync('part5-jakim.json', JSON.stringify(results, null, 1));
console.log(out.join('\n'));
