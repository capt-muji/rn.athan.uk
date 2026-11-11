# Owner decisions, addendum: O1l city-level round, 2026-11-11

Second sheet to `o1k-wide/decisions/DECISIONS.md`. Twenty items this round created or reopened,
numbered so a reply can be one line per item, such as `O1: c`, `O9: as recommended`.

Read-only against the record. Nothing here edits `world-table-v3.md` or
`policy-layer.v2.5.json`. Evidence lives in `CONSOLIDATION.md` (57 blocks),
`wtdiff2/WORLD-TABLE-DIFF-ROUND2.md`, `summary/ROUND-SUMMARY.md`, `corrections/CORRECTIONS-ROUND.md`
and the workspace named with each item.

Two bases. The world-table diff closed at 06:34Z against 52 blocks. Blocks landed after that cut
and are in `CONSOLIDATION.md` (il-ps, westafrica2, germany-districts, nz-finish, masjidi,
second-witnesses, capitals3), and one workspace has no block at all (`final-sweep`, O1l-67). This
sheet reads all of them, so two of its items (O14, O15) carry evidence newer than the diff.

Where the lead took an agent-ruled answer under the 2026-11-11 hands-off order, the item says
**Ruled** and names the source (T-675 rulings, or the o1k apply). Where none was taken, the item
says **No ruling taken** and carries a recommendation with its argument.

---

## 1. The twenty

### O1. Ngerulmud: does a 23.6 km transfer to another island count as the capital

**Evidence.** Palau's only mosque is the Palau Central Jame Masjid on Main St, Koror, 23.6 km from
Ngerulmud on a different island. Both of its own surfaces are defective: `palaucentralmosque.com`
prints a live block that no shift or recipe reproduces (best residual 11 min at a +165 min shift,
fajr pinned at the 12 degree edge), and the mawaqit Koror board is hand-set with a mid-year regime
change (sunrise 08:13 to 07:33, dhuhr +60/+61 on 243 of 365). The athanpro Koror table does fit
(30 rows, 18/17, 100 pc within-1). Count today is 198 covered of 202, 199 if Koror is accepted.
`capitals3/`, `final-sweep/`.

- a. Accept Koror for Ngerulmud, count 199/3.
- b. Refuse, count 198/4.
- c. Accept Koror as Palau's country surface and leave the capital cell a gap.

**Recommendation: c.** The record's own precedents point one way. New Delhi was ruled covered only
because the page sat at New Delhi's own point, 10 m away, while Yaounde's 25.2 degree publisher
point was recorded as a defect and never transferred. A capital cell is a coordinate claim, and
23.6 km across water is not that claim. Palau still gains a surface.

**Ruling.** No ruling taken. The block names the parent as the decider.

### O2. French Polynesia: does a platform computation at an unclaimed tenant count as coverage

**Evidence.** masjidway `masjid/3814` (Centre Islamique de Tahiti) serves a dated month, 30 rows
2026-10-31..2026-11-29, MWL 18/17 with maghrib sunset+3.98, 30/30 within-1 on all six columns. The
page states "Méthode: Australia", a platform method label and never provenance. The tenant is
unclaimed ("Si vous êtes le représentant de cette mosquée"). The platform serves any month and
year (`/prayer/042030` is indexed), so this is one computed generation and can never rise above
candidate. `fallback2/`.

- a. Accept as candidate at platform tier, tenant unclaimed recorded.
- b. Refuse, and the FALLBACK reason reads "platform calculator only, tenant unclaimed".

**Recommendation: a, ruled once for O14 as well.** The same question decides ten more countries,
so answering it twice invites two answers. The record's "citable, never" verdict was written for
authority and community tiers, and it still holds there. A dated month that passes the gate and
fits at zero margins is a measurement, whatever tier it sits on.

**Ruling.** No ruling taken. The block flags it for the owner.

### O3. Malta: the v2.5 "no fit" was an absence, not a verdict

**Evidence.** `policy-layer.v2.5.json` holds 87 objects and no Malta row at all. FIT-INDEX carried
no entry, so Malta left the pack because nothing had been swept, not because a sweep failed. Three
dated platform surfaces exist, 1,460 rows: Birkirkara 365 (fajr 18 behind a fixed 05:13 floor that
binds 213 days), Bilal 365 (18/17.1 -1), and Paola on masjidway 365 fitted on 2025 and 2026 with
one recipe (17.9/16.9 -1), the years recomputed rather than relabelled (1 min apart on 240 of 365
rows). The two mawaqit grids differ from each other on 214 fajr rows, so Malta carries two
platform engines, not one table twice. `microstates/`, `wtdiff2` N1, C17, F10, G4.

- a. Add the row and an object at candidate, with the Paola two-year fit named.
- b. Add the row at provisional.
- c. Leave it absent until an authority surface exists.

**Recommendation: a.** Malta is the round's clearest case of an absence read as a verdict. It must
enter the closing diff as a new row and a new object, and the close should check the other rows
that left v2.5 on a missing index entry.

**Ruling.** No ruling taken. The diff rules it a row addition, not an edit.

### O4. The masjidi third engine: does it change the engine-pinning rule

**Evidence.** All 495 tenants enumerated, 468 on 167 distinct regional tables. Every one of the 37
sampled tables failed the solar gate at 6.2 to 8.1 min RMS, and the cause is the gate's fixed
0.833 degree horizon, not a theory mismatch. Freed, all 167 tables fit at median 0.54 min RMS and
93 pc within-1. The measured signature: a precise ephemeris, the sun's declination and equation of
time taken once per day at 0h UT (the daily model wins 12 of 12 tables), a per-region rise-set
margin of 0.1 to 3.6 min, a dhuhr margin of -2.7 to +7, integer minutes, no DST. It is neither
PrayTimes-v2 nor adhan, because both fix the depression at 0.833 and both evaluate at the event.
The pool also cannot be dated: 366-row arrays with a fabricated 29 February, two Saudi cohorts
(22 tables 2026, 3 tables 2024), 142 tables with no year, and no live-page gate because the tenant
page renders no times server-side. `masjidi/`.

- a. Extend the rule: record engine family plus signature, and free the horizon per table in the
  gate.
- b. Keep the binary PrayTimes-versus-adhan rule and mark the pool unfittable.
- c. Treat the pool as one more PrayTimes-family surface.

**Recommendation: a.** The rule as written ("record the engine with every platform fit") survives.
What changes is the gate and the field. A fixed 0.833 horizon is a property of two engines, not of
the sky, and the 6.2 to 8.1 figure was the gate's own artefact. Two consequences travel with it.
No recipe may be fitted to a masjidi table with a fixed horizon. An angle recovered under a free
horizon is coupled to that horizon, so the horizon assumption must be stored beside the angle
(Oman's 18.53/17.47 against 18.00/16.85 is the same coupling seen from the other side). c is
refuted by measurement: the theory is precise and the departures are the signature.

**Ruling.** No ruling taken. The engine verdict is a measurement, and the rule change is fresh.

### O5. The fitter bug: which banked fits need a note

**Evidence.** `const isha` followed by `+= 1440` silently drops any year containing one
after-midnight isha. It is present in two copies, the one that found it and the US-states copy. Any
multi-year score from either copy reports one more year than it scored. The blast radius is
unsized: no block re-ran the affected fits, and `fitter-audit/` had produced no report at this cut.
The fits that rest on those copies are `us-states/`, `us-unresolved/` (Atlanta 5 surfaces x 3
years, Seattle 10 x 3, Portland 2 x 3, Honolulu 3, Nashville 3, Alnoor 3) and `masjidal-global/`
(18 tenants x 3 years). `wtdiff2` D9, G6.

- a. Re-run every year-scored fit from both copies before any grade resting on it stands, and add
  a machine assertion that years scored equals years in the span.
- b. Add the integrity note only and let the grades stand.
- c. Re-run the US fits only.

**Recommendation: a.** Two of the three affected objects are candidate, so no grade moves while
the re-run runs, and the note alone leaves an unsized hole under the round's own three-year
claims. Until the re-run lands, no A may be created from a multi-year US or masjidal score. The
assertion is the durable part: a fit that cannot say how many years it scored cannot be graded.

**Ruling.** No ruling taken. The diff names the note, not the remedy.

### O6. Kelantan: the 19 to 18 change is dated 2020-04-24

**Evidence.** Kelantan's fajr angle changed from 19 to 18 degrees effective 1 Ramadan 1441, that is
24 April 2020, adding four minutes to subuh and imsak with every other prayer unchanged. Named by
the Mufti of Kelantan (Sinar Harian, 2020-04-21) and reposted by the state committee chairman. Both
banked 1441 months (Syawal and Zulkaedah, May to July 2020) sit after the date, so they are already
the 18 era. A later month exists and holds the banked rule: Ramadan 1446 / 2025, 29 days, zon 1 and
2, Majlis Daerah Jeli, subuh and isha 27/29 exact and 29/29 within-1, imsak = subuh - 10 on all 58
zone-days, Hanafi asr 0/29. `second-witnesses/`, `wddiff` F11.

- a. Record the dated split in the Kelantan object and split any span at 2020-04-24.
- b. Treat 18 as the only era and backfill 19.
- c. Leave the object as it stands.

**Recommendation: a.** The 18 the fit measured is now the 18 the state declared, which is the
documentary confirmation the angle lacked. A span that crosses the date must split there, and no
backfill: the 19 era has no captured table.

**Ruling.** Partly ruled. T-675's MY-JAKIM margin verdict governs the margin form (zohor +1.5
round alone, maghrib 0 ceil, syuruk floor at the per-zone eastern point, isha 0 ceil at 18, and 17
in both Kelantan zones) and is landed. The 2020-04-24 split is new and unlanded.

### O7. India: which isha line the record carries

**Evidence.** 13,140 dated rows, 20 tenants, 8 cities fitted at 18/17, A-grade community. Isha at
17 degrees sits 4 to 5 minutes earlier than 18 in every city and season, while the other four
columns are identical. No board publishes a daily table, so the authority tier is unchanged.
`india-cities/`, `wtdiff2` F5.

- a. Carry isha 17, which is what the tables print, with the flag as a note.
- b. Carry 18 as the reading the record prefers.
- c. Carry both behind a field.

**Recommendation: a.** The record carries what a publisher prints, and 17 is printed. b would
print 4 to 5 minutes late against every surface the round measured. The note should say plainly
that 17 and 18 differ by that much and no authority adjudicates the pair, which is the honest
form of a flag.

**Ruling.** No ruling taken. The diff leaves it open for the fit index.

### O8. The snapped-column class, and the two things it is not

**Evidence.** Skopje prints dhuhr on the hour all year, 12:00 or 13:00, against a true 11:20 to
11:43, a 77 to 89 minute display rule, and scores 3.6 pc exact. Buenos Aires scores 4.1 and Yaounde
3.6 on the same defect. Bern's dhuhr snaps (worst 5 min) and its maghrib snaps (worst 4), the same
class on a full year. Egypt is a different defect: ESA's own dhuhr is 96.0 pc exact and is not
snapped, while Dar al-Ifta's republication of ESA swaps the dhuhr meridiem on 30 of 180 Cairo
values. Athens carries a Ramadan window only, with no non-Ramadan capture, so no column can be
tested there. `capitals/`, `capitals2/`, `egypt-82/`, `span-ledger/`.

- a. Name a snapped-column defect class, report the snapped column's exact rate and the display
  rule where recoverable, and never absorb it with a margin.
- b. Fit the snapped column with a large margin.
- c. Drop the column from scoring.

**Recommendation: a, with the meridiem swap kept as a separate transcription defect.** b hides a
display rule inside a recipe and would carry it to every other city on the object. Athens is not an
instance until a non-Ramadan capture exists, and the record should say that rather than carry an
untested label.

**Ruling.** No ruling taken.

### O9. Six rows moved out of a class and no class named

**Evidence.** The class arithmetic closes at 192 only by counting six movers as UNNAMED: Thailand
(provisional to "A-candidate"), Algeria (candidate to "fitted multi-year"), Brunei (candidate to
"fitted 20/18"), Uganda (FALLBACK to "fitted"), Tanzania (FALLBACK to "A eligible"), China
(FALLBACK to "measured"). None of those phrases is one of the six classes. `wtdiff2` 5.2, G1.

Recommendation, one line each:

| Row | Named class | Why |
|---|---|---|
| Thailand | provisional | two year-blocks on one recipe, but the leap block cannot be separated from 2024 or 2028, so no year is asserted and A's year test is not met |
| Algeria | A | issued 1447 and 1448, recomputed (no shared Gregorian cell, drift tracks the sun to 1.15 min), one recipe across both, the RECOMPUTED-SPAN class FIT-RULES already admits |
| Brunei | provisional | one MORA cycle, 20/18 at 99.2 pc within-1 |
| Uganda | provisional | one cycle, Entebbe 365 rows, clean 15/15 |
| Tanzania | A | three years 2025 to 2027, one recipe, 365/365 all six within-1 in every year |
| China | provisional | one grid cycle, 2026, at the official 2004 computation |

Count after naming: A 21, provisional 48, candidate 71, community 24, F 2, FALLBACK 26, UNNAMED 0.
Identity: 21 + 48 + 71 + 24 + 2 + 26 = 192.

**Recommendation: name them as tabled.** Two of the six are A on evidence the grading vocabulary
already covers, and four are provisional on one cycle. The alternative, inventing a seventh class,
would make the count mean something the vocabulary does not.

**Ruling.** No ruling taken. The diff refuses to rule it and the summary says the close must.

### O10. Eleven rows that need a policy object and have none

**Evidence.** Eleven rows now sit in classes v2.5 normally carries an object for, and no object
exists: China, Japan, India, Indonesia, Mexico, Colombia, Peru, Tanzania, Uganda, Ireland, North
Macedonia. The diff declines to propose recipes. 87 objects become 98 before the 18 new-country
objects are added, and 116 with both. `wtdiff2` 6.3, G2.

- a. Write all eleven objects from the round's measured recipes, marking the two whose recipe is
  not settled.
- b. Write only the six whose recipe is settled.
- c. Defer all eleven to the architecture plan.

**Recommendation: a.** Nine of the eleven now carry a measured recipe in the record: China 15/15
Hanafi at 29 capitals, Japan 18/17 +1, India per city at 18/17 and 18/18, Indonesia 20/18 with the
1.76 arcmin horizon dip, Mexico, Colombia and Peru at MWL 18/17, Tanzania 18/18, Uganda 15/15.
Ireland's summer fajr is unmodelled (1/7 night gives 03:54 against a printed 02:46, middle-of-night
01:27, both refuted) and North Macedonia's two surfaces differ by 45 minutes on fajr, so those two
objects carry a named gap rather than a closed recipe. c leaves eleven rows in a class with no
policy, which is the state the diff exists to end.

**Ruling.** No ruling taken.

### O11. Brazil: A at community tier

**Evidence.** 25 IIB cities, 3,000 rows across 2025 and 2026, MWL 18/17 at zero margins, 18,000
cells 99.7 pc within-1, worst 2, one recipe across both years. The register writes A, the row is
community tier, and v3 has no community-tier row in the A class. `latam-cities/`, `wtdiff2` G3.

- a. Adopt A and state the convention once: grade is a span claim, tier is a provenance claim.
- b. Hold at community with a two-year note.
- c. Split the row into an A line and a community line.

**Recommendation: a.** The span test is met on two distinct years and one recipe, which is exactly
what A asks. Refusing it makes the grade carry two meanings at once, and b hides a measured second
year. India is not a counter-case: its row is a mosaic of eight cities with no single recipe, so it
stays community on the recipe test, not on the tier. The count does not move, because the diff
already books Brazil's A. This ruling decides whether that A is legal.

**Ruling.** No ruling taken. The diff says the close must rule it.

### O12. Norway IRN: a seasonal school switch in the asr column

**Evidence.** The IRN (Rabita line) asr column is Shafi in CEST and Hanafi in CET, switching on the
DST dates, across the ten Norwegian cities. It is a school switch, not a margin, and no margin
expresses it. The record's one comparable open item is R6, the Fazilet London madhab, where the
live 2026 engine prints Shafi ikindi against a 2010 print of Hanafi +6. `O1l-31/`, `wtdiff2` D6.

- a. Carry two asr entries with a DST trigger in the Norway object.
- b. Pick one school for the whole year.
- c. Record it as a defect and fit no asr.

**Recommendation: a.** The publisher switches, and the object must be able to say so. b prints 40
to 60 minutes wrong for half the year, and c loses a column that reproduces on both sides. The
schema change is worth making once, because R6 needs the same mechanism if the UK ruling goes the
same way.

**Ruling.** No ruling taken. R6 itself stays open and parked under T-675.

### O13. The offset-register class: published per-place deltas

**Evidence.** The class is a publisher printing one base table and stating, per named place, how
many minutes to add or subtract. Registers measured this round: Palestine, 7 tiers and 29 places
(0, -1, +1, +1.5, +2, +3, +4), confirmed against four mawaqit payloads at a constant integer band.
Kosovo, 7 places (Sharri +2, Ferizaj -1, Gjilani -1, Prishtina -1, Podujeva -1, Vushtrria -1,
Presheva -2), identical on the 2024, 2025 and 2026 editions, and Prishtina itself is -1 against the
base, so the base is not Pristina. Bosnia, 118 places, per-column integer deltas constant inside a
month, the dhuhr delta never moving while the morning and evening columns swing in opposite
directions across the seasons, which makes it a computed coordinate table with an integer face.
Egypt, 78 cities, a coordinate table whose deltas move with season, so no integer describes a city.
Jordan, 16 labels with zero deltas, a degenerate layer with one point and no regional information.
`offset-registers/`.

- a. Make the register a first-class object field: `zoneTable` populated from the publisher's own
  print, with the base point named.
- b. Keep registers as prose notes.
- c. Derive the deltas from coordinates.

**Recommendation: a.** The deltas are the publisher's statement, and the record already holds six
of this class (Belgium 18 deltas, Slovenia 6 cities, Fiji's town ladder, Malaysia's Lampiran B,
Sri Lanka's 13 zones, Mauritius's 3 tiers). c is forbidden by the brief: deriving a delta invents a
value the publisher printed. Two corrections follow. JO-AWQAF must stop reading as a
per-governorate layer. The Kosovo anchor is one minute late for Prishtina.

**Ruling.** No ruling taken.

### O14. The eleven FALLBACK countries, and the rule that settles them

**Evidence.** athanpro's sitemap carries 85 city pages across ten of the eleven (Guyana was closed
at capital level by O1l-57), 2,550 dated rows, September 2026, every page gated at 2 minutes or
less and every page fitting within 2 minutes on all six columns after two named corrections:
Birganj's coordinate field is Kathmandu's (fitted at Birgunj's true point the table scores 150/150
within-1, against 44.7 pc at the printed coordinate), and Bor renders on Europe/Istanbul (60 min
late, corrected arithmetically). 64 of the 85 hit 100 pc within-1 at MWL 18/17 Shafi. Dhuhr is
truncated rather than rounded (median -1 min, 23 exact of 2,550), a platform convention that is
named and not absorbed. Samoa's ten entries are one capital plus villages plus two island labels,
and Kiribati's five are five South Tarawa villages, so 85 pages is not 85 cities. No publisher
stands behind any page. `final-sweep/`, `fallback2/`.

- a. Rule that a dated platform month at a named city's own coordinates is candidate at platform
  tier and lifts FALLBACK, on the Kingston JM precedent, and apply the same ruling to French
  Polynesia (O2).
- b. Refuse, and the eleven stand as they were.
- c. Lift only where a mosque or association is named.

**Recommendation: a.** One ruling settles twelve countries and it is the same question the round
asked at Tahiti, at Ngerulmud and across the capitals. Two limits travel with it: the year must be
recovered from the page's own anchors, never from a clock, and a country with no named city page
stays FALLBACK. On the class count ten rows leave FALLBACK, because Guyana is already counted, and
the research count reaches zero plus Palestine. The close should confirm that arithmetic against
the row identity before writing it.

**Ruling.** No ruling taken. Both blocks name it as the owner's.

### O15. The four capital gaps

**Evidence.** Palikir has no surface and no tenant: the country's mosque is the Pohnpei Mosque,
Ahmadiyya, 7.4 km away on the same island, with Facebook and Instagram only, and the nearest dated
surface is Colonia on Yap, 2,223 km. Ngerulmud is O1. Tegucigalpa's mosque had a domain and that
domain never held a page, Wayback's only capture being a Squarespace "En construcción" parking
page, and athanpro carries a Honduras country page with zero city pages. Pyongyang was not
attempted and the record closes it on absence. Count 198 covered of 202, 4 gap. `capitals3/`,
`final-sweep/`.

- a. Close the four as documented negatives and publish 198/4.
- b. Keep searching.
- c. Accept transfers.

**Recommendation: a, with Ngerulmud following O1.** Three of the four now carry a cause rather than
a search failure, which is what a negative needs to be worth anything. Tehran stays outside the
count as a candidate artifact, and Iran stays closed.

**Ruling.** No ruling taken.

### O16. Watch: Sri Lanka zone 03

**Evidence.** The monthly probe found 12 links under `uploads/2026/11`, all zone 03, byte-identical
to the prior edition (md5 aa86f791...), against 300 links under `2026/10`. Zone 03 has now been
byte-identical after a title fix for a third observation. `watches-eu/`, `O1l-27/`.

- a. Keep the monthly watch and close it only on a regenerated zone table.
- b. Close the watch now.
- c. Lift the frozen generation to A.

**Recommendation: a.** c is barred by the frozen-generation precedent, and b abandons the record's
most regular publication signal. The md5 should be pinned in the watch so a regeneration is
detected without a manual diff.

**Ruling.** No ruling taken. The watch is dated, not a decision.

### O17. Watch: JAKIM's year parameter is silently ignored

**Evidence.** e-Solat `?year=2027` returns HTTP 200 with the year parameter silently ignored, the
payload opening 01-Jan-2026. This is the same parameter-blind class as the IFI 301 and the German
`?yil`. JAKIM's DISAHKAN 2028 takwim is already published but carries dates only, with no times.
`malaysia-states/`, `wtdiff2` D27.

- a. Stop probing the year parameter, treat the surface as parameter-blind, and watch the DISAHKAN
  edition instead.
- b. Keep probing `?year`.
- c. Accept the 2026 payload as a 2027 claim.

**Recommendation: a.** c is the trap the class exists to catch, and b repeats a probe that cannot
answer. The 2027 times remain unserved, and the watch should record that fact rather than a null
result.

**Ruling.** No ruling taken.

### O18. Watch: Indonesia month 1 met

**Evidence.** `api.myquran.com` served 2027-01-01..31 on the 2026-11-11 probe, 34 days ahead of the
calendar, and 31 rows are banked. The watch's signal, the Kemenag year-2 path, is met at month 1.
`watches-eu/`.

- a. Convert the watch to a monthly tail through 2027-01-31 and probe 2027-02 at the normal
  cadence.
- b. Close the watch.
- c. Treat one month as a year-2 proof.

**Recommendation: a.** c is the frozen-generation trap in reverse: one month is the first month of
one cycle, not a year. b throws away the round's earliest forward signal.

**Ruling.** No ruling taken.

### O19. The Dubai preset contradicts the authority

**Evidence.** adhan 4.4.6's Dubai preset bakes asr +3 and runs 2.77 minutes late against Dubai's
own 1,794 rows, 0.0 pc exact and never within a minute, while asr margin 0 reproduces the authority.
The package contradicts its namesake authority on that authority's own data. `uae-cities/`,
`wtdiff2` A34.

- a. Override the preset per object and record asr margin 0 for the UAE.
- b. Keep the preset and carry a -3 correction.
- c. Stop using adhan for the UAE.

**Recommendation: a.** b is a fitted shift against a stated authority, and c discards an engine
that is exact elsewhere. The general consequence: a package preset is a convenience, never
provenance, and any object whose authority contradicts its preset records the authority's margin
and says so.

**Ruling.** No ruling taken.

### O20. Two surface facts the policy object cannot express

**Evidence.** The mawaqit stored calendar is a different generation from its live page at Plymouth
and Lincoln, and the calendar PDF accepts `?year=2027` and returns the 2026 table relabelled
(365/365 identical). go2masjid's `slim=365` path serves a real forward year to 2027-11-10, the only
platform path in the round that does. Neither fact is a recipe fact, and v2.5 has no field for
either. `O1l-28/`, `O1l-33/`, `wtdiff2` G5.

- a. Add `surfaceGeneration` (live or stored) and `forwardYear` (date or null) to the object.
- b. Carry both in notes.
- c. Ignore them.

**Recommendation: a.** b is how a stored calendar becomes a second year by accident, which is the
exact defect the round found twice. A forward year that no field records cannot be withdrawn when
the publisher stops serving it.

**Ruling.** No ruling taken.

---

## 2. The o1k twenty-six, reconciled

The T-675 rulings (2026-11-11 03:26Z, with the D6 reversal at 03:45Z) ruled all 26 items agent-ruled
under the hands-off order. The v2.5 apply landed eight of them. The rest are closed as decisions
with no apply dependency, or still open.

**Closed by the v2.5 apply (8).** The pack merged at 39d5355a, uat e45ab0aa, 87 objects and 174
world rows, validate green at 262 suites and 8,256 tests.

| Item | Ruling | Landed as |
|---|---|---|
| D3 frozen generation | a, Algeria outside the precedent | world table v3 and the schema rule-form |
| D5 Morocco | a, conditional resolved, grade A | MA-HABOUS at A |
| D6 Nigeria | a, then reversed to b | Nigeria at MWL, the Egyptian line recorded as masjidway's platform default |
| D7 NZ Ramadan | a, the announced date governs | NZ-FIANZ |
| D14 adopt the night | a, whole diff | 18 new objects, 12 amendments, T-675 refs |
| D15 five repairs | a | Kyrgyzstan sign, FIT-RULES path, Kelantan split void, Benin row, Oman CityID |
| A1 sub-45 fallback | a, 18/18 Shafi, no body claimed | fallback amendment |
| A2 promise wording | a, with the fallback clause in the badge | badge and wording |

The D6 reversal is now independently confirmed by the o1l-7 sweep: the Egyptian line is uniform
across north, middle belt, south and southeast, and every mosque-configured table is MWL 18/17 Shafi
exact. The reversal was right, and the o1l evidence is stronger than the evidence it reversed on.

**Closed as decisions, no apply dependency (15).** D1 Fiji edition (a), D2 Yemen (c, two rows),
D4 Burkina (a, refit 1447), D8 Kemenag's six regencies (a, named regional exception), D9 Taiwan (a,
1447 offset table with edition stamped), D10 Libya (b), D11 Iran (b), D12 Nigeria's blocked leads
(a), D13 Pakistan (a, recheck each January), R1 grading, R2 frozen generation, R3 masjidal two-layer,
R4 per-edition constants, R5 feed gating, A3 asr.

Three of these now have o1l evidence that either confirms or sharpens them. R5 gained two defect
classes (the single-month DST block, and the whole-DST-window shift with sunrise exempt) and now a
third (the athanpro foreign-render zone, O15's arithmetic correction). R2's reach grew: the
Maldives frozen generation is now proven by direct test rather than inferred, and the mawaqit stored
calendar is a second generation of one table. A3 holds: masjidi's fitted shadow factor runs 0.97 to
1.08 on all 167 tables, never near the Hanafi 2.0.

**Still open (3).** R6 Fazilet London madhab, parked, and O12 now supplies the mechanism it needs.
R7 mawaqit bulk enumeration, parked, with the interim policy standing. A4 the T-42 go, held by the
owner. The watches W1 to W5 stand as dated, and W5's host-and-cadence call stays the owner's.

8 + 15 + 3 = 26. Nothing in the o1k sheet is unaccounted for.

---

## 3. What this addendum does not decide

Mechanical close actions, already ruled by the diff and needing no owner line: the 34 new rows, the
45 changed rows, the 56 grade and span movements, the 32 rule-forms, the Cameroon relabel to the
Adamawa point, the 14 ledger records carrying the wrong country, and the four platform defect
classes.

Items already ruled and carried as flags rather than decisions: Oman's degenerate ridge (both
parameterizations carry, the split is the rounding mode), Quetta's asr swing, Macedonia's 45 minute
disagreement, Porto's convention sheet, Tehran's unclaimed candidate, and Mauritius's structurally
negative year-2.

## 4. Basis

Every figure above is traceable to the block or workspace named in its item, and to the artifact
named in `summary/ROUND-SUMMARY.md` section 5. Where the world-table diff and a block disagree, the
block governs, per the diff's own rule. Nothing in this sheet was measured by its author, and the
repository was not touched.

One caution travels with the class counts in O9 and O14. They are arithmetic on the diff's own
identity, and the diff's cut predates the blocks named above, so the close should re-cut the
register before writing any of them.
