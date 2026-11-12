# O1n-30 REPORT — the Americas' thin half: South America, Central America and the Caribbean remainder

Wave O1n-30, round four (o1n), session three, 2026-11-12. Workspace
`$HOME/athan-gitree/census/o1n/o1n-30-americas/`. Engine for every fit: adhan 4.4.6
(`census/adhan-build/node_modules/adhan`), `Rounding.None`-equivalent nearest-minute,
timezone pinned per surface, dates from literal capture strings, nothing reads the real
clock into data. Public pages only; no login, registration, forms or challenges. Every
raw artifact under `captures/` gzipped in place; derived rows and fits under `data/`.
Images and PDFs through the local macOS Vision fast binary only. The repository is
never written. The standing exclusion applies at runtime and the excluded place is
never named anywhere in this workspace. Timestamps UTC.

Held lines inherited, never redone: Chile (o1n-11 grade-A span), Santa Cruz and La
Paz resolutions, Maracaibo/Caracas one-publisher rule, the seven muslimsalat
Caribbean rows (o1n-7), the Fazilet family per-country rows, El Bolon and Ushuaia
banked negatives (o1n-11, not reopened), the o1n-11 Colombia/Bogota routes.

## 1. Suriname — SURINAME-SMA-29: the Surinaamse Moeslim Associatie's own monthly sheet, OCR-banked and fitted (29 dated rows)

The SMA (Ahle Sunnat Wal Djama'at, Kankantriestraat 32-40, Paramaribo) publishes its
salat timings on `smawebsite.com/salat-timings/` as a featured monthly image. The live
page carries one sheet: `wp-content/uploads/2025/05/mei-2025.jpg` — "MEI 2025 / DZUL
QADA 1446, Tabel Namaaztijden Paramaribo / Nickerie".

- **Extraction**: full-page OCR scrambles the dense 11-column print, so the sheet was
  sliced by its 13 measured vertical rules and 29 measured row rules; every cell was
  re-read individually at 4x, and the 4 cells the fast reader missed were recovered by
  binarised re-reads at threshold 190/200 (each fill recorded in
  `data/sr-sma-mei-2025-rows.json`). Nothing substituted.
- **Rows**: 29 (2025-04-29..2025-05-27; the sheet covers Apr 29 + May 1-27 with the
  civil and Hijri columns both printed and row-aligned).
- **Fit** (adhan 4.4.6, Paramaribo 5.8520,-55.2031, America/Paramaribo UTC-3 fixed):
  fadjr 18.0 deg margin 0 (96.6 exact, 100 within-1, worst 1); sehri = fadjr - 5
  (print constant); zonop sunrise +1; lohr dhuhr +0; makroeh dhuhr -37 median
  (print -36/-37 mixed; interval-vs-altitude rule unresolved); ishrar maghrib -106
  median (print zonder -104/-105 mixed); zonder sunset -2; maghrib print zonder +5
  constant; isha sunset +73 (print zonder +75 constant), 100 within-1 everywhere,
  worst 1 on every column. The djamaat AZAAN/FARZ clock block is recorded never
  fitted. The sheet's own city adjustments print in its header (Nw Nickerie +8,
  Wageningen +6, Nieuw(?)loen -3, Albina -5).
- **Verdict**: candidate (one published cycle, one month); tier community (national
  association's own print).
- **Second-year routes, all dead**: Wayback holds zero captures for the whole
  smawebsite.com domain (two CDX queries, both empty); the live upload tree answers
  404 for 19 probed month-name files around mei-2025; the page's featured image is the
  only served month. Facebook lead: "Namaaz tijdtabel voor Paramaribo Jan/Feb 2021",
  page id 100064839722286, login-walled, named lead only.

## 2. Trinidad — TT-DARULULOOM-365: the Darul Uloom's own plugin tables, full 2026, fitted (365 dated rows)

The Darul Uloom Trinidad and Tobago (est. 1984, Cunupia; Deobandi/Hanafi institute of
higher Islamic studies) runs the WordPress "daily-prayer-time-for-mosques" plugin.
Its AJAX endpoint `wp-admin/admin-ajax.php?action=get_monthly_timetable&month=N&display=table`
serves full monthly dated tables (Begins/Jamah pairs per prayer plus sunrise).

- **Walk**: months 1..12 of 2026 fetched (12 spaced requests, zero failures), parsed
  to 365 dated rows 2026-01-01..2026-12-31 (`data/tt-darululoom-rows.json`).
- **Fit** (Cunupia 10.4766,-61.3833, America/Port_of_Spain UTC-4 fixed): fajr 19.5 deg
  +7 min (85.8 exact, 100 within-1, worst 1); isha 17.5 deg +3 min (72.1 exact, 100
  within-1, worst 1); asr Hanafi +1 min (97.5 within-1, worst 2; Shafi refuted at
  +65 median); sunrise +1, dhuhr +6, maghrib +4 (all rounding-class, 100 within-1,
  worst 1).
- **Verdict**: provisional (one published cycle); tier community (national
  institute's own platform, named publisher).
- **Second-year routes, dead by mechanism**: the endpoint is year-locked to the served
  year (`year=` ignored, month=11 always answers November 2026); Wayback holds no
  `get_monthly_timetable` query captures (admin-ajax captures are bare/error bodies
  only, 347-475 B); the archived homepages carry single-day widgets only.
- Named lead: ASJA (Anjuman Sunnat-ul-Jamaat Association, asja1935 on Facebook, the
  largest T&T organisation) login-walled.

## 3. French Guiana — GF-A2CMGF-1439: the A2CMGF's own multi-city, multi-year parameter-driven tables, fitted (1,439 dated rows) — grade A

The Association Culturelle et Caritative des Musulmans de Guyane Francaise (Mosquee
Assalam, Cayenne) serves dated tables at
`a2cmgf.fr/horaires-priere?ville={cayenne|kourou|saint-laurent}&mois=N&annee=YYYY`
(server-rendered HTML; no login).

- **Walk**: 3 cities x months {Jan, Apr, Jul, Oct, Nov} x years {2025, 2026, 2027}
  plus Cayenne probes 2024-01 and 2030-07; 1,439 dated rows
  (`data/gf-a2cmgf-rows.json`); every served month row-complete against the civil
  calendar.
- **Fits** (adhan 4.4.6, America/Cayenne UTC-3 fixed): Cayenne (4.9360,-52.3300):
  fajr 15.25 deg +1, isha 14.75 deg +1, sunrise/dhuhr/maghrib margin 0, exact
  93.7-99.4, within-1 100, worst 1 across 521 rows spanning 2024..2030. Kourou
  (5.1622,-52.6492): 15/15 deg, margins 0, exact 97.6-99.8, within-1 100, worst 1.
  Saint-Laurent-du-Maroni (5.5012,-54.0288): 15/15 deg, margins 0, exact 98.3-99.1,
  within-1 100, worst 1. One recipe reading: the 15/15 zero-margin family
  country-wide; Cayenne's 15.25/14.75+1 is the same family at its rounding edge.
- **Recompute proven**: jan2024 vs jan2025 moves 24 of 31 rows; jul2025 vs jul2030
  moves 14 of 31; jan2025 vs jul2025 differ 31 of 31. Genuine per-year recomputation,
  parameters frozen, NOT a frozen template. Cayenne's fajr per-year within-1 is 100 in
  all five distinct fitted years (2024, 2025, 2026, 2027, 2030).
- **Seasonal amplitude**: fajr Jan ~05:36-05:41 vs Jul ~05:19-05:20 (about 20 min);
  near-equator flatness as the fit rules require reported.
- **Verdict**: grade A (three distinct fitted recomputed years on one recipe per
  city); tier community (association's own platform).
- masjidbox "mosquee-de-cayenne" and the mawaqit "Abou Bakr Cayenne" install exist as
  platform mirrors of the same community layer; recorded, never blended.

## 4. Guyana — honest negative

CIOG's domains are dead or hollow: `ciog.org.gy` DNS-dead from this host (curl 000,
TinyFish invalid_url), `cioggy.org` 404 on the home and the Ramadan page id. The
Guyana Islamic Trust posts monthly charts on Facebook only ("Fajr Zuhr Asr and Isha
same time every day for the month"), login-walled. The Guyana Muslim Scholars
Association salaah chart rides CIOG's Facebook (post 955803296642117), login-walled.
`masjidbox.com/prayer-times/guyana/georgetown` answers 200 but is a 3.8 KB JS shell
(the URL pattern is a catch-all, not per-city indexing). Platform calculators only
beyond the held layer. Languages: English. Named leads: CIOG Facebook, GIT Facebook.

## 5. Panama — PA-JAMA-TODAYROW (open door), one dated row banked as evidence

The Fundacion Islamica de Panama / Mezquita Jama (since 1982) server-renders a dated
one-day widget on `islamenpanama.com/mezquita-jama/`: 2026-11-11, 1 Jumada-Al-Thani
1448, Fayr 4:58 AM, Amanecer 6:10, Dzhuhr 12:02 PM, Asr 4:16 PM, Maghrib 5:54 PM,
Isha 7:02 PM. The page and post sitemaps carry no monthly table; the widget is the
mihrab.ru class (one dated row = evidence, not a dataset; daily accumulation is the
route). Panama City plausibility gate: dhuhr prints transit-0.5 at (8.98,-79.53). The
Fundacion's Instagram and a Facebook post class carrying monthly horarios images
("CentroIslamico Mes de Junio") are named leads, login-walled. Fazilet Panama (19
cities), tawkit Villa Caceres and the mawaqit installs stand as held/platform.

## 6-13. Central America remainder — negatives with routes

All six fronts resolved without an own-site dated surface. Every route named below was
searched in the listed language; every login-walled presence is a named lead, never a
fetch; the held Fazilet rows stand for each front.

- **Costa Rica**: Mezquita Omar / Centro Cultural Musulman de Costa Rica (Calle
  Blancos, San Jose) is Facebook/Instagram only; its "horarios de congregacion" post
  is a jamaat clock list (never data). Platforms only. Spanish, English.
- **Honduras**: the San Pedro Sula Mosque (Islamic Centre of Honduras) has press,
  Wikipedia and mosqpedia entries and no own site; Tegucigalpa's smaller mosque has no
  table either. Platforms only. Spanish, English.
- **Nicaragua**: the Mezquita de Managua holds a mawaqit install (current-year tenant
  class, no public year axis); Facebook explanatory posts only. Spanish.
- **El Salvador**: no centre-specific surface at any tier above platforms under the
  searched Spanish terms ("Centro Islámico de El Salvador horarios de oración", and
  variants). Spanish.
- **Guatemala**: no mezquita-specific site surfaced under Spanish terms; platforms
  only. Spanish.
- **Belize**: Islamic Mission of Belize (Masjid Al-Falah) Facebook group and the
  Ahmadiyya Baitul Lateef Mosque YouTube inauguration only; muslimsalat Belize City
  (o1n-7) stands. English, Spanish.

## 14-23. South America interior and the Caribbean remainder — negatives with routes

- **Colombia** (second consecutive wave): Mezquita Umar ibn al-Jattab Barranquilla and
  Mezquita de Maicao hold Facebook/TikTok presences only, no own site surfaced;
  o1n-11's routes stand. Spanish, English.
- **Ecuador**: `islamec.org` (Centro Islamico del Ecuador, Mezquita Assalam, Quito)
  walked whole — a Blogger news site with no prayer page; its Ramadan 2026 post is an
  announcement without a timetable. Mezquita Khaled Ibn Al-Walid (Quito) is
  Facebook/YouTube only. The o1n-11 "app mirrors only" line stands. Spanish, English.
- **Peru interior**: Islamic Center of Arequipa is a zabihah listing only; Cusco and
  Trujillo platform-only. The Lima mapping (o1n-11) stands. Spanish, English.
- **Bolivia interior**: the Centro Islamico Boliviano's Facebook post carries a
  horarios image naming the principal mosques (Al Omarein SCZ among them) —
  login-walled, named lead. Cochabamba's mosque is press-reported, no site. Spanish.
- **Venezuela interior**: Mezquita Alquds Ash-Sharif (Naguanagua, Valencia) is an
  Instagram reel only; Maracay platform-only (incl. a Diyanet namazvakti platform
  page). The Caracas one-publisher rule stands. Spanish.
- **Argentina interior**: the Centro Islamico de Cordoba has no discoverable own site
  (the city tourism page carries no link; Instagram reels only); Mezquita Imam Rida
  Mar del Plata is a researchgate mention. El Bolon and Ushuaia were NOT reopened.
  islam.com.ar is Buenos Aires (outside this front). Spanish.
- **Uruguay**: `centroislamicouruguay.com.uy` fetched whole — educational pages only
  (the salat page is fiqh text, zero tables); two Montevideo musallahs are
  Facebook-group descriptions; Ahmadiyya Uruguay Instagram. Spanish.
- **Paraguay**: Centro Benefico Cultural Islamico de Asuncion is a Facebook group
  mention; Mezquita Del Este (Ciudad del Este) an Instagram location page. Spanish,
  Portuguese.
- **Puerto Rico**: nine mosques per press; Ponce (Mezquita Uthman) and Montehiedra
  (San Juan) hold Facebook posts and zabihah one-day iqamah blocks, no own site.
  Spanish, English.
- **Jamaica**: the Islamic Council of Jamaica is a salatomatic listing, no own site;
  salaahdaily, islamic-prayer-times, rattilha and faseela are platform aggregators.
  English.
- **Cuba beyond Havana**: Mezquita Abdallah (Old Havana, 2015, the only purpose-built
  mosque) has visits-only Facebook/YouTube presence; Santiago de Cuba platform-only.
  Spanish, English.
- **Lesser Antilles**: Jama Masjid and Madina Masjid Bridgetown (Barbados) are
  press/Facebook classes; Aruba's only mosque TikTok-only; no island surfaced an own
  prayer-times site. English, Dutch, Spanish.

## Totals and grades

| front | surface | dated rows | recipe | grade / tier |
|---|---|---|---|---|
| Suriname | SURINAME-SMA-29 | 29 | 18.0/18.0, sehri -5, isha sunset+75, solar per column worst 1 | candidate / community |
| Trinidad | TT-DARULULOOM-365 | 365 | 19.5+7 / 17.5+3, Hanafi +1, solar worst 1 | provisional / community |
| French Guiana | GF-A2CMGF-1439 | 1,439 | 15/15 zero-margin family, three cities | **A** / community |
| Panama | PA-JAMA-TODAYROW | 1 (evidence) | transit-0.5 dhuhr gate | open door |
| 14 fronts | negatives with routes and languages | 0 | - | honest negatives |

Banked dated rows this wave: **1,834** (1,833 in three fitted surfaces plus one
evidence row). Second-year verdicts: Suriname dead (no domain archive, no live
accrual); Trinidad dead by mechanism (year-locked endpoint, no archived query);
French Guiana answer is the A grade itself (five distinct fitted years at Cayenne,
recompute proven by value diffs). The Guyanas front closes: Suriname and French
Guiana both hold own-publisher dated surfaces above the platform layer; Guyana
negative.

Engine, provenance and discipline: adhan 4.4.6 for every fit; coordinates as recorded
per surface; civil zones pinned (America/Paramaribo, America/Port_of_Spain,
America/Cayenne — all fixed-offset, no DST inside any walked span); captures
gzipped in place; Wayback probes one at a time and never retried after a 429 (no 429
was hit this wave; the two smawebsite CDX queries and the darululoomtt CDX queries
returned empty, not blocked); no subagents deployed at any point.
