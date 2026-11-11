// Job 3: MSBF (Burkina Faso) year-2 evidence. Ouagadougou, October 2021 (text-layer
// annual) against October 2025 (1447 edition images). One recipe, or two?
import { writeFileSync } from 'node:fs';
import { loadAdhan, params, columns, parseHHMM, bestMargin, tzOffsetMinutes, sun, impliedDepression, stats } from './lib.mjs';

const LAT = 12.3714, LNG = -1.5197, TZ = 'Africa/Ouagadougou';
const A = await loadAdhan();

// October 2025, MSBF 1447 annual, pages 4 (1-22 Oct) and 5 (23-31 Oct).
// Column order: fajr azan/iqama, dhuhr azan/iqama, asr azan/iqama, maghrib azan/iqama, isha azan/iqama.
const OCT2025 = [
  ['01', '04:51 05:05 12:25 12:40 15:15 15:30 17:56 18:03 19:20 19:35'],
  ['02', '04:51 05:05 12:25 12:40 15:15 15:30 17:56 18:03 19:20 19:35'],
  ['03', '04:51 05:05 12:25 12:40 15:15 15:30 17:55 18:03 19:20 19:35'],
  ['04', '04:51 05:05 12:25 12:40 15:15 15:30 17:55 18:03 19:20 19:35'],
  ['05', '04:51 05:05 12:25 12:40 15:15 15:30 17:54 18:03 19:20 19:35'],
  ['06', '04:51 05:05 12:25 12:40 15:15 15:30 17:53 18:00 19:20 19:35'],
  ['07', '04:51 05:05 12:25 12:40 15:15 15:30 17:53 18:00 19:20 19:35'],
  ['08', '04:51 05:05 12:25 12:40 15:15 15:30 17:52 18:00 19:20 19:35'],
  ['09', '04:51 05:05 12:25 12:40 15:15 15:30 17:51 18:00 19:20 19:35'],
  ['10', '04:51 05:05 12:25 12:40 15:15 15:30 17:51 18:00 19:15 19:30'],
  ['11', '04:51 05:05 12:25 12:40 15:15 15:30 17:50 17:57 19:15 19:30'],
  ['12', '04:51 05:05 12:25 12:40 15:15 15:30 17:50 17:57 19:15 19:30'],
  ['13', '04:51 05:05 12:25 12:40 15:15 15:30 17:49 17:56 19:15 19:30'],
  ['14', '04:51 05:05 12:25 12:40 15:15 15:30 17:49 17:56 19:15 19:30'],
  ['15', '04:51 05:05 12:25 12:40 15:15 15:30 17:49 17:56 19:15 19:30'],
  ['16', '04:51 05:05 12:25 12:40 15:15 15:30 17:48 17:55 19:15 19:30'],
  ['17', '04:51 05:05 12:25 12:40 15:15 15:30 17:47 17:54 19:15 19:30'],
  ['18', '04:51 05:05 12:25 12:40 15:15 15:30 17:46 17:53 19:15 19:30'],
  ['19', '04:51 05:05 12:25 12:40 15:15 15:30 17:46 17:53 19:15 19:30'],
  ['20', '04:51 05:05 12:25 12:40 15:15 15:30 17:45 17:52 19:15 19:30'],
  ['21', '04:51 05:05 12:25 12:40 15:15 15:30 17:45 17:52 19:15 19:30'],
  ['22', '04:51 05:05 12:25 12:40 15:15 15:30 17:44 17:51 19:15 19:30'],
  ['23', '04:51 05:05 12:25 12:40 15:10 15:25 17:44 17:51 19:10 19:25'],
  ['24', '04:52 05:05 12:25 12:40 15:10 15:25 17:44 17:51 19:10 19:25'],
  ['25', '04:52 05:05 12:25 12:40 15:10 15:25 17:43 17:51 19:10 19:25'],
  ['26', '04:52 05:05 12:25 12:40 15:10 15:25 17:43 17:51 19:10 19:25'],
  ['27', '04:52 05:05 12:25 12:40 15:10 15:25 17:42 17:51 19:10 19:25'],
  ['28', '04:52 05:05 12:25 12:40 15:10 15:25 17:42 17:51 19:10 19:25'],
  ['29', '04:52 05:05 12:25 12:40 15:10 15:25 17:42 17:51 19:10 19:25'],
  ['30', '04:52 05:05 12:25 12:40 15:10 15:25 17:41 17:48 19:10 19:25'],
  ['31', '04:52 05:05 12:25 12:40 15:10 15:25 17:41 17:48 19:10 19:25'],
];

// October 2021, MSBF annual PDF (sunna.bf), page 10 of the text layer, 31 rows.
const OCT2021 = [
  ['01', '04:46 05:00 12:25 12:40 15:15 15:30 17:56 18:03 19:15 19:30'],
  ['02', '04:46 05:00 12:25 12:40 15:15 15:30 17:56 18:03 19:15 19:30'],
  ['03', '04:46 05:00 12:25 12:40 15:15 15:30 17:55 18:03 19:15 19:30'],
  ['04', '04:46 05:00 12:25 12:40 15:15 15:30 17:55 18:03 19:15 19:30'],
  ['05', '04:46 05:00 12:25 12:40 15:15 15:30 17:54 18:03 19:15 19:30'],
  ['06', '04:46 05:00 12:25 12:40 15:15 15:30 17:53 18:03 19:15 19:30'],
  ['07', '04:46 05:00 12:25 12:40 15:15 15:30 17:53 18:03 19:15 19:30'],
  ['08', '04:46 05:00 12:25 12:40 15:15 15:30 17:52 17:59 19:15 19:30'],
  ['09', '04:46 05:00 12:25 12:40 15:15 15:30 17:51 17:59 19:15 19:30'],
  ['10', '04:46 05:00 12:25 12:40 15:15 15:30 17:51 17:59 19:05 19:20'],
  ['11', '04:46 05:00 12:25 12:40 15:15 15:30 17:50 17:59 19:05 19:20'],
  ['12', '04:46 05:00 12:25 12:40 15:15 15:30 17:50 17:59 19:05 19:20'],
  ['13', '04:46 05:00 12:25 12:40 15:15 15:30 17:49 17:59 19:05 19:20'],
  ['14', '04:46 05:00 12:25 12:40 15:15 15:30 17:49 17:59 19:05 19:20'],
  ['15', '04:46 05:00 12:25 12:40 15:15 15:30 17:48 17:55 19:05 19:20'],
  ['16', '04:46 05:00 12:25 12:40 15:15 15:30 17:47 17:55 19:05 19:20'],
  ['17', '04:46 05:00 12:25 12:40 15:15 15:30 17:47 17:55 19:05 19:20'],
  ['18', '04:46 05:00 12:25 12:40 15:15 15:30 17:46 17:55 19:05 19:20'],
  ['19', '04:46 05:00 12:25 12:40 15:10 15:25 17:46 17:55 19:05 19:20'],
  ['20', '04:46 05:00 12:25 12:40 15:10 15:25 17:45 17:55 19:05 19:20'],
  ['21', '04:46 05:00 12:25 12:40 15:10 15:25 17:45 17:55 19:05 19:20'],
  ['22', '04:46 05:00 12:25 12:40 15:10 15:25 17:44 17:51 19:05 19:20'],
  ['23', '04:46 05:00 12:25 12:40 15:10 15:25 17:44 17:51 19:05 19:20'],
  ['24', '04:47 05:00 12:25 12:40 15:10 15:25 17:44 17:51 19:05 19:20'],
  ['25', '04:47 05:00 12:25 12:40 15:10 15:25 17:43 17:51 19:05 19:20'],
  ['26', '04:47 05:00 12:25 12:40 15:10 15:25 17:43 17:51 19:05 19:20'],
  ['27', '04:47 05:00 12:25 12:40 15:10 15:25 17:42 17:51 19:05 19:20'],
  ['28', '04:47 05:00 12:25 12:40 15:10 15:25 17:42 17:51 19:05 19:20'],
  ['29', '04:47 05:00 12:25 12:40 15:10 15:25 17:42 17:51 19:05 19:20'],
  ['30', '04:47 05:00 12:25 12:40 15:10 15:25 17:41 17:51 19:05 19:20'],
  ['31', '04:47 05:00 12:25 12:40 15:10 15:25 17:41 17:51 19:05 19:20'],
];

const COLS = ['fajrAzan', 'fajrIqama', 'dhuhrAzan', 'dhuhrIqama', 'asrAzan', 'asrIqama', 'maghribAzan', 'maghribIqama', 'ishaAzan', 'ishaIqama'];

function rowsOf(list, year) {
  return list.map(([dd, line]) => {
    const v = line.trim().split(/\s+/);
    const row = { date: `${year}-10-${dd}` };
    COLS.forEach((c, i) => { row[c] = parseHHMM(v[i]); });
    return row;
  });
}

const editions = { 2021: rowsOf(OCT2021, 2021), 2025: rowsOf(OCT2025, 2025) };

// Geometry per day: solar noon, declination, printed columns.
function prep(rows) {
  const off = tzOffsetMinutes(TZ, new Date(`${rows[0].date}T12:00:00Z`));
  return rows.map((r) => {
    const [y, m, d] = r.date.split('-').map(Number);
    const utc = new Date(Date.UTC(y, m - 1, d, 0));
    const s = sun(A, { lat: LAT, lng: LNG }, utc);
    const noon = s.transit * 60 + off;
    return { ...r, noon, decl: s.decl, fajrDepth: impliedDepression(s, LAT, (r.fajrAzan - noon) / 60), ishaDepth: impliedDepression(s, LAT, (r.ishaAzan - noon) / 60) };
  });
}

const G = { 2021: prep(editions[2021]), 2025: prep(editions[2025]) };

// Angle+margin sweep for one column over a set of days.
function fitAngle(days, col, angleRange = [13, 21], madhab = 'shafi') {
  let best = null;
  for (let angle = angleRange[0]; angle <= angleRange[1] + 1e-9; angle += 0.05) {
    const p = params(A, angle, angle, { madhab });
    const mins = [], printed = [];
    for (const r of days) {
      const [y, m, d] = r.date.split('-').map(Number);
      const c = columns(A, { lat: LAT, lng: LNG }, new Date(Date.UTC(y, m - 1, d, 0)), p);
      const off = tzOffsetMinutes(TZ, new Date(Date.UTC(y, m - 1, d, 12)));
      mins.push(((c[col === 'fajrAzan' ? 'fajr' : col === 'ishaAzan' ? 'isha' : col] / 60 + off) % 1440 + 1440) % 1440);
      printed.push(r[col]);
    }
    const r = bestMargin(mins, printed, { m0: -4, step: 0.5, jMax: 16 });
    r.angle = +angle.toFixed(2);
    if (!best || r.within1 > best.within1 || (r.within1 === best.within1 && r.exact > best.exact) ||
        (r.within1 === best.within1 && r.exact === best.exact && r.worst < best.worst)) best = r;
  }
  return best;
}

function fitJoint(col) {
  const days = [...G[2021], ...G[2025]];
  let best = null;
  for (let angle = 13; angle <= 21 + 1e-9; angle += 0.05) {
    const p = params(A, angle, angle);
    const mins = [], printed = [];
    for (const r of days) {
      const [y, m, d] = r.date.split('-').map(Number);
      const c = columns(A, { lat: LAT, lng: LNG }, new Date(Date.UTC(y, m - 1, d, 0)), p);
      const off = tzOffsetMinutes(TZ, new Date(Date.UTC(y, m - 1, d, 12)));
      mins.push(((c[col === 'fajrAzan' ? 'fajr' : 'isha'] / 60 + off) % 1440 + 1440) % 1440);
      printed.push(r[col]);
    }
    const r = bestMargin(mins, printed, { m0: -4, step: 0.5, jMax: 16 });
    r.angle = +angle.toFixed(2);
    if (!best || r.within1 > best.within1 || (r.within1 === best.within1 && r.exact > best.exact)) best = r;
  }
  return best;
}

// Apply one (angle, margin, mode) recipe to a set of days, return per-edition scores.
function applyRecipe(col, angle, margin, mode) {
  const out = {};
  for (const year of [2021, 2025]) {
    const p = params(A, angle, angle);
    let exact = 0, within1 = 0, worst = 0; const errs = [];
    for (const r of G[year]) {
      const [y, m, d] = r.date.split('-').map(Number);
      const c = columns(A, { lat: LAT, lng: LNG }, new Date(Date.UTC(y, m - 1, d, 0)), p);
      const off = tzOffsetMinutes(TZ, new Date(Date.UTC(y, m - 1, d, 12)));
      const calc = ((c[col === 'fajrAzan' ? 'fajr' : 'isha'] / 60 + off) % 1440 + 1440) % 1440 + margin;
      const v = mode === 'floor' ? Math.floor(calc) : Math.round(calc);
      const e = v - r[col];
      errs.push(e);
      if (e === 0) exact++; if (Math.abs(e) <= 1) within1++; if (Math.abs(e) > Math.abs(worst)) worst = e;
    }
    out[year] = { exact, within1, worst, n: errs.length, meanErr: +(errs.reduce((a, b) => a + b, 0) / errs.length).toFixed(2) };
  }
  return out;
}

// Asr: Shafi (shadow 1) vs Hanafi (shadow 2), printed azan.
function fitAsr() {
  const out = {};
  for (const year of [2021, 2025]) {
    out[year] = {};
    for (const madhab of ['shafi', 'hanafi']) {
      const p = params(A, 18, 18, { madhab });
      const mins = [], printed = [];
      for (const r of G[year]) {
        const [y, m, d] = r.date.split('-').map(Number);
        const c = columns(A, { lat: LAT, lng: LNG }, new Date(Date.UTC(y, m - 1, d, 0)), p);
        const off = tzOffsetMinutes(TZ, new Date(Date.UTC(y, m - 1, d, 12)));
        mins.push(((c.asr / 60 + off) % 1440 + 1440) % 1440);
        printed.push(r.asrAzan);
      }
      out[year][madhab] = bestMargin(mins, printed, { m0: -4, step: 0.5, jMax: 16 });
    }
  }
  return out;
}

// Maghrib: is the printed azan the sunset instant?
function fitMaghrib() {
  const out = {};
  for (const year of [2021, 2025]) {
    const p = params(A, 18, 18);
    const mins = [], printed = [];
    for (const r of G[year]) {
      const [y, m, d] = r.date.split('-').map(Number);
      const c = columns(A, { lat: LAT, lng: LNG }, new Date(Date.UTC(y, m - 1, d, 0)), p);
      const off = tzOffsetMinutes(TZ, new Date(Date.UTC(y, m - 1, d, 12)));
      mins.push(((c.maghrib / 60 + off) % 1440 + 1440) % 1440);
      printed.push(r.maghribAzan);
    }
    out[year] = bestMargin(mins, printed, { m0: -4, step: 0.5, jMax: 16 });
  }
  return out;
}

// Dhuhr: printed azan against true solar noon.
function dhuhrOffsets() {
  const out = {};
  for (const year of [2021, 2025]) {
    const v = G[year].map(r => r.dhuhrAzan - r.noon);
    out[year] = {
      min: +Math.min(...v).toFixed(1), max: +Math.max(...v).toFixed(1),
      mean: +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1),
      printed_azan_constant: G[year].every(r => r.dhuhrAzan === G[year][0].dhuhrAzan) ? G[year][0].dhuhrAzan : null,
    };
  }
  return out;
}

const perEdition = {};
for (const year of [2021, 2025]) {
  perEdition[year] = {
    fajr: fitAngle(G[year], 'fajrAzan'),
    isha: fitAngle(G[year], 'ishaAzan'),
    fajrDepth: stats(G[year].map(r => r.fajrDepth)),
    ishaDepth: stats(G[year].map(r => r.ishaDepth)),
  };
}
const joint = { fajr: fitJoint('fajrAzan'), isha: fitJoint('ishaAzan') };

const r = (x) => ({ angle: x.angle, margin: x.margin, mode: x.mode, exact: x.exact, within1: x.within1, worst: x.worst, n: x.n });

const result = {
  job: 'Burkina Faso year-2: MSBF 2021 annual against the 1447 (2025-2026) edition',
  coordinate: { lat: LAT, lng: LNG, tz: TZ },
  month: 'October 2025 (images, page 4 rows 1-22 Oct and page 5 rows 23-31 Oct) and October 2021 (annual PDF page 10)',
  transcription: {
    2025: editions[2025].map(x => ({ date: x.date, fajr: x.fajrAzan, fajr_iqama: x.fajrIqama, dhuhr: x.dhuhrAzan, dhuhr_iqama: x.dhuhrIqama, asr: x.asrAzan, asr_iqama: x.asrIqama, maghrib: x.maghribAzan, maghrib_iqama: x.maghribIqama, isha: x.ishaAzan, isha_iqama: x.ishaIqama })),
    2021: editions[2021].map(x => ({ date: x.date, fajr: x.fajrAzan, fajr_iqama: x.fajrIqama, dhuhr: x.dhuhrAzan, dhuhr_iqama: x.dhuhrIqama, asr: x.asrAzan, asr_iqama: x.asrIqama, maghrib: x.maghribAzan, maghrib_iqama: x.maghribIqama, isha: x.ishaAzan, isha_iqama: x.ishaIqama })),
  },
  per_edition: {
    2021: { fajr: r(perEdition[2021].fajr), isha: r(perEdition[2021].isha), fajr_depth: perEdition[2021].fajrDepth, isha_depth: perEdition[2021].ishaDepth },
    2025: { fajr: r(perEdition[2025].fajr), isha: r(perEdition[2025].isha), fajr_depth: perEdition[2025].fajrDepth, isha_depth: perEdition[2025].ishaDepth },
  },
  joint_fit: { fajr: r(joint.fajr), isha: r(joint.isha) },
  joint_applied: { fajr: applyRecipe('fajrAzan', joint.fajr.angle, joint.fajr.margin, joint.fajr.mode), isha: applyRecipe('ishaAzan', joint.isha.angle, joint.isha.margin, joint.isha.mode) },
  asr: fitAsr(),
  maghrib_is_sunset: fitMaghrib(),
  dhuhr_vs_true_noon: dhuhrOffsets(),
};

const f = (x) => `${x.angle} +${x.margin} ${x.mode}: ${x.exact}/${x.n} exact, ${x.within1}/${x.n} within 1, worst ${x.worst}`;
console.log('== per-edition optimum (fajr, isha) ==');
console.log('2021 fajr', f(perEdition[2021].fajr));
console.log('2025 fajr', f(perEdition[2025].fajr));
console.log('2021 isha', f(perEdition[2021].isha));
console.log('2025 isha', f(perEdition[2025].isha));
console.log('\nimplied depths (deg below horizon, median [min..max]):');
for (const y of [2021, 2025]) {
  const a = perEdition[y];
  console.log(`${y} fajr ${a.fajrDepth.med.toFixed(2)} [${a.fajrDepth.min.toFixed(2)}..${a.fajrDepth.max.toFixed(2)}]  isha ${a.ishaDepth.med.toFixed(2)} [${a.ishaDepth.min.toFixed(2)}..${a.ishaDepth.max.toFixed(2)}]`);
}
console.log('\n== one recipe across both editions ==');
console.log('joint fajr', f(joint.fajr), JSON.stringify(result.joint_applied.fajr));
console.log('joint isha', f(joint.isha), JSON.stringify(result.joint_applied.isha));
console.log('\nasr (shafi/hanafi):');
for (const y of [2021, 2025]) console.log(`${y} shafi ${f(result.asr[y].shafi)}  |  hanafi ${f(result.asr[y].hanafi)}`);
console.log('\nmaghrib vs sunset:');
for (const y of [2021, 2025]) console.log(`${y} ${f(result.maghrib_is_sunset[y])}`);
console.log('\ndhuhr printed azan vs true solar noon (min):', JSON.stringify(result.dhuhr_vs_true_noon));

writeFileSync(new URL('./burkina.json', import.meta.url), JSON.stringify(result, null, 1));
console.log('\nwrote burkina.json');

// Per-date clock delta between editions, and the block structure of each column.
const delta = [];
for (let i = 0; i < G[2021].length; i++) {
  const a = G[2021][i], b = G[2025][i];
  delta.push({
    date: b.date,
    fajr: b.fajrAzan - a.fajrAzan, dhuhr: b.dhuhrAzan - a.dhuhrAzan, asr: b.asrAzan - a.asrAzan,
    maghrib: b.maghribAzan - a.maghribAzan, isha: b.ishaAzan - a.ishaAzan,
  });
}
const spans = (arr) => ({ min: Math.min(...arr), max: Math.max(...arr) });
const summary = {};
for (const k of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) {
  const v = delta.map(d => d[k]);
  summary[k] = { ...spans(v), counts: Object.fromEntries([...new Set(v)].sort((x, y) => x - y).map(x => [x, v.filter(y => y === x).length])) };
}
console.log('\n== 2025 minus 2021, minutes, per column ==');
for (const [k, v] of Object.entries(summary)) console.log(k.padEnd(8), `min ${v.min} max ${v.max}`, JSON.stringify(v.counts));
console.log('\n== block structure (azan) ==');
for (const y of [2021, 2025]) {
  for (const col of ['fajrAzan', 'dhuhrAzan', 'asrAzan', 'ishaAzan']) {
    const blocks = [];
    for (const r of G[y]) {
      const last = blocks[blocks.length - 1];
      if (last && last.v === r[col]) last.to = r.date; else blocks.push({ v: r[col], from: r.date, to: r.date });
    }
    console.log(`${y} ${col.padEnd(11)}`, blocks.map(b => `${String(b.v).padStart(4)} ${b.from.slice(8)}-${b.to.slice(8)}`).join('  '));
  }
}
result.per_date_delta = delta;
result.delta_summary = summary;
writeFileSync(new URL('./burkina.json', import.meta.url), JSON.stringify(result, null, 1));
