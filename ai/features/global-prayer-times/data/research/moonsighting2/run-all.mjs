// Run the whole registry: one TZ-correct child per surface, results assembled
// into data/band-scores.json. Deterministic: same inputs, same bytes.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const here = new URL('.', import.meta.url).pathname;
const reg = JSON.parse(fs.readFileSync(here + 'surfaces.json', 'utf8'));
fs.mkdirSync(here + 'data', { recursive: true });
const out = { generatedBy: 'run-all.mjs (TZ=<zone> node mc-score.mjs <id> per surface)', surfaces: [] };
const ids = process.argv[2] ? [process.argv[2]] : reg.surfaces.map((s) => s.id);
for (const id of ids) {
  const cfg = reg.surfaces.find((s) => s.id === id);
  const r = spawnSync('node', [here + 'mc-score.mjs', id], {
    env: { ...process.env, TZ: cfg.tz }, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0) {
    console.error(`FAIL ${id}: ${r.stderr}`);
    process.exit(1);
  }
  out.surfaces.push(JSON.parse(r.stdout));
  console.error(`ok ${id}: fajr mean ${JSON.parse(r.stdout).fajr.mean} / isha mean ${JSON.parse(r.stdout).isha.mean}`);
}
if (ids.length === 1) {
  fs.writeFileSync(here + 'data/one.json', JSON.stringify(out.surfaces[0], null, 1) + '\n');
} else {
  fs.writeFileSync(here + 'data/band-scores.json', JSON.stringify(out, null, 1) + '\n');
}
console.error(`wrote ${ids.length === 1 ? 'data/one.json' : 'data/band-scores.json'}`);
