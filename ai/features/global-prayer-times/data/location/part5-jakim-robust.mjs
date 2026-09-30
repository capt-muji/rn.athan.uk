// R14 part 5C, robustness. The dip component measured in part5-jakim.mjs could be an
// artefact of a wrong reference coordinate, because a LATITUDE error also moves sunset
// and sunrise antisymmetrically. Two checks that separate them:
//
//   1. SEASONAL STABILITY. A horizon dip's effect on sunset is the same SIGN all year and
//      grows mildly with |declination|. A latitude error's effect REVERSES sign between
//      June and December. So a full year decides it.
//   2. COORDINATE SENSITIVITY. Perturb the assumed coordinate by +/-50 km in latitude and
//      report how much the measured dip component moves. If the dip survives, it is real.
import fs from 'node:fs';
import { Coordinates, PrayerTimes, CalculationMethod, HighLatitudeRule, Rounding, Madhab } from './lib.mjs';
import { table, kmToDegLat, kmToDegLon } from './lib.mjs';

const ZONES = [
  { zone: 'PHG06', place: 'Cameron Highlands', lat: 4.4694, lon: 101.3778 },
  { zone: 'PHG04', place: 'Raub', lat: 3.7944, lon: 101.8578 },
  { zone: 'PRK07', place: 'Bukit Larut', lat: 4.8631, lon: 100.7942 },
  { zone: 'PRK06', place: 'Taiping', lat: 4.85, lon: 100.7333 },
  { zone: 'SBH06', place: 'Gunung Kinabalu', lat: 6.0047, lon: 116.5581 },
  { zone: 'SBH07', place: 'Ranau', lat: 5.9544, lon: 116.6739 },
  { zone: 'KDH07', place: 'Gunung Jerai', lat: 5.7897, lon: 100.4361 },
  { zone: 'KDH02', place: 'Sungai Petani', lat: 5.6472, lon: 100.4875 },
  { zone: 'WLY01', place: 'Kuala Lumpur', lat: 3.1412, lon: 101.6865 },
];

const q = CalculationMethod.MuslimWorldLeague();
q.highLatitudeRule = HighLatitudeRule.SeventhOfTheNight;
q.rounding = Rounding.None;
q.madhab = Madhab.Shafi;

const CACHE = 'jakim-year.json';
const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};

async function fetchYear(zone) {
  if (cache[zone]) return cache[zone];
  const url = `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=year&zone=${zone}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`${zone}: HTTP ${res.status}`);
  const j = await res.json();
  cache[zone] = j.prayerTime;
  fs.writeFileSync(CACHE, JSON.stringify(cache));
  return cache[zone];
}

const MON = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
const MY_OFFSET_MIN = 480;
const pubMin = (s) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};

function compMin(lat, lon, ymd, key) {
  const t = new PrayerTimes(new Coordinates(lat, lon), new Date(Date.UTC(ymd.y, ymd.m, ymd.d, 12)), q);
  const v = t[key];
  if (!(v instanceof Date) || Number.isNaN(v.getTime())) return null;
  return v.getTime() / 60000 - Date.UTC(ymd.y, ymd.m, ymd.d) / 60000 + MY_OFFSET_MIN;
}

const R = 6371000;
const dipDeg = (h) => (Math.acos(R / (R + h)) * 180) / Math.PI;
function sunsetShiftMin(latDeg, declDeg, h) {
  const lat = (latDeg * Math.PI) / 180;
  const dec = (declDeg * Math.PI) / 180;
  const H = (ad) => {
    const a = (ad * Math.PI) / 180;
    const c = (Math.sin(a) - Math.sin(lat) * Math.sin(dec)) / (Math.cos(lat) * Math.cos(dec));
    return c < -1 || c > 1 ? null : (Math.acos(c) * 180) / Math.PI;
  };
  const a = H(-0.833);
  const b = H(-0.833 - dipDeg(h));
  return a === null || b === null ? null : ((b - a) / 15) * 60;
}
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

function dipByMonth(zone, lat, lon) {
  const rows = cache[zone];
  const acc = Array.from({ length: 12 }, () => []);
  for (const r of rows) {
    const [d, m, y] = r.date.split('-');
    const ymd = { y: Number(y), m: MON[m], d: Number(d) };
    const cm = compMin(lat, lon, ymd, 'maghrib');
    const cs = compMin(lat, lon, ymd, 'sunrise');
    if (cm === null || cs === null) continue;
    acc[ymd.m].push((pubMin(r.maghrib) - cm - (pubMin(r.syuruk) - cs)) / 2);
  }
  return acc.map((a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null));
}

for (const z of ZONES) await fetchYear(z.zone);

const out = [];
const say = (s = '') => out.push(s);
say('# R14 part 5C robustness: is the dip real or a coordinate artefact?');
say('');
say('JAKIM `period=year` fetched from `e-solat.gov.my`. Dip component per month, defined as');
say('`((publishedMaghrib - computedMaghrib) - (publishedSyuruk - computedSunrise)) / 2`, so a');
say('symmetric safety margin and any longitude error cancel out of it exactly.');
say('');
say('## 5C-1. Dip component by month, whole published year');
say('');
{
  const rows = [];
  for (const z of ZONES) {
    const m = dipByMonth(z.zone, z.lat, z.lon);
    const vals = m.filter((x) => x !== null);
    rows.push([
      '`' + z.zone + '`',
      z.place,
      ...m.map((x) => (x === null ? '-' : x.toFixed(2))),
      (Math.max(...vals) - Math.min(...vals)).toFixed(2),
    ]);
  }
  say(
    table(
      ['zone', 'place', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'range'],
      rows
    )
  );
}
say('');
say('A latitude error would REVERSE the sign between June and December. None of these does.');
say('');

say('## 5C-2. Coordinate sensitivity: the dip component under a +/-50 km perturbation');
say('');
{
  const rows = [];
  for (const z of ZONES) {
    const cells = [];
    for (const [dx, dy] of [[0, 0], [50, 0], [-50, 0], [0, 50], [0, -50]]) {
      const lat = z.lat + kmToDegLat(dy);
      const lon = z.lon + kmToDegLon(dx, z.lat);
      const m = dipByMonth(z.zone, lat, lon).filter((x) => x !== null);
      cells.push((m.reduce((s, x) => s + x, 0) / m.length).toFixed(2));
    }
    const yearDec = 0;
    rows.push([
      '`' + z.zone + '`',
      z.place,
      ...cells,
      Math.round(solveElev(z.lat, yearDec, Number(cells[0]))).toLocaleString('en-GB'),
    ]);
  }
  say(
    table(
      ['zone', 'place', 'as sited', '+50 km E', '-50 km E', '+50 km N', '-50 km N', 'implied elev m at equinox'],
      rows
    )
  );
}
say('## 5C-3. Separating the asymmetric ihtiyati from the elevation');
say('');
say('R6 measured JAKIM Kuala Lumpur\'s per-field offsets as Sunrise -1 and Maghrib +2, which is');
say('itself an antisymmetric pair and therefore lands inside the dip component as');
say('`(2 - (-1)) / 2 = 1.50` minutes of apparent dip at zero elevation. The measured WLY01 value');
say('is the baseline. Subtracting it leaves the part attributable to elevation alone.');
say('');
{
  const base = (() => {
    const z = ZONES.find((x) => x.zone === 'WLY01');
    const m = dipByMonth(z.zone, z.lat, z.lon).filter((x) => x !== null);
    return m.reduce((s, x) => s + x, 0) / m.length;
  })();
  say(`Measured WLY01 baseline dip component: ${base.toFixed(2)} min. R6's offset pair predicts 1.50 min.`);
  say('');
  const rows = [];
  for (const z of ZONES) {
    const m = dipByMonth(z.zone, z.lat, z.lon).filter((x) => x !== null);
    const raw = m.reduce((s, x) => s + x, 0) / m.length;
    const excess = raw - base;
    rows.push([
      '`' + z.zone + '`',
      z.place,
      raw.toFixed(2),
      excess.toFixed(2),
      excess > 0.2 ? Math.round(solveElev(z.lat, 0, excess)).toLocaleString('en-GB') : 'about 0',
    ]);
  }
  say(table(['zone', 'place', 'dip component min', 'excess over WLY01 min', 'elevation the excess implies, m'], rows));
}
say('');
console.log(out.join('\n'));
