# O1l-33 — Central Africa, city-level round two

Wave O1l-33. Captured 2026-11-11. Workspace `$HOME/athan-gitree/census/o1l-city/O1l-33/`.
Territory: Cameroon, Chad, Central African Republic, DR Congo, Congo-Brazzaville, Gabon,
Equatorial Guinea. Nothing in the repository was touched.

## Headline

Eleven dated surfaces banked, 4,015 rows, every one a full 365-day 2026 calendar from a mosque
page on mawaqit.net. Two countries enter the record for the first time (Congo-Brazzaville,
Equatorial Guinea). Three cities are new (Ngaoundéré, Port-Gentil, Brazzaville, Malabo — four).
Two corrections land on held objects: the Cameroon anchor is not a Douala table, and one Goma
mosque carries an angle pair the record never had. One platform capability is refuted: mawaqit's
calendar PDF accepts a `year` parameter and relabels the current table without recomputing it.

## Method

Discovery was search-led. TinyFish handled every query; `site:` operators worked, quoted phrases
did not. Languages searched: French, English, Spanish, Arabic, plus Sango phrasings for Bangui.
Platforms probed directly: mawaqit, masjidbox, masjidal, athanplus, prayersconnect.

What closed each enumeration route:

- mawaqit's own API is auth-walled (`api/2.0/mosque?...` returns 401), its `sitemap.xml` 404s
  behind the SPA shell, and the anonymous surface is uuid-scoped (`.../mosque/{uuid}/weather`).
- masjidbox serves a static sitemap only; `masjidbox.com/prayer-times/{slug}` 404s for every
  slug tried, and `api.masjidbox.com/.../landing/athany/{slug}` returns 401.
- masjidal has no public mosque directory (`/api/v1/masjid/search` 404).
- DuckDuckGo's HTML endpoint returns 202 (challenge), Bing returns a JS shell.
- Wayback CDX domain-wide on mawaqit.net times out (504); per-URL CDX works.

Extraction: the mosque page embeds `confData` with a twelve-month calendar, month keys 0-based.
Every capture passes a live-page gate: the 11 November row equals the page's own `times_today`
on all eleven surfaces.

Second artifact: `https://mawaqit.net/fr/calendar/{uuid}.pdf?year=YYYY` renders a twelve-page
Hijri-dated printable calendar. For N'Djamena the PDF and the page JSON agree 365/365 — one
generation, two formats. The `year` parameter is refuted below.

Fit engine: the PrayTimes-v2 family engine at `o1f-london/praytimes.cjs`, timezone pinned as a
fixed offset per country (none of these seven countries observes DST), no clock reads, dates
built from the literal captured strings, nearest-minute rounding chosen on the parameter-free
sunrise column. adhan 4.4.6 was run first and reproduced the same recipes with the known
platform-family residuals (a −1 to −5 minute seasonal asr skew); the PrayTimes engine drives
sunrise, dhuhr and maghrib to 365/365 exact on eight of eleven surfaces, which is the
platform-engine class the brief names.

## Per city

### Cameroon

**Ngaoundéré — NEW CITY, one surface, 365 rows.** Three mosque pages sit in the city:
`SABONGARI` (7.3425339/13.5957596), `G M MBAMYANGA` (7.301163/13.578473), `ALH ADAMOU`
(7.3381488/13.5668302), all `Africa/Douala`. The three tables are byte-identical across all 365
days: three labels, one computed generation. Recipe: fajr 18.00, isha 17.00 (MWL), asr Shafi,
maghrib sunset + 3. Every column within 1 minute on 365/365 days, worst −1.
Print quirk: 2026-08-24 prints sunrise `04:59` where the day either side prints `05:59`, a −60
single-day artifact present in all three copies.
Tier: community (mosque-operated platform page).

**Douala — CORRECTION, the held surface is not Douala.** `ar-rahma-mosque-27000-douala-cameroon`
publishes lat 7.3668461828255, lon 12.353345622149. That is the Adamawa region, roughly 330 km
east-north-east of Douala (−4.0511/9.7679), and the table is computed for those coordinates:
on 2026-11-11 it prints dhuhr `11:55` and sunrise `06:00`, where Douala's own solar noon gives
`12:05` and sunrise `05:54`. The recipe on its published coordinates is MWL 18/17, asr Shafi,
maghrib sunset + 0, with fajr, sunrise, dhuhr, maghrib and isha all 365/365 exact.
Consequence for the record: Cameroon's held anchor is an Adamawa table under a Douala label.
The rows are banked under `CM-douala-arrahma-pagecoords-2026.json`, named for what they are.

**Yaoundé, Bamenda, Bafoussam, Garoua, Maroua, Buea, Kumba — negative.** See negatives.

### Chad

**N'Djamena — CONFIRMED plus a new artifact.** `مسجد أبو بكر الصديق - أم سنينة`,
12.1191352/15.0502875, 365 rows for 2026. Recipe: fajr 18.00, isha 17.00, asr Shafi, maghrib
sunset + 0, all six columns 365/365 exact. The mosque's twelve-page PDF calendar is saved at
`captures/td-ndjamena-calendar-current.pdf` and matches the JSON 365/365.
The CSAI Ramadan sheet remains Abéché and Biltine only; nothing new there. No second N'Djamena
mosque was found on any platform, so the capital still rides one mosque page.

### Central African Republic

**Bangui — CONFIRMED DEFECT, no usable athan table.** `Mosquée saina Youssuf`, 4.3585649/18.5373133,
365 rows. Fajr 15.00, isha 15.00, sunrise and maghrib exact 365/365. Dhuhr is a fixed clock:
solar noon + 74 minutes median, only 15/365 exact, worst +17. The table is an iqamah schedule,
not an athan one, and CAR stays FALLBACK.

### DR Congo

**Goma — CONFIRMED, and one new recipe.** Two held mosques re-captured, both 365 rows, both
gated.
`Taqwa (IBB)` −1.6790343704734/29.227846562862: MWL 18/17, asr Shafi, five columns 365/365 exact.
`Daaru-ssalaam` −1.6737319296932/29.217226877693: fajr **19.50**, isha **17.50**, asr Shafi,
fajr, sunrise, dhuhr, maghrib and isha all 365/365 exact. This is the first non-MWL pair the
record holds in Central Africa and it reproduces at zero margins.

**Kinshasa, Lubumbashi, Bukavu, Kisangani — negative.** Kinshasa (17 M) still has no platform
page on any of the five platforms, and no mosque own-site with a timetable.

### Congo-Brazzaville — NEW COUNTRY

Absent from `world-table-v2.md` entirely; this wave gives it its first surface.

**Brazzaville — NEW, 365 rows.** `Mosquée Houriya` −4.2744405/15.2812803. Recipe: fajr ≈12.3°,
isha ≈18.19°, asr factor 0.955, maghrib sunset + 4; sunrise, dhuhr and maghrib exact 365/365,
fajr 351/365 within 1, isha 307/365 exact.
DEFECT: the published dhuhr sits 60 minutes after the table's own solar noon (2026-11-11 prints
`12:43`; solar noon is `11:43`) while sunrise and sunset are correct to the minute. The column
is internally inconsistent by one hour and must not be read as an athan time.

**Pointe-Noire — negative.**

### Gabon

**Libreville — CONFIRMED.** `Kinguélé` (0.3988759/9.4710900) and `Plein-Ciel / Bellevue 3`
(0.3953545/9.4760), two distinct tables, 365 rows each, both MWL 18/17 with asr Shafi and all
columns exact on 365/365 (asr within 1). Second city for the country.

**Port-Gentil — NEW CITY, 365 rows.** `Mosquée du Roi Faisal` −0.7275552/8.7825388. MWL 18/17,
asr Shafi, fajr, sunrise, dhuhr, maghrib and isha 365/365 exact.

### Equatorial Guinea — NEW COUNTRY

Untouched by the record until this wave.

**Malabo — NEW, 365 rows.** Page name `Maison de la famille Obama`, 3.755/8.782, `Africa/Malabo`.
MWL 18/17, asr Shafi, five columns 365/365 exact. The page name is a registry label, not a
publisher claim; the coordinates are Malabo and the table is computed for them.

**Bata — negative.**

## Fit summary

One recipe per surface, whole 2026 span, 365 days each. Columns read exact/within-1/worst.

| City | Surface | fajr | isha | asr | dhuhr | maghrib | fajr | sunrise | dhuhr | asr | maghrib | isha | amp |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| N'Djamena | Abu Bakr Siddiq | 18.00 | 17.00 | Shafi | +0 | +0 | 365/365/0 | 365/365/0 | 365/365/0 | 120/365/−1 | 365/365/0 | 365/365/0 | 52 |
| Malabo | Obama family house | 18.00 | 17.00 | Shafi | +0 | +0 | 365/365/0 | 365/365/0 | 365/365/0 | 217/365/−1 | 365/365/0 | 365/365/0 | 24 |
| Libreville | Kinguélé | 18.00 | 17.00 | Shafi | +0 | +0 | 365/365/0 | 365/365/0 | 365/365/0 | 246/365/−1 | 365/365/0 | 365/365/0 | 13 |
| Libreville | Bellevue 3 | 18.00 | 17.00 | Shafi | +0 | +0 | 365/365/0 | 365/365/0 | 365/365/0 | 165/365/−1 | 365/365/0 | 365/365/0 | 13 |
| Port-Gentil | Roi Faisal | 18.00 | 17.00 | Shafi | +0 | +0 | 365/365/0 | 365/365/0 | 365/365/0 | 119/354/−2 | 365/365/0 | 365/365/0 | 10 |
| Goma | Taqwa (IBB) | 18.00 | 17.00 | Shafi | +0 | +0 | 365/365/0 | 365/365/0 | 365/365/0 | 254/365/−1 | 365/365/0 | 365/365/0 | 8 |
| Goma | Daaru-ssalaam | 19.50 | 17.50 | Shafi | +0 | +0 | 365/365/0 | 365/365/0 | 365/365/0 | 231/365/−1 | 365/365/0 | 365/365/0 | 7 |
| Douala label (Adamawa coords) | Ar-Rahma | 18.00 | 17.00 | Shafi | +0 | +0 | 365/365/0 | 365/365/0 | 365/365/0 | 125/363/−2 | 365/365/0 | 365/365/0 | 35 |
| Ngaoundéré | SABONGARI | 18.00 | 17.00 | Shafi | +0 | +3 | 336/365/−1 | 327/364/−60 | 338/365/−1 | 330/365/−1 | 338/365/−1 | 332/365/−1 | 35 |
| Brazzaville | Houriya | 12.30 | 18.19 | 0.955 | +60 | +4 | 113/351/−2 | 365/365/0 | 365/365/0 | 192/320/+3 | 365/365/0 | 307/365/−1 | −1 |
| Bangui | saina Youssuf | 15.00 | 15.00 | Shafi | +74 | +0 | 365/365/0 | 365/365/0 | 15/44/+17 | 132/363/−2 | 365/365/0 | 365/365/0 | 26 |

Amplitude is the January-to-July fajr span in minutes. Near-equator surfaces swing 7 to 35
minutes; N'Djamena at 12.1 N swings 52, the widest in this set. Nothing here approaches the
high-latitude class.

## Span ceiling and longevity

One published cycle per surface: calendar year 2026, 365 rows, 4,015 rows total. No surface
serves a second year.

- Backward: `?year=2024` and `?year=2025` on the calendar PDF both return 404.
- Forward: `?year=2027` returns a twelve-page PDF headed 2027 whose 365 rows are **identical,
  row for row, to the 2026 table** on all ten surfaces tested. 2028 and later return 404.
  The parameter relabels dates without recomputation, so it is a frozen generation and not
  forward data. No `proven-to-2027` claim is made.
- Wayback holds exactly one snapshot of one of these pages (N'Djamena, 2025-06-18) and it is a
  JavaScript stub with no calendar in the payload. Year-2 by archive: negative.

Consequence: every surface here is provisional at best on span, and none can be lifted to A by
this wave. Between-year stability is untestable, not stable.

## Corrections to the record

1. **Cameroon's anchor is mislabelled.** The held Ar-Rahma "Douala" table is computed for
   lat 7.3668, lon 12.3533, and differs from Douala by +6 minutes on sunrise and −10 on dhuhr.
2. **Goma Daaru-ssalaam is 19.50/17.50**, not MWL. A second angle pair now exists in the record
   for DR Congo.
3. **Ngaoundéré's three mosque pages are one table.** Byte-identical, so they count once.
4. **Brazzaville's dhuhr is one hour late against its own sunrise and sunset.**
5. **Ngaoundéré 2026-08-24 sunrise is a −60 single-day artifact** in all three copies.
6. **mawaqit's PDF `year` parameter is a relabel, not a render.**

## Honest negatives

Recorded with the languages and phrasings used and how the surface closed.

| City | Languages searched | What closed it |
|---|---|---|
| Yaoundé, CM | French, English | mawaqit `site:` and direct queries return only a Senegal mosque whose slug reads "waounde"; no Yaoundé mosque page on mawaqit, masjidbox, masjidal or athanplus. Grande Mosquée de Yaoundé has no domain, only TripAdvisor and Instagram location pages. |
| Bamenda, CM | English, French | No platform page. Only calculators (quranmajeed, muslimpro, prayertimes.date, al-hamdoulillah) and a CRTV news video. |
| Bafoussam, CM | French | No platform page; queries return Comoros, Mayotte and French mosques. |
| Garoua, Maroua, CM | French, English | Grande Mosquée de Garoua exists (Cameroon Tribune, trip.com) with no timetable; Maroua returns Dresden and Tunisia mosques. |
| Buea, Kumba, CM | English | No platform page. |
| Moundou, Sarh, Abéché, TD | French, Arabic | No platform page for Moundou or Sarh. Abéché and Biltine stay as the held CSAI Ramadan image, unchanged. |
| Bangui, CF | French, Sango, English | Only one Bangui mosque page exists and its dhuhr is a fixed clock. Grande Mosquée de Bangui has no domain. |
| Kinshasa, CD | French, English, Arabic | No mawaqit, masjidbox, masjidal or athanplus page. Grande Mosquée de Kinshasa appears only in mapcarta, TripAdvisor and YouTube. Université Islamique de Kinshasa publishes nothing dated. |
| Lubumbashi, Bukavu, Kisangani, CD | French, English | No platform page; every result is a calculator. |
| Pointe-Noire, CG | French, English | No platform page; calculators and a Trip.com attraction page only. |
| Bata, GQ | Spanish, French | No platform page; calculators only (islamicfinder, horarios-salat, muslimpro). |

Every negative above is "not found under these terms", never a completeness claim.

## Artifacts

- `captures/mawaqit-*.html` — 13 raw mosque pages, 59 to 67 KB each, `confData` intact.
- `captures/td-ndjamena-calendar-current.pdf` — the mosque's twelve-page printable calendar.
- `captures/*-calendar-2027.pdf` — ten relabelled 2027 PDFs, the evidence for the refutation.
- `captures/cdx-mawaqit-kinshasa.txt`, `captures/probe-*.html` — closed routes, kept as evidence.
- `data/*-2026.json` — eleven normalized city files in the brief's
  `{'YYYY-MM-DD': {fajr, sunrise, dhuhr, asr, maghrib, isha}}` shape.
- `data/mawaqit-*.json` — parsed page payloads with coordinates, timezone and the live-page gate.
- `data/fit-all.json` — the fit for all eleven surfaces.
- `data/relabel-2027/` — the ten 2027 PDFs parsed, held only as the relabel evidence.
- `mawaqit.mjs`, `fit-pt.mjs`, `fit.mjs`, `normalize.mjs`, `harvest-2027.py` — the tooling.
