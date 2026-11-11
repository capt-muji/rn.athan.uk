// Jordan awqaf grid: parse the 16 served regional groups, then fit the recorded recipe
// (18/18, sunrise -6, dhuhr +1, asr +1, maghrib +7, isha +1) per group.
// Run: TZ=Asia/Amman node scripts/fit-jo.js
const fs = require('fs');
const path = require('path');
const C = process.env.HOME + '/athan-gitree/census';
const L = require(C + '/o1k-wide/deep2/scripts/lib');
const E = require(C + '/o1k-wide/deep2/scripts/engine');

const ROOT = path.join(__dirname, '..');
const CAP = path.join(ROOT, 'captures');
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const GROUPS = {
  1: ['amman+balqa+zarqa+madaba', 31.9539, 35.9106, 'Amman'],
  2: ['irbid', 32.5556, 35.8500, 'Irbid'],
  3: ['karak', 31.1853, 35.7047, 'Karak'],
  4: ['tafilah', 30.8375, 35.6042, 'Tafilah'],
  5: ['maan', 30.1962, 35.7341, "Ma'an"],
  6: ['aqaba', 29.5321, 35.0063, 'Aqaba'],
  7: ['north-jordan-valley', 32.1976, 35.6179, 'North Jordan Valley'],
  8: ['jarash+ajloun', 32.2808, 35.8992, 'Jerash'],
  9: ['mafraq', 32.3400, 36.2080, 'Mafraq'],
  11: ['dhiban', 31.4975, 35.7837, 'Dhiban'],
  12: ['azraq', 31.8821, 36.8306, 'Azraq'],
  13: ['central-jordan-valley', 31.8936, 35.6169, 'Central Jordan Valley'],
  14: ['shobak+petra', 30.3216, 35.4799, 'Wadi Musa'],
  15: ['dhlail+hashimiyya', 32.1500, 36.0500, 'Dhlail'],
  19: ['ruwaished', 32.5083, 38.2000, 'Ruwaished'],
};
const tmin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const fmt = (s) => ({ exactPct: +(100 * s.exact / s.n).toFixed(1), w1Pct: +(100 * s.w1 / s.n).toFixed(1), mae: +s.mae.toFixed(3), max: s.maxAbs, n: s.n });

function parse(file) {
  const html = fs.readFileSync(path.join(CAP, file), 'utf8');
  const tbl = html.match(/<table[^>]*id="MainContent_gvWebparts"[\s\S]*?<\/table>/);
  if (!tbl) return {};
  const rows = {};
  for (const tr of tbl[0].match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || []) {
    const tds = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
    if (tds.length !== 7 || !/^\d+\/\d+\/\d{4}$/.test(tds[0])) continue;
    const [d, m, y] = tds[0].split('/').map(Number);
    // asr/maghrib/isha print a bare 12-hour afternoon hour (03:18 = 15:18); dhuhr does not.
    const vals = COLS.map((k, i) => {
      const [hh, mi] = tds[i + 1].split(':').map(Number);
      const h = i >= 3 && hh < 10 ? hh + 12 : hh;
      return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
    });
    rows[`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`] = Object.fromEntries(COLS.map((k, i) => [k, vals[i]]));
  }
  return rows;
}

const data = {};
const out = { job: 'O1l-8 Jordan second cities', groups: {}, recipeHeld: {
  fajr: '18 deg', isha: '18 deg', asr: 'Shafi',
  margins: { sunrise: -6, dhuhr: 1, asr: 1, maghrib: 7, isha: 1 }, clock: 'Asia/Amman',
}, notes: [] };

for (const [id, [name, lat, lon, label]] of Object.entries(GROUPS)) {
  const rows = parse(`jo-grid-city-${id}.html`);
  const days = Object.keys(rows).sort();
  if (!days.length) { out.notes.push(`group ${id} served no rows`); continue; }
  data[name] = rows;
  const c = L.coords(lat, lon);
  const printed = (k) => (d) => tmin(rows[d][k]);
  const grid = E.grid(16.0, 19.5, 0.05);
  const tabF = E.angleTable(c, days, grid, 'fajr');
  const tabI = E.angleTable(c, days, grid, 'isha');
  const fajrFit = E.fitAngle(tabF, days, printed('fajr'), [-2, -1, 0, 1]);
  const ishaFit = E.fitAngle(tabI, days, printed('isha'), [-2, -1, 0, 1]);
  const T = {};
  for (const d of days) T[d] = L.times(c, { fajrAngle: 18, ishaAngle: 18, madhab: 'shafi' }, d);

  const scoreHeld = () => {
    const pairs = {};
    for (const k of COLS) pairs[k] = [];
    for (const d of days) {
      const model = {
        fajr: L.roundMin(T[d].fajr, 0, 'floor'),
        sunrise: L.roundMin(T[d].sunrise, -6, 'floor'),
        dhuhr: L.roundMin(T[d].dhuhr, 1, 'floor'),
        asr: L.roundMin(T[d].asr, 1, 'floor'),
        maghrib: L.roundMin(T[d].maghrib, 7, 'floor'),
        isha: L.roundMin(T[d].isha, 1, 'floor'),
      };
      for (const k of COLS) pairs[k].push([printed(k)(d), model[k]]);
    }
    const per = {};
    let all = [];
    for (const k of COLS) { per[k] = fmt(L.score(pairs[k])); all = all.concat(pairs[k]); }
    return { perColumn: per, total: fmt(L.score(all)) };
  };

  const sunriseFit = E.fitFixed((d) => T[d].sunrise, days, printed('sunrise'), [-9, -8, -7, -6, -5, -4]);
  const dhuhrFit = E.fitFixed((d) => T[d].dhuhr, days, printed('dhuhr'), [-1, 0, 1, 2]);
  const asrFit = E.fitFixed((d) => T[d].asr, days, printed('asr'), [-1, 0, 1, 2]);
  const maghribFit = E.fitFixed((d) => T[d].maghrib, days, printed('maghrib'), [5, 6, 7, 8, 9]);
  const ishaFixed = E.fitFixed((d) => T[d].isha, days, printed('isha'), [-1, 0, 1, 2]);

  out.groups[id] = {
    name, label, lat, lon, rows: days.length, span: { from: days[0], to: days[days.length - 1] },
    freeFit: {
      fajr: { theta: fajrFit.theta, pad: fajrFit.pad, mode: fajrFit.mode, score: fmt(fajrFit.s) },
      isha: { theta: ishaFit.theta, pad: ishaFit.pad, mode: ishaFit.mode, score: fmt(ishaFit.s) },
      sunrise: { pad: sunriseFit.pad, mode: sunriseFit.mode, score: fmt(sunriseFit.s) },
      dhuhr: { pad: dhuhrFit.pad, mode: dhuhrFit.mode, score: fmt(dhuhrFit.s) },
      asr: { pad: asrFit.pad, mode: asrFit.mode, score: fmt(asrFit.s) },
      maghrib: { pad: maghribFit.pad, mode: maghribFit.mode, score: fmt(maghribFit.s) },
      ishaFixed: { pad: ishaFixed.pad, mode: ishaFixed.mode, score: fmt(ishaFixed.s) },
    },
    freeRecipe: (() => {
      const pairs = {};
      for (const k of COLS) pairs[k] = [];
      for (const d of days) {
        const model = {
          fajr: L.roundMin(tabF[fajrFit.theta][d], fajrFit.pad, fajrFit.mode),
          sunrise: L.roundMin(T[d].sunrise, sunriseFit.pad, sunriseFit.mode),
          dhuhr: L.roundMin(T[d].dhuhr, dhuhrFit.pad, dhuhrFit.mode),
          asr: L.roundMin(T[d].asr, asrFit.pad, asrFit.mode),
          maghrib: L.roundMin(T[d].maghrib, maghribFit.pad, maghribFit.mode),
          isha: L.roundMin(tabI[ishaFit.theta][d], ishaFit.pad, ishaFit.mode),
        };
        for (const k of COLS) pairs[k].push([printed(k)(d), model[k]]);
      }
      let all = [];
      const per = {};
      for (const k of COLS) { per[k] = fmt(L.score(pairs[k])); all = all.concat(pairs[k]); }
      return { perColumn: per, total: fmt(L.score(all)) };
    })(),
    held: scoreHeld(),
  };
  const g = out.groups[id];
  console.log(`${String(id).padStart(2)} ${label.padEnd(20)} ${days.length}d fajr ${fajrFit.theta}${fajrFit.pad}${fajrFit.mode} isha ${ishaFit.theta}${ishaFit.pad}${ishaFit.mode} | pads sun ${sunriseFit.pad} dhuhr ${dhuhrFit.pad} asr ${asrFit.pad} maghrib ${maghribFit.pad} isha ${ishaFixed.pad} | held ${g.held.total.exactPct}/${g.held.total.w1Pct} mae ${g.held.total.mae} max ${g.held.total.max} | freerecipe ${g.freeRecipe.total.w1Pct} max ${g.freeRecipe.total.max}`);
}

fs.writeFileSync(path.join(ROOT, 'data', 'jo-groups.json'), JSON.stringify(data, null, 1));
fs.writeFileSync(path.join(ROOT, 'data', 'jo-fit.json'), JSON.stringify(out, null, 1));
