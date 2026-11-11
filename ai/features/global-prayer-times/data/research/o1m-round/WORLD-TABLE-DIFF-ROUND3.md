# WORLD-TABLE-DIFF, O1m round 3

Built by O1m-34, 2026-11-11, for the o1m close. Read-only against the record: this document
proposes, it edits nothing.

> **AS FAR AS THIS DRAFT GOES (owner stop order, taken mid-build).** All ten sections are drafted.
> The counted arithmetic is machine-produced and closes: `data/class-arithmetic.py` and
> `data/row-counts.py` both run green, and the identity 28 + 53 + 77 + 16 + 0 + 3 + 2 = 179 = 174 + 5
> is the script's own output, not a hand sum. NOT yet done, and named so the next reader does not
> mistake it for checked: (a) the per-region row counts in section 4 were bucketed by script but the
> 49-row table itself was written by hand and has not been cross-read against the register's A items;
> (b) the 48-object amend list in 6.3 was assembled from the corrections and not de-duplicated by
> script; (c) the twelve D-forms quoted in full in 6.1 were transcribed from the register and not
> diffed back against it word for word; (d) section 5.1's closing paragraph compresses the 22 C items
> that move no class and its brackets are a summary, not an enumeration. Nothing here is adjudicated.

**Record of reference:** `world-table-v3.md` and `world-table-v3.json` (174 rows, classes A 17 /
provisional 40 / candidate 65 / community 15 / F 2 / FALLBACK 35, the counts block agreeing with the
rows entry for entry) and `policy-layer.v2.5.json` (87 objects), both under
`ai/features/global-prayer-times/data/census/`, both read-only.

**Corpus diffed:** the 52 CONSOLIDATION blocks present in `o1m/CONSOLIDATION.md` at this build, from
O1m-R2 to O1m-39, digested by `o1m-42-corrections/CORRECTIONS-ROUND3.md` (A 82 corrections, B 31 new
rows, C 75 grade and span movements, D 39 rule-forms, F 22 flags, sequence-checked with no gaps),
re-cut against `o1m-46-fitrefresh/FIT-INDEX-ROUND3B.md` (162 entries, 89 countries) and
`o1m-37-decisions/DECISIONS-ADDENDUM-ROUND3.md` (16 items).

**Workspace:** `$HOME/athan-gitree/census/o1m/o1m-34-wtdiff3/`. The two scripts that produce the
counts are in `data/` and their output is quoted where used.

---

## 1. Counts at the top

| Quantity | Count | Where |
|---|---|---|
| NEW ROWS (register table B) | 31 items, decomposed: 5 new country rows, 8 FALLBACK lifts, 8 first or extended dated layers, 5 new authority surface classes, 3 platform families, 1 widened country row, 1 unclaimed city | section 3 |
| New country rows (no row in v3 at all) | 5: Nicaragua, Aruba, Greenland, Svalbard, Faroe Islands. 174 rows become 179 | section 3.1 |
| FALLBACK rows that now hold a dated surface | 32 of 35, script-counted (22 turktakvim, 28 Diyanet tree, 18 both, 5 tree alone). 33 with the o1l O2 clause on French Polynesia | section 3.2 |
| FALLBACK rows still holding nothing | 3: Cyprus (south), Western Sahara, French Polynesia. 2 with the clause | section 3.2 |
| CHANGED ROWS (distinct v3 rows a correction touches) | 49 rows, plus 1 row absent from v3 (Bolivia) and 6 non-row items, from 82 corrections | section 4 |
| GRADE AND SPAN MOVEMENTS (register table C) | 75 items, of which 53 change a country row's class | section 5 |
| Class count shift | A 17 to 28, provisional 40 to 53, candidate 65 to 77, community 15 to 16, F 2 to 0, FALLBACK 35 to 3, UNNAMED 0 to 2 | section 5.2 |
| Row identity check | 28 + 53 + 77 + 16 + 0 + 3 + 2 = 179 = 174 + 5 | section 5.2 |
| RULE-FORMS (register table D) | 39, of which 12 are given in full | section 6 |
| FLAGS | 23 in the fit index, 22 in the register, the two sets overlapping in 15 | section 7 |
| Objects to ADD to policy-layer | 49 rows move or enter and hold no object today (5 new countries and 44 movers). One per row takes 87 to 136 | section 6.3 |
| Objects whose fields change | 48 | section 6.3 |
| Fit index, the other register | 162 entries, 89 countries, grades A 33 / provisional 90 / candidate 25 / community 11 / measured 3, flags 23, conflicts 49 | section 5.4 |
| Round volume, from the summary block | 13,340,267 dated rows raw, 10,073,002 after the same-surface collapse, 21,877 data files, 10.31 GiB on disk and 46.77 GiB original-equivalent | O1m-38 |

**The single most consequential count fact:** FALLBACK falls 35 to 3 while A rises 17 to 28. No round
in the census has moved this many rows at once, and the movement is a PRESENCE test, not a grade. Two
of the three rows left behind are named absences with dated probes (Cyprus south, French Polynesia),
and the third is contested by this round's own block (section 2.1, conflict 5).

---

## 2. Method, and how conflicts were resolved

1. **Report over log, later block over earlier.** Where two blocks disagree, the later CLOSED verdict
   governs and the earlier reading is carried as superseded, never deleted.
2. **The register is a digest, the blocks are the measurement.** Where the register's line and the
   block's number differ, the block's number is carried and the register line is quoted beside it.
   Every figure below is traceable to the block named in its row.
3. **No adjudication.** The flags in section 7 stay exactly as the round left them. Nothing here moves
   a grade on its own authority; the class table in 5.2 is arithmetic on the register's own lines.
4. **Reading columns compress the row.** The "v3 reading" columns are a compression of the row's own
   wording, written by this diff. Quoted clauses are verbatim.
5. **The register's five new countries is the counted authority.** Where the record shows a country
   absent that the register does not count as new (Macau, North Korea), the diff says so and prices
   the alternative rather than adding a sixth row to a counted five.
6. **The baseline is v3, untouched by round two.** The o1l world-table diff's 18 new country rows and
   its class movements were never applied to the record. This diff therefore stacks on 174 rows, and
   section 5.3 states how the two rounds compose.

### 2.1 Conflicts the diff had to settle, and how

| # | Conflict | Resolution carried here |
|---|---|---|
| 1 | Iran: register C1 writes "FALLBACK to A"; v3 carries `IR-NATIONAL` at provisional | The record governs the starting class and the block governs the measurement: provisional to A. The register's word is quoted in 5.1. `o1m-6r` |
| 2 | Czechia: register C38 writes "candidate to A"; v3 carries `CZ-CENTRUM` at A | No movement. The register describes a starting state the record does not hold. The block's six-year fit is carried as a span widening. `o1m-R4` |
| 3 | Iceland: register C47 writes "provisional"; v3 carries `IS-FELAG` at A and o1l C51 wrote "A, nine cities" | A carried, the register line quoted. The block adds the nine-city surface and the isha conflict, and moves no grade. `o1m-8` |
| 4 | Macau and North Korea are absent from v3 but the register counts neither among its five new countries | Carried as B10 and B11 rows (first dated layer, closure lifted) and NOT counted in the 5. Section 5.3 prices the two-row alternative: 181 rows. `o1m-11` |
| 5 | Western Sahara: D3's presence test says it holds nothing; `o1m-45` measures a surface and calls it a CLOCK dispute | Both carried. FALLBACK held at 3 on the script's count, with the block's reading named. `o1m-45`, `o1m-37` |
| 6 | India: register C14 writes a "three-layer measured set", a phrase outside the six classes; o1l proposed community | Counted UNNAMED. The community alternative is priced in 5.2. `o1m-17`, `o1m-23` |
| 7 | Tanzania, Uganda, Mexico: the register gives no class, D3's blanket ruling gives candidate, o1l wrote A-eligible and fitted | Candidate carried (D3, the counted authority). The undersell is named in 5.2. `o1m-18`, `o1l-20r` |
| 8 | Pakistan Quetta: register F21 records the later panels as carrying an extra leading column, "Apr-Dec decode to nonsense, none banked"; `o1m-39` returned after the register with the cause found | The later block governs: a 12-hour zuhr dial (210 cells inside the summer block) plus a +60-minute clock block from 3 April to 29 October, and Quetta's own +4 margin set is one of four genuinely different tables. `o1m-39` overturning `o1m-28` |
| 9 | Finland: the register's four reopen items; `o1m-44` returned after it with three corrected verdicts | The block governs: Jyvaskyla's 12 lowercase PDFs are real, three recomputed years at 18/17 zero margin, entry grade provisional to A; Seychelles sunrise corrected to 05:54; the Islamic Academy series is a Hijri calendar, not a prayer table; Wrexham gains 64 rows from a filename family the wave guessed wrong. `o1m-44` |
| 10 | The `.pdf` error-body class: the OCR block named 30, the register's script counts 68 across 12 workspaces | 68 carried as the measured class, with 4 verdicts reopened and 64 deliberate negatives standing. `o1m-37` D7, `o1m-20` |
| 11 | The fit index's own flag counter says 14 entries carry a flag while its flags table carries 23 flags | Both quoted. 23 flags across 14 entries is the reading that reconciles them. `FIT-INDEX-ROUND3B` |
| 12 | The index was cut before five blocks returned (o1m-39, o1m-40, o1m-41, o1m-44, o1m-45) | Named as index lag in section 8. Their measurements are in this diff and in no index entry. `o1m-48` |

---

## 3. NEW ROWS

The register's table B carries 31 items. Decomposed by this diff: 5 new country rows, 8 FALLBACK rows
lifted to a dated row, 8 existing rows gaining a first or extended dated city layer, 5 new authority
surface classes, 3 platform families, 1 country row widened, 1 city recorded and not claimed. The
decomposition is the diff's, the measurements are the blocks'.

### 3.1 New country rows, 5

None of these countries has a row in `world-table-v3.json`. Each therefore also needs an object in
`policy-layer.v2.5.json` (section 6.3).

| # | Country | Tier | Surface and rows held | Verdict as measured | Block |
|---|---|---|---|---|---|
| N1 | Nicaragua | community | Managua, mawaqit, 365 rows, fajr 15+0, isha 15+5, all six columns within 1 | provisional | O1m-19 caribbean-central (`o1m/o1m-19-caribbean/`) |
| N2 | Aruba | community | Oranjestad, Aruba Mezquita Savaneta, mawaqit, 365 rows, 14.8/14.8 Shafi, 100 pc on all six, worst 1 | fitted (phrase outside the six classes; counted community on the tier, the o1l new-row precedent) | O1m-R6 americas (`o1m/o1m-r6-americas/`) |
| N3 | Greenland | platform | Nuuk, Diyanet, 30 dated rows, computed near 61N on a UTC-3 clock | candidate. Defective and measured: solar gate 59.58 min, printed day length 7h06 against 6h16. No fit claimed | O1m-8 arctic-nordic (`o1m/o1m-8-arctic/`) |
| N4 | Svalbard | platform | Longyearbyen, Diyanet, 30 dated rows, sunrise and maghrib frozen through the polar night (14:17 and 09:17) | candidate. A publisher fixture, not a measurement of the sky | O1m-8 |
| N5 | Faroe Islands | platform | Torshavn, athanpro month, solar gate at 0.17 min median, 18.0/17.0 Shafi | candidate. One month, one surface; the country leaves the negative list | O1m-8, O1m-45 |

**Two absences the register does not count as new countries.** Macau (B10: one city, 365 rows, 100 pc,
provisional) and North Korea (B11: one platform city page, dated rows, provisional at one city) hold no
row in v3 either. The register files them as a first dated layer and a lifted closure. The counted
five stands; section 5.3 prices adding the two (181 rows).

**Six countries the mission asked after, checked against the record and the blocks:**

| Country | In v3? | Reading |
|---|---|---|
| Nicaragua | No | New country, N1 |
| Suriname | Yes, `SR-NONE` FALLBACK | A LIFT, not a new row: Paramaribo, namazvakti, 365 rows (18.35+2 / 16.75+8), calculator tier, provisional. B2 |
| Faroe Islands | No | New country, N5 |
| Greenland | No | New country, N3 |
| Svalbard | No | New country, N4 |
| Mongolia | Yes, `MN-ULAN` candidate | NOT a new country. Lifted to provisional: 67 Diyanet city tables plus three measured cities, the summer clamp sitting at -11.2 deg at printed fajr, flagged and not modelled. B8, `o1m-11` and `o1m-10` |

### 3.2 Lifted out of FALLBACK, 32

Each of these rows exists in v3 with a one-line FALLBACK reason. The reason is now answered by dated
data. D3 is the counted authority: "a dated table at a named place's own coordinates lifts FALLBACK at
platform tier, whichever family serves it", script-counted at 32 of 35.

| # | Country | v3 reason being answered | Surface and rows | Class carried | Block |
|---|---|---|---|---|---|
| L1 | Romania | no surface (C6 negative) | 53 Diyanet-abroad localities, 19,345 rows for 2026, plus four mawaqit tenants and a Turkish imsakiye for Constanta | provisional | O1m-7r europe, B15 |
| L2 | Turkmenistan | the muftiate is a negative, six searches | Six Diyanet cities, 2,190 rows, 97.9-99.5 pc within-1 on the 18/17 temkin block | provisional | O1m-10 centralasia, B7 |
| L3 | Nepal | "confirmed nothing" | Darul Ifta twelve-month Kathmandu cycle, 366 rows, 19.10/18.31 = MWL 18/17 plus a 1.1-deg dip at 1,400 m, Hanafi asr, Ramadan 1446 sheet 30/30 | provisional | O1m-1 fallback-eleven, B12 |
| L4 | Taiwan | "no stable rule", manual buffering | 10 cities, 3,650 rows, 100 pc within-1 from the Diyanet tree | provisional | O1m-11 eastasia, B9 |
| L5 | China | "the association publishes nothing" | 222 Diyanet cities at 18/16 plus a measured ten-point county grid at 15/15 Hanafi | provisional | O1m-11, O1m-R7r, C23 |
| L6 | Azerbaijan | the muftiate is image-only | Ganja, Sumqayit, Lankaran and Sheki at 18/17 with zero margins on every column, 100 pc within-1 | provisional | O1m-10, B30 |
| L7 | Suriname | no publisher beyond the Jamiat row | Paramaribo, namazvakti, 365 rows, 18.35+2 / 16.75+8 | provisional | O1m-19, B2 |
| L8 | Samoa | gazetteer genuinely empty | Apia, Diyanet, 365 rows, 18/17 at zero twilight margins, solar margins sunrise +7, dhuhr -5, asr -4, maghrib -7, 365/365 within-1 | provisional | O1m-9 oceania, B13 |
| L9 | Kiribati | honest negative, five languages | Ahmadiyya Ramadan 2026 sheet, 30 rows, maghrib 30/30 exact, five of six columns fixed clocks | candidate, defect recorded | O1m-1, B14 |
| L10 | Chad | no national surface | turktakvim and Diyanet dated tables at the country's settlements | candidate | O1m-4r, O1m-13 |
| L11 | Guinea-Bissau | no surface (C20 wave) | dated tables at the country's settlements | candidate | O1m-4r |
| L12 | Benin | the held capture is Kandi, not Cotonou | dated tables; Savalou's 365 rows from o1l stand as the country's first real table | candidate | O1m-4r, o1l-50 |
| L13 | Central African Republic | no surface | Bangui 365 rows, ISNA 15/15, 365/365 within-1, held from o1l; the platform layer adds the country | candidate | O1m-4r, o1l-48 |
| L14 | Ethiopia | EIASC is news-only, Addis is today-only | dated tables across the country's settlements | candidate | O1m-4r |
| L15 | Eritrea | closed negative | dated tables | candidate | O1m-4r |
| L16 | Tanzania | BAKWATA negative, KSIJ Dar is Shia | Dar es Salaam two independent witnesses on one recipe (17.90/17.10, 2,136 and 2,109 of 2,190); Arusha 1,095 rows 2025-27 held from o1l | candidate (o1l wrote A-eligible, section 5.2) | O1m-18 africa-year2 |
| L17 | Uganda | ministry domain unresolvable | Kampala 17.90/17.35 against Entebbe's 15/15, the country's two lines | candidate | O1m-18 |
| L18 | Rwanda | honest negative | dated tables | candidate | O1m-4r |
| L19 | Burundi | honest negative | dated tables | candidate | O1m-4r |
| L20 | South Sudan | honest negative | dated tables | candidate | O1m-4r |
| L21 | Namibia | no publisher beyond the Jamiat row | Diyanet tree alone | candidate | O1m-37 D3 |
| L22 | Angola | no publisher beyond the Jamiat row | dated tables | candidate | O1m-4r |
| L23 | Madagascar | one Masjidbox mosque, Mahajanga at 0.0 | 3 mosques held from o1l plus the platform layer | candidate | O1m-4r, o1l-48 |
| L24 | Comoros | honest negative | dated tables | candidate | O1m-4r |
| L25 | Myanmar | honest negative | dated tables | candidate | O1m-4r |
| L26 | Armenia | no surface | Diyanet tree alone; tawkit's 18 cities are parameter-blind | candidate | O1m-37 D3, O1m-10 |
| L27 | Mexico | no surface | Diyanet tree alone; the o1l Guadalajara two-year fit remains unadopted in v3 | candidate | O1m-37 D3 |
| L28 | Guyana | honest negative | dated tables | candidate | O1m-4r |
| L29 | Papua New Guinea | honest negative | turktakvim 116 settlements, 42,340 rows | candidate | O1m-1 |
| L30 | Solomon Islands | honest negative | dated tables (Diyanet covers all but Solomon and Kiribati) | candidate | O1m-13 |
| L31 | Vanuatu | honest negative | turktakvim 1,825 rows | candidate | O1m-1 |
| L32 | India | "the community de facto Karachi method" | 23 mosque cities at A, a 70-city publisher layer at 18.0/18.15 Hanafi, 95 workbooks a frozen reprint of the same generation | UNNAMED (register C14; section 5.2) | O1m-17, O1m-23 |

**The three left behind.** Cyprus (south): no surface at any route, the record's one-line reason
unchanged. Western Sahara: D3's script finds nothing; `o1m-45` measures a surface and records a clock
dispute, so the row is carried at FALLBACK with that reading named. French Polynesia: nothing on D3's
test, and the o1l O2 masjidway month lifts it under the same clause, which settles 33 of the 35 and
closes the class at 2.

### 3.3 Existing rows that gain a first or extended dated layer, 8

| # | Row | What is added | Block |
|---|---|---|---|
| E1 | Mongolia | candidate to a first dated city layer: 67 Diyanet city tables plus three measured cities; the summer clamp at -11.2 deg at printed fajr, flagged and not modelled. Provisional | O1m-11, O1m-10 |
| E2 | Macau | absent to a first full year: one city, 365 rows, 100 pc. Provisional | O1m-11 |
| E3 | North Korea | the record's closure lifted: one platform city page, dated rows. Provisional at one city | O1m-11 |
| E4 | Vietnam | first DATED mosque table: Hanoi Al-Noor, 18.0/17.0 Shafi | O1m-5 asia-provinces |
| E5 | Cambodia | first dated mosque table: Phnom Penh Alserkal, 18.4 with fajr -5, 17.35 with isha +4 | O1m-5 |
| E6 | Laos | first dated mosque table: Vientiane Jamia, 18.0/18.0 Hanafi, isha printing nine minutes above the 18-degree crossing | O1m-5 |
| E7 | Palestine | candidate to a measured platform row: 25 cities at 18/18 with maghrib +5..+7, 99.4-100 pc within-1, Rafah 63.6 and Tulkarm 82.0 carried as publisher deviations | O1m-6r mideast |
| E8 | Lebanon | candidate to dated rows: al-Manar seven cities, 147 PDFs, 3,662 rows parsed, 1,381 past the solar-noon gate, two years, maghrib at the 4.5-degree depression, imsak nine minutes before fajr. The platform's 16 district tables stay community and undated | O1m-24 levant |

### 3.4 New authority surface classes and platform families, 8

| # | Item | What is added | Block |
|---|---|---|---|
| M1 | Oman, the 86 prayer areas | `calendar_page4.asp` prints all 86 in one table; 77 geocoded, 9 nothing, several a filling station or a street. 26 fitted at 99.8-100 pc, 60 recorded provisional and NOT claimed | O1m-27 gulf, O1m-40 oman |
| M2 | Qatar, the gateway record | `islam.gov.qa` is an Angular build whose `appsettings.json` names its gateway; `PrayerTimes?date=` answers per day; 2024-2027 in full, 1,461 rows, one recipe across four years | O1m-27 |
| M3 | Bahrain, the method record | The Al Zubarah almanac named by `sunniwaqf.com`; the stated recipe reproduces 2,130 cells at 100.0 pc within-1 across two compute sites | O1m-27, O1m-41 |
| M4 | DUM RF prints | Two live months transcribed (61 rows) plus sixteen archived prints (2023, 2024, 2026) with OCR text; the column-crop pass stays open | O1m-R8 russia-backward, O1m-20 |
| M5 | ESA imsakiya | One PDF per Hijri year, one page per city, Ramadan month with imsak and suhur; 1445, 1446-2 and 1447, 245 city-months, 58,080 cells, 99.12-100 pc within-1 at the recovered point | O1m-14 egypt-imsakiya, O1m-R3r |
| M6 | turktakvim African gazetteer | 8,565 settlements across 50 countries, 3,126,225 dated rows, every table exactly 365; one recipe (fajr 17.75, isha 18.75, sunrise -4, dhuhr +8, asr +8, maghrib +6), 138 cities fitted, 95 perfect | O1m-4r africa-continuation |
| M7 | salaahtimes | 112 towns, 2026 AND 2027, 81,760 rows, all 224 town-years fitted, angle drift 0.00 median between the years | O1m-4r |
| M8 | Diyanet tree | 209 countries, 365 provinces, 18,582 cities; 12,081 ids captured, 8,539 non-grid cities banked; the temkin ladder named across 207 countries | O1m-R7r diyanet-city, O1m-11 |

### 3.5 One widened row and one unclaimed city

| # | Item | Reading | Block |
|---|---|---|---|
| W1 | Kyrgyzstan | country row widened: 115 settlements (7,300 rows in the first pass, 41,975 in the second), one recipe, 15 ids are 404 gaps. The endpoint is year-blind, so every label is nominal | O1m-10, o1m-32 |
| W2 | Timor-Leste | one Diyanet tree city (365 rows, 18/17), NOT claimed: no authority surface and no block claims a country row. Recorded so the next round starts from what exists | o1m-r7-diyanet, B31 |

---

## 4. CHANGED ROWS

49 v3 rows whose text a correction overturns or a defect re-measures, plus 1 row absent from v3
(Bolivia) and 6 items that are not rows. 82 corrections compress into 56 items, sorted by v3 region.
"Row action" is what the close must write, not a grade.

### 4.1 British Isles and Europe, 12 rows

| Row | v3 reading | Round measurement | Row action | Block |
|---|---|---|---|---|
| United Kingdom (London) | "asr shadow-1 AND shadow-2 each +2" across the 50-year span 2027-2076 | The +2 is the 2027 ERA ONLY. The 2026 print carries +0.44 mean on mithl 1 with 195/365 exact at zero, the 2027 print +2.00 with 365/365 exact, and all 18,263 days of 2027-2076 score exactly +2, one step and no second. The seam is dated 2027-01-01, where 2026-12-31 prints 13:45/14:15 against 13:47/14:17. The archive lives at `$HOME/athan-gitree/census/o1f-london/` and STARTS AT 2027 with no 2026 row, which is why the break stayed unknown | Replace the single clause with two eras, cite the publisher's own statement, and record that the baked artifact holds both generations | O1m-35 lupt2027, O1m-43 lupt-years, A80-A82, D34 |
| France | "fajr and isha are SEASONAL SWEEPS (18 to 12 deg fajr, 16 to 11.5 isha) that NO frozen parameter set expresses" | NINETEEN of twenty surfaces carry a FROZEN pair (Toulouse 14.93 Jan / 14.90 Jun, Bordeaux 12.67/12.45, Lyon 14.42/14.45), median fajr MAE 0.67 min and median 311/366 within-1. Strasbourg is the one REAL sweep and it is the GMS's own: 18.00/16.00 exact 257/365, then a 108-day block from 28 April to 13 August opening and closing at N=9.56 h and sweeping to 11.3/10.4. The night-portion form is REFUTED BY SIGN (MAE 14-23 min, the French span runs 21-45 min the other way). Montpellier prints isha = maghrib + 80 on 366/366 | Strike the national sweep, carry the nineteen frozen pairs, the Strasbourg block and the interval class | O1m-21 france-sweeps, A3-A6, D15 |
| Ireland | the ?year parameter is discarded by a 301 | CONFIRMED in the December probe: `?year=2027` is sha-equal to 2026 | Keep the defect, add the December confirmation | O1m-R5 watches, A55 |
| Austria | fajr drift only, isha in sync | The workbook renders 366 rows, sha-identical to held; the 2029 correction stays declaration-only because a single 2026 sheet exists | Record the declaration-only limit | O1m-R5, A57 |
| Portugal | 8 cities, the Porto convention sheet flagged | Thirteen cities on one 18/12+3 recipe, dhuhr +6, maghrib +4, 96.6-99.95 pc within-1, including FARO, FUNCHAL and PONTA DELGADA (the last on Atlantic/Azores, the UTC-1 row the zone table lacked). One national generation, authority tier, A-eligible on its second cycle | Widen the surface count, add the Azores row, keep Porto's defect | O1m-15 europecities, C43 |
| Spain | A on three lines | Three lines confirmed (15/15, 18/17, 12/12); Malaga gained at 18.095/16.91; tawkit's 614 municipalities are a candidate; the Ceuta tenant sits 260 km away inside Murcia and reproduces its own point | Add the lines, the Ceuta trap and Las Palmas's 131 outlying cells | O1m-15, C45 |
| Czechia | A, capture-class | 13,896 month pages; 191 towns x 2019-2024 = 418,672 town-days plus Praha and Brno 2025-2030; 0 mismatches against every page's own header and row dates. Fit 12.11/11.95 Shafi, sunrise -3.38, dhuhr +4.45, maghrib +2.43, plus a smooth seasonal term of 2-4 min peak-to-peak with no drift across six years | Add the span and the seasonal term; record Revnice (latitude 449.92 and 00:00 on five columns for all 2,187 rows) and Kladno (computed at 51.50N for a 50.15N town) | O1m-R4 backward-europe, A26, A27, D31 |
| Cyprus (north) | the 2025 edition fails as-is and passes on one additive constant | TWO ENGINE GENERATIONS in an A-B-A-B pattern (A 2022-10-22 to 2022-12-31 and 2023-04-07 to 2025-12-31; B 2023-01-01 to 2023-04-06 and all 2026), B +2.4 min later on every column, 100 pc at a segment's own constants and 0 pc at the other's. The archive floor is 2022-10-22, not 2023 | Replace the single-constant clause with the four dated segments | O1m-R4, A25, D30 |
| Iceland | A on 14.2/14.0 over three years and 2,190 rows; "the December +90 display rule is DROPPED, fires on zero days" | Nine cities at 14.2/14.0 EXACT; Isafjordur and Selfoss refuse (400 on every route, 20 towns probed). The forward 2027 page and the association's written statement give isha = maghrib + 90 exactly, while the held 2026 file carries +122..+128 in January. The two years are NOT pooled | Add the nine-city surface and the isha conflict; grade held at A with the register's "provisional" quoted | O1m-8 arctic-nordic, O1m-R5, A64, A65 |
| Norway (Mawaqeet line) | 18/15, four cities x 365 archived, "recipe unfitted" | 89 place slugs enumerated, 88 PDFs captured, 32,120 rows and 83 places NEW (the record held 5). Fit fajr 18 / isha 15 at 20 sampled cities, 18 of 20 clean, Moss and Saffle point mismatches. KOPERVIK serves 2025, a genuine second year | Widen to 83 places, record the second year, grade provisional with span yes | O1m-R5, A61, C49 |
| Norway (Rabita line) | IRN 16/15 exact, a seasonal asr school switch | The asr switch is NORWEGIAN: both Norwegian tables move to Hanafi shadow-2 on 25 October and back to Shafi shadow-1 on 29 March (50 and 34 min jumps in asr minus dhuhr). The rule is fajr = min(P, sunrise - 60) inside a date gate, one line reproducing both tables at 138/138 and 131/131 rule days exact. Above about 67N the rule degenerates (Bodo 15 min early, Tromso 53) | Add the gate rule and the polar limit, retire the IRN attribution | O1m-R1r masjidi-highlat, A62, D1 |
| Sweden | the January fajr freeze | A continuous night portion, no plateau: fajr = sunrise - (0.2099*N - 0.85), isha = maghrib + (0.1849*N2 - 0.19) at Fagersta, 0.1983/0.1778 at Lidkoping, while islam.nu's 13 towns run a one-third split 0.300/0.283. A on islam.nu | Replace the freeze with the portion, add the 13-town A | O1m-8, O1m-R1r, A63, C50, D2, D4 |
| Belgium | a fixed standard clock with a client-side summer offset | Carried and mechanised: the same portion form at a larger share, 0.3039/0.279; Charleroi dhuhr 769 then 768 across 23-29 March | Add the share and the clock finding | O1m-R1r, A62, D3 |
| Romania | FALLBACK, no surface | Out of FALLBACK: 53 Diyanet-abroad localities (19,345 dated rows for 2026) plus four mawaqit tenants and a Turkish imsakiye for Constanta; the isha split inside one year is 16 degrees in nine states and 17 in seven | Replace the FALLBACK row with the dated layer | O1m-7r europe, A74, C36 |

### 4.2 Middle East and North Africa, 18 rows

| Row | v3 reading | Round measurement | Row action | Block |
|---|---|---|---|---|
| Iran | provisional on 30 days, "maghrib at a 4.47 DEGREE DEPRESSION", "THE TABLES PRINT NO ISHA ROW" | 44 cities, 880 server-rendered monthly pages, 26,884 rows across two Jalali years, ONE recipe: fajr 17.70, isha 14.00, maghrib at the 4.5-degree depression, zero margins, 100 pc within-1 at 29 of 38 cities. A fixed sunrise offset reproduces 64.3 pc of cells and the depression 100 pc, so the depression is load-bearing and not a margin. tawkit's Iran layer runs 17.45/18.00 and PRINTS an isha row the national print does not carry | Replace the provisional row with the measured row, keep the two conventions apart, add tawkit's line as a separate object | O1m-6r, A37, A38, C1, C2 |
| Syria | "18/17 + maghrib +2..3, triangulated on six days; 18-isha REFUTED at Damascus" | isha is maghrib + 90 min on ALL 4,380 rows of both editions; with the interval freed, 91.2-98.8 pc within-1 and per-city fajr 18.05-18.70. The ministry moved to `mow.gov.sy` (live, no prayer page on five probes, store-only app); tawkit is the only 2027 the region serves | Replace the pair with the interval, add the ministry finding | O1m-24, A1, A2, C3 |
| Tunisia | A on seven years 2020-2026, one frozen 18.1/18.1; a dated dip window from 2025-12-15 to 2026-01-15 | 2027 closed (`{"data":null}`), December 2026 serves, 1,102 rows over 36 dates banked. The Kairouan/Sidi Bouzid branch is NOT a dip window: 20 of 22 delegations moved from per-delegation 18.25-18.70 to EXACTLY 18.00/18.00 between 2025-12-16 and 2026-01-10 and held through December 2026 with the horizon columns untouched. Two delegations never changed; all 22 governorate capitals unchanged across three years | Replace the dip-window rule-form with the angle normalisation branch, keep the A | O1m-30 maghreb, A7, A8, C57, D7 |
| Morocco | A, "THREE years: 2026 (117 days) + pre-rebuild month tables from Wayback (150 days, 2024/2025, five cities incl. Laayoune)" | REFUTED: Wayback holds no 2024 or 2025 month and the old Hijri endpoint's 17 captures serve one static 2012 table. December 2026 is still 404 and no 2027 is served at six paths. The A is carried but its span evidence is 2026 alone | Strike the pre-rebuild leg, record the span as 2026, keep the A with the deficit stated | O1m-30, A9, C59 |
| Jordan | F structurally closed (the grid server-binds today+9; Wayback's 14 relevant 2026 snapshots carry zero rows); one national margin set | The platform layer IS the ministry's own grid: all ten live Awqaf days match tawkit's Amman page to the minute including margins, and Wayback gives 30 snapshots = 300 dated authority rows from 2021-01-08 to 2026-08-16 on one recipe (18.1/18.15, maghrib +7, sunrise -5), 97.6 pc across the October 2022 clock change with no parameter move. Two regional margin families (maghrib +6 or +7), never one national set | F to A, add the regional families, close the structural closure | O1m-24, A66, A67, C6, D29 |
| Qatar | F structurally closed, "portal serves one day per fetch with all date params ignored" | The date parameter is GENUINE: `islam.gov.qa` is an Angular build whose `appsettings.json` names its gateway, and `PrayerTimes?date=DD-MM-YYYY` answers per day. 2024, 2025, 2026 and 2027 walked in full, 1,461 rows, no gaps. One recipe across four years: fajr 18.42 floor+1, maghrib floor+2, isha exactly maghrib+90 on every row, within-1 100.0 pc, MAE 0.214, latitude recovered 25.24-25.26N against the MoI's own 25:15 | F to A, close the "structurally closed" verdict, record the exactness climb open | O1m-27, A45, A46, C11, D9, D39 |
| Bahrain | "effective isha 17.75-18.0 band"; fajr angle absent | The authority publishes its METHOD: `sunniwaqf.com` names the Al Zubarah almanac; a 2021-08-05 press conference records the post-1443 regime, and the council's own 1448 daily calendar (357 pages, one per day) plus a 1442 desk almanac give a dated span 1442-1448. Pinned at the council's own two coordinates (Dilmunia 26.27N 50.68E, Salman city 26.22N 50.44E), the stated recipe reproduces 2,130 cells at 100.0 pc within-1; the per-column longitude solve puts the morning pair 0.23 deg east exactly as stated, and a single site collapses exactness to 58.8 pc. The 74-minute floor is REFUTED AS A RULE: the printed minimum span is 75 minutes on 49 days, and inverting each printed isha minute gives a flat 17.81 deg (sd 0.062) with no bend at either equinox | Replace the band with the two-site rule and the almanac, retract the floor as a rule, choose one regime date (2021-08-05 or 2021-08-09) | O1m-27, O1m-41 bahrain, A47, A48, D10 |
| Kuwait | Al-Ajiri calendar, 18/17.5 library-exact, "the 77-minute interval refuted by its own 77-83 minute drift" | The ministry site has no prayer page (Arabic link graph enumerated in a browser); what it adopts is named on `awgatalsalat.com`, Dr Saleh Al-Ojeiri's calendar, whose 2026-11-11 row matches the held year in all six columns. NEW DEFECT: `alojeiri.com?date=` relabels and serves today's times, which is why the prior probe read it as year-locked. Second year not served | Add the adoption line and the relabel defect, close the governorate question as one row | O1m-27, A44, C10 |
| Iraq | provisional, Baghdad anchor, no city axis | CONFIRMED and sharpened: the Diwan endpoint is alive and axis-free, returning Baghdad and ignoring city, governorate, date and year; the platform layer is a second, 18/17 zero-margin line. Shrine sites are client-side; Najaf and Karbala are separate undated objects | Keep two objects apart, add the axis-free evidence | O1m-24, A68, C8, D37 |
| Palestine | candidate, T-665 feed-class, unfitted | 25 cities at 99.4-100 pc within-1 at 18/18 with maghrib +5..+7, corroborating the Awqaf offset rule on a second platform; Rafah 63.6 and Tulkarm 82.0 carried as publisher deviations | candidate to provisional | O1m-6r, A69, C9, D38 |
| Lebanon | candidate, Dar al-Fatwa unfitted, clock fixed UTC+2 year-round | Dated at last: al-Manar monthly city PDFs, seven cities, 147 PDFs, 3,662 rows parsed and 1,381 past the solar-noon gate, two years on one recipe (fajr 15.90-16.05, isha 14.90-15.50, maghrib at the 4.5-degree depression, imsak nine minutes before fajr). The platform's 16 district tables stay undated: table 2's file from 2026-04-07 and the live file of 2026-11-11 parse to the identical 366 rows | candidate to provisional, add the 4.5-degree second user, keep the district object undated | O1m-24, A70, C7, D9 |
| Libya | provisional | No year-2: `muazzin.com` is a creative agency (trap), the awqaf widget 403, and masjidi's regional JSONs carry no date or year field | Keep provisional, record the trap | O1m-30, A71 |
| Yemen | provisional | 216 Livewire captures = 2,190 rows, 365 days x six ministry governorate feeds at 100 pc within-1; per-governorate pairs spread 15.40-17.95; the selector carries Aden, Lahj, Mukalla, Seiyun, Marib and Mahra only, with Sanaa, Taiz, Hodeidah, Ibb and Dhamar absent from the authority surface | Add the six-feed span and the five absent governorates | O1m-6r, A72 |
| Saudi Arabia | A, 43 governorate points, 30,487 city-days | 116 new points across the five thin regions at 1449 and 1450 (82,128 city-days, 492,768 cells, zero harvest failures). The grid stands at 225 points and 159,300 city-days, recipe unmoved (within-1 99.7-100.0, exact 81.7-88.2), Ramadan still exactly 90/120 with zero violations in 232 point-years. The 194 cells missing by more than 1 min all sit in the two northernmost regions (192 at exactly -2 min on 15 of 708 dates), a publisher edge and not a drift | Widen the grid, record the northern edge | O1m-27, A78, A79, C4 |
| Oman | A, 18/18 CEIL, +5 margins, eight years; the ridge closed as degenerate | The rule-versus-point question CLOSED AS POINT: at a point solved from each area's own 2026 table, ONE national recipe reproduces all 86 areas at 100.0 pc within-1 over 188,340 cells, worst cell 1 minute, and six years 2026-2031 hold the same way over 1,130,040 cells. RECIPE fajr 18.0, isha 18.0, Shafi asr, +5 on dhuhr/asr/maghrib, nearest minute, Asia/Muscat. The defect that hid it: the page prints its 86 rows in Arabic alphabetical order with Muscat forced first, which o1m-27 read as CityID order, so CityIDs 36-82 were one place out; correct keying lifts within-1 from 53.2 to 87.1 pc at the same recipe. The ministry's own gazetteer serves 18,191 coordinate rows across all 63 wilayats | Add the point layer and the recipe, record the ordering defect and the five publisher defects (page 3 printing nine wrong names in ten, 29 February missing from every leap year) | O1m-40 oman, O1m-27, A35, A36, C5 |
| Turkey | A, rows key by ILCE CODE, not coordinates | CARRIED with no new measurement: the 144 district tables remain a coordinate refinement, difference-space residual 0.264 min median, 141 of 144 under 0.5, deviation against the province table 1.76 min median, correlating 0.984 with longitude | No text change | O1m-26 consensus carrying o1l A63, A49 |
| Egypt | A on 2026 plus 48 spot days 2022-2026 | 563 of 578 posters harvested (2024 108/109, 2025 312/326, 2026 143/143), the fifteen refusals dated by class. The imsakiya adds three Hijri years, 245 city-months, 58,080 cells. The span is 17 cities and 149,022 cells, 83.33 pc exact and 100 pc within-1 in 2024, 2025, 2026 and 2027, dhuhr exactly +1 every day of every year. 2022-2023 closed by three independent probes. The Ramadan split is settled AGAINST the poster's own Hijri column: the imsakiya prints the astronomical month and was a day out in both years in opposite directions | Widen the span to four years, add the imsakiya surface and the announcing-body settlement | O1m-R3r egypt-kazakhstan, O1m-14, A28-A32, C13 |
| Algeria | candidate, ministry feed UNREACHABLE, no series, no fit | 1447 complete for Alger, Adrar and Djelfa (884 days) plus a 1448 holdout found through Wayback (16 pages, image-only, eight months transcribed, 219 verified days). ONE recipe: fajr 17.80 +0 floor, sunrise/dhuhr/asr +1, maghrib +4, isha 17.00 +0 ceil, 219/219 within-1 on all six columns. The isha 17.00/0 ceil re-parameterisation is confirmed on a second Hijri year at 194/219 exact against the frozen 16.10/+5 at 102/219 | Replace the candidate row with the fitted multi-year row, write the object from the fit | O1m-30, A50, A51, C58, D8 |

### 4.3 Africa, 2 rows

| Row | v3 reading | Round measurement | Row action | Block |
|---|---|---|---|---|
| Nigeria | the Egyptian 19.5/17.5 line is masjidway's platform default | CONFIRMED at national scale: tawkit's Nigeria layer carries fajr 19.39 / isha 17.62 across 202 cities (73,730 rows), 77.8 pc exact and 96.1 pc of cells within-1, a platform parameter again | NO TEXT CHANGE to the reversal; add the national-scale confirmation and the platform line | O1m-3 platforms, A10, C60 |
| DR Congo | Goma two mawaqit tables, Kinshasa has no platform page | The first fit pinned ONE zone across both Congolese zones; the two-zone refit corrected it to 57 of 65 at 364/365 or better. tawkit splits its isha convention by city inside the country | Add the two zones and the by-city convention split | O1m-4r, A77, D21 |

**Two African rows the register's table C leaves unclassed but the blocks measure.** Tanzania (Dar es
Salaam two independent witnesses on one recipe, 17.90/17.10, 2,136 and 2,109 of 2,190) and Uganda
(Kampala 17.90/17.35 against Entebbe's 15/15, the country's two lines) sit at candidate under D3. The
o1l round wrote A-eligible for Tanzania. Section 5.2 prices both readings.

### 4.4 Asia, Russia and the Caucasus, 12 rows

| Row | v3 reading | Round measurement | Row action | Block |
|---|---|---|---|---|
| China | FALLBACK, norislam computes a national table for 2,460 county points, "a calculator, not a publisher" | 222 Diyanet cities at exactly 18.00/16.00 with 121 of 222 at 100 pc all-six, the norislam county layer at 15/15 Hanafi over 10 points from 24.9N to 53.5N (MAE 0.25-1.09), and islamichina's 18/17 as a third platform surface. The gazetteer is 2,265 points, not 2,460 (195 high). Clock defects re-verified: Urumqi, Turpan, Dunhuang and Lhasa print 118.8-120.1 min early and -120 brings them to 0.15-1.41 | Replace the FALLBACK row with two Chinese lines plus the platform third, correct the gazetteer count | O1m-11 eastasia, O1m-R7r, A39-A41, C23, D19 |
| Hong Kong | one surface, Kowloon | Five years 2024-2028 on one recipe, with 2024 a SEPARATE generation at 69.1 pc while 2025-2028 carry one at 100 pc all-six; Masjidal serves 2028 | Add the five-year block and the 2024 generation split | O1m-11, A42, C24 |
| India | FALLBACK (community de facto: the Karachi method) | A 70-city publisher layer on ONE recipe (fajr 18.0, isha 18.15, Hanafi, dhuhr +1, asr +1, maghrib +4) at 24,768 of 25,200 cells within-1, 33 tables perfect, covering Lucknow, Kanpur, Nagpur, Patna, Bhopal, Indore, Surat, Vadodara, Vijayawada and Delhi, every one a standing negative. 23 mosque-tier cities at A on two dated years, 99 pc+ of all six columns in 2025 AND 2026, the two years genuinely recomputed (median tenant moves 41.4 pc of printed rows). The Excel layer adds 42 cities beyond the PDF layer, 95 workbooks fitted, and is the PDF's own generation reprinted (52 of 54 paired cities agree every cell within 1). 2027 is a genuine third recomputation: 34 tenant-years, 11,998 rows, 26 tenants on three recomputed years. The isha-17 line is a TIER line: 0 of 165 publisher tables at 17 degrees, 43 mosque tables at 2026 and 25 of 34 at 2027 | Replace the FALLBACK row with the three-layer mosaic; class UNNAMED pending the close's naming | O1m-17 india, O1m-23 india-complete, O1m-5, A? C14-C16 |
| Pakistan | one chart, one recipe, dhuhr a two-phase 13:00/13:15 clock, isha a 15-minute ladder | The 14-px limit was a READER limit, not a capture limit: grid derivation plus cluster labelling from the chart's own day column decoded 25 cities, 9,120 chart-days, 63,227 cells, 0.96 pc named gaps, and o1l-12's hand-read Rawalpindi January matches 217/217 cells. One angle pair 18.0/18.0 Hanafi, one margin template (fajr -0.5, sunrise -0.5, zuhr +0.5, asr +0.5, maghrib sunset +3.5, isha +0.5), three variants; the federal dhuhr clock matches 0 of 365 days in every chart. The four "absent" cities exist on `invent.ilmkidunya.com/images/Section/`. The remainder wave takes the family to 29 cities and finds FOUR genuinely different tables (main 26 cities, Quetta's +4 block, Sialkot's hand table, Hyderabad's meridian offset) and a second scan of twelve charts identical over 29,242 cells. QUETTA WAS NEVER A COLUMN PROBLEM: a 12-hour zuhr dial (210 cells) plus a +60-minute clock block from 3 April to 29 October | Replace the chart reading with the decoded family, strike the Quetta column diagnosis | O1m-28 pakistan-charts, O1m-39 pak-remainder, A12-A14, C17, D13 |
| Malaysia | the 2027 subuh move is a +0.24-deg peninsula reference move at the zohor point, "not a margin" | Measured as a PUBLISHER SPLIT: 56 comparable JAKIM zones show a column mean within 0.05 min; the -1.3 min belongs to Jawi and Selangor only, whose point moved about 0.3 deg south with the pair frozen (3.4681/101.3696 to 3.1786/101.4234). The 2027 federation was captured whole (59 zones, 21,535 dated rows, no gaps) and gated, not trusted: Kuala Lumpur reproduces the Jawi/Putrajaya authority PDF 365/365 on all seven columns. Kelantan isha 17 confirmed (0/365 at 18, 320/365 at 17); Pahang PHG05/06 carry a horizon term on the two solar columns only, SBH06 the largest at 8-9 min; KDH07 reproduces on no angle pair | Replace the national-move clause with the two-publisher split, add the per-zone findings | O1m-16 seasia, A11, C20, D12, D14 |
| Sri Lanka | "ONE fixed annual artifact re-uploaded year after year ... ONE GENERATION" | CONFIRMED at zone depth: 13 zones, 12 monthly PDFs each, 12 of 13 reproducing all six columns within 1; 2025's 62 overlapping days identical to 2026; Mannar solves offshore (flagged); phantom 29 February recorded | Add the zone depth and the two defects | O1m-5, A43, C18 |
| Nepal | FALLBACK, "confirmed nothing" | Darul Ifta twelve-month Kathmandu cycle, 366 rows transcribed from an image at 7x zoom after a first pass proved wrong in five months; 19.10/18.31 recovered as MWL 18/17 plus a 1.1-deg horizon dip at 1,400 m, Hanafi asr; the Ramadan 1446 sheet corroborates 30/30 | Replace the FALLBACK row with the authority cycle | O1m-1, A52, C67 |
| Vietnam, Cambodia, Laos | candidate each on a single mawaqit capture | First DATED mosque tables: Hanoi Al-Noor, Phnom Penh Alserkal, Vientiane Jamia | Add the three dated rows | O1m-5, A73, C26 |
| Russia (CDUM) | 20 cities, one year, provisional, 18/17 HANAFI floor, "Salekhard mislabeled" | 757 snapshots inventoried and 177 captured = 171 CITY-YEARS, 60,060 dated rows, 21 cities, 2015-2026, 2018 absent at every URL. FOUR DATED RULE FORMS: 2016-2017 prints BOTH asr schools and no isha under the Maghrib/Isha labels; 2020 is a Shafi-asr edition (18 of 19 city-years solve Shafi, Hanafi 3-6 pc); 2021 is a fixed-interval edition (fajr sunrise-120, isha maghrib+90, dhuhr fixed per city); 2022-2026 back to 18/17 Hanafi at 83-87 pc fajr and 94 pc isha within-1. The -68 min sunrise defect is the SURGUT page carrying Salekhard's times, dated to the 2023 edition | provisional to A, add the four forms and the dated defect | O1m-R8 russia-backward, A18-A20, C41, D28 |
| Russia (Bashkortostan) | 63 cities, one year with a different-recipe prior year; Ufa's asr shifts ten days | 2025 and 2026 only at three doors (a generator declaring 2024-2100 answers 404); 16/15 holds 2026 (fajr median 16.05, within-1 98.9 pc) and 2025's fajr fits no single angle (18.6 pc). Ufa: six editions, fajr = sunrise-100 and isha = maghrib+90 exact in every one, maghrib margins +1/+2/+4/+3/+3/+4, and the ten-day asr shift is 1448 ONLY | provisional to A on the Ufa almanac, date the regime split | O1m-R8, A21, A22, C42, D12 |
| Russia (Tatarstan) | 44 cities x two years, grade A; "2026 rounding fajr-floor / rest-ceil; 2025 all-floor-but-maghrib" | Before 2025 the directional pass is ABSENT: Kazan's 2020-2022 editions carry the recipe frozen at a uniform -1.0 min on every column. 2020-2024 is structurally not served; Wayback 2017 gives 23 of 44 settlements, 8,395 rows at 18/15 Hanafi 99.6-100 pc; 2023 and 2024 requests return the 2022 capture byte-identically, so nothing was banked | A held, add the archive leg and the pre-2025 finding | O1m-R4, A23, A24, C40, D29 |
| Indonesia | candidate, partial published parameters, SIHAT owner-gated, ceiling 2029 | Both publishers closed: SIHAT 209 units for 2026 (76,285 rows, zero missing days, four columns 100 pc within-1, Mataram and Kupang rendered on WIB all year), KHGT all 516 second-level units for 2026 AND 2027 (376,680 rows, one recipe at every unit, fajr/dhuhr/asr/isha medians exactly two minutes in every histogram, maghrib pad climbing 2-8 with elevation at r=0.959). KHGT subuh median 8 min earlier than SIHAT across all 209 common units. Both apply a 1.76 x sqrt(h) arcmin dip from DIFFERENT elevation fields | candidate to provisional on SIHAT, A on KHGT, add the dip and the WIB defect | O1m-5, O1m-3, C19, D32, D33 |

### 4.5 Americas, 3 rows

| Row | v3 reading | Round measurement | Row action | Block |
|---|---|---|---|---|
| United States | candidate, community tier, 16 mosques | 33 of 64 metros carry a dated surface, 33,513 rows across 41 surfaces; the 15/15 verdict runs 26 of 37 plain ISNA and 31 in the 15-family; three-year angle movement within 0.10 deg on 24 clean surfaces. The last four metros closed 3 of 4: Salt Lake City (2,197 rows, 14.9/14.9, 100 pc all six), Oklahoma City (2,197 rows, 17.9/16.9, 100 pc), Norfolk (2,191 rows over six years, 15/15, 100 pc, worst 2); Tallahassee a negative with every route documented. The fitter bug cleared by re-run, Newark re-banked from 26.657 rms to 0.849. Defects: Omaha a dated 2026 regime change, Mobile computing Houston coordinates, two dpt installs with zeroed years, Little Rock serving 2023, Anchorage computing Makkah client-side, Masjid Ash-Shura serving five columns frozen six years while sunrise moves. The 18/16 reading is Diyanet's alone | candidate to A on the certified metros, add the defects and the 18/16 flag | O1m-R6 americas, O1m-R2 fitter, O1m-37, A39, C27, D19 |
| Bolivia | not in v3 at all; o1l's proposed row carried "the sun columns unreproducible at any South America coordinate" | A PARSER COLUMN OFFSET, not the publisher: a seven-value mawaqit calendar read as six. Re-parsed, 365 rows at 18.0/15.9 Shafi, within-1 92.3-95.9 pc, worst 6. Separately La Paz is RECLASSIFIED, not repaired: its install serves Santa Cruz's table (365 days byte-identical, 15 deg of longitude apart), and La Paz's own dated layer is the platform pass at 100 pc | Add Bolivia as a row, strike the unreproducible clause, record the cloned tenant | O1m-22 southamerica, A15, A16, C31 |
| Venezuela | candidate, "the ten-city ladder is the PDF's (Maracaibo +19, Bolivar -12); the PDF governs" | CONFIRMED on the sky: the page ladder is +09 against the sheet footer +19, and the Caracas to Maracaibo delta measures 18.7-19.0 min constant over the month on all six columns. The page is defective at one city of ten. CCIAR's PDF is still the 2021 sheet; the publisher's real channel is a monthly WordPress image series (398 media items), and the September-October 2026 sheet transcribed (30 rows) fits MWL 18/17 at 100/93.3/100/100/100/100, matching the held Al Ahmad table within 3 min on every column | Keep the sheet as governing, record the page defect and the second publisher | O1m-22, A17, C32 |

### 4.6 Oceania, 3 rows

| Row | v3 reading | Round measurement | Row action | Block |
|---|---|---|---|---|
| Fiji | "the November 2026 Facebook sheet is identical to November 2024" | CONFIRMED on the live route: the 2026 year captured whole from the league's widget, 365 rows at 18/17 and 365/365, with 1,456 of 1,460 cells identical to the held edition. One generation, so no lift | Keep provisional, record the live-route proof | O1m-9 oceania, A56, C35 |
| Samoa | FALLBACK honest negative, the gazetteer hole standing with a verified cause | The empty gazetteer is turktakvim's alone: Diyanet serves Apia a 365-row yearly table at 18/17 with zero twilight margins and publisher solar margins (sunrise +7, dhuhr -5, asr -4, maghrib -7), 365/365 within-1 | Replace the FALLBACK row with the dated authority layer | O1m-1, O1m-9, A53, C69 |
| Kiribati | FALLBACK honest negative, searched in five languages | An Ahmadiyya Ramadan 2026 sheet, 30 rows, maghrib 30/30 exact and FIVE of six columns fixed clocks | candidate with the defect recorded | O1m-1, A54, C68 |

**Two Oceania items outside the A table.** The Pacific authority layer is 20 cities in nine countries
from one Diyanet request each, 18 of 20 fitting ONE recipe (fajr 18 / isha 17, zero twilight margins,
publisher solar margins), 365/365 within-1. Australia's mosque layer is 55 surfaces beside the 218
grid points, and it is thinner than its row count: 30 of 43 masjidbox and 5 of 25 mawaqit surfaces
publish jama'ah boards rather than athan tables. New Zealand's year-round buy is met with 16 dated
year surfaces where only Ramadan sheets existed. `o1m-9`.

### 4.7 The six non-row items

| Item | Round measurement | Where it lands | Block |
|---|---|---|---|
| The `.pdf` captures that are error pages | 68 error-body captures across 12 workspaces, not 30. Most are deliberate negatives where the 404 is the finding. FOUR verdicts reopen: Jyvaskyla (353 dated rows with no surviving artifact), Seychelles (a 403 body behind a 29-row bank), the Islamic Academy "series stop", and the Wrexham/Dundee month failures | Integrity note; the four reopens are named in section 8 | O1m-37 D7, O1m-20, O1m-44 |
| The mawaqit `?year` relabel | 25 of 25 surfaces relabel with zero exceptions, and the trap SHARPENED: `?year=2027` now rewrites the date column while all 365 rows stay identical, so a payload-date check passes and only a value diff gates it | A named platform defect class, not prose | O1m-R5, O1m-18, A58, F7 |
| The Diyanet city postback | The old host returns ONE shared 150-row table carrying no location (Colorado and Hawaii agree to the second), so the row count is the detection test; on the current host the selects fill client-side from `GetRegList` (207 entries, 363 provinces, 18,582 cities) and 8,539 of 8,539 non-grid cities banked with 12,081 distinct digests | A named platform defect class with its test | O1m-R7r, O1m-13, A59, F8 |
| The tawkit engine | `wtimes` loads `./PrayTimes.js` ver 2.3, 16,064 bytes, captured; 3.18M rows are one engine at GeoNames points, regenerable, and stay ARCHIVE-ONLY. The citable layer is fits, the per-country parameter table, the settlement list and a validated sample | The round's count rule: regenerable bulk never enters the record | O1m-3 addendum and decision, A60 |
| The masjidi.app engine mismatch | The mismatch is a NAMED third engine: the sun evaluated once per day at 0h UT, a per-region rise-set margin 0.1-3.6 min, integer output, no DST steps; 167 of 167 tables fit at median 0.54 min RMS and median 93 pc within-1. The o1l "6.2-8.1 min RMS" was the wrong engine | Close the o1l lead, pool enumerated and fitted as a class | O1m-R1r, A75, F13 |
| tawkit's two isha conventions | fixed maghrib+90 at 292 of 571 African cities and an angle of 16.85-17.25 elsewhere; by country, and inside DR Congo by city. The 22-degree clamp an earlier fit reported is a fitter bound, never a publisher value | A rule-form and a flag, both carried | O1m-4r, A76, D21 |

---

## 5. GRADE MOVEMENTS

75 items from register table C. The movement column quotes the register's own wording. Where the
wording sits outside the six v3 classes it is carried as written and counted as UNNAMED in 5.2.

### 5.1 The 53 class-changing movers, each counted once

| Mover | From (v3) | To | Source |
|---|---|---|---|
| Iran | provisional | A | C1 |
| Jordan | F | A | C6 |
| Qatar | F | A | C11 |
| United States | candidate | A | C27 |
| Canada | candidate | A | C28 |
| Chile | provisional | A | C33 |
| Russia (CDUM) | provisional | A | C41 |
| Russia (Bashkortostan) | provisional | A | C42 |
| Sweden | candidate | A | C50 |
| Tajikistan | candidate | A | C54 |
| Algeria | candidate | A | C58 |
| Syria | candidate | provisional | C3 |
| Lebanon | candidate | provisional | C7 |
| Palestine | candidate | provisional | C9 |
| Indonesia | candidate | provisional | C19 |
| Norway (Mawaqeet line) | candidate | provisional | C49 |
| Georgia | candidate | provisional | C56 |
| Afghanistan | candidate | provisional | C56 |
| China | FALLBACK | provisional | C23 |
| Tonga | candidate | provisional | C35 |
| Mongolia | candidate | provisional | B8 |
| Thailand | provisional | A-CANDIDATE (UNNAMED) | C22, C74 |
| India | FALLBACK | measured set (UNNAMED) | C14 |
| Romania | FALLBACK | provisional | C36, A74 |
| Turkmenistan | FALLBACK | provisional | C55, B7 |
| Nepal | FALLBACK | provisional | C67, B12 |
| Taiwan | FALLBACK | provisional | B9 |
| Azerbaijan | FALLBACK | provisional | C56, B30 |
| Suriname | FALLBACK | provisional | B2 |
| Samoa | FALLBACK | provisional | C69, B13 |
| Kiribati | FALLBACK | candidate | C68, B14 |
| 23 FALLBACK rows at candidate | FALLBACK | candidate | D3 (section 3.2, L10-L31) |

The 23 candidate lifts are Chad, Guinea-Bissau, Benin, Central African Republic, Ethiopia, Eritrea,
Tanzania, Uganda, Rwanda, Burundi, South Sudan, Namibia, Angola, Madagascar, Comoros, Myanmar, Armenia,
Mexico, Guyana, Papua New Guinea, Solomon Islands, Vanuatu and Kiribati. Kiribati is named twice in the
register (C68 and D3) and counted once.

**Twelve further C items that move a span, an object or a provenance line and no class:** C2 (Iran's
platform line, a new object), C4 (Saudi grid), C5 (Oman), C8 (Iraq's two objects), C10 (Kuwait),
C12 (Bahrain), C13 (Egypt), C15 and C16 (India's 2027 and isha tier lines), C17 (Pakistan), C18 (Sri
Lanka), C20 (Malaysia), C21 (Singapore), C24 (Japan, Korea, Macau, Hong Kong, Mongolia), C25 (North
Korea), C26 (Vietnam, Cambodia, Laos), C29-C34 (the platform layers, the Caribbean year-2 doors, the
Pacific), C37-C48 (Europe), C60-C75 (the confirmations). Each is in section 4.

### 5.2 What the count shift is, and the arithmetic that proves it

v3 classes (174 rows): A 17, provisional 40, candidate 65, community 15, F 2, FALLBACK 35.

| Class | v3 | moves in | moves out | After |
|---|---|---|---|---|
| A | 17 | +11 (4 from provisional, 5 from candidate, 2 from F) | 0 | **28** |
| provisional | 40 | +18 (9 from candidate, 8 from FALLBACK, 1 new row) | -5 (4 to A, 1 to UNNAMED) | **53** |
| candidate | 65 | +26 (23 FALLBACK lifts, 3 new rows) | -14 (9 to provisional, 5 to A) | **77** |
| community | 15 | +1 (Aruba) | 0 | **16** |
| F | 2 | 0 | -2 (Jordan, Qatar) | **0** |
| FALLBACK | 35 | 0 | -32 (section 3.2) | **3** |
| UNNAMED (moved out of a class, no class named) | 0 | +2 (Thailand, India) | 0 | **2** |

Identity check: 28 + 53 + 77 + 16 + 0 + 3 + 2 = 179, and 174 v3 rows + 5 new country rows = 179.
The arithmetic closes with no row unaccounted for. Both figures come from
`data/class-arithmetic.py`, which fails loudly if a movement names a row the record does not hold.

**The most consequential fact is the shape of the movement.** FALLBACK falls 35 to 3 and F falls 2 to
0, while A rises 17 to 28. Twenty-six of the 32 FALLBACK lifts land at candidate, because a dated table
at platform tier is a presence test, not a grade: D3's own cost line says so. The round's grade work is
concentrated in nine rows (the five candidate-to-A lifts, the two F-to-A lifts, and two
provisional-to-A lifts), and its discovery work is spread across 32 countries.

**Six readings the close must rule, not the diff. Each changes a number and none changes the identity:**

| Reading | Consequence |
|---|---|
| French Polynesia lifts under the o1l O2 masjidway month | FALLBACK 3 to 2, candidate 77 to 78 |
| India adopted at community (the o1l proposal, and v3's own "community de facto" parenthetical) | community 16 to 17, UNNAMED 2 to 1 |
| Thailand held at provisional, refusing a seventh class (D16's ruling) | provisional 53 to 54, UNNAMED 2 to 1 |
| Iceland read at the register's "provisional" rather than the record's A | A 28 to 27, provisional 53 to 54 |
| Macau and North Korea added as rows (both absent from v3) | rows 179 to 181, provisional 53 to 55 |
| Tanzania read at o1l's A-eligible rather than D3's candidate | candidate 77 to 76, A 28 to 29 (or UNNAMED 2 to 3 if the phrase is refused) |

**One post-register movement, named and not counted.** `o1m-44` returned after the register with
Jyvaskyla at three recomputed years (2024 202/202, 2025 203/203, 2026 201/202 at 18/17 zero margin),
"GRADE PROVISIONAL to A". That is a fit-index entry movement. If the close reads it as the Finland
row's evidence, Finland moves candidate to A and the arithmetic becomes A 29, candidate 76. The diff
carries it as an entry and not a row, because a city surface has never before lifted a country row on
its own in this record.

### 5.3 How this stacks on round two, and the two-row alternative

The o1l diff's 18 new country rows and its class movements were never applied to the record. The two
rounds compose without collision, since no country appears twice across the two new-row sets:

| Basis | Rows | Reading |
|---|---|---|
| v3 at this build | 174 | the baseline both rounds start from |
| o1l diff adopted alone | 192 | 174 + 18 |
| o1m diff adopted alone (this document) | 179 | 174 + 5 |
| Both diffs adopted | 197 | 174 + 18 + 5, and o1l's movements must be re-based first, since this diff's "from" column is v3's |

The close should say which basis it adopts in one line. A close that adopts this diff and not o1l's
ships 179 rows with Malta, Cuba, Ecuador and fifteen other countries still absent, which reads as a
regression to anyone who read the o1l document.

### 5.4 The fit index, which is a different denominator

The index is not the world table and its counts must never be added to the row counts. At the 3B cut:
162 entries, 89 countries and territories, 16 multi-country families, grades A 33 / provisional 90 /
candidate 25 / community 11 / measured 3, span verdicts yes 33 / no 9 / frozen-recomputed 2 /
frozen-reprint 6 / untestable 112, 90 entries carrying a conflict note, 14 carrying a flag, 49
conflicts, 23 flags.

Two arithmetic notes. The five classes sum to 162, so the header closes. `measured` is the seventh class
D16 refused; mapping `CN-NORISLAM-10` to community and dropping `ENGINE-CONSENSUS-184` as an analytical
artifact gives 161 entries at community 12, which is the shape the close should assert.

---

## 6. RULE-FORMS

39 forms from register table D. The twelve the round's own reports lead with are given in full first.

### 6.1 The twelve named forms, in full

**D34, LUPT-ASR-2027.** asr margin +0 through 2026-12-31 and +2 from 2027-01-01 through 2076-12-31 on
BOTH mithl columns. 18,263 days score exactly +2 with zero deviations, one step and no second; the 2026
side is +0.44 mean with 195/365 exact at zero. The publisher states "Asr: 2 minutes later" on its live
technical page. Blocks: O1m-35 lupt2027, O1m-43 lupt-years.

**D18, DIYANET-TEMKIN-207.** imsak 0 / sunrise -7 / dhuhr +5 / asr +4 / maghrib +7 / isha 0. 105
countries EXACT, 61 within-1, 41 departing as a latitude ladder whose imsak amplitude reaches 130 min
above 44N, a summer substitution and not a country margin. Blocks: O1m-R7r, O1m-26.

**D5, POLAR-5.** Five publisher behaviours, each with trigger days: half-night plateau 0.498-0.500
(tawkit RU/NO/SE), one-third split 0.300/0.283 (islam.nu), silent omission (tawkit Norway drops 118
days at Tromso), synthetic solar row (Diyanet Svalbard), quarter-night about 0.236 (Reykjavik mosque).
A fit pooling these across a summer window cannot succeed. Block: O1m-8.

**D1, NO-GATE-60 (Norway).** fajr = min(P, sunrise - 60) inside a date gate, where P is the published
twilight time at the gate edge; one line reproduces both Norwegian tables at 138/138 and 131/131 rule
days exact. The holds (02:38 then 02:19 Asker, 02:25 then 02:12 Fredrikstad) are the twilight value at
each gate edge. Block: O1m-R1r.

**D7, TN-NORM2026.** 20 of 22 delegations moved from per-delegation 18.25-18.70 deg to EXACTLY
18.00/18.00 between 2025-12-16 and 2026-01-10 and held through December 2026, horizon columns
untouched; two delegations never changed. Block: O1m-30.

**D8, DZ-ISHA17-CEIL.** fajr 17.80 +0 floor, sunrise/dhuhr/asr +1, maghrib +4, isha 17.00 +0 ceil;
219/219 within-1 on the 1448 book against 102/219 for the frozen 16.10/+5. Block: O1m-30.

**D9, QA-90-EXACT.** fajr 18.42 at floor(raw)+1, maghrib floor(raw)+2, isha exactly maghrib+90 on all
1,095 rows, one recipe across 2024-2027, zero violations. Block: O1m-27.

**D10, BH-FLOOR74, refuted as a floor and kept as a regime statement.** The press report's 74 minutes
describes the equinox trough of the 18-degree curve, not a clamp: the printed minimum span is 75
minutes on 49 days and inverting each printed isha minute gives a flat 17.81 deg (sd 0.062) with no
bend at either equinox. What survives is the two-site rule: fajr 18.00 and sunrise computed at the
Dilmunia east tip (50.675, 50.665), the rest at Salman city (50.175-50.465), 2,130 cells at 100.0 pc
within-1, and a single site collapsing exactness to 58.8 pc. Blocks: O1m-27, O1m-41.

**D17, IR-DEPRESSION-4.5.** maghrib at the sun's 4.5-degree depression; a fixed sunrise offset
reproduces 64.3 pc of cells and the depression 100 pc at 29 of 38 cities; fajr 17.70 / isha 14.00 at
zero margins, and the national print carries NO isha row. A second user is now on the record: the
Lebanese al-Manar print sits on the same depression across seven cities and 1,381 gated rows. Block:
O1m-6r, O1m-24.

**D16, INTERVAL-CLASS.** The round's interval census, all fixed minutes rather than angles: Syria
maghrib+90, Yemen maghrib+90 (tawkit), Saudi +90 with +120 on every Ramadan day, Tanzania maghrib+90,
Qatar maghrib+90 exact, Fiji maghrib+75, Montpellier +80, New Caledonia sunset+85 behind a 19:45
floor, CERFI fajr sunrise-60 and isha maghrib+60, Ufa fajr sunrise-100 and isha maghrib+90, CDUM 2021
sunrise-120 and maghrib+90, tawkit's 292 of 571 African cities at +90, Iceland's forward year +90.
Blocks: O1m-24, O1m-27, O1m-22, O1m-16, O1m-21, O1m-18, O1m-R8, O1m-4r, O1m-8.

**D27, KZ-48-EXACT.** The switch is LATITUDE-ONLY at exactly 48.000000: one part in a million flips
sunrise, dhuhr, asr and maghrib by exactly 2 min while fajr and isha stay identical; 0 of 9,861 line
settlement-days across 2025-2028 and 2045 picks the other set, and the engine's own test carries no date
term. Block: O1m-25.

**D13, PK-18-18-TEMPLATE.** One angle pair 18.0/18.0 Hanafi with one margin template (fajr -0.5,
sunrise -0.5, zuhr +0.5, asr +0.5, maghrib sunset +3.5, isha +0.5), three variants, across 25 cities and
63,227 cells, extended by the remainder wave to 29 cities and four genuinely different tables. The
federal dhuhr convention matches 0 of 365 days in every chart. Blocks: O1m-28, O1m-39.

### 6.2 The remaining 27

| # | Rule form | Statement as measured | Block |
|---|---|---|---|
| D2 | SE-PORTION | a continuous night portion, no plateau: fajr = sunrise - (0.2099*N - 0.85), isha = maghrib + (0.1849*N2 - 0.19) at Fagersta; 0.1983/0.1778 at Lidkoping | O1m-R1r |
| D3 | BE-PORTION | the same form with a larger share, 0.3039/0.279; the table clock is fixed standard time (Charleroi dhuhr 769 then 768 across 23-29 March) and the summer offset is the client's job | O1m-R1r |
| D4 | SE-ISLAMNU-13 | a one-third-of-the-night split inside a trigger window: 0.300 fajr and 0.283 isha, a second Swedish rule | O1m-8 |
| D6 | NORWEGIAN-ASR-SWITCH | both Norwegian tables move to Hanafi shadow-2 on 25 October and back to Shafi shadow-1 on 29 March (asr minus dhuhr jumps 50 and 34 min); Sweden and Belgium hold shadow-1 all year | O1m-R1r |
| D11 | PL-18.16 | the Mufti's sixteen Ramadan PDFs measure 18.16/17.15 in every city at 100 pc within-1 pinned; only 11 of 30 days survive the solar gate, so the March block is quarantined in all sixteen | O1m-15 |
| D12 | MY-PERAK-ARC | Perak zon7 widens the diurnal arc with no seasonal term (matahari -5, maghrib +6, month-invariant, the Bukit Larut horizon term); Pahang PHG05/06 and SBH06 carry the same class on the two solar columns only | O1m-20, O1m-16 |
| D14 | MY-JAKIM-B | fajr 18 and isha 18 with zohor +1.5 round only, maghrib 0 ceil, isha 0 ceil, syuruk floor; the census +2 ihtiyati refuted a fourth time; imsak = fajr - 10 except PLS01 (= fajr, 365/365) | O1m-16, o1l-1 |
| D15 | FR-MONTPELLIER-80 | isha = maghrib + 80 min on 366 of 366 rows, one distinct value: a fixed interval, not an angle | O1m-21 |
| D19 | US-CN-18-16 | China exactly 18.00/16.00; the US latitude slope of the residual vanishes at 16.0; Diyanet alone carries it, athanpro reads 18.00/17.05 on China and tawkit an interval there | O1m-R7r, O1m-26 |
| D20 | TT-CHAGUANAS-ONE-LINE | the settings blob reads country TT and timezone America/New_York; the events are Trinidad's and the offset New York's, so the page runs exactly 60 min early November to early March and correct by accident March-November; fix settings.timezone | O1m-19 |
| D21 | TAWKIT-ISHA-SPLIT | fixed maghrib+90 at 292 of 571 African cities and an angle of 16.85-17.25 elsewhere; by country, and inside DR Congo by city; the 22-degree clamp an earlier fit reported is a fitter bound | O1m-4r |
| D22 | TT-AFRICA-TEMPLATE | one African template: fajr 17.75, isha 18.75, sunrise -4, dhuhr +8, asr +8, maghrib +6; dhuhr 365/365 at every fitted city, 138 cities fitted across 49 countries, 95 perfect | O1m-4r |
| D23 | SALAAHTIMES-TWO-YEARS | 112 towns with 2026 and 2027 both served, all 224 town-years fitted, angle drift 0.00 median between the years | O1m-4r |
| D24 | KG-RATIO-RIDGE | isha = displayed maghrib + round(k*(fajr - sunrise) + c) with k=0.771/c=4.0, 0.773/3.75 and 0.775/3.5 all at 97.1-97.3 pc: a ridge, not a point; unrounded inputs lift to 98.6 pc | O1m-10, o1m-32 |
| D25 | KG-YEAR-BLIND | the endpoint prints identical times for 2015, 2025, 2026, 2027 and 2030, 0 differences in 726 cells across both solstice seasons | O1m-10, o1m-32 |
| D26 | UZ-ZERO-MARGIN | 15.5/15.5 Hanafi from the publisher's own bundle, ishroq +20, maghrib +4, clock fixed UTC+5, ZERO margin on every other column; the per-region differ_minute field is proven unused | O1m-10 |
| D28 | CDUM-4-FORMS | 2016-2017 both asr schools and no isha under the Maghrib/Isha labels; 2020 Shafi asr; 2021 fixed intervals; 2022-2026 18/17 Hanafi | O1m-R8 |
| D29 | TATARSTAN-UNIFORM-M1 | Kazan's 2020-2022 editions carry the recipe frozen at a uniform -1.0 min on every column: the directional rounding pass is absent before 2025 | O1m-R4 |
| D30 | CY-ABAB | two engine generations in an A-B-A-B pattern (A 2022-10-22..2022-12-31 and 2023-04-07..2025-12-31; B 2023-01-01..2023-04-06 and all 2026), B +2.4 min later on every column | O1m-R4 |
| D31 | CZ-SEASONAL-TERM | a smooth seasonal term of 2-4 min peak-to-peak on all six columns with no drift across six years, over a 12.11/11.95 Shafi base, sunrise -3.38, dhuhr +4.45, maghrib +2.43 | O1m-R4 |
| D32 | KHGT-DIP-0.032 | the maghrib pad is an elevation ladder from 2 min at sea level to 8 at 1,500 m, corr(sqrt(elevation), pad) 0.959, slope 0.032 per sqrt(metre): Tunisia's dip coefficient reproduced in a second country | O1m-5 |
| D33 | SIHAT-DIP-1.76 | both Indonesian publishers apply a horizon dip of 1.76*sqrt(h) arcmin on sunrise and maghrib, from DIFFERENT elevation fields; measured across 209 units | O1m-5 |
| D35 | UK-SCOTLAND-NIGHT | 18/15 holds all winter and a night-fraction substitute takes over late April to early August, isha interval 47-50 min in June with sd 1.0, read from AMIC's own twelve-page print | O1m-12 |
| D36 | GB-UK-ONE-CONSTRUCTION | Milton Keynes and Swansea are one construction offset by 3.2 degrees of longitude, not two recipes | O1m-12 |
| D37 | IQ-TWO-LINES | Diwan 18.1+1 / 16.9+1 with margins (+1/+5/+3) against the platform's 18/17 zero margins; both ship clean, never merged | O1m-24, o1l-8 |
| D38 | PS-AWQAF-OFFSET | 18/18 with maghrib +5..+7 on 25 cities at 99.4-100 pc, the Awqaf offset rule corroborated on a second platform | O1m-6r |
| D39 | QA-EXACTNESS-CLIMB | exactness climbs 66.6 / 75.1 / 84.9 / 87.9 pc across 2024-2027 while every parameter holds, recorded open and not a verdict; the date parameter is genuine (29-02-2024 answers, 29-02-2023 and 2025 fall back to today) | O1m-27 |

### 6.3 Consequences for policy-layer.v2.5.json (read-only, nothing edited)

**48 objects need field changes:**

| Field family | Objects | Forced by |
|---|---|---|
| `reference` (point, horizon, elevation, site) | MA-HABOUS, OM-MARA, KZ-MUFTIYAT, SA-KACST, QA-MOI, JO-AWQAF, TN-INM, PK-NIZAM-E-SALAT | A9, A35, A36, A45, A66, A78, C4, C52, D7 |
| `margins` | UZ-ISLOM, PK-NIZAM-E-SALAT, JO-AWQAF, KW-AJIRI | D26, A12, A67, A44 |
| `asr` (seasonal school switch, era split) | NO-RABITA, NO-MAWAQEET, GB-LONDON-INTERVAL-TABLE | A62, D6, A80, D34 |
| `highLatitude` (portions, gate, synthetic row, omitted days) | NO-RABITA, NO-MAWAQEET, SE-MOSQUE, BE-EMB | A61-A63, D1-D5 |
| `fajrRule` / `ishaRule` (form corrected) | SY-MWL-POLICY, IR-NATIONAL, DZ-MARW, QA-MOI, BH (no object), FI-PORTAL | A1, A37, A50, A46, A47 |
| `recipeVariants` (a second line, never merged) | TN-INM, IQ-DIWAN, JO-AWQAF, IR-NATIONAL | A7, A68, A67, C2 |
| `evidence` (span, rows, years, sites) | EG-ESA, RU-CDUM, RU-DUMRT, RU-DUMRF-MOSCOW, CZ-CENTRUM, TJ-SHURO, CL-CIS, PT-HSALAH-HUB, ES-CCIM, FR-GMS, IS-FELAG, HK-MASJIDAL, MY-JAKIM, LK-ACJU, KG-MUFTIYAT, EU-DIYANET-UNIFIED, CY-KKTC, SN-CERFI, CI-COSIM, FJ-FML, AT-IZW, TH-CICOT, SG-MUIS, FI-PORTAL | A26, A29, A30, A42, A43, A54, A57, A61, A65, C13, C21, C35, C38, C40-C43, C49, C54 |
| `notes` / `gaps` / `defects` | MA-HABOUS, KW-AJIRI, LY-MUAZZIN, MV-MUIS, BD-IFB, TT-MASJIDBOX, CZ-CENTRUM, PK-NIZAM-E-SALAT, BH (no object), YE-AWQAF-SANAA, NZ-FIANZ, VE-CARACAS | A9, A17, A26, A44, A71, A72, C70, C73, F5, F7 |

**49 rows hold no object at all.** Zero of the 35 FALLBACK rows has one, which is why the lift is also a
schema event: 32 lifted rows, 5 new countries and 8 moving rows that hold no object (United States,
Canada, Russia (Bashkortostan), Palestine, Georgia, Afghanistan, Mongolia, Tonga) make 45 rows, plus
Algeria, Syria, Lebanon and Indonesia, which the record carries as rows with no object despite
provisional or candidate grades. One object per row takes 87 to 136. The alternative shape is the one
v2.5 already uses for `FAZILET-WORLD` and `FAZILET-OTTOMAN`: one family object per platform carrying
the 23 turktakvim and Diyanet lifts, which lands between 24 and 45 new objects. The diff does not choose.

**Three facts the round proves load-bearing and v2.5 does not model:** a surface can relabel a year
without changing a value (F7), a publisher's city-postback can return one shared table for a whole
country (F8), and a stored calendar can be a different generation from the same publisher's live page.
All three are surface properties, not recipe properties, and no existing field carries them.

---

## 7. What the fit index flags and this diff could not settle

The index's 23 flags, each with what the diff did with it.

| Flag | Item | State after this diff |
|---|---|---|
| F-US-CN-18-16 | the United States and China sit on 18/16 | OPEN, and the premise corrected: a 16-degree-band isha is carried by at least one family in 99 of 232 countries, so what is specific to the pair is the membership. Adopting it would print fajr 17-27 min earlier than the surfaces the record grades A. D4 recommends no country rule. Carry both readings |
| F-IRAN-MAGHRIB | Iran's maghrib is a 4.5-degree depression | SETTLED AS CARRIED: the field exists, the measurement is wider, and Lebanon is a second user. No family among the five carries it. D5 |
| F-SA-RAMADAN | Saudi Ramadan +120 | CARRIED, witnessed twice: masjidi alone reproduces it, and the authority's own grid holds it in 232 point-years with zero violations. D6 |
| F-TAWKIT-ISHA | tawkit's two isha conventions | CARRIED as rule-form D21. 292 of 571 African cities at +90, 279 at an angle, split by country and inside DR Congo by city |
| F-CHAGUANAS | the Trinidad timezone defect | STILL LIVE after the mechanism was measured. A one-line fix in a third-party config the record may not touch. D8 |
| F-HTML-PDFS | captures saved as `.pdf` that are HTML error pages | MEASURED at 68, not 30. Four verdicts reopen, 64 deliberate negatives stand. D7 |
| F-MAWAQIT-YEAR | `?year` is a relabel | 25 of 25, zero exceptions, and the trap now rewrites the date column. A named defect class. D14 |
| F-DIYANET-150 | the city-postback defect | Stated precisely, with the 150-row count as the detection test; the current host banks 8,539 non-grid cities with 12,081 distinct digests |
| F-KUWAIT-NO-AXIS | Kuwait has no governorate axis | CLOSED as one row: four tenants on one national table, and the almanac's adoption is named |
| F-KDH07 | KDH07 reproduces on no angle pair | OPEN. The best pair (19/19) still leaves 110 fajr days and 171 isha days out. Not fitted |
| F-FITTER-A53 | the after-midnight isha bug | CLEARED by re-run, not by assertion: 39 US fits twice and 54 masjidal tenant-years reproduced field for field; one stale pre-fix artifact named |
| F-DIYANET-SUMMER | Diyanet's high-latitude block matches none of adhan's three rules | CARRIED. At Lodz on 21 June the table prints 02:51/22:27 against adhan's three candidates; those days are counted as clamped and excluded |
| F-MASJIDI-SUMMER | the masjidi summer rule is three mechanisms | CARRIED as rule-forms D1-D3. Pooling them cannot succeed |
| F-ICELAND-ISHA | Iceland's isha moved between the held year and the forward year | OPEN. The held 2026 file carries +122..+128 in January, the association's 2027 page and statement give +90. The years are not pooled |
| F-TAWKIT-YEAR | tawkit serves one eleven-month forward window | CARRIED. 2027 exists for months 01-10 and answers 11 and 12 with the previous year's same month; the harvest gates on the title |
| F-MA-SPAN | Morocco's span evidence | CONFIRMED as the sharper reading: the pre-rebuild leg does not exist, so the A rests on 2026 alone. Carried, not adjudicated |
| F-OMAN-POINT | Oman, rule against point | CLOSED AS POINT by `o1m-40`: one national recipe reproduces all 86 areas at 100.0 pc over six years at solved points. The flag's evidence was a keying defect, not a physics limit |
| F-QA-CLIMB | Qatar's exactness climb | OPEN. 66.6 to 87.9 pc exact across four years with every parameter frozen |
| F-BH-DATE | Bahrain's regime date | OPEN. 2021-08-05 (the press conference) against 2021-08-09 (the reconciliation row). One date must be chosen |
| F-PK-HYDERABAD | Pakistan, Hyderabad | OPEN. A uniform 4.5-5.5 min offset on every column with the family's tightest scatter: a meridian, flagged |
| F-PK-QUETTA | Pakistan, Quetta | RESOLVED by the later block: a 12-hour zuhr dial plus a +60-minute clock block, not an extra column. Quetta is one of four different tables |
| F-LK-MANNAR | Sri Lanka, Mannar | OPEN. Solves offshore; recorded and not claimed as a coastal point |
| F-LUPT-TIES | the LUPT block's three tie cells | OPEN and bounded. 2057-02-10 fajr and sunrise and 2064-03-10 dhuhr land within a millisecond of a half-minute boundary; an exact-match ceiling of 127,838 of 127,841 is the publisher's, not a break |

**Seven flags this diff raises that neither register carries:**

| # | Item | Why it blocks a clean close |
|---|---|---|
| G1 | Two rows moved out of a class with no class named (Thailand, India) | The count cannot be finalised. Section 5.2 counts them as UNNAMED and shows the identity still closes |
| G2 | Macau and North Korea are absent from v3 and are not counted among the five new countries | A close that adds them lands 181 rows and a provisional count of 55; one that does not ships two measured countries with no row |
| G3 | 49 rows move or enter and hold no object | policy-layer cannot be regenerated for them without a decision the diff is not entitled to make: one object per row, or one family object per platform |
| G4 | The o1l diff was never adopted | This diff's "from" column is v3's. A close that adopts it and not o1l's ships 179 rows with 18 measured countries still absent |
| G5 | Tanzania, Uganda and Mexico sit at candidate under D3 against stronger readings in the blocks | Tanzania has 1,095 rows over 2025-27 at 365/365 in every year, and Mexico a two-year Guadalajara fit. The class understates the evidence and the close should rule |
| G6 | The fit index lags five returned blocks (o1m-39, 40, 41, 44, 45) | Five measurements this diff quotes have no index entry, including the Oman point verdict and the Bahrain almanac. A close that cites the index alone cites a staler record |
| G7 | The world table and the fit index share no denominator | 179 rows and 162 entries are different objects. A close that reconciles them row by row will fail, and the failure reads as an error |

---

## 8. In flight at the cut, and what is not in the counts

Eight waves hold artifacts at this cut and contribute no counted measurement. Each is named so the next
cut starts from what exists.

| Wave | State on disk | What is banked |
|---|---|---|
| o1m-29-kaznational | REPORT.md is a PENDING skeleton, sections 2-8 all marked PENDING; the fits landed after it (`fit/fit-2026.json`, `margins-2026.json`, per-region files) | The gazetteer parsed to 5,694 entries, 5,676 distinct coordinates, 175 districts; the pull at 2,002 of 5,676 coordinates, 730,730 rows, 3,674 refusals; a national fit at ISNA 15/15 Hanafi over 935 settlement tables (86.2 pc exact, 99.9 pc within-1). Entered nowhere |
| o1m-31-indonesia | REPORT.md present but self-described as incremental; `harvest.log` stood at 900 of 1,554 month payloads | myquran serves 2028, 2029 and 2030 across 518 units, within one minute of the authority at every paired unit; Jakarta 2028 re-derives byte-identically. No new entry: the object already exists |
| o1m-32-caappeal | REPORT.md on disk, no block; folded on one entry with its section 6 outstanding | KG-115-SETTLEMENTS, 41,975 rows in the second pass |
| o1m-39-pak-remainder | CONSOLIDATION block landed at ~14:1x, after the index's cut; contributes to section 4.4 and not to the class counts | 29 chart cities, four genuinely different tables, Quetta's diagnosis overturned, 1,394 cells recovered from a second scan |
| o1m-47-flags | data and scripts growing, no report | A flags-closing pass. No count |
| o1m-49-wayback | opened, empty | Nothing |
| o1m-50-coords | a 24 MB `coords-ledger-v2.json` and a build directory, no report | A coordinate ledger. No count |
| o1m-51-turktakvim | 3,289 capture directories and an enumerate log, no report | A worldwide turktakvim enumeration. Enumerated 235 countries in this round (O1m-45), not fitted here |
| o1m-52-almanac | 23 capture directories, empty data, fit and scripts | An almanac-family hunt |
| o1m-33-index | live, `build-index2.mjs` and a smoke database | The sibling artifact at this cut: the integrity sweep the round still lacks |
| o1m-34-wtdiff3 | this document | The world-table diff |

**Beyond the world table.** The round's own volume, from the summary block: 57 dispatched tags across
52 queue rows, 55 workspace directories, 52 CONSOLIDATION blocks and 48 reports at this cut,
13,340,267 dated rows raw and 10,073,002 after the same-surface collapse, 21,877 data files spanning
2014-11-24 to 2076-12-31 with zero parse failures, an archive of 10.31 GiB on disk and 46.77 GiB
original-equivalent across 133,042 files. The soft cap is 100 GB and the archive is inside it. The
counts in section 1 are a floor for the round, not its final total.

---

## 9. The ten biggest movements

1. **Thirty-two countries leave FALLBACK.** 35 rows fall to 3 (2 with the o1l clause), the largest
   class movement the census has recorded. The lifts are presence tests at platform tier and grade
   them accordingly: 23 land at candidate, 8 at provisional, 1 unnamed. `o1m-1`, `o1m-4r`, `o1m-9`,
   `o1m-10`, `o1m-11`, `o1m-19`, `o1m-37`.
2. **The F class empties.** Jordan and Qatar both leave "structurally closed" for A. Jordan's grid was
   the ministry's own all along, reachable through 30 Wayback snapshots and 300 dated authority rows;
   Qatar's "ignored" date parameter was a genuine one behind an Angular gateway, walked across four
   years. `o1m-24`, `o1m-27`.
3. **Oman closes as POINT, not rule.** 188,340 cells over 86 areas at 100.0 pc within-1, six years
   holding, and the defect that hid it was the ministry printing its rows in Arabic alphabetical order
   with Muscat forced first. `o1m-40`.
4. **France's premise was wrong.** Nineteen of twenty surfaces carry a frozen angle pair, not a
   seasonal sweep; the sweep is Strasbourg's own 108-day block. The night-portion explanation is
   refuted by sign. `o1m-21`.
5. **London's asr moves, and the record already served both generations.** +0 through 2026, +2 from
   2027-01-01, 18,263 days exact on both mithl columns, the seam dated and the publisher stating it.
   `o1m-35`, `o1m-43`.
6. **The tawkit engine is named and its 3.18M rows ruled archive-only.** PrayTimes 2.3 at GeoNames
   points, captured from the publisher's own page. The count rule that follows is the round's most
   durable: regenerable bulk never enters the record. `o1m-3`.
7. **Iran arrives measured twice.** 44 cities, 880 pages, 26,884 rows, two Jalali years, one recipe,
   and maghrib as a 4.5-degree depression that no platform family carries. `o1m-6r`.
8. **Syria's isha is an interval.** maghrib + 90 on all 4,380 rows; the record's 18/18 pair was a fit
   with no interval in its model. Lebanon's print sits on the same 4.5-degree depression, giving the
   Iranian rule-form a second country. `o1m-24`.
9. **Pakistan's charts were readable at native resolution all along.** The 14-px wall was a reader
   limit: grid derivation plus cluster labelling decoded 25 cities, and the remainder wave took the
   family to 29 and overturned the Quetta diagnosis inside a day. `o1m-28`, `o1m-39`.
10. **The Diyanet tree is 207 countries deep and its ladder is its home temkin.** 18,582 cities, 8,539
    non-grid cities banked with distinct digests, and the constant margins that reveal it as an export
    rather than a local convention. That finding is what makes the FALLBACK lift a tier question rather
    than a coverage question. `o1m-R7r`, `o1m-26`.

---

## 10. Provenance

Every figure above is traceable to the block named in its row and to that block's workspace under
`$HOME/athan-gitree/census/o1m/`. The registers are the index and the CONSOLIDATION blocks are the
measurement. Where they differ, the block governs and the register line is quoted (section 2.1).

The two counted scripts are in this workspace: `data/class-arithmetic.py` (the class table, the
identity check, the move-by-move log) and `data/row-counts.py` (the 50 rows the corrections touch, the
A-item mapping, the object gap). Both read the record and write nothing.

Nothing here was measured by this agent. Nothing in the repository was edited. No clock was read into
any figure; every date quoted is a capture's own printed date or a date named in a block.

Built 2026-11-11 by O1m-34, from 52 blocks, two registers, one index and one decisions sheet.
Read-only. Proposes, the close adopts.
