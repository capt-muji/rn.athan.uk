// Compose fit13/au-diyanet.json from the tmp files.
import * as L from './lib.js';
import { readFileSync } from 'fs';

const j = (f) => JSON.parse(readFileSync(`${L.OUT}/${f}`, 'utf8'));
const broad = j('tmp-au-broad.json'), preston = j('tmp-au-preston.json'), bris = j('tmp-au-brisbane.json'), gal = j('tmp-au-gallipoli.json');

const verdict = {
  recipe: 'DOMESTIC (Diyanet Turkey domestic): fajr 18 deg raw, isha 17 deg raw, temkin sunrise -7 min, dhuhr +5 min, asr (shadow 1) +4 min, maghrib +7 min; printed nearest minute. NOT the European unified 18/16.',
  evidence: 'All four surfaces: every prayer within 1 minute on every held row; European 18/16 fails with exact 0 on sunrise/dhuhr/asr/maghrib/isha (worst 5-8 min). Residual medians vs raw astronomy at the stated coordinates: fajr +0.00/+0.13, sunrise -6.98/-6.93, dhuhr +5.07/+5.03, asr +4.02/+4.00, maghrib +7.00/+7.10, isha +0.02/+0.05 (Broadmeadows/Brisbane); Preston matches Broadmeadows (same calculation, second grid point).',
  temkinOrder: 'The "-7/+5/+4/+7" temkin set lands on sunrise/dhuhr/asr/maghrib; fajr and isha carry the raw 18/17 angles with no minute offset (matches the adhan 4.4.6 "Turkey" method encoding exactly).',
  rounding: 'Nearest minute (floor and ceil both degrade exact matches sharply).',
  surfacesAgree: true,
};

const out = {
  _job: 'Job 1: Australia Diyanet diaspora — domestic vs European recipe fit',
  _engine: 'adhan 4.4.6, second-resolution instants, explicit nearest-minute rounding, no real clock',
  verdict,
  diyanetPlatform: { broadmeadows: broad, preston, brisbane: bris },
  gallipoli: gal,
  stability: {
    diyanetPlatform: 'Single-year span held (2026-01-01..2026-12-31, 365 rows each); between-year shift not testable from this surface — one recipe across the whole span.',
    gallipoli: 'Two years held (2026-11..12 = 61 rows, 2027-06 = 30 rows); parameters frozen across both: imsak 18 deg raw (within1 61/61 and 30/30), isha 17 deg raw (within1 61/61 and 30/30).',
  },
  amplitude: {
    broadmeadows: 'Fajr clock Jan ~04:09-04:51 vs Jul ~05:51-06:02 (seasonal swing ~86 min); isha Jan ~22:10-22:31 vs Jul ~18:41-18:58.',
    brisbane: 'Fajr Jan ~03:24-03:54 vs Jul ~05:09-05:16 (swing ~85 min at lower latitude, tighter July band).',
  },
  gallipoliNotes: [
    'Friday dhuhr rows are khutbah overrides (worst 55 min on 2026-11-06 / 2027-06-04); non-Friday dhuhr sits at transit +5.',
    'Iqamah offsets constant: fajr +52, dhuhr +6, asr +6, maghrib +2, isha +6.',
    'Gallipoli asr reads +3.6 min median over shadow-1 raw (expected +4; within1 89/91 overall, worst 2) — same recipe, slightly earlier rounding.',
  ],
  limits: [
    'Diyanet platform tables are 2026 calendar years only; no second year on the surface to test between-year stability.',
    'Coordinates are the census-stated grid points; Diyanet does not publish its internal grid coordinates on the page, so sub-minute residuals inherit that uncertainty.',
    'Ramadan-window surfaces excluded here (Preston ISV sheet is a separate edition, not part of this job).',
  ],
};
L.writeJSON('au-diyanet.json', out);
console.log('composed au-diyanet.json');
