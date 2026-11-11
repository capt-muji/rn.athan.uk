// Assemble the UK-mosaic deliverable: per-town verdict (recipe, school, model
// class, November gaps and LUPT delta) plus the recipe clusters.
// Inputs: uk-mosaic-fit.json (candidate + free fits), gapdiag.json (model class),
// season.json (year-table stability). adhan 4.4.6 for the solar anchors.
// Run: TZ=Europe/London node assemble.mjs
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { loadAdhan } from './lib.mjs';
import { pmFlag, parseCol } from './engine.mjs';

const HOME = process.env.HOME;
const DIR = HOME + '/athan-gitree/census/o1k-wide/fit12/';
const D = HOME + '/athan-gitree/census/o1k-wide/uktowns2/data/';
const fit = JSON.parse(fs.readFileSync(DIR + 'uk-mosaic-fit.json', 'utf8'));
const gaps = Object.fromEntries(JSON.parse(fs.readFileSync(DIR + 'gapdiag.json', 'utf8')).map((r) => [r.town, r]));
const season = JSON.parse(fs.readFileSync(DIR + 'season.json', 'utf8'));

const { Coordinates, SolarTime, TimeComponents } = await loadAdhan();
const inst = (d, hours) => new TimeComponents(hours).utcDate(d.getFullYear(), d.getMonth(), d.getDate());
const secOf = (dt) => dt.getHours() * 3600 + dt.getMinutes() * 60 + dt.getSeconds();
const px = (v) => { const [h, m] = String(v).trim().split(':').map(Number); return h * 60 + m; };

// LUPT November rows, same MM-DD (the 2027 pages are the published table).
const luptNov = {};
for (const [k, row] of Object.entries(JSON.parse(fs.readFileSync(D + 'lupt-2027-11.json', 'utf8')))) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(k)) luptNov[k.slice(5)] = row;
}

function november(file, cols, lat, lng) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const coords = new Coordinates(lat, lng);
  const lupt = {}, gapF = [], gapI = [];
  const novKeys = Object.keys(data).filter((k) => k.startsWith('2026-11'));
  const rawF = novKeys.map((k) => String(data[k][cols.fajr] ?? '').trim());
  const rawI = novKeys.map((k) => String(data[k][cols.isha] ?? '').trim());
  const pmF = pmFlag('fajr', rawF), pmI = pmFlag('isha', rawI);
  const pf = (v) => (/^\d{1,2}:\d{2}$/.test(v) ? parseCol(v, 'fajr', pmF) : null);
  const pi = (v) => (/^\d{1,2}:\d{2}$/.test(v) ? parseCol(v, 'isha', pmI) : null);
  for (const [k, row] of Object.entries(data)) {
    if (!k.startsWith('2026-11')) continue;
    const [y, m, d] = k.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const st = new SolarTime(date, coords);
    const sr = secOf(inst(date, st.sunrise)) / 60, ss = secOf(inst(date, st.sunset)) / 60;
    const f = pf(String(row[cols.fajr] ?? '').trim()), i = pi(String(row[cols.isha] ?? '').trim());
    if (f !== null) gapF.push(sr - f);
    if (i !== null) gapI.push(i - ss);
    const lu = luptNov[k.slice(5)];
    if (!lu) continue;
    for (const [p, col] of Object.entries({ fajr: cols.fajr, dhuhr: cols.dhuhr, asr: cols.asr, isha: cols.isha })) {
      const a = String(row[col] ?? '').trim(), b = String(lu[p] ?? '').trim();
      if (!/^\d{1,2}:\d{2}$/.test(a) || !/^\d{1,2}:\d{2}$/.test(b)) continue;
      (lupt[p] ??= []).push(px(a) - px(b));
    }
  }
  const mean = (a) => +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
  const summary = {};
  for (const [p, a] of Object.entries(lupt)) summary[p] = { mean: mean(a), min: Math.min(...a), max: Math.max(...a), n: a.length };
  return { gapFajr: mean(gapF), gapIsha: mean(gapI), lupt: summary };
}

const clusterOf = {
  'luton-central': 'T1', 'brighton-almedinah': 'T1', 'dudley-mcc': 'T1', 'ilford-mosque': 'T1',
  'cambridge-central': 'T1', 'middlesbrough-central': 'T1', 'preston-jamea': 'T1', 'stoke-citycentral': 'T1',
  'birmingham-central': 'T1',
  'cardiff-swicc': 'T2', 'hull-mosque': 'T2',
  'blackpool-central': 'F', 'stockport-ic': 'F',
  'watford-jamia': 'E', 'leicester-umar': 'E', 'nottingham-ic': 'E',
  'edinburgh-central': 'S',
  'aberdeen-amic-central': 'W',
};

const modelName = (m) => (m === 'stepwise-interval' ? 'table-interval' : m);
const capped = new Set(['aberdeen-amic-central']);
const bestBy = (t, key) => t.candidates.reduce((a, b) => (b[key].exact > a[key].exact || (b[key].exact === a[key].exact && b[key].within1 > a[key].within1) ? b : a));
const score = (c, key) => ({ name: c.name, exact: c[key].exact, within1: c[key].within1, worst: c[key].worst, margin: c[key].margin, mode: c[key].mode, coverage: c[key].coverage });

const towns = [];
for (const t of fit.tables) {
  const g = gaps[t.town];
  const free = t.freeFit?.bare?.[0] ?? null;
  const nov = november(t.file, t.cols, t.lat, t.lng);
  towns.push({
    town: t.town, tag: t.tag, file: t.file.replace(HOME, '$HOME'),
    lat: t.lat, lng: t.lng, span: t.span, rows: t.rowsParsed,
    school: t.solar.asrBest === 'hanafi' ? 'hanafi' : 'shafi',
    schoolEvidence: { hanafiExact: t.solar.asrHanafi?.exact ?? null, shafiExact: t.solar.asrShafi?.exact ?? null, rows: t.rowsParsed },
    fajr: {
      model: capped.has(t.tag) ? 'capped-angle' : g ? modelName(g.fajr.model) : null,
      bestAngle: g ? g.fajr.bestAngle : null,
      angleBand: g ? [Math.min(...g.fajr.band), Math.max(...g.fajr.band)] : null,
      fitRms: g ? { angle: g.fajr.angleRms, interval: g.fajr.fixedRms } : null,
      novemberGapMinutes: nov.gapFajr,
      bestNamed: score(bestBy(t, 'fajr'), 'fajr'),
    },
    isha: {
      model: capped.has(t.tag) ? 'capped-angle' : g ? modelName(g.isha.model) : null,
      bestAngle: g ? g.isha.bestAngle : null,
      angleBand: g ? [Math.min(...g.isha.band), Math.max(...g.isha.band)] : null,
      fitRms: g ? { angle: g.isha.angleRms, interval: g.isha.fixedRms } : null,
      novemberGapMinutes: nov.gapIsha,
      bestNamed: score(bestBy(t, 'isha'), 'isha'),
    },
    freeFit: free ? { fa: free.fa, is: free.is, fajrExact: free.bf.exact, ishaExact: free.bi.exact, fajrMargin: free.bf.margin, ishaMargin: free.bi.margin, coverage: free.cov } : null,
    luptNovemberDelta: nov.lupt,
    cluster: clusterOf[t.tag],
  });
}

const members = (id) => towns.filter((t) => t.cluster === id).map((t) => t.town);
const schools = (id) => {
  const s = towns.filter((t) => t.cluster === id);
  const h = s.filter((t) => t.school === 'hanafi').length;
  return `${h} Hanafi, ${s.length - h} Shafi`;
};

const clusters = [
  {
    id: 'T1', name: 'Sunrise-table fajr + angle isha',
    recipe: 'fajr from a printed table anchored to sunrise, 96 to 102 minutes before it and stepping a few minutes inside a month (Birmingham 110, Stoke 112); isha at an angle between 12 and 16 degrees with a -9 to 0 minute offset',
    members: members('T1'), schools: schools('T1'),
    evidence: 'fajr is not an angle: a 12 to 21 degree sweep leaves 1.1 to 2.2 min RMS against 0.86 to 1.1 for an interval, and no named angle candidate passes 11/30 exact. isha is an angle: a fixed interval leaves 1.7 to 2.7 min RMS against 0.3 to 0.5 for the best angle.',
  },
  {
    id: 'T2', name: 'Sunrise-table fajr + fixed-interval isha',
    recipe: 'fajr anchored to sunrise (Cardiff 104, Hull 99 minutes); isha at a constant 80 to 83 minutes after sunset, with no angle behaviour at all',
    members: members('T2'), schools: schools('T2'),
    evidence: 'Cardiff isha 0.31 min RMS as a constant 83-minute interval against 2.16 as an angle; Hull 0.27 against 2.07 at a constant 80 minutes, and the interval holds across both of its windows (January and November-December).',
  },
  {
    id: 'F', name: 'ISNA 15/15',
    recipe: 'fajr 15 (fitted 14.5), isha 15 (fitted 14.0 to 14.4), floor rounding, +0.5 minute',
    members: members('F'), schools: schools('F'),
    evidence: 'ISNA 15/15 reproduces the print within 1 minute on 56 to 60 of 60 field-days (Blackpool fajr 28/30 and isha 27/30 exact, Stockport 26/30 and 28/30); every 18-degree candidate fails at 0/30 fajr.',
  },
  {
    id: 'E', name: 'Karachi 18/18',
    recipe: 'fajr 18, isha 18, floor rounding, 0 to 2 minutes',
    members: members('E'), schools: schools('E'),
    evidence: 'Leicester fajr 30/30 exact with worst 0 and isha 28/30 exact; Watford fajr 29/30 and isha 28/30; Nottingham fajr exact to 4 minutes all year and isha exact to 1 minute in every month outside the no-true-isha window.',
  },
  {
    id: 'S', name: 'MWL 18/17',
    recipe: 'fajr 18 (fitted 18.9), isha 17 (fitted 16.5), +0.5 minute',
    members: members('S'), schools: schools('S'),
    evidence: 'MWL 18/17 gives fajr 29/30 and isha 28/30 exact, worst 1. Karachi 18/18 drops isha to 23/30 and Diyanet 18/16 to 22/30.',
  },
  {
    id: 'W', name: 'Wifaqul 18/15 with night caps',
    recipe: 'fajr 18 capped at half the night, isha 15 capped at a seventh of the night',
    members: members('W'), schools: schools('W'),
    evidence: 'Aberdeen full year: 319/333 exact and 333/333 within 1 minute on both prayers, worst 1 in every one of the eleven months held; the free portion scan returns 1/2 and 1/7 on 18/15 independently, and no bare candidate covers more than 252 days.',
  },
];

const out = {
  meta: {
    job: 'fit12 - UK mosaic recipe map',
    adhan: '4.4.6',
    discipline: 'second resolution then explicit rounding; no clock reads; dates from the data strings; TZ Europe/London',
    coordinates: 'standard town centres (the captures carry no coordinate metadata)',
    luptReference: 'londonsalahtimes.com monthly 2027 pages, same MM-DD; the November rows give the delta',
    identifiability: 'One month cannot pin an angle: with a free offset a 12 to 21 degree sweep fits a print equally well. Families about 3 degrees apart are separable (an 18-degree candidate fails 0/30 exact on a 15-degree print). Named recipes appear where a candidate reproduces the print within 1 minute.',
    span: 'one year per surface where the surface serves a year, one month for the monthly prints',
    seasonality: 'season.json holds the per-month stability and the January-to-July span for the two year surfaces',
    surfaces: towns.length,
  },
  towns,
  clusters,
  reference: {
    lupt: {
      model: 'table-interval (same form as T1 and T2)',
      fajrNovemberGapMinutes: 103.2,
      fajrRms: { angle: 0.85, interval: 2.04 },
      ishaRms: { angle: 0.68, interval: 2.58 },
      note: 'the published London table is itself a sunrise-anchored interval, so the modal form is LUPT-form while no town reproduces LUPT values',
    },
    fit4CrossCheck: {
      source: 'fit4/scotland-fit.json',
      glasgow: 'Karachi 18/18 tops the candidate table (965), free fit 18.2/18.1, so family E',
      dundee: 'Wifaqul 18/15 caps tops the table (1053), free portion scan returns 1/2+1/7 on 18.1/14.55, so family W',
    },
  },
  yearProof: season,
  answer: 'A true mosaic, not one English-Hanafi recipe: six recipe families across eighteen surfaces, and school does not predict the recipe. The largest family is the sunrise-table form (11 of 18, both schools), which is LUPT\'s form but never LUPT\'s values. The only recipe proven to hold a whole year at high latitude is Wifaqul 18/15 with night caps.',
};
fs.writeFileSync(DIR + 'uk-mosaic.json', JSON.stringify(out, null, 1));

for (const t of towns) {
  console.log(`${t.town.padEnd(14)} ${t.cluster.padEnd(3)} ${t.school.padEnd(6)} ${String(t.fajr.model).padEnd(15)} ${String(t.isha.model).padEnd(15)} gaps ${String(t.fajr.novemberGapMinutes).padStart(6)}/${String(t.isha.novemberGapMinutes).padStart(6)} LUPT ${String(t.luptNovemberDelta.fajr?.mean).padStart(6)} | fajr ${t.fajr.bestNamed.name.padEnd(32)} ${t.fajr.bestNamed.exact}/${t.fajr.bestNamed.coverage} | isha ${t.isha.bestNamed.name.padEnd(32)} ${t.isha.bestNamed.exact}/${t.isha.bestNamed.coverage}`);
}
console.log('\nwrote uk-mosaic.json');
