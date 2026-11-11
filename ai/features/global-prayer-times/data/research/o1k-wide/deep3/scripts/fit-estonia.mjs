// Job 4: Estonia. Independent reproduction of the published EIC scheme
// (15/15, fajr clamp 45-120 before sunrise, per-month isha fallback) across
// Tallinn and Tartu, 2026 and 2027.
import fs from 'node:fs';
import path from 'node:path';
import { init, solarDay, rnd, score, round2, line } from './lib.mjs';

const ROOT = path.resolve(process.env.HOME, 'athan-gitree/census/o1k-wide/deep3');
const SRC = path.join(process.env.HOME, 'athan-gitree/census/o1k-wide/europe/data/ee-eic-both-cities-2026-2027.json');
const TZ = 'Europe/Tallinn';
const CITIES = {
  tallinn: { lat: 59.4370, lng: 24.7536 },
  tartu: { lat: 58.3780, lng: 26.7147 },
};
const METHOD = {
  fajrAngle: 15, ishaAngle: 15, asrShadow: 1, horizon: -0.8333,
  divisor: 60, minBefore: 45, maxBefore: 120, gap: 30, ishaNightThreshold: 520, fallback: 90,
};
const ISHA_MONTH = {
  1: 240, 2: 240, 3: 220, 4: 180, 5: 0, 6: 0, 7: 0, 8: 0, 9: 180, 10: 220, 11: 240, 12: 240,
};
const FIXED_MONTHS = new Set([5, 6, 7, 8]);

await init();
const src = JSON.parse(fs.readFileSync(SRC, 'utf8'));

const nextIso = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
};
const prevIso = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
};
const mod = (v, n) => ((v % n) + n) % n;

// One day of the published scheme, from adhan's solar core.
function engine(city, iso) {
  const { lat, lng } = CITIES[city];
  const d = solarDay(lat, lng, iso, TZ);
  const sunrise = d.sunrise;
  const sunset = d.sunset;
  const transit = d.transit;
  const asr = d.asr(METHOD.asrShadow);
  const maghrib = sunset;
  const month = +iso.slice(5, 7);

  // Fajr: angle, guarded by the night portion, clamped when the angle is absent.
  const angleFajr = d.fajr(METHOD.fajrAngle);
  const prev = solarDay(lat, lng, prevIso(iso), TZ);
  const night = mod(sunrise - prev.sunset, 86400) / 60;
  const rawPortion = night * METHOD.fajrAngle / METHOD.divisor;
  let fajr, fajrRule;
  if (angleFajr !== null && angleFajr < sunrise) {
    const guardPortion = rawPortion;  // guard is unbounded when the angle exists
    const guardTime = sunrise - guardPortion * 60;
    if (angleFajr < guardTime) { fajr = guardTime; fajrRule = 'guard'; }
    else { fajr = angleFajr; fajrRule = 'angle'; }
  } else {
    const maxP = Math.min(METHOD.maxBefore, Math.max(1, night - 1));
    const minP = Math.min(METHOD.minBefore, maxP);
    const portion = Math.min(Math.max(rawPortion, minP), maxP);
    fajr = sunrise - portion * 60;
    fajrRule = 'nightPortion';
  }
  // Fajr safety: at least 30 minutes after the previous isha.
  {
    const prevIsha = engineIsha(city, prevIso(iso), prev.sunset, { skipNextFajr: true });
    const earliest = prevIsha.time - 86400 + METHOD.gap * 60;
    if (fajr < earliest && earliest < sunrise) { fajr = earliest; fajrRule = fajrRule === 'angle' ? 'safety' : fajrRule + '+safety'; }
  }

  // Isha: May-Aug fixed at maghrib+90, other months the angle unless extreme.
  const isha = engineIsha(city, iso, maghrib, {});
  const ishaRule = isha.rule;

  return { fajr, fajrRule, sunrise, dhuhr: transit, asr, maghrib, isha: isha.time, ishaRule };
}

// Isha in isolation, so fajr's safety can call the previous day's isha.
function engineIsha(city, iso, maghrib, opts) {
  const { lat, lng } = CITIES[city];
  const month = +iso.slice(5, 7);
  const d = solarDay(lat, lng, iso, TZ);
  const next = solarDay(lat, lng, nextIso(iso), TZ);
  const nightLen = next.sunrise === null ? null : mod(next.sunrise - maghrib, 86400) / 60;
  let time, rule;
  if (FIXED_MONTHS.has(month)) {
    time = maghrib + METHOD.fallback * 60;
    rule = 'monthFixed';
  } else {
    const angle = d.isha(METHOD.ishaAngle);
    const afterMin = angle === null ? null : (angle - maghrib) / 60;
    const extreme = angle === null || (nightLen !== null && nightLen < METHOD.ishaNightThreshold)
      || (afterMin !== null && afterMin > ISHA_MONTH[month]);
    if (!extreme) { time = angle; rule = 'angle'; }
    else { time = maghrib + METHOD.fallback * 60; rule = 'fallback'; }
  }
  if (!opts.skipNextFajr && next.sunrise !== null) {
    const nextFajr = engineFajrCore(city, nextIso(iso), next.sunrise);
    const latest = nextFajr + 86400 - METHOD.gap * 60;
    if (time > latest && latest > maghrib) { time = latest; rule = 'safetyCap'; }
  }
  return { time, rule };
}

// Fajr core without the isha safety (as the engine's capIshaBeforeNextFajr uses).
function engineFajrCore(city, iso, sunrise) {
  const { lat, lng } = CITIES[city];
  const d = solarDay(lat, lng, iso, TZ);
  const angleFajr = d.fajr(METHOD.fajrAngle);
  const prev = solarDay(lat, lng, prevIso(iso), TZ);
  const night = mod(sunrise - prev.sunset, 86400) / 60;
  const rawPortion = night * METHOD.fajrAngle / METHOD.divisor;
  if (angleFajr !== null && angleFajr < sunrise) {
    const guardTime = sunrise - rawPortion * 60;
    return Math.max(angleFajr, guardTime);
  }
  const maxP = Math.min(METHOD.maxBefore, Math.max(1, night - 1));
  const minP = Math.min(METHOD.minBefore, maxP);
  return sunrise - Math.min(Math.max(rawPortion, minP), maxP) * 60;
}

const out = { city: {}, clamp: {} };
for (const city of Object.keys(CITIES)) {
  out.city[city] = {};
  for (const y of [2026, 2027]) {
    const isos = Object.keys(src[city]).filter((k) => k.startsWith(String(y))).sort();
    const model = isos.map((iso) => engine(city, iso));
    const printed = isos.map((iso) => src[city][iso]);
    const parse = (s) => {
      const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/.exec(s);
      let h = +m[1] % 12; if (m[3] === 'PM') h += 12;
      return h * 60 + +m[2];
    };
    const cols = {
      fajr: { model: 'fajr', mode: 'nearest' },
      sunrise: { model: 'sunrise', mode: 'nearest' },
      dhuhr: { model: 'dhuhr', mode: 'ceil' },
      asr: { model: 'asr', mode: 'ceil' },
      magrib: { model: 'maghrib', mode: 'ceil' },
      isha: { model: 'isha', mode: 'ceil' },
    };
    const scores = {};
    for (const [key, c] of Object.entries(cols)) {
      const secs = model.map((r) => r[c.model]);
      scores[key] = score(isos, printed.map((p) => parse(p[key])), (dd) => secs[dd], c.mode, 0, true);
    }
    // rule agreement: our classification against the publisher's own label
    const ruleAgree = { fajr: 0, isha: 0 };
    for (let i = 0; i < isos.length; i++) {
      if (model[i].fajrRule === printed[i].fajrRule) ruleAgree.fajr++;
      if (model[i].ishaRule === printed[i].ishaRule) ruleAgree.isha++;
    }
    const clampDays = {
      mine: model.map((r, i) => r.fajrRule !== 'angle' ? isos[i] : null).filter(Boolean),
      theirs: isos.filter((iso) => printed.find((p) => p === src[city][iso]).fajrRule !== 'angle'),
    };
    out.city[city][y] = { n: isos.length, scores, ruleAgree, clampCount: { mine: clampDays.mine.length, theirs: clampDays.theirs.length } };
    console.log(city, y, 'n', isos.length);
    for (const k of Object.keys(scores)) console.log('  ', line(k, scores[k]));
    console.log('   rule agreement fajr', ruleAgree.fajr, '/', isos.length, ' isha', ruleAgree.isha, '/', isos.length);
    console.log('   clamp days mine', clampDays.mine.length, 'theirs', clampDays.theirs.length);
  }
}

// Clamp binding detail per year: which rule fires, and the window edges.
for (const city of Object.keys(CITIES)) {
  out.clamp[city] = {};
  for (const y of [2026, 2027]) {
    const isos = Object.keys(src[city]).filter((k) => k.startsWith(String(y))).sort();
    const mine = isos.map((iso) => ({ iso, ...engine(city, iso) }));
    const counts = {};
    for (const r of mine) counts[r.fajrRule] = (counts[r.fajrRule] ?? 0) + 1;
    const bound = mine.filter((r) => r.fajrRule !== 'angle').map((r) => r.iso);
    const portionAt = mine.map((r) => {
      const { lat, lng } = CITIES[city];
      const d = solarDay(lat, lng, r.iso, TZ);
      const prev = solarDay(lat, lng, prevIso(r.iso), TZ);
      const night = mod(d.sunrise - prev.sunset, 86400) / 60;
      return { iso: r.iso, night: round2(night), portion: round2(night / 4) };
    });
    out.clamp[city][y] = {
      ruleCounts: counts,
      firstClampDay: bound[0], lastClampDay: bound.at(-1), clampDays: bound.length,
      clampDates: bound,
      minNightMinutes: round2(Math.min(...portionAt.map((p) => p.night))),
      minPortion: round2(Math.min(...portionAt.map((p) => p.portion))),
      maxPortion: round2(Math.max(...portionAt.map((p) => p.portion))),
      floorBinds: portionAt.filter((p) => p.portion < METHOD.minBefore).map((p) => p.iso),
      ceilingBinds: portionAt.filter((p) => p.portion > METHOD.maxBefore).map((p) => p.iso),
    };
    const c = out.clamp[city][y];
    console.log(city, y, 'clamp window', c.firstClampDay, '..', c.lastClampDay, 'n', c.clampDays,
      'portion', c.minPortion, '-', c.maxPortion, 'floor binds', c.floorBinds.length, 'ceiling', c.ceilingBinds.length);
  }
}

// The engine's own labels for the same years, straight from the published table.
const theirCounts = {};
for (const city of Object.keys(CITIES)) {
  theirCounts[city] = {};
  for (const y of [2026, 2027]) {
    const rows = Object.entries(src[city]).filter(([k]) => k.startsWith(String(y)));
    const f = {};
    for (const [, v] of rows) f[v.fajrRule] = (f[v.fajrRule] ?? 0) + 1;
    theirCounts[city][y] = f;
  }
}

// Two-year comparison of the binding window: identical dates?
const sameDates = {};
for (const city of Object.keys(CITIES)) {
  const md = (d) => d.slice(5);
  const a = new Set(out.clamp[city][2026].clampDates.map(md));
  const b = new Set(out.clamp[city][2027].clampDates.map(md));
  sameDates[city] = { both: [...a].filter((d) => b.has(d)).length,
    only2026: [...a].filter((d) => !b.has(d)), only2027: [...b].filter((d) => !a.has(d)) };
  console.log('same clamp month-days', city, JSON.stringify(sameDates[city]));
}
// Which bound bites inside the clamp branch itself.
for (const city of Object.keys(CITIES)) {
  for (const y of [2026, 2027]) {
    const isos = Object.keys(src[city]).filter((k) => k.startsWith(String(y))).sort();
    const { lat, lng } = CITIES[city];
    let floor = 0, ceil = 0, inner = 0;
    const portions = [];
    for (const iso of isos) {
      const r = engine(city, iso);
      if (r.fajrRule !== 'nightPortion') continue;
      const d = solarDay(lat, lng, iso, TZ);
      const prev = solarDay(lat, lng, prevIso(iso), TZ);
      const night = mod(d.sunrise - prev.sunset, 86400) / 60;
      const portion = night / 4;
      portions.push(portion);
      if (portion < METHOD.minBefore) floor++; else if (portion > METHOD.maxBefore) ceil++; else inner++;
    }
    out.clamp[city][y].clampPortionRange = { min: round2(Math.min(...portions)), max: round2(Math.max(...portions)) };
    out.clamp[city][y].boundsInsideClampBranch = { floor45: floor, ceiling120: ceil, unbound: inner };
    console.log('clamp branch bounds', city, y, JSON.stringify(out.clamp[city][y].boundsInsideClampBranch));
  }
}

fs.writeFileSync(path.join(ROOT, 'ee-deep.json'), JSON.stringify({
  job: 'Estonia EIC published scheme, 2026-2027',
  source: 'https://eestiislamikeskus.org (engine app.js run headlessly in the europe pass)',
  coordinates: CITIES, tz: TZ, scheme: { ...METHOD, ishaMonthMaxAngle: ISHA_MONTH, fixedMonths: [...FIXED_MONTHS] },
  byCityYear: out.city, clamp: out.clamp, publisherRuleCounts: theirCounts, clampDateAgreement: sameDates,
}, null, 1));
console.log('wrote ee-deep.json');
