import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
const ROOT = process.env.HOME + '/athan-gitree/census/o1l-city';
const DATE = /^\d{4}-\d{2}-\d{2}$/;
async function walk(dir, out = []) {
  let es; try { es = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of es) { const p = join(dir, e.name); if (e.isDirectory()) await walk(p, out); else out.push(p); }
  return out;
}
function scan(n, keys) {
  if (Array.isArray(n)) { for (const i of n) scan(i, keys); return; }
  if (!n || typeof n !== 'object') return;
  for (const [k, v] of Object.entries(n)) {
    if (DATE.test(k)) { keys.add(k); scan(v, keys); }
    else if (k === 'date' && typeof v === 'string' && DATE.test(v)) { keys.add(v); scan(v, keys); }
    else scan(v, keys);
  }
}
const wss = (await readdir(ROOT, { withFileTypes: true })).filter(e => e.isDirectory() && e.name !== 'summary').map(e => e.name);
let dated = 0, monthPlus = 0, yearPlus = 0, empty = 0, total = 0;
for (const ws of wss) {
  const files = (await walk(join(ROOT, ws))).filter(f => f.includes('/data/') && extname(f) === '.json');
  for (const f of files) {
    total++;
    try {
      const keys = new Set();
      scan(JSON.parse(await readFile(f, 'utf8')), keys);
      if (keys.size === 0) empty++;
      else { dated++; if (keys.size >= 28) monthPlus++; if (keys.size >= 300) yearPlus++; }
    } catch { empty++; }
  }
}
console.log(JSON.stringify({ totalDataFiles: total, withDatedKeys: dated, monthPlus, yearPlus, noDatedKeys: empty }, null, 2));
