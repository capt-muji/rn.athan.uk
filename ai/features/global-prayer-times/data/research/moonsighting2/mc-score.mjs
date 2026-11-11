// Score one registry surface against naked MoonsightingCommittee.
// Usage: TZ=<surface zone> node mc-score.mjs <surface-id> [--days]
// The runner (run-all.mjs) sets TZ per surface; this file never reads the
// clock and never tunes the method.
import fs from 'node:fs';
import { scoreSurface } from './lib.mjs';

const reg = JSON.parse(fs.readFileSync(new URL('./surfaces.json', import.meta.url), 'utf8'));
const id = process.argv[2];
const cfg = reg.surfaces.find((s) => s.id === id);
if (!cfg) {
  console.error('unknown surface ' + id);
  process.exit(2);
}
if (cfg.tz !== process.env.TZ) {
  console.error(`TZ mismatch: surface ${id} wants ${cfg.tz}, got ${process.env.TZ}`);
  process.exit(2);
}
const { scored, days } = await scoreSurface(cfg);
if (process.argv.includes('--days')) {
  scored._days = days.map((d) => ({
    key: d.key, fajr: d.fajr, isha: d.isha, mcFajr: d.mcFajr, mcIsha: d.mcIsha,
    dev_fajr: d.dev_fajr, dev_isha: d.dev_isha, synthetic: d.synthetic || undefined,
  }));
}
process.stdout.write(JSON.stringify(scored));
