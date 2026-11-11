# O1m-23 India completion (round o1m, wave 23)

Mission: the Excel-only cities, the three blocked waqf boards, the 2027 editions of the
A-grade cities, the Islamic Academy's dated edition question, and the isha tier line on more
samples. Standing orders `../BRIEF.md`, fit rules `../FIT-RULES.md`. Workspace
`$HOME/athan-gitree/census/o1m/o1m-23-indiacomplete/`. The repository was not touched.

Status: incremental, and this wave's five jobs are banked. India is not complete and is not
declared complete: the workbook layer is one undated cycle, three boards hold an authority
negative rather than a closure, and the 2027 third year rests on a platform whose margins drift
by a minute. Every number below is script-counted from `data/`, `fit/` and `captures/`; where a
number is a hand count it says so.

## Headline

1. **The Excel-only cities are banked: 96 India city workbooks parsed and 95 fitted.** The
   publisher serves a 2003-era BIFF8 `.xls` behind `images/Times/TMS.php?file=<stem>.xls`. No
   spreadsheet reader exists on this host, so the OLE container and the record layer were read
   with the standard library (`scripts/xlsread.py`). **Forty-two of the 95 cities are beyond the
   70-city PDF layer**: Mysore, Nasik, Mumbai, Madurai, Coimbatore, Trichy, Srinagar, Agra,
   Amritsar, Meerut, Chandigarh, Porbandar, Nagpur, Bangalore, Hubli, Ahmedabad, Gwalior,
   Jabalpur, Kurnool, Raipur and 22 more.
2. **The workbook is the PDF's own generation, reprinted.** On the 54 cities where both formats
   exist, **52 agree on every cell within one minute and the median agreement is 80.3 percent
   exactly**; the two outside that band are the corrupt Aligarh sheet and one Dhanbad cell.
   Per FIT-RULES a reprint is frozen: the layer covers new cities and lifts nothing.
3. **One recipe at 95 workbooks: fajr 17.97, isha 18.06, Hanafi asr at all 95, maghrib +3 at 92,
   dhuhr +1 at 37.** 82 of 95 hold all six columns within one minute on 95 percent or more of the
   year; 51 hold it on all 365 days.
4. **The 2027 edition exists at the mosque tier and is a genuine third recomputation.** All 34
   tenant-years behind the A-grade layer were harvested for 2027 from the platform API: 320 to 371
   scored days each, the same recipe reproducing at **97 to 100 percent of days for 26 of them**,
   and **30 to 56 percent of printed rows moving against 2026** (median 42.7). Twenty-six tenants
   now hold **three recomputed years on one recipe**, which is A by the letter of FIT-RULES.
5. **Telangana's board was finally read, by a second egress.** `waqf.telangana.gov.in` answers
   through an external fetch service while it times out from this host. Its own menu was
   enumerated in full: 39 links, 24 site pages, seven news posts, two PDFs, and no timetable.
   **The archive also shows the domain serving Thai gambling spam on 2026-04-26**, a dated
   hijack window between two live states.
6. **Karnataka and Gujarat stay negative, with better evidence than last round.** Karnataka's
   entire archived URL set was enumerated (259 keys, 193 PDFs, all opaque `media_to_upload`
   names); no URL names a prayer table and the only archived PDF sampled is a Statement of
   Accounts register. Gujarat holds **no archive at all**: the availability API returns no
   snapshot and the CDX index returns an empty set.
7. **No 2027 edition exists at the Islamic Academy, and none can.** Its dated series stops at 2013
   for the United States and 2010 for Indo-Pak-Bengal, every file in both series is a dead link,
   and the India city tables are perpetual and undated. A 2027 recompute is not served, and the
   workbook reprint settles the question a different way.
8. **The isha tier line now rests on 138 tables.** Publisher tier, 95 workbooks: **93 reproduce
   isha at 18 and none at 17**. Mosque tier, 43 tables at 2026: **18 reproduce 17, 8 reproduce 18**;
   the same 34 tenants at 2027: **25 at 17, 4 at 18**. The 17-degree reading is the mosque
   plurality and absent from the publisher tier on every sample the programme holds.

## Method

- Workbook reading: `scripts/xlsread.py` parses the OLE2 container, the FAT and mini-FAT chains,
  the directory, then BOF/BOUNDSHEET/SST/LABELSST/NUMBER/RK/MULRK/FORMULA records. Verified
  against 96 files and cross-checked cell by cell against the publisher's PDFs for 54 cities.
- Cell values are local clock fractions of a day and every afternoon column is stored in
  twelve-hour form, so a value under noon is the same clock time plus twelve hours. Two sheets
  also fold the noon column into twelve-hour form across whole date ranges; that is repaired and
  recorded per city.
- Engine: adhan 4.4.6 at `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`,
  `Rounding.None`, timezone pinned to `Asia/Kolkata`, dates from the literal capture strings. No
  clock is read anywhere. The workbook stores a second-resolution calculation printed at the
  nearest minute, so the workbook fits compare against adhan rounded to the nearest minute and
  the platform fits against adhan truncated, each to its own print convention.
- Points are the coordinate pair the workbook prints, except where the header is stale or
  absent, in which case the point is solved from the table's own sunrise and transit columns
  (`scripts/solve_point.cjs`). The solver also serves as the defect detector: a sheet computed on
  the wrong civil offset drives the solve to the edge of its box.
- Boards: curl with a browser user agent from this host, an external fetch service as a second
  egress, the Wayback availability API and the CDX index for enumeration.

## Front 1: the Excel-only cities

The publisher's India index names each city against a PDF, a page, or an Excel page. The page
naming varies (`Agra.xls`, `Mysore_India.xls`, `MeerutIndia.xls`, `Raichur_India.xls`), so each
city page was read and its own link followed. Where the page names a PDF, the stem's workbook
sibling was probed as well, because Mumbai carries both.

Result: **98 index names resolve to a workbook over 96 distinct workbooks** (Banka aliases
Bhagalpur, Calicut aliases Kozhikode), **95 fitted**, one defective, and one artefact
(`Aberdeen_UK.xls`, which two India pages link by mistake).

### The family

| term | value |
|---|---|
| fajr angle | 17.32 to 18.12, median 17.97 |
| isha angle | 17.86 to 18.74, median 18.06 |
| asr | Hanafi at all 95 |
| margins | maghrib +3 at 92 (Port Blair and Machilipatnam +2, Parbhani +6); dhuhr +1 at 37; asr and isha zero |
| all six within one minute | 95 percent or better at 82 cities, all 365 days at 51 |

The best and the worst of the family:

| city | point | fajr | isha | margins | all six |
|---|---|---|---|---|---|
| Mumbai | 18.967 / 72.817 | 17.96 | 18.05 | dhuhr +1, maghrib +3 | 365/365 |
| Mysore | 12.300 / 76.633 | 17.98 | 18.07 | maghrib +3 | 365/365 |
| Madurai | 9.917 / 78.117 | 17.95 | 18.11 | maghrib +3 | 365/365 |
| Nasik | 20.317 / 73.867 | 17.98 | 18.06 | maghrib +3 | 365/365 |
| Coimbatore | 11.000 / 76.967 | 17.96 | 18.08 | maghrib +3 | 365/365 |
| Srinagar | 34.067 / 74.817 | 18.00 | 18.06 | dhuhr +1, maghrib +3 | 364/365 |
| Chandigarh | 30.700 / 76.900 | 17.97 | 18.03 | dhuhr +1, maghrib +3 | 365/365 |
| Calcutta | 22.567 / 88.367 | 17.97 | 18.01 | maghrib +3 | 347/365 |
| Port Blair | 11.667 / 92.750 | 17.95 | 17.90 | dhuhr +1, asr -1, maghrib +2 | 314/365 |

Parbhani is the one table whose anatomy differs: 17.32 fajr, 18.74 isha, sunrise +3, dhuhr +3,
asr +3, maghrib +6, Hanafi asr, and all six columns within a minute on all 365 days. Its
maghrib pad is double the family's and its two angles sit 0.65 and 0.68 degrees off the family pair.
It is recorded as a family member with its own recipe, not as an outlier to be repaired, and the
fit is exact enough that the difference is the publisher's choice rather than a parse defect.

### The reprint test against the PDF layer

Every city that carries both a PDF and a workbook was compared cell by cell over the shared year:

| measure | value |
|---|---|
| city pairs | 54 |
| pairs where every cell is within one minute | 52 |
| median exact agreement inside those pairs | 80.3 percent |
| pairs outside that band | Aligarh (2.7 percent, corrupt sheet) and Dhanbad (99.9 percent, one cell) |

A one-minute difference on one cell in five is a print-path artefact between the PDF generator
and the spreadsheet, not a recomputation: outside the two named pairs no cell moves by two
minutes, and the twenty-percent disagreement is spread evenly across the year rather than
clustered on a date range. **One computed generation, two formats.** The workbook layer therefore
adds 42 cities and lifts nothing.

## Front 2: the three blocked boards

### Telangana: read in full through a second egress

The host times out at 25 seconds from this network on every attempt. The same URL answers
through an external fetch service, and the board's own menu was enumerated from its home page:

| menu item | prayer table |
|---|---|
| GOs, Acts and Rules, Schemes, RTI, Waqf Inspector, Contact, Feedback, About, Achievements, Organisational Chart, Administration, CEO, Chairpersons, Board, Services and Functions, Honorarium, Properties, Finances, Gazette Notifications, Proceedings, Video Gallery, Photo Gallery, Press Releases, Ramzan Gifts, Marriage Council Centre (24 pages, seven news posts) | no |
| `wp-content/uploads/2024/05/waqf-initiatives.pdf`, `wp-content/uploads/2024/06/Raabta.pdf` | notices, not timetables |
| `waqf.zestwings.com/eqazzath_web/` (eQazzath) | marriage, divorce and khula certificates |
| UMEED Central Portal | property registration |

**A dated regime note, found on the way.** The 2026-04-26 archive snapshot of the board's home
page serves Thai gambling spam under the WAQF title, while the live page today serves the genuine
board. The domain spent a window parked to a spam operator and came back. Nothing about that
window can be read as a board publication.

### Karnataka: the archive enumerated, the PDFs identified

`karwaqf.karnataka.gov.in` times out from this host and returns a proxy error through the
external service. The archive answers:

- **259 URL keys** in the archived set, **193 of them PDFs**, every PDF under
  `uploads/media_to_upload<epoch>.pdf` with no readable name. No URL in the whole set names a
  prayer, a namaz, a salat or a timetable.
- The only archived snapshot of the home page (2023-12-09) lists those PDFs with no titles. The
  sitemap page renders only its footer because the menu is scripted.
- Sampling the archived PDFs: `media_to_upload1669894268.pdf` is a **Statement of Accounts
  register** for waqf properties in the Belagavi district, 21 pages of property titles and
  disposal dates. That is the document class behind the opaque names.

### Gujarat: no archive at all

`waqfboard.gujarat.gov.in` times out from this host, returns a proxy error through the external
service, returns **no closest snapshot** from the availability API, and returns an **empty CDX
set** for the whole domain. This is the first board in the programme with no archive trace
whatsoever, and it is recorded as such rather than as a negative on content.

**Language pass.** Four languages beside English were searched for a board timetable: Telugu
(`తెలంగాణ వక్ఫ్ బోర్డు నమాజ్ సమయాలు`), Kannada (`ಕರ್ನಾಟಕ ವಕ್ಫ್ ಮಂಡಳಿ ನಮಾಜ್ ಸಮಯ ಪಟ್ಟಿ`), Gujarati
(`ગુજરાત વકફ બોર્ડ નમાજ સમય`) and Hindi (`कर्नाटक वक्फ बोर्ड नमाज़ समय सारणी`). Ten results per
query, every one either a computed aggregator (islamicfinder, salah.com, namazvakti, ezani,
aladhan, muwaqqit, my-masjid) or a news or social item. The Kannada query returns the Karnataka
board's own index pages, which is the search engine indexing the same site whose archive this
wave enumerated: no title in the index names a timetable. One Instagram post titled "Namaz Time
Table by Waqf Board" for Hyderabad is a community post about Eid, labelled community and not
banked.

**What the three boards now hold.** Telangana: menu read in full, no table, from a working path.
Karnataka: archive enumerated in full, no table named, document class identified. Gujarat:
unreachable on both egresses and unarchived. None publishes a daily table on any evidence this
programme can reach, and the authority-tier negative now rests on a second egress rather than on
one blocked network.

## Front 3: the 2027 editions

The platform API serves 2027 already, seven days per request. All 34 A-grade tenant-years were
harvested, which is the 24 cities of o1m-17, the seven of o1m-5, and the three tenant-years those
two waves captured alongside them: 53 windows per tenant, 4 workers, 429 backoff.
**34 tenant-years, 11,998 dated rows, 11,794 scored, 320 to 371 days each.** Every fit runs at
the point the 2026 fit established, adhan 4.4.6, `Rounding.None`, `Asia/Kolkata`, dates from the
literal strings in the payload.

### A third recomputed year

| tenant | city | days | 2027 all six within 1 | rows moved vs 2026 | 2026 recipe |
|---|---|---|---|---|---|
| anantapur-abubakar | Anantapur | 365 | 365/365 | 40.0% | 18 / 17 Shafi |
| bhavnagar-taqva | Bhavnagar | 351 | 351/351 | 42.1% | 18 / 17 Shafi |
| bishnupur-ramkrishnapur | Bishnupur | 351 | 351/351 | 41.5% | 18 / 17 Shafi |
| chennai-azezziyyah | Chennai | 344 | 344/344 | 36.9% | 18 / 17 Shafi |
| howrah-aaisha | Howrah | 365 | 365/365 | 51.5% | 18 / 18 Shafi |
| mughalsarai-ghausia | Mughalsarai | 344 | 344/344 | 52.3% | 18 / 17 Shafi |
| pune-ameer-hamza | Pune | 344 | 344/344 | 46.8% | 18 / 17 Shafi |
| shahabad-bilal | Shahabad | 344 | 344/344 | 48.6% | 18 / 17 Shafi |
| tiruchirappalli-thowheed | Tiruchirappalli | 323 | 323/323 | 33.7% | 18 / 17 Shafi |
| utelwa-marwa | Utelwa | 344 | 344/344 | 53.5% | 18 / 17 Shafi |
| vijayapura-bandenawaz | Vijayapura | 365 | 365/365 | 44.1% | 18 / 17 Shafi |
| ahmedabad-idara | Ahmedabad | 365 | 364/365 | 51.5% | 18 / 18 Hanafi |
| chennai-mohammedia | Chennai | 337 | 335/337 | 38.0% | 18 / 17 Shafi |
| hyderabad-yaseen | Hyderabad | 344 | 342/344 | 40.7% | 18 / 17 Shafi |
| jaipur-mansarovar | Jaipur | 344 | 344/344 | 52.9% | 18 / 17 Shafi |
| jaigahan-noori | Jaigahan | 344 | 344/344 | 56.1% | 18.2 / 17.9 Shafi |
| kgf-quba | Robertsonpet | 344 | 344/344 | 33.0% | 18 / 18 Shafi |
| mum-risalat | Mumbai | 344 | 340/344 | 44.5% | 18 / 17 Shafi |
| ahmedabad-tekrawali | Ahmedabad | 365 | 361/365 | 54.5% | 18 / 17, fajr +5 |
| asansol-ayesha | Asansol | 365 | 360/365 | 49.9% | 18 / 18 Hanafi |
| etawah-darulhuda | Etawah | 337 | 331/337 | 52.3% | 18 / 17 Shafi |
| guntur-firdous | Guntur | 337 | 331/337 | 41.5% | 18 / 17 Shafi |
| murshidabad-jamiya | Murshidabad | 344 | 337/344 | 51.5% | 18 / 17 Shafi |
| kodagu-moza | Kodagu | 344 | 336/344 | 36.1% | 18 / 17 Shafi |
| wanaparthy-mecca | Wanaparthy | 344 | 334/344 | 43.3% | 18 / 17 Shafi |
| thenhipalam-noorayn | Thenhipalam | 344 | 333/344 | 32.4% | 18 / 18 Shafi |
| hyderabad-farhat | Hyderabad | 344 | 344/344 | 41.9% | 18 / 18 Shafi |
| vylathur-thozhiyoor | Vylathur | 365 | 333/365 | 32.2% | 18 / 18 Shafi |
| bidar-ali | Bidar | 351 | 339/351 | 40.7% | 18 / 17 Shafi |
| ramanagara-hussain | Ramanagara | 344 | 331/344 | 35.3% | 18 / 17 Shafi |
| solapur-qadriya | Solapur | 330 | 311/330 | 42.1% | 18 / 17 Shafi |
| ramagundam-makka | Ramagundam | 344 | 320/344 | 47.0% | 18 / 17 Shafi |
| kalamb-jama | Kalamb | 323 | 276/323 | 44.4% | 18.2 / 17.9, -1 on the solar three |
| chennai-anjuman-mohammedi | Chennai | 351 | 17/351 | 30.5% | iqamah clock |

**Twenty-six tenants hold three recomputed years on one recipe**: 2025, 2026 and 2027, each
recomputed, the same angle pair and the same madhab, with 97 percent or more of the 2027 days
within a minute on all six columns. The isha-17 tenants stay at 17 and the isha-18 tenants stay
at 18 across all three years; not one tenant crosses the line. That is the A test satisfied at
three years rather than two.

**The margins drift by a minute and the recipe does not.** Twenty-two tenants print a different
margin set in 2027 than in 2026, nine of them in exactly one column by exactly one minute (most
often dhuhr +1 to 0). That is the platform's own print drift, not a regime change. Three tenants
move an angle by more than a quarter degree: Tekrawali, whose fajr pad of five minutes is
expressed as a lower angle in 2027 (17.03 against 18.00 at fajr +5), which is the documented
margin-angle degeneracy; Farhat Habeeb, by 0.32 at fajr and 0.34 at isha, in opposite directions
about an unchanged pair; and Chennai Anjuman-E-Mohammedi, an iqamah clock whose angles carry no
meaning.

**Three do not hold.** Chennai Anjuman-E-Mohammedi is an iqamah clock and was never A-grade; it
scores 17 of 351 and stays a candidate. Kalamb holds 85.4 percent and Ramagundam 93.0: both
print a one-minute -1 pad on the solar three in 2027 that their 2026 fit did not need (Kalamb's
2026 already carried it), so the score falls while the orbit stays the same. Both stay A on the
two-year reading and the third year is recorded as a partial.

### The mawaqit route serves the live year only

mawaqit's `confData.calendar` carries **no year and no dates**: twelve month objects keyed by day
of month, recomputed by the server for whatever year the page is requested in. The API route for
a named year is closed (`/prayer-times` answers 401, `/calendar` 404), and the Lucknow tenant has
**no archive snapshot at all** (both the availability API and the CDX index are empty). A 2027
table for Lucknow therefore cannot be fetched today; it is a January-2027 watch, and the capture
must be timestamped in the same request cycle as the year.

## Front 4: the Islamic Academy's dated edition

The publisher does carry a dated series, on its own calendar index: **USA 2003 through 2013**, and
**Indo-Pak-Bengal 2003, 2005, 2007, 2008 and 2010**. Both stop, the American one at 2013 and the
Indian one at 2010. And **every file probed in both series returns 404 on the live server**, the PDFs
and the workbooks alike, sixteen bytes of error page each: USA 2013, USA 2005, IndoPak 2010,
Indo Pak 2008, Indo Pak 2007 and Indo Pak 2005. The dated India calendar survives
only as menu text; the archive reports a 200-status capture of the 2010 file's URL and the replay
yields no document, and the CDX index holds only the bare script URL because the query string is
truncated.

Its salat-timetable index is a different set, the perpetual per-country one, and every India city
table in it, PDF and workbook alike, is headed "PERPETUAL SAUM-O-SALAT TIMETABLE" with no year.
The Aberdeen sheet states the doctrine in its own words: "This Salah Time Table never expires, you
can use if forever".

There is therefore **no 2027 edition to find**: the dated series stopped in 2010 for India and
2013 for the United States, every one of those files is gone from the server, and the city tables
were never annual in the first place. The layer stays **provisional, community tier**: one
published cycle, undated by construction, and the workbook reprint is the same cycle in another
format. The o1m-17 Lucknow cross-check stands as the only dating evidence: a mosque printing the
same generation on dated pages.

## Front 5: the isha tier line, 138 tables

One measure, stated: the isha column against adhan at 17 and at 18 degrees, every other parameter
held at the table's own fitted recipe, share of days within one minute, and a table counts as
reproducing an angle at 95 percent or better.

| tier | tables | reproduces 17 | reproduces 18 | neither |
|---|---|---|---|---|
| publisher workbook, 2026 (this wave) | 95 | **0** | **93** | 2 |
| publisher PDF, 2026 | 70 | **0** | **70** | 0 |
| mosque and platform, 2026 | 43 | **18** | **8** | 17 |
| mosque and platform, 2027 | 34 | **25** | **4** | 5 |

The 17-versus-18 gap at the workbook tier runs **4.26 to 5.43 minutes**, mean 4.65, and it widens
with latitude exactly as the mosque tier does. The two lines are real, both are printed for India,
and the choice between them tracks the publisher and not the city. Hyderabad carries the cleanest
case: its publisher workbook is an isha-18 table, Yaseen reproduces 17 at 100 percent of days, and
Farhat Habeeb reproduces 18 at 90 percent in the same city.

The 2027 column is the more informative one. The 34 tenant-years behind that 17-to-4 split are the
tenants whose 2025 and 2026 tables were fitted last round, and **no tenant crosses the line
between years**. The isha angle is a frozen setting of the tenant, not a recomputed value: the
platform recomputes the times yearly and the angle survives. That makes the 17-versus-18 split a
property of the mosque's own choice of setting, which is what the tier hypothesis claimed and what
77 mosque-tier measurements now show.

## Defects found this pass

1. **The Aligarh workbook is corrupt.** It declares GMT+6.0, its sunrise-to-maghrib span is 9h06m
   at 27.9 north in January, and the point solver misses it by 19 minutes of longitude and 24 of
   latitude. Its PDF is sound; the workbook is not a table of record.
2. **The Raipur workbook is computed and printed thirty minutes early**, on a declared GMT+5.0.
   Shifted by thirty minutes it reproduces the national recipe at the city point, 344 of 365.
3. **Seventy Porbandar rows and seventy-four Aligarh rows fold the noon column into twelve-hour
   form** (01:00 printed for 13:00). Repaired by a noon guard; without it the dhuhr column scores
   80.8 percent and the equation is silently wrong for two months of the year.
4. **Two city pages serve the wrong file.** Allahabad and Amritsar both link `Aberdeen_UK.xls`.
   Both cities' own workbooks answer at `Allahabad.xls` and `Amritsar.xls`.
5. **Two headers carry a stale template coordinate.** Machilipatnam prints `52° 18' N, 1° 30' W`
   and Raipur the same pair; the Machilipatnam table is otherwise sound and is fitted at its
   solved point, 16.45 / 80.965.
6. **A stale-header workbook cannot be trusted for its point but can be trusted for its values.**
   The Machilipatnam solve lands 0.3 degrees from the city and the fit holds 348 of 365 days,
   which is the margin-longitude degeneracy already documented, not a second defect.
7. **The published point and the table's implied point differ by up to 0.28 degrees** at an
   ordinary city (Agra prints 27.150 / 78.000 and solves to 27.295 / 77.715) because a one-minute
   dhuhr margin reads as longitude in the solve. The printed point is used for every fit; the
   solver is a check, never the source.
8. **One cross-format cell disagrees by 61 minutes** at Dhanbad while the other 1,799 agree within
   one minute.
9. **mawaqit serves the live year and holds no year, no dates and no archive.** Its calendar is a
   grid of month and day, recomputed server-side per request year, its per-year API route is
   closed, and the Lucknow tenant has no snapshot in the availability API or the CDX index. A
   second mawaqit year can only be read during that year.
10. **The masjidbox window is capped at seven days and rate-limits the walk.** 34 tenant-years at
    53 windows each drew HTTP 429 in bursts; every tenant lost 0 to 6 days and all were fitted on
    the rows actually banked.

## Data held

- `data/`: **47,038 dated rows**. 96 Islamic Academy workbook tables (35,040 rows, `data/tms/`,
  a perpetual sheet scored on 2026), 34 masjidbox tenant-years for 2027 (11,998 rows, 11,794
  scored), plus `tms-cities.json`, `tms-census.json`, `tms-defects.json`,
  `reprint-test.json`, `isha-tiers-2026.json`, `isha-34-two-years.json` and `y2027-fits.json`.
- `fit/`: 233 per-table fits. One per workbook (`fit/tms/`), one per 2027 tenant-year
  (`fit/y2027/`), one per 2026 tenant-year re-fitted at the same point (`fit/y2026/`), and the
  70-city PDF re-fit at the nearest-minute convention (`fit/pdf95/`). `fit/INDEX.md` holds every
  city's per-column within-1 and worst residual in one table.
- `captures/`: 216 raw artifacts, 19 MB. 97 workbooks, 75 city pages, the index, the Telangana
  menu transcribed whole, the availability and CDX listings, the archived Karnataka snapshot and
  PDF sample, and the 34 2027 payloads.

## Grading

| layer | grade | reason |
|---|---|---|
| Islamic Academy workbook, 96 cities | **provisional, community** | one published cycle, undated by construction; the workbook is the PDF generation reprinted |
| Islamic Academy PDF, 70 cities | **provisional, community** | unchanged from o1m-17 |
| 26 A-grade mosque tenants | **A, community, three years** | 2025, 2026 and 2027 recomputed, one recipe, no tenant crossing the isha line |
| Bidar, Thenhipalam, Ramanagara, Solapur, Ramagundam, Vylathur (six) | **A on two years, third year provisional** | the same recipe, but 91 to 97 percent of 2027 days |
| Kalamb | **A on two years, third year partial** | 85.4 percent, the 2027 pad shifted by a minute |
| Chennai Anjuman-E-Mohammedi | **candidate** | iqamah clock, not a solar table |
| Telangana, Karnataka, Gujarat boards | **authority negative, not closed** | menu read or archive enumerated, no table found; Gujarat unreachable and unarchived |

## NEXT

1. **The Islamic Academy's 96-city workbook layer is one cycle and cannot be dated.** The only
   route to a second generation is a mosque or a platform printing the same table on dated pages,
   as Lucknow did. That cross-check is worth running city by city: the workbook prints a
   distinctive maghrib +3 and dhuhr +1 pattern that a mosque table carrying the same values would
   date instantly.
2. **The Gujarat board has no archive and no reachable host.** It needs an Indian egress or the
   state's own portal (the Gujarat government's `gujaratindia`/`nprocurement` class) where the
   board's notices may be mirrored.
3. **Karnataka's 193 archived PDFs are names without titles.** Opening them all through the
   archive is the only way to know the document class of each; one sample said Statement of
   Accounts. A hundred-page sweep would settle whether any carries a prayer table.
4. **mawaqit's Lucknow tenant needs a January-2027 read.** The surface refuses any year but the
   live one and holds no archive, so the third year arrives with the calendar year.
5. **The three partial 2027 tenants.** Kalamb and Ramagundam lost their pad and Chennai's
   Anjuman-E-Mohammedi was never a solar table; each wants its own sweep rather than a reuse of
   the 2026 point.
6. **Kerala's mosque family is still unwritten.** Perintalmanna at 19.55 / 18.60 and the four
   other Kerala tables do not fit the northern pair, while the workbook layer puts three more
   Kerala cities (Kozhikode, Trivandrum, Fort Cochin) on the northern pair. The state needs a
   sweep before any recipe is claimed for it.
7. **Aligarh has no workbook of record.** Its PDF is sound; the workbook should be re-fetched in a
   later round in case the publisher replaces it.
