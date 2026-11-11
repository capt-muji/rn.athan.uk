// Compose fit13/nz-fianz.json — resolved per-city recipes with exact scores.
import * as L from './lib.js';

const CITIES = [
  ['Auckland', 'nz-2026-ramadan-auckland.json', -36.8485, 174.7633, { fajrAngle: 18, ishaAngle: 18, magribOffset: 5 }],
  ['Wellington', 'nz-2026-ramadan-wellington.json', -41.2866, 174.7756, { fajrAngle: 16, ishaAngle: 15, magribOffset: 5 }],
  ['Christchurch', 'nz-2026-ramadan-christchurch.json', -43.5321, 172.6362, { fajrAngle: 16, ishaAngle: 15, magribOffset: 5 }],
];
const ZONE = 'Pacific/Auckland';

const out = {
  _job: 'Job 2: FIANZ Ramadhan Calendar 1447H (fianz.com successor sheets) — angle pair behind the stated-offset sheet',
  _engine: 'adhan 4.4.6, second resolution, explicit nearest-minute rounding, no real clock',
  window: { from: '2026-02-19', to: '2026-03-20', rows: 30, note: 'Ramadan window only — the pair is fitted inside it and extrapolation outside it is not tested by this surface' },
  statedOffsetsVerbatim: {
    suhoor: '5 minutes allowed between end of Suhur and Fajr',
    iftar: '5 minutes allowed between sunset and Iftar/Maghrib',
    asr: 'single shadow primary; double shadow +40 min',
  },
  statedOffsetsCheck: {
    suhoorEnds_equals_fajr_minus_5: 'EXACT in all 90 rows across the three cities (sd 0)',
    magrib_equals_sunset_plus_5: 'holds to minute rounding at Auckland and Christchurch (median +5.3/+5.6, sd 0.29); Wellington reads +4.0 — see coordinate note',
    asr_single_shadow: 'confirmed: shadow-1 residuals ~0 (+0.2..+0.7), shadow-2 residual ~ -55 min',
  },
  cities: {},
  verdict: {},
};

for (const [name, file, lat, lon, rec] of CITIES) {
  const rows = L.loadTable(`${L.DATA}/${file}`);
  const implied = (field, which) => {
    const st = L.stats(rows.map((r) => L.impliedAngle(r.date, lat, lon, which, L.parseHM(r.times[field]), ZONE)));
    return { median: +st.median.toFixed(2), sd: st.sd, min: +st.min.toFixed(2), max: +st.max.toFixed(2) };
  };
  const solarShift = {};
  for (const [prayer, key] of [['sunrise', 'sunrise'], ['dhuhr', 'dhuhr']]) {
    const st = L.stats(L.residuals(rows, lat, lon, ZONE, prayer, {}));
    solarShift[prayer] = { median: +st.median.toFixed(2), sd: st.sd };
  }
  const scores = L.score(rows, lat, lon, ZONE, {
    fajr: { angle: rec.fajrAngle, offsetMin: 0 },
    sunrise: { offsetMin: 0 },
    dhuhr: { offsetMin: 0 },
    asr: { shadow: 1, offsetMin: 0 },
    maghrib: { offsetMin: rec.magribOffset },
    isha: { angle: rec.ishaAngle, offsetMin: 0 },
  });
  out.cities[name] = {
    lat, lon, rows: rows.length, span: [rows[0].date, rows[rows.length - 1].date],
    recipe: { fajr: rec.fajrAngle, isha: rec.ishaAngle, asr: 'shadow 1', maghrib: `sunset +${rec.magribOffset}`, suhoorEnds: 'fajr -5' },
    fajrImpliedAngle: implied('fajr', 'fajr'),
    ishaImpliedAngle: implied('isha', 'isha'),
    solarColumnShift_vs_censusCoords: solarShift,
    exactScore: scores,
  };
}

out.verdict = {
  singleSharedPair: false,
  pairs: { Auckland: '18/18', Wellington: '16/15', Christchurch: '16/15' },
  detail: 'Implied-angle clusters are tight (sd ~0.05-0.06 deg): Auckland fajr 18.08 / isha 17.96 -> 18/18; Wellington fajr 16.14 / isha 15.08 -> 16/15; Christchurch fajr 16.07 / isha 14.99 -> 16/15. The federation sheet is per-city calculated, and the North Island city runs the standard 18/18 while the two southern sheets run 16/15.',
  wellingtonCoordinateNote: 'Wellington solar columns sit early vs the census coordinates (sunrise -4.3 min, dhuhr -1.5 min) while Auckland/Christchurch sit on ~0 — the Wellington sheet was likely computed for a slightly different grid point; the angle clusters are insensitive to this (~0.02 deg).',
  stability: 'Single Ramadan window on the surface; between-year stability not testable. Within-window residuals are flat (no drift across the 30 days).',
  limits: [
    'Ramadan 1447H window only (30 rows/city): fajr and isha angles are fitted inside a late-summer New Zealand window; high-latitude extrapolation outside it (especially winter twilight behaviour) is not vouched for.',
    'Sheet Ramadan 1 = 2026-02-19 while FIANZ Hilal confirmation printed 2026-02-20 (two-editions pattern, recorded at capture time).',
    'Wellington grid-point uncertainty noted above.',
  ],
};
L.writeJSON('nz-fianz.json', out);
console.log('composed nz-fianz.json');
console.log('Auckland exact:', JSON.stringify(out.cities.Auckland.exactScore));
console.log('Wellington exact:', JSON.stringify(out.cities.Wellington.exactScore));
console.log('Christchurch exact:', JSON.stringify(out.cities.Christchurch.exactScore));
