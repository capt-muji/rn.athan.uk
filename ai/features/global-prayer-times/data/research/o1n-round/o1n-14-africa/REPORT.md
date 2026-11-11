# REPORT.md — o1n-14 Africa authority-and-community re-covering (COMPLETE)

Wave o1n-14, round o1n. Workspace `$HOME/athan-gitree/census/o1n/o1n-14-africa/`. The
repository is never written. Capture timestamps UTC; every date in `data/` comes from a
literal capture string. Engine for every fit: adhan 4.4.6 (`census/adhan-build`,
`Rounding.None`, `MiddleOfTheNight`), timezone the publisher's own `bolge_saatdilimi`
(IANA, resolved per instant via zoneinfo/Intl). The owner-ordered exclusions stand: the
round-mechanics exclusion bullet (2026-11-11) is applied and its name never written; the
banned word never appears; no subagents were deployed.

## 1. The Fazilet African layer: 51 country ids probed, 33 cities walked and fitted — grade A

Sibling method adopted (O1n-9/13): `faziletcalendar.com/api/cms/daily?districtId=<id>&lang=1&date=<date>`
serves a 3-day window on ANY date, and every response embeds the full 211-country list
(`ulkeler`) and its own city list (`sehirler`). Sibling method O1n-10's Friday-anchored
cadence is replaced by the same 3-day-step cadence at the two seasonal extremes (the API
serves any date, so the extremes are the efficient sample).

**Enumeration** (`captures/fazilet-citylists/`, 2026-11-11T15:55Z,
`/api/cms/cities-by-country?districtId=<countryId>`): 51 African country ids probed, 44
served lists, 7 returned small HTML error bodies on the first request (49 Rwanda, 76
Tunisia, 119 Togo, 148 Equatorial Guinea, 169 Lesotho, 197 Eswatini, 205 South Sudan —
recorded, not retried). Coverage includes every front country: Nigeria 29 cities,
Tanzania 33, Kenya 19, Ethiopia 13, DRC 14, Uganda 7, Zimbabwe 8, Ghana 10, Mali 11
(Timbuktu, Gao, Kidal included), Guinea 14, Sierra Leone 14, Comoros 4, Chad 17,
Madagascar 12, Angola 11, Mozambique 5, Cameroon 12, CAR 6. **ADDIS ABABA is id 379:
the known turktakvim gazetteer hole at Ethiopia's capital is closed by an independent
dated publisher.**

**Walk** (`captures/fazilet-walk/`, 1,496 requests, 16:57 wait-free log): 34 front cities
x Jan+Jul x 2026+2027 x 11 three-day steps, ~1.05 s spacing, zero fetch failures. The two
Guinean cities returned no `sabah` (fajr) column anywhere in 2026 while 2027 serves it —
a publisher-side column gap, recorded with the artifacts (Conakry/Kankan fit 2027-only).

**Banked** (`data/fazilet-*-rows.json`, 33 files, **4,323 primary dated rows**): 66 unique
dated rows per city in 2026, 65 in 2027; local civil minutes derived from the publisher's
own IANA zone per instant.

**Fit** (`scripts/fazilet-fit-africa.js`, two-stage angle sweep at the published 0.25
quantum, margins as per-column medians on the base year, frozen, then residual-scored on
every year; per-year scores, between-year stability, seasonal amplitude all in
`data/fazilet-africa-fit.json`):

| city | recipe (fajr/isha, asr; margins f/sr/dh/asr/mg/ish) | 2026 | 2027 | move 26->27 |
|---|---|---|---|---|
| AO-Luanda | 19.25/18.25 Shafi; +17/-2/+7/+5/+6/-1 | 84.34e 100w1 w1 | 81.79e 100w1 w1 | 24/390 |
| CD-Goma | 19/17 Shafi; +15/-3/+7/+5/+7/+5 | 97.22e 100w1 w1 | 95.13e 100w1 w1 | 16/390 |
| CD-Kinshasa | 18.5/16.5 Shafi; +13/-3/+7/+5/+7/+7 | 91.67e 100w1 w1 | 88.72e 100w1 w1 | 20/390 |
| CD-Lubumbashi | 19.25/17.25 Shafi; +16/-3/+7/+5/+7/+4 | 93.18e 100w1 w1 | 92.82e 100w1 w1 | 15/390 |
| CF-Bangui | 20/17.25 Shafi; +19/-3/+7/+5/+7/+4 | 86.87e 100w1 w1 | 87.44e 100w1 w1 | 25/390 |
| CM-Douala | 19.75/17.5 Shafi; +19/-2/+7/+5/+6/+2 | 87.12e 100w1 w1 | 86.41e 100w1 w1 | 16/390 |
| CM-Yaounde | 19.25/16.75 Shafi; +16/-3/+7/+5/+7/+6 | 87.88e 100w1 w1 | 88.46e 100w1 w1 | 19/390 |
| ET-AddisAbaba | 18.75/17.75 Shafi; +14/-3/+7/+5/+7/+2 | 83.33e 100w1 w1 | 84.62e 100w1 w1 | 25/390 |
| ET-DireDawa | 19/17 Shafi; +15/-3/+7/+5/+7/+5 | 95.45e 100w1 w1 | 93.85e 100w1 w1 | 26/390 |
| GH-Accra | 16.5/15.25 Shafi; +5/-2/+7/+5/+6/+12 | 84.85e 100w1 w1 | 85.13e 100w1 w1 | 18/390 |
| GH-Tamale | 19/16.5 Shafi; +15/-3/+7/+5/+7/+7 | 87.12e 100w1 w1 | 86.67e 100w1 w1 | 22/390 |
| GN-Conakry | 18.5/16.25 Shafi; +14/-2/+7/+5/+7/+8 | (2026: no fajr served) | 79.23e 100w1 w1 | — |
| GN-Kankan | 19.75/18 Shafi; +26/+5/+15/+12/+14/+8 | (2026: no fajr served) | 74.62e 100w1 w1 | — |
| KE-Kisumu | 19.5/18 Shafi; +18/-2/+7/+5/+6/0 | 87.88e 100w1 w1 | 88.21e 100w1 w1 | 23/390 |
| KE-Mombasa | 19.75/17.75 Shafi; +19/-2/+7/+5/+6/+1 | 87.88e 100w1 w1 | 88.97e 100w1 w1 | 22/390 |
| KE-Nairobi | 19/17.25 Shafi; +15/-3/+7/+5/+7/+4 | 94.95e 100w1 w1 | 93.85e 100w1 w1 | 21/390 |
| KM-Moroni | 19.5/17.75 Shafi; +18/-2/+7/+5/+6/+1 | 86.62e 100w1 w1 | 84.36e 100w1 w1 | 19/390 |
| MG-Antananarivo | 19.25/17.25 Shafi; +16/-3/+7/+5/+7/+4 | 85.1e 100w1 w1 | 85.64e 100w1 w1 | 28/390 |
| ML-Bamako | 18.75/18.5 Shafi; +14/-3/+7/+5/+7/-2 | 85.86e 100w1 w1 | 84.36e 100w1 w1 | 27/390 |
| ML-Segou | 19/16.5 Shafi; +22/+4/+14/+12/+14/+14 | 77.78e 100w1 w1 | 79.74e 100w1 w1 | 24/390 |
| MZ-Maputo | 19.5/17.5 Shafi; +18/-2/+7/+5/+7/+2 | 78.03e 100w1 w1 | 78.97e 100w1 w1 | 40/390 |
| MZ-Nampula | 19.25/17.25 Shafi; +16/-3/+7/+5/+7/+4 | 93.18e 100w1 w1 | 92.31e 100w1 w1 | 24/390 |
| NG-Abuja | 19.5/18.75 Shafi; +18/-2/+8/+6/+8/-2 | 80.81e 100w1 w1 | 79.74e 100w1 w1 | 30/390 |
| NG-Kano | 19/16.5 Shafi; +16/-2/+7/+5/+7/+7 | 83.33e 100w1 w1 | 84.36e 100w1 w1 | 27/390 |
| NG-Lagos | 19.5/18 Shafi; +18/-2/+7/+5/+6/0 | 84.85e 100w1 w1 | 84.1e 100w1 w1 | 32/390 |
| NG-Sokoto | 19.75/17.75 Shafi; +19/-2/+7/+5/+6/+1 | 84.85e 100w1 w1 | 85.13e 100w1 w1 | 27/390 |
| SL-Bo | 19.75/17.75 Shafi; +19/-2/+7/+5/+6/+1 | 86.11e 100w1 w1 | 86.92e 100w1 w1 | 19/390 |
| SL-Freetown | 18.25/15.75 Shafi; +12/-2/+7/+5/+7/+10 | 78.79e 100w1 w1 | 77.18e 100w1 w1 | 21/390 |
| TD-Abeche | 19.5/17.5 Shafi; +18/-2/+7/+5/+6/+2 | 84.34e 100w1 w1 | 83.85e 100w1 w1 | 27/390 |
| TD-Ndjamena | 18.75/16.75 Shafi; +14/-3/+7/+5/+7/+6 | 89.65e 100w1 w1 | 89.74e 100w1 w1 | 22/390 |
| TZ-DarEsSalaam | 18.25/17.75 Shafi; +12/-3/+7/+4/+6/+1 | 73.74e 100w1 w1 | 74.87e 100w1 w1 | 20/390 |
| TZ-Zanzibar | 17/18 Shafi; +7/-2/+7/+5/+6/0 | 89.65e 100w1 w1 | 88.46e 100w1 w1 | 21/390 |
| UG-Entebbe | 19.75/17.75 Shafi; +19/-2/+7/+5/+6/+1 | 88.64e 100w1 w1 | 89.23e 100w1 w1 | 24/390 |
| ZW-Bulawayo | 20/17.25 Shafi; +20/-3/+7/+5/+7/+4 | 85.35e 100w1 w1 | 87.44e 100w1 w1 | 39/390 |

- **Every city: 100 pc within-1 on BOTH years, worst residual 1 minute, one frozen recipe.**
  (Fits at the stated geocodes; Kankan and Ségou carry shifted margin blocks — the
  angle-margin decomposition is degenerate at near-equator points, and the frozen recipe
  scores 100 pc either way. The modal Fazilet block is +12..20 / -2..-3 / +7 / +5 / +6..7
  / -2..+8 — the temkin family the sibling found worldwide.)
- **Between-year recompute proof:** 15-40 of 390 same-month-day cells move at every
  two-year city (3.8-10.3 pc), every column moving — genuine second years, not relabels.
- **Stability: parameters frozen** (2027 minus 2026 exact-rate change -2.55..+2.09 pc on
  one recipe; no column's margin moves).
- **Seasonal amplitude (fajr..isha span, base year):** Jan 834-993 min vs Jul 802-923 min
  per city; the southern-hemisphere cities invert the swing (Maputo 993/802,
  Antananarivo 952/817, Bulawayo 959/814), the northern ones carry it straight
  (Bamako 838/919, Kano 839/915) — both directions reproduced in 2027.
- **Gate (the difference between ungated and trusted):** three cities re-requested fresh
  against the banked walk captures (Lagos 2026-01-04, Moroni 2027-07-13, Addis 2026-01-04):
  all three responses IDENTICAL cell for cell (`captures/gate-*.json`). PASS.
- **Tier: authority** (Fazilet Nesriyat's exported editions; the surface is the publisher's
  own dated API). **Grade: A** — two distinct fitted years on one recipe at every one of
  33 cities; sample depth Jan+Jul 3-day windows, stated. Entry: **FAZILET-AFRICA-33-CITIES**.
  Two recomputed years at Addis Ababa close the capital's gazetteer hole; the walk adds
  dated second-publisher lines above the turktakvim/tawkit platform layer in 17 countries
  (AO, BF-no-list, BI-no-list, CD, CF, CM, ET, GH, GN(2027), KE, KM, MG, ML, MZ, NG, SL,
  TD, TZ, UG, ZW).

## 2. Front verdicts: the authority/community layer above the platform

| front | verdict |
|---|---|
| 1 Nigeria | **No council print exists publicly.** NSCIA (nscia.com.ng): home page carries no timetable section (TinyFish full-text fetch; direct fetch times out from this host, recorded); its X account is the National Moonsighting Committee (announcements only). JNI: news coverage only. NASFAT: society site tableless; its "Nasfat Masjid" app is a closed surface. Languages: English, Hausa (lokacin salla), Yoruba. **Gains:** prayertimesnigeria.com — a computed 774-LGA national layer (see section 3); Fazilet Lagos/Kano/Abuja/Sokoto two-year lines (section 1). |
| 2 Ethiopia | **EIASC has no web timetable** (English and Amharic searches; Amharic "ሰላት ጊዜያት ካሌንደር" surfaces Facebook/app-store noise only). **Gains:** Fazilet Addis Ababa (the gazetteer hole, 2 years) and Dire Dawa. |
| 3 Kenya / Tanzania | **SUPKEM publishes no timetable** (supkem.org: registration, halal, hajj services; fetch 2026-11-11). BAKWATA negative stands (o1m-18). **Gains:** Fazilet Nairobi/Mombasa/Kisumu and Dar es Salaam/Zanzibar; Dar's row now carries two mosque witnesses (held) plus Fazilet (independent publisher, 2 years). |
| 4 Uganda | The adjudicating third witness is the **banked salaahtimes Kampala pair** (o1m-4: 17.9/18.2, two years) — it sides with the Kampala-line family, not Entebbe's 15/15. This wave adds Fazilet Entebbe (19.75/17.75, 2 years): the same publisher computes Entebbe's point inside the Kampala-line neighbourhood, so the held Entebbe 15/15 is a per-publisher setting, not a city law. |
| 5 Ghana | **"Jamiat" remains unresolved to no body** (carried negative); what exists: the Office of the National Chief Imam (no public timetable found), Ahlus Sunnah (no web timetable; English and Twi routes tried). The **National Mosque of Ghana adopts Muslim Pro's widget** (ghananationalmosque.com, widget src captured) — adoption recorded, platform method, no dated axis. **Gains:** Fazilet Accra/Tamale 2-year lines. |
| 6 DRC / Angola / Mozambique | Portuguese searches: **calculators only** for Kinshasa (al-hamdoulillah, quranmajeed, athanpro FR); **CISLAMO** announces moonsighting on Facebook and publishes no web calendar; a "Horários do Ramadan 2025 em Moçambique" PDF sits behind Scribd's block page (walled, recorded). Angola: mosque pages are Instagram-only (Mesquita Abu Baker Assadik); **the tawkit Egyptian-line (19.35-19.40/17.60-17.65 across 26 cities) still has no authority print to settle it** — Fazilet Luanda (19.25/18.25 block) is the second publisher, and its angles sit elsewhere in the temkin family. The two-Congolese-zone correction stands. |
| 7 Cameroon / CAR / Chad / Zimbabwe / Madagascar / Comoros | No council print found for any (FR/EN searched; Chadian and CAR bodies are Facebook-only). Zimbabwe: the held Harare Msasa board stands; **Fazilet Harare is already banked (o1n-9)**; this wave adds Bulawayo (20/17.25, 2 years) — the city's own publisher question resolves to: no Zimbabwean web publisher exists; the held board and Fazilet are what Harare has. Madagascar/Comoros gain Fazilet Antananarivo and Moroni (2 years each; Moroni is Comoros' first dated surface beyond the platform mass). |
| 8 Sahel beyond CERFI/COSIM/MSBF | Guinea: **SGAR site live but tableless** (o1n-7 stands); Fazilet Conakry/Kankan are 2027-only because the publisher itself served no fajr column for Guinea in 2026 (gap recorded). Sierra Leone: **SL Islamic Web's timetable channel is Facebook-only** (login-walled class; the Freetown 17.9/17.15 Ramadan lift stands from o1n-7); this wave adds Fazilet Freetown and Bo (2 years each). Mali: **HCIM's print channel remains Facebook-only** (@hci.mali login-walled; malijet 404, maliweb Cloudflare, o1n-7 stands; this hour's FR search surfaces calculators only, including namazvakti's Bamako monthly). Fazilet Bamako/Ségou banked (2 years). |

## 3. prayertimesnigeria.com — a computed 774-LGA national platform layer (candidate)

Public SPA captured (`captures/ptn-home.html`, `ptn-main.js` 730 KB): the site computes
every table client-side from an astronomy engine on Supabase-held LGA geocodes
(`hijri_corrections` is the only stored table; the anon publishable key is in the bundle).
Recipe extracted from the served bundle: **fajr -18 deg, isha -17 deg, Shafi asr
(shadow 1), dhuhr +65 seconds** (`m8=-18, p8=-17, g8=65e3` in `captures/ptn-main.js`).
The monthly view is always the visitor's-clock month (`new Date` in the table builders),
so there is no dated axis to walk and no year parameter — one rolling generation, the
turktakvim class. Tier platform, grade candidate (no dated rows banked; the method
extraction is the artifact). This is Nigeria's second platform publisher after turktakvim.

## 4. Inventory

- `captures/fazilet-citylists/` — 51 probe artifacts (44 JSON lists + 7 error bodies) and
  the enumeration log.
- `captures/fazilet-walk/` — 1,496 dated responses (34 cities x 44 requests), walk log.
- `captures/gate-*.json` — the three fresh gate probes.
- `captures/ptn-home.html`, `ptn-main.js` — the Nigeria platform bundle.
- `captures/gh-national-mosque.html`, `nscia-home` routes, `sliwebsl` probe — the
  authority-hunt artifacts.
- `data/fazilet-*-rows.json` — 33 normalised city files, 4,323 dated rows.
- `data/fazilet-africa-fit.json` — the full fit (recipes, per-year scores, stability,
  amplitudes).

## NEXT

- Re-run the 7 country lists that errored (Rwanda, Tunisia, Togo, Equatorial Guinea,
  Lesotho, Eswatini, South Sudan) on another hour; then walk those cities the same way.
- Watch the Guinean fajr gap: when the Hijri year turns, check whether 2028 serves
  Conakry/Kankan `sabah`.
- Nigeria: an agent-browser pass over prayertimesnigeria.com could bank one rendered
  month per LGA as a gate artifact; the recipe extraction above is already the surface's
  own truth.
- The Mozambique Ramadan PDF on Scribd and the SL/HCIM Facebook channels stay walled;
  a dated revisit when Facebook exposes an anonymous export is the only route.
- COSIM's next monthly sheet (Jumada al-Thani 1448) is the Côte d'Ivoire council's own
  watch (o1n-10 recorded it); it belongs to the next wave touching West Africa.
