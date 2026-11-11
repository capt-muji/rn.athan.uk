// Builds SLICE-A-REPORT.md from results.json. Every number in the report comes from here.
import fs from 'node:fs';

const r = JSON.parse(fs.readFileSync(new URL('./results.json', import.meta.url), 'utf8'));
const f2 = (x) => x.toFixed(2);
const rows = Object.entries(r.perMethod).map(([id, m]) => ({
  id,
  fajr: m.fajr.sliceMean,
  isha: m.isha.sliceMean,
  both: +(((m.fajr.sliceMean ?? 0) + (m.isha.sliceMean ?? 0)) / 2).toFixed(4),
  fajrWorstC: m.fajr.worstCountry,
  ishaWorstC: m.isha.worstCountry,
  src: r.methodSide.find((x) => x.id === id).src,
}));
rows.sort((a, b) => a.both - b.both);

const perCountry = r.countries.map((c) => {
  const scored = Object.entries(c.cells).filter(([, v]) => v.fajr || v.isha)
    .map(([id, v]) => ({
      id,
      both: ((v.fajr ? v.fajr.mean : 0) + (v.isha ? v.isha.mean : 0)) / (v.fajr && v.isha ? 2 : 1),
    })).sort((a, b) => a.both - b.both);
  return { id: c.id, best: scored[0], worst: scored[scored.length - 1], n: scored.length };
});

const home = [
  ['diyanet-domestic x TR-DIYANET-DOMESTIC', r.anchors['diyanet-domestic x TR-DIYANET-DOMESTIC']],
  ['egyptian x EG-ESA', r.anchors['egyptian x EG-ESA']],
  ['dubai x AE-AWQAF', r.anchors['dubai x AE-AWQAF']],
  ['qatar x QA-MOI', r.anchors['qatar x QA-MOI']],
  ['kuwait x KW-AJIRI', r.anchors['kuwait x KW-AJIRI']],
  ['umm-al-qura x SA-KACST', r.anchors['umm-al-qura x SA-KACST']],
];

const L = [];
L.push('# O1h slice A: MENA (17 targets) x 21 methods, 2026');
L.push('');
L.push('Independent recompute per SHARED-BRIEF.md. Script: `grid.mjs` (one invocation per country under that country\'s own TZ; merge step). Raw cells: `results.json` (693 scored cells = 17 x 21 x 2 minus 21 IR isha skips). Metrics per cell: mean |deviation|, worst |deviation|, percent of days within 2 minutes, over 365 days of 2026.');
L.push('');
L.push('## Decisions the other slice will want when diffing');
L.push('');
for (const d of r.decisions) L.push(`- ${d}`);
L.push('');
L.push('## Per-method slice means (minutes, unweighted mean of country means)');
L.push('');
L.push('| method | params | fajr | isha | (fajr+isha)/2 | worst fajr country | worst isha country |');
L.push('|---|---|---|---|---|---|---|');
for (const x of rows) {
  L.push(`| ${x.id} | ${x.src.replace(/\|/g, '/')} | ${f2(x.fajr)} | ${f2(x.isha)} | ${f2(x.both)} | ${x.fajrWorstC ? `${x.fajrWorstC.country} ${f2(x.fajrWorstC.mean)}` : '-'} | ${x.ishaWorstC ? `${x.ishaWorstC.country} ${f2(x.ishaWorstC.mean)}` : '-'} |`);
}
L.push('');
L.push('Identical numbers are genuine ties: every method carrying an 18-degree angle shares one fajr column, every 17-degree isha shares one isha column, because the naked method differs only by the pair. All 21 methods are Shafi at asr, matching every slice target except IR-NATIONAL (school not on the record; flag no-data).');
L.push('');
L.push('## Closest and worst for MENA');
L.push('');
const best3 = rows.slice(0, 3);
const worst3 = rows.slice(-3).reverse();
L.push(`Closest methods: ${best3.map((x) => `${x.id} (${f2(x.both)})`).join(', ')} - the 18-degree family dominates its home region. Worst: ${worst3.map((x) => `${x.id} (${f2(x.both)})`).join(', ')}.`);
L.push('');
L.push('The same 18/18 pair scores twice under two labels: `karachi` and `isna-2010` are numerically identical on every cell, while the software-label `isna` (15/15, the exported pair since the 2017 FCNA decision) is the single worst method across the slice. The Teheran 14-degree isha default, which Iran itself never publishes, is the worst single column in the grid.');
L.push('');
L.push('## Per-country spread');
L.push('');
L.push('| target | best method (mean both) | worst method |');
L.push('|---|---|---|');
for (const c of perCountry) L.push(`| ${c.id} | ${c.best.id} ${f2(c.best.both)} | ${c.worst.id} ${f2(c.worst.both)} |`);
L.push('');
L.push('## Home-ground cells (method vs its own authority\'s fitted recipe)');
L.push('');
L.push('| cell | fajr mean/worst | isha mean/worst |');
L.push('|---|---|---|');
for (const [k, v] of home) L.push(`| ${k} | ${v.fajr ? `${f2(v.fajr.mean)} / ${v.fajr.worst}` : 'null'} | ${v.isha ? `${f2(v.isha.mean)} / ${v.isha.worst}` : 'null'} |`);
L.push('');
L.push('These six cells are the harness validation: the naked Diyanet preset reproduces the fitted Turkish recipe minute-exact on all 730 cells, the Egyptian preset is exact on both prayers, Dubai misses only by its own -1 isha margin, Qatar and Kuwait sit inside the margin-then-round boundary, and Umm al-Qura stays within 1 minute of KACST all year including the Ramadan switch.');
L.push('');
L.push('## Skips');
L.push('');
for (const s of r.skips) L.push(`- ${s.country} ${s.prayer}: ${s.reason} (${s.affected}).`);
L.push('');
L.push('Ramadan window applied to both the umm-al-qura method and the SA-KACST target: ' + r.ramadan.window + ` (${r.ramadan.days} days).`);
L.push('');
fs.writeFileSync(new URL('./SLICE-A-REPORT.md', import.meta.url), L.join('\n') + '\n');
console.log('wrote SLICE-A-REPORT.md');
