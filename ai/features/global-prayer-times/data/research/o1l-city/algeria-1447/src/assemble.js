// Assemble 1447 month TSVs (and fit11's held months) into canonical JSON, then audit the ramps.
// usage: node assemble.js <wilaya-tag>
const fs = require('fs');
const path = require('path');

const ROOT = path.join(process.env.HOME, 'athan-gitree/census/o1l-city/algeria-1447');
const HELD = path.join(process.env.HOME, 'athan-gitree/census/o1k-wide/fit11');

const COLS = ['fajr', 'sunrise', 'qibla', 'dhuhr', 'asr', 'maghrib', 'isha'];
const MONTHS = {
  1: 'Muharram', 2: 'Safar', 3: 'Rabi al-Awwal', 4: 'Rabi al-Thani', 5: 'Jumada al-Ula',
  6: 'Jumada al-Thaniya', 7: 'Rajab', 8: "Sha'ban", 9: 'Ramadan', 10: 'Shawwal',
  11: 'Dhu al-Qada', 12: 'Dhu al-Hijja',
};

// fit11 month files, keyed by wilaya tag then Hijri month number
const HELD_FILES = {
  dz47: { 5: 'dz-alger-1447-jumada1.json', 6: 'dz-alger-1447-jumada2.json', 7: 'dz-alger-1447-rajab.json', 9: 'dz-alger-1447-ramadan.json' },
  ad47: { 5: 'dz-adrar-1447-jumada1.json' },
  dj47: { 5: 'dz-djelfa-1447-jumada1.json' },
};

const tag = process.argv[2];
if (!tag) throw new Error('tag required');

function hhmm(s) {
  if (s == null || s === '' || s === '////') return null;
  const m = /^(\d{2}):(\d{2})$/.exec(s.trim());
  if (!m) throw new Error('bad time ' + s);
  return m[1] + m[2];
}

function rowsFromTsv(file) {
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const p = t.split(/\s+/);
    if (p.length !== 8) throw new Error(`${file}: want 8 fields, got ${p.length}: ${t}`);
    out[p[0]] = { fajr: p[1], sunrise: p[2], qibla: p[3], dhuhr: p[4], asr: p[5], maghrib: p[6], isha: p[7] };
  }
  return out;
}

function rowsFromHeld(file) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const out = {};
  for (const [date, r] of Object.entries(d.rows)) {
    out[date] = {};
    for (const c of COLS) out[date][c] = hhmm(r[c]);
  }
  return out;
}

const months = {};
const held = HELD_FILES[tag] || {};
for (let m = 1; m <= 12; m++) {
  const tsv = path.join(ROOT, 'src/tsv', `${tag}-${String(m).padStart(2, '0')}.tsv`);
  if (held[m]) months[m] = { rows: rowsFromHeld(path.join(HELD, held[m])), from: 'fit11 ' + held[m] };
  else if (fs.existsSync(tsv)) months[m] = { rows: rowsFromTsv(tsv), from: 'tsv ' + path.basename(tsv) };
  else months[m] = { rows: null, from: 'MISSING' };
}

// audit: contiguity, day counts, and per-column ramp against neighbour mean
const allDates = Object.values(months).flatMap((m) => Object.keys(m.rows || {})).sort();
const audit = { tag, months: {}, gaps: [], duplicates: [], outliers: [] };
for (let m = 1; m <= 12; m++) {
  const r = months[m].rows;
  audit.months[m] = { name: MONTHS[m], days: r ? Object.keys(r).length : 0, from: months[m].from };
}
for (let i = 1; i < allDates.length; i++) {
  const prev = Date.parse(allDates[i - 1] + 'T00:00:00Z');
  const cur = Date.parse(allDates[i] + 'T00:00:00Z');
  if (cur - prev !== 86400000) audit.gaps.push([allDates[i - 1], allDates[i]]);
}
const seen = new Set();
for (const d of allDates) { if (seen.has(d)) audit.duplicates.push(d); seen.add(d); }

// ramp check: a column should not move more than 6 min from the mean of its two neighbours
for (let i = 1; i < allDates.length - 1; i++) {
  const [a, b, c] = [allDates[i - 1], allDates[i], allDates[i + 1]];
  for (const col of COLS) {
    const va = value(months, a, col), vb = value(months, b, col), vc = value(months, c, col);
    if (va == null || vb == null || vc == null) continue;
    const mid = (va + vc) / 2;
    if (Math.abs(vb - mid) > 6) audit.outliers.push({ date: b, col, prev: va, cur: vb, next: vc, dev: vb - mid });
  }
}

function value(months, date, col) {
  for (const m of Object.values(months)) {
    if (m.rows && m.rows[date]) {
      const v = m.rows[date][col];
      return v == null ? null : Number(v.slice(0, 2)) * 60 + Number(v.slice(2));
    }
  }
  return null;
}

const outDir = path.join(ROOT, 'data');
fs.mkdirSync(outDir, { recursive: true });
const bundle = { tag, source: 'marw.gov.dz 1447 book, transcribed page images', months: {}, audit };
for (let m = 1; m <= 12; m++) {
  if (!months[m].rows) continue;
  bundle.months[m] = { name: MONTHS[m], from: months[m].from, rows: months[m].rows };
}
fs.writeFileSync(path.join(outDir, `${tag}-1447-all.json`), JSON.stringify(bundle, null, 1));
fs.writeFileSync(path.join(ROOT, 'src', `${tag}-audit.json`), JSON.stringify(audit, null, 1));
console.log(JSON.stringify(audit.months));
console.log('days', allDates.length, 'first', allDates[0], 'last', allDates.at(-1));
console.log('gaps', JSON.stringify(audit.gaps), 'dups', audit.duplicates.length, 'outliers', audit.outliers.length);
for (const o of audit.outliers.slice(0, 20)) console.log('OUT', JSON.stringify(o));
