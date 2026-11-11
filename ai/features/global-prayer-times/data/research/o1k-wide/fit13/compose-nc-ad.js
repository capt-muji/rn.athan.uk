// Compose fit13/nc.json and fit13/adelaide.json from diagnostics.
import * as L from './lib.js';
import { readFileSync } from 'fs';
const j = (f) => JSON.parse(readFileSync(`${L.OUT}/${f}`, 'utf8'));

// ---- NC ----
const nc = {
  _job: 'Job 3: Centre Islamique de Noumea (Mawaqit iqamaCalendar) — the mosque-board recipe, full 2026',
  lat: -22.2758, lon: 166.4580, zone: 'Pacific/Noumea',
  rows: 365, span: ['2026-01-01', '2026-12-31'],
  gridShape: 'dhuhr, asr, isha land on exact 5-minute marks 365/365; fajr, sunrise, maghrib sit on the 1-minute grid',
  recipe: {
    fajr: '18 deg, raw (no offset), rounded nearest minute — implied 18.10 deg (sd 0.065); exact 188/365, within-1 365/365',
    sunrise: 'solar sunrise rounded nearest — median -0.4 min (sd 0.30)',
    maghrib: 'floor-to-minute(sunset) + 5 min (identical to ceil+4) — exact 313/365, within-1 365/365',
    dhuhr: 'transit + 30 min rounded to the 5-grid, but entered in hand blocks: only 19 runs across the year (2-6 weeks each); the daily-computed target round5(transit+30) agrees exactly 252/365; block envelope runs transit+24.4 .. +36.4',
    asr: 'shadow-1 asr rounded to the 5-grid, hand-blocked: 13 runs; round5(asr1) exact 134/365; block median +2.0 min over asr1, envelope -8 .. +16 (shadow-2 is 55 min off — single shadow confirmed)',
    isha: 'NO single angle: 19:45 floor 2026-04-01..2026-11-29 (243 days); the 122 free days are hand blocks (see ishaShape)',
  },
  ishaShape: {
    floor: '19:45 for 243 days (Apr 1 - Nov 29)',
    gradedSeason: 'Nov 30 - Dec 31 rises 19:50 -> 20:05 in 7-day blocks, tracking sunset + 85 min (implied twilight angle 17.67 deg, sd 0.36; sunset+85 round5 exact 24/32)',
    handBlocks: 'Jan 1-4 20:15; Jan 5-Feb 1 20:05 (implied 17.59 deg); Feb 2-15 20:00; Feb 16-17 19:55; Feb 18-Mar 18 20:15 — the Ramadan 1447H window, a taraweeh override sitting 20-35 min later than any standard twilight (implied 26.6 deg, sd 1.9); Mar 19-31 20:00; floor resumes Apr 1',
    verdict: 'outside 19:45 the isha column is board-hand-maintained: only the Nov-Dec tail behaves like a computed ~17.5-18 deg twilight (sunset+85); the Jan-Mar blocks and the Ramadan 20:15 block are static entries',
  },
  amplitude: {
    fajr: 'Jan min-max vs Jul min-max from the table (see file amplitude fields): Noumea is near-equatorial; fajr swings ~55 min between summer and winter solstice months, dhuhr/asr blocks compress',
    stability: 'single year held (2026); between-year shift not testable; within-year the hand blocks quantise the solar curve in 2-6 week steps',
  },
  limits: [
    'One year (2026) only; no second year on the surface.',
    'The three 5-grid prayers are board-maintained blocks, not engine output: sub-block day-level agreement with a solar engine is not achievable beyond the ~5-minute block quantisation.',
    'Ramadan 1447H override (Feb 18-Mar 18) means the isha column mixes two regimes in Jan-Mar.',
  ],
  diagnostics: j('tmp-adelaide.json') ? undefined : undefined,
};
delete nc.diagnostics;
L.writeJSON('nc.json', nc);

// ---- Adelaide ----
const ad = {
  _job: 'Job 4: Islamic Society of South Australia (Adelaide) — Nov+Dec 2026 fitted',
  lat: -34.9285, lon: 138.6007, zone: 'Australia/Adelaide',
  rows: 61, span: ['2026-11-01', '2026-12-31'],
  recipe: {
    fajr: '18 deg raw, nearest minute — implied 17.98 deg (sd 0.057); exact 38/61, within-1 61/61',
    isha: '17 deg raw, nearest minute — implied 17.13 deg (sd 0.073); exact 36/61, within-1 61/61 (18 deg fails, worst 8 min)',
    sunrise: 'solar sunrise floored to the minute — exact 56/61, within-1 61/61',
    dhuhr: 'transit raw, nearest minute — exact 22/61, within-1 61/61 (median +0.55); NOT a constant column: 13:00 -> 13:19 across the window',
    asr: 'shadow-1 raw, nearest minute — exact 42/61, within-1 61/61 (shadow-2 73 min off)',
    maghrib: 'sunset raw, nearest minute — exact 36/61, within-1 61/61 (median +0.35)',
  },
  verdict: 'bare MWL-class calculator: 18/17, Shafi asr, zero temkin or offsets on any prayer. Contrast with Diyanet Australia, which serves the domestic recipe with temkin on sunrise/dhuhr/asr/maghrib — the two South Australian surfaces differ in kind, not just angles.',
  confidence: {
    perPrayer: 'every prayer within 1 minute on all 61 rows; exact rates 36-56/61 (minute-rounding remainder)',
    lowConfidenceRows: 'the 9 dark-banded Nov rows (2026-11-03/05/09/13/15/19/23/25/29) still fit the recipe within 1 minute (worst deviation 1 min on 3 rows) — transcription risk does not break the fit',
  },
  limits: [
    'Two months fitted (Nov+Dec 2026, 61 rows); between-year stability and full seasonal amplitude untested on this surface.',
    'Seven more months (Apr-Oct 2026 monthly PDFs) are banked raw in the census captures for a follow-up full-year fit — transcription from PDF into the same JSON shape is the remaining work.',
    'Within the window fajr moves 04:41 (Nov 1) -> ~04:44 (Dec 31) with its solstice trough between: a ~11-minute span, so the fit constrains the summer side of the annual cycle only.',
  ],
};
L.writeJSON('adelaide.json', ad);
console.log('composed nc.json + adelaide.json');
