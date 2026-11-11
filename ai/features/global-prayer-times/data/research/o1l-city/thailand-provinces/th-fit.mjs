// Thailand CICOT provincial workbooks: fit of the held 19.8/18.1 recipe, one recipe nationally.
// adhan 4.4.6, Rounding.None (second resolution) then explicit per-column rounding.
// Dates come from the capture keys only; TZ pinned to Asia/Bangkok; no clock reads.
// Run: TZ=Asia/Bangkok node th-fit.mjs
import fs from 'node:fs';
import { loadAdhan, evalFixed } from '$HOME/athan-gitree/census/o1k-wide/fit1/lib.mjs';

const W = '$HOME/athan-gitree/census/o1l-city/thailand-provinces';
const coords = JSON.parse(fs.readFileSync(W + '/data/th-province-coordinates.json', 'utf8'));
const adhan = await loadAdhan();
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];
const MODES = ['floor', 'nearest', 'ceil'];
const slugOf = (en) => en.toLowerCase().replace(/ /g, '');

function build(rows, lat, lon) {
  const keys = Object.keys(rows).sort();
  const c = new adhan.Coordinates(lat, lon);
  const chart = {}, raw = { fajr: [], sunrise: [], dhuhr: [], asr: [], magrib: [], isha: [] };
  for (const p of COLS) chart[p] = Int32Array.from(keys, (k) => {
    const [h, m] = rows[k][p].split(':').map(Number);
    return h * 60 + m;
  });
  keys.forEach((k) => {
    const [y, m, d] = k.split('-').map(Number);
    const st = new adhan.SolarTime(new Date(y, m - 1, d), c);
    const at = (hours) => {
      const t = new adhan.TimeComponents(hours).utcDate(y, m - 1, d);
      return t.getHours() * 3600 + t.getMinutes() * 60 + t.getSeconds();
    };
    raw.fajr.push(at(st.hourAngle(-19.8, false)));
    raw.sunrise.push(at(st.sunrise));
    raw.dhuhr.push(at(st.transit));
    raw.asr.push(at(st.afternoon(1)));
    raw.magrib.push(at(st.sunset));
    raw.isha.push(at(st.hourAngle(-18.1, true)));
  });
  for (const p of COLS) raw[p] = Float64Array.from(raw[p]);
  return { keys, chart, raw };
}

const blocks = [
  { id: '2569', label: 'BE 2569 / 2026 normal-year block', suffix: '2569' },
  { id: 'leap', label: 'leap-year block of the same BE 2569 edition', suffix: '2569-leap' },
];
const data = {};
for (const blk of blocks) {
  data[blk.id] = {};
  for (const en of Object.keys(coords)) {
    const rows = JSON.parse(fs.readFileSync(`${W}/data/th-cicot-${slugOf(en)}-${blk.suffix}.json`, 'utf8'));
    data[blk.id][en] = build(rows, coords[en].lat, coords[en].lon);
  }
}

// One national column recipe: the (margin, mode) with the most exact values summed over
// all provinces of both blocks.
const recipe = {};
for (const p of COLS) {
  let best = null;
  for (const mode of MODES) {
    for (let j = -2; j <= 4; j++) {
      const margin = j / 2;
      let exact = 0, within1 = 0, worst = 0, days = 0;
      for (const blk of blocks) for (const en of Object.keys(coords)) {
        const b = data[blk.id][en];
        const s = evalFixed(b.raw[p], b.chart[p], margin, mode);
        exact += s.exact; within1 += s.within1; worst = Math.max(worst, s.worst); days += b.keys.length;
      }
      const cand = { p, margin, mode, exact, within1, worst, days };
      if (!best || cand.exact > best.exact || (cand.exact === best.exact && cand.worst < best.worst)) best = cand;
    }
  }
  recipe[p] = best;
}

const report = { recipe_angles: { fajr: 19.8, isha: 18.1, asr: 'Shafi' }, engine: 'adhan 4.4.6', tz: 'Asia/Bangkok', columns: recipe, blocks: {}, provinces: {} };
for (const blk of blocks) {
  const per = {};
  for (const en of Object.keys(coords)) {
    const b = data[blk.id][en];
    const e = { district: coords[en].district_th, lat: coords[en].lat, lon: coords[en].lon, days: b.keys.length, cols: {} };
    let exact = 0, within1 = 0, worst = 0;
    for (const p of COLS) {
      const s = evalFixed(b.raw[p], b.chart[p], recipe[p].margin, recipe[p].mode);
      e.cols[p] = s;
      exact += s.exact; within1 += s.within1; worst = Math.max(worst, s.worst);
    }
    e.exact = exact; e.within1 = within1; e.worst = worst; e.values = b.keys.length * COLS.length;
    const first = b.keys[0], last = b.keys[b.keys.length - 1];
    const hhmm = (s) => s.split(':').reduce((h, m) => h * 60 + Number(m), 0);
    e.fajr_jan1 = b.keys.length ? null : null;
    per[en] = e;
  }
  report.provinces[blk.id] = per;
  const provs = Object.values(per);
  report.blocks[blk.id] = {
    label: blk.label,
    provinces: provs.length,
    values: provs.reduce((a, e) => a + e.values, 0),
    exact: provs.reduce((a, e) => a + e.exact, 0),
    within1: provs.reduce((a, e) => a + e.within1, 0),
    worst: Math.max(...provs.map((e) => e.worst)),
    provinces_all_within1: provs.filter((e) => e.within1 === e.values).length,
  };
}

// Seasonal amplitude: printed fajr at 1 Jan vs 1 Jul, per province, from the source rows.
for (const blk of blocks) {
  for (const en of Object.keys(coords)) {
    const rows = JSON.parse(fs.readFileSync(`${W}/data/th-cicot-${slugOf(en)}-${blk.suffix}.json`, 'utf8'));
    const year = blk.id === '2569' ? 2026 : 2028;
    const m = (s) => s.split(':').reduce((h, x) => h * 60 + Number(x), 0);
    report.provinces[blk.id][en].fajr_amplitude = m(rows[`${year}-07-01`].fajr) - m(rows[`${year}-01-01`].fajr);
  }
}

fs.writeFileSync(W + '/data/th-fit.json', JSON.stringify(report, null, 1));

console.log('national column recipe (one for all 77 provinces, both blocks):');
for (const p of COLS) {
  const r = recipe[p];
  console.log(`  ${p.padEnd(8)} margin ${r.margin >= 0 ? '+' : ''}${r.margin} ${r.mode.padEnd(7)} exact ${r.exact}/${r.days} (${(100 * r.exact / r.days).toFixed(1)}%)  within1 ${r.within1}/${r.days}  worst ${r.worst}`);
}
for (const blk of blocks) {
  const b = report.blocks[blk.id];
  console.log(`\n${b.label}: ${b.provinces} provinces, ${b.values} printed values, exact ${b.exact} (${(100 * b.exact / b.values).toFixed(1)}%), within1 ${b.within1} (${(100 * b.within1 / b.values).toFixed(1)}%), worst ${b.worst} min, provinces fully within 1: ${b.provinces_all_within1}/${b.provinces}`);
}
const amp = Object.entries(report.provinces['2569']).map(([k, e]) => [e.fajr_amplitude, k]).sort((a, b) => a[0] - b[0]);
console.log('\nfajr seasonal amplitude (1 Jan -> 1 Jul, printed minutes): min', amp[0], 'max', amp[amp.length - 1]);
