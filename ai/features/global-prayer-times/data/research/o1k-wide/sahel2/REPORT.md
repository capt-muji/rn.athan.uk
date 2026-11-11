# sahel2 — wide-research report (11 countries in scope)

Captured 2026-11-10. Public pages only, no login, no subagents. Every raw response under
`captures/`; normalized dated rows under `data/` (format: `{'YYYY-MM-DD': {fajr, sunrise, dhuhr, asr, magrib, isha}}`).
Total normalized rows this session: **3,710**.

## Alignment method used on all mawaqit pages (applies to Togo, Benin, Mali, Guinea, Burkina second city, Ghana)

Each mawaqit mosque page embeds a 12-month `calendar` JSON with no explicit year. On every page
captured here, the **live displayed times for 2026-11-10 (the five `times` values plus `shuruq`)
equal calendar month 11, day 10 exactly**. The month index therefore binds to the Gregorian month
of the serving year (Jan-Dec 2026). Several tables carry 366 entries (a leap-year template with a
Feb 29 filler row duplicating Mar 1); the extra row is dropped in normalization and noted per file.

**CENSUS CORRECTION CANDIDATE:** C1's Togo/Benin captures recorded `calendar_start: 2027-01`
("assumed January"). The today-anchor proves the served tables are month-aligned to the CURRENT
year, so the same underlying tables C1 banked are Jan-Dec **2026**, not 2027. The rows are
identical; only the year labels change.

---

## Togo

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| MOSQUEE CENTRE AL-FAROUK, Sokode (Mawaqit) | mawaqit.net/en/m/mosquee-centre-al-farouk-de-sokode-sokode-bp-40-bafilo-togo | community (mosque-platform) | 365 dated rows, all six columns sun-tracking | 2026 |

- **Confirms:** the held C1 surface (same mosque, same table values).
- **New:** fresh capture + 2026 year alignment (365 rows) — `data/togo-sokode-al-farouk-mawaqit-2026.json`. Today-anchor exact.
- **Fit:** full-year bank, Sokode lat 8.97/lon 1.17, tz Africa/Lome.
- Closes Togo to provisional per the task.

## Benin

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| Mosquee Omar El Farooq, Cotonou/Gakpe (Mawaqit) | mawaqit.net/en/m/mosquee-c-interculturel-omar-el-farooq-gakpe-00000-benin | community (mosque-platform) | 365 dated rows, all six columns sun-tracking | 2026 |

- **Confirms:** the held C1 surface. **New:** fresh capture, 2026-aligned (365 rows) — `data/benin-cotonou-omar-el-farooq-mawaqit-2026.json`. Today-anchor exact.
- Closes Benin to provisional per the task.

## Mali — first surfaces for the country (record was FALLBACK "no surface")

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| Mosquee AR-RAHMAN Badalabougou, Bamako (Mawaqit) | mawaqit.net/fr/m/ar-rahma-bamako | community | 365 rows + iqamah layer (+15 / 13:00 / 16:00 / +10 / 19:30) | 2026 |
| Mosquee Al Madina Al Mounawara, Bamako (Mawaqit) | mawaqit.net/es/m/mosquee-al-madina-al-mounawara-bamako-99-mali | community | 365 rows, all six columns sun-tracking (stable jamaah offsets) | 2026 |
| Mosquee Al Tawfiq, Bamako (Mawaqit) | mawaqit.net/en/m/mosquee-al-tawfiq-bamako-91095-mali | community | 365 rows; fajr/maghrib sun-tracking, dhuhr fixed 13:15 | 2026 |
| Mosquee Oumar Ibn Kattab, Sokorodji Bamako (Mawaqit) | mawaqit.net/fr/mosquee-oumar-ibn-kattab-sokorodji-bamako-00000-mali | community | 365 rows; mostly fixed jamaah (maghrib 19:10 fixed all year = NOT athan) | 2026 |

- **NEW: Mali lifts from FALLBACK.** Bamako has a whole Mawaqit cluster (7+ mosques found; 4 captured).
  `data/mali-bamako-*.json` (4 × 365 rows).
- Column audit: Al Madina Al Mounawara is the cleanest computed table; AR-RAHMAN tracks
  fajr/sunrise/maghrib with a fixed dhuhr 12:45 (jamaah convention); Oumar Ibn Kattab is
  jamaah-convention on dhuhr/asr/maghrib/isha (its maghrib 19:10 fixed cannot be an athan —
  flagged for the fit as congregation times, not sun times).
- Haut Conseil Islamique du Mali: no own website with tables found (FR searches; Wikipedia/news/
  esalah listing only). Bambara-language search returned nothing relevant (generic Bamako pages).
- Files: `data/mali-bamako-ar-rahman-mawaqit-2026.json`, `...al-madina-mounawara...`, `...al-tawfiq...`, `...omar-ibn-kattab...`.

## Burkina Faso

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| MSBF annual calendar PDF (own site) | sunna.bf/heuresprieres/Heures Priere 2021.pdf | **authority publisher** (federation's own site) | 12 pages, clean text layer, Hijri 1442/1443, Ouagadougou, azan/prière pairs | 2021 (Hijri 1442/1443) |
| MSBF Facebook post: 1447 annual calendar (5 images) | facebook.com/www.islam.bf/posts/...1247156004087474/ | authority publisher | 5 pages, Gregorian-dated, Region du Centre (Ouagadougou), Jun-Nov [2025] | 2025-2026 (1447) |
| Mosquee Mamadou Kone, Bobo-Dioulasso (Mawaqit) | mawaqit.net/fr/m/mosquee-mamadou-kone-bobo-dioulasso-bp01333-burkina-faso | community (second city!) | 365 dated rows, today-anchor exact | 2026 |

- **THE FEDERATION'S PRINTED ANNUAL CALENDAR EXISTS WITH A TEXT LAYER** — hosted on MSBF's own
  site (sunna.bf). Only the 2021 edition is hosted (2022-2026 filenames 404). Hijri-organized with
  NO Gregorian dates in the 2021 edition, so it is banked as doctrine evidence, not normalized
  into dated rows (`captures/msbf-heures-priere-2021.pdf` + extracted text).
- **Doctrine settled:** dhuhr azan FIXED per month-block (12:30 Jumada I, 12:45 Ramadan), asr fixed,
  maghrib azan sun-tracking — the six byte-identical Ouagadougou mawaqit records' noon-offset
  dhuhr is federation convention, not data entry.
- **The current 1447 edition (2025-2026) is posted as five images on MSBF's own Facebook page,
  WITH Gregorian dates printed** — page 1 = 26 Jun-25 Jul, page 5 = 1-30 November 2025. A C26-style
  pixel-geometry pass over these five images yields year-2 Gregorian rows for Burkina
  (`captures/msbf-1447-annual-page1..5.jpg`). Post also names a Telegram channel PDF and the
  **Awkaat** app (Playstore) carrying "heure de plusieurs régions".
- **Second city captured:** Mamadou Kone Bobo-Dioulasso — dhuhr tracks TRUE solar noon (12:01 on
  Nov 10, EoT-correct), unlike the Ouaga template. `data/burkina-bobo-mamadou-kone-mawaqit-2026.json` (365 rows).
- Also found: an 8th Ouaga MSBF mosque on mawaqit (mawaarid mouminoun) — not captured; adds nothing over C20's six.

## Senegal

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| CERFI monthly PDFs, Dakar (12 months) | cerfi.sn/static/salats/Dakar/mois/Dakar_01.pdf .. _12.pdf | institution/community (Imams' seminar standard, not the national body) | **365 dated rows**, text layer, 6 Wolof-named columns | **2011** (edition printed on every PDF) |
| Grande Mosquee UCAD own site | grandemosqueeucad.com | mosque own page | jamaah hours only (Fajr 5:50, Tisbar 14:15, Takussaan 17:00, Timis 19:50, Guee 21:00) | undated |

- **NEW surface:** CERFI (cerfi.sn) publishes Dakar monthly tables from the 2011 "Seminaire des
  Imams sur les heures de priere a Dakar selon la Shari'a" (each PDF footer: "Entree en vigueur le
  27 Rajab 1432 (mer. 29 juin 2011)"). Normalized to `data/senegal-dakar-cerfi-2011.json`
  (365 rows; one print slip noted: a "29 fevrier" row in a non-leap year, dropped).
- Column conventions: Fajar = dawn fajr (~15 min before sunrise, small-angle convention), Suba =
  sunrise, Tisbar = dhuhr (solar-noon-tracking), Takusan = asr, Timis = maghrib, Guewe = isha
  (maghrib + ~60). Friday prayer +30 min note printed.
- **Confirms the census reading:** the UCAD mosque's OWN page prints Tisbar 14:15 as the mosque's
  jamaah hour — direct corroboration that the 14:15 seen in the three mawaqit tables is
  congregation convention, not athan.
- Grande Mosquee de Ouakam: no own page found (FR searches return aggregators only). Massalikoul
  Djinane: no own page (esalah/prayersconnect listings + YouTube live streams only). Touba/Mouride
  and Tivaouane/Tijaniyya bodies: no dated tables surfaced on own pages; a Facebook Tivaouane
  files-group posts weekly Dakar schedules (community, forum-class — recorded, not transcribed).

## Guinea

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| Grande Mosquee de Nono (Mawaqit) | mawaqit.net/no/m/grande-mosquee-de-nono-nono-1234-guinee | community | **365 dated rows, passes all sanity gates** | 2026 |
| Mosquee Abi Oubayda, Conakry (Mawaqit) | mawaqit.net/fr/m/mosquee-yattaya-plateau-224-conakry-guinea | broken | fajr ≥ sunrise on 191/365 days — misconfiguration class like Landreyah | — |
| Mosquee Gbessia Port 2, Conakry (Mawaqit) | mawaqit.net/es/m/mosquee-gbessia-port2-conakry-guinea | broken | months of 00:00 rows, Nov/Dec duplicated blocks, 07:30 sunrise — garbage config | — |

- **NEW: Guinea lifts from FALLBACK.** One passing mosque-platform table exists — Grande Mosquee
  de Nono (Nono, Mamou region, lat 10.88/lon -10.50): fajr-sunrise gap 58-76 min, maghrib tracks
  sunset (+5 min class), isha maghrib+59-74, dhuhr fixed 13:45 (jamaah convention).
  `data/guinea-nono-grande-mosquee-mawaqit-2026.json` (365 rows).
- **Conakry still has NO passing own-table** (Landreyah, Abi Oubayda, Gbessia all broken — same
  platform-misconfiguration class; raw captures banked).
- Mosquee Faycal (national grand mosque): no own page with times (gov press pages only).

## Ivory Coast (Côte d'Ivoire)

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| **COSIM own-site calendar image** | cosim-ci.org/ressources/calendrier → storage/calendrier/calendrier_1789167205.jpeg | **AUTHORITY** (national council's own site) | **30 dated rows**, Rabihoul Al-Thany 1448 = 2026-09-12..2026-10-11 | 2026 (current month) |
| COSIM Ramadan 2018 PDF (republished) | media-files.abidjan.net/document/docs/Calendrier(218).pdf | authority publisher (republished) | text layer, Ramadan 2018, multi-city validity list | 2018 |

- **NEW beyond the broken COSIM JSON proxy:** the council's own site hosts a monthly calendar
  image. Transcribed 30 rows → `data/ci-abidjan-cosim-rabi1448-sepoct2026.json` (fajr/sunrise/
  maghrib/isha daily; **zouhr and assr print as fixed national conventions** — the columns
  literally contain the text "13 Heures conventionnelle en Côte d'Ivoire" and "16 Heures
  conventionnelle", i.e. 13:00/16:00 clock conventions).
- **Cross-check with the census's COSIM-proxy findings:** the proxy's isna 15/15 computed dhuhr
  near solar noon, but the federation's own printed convention is FIXED 13:00 — two different
  surfaces, two different dhuhr doctrines. The printed sheet is authority-tier.
- Scribd holds "Calendrier Cosim Ramadan 2026" (community republish) — noted, not transcribed.
- Mosquee Salam du Plateau: no own page with tables (tourism/news only). AEEMCI (aeemci-ce.ci):
  probed, no prayer-time section (student-body admin site). COCI-adjacent bodies: nothing surfaced.

## Ghana (round 2)

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| Mountari Mosque, Accra Lomnava (Mawaqit) | mawaqit.net/en/mountari-accra-lomnava-ghana | community | **365 dated rows**, all columns sun-tracking, clean gates | 2026 |

- **NEW second Ghana mosque table:** `data/ghana-accra-mountari-mawaqit-2026.json` (365 rows).
  Cross-check: the national mosque's Muslim Pro widget showed Fajr 4:36/Sunrise 5:47/Zuhr 11:45
  (Nov 9) — Mountari's table reads 04:36/05:48/11:45 (Nov 10) — consistent.
- Kumasi: NO mosque table (Central Mosque Kumasi posts event times on Facebook only; aggregators
  only otherwise). Ghana Hajj Board (ghanahajj.com): hajj logistics, no prayer timetable.
- Al-Firdaws Accra remains the held first witness; Mountari is the second.

## Togo/Benin/Ghana/Burkina/Mali/Guinea — mawaqit coverage note
Mawaqit pages were reached in FR/EN/ES/PT/NO/IT language variants interchangeably (same payload).

## Liberia

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| MATW Project monthly timetable, Monrovia | matwprojectca.org/donate/namaz-timetable/lr/monrovia | community (computed) | **30 dated rows** (Nov 2026), clean gates | 2026-11 |

- **New rows:** `data/liberia-monrovia-matw-2026-11.json` — a second month from the
  January-class feed family (monthly dated tables), strengthening the T-665 candidate reading.
- Muslim Congress of Liberia (muslimcongressliberia.org): probed — school/organization site, no
  prayer data. No Liberian mosque/council own-table found in EN searches.

## Sierra Leone (round 2)

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| SL Islamic Web calendar-distribution post (5 images) | facebook.com/sliwebsl/posts/...1470605761772687/ | community | photos of the printed "2026 Islamic Calendar 1447-1446 Hijri" poster distributed to Freetown masjids | 2026 |

- **2027 edition: not yet published** (Ramadan 1448 falls Feb-Mar 2027; nothing indexed —
  honest negative, retriable after Dec 2026).
- **Second city: honest negative.** Bo/Kenema/Makeni have aggregator pages only (athanpro,
  muslimpro, salahtimes); no mosque own-table.
- **New provenance:** the held Freetown table's publisher (SL Islamic Web) runs the printed
  annual calendar distribution with One Deen Group; poster images banked
  (`captures/sliwebsl-calendar-img1..5.jpg` — year-grid hijri poster, cells illegible at this
  resolution; a high-res scan or the One Deen SL print file would yield a full-year table).
  sliwebsl also posts DAILY "PRAYER SCHEDULE FOR TODAY" posts year-round (Freetown) — ongoing
  practice evidence.

## Gambia (November + year-2 debt)

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| GSIC November 2026 post + image (re-captured raw) | facebook.com/thegsic/posts/...1428480842787580/ | authority | post fetched PUBLICLY without login (text, timestamp Nov 1 2026 2:42 PM, image) | 2026-11 |
| GSIC February 2026 post + image | .../calendar-for-prayer-times-february-2026/1197004465935220/ | authority | image banked + verified (same 11-column GBA layout) | 2026-02 |
| GSIC Ramadan 1447 imsakiyyah (GBA/WCR) | .../prayer-times-calendar-for-gbawcr-and-urr/1212978077671192/ | authority | image banked + verified; URR panel not in the retrieved single image | Ramadan 2026 |
| GSIC April + May 2026 posts + images | .../1244514467850886/, .../1270778041891195/ | authority | images banked (not re-transcribed) | 2026-04, 2026-05 |
| **NEW: gsic.gm (GSIC's own website)** | gsic.gm | authority | NO prayer tables anywhere on the site (probed home, info-portal, moon-sighting, services/mosques, WP search) | — |

- November 2026 re-capture: raw post fetched public (no login), calendar image downloaded
  (`captures/gsic-november-2026-calendar.jpg`, 509x720), verified against C26's transcription
  (row 1 columns match exactly).
- **Year-2 debt (December 2025): honest negative, closed this round.** The earliest indexed GSIC
  calendar post is Jan 31, 2026 (the February 2026 calendar): monthly calendar posting appears to
  BEGIN in 2026, so no December 2025 edition may exist at all. Facebook timeline login-walled;
  Instagram content login-walled (a Jul 30 2025 post exists but renders no content anonymously);
  Wayback CDX temporarily offline on 2026-11-10 (retriable).
- The banked months (Feb/Ramadan/Apr/May/Jul/Nov 2026) span three solar seasons — sufficient for
  a same-year recipe cross-fit even without 2025.

## Honest negatives (searched and closed)

- **Mali in Bambara:** query returned nothing relevant (generic Bamako pages). FR search was productive (the mawaqit cluster above).
- **Wolof (Senegal):** "waxtu julli Dakar" — nothing beyond aggregators.
- **Gambia December 2025:** see above (login walls + Wayback offline + likely never published).
- **Sierra Leone 2027:** too early; second city negative.
- **Liberia own-table:** none exists on the public web; MATW monthly feed is the only dated surface class.
- **Ghana Hajj Board:** no prayer timetable publications.
- **Scribd fetches:** blocked by JS challenge for Heures Priere 1448 and Monthly Prayer Times (Dakar Feb 2026) documents — recorded, not fetched (public-post rule respected; no captcha solving).
