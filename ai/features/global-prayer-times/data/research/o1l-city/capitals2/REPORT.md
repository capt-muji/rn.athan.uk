# O1l-45 capital gaps, round two

Workspace: `$HOME/athan-gitree/census/o1l-city/capitals2/`. Read: `BRIEF.md`, `FIT-RULES.md`, the
O1l-38 block in `CONSOLIDATION.md`, and `capitals/CAPITAL-MATRIX.md` (142 covered / 60 gap / 202).

Engine: adhan 4.4.6 at `census/adhan-build/node_modules/adhan`, `Rounding.None`, second resolution,
explicit minute rounding per column. Dates built from literal capture strings. No clock read.

## Headline

**52 of the 60 gaps now carry a dated surface**, 53 if "Delhi" is accepted for New Delhi. One path did most of the work: the athanpro
platform serves a dated month table for every capital in this wave except Tegucigalpa and Palikir, at each city's own coordinates, and
those tables reproduce on adhan 4.4.6 at MWL 18/17, Shafi, zero margins, within one minute on 42 of
them. Bern gained a full 365-day mawaqit year. Four capital pages are broken and are recorded as
defects, not coverage. Pyongyang stays closed per the record.

## The platform lever: athanpro.com

`https://athanpro.com/countries/<country>/<city>` — one page per city, holding:

- a **dated month table**, September 2026, 30 rows, all six columns;
- the city's coordinates as literals (`"latitude":14.5995,"longitude":120.9842` for Manila);
- a stated calculation method, which varies by city (MWL for most, `Mosque Prayer Times`,
  `Libya Prayer Times`, `UMAM`, `Brunei Accurate Prayer Times` for others);
- a `Today` block and a fixed UTC-offset label.

Year recovery without a clock: the month name in the heading, the Hijri day beside every Gregorian
day, and the weekday. All 58 pages agree **30/30** on the weekday alignment for 2026, which fixes
the year.

Tier: **platform** (a platform publisher's own dated table, the islamichina precedent). Grade:
**provisional — one published cycle**. The sitemap's `lastmod` is 2026-09-29 and every page renders
the same September month, so this is a single frozen generation; it never lifts to A.

### Defects found on the platform (recorded, not corrected)

1. **The offset label is wrong on every DST city.** Bern prints `+01:00` while its table is CEST
   (+02:00); Brasília prints `-05:00` for a `-03:00` city; Mexico City prints `-08:00` for `-06:00`.
   The table itself is true local wall clock, so fits run in the IANA zone and pass, but the label
   must never be read as the zone.
2. **The `Today` block contradicts the table.** Manila's block reads 04:35 / 05:46 / 11:46 / 15:07 /
   17:47 / 18:54, which is the city's MWL row for 2026-10-01, not for the September month on the
   same page. The month table is the surface; the block is a build artefact.
3. **Four capital pages fail the solar gate** and carry no coverage: Kingston (dhuhr 481 min off
   solar noon), Georgetown (239), San José (61), Colonia/Pohnpei (61). Their tables are internally
   inconsistent with any single offset.

### Fit results (30 rows each, one recipe, September 2026)

42 pages reproduce within one minute at 99pc or better, most at 100pc on fajr, dhuhr, asr, maghrib
and isha:

| Capital | Rows | Recipe | Joint exact/within-1 | Label |
|---|---|---|---|---|
| Bogota | 30 | 18/17 Shafi | 102/150 of 150 | MWL |
| Kinshasa | 30 | 18/17 Shafi | 111/150 of 150 | MWL |
| Addis Ababa | 30 | 18/17 Shafi | 99/150 of 150 | MWL |
| Antananarivo | 30 | 18/17 Shafi | 110/150 of 150 | MWL |
| Kigali | 30 | 18/17 Shafi | 105/150 of 150 | MWL |
| Yerevan | 30 | 18/17 Shafi | 91/150 of 150 | MWL |
| Ashgabat | 30 | 18/17 Shafi | 103/150 of 150 | MWL |
| Juba | 30 | 18/17 Shafi | 108/150 of 150 | MWL |
| Gitega | 30 | 18/17 Shafi | 113/150 of 150 | MWL |
| Naypyidaw | 30 | 18/17 Shafi | 106/150 of 150 | MWL |
| Thimphu | 30 | 18/17 Shafi | 103/150 of 150 | MWL |
| Bandar Seri Begawan | 30 | 20/18 Shafi | 129/150 of 150 | Brunei Accurate Prayer Times |
| Dili | 30 | 18/17 Shafi | 109/150 of 150 | MWL |
| Suva | 30 | 18/17 Shafi | 114/150 of 150 | MWL |
| Port Moresby | 30 | 18/17 Shafi | 114/150 of 150 | MWL |
| Honiara | 30 | 18/17 Shafi | 118/150 of 150 | MWL |
| Port Vila | 30 | 15/15 Shafi | 83/142 of 150 (94.7pc) | Mosque Prayer Times |
| Funafuti | 30 | 18/17 Shafi | 115/150 of 150 | MWL |
| South Tarawa | 30 | 18/17 Shafi | 118/150 of 150 | MWL |
| Yaren | 30 | 18/17 Shafi | 118/149 of 150 | MWL |
| Majuro | 30 | 18/17 Shafi | 116/150 of 150 | MWL |
| Apia | 30 | 18/17 Shafi | 100/150 of 150 | MWL |
| Nassau | 30 | 18/17 Shafi | 88/150 of 150 | MWL |
| Belmopan | 30 | 18/17 Shafi | 93/150 of 150 | MWL |
| Castries | 30 | 14/17.5 Shafi | 26/70 of 150 (46.7pc) | Mosque Prayer Times |
| Roseau | 30 | 18/17 Shafi | 81/138 of 150 (92.0pc) | Mosque Prayer Times |
| Basseterre | 30 | 18/17 Shafi | 91/150 of 150 | MWL |
| Kingstown (VC) | 30 | 18/17 Shafi | 100/150 of 150 | MWL |
| Saint George's | 30 | 18/17 Shafi | 97/150 of 150 | MWL |
| Port of Spain | 30 | 15/15 Shafi | 55/131 of 150 (87.3pc) | Mosque Prayer Times |
| Saint John's | 30 | 18/17 Shafi | 93/150 of 150 | MWL |
| Banjul | 30 | 18/17 Shafi | 70/137 of 150 (91.3pc) | Mosque Prayer Times |
| Sao Tome | 30 | 18/17 Shafi | 109/150 of 150 | MWL |
| Victoria (SC) | 30 | 18/17 Shafi | 110/150 of 150 | MWL |
| Tiraspol | 30 | 18/17 Shafi | 86/149 of 150 | MWL |
| Sukhumi | 30 | 18/17 Shafi | 89/150 of 150 | MWL |
| Pristina | 30 | 18/17 Shafi | 94/150 of 150 | MWL |
| Bratislava | 30 | 18/17 Shafi | 87/149 of 150 | MWL |
| Valletta | 30 | 18/17.5 Shafi | 60/90 of 150 (60.0pc) | Mosque Prayer Times |
| Vatican City | 30 | 18/17 Shafi | 53/100 of 150 (66.7pc) | Mosque Prayer Times |
| Monaco | 30 | 14/14 Shafi | 55/60 of 150 (40.0pc) | UMAM |
| Jerusalem | 30 | 18/18 Shafi | 73/105 of 150 (70.0pc) | Mosque Prayer Times |
| Tripoli | 30 | 18.5/18.5 Shafi | 49/90 of 150 (60.0pc) | Libya Prayer Times |
| Algiers | 30 | 17.5/17 Shafi | 56/90 of 150 (60.0pc) | Mosque Prayer Times |
| Niamey | 30 | 19.5/16.5 Shafi | 54/139 of 150 (92.7pc) | Mosque Prayer Times |
| Sucre | 30 | 18/17 Shafi | 98/149 of 150 | MWL |
| Mexico City | 30 | 18/17 Shafi | 88/149 of 150 | MWL |
| Brasilia | 30 | 18/17 Shafi | 103/149 of 150 | MWL |
| Manila | 30 | 18/17 Shafi | 109/149 of 150 | MWL |
| Kathmandu | 30 | 18/17 Shafi | 102/149 of 150 | MWL |
| Tehran | 30 | 18/17 Shafi | 95/149 of 150 | MWL |
| New Delhi (page is "Delhi", 5 km) | 30 | 18/17 Shafi | 104/150 of 150 | MWL |

`fits-athanpro.json` holds the full per-column breakdown. `fits.txt` holds the run log.

**Stability and amplitude: not measurable from one cycle.** Every page holds September 2026 only, so
there is no between-year test and no January-to-July amplitude. What the month does give is the
within-month fajr spread, recorded per city in `fits-athanpro.json` (`monthFajrSpread`). The
forward-longevity verdict for this surface is **stable across zero years, one cycle held**.

**Where the label is not MWL, the fit is the finding.** UMAM (Monaco) is 40pc, `Libya Prayer Times`
(Tripoli) 60pc, `Mosque Prayer Times` between 40pc and 94pc, and Castries publishes an isha that no
angle in 14-19 degrees reproduces (worst 91 min) — an interval, like the Bern mawaqit install. These
are candidate-grade: dated rows held, no clean recipe.

## Kathmandu

The held PDF `np-islamisangh-calendar-2083-a.pdf` (Islami Sangh Nepal, Balkhu) was rendered page by
page at 2.5x and read: `captures/np/islamisangh-2083a/`. All six pages are **date calendars** —
BS 2083, Hijri 1447-1448, AD 2026, three numbers per day cell and no prayer column anywhere. The
record's Nepal negative holds for this artifact; it is not a prayer timetable and cannot be
normalised into rows. The lift came from the platform instead: `athanpro.com/countries/nepal/kathmandu`,
30 rows, 99.3pc within-1 at 18/17 Shafi.

## Manila, Brasilia, Bogota, Mexico City

All four now carry 30 dated rows from the platform at 99.3 to 100pc within-1 on MWL. New-language
passes were run for each and returned no mosque-published dated table:

- **Manila.** Filipino and English: "oras ng pagdarasal Manila mosque", "Golden Mosque Manila prayer
  time schedule", "Masjid Al-Dahab timetable". `goldenmosque.org/prayer-times/` is **Rochdale, UK**,
  not Quiapo — a name collision, recorded. Nothing else but aggregators (islamicfinder, muslimpro,
  prayertimes.date, prayersconnect) and news photographs. The NCMF Metro Manila Ramadhan 1447 carry
  is described in the o1k report but no image of it is held anywhere in the census tree, and NCMF's
  Facebook is the only route to it.
- **Brasilia.** Portuguese: "Mesquita de Brasília horário de oração", "Centro Islâmico de Brasília
  horário salat". `arresala.org.br` (Centro Islâmico no Brasil) and `fambras.org.br` are both São
  Paulo publishers; neither carries a Brasília row. The Brasília centre's only public presence is
  `facebook.com/MesquitaBrasilia`, which renders no dated table anonymously.
- **Bogota.** Spanish: "Mezquita Estambul Bogotá horario de oración", "Mezquita Abou Bakr Al-Siddiq
  horario". `mezquitaestambulbogota.es.tl` answers 404 at its root. The Abou Bakr mosque has a
  Facebook page and a 2026 Infobae feature; neither carries a dated table.
- **Mexico City.** Spanish: "Centro Cultural Islámico de México horario de oración", "mezquita Surau
  CDMX horario". `khutba.world/en/moskee/mx/cdmx` is behind a Vercel challenge (HTTP 429) and was
  not forced. `institutoislamico.mx` carries no prayer page.

## Kinshasa

No mosque-published surface. The Grande Mosquée de Kinshasa has no site; the mawaqit hits for DR
Congo are the held Goma install (`taqwa-mosque-ibb-...-goma-congo-kinshasa`), whose slug suffix is
the country, not the capital. Platform table captured: 30 rows, 100pc within-1 at 18/17.

## Bern

Two surfaces. The mawaqit install `masjid-assalam-bern-3007-switzerland` serves a **full 2026 year,
365 rows, gate PASS on 2026-11-11**, at 46.9407 N 7.4390 E. Its rule is legible and not an angle:

- **isha = maghrib + 90 minutes on all 365 days** (min 90, max 90).
- fajr leads sunrise by 83 to 124 minutes; best angle 15 deg reproduces 337 of 365 within one minute.
- dhuhr is snapped (worst 5 min) and maghrib snapped (worst 4 min), the Skopje class.
- seasonal amplitude: fajr moves **169 minutes** between 15 January and 15 July.

The athanpro Bern page is the weaker surface (40.7pc) and is superseded by this capture.

## Closed and honest negatives

| Capital | Block |
|---|---|
| Pyongyang | Not attempted; the record closes it on absence. |
| Kingston (JM) | athanpro page fails the solar gate by 481 min; no other surface. |
| San Jose (CR) | athanpro page fails the solar gate by 61 min. |
| Georgetown (GY) | athanpro page fails the solar gate by 239 min. |
| Palikir (FM) | No athanpro page for Palikir; Colonia (Pohnpei) fails the gate by 61 min. |
| Ngerulmud (PW) | No athanpro page; Koror captured (100pc fit) but Koror is a different town. |
| New Delhi | athanpro serves "Delhi" (28.61 N 77.21 E), 5 km from New Delhi; banked as Delhi. |
| Tegucigalpa | athanpro has no Honduras pages at all. |

Searches that closed: `site:mawaqit.net <capital>` for Manila, Bogota, Brasilia, Mexico City,
Bratislava, Pristina, Valletta (returned La Valette, France), Kinshasa (returned Goma);
`site:masjidal.com` for the same four; `site:masjidbox.com Kathmandu` (returned one unrelated
install). TinyFish throttles site-scoped queries and returns 0-1 rows for them; DuckDuckGo's html
and lite endpoints answer HTTP 202 (challenge) and were not forced.

## Files

- `captures/` — 59 athanpro pages, 1 mawaqit page, 6 rendered PDF pages, 1 khutba challenge page.
- `data/` — 59 athanpro month tables + 1 mawaqit year, each with its coordinates, method label,
  offset label and weekday agreement.
- `fits-athanpro.json`, `fits.txt` — per-column fits.
- `tools/` — `athanpro.py` (page to rows), `harvest.py` (mawaqit/masjidbox), `fit.js` (gate + grid),
  `pdfrender.swift` (PDF to PNG).

## Count

52 of the 60 gaps now carry dated rows, Tehran among them and flagged against the record's closure.
New Delhi is a 53rd only if the parent accepts "Delhi" as the capital's city. Capital matrix would
then read **194 covered / 8 gap / 202**, or 195 / 7 with Delhi.
