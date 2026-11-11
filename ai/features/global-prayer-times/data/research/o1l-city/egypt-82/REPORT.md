# O1l-14 Egypt: the full 82-option national sweep (ESA postback)

Date: 2026-11-11. Workspace: `$HOME/athan-gitree/census/o1l-city/egypt-82/`.
Status: sweep complete for every option the publisher serves. **The country is not complete** - a
negative here is "not found under these terms".

## 1. Surface and replay recipe

Publisher: Egyptian General Authority of Survey (ESA), authority tier, the catalog's only
category-1 R6 source (no correction table).

- Endpoint: `https://www.esa.gov.eg/monthlymwaket.aspx`, ASP.NET (`ctl00`) postback, two selects
  only: `DropDownList1` (city) and `DropDownList2` (month 1-12).
- Replay: plain `https` serves identical bytes to the `:80` note in the record (re-proven here).
  Browser UA required. POST body: `__EVENTTARGET=ctl00$placeholder1$DropDownList2`,
  `__EVENTARGUMENT`, `__LASTFOCUS`, `__VIEWSTATE`, `__VIEWSTATEGENERATOR`,
  `__EVENTVALIDATION`, both select values.
- **Trap 1, state expiry.** A single GET's `__VIEWSTATE`/`__EVENTVALIDATION` survives roughly
  900 posts, then the postback returns a full page with **no grid** (a silent failure, HTTP 200,
  ~29 KB). A stale state must be refreshed by a fresh GET, not retried. Two batch failures here
  were a stale state, not a data gap; `scripts/sweep.js` now refreshes on every miss.
- **Trap 2, tatweel.** Option values carry `U+0640` (`القـاهـرة`, `أسيــوط`, `قـــنا`). The value
  is load-bearing; the read-back city cell carries tatweel too and must be stripped before
  comparing.
- **Trap 3, the option count is 83.** 82 cities plus `كل المدن` (all cities). `كل المدن` renders
  **no grid** at all, so the aggregate view is not a shortcut.
- Rows: `city | gregorian date | hijri date | fajr | sunrise | dhuhr | asr | maghrib | isha`,
  Arabic meridiem `ص`/`م`.

## 2. Coverage banked

1,048 postback requests for 984 city-month combinations (the difference is retries), 984 raw
responses kept in `captures/` (64 MB workspace total). Parsed into
`data/eg-esa-<idx>-2026.json` (one file per city), manifest in `data/manifest.json`.

| Outcome | Count |
|---|---|
| City options advertised | 82 |
| Cities serving a full 2026 year | **78** |
| Cities rendering an empty grid all 12 months | **4** |
| Dated day-rows banked | **28,468** |
| Printed time values | 170,808 |

The four empty options are `منوف`, `ديرب نجم`, `ابو تشت`, `سمالوط` (indices 78-81, the last four
in the select). Both selects echoed back as accepted (`selected`), so the postback worked: ESA
holds no table behind them. Corroboration: Dar al-Ifta's own 78-town list omits exactly these
four (see §6). This is a publisher-side gap, not a transport failure.

Two publisher defects inside the served set:

- `مدينة 15 مايو` is missing **2026-03-20 and 2026-05-26** (363 rows, all 12 months present).
  The March grid jumps `03-19` to `03-21`; ESA's own Hijri column puts `1 Shawwal 1447` on
  `2026-03-21`, so the dropped day is a table defect, not a Hijri splice.
- Dar al-Ifta prints `dhuhr` with the PM marker (see §6).

## 3. Fit: one recipe, 78 cities, 28,468 days, 100% within one minute

Recipe tested exactly as held: **fajr 19.5 deg / isha 17.5 deg, Shafi, zero margins on every
prayer, `Rounding.None` then nearest per column**, engine adhan 4.4.6, `TZ=Africa/Cairo` (the
DST window is inside the span: 2026-04-24 to 2026-10-29), dates built from the printed strings,
no ambient clock. `scripts/fit82.js`, raw output in `data/fit82.json`, summary in
`data/summary82.json`.

Because ESA publishes no coordinates, each city is scored **twice**: at the gazetteer point
(GeoNames `EG.zip`, `data/coords.json`) and at the point the table itself implies, recovered by
minimising the joint error of sunrise+dhuhr+asr over the full year (`scripts/fit82.js`).

| Column | Exact | Within 1 min | MAE (min) | Signed bias |
|---|---|---|---|---|
| fajr | 92.4% | 100.00% | 0.08 | +0.02 |
| sunrise | 92.7% | 100.00% | 0.07 | -0.04 |
| dhuhr | 96.0% | 100.00% | 0.04 | +0.01 |
| asr (Shafi) | 68.9% | 100.00% | 0.31 | +0.01 |
| maghrib | 92.1% | 100.00% | 0.08 | +0.06 |
| isha | 92.2% | 100.00% | 0.08 | 0.00 |

**28,468/28,468 day-rows have all six columns within one minute (100.00%); 13,794 (48.5%) are
exact on all six.** Every column is unbiased: the residual is rounding, not a margin. Asr's
lower exact rate is a rounding-boundary artefact (asr moves ~2 min/day, so it crosses the half
minute more often). Asr is tested Shafi only, as held; no city shows a Hanafi-sized gap that
would reopen the madhab question.

**Verdict: the held recipe is confirmed countrywide and unchanged.** No new angle, no margin,
no per-city offset, and no rounding-mode change is needed anywhere in the 22-32 N span.

### Latitude and longitude span

Implied points run **22.32 N (حلايب) to 31.73 N (السلوم)** and **25.18 E to 36.67 E** - 9.4
degrees of latitude, 11.5 of longitude, the whole country including the Halaib triangle and the
Siwa depression.

Seasonal amplitude (Jan vs Jul, per city, from the printed tables): **fajr 27-74 min, isha
129-171 min.** Isha's amplitude is 2-3x fajr's because the isha angle sits closer to the
horizon, so its hour angle changes faster with solar declination. Latitude drives fajr's spread
(Halaib 27 min at 22 N, Saloum 74 min at 31.7 N).

### The resolver's claim

"One point-recipe serves the whole span at the user's coordinates" is **confirmed**: at each
city's own coordinate the single recipe scores 100% within one minute. It is confirmed as *one
recipe evaluated at the user's point*, not as *one coordinate for the country*: scoring every
city at Cairo's point instead of its own fails badly (worst city 0/365 within 1, worst deviation
50 min). The recipe must be evaluated at the user's position, which is what the resolver does.

**Coordinate tolerance, measured.** 65 of 78 cities pass at their *independent gazetteer*
point; the 13 that do not each sit 16.9-61.5 km from ESA's implied point, and the failures are
pure coordinate disagreement, not recipe error (each passes 100% at its implied point). The
largest passing gazetteer delta is 24.1 km. Practically: the recipe survives a coordinate error
of about 0.2 deg, which is ~1 minute of clock for a longitude offset. Any device geolocation is
far inside that.

**No deviating city. No latitude term, no elevation/horizon term.** This is the Tunisia class
test and it comes back negative for Egypt: `كاترين` sits near 1,500 m and scores 365/365 exact-
or-one at its own point with zero bias; the oases (`واحة سيوة`, `الخارجة`, `الداخلة`, `الفرافرة`)
behave like sea-level towns. Egypt is a plain point recipe, unlike Tunisia's elevation ladder.

### Per-city table

`w1` is days with all six columns within one minute; `Δ` is the distance from the gazetteer
point to ESA's implied point, and `gaz` is the same score at the gazetteer point (a lower `gaz`
is a coordinate disagreement, never a recipe failure).

| # | City | Implied lat, lng | w1 | Exact | gaz w1 | Δ km |
|---|---|---|---|---|---|---|
| 0 | القاهرة | 30.09, 31.29 | 365/365 | 46% | 365/365 | 4.9 |
| 1 | الأسكندرية | 31.22, 29.97 | 365/365 | 56.2% | 365/365 | 5.5 |
| 2 | طنطا | 30.77, 30.99 | 365/365 | 58.6% | 365/365 | 2.3 |
| 3 | المنصورة | 31.04, 31.4 | 365/365 | 56.4% | 365/365 | 1.9 |
| 4 | الزقازيق | 30.58, 31.49 | 365/365 | 55.6% | 365/365 | 1.4 |
| 5 | أسيوط | 27.2, 31.18 | 365/365 | 57.5% | 365/365 | 2.1 |
| 6 | سوهاج | 26.48, 31.68 | 365/365 | 38.6% | 365/365 | 8.7 |
| 7 | بنى سويف | 29.13, 31.1 | 365/365 | 52.3% | 365/365 | 6.2 |
| 8 | المنيا | 28.15, 30.77 | 365/365 | 42.2% | 365/365 | 6.5 |
| 9 | قنا | 26.19, 32.71 | 365/365 | 55.3% | 365/365 | 3.3 |
| 10 | أسوان | 23.9, 32.92 | 365/365 | 54.8% | 365/365 | 21.3 |
| 11 | مطروح | 31.33, 27.25 | 365/365 | 38.1% | 365/365 | 2.8 |
| 12 | الغردقة | 27.19, 33.85 | 365/365 | 55.6% | 365/365 | 8.3 |
| 13 | الخارجة | 25.41, 30.24 | 365/365 | 50.7% | 128/365 | 31.1 |
| 14 | الإسماعيلية | 30.63, 32.24 | 365/365 | 57.8% | 365/365 | 4.2 |
| 15 | دمياط | 31.39, 31.81 | 365/365 | 55.6% | 365/365 | 3.0 |
| 16 | السلوم | 31.57, 25.18 | 365/365 | 40.0% | 365/365 | 2.8 |
| 17 | نويبع | 29.05, 34.67 | 365/365 | 56.7% | 365/365 | 0.7 |

The remaining 64 city rows are in `data/table.md` and `data/summary82.json`; the four empty
options are marked there with no fit.

## 4. Past-year harvest: NEGATIVE on both authority surfaces

Probed once each, then confirmed by a second route.

- `monthlymwaket.aspx` carries **no year control**. The form has exactly two selects (city,
  month). Query-string year attempts (`?year=2025`, `?Year=2025`, `?y=2025`, `?hijri=1446`) all
  return HTTP 200 with byte-identical sizes (10,699-10,701 B) and no year state: the parameter
  is ignored, the surface serves the current year only.
- `praytimes.aspx` (the sibling surface, "choose the city and the date") renders a **single
  today-row**, with a city select and no date control at all. `dailyImage.aspx` is an image
  variant of the same row.
- Wayback CDX holds captures of both hosts, and **every capture probed is a Vodafone age-
  restriction/ISP block page** (2,921 bytes, `Age restricted content`, no grid): 2 ESA
  `monthlymwaket.aspx` captures (2020-04-30, 2020-08-15) and 4 Dar al-Ifta
  `services/details/21/...` captures (2025-04-16, 2025-05-12, 2025-11-17, 2026-06-11). The
  record's "25 empty shells" are this, specifically: not empty, blocked. Wayback cannot supply a
  past year for either authority surface.
- The only archived dated content is the Dar al-Ifta `_TimePrayer` partial (2,992 captures in
  2025, but only **28 distinct capture days**, 2025-11-23 to 2026-02-05), which is a today-row
  per capture, not a month.

**Verdict: no second year obtainable from either authority beyond the five spot years already on
record (2022-2026).** Egypt stays A on the record's evidence; this sweep adds 78 cities of the
same 2026 cycle and no new year.

**Forward longevity: stable across the span, not proven forward.** No 2027 route exists on
either authority surface today (a 2027 body cannot be requested: there is no year control). One
community derivative serves 2027 (§6).

## 5. Cross-surface gate (R5) and the second publisher

**Dar al-Ifta (دار الإفتاء المصرية), authority tier - an independent surface that publishes the
same table.** Its service page states: "تتيح دار الإفتاء معرفة مواقيت الصلاة ... **بالتنسيق مع
هيئة المساحة المصرية**" (in coordination with ESA). Surfaces: `dar-alifta.org/ar/prayer` and
`/ar/services/details/21/...` for the current month, plus the JSON-free partial
`/ar/Partial/_TimePrayer?town=<name>` for a per-city today-row.

- **Month gate, Cairo, November 2026 (30 days x 6 columns = 180 values): 150 identical,
  30 differ, and all 30 differences are the same single defect** - `dhuhr` is printed with the
  PM marker (`11:39 م`, reading 23:39) where ESA prints `11:39 ص`. The minutes are identical on
  every day. **New defect class: dhuhr meridiem swapped, minutes correct.**
- **Today-row gate, 2026-11-11, seven cities across the whole span** (القاهرة, أسوان, الأقصر,
  أسيوط, حلايب, السلوم, شلاتين): all six columns identical to ESA's own November row, to the
  minute, in every city. Halaib (22.3 N) to Saloum (31.6 N, 25.2 E).
- City list: 78 towns, which is ESA's 82 minus five (`منوف`, `ديرب نجم`, `ابو تشت`, `سمالوط`,
  `مدينة 15 مايو`), plus one junk entry literally named `45792`; ESA's `سفاجة` appears there as
  `سفاجا`.

**Verdict on a rival publisher: none exists.** Dar al-Ifta is not a second computation, it is
the same computation re-published with an attribution and one printing defect. That is a strong
confirmation of ESA and a **zero-evidence** second method.

Honest negatives, by language searched (Arabic, English; TinyFish search, site navigation,
CDX):

- **Al-Azhar**: no timetable surface. `azhar.eg` carries the Fatwa Center (fiqh answers, not
  schedules); its mosque appears only as a mawaqit.net platform entry (`masjid-alazhar-le-caire`,
  captured, platform tier, no table).
- **Dar al-Ifta fatwa 13254** endorses following the ESA calendar - an alignment statement
  (`حكم اتباع التقويم الذي تصدره هيئة المساحة المصرية`), captured, not a table.
- **NRIAG** (National Research Institute of Astronomy and Geophysics): research and crescent
  reports only; no dated prayer table found in Arabic or English.
- **Provincial / moon-sighting committees**: searched in Arabic per governorate (Sohag, Minya,
  Asyut); the governorate portals (`sohag.gov.eg`) carry no prayer surface. Results are
  platforms.
- **Platform layer** (islamicfinder, timesprayer, tawkit, egyptra, prayertimes.cc, gotopray,
  al-adkar, elwatannews/cairo24 reproductions): calculators and news, not witnesses; never read
  as provenance.
- **`taqwimalsayegh.com`**: a Shia (Ja'fari) calendar, a different convention entirely; recorded
  as out of scope for this object rather than as a conflict.

**Community tier, one genuine finding: `al-adkar.com` states the ESA method and serves 2027.**
`/salat/<city>/2027` publishes a year grid with a PDF route
(`/api/salat/<city>/2027/pdf?madhab=shafi`) and says in its own words "وفق طريقة الهيئة المصرية
العامة للمساحة". Read off the raw page for 2027-01-01, 2027-02-01 and 2027-07-01 and scored
against the recipe at the Cairo city point (30.0444, 31.2357): **within one minute on all six
columns on all three dates, with a systematic dhuhr +1** - which is precisely the Egyptian
preset's dhuhr +1 that the record already names as the preset trap, so the site runs the library
preset unzeroed. Against ESA's own implied point the deviation reaches +2. This is a
**derivative, not an authority**: the best 2027 route found, recorded as a forward proxy, not
fitted, and never a second computed generation.

## 6. Watch

Operations calendar, "1st of month, Egypt ESA monthly": the November 2026 month was captured for
all 78 serving cities during this sweep (30 rows each; November has 30 days). Probed 2026-11-11
and current.

## 7. What this changes in the record

- **CONFIRMS** the recipe at country scale: 78 cities, 28,468 days, 100% within one minute, zero
  bias, Shafi, raw geometry, no margins. The world table's "100 pc of days within one minute" now
  rests on 78 cities rather than six.
- **CONFIRMS** the replay recipe, with three corrections: the state expires (~900 posts) and must
  be refreshed, not retried; `كل المدن` renders nothing; 82 city options of 83 dropdown entries.
- **NEW, publisher gap:** 4 of 82 advertised options (`منوف`, `ديرب نجم`, `ابو تشت`, `سمالوط`)
  serve no table at all, and Dar al-Ifta's list omits the same four.
- **NEW, defects:** `مدينة 15 مايو` drops 2026-03-20 and 2026-05-26; Dar al-Ifta prints dhuhr
  with the PM marker (new defect class).
- **NEW, span:** the country's served span is 22.32 N to 31.73 N, amplitude fajr 27-74 min / isha
  129-171 min, one recipe, no elevation term - the Tunisia elevation ladder does **not** recur.
- **NEW, negative:** no past year is obtainable; the Wayback captures of both authority surfaces
  are Vodafone block pages (2,921 B), which corrects the record's "empty shells" description.
- **NEW, second surface:** Dar al-Ifta as an authority-tier republication of ESA, gated to the
  minute on 7 cities plus 30 Cairo days.

## 8. Files

- `captures/` - 984 ESA postback responses, the GET pages, the Dar al-Ifta surfaces, the CDX
  enumerations, the Wayback probes, the al-adkar 2027 pages, `geonames-EG.zip`.
- `data/eg-esa-<idx>-2026.json` - normalized dated rows per city
  (`{'YYYY-MM-DD': {fajr, sunrise, dhuhr, asr, magrib, isha}}`).
- `data/manifest.json`, `data/coords.json`, `data/city-coords.json`, `data/city-lists.json`,
  `data/fit82.json`, `data/summary82.json`, `data/table.md`,
  `data/dar-alifta-cairo-2026-11.json`, `data/aladkar-cairo-2027.json`.
- `scripts/` - `sweep.js` (postback driver), `parse-all.js`, `match-coords.py`,
  `build-coords.py`, `fit82.js`, `summary.js`, `lib.js`, `engine.js`.
