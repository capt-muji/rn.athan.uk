# O1m-5 Asia province depth (round o1m, wave 5)

Mission: the sub-national layer of the five biggest Asian gaps. Standing orders: `../BRIEF.md`,
`../FIT-RULES.md`. Workspace `$HOME/athan-gitree/census/o1m/o1m-5-asia/`. The repo was not touched.

Status: incremental. Numbers in this file are script-counted from `data/` and `fit/`.

## Headline

- **470,756 dated rows banked** across five fronts, all in `data/` with `data/INDEX.json`.
- **India moves from an eight-city mosaic to a thirteen-city layer.** Eleven new Indian masjidbox tenants were
  found and harvested (7,413 dated rows over 2025-2026 across India; 2,163 more in Pakistan), and
  seven of them fit an exact recipe on both years. Chennai, Pune, Ahmedabad, Jaipur and
  Tiruchirappalli now hold their first dated mosque tables. The isha-17 line is measured at six of
  the new points: **4.29 to 4.88 minutes earlier than 18 degrees, constant across the year**.
- **Indonesia's regency layer is banked on two publishers**: SIHAT at 209 units for 2026 (76,285
  rows) and KHGT at **all 516 second-level units for 2026 and 2027 (376,680 rows)**. KHGT is one
  recipe at every unit, its four clock columns sit at exactly two minutes at all 516, and its
  maghrib pad is an elevation ladder correlated 0.959 with the square root of elevation, which is
  Tunisia's horizon-dip coefficient found again in a second country.
- **Pakistan gains its first platform dated tables** (Rawalpindi, Islamabad, Sialkot) while the
  printed chart family stays closed to this session: the Peshawar and Quetta charts, and every
  other provincial chart held, are image-only PDFs with no text layer. This session has no OCR and
  no vision channel, so the transcription of Faisalabad, Hyderabad PK, Gujranwala, Sargodha and
  the Rawalpindi full year is recorded as blocked, not as absent.
- **Sri Lanka closes at zone depth**: all 13 ACJU zones, 12 monthly tables each, two editions
  (2026 in 7 columns with both asr schools, 2025 in 6 columns with one). Twelve zones reproduce
  all six columns within one minute on a single sweep; the thirteenth is recorded with its residual
  and its offshore implied point. The 2025 and 2026 editions print identical values on every overlapping day at zone 01,
  so the pair is one computed generation, not two years.
- **Vietnam, Cambodia and Laos each gain a first dated mosque table** (Hanoi, Phnom Penh,
  Vientiane). Mongolia and the Philippines remain negative at mosque tier.

## Method

- Every surface was found in local language first, then English, on the platform or the mosque's
  own page; no domain was guessed. Tenant slugs come from `masjidbox.com/prayer-times/<slug>` pages
  whose JSON-LD PostalAddress names the city, so a slug is never read as a location.
- adhan 4.4.6 at `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`, `Rounding.None`, the
  timezone pinned per surface, dates taken from the literal capture strings, no clock read.
- Points are recovered from the table's own angle-free columns (sunrise and transit). A printed
  clock margin is indistinguishable from longitude in that solve, so a +1 minute dhuhr margin moves
  the recovered point about 0.25 degrees west; the margin is reported beside the point.
- Tools: TinyFish for discovery, curl with a browser user agent for capture, agent-browser available
  and used only where a page needed rendering.

## Front 1: India

### New tenants and fits

| tenant | city | point | recipe | 2026 | 2025 |
|---|---|---|---|---|---|
| Thowheed Mosque (`thowheed-mosque`) | Tiruchirappalli | 10.820 / 78.575 | 18 / 17 Shafi, zero margins | 365/365 | 365/365 |
| Ameer Hamza Masjid (`ameer-hamza-masjid`) | Pune | 18.490 / 73.810 | 18 / 17 Shafi, zero | 365/365 | 365/365 |
| Masjid-e-Mohammedia (`masjid-e-mohammedia`) | Chennai | 12.965 / 80.060 | 18 / 17 Shafi, zero | 365/365 | 365/365 |
| Masjid Azezziyyah (`masjid-azezziyyah`) | Chennai | 12.900 / 80.085 | 18 / 17 Shafi, zero | 365/365 | 365/365 |
| Idara Islahul Muslimeen (`idara-islahul-muslimeen`) | Ahmedabad | 23.000 / 72.410 | 18 / 18 **Hanafi**, zero | 365/365 | 365/365 |
| Tekrawali Masjid (`tekrawali-masjid`) | Ahmedabad | 23.020 / 72.465 | 18 / 17 Shafi, fajr +5 | 365/365 | - |
| Mansarovar Masjid (`mansarovar-masjid`) | Jaipur | 26.875 / 75.630 | 18 / 17 Shafi, zero | 365/365 | 365/365 |
| Yaseen (`yaseen`) | Hyderabad | 17.530 / 78.255 | 18 / 17 Shafi, zero | 358/358 | 365/365 |
| Masjid Farhat Habeeb (`masjid-farhat-habeeb`) | Hyderabad | 17.330 / 78.365 | 18 / 18 Shafi, zero | 365/365 | - |

Every fit is all six columns within one minute on every dated row; the 2025 and 2026 tables differ
day for day (6 to 26 percent of common dates move on fajr), so these are two computed years, not a
relabelled edition. Grade **A, community tier**, for the seven that hold both years at zero margins; Tekrawali holds a
single cycle at a fajr pad of five minutes and is provisional.

### Iqamah clocks, not azan tables

- **Anjuman-E-Mohammedi Masjid, Villivakkam, Chennai**: dhuhr sits a constant 50 minutes after
  transit, asr +7, maghrib +5; only 42 of 365 rows come within one minute on all six. Candidate.
- **Masjid-i-Umar, Dalgate, Srinagar**: dhuhr +28, isha +5; 15 of 365. Candidate.
- Both are the same class as the Rampur and Kanpur records already on file: a fixed schedule with
  solar sunrise and maghrib.

### The isha-17 line

Measured at each new point over a full year, 17 degrees against 18:

| point | Jan | Apr | Jul | Oct | mean |
|---|---|---|---|---|---|
| Chennai 12.965/80.060 | 4.32 | 4.25 | 4.63 | 4.12 | **4.33** |
| Chennai 13.000/80.080 | 4.32 | 4.25 | 4.64 | 4.12 | 4.33 |
| Tiruchirappalli | 4.30 | 4.20 | 4.56 | 4.09 | 4.29 |
| Hyderabad | 4.39 | 4.39 | 4.85 | 4.21 | 4.46 |
| Pune | 4.41 | 4.42 | 4.90 | 4.22 | 4.49 |
| Ahmedabad | 4.52 | 4.61 | 5.20 | 4.35 | 4.67 |
| Jaipur | 4.65 | 4.82 | 5.54 | 4.49 | 4.88 |

The finding that stood at four cities in O1l-11r now stands at nine: the 18/17 family prints isha
four to five minutes earlier than 18 degrees, and the gap grows with latitude, not with season.
Bengaluru, Srinagar and the Bihar table stay on 18/18, so both lines are real and neither is the
platform default.

### India cities

Fitted dated surface now held in: Hyderabad, Mumbai, Bengaluru, Kolkata, Srinagar, Ramban,
Moradabad, Baharampur (prior round), plus **Chennai, Pune, Ahmedabad, Jaipur, Tiruchirappalli**
(this round). Lucknow, Kanpur, Nagpur, Delhi and Patna remain negative; Kanpur's only tenant is the
iqamah clock already on file. Further searches for Madurai, Coimbatore, Vijayawada, Visakhapatnam,
Mysuru, Mangaluru, Nashik and Aurangabad returned only non-Indian tenants (Wellington, Luxembourg,
Upper Darby, Helsinki). Under these terms no Indian tenant surfaced for those eight cities; the
record is a negative for the terms, not a closure of the cities.

## Front 2: Indonesia (regency layer)

### SIHAT: 209 second-level units, 2026

Harvested from SIHAT (`bimasislam.kemenag.go.id/api/v1/public/prayer-times`), one full year per
second-level unit, at the unit's own published coordinates, elevation and timezone: **209 units,
76,285 dated rows, zero missing days**. The selection is every one of the 98 kota nationally plus
every second-level unit of Aceh, North Sumatra, West Java, East Java and South Sulawesi; 111 of the
units are kabupaten outside the kota list. Full list and rule: `data/regency-jobs.json`.

Two source defects met on the way:

- The `cities?province_id=` filter is ignored: every per-province response returns all 516 units,
  so units had to be split on `province_id` inside the payload.
- **The timezone field lies for Kupang and Mataram.** Both are published as `Asia/Jakarta` and both
  tables reproduce on WIB at 365 of 365 days, which is the proof: these are WITA cities printed one
  civil hour early. The capital-layer finding now holds at the regency layer by construction.

SIHAT serves 2026 only: 2027-01-15 and 2025-06-15 both return "prayer times not found".

Fit convention carried from the capital layer (20 / 18, Shafi, fajr +2, isha +2, dhuhr +3, asr +2,
sunrise -2 with a horizon dip, maghrib +2 with the same dip):

- **fajr, dhuhr, asr and isha reproduce 100 percent within one minute at all 209 units** in each
  civil zone, once the zone is pinned per unit. Exact rates sit at 49-51 percent, the publisher's
  half-minute floor.
- **sunrise and maghrib carry an elevation term the published field does not explain.** 153 of 209
  units hold all six columns within one minute on at least 90 percent of days; the 24 units below
  10 percent have a median elevation of 601 m against 16 m for the group at 90 percent or better.
  Bandung at 720 m needs about -6/+7 where the model gives -5/+5. The regency layer repeats the
  capital layer's two-elevation-field defect, now measured over 209 units instead of 38.

Per-unit table: `fit/sihat-regencies.json`, `-makassar.json`, `-jayapura.json`.

### KHGT: all 516 second-level units, 2026 and 2027, 376,680 rows

The Muhammadiyah KHGT API was pulled at all 516 unit coordinates for two years, twelve monthly
requests per unit-year: **376,680 dated rows**, the whole second-level administrative set of
Indonesia. The result is the cleanest single-recipe finding of this wave:

- **One recipe at every unit, no exceptions**: fajr 18, isha 18, Shafi, plus a flat two minutes on
  fajr, dhuhr, asr and isha, sunrise at zero and maghrib at +2 before elevation. The median
  residual for those four columns is exactly 2 at **all 516 units** (295 WIB, 156 WITA, 65 WIT),
  and each of the four histograms holds a single value.
- **The maghrib pad is an elevation ladder**: 2 minutes at sea level, 3 at about 100 m, 4 at 300 m,
  5 at 600 m, 6 at 1,000 m, 8 at 1,500 m, with corr(sqrt(elevation), maghrib pad) = **0.959**
  across 516 units. Converted to degrees the slope is 0.032 per sqrt(metre), which is Tunisia's
  0.0316 (O1l-18r) reproduced in a second country and on a different publisher.
- **The gap against SIHAT is confirmed at national depth**: KHGT subuh sits a median **8 minutes
  earlier** than SIHAT over all 209 common units and 76,285 paired rows, 5th to 95th percentile
  -9 to -7. Every other column agrees within one minute. The capital-layer verdict (KHGT subuh -8)
  is not a capital artefact.
- **The two KHGT years are genuinely recomputed**: 45 percent of dates move between 2026 and 2027
  at minute resolution, so the pair is a real second cycle, not a relabelled edition.

Per-unit residuals: `fit/khgt-regencies-Jakarta.json`, `-Makassar.json`, `-Jayapura.json`.

## Front 3: Pakistan

The printed chart family is **blocked to this session, with the cause named**. The Peshawar and
Quetta charts already banked are image-only PDFs (`pypdf` returns an empty text layer on all 12
pages), and no OCR binary or vision channel is available here. Faisalabad, the Rawalpindi full year,
Hyderabad PK, Sialkot's own chart, Gujranwala, Sargodha and the remaining Urdu layouts need the
image reader the O1l transcription used; they were not attempted blind.

What Pakistan does gain is its **first platform dated tables**:

| surface | city | point | recipe | score |
|---|---|---|---|---|
| Jamia Masjid Sector D (mawaqit) | Rawalpindi | 33.540 / 72.950 | 18 / 18 **Hanafi**, zero | 365/365 all six |
| Jamia Abu Al-Khair Foundation (masjidbox) | Islamabad | 33.700 / 72.910 | 18 / 17 Shafi, zero | 344/344 both years |
| Masjid Usman Zulnoorain (masjidbox) | Sialkot | 32.500 / 74.400 | 18 / 17 Shafi, zero | 344/344 |
| Masjid Al Hameed (mawaqit) | Islamabad | 33.660 / 72.875 | 18 / 18 Shafi, zero | asr 58.9 percent within 1, worst 2 |
| Jamia Masjid Charg Din (masjidbox) | Sialkot (Nizamabad) | 32.625 / 74.330 | 17.65 / 17.5, fajr -2, isha +2 | 365/365 |

A Lahore tenant (Masjid Khatim-ul-Nabiyyeen) was also captured and is **iqamah-class**: sunrise
tracks the sun at 100 percent within one minute while fajr runs up to 65 minutes late and dhuhr up
to 18, the same signature as Rampur. Candidate, no fit.

Charg Din is a coarse table: every column is 100 percent within one minute but only 51 to 88
percent exact, and the fajr sweep is flat from 17.3 to 17.65 degrees (centred MAE 0.18 to 0.13), so
its angle pair is weakly identified. It is recorded as a candidate, not as an A-grade recipe.

The chart family's verdict is unchanged and now has a platform foil: the printed charts run one
angle pair (18-18.5 fajr / 18 isha) with per-city margins and no federal dhuhr convention, while
the platform tenants split on madhab exactly as India does. Rawalpindi's own mosque is 18/18
Hanafi with zero margins; Sialkot's are 18/17 Shafi.

## Front 4: Bangladesh

Honest negative, terms recorded. Searched Bengali and English:

- `ইসলামিক ফাউন্ডেশন জেলা ভিত্তিক নামাজের সময়সূচি`, `চট্টগ্রাম জেলা নামাজের সময়সূচি ইসলামিক ফাউন্ডেশন`,
  `খুলনা মসজিদ নামাজের সময়সূচি`, `রাজশাহী মসজিদ নামাজের সময়সূচি`, plus English
  "Chittagong/Khulna/Rajshahi mosque prayer times 2026".
- The Islamic Foundation's own site (`islamicfoundation.gov.bd/pages/notices`, captured) carries
  administrative notices, orders and press releases; the only timetable item is the 1437H Eid
  notice. The Chittagong divisional office site was captured in full: its menu has no timetable
  entry. No district band table is served as text or as a table page.
- `salat.habibur.com/districts/<district>/` is a per-day computed display with a rounded and a
  raw column (Chittagong 22.3375 N, 91.8389 E), not a publisher table.
- `prayersconnect.com` carries mosque pages for all three cities (for example Gunagri Shahi Jame
  Masjid, Chittagong) and exposes each mosque's recorded settings, Karachi 18/18 with Hanafi asr,
  but serves no dated table: the times are rendered from those settings in the browser.
- mawaqit and masjidbox carry no Chittagong, Khulna or Rajshahi tenant.

**The 68-band district artifact stays supported and unproven.** The one surface that would close it
is a district or IFB monthly band table, and every channel that publishes it in Bangladesh does so
as a newspaper image or a Facebook post, neither of which this session can read.

## Front 5: Sri Lanka, Vietnam, Cambodia, Laos, Mongolia, Philippines

### Sri Lanka: 13 zones, two editions

All 156 zone-month PDFs for 2026 were downloaded and parsed (4,758 dated rows; the tables carry a
**29 February row in a non-leap year**, dropped before scoring). Points recovered from each zone's
own columns:

| zone | districts | recovered point | fajr | isha | all six within 1 |
|---|---|---|---|---|---|
| 01 | Colombo, Gampaha, Kalutara | 7.020 / 79.650 | 19.35 | 17.65 | 365/365 |
| 02 | Jaffna | 9.495 / 79.800 | 20.40 | 18.05 | 365/365 |
| 03 | Mullaitivu, Kilinochchi, Vavuniya | 9.490 / 80.150 | 19.20 | 17.10 | 365/365 |
| 04 | Mannar | 8.475 / 79.390 | 18.75 | 16.30 | 351/365 |
| 05 | Anuradhapura | 8.475 / 80.150 | 19.20 | 17.10 | 365/365 |
| 06 | Kurunegala | 7.590 / 80.105 | 19.40 | 17.35 | 365/365 |
| 07 | Kandy | 7.400 / 80.410 | 19.40 | 17.85 | 365/365 |
| 08 | Batticaloa | 7.870 / 81.470 | 19.40 | 17.60 | 365/365 |
| 09 | Trincomalee | 9.025 / 80.750 | 19.40 | 17.60 | 365/365 |
| 10 | Badulla | 7.150 / 80.800 | 19.20 | 17.30 | 364/365 |
| 11 | Ratnapura | 6.840 / 80.150 | 18.95 | 17.60 | 365/365 |
| 12 | Galle, Matara | 6.140 / 80.000 | 19.60 | 17.15 | 365/365 |
| 13 | Hambantota | 6.190 / 80.900 | 19.30 | 17.70 | 365/365 |

Twelve of thirteen zones hold all six columns within one minute across a full year on one sweep.
The first solve put zones 04 and 09 in a local minimum; widening the box moved both: Trincomalee
now scores 365/365 at 9.025 / 80.750, about 70 km north-west of the town, and Mannar 351/365 at
8.475 / 79.390, which is offshore and therefore an implied point rather than a place. Both implied
points are flagged; the angles they carry (19.4 / 17.6 and 18.75 / 16.3) sit inside the ACJU family
except for Mannar's isha, which is 1.3 degrees lower than any other zone.

Eleven zones share one clock pad (dhuhr +1, asr +1, maghrib +1); zones 02 and 13 print +2 and
zone 02 also adds a minute to sunrise. That pad is the country's ihtiyat, and it is the only clock
term in the family.

The 2024 edition is not in the Wayback archive: the CDX listing under `/wp-content/uploads/2024/`
returns no PDF, so no third generation exists to test.

**Edition change, dated.** The 2025 edition prints six columns with a single asr; the 2026 edition
prints seven, with Shafie and Hanafi asr both. On zone 01, the 62 days recovered from the 2025
edition are identical to the 2026 table to the minute (fajr, sunrise and maghrib compared). The
pair is therefore **one computed generation relabelled**, and the zones stay provisional by
FIT-RULES rather than lifting to A on the two editions.

### Vietnam, Cambodia, Laos

| surface | city | point | recipe | score |
|---|---|---|---|---|
| Masjid Al-Noor (mawaqit) | Hanoi | 21.040 / 105.725 | 18 / 17 Shafi, asr +1, maghrib -1 | 365/365 |
| Al-Serkal Mosque (mawaqit) | Phnom Penh | 11.460 / 104.900 | 18.4 / 17.35, fajr -5, isha +4 | 330/365 |
| Jamia Masjid (mawaqit) | Vientiane | 17.960 / 102.480 | 18 / 18 **Hanafi**, maghrib +6, isha +9 | 365/365 |

Vientiane's maghrib sits six minutes after sunset and its isha nine minutes above 18 degrees, a
fixed convention rather than an angle pair. Phnom Penh's fajr is five minutes earlier than 18.4
degrees, the Cham community's own setting.

### Mongolia and the Philippines

- **Mongolia**: no dated mosque surface. Ulaanbaatar Central Mosque has a Wikipedia article and no
  timetable; the only Mongolian-language results are computed aggregators (athanpro, namazvakti,
  islamicfinder). Negative at mosque tier, searched Mongolian and English.
- **Philippines**: `ncmf.gov.ph` returns 403 behind a challenge (recorded, not solved, per the
  standing no-captcha rule). The BARMM site was captured and carries no prayer table. The NCMF
  Ramadhan 1447 calendar exists only as a Facebook post image. No dated table banked; the two
  regional methods remain unmerged.

## Defects found this round

1. **ACJU prints a 29 February in 2026**, a non-leap year, in every zone sampled. The leap-shaped
   table class now has a third instance after Ireland and Maldives.
2. **ACJU edition change 2025 to 2026**: six columns to seven, single asr to both schools, with the
   overlapping values unchanged. A layout change, not a regime change.
3. **masjidbox rate-limits the 7-day walk**: HTTP 429 after roughly 40 consecutive windows. Four
   tenant-years lost 6 to 21 days each and are fitted on the rows actually banked (350 to 371).
4. **mawaqit calendar rows can carry seven values** (an imsak/fajr pair before shuruq). A naive
   six-column zip shifts every column by one and silently drops isha; Rawalpindi reproduced at
   0/365 until the row shape was read.
5. **SIHAT's regency elevation term is not in its own `elevation` field**: lowland units need
   -2/+2 on sunrise and maghrib, units at 600 to 900 m need about one minute more on sunrise and
   two more on maghrib, and no single coefficient in the published field reproduces both.
6. **slug decoys at the platform layer**: `masjid-al-madina-1784119166482` (returned for a Patna
   query) is Turku, Finland, and `masjid-i-umar` (returned for Nagpur) is Srinagar. Fifth and sixth
   decoys of the makkahmasjid.net class this programme has logged.
7. **Colombo's Al-Hassan Masjid computes about 16 km from its own coordinates.** Its table carries
   a uniform four-minute margin, which the point solver reads as longitude (the documented margin-
   longitude degeneracy). The recipe holds at 19.55 / 17.65 with a +4 family pad, but the recovered
   point is not usable as a coordinate.

## Data held

- `data/`: 1,293 files, **470,756 dated rows** in the brief's shape (`{YYYY-MM-DD:
  {fajr..isha}}`, HH:MM): 209 SIHAT unit-years, 1,032 KHGT unit-years, 17 ACJU zone-years, 28
  masjidbox tenant-years, 7 mawaqit tenant-years. Plus `data/INDEX.json` (file, rows, columns,
  span, label), `data/regency-jobs.json` (the Indonesia selection), and the raw per-unit SIHAT and
  KHGT payloads with coordinates, elevation and timezone.
- `fit/`: one JSON per fit (point, angle sweeps, madhab probe, margins, per-column exact/within-1/
  worst, seasonal amplitude), 52 files including the Indonesia aggregates.
- `captures/`: 79 raw artifacts: tenant pages with JSON-LD addresses, the 156 ACJU 2026 PDFs, the
  2025 Wayback edition, SIHAT and KHGT probes, the IFB notice pages, prayersconnect, the ACJU CDX
  listings and the negative captures. 95 MB.

## NEXT

1. **India**: masjidway returned 502 throughout this session (retry); tenants for Lucknow, Nagpur,
   Delhi and Patna; more points for the isha-17 line between 13 and 27 degrees north.
2. **Indonesia**: SIHAT at the 307 units still missing there (KHGT already covers all 516); a
   per-unit elevation coefficient fitted from the tables themselves rather than the published
   field, which should also settle the SIHAT highland residual.
3. **Pakistan**: the chart family needs an image path (OCR or a vision channel). Until then, the
   platform tenants for Faisalabad, Gujranwala, Sargodha and Hyderabad PK are the opening.
4. **Bangladesh**: the district band table exists only as images; the close needs the same image
   path as Pakistan.
5. **Sri Lanka**: confirm zone 04's implied point (its table solves offshore) and pull the 2024
   edition for a third dated generation.
