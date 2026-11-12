# O1n-25 europerecover — REPORT.md

Wave: re-covering Europe (Scotland rule). Workspace started clean. Banked-by-earlier-waves
surfaces (Cambridge 2026 poster, Karimia Nottingham 2026, Iceland isha verdict, Norway 89-place
pooled fit) were NOT redone. Nothing under /tmp; no subagents deployed; the excluded territory
applied per the round bullet and never named; the repository untouched.

## Front 1 — SWEDEN: Imam Ali Islamic Center (imamalicenter.se) — BANKED

- Surface: per-city monthly PDF posters, 65 cities, from the site's own Bönetider listing page
  (https://imamalicenter.se/sv/Bonetider_pdf, "Senast uppdaterad: 2026-11-01"). Each city PDF is
  one A4 portrait poster for November 2026 (bön 1448) with five printed columns: Gryning (fajr),
  Soluppgång (sunrise), Middag (dhuhr), Solnedgång (sunset), Skymning (isha).
- Capture: 65 PDFs downloaded (captures/imamali/*.pdf.gz). The tables carry no text layer, so
  every cell went through the local macOS Vision fast reader: a bounding-box variant was compiled
  in work/ (ocrboxes) and each page was read full-page (scale 2) plus five column strips
  (scale 6, binarized; the sunset column is white-on-color and needs inverted threshold 0.78).
  Parser work/parse_imamali.py merges page reads with strip fills; 0 page-vs-strip disagreements
  on the complete series.
- Rows: 1,950 dated rows (65 cities x 30 days, 2026-11-01..2026-11-30), 9,750 cells, ZERO
  incomplete. Data: data/imamali-2026-11/<City>.json (round shape: date, vals in minutes).
- Recipe (one for the whole country): fajr 17.75 deg, isha (Skymning) 4.50 deg, dhuhr = pure
  transit (margin 0 at every city), sunrise margin +0..+0.7 min, maghrib margin +0.1..+0.7 min.
  Points solved from each table by bisection (longitude from transit, latitude from day length)
  land on the real city coordinates (Stockholm 59.22/18.15, Malmö 55.48/13.09, Kiruna
  67.78/20.39), so the tables are computed per city at city points.
- Scores: fajr 1940/1950 within-1 (worst 1.9), sunrise 1950/1950 (worst 1.1), dhuhr 1950/1950
  (worst 0.7), maghrib 1950/1950 (worst 1.4), isha 1949/1950 (worst 1.6). 9,739/9,750 cells
  within-1. Exact counts: fajr 1339, sunrise 1633, dhuhr 1792, sunset 1586, isha 1149.
- Conventions identified: the recipe is the Sistani line (fajr 17.75, isha at -4.5 = the redness
  disappears); the site's own fine print carries the Sistani no-fajr fallback (fajr = dhuhr
  + 12.5 h for regions without true fajr), which November tables never trigger, though Kiruna and
  Harads sit inside its summer class. The fixed -4.5 angle's seasonal drift shows as the exact
  count decaying toward the north (Stockholm 21/30 exact, Kiruna 5/30), all within-1.
- Grade: PROVISIONAL (one published cycle, one month). Publisher: Imam Ali Islamic Center,
  Järfälla (Sweden's largest mosque complex, Shia/Sistani). Tier: authority-publisher surface
  (community-authored, organization-owned).
- Second witnesses: IKUS/IFiS were routed. islamiskaforbundet.se/bonetider serves a table but the
  served page carries NO printed month label (rows read like late August/September); curl route
  is Cloudflare-walled (recorded); the fetched body is banked as an open item
  (data/ifis-undated-register.json). Not proven as a dated second witness this wave.

## Front 2 — PORTUGAL: the CIL platform (hsalah.info) — BANKED (in progress note below)

- Surface: www.comunidadeislamica.pt links its horários to hsalah.info; hsalah.info and the CIL
  site share one hosting account (cce0f1db on irp.cdn-website.com), and CIL's own printed
  timetable carries the hsalah.info brand: the platform is the CIL's own prayer-times service.
- Capture: 100 PDFs from the site's own file store (captures/hsalah/): 22 cities x ANNUAL pairs
  2026+2027 (Aveiro, Beja, Braga, Bragança, Castelo Branco, Coimbra, Évora, Faro, Figueira da
  Foz, Funchal, Guarda, Leiria, Lisboa, Ponta Delgada, Portalegre, Porto, Santarém, Setúbal,
  Vila Castelo, Viseu, Vila Real) plus monthly per-mosque tables for the Lisboa-area mosques
  (Amadora, Barreiro, Odivelas set, Damaia, Sacavém, Portela, Vialonga, Póvoa, Forte da Casa,
  Khatija, MMgrande, MMPeq, CI Amadora, CCCC, Laranjeiro) for Out/Nov/Dez 2026.
- The annual PDFs carry a text layer (deterministic parse, no OCR needed): columns Data, Dia da
  Semana, Data Islâmica, Fajr (Sehri), Nascer do Sol, Zawal, Zuhr (12h + 3 min note), Assr,
  Maghrib (Iftar), Ishá, and jamaat columns. Fit and grade: see the Portugal block below when
  banked.

## Front 2 — PORTUGAL completion — BANKED 2026-11-12 (UTC)

- Inventory corrected: the site's file store serves exactly 21 annual city pairs (42 PDFs), not
  22 — the earlier "22" was a miscount. All 21 captured and parsed: 15,330 dated rows (21 cities
  x 730 days, 2026-01-01..2027-12-31), 8 printed columns each, zero incomplete
  (data/hsalah/*.json). Zones: Europe/Lisbon; Atlantic/Madeira (Funchal); Atlantic/Azores
  (Ponta Delgada).
- Recipe (site-stated where stated): PrayTimes-v2-family generator. Fajr 18 deg (site prints no
  angle; empirical), asr Shafi, zuhr = transit + 5, maghrib = sunset + 3 (site footnote: "ocaso
  arredondado para Lisboa e arredores"), isha = 12 deg + 3 min (site header: "Ishá (12º + 3
  min)"), sunrise = plain 0.833 horizon printed 1 minute earlier than nearest rounding (uniform
  -1 across all 21 cities). Rounding: nearest. Platform method labels are not provenance; the
  recipe is the record.
- Points: solved per city by bisection (longitude from the transit median, latitude from the
  solstice day-length gap — the equinox-median is latitude-blind, which is why a full-year
  day-length median bisect fails). Points land on true city coordinates (Lisboa 38.72/-9.26,
  Porto 41.1/-8.7, Funchal 32.6/-17.0).
- Engine: PrayTimes-v2 family replica (o1f-london/praytimes.cjs) — the site's transit column
  reproduces to the minute at those points (median adjustment 0, 97-100% exact), which fixes the
  generator class. Engine of record adhan 4.4.6 evaluated the same recipe as cross-check and is
  recorded per city in data/hsalah-fits.json (adhan agrees on asr/isha; carries the known
  platform-family twilight skew on sunrise/fajr).
- Scores, one recipe across BOTH years (n = 7,665 city-days per year, 21 cities x 365):
  within-1 by column: zawal/zuhr 100 percent (worst 1 min), asr 100 percent (worst 1), isha
  99.9 percent (worst 2), maghrib 99.6 percent (worst 2), sunrise 99.5 percent (worst 2), fajr
  94.4 percent in 2026 and 95.1 percent in 2027 (worst 2). Exact by column: fajr 28/28 percent,
  sunrise 92/93 percent, zawal/zuhr 97/97 percent, asr 79/78 percent, maghrib 93/94 percent,
  isha 79/79 percent. The exact-count gap concentrates in the twilight columns and is the
  replica's seasonal ephemeris wobble (at most 2 minutes) against the site's own solar code.
- Between-year movement: beyond-1-minute cell movement is confined to the late-October DST week
  (147-189 cells per column, exactly 7 days x 21 cities), max +61 minutes — the EU DST end date
  differs between the two years (25 Oct 2026 vs 31 Oct 2027) and the site's tables are
  IANA-DST-correct in both. Otherwise the 2027 tables are a genuine recomputation (Jan 1 and
  Jun 21 cells identical, Mar 20 within 1 minute). Verdict: parameters frozen across years, no
  regime change, never blended.
- Grade: A (two distinct fitted years, one recipe, dated forward to 2027-12-31). Tier: the
  platform is the CIL's own prayer-times service — comunidadeislamica.pt links its horários to
  hsalah.info, both sites share one hosting account (cce0f1db), the printed tables carry
  www.hsalah.info branding, and CIL's own document store serves the same tables
  (captures/cil-ugd-*). Tier follows adoption: authority-publisher surface, community-authored,
  organization-owned.
- Seasonal amplitude: fajr-to-sunrise span mid-January 96 min vs mid-July 118-120 min
  (mainland cities); the fixed 12 deg isha and 18 deg fajr hold through both.
- Monthlies: 34 reliable per-mosque monthly tables banked (983 dated rows, Out/Nov/Dez 2026)
  across 15 mosques (Mesquita Central de Lisboa, Amadora, Barreiro, CCCC, Coimbra, Damaia,
  D. Laranjeiro, Forte da Casa, Khatija, Odivelas, Portela, Porto CCIP, Póvoa, Sacavém,
  Vialonga): data/hsalah-monthlies.json, per-file layout and reliability flags. FINDING, not
  adjudicated: the monthly tables print isha at the annual table's isha-jamaat time (Lisboa
  Nov 1: monthly 18:57, annual azan 18:39), an intra-platform column mismatch. The Porto monthly
  is a separate community surface with its own stepped schedule (fixed fajr 5:45 stepping to
  6:00 mid-month, fixed zuhr 12:30) — not the hsalah generator; recorded as its own witness.
- Backward harvest: CIL's document store serves February 2025 Lisboa (cil-ugd-99b369, 28 rows
  parsed) — one earlier year on the same platform; data/hsalah-cil-ugd.json.
- Open items: 19 files unreliable or partial, kept with flags: two-column extraction breaks
  (cccc_dez, odivelas_dez/nov, amadora_dez, damaia_out_v2, laranjeiro_dez), the AEDA/FIP
  split-block tables (setubal_nov/dez, coimbra_nov/dez, setubal_out), and 10 image-only PDFs
  whose OCR text is banked under work/monthly-ocr/ but whose columnar layout did not
  reconstruct (bauf x3, mmgrande x2, mmpeq_nov, dodivelas x2, ciamadora x2, porto_out_v3).

[Stage notes continue below as fronts close]

## Front 3 — the BALKANS OCR retry — BANKED 2026-11-12 (UTC)

- Target: the Mosque of Athens state mosque (mosqueofathens.gov.gr), whose prayer-times page
  ("ώρες προσευχής - ημερήσιο - μηνιαίο - ετήσ", daily-monthly-yearly) carried only a Ramadan
  2026 image-of-spreadsheet when c21 visited in February. The retry question was whether a
  non-Ramadan monthly image now serves.
- Negative, with routes: the page still serves ONLY uploads/2026/02/Untitled.png. The site's
  media API (/wp-json/wp/v2/media, 100 items walked) shows ZERO uploads after 2026-02-18 —
  nothing daily, monthly or yearly has been published since Ramadan. The c21 open item closes:
  the state mosque has no non-Ramadan dated table (not found under these terms; Greek routes,
  homepage and prayer-times page both walked).
- Harvest 1: the site's own PDF of the same Ramadan table
  (uploads/2026/02/ΡΑΜΑΖΑΝΙ2026.pdf) captured and OCR'd locally (Vision fast level). Day-1
  maghrib 18:07 matches the c21 banked PNG parse; recorded as the same table's document form.
- Harvest 2, NEW: the Ramadan 2024 poster
  (uploads/2024/03/ΠΙΝΑΚΑΣ-ΠΡΟΣΕΥΧΩΝ-ΡΑΜΑΖΑΝΙΟΥ-2024...webp) captured, OCR'd, and parsed: 30
  dated rows (2024-03-11..2024-04-09), 6 columns (fajr, sunrise, dhuhr, asr, maghrib, isha).
  Two days lost cells to OCR (13 Mar lost sunrise, 5 Apr lost sunrise); a missing-column
  hypothesis test recovered the column order and the values are neighbour-interpolated and
  flagged suspect. data/moa-athens-ramadan2024.json; the other 27 days carry clean OCR values.
- Fit (adhan 4.4.6, Athens 37.984/23.728): fajr 19.75 deg (+10 min) and isha 19.75 deg (-14.7
  min) fit all 30 days within-1 (fajr worst 1.5, isha worst 0.9); equivalently isha sits at
  maghrib + 83.1 min but the interval form is worse (worst 4.1), so the angle reading is the
  better one. Sunrise/dhuhr/asr/maghrib all reproduce at margins <= 0.8. The 2026 c21 fit
  (fajr 18, maghrib + 82) and this 2024 fit are the same convention family two years apart —
  the angle-vs-interval reading stays owner-ruled, not adjudicated. Grade: candidate→provisional
  per-year material on an authority surface (the Greek state mosque); two Ramadans, no
  full-year table.

[Stage notes continue below as fronts close]

## Front 7 — SPAIN — BANKED 2026-11-12 (UTC) (negative on year-2; held record stands)

- Held record re-read, not redone: CCIM Madrid (centro-islamico.com, 334 rows x 2025+2026,
  recipe fitted and frozen across both years: fajr 18.25+1, sunrise -2, dhuhr noon+1, asr
  Shafi+1, maghrib sunset+2, isha 17+1), Granada (hijri-parameterized full-year surface, 1447
  complete, recipe fajr 18/isha 17, shuruq = sunrise+5), Malaga (MWL 18/17 monthly posters).
- Year-2 probes, all negative: Doc/Horario/2027/{Ene,Mar,Jun,Dic}-2027.pdf all 404 (the site
  serves a large soft-404 page; the 2026/12 December hole recorded on Nov 10 is STILL absent
  on Nov 12 — Madrid publishes month PDFs with the month, so year-2 is calendar-gated to the
  months rolling). Granada's 1448 months past the current one silently return the current
  month (the o1k finding stands; accrual is time-gated with the hijri calendar).
- No new Spanish surface was opened this wave; the held two-year Madrid fit, Granada's 1447
  complete year and Malaga's posters remain the Spain record.

[Stage notes continue below as fronts close]

## Front 1 (o1n-31) — POLAND — BANKED 2026-11-12 05:47Z
- MAIN SURFACE, Centrum Kultury Islamu w Katowicach (Islamic Centre Katowice, ckikatowice.pl,
  ul. Warszawska 50A): the site's prayer-times page serves one 12-page PDF
  (storage/settings/01KP37S9YXQ19YJ7V7BY6033P1.pdf) — a full-year 2026 monthly harmonogram,
  one month per page, 11 printed columns per day: weekday, Hijri day, civil day, then ADHAN
  Fadzr/Wschód/Dhuhr/Asr/Zachód/Isza and IQAMAH Fadzr/Dhuhr/Asr/Maghrib/Isza. The page's
  year/month query parameters are navigation only — every variant serves the same PDF, so
  year-2 is calendar-gated (a 2027 edition would be a new upload; the storage ULIDs are
  recent). Captured captures/pl/cki-kato-harmonogram.pdf.gz.
- Parse: every page through the local Vision fast reader at bounding-box level (work/
  ocrboxes at the stock render plus a 4x re-render pass; work/parse_kato_lo.py). Days are
  numbered by printed order and cross-validated against every readable day cell and weekday
  cell (zero mismatches after fixing two Vision merged-row blobs and one shifted row). 26
  cells missed by the fast reader were recovered from targeted strip re-reads at thresholds
  0.4-0.7 (work/patch_kato.py, every patch carries its strip source); 365/365 rows complete,
  including a white-on-dark row (2026-02-18) that only reads at threshold 0.4.
- Recipe (engine of record adhan 4.4.6, solved point 50.2587/19.0238, Europe/Warsaw): DARK
  SEASON one recipe — dhuhr = transit + 0.5, sunrise = horizon - 0.8, asr Shafi + 0.5
  (Hanafi rejected: worst 25+ min), maghrib = sunset + 0.6, fajr 12 deg + 0, isha 12 deg + 1.
  BRIGHT SEASON the twilight pair caps: fajr window 2026-05-15..07-26 printed 03:12..03:34
  (12 deg would run 02:41 at the solstice), isha window 2026-05-13..07-28 printed
  21:51..22:18 (12 deg would run 22:50) — a 73-77 day cap class, recorded measured, not
  reproduced by any fixed angle; flagged owner-ruled.
- Scores (365 dated rows, 2026-01-01..12-31, data/cki-katowice-2026.json +
  data/cki-katowice-2026-fit.json): dhuhr 365/365 within-1 (worst 0.8); maghrib 241/365
  (worst 2.5); asr 290/365 (worst 2.6); sunrise 281/365 (worst 2.9); fajr dark season
  261/292 within-1 (worst 2.9), isha dark season 198/288 (worst 3.1); the bright-window
  columns score 0 against the angle by construction (cap). Whole-minute prints against
  sub-minute model events keep the within-1 rate below 100 on the solar columns (mae <= 1.1).
- Grade: provisional (one published cycle, one year). Tier: authority-publisher surface,
  community-authored, organization-owned (a Liga city centre's own prayer-times page; the
  footer names the "Masjid Timetable" app as its daily distribution).
- SECOND SURFACE, Liga Muzułmańska w RP (islam.info.pl, the Muslim League): the Rada Imamów
  Ramadan 2026/1447 post serves 22 per-city Kalendarz Ramadanowy posters (one JPG per city:
  Białystok, Bielsko-Biała, Bydgoszcz, Częstochowa, Dębica, Gdynia, Gliwice, Kartuzy,
  Katowice, Kielce, Kraków, Łódź, Lublin, Opole, Płock, Poznań, Rzeszów, Szczecin,
  Warszawa, Wrocław, Zgorzelec, Zielona Góra). All 22 captured (captures/pl/lm-ramadan2026/)
  and OCR text extracted to work/lm-ocr-*.txt. Layout: Lp/DATA/IMSAK/FADZR/SZURUX/ZUHR/ASR
  (Poznań sample reads clean; the Warszawa poster is a stylised layout). Dated Ramadan rows
  from 19.02.2026. Parse+fit: OPEN ITEM for the successor; the captures and text are banked.
- MZR (Muzułmański Związek Religijny w RP, mzr.pl, the Tatar Muftiate) — negatives, with
  routes: the monthly "Kalendarz – listopad 2026" poster is a religious/civil date calendar
  with NO prayer times (bounding-box read; only day numbers, week numbers and Hijri days
  inside the grid); the "skrócony kalendarz 2026/1447-1448" post serves a 2027-named PDF
  which is a Hijri event calendar (Ramadan/Bajram dates), no prayer times; the /pl/pliki/
  store serves OLD Ramadan archives (pm{NN}_{miasto}.pdf — the captured pm06_poznan.pdf is
  Ramadan 1427H, September/October 2006, Poznań i okolice, read locally). No current
  year-round table on the Muftiate site under these routes.
- Mosque associations of the named cities — negatives: Wrocław (mckowroclaw.pl) carries no
  prayer-times page in its navigation; Gdańsk (meczetwgdansku.com) serves Friday-prayer
  clocks only, its Ramadan 1447 post is an announcement without a dated table; Białystok
  (islam-bialystok.dzs.pl godziny-modlitw) serves a Friday-clock note only; Poznań: no
  independent centre site found (the tmmp.poznan.pl hit is an unrelated city society);
  Warszawa: the Ośrodek Kultury Muzułmańskiej publishes its tables through the League's
  Ramadan poster set above; no year-round table found under these routes. Languages searched:
  Polish; routes: site navigations, TinyFish (Polish queries), the MZR prayer-places page.
- Independent of the Fazilet layer: Katowice's CKI table is its own publisher's PDF; the
  League posters are the Rada Imamów's own print. Neither reuses the held Fazilet rows.

[Stage notes continue below as fronts close]

## Fronts NOT opened this wave (for the successor)

POLAND, then AUSTRIA, SWITZERLAND, SLOVAKIA, HUNGARY, the BALTICS: untouched here; the wave
reached them in mission order but ended after Finland/Spain on session budget. Every prior
front's artifacts are banked in this workspace's data/ and captures/ and this REPORT; nothing
was fetched or computed twice. Wayback was down platform-wide at ~2026-11-12T00:1xZ (one probe,
thread stopped); retry it for the GMS Strasbourg archive harvest (France) and any CDX boards.

NOTE (o1n-31): Poland is now opened and banked above; Austria, Switzerland, Slovakia,
Hungary and the Baltics follow this wave.

[Stage notes continue below as fronts close]

## Front 2 (o1n-31) — AUSTRIA (Vienna) — BANKED 2026-11-12 06:40Z

- Surface: Islamisches Zentrum Wien (izwien.at, Am Bruckhaufen 3, 1210 Wien), the /gebetszeiten
  page. Its own annual calendar ("Jahresgebetszeiten IZW Kalendar") is published as Google
  Drive folders: the 2026 folder holds twelve monthly JPGs plus IZW_JAHRESGEBETSZEITEN_2026.pdf
  (45.9 MB, bilingual German/Arabic; the imprint reads "im Auftrag der Muslimischen Weltliga in
  Oesterreich"). Captured captures/at/izw-jahresgebetszeiten-2026.pdf.gz.
- Rows: 365 dated rows (2026-01-01..12-31), 7 printed columns (GREGO., FADSCHR, SCHURUQ, DHUHR,
  ASSR, MAGHRIB, ISCHAA). Parse: local Vision fast reader at bounding-box level, full-page 5x
  re-render (work/parse_izw.py); day-by-order numbering validated against day cells; 3 cells
  transcribed from garbled-colon blobs (each bracketed by its neighbours), 365/365 complete
  (data/izw-vienna-2026.json).
- Recipe (adhan 4.4.6, Vienna 48.283/16.442): DARK SEASON fajr 15 deg + 0, isha 16 deg + 1;
  sunrise +0.3, dhuhr transit +5.4, asr Shafi +4.2, maghrib sunset +3.3 (a temkin block).
  Bright season (May-Jul) the twilight pair runs a shallower-than-angle arc: printed fajr
  03:07..03:54, isha 21:59..22:33, worst-vs-15/16-deg 35/64 min - recorded measured, flagged
  owner-ruled (data/izw-vienna-2026-fit.json).
- CONVENTION FINDING: the table switches its civil offset on FIXED DATES - summer +120 from
  Apr 1 to Oct 31 inclusive, winter +60 - not the EU DST dates (2026 EU switch: Mar 29/Oct 25).
  The fit models the table's own convention; sunrise/dhuhr/maghrib 365/365 within-1 under it.
- Scores: sunrise 365/365 (worst 0.8), dhuhr 365/365 (worst 0.7), maghrib 365/365 (worst 0.9),
  asr 267/365 (worst 2.5); fajr dark 199/273 (worst 4.8), isha dark 168/273 (worst 15.6, mae
  1.5); the bright windows score 0 against the angle by construction (arc, not angle).
- Grade: provisional (one published cycle). Year-2 route recorded: the same Drive carries a
  2025 folder (monthly JPGs only, no PDF); the publisher's own claim is that the calendar is
  valid 2025-2028 unchanged with a ~1 min/yr drift and a one-time 2029 correction - a span
  statement, not a measurement, recorded as such.

## Front 2 (o1n-31) — HUNGARY (Budapest) — BANKED 2026-11-12 06:40Z

- Surface: Magyar Iszlám Közösség (magyariszlam.hu, the Hungarian Islamic Community), the
  /imaidok page's month-navigable imaidő-naptár for Budapest (DÁTUM, HAJNAL, NAPKELTE, DÉL,
  DÉLUTÁN, NAPNYUGTA, ESTE). Driven in agent-browser (session o1n31-europe): every month
  extracted through the site's own month navigation.
- Rows: 1,034 dated rows, ZERO incomplete: 2024-02-01..04-30 (89 days), then 2025-06-01 through
  2027-12-31 CONTINUOUS (945 days) - the calendar serves a full forward horizon to December
  2027 (data/magyariszlam-budapest.json). One gap: 2024-05 (the walk did not reach it; recorded).
- Recipe (adhan 4.4.6, Budapest 47.4979/19.0402, Europe/Budapest): fajr 18 deg + 0, isha
  17 deg + 0, sunrise -7, dhuhr transit +4.9, asr Shafi +4.8, sunset +6.9 - the Diyanet
  convention class (18/17 with the temkin block -7/+5/+7).
- DARK SEASON (Oct 1-Mar 31): fajr 516/516 within-1 (worst 0.6), isha 516/516 (worst 0.8).
  BRIGHT SEASON: the twilight pair clamps (fajr worst 41.8, isha worst 28.3) - the same summer
  night-column class the Fazilet family records for this latitude; recorded, owner-ruled.
- Span: ONE recipe across 2024 (Feb-Apr, 90 rows, fajr/isha both 90/90 within-1 worst 0.8),
  2025, 2026 AND the forward 2027 tables - four distinct fitted years. Between-year movement
  2026 vs 2027: 42 moved cells, max +61 min, the DST week (2027 EU dates differ; IANA-correct;
  Jan-1 cells identical - genuine recomputation, never blended).
- Grade: A per the owner's grading vocabulary (2-3+ distinct fitted years on one recipe),
  authority-publisher surface. Tier: authority.

## Front 2 (o1n-31) — SWITZERLAND (Bern + Geneva) — BANKED 2026-11-12 06:40Z

- Bern, Islamisches Zentrum Bern (izb.ch): the /gebetszeiten-tabelle page renders a month
  table (Datum, Tag, Fajr, Shuruq, Dhuhr, Asr, Maghrib, Isha) driven in agent-browser. The
  month selector is inert server-side (?month= and form GET all serve November 2026), so the
  surface is calendar-gated like Denmark. 30 rows banked for November 2026 (work/
  izb-nov2026.txt); parse/fit left open - the rows are dated and captured.
- Geneva, Association culturelle islamique de Genève (12imam.ch): a full HIJRI-YEAR 1448
  calendar (June 2026 - May 2027) as twelve per-hijri-month PDFs plus a per-city
  minutes-correction table (13_villes.pdf: Locarno, Lugano, Luzern -13, ...). Nine of the
  twelve month PDFs served (5_Jumada1, 6_Jumada2, 9_Ramadan 404 - recorded gaps; those span
  2026-10-12..12-09 and 2027-02-07..03-08). All captured captures/ch/12imam-*.pdf.gz.
- Rows: 258 dated rows across Jun 2026 - May 2027, ZERO incomplete after cross-merge of two
  OCR passes and 3 transcribed cells (data/12imam-geneva-1448.json).
- Recipe (adhan 4.4.6, Geneva 46.2044/6.1432, Europe/Zurich, EU DST verified at the table's
  own 2027 switch): fajr 17.75 deg ~ margin 0, ONE angle across the whole hijri year (258/258
  within-1, 206 exact, worst 1.1); sunrise/dhuhr/sunset margin 0, 258/258 within-1 each (worst
  0.6); the sixth column (Maghr.) is NOT an angle: sunset + interval (~+22-23 min, print
  wobble -2..+5, seasonal drift recorded measured).
- Grade: provisional on one hijri year; the table's second half (2027) rides inside the same
  print. Tier: community-authored, organization-owned (a Geneva Muslim association's own
  calendar). The Bern and Geneva surfaces are independent of each other.

## Front 2 (o1n-31) — SLOVAKIA — BANKED 2026-11-12 06:40Z (honest negative)

- Routes: muslimovia.sk (the Slovak Muslim portal) /casy-modlitieb/ carries NO table and NO
  dated surface - only two screenshots of third-party aggregators (islamicfinder.png,
  islamweb.png), captured; masjidbox (Islamic Center Cordoba) = community platform surface,
  not opened; islamonline.sk serves only a Ramadan 2021 mobil PDF (Ramadan-only, stale).
  Languages searched: Slovak. No Slovak federation annual table found under these terms;
  Slovakia stays FALLBACK-class for now (owner-ruled), with the routes recorded.

[Stage notes continue below as fronts close]

## Front 6 — FINLAND: PSIY (Oulu) — BANKED 2026-11-12 (UTC)

- Surface: psiy.fi (Islamic Society of Northern Finland, Oulu). Two PDFs served from its own
  static store: prayerTime2026_aqrabulAyyam.pdf (the 2026 annual table, full text layer) and
  prayerTime_Oulu_withcalculationMethods.pdf — the publisher's OWN methods document, which
  states the recipe: fajr 16 deg and isha 15 deg (the Islamic Council of Norway opinion, adopted
  as "similar conditions as Finland") under normal conditions; abnormal conditions (~9 Apr to
  ~3 Sep, no real night at 65 deg N) handled by aqrab-ul-ayyam: freeze the last normal day's
  times (the anchor: fajr 02:55, shuruk 06:05, dhuhr 13:21, maghrib 20:34, isha 22:22) and
  shift each day's row by its own dhuhr; asr stays local. Captures/fi/, both PDFs gzipped.
- Rows banked: 335 of 365 (data/psiy-oulu-2026.json). FINDING: the served PDF itself carries
  NO September rows — it jumps Aug 31 to Oct 1, so the frozen-to-normal transition days are
  simply not published. Ten early-October rows were interleaved by the text extractor and are
  recovered by hand against their neighbours, flagged suspect (data files carry the flags).
- Verification (engine of record adhan 4.4.6, Oulu 65.012/25.468), normal season, 189 days:
  fajr 16 deg within-1 on 180/189 (worst ~5, concentrated in the pre-anchor ramp); dhuhr =
  transit + 1.5 exact 189/189; sunrise and maghrib standard, worst <= 4.3; isha 15 deg fits
  176/189, with a 13-day ramp (26 Mar-7 Apr) where the printed isha-maghrib gap descends
  linearly (144 -> 110 min) toward the anchor instead of following 15 deg — the same
  cap-ramp-into-the-anchor shape France's ezani table shows near its solstice cap. Recorded,
  not adjudicated.
- The aqrab block verified as the convention it states: 146 days (8 Apr-31 Aug), all five
  shifted columns within-1 on 146/146 (worst 1 min) against anchor + (day dhuhr - anchor dhuhr);
  dhuhr itself tracks transit + 1.5 exactly through the block.
- asr note: the geometric asr of both schools does not exist at 65 deg N for much of the year;
  the printed asr runs dhuhr + 17..62 min in Nov-Jan and sits within 10 minutes of adhan's
  Shafi asr in the months where that exists (worst seasonal skew ~9 min; no constant margin
  fits). Same platform-family engine-skew class as Portugal, amplified by latitude.
- Between-year: only 2026 is served (a 2027 table would be a new edition; the psiy.vercel.app
  app was not probed for year parameters this wave — recorded as an open route). Grade:
  provisional, one published cycle, with the publisher's own stated-recipe document as the
  recipe record.

[Stage notes continue below as fronts close]

## Front 3 (o1n-31) — THE BALTICS — BANKED 2026-11-12 06:5xZ (honest negatives, one captured open item)

- Tallinn (Estonian Islamic Center): islam.pri.ee walked (Estonian routes: homepage, the
  page_id pages, category pages). The site carries article categories ("Palve - SALAAT") but
  NO prayer-times table; the uploads live on uus.islam.pri.ee (noted route). The center's
  public presence is a Facebook page (not a public-table route). Not found under these terms.
- Riga (Latvijas Islāma Kultūras Centrs, likc.lv): the /prayer-times/ page carries no own
  table or PDF - the centre distributes times through a mawaqit.net board
  (mawaqit.net/no/m/latvijas-islama-kulturas-centrs-riga), a platform surface; recorded as an
  open route (candidate-class per the family precedent), not captured this wave. Latvian
  searches found no other Latvian mosque site with its own calendar.
- Vilnius/Kaunas (Lithuania): kaunomecete.lt walked (Lithuanian routes: maldos-laikas,
  kalendorius pages). The mosque's own maldos-laikas page DEFERS to Diyanet's service
  (namazvakitleri.diyanet.gov.tr link: "Kauno miesto maldos laiką galite rasti... diyanet.gov.tr")
  - no own table. Lithuania's held coverage rides the turktakvim tree (16 served cities,
  banked) plus Diyanet; the mosque centres carry no own annual table. Not found under these
  terms (Lithuanian + Latvian + Estonian searches).
- Captured: captures/baltics/ directory created; no artefacts captured from the three centres
  themselves (nothing dated to bank).

## Front 4 (o1n-31) — the GMS STRASBOURG WAYBACK RETRY — BANKED 2026-11-12 06:5xZ

- The Wayback platform is back online (it was down platform-wide at ~2026-11-12T00:1xZ; this
  retry succeeded on the first probe, no 429 encountered, no thread stopped).
- CDX over mosquee-strasbourg.com/wp-content/uploads/pdf-prieres/* returns SIX archived
  monthly calendars of the GMS poster series: 2023-06, 2023-07, 2024-02, 2024-07, 2024-11
  and 2026-02 (snapshot dates 2023-06-30, 2023-07-14, 2024-07-12, 2025-07-25, 2024-11-17,
  2026-03-16). ALL SIX fetched from the archive and banked (captures/fr/gms-cal-*.pdf.gz;
  the site's hosting was torn down in October - the archive is now the only source for these).
- The June 2023 print confirmed the series' shape: a decorative poster (Medersa Seffarine,
  Fès) carrying the dated table with six printed columns (Fadjr, Shuruk, Dhuhr, Assr, Maghreb,
  Isha'a) and weekday+day rows - the same column set the held November+December 2026 rows use.
- State: the archived months are CAPTURED, OCR text extracted for the first page only (the
  tables run through the local Vision reader in the successor's parse; per-cell columnar
  parsing open). The held GMS 2026 rows (Nov+Dec) now have dated sibling prints from 2023 and
  2024 - a genuine multi-year span for the community surface once parsed; never blended across
  the hosting regime change (the October 2026 tear-down stands recorded on FR-GMS).

[Stage notes continue below as fronts close]

## Front 5 — DENMARK — BANKED 2026-11-12 (UTC) (honest negative on year-2)

- Held surfaces re-checked, not redone: Imam Ali (a.s.) Moske Copenhagen
  (imamalimoske.dk/dk/bedetider, PrayTimes.js client-side, Tehran method: fajr 17.7, isha 14,
  maghrib 4.5 deg, Jafari midnight; 20-city combobox), mawaqeet.no Copenhagen 365-day 2026,
  salah.dk/adan.dk live aggregators.
- Year-2 negative, with routes: the bedetider renderer exposes city (20 options walked in the
  snapshot) and month (Jan..Dec) selectors but NO year control, and the heading prints
  "Bedetider for København | November 2026" — the tables are computed client-side for the
  current civil year only. Year-2 is calendar-gated to 2027-01-01. Driven in agent-browser
  (session o1n25-europe), not assumed from the static HTML.
- DIT (Det Islamiske Trossamfund, wakf.com/salahtider) retry: the o1k round's "no rows
  rendered" negative was a static-fetch artifact — agent-browser renders the full form (15
  Danish cities, a Kun Ramadan selector, Submit). The form POST is then blocked by the site's
  Sucuri firewall: "Access from your Country was disabled by the administrator". Blocked page:
  recorded, moved on; no challenge touched. The DIT table stays unbanked.
- No 2027 table is served anywhere on the Danish routes this wave; the held 2026 record stands.

[Stage notes continue below as fronts close]

## Front 4 — FRANCE — BANKED 2026-11-12 (UTC)

- Year-2 poster routes, honest negatives first. GMS Strasbourg
  (mosquee-strasbourg.com/wp-content/uploads/pdf-prieres/gms-cal-YYYY-MM.pdf, the community
  surface held with Nov+Dec 2026 rows) is GONE: the host now serves an OVHcloud "Site not
  installed" page and every PDF URL 404s. The TLS certificate was replaced 2026-10-19 with a
  mismatched shared-hosting cert (CN=cluster131.hosting.ovh.net) — the hosting was torn down
  after the earlier round's capture. Regime event recorded; the held 2026 rows stay in the
  archive. Wayback was tried for archived months and is temporarily offline platform-wide
  ("Internet Archive services are temporarily offline") — thread stopped at the first failure
  per the standing rule, one probe made.
- Grand Mosque of Paris: the recorded Ramadan 2026 poster URL now 404s; the horaires page links
  only Ramadan 2023/2024 material and still carries no dated prayer table. No Ramadan 2027
  emsakiat poster is published yet (negative: probed under the recorded URL pattern; not found
  under these terms).
- NEW SURFACE, 25 French cities: ezani.app serves year-parameterized annual prayer tables per
  city — /fr/prayer-times/france/{city}/2026 and /2027, 12 monthly tables per page (Date with a
  printed weekday, Fajr, Lever du soleil, Dhouhr, Asr, Maghrib, Isha). Directory walked from
  ezani.app/fr/prayer-times/france: angers, bordeaux, clermontferrand, dijon, grenoble,
  lehavre, lille, lyon, marseille, metz, montpellier, mulhouse, nantes, nice, nimes, paris,
  perpignan, reims, rennes, rouen, saintetienne, strasbourg, toulon, toulouse, villeurbanne.
  50 pages captured (captures/ezani/*.html, gzipped), 18,250 dated rows banked (25 cities x 730
  days, 2026+2027, zero incomplete, every row's printed weekday validated against the civil
  calendar: zero mismatches). Month tables pinned by weekday and DOM order (two month pairs
  share a start-weekday in the same year; order resolves).
- Recipe (one for the whole country): fajr 11.75 deg, isha 11.75 deg (the UOIF-class French
  pair), asr Shafi, sunrise/transit/sunset at ZERO margins — the generator computes at true city
  coordinates (Paris 48.86/2.35, Lyon 45.77/4.84, Marseille 43.29/5.37) and adhan 4.4.6's solar
  core reproduces transit to the minute (dhuhr exact 351-365/365 at margin 0, 24 of 25 cities
  worst <= 1.5). Engine of record: adhan 4.4.6. Points solved per city by bisection.
- Scores (one recipe across BOTH years, exact/365 per column): sunrise 341-363, dhuhr 351-365,
  asr 331-364, maghrib 343-364; fajr 238-310, isha 231-342. Within-1: >= 99 percent on
  sunrise/dhuhr/asr/maghrib at every city; fajr/isha carry a flagged anomaly below.
- FLAGGED, owner-ruled, never adjudicated: on the 11 highest-latitude cities the fajr and isha
  columns diverge from any constant angle near the summer solstice, worst error scaling with
  latitude (Lille 50.6N: 23 min; Le Havre 49.5N: 13; Rouen 13; Reims 12; Metz 10; Paris 48.9N:
  8.7; Strasbourg 6.7; Rennes 3.8; Marseille 43.3N: 1.5). Every other column stays sub-minute
  through the same days, so the platform switches the twilight pair to some non-angle convention
  (interval or cap) in the solstice weeks. Recorded as a platform convention question.
- Between-year movement: beyond-1-minute cell movement is exactly 7 days x 25 cities per column
  (175 cells, max +61 min) — the late-October DST week, same IANA-correct 2026-vs-2027 DST-end
  difference as Portugal. The 2027 pages are genuine recomputations (Paris Jan 1 cells identical
  to 2026, Mar 20 within 1 minute). Parameters frozen; no regime change; never blended.
- Grade: A (two distinct fitted years, one recipe, dated forward to 2027-12-31), platform tier
  (ezani.app is a platform surface; a platform method label is never provenance).
- Seasonal amplitude: Paris fajr-to-sunrise span mid-January 75 min vs mid-July 96 min.
- Sweden's second witness (IFiS) rechecked 2026-11-12 while convenient: the
  islamiskaforbundet.se/bonetider table still carries NO printed month label; its day-length
  profile identifies September (14h22m falling to 11h50m at the Stockholm latitude), still
  served on 2026-11-12 — a stale pinned month, not a dated second witness; not proven as
  year-2. Raw page banked (captures/ifis-bonetider-nov12.html.gz);
  data/ifis-undated-register.json updated.

[Stage notes continue below as fronts close]

## Front 1 (o1n-36) — POLAND: the Muslim League's 22 Ramadan 1447 posters — BANKED 2026-11-12 09:51Z

- Target: the Rada Imamów Ramadan 2026/1447 poster set (22 cities, captured o1n-31 under
  captures/pl/lm-ramadan2026/, OCR text banked under work/lm-ocr-*.txt). This wave: geometric
  parse of every poster, dated rows, fit per city, cross-check against the held CKI Katowice
  annual. Parse: ./ocrboxes on each JPG (base pass) plus a 2.5x sips upscale pass
  (work/lm-boxes-*, work/lm-up/), work/parse_lm.py merges the two passes (header-band geometry,
  merged-box token mapping, y-clustering, dates by printed order with the majority-voted start).
  21 of 22 posters parse clean: 609 dated rows (29 days x 21 cities, 2026-02-19..2026-03-19,
  Ramadan 1447), 4,263 printed cells, 76 holes remain (1.8 percent), every hole listed with its
  prediction in data/lm-ramadan2026/*.json. Repair passes (work/repair_lm.py): candidate-token
  re-reads and per-cell crops from the upscale fixed 146 cells; every repair names its prediction.
- Rows: data/lm-ramadan2026/<City>.json (21 cities + Warszawa partial).
- Recipe (engine of record adhan 4.4.6, per-city gazetteer points, Europe/Warsaw, CET all span):
  the League prints a small solar temkin and an INTERVAL twilight pair. Solar columns:
  szuruk = sunrise - 2.4..-3.0, zuhr = transit + 0..+0.2, asr Shafi - 1.0..-1.3, maghrib =
  sunset + 0.7..+1.2. Twilight pair is NOT an angle on this print: fadzr = printed szuruk - K
  and isza = printed maghrib + K with ONE K per city, symmetric both sides, constant across the
  month within +/-1 min (print rounding): Krakow 68, Rzeszow 68, Bielsko-Biala 68, Katowice
  68/69, Gliwice 69, Opole 69, Czestochowa 69, Kielce 70, Lublin 70, Wroclaw 70, Zgorzelec 70,
  Debica 70/69, Lodz 71, Zielona Gora 71, Poznan 72, Plock 72, Bialystok 73, Bydgoszcz 73,
  Szczecin 74, Kartuzy 75, Gdynia 76. K is monotone in latitude (49.8N -> 68 ... 54.5N -> 76):
  a per-latitude twilight duration frozen for the month, printed as a constant interval.
  imsak = fadzr - 10 exactly wherever both print (n=593 pairs, no exception beyond OCR holes).
  Angular equivalents recorded per city as informational only (data/lm-ramadan2026-fit.json,
  angle_equivalent; roughly 13-14 deg fajr at 50N rising to ~18 deg at 54.5N).
- Scores (609 rows, one recipe, data/lm-ramadan2026-fit.json): szuruk 603/605 within-1 (555
  exact), zuhr 601/603 (588 exact), asr 599/608 (547 exact), maghrib 604/605 (572 exact);
  twilight intervals 1181/1191 within-1 (806 exact: fadzr=szuruk-K 593/593 minus holes,
  isza=maghrib+K 588/598 minus holes). The misses concentrate in the OCR-noise rows, not in
  the recipe.
- Cross-check, Katowice (LM poster vs held CKI annual harmonogram, same city, same dates):
  LM fadzr = CKI fajr EXACTLY on 28/29 rows (one row -1); LM zuhr = CKI dhuhr within 1 on 29/29
  (16 exact); LM maghrib = CKI maghrib within 1 on 29/29 (20 exact); fixed small offsets:
  LM szuruk = CKI sunrise - 2, LM asr = CKI asr - 1, LM isha = CKI isha - 2; LM imsak = CKI
  fajr - 10 on 29/29. Two independent Polish publishers (the League's Rada Imamów print and the
  CKI harmonogram) agree on the athan times to the minute; the differences are one-sided fixed
  offsets, not regime differences.
- Warszawa (the stylised poster, different design: hijri-date + weekday + six columns, no
  imsak): PARTIAL parse only — 13 of 29 rows carry all six times after a dedicated geometric
  pass (work/parse_waw.py, fixed bands from the 2.5x upscale). Its partial rows show a
  DIFFERENT convention (szuruk margin about -12, maghrib about +11, K about 99/94) — flagged
  UNVERIFIED, excluded from the national recipe above; needs the per-column strip-crop
  treatment to finish. Open item recorded with the route (crop strips via sips --cropOffset at
  the fixed band x-centers).
- Grade: PROVISIONAL, honestly short-sample — one Ramadan month (29 dated days), one published
  cycle. Per FIT-RULES a Ramadan-only span is untestable-short; the cross-publisher Katowice
  agreement and the clean latitude-ordered K table are the corroboration, not a second fitted
  year. Tier: authority-publisher surface (Rada Imamów przy Lidze Muzułmańskiej w RP), 22
  city-level prints.

## Front 2 (o1n-36) — SWITZERLAND: Bern November (izb.ch) — BANKED 2026-11-12 10:05Z

- Target: the IZB Bern month table captured o1n-31 (30 rows, work/izb-nov2026.txt, pipe format:
  Datum, Tag, Fajr, Shuruq, Dhuhr, Asr, Maghrib, Isha). This wave: rows banked and fitted.
- Rows: 30 dated rows 2026-11-01..2026-11-30 (data/izb-bern-2026-11.json), zero incomplete.
- Recipe (engine of record adhan 4.4.6, Bern 46.9480/7.4474, Europe/Zurich, CET all month):
  fajr 17.25 deg - 4.7, sunrise - 7.4, dhuhr transit + 5.1, asr Shafi + 5.2, maghrib + 7.7,
  isha 12.5 deg + 21.7. The angle/margin pairs are degenerate on a one-month span (angle and
  margin trade off; the fit pins the sum): the printed twilight is what the fit reproduces.
  Note the twilight DRIFTS through the month (printed sunrise-fajr 96 -> 102 min, isha-maghrib
  84 -> 90 min): fixed-angle behaviour, NOT the frozen-interval class the Polish League posters
  print. A same-city angle table and an interval table are distinguishable and these are
  distinguishable.
- Scores: 30/30 within-1 on ALL six columns; exact 30/29/27/24/27/30; worst 0.8; mae <= 0.3
  (data/izb-bern-2026-11-fit.json).
- Grade: provisional (one month, one published cycle; the month selector is server-inert so
  year-2 stays calendar-gated). Tier: authority-publisher surface (Islamisches Zentrum Bern's
  own gebetszeiten table). Independent of the Geneva 12imam.ch hijri-year table banked o1n-31.

## Front 4 (o1n-36) — FRANCE: the six GMS Strasbourg archived posters + held-record re-parse — BANKED 2026-11-12 10:14Z

- Sources: the six Wayback-archived monthly calendars (2023-06, 2023-07, 2024-02, 2024-07,
  2024-11, 2026-02, captured o1n-31 under captures/fr/gms-cal-*.pdf.gz; the site's hosting was
  torn down 2026-10 and the archive is the only source) PLUS the held record's own PDFs
  re-parsed under one pipeline for the diffs: 2025-11, 2026-02, 2026-06, 2026-07, 2026-11,
  2026-12 (copied to captures/fr/held-gms-*.pdf.gz from c18-yeartables, never refetched).
- Parse: ./ocrboxes at scale 2 plus a scale-4 pass per file (work/gms-boxes-*), merged per
  table-month. Four print designs (decorative 2023 single table; 2024/2026 February two-table
  prints; 2024-07 single table; 2024-11 onward month-split-into-two-page-halves). Column
  identity resolved per ROW by DP alignment of the row's time tokens against adhan-4.4.6
  model expectations at Strasbourg 48.5734/7.7521, Europe/Paris (holes and junk tokens skipped;
  cost cap 25 min; work/parse_gms.py, work/fit_gms.mjs). Day labels validated where printed;
  rows land on data/gms-dated.json (labeled, dated, per table), fits on data/gms-fits.json.
- Parse validation: the archived 2026-02 poster and the held 2026-02 PDF are the SAME
  generation: 26 shared day-rows, ZERO moved cells on every column (data/gms-diffs.json,
  gms-cal-2026-02__held-gms-2026-02).
- RECIPES AND THE REGIME CHANGE (never blended; each table-month fit on its own print):
  OLD print (June/July 2023): solar temkin small (sunrise -3.2..-4.2, dhuhr +1.6..+2, asr
  +1.8..+2.3, maghrib +3.1..+3.9); summer twilight deep: fajr = sunrise - 142 (June) / - 135
  (July) on the prints, isha capped at 23:04 constant (K off maghrib 88-91).
  NEW print (every table from Feb 2024 through Dec 2026): solar temkin block (sunrise
  -6.4..-7.6, dhuhr +3.9..+5.2, asr Shafi +2.1..+5.5, maghrib +5.8..+8.5); fajr = sunrise - K
  with K_print 97-108 in winter and 87-102 in summer (an interval convention, not an angle:
  the per-month angle fits pin at the sweep edge while K stays constant within +/-2);
  isha = maghrib + K_print 76-96, with summer caps (2026-06 right half: 22:58-23:01 constant);
  imsak printed = fajr - 10 from Feb 2026 (9/9 rows exact in the Feb 2026 right table).
  Per-column scores on complete rows: within-1 at or near 100 percent per table-month
  (e.g. 2026-02 left 12-14/14 on every column, 2026-11 right 15-17/17, 2026-12 right 15-16/16);
  full numbers in data/gms-fits.json.
- BETWEEN-YEAR DIFFS (same civil month, shared dates, printed-vs-printed, data/gms-diffs.json):
  - Jul 2023 -> Jul 2024, the regime break: fajr K 135 -> 97 (-38), isha K 91 -> 76 (-15),
    temkin grows ~+3 on every solar column (sunrise -4.2 -> -7.2, dhuhr +1.6 -> +4.9, maghrib
    +3.9 -> +7.5). Cell moves on 12 shared dates: sunrise median -3, dhuhr +3, maghrib +3,
    isha -8, fajr +34.
  - Jun 2023 -> Jun 2026 (26 shared dates): fajr median +51 (2026 later, max 57), sunrise
    median -4, dhuhr +3, asr +2, maghrib +4, isha -5. Jul 2023 -> Jul 2026 (18 dates): fajr
    median +39, isha -13, maghrib +4, sunrise -3.
  - Feb 2024 -> Feb 2026, frozen: 2/22 cells moved per column (max 3-5, median +/-1); K
    identical (fajr 100/98, isha 88/86); margins identical to 0.1-0.2.
  - Nov 2024 -> Nov 2026, frozen: 5/23 cells moved per column (medians +/-1; max 9-15 sit in
    the weaker 2024-07/2024-11 day-label rows, flagged in the parse warnings).
- Honest limits: 2025-11's own parse is UNRELIABLE (2/13 left rows aligned; its day labels
  misassign) and is excluded from the diff table pending a strip-crop re-parse (open item,
  route recorded); 2024-07's day labels are absent from the print and its 13/31 rows are
  order-assigned (flagged); the June/July fajr diffs use the raw first-token fallback where
  the alignment cap excluded the column (recorded in the diffs file).
- Grade: per table-month provisional (single-month prints); the SPAN is real: eight
  table-months across 2023-06..2026-12 with one dated regime break (between Jul 2023 and Feb
  2024) and one frozen recipe since. Tier: community surface (Grande Mosquee de Strasbourg's
  own monthly prints, 'my e-mam' branded). The hosting tear-down (recorded o1n-25, Oct 2026)
  does NOT affect the recipe record: the archived and held 2026-02 prints are identical.

## Front 3 (o1n-36) — THE BALTICS: Riga's mawaqit board route — BANKED 2026-11-12 10:22Z (honest negative, route change recorded)

- The open route from o1n-31 (mawaqit.net/no/m/latvijas-islama-kulturas-centrs-riga) is DEAD:
  mawaqit.net serves its 404 page at the /no/m/, /m/ and /en/m/ slug forms (driven in
  agent-browser, session o1n36-europe). No Wayback snapshots exist for either slug form (CDX
  queries returned empty; two probes, no 429).
- ROUTE CHANGE: likc.lv/prayer-times/ today embeds NO mawaqit board - it embeds three
  islamicfinder.org prayer widgets (Riga 456172, Ventspils 454310, Daugavpils 44282926, both
  Shafi-labelled and Hanafi-labelled variants per city). Captured 2026-11-12
  (captures/baltics/likc-prayer-times-2026-11-12.html.gz).
- The Riga widget serves TODAY's daily times statically (banked
  captures/baltics/islamicfinder-widget-riga-2026-11-12.html.gz,
  data/riga-islamicfinder-2026-11-12.json): 2026-11-12 (2 Jumada al-Akhirah 1448) Fajr 06:06,
  Sunrise 07:55, Dhuhr 12:09, Asr 13:54, Maghrib 16:20, Isha 18:10. Platform-labelled surface
  (a platform method label is never provenance); daily-only at this route; the monthly table
  on islamicfinder.org is client-side and stays an OPEN ROUTE for a platform front of its own.
- No mawaqit board serves for any Latvian centre today; the o1n-31 candidate-class note closes
  as a negative with routes (mawaqit slug dead + no archive; LIKC switched platforms).

## Front 2 (o1n-36) — AUSTRIA: Vienna IZW year-2 harvest (the 2025 Drive folder) — BANKED 2026-11-12 10:45Z

- The recorded year-2 route (the same Drive as the 2026 calendar) is LIVE: folder
  1dQVX_l7fC-bM6u56r7kcjLIXha2bkhbv ("2025") holds twelve monthly JPGs (JAN..DEZ, modified
  5 Jan 2025, ~1.3 MB each). All twelve captured
  (captures/at/izw-2025/*.jpg + .jpg.gz, drive.google.com uc?export=download per file id,
  ids extracted from the folder page in agent-browser session o1n36-europe).
- Rows: 365 dated rows (2025-01-01..2025-12-31), ZERO incomplete cells, parsed with the
  inherited 2026 pipeline (work/izw2025-boxes.txt -> work/parse_izw2025.py, the same
  bounding-box reader and row logic) — data/izw-vienna-2025.json.
- Between-year verdict, 2025 print vs 2026 print, per same-date cell (365 pairs per column):
  sunrise/dhuhr/asr/isha: ZERO cells moved more than 1 min (max 1) — the prints are identical
  in four columns. maghrib: 364/365 cells moved by exactly +3 min (median +3, max 4) — the
  2026 edition shifted maghrib +3 (2025 maghrib = sunset + 0.3 under the table's civil
  offsets; 2026 = +3.3). fajr: 61/365 cells moved (median 0, max 13), all inside the
  bright-season window: the 2025 summer cap level sits at 03:00 (2026-05-21..07-20 window)
  against the 2026 print's 03:12-03:15 — the cap LEVEL changed between editions.
- Scores: the held 2026 recipe applied to 2025 (data/izw-vienna-2025-fit.json): sunrise
  365/365 within-1, dhuhr 365/365, asr 305/365 (worst 2.2), maghrib 1/365 at the 2026 margin
  (as expected after the +3 shift; 2025's own margin is +0.3), fajr/isha dark season
  199-201/365 with the bright-window differences recorded above.
- FINDING, recorded against the publisher's own claim: the imprint's span statement ("valid
  2025-2028 unchanged, ~1 min/yr drift, one-time 2029 correction") is contradicted by
  measurement — the 2026 edition moved maghrib +3 min on every day and changed the summer
  fajr cap level by ~12 min. The between-year stability verdict: parameters frozen for four
  columns, maghrib and the bright-season cap shifted in 2026. Never blended: each year keeps
  its own fit. Grade: two distinct fitted years (2025, 2026) on one recipe for the frozen
  columns; the maghrib shift keeps the whole table at PROVISIONAL-plus (not A under the
  frozen-parameters reading), tier authority-publisher.
- Note: the 2026 fit's civil-offset convention (+120 Apr 1-Oct 31, +60 winter, fixed dates,
  not EU DST) reproduces the 2025 print unchanged — the convention is stable across years.

## Front 2 (o1n-36) — SWITZERLAND: Bern archived months (2016) from the Wayback tail — BANKED 2026-11-12 10:45Z

- CDX over izb.ch (one probe, no 429) surfaced the old site's archived monthly PDFs: 2013
  bimonthlies, monthly 2016 (juli, august), august-2018, dezember-2018, plus a 2016 Ramadan
  PDF. Four fetched (captures/ch/izb-arch-*.pdf.gz): juli-2016, august-2016, august-2018,
  juli-august-2013.
- Parse (work/parse_izb_arch.py): 2016 months clean — 31+31 dated rows (2016-07-01..31,
  2016-08-01..31), 61 of 62 rows complete (data/izb-bern-archived.json). The 2018 partial
  print carries only Aug 19-31 (13 rows, 10 complete; the print itself starts mid-month).
  The 2013 bimonthly's two side-by-side tables defeated the column mapping (values land
  shifted; 31 rows excluded, artifact banked, open item with the route: per-table bands at
  the scaled x clusters 104-390 and 650-914, page 1683x1190 landscape).
- Fit (data/izb-bern-archived-fit.json): the 2016 prints are a ZERO-TEMKIN 15/15 recipe —
  fajr 15 deg (margin -0.1/-0.4), isha 15 deg (+1.7/+3.7), sunrise -0.6, dhuhr +0.8/+0.9,
  asr Shafi +0.3/+1, maghrib +0.7/+0.9; 61/61 columns-days within-1 (every fitted column
  30/30 or 31/31). The 2026-11 print (held, banked above) carries fajr 17.25 deg - 4.7,
  isha 12.5 deg + 21.7, sunrise -7.4, dhuhr +5.1, asr +5.2, maghrib +7.7.
- Between-year verdict: IZB Bern CHANGED its recipe between 2016 and 2026 — a temkin block
  of +5..+8 min appeared on every solar column and the twilight angles deepened (fajr 15 ->
  17.25-equivalent, isha 15 -> 12.5-equivalent-with-margin). August 2018 (10 usable rows) is
  flagged unreliable (its margins read as a third convention; parse partial) and is excluded
  from the era call. The Bern record now spans three eras: 2016 zero-temkin, 2018 unresolved,
  2026 temkin block. Never blended. Grade: provisional per era; the 2016 months give the
  publisher a second fitted era (one month + one month, same recipe, 61/61 within-1).

## Front 4 (o1n-36) — WAYBACK year-2 harvests: negatives with routes — BANKED 2026-11-12 10:45Z

- CKI Katowice 2025 archive: CDX over ckikatowice.pl (storage/* prefix probe, then a domain
  scan) returns NO archived prayer PDFs — the only capture touching the storage theme is a
  CSS file. The harmonogram PDF's ULID path is too recent. Negative: not found under these
  terms; the 2025 print has no archive. (2 probes, no 429.)
- Budapest horizon via Wayback: CDX for magyariszlam.hu/imaidok* returns ZERO rows; the
  domain scan (200 collapsed urlkeys) holds no imaidok path. The calendar page was never
  archived. (2 probes, no 429.) The horizon question answered by the LIVE route instead: the
  magyariszlam.hu calendar is a front-end on api.aladhan.com/v1/calendarByCity
  (city=Budapest, country=Hungary, method=13, captured from the page's own resource list in
  agent-browser), so every month is computed on demand — the site's served horizon is not a
  data limit. Harvested five months the site's navigation had not served: 2023-10, 2023-11,
  2023-12, 2024-01 and the recorded gap 2024-05 (154 dated rows, platform-labelled:
  aladhan method 13 computes, the community site wraps; data/magyariszlam-budapest-horizon.json,
  raw API responses in work/aladhan-budapest-*.json). Checked against the held Budapest
  recipe (Diyanet class): 85.4 percent within-1 over 924 column-days — close but not the
  site table's 100 percent; the API's own parameter set differs slightly from the site
  print's. Recorded, not adjudicated.
- Wayback platform state this session: online throughout; NO 429 encountered on any thread
  (CDX probes: ckikatowice x2, magyariszlam x2, mawaqit-riga x2, izb.ch x1; content fetches:
  4 izb.ch PDFs). One probe at a time was kept throughout.
