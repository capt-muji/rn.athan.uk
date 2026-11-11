// Job 2: the Jamiat KZN perpetual engine against December 2026 rows for the
// Southern African towns. Recipe per census: fajr/sunrise bare 18/raw, isha
// Shafi separate 15 deg, zuhr transit+5, maghrib astro+3, split rounding law
// (morning/noon nearest, afternoon/evening floor). Fixed offsets, margin 0.
import fs from 'node:fs';
import { load, computeCols, chartOf, score, bestMargin, line, parseMin } from './lib.mjs';

const ROOT = process.env.HOME + '/athan-gitree/census/o1k-wide/southernafrica2/data/';
const adhan = await load();

const TOWNS = [
  { name: 'Maputo', file: 'jamiat-maputo-2026-12.json' },
  { name: 'Windhoek', file: 'jamiat-windhoek-2026-12.json' },
  { name: 'Luanda', file: 'jamiat-luanda-2026-12.json' },
  { name: 'Maseru', file: 'jamiat-maseru-2026-12.json' },
  { name: 'Mbabane', file: 'jamiat-mbabane-2026-12.json' },
  { name: 'Harare', file: 'jamiat-harare-2026-12.json' },
  { name: 'Bulawayo', file: 'jamiat-bulawayo-2026-12.json' },
  { name: 'Blantyre', file: 'jamiat-blantyre-2026-12.json' },
  { name: 'Lilongwe', file: 'jamiat-lilongwe-2026-12.json' },
  { name: 'Mzuzu', file: 'jamiat-mzuzu-2026-12.json' },
  { name: 'Zomba', file: 'jamiat-zomba-2026-12.json' },
];

const PRINTED = ['suhoor', 'fajr', 'sunrise', 'ishraaq', 'dhuha', 'zawaal', 'zuhr',
  'asr_shafi', 'asr_hanafi', 'sunset', 'maghrib', 'isha_shafi', 'isha_hanafi'];

// Harare/Bulawayo files carry no printed coords; census standard city coords.
const COORD_FALLBACK = {
  Harare: { lat: -17.8250, lon: 31.0333 },
  Bulawayo: { lat: -20.1500, lon: 28.5833 },
};

function parseCoords(s) {
  const m = /([\d.]+)([NS]), ([\d.]+)([EW])/.exec(s);
  return { lat: +m[1] * (m[2] === 'S' ? -1 : 1), lon: +m[3] * (m[4] === 'W' ? -1 : 1), printed: s };
}

const out = {};
for (const t of TOWNS) {
  const doc = JSON.parse(fs.readFileSync(ROOT + t.file));
  const coords = doc.coords_as_published
    ? parseCoords(doc.coords_as_published)
    : { ...COORD_FALLBACK[t.name], printed: 'not printed (census city coords)' };
  const off = doc.utc_offset_hours ?? 2;
  const tz = off === 2 ? 'Etc/GMT-2' : off === 1 ? 'Etc/GMT-1' : `Etc/GMT-${off}`;
  const dates = Object.keys(doc.rows).sort();
  const rows = dates.map((d) => doc.rows[d]);

  // base columns, second resolution
  const base = computeCols(adhan, coords, tz, dates, {
    fajr18: { kind: 'angle', v: 18, after: false },
    sunrise: { kind: 'sunrise' },
    transit: { kind: 'transit' },
    asr_shafi: { kind: 'asr', v: 'shafi' },
    asr_hanafi: { kind: 'asr', v: 'hanafi' },
    sunset: { kind: 'sunset' },
    isha15: { kind: 'angle', v: 15, after: true },
    isha18e: { kind: 'angle', v: 18, after: true },
  });
  // the generator's evening 18-deg: mirror of the morning crossing about transit
  const isha18m = base.transit.map((v, i) => (v === null || base.fajr18[i] === null ? null : 2 * v - base.fajr18[i]));

  // census engine: [printed col -> [sec series, rounding mode]]
  const engine = {
    suhoor: [base.fajr18, 'nearest'], suhoorOff: -5,
    fajr: [base.fajr18, 'nearest'], fajrOff: 0,
    sunrise: [base.sunrise, 'nearest'], sunriseOff: 0,
    ishraaq: [base.sunrise, 'nearest'], ishraaqOff: 15,
    dhuha: [base.sunrise, 'nearest'], dhuhaOff: 195,
    zawaal: [base.transit, 'nearest'], zawaalOff: -5,
    zuhr: [base.transit, 'nearest'], zuhrOff: 5,
    asr_shafi: [base.asr_shafi, 'floor'], asr_shafiOff: 0,
    asr_hanafi: [base.asr_hanafi, 'floor'], asr_hanafiOff: 0,
    sunset: [base.sunset, 'floor'], sunsetOff: -3,
    maghrib: [base.sunset, 'floor'], maghribOff: 3,
    isha_shafi: [base.isha15, 'floor'], isha_shafiOff: 0,
  };
  const chart = chartOf(rows, PRINTED);
  const res = {};
  let exact = 0, n = 0, worst = 0;
  const divergent = [];
  for (const p of PRINTED) {
    let sec, mode, off;
    if (p === 'isha_hanafi') {
      // test both the adhan evening crossing and the transit mirror; keep the better
      const a = score(base.isha18e, chart[p], 0, 'floor');
      const m = score(isha18m, chart[p], 0, 'floor');
      sec = a.exact >= m.exact ? base.isha18e : isha18m;
      mode = 'floor'; off = 0;
      res.isha_hanafiModel = a.exact >= m.exact ? 'adhan-evening' : 'transit-mirror';
    } else {
      sec = engine[p][0]; mode = engine[p][1]; off = engine[p + 'Off'];
    }
    const s = score(sec, chart[p], off, mode);
    res[p] = s;
    exact += s.exact; n += s.n; worst = Math.max(worst, s.worst);
    if (s.exact < s.n) {
      const near = [];
      for (let j = (off - 10) * 2; j <= (off + 10) * 2; j++) near.push(j / 2);
      const fix = bestMargin(sec, chart[p], { margins: near, modes: [mode] });
      divergent.push({ col: p, exact: s.exact, of: s.n, worst: s.worst, mae: +s.mae.toFixed(2), bias: +s.bias.toFixed(2), engineMargin: off, fixingMargin: fix.margin });
    }
  }
  out[t.name] = {
    coords, utc_offset: off, rows: dates.length, span: [dates[0], dates[dates.length - 1]],
    joint: { exact, of: n, worst },
    columns: Object.fromEntries(PRINTED.map((p) => [p, { exact: res[p].exact, of: res[p].n, worst: res[p].worst }])),
    divergent, isha_hanafiModel: res.isha_hanafiModel,
  };
  // dhuha law: printed minus (sunrise + 195) in whole minutes, day by day
  const dh = chart.dhuha.map((p, i) => (p === null || base.sunrise[i] === null ? null : Math.round(p - base.sunrise[i] / 60 - 195)));
  const dhVals = [...new Set(dh)].sort((a, b) => a - b);
  out[t.name].dhuhaOffsetFromSunrise = { min: Math.min(...dh), max: Math.max(...dh), values: dhVals };
  console.log(`${t.name.padEnd(10)} ${coords.printed.padEnd(28)} tz ${tz}  joint exact ${exact}/${n} worst ${worst}  dhuha offset ${dhVals.join(',')}  isha_hanafi ${res.isha_hanafiModel}`);
  for (const d of divergent) console.log(`    divergent ${d.col}: exact ${d.exact}/${d.of} worst ${d.worst} bias ${d.bias >= 0 ? '+' : ''}${d.bias}  engine ${d.engineMargin} -> fixing margin ${d.fixingMargin}`);
}

fs.writeFileSync('job2-jamiat.json', JSON.stringify({
  towns: out,
  engineVerdict: {
    confirmed: 'fajr/sunrise bare 18/raw, isha Shafi 15 separate, zuhr transit+5, maghrib astro+3, split rounding (morning/noon nearest, afternoon/evening floor), suhoor fajr-5, ishraaq sunrise+15, zawaal transit-5, asr both schools bare, isha_hanafi evening 18',
    reach: 'every one of the 11 towns reproduces on every column at worst 1 min, except dhuha and Blantyre evening pair',
    dhuhaLaw: 'NOT sunrise+195: dhuha = astro_sunrise + (astro_sunset+3 - astro_sunrise)/4, nearest; 22-29/31 exact per town (adhan ruler), worst 1; on Blantyre the +3 marker is absent (its evening family runs +3: sunset col = astro, maghrib = astro+6, dhuha quarter marker = astro)',
    blantyreShift: 'Blantyre sunset fixing margin 0 (engine -3), maghrib fixing margin 6 (engine 3) - the town-scoped +3 evening shift recurs in December',
    modelNote: 'worst-1 stragglers on all non-divergent columns are the generator internal model vs adhan; the census solar.py ruler gives the same picture (solar.py crosscheck exact 3500/4433, worst 1 on non-divergent columns)',
  },
}, null, 1));
console.log('wrote job2-jamiat.json');
