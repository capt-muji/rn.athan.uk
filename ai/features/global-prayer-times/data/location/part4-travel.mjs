// R14 part 4: the travel problem.
//
// Three measurements:
//   4A. Real journeys: the prayer-time error of holding the origin's position after arrival.
//   4B. How reliable is a timezone change as a travel signal? For every ordered pair of
//       cities15000 places, if the zone name is the SAME, how large can the prayer error still
//       be? That is exactly what a timezone listener misses.
//   4C. The inverse: how often does a zone CHANGE without the prayer times moving materially,
//       which is a false alarm.
import fs from 'node:fs';
import { Coordinates, PrayerTimes, CalculationMethod, HighLatitudeRule, Rounding, Madhab } from './lib.mjs';
import { KEYS, table } from './lib.mjs';

const q = CalculationMethod.MuslimWorldLeague();
q.highLatitudeRule = HighLatitudeRule.SeventhOfTheNight;
q.rounding = Rounding.Nearest;
q.madhab = Madhab.Shafi;

const DATES = [];
for (let m = 0; m < 12; m++) DATES.push(new Date(Date.UTC(2026, m, 15, 12)));

function vals(lat, lon) {
  const res = [];
  for (const d of DATES) {
    const t = new PrayerTimes(new Coordinates(lat, lon), d, q);
    for (const k of KEYS) {
      const v = t[k];
      res.push(v instanceof Date && !Number.isNaN(v.getTime()) ? Math.round(v.getTime() / 60000) : null);
    }
  }
  return res;
}

function perPrayer(a, b) {
  const out = {};
  for (const k of KEYS) out[k] = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === null || b[i] === null) continue;
    const k = KEYS[i % KEYS.length];
    const dd = Math.abs(a[i] - b[i]);
    if (dd <= 720 && dd > out[k]) out[k] = dd;
  }
  return out;
}

function hav(a, b) {
  const R = 6371.0088;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const l1 = (a.lat * Math.PI) / 180;
  const l2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(l1) * Math.cos(l2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

const out = [];
const say = (s = '') => out.push(s);
say('# R14 part 4: the travel problem, measured');
say('');
say('adhan@4.4.6, MWL, SeventhOfTheNight, rounding=Nearest. 12 dates (the 15th of each month of');
say('2026), 6 times each. The error is the worst displayed-minute gap. A gap over 720 minutes is a');
say('solver discontinuity and is excluded.');
say('');

// ------------------------------------------------------- 4A real journeys
const P = {
  London: { lat: 51.5074, lon: -0.1278, tz: 'Europe/London' },
  Manchester: { lat: 53.4808, lon: -2.2426, tz: 'Europe/London' },
  Glasgow: { lat: 55.8642, lon: -4.2518, tz: 'Europe/London' },
  Birmingham: { lat: 52.4862, lon: -1.8904, tz: 'Europe/London' },
  Bradford: { lat: 53.7938, lon: -1.7523, tz: 'Europe/London' },
  Paris: { lat: 48.8566, lon: 2.3522, tz: 'Europe/Paris' },
  Istanbul: { lat: 41.0082, lon: 28.9784, tz: 'Europe/Istanbul' },
  Jeddah: { lat: 21.4858, lon: 39.1925, tz: 'Asia/Riyadh' },
  Makkah: { lat: 21.4225, lon: 39.8262, tz: 'Asia/Riyadh' },
  Madinah: { lat: 24.5247, lon: 39.5692, tz: 'Asia/Riyadh' },
  Mina: { lat: 21.4133, lon: 39.8933, tz: 'Asia/Riyadh' },
  Dubai: { lat: 25.2048, lon: 55.2708, tz: 'Asia/Dubai' },
  Karachi: { lat: 24.8607, lon: 67.0011, tz: 'Asia/Karachi' },
  Lahore: { lat: 31.5204, lon: 74.3587, tz: 'Asia/Karachi' },
  Dhaka: { lat: 23.8103, lon: 90.4125, tz: 'Asia/Dhaka' },
  KualaLumpur: { lat: 3.1412, lon: 101.6865, tz: 'Asia/Kuala_Lumpur' },
  KotaKinabalu: { lat: 5.9749, lon: 116.0724, tz: 'Asia/Kuching' },
  Jakarta: { lat: -6.2088, lon: 106.8456, tz: 'Asia/Jakarta' },
  Surabaya: { lat: -7.2575, lon: 112.7521, tz: 'Asia/Jakarta' },
  Toronto: { lat: 43.6532, lon: -79.3832, tz: 'America/Toronto' },
  NewYork: { lat: 40.7128, lon: -74.006, tz: 'America/New_York' },
  Miami: { lat: 25.7617, lon: -80.1918, tz: 'America/New_York' },
  Oslo: { lat: 59.9139, lon: 10.7522, tz: 'Europe/Oslo' },
  Tromso: { lat: 69.6492, lon: 18.9553, tz: 'Europe/Oslo' },
  Cairo: { lat: 30.0444, lon: 31.2357, tz: 'Africa/Cairo' },
  Aswan: { lat: 24.0889, lon: 32.8998, tz: 'Africa/Cairo' },
  Moscow: { lat: 55.7558, lon: 37.6173, tz: 'Europe/Moscow' },
  Kazan: { lat: 55.7963, lon: 49.1088, tz: 'Europe/Moscow' },
  Almaty: { lat: 43.2389, lon: 76.8897, tz: 'Asia/Almaty' },
  Shanghai: { lat: 31.2304, lon: 121.4737, tz: 'Asia/Shanghai' },
  Kashgar: { lat: 39.4704, lon: 75.9897, tz: 'Asia/Urumqi' },
};

const JOURNEYS = [
  ['London', 'Makkah', 'Umrah, the archetypal journey for this app'],
  ['London', 'Jeddah', 'the flight in'],
  ['Jeddah', 'Makkah', 'the coach from the airport, 66 km'],
  ['Makkah', 'Madinah', 'the second half of Umrah, same zone'],
  ['Makkah', 'Mina', 'Hajj, 8 km, same zone'],
  ['London', 'Manchester', 'a domestic trip, SAME zone'],
  ['London', 'Glasgow', 'further, still SAME zone'],
  ['London', 'Bradford', 'the largest Muslim diaspora move in Britain, SAME zone'],
  ['London', 'Paris', 'different zone, small position change'],
  ['London', 'Istanbul', ''],
  ['London', 'Karachi', ''],
  ['Karachi', 'Lahore', 'SAME zone, 1,030 km'],
  ['KualaLumpur', 'KotaKinabalu', 'different zone AND different JAKIM zone'],
  ['Jakarta', 'Surabaya', 'SAME zone, 660 km'],
  ['NewYork', 'Miami', 'SAME zone, 1,760 km'],
  ['Toronto', 'NewYork', 'different zone, small position change'],
  ['Oslo', 'Tromso', 'SAME zone, polar'],
  ['Cairo', 'Aswan', 'SAME zone, 670 km'],
  ['Moscow', 'Kazan', 'SAME zone, 720 km'],
  ['Shanghai', 'Kashgar', 'different zone name, one legal zone'],
  ['Dubai', 'Makkah', ''],
  ['Dhaka', 'Makkah', ''],
];

say('## 4A. Real journeys: holding the origin position after arrival');
say('');
{
  const rows = [];
  for (const [a, b, note] of JOURNEYS) {
    const pa = P[a];
    const pb = P[b];
    const d = perPrayer(vals(pa.lat, pa.lon), vals(pb.lat, pb.lon));
    const worst = Math.max(...KEYS.map((k) => d[k]));
    rows.push([
      `${a} to ${b}`,
      hav(pa, pb).toFixed(0),
      pa.tz === pb.tz ? '**same**' : 'changes',
      ...KEYS.map((k) => String(d[k])),
      String(worst),
      note,
    ]);
  }
  say(table(['journey', 'km', 'IANA zone', ...KEYS, 'worst', 'note'], rows));
}
say('');

// ------------------------------- 4B what a timezone-change signal MISSES
const cities = [];
for (const line of fs.readFileSync('cities15000.txt', 'utf8').split('\n')) {
  if (!line) continue;
  const f = line.split('\t');
  const lat = Number(f[4]);
  const lon = Number(f[5]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
  cities.push({ name: f[1], cc: f[8], lat, lon, pop: Number(f[14]) || 0, tz: f[17] });
}
const byZone = new Map();
for (const c of cities) {
  if (!byZone.has(c.tz)) byZone.set(c.tz, []);
  byZone.get(c.tz).push(c);
}

say('## 4B. What a timezone-change signal misses: the worst intra-zone journey');
say('');
say('For each zone, the two cities within it whose prayer times differ most. A user making exactly');
say('that journey gets NO timezone event and no other permission-free signal at all. Only zones');
say('with 3 or more cities are shown, sorted by the worst gap, top 30.');
say('');
{
  const recs = [];
  for (const [tz, list] of byZone) {
    if (list.length < 3) continue;
    // take the 40 most populous to keep it O(40^2) per zone
    const sub = [...list].sort((a, b) => b.pop - a.pop).slice(0, 40);
    const v = sub.map((c) => vals(c.lat, c.lon));
    let worst = 0;
    let pair = null;
    for (let i = 0; i < sub.length; i++) {
      for (let j = i + 1; j < sub.length; j++) {
        const d = perPrayer(v[i], v[j]);
        const w = Math.max(...KEYS.map((k) => d[k]));
        if (w > worst) {
          worst = w;
          pair = [sub[i], sub[j], d];
        }
      }
    }
    if (pair) recs.push({ tz, worst, a: pair[0], b: pair[1], d: pair[2], km: hav(pair[0], pair[1]) });
  }
  recs.sort((a, b) => b.worst - a.worst);
  say(
    table(
      ['zone', 'city A', 'city B', 'km', ...KEYS, 'worst min'],
      recs
        .slice(0, 30)
        .map((r) => ['`' + r.tz + '`', r.a.name, r.b.name, r.km.toFixed(0), ...KEYS.map((k) => String(r.d[k])), String(r.worst)])
    )
  );
  say('');
  const over5 = recs.filter((r) => r.worst > 5).length;
  const over15 = recs.filter((r) => r.worst > 15).length;
  const over30 = recs.filter((r) => r.worst > 30).length;
  say(
    table(
      ['statistic', 'zones'],
      [
        ['zones with 3 or more cities', String(recs.length)],
        ['worst intra-zone gap over 5 min', `${over5} (${((100 * over5) / recs.length).toFixed(0)}%)`],
        ['worst intra-zone gap over 15 min', `${over15} (${((100 * over15) / recs.length).toFixed(0)}%)`],
        ['worst intra-zone gap over 30 min', `${over30} (${((100 * over30) / recs.length).toFixed(0)}%)`],
      ]
    )
  );
  say('');
  fs.writeFileSync('part4-intrazone.json', JSON.stringify(recs.map((r) => ({ tz: r.tz, worst: r.worst, a: r.a.name, b: r.b.name, km: Math.round(r.km) })), null, 1));
}

// ------------------------------- 4C false alarms: zone changes that mean nothing
say('## 4C. The false alarm: a zone change with no material prayer change');
say('');
say('Pairs of cities in DIFFERENT zones that are within 100 km of each other, which is what a');
say('border crossing or a coastal commute looks like. If the prayer gap is small, a zone-change');
say('trigger is firing for nothing.');
say('');
{
  // grid the cities so nearby cross-zone pairs are cheap to find
  const grid = new Map();
  for (const c of cities) {
    const k = Math.round(c.lat) + ',' + Math.round(c.lon);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(c);
  }
  const pairs = [];
  const seen = new Set();
  for (const c of cities) {
    if (c.pop < 100000) continue;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const arr = grid.get(Math.round(c.lat) + dy + ',' + (Math.round(c.lon) + dx));
        if (!arr) continue;
        for (const o of arr) {
          if (o.tz === c.tz || o.pop < 100000) continue;
          const key = [c.name, o.name].sort().join('|');
          if (seen.has(key)) continue;
          const d = hav(c, o);
          if (d > 100) continue;
          seen.add(key);
          pairs.push({ a: c, b: o, km: d });
        }
      }
    }
  }
  const recs = pairs.map((p) => {
    const d = perPrayer(vals(p.a.lat, p.a.lon), vals(p.b.lat, p.b.lon));
    return { ...p, worst: Math.max(...KEYS.map((k) => d[k])) };
  });
  recs.sort((a, b) => a.worst - b.worst);
  say(`Cross-zone city pairs over 100,000 population within 100 km: ${recs.length}.`);
  say('');
  say(
    table(
      ['city A', 'zone A', 'city B', 'zone B', 'km', 'worst prayer min'],
      recs.slice(0, 20).map((r) => [r.a.name, '`' + r.a.tz + '`', r.b.name, '`' + r.b.tz + '`', r.km.toFixed(0), String(r.worst)])
    )
  );
  say('');
  const le2 = recs.filter((r) => r.worst <= 2).length;
  say(`Of those pairs, ${le2} (${((100 * le2) / recs.length).toFixed(0)}%) differ by 2 displayed minutes or less, so a zone-change trigger on that journey is a false alarm.`);
  say('');
}

// ------------------------------- 4D what "enough movement" means per prayer
say('## 4D. The re-fix threshold: how far the user must move before a prayer changes');
say('');
say('From part 1E and 1F: the radius at which the worst of the six times first exceeds one');
say('displayed minute. Repeated here per prayer for a spread of latitudes, because that is the');
say('number a movement trigger has to encode.');
say('');
say('This table is in `part1.txt` section 1F. The design answer is in the report.');
say('');
console.log(out.join('\n'));
