// R14 part 2: what the timezone and the locale each establish about the COUNTRY, which is
// what source selection actually needs. Two questions:
//   1. How many IANA zones name exactly one country? (zone.tab, tzdata 2026c on this machine)
//   2. What is the prayer error if the app places a user at their COUNTRY's capital?
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { Coordinates, PrayerTimes, CalculationMethod, HighLatitudeRule, Rounding, Madhab } from './lib.mjs';
import { KEYS, table } from './lib.mjs';

const q = CalculationMethod.MuslimWorldLeague();
q.highLatitudeRule = HighLatitudeRule.SeventhOfTheNight;
q.rounding = Rounding.Nearest;
q.madhab = Madhab.Shafi;

const DATES = [];
for (let m = 0; m < 12; m++) {
  DATES.push(new Date(Date.UTC(2026, m, 1, 12)));
  DATES.push(new Date(Date.UTC(2026, m, 15, 12)));
}

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

say('# R14 part 2: the country signal, from the timezone and from the locale');
say('');

// ---------------------------------------------------------- zone to country
const TZVER = fs.readFileSync('/var/db/timezone/zoneinfo/+VERSION', 'utf8').trim();
const zoneTab = fs
  .readFileSync('/var/db/timezone/zoneinfo/zone.tab', 'utf8')
  .split('\n')
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => l.split('\t'));

// zone.tab has exactly one country code per row by construction. zone1970.tab allows many
// and is the right file for the ambiguity question, so fetch it from the IANA distribution
// only if it is present locally; otherwise derive ambiguity from zone.tab duplicates.
const zoneToCC = new Map();
for (const r of zoneTab) {
  const cc = r[0];
  const zone = r[2];
  if (!zoneToCC.has(zone)) zoneToCC.set(zone, new Set());
  zoneToCC.get(zone).add(cc);
}
const amb = [...zoneToCC.entries()].filter(([, s]) => s.size > 1);
say(`## 2I. Does the IANA zone name identify a country? (system tzdata ${TZVER}, \`zone.tab\`)`);
say('');
say(`Rows in \`zone.tab\`: ${zoneTab.length}. Distinct zone names: ${zoneToCC.size}.`);
say(`Zone names mapping to MORE THAN ONE country code: ${amb.length}.`);
say('');
if (amb.length) {
  say(
    table(
      ['zone', 'country codes'],
      amb.sort((a, b) => b[1].size - a[1].size).map(([z, s]) => ['`' + z + '`', [...s].sort().join(' ')])
    )
  );
  say('');
}

// how many countries have more than one zone
const ccToZones = new Map();
for (const r of zoneTab) {
  if (!ccToZones.has(r[0])) ccToZones.set(r[0], new Set());
  ccToZones.get(r[0]).add(r[2]);
}
const multi = [...ccToZones.entries()].filter(([, s]) => s.size > 1).sort((a, b) => b[1].size - a[1].size);
say(`Countries with more than one zone: ${multi.length} of ${ccToZones.size}.`);
say('');
say(
  table(
    ['cc', 'zones'],
    multi.slice(0, 20).map(([cc, s]) => [cc, String(s.size)])
  )
);
say('');

// --------------------------------------------- country capital as the position
const CAP = {
  SA: ['Riyadh', 24.6877, 46.7219], TR: ['Ankara', 39.9199, 32.8543], PK: ['Islamabad', 33.7215, 73.0433],
  ID: ['Jakarta', -6.2088, 106.8456], MY: ['Kuala Lumpur', 3.1412, 101.6865], IR: ['Tehran', 35.6944, 51.4215],
  EG: ['Cairo', 30.0444, 31.2357], MA: ['Rabat', 34.0209, -6.8416], DZ: ['Algiers', 36.7538, 3.0588],
  NG: ['Abuja', 9.0765, 7.3986], BD: ['Dhaka', 23.8103, 90.4125], IN: ['New Delhi', 28.6139, 77.209],
  KZ: ['Astana', 51.1605, 71.4704], UZ: ['Tashkent', 41.2995, 69.2401], RU: ['Moscow', 55.7558, 37.6173],
  AF: ['Kabul', 34.5553, 69.2075], IQ: ['Baghdad', 33.3152, 44.3661], SD: ['Khartoum', 15.5007, 32.5599],
  ET: ['Addis Ababa', 9.0192, 38.7525], YE: ["Sanaa", 15.3694, 44.191], SY: ['Damascus', 33.5138, 36.2765],
  AE: ['Abu Dhabi', 24.4539, 54.3773], QA: ['Doha', 25.2854, 51.531], OM: ['Muscat', 23.588, 58.3829],
  KW: ['Kuwait City', 29.3759, 47.9774], BH: ['Manama', 26.2285, 50.586], JO: ['Amman', 31.9454, 35.9284],
  LB: ['Beirut', 33.8938, 35.5018], LY: ['Tripoli', 32.8872, 13.1913], TN: ['Tunis', 36.8065, 10.1815],
  SN: ['Dakar', 14.7167, -17.4677], ML: ['Bamako', 12.6392, -8.0029], NE: ['Niamey', 13.5116, 2.1254],
  TD: ["N'Djamena", 12.1348, 15.0557], SO: ['Mogadishu', 2.0469, 45.3182], TZ: ['Dodoma', -6.163, 35.7516],
  BN: ['Bandar Seri Begawan', 4.9031, 114.9398], GB: ['London', 51.5074, -0.1278], FR: ['Paris', 48.8566, 2.3522],
  DE: ['Berlin', 52.52, 13.405], US: ['Washington', 38.9072, -77.0369], CA: ['Ottawa', 45.4215, -75.6972],
  CN: ['Beijing', 39.9042, 116.4074], AZ: ['Baku', 40.4093, 49.8671], KG: ['Bishkek', 42.8746, 74.5698],
  TJ: ['Dushanbe', 38.5598, 68.787], TM: ['Ashgabat', 37.9601, 58.3261], MR: ['Nouakchott', 18.0735, -15.9582],
  BF: ['Ouagadougou', 12.3714, -1.5197], SL: ['Freetown', 8.4657, -13.2317], GN: ['Conakry', 9.6412, -13.5784],
  GM: ['Banjul', 13.4549, -16.579], GW: ['Bissau', 11.8817, -15.6178], DJ: ['Djibouti', 11.5721, 43.1456],
  ER: ['Asmara', 15.3229, 38.9251], KM: ['Moroni', -11.7022, 43.2551], MV: ['Male', 4.1755, 73.5093],
  AL: ['Tirana', 41.3275, 19.8187], MK: ['Skopje', 41.9981, 21.4254], PS: ['Ramallah', 31.9038, 35.2034],
  CI: ['Yamoussoukro', 6.8276, -5.2893],
};

const MUSLIM_MAJORITY = new Set(Object.keys(CAP));
const cities = [];
for (const line of fs.readFileSync('cities15000.txt', 'utf8').split('\n')) {
  if (!line) continue;
  const f = line.split('\t');
  const lat = Number(f[4]);
  const lon = Number(f[5]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
  cities.push({ name: f[1], cc: f[8], lat, lon, pop: Number(f[14]) || 0, tz: f[17] });
}

say('## 2J. Placing the user at their COUNTRY capital: the locale-only error');
say('');
say('`expo-localization`\'s `regionCode` gives a country and nothing else. If the app computed at');
say('the capital, this is the error. Only countries with a capital in this table are shown.');
say('');
{
  const rows = [];
  for (const [cc, [cname, clat, clon]] of Object.entries(CAP)) {
    const list = cities.filter((c) => c.cc === cc);
    if (!list.length) continue;
    const pv = vals(clat, clon);
    let worst = 0;
    let worstName = '';
    let far = 0;
    let farName = '';
    let popTot = 0;
    const recs = [];
    for (const c of list) {
      const cv = vals(c.lat, c.lon);
      let w = 0;
      for (let i = 0; i < cv.length; i++) {
        if (cv[i] === null || pv[i] === null) continue;
        const dd = Math.abs(cv[i] - pv[i]);
        if (dd <= 120 && dd > w) w = dd;
      }
      const d = hav({ lat: clat, lon: clon }, c);
      recs.push({ err: w, pop: c.pop });
      popTot += c.pop;
      if (w > worst) {
        worst = w;
        worstName = c.name;
      }
      if (d > far) {
        far = d;
        farName = c.name;
      }
    }
    const le = (n) => (popTot ? (100 * recs.filter((r) => r.err <= n).reduce((s, r) => s + r.pop, 0)) / popTot : 100);
    rows.push({
      cc,
      cname,
      n: list.length,
      worst,
      worstName,
      far,
      farName,
      p2: le(2),
      p5: le(5),
      p10: le(10),
    });
  }
  rows.sort((a, b) => b.worst - a.worst);
  say(
    table(
      ['cc', 'capital', 'cities', 'worst city', 'worst min', 'furthest city km', 'pop <=2 min', 'pop <=5 min', 'pop <=10 min'],
      rows.map((r) => [
        r.cc,
        r.cname,
        String(r.n),
        r.worstName,
        String(r.worst),
        r.far.toFixed(0),
        r.p2.toFixed(1) + '%',
        r.p5.toFixed(1) + '%',
        r.p10.toFixed(1) + '%',
      ])
    )
  );
}
say('');
console.log(out.join('\n'));
