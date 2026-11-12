# O1n-23 — MENA re-covering, the o1n-12 leftovers

Wave o1n-23, round o1n, 2026-11-11. Mission: the Middle East and North Africa fronts the
stopped o1n-12 wave left open. Engine adhan 4.4.6 at
`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`, `Rounding.None`. Public pages only,
Arabic searched beside English, Wayback one probe at a time, nothing under /tmp, no subagents,
the repository untouched. Workspace: `captures/` (raw), `data/` (normalised), `work/` (scratch).

## 1. Kuwait ruznama cell extraction — NEGATIVE with the attempts banked, plus a partial structural decode

The twelve monthly ministry ruznama images (awgatalsalat.com/calendar/01..12.jpg, banked raw by
o1n-12) were preprocessed and re-read by every honest local route:

- Preprocess per month (scripts/kw-preprocess2.py): table region cropped (y 240-1370 at 1x),
  ruling-line thickness measured (2 px: no skew, rotation correctly skipped), 4x LANCZOS
  upscale, adaptive threshold (pixel vs blurred local mean, k=0.88), row grid from the ruling
  lines (~146 px rows at 4x, ~30 rows per page). All twelve tables processed and banked
  (`captures/kw-ruznama/<mm>-meta.json.gz`, processed table for November kept whole).
- OCR on every processed crop with the census binary (fast level, en-first) and the Arabic-pinned
  variant: whole tables, 6x rows, 6x individual cells, 10x single glyphs with three render
  variants (gray, sharpened, binarized). Whole-page and row reads return digit soup
  (Latin lookalikes for Arabic-Indic digits: ٣->r, ٢->Y, ٨->A); cells and glyphs return empty.
  A rendered ground-truth control (GeezaPro Arabic-Indic digits 0-9 and the numbers 1-30,
  `captures/kw-ruznama/gt-*.png.gz`) proves the misread map is font-dependent and does not
  transfer - decoding by OCR inversion is closed.
- Structural decode without OCR (scripts/kw_decode3.py): connected components per row, tokens
  classified against prototypes LABELED by the day column itself (the day numbers 1..30 cover
  every Arabic-Indic digit 0-9, so no OCR and no mirror are needed to label a glyph). The day
  column decodes exactly (correlation 0.94-1.00) for 12-18 of 30 rows per month
  (`captures/kw-ruznama/<mm>-decode.json.gz`); months 02 and 06 fail the row-grid assert.
  The six remaining numeric columns per row decode into stable 1-2 token cells whose semantics
  are NOT prayer times: subsequence alignment against five transforms of the held mirror year's
  six prayer columns (full HHMM, no-leading-zero, minutes-only, hours-only, stripped) peaks at
  0.56 LCS - no transform aligns. Tide times are excluded on a measured basis: the decoded
  columns move ~+1 unit/day, tides move ~+50 min/day (Kuwait City reference: high 01:13, low
  08:29, high 15:23, low 20:05 on 2026-11-11). A no-PDF search for a higher-resolution copy of
  the same ministry print (TinyFish, Arabic: الرزنامة الرسمية لوزارة الأوقاف الكويت, site:
  awqaf.gov.kw رزنامة pdf) returns only the ministry's publications-catalog PDF naming the
  ruznama as a print, not the print itself.

**Verdict:** the print still will not resolve to confident cell values. The negative stands with
the full attempt trail banked: the images stay raw-only, the Kuwait layer keeps the computed
generation and its three-way gating from o1m-27/o1n-12. The partial decode (day grid, day column,
per-row cell geometry) is banked as the evidence base for any future pass.

## 2. F-DIYANET-SUMMER — CLOSED: the mystery family was a column mislabel; the flag's isha is the Diyanet's own yatsı

The hunt ran the routes the mission named: diyanet.gov.tr's own foreign-city surfaces
(namazvakitleri.diyanet.gov.tr city pages, fetched live with a browser UA), the official API
gateway awqatsalah.diyanet.gov.tr (located; a registration-form service, not probed further),
vakithesaplama.diyanet.gov.tr, the namazvakti.com third publisher (Berlin yearly fetched), and
Turkish searches (Diyanet Almanya namaz vakitleri 2026 PDF, DİTİB takvim, Avrupa kitapçık).
No static per-country PDF surfaced publicly; the yearly tables render server-side per city and
export client-side.

**The resolution is structural.** The o1n-5 sweep read the tree rows as
`isha_interval = row[6] - row[5]`; in the tree's own schema
`[date, weekday, imsak, güneş, öğle, ikindi, akşam, yatsı]` that is **AKŞAM − İKİNDİ**, the
asr-to-maghrib span. Its "isha interval series 131→235 min (Dec→June, Berlin band)" is that
span, which no twilight family can reproduce - the sweep's exhausted-candidates verdict was an
artifact. The band-sharing claim dissolves the same way: the true yatsı column is per-city
(Berlin 22:57 vs Lodz 22:27 at the 2026 solstice).

The flag's own fingerprint is attributed: the Diyanet's Lodz page (city 15843) prints
**yatsı 22:27 on 19-23 June 2026** (22:25 on 15 June), exactly the flag's "isha 22:27".
The true yatsı rule, measured on the banked Berlin and Lodz yearly tables (365 rows each,
`data/dynet-berlin-2026-year.json`, `data/dynet-lodz-2026-year.json`): **15.0 deg depression
in the main season** (implied angle 14.6-15.3; 185/365 days at 15.0±0.1 for Lodz, 200/365 for
Berlin), with a **summer high-latitude clamp** from ~24 April to ~3-11 September that pulls
yatsı earlier - implied angle floor 8.4 deg at Lodz, interval floor 75-77 min at solstice, the
clamp plateauing in absolute clock time per city (Lodz yatsı 22:24-22:28 for 12-24 June; its
imsak likewise plateaus at 02:51 for 12-22 June).

**Verdict:** the flag closes. The "different Diyanet product" was the Diyanet's own current
site product read correctly; the tree's data was right and the sweep's column indexing was
wrong. The 15° winter rule plus the summer clamp is the named form for the record; the exact
clamp formula (its start date drifts by latitude: 24 Apr Berlin, 24 Apr Lodz, ends 3-11 Sep)
is left as the residual open item with all numbers banked.

## 3. Iran year-3 (Jalali 1402) — the held recipe now spans five windows

The pishkhanak archive path (`/tools/prayer-times/<city>/<jalali-year>/<month>`, the prior
wave's method, no Wayback) was walked for **Jalali 1402** (2023-03-21 .. 2024-03-19) on the
same 48-city set, plus an Ordibehesht 1406 sample. 600 pages requested; 548 fetched over
20 KB; 52 city-months stayed unfetched after a second retry pass (server-side gaps, city-month
list in the parse log) - every fetched page parsed, zero parse failures. **17,424 new dated
rows** (`data/ir-1402-rows.json`); the merged bank moves **44,352 → 61,776 rows**, global span
**2023-03-21 .. 2027-04-20** (`data/ir-merged-rows.json`).

**The held recipe scored on the new window** (`data/ir-1402-heldrecipe-score.json`, engine
adhan 4.4.6 via the o1k lib, TZ=Asia/Tehran, 38 cities with recovered points): fajr 17.7,
isha 14.0, maghrib at the sun's 4.5-degree depression mirrored around dhuhr, every margin 0,
nearest rounding — **36 of 38 cities at 100 pc within-1 (worst cell 1 minute)**. The two
failures are Khorramabad (7.1 pc) and Bam (8.7 pc), exactly the two publisher-defect cities
the o1n-12 verdict named in every prior window - they remain publisher defects, never
counter-evidence. **The A grade now rests on four distinct fitted Jalali years** (1402, 1403,
1404, 1405) plus the 1406 forward samples; the span verdict stays yes with the widened span.

## 4. Jordan — Maan's defect is durable; the ministry grid is still down; the families' second year waits for the window roll

- **Maan retried live**: the full 2026-11..2027-10 window re-fetched fresh (12 pages,
  `captures/jo/maan/`) and re-scored against both family recipes at Maan's own point:
  **still displaced ~+40 min** (family +6 meanSigned +40.75, +7 +40.45 over 2,190 cells) —
  the same +40.67 o1m-24 measured. The defect is durable, not transient; the page stays
  excluded, with the fresh evidence banked.
- **The ministry grid (awqaf.gov.jo/ar/Pages/PrayerTime)** timed out twice more today
  (connection timeout, curl with a browser UA; `captures/jo/`) — unreachable from this host,
  as o1n-12 recorded.
- The families' second year therefore has no reachable new surface today: tawkit's window is
  still 2026-11..2027-10 (the current-month-plus-eleven bound), and it will only roll to
  expose 2027-11 after 2026-12-01.

## 5. Libya — the Dar al-Ifta API's origin dated; the no-archive question re-confirmed

Wayback homepage captures of ifta.ly: **2025-12-31 and 2026-05-28 both carry no prayer widget
and no api.ifta.ly reference** (`captures/ly/wayback-iftaly-2025.html`,
`wayback-iftaly-2026-05.html`) — the rolling-window API **appeared between 2026-05-28 and
2026-11-11**. A fresh parameter battery (from/to, year+month, start+days, v=2; /api/v2 and
/api-docs probed) returns the identical server-clock window or 404: **no archive, no year
parameter, /api/v2 does not exist**. The Dar al-Ifta row stays what o1n-12 banked: a rolling
today-plus-seven window, span untestable-short-sample, origin now dated.

## 6. Syria — the sana.sy ministry-calendar post is dead from here; the imsakiyya's page geometry measured

The state agency's post (sana.sy/?p=2195816, referenced by the ministry's own Facebook for the
calendar attribution) redirects to `archive.sana.sy`, which does not resolve from this host,
and the Wayback replay of the post returns an empty body — recorded, not solved. The
ministry's site still lists no prayer page. The banked Ramadan 1447 imsakiyya image was
measure-passed: 1080x1439, one dense header block (y 163-388) and **27-29 row bands at ~35 px**
(probe banked) — consistent with a day-per-row month grid whose confident cell attribution
stays open, as o1n-12 left it.

## 7. Yemen — yemenawqaf.org does NOT serve a second year: the selector grew, the data did not

The ministry's own feed (yemenawqaf.org/prayer-times, the record's line for Aden, Lahj,
Mukalla, Seiyun, Marib, Al-Ghaydah) now lists **2025, 2026 and 2027 in its year selector**
(fresh live capture, `captures/ye/yemenawqaf-live-2026-11-11.html`) — but the Livewire walk
returns **"لا توجد بيانات لهذا الشهر" (no data for this month) for every 2025 and 2027
probe** (six combos: 2027-01/06/11, 2025-01, locations 1 and 2), while 2026-01 and 2026-11
serve their full tables (186 and 180 time cells). The page's own source line still reads
"مواقيت الصلاة لمدينة عدن وضواحيها لعام 2026م". **The feed is current-year locked, now with
the refusal of both neighbouring years proven live** (`captures/ye/test-*.json`); the banked
2026 layer (2,190 rows, six cities) remains the surface's only dated year, and the two
Yemeni authorities' lines stay apart. Bonus capture: the page states Aden's own position
(12.85 N, 44.983 E, qibla 330.00°) — the publisher's own coordinates, banked.

## 8. The Maghreb year-2 probes — both fronts already carry their second years; fresh probes add dated negatives

- **Algeria**: the Wayback CDX for `marw.gov.dz/media/calendrier*` re-run today returns
  **exactly the same four books** o1m-30 swept — 1447 (Adrar, Alger, Djelfa) and 1448 (Alger,
  the banked dz48 layer, 235 transcribed days). No 1449 book, no new scans since 2026-07-30
  (`captures/dz-cdx-calendrier.txt`). The 01-05/01-06 withheld days were not reopened, per the
  order. Algeria's year-2 exists and is banked; no third year is archived.
- **Tunisia**: meteo.tn's `horaire_gouvernorat` API probed live: 2026 dates serve their tables
  (2026-06-21, 2026-11-12 and the future 2026-12-15 all return full delegation JSON), **2027
  returns `{"data":null}`** (probes banked under `captures/tn/`). The API's coverage stays
  2025+2026 — both already swept and fitted by o1m-30 — so no third year exists yet.

## Honest negatives — "not proven" list, in my own words

1. **The Kuwait ministry ruznama's cells are not extracted.** Every honest local route was
   run (preprocess, deskew-measured, upscale, adaptive binarize, OCR at page/row/cell/glyph
   scale in two reader configurations, plus a rendered ground-truth control and a labeled
   structural decode). The day column and page geometry decode; the six numeric columns
   remain semantically unidentified - they match none of the five prayer-time transforms of
   the held mirror and are not tide times on the measured drift. The print stays raw-only.
2. **A higher-resolution copy of the same ministry print is not found** under the Arabic
   terms searched (the ministry's publications catalog names the ruznama as a print; the
   print itself does not surface on awqaf.gov.kw or the open web).
3. **The Diyanet summer clamp's exact formula is not derived.** The clamp's existence,
   window (~24 Apr to 3-11 Sep), direction (pulls yatsi earlier), and depth (implied angle
   floor 8.4 deg / interval floor 75-77 min at solstice) are measured; the formula that
   generates it is not identified under these terms.
4. **Maan's tawkit page stays displaced** (+40 min, durable across a fresh full-window
   fetch); the cause is not published anywhere reachable.
5. **Jordan's awqaf.gov.jo grid remains unreachable** from this host (four connection
   timeouts across two waves today and yesterday's stop).
6. **The families' (fajr 18.0/18.05 +6, Amman +7) second year is not available yet** -
   tawkit's window has not rolled; nothing else serves the ten-city layer.
7. **The Dar al-Ifta API has no archive and no year parameter** (probed again with new
   parameter shapes); its rolling window cannot produce a second year by any parameter.
8. **Syria's ministry calendar post is unreachable** (archive.sana.sy does not resolve;
   Wayback replay empty), and the ministry's imsakiyya structure is attributed only to its
   page geometry (day-per-row grid measured), not to confident cells.
9. **yemenawqaf.org refuses both neighbouring years** despite listing them in the selector;
   a genuinely dated second year for its six cities is not served.
10. **Algeria's third Hijri year and Tunisia's 2027 do not exist** in the archive/API under
    these terms (CDX unchanged; meteo.tn data:null on 2027 dates).

## Discipline statement

Public pages only, no login, forms, email or challenge. Arabic searched beside English,
Turkish on the Diyanet front. Every raw artifact under `captures/`, gzipped in place. OCR via
the local Vision binary only, never a model-vision pass, never the vision subagent, no pixels
read by hand. Wayback one probe at a time, stop on 429. Nothing under /tmp. No subagents
deployed. The repository was not written.

---

# Continuation, 2026-11-12 (wave o1n-23, resumed)

Fronts of this leg: the fm6oa.org regional-tables lead (handed over from wave O1n-24) and
Syria's imsakiyya cells. Engine of record adhan 4.4.6, `Rounding.None`; the served
PrayTimes.js was additionally run for engine attribution where noted. Same discipline as
above; agent-browser not needed (no JS wall met); nothing outside the workspace.

## 9. fm6oa.org — the Mohammed VI Foundation of African Oulema's prayer service — CAPTURED, and it is a relabelled edition of the ministry's own computed generation

The foundation's prayer-times page (Arabic, French and English editions all captured) embeds
`fm6oa.org/prieres/code/index.php?ville=N` (163 city options, all Moroccan, Rabat-Salé to
Laayoune/Dakhla) plus a sidebar widget `horaire_fm6oa_aside.php?ville=N`. Each city page
serves a TODAY table and a full lunar-month grid (Jumada al-Thani 1448, 11 Nov to 10 Dec 2026,
day 30 marked "حسب نتيجة المراقبة"). All 163 tables captured (4,890 dated rows,
`data/fm6oa-rows.json`). The `/prieres/` directory is an open Apache listing: the served
engine is PrayTimes.js, with `ghana.html` a live client-side PrayTimes widget for Accra
(timezone 0) and `stdr.html` an empty placeholder ("times will be updated later") pointing at
Abuja - the Foundation's African-branch surfaces are today-widgets, not dated tables
(all artifacts under `captures/fm6oa/`).

Two provenance facts settle what this surface is:

- The aside widget's Google Analytics tag `UA-35630430-1` is registered to **habous.net** -
  the Moroccan ministry's own domain.
- Name-matched against the ministry's own product, the FM6OA grids are **95.83% byte-identical
  on the 2026-11-11..30 overlap (18,744 of 19,560 cells, max |diff| 1 min)** across all 163
  cities (`data/fm6oa-vs-habous-byname.json`). By raw code the overlap looked different
  (10.7% identical - the code spaces differ); by city NAME every one of the 163 pairs matched.

So the FM6OA service is a **relabelled redistribution of one computed generation** - the
ministry's - not a new authority layer. Per the frozen rule, a relabelled edition does not
lift a grade. Tier reasoning: tier follows adoption, and the adopting parties here are (a)
the Foundation itself, which publishes the service in three languages under its own brand
(royal-chartered authority-by-publisher), and (b) its African country branches through the
client-side widgets. The generation behind both is the ministry's, already the record's
Morocco line. Grade for the Foundation surface: **community-to-authority redistribution of a
provisional generation** - recorded as a distribution fact, not a new row.

### The ministry's own product was captured for the comparison, and it carries a dated regime change

The ministry's homepage (`habous.gov.ma`, captured) now serves prayer times from monthly
static files `data/horaires-YYYY-MM.js` plus a `data/hijri.js` month-start registry (month
starts by announced sighting; Jumada I 1448 = 2026-10-13, 29 days; Jumada II = 2026-11-11,
duration open). **October and November 2026 files exist; September and earlier are gone
(404) and December is not yet posted** - a two-month rolling publication. Parsed bank:
**11,590 rows, 190 cities, 2026-10-01..2026-11-30** (`data/habous-months-rows.json`,
raw files gzipped).

The ministry's own widget code documents a **clock regime change**: "Heure légale du Maroc =
GMT depuis le 20/09/2026 (décret 2.26.530)" - Morocco moved to permanent GMT on
2026-09-20, replacing the permanent UTC+1. This is the same family of finding as the
Western Sahara clock dispute already in the record; the served tables are GMT-based.

### Fit of the ministry generation (per FIT-RULES, engine attribution included)

Fit used the ministry's own city coordinates (`villes.json` in the served directory, 191
entries, degrees+minutes with west longitudes unsigned - the sign convention cost one wrong
pass before being caught). The ministry's tables do NOT reproduce on adhan 4.4.6 at any
recipe: best adhan recipe (fajr 19.1, isha 17, dhuhr +5) reaches only **0.9% exact,
mae 2.08, worst ~10 min** over 69,540 cells (`work/fm6oa/adhan-score.json`).

The SERVED PrayTimes.js engine was then run directly (MWL family, asr Standard,
rise/set angle 0.833 + 0.0347·√elv, GMT). Best recipe **fajr ≈ 19.1°, isha 18°, dhuhr =
transit + 5 min** scores **51.5% exact, 73.7% within-1, mae 1.219, worst 5-6 min** over all
69,540 cells of the two months, and the residual is UNIFORM across all 190 cities
(65-83% within-1 everywhere; no outlier city) - so the gap is the ministry's server-side
engine version/constants, not coordinates. **Reproduction is NOT at zero margins**, so the
recipe is recorded as an attribution envelope, not a proof: PrayTimes-v2-family,
elevation-corrected rise/set, fajr ≈ 19.1°, isha 18°, Standard asr, dhuhr ≈ transit + 5 min
(`work/fm6oa/percity-fajr191.json`, `praytimes-score.json`).

FIT-RULES deliverable: span held = 61 dated days (Oct+Nov 2026) on 190 cities, one recipe
across both months (no between-year stability testable - one published cycle; no seasonal
amplitude from a two-month window; engine stated above). Grade: **provisional** (one
published cycle, current), same computed generation as the FM6OA capture.

## 10. Syria — the Ramadan 1447 imsakiyya cells are EXTRACTED (174/174), attribution bounded honestly

The banked sheet (1080×1439) was measured on the actual ruling grid: 29 day-rows at 33-35 px
pitch, 9 columns (one red-print column holding a decorative element on rows 1-2 only, six
numeric time columns with three distinct print styles - dark-on-light, white-on-teal,
dark-on-teal - and two date/day columns). Every numeric cell was extracted by per-cell crops
and the local Vision OCR at the fast level, with per-column masks and multi-read consensus:
**174/174 cells parsed into times, 29 dated rows banked**
(`data/sy-imsakiyya-1447-dated-rows.json`, cells with provenance in
`data/sy-imsakiyya-1447-cells.json`). The date and day-number columns did NOT resolve to text
and are recorded as unread - the dated axis is attributed, not print-read (below).

Attribution (engine adhan 4.4.6 at Damascus 33.5115, 36.3064, UTC+3, sweep scripts banked):

- F2 = **fajr**, implied fixed angle ≈ 18.85° (8-10/29 days exact, mae ≈ 0.9).
- F1 = **sunrise** (residual 0 to −3 min across the month).
- E = **dhuhr − 1 min** (25/29 exact).
- D = **asr (Shafi'i) in 12-hour clock − ~2.5 min** (mae 0.68).
- C = **maghrib in 12-hour clock − ~1 min** (mae 0.81). Sanity anchor: Damascus sunset
  18 Feb = 18:22 local; the print's day-1 cell 06:21 = 18:21.
- B = an **unlabelled sixth numeric column**: constant 78-79 min after the maghrib column
  (wobble 78/79), equivalently an isha-like product at ~18.5° − ~6 min. The print carries no
  readable label for it. **It is not recorded as isha**, and the sheet shows no readable
  isha column.

The sheet's engine is NOT identified: every column shows a smooth ±3 min month-scale drift
against adhan, and PrayTimes-v2 (MWL 18/18, with and without the elevation correction for
Damascus ~690 m) does not close it. The full attribution with residual profiles is
`data/sy-imsakiyya-1447-attribution.json`.

Date axis: the National Crescent Committee's announcement (reached only as a search snippet;
the announcement page itself does not resolve from this host) puts **1 Ramadan 1447 on
Thursday 2026-02-19**, and the rows are dated on that authority; a pure adhan fit prefers
18 Feb by ~1 min, inside the unproven engine constants, so the day-level anchor is recorded
as attributed, not proven (both candidates in the data file's `date_axis` note).

## 11. Syria — ministry site and second-surface probes

`mow.gov.sy` is live (homepage captured raw, `captures/sy/mow-home.html.gz`): the site
carries NO prayer-times page. It promotes the ministry's own app "مسجديك" (Masjidak) on both
app stores - a named native surface, not probed (outside the public-page walk). Second
Syrian authority surface: none reached under these terms (Bing returned unrelated results;
html.duckduckgo and lite.duckduckgo both issued challenges on later probes and the thread
was stopped; mojeek challenged; suryalana.com does not resolve from this host and TinyFish
rejected its percent-encoded URL). `hijridate.com` now serves the NEXT Ramadan's (1448)
Damascus table - a community surface, noted in `captures/sy/provenance-notes.md.gz`, not
banked as authority.

## Honest negatives added this leg

1. **The FM6OA/ministry reproduction is not at zero margins**: the best recipe on the
   publisher's own served engine still misses by up to 5-6 min uniformly (mae 1.22); the
   ministry's server-side engine version and exact constants are not exposed by anything
   served.
2. **adhan 4.4.6 does not reproduce the Morocco generation** (best 0.9% exact, mae 2.08) -
   the elevation-corrected PrayTimes-family signature is real and adhan lacks it.
3. **The Syrian sheet's engine is not identified** and its exact fajr angle is bounded
   (~18.85° ± engine noise), not proven.
4. **The sheet's date and day-number cells did not OCR** - the date axis rests on the
   committee announcement (snippet-level) plus fit, not on print-read cells.
5. **The Syrian committee announcement text was never fetched** (page does not resolve;
   snippet only); its wording is known to the length of the cut.
6. **The ministry's Masjidak app is a named, unprobed surface** (native app; store pages
   linked from the ministry homepage).
7. **December 2026 does not exist yet** in the ministry's monthly files and **September
   2026 and earlier are gone** - the two-month window is the surface's whole archive today.

## Discipline statement (continuation)

Public pages only; no login, forms, email or challenge solved (three search-engine
challenges were recorded and the threads stopped). OCR local and free only - the local
Vision binary, fast level, on per-cell crops; no model-vision pass, no pixels read by hand.
Timestamps UTC; the sweep and captures are logged. Every raw artifact under `captures/`,
gzipped in place; derived rows and fits under `data/`. Wayback not needed this leg. No
subagents deployed. The repository was not written.
