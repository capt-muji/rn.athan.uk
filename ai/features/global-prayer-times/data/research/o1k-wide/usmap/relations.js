// Printed-relation checks on tonight's North American captures. No engine, no clock, no network.
// Every figure written here is a relation between two printed columns of one table.
import fs from 'node:fs';

const W = process.env.HOME + '/athan-gitree/census/o1k-wide/';
const read = p => JSON.parse(fs.readFileSync(W + p, 'utf8'));

const toMin = t => {
  const [h, m] = t.split(':').map(Number);
  return h % 24 * 60 + m;
};

// Both shapes land on date -> [fajr, sunrise, dhuhr, asr, maghrib, isha].
function rows(d) {
  const src = d.athan && typeof d.athan === 'object' && !Array.isArray(d.athan) ? d.athan : d;
  const out = new Map();
  for (const [date, v] of Object.entries(src)) {
    if (Array.isArray(v) && v.length >= 6) out.set(date, v.slice(0, 6).map(toMin));
    else if (v && typeof v === 'object' && v.fajr) {
      out.set(date, [v.fajr, v.sunrise, v.dhuhr, v.asr, v.magrib || v.maghrib, v.isha].map(toMin));
    }
  }
  return out;
}

const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
const stat = a => {
  const s = [...a].sort((x, y) => x - y);
  return { n: a.length, min: s[0], max: s[s.length - 1], mean: +mean(a).toFixed(2), p10: s[Math.floor(s.length * 0.1)], p90: s[Math.floor(s.length * 0.9)] };
};

const out = {};
const put = (k, v) => { out[k] = v; console.log(k, JSON.stringify(v)); };

// 1. IANT: the dpt install against the Masjidal widget on the same mosque, 2026.
{
  const dpt = rows(read('americas/data/us_iant_richardson_tx_2026.json'));
  const mas = rows(read('americas2/data/masjidal_xdy03lAX_2026.json'));
  const shared = [...dpt.keys()].filter(d => mas.has(d));
  const cols = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const deltas = {};
  cols.forEach((c, i) => { deltas[c] = stat(shared.map(d => mas.get(d)[i] - dpt.get(d)[i])); });
  put('iant_widget_minus_dpt_2026', { sharedDays: shared.length, deltas });
}

// 2. Isha minus maghrib: an interval is a single value, an angle is not.
const intervalTable = {
  daralhijrah: 'americas/data/us_daralhijrah_falls_church_va_2026.json',
  iit_toronto: 'americas/data/ca_islamic_institute_toronto_2026.json',
  masjid_toronto: 'americas/data/ca_masjid_toronto_2026.json',
  kitchener: 'americas2/data/ca_kitchener_masjid.json',
  halifax: 'americas2/data/ca_ummah_masjid_halifax.json',
  bilal_winnipeg: 'americas2/data/ca_bilal_centre_winnipeg.json',
  toledo: 'americas2/data/us_icgt_toledo.json',
  san_antonio: 'americas2/data/us_mcsamasjid_san_antonio.json',
  cciq_quebec: 'americas2/data/ca_cciq_quebec_2026.json',
  capitale_quebec: 'americas2/data/ca_mosquee_capitale_quebec_2026.json',
};
{
  const t = {};
  for (const [name, path] of Object.entries(intervalTable)) {
    const r = rows(read(path));
    const gaps = [...r.values()].map(v => v[5] - v[4]);
    const distinct = [...new Set(gaps)].sort((a, b) => a - b);
    t[name] = { days: gaps.length, gap: stat(gaps), distinct: distinct.length, values: distinct.slice(0, 12) };
  }
  put('isha_minus_maghrib', t);
}

// 3. Kitchener's summer ceiling: the longest consecutive run on one printed value.
{
  const r = rows(read('americas2/data/ca_kitchener_masjid.json'));
  const dates = [...r.keys()].sort();
  const pinned = dates.filter(d => r.get(d)[5] === toMin('22:10'));
  let best = { len: 0, from: null, to: null }, run = { len: 0, from: null, to: null };
  let prev = null;
  for (const d of dates) {
    if (r.get(d)[5] === toMin('22:10')) {
      if (!run.len) run = { len: 0, from: d, to: d };
      run.len++; run.to = d;
      if (run.len > best.len) best = { ...run };
    } else run = { len: 0, from: null, to: null };
    prev = d;
  }
  const before = dates.filter(d => r.get(d)[5] < toMin('22:10'));
  put('kitchener_cap', { pinnedDays: pinned.length, longestRun: best, ordinaryDays: before.length, maxOrdinaryIsha: Math.max(...before.map(d => r.get(d)[5])) });
}

// 4. Toledo: the internal-consistency test. Morning and evening half-days about dhuhr.
//    A column set computed on the wrong offset fails this; sunrise is not shifted, so the split shows.
{
  const r = rows(read('americas2/data/us_icgt_toledo.json'));
  const byMonth = {};
  for (const [d, v] of r) {
    const m = d.slice(0, 7);
    (byMonth[m] ||= []).push({ am: v[2] - v[1], pm: v[4] - v[2], sr: v[1], dh: v[2] });
  }
  const t = {};
  for (const [m, a] of Object.entries(byMonth)) {
    t[m] = { morningMean: +mean(a.map(x => x.am)).toFixed(1), eveningMean: +mean(a.map(x => x.pm)).toFixed(1) };
  }
  put('toledo_halfdays_about_dhuhr', t);
}

// 5. The prairie month-boundary jump: consecutive sunrise across a month line.
{
  const t = {};
  for (const [name, path] of Object.entries({
    brandon: 'americas/data/ca_brandon_islamic_centre_2026.json',
    bilal_winnipeg: 'americas2/data/ca_bilal_centre_winnipeg.json',
    mia_winnipeg: 'americas2/data/ca_mia_winnipeg.json',
  })) {
    const r = rows(read(path));
    const dates = [...r.keys()].sort();
    const jumps = [];
    for (let i = 1; i < dates.length; i++) {
      const a = r.get(dates[i - 1])[1], b = r.get(dates[i])[1];
      if (Math.abs(b - a) >= 20) jumps.push({ at: dates[i], sunriseBefore: a, sunriseAfter: b, jump: b - a });
    }
    t[name] = { days: dates.length, jumps };
  }
  put('certified_month_jumps', t);
}

fs.writeFileSync(W + 'usmap/relations.json', JSON.stringify(out, null, 1));
console.log('\nwrote relations.json');
