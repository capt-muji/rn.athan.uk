// R14 part 2: how wrong is a position inferred from the device timezone alone?
//
// Method. GeoNames `cities15000` (34,152 places over 15,000 population, CC BY 4.0) carries an
// IANA timezone per place. For each zone, the PRINCIPAL CITY is the most populous place in it.
// A timezone-only app would place every user in a zone at that zone's principal city. So for
// every city in cities15000 we measure the displayed-minute error of computing at the principal
// city instead of at the city itself, on 24 dates spread over 2026.
//
// This is the same construction session 37 used for qibla (error against the zone's principal
// city), so the two are directly comparable.
import fs from 'node:fs';
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

// Muslim-majority countries, ISO 3166-1 alpha-2. Cited: standard demographic lists, used here
// only to split the result, never as a prayer-time fact.
const MUSLIM_MAJORITY = new Set(
  ('AF AL AZ BH BD BN BF TD KM CI DJ EG ER GM GN GW ID IR IQ JO KZ KW KG LB LY MY MV ML MR MA NE NG OM PK PS QA SA SN SL SO SD SY TJ TZ TN TR TM AE UZ EH YE XK MK')
    .split(' ')
);

const rows = fs.readFileSync('cities15000.txt', 'utf8').split('\n').filter(Boolean);
const cities = [];
for (const line of rows) {
  const f = line.split('\t');
  const name = f[1];
  const cc = f[8];
  const lat = Number(f[4]);
  const lon = Number(f[5]);
  const pop = Number(f[14]) || 0;
  const tz = f[17];
  if (!tz || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
  cities.push({ name, cc, lat, lon, pop, tz });
}

const byZone = new Map();
for (const c of cities) {
  if (!byZone.has(c.tz)) byZone.set(c.tz, []);
  byZone.get(c.tz).push(c);
}

function yearVals(lat, lon) {
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

function haversine(a, b) {
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
const perZone = [];
const allCity = [];

for (const [tz, list] of byZone) {
  list.sort((a, b) => b.pop - a.pop);
  const principal = list[0];
  const pv = yearVals(principal.lat, principal.lon);
  let worstAny = 0;
  let worstCity = null;
  let worstDistKm = 0;
  let farCity = null;
  let discCount = 0;
  const cityRecs = [];
  for (const c of list) {
    const cv = yearVals(c.lat, c.lon);
    let w = 0;
    let disc = 0;
    let nullMismatch = 0;
    for (let i = 0; i < pv.length; i++) {
      if (pv[i] === null || cv[i] === null) {
        if (pv[i] !== cv[i]) nullMismatch++;
        continue;
      }
      const dd = Math.abs(pv[i] - cv[i]);
      if (dd > 120) {
        disc++;
        continue;
      }
      if (dd > w) w = dd;
    }
    const dist = haversine(principal, c);
    cityRecs.push({ ...c, err: w, dist, disc, nullMismatch });
    allCity.push({ tz, name: c.name, cc: c.cc, pop: c.pop, err: w, dist, disc, nullMismatch });
    if (w > worstAny) {
      worstAny = w;
      worstCity = c;
    }
    if (dist > worstDistKm) {
      worstDistKm = dist;
      farCity = c;
    }
    discCount += disc;
  }
  const pops = cityRecs.reduce((s, c) => s + c.pop, 0);
  const within1 = cityRecs.filter((c) => c.err <= 1).reduce((s, c) => s + c.pop, 0);
  const within2 = cityRecs.filter((c) => c.err <= 2).reduce((s, c) => s + c.pop, 0);
  const within5 = cityRecs.filter((c) => c.err <= 5).reduce((s, c) => s + c.pop, 0);
  perZone.push({
    tz,
    n: list.length,
    principal: principal.name,
    pop: pops,
    worstAny,
    worstCity: worstCity ? worstCity.name : '',
    worstDistKm,
    farCity: farCity ? farCity.name : '',
    within1: pops ? (100 * within1) / pops : 100,
    within2: pops ? (100 * within2) / pops : 100,
    within5: pops ? (100 * within5) / pops : 100,
    discCount,
    muslim: list.some((c) => MUSLIM_MAJORITY.has(c.cc)),
  });
}

say('# R14 part 2: timezone-only positioning, measured against the zone principal city');
say('');
say('adhan@4.4.6, MWL, SeventhOfTheNight, rounding=Nearest. 24 dates in 2026 (1st and 15th of each');
say('month), 6 times each, so 144 displayed values per city. Cities from GeoNames `cities15000`.');
say(`Zones with at least one city: ${byZone.size}. Cities: ${cities.length}.`);
say('');
say('A difference over 120 displayed minutes is a solver discontinuity (polar Asr/Maghrib), counted');
say('separately in the `disc` column and excluded from the error figure.');
say('');

// -------- headline: global city distribution
{
  const errs = allCity.map((c) => c.err).sort((a, b) => a - b);
  const pick = (p) => errs[Math.min(errs.length - 1, Math.floor((p / 100) * errs.length))];
  const totPop = allCity.reduce((s, c) => s + c.pop, 0);
  const popLe = (n) => (100 * allCity.filter((c) => c.err <= n).reduce((s, c) => s + c.pop, 0)) / totPop;
  say('## 2A. Global distribution of the timezone-only error, over all 34,152 cities');
  say('');
  say(
    table(
      ['statistic', 'displayed minutes'],
      [
        ['median city', String(pick(50))],
        ['75th percentile city', String(pick(75))],
        ['90th percentile city', String(pick(90))],
        ['95th percentile city', String(pick(95))],
        ['99th percentile city', String(pick(99))],
        ['worst city', String(errs[errs.length - 1])],
      ]
    )
  );
  say('');
  say('Population-weighted, using each city\'s own GeoNames population:');
  say('');
  say(
    table(
      ['error at most', 'share of cities15000 population'],
      [
        ['0 min (exact)', popLe(0).toFixed(1) + '%'],
        ['1 min', popLe(1).toFixed(1) + '%'],
        ['2 min', popLe(2).toFixed(1) + '%'],
        ['5 min', popLe(5).toFixed(1) + '%'],
        ['10 min', popLe(10).toFixed(1) + '%'],
        ['20 min', popLe(20).toFixed(1) + '%'],
        ['30 min', popLe(30).toFixed(1) + '%'],
      ]
    )
  );
  say('');
  const mus = allCity.filter((c) => MUSLIM_MAJORITY.has(c.cc));
  const mtot = mus.reduce((s, c) => s + c.pop, 0);
  const mLe = (n) => (100 * mus.filter((c) => c.err <= n).reduce((s, c) => s + c.pop, 0)) / mtot;
  const merrs = mus.map((c) => c.err).sort((a, b) => a - b);
  const mpick = (p) => merrs[Math.min(merrs.length - 1, Math.floor((p / 100) * merrs.length))];
  say(`Restricted to the ${mus.length} cities in Muslim-majority countries (population ${mtot.toLocaleString('en-GB')}):`);
  say('');
  say(
    table(
      ['statistic', 'value'],
      [
        ['median city error', String(mpick(50)) + ' min'],
        ['90th percentile', String(mpick(90)) + ' min'],
        ['99th percentile', String(mpick(99)) + ' min'],
        ['worst', String(merrs[merrs.length - 1]) + ' min'],
        ['population within 1 min', mLe(1).toFixed(1) + '%'],
        ['population within 2 min', mLe(2).toFixed(1) + '%'],
        ['population within 5 min', mLe(5).toFixed(1) + '%'],
        ['population within 10 min', mLe(10).toFixed(1) + '%'],
        ['population within 20 min', mLe(20).toFixed(1) + '%'],
      ]
    )
  );
  say('');
}

// -------- the 40 worst zones by worst-city error
{
  const sorted = [...perZone].sort((a, b) => b.worstAny - a.worstAny).slice(0, 40);
  say('## 2B. The 40 worst zones, by the worst city inside them');
  say('');
  say(
    table(
      ['zone', 'cities', 'principal city', 'worst city', 'worst min', 'km to worst-dist city', 'pop within 5 min'],
      sorted.map((z) => [
        '`' + z.tz + '`',
        String(z.n),
        z.principal,
        z.worstCity,
        String(z.worstAny),
        z.worstDistKm.toFixed(0),
        z.within5.toFixed(1) + '%',
      ])
    )
  );
  say('');
}

// -------- zones in Muslim-majority countries, sorted by worst
{
  const sorted = perZone.filter((z) => z.muslim).sort((a, b) => b.worstAny - a.worstAny);
  say(`## 2C. Every zone containing a city in a Muslim-majority country (${sorted.length} zones)`);
  say('');
  say(
    table(
      ['zone', 'cities', 'principal city', 'worst city', 'worst min', 'max km from principal', 'pop <=2 min', 'pop <=5 min'],
      sorted.map((z) => [
        '`' + z.tz + '`',
        String(z.n),
        z.principal,
        z.worstCity,
        String(z.worstAny),
        z.worstDistKm.toFixed(0),
        z.within2.toFixed(1) + '%',
        z.within5.toFixed(1) + '%',
      ])
    )
  );
  say('');
}

// -------- named comparison with session 37's qibla cities
{
  const want = ['Manchester', 'Detroit', 'Peshawar', 'Diyarbakır', 'Diyarbakir', 'Jeddah'];
  say('## 2D. The five cities session 37 measured for qibla, measured here for prayer times');
  say('');
  const recs = [];
  for (const w of want) {
    const hits = allCity.filter((c) => c.name === w);
    for (const h of hits) {
      const z = perZone.find((p) => p.tz === h.tz);
      recs.push([
        h.name,
        h.cc,
        '`' + h.tz + '`',
        z ? z.principal : '',
        h.dist.toFixed(0),
        String(h.err),
      ]);
    }
  }
  say(table(['city', 'cc', 'zone', 'zone principal city', 'km from it', 'worst displayed-min error'], recs));
  say('');
}

// -------- zone geographic extent from zone.tab reference points
{
  const sorted = [...perZone].sort((a, b) => b.worstDistKm - a.worstDistKm).slice(0, 30);
  say('## 2E. The 30 geographically largest zones, by the furthest city from the principal city');
  say('');
  say(
    table(
      ['zone', 'cities', 'principal city', 'furthest city', 'km', 'worst min', 'pop <=5 min'],
      sorted.map((z) => [
        '`' + z.tz + '`',
        String(z.n),
        z.principal,
        z.farCity,
        z.worstDistKm.toFixed(0),
        String(z.worstAny),
        z.within5.toFixed(1) + '%',
      ])
    )
  );
  say('');
}

fs.writeFileSync('tz-perzone.json', JSON.stringify(perZone, null, 1));
fs.writeFileSync(
  'tz-percity.csv',
  'zone,name,cc,pop,err_min,dist_km,disc,null_mismatch\n' +
    allCity
      .map((c) => `${c.tz},"${c.name.replace(/"/g, '')}",${c.cc},${c.pop},${c.err},${c.dist.toFixed(1)},${c.disc},${c.nullMismatch}`)
      .join('\n')
);

console.log(out.join('\n'));
