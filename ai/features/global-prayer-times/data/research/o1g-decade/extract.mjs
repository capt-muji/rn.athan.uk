import { readFileSync, writeFileSync } from 'node:fs';
const BIN = '$HOME/repos/rn.athan.uk/assets/data/london-2026-2076.bin';
const bytes = readFileSync(BIN);
if (String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) !== 'LUPT') throw new Error('bad magic');
const epochDay = bytes[6] + bytes[7] * 0x100, dayCount = bytes[8] + bytes[9] * 0x100, columns = bytes[10] + bytes[11] * 0x100;
if (epochDay !== 20454 || dayCount !== 18628 || columns !== 6 || bytes.length !== 12 + dayCount * 12) throw new Error('bad header');
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];
const mm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const readDay = (date) => {
  const idx = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86400000) - epochDay;
  const rt = new Date((idx + epochDay) * 86400000).toISOString().slice(0, 10);
  if (rt !== date) throw new Error(`rolled ${date}`);
  const out = {};
  for (let c = 0; c < 6; c++) {
    const v = bytes[12 + idx * 12 + c * 2] + bytes[12 + idx * 12 + c * 2 + 1] * 0x100;
    out[COLS[c]] = v === 0xffff ? null : mm(v);
  }
  return out;
};
const dump = (y1, y2) => {
  const obj = {}; let n = 0; const t = Date.UTC(y1, 0, 1); const end = Date.UTC(y2 + 1, 0, 1);
  for (let ms = t; ms < end; ms += 86400000) {
    const s = new Date(ms).toISOString().slice(0, 10);
    obj[s] = { date: s, ...readDay(s) }; n++;
  }
  return [obj, n];
};
const HOME = process.env.HOME;
const [y2027, n27] = dump(2027, 2027);
const [truth, nT] = dump(2028, 2038);
writeFileSync(`${HOME}/athan-gitree/census/o1g-decade/data/2027.json`, JSON.stringify(y2027, null, 1));
writeFileSync(`${HOME}/athan-gitree/census/o1g-decade/truth/truth-2028-2038.json`, JSON.stringify(truth, null, 1));
const repo27 = JSON.parse(readFileSync('$HOME/repos/rn.athan.uk/ai/features/global-prayer-times/data/london-migration/lupt-2027.json', 'utf8'));
let diff = 0;
for (const [d, row] of Object.entries(y2027)) for (const c of COLS) if (repo27[d][c] !== row[c]) diff++;
const leaps = [2028, 2032, 2036].filter(y => y in truth).map(y => `${y}-02-29`);
console.log(JSON.stringify({ days2027: n27, daysTruth: nT, expectedTruth: 365 * 11 + 3, mismatchVsRepo2027: diff, feb29Present: leaps.map(d => truth[d] ? d : `MISSING ${d}`) }, null, 1));
