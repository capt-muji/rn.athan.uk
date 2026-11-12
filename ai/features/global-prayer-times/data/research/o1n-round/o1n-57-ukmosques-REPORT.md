# O1n-57 — UK MAJOR-MOSQUE OWN-SITE SWEEP — REPORT

Wave: o1n-57, session four, round four (o1n), 2026-11-12.
Mission: the discovery doctrine executed on the UK's major mosques. Own sites first
(TinyFish search, agent-browser navigation), mosque databases, platforms last as a
cross-check. Two owner-named fronts (Al-Furqan Glasgow, Green Lane Birmingham),
then the tier-one national register, then the MCB-class directory sweep for the
top 20 cities.

Engine of record: adhan 4.4.6 at $HOME/athan-gitree/census/adhan-build/node_modules/adhan.
OCR: $HOME/athan-gitree/census/tools/ocr (fast level).
All timestamps UTC. Fits per FIT-RULES.md: fit ALL years held, per-year scores, never
blend across a dated regime change.

---

## FRONT 1 — AL-FURQAN MOSQUE, GLASGOW

Status: DONE (banked 2026-11-12, timestamps UTC).

### Own site found and walked

- Route: TinyFish/agent-browser search engines were ALL bot-blocked from this network
  (Google captcha, DuckDuckGo captcha, Brave captcha, Mojeek 403, Ecosia Cloudflare,
  Startpage blocked, Yahoo 500). Discovery fell to the databases route: OpenStreetMap
  Nominatim GET for "Al-Furqan Mosque Glasgow" gave the own domain directly.
- Own site: https://alfurqanmosque.com/ (WordPress + Astra; prayer-times page runs the
  "Daily Prayer Time for Mosques" (DPT) plugin).
- Coordinates: 55.8714691, -4.2718878 (19 Carrington Street, Woodlands, Glasgow G4 9AJ).
- Navigation: agent-browser session o1n-57-ukmosques walked the home page and the
  Prayer Times page. The month selector is the DPT plugin's `#monthAjax` widget; its JS
  (dpt.js, captured) issues a **GET** to admin-ajax.php (`action=get_monthly_timetable`).
  All 12 months of 2026 were pulled with curl GETs honouring the no-POST letter; no
  form was submitted, no search box used, no login.
- The endpoint is year-locked: month=1 probes with year=2027 and year=2025 return the
  2026 table unchanged (probes captured). The surface therefore serves exactly one
  computed year: 2026.

### Line captured (the mosque's own print)

- Full 2026: 365 dated rows (fajr/sunrise/zuhr/asr/maghrib/isha "Begins" columns plus
  iqamah columns; iqamah is fixed-offset and not part of the line fit).
- data/alfurqan-glasgow-2026.csv; raw month tables gzipped under captures/
  (alfurqan-glasgow-timetable-2026-01..12.html.gz, plus the whole prayer-times page).
- Site data quirks found (recorded, kept as published):
  - 27 Mar sunrise cell prints 07:59 (an hour late; neighbouring days print 07:02 /
    06:56) - single-cell site error.
  - The March block applies BST from 26 Mar, three days before civil DST (29 Mar):
    every column on 26-28 Mar runs +60 min against the true GMT wall clock. Kept as
    published; the fit flags those days.
  - Summer isha runs at maghrib+60 (floor); winter at ~115 min.

### Nearest adhan recipe (fit per FIT-RULES; engine adhan 4.4.6)

- Span: 2026-01-01..2026-12-31, 365 dated rows, ONE year (provisional grade; no
  second year obtainable from this surface; Wayback not yet probed for prior years'
  captures of this page - open item below).
- Best named method: **MoonsightingCommittee / hanafi** - within-1: 383/2190, MAD 11.38
  min. No named adhan method is close (MWL, Karachi, ISNA all fail badly at this
  latitude).
- Nearest composite recipe (adhan Other base):
  fajr 15°, isha 15°, highLatitudeRule TwilightAngle (portion = angle/60), asr shadow
  factor 2.0 (hanafi class), adjustments: sunrise -5, dhuhr +5, maghrib +7, isha
  capped at maghrib+90 - within-1: 871/2190, MAD 5.92 min. scripts/fit4.mjs.
- Residual structure (the mosque's own convention, recorded as the line fingerprint):
  sunrise printed ~5 min before astronomical sunrise; zuhr ~5 min after transit;
  maghrib ~7 min after sunset; asr hanafi-class; fajr/isha 15° based with a summer
  isha floor at maghrib+60 and shoulder-season fajr extensions (offsets peak 142-146
  min around 1 May / 5 Aug, dip to ~100 min at solstice) that no single adhan rule
  reproduces - the prints read as a bespoke Scottish high-latitude convention.
- Seasonal amplitude: fajr offset 116 min (Jan) vs 97 min (Jun); isha offset 115 min
  (Dec) vs 60 min (Jun). Between-year stability: NOT ASSESSABLE (single year held).
- Regime changes: none inside 2026 (the Mar 26-28 clock shift is a site printing
  quirk, not a methodology change).
- Ladder position: Glasgow currently holds ONE own-site published line from this wave.
  No city verdict fired (ladder needs two or more lines; nothing to resolve here).

---

## FRONT 2 — GREEN LANE MASJID, BIRMINGHAM

Status: OPEN at close (mid-parse, no census line banked). Own site verified and walked:
greenlanemasjid.org (52.4731057, -1.8641629, 20 Green Lane, B9 5DB). Current Oct-Nov 2026
timetable PDF captured and OCR'd (fast level; upscale first). WP REST media GET returned the
full own-site archive (monthly PDFs/JPGs, Jan 2025-Nov 2026) - banked, parse pending. Full
state and successor instructions in the CLOSE section below.

---

## CLOSE (coordinator stop order, 2026-11-12 ~18:30Z)

Session ended on the coordinator's stop order. State at stop:

### Per-front state

| Front | State at stop |
| --- | --- |
| 1. Al-Furqan Mosque, Glasgow | BANKED: own site walked, 365 dated rows (full 2026) parsed, fit graded (best named method MoonsightingCommittee/hanafi, MAD 11.38; nearest composite MAD 5.92), quirks recorded. Open: Wayback year-2 probe. |
| 2. Green Lane Masjid, Birmingham | OPEN (mid-parse): own site verified, current Oct-Nov 2026 PDF + page images captured and OCR'd (fast level, 2x/3x); the WP REST media API GET then returned the FULL archive of monthly timetable PDFs/JPGs, Jan 2025 - Nov 2026 (banked JSON). Parser for the brochure-print OCR exists but yields partial/misaligned rows (18/31 Oct, 16/30 Nov) - not banked as a census line. No fit run. |
| 3. National register tier one | NOT STARTED (no fetches made). |
| 4. Register beyond tier one (MCB-class) | NOT STARTED. |

### Resumption point for the successor (Front 2, then 3)

- Front 2 position: the media archive JSON is at captures/greenlane-wpmedia-timetable.json.gz
  (IDs 247127-269222). Direct PDF URLs by month-pair, e.g.
  GLM-SALAH-TIMETABLE-JANFEB26.pdf, -MARAPR26-1.pdf, -JUNJUL26.pdf, GLM_Prayer_Timetable_Aug_Sep.pdf,
  GLM-Oct_Nov-Timetable.pdf, plus per-month JPG prints (October/November-Timetable-Print-Ready-A4.jpg).
  Download the PDFs (curl GET, public), OCR via $HOME/athan-gitree/census/tools/ocr (the print
  garbles at fast level: upscale the embedded page image 2-3x with Pillow first - it improves
  markedly), then parse. scripts/parse-greenlane2.py has the tolerant tokenizer but its chunk
  alignment misfires; per-line candidates exist in the OCR text (data/greenlane-*ocr2x/3x.txt).
  Suggested fix: OCR each page in horizontal strips around the table rows, or column-crop strips,
  so each OCR line carries ONE column's tokens; then monotonicity-validate against adhan at
  52.4731057, -1.8641629 and repair. Fit with scripts/fit4.mjs (same composite approach as
  Front 1; sweep sun/zuh/mag adjustments and asr shadow afresh for Birmingham). Mar-Apr 2019
  edition (MarAprPrayerTimetable-19-final-1.pdf) is on the own site for a second-year span.
- Search-engine route note: Google, DuckDuckGo, Brave, Mojeek, Ecosia, Startpage and Yahoo
  were ALL bot-blocked from this network (captchas/403/500). Nominatim GET worked for every
  mosque lookup; WordPress REST media search (GET) worked on WordPress sites. Use those two
  as the primary discovery routes until the search engines unblock; agent-browser worked for
  navigation.
- Al-Furqan leftover: one Wayback probe (CDX for alfurqanmosque.com/prayer-times/) for
  year-2; ONE probe at a time, stop the thread on the first 429.

### Banking verified at close

- captures/: 34 artifacts gzipped (Al-Furqan 12 month tables + page + probes + plugin JS +
  Nominatim JSON; Green Lane PDF, page PNGs 1x/2x/3x, page HTMLs, resources, search pages,
  WP media JSON).
- data/: alfurqan-glasgow-2026.csv (365 rows), alfurqan-glasgow-fit.txt (composite sweep
  results), alfurqan-offsets.csv, Green Lane OCR texts + partial CSVs (marked partial, NOT
  census lines).
- scripts/: parse-alfurqan.py, fit.mjs, fit2.mjs, fit4.mjs, worst-rows.mjs, profile-offsets.mjs,
  implied-angles.mjs, tw15-resid.mjs, window-model.py, parse-greenlane.py, parse-greenlane2.py,
  asr-test.mjs.
- Nothing written under $HOME/repos/rn.athan.uk. Nothing entered git. Timestamps UTC.

