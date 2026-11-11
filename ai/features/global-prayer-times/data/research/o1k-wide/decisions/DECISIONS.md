# Owner decisions: O1k wide night, 2026-11-10

One sheet for the owner. Every open decision the night created or touched, numbered so a
reply can be one line per item, such as `D3: a`, `A1: b`, `R6: keep`. The measurement that
drives each one is stated with it. Evidence lives in `CONSOLIDATION.md`,
`wtdiff/WORLD-TABLE-DIFF.md`, `night-summary/NIGHT-SUMMARY.md` and the 34 wave and fit
reports under `$HOME/athan-gitree/census/o1k-wide/`.

---

## 1. Tonight's new decisions

Fifteen. Where the evidence points one way the recommendation is marked. Where it is a
preference, the item says so.

### D1. Fiji: which of the two standing editions is THE timetable

Two authority editions disagree, stable across two months: dhuhr +5 constant, maghrib +2 to
+3, isha +6 to +10, fajr, sunrise and asr within 1 minute, worst gap 9 minutes. The sheet's
maghrib equals the widget's iqamah column every day. The widget has posted December 2026
(61 rows). The December 2025 sheet (31 rows) is the year evidence.

- a. The widget is the timetable and the sheet is carried as a second edition behind an `editionId`.
- b. The sheet is the timetable and the widget is carried as the second edition.
- c. One edition only, the sheet dropped.

**Recommendation: a.** The widget generates by date and is the only surface that posted a
dated December. The sheet's months are year-agnostic images. Either way a fit names its
edition.

### D2. Yemen: which feed the country row is fitted on

Both feeds are captured and neither is fitted. The recognised government's Aden month (six
cities, 30 rows, 2025-2027 selector) sits 13.3 minutes later at fajr and 14.2 later at isha
than the Sanaa API, with dhuhr +0.9. They cover disjoint geography: Sanaa serves 31 locations
including the capital on a 10-day retention, the government feed covers six cities and
nothing in Sanaa.

- a. The government feed is the country row.
- b. The Sanaa API is the capital row, by daily accrual.
- c. Both, as two rows.

**Recommendation: c, then a if only one is wanted.** A single recipe cannot serve two
geographies 13 to 14 minutes apart, and the capital has no other source.

### D3. The frozen-generation precedent: five surfaces, which side each falls on

The precedent (#6986) says a relabelled-identical table is one year of evidence. Five
surfaces now stand on it.

- **Botswana, one generation.** 146 of 151 monthly tables byte-identical 2021-2026, five typo
  fixes, no time value changed. The grade-A year path is closed.
- **Maldives, one generation.** One 365-row yearless annual table per island, and a 2027
  request returns the same January slot. Year-2 untouched.
- **Sri Lanka, one generation.** 12 zones still served from `uploads/2026/10`, third
  observation, zone 03 byte-identical after a title fix.
- **Belgium, one generation.** 2025 and 2026 print identical MM-DD times with baked DST
  dates, 363/365 month-days identical. The second year adds nothing.
- **Algeria, outside the precedent.** 1448 is a fresh computation rather than a reprint: no
  Gregorian cell is shared with 1447 and the printed differences track the sun to 1.15
  minutes. The 1448 recipe applied unchanged to 1447 holds 708/708 rows within 1 minute, and
  fajr is 17.80 in both.

The ruling:

- a. Precedent as written, Algeria outside it: four surfaces stay one generation, Algeria counts as a real two-year span.
- b. Rule a perpetual table a distinct generation, which contradicts #6986 and would let Botswana and Sri Lanka reach A on one table.
- c. Treat Algeria as reprinted, which blocks its span.

**Recommendation: a.** It is the only reading the five cases support without editing the
precedent.

### D4. Burkina Faso: does the 1447 edition replace the fit

The 1447 edition prints fajr 5 minutes later on every day at the same 17.6 degrees, margin -1
to +4, and the isha block walk was re-set. Every sun-anchored column is identical to the 2021
edition. The 1447 edition is the current publication.

- a. Refit on 1447 and keep 2021 as the between-year witness.
- b. Keep the 2021 fit and record the 5-minute shift as unresolved.
- c. Carry both editions behind an `editionId`.

**Recommendation: a.** Keeping the 2021 fajr would print 5 minutes early every day.

### D5. Morocco: is the conditional A resolved

The ministry's rebuilt portal serves the tables itself: `data/horaires-2026-MM.js`, 190 cities,
`fuseau:GMT`, October and November 2026 live. Rabat's November rows reproduce the census
recipe 100 per cent within 1 minute. The condition asked for the ministry's own data, and
the record already holds three distinct years (2024, 2025, 2026 Wayback months) on a frozen
recipe.

- a. Rule the conditional resolved and set grade A.
- b. Keep the conditional until a second year of the rebuilt surface.

**Recommendation: a.** The evidence the condition named now exists on the publisher's own
domain.

### D6. Nigeria: which line is "measured practice"

The only printed tables are three mosque monthlies on Masjidway (Abuja and two in Ikorodu)
whose printed method line is Egyptian 19.5/17.5, fitted at RMSE 0.30 and 0.24. On the same
rows MWL 18/17 scores 2.67 and ISNA 8.69, and Hanafi asr misses by 55 minutes. The national
platform prayertimesnigeria.com computes MWL 18/17 and is the only national layer.

- a. Egyptian 19.5/17.5 is the measured practice, at community tier.
- b. MWL 18/17 stays the tier-2 assignment as recorded.
- c. Both, by city.

**Recommendation: a.** It is the only line printed by a publisher. The caveat is one
platform in two cities, not a council ruling, and the record should say so.

### D7. New Zealand: Ramadan starts Thursday or Friday

FIANZ's successor domain serves 33 city Ramadan sheets that start Ramadan on Thursday 19
February 2026, while the federation's own Hilal Committee announces Friday 20 February. Both
are FIANZ, so the split is inside one body.

- a. The announced date is Ramadan 1 and the table's own times for each date stand.
- b. The printed table's date governs.
- c. Carry both and display the announced date.

**Recommendation: a.** The architecture already ships announced Ramadan windows for every
Ramadan-dependent rule (Saudi's +120 isha), so this settles the standing Hijri display ruling
in the same move.

### D8. Kemenag's six-regency 21/19 rule: regional exception or flatten

Exactly six regencies at or above 1,786 m print both twilights 1.0 degree deeper (21/19,
about 4 minutes). Deiyai at 1,718 m prints 20/18 and no seventh member exists in 516.
Muhammadiyah prints plain 18/18 at Puncak Jaya's own 3,396 m, so the rule belongs to the
publisher's policy rather than to the terrain.

- a. Ship the six as a named regional exception in the Indonesia recipe.
- b. Flatten to 20/18 nationally.

**Recommendation: a.** Six rows of data reproduce the printed minutes at all six study
cities, where flattening misses by about 4 minutes.

### D9. Taiwan: which edition's city-offset table to bake

The rule is stable across three editions (fajr sunrise -70, isha maghrib +90, dhuhr noon +19)
and the per-city offset table moves in every edition except two cells. 1447 is the only
complete year and every edition is Ramadan-only.

- a. Bake the 1447 offset table with its edition stamped.
- b. Bake the rule and drop the city offsets.
- c. Wait for a year-round table, which has never existed.

**Recommendation: a**, and keep Taiwan at candidate because the year-round surface is still
missing.

### D10. Libya: proxied daily read or stay on Muazzin

The awqaf widget is authority tier, covers 22 cities and sits behind a Cloudflare human
challenge. One proxied Tripoli day is recorded. The record stands on Muazzin.

- a. Accept a proxied daily read.
- b. Stay on Muazzin and keep the widget recorded as closed.

**Recommendation: b.** The standing rule forbids solving a challenge, and one city-day is
not a series.

### D11. Iran: one day of status or close the watch

Every path carries a JS cookie challenge, so the 1406 status cannot be verified. The object's
14-degree isha is a software default that Iran itself never publishes.

- a. Accept one day of status through the challenge.
- b. Keep the recorded state and close the watch.

**Recommendation: b.**

### D12. Nigeria's two blocked leads: do the standing rules bend

The National Mosque schedule is app-only (six fixed values baked into a static page) and
LEMU's Lagos monthly table is an image behind Facebook login. Masjidway now yields a fitted
mosque line without either.

- a. Keep public pages only and close both leads.
- b. Admit app-hosted and login-walled artifacts with a caveat.

**Recommendation: a.** Both leads sit one screen behind a gate and the fitted line no longer
depends on them.

### D13. Pakistan: the unified calendar watch

The federal chart is fitted (366 rows). Its twin-city 2026 unified edition is unpublished on
both ministry registers, checked today, and that edition is the second artifact that would
carry Pakistan past one year.

- a. Recheck each January and close the watch if the 2027 edition also fails.
- b. Recheck mid-year only.
- c. Close the watch now.

**Recommendation: a.** It is the record's largest single watch and the cheapest test of
whether the state timetable is real.

### D14. Adopt the night into the world table

The diff is 7 new row-slots (Guatemala, Honduras, Venezuela, Luxembourg, Belarus new, Latvia
and Lithuania rewritten from FALLBACK stubs), 78 changed rows, 16 grade movements and 8
schema rule-forms. Five log-versus-report conflicts are resolved report-over-log.

- a. Adopt the whole diff, with Morocco's A following D5 and the frozen-generation cases following D3.
- b. Adopt the new rows and the grade rises, hold the recipe corrections.
- c. Hold the diff until the decisions above are answered.

**Recommendation: a.**

### D15. Record repairs: five mechanical edits

- Kyrgyzstan's ratio is written with the sign flipped. The magnitude, 7/9, is the rule.
- `FIT-RULES.md` is missing at the path two agents were given.
- Kelantan's "KTN01 isha 18 / KTN02 isha 17" split does not exist. Both zones are 18/17 at different reference points.
- Benin's row must stop claiming a Cotonou table. The capture is Kandi and has no publisher.
- Oman's `CityID=2` is Adam, not Muscat, and the runbook example used it.

The call:

- a. Apply all five.
- b. Apply the first two only.

**Recommendation: a.** All five are mechanical and none changes a grade.

---

## 2. The pre-existing seven rulings

Restated, unchanged. Two are still open and are marked so.

- **R1. Grade ruling (T-667 #6943).** A needs 2 to 3 distinct years on one recipe, provisional is one published cycle, community is a fitted non-authority surface, candidate has dated data and no fit, F is structurally closed, and FALLBACK ships a named computed method with a one-line reason.
- **R2. Frozen-generation precedent (T-668 #6986).** Byte-identical editions across years are one computed generation and never lift provisional to A, however many years they span.
- **R3. Masjidal two-layer rule.** The athan layer is the platform's generated times and the iqamah layer is tenant-bounded, so the two are never read as one table.
- **R4. Per-edition constants (north Cyprus).** A publisher's constant is carried per edition and never across them. North Cyprus 2025 sits 2.4 minutes behind 2026 on every prayer through one additive term.
- **R5. Platform timezone fields are untrustworthy at ingest.** A feed counts as evidence only once gated against its own live page, and tonight added two defect classes that keep the rule: a single-month DST block and a whole-DST-window shift with sunrise exempt.
- **R6. Fazilet London madhab. Open.** The live 2026 engine prints Shafi ikindi where the 2010 print was Hanafi +6, and the UK rule-change ruling has never been made.
- **R7. Mawaqit bulk enumeration. Open, parked.** Every mawaqit gain tonight came from a single mosque page found by search, so every mawaqit country's negative is a lower bound until the owner rules.

---

## 3. The architecture four

### A1. The sub-45 latitude fallback pair

18/18 Shafi scores 3.38 minutes population-weighted against national authorities (fajr 3.30,
isha 3.56) and wins every aggregate column, but no live worldwide body publishes it: ISNA
moved to 15/15 in 2017 and Karachi is a South Asian body whose home practice is Hanafi asr.
MWL 18/17 scores 4.22 (isha 5.35) with a worldwide body behind it. Either choice amends the
world table's blanket Moonsighting fallback, which the seasonal audit shows is the wrong
low-latitude family.

- a. 18/18 Shafi below 45 degrees, with the pair named and no body claimed.
- b. MWL 18/17 below 45 degrees, with the body named.

**Recommendation: a.** The band is badged as computed either way, and the pair is 0.84
minutes closer everywhere.

### A2. The promise wording

The proposed canonical sentence is: "Athan shows you the prayer times exactly as your chosen
authority publishes them. It never calculates a time of its own, never adjusts one, and never
fills a gap with a guess." The fallback band computes by construction, so that sentence is
false for 41 FALLBACK countries and every unrecorded one as drafted.

- a. Adopt it for authority-served countries and add the fallback clause, with the badge carrying the exception.
- b. Reword it once to name the fallback in the same sentence.
- c. Drop the "never calculates" clause.

**Recommendation: a.** The rest of the claim is absolute and testable, and the exception is
one named sentence.

### A3. Asr: recorded as decided, listed for completeness

Every national authority measured publishes one Asr and it is the standard factor-1 column,
while Hanafi bodies print both side by side. So `asr` is the source's primary column, fixed
per country, and `asrAlternate` is populated only where the publisher prints a second. No
user choice exists where the authority offers none.

### A4. The T-42 plan

The architecture (R3) is settled except A1, the world table is the plan's base artifact, and
the plan document waits on the owner's go.

- a. Go now, with A1 named in the plan as its one open parameter.
- b. Go after A1 is answered.
- c. Hold.

**Recommendation: a.** The plan can carry one open parameter, and the research is complete.

---

## 4. The watches

Not decisions. Each is dated and each closes on evidence.

- **W1. Brunei, mid-December 2026.** The MORA OData list still ends 2026-12-31 and the 100-list catalogue holds no second prayer list.
- **W2. Kosovo, late December 2026.** No 2027 BIK takvim exists, and last year's edition landed 14 January.
- **W3. Chile, about 29 November 2026.** December publishes then. Vina del Mar's link has pointed at the October file for three months while the current file sits unlinked.
- **W4. Sri Lanka, monthly.** Twelve zones still serve from `uploads/2026/10`, the third observation. A regenerated edition is the lift.
- **W5. The daily-accrual crons.** Sanaa retains 10 days and Libya and Iran sit behind challenges, so accrual needs a host and a cadence. The open call is host and cadence, not whether to accrue.

---

## Assumptions

- **The pre-existing seven are the census README's standing items, split as follows.** The
  README carries four standing caveats and five outstanding owner calls. The multi-year grade
  ruling is stated separately from its frozen-generation precedent, and Morocco, Fiji and
  Yemen move into section 1 as tonight's decisions, which leaves seven standing items.
  Evidence: `ai/features/global-prayer-times/data/census/README.md` lines 15-21.
- **Nigeria's measured practice is the printed mosque tables.** `nigeria3/REPORT.md` exists
  with three fitted tables, so `wtdiff/WORLD-TABLE-DIFF.md`'s assumption that nigeria3 landed
  nothing is stale. Evidence: `nigeria3/REPORT.md` section Fit.
- **"Sub-45" means the fallback band below 45 degrees latitude.** Evidence:
  `o1j-review/R3-ARCHITECTURE.md` section 1.3 and section 6.
- **Fiji's widget is the date-generated surface.** The December 2026 capture is 61 dated
  widget rows, the sheet is a month image. Evidence: `oceania2/REPORT.md` section Fiji.

