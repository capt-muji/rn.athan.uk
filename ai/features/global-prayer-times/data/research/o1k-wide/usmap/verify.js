// Assert every headline number the update states, against the JSON this workspace produced.
// Each line prints the claim, the measured value, and PASS or FAIL.
import fs from 'node:fs';

const W = process.env.HOME + '/athan-gitree/census/o1k-wide/usmap/';
const read = f => JSON.parse(fs.readFileSync(W + f, 'utf8'));
const t = read('tally.json');
const m = read('measure.json');
const rel = read('relations.json');
const corr = read('corrections.json');
const noon = read('noon.json');
const sunrise = read('sunrise.json');

let fails = 0;
const check = (label, got, want) => {
  const ok = got === want;
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: ${got}${ok ? '' : ` (stated ${want})`}`);
};
const pct = (a, b) => +(100 * a / b).toFixed(1);

// Base, from C47's own table.
const c47 = fs.readFileSync(process.env.HOME + '/athan-gitree/census/c47-practicemap/out/per_mosque.tsv', 'utf8')
  .trim().split('\n').map(l => l.split('\t'));
const head = c47.shift();
const ci = Object.fromEntries(head.map((h, i) => [h, i]));
const rows = c47.map(f => Object.fromEntries(head.map((h, i) => [h, f[i]])));
const us47 = rows.filter(r => r.country === 'US');
const ca47 = rows.filter(r => r.country === 'CA');

check('C47 mosques', rows.length, 151);
check('C47 US mosques', us47.length, 126);
check('C47 CA mosques', ca47.length, 16);
check('C47 US at 15/15', us47.filter(r => `${r.fajrCluster}/${r.ishaCluster}` === '15/15').length, 97);
check('C47 US at 15/15 percent', pct(97, 126), 77);
check('C47 CA at 15/15', ca47.filter(r => `${r.fajrCluster}/${r.ishaCluster}` === '15/15').length, 7);

// Margins.
const within1 = k => rows.filter(r => r[k] !== '' && Math.abs(Number(r[k])) <= 1).length;
const zero = k => rows.filter(r => r[k] === '0').length;
check('C47 fajr margins within 1 min', within1('fajrMargin'), 131);
check('C47 fajr margins exactly 0', zero('fajrMargin'), 101);
check('C47 isha margins within 1 min', within1('ishaMargin'), 121);
check('C47 isha margins exactly 0', zero('ishaMargin'), 94);
check('C47 fajr within-1 percent', pct(131, 151), 86.8);

// Merged tallies.
check('US merged mosques', 126 + t.added.US.length, 134);
check('US merged at 15/15', t.us.is1515, 105);
check('US merged 15/15 percent', pct(t.us.is1515, 134), 78.4);
check('US merged 15 fajr', t.us.f15, 111);
check('US merged 18 fajr', t.us.f18, 17);
check('US merged Hanafi', t.us.han, 40);
check('CA merged mosques', 16 + t.added.CA.length, 26);
check('CA merged at 15/15', t.ca.is1515, 14);
check('CA merged 15/15 percent', pct(t.ca.is1515, 26), 53.8);
check('CA merged 15 fajr', t.ca.f15, 20);
check('CA merged 18 fajr', t.ca.f18, 5);
check('CA merged Hanafi', t.ca.han, 8);
check('CA at 13/13', rows.filter(r => r.country === 'CA' && r.fajrCluster === '13').length
  + t.added.CA.filter(r => r.fajr === 13 && r.isha === 13).length, 0);

const nUS = 134, nCA = 26;
check('North America mosques', nUS + nCA, 160);
check('North America at 15/15', t.us.is1515 + t.ca.is1515, 119);
check('North America 15/15 percent', pct(119, 160), 74.4);
check('North America 15 fajr', t.us.f15 + t.ca.f15, 131);
check('North America 15 fajr percent', pct(131, 160), 81.9);
check('North America 18 fajr', t.us.f18 + t.ca.f18, 22);
check('North America 18 fajr percent', pct(22, 160), 13.8);
check('North America Hanafi', t.us.han + t.ca.han, 48);

// Three-year stability.
const SIX = ['Memphis Islamic Center', 'Richmond Islamic Community Center TX',
  'Islamic Center of South Bay (Lomita)', 'MAS Tarbiyah Center (Livonia MI)',
  'Jamaica Muslim Center (NY)', 'Ethiopian Muslim Association (SeaTac WA)'];
let years = 0, drift = 0;
for (const b of SIX) {
  const ys = [b, `${b} (2024)`, `${b} (2025)`].map(n => m.find(x => x.mosque === n)).filter(Boolean);
  years += ys.length;
  for (const k of ['fajrAngle', 'ishaAngle']) {
    const v = ys.map(r => r[k]);
    drift = Math.max(drift, Math.max(...v) - Math.min(...v));
  }
}
check('three-year mosque-years', years, 18);
check('three-year largest angle drift (0.01 deg)', +drift.toFixed(2), 0.03);

// Printed relations.
check('IANT shared days', rel.iant_widget_minus_dpt_2026.sharedDays, 364);
check('IANT widget minus dpt fajr mean (0.01 min)', +rel.iant_widget_minus_dpt_2026.deltas.fajr.mean.toFixed(2), 15.57);
check('IANT widget minus dpt isha mean', +rel.iant_widget_minus_dpt_2026.deltas.isha.mean.toFixed(2), -10.48);
check('Masjid Toronto isha interval', rel.isha_minus_maghrib.masjid_toronto.gap.min, 80);
check('Masjid Toronto interval is one value', rel.isha_minus_maghrib.masjid_toronto.distinct, 1);
check('Masjid Toronto days at +80', rel.isha_minus_maghrib.masjid_toronto.gap.n, 365);
check('IIT interval values', rel.isha_minus_maghrib.iit_toronto.distinct, 2);
check('Kitchener capped days', rel.kitchener_cap.pinnedDays, 89);
check('Kitchener longest run', rel.kitchener_cap.longestRun.len, 89);
check('Kitchener capped from', rel.kitchener_cap.longestRun.from, '2026-05-11');
check('Kitchener capped to', rel.kitchener_cap.longestRun.to, '2026-08-07');
check('Kitchener largest ordinary isha', rel.kitchener_cap.maxOrdinaryIsha, 22 * 60 + 9);

// Corrections.
check('corrected installs', corr.length, 8);
check('Toledo rows dropped', corr.find(c => /Toledo/.test(c.mosque)).applied[0].rows, 238);
check('San Antonio rows dropped', corr.find(c => /San Antonio/.test(c.mosque)).applied[0].rows, 3);

// The two tests whose result is a negative in the report.
check('noon-referenced sample size', noon.filter(x => !/Toledo/.test(x.mosque)).length, 20);
const nv = noon.filter(x => !/Toledo/.test(x.mosque)).map(x => x.fromNoon);
const nmean = nv.reduce((a, b) => a + b, 0) / nv.length;
check('noon-referenced mean (0.001)', +nmean.toFixed(3), 14.964);
const sd = a => Math.sqrt(a.reduce((s, x) => s + (x - a.reduce((p, q) => p + q, 0) / a.length) ** 2, 0) / a.length);
check('noon-referenced sd (0.001)', +sd(nv).toFixed(3), 0.145);
check('sunrise regression sample', sunrise.length, 20);

console.log(fails ? `\n${fails} CLAIM(S) FAILED` : '\nall claims pass');
process.exit(fails ? 1 : 0);
