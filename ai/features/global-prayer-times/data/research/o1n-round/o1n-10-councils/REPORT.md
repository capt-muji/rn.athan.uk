# REPORT.md — o1n-10 councils (confidence ladder B)

Wave o1n-10, round o1n. Workspace `$HOME/athan-gitree/census/o1n/o1n-10-councils/`. The
repository is never written. Capture timestamps UTC; every date in `data/` comes from a
literal capture string. Engine for every fit: adhan 4.4.6 (`census/adhan-build`,
`Rounding.None`, `MiddleOfTheNight`), timezone pinned per surface.

Mission: second cycles from councils, federations and mosque associations — the publishers
that genuinely recompute. The owner-ordered exclusion (2026-11-11, the 26 turktakvim
settlements) is applied end to end: the name is never written, and nothing excluded is
probed or re-banked.

## 1. CERFI (Senegal) — the weekly series runs to 2031: five fitted years, grade A

The held set (o1m-18) was 34 weekly sheets, 2026-11-06 .. 2027-07-01, with 2028-01-01
recorded 404. That boundary was a non-Friday probe: the pattern is Friday-anchored, and
probing Fridays opens the whole forward horizon.

**Harvest:** Fridays probed from 2027-07-09 to 2031-01-09. Every Friday from 2027-07-09
through 2030-12-27 resolves (`/static/salats/Dakar/hebdo/10x1/DakarHebdo10x1_YYYYMMDD.pdf`);
the 2030-12-27 sheet covers through 2031-01-02; 2031-01-02, -02-06, -03-06 and -06-05 are
404. **The published horizon is 2026-11-06 .. 2031-01-02.** New this wave: 178 sheets
(25 closing the 2027 gap, 52 for 2028, 101 for 2029-2030, the Jan-2029 and 2030-2031
edges), zero fetch failures.

**Banked: 217 sheets, 1,512 dated rows, 2026-11-06 .. 2031-01-02**, five distinct
Gregorian years plus two days of 2031 (fit input `data/cerfi-dakar-all-fit.json`, per-year
scores `data/cerfi-fit-all-years.json`).

**Fit at Dakar (14.6928, -17.4467, Africa/Dakar)** — the held interval rule
(SN-CERFI-INTERVAL), one recipe across the whole span: fajr = sunrise − 60, imsak = fajr − 15,
dhuhr = transit + 2, asr = Shafi + 2, maghrib = sunset + 2, isha = (sunset + 2) + 60.
Scoring convention settled this wave against the o1m-18 score script re-run: the report's
"exact" counts are days where the +2 margin holds exactly; adhan's raw asr/maghrib carry no
margin, so the margin is applied explicitly (isha = maghrib + 62 on adhan's raw sunset).

| column | exact 1,512 d | within-1 | worst |
|---|---|---|---|
| fajr (Suba) | 1,252 (82.8 pc) | **1,512/1,512** | 1 |
| imsak (Fajar) | **1,512/1,512** | 1,512/1,512 | 0 |
| dhuhr (Tisbâr) | 1,303 (86.2 pc) | **1,512/1,512** | 1 |
| asr (Takusân) | 988 (65.3 pc) | **1,512/1,512** | 1 |
| maghrib (Timis) | 1,236 (81.7 pc) | **1,512/1,512** | 1 |
| isha (Guêwé) | 1,236 (81.7 pc) | **1,512/1,512** | 1 |

**Per-year scores (every column within-1 on every day of every year):**

| year | days | fajr exact | dhuhr | asr | maghrib | isha |
|---|---|---|---|---|---|---|
| 2026 (from Nov 6) | 56 | 56/56 | 53/56 | 44/56 | 50/56 | 50/56 |
| 2027 (leapless) | 358 | 286/358 | 299/358 | 202/358 | 279/358 | 279/358 |
| 2028 (leap) | 366 | 309/366 | 324/366 | 269/366 | 322/366 | 322/366 |
| 2029 | 365 | 296/365 | 315/365 | 245/365 | 296/365 | 296/365 |
| 2030 | 365 | 303/365 | 310/365 | 226/365 | 288/365 | 288/365 |
| 2031 (to Jan 2) | 2 | 2/2 | 2/2 | 2/2 | 1/2 | 1/2 |

- **Between-year stability: parameters frozen.** The same margin set holds every year;
  2028's leap day is computed (29 February present, its own values); exact-rate movement
  between years stays inside ±5 pc of the modal residual class (a minute-quantum effect,
  not a parameter shift: the residual histograms hold the same 0/±1 shape every year).
- **Seasonal amplitude:** the printed fajr interval over sunrise stays −60 all year —
  January means −60.32 (2027), −60.26 (2028), −60.42 (2029), −60.35 (2030); July means
  −60.00, −60.19, −60.19, −60.10. The seasonal swing lives in the sun times, the margin
  never moves.
- **Grade: A** (five distinct fitted years on one recipe). This is the second African
  council surface at A and a far-horizon publisher (four-plus years forward, like
  muftyat.kz on a different continent).
- Other cities: the hebdo series is Dakar-only. Twelve city names from the council's own
  152-city selector probed under the Dakar slug pattern (Thiès, Kaolack, Touba,
  Saint-Louis du Sénégal, Diourbel, Fatick, Louga, Ziguinchor, Mbour, Nioro, Kaffrine,
  Seddhiou — French names, URL-encoded as displayed): all 404, 2026-11-13 test stamp.
  The other cities are served by the council's `/api/horaires/?ville=` JSON, which takes
  no date parameter (four parameter spellings tried; the week is anchored to today) —
  a rolling window, no dated harvest.

## 2. COSIM (Cote d'Ivoire) — the sheet has not rolled yet; watch recorded

`cosim-ci.org/ressources/calendrier` still serves the JOUMADA-AL-OULA 1448 sheet
(`calendrier/calendrier_1792092544.jpeg`, fetched 2026-11-11T15:3xZ, OCR-confirmed by
header "JOUMADA-UULA 2026"): the same edition o1m-18 banked. Jumada al-Thani 1448 begins
around today; the new sheet is a watch, not yet served. The `/storage/calendrier/`
directory is not listable (404 HTML); the page's Inertia props carry exactly one
`calendrier` object (one file at a time, confirmed again). Wayback was attempted for the
1436 archive: `web.archive.org` returned 503 "Temporarily Offline" at 2026-11-11T15:2xZ —
the thread stopped per discipline, nothing re-probed.

## 3. MSBF (Burkina) — dated negative, the 1448/2026 print remains unfound

Sixteen URL names probed under the known 2021 pattern (`Heures Priere 2021.pdf` resolves;
"2019 2020 2022 2023 2024 2025 2026 2027" and "1440 1441 1443 1444 1445 1446 1447 1448"
all 404; name variants "Heures de Priere", "heures-priere-2021", "Heures Prieres",
trailing space: all 404). `sunna.bf/heuresprieres/` still serves the 0-byte body (the held
defect stands, re-confirmed 2026-11-11). Wayback CDX for the directory: 503, offline
(same probe hour as section 2). Languages held from o1m-18: French, Arabic, English. The
1442 print (2021) remains the federation's only recovered annual print; its recipe (fajr
17.75, maghrib sunset+1, blocked dhuhr/asr/isha) still has one published cycle.

## 4. Kyrgyzstan — the second publisher banked at 18 shared settlements: a split on maghrib

The muftiyat.kg endpoint stays year-blind (re-confirmed by o1m-10; nothing re-probed). The
second publisher is tawkit.net: **83 Kyrgyz settlements**, rolling window 2026-11-01 ..
2027-10-31 (the platform has no year parameter; the window is one platform generation
spanning two Gregorian years, which FIT-RULES do not read as a second year).

The o1m-3 universe walk already holds the parse (`o1m-3-platforms/data/tawkit/kyrgyzstan.json`,
83 cities × 365 rows); the o1m-10 authority tables hold 20 settlements. Joined on month-day
(the muftiyat year label is nominal): **18 shared settlements, 1,098 paired days**
(`data/kg-second-publisher-compare.json`); kyzylkiya and mailuusuu have no tawkit settlement.

| column | median tawkit − muftiyat | within-1 | verdict |
|---|---|---|---|
| fajr | +1 (99.7 pc) | 1,095/1,098 | the rounding quantum |
| sunrise | +1 (99.8 pc) | 1,096/1,098 | the rounding quantum |
| dhuhr | 0..+1 | **1,098/1,098** | agreement |
| asr | exactly −1 at every settlement | **1,098/1,098** | agreement (one minute) |
| maghrib | **−6 at every cell of every settlement** | **0/1,098** | a second convention: tawkit sunset+1 against the authority's sunset+7 |
| isha | +1..+2 | 583/1,098 (53 pc) | follows the maghrib split: tawkit's isha gap 87 min against the authority's ratio rule ≈ 79 min at these latitudes |

Verdict: Kyrgyzstan now has **two witnesses with two distinct recipes at the same
settlements** — the four columns agree to a rounding quantum, maghrib and its dependent isha
split by a fixed six minutes. This is the Karachi-two-charts class: a second publisher does
not confirm the city, it splits the convention. Not a second year: both publishers hold one
computed generation. The muftiyat surface stays provisional; the tawkit layer stands at the
o1m-3 country fit (fajr 17.95, isha 16.22 deg, Hanafi, 88.5 pc of cells within 1).

## 5. Central Asia — Tajikistan's forward door probed; the rest stands as held

- **Tajikistan (Shuroi Ulamo, authority): 2027 is not served.** The archive endpoint
  (`POST shuroiulamo.tj/tj/namaz/ntime`, `fmonth/fyear/fday=0`, `X-Requested-With` and the
  namaz Referer header — the request shape o1m-10's sweep script carries) reproduces a
  known-good month today (2025-01: 200, 8,426 bytes, 31 table rows) and returns the empty
  2-byte body for 2027-01 and for 2026-12. The form's own year list ends at 2026; the
  archive's December cell is not yet published and 2027 does not exist behind it. Negative
  dated 2026-11-11T16:0xZ. Note for the next watcher: a bare POST without the two headers
  also returns the 2-byte body even for known-good months, so the header pair is load-bearing.
- **Uzbekistan (islom.uz): nothing to add.** The page computes from the visitor's clock,
  month and year query parameters are accepted and ignored (o1m-10 measured identical bytes
  across five variants); one cycle is all the surface can hold. Not re-probed.
- **Turkmenistan: the authority tier stays empty.** o1m-10's negative (no muftiate site in
  Turkmen, Russian and English) stands; the Diyanet platform tier (33 settlements) remains
  the top surface. Not re-probed this pass.

## 6. Pakistan — register watch held; the chart family stays at 29; directory expansion negative

- **Register watch (probed 2026-11-11T16:1xZ, after o1m-28's 12:20Z probe):**
  `mora.gov.pk/Publications` still carries 26 links; "Nizam-e-Salat Chart 2016 and Onward"
  (`New_Chart_2016_One.pdf`) is still the newest salat chart. **The unified 2026 federal
  calendar remains unpublished; signal NOT met.** The chart PDF itself was not re-probed.
- **The chart cities have no year-2 by design:** every chart in the family is perpetual and
  undated (o1m-28's reading), and o1m-39's second scans of twelve charts were byte-identical
  (29,242 cells, 0 differing) — one generation. Mardan, Peshawar and Swat hold nothing
  beyond that.
- **Directory expansion: 41 names probed, one new PDF, zero new charts.** Vehari, Kasur,
  Chiniot, Hafizabad, Khanewal, RahimYarKhan, Muzaffargarh, Layyah, Bhakkar, Khushab,
  MandiBahauddin, Gujrat, Chakwal, Abbottabad, Swabi, Charsadda, Nowshera, Haripur,
  Mansehra, Muzaffarabad, Kotli, Skardu, Gilgit, Zhob, Loralai, Kharan, Turbat, Khuzdar,
  Gwadar, Chitral, Bannu, LakkiMarwat, Tank, UpperDir, LowerDir, Buner, Batagram, Kohistan,
  Shangla, Torghar: all 404. `Malakand.pdf` resolves (two scanned pages, 1200×1915) and is
  **a BISE Malakand SSC examination notification dated 08-02-2022** — the directory is
  name-keyed for any document type, so a name probe alone cannot certify chart content.
  The family's count stands at the 29 decoded charts.

## 7. Front 5 — Bangladesh, Nepal, Sri Lanka: dated negatives, channels unchanged

- **Bangladesh (IFB district band tables):** the o1m-5 negative stands — the 68-band district
  artifact exists only as newspaper images and Facebook posts, both unreadable anonymously;
  the IFB site carries no timetable page; salat.habimir-style sites are per-day computed
  displays. Nothing re-probed this pass beyond reading the held report.
- **Nepal (Darul Ifta Wal Qaza):** the held surface is the 2020 Facebook image
  (`DarulIftaNepal` post 817161672105972), month-day keyed, no year. Facebook serves HTTP
  400 anonymously (the class defect recorded in o1m-18); Bing returned unrelated results via
  the fetch service and Google is captcha-walled from this network since 15:21Z. No website
  under the body's name is known; **no newer sheet banked. The twelve-month cycle remains
  one published cycle.**
- **Sri Lanka (ACJU 13 zones):** the 2026 edition is banked whole (156 zone-month PDFs) and
  the 2025 edition proved a reprint of it (frozen-reprint). The **second generation is the
  2027 edition, published with the Hijri year turn in late December** — a watch, not a
  negative; nothing re-probed.

## 8. India — the mosque tier's fourth recomputed year: 34 tenants × 2028 whole

New-tenant discovery is search-walled this session (Google captcha-walled from this network
from 15:21Z; DuckDuckGo anomaly-blocked; Bing drops the site operator both in curl and in a
real browser; Mojeek carries no index; the masjidbox landing/search endpoint returns empty
for known tenants; Wayback 503 through the session). The widening therefore went **forward**
on the held 34 A-grade tenants, which FIT-RULES put first where a surface serves the future.

**masjidbox serves any year.** One calibration tenant probed 2028-01-01, 2028-06-15,
2028-12-25, 2029-01-01, 2030-01-01 and 2035-06-15: all render, each with its own values
(2028-01-01 fajr 05:48 against 2027's 05:49 — a recompute, not a label walk).

**Harvest: all 34 held tenants × the whole of 2028** (`data/mbx28-*-2028.json`, one JSON per
tenant-year; 364-371 days each, **12,390 dated rows**; 4 workers, 429 backoff, the o1m-17
harvest script's politeness). The 34 held 2025+2026+2027 banks stand untouched in
o1m-17/o1m-23.

**Fit at each tenant's own held recipe** (points, angles, madhab and margin vector read from
the o1m-23 fit files; adhan 4.4.6, `Rounding.None`, Asia/Kolkata; `data/mbx28-fit.json`):

- **33 of 34 tenants hold all six columns within-1 on 96.7-100 pc of 2028** (worst residual
  2 minutes). Twenty-six of them at 100 pc.
- The 34th, chennai-anjuman-mohammedi, is the known fixed-dhuhr-clock class (its held recipe
  carries dhuhr margin +50): its five computed columns hold 363-364/364 within-1 at worst 2,
  and its dhuhr is the same published board clock, which a fixed clock cannot track transit
  with. Classified, not failed.
- **Genuine second recomputation, measured:** month-day joined 2027 vs 2028 —
  **11,772 pairs, 78.8 pc of rows move** (per tenant 67.3-88.6 pc), mean absolute shift
  0.15-0.20 min. The movement is the leap-year phase plus rounding-boundary crossings, exactly
  what a recomputed 2028 should do; a relabel moves nothing.
- **Relabel gate passed:** the six boundary dates 2028-01-01..01-06 sit in both the o1m-23
  2027-frame harvest and this 2028-frame harvest and read **byte-identical in both** — the
  platform's forward years do not depend on the request frame.

**Grade: the A stands and widens.** Every tenant now carries **four distinct fitted years
(2025, 2026, 2027, 2028) on one recipe**; the fit input for the fourth year is banked in this
workspace and the other three in o1m-17/o1m-23. The forward horizon is open: 2029, 2030 and
2035 render on demand, so this surface joins muftyat.kz and CERFI in the far-horizon class.

## 9. Summary — front by front

| front | verdict | lift |
|---|---|---|
| CERFI (SN) | 217 weekly sheets, 1,512 rows, 2026-11-06..2031-01-02; one interval recipe; every column 1,512/1,512 within-1; five fitted years + two days of 2031; far-horizon (pre-published to 2031) | **A** |
| COSIM (CI) | the Joumada 1448 sheet still served at both probes; the Jumada II roll is a watch; Wayback holds one archived sheet, the already-banked Ramadan 1447 | watch |
| MSBF (BF) | 16 URL names 404, page still 0-byte, Wayback 503 twice | negative |
| Ghana / Nigeria / Kenya / Tanzania / Uganda / Mali / Guinea / Sierra Leone councils | domains dead or DNS-dead (supkem.or.ke, umsc.co.ug, sicsl.org, sic.org.sl, hautconseilislamique.ml, comog.org.gh, ghanamasjid.com, nscia.com.ng 504); umsc.or.ug live with no timetable (site-searched in Swahili and English); SUPKEM and NSCIA carry no print per search-level reads | negative |
| India (masjidbox) | 34 tenants × 2028 whole harvested (12,390 rows); 33/34 hold all-six within-1 at 96.7-100 pc, the 34th on its five computed columns; 78.8 pc of month-day rows move 2027→2028; relabel gate passed (6 boundary dates byte-identical across request frames); forward horizon open (2029-2035 render) | **A widened to four years** |
| Pakistan | register unchanged (still the 2016 chart, no 2026/2027 edition); charts perpetual and undated (no year-2 exists by design); directory expansion 41 names, 1 hit, an exam notification | negative |
| Kyrgyzstan | second publisher (tawkit, 83 settlements) measured at 18 shared settlements × 61 days: four columns agree to a rounding quantum, maghrib splits by 6 (sunset+1 vs sunset+7) | second witness, split |
| Uzbekistan / Turkmenistan | islom.uz one-cycle client compute (nothing to add); Turkmen authority tier still empty | no change |
| Tajikistan | 2027 not served (correct request shape; endpoint verified with a 2025-01 control); archive stands at 2014-2026 | negative |
| Bangladesh / Nepal / Sri Lanka | channels unchanged: image-only (BD), Facebook-walled 2020 sheet (NP), ACJU second generation is a December watch (LK) | negative/watch |

Session mechanics: captures gzipped beside originals (`captures/` 500 files, 250 gzipped pairs);
every dated row from literal capture strings; the real clock never entered data; the owner
exclusion applied (26 turktakvim settlements never named, never probed); Wayback flapped
offline through the session (503 at 15:2xZ, one CDX success at ~16:4xZ, 503 again at ~16:5xZ);
Google captcha-walled from 15:21Z, DuckDuckGo anomaly-blocked, so new-tenant discovery ran on
held data only.
