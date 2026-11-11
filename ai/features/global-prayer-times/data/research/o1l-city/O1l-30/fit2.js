// Named-method scorer for a full-year table. adhan 4.4.6, no clock reads.
const fs = require('fs');
const adhan = require('$HOME/athan-gitree/census/adhan-build/node_modules/adhan');
const { Coordinates, CalculationMethod, CalculationParameters, PrayerTimes, Madhab, Rounding } = adhan;

const file = process.argv[2], tz = process.argv[3];
const { meta, rows } = JSON.parse(fs.readFileSync(file, 'utf8'));
const dates = Object.keys(rows).sort();
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const lm = d => { const p = fmt.formatToParts(d).reduce((a, x) => (a[x.type] = x.value, a), {}); let h = +p.hour; if (h === 24) h = 0; return h * 60 + +p.minute + +p.second / 60; };
const pm = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const coords = new Coordinates(meta.lat, meta.lon, 0);

function build(base, adjustments) {
  const p = new CalculationParameters(base.method, base.fajrAngle, base.ishaAngle);
  p.ishaInterval = base.ishaInterval || 0;
  p.madhab = base.madhab;
  p.rounding = Rounding.None;
  p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  p.adjustments = { fajr: adjustments.fajr, sunrise: adjustments.sunrise, dhuhr: adjustments.dhuhr, asr: adjustments.asr, maghrib: adjustments.maghrib, isha: adjustments.isha };
  return p;
}
function compute(p) {
  const o = {};
  for (const d of dates) {
    const [y, m, dd] = d.split('-').map(Number);
    const pt = new PrayerTimes(coords, new Date(Date.UTC(y, m - 1, dd, 12)), p);
    o[d] = { fajr: lm(pt.fajr), sunrise: lm(pt.sunrise), dhuhr: lm(pt.dhuhr), asr: lm(pt.asr), maghrib: lm(pt.maghrib), isha: lm(pt.isha) };
  }
  return o;
}
function scoreAll(model) {
  const res = {};
  for (const col of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    let exact = 0, w1 = 0, sum = 0, worst = 0; const r = [];
    for (const d of dates) {
      const diff = pm(rows[d][col]) - model[d][col];
      r.push(diff); sum += Math.abs(diff);
      if (Math.abs(diff) < 0.5) exact++;
      if (Math.abs(diff) < 1.5) w1++;
      worst = Math.max(worst, Math.abs(diff));
    }
    r.sort((a, b) => a - b);
    res[col] = { med: +r[Math.floor(r.length / 2)].toFixed(1), exact, w1, mae: +(sum / dates.length).toFixed(2), worst: +worst.toFixed(1) };
  }
  return res;
}
function medOffset(col, model) {
  const r = dates.map(d => pm(rows[d][col]) - model[d][col]).sort((a, b) => a - b);
  return Math.round(r[Math.floor(r.length / 2)]);
}

const methods = {
  MWL: CalculationMethod.MuslimWorldLeague(), Egyptian: CalculationMethod.Egyptian(),
  Karachi: CalculationMethod.Karachi(), UmmAlQura: CalculationMethod.UmmAlQura(),
  Dubai: CalculationMethod.Dubai(), MoonsightingCommittee: CalculationMethod.MoonsightingCommittee(),
  NorthAmerica: CalculationMethod.NorthAmerica(), Kuwait: CalculationMethod.Kuwait(),
  Qatar: CalculationMethod.Qatar(), Singapore: CalculationMethod.Singapore(),
  Turkey: CalculationMethod.Turkey(), Tehran: CalculationMethod.Tehran(),
};

const results = [];
for (const [name, base] of Object.entries(methods)) {
  for (const madhab of [Madhab.Shafi, Madhab.Hanafi]) {
    const b = Object.assign({}, base, { madhab });
    const m0 = compute(build(b, { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }));
    const adj = {};
    for (const col of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) adj[col] = medOffset(col, m0);
    // re-centre: offsets absorbed, then report residual shape error
    const s = scoreAll(m0);
    const totalMae = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].reduce((a, c) => a + s[c].mae, 0);
    results.push({ name, madhab: madhab === Madhab.Shafi ? 'shafi' : 'hanafi', offsets: adj, totalMae: +totalMae.toFixed(2), scores: s });
  }
}
results.sort((a, b) => a.totalMae - b.totalMae);

// refine angles around the best named method, offsets applied
function withOffsets(base, madhab, fajrAngle, ishaAngle) {
  const b = Object.assign({}, base, { madhab, fajrAngle, ishaAngle });
  const m0 = compute(build(b, { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }));
  const adj = {};
  for (const col of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) adj[col] = medOffset(col, m0);
  const m1 = compute(build(b, adj));
  return { adj, m1, scores: scoreAll(m1) };
}
const best = results[0];
const base = methods[best.name];
const madhab = best.madhab === 'shafi' ? Madhab.Shafi : Madhab.Hanafi;
let winner = null;
for (let fa = base.fajrAngle - 1.5; fa <= base.fajrAngle + 1.5 + 1e-9; fa += 0.05) {
  for (let ia = (base.ishaAngle || 17) - 1.5; ia <= (base.ishaAngle || 17) + 1.5 + 1e-9; ia += 0.05) {
    const r = withOffsets(base, madhab, +fa.toFixed(2), +ia.toFixed(2));
    const key = ['fajr', 'isha'].reduce((a, c) => a + r.scores[c].mae, 0);
    if (!winner || key < winner.key) winner = { key: +key.toFixed(3), fa: +fa.toFixed(2), ia: +ia.toFixed(2), r };
  }
}
const W = winner.r;
console.log(JSON.stringify({ file, name: meta.name, lat: meta.lat, lon: meta.lon, tz, days: dates.length,
  candidates: results.slice(0, 3).map(x => ({ method: x.name, madhab: x.madhab, totalMae: x.totalMae })),
  refined: { method: best.name, madhab: best.madhab, fajrAngle: winner.fa, ishaAngle: winner.ia, offsets: W.adj, scores: W.scores } }, null, 1));
