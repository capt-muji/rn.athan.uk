# Owner decisions, addendum: round three (o1m), 2026-11-11

Third sheet to `o1k-wide/decisions/DECISIONS.md`, after
`o1l-city/decisions2/DECISIONS-ADDENDUM.md`. Sixteen items this round produced or reopened, numbered
so a reply is one line per item, such as `D2: a`, `D7: as recommended`.

Read-only against the record. Nothing here edits `world-table-v3.json`, `policy-layer.v2.5.json` or
`FIT-INDEX-ROUND3.json`. The repository was not touched and nothing was measured by a model-vision
pass.

Three marks:

- **Decided.** The round already ruled it, or a binding rule settles it. The item cites the source
  and says what the close must do to land it.
- **Owner.** The record cannot answer without a line from the owner, because the answer moves the
  class count, the tier of a publisher, or a country's rule-form.
- **Conservative.** The record can decide it without the owner on the evidence, and the conservative
  answer is given with its argument. The owner may override any of these.

---

## 0. Basis and cut

Four bases, all on disk, none of them re-derived here.

| Base | What it holds | Read at |
|---|---|---|
| `o1m/CONSOLIDATION.md` | 41 blocks, o1m-R2 to o1m-35 | 2026-11-11, full file, re-read as blocks landed |
| `census/world-table-v3.json` | 174 rows, the pre-round record: A 17, provisional 40, candidate 65, community 15, F 2, FALLBACK 35 | as committed at the o1l close |
| `census/policy-layer.v2.5.json` | 87 objects, 12 high-latitude kinds, 174-row counterpart | as committed at the o1l close |
| `o1m-36-fitindex3/FIT-INDEX-ROUND3.json` | 154 entries, 87 named countries, 15 multi-country families, grades A 31, provisional 85, candidate 25, community 11, measured 2 | returned file, 12:34 |

The fit index is the round's own statement that these questions are unanswered: it carries fifteen
flags and adjudicates none of them. Eight of the sixteen items below are among those flags (US and
China 18/16, Iran's 4.5-degree maghrib, Saudi Ramadan +120, Chaguanas, the HTML-in-PDF captures, the
mawaqit 25-of-25 relabel, the Diyanet 150-row default, the Kuwait no-axis finding).

The consolidation grew while this sheet was written. Four blocks (o1m-27, o1m-28, o1m-35, o1m-36)
landed after its first cut and are in the file at this read. Five waves have no block yet, so their
questions are absent by construction and will arrive in a fourth sheet if they raise any:
`o1m-29-kaznational`, `o1m-31-indonesia`, `o1m-32-caappeal`, `o1m-33-index`, `o1m-34-wtdiff3`.

Every count in this sheet that is not quoted from a block was produced by a script in
`o1m-37-decisions/data/`, named in the item. The scripts are `scan-pdf-class2.py` (1,212 `.pdf`
files classified by byte magic), `fallback-lift.py` (the 35 FALLBACK rows against every dated
surface the round found), `consensus-counts.py` (the 232-country engine matrix). Their outputs are
`pdf-class2.txt`, `fallback-lift.txt`, `consensus-counts.txt` beside them.

---

## 1. The sixteen

### D1. Tawkit's 3.18M rows: in the citable layer or archive-only

**Question.** Does the round ship tawkit's full row set, or the fits, parameters, coordinates and a
sample with the rows staying in the archive?

**Mark.** Decided.

**Options.**
a. Confirm the recorded decision: citable layer is fits, the per-country parameter table, the
settlement list and a validated capture sample. The 3,177,878 rows stay archive-only.
b. Reopen and ship the normalized rows to the repo as records.
c. Ship the rows but keep them out of the record counts.

**Evidence.** 75 countries, 8,709 city pages, 3,177,878 dated rows, zero capture failures, 100 pc
passing the weekday check (every row lands on its printed weekday, so the data is dated without
reading a clock). 3,067,503 rows fitted at 88.5 pc cells within-1 and 61.5 pc exact. The engine is
named by the publisher's own page: `PrayTimes.js` ver 2.3, 16,064 bytes captured at
`o1m-3-platforms/captures/tawkit-PrayTimes.js`, executed at GeoNames points, output frozen into
annual per-city files. The rows are therefore a deterministic function of (engine, 8,709 points,
per-country parameters).

**Recommendation: a, confirmed.** **Decided**, agent-ruled 2026-11-11 ~10:1xZ, recorded in
`CONSOLIDATION.md` under "O1m-3 decision: tawkit's citable layer". A row set that regenerates from a
parameter table carries no information the table lacks, and 3.18M regenerable rows in git would
outweigh every independent record the census holds.

**Cost.** a costs nothing at the close beyond one arithmetic line: the round summary must count these
rows separately as generator-derived. b makes the record count meaningless, because one engine's
output replicated across 8,709 settlements would enter as independent evidence and the archive would
grow by the largest single block in the census. c is the worst of both, since the rows would travel
without their count.

**Owns.** The close: o1m-34 (wtdiff3) for the count line, o1m-36 (fitindex3) for
`engine=PrayTimes-2.3, coords=GeoNames` on every tawkit entry. Already true of the 16 tawkit entries
in the index read here.

---

### D2. Diyanet's foreign tree: platform tier or authority abroad

**Question.** Is `namazvakitleri.diyanet.gov.tr` an authority when it computes a city outside
Türkiye, or a platform?

**Mark.** Owner.

**Options.**
a. Platform tier everywhere abroad, with authority only where a local body is documented as adopting
the scheme.
b. Authority everywhere, since the publisher is a state religious authority.
c. Leave the tier to each wave's judgement, as now.

**Evidence.** Scale: 207 countries, 18,582 cities, 8,539 non-grid cities banked, 363 province tables,
and the ocean grid recovering printed coordinates at a mean error of +0.003 degrees. Its convention is
the domestic Turkish ladder exported: sunrise −7.0, dhuhr +5.0, asr +4.0, maghrib +6.9, isha +1.4,
holding to a tenth of a minute across 193 countries (o1m-26). That constancy is the tell. A publisher
stating a country's own convention would vary per country. This one prints its home temkin at foreign
coordinates.

The round's own fit index already disagrees with itself, which is the count that matters:

| Diyanet-surfaced entries in `FIT-INDEX-ROUND3.json` | 25 |
|---|---|
| labelled `platform` | 16 |
| labelled `authority` | 6 |
| community, mixed, matrix | 3 |

The six authority labels are `DIYANET-TREE-207`, `OC-DIYANET-20-CITIES`, `WS-APIA-DIYANET`,
`TO-NUKUALOFA-DIYANET`, `RO-DIYANET-53` and `EU-DIYANET-16-ISHA-SPLIT`. Only the last names an
adopting body on the record: DITIB Germany and IFiS Sweden adopted the unified European scheme in
July 2022, effective January 2023, which is why `EU-DIYANET-UNIFIED` sits at authority tier in
`policy-layer.v2.5.json`. That is authority by adoption, not authority by publisher.

Weight: five FALLBACK rows rest on this tree alone (D3), and twelve countries in the fit index
(Greenland, Macau, Mongolia, New Caledonia, North Korea, Samoa, South Korea, Suriname, Svalbard,
Taiwan, Tonga, Turkmenistan) have no other entry at all.

**Recommendation: a.** The rule the record can state in one line is that tier follows adoption, not
the publisher's name. It reconciles the six labels without a new field and keeps the one authority
case that has an adopting body on the record.

**Cost.** a moves five labels (`DIYANET-TREE-207`, `OC-20`, `WS-APIA`, `TO-NUKUALOFA`,
`RO-DIYANET-53`) from authority to platform and moves no grade, because every one of them is a single
cycle and none can exceed provisional under the multi-year ruling. b would lift the grade ceiling
across 207 countries on the assertion that the Turkish state speaks for every country's prayer
calendar, which no document in the record supports. c leaves two answers in one index, and the next
round will pick whichever it reads first.

**Owns.** o1m-36 (fitindex3) relabels on the owner's line. `policy-layer` v2.6 carries the one-line
rule in `fieldGlossary.tier` if the owner wants it written down.

---

### D3. The FALLBACK lift: one ruling or two

**Question.** Do the turktakvim and Diyanet layers lift FALLBACK countries under the same clause the
athanpro ruling (o1l O14, still open) would lift, or does each platform family need its own ruling?

**Mark.** Owner.

**Options.**
a. One ruling: a dated table at a named place's own coordinates lifts FALLBACK at platform tier,
whichever family serves it, with the year recovered from the page and never from a clock.
b. Three rulings, one per family.
c. Lift only where a mosque or association is named.

**Evidence, script-counted.** `data/fallback-lift.py` walks the 35 FALLBACK rows in
`world-table-v3.json` against every dated surface this round found:

| Result | Rows |
|---|---|
| FALLBACK rows in the pre-round record | 35 |
| now hold at least one dated surface | **32** |
| hold a turktakvim table | 22 |
| hold a Diyanet table | 28 |
| hold both | 18 |
| rest on the Diyanet tree alone | 5 (Namibia, Mexico, Armenia, Suriname, Samoa) |
| still hold nothing | 3 (Cyprus south, Western Sahara, French Polynesia) |

French Polynesia lifts under the same clause on the o1l O2 masjidway month, so the clause as drafted
in o1l O14 settles **33 of the 35 rows**, and the class closes at 2 (Cyprus south, Western Sahara).

The three families are the same shape, measured: turktakvim one engine, 2,391 tables in the eleven
countries of o1m-1 and 8,565 across Africa in o1m-4r (fajr 17.83-17.93, isha 18.59-18.74, a constant
temkin), Diyanet one engine at the domestic ladder, dated in rolling 30-day windows with no year
parameter. Neither is an authority abroad, and both are dated, gated and fitted.

**Recommendation: a.** One clause, three witnesses. Two rulings would let the same country land at
two tiers depending on which wave filed it, which is the defect D2 exists to end.

**Cost.** a lifts 32 rows on the owner's one line and closes the research count to 3, at candidate
grade and platform tier, with the year-2 debt recorded per row. b repeats a question the round has
already answered twice and invites a third answer for the next family. c leaves 22 rows at FALLBACK
while the record holds their tables, which reads as a missing measurement rather than a decision.

**Owns.** The close for the class arithmetic (o1m-34), and the next round for second witnesses on the
five Diyanet-only rows, which is the only route from candidate to provisional there.

---

### D4. US and China isha 18/16: a country rule or one family's signature

**Question.** Diyanet alone carries 18/16 in the United States and China. Does the record adopt it as
each country's rule-form?

**Mark.** Conservative.

**Options.**
a. No country rule. Carry each line at its own tier and keep two Chinese lines.
b. Adopt 18/16 as the US and China rule-form.
c. Adopt it for China only, where the Diyanet layer is the largest dated layer on record.

**Evidence.** The item's premise needs one correction before the options read honestly. "Every other
family holds 17" is true of this pair and false of the matrix: `data/consensus-counts.txt` finds 75
countries where exactly one family solves a 16-degree isha and 24 where two or more do, so a
16-degree isha is a widespread convention, not a Diyanet aberration.

What is specific to the pair is the membership.

| Country | Diyanet | athanpro | tawkit | The country's own layer |
|---|---|---|---|---|
| China | 18.00 / 16.00 exactly, 222 cities, 121 of 222 at 100 pc all-six, median 100 pc | 18.00 / 17.05 | isha as maghrib + 90, fit loss 6.14 | norislam 15/15 Hanafi at 10 points, MAE 0.25-1.09, measured |
| United States | 18.05 / 15.85 | 18.00 / 17.05 | does not fit one recipe, loss 10.46 | 15/15 at 26 of 37 verdict surfaces, 98 tenant-years, four A entries |

So China holds four descriptions, not two, and the United States' strongest evidence (four A entries,
98 tenant-years, 35,829 dated rows, the fitter bug cleared by measurement) is 15/15 from its own
mosques.

What the two pairs are worth in minutes, measured with the round's own engine
(`data/measure-deltas.txt`, adhan 4.4.6, four literal dates). A negative value is earlier:

| Move | New York June | Chicago December | Beijing June | Urumqi December |
|---|---|---|---|---|
| fajr 15 to 18 | −26.6 min | −16.9 min | −25.5 min | not usable, day-wrap |
| isha 15 to 16 | +8.5 min | +5.7 min | +8.2 min | +5.8 min |
| isha 16 to 17 | +8.9 min | +5.6 min | +8.5 min | +5.8 min |

So adopting 18/16 for the United States would print fajr 17 to 27 minutes earlier than the surfaces
the record grades A, and adopting it for China would print fajr 17 to 25 minutes earlier than the
Chinese computation and isha 5 to 9 minutes earlier than a 17-degree reading, season and latitude
dependent.

**Recommendation: a.** The record carries what a publisher prints, at that publisher's tier, which is
the o1l O7 India rule applied unchanged. Diyanet's China entry says it plainly already: the 17-degree
isha misses every Chinese city by 4.5 minutes at zero margin, so 16 is the faithful description of
that surface. It is not a statement about China.

**Cost.** a leaves China with two lines and a reader who must pick a tier, which the object's
`recipeVariants` field can state in one line. b moves four A entries and 98 tenant-years off their
own tables in the United States by 17 to 27 minutes on fajr. c is defensible on volume and wrong on
method: the largest layer is not the country's authority, and the Chinese computation is the closer
thing to one.

**Owns.** o1m-11 (eastasia) and o1m-36 for the two-line statement on China. No object exists for
either country yet, so the close writes both from the index entries.

---

### D5. Iran's 4.5-degree maghrib: adopt as a rule-form

**Question.** No family in the matrix carries Iran's maghrib depression and the national print does.
Does the record adopt it as a rule-form?

**Mark.** Decided.

**Options.**
a. Confirm the existing field and extend it to the second country that prints it.
b. Fit a fixed margin instead, as the families do.
c. Leave maghrib out of the Iranian object.

**Evidence.** **This one is already decided and already carried.** `IR-NATIONAL` holds
`maghribRule.kind = angle, angle = 4.47` from T-668 #6961, and `fieldGlossary.maghribRule` names it
as the reason a consumer must not compute maghrib at the horizon. The o1m evidence re-measures it far
wider than the original 30 days: 880 pages, 44 cities, 26,884 rows, two Jalali years, one recipe
(fajr 17.70, isha 14.00, maghrib at the 4.5-degree depression, zero margins), 100 pc within-1 at 29 of
38 cities. A fixed sunrise offset reproduces 64.3 pc of days, the depression 100 pc.

The matrix confirms the negative: all three families print maghrib on the 0.83-degree horizon and
differ only in the margin (Diyanet +6.9, tawkit +0.1, athanpro 0.0).

One correction to the record travels with it. `fieldGlossary` says "IR-NATIONAL is the only user",
and that is no longer true: the Lebanese al-Manar print sits on the same 4.5-degree depression across
seven cities and 1,381 gated rows.

**Recommendation: a.** The rule-form is measured twice, in two countries, from two publishers, and
the field already exists. What the close adds is the second user and the grade: `IR-PISHKHANAK-44`
holds A on two fitted years, while `IR-NATIONAL` still holds provisional on a 30-day sample.

**Cost.** a costs one glossary line and one object link. b replaces a depression with a fixed offset,
which reproduces 64.3 pc of the national print's days against the depression's 100 pc. c would ship an
object whose maghrib is computed minutes early for every Iranian city, the exact failure the field was
added to prevent.

**Owns.** Close: `policy-layer` v2.6 glossary line and the Lebanese object. Grade lift on
`IR-NATIONAL` is o1m-36's call, since the two-year fit belongs to the community surface
(`IR-PISHKHANAK-44`), not to the authority's 30 days.

---

### D6. Saudi Ramadan +120: confirm the national rule-form

**Question.** masjidi alone reproduces the +120 Ramadan interval (25 tables, 31 days) while the Saudi
authority holds it. Does the record confirm it as the national rule-form?

**Mark.** Decided.

**Options.**
a. Confirm, and cite masjidi as the independent second witness.
b. Hold it as the authority's own statement without a second witness.
c. Carry a flat +90 all year.

**Evidence.** **Already carried and now witnessed twice.** `SA-KACST` holds
`ishaRule.kind = ramadanInterval, interval 90, ramadanInterval 120`, month-exact on the API's own
Hijri boundaries across 1447/1448/1449, 88 Ramadan days, zero violations, and 1448 Ramadan is 29 days
(never assume 30). `SA-GRID-225-POINTS` adds 159,300 city-days at 99.7-100.0 pc within-1 with the
same two values.

The independent witness is exact where the others are silent or flat: masjidi 25 tables, base 90.0,
Ramadan 120.0, 31 step days. tawkit 204 cities flat 90 with no step at Ramadan 2027 (203 clean, one
defective page). athanpro 10 cities, September only, no Ramadan in span. Diyanet prints an angle
(16.8), so its gap drifts 68.5 to 65.0 and it is not comparable.

One caution: masjidi's 31 step days fall on 2028-02-18 to 2028-03-19, and its 366-row scaffold is an
index, not a year. The window is stated as the table prints it and must never be read as a dated
claim.

**Recommendation: a.** The rule is the authority's, the second witness is exact, and the mechanism is
the Umm al-Qura convention rather than a fit residual.

**Cost.** a costs one provenance line and no grade move. b leaves the rule resting on one publisher
in a record that asks for two wherever it can get them. c prints isha 30 minutes early for 30 days a
year, which is the largest single error available in the Gulf.

**Owns.** Close: the `SA-GRID` provenance line (o1m-36) and nothing else.

---

### D7. The `.pdf` captures that are error pages: which verdicts reopen

**Question.** Thirty captures were saved with a `.pdf` extension and hold HTML error bodies. Which
"unfitted" verdicts on them are capture failures and must reopen?

**Mark.** Conservative.

**Options.**
a. Reopen the short list of verdicts that read a failure as a publisher property, and record the true
size of the class.
b. Re-fetch all of them and reopen everything they touch.
c. Treat the wave's note as sufficient and reopen nothing.

**Evidence, script-counted.** `data/scan-pdf-class2.py` classifies all 1,212 `.pdf` files in
`o1l-city/` and `o1m/` by byte magic, searching the first 64 bytes for `%PDF-` so a real PDF with
leading whitespace is not misread:

| Class | Files |
|---|---|
| real PDF | 1,135 |
| 404 error page | 55 |
| bot block | 4 |
| access denied / XML error | 4 |
| challenge | 1 |
| `File not found.` | 4 |
| deliberately recorded HTML or XML | 9 |

So the class is **68 error-body captures across 12 workspaces, not 30**. The OCR wave named 30 and its
own list runs to 32 names, which is the argument for the sweep rather than against it: the count was
already drifting upward inside one block.

Most of the 68 are deliberate negatives, and a 404 there is the answer, not a failure: the mawaqit
year probes in `o1m-18-africa2` (17), the Brussels 2027 probes, the three `O1l-33` probe captures,
the four Islamic Academy "series stop" files. Those stand.

Four verdicts do not stand as written.

| Verdict | Artifact | Why it reopens |
|---|---|---|
| Jyväskylä, 353 dated rows for Feb 2026 to Jan 2027, fitted 18/17 at 201/201 within-1 | all 12 `fi-jyvaskyla-*2026.pdf` captures are 404 bodies | the bank is real (`data/fi-jyvaskyla-2026.json`, 353 rows) but no captured artifact behind it survives, so the provenance is unverifiable from the archive |
| Seychelles, Victoria 29/29 at 17.75/17.25 | `sc/iso-jumada-akhiraah-timetable.pdf` is a 403 body | the record says "curl 403, captured via the PDF text layer", so the bank may be sound, but the artifact that proves it is an error page |
| Islamic Academy, "series stop 2013 USA / 2010 Indo-Pak-Bengal, all 404" | four 16-byte `File not found.` files | a 404 at a guessed URL is not a series stopping. Rewrite as "not found under these URLs" |
| Wrexham and Dundee, whose failing months are recorded as publisher absences | 404 bodies for the months that fail (12 Wrexham files, 2 Dundee) | the fits are sound (58 rows Aug-Sep, November only), and the NEXT items must not let the failures become "the mosque publishes nothing" |

**Recommendation: a.** Reopen four verdicts and rewrite the class count as 68. A capture failure is
evidence about the fetch, never about the publisher, and the four above are the only places where the
two were confused.

**Cost.** a costs one small wave (four re-fetches, one provenance check). b re-fetches 68 URLs and
reopens verdicts the blocks already recorded with their cause, which spends a wave to confirm
documented 403s. c leaves four claims resting on artifacts that are error pages, in a record that
grades those claims.

**Owns.** The close records the corrected count. The four reopens go to the next round's re-cover set,
with Jyväskylä first because a 353-row bank with no artifact is the one a builder would ship.

---

### D8. Chaguanas: a one-line fix in a third-party config

**Question.** The Trinidad tenant computes correct events and renders them on New York's offset.
Does the record fix it or record it?

**Mark.** Conservative.

**Options.**
a. Record the defect class and the fix, correct nothing, carry no margin.
b. Carry a −60 minute correction in the object.
c. Drop the surface.

**Evidence.** The settings blob reads `"country":"TT"` and `"timezone":"America/New_York"`, every row
carries −05:00, and fitted on the declared clock the four solar columns reproduce at 0.2-0.4 minutes
MAE at Chaguanas. The error is exactly 60 minutes from early November to early March, and zero by
accident from March to November when New York daylight time equals Trinidad's. The fix is one line in
the tenant's own settings.

**Recommendation: a.** The record cannot edit a third-party config, the standing rules forbid
contacting the operator, and a hand margin would ship a second error for seven months of the year.

**Cost.** a leaves a reader of that surface 60 minutes early for four months, which is why the object
must carry the defect line and not a silent recipe. b is the trap: a −60 margin is correct for four
months and wrong for seven. c loses a gated Trinidad surface over a configuration typing error.

**Owns.** Close: the defect line on `TT-MASJIDBOX` and the class register (D14).

---

### D9. Lebanon's 16 undated district tables: drop or stay

**Question.** The platform's 16 district tables carry no year. Do they drop from the record or stay as
undated objects?

**Mark.** Conservative.

**Options.**
a. Stay as one undated object, `recipeStatus: surface-only`, no grade, never scored.
b. Drop them, since al-Manar now dates seven cities.
c. Attach the current civil year and score them.

**Evidence.** The regional JSON holds no year. All four probed tables share one `Last-Modified` of
2026-10-28 18:14Z, which dates the upload and not the times. Table 2's file from 2026-04-07 and the
live file of 2026-11-11 parse to the identical 366 rows value for value, so the generation has not
moved in seven months. The archive holds one table once. 244 tenants sit on these tables, every one
of them `table-api`, so no tenant screen can date them either. The dated print is a different line:
on 2026-01-01 Beirut the platform prints fajr 5:07 against the print's 5:24, with sunrise, dhuhr and
asr agreeing to the minute and every twilight disagreeing. The family measures 68.9 pc across the
tenants, with Beirut 76.9 pc and Tyre 66.0.

**Recommendation: a.** The object is the only surface 244 tenants use and the record's proof that a
Lebanese platform line exists as distinct from the al-Manar print. An undated object is already a
legal shape in v2.5, and `LB-MASJIDI-16-TABLES` in the fit index is exactly that shape.

**Cost.** a costs a reader who wants a year and does not get one, which the object says. b loses the
tenant layer and the second line. c invents a year from an upload timestamp, which is the same class
of error as reading a clock, and would create 366 dated rows no publisher vouches for.

**Owns.** Close: o1m-36 keeps the entry at `surface-only`. o1m-24's NEXT (a second capture months
apart, and CDX on the other fifteen ids) is the route to a year.

---

### D10. Kuwait's one row and Oman's sixty villages: national line or per-city

**Question.** Does the record carry one national line for Kuwait and for Oman, or stay per-city?

**Mark.** Conservative.

**Options.**
a. Kuwait one national line. Oman per-city, with a national recipe.
b. Both one national line.
c. Both per-city.

**Evidence.** Kuwait is settled at the publisher: the ministry's own link graph carries no prayer page,
and the calendar it adopts is named publicly by a third party as the ministry's, according to the
astronomical almanac of one author. Its 2026-11-11 row is identical in all six columns to the held
`alojeiri.com` row, and both pages say "one row for Kuwait City and its suburbs". The ministry's
calendar has one row, so there is no governorate axis to model. The fit index flags it
`F-KUWAIT-NO-AXIS`.

Oman is the opposite shape and the round improved it without settling it. All 86 CityIDs are now
named from the ministry's own page in CityID order, verified to the minute at rows 1 and 2. 77 of the
86 geocoded, 9 returned no locality and several matched a street, a filling station or a caravan site.
26 fit at 99.8-100 pc at their own points. The other 60 have no published point, recover longitude to
0.05 degrees and latitude only to 1.0-1.3 degrees, and land at 54.7-67.3 pc. A national-recipe pass at
the same gazetteer points does not hold: it drops to 22.1 pc, because the wilayat centroid sits 10 to
40 km from the ministry's computed town. The rule and the point are not separable on this evidence,
and the wave said so rather than quoting the flattering number.

**Recommendation: a.** Kuwait's publisher states one row. Oman's publisher states 86 areas and its
points are not the ministry's points, so the record keeps per-area pairs and does not promote a
national recipe on them.

**Cost.** a costs Oman 60 named-but-unclaimed anchors and a per-area rule-form, which is the honest
state. b would put a national recipe on 86 areas whose points are 10 to 40 km from the publisher's,
at 22.1 pc. c would model Kuwait as 86 places it does not have.

**Owns.** Close for Kuwait (one line, no object change). Next round for Oman's 60 points, from their
own sun columns at higher precision, which is o1m-6's own NEXT.

---

### D11. Algeria's isha 17.00/0 ceil: adopt over 16.10/+5

**Question.** The re-parameterisation is confirmed on a second Hijri year. Does the object adopt
17.00/0 ceil over the frozen 16.10/+5?

**Mark.** Conservative.

**Options.**
a. Adopt 17.00/0 ceil and write the Algerian object.
b. Keep 16.10/+5 as the record's description.
c. Carry both as `recipeVariants`.

**Evidence.** The 1448 ministry book was found through the archive, sixteen pages, image-only, eight
months transcribed with a token-count identity gate: 235 days transcribed, 219 kept, 16 withheld
(never corrected). One recipe reproduces all six columns at 219/219 within-1, every month perfect on
its own. Isha:

| Description | Exact | Within-1 | Worst |
|---|---|---|---|
| 17.00 / 0 ceil | 194/219 (88.6 pc) | 219/219 | 1 |
| 16.10 / +5 nearest (frozen) | 102/219 (46.6 pc) | 185/219 | 2 |

The seasonal amplitude is large in both twilight columns (fajr spans 169 minutes, isha 166), which is
what a 36.75 N site must show, and the two spans being near-identical is the signature of a symmetric
pair. The two books are a recomputed year, not a reprint: same-cell drift tracks the engine's own drift
to 0.36 minutes.

**Recommendation: a.** A faithful description beats a frozen one by 92 exact days in 219, and the
record currently holds no fitted Algerian object at all, so nothing has to be unwound to write the
right one.

**Cost.** a costs one object written and a grade statement (A stands with the deficit recorded: one
wilaya, 219 of 354 days). b keeps a description that misses the winter months it missed last year. c
is a presentation choice on a pair that is not degenerate: the two forms separate by 92 days, unlike
the Oman and Iraq cases where `recipeVariants` was written.

**Owns.** The close writes the object from `fit/dz48-fit.json`. o1m-30 owns the evidence.

---

### D12. Tunisia's FLAT successor: adopt the angle normalisation

**Question.** The record's Kairouan/Sidi Bouzid rule is a dip window. The round refutes the mechanism.
Does the record adopt the correction and change the world table?

**Mark.** Conservative.

**Options.**
a. Adopt: an angle normalisation to 18.00/18.00 at 20 of 22 delegations, dated between 2025-12-16
and 2026-01-10, permanent through 2026-12-31. Correct `TN-INM-FLAT2026` and the world-table
rule-form.
b. Keep the dip-window description.
c. Widen the window to the whole year.

**Evidence.** The record's description has two halves and both are wrong. Same-date pairs at identical
published coordinates: 2024-12-16 and 2025-12-16 are identical to the minute, 2026-12-16 has moved.
Twenty of 22 delegations moved from per-delegation angles of 18.25 to 18.70 to exactly 18.00, with a
2026 residual of 0.00 to 0.05 degrees against the flat line. The change is present in July, September,
November and December 2026, so it is permanent rather than a window. The horizon columns did not move,
which is what refutes the dip: a dropped dip would have moved maghrib, and maghrib's residual is 3.2
to 5.9 minutes against the same fit in both eras. Two delegations never changed (18.70 and 18.55),
which is why the record's count of 20 was right while its mechanism was wrong. At the 22 governorate
capitals, 2024 and 2025 are identical to the minute and 2026 differs by at most one minute at 21 of
22, so the normalisation is local and the national line is unchanged.

**Recommendation: a.** A measured mechanism should replace an inferred one, and the world table's
rule-form line is the only place the wrong mechanism is written down.

**Cost.** a costs one rule-form rewrite and no re-fit, because the numbers were always right. b keeps
a dip explanation that the horizon columns refute, and the next round will test it again. c describes
a permanent change as a window, which would split a span that must not be split.

**Owns.** The close: o1m-34 (wtdiff3) carries the correction as C1 of the o1m-30 set, and
`policy-layer` v2.6 records the branch under `recipeVariants` for the 20 delegations.

---

### D13. The polar five: five rule-forms per country or one

**Question.** Can the record carry five high-latitude rule-forms across Norway, Sweden and Belgium, or
must it pick one per country?

**Mark.** Conservative.

**Options.**
a. One rule-form per object, never per country, with a new kind for the synthetic row and a parameter
for omitted days.
b. One rule-form per country.
c. One rule-form for the Nordic region.

**Evidence.** Five publishers, five behaviours, each measured on its own dated rows:

| Publisher | Country | Behaviour | Measured share of the night |
|---|---|---|---|
| tawkit | Russia, Norway, Sweden | half-night plateau at the middle of the night | 0.498-0.500 |
| islam.nu | Sweden | one third each side, one third left | 0.300 / 0.283 |
| tawkit | Norway (deep polar) | 118 days omitted from the table | n/a |
| Diyanet | Svalbard | synthetic solar row, sunrise frozen 09:17, asr set equal to dhuhr | n/a |
| Grand Mosque of Iceland | Iceland | roughly a quarter of the night | 0.236 |

The record's schema can already express three of these: `middleOfTheNight` for the plateau,
`nightPortionSplit` for the third and the quarter, `displaySuppress` for suppression. It cannot
express a synthetic solar row, and `displaySuppress` describes a suppressed row rather than an absent
one. The array holds 12 kinds while `fieldGlossary` still says "one of the eleven kinds", so a count
inside the schema is already stale.

Country-level coexistence is already on the record: Norway carries `NO-RABITA`, `NO-MAWAQEET` and
`NO-JAMIAT`, and Sweden carries `SE-MOSQUE` and `SE-ISLAMNU-13`, which disagree on every summer day
and agree on every winter day.

**Recommendation: a.** One object per publisher is the shape the record already uses, and two small
additions close the gap: a kind for the synthetic solar row, and an `omittedDays` parameter carrying
the dated windows a table does not print.

**Cost.** a costs one schema field and a corrected count, and no country's grade moves. b prints one
publisher away from its own table for half the summer, since the two shares differ by a fifth of the
night. c does the same across three countries that already disagree within one of them.

**Owns.** `policy-layer` v2.6 for the kind, the parameter and the count. o1m-8 owns the measurement,
o1m-R1r the Norwegian gate rule.

---

### D14. The relabel class and the postback defect: a defect register

**Question.** Do the mawaqit `?year` relabel class and the Diyanet city-postback defect become named
platform defect classes in the policy layer, or stay as prose in the blocks?

**Mark.** Conservative.

**Options.**
a. Register both, with the detection test, in one machine-readable list.
b. Keep them in the round's prose reports and the corrections register.
c. Register them in the fit index as per-entry flags only.

**Evidence.** The relabel class stands at 25 of 25 surfaces with no exception: 15 in `o1m-18-africa2`
(Savalou, Korhogo, Freetown, Old Yundum, Koina, Ngaoundere, N'Djamena, Bangui, Brazzaville, Malabo,
Port-Gentil, Goma twice, Libreville, Lome) and 10 from o1l-33, each returning the 2026 table for 2027
with 0 of 365 cell differences and 404 at 2028. It has also sharpened into a trap: `?year=2027` now
rewrites the date column while all 365 rows stay identical, so a payload-date check passes and only a
value diff catches it.

The Diyanet postback defect is equally mechanical: 61 of 61 non-first-city requests returned one
150-row table, one md5 across six countries. A genuine table is 30 rows and the shared default is
150, so the row count is the detection test. The same family produced two more instances this round:
the Kuwait almanac's `?date=` parameter relabels the day and serves today's times, and Tunisia's
archive answers 200 with `{"data":null}` for 2027 dates.

**Recommendation: a.** A defect class is a test, and a test belongs beside the schema rather than in
five reports. The class has now been found, confirmed, sharpened and re-found across two rounds, which
is the cost of prose.

**Cost.** a costs one array in `policy-layer` v2.6 with about eight entries. b is the current state,
and it has already cost two rediscoveries. c only covers platforms that carry a fit entry, so a defect
on a surface with no entry would be lost.

**Owns.** `policy-layer` v2.6, written at the close. No owner line needed: o1l ruled the four platform
defect classes a mechanical close action, and these are the same shape.

---

### D15. New: the LUPT asr break at 2027-01-01

**Question.** The London publisher adds +2 minutes to both asr columns from 2027. Does the record
carry one rule across 2026-2076 or two eras?

**Mark.** Decided.

**Options.**
a. Two eras: asr +0 through 2026-12-31, +2 from 2027-01-01, both mithl columns, no blending.
b. One rule across the whole span.
c. Leave the seam to the app's baked artifact without a rule on the record.

**Evidence.** The 2026 print carries no asr allowance (mean +0.44 on mithl 1, +0.61 on mithl 2,
scattered by rounding). The 2027 block carries exactly +2.00 on both columns at 365 of 365 days, and
the publisher states it on its own technical page. The break is one step at 2027-01-01 with no second
step to 2076 across fifty published years. Two independent 2026 artifacts (a mosque's live table and
a mosque's printed calendar, different publishers and media) agree on all 123 overlapping asr cells,
so the 2026 side is not one surface's quirk. No pre-2027 edition survives: the monthly pages
301-loop and the 2026 workbook 404s.

**Recommendation: a.** **Decided**: `FIT-RULES.md` already names "London 2026/2027 asr" as a dated
regime change that must never be blended, and this wave measured the size of the step.

**Cost.** a costs nothing and matches the binding rule. b moves every 2026 asr by 1 to 3 minutes and
contradicts the surfaces that printed the old generation, of which 14 of 16 London-area surfaces did.
c leaves the shipped artifact's seam unexplained, and a seam that is publisher behaviour reads as a
bake error to the next reader.

**Owns.** The record's `GB-LUPT` entry takes the era split, and o1m-35's NEXT re-probes the two
pointers for their first 2027 rows, which turns the transfer from a rule consequence into a
measurement. No owner line unless the owner wants one rule across 2026-2076, which is the only
alternative and is the owner's to choose.

---

### D16. New: "measured" is a seventh class, and the counts are hand-maintained

**Question.** The fit index grades two entries `measured`, a class the grading vocabulary does not
carry, and its counts block drifted inside one build. Does the round admit the class or map it?

**Mark.** Conservative.

**Options.**
a. Map the two entries to existing classes, and assert at the close that the counts block equals the
entries.
b. Admit `measured` as a seventh class.
c. Leave both as they are for the next round.

**Evidence.** The returned `FIT-INDEX-ROUND3.json` holds 154 entries with grades A 31, provisional 85,
candidate 25, community 11, measured 2, and its counts agree. An intermediate read of the same file,
twelve minutes earlier, declared 153 entries and A 30 while the entries array already held 154 and 31,
so the block is maintained by hand and drifted while the builder ran. That is worth an assertion and
not a correction: the returned file is right.

The two `measured` entries are `CN-NORISLAM-10` (China's norislam grid at 10 points, 15/15 Hanafi,
MAE 0.25-1.09, an undated 2004 computation) and `ENGINE-CONSENSUS-184` (a cross-engine matrix, which
is not a country row at all). Two more carried classes, `A-candidate` (Thailand) and `A eligible`
(Tanzania, Portugal), are phrases outside the vocabulary.

o1l O9 already ruled the shape of this question: name the movers inside the six classes and refuse a
seventh, because a class the vocabulary does not carry makes the total mean nothing.

**Recommendation: a.** `CN-NORISLAM-10` is a community surface with a measured recipe, so it belongs
at community. `ENGINE-CONSENSUS-184` is an analytical artifact and belongs nowhere in a country
register. The counts assertion is the durable part, since a registry that cannot state its own size
cannot be cited.

**Cost.** a costs one relabel and a three-line assertion. b makes the class arithmetic uncloseable
again, which is the exact defect o1l O9 was written to end. c leaves a cited registry whose header is
maintained by hand, in a round whose reports quote it.

**Owns.** o1m-36 (fitindex3), before the close cites it.

---

## 2. Counted

| Mark | Items | Numbers |
|---|---|---|
| Decided, with the source named | 4 | D1, D5, D6, D15 |
| Owner | 2 | D2, D3 |
| Conservative, decidable on the evidence | 10 | D4, D7, D8, D9, D10, D11, D12, D13, D14, D16 |
| Total | 16 | |

Of the fourteen questions the round was sent with, three are already settled in the record or by a
binding rule (D1, D5, D6), one is the o1l O14 clause carried forward unchanged (D3), and one premise
needed correcting before it could be answered (D4: a 16-degree-band isha, 15.4 to 16.6 degrees, is
carried by at least one family in 99 countries, not uniquely by Diyanet). Two questions were added:
D15, which `FIT-RULES.md` had already ruled and nobody had measured, and D16, which the fit index
created while this sheet was being written.

---

## 3. What this sheet does not decide

Mechanical close actions already ruled, needing no line: the class arithmetic of the 32 lifted
FALLBACK rows once D3 is answered, the grade movements the fit index already carries, the Morocco
record corrections (no pre-rebuild month in the archive, the winter month cannot discriminate the
decree), the Libya trap (the named app's domain is a design agency), the masjidi regional tables
having no date field, and the four platform defect classes o1l ruled mechanical.

Items already carried as flags rather than decisions: Morocco's December absence, Libya's single
cycle, Bahrain's honest negative, Qatar's axis-free endpoint, Maan's displaced 2027 page, and the
Kuwait almanac's relabel defect.

Not in scope and not decided here: anything owned by the five waves that have no block at this read
(`o1m-29`, `o1m-31`, `o1m-32`, `o1m-33`, `o1m-34`), including Pakistan's chart family, the Kazakh
national layer, Indonesia's 2028 to 2030, the Central Asia appeal, the index build and the round's own
world-table diff.

---

## 4. Basis and cautions

Every figure above is traceable to the block, workspace or script named in its item. Where a block and
the fit index disagree, the block governs, per the o1l precedent.

Four cautions travel with the sheet.

- The fit index is a live file. It grew from 153 to 154 entries while this sheet was written, so any
  count quoted from it carries the read time and must be re-cut at the close.
- `world-table-v3.json` and `policy-layer.v2.5.json` are the pre-round record. Nothing in this sheet
  has been applied to either, and the o1m movements will land through o1m-34's diff.
- The `.pdf` class count is mechanical. It measures the artifacts on disk, not the fetches that
  produced them, so a file can be a real PDF with leading whitespace and a deliberate HTML capture is
  not a failure. The script's classes are in `data/pdf-class2.txt` line by line for audit.
- The FALLBACK count is a presence test, not a grade. A row with one dated month is `candidate`, and
  the script says nothing about quality. 22 of the 32 lifted rows hold a turktakvim table, which is
  one engine at many points and is not 22 independent witnesses.
- No clock was read into any figure. The minute deltas in D4 come from four literal dates through
  adhan 4.4.6, and every date quoted elsewhere is either a capture's own printed date or a date named
  in a block.
