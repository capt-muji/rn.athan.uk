// R11 Part 2, the decisive test. Every rule in the catalogue scored against an authority's OWN
// published values, for every authority in this programme that publishes a whole year at a
// latitude where a high-latitude rule actually binds.
//
//   Sweden    Islamiska Forbundet i Sverige, Stockholm 59.33 N and Kiruna 67.86 N, 365 days
//             each, captured by R9's grab-sweden.sh. Base convention measured 18 / 16.
//   Norway    Islamsk Rad Norge, Oslo 59.91 N, 365 days, captured by R9's grab-norway.sh.
//             Base convention printed in its own headers: Morgengry 16, Kveldsgry 15.
//   Belgium   Executief van de Moslims van Belgie, Brussels 50.85 N, 348 of 365 days parsed by
//             R9's grab-belgium.mjs. Base convention measured 18 / 18.
//
// Each rule is scored ONLY on the days the authority's own base angle has no solution, because
// those are the days the rule is doing the work. Scoring over the whole year would dilute every
// rule with the days where they all agree, which is the mistake that makes this test look
// inconclusive.
import { readFileSync, writeFileSync } from 'node:fs';
import { toH, hm, midDay } from '../countries/solar-harness.mjs';
import { frame, RULES, nearestDay, norwayFrozenClock, wifaqHarajCap, moonsightingText } from './rules.mjs';

const euTz = (m, d, base) => base + (((m > 3 && m < 10) || (m === 3 && d >= 29) || (m === 10 && d < 25)) ? 1 : 0);

function loadSweden(file) {
  const rows = [];
  for (const line of readFileSync(new URL(file, import.meta.url), 'utf8').split('\n')) {
    const p = line.split('\t').map(s => s.trim());
    if (p.length === 8) rows.push({ m: +p[0], d: +p[1], fajr: p[2], isha: p[7] });
  }
  return rows;
}
// R9's no-oslo-2026.tsv preserves cell POSITIONS so the blank angle columns survive. Date is
// DD.MM. Thirteen columns: Dato, Dag, Morgengry16, Fajr, FajrSlutt, Duhr, Asr, 1x, 2x, Maghrib,
// Isha, Kveldsgry15, Midnatt. The Morgengry and Kveldsgry cells are the ones IRN leaves blank,
// and the blank IS the authority telling us its own angle had no solution that day.
function loadNorway() {
  const rows = [];
  for (const line of readFileSync(new URL('../countries/no-oslo-2026.tsv', import.meta.url), 'utf8').split('\n')) {
    const p = line.split('\t');
    if (p.length < 13) continue;
    const md = /^(\d{2})\.(\d{2})$/.exec(p[0].trim());
    if (!md) continue;
    const t = i => /^\d{1,2}:\d{2}$/.test((p[i] || '').trim()) ? p[i].trim() : null;
    rows.push({ m: +md[2], d: +md[1], fajr: t(3), isha: t(10), morgengry: t(2), kveldsgry: t(11) });
  }
  return rows;
}
// R9's be-emb-2026.tsv: month, day, then Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha.
function loadBelgium() {
  const rows = [];
  for (const line of readFileSync(new URL('../countries/be-emb-2026.tsv', import.meta.url), 'utf8').split('\n')) {
    const p = line.split('\t').map(s => s.trim());
    if (p.length < 8) continue;
    const m = +p[0], d = +p[1];
    if (!m || !d) continue;
    rows.push({ m, d, fajr: p[2], isha: p[7] });
  }
  return rows;
}

// R9 measured 25 days in Belgium's own window carrying an 'Icha printed AFTER MIDNIGHT, up to
// 00:07. A published 00:07 is 23:53 later than a modelled 00:14 on the same night, not 1,426
// minutes earlier, so every error is wrapped onto the nearest 24-hour cycle.
const wrap = x => { let v = x % 1440; if (v > 720) v -= 1440; if (v < -720) v += 1440; return v; };
const stat = a => { const s = a.filter(x => x !== null && Number.isFinite(x)).map(Math.abs).sort((x, y) => x - y); return s.length ? { n: s.length, median: +s[Math.floor(s.length / 2)].toFixed(1), p90: +s[Math.floor(0.9 * s.length)].toFixed(1), max: +s[s.length - 1].toFixed(1), within2: +(100 * s.filter(x => x <= 2).length / s.length).toFixed(1), within5: +(100 * s.filter(x => x <= 5).length / s.length).toFixed(1) } : null; };

const RULE_NAMES = ['MiddleOfTheNight', 'SeventhOfTheNight', 'TwilightAngle', 'SwedenIFiS', 'Diyanet', 'BelgiumLat45', 'AqrabBalad485', 'AqrabBaladWalk', 'AqrabAyyamLast', 'AqrabAyyam3Day', 'NorwayFrozenClock', 'MoonsightingText'];

function score(authority, rows, lat, lng, tzBase, fajrAngle, ishaAngle) {
  const frames = rows.map(r => { const tz = euTz(r.m, r.d, tzBase); return { ...r, tz, f: frame(lat, lng, tz, 2026, r.m, r.d, fajrAngle, ishaAngle) }; });
  const ay3 = nearestDay(frames.map(x => x.f), '3day');
  const ayL = nearestDay(frames.map(x => x.f), 'last');
  const clk = norwayFrozenClock(frames.map(x => x.f));
  const vals = Object.fromEntries(RULE_NAMES.map(n => [n, []]));
  frames.forEach((x, i) => {
    const ctx = { lat, lng, tz: x.tz, y: 2026, m: x.m, d: x.d };
    for (const n of ['MiddleOfTheNight', 'SeventhOfTheNight', 'TwilightAngle', 'SwedenIFiS', 'Diyanet', 'BelgiumLat45', 'AqrabBalad485', 'AqrabBaladWalk']) vals[n].push(RULES[n].fn(x.f, ctx));
    vals.AqrabAyyamLast.push(ayL[i]);
    vals.AqrabAyyam3Day.push(ay3[i]);
    vals.NorwayFrozenClock.push(clk[i]);
    vals.MoonsightingText.push(moonsightingText(x.f, ctx));
  });
  // the days the rule is actually doing the work
  const bindF = frames.map(x => x.f.angFajr === null);
  const bindI = frames.map(x => x.f.angIsha === null);
  const nBindF = bindF.filter(Boolean).length, nBindI = bindI.filter(Boolean).length;

  console.log(`\n=== ${authority} ===`);
  console.log(`base convention Fajr ${fajrAngle} / Isha ${ishaAngle} at ${lat.toFixed(2)} N, ${rows.length} published days`);
  console.log(`days the base Fajr angle has NO solution: ${nBindF}; Isha: ${nBindI}. Those are the scored days.`);
  console.log('rule                  FAJR on unsolvable days            ISHA on unsolvable days');
  console.log('                      med  p90   max  %<=2  %<=5      med  p90   max  %<=2  %<=5');
  const res = {};
  for (const n of RULE_NAMES) {
    const eF = [], eI = [];
    frames.forEach((x, i) => {
      if (bindF[i] && x.fajr && vals[n][i].fajr !== null) eF.push(wrap((toH(x.fajr) - vals[n][i].fajr) * 60));
      if (bindI[i] && x.isha && vals[n][i].isha !== null) eI.push(wrap((toH(x.isha) - vals[n][i].isha) * 60));
    });
    const sF = stat(eF), sI = stat(eI);
    res[n] = { fajr: sF, isha: sI, fajrAnswered: eF.length, ishaAnswered: eI.length };
    const f = sF ? `${String(sF.median).padStart(4)} ${String(sF.p90).padStart(4)} ${String(sF.max).padStart(5)} ${String(sF.within2).padStart(5)} ${String(sF.within5).padStart(5)}` : '   no answer on any day ';
    const ih = sI ? `${String(sI.median).padStart(4)} ${String(sI.p90).padStart(4)} ${String(sI.max).padStart(5)} ${String(sI.within2).padStart(5)} ${String(sI.within5).padStart(5)}` : '   no answer on any day ';
    console.log(`${n.padEnd(21)} ${f}     ${ih}`);
  }
  // and the whole-year score, for the reader who wants both
  console.log('  whole-year median abs error, all published days, for comparison:');
  for (const n of RULE_NAMES) {
    const eF = [], eI = [];
    frames.forEach((x, i) => {
      if (x.fajr && vals[n][i].fajr !== null) eF.push(wrap((toH(x.fajr) - vals[n][i].fajr) * 60));
      if (x.isha && vals[n][i].isha !== null) eI.push(wrap((toH(x.isha) - vals[n][i].isha) * 60));
    });
    const sF = stat(eF), sI = stat(eI);
    res[n].wholeYear = { fajr: sF, isha: sI };
    console.log(`    ${n.padEnd(21)} fajr ${String(sF?.median ?? '-').padStart(5)} (n ${String(sF?.n ?? 0).padStart(3)})   isha ${String(sI?.median ?? '-').padStart(5)} (n ${String(sI?.n ?? 0).padStart(3)})`);
  }
  return { authority, lat, lng, fajrAngle, ishaAngle, publishedDays: rows.length, bindDaysFajr: nBindF, bindDaysIsha: nBindI, rules: res };
}

const out = [];
out.push(score('Sweden, Islamiska Forbundet i Sverige, Stockholm', loadSweden('../countries/se-stockholm-2026.tsv'), 59.3293, 18.0686, 1, 17.98, 15.90));
out.push(score('Sweden, Islamiska Forbundet i Sverige, Kiruna', loadSweden('../countries/se-kiruna-2026.tsv'), 67.8558, 20.2253, 1, 17.98, 15.90));
out.push(score('Sweden, IFiS, Kiruna computed at the 63.68 N its own table implies', loadSweden('../countries/se-kiruna-2026.tsv'), 63.68, 20.2253, 1, 17.98, 15.90));

// Norway. IRN's own column headers name its angles, and R9 measured them at 16.08 and 14.93, so
// the base convention is the authority's own stated 16 / 15.
const no = loadNorway();
console.log(`\nNorway rows parsed: ${no.length}; days IRN leaves Morgengry 16 blank: ${no.filter(r => !r.morgengry).length}; Kveldsgry 15 blank: ${no.filter(r => !r.kveldsgry).length}`);
out.push(score('Norway, Islamsk Rad Norge, Oslo', no, 59.9139, 10.7522, 1, 16.08, 14.93));

// Belgium. Measured by R9 outside its own declared window at 17.99 / 18.00.
const be = loadBelgium();
console.log(`\nBelgium rows parsed: ${be.length}`);
out.push(score('Belgium, Executief van de Moslims van Belgie, Brussels', be, 50.8503, 4.3517, 1, 17.99, 18.00));

writeFileSync(new URL('./authority-fit-summary.json', import.meta.url), JSON.stringify(out, null, 2));
