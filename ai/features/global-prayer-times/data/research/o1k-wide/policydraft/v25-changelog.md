# Changelog v2.4 -> v2.5 (DRAFT)

Policy-layer update pack drafted by the policydraft agent, O1k nine-hour research operation,
2026-11-10. DRAFT: nothing is committed and `policy-layer.v2.4.json` was only read. The build
session applies this pack in one pass after the owner answers `decisions/DECISIONS.md`. Entry
detail lives in `v25-objects.json`; the ordered apply list lives in `apply-checklist.md`.

## from / to

- from: 2.4.0 (C49, 69 objects)
- to: 2.5.0-draft.1 (87 objects)

## counts

- new objects 18, amendments 14 (of which 1 ungated, 13 gated; 18 new objects all ride D14).
- gates: D14 x27, D3 x1, D5 x1, D7 x1, D15 x1, ungated x1.
- projected object grades: **A 20, provisional 34, candidate 18, community 15, F 0** (87).
  From v2.4's A 16, provisional 34, F 1, candidate 14, community 4: A adds Tunisia, Iceland,
  Geneva and NL-VIN; F's only holder (EU-DIYANET-UNIFIED) lifts to provisional; Djibouti leaves
  candidate. Two of the A moves are contested and flagged below.
- world-table row moves inside the pack: Pakistan FALLBACK -> provisional; Latvia and Lithuania
  FALLBACK stubs -> data rows; Denmark's reading corrected to the outlier's provenance.
- Malta: excluded, unevidenced (no FIT-INDEX entry).

## added (18)

PK-NIZAM-E-SALAT (Pakistan federal, provisional), SN-CERFI, ML-ALMADINA, GN-NONO,
SO-MWAQIT (first Somalia/Somaliland data), GT-ALDAWA, HN-CENTRO-ISLAMICO, VE-CARACAS,
LU-SHOURA, BY-ISLAMBEL, LV-LIKC, LT-MUFTIATE, NC-NOUMEA, MU-JUMMAH, IT-ROMA, CH-GENEVA (A),
NL-VIN (A), NO-JAMIAT.

Two of the eighteen carry brief labels that were listed under amendments but require new
objects because v2.4 has none: NL-VIN ("Netherlands stated-method") and NO-JAMIAT ("Norway
third line = MCW"). Two brief labels listed under new countries are amendments because the
objects already exist: DJ-COMMUNITY and NZ-FIANZ.

## gradeMoves

| id | from | to | why |
| --- | --- | --- | --- |
| TN-INM | provisional | A | seven years 2020-2026, 2,557 days, one frozen recipe, 94.2 pc of days with every column within 1 (O1k-D2 deep2); 2025 is a recomputation, not a reprint |
| IS-FELAG | provisional | A | three years, two cities, 2,190 rows, 100 pc within 1, computed-not-copied years (O1k-D3 deep3) |
| EU-DIYANET-UNIFIED | F | provisional | the named gap closes: Koeln/Berlin/Frankfurt full years, 1,095 rows, one year (O1k-F4 fit4) |
| DJ-COMMUNITY | candidate | community | fitted cluster recipe, MWL 18/17 zero margins, five of six mosques (O1k-F5 fit5); the diff writes provisional, the fit index writes community - owner reconciles at ratification |
| Pakistan (row) | FALLBACK | provisional | first authority dated table, method fitted (O1k-W17, O1k-F1, O1k-V3) |

Contested A moves, flagged in the entries: CH-GENEVA rests on three scored Hijri years with
recomputation between 1447 and 1448 unproven by cell diff; NL-VIN's two distinct years satisfy
R1 but WORLD-TABLE-DIFF 2.1 row 7 writes "provisional (measured)".

## statusMoves

- EU-DIYANET-UNIFIED published-scheme -> fitted (served tables measured, not sampled).
- NZ-FIANZ surface-only -> fitted (fit13's three-city fit).
- DJ-COMMUNITY surface-only -> fitted.
- GN-NONO is created partial, not fitted: the fajr column reproduces under no standard recipe.

## corrected

- JO-AWQAF: evidence.fitYears 0 -> 8, multiYearProven false -> true, years -> 2021-2026,
  measuredDays -> 579. The object's own gradeBasis already said "fitYears 8"; the fields were
  never written up. UNGATED.
- MA-HABOUS: the conditional A's resolver landed - the rebuilt ministry portal
  (`data/horaires-2026-MM.js`, 190 cities, `fuseau:GMT`) reproduces the census recipe at
  100 pc within 1 on Rabat's November rows. Grade A unconditional behind D5.
- OM-MARA: span doubled to eight years (2,920 days, every column within 1 every day); the
  51 repaired dhuhr cells and the CityID=2-is-Adam trap recorded (the trap is D15's item 5).
- IS-FELAG: the December +90 display rule is DROPPED (fires on zero days in any year); the
  high-latitude mechanism is the angle-derived portion, not a clamp.
- EU-DIYANET-UNIFIED: 18/16 confirmed as the European pair at served-table level; the domestic
  temkin measured (sunrise -6.5, dhuhr +5.5, asr +3 shadow-1, maghrib +6.5), never transplanted
  on assumption.
- BE-EMB: the 17-degree isha object refuted (outside-window isha 18.0, RMS 0.52); window
  boundaries measured and encoded - flat plateaus (21 days at 23:26, 17 at 23:33) plus a
  latitude-45 middle arc, fajr floored at 03:24 with a 44.75-degree arc; year-2 closes as a
  frozen reprint behind D3.
- HK-MASJIDAL: withdrawal note extended - the Trustees' print is three constructions on one
  sheet; the feed matches neither page's dhuhr or maghrib (worst 49 minutes); per-column
  provenance becomes mandatory.
- MY-JAKIM: the "KTN01 isha 18 / KTN02 isha 17" split does not exist; both Kelantan zones are
  18/17 at different reference points (zon2 solves ~4.4-4.9 N / 101.6-101.9 E). D15 item 3.
- SE-MOSQUE: mechanism corrected - the mosque layer is Diyanet's engine (sunrise -6.5, dhuhr
  +5.5, maghrib +6) on the IF 18/16 line; "January fajr frozen 06:25" is a smooth V with a
  solstice plateau, not a freeze and not frozenLatitude45 (fits 0/118 days).
- NZ-FIANZ: surface restored on fianz.com; NOT one pair - Auckland 18/18, Wellington 16/15,
  Christchurch 16/15; the printed offsets hold verbatim; the Ramadan-start contradiction
  (sheets Thu 19 Feb, Hilal Committee Fri 20 Feb) rides behind D7.
- TN-INM: per-column rounding corrected (fajr/isha/dhuhr nearest, maghrib rounded up, asr
  floor); verify3 caught the storage bug - the frozen recipe scores 94.21 pc with the corrected
  modes and 81.8 pc under the stored mode. Fix the stored mode before any build reads the object.
- WORLD-ROW-DENMARK: the 15-degree day-fit traced to salah.dk, the outlier; the capital's
  mosques read 18/16 and Tehran-family. Fact survives, representativeness does not.
- WORLD-ROW-IN-PK: Pakistan leaves FALLBACK (via PK-NIZAM-E-SALAT, watch D13 for year-2);
  India holds with negatives re-confirmed.

## schemaAdditions

Seven rule-forms the night forces (the brief's list), each with the measurement that requires
it. Field shapes proposed in `apply-checklist.md` section 3.

1. **Clock ladder** - a dated value schedule with a grid and named switch dates, beside the
   angle and never as a margin (Pakistan isha: 11 values on the quarter grid through ~19
   switch dates; the two-phase federal dhuhr window 13:00/13:15 folding into the same form).
2. **Window grammar (interval pairs)** - per-day window rows where the LEFT BOUND IS THE
   INSTANT (Tajikistan: isha left = printed maghrib + 90 at 90.3 pc; dhuhr a wall-clock
   constant in two eras).
3. **Two-dawn intervals** - two dawn fields plus a flag that the printed sunrise column is not
   sunrise (Senegal: Fajar = sunrise - 75.5, Suba = sunrise - 60.5, both 365/365).
4. **Flat plateaus and substitution windows** - per-prayer seasonal windows with measured
   boundaries beside the stated ones, plus a plateau value type (Belgium; Belarus's cap pair).
5. **Three-group offsets** - an offset group binding several prayers to one constant (Serbia:
   fajr with sunrise, dhuhr alone, asr with maghrib and isha).
6. **Elevation-keyed exception set** - a named exception set keyed to a publisher, never an
   elevation formula (Kemenag: six regencies at or above 1,786 m deepen BOTH twilights 1.0
   degree to 21/19; Deiyai at 1,718 m untouched; no seventh member in 516; Muhammadiyah prints
   plain 18/18 at Puncak Jaya's 3,396 m - policy, not physics; ships when D8 rules).
7. **Edition identity** - an `editionId` on the policy object so two standing authority
   editions coexist (Fiji's widget-vs-sheet 9-minute split behind D1; New Zealand's
   table-vs-announcer split behind D7).

Supporting forms recorded with their evidence: summer caps as date-bounded clock bounds
(Netherlands 03:30/23:30, Kitchener 22:10 x89, Belarus 07:16/23:06, Glasgow 01:33 x96);
seasonal scheme swap (Latvia 12/12 summer - 15/15 winter); per-column rounding as recipe
(Tunisia, Oman). One builder rule, not schema: the publisher's engine is part of the recipe -
a PrayTimes v2-family engine reproduces the platform tables at zero margins where adhan
reports a phantom -1 dhuhr margin and a +/-1.2 minute asr skew on the same rows.

## hygiene

- The pack carries `draftProvenance` on all 32 entries (source workspace, rows held, span
  verdict, grade candidate, gate); strip it when folding into the policy layer.
- commentRefs carry workspace citations (O1k-<wave|fit>), not board numbers: the build session
  mints T-669 numbers at apply time.
- Grade conflicts between the fit index and WORLD-TABLE-DIFF (community-vs-provisional on
  SN/ML/GN/SO/GT/HN/VE/LU/MU, A-vs-provisional on NL-VIN) are recorded per entry; the fit
  index governs this draft.

## not carried (the boundary)

Diff items with no entry in this pack, for the owner's sight: Estonia's 2-year one-parameter
span (fit index grades its entry A-candidate; the diff wrote provisional), Kyrgyzstan's
2027-2035 span and A candidacy plus its D15 ratio-sign repair, Algeria's frozen-recomputed
two-Hijri-year provisional, Togo's year-complete community line, Taiwan's FALLBACK -> candidate
overturn (44 rows, three editions), Gambia's year-2 condition met, Botswana/Maldives/Sri Lanka
frozen-generation notes (all behind D3), Saudi/Kazakhstan/Singapore span widenings, Bosnia's
live frozen signature, and Nigeria's first fitted mosque line (Masjidway Egyptian 19.5/17.5,
behind D6). Each is evidenced in FIT-INDEX.json or WORLD-TABLE-DIFF.md and needs only an
entry, not new research.
