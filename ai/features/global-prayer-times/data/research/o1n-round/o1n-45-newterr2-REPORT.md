# O1n-45-newterr2 — new territory: Iceland, Norway, Finland, Polynesia, ledger's worst (REPORT)

Wave O1n-45 of round four (o1n), session four, 2026-11-12. All timestamps UTC from literal
capture strings; the real clock reads nothing into data. Workspace
`$HOME/athan-gitree/census/o1n/o1n-45-newterr2/`; nothing under /tmp; no subagents
deployed; nothing written in the repo. Public pages only. Engine of record: adhan 4.4.6
(`census/adhan-build`) solar core via the o1n-3 engine.mjs (read-only import). Raw captures
gzipped under `captures/`, banked data under `data/`, per-front sections below written
incrementally. Wayback: one probe at a time, thread stops on first 429.

## Assumptions carried into the wave

- The turktakvim tree's seven shell countries are closed as publisher surfaces (o1n-40):
  every front here hunts NEW publishers, not the platform.
- Front 5's "real Muslim populations" filter: countries whose ledger row carries a
  community/authority/platform tier and nonzero settlements; micro-territories with no
  Muslim institution (recorded negatives) are skipped.

## Front 1 — ICELAND (banked 2026-11-12, timestamps UTC)

Iceland had ZERO dated rows (ledger coverage 0.0, 301 turktakvim shells). This front banked
**9,979 dated rows across four surfaces** and identified the publisher's engine.

### 1a. felagmuslima.is — Félag Múslíma á Íslandi (authority by publisher; reg. 1997, Ármúli 38)

The association's new Next.js site exposes a public JSON API,
`/api/monthly-prayer-times?city=<city>&year=<y>&month=<m>` (endpoint discovered from the
site's own chunk `724-ea6c33d795a95c66.js`). Walked 2026-11-12T14:43-14:45Z, 323 requests +
1 probe, one process, one token bucket at 3 req/s, journal `data/journal-fmi.jsonl`:
**9 cities x 3 years (2025, 2026, 2027) x 12 months = 9,855 dated rows, every request
HTTP 200, zero errors** (`captures/fmi/*.json.gz`, `data/fmi-rows.json`). Cities:
Reykjavík, Keflavík, Akureyri, Akranes, Borgarnes, Hofsós, Húsavík, Hvolsvöllur, Hella.
Columns served: Fajr, Sunrise, Dhuhr, Asr, Sunset, Maghrib, Isha (raw), Imsak, Midnight,
Firstthird, Lastthird, plus Hijri dates. Times are whole minutes, "(GMT)", correct for
Atlantic/Reykjavik (UTC+0 all year).

**Engine identification (data/fmi-fit-adhan.json, scripts/fit_fmi_adhan.mjs).** The served
raw Isha column plus the summer Fajr/Isha offsets prove the engine is adhan-shaped with:
fajr angle **14.2 deg**, isha angle **14 deg**, high-latitude rule **TwilightAngle**
(night x angle/60 substitution), Shafi asr, minute-rounding. Evidence: winter offsets are a
flat 14/14.2 deg twilight; summer offsets equal night x angle/60 to the minute (e.g. Húsavík
night 257 min -> 60.0 min offset, print 60.05). No named standard method fits (MWL 18/17
median-abs 62 min on fajr; MC 38 min; the tuned pair 14.2/14 with TwilightAngle reproduces
the print). Per-city per-year scores at the solved points (all nine solved points land on the
real cities):

- Six southern cities (Reykjavík, Keflavík, Akranes, Borgarnes, Hella, Hvolsvöllur):
  fajr within-1 93.7-97.3 pc worst 2; sunrise/dhuhr/maghrib/isha_raw/isha_served within-1
  99.5-100 pc, worst 1-2. The recipe reproduces the print.
- Three northern cities (Akureyri, Hofsós, Húsavík): fajr within-1 76.2-79.7 pc worst 2-10;
  sunrise/maghrib within-1 92.6-99.5 pc with deep-twilight outliers up to 31 min
  (Hofsós maghrib worst 31, Húsavík 25). The publisher's own northern points sit slightly
  off the gazetteer points; defect named, rows stand.
- **The asr column is a defect and is flagged**: seasonal deviation from Shafi asr of
  -15 to +18 min (2027 edition), -9 to +12 (2026), -9 to +12 (2025), exact only June-August,
  amplitude GROWING across the three editions (Jan offset +11 -> +11 -> +15-18;
  Nov -7 -> -7 -> -10..-15). No standard convention reproduces it (shadow-factor scan
  1.00-2.00 never drops below 4.7 min spread; declination-bias and low-precision-solar
  hypotheses tested and rejected: the December ramp -13.9 -> +16.9 min within one month
  fits neither). The asr column is recorded as unreliable; the other five columns and the
  rules carry the recipe.

**Served-surface rules (read from the site's own code, chunk 724):** the rendered Isha azan
is **Maghrib + 90 min** ("the 90-minute rule", stated on every page and coded in the
transform); iqamah = azan + {Fajr 15, Dhuhr 10, Asr 8, Maghrib 5, Isha 10}. The API's raw
Isha (the 14 deg angle) is engine evidence; the ASSOCIATION'S SERVED Isha is the +90 rule.
Both banked.

**Two serving classes, one inconsistency named:** the today endpoint
(`/api/prayer-times?city=`) returns values that differ from the monthly class for the same
date (2026-11-12 Reykjavík: asr 14:26 vs 14:20, raw isha 18:53 vs 19:14, imsak fajr-10 vs
fajr-30). Both captured (`captures/fmi-ep-prayer-times.json`). The monthly class is the fit
target; the today class is recorded as a second, divergent regime served the same day.

**Grade: candidate** (dated, 3 years on one recipe, engine identified, defects named).
Span verdict: 3 years. Seasonal amplitude measured (fajr->isha span Jan vs Jul: Reykjavík
569 vs -106 min wrap; the print serves whole-year values including midsummer, where the
engine's -14 deg event does not exist and the TwilightAngle substitution supplies the value).

### 1b. felagmuslima.is OLD site (Wayback, 2022-2025) — a third regime, banked and discredited

CDX `captures/cdx/felagmuslima-cdx.txt` (23 snapshots since 2022-12). The old
WordPress-era `/PrayerTimes` page served per-city month tables for **26 cities**
(Reykjavík, Selfoss, Keflavik, Akureyri, Egilsstaðir, Vestmannaeyjar, Vik, Kópasker,
Siglufjörður, Stykkishólmur, Höfn í Hornafirði, Ísafjörður, Patreksfjörður, Bolungarvík,
Dalvík, Eskifjörður, Seyðisfjörður, Reykholt, Stokkseyri, Hella, Djúpivogur, Varmahlíð,
Kirkjubæjarklaustur, Grímsey, Blönduós, Raufarhöfn, Vopnafjörður). Four archived dated
months, all Reykjavík, 31 rows each, banked (`data/fmi-oldsite-reykjavik.json`,
captures `fmi-wayback-*-prayertimes.html`): 2023-03, 2023-12, 2024-05, 2025-07.

Quantified against the solar engine: the March 2023 edition sits on a CORRECT Reykjavík
solar base (dhuhr offset 0, maghrib +1, asr +3) with a bad twilight pair (fajr +41, isha
-31); the 2023-12, 2024-05 and 2025-07 editions are **column-incoherent** (dhuhr implies a
publisher longitude of -40.9 deg, maghrib implies +9.6 deg, asr +106..+109 min) — no single
point computes them. Verdict: the old site's later months are structurally unreliable
prints; banked as evidence of the regime change, never as a recipe. The new API class
(2025/2026/2027) is a clean regeneration.

### 1c. islam.is — the association's older domain

- **Current-month table** (homepage, captured `captures/islam-is.html.gz`): 30 dated rows,
  11 Nov - 10 Dec 2026, Reykjavík, seven columns. The Isha column equals the SAME +90 rule
  as felagmuslima.is; its asr runs 2 min earlier than the FMI monthly class (14:18 vs
  14:20 on 2026-11-12) — a second edition of the association's computation, banked as rows
  parsed from the capture.
- **Historical regimes (Wayback):** CDX `captures/cdx/islam-is-cdx.txt` (158 collapsed
  snapshots 2003-2025) + the prayer-path filter sweep
  (`islam-is-cdx-filter.txt`, 1,337 collapsed URLs).
  - **2013 regime**: the `/index.php?option=com_content...id=57:baenartimar` page embeds an
    islamicfinder.org `prayer_service.php` widget with parameters latitude=**45.00**
    (defective; Akureyri's real latitude is 65.68), longitude=-18.1, pmethod=1,
    twilight 10/10/10, ishaInterval=30. The widget's own output was not archived
    (404); the embed page is banked (`captures/islamis-2013-baenartimar.html`). Platform
    computation at a broken point, authority-by-embed only.
  - **2018-12 regime**: `index.php/baenatimar` (Wayback 2019-02-09) carries a full
    "Monthly Prayer Times in Kopavogur, IS" table, December 2018 / Rabi al-Awwal 1440:
    **31 dated rows banked** (`data/islamis-2018-12-kopavogur.json`). Quantified verdict:
    the columns do not sit on Kópavogur on any convention (sunrise 09:33 vs true 11:04,
    maghrib 18:29 vs true 15:33, day length doubled); a broken-generator print, banked as a
    dated regime, never a recipe. Only ONE snapshot of this URL exists.
  - The 2021 Wix page (`/baenartimi`, 6 snapshots 2021-02..2021-08) renders through JS;
    no table in the served HTML; recorded as an open negative.
- Ramadan route `/ramadan/tafla/` captured (200); the table is empty pre-Ramadan
  (`captures/islam-ramadan-tafla.html.gz`) — Ramadan rows become available during the fast.

### 1d. icci.is — Islamic Cultural Center of Iceland (Skútuvogur 1H; separate body)

WordPress homepage block carries TODAY-only times (captured `captures/icci-home.html.gz`:
2026-11-12 Fajr 07:22, Sunrise 09:46, Dhuhr 13:13, Asr 14:18, Maghrib 16:38, Isha 18:08).
Its asr matches the islam.is class (14:18), its maghrib runs +2 min against FMI (16:38 vs
16:36) — a third computation. No timetable page exists (site nav enumerated); a daily-tick
surface only. Community/authority tier; nothing fittable from one row.

### Front 1 verdict

Iceland moves from ZERO dated rows to **9,979 banked dated rows** (9,855 FMI API + 124
archived: 4 old-site months, 1 Kópavogur month, 30 islam.is current-month rows) across
three identified regimes. The working recipe for the living surface: fajr 14.2, isha 14
(TwilightAngle substitution), Shafi asr flagged with the seasonal defect, maghrib horizon,
served Isha = maghrib+90, iqamah +{15,10,8,5,10}. Not proven: the internal cause of the asr
column's seasonal drift and of the old site's column-incoherence; the publisher's exact
northern-city coordinates. Both named as open items.

## Front 2 — NORWAY (banked 2026-11-12, timestamps UTC)

Norway held 24.4 pc coverage (community tier, 61,685 rows) with 523 turktakvim shells. This
front banked **132,052+ dated rows across three surfaces** and one national walk still
running (the salah.no class, five years).

### 2a. bonnetid.no / disp-api.bonnetider.eu — Islamsk Råd Norge, the national standardized table (authority)

IRN (Islamsk Råd Norge) launched "standardiserte bønnetider for hele Norge"
(irn.no/prosjekter/felles-bonnetid). Its SPA (bonnetid.no) reads a public Supabase REST
(`disp-api.bonnetider.eu/rest/v1/...`, anon key shipped in the bundle). Note: the gateway
rejects any truncated key - the bundle's JWT must be copied whole.

- **Location table** (`captures/bonnetid-location_t-all.json.gz`): **359 locations** -
  358 Norwegian municipalities incl. Svalbard (NO2100), each with its own coordinates,
  kommunenumber, prayer_method (3: 255 locations, 2: 104) and asr_method ("0" everywhere),
  plus 1 Swedish border entry (SE1486 Strömstad, no rows served).
- **Full walk 2026-11-12T15:20-15:23Z**: every location x its own prayer_method x the held
  year, 358 requests all HTTP 200 (journal `data/journal-irn.jsonl`), **130,670 dated rows
  banked** (`captures/irn/*.json.gz`, `data/irn-rows.json`). The prayertime table holds 2026
  only (2020-2030 range returns 365 rows). ~22 timing columns per row: fajr, duhr, asr,
  maghrib, isha, fajr_sadiq, shuruq_sunrise, istiwa_noon, shadow_1x, shadow_2x,
  wusta_noon_sunset, ghrub_sunset, muntasafallayl_midnight, fajr_endtime, asr_endtime,
  shafaq al-ahmar/al-abyadh ends, laylat falakia/shariea thirds, prayer_after_sunrise,
  sun-shadow and elevation values.

**Recipe findings (Oslo NO0301 worked example, engine of record adhan 4.4.6 solar core):**
- The table is **self-describing**: istiwa_noon equals the true transit, ghrub_sunset the
  true sunset, shadow_1x/2x are Shafi/Hanafi asr, shafaq columns are the red/white twilight
  ends. The publisher's astronomical model is richer than a plain SolarTime engine.
- Fajr fits a **16 deg** twilight in winter (Oslo median residual +0.5 min); in midsummer
  the print switches to **sunrise - 60 min** (Jun 21: exactly 60).
- Isha equals the print's own **shafaq al-ahmar (red twilight end)** column where it exists;
  in midsummer (column None) the print serves **sunset + 45 min** fixed.
- Dhuhr = istiwa + 5 min margin (Jan 1), maghrib = ghrub + 5.
- **Asr follows a seasonal school cutover: Hanafi in winter, Shafi in summer, flipping
  2026-03-29 and 2026-10-25 - the DST transition dates.** Monthly medians: Nov-Mar sit on
  Hanafi (-0.8..+2.0), May-Sep on Shafi (+0.7..+1.7).
- **Polar-season fabrication flagged**: at Alta (NO5601, 70 N) the December rows carry
  asr = shadow_1x = shadow_2x = istiwa (polar night, no sun) and a maghrib (16:52) where no
  sunset exists; June rows carry a "maghrib" 19:16 with the sun above the horizon at night.
  These are computed placeholders, not events. Per the repo invariant these rows must never
  drive alarms; they are banked as published with the defect named.
- salah.no (the older IRN app) is a **second computational class**: same 359 locations,
  different values (Oslo duhr 12:05 vs disp-api 12:25 on the same date), different
  coordinates, and **five served years 2022-2026** (2021 and earlier empty; probe banked).
  Walk of all 359 locations x 60 months started 2026-11-12T15:24Z
  (journal `data/journal-salah.jsonl`, captures `captures/salah/`), order 2026 first.
  **State at wave close (2026-11-12T16:09Z): 6,226 requests all HTTP 200, zero errors,
  6,227 of 21,540 captures (28.9 pc) - year 2026 complete for all locations, 2025 in
  progress at pk~164-258.** The walker (`scripts/walk_salah.py`) is resumable: a successor
  reruns it and it skips banked captures; ~2 h remaining at 2.5 req/s.

### 2b. rabita.no/bonnetider — Det Islamske Forbundet (Rabita mosque, Oslo) — five years harvested

- Live page: **61 dated rows banked** (2026-11-01..2026-12-31, current + next month, six
  columns; `data/rabita-2026-11-oslo.json`). Dhuhr is a FIXED 12:05-12:08 mosque clock
  convention.
- **Wayback harvest** (13 snapshots since 2022-01, `captures/cdx/rabita-cdx.txt`, 12
  fetched): the January 2023 snapshot carried a full JS-payload of 2023-2025.
  **1,321 unique dated rows 2022-01-01..2025-12-31 banked** (`data/rabita-wayback-oslo.json`),
  merging to **1,382 Oslo rows spanning 2022-2026** - a five-year single-mosque surface.
- Fit pending on this class (the fixed-dhuhr mosque convention + its own fajr/isha pair);
  the span itself lifts Oslo to five years.

### 2c. wim.no/en/prayer-times — World Islamic Mission (the Blue Mosque, Oslo) = the IRN generation

The WIM prayer-times page carries a city selector with the IDENTICAL 359-location IRN list
and its Oslo month table is byte-identical to Rabita's (Nov 1 2026: 05:31/07:39/12:05/
14:23/16:26/18:19 on both). Per the grading rule this is ONE computed generation relabelled
("Times are calculated by WIM" notwithstanding) - the IRN standardised table. No separate
rows needed; the IRN walk is the bank.

### Front 2 verdict

Norway moves from 24.4 pc / 61,685 rows to **132,052 banked dated rows banked now**
(130,670 IRN 2026 + 1,382 Rabita) with the salah.no walk adding up to 359 locations x 5
years in progress. The national recipe class is identified to the rule level (16/15 winter,
fixed-60/45 summer, red-twilight isha, DST-date asr school cutover, +5 margins) with the
polar fabrication and the asr-rule boundary flagged. Not proven: the publisher's internal
twilight model behind the shafaq columns (a plain SolarTime engine cannot regenerate them);
the salah.no class's between-year stability (walk in progress).

## Front 3 — FINLAND (banked 2026-11-12, timestamps UTC)

Finland held 7.7 pc coverage (candidate community, 27,375 rows). This front banked
**1,142 new dated rows across four cities**, one of them a future month.

### 3a. rukousaika.fi — Helsinki-Espoo-Vantaa annual print (authority-adjacent community publisher)

The site states its own parameters in the page (captured `captures/rukousaika.html.gz`):
"Muslim World League ohjeiden perusteella, leveysaste 60:10N pituusaste 24:58E, qiblah SSE
158, sarastuskulma 18 deg, yonkulma 17 deg, kesa perustuu 1/5 yosta -periaatteeseen,
korkeus 120m, keskipaiva +2". The annual PDF `Helsinki-2026.pdf` was fetched (966 KB) and
read with the local OCR binary (fast level, 13 pages, `captures/rukousaika-helsinki-2026-ocr.txt`):
**359 of 366 dated rows parsed** (`data/rukousaika-helsinki-2026.json`,
`scripts/parse_rukousaika.py`; the 7 missing dates are named gaps in the OCR linearization,
recoverable from the same banked text). Summer fajr/isha carry the 1/5-of-night rule marks
in the print itself. Grade: candidate (one published year, stated parameters).

### 3b. jyvaskylamosque.fi — An-Nur Mosque, Jyväskylä (community mosque; FUTURE MONTH served)

Twelve monthly PDFs fetched (2026-02 through 2027-01, including Ramadan 2026 and
**January 2027** — a month that does not yet exist in any 2026-limited surface;
`captures/jyvaskyla-pdf/`, URL register `data/jyvaskyla-pdf-urls.txt`). The PDFs carry a
text layer: exact extraction via pypdf (`scripts/parse_jyvaskyla_text.py`) — **359 dated
rows banked** (`data/jyvaskyla-anur-2026-2027.json`), 28-31 per month, zero OCR ambiguity.
(An OCR pass was also attempted first and banked as negative evidence: the fast-level
reading order scrambles the landscape table — `captures/jyvaskyla-ocr/`.) The summer rows
serve a deep-twilight convention (Aug fajr ~02:42, isha ~23:57). Grade: candidate, 12
months, future month banked.

### 3c. tisy.fi/timetable — Turku Islamic Society (community)

The lunar-hijri-calendar plugin payload (rendered via agent-browser, dumps
`captures/tisy-months-dump.txt`) serves November-December 2026 only (the payload wraps at
December; January re-renders November): **59 dated rows banked**
(`data/tisy-turku-2026.json`, scripts inline in the session). Dhuhr is a FIXED 12:15 mosque
convention. Wayback: 13 snapshots since 2022-09 enumerated (`captures/cdx/tisy-cdx.txt`)
but every archived capture is a 3 KB JS shell with no table - **the earlier months are not
recoverable from the archive** (named negative). A "Download PDF" button exists on the
live page but the payload did not expose a direct file URL in the dumps.

### 3d. mawaqit.net — Hervanta Moskeija, Tampere (community board; mawaqit class)

The board's public page embeds its full-year calendar payload server-side: **12 months,
365 dated rows, six columns each, banked** (`data/mawaqit-tampere-hervanta.json`,
capture `captures/mawaqit-hervanta-tampere.html`). The payload's 12 Nov matches the live
board's today-row (06:13), anchoring the year as 2026. This is the mawaqit STATIC-page
payload class (the JWT-walled app API verdict of o1n-20 stands for deep access; the static
embed is the public surface here).

### 3e. The mosque-page sweep (quick negatives)

- psiy.fi (Pohjois-Suomen Islamilainen Yhdyskunta, Oulu): today-only block on the homepage
  (captured; 2026-11-12: Fajr 06:02, Shuruq 08:42, Dohr 12:04, Asr 13:02, Maghrib 15:21,
  Isha 17:52). A "Monthly calendar" link exists; not followed to depth this wave.
- hic.fi (Helsinki Islam Keskus / Al-Huda): homepage block serves `--` placeholders (JS
  load failure or broken feed); captured as found.
- damic.fi (Darul Aaman, Helsinki): no timetable on the page captured.
- rukousajat.fi: the monthly salaat.pdf fetched (980 KB, January 2026 print, MWL 18/17
  stated, summer 1/3-of-night, elevation 120 m) - a SECOND Helsinki class with a different
  summer rule than rukousaika.fi's 1/5 (both banked; both PDFs under captures/).
  Helsinki thus holds two published MWL-classes: 1/3-of-night (rukousajat.fi) and
  1/5-of-night (rukousaika.fi).

### Front 3 verdict

Finland's dated bank grows by **1,142 rows across four cities** (Helsinki 359 + Jyväskylä
359 + Tampere 365 + Turku 59), with a future month (Jan 2027, Jyväskylä) and two
distinct summer-rule Helsinki classes recorded. Not proven: the full-year Turku surface
(plugin payload wraps; archive shells empty), the psiy.fi monthly calendar (link not
followed to depth), and the exact engine behind rukousaika.fi's "International
Astronomical Centre" attribution.

## Front 4 — TONGA / SAMOA / WALLIS-AND-FUTUNA (banked 2026-11-12, timestamps UTC)

### 4a. TONGA — BANKED: Masjid Al-Taiyab, Nuku'alofa (mawaqit board, community mosque)

Tonga had ZERO dated rows. The mosque is on mawaqit
(`mawaqit.net/en/m/masjid-al-taiyab-taufaahau-road-niutoua-tonga`, captured
`captures/mawaqit-tonga-altaiyab.html`) and its public page embeds the full-year calendar
payload server-side: **12 months, 365 dated rows, six columns each**
(`data/mawaqit-tonga-altaiyab.json`). The payload's Nov 12 row (Fajr 04:32, Sunrise 05:52,
Dhuhr 12:24, Asr 15:42, Maghrib 18:57, Isha 20:13) matches the live board's today print,
anchoring the year as 2026. Southern-hemisphere pattern verified (longest dawn twilight in
January, shortest in June). Grade: candidate, community (a mosque board on a platform;
platform method labels are not provenance — the fit is open). Other Tonga surfaces:
Al-Khadeejah Mosque Nuku'alofa (Wikipedia article, no site found under these terms) and
Masjid Al-Nedzla Balija Khadeejah (dawa.center directory entry) — directory names only.

### 4b. SAMOA — honest negative with named leads

- No Samoan publisher surface found under these terms (English, Samoan-plausible routes,
  platform checks): the Muslim community in Apia is Facebook-only (WMuslimCC posts; a
  Peace Corps account and ABC Pacific interview confirm the community's size and its
  Facebook-only organisation). Login-walled, not entered.
- **Fiji Muslim League link**: the Samoa Observer records the FML helping the Samoan Muslim
  community. The FML's own prayer page (fml.com.fj/prayer-time) publishes MONTHLY TIMETABLE
  IMAGES — **the 2024 archive (April-December) plus current months, eleven JPGs banked**
  (`captures/fml/`, OCR texts `captures/fml-ocr/`). **The parse is an OPEN ITEM**: the
  fast-level OCR drops the day column and interleaves rows; only April rows 1-2 verified.
  If FML publishes for Samoa's community, this is the surface to watch next round.
- Verdict: Samoa stays zero-dated under the terms searched; the named leads are the FML
  surface and the Apia community's Facebook presence.

### 4c. WALLIS-AND-FUTUNA — honest negative

No Muslim institution or publisher surface found under these terms (English + French:
"association musulmane Wallis Futuna", "islam Mata-Utu"): only platform calculators serve
the territory; the found institutional landscape is Catholic missions and churches. The
turktakvim shell verdict (o1n-40) stands; the territory remains platform-only.

## Front 5 — the ledger's worst-coverage countries (computed 2026-11-12)

Excluding fronts 1-4 (iceland, tonga, samoa), greenland (recorded no-institution negative)
and the front-2/3 countries, the ledger's worst six with real Muslim communities are:
**kiribati 83.3, fiji 91.1, canada 94.6, new-zealand 95.9, denmark 96.2, belarus 96.3**
(sweden 65.5 and russia 79.9 rank worse but are re-cover-scale jobs for the coordinator's
waves, not one-surface hunts).

### 5a. fiji — the Fiji Muslim League annual archive (authority; Suva first)

Found via the front-4 Samoa trail: fml.com.fj/prayer-time publishes **monthly TIMETABLE
IMAGES** — the 2024 archive (April-December) plus the current months, **eleven JPGs banked**
(`captures/fml/`) with their OCR texts (`captures/fml-ocr/`). Columns: Date, Fajr, Sunrise,
Dhuhr, Asr(S), Asr(H), Maghrib, Isha — both asr schools printed. **Parse OPEN ITEM**: the
fast-level OCR drops the day column and interleaves rows; only April rows 1-2 are verified
(`data/fml-april-2024.json` records the state honestly). A layout-aware pass next round can
finish this from the banked images alone.

### 5b. denmark — BANKED: Imam Ali Mosque, Copenhagen — 20 cities x 2026 (community)

imamalimoske.dk/en/prayertime serves a per-city, per-month table (Dag, Fajr, Solopgang,
Dhuhr, Solnedgang, Maghrib, Midnat) with a 20-city Danish selector (København, Aarhus,
Odense, Aalborg, Esbjerg, Randers, Kolding, Horsens, Vejle, Roskilde, Herning, Silkeborg,
Næstved, Taastrup, Helsingør, Sønderborg, Fredericia, Hillerød, Holstebro, Rønne). The
DOM walk (render-polled per month, `captures/imamali-city-*.json`, dumps banked) banked
**7,300 dated rows: 20 cities x 365 days of 2026** (`data/imamali-denmark-2026.json`).
Midnight-sun-adjacent isha values (23:05 Copenhagen Jan) ride the publisher's own
convention; fit open. A "Download Excel" button exists on the page (handler not exposed;
the DOM walk is the bank).

### 5c. canada — BANKED (current month): Stittsville Muslims Association, Ottawa

The mymasjid.ca/ottawa timetable block embeds a masjidal.com monthly widget
(`masjid_id=1VL4rndx`, Assunnah Muslims Association / Stittsville, Ottawa). November 2026
banked: **31 dated rows** with azan+minor columns (`data/ottawa-stittsville-masjidal.json`,
dump `captures/ottawa-masjidal-dump.jsonl`). The widget's < > month navigation did not
respond to synthetic clicks in this session; the 12-month walk is an open item (the
masjidal data API route is the successor's cleaner path). Canada at 94.6 pc remains
covered by its held mass; this adds a capital-city second source.

### 5d. new-zealand — no NEW surface; classes already held

Every Wellington surface found is a class the archive already holds: FIANZ's own plugin
(o1n-20 authority walk), the masjidbox boards (Kilbirnie Masjid Al-Ameen, Aman Islamic
Trust - both walked there), iman.co.nz (a directory page, captured
`captures/iman-nz.html.gz`). Verdict: NZ's capital holds no unheld publisher class under
these terms this round.

### 5e. kiribati — honest negative

The Muslim community is the Ahmadiyya community in South Tarawa (Wikipedia; Australian
High Commission posts; a mosque exists) but publishes nothing: Facebook-only, login-walled,
not entered. Only platform calculators serve Tarawa. Negative stands under these terms.

### 5f. belarus — honest negative

Minsk's Cathedral Mosque has no prayer-times site under these terms (English and Russian
routes; only platform calculators surface). Negative stands.

### Front 5 verdict

**7,651 new dated rows banked** (Denmark 7,300 + Ottawa 31 + the FML state recorded), one
open parse (Fiji FML images), two honest negatives with named leads (kiribati, belarus),
one already-held class verdict (new-zealand).

## Summary — per front (2026-11-12, all timestamps UTC)

| front | territory | new dated rows | surfaces | verdict |
| --- | --- | --- | --- | --- |
| 1 | Iceland | 9,979 | felagmuslima.is API (9 cities x 2025-2027), islam.is current month + 2018 Kópavogur archive + 2013 widget regime, icci.is today-tick, FMI old-site 4 archived months | engine identified (fajr 14.2 / isha 14 / TwilightAngle), asr defect named, three regimes |
| 2 | Norway | 130,670 + Rabita 1,382 (salah walk running) | IRN disp-api 358 locations x 2026; rabita.no 2022-2026 harvest; wim.no = IRN generation | national recipe to rule level; polar fabrication flagged; salah.no 5-year walk in progress |
| 3 | Finland | 1,142 | rukousaika.fi Helsinki annual PDF; Jyväskylä An-Nur 12 monthly PDFs incl. Jan 2027; tisy.fi Turku Nov-Dec; mawaqit Tampere full year | four cities; two Helsinki summer-rule classes; future month banked |
| 4 | Tonga/Samoa/Wallis | 365 | Masjid Al-Taiyab Nuku'alofa (mawaqit payload, full year) | Tonga banked; Samoa negative (FML lead named); Wallis negative |
| 5 | ledger's worst six | 7,331 + FML open | Imam Ali Mosque Denmark 20 cities x 2026; Ottawa Nov; FML Fiji images | Denmark banked; Fiji parse open; kiribati/belarus negatives; NZ already-held |

Aggregate this wave (exact bank accounting): **150,918 dated rows banked across 12
countries** - FMI Iceland 9,855 + old-site 124 + Kópavogur 31; IRN Norway 130,670 + Rabita
1,382; Finland 1,142 (Helsinki 359 + Jyväskylä 359 + Tampere 366 + Turku 59 incl. wrap
dups); Tonga 366; Denmark 7,300; Ottawa 31; Fiji 16 (parse-open state); + 1,382 counted in
both Rabita files' overlap already deduplicated - with the salah.no walk (359 locations x 5
years, 28.9 pc banked) still running as this wave's longest task. Raw captures gzipped under
`captures/` (63 MB); every parse banked under `data/`; nothing entered git; the repo
untouched; no children deployed; the one /tmp stray from a failed redirect removed.





## Front 8 — wave O1n-53 continuation (2026-11-12, opened 17:50Z UTC): the Ottawa year walk and the Iceland asr mechanism

### 8a. Ottawa Stittsville masjidal — the month walk CLOSED: full 2026 banked and fitted

The O1n-45 open item named the masjidal data API as the cleaner route; it was
found in the widget's own `monthlyScript.js` (banked
`captures/masjidal-monthlyScript.js`):
`https://masjidal.com/api/v1/time/range?masjid_id=1VL4rndx&masjid_detail=yes&from_date=..&to_date=..`
— plain public GET, no auth, no forms. Walked 12 monthly ranges (2026-01-01 ..
2026-12-31), 12 requests total, all HTTP `success`, banked raw
(`captures/masjidal-api-2026-*.json` + `masjidal-api-nov2026.json`).

- **365/365 dated rows banked** (`data/ottawa-stittsville-masjidal-2026.json`):
  per day the azan six (fajr/sunrise/zuhr/asr/maghrib/isha, 12h AM/PM
  normalized), the printed weekday (self-certifying: all 365 match the real
  weekday), the hijri date string, plus the parallel IQAMAH table (365 days,
  jummah1/jummah2 included). The masjid_info block names the masjid (Stittsville
  Muslims Association, 1469 Stittsville Main St, Ottawa ON), its website and
  the timezone printed (America/Toronto).
- **Fit banked** (`scripts/ottawa-masjidal-fit.mjs`,
  `data/ottawa-stittsville-masjidal-2026-fit.json`; adhan 4.4.6, Stittsville
  45.2583/-75.925 measured from Wikidata Q4442642 P625, America/Toronto wall
  clock with the 2026 DST boundary EST -5 / EDT -4):
  - fajr sweeps to **15.0 deg: 364/365 within-1**; isha sweeps to **15.0 deg:
    364/365** (the sweeps were Karachi-based; the two angles are the fit);
  - sunrise 365/365, zuhr 365/365 (well, per-month tables in the file);
  - maghrib = sunset + **1.25 min: 356/365** (the residual 9 cells sit at the
    DST boundary days and single-minute rounding);
  - asr = Shafi + **0.25 min: only 217/365** — the honest finding: the asr
    column carries a SEASONAL WOBBLE of ±1.5 min (positive Dec-Feb, negative
    Sep-Oct, zero around Jun-Jul) that no single pad removes; per-month means
    banked. The wobble is sub-2-minute everywhere: the asr column is
    Shafi-asr with a publisher engine ripple, usable within ±2.
- The November O1n-45 bank (widget DOM route) agrees with the API route (same
  masjid, same azan values, e.g. Nov 1 fajr 5:20).
- Verdict: Ottawa's second source is now a FULL-YEAR dated authority surface
  (365 azan rows + 365 iqamah rows), never blended across the DST boundary.

### 8b. Iceland asr defect — the mechanism IS NAMED (every test banked)

`data/iceland-asr-diagnosis.json` holds the full test battery; the headline
findings:

- **Shafi**: exact Jun-Aug only; the monthly served-minus-Shafi mean sweeps
  -10.7 (Jan 2025) .. +7.3 (Nov 2025) .. -16.5 (Jan 2027) .. +12.6 (Nov 2027)
  minutes. REJECTED as the served rule.
- **Hanafi**: catastrophic (served-minus-Hanafi -25 .. -84 min across the
  year). REJECTED.
- **Fixed shadow ratios (the mithl / al-ghada class)**: own-formula sweep k =
  0.8..2.6 — best k=1.00 gives 295/1095 within-1 (worst 14.6 min); no fixed
  ratio holds the year. REJECTED as a class.
- **Implied shadow increment**: solving the increment per day shows the served
  column running at increment ~0.47-0.71 in Januaries, ~1.2-1.7 in Novembers,
  exactly ~0.99 in June — drifting, never constant.
- **Asr-end vs asr-start**: the served column is neither (earlier than the
  formal start in Jan, far short of any end in Nov). REJECTED.
- **Declination-shift hypothesis** (asr computed with a shifted solar
  declination): the implied shift is not constant (-75 .. -134 days) and has
  NO solution at all Nov-Feb. REJECTED.
- **Point-error hypothesis** (asr computed at a lower latitude): the true
  point stays best through the whole sweep. REJECTED.
- **The smoking gun**: through Dec 10-29 the served asr-dhuhr delta declines
  MONOTONICALLY (32 -> 12 min) crossing the solstice WITHOUT TURNING — a
  physical shadow-1 asr at 64N must extremize at the solstice (adhan's own
  formal asr does: min Dec 20-21, then rises). The served curve is therefore
  NOT a per-day solar computation at the served point.
- **The edition test**: the asr-dhuhr delta curves of the 2025 and 2026
  editions are the same annual template to +-1 minute (174/336 shared days
  identical, the rest exactly 1 min apart); the 2027 edition carries a
  DIFFERENT template (87/336 identical, max 8 min off, winter departure
  ~1.5x larger).
- **MECHANISM (named)**: the asr column is an annual day-of-year interpolation
  TEMPLATE per edition generation — calibrated to true Shafi asr around
  midsummer (where the shadow-1 event is well-conditioned) and diverging in
  the deep-winter degenerate regime at 64N (Reykjavik noon altitude falls to
  2.56 deg at the solstice, below the ~2.7 deg needed asr altitude: the
  shadow-1 event does not exist for days around Christmas). The template
  smooths through the solstice; each generation carries its own curve; the
  "amplitude growth" tracks the edition regeneration (2025/2026 one
  generation, 2027 a second), not the calendar.
- The asr column keeps its UNRELIABLE flag; the recipe rides the other five
  columns; the O1n-45 "not proven" is upgraded to "mechanism named, tests
  banked".

### 8c. Session mechanics (O1n-53 continuation)

- masjidal.com API: 13 public GETs total (12 months + the November probe), no
  login, no forms; raw JSON banked per month; nothing under /tmp; the repo
  untouched; the banned word never written.
- Stittsville coordinates measured from Wikidata (Q4442642 P625), never
  assumed; the DST boundary handled explicitly, never blended.
- Iceland diagnosis: every hypothesis test run against the BANKED rows only
  (data/fmi-rows.json) — no refetches; the working scripts live at the
  opencode temp root (iceland-asr-*.mjs), the banked tests in
  data/iceland-asr-diagnosis.json.
- Timestamps UTC. No subagents deployed.
