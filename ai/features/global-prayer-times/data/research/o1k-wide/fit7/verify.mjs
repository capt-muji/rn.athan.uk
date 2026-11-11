// One job per run. Writes fit7/<job>.json: the verified recipe, its scores on both the
// fitting engine (adhan 4.4.6) and the publisher-side engine, and the evidence behind it.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import {
  COLUMNS, parseHm, rawTimes, coordsOf, makeParams, sweep, amplitude, monthlyBias,
} from './fit.mjs';

const require = createRequire(import.meta.url);
const { PrayEngine } = require('$HOME/athan-gitree/census/o1f-london/praytimes.cjs');

const DATA = '$HOME/athan-gitree/census/o1k-wide/americas2/data';
const OUT = '$HOME/athan-gitree/census/o1k-wide/fit7';
const r3 = (x) => Math.round(x * 1000) / 1000;
const read = (f) => JSON.parse(fs.readFileSync(`${DATA}/${f}`, 'utf8'));

const JOBS = {
  gt: {
    id: 'gt-aldaawa-guatemala',
    country: 'Guatemala',
    place: 'Mezquita Aldaawa Islamica de Guatemala, Zona 9, Guatemala City',
    source: 'americas2/data/gt_aldaawa_2026.json (mawaqit athan table, 365 rows + 365 iqamah)',
    rows: read('gt_aldaawa_2026.json').athan,
    lat: 14.6349, lon: -90.5069, tz: 'America/Guatemala', tzHours: -6,
    sourceCoords: { lat: 14.610256196072, lon: -90.515532642603 },
    adhanParams: { fajrAngle: 18, ishaAngle: 17, ishaInterval: 0, madhab: 'shafi', dhuhrOffset: -1 },
    publisher: { angles: { fajr: 18, ishaAngle: 17, asrFactor: 1 }, margins: {}, ishaRule: 'angle' },
    verdict: 'CONFIRMED exactly',
    limits: [
      'one calendar year only (2026), the whole span the surface publishes',
      'iqamah rows are five fixed offsets from the athan (+10 fajr, +10 dhuhr, +10 asr, +5 maghrib, +10 isha) and are not part of the time recipe',
    ],
  },
  hn: {
    id: 'hn-centro-islamico-san-pedro-sula',
    country: 'Honduras',
    place: 'Centro Islamico de Honduras, San Pedro Sula',
    source: 'americas2/data/hn_sps_centro_islamico_2026.json (mawaqit athan table, 365 rows + 365 iqamah)',
    rows: read('hn_sps_centro_islamico_2026.json').athan,
    lat: 15.5041, lon: -88.0250, tz: 'America/Tegucigalpa', tzHours: -6,
    sourceCoords: { lat: 15.490209545985, lon: -88.032333927474 },
    adhanParams: { fajrAngle: 18, ishaAngle: 18, ishaInterval: 0, madhab: 'hanafi', maghribOffset: 5, ishaOffset: 5, dhuhrOffset: -1 },
    publisher: { angles: { fajr: 18, ishaAngle: 18, asrFactor: 2, maghribMinutes: 5 }, margins: {}, ishaRule: 'angle+5' },
    verdict: 'CONFIRMED exactly',
    limits: [
      'one calendar year only (2026)',
      'Honduras keeps UTC-6 all year, so no offset transition falls inside the span and none needs modelling',
    ],
  },
  sr: {
    id: 'sr-sma-paramaribo',
    country: 'Suriname',
    place: 'Surinaamse Moeslim Associatie, Paramaribo',
    source: 'americas2/data/sr_sma_paramaribo_2025-04-29_2025-05-27.json (image transcription, 29 rows)',
    rows: read('rows_sr_sma_paramaribo_2025.json'),
    lat: 5.8664, lon: -55.1668, tz: 'America/Paramaribo', tzHours: -3,
    adhanParams: { fajrAngle: 18, ishaAngle: 0, ishaInterval: 73.5, madhab: 'hanafi', maghribOffset: 3.5, sunriseOffset: 0.5, dhuhrOffset: -1 },
    publisher: { angles: { fajr: 18, ishaAngle: 18, asrFactor: 2, maghribMinutes: 3.5 }, margins: { sunrise: 0.5 }, ishaRule: 'maghrib+70' },
    verdict: 'REFUTED on isha, confirmed elsewhere',
    limits: [
      '29 days of one month (2025-04-29 to 2025-05-27): a season, not a year',
      'near-equator span, where an isha angle and an isha interval are all but degenerate',
      'transcribed from a JPG; a misread digit would show as a spike and none does',
    ],
  },
  ve: {
    id: 've-mezquita-de-caracas',
    country: 'Venezuela',
    place: 'Mezquita de Caracas',
    source: 'americas2/data/ve_caracas_mezquita_2026-10-12_2026-11-10.json (monthly PDF, 30 rows)',
    rows: read('ve_caracas_mezquita_2026-10-12_2026-11-10.json'),
    lat: 10.4806, lon: -66.9036, tz: 'America/Caracas', tzHours: -4,
    adhanParams: { fajrAngle: 18.5, ishaAngle: 0, ishaInterval: 91, madhab: 'shafi', fajrOffset: 0.75, sunriseOffset: -0.5, dhuhrOffset: 1.5, asrOffset: 1, maghribOffset: 2 },
    publisher: {
      angles: { fajr: 18.5, ishaAngle: 18.5, asrFactor: 1 },
      margins: { fajr: 0.75, sunrise: -0.5, dhuhr: 2, asr: 0.5, maghrib: 2 },
      ishaRule: 'maghrib+89',
    },
    verdict: 'CONFIRMED on family and interval, one month only',
    limits: [
      'one Hijri month (2026-10-12 to 2026-11-10) of 30 days: one season, and it cannot separate the fajr angle from the fajr caution',
      'Venezuela keeps UTC-4 all year, so the span crosses no offset transition',
    ],
  },
  mx: {
    id: 'mx-guadalajara-isa-ibn-maryam',
    country: 'Mexico',
    place: 'Mezquita de Guadalajara Isa Ibn Maryam, Zapopan',
    source: 'americas2/data/mx_guadalajara_isa_ibn_maryam_masjidbox.json (7 dated rows)',
    rows: Object.fromEntries(Object.entries(read('mx_guadalajara_isa_ibn_maryam_masjidbox.json'))
      .filter(([, v]) => v.athan).map(([k, v]) => [k, v.athan])),
    lat: 20.6597, lon: -103.3496, tz: 'America/Mexico_City', tzHours: -6,
    adhanParams: { fajrAngle: 18, ishaAngle: 17, ishaInterval: 0, madhab: 'shafi', dhuhrOffset: -1 },
    publisher: { angles: { fajr: 18, ishaAngle: 17, asrFactor: 1 }, margins: {}, ishaRule: 'angle' },
    verdict: 'LEAD, not a fit',
    limits: [
      'seven rows: enough to name a family, never enough to bind a recipe',
      'city-centre coordinates, because the platform publishes a street address and no coordinate pair',
    ],
  },
};

const FAMILIES = {
  mwl_18_17: { fajrAngle: 18, ishaAngle: 17, ishaInterval: 0, madhab: 'shafi' },
  isna_15_15: { fajrAngle: 15, ishaAngle: 15, ishaInterval: 0, madhab: 'shafi' },
  mml_18_18: { fajrAngle: 18, ishaAngle: 18, ishaInterval: 0, madhab: 'shafi' },
  umm_al_qura_18_5_90: { fajrAngle: 18.5, ishaAngle: 0, ishaInterval: 90, madhab: 'shafi' },
  egypt_19_5_17_5: { fajrAngle: 19.5, ishaAngle: 17.5, ishaInterval: 0, madhab: 'shafi' },
  karachi_18_18_hanafi: { fajrAngle: 18, ishaAngle: 18, ishaInterval: 0, madhab: 'hanafi' },
};

const KEY = process.argv[2];
if (!KEY) throw new Error('job key required: gt|hn|sr|ve|mx');
const J = JOBS[KEY];
const dates = Object.keys(J.rows).sort();
const printed = {};
for (const iso of dates) {
  printed[iso] = {};
  COLUMNS.forEach((c, i) => { printed[iso][c] = parseHm(J.rows[iso][i]); });
}

function publisherTimes(iso, lat, lon) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new PrayEngine(lat, lon, J.tzHours).times(y, m, d, J.publisher.angles);
  const v = {};
  for (const c of COLUMNS) v[c] = (t[c] + (J.publisher.margins[c] || 0) / 60) * 60;
  if (J.publisher.angles.maghribMinutes) {
    v.maghrib = (t.sunset + J.publisher.angles.maghribMinutes / 60 + (J.publisher.margins.maghrib || 0) / 60) * 60;
  }
  if (J.publisher.ishaRule === 'angle+5') v.isha = (t.isha + 5 / 60) * 60;
  if (J.publisher.ishaRule.startsWith('maghrib+')) v.isha = v.maghrib + Number(J.publisher.ishaRule.split('+')[1]);
  return v;
}

function scoreAt(lat, lon) {
  const coords = coordsOf(lat, lon);
  const pub = Object.fromEntries(COLUMNS.map((c) => [c, { exact: 0, mae: 0, worst: 0, bias: 0 }]));
  let pubAllSix = 0;
  for (const iso of dates) {
    const v = publisherTimes(iso, lat, lon);
    let day = true;
    for (const c of COLUMNS) {
      const diff = printed[iso][c] - Math.round(v[c]);
      if (diff !== 0) day = false;
      if (diff === 0) pub[c].exact++;
      pub[c].mae += Math.abs(printed[iso][c] - v[c]);
      pub[c].bias += printed[iso][c] - v[c];
      pub[c].worst = Math.max(pub[c].worst, Math.abs(diff));
    }
    if (day) pubAllSix++;
  }
  for (const c of COLUMNS) {
    pub[c].mae = r3(pub[c].mae / dates.length);
    pub[c].bias = r3(pub[c].bias / dates.length);
  }

  const params = makeParams(J.adhanParams);
  const raw = {};
  for (const iso of dates) raw[iso] = rawTimes(coords, iso, params, J.tz);
  const ad = {};
  let jointExact = 0, jointWithin1 = 0, jointWorst = 0;
  for (const c of COLUMNS) {
    let exact = 0, within1 = 0, worst = 0, sum = 0;
    for (const iso of dates) {
      const diff = Math.abs(Math.round(raw[iso][c]) - printed[iso][c]);
      if (diff === 0) exact++;
      if (diff <= 1) within1++;
      worst = Math.max(worst, diff);
      sum += Math.abs(raw[iso][c] - printed[iso][c]);
    }
    ad[c] = { exact, within1, worst, mae: r3(sum / dates.length) };
    jointWorst = Math.max(jointWorst, worst);
  }
  for (const iso of dates) {
    let ok = true, ok1 = true;
    for (const c of COLUMNS) {
      const diff = Math.abs(Math.round(raw[iso][c]) - printed[iso][c]);
      if (diff !== 0) ok = false;
      if (diff > 1) ok1 = false;
    }
    if (ok) jointExact++;
    if (ok1) jointWithin1++;
  }
  return {
    publisher: pub,
    publisher_days_all_six_exact: pubAllSix,
    adhan: ad,
    adhan_joint: { exact: jointExact, within1: jointWithin1, worst: jointWorst, of: dates.length * COLUMNS.length },
    adhan_offsets_measured: Object.fromEntries(COLUMNS.map((c) => [c, r3(pub[c].bias)])),
    raw,
    params,
  };
}

const primary = scoreAt(J.lat, J.lon);

// asr school separation at the fitted base
const other = makeParams({ ...J.adhanParams, madhab: J.adhanParams.madhab === 'hanafi' ? 'shafi' : 'hanafi' });
const coords = coordsOf(J.lat, J.lon);
let gap = 0;
for (const iso of dates) gap += Math.abs(rawTimes(coords, iso, other, J.tz).asr - primary.raw[iso].asr);

const familyScreen = {};
for (const [name, f] of Object.entries(FAMILIES)) {
  const p = makeParams({ ...f });
  let sum = 0, allSix = 0;
  const per = Object.fromEntries(COLUMNS.map((c) => [c, { exact: 0, mae: 0 }]));
  const r = {};
  for (const iso of dates) r[iso] = rawTimes(coords, iso, p, J.tz);
  for (const iso of dates) {
    let day = true;
    for (const c of COLUMNS) {
      if (Math.round(r[iso][c]) !== printed[iso][c]) day = false;
      else per[c].exact++;
      per[c].mae += Math.abs(printed[iso][c] - r[iso][c]);
      sum += Math.abs(printed[iso][c] - r[iso][c]);
    }
    if (day) allSix++;
  }
  familyScreen[name] = {
    mean_mae: r3(sum / (6 * dates.length)),
    days_all_six_exact: allSix,
    per_column_mae: Object.fromEntries(COLUMNS.map((c) => [c, r3(per[c].mae / dates.length)])),
    per_column_exact: Object.fromEntries(COLUMNS.map((c) => [c, per[c].exact])),
  };
}
const familyRanking = Object.entries(familyScreen)
  .sort((a, b) => a[1].mean_mae - b[1].mean_mae)
  .map(([family, v]) => ({ family, mean_mae: v.mean_mae, days_all_six_exact: v.days_all_six_exact }));

const cross = J.sourceCoords ? scoreAt(J.sourceCoords.lat, J.sourceCoords.lon) : null;

// free fit: no held recipe, each column's own parameter swept against the printed minute
const freeFit = {};
{
  const f = sweep(dates, printed, 'fajr', 15, 21, 0.02, coords,
    (a) => makeParams({ ...J.adhanParams, fajrAngle: a }), J.tz);
  const atRecipe = makeParams(J.adhanParams);
  let sum = 0;
  for (const iso of dates) sum += Math.abs(printed[iso].fajr - rawTimes(coords, iso, atRecipe, J.tz).fajr);
  freeFit.fajr = {
    best_angle: Math.round(f.value * 100) / 100,
    best_mae: r3(f.mae),
    mae_at_recipe_angle: r3(sum / dates.length),
  };
  const ia = sweep(dates, printed, 'isha', 14, 21, 0.02, coords,
    (a) => makeParams({ ...J.adhanParams, ishaAngle: a, ishaInterval: 0 }), J.tz);
  const ii = sweep(dates, printed, 'isha', 50, 120, 0.5, coords,
    (v) => makeParams({ ...J.adhanParams, ishaAngle: 0, ishaInterval: v }), J.tz);
  freeFit.isha = {
    angle_model: { best: Math.round(ia.value * 100) / 100, mae: r3(ia.mae) },
    interval_model: { best_from_sunset_minutes: ii.value, mae: r3(ii.mae) },
    better: ia.mae < ii.mae ? 'angle' : 'interval',
  };
}

const out = {
  id: J.id,
  country: J.country,
  place: J.place,
  source_file: J.source,
  coords: { lat: J.lat, lon: J.lon },
  source_published_coords: J.sourceCoords ?? null,
  tz: J.tz,
  span: { first: dates[0], last: dates[dates.length - 1], days: dates.length, years_held: [...new Set(dates.map((d) => d.slice(0, 4)))] },
  rows: dates.length,
  fitting_engine: 'adhan 4.4.6 (TZ per job, no real clock)',
  verified_recipe: {
    fajr_angle: J.publisher.angles.fajr,
    isha_rule: J.publisher.ishaRule,
    isha_angle: J.publisher.angles.ishaAngle,
    asr_school: J.adhanParams.madhab === 'hanafi' ? 'Hanafi' : 'Shafi',
    rounding: 'nearest minute',
    margins_minutes: J.publisher.margins,
  },
  verdict: J.verdict,
  publisher_engine: {
    note: 'PrayTimes v2-family solar engine, which is what these tables are computed from. Zero margins reproduce the table exactly where the angles are the holding.',
    scores: primary.publisher,
    days_all_six_exact: primary.publisher_days_all_six_exact,
  },
  adhan_side: {
    scores: primary.adhan,
    joint: primary.adhan_joint,
    offsets_measured_minutes: primary.adhan_offsets_measured,
    note: 'adhan carries its own meridian-transit offset against this engine, about +1.0 min on dhuhr and a +/-1.2 min seasonal skew on asr, so its margins are engine artefacts and not publisher margins',
  },
  cross_check_at_source_coords: cross && {
    coords: J.sourceCoords,
    publisher_scores: cross.publisher,
    publisher_days_all_six_exact: cross.publisher_days_all_six_exact,
    adhan_scores: cross.adhan,
    adhan_joint: cross.adhan_joint,
  },
  free_fit: freeFit,
  asr_school_gap_minutes: Math.round((gap / dates.length) * 10) / 10,
  family_screen: familyScreen,
  family_ranking: familyRanking,
  seasonal_amplitude_fajr: amplitude(dates, primary.raw, 'fajr'),
  asr_monthly_bias_adhan_vs_table: monthlyBias(dates, primary.raw, printed, 'asr'),
  limits: J.limits,
};
fs.writeFileSync(`${OUT}/${J.id}.json`, JSON.stringify(out, null, 1));

console.log(JSON.stringify({
  id: J.id, verdict: J.verdict,
  publisher: primary.publisher, allSix: primary.publisher_days_all_six_exact,
  adhanJoint: primary.adhan_joint, offsets: primary.adhan_offsets_measured,
  cross: cross && { allSix: cross.publisher_days_all_six_exact, publisher: cross.publisher, adhanJoint: cross.adhan_joint },
}, null, 1));
