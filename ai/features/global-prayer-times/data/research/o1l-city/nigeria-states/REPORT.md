# O1l-7 Nigeria states — city-level mosque layer (REPORT)

Agent: o1l-nigeria (research wave O1l-7). Date of captures: 2026-11-11. Engine for all fits:
adhan 4.4.6 (`census/adhan-build/node_modules/adhan`), Rounding.None, second resolution then
explicit per-column rounding (round and floor both scored; identical verdicts everywhere),
TZ Africa/Lagos unless stated. Dates from literal capture strings; the real clock never read.

## Surfaces banked (see `data/`, raw in `captures/`)

### masjidway (platform tier, mosque-level, server-rendered athan tables, NO iqamah)

The platform that yielded the O1k fitted line. Directory `masjidway.com/51161-nigeria` is
flaky (502/503/timeout, intermittent; 6 of 22 pages served after retries; server was 200/503
alternating minute to minute). Mosque pages serve reliably. KEY FINDING: `/masjid/{id}/prayer/MMYYYY`
renders ANY month-year (Jan 2028 verified) — a far-horizon computed surface. Each mosque page
embeds its coordinates (lat/lng JSON, saved to `data/masjidway-coords.json`). Nine mosques ×
3 months (2026-01, 2026-11, 2027-01) = 276 rows across three NEW cities + two extra Kaduna
months. Parse-clean JSON per mosque-month in `data/`.

| City | Mosque | id | rows | Egyptian 19.5/17.5 Shafi | MWL 18/17 |
|---|---|---|---|---|---|
| Kaduna | Kano Road Central Mosque | 11637 | 92 | within-1 100%, worst 1 | fails (fajr -6.5 mean) |
| Kaduna | Al-Manar Mosque (Sabon Gari) | 11638 | 92 | within-1 100%, worst 1 | fails |
| Kaduna | Yahya Road Jum'at Mosque | 11630 | 92 | within-1 100%, worst 1 | fails |
| Kaduna | Kinkinau Central Mosque | 11624 | 92 | within-1 98.9%, worst 2 | fails |
| Kaduna | Misbahul Islam Mosque | 11633 | 92 | within-1 100%, worst 1 | fails |
| Kaduna | Alhuda Foundation Mosque | 11643 | 92 | within-1 100%, worst 1 | fails |
| Benin City | Benin City Central Mosque | 12117 | 92 | within-1 100%, worst 1 | fails |
| Benin City | Uniben Central Mosque | 12120 | 92 | within-1 98.9%, worst 2 | fails |
| Enugu | Prison Training School Central Mosque | 12453 | 92 | within-1 100%, worst 1 | fails |

Margins vs adhan at round-to-nearest: fajr/sunrise/asr/maghrib/isha ≈ 0.00; dhuhr -1.0 mean
(dhuhr printed = transit minus 60 s, every day). Between-year stability: Jan-2026 and Jan-2027
margins IDENTICAL per column — a computed platform, frozen parameters, not a maintained table.
Umm al-Qura fails (isha -18). Hanafi asr ruled out at O1k (55 min). Gate: the live mosque page
IS the table (server-rendered HTML captured per page). Byte-identity-vs-default: DISPROVEN —
each mosque carries its own coordinate-derived values (within-Kaduna fajr differs across the
six mosques; 10.49-10.64 N spread). Solar gate: dhuhr 12:14 at Kaduna lon 7.43 E passes.
Seasonal amplitude (Kano Road CM, Kaduna): fajr 05:26 Jan 1 → 05:03 Nov 1; maghrib 18:20 → 18:06.

### masjidbox (platform tier, mosque-configured, keyless public landing API)

API `api.masjidbox.com/1.0/masjidbox/landing/athany/{slug}?get=at&days=7&begin=DATE` with the
apikey the public site's own JS embeds (keyless by construction). HARD CAP: 7 rows per request;
history walks via begin= (57 windows per mosque, every raw response saved as JSONL in
`captures/masjidbox-walk-*.jsonl`). Each row: athan + iqamah + imsak/iftar + hijri.

| City | Mosque | verified | rows | span | fit |
|---|---|---|---|---|---|
| Osogbo (Osun) | Al Imam Islamic Theological Centre (RHJG+VV plus code decoded: 7.832125, 4.577125) | true | 399 | 2026-01-01 → 2027-02-03 | **MWL 18/17 Shafi EXACT**: 365/365 within-1 in 2026, 34/34 in 2027, worst 1; margins 0 on every column; dhuhr = transit - 60 s exactly; sunrise exact (coords validated) |
| Suleja (Niger, Abuja orbit) | Central Mosque Dabara | true | 399 | same | MWL 18/17: within-1 98%, worst 2 at CITY-CENTER coords (9.196, 7.179 assumed — no coords in payload; recorded assumption) |
| Ile-Ife (Osun) | Idi-Omoh Mosque, Ilare | true | 399 | same | MWL 18/17 EXACT **in UTC** — 365/365 + 34/34 within-1, margins ≈ 0. SERVED OFF-ZONE: the whole table is 60 min early for Nigeria (payload stamps "Z", settings carry NO timezone field; Osogbo's carries Africa/Lagos). TZ misconfiguration quantified to exactly 60 min; usable only with the +60 shift |

Iqamah layer (two-layer rule, separate files): uniform athan +10 min on fajr/dhuhr/asr/isha,
maghrib +5, on all 399 days, both Osogbo and Suleja (masjidbox platform default policy).
Gate: landing pages captured (200) alongside the API for all three mosques; the page's own JS
fetches the same slug payload (page and feed one surface); walk rows include capture-day
2026-11-11 (today-row anchored). Solar gate: Osogbo dhuhr 12:45 Jan (lon 4.577 E) passes;
Ile-Ife fails in wall-clock (the TZ bug) and passes in UTC. Byte-identity: DISPROVEN — three
different coordinate sets, three different tables. Egyptian fails on all three (fajr +6.3);
Umm al-Qura fails (isha -21).

### MATW Project Kano (community charity aggregator, candidate)

`matwproject.org/donate/namaz-timetable/ng/kano`: monthly table, Nov 2026, 30 rows banked
(`data/matw-kano-monthly-2026.json`). Fit at Kano city coords (12.002, 8.532): fajr MWL-exact
(margin 0), sunrise/maghrib 0, dhuhr -0.8, asr +0.87, isha +4.3 mean (worst 5) — MWL fajr with
a late isha (~17.8 deg-equivalent), 30-day window only. Candidate grade; community tier.

### Today-poll / aggregator surfaces (recorded, not banked as dated data)

- Ibadan: prayertimes.date "UI's Mosque" (id 6254) — today-only client render, no dated rows.
- Kano: muslimandquran.com "Rijiyar Zaki Mosque" — today-only + Friday 13:00 jamaah note.
- Jos/Port Harcourt/Benin/Enugu/Ilorin: prayersconnect mosque pages — today-only.
- mawaqit Nigeria EXISTS (Chevron Drive Lekki, Sun City Galadimawa Abuja, River Park Estate
  Abuja; NAF Base Abuja 404s on www, indexed on admin host) — Abuja/Lagos only, outside the
  state targets; not banked this round, flagged for the mawaqit trap suite if the owner wants.

## Honest negatives (languages: English + Hausa; every surface closed by search then fetch)

- Kano: institutional bodies FB-gated (Premier Radio's daily Hausa series "Lokutan sallah a
  jihar Kano da kewaye" is Facebook-post-only, re-confirmed today). State council, emirate:
  nothing public. Only dated surface: MATW community table.
- Sokoto: Sultanate council, Sokoto Central Mosque — nothing public; aggregators only.
- Ilorin (SECOND PASS, negative again): Ilorin Central Jumat Mosque — FB photos only;
  UNILORIN mosque news pages carry no timetable; aggregators only.
- Ibadan / Oyo: UI Central Mosque has no own timetable (landscaping press only); aggregators.
- Abeokuta / Ogun: aggregators only (O1k negative stands).
- Jos / Plateau: Jos Central Mosque present in directories, today-only; nothing dated.
- Port Harcourt / Rivers: news story records Muslims demanding a central mosque (2026) —
  no published timetable; aggregators only.
- Maiduguri / Borno: Shehu of Borno palace mosque — nothing public; aggregators only.
- Yola / Adamawa: Modibbo Adama Mosque FB video only; aggregators only.
- Kaduna councils, Hisbah, NSCIA: O1k negatives stand; re-searched, nothing new public.

## GEOGRAPHY VERDICT — Egyptian vs MWL is PUBLISHER-SHAPED, NOT geography-shaped

The Egyptian 19.5/17.5 Shafi line reproduces ONLY through masjidway, and it reproduces
IDENTICALLY in every Nigerian region the platform carries: Kaduna (north, 6 mosques this
round), Abuja (middle-belt, O1k), Benin City (south, 2), Enugu (southeast, 1), Ikorodu
(southwest, 2, O1k). Same margins everywhere (dhuhr -60 s, all else 0), same two-year
stability — one platform generator fed per-mosque coordinates. Meanwhile every
MOSQUE-CONFIGURED table found (masjidbox, verified: Osogbo, Ile-Ife, Suleja) is MWL 18/17
Shafi exact — including BOTH Osun mosques — and the national community SPA computes MWL 18/17.

Verdict for the tier-2 architecture: the Nigerian mosque-level recipe is **MWL 18/17 Shafi**
(now fitted at mosque level in the southwest: Osogbo exact 2-year, Ile-Ife exact 2-year
modulo the 60-min zone bug, Suleja 98%); the Egyptian line is **masjidway's platform
default, uniform nationwide — not a Yoruba/southwest practice, not a regional convention**.
It must not be encoded as regional geometry. The one Egyptian-region divergence that remains
possible is inside masjidway's own directory breadth (unlisted mosques would still inherit
Egyptian), which is a provenance fact, not a geography fact.

## Watch notes

- masjidway directory: intermittent 502/503 this round; 16/22 directory pages unserved after
  retries (mosque pages unaffected). A later pass should walk the remaining pages (m1-m6,
  m10, m12-m14, m17+) for mosque ids in Kano/Ibadan/Ilorin/Jos/Sokoto/Maiduguri/Yola/PH/Osogbo
  — none surfaced in the served pages' activity blob (91 mosques: Abuja 20, Kaduna 22,
  Ikorodu 18, Benin 8, Sagamu 5, Enugu 3, plus singles), a strong negative for those cities.
- masjidway future harvest: any MMYYYY renders (Jan 2028 pulled for 11637). A cheap
  year-2+ accrual path for all 9 Nigerian mosques held here.
- masjidbox days cap 7/request: a full-year walk costs 57 requests per mosque (each raw
  response saved); id-clusters 12115-12130 (Benin) and 12450-12462 (Enugu) unprobed beyond
  the named mosques.
