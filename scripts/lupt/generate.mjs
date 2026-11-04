// Builds assets/data/london-2026-2076.bin from the cached LUPT workbooks (2027-2076) and the
// captured API year 2026 (ai/features/moonsighting/data/london/lpt-2026.json), so one artifact
// covers 2026-01-01 to 2076-12-31 and a fresh install never needs the retired API.
//
// Self-checks, each fatal on failure: day continuity, the 2027 output equals the banked
// triple-verified lupt-2027.json cell for cell, the interval-table drift count equals the
// recorded 127,838 of 127,841, and the emitted bytes decode back to the source minutes.
// A second run is byte-identical: no timestamp, no map-iteration order in the output.
//
//   node scripts/lupt/generate.mjs [--print-day YYYY-MM-DD]
//
// --print-day reads the COMMITTED artifact (not the cache), for the device step's expected times.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

import { readLupt } from '../../ai/features/global-prayer-times/data/london-migration/xlsx.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const CACHE = path.join(ROOT, 'ai/features/global-prayer-times/data/london-migration/workbooks');
const ARTIFACT = path.join(ROOT, 'assets/data/london-2026-2076.bin');
const BANKED_2027 = path.join(ROOT, 'ai/features/global-prayer-times/data/london-migration/lupt-2027.json');
const LPT_2026 = path.join(ROOT, 'ai/features/moonsighting/data/london/lpt-2026.json');

const FIRST_YEAR = 2026;
const LAST_YEAR = 2076;
const MAGIC = 'LUPT';
const FORMAT_VERSION = 1;
const EPOCH_DAY = 20_454; // days from 1970-01-01 to 2026-01-01
const HEADER_BYTES = 12;
const COLUMNS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];
const NULL_MINUTE = 0xffff;

const fail = (message) => {
  process.stderr.write(`${message}\n`);
  process.exit(1);
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const toMinute = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));
const fmtMinute = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

const epochDayOf = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
};

const expectedDays = (() => {
  const days = [];
  for (let e = epochDayOf(`${FIRST_YEAR}-01-01`); ; e += 1) {
    const iso = new Date(e * 86_400_000).toISOString().slice(0, 10);
    days.push(iso);
    if (iso === `${LAST_YEAR}-12-31`) break;
  }
  return days;
})();

// --- Source 1: the captured API year 2026, six fields, as shipped on the wire ---
const minutes2026 = (() => {
  const payload = JSON.parse(fs.readFileSync(LPT_2026, 'utf8'));
  const out = new Map();
  for (const [date, times] of Object.entries(payload.times)) {
    const row = {};
    for (const field of COLUMNS) {
      const value = times[field];
      if (typeof value !== 'string' || !TIME_PATTERN.test(value))
        fail(`lpt-2026 ${date} ${field} unreadable: ${value}`);
      row[field] = toMinute(value);
    }
    out.set(date, row);
  }
  return out;
})();

// --- Source 2: the fifty workbooks, 24-hour sheet only (the 12-hour sheet is never opened) ---
const workbookYears = {};
for (let year = 2027; year <= LAST_YEAR; year += 1) {
  const file = path.join(CACHE, `LUPT-${year}.xlsx`);
  if (!fs.existsSync(file)) fail(`missing committed workbook ${file}; the corpus is frozen, no downloader ships`);
  const parsed = readLupt(file);
  const days = Object.keys(parsed);
  if (days[0] !== `${year}-01-01` || days.at(-1) !== `${year}-12-31`) {
    fail(`LUPT-${year} spans ${days[0]}..${days.at(-1)}, not the whole year`);
  }
  workbookYears[year] = parsed;
}

// --- Check 1: the fresh 2027 parse equals the banked triple-verified record, cell for cell ---
{
  const banked = JSON.parse(fs.readFileSync(BANKED_2027, 'utf8'));
  const fresh = workbookYears[2027];
  let cells = 0;
  for (const [date, bankedRow] of Object.entries(banked)) {
    const freshRow = fresh[date];
    if (!freshRow) fail(`2027 cross-check: ${date} missing from the fresh workbook parse`);
    for (const field of ['fajr', 'sunrise', 'dhuhr', 'asr', 'asr_2', 'magrib', 'isha']) {
      cells += 1;
      if (freshRow[field] !== bankedRow[field]) {
        fail(`2027 cross-check: ${date} ${field} parsed ${freshRow[field]}, banked ${bankedRow[field]}`);
      }
    }
  }
  if (Object.keys(fresh).length !== Object.keys(banked).length) {
    fail(`2027 cross-check: ${Object.keys(fresh).length} parsed days vs ${Object.keys(banked).length} banked`);
  }
  process.stdout.write(`check-2027-vs-banked ${cells} cells agree\n`);
}

// --- Check 2: continuity and readability of every day, 2026-01-01 to 2076-12-31 ---
const rows = new Map();
for (const date of expectedDays) {
  const year = Number(date.slice(0, 4));
  const row = {};
  if (year === FIRST_YEAR) {
    const source = minutes2026.get(date);
    if (!source) fail(`continuity: ${date} absent from the captured 2026 payload`);
    for (const field of COLUMNS) row[field] = source[field];
  } else {
    const source = workbookYears[year][date];
    if (!source) fail(`continuity: ${date} absent from LUPT-${year}`);
    for (const field of COLUMNS) {
      if (!TIME_PATTERN.test(source[field])) fail(`LUPT-${year} ${date} ${field} unreadable: ${source[field]}`);
      row[field] = toMinute(source[field]);
    }
    for (const field of COLUMNS) {
      if (row[field] < 0 || row[field] > 1439) fail(`LUPT-${year} ${date} ${field} out of range: ${row[field]}`);
    }
  }
  rows.set(date, row);
}
if (epochDayOf(expectedDays[0]) !== EPOCH_DAY) fail(`epoch-day drift: ${epochDayOf(expectedDays[0])} != ${EPOCH_DAY}`);

// --- Check 3: the R13 interval-table drift verifier, seven fields, fifty workbook years ---
{
  const RAD = Math.PI / 180;
  const solar = (jd) => {
    const T = (jd - 2451545) / 36525;
    const r = T / 10;
    const L0 =
      280.4664567 + 360007.6982779 * r + 0.03032028 * r * r + r ** 3 / 49931 - r ** 4 / 15300 - r ** 5 / 2000000;
    const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T - T ** 3 / 24490000;
    const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
    const C =
      (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * RAD) +
      (0.019993 - 0.000101 * T) * Math.sin(2 * M * RAD) +
      0.000289 * Math.sin(3 * M * RAD);
    const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * T) * RAD);
    const eps0 = 23 + 26 / 60 + 21.448 / 3600 - (46.815 * T + 0.00059 * T * T - 0.001813 * T ** 3) / 3600;
    const eps = eps0 + 0.00256 * Math.cos((125.04 - 1934.136 * T) * RAD);
    const dec = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD)) / RAD;
    const y = Math.tan((eps / 2) * RAD) ** 2;
    const E =
      (y * Math.sin(2 * L0 * RAD) -
        2 * e * Math.sin(M * RAD) +
        4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) -
        0.5 * y * y * Math.sin(4 * L0 * RAD) -
        1.25 * e * e * Math.sin(2 * M * RAD)) /
      RAD;
    return { dec, E: E * 4 };
  };
  const jdOf = (iso) => {
    const [Y, M, D] = iso.split('-').map(Number);
    const a = Math.floor((14 - M) / 12);
    const y2 = Y + 4800 - a;
    const m2 = M + 12 * a - 3;
    return (
      D +
      Math.floor((153 * m2 + 2) / 5) +
      365 * y2 +
      Math.floor(y2 / 4) -
      Math.floor(y2 / 100) +
      Math.floor(y2 / 400) -
      32045 -
      0.5
    );
  };
  const offsetCache = new Map();
  const londonOffsetMin = (iso) => {
    if (offsetCache.has(iso)) return offsetCache.get(iso);
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      hour: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(`${iso}T12:00:00Z`));
    const v = (Number(parts.find((p) => p.type === 'hour').value) - 12) * 60;
    offsetCache.set(iso, v);
    return v;
  };
  const sunEvents = (iso, lat = 51.5073, lon = -0.12755) => {
    const { dec, E } = solar(jdOf(iso) + 0.5);
    const noon = 720 - 4 * lon - E + londonOffsetMin(iso);
    const hourAngle = (altDeg) => {
      const c =
        (Math.sin(altDeg * RAD) - Math.sin(lat * RAD) * Math.sin(dec * RAD)) /
        (Math.cos(lat * RAD) * Math.cos(dec * RAD));
      if (c < -1 || c > 1) return null;
      return (Math.acos(c) / RAD) * 4;
    };
    const H = hourAngle(-0.833333);
    const asrAt = (factor) => {
      const h = hourAngle(Math.atan(1 / (factor + Math.tan(Math.abs(lat - dec) * RAD))) / RAD);
      return h === null ? null : noon + h;
    };
    return {
      noon,
      sunrise: H === null ? null : noon - H,
      sunset: H === null ? null : noon + H,
      asr1: asrAt(1),
      asr2: asrAt(2),
    };
  };
  // The measured interval table: Fajr/Isha durations from the publisher's own 2027 year (2028 for 02-29)
  const tableOf = (parsed) => {
    const out = {};
    for (const [date, row] of Object.entries(parsed)) {
      out[date.slice(5)] = {
        fajr: toMinute(row.sunrise) + 3 - toMinute(row.fajr),
        isha: toMinute(row.isha) - (toMinute(row.magrib) - 3),
      };
    }
    return out;
  };
  const table = tableOf(workbookYears[2027]);
  table['02-29'] = tableOf(workbookYears[2028])['02-29'];
  const FIELDS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'asr_2', 'magrib', 'isha'];
  const reconstruct = (iso) => {
    const ev = sunEvents(iso);
    const iv = table[iso.slice(5)];
    if (!iv || ev.sunrise === null) return null;
    const R = (x) => Math.floor(x + 0.5);
    const sunrise = R(ev.sunrise - 3);
    const magrib = R(ev.sunset + 3);
    return {
      sunrise,
      magrib,
      dhuhr: R(ev.noon + 5),
      asr: R(ev.asr1 + 2),
      asr_2: R(ev.asr2 + 2),
      fajr: sunrise + 3 - iv.fajr,
      isha: magrib - 3 + iv.isha,
    };
  };
  const EXPECT_EXACT = 127_838;
  const EXPECT_TOTAL = 127_841;
  let exact = 0;
  let total = 0;
  const misses = [];
  for (let year = 2027; year <= LAST_YEAR; year += 1) {
    for (const date of Object.keys(workbookYears[year]).sort()) {
      const got = reconstruct(date);
      if (!got) fail(`drift verifier: no reconstruction for ${date}`);
      for (const field of FIELDS) {
        total += 1;
        const delta = got[field] - toMinute(workbookYears[year][date][field]);
        if (delta === 0) exact += 1;
        else if (misses.length < 10) misses.push(`${date} ${field} ${delta > 0 ? '+' : ''}${delta}`);
      }
    }
  }
  if (total !== EXPECT_TOTAL) fail(`drift verifier compared ${total} cells, expected ${EXPECT_TOTAL}`);
  if (exact !== EXPECT_EXACT) {
    fail(
      `drift verifier exact count ${exact} != recorded ${EXPECT_EXACT}; the workbooks changed: ${misses.join(', ')}`
    );
  }
  process.stdout.write(`check-drift ${exact}/${total} minute-exact (recorded ${EXPECT_EXACT}/${EXPECT_TOTAL})\n`);
}

// --- Report: Umm al Qura divergence, workbook column L vs the app's own Intl conversion ---
{
  const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
  // The workbook spells months ("Sha'bān") and Intl transliterates them ("Shaʻban"), so the
  // comparison is structural: day, month ordinal walked from the day-wrap, and year - never the name
  let compared = 0;
  let divergent = 0;
  const examples = [];
  for (let year = 2027; year <= LAST_YEAR; year += 1) {
    const buf = fs.readFileSync(path.join(CACHE, `LUPT-${year}.xlsx`));
    // Column L holds shared-string indices; sharedStrings.xml holds the texts. The self-closing
    // K cell before it must be consumed whole or the L cell pairs with K's closing tag
    let eocd = -1;
    for (let i = buf.length - 22; i >= 0; i -= 1) {
      if (buf.readUInt32LE(i) === 0x06054b50) {
        eocd = i;
        break;
      }
    }
    const count = buf.readUInt16LE(eocd + 10);
    let p = buf.readUInt32LE(eocd + 16);
    let sheet = null;
    let stringsXml = null;
    for (let e = 0; e < count; e += 1) {
      const method = buf.readUInt16LE(p + 10);
      const compSize = buf.readUInt32LE(p + 20);
      const nameLen = buf.readUInt16LE(p + 28);
      const extraLen = buf.readUInt16LE(p + 30);
      const commentLen = buf.readUInt16LE(p + 32);
      const localOffset = buf.readUInt32LE(p + 42);
      const name = buf.subarray(p + 46, p + 46 + nameLen).toString('latin1');
      const readMember = () => {
        const lhName = buf.readUInt16LE(localOffset + 26);
        const lhExtra = buf.readUInt16LE(localOffset + 28);
        const start = localOffset + 30 + lhName + lhExtra;
        const raw = buf.subarray(start, start + compSize);
        return (method === 0 ? raw : zlib.inflateRawSync(raw)).toString('utf8');
      };
      if (name === 'xl/worksheets/sheet2.xml') sheet = readMember();
      if (name === 'xl/sharedStrings.xml') stringsXml = readMember();
      p += 46 + nameLen + extraLen + commentLen;
    }
    if (!sheet || !stringsXml) fail(`umalqura report: members missing from LUPT-${year}`);
    const strings = [...stringsXml.matchAll(/<si>(.*?)<\/si>/gs)].map((m) => m[1].replace(/<[^>]+>/g, ''));
    const dayRows = [];
    for (const rm of sheet.matchAll(/<row[^>]*r="(\d+)"[^>]*>(.*?)<\/row>/gs)) {
      const cells = {};
      for (const cm of rm[2].matchAll(/<c[^>]*\/>|<c[^>]*r="([A-Z]+)\d+"([^>]*)>(.*?)<\/c>/gs)) {
        if (!cm[1]) continue;
        if (!/t="s"/.test(cm[2] ?? '')) continue;
        const v = /<v>(.*?)<\/v>/s.exec(cm[3] ?? '');
        if (v) cells[cm[1]] = strings[Number(v[1])];
      }
      if (!cells.L) continue;
      const match = /^(\d{1,2}) (.+) (\d{4})$/.exec(cells.L);
      const serialMatch = /<c r="B\d+"[^>]*><v>(\d+)<\/v>/.exec(rm[2]);
      if (!match || !serialMatch) continue;
      const date = new Date(Date.UTC(1899, 11, 30) + Number(serialMatch[1]) * 86_400_000).toISOString().slice(0, 10);
      dayRows.push({ date, day: Number(match[1]), islamicYear: Number(match[3]) });
    }
    // The year's first row is mid-month, so the ordinal walk is anchored to Intl's own month for
    // the corpus's first day; every later day is then checked against the walk, so a single day
    // flip anywhere after 2027-01-01 shows up as a divergence
    let ordinal = null;
    for (let i = 0; i < dayRows.length; i += 1) {
      const parts = fmt.formatToParts(new Date(`${dayRows[i].date}T12:00:00Z`));
      const own = {
        day: Number(parts.find((x) => x.type === 'day').value),
        month: Number(parts.find((x) => x.type === 'month').value),
        year: Number(parts.find((x) => x.type === 'year').value),
      };
      if (ordinal === null) ordinal = own.month;
      else if (dayRows[i].islamicYear > dayRows[i - 1].islamicYear) ordinal = 1;
      else if (dayRows[i].day <= dayRows[i - 1].day) ordinal += 1;
      compared += 1;
      if (own.day !== dayRows[i].day || own.month !== ordinal || own.year !== dayRows[i].islamicYear) {
        divergent += 1;
        if (examples.length < 5) {
          examples.push(
            `${dayRows[i].date}: workbook ${dayRows[i].islamicYear}-${ordinal}-${dayRows[i].day} intl ${own.year}-${own.month}-${own.day}`
          );
        }
      }
    }
  }
  process.stdout.write(
    `report-umalqura ${divergent} of ${compared} days diverge from Intl umalqura` +
      (examples.length > 0 ? `; first ${examples.join('; ')}` : '') +
      '\n'
  );
}

// --- Emit ---
{
  const buffer = Buffer.alloc(HEADER_BYTES + rows.size * COLUMNS.length * 2);
  buffer.write(MAGIC, 0, 'ascii');
  buffer.writeUInt16LE(FORMAT_VERSION, 4);
  buffer.writeUInt16LE(EPOCH_DAY, 6);
  buffer.writeUInt16LE(rows.size, 8);
  buffer.writeUInt16LE(COLUMNS.length, 10);
  let offset = HEADER_BYTES;
  for (const date of expectedDays) {
    const row = rows.get(date);
    for (const field of COLUMNS) {
      buffer.writeUInt16LE(row[field] ?? NULL_MINUTE, offset);
      offset += 2;
    }
  }
  fs.mkdirSync(path.dirname(ARTIFACT), { recursive: true });
  fs.writeFileSync(ARTIFACT, buffer);

  // Round-trip: decode the emitted bytes back and compare with the source minutes
  const readBack = fs.readFileSync(ARTIFACT);
  if (readBack.length !== buffer.length) fail('round-trip length mismatch');
  let checked = 0;
  expectedDays.forEach((date, index) => {
    for (let c = 0; c < COLUMNS.length; c += 1) {
      const minute = readBack.readUInt16LE(HEADER_BYTES + (index * COLUMNS.length + c) * 2);
      if (minute !== rows.get(date)[COLUMNS[c]]) fail(`round-trip mismatch at ${date} ${COLUMNS[c]}`);
      checked += 1;
    }
  });
  const gzip = zlib.gzipSync(buffer).length;
  const brotli = zlib.brotliCompressSync(buffer).length;
  const sha256 = createHash('sha256').update(buffer).digest('hex');
  process.stdout.write(
    `artifact ${buffer.length} bytes, gzip ${gzip}, brotli ${brotli}, sha256 ${sha256}, ${rows.size} days ${expectedDays[0]}..${expectedDays.at(-1)}\n`
  );
  process.stdout.write(`check-continuity ${rows.size} days whole, check-round-trip ${checked} cells decode equal\n`);
}

// --- --print-day: decode from the committed artifact, for device-step evidence ---
{
  const argIndex = process.argv.indexOf('--print-day');
  if (argIndex === -1) process.exit(0);
  const date = process.argv[argIndex + 1];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) fail('--print-day wants YYYY-MM-DD');
  const buffer = fs.readFileSync(ARTIFACT);
  if (buffer.toString('ascii', 0, 4) !== MAGIC) fail('artifact magic mismatch');
  const epochDay = buffer.readUInt16LE(6);
  const dayCount = buffer.readUInt16LE(8);
  const cols = buffer.readUInt16LE(10);
  const index = epochDayOf(date) - epochDay;
  if (index < 0 || index >= dayCount) fail(`${date} outside the artifact`);
  const times = {};
  for (let c = 0; c < cols; c += 1) {
    const minute = buffer.readUInt16LE(HEADER_BYTES + (index * cols + c) * 2);
    times[COLUMNS[c]] = minute === NULL_MINUTE ? null : fmtMinute(minute);
  }
  process.stdout.write(`${JSON.stringify({ date, ...times })}\n`);
}
