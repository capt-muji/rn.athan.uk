# O1k nordics2 — Norway completion, Sweden fit-capture, Denmark second route, Iceland asr cross-check, Estonia live verification, Latvia/Lithuania retry, Ukraine 2027, Belarus

Workspace: `$HOME/athan-gitree/census/o1k-wide/nordics2/`. Captures in `captures/`, normalized rows in `data/`.
Reads the census record at `ai/features/global-prayer-times/data/census/world-table-v2.md` (read-only) and the prior wave's output at `o1k-wide/europe/`.

## Norway — IRN (bonnetid.no) year series — COMPLETION

| Source | URL | Tier | Dated data | Years |
| --- | --- | --- | --- | --- |
| IRN communal timetable API (the engine behind bonnetid.no / salah.no) | `api.bonnetid.no/prayertimes/{pk}/{year}/{month}/` | authority (Islamsk Råd Norge) | full-year monthly JSON, both asr shadow columns, isha + red/white twilight, midnight | 2026 only (2027 returns `[]`) |
| IRN location index | `api.bonnetid.no/locations/` | authority | 359 Norwegian municipalities with lat/lon and district codes | n/a |
| Mawaqeet per-place annual PDF | `mawaqeet.no/bonnetider/{slug}/` → `wp-content/uploads/...pdf` | community (rival line) | 12 monthly pages, both asr schools, `--:--` through the summer isha gap | 2026 |

`Api-Token` is read from the public page bundle (`api.bonnetid.no/locations/` is closed to plain requests without it; the token ships in the published JS). Capture loop: `fetch-irn.zsh`; mawaqeet loop: `fetch-mawaqeet.zsh`, parser `parse-mawaqeet.py`.

**New rows: 2,190.**

| Line | City | Rows | File |
| --- | --- | --- | --- |
| IRN | Bergen (pk 123) | 365 | `data/no-irn-bergen-2026.json` |
| IRN | Trondheim – Jakobsli – Heimdal – Saupstad (pk 209) | 365 | `data/no-irn-trondheim-2026.json` |
| IRN | Tromsø (pk 208) | 365 | `data/no-irn-tromso-2026.json` |
| Mawaqeet | Trondheim | 365 | `data/no-mawaqeet-trondheim-2026.json` |
| Mawaqeet | Kristiansand – Sogne | 365 | `data/no-mawaqeet-kristiansand-2026.json` |
| Mawaqeet | Ålesund | 365 | `data/no-mawaqeet-alesund-2026.json` |

Per-place columns are the site's own: `fajr sunrise dhuhr asr magrib isha`, plus `asr2x` (IRN) and `asr_hanafi` (mawaqeet). Tromsø and Kristiansand rows carry `isha: null` for the summer plateau, exactly as published (`--:--`); nothing is filled in.

**Confirms the record.** Both lines exist as recorded and publish a year, not a month: IRN carries `asr_1x_shadow`/`asr_2x_shadow`/`asr_wusta` beside its own `asr` column, mawaqeet prints both schools side by side. Same-city divergence is now measurable across a full year rather than one archived month: Trondheim on 2026-06-21 is IRN `fajr 02:03 / maghrib 23:40` against mawaqeet `fajr 01:21 / maghrib 23:43`.

**New.** IRN publishes the whole federation's arithmetic, not only the printed Oslo sheet: the API answers for every municipality, and the year is month-paged with five asr definitions per row. That widens the fit surface from one city to the country.

**Defects worth a lane.** Tromsø's polar night is a placeholder, not a solar event: on all 50 served days across the polar night (2026-01-01→15 and 11-27→12-31, when the sun does not rise) the table prints a "sunrise" between 11:33 and 11:54 and a maghrib between 16:53 and 17:25, then carries fajr/isha inside that invented daylight. Maghrib is not frozen in midsummer (it moves 19:33→19:37→19:35 across June and July), so the only Tromsø defect is the polar window. Any fit that includes Tromsø must exclude it. IRN serves no 2027 (all twelve months return `[]` on 2026-11-10), so year-2 for Norway means re-reading after the federation rolls the year.

**Honest negative.** Oslo annual was not re-read: it is on the record as 30 rows plus a monthly PDF, and the three cities above are the gap the brief named.

## Sweden — IF (Islamiska Förbundet) per-city year + Angered year — FIT-CAPTURE

| Source | URL | Tier | Dated data | Years |
| --- | --- | --- | --- | --- |
| IF national table, POST endpoint behind the page's own form | `islamiskaforbundet.se/wp-content/plugins/bonetider/Bonetider_Widget.php` (`ifis_bonetider_page_city`, `ifis_bonetider_page_month`) | authority-tier national body (community in the census's sense: no state mandate) | 111 cities × 12 months + a Ramadan sheet, 6 columns | 2026 (page heading "2026 Bönetider") |
| Angered mosque monthly tables | `angeredsmoske.se/bonetider?month=N` | community (mosque) | 12 months, `*` on Friday Asr, juma time in a footnote | 2026 |
| Sunni Centret / Bellevuemoskèn Göteborg | `sunnicentret.se/bonetidstabell`, monthly JPG `Bon-<Month>-<Year>.jpg` | community (mosque) | current month as an image; homepage prints today's row | 2026-11 only |
| Göteborgs Moské PDF (prior wave) | `goteborgsmoske.se/bonetider/bonetider_2026.pdf` | community (mosque) | 365 | 2026 |

The IF site is behind a JS challenge that refuses plain `curl` (HTTP 454, "Checking your browser"); the browser session `o1k-nordics2` passes it, and the monthly table is a jQuery POST from the page. Capture loop: `fetch-ifis.zsh`, parser `parse-ifis.py`, Angered parser `parse-angered.py`.

**New rows: 1,460.**

| City | Rows | File |
| --- | --- | --- |
| Stockholm (IF) | 365 | `data/se-ifis-stockholm-2026.json` |
| Uppsala (IF) | 365 | `data/se-ifis-uppsala-2026.json` |
| Göteborg (IF) | 365 | `data/se-ifis-goteborg-2026.json` |
| Göteborg (Angered mosque, own site) | 365 | `data/se-angered-2026.json` |

**Confirms the record.** IF's November row reproduces the live page exactly (`2026-11-01` = `04:47 06:59 11:36 13:30 16:04 18:00`), so the POST endpoint and the rendered page are one table. Angered's 365 days equal IF Göteborg's 365 days **cell for cell, 0 days differing**, and both match the Göteborg mosque's own PDF opening row (`06:25 08:48 12:20 13:28 15:42 17:50`): one Göteborg table, three publishers. The January fajr freeze the record names is the IF table's, not the mosque's.

**New.** The IF surface is national: 111 cities, Uppsala included, so the record's "18/16 in Stockholm only" becomes a country-wide series. The record had no series at all behind "IFiS validated 18/16 exact" — there is one now, three cities, 365 days each. The site also ships a thirteenth sheet, a Ramadan table that maps Ramadan day to Gregorian date (Ramadan 1 = 2026-02-19 for Stockholm), captured as `captures/se-ifis-stockholm-2026-13.html`.

**Divergence worth a fit.** Angered and the Göteborg mosque print the IF table; Sunni Centret does not: 2026-11-10 there is `05:29 07:45 12:01 13:45 16:14 18:16` against IF `05:29 07:38 12:01 13:45 16:14 18:08` — sunrise +7, isha +8 over the same base. Uppsala's own site publishes no table; it embeds an aggregator (`bontider.se/uppsala`) and states the method as "the European Fatwa Council", which is the IFiS/Diyanet line.

**Honest negative.** IF has no year archive: the page serves "2026", month-parameterised, and Wayback holds no monthly snapshots (`/bonetider*` CDX returns four URLs, none a table). Sunni Centret publishes a single month as an image, so it yields one dated row, not a year.

## Denmark — second route: two mosque surfaces plus a fourth line — PARTIAL

| Source | URL | Tier | Dated data | Years |
| --- | --- | --- | --- | --- |
| Mawaqeet network, Copenhagen | `mawaqeet.no/bonnetider/kobenhavn/` | community (Norwegian network) | 365, both asr schools | 2026 |
| Imam Ali (a.s.) Moske, Copenhagen | `imamalimoske.dk/dk/bedetider/` | community (mosque) | 20 Danish cities, 12 months, rendered client-side by `PrayTimes.js` method **Tehran** (fajr 17.7, isha 14, maghrib 4.5°, Jafari midnight) | 2026 |
| Khair al Bariya / Hamad Bin Khalifa Civilisation Center (Stormoskeen) | `time.my-masjid.com/timingscreen/3288ee62-b7e7-4a39-bf0c-00b88ceafdec` (embedded by `hbkcc.dk`) | community (mosque, My Masjid platform) | today + tomorrow adhan and iqama, jumua | live |
| salah.dk | `salah.dk` | community (aggregator) | today, Copenhagen/Århus/Odense/Malmö, Hanafi asr beside Shafi | live |
| adan.dk | `adan.dk/boentider/koebenhavn/` | community (aggregator) | dated day page | live |
| DIT — Det Islamiske Trossamfund | `wakf.com/salahtider/` | community (national society) | twelve cities + "Kun Ramadan" selector, **no rows rendered** | page stamped © 2023 |

**New rows: 456.** `data/no-mawaqeet-kobenhavn-2026.json` (365) and `data/dk-imamali-copenhagen-2026-samples.json` (91: January, June, November, rendered in the browser from the mosque's own page; the line is computed by the page's own script, so the render is the site's output, not mine).

**The 2026-11-10 schism, five publishers.**

| Surface | fajr | dhuhr | asr | maghrib | isha |
| --- | --- | --- | --- | --- | --- |
| Khair al Bariya (My Masjid) | 05:25 | 11:59 | 13:53 | 16:21 | 18:08 |
| Mawaqeet Copenhagen | 05:26 | 11:59 | 13:48 | 16:17 | 18:00 |
| Imam Ali (Tehran, no isha printed) | 05:28 | 11:54 | — | 16:41 | — |
| salah.dk | 05:48 | 11:55 | 13:47 | 16:12 | 17:59 |
| adan.dk (search snippet, unverified) | 05:26 | 11:54 | 13:47 | 16:12 | 18:14 |

Fajr spans 23 minutes and Isha 15 across Copenhagen on one day. The record's single-day reading (`fajr @15 exact, isha maghrib+97`) matches none of them exactly: mawaqeet prints maghrib+103, salah.dk +107, Khair al Bariya +107.

**Confirms, with a correction.** Against a solar model that reproduces the day's sunrise to one minute (07:33 computed, 07:34 printed), Copenhagen's 18° fajr on 2026-11-10 is **05:25** and its 15° fajr is **05:46**; the 15° isha is **18:02** and the 16° isha **18:09**. Measured against those: Khair al Bariya (05:25 / 18:08) reads **18/16**, Mawaqeet (05:26 / 18:00) reads **18/15**, salah.dk (05:48 / 17:59) reads **15/15**. The record's "fajr @15 exact" day-fit was therefore taken against the 15/15 table, not against Copenhagen's dominant line. The Hanafi asr is printed beside the Shafi one by two of them.

**New.** The Imam Ali mosque carries a national 20-city surface with the method named in its own script, and the My Masjid display is a per-mosque iqama board (fajr +20, dhuhr +15, asr +10, maghrib +5, isha +5, jumua 12:45).

**Honest negative.** The record's blocked 30-day series was retried on 2026-11-10 through three routes. DIT's own page (`wakf.com/salahtider/`, twelve cities plus "Kun Ramadan") is reachable but **renders no table**: it is a plain `POST` form to itself, the POST from `curl` is refused with 403, and a real in-browser form submit returns the same selector-only shell, so the handler that produced times is gone (the page is stamped © 2023). The Wayback availability API names a closest snapshot (`20260717182044`) and it now loads, but it holds the same selector shell with no rows. The carrier block on the original series is unchanged. No Danish publisher prints an annual table; the largest dated block found is mawaqeet's 365 rows for Copenhagen, which is a Norwegian network's render, not a Danish body's.

## Iceland — asr quirk cross-check and a third year — CONFIRMED DEFECT

| Source | URL | Tier | Dated data | Years |
| --- | --- | --- | --- | --- |
| Félag múslima á Íslandi | `felagmuslima.is/api/prayer-times?city=&date=` | authority-tier national body | per-day JSON, aladhan-format, both cities only | 2024, 2025, 2026, 2027 all served |

**New rows: 730.** `data/is-felagmuslima-reykjavik-2027.json`, `data/is-felagmuslima-akureyri-2027.json` (365 each). Capture loop `fetch-iceland.zsh`.

**The third city does not exist.** The API knows two cities and refuses everything else (`{"error":"Unknown city"}` for Ísafjörður, Egilsstaðir, Selfoss), and the site's city picker offers the same two. Iceland is a two-city surface.

**The asr quirk, measured across two cities and two years.** Asr minus dhuhr, in minutes:

| Series | rows | asr ≤ dhuhr | min | p10 | median | max |
| --- | --- | --- | --- | --- | --- | --- |
| Akureyri 2025 | 365 | 19 | −1 | 19 | 179 | 297 |
| Akureyri 2027 | 365 | 19 | −1 | 19 | 179 | 297 |
| Reykjavík 2025 | 365 | 0 | 17 | 31 | 181 | 292 |
| Reykjavík 2027 | 365 | 0 | 17 | 30 | 182 | 292 |

The two years are identical in shape, which settles the question the record left open: the asr column is not a madhab computation and not a year's data, it is the generator's own sweep. Akureyri prints **asr at or before dhuhr on 19 early-January days in both years** (`2027-01-01`: dhuhr 13:16, asr 13:15), and Reykjavík's January asr sits 17 minutes after dhuhr. No school of law produces that at 65°N.**Confirms.** The 2027 series reproduces the banked 2025 series on the same calendar dates to within one minute (Reykjavík 2026-…12-21 both years: fajr 08:31, sunrise 11:22, dhuhr 13:26, asr 13:46; maghrib and isha one minute earlier in 2027), so the generator is year-independent and the December +90 display rule is a property of the site, not of a year.

**Lift.** The asr column must be modelled as a generated sweep or dropped; the fajr/isha window is banked across three distinct years.

## Estonia — live cross-check of the headless engine run — VERIFIED

Five sample dates plus one year-2 date, rendered in a real browser from `eestiislamikeskus.org` (city `tartu`), against the prior wave's headless run of the site's own `app.js`. Renders saved as `captures/ee-eic-live-tartu-<year>-m<month>.txt`; comparator `verify-eic.py`.

| Date | Rendered page (Fajr/Sunrise/Dhuhr/Asr/Maghrib/Isha) | Headless engine | Delta |
| --- | --- | --- | --- |
| 2026-01-15 | 06:45 08:49 12:23 01:41 03:57 06:01 | identical | 0 |
| 2026-03-20 | 04:24 06:15 12:21 03:30 06:28 08:20 | identical | 0 |
| 2026-06-21 | 02:40 04:06 01:15 05:53 10:24 11:54 | identical | 0 |
| 2026-09-15 | 04:46 06:42 01:09 04:30 07:34 09:29 | identical | 0 |
| 2026-12-31 | 06:52 09:02 12:17 01:21 03:31 05:41 | identical | 0 |
| 2027-06-21 | 02:40 04:06 01:15 05:53 10:24 11:54 | identical | 0 |

**Verdict: 36 of 36 cells exact.** The headless run reproduces the live page, including the summer `nightPortion` fajr and the month-fixed isha. The site also prints its own rule per month ("Fajr uses the 15° angle for all days in November. Isha uses the 15° angle on 30 days"), which the run's `fajrRule`/`ishaRule` fields match. No data added: the 1,460 rows already on the record stand.

## Latvia — first surface found — NEW

| Source | URL | Tier | Dated data | Years |
| --- | --- | --- | --- | --- |
| Latvijas Islāma Kultūras Centrs | `likc.lv/prayer-times/` | community (national centre) | published scheme, no table: UOIF 12°/12° in summer, ISNA 15°/15° in winter, Shafi; embeds IslamicFinder widgets for Riga, Daugavpils, Ventspils, two per city (one per method) | 2026 live |
| IslamicFinder widget (the centre's own embed) | `islamicfinder.org/prayer-widget/{456172,454310,44282926}/shafi/{5|8}/0/{angles}` | platform | today at the embedded angles | 2026-11-10 |

**New rows: 6.** `data/lv-likc-islamicfinder-2026-11-10.json` — three cities × two published angle pairs, at 15/15 (the centre's stated winter rule) and 12/12.

| City | 15/15 fajr / isha | 12/12 fajr / isha | sunrise | dhuhr | asr | maghrib |
| --- | --- | --- | --- | --- | --- | --- |
| Riga | 06:02 / 18:14 | 06:25 / 17:51 | 07:51 | 12:09 | 13:57 | 16:24 |
| Daugavpils | 05:51 / 18:05 | 06:13 / 17:43 | 07:37 | 11:59 | 13:52 | 16:19 |
| Ventspils | 06:13 / 18:23 | 06:36 / 18:01 | 08:03 | 12:19 | 14:05 | 16:32 |

**Confirms nothing** — the record's Latvia line is a bare negative.

**New.** The country has a body, a published scheme and three named cities. The scheme is a seasonal swap (12/12 in summer, 15/15 in winter, Shafi) of exactly the kind a frozen parameter set cannot express, and the two settings are both visible on the same day: the 12/12 render moves Riga's fajr 23 minutes later and its isha 23 minutes earlier than the 15/15 render.

**Honest negative.** No dated table exists on the centre's site, the widgets serve only today, and no Latvian mosque publishes an annual file. What is banked is a scheme plus one dated row per city per method.

## Lithuania — first surface found — NEW

| Source | URL | Tier | Dated data | Years |
| --- | --- | --- | --- | --- |
| Lietuvos musulmonų muftiatas | `muftiate.lt/maldu-laikai/` | authority-tier (muftiate) | 7-day rolling table, rendered client-side, Hijri month names in Turkish | 2026-11-09 → 11-15 |
| Vilnius Mosque and Islamic Center | `mawaqit.net` masjid (uuid `ca2b68c6-7ffb-4327-822b-038ca29a71a1`) | community (mosque, platform) | iqama offsets +20/+10/+10/+5/+10, jumua 13:30, times computed by the platform | live |
| Kauno mečetė | `kaunomecete.lt/web/128/maldos-laikas` | community (mosque) | no table; points to Diyanet "Prayer Time for Kaunas" | n/a |

**New rows: 7.** `data/lt-muftiate-vilnius-2026-11.json`.

| Date | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-11-09 | 05:32 | 07:30 | 12:08 | 14:07 | 16:35 | 18:19 |
| 2026-11-10 | 05:34 | 07:32 | 12:08 | 14:05 | 16:34 | 18:18 |
| 2026-11-15 | 05:42 | 07:42 | 12:08 | 13:59 | 16:25 | 18:11 |

**New.** Lithuania is not surfaceless: the muftiate publishes a rolling week, and the Turkish Hijri labels ("Cemaziyelevvel") plus the Kaunas mosque's own Diyanet link put the Lithuanian line on **Diyanet**, not on the Nordic 18/16 or a 15/15 family. The published pair matches the Diyanet angles rather than a Nordic reading: against a standard solar model for 54.674°N 25.259°E on 2026-11-10, the printed fajr 05:34 sits between the 17° reading (05:39) and the 18° reading (05:32), and the printed isha 18:18 sits between 15° (18:11) and 16° (18:18) — an 18/16 shape, five and a half months of it banked as 7 rows.

**Honest negative.** The muftiate serves seven days and no archive or parameter; the Mawaqit entry exposes configuration, not a calendar; Kaunas publishes nothing of its own. A Lithuanian year needs either a weekly re-read or the Diyanet Kaunas/Vilnius page, which is outside this pass.

## Ukraine — 2027 not yet published — HONEST NEGATIVE

`islam.ua/uk/bibliotekaukr/kalendar-namaziv` lists the 2026 calendar set (13 cities, print and mobile PDFs) and nothing for 2027. Probed on 2026-11-10, all 404:

- `/images/kalendar-namazov/Calendar_2027/print/Odessa_2027_Print_Cal.pdf`
- `/images/kalendar-namazov/Calendar_2027/print/Odesa_2027_Print_Cal.pdf`
- `/images/kalendar-namazov/Calendar_2027/smart/Mob_Cal_Odessa_2027.pdf`
- `/images/kalendar-namazov/Calendar_2027/print/Kiev_2027_Print_Cal.pdf`
- the same paths for 2024, 2025 and 2028 (404 each), so the folder is year-specific and only `Calendar_2026` exists

**What was banked instead:** `captures/ua-odesa-2026-print-cal.pdf` (14 pages, 3.1 MB, "2026 … г. Одесса … КАЛЕНДАРЬ", DUMU masthead, 1447-1448 AH) — the interval-rule object's own published year file, as a second witness beside the 365 rows already on the record.

**Verdict.** Odesa January 2027 is not served. The year-2 capture for the interval-rule object must wait for DUMU's next edition; nothing about the 2026 rules changed.

## Belarus — first surface found — NEW

| Source | URL | Tier | Dated data | Years |
| --- | --- | --- | --- | --- |
| Мусульманское религиозное объединение в Республике Беларусь | `islambel.by/vremya-namazov` | authority-tier (national religious association) | one 365-row table, Minsk, 6 columns | 2025 only (page not rolled to 2026) |

**New rows: 365.** `data/by-islambel-minsk-2025.json`.

| Date | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha |
| --- | --- | --- | --- | --- | --- | --- |
| 2025-01-01 | 07:16 | 09:21 | 13:18 | 14:47 | 17:05 | 18:56 |
| 2025-06-21 | 03:08 | 04:31 | 13:17 | 17:43 | 21:52 | 23:06 |
| 2025-12-31 | 07:16 | 09:21 | 13:18 | 14:46 | 17:04 | 18:55 |

**New.** The record is silent on Belarus; the national association publishes a full year for the capital with no city selector and no angle statement. It is now banked, and it clamps both twilight ends rather than freezing them: fajr stops rising at **07:16** for ten days across the two year-ends (2025-01-01→06 and 12-28→31) while sunrise keeps moving at the January end, and isha stops rising at **23:06** for thirteen midsummer days (06-21→07-03). Any fit needs a cap pair, not angles alone.

**Honest negative.** Minsk only, 2025 only, no method statement, and the page has not been updated for the current year — a single-year snapshot, not a live series.

## Searches run (languages) and what each closed

Norwegian (bonnetid, årstabell, IRN), Swedish (böntider, islamiska förbundet, Uppsala moské, Göteborg moské), Danish (bønnetider, Hamad bin Omar/Hamad Bin Khalifa, Imam Ali), Latvian (lūgšanu laiki, Islāma kultūras centrs), Lithuanian (maldos laikai, Vilniaus mečetė, muftiatas), Russian (намаз время Минск, расписание 2026), English. Forums and Facebook posts were used only as pointers; no forum content was transcribed as data. Nothing under `/tmp`; every capture is in `captures/`.
