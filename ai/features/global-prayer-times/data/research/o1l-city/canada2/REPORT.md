# O1l-58 Canada second pass — provinces beyond the held sweep

Wave: O1l-58 (Canada 2). Returned 2026-11-11. Workspace `$HOME/athan-gitree/census/o1l-city/canada2/`.

Scope: Manitoba, Saskatchewan, Nova Scotia, New Brunswick, Newfoundland, Prince Edward Island,
plus the Ontario and Quebec second cities. Twenty-five fittable surfaces in fourteen cities across eight
provinces, **9,489 dated athan rows** banked. Engine for every fit: adhan 4.4.6, `Rounding.None`,
timezone pinned per surface, dates built from the capture's own literal strings, no clock read.

## Headline results

1. **The prairie +60 defect is a dated family, and it is four for four in Winnipeg.** Every
   Winnipeg mawaqit install prints a whole-hour block on the wrong side of a DST boundary, and the
   blocks differ: Waverley 2026-11-01..2026-11-30 (+60), Al-Haqq and Manitoba Dawah Center
   2026-11-01..2026-12-31 (+60), Rahma 2026-03-08..2026-11-30 (+60, the whole DST window). Regina
   is clean. The parent's "five prairie installs print November +60" resolves into one defect class
   with three distinct end dates.
2. **Saskatoon carries four mosques and four recipes**, none of them the same: IASK 11.75/12.75
   (poor, clamped), Prairie Muslim Association 15 deg with `isha = maghrib + 90`, Dawah Center
   14.75/15 Shafi, Jamia Riyadhul Jannah an irregular table that is not solar-consistent at all.
3. **Three Moncton mawaqit tenants serve byte-identical 2026 tables** (sha256 `fb2b5ffc…`). One
   computed generation across three tenants; counted as one witness, not three.
4. **FCNA's stated 13/13 appears nowhere.** The 13/13 pair scores 1.6-2.9 min mean absolute on the
   provincial surfaces and 8-10 min in Saskatoon, where the fitted recipes score 0.25-1.0. The
   15-deg default holds.

## Manitoba

**Winnipeg — Waverley Grand Mosque** (mawaqit, platform, 365 rows, 2026, gate PASS 2026-11-11).
Recipe 15 / 15.25 deg, Shafi, fajr floor 03:31, isha cap 23:00. fajr MAE 1.99, isha MAE 0.54.
Clock defect 2026-11-01..2026-11-30 at +60 on every column. The floor and the cap are real: fajr
sits on 03:31 for 12 summer days and isha on 23:00 for 87 days.

**Winnipeg — Al-Haqq Masjid** (mawaqit, 365 rows, gate PASS). Recipe 15/15 deg, Shafi, clean:
fajr MAE 0.27, isha 0.35 on the 304 clean days. Clock defect 2026-11-01..2026-12-31 at +60.
Isha prints past midnight in June and July (00:18), which is the table's own convention, not a
defect.

**Winnipeg — Rahma Masjid** (mawaqit, 365 rows, gate PASS). Only 97 days are on the correct clock;
the other 268 (2026-03-08..2026-11-30) are +60. On the clean span the recipe is 12/15 deg at
fajr MAE 0.46, isha 0.37. The majority of this surface's year is unusable as a clock reference.

**Winnipeg — Manitoba Dawah Center** (mawaqit, 365 rows, gate PASS). Recipe 15/15 deg, Shafi,
fajr MAE 0.27, isha 0.35 on the 304 clean days. Clock defect 2026-11-01..2026-12-31 at +60, the
same block as Al-Haqq.

**Manitoba Islamic Social Services layer**: no dated table found. The association publishes no
prayer surface of its own; the four mosque installs above are the province's whole dated record.

## Saskatchewan

**Regina — Al Ummah Islamic Center** (mawaqit, 365 rows, gate PASS). Recipe 15/15 deg, Shafi.
fajr MAE 0.27, isha 0.35, dhuhr and maghrib exact. Clean clock all year. This is the province's
control surface: the same platform, the same province, no +60 block.

**Saskatoon — four dpt installs**, all `filter=year`, all 365 rows, all gated against their own
live pages the same day:

| Mosque | Live-page gate | Recipe | fajr MAE | isha MAE |
|---|---|---|---|---|
| Islamic Association of SK (`islamiccenter.sk.ca`) | PASS, all six columns | 11.75/12.75 deg, Hanafi, fajr floor 03:20 | 2.92 | 3.02 |
| Prairie Muslim Association (`saskatoonmosque.com`) | PASS | 15 deg, `isha = maghrib + 90`, Hanafi, floor 03:02 | 2.27 | 0.81 |
| Saskatoon Dawah Center (`dawahcenter.ca`) | PASS | 14.75/15 deg, Shafi | 0.49 | 0.32 |
| Jamia Riyadhul Jannah (`jrjsk.ca`) | PASS | 15/15.5 deg, Hanafi | 2.02 | 15.39 |

The PMA isha is a **fixed interval**, confirming the O1k reading from a second surface: the
isha-maghrib gap is 85 min in every month of the year, so the table holds the interval and the
"90" is the platform's rounded setting. JRJ is the outlier: its sunrise leaves the solar value by
+5.7 min in March and -3.8 min in September, a seasonal curve no coordinate pair reproduces (a
lat/lon grid search hit its bounds at 10 min mean error). Its dpt feed is labelled **2025** while
its live page shows today's row; the year attribution is ambiguous and the table is irregular.

## New Brunswick

**Moncton — four mawaqit tenants, 365 rows each, all gate PASS.** Moncton Masjid, Masjid Yusuf and
North End Mussallah return **byte-identical** tables (sha256 `fb2b5ffc3dfe8e3a…`): 15/15.25 deg,
Shafi, fajr MAE 0.91, isha 0.66. One computed generation. Hassnain-e-Karimain is a separate
generation at 15/15 deg **Hanafi** with a fajr floor of 03:25, fajr MAE 0.25, isha 0.29 — the
cleanest fit in the province.

**Saint John — Muslim Association of New Brunswick** (masjidal range API, id `Vdw3zode`, 365 rows,
2026, iqamah included). Recipe 15/15 deg, Shafi, fajr MAE 0.89, isha 0.49. This is the province's
only second-city surface and it is a full year with athan and iqamah on separate row sets.

**Fredericton — honest negative.** `frederictonislamicassociation.com` publishes **iqamah only**
(Fajr 06:30, Dhuhr 12:45, Asr 03:15, Maghrib 05:11, Isha 07:30) with no athan column and no dated
table. `en.masjidway.com/masjid/4313/prayer` serves a page with no times in its payload. Searched
in English and French; no dated athan surface found.

## Nova Scotia

**Dartmouth — Cole Harbour Muslim Community** (mawaqit, 365 rows, gate PASS). Recipe 15/15 deg,
Shafi, fajr MAE 0.26, isha 0.28, the cleanest fit in the wave. The Halifax metro's second surface.

**Halifax — Ummah Masjid and Community Centre** (dpt plugin, `?rest_route=/dpt/v1/prayertime`).
The install is **stale at 2025**: both `filter=year` and `filter=month` return 2025 rows on
2026-11-11. The 2025 table fits 15/15 deg Shafi at fajr MAE 0.34, isha 0.34 with a fajr floor of
03:34, so it is a genuine computed year, one cycle old. Captured as a 2025 surface; the live-page
gate cannot be run because the mosque's own page renders from the same stale feed.

## Prince Edward Island

**Charlottetown — Dar As-Salam Mosque** (mawaqit, 365 rows, gate PASS). Recipe 15/15.25 deg, Shafi,
fajr MAE 0.97, isha 0.56. No PEI surface appears in the held record or in the O1k consolidation;
this is the province's first dated table in this wave.

## Newfoundland and Labrador

**St John's — MANAL / Masjid al-Noor** (published full-year PDF `StJohnsPrayerTimes2026.pdf`,
mosque tier, 365 rows, clean text layer). Recipe 14.75/15.25 deg, Shafi, fajr floor 03:03,
fajr MAE 0.28, isha 0.33, sunrise and dhuhr exact. The PDF handles the 2026-03-08 DST change
correctly, which makes it the only surface in this wave whose clock is right across the boundary
without a defect block.

## Ontario second cities

**London — Islamic Centre of Southwest Ontario** (dpt `filter=year`, 364 rows, 2026). The feed is
**structurally broken**, and the record's "arithmetically broken" verdict is now measured: every
column sits 229 to 418 minutes away from the solar value, and the offset itself drifts across the
year from -414 min in January to -229 min in June and back to -418 min in December. No column
survives, so nothing is fittable. This is a defect class of its own, not a wrong angle.

**London — London Muslim Mosque** (own CMS, `/page/pray_time/monthly/YYYY-MM`, **730 rows across
2025 and 2026**, athan and iqamah in separate cells). Recipe 15 deg fajr with a floor of 03:57,
fajr MAE 1.08. The isha does **not** reproduce on an angle family: best is 13.5 deg at MAE 3.48
with a summer residual to -16 min, so the isha column is an editorial construction and is flagged
as such. Two full calendar years are held, which is the wave's only genuine year-2 pair.

**Windsor — Windsor Islamic Association** (published full-year PDF `WIA 2026 Prayer Times`, 365
rows, plus the mosque's own athanplus monthly widget as a second witness). Recipe 16.5/15 deg,
Shafi, **MAE 0.39 fajr / 0.44 isha, 99.7 pc within one minute on all six columns**. The athanplus
widget for November agrees with the PDF on all 29 days and all six columns once the 12-hour
meridiem is resolved. The fajr angle is 16.5 deg, not 15.

**Kingston — Islamic Centre of Kingston** (mawaqit, 365 rows, gate PASS). Recipe 15/15 deg, Shafi,
fajr MAE 1.02, isha 0.41.

## Quebec second cities

**Sherbrooke — Mosquée Annour** (mawaqit, 365 rows, gate PASS). 15/15 deg, Shafi, fajr floor 03:00,
fajr MAE 0.25, isha 0.28.

**Trois-Rivières — CCIM3R and Assounna Annabawiyya** (two mawaqit tenants, 365 rows each, both gate
PASS). Both 15/15 deg Shafi at fajr MAE 0.26, isha 0.29-0.30. Two tenants, two generations.

## The FCNA 13/13 test

Every surface was re-scored against the council's stated pair (13 deg fajr, 13 deg isha, Shafi,
middle of the night) with its own best integer margin:

| Surface group | Fitted recipe MAE | 13/13 MAE |
|---|---|---|
| Regina, Trois-Rivières x2, Sherbrooke | 0.25-0.35 | 2.2-4.9 |
| Moncton x4, Kingston, St John's, Halifax, Saint John | 0.25-1.02 | 1.8-2.9 |
| Windsor, Charlottetown, London | 0.39-1.08 | 1.6-3.2 |
| Saskatoon x4 | 0.49-2.92 | 8.1-10.2 |

Zero surfaces reproduce at 13/13 to the tolerance their own recipe reaches. The 15-deg default
holds across the new sample, and the divergence from the council's statement is a measured
constant, not a rounding artefact.

## Verdicts

- **15-deg fajr within ±0.5 deg**: 21 of 25 surfaces (Waverley, Al-Haqq, Regina, Moncton x4,
  Charlottetown, Kingston, Trois-Rivières x2, Sherbrooke, London, PMA, Halifax, Saint John,
  St John's 14.75, Dawah 14.75, Dartmouth, Manitoba Dawah Center, and JRJ nominally at 15 on a
  table that is irregular).
- **Not 15**: Windsor 16.5, IASK 11.75, Rahma 12 on its clean window. ICSWO is closed outright.
- **15-deg isha**: 21 of 25; the exceptions are the PMA interval (`maghrib + 90`), London Muslim
  Mosque's editorial column and IASK at 12.75.
- **Hanafi asr**: 4 surfaces (Hassnain Moncton, IASK, PMA, JRJ). Shafi on the other 15.
- **Grade**: community/platform throughout. No authority publishes a dated table in any of these
  eight provinces under these terms.

## Data ceiling and forward longevity

- Years held: **2026 for 23 surfaces, 2025+2026 for London Muslim Mosque, 2025 only for Halifax.**
  9,489 rows.
- Proven forward: none. No endpoint in this territory serves 2027; London's CMS stops at 2026-12
  and the mawaqit grids are calendar-year bound.
- Stable across years: London only, and not frozen. The same recipe serves 2025 and 2026, but the
  fajr within-one rate falls from 86.3 pc to 65.2 pc between the two years while the parameters
  hold, so the residual shifts by under a minute rather than the method changing.
- Known regime changes: the three Winnipeg +60 blocks above. Any fit crossing them must split.

## Honest negatives

- **Halifax UK trap**: `mawaqit.net/…/makki-masjid-halifax` resolves to Halifax **West Yorkshire**
  (53.72 N, Europe/London). Recorded and discarded.
- **Fredericton**: iqamah-only page, no athan column.
- **Manitoba Dawaah Center**: no mawaqit slug, no dpt install.
- **Halifax dated 2026**: the dpt install is frozen at 2025; no 2026 table exists on the site.
- Searched in English and French (Quebec and New Brunswick), and by transliteration for the Arabic
  mosque names.

## Artifacts

- `captures/` — 76 raw files: mawaqit pages, dpt JSON, two full-year PDFs, the athanplus widget,
  masjidal range JSON, live-page HTML for every gated surface.
- `data/` — 25 normalised athan tables, 8 iqamah tables, `fits.json`, `fcna-13-13.json`,
  `surfaces.json`.
- `parse_mawaqit.py`, `parse_surfaces.py`, `fit.js`, `fcna.js`, `manifest-mawaqit.tsv`.
