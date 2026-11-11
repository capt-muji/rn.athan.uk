# O1m-15 Europe named-city authority surfaces — wave report

Wave O1m-15 of round o1m. Workspace `$HOME/athan-gitree/census/o1m/o1m-15-europecities/`.
The mission: the mosque-owned and association tables behind the Diyanet layer, for France, Spain,
Poland, Greece, the Balkans, the Low Countries and Portugal. The Diyanet-abroad layer itself is
held by `o1m-7-europe` (1,592 localities) and is not re-captured here; every surface below is a
second source beside it or a country it does not serve.

Nothing here concludes a country. The round re-arms and looks again.

## 1. What was banked

Script-counted from `data/*.json` and `captures/index.tsv` at 2026-11-11 12:00Z:

| surface | tier | countries | cities | dated rows | window |
| --- | --- | --- | --- | --- | --- |
| Comunidade Islâmica de Portugal annual sheets 2026 | authority | PT | 13 | 4,702 | full year 2026 |
| mawaqit.net tenants | community | FR, ES, NL, BE, PL | 27 | 9,855 | full year 2026 |
| MZR Ramadan 1447/2026 per-city PDFs | authority | PL | 16 | 176 | 18–28 Feb 2026 |
| Islamic Mosque of Athens, Ramadan 1447 table | authority | GR | 1 | 29 | 19 Feb – 19 Mar 2026 |
| vaktija.me Podgorica November 2026 | community | ME | 1 | 30 | Nov 2026 |
| vaktija.dev Sarajevo November 2026 | platform | BA | 1 | 30 | Nov 2026 |
| **total** | | | **59** | **14,822** | |

Raw archive: 112 indexed captures in `captures/` (253 files counting OCR transcripts and error
sidecars), 103 MB, every artifact saved including the two image tables. `captures/index.tsv`
carries the UTC timestamp, HTTP status, byte count and URL of each.

## 2. Portugal — the wave's strongest authority find

The Comunidade Islâmica de Portugal publishes one twelve-page annual sheet per city on its own
CDN, `https://irp.cdn-website.com/cce0f1db/files/uploaded/<city>_2026.pdf`. The sheets carry a real
text layer, so the transcription is a byte read rather than an OCR read. **Thirteen cities** are
served: Lisboa, Porto, Coimbra, Braga, Setúbal, Évora, Beja, Leiria, Aveiro, Viseu, **Faro**,
**Funchal** and **Ponta Delgada**. The last two are the Atlantic surfaces the mission named,
Madeira on `Atlantic/Madeira` and the Azores on `Atlantic/Azores` (UTC−1) — the zone table's
missing row.

Columns printed: Fajr (Sehri), Nascer do Sol, Zawal, Zuhr, Assr, Magrib (Iftar), Ishá (12° + 3 min),
Ishá (01:20). Two isha definitions sit in one authority table; both are kept.

One recipe across all thirteen cities, adhan 4.4.6, `Rounding.None`, each city's zone pinned:

| city | fajr° | isha° | within-1 | exact | MAE | worst |
| --- | --- | --- | --- | --- | --- | --- |
| Faro | 18.005 | 11.99 | 99.68 | 78.40 | 0.219 | 2 |
| Funchal | 17.81 | 11.975 | 99.95 | 77.76 | 0.223 | 2 |
| Ponta Delgada | 18.005 | 12.31 | 96.85 | 60.46 | 0.427 | 2 |
| Lisboa | 17.955 | 11.985 | 98.08 | 78.45 | 0.235 | 2 |
| Porto | 17.935 | 11.975 | 96.63 | 76.02 | 0.274 | 2 |
| Coimbra | 17.965 | 12.005 | 98.54 | 72.15 | 0.293 | 2 |
| Braga | 18.0 | 11.985 | 97.72 | 75.20 | 0.271 | 2 |
| Setúbal | 17.975 | 12.005 | 99.00 | 76.53 | 0.245 | 2 |
| Évora | 17.95 | 11.98 | 97.95 | 78.54 | 0.235 | 2 |
| Beja | 17.955 | 11.985 | 98.36 | 79.50 | 0.221 | 2 |
| Leiria | 18.075 | 12.025 | 97.26 | 71.96 | 0.308 | 2 |
| Aveiro | 17.965 | 11.99 | 97.44 | 78.17 | 0.244 | 2 |
| Viseu | 17.975 | 11.98 | 98.08 | 76.35 | 0.256 | 2 |

Temkin, identical in twelve cities: sunrise 0, dhuhr **+6**, asr +1, maghrib **+4**, isha +4, fajr
+1. The Azores sheet shifts only the isha pad to +2 — the UTC−1 zone showing through.

Measured implied depth, monthly medians, Lisboa: fajr 17.75–18.12, isha 12.59–12.69 all year. The
table is **one national generation at 18°/12°+3** with the Portuguese dhuhr +6 and maghrib +4 clock
pads. Grade: **A-eligible** on one published cycle of a real multi-year series; the 2027 sheets are
the year-2 test.

## 3. France — the 12° line, and where it breaks

The Grande Mosquée de Paris pages still carry no table (the `o1m-7` negative stands). The route in
is the mosque's own mawaqit tenant, which the prior rounds never reached.

| mosque | city | fajr° | isha° | within-1 | exact | MAE | worst |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Grande Mosquée de Paris | Paris | 11.97 | 11.95 | 76.12 | 37.99 | 2.426 | 31 |
| Mosquée de Bordeaux | Bordeaux | 12.075 | 12.085 | 92.97 | 58.63 | 0.497 | 3 |
| Mosquée Bordeaux Nord | Bordeaux | 12.08 | 12.075 | 95.07 | 58.54 | 0.465 | 3 |
| Mosquée As-Salam | Toulouse | 14.93 | 14.94 | 86.16 | 53.74 | 1.380 | 31 |
| Mosquée En-Nour | Nice | 12.085 | 12.075 | 87.72 | 55.94 | 0.777 | 13 |
| Mosquée Ibn Rochd | Montpellier | 12.08 | 11.955 | 73.15 | 40.50 | 2.576 | 36 |
| Mosquée En-Nour | Rennes | 12.08 | 11.985 | 94.79 | 50.96 | 1.040 | 26 |
| Mosquée La Mosquée Verte | Toulon | 12.35 | 12.195 | 93.84 | 61.55 | 1.868 | 180 |
| Grande Mosquée de Strasbourg | Strasbourg | 11.95 | 11.95 | 71.96 | 33.88 | 3.496 | 45 |
| Mosquée As-Salam | Nantes | 12.055 | 12.07 | 94.70 | 51.10 | 0.544 | 3 |

**Nine of ten French tenants sit on 12°/12°**, the Musulmans de France convention. Five reproduce
at 93–95 per cent with a worst error of 3 minutes: a clean single-angle table. Paris, Montpellier
and Strasbourg score 72–76 per cent with residuals swinging to 30–45 minutes — seasonal-rule
tables, not single angles.

Paris measured directly, the sun's depth at the printed fajr and isha, monthly medians:

| month | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| fajr° | 15.64 | 16.25 | 15.99 | 15.37 | 13.92 | 13.09 | 13.41 | 14.89 | 15.71 | 16.21 | 15.87 | 17.93 |
| isha° | 14.38 | 15.35 | 15.46 | 14.15 | 12.11 | 19.13 | 11.93 | 13.52 | 15.22 | 15.55 | 14.68 | 16.03 |

The Paris table sweeps from 12° in midsummer to 16–18° in midwinter, and its June isha sits on the
sun's own lowest point that month (19.13° at 48.84°N is the geometric maximum). No single angle is
the Paris recipe, and the report says so instead of publishing a 76-per-cent fit as if it were one.

Toulouse's As-Salam tenant is **14.93°/14.94°** — a genuinely different French line, and a second
Toulouse witness beside the Grande Mosquée's masjidbox page.

## 4. Spain — three lines, and one broken tenant

| mosque | city | fajr° | isha° | within-1 | exact | MAE | worst |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Centro Islámico Al-Forkan | Bilbao | 15.085 | 14.92 | 90.23 | 57.40 | 0.557 | 3 |
| Mezquita Al-Quds | Murcia | 18.09 | 16.91 | 91.55 | 58.72 | 0.523 | 3 |
| Mezquita At-Tawhid | Córdoba | 15.095 | 14.905 | 95.02 | 60.05 | 0.450 | 3 |
| Mezquita de Tenerife | Santa Cruz de Tenerife | 17.895 | 16.89 | 93.70 | 60.82 | 0.461 | 3 |
| Mezquita Al-Nur (Almozara) | Zaragoza | 11.95 | 12.05 | 60.37 | 28.40 | 6.441 | 82 |
| Mezquita Imam Malek | Las Palmas de Gran Canaria | 12.08 | 12.05 | **18.22** | 9.13 | 29.113 | 107 |
| Mezquita At-Tawba | Málaga | 18.095 | 16.91 | 91.83 | 59.04 | 0.512 | 3 |

Three distinct Spanish lines appear: **15°/15°** (Bilbao, Córdoba), **18°/17°** (Murcia, Tenerife,
Málaga — the same pair as the Diyanet layer and the `o1l-22` Barcelona and Valencia mosques), and
**12°/12°** (Zaragoza, Las Palmas).

**Ceuta is still a negative, with a documented trap.** A mawaqit tenant named *Comunidad Islámica
Ceutí* exists (`msjd-sywty-comunidad-islamica-ceuti-ceuti-30562-spain`), but its own coordinates are
38.0736°N, 1.2684°W — inside Murcia province, 260 km from Ceuta. Its table reproduces at those
coordinates at 94.89 per cent within 1 minute, so the table belongs to the stated point and cannot
serve Ceuta. Melilla has no tenant at all; the only hit under that name is a mosque in Épila,
Zaragoza.

**Ceuta is still a negative, with a documented trap.** A mawaqit tenant named *Comunidad Islámica
Ceutí* exists (`msjd-sywty-comunidad-islamica-ceuti-ceuti-30562-spain`) but its own coordinates are
38.0736°N, −1.2684°E — inside Murcia province, 260 km from Ceuta. Its table reproduces at those
coordinates at 94.89 per cent within 1 minute, so the table belongs to the stated point and cannot
serve Ceuta. Melilla has no tenant at all; the only hit under that name is a mosque in Épila,
Zaragoza.

Zaragoza is a fixed-interval summer rule: its printed fajr sits 24 minutes before sunrise in late
June, which no angle reproduces, hence 60 per cent with an 82-minute worst case.

**Las Palmas is a broken tenant and is recorded as such.** Its calendar prints dhuhr 14:01 on
1 January, one hour after the island's own solar noon, and maghrib 20:34 against a true 18:15.
131 of its 2,190 cells sit more than 90 minutes from any plausible instant at that point. Not
adjudicated, not used, named here so the next round does not re-fit it blind.

## 5. Poland — the Mufti's own Ramadan sheets

The Muslim Religious Community of Poland (MZR) publishes sixteen per-city Ramadan 1447 PDFs at
`mzr.pl/wp-content/uploads/2026/02/<nn>-<City>.pdf`: Białystok, Bydgoszcz, Gdańsk, Gorzów
Wielkopolski, Katowice, Kielce, Kraków, Lublin, Łódź, Olsztyn, Opole, Poznań, Rzeszów, Szczecin,
**Warszawa**, Wrocław. The mission's five named cities are all served.

The pages are scanned images with no text layer, so they are read through the local OCR binary at
the page image's native 300 dpi. **The March half of every sheet fails the solar gate** (maghrib
flat across twelve days, dhuhr decreasing where it must increase), so 19 of 30 rows per city are
quarantined and only 18–28 February survives: **176 dated rows**.

Measured implied depth, in every one of the sixteen cities: **fajr 18.16°, isha 17.15°**. Pinned at
that pair the sheets reproduce at **100 per cent within 1 minute in all sixteen cities**, MAE
0.20–0.33, worst 1, temkin fajr 0, isha 0, dhuhr +1, maghrib +1, asr 0–1.

Over an eleven-day window the angle and the temkin are not separately identifiable — an
unconstrained fit lands on a different pair in every city, each scoring 100 per cent — so the wave
reports the *measured* pair and the *pinned* score, and publishes no fitted angle it cannot defend.
The isha value is the Polish 17°, not the Diyanet-EU 16°.

## 6. Greece — the state mosque's own table

The Islamic Mosque of Athens (`mosqueofathens.gov.gr`), the state-run mosque, publishes its Ramadan
1447 table as a 1087×1318 image on its "daily, monthly, annual" page. The annual claim is not yet
honoured — only the Ramadan block is live as an image — but that block is a ministry-level
authority surface with six columns: fasting start, sunrise, dhuhr, asr, maghrib, isha. 29 dated
rows, 19 February to 19 March 2026, plus the Eid times (07:00, 07:30, 08:00).

Fitted: **16.95° / 16.65°**, temkin fajr −4, sunrise +1, dhuhr +1, asr 0, maghrib 0, isha +2, at
**100 per cent within 1 minute, 89.08 per cent exact, worst 1, MAE 0.109** on 29 days and 174 cells.

Transcription gate: the local OCR binary reproduces **174 of 174 transcribed cells in order**, and
all 29 rows group identically.

The Western Thrace muftiates are the authority route the mission named.
`moufteiaxanthis.minedu.gov.gr` refuses a direct connection from this host (curl timeout at 75 s,
twice) but answers a proxied read; its "ΩΡΕΣ ΠΡΟΣΕΥΧΗΣ" block is a **third-party IslamicFinder
widget** — the same construction that `mzr.pl` embeds, `islamicfinder.org/prayer-widget/<id>/shafi/
1/0/18.0/17.0`. The muftiate route therefore resolves to platform tier wherever that widget serves
it, and the ministry's own annual PDFs (`ΩΡΕΣ_ΠΡΟΣΕΥΧΗΣ_ΚΟΜΟΤΗΝΗ.pdf`, 2023) are the authority
artifact to chase.

## 7. The Balkans — measured where the surface was reached

| surface | city | tier | fajr° | isha° | within-1 | exact | MAE | worst | measured depth fajr/isha |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| vaktija.dev | Sarajevo | platform | 15.05 | 14.70 | 100 | 76.11 | 0.239 | 1 | 14.60 / 14.63 |
| vaktija.me | Podgorica | community | — | — | 95 | 58.33 | 0.467 | 2 | 18.96 / 16.66 |

Sarajevo's fit **confirms the site's own footer label** — "Vaktija 14.6°" — by measurement: the sun
sits 14.60° below the horizon at every printed fajr and 14.63° at every printed isha. That is a
platform computing a stated angle rather than a mosque's entered table.

Podgorica is not identifiable from one November month (fajr moves 15 minutes across the month, so
angle and offset trade freely); its **measured** 18.96/16.66 is reported instead of a fitted pair.
Its fajr runs 29 minutes earlier than Sarajevo's, which is the shallower Montenegrin convention
`o1l-16r` already measured — the two witnesses agree.

- **Croatia**: `medzlis-rijeka.hr` serves a full-year 2026 vaktija PDF; the CDN answers 403 to this
  host with and without a referer. Blocked, two attempts, not retried further.
- **Serbia**: `vaktija.eu/en/novi-pazar` serves Novi Pazar's month with six columns and an "Official
  Vaktija" label; `?month=` and `/2026/3` do not change the payload, so only the running month is
  served. One month banked, platform tier.
- **Bosnia, the Islamic Community's own Ramadan sheet**: captured
  (`islamskazajednica.ba/images/download/ramazanska_vaktija_2026.pdf`) but its two-column calendar
  layout defeats both the fast-level OCR and the PDF's own text layer (2104 characters, values split
  across columns). **Open item**, not a datum.
- **Kosovo 2027**: not probed this wave; `o1l-16r` probed at 04:19Z and found HTTP 200 with zero
  2027 strings. The observable date stands.
- **North Macedonia**: not reached beyond the Diyanet layer `o1m-7` holds. The `+45-minute fajr
  split` between `bfi.mk` and `vaktija.eu` Skopje remains a two-witness flag.

## 8. Low Countries

| mosque | city | fajr° | isha° | within-1 | MAE | not reached (summer) fajr/isha |
| --- | --- | --- | --- | --- | --- | --- |
| Moskee El Oumma | Amsterdam | 11.95 | 11.955 | 67.58 | 2.703 | 0 / 0 |
| Moskee Essalam | Rotterdam | 19.995 | 19.995 | 71.12 | 3.175 | 80 / 81 |
| Moskee El Mohsinin | Den Haag | 17.375 | 18.19 | 88.77 | 2.272 | 58 / 67 |
| Moskee As-Sonna | Utrecht | 18.38 | 19.44 | 91.53 | 1.754 | 68 / 79 |
| Moskee Ar-Rahmaan | Eindhoven | 11.955 | 19.95 | 86.84 | 2.865 | 0 / 77 |
| Al-Iman Moskee | Antwerpen | 17.685 | 19.845 | 73.49 | 2.396 | 52 / 75 |
| Mosquée Al-Itissam | Liège | 19.0 | 19.745 | 86.51 | 2.149 | 60 / 69 |

The Dutch and Belgian tenants hit the top of the angle search (19.7–20.0°) because their summer
block is a fixed interval, not an angle: 52–81 days a year never reach that depth at 51–53°N. Those
days are counted in `notReached` and excluded from the angle score, exactly as the `o1m-7` Diyanet
fit does, and never scored as misses.

The 2023 Dutch consensus the mission names (18/17 with 03:30/23:30 caps) is visible in Den Haag
(17.375/18.19) and Utrecht (18.38/19.44) but is not reproduced by Amsterdam (12°/12°) or Eindhoven
(12°/20°). Recorded as platform-tier dispersion, not adjudicated.

## 9. Method and instrument

One harness, `work/fitfast.mjs`, driving adhan 4.4.6 from
`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`, `Rounding.None`, each city's own IANA
zone pinned through `Intl`, dates from the literal printed strings, no clock read anywhere. Two
instruments sit inside it:

- the **pinned fit** — score a table against one stated recipe and report exact / within-1 / worst
  per column;
- the **depth curve** — invert each published instant to the sun's depression angle and report the
  monthly medians. This measures a table's rule instead of assuming one, and it is what exposes
  Paris's seasonal sweep, Zaragoza's fixed interval, Sarajevo's stated 14.6° and Poland's
  18.16/17.15.

A day whose sun never reaches the fitted angle is excluded from that angle's score and counted in
`notReached`; it is never scored as a miss and never silently dropped. Printed whole minutes are
compared against the computed instant rounded the way a clock shows it, because the residual
arithmetic is floating point and a one-minute boundary is not a miss.

## 10. Negatives, with the languages searched

- **Grande Mosquée de Paris web pages**: still zero tables (French, English). The mawaqit tenant is
  the route in, and it is community tier, not the mosque's own document.
- **Toulouse Mirail**: `/calendrier-horaires-de-prieres-2026/` returns 404; the site's own
  `horaires-de-prieres-toulouse-et-environs/` carries `/wp-content/uploads/calendrier-2026.pdf`,
  a 12-page PDF whose text layer is column-scrambled (French).
- **Málaga `ccandalusi.org/horarios-de-oracion/`**: 403 to this host (Spanish).
- **Croatia `medzlis-rijeka.hr`**: 403 on the 2026 vaktija PDF, referer and no referer (Croatian).
- **Thrace muftiates direct**: `moufteiaxanthis.minedu.gov.gr` connection timeout at 75 s (Greek,
  twice).
- **Thessaloniki, Rhodes, Kos**: no authority surface found; every result is a computed aggregator
  (Greek, English, Spanish). Kos and Rhodes are a recognised minority community publishing no
  timetable under the terms searched.
- **Ceuta and Melilla**: no mosque-owned table found under Spanish or Arabic terms this wave.
- **Albania, Kosovo 2027, North Macedonia third witness**: not reached this wave.
- **`dpt`**: still a JSON install format for UK mosques, not a service covering these countries
  (carried forward from `o1m-7`).

## 11. Defects

- mawaqit carriers are 366-row leap scaffolds with 29 February a byte-copy of 28 February; every
  tenant is cut to 365 real days here, the same cut `o1m-7` recorded.
- **Two single-cell typos in mosque-entered data**: Toulon's sunrise reads 04:34 on 1 October 2026
  (true 07:34) and Liège's reads 00:30 on 15 January 2026 (true 08:32). Both are the publisher's,
  both are reported rather than smoothed. They set the `worst` column in those two rows.
- **Las Palmas tenant** is internally impossible (Section 4), 131 cells beyond 90 minutes. Not used.
- **MZR March block** fails the solar gate in all sixteen cities (Section 5). Quarantined.
- The Bosnia Islamic Community Ramadan PDF is a two-column calendar neither the OCR binary nor the
  PDF's text layer can linearise. Open item.
- Porto (351 rows) and Braga (336) lost rows to the row-window gate in the CIP parser, where a
  Hijri month name wraps mid-row. Recorded, not silently dropped.
- The year of every mawaqit calendar is taken as the running calendar of the capture, anchored by
  the calendar carrying the capture date's own row. Astronomy cannot separate 2025 from 2026 on a
  single date (about one minute of equation-of-time drift), so the anchor is the platform's, and it
  is stated rather than implied.

## 12. NEXT

1. **Portugal year-2**: fetch the 2027 sheets from the same CDN pattern the moment they appear.
   Thirteen cities on one published cycle is an A waiting on its second cycle.
2. **Portugal completeness**: the CIP portal's own link list is the authoritative enumeration of
   city sheets and should be read rather than guessed (`almada_2026.pdf` returns 403, so the name
   pattern is not universal).
3. **France**: the mosque-level layer is thin beside 587 Diyanet localities. Toulouse Mirail's
   12-page PDF needs a column-order reconstruction; the Grande Mosquée de Toulouse's masjidbox page
   and Marseille's `o1l-22` tenants need the same treatment.
4. **Greece**: the Athens mosque's annual table (only the Ramadan image is live), and the Komotini
   muftiate's annual `ΩΡΕΣ_ΠΡΟΣΕΥΧΗΣ_ΚΟΜΟΤΗΝΗ.pdf`, which the ministry reposts each year.
5. **Poland**: a second year of MZR sheets, and a re-capture of the March block at a higher OCR
   setting or through the MZR's own mawaqit tenant, which carries a full year.
6. **Balkans**: Kosovo 2027 re-probe in late December; the North Macedonia third witness for the
   +45-minute fajr split; Croatia's Rijeka PDF through a proxied read; Bosnia's IC sheet by
   cropping the two-column calendar into single columns before OCR.
7. **Low Countries**: locate the platform that published the 2023 Dutch 18/17 consensus; Belgium's
   Charleroi and Ghent second editions are still unbanked.
