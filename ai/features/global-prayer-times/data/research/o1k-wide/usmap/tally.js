// Reconcile C47's 151-mosque map with tonight's captures and print the tally.
// Base: c47-practicemap/out/per_mosque.tsv (151 mosques, 302 mosque-years, 2026 measured).
// Additions: usmap/measure.json, restricted to the mosques C47 did not carry.
// Family windows are C47's own: a half degree around each named angle, so 15 means 14.5-15.5.
import fs from 'node:fs';

const C47 = process.env.HOME + '/athan-gitree/census/c47-practicemap/out/per_mosque.tsv';
const base = fs.readFileSync(C47, 'utf8').trim().split('\n').map(l => l.split('\t'));
const head = base.shift();
const col = Object.fromEntries(head.map((h, i) => [h, i]));
const rows = base.map(f => Object.fromEntries(head.map((h, i) => [h, f[i]])));

// C47's ids, so an overlap is decided by the platform id and not by a mosque name.
const C47_IDS = new Set(rows.map(r => r.id));

// Tonight's captures, with the id where the platform gives one.
const tonight = JSON.parse(fs.readFileSync(process.env.HOME + '/athan-gitree/census/o1k-wide/usmap/measure.json', 'utf8'));
const ID_BY_NAME = {
  'Islamic Association of North Texas (widget)': 'xdy03lAX',
  'Islamic Center of South Bay (Lomita)': 'XEdoEvL7',
  'Jamaica Muslim Center (NY)': 'z0AW66Lj',
  'Markaz Ul Islam (Edmonton)': 'VrdRkwKG',
  'Masjid Al-Fatima (Edmonton)': 'M0dYkvL6',
  'Masjid At-Taqwa (Edmonton)': 'pVdwyVLe',
};

// The named method angles only. A 14.75 reading is the 15.0 line through a sunrise printed
// one minute early, so it belongs to 15 and not to a family of its own.
const CANON = [12, 12.5, 13, 14, 15, 16, 17, 18, 18.5, 19.5];
const fam = (angle, half = 0.5) => {
  if (angle === null || angle === undefined) return null;
  const c = CANON.filter(x => Math.abs(x - angle) <= half);
  if (!c.length) return null;
  return c.reduce((a, b) => (Math.abs(b - angle) < Math.abs(a - angle) ? b : a));
};

// --- base reconciliation -------------------------------------------------
const tally = (list) => {
  const t = { n: list.length, pair: {}, fajr: {}, hanafi: 0 };
  for (const r of list) {
    const p = `${r.fajrCluster}/${r.ishaCluster}`;
    t.pair[p] = (t.pair[p] || 0) + 1;
    t.fajr[r.fajrCluster] = (t.fajr[r.fajrCluster] || 0) + 1;
    if (r.asr === 'Hanafi') t.hanafi++;
  }
  return t;
};
const baseUS = rows.filter(r => r.country === 'US');
const baseCA = rows.filter(r => r.country === 'CA');
const pick = (t, k) => t.pair[k] || 0;

console.log('C47 base: 151 mosques, 302 mosque-years');
console.log('  US', baseUS.length, 'CA', baseCA.length, 'other', rows.length - baseUS.length - baseCA.length);
console.log('  US 15/15', pick(tally(baseUS), '15/15'), '/', baseUS.length);
console.log('  CA 15/15', pick(tally(baseCA), '15/15'), '/', baseCA.length);
console.log('  CA fajr clusters', JSON.stringify(tally(baseCA).fajr));
console.log('  CA Hanafi', tally(baseCA).hanafi, 'US Hanafi', tally(baseUS).hanafi);

// --- tonight's additions, split new vs already counted -------------------
const seen = new Set();
const added = { US: [], CA: [] };
const overlaps = [];
// A three-year repeat is the same mosque measured in another year: stability evidence,
// never a second mosque in the count.
const REPEATS = new Set(['Memphis Islamic Center (2024)', 'Memphis Islamic Center (2025)',
  'Richmond Islamic Community Center TX (2024)', 'Richmond Islamic Community Center TX (2025)',
  'Islamic Center of South Bay (Lomita) (2024)', 'Islamic Center of South Bay (Lomita) (2025)',
  'MAS Tarbiyah Center (Livonia MI) (2024)', 'MAS Tarbiyah Center (Livonia MI) (2025)',
  'Jamaica Muslim Center (NY) (2024)', 'Jamaica Muslim Center (NY) (2025)',
  'Ethiopian Muslim Association (SeaTac WA) (2024)', 'Ethiopian Muslim Association (SeaTac WA) (2025)']);
const isRepeat = m => REPEATS.has(m.mosque);
const stability = [];
for (const m of tonight) {
  if (isRepeat(m)) { stability.push(m); continue; }
  const id = ID_BY_NAME[m.mosque];
  const key = id && C47_IDS.has(id);
  if (key) { overlaps.push({ ...m, id }); continue; }
  if (m.fajrKind !== 'angle') continue; // only an angle fajr enters the family tally
  const ishaCluster = m.ishaKind === 'interval' ? `+${m.ishaInterval}min`
    : m.ishaKind === 'angle' ? String(fam(m.ishaAngle) ?? m.ishaAngle) : null;
  added[m.country].push({
    mosque: m.mosque, fajr: fam(m.fajrAngle), fajrAngle: m.fajrAngle,
    isha: ishaCluster, ishaAngle: m.ishaAngle, ishaKind: m.ishaKind, asr: m.asr,
    darkRms: m.fajrDarkRms,
  });
}
console.log('\nAlready in C47 (id matched):', overlaps.map(o => `${o.mosque} [${o.id}]`).join('; ') || 'none');
console.log('New US', added.US.length, 'New CA', added.CA.length);

const show = a => a.forEach(r => console.log(' ', r.mosque, '|', r.fajr, '/', r.isha, '| asr', r.asr, '| fajr', r.fajrAngle, '| darkRms', r.darkRms));
console.log('\nNew US:'); show(added.US);
console.log('New CA:'); show(added.CA);

// --- merged tally --------------------------------------------------------
const mergedUS = [...baseUS.map(r => ({ pair: `${r.fajrCluster}/${r.ishaCluster}`, asr: r.asr })),
                  ...added.US.map(r => ({ pair: `${r.fajr}/${r.isha}`, asr: r.asr }))];
const mergedCA = [...baseCA.map(r => ({ pair: `${r.fajrCluster}/${r.ishaCluster}`, asr: r.asr })),
                  ...added.CA.map(r => ({ pair: `${r.fajr}/${r.isha}`, asr: r.asr }))];

const count = (list, pred) => list.filter(pred).length;
const pct = (a, b) => (100 * a / b).toFixed(1);
const summarize = (label, list) => {
  const is1515 = count(list, r => r.pair === '15/15');
  const f15 = count(list, r => r.pair.startsWith('15/'));
  const f18 = count(list, r => /^18/.test(r.pair) || r.pair.startsWith('18.5'));
  const han = count(list, r => r.asr === 'Hanafi');
  console.log(`\n${label}: ${list.length} mosques`);
  console.log(`  15/15 ${is1515} (${pct(is1515, list.length)}%) | 15 fajr ${f15} (${pct(f15, list.length)}%)`);
  console.log(`  any 18 fajr ${f18} (${pct(f18, list.length)}%) | Hanafi asr ${han} (${pct(han, list.length)}%)`);
  const p = {};
  for (const r of list) p[r.pair] = (p[r.pair] || 0) + 1;
  console.log('  pairs', Object.entries(p).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(' '));
  return { is1515, f15, f18, han };
};
const us = summarize('US merged', mergedUS);
const ca = summarize('CA merged', mergedCA);

fs.writeFileSync(process.env.HOME + '/athan-gitree/census/o1k-wide/usmap/tally.json',
  JSON.stringify({ base: { US: baseUS.length, CA: baseCA.length }, added, overlaps: overlaps.map(o => o.mosque), us, ca }, null, 1));
