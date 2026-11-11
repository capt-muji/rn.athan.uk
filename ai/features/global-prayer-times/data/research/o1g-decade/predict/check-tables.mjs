// Confirms every table row in DECADE-REPORT.md is byte-identical to the row that
// report.mjs generated from results.json, so no figure was retyped.
import fs from 'fs';

const HERE = new URL('./', import.meta.url).pathname;
const pipeLines = (md) => md.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('|'));

const tally = (lines) => {
  const m = new Map();
  for (const l of lines) m.set(l, (m.get(l) || 0) + 1);
  return m;
};

const report = tally(pipeLines(fs.readFileSync(HERE + 'DECADE-REPORT.md', 'utf8')));
const generated = tally(pipeLines(fs.readFileSync(HERE + 'tables.md', 'utf8')));

let missing = 0, extra = 0;
for (const [line, n] of report) {
  const g = generated.get(line) || 0;
  if (g !== n) { missing++; console.log('NOT IN tables.md:', line); }
}
for (const [line, n] of generated) {
  const r = report.get(line) || 0;
  if (r !== n) { extra++; console.log('NOT IN DECADE-REPORT.md:', line); }
}
const total = [...report.values()].reduce((a, b) => a + b, 0);
console.log({ reportRows: total, generatedRows: [...generated.values()].reduce((a, b) => a + b, 0), missing, extra });
process.exit(missing || extra ? 1 : 0);
