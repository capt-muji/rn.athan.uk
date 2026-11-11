// Curated bundle for the between-year job: one file carrying the transcription
// inventory, both fits, the copy test, the register check and the verdict.
import { readFileSync, writeFileSync } from 'node:fs';

const fit47 = JSON.parse(readFileSync('dz-fit-1447.json', 'utf8'));
const between = JSON.parse(readFileSync('dz-between-year.json', 'utf8'));
const offs = JSON.parse(readFileSync('dz-offset-register-check.json', 'utf8'));
const a = JSON.parse(readFileSync('dz-alger-1447-jumada1.json', 'utf8'));
const d = JSON.parse(readFileSync('dz-djelfa-1447-jumada1.json', 'utf8'));
const r = JSON.parse(readFileSync('dz-adrar-1447-jumada1.json', 'utf8'));

const strip = (s) => ({ exact: s.exact, within1: s.within1, n: s.n, worst: s.worst, exactPct: s.exactPct, within1Pct: s.within1Pct });

const doc = {
  meta: {
    job: 'Algeria between-year test on the ministry annual calendars: Hijri 1447 against 1448',
    engine: 'adhan-js 4.4.6',
    site: 'Alger 36.7538 N / 3.0588 E, Africa/Algiers',
    method: 'Rounding.None then an explicit integer margin per column; angles scanned 15-21 (fajr) and 14-21 (isha); asr both schools; no clock read',
    tz: process.env.TZ,
  },
  transcription: {
    source: 'dz-marw-calendrier-1447-{alger,adrar,djelfa}.pdf via Wayback; page images only, no text layer',
    alger: [
      { file: 'dz-alger-1447-jumada1.json', hijri: 'Jumada I', page: 6, days: 30, window: ['2025-10-23', '2025-11-21'] },
      { file: 'dz-alger-1447-jumada2.json', hijri: 'Jumada II', page: 7, days: 29, window: ['2025-11-22', '2025-12-20'] },
      { file: 'dz-alger-1447-rajab.json', hijri: 'Rajab', page: 8, days: 30, window: ['2025-12-21', '2026-01-19'] },
      { file: 'dz-alger-1447-ramadan.json', hijri: 'Ramadan', page: 10, days: 29, window: ['2026-02-19', '2026-03-19'] },
    ],
    regional: [
      { file: 'dz-adrar-1447-jumada1.json', city: 'Adrar', days: 30, window: r.window },
      { file: 'dz-djelfa-1447-jumada1.json', city: 'Djelfa', days: 30, window: d.window },
    ],
    algerDays: fit47.frozen1448On1447.n / 6,
    continuity: 'month boundaries abut with no gap; rows run day for day; the 1447 book ends 2026-06-15 and the 1448 book begins 2026-06-16, so the two annual books share no Gregorian cell',
    readAudit: 'every column checked for a jump against the mean of its neighbours; no cell flagged at 2 minutes; the flat fajr run 06:29 over thirteen January days re-read at 12x and confirmed',
  },
  recipes: {
    r1448: {
      fajrAngle: 17.8,
      ishaAngle: 16.1,
      madhab: 'shafi',
      per: { fajr: '0/floor', sunrise: '+1/floor', dhuhr: '+1/floor', asr: '+1/floor', magrib: '+4/floor', isha: '+5/nearest' },
      note: 'fit2, 119 days of 1448, 626/714 exact',
    },
    r1447: between.recipe1447,
  },
  frozenTest: {
    r1448ON1447: strip(fit47.frozen1448On1447),
    r1448ON1448: strip(fit47.frozen1448On1448),
    r1447ON1448: between.transfer1447to1448,
    r1448ON1447reverse: between.transfer1448to1447,
    perPrayer1447: fit47.frozen1448On1447.per,
    perPrayer1448: fit47.frozen1448On1448.per,
    byMonth: fit47.frozenByMonth,
    signedResidualByMonth: fit47.frozenSignedResidual,
    anglesFrozenMarginsRefit: strip(fit47.frozenAnglesFreeMargins1447),
  },
  freeFit1447: {
    shafi: {
      fajr: between.constrained1447_fajr[0],
      isha: between.constrained1447_isha[0],
      recipe: between.recipe1447,
      scored: strip(fit47.free1447.shafi.scored),
      unconstrained: fit47.free1447.shafi.recipe,
    },
    hanafi: { scored: strip(fit47.free1447.hanafi.scored), note: 'refuted, worst 36' },
  },
  frozenMarginRidge: {
    fajr: between.frozenMarginRidge_fajr.filter((x) => [15, 16, 16.5, 17, 17.5, 17.8, 18, 18.5, 19, 20, 21].includes(x.angle)),
    isha: between.frozenMarginRidge_isha.filter((x) => [14, 15, 15.5, 16, 16.1, 16.5, 17, 18, 19, 20, 21].includes(x.angle)),
  },
  copyTest: {
    question: 'are 1447 and 1448 byte-identical on the same Hijri month-day cells, or independently computed?',
    finding:
      'independently computed. The printed difference between the same Hijri day one year apart reproduces adhan own year-to-year drift to a mean of 0.4 minutes and a worst of 1.15 minutes on every column, and no column repeats its values: a reprint would print a difference near zero instead of the 10-14 minute solar drift the pairing shows',
    summary: between.copyTestSummary,
  },
  offsetRegister: {
    source1447: 'dz-wilaya-offsets-1447.json (page 6 footer, 25 northern wilayas x 6 columns)',
    adrarInRegister: offs.adrarInRegister,
    djelfaInRegister: offs.djelfaInRegister,
    regionalScores: {
      alger: { totals: offs.alger.totals, per: offs.alger.per },
      djelfa: { totals: offs.djelfa.totals, per: offs.djelfa.per },
      adrar: { totals: offs.adrar.totals, per: offs.adrar.per },
    },
    printedVsAlger: offs.regionalVsAlger,
    adrarVsOranEntry: offs.adrarVsOranEntry,
    verdict:
      'the register is a display aid for 25 northern wilayas, not the computation. Each regional book is computed at its own coordinates with the frozen Algiers recipe (Adrar 180/180 and Djelfa 180/180 within one minute), while the register longitude-only rule misses the same books by up to 45 minutes (Adrar asr) and by up to 6.8 (Djelfa sunrise), and neither regional wilaya appears in the 25',
  },
  seasonal: {
    measuredSpanInHandMinutes: { fajr: 62, sunrise: 68, dhuhr: 30, asr: 68, magrib: 87, isha: 82 },
    measuredWindow: 'October to March only, both years',
    modelledAnnualSpanMinutes: { fajr: 171.1, sunrise: 151.1, dhuhr: 29.5, asr: 89.4, magrib: 155.6, isha: 170.1 },
    janToJulFajrMinutes: 154.9,
    note: 'the annual extremum of a 17.8 degree fajr at 36.75 N is unexercised by any printed month in hand',
  },
  verdict: {
    betweenYear: 'FROZEN',
    statement:
      'one recipe covers both Hijri years. Applied unchanged, the 1448 recipe reproduces 1447 at 620/708 exact and 708/708 within one minute, against 626/714 and 714/714 on its own year. Fitted independently on 1447 the same parameters come back: fajr 17.80 at margin 0 floor, its own 1448 value to the hundredth, and the solar columns on +1/+1/+4. Isha is the one column that moves: the 1447 fit prefers 16.30 at +4 (115/118) over the frozen 16.10 at +5 (113/118), a 0.2 degree step worth two cells of 118 and inside print resolution. The 1447 fit transfers back to 1448 at 626/714 exact, the same count the 1448 fit reaches on its own year, so the two fits describe one table.',
    generation: 'the values are freshly computed each year, not reprinted: the two books share no Gregorian cell (1447 ends 2026-06-15, 1448 begins 2026-06-16), and the same Hijri cells one year apart differ by exactly the 11-day solar drift, matching adhan own year-to-year difference to a mean of 0.4 minutes and a worst of 1.15',
  },
};

writeFileSync('dz-1447.json', JSON.stringify(doc, null, 1));
console.log('wrote dz-1447.json', JSON.stringify(doc).length, 'bytes');
console.log(JSON.stringify(doc.verdict, null, 1));
