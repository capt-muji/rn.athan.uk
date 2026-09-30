// R11 Part 2: every rule against every other, on real geography, for a full year.
//
// Fourteen cities from 48 N to 78 N plus Ushuaia at 54.8 S so hemisphere symmetry is checked.
// Base convention MWL 18/17 throughout, so the RULE is the only thing varying, which is R7's
// design and is what makes the between-rule spread comparable to R7's numbers.
//
// Per city, per rule: how many days it changes against the bare angle, the mean and maximum
// change, and how many days it leaves with no answer. Then the full rule-against-rule
// divergence matrix, and the per-day spread across all rules that answer.
import { writeFileSync } from 'node:fs';
import { frame, RULES, nearestDay, norwayFrozenClock, wifaqHarajCap, moonsightingText } from './rules.mjs';
import { hm } from '../countries/solar-harness.mjs';

const CITIES = [
  { name: 'Paris', lat: 48.8566, lng: 2.3522, tz: 1, dst: 'eu' },
  { name: 'London', lat: 51.5074, lng: -0.1278, tz: 0, dst: 'eu' },
  { name: 'Manchester', lat: 53.4808, lng: -2.2426, tz: 0, dst: 'eu' },
  { name: 'Copenhagen', lat: 55.6761, lng: 12.5683, tz: 1, dst: 'eu' },
  { name: 'Aberdeen', lat: 57.1497, lng: -2.0943, tz: 0, dst: 'eu' },
  { name: 'Stockholm', lat: 59.3293, lng: 18.0686, tz: 1, dst: 'eu' },
  { name: 'Oslo', lat: 59.9139, lng: 10.7522, tz: 1, dst: 'eu' },
  { name: 'Helsinki', lat: 60.1699, lng: 24.9384, tz: 2, dst: 'eu' },
  { name: 'Anchorage', lat: 61.2181, lng: -149.9003, tz: -9, dst: 'us' },
  { name: 'Reykjavik', lat: 64.1466, lng: -21.9426, tz: 0, dst: 'none' },
  { name: 'ArcticCircle', lat: 66.5000, lng: 20.0000, tz: 1, dst: 'eu' },
  { name: 'Tromso', lat: 69.6492, lng: 18.9553, tz: 1, dst: 'eu' },
  { name: 'Longyearbyen', lat: 78.2232, lng: 15.6267, tz: 1, dst: 'eu' },
  { name: 'Ushuaia', lat: -54.8019, lng: -68.3030, tz: -3, dst: 'none' },
];
const FAJR = 18, ISHA = 17, Y = 2026;

const DAYS = (() => {
  const a = [];
  const dim = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  for (let m = 1; m <= 12; m++) for (let d = 1; d <= dim[m - 1]; d++) a.push([m, d]);
  return a;
})();
// EU DST 2026: 29 March to 25 October. US 2026: 8 March to 1 November.
const tzFor = (c, m, d) => {
  if (c.dst === 'eu') return c.tz + (((m > 3 && m < 10) || (m === 3 && d >= 29) || (m === 10 && d < 25)) ? 1 : 0);
  if (c.dst === 'us') return c.tz + (((m > 3 && m < 11) || (m === 3 && d >= 8) || (m === 11 && d < 1)) ? 1 : 0);
  return c.tz;
};
// Every rule value is reduced to MINUTES FROM SOLAR NOON so DST and timezone drop out of
// every comparison. Comparing clock hours across a DST boundary is the trap R7 flagged.
const rel = (v, noon) => v === null ? null : (v - noon) * 60;

const RULE_NAMES = [
  'AngleOnly', 'MiddleOfTheNight', 'SeventhOfTheNight', 'TwilightAngle',
  'SwedenIFiS', 'Diyanet', 'BelgiumLat45', 'AqrabBalad485', 'AqrabBaladWalk',
  'AqrabAyyamLast', 'AqrabAyyam3Day', 'NorwayFrozenClock', 'MoonsightingText',
  'WifaqIshaCap',
];

function computeCity(c) {
  const frames = DAYS.map(([m, d]) => ({ m, d, tz: tzFor(c, m, d), f: frame(c.lat, c.lng, tzFor(c, m, d), Y, m, d, FAJR, ISHA) }));
  const harajCap = wifaqHarajCap(c.lat, c.lng, c.tz, Y);
  const res = Object.fromEntries(RULE_NAMES.map(r => [r, []]));
  const ayLast = nearestDay(frames.map(x => x.f), 'last');
  const ay3 = nearestDay(frames.map(x => x.f), '3day');
  const noClock = norwayFrozenClock(frames.map(x => x.f));

  frames.forEach((x, i) => {
    const ctx = { lat: c.lat, lng: c.lng, tz: x.tz, y: Y, m: x.m, d: x.d };
    const f = x.f, noon = f.noon;
    for (const name of ['AngleOnly', 'MiddleOfTheNight', 'SeventhOfTheNight', 'TwilightAngle', 'SwedenIFiS', 'Diyanet', 'BelgiumLat45', 'AqrabBalad485', 'AqrabBaladWalk']) {
      const v = RULES[name].fn(f, ctx);
      res[name].push({ fajr: rel(v.fajr, noon), isha: rel(v.isha, noon) });
    }
    res.AqrabAyyamLast.push({ fajr: rel(ayLast[i].fajr, noon), isha: rel(ayLast[i].isha, noon) });
    res.AqrabAyyam3Day.push({ fajr: rel(ay3[i].fajr, noon), isha: rel(ay3[i].isha, noon), donor: ay3[i].donorDistance });
    res.NorwayFrozenClock.push({ fajr: rel(noClock[i].fajr, noon), isha: rel(noClock[i].isha, noon) });
    const ms = moonsightingText(f, ctx);
    res.MoonsightingText.push({ fajr: rel(ms.fajr, noon), isha: rel(ms.isha, noon) });
    // Wifaqul Ulama: Isha at 15 deg (its own Britain value) capped at 65 min after the
    // longest day's sunset. Fajr is 18 deg with Aqrabul-Ayyam 3-day, which is its own pairing.
    const h15 = frame(c.lat, c.lng, x.tz, Y, x.m, x.d, FAJR, 15);
    const raw = h15.angIsha, cap = harajCap === null ? null : harajCap;
    res.WifaqIshaCap.push({ fajr: rel(ay3[i].fajr, noon), isha: raw === null ? (cap === null ? null : rel(cap, noon)) : rel(Math.min(raw, cap ?? raw), noon) });
  });
  return { frames, res };
}

const stat = a => { const s = a.filter(x => x !== null).map(Math.abs).sort((x, y) => x - y); return s.length ? { n: s.length, mean: +(s.reduce((p, q) => p + q, 0) / s.length).toFixed(1), median: +s[Math.floor(s.length / 2)].toFixed(1), max: +s[s.length - 1].toFixed(1) } : null; };

const out = { fajrAngle: FAJR, ishaAngle: ISHA, year: Y, cities: {} };

console.log('=== A. days with no angle solution, and no sunrise or sunset at all, MWL 18/17 ===');
console.log('city            lat     fajr18 nulls  isha17 nulls   polarDay  polarNight');
for (const c of CITIES) {
  const { frames } = computeCity(c);
  const fn = frames.filter(x => x.f.angFajr === null).length;
  const inl = frames.filter(x => x.f.angIsha === null).length;
  const pd = frames.filter(x => x.f.polar === 'day').length;
  const pn = frames.filter(x => x.f.polar === 'night').length;
  console.log(`${c.name.padEnd(15)}${c.lat.toFixed(2).padStart(6)}  ${String(fn).padStart(11)}  ${String(inl).padStart(12)}  ${String(pd).padStart(9)}  ${String(pn).padStart(10)}`);
}

console.log('\n=== B. per city, per rule: days changed against the bare angle, size of change, and nulls ===');
for (const c of CITIES) {
  const { frames, res } = computeCity(c);
  const base = res.AngleOnly;
  console.log(`\n--- ${c.name} ${c.lat.toFixed(2)} ---`);
  console.log('rule                  fjChanged  fjMean  fjMax  fjNull   ishChanged  ishMean  ishMax  ishNull');
  const cityRows = {};
  for (const name of RULE_NAMES) {
    const r = res[name];
    const dF = [], dI = [];
    let cF = 0, cI = 0, nF = 0, nI = 0;
    for (let i = 0; i < r.length; i++) {
      if (r[i].fajr === null) nF++; else if (base[i].fajr !== null) { const d = r[i].fajr - base[i].fajr; if (Math.abs(d) >= 0.5) { cF++; dF.push(d); } } else cF++;
      if (r[i].isha === null) nI++; else if (base[i].isha !== null) { const d = r[i].isha - base[i].isha; if (Math.abs(d) >= 0.5) { cI++; dI.push(d); } } else cI++;
    }
    const sF = stat(dF), sI = stat(dI);
    console.log(`${name.padEnd(21)} ${String(cF).padStart(8)}  ${String(sF?.mean ?? '-').padStart(6)}  ${String(sF?.max ?? '-').padStart(5)}  ${String(nF).padStart(5)}   ${String(cI).padStart(9)}  ${String(sI?.mean ?? '-').padStart(7)}  ${String(sI?.max ?? '-').padStart(6)}  ${String(nI).padStart(6)}`);
    cityRows[name] = { fajrChanged: cF, fajrMean: sF?.mean ?? null, fajrMax: sF?.max ?? null, fajrNull: nF, ishaChanged: cI, ishaMean: sI?.mean ?? null, ishaMax: sI?.max ?? null, ishaNull: nI };
  }
  out.cities[c.name] = { lat: c.lat, lng: c.lng, rules: cityRows };
}

console.log('\n=== C. rule against rule, mean and max Fajr divergence in minutes, on days BOTH answer ===');
for (const c of CITIES) {
  const { res } = computeCity(c);
  const names = RULE_NAMES.filter(n => n !== 'AngleOnly');
  console.log(`\n--- ${c.name} ${c.lat.toFixed(2)}, Fajr, mean / max, and (days both answer) ---`);
  const hdr = '                     ' + names.map(n => n.slice(0, 8).padStart(9)).join('');
  console.log(hdr);
  const mat = {};
  for (const a of names) {
    const cells = [];
    mat[a] = {};
    for (const b of names) {
      if (a === b) { cells.push('        -'); continue; }
      const d = [];
      for (let i = 0; i < 365; i++) { const x = res[a][i].fajr, y = res[b][i].fajr; if (x !== null && y !== null) d.push(x - y); }
      const s = stat(d);
      mat[a][b] = s ? { mean: s.mean, max: s.max, n: s.n } : null;
      cells.push(s ? `${s.mean.toFixed(0)}/${s.max.toFixed(0)}`.padStart(9) : '     none');
    }
    console.log(a.slice(0, 20).padEnd(21) + cells.join(''));
  }
  out.cities[c.name].fajrMatrix = mat;
}

console.log('\n=== D. the per-day spread across all rules that answer, which is the size of the decision ===');
console.log('city            lat     fjSpreadMean  fjSpreadMax   ishSpreadMean  ishSpreadMax  daysAllAgreeWithin1  daysSomeRuleNull');
for (const c of CITIES) {
  const { res } = computeCity(c);
  const names = RULE_NAMES.filter(n => n !== 'AngleOnly');
  const spF = [], spI = [];
  let agree = 0, someNull = 0;
  for (let i = 0; i < 365; i++) {
    const vF = names.map(n => res[n][i].fajr).filter(x => x !== null);
    const vI = names.map(n => res[n][i].isha).filter(x => x !== null);
    if (vF.length < names.length || vI.length < names.length) someNull++;
    if (vF.length > 1) { const s = Math.max(...vF) - Math.min(...vF); spF.push(s); if (s <= 1) agree++; }
    if (vI.length > 1) spI.push(Math.max(...vI) - Math.min(...vI));
  }
  const m = a => a.length ? +(a.reduce((p, q) => p + q, 0) / a.length).toFixed(1) : null;
  const mx = a => a.length ? +Math.max(...a).toFixed(0) : null;
  console.log(`${c.name.padEnd(15)}${c.lat.toFixed(2).padStart(6)}  ${String(m(spF)).padStart(11)}  ${String(mx(spF)).padStart(10)}   ${String(m(spI)).padStart(12)}  ${String(mx(spI)).padStart(11)}  ${String(agree).padStart(18)}  ${String(someNull).padStart(15)}`);
  out.cities[c.name].spread = { fajrMean: m(spF), fajrMax: mx(spF), ishaMean: m(spI), ishaMax: mx(spI), daysAllAgreeWithin1: agree, daysSomeRuleNull: someNull };
}

console.log('\n=== E. how far the nearest-day and nearest-place rules have to reach ===');
console.log('city            lat    AqrabAyyam3Day maxDonorDays   AqrabBaladWalk maxDegreesWalked');
for (const c of CITIES) {
  const frames = DAYS.map(([m, d]) => ({ m, d, tz: tzFor(c, m, d), f: frame(c.lat, c.lng, tzFor(c, m, d), Y, m, d, FAJR, ISHA) }));
  const ay3 = nearestDay(frames.map(x => x.f), '3day');
  const maxDonor = Math.max(...ay3.map(x => x.donorDistance));
  let maxWalk = 0;
  frames.forEach(x => { const v = RULES.AqrabBaladWalk.fn(x.f, { lat: c.lat, lng: c.lng, tz: x.tz, y: Y, m: x.m, d: x.d }); if (v.walked) maxWalk = Math.max(maxWalk, v.walked); });
  console.log(`${c.name.padEnd(15)}${c.lat.toFixed(2).padStart(6)}  ${String(maxDonor).padStart(20)}   ${String(maxWalk.toFixed(1)).padStart(22)}`);
  out.cities[c.name].reach = { aqrabAyyamMaxDonorDays: maxDonor, aqrabBaladMaxDegreesWalked: +maxWalk.toFixed(1) };
}

writeFileSync(new URL('./rules-matrix.json', import.meta.url), JSON.stringify(out, null, 2));
console.log('\nwritten: rules-matrix.json');
