// Stage 5: adversarial structural checks.
// a) Is the publisher's fajr lead / isha lag constant per MM-DD across all 11 years?
// b) Does a day-of-year keying fit worse (the claim says MM-DD)?
// c) Does the fitted 2027 table equal the offsets the truth exhibits for 2028-2038?
// d) Is the DST rule I use identical to Intl's Europe/London on every day?
// e) Where do the 1-minute misses sit (year, month, prayer, DST proximity)?
import fs from 'node:fs';
import path from 'node:path';

const HOME = process.env.HOME;
const ROOT = path.join(HOME, 'athan-gitree/census/o1g-decade');
const OUT = path.join(ROOT, 'verify');
const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];
const pad = (n) => String(n).padStart(2, '0');

const ext = JSON.parse(fs.readFileSync(path.join(OUT, 'extract-2028-2038.json'), 'utf8'));
const recipe = JSON.parse(fs.readFileSync(path.join(ROOT, 'fit/recipe.json'), 'utf8'));
const gen = JSON.parse(fs.readFileSync(path.join(OUT, 'stage2-gen.json'), 'utf8'));

// ---- a) lead/lag constancy per MM-DD across 11 years ----------------------
const byKey = new Map();
for (const [date, r] of Object.entries(ext)) {
  const k = date.slice(5);
  if (!byKey.has(k)) byKey.set(k, { lead: new Set(), lag: new Set() });
  byKey.get(k).lead.add(r.sunrise - r.fajr);
  byKey.get(k).lag.add(r.isha - r.magrib);
}
const inconsistentLead = [...byKey].filter(([, v]) => v.lead.size !== 1).map(([k, v]) => [k, [...v.lead]]);
const inconsistentLag = [...byKey].filter(([, v]) => v.lag.size !== 1).map(([k, v]) => [k, [...v.lag]]);
// distinct values per MM-DD is 1 everywhere => the table is date-keyed, not year-keyed.

// ---- b) day-of-year keying would shift post-Feb-29 dates in leap years -----
// Under DOY keying the 2028-02-29 slot would borrow 2027 DOY 60 (=03-01), and every
// later leap-year date would read the previous month-day's offset.
function doy(y, m, d) {
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000) + 1;
}
const leapYears = new Set([2028, 2032, 2036]);
// offsets keyed by DOY taken from 2027 (non-leap reference year)
const doyLead = new Map(), doyLag = new Map();
for (let m = 1; m <= 12; m++) {
  const dim = new Date(Date.UTC(2027, m, 0)).getUTCDate();
  for (let d = 1; d <= dim; d++) {
    const k = `${pad(m)}-${pad(d)}`;
    doyLead.set(doy(2027, m, d), recipe.prayers.fajr.table[k]);
    doyLag.set(doy(2027, m, d), recipe.prayers.isha.table[k]);
  }
}
let mmddExact = 0, doyExact = 0, cells = 0, doyDiff = 0;
for (const [date, r] of Object.entries(ext)) {
  const [y, m, d] = date.split('-').map(Number);
  const k = date.slice(5);
  const n = doy(y, m, d);
  const gl = doyLead.get(n), glag = doyLag.get(n);
  // only the two offset-derived predictions change; solar columns are identical
  for (const p of PRAYERS) {
    cells++;
    const predMmdd = p === 'fajr' ? r.sunrise - recipe.prayers.fajr.table[k]
      : p === 'isha' ? r.magrib + recipe.prayers.isha.table[k] : null;
    const predDoy = p === 'fajr' ? r.sunrise - gl : p === 'isha' ? r.magrib + glag : null;
    if (predMmdd === null) { mmddExact++; doyExact++; continue; }
    if (predMmdd === r[p]) mmddExact++;
    if (predDoy === r[p]) doyExact++;
    if (predMmdd !== predDoy) doyDiff++;
  }
  if (!leapYears.has(y)) continue;
}
// leap-year-only view of the two offset columns
let leapCells = 0, leapMmdd = 0, leapDoy = 0;
for (const [date, r] of Object.entries(ext)) {
  const [y, m, d] = date.split('-').map(Number);
  if (!leapYears.has(y) || (m === 1) || (m === 2 && d < 29)) continue;
  const k = date.slice(5), n = doy(y, m, d);
  for (const p of ['fajr', 'isha']) {
    leapCells++;
    const predMmdd = p === 'fajr' ? r.sunrise - recipe.prayers.fajr.table[k] : r.magrib + recipe.prayers.isha.table[k];
    const predDoy = p === 'fajr' ? r.sunrise - doyLead.get(n) : r.magrib + doyLag.get(n);
    if (predMmdd === r[p]) leapMmdd++;
    if (predDoy === r[p]) leapDoy++;
  }
}

// ---- c) does the recipe table (fitted on 2027) equal the truth offsets? ----
const tableVsTruth = [];
for (const [k, v] of byKey) {
  const t = [...v.lead][0], l = [...v.lag][0];
  if (t !== recipe.prayers.fajr.table[k]) tableVsTruth.push({ key: k, col: 'fajr', table: recipe.prayers.fajr.table[k], truth: t });
  if (l !== recipe.prayers.isha.table[k]) tableVsTruth.push({ key: k, col: 'isha', table: recipe.prayers.isha.table[k], truth: l });
}

// ---- d) DST rule vs Intl --------------------------------------------------
const DAYMS = 86400000;
function lastSunday(y, month) {
  const last = new Date(Date.UTC(y, month, 0)).getUTCDate();
  return last - new Date(Date.UTC(y, month - 1, last)).getUTCDay();
}
function ruleOffset(utcMs) {
  const y = new Date(utcMs).getUTCFullYear();
  const s = Date.UTC(y, 2, lastSunday(y, 3), 1), e = Date.UTC(y, 9, lastSunday(y, 10), 1);
  return utcMs >= s && utcMs < e ? 60 : 0;
}
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', timeZoneName: 'longOffset' });
const intlOffset = (ms) => {
  const s = fmt.formatToParts(new Date(ms)).find((p) => p.type === 'timeZoneName').value; // GMT+01:00
  const m = s.match(/GMT([+-])(\d\d):(\d\d)/);
  return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
};
let dstChecked = 0, dstBad = [];
for (let y = 2026; y <= 2076; y++) {
  for (let d = 0; d < 366; d++) {
    const ms = Date.UTC(y, 2, lastSunday(y, 3), 1) - 2 * 3600000 + d * 1800000;
    const ms2 = Date.UTC(y, 9, lastSunday(y, 10), 1) - 2 * 3600000 + d * 1800000;
    for (const t of [ms, ms2]) {
      dstChecked++;
      if (ruleOffset(t) !== intlOffset(t)) dstBad.push(new Date(t).toISOString());
    }
  }
}
// every event instant actually used
let evBad = 0;
for (const [date, r] of Object.entries(ext)) {
  const [y, m, d] = date.split('-').map(Number);
  for (const h of [4, 6, 11, 12, 13, 18, 20, 22]) {
    const t = Date.UTC(y, m - 1, d, h);
    dstChecked++;
    if (ruleOffset(t) !== intlOffset(t)) evBad++;
  }
}

// ---- e) miss map ----------------------------------------------------------
const misses = [];
for (const c of gen.worstCells || []) misses.push(c);
let missCells = [];
{
  // recompute misses from the generator's own per-cell deltas is not stored;
  // re-derive from the prediction by re-running is expensive, so use worstCells.
}
const byMonth = {}, byYearPrayer = {};
for (const c of misses) {
  const mo = c.date.slice(5, 7);
  byMonth[mo] = (byMonth[mo] || 0) + 1;
}
// ---- f) are the recipe's tables just the 2027 table's own lead and lag? ----
const tbl2027 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/2027.json'), 'utf8'));
const mins = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
const tableVs2027 = [];
for (const [k, r] of Object.entries(tbl2027)) {
  const key = k.slice(5);
  if (recipe.prayers.fajr.table[key] !== mins(r.sunrise) - mins(r.fajr)) tableVs2027.push({ key, col: 'fajr' });
  if (recipe.prayers.isha.table[key] !== mins(r.isha) - mins(r.magrib)) tableVs2027.push({ key, col: 'isha' });
}

const out = {
  mmdd: {
    distinctKeys: byKey.size,
    inconsistentLead,
    inconsistentLag,
    verdict: inconsistentLead.length === 0 && inconsistentLag.length === 0
      ? 'lead and lag are single-valued per MM-DD across all 11 years'
      : 'MM-DD keying refuted',
  },
  doyKeying: {
    cellsCompared: cells,
    mmddExact, doyExact,
    offsetCellsWhereKeysDiffer: doyDiff,
    leapYearPostFebOffsetCells: leapCells, leapMmddExact: leapMmdd, leapDoyExact: leapDoy,
  },
  tableVsTruthMismatches: tableVsTruth,
  recipeTableVs2027Table: { days: Object.keys(tbl2027).length, mismatches: tableVs2027 },
  dst: { checked: dstChecked, mismatches: dstBad.length, sample: dstBad.slice(0, 5), eventMismatches: evBad },
  missCount: misses.length,
  missesByMonth: byMonth,
};
fs.writeFileSync(path.join(OUT, 'stage5-structure.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1));
