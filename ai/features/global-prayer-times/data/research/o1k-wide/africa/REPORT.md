# O1k-wide Africa hunt — REPORT (tag: africa)

Workspace: `$HOME/athan-gitree/census/o1k-wide/africa/`. Captures in `captures/`, normalized rows in `data/`.
Record read before hunting: `ai/features/global-prayer-times/data/census/world-table-v2.md` (rows Niger, Gambia, Sierra Leone, Mali, Senegal, Nigeria, Ghana, Ethiopia, Kenya, Tanzania, Uganda).

---

## Gambia

| Surface | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| GSIC monthly calendar (Greater Banjul + Komboos), Facebook post | facebook.com/thegsic/posts/gsic-calender-for-prayer-times-greater-banjul-area-month-november-2026/1428480842787580/ | authority | 30 days × 11 columns (azaan+iqaamah pairs) | Nov 2026 |
| GSIC monthly calendar, December 2022 (via group share) | facebook.com/huffaazinthegambia/posts/180369617917709/ | authority (publisher GSIC; shared by a community page) | 31 days × 11 columns | Dec 2022 |
| GSIC monthly series on the page timeline | facebook.com/thegsic (Feb, Apr, May, Jul, Nov 2026 posts seen in search) | authority | monthly images | 2026 series |
| GSIC official website | gsic.gm | authority | no prayer calendar on site; Info Portal carries fatwa/zakaat news only | — |
| GSIC regional variant "Prayer Times Calendar for GBA/WCR and URR" | facebook.com/thegsic/posts/prayer-times-calendar-for-gbawcr-and-urr/1212978077671192/ | authority | region-split calendar (lead, not captured this pass) | undated in snippet |

**Captures:** `gambia-gsic-november-2026-prayer-calendar.jpg` (1448×2048), `gambia-gsic-december-2022-calendar.jpg` (763×1080), `verify-gambia-dec2022-*.png` zoom crops, two permalink HTML saves.

**Confirms the census:** November 2026 re-captured at four times the census capture's resolution. Independent whole-image re-transcription (`data/gambia-gsic-2026-11-secondary-read.json`) agrees with the census bank on 29 of 30 days; the single difference is day-23 maghrib (hi-res prints 6:36/6:46; census bank carries 18:37/18:47 — one minute, iqamah rule +10 holds either way). Iqaamah rules +20/+20/+20/+10/+15 reconfirmed on every row. The "GSIC timeline is login-walled" caveat now has a workaround: a permalink served to a crawler UA carries `og:image` pointing at `lookaside.fbsbx.com/lookaside/crawler/media/?media_id=…`, which serves the image without login. That route produced both captures.

**NEW:** December 2022 calendar (`data/gambia-gsic-2022-12.json`, 31 rows) — the year-2 lift the census asked for, exceeded by four years. Day-of-week chain verifies (Dec 1 2022 = Thursday, Dec 31 = Saturday). Same iqamah rules as 2026, print irregularities left as printed (day-13 dhuhr iqamah prints 01:21 against a 01:00 azaan). Caveat: the share's text says "June 2025" while the attached image is December 2022 — the group text is unreliable, the image is the artifact. A GSIC-authored June 2025 post may still exist on the page timeline; search could not enumerate it.

**Worth a fit:** 2022-12 vs 2026-11 gives two opposite-season, cross-year banks on identical column discipline; re-test the census's 17.85/17.0 against the 2022 bank.

**Negatives:** gsic.gm itself publishes no calendar (site:gsic.gm + Info Portal fetched); no 2025-author post surfaced in English or Arabic queries.

---

## Sierra Leone

| Surface | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| SL Islamic Web Ramadan calendar post | facebook.com/sliwebsl/posts/ramadan-2026-calendar-for-freetownif-you-need-the-pdf-to-print-for-personal-use-/1396219135878017/ | community | 30 days × 6 columns, Freetown | Ramadan 2026 |
| SL Islamic Web daily "PRAYER SCHEDULE FOR TODAY" posts | facebook.com/sliwebsl (Jun 12, Aug 13, Nov 1 2026 posts seen) | community | today-only daily images | 2026 rolling |
| sierraleoneislamicweb.com (domain printed on their logo) | dead — Cloudflare 522 | — | — | — |

**Capture:** `sierraleone-sliweb-ramadan-2026-calendar.jpg` (1080×1544, lookaside route, no login).

**Confirms the census verbatim:** the post text says "NOTE: This is just an estimated calendar" and the sheet banner carries the fixed "5:38 AM / 7:10 PM EVERYDAY" advice the census recorded, sitting above its own moving table — table survives, banner does not. The census's Freetown-wide community table is reconfirmed as this exact artifact, now captured whole.

**NEW (data):** full 30-row transcription banked (`data/sierraleone-sliweb-2026-03-ramadan-freetown.json`), sheet self-labelled "2026/1447 RAMADAN CALENDAR (Estimated Prayer Dates and Times) FOR FREETOWN". Community tier holds; accuracy alone does not lift it.

**Negatives:** sierraleoneislamicweb.com is dead; no authority-tier body surface found (English; the census's Freetown community read stands).

---

## Senegal

| Surface | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| CERFI — Centre d'Études, de Recherches et de Formation sur l'Islam | cerfi.sn | community publisher, institutional source credit | per-city WEEKLY web tables + monthly PDFs, 152 cities, "mis à jour quotidiennement" | rolling 2026→2027 |
| CERFI monthly PDF, Dakar November | cerfi.sn/static/salats/Dakar/mois/Dakar_11.pdf (files Dakar_01..12 roll with current year) | community publisher, "Source : Séminaire des Imams" printed | 30 days × 6 columns | Nov 2026 |
| "Heures De Prières Dakar/Sénégal" weekly FB posts | facebook.com/islaminvocationetrappels | community | weekly Dakar rows (Nov 6-12 2026 seen: 05H54 06H09 14H15 16H45 18H46 19H46) | 2026 rolling |
| leral.net "Heures des prières" hub | leral.net/Heures-des-prieres_r19.html | media | stale weekly tables 2017-2018, Wolof column names; editorial explainers 2026 | stale |

**Captures:** `senegal-cerfi-home.html` (weekly table Nov 9-15 2026), `senegal-cerfi-dakar-2026-11-monthly.pdf` (TEXT LAYER — transcribed directly), `senegal-cerfi-contact.html`.

**NEW:** CERFI is the surface the census's Senegal row lacks ("no national body table — T-665 FEED; three Dakar mawaqit mosques only"). 152 cities, daily-updated, monthly PDFs per city. Publisher is a Dakar Islamic studies/education centre; the sheet credits "Séminaire des Imams" as its source for "heures de prière selon la Sharî`a" — authority-class LINEAGE on a community-class publisher; tier call stays with the owner. Web table and PDF agree cell-for-cell on the overlapping days.

**Worth a fit:** the sheet carries a TWO-DAWN convention: Fajar (earliest gate) then Suba ~15 min later; Suba prints ~62 min before sunrise (15° class), Fajar ~77 min (18° class); Timis matches astronomical sunset within 0-1 min; Tisbâr is true transit. November Dakar banked in full (`data/senegal-cerfi-dakar-2026-11.json`, 30 rows).

**Negatives:** no Senegalese national-body table found in French (commission/centre queries); the mawaqit mosques the census holds remain the platform layer.

---

## Mali

| Surface | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| Mosquée AR-RAHMAN Badalabougou, Bamako — mawaqit page | mawaqit.net/fr/m/ar-rahma-bamako | platform/community (mosque-endorsed) | full-year calendar JSON embedded: 12 months, 366 day-slots × 6 columns | current-year payload (no year label), served 2026-11-10 |

**Capture:** `mali-mawaqit-ar-rahma-bamako.html` + extracted payload `mali-arrahma-bamako-calendar-raw.json`; November normalized in `data/mali-arrahma-bamako-2026-11-mawaqit.json` (30 rows).

**NEW — the census's Mali FALLBACK ("no surface, T-665 NONE stands") is challenged by a find of the same class that moved Djibouti to community:** a Bamako mosque with a mosque-endorsed full-year payload. Solar gate PASSES: Nov 10 served shuruq 06:28 / maghrib 18:05 vs astronomical 06:28 / 18:04 (0-1 min). Convention: dhuhr FIXED 12:45-12:46 all year (jamaah, +29 min after true transit on Nov 10), asr near-fixed 15:45-15:55, isha 19:15-20:01, fajr coarse 05:15-05:45 — partial jama'ah class, exactly the Ghana Al-Firdaws pattern the census describes elsewhere.

**Worth a fit:** fajr/shuruq/maghrib columns against Bamako coordinates (instant provisional recipe for the mosque layer).

**Negatives:** still no national-body surface in French queries; the census's mawaqit sweep (C20) evidently predates or missed this page — worth a re-sweep note.

---

## Kenya

| Surface | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| Jamia Mosque Nairobi — Ramadhan Timetable page | jamiamosque.co.ke/ramadhan-timetable/ | community (mosque committee, KMD co-prepared) | PDF: 47-city Ramadan table, 30 days × 2 columns per city (Suhoor Ends / Iftar) | Ramadan 1447/2026 |
| Jamia homepage prayer block | jamiamosque.co.ke/home/ | widget | today-only | — |
| Kenya Meteorological Department | meteo.go.ke | government | NO prayer content (weather only) | — |

**Captures:** `kenya-jamia-ramadhan-timetable-1447-2026.pdf` (7 pages, text layer), `kenya-jamia-ramadhan-timetable.html`, `kenya-jamia-mosque-home.html`.

**Confirms the census:** the PDF is the same artifact C35 fitted ("RAMADHAN TIMETABLE 2026/1447", 7+6+7+5+7+… city columns, 30 Ramadan days Feb 18/19–Mar 20), and its footer prints verbatim: "Timings prepared by the Da'wah Office Jamia Mosque Committee-Nairobi in collaboration with Kenya Meteorological Department." The homepage widget is confirmed as Muslim Pro `cityid=184745` in source — exactly the census read.

**Negative on the year-round prize:** the "Kenya Met host" lead is closed honestly — meteo.go.ke carries no prayer/Ramadan content (site: and fetch checks; only weather forecasts). The KMD role is co-preparation credit inside the Jamia PDF, not a host of tables. Kenya's year-round surface remains the Muslim Pro widget class; the Ramadan-only fitted table stands alone.

**Negatives:** Mombasa has no mosque-owned monthly table (Swahili "nyakati za sala" queried — hits are Instagram/TikTok daily posts and aggregators); Swahili query returned editorial content only.

---

## Nigeria

| Surface | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| National Mosque Abuja official app landing | nigerianmosqueservices.app | authority-adjacent (official app of the mosque) | no web-served timetable; prayer schedule lives in the app | — |
| NSCIA | nscia.com.ng | authority | announcements only; Services page lists Qur'an/Hadith, Moon Sighting, E-Books — NO timetable | — |
| LEMU / Lekki Central Mosque | lekkicentralmosque.org + X @LekkiMusUmmah + Instagram | community (mosque-owned) | homepage FIXED jamaah block (Fajr 5:40, Dhuhr 1:00, Asr 4:05, Isha 8:00, Maghrib SUNSET); MONTHLY timetables posted to Instagram/X ("JANUARY 2026 PRAYER TIMETABLE", "Salah time schedule for April 2026") | 2026 monthly series, social-only |
| Muslim Council of Lagos / Kano / Kaduna / Ibadan councils | — | — | no dated tables surfaced | — |
| University of Ibadan Central Mosque 1434 AH timetable | scribd.com/doc/161329003 | community (university mosque) | Nov 2012–May 2013 | stale |
| prayertimesnigeria.com | unchanged | community | full-year LGA tables (on record) | — |

**Captures:** `nigeria-nigerianmosqueservices-app-home.html` + `…-main.js`, `nigeria-lekki-central-mosque-home.html` (+ sitemaps), NSCIA home + services fetches.

**Confirms the census:** NSCIA stays announcements-only (services page enumerated); Abuja National Mosque's web presence is the app landing page with no monthly archive on the open web; Lagos Central Mosque and Kano Great Mosque have no own-table surfaces in English or Hausa queries ("lokacin salla" returned editorial/fiqh content only).

**NEW:** (1) the National Mosque Abuja's OFFICIAL MOBILE APP (`nigerianmosqueservices.app`) — "Prayer schedule, custom adhan audio, offline-capable daily schedules" — a mosque-owned computed schedule one platform hop away, web-unreadable; a future fit needs the app payload, not the site. (2) LEMU's monthly Instagram/X timetable series for Lagos (Lekki) — mosque-published, dated monthly, image-only, reachable only via logged-in social surfaces; recorded as a lead per the image-calendar rule. (3) the mawaqit Nigeria cluster (Air Force Base Central Mosque Abuja, Chevron Drive Lekki) seen in search — platform-tier outriders beyond the census's Nigeria row.

**Negatives:** no monthly archive for the Abuja mosque; no state-council tables for Lagos/Kano/Kaduna/Ibadan in English or Hausa; NSCIA dated publication = none.

---

## Ghana

| Surface | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| GhanaMasjid mosque directory | ghanamasjid.org | community platform | per-mosque daily/Jumuah times claimed; Firestore-backed SPA (payload not fetched without deeper work) | today-only class |
| National Mosque of Ghana | ghananationalmosque.com | mosque (widget) | Muslim Pro widget block ("Powered by Muslim") | today-only |
| Office of the National Chief Imam | Facebook page only | authority (announcements) | moon-sighting/Eid announcements; no timetable | — |

**Confirms the census:** national mosque = Muslim Pro widget (reconfirmed in the live snippet and page); Al-Firdaws Accra remains the one real table on record; ONCI = announcements.

**NEW:** ghanamasjid.org — a Ghana-wide mosque directory with per-mosque prayer times (Firestore-backed; enumerated mosque names visible: Kumasi Central Mosque, Masjid ul Jamiu Auntie Aku, etc.). Directory-tier lead; a platform sweep of its mosque pages is the next step.

---

## Ethiopia

| Surface | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| EIASC official site | ethiopianmajlis.org.et | authority | news-only; latest posts 2022-2023; no prayer tables | — |

**Retry verdict:** negative reconfirmed. The council's site is news-only (fetch + search); the census's adhan-js panel read on the Addis council site stands. Ethiopia stays FALLBACK.

---

## Tanzania

| Surface | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| BAKWATA | bakwata.or.tz (fetch: empty content); uchaguzi.bakwata.org (election forms only) | authority | none | — |

**Retry verdict:** negative reconfirmed — BAKWATA's site serves nothing (empty fetch), the subdomain carries election forms, no prayer tables in Kiswahili queries ("ngazi za sala", "muda wa kuswali"). Tanzania stays FALLBACK per the census.

---

## Uganda

| Surface | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| Jamiat Kampala / Uganda Muslim bodies | — | — | no owned table surfaced | — |
| Sayyidina Abubakar Mosque, Kampala — mawaqit | mawaqit.net/en/sayyidna-abubakar-mosque-12-york-terrace-12345-kampala-uganda | platform | today block visible in search | — |

**Verdict:** honest negative for an owned table (English + Kiswahili queries; aggregators only). The mawaqit Kampala mosque matches the census's "Jamiat carries a Kampala outrider" read — platform layer only.

---

## Niger (BUTIN freshness check)

**Performed:** the perpetual-calendar page as served TODAY (`captures/niger-butin-calendrier-perpetuel.html`, fetched 2026-11-10) still carries the literal constants (`fajr angle = 18`, `isha = maghrib + 75 min`, 0.833 horizon, Shafi shadow factor) with no year branch, and the eight-region city table (Niamey lat 13.85 lon 2.1833, GMT+1, qibla 72°08') unchanged.

**Result:** re-deriving November 2026 Niamey from the served code reproduces the census bank (`census/c34-niger/data/ne_niamey_2026.raw.json`) 30/30 days, ZERO mismatches. The portal is unchanged and frozen. Freshness check PASSES — grade A stands.

---

*(final line summary follows)*
