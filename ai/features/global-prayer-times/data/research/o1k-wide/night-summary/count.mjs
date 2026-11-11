import {readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';

const root = process.cwd().endsWith('night-summary')
  ? join(process.cwd(), '..')
  : process.cwd();
const isDate = k => /^\d{4}-\d{2}-\d{2}$/.test(k);

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir, {withFileTypes: true}); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.json')) out.push(p);
  }
  return out;
}

function dateKeys(o, acc) {
  if (Array.isArray(o)) { for (const v of o) dateKeys(v, acc); return; }
  if (!o || typeof o !== 'object') return;
  for (const [k, v] of Object.entries(o)) {
    if (isDate(k)) acc.add(k);
    else if (v && typeof v === 'object') dateKeys(v, acc);
  }
}

let total = 0;
for (const dir of readdirSync(root, {withFileTypes: true})) {
  if (!dir.isDirectory() || dir.name === 'night-summary') continue;
  let rows = 0;
  let files = 0;
  for (const f of walk(join(root, dir.name, 'data'))) {
    let o;
    try { o = JSON.parse(readFileSync(f, 'utf8')); } catch { continue; }
    const acc = new Set();
    dateKeys(o, acc);
    if (!acc.size) continue;
    rows += acc.size;
    files++;
  }
  if (rows) console.log(`${dir.name}\t${files} files\t${rows} rows`);
  total += rows;
}
console.log(`total\t${total} dated rows`);
