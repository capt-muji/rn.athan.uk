# MASTER WORLD TABLE v3 — Athan.uk v3 country-to-method map

Built by C41 (T-668), 2026-11-10; folded to v3 by T-675, 2026-11-11 (the o1k-wide pack under the
agent-ruled rulings: D14 adoption, D3's Niger consequence, D15's repairs, A1's fallback bands).
v2 was rebuilt from:
policy-layer v2.1 (65 objects, `census/c33-policy21/policy-layer.v2.1.json`), every T-668 census-wave
verdict (#6946-#6987), T-667 from #6929 on (N1f, N2f, O1f, P1-P5, S1, AB1, M1-M5, owner rulings),
and the T-665/T-666 survey verdicts for countries the census never touched.
This is the artifact the T-42 plan gets written against. Research only; the repository was not touched.

## Reading rules

- **Grades** (owner ruling T-667 #6943, superseding the 365-day ruling of #6924): **A** = 2-3+ distinct
  years of fitted evidence, one recipe reproduces every year; **provisional** = one published cycle,
  single year, or a short sample — shippable as a derived recipe only with the year-2 debt recorded;
  **community** = fitted recipe from a mosque, federation or platform surface, never an authority, never
  claim the user's mosque; **candidate** = surface found and dated data available, recipe not yet fitted;
  **F** = structurally closed surface or no series exists; **FALLBACK** = no surface at all — the app ships
  the fallback band (A1, below), with the one-line reason on the row.
- **Fallback bands (A1, agent-ruled 2026-11-11, T-675 #7092)**: the blanket Moonsighting fallback is amended —
  **below 45 degrees latitude the computed fallback is 18/18 Shafi** (the pair named, no body claimed,
  badged computed; 0.84 minutes closer population-weighted than MWL 18/17), **45-55 Moonsighting
  Committee computed**, **above 55 Moonsighting with its own 1/7-of-night portions**. Promise wording
  (A2 rider): authority-served countries carry the exact-as-published promise; every FALLBACK and
  unrecorded country carries the fallback clause in the badge.
- **Tier** is who publishes (authority | clerical | community | platform | fallback), independent of grade.
- **Frozen-generation precedent** (T-668 #6986): byte-identical editions across years are ONE computed
  generation relabeled — they never lift provisional to A, however many years they span.
- **null means the record is silent**, never zero. Nothing here is inferred from a neighbour or a library preset.
- **Provenance**: every row carries ticket+comment ids (`T-667 #6909 H2`) and, where one exists, the
  policy-layer object id (v2.1) or archive path. `SL v2.1 <ID>` = the object is the primary carrier.
- Regions: British Isles + Europe; Middle East + North Africa; West/Central/East/Southern Africa;
  South + Southeast + Central + East Asia (incl. Russia and the Caucasus); Americas; Oceania.
  Countries absent from this table are unrecorded: they ship the A1 fallback band by default.

Per-row fields: **Source + tier**, **Recipe** (angles/intervals/rule-form + margins + rounding),
**Asr**, **Clock**, **Evidence** (days, distinct years, multi-year verdict under the 2-3-year ruling),
**Grade**, **Surface** (endpoint + January-class or multi-year), **Defects**, **Lift** (what raises it
one grade), **Provenance**.
# REGION 1 — British Isles + Europe (45 rows)

## United Kingdom (London) — LUPT unified timetable
- **Source + tier:** Londonsalahtimes.com on the Hizbul Ulama Blackburn 1987-88 observation tables; authority.
- **Recipe:** fajr and isha are NOT formulas: fixed MM-DD integer interval tables, 366 entries each with a dedicated Feb-29 row, identical in every year. Dhuhr noon+5; asr shadow-1 AND shadow-2 each +2; sunrise/sunset ~3 min total (split degenerate between horizon-depression and margin); engine PrayTimes/Meeus-truncated core evaluated at midday; rounding recovered per field.
- **Asr:** both mithls printed; asr 1 verified against East London Mosque's own printed column.
- **Clock:** IANA civil (UK DST).
- **Evidence:** 50 years 2027-2076 (18,263 days), one recipe. Blind fit 97.8-99.5 pc exact, 100 pc within-1; publisher's own equations + recovered tables reproduce 127,838/127,841 values exactly (3 misses are 1-minute rounding boundaries); holds on 2032/2041/2058/2076. Clears the multi-year ruling trivially.
- **Grade:** A.
- **Surface:** londonsalahtimes.com; recovered tables at `census/o1f-london/out-table-nm.json`.
- **Defects:** observational tables can be verified, never predicted; any derived recipe claiming sub-minute engine detail exceeds the data. Mosque layer: Croydon ICT LUPT-exact ~85 pc with a broken December block (fajr +13..+27 drift, their table's defect); Croydon Mosque Thornton Heath prints its OWN table (mean -13.8 fajr, +33.8 Hanafi asr, +20.9 isha vs LUPT) — the "unified" brand does not bind every mosque.
- **Lift:** at top grade.
- **Provenance:** SL v2.1 `GB-LONDON-INTERVAL-TABLE`; T-667 #6945 (O1f), #6918 L5 (LUPT not a Diyanet export, dhuhr identical 365/365); T-668 #6981 (C24 LUPT uniformity: ELM 365/365 and London Central Mosque 92/92 exact).

## United Kingdom — Wifaqul Ulama
- **Source + tier:** Wifaqul Ulama (Hanafi community calendar, Blackburn); authority-tier body, community position OUTSIDE London (T-666 conflict rule: London keeps its own baked timetable, Wifaqul is the community position elsewhere).
- **Recipe:** fajr 18; isha 15; dhuhr +4, maghrib +5. High-latitude split night portions: fajr 1/2 night (nisful-layl fallback after 13 May), isha = exactly sunset + night/7 (the Moonsighting Committee portion, not a flat cap). NOT the stock MoonsightingCommittee preset; implementable in adhan-js by overriding nightPortions().
- **Asr:** Shafi per the object (body is Hanafi; the fit governs).
- **Clock:** IANA.
- **Evidence:** 365/365 within 1 minute, 2026 only. Single year, capped at provisional by #6943.
- **Grade:** provisional.
- **Surface:** Wifaqul 2026 calendar.
- **Defects:** one year; rounding directions unmeasured.
- **Lift:** a second distinct year.
- **Provenance:** SL v2.1 `GB-WIFAQUL-ULAMA`; T-667 #6919 (L4), #6893 (T-666 conflict rule).

## Ireland
- **Source + tier:** Islamic Foundation of Ireland API (feed-class, authority-adjacent) + Galway Islamic Cultural Centre custom REST (community, official).
- **Recipe:** IFI: no single angle convention (winter 16.25/15.25, summer interval caps) — data feed, not computation. GICC: 30 dated rows incl. mithl 2, date-param REST.
- **Asr:** GICC prints both mithls.
- **Clock:** IFI switches DST on WRONG DATES (Apr 1 / Nov 1 instead of Mar 29 / Oct 25; +61/-55 min on 10 rows) — a feed defect, not policy (#6927 clock register).
- **Evidence:** IFI 366 days Dublin (defective); GICC 30 dated rows.
- **Grade:** candidate.
- **Surface:** `islamicfoundation.ie/api/timetable`; GICC REST.
- **Defects:** IFI DST defect makes it unusable uncorrected; Dublin's two ICCs diverge from each other (fajr 05:40 vs 05:50); Cork is app-only.
- **Lift:** fit the GICC year (strongest Irish capture, official) and re-derive IFI with a DST correction.
- **Provenance:** T-667 #6920 (L2), #6927 (M5); T-668 #6981 (C24).

## Iceland
- **Source + tier:** Felag muslima a Islandi (Islamic Cultural Centre of Iceland); authority-tier national body.
- **Recipe:** fajr 14.2 / isha 14.0 with the high-latitude portion taken from the angle itself: fajr max(angle crossing, sunrise - (14.2/60) x night), isha min(angle crossing, sunset + (14.0/60) x night); the December +90 display rule is DROPPED (fires on zero days in any year); displaySuppress class, the angle-derived portion.
- **Asr:** no plain madhab — the asr column is a generator sweep (declination lags the date ~2 days), reaching the capital only as a 12-minute early winter reading.
- **Clock:** IANA.
- **Evidence:** three years (2025-2027), two cities, 2,190 rows, 100 pc within one on every row; the years are computed, not copied (fajr identical on only 82/365 days between 2025 and 2027).
- **Grade:** A (v2.5, T-675 #7092).
- **Surface:** felagmuslima.is API (Next.js bundle, aladhan-format output).
- **Defects:** asr quirk unmodelled; single year; site-rebuild risk (the assic.fi lesson: a rebuilt site can erase every prayer URL).
- **Lift:** second distinct year; resolve the asr quirk against a second city.
- **Provenance:** SL v2.5 `IS-FELAG`; T-667 #6920 (L2); T-675 #7092 (O1k-D3 deep3; D14 ruled a).

## France
- **Source + tier:** GMS Strasbourg (community); Eyyub Sultan Colmar (Diyanet-temkin side, publishes nothing dated); Marseille/Lyon/Lille mosques mawaqit-hosted (platform); Fazilet Profile A covers French cities (platform, see the Fazilet rows below).
- **Recipe:** GMS is conventions-only: sunrise = adhan-7 and dhuhr +5 are stable; fajr and isha are SEASONAL SWEEPS (implied 18→12 deg fajr, 16→11.5 deg isha, consistent with a night/5 summer clamp) that NO frozen adhan parameter set expresses.
- **Asr:** Shafi per object.
- **Clock:** IANA.
- **Evidence:** monthly PDFs 2025-2026 (365 days span); sweeps consistent across the sample.
- **Grade:** candidate (conventions-only; C18's verdict: do not build a frozen object).
- **Surface:** GMS monthly PDFs at a year-pattern URL. Parse traps: the month draws in TWO PANELS SECOND HALF FIRST (remap row order); apex mosquee-strasbourg.com serves a mismatched TLS cert, use www.
- **Defects:** the recorded Strasbourg 12-degree practice belongs to the OTHER group's mosques, not this PDF; no national body publishes a timetable.
- **Lift:** a publisher method statement or a capture set the sweeps can be fitted against; otherwise France stays the Fazilet-A community default.
- **Provenance:** SL v2.1 `FR-GMS`; T-668 #6976 (C18), #6960 (C3); T-667 #6938 (M4f).

## Belgium
- **Source + tier:** Executif des Musulmans de Belgique (EMB); authority. Mosque layer mawaqit-hosted.
- **Recipe:** the 17-degree isha object is REFUTED (outside-window isha is 18.0, RMS 0.52; 17 misses by 7.0); the summer window is MEASURED, not lat-45: isha 05-01..05-21 flat 23:26, 07-26..08-11 flat 23:33, middle 65 days latitude-45 18 deg at Brussels longitude (RMS 1.8); fajr 05-10..05-30 and 07-10..08-01 flat 03:24, 05-31..07-09 an arc at 44.75/19.1 floored at 03:24; maghrib +2; 18 published per-city deltas (Gent +3, Liege -5, Brugge +5, ...).
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** 365 days; two editions held, 363/365 month-day rows identical outside the two baked DST days — year-2 is NOMINAL, the frozen-generation precedent caps the object at provisional (D3 ruled a).
- **Grade:** provisional (held).
- **Surface:** EMB calendar (three languages, rule published on the same page as the times).
- **Defects:** any build must carry the plateaus, not a lat-45 formula; Sanabel's 2026 is byte-identical to EMB (two publishers, one table); the city deltas confirmed verbatim incl Luxembourg City -6 (which is NOT the LU-SHOURA recipe).
- **Lift:** a differently-computed edition (a real second year).
- **Provenance:** SL v2.5 `BE-EMB`; T-667 #6911 (I2); T-668 #6960 (C3); T-675 #7092 (O1k-F9 fit9; D3 ruled a).

## Netherlands
- **Source + tier:** 2023 national consensus (published scheme) + Essalam Rotterdam's own dated rolling table (community).
- **Recipe:** VIN (Vereniging Islamitische Nederlanden) declaration of 2 Dec 2023, CLOSED ON MEASUREMENT: 18/17 with fajr floored 03:30 and isha capped 23:30; eight city-years (Amsterdam, Rotterdam, Utrecht, Ypenburg, 2025+2026) reproduce it at RMS 0.64-0.78; the caps bind 95-104 days per prayer — wider than the declaration's "end of May, June, July".
- **Asr:** Shafi (the declaration is silent; the city-years fit Shafi).
- **Clock:** IANA.
- **Evidence:** 2,190 rows, two distinct years, one declared recipe; year-2 is real, not a reprint (the editions differ cell-wise).
- **Grade:** A (v2.5, T-675 #7092) — CONTESTED: WORLD-TABLE-DIFF 2.1 row 7 writes provisional (measured); the fit index governs, the owner rules the A at ratification.
- **Surface:** the VIN declaration + the four cities' tables.
- **Defects:** the free isha fit returns 16.96-16.98 (17 holds within print noise).
- **Lift:** at top grade if the A stands.
- **Provenance:** SL v2.5 `NL-VIN`; T-665 #6882, T-666 #6893; T-668 #6960 (C3); T-675 #7092 (O1k-W9 benelux2, O1k-F9 fit9; D14 ruled a).

## Luxembourg
- **Source + tier:** Shoura/ACM (Assemblee de la Communaute Musulmane du Grand-Duche), shoura.lu 2026 calendar; community (the fit index's tier governs over the wtdiff's authority reading).
- **Recipe:** a genuine 13/13 pair — fajr 13.0 (306/365 exact), isha 12.9 nearest (136/365 exact, worst 3; carries a seasonal wobble +1..+3 Jan-Jun no single angle absorbs), asr Shafi +1.5 floor, maghrib +1 floor; MWL and ISNA refuted at 429/2190 each, UOIF 12/12 at 806/2190 — neither the Belgian 18/18 next door nor the French fixed-interval table.
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** 365 dated rows (French, Hijri day and Jumou'a marks).
- **Grade:** community (v2.5, T-675 #7092).
- **Surface:** shoura.lu 2026 calendar.
- **Defects:** printed defects carried as feed exceptions: March maghrib +6 all month; 2026-03-29 maghrib/asr left on CET; 2026-10-25 fajr unshifted; 2026-10-02 dhuhr typo; 11-18/11-19 with October-stamped keys; 2025 and 2027 editions both 404.
- **Lift:** a 2025 or 2027 edition, or a second publisher.
- **Provenance:** SL v2.5 `LU-SHOURA`; T-675 #7092 (O1k-W9 benelux2, O1k-F3 fit3; D14 ruled a — new row).

## Diyanet European unified scheme (DITIB Germany, IFiS Sweden, unified European calendars)
- **Source + tier:** Diyanet via DITIB Religionsbeirat (July 2022 adoption, effective January 2023); authority, transnational.
- **Recipe:** 18/16 (the 2023 European scheme, confirmed at served-table level — the published 18/17 prose is refuted) wrapped in the DOMESTIC temkin MEASURED: sunrise -6.5, dhuhr +5.5, asr +3 (shadow 1), maghrib +6.5; fajr at about night/5 (0.199-0.205) and isha on an 80-minute plateau (0.178-0.182 x night) in the high-latitude window; 2023 amendment abolished summer tathbit; imsak = fajr; nearest.
- **Asr:** Shafi (the adoption changed isha only).
- **Clock:** IANA per installation country.
- **Evidence:** the named gap closes: Koeln, Berlin and Frankfurt full years (1,095 rows, one year), served by the portal; the stock Turkey preset scores isha 0/365 and 17 deg misses by 7 minutes.
- **Grade:** provisional (v2.5, T-675 #7092) — F lifted; year-2 is the only remaining lift.
- **Surface:** DITIB and IFiS printed calendars.
- **Defects:** rounding (floor) is now measured with the temkin set; one re-read after the portal rolls is the year-2 path.
- **Lift:** year-2 after the portal rolls.
- **Provenance:** SL v2.5 `EU-DIYANET-UNIFIED`; T-667 #6925 (M1), #6918 (L5), #6911 (I2); T-675 #7092 (O1k-F4 fit4; D14 ruled a).

## Austria
- **Source + tier:** IZW Vienna (community) + IGGÖ published recipe (authority scheme: 18/16 + full temkin + high-latitude rules, the most complete publication found in T-666).
- **Recipe (IZW, fitted):** custom engine — standard sunrise -0.833, dhuhr +5, maghrib +3, asr Shafi +2-3, plus hand-tuned seasonal sweeps: fajr 15.0-15.5 cold half with a 12.5 trough; isha 15.8-15.9 winter with an 11.4 trough and a 16.2 autumn plateau. THE FROZEN-CLOCK CLAIM IS FALSE: both artifacts (HEFT print and display XLSX, identical solar values) APPLY DST (+60 exactly on 2026's DST dates).
- **Asr:** Shafi +2-3.
- **Clock:** IANA (a fixed-UTC+1 rendering would diverge 45-94 minutes Apr-Oct; dstMode fixed is FORBIDDEN for IZW).
- **Evidence:** 365 days, one year.
- **Grade:** provisional.
- **Surface:** izwien.at permanent calendar 2025-2028.
- **Defects:** the declared 2029 correction is day-of-year slot alignment after leap-year 2028, not solar drift; encoding needs the frozen table with baked DST dates or a custom engine.
- **Lift:** second edition year; or fit the IGGÖ published recipe as the authority alternative.
- **Provenance:** SL v2.1 `AT-IZW`; T-668 #6972 (C16); T-666 #6893.

## Switzerland
- **Source + tier:** IZRS (federation); published seasonal scheme.
- **Recipe:** seasonal 12.5/13 with Isha 12 (published).
- **Asr:** record silent.
- **Clock:** IANA.
- **Evidence:** publication only; nothing fitted.
- **Grade:** candidate.
- **Surface:** IZRS publications.
- **Defects:** unfitted; seasonal pair unverified against a printed table.
- **Lift:** one city-year capture and fit.
- **Provenance:** T-666 #6893.

## Switzerland — Geneva line
- **Source + tier:** Fondation Culturelle Islamique de Geneve (fcigeneve.org, one PDF per hijri month); community — a second Swiss organisation, so "the Swiss method" is now two methods.
- **Recipe:** fajr exactly 15.0 with zero margins (the free fit returns 15.0 in each Hijri year independently), isha = maghrib + 90 on 1,022 of 1,022 rows, Shafi, nearest — a different scheme from IZRS's 12.5/13.
- **Asr:** Shafi (Hanafi is 72 minutes out).
- **Clock:** IANA.
- **Evidence:** three Hijri years (1446 323 rows, 1447 350, 1448 349), one parameter set: 90.0 pc exact and 97.3 pc within one jointly (5,964/5,964 within one excluding the one defective 1446 month).
- **Grade:** A (v2.5, T-675 #7092).
- **Surface:** fcigeneve.org hijri-month archive (the full calendar is login-gated; the archive is public).
- **Defects:** recomputation between 1447 and 1448 is NOT proven by a cell diff — the A rests on three scored years; the 1446 February poster is faulty (morning ~49 early, evening ~40 late) and excluded.
- **Lift:** a recomputation proof, or the 1449 edition.
- **Provenance:** SL v2.5 `CH-GENEVA`; T-675 #7092 (O1k-W10 iberia2, O1k-F6 fit6; D14 ruled a — new row).

## Spain
- **Source + tier:** CCIM Madrid M-30 (community; the national best available). Granada mosque prints a full hijri-month table; Barcelona Tariq's site expired.
- **Recipe:** fajr 18.25 +1 floor; sunrise -2; dhuhr +1; asr Shafi +1; maghrib +2; isha 17 +1 floor; a ±0.3 min seasonal wobble in the asr/maghrib additions explains the exact-rate drift.
- **Asr:** Shafi +1.
- **Clock:** IANA.
- **Evidence:** TWO years (2025+2026), 668 days, parameters frozen both years.
- **Grade:** A.
- **Surface:** `CCIM /Doc/Horario/<year>/<Mes>-<year>.pdf` full-year URL pattern.
- **Defects:** Madrid coverage only; no national body surface.
- **Lift:** at top grade; a second city would widen coverage, not the grade.
- **Provenance:** SL v2.1 `ES-CCIM`; T-668 #6976 (C18), #6960 (C3).

## Portugal
- **Source + tier:** hsalah.info (CIL Lisboa's own hub); community, 21 cities.
- **Recipe:** fajr 18 +1; sunrise raw; zuhr noon+5; asr Shafi; maghrib sunset+4; isha DUAL — primary 12.5 deg +1 plus a second maghrib+81 interval column (the fit artifact governs over the #6976 summary's +77; per-city: lisboa/faro/coimbra/aveiro/setubal/santarem 12.5+1, porto/braga 12+3).
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** TWO pre-published years (2026+2027), frozen 2026→2027 verified (deltas ≤1.6 pp, MAE 0.01 min); 8 cities fitted, 93.2-97.3 pc within-1. Clears the multi-year ruling.
- **Grade:** A.
- **Surface:** hsalah.info `<slug>_<year>.pdf` annual pattern — the cheapest multi-year archive in the census (prior years enumerable).
- **Defects:** CDN 403 = absent (calibrated, not throttled); ~50 pc exact is the sub-minute ephemeris ceiling, within-1 ≥95 pc.
- **Lift:** at top grade.
- **Provenance:** SL v2.1 `PT-HSALAH-HUB`; T-668 #6976 (C18), #6960 (C3); archive `census/c18-yeartables/fit/pt.json`.

## Italy
- **Source + tier:** UCOII national per-city prayer service (community federation). Rome Grand Mosque publishes NO Roman times: its orario page embeds the ESTONIAN centre's widget (Tallinn/Tartu, 15-degree note) and even navigates the tab to Tallinn — a known artifact.
- **Recipe:** MWL declared (18/17); dhuhr = solar noon; other margins unmeasured (null).
- **Asr:** record silent.
- **Clock:** IANA.
- **Evidence:** 30 days Rome captured, partial fit.
- **Grade:** candidate (the catalogue's "UCOII publishes no timetable" is stale — the service exists).
- **Surface:** `ucoii.org/orari-preghiera` dated monthly calendars.
- **Defects:** partial fit; UCOII is a federation, never claim a user's mosque.
- **Lift:** full-year capture and fit (one city closes provisional).
- **Provenance:** SL v2.1 `IT-UCOII`; T-668 #6960 (C3); v2.5 names UCOII an AlAdhan method-3 wrapper, community tier (T-675 #7092).

## Italy — Rome line
- **Source + tier:** Grande Moschea di Roma / Centro Islamico Culturale d'Italia (grandemoscheadiroma.org prayer page, monthly PNG); community — the mosque is the publisher.
- **Recipe:** the Grand Mosque DOES publish Roman times: fajr 19.1 (rms 0.3), isha = maghrib + 90 exact every day (sd 0.00, 30/30), shuruq sunrise -1, dhuhr noon +1, maghrib +1, asr Shafi. Rome's own scheme is nothing like the UCOII surface; the two Italian objects are never one line.
- **Asr:** Shafi.
- **Clock:** IANA (the poster prints Rome solar time and fuso; whether it follows DST in summer is unmeasured — only November is live).
- **Evidence:** one hijri-month poster (2026-11-11..12-10), 30 rows transcribed; the archive's naming variants 404.
- **Grade:** candidate (v2.5, T-675 #7092) — the "publishes nothing" defect closes.
- **Surface:** grandemoscheadiroma.org prayer page (monthly PNG).
- **Defects:** one month; a summer month would settle the DST question.
- **Lift:** the monthly series to a year.
- **Provenance:** SL v2.5 `IT-ROMA`; T-675 #7092 (O1k-W10 iberia2, O1k-F9 fit9; D14 ruled a — new row).

## Czechia
- **Source + tier:** Ústředí muslimských obcí (national table, 193 towns, 33 of them Slovak); authority.
- **Recipe:** 12/12 + margins sunrise -3.5, dhuhr +4.5, maghrib +2.5, asr margin 0 carried (the engine gap measures -0.5..-0.7 and no margin closes it), twilight rows ~0, nearest. Engine-gap caveat: their calculator is NOT adhan — our engine reaches 33-34 pc exact / 84-85 pc within-1 on both years; altitude 259 m published, likely different refraction handling.
- **Asr:** Shafi (standard shadow).
- **Clock:** IANA.
- **Evidence:** FOUR years banked (Praha 2025-2028 + Brno 2028; 2028 already served live). Margins frozen across years to 0.03-0.19 min; the 2027 switch is live with identical numbers. 2027 reproducing 2026 within 0.03 min is what a passing multi-year test looks like (#6956).
- **Grade:** A.
- **Surface:** islamweb.cz per-town, coordinates + altitude, years selectable.
- **Defects:** the residual engine difference is characterized, not closable by margin.
- **Lift:** at top grade.
- **Provenance:** SL v2.1 `CZ-CENTRUM`; T-668 #6953 (C6), #6956 (parent multi-year test), #6983 (C31 four years).

## Slovakia
- **Source + tier:** 33 Slovak towns served by the CZECH national table (authority by adoption); the muftiate's own embed is an IslamicFinder widget (platform).
- **Recipe:** Czech 12/12 for the 33 towns; the widget reads MWL 18/17 with systematic +1/+2 rounding (verified at six cities, C35).
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** inherited from the Czech fit; widget verified 6 cities.
- **Grade:** candidate.
- **Surface:** islamweb.cz town selector; muftiate embed id 776069.
- **Defects:** TRAP: the muftiate's own embed renders BIALYSTOK, not Bratislava or Warsaw; IslamicFinder carries a MISLOCATED duplicate "Poznan" id (46053709 vs city-proper 3088171) — widget city-ids need gazetteer checks.
- **Lift:** a Slovak-language own publication would create a real authority surface.
- **Provenance:** T-668 #6953 (C6), #6987 (C35).

## Poland
- **Source + tier:** muftiate embed IslamicFinder widget (platform); no own authority table on the web.
- **Recipe:** MWL 18/17, systematic +1/+2 rounding, verified at six cities (C35).
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** six cities, capture-level only.
- **Grade:** candidate.
- **Surface:** muftiate embed URL (the real authority is literally a widget).
- **Defects:** widget-class provenance; the Bialystok/Poznan gazetteer traps apply.
- **Lift:** any dated Polish authority publication; until then the widget reading stands verified.
- **Provenance:** T-668 #6953 (C6), #6987 (C35).

## Hungary
- **Source + tier:** MME (Muslim community's own gazetteer service); community with national coverage.
- **Recipe:** 18/17.3 confirmed on 9 towns × 5 days (84/90 cells exact, worst 1 min); asr Shafi; MAGHRIB CARRIES A DELIBERATE +2-3 SAFETY past sunset (now part of the object).
- **Asr:** Shafi.
- **Clock:** settlement selection is COOKIE-DRIVEN (salaattimes_city=<id>); the verification gate is a self-hosted checkbox carried by PHPSESSID.
- **Evidence:** 45 town-days; the 5-day window CANNOT WIDEN (16 params probed, all ignored; no AJAX, server-rendered; no host archive).
- **Grade:** candidate.
- **Surface:** MME gazetteer of 3,160 settlements with ids + coordinates (Budapest districts separate).
- **Defects:** a year requires a daily cron — one visit per settlement per day, dedupe on (settlement, date).
- **Lift:** one settlement-year of daily captures closes provisional.
- **Provenance:** T-668 #6978 (C29); T-667 #6938 (HU is an unsampled Fazilet boundary).

## Slovenia
- **Source + tier:** Islamska skupnost v Republiki Sloveniji (ISSI) via vaktija.si; authority.
- **Recipe (C28 returned):** SEASONAL angles, not fixed — fajr 18.91+0.25cos(doy-94); isha 16.62+1.32cos(doy-346); margins sunrise -6, dhuhr +2, maghrib +6; Shafi; sunrise/sunset published at -1.78/-1.77 deg depression (solarBase below the standard horizon — a schema case).
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** the API's table matches the community's own Vaktije_2026.pdf at 362/366 cells exact over 61 overlap days; THE 2025 EDITION IS IDENTICAL TO THE MINUTE. Two identical editions = ONE computed generation under the frozen-generation precedent (#6986), so the multi-year claim stays unproven even though C28 wrote "multi-year banked" — flagged for the owner; the C44 patch set will rule.
- **Grade:** provisional.
- **Surface:** `vaktija.si/api/v2/feed` — whole civil year as JSON, 6 cities expressed as per-prayer minute offsets from Ljubljana; the API serves only two months and ignores all params.
- **Defects:** 6 cities only; offset encoding; the edition-identity question above; isha cluster read 95-97 min in C21 (superseded by the C28 seasonal fit).
- **Lift:** a differently-computed edition (the Kosovo ruling's own condition), or the owner ruling the identical editions as independent generations.
- **Provenance:** SL v2.1 `SI-VAKTIJA` (fitPending → C28 returned, patch pending C44); T-668 #6971 (C21), #6980 (C28), #6986 (C37 precedent), #6984 (C33).

## Croatia
- **Source + tier:** community vaktija tables (platform-fed); no authority table exists (rijaset.rs carries none for Croatia).
- **Recipe:** unmeasured as a country; the isha INTERVAL cluster reads 80-85 min across Croatian tables — a property of the tables, clustered by tradition not border.
- **Asr:** record silent.
- **Clock:** IANA.
- **Evidence:** interval-cluster measurement only.
- **Grade:** candidate (community tier is the best available).
- **Surface:** vaktija-family community tables.
- **Defects:** no fitted table; Fazilet Profile B unsampled on the RO/HU/HR/ME boundary — a third profile is not excluded.
- **Lift:** capture and fit one Croatian city-year.
- **Provenance:** T-668 #6971 (C21); T-667 #6938 (M4f).

## Bosnia and Herzegovina
- **Source + tier:** Rijaset Islamske Zajednice (authority); vaktija.ba REST, 118 locations, "Zvanična"-branded, no method page (community mirror).
- **Recipe:** 18/16 (isha settled at 16; the catalog 15.89 median superseded); temkin-shaped margins sunrise -7 (Sarajevo 611 m horizon dip, 1.71 deg early), dhuhr +1, maghrib +6 (dip, not decree — a flat national +6 over-corrects lowland towns); elevation ladder with ONE published rung (Sarajevo).
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** 30/30 official-API cross-check + 2026 median. MUST NOT BE BAKED: 2026/2030/2035 return byte-identical values — the API computes server-side; it is a cross-check, not a source.
- **Grade:** provisional.
- **Surface:** rijaset official API (monthly rows).
- **Defects:** rounding null for every row (the brief's "isha ceil?" is unanswered); one-rung ladder leaves non-Sarajevo towns unmeasured; 30 days against a full-year claim (#6912 tension, recorded).
- **Lift:** second year via monthly captures + more ladder rungs.
- **Provenance:** SL v2.1 `BA-RIJASET`; T-667 #6911 (I2), #6937 (P4 no-bake); T-668 #6971 (C21 api.vaktija.ba).

## Serbia
- **Source + tier:** Mešihat Devridaim (community; the only web path — rijaset.rs carries NO authority table); Bajrakli Belgrade mawaqit is a congregation board (dhuhr pinned 11:50), not an athan source.
- **Recipe:** Belgrade = the Novi Pazar Devridaim 2025 base + published offsets (+2/+2/0/-2/-2/-2); sunrise/asr/maghrib capped at ~66 pc within-1 because whole-minute city offsets cannot track the seasonal twilight difference.
- **Asr:** per Devridaim base.
- **Clock:** IANA.
- **Evidence:** ONE edition (full year 2025/1446) — multi-year closed per C28.
- **Grade:** candidate.
- **Surface:** Mešihat Devridaim per-city tables; the offset table lost 2 columns in the render and needs a clean re-read.
- **Defects:** one edition; offset-table render damage.
- **Lift:** a clean re-read plus a 2026 edition would open the multi-year path.
- **Provenance:** T-668 #6971 (C21), #6980 (C28); T-667 #6938 (RS is Fazilet Profile B).

## Montenegro
- **Source + tier:** Islamska Zajednica u Crnoj Gori (authority); two community tables contradict each other by 5-6 min — both stay on the record.
- **Recipe:** fitted band 19.25-19.4 fajr / 17.75-17.85 isha (Egypt-family; the declared 19.5/17.5 is nearly exact — nearer than the Egypt preset); 19.4/17.8 is the upper fitted edge and the band must travel with it. ALL Montenegrin tables read isha interval 88 min — a table property.
- **Asr:** Shafi (implied by the Egypt-family fit).
- **Clock:** IANA.
- **Evidence:** two agents independently; day count unstated.
- **Grade:** provisional.
- **Surface:** national table (Podgorica anchor).
- **Defects:** band, not point; margins and rounding entirely unmeasured; the community contradiction stands.
- **Lift:** a day-counted fit and the margin set.
- **Provenance:** SL v2.1 `ME-IZMR`; T-667 #6915 (J1), #6912; T-668 #6971 (C21).

## Albania
- **Source + tier:** KMSH (Komuniteti Mysliman i Shqipërisë); authority.
- **Recipe:** clean 18.0/17.0 at Tirana across all 365 days (imsak MAE 0.13, isha 0.93), cross-checked against the live API to the minute. The earlier ~17/16.5 derivation is refuted.
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** 365 days, one edition (2026).
- **Grade:** provisional.
- **Surface:** KMSH official 2026 PDF + live API.
- **Defects:** single edition.
- **Lift:** the 2027 edition.
- **Provenance:** T-667 #6915 (J1 respawn).

## Kosovo
- **Source + tier:** Bashkësia Islame e Kosovës (BIK); authority.
- **Recipe (C37 corrected):** base angles 18.9 fajr (imsak = FAJR at 18.9 deg) and isha 17.0-17.05 (time-equivalent); margins IN EVERY EDITION fajr +1 / sunrise -6 / dhuhr +4 / asr +6 / maghrib +8 / isha +7 — C37 caught C28's prose typo (its row printed isha +7 / the prose-literal reading scores 54 pc within-1, not 61 pc); sabah = imsak + 20 on all 730 days printing it; a 3-term annual correction transfers at equal quality; Shafi.
- **Asr:** Shafi.
- **Clock:** each edition carries its year's own DST calendar; every differing cell across editions is exactly 60 minutes on a DST-date edge.
- **Evidence:** FOUR editions 2023-2026 aligned on MM-DD: 6,492 of 6,492 non-DST cells BYTE-IDENTICAL → one computed generation relabeled four times; the failure mode the 2-3-year ruling exists to catch measures ZERO.
- **Grade:** provisional (multiYearProven FALSE by the frozen-generation precedent, same as Jamiat and Bosnia).
- **Surface:** official BIK yearly PDFs (31 pp, text layer) + 7 place offsets (Sharri +2, Presheva -2, five at -1); hand-maintained seasonal bias 4-6 min on sunrise/asr/dhuhr.
- **Defects:** the WordPress widget is BANNED as a source (2020 rows, sabahu = fajr_jamah = begins+30, Tirana-longitude import, broken DST — the mechanism that produced the refuted "seasonal curve 13.2-15.9" reading).
- **Lift:** only a differently-computed edition lifts the grade.
- **Provenance:** T-668 #6986 (C37), #6980 (C28), #6915 (J1 verdict overturned); archive `census/c37-kosovo/`.

## North Macedonia
- **Source + tier:** IVZ (Islamska Verska Zaednica) — UNVERIFIABLE, and the negative is specific: prayer times exist ONLY in the printed Takvim and IVZ's own app (Play publisher IVZ, updated 2026-02-18), never on the web; homepage widget is one undated day disagreeing with itself across three crawls (41 min L1 from any standard method); every APK mirror blocked; the magazine PDF is glyph-subset encoded.
- **Recipe:** Fazilet's Skopje fit is the ONLY characterisation of Macedonian practice at all (imsak ~20.5 effective, isha 18.75) — Profile B; its status upgraded from "community alternative" to "only available reading".
- **Asr:** per Fazilet fit.
- **Clock:** IANA.
- **Evidence:** none of IVZ's own; Fazilet fit only.
- **Grade:** candidate (community reading; cause = publication channel, not research failure).
- **Surface:** none (print + app).
- **Defects:** no route to IVZ's own numbers without the print or the app.
- **Lift:** a scanned Takvim transcription.
- **Provenance:** T-667 #6939 (P2), #6915, #6938 (M4f).

## Greece (Athens)
- **Source + tier:** Athens state mosque (authority-adjacent); publishes RAMADAN ONLY — all 475 media items enumerated, nothing else exists.
- **Recipe:** fajr 18.0; isha = maghrib + 82 (C21) / equivalently 18.0/17.0 with +1/+1 margins fits 174/174 within-1 over the window (C28) — a profile distinct from both the community mosque (18/17) and KKTC.
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** Ramadan windows only; the year-round question is UNANSWERABLE from evidence (18.0 and 17.05 are time-equivalent in the Feb-Mar declination band).
- **Grade:** provisional (window-class evidence).
- **Surface:** state mosque Ramadan PNGs (labelled transcription).
- **Defects:** no non-Ramadan capture exists; needs one to test seasonality.
- **Lift:** a non-Ramadan capture.
- **Provenance:** SL v2.1 `GR-ATHENS`; T-668 #6980 (C28), #6971 (C21); T-667 #6920 (L2).

## Greece (Komotini)
- **Source + tier:** Komotini muftiate (authority, Western Thrace); Diyanet lineage with the Fazilet signature.
- **Recipe:** 18/17 confirmed at the city's TRUE coordinates (41.1194, 25.4036) — the marathon's 16-18 deg spread was coordinate + margin confusion; anchors carry sunrise -7, noon +5, maghrib +6.
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** fit without a restated day count.
- **Grade:** provisional.
- **Surface:** muftiate tables.
- **Defects:** day count unstated.
- **Lift:** a day-counted year.
- **Provenance:** SL v2.1 `GR-KOMOTINI`; T-667 #6920 (L2).

## Bulgaria
- **Source + tier:** Grand Muftiate of Bulgaria (grandmufti.bg); authority.
- **Recipe:** fajr 18.25 (MAE 0.22, the sharpest night fit), isha 17.25; margins sunrise -8 / noon +5 / asr +5 / maghrib +8 (Diyanet family; the marathon's ~17/17 resolves to 18/17 + margins).
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** 92 days Sofia.
- **Grade:** provisional.
- **Surface:** grandmufti.bg.
- **Defects:** EVERY non-Sofia town on the site is the same base row longitude-shifted — only Sofia is locally correct; the national table is broken by construction outside the capital.
- **Lift:** per-city rows from the Muftiate, or Sofia year-2.
- **Provenance:** SL v2.1 `BG-SOFIA`; T-667 #6920 (L2).

## Norway — Rabita line
- **Source + tier:** Det islamske forbundet (Rabita/IRN numbers); community (one line of Norway's LIVE SCHISM).
- **Recipe:** 16/15, matching IRN's national numbers.
- **Asr:** record silent.
- **Clock:** IANA.
- **Evidence:** Oslo 30 rows archived.
- **Grade:** candidate.
- **Surface:** rabita.no/bonnetider (16/15).
- **Defects:** margins unmeasured; the schism is unmapped at mosque level.
- **Lift:** fit + the mosque-mapping lane.
- **Provenance:** SL v2.1 `NO-RABITA`; T-668 #6953 (C6).

## Norway — Mawaqeet network line
- **Source + tier:** mawaqeet.no network; community (the rival line; publishes articles REFUSING the IRN table).
- **Recipe:** 18/15, full-year XLSX per place, both Asr schools, 100+ places.
- **Asr:** both schools.
- **Clock:** IANA.
- **Evidence:** 4 cities × 365 archived.
- **Grade:** candidate.
- **Surface:** mawaqeet.no XLSX per place.
- **Defects:** recipe unfitted; schism unmapped — a Norwegian lane must map which mosque follows which network.
- **Lift:** fit the archived 4×365; the mosque map.
- **Provenance:** SL v2.1 `NO-MAWAQEET`; T-668 #6953 (C6).

## Norway — Jamiat line
- **Source + tier:** Jamiat Ulama Norway / islamweb.no; community — the third line, beside Rabita 16/15 and Mawaqeet 18/15.
- **Recipe:** interval-table form: fajr = sunrise - F[day] (43-106 min over 64 integer values), isha = maghrib + I[day] (42-101 min over 60), both capped at 1/7 of night through summer, city-independent across seven cities; solar columns dhuhr +5.5, maghrib +5.5; Hanafi asr. fit8 identifies the line as the Moonsighting Committee Worldwide recipe (fajr 253/365 exact at Oslo under MC angles; isha MC +3.5) — the first proven real-world MCW publisher.
- **Asr:** Hanafi (MCW line; Skien alone fits Shafi — a one-city anomaly).
- **Clock:** IANA.
- **Evidence:** seven city-years (2025-2027), 2,555 rows, 730/730 integer F/I offsets, the curve identical across all of them.
- **Grade:** community (v2.5, T-675 #7092).
- **Surface:** islamweb.no interval table (seven cities).
- **Defects:** the F/I curve fits no single angle (best 11.9 deg, rmse 5.9 min) and no fixed fraction — the interval curve is the faithful encoding.
- **Lift:** community ceiling.
- **Provenance:** SL v2.5 `NO-JAMIAT`; T-675 #7092 (O1k-F4 fit4, O1k-F8 fit8; D14 ruled a — new row; Norway becomes a three-publisher mosaic).

## Sweden
- **Source + tier:** IFiS Stockholm (community; EU-DIYANET scheme member, 18/16 exact) + Imam Council published 18/17 + third-of-night (published scheme) + the mosque layer (Angered + Göteborg).
- **Recipe (SE-MOSQUE):** ONE recipe across three cities (Stockholm, Uppsala, Göteborg; Angered byte-equal Göteborg on all 365 days) on the IF 18/16 line, and the mechanism is Diyanet's engine: sunrise -6.5, dhuhr +5.5, maghrib +6, Shafi — identical to the Koeln control. The record's "January fajr frozen 06:25" is corrected: a smooth V with a solstice plateau (the Diyanet night/5 shape), NOT a freeze and NOT frozenLatitude45 (fits 0/118 days). jamaah rules carried beside the athan policy (juma 13:10 summer / 12:10 winter).
- **Asr:** record silent for the mosque layer.
- **Clock:** IANA.
- **Evidence:** the IF national table serves 111 cities; fit8's one-recipe finding across three cities; IFiS validated exactly (L5).
- **Grade:** candidate (held).
- **Surface:** angered.se / Göteborg mosque PDF.
- **Defects:** the "three positions" reduce to one plus one: the mosque layer follows the IF 18/16 line; Sunni Centret alone diverges (+7 sunrise, +8 isha on the same base).
- **Lift:** year-2 on the IF line.
- **Provenance:** SL v2.5 `SE-MOSQUE`; T-668 #6953 (C6); T-667 #6918 (L5); T-665 #6882; T-675 #7092 (O1k-F8 fit8, O1k-W12 nordics2; D14 ruled a).

## Finland
- **Source + tier:** rukousajat.fi portal (community) + Helsinki Islamic Center override (community).
- **Recipe:** portal 18/17; the mosque OVERRIDES isha — stated maghrib+85, observed 19:30 unreconciled.
- **Asr:** record silent.
- **Clock:** IANA.
- **Evidence:** 30 rows portal.
- **Grade:** candidate.
- **Surface:** rukousajat.fi + Helsinki mosque sheet.
- **Defects:** the stated/observed isha gap is open.
- **Lift:** reconcile the Helsinki isha; fit the portal year.
- **Provenance:** SL v2.1 `FI-PORTAL`; T-668 #6953 (C6); T-667 #6918 (L5: assic.fi unverifiable, site rebuilt).

## Estonia
- **Source + tier:** Eesti Islami Keskus (community; the census's cleanest small surface).
- **Recipe:** 15/15 with a PUBLISHED clamp/fallback pair: fajr clamp 45-120 min before sunrise; isha per-month extreme fallback maghrib+90.
- **Asr:** record silent.
- **Clock:** IANA.
- **Evidence:** 15/15 months (30 rows).
- **Grade:** candidate (published-scheme).
- **Surface:** eestiislamikeskus.org monthly tables, CSV built in.
- **Defects:** unfitted.
- **Lift:** fit the published scheme — trivially closeable.
- **Provenance:** SL v2.1 `EE-EIC`; T-668 #6953 (C6).

## Denmark
- **Source + tier:** three Copenhagen mosque lines, no authority register; community.
- **Recipe:** Copenhagen splits three ways: Khair al Bariya 18/16, Mawaqeet 18/15, salah.dk 15/15, with Imam Ali on the Tehran family (17.7/14.5) and DIT 15+maghrib+97. The record's 15-degree day-fit came from salah.dk, the outlier — it survives as fact but NOT as representative: the capital's mosques read 18/16 and Tehran-family.
- **Asr:** record silent.
- **Clock:** IANA.
- **Evidence:** 456 rows held across the lines.
- **Grade:** candidate (v2.5, T-675 #7092) — WORLD-TABLE-DIFF 2.1 row 22 governs the row text over the JSON's stale FALLBACK.
- **Surface:** khairalbariya.dk, mawaqeet.dk, salah.dk.
- **Defects:** no national body; the three lines disagree on the twilight pair.
- **Lift:** fit one line's year (the 18/16 line matches the EU-Diyanet scheme).
- **Provenance:** T-667 #6920 (L2), #6924, #6953 (C6); T-675 #7092 (O1k-F8 fit8, O1k-W12 nordics2; D14 ruled a).

## Latvia
- **Source + tier:** Latvijas Islama Kulturas Centrs (likc.lv/prayer-times/); community national centre.
- **Recipe:** published seasonal scheme, no dated table: UOIF 12/12 summer, ISNA 15/15 winter, Shafi — both settings visible on the same day via the centre's IslamicFinder embeds; a seasonal swap of exactly the kind a frozen parameter set cannot express.
- **Asr:** Shafi (the embeds carry shafi in their path).
- **Clock:** IANA.
- **Evidence:** 6 rows (Riga, Daugavpils, Ventspils at 15/15 and 12/12, 2026-11-10); no Latvian mosque publishes an annual file.
- **Grade:** candidate (v2.5, T-675 #7092) — the FALLBACK stub rewritten.
- **Surface:** likc.lv/prayer-times/ + today-only embeds.
- **Defects:** the seasonal swap's boundary dates are unstated by the publisher.
- **Lift:** any dated table (the country's first annual file).
- **Provenance:** SL v2.5 `LV-LIKC`; T-668 #6953; T-675 #7092 (O1k-W12 nordics2, O1k-F6 fit6; D14 ruled a).

## Lithuania
- **Source + tier:** Lietuvos musulmonu muftiatas (muftiate.lt/maldu-laikai/); authority-tier muftiate.
- **Recipe:** an 18/16 shape on a rolling week for Vilnius (2026-11-09..11-15); the Turkish Hijri labels plus the Kaunas mosque's own Diyanet link put the line on Diyanet, not a Nordic reading or a 15/15 family; fit6 reads Diyanet-family margins (sunrise -7, dhuhr +5, asr +6, maghrib +8) — a candidate reading, not a fit.
- **Asr:** unfitted.
- **Clock:** IANA.
- **Evidence:** 7 rolling rows rendered client-side.
- **Grade:** candidate (v2.5, T-675 #7092) — the FALLBACK stub rewritten.
- **Surface:** muftiate.lt/maldu-laikai/.
- **Defects:** one rolling week is all the record holds.
- **Lift:** a year, by weekly re-read or from the Diyanet Kaunas/Vilnius page (the named path).
- **Provenance:** SL v2.5 `LT-MUFTIATE`; T-668 #6953; T-675 #7092 (O1k-W12 nordics2, O1k-F6 fit6; D14 ruled a).

## Belarus
- **Source + tier:** Muslim Religious Association of Belarus (islambel.by/vremya-namazov); authority-tier national association.
- **Recipe:** unfitted capped table: fajr stops rising at 07:16 for ten days across the two year-ends while sunrise keeps moving; isha stops rising at 23:06 for thirteen midsummer days (06-21..07-03); a fit needs a cap pair, not angles alone. No method statement exists.
- **Asr:** unfitted (the asr column is uncharacterised).
- **Clock:** IANA (UTC+3 fixed civil zone).
- **Evidence:** 365 dated rows, Minsk, 2025 only — the page has not rolled to 2026 (a stale single-year snapshot).
- **Grade:** candidate (v2.5, T-675 #7092).
- **Surface:** islambel.by/vremya-namazov.
- **Defects:** unfitted; the year is stale; no method statement exists anywhere.
- **Lift:** a current-year read and a cap-pair fit.
- **Provenance:** SL v2.5 `BY-ISLAMBEL`; T-675 #7092 (O1k-W12 nordics2, O1k-F6 fit6; D14 ruled a — new row).

## Romania
- **Grade:** FALLBACK — no surface (C6 negative; RO is an unsampled Fazilet boundary, a third profile not excluded). Provenance: T-668 #6953; T-667 #6938.

## Ukraine
- **Source + tier:** DUMU (Muslim Administration of Ukraine) via islam.ua; authority.
- **Recipe:** INTERVAL-BASED, the seasonal-angle reading was EMERGENT, not real: fajr = sunrise - 100 min EVERY day of the year; isha = maghrib + 90 (Sep 11-May 21) / + 100 (Jun 1-Aug 31) with explicit dated ramps (May 22-31 and Sep 1-11, day-by-day values recorded); solarBase -2.11 deg altitude (NOT the standard -0.833 — a v2.1 schema field); dhuhr transit+5; nearest. A seasonal fajrRule CANNOT encode it (month-constant angles leave 9-12 min errors in May/Jul/Aug).
- **Asr:** Shafi +5.
- **Clock:** IANA.
- **Evidence:** Kyiv 361-365/365 within-1 on fajr/isha, Odesa 365/365; 1,095 days banked. One country-level object.
- **Grade:** provisional.
- **Surface:** islam.ua 13-city full-year calendars.
- **Defects:** Lviv's own PDF is DEFECTIVE (garbled Jul 20, hand-linearized late-Jan fajr, +60 min isha on the DST-end day) — DUMU publishes it that way; Odesa is the clean verifier.
- **Lift:** second distinct year.
- **Provenance:** SL v2.1 `UA-DUMU`; T-668 #6972 (C16); archive `census/c16-fits/`.

## Fazilet Takvimi — Profile A "World" (platform, 110 cities)
- **Source + tier:** Fazilet Takvimi (namaz-vakitleri.fazilettakvimi.com); community platform covering most of the world — the per-city content is only coordinates and timezone; it encodes as TWO policy objects, not a data feed.
- **Recipe:** imsak ~19.8 effective (18 deg + ~11 min), sunrise -3, zuhr +7, ikindi Shafi +5..7, maghrib +8 UP, yatsi ~17.8 effective.
- **Asr:** Shafi.
- **Clock:** IANA per city; EXCEPT their Morocco rows compute at UTC+0 against civil +1 (matches the ministry's own fixed-clock register entry — likely deliberate alignment, not a generator bug) and Vancouver runs UTC-7 against winter PST (a real one-off generator artifact).
- **Evidence:** 132 rows / 129 cities / 67 countries measured; the engine is unchanged in 16 years — the 2010 rules predict the live 2026 day within 2 minutes; 2010→2026 = two distinct parameter generations agreeing, multiYearProven TRUE.
- **Grade:** community.
- **Surface:** per-city server-rendered pages, no JSON API.
- **Defects:** effective pairs, not the publishers' nominal degrees (Fazilet-family generators pad sunrise ~6-8 min early and maghrib ~7-8 late); the live 2026 London engine prints SHAFI ikindi while the 2010 print was Hanafi +6 — a UK-rule-change ruling is outstanding; unsampled boundary RO/HU/HR/ME.
- **Lift:** n/a (community ceiling); the outstanding item is the London madhab ruling.
- **Provenance:** SL v2.1 `FAZILET-WORLD`; T-667 #6938 (M4f), #6922 (L3), #6915 (Fazilet-family padding caveat).

## Fazilet Takvimi — Profile B "Ottoman sphere" (platform, 19 cities: TR GR BG RS BA AL MK XK)
- **Source + tier:** Fazilet Takvimi; community platform.
- **Recipe:** imsak ~20.8 effective (reproduces the 2010 print's 20.7 sixteen years later), sunrise -7, zuhr +10, ikindi Shafi +10..11, maghrib +8, yatsi ~18.7 effective (18 deg + ~4). Profile B's temkin is larger in every row than Profile A's.
- **Asr:** Shafi (with the large temkin).
- **Clock:** IANA.
- **Evidence:** 19 cities; the switch is OTTOMAN-SPHERE MEMBERSHIP — NOT latitude (Novosibirsk/Stockholm/Tallinn sit in A) and NOT madhab.
- **Grade:** community.
- **Surface:** same per-city pages.
- **Defects:** same effective-pair caveat; each city carries its own per-prayer temkin — NO single set travels (Istanbul's on London misses ikindi by 54 minutes).
- **Lift:** n/a (community ceiling).
- **Provenance:** SL v2.1 `FAZILET-OTTOMAN`; T-667 #6938 (M4f), #6922 (L3).
# REGION 2 — Middle East + North Africa (24 rows)

## Turkey
- **Source + tier:** Diyanet İşleri Başkanlığı, domestic tables; authority.
- **Recipe:** 18/17 — isha 17 bottoms the angle scan exactly, no seasonal switch (16 gives 0/365); temkin mapping: NO temkin on imsak/yatsi (doctrine page verbatim; the folk -10 Imsak temkin refuted), -7 attaches to SUNRISE only, dhuhr +5, asr +4, maghrib +7; imsak row IS fajr (no sabah namazi row); nearest. The frozenLatitude45 thirds rule (cap Maghrib+80, 62-deg slide-down) is quoted from #6905 E5, never binds below 41 N, untested domestically.
- **Asr:** Shafi (the published İkindi is the standard shadow; the Hanafi reading is 49 minutes out).
- **Clock:** genuinely fixed +3 since 2016, expressed as the civil IANA zone — verified NOT one of the three fixed-clock users.
- **Evidence:** Istanbul + Ankara 2026 (365 days each) + Istanbul 2027 via the awqatsalah API. TWO distinct years; clears the multi-year ruling; the 2030-2076 ceiling is not published.
- **Grade:** A.
- **Surface:** Diyanet ilce tables + awqatsalah API. TRAP: rows key by ILCE CODE, not coordinates (the 9542 Kartal case) — a coordinate lookup disagrees at district level.
- **Defects:** the 62-degree slide-down and +80 cap are not re-measurable at Turkish latitudes.
- **Lift:** at top grade.
- **Provenance:** SL v2.1 `TR-DIYANET-DOMESTIC`; T-667 #6925 (M1), #6907 (F1), #6927 (M5).

## Cyprus (north)
- **Source + tier:** KKTC Din İşleri Başkanlığı (kktcdinisleri.com); authority — a SEPARATE north-Cyprus authority, not a Diyanet mirror.
- **Recipe:** fajr 17.5, isha 17.3; margins sunrise -5 / dhuhr +7 / asr +6 / maghrib +9; a per-prayer seasonal correction lifts it to 2190/2190 within-1; isha interval reads 74-78 min on the November table (table property).
- **Asr:** per fitted object (margin +6).
- **Clock:** per-edition DST.
- **Evidence:** full 2026 + 2025. THE 2025 EDITION FAILS AS-IS, PASSES ON ONE CONSTANT: every 2025 cell sits -2.16..-2.83 (mean -2.42) behind 2026 on every prayer — a single temkin-shaped additive term, not a re-fit; with shift -2.5 the 2026 recipe + correction gives 552/552 within-1.
- **Grade:** provisional, with a PER-EDITION CONSTANT WARNING on the bake.
- **Surface:** dated month HTML; `?ay=2025-06` serves past years (multi-year reachable).
- **Defects:** NEW API TRAP ON RECORD: the archive SILENTLY RETURNS THE CURRENT MONTH for pre-2023 requests (no error, no marker) — a crawler would bank 2026 data as 2019; the archive mixes at least two engine generations (Jan 2023 matches 2026; other 2023-2025 months carry the older constant).
- **Lift:** bank the per-edition constants per year; two honest editions would open A.
- **Provenance:** SL v2.1 `CY-KKTC` (surface-only → C28 fit returned, C37 year-2 verdict); T-668 #6971 (C21), #6980 (C28), #6986 (C37); archive `census/c37-kosovo/`.

## Cyprus (south)
- **Grade:** FALLBACK — closed negative (no publisher; search exhausted). Provenance: T-668 #6971 (C21).

## Palestine / Jerusalem
- **Source + tier:** Jerusalem Awqaf (Islamic Waqf); city authority — T-665's owner decision: Palestine is served via the Jerusalem Waqf.
- **Recipe:** 18/18 (MAE 1.0); published rows shuruq -3.5 and maghrib +6 (a deliberate safety margin, the Bosnia-dip order but described as safety); dhuhr floor; other rounding null.
- **Asr:** Shafi (18/18).
- **Clock:** FIXED UTC+3 YEAR-ROUND, confirmed across 3 civil DST transitions by residual flips — one of exactly three fixed-clock users; the app must shift the instant, not the zone.
- **Evidence:** 47 wayback days. #6912's full-year claim is NOT backed by the measurement.
- **Grade:** provisional.
- **Surface:** Awqaf feed (wayback-recoverable).
- **Defects:** 47 days, not a year; 5 of 6 rounding directions null.
- **Lift:** a full year (the feed allows it).
- **Defects (mosque layer):** Nazareth, Abu Ghosh and Haifa mawaqit pages are BYTE-IDENTICAL PLATFORM DEFAULTS wearing mosques' names — only Jaffa carries its own configuration (iqama +20/+15/+15/+7/+7). Technique on record: byte-identity across mosques in one city = platform default, not mosque data.
- **Provenance:** SL v2.1 `JERUSALEM-AWQAF`; T-667 #6909 (H2), #6927 (M5); T-668 #6973 (C22); T-665 #6882.

## Palestine
- **Grade:** candidate — T-665 feed-class (January-class current-year/month feed); no census wave; unfitted. Provenance: T-665 #6882.

## Jordan
- **Source + tier:** Awqaf Jordan (awqaf.gov.jo); authority.
- **Recipe:** 18/18, margins sunrise -6 / dhuhr +1 / asr +1 / maghrib +7 / isha +1 — REVISED on the fresh days (maghrib +6→+7 is a cliff: 0/10 exact at +6, 10/10 at +7 under every rounding mode), superseding the 38-day fit. Fajr 18 unique; Shafi asr confirmed; the December Fajr-16 switch is UNRESOLVED (no December day reachable).
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** 10 official days (grid server-binds exactly today+9; the date-range search throws a verbatim server-side binding bug on ANY range; the pager is frozen across 7 byte-identical pages; the annual calendar and open data hold nothing; Wayback's 14 relevant 2026 snapshots carry zero rows). Structurally closed — PROVEN, not assumed. C40 (Wayback year evidence) dispatched, NOT returned.
- **Grade:** F.
- **Surface:** awqaf.gov.jo grid (window slides daily from Nov 21 — the bake runbook's daily class).
- **Defects:** structurally closed; December switch open.
- **Lift:** C40's archive harvest, if it lands.
- **Provenance:** SL v2.1 `JO-AWQAF`; T-667 #6940 (N1f), #6983 (C31 dispatch note).

## Qatar
- **Source + tier:** ministry portal; authority.
- **Recipe:** the INTERVAL-AFTER-ROUNDING rule is exact 29/29 across both runs (every angle 12-30 deg dead); margins maghrib +1, sunrise +1, dhuhr 0; asr drifts 0..-2 across the year and NO constant margin absorbs it — the one open prayer. K1 refinement: +90 holds relative to the printed pair; against computed sunset it reads +91.
- **Asr:** Shafi (drift open).
- **Clock:** IANA.
- **Evidence:** 5 official days (2 live + 3 Wayback); portal serves one day per fetch with all date params ignored.
- **Grade:** F (structurally closed; accumulates a year only by daily fetching — the bake runbook's daily class).
- **Surface:** ministry portal.
- **Defects:** closed; asr drift open.
- **Lift:** daily-fetch accumulation; C40.
- **Provenance:** T-667 #6940 (N1f), #6916 (K1), #6924; T-665 #6882.

## Saudi Arabia
- **Source + tier:** KACST Umm al-Qura service (umqserv.kacst.gov.sa), the calendar behind the presidency's tables; authority. KACST is the only authority publishing all twelve Hijri month starts.
- **Recipe:** fajr 18.5; isha = maghrib + 120 on every Ramadan day, + 90 every other day — month-exact on the API's own Hijri boundaries (1448 Ramadan is 29 days: never assume 30), identical across three years and both cities, 88 Ramadan days, zero violations. SINGLE-FORMULATION RULE: prayers = floor(raw + 1-min margin), which is arithmetically the same minute as ceil-of-raw — a builder applying BOTH lands a minute late (scored 23.9 pc exact). Rounding down per object; margins fajr 1, sunrise 0, dhuhr 1, asr 1, maghrib 1, isha 1.
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** THREE Hijri years (1447/1448/1449) at Makkah, Riyadh and the pinned fit point (~355 rows each, zero gaps); Makkah 85.4 pc exact / 100 pc within-1 (reproduces R6 exactly), Riyadh 84.7. Season-matched controls: NOTHING else changes in Ramadan — the apparent fajr/asr dip is seasonal composition, not a rule.
- **Grade:** A.
- **Surface:** keyless GETs; ceiling explicit — yh=1501 returns 400 naming the 1318-1500 range (≈ Nov 2076). Hijri per day rides free inside the same fetch.
- **Defects:** publishes no parameters anywhere (T-666) — the recipe is derived, the digits are official; the presidency HOMEPAGE iqamah widget is DEFECTIVE (fixed 25/20/20/15/20 offsets on a mis-keyed adhan field; its Fajr iqamah equals its own sunrise row) — treat homepage iqamah as wrong at fajr/maghrib/isha.
- **Lift:** at top grade.
- **Provenance:** SL v2.1 `SA-KACST`; T-667 #6934 (S1), #6916 (K1, Makkah pinned 21.4225/39.8262), #6937 (P4 ceiling), #6933 (P3: UAQ is always the earliest calendar); T-668 #6964 (C12 Haramain: 210+ prayer-days track UAQ within 1 min, systematically earlier — Makkah 59 identical/44 early/2 late).

## Bahrain
- **Source + tier:** ministry publications (partial) — Bahrain comes closest of the Gulf to publishing parameters, but no Fajr angle.
- **Recipe:** angle-over-interval UPHELD: effective isha 17.75-18.0 band (17.75 fits 255/325 exact, 325/325 within a minute); published partials: Isha 18, Dhuhr +1 (transit), Maghrib geometry; Fajr missing.
- **Asr:** record silent.
- **Clock:** IANA.
- **Evidence:** 325-day sample (K1).
- **Grade:** provisional.
- **Surface:** ministry publications.
- **Defects:** fajr angle absent; band not point.
- **Lift:** the missing fajr angle + year-2.
- **Provenance:** T-667 #6916 (K1), T-666 #6893, T-665 #6882.

## United Arab Emirates
- **Source + tier:** General Authority of Islamic Affairs and Endowments (AWQAF), federal feed; authority, 60 areas.
- **Recipe:** 18.2/18.2 (ridge-degenerate pair — flagged: many angle pairs fit equally, a choice the data does not discriminate); margins fajr 0 / sunrise -3 / dhuhr +2 / asr 0 / maghrib +2 / isha -1 (the held 0/-3/+3/+1/+3/0 set sits one minute late on five prayers: 17.5 pc vs 64.9 pc exact); rounding: sunrise DOWN (needs Rounding.None + floor — adhan has no round-down mode), rest nearest.
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** TWO years — 2026 full + 2027 rolling horizon banked to 2027-06-05 across all 60 areas (9,360 rows; 572-day basis recorded in the object); per-area constants stable across years to 0.034 min mean, largest single-prayer delta 0.199 min. Clears the multi-year ruling (year 2 partial).
- **Grade:** A.
- **Surface:** federal feed. ACCESS SHAPE: POST with an Origin header → 20-minute JWT → GET the range with Bearer; a POST to the range path is WAF-rejected. 2028 returns an empty array (an expiry signal, not an error).
- **Defects:** the 60 area coordinate anchors are not on the board (the zone table cannot be built from the object alone); ridge-degenerate pair.
- **Lift:** at top grade.
- **Provenance:** SL v2.1 `AE-AWQAF`; T-667 #6908 (G1), T-668 #6970 (C19).

## Oman
- **Source + tier:** Ministry of Awqaf and Religious Affairs (mara.gov.om); authority — the only Gulf authority whose recipe can be re-proved on demand.
- **Recipe:** 18/18, CEIL rounding, +5 margins on dhuhr/asr/maghrib ONLY (the marathon's isha 18.5 refuted at 0/365 exact; fajr/isha/sunrise uncorrected). The FIRST grade A under the multi-year ruling.
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** EIGHT distinct years (2021-2028, 2,920 days): every column within one minute on every day, worst year 2021; per-year refit returns dhuhr +5 ceil, asr +5 ceil, maghrib +5 ceil in all eight; the banked 2028 file's 51 "23:59" dhuhr cells were an 11:59-print artefact, repaired in the fit's data.
- **Grade:** A.
- **Surface:** plain query params (year 2021-2031, CityID 0-85). Parse traps: the English page prints 12-hour afternoons; CityID=2 is ADAM, not Muscat (the runbook example used it).
- **Defects:** none load-bearing.
- **Lift:** at top grade.
- **Provenance:** SL v2.5 `OM-MARA`; T-667 #6941 (AB1), #6944; T-675 #7092 (O1k-D2 deep2; span doubled, the CityID trap recorded — D14/D15).

## Yemen
- **Source + tier:** Awqaf and Religious Guidance (Sanaa surfaces); authority. OWNER DECISION OUTSTANDING: recognised-government vs Sanaa feed choice (#6912); this object is the Sanaa surface, which is what was fitted.
- **Recipe:** 18/16 (catalog isha 15.8 superseded by 16.0); margins dhuhr +10, maghrib +10 (the catalog's city-varying +5..+10 superseded by the single +10); nearest; fajr band 17.90-18.15 and isha band 15.69-15.91 across four governorates.
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** 1,064 monthly rows all seasons; day count unstated (rows cannot convert to days without the governorate count).
- **Grade:** provisional.
- **Surface:** Sanaa awqaf monthly tables.
- **Defects:** feed choice pending; day count unknown.
- **Lift:** the feed decision, then year-2.
- **Provenance:** SL v2.1 `YE-AWQAF-SANAA`; T-667 #6909 (H3), #6912, #6882.

## Iraq
- **Source + tier:** Sunni Endowment Diwan (Diwan al-Waqf al-Sunni) app API; authority. THREE practice lines coexist: Diwan (authority), Imam Ali shrine Jafari (recorded, OUT OF SCOPE by owner ruling — a different method, not a tweak), and the Najaf city portal's Iranian-family numbers (17.7/4.5).
- **Recipe:** standing 18/17 scores 100 pc within-1 every prayer; the amended pair 18.1+1 / 16.9+1 doubles exact to ~85 pc — EITHER ships clean; isha angle-mode reconfirmed against every interval (the November sunset+80 entanglement resolved; every fixed interval 74-86 refuted at MAE 4.45). recipeVariants field carries the two parameterisations as presentation, not measurement.
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** 365/365 days from the Diwan app API (eldwanapp.jeeteak.com, found in the JS bundle; the store holds exactly 2026 — clamps outside it). Single year: grade A on the 365-day ruling, PROVISIONAL under #6943 pending year-2 (the store rolls when the Diwan rolls).
- **Grade:** provisional.
- **Surface:** Diwan app API.
- **Defects:** year-locked surface; shrine/portal lines must never be merged into the Diwan object.
- **Lift:** year-2 accrues automatically when the Diwan rolls.
- **Provenance:** SL v2.1 `IQ-DIWAN`; T-667 #6948 (N2f), #6922 (L3), #6961 (C13 three lines).

## Iran
- **Source + tier:** the national table, served by Mashhad's Astan Qods Razavi shrine endpoint (the national table in another wrapper: queried for Tehran it returns the same numbers every Iranian city page prints); authority.
- **Recipe:** fajr 17.71 (fit min=max across 30 days); maghrib at a 4.47 DEGREE DEPRESSION (a maghribRule-angle row: a consumer computing maghrib at the horizon runs minutes early); sunrise 0.84. THE TABLES PRINT NO ISHA ROW — ishaRule notPublished: render nothing; the "Isha 14" everywhere in the ecosystem is the PrayTimes Tehran preset, whose own source annotates "isha is not explicitly specified in this method" — a software default with NO Iranian publisher.
- **Asr:** record silent.
- **Clock:** IANA.
- **Evidence:** 30 days. The secondary parameter chain (17.7 via council-member testimony) is CONFIRMED as published practice.
- **Grade:** provisional.
- **Surface:** shrine POST endpoint.
- **Defects:** the Calendar Centre site is GEO-FRONTED (content channel renders near-empty shells; the 1405 PDF host interstitials on non-Iranian traffic; the 1406 annual calendar page says "in preparation" — unpublished); the dead end is narrowed to the content channel, not the whole site.
- **Lift:** a second month, or the 1406 annual publication.
- **Provenance:** SL v2.1 `IR-NATIONAL`; T-668 #6961 (C13), T-667 #6942 (AB1 probe).

## Lebanon
- **Source + tier:** Dar al-Fatwa composite feed; authority. Fixed-clock user #3.
- **Recipe:** unfitted; the feed identity is pinned to the official mosque screen; CLOCK: FIXED UTC+2 YEAR-ROUND (the #6927 register's third user).
- **Asr:** record silent.
- **Clock:** fixed UTC+2.
- **Evidence:** none fitted. SECOND WITNESS on record: Mohamad Al-Amin Beirut is the region's ONLY mosque publishing IQAMAH AS DATA (20/10/10/5/10 offsets, method stated Umm al-Qura) and sits ~7 min off the composite at maghrib.
- **Grade:** candidate.
- **Surface:** Dar al-Fatwa feed.
- **Defects:** unfitted; fixed clock must be handled as a rendering shift.
- **Lift:** a year of the composite feed.
- **Provenance:** T-667 #6927 (M5), T-668 #6964 (C12), T-665 #6882.

## Syria
- **Source + tier:** ministry policy, CLOSED AT THE SOURCE: a dated ministry statement (SANA 2025-02-28) adopts the MWL miqat for prayer/imsak/iftar, corroborated six days later by the decree making the ministry's own calendar binding on every mosque.
- **Recipe:** 18/17 + maghrib +2..3, triangulated on six days; 18-isha REFUTED at Damascus (misses 4-7 min; Islamweb's 18/18 refuted); the +2..3 maghrib margin is deliberate, not rounding (Rounding.Up moves it max 1.00 min).
- **Asr:** per MWL policy.
- **Clock:** IANA.
- **Evidence:** 6 days + documented policy; the TABLE stays unobtainable (awqaf.gov.sy dead; masjidak app SPA shell, API hosts dead; the Ramadan 1447 imsakiyya is a Telegram image album whose CDN 404s).
- **Grade:** candidate (documented policy, series unobtainable; ungraded under the 365-day ruling; NOT a research debt any more).
- **Surface:** none reachable.
- **Defects:** table unpublished.
- **Lift:** any reachable mirror of the ministry calendar.
- **Provenance:** T-667 #6939 (P2), #6924.

## Egypt
- **Source + tier:** Egyptian General Authority of Survey (ESA, the Dar al-Ifta surface); authority. The catalog's ONLY R6 category-1 source: no correction table at all.
- **Recipe:** 19.5/17.5, ZERO margins on every prayer (PRESET TRAP: the library Egyptian() preset ships dhuhr +1 and must be ZEROED — re-proven 71/92 vs 0/92), nearest, 100 pc of days within one minute at raw geometry. Egypt DST schedule verified empirically (2023 resolves ONLY under the DST window — a positive check on dstMode iana).
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** 2026 full year 365/365 within-1 (exact 63-92 pc, maghrib 92 pc) PLUS 48 distinct Cairo days 2022-2026 recovered from Wayback (15 in 2025), every residual 0-1 min — FIVE distinct years of spot evidence; the multi-year ruling is satisfied on distinct years even though 2026 stays the only full year.
- **Grade:** A.
- **Surface:** monthlymwaket.aspx postback page driven by real selects. REPLAY RECIPE: https scheme + browser UA + the EXACT original URL incl. :80 — a plain replay returns a Vodafone block page; monthlymwaket was NEVER archived (25 empty shells). 82 city options, not 78.
- **Defects:** the printed Hijri column disagrees with the announcing body INSIDE one country: ESA's table starts Ramadan 1447 on 2026-02-18 (Umm al-Qura's date) while Dar al-Ifta announced 2026-02-19 — option C overrides must track the ANNOUNCING BODY, never a timetable's own Hijri column.
- **Lift:** at top grade.
- **Provenance:** SL v2.1 `EG-ESA`; T-667 #6941 (AB1), #6983 (C31 five-year freeze), #6916 (K1), #6933 (P3).

## Libya
- **Source + tier:** Awqaf ministry table, via the Muazzin Libya app extraction (attribution carried); authority.
- **Recipe:** fajr 18.15 -1 / isha 18.1 +1 / +4 / +4 (the 19-day fit's 18.5/18.0 was the ridge EDGE — amended).
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** 366 rows; the year empirically identified as 2026. Single year → provisional under #6943 (year-2 via the same channel).
- **Grade:** provisional.
- **Surface:** Muazzin Libya app extraction.
- **Defects:** derived channel, not the ministry's own web.
- **Lift:** year-2 through the app.
- **Provenance:** SL v2.1 `LY-MUAZZIN`; T-667 #6948 (N2f).

## Tunisia
- **Source + tier:** Institut National de la Météorologie (INM, Ministry of Transport) — the authority is a METEOROLOGICAL SERVICE, not a religious body: label by the product, not the ministry.
- **Recipe:** 18.1/18.1 (the seven-year fit; the held 18.0 was the single-year reading); margins dhuhr +7 round, maghrib +2 rounded up; PER-COLUMN ROUNDING corrected: fajr/isha/dhuhr nearest, maghrib rounded up, asr floor (the held floor/ceil mix was the object's largest single error). CANONICAL MISSING-FIELD CASE: Tunisia prints NO sunrise row at all — derive nothing for display; the app's sunrise row must come from the computation and be labelled as computed.
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** seven years 2020-2026, 2,557 days, one frozen recipe; all five columns within one minute on 94.2 pc of days, never below 93.2 in any year; 2025 is a recomputation (133/365 rows repeat 2024), so the span is not a reprint.
- **Grade:** A (v2.5, T-675 #7092).
- **Surface:** INM tables; meteo.tn is TODAY-ONLY per delegation (no month door — an annual harvest needs daily fetches).
- **Defects:** STORAGE BUG (verify3): the frozen recipe scores 94.21 pc with the corrected modes and 81.8 pc under the stored mode — fix any stored mode before a build reads the object.
- **Lift:** at top grade.
- **Provenance:** SL v2.5 `TN-INM`; T-667 #6909 (H3), #6911 (I3), #6941 (AB1 surface note); T-675 #7092 (O1k-D2 deep2, O1k-V3 verify3; D14 ruled a).

## Algeria
- **Grade:** candidate — ministry feed known (marw.gov.dz) but UNREACHABLE at probe (#6941); no series; no fit. T-665 carried it January-class feed. Provenance: T-665 #6882, T-667 #6941.

## Morocco
- **Source + tier:** Ministère des Habous et des Affaires Islamiques; authority. Fixed-clock schema user #1 ('fuseau:GMT' in the ministry's own schema).
- **Recipe:** 19/17 (fajr 19 re-verified on 117 days, every prayer within a minute; isha 17 measured 16.85 at the anchor); margins fajr -1 / sunrise -3 / dhuhr +5 / asr +1 / maghrib +4 / isha 0 (ITL's maghrib +5 is wrong by 1-2 minutes daily); fajr floor (93 pc of days), rest nearest.
- **Asr:** Shafi.
- **Clock:** CORRECTION (C31): the SHEETS PRINT UTC+1 CIVIL TIME AND IGNORE THE RAMADAN CLOCK CHANGE — on 1 Ramadan 2024, when Morocco runs UTC+0, the sheet still prints civil times. The object's fixedOffsetMinutes: 0 note is corrected to CIVIL-CLOCK-FOLLOWING. The ministry's own 'fuseau:GMT' schema field stands as the register's record of the declared clock; Fazilet's UTC+0 Morocco rows align with the declared clock, likely deliberate.
- **Evidence:** THREE years — 2026 (117 days) + pre-rebuild month tables from Wayback (150 days, 2024/2025, five cities incl. Laayoune in the south); recipe, clock and anchor frozen across years; margins shifted HALF A MINUTE (as likely the rebuild as a tweak — exactly the between-year class the ruling watches).
- **Grade:** A — unconditional since D5 ruled a (T-675 #7092): the ministry's rebuilt portal (data/horaires-2026-MM.js, 190 cities, fuseau:GMT, Oct and Nov 2026 live) reproduces the census recipe 100 pc within 1 minute on Rabat's November rows — the evidence the condition named, on the publisher's own domain; Casablanca and Laayoune parsed to disk.
- **Surface:** the rebuilt ministry portal (data/horaires-2026-MM.js, 190 cities); /prieres/ confirmed dead (404).
- **Defects:** the Ramadan-clock interaction is a documented display rule; rounding is a 93 pc share, not a rule.
- **Lift:** at top grade.
- **Provenance:** SL v2.5 `MA-HABOUS` (clock field superseded by #6983); T-667 #6909 (H3), #6911 (I3), #6927 (M5), T-668 #6983 (C31), #6938 (M4f); T-675 #7092 (O1k-8 mideast; D5 ruled a).

## Western Sahara
- **Grade:** FALLBACK — no own publisher; coverage rides inside the Morocco fit (Laayoune is one of the five Wayback cities). Provenance: T-668 #6983 (C31), T-665 #6882.

## Sudan
- **Source + tier:** Ministry of Religious Affairs (ministry-imprinted imsakia); authority. The ministry web domains stay dead; the artifacts survive as Facebook images.
- **Recipe:** fajr 18.87 (18.57-19.20); maghrib at the horizon (the 1447 sheet reads sunset+0.5); ISHA = MAGHRIB + 90 IN ALL 30 ROWS; asr Shafi; the WHOLE TABLE sits 8 min ahead of Khartoum's meridian (single national reference or padding — angles unaffected, measured against the table's own noon). Structural agreement across sheets: maghrib is sunset, isha is an interval (the 1447 sheet prints NO isha column).
- **Asr:** Shafi.
- **Clock:** IANA (table offset noted above).
- **Evidence:** TWO imsakias (ministry 1446 + Khartoum state 1447, 30 rows each) — independent structure agreement. Fitted family pending more years.
- **Grade:** provisional.
- **Surface:** ministry-imprinted Ramadan imsakia images (transcribe cleanly).
- **Defects:** image-only; Ramadan-only artifacts.
- **Lift:** a year-round ministry table or more imsakias.
- **Provenance:** SL v2.1 `SD-MINISTRY`; T-668 #6961 (C13); T-665 #6910 (Sudan confirmed unfindable → now fitted family).

## Kuwait
- **Source + tier:** Al-Ajiri calendar (Kuwait's de facto standard, private — T-665 owner note); authority-tier by usage.
- **Recipe:** 18/17.5 — library-exact (the adhan Kuwait preset carries no margins and reproduces the calendar); the 18-degree isha refuted; the 77-minute interval refuted by its own 77-83 minute drift; rounding: fajr + sunrise FLOOR, maghrib + isha NEAREST, dhuhr/asr silent (the mixed rounding must be emulated per row).
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** 30 November days + an OCR re-derivation through an independently rebuilt resolver; the Grand Mosque follows the ministry calendar EXACTLY (mirror verified).
- **Grade:** provisional.
- **Surface:** Al-Ajiri calendar.
- **Defects:** dhuhr/asr rounding null; 30 days vs a full-year claim (#6912 tension, recorded).
- **Lift:** year-2.
- **Provenance:** SL v2.1 `KW-AJIRI`; T-667 #6907 (F2), #6916 (K1), #6911 (I3), #6912; T-668 #6964 (C12).
# REGION 3 — West, Central, East and Southern Africa (44 rows)

## Niger
- **Source + tier:** Bureau des Traductions Islamiques (BUTIN), the standing national compiler since 1996, via cheikhboureimaabdoudaouda.com; CLERICAL authority (not the Conseil Islamique). THE WAVE'S PRIZE: a multi-year-eligible national table for the country C20 called unreachable.
- **Recipe:** fajr ANGLE 18 DEGREES; isha = maghrib + 75 FIXED; Shafi asr; 0.833 horizon; transit dhuhr; FIXED UTC+1; nearest ties-up; MARGINS NONE IN EITHER DIRECTION (measured bias exactly 0.00 on every column; 100 pc within-1, 69-93 pc exact). DECLARED METHOD quoted verbatim: built on the Umm al-Qura Makkah calendar via "Prayer Times 4"; both declarations verify exactly (fitted fajr 17.90-17.95, isha interval 75.0 on all 240 rows; sunrise/dhuhr/maghrib median 0). Umm al-Qura lineage confirmed genuine — 18deg/75min are UAQ fingerprints, precisely the pair the neighbouring image calendars do NOT use.
- **Asr:** Shafi.
- **Clock:** FIXED UTC+1 (portal property; a fourth fixed-clock case beside the three authority register users).
- **Evidence:** 56 region-years (8 regions × 2025-2031, 672 months, 20,448 rows, ZERO integrity failures — weekday names correct, Feb 29 2028 present, every file self-labelled; November 2026 reproduces C26's independent capture with zero mismatches). FROZEN BY THREE INDEPENDENT LINES: the page source has one function with literal constants and no year branch (lines 925-927); free per-region-year fits all return 17.99-18.01; no calendar date moves more than 1 minute between ANY two served years (bimodal 0/1 histogram — solar drift plus rounding, nothing else).
- **Grade:** provisional (v2.5, T-675 #7092) — the D3 consequence: only separately issued years are fitted evidence years, and the portal renders a year parameter from one frozen generator (no year term in the page source); a test that cannot fail is not year-2 evidence. The span label corrects to FROZEN-RECOMPUTED; the declared recipe stands confirmed exactly.
- **Surface:** living portal (client-side generated, PNG/PDF export; covers ALL EIGHT REGIONS with coordinates printed; the window ROLLS currentYear-1..+6, built at load).
- **Defects:** ground-practice unproven; the span is one generation.
- **Lift:** a separately issued second edition (a different generator build, not the year parameter).
- **Provenance:** T-668 #6977 (C26), #6985 (C34); T-675 #7092 (D3 consequence, agent-ruled); archive `census/c34-niger/`.

## Gambia
- **Source + tier:** Gambia Supreme Islamic Council (GSIC) authority monthly calendar, Greater Banjul + Kombos; image-only — reference-not-feed.
- **Recipe:** fitted 17.85/17.0 (fajr fit 17.95-18.05 on the July bank); SEPARATE ATHAN AND IQAMAH COLUMNS with stable iqamah rules (+20/+20/+20/+10/+15), exact on 31/31 rows (C26's two anomalies were print slips); the isha gap moves with date, confirming an angle.
- **Asr:** per fit.
- **Clock:** IANA.
- **Evidence:** November 2026 + July 2026 banked (the opposite solar season). HONEST CAVEAT: same calendar year, NOT year-2 — GSIC's timeline is login-walled and no 2025 post is searchable.
- **Grade:** provisional.
- **Surface:** GSIC monthly images (transcribed from pixel-geometry crops; two printed irregularities left as printed).
- **Defects:** image-only; year-2 blocked by the login wall.
- **Lift:** any 2025 artifact.
- **Provenance:** T-668 #6977 (C26), #6985 (C34).

## Chad
- **Grade:** FALLBACK for the capital (N'Djamena rides C20's one passing mawaqit mosque page) — the CSAI Ramadan sheet is correct to the minute but for ABÉCHÉ AND BILTINE ONLY (comment thread and print agree; it is NOT an N'Djamena table). PRINT QUIRK: the sheet's H|M sub-labels print MINUTES FIRST (a literal reading gives 19:04 imsak). Community sheet named; no national surface. Provenance: T-668 #6977 (C26), #6969 (C20).

## Sierra Leone
- **Grade:** candidate (community tier) — a Freetown-wide dated table exists but is community-published and SELF-DESCRIBED AS ESTIMATED (tier does not rise on accuracy alone); its banner's fixed 5:38/19:10 advice contradicts its own passing table (the table survives, the banner does not); one passing mawaqit mosque. Provenance: T-668 #6977 (C26), #6969 (C20).

## Mali
- **Source + tier:** Al Madina Al Mounawara mosque, Bamako (mawaqit); community.
- **Recipe:** fajr 19.0 +7.5 floor (363/365 exact), isha 17.0 +5.5 floor (359/365), sunrise +0.5, dhuhr transit +29 (a site constant, not doctrine), asr Shafi +8, maghrib sunset +3.5, floor every column; the cleanest of the four-mosque Bamako cluster (AR-RAHMAN and Oumar Ibn Kattab print fixed jama'ah columns and are not athan).
- **Asr:** Shafi.
- **Clock:** IANA (UTC+0).
- **Evidence:** one 365-row payload, the full year served by the page.
- **Grade:** community (v2.5, T-675 #7092) — the fit index governs over the wtdiff's candidate.
- **Surface:** mawaqit (Al Madina Al Mounawara).
- **Defects:** asr carries a +6.6..+9.6 seasonal drift band; one mosque of four.
- **Lift:** year-2 is one page load (mawaqit serves the year whole).
- **Provenance:** SL v2.5 `ML-ALMADINA`; T-665 #6910, T-668 #6969; T-675 #7092 (O1k-W6 sahel2, O1k-F3 fit3; D14 ruled a).

## Burkina Faso
- **Grade:** candidate (community tier) — Mouvement Sunnite (MSBF) runs a FEDERATION TEMPLATE: six of eight Ouagadougou records byte-identical with dhuhr at noon+33, so the federation standardises its platform schedule; the printed annual calendar would settle whether +33 is doctrine or data entry (recorded); one passing mawaqit mosque. Provenance: T-668 #6969 (C20).

## Senegal
- **Source + tier:** CERFI (cerfi.sn), crediting the Seminaire des Imams; institutional community publisher — the country's first real surface, and an interval-rule country.
- **Recipe:** Fajar = sunrise - 75.5 and Suba = sunrise - 60.5, both floor, 365/365 within one; isha (Guewe) = maghrib + 60 exactly, 365/365; the column printed "sunrise" is SUBA, the second dawn gate — it misses astronomical sunrise by up to 51 minutes; dhuhr transit +2, maghrib sunset +1.5, asr Shafi +2, floor on every column.
- **Asr:** Shafi.
- **Clock:** IANA (UTC+0 year-round).
- **Evidence:** one fitted year (the Dakar 2011 edition, 365 rows) plus an edition-stable cross-check on the 2026-11 sheet (30 rows) — two editions fifteen years apart, not two continuous years.
- **Grade:** community (v2.5, T-675 #7092) — the wtdiff wrote provisional; the fit index governs.
- **Surface:** cerfi.sn (152-city weekly tables and monthly PDFs).
- **Defects:** the 2011 capture's "Suba = sunrise" note was wrong; dawn-1 ~18 deg class, dawn-2 ~15 deg class; only Dakar carried of 152 cities.
- **Lift:** a third edition to test between-year continuity.
- **Provenance:** SL v2.5 `SN-CERFI`; T-668 #6958 (C1), T-665 #6882; T-675 #7092 (O1k-9 africa, O1k-W6 sahel2, O1k-F3 fit3; D14 ruled a).

## Guinea
- **Source + tier:** Grande Mosquee de Nono (mawaqit); community — FALLBACK broken at one mosque only.
- **Recipe:** PARTIAL: isha 17.0 +0.5 floor (356/365 exact), maghrib sunset +0.5 until 15 Oct then a drift hump peaking +9.7 late Nov, dhuhr PINNED 13:45 on all 365 rows (config-fixed), sunrise +0.5, asr Shafi floor — but fajr rides a smooth seasonal dawn curve (implied 58-76 min before sunrise) that NO standard recipe reproduces; recipeStatus partial.
- **Asr:** Shafi.
- **Clock:** IANA (UTC+0).
- **Evidence:** one 365-row payload; Conakry still has no passing table (three broken configurations).
- **Grade:** community (v2.5, T-675 #7092) — the weakest promotion of the night, carried as partial.
- **Surface:** mawaqit (Grande Mosquee de Nono).
- **Defects:** fajr unfittable by any standard recipe; the maghrib drift hump carried as a feed exception window.
- **Lift:** a fittable second surface, or the platform's method statement.
- **Provenance:** SL v2.5 `GN-NONO`; T-668 #6969 (C20); T-675 #7092 (O1k-W6 sahel2, O1k-F3 fit3; D14 ruled a).

## Guinea-Bissau
- **Grade:** FALLBACK — no surface (C20 wave: none). Provenance: T-668 #6969, T-665 #6910.

## Nigeria
- **Source + tier:** prayertimesnigeria.com — ONE DEVELOPER'S React SPA computing in-browser for ALL 774 LGAs; COMMUNITY tier, national reference surface, NEVER authority. NSCIA stays announcements-only; Abuja National Mosque publishes its own daily athan+iqamah (zuhr 12:14 = solar noon, verified) but no monthly table.
- **Recipe:** the bundle's constants read verbatim: fajr -18, isha -17, dhuhr noon+65 s, Shafi asr, cosinekitty/astronomy engine — MWL 18/17; a 3-month × 3-LGA capture verifies it to RMSE under 1 min; Supabase holds only hijri_corrections (offset_days 0). The mosque-level recipe is the same MWL 18/17 Shafi at zero margins, fitted on mosque-configured tables (masjidbox: Osogbo 365/365 in 2026 plus 34/34 in 2027, Ile-Ife exact in UTC modulo its 60-minute zone bug, Suleja 98 pc).
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** 3 months × 3 LGAs verified on the SPA; mosque-level MWL 18/17 fitted at three masjidbox surfaces, two of them two-year (Osogbo, Ile-Ife); C1's 4-5 Nigerian mixed tables (full-year 2027) corroborate the computed layer.
- **Grade:** community.
- **Surface:** prayertimesnigeria.com (client-computed SPA).
- **Defects:** the only Egyptian 19.5/17.5 line in the country is masjidway's platform default: nine mosques × three months across Kaduna, Abuja, Benin City, Enugu and Ikorodu, identical margins in every region (dhuhr -60 s, all else 0) and identical Jan-2026 against Jan-2027, so a platform constant and never Nigerian regional practice (D6 reversed 2026-11-11, T-675 #7103); single-developer provenance on the SPA; community ceiling.
- **Lift:** n/a (community ceiling); NSCIA publishing a timetable would create the authority surface.
- **Provenance:** T-668 #6987 (C35), #6935 (P5), #6958 (C1); T-675 #7092 and #7103 (D6 reversed on the o1l-7 Nigeria states sweep, `o1l-city/nigeria-states`).

## Ghana
- **Grade:** candidate (community tier) — one real table (Al-Firdaws Accra, FIXED dhuhr + maghrib columns = partial jama'ah-class); the national mosque carries only a Muslim Pro widget (cityid in source). Provenance: T-668 #6958 (C1).

## Côte d'Ivoire
- **Source + tier:** COSIM (Conseil Supérieur des Imams) JSON API — CORRECTED BY C29: NOT a national federation feed. 19 cities only (Abidjan communes + 8 majors); it is an ALADHAN PROXY with ISNA 15/15 and a BROKEN GEOCODER (meta coordinates 8.888/7.777 for EVERY city; Indianapolis as reference location); 6 of 19 cities 503 server-side.
- **Recipe:** ISNA 15/15 (proxy constants).
- **Asr:** per proxy.
- **Clock:** IANA.
- **Evidence:** today-only per city; Abidjan dhuhr passes the solar gate (C1).
- **Grade:** candidate — CROSS-CHECK SURFACE ONLY, never authority; data quality poor (C1's first reading corrected on the record).
- **Surface:** COSIM API.
- **Defects:** proxy provenance, broken geocoder, partial 503s.
- **Lift:** none worth pursuing beyond cross-check duty.
- **Provenance:** SL v2.1 `CI-COSIM` (candidate reading superseded in grade by #6978); T-668 #6958 (C1), #6978 (C29 correction), #6974 (C27).

## Togo
- **Grade:** candidate (community tier) — Al-Farouk Sokodé: all six columns sun-tracking, full-year 365 rows (calendar 2027), genuine computed athan. Provenance: T-668 #6958 (C1).

## Benin
- **Grade:** FALLBACK — the held capture is NOT Cotonou: the page names Gakpe, pins 6.4161/2.1211 (30 km west of the city), and the calendar is computed at 11.11 N / 2.94 E, which is KANDI (1,852/2,190 exact; at its own pin the table misses by up to 14 minutes — the latitude signature). The candidate is withdrawn (D15 item 4): the row names a northern-Benin surface with NO publisher. Provenance: T-668 #6958 (C1); T-675 #7092 (O1k-F2 fit2, O1k-F11 fit11).

## Cameroon
- **Grade:** candidate (community tier) — Ar-Rahma Douala: full-year, all six columns sun-tracking. Provenance: T-668 #6958 (C1).

## Central African Republic
- **Grade:** FALLBACK — no surface. Provenance: T-665 #6910.

## DR Congo
- **Grade:** candidate (community tier) — Goma ×2 mawaqit tables pass the solar gate (usable mosque-endorsed athan); Kinshasa (17M) has NO platform page at all — capital coverage needs a non-web route. Provenance: T-668 #6969 (C20).

## Gabon
- **Grade:** candidate (community tier) — two mawaqit tables pass the solar gate. Provenance: T-668 #6969 (C20).

## Ethiopia
- **Grade:** FALLBACK — EIASC is news-only; the Addis council's own site runs an adhan-js panel at the MuslimWorldLeague default (18/17), TODAY-ONLY, one city, states nothing (engine evidence captured in the JS chunks). Provenance: T-668 #6955 (C2), #6935 (P5).

## Eritrea
- **Grade:** FALLBACK — honest negative. Provenance: T-668 #6955 (C2).

## Djibouti
- **Source + tier:** six mawaqit-hosted mosques — Djaffar Gabode, Tayib Nagad, al-Salam FYART, Abd ar-Rahman bin Awf, Ihsaan, Nashr Aldine; platform/community tier. Djibouti moved FROM FALLBACK TO COMMUNITY on this find.
- **Recipe:** fitted cluster recipe: five of six mosques on ONE recipe — MWL 18/17 Shafi, zero margins, nearest (Djaffar Gabode 2,196/2,196 within one; Tayib Nagad 2,196; Nashr Aldine 2,195; Ihsaan 2,190); Al-Salam FYART is arithmetically inconsistent on asr (-14..+16) and excluded.
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** all six enumerated mosques captured fresh, 2,196 rows; the platform index claims 12 mosques, the unindexed half is beyond public pages; the ministry is a negative.
- **Grade:** community (v2.5, T-675 #7092) — the wtdiff's "provisional" is recorded as a conflict, the fit index governs.
- **Surface:** mawaqit pages; the city-code enumeration lead (71100/77101/9999 + the mosquee-proche mirror) likely yields more.
- **Defects:** platform tier caps it below A.
- **Lift:** a second year across the cluster.
- **Provenance:** SL v2.5 `DJ-COMMUNITY`; T-668 #6955 (C2); T-675 #7092 (O1k-W7 horneast2, O1k-F5 fit5; D14 ruled a; the wtdiff's "provisional" is recorded as a conflict, the fit index governs).

## Somalia and Somaliland
- **Source + tier:** five mawaqit mosques (three Hargeisa, two Mogadishu); community — first data ever for the country.
- **Recipe:** ONE cluster recipe — MWL 18/17 Shafi, zero margins, nearest; Ina Weerar (Hargeisa) runs its own ~17-deg fajr and is excluded; the ministry publishes Eid and Ramadan announcements only.
- **Asr:** Shafi (the platform's soft column: the cluster's lowest within-one rate).
- **Clock:** IANA (EAT).
- **Evidence:** 1,830 rows across five payloads (within-one 2,131-2,181 of 2,196 per payload).
- **Grade:** community (v2.5, T-675 #7092).
- **Surface:** mawaqit (Hargeisa: Marwa, Nuurul Huda, Cali Jimcaale; Mogadishu: Rabbul Caalamiin, Abd ar-Rahman bin Awf).
- **Defects:** platform default, not a mosque-authored statement; no authority surface exists.
- **Lift:** an authority surface, or a second year across the cluster.
- **Provenance:** SL v2.5 `SO-MWAQIT`; T-668 #6955 (C2); T-675 #7092 (O1k-W7 horneast2, O1k-F5 fit5; D14 ruled a).

## Kenya
- **Source + tier:** Jamia Mosque Committee Nairobi with the Kenya Meteorological Department (KMD co-prepared Ramadan table); community with government co-preparation. Jamia's year-round block is a Muslim Pro widget (cityid 184745) — not an owned artifact.
- **Recipe (C35 upgrade):** the PDF holds FORTY-SEVEN CITIES, not seven; ONE angle (SUHOOR-END 18.2, plateau 18.0-18.4 on 39/47) serves ALL of them, RMSE 0.18-0.52; iftar is clean sunset; the KMD co-preparation shows as pure solar gates; MANDERA carries a constant +4.2-min iftar guard (zero variance, no coordinate explains it — a named-city safety convention); one typo found (Lodwar day 30). Kenya's community default for Ramadan is a NATIONWIDE COMPUTED TABLE.
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** 47-city Ramadan table fitted at MAE 0.20 (P5) / RMSE 0.18-0.52 (C35). Ramadan-only, single year.
- **Grade:** provisional.
- **Surface:** Jamia/KMD Ramadan 1447 PDF.
- **Defects:** Ramadan-only; Lodwar typo carried; Mandera convention unexplained.
- **Lift:** a year-round surface (P5 lead: the Kenya Met host).
- **Provenance:** SL v2.1 `KE-JAMIA` (7-city partial superseded by C35); T-668 #6987 (C35), #6955 (C2), T-667 #6935 (P5).

## Tanzania
- **Grade:** FALLBACK — BAKWATA negative reconfirmed; KSIJ Dar's Ramadan namaaz PNG is SHIA (out of scope per the Shia ruling, recorded as a surface); the Jamiat generator covers 11 towns (community). Provenance: T-668 #6955 (C2), #6957 (C5).

## Uganda
- **Grade:** FALLBACK — ministry domain unresolvable (honest negative); Jamiat carries a Kampala outrider. Provenance: T-668 #6955 (C2), #6965 (C15).

## Rwanda
- **Grade:** FALLBACK — no surface. Provenance: T-665 #6910.

## Burundi
- **Grade:** FALLBACK — no surface. Provenance: T-665 #6910.

## South Sudan
- **Grade:** FALLBACK — no surface. Provenance: T-665 #6910.

## Zambia
- **Grade:** candidate (community tier) — the region's BEST MOSQUE LAYER: zamasjids.com serves per-region taqweem AND per-masjid jamaat JSON (today-only — a daily poll task); the Jamiat generator covers 34 towns. Provenance: T-668 #6957 (C5), #6965 (C15).

## Malawi
- **Grade:** candidate (community tier) — Jamiat covers 29 towns; the national body is WRONG BY ~30 MIN on its homepage bar (Blantyre maghrib 17:24 vs Jamiat 17:53 vs astronomical 17:47 — undated, uncoordinated); Blantyre's Jamiat anchor offset is unexplained (the one variant in 494 towns besides Isipingo). Provenance: T-668 #6965 (C15), #6957 (C5).

## Mozambique
- **Grade:** candidate (community tier) — Jamiat covers 2 towns; single-day mawaqit leads only. Provenance: T-668 #6965 (C15), #6957 (C5).

## Zimbabwe
- **Grade:** candidate (community tier) — Jamiat covers 5 towns; single-day mawaqit leads only. Provenance: T-668 #6965 (C15), #6957 (C5).

## Botswana
- **Grade:** candidate (community tier) — BMA publishes ALL 33 TOWNS, dated month, BOTH ASR schools, DOM-parseable, with a separate Ramadan layer; the Jamiat generator covers the same towns via BMA. Provenance: T-668 #6957 (C5), #6965 (C15).

## Namibia
- **Grade:** FALLBACK — no publisher beyond the Jamiat generator's Windhoek row. Provenance: T-668 #6957 (C5).

## Angola
- **Grade:** FALLBACK — no publisher beyond the Jamiat generator's Luanda row. Provenance: T-668 #6957 (C5).

## South Africa — Jamiatul Ulama KZN
- **Source + tier:** Jamiatul Ulama KZN perpetual-timetable generator; community federation, 365 South African towns (full national coverage incl. every major city).
- **Recipe (C15-corrected basis):** fajr/sunrise bare 18 deg; asr BOTH schools bare; suhoor = fajr-5; ishraaq = sunrise+15; zawaal = transit-5; ZUHR = transit+5 (= zawaal+10, not +5); sunset = astro-3; maghrib = astro+3; ISHA SHAFI = SEPARATE 15-DEG ANGLE (not an interval); ISHA HANAFI = clean 18 deg, no margin. Margins town-invariant across 493 of 494 towns (Isipingo Beach carries ishraaq +20 — a genuine local variant; Phuthaditjhaba and Witsieshoek carry a Drakensberg elevation horizon correction; Blantyre's anchor offset unexplained). ROUNDING LAW: the seven morning/noon columns round-to-nearest, the six afternoon/evening columns TRUNCATE — applying the split lifts exact from 74.8 to 89.4 pc.
- **Asr:** both schools printed bare.
- **Clock:** IANA.
- **Evidence:** 494 towns × 30 days captured (192,660 cells at 89.4 pc exact / 99.8 pc within-1, 767 s at 1.1 s pacing). THE SERVED TABLE IS FROZEN ACROSS YEARS — the year parameter RELABELS dates and recomputes weekdays, changing nothing: all 13 columns byte-identical across 2022/2024/2026/2028 on every sampled town (0 differing cells of 1,170 × 14). A PERPETUAL table locked to one leap phase: against per-year computation it scores ~79 pc exact (non-leap) / ~68 pc (leap), within-1 96.7-98.5 pc everywhere. One generation under the frozen-generation precedent.
- **Grade:** community.
- **Surface:** Jamiat generator (CSV export, coordinates + timezone per town, years 2021-2031). FORMAT ARTIFACT: non-leap years emit a phantom 29-Feb row dated 1 March (site JS deletes it client-side).
- **Defects:** the perpetual-table drift against true solar years is the price of the source; community ceiling — never claim the user's mosque.
- **Lift:** n/a (community ceiling).
- **Provenance:** SL v2.1 `JAMIAT-KZN`; T-668 #6965 (C15), #6957 (C5); archive `census/c15-jamiat/`.

## South Africa — Muslim Judicial Council (Cape)
- **Grade:** candidate (community tier) — the second body: MJC November captured (C5), unfitted on the record. South Africa's two bodies are recorded separately and never merged. Provenance: T-668 #6957 (C5).

## Lesotho
- **Grade:** candidate (community tier) — Jamiat covers 8 towns. Provenance: T-668 #6965 (C15).

## Eswatini
- **Grade:** candidate (community tier) — Jamiat covers 11 towns. Provenance: T-668 #6965 (C15).

## Madagascar
- **Grade:** FALLBACK — one Masjidbox mosque; the Salaah Times mirror carries Mahajanga at lat/lon 0.0 (defect logged). Provenance: T-668 #6957 (C5).

## Mauritius
- **Source + tier:** Jummah Masjid Port Louis (PWA bundle; the publisher's own llms.txt states the regional tiers); community.
- **Recipe:** fitted: fajr 17.89 +10 ceil, isha 17.29 +5.5 floor (NOT a fixed interval — the spread runs 68-80 min), asr HANAFI +4.5, maghrib sunsetStart +6, dhuhr zawaal-0.5 floor then +9.5, sunrise +4.5 floor; the six regional adjustments are three symmetric minute tiers (maghrib +n, sehri -n for n = 2/3/4); sehri = fajr.begin - 10; the trailing-zero minute encoding decoded ("4.2" = 04:20).
- **Asr:** Hanafi.
- **Clock:** IANA (UTC+4 fixed).
- **Evidence:** full 2026 year (365 dated rows, 15 fields); the date-mislabel defect does not touch the data layer.
- **Grade:** community (v2.5, T-675 #7092) — the fit index governs over the wtdiff's provisional.
- **Surface:** Jummah Masjid PWA bundle.
- **Defects:** year-2 structurally negative (the same 365 rows re-ship per year — frozen-generation caution).
- **Lift:** none within this surface (community ceiling).
- **Provenance:** SL v2.5 `MU-JUMMAH`; T-668 #6957 (C5); T-675 #7092 (O1k-W8 southernafrica2, O1k-F3 fit3; D14 ruled a).

## Comoros
- **Grade:** FALLBACK — no surface. Provenance: T-665 #6910.

## Liberia
- **Grade:** candidate — T-665 January-class feed verdict; uncensused (no wave covered Liberia). Provenance: T-665 #6882.

## Mauritania
- **Grade:** provisional — measured 19.37/17.46 in the corpus (#6910 gap-fix, naming the marathon measurement); T-666: annual-only bake depth. Provenance: T-665 #6910, T-666 #6893.
# REGION 4 — South, Southeast, Central and East Asia, Russia and the Caucasus (35 rows)

## Kazakhstan
- **Source + tier:** Spiritual Administration of Muslims of Kazakhstan (DUMK / muftyat.kz); authority, 5,694 settlements.
- **Recipe:** ISNA 15/15 uniform nationwide + Hanafi asr + the TwilightAngle clamp (LOAD-BEARING: at 51 N the effective angle dips to 11.5 at solstice, fajr = sunrise - 0.25 × night to the minute on clamp days — the DUMK ISNA statement is true only with the clamp). Margins: exactly TWO sets switched by a hard-coded latitude rule at 48 N (verbatim in the muftiate's own JS): set A (<48) sunrise -3, dhuhr/asr/MAGHRIB +3; set B (≥48) sunrise -5, dhuhr/asr/MAGHRIB +5; fajr and isha never corrected in either set (C19: the margin block i>1 && i<5 covers dhuhr, asr AND maghrib — the earlier reading that placed maghrib outside is refuted). imsak = fajr + 10 (365/365 exact); nearest, uniform.
- **Asr:** Hanafi.
- **Clock:** IANA.
- **Evidence:** FIVE FULL YEARS pulled (Astana 2025/2026/2027/2030/2036, Almaty 2025-2030, Shymkent 2026; 1,826-day basis in the object): every prayer of every year 100 pc within-1, exact 85.7-92.2 pc, 2026 reproducing the recorded fit cell for cell. The site honours the year input unboundedly (probes render to 2100). Clears the multi-year ruling.
- **Grade:** A.
- **Surface:** muftyat.kz. TRAPS: the API needs exact 6-decimal coordinates (#6904 D1 — rounded coordinates shift the fit); their prayTimes.getDst compares the VISITOR clock to the city, so a DST-zone browser adds an hour to every summer date — the crawl must force getDst=0.
- **Defects:** 47 settlements sit within 0.1 deg of the 48-degree line and seven oblasts are cut internally (a settlement exactly on the line takes the upper set, no smoothing); C19 did not re-test the comparison direction — the one unconfirmed constant.
- **Lift:** at top grade.
- **Provenance:** SL v2.1 `KZ-MUFTIYAT`; T-667 #6921 (L1), #6923 (M3), T-668 #6970 (C19); archive `census/c19-year2/`.

## Kyrgyzstan
- **Source + tier:** Spiritual Administration of Muslims of Kyrgyzstan (muftiyat.kg); authority.
- **Recipe:** fajr 18 flat all year (floor); isha is a TWILIGHT-RATIO rule — isha = displayed maghrib + round(7/9 × (fajr - sunrise) + 3.5), band 3.2-3.5 (3/4 refuted at 0/365; 7/9 and 0.775 indistinguishable at the noise floor; the fixed-angle fallback 15.89 is city-invariant, itself the proof of one engine); maghrib = sunset + 7.0 displayed (supersedes L1's +6); suhur = fajr; iftar = maghrib.
- **Asr:** Hanafi (the brief's -1 margin has no comment behind it — null).
- **Clock:** IANA.
- **Evidence:** Bishkek + Osh, 365 days each (joint fit r=0.776, per-city MAE 0.487/0.484; Bishkek 359/365 within-1). Single year → provisional.
- **Grade:** provisional.
- **Surface:** P4 CORRECTION: NO DIGIT CEILING — the official surface is a 21-day rolling window that 302-clamps any wider range; "past 2100" holds for the RECIPE only. Kyrgyzstan drops to recipe class with a rolling capture.
- **Defects:** the ratio constant is a band, not a point; five of six rounding rows null.
- **Lift:** year-2 via rolling daily captures.
- **Provenance:** SL v2.1 `KG-MUFTIYAT`; T-667 #6921 (L1), #6926 (M2), #6937 (P4 ceiling correction), #6927 (M5).

## Uzbekistan
- **Source + tier:** islom.uz national portal (algorithm read from its own bundle); SECONDARY-WITH-MEASURED-ALGORITHM class — a private portal, not the state board (muslim.uz publishes graphics only). Uzbekistan moved OUT of Moonsighting fallback on this basis.
- **Recipe:** fajr 15.5 / isha 15.5 / Hanafi from the portal's own bundle; 91 regions with coordinates and per-region differ_minute; display margins +5 added at render time (Ishroq +20, Shom +4) — the v2.1 displayCorrections.displayMargins field; reproduces the portal's own day to within 1 min.
- **Asr:** Hanafi.
- **Clock:** IANA.
- **Evidence:** 60 days (Tashkent + Samarkand; the state board's own regional pages corroborate the measured 15.5/15.5 Hanafi; C9 captures label the pages "Muslim Board of Uzbekistan" — the later comment governs attribution, the numbers agree).
- **Grade:** provisional (published-scheme).
- **Surface:** islom.uz (computes in-browser).
- **Defects:** private-portal provenance; state attribution unsettled.
- **Lift:** the state board publishing numbers, or year-2 of the portal.
- **Provenance:** SL v2.1 `UZ-ISLOM`; T-667 #6935 (P5), T-668 #6954 (C9).

## Tajikistan
- **Source + tier:** Shuroi Ulamo (Council of Ulema, the state body, shuroiulamo.tj/tj/namaz); authority.
- **Recipe:** WINDOW-CLASS — the monthly table publishes WINDOWS not instants (fajr 05:31-07:00, isha crossing midnight, a disliked-interval around sunset): the census's first window-class source; no instant rule kind can express it (the v2.1 windowClass flag).
- **Asr:** n/a (windows).
- **Clock:** IANA.
- **Evidence:** one month captured.
- **Grade:** candidate.
- **Surface:** shuroiulamo.tj monthly windows table.
- **Defects:** window form needs its own consumer path; unfitted.
- **Lift:** a second month + a decision on how the app renders windows.
- **Provenance:** SL v2.1 `TJ-SHURO`; T-668 #6954 (C9).

## Turkmenistan
- **Grade:** FALLBACK — confirmed nothing. Provenance: T-668 #6954 (C9).

## Afghanistan
- **Source + tier:** the ministry's permanent table, IMAGE-ONLY (3 pp, nine rasters, no text layer); it serves the COUNCIL OF AHL AL-SUNNAH imams of Kabul (valid within 12 km; HANAFI asr ~46 min past Shafi). The ministry ALSO publishes a Ramadan table footnoted to the SHIA imams' council (the Ja'fari fit) — TWO AUTHORITY FITS FOR DIFFERENT CONGREGATIONS, not witnesses to each other.
- **Recipe:** two fits: Sunni Kabul (Hanafi asr) and Ja'fari Ramadan (the Shia council's table); C22 transcribed a 30-day window with double-crop discipline, adhan landing within 2 min per column.
- **Asr:** Hanafi (Sunni table).
- **Clock:** IANA.
- **Evidence:** 30 transcribed days; NO SECOND WITNESS EXISTS anywhere (no Kabul/Herat platform pages, no diaspora republication — London's Afghan centres publish London rows; Kabul Municipality's block is an api.aladhan.com ISNA widget 11 min off at fajr, not a source).
- **Grade:** candidate — C30 (OCR completion to a verified full-year artifact, unlocking the twelve named Kabul districts) was dispatched and HAS NOT RETURNED; its disk files are not consumed.
- **Surface:** ministry image tables.
- **Defects:** image-only; single city (Kabul, 12 km); congregation split must be carried, never merged.
- **Lift:** C30's return; a second-city witness.
- **Provenance:** T-668 #6973 (C22).

## Pakistan
- **Source + tier:** Ministry of Religious Affairs (mora.gov.pk), the federal Nizam-e-Salat chart "2016 and Onward", Active since 2016-01-01; authority — THE FIRST AUTHORITY DATED TABLE EVER FOR PAKISTAN.
- **Recipe:** fajr 18.00 floor (17.95 with -0.5 refines to 315/366), sunrise -0.5 floor, asr HANAFI +2 (MWL 18/17 refuted by 58 minutes median; shadow 2.06 measured), maghrib sunset+5/+6 nearest, dhuhr a TWO-PHASE CLOCK 13:00/13:15 switching 15 Apr and 15 Oct (366/366), isha a 15-MINUTE CLOCK LADDER of 19 switch dates, 11 printed values 18:45..21:15 with one 30-minute drop on 1 Oct; best single angle 21.1 at 10.9 min rms — the schedule is the recipe. The Karachi 18/18 Hanafi community practice is the nearest named method, not the publisher's.
- **Asr:** Hanafi (+2 nearest).
- **Clock:** IANA (PK has no civil DST).
- **Evidence:** a 366-row template transcribed and validated (24h ordering, zero violations); one year of fitted evidence under the multi-year ruling — the chart is computed for the current year despite its "2016 and Onward" title (anchor test fajr@18 exact: 2024 260, 2026 306, 2028 258). The Pakistan anchor as arbitrated: one chart, one recipe, no computation-year claim published.
- **Grade:** provisional (v2.5, T-675 #7092) — FALLBACK leaves the row.
- **Surface:** mora.gov.pk federal register (the chart carries no city selector; the Islamabad district grid).
- **Defects:** the twin-city 2026 unified edition is unpublished on both ministry registers — the year-2 artifact (watch D13: recheck each January, close if the 2027 edition also fails); the isha angle is unidentifiable by design; the 133 isha non-exact days are the publisher's editorial switch dates, not fit error.
- **Lift:** year-2 on the 2026/2027 unified twin-city calendar.
- **Provenance:** SL v2.5 `PK-NIZAM-E-SALAT`; T-668 #6959 (C11), T-665 #6882, T-666 #6893; T-675 #7092 (O1k-W17 southasia2, O1k-F1 fit1, O1k-V3 verify3; D14 ruled a).

## India
- **Grade:** FALLBACK (community de facto: the Karachi method) — the J&K Waqf Board is the ONE board publishing dated prayer times: Eid jama'ah rosters (54 mosques transcribed) and per-shrine Juma notices through its notices register (images, congregational-only, NO daily table) — an authority surface, jama'ah-class; every other board (Delhi, Telangana, Kerala, Central Council) publishes nothing. Delhi Jama Masjid, Hyderabad Makkah Masjid, Deoband: no campus table on the web. Kerala needs a print source, not a web one. Platform tz defect on record: the Srinagar record declares Africa/Abidjan while printing IST. Provenance: T-668 #6959 (C11), T-665 #6882; T-675 #7092 (v2.5: negatives re-confirmed — Kerala's print source named as Suprabhatham, print-only; makkahmasjid.net remains Garland, Texas; O1k-4 southasia, D14).

## Bangladesh
- **Source + tier:** Islamic Foundation Bangladesh (IFB) permanent schedule; authority.
- **Recipe:** the year-round artifact is IFB's own PERMANENT SCHEDULE of 72 date-bands (the current CMS holds only the Ramadan PDFs — the trap verified), transcribed from scans with vision zoom and reconciled; fajr ridge confirmed WIDER (18.95-19.30 plateau, best single 19.25 +8); isha 18.65 -1; margins zuhr/maghrib +3 → +4. BAND QUANTIZATION (one value per 3-6 days) caps any recipe near 50 pc exact BY CONSTRUCTION.
- **Asr:** Hanafi (decisive).
- **Clock:** IANA.
- **Evidence:** full-year band artifact; year-invariant by construction. Grade B on the 365-day ruling, provisional under #6943.
- **Grade:** provisional.
- **Surface:** IFB permanent schedule (scans); the CMS carries Ramadan PDFs only.
- **Defects:** the band question is PRINT-ONLY — photographing Baitul Mukarram's printed calendar and an old-Dhaka mosque board is the recorded manual task; the web is exhausted (no mosque-layer daily table exists online; news/madrasa computed tables are a different artifact family and cannot confirm the bands).
- **Lift:** the print photographs (second witness).
- **Provenance:** SL v2.1 `BD-IFB`; T-667 #6948 (N2f), T-668 #6968 (C14 same-name traps killed: Southall, Canada, Arlington).

## Sri Lanka
- **Source + tier:** All Ceylon Jamiyyathul Ulama (ACJU), statutory by Act of Parliament; authority, 13 zones.
- **Recipe:** fajr 19.75 / isha 18.2 confirmed to SECOND-LEVEL precision; the safety trio +1.1..+2.2 on dhuhr/asr/maghrib; the LIVE edition prints DUAL ASR on every sheet (C14's old-URL files were a prior single-Asr edition with identical values — 0/180 mismatches); storey-band display corrections (-1/-2 fajr, +1/+2 maghrib/isha; band boundaries unstated); sahr ends 2 min before fajr; the sheets NAME the method: M.I. Abdus Samad Makdoomi.
- **Asr:** BOTH schools printed (dual).
- **Clock:** IANA.
- **Evidence:** 721 rows across 13 zones + seasonal months; zones are generated INDIVIDUALLY (per-zone offsets spread 1-2 min), not one national template. YEAR-PINNING SETTLED: the ACJU online table is PERPETUAL — no year string anywhere, February sheets carry 29 rows (leap-anchored cycle), the November content served from uploads/2026/10 is VALUE-IDENTICAL to the uploads/2025/07 files C14 captured — one fixed annual artifact re-uploaded year after year, never regenerated; treat error vs any target year as under ~1 min. ONE GENERATION under the frozen-generation precedent.
- **Grade:** provisional.
- **Surface:** 13 zones × 12 monthly PDFs on one URL template (OCR class — the reason Azerbaijan dropped from bake).
- **Defects:** the mosque layer only partly tracks the sheet (Colombo's Masjidul Hijriya runs exact solar at the noon-anchored prayers with its own fajr +7 and isha -5 — one mosque is not the authority); rounding direction still unrecorded.
- **Lift:** a regenerated (not re-uploaded) edition.
- **Provenance:** SL v2.1 `LK-ACJU`; T-668 #6975 (C25), #6968 (C14); T-667 #6911 (I1), #6937 (P4 OCR class).

## Maldives
- **Source + tier:** Ministry of Islamic Affairs (MUIS), MABIMS family; authority. THE LATITUDE QUESTION ANSWERED: the island selector enumerates 202 islands (20 atolls + Male); 10 islands captured north to south across 9 atolls — ALL islands run ONE recipe.
- **Recipe:** MABIMS 20/18 plus fixed integer safety {fajr +5, dhuhr +4, asr +1, maghrib +2, isha +4, SUNRISE -2 (C25; the object's -1 is superseded)}, nearest; NO monotonic latitude trend over 7.3 degrees (within-island deltas constant ±0.3); at Male ~87 pc exact, all within-1.
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** 10 islands across 9 atolls + L1's 144/144 on 24 days. The sample is the thinnest in the file.
- **Grade:** provisional.
- **Surface:** MUIS day API (2036 verified, likely computed); MUIS's own site hard-blocks at IP level (Cloudflare) — the official yearly PDF exists via the Namaadhu app's claim and needs a manual fetch; namaadhuvaguthu.com corroborates as COMMUNITY (provenance unstated).
- **Defects:** GDh Thinadhoo (island id 906) is a CORRUPT RECORD — dhuhr/maghrib/isha +3..+8 above the national recipe, implied location in open ocean, no coordinate reproduces it: DO NOT USE id 906; Kulhudhuffushi (+1.6) and Fonadhoo (+0.6) carry upstream coordinate displacement (recipe-consistent).
- **Lift:** the official yearly PDF fetched manually; year-2.
- **Provenance:** SL v2.1 `MV-MUIS` (sunrise margin superseded by #6975); T-668 #6975 (C25), T-667 #6921 (L1).

## Nepal
- **Grade:** FALLBACK — confirmed nothing. Provenance: T-668 #6954 (C9).

## Thailand
- **Source + tier:** Central Islamic Council of Thailand (CICOT); authority.
- **Recipe:** fajr 19.8 / isha 18.1 — 365/365 within a minute at raw geometry; THE THAI 17-DEGREE FOLKLORE IS REFUTED. Margins: fajr 0, isha 0, the other four null (the fit bounds only the twilight rows); rounding unmeasured (emulation nearest).
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** 365 days, one year.
- **Grade:** provisional.
- **Surface:** P4 CORRECTION: annual XLSX per PROVINCE — parses, no OCR — behind a browser-grade Cloudflare fetch; better than assumed.
- **Defects:** margins/rounding null beyond the twilight rows.
- **Lift:** year-2 from the provincial workbooks.
- **Provenance:** SL v2.1 `TH-CICOT`; T-667 #6911 (I1), #6937 (P4).

## Malaysia
- **Source + tier:** JAKIM; authority, zone table.
- **Recipe:** fajr 18 whole federation; isha 18 with 17 in BOTH Kelantan zones at different reference points (the "KTN01 18 / KTN02 17" split does not exist — KTN02 solves ~4.4-4.9 N / 101.6-101.9 E and reproduces to 0.1 min at the JAKIM rule; the Zulkaedah 1441 capture proves ZON 1 is 18/17 with isha 18 missing by 5.3 min on all 59 days). MARGINS RE-SET BY THE T-674 ARBITRATION: the census +2 ihtiyati are dead on both baselines (0.2/0.5/0.1 pc exact of 20,805 rows against 84.3/78.6/85.7 at zero) — zohor +1.5 round ALONE, maghrib 0 ceil, isha 0 ceil at 18, syuruk FLOOR at the per-zone eastern reference point (Lampiran B), not the -1 census margin; imsak = fajr - 10 in all zones EXCEPT PLS01 (= fajr, 365/365); prayers ceil; dhuhr round.
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** 5 zones, full 2026, MAE under 0.35 minutes per field; the T-674 arbitration re-derives the KL subuh point and WLY01 longitude and rules the 2027 fajr column a +0.24-deg peninsula subuh reference move (uniform -1 at the zohor point, Lampiran B east entries, Labuan immobile), not a margin. Single year → provisional.
- **Grade:** provisional.
- **Surface:** JAKIM zone tables (e-Solat).
- **Defects:** one of the five swept zones is unnamed on the board; SGR01's reference point is absent; SGR01 vs WLY01 differ on 199/365 days (MULTIPOINT BLEND JITTER, not separate rules — a one-point-per-zone table cannot reproduce it); per-zone sunrise margins are catalog-only and disagree with the national -1.
- **Lift:** year-2 (January-class).
- **Provenance:** SL v2.5 `MY-JAKIM`; T-667 #6919 (L4), #6905 (E4), #6937 (P4 Malay-month parse trap: Mac=March, Dis=December); T-675 #7092 (O1k-K2 kel2, D15 item 3; the T-674 arbitration verdict, commit d1c11740).

## Singapore
- **Source + tier:** Islamic Religious Council of Singapore (MUIS); authority.
- **Recipe:** 20/18; margins +1/+1/+2/+1/+1/+1; rounding UP everywhere (ceiling fits 60-78 pc, floor rejected; the catalog's "down" is superseded by the corrections ledger). adhan's Singapore() preset already sets Rounding.Up and dhuhr +1; the remaining five margins are ours to apply.
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** 1,096 days across THREE MUIS years. Clears the multi-year ruling.
- **Grade:** A.
- **Surface:** MUIS PDFs (2027 reachable).
- **Defects:** the 22-40 pc of days the ceiling does not fit are unexplained — a strict Up rule is the best single direction, not a per-day proof.
- **Lift:** at top grade.
- **Provenance:** SL v2.1 `SG-MUIS`; T-667 #6907 (F1), #6912, #6944.

## Brunei
- **Grade:** candidate — T-665: any month/year bakeable, but behind JS/POST doors (T-666); unfitted. PARSE TRAP ON RECORD: Brunei prints 4.54 for 04:54. Provenance: T-665 #6882, T-666 #6893, T-667 #6937 (P4).

## Indonesia
- **Grade:** candidate (partial published parameters) — Subuh -20 / Imsak -10 central, Isya -18 regional (T-666); the SIHAT application is OWNER-GATED (the standing no-contact rule); real ceiling 2029 (the 2030+ mirror is a repetition artefact and did not reproduce per-date — keep the ceiling caveat). Provenance: T-666 #6893, T-665 #6882, T-667 #6936 (P4).

## Philippines
- **Source + tier:** NCMF (National Commission on Muslim Filipinos) official Ramadhan Calendar 1447 — 29 per-city JPEGs; plus Bangsamoro Darul Ifta's official Cotabato table; authority, RAMADAN-ONLY.
- **Recipe:** none published (no parameters); images only.
- **Asr:** n/a.
- **Clock:** IANA.
- **Evidence:** 29 per-city images (P5 upgraded the country to secondary Ramadan-only).
- **Grade:** candidate.
- **Surface:** NCMF JPEG set + Darul Ifta Cotabato table.
- **Defects:** no year-round surface; no parameters.
- **Lift:** a year-round official surface.
- **Provenance:** SL v2.1 `PH-NCMF`; T-667 #6935 (P5).

## Hong Kong
- **Source + tier:** Kowloon Mosque via the Islamic Union's Masjidal tenant; authority-tier feed.
- **Recipe:** PER-COLUMN PROVENANCE MANDATORY (v2.5, T-675 #7092): the Trustees' own print is THREE constructions on one sheet — page 1 an angle table (fajr 18.5, isha 21.3), page 2 fixed intervals (fajr sunrise-80, isha maghrib+80, dhuhr a 13:00 clock, Hanafi asr); the Masjidal feed takes page 1's fajr and page 2's isha and matches NEITHER page's dhuhr or maghrib (worst column 49 minutes). On the feed layer: fajr 18.4 rounds down, dhuhr +5, asr Shafi +1, maghrib +3, isha sunset+83. The one durable cross-era result is fajr at 18.4 deg, 26 years apart.
- **Asr:** Shafi +1.
- **Clock:** IANA.
- **Evidence:** the withdrawn A stays withdrawn, harder: the Masjidal athan span is generated on demand (T-668 #6989), so three years of it are one generation; 1,096 days served 2024-2026, 2025 completely clean (isha-maghrib exactly 80 on all 365 days).
- **Grade:** provisional (v2.5 aligns the row with the object's v2.3 downgrade; the v2 row's A was stale).
- **Surface:** Masjidal KEYLESS RANGE API — serves FULL PAST YEARS in one request, iqamah included (Kowloon 2025 whole; 731-day spans verified; the CURRENT-QUARTER cap belongs only to the keyed shape). TIER 1 platform.
- **Defects:** the three constructions are never merged into one table; page 2's dhuhr clock and Hanafi asr are a jama'ah sheet, not an athan policy; two feed exceptions carried as annual overrides (2026-04 fajr, 2026-06 isha, 2024-01).
- **Lift:** a preserved dated capture of a year that differs from today's render.
- **Provenance:** SL v2.5 `HK-MASJIDAL` (dhuhr margin +6 and rounding superseded by #6983); T-668 #6983 (C31), #6989 (C42), #6991 (C43); T-667 #6922 (L3), #6948 (N2f); T-668 #6979 (C32 platform tier); T-675 #7092 (O1k-D3 deep3, china; D14 ruled a).

## Taiwan
- **Grade:** FALLBACK — NO STABLE RULE: Taipei publishes manually buffered times whose buffers drift year over year (dhuhr +18 in 2022, +11 in 2024, +15 in 2026 on 32 wayback days); nothing reusable, data-feed class only; the Grand Mosque's site renders a third-party display app running 2-54 min above the association's own MWL table — two timetables in one city. Provenance: T-667 #6922 (L3), T-668 #6951 (C8).

## China
- **Grade:** FALLBACK — the association publishes nothing; the norislam portal COMPUTES a national table for 2,460 county points (yearless, 3-day sampling, a stated +5 min safety shift instruction) — a calculator, not a publisher; only a community portal states a method (18/17 Hanafi with ±3-7 min terrain margins). Provenance: T-668 #6951 (C8), #6935 (P5), T-665 #6882.

## Japan
- **Grade:** candidate (community tier) — Tokyo Camii prints 6-7 min of safety INSIDE its sunrise/sunset columns while Nagoya prints NONE (same country, two kinds of number — a feeder must not mix them); Nagoya's full-year PDF carries all 12 months (one parse away); Kobe Mosque has NO official website (kobemosque.info is a content farm — flagged, never harvest). Provenance: T-668 #6951 (C8).

## Korea (South)
- **Grade:** candidate (community tier) — two Seoul mawaqit captures; T-665 carried Korea January-class feed. Provenance: T-668 #6951 (C8), T-665 #6882.

## Mongolia
- **Grade:** candidate (community tier) — Ulaanbaatar mawaqit capture. Provenance: T-668 #6951 (C8).

## Vietnam
- **Grade:** candidate (community tier) — Hanoi mawaqit capture. Provenance: T-668 #6951 (C8).

## Cambodia
- **Grade:** candidate (community tier) — Phnom Penh mawaqit capture. Provenance: T-668 #6951 (C8).

## Laos
- **Grade:** candidate (community tier) — Vientiane ×2 mawaqit captures. Provenance: T-668 #6951 (C8).

## Myanmar
- **Grade:** FALLBACK — genuinely empty (aggregators only). Provenance: T-668 #6951 (C8).

## Russia — Tatarstan (DUM RT)
- **Source + tier:** Spiritual Board of Muslims of Tatarstan (dumrt.ru); authority. THE BEST SURFACE FOUND IN THE REGION.
- **Recipe:** fajr 18 / isha 15, Hanafi asr; the published dhuhr column is a FIXED 12:00 JAMA'AH (zawal is the noon — the mosque layer inside an authority CSV); 2026 rounding fajr-floor / rest-ceil; 2025 all-floor-but-maghrib; the SUMMER SUBSTITUTE (fajr sunrise-120, isha sunset+90) is ASTRONOMICALLY BOUNDED — exactly the days 18 deg is unreachable (Kazan 6 May-8 Aug, 95 days, 4,048 substituted city-days), isha switching one day early, consistent with shafaq tested on the following night. NEVER MERGE ACROSS PUBLISHERS ON ONE NATIONAL METHOD.
- **Asr:** Hanafi.
- **Clock:** IANA.
- **Evidence:** 44 cities × TWO YEARS (2025+2026). MULTI-YEAR PASS OUT OF SAMPLE: positions fitted on 2026 only, reused on 2025 — 100 pc within-1 on every column but isha 2025 (92.2 pc, a ~30 s rounding-pass difference).
- **Grade:** A.
- **Surface:** 44-city select serving FULL-YEAR CSV per city. BONUS DISCOVERY: 2025's ninth CSV column is the QIBLA TIME (azimuth 195.2 on four anchor dates vs Kazan's 195.18) — a derived time the policy layer may want.
- **Defects:** isha 2025's rounding-pass gap.
- **Lift:** at top grade.
- **Provenance:** SL v2.1 `RU-DUMRT` (fitPending → C23 RETURNED with the multi-year pass; the patch lands in the final consolidation); T-668 #6982 (C23), #6984 (C33); archive `census/c23-russia/`.

## Russia — CDUM (Central Spiritual Board)
- **Source + tier:** CDUM (cdum.ru); authority. Moscow line #1.
- **Recipe:** 18/17 HANAFI (a DIFFERENT isha from Tatarstan's 15 — the two boards do not share a method); mornings 2.6 min early, evenings 1.4 late; floor.
- **Asr:** Hanafi.
- **Clock:** IANA.
- **Evidence:** 20 cities, ONE year.
- **Grade:** provisional.
- **Surface:** cdum.ru 21-city year tables (10 captured by C10, 20 fitted by C23).
- **Defects:** its Kazan page ANOMALOUSLY CARRIES TATARSTAN'S SERIES — prefer the regional board where cities overlap; Ufa hijri-images (0 rows); Salekhard mislabeled (header says Salekhard, geometry says two different latitudes, asr 6 min after its own dhuhr); Orenburg one year printed twice.
- **Lift:** year-2.
- **Provenance:** SL v2.1 `RU-CDUM` (fitPending → C23 returned); T-668 #6982 (C23), #6963 (C10).

## Russia — Bashkortostan (DUM RB)
- **Source + tier:** DUM RB via api.dumrb.com — the SPA HID A PUBLIC JSON API (GetSupportedCities/GetByCity); authority.
- **Recipe:** 16/15 Hanafi; suhur = fajr - 15; dhuhr fixed jama'ah 13:30-13:35; its summer substitute runs WIDER than astronomy requires so NO ANGLE MODEL covers the summer half; 2025 is a DIFFERENT recipe (sunrise-120 vs -90); Sibay off-rule all year.
- **Asr:** Hanafi.
- **Clock:** IANA.
- **Evidence:** 63 cities; one year with a different-recipe prior year.
- **Grade:** provisional, partial (the summer half unfittable as a frozen object).
- **Surface:** api.dumrb.com JSON.
- **Defects:** summer substitute wider than astronomy; 2025 recipe break; Sibay off-rule.
- **Lift:** the publisher fixing the summer band; meanwhile carry the winter-half fit.
- **Provenance:** T-668 #6982 (C23); archive `census/c23-russia/`.

## Russia — Moscow (DUM RF)
- **Source + tier:** DUM RF (Moscow); authority. Moscow line #2 — THE MOSCOW SPLIT IS SETTLED: CDUM prints HANAFI asr + isha 17; DUM RF prints SHAFI asr + isha 15 (monthly PNGs); the 39-min asr gap and 17-min isha gap are both CORRECT within their own methods; modelled at Moscow: Hanafi asr 14:56 vs Shafi 14:19, isha 17 deg 18:48 vs 15 deg 18:34.
- **Recipe:** Shafi asr, isha 15, monthly PNG prints; unfitted as a series.
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** the umma.ru layer (Moscow+Kazan monthly) matches mosmechet.ru exactly (1 Nov); Kazan's umma mirrors CDUM there, NOT DUM RT.
- **Grade:** candidate.
- **Surface:** DUM RF monthly PNGs; umma.ru / mosmechet.ru community mirrors.
- **Defects:** image prints; PLATFORM TRAP: mawaqit rows carry SIX columns in Moscow but SEVEN in Baku (a leading imsak duplicating fajr — a fixed reader silently shifts Baku by one prayer); iqama stored as MINUTE OFFSETS in some mosques, ABSOLUTE CLOCK TIMES in others.
- **Lift:** a machine-readable DUM RF series.
- **Provenance:** T-668 #6982 (C23), #6963 (C10).

## Georgia
- **Grade:** candidate (community tier) — the muftiate's API publishes a 99-MOSQUE INVENTORY WITH COORDINATES but every prayerTimes field is an EMPTY STRING (times live in the phone app only); the Tbilisi Juma Mosque's mawaqit page is the country's single dated table. Provenance: T-668 #6963 (C10).

## Armenia
- **Grade:** FALLBACK — genuine absence. Provenance: T-668 #6963 (C10).

## Azerbaijan
- **Grade:** FALLBACK — the muftiate stays IMAGE-ONLY (prior upheld; the same OCR-class reason it dropped from bake); the mosque layer recovered: two Baku mosques with mosque-set iqama and DIFFERENT jumua times, proving athan is platform-computed while iqama/jumua are mosque configuration. Provenance: T-668 #6963 (C10), T-667 #6937 (P4).
# REGION 5 — Americas (15 rows)

## United States
- **Source + tier:** FCNA positions (published scheme) over a deeply fragmented mosque mosaic; the mosaic IS the reality — no national authority is followed.
- **Recipe:** published FCNA 15/15 is PRINTED BY ALMOST NOBODY: of 16 captured mosques only two state any method and both state ISNA (15/15 family); ONE contradicts explicitly — Chicago's Islamic Foundation prints FAJR 18 / ISHA 15 / ASR HANAFI (the PRE-2015 FCNA convention) on every page of its full-year calendar; the unstated big-city fajr columns (DC, Chicago, Dallas, Boston, LA) sit AT-OR-EARLIER than the 18-degree line, so community practice skews CONSERVATIVE, not toward the published 15/15.
- **Asr:** mixed (Hanafi at Chicago Islamic Foundation).
- **Clock:** IANA.
- **Evidence:** 16 mosques; Dar al-Hijrah's 365-row dpt capture.
- **Grade:** candidate (community tier).
- **Surface:** mosque sites + the dpt plugin pool (see the pool row).
- **Defects:** the Islamic Center of Washington DC runs a USNO-based extreme-caution Fajr ~30 min earlier than 15 deg; per-city practice cannot be unified.
- **Lift:** n/a (mosaic ceiling); per-city community recipes are the only honest unit.
- **Provenance:** T-668 #6967 (C4), T-665 #6882, T-666 #6893.

## Canada
- **Grade:** candidate (community tier) — FCNA's 13/13 appears NOWHERE in practice; ISNA Canada's own HQ exposes fixed iqamah blocks (Fajr 6:05 all November) with only Maghrib as a clean athan trace; Quebec's flagship is an image-only calendar (OCR class). Provenance: T-668 #6967 (C4).

## dpt / masjidal mosque-plugin pool (US, Canada, UK, Ireland — the instant-multi-year community pool)
- **Source + tier:** the WordPress "dpt" plugin and the Masjidal platform across the English-speaking mosque web; platform/community tier — never an authority, never claim the user's mosque.
- **Recipe:** per-mosque inline year JSON; NO frozen recipe — this row is the pool the app reads as live community data.
- **Asr:** per mosque.
- **Clock:** IANA.
- **Evidence:** dpt pattern: `?rest_route=/dpt/v1/prayertime&filter=year` = FULL-YEAR JSON per mosque (Dar al-Hijrah captured 365 rows this way; Bradford is the DENSEST patch: Jamia Hanfia inline year JSON + Masjid Bilal dpt year + Victor Street; Belfast Islamic Centre = full-year dpt gold). dpt SWEEP: 2 working, 1 defective, 1 serving-2020 (stale installs are real), 8 clean 404s.
- **Grade:** candidate (pool).
- **Surface:** TIER 1 = masjidal keyless range API (full past years, iqamah included; 731-day spans verified) + the WordPress dpt filter=year (one-request full-year JSON; filter=month IGNORES its params — parse what d_date covers; spans are per-install). TIER 2 = mawaqit (trap-dense, full suite mandatory: today-row anchoring, solar gate, byte-identity-vs-default, iqama form detection, TZ-FIELD DISTRUST, calendar-year resolution), masjidbox (the held key is GLOBAL not per-mosque; days= clamps to 7 but history walks via begin=; the .ics idea FALSIFIED (soft-404); the public landing page embeds the whole payload inline, keyless), athanplus (today-poll only). TIER 3 = Amanahly (public endpoint TENANT-PINNED to one mosque, MIA Liverpool).
- **Defects:** THE LIVE-PAGE GATE IS MANDATORY: Manchester Central's own dpt feed CONTRADICTS its live page (+24..+84 min) — dpt outputs must always be gated against the live page; SWIC Cardiff holds dhuhr/asr FLAT all month (placeholder-class, flagged); Edinburgh prints weekly HELD jama'ah blocks (a distinct print style); masjidtakhim.com does not exist (phantom killed).
- **Lift:** per-mosque fits lift individual mosques to provisional community recipes.
- **Provenance:** T-668 #6967 (C4), #6981 (C24), #6979 (C32 platform spec).

## Mexico
- **Grade:** FALLBACK — SECOND ZERO confirmed. Provenance: T-668 #6952 (C7).

## Colombia
- **Grade:** candidate (community tier) — one capture (Cartagena). Provenance: T-668 #6952 (C7).

## Brazil
- **Source + tier:** Instituto Islamico Brasileiro (IIB), daily and month tables for 25 cities; community.
- **Recipe:** 18/17 Shafi fitted on Sao Paulo to 0-1 min (5 September rows excluded as fitting no solution).
- **Asr:** Shafi.
- **Clock:** IANA.
- **Evidence:** 7 days, ONE city — SINGLE-CITY PROVENANCE FLAGGED (24 cities unfitted).
- **Grade:** provisional (community tier).
- **Surface:** IIB tables.
- **Defects:** single-city fit carried as the national recipe; KNOWN ARTIFACT: FAMBRAS embeds Sao Paulo times on a Brasilia page (wrong-city widget).
- **Lift:** a second city-year.
- **Provenance:** SL v2.1 `BR-IIB`; T-667 #6935 (P5), T-668 #6952 (C7 cited mawaqit mosques: Sao Paulo Khaled Ibn el Walid, Cuiaba, Curitiba).

## Argentina
- **Grade:** candidate (community tier) — one stale 2021 PDF + two calculated calendars; Buenos Aires Al Ahmad, Mar del Plata, Cordoba are mawaqit-hosted (cited). Provenance: T-668 #6952 (C7).

## Chile
- **Source + tier:** Centro Islamico de Chile (Mezquita As-Salam, Santiago) — one monthly ATHAN PDF per city for EIGHTEEN cities (Arica to Punta Arenas); the community tier that is the best available, treated as recipe-tier. No method stated.
- **Recipe:** ONE recipe serves 17 of 18 cities across 34.7 DEGREES of latitude (18.5 S-53.2 S): fajr 18 / isha 17 / asr Shafi / +6 MIN ON EVERY COLUMN INCLUDING SHURUQ (a workbook CLOCK OFFSET, not a safety margin — uniform across cities and months; without it the source will not merge with an unshifted 18/17 feed) / round-to-minute. PUNTA ARENAS (53 S) IS THE BRANCH, fully characterized: fajr = sunrise - 0.3063N for the WHOLE month (even days where the 18-deg angle still exists); isha = min(17 deg, sunset + 0.2779N); N = the previous night; the portions are 18.38/60 and 16.68/60, NOT adhan's angle/60 — TwilightAngle will NOT reproduce this source; the two columns switch on different days (fajr month-wide, isha hands over 4 Nov); the branch is SEASONAL (July 2025 and the Octobers are pure angle; the seam sits at the workbook boundary).
- **Asr:** Shafi (+6 offset).
- **Clock:** IANA.
- **Evidence:** all 18 cities captured November + October (61-day basis), validated 0 mismatches against C7's independent captures; per-city fits 17.85-18.06 fajr, 16.94-17.06 isha, rms 0.31-0.55. The two months span two named years (2025 Oct, 2026 Nov) — single-generation caution kept.
- **Grade:** provisional, with a POLAR BRANCH.
- **Surface:** monthly PDFs. ROLLOVER CONVENTION SETTLED: archived Decembers print post-midnight isha as 00:xx ON ITS OWN DATE'S ROW — a 00:xx isha belongs to the PREVIOUS civil date, and November's 23:59s are not truncation (the app's belongsToDate policy test case).
- **Defects:** the Vina del Mar button links OCTOBER's sheet (November exists unlinked); December publishes ~29 Nov; MULTI-YEAR PATH: none from the publisher (uploads purged; year slugs 404) — Wayback holds 190 PDFs across 5 years in 3 naming eras but no contiguous run; build the series forward monthly.
- **Lift:** twelve forward months = year-2.
- **Provenance:** SL v2.1 `CL-CIS`; T-668 #6966 (C17), #6952 (C7); archive `census/c17-chile/`.

## Peru
- **Grade:** candidate (community tier) — Lima ×2 mawaqit cited. Provenance: T-668 #6952 (C7).

## Guyana
- **Grade:** FALLBACK — current-none. Provenance: T-668 #6952 (C7).

## Guatemala
- **Source + tier:** Mezquita Aldaawa Islamica de Guatemala, Zona 9 (mawaqit); community — the country's first dated data and the cleanest single surface in the Americas sweep.
- **Recipe:** literal MWL 18/17, Shafi, zero margins, nearest — reproduced at the mosque's own coordinates on five columns 365/365 (fajr 341 exact/365); the mosque states no method in text, so the recipe is fitted, never stated. Builder rule applies: a PrayTimes-v2-family engine reproduces the table at zero margins.
- **Asr:** Shafi.
- **Clock:** IANA (UTC-6, no civil DST since 2006).
- **Evidence:** 365 dated rows plus 365 iqamah rows, jumua 13:00.
- **Grade:** community (v2.5, T-675 #7092).
- **Surface:** mawaqit page (coordinates published by the mosque).
- **Defects:** the residue is the engine, not the mosque (adhan's transit sits about a minute after this table's dhuhr).
- **Lift:** year-2 is one page load.
- **Provenance:** SL v2.5 `GT-ALDAWA`; T-675 #7092 (O1k-W14 americas2, O1k-F7 fit7; D14 ruled a — new row).

## Honduras
- **Source + tier:** Centro Islamico de Honduras, San Pedro Sula (mawaqit); community.
- **Recipe:** fajr 18, isha 18 + 5-minute caution, maghrib sunset + 5, zero margins elsewhere, nearest — and HANAFI asr, 61.5 minutes off the Shafi column: the largest single-column spread in the Americas sweep; confirmed 365/365 at the source pair. Builder rule applies (PrayTimes-v2 family).
- **Asr:** Hanafi (unambiguous).
- **Clock:** IANA (UTC-6, no civil DST).
- **Evidence:** 365 dated rows plus 365 iqamah rows, jumua 13:25.
- **Grade:** community (v2.5, T-675 #7092).
- **Surface:** mawaqit page (coordinates published).
- **Defects:** whether the per-column offset model can express a five-minute caution on two columns with none on fajr is a test owed.
- **Lift:** year-2 is one page load.
- **Provenance:** SL v2.5 `HN-CENTRO-ISLAMICO`; T-675 #7092 (O1k-W14 americas2, O1k-F7 fit7; D14 ruled a — new row).

## Venezuela
- **Source + tier:** Mezquita de Caracas (monthly PDF, mezquitadecaracas.com/horario-salat.pdf); community — the mosque is the publisher.
- **Recipe:** Umm al-Qura family: fajr 18.5 (+0.75-minute caution; free fit 18.48), isha = maghrib + 89 EXACTLY on all 30 days, maghrib +2, dhuhr +2, asr Shafi +0.5, nearest. The web page says MWL, the PDF stamps Umm al-Qura, and the numbers side with the PDF. The ten-city ladder is the PDF's (Maracaibo +19, Bolivar -12) — resolved at apply: the PDF governs, never both.
- **Asr:** Shafi.
- **Clock:** IANA (UTC-4, no civil DST since 2016).
- **Evidence:** 30 dated rows (2026-10-12..11-10), one Hijri month dated by its own weekday sequence; 180 cells all within one.
- **Grade:** community (v2.5, T-675 #7092).
- **Surface:** mezquitadecaracas.com/horario-salat.pdf.
- **Defects:** the angle-caution split on fajr is unmeasured; no seasonal amplitude is measurable on one Hijri month.
- **Lift:** a monthly fetch series to a year.
- **Provenance:** SL v2.5 `VE-CARACAS`; T-675 #7092 (O1k-W14 americas2, O1k-F7 fit7; D14 ruled a — new row).

## Suriname
- **Grade:** FALLBACK — current-none. Provenance: T-668 #6952 (C7).

## Trinidad and Tobago
- **Source + tier:** four Masjidbox-hosted masjids — Chaguanas Masjid, Guaico Masjid ul Mu'mineen, San Fernando Jama Masjid, Crown Point Masjid Abdullah Ibn Abbaas; platform/community.
- **Recipe:** unfitted; athan+iqama pairs.
- **Asr:** per mosque.
- **Clock:** IANA (-04:00).
- **Evidence:** 28 dated rows.
- **Grade:** candidate.
- **Surface:** Masjidbox profiles.
- **Defects:** KNOWN ARTIFACT: the Chaguanas profile timezone is -05:00 against Trinidad's -04:00 — its whole page sits AN HOUR EARLY against its three neighbours (a platform profile defect carried in the known-artifacts list).
- **Lift:** fit one mosque-year after excluding the Chaguanas profile.
- **Provenance:** SL v2.1 `TT-MASJIDBOX`; T-668 #6952 (C7).
# REGION 6 — Oceania (11 rows)

## Australia
- **Source + tier:** UMA Centre (United Muslims of Australia), Sydney (Punchbowl); community. The mosque layer publishes mostly through clock widgets, with UMA and MIA Liverpool the real exceptions.
- **Recipe:** unfitted; whole-year athan JSON; independently confirmed against Lakemba's AthanPlus widget — TWO MOSQUES SHARING ONE CALCULATION, differing only in iqamah.
- **Asr:** per feed (unfitted); jamaah rules carried beside the athan policy (the v2.1 jamaahRules field).
- **Clock:** IANA.
- **Evidence:** 370 dated days (whole-year JSON); MIA Liverpool serves a 30-day JSON API; Victoria has a STATE-WIDE calculated calendar (Hilaal Committee, image PDF, both Asr schools); QLD/WA/TAS/NT are today-only or absent.
- **Grade:** candidate.
- **Surface:** UMA Sydney whole-year JSON; MIA Liverpool 30-day API.
- **Defects:** ANIC and AFIC prayer pages 404 — no national body surface; per-mosque layer is widget-class.
- **Lift:** fit the UMA year (instant provisional community recipe); enumerate the Amanahly-built mosque sites (keyless athan+jamah JSON per mosque).
- **Provenance:** SL v2.1 `AU-UMA`; T-668 #6954 (C9).

## New Zealand
- **Source + tier:** FIANZ (Federation of Islamic Associations of New Zealand); community.
- **Recipe:** FIANZ is reborn on fianz.com: 33-city Ramadan 1447H sheets with the stated offsets printed verbatim; fitted NOT one pair — Auckland 18/18, Wellington 16/15, Christchurch 16/15 (sd ~0.05 deg); the printed offsets hold everywhere (suhoorEnds = fajr - 5 exactly, sd 0 across all 90 rows; maghrib = sunset + 5; single-shadow asr, shadow-2 residual ~-55 min).
- **Asr:** single-shadow primary, double ~55 min later.
- **Clock:** IANA.
- **Evidence:** Auckland, Wellington and Christchurch transcribed (90 rows). RAMADAN-START CONTRADICTION on record: the sheets start Ramadan 1 on Thursday 19 February 2026 while the federation's own Hilal Committee announces Friday 20 February — D7 ruled a (T-675 #7092): the announced date governs Ramadan 1, the table's own times stand.
- **Grade:** candidate (held).
- **Surface:** fianz.com (the successor to the suspended fianz.co.nz).
- **Defects:** Ramadan-only artifacts; Wellington's solar columns sit early vs the census coordinates (sunrise -4.3, dhuhr -1.5) — its sheet was likely computed at a shifted point.
- **Lift:** a year-round FIANZ publication.
- **Provenance:** SL v2.5 `NZ-FIANZ`; T-668 #6954 (C9); T-675 #7092 (O1k-W15 oceania2, O1k-F13 fit13; D7 ruled a).

## Fiji
- **Source + tier:** Fiji Muslim League (FML) national monthly timetable; community federation.
- **Recipe (C35 quantified):** fajr EXACTLY 18.0; dhuhr +3; maghrib +3; isha +5-9 past 17 deg; DUAL ASR (both exact in their madhabs); the TOWN LADDER is 4 min/degree of longitude from Suva EXCEPT LAKEBA -11 vs geometric -1.3 — a FIXED LEGACY CONVENTION that rides inside the table (the v2.1 townOffsets field); "Navuda" was a mis-transcription of NAVUA (C9's record corrected).
- **Asr:** both schools printed, each exact in its madhab.
- **Clock:** IANA.
- **Evidence:** November 2026 transcribed from the league's public page; the 2024-equals-2026 identity is a GENUINE minute-granularity solar coincidence — PROVEN by December 2025 fitting the same recipe (not a frozen table). Two partial years (Dec 2025, Nov 2026) fit one recipe; full-year fits would clear the ruling's letter — left at provisional and flagged for the owner.
- **Grade:** provisional (recipe fitted; months thin).
- **Surface:** the league's public monthly page (the live site previously served the 2024 image set — C9's stale-2024 caveat resolved by the fresh transcription; fresher months had been Facebook-only).
- **Defects:** month-at-a-time publishing; the Lakeba convention must travel with the table.
- **Lift:** a full-year capture set.
- **Provenance:** SL v2.1 `FJ-FML`; T-668 #6987 (C35), #6954 (C9).

## Tonga
- **Grade:** candidate (community tier) — one mosque, both layers. Provenance: T-668 #6973 (C22).

## New Caledonia
- **Source + tier:** Centre Islamique de Noumea (mawaqit); community — the region's best-kept board, now fitted.
- **Recipe:** fajr 18 raw nearest (365/365 within one); maghrib floor(sunset)+5 (313/365 exact); dhuhr 5-min hand blocks tracking transit+30 (round5 exact 252/365); asr shadow-1 +2. ISHA CORRECTED: "pinned 19:45 all year" is REFUTED — a 19:45 floor holds only 243/365 days (2026-04-01..11-29, the winter floor); then graded 19:50→20:05 in 7-day blocks tracking sunset+85 (~17.7 deg), Jan blocks 20:15/20:05/20:00/19:55, and 20:15 exactly 2026-02-18..03-18 = Ramadan 1447H, a taraweeh override sitting 20-35 min past any twilight angle.
- **Asr:** Shafi-class (shadow-1 +2, envelope -8..+16).
- **Clock:** IANA (UTC+11 fixed).
- **Evidence:** the full year captured gated live (365 rows; a stray platform 2026-02-29 row dropped).
- **Grade:** candidate (held) — fully characterised but hand-maintained; between-year stability untestable from one year.
- **Surface:** mawaqit (mosquee-de-noumea).
- **Defects:** the 5-grid columns are hand blocks; the Ramadan override is a board convention, not astronomy.
- **Lift:** a second year of the board.
- **Provenance:** SL v2.5 `NC-NOUMEA`; T-668 #6973 (C22); T-675 #7092 (O1k-W15 oceania2, O1k-F13 fit13; D14 ruled a — the isha correction).

## French Polynesia
- **Grade:** FALLBACK — Tahiti's Masjidway page is UNCLAIMED (a calculator with a mosque's address — citable, never). Provenance: T-668 #6973 (C22).

## Papua New Guinea
- **Grade:** FALLBACK — empty "Prayer Times" heading only (honest negative). Provenance: T-668 #6973 (C22).

## Solomon Islands
- **Grade:** FALLBACK — honest negative. Provenance: T-668 #6973 (C22).

## Vanuatu
- **Grade:** FALLBACK — honest negative. Provenance: T-668 #6973 (C22).

## Samoa
- **Grade:** FALLBACK — honest negative. Provenance: T-668 #6973 (C22).

## Kiribati
- **Grade:** FALLBACK — honest negative (searched in five languages). Provenance: T-668 #6973 (C22).

---

## Unrecorded countries

Countries absent from this table are absent from the record (never surveyed or never censused):
they ship the fallback band by default (A1, agent-ruled 2026-11-11, T-675 #7092): 18/18 Shafi computed
below 45 degrees, Moonsighting Committee computed 45-55, its own 1/7-of-night portions above 55 —
badged computed, no body claimed — and gain a row only when a surface is found. The plan should
treat absence as FALLBACK, not as an error.

---

## v3 fold (T-675, 2026-11-11)

The o1k-wide pack applied under the agent-ruled rulings (T-675 #7092, D6 reversed at #7103). Rows: 166 -> 174 —
five new countries (Guatemala, Honduras, Venezuela, Luxembourg, Belarus), three second lines for
countries the table already carried (Norway Jamiat, Italy Rome, Switzerland Geneva), and nine stubs
rewritten to data rows with their ids renamed: LV-NONE -> LV-LIKC, LT-NONE -> LT-MUFTIATE, SO-NONE ->
SO-MWAQIT, SN-DAKAR -> SN-CERFI, ML-NONE -> ML-ALMADINA, GN-NONE -> GN-NONO, PK-NIZAM-WATCH ->
PK-NIZAM-E-SALAT, DK-NONE -> DK-COPENHAGEN, BJ-COTONOU -> BJ-NONE. Classes: A 17, provisional 40,
candidate 65, community 15, F 2, FALLBACK 35. The 17 grade movements: Pakistan FALLBACK ->
provisional, Tunisia and Iceland -> A, EU-Diyanet F -> provisional, Netherlands -> A (contested,
flagged), Djibouti/Senegal/Mali/Guinea/Somalia/Mauritius -> community, Latvia and Lithuania FALLBACK ->
candidate, Denmark FALLBACK -> candidate, Niger A -> provisional (the D3 consequence), Benin candidate
withdrawn -> FALLBACK (D15), Hong Kong's stale row A aligned to the object's provisional. Nigeria's row
carries D6 reversed: MWL 18/17 is the mosque-level and national recipe, and the Egyptian 19.5/17.5 line
is masjidway's platform default, never regional practice. Every movement cites T-675 #7092 and its O1k
workspace. The fit index governs where it conflicts with the wtdiff; each conflict is recorded on its row.
