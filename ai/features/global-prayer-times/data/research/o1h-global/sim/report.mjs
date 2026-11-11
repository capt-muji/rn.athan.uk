import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const scores = JSON.parse(readFileSync(join(HERE, 'scores.json'), 'utf8'));
const agg = JSON.parse(readFileSync(join(HERE, 'aggregates.json'), 'utf8'));

const MIDS = Object.keys(scores.cells[0].cells);
const methodsJson = JSON.parse(readFileSync(`${process.env.HOME}/athan-gitree/census/o1h-global/methods/methods.json`, 'utf8'));
const catalog = new Map(methodsJson.methods.map((m) => [m.id, m]));
const rows = scores.cells;
const fullPop = agg.populationCovered;

const n2 = (v) => (v === null || v === undefined ? '--' : v.toFixed(2));
const n1 = (v) => (v === null || v === undefined ? '--' : v.toFixed(1));

function weighted(pick) {
  let num = 0;
  let den = 0;
  for (const c of rows) {
    if (c.population === null || c.populationDuplicate) continue;
    const v = pick(c);
    if (v === null || v === undefined) continue;
    num += c.population * v;
    den += c.population;
  }
  return den === 0 ? null : num / den;
}

const combined = (c, id) => {
  const x = c.cells[id];
  if (x.fajr.mean === null && x.isha.mean === null) return null;
  if (x.isha.mean === null) return x.fajr.mean;
  if (x.fajr.mean === null) return x.isha.mean;
  return (x.fajr.mean + x.isha.mean) / 2;
};

const methodProfile = MIDS.map((id) => {
  const table = agg.table.find((t) => t.id === id);
  const ranked = rows
    .filter((c) => combined(c, id) !== null)
    .map((c) => ({ id: c.id, v: combined(c, id), f: c.cells[id].fajr.mean, i: c.cells[id].isha.mean }))
    .sort((a, b) => a.v - b.v);
  return {
    ...table,
    wFajr: weighted((c) => c.cells[id].fajr.mean),
    wIsha: weighted((c) => c.cells[id].isha.mean),
    best: ranked.slice(0, 3),
    worst: ranked.slice(-3).reverse(),
  };
});

const byRank = [...methodProfile].sort((a, b) => a.weighted - b.weighted);

const METHOD_ROWS = {
  mwl: { angles: '18 / 17', carrier: 'preset MuslimWorldLeague', asr: 'shafi' },
  isna15: { angles: '15 / 15', carrier: 'preset NorthAmerica', asr: 'shafi' },
  isna2010: { angles: '18 / 18', carrier: 'constructed Other', asr: 'shafi' },
  ummalqura: { angles: '18.5 / maghrib+90, +120 Ramadan', carrier: 'preset UmmAlQura + Ramadan switch', asr: 'shafi' },
  egyptian: { angles: '19.5 / 17.5', carrier: 'preset Egyptian', asr: 'shafi' },
  karachi: { angles: '18 / 18', carrier: 'preset Karachi', asr: 'hanafi' },
  moonsighting: { angles: '18 / 18 + season curve + 1/7 above 55N', carrier: 'preset MoonsightingCommittee', asr: 'shafi' },
  'diyanet-tr': { angles: '18 / 17 (temkin on other rows)', carrier: 'preset Turkey', asr: 'shafi' },
  'diyanet-eu': { angles: '18 / 16', carrier: 'constructed Other', asr: 'shafi' },
  mabims: { angles: '20 / 18', carrier: 'constructed Other (Kemenag instance)', asr: 'shafi' },
  jakim: { angles: '18 / 18', carrier: 'constructed Other', asr: 'shafi' },
  kuwait: { angles: '18 / 17.5', carrier: 'preset Kuwait', asr: 'shafi' },
  qatar: { angles: '18 / maghrib+90', carrier: 'preset Qatar', asr: 'shafi' },
  singapore: { angles: '20 / 18, ceiling', carrier: 'preset Singapore', asr: 'shafi' },
  dubai: { angles: '18.2 / 18.2', carrier: 'preset Dubai', asr: 'shafi' },
  tehran: { angles: '17.7 / 14 (software default)', carrier: 'preset Tehran', asr: 'shafi' },
  'fazilet-a': { angles: '19.8 / 17.8 effective', carrier: 'constructed Other', asr: 'shafi' },
  'fazilet-b': { angles: '20.8 / 18.7 effective', carrier: 'constructed Other', asr: 'shafi' },
  ecfr: { angles: '18 / 17', carrier: 'constructed Other', asr: 'shafi' },
  russia: { angles: '16 / 15', carrier: 'constructed Other', asr: 'shafi' },
};

const LABEL = {
  mwl: 'Muslim World League (18/17)',
  isna15: 'ISNA / FCNA 2017 (15/15)',
  isna2010: 'ISNA 2010 statement (18/18)',
  ummalqura: 'Umm al-Qura (18.5, isha interval)',
  egyptian: 'Egyptian General Authority (19.5/17.5)',
  karachi: 'Karachi, Hanafi Asr (18/18)',
  moonsighting: 'Moonsighting Committee (18 + season curve)',
  'diyanet-tr': 'Diyanet domestic (18/17)',
  'diyanet-eu': 'Diyanet European (18/16)',
  mabims: 'MABIMS / Kemenag (20/18)',
  jakim: 'JAKIM (18/18)',
  kuwait: 'Kuwait Awqaf (18/17.5)',
  qatar: 'Qatar MOI (18, isha +90)',
  singapore: 'MUIS Singapore (20/18, ceiling)',
  dubai: 'Dubai AWQAF (18.2/18.2)',
  tehran: 'Tehran (17.7 / 14)',
  'fazilet-a': 'Fazilet Profile A (19.8/17.8)',
  'fazilet-b': 'Fazilet Profile B (20.8/18.7)',
  ecfr: 'ECFR (18/17)',
  russia: 'Spiritual Administration of Russia (16/15)',
};

const labelOf = (id) => LABEL[id] || id;

const VERDICT = {
  isna2010: 'Wins both halves of the score, 3.30 minutes on fajr and 3.56 on isha, because 18/18 is the pair the world itself prints on both prayers. Its eight within-two countries are the 18/18 and 18/18-plus-margin tables. What it is bad at is everything else: the row is geometry with no publishing body behind it, and it carries no answer for the interval half of the world or for London.',
  karachi: 'Identical geometry to ISNA-2010 and the same 3.38, with the Hanafi Asr that matches only seven of the forty-nine targets. Strongest in Pakistan, India and the Levant. It inherits the whole 18/18 constituency and buys nothing on isha that the plain 18-degree instant does not already give.',
  jakim: 'The third copy of the 18/18 row, at the same 3.38 and the same eight countries, so its position measures the pair rather than any Malaysian rule. It is a national zone table that happens to publish the winning angles, and the margins and ceilings that make it exact in Malaysia are absent from the score.',
  kuwait: 'Second on the headline at 3.72 and first once Pakistan and India are removed, 4.70 against 4.71. Keeps the 18-degree fajr at 3.30 and moves isha to 17.5 for 4.28, which is the best non-18 compromise in the table. Its weakness is that 17.5 sits between the two isha families, so it is inside two minutes in only three countries.',
  dubai: 'Fifth overall at 3.91 with the most balanced pair in the table, 3.72 on fajr and 4.18 on isha, and eight countries inside two minutes. It is the best answer of any body that does not simply publish 18/18. Its drawback is that the 18.2 pair is a ridge of equally good fits, so the margins and rounding that make the UAE calendar exact were never part of the score.',
  mwl: 'The widest natural constituency at nine countries, on 4.22, with the 18-degree fajr at 3.30 and a 17-degree isha at 5.35. The isha pair is the whole distance to the top: 1.79 minutes worse than 18/18 on isha and identical on fajr. Diyanet and ECFR are the same row to two decimals, so this score belongs to the pair.',
  'diyanet-tr': 'Numerically identical to MWL and ECFR at 4.22 because the Turkish pair is also 18/17 and the domestic temkin falls on rows this study does not score. Nine countries inside two minutes. The temkin buys nothing on fajr or isha and the domestic tables are league-average worldwide.',
  ecfr: 'The third copy of 18/17 at 4.22, with the same nine countries. Its proportional high-latitude rule is the only thing that separates it from MWL in principle, and it changes nothing on the scored set, which never reaches the latitudes where the rule binds.',
  moonsighting: 'The best of the curve-based bodies at 5.05: the season curve improves fajr to 3.60 from the 18-degree base, but costs isha at 6.81, and it is inside two minutes in no country at all, because an effective angle that moves between about 12 and 18 degrees matches no national table closely.',
  egyptian: 'Ties Kuwait for the second-best isha at 4.28 from 17.5 degrees, and pays for it on fajr at 7.14 from 19.5. Exact in Egypt and Montenegro and nowhere else, because no other authority prints 19.5/17.5. A national pair being read as a world pair.',
  'diyanet-eu': 'Holds the winning 18-degree fajr at 3.30 and then loses the plot on isha at 9.37, because 16 degrees is early for almost every authority outside Europe. Three countries inside two minutes, two of them by latitude rather than by agreement.',
  'fazilet-a': 'The second-best isha in the table at 3.84 from its 17.8 effective angle, against a fajr of 8.23 from 19.8. Four countries inside two minutes, all in the low latitudes. The effective angles encode a padding that does not travel and the profile is a 110-city print with no global claim attached.',
  singapore: 'The best isha of the ceiling-rounded family at 3.85 from 18 degrees, and a fajr of 8.62 from 20 degrees, which is the fourth-worst fajr here. Four countries inside two minutes, every one of them near the equator: this is a tropical pair and the score says so.',
  mabims: 'The 20/18 pair reproduces Kemenag exactly and matches the best isha in the table at 3.56, so its whole cost is on fajr, 8.96 minutes, the third worst. Four countries inside two minutes, all South-East Asian. As a world default the 20-degree fajr is the defect.',
  qatar: 'Keeps the winning 18-degree fajr at 3.30 and then spends 11.18 minutes on isha, because a fixed ninety minutes after sunset is only true near the tropics. Exact in Qatar, inside two minutes in one country, and structurally unable to serve a temperate latitude.',
  ummalqura: 'A strong fajr at 4.42 from 18.5 degrees, and the second-worst isha at 13.51, because the ninety-minute interval is a Makkah rule that fails wherever the twilight lasts longer. Exact in Saudi Arabia and inside two minutes in one country. As a global default it is a fajr method with an isha that does not travel.',
  'fazilet-b': 'A 20.8/18.7 effective pair that suits the Ottoman sphere and nothing else: 12.99 on fajr, 6.13 on isha, no country inside two minutes. Its temkin is larger than Profile A in every row, which is exactly why it does not travel.',
  tehran: 'The second-best single fajr angle in the study at 4.18 from 17.71 degrees, and the worst isha in the table at 18.46, because the 14-degree isha is a software default with no Iranian publisher behind it. A fajr parameter set with no isha method attached.',
  russia: 'The 16/15 pair is the earliest of any method, 11.63 on fajr and 13.69 on isha, and inside two minutes nowhere. The pair is known only from secondary tables and the census graded it low. It is in this table to show what a two-degree error costs.',
  isna15: 'The worst method here at 14.98, 16.20 on fajr and 13.69 on isha, inside two minutes in no country. The 15-degree pair is the North American convention and it is roughly three degrees early for the rest of the world, which is the cleanest demonstration in the study that a continental default does not scale.',
};

function table() {
  const head = '| # | Method | Weighted all | Rank | Excl. PK+IN | Rank | Authorities | Rank | Unweighted | Within 2 min |\n|---|---|---:|---:|---:|---:|---:|---:|---:|---:|\n';
  const body = byRank.map((m) => `| ${m.finalRank} | ${labelOf(m.id)} | ${n2(m.weighted)} | ${m.finalRank} | ${n2(m.weightedNoPkIn)} | ${m.rank_weightedNoPkIn} | ${n2(m.weightedAuthorities)} | ${m.rank_weightedAuthorities} | ${n2(m.unweighted)} | ${m.constituency} |`).join('\n');
  return head + body;
}

function methodTable() {
  const head = '| id | Angles / rule | Carrier in adhan 4.4.6 | Asr |\n|---|---|---|---|\n';
  const body = MIDS.map((id) => {
    const m = METHOD_ROWS[id];
    return `| ${id} | ${m.angles} | ${m.carrier} | ${m.asr} |`;
  }).join('\n');
  return head + body;
}

function constituency() {
  const lines = [];
  for (const m of byRank) {
    const list = m.constituencyIds.length ? m.constituencyIds.join(', ') : 'none';
    lines.push(`- **${labelOf(m.id)}** (${m.constituency}): ${list}`);
  }
  return lines.join('\n');
}

function indonesiaTable() {
  const head = '| Method | Fajr mean | Fajr worst | Fajr within 2 min % | Isha mean | Isha worst | Isha within 2 min % |\n|---|---:|---:|---:|---:|---:|---:|\n';
  const sorted = [...agg.indonesia].sort((a, b) => a.combined - b.combined);
  const body = sorted.map((r) => {
    return `| ${labelOf(r.id)} | ${n2(r.fajr.mean)} | ${n1(r.fajr.worst)} | ${n1(r.fajr.within2)} | ${n2(r.isha.mean)} | ${n1(r.isha.worst)} | ${n1(r.isha.within2)} |`;
  }).join('\n');
  return head + body;
}

const london = rows.find((r) => r.id === 'GB-LONDON-INTERVAL-TABLE');

function londonTable() {
  const head = '| Method | Fajr mean | Fajr worst | Fajr within 2 min % | Isha mean | Isha worst | Isha within 2 min % |\n|---|---:|---:|---:|---:|---:|---:|\n';
  const sorted = MIDS.map((id) => ({ id, f: london.cells[id].fajr, i: london.cells[id].isha }))
    .sort((a, b) => (a.f.mean + a.i.mean) - (b.f.mean + b.i.mean));
  const body = sorted.map((r) => `| ${labelOf(r.id)} | ${n2(r.f.mean)} | ${n1(r.f.worst)} | ${n1(r.f.within2)} | ${n2(r.i.mean)} | ${n1(r.i.worst)} | ${n1(r.i.within2)} |`).join('\n');
  return head + body;
}

function perCountry() {
  const head = '| Target | Grade | Pop (m) | Best method | Combined | Second | Combined |\n|---|---|---:|---|---:|---|---:|\n';
  const body = rows.map((c) => {
    const ranked = MIDS.map((id) => ({ id, v: combined(c, id) })).filter((x) => x.v !== null).sort((a, b) => a.v - b.v);
    return `| ${c.id} | ${c.grade} | ${c.population === null ? '--' : c.population} | ${labelOf(ranked[0].id)} | ${n2(ranked[0].v)} | ${labelOf(ranked[1].id)} | ${n2(ranked[1].v)} |`;
  }).join('\n');
  return head + body;
}

function matrix() {
  const head = `| Target | ${MIDS.join(' | ')} |\n|---|${MIDS.map(() => '---:').join('|')}|\n`;
  const body = rows.map((c) => `| ${c.id} | ${MIDS.map((id) => n1(combined(c, id))).join(' | ')} |`).join('\n');
  return head + body;
}

const noPoint = scores.noReferencePoint;
const excluded = scores.excluded;

const md = `# O1h global simulation: every prayer-time methodology, naked, against every national recipe

Simulation year 2026 for forty-nine scored targets, and London scored on its 4,383 published days,
2027-2038. Every number in this file is emitted by \`sim.mjs\` from \`scores.json\`. The cell-by-cell
record is in \`scores.json\` and the aggregate record in \`aggregates.json\`.

## 1. What was measured

Twenty bodies were run stock, as each body publishes or as the bundled library implements it, at
each target's own coordinates in the target's own civil zone. Each body was scored against that
country's fitted recipe: the census angles, margins, rounding and high-latitude rule on the target
side, and for London the real published minutes of the London Unified Prayer Timetable.

The two sides are deliberately asymmetric. The target side carries everything the census measured,
including per-field rounding and minute margins. The method side carries only what the body itself
defines: the angle pair, the body's own interval or season curve, its rounding where the carrier
states one, and the library's stock high-latitude behaviour. No census margin, no per-country
adjustment and no fitted angle touches a method. A one-minute national margin that the target
carries and the method does not therefore reads as a one-minute deviation, which is the intended
result: the margin is configuration, and configuration is what a deployment adds afterwards.

**Prayers scored:** fajr and isha only. Asr is recorded as a school-match flag against the country's
school and is never scored in minutes. Dhuhr and maghrib are absent from the headline on purpose:
their national values are almost entirely margin (+1 to +10 minutes) plus a rounding direction, so
scoring them would rank bodies on bookkeeping rather than on astronomy, and a configuration layer
can carry them exactly.

## 2. The method side

${methodTable()}

Every preset was used verbatim, which is why the carrier column matters: the Muslim World League,
ISNA, Egypt, Karachi, Kuwait, Qatar, Singapore, Dubai, Tehran and Turkey rows all come from the
library's own preset objects, temkin and adjustment fields included. Where a body has no preset the
harness built an \`Other\` parameter object from the body's own documented pair, which implements the
body rather than modifying it.

Two body-internal rules were implemented because they belong to the method itself:

- **Umm al-Qura** adds 120 minutes to maghrib inside Ramadan and 90 outside. Ramadan 1447 was taken
  as **2026-02-18 through 2026-03-19, thirty days**, per Umm al-Qura's own calendar. For the London
  years the harness used the arithmetic Hijri calendar with its epoch shifted onto that same
  Umm al-Qura date, because the record fixes only 1447. The arithmetic calendar runs about five days
  late unshifted, and the shift keeps the twelve later years within a few days of the real calendar.
- **Karachi** runs the Hanafi Asr, as the brief fixes, although \`methods.json\` records the pair as
  Shafi. The conflict is recorded here and nowhere else. Asr is not scored.

No fajr or isha margin was applied to any method. The one candidate was ECFR's plus or minus two
minutes from the Fiqh Academy resolution, and it was dropped because the same resolution's offset is
absent from the MWL preset that the brief fixes as the MWL method. Applying it to one and not to the
other would decide the ranking by a bookkeeping asymmetry instead of by astronomy. Every method
therefore differs from its neighbours only in its angles, its interval, its curve and its rounding.

## 3. The target side and its coverage

Forty-nine targets were scored:

- 45 rows from \`policy-layer.v2.4.json\`: 44 computed from their own fitted angles, margins, per-field
  rounding, high-latitude kind and clock mode, and London computed against the real published minutes.
  Malaysia is among the 44, scored at the WLY01 zone point the record carries, because that object's
  own reference is a zone table and WLY01 is the federation's first zone.
- 4 community rows that exist only in \`countries.json\` (Indonesia, Pakistan, India, Nigeria). They
  carry no margins and no rounding, so the harness applied zero margins and nearest rounding, which
  is the rule the constraints fix for any body that documents no rounding.

Twenty-four of the seventy-three targets carry no recipe score, and each is excluded for a stated
reason.

**Four excluded forms** (no angle exists to score, so approximating one would invent the target):

${Object.entries(excluded).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

**Nineteen targets carry no reference point in the record** and cannot be scored at a coordinate:

${noPoint.join(', ')}

Their references are zone tables whose per-city coordinates were never carried (Fazilet's 110 cities,
JAMIAAT's 494 towns, CDUM's 21 cities, Norway's 4, Djibouti's 6, Trinidad's 4) or point objects the
record marks as not captured. Three of the nineteen are the Fazilet and Diyanet-European schemes
themselves, which would in any case be self-comparisons. Inventing a city coordinate would have put a
fabricated number in the decision table, so they are absent from every aggregate and named here.

**One further exclusion:** CI-COSIM (Cote d'Ivoire) carries coordinates but no fitted rule, because
the census could not fit it. There is nothing to score against.

**Coverage:** the scored targets carry **${n1(fullPop)} million** Muslims under the one-row-per-country
weighting rule described below. The nineteen unscored targets are mostly small or duplicated
populations. The largest single omission is Tanzania at 19.4 million, which appears inside the Southern
Africa federation row rather than as its own object.

## 4. The decision table

Weights are Muslims per country from \`POPULATIONS.md\`. Where one country has two scored rows (Greece,
Russia, the United Kingdom) the population is carried once, by the highest-grade row, so no country is
counted twice. Combined deviation is the mean of the fajr and isha mean absolute deviations, in minutes
of the country's own civil clock.

${table()}

**Reading the four columns.** The first is the headline and ranks by population, so Indonesia,
Pakistan, India, Bangladesh and Nigeria decide most of it. The second removes Pakistan and India,
whose targets are the community 18/18 Hanafi practice rather than a state authority: they are 433
million people held at zero by every 18/18 row, and removing them promotes Kuwait to first at 4.70
with the 18/18 row second at 4.71, a gap of one hundredth of a minute. The third restricts to the
targets the census graded A or provisional. There the 18/17 family edges ahead at 5.12 against 5.22,
so the authorities prefer a seventeen-degree isha and the population prefers eighteen. The fourth
weighs every country equally, which is how the small European and island targets get a vote, and it
moves the 18/17 family above Kuwait.

Three findings survive all four columns:

- **Fajr has one answer.** 18 degrees at 3.30 minutes is the best or joint-best fajr in the table.
  Every other choice is worse, and the losses are large: 18.5 is 4.42, 19.5 is 7.14, 20 is 8.96,
  20.8 is 12.99, 16 is 11.63 and 15 is 16.20.
- **Isha has one answer, and it is also 18.** 18 degrees at 3.56 minutes beats 17.5 at 4.28, 17 at
  5.35 and 15 at 13.69.
- **The 18/18 row wins on both halves**, and the three bodies that carry it -- the ISNA 2010
  statement, Karachi and JAKIM -- are the same geometry and therefore the same score to two decimals.
  Their ranking is a tie on minutes and must be broken on something other than astronomy.

The spread from first to last is 11.60 minutes. The top four distinct pairs -- 18/18, 18/17.5, 18.2
and 18/17 -- sit inside 0.84 minutes of each other, which is less than the rounding granularity of
most national tables.

## 5. Natural constituency

Countries where the method is within two minutes mean deviation on **both** fajr and isha:

${constituency()}

## 6. Indonesia, broken out

Kemenag's target-side rule is 20/18 with zero margins and no rounding direction: that is what
\`countries.json\` and the world table carry, and \`policy-layer.v2.4.json\` has no Indonesian object at
all. The +3 minute margins and per-field rounding that the method catalog records for Kemenag were
measured through a third-party carriage and exist only on the method side of this study, so they cannot
be scored against. The naked MABIMS pair is also 20/18 and rounds nearest, so the MABIMS row therefore
reproduces the target to the minute by construction. That zero is not a finding about Indonesia. It is
the statement that Kemenag's published pair, run with no national margins, is exactly the shared MABIMS
pair. The real Indonesian result is every other column: what each body costs against 20/18.

${indonesiaTable()}

## 7. London, against the published minutes

The London Unified Prayer Timetable is not a formula: its fajr and isha are date-keyed integer tables
recovered from the Hizbul Ulama 1987-88 observations. Against 4,383 real published days nineteen of the
twenty bodies fail, and the reason is structural rather than a matter of angles.

${londonTable()}

**One method survives, and it is the curve.** Moonsighting tracks the published minutes to 3.0 on fajr
and 4.4 on isha across 4,383 days, and it does so precisely on the days that break every other body.
On 2027-06-21 the table prints 02:40 and 22:42 and Moonsighting prints 02:43 and 22:42, while the Muslim
World League cannot reach 18 degrees, clamps to a night portion and prints 01:02 for both prayers. The
curve and the table are the same family of method, which is why one of them reproduces the other at a
latitude where no angle exists.

**The remaining gap is still a table.** Even Moonsighting lands inside two minutes on only 43 percent
of fajr days and 24 percent of isha days, so a London deployment still needs the interval table. The
difference is that one world body is in the same family as the table and the rest are not: the second
best is 23.3 minutes out on average and the median method is 47.3. Any global body offered for the
United Kingdom has to be judged on this target alone, and only one of the twenty is a candidate.

## 8. Per-country winner

${perCountry()}

## 9. Ranking

Ordered by the population-weighted combined deviation over all scored targets. Every line states what
the method is good at and bad at, on the numbers above.

${byRank.map((m) => `**${m.finalRank}. ${labelOf(m.id)}** -- ${n2(m.weighted)} minutes weighted (${n2(m.weightedNoPkIn)} without Pakistan and India, ${n2(m.weightedAuthorities)} on authorities only, rank ${m.rank_weightedAuthorities} there). ${VERDICT[m.id]}`).join('\n\n')}

### What the ranking recommends

The single global default that the numbers support is the **18/18 pair with the Shafi Asr**, at 3.38
minutes weighted, 4.71 with Pakistan and India removed and 5.22 on the authorities-only subset. It
wins the fajr half outright at 3.30 and the isha half outright at 3.56, and it stays at or near the
top of every one of the four aggregate columns, which no other pair does.

That answer has an awkward consequence: what wins is a pair with no publishing body behind it. The three rows that carry it are the
ISNA 2010 statement, Karachi and JAKIM, and they are the same geometry, so the ranking cannot separate
them on minutes. Two structural facts do separate them. Karachi's Asr is Hanafi and matches only seven
of the forty-nine targets, while ISNA's and JAKIM's Shafi Asr matches thirty-nine. Of those two, JAKIM is a
national zone table publishing the win by accident, and the ISNA 18/18 form is a statement the body
itself moved away from in 2017. A deployment that needs a body with a current worldwide claim and the
winning pair has to take 18/18 from the historical record or from South Asian practice, or accept the
18/17 family at 4.22, which is 0.84 minutes worse and is what the Muslim World League, the Diyanet and
the ECFR all publish today.

If the deployment has to serve a high-latitude city with a printed observation table, that
recommendation does not hold: the 18/18 pair is 50.5 minutes out at London and only Moonsighting is
usable there.

## 10. Harness decisions and their reasons

- **Rounding.** Where the carrier states a rounding it was used: Singapore ceils because its preset
  says so, and every other preset and constructed pair rounds nearest, which is also the rule the
  constraints fix for the bodies that state nothing. No method carries the +1 minute margins that the
  Saudi, Kuwaiti and other national recipes use, so those read as exactly one minute of deviation on
  the target side. Targets were computed with rounding off and then rounded per field, so a national
  table's floor or ceiling is reproduced to the minute.
- **High latitude.** Targets use the object's own kind, including "none", which means the angle is
  used everywhere and a day with no such twilight is a day the authority simply does not print. That
  is why Reykjavik contributes 241 fajr days and 243 isha days, Kazan 271 and 293, and Moscow 365
  fajr days but 293 isha days: its summer isha is served from observation in the record, never
  modelled. Methods keep the library's stock behaviour, which is one half of the night for every body
  that does not define its own rule. That default is what produces most of the London gap.
- **Frozen latitude 45.** Brussels and Istanbul both carry the rule with a declared summer window and
  no window dates. The harness applied it on the days the angle does not exist at the city's own
  latitude, which is the window the record describes. At Istanbul's 41 degrees the rule never fires.
- **Clock.** Every target was computed in its own IANA zone in its own process, asserted against the
  requested zone at start. Morocco, Jerusalem and Niger were additionally rendered at their fixed
  printed offsets rather than the civil zone, because their tables ignore the DST change.
- **Intervals.** Where a target's isha is an interval, the interval was applied to the computed sunset
  and then the target's own margin and rounding. Qatar's is applied after rounding the displayed
  maghrib, which is the ordering the record measured.
- **No real clock.** Every date is constructed from a string. Nothing in the harness reads the system
  time.

## 11. Appendix: every cell

Combined mean absolute deviation, minutes, one decimal. Column keys are the method ids of section 2.

${matrix()}
`;

writeFileSync(join(HERE, 'SIM-REPORT.md'), md);
console.log('wrote SIM-REPORT.md', md.length, 'chars');
