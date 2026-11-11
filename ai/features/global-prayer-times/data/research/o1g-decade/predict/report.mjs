// Renders the results.json tables as markdown, so DECADE-REPORT.md carries no
// hand-typed number. Run: TZ=Europe/London node report.mjs > tables.md
import fs from 'fs';

const HERE = new URL('./', import.meta.url).pathname;
const R = JSON.parse(fs.readFileSync(HERE + 'results.json', 'utf8'));
const P = R.prayers;
const YEARS = R.generatedFor.years;
const pc = (x) => `${x.toFixed(2)}%`;

const out = [];
const push = (s = '') => out.push(s);

push('| arm | exact | within 1 min | worst | mean absolute error |');
push('|---|---|---|---|---|');
push(`| recipe | ${R.recipe.overall.exact.toLocaleString('en-GB')}/${R.recipe.overall.days.toLocaleString('en-GB')} (${pc(R.recipe.overall.exactPct)}) | ${R.recipe.overall.within1.toLocaleString('en-GB')}/${R.recipe.overall.days.toLocaleString('en-GB')} (${pc(R.recipe.overall.within1Pct)}) | ${R.recipe.overall.worst} min | ${R.recipe.overall.mae.toFixed(4)} min |`);
push(`| naive replay | ${R.naive.overall.exact.toLocaleString('en-GB')}/${R.naive.overall.days.toLocaleString('en-GB')} (${pc(R.naive.overall.exactPct)}) | ${R.naive.overall.within1.toLocaleString('en-GB')}/${R.naive.overall.days.toLocaleString('en-GB')} (${pc(R.naive.overall.within1Pct)}) | ${R.naive.overall.worst} min | ${R.naive.overall.mae.toFixed(4)} min |`);
push();

push('### Recipe arm: per year, all six prayers');
push();
push('| year | days | exact | within 1 | worst | MAE |');
push('|---|---|---|---|---|---|');
for (const y of YEARS) {
  const o = R.recipe.perYear[y].overall;
  push(`| ${y} | ${R.recipe.perYear[y].days} | ${pc(o.exactPct)} | ${pc(o.within1Pct)} | ${o.worst} | ${o.mae.toFixed(4)} |`);
}
const oAll = R.recipe.overall;
push(`| **2028-2038** | **${oAll.days / P.length}** | **${pc(oAll.exactPct)}** | **${pc(oAll.within1Pct)}** | **${oAll.worst}** | **${oAll.mae.toFixed(4)}** |`);
push();

push('### Recipe arm: exact percent, year against prayer');
push();
push(`| year | ${P.join(' | ')} |`);
push(`|---|${P.map(() => '---').join('|')}|`);
for (const y of YEARS) {
  const r = R.recipe.perYear[y].perPrayer;
  push(`| ${y} | ${P.map((p) => pc(r[p].exactPct)).join(' | ')} |`);
}
{
  const o = R.recipe.perPrayerOverall;
  push(`| **all** | ${P.map((p) => `**${pc(o[p].exactPct)}**`).join(' | ')} |`);
}
push();

push('### Recipe arm: mean absolute error in minutes, year against prayer');
push();
push(`| year | ${P.join(' | ')} |`);
push(`|---|${P.map(() => '---').join('|')}|`);
for (const y of YEARS) {
  const r = R.recipe.perYear[y].perPrayer;
  push(`| ${y} | ${P.map((p) => r[p].mae.toFixed(4)).join(' | ')} |`);
}
push(`| **all** | ${P.map((p) => `**${R.recipe.perPrayerOverall[p].mae.toFixed(4)}**`).join(' | ')} |`);
push();

push('### Recipe arm: per prayer over all 4,018 days');
push();
push('| prayer | exact | within 1 | worst | MAE | 1-min flips | >=2 min |');
push('|---|---|---|---|---|---|---|');
for (const p of P) {
  const r = R.recipe.perPrayerOverall[p];
  push(`| ${p} | ${r.exact}/${r.days} (${pc(r.exactPct)}) | ${r.within1}/${r.days} (${pc(r.within1Pct)}) | ${r.worst} | ${r.mae.toFixed(4)} | ${r.err1} | ${r.err2plus} |`);
}
push(`| **all** | **${oAll.exact}/${oAll.days} (${pc(oAll.exactPct)})** | **${oAll.within1}/${oAll.days} (${pc(oAll.within1Pct)})** | **${oAll.worst}** | **${oAll.mae.toFixed(4)}** | **${R.missAnatomy.recipe.err1Count}** | **${R.missAnatomy.recipe.err2plusCount}** |`);
push();

push('### Naive arm: per year, all six prayers');
push();
push('| year | exact | within 1 | worst | MAE | worst, DST-aligned | exact, DST-aligned | MAE, DST-aligned |');
push('|---|---|---|---|---|---|---|---|');
for (const y of YEARS) {
  const o = R.naive.perYear[y].overall;
  const a = R.naiveDstAligned.perYear[y].overall;
  push(`| ${y} | ${pc(o.exactPct)} | ${pc(o.within1Pct)} | ${o.worst} | ${o.mae.toFixed(4)} | ${a.worst} | ${pc(a.exactPct)} | ${a.mae.toFixed(4)} |`);
}
const nAll = R.naive.overall;
const aAll = R.naiveDstAligned.overall;
push(`| **2028-2038** | **${pc(nAll.exactPct)}** | **${pc(nAll.within1Pct)}** | **${nAll.worst}** | **${nAll.mae.toFixed(4)}** | **${aAll.worst}** | **${pc(aAll.exactPct)}** | **${aAll.mae.toFixed(4)}** |`);
push();

push('### Naive arm: per prayer over all 4,018 days');
push();
push('| prayer | exact | within 1 | worst | MAE | rows >=2 min | worst, DST-aligned |');
push('|---|---|---|---|---|---|---|');
for (const p of P) {
  const r = R.naive.perPrayerOverall[p];
  const a = R.naiveDstAligned.perPrayerOverall[p];
  push(`| ${p} | ${r.exact}/${r.days} (${pc(r.exactPct)}) | ${r.within1}/${r.days} (${pc(r.within1Pct)}) | ${r.worst} | ${r.mae.toFixed(4)} | ${r.err2plus} | ${a.worst} |`);
}
push();

const matchLabel = (matches) => {
  const s = new Set(matches);
  if (s.size === 4) return 'all four';
  if (s.has('meanHalfUp') && s.has('meanFloor')) return 'mean, truncated mean';
  if (s.has('meanHalfUp')) return 'mean';
  if (s.has('meanFloor')) return 'truncated mean';
  if (s.has('prev')) return '02-28';
  if (s.has('next')) return '03-01';
  return matches.join(', ');
};

push('### 02-29: truth against the candidate fills');
push();
push('| leap day | prayer | 02-28 | 03-01 | truth | rounded mean | truth matches | recipe | recipe err |');
push('|---|---|---|---|---|---|---|---|---|');
for (const y of [2028, 2032, 2036]) {
  for (const p of P) {
    const r = R.leapDay.perYear[y][p];
    push(`| ${y}-02-29 | ${p} | ${r.prev} | ${r.next} | ${r.truth} | ${r.meanRounded} | ${matchLabel(r.matches)} | ${r.recipe} | ${r.recipeErr} |`);
  }
}
push();

push('### 02-29: the three leap days rescored under each offset fill');
push();
push('| 02-29 offset fill | exact | within 1 | worst |');
push('|---|---|---|---|');
const fillLabel = { recipeMean: 'shipped (half-up mean)', prev: '02-28 entry', next: '03-01 entry' };
for (const [rule, s] of Object.entries(R.leapDay.variantScores)) {
  push(`| ${fillLabel[rule] || rule} | ${s.exact}/${s.total} | ${s.within1}/${s.total} | ${s.worst} |`);
}
push();

push('### Keying: MM-DD against day-of-year, leap years');
push();
push('| year | keying | fajr exact | fajr worst | fajr MAE | isha exact | isha worst | isha MAE |');
push('|---|---|---|---|---|---|---|---|');
for (const y of [2028, 2032, 2036]) {
  for (const arm of ['mmdd', 'doy']) {
    const r = R.keying.perYear[y][arm];
    push(`| ${y} | ${arm === 'mmdd' ? 'MM-DD' : 'day-of-year'} | ${pc(r.fajr.exactPct)} | ${r.fajr.worst} | ${r.fajr.mae.toFixed(4)} | ${pc(r.isha.exactPct)} | ${r.isha.worst} | ${r.isha.mae.toFixed(4)} |`);
  }
}
push();
push('| year | days where the keyings differ | rows truth separates | MM-DD closer | day-of-year closer | MM-DD exact, DOY not | DOY exact, MM-DD not | verdict |');
push('|---|---|---|---|---|---|---|---|');
for (const y of [2028, 2032, 2036]) {
  const k = R.keying.perYear[y];
  const t = k.disagreementTally;
  push(`| ${y} | ${k.differingDays} | ${k.disagreements.length} | ${t.mmddCloser} | ${t.doyCloser} | ${t.mmddExactDoyNot} | ${t.doyExactMmddNot} | ${k.verdict === 'mmdd' ? 'MM-DD' : 'day-of-year'} |`);
}
push();

push('### Trend: recipe error against distance from 2027');
push();
push('| prayer | 2028 exact | 2028 MAE | 2038 exact | 2038 MAE | delta MAE | slope (min/year) |');
push('|---|---|---|---|---|---|---|');
for (const p of P) {
  const t = R.trend[p];
  push(`| ${p} | ${pc(t[2028].exactPct)} | ${t[2028].mae.toFixed(4)} | ${pc(t[2038].exactPct)} | ${t[2038].mae.toFixed(4)} | ${t.deltaMae > 0 ? '+' : ''}${t.deltaMae.toFixed(4)} | ${R.trend.overall.slopeMinutesPerYear[p].toFixed(6)} |`);
}
push(`| **all** | **${pc(R.recipe.perYear[2028].overall.exactPct)}** | **${R.recipe.perYear[2028].overall.mae.toFixed(4)}** | **${pc(R.recipe.perYear[2038].overall.exactPct)}** | **${R.recipe.perYear[2038].overall.mae.toFixed(4)}** | **${(R.recipe.perYear[2038].overall.mae - R.recipe.perYear[2028].overall.mae).toFixed(4)}** | **${R.trend.overall.slopeMinutesPerYear.overall.toFixed(6)}** |`);
push();

push('### Where the recipe misses sit: one-minute flips by month, all years');
push();
push('| month | 1-min flips | >=2 min |');
push('|---|---|---|');
for (const mth of ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']) {
  const b = R.missAnatomy.recipe.byMonth[mth];
  push(`| ${mth} | ${b.err1} | ${b.err2plus} |`);
}
push();

push('### Naive arm: size of the misses');
push();
const nb = R.missAnatomy.naive.buckets;
push('| error | rows |');
push('|---|---|');
push(`| 1 minute | ${R.missAnatomy.naive.err1Count} |`);
push(`| 2 minutes | ${nb.two} |`);
push(`| 3-5 minutes | ${nb.threeTo5} |`);
push(`| 6-30 minutes | ${nb.sixTo30} |`);
push(`| more than 30 minutes | ${nb.over30} |`);
push();

console.log(out.join('\n'));
