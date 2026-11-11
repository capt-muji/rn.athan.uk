# REPORT — tag horneast2 (2026-11-10)

Scope: Ethiopia retry, Somalia/Somaliland, Djibouti enumeration, Eritrea, Kenya mosque layer, Tanzania + Zanzibar, Uganda Jamiat outrider, Rwanda/Burundi/Mozambique/Madagascar passes.

## Somalia / Somaliland

The census record (FALLBACK, ministry domains unresolvable) is superseded: FIVE mawaqit-hosted mosques exist, all with full 366-entry year calendars embedded in their public pages.

| Source | URL | Tier | Dated data | Years |
| --- | --- | --- | --- | --- |
| Masjid Ina Weerar, Hargeisa | mawaqit.net/en/masjid-ina-weerar-hargeisa-00000-somalia | platform/community | 366-entry calendar (fajr/sunrise/dhuhr/asr/maghrib/isha) + live athan/iqama | perpetual day-of-year table |
| Masjid Marwa, Hargeisa | mawaqit.net/en/masjid-marwa-hargeisa-00000-somalia | platform/community | same, 366 entries | same |
| Masjid Nuurul Huda, Hargeisa | mawaqit.net/en/masjid-nuur-al-huda-hargeisa-252-somalia | platform/community | same, 366 entries | same |
| Masjidka Cali Jimcaale, Waaberi, Mogadishu | mawaqit.net/en/masjidka-cali-jimcaale-waaberi-mogadishu-00000-somalia | platform/community | same, 366 entries | same |
| Masjid Rabbul Caalamiin, Mogadishu | mawaqit.net/en/rabbul-caalamiin-mogadishu-252-somalia | platform/community | same, 366 entries | same |

- CONFIRMS: nothing on the prior record (prior record had no surface); the Somali-language retry ("waqtiga salaada Hargeysa", "waqtiga salaada Muqdisho 2026") surfaced the mawaqit pages directly in results.
- NEW: the five mosques above, Hargeisa and Mogadishu; 5 × 366 = 1,830 normalized rows in `data/`.
- The Somaliland ministry (Wasaaradda Diinta iyo Awqaafta) publishes Eid and Ramadan announcements via Facebook video posts, no timetable page; its old domain remains unresolvable. Facebook posts are not dated tables; no capture.
- The platform's own country index claims "SOMALIA 8" mosques; public search saturates at the five above (three unindexed or diaspora). Honest cap recorded.
- Fit candidate: any one mosque-year (Hargeisa ≈ Mogadishu deltas ~ -20 min; the three Hargeisa tables differ by <=2 min across the year; Marwa == Nuurul Huda day-1 identical).

## Djibouti

Enumeration as far as public pages allow: SIX mawaqit mosques, all six captured fresh this pass, each with a 366-entry calendar.

| # | Mosque | Slug code | Rows |
| --- | --- | --- | --- |
| 1 | Masjid Djaffar Gabode 4 | (none) | 366 |
| 2 | Msjd Abd ar-Rahman bin Awf (Balballa) | (none) | 366 |
| 3 | Masjid al-Salam FYART | 77101 | 366 |
| 4 | Mosquee Tayib Nagad | 77101 | 366 |
| 5 | Mosquee Nashr Aldine | 71100 | 366 |
| 6 | Mosquee Ihsaan | 9999 | 366 |

- CONFIRMS: the census's six mosques and platform/community tier; November values on the fresh captures match the recorded verification (e.g. Djaffar Gabode Fajr 4:48, Maghrib 5:41 pattern).
- NEW: none beyond the six — the platform index claims "DJIBOUTI 12" but the other six are not publicly indexable; mosquee-proche mirror lists exactly two (Djaffar Gabode 4 id 2078, Abdrrahman id 2079). City-code search for other codes (71100/77101/9999 variants) yields only these.
- Djibouti ministry of habous: no official site surfaced (French search returns Morocco's habous.gov.ma). Negative.
- Day-1 comparison: all six tables within 1 min of each other; Tayib Nagad Fajr -1 min vs the rest; Abd ar-Rahman iqama offsets visible (+20/+6/+25).

## Ethiopia

- CONFIRMS: the census record stands. The Addis Ababa City Islamic Affairs Supreme Council site (addisababamajlis.org.et) is a Vue SPA; its Home chunk bundles adhan-js with MuslimWorldLeague (18/17), Shafi madhab, rounding Nearest, and per-site settings overrides (`prayer_method`, `prayer_madhab`, `prayer_offsets`) — the engine evidence the census already records. Today-only panel; no dated table anywhere in the chunk graph (50 chunks enumerated, none carries a calendar).
- Amharic retry: the site carries an `am` locale flag (bundle evidence); Amharic search surfaces only Facebook/YouTube/ENA news, no timetable page.
- Oromo (Afaan Oromoo) retry: no council surface at all; only news (BBC Afaan Oromoo, qbo-abo-wbo.org scholarship council).
- EIASC (ethiopianmajlis.org.et): homepage re-fetched, still news-only (posts list 2022-2023, no prayer section).
- Harar and Dire Dawa community tables: NEGATIVE — every result is a third-party computed app (tawkit, quranmajeed, muslimpro, islamone, sajda, bigo.tv, duakitapligi, islamicfinder, matwproject). No Harar or Dire Dawa community body surface found in Amharic or English searches.

## Kenya

| Source | URL | Tier | Dated data | Years |
| --- | --- | --- | --- | --- |
| Jamia Mosque Nairobi | jamiamosque.co.ke/home/ + /islamic-calendar/ | community (committee) | Muslim Pro widget (cityid 184745) only; Islamic Calendar page = Hijri occasions 2026-2027, not prayer times | none owned |
| UMMA University Masjid, Kajiado | mawaqit.net/en/m/umma-masjid-kajiado-331-kenya | platform/community | 366-entry calendar | perpetual |
| Masjid Hudaa, Mombasa | mawaqit.net/en/masjid-hudaa-mombasa-80100-kenya | platform/community | 366-entry calendar | perpetual |
| Memon Villa Masjid, Mombasa | mawaqit.net/en/m/memon-villa-masjid-mombasa-80100-kenya | platform/community | 366-entry calendar | perpetual |

- CONFIRMS: the census record — Jamia's year-round block is the Muslim Pro widget, nothing owned beyond it; the Ramadhan Timetable menu item is the KMD PDF already on record.
- NEW: the Kenya MOSQUE LAYER the census's lift called for — three mawaqit mosques (Kajiado + two Mombasa), 3 x 366 = 1,098 rows in `data/`. The Mombasa pair answers the "Mombasa mosques' own dated months" ask in platform form.
- Defect noted: UMMA University's calendar dhuhr sits ~+67 min against its own sunrise/sunset (jamaat-lean mosque-set table); Hudaa and Memon Villa agree with each other to the minute (identical day-1 rows).
- Nairobi/Mombasa mosques' own HTML monthly pages outside mawaqit: NEGATIVE (Swahili "nyakati za sala/za swala" and English sweeps return only aggregators and diaspora mosques).

## Tanzania (+ Zanzibar)

| Source | URL | Tier | Dated data | Years |
| --- | --- | --- | --- | --- |
| Masjid Fatma Ali, Dar es Salaam | mawaqit.net/en/m/masjid-fatma-ali-dar-es-salaam-6986-tanzania | platform/community | 366-entry calendar (dhuhr fixed 12:45 = jamaat-lean) | perpetual |
| Masjid Kisota, Mji Mwema, Dar es Salaam | mawaqit.net/en/m/masjid-kisota-mji-mwema-dar-es-salaam-17106-tanzania | platform/community | 366-entry calendar | perpetual |
| Masjid Quba, Dar es Salaam | mawaqit.net/en/m/quba-mosque-dar-es-salaam-14113-tanzania | platform/community | 366-entry calendar | perpetual |

- NEW: three Dar es Salaam Sunni mosque-year tables — the census held only the Shia KSIJ PNG (out of scope) and the Jamiat generator's 11 towns for Tanzania. 3 x 366 = 1,098 rows in `data/`.
- Kisota vs Quba agree within 1 min all day-1; Fatma Ali dhuhr +18 min vs the pair (mosque-set jamaat time).
- CONFIRMS: BAKWATA negative stands (Swahili sweep returns only aggregators: tawkit, namazvakti, true-time, islamicfinder).
- Zanzibar: NEGATIVE. The Zanzibar Waqf and Trust Commission has no online timetable (only legal/estate references); the Office of the Mufti (Ofisi ya Mufti Mkuu) communicates via Facebook/press and publishes no prayer-time page; "nyakati za sala Zanzibar 2026" returns aggregators only.

## Uganda

| Source | URL | Tier | Dated data | Years |
| --- | --- | --- | --- | --- |
| Jamiatul Ulama KZN generator, Kampala row | jamiat.org.za/salaah-times.php?ref=pst&id=4c237601584ccaab99669eb323a577c533c231b6 + starlite CSV export | community | FULL YEAR: 365 rows, 13 columns (suhoor ends, fajr, sunrise, ishraaq, dhuha, zawaal, zuhr, both Asr, maghrib, both Isha), incl. the phantom 29-Feb row (deleted client-side, C15 artifact) | perpetual (year dropdown relabels, C15 finding) |
| Sayyidina Abubakar Mosque, 12 York Terrace, Kampala | mawaqit.net/en/m/sayyidna-abubakar-mosque-12-york-terrace-12345-kampala-uganda | platform/community | 366-entry calendar | perpetual |

- NEW: the Kampala outrider CAPTURED AS A YEAR — the census held a 30-day C15 sample; the CSV export serves the full 365-row perpetual year (saved `data/uganda-kampala-jamiat-kzn-generator-year.json`). Nov 1: fajr 05:19, zuhr 12:38, maghrib 18:39 — consistent with the archive.
- NEW: Sayyidina Abubakar Kampala mawaqit mosque, 366 rows.
- Kiyindi masjid (Kampala, mawaqit): OFFLINE — page serves the generic shell, no calendar payload; recorded unreachable.
- Luganda sweep: NEGATIVE (music/Facebook only, no Ugandan-owned timetable surface).
- SECOND WITNESS: salaahtimes.co.za/kampala serves a dated November 2026 month (30 rows) whose values match the Jamiat KZN generator to the minute (Nov 1: 05:19/12:38/18:39) — same source family, served with real dates; range 2025-10 through 2027-12.

## Rwanda

- NEGATIVE, one honest pass (English + shared Kinyarwanda/Swahili "swala"): every result is a third-party computed app (muslimpro, islamicfinder, muslimandquran, bigo.tv, hamariweb, prayertimes.date, prayertim.es). salaahtimes.co.za carries no Kigali row (404). No mosque, council or publisher surface exists publicly. Census FALLBACK stands.

## Burundi

- NEGATIVE, one honest pass (French + Kirundi context): Mosquee Centrale de Bujumbura appears only in a travel blog, no timetable; every prayer-time result is an aggregator (aladhan, muslimpro, prayertimes.date, matwprojectca, bigo.tv). salaahtimes.co.za carries no Bujumbura row (404). Census FALLBACK stands.

## Mozambique

| Source | URL | Tier | Dated data | Years |
| --- | --- | --- | --- | --- |
| Masjid Fátima, Nampula | mawaqit.net/en/m/masjid-fatimah-rua-monomotapa-3100-nampula-mozambique | platform/community | 366-entry calendar | perpetual |
| Salaah Times, Maputo | salaahtimes.co.za/maputo (month view) | community (SA-published regional service) | dated month table, 13 columns (sehri ends, fajr, sunrise, ishraaq, chasht, zawal, zuhr, both Asr, sunset, maghrib, esha); range 2025-10 to 2027-12 | 2025-2027 |

- NEW: Nampula mawaqit mosque-year (366 rows) — the census held only "2 Jamiat towns + single-day mawaqit leads"; this is a full-year mawaqit mosque. NEW: Maputo dated month (30 rows, Nov 2026).
- Portuguese pass: otherwise aggregators only (namazvakti, dateandtime, true-time, nascerepordosol) plus an Instagram iqama notice (Mesquita Abu Baker Assadik) — community notices, not tables.
- Fit candidate: Nampula mosque-year.

## Madagascar

| Source | URL | Tier | Dated data | Years |
| --- | --- | --- | --- | --- |
| Masjidbox "Islam Da'wa Malagasy", Antananarivo | masjidbox.com/prayer-times/salama | community (masjid page on platform) | TODAY-ONLY confirmed: markup carries only a 2026-11-10..16 window, times JS-rendered | none |
| Salaah Times, Mahajanga | salaahtimes.co.za/mahajanga (month view) | community | dated month table, same 13 columns; range 2025-10 to 2027-12 | 2025-2027 |

- CONFIRMS: the census's "one Masjidbox mosque, today-only" (page re-captured raw, `madagascar-masjidbox-salama-antananarivo.html`).
- NEW: Mahajanga dated month (30 rows, Nov 2026) — first DATED rows for Madagascar on the record; the census held only the lat/lon 0.0 defect note. November values internally consistent (sunrise 05:18 / sunset 17:55, zawaal ~11:38 => lon ~46E, UTC+3 plausible); the 0.0-coordinate defect remains unverified from the page (no coordinates served).
- Malagasy-language pass: no Malagasy-owned timetable surface exists; masjidbox + salaahtimes are the only hosted surfaces.

## Eritrea

- NEGATIVE reconfirmed, Tigrinya + Arabic pass: "ሰዓታት ጸሎት" surfaces only Orthodox Tewahdo liturgical-hour pages (eritreantewahdo.org — church prayer hours, out of scope); Arabic "مواقيت الصلاة" surfaces only aggregators (islamicfinder, masjidi.app, rojat, athantime, salatcalendar). No Muslim-body or mosque-owned surface. Census FALLBACK stands.

## Djibouti enumeration count

SIX mosques enumerated and captured on public pages (the platform's country index claims 12; the unindexed half is beyond public pages). Mirror (mosquee-proche) lists exactly 2 of the 6. All six fresh captures parsed: 6 × 366 = 2,196 rows in `data/`.


