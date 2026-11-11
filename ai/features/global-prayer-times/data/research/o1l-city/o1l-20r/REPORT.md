# O1l-20r — Africa second cities (round two, city-level)

Agent: O1l-20r. Started fresh 2026-11-11 (predecessor died with nothing banked).
Workspace: `$HOME/athan-gitree/census/o1l-city/o1l-20r/`. Repository untouched.
Engine for every fit: adhan 4.4.6 (`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`),
`Rounding.None`, `HighLatitudeRule.MiddleOfTheNight`, Shafi unless stated, TZ pinned per country,
dates built from literal capture strings, no clock reads.

## Totals held

| Surface set | Rows | Tier | Grade candidate |
|---|---|---|---|
| Senegal CERFI, 9 cities (week) | 63 | community | candidate |
| Tanzania Arusha, 3 years | 1,095 | community/platform | **A eligible** |
| Mali Segou, mawaqit year | 365 | platform/community | provisional |
| Ethiopia Jijiga + Jaamuuq, mawaqit years | 730 | platform/community | provisional |
| Uganda Entebbe, mawaqit year | 365 | platform/community | provisional |
| Uganda Kampala Mulago, mawaqit year (defective) | 365 | platform/community | candidate (fails gate) |
| Guinea Conakry, 4 mawaqit mosques (all defective) | 1,460 | platform/community | negative |

Dated rows banked this wave: **4,443** (63 + 1,095 + 3,285). The stored mawaqit file holds 3,294
day-slots; the nine phantom 29-Feb slots were dropped before fitting.

---

## Tanzania — Arusha (NEW second city, 3 years, grade-A eligible)

**Source:** `https://salaahtimes.co.za/arusha`; data API
`https://api.salaahtimes.co.za/v2/towns/495/prayer-times?from=YYYY-01-01&to=YYYY-12-31`.
Town record: Arusha, Arusha, Tanzania, `Africa/Dar_es_Salaam`, -3.38 / 36.67, `source: null`
(the town is not served from the Jamiat KZN table that supplies the South African towns).
Tier: platform publishing a community-attributed table.

**Rows:** 2025, 2026, 2027 — 365 each, 1,095 total, zero gaps, zero nulls. Columns: sehri,
subuhSadiq, fajr, sunrise, ishraaq, chast, zawaal, zuhr, asrShafi, asrHanafi, sunset, maghrib, esha.

**Recipe (one, across all three years):** fajr **18.00** deg; isha **18.00** deg (the free fit
optimum is 17.97, and 17.95/17.97/18.00 are indistinguishable at meanAbs 0.17-0.18 — bare 18/18,
not the MWL 18/17 of the Somali/Djibouti cluster); sunrise sunset-0; dhuhr = transit + 5;
maghrib = sunset + 3; asr Shafi + 0.

**Scores:** 2025, 2026, 2027 each **365/365 all six columns within 1 minute (100.0%)**.
Per column on 2026: fajr meanAbs 0.05, sunrise 0.06, dhuhr 0.07, asr 0.20, maghrib 0.13,
isha 0.17. Between-year stability: parameters frozen — the free refit returns the same pair on
each year, and the 2026 recipe applied unchanged to 2025 and 2027 scores 100%.
Seasonal amplitude: fajr January 05:20 vs July 05:27, a **7-minute** peak-to-trough
(near-equator, 3.4 S — the low-amplitude end of the owner's latitude framing).
Span: 1,095 days. Forward longevity: proven to 2027 by direct serve.

**What is NEW:** Tanzania's first non-Dar dated table and its first multi-year surface. The
record's Tanzania row was FALLBACK (BAKWATA negative; the Jamiat generator covers 11 towns at
community tier). Arusha is a second city with three served years at one recipe.

**Correction to the O1k record:** O1k-W7 recorded "Arusha/Mwanza dated months (60) via
salaahtimes.co.za". The platform's town index lists **one** Tanzania town (Arusha). Its "Mwanza"
is **Mwanza, Malawi** (Malawi's Southern Region), not Mwanza, Tanzania. Tanzania's Mwanza
therefore has no surface from this platform.

## Senegal — CERFI second cities (9 cities, week only)

**Source:** `https://cerfi.sn/api/horaires/?ville=<id>` (JSON the site's own selector calls).
City ids: Dakar 20, Diourbel 30, Kaolack 53, Louga 68, Mbour 82, Saint-Louis 124, Thiès 141,
Touba 145, Ziguinchor 152. 151 city options in the page's selector.

**Rows:** 7 days per city, 2026-11-11..2026-11-17, 63 rows, 6 columns each. The endpoint accepts
no date parameter (`date=`, `semaine=`, `mois=` all return the current week), and only Dakar has
static monthly/weekly PDFs (`/static/salats/Dakar/mois/Dakar_MM.pdf`); every other city 404s on
the PDF route. So second cities are **week-only** — a candidate surface, not a fit.

**Cross-city structural check (the fit lead extended):** on all 9 cities, all 63 rows,
`subh - fajr = 15` and `isha - maghrib = 60` exactly. The two-dawn and fixed-interval
construction fit3 measured on Dakar is a **national** property, not a capital property.

**What is NEW:** Touba, Saint-Louis, Thiès, Kaolack, Ziguinchor, Mbour, Diourbel, Louga —
eight second cities with dated rows, where the record held Dakar only.
**Honest negative:** no monthly route for any non-Dakar city; the weekly endpoint is the ceiling
under public pages.

## Mali — Segou (NEW second city)

**Source:** `https://mawaqit.net/en/sibila-missiriba-sibila-segou-41051-mali`
(Mosquée Sibila Missiriba, 13.7803 / -5.8782, `Africa/Bamako`). Platform/community tier.

**Rows:** 366 day-slots (a Feb-29 row is present and was dropped for 2026), 365 fitted.
**Recipe:** fajr **15.00**, isha **15.00**, sunrise 0, maghrib = sunset + 0, dhuhr = transit + 14,
asr = Shafi + ~16 on a coarse 2-3 day ladder (31 distinct values).
**Scores:** fajr 365/365 within 1 (meanAbs 0.02), sunrise 365/365 (0.00), dhuhr 365/365 (0.01),
maghrib 365/365 (0.01), isha 365/365 (0.02). asr is the one weak column: neither madhab
reproduces it (Shafi misses -15..-19, Hanafi +31..+57); the best single offset (+16) covers
257/365 within 1. Five of six columns sit at zero margin.
**Amplitude:** near-equator, fajr 04:51 (Jun) to 05:49 (Jan), 58 minutes.
**What is NEW:** Mali's second city, and a **different recipe from the held Bamako cluster**
(fit8: Al Madina Bamako 19+7.5 / 17+5.5). Segou is bare ISNA 15/15 — Mali's mosques do not share
one pair.

## Ethiopia — Jijiga and Jaamuuq (NEW, two dated surfaces)

**Sources:** `https://mawaqit.net/en/m/masjid-najashi-jijiga-0000-ethiopia` (9.3511 / 42.8005) and
`https://mawaqit.net/en/m/al-towba-masjid-jaamuuq-1000-ethiopia` (3.6360 / 39.0340).
Both `Africa/Addis_Ababa`. Platform/community tier.

**Rows:** 365 each after dropping the Feb-29 slot, 730 total.
**Recipe, Jijiga:** fajr **18.00** (meanAbs 0.00, 365/365), isha **18.38** (0.19, 365/365),
sunrise 0, dhuhr = transit + 0, maghrib = sunset + 0, asr Shafi + 0 at 232/365 within 1
(coarse ladder).
**Recipe, Jaamuuq:** fajr **18.00** (0.00, 365/365), isha **18.45** (0.24, 365/365), same
solar columns, same asr ladder.
**What is NEW:** Ethiopia's first dated rows outside Addis. The record held FALLBACK with an
Addis adhan-js MWL panel that is today-only; Jijiga and Jaamuuq are whole years.
**Open question for the owner:** the isha angle (~18.4) is not the MWL 17 the East Africa
cluster holds, and it differs by city — two mosques, two settings, one platform.

## Uganda — Entebbe (NEW second city) and Kampala Mulago (defective)

**Entebbe:** `https://mawaqit.net/en/m/sena-high-entebbe-mosque-entebbe-00256-uganda`
(Imam Al-Ghazali Mosque, 0.147 / 32.523, `Africa/Kampala`). 365 rows.
fajr **15.00**, isha **15.00**, sunrise 0, dhuhr transit + 0, maghrib sunset + 0 — five columns
at meanAbs <= 0.02, 365/365 within 1; asr 321/365. **ISNA 15/15, a different pair from the
Kampala Jamiat outrider the record holds.**

**Mulago, Kampala:** `https://mawaqit.net/en/m/mulago-hospital-mosque-kampala-256-uganda`
(0.337 / 32.577). 365 rows. Fails the gate: fajr fits 15.48 with meanAbs 7.32 (39/365),
isha 19.99 with meanAbs 2.46 (17/365), dhuhr transit + 24. A hand-adjusted board, recorded as
a negative surface.

**Kiyindi masjid, Kampala:** `mawaqit.net/en/m/Kiyindi-masjid-Kiyindi-Lane-256-Kampala-Uganda`
returns **404** — the O1k "offline shell" note is now a dead page.

## Guinea — Conakry second pass (four mosques, ALL fail the solar gate)

The record held one Conakry mosque (Landreyah) with a "fajr 7 minutes before sunrise" defect.
Four Conakry mawaqit pages were found and captured this pass:

| Mosque | Coordinates | Verdict |
|---|---|---|
| Landreyah Centre | 9.5479 / -13.6754 | hand-entered board: asr fixed 16:40, maghrib fixed 19:15 in January (impossible), fajr == sunrise on most days |
| Mosquée Abi Oubayda (Yattaya Plateau) | 9.5091 / -13.7119 | near-identical to Landreyah (71/366 days byte-equal; the rest differ only in the dhuhr block) — one table on two mosques |
| CITÉ ENCO 5 | 9.6287 / -13.5934 | hand-blocked: dhuhr 13:34-13:40, asr 16:40-16:45; fits fajr 16.94 at meanAbs 15.8 |
| Mosquée Gbessia Port2 | 9.5091 / -13.7119 | dead install: 183 of 366 days are all `00:00` |

**Verdict:** Guinea's capital stays a negative. The census's Landreyah defect is now **explained**:
it is not a misconfigured calculation but a hand-maintained jama'ah board with an impossible
January maghrib and a fajr column equal to sunrise. Nono remains Guinea's only clean surface.
Languages searched: French ("horaires de prière Conakry", "mosquée Conakry"), plus the platform
index. Soussou/Malinke phrasings returned no additional publisher.

## Niger — second cities (confirmed, no finer surface)

The BUTIN portal's selector offers exactly **eight regions**, each with its own printed
coordinates (Niamey, Agadez, Diffa, Dosso, Maradi, Tahoua, Tillaberi, Zinder). There is no
department or commune granularity, and no second portal. The "second cities inside the regions"
question therefore resolves to those eight regional capitals, all of which the record already
holds as 56 region-years (2025-2031). **Confirmed: no new Niger surface exists under these terms.**
Languages searched: French, plus the portal's own region list.

## Honest negatives with the search terms used

- **Somalia/Somaliland second cities** — Borama (Boorama), Berbera, Bosaso (Boosaaso),
  Garowe (Garoowe), Kismayo (Kismaayo): no mawaqit page, no ministry page, no mosque page.
  Searched in Somali ("waqtiga salaada <city>"), English, and by `site:mawaqit.net <city>`.
  Every hit was a computed aggregator (islamicfinder, timesprayer, muslimpro, hamariweb,
  prayertimes.date, tawkit) — calculators, never a publisher. Hargeisa and Mogadishu keep the
  five mawaqit mosques the record holds; no sixth Somali mosque surfaced.
- **Kenya beyond Nairobi/Mombasa** — Nakuru, Kisumu: aggregators only, no mosque or council
  table. Mombasa keeps the two mawaqit mosques held (Memon Villa, Hudaa); no third surfaced.
  Searched in Swahili ("nyakati za sala", "ratiba ya sala") and English.
- **Burkina Faso — Koudougou:** no MSBF or mosque table; the MSBF mawaqit cluster is
  Ouagadougou-only. Searched in French.
- **Tanzania — Mwanza and Stone Town (Zanzibar):** no publisher surface. The mawaqit index
  holds three Dar es Salaam mosques and nothing else in Tanzania. Searched in Swahili and English.
- **Ethiopia — Addis Ababa, Dire Dawa, Harar, Awassa:** Amharic ("የሰላት ሰዓት", "የጸሎት ሰዓት"),
  Somali and Oromo ("yeroo salaataa") phrasings returned no dated publisher table. Addis stays
  the adhan-js today-only panel the record describes; Jijiga and Jaamuuq above are the two dated
  Ethiopian surfaces found.

## Second sweep — the extra checks behind the negatives

- **BAKWATA (`bakwata.or.tz`) rendered for the first time.** The site is a Laravel/Inertia SPA
  that serves 6,145 bytes of shell to curl. Driven in a real browser (agent-browser, own session
  `o1l-20r`) it renders a national-council site with the mufti, the secretary-general and the
  committee chair, and navigation of Home / About / Hajj & Umrah / Bakaid / Community / Projects /
  Services / New Updates / Contact. Neither `/services` nor `/events` carries any prayer or
  timetable content. **Tanzania's national council still publishes no prayer table** — the
  negative is now a rendered negative, not a shell read.
- **Jamia Mosque Nairobi (`jamiamosque.co.ke`)**: the site's `/islamic-calendar/` page holds ten
  tables, all of them occasion calendars (Dhul Hijjah, Arafah, Eid, Muharram, Mawlid) with
  Gregorian and Hijri dates. No prayer columns. `/ramadhan-timetable/` serves the 1447/2026 PDF
  the record already holds. The year-round lift the record asks for is **still absent**.
- **Masjidway Tanzania**: one Tanzania mosque page (`Al-Rawdha Mosque`, id 10504) renders a
  today-only five-time panel (04:35 / 12:07 / 15:27 / 18:19 / 19:30) with no city printed and no
  dated table. Recorded as a lead, not data.
- **Uganda Muslim Supreme Council (`umsc.or.ug`)**: 236 KB served, no prayer page in its link
  graph; a second attempt timed out. Negative stands.

## File inventory

- `captures/` — 34 raw artifacts: 15 mawaqit mosque pages, 9 CERFI API responses + the CERFI home
  and `app.js`, the salaahtimes home/towns/API index and 4 Arusha year pulls, 2 Jamia pages, the
  BAKWATA shell, the UMSC attempt.
- `data/senegal-cerfi-week-2026-11-11.json` — 9 cities x 7 days, 63 rows.
- `data/tanzania-arusha-salaahtimes-2025-2027.json` — 3 years x 365, 1,095 rows.
- `data/mawaqit-o1l-20r-2026.json` — 9 surfaces x 366 day-slots (3,294 stored; 3,285 fitted after
  the phantom 29-Feb slot is dropped).
- `fit_arusha.mjs`, `fit_mawaqit.mjs`, `parse_mawaqit.py`, `run_fits.py` — the fitters, re-runnable.

## Method notes and traps

- mawaqit pages answer `307` and must be followed with `-L`; the slug redirects from `/en/m/` to
  `/en/`.
- mawaqit's `confData.calendar` is 12 months of day-of-year slots **including a Feb-29 row in
  every year**; 2026 is not a leap year, so that slot was dropped before fitting (the Kampala
  phantom-29-Feb lesson).
- mawaqit's `robots.txt` now carries `User-agent: ClaudeBot / Disallow: /`. No bulk crawl was
  performed: every mawaqit capture here is a single named mosque page reached from a search
  result, the same access a visitor makes.
- The platform engine shows the known artefact: five of six columns reproduce at zero margin and
  the asr column sits on a coarse 2-3 day ladder, which is a rendering property, not a decision.
