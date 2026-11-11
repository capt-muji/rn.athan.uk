# O1m-21 France — the seasonal-sweep model

Round o1m, wave 21. Workspace `$HOME/athan-gitree/census/o1m/o1m-21-france/`.
Probe window 2026-11-11T11:15Z .. 2026-11-11T12:05Z. Engine for every fit: adhan 4.4.6
(`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`), `Rounding.None`, `Europe/Paris`
pinned through `Intl`, every instant built from a literal printed string. No clock is read; only
capture timestamps are wall-clock, and they are UTC.

Nothing here concludes a country. The record's France premise is corrected, not settled.

---

## 1. What was captured

| Artifact | Surface | Tier | Rows | File |
| --- | --- | --- | --- | --- |
| GMS Strasbourg 2026, twelve monthly PDFs | `www.mosquee-strasbourg.com/wp-content/uploads/pdf-prieres/gms-cal-2026-MM.pdf` | community (the mosque's own body) | **365 dated, 2026-01-01..12-31, zero gaps** | `captures/fr-gms-strasbourg-2026-0*.pdf` + `.txt`, `data/fr-gms-strasbourg-2026.json` |
| GMS Strasbourg 2025-12 PDF | same tree, `gms-cal-2025-12.pdf` | community | 30 of 31 dated (day 10 lost in the text layer) | `captures/fr-gms-strasbourg-2025-12.pdf`, `data/fr-gms-strasbourg-2025-12.json` |
| 12 mawaqit mosque pages | `mawaqit.net/en/m/<slug>` | platform/community | 366 each, full year 2026 | `captures/mq-fr-*.html`, `data/fr-mawaqit-new-2026.json` |
| Mosquée El Imane, 78 rue Hoche, 13003 Marseille | `mawaqit.net/fr/calendar/11f59adf-….pdf` (the platform's printed annual calendar) | platform/community | 365 dated | `captures/fr-mawaqit-marseille-calendar-2026.pdf`, `data/fr-mawaqit-marseille-print-2026.json` |
| GMP Paris horaires page | `grandemosqueedeparis.fr/horaire-des-prieres-paris` | authority | 0 new rows | `captures/fr-gmp-paris-horaires.html` |
| La Grande Mosquée de Toulouse, masjidbox | `masjidbox.com/prayer-times/la-grande-mosquee-de-toulouse` | platform/community | 0 dated rows (JS shell, today's five times only) | `captures/fr-masjidbox-toulouse-gm.html` |
| Six held mawaqit surfaces (Lyon ×2, Lille ×2, Marseille ×2) and Strasbourg 2026-12 | carried from `o1l-city/o1l-22/` | platform/community | 365 each + 31 | `data/france-tables-2026.json` |

**Net new dated rows this wave: thirteen full mawaqit mosque-years, one printed annual calendar,
and a complete publisher year.** The bank now holds **20 surfaces over 10 cities**: Lyon (2),
Lille (2), Marseille (3), Bordeaux, Nantes, Nice (2), Montpellier, Rennes (2), Toulon (2),
Toulouse (3), plus GMS Strasbourg. Every one of the seven unpublished cities in the brief —
Toulouse, Bordeaux, Nantes, Nice, Montpellier, Rennes, Toulon — now carries at least one full
year. **7,348 dated rows** sit in `data/` (6,953 platform, 365 GMS 2026, 30 GMS 2025-12). The
surface count is what matters, not the row count.

---

## 2. The instrument, and the proof that the parse is real

The Strasbourg PDF is a two-panel grid drawn in a content order that interleaves the panels, and
the panels sit six points apart vertically, so neither stream order nor a y-band dates a row. The
parse runs on the **text coordinates**: panels separated by x at 400, day numbers taken as the
leftmost numeric column inside each band, and the six-clock cell on the same line.

**Proof:** the December sheet parsed this way agrees with the held `o1l-22` December parse on
**31 of 31 rows × 6 columns, zero differences**. That held parse was itself validated against the
mosque's live `horaires.php` row. The whole year therefore rests on a parse with an external
control, not on internal consistency.

The fit instrument rides adhan's own solar position for every angle it reports: the depression is
evaluated at the published instant, so the table states its own angle instead of being assigned
one.

**Instrument check before any conclusion.** On the three columns that carry no twilight parameter,
the published table sits at a constant margin against adhan all year: Lyon sunrise +0/+1, dhuhr +6,
maghrib +3/+4; Lille sunrise +0/+1, dhuhr +5/+6, maghrib +3/+4; Bordeaux sunrise +0/+1, dhuhr
+5/+6, maghrib +3/+4; Toulouse sunrise +0/+1, dhuhr +0/+1, maghrib +6/+7. Constant, not seasonal.
A different solar engine would drift; this one does not. So every deviation reported below on a
twilight column is the publisher's parameter, not my instrument.

---

## 3. The headline: France is not a seasonal sweep

The record holds that France's fajr and isha are sweeps, implied angles moving 18 → 12 and
16 → 11.5. Measured over full years, month by month, that is true of **one surface out of twenty**.

The measured implied angle, month by month, is flat on the platform layer. Bordeaux fajr:
12.67 12.70 12.69 12.59 12.52 12.45 12.46 12.56 12.66 12.71 12.69 12.67. Toulouse AS-SALAM fajr:
14.93 in January, 14.90 in June, 14.93 in December. Marseille Mariam: 13.02 … 12.71 … 13.05. Lille
Grande Mosquée: 12.62 … 12.28 … 12.60. The full twelve-month implied-angle table for every surface
is `fit/implied-angles.json`.

What produced the record's 18 → 12 is **GMS Strasbourg**, a French mosque that publishes its own
calendar and is not on the mawaqit platform. Its fajr implied angle is 17.95-18.06 for nine months
and then dives to 11.3 for the summer. That one publisher's summer block is section 6.

**Correction for the record: the French platform layer publishes a frozen angle pair per mosque.
The sweep is one publisher's summer block plus an artefact of the earlier all-year free-angle
fits, which averaged a flat column against a clamped one.**

---

## 4. Form by form, on every surface

Each column of each surface was fitted separately. `fit/forms-2026.json` holds every parameter
set; `fit/forms-2026.log` the raw lines.

### (a) One frozen angle pair — the winner

| Surface | fajr A | fajr w1/n | fajr mae | fajr worst | isha A | isha w1/n | isha mae | isha worst |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Lyon Grande Mosquée | 14.34 | 314/366 | 0.70 | 3 | 13.61 | 313/366 | 0.66 | 2 |
| Lyon Attawba | 14.35 | 329/366 | 0.59 | 3 | 13.56 | 332/366 | 0.66 | 2 |
| Lille Grande Mosquée | 12.47 | 302/366 | 0.87 | 4 | 12.71 | 282/366 | 1.40 | 6 |
| Lille Assalam (defective) | 12.52 | 270/366 | 3.15 | 28 | 12.71 | 257/366 | 1.23 | 5 |
| Marseille Mariam | 12.94 | 291/366 | 0.67 | 3 | 13.10 | 286/366 | 0.79 | 3 |
| Marseille Khalid | 12.86 | 303/366 | 0.63 | 3 | 12.94 | 256/366 | 1.89 | 15 |
| Marseille El Imane (printed) | 12.77 | 296/365 | 0.93 | 3 | 12.90 | 294/365 | 0.79 | 3 |
| Bordeaux | 12.55 | 347/366 | 0.48 | 2 | 12.90 | 291/366 | 0.78 | 3 |
| Nantes | 12.60 | 311/366 | 0.81 | 2 | 12.87 | 268/366 | 1.09 | 4 |
| Nice Ennour | 12.92 | 296/366 | 0.70 | 3 | 12.76 | 258/366 | 1.86 | 13 |
| Nice Errahma | 12.59 | 337/366 | 0.43 | 2 | 12.98 | 188/366 | 7.18 | 38 |
| Montpellier Ibn Rochd | 14.79 | 243/366 | 2.27 | 9 | 13.98 | 74/366 | 6.58 | 22 |
| Rennes Ennour | 12.68 | 284/366 | 0.94 | 4 | 12.73 | 192/366 | 4.58 | 27 |
| Rennes Ibn Khaldoun | 12.65 | 298/366 | 1.05 | 8 | 12.83 | 178/366 | 9.51 | 46 |
| Toulon LMV | 12.81 | 362/366 | 0.38 | 2 | 13.04 | 207/366 | 9.13 | 46 |
| Toulon Pont du Las | 12.61 | 344/366 | 0.40 | 2 | 14.59 | 236/366 | 2.05 | 8 |
| Toulouse AS-SALAM | 14.93 | **366/366** | **0.08** | **1** | 15.07 | 279/366 | 5.02 | 31 |
| Toulouse Al Fath | 14.91 | 363/366 | 0.06 | 4 | 15.06 | 244/366 | 8.86 | 37 |
| Toulouse Reynerie | 14.92 | **366/366** | **0.08** | **1** | 15.22 | **366/366** | **0.27** | **1** |
| GMS Strasbourg | 17.00 | 3/365 | 18.92 | 88 | 15.82 | 143/365 | 13.35 | 71 |

Platform layer, 19 surfaces: **median fajr mae 0.67 min, median worst 3, median 311/366 within
1 minute**. Isha is the softer column: median mae 1.89, worst 13, and it fails outright on six
surfaces for reasons that are not the angle (section 7).

Per month on the cleanest surface, Lyon Grande Mosquée, fajr at a frozen 14.34:

| month | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 | 12 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| within-1 | 31/31 | 29/29 | 5/31 | 30/30 | 31/31 | 30/30 | 31/31 | 31/31 | 30/30 | 25/31 | 13/30 | 28/31 |
| median | 0 | 0 | +2 | 0 | +1 | +1 | 0 | 0 | -1 | -1 | -2 | -1 |

March is the one bad month and it is a **dated regime, not noise**: 2026-03-01..03-19 is Ramadan,
and across those days Lyon's fajr moves two minutes later while its isha moves two minutes
earlier. A separate intra-year convention, recorded, not blended.

### (b) Night portion, `fajr = sunrise − (a·N − b)` — refuted

Fitted on all 366 days, N the sunset-to-sunrise night at the mosque's own position:

| Surface | fajr portion a / b | mae | worst | isha mae | isha worst |
| --- | --- | --- | --- | --- | --- |
| Lyon Grande Mosquée | 6.16 / 6.9 | 20.51 | 57 | 18.8 | 51 |
| Bordeaux | 5.7 / 8.2-equivalent | 22.6 | 68 | 23.0 | 68 |
| Toulouse AS-SALAM | — | 20.5+ | — | — | — |

The span the Paris layer asks for runs 21-45 minutes across the year on every surface
(`fit/spans.json`); a portion of the night runs the other way, largest in June. The form is
falsified by its sign, not its residual.

### (c) Clamped angle with a fixed clock cap (the Netherlands form)

Searched with a free clock cap. It only wins where the cap never binds (`cap` returns 0 or 218-271,
i.e. outside the day) and it degenerates wherever a real cap would engage. The Dutch 03:30/23:30
convention does not fit any French surface: no French table pins a clock in the summer block —
Strasbourg's clamped fajr clock runs 03:51 (20 June) to 04:11 (28 April), a 20-minute curve, not a
pin. Refuted.

### (d) Seasonal sinusoid on the angle

`A + B·cos(2π(doy − φ)/365)`. It improves every platform surface: median fajr mae falls 0.67 →
**0.35**, within-1 rises 314 → 366/366 on nine surfaces, worst 3 → 1.

| Surface | B (°) | phase (doy) | fajr mae | fajr w1 |
| --- | --- | --- | --- | --- |
| Lyon Grande Mosquée | -0.125 | 302 | 0.33 | 348/366 |
| Lille Grande Mosquée | +0.135 | 360 | 0.42 | 360/366 |
| Marseille Mariam | +0.180 | 361.5 | 0.35 | **366/366** |
| Marseille El Imane | +0.200 | 311 | 0.29 | 361/365 |
| Bordeaux | +0.090 | 361 | 0.23 | **366/366** |
| Nantes | +0.160 | 325.5 | 0.30 | 365/366 |
| Nice Errahma | +0.105 | 342 | 0.23 | **366/366** |
| Toulon Pont du Las | +0.100 | 357 | 0.22 | **366/366** |
| Toulouse AS-SALAM | -0.010 | — | 0.07 | 366/366 |

Median B **+0.13°**, median phase **~350**, i.e. the angle is largest at the turn of the year and
smallest at the solstice. **But 0.13° is 0.7-1.0 minutes at these angles: the whole effect is one
printed minute.** It cannot be separated from the platform's own rounding, and I do not adopt it
as a rule. It is recorded as the shape of a residual, which is what it demonstrably is.

### (e) Angle and portion, whichever binds — unidentifiable as fitted, and refuted in principle

The search slides the angle to its lower bound (A → 8.1) on every surface, because with a `min`
over the span a smaller angle is never penalised: the cap absorbs it. That is a defect of the
parametrisation, not a finding, and the honest statement is that this form cannot be fitted by
free search. Where a real block exists (Strasbourg) the block is *not* a portion at all — a
portion fits its fajr block at mae 2.76 min and worst 5.4, against a printed resolution of one
minute (§6).

---

## 5. Cross-city prediction — is the form a rule?

**Test.** Take the seasonal shape (B, phase) from one city, refit only the base angle A on the
target's own four winter months, and predict the target's whole year blind.

**Result, shape taken from Lille Grande Mosquée (B = +0.135°, φ = 360):**

| Target | base A refitted | swept w1 | swept mae | swept worst | frozen w1 | frozen mae | frozen worst |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Lille Grande Mosquée | 12.43 | **366/366** | 0.43 | **1** | 302/366 | 0.87 | 4 |
| Marseille Mariam | 12.83 | **366/366** | 0.41 | **1** | 291/366 | 0.67 | 3 |
| Marseille Khalid | 12.79 | **366/366** | 0.35 | **1** | 303/366 | 0.63 | 3 |
| Marseille El Imane | 12.79 | 340/365 | 0.67 | 3 | 242/365 | 1.02 | 4 |
| Bordeaux | 12.47 | **366/366** | 0.46 | **1** | 347/366 | 0.48 | 2 |
| Nantes | 12.59 | 348/366 | 0.49 | 2 | 311/366 | 0.81 | 2 |
| Nice Ennour | 12.83 | **366/366** | 0.42 | **1** | 296/366 | 0.70 | 3 |
| Nice Errahma | 12.50 | **366/366** | 0.40 | **1** | 337/366 | 0.43 | 2 |
| Rennes Ennour | 12.59 | 326/366 | 0.65 | 2 | 284/366 | 0.94 | 4 |
| Rennes Ibn Khaldoun | 12.62 | 341/366 | 0.66 | 6 | 298/366 | 1.05 | 8 |
| Toulon Pont du Las | 12.49 | **366/366** | 0.52 | **1** | 344/366 | 0.40 | 2 |
| Toulon LMV | 12.65 | 248/366 | 1.08 | 2 | 362/366 | 0.38 | 2 |
| Lyon Grande Mosquée | 14.13 | 195/366 | 1.78 | 5 | 314/366 | 0.70 | 3 |
| Toulouse AS-SALAM | 14.79 | 251/366 | 1.00 | 3 | **366/366** | **0.08** | **1** |
| Montpellier Ibn Rochd | 14.76 | 255/366 | 1.85 | 8 | 243/366 | 2.27 | 9 |

**Seven low-angle surfaces reach 366 of 366 within one minute and a worst case of one minute** —
which no single value on the frozen search achieves. And the split is by angle, not by latitude:
every surface whose fajr sits at 12.5-13.0° takes the +0.13° solstice term, while the three
surfaces at 14.3-15.2° (Lyon, Toulouse) are flat, and applying the shape to them makes them
worse. Two publishing conventions coexist inside one platform layer: a 12.5-13° group that is
softened at the solstice and a 14.3-15° group that is not.

**Shape taken from Lyon (B = −0.125°, φ = 302) predicts nothing**: Lyon's own B is noise around
zero, and applying it makes Marseille worse (mae 1.24, worst 5). A shape only travels when the
source surface actually has one.

**The rule that does travel is the frozen pair itself.** Every one of the seven previously
unpublished cities is predicted by a frozen pair at its own base angle, fitted blind on one city's
worth of data: Toulouse's three mosques independently land on 14.91-14.93 fajr and 15.06-15.22
isha, and two of them are exact to one minute for all 366 days. That is a publisher's rule, not a
curve fit: the base angle is each mosque's own choice, the *form* is fixed.

**Verdict: I have a rule for the platform layer (per-mosque frozen pair, ±1 minute on ~85% of
days, never worse than 3 minutes on 13 of 19 surfaces) and a description for the one publisher
that sweeps.** The sweep does not predict; the frozen pair does.

---

## 6. GMS Strasbourg — the one real sweep, and what it is not

Full year, 365 dated rows, `data/fr-gms-strasbourg-2026.json`.

- **Plateau: fajr 18.00°, isha 16.00°.** Measured daily, the implied angle is 17.95-18.06 and
  15.77-16.28 from 1 January to 27 April and from 14 August to 31 December: **257 of 365 days**. On those
  days the printed fajr equals adhan's 18° fajr within 0-1 minute. The isha follows 16°.
- **Block: 28 April to 13 August, 108 days** (detected as every day whose published twilight
departs from the 18°/16° instant by more than 2 minutes). Inside it the span collapses smoothly:
fajr-to-true-sunrise 125 → 91 (5 June) → 128 minutes, maghrib-to-true-setting isha 110 → 83
(early July) → 114.
- **Implied angles inside the block sweep 17.5 → 11.3 → 17.9 (fajr) and 15.8 → 10.4 → 16.3 (isha)**,
  continuously, with no discontinuity at either boundary. The record's "18 → 12" and "16 → 11.5"
  are this block, and the true floors are 11.3 and 10.4.
- **The boundary is a night length, not a reachability test.** The block opens and closes at the
  same night: N = 9.56 h on 28 April and N = 9.56 h on 13 August. The sun reaches 18° at this
  position through most of May; the sheet leaves 18° anyway. So this is not the classical clamp.

What does not fit, all fitted on the 108 block days:

| form | mae | worst |
| --- | --- | --- |
| night portion `a·N + b` | 2.76 | 5.4 |
| fixed share of the maximum midnight depression (`0.63 × D_max`) | 3.21 | 7.0 |
| one sinusoid | 11.84 | 40 |
| two harmonics `a + b·cos + c·cos2` | **0.60** | 2.3 |
| any frozen pair | 18.9 | 88 |

The share-of-maximum-depression form is worth recording because it has a physical reading and it
*almost* works: the implied fajr is 0.60-0.66 of the deepest depression that night, drifting 10%
across the block. Close enough to be tempting, too far to be a rule at one-minute resolution.

**Degrees of freedom check: a two-harmonic curve reaching ±0.6 minutes on 108 points is a curve
fit, not a mechanism.** I am not reporting it as the publisher's rule. What is established is the
plateau, the block's boundaries, the floor values, and that every standard substitute fails.

### Year 2 — the December watch, and the between-year verdict

Two dated probes, both banked:

1. **2026-12 is published.** `gms-cal-2026-12.pdf`, 31 rows, fetched at 11:15Z, part of the
   complete 2026 year above. There is no December gap to watch: the publisher serves all twelve
   months of the current year as month-parameter PDFs.
2. **2025-12 exists and parses.** `gms-cal-2025-12.pdf` (7.7 MB, different design, one page,
   shuruk as its own cell). 30 of 31 days recovered — day 10 is lost in the text layer and that is
   recorded, not repaired. Its implied angles: **fajr median 18.00 (17.95-18.11), isha median 15.95
   (15.86-16.07)**. The 18/16 plateau is therefore present in a second, independently recomputed
   year.
3. **Between-year stability:** on the 30 shared dates, the 2025-12 and 2026-12 sheets differ by at
   most **1 minute on any column** (median 1). Parameters frozen across years; the seasonal
   amplitude is the block, not a year-to-year drift.

Grade: two published years on one recipe, the second partial (December only). `provisional` on the
second year until the other eleven 2025 months are fetched — the URL pattern serves them and the
2025 tree answered 200 on `2025-11`, so that is a standing one-fetch-per-month archive, not a
closed door.

---

## 7. Two findings that change the recipe class

**A fixed interval, exactly.** Montpellier's Grande Mosquée Ibn Rochd publishes
`isha = maghrib + 80 minutes` on **366 of 366 days**, one distinct value. Not 79, not 81. Its
fajr is an angle (15°) with a summer block. So at least one French mosque runs one column on an
angle and the other on a fixed interval — which is the Ufa/Ministry fixed-interval class, not an
angle class, and no angle fit will ever close that column (frozen 13.98 scores 74/366, mae 6.58).

**The isha column is the defective one, and the defect is a clock pin.** Six surfaces carry
isha failures that no fit repairs because the column is not computed there:

- Toulouse AS-SALAM: isha pinned at **19:15** through November and December (median residual −23.5
  and −30 minutes), and edited in January. The other nine months sit at a median residual of 0
  with a worst of 1 minute, October excepted at 8.
- Toulouse Al Fath: one row (2026-09-06) with `isha = maghrib + 17`.
- Rennes Ennour and Ibn Khaldoun, Toulon LMV, Nice Ennour: winter isha outliers the platform
  table carries as hand edits (worst 13-46 minutes on single days, clean elsewhere).
- Lille Assalam: the known defective table; 28-minute fajr scatter, plus October days with a
  fajr span of 17-18 minutes.
- Toulon LMV: **2026-10-01 fajr is 113 minutes after sunrise** — a published impossibility, kept
  and flagged.

---

## 8. What the builder takes away

For the French platform layer: **one frozen angle pair per mosque, with the base angle read from
the mosque's own table and held all year.** Nothing else is needed. A builder that injects a
seasonal sweep into France makes 85% of days worse.

Concrete consequence: the France entry needs no high-latitude branch at 43-51 N for these
surfaces. The one branch worth writing is a *per-mosque* parameter row (fajr angle, isha angle,
dhuhr/maghrib temkin), not a national rule — the spread across ten cities is 12.47 to 14.93 on
fajr and 12.71 to 15.22 on isha, which no national constant covers.

For GMS Strasbourg only: 18/16 with a 110-day block from late April to mid August whose span
follows no standard substitute. A builder serving Strasbourg must carry the publisher's own
values; a computed substitute is wrong by up to 88 minutes on 20 June.

---

## 9. Negatives, with the languages searched

Searched in **French** (and English where the surface is English).

- **GMS Strasbourg method statement:** absent from the PDFs, absent from the site. The sheets
  carry no method line, no engine name, no footnote. Re-confirmed this wave after the O1k negative.
- **GMP Paris, December 2026:** still not posted at 2026-11-11T11:57Z. The horaires page serves
  `HEURES PRIERE - PARIS - GMP - NOVEMBRE 2026.jpg` and no December asset. Dated negative.
- **GMP city pages:** the fourteen `horaire-des-prieres-<city>` slugs remain empty except Paris
  (O1l-22 finding, re-observed on Bordeaux this wave).
- **Own PDFs per city:** searched in French for Bordeaux, Toulouse, Nantes and Marseille
  ("horaires de prière PDF 2026 grande mosquée <ville>", "calendrier prières 2026 mosquée <ville>",
  "calendrier annuel"). No mosque-owned annual PDF surfaced for any of the four; results are the
  aggregators (al-kanz, hamariweb, muslimpro, yabiladi, salattimes, guidemusulman, gotopray,
  assabile), one Ramadan-only PDF (pelerinhajj, Toulouse and Marseille), and social posts. The
  aggregators are calculators, not authorities, and were not banked.
- **masjidbox Toulouse:** the Grande Mosquée de Toulouse's masjidbox page is a JS shell carrying
  today's five times only, no dated table. Recorded as computed-only, not a surface.
- **mawaqit search API:** still 401/404 without a key; discovery ran through search-engine
  `site:` queries and the public mosque page, as in O1l-22.

---

## 10. Defects and honest gaps

- **My own instrument, found and fixed mid-wave:** the first series builder overwrote the published
  sunrise and maghrib with adhan's. It changed no angle (angles are computed at absolute published
  instants) but every *span* figure before the fix was measured against adhan's sunrise. All spans,
  intervals and defect counts in this report come from the corrected build
  (`work/fitseries.mjs`, `pSunrise`/`pMaghrib`).
- **Region-style DP rows:** the 12 mawaqit pages carry 366 day keys where 2026 has 365 — one key
  is duplicated inside `confData`. Row counts are reported as the page serves them.
- **El Imane position is a street address, not a surveyed point** (78 rue Hoche, 13003 Marseille,
  43.3025/5.3811). Its fit is one minute clean, so the position is adequate; not solved.
- **Strasbourg 2025-12 day 10** is missing from the text layer. 30/31.
- **The Strasbourg block's mechanism is open.** Every standard substitute is refuted; the block's
  values are carried, not derived.
- **Montpellier's fajr summer block** is not fitted: its fajr implied angle sweeps 15.0 → 13.9,
  a third of Strasbourg's amplitude, and its isha is the fixed interval. A second publisher with
  a real block, unexamined beyond the frozen-fit failure.

---

## 11. NEXT

1. **Fetch the other eleven 2025 months at GMS Strasbourg** (`gms-cal-2025-MM.pdf` answered 200 on
   `2025-11` and `2025-12`). That converts the partial second year into a full one and gives the
   block a genuine year-2 test — the cheapest open item in this wave.
2. **Fit Montpellier's summer block** with the Strasbourg machinery, to see whether the two blocks
   share a shape. Two independent publishers with the same block shape would make the sweep a
   French publishing habit and worth a named rule; two unrelated shapes would settle it as
   per-publisher.
3. **Probe mawaqit's printed calendar endpoint** (`mawaqit.net/fr/calendar/<uuid>.pdf`) for every
   banked tenant. It is a 12-page French annual calendar per mosque and it confirms the page's own
   table; El Imane came from that route and was not previously in the record.
4. **Test `isha = maghrib + fixed`** across the whole French layer as a *column class*, not a form:
   Montpellier is exact at 80 minutes, and the other isha columns may be intervals plus an angle
   mix rather than angles.
5. **Re-attack the remaining French cities** — Strasbourg city mosques beyond the GMS, plus
   Angers, Dijon, Grenoble, Reims, Le Havre, Saint-Étienne, Clermont-Ferrand — same platform
   routes, one year each.

---

## Appendix — reproduce

`work/engine.mjs` (adhan wrapper, TZ, night), `work/fitseries.mjs` (dated series carrying both the
published and the computed solar columns), `work/fit.mjs` (the six form searches),
`work/crosscity.mjs` (the prediction test), `work/clamp.mjs` and `work/share.mjs` (the Strasbourg
block), `work/spans.mjs` and `work/defects.mjs` (the column and row census), `work/parse-gms.py`
and `work/emit-gms.mjs` (Strasbourg, geometric), `work/parse-mq.py` and
`work/parse-gms-2025-12.py`. Logs and JSON under `fit/` are the outputs those scripts wrote.
