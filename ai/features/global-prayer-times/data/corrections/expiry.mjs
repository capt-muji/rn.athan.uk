// R6 part 4: does a correction table expire, and how far can one city's table travel?
// Three questions, each answered by a direct comparison, never by an estimate.
//   a) Does the SAME calendar day in two different years carry the same residual?
//   b) What does the 365/366 boundary do to a table keyed by day of year?
//   c) Do a neighbour's six constants reproduce a city, and does its exact residual?
// node expiry.mjs

import * as P from './parse.mjs';
import { residuals, models, byteCost, FIELDS, mean } from './measure.mjs';
import { SITES } from './sites.mjs';
import { brotliCompressSync } from 'node:zlib';

const site = (id) => SITES.find((s) => s.id === id);
const f2 = (x) => (x >= 0 ? '+' : '') + x.toFixed(2);

function residByMonthDay(id) {
  const s = site(id);
  const days = s.load(P);
  const { resid } = residuals(days, s, s.spec, s.dummyYear);
  const map = new Map();
  days.forEach((d, i) => {
    map.set(d.date.slice(5), Object.fromEntries(FIELDS.map((k) => [k, resid[k][i]])));
  });
  return map;
}

// ---------------------------------------------------------- a) year over year
console.log('## A. Is the residual the same on the same calendar day in a different year?\n');
console.log('| authority | year pair | common days | field | identical | differ by 1 | differ by 2+ | worst |');
console.log('|---|---|---|---|---|---|---|---|');

const PAIRS = [
  ['MUIS Singapore', 'SG-2025', 'SG-2026'],
  ['MARA Oman, Muscat', 'OM-muscat-2025', 'OM-muscat'],
  ['Awqaf UAE, Dubai', 'AE-dubai-2025', 'AE-dubai'],
  ['MORA Brunei', 'BN-2025', 'BN-2026'],
  ['Umm al-Qura Makkah', 'SA-makkah-1447', 'SA-makkah'],
];

for (const [label, a, b] of PAIRS) {
  const A = residByMonthDay(a), B = residByMonthDay(b);
  const common = [...A.keys()].filter((k) => B.has(k) && k !== '02-29');
  for (const f of FIELDS) {
    let same = 0, d1 = 0, d2 = 0, worst = 0, n = 0;
    for (const k of common) {
      const x = A.get(k)[f], y = B.get(k)[f];
      if (x === null || y === null) continue;
      n++;
      const d = Math.abs(x - y);
      if (d === 0) same++; else if (d === 1) d1++; else d2++;
      if (d > worst) worst = d;
    }
    console.log(`| ${label} | ${a} vs ${b} | ${n} | ${f} | ${same} (${(100 * same / n).toFixed(1)}%) | ${d1} | ${d2} | ${worst} |`);
  }
}

// A stricter version: does the SIX-CONSTANT table itself move between years?
console.log('\n## A2. Do the six Model A constants change from one year to the next?\n');
console.log('| authority | year | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha |');
console.log('|---|---|---|---|---|---|---|---|');
for (const [label, a, b] of PAIRS) {
  for (const id of [a, b]) {
    const s = site(id);
    const days = s.load(P);
    const { resid, doy } = residuals(days, s, s.spec, s.dummyYear);
    const m = models(resid, doy);
    console.log(`| ${label} | \`${id}\` | ${FIELDS.map((k) => (m[k].constant >= 0 ? '+' : '') + m[k].constant).join(' | ')} |`);
  }
}

// The three-year Singapore CSV gives the cleanest test: same day of year, three years.
console.log('\n## A3. MUIS Singapore, the consolidated 2024 to 2026 CSV, day by day\n');
{
  const s = site('SG-ALL');
  const days = s.load(P);
  const { resid } = residuals(days, s, s.spec);
  const byYear = { 2024: new Map(), 2025: new Map(), 2026: new Map() };
  days.forEach((d, i) => {
    const y = d.date.slice(0, 4);
    if (byYear[y]) byYear[y].set(d.date.slice(5), Object.fromEntries(FIELDS.map((k) => [k, resid[k][i]])));
  });
  console.log('| comparison | days | all six fields identical | any field differs by 1 | any field differs by 2+ |');
  console.log('|---|---|---|---|---|');
  for (const [x, y] of [['2024', '2025'], ['2025', '2026'], ['2024', '2026']]) {
    const common = [...byYear[x].keys()].filter((k) => byYear[y].has(k) && k !== '02-29');
    let all = 0, one = 0, two = 0;
    for (const k of common) {
      const d = FIELDS.map((f) => Math.abs(byYear[x].get(k)[f] - byYear[y].get(k)[f]));
      const mx = Math.max(...d);
      if (mx === 0) all++; else if (mx === 1) one++; else two++;
    }
    console.log(`| ${x} vs ${y} | ${common.length} | ${all} (${(100 * all / common.length).toFixed(1)}%) | ${one} | ${two} |`);
  }

  // And the published TIMES themselves, which is the question the user actually feels.
  console.log('\n| comparison | days | all six published times identical | max difference, minutes |');
  console.log('|---|---|---|---|');
  const t = { 2024: new Map(), 2025: new Map(), 2026: new Map() };
  for (const d of days) { const y = d.date.slice(0, 4); if (t[y]) t[y].set(d.date.slice(5), d); }
  for (const [x, y] of [['2024', '2025'], ['2025', '2026'], ['2024', '2026']]) {
    const common = [...t[x].keys()].filter((k) => t[y].has(k) && k !== '02-29');
    let all = 0, worst = 0;
    for (const k of common) {
      const d = FIELDS.map((f) => Math.abs(t[x].get(k)[f] - t[y].get(k)[f]));
      const mx = Math.max(...d);
      if (mx === 0) all++;
      if (mx > worst) worst = mx;
    }
    console.log(`| ${x} vs ${y} | ${common.length} | ${all} (${(100 * all / common.length).toFixed(1)}%) | ${worst} |`);
  }
}

// ---------------------------------------------------------- b) the leap boundary
console.log('\n## B. The 365 / 366 boundary: what a perpetual day-of-year table costs\n');
{
  // Compute the SAME published Singapore 2024 (leap) and 2025 (common) residual against
  // a baseline computed in a dummy LEAP year, the Maldives trick, and see what breaks.
  const s = site('SG-ALL');
  const days = s.load(P);
  console.log('| baseline year used | published year | days | exact | within 1 min | worst |');
  console.log('|---|---|---|---|---|---|');
  for (const dummy of [null, 2024]) {
    for (const yr of ['2024', '2025', '2026']) {
      const sub = days.filter((d) => d.date.startsWith(yr));
      const { resid } = residuals(sub, s, s.spec, dummy);
      let n = 0, e = 0, w1 = 0, worst = 0;
      const cons = Object.fromEntries(FIELDS.map((k) => [k, Math.round(mean(resid[k].filter((x) => x !== null)))]));
      for (const k of FIELDS) for (const v of resid[k]) {
        if (v === null) continue;
        n++; const d = Math.abs(v - cons[k]);
        if (d === 0) e++; if (d <= 1) w1++; if (d > worst) worst = d;
      }
      console.log(`| ${dummy ?? 'the real year'} | ${yr} | ${sub.length} | ${e} (${(100 * e / n).toFixed(1)}%) | ${w1} (${(100 * w1 / n).toFixed(1)}%) | ${worst} |`);
    }
  }
}

// ---------------------------------------------------------- c) portability
console.log('\n## C. How far does one city\'s correction table travel?\n');
console.log('Apply city X\'s SIX CONSTANTS, and separately city X\'s EXACT per-day residual,');
console.log('to city Y\'s own baseline, and score against city Y\'s published times.\n');
console.log('| authority | donor | recipient | values | six constants: exact | <=1 | <=2 | worst | exact residual: exact | <=1 | <=2 | worst |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|');

const GROUPS = [
  ['JAKIM Malaysia', 'MY-WLY01', ['MY-SGR01', 'MY-JHR02', 'MY-PLS01', 'MY-SBH01', 'MY-KTN01', 'MY-PNG01', 'MY-SWK01', 'MY-TRG01', 'MY-MLK01']],
  ['Diyanet Turkey', 'TR-9541', ['TR-9206', 'TR-9560', 'TR-9225', 'TR-9451', 'TR-9930', 'TR-9905', 'TR-9402', 'TR-9419', 'TR-9831']],
  ['Kemenag Indonesia', 'ID-jakarta', ['ID-surabaya', 'ID-bandaaceh', 'ID-jayapura', 'ID-makassar', 'ID-pontianak']],
  ['Awqaf UAE', 'AE-dubai', ['AE-abudhabi', 'AE-alain', 'AE-sharjah', 'AE-fujairah', 'AE-rak', 'AE-jebeljais', 'AE-hatta']],
  ['MARA Oman', 'OM-muscat', ['OM-salalah', 'OM-sohar', 'OM-thumrait', 'OM-samad']],
  ['Umm al-Qura Saudi', 'SA-makkah', ['SA-riyadh', 'SA-jeddah', 'SA-dammam', 'SA-tabuk', 'SA-abha']],
  ['Egyptian GAS', 'EG-cairo', ['EG-alex', 'EG-aswan', 'EG-luxor']],
  ['Habous Morocco', 'MA-rabat', ['MA-casa', 'MA-marrakech', 'MA-fes', 'MA-laayoune', 'MA-agadir']],
];

const portability = [];
for (const [auth, donorId, recips] of GROUPS) {
  const dS = site(donorId);
  const dDays = dS.load(P);
  const { resid: dResid } = residuals(dDays, dS, dS.spec, dS.dummyYear);
  const dCons = Object.fromEntries(FIELDS.map((k) => [k, Math.round(mean(dResid[k].filter((x) => x !== null)))]));
  const dByDate = new Map();
  dDays.forEach((d, i) => dByDate.set(d.date.slice(5), Object.fromEntries(FIELDS.map((k) => [k, dResid[k][i]]))));

  for (const rid of recips) {
    const rS = site(rid);
    const rDays = rS.load(P);
    const { resid: rResid } = residuals(rDays, rS, rS.spec, rS.dummyYear);
    let n = 0, cE = 0, c1 = 0, c2 = 0, cW = 0, eE = 0, e1 = 0, e2 = 0, eW = 0;
    rDays.forEach((d, i) => {
      const donorDay = dByDate.get(d.date.slice(5));
      for (const k of FIELDS) {
        const v = rResid[k][i];
        if (v === null) continue;
        n++;
        const dc = Math.abs(v - dCons[k]);
        if (dc === 0) cE++; if (dc <= 1) c1++; if (dc <= 2) c2++; if (dc > cW) cW = dc;
        if (donorDay && donorDay[k] !== null && donorDay[k] !== undefined) {
          const de = Math.abs(v - donorDay[k]);
          if (de === 0) eE++; if (de <= 1) e1++; if (de <= 2) e2++; if (de > eW) eW = de;
        }
      }
    });
    const pc = (x) => `${x} (${(100 * x / n).toFixed(1)}%)`;
    console.log(`| ${auth} | \`${donorId}\` | \`${rid}\` | ${n} | ${pc(cE)} | ${pc(c1)} | ${pc(c2)} | ${cW} | ${pc(eE)} | ${pc(e1)} | ${pc(e2)} | ${eW} |`);
    portability.push({ auth, donorId, rid, n, cW, eW, c2, e2 });
  }
}

console.log('\n## C2. Summary: worst error a donor city leaves on its neighbours\n');
console.log('| authority | recipients | worst with donor constants | worst with donor exact residual |');
console.log('|---|---|---|---|');
for (const [auth] of GROUPS) {
  const g = portability.filter((x) => x.auth === auth);
  console.log(`| ${auth} | ${g.length} | ${Math.max(...g.map((x) => x.cW))} | ${Math.max(...g.map((x) => x.eW))} |`);
}

// ---------------------------------------------------------- d) the dedup question
console.log('\n## D. How many DISTINCT exact residual tables does an authority need?\n');
console.log('Two cities share a table only when their per-day residual is identical on every day.\n');
console.log('| authority | cities measured | distinct exact residual tables | distinct six-constant sets | bytes if each ships its own (brotli) | bytes if shared |');
console.log('|---|---|---|---|---|---|');
for (const [auth, donorId, recips] of GROUPS) {
  const ids = [donorId, ...recips];
  const sigs = new Set(), cons = new Set();
  let own = 0;
  const perTable = new Map();
  for (const id of ids) {
    const s = site(id);
    const days = s.load(P);
    const { resid } = residuals(days, s, s.spec, s.dummyYear);
    const c = Object.fromEntries(FIELDS.map((k) => [k, Math.round(mean(resid[k].filter((x) => x !== null)))]));
    const sig = FIELDS.map((k) => resid[k].join(',')).join('|');
    sigs.add(sig);
    cons.add(FIELDS.map((k) => c[k]).join(','));
    const b = byteCost(resid, c).nibble.brotli;
    own += b;
    if (!perTable.has(sig)) perTable.set(sig, b);
  }
  const shared = [...perTable.values()].reduce((a, b) => a + b, 0);
  console.log(`| ${auth} | ${ids.length} | ${sigs.size} | ${cons.size} | ${own} | ${shared} |`);
}
