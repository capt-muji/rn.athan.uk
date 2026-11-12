# O1n-28 — the Caucasus trio's second witnesses, then Moscow

Wave o1n-28 of round o1n, 2026-11-12. Workspace
`$HOME/athan-gitree/census/o1n/o1n-28-caucasus/` (captures/, data/, scripts/).
Engine: adhan 4.4.6 at `census/adhan-build/node_modules/adhan`, `Rounding.None`,
publisher civil zones, dates from each row's printed literal date, UTC capture
timestamps, no real clock read into data. No subagents deployed. Public pages
only; nothing under /tmp; nothing written to the repo. Every image and PDF was
read with the local Vision binary (`census/tools/ocr`, fast level).

## 1. Azerbaijan — the QMI's own two-year print, banked and fitted (the lift)

**The surface.** The Caucasus Muslim Board — Qafqaz Müsəlmanları İdarəsi (QMI),
the national authority — publishes a per-city monthly print on its own site:
`qafqazislam.com/index.php?lang=az&sectionid=123` (88-city picker), whose print
link resolves to a static sheet `teqvim/{year}/{City}/{month}.jpg`. The tree
serves **exactly 2025 and 2026** for Baku (2023/2024/2027/2028 answer 302 to the
homepage); all 24 Baku sheets captured (`captures/qmi_{2025,2026}_*.jpg.gz`,
2484-class px scans).

The Board's second site `caucasus-muslims.org/az/namaz-calendar` renders the
same November 2026 Baku sheet as a webp (`captures/cmb_calendar.webp.gz`) — a
byte-different relabel of the same generation; corroboration only, no lift.
`islam.az/namaz-vaxti/` (the Board's old portal) sits behind a Cloudflare
challenge against both curl and TinyFish (`captures/islam_az_home_403.html.gz`);
recorded and left unsolved per discipline.

**The columns.** Nine columns, a Ja'fari house table: İmsak vaxtı, Sübh, Gün
çıxır, Zöhr, Əsr, Gün batır, Məğrib vaxtı, İşa, Gecə yarısı. Measured from the
dark-pixel profile of the sheets (`scripts/profile_qmi.py`); parsed by column
slicing at 3x-5x upscale with a DP aligner that never invents a value
(`scripts/parse_qmi.py`), then a per-cell 6x re-read pass for flagged cells
(`scripts/reocr_qmi.py`, 21 cells recovered, 61 unresolvable cells stay null).

**The recipe (adhan 4.4.6, Baku 40.4093/49.8671, Asia/Baku, one recipe both
years).** Zöhr = transit +0; Əsr = Hanafi factor +0; İşa = 15.0 deg +0; İmsak =
Sübh − 5; Sübh = 16.0 deg +0; Gün çıxır = sunrise +0; Gün batır = sunset +0;
Məğrib vaxtı = sunset +15. Scores on the frozen recipe (`data/fit_qmi_summary.json`):

| column | 2025 (n, exact, w1, worst) | 2026 (n, exact, w1, worst) |
|---|---|---|
| zöhr | 363, 84.8, **100**, 1 | 360, 80.0, **100**, 1 |
| əsr (Hanafi) | 363, 68.0, **100**, 1 | 358, 54.7, 94.4, 3 |
| gün batır | 365, 55.9, **100**, 1 | 360, 43.1, 97.8, 2 |
| işa (15°) | 364, 48.9, **97.0**, 3 | 359, 33.4, 88.6, 4 |
| imsak (16°−5) | 363, 57.3, 98.6, 2 | 356, 37.6, 88.5, 4 |
| gün çıxır | 358, 55.3, 94.4, 4 | 359, 34.8, 95.5, 3 |
| sübh (16°) | 358, 52.0, **91.1**, 4 | 350, 36.3, **69.7**, 4 |
| məğrib (+15) | 364, 24.2, 78.8, 2 | 362, 24.3, 67.1, 4 |

Outliers beyond ±4 min are excluded as unresolved extraction cells and listed
per date in the summary (2025: 4 cells; 2026: 26 cells, including three late
March cells where a re-read and the print disagree — recorded, not repaired).
Between-year stability: every margin and angle frozen across both years. The
2026 degradation concentrates in sübh/məğrib exact rates with ~10 flagged cells
against one in 2025; whether that is print-side pad wobble or residual
extraction faults is not proven. Seasonal amplitude: fajr→məğrib span 678 min
(15 Jan) against 1004 min (15 Jul). Span held: 730 dated rows, 2025-01-01 to
2026-12-31 (`data/qmi_baki_2025_2026.json`).

**Grade: A-class on the honest reading** — the national authority print with two
distinct published years fitted on one frozen recipe (2025 at 91-100 w1 on all
eight modelled columns), the second year's twilight columns degraded to 70-89
w1 by unresolved cells. This is Azerbaijan's first national-authority line; the
held Fazilet/Diyanet rows and community boards (minber.az, namazvaxti.az, the
mosque boards) stand untouched beside it.

## 2. Georgia — authority surface exists, app-only; no dated table (negative)

The Administration of Muslims of Georgia (samufto.ge, "საქართველოს მუსლიმთა
სამმართელო") serves no table on its site; it publishes **"ლოცვის დროები"**, its
own prayer-times app (Play `com.locvisdroebi.app`, App Store id6774997714,
listing captured `data/`-side in this report; store listing states times are
computed from the user's location — a client-computed engine, not a served
dated table). The site's only data calls are news/books storage objects
(`captures/samufto_home.html.gz`). The c10 mosque JSON (`georgia-samufto-*
mosques.json`) is the same board's mosque inventory. **Not found under these
terms: a dated samufto table on the public web.** The held Fazilet Tbilisi and
mawaqit board rows stand; the app is a recorded open door (backend unprobed).

## 3. Armenia — no authority surface exists (negative, routes named)

No national Muslim authority publishes a table in Armenia; the Blue Mosque in
Yerevan (the country's only functioning mosque, Iranian-operated museum status)
has no own-site schedule. Searched in Armenian ("Երևան մզկիթ նամազի ժամեր
ցուցակ"), English ("Blue Mosque Yerevan official website ... namaz") and
Russian routes via TinyFish: only platform aggregators answer (islamicfinder,
muslimpro, namaz.today, prayertimes.date, time.now, yenisafak, muslimandquran —
platform methods, never provenance) plus tourism/editorial pages
(visityerevan.am, wikipedia, hyurservice). **Not found under these terms.**
The country layer stands on platform rows only.

## 4. Moscow — three banked authority surfaces; the 502 door is open

**mihrab.ru: UP.** The Moscow Cathedral Mosque's site answered 200 on every
route this run (2026-11-12T04:12Z) after every prior run saw 502. The site
serves **today's row only** (Joomla `mod_islamic_prayer_time_pro`, server-side):
Fajr 05:49, Shuruk 07:54, Zuhr 12:19, Asr 14:04, Maghrib 16:33, Isha 18:16
(`data/mihrab_daily_2026-11-12.json`, `captures/mihrab_home.html.gz`). No dated
archive exists on the site (sitemap 404; no schedule page; the module prints no
date). The harvest route is daily accumulation — recorded as an open door, one
dated row banked (candidate tier, date attributed to the module's current-day
serving, page prints no date).

**mosdum.ru: a table grown since the o1n-22 negative.** The Moscow Muftiate's
own page "Расписание намаза на месяц" (`/raspisaniem-namaza-na-mesyacz/`,
published 2025-12-18T03:48:38Z) carries a static December 2025 HTML table — 31
dated rows, day-1 Monday + Hijri Jumada II 10 + sunrise magnitude all confirming
December 2025 (`data/mosdum_moscow_2025-12.json`). Wayback holds two snapshots
(2026-02-16, 2026-06-10) with the SAME table in both (`captures/
mosdum_snapshot_*.html.gz`) — the page never rotated; one published cycle only.
Fit on the December span (adhan 4.4.6, Moscow 55.7524/37.6156): solar columns
100 percent within-1 worst 1 (shuruk −5, zukhr +5, asr Shafi +0, maghrib +5 —
the same temkin block as the DUM RF sheets), fajr/isha fit inside December's
angle resolution (fajr 16.25 deg at −13 reproduces 100 exact worst 0; an
18 deg-family formulation fits equivalently — one month cannot separate the
angles). **Grade: provisional** (one published cycle, fitted), thin span stated.

**dumrf.ru: the negative reversed — a rolling monthly image archive exists.**
`/img/namaz/{MM}.jpg` serves the DUM RF's monthly sheet for Moscow and Moscow
Oblast (printed header: Central Religious Organisation — DUM RF, Moscow and
Moscow Oblast; year, month and Hijri year printed on every sheet). At capture
the window held 2026-03..08, 10 and 11 (2026-01, 02, 09, 12 absent; year-prefixed
paths 404). All eight served sheets captured as PNG and OCR'd (`captures/
dumrf_namaz_2026-*.png.gz`, row-grid parser `scripts/parse_dumrf.py`): **245
dated rows** (`data/dumrf_moscow_2026_rows.json`).

Fit (`scripts/fit_dumrf.js` + span runs): **solar columns exact** — shuruk =
sunrise −5, zukhr = transit +5, asr = Shafi +0, maghrib = sunset +5, every
column 100 percent within-1 worst 1 across all 245 rows. **Fajr: 18.0 deg at −1,
100 percent within-1 worst 1** in March, October, November and April 1-15 (107
rows). From mid-April to end-August the print follows a bright-season substitute
(implied fajr angle sliding 16.4 deg on April 30, 9.5 deg at the solstice, back
to 17.9 deg by August 31 — never below the model's floor) which reproduces on
**no** fixed-angle, night-fraction (n in 4..9) or max-of-two-angles recipe tried;
the bright-season rule is unresolved and recorded as such. **Isha: 18 deg −22,
100 percent within-1 worst 1** in October-November; March-April sit −23 ±3;
bright season unresolved. Banked grade: **candidate** (solar fit proven across
245 dated rows; twilight solved only on the dark-season span; bright-season
rule unresolved) — a genuinely new dated authority line for Moscow beside the
CDUM 21-city bank.

## Not proven (this wave's honest negatives)

- A samufto (Georgia) dated table on the public web: not found; the authority
  surface is its app, client-computed.
- Any Armenian authority table: not found under these terms (hy/en/ru searches
  named above); only platform layers answer for Yerevan.
- A second month on mosdum.ru: the page is static since 2025-12-18; both Wayback
  snapshots carry the same December table.
- The DUM RF bright-season twilight rule: measured (implied-angle sequence
  recorded), not reproduced by any recipe tried.
- 61 QMI cells that no re-read could resolve: stay null, listed with their
  sheets; never substituted.
- islam.az (Cloudflare challenge): not solved, recorded.

## Open doors carried

1. QMI sheet tree serves 87 further cities per year — the same pipeline extends
   the bank city-wide from the captured sheets' URL pattern.
2. The samufto app backend and the dumrf.ru window roll (2026-09 and 2026-12
   sheets may appear) are the next dated checks.
3. mihrab.ru daily accumulation is now possible; a second daily sample lands
   the door's value-diff evidence.

## Discipline statement

Public pages only; no login, form submission (the QMI picker was consumed only
through its public GET print links), email or challenge solved. Wayback touched
twice (one CDX, two snapshot fetches). All captures gzipped in place at close;
UTC timestamps on every bank; no clock read into data; no blending across
months or years — every fit is per-span on a frozen recipe with the span named.
The repository was not written.

## Provenance note

Filenames above carry pre-gzip names. Capture timestamps (UTC, 2026-11-12):
QMI sheets 03:59-04:02, mihrab/dumrf/mosdum probes 04:12-04:25, samufto 05:5x,
CDX ~05:4x. Scripts under `scripts/` reproduce every parse from the captured
bytes; raw OCR token streams kept beside their sheets in `captures/`.
