// UK form map: resolves the four agents' labels town by town from the raw
// captures, on two separate axes - the construction (angle or interval) and the
// distance from the LUPT table. Labels that look contradictory usually sit on
// different axes; this file keeps them apart.
//
// The town class is fajr-driven, as the brief requires: a fajr that no angle can
// hold is a table, whatever the isha side does. The isha is carried beside it.
import fs from 'node:fs';
import path from 'node:path';
const ROOT = '$HOME/athan-gitree/census/o1k-wide';
const recon = JSON.parse(fs.readFileSync(path.join(ROOT, 'ukreconcile/recon.json'), 'utf8'));
const TOWN_META = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(ROOT, 'ukreconcile/towns.json'), 'utf8')).map((t) => [t.tag, t]));

const CENSUS = {
  karachi: { name: 'Karachi 18/18', fajr: 18, isha: 18 },
  isna: { name: 'ISNA 15/15', fajr: 15, isha: 15 },
  mwl: { name: 'MWL 18/17', fajr: 18, isha: 17 },
  diyanet: { name: 'Diyanet 18/16', fajr: 18, isha: 16 },
  wifaqul: { name: 'Wifaqul 18/15 + 1/2,1/7 caps', fajr: 18, isha: 15 },
};

const CLAIMS = {
  'luton-central': { fit4: null, fit12: 'T1: fajr table (100 min), isha angle', verify3: 'interval table, LUPT construction', fit14: 'fajr drift, isha offset 0' },
  'brighton-almedinah': { fit4: null, fit12: 'T1: fajr table, isha angle', verify3: null, fit14: 'drift both' },
  'dudley-mcc': { fit4: null, fit12: 'T1: fajr table, isha angle', verify3: null, fit14: 'drift both' },
  'preston-jamea': { fit4: null, fit12: 'T1: fajr table, isha unreadable', verify3: null, fit14: 'fajr drift' },
  'blackpool-central': { fit4: null, fit12: 'F: ISNA 15/15', verify3: null, fit14: 'fajr drift, isha offset +10' },
  'middlesbrough-central': { fit4: null, fit12: 'T1: fajr table, isha angle', verify3: null, fit14: 'exact both' },
  'stockport-ic': { fit4: null, fit12: 'F: ISNA 15/15', verify3: null, fit14: 'fajr drift, isha offset +7' },
  'watford-jamia': { fit4: null, fit12: 'E: Karachi 18/18', verify3: 'angle 18, 30/30 within 1', fit14: 'fajr drift, isha offset +23' },
  'ilford-mosque': { fit4: null, fit12: 'T1: fajr table, isha angle', verify3: null, fit14: 'drift both' },
  'cambridge-central': { fit4: null, fit12: 'T1: fajr table, isha angle', verify3: null, fit14: 'offset -2/-5' },
  'stoke-citycentral': { fit4: null, fit12: 'T1: fajr interval 112, isha angle 15', verify3: null, fit14: 'fajr drift, isha offset +2' },
  'birmingham-central': { fit4: null, fit12: 'T1: fajr table (88.4), isha angle', verify3: null, fit14: 'fajr drift, isha offset -1' },
  'leicester-umar': { fit4: null, fit12: 'E: Karachi 18/18', verify3: null, fit14: 'fajr drift, isha offset +24' },
  'nottingham-ic': { fit4: null, fit12: 'E: Karachi 18/18, summer invented', verify3: 'angle 18/18, 244/273 within 1; refutes the universal', fit14: 'angle-like both' },
  'reading-amic': { fit4: 'LUPT family, own solar, +2..+4 / -4..-9 drifting', fit12: null, verify3: null, fit14: 'fajr none (no sunrise), isha drift' },
  'coventry-zeenatul': { fit4: 'LUPT +3/+3 (179/181, 146/181)', fit12: null, verify3: 'seasonal table, plateaus', fit14: 'offset+step +3, offset+dip +2' },
  'rochdale-golden': { fit4: 'LUPT family, seasonal drift +5..+3 / -3..-9', fit12: null, verify3: null, fit14: 'drift both' },
  'bolton-zakariyya': { fit4: 'LUPT +3/+5 (172/176, 134/176)', fit12: null, verify3: null, fit14: 'offset +3, offset+dip +5' },
  'oldham-ocmic': { fit4: null, fit12: null, verify3: null, fit14: 'drift both' },
  'oldham-westwood': { fit4: null, fit12: null, verify3: null, fit14: 'drift both' },
  'oxford-coms': { fit4: null, fit12: null, verify3: 'angle 18, 332/365 within 1', fit14: 'angle-like both' },
  'slough-jmic': { fit4: null, fit12: null, verify3: null, fit14: 'angle-like both' },
  'walsall-wjmg': { fit4: null, fit12: null, verify3: null, fit14: 'angle-like both' },
  'cardiff-swicc': { fit4: null, fit12: 'T2: interval fajr, fixed 83 isha', verify3: null, fit14: 'fajr offset +3, isha drift' },
  'hull-mosque': { fit4: null, fit12: 'T2: interval fajr 99.5, interval isha 80', verify3: null, fit14: 'offset+dip -3, -21' },
  'bradford-hanfia': { fit4: null, fit12: null, verify3: null, fit14: 'isha angle-like' },
  'bradford-victor': { fit4: null, fit12: null, verify3: null, fit14: 'fajr drift, isha offset -36' },
  'elm-london': { fit4: null, fit12: null, verify3: 'LUPT reference', fit14: 'exact both' },
  'london-icc': { fit4: null, fit12: null, verify3: null, fit14: 'exact both' },
  'mwh-north-london': { fit4: null, fit12: null, verify3: null, fit14: 'offset -1/-7' },
  'glasgow-central': { fit4: 'own engine, ~18.2/18.1 with +-3 min drift, 01:33 clamp 96 days', fit12: 'E: Karachi 18/18 (inherited, not refitted)', verify3: null, fit14: 'fajr own-table, isha angle-like' },
  'dundee-almaktoum': { fit4: 'split: 18 deg winter, night-fraction summer (0.307/0.15)', fit12: 'W: Wifaqul 18/15 caps', verify3: null, fit14: 'angle-like both' },
  'edinburgh-central': { fit4: 'MWL 18/17, November only', fit12: 'S: MWL 18/17', verify3: null, fit14: 'isha offset +30' },
  'aberdeen-central': { fit4: 'Wifaqul 18/15 caps exact, 319/333', fit12: 'W: Wifaqul 18/15 caps, 319/333', verify3: null, fit14: 'fajr own-table, isha angle-like' },
  'aberdeen-spital': { fit4: 'Wifaqul 18/15 caps exact, 319/333', fit12: null, verify3: null, fit14: 'fajr own-table, isha angle-like' },
};

// hand-verified overrides where the generic rule cannot see the whole shape
const OVERRIDE = {
  'preston-jamea': {
    isha: {
      model: 'absent', detail: 'the capture\'s last column runs 16.5 min before sunset all month, so it is not an isha',
      reason: 'printed isha < printed maghrib on 30/30 rows; the column is a mis-read or another convention',
    },
  },
  'oxford-coms': {
    isha: {
      model: 'angle-named', recipe: 'Karachi 18/18 (Nov-Jan), clock floor from February',
      pairRecipe: 'Karachi 18/18 both sides; isha clock floor from February',
      reason: 'implied depression is exactly 18.0 through Nov-Jan then drops to 13.1 and holds; that is a printed clock limit, not a seasonal array',
    },
  },
  'bradford-hanfia': {
    isha: {
      model: 'angle-noncensus', recipe: 'angle 9.0 deg, mild summer fallback',
      pairRecipe: 'ISNA 15/15 fajr + 9.0 deg isha',
      reason: 'Nov-Feb implied depression 8.95-9.02; the summer months fall only to 7.7, i.e. a cap, not a table',
    },
  },
};

// what each resolved verdict overturns, where an agent's label does not survive
const CORRECTIONS = {
  'luton-central': [
    'fit12\'s isha "angle" survives only with a free -3 min offset; at zero offset a 15 deg isha hits 3/30 days. A non-census 14.6 deg angle and the LUPT isha array both fit; the array is the parsimonious reading (I = LUPT + 0 on 29/30).',
    'verify3\'s interval verdict holds on the fajr side and is under-determined on the isha side.',
  ],
  'coventry-zeenatul': [
    'verify3\'s "seasonal table, F 90-157" is inflated by three 26-28 March DST rows at +63 min; on the other 362 days F is LUPT + 3 within 1 on 98.6%. The table is LUPT +3/+3 plus a shared summer isha dip.',
  ],
  'glasgow-central': [
    'fit12\'s "E: Karachi 18/18" does not survive: 0/120 core days within 1 of an 18 deg fajr, and the fajr lead sits 32 min off LUPT\'s. fit4\'s own-table verdict stands.',
  ],
  'dundee-almaktoum': [
    'fit12\'s "W: Wifaqul 18/15 caps" fails on both columns (fajr 216/365 within 1, isha 134/365). fit4\'s split regime stands: an 18 deg fajr every day it is defined, then a night-fraction of 0.307 (fajr) and 0.15 (isha) rounded to weekly plateaus.',
    'The isha is a weekly-stepped table (max step 11 min), not a frozen 15 deg angle: 56/120 core days within 1 of 15 deg.',
  ],
  'watford-jamia': [
    'fit14\'s "fajr drift, isha offset +23" is a distance-from-LUPT label, not a model class. Both columns are angles: 30/30 and 27/30 within 1 of 18/18 at zero offset.',
  ],
  'leicester-umar': [
    'fit14\'s "isha offset +24" is likewise a distance label; the isha is an 18.0 deg angle on 28/30 days, which coincides with LUPT + 24 for one month.',
  ],
  'blackpool-central': [
    'fit14\'s "isha offset +10" is a distance label; ISNA 15/15 reproduces both columns at zero offset on 30/30 and 27/30 days.',
  ],
  'stockport-ic': [
    'fit14\'s "isha offset +7" is a distance label; ISNA 15/15 reproduces both columns on 30/30 and 28/30 days at zero offset.',
  ],
  'birmingham-central': [
    'fit14\'s "fajr drift" is right about the distance but the fajr is a table (0/30 within 1 of any census angle); the isha is undecidable on one month.',
  ],
  'stoke-citycentral': [
    'fit12\'s "fajr interval 112" is 110.0 min exactly on all 30 days against the printed sunrise.',
  ],
  'hull-mosque': [
    'fit12\'s "99.5 / 80" is measured against a computed sunrise; against the capture\'s own sunrise the intervals are exactly 95 and 75 min, and the capture prints sunrise 4.7 min early consistently.',
  ],
  'middlesbrough-central': [
    'Stronger than fit14\'s "exact both": the November print is LUPT itself on both columns (30/30 at offset 0).',
  ],
  'slough-jmic': [
    'fit14\'s "angle-like both" holds on the fajr side; the isha is a constant 90-min interval, not an angle.',
    'The capture prints the whole year on GMT (217 rows 60 min early), which corrupts any absolute-time fit but leaves F and I untouched.',
  ],
  'walsall-wjmg': [
    'fit14\'s "angle-like both" holds: 18/18 at zero offset on 116/121 core days, with a clock clamp in the summer months.',
    'The capture prints the whole year on GMT (210 rows 60 min early); with that repaired the implied depression is 18.0 in every month outside the clamp.',
  ],
  'oxford-coms': [
    'verify3\'s angle verdict holds (120/120 core days within 1 of 18 deg). New: the isha is 18 deg only to January, then a clock floor from February.',
  ],
  'bradford-hanfia': [
    'fit14\'s "isha angle-like" holds and resolves to 9.0 deg; the fajr resolves to ISNA 15/15 (120/120 core days within 1).',
  ],
  'bradford-victor': [
    'fit14\'s "isha offset -36" is a distance label; the isha is a 9.03 deg angle, and the fajr is 15 deg on 30/30 days at zero offset.',
  ],
  'reading-amic': [
    'The fajr is a table too (implied depression swings 1.1 deg in Nov-Feb and 3.9 deg over the year); the capture carries no sunrise column, so F cannot be formed and the verdict uses the implied depression alone.',
  ],
  'cardiff-swicc': [
    'fit12\'s "83 min isha" is 80.0 min exactly on all 30 days against the printed maghrib.',
  ],
  'preston-jamea': [
    'fit12\'s exclusion of the isha column is confirmed: the printed value precedes sunset on all 30 days.',
  ],
};

function zeroBest(side) {
  let b = null;
  for (const [name, z] of Object.entries(side.namedZero || {})) {
    if (!b || z.w1 > b.w1 || (z.w1 === b.w1 && z.exact > b.exact)) b = { name, ...z };
  }
  return b;
}

function summerVerdict(side, coreMean) {
  if (!side.angle || !side.angle.monthMeans) return null;
  const mm = side.angle.monthMeans;
  const summer = ['05', '06', '07'].map((m) => mm[m]).filter((x) => x != null);
  if (!summer.length) return null;
  const dev = summer.map((x) => +(x - coreMean).toFixed(2));
  const min = Math.min(...dev), max = Math.max(...dev);
  if (min > -1 && max < 1) return { kind: 'holds', dev };
  if (min <= -1) return { kind: 'capped', dev };
  return { kind: 'invented', dev };
}

const towns = [];
for (const [tag, t] of Object.entries(recon.towns)) {
  const f = t.fajr, i = t.isha;
  const coreF = f.angle && f.angle.core, coreI = i.angle && i.angle.core;
  const zF = zeroBest(f), zI = zeroBest(i);
  const summerF = coreF ? summerVerdict(f, coreF.mean) : null;
  const summerI = coreI ? summerVerdict(i, coreI.mean) : null;

  const sideVerdict = (side, core, z, summer, prayer) => {
    if (!side.columnCount) return { model: 'absent', detail: 'no column' };
    const fmt = side.shape;
    if (fmt && fmt.distinct === 1) {
      return { model: 'interval-const', value: fmt.min, detail: `constant ${fmt.min} min` };
    }
    // zero-offset named match: the recipe's own parameters, no free fudge.
    // 95% within 1 min is decisive; 85% is accepted when the fitted depression
    // itself sits within 0.3 deg of the named angle (a printer rounding edge).
    if (z) {
      const named = CENSUS[z.name];
      const near = core && Math.abs(core.mean - named[prayer]) <= 0.3;
      if (z.w1Share >= 0.95 || (z.w1Share >= 0.85 && near)) {
        return {
          model: 'angle-named', recipe: named.name, angle: core ? core.mean : null,
          zeroOffsetWithin1: +z.w1Share.toFixed(3), summer: summer || null,
          detail: `${named.name} at zero offset: ${z.w1}/${z.n} within 1 min in Nov-Feb, fitted depression ${core ? core.mean.toFixed(2) : '?'} deg`,
        };
      }
    }
    if (core && core.ratio <= 1.5) {
      return {
        model: 'angle-noncensus', recipe: `angle ${core.mean.toFixed(2)} deg (+/-0.2)`,
        angle: core.mean, zeroOffsetWithin1: z ? +z.w1Share.toFixed(3) : null, summer: summer || null,
        detail: `constant depression ${core.mean.toFixed(2)} deg at the rounding floor; no census angle fits`,
      };
    }
    if (core && core.ratio >= 2.5) {
      return {
        model: 'interval-table',
        detail: `${fmt ? fmt.distinct + ' distinct values over ' + fmt.n + ' days, range ' + fmt.range + ' min' : 'array'}; implied depression swings ${core.range} deg in Nov-Feb (${core.ratio}x the rounding floor)`,
        summer: summer || null, zeroOffsetWithin1: z ? +z.w1Share.toFixed(3) : null,
      };
    }
    if (core) {
      if (side.angle && side.angle.n >= 180) {
        return {
          model: 'interval-table',
          detail: `implied depression wanders ${core.range} deg in Nov-Feb and ${side.angle.spread} deg across the year; no frozen angle`,
          summer: summer || null, zeroOffsetWithin1: z ? +z.w1Share.toFixed(3) : null,
        };
      }
      return {
        model: 'undecidable-one-month',
        angle: core.mean, range: core.range, ratio: core.ratio,
        zeroOffsetWithin1: z ? +z.w1Share.toFixed(3) : null,
        lupt: side.lupt ? { offset: side.lupt.median, within1: side.lupt.within1 } : null,
        detail: `implied depression ${core.mean.toFixed(2)} deg, spread ${core.range} deg over ${core.n} days; the census 15 deg angle is refuted at zero offset (${z ? z.w1 : 0}/${z ? z.n : 0} within 1) but a non-census angle at that depression and a LUPT-construction table both fit`,
      };
    }
    return { model: 'unmeasured', detail: 'no anchor column' };
  };

  const fv = sideVerdict(f, coreF, zF, summerF, 'fajr');
  const ivRaw = sideVerdict(i, coreI, zI, summerI, 'isha');
  const ov = OVERRIDE[tag] || {};
  let iv = ov.isha ? { ...ivRaw, ...ov.isha, overridden: true } : ivRaw;

  // the caps are a property of the pair, not of one column: promote to the
  // Wifaqul object only when the capped model holds for the whole span
  const wifaqF = f.named && f.named.wifaqul, wifaqI = i.named && i.named.wifaqul;
  const capsProven = wifaqF && wifaqI && wifaqF.w1Share >= 0.95 && wifaqI.w1Share >= 0.95
    && coreF && coreI && Math.abs(coreF.mean - 18) <= 0.35 && Math.abs(coreI.mean - 15) <= 0.35;
  if (capsProven) {
    fv.recipe = CENSUS.wifaqul.name; fv.capped = true;
    iv.recipe = CENSUS.wifaqul.name; iv.capped = true;
    fv.capEvidence = `${wifaqF.w1}/${wifaqF.n} within 1 min over the whole span`;
    iv.capEvidence = `${wifaqI.w1}/${wifaqI.n} within 1 min over the whole span`;
  }

  const luptSide = (side) => (side.lupt ? {
    offset: side.lupt.median, within1: side.lupt.within1,
    relation: side.lupt.within1 >= 0.95 ? 'offset' : side.lupt.within1 >= 0.8 ? 'offset-with-blocks' : 'not-family',
  } : null);
  const lf = luptSide(f), li = luptSide(i);

  const classOf = (v) => (v.model === 'angle-named' || v.model === 'angle-noncensus' ? 'angle'
    : v.model === 'interval-table' || v.model === 'interval-const' ? 'interval' : v.model);
  const family = classOf(fv);
  const ishaClass = classOf(iv);

  // the town recipe is the pair, not each column's nearest candidate
  const pairRecipe = (() => {
    if (ov.isha && ov.isha.pairRecipe) return ov.isha.pairRecipe;
    if (capsProven) return 'Wifaqul 18/15 + 1/2,1/7 caps';
    const fTxt = fv.model === 'interval-const' ? `constant fajr ${fv.value} min`
      : family === 'interval' ? 'fajr array'
        : fv.recipe;
    const iTxt = iv.model === 'absent' ? 'no isha column'
      : iv.model === 'undecidable-one-month' ? 'isha undecidable on one month'
        : iv.model === 'interval-const' ? `constant isha ${iv.value} min`
          : ishaClass === 'interval' ? 'isha array'
            : iv.recipe;
    if (family === 'angle' && ishaClass === 'angle') {
      const fa = fv.angle != null ? fv.angle : coreF && coreF.mean;
      const ia = iv.angle != null ? iv.angle : coreI && coreI.mean;
      const pair = fa != null && ia != null && [[18, 18, 'Karachi 18/18'], [15, 15, 'ISNA 15/15'], [18, 17, 'MWL 18/17'], [18, 16, 'Diyanet 18/16'], [18, 15, 'Wifaqul 18/15']]
        .find(([a, b]) => Math.abs(fa - a) <= 0.3 && Math.abs(ia - b) <= 0.3);
      if (pair) {
        if (iv.recipe && iv.recipe.startsWith(pair[2])) return iv.recipe;
        if (fv.recipe === iv.recipe) return fv.recipe;
        return pair[2];
      }
      if (fv.model === 'angle-named' && iv.model === 'angle-named') {
        if (fv.recipe === iv.recipe) return fv.recipe;
        return `${fv.recipe} + ${iv.recipe}`;
      }
    }
    return `${fTxt} + ${iTxt}`;
  })();

  towns.push({
    town: t.town, townKey: (TOWN_META[tag] || {}).townKey || t.town, tag, region: t.region, capture: t.file, span: t.span,
    rows: t.rowsParsed, coords: { lat: t.lat, lng: t.lng }, clockShiftDays: t.clockShifted,
    fajr: fv, isha: iv, family, ishaClass, sidesDiffer: family !== ishaClass, pairRecipe,
    lupt: { fajr: lf, isha: li },
    corrections: CORRECTIONS[tag] || [],
    agents: CLAIMS[tag] || {},
    evidence: {
      fajr: { impliedAngleCore: coreF, arrayShape: f.shape, zeroOffset: zF, lupt: f.lupt, interval: f.interval },
      isha: { impliedAngleCore: coreI, arrayShape: i.shape, zeroOffset: zI, lupt: i.lupt, interval: i.interval },
    },
  });
}

// town-level rollup: Aberdeen's two sheets are one town
const townKeys = new Set(towns.map((t) => t.townKey));
const byTown = (key) => {
  const groups = new Map();
  for (const t of towns) {
    const k = t.townKey;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(t);
  }
  const out = {};
  for (const [k, list] of groups) {
    // a town takes the strongest class among its captures (a full-year capture
    // outranks a one-month one when they disagree)
    list.sort((a, b) => b.rows - a.rows);
    out[k] = list[0][key];
  }
  return out;
};
const townFajr = byTown('family');
const townIsha = byTown('ishaClass');
const tally = (o) => Object.values(o).reduce((a, v) => { a[v] = (a[v] || 0) + 1; return a; }, {});
const counts = {
  captures: towns.length,
  towns: townKeys.size,
  townFajrClass: tally(townFajr),
  townIshaClass: tally(townIsha),
  captureFajrClass: tally(Object.fromEntries(towns.map((t) => [t.tag, t.family]))),
  captureIshaClass: tally(Object.fromEntries(towns.map((t) => [t.tag, t.ishaClass]))),
  townSidesDiffer: Object.keys(townFajr).filter((k) => townFajr[k] !== townIsha[k]).length,
  luptOffsetBothSides: towns.filter((t) => t.lupt.fajr && t.lupt.isha && t.lupt.fajr.within1 >= 0.95 && t.lupt.isha.within1 >= 0.95).length,
  luptOffsetFajr: towns.filter((t) => t.lupt.fajr && t.lupt.fajr.within1 >= 0.95).length,
  angleTownsFullYear: [...new Set(towns.filter((t) => t.family === 'angle' && t.rows >= 300).map((t) => t.townKey))].length,
  angleTownsOneMonthOnly: [...new Set(towns.filter((t) => t.family === 'angle').map((t) => t.townKey))]
    .filter((k) => !towns.some((t) => t.townKey === k && t.family === 'angle' && t.rows >= 300)).length,
};

// encoding tiers, computed from the resolved classes
const tier = (t) => {
  const fa = t.family === 'angle', ia = t.ishaClass === 'angle';
  if (fa && ia) return 'recipe';
  if (fa && t.isha.model === 'interval-const') return 'recipe-plus-const';
  if (fa && t.ishaClass === 'interval') return 'recipe-plus-array';
  const bothLupt = t.lupt.fajr && t.lupt.isha && t.lupt.fajr.within1 >= 0.95 && t.lupt.isha.within1 >= 0.95;
  if (bothLupt) return 'lupt-point';
  const bothConst = t.fajr.model === 'interval-const' && t.isha.model === 'interval-const';
  if (bothConst) return 'two-constants';
  if (t.fajr.model === 'interval-const' && ia) return 'constant-plus-angle';
  const fajrLupt = t.lupt.fajr && t.lupt.fajr.within1 >= 0.95;
  if (fajrLupt && t.isha.model === 'interval-const') return 'lupt-offset-plus-const';
  if (fajrLupt) return 'lupt-offset';
  return 'own-array';
};
const townTier = new Map();
for (const t of towns) {
  const prior = townTier.get(t.townKey);
  // a town's cheapest workable encoding is the strongest evidence it holds
  const rank = { 'recipe': 0, 'two-constants': 1, 'constant-fajr': 1, 'lupt-point': 1, 'lupt-fajr-offset': 2, 'own-array': 3 };
  if (!prior || rank[tier(t)] < rank[prior.tier] || (rank[tier(t)] === rank[prior.tier] && t.rows > prior.rows)) {
    townTier.set(t.townKey, { tier: tier(t), tag: t.tag, rows: t.rows });
  }
}
const byTier = {};
for (const [k, v] of townTier) (byTier[v.tier] ||= []).push(k);
const encoding = {
  townsByTier: Object.fromEntries(Object.entries(byTier).map(([k, v]) => [k, { n: v.length, towns: v.sort() }])),
  sides: (() => {
    const s = (list, f) => list.reduce((a, t) => { a[f(t)] = (a[f(t)] || 0) + 1; return a; }, {});
    const fajr = s(towns, (t) => t.fajr.model), isha = s(towns, (t) => t.isha.model);
    const isTable = (m) => m === 'interval-table';
    return {
      fajrModels: fajr, ishaModels: isha,
      tableSides: towns.filter((t) => isTable(t.fajr.model) || isTable(t.isha.model)).length,
      tableSideArrays: towns.reduce((a, t) => a + (isTable(t.fajr.model) ? 1 : 0) + (isTable(t.isha.model) ? 1 : 0), 0),
    };
  })(),
  bytes: {
    luptBaseOnce: 732,
    perTownArray: 732,
    perSideArray: 366,
    perTownOffset: 2,
    note: `F and I are 366 one-byte minutes each. Every capture as a full pair is 35 x 732 = 25.6 KB, and every town as a pair is 30 x 732 = 21.5 KB. Encoding only the table sides is ${towns.reduce((a, t) => a + (t.fajr.model === 'interval-table' ? 1 : 0) + (t.isha.model === 'interval-table' ? 1 : 0), 0)} x 366 bytes plus the 732-byte LUPT base and about 60 parameter bytes.`,
  },
};

// house style: no semicolons in prose. A following lower-case clause takes a
// comma, a capitalised one takes a full stop.
const tidy = (s) => s.replace(/;\s+([a-zA-Z])/g, (_, c) => (c === c.toLowerCase() ? `, ${c}` : `. ${c}`));
const tidyDeep = (o) => {
  if (typeof o === 'string') return tidy(o);
  if (Array.isArray(o)) return o.map(tidyDeep);
  if (o && typeof o === 'object') return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, tidyDeep(v)]));
  return o;
};

fs.writeFileSync(path.join(ROOT, 'ukreconcile/uk-form-map.json'), JSON.stringify(tidyDeep({
  meta: {
    generated: '2026-11-10', tz: 'Europe/London',
    captureRoot: 'uktowns2/data + ukscotland/data (every UK capture either agent read, plus the fit14 extras)',
    luptReference: 'fit14/lupt_fi.json, independently validated: 0 mismatches on all 181 days of the six captured LUPT months, and 365/365 fajr + 361/365 isha on the ELM capture',
    method: [
      'printed F = sunrise - fajr and I = isha - maghrib, day by day',
      'implied twilight depression at the printed minute (NOAA solar position, cross-checked against adhan to 0.0 min)',
      'core window Nov-Feb: the window where a 15-18 deg twilight exists at every UK latitude held, so a summer cap or an invented summer value cannot enter the verdict',
      'constancy measured as observed jitter divided by the local rate of change, so a true angle rounded to the minute scores about 1 and a stepping table scores far higher',
      'recipe naming at zero offset only: a free offset proves the angle form, never the recipe',
    ],
    thresholds: {
      angle: 'a named angle reproduces the print at zero offset on >=95% of core days; or the implied depression is flat within the rounding floor',
      interval: 'no angle holds the core print, and the implied depression swings >=2.5x the rounding floor, or the F/I array is constant',
      undecidable: 'on a one-month span, no census angle holds and the jitter sits between 1.5x and 2.5x the floor',
    },
    claims: {
      fit4_restated: 'The English-Hanafi towns are one recipe FORM instantiated locally, but the form is not universal. Of 30 UK towns, 18 run a date-indexed interval table and 12 run an angle. Even inside the interval family the four fit4 towns split: Coventry and Bolton are LUPT plus a constant offset, Reading and Rochdale are their own arrays. The universal clause is what fails, not the form.',
      fit12_restated: 'The modal form is the sunrise-anchored interval at 18 of 30 towns; the six-family map survives as an encoding-level description but not as a model-class one, because three of its members (Watford, Leicester, Blackpool, Stockport) are angles, and its isha "angle near 15" column is a free-offset artefact on the one-month prints: at zero offset a 15 deg isha hits 0 to 3 of 30 days at those towns.',
      verify3_restated: 'The refutation holds and widens: Nottingham is one of 12 angle towns, not a lone counterexample, and the interval towns are 18 of 30 rather than all of them. The modal form holds; the universal does not.',
      vocabulary: 'fit14 labels distance from LUPT, not model class. "drift" and "offset" can be true of an angle town (Watford +23, Leicester +24, Blackpool +11, Stockport +7 are all angles) because one month of an isha cannot separate the two. Any offset encoding read off a one-month print is model-agnostic.',
    },
    settled: {
      scotland: {
        note: 'settled by fit4 and re-measured here; not part of the English mosaic',
        towns: ['Glasgow: per-town fajr table (implied depression 17.3, not frozen) with a 01:33 wall-clock clamp; isha is an 18 deg angle', 'Dundee: 18 deg fajr every day it is defined, then a night-fraction of 0.307; isha is a weekly-stepped table (max step 11 min), not a frozen 15 deg angle', 'Edinburgh: MWL 18/17, November only', 'Aberdeen AMIC Central and Spital: Wifaqul 18/15 with 1/2 and 1/7 night caps, 318/333 and 319/333 within 1 min over the whole span, the two sheets differ on dhuhr for 29 rows and agree on every other column'],
      },
      luptAdopters: {
        note: 'the LUPT snapshot rows, held as the reference and not treated as findings',
        towns: ['London East London Mosque: F and I exactly LUPT on 365/365 days', 'London ICC (61 days) and MWH North (30 days): offset 0 on both columns', 'Middlesbrough (November): LUPT itself on both columns, 30/30'],
      },
    },
  },
  encoding,
  counts, towns,
}), null, 1));

const pad = (x, n) => String(x === undefined || x === null ? '-' : x).padEnd(n);
for (const t of towns) {
  const d = (v) => v.recipe || (v.value != null ? `${v.value} min` : '');
  console.log([pad(t.town, 22), pad(t.family, 9), pad(t.fajr.model, 20), pad(d(t.fajr), 22),
    pad(t.ishaClass, 9), pad(t.isha.model, 20), pad(d(t.isha), 28)].join('| '));
}
console.log(JSON.stringify(counts, null, 1));
