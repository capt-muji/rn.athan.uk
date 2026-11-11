# O1k wide research: Iberia and the Alpine south (tag iberia2)

Scope: Spain, Portugal, Italy, Switzerland, Andorra. Captures 2026-11-10. Public pages only; no
login, no form, no challenge solved.

Row counts are per city-year file in `data/`. Total dated rows captured: 7,727, of which 668 are
the Madrid confirmation capture (already on record) and 7,059 are new.

## Spain

| source | URL | tier | dated data | years |
|---|---|---|---|---|
| CCIM Madrid (Mezquita M-30) | `centro-islamico.com/Doc/Horario/<year>/<Mes>-<year>.pdf` | community (national best) | 334 rows a year, month by month | 2025, 2026 |
| Mezquita Mayor de Granada | `mezquitadegranada.com/horario-del-salat/?salat_cal=hijri&salat_hijri=<H>-<M>` | community (mosque) | full hijri-month table, 29-30 rows a request | 1447, 1448 |
| Centro Cultural Andalusí de Málaga | `ccandalusi.org/horario-de-oracion-noviembre-2026/` (image) | community (mosque) | monthly poster, 30 rows | 2026-11 (archive to 2024) |
| Comisión Islámica de España | `comisionislamica.org` | authority-adjacent | none: news, services, no calendar | - |

**Confirms.** Madrid re-captured whole: 334 rows for 2025 and 334 for 2026, 668 in all, which is
exactly the census's two-year count. Margins re-measured on the fresh capture against a NOAA solar
model at 40.4168/-3.7038, DST applied: fajr 18.25°+1 (median residual +0.92), sunrise −2 (−1.55),
dhuhr noon+1 (+1.18), asr Shafi+1 (+1.22), maghrib sunset+2 (+2.19), isha 17°+1 (+1.20). Every
column sits within half a minute of the record's recipe, both years, so the parameters are frozen
2025 to 2026.

**Correction to the record.** "Misses December both years" is wrong on one of them: 2025 December
is published and captured here. The two holes are **March 2025** and **December 2026**. March 2025
answers 404 on two independent routes (direct and through a render service), so it is absent, not
throttled. A second defect class: three of the 668 rows print a time with a full stop instead of a
colon (`13.27`, `15.45`, `14.20`), which is why a strict parser loses 22 January, 6 November and
22/31 March.

**New.** Granada is the second city, and it is a real full-year surface. The page serves any hijri
month on request, `?salat_cal=hijri&salat_hijri=1448-04`, so the record's "full hijri-month table"
is a query parameter rather than a printed sheet. Hijri 1447 captures whole: 355 rows,
2025-06-27 to 2026-06-16, no gaps. 1448 is served to 2026-11-10 (147 rows); requests past the
current month silently return the current month's table, so only five of its twelve months are
genuine. Granada's recipe is not Madrid's: fajr 18°+0, isha 17°+0, dhuhr solar noon with no
margin, asr Shafi+0, maghrib sunset+1.5, and shuruq printed five minutes late (sunrise+5) as a
safety margin.

Málaga is a third city on a second Andalusian scheme: fajr 18°+1, isha 17°+0.3, dhuhr noon+1.7,
asr Shafi, maghrib sunset+1.3, sunrise −0.7, from a 30-row poster that carries the Muslim World
League device. Granada and Málaga therefore agree on MWL 18/17 while Madrid prints 18.25/17 with
its own margins: the Andalusian practice and the Madrid practice are two different lines, and both
are now dated output.

**No Andalusian federation calendar exists.** The Federación Islámica de Andalucía is a registered
federation (Justice Ministry register, inscription 021313, 28/01/2009) with no web surface found in
Spanish. CIE, the national body, publishes no timetable either.

**CCIM 2027: nothing exists yet.** All twelve `2027/<Mes>-2027.pdf` URLs were probed twice, once
from a clean path and once through a render service: twelve for twelve absent on 2026-11-10. The
publisher posts month by month, a few days ahead, so year-3 accrual has to wait for January. The
Cloudflare rate limit (error 1015) trips after roughly fifteen requests and holds for more than
twenty minutes; a capture run needs 20 s spacing.

## Portugal

| source | URL | tier | dated data | years |
|---|---|---|---|---|
| hsalah.info / CIL Lisboa annual | `irp.cdn-website.com/cce0f1db/files/uploaded/<slug>_<year>.pdf` | community (CIL Lisboa hub) | 365 rows a city-year, 12 monthly pages | 2026, 2027 |
| same, prior edition | same path, `_2023` | community | 365 rows a city-year | 2023 |
| same, monthly sheet | `<slug>_nov.pdf`, `_dez.pdf`, `_out_vN.pdf` | community | 30 rows + five jama'ah columns | rolling, current |
| Wayback hold of the 2023 edition | `web.archive.org/web/2023id_/...` | community | 21 cities, 365 rows each | 2023 |

**Confirms.** The annual pattern is as advertised and the multi-year ruling holds: 2026 and 2027
sit 365 rows each for every city tried, all parsing cleanly with 1- and 2-digit hours.

**Prior years.** `_2024.pdf` and `_2025.pdf` were never published: the CDN answers 403 (its
calibrated absent signal) for both, for lisboa and porto. The Wayback CDX index of the same upload
folder holds the **2023** edition for all 21 cities, captured 2023-10-22, and that is the real
prior-year archive. Five 2023 files are banked here (lisboa, porto, braga, coimbra, faro).

**Frozen generation, measured across four years and three editions.** Reading each edition's
margins with longitude anchored on its own printed zawal (whose residual is 0.00, so the
publisher's noon is recovered exactly) and latitude fitted to the Sunrise/Asr shape:

| column | 2023 | 2026 | 2027 |
|---|---|---|---|
| zawal − solar noon | 0.00 (sd 0.00) | 0.00 | 0.00 |
| dhuhr − zawal | +5.00 (sd 0.00) | +5.00 | +5.00 |
| sunrise − horizon | −1.02 | −1.05 | −1.03 |
| maghrib − sunset | +3.00 | +3.04 | +3.01 |
| fajr vs 18° | +0.01 | −0.03 | +0.05 |
| isha vs 12.5° | +15.9 (no angle column in 2023) | +0.10 | +0.15 |
| second isha − maghrib | +77 (sd 0.00) | +77 | +77 |

The rule does not move between 2023 and 2027 by more than 0.05 min on any solar column, and the
latitude recovered from each edition is identical (38.70 Lisboa, 41.14 Porto, 41.54 Braga, 40.16
Coimbra, 37.00 Faro; the real cities are within 0.06°). Four findings against the record:

1. **The publisher states its isha rule, and the record's fitted version is that statement seen
   through another engine.** From 2026 the header labels the columns `Ishá (12º + 3 min)` and
   `Ishá (01:20)`. My free fit puts the first column at 12.5° + 0.1 min (sd 0.70) and the record puts
   it at 12.5 + 1; at Lisbon's latitude half a degree of twilight is about three minutes, so
   "12° + 3" and "12.5° + 0" are one and the same printed minute. The column is a stated-method
   witness, not a derived fit, and the record's 12.5+1 is a fitted approximation of a published 12+3.
2. The interval column is **printed maghrib + 77**, exact every day of every year (sd 0.00), and its
   label is `01:20`. If the 3-minute maghrib margin sits between sunset and the printed maghrib, the
   anchor is sunset and the interval is exactly the 80 minutes the label claims. Measured from the
   printed maghrib it is 77. The record's "maghrib + 81" is one minute high either way.
3. The **2023 edition prints one isha only**, with no rule label at all: it is the interval column.
   The 12° column, and the labelling, arrived with the 2024-or-later editions, so 2023 cannot
   witness the angle.
4. The other margins read one minute lower than the record (18+0 against 18+1, sunset+3 against +4,
   horizon−1 against raw sunrise). My engine and the publisher's differ at the horizon by that much,
   which is the same sub-minute ceiling the census reported. Treat the record's +1s and mine as the
   same rule read through two engines; the exact integers (dhuhr +5, interval 77) are engine-free
   and are the ones to bank.

**New.** Braga, Coimbra and Faro are banked for 2026 and 2027 (six city-years, 2,190 rows), so the
fitted set widens from 8 cities to 11. The rolling monthly sheets add what the annual PDF does not:
five jama'ah columns (07:00, 14:00, 15:45, 17:19, 19:00 for December 2026, Friday dhuhr blanked for
jumu'ah) and a single isha column, which is the **interval** value — the sheet a worshipper actually
sees uses sunset+80, not the 12.5° line. The December monthly and the December page of the annual
agree column for column on all six solar times.

## Italy

| source | URL | tier | dated data | years |
|---|---|---|---|---|
| Grande Moschea di Roma / Centro Islamico Culturale d'Italia | `grandemoscheadiroma.org/orario-della-preghiera/` (PNG) | authority-adjacent (the mosque's own body) | hijri-month poster, 30 rows | 2026-11 (only month live) |
| Centro Islamico di Milano e Lombardia | `centroislamico.it` | community | none of its own: embeds an IslamicFinder widget | - |
| UAMI | `uamionline.it/servizi/orario-preghiere/` | community federation | 41-city month table, user-selected method | 2026-11 |
| COREIS | `coreis.it/moschea`, `/pilastri/preghiera` | community federation | none: doctrinal pages only | - |
| UCOII | `ucoii.org/orari-preghiera` | community | monthly calendars (known AlAdhan wrapper) | 2026 |

**New, and the answer to the Rome question.** The Grand Mosque does publish Roman times, just not
as text. Its own site's prayer page is a single linked image, `/wp-content/uploads/2026/11/
novembre.png`, titled "Orario di Preghiera: Ğumādā II 1448h. (novembre – dicembre 2026)", carrying
the Centro Islamico Culturale d'Italia seal and the footnote that the times are published "in base
all'ora solare e al fuso orario di Roma". That is Rome, not Tallinn: the Estonian widget the record
found lives on the separate `centro-islamico.com` mirror. Thirty rows transcribed (2026-11-11 to
2026-12-10) and read against the solar model at the mosque's own coordinates (41.9353/12.4547):
every column lands on a clean integer once CET is applied, which confirms the poster is local
clock, not standard-time-frozen.

| column | measured |
|---|---|
| fajr | 19.1° (best fit 19.1 to 19.2, sd 0.4) |
| shuruq | sunrise − 1 |
| dhuhr | solar noon + 1 |
| asr | Shafi + 0 |
| maghrib | sunset + 1 |
| isha | **maghrib + 90, exact every day (sd 0.00)** |

So Rome's own scheme (19°, fixed 90-minute isha) is nothing like the UCOII surface (MWL 18/17 via
AlAdhan), and it is the first Italian surface with a stated publisher and a determined recipe. Only
November is live: `2026/10`, `2026/12`, `2026/09`, `2026/08` and four other naming variants all 404,
so there is one month and no second year. A summer month would settle whether the poster follows
DST or freezes at CET; that question cannot be answered from a November capture.

**Negatives.** Rome's page has no table, no iframe and no PDF, only the image. Milan publishes no
table of its own: the homepage embeds `islamicfinder.org/prayer_service.php` with lat 45.4667, lon
9.2000 and its own parameter choices, which is a calculator, not a witness. COREIS's mosque page
and its prayer page are prose. UAMI's 41-city table is parametric (a method dropdown defaulting to
ISNA), so it is a calculator wearing a federation's name.

## Switzerland

| source | URL | tier | dated data | years |
|---|---|---|---|---|
| Fondation Culturelle Islamique de Genève | `fcigeneve.org/fondation/horaires-de-prieres/`, PDFs per hijri month | community (Geneva foundation) | 29-30 rows a month, whole archive enumerable through the WP media API | 1445-1448 |
| IZRS | `izrs.ch/izr-gebetszeiten`, `izrs.ch/ramadankalender` | federation | full calendar behind a free Bronze membership + login | - |
| Islamisches Zentrum Bern | `izb.ch/gebetszeiten-tabelle/` | community | table rendered client-side from an ajax endpoint | - |
| Ahmadiyya Switzerland | `ahmadiyya.ch/gebetszeiten` | community | dated table | 2026 |

**Wayback for IZRS: failed, honestly.** Three routes were tried. The CDX index for `izrs.ch`
returned the Internet Archive's "Temporarily Offline" page twice and then an empty fourteen-line
result set for the domain query. `archive.org/wayback/available` did report one snapshot of
`izrs.ch/izr-gebetszeiten` (2026-06-12), and that replay is a 10 KB shell with no table and no PDF
link, so nothing was recoverable from it. The live gate is a free membership plus login, which the
rules forbid, so IZRS stays publication-only and the record's "login-gated" defect stands. This is
the one item of the brief that could not be delivered.

**New: a second Swiss organisation, with three hijri years.** Geneva's foundation publishes one PDF
per hijri month, and `fcigeneve.org/wp-json/wp/v2/media?search=calendrier&per_page=100` enumerates
the whole set without auth. Thirty-eight files downloaded, covering 1446, 1447 and 1448 (the tail of
1445 also sits there). Dated rows: 1447 350 (2025-06-26 to 2026-06-15, complete), 1448 349
(2026-06-16 to 2027-06-05, complete, so **December 2026 through May 2027 are future-dated tables
already published**), 1446 323 (2024-07-07 to 2025-06-26, March 2025 missing). Two parser limits
are worth recording: four files carry a lowercase `calendrier-fCI` name, and one month per year sits
where two candidate Gregorian months open on the same weekday, which the weekday check alone cannot
separate; both are recoverable with the hijri month's known start and neither touches 1447 or 1448.
Across the whole set the printed months tile day for day except at four hijri boundaries, where two
successive posters leave a one-day hole; both printings are kept as published.

Geneva's recipe is the cleanest in this whole wave, and it is a full year twice over:

| column | 1447 (350 rows) | 1448 (349 rows) |
|---|---|---|
| fajr | 15.0° + 0.0 (sd 0.62) | 15.0° + 0.0 (sd 0.60) |
| sunrise | raw horizon + 0.04 | + 0.07 |
| dhuhr | solar noon + 0.08 | + 0.07 |
| asr | Shafi + 0.18 | + 0.17 |
| maghrib | sunset + 0.07 | + 0.05 |
| isha | **maghrib + 90, exact (sd 0.00)** | same |

Two consecutive hijri years reproduce each other to 0.05 min on every column: the generation rule
is frozen. Fajr 15°, no margins anywhere, Shafi asr, and an isha that is a fixed 90-minute interval
rather than an angle. This is a different scheme from the IZRS 12.5/13 seasonal pair on record, so
"the Swiss method" is not one thing: the federation and the Geneva foundation disagree, and both
now have dated output.

**Fit.** Geneva deserves the fit ahead of IZRS: 1,022 rows across three hijri years, two of them
complete, a fully determined recipe with sub-half-minute spread on every column, and the isha
interval exact to the minute. It also settles the high-latitude question by observation, since
46.2°N in June never reaches 15° twilight and the printed fajr still exists: whatever clamp the
publisher uses is visible in the June rows.

## Andorra

| source | URL | tier | dated data | years |
|---|---|---|---|---|
| Centre Cultural Islàmic d'Andorra | `mawaqit.net/fr/m/centre-cultural-islamic-andorra-la-vella-ad500-andorra` | community | computed, not printed | live only |

**Negative.** No Andorran body and no Andorran mosque publishes a dated table. Searched in Catalan
("horari oració", "comunitat islàmica Andorra"), French ("horaires de prière Andorre", "mosquée")
and Spanish; what comes back is aggregators (IslamicFinder, Muslim Pro, athanpro, horarios-oracion,
matwproject) and press coverage of the community, never a primary table. The country's one
congregational surface is the Andorra la Vella centre on mawaqit, whose config exposes coordinates
42.5032382/1.5227984, timezone `Europe/Andorra`, jumua 13:30 and iqama offsets +5/+10/+5/+5/+5, but
the times themselves are computed by the platform, so it is a calculator embed rather than a
witness. The census record is silent on Andorra and stays silent: there is nothing here to fit.

## Files

- `captures/` 133 raw captures (PDF, PNG, JPEG, HTML, JSON, CDX text), one per surface, named by
  source.
- `data/` 24 normalised city-year files, `{'YYYY-MM-DD': {fajr, sunrise, dhuhr, asr, magrib, isha}}`,
  with `isha_alt` on the Portuguese files where the edition prints a second isha.
- Scripts: `parse_pt.py`, `parse_ccim.py`, `parse_granada.py`, `parse_geneve.py`,
  `analyze_pt2.py` (anchored margins), `roma_poster.py`, `malaga_poster.py`, `enum-ccim-slow.sh`,
  `capture-ccim.sh`.
