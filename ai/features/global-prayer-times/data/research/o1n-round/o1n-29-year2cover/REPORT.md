# REPORT — wave o1n-29-year2cover (round four o1n, session three)

Date: 2026-11-12. Times UTC. Workspace: `census/o1n/o1n-29-year2cover/`. Engine of record:
adhan 4.4.6 at `census/adhan-build`, rounding per surface as stated. No subagents were
deployed at any point. The territory exclusions (the standing bullet and the day's country
exclusion list) were applied at runtime by code, never by name, and no excluded territory
was fetched, named or scored. All raw captures live under `captures/`, gzipped in place
(2,202 files, 39 MB); derived rows and fits under `data/`.

Mission: year-2 accrual and second-witness hunting on the fit index's open rows (the
YEAR-2 ACCRUAL and Scotland-rule standing studies), on the o1n-4 fit index's
untestable-single-year and candidate/community classes, excluding every territory another
wave owns this session.

The closures the wave inherited and honoured: mawaqit's `?year` is a proven relabel on 25
of 25 held surfaces (AW conflict note); the seven west-African CDX archive shapes are
closed (O1n-20/24), reopenable only on live year parameters or new archives; KG's endpoint
is a relabelled generation (KG-20-CITIES conflict note); the turktakvim live annual ignores
year parameters (TT-AFRICA-8565 span note) and the Diyanet overseas annual serves the
current year only (O1m-9 probe).

---

## E1. MY-JAKIM-59-ZONES-2027 — YEAR-2 ACCRUED, FOUR YEARS ON ONE RECIPE (A-class evidence)

**What was banked.** JAKIM's own e-solat API
(`e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=month&year=Y&month=M&zone=Z`)
serves any month of any year: 2026, 2025 and 2028 harvested whole for all 59 held zones
(2,124 month bodies, zero fetch failures, captures `jakim-<zone>-<year>-<mm>.json.gz`),
365/365 rows per zone per year. Together with the held 2027 bank (wsa render, gated
against three state publishers) the object now spans **four distinct fitted calendar years:
2025, 2026, 2027, 2028** — 236 zone-years, 86,140 zone-days.

**Gates.** My 2026 e-solat rows are byte-identical to the two held 2026 gate files
(SGR01, WLY01: 0/365 diffs each). The 2027 aggregate reproduces the held entry's scores
exactly on my re-run (fajr 98.16 pc within-1, maghrib 93.1, isha 94.8, worst isha -880 —
the known per-zone misses), gating both the held bank and my scorer. The API also serves
2025 (backward harvest) and 2028 (far horizon, 31-row January probe banked).

**Fit (Recipe B held: fajr 18 / isha 18, Shafi asr, zohor +1.5, sunrise floor, others
ceil; points recovered per zone from the 2027 tables; `data/e1-jakim-4yr-fit.json`).**

| year | fajr w1 | sunrise w1 | dhuhr w1 | asr w1 | maghrib w1 | isha w1 | worst |
|---|---|---|---|---|---|---|---|
| 2025 | 98.0 pc | 81.5 | 99.97 | 99.1 | 91.4 | 94.8 | +11 |
| 2026 | 98.0 | 81.1 | 99.97 | 99.1 | 91.4 | 94.8 | +12 |
| 2027 (held render) | 98.2 | 83.4 | 99.96 | 98.9 | 93.1 | 94.8 | 880 (held's named rule) |
| 2028 | 97.9 | 80.8 | 99.97 | 99.0 | 91.4 | 94.8 | +20 |

**Between-year stability.** 45 zones genuinely recompute (JHR01: 4.9-8.2 pc of same-date
cells move per column between 2026 and 2027; across 2026/27/28 344-347 of 365 dates are
byte-stable, the rest move by a minute-class). **14 zones are byte-frozen across all three
harvested years** (KTN01-02, SBH01-09, SGR01-03, WLY02): the e-solat API renders the
state publishers' frozen editions for these. The held conflict note (Selangor/Jawi's own
prints moved in 2027) stands beside this: the frozen API render and the state prints are
two renderings of the state line, recorded, never blended. Seasonal amplitude (JHR01,
fajr-to-maghrib day span): Jan 793 min, Jul 809 — near-equator stability as expected.
One surface defect banked: the API's 2028 February carries 28 days (no leap-day row on
any zone), so the four-year span totals 86,140 scored zone-days, not 86,199.

**Verdict.** One recipe across four distinct years, parameters frozen, the misses all
named per-zone rules: **span verdict yes; grade A evidence complete** (Kazakhstan
precedent: distinct recomputed years). The e-solat/wsa rendering split is a rounding
convention (17/31 January days differ by exactly one minute for JHR01), recorded, not a
regime change.

## E2. ID-SIHAT-209-UNITS — NEGATIVE, DATED; A WATCH

The daily endpoint (`bimasislam.kemenag.go.id/api/v1/public/prayer-times?city_id=..&date=..`)
serves exactly the 2026 precompute (`"source": "precompute:v1"`, `calculated_at`
2026-06-03) and refuses 2027-01-01 with "prayer times not found for the given city and
date" (probes banked). A month/year query is refused ("date query parameter is required");
no calculation-methods documentation route exists (404s banked). The endpoint's ceiling is
the served year; the precompute date shows one generation per year. **Watch: probe the
2027 precompute after 2026-12-31 — the cheapest year-2 for 209 authority units lands
there.** Not found under these terms: no year parameter, no second route.

## E3. SR-PARAMARIBO — NEGATIVE WITH ROUTES; WATCH

namazvakti's `Yearly.php?cityID=15847` serves the 2026 annual; `&year=2027` is ignored
(title and tables stay 2026). `Monthly.php` rolls with the current month only (today it
prints "Kasım 2026"), ay/yil params ignored. Wayback CDX holds zero captures of any
cityID=15847 page (two query shapes, both empty, outputs banked). **Routes named: year
parameter, monthly roll, archive — all closed for 2025/2027.** Watch: the annual page
rolls to 2027 on 2027-01-01.

## E4/E5. WS-APIA-DIYANET + TO-NUKUALOFA-DIYANET — NEGATIVE WITH ROUTES; WATCH (extends to the Diyanet-tree overseas class)

The live year parameter was already probed by O1m-9 (ignored); this wave adds: the three
tabs are server-rendered in the page (no internal API to re-parameterise — the page's
script set names no times endpoint), and Wayback CDX holds **zero captures** of the
overseas city pages (16182 Apia and 16375 Nuku'alofa probed; the domain itself is archived,
so the emptiness is real, not a CDX fault — control query banked). **The Diyanet overseas
class (TM, CN, JP, KR, MO, KP, MN, WS, TO, and the OC rows) is untestable-single-year on
every live route; the annual roll on 2027-01-01 is the dated year-2 watch for all of them
at once.**

## E6. KI-AHMADIYYA-2026 — SECOND WITNESS BANKED (the city's computed line)

Searches (Bing, Google challenge recorded) find no second Tarawa timetable publisher and
no 2027 Ramadan sheet yet (Ramadan 1448 lands Feb-Mar 2027; watch recorded on the same
Facebook publisher). But the turktakvim non-African tree — banked in o1n-17 — carries
**Bairiki (Tarawa), cityID 70171, 2026 whole** (`70171-bairiki-tarawa.json`, 365 rows): a
second dated surface for the city. Held board (Ahmadiyya Ramadan 2026, 30 days) minus
turktakvim, per column median: fajr +7 (+5..+11), dhuhr +44 (the board's fixed 13:30
against the computed noon), asr +2 (the fixed 16:00), maghrib -6 (-7..-6), isha -9 (the
fixed 19:45); zero exact anywhere (`data/e6-kiribati-witness.json`). The board is a
jama'ah schedule; the computed line now stands beside it, quantified. **No reproduction —
two different objects, one city, the split recorded.**

## E7. BS-NASSAU (athanpro) — FROZEN EDITION LIVE-GATED; METHOD DECLARED; ANGLE ATTRIBUTED

The live page re-fetched 2026-11-12 still serves **September 2026** as its month
(todayPrayerTimes day 29; the full frozen 30-day table in `__NEXT_DATA__`,
`data/e7-athanpro-nassau-nextdata.json`) — the frozen-reprint behaviour continues live,
six weeks past the month. The payload declares the platform's own provenance: `source:
"calculator"`, `method: MWL id 17, adjustments all zero`, point (25.0768, -77.3388). Fit
of the frozen table against the declared method (MWL 18/17, Shafi, tz -4 EDT, nearest
rounding): **fajr 29/30, sunrise 30/30, dhuhr 30/30, maghrib 30/30, isha 25/30 exact, all
180 cells within-1** (`scripts/e7-athanpro-fit.mjs`). The held "angles underdetermined"
verdict upgrades to **declared MWL 18/17, reproduced**. Grade evidence: a frozen edition
is one computed generation, so no lift without a second generation; the watch is the
platform's month roll, which has never come for this city.

## E8. VE-MARACAIBO-SHEET — LIVE GATE PASS; ACCRUAL WATCH

The publisher's sheet `mezquitadecaracas.com/horario-salat.pdf` re-fetched 2026-11-12 is
**byte-identical (md5 0faed3d4…) to the held capture** — the October-November 1448 sheet
still stands, no new edition. The two-month rolling artefact's next sheet (the ladder's
next reading for Maracaibo's +19) is the accrual watch, expected around mid-December. No
second Maracaibo publisher found under these terms (search routes: "mezquita horario
oraciones Maracaibo", es; theCaracas-mosque page ladder unchanged).

## E9. AR-CCIAR-2026-09 — TWO 2025 SHEETS TRANSCRIBED AND BANKED (54 dated rows); ONE FITS THE HELD CONVENTION, ONE REFUSES IT; LIVE SITE DOWN

**The live site refused connections all day** (HTTP 000, three shapes; it was up
2026-11-11) — the sheets came from the O1m-22 capture bank.

**Transcription (the predecessor's named fix, per-column cropping, applied).** Ruling
lines detected per sheet (dark-pixel threshold 0.6), nine column bands cropped at 3x, the
local Vision fast reader on each strip, split-strip re-OCR for the axis. Both sheets
assemble at 30/30 rows with zero weekday mismatches against the civil calendar
(`scripts/e9-columns.py`, `e9-assemble.py`, OCR text under `data/`, strips under
`captures/`).

- **Rayab 1447 (2025-12-21..2026-01-18): 28 complete rows** (`data/e9-cciar-2025-sheets.json`).
- **Rabi al-Akhir 1447 (2025-09-23..2025-10-22): 26 complete rows**.

**Fit, on the held O1m-22 pipeline replicated exactly** (CJS adhan, noon-UTC dates, Intl
minute rounding, per-column median temkin; the replication reproduces the held fit file's
temkin [-3,-1,+1,0,+1,-4] and every within-1 class — `data/e9-cciar-fit4.json`):

- **December 2025 sheet: temkin [-1,-1,+1,+1,+1,-6]** — within ±2 of the held 2026 set;
  residuals fajr 22/28, sunrise 28/28, dhuhr 28/28, asr 27/28, maghrib 27/28, isha 28/28
  within-1 (the asr w721 is one meridiem-misparse cell, kept as provenance). **A genuine
  second season on the held recipe family.**
- **September 2025 sheet: closes no recipe.** Its own temkin solves to [0,+4,+6,+7,+9,+6]
  with residuals w3, and a full angle grid at the held point bottoms out at cost 4.9 min
  (angles pinned at the 20/20 grid edge; `scripts/e9e-rabii-solve.cjs`). **A different
  computation generation, dated, recorded, never blended with the 2026 line.**

Verdict for the index: the surface moves from "one transcribed month" to **two dated 2025
seasons + the 2026 month, one convention evidenced twice, one 2025 generation
non-conforming (conflict recorded)**; the transcription defects (2+4 incomplete rows) are
open items named per cell. The site-down observation is itself dated evidence (the posts
channel's availability is not guaranteed; the media-library enumeration from O1m-22
remains the fallback).

## E10. Second witnesses from the banked turktakvim African tree (four cities) — RECORDED

Cell-level held-minus-turktakvim diffs per column (same civil dates, fixed zones,
`data/e5-witness-diffs.json`; turktakvim 2026 tables already banked under TT-AFRICA-8565):

- **Boke (GN)**: medians fajr +2, sunrise -5, dhuhr -17, asr -17, maghrib -15, isha -25.
  The mawaqit Correrah line and the platform line are distinct conventions; the held
  14.90/15.10 recipe stands; no reproduction.
- **Harare Msasa (ZW)**: medians +13/+5/-7/-7/-6/-16. The platform's own two Harare
  tables (Msasa Park 123122 and Havaalani 123113) are **byte-identical to each other on
  every column — one generation, two labels, no lift**. The held mawaqit 14.90/15.10 line
  is distinct.
- **Bamako (ML)** (61 overlap days): fajr median 0 with 56/61 exact — the held tw table's
  fajr column **is the turktakvim line**; the other columns carry their own margins
  (-5..-7). Partial family reproduction recorded, not a relabel.
- **Kampala (UG)** (365 days): fajr median 0, 197/365 exact, 365/365 within-1 — the held
  salaah Kampala table's fajr **is the platform's line**; asr -7, sunrise +4, maghrib -2,
  isha -3 are its own margins. The held "two Ugandan lines" conflict stands, now with the
  platform line placed beside them.
- **Bissau (GW)**: the hand-set board vs turktakvim — dhuhr +30 (the jama'ah clock), isha
  -33, fajr -21..+15 wild. The board is not the computed line; turktakvim's Bissau table
  (6144, already enumerated) is the city's computed dated surface beside it.

## E11. NP-RAHMANIYA-BOARD — NEGATIVE CARRIED, ONE ROUTE NAMED

The turktakvim Nepal gazetteer (74 settlements) carries **no Siddharthanagar/
Bhairahawa/Butwal-class neighbour** (enumeration walked, banked). With the mawaqit year
route closed at the platform (25/25 relabel) and the CDX shape closed, the defect board
has no second witness and no year-2 route. The board's dhuhr pin (13:30 all year) already
marks it as not a computation; its class stays the defect record.

## E12. AF-TAWKIT-8 — WINDOW-ROLL WATCH (not due)

The tawkit pool's eleven-month window rolls 2026-12-01 (the standing watch). No year
parameter probed this session (the pool was harvested 2026-11-11; probing the same
month-bodies again banks nothing). Untouched; the roll check is next round's cheapest
Afghanistan year-2 move.

---

## Notes and discipline

- Engine adhan 4.4.6; `Rounding.None` with publisher-side rounding named per fit; dates
  from literal capture strings; the real clock never entered any data (timestamps in this
  report and in capture names only). The one real-clock comparison in E7 (the live page's
  served month vs today's date) is a live-gate observation, not data.
- Every search negative names its routes and languages (English, Spanish, Turkish
  interface strings where the platform forced them, Malay for the e-solat month names).
- The occupying-entity's name appears nowhere; the land is Palestine, Jerusalem stays
  Jerusalem. The out-of-scope island (owner order 2026-11-11) was never targeted, named
  or counted.
- No login, no forms, no captcha solved. The Google challenge page was recorded and the
  thread switched to Bing. The ccislamicoreyfahd connection failures were recorded, not
  retried into a wall.
- Inherited workspace state was read before writing (o1m-5, o1m-16, o1m-19, o1m-22,
  o1m-4-africa, o1n-3, o1n-17, o1n-4, CONSOLIDATION.md); nothing redone that existed;
  nothing deleted.
- The repository at $HOME/repos/rn.athan.uk was never touched.
