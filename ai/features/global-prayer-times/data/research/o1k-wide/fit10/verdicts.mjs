// Attach verdict blocks to the three evidence files.
import { readFileSync, writeFileSync } from 'node:fs';

const P = (f) => new URL('./' + f, import.meta.url);
const read = (f) => JSON.parse(readFileSync(P(f), 'utf8'));
const write = (f, o) => writeFileSync(P(f), JSON.stringify(o, null, 1));

const id = read('id-highlands.json');
id.verdict = {
  claim_on_record: 'exactly six regencies (Puncak Jaya, Puncak, Intan Jaya, Lanny Jaya, Pegunungan Arfak, Paniai) run both twilights one degree deeper (21/19); Deiyai (1718 m) does not',
  result: 'CONFIRMED',
  measured_delta_vs_national_median: {
    fajr_depth_deg: +(id.deep_regencies.reduce((a, b) => a + b.fajr, 0) / id.deep_regencies.length - id.depth_quantiles_fajr.p50).toFixed(2),
    isha_depth_deg: +(id.deep_regencies.reduce((a, b) => a + b.isha, 0) / id.deep_regencies.length - id.depth_quantiles_isha.p50).toFixed(2),
  },
  measured_delta_isha_minus_maghrib_minutes: { deep: 74, deep_other_date: 75, deiyai: 70, deiyai_other_date: 71 },
  deep_count: 6,
  boundary: 'deeper pair at >=1786 m (Paniai); plain pair at 1718 m (Deiyai) and 1668 m (Jayawijaya). Threshold lies in (1718, 1786] m, consistent with about 1750 m.',
  pooled_fit: {
    deep_regencies_at_21_19: '12/12 exact on both twilights at +2 min floor',
    deep_regencies_at_20_18: 'fajr 10/12 exact, isha 7/12 exact at the best margin: refuted',
    the_other_510_at_20_18: 'fajr 1015/1020, isha 1007/1020 exact at +2 min floor',
    the_other_510_at_21_19: 'fajr 558/1020, isha 533/1020 exact: refuted',
    deiyai_at_20_18: '2/2 exact at +2 min floor',
  },
  elevation_is_used_elsewhere: 'the printed sunrise implies a horizon dip that tracks the stated elevation (2.4-2.5 deg below the geometric horizon at every highland regency), so the table computes at elevation and the 21/19 step is a separate rule, not an elevation formula',
  publisher_note: 'Muhammadiyah KHGT prints plain 18/18 at Puncak Jaya 3396 m (sea2), so the deepened pair is Kemenag policy alone',
};

const ke = read('kelantan.json');
ke.transcription_status = {
  result: 'BLOCKED: no verbatim Kelantan table could be transcribed',
  searched: 'sea2/captures (18 files, no image of any kind), thmsg/captures (Malaysia pass), and a filename scan of the whole o1k-wide tree for kelantan/zon1/zon2/jabatan',
  found: 'only text notes recording that the Jabatan Mufti posts monthly zon1/zon2 images on facebook.com/MUFTIKELANTAN; the poster images themselves were never banked',
  consequence: 'zon 1 and zon 2 rows of the mufti table remain unread; the recipe question is answered only for the JAKIM comparator',
};
ke.ktn01_recipe = {
  statement: 'at 6.1200 N / 102.2400 E the printed KTN01 columns sit at a fixed convention on all 365 days: subuh at sun depth 17.64 deg (17.49-17.80), isyak at 17.36 deg (17.18-17.51), zohor at true noon +2.6 min, asar at Shafi +2 min, maghrib at sunset +2 min, imsak = subuh - 10 min exactly',
  angles_read: 'the twilight pair is 18/18 minus 2-3 minutes, or 17.6/17.4 with no margin; angle and margin are not separable at one-minute print resolution',
  refuted: 'isha 17 (the KTN02 exception value) is outside the measurement by about 1 deg, i.e. 4 minutes',
  asr: 'Shafi confirmed (Hanafi worst 67 min)',
};
ke.flag_plus_one_minute = {
  sample: 'mufti-attributed 2026-03-18 subuh 06:10, syuruk 07:18',
  comparator: 'KTN01 2026-03-18 imsak 05:59, subuh 06:09, syuruk 07:17, zohor 13:22, asar 16:32, maghrib 19:24, isyak 20:29 (this file, row 2026-03-18)',
  finding: 'the +1 falls on subuh and syuruk together; a twilight angle cannot move syuruk, so the delta is a column or clock convention, not a recipe difference',
  unresolved: 'one sample from a third-hand mirror cannot separate a one-minute whole-table offset (0.25 deg of longitude) from a morning-pair convention; the mufti table itself would settle it',
};
ke.verdict = {
  zon1_zon2_against_jakim: 'unanswerable without the mufti tables: not evidence either way',
  plus_one_flag: 'resolved as a non-angular one-minute convention, not a different recipe',
};

const bf = read('burkina.json');
bf.verdict = {
  transcription: 'October 2025 read in full from the banked 1447 images, 31/31 days, every row cross-checked against a second independent read and against the printed weekday; August 2025 read for the two twilight columns over 29 days',
  one_recipe_holds: 'YES for every computed column',
  cross_edition_delta_minutes_october: bf.delta_summary,
  detail: {
    fajr: 'same twilight angle both editions (17.6 deg, margin -1 in 2021 and +4 in 2025, 31/31 exact each); printed 5 minutes later in 1447 on all 31 October days and on 25 of 29 August days, +4 or +6 on the four block-edge days',
    dhuhr: 'the same 12:25 block in both editions, identical to the minute on all 31 days',
    asr: 'Shafi (Hanafi refuted, worst 56 min), a coarse 5-minute block; identical values, block boundary one page apart',
    maghrib: 'the printed azan is the sunset instant: 31/31 within 1 min in both editions, 18/31 exact each',
    isha: 'not a computable column in either edition: a hand-set 5-minute block walk, re-set in 1447 (5-10 min later in October, identical values with boundaries one or two days apart in August)',
  },
  what_changed: 'the fajr azan gains a fixed 5 minutes in the 1447 edition with no change of angle; everything else sun-anchored is unchanged; the isha block walk was re-set',
  dhuhr_doctrine: {
    record: 'the six byte-identical Ouagadougou platform records sit at noon +33, recorded as unresolved doctrine vs data entry',
    measured_2021_annual: 'the printed dhuhr is a clock block, not a noon offset: 12:30 Jan-Mar and Jun-Aug, 12:45 in the two Ramadan months, 12:25 Sep-Dec',
    offsets_vs_true_noon: 'block means run from +10.2 (February) to +42.2 (May); October is +33.0 and November +33.7',
    settlement: 'noon +33 is the platform normalisation at the season of capture, not the federation printed convention',
  },
};

write('id-highlands.json', id);
write('kelantan.json', ke);
write('burkina.json', bf);
console.log('verdicts written');
