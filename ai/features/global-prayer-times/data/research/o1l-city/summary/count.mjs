import { readdir, readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const ROOT = process.env.HOME + '/athan-gitree/census/o1l-city';
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const PRAYER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'magrib', 'isha', 'imsak', 'iftar'];

async function walk(dir, out = []) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else out.push(p);
  }
  return out;
}

function scan(node, keys, rowObjects) {
  if (Array.isArray(node)) {
    for (const item of node) scan(item, keys, rowObjects);
    return;
  }
  if (!node || typeof node !== 'object') return;
  for (const [k, v] of Object.entries(node)) {
    if (DATE.test(k)) {
      keys.add(k);
      if (v && typeof v === 'object' && PRAYER.some(p => p in v)) rowObjects.add(k + '|' + JSON.stringify(v));
      scan(v, keys, rowObjects);
    } else if (k === 'date' && typeof v === 'string' && DATE.test(v)) {
      keys.add(v);
      if (PRAYER.some(p => p in node)) rowObjects.add(v + '|' + JSON.stringify(node));
      scan(v, keys, rowObjects);
    } else {
      scan(v, keys, rowObjects);
    }
  }
}

const workspaces = (await readdir(ROOT, { withFileTypes: true }))
  .filter(e => e.isDirectory() && e.name !== 'summary')
  .map(e => e.name);

const per = [];
let sumKeys = 0, sumRows = 0, files = 0, parseFail = 0, bytes = 0, withData = 0;

for (const ws of workspaces) {
  const all = await walk(join(ROOT, ws));
  const dataFiles = all.filter(f => f.includes('/data/') && extname(f) === '.json');
  let wsKeys = 0, wsRows = 0;
  for (const f of dataFiles) {
    files++;
    try {
      bytes += (await stat(f)).size;
      const keys = new Set(), rows = new Set();
      scan(JSON.parse(await readFile(f, 'utf8')), keys, rows);
      wsKeys += keys.size;
      wsRows += rows.size;
    } catch { parseFail++; }
  }
  if (dataFiles.length) withData++;
  if (wsKeys) per.push({ ws, files: dataFiles.length, keys: wsKeys, rows: wsRows });
  sumKeys += wsKeys;
  sumRows += wsRows;
}

per.sort((a, b) => b.keys - a.keys);
console.log(JSON.stringify({
  workspaces: workspaces.length,
  workspacesWithData: withData,
  dataFiles: files,
  parseFail,
  dataBytes: bytes,
  datedKeysSummedPerFile: sumKeys,
  prayerRowObjectsSummedPerFile: sumRows,
  top: per.slice(0, 12),
}, null, 2));
