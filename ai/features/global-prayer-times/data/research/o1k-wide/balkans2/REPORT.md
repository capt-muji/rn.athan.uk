# O1k wide-research — balkans2 (Serbia, Montenegro, North Macedonia, Croatia, Romania, Bulgaria, Greece, Bosnia 2027, Kosovo 2027, Slovenia 2027)

Workspace `$HOME/athan-gitree/census/o1k-wide/balkans2/`. Raw responses in `captures/`,
normalized dated rows in `data/`. Read-only against the census record
(`world-table-v2.md` rows read at session start). Standing rules of `../BRIEF.md` obeyed:
public pages only, local-language search, TinyFish first then curl with a browser UA,
community surfaces recorded as community.

## Bosnia and Herzegovina — 2027 accrual + a full-year second witness

| Source | URL | Class | Dated data | Years | Machine-readable |
| --- | --- | --- | --- | --- | --- |
| Rijaset Takvim 2026 (printed) | `https://www.islamskazajednica.ba/images/download/takvim_2026.pdf` | official (islamskazajednica.ba, the Rijaset's own host) | full civil year, Sarajevo, 6 prayers + kibla-sat, 12 monthly pages | 2026 | PDF text layer, parsed |
| vaktija.ba API (the same API the Rijaset homepage embeds) | `https://api.vaktija.ba/vaktija/v1/77/2026/{m}` (77 = Sarajevo) | community mirror, "Zvanična"-branded | 12 monthly responses captured | 2026 echo | JSON |
| vaktija.ba API 2027-01 probe | `https://api.vaktija.ba/vaktija/v1/77/2027/1` | computed echo, NOT a publication | 31 days | 2027 (computed) | JSON |
| Rijaset Takvim 2027 | `…/takvim_2027.pdf` | — | 404 today (2026-11-10); `takvim_2026.pdf` is 200, 12 pp, 1,476,042 bytes | — | — |

New facts:

1. **365/365-day cross-check, 0 diffs.** The printed Takvim 2026 (Sarajevo monthly tables,
   compressed alternating-hour layout) parses to 365 complete dated rows
   (`data/ba_takvim2026_sarajevo.json`, parser `parse_takvim.py` in this workspace) and
   matches the API's 2026 echoes exactly, all six prayers, all 365 days. The census held a
   30/30-day API check; the full year is now witnessed by the Rijaset's own printed PDF on
   the Rijaset's own host.
2. **The frozen-generation signature confirmed live on 2027.** The API's computed 2027-01
   echo for Sarajevo day 1 is `5:37 7:15 11:51 14:01 16:25 17:52` — byte-identical to the
   printed Takvim's 2026-01-01 row, exactly as the C37 precedent predicts for a
   server-computed relabel. The echo is saved as
   `captures/ba_vaktijaba_api_77_2027-01_echo.json` and deliberately NOT in `data/`: it is
   not a publication. The honest 2027-01 monthly capture lands in January 2027; the 2027
   Takvim PDF (404 today, last year's landed 14 January) is the second watchpoint.
3. Location id note: the API's Sarajevo is id 77 (the census's "zone 77" confirmed
   against `lokacija`; id 78 returns Skender-Vakuf).

Fits: none needed — the 18/16 recipe record is untouched and reconfirmed; rounding stays
unanswered by the PDF (all rows are whole minutes).

## Slovenia — 2027 check: negative for now

| Source | URL | Class | Dated data | Years |
| --- | --- | --- | --- | --- |
| ISSI feed | `https://www.vaktija.si/api/v2/feed` | authority (ISSI) | 365-day calendar, 2026-01-20..2026-12-31 (capture `captures/si_feed_2026-11-10.json`, serverTime 2026-11-10) | 2026 only |
| `Vaktije_2027.pdf` probe | `https://www.vaktija.si/Vaktije_2027.pdf` | — | 404 (so is `/Vaktije_2026.pdf` at that exact path; the 2026 edition PDF lives elsewhere on the site) | — |

Verdict: vaktija.si does NOT serve a 2027 edition yet (2026-11-10). The 2025-identical-to-2026
frozen-edition question stays open; a 2027 read is the deciding witness. Re-check December 2026 /
January 2027 (the 2026 PDF historically appears around the year turn).

## Kosovo — 2027 edition check: negative for now

| Source | URL | Class | Dated data | Years |
| --- | --- | --- | --- | --- |
| dituriaislame.com WP media API, `search=takvim` | `https://dituriaislame.com/wp-json/wp/v2/media?search=takvim&per_page=100` | BIK-affiliated publisher (Dituria Islame is the BIK magazine; the takvim PDFs the census used live here) | 7 items enumerated; latest = `takvimi2026shkrime.pdf` (uploaded 2026-01-14) + `takvimi2026vaktet.pdf` (2026-01-14) | 2023, 2024, 2026 (+2025 not in media API) |
| direct 2027 path probes | `uploads/2027/01/takvimi2027vaktet.pdf`, `uploads/2026/12/takvimi2027vaktet.pdf` | — | both 404 | — |

Verdict: NO 2027 BIK takvim exists yet (2026-11-10). Last year's edition landed 2026-01-14, so the
watch window is late December 2026. Capture `captures/xk_dituria_media_takvim.json`.

## Serbia — clean offset re-read done; 2026 base negative; NEW rijaset.rs widget

| Source | URL | Class | Dated data | Years | Machine-readable |
| --- | --- | --- | --- | --- | --- |
| Mešihat Devridaim page (raw HTML re-read) | `https://mesihat.org/devridaim-2/` | community (Mešihat IZ u Srbiji) | full year 2025/1446, Novi Pazar base, 12 monthly tables + offset table | 2025 | yes |
| Rijaset IZ Srbije homepage | `https://rijaset.rs/` | authority publisher, platform-computed values | Belgrade daily (today only), 6 prayers | rolling | iframe, no table |
| IslamicFinder prayer widget (embedded by rijaset.rs) | `https://www.islamicfinder.org/prayer-widget/792680/shafi/1/0/18.0/17.0` | community platform | Belgrade daily | rolling | iframe params |

Findings:

1. **The "lost two columns" defect is RESOLVED as a misreading.** The raw HTML
   (`captures/rs_mesihat_devridaim2_raw.html`, saved this pass) shows the offset table is
   exactly 4 header cells with no colspan: `Grad/Mešihat | Zora/ Izl. Sunca | Podne | Ikindija
   Z. Sunca Jacija` and 3 numeric offsets per city. The publication groups six prayers into
   three offsets: (fajr, sunrise), dhuhr, (asr, maghrib, isha). The census encoding
   (+2/+2/0/-2/-2/-2 for Belgrade) already matches those groups; the table is complete as
   published. All 11 city rows re-read cleanly from raw HTML.
2. **2026 Novi Pazar base: honest negative.** mesihat.org's search API
   (`wp-json/wp/v2/search`) returns exactly one Devridaim page (75699, "Devridaim 2025.");
   the media library (`search=devridaim|vaktija|namaza|takvim|vrijeme`) holds only 2018
   `Devridaim-podaci-jan-dec.pdf` and 2017/2016/2015 JPGs — no 2026 edition exists on the
   site. Web search (Serbian) surfaces no other host for it. The "one edition" record stands.
3. **NEW surface: rijaset.rs now carries a Belgrade vaktija.** The census said rijaset.rs
   publishes no prayer table; it now embeds an IslamicFinder prayer-widget iframe for
   Belgrade (city 792680), shafi asr, stated angles 18.0/17.0, today-only, no monthly or
   yearly path on the site (capture `captures/rs_rijaset_home_2026-11-10.html`). This is an
   authority-tier PUBLISHER carrying platform-COMPUTED numbers — a distinct reading from the
   Devridaim base (community), and a generic 18/17 rather than Fazilet Profile B. Worth a fit
   against Belgrade if the widget's monthly page (islamicfinder.org) is ever wanted; today it
   is one day.

## Montenegro — day-counted national capture (6 city-groups × 365 days)

| Source | URL | Class | Dated data | Years | Machine-readable |
| --- | --- | --- | --- | --- | --- |
| vaktija.me yearly PDF generator (Medžlis IZ Bijelo Polje, an organ of the Islamska Zajednica) | `https://vaktija.me/vaktija/data/pdf/generate/generatePDFYearly.php?&city=<offset>&cityName=<name>` | community (medzlis of the Islamic Community of Montenegro), 21 Montenegrin cities | full civil year × 6 offset groups, Podgorica = group -1 | 2026 (server's current year; generator takes no year param) | PDF, parsed |
| vaktija.me interactive table | `https://vaktija.me/vaktija/` + POST `/vaktija/php/search.php` | same publisher | today only | rolling | HTML |

Findings (the day-counted capture the lift asked for):

1. **Podgorica anchor, 365/365 days** (`data/me_grp-1_vaktijame_2026.json`, PDF
   `captures/me_vaktijame_yearly_grp-1.pdf`). The generator's group value equals the site's
   own Podgorica table to the minute (Nov 1: 04:35 06:11 11:27 14:09 16:39 18:06, both
   surfaces). The generator takes a MINUTE-OFFSET GROUP, not a city id: the JS
   (`captures/me_vaktijame_generate.js`) maps 21 cities onto 6 groups — Bijelo Polje = base
   0, Podgorica/Bar/Kolašin/Ulcinj/Danilovgrad/Šavnik/Pljevlja/Žabljak/Sutomore = -1,
   Andrijevica/Berane/Plav = -3, Rožaje = -5, Plužine/Nikšić/Kotor/Tivat/Cetinje/Budva = +2,
   Herceg Novi = +4. All six groups captured full-year (`data/me_grp{0,-3,-1,-5,2,4}_*.json`),
   so the whole national table is now day-counted, not just Podgorica.
2. **The community contradiction quantified on Nov 1**: vaktija.me Podgorica 04:35 06:11
   11:27 14:09 16:39 18:06 vs monteislam 04:34 06:08 11:28 14:12 16:44 18:11 — isha 5 min
   apart, the census's 5-6 min contradiction stands.
3. **DST shape is a fit question, not a settled fact.** The PDF series shows NO 60-minute
   jump at the 2026 DST edges (Mar 28→29, Oct 24→25 all drift ±1-2 min), and its summer rows
   sit between the CET and CEST astronomical values (Jun 21 sunrise 04:53 vs 04:11 CET /
   05:11 CEST). November (standard time) matches true local times exactly (dhuhr 11:27 =
   true solar noon at 19.26E). The 365-day series now available lets the census's
   19.25-19.4/17.75-17.85 band be tested across all seasons, which is exactly what the
   "day-counted fit" lift wanted.
4. Note: passing a raw city id (e.g. `city=14`) to the generator yields base+14 minutes —
   the first Podgorica attempt in `captures/` was discarded once the JS mapping was read.

## Croatia — one city-year banked (Pula), Zagreb month, Rijeka year PDF blocked

| Source | URL | Class | Dated data | Years | Machine-readable |
| --- | --- | --- | --- | --- | --- |
| Medžlis IZ Pula monthly vaktija PDFs | `https://medzlis.org/wp-content/uploads/2026/…/vaktija-<mjesec>-2026.pdf` (WP media API `search=VAKTIJA`, 126 items) | community (medzlis of the Islamska zajednica u Republici Hrvatskoj; header "ISLAMSKA ZAJEDNICA U REPUBLICI HRVATSKOJ / MEDŽLIS PULA / VAKTIJA ZA PULU") | 2026: Jan, Feb, Jun, Jul, Aug, Sep, Oct, Nov = **242 dated rows** (`data/hr_pula_medzlis_2026.json`); Ramadan PDF = imsak-based (skipped); Mar 20-31 and May missing (no PDF for May, only a JPG) | 2022-2026 monthly back-catalogue exists | PDF text layer, parsed |
| vaktija.eu Zagreb (embedded by the official branch site) | `https://vaktija.eu/bs/zagreb` — the Mešihat's site islamska-zajednica.hr loads it as an iframe (`src="https://vaktija.eu/bs/zagreb"`) | community platform; the authority publishes NO local table | Nov 2026, 30 rows (`data/hr_zagreb_vaktijaeu_2026-11.json`) | current month only (`?mjesec=` ignored) | HTML table, parsed |
| Rijeka full-year PDF | `https://medzlis-rijeka.hr/sites/322/upload/userfiles/1770616984_vaktije_2026.pdf` | community (Medžlis Rijeka) | exists ("VAKTIJA 1./2026", monthly rows visible in the search snippet) but Cloudflare "Just a moment..." on scripted read | 2026 | blocked |

Findings:

1. **The lift "capture and fit one Croatian city-year" is banked for Pula**: 242 dated rows
   across 8 months of 2026, every prayer, day-counted. This is the first Croatian city-year
   on the record (the census had interval-cluster measurement only).
2. **The Croatian authority adds nothing local**: the Mešihat's official site embeds
   vaktija.eu's Zagreb widget (iframe in `captures/hr_iz_home.html`) — the census's
   "platform-fed, no authority table" reading is CONFIRMED at the publisher level.
3. Pula's rows are geographically its own (Jan 1: 05:52/07:40/12:11 — true for 44.87N,
   13.85E), unlike Montenegro's offset-group construction. The 80-85 min isha-interval
   cluster claim is now testable on 242 dated rows.
4. Wayback coverage of `vaktija.eu/bs/zagreb` is 4 usable snapshots over 2024-2026
   (`captures/hr_wayback_cdx_zagreb2.json`) — enough for spot checks, not a year.

## Romania — retry (Romanian + Hungarian)

| Source | URL | Class | Dated data |
| --- | --- | --- | --- |
| (this pass) | searches below | — | — |

Retry result (searched in Romanian and Hungarian; the muftiate's own domain checked):

1. **muftiyat.ro is a PARKED DOMAIN** ("Contact the domain owner here", car-insurance ads —
   TinyFish + curl both). The Romanian Muftiate's web presence is Facebook only
   (`facebook.com/Muftiatul`), which publishes no dated timetable in the crawled items. The
   C6 negative stands, now with the sharper cause: the authority has no live site.
2. **NEW surface, class client-side calculator: imamali.ro/monthlyRo.htm** (Fundația Imam
   Ali, Bucharest). A monthly timetable page for 10 Romanian cities (Bucharest, Constanța,
   Cluj-Napoca, Timișoara, Iași, Brașov, Craiova, Ploiești, Galați) whose table is
   COMPUTED IN THE BROWSER by bundled PrayTimes.js, with a method dropdown (Jafari default,
   MWL, ISNA, Egypt, Makkah, Karachi) — capture `captures/ro_imamali_monthlyRo.html`. No
   rows are bankable from it (it is a calculator, the Danish FALLBACK class). Worth recording
   as the first Romania surface at all, and its default (Jafari/Tehran Institute of
   Geophysics) as the operator's stated convention.
3. Ar-Rahman Bucharest (musulman.ro) is on Mawaqit with jamaah offsets (Fajr +20, Dhuhr +10,
   Asr +10, Maghrib +5, Isha +10) — a congregation board, same class the census already
   assigns such boards; no independent athan table.

Verdict: still a NEGATIVE for any published dated table; two new non-bankable surfaces
recorded. Hungarian search surfaced only Hungary-side bodies (iszlam.com etc.), nothing for
Transylvania's mosques.

## Bulgaria — second city's own row from the Grand Muftiate

| Source | URL | Class | Dated data | Years | Machine-readable |
| --- | --- | --- | --- | --- | --- |
| Grand Muftiate namaz-times page, per town | `https://grandmufti.bg/bg/home/vremena-za-namaz.html?month=<1-12>&town=<slug>` | authority | full 2026 for SOFIA, PLOVDIV, VARNA — 365/365 days each (`data/bg_sofia_grandmufti_2026.json`, `bg_plovdiv_…`, `bg_varna_…`) | 2026 (form takes month; no year param — server's current year) | HTML tables, parsed |

Findings:

1. **Second-city rows EXIST and are now captured**: the town selector (52 towns) drives the
   table; Plovdiv and Varna each return their own 30-row month for every month of 2026.
   365/365 days per town banked.
2. **The census defect is CONFIRMED and sharpened**: inter-town deltas match pure longitude
   (noon: Sofia 12:15, Plovdiv 12:10, Varna 11:57 on Nov 1 = Δ5 and Δ18 min vs Δλ of 5.7 and
   18.3), while DAY LENGTH is byte-identical across the three towns on every sampled date
   (933 min Jun 21, 576 Jan 15, 636 Nov 1) — true day lengths at 42.7/42.1/43.2 N differ by
   minutes. So the generator is Sofia latitude + per-town longitude correction only. The
   captured triple now lets the census prove the defect instead of asserting it.
3. Sofia full-year 2026 banked (365 rows) — year-2 for `BG-SOFIA`, previously 92 days.

## Greece — Komotini full year, Thessaloniki mosques, Athens non-Ramadan

| Source | URL | Class | Dated data | Years | Machine-readable |
| --- | --- | --- | --- | --- | --- |
| Komotini Mufti's own site | `https://www.gumulcinemuftulugu.info/` | authority (the Muftiate of Komotini's own host) | today's imsak countdown widget ONLY; sitemap lists no vakit/imsakiye page; duyurular/aciklamalar carry no PDFs | rolling | HTML |
| namazvakti.com Gümülcine (Diyanet-lineage platform) | `https://www.namazvakti.com/Monthly.php?cityID=6072&selMonth=<1-12>` | community platform | full 2026, 365/365 days (`data/gr_komotini_namazvakti_2026.json`) — a second witness, NOT the muftiate's own table | 2026 | HTML, parsed |
| Athens state mosque (mosqueofathens.gov.gr, the state NPDD) | prayer-times page `…/ώρες-προσευχής-ημερήσιο-μηνιαίο-ετήσ/` + WP API page 271 | authority | Ramadan 2026 table as PNG (Feb 19-Mar 19, 29 rows, `data/gr_athensmosque_ramadan2026.json`, image `captures/gr_athensmosque_untitled_2026-02.png`); Eid al-Adha day times (May 27, 2026: 07:00/07:30/08:00/08:30); link to `ΡΑΜΑΖΑΝΙ2026.pdf` (returns the SPA HTML via curl, not the file) | Ramadan windows only | PNG transcribed |

Findings:

1. **Komotini: the day-counted muftiate year remains unreachable** — the muftiate's own site
   is a news site with a today-imsak widget, no imsakiye page (sitemap enumerated). What the
   census holds (its fit) still lacks a restated day count; the new 365-row Diyanet-platform
   year (namazvakti) is a DIFFERENT lineage's table, banked as a second witness for contrast,
   not as the muftiate's.
2. **Athens: still Ramadan-only, now verified at the source.** The menu literally promises
   "ΩΡΕΣ ΠΡΟΣΕΥΧΗΣ – ΗΜΕΡΗΣΙΟ, ΜΗΝΙΑΙΟ, ΕΤΗΣΙΟ" (daily, monthly, YEARLY), but the page's
   entire content is the Eid announcement and the Ramadan 2026 PNG. No non-Ramadan month
   exists yet. The 2026 Ramadan window is a SECOND season banked (29 rows): isha − maghrib
   spans 82, 83, 84 min across the window (the census's +82 constant will want those three
   values); the site was re-checked 2026-11-10 (page modified 2026-02-18).
3. Thessaloniki: Geni Tzami opens only for Eid/Ramadan occasions (Efsyn, Kathimerini,
   news247 2024-2025 items); no mosque publishes daily times — negative, consistent with the
   census.

## North Macedonia — IVZ one more pass: the site moved to bfi.mk; still no table

| Source | URL | Class | Dated data |
| --- | --- | --- | --- |
| IVZ/BFI official site (NEW location) | `https://bfi.mk/` ("Bashkësia Fetare Islame e Republikën së Maqedonisë së Veriut" = the IVZ's Albanian name) | authority | today-only widget: Sabahu 5:26 AM / Dreka 11:25 / Iqindia 1:57 / Akshami 4:26 / Jacia 5:36 (12-hour, Skopje, server-rendered, 2026-11-10) |
| ivz.mk | DNS NXDOMAIN — the old domain is DEAD | — | — |
| WP media library of bfi.mk | `search=takvim`, `search=vakti` | — | 0 items — no takvim PDF on the site |
| Scanned transcriptions | sq + tr searches ("takvim 2026 Shkup", "Makedonya imsakiye IVZ") | — | only Kosovo BIK's takvim (scribd) and Diyanet-lineage platforms surface; NO non-Fazilet transcription of an IVZ table exists on the open web |

Verdict: the census record stands — IVZ's own numbers remain print+app only. New facts: the
authority's live site is bfi.mk (ivz.mk dead), its widget is a 5-prayer 12-hour today view,
and its media library holds no takvim. The Play app ("Takvimi", `com.getcapacitor.myapp`,
Capacitor bundle, publisher IVZ, languages Shqip/Turkçe/MK/BS/EN) remains behind blocked APK
mirrors; no web mirror found.

## Montenegro — IZCG portal declares its own recipe; rival table day-counted

New fact, in the IZCG portal's own words (monteislam.com/vaktija footer, capture
`captures/me_monteislam_vaktija.html`, 2026-11-10):

> "Vremena se računaju za Podgorica (**19.5° za zoru, 17.5° za jaciju, standardna ikindija**),
> a ostala mjesta se pomjeraju za utvrđen broj minuta — isto kako je objavljeno u zvaničnom
> takvimu. … za konačnu potvrdu mjerodavan je takvim Islamske zajednice u Crnoj Gori."

That is the IZCG-aligned portal DECLARING the official takvim's parameters: fajr 19.5°,
isha 17.5°, standard (Shafi) asr, other towns = fixed minute shifts. The census's fitted band
(19.25-19.4 / 17.75-17.85) sits just inside 19.5/17.5 — the declaration and the fit now
corroborate each other, and the declaration names the mechanism (per-city minute shifts off a
Podgorica anchor) that the census inferred.

Combined with the day-counted capture above (`data/me_grp-1_vaktijame_2026.json`, Podgorica
365 days, plus five more city-groups), the Montenegro record goes from "band, not point; day
count unstated" to: declared 19.5/17.5 + fitted 19.25-19.4/17.75-17.85 + 365-day test series
+ the 5-6 min community contradiction quantified on 2026-11-01.
