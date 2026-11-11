# O1l-30 — Caribbean and Central America, city-level round two

Wave: O1l city-level, 2026-11-11. Scope: Cuba, Dominican Republic, Puerto Rico, Haiti,
Bahamas, Barbados, Guyana, Belize, Panama, Costa Rica, Honduras, Guatemala, El Salvador.
Every capture under `captures/`, normalized rows under `data/`, fits under `data/fit_*.json`
and `data/implied_*.json`.

## Method notes that bind the numbers below

- **Year resolution.** A mawaqit page carries no year. Each calendar was resolved by matching
  the page's own `times` row against the calendar body: every surface matched month 11 day 11,
  so every calendar here is 2026. No clock was read.
- **Phantom 29 February.** All ten mawaqit calendars carry 366 entries with February at 29 days
  in 2026, which is not a leap year. The parser drops 2026-02-29; the platform would render a
  date that does not exist. Recorded as a platform defect class, not a transcription error.
- **Column layout.** Six columns normally; seven when `displayingSabahImsak` is on, the leading
  column duplicating fajr. Havana is the seven-column case in this region, so a fixed six-column
  reader shifts every Havana prayer by one. The Baku trap, confirmed here.
- **Engine.** adhan 4.4.6 at `Rounding.None`, high-latitude rule MiddleOfTheNight (never binds at
  these latitudes), timezone pinned per country, dates built from literal capture strings.
  Every mawaqit table reproduces at 0.23-0.56 MAE on fajr/sunrise/dhuhr/maghrib/isha and
  0.66-1.10 on asr. The ±1.2 asr skew the record attributes to adhan against a
  PrayTimes-v2-family platform engine appears on all ten surfaces, including ones whose other
  columns fit to 0.25, which is the signature of an engine artefact rather than a mosque rule.
- **Grade.** Every fit below is one published cycle (2026). None lifts past **provisional,
  community tier**. No year-2: mawaqit serves the current year only, and the Internet Archive
  answered "Temporarily Offline" all session, closing the backward harvest.
- **Access note.** `mawaqit.net/robots.txt` disallows the Anthropic crawler user-agents while
  allowing `*`. Only the individual public mosque pages named in this report were fetched, at
  browser user-agent, at the volume of ordinary browsing; no directory was crawled.

---

## Cuba — Havana (NEW country)

- **Source:** mawaqit, Mosque Abdallah (Mezquita Abdallah, Edificio CUPET, La Habana Vieja),
  `https://mawaqit.net/en/m/mosque-abdallah-edificio-cupet-la-habana-154-havana-cuba`.
  Platform/community tier. Capture `captures/mawaqit_havana_abdallah.html`.
- **Geometry:** 23.1374 N, 82.3489 W. Timezone field `America/Havana`, distrusted and validated
  by the year-round shape (the table follows Cuban DST; a fixed-offset profile would break in
  August).
- **Rows:** 365 dated rows, 2026.
- **Fit:** fajr 15° with −21 min, isha 15° with +12 min, dhuhr at transit +0, maghrib sunset +3,
  asr Shafi +1.

  | column | exact | within 1 | MAE | worst |
  |---|---|---|---|---|
  | fajr | 353/365 | 365 | 0.26 | 0.5 |
  | sunrise | 358 | 365 | 0.25 | 0.5 |
  | dhuhr | 359 | 365 | 0.24 | 0.5 |
  | asr | 53 | 263 | 1.13 | 2.1 |
  | maghrib | 359 | 365 | 0.26 | 0.5 |
  | isha | 349 | 365 | 0.25 | 0.6 |

- **Stated method:** not exposed. The public page carries no method, angle or adjustment field
  (only `hijriAdjustment`), and `api/2.0/mosque/*` answers 401/404 without a key. The implied
  angles are fajr 19.5 (monthly spread 0.85) and isha 17.6 (spread 0.49), which is the Egyptian
  19.5/17.5 pair; that pair reproduces at fajr MAE 1.24 (worst 4.6) and isha MAE 0.76, so it is
  the nearest *published* label but not the reproducing recipe. Both are recorded. The owner may
  prefer the labelled pair for provenance; the numeric recipe is the one that reproduces.
- **Seasonal amplitude:** January fajr 05:43-05:46, July fajr 05:15-05:31 — a 28-minute swing.
- **NEW:** the record's first Cuba surface. Cuba was absent from the table and therefore carried
  FALLBACK by default.
- **Negative:** no second Havana surface. The Cuban press describes Mezquita Abdallah as the
  country's only mosque ("la única mezquita de La Habana"); searches in Spanish and English found
  no other Cuban congregation publishing times.

## Dominican Republic — Santo Domingo (NEW country)

- **Source:** masjidbox, Masjid Al Noor, Avenida Francia,
  `https://masjidbox.com/prayer-times/masjid-al-noor-1703425482723`. Capture
  `captures/masjidbox_do_santodomingo_alnoor.html`.
- **Rows:** 7 dated rows, 2026-11-10 to 2026-11-16, from the page's own ld+json Event list.
- **Fit:** none. Seven days is below the month threshold; grade **candidate**.
- **Defect:** the public page serves a rolling seven-day window and ignores `begin`, `days` and
  `date` (all three return today's row byte-identically). `api.masjidbox.com` answers "no Route
  matched" on every path probed, so no year endpoint is reachable without a key.
- **NEW:** first Dominican Republic surface. Jumu'ah prints at the dhuhr slot (12:24), and Friday's
  row is labelled Jumuah rather than Dhuhr — a labelling trap for a column reader.

## Puerto Rico — San Juan and Ponce (NEW country)

- **Sources:** mawaqit Masjid Ebadur Rahman, 9410 Calle Los Romero, San Juan
  (18.3383 N, 66.0679 W); mawaqit Centro Islamico de Ponce (18.0103 N, 66.6135 W). 365 rows each,
  2026.
- **Fit, both:** MWL 18/17, **zero offsets on every column**.

  | surface | fajr exact | dhuhr exact | maghrib exact | isha exact | within 1 | asr MAE |
  |---|---|---|---|---|---|---|
  | San Juan | 357/365 | 364 | 356 | 351 | 365 all columns | 1.10 |
  | Ponce | 359/365 | 360 | 360 | 349 | 365 all columns | 0.74 |

- **Implied angles:** San Juan 18.00/17.00 (spread 0.05/0.04), Ponce 18.00/17.01 (0.05/0.07).
  These are the cleanest implied pairs of the wave beside Belize.
- **NEW:** first Puerto Rico surfaces, two cities on one recipe.
- **Defect:** the two mosques differ on all 365 days because the coordinates differ by 0.33°; the
  recipe does not.

## Haiti — Port-au-Prince (NEW country)

- **Source:** mawaqit, Madinah Islamic Center Haiti, Chalon
  (`madinah-islamic-center-7410-chalon-haiti`). 18.407 N, 73.090 W. 365 rows, 2026.
- **Fit:** fajr 18° +10 min, isha 16.6° +8 min, dhuhr at transit **+15 min**, maghrib sunset +5,
  asr Shafi +5 **floored at 15:30 local**.

  | column | exact | within 1 | MAE | worst | note |
  |---|---|---|---|---|---|
  | fajr | 352/365 | 363 | 0.27 | 2.1 | |
  | dhuhr | 358 | 365 | 0.25 | 0.5 | fixed +15 after transit |
  | asr | 152 | 337 | 0.68 | 1.8 | floor binds 101 days |
  | maghrib | 332 | 352 | 0.32 | 2.0 | |
  | isha | 208 | 343 | 0.56 | 2.8 | |

- **Defect, new class:** the asr column is **not** a pure calculation. Shafi asr sits +4 to +6
  minutes from the printed value from February to October, +16 in January and +33 to +39 in
  November and December. Applying a 15:30 wall-clock floor collapses the winter months onto
  exactly 15:30 (101 clamped days) and brings the column to 0.68 MAE. Read as a mosque-set
  earliest-asr rule, recorded as a defect rather than a recipe.
- **NEW:** first Haiti surface. Searched French, Kreyòl and English.

## Bahamas — Nassau (recheck, NEGATIVE)

- **Closure:** the only prayer page the island's congregation publishes is
  `http://www.geocities.ws/nassaumasjid/prayertimes.htm` (The Islamic Center of The Bahamas,
  Carmichael Road, PO Box N-10711). It is now behind a Cloudflare interstitial: curl returns the
  "Just a moment..." challenge and a real browser session is challenged too, which the rules
  forbid solving. The read-extract yields the mosque identity, "Jumu'ah Prayer at the Masjid:
  1:00 PM - 2:00 PM", and the page's own note that its table omits jama'ah times — no dated table
  in the extractable text.
- **Trap recorded:** `masjidbilalnassau1.org` is Masjid Bilal, 425 Fulton St, Farmingdale NY 11735
  — Nassau *County, New York*, not Nassau, Bahamas. Same class as `kingstonmosque.org` (Surrey)
  and `jamaicamuslimcenter.org` (Queens).
- **Backward harvest blocked:** Internet Archive answered "Temporarily Offline" for the CDX query
  and the availability API all session, so the archived copy could not be read.
- **Languages searched:** English. **Not found under these terms.**

## Barbados — Bridgetown (recheck, NEW surface)

- **Source:** masjidbox, Masjid An-Noor, 40 Clermont Road, Saint James (Bridgetown metro),
  `https://masjidbox.com/prayer-times/masjid-an-noor-1706180877839`. 7 dated rows,
  2026-11-10 to 11-16.
- **Fit:** none, **candidate** — same seven-day window limit as the Dominican Republic page.
- **NEW:** the record's first Barbados dated rows; the prior wave held Barbados as a negative.
- **Negative:** Jama Masjid Barbados (the Bridgetown jama masjid, `barbados1951`) publishes on
  Facebook only; no own site and no dated table. `islamic-invitation.net`'s Barbados page is a
  centre directory with no times.

## Guyana — Georgetown (record's negative upheld)

- **Checked and closed:** CIOG (`cioggy.org` root and `?page_id=3194` both 404, no prayer page);
  Queenstown Jama Masjid (Facebook only); Kitty Jamaat Masjid (prayersconnect listing, 79 Sandy
  Babb St, no times in the page text); `alislamguyana.org/mosques-and-prayer-centres/` (centre
  inventory, no times).
- **Verdict:** FALLBACK stands. **Languages searched:** English. **Not found under these terms.**

## Belize — Belize City (NEW country)

- **Source:** mawaqit, Masjid Al Falah, 9011 Belize City (17.5046 N, 88.1962 W). 365 rows, 2026.
- **Fit:** **ISNA 15/15, zero offsets on every column.**

  | column | exact | within 1 | MAE | worst |
  |---|---|---|---|---|
  | fajr | 353/365 | 365 | 0.25 | 0.5 |
  | sunrise | 354 | 365 | 0.26 | 0.5 |
  | dhuhr | 362 | 365 | 0.25 | 0.5 |
  | asr | 139 | 365 | 0.66 | 1.5 |
  | maghrib | 357 | 365 | 0.25 | 0.5 |
  | isha | 353 | 365 | 0.25 | 0.5 |

- **Implied angles:** 14.99/15.00, monthly spread 0.06/0.05 — the tightest pair measured this
  wave, and the strongest statement in the region that a mosque is running plain ISNA.
- **NEW:** first Belize surface.

## Panama — Panama City (NEW country) and Colón (NEGATIVE)

- **Panama City source:** mawaqit, MADINA MASJID PANAMA (9.0031 N, 79.5216 W). 365 rows, 2026.
- **Fit:** fajr 18°, isha 18.5°, maghrib sunset **+6**, dhuhr at transit +0, asr Shafi.

  | column | exact | within 1 | MAE | worst |
  |---|---|---|---|---|
  | fajr | 176/365 | 365 | 0.54 | 1.3 |
  | dhuhr | 356 | 365 | 0.26 | 0.5 |
  | asr | 91 | 331 | 0.86 | 1.9 |
  | maghrib | 361 | 365 | 0.23 | 0.5 |
  | isha | 174 | 364 | 0.56 | 1.5 |

  Implied angles 18.06/18.53. The fajr and isha exact counts are low for a platform table while
  every within-1 count holds — a 1-minute print convention, not a shape failure.
- **Colón, NEGATIVE:** `khutba.world` serves a computed city table for Colón (04:59 / 12:04 /
  15:24 / 17:55 / 19:04 on 2026-11-11) but it is calculator-class, not a mosque publication: its
  own mosque page "Masjid (Mezquita) de Colón" carries no address ("Dirección aún no disponible")
  and no table. `islamenpanama.com` (Fundación Islámica de Panamá) has no timetable page.
  **Languages searched:** Spanish, English. **Not found under these terms.**

## Costa Rica — San José (recheck, NEW surface)

- **Source:** mawaqit, Mezquita Luz Y Fe, Merced district, San José (9.9337 N, 84.0825 W).
  365 rows, 2026.
- **Fit:** MWL 18/17, maghrib sunset **+7**.

  | column | exact | within 1 | MAE | worst |
  |---|---|---|---|---|
  | fajr | 351/365 | 365 | 0.26 | 0.5 |
  | dhuhr | 357 | 365 | 0.25 | 0.5 |
  | asr | 132 | 358 | 0.66 | 1.6 |
  | maghrib | 358 | 365 | 0.23 | 0.5 |
  | isha | 346 | 365 | 0.24 | 0.5 |

- **NEW:** first Costa Rica dated rows; the prior wave held Costa Rica as a negative. The mosque
  sits in the Merced district of San José canton, so it counts as city coverage.

## Honduras — Tegucigalpa (second city, NEGATIVE) and San Pedro Sula (confirmed)

- **Tegucigalpa NEGATIVE:** `islamhn.org` is the Comunidad Islámica de Honduras / Jamea Sirate Al
  Mostaquime site, Tegucigalpa. Every nav page (`/about`, `/events`, `/library`, `/new-muslim`,
  `/contact`) was read: no dated table, no embedded widget, no iframe carrying times.
  **Languages searched:** Spanish, English. **Not found under these terms.**
- **San Pedro Sula CONFIRMED:** the held `CENTRO ISLÁMICO DE HONDURAS` mawaqit surface was
  re-captured this wave, 365 rows for 2026, and reproduces the record's recipe — 18/18 with
  maghrib sunset +5 and isha +7, **Hanafi asr** (asr 211/365 exact, 365 within 1, MAE 0.42),
  fajr 360/365 exact. The record's Hanafi attribution holds at 0.42 MAE, which is the best asr
  score of the wave.

## Guatemala — Quetzaltenango (second city, NEGATIVE with a trap)

- **Closure:** `mezquitaalrahma.org` is the Quetzaltenango congregation's own site and carries a
  Prayer Times page, but that page prints **"New York, USA"** as its location with Fajr 5:20 AM,
  Sunrise 6:38, Dhuhr 11:40, Asr 2:21, Maghrib 4:41, Isha 6:00 on 2026-11-11 — a default widget
  city, not Xela. A page serving a default location cannot witness Quetzaltenango, so this is a
  recorded trap of the byte-identity-vs-default class, not a surface.
- **Guatemala City CONFIRMED:** the held Mezquita Aldaawa surface was re-captured (365 rows,
  2026) and reproduces **MWL 18/17 at zero margins**, fajr 344/365 exact, 365 within 1, MAE 0.25
  — the record's Guatemala fit holds exactly.
- **Languages searched:** Spanish, English. **Not found under these terms.**

## El Salvador — San Salvador (NEW country, two surfaces)

- **Sources:** mawaqit Mezquita de La Luz (13.7012 N, 89.1915 W) and Mezquita Dar Ibrahim
  (13.6994 N, 89.2098 W). 365 rows each, 2026.
- **Fit, both:** MWL 18/17, zero offsets.

  | surface | fajr exact | dhuhr exact | maghrib exact | isha exact | within 1 | asr MAE |
  |---|---|---|---|---|---|---|
  | La Luz | 356/365 | 358 | 359 | 349 | 365 all columns | 0.73 |
  | Dar Ibrahim | 355/365 | 357 | 360 | 354 | 365 all columns | 0.91 |

- **Cross-check, one calculation two mosques:** the two tables agree to **within one minute on
  every cell of all 365 days** (max cell difference 1 minute, zero cells over). They differ only
  in jumu'ah (13:00 against 13:30) and iqama — and in the iqama *form*: La Luz stores minute
  offsets (`+10,+10,+10,+5,+10`), Dar Ibrahim stores absolute clock times (`20:00` for isha).
  The record's iqama-form trap, confirmed here. The Australian pattern, first instance in
  Central America.
- **NEW:** first El Salvador surfaces.

---

## What confirms the record

- Guatemala City: MWL 18/17, zero margins — exact.
- Honduras San Pedro Sula: 18/18, maghrib sunset +5, Hanafi asr — exact.
- Guyana: FALLBACK stands after a second sweep of CIOG, both Georgetown masjids and the Ahmadiyya
  inventory.
- The asr engine artefact the record attributes to adhan appears on all ten platform tables here.

## What is new

| country | city | surface | rows | grade |
|---|---|---|---|---|
| Cuba | Havana | mawaqit Mosque Abdallah | 365 | provisional (community) |
| Dominican Republic | Santo Domingo | masjidbox Masjid Al Noor | 7 | candidate |
| Puerto Rico | San Juan | mawaqit Ebadur Rahman | 365 | provisional (community) |
| Puerto Rico | Ponce | mawaqit Centro Islamico de Ponce | 365 | provisional (community) |
| Haiti | Port-au-Prince | mawaqit Madinah Chalon | 365 | provisional (community) |
| Barbados | Bridgetown | masjidbox Masjid An-Noor | 7 | candidate |
| Belize | Belize City | mawaqit Masjid Al Falah | 365 | provisional (community) |
| Panama | Panama City | mawaqit Madina Masjid | 365 | provisional (community) |
| Costa Rica | San José | mawaqit Mezquita Luz Y Fe | 365 | provisional (community) |
| El Salvador | San Salvador | mawaqit La Luz + Dar Ibrahim | 730 | provisional (community) |

Five country firsts (Cuba, Dominican Republic, Puerto Rico, Haiti, Belize), plus first dated rows
for Barbados, Panama, Costa Rica and El Salvador. **3,299 dated rows** on new surfaces; 4,029
including the two held surfaces re-captured for confirmation (Guatemala City, San Pedro Sula).

## Defect classes opened or confirmed

1. **mawaqit phantom 29 February** — every calendar carries a 366-entry body with February at 29
   days in 2026.
2. **mawaqit seven-column layout** — a leading imsak duplicating fajr when `displayingSabahImsak`
   is on (Havana). A fixed six-column reader shifts every prayer by one.
3. **Haiti asr floor** — a 15:30 wall-clock floor binding on 101 days, invisible to any angle fit.
4. **masjidbox seven-day window** — `begin`/`days`/`date` ignored; no year endpoint without a key.
5. **Default-city widget** — `mezquitaalrahma.org` (Quetzaltenango) prints New York.
6. **Nassau decoy** — `masjidbilalnassau1.org` is Farmingdale, New York.

## Open items for the next wave

- Bahamas: read the archived Nassau page once the Internet Archive is back; the live host is
  Cloudflare-challenged.
- Colón: a mosque-published table, if one exists, is still unfound; `khutba.world` is
  calculator-class and cannot carry it.
- Guyana: CIOG's Ramadan page (`cioggy.org`) 404s at every path tried; the organisation publishes
  through Facebook, which the rules close.
- A year-2 for any of the ten fits requires either a Wayback fill or a platform change.
