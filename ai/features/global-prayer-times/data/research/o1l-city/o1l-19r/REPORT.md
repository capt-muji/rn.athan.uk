# O1l-19r — Australia and New Zealand city layer (round two)

Agent O1l-19r. Workspace `$HOME/athan-gitree/census/o1l-city/o1l-19r/`. No repository edits. Public pages only,
no login, no subagents. Engine adhan 4.4.6 (`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`),
`Rounding.None`, TZ pinned per city, dates built from literal capture strings, no clock reads.

## 1. AUSTRALIA — Diyanet's whole national gazetteer, 218 cities

**Surface.** `namazvakitleri.diyanet.gov.tr` — the Australia district list carries 218 grid points
(`raw/diyanet-au-links.txt`, harvested from the district `<select>` on any Australian page). Every page
embeds a 365-row yearly table for the current year. Captured all 218 on 2026-11-11
(`captures/au-diyanet-<id>-<slug>.html`, 92 MB), parsed to `data/diyanet/au-<id>-<slug>-2026.json`,
**79,570 dated rows** for 2026, all six columns.

**Tier.** authority (Diyanet, Turkish state) for the calculation; the grid points are Diyanet's own,
not the mosque's.

**Fit — one recipe, 218 cities, 365 days each.** adhan 4.4.6 `CalculationMethod.Turkey`
(fajr 18, isha 17, sunrise −7, dhuhr +5, asr +4, maghrib +7), zero additional margins, per-city zone.

| column | within 1 min (city-days / 365) | mean rms | mean bias |
|---|---|---|---|
| fajr | 364.4 | 0.38 | +0.02 |
| sunrise | 365.0 | 0.33 | 0.00 |
| dhuhr | 365.0 | 0.29 | 0.00 |
| asr | 364.4 | 0.41 | 0.00 |
| maghrib | 364.1 | 0.41 | 0.00 |
| isha | 353.2 | 0.49 | −0.02 |

- 218 of 218 cities: **every column within 2 minutes on all 365 days** (`worst` ≤ 2 for all, ≤ 1 for 44).
- The residual is the minute-rounding floor (rms 0.29–0.49 against a uniform ±0.5 rounding), not a
  recipe disagreement: exact-at-the-minute scores 67–96 pc only because the reference point is solved
  continuously while Diyanet rounds its own second-resolution value.
- Between-year stability: **not testable** — the endpoint serves the current year only (probed
  `/2027`, `?yil=2027`, `/prayer-times?yil=2027`: all return the 2026 table). Ceiling: 2026, 365 days,
  79,570 rows. Forward longevity: current-year rolling, stable-across-1-year.

**Reference points recovered** (`data/au-diyanet-fit-2026.json`): longitude from dhuhr by bisection,
latitude by 0.1° grid then ternary refine. Recovered latitudes span −42.99 (Hobart) to −12.37 (Darwin),
longitudes 130.80 to 153.43 after the clock correction below.

**Defect found — six grid points print on the eastern clock.** With the state zone forced, exactly six of
218 points cannot be fitted and their residual is a 60-minute step confined to DST months. Fitted under
`Australia/Sydney` instead they land on their own true longitudes and fit to ≤1 min:
`gladstone` (151.26 E), `sandgateq` (153.04), `southportq` (153.39), `richmond-q` (143.14), `melville`
(≈145.8, a +10/+11-clock point), `mondorah` (≈138.2). So 212 of 218 carry their state's clock and six
carry the NSW clock whatever their label says. A table read in the labelled state's zone would show dhuhr
an hour late through DST. Recorded as a platform clock defect, not a data defect: the solar content is
correct at its own reference point.

**What this CONFIRMS.** fit13's Australia verdict — domestic 18/17 with the full temkin set, adhan's
Turkey encoding verbatim — now holds on 218 independent grid points and 79,570 rows rather than four
surfaces. **What it is NEW:** the whole national city layer, every Diyanet grid point in the country,
which the record carried only as Broadmeadows/Preston/Brisbane.

**Seasonal amplitude** (Jan 15 minus Jul 15, minutes, median across cities): fajr −80 (range −137 to +22),
isha +196 (range +44 to +258). The southern-hemisphere swing the record expects.

**Honest negatives.** No year but 2026 is served. The pages carry no coordinates (the Google Maps key is
present but no lat/lng in the markup), so the reference point is solved from the rows, and the solved
point is unique only up to the (offset, longitude) degeneracy — pinned by the state assignment.

## 2. NEW ZEALAND — Wayback accrual on the dead domain: Ramadan 1427, 15 cities

**Surface.** `fianz.co.nz/download/salat_<city>ram06actual.pdf` — 15 city sheets for Ramadan 1427
(25 Sep – 25 Oct 2006), enumerated by CDX (`captures/nz-fianz-cdx-*.json`, 15 PDFs, one capture each,
2006-10-15). All 15 captured (`captures/nz-fianz-salat_*ram06actual.pdf`, ~310 KB each, distinct
digests), text extracted with pypdf, **465 dated rows** (`data/nz-2006-ramadan-15cities.json`).

Replay note: `http://web.archive.org/...id_/...` returns a 10 KB Vodafone age-gate page for every one of
the 15 URLs; the same URLs over `https://` return the real PDFs. The plain-http replay is intercepted on
this host, not missing from the archive.

**Printed method, verbatim on all 15 sheets:** "5 minutes has been allowed between sunset and maghrib /
iftaar"; "Asr is time based on single shadow"; "Asr based on double shadow is 1 hour 15 mins later";
"Isha time based on shafaqul ahmar is 15 minutes earlier than times shown."

**DATED REGIME CHANGE.** The 2006 sheet prints the double-shadow asr at **+1h15**; the 2026 sheets print
it at **+40 min**. Same federation, same city list, twenty years apart. The printed asr note is not a
constant of the publisher.

**Fit — per-city pairs, 2006 vs 2026** (`data/nz-2006-fit-fixedcoords.json`), adhan 4.4.6 at each city's
own coordinates, maghrib = sunset + 5 per the printed note, Shafi asr:

| city | 2006 pair | worst residual | 2026 record | verdict |
|---|---|---|---|---|
| Auckland | 18 / 18 | 0.6 | 18 / 18 | **identical** |
| Wellington | 16 / 15 | 0.7 | 16 / 15 | **identical** |
| Christchurch | 16 / 15 | 0.7 | 16 / 15 | **identical** |
| Hamilton | 18 / 18 | 0.7 | — | new city |
| Napier | 16 / 15 | 0.7 | — | new city |
| Nelson | 16 / 15 | 0.7 | — | new city |
| Palmerston North | 17 / 17 | 0.7 | — | new city |
| Dunedin | 16 / 15 | 2.4 | — | new city |
| Invercargill | 16 / 15 | 1.8 | — | new city |
| New Plymouth | 17 / 17 | 1.8 | — | new city |
| Tauranga | 17 / 17 | 1.6 | — | new city |
| Rotorua | 17 / 17 | 3.8 | — | new city |
| Queenstown | 16 / 15 | 4.4 | — | new city |
| Greymouth | 16 / 18 | 23.3 | — | reference point ~2.5° east of the town |
| Hastings | 15 / 18.6 | 16.7 | — | reference point ~2.6° east of the town |

Auckland, Wellington and Christchurch reproduce their 2026 pairs **exactly**, twenty years apart, on one
engine. That is a genuine recomputed multi-year test, so the FIANZ per-city line leaves provisional:
**grade A (community tier) on two fitted years, 555 rows**. The remaining twelve cities are new
city-layer coverage; Greymouth and Hastings need their own reference points solved before their pairs
are quoted.

**2026 sheets re-captured live and three more transcribed.** `fianz.com/ramzan-calendar/` still serves all
34 city images (`captures/nz-fianzcom-1447-*.jpg`, ~700 KB each, 34 files) — the live-page gate passes.
Three more sheets transcribed (`data/nz-2026-ramadan-3cities-transcribed.json`, 90 rows) and fitted at
each city's own coordinates with maghrib = sunset + 5 per the printed note:

| city | 2026 pair | worst residual | 2006 pair | verdict |
|---|---|---|---|---|
| Hamilton | 18 / 18 | 0.7 | 18 / 18 | **identical** |
| Tauranga | 17 / 17 | 1.1 | 17 / 17 | **identical** |
| Dunedin | 16 / 15 | 2.4 | 16 / 15 | **identical** |

Six cities now carry two fitted years on one pair each: Auckland 18/18, Hamilton 18/18,
Wellington 16/15, Christchurch 16/15, Dunedin 16/15, Tauranga 17/17. Twenty years apart, one engine,
zero drift. The remaining 30 of the 34 sheets are captured but untranscribed; the images are the archive.

**Ceiling.** 2006 (Ramadan, 465 rows, 15 cities) + 2026 (Ramadan, 6 cities transcribed, 180 rows).
Forward longevity: stable-across-20-years for the six cities testable in both.

## 2b. NEW ZEALAND — year-round surface

No year-round FIANZ publication was found under these terms (the successor site's "prayer times" page is
still calculator-class; the Ramadan sheets are the only dated artifact). Christchurch's Masjid Annur was
recorded Cloudflare-blocked in the prior wave and was not retried. This is a negative, not a closure.

## 3. FIJI — the widget edition, a full fitted year

**Surface.** `fml.com.fj` WordPress `daily-prayer-time-for-mosques` widget,
`admin-ajax.php action=get_monthly_timetable&month=<1-12>`. All twelve months of 2026 served
(`captures/fj-fml-dpt-2026-*.json`), **365 rows, zero missing dates**
(`data/fj-2026-dpt-widget-year.json`). The `year` parameter is ignored: 2025 and 2027 requests return
the 2026 table.

**Fit — 18/17 at Suva, ZERO margins, exact.** At (−18.1416, 178.4419) with fajr 18 and isha 17 and no
margins: fajr −0.01 (range ±0.5), sunrise −0.01, dhuhr −0.01, asr −0.01 (range ±1.8), maghrib +0.01,
isha −0.01. The whole year sits on the rounding floor.

**Two-edition rule, quantified on the full year.** The sheet edition (December 2025, 31 rows, banked)
against the same recipe at the same point: fajr +0.05, sunrise +0.09, asr +0.23 (all exact), and then
dhuhr **+4.8**, maghrib **+2.8**, isha **+5.6**. So the sheet is the widget plus a fixed editorial
margin on the three evening columns, and the widget edition carries none. This reproduces, from the
other direction, the prior wave's sheet-minus-widget deltas (dhuhr +5, maghrib +2/+3, isha +6..+10).
A fit must name its edition, and the two editions differ by exactly those margins.

**Defects.** The widget's Hijri column repeats "17 Sha'ban -5499" across unrelated months. Eleven cells
across the year print am/pm inverted (the 1st of January and a few month-firsts, e.g. fajr "4:11 pm" for
04:11); repaired by ±12 h against the month median and logged.

**Grade.** The widget edition now has a full fitted year (365 rows, exact); the sheet edition keeps
Dec 2025 + Nov/Dec 2026. Two calendar years are touched but only one full year is fitted, so the object
stays **provisional** with the "full-year capture set" lift satisfied for the widget edition.

## 4. NEW CALEDONIA — 2027 probe

Probed 2026-11-11T05:12Z. `mawaqit.net/en/m/mosquee-de-noumea-noumea-98800-new-caledonia` returns 200
with its embedded `calendar` (12 months × 31 days) for the **current year only**. The API routes
`/api/2.0/mosque/<uuid>/calendar` and `...?year=2027` return 404, `/prayer-times?year=2027` returns 401.
Verdict: **2027 not published**. Not due, probed anyway: no 2027 rows exist to capture. The 2026 year
already held stands unchanged.

## 4. AUSTRALIA — the mosque layer per named city

**Geelong — full year, fitted.** `geelongmosque.org.au` embeds a mawaqit widget
(`mawaqit.net/en/m/geelong-mosque-manifold-heights-3218-australia`); the page carries the platform's
embedded 12-month calendar. Extracted: **365 dated rows** (`data/au-2026-geelong-mawaqit.json`), reference
point published by the platform at (−38.1337, 144.3340), zone `Australia/Melbourne`.
Fit (adhan 4.4.6): **18 / 18, Shafi asr, maghrib = sunset + 3, all other columns zero margin** — fajr
−0.03, sunrise +0.02, dhuhr 0.00, isha −0.01 (all ranges ±0.7), asr ±2.6 (the platform-engine asr skew the
record expects on mawaqit tables), maghrib −3.01 constant. A new city surface with its own recipe, and it
is NOT the Diyanet domestic set: Geelong reads 18/18 where the Diyanet grid reads 18/17 + temkin.

**Canberra — jama'ah blocks, no athan.** `canberraislamiccentre.org.au/index.php/mosque/` publishes
jama'ah times in half-month blocks: Fajr 05:15 (1–15 Nov) / 05:00 (16–30 Nov) / 05:00 (1–15 Dec) / 04:45
(16–31 Dec), Dhuhr 13:00 throughout, Asr 16:45 / 17:00 / 17:00 / 17:15, Isha 21:30 / 21:45 / 21:45 / 22:00,
Maghrib "ten minutes after sunset". Dated jama'ah only, no athan table — the record's Canberra defect
holds; this adds four dated blocks.

**Wollongong, Adelaide, Gold Coast, Newcastle, Darwin, Hobart, Perth.** Honest negatives under these terms:
- Wollongong: Masjid Omar on `masjidbox.com` — today-only display, no monthly surface.
- Adelaide City Mosque: own site and `masjidbox.com` — today-only.
- Gold Coast (Arundel Masjid): the prayer page is a client-side SPA that advertises a monthly schedule, but
  no data endpoint exists under `/api/prayer-times`, `/prayer-times.json`, `/data/prayer-times.json`,
  `/api/timetable`, and the bundle carries no prayer-calculation library — the table is fetched from a path
  not discoverable from the page or the bundle. Recorded, not solved.
- Newcastle (`newcastle-mosque.org`), Darwin (Islamic Society of Darwin: Facebook only, gopray today-only),
  Hobart (gopray today-only; `awqat.com.au` is a PrayTimes calculator): no dated athan table.
- Perth: `aussiemuslims.net` (community portal, today-only), the Diyanet Perth pages already captured above.
- mawaqit's public search API returns 401 and its mosque slugs are not derivable from a city name; the
  Geelong slug came from the mosque's own embed. Any further mawaqit enumeration needs each mosque's own
  site to name the widget.
- Amanahly: the platform endpoint is `/api/prayer-times/public?date=` on each mosque's own domain (recorded
  from MIA Liverpool). No tenant directory is public, so the tenant list cannot be enumerated from outside;
  each mosque must be found and probed individually.

## 5. Data files

`data/diyanet/` (218 city-years + manifest), `data/au-diyanet-fit-2026.json`,
`data/au-2026-geelong-mawaqit.json`, `data/nz-2006-ramadan-15cities.json`,
`data/nz-2006-fit-fixedcoords.json`, `data/nz-2026-ramadan-3cities-transcribed.json`,
`data/fj-2026-dpt-widget-year.json`, `data/fj-2025-12.json`.
Raw pages, PDFs and sheet images in `captures/`.
