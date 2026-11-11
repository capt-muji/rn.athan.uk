# o1m-40 Oman: the rule from the point

Workspace `$HOME/athan-gitree/census/o1m/o1m-40-oman/`. Wave o1m-40, round o1m.
Engine adhan 4.4.6 at `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`,
`CalculationParameters('Other', 18, 18)`, `Madhab.Shafi`, `HighLatitudeRule.MiddleOfTheNight`,
`Rounding.None`, `Asia/Muscat` (UTC+4, no DST), every date taken from a literal capture string.
No clock is read into the data. No subagent spawned. The repository was not touched.

Captures `captures/`, dated rows `data/`, fits `fit/`.

**Verdict: POINT.** At a point solved from each area's own table, one national recipe
reproduces all 86 prayer areas of 2026 at **100.0 pc within 1 minute over 188,340 cells (86 areas
x 365 days x 6 columns), worst cell 1 minute**. The rule never differed by region. What differed
was the point.

---

## 0. The defect that hid everything: the area names were attached to the wrong CityIDs

`calendar_page4.asp` prints all 86 prayer areas in one table, and o1m-27 read its row order as
the CityID order. Rows 1 and 2 do coincide (Muscat = `00`, Ibra = `01`), and that is where the
check stopped. **The page's row order is Arabic alphabetical with Muscat forced first.**
`خزان` (Khazan), which the CityID space places at `82`, is printed at its alphabetical position
37, which pushes **46 areas (CityID 36-81) one place out** and puts Khazan itself at the wrong
end of the run.

Three independent witnesses fix the true map:

1. The English `calendar_page2.asp` selector carries `value`/name pairs `0..85` and places
   Khazan at 82 (`captures/calendar_page2.asp_year_2026_month_1_CityID_0`).
2. The Arabic selector on the same page is itself defective: it renumbers the alphabetical list,
   so `value 36` is labelled `خزان` while the table it serves for `CityID=36` is Dibba's.
3. **The times decide it.** Matching each CityID's own 2026-01-01 row against the page-4 rows by
   six-column time equality resolves all 86 with zero ambiguity, and the same match holds on
   2026-07-15 (86/86) and 2026-07-20 (84 unique, 2 ties). `CityID 36` reproduces the row printed
   against `دبا البيعة`, and `CityID 82` the row printed against `خزان`.

`data/om-cityid-name-map.json` is that verified map. The cost of the old assumption is measured
in §2: at the same recipe and the same public points, correct keying lifts within-1 from
**53.2 pc to 87.1 pc**.

## 1. The point layer: the ministry publishes its own gazetteer

`mara.gov.om/arabic/opendata.aspx` publishes fourteen workbooks, one of them
**`masajid/بيانات المساجد مع الإحداثيات.xlsx`** — "mosque data with coordinates"
(`captures/masajid-coords.xlsx`, 1.33 MB): **18,214 rows, 18,191 usable**, each carrying
`MosqueNumber, MosqueName, MosqueType, Governorate, Willayat, Village, Longitude, Latitude`,
covering **63 wilayats**, the full Omani set. That is the ministry's own coordinate layer, and it
is a village-level gazetteer of the country, not a list of 86 points.

A Nominatim pass had failed on nine names and mis-hit three more. The ministry's own file
resolves most of them outright:

| area | CityID | what the ministry's file says |
|---|---|---|
| الخضرفي AlKhadrafi | 12 | village **خضرفي**, wilayat ضلكوت, 4 mosques |
| الخوير Lekhwair | 13 | village **الخوير**, wilayat عبري |
| القابل الظاهرة AlQabil(Dh) | 18 | village **القابل**, wilayat البريمي (al-Dhahirah) |
| الكامل و الوافي | 19 | wilayat **الكامل والوافي** |
| دبا البيعة | 36 | village **دبا**, wilayat دبا |
| سيق Saiq | 48 | village **سيق**, wilayat الجبل الأخضر |
| كنهات Kanhat | 64 | village **كهنات**, wilayat عبري — a spelling variant Nominatim never matched |
| مسندم Musandam | 72 | village **خصب**, wilayat خصب |
| مصنعة Musana'a | 73 | wilayat **المصنعة** |
| الحمرة Al-Hamra | 10 | nothing: see below |

### The solved point

Each area's 2026 table is a minute clock, and three of its columns carry a point:

- `dhuhr` fixes the **meridian**: 4 minutes of clock per degree of longitude, and nothing else.
- `maghrib - sunrise` fixes the **latitude** through day length at the −0.833° horizon.
- `asr - dhuhr` fixes the **latitude** again through the Shafi shadow-1 hour angle.

The margins are whole minutes and constant across the year, so each column's year-mean residual
must be an integer. Latitude is read from the **shape** of the day-length and asr-span curves
(immune to any constant margin, including a horizon dip), then refined on the whole-minute
requirement; longitude from the dhuhr mean, which is exact once the national dhuhr margin is
fixed. Geometry is adhan 4.4.6's own `Astronomical`/`SolarCoordinates`, so the solve and the fit
share one solar model. `scripts/solve-points.js`, output `fit/om-point-geometry.json`.

**The dhuhr margin is +5 and the data says so twice.** Scanning the margin against the 43 areas
whose name is a wilayat — an independent centroid 10-40 km away — the solved longitude lands on
the centroid only at one value:

| assumed dhuhr margin | median abs longitude error | pc within 0.25° |
|---|---|---|
| +4 | 0.245° | 65 |
| **+5** | **0.021°** | **93** |
| +6 | 0.256° | 33 |

**The asr shadow factor is Shafi, measured the same way.** Under Hanafi (shadow 2) the latitude
solve collapses: median distance to the wilayat centroids goes from **6.1 km to 162 km**.

### The solved points land on the towns

Nine areas name a city whose coordinate is a matter of public record. The solved point, against
the city reference:

| area | solved | reference | distance |
|---|---|---|---|
| بهلاء | 22.972, 57.299 | 22.974, 57.304 | 0.6 km |
| نزوى | 22.940, 57.536 | 22.933, 57.533 | 0.8 km |
| صور | 22.582, 59.536 | 22.567, 59.529 | 1.8 km |
| البريمي | 24.268, 55.786 | 24.251, 55.793 | 2.0 km |
| عبري | 23.250, 56.515 | 23.225, 56.515 | 2.7 km |
| صحار | 24.368, 56.729 | 24.342, 56.729 | 2.9 km |
| صلالة | 17.050, 54.083 | 17.015, 54.092 | 4.0 km |
| الرستاق | 23.450, 57.429 | 23.391, 57.424 | 6.6 km |
| مسقط | 23.596, 58.286 | 23.588, 58.383 | 10.0 km |

Muscat is the informative one: the solved point sits at **23.596 N, 58.286 E**, which is the
Sultan Qaboos Grand Mosque in Bawshar (23.5836, 58.2890) to 1.4 km, not the old city. The
ministry computes the capital at its own mosque.

### The distance to the ministry's gazetteer, published

`data/om-points-86.json` carries, per area: the solved point, the ministry gazetteer point it
matches, the public gazetteer point where one exists, and both distances.

| solved point against | areas | median | within 5 km | within 10 km |
|---|---|---|---|---|
| ministry gazetteer (own mosques) | 86 | 4.8 km | 44 | 62 |
| public gazetteer (Nominatim, re-keyed by name) | 77 | 3.6 km | 48 | 56 |

Both gazetteers carry a heavy tail: the Nominatim layer's p90 is 160 km, because a name search
returns a street, a filling station or a caravan site. Its worst: المعمورة resolved to a caravan
site in Bahla **731 km** from the solved point; الهويسة to a street in Bawshar 329 km away;
صراب to a locality on Jabal Akhdar 328 km away (the real صراب is in wilayat محوت, 24 mosques).

### The point is stable across years

Solving the same 86 areas independently from the **2027** table returns the same points:
median **0.47 km** apart, 86 of 86 within **1.8 km**, median latitude difference 0.004° and
longitude 0.002°. The point is a property of the publisher's computation, not a one-year
artefact. `fit/om-point-geometry-2027.json` against `fit/om-point-geometry.json`.

## 2. The rule test at the solved points: 100 pc within 1, worst 1 minute

One recipe, all 86 areas, all 365 days of 2026, at each area's own solved point:

**fajr 18.0°, isha 18.0°, Shafi asr, margins fajr 0, sunrise 0, dhuhr +5, asr +5, maghrib +5,
isha 0, round to nearest minute.**

| column | exact | within 1 | worst |
|---|---|---|---|
| fajr | 95.39 pc | 100.00 | 1 |
| sunrise | 94.30 | 100.00 | 1 |
| dhuhr | 92.55 | 100.00 | 1 |
| asr | 66.03 | 100.00 | 1 |
| maghrib | 70.80 | 100.00 | 1 |
| isha | 63.69 | 100.00 | 1 |
| **all 188,340 cells** | **80.46** | **100.00** | **1** |

**Every area scores 100 pc within 1; none scores less.** `fit/om-rule-at-solved.json`.
Ceil was scored on the same points for completeness and is worse on every count — exact 50.40 pc,
within-1 99.02 pc, worst cell 2 minutes — so the ministry rounds to the nearest minute. The
rounding-mode ridge the record closed as degenerate stays closed; this is the point test, and
nearest is what the tables do.

### The control arms: the same recipe at worse points

| point set | areas | exact | within 1 | worst |
|---|---|---|---|---|
| **solved from the table** | 86 | 80.46 pc | **100.00** | 1 |
| ministry gazetteer centroid | 62 | 69.5 | 95.4 | 5 |
| public gazetteer, keyed by name | 77 | 64.3 | 87.1 | 25 |
| public gazetteer, keyed by row position (o1m-27) | 77 | 34.1 | 53.2 | — |

The rule is fixed. The last two rows are the same cities with the same recipe and different
points. Repeating o1m-27's own measurement — the position-keyed attachment with its recorded
`(1,0,5,5,5,1)` margin set — gives a median of **19.4 pc** within 1 per area and 24 of 77 areas
above 95 pc here, the same shape as the 22.1 pc it recorded. That figure was the compound of the
position-keying defect and the centroid error, and never a statement about the rule.

### Is the rule regional after all? No.

At the solved points, scanning the depression angles per area on a 0.02° grid:

- **fajr**: 51 of 86 areas peak at exactly 18.00° and 19 more at 17.98°, which is the scan's
  own step; the remaining 16 sit at 17.76-17.78°. Exact at 18.00° = 95.4 pc, at each
  area's own optimum = 95.9 pc. A half point of gain over 86 independent fits is noise.
- **isha**: the per-area optimum scatters 17.50-18.20° and buys 63.7 → 67.2 pc exact, while
  within-1 stays 100 pc either way. The isha column is the one with the wider residual spread
  (§4), which is exactly what a weakly identified angle looks like.

`fit/om-angle-scan.json`. **No regional rule. One national pair, 18/18.**

## 3. The margins, all 86 areas, no exceptions

- `maghrib - sunrise` and `asr - dhuhr` come out as whole minutes for **86 of 86** areas, at
  margins 5 and 0. Their fractional parts are 0.005-0.036 of a minute.
- `fajr` and `isha` margins are **0 for all 86**; dhuhr, asr and maghrib margins are **+5 for
  all 86**; sunrise **0**.
- So the ministry adds an ihtiyat of five minutes to dhuhr, asr and maghrib and none to fajr,
  sunrise or isha. Sunrise reproduces the flat −0.833° horizon with **no dip**, which rules out a
  terrain-elevation correction at the sunrise column.

## 4. Defect: the two locales disagree about the CityID space

`calendar_page2.asp` (English, `value` 0-85) and `arabic/calendar_page2.asp` carry **different
name for the same CityID from 36 onward**. The English list is right (the served table matches
it); the Arabic selector labels `CityID 36` as `خزان` while serving Dibba's month. Any harvest
that trusts that selector's labels mislabels 47 of the 86 values.

Second defect: **asr, maghrib and isha carry a ±1.1-minute residual spread against a
nearest-rounded model where fajr, sunrise and dhuhr carry ±0.6.** Within-1 survives it (100 pc),
but the exact rate on those three columns is 63-71 pc against 92-95 pc on the other three, and the
spread is symmetric and bounded, which reads as a whole-minute intermediate value inside the
publisher's own pipeline rather than a geometry difference. Recorded, not repaired.

## 5. The nine names that no public gazetteer would place

All nine now carry a point. Six resolve inside the ministry's own file, five by exact name and
one (Kanhat) by a spelling the public gazetteer never tried; three are open country where no
settlement exists. Recorded as such, never guessed. The nine doubtful names of §9 are a
different set, and this list is the one the public gazetteer failed on.

| area | CityID | solved point | resolution | status |
|---|---|---|---|---|
| الخضرفي AlKhadrafi | 12 | 16.728, 53.143 | village **خضرفي**, wilayat ضلكوت; 4.1 km from the solved point, 2.6 km from حموت | resolved |
| القابل الظاهرة AlQabil(Dh) | 18 | 23.952, 55.799 | village **القابل**, wilayat البريمي (the al-Dhahirah of the name); 2.4 km | resolved |
| ظلكوت Dhalqut | 59 | 16.724, 53.245 | wilayat **ضلكوت**; 1.4 km from the village clustering | resolved |
| كنهات Kanhat | 64 | 23.552, 56.786 | village **كهنات**, wilayat عبري; 0.5 km. The ministry spells it with ه where the calendar prints ن | resolved |
| مرمول Marmul | 71 | 18.154, 55.179 | village **مرمول**, wilayat شليم وجزر الحلانيات; 6.2 km | resolved |
| مصنعة Musana'a | 73 | 23.788, 57.643 | wilayat **المصنعة**; 0.9 km from the souq cluster | resolved |
| الحمرة Al-Hamra | 10 | 23.806, 57.286 | **not** الحمراء of al-Dakhiliyah: the table fits the Batinah 80 km north | name doubtful, point solid |
| جدة الحراسيس J Harasis | 31 | 19.612, 56.245 | Jiddat al-Harasis, open desert; nearest mosque 33.9 km | area, not a settlement |
| رمال الوهيبة Rwahiba | 40 | 22.254, 58.786 | Wahiba sands; nearest mosque 16.8 km | area, not a settlement |

**Al-Hamra is the one that inverts.** The famous الحمراء of al-Dakhiliyah (23.11 N, 57.30 E)
scores 34.9 pc exact / 80.9 pc within-1 against the area's own 2026 table; the solved point
23.806 N, 57.286 E scores 79.1 pc / 100.0 pc. The ministry's prayer area called الحمرة is in
wilayat السويق on the Batinah, and the name alone misleads. Its gazetteer entry does not exist
in the ministry's own mosque survey, so the name stays doubtful and the point is published.

The three false hits the prior pass flagged are now measured: المعمورة was a caravan site in
Bahla **731 km** from the solved point, الهويسة a street in Bawshar **329 km** away, صراب a
locality on Jabal Akhdar **328 km** away (the real صراب is a village in wilayat محوت with 24
mosques). A public-gazetteer name search is not a locator.

### The solved points sit inside the ministry's own mosque survey

Distance from each solved point to the nearest mosque in the ministry's coordinate workbook:
median **0.98 km**; 11 areas sit within 250 m of a surveyed mosque, 44 within a kilometre. The far
tail is exactly the open-country areas: HARWEEL 26.7 km, KHAZAN 34.4 km, AL-HOWAISA 35.8 km,
SEYH RAWL 46.0 km, QARN ALAM 52.5 km.
The ministry's prayer area is a place in its own survey, and the table computes at it.

## 6. The tail: six years, one recipe, no dated change

`calendar_page2.asp?year=&month=&CityID=` serves 2021-2031 (the year selector's range), so the
whole forward window was walked for **all 86 areas**, not only the seven cities the record held:

**2027, 2028, 2029, 2030, 2031 × 86 areas × 12 months = 5,160 pages, 156,950 dated rows, zero
gaps, zero malformed cells** (`captures/om-page2/`, 121 MB; `data/om-rows-tail.json`).
With 2026 that is **188,340 dated rows and 1,130,040 prayer cells** on this object.

| year | areas | days served | cells | exact | within 1 | worst cell |
|---|---|---|---|---|---|---|
| 2026 | 86 | 365 | 188,340 | 80.46 pc | 100.00 | 1 |
| 2027 | 86 | 365 | 188,340 | 80.61 | 100.00 | 1 |
| 2028 | 86 | 365 of 366 | 188,340 | 80.51 | 100.00 | 1 |
| 2029 | 86 | 365 | 188,340 | 80.53 | 100.00 | 1 |
| 2030 | 86 | 365 | 188,340 | 80.45 | 100.00 | 1 |
| 2031 | 86 | 365 | 188,340 | 80.65 | 100.00 | 1 |

**No area-year falls below 100 pc within 1, and not one of the 1,130,040 cells across the six
years is more than a minute out.** The exact rate moves inside a 0.2-point band across the six years with no trend,
which is what a frozen recipe looks like. `fit/om-tail-fit.json`.

**The depth is not a relabelled edition.** 2027-01-01 differs from 2026-01-01 in the printed
minute for Muscat (fajr 05:28 against 05:29), the tables are recomputed per year, and the points
solved from the 2027 and 2031 tables independently land on the 2026 points: median **0.47 km**
and **0.48 km**, maximum 1.8 and 2.0 km over 86 areas. Six computed years, one recipe, one set of
points, and nothing to date.

**Grade A** by the round's vocabulary: six distinct fitted years on one recipe with the
parameters frozen, at 100 pc within 1.

**Forward longevity: PROVEN-TO 2031**, the end of the publisher's own selector. The page refuses
nothing inside its window, so the ceiling is the window and not the endpoint.

## 7. The margins and the recipe, stated once

| element | value | evidence |
|---|---|---|
| fajr angle | 18.0° | 51 of 86 areas peak at 18.00 on a 0.02° scan and 19 at 17.98; the rest at 17.76-17.78 |
| isha angle | 18.0° | one pair; the per-area optimum scatters 17.5-18.2 for +3.5 pc exact |
| asr | Shafi (shadow 1) | Hanafi collapses the latitude solve from 6.1 km to 162 km |
| high latitude | MiddleOfTheNight | never binds at 16-26° N |
| dhuhr margin | +5 min | the only value that puts solved longitudes on the wilayat centroids |
| asr margin | +5 min | asr − dhuhr residual is 0 to 0.005 min on all 86 |
| maghrib margin | +5 min | day-length residual is exactly 5 on all 86 |
| sunrise margin | 0 | sunrise reproduces the flat −0.833° horizon |
| fajr margin | 0 | 86 of 86 |
| isha margin | 0 | 86 of 86 |
| rounding | nearest minute | residues centre on 0 with uniform fractions |
| timezone | Asia/Muscat, UTC+4, no DST | the printed clock |

The ministry publishes **no** method statement: the calendar pages carry names and times only,
and neither the Arabic nor the English site states an angle, a madhab or an ihtiyat. The recipe
above is derived from 1.13 million printed cells, and it now reproduces them at 100 pc within 1.

## 8. Negatives and defects

| item | verdict | evidence |
|---|---|---|
| a published prayer-area coordinate list | **not found** | calendar pages 1-4 carry names and times only; `masajid.mara.gov.om` is a login-walled services portal (`/ar/Account/SsoLogin`, `/ar/Account/Register`), no public coordinate list; `opendata.gov.om` is a JS app behind a guest-token 307 loop; both locales searched |
| a stated calculation method | **not found** | no angle, madhab or ihtiyat statement on the Arabic or English ministry pages |
| the ministry's mosque map | found, not the 86 areas | `خارطة مساجد مسقط`, a Google My Maps export of **1,217 Muscat mosque placemarks** with Lat/Long, Town, State, Willayat (`captures/mapsd-kmz/doc.kml`) |
| Area 10 `الحمرة` | name doubtful, point solid | the table fits 23.806 N, 57.286 E on the Batinah at 100 pc within 1 and al-Hamra town at 80.9 pc |
| Areas 22 `الهويسة`, 47 `سيح الرول`, 70 `مرمور`, 80 `هرويل`, 82 `خزان` | points solid, no settlement in the survey | nearest mosque 17-46 km; open country and oil-field sites |

**Defect 1: the two locales disagree about the CityID space.** `calendar_page2.asp` (English,
`value` 0-85) and `arabic/calendar_page2.asp` carry a different name for the same CityID from 36
onward. The English list is right; the Arabic selector labels `CityID 36` `خزان` while serving
Dibba's month. Any harvest that trusts the Arabic selector's labels mislabels **47 of the 86**.

**Defect 2: `calendar_page4.asp`'s row order is alphabetical, not the CityID order.** Muscat is
forced to row 1, Khazan sorts to row 37, and the run 37-82 shifts by one. The rows are correct;
only their order is not the CityID space.

**Defect 3: asr, maghrib and isha carry twice the residual spread of the other columns.** ±1.1
minutes against ±0.6, symmetric and bounded, exact 63-71 pc against 92-95 pc, within-1 still
100 pc on every year. A whole-minute intermediate value in the publisher's pipeline, recorded
and not repaired.

**Defect 4: page 3, "the main areas", prints nine wrong names in ten.** `calendar_page3.asp`
carries ten rows labelled مسقط صلالة عبري نزوى البريمي صحار الرستاق صور ابراء هيماء, and their six
columns are **CityIDs 0-9 in order**, verified cell for cell against the month endpoint
(`captures/p3-2026-1-1.html`). Salalah's row is Ibra's table (fajr 05:26, dhuhr 12:14) where the
month endpoint gives Salalah 05:36 and 12:32; Sohar's is Buraimi's. Only Muscat is right. The
page is a labelled view of the first ten CityIDs, and it is the page a reader is most likely to
land on for a city.

**Defect 5: the publisher prints 365 days in a 366-day year.** February 2028 carries 28 rows, and
29 February 2028 exists in no area's table — 31,390 rows for the year where 31,476 would be
correct. The same is true of **February 2024, which also prints 28 rows**
(`captures/probe-2024-02.html`), so the omission is a standing convention of the publisher rather
than a fault of this year, and it dates to at least 2024. Nothing in the record's fit changes,
because the missing day is absent rather than wrong, but a consumer that expects a leap day will
not find one.

## 9. Counted state

| object | surfaces | dated rows | years | fit |
|---|---|---|---|---|
| Oman MARA, 86 prayer areas | 1 endpoint, year-month-CityID-parameterised | 188,340 | 2026-2031 | 18/18 Shafi + 5 min on dhuhr/asr/maghrib, **100 pc within 1 in every year, worst 1 min** |
| Oman MARA gazetteer | 1 workbook | 18,191 mosques with coordinates, 63 wilayats | current | the ministry's own coordinate layer |
| Solved point layer | 86 areas | — | 2026, 2027, 2031 | median 4.8 km from the ministry's own centroid; 0.47 km year to year |

Archive: **5,197 captures, 125 MB** in this workspace, of which 121 MB is the 5,160-page tail
sweep.

## 10. NEXT

1. **Nine areas still carry a doubtful name** (10, 21, 22, 31, 40, 47, 70, 80, 82) though every
   one of them carries a solved point. Two of them (22, 47) fall in no wilayat at all: open
   desert. A wilayat boundary set (NCSI) would name these by containment rather than by
   proximity, and the ministry's mosque survey is a sample rather than a register.
2. **2021-2025 for all 86 areas** is the one hole left in the forward window. The record holds
   2021-2031 for seven cities only; the endpoint serves every year in the selector, so 5,160
   more pages close the back half of the span.
3. **The area 10 name** deserves a native-language search for `الحمرة` as a place in wilayat
   السويق; the point is settled and only the name is open.
4. **The ±1.1-minute spread on asr, maghrib and isha** is the one unexplained mechanical detail.
   The publisher's own app (`om.gov.mara.omanical`, `net.almadinagroup.marazakat`) would settle
   whether it is a two-stage rounding, but it is app-only.
5. **The other thirteen ministry workbooks** were listed and not taken: awqaf counts, hajj, zakah.
   None carries prayer times or coordinates beyond the mosque file.

## Assumptions

- The 86 CityIDs are read through the English selector plus time-equality against the page-4
  rows, not through the Arabic selector, because the served month for `CityID 36` matches
  Dibba's row and not Khazan's — three dates agree.
- A prayer area's point is read as the place the ministry computes at, and the mosque-median of
  a wilayat is read as a centroid of that wilayat rather than as the ministry's anchor — the
  solved points land 4.8 km from it on median, which is the size of the difference, not zero.
- The five-minute dhuhr margin is read as national because only that value places the solved
  longitudes on the wilayat centroids (0.021° median against 0.245° at +4 and 0.256° at +6).
- Latitude is taken from the shape of the day-length and asr-span curves because a constant
  margin, including a horizon dip, cannot move a shape.
- The 2027-2031 tables are read as freshly computed years, not relabelled ones, because the
  printed minutes differ year to year and the independent solves agree to 0.5 km.
