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

## Discipline statement

Public pages only, no login, forms, email or challenge. Arabic searched beside English,
Turkish on the Diyanet front. Every raw artifact under `captures/`, gzipped in place. OCR via
the local Vision binary only, never a model-vision pass, never the vision subagent, no pixels
read by hand. Wayback one probe at a time, stop on 429. Nothing under /tmp. No subagents
deployed. The repository was not written.
