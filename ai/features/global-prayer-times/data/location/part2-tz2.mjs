// R14 part 2 (second pass): the timezone-only error under THREE different choices of
// zone representative point, plus the qibla error under the same three, so this report's
// prayer-time numbers are directly comparable with session 37's qibla numbers.
//
// The three representatives:
//   pop      most populous city in the zone (cities15000)
//   capital  the country capital that lies in the zone, falling back to most populous
//   centroid population-weighted mean of the zone's cities15000 places
import fs from 'node:fs';
import * as adhan from 'adhan';
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

// Capitals of the countries whose zones matter most here. Cited: standard geography, only
// used to pick a representative point.
const CAPITAL = {
  SA: 'Riyadh', TR: 'Ankara', PK: 'Islamabad', GB: 'London', US: 'Washington',
  ID: 'Jakarta', MY: 'Kuala Lumpur', IR: 'Tehran', EG: 'Cairo', MA: 'Rabat',
  DZ: 'Algiers', NG: 'Abuja', BD: 'Dhaka', IN: 'New Delhi', KZ: 'Astana',
  UZ: 'Tashkent', RU: 'Moscow', CN: 'Beijing', AF: 'Kabul', IQ: 'Baghdad',
  SD: 'Khartoum', ET: 'Addis Ababa', YE: 'Sanaa', SY: 'Damascus', AE: 'Abu Dhabi',
  QA: 'Doha', OM: 'Muscat', KW: 'Kuwait City', BH: 'Manama', JO: 'Amman',
  LB: 'Beirut', LY: 'Tripoli', TN: 'Tunis', SN: 'Dakar', ML: 'Bamako',
  NE: 'Niamey', TD: "N'Djamena", SO: 'Mogadishu', TZ: 'Dodoma', BN: 'Bandar Seri Begawan',
};

const MUSLIM_MAJORITY = new Set(
  ('AF AL AZ BH BD BN BF TD KM CI DJ EG ER GM GN GW ID IR IQ JO KZ KW KG LB LY MY MV ML MR MA NE NG OM PK PS QA SA SN SL SO SD SY TJ TZ TN TR TM AE UZ EH YE XK MK')
    .split(' ')
);

const cities = [];
for (const line of fs.readFileSync('cities15000.txt', 'utf8').split('\n')) {
  if (!line) continue;
  const f = line.split('\t');
  const lat = Number(f[4]);
  const lon = Number(f[5]);
  const tz = f[17];
  if (!tz || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
  cities.push({ name: f[1], cc: f[8], lat, lon, pop: Number(f[14]) || 0, tz });
}

const byZone = new Map();
for (const c of cities) {
  if (!byZone.has(c.tz)) byZone.set(c.tz, []);
  byZone.get(c.tz).push(c);
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

function qibla(lat, lon) {
  return adhan.Qibla(new Coordinates(lat, lon));
}

function bearingDiff(a, b) {
  let d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function haversine(a, b) {
  const R = 6371.0088;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const l1 = (a.lat * Math.PI) / 180;
  const l2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(l1) * Math.cos(l2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

const reps = new Map();
for (const [tz, list] of byZone) {
  const sorted = [...list].sort((a, b) => b.pop - a.pop);
  const pop = sorted[0];
  let capital = null;
  for (const c of sorted) {
    if (CAPITAL[c.cc] && c.name === CAPITAL[c.cc]) {
      capital = c;
      break;
    }
  }
  let sw = 0;
  let slat = 0;
  let slon = 0;
  for (const c of list) {
    const w = Math.max(c.pop, 1);
    sw += w;
    slat += w * c.lat;
    slon += w * c.lon;
  }
  reps.set(tz, {
    pop,
    capital: capital || pop,
    capitalIsFallback: !capital,
    centroid: { name: '(centroid)', lat: slat / sw, lon: slon / sw },
  });
}

const out = [];
const say = (s = '') => out.push(s);
say('# R14 part 2, second pass: three choices of zone representative point');
say('');
say('adhan@4.4.6 for both prayer times and qibla. Prayer error is the worst displayed-minute');
say('difference over 24 dates in 2026 and 6 times, discontinuities over 120 min excluded.');
say('Qibla error is the great-circle bearing difference in degrees, from `adhan.Qibla`.');
say('');

// ---- the session 37 comparison table
say('## 2F. The five session-37 cities, prayer error and qibla error side by side');
say('');
{
  const want = [
    ['Manchester', 'GB'],
    ['Detroit', 'US'],
    ['Peshawar', 'PK'],
    ['Diyarbakır', 'TR'],
    ['Jeddah', 'SA'],
  ];
  const rows = [];
  for (const [nm, cc] of want) {
    const c = cities.find((x) => x.name === nm && x.cc === cc);
    if (!c) {
      rows.push([nm, cc, 'NOT IN cities15000', '', '', '', '', '', '', '']);
      continue;
    }
    const r = reps.get(c.tz);
    const cv = vals(c.lat, c.lon);
    const cq = qibla(c.lat, c.lon);
    const cells = [];
    for (const kind of ['pop', 'capital', 'centroid']) {
      const p = r[kind];
      const pv = vals(p.lat, p.lon);
      let w = 0;
      for (let i = 0; i < cv.length; i++) {
        if (cv[i] === null || pv[i] === null) continue;
        const dd = Math.abs(cv[i] - pv[i]);
        if (dd <= 120 && dd > w) w = dd;
      }
      cells.push(`${p.name} ${haversine(c, p).toFixed(0)} km`);
      cells.push(String(w));
      cells.push(bearingDiff(cq, qibla(p.lat, p.lon)).toFixed(1));
    }
    rows.push([nm, '`' + c.tz + '`', ...cells]);
  }
  say(
    table(
      [
        'city',
        'zone',
        'pop rep',
        'prayer min',
        'qibla deg',
        'capital rep',
        'prayer min',
        'qibla deg',
        'centroid rep',
        'prayer min',
        'qibla deg',
      ],
      rows
    )
  );
}
say('');

// ---- global comparison of the three representative choices
say('## 2G. The three representatives compared globally');
say('');
{
  const rows = [];
  for (const kind of ['pop', 'capital', 'centroid']) {
    const errs = [];
    let totPop = 0;
    const byErr = [];
    let qsum = 0;
    let qworst = 0;
    let qn = 0;
    let q10 = 0;
    for (const [tz, list] of byZone) {
      const p = reps.get(tz)[kind];
      const pv = vals(p.lat, p.lon);
      const pq = qibla(p.lat, p.lon);
      for (const c of list) {
        const cv = vals(c.lat, c.lon);
        let w = 0;
        for (let i = 0; i < cv.length; i++) {
          if (cv[i] === null || pv[i] === null) continue;
          const dd = Math.abs(cv[i] - pv[i]);
          if (dd <= 120 && dd > w) w = dd;
        }
        errs.push(w);
        byErr.push({ err: w, pop: c.pop });
        totPop += c.pop;
        const qd = bearingDiff(qibla(c.lat, c.lon), pq);
        qsum += qd;
        qn++;
        if (qd > qworst) qworst = qd;
        if (qd > 10) q10++;
      }
    }
    errs.sort((a, b) => a - b);
    const pick = (p) => errs[Math.floor((p / 100) * errs.length)];
    const popLe = (n) => (100 * byErr.filter((x) => x.err <= n).reduce((s, x) => s + x.pop, 0)) / totPop;
    rows.push([
      kind,
      String(pick(50)),
      String(pick(90)),
      String(errs[errs.length - 1]),
      popLe(2).toFixed(1) + '%',
      popLe(5).toFixed(1) + '%',
      popLe(10).toFixed(1) + '%',
      (qsum / qn).toFixed(1),
      qworst.toFixed(1),
      ((100 * q10) / qn).toFixed(1) + '%',
    ]);
  }
  say(
    table(
      [
        'representative',
        'median prayer min',
        'p90 prayer min',
        'worst prayer min',
        'pop <=2 min',
        'pop <=5 min',
        'pop <=10 min',
        'mean qibla deg',
        'worst qibla deg',
        'cities over 10 deg qibla',
      ],
      rows
    )
  );
}
say('');

say('## 2H. The asymmetry stated as a ratio');
say('');
say('For the same representative point, the qibla error and the prayer error are both driven by the');
say('same position error, but they scale differently. This table takes the pop representative and');
say('reports both errors bucketed by distance from the representative.');
say('');
{
  const buckets = [
    [0, 10],
    [10, 50],
    [50, 100],
    [100, 250],
    [250, 500],
    [500, 1000],
    [1000, 5000],
  ];
  const acc = buckets.map(() => ({ n: 0, pSum: 0, pWorst: 0, qSum: 0, qWorst: 0 }));
  for (const [tz, list] of byZone) {
    const p = reps.get(tz).pop;
    const pv = vals(p.lat, p.lon);
    const pq = qibla(p.lat, p.lon);
    for (const c of list) {
      const d = haversine(c, p);
      const bi = buckets.findIndex(([lo, hi]) => d >= lo && d < hi);
      if (bi < 0) continue;
      const cv = vals(c.lat, c.lon);
      let w = 0;
      for (let i = 0; i < cv.length; i++) {
        if (cv[i] === null || pv[i] === null) continue;
        const dd = Math.abs(cv[i] - pv[i]);
        if (dd <= 120 && dd > w) w = dd;
      }
      const qd = bearingDiff(qibla(c.lat, c.lon), pq);
      const a = acc[bi];
      a.n++;
      a.pSum += w;
      a.qSum += qd;
      if (w > a.pWorst) a.pWorst = w;
      if (qd > a.qWorst) a.qWorst = qd;
    }
  }
  say(
    table(
      ['distance from representative', 'cities', 'mean prayer min', 'worst prayer min', 'mean qibla deg', 'worst qibla deg'],
      buckets.map(([lo, hi], i) => [
        `${lo} to ${hi} km`,
        String(acc[i].n),
        acc[i].n ? (acc[i].pSum / acc[i].n).toFixed(1) : '-',
        String(acc[i].pWorst),
        acc[i].n ? (acc[i].qSum / acc[i].n).toFixed(1) : '-',
        acc[i].qWorst.toFixed(1),
      ])
    )
  );
}
say('');
console.log(out.join('\n'));
