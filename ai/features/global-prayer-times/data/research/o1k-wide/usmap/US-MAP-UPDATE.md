# US map update: the configured North American practice after tonight's captures

Agent `usmap`, 2026-11-10. Reads C47 (`census/c47-practicemap/REPORT.md`), tonight's captures under
`census/o1k-wide/americas/` and `americas2/`, and the fit results in `fit5/` and `fit7/`. Every
number below comes from a script in this directory over those files, or from C47's own output tables.
No network was used and no clock was read.

The prior map's rule is kept unchanged: label by the configured platform default, not by a mosque's
stated choice, and carry the caveat that the captured payload exposes no method field.

## 0. What was measured tonight

36 mosque-years measured here with C47's own method (`measure2.js` reuses its solar geometry and
its parsing helpers): 23 United States years, being eleven in 2026 and the twelve repeat years of
the six three-year profiles, and 13 Canadian years. One further Canadian capture is excluded as
unmeasurable.

The method is C47's, restated: latitude from the annual daylight curve plus the asr interval,
longitude from the printed solar noon, fajr and isha as the sun depression the printed column
implies, measured from the horizon crossing. Angles are identified in the dark quarter, where no
high-latitude fallback enters. Family windows are C47's own half degree.

Eight captures carry a defect, so eight were corrected from the defect's own fault model before
measuring (`corrections.json`):

| Install | Defect | Correction | Rows |
|---|---|---|---|
| Toledo OH | five of six columns on the standard offset through the whole DST window, sunrise correct | window dropped | 238 |
| San Antonio TX | transition-day rows on the outgoing offset, per column | three rows dropped | 3 |
| Bilal Centre, Winnipeg | November block printed one hour late | block re-shifted −60 | 30 |
| Manitoba Islamic Association | November block printed one hour late | block re-shifted −60 | 30 |
| Brandon MB | November block printed one hour late | block re-shifted −60 | 30 |
| Markaz Ul Islam, Edmonton | 1 Nov to 31 Dec printed one hour late | block re-shifted −60 | 61 |
| Masjid Al-Fatima, Edmonton | 1 Nov to 31 Dec printed one hour late | block re-shifted −60 | 61 |
| Masjid At-Taqwa, Edmonton | November block printed one hour late | block re-shifted −60 | 30 |

## 1. The updated United States tally

C47 measured 126 US mosques from the Masjidal platform alone. Tonight adds eight, of which five are
Masjidal and three are the WordPress dpt plugin, so the US corpus now spans two independent products.

| Measure | Mosques | Share of 134 |
|---|--:|--:|
| Fajr 15 / isha 15 | **105** | **78.4 %** |
| Fajr 15, any isha | 111 | 82.8 % |
| Fajr 18 family | 17 | 12.7 % |
| Hanafi asr | 40 | 29.9 % |
| Isha as a fixed post-maghrib interval | 0 | 0 % |

The eight new mosques, every one at 15/15:

| Mosque | Feed | Fajr | Isha | Asr | Fajr dark RMS (min) |
|---|---|--:|--:|---|--:|
| Dar al-Hijrah, Falls Church VA | dpt | 14.84 | 15.01 | Shafi | 0.79 |
| Islamic Center of Greater Toledo | dpt | 14.91 | 14.92 | Shafi | 0.39 |
| Muslim Center of San Antonio | dpt | 14.95 | 14.97 | Shafi | 0.55 |
| Memphis Islamic Center | Masjidal | 14.82 | 15.00 | Shafi | 0.42 |
| Richmond Islamic Community Center TX | Masjidal | 15.19 | 14.81 | Hanafi | 0.43 |
| MAS Tarbiyah Center, Livonia MI | Masjidal | 14.99 | 15.00 | Shafi | 0.41 |
| Ethiopian Muslim Association, SeaTac WA | Masjidal | 15.00 | 14.99 | Shafi | 0.42 |
| Islamic Center of Tennessee | Masjidal | 15.00 | 15.00 | Shafi | 0.36 |

**The 77 per cent did not come from one product's default.** C47 could not rule out that 15/15 was
the Masjidal platform's setting as against a mosque's choice, because its whole corpus was that one
platform. Tonight's three dpt installs read 15/15 too, at 0.39 to 0.79 minutes of dark-quarter
residual, and so do the two Quebec mawaqit pages and the Halifax dpt feed. Three independent
products ship the same default. The honest reading of 15/15 is now a house default rather than one
vendor's, and the caveat that it may be a default rather than a choice survives unchanged.

**Three-year stability.** Six clean Masjidal profiles were captured for 2024, 2025 and 2026: 18
mosque-years, all at 15/15, with a largest angle movement of **0.03 degrees** across the three
years (`measure.json`). The configuration is frozen, not drifting.

**The re-reads confirm C47 where they overlap.** Three mosques were already in C47's corpus, and all
three come back at 15/15 again: IANT Richardson at 15.00/15.01, South Bay Lomita at 14.81/15.16,
Jamaica NY at 15.01/15.00. IANT is the decisive one, because that mosque also runs a dpt feed which
is 18/17. Measured against each other over the 364 shared days of 2026:

| Column | Masjidal widget minus dpt | Range |
|---|---|---|
| fajr | **+15.57 min** | +14 to +19 |
| isha | **−10.48 min** | −13 to −9 |
| sunrise, dhuhr, asr, maghrib | −0.2 min | −2 to +1 |

The live page and the feed disagree on exactly the two twilight prayers, and the page is what a
person standing there reads. C47 fitted the Masjidal columns and got 15/15. Tonight's independent
dpt capture would have scored the same mosque 18/17. Any future capture of `iant.com`'s own route
must be gated against the widget, and the widget wins.

## 2. Canada, stated separately

Canada is not 13/13 and it is not 15/15 either. 26 mosques carry a measurement after tonight:

| Measure | Mosques | Share of 26 |
|---|--:|--:|
| Fajr 15 / isha 15 | **14** | **53.8 %** |
| Fajr 15, any isha | 20 | 76.9 % |
| Fajr 18 family | 5 | 19.2 % |
| Hanafi asr | 8 | 30.8 % |
| Isha as a fixed interval, no angle | **3** | **11.5 %** |
| Fajr 13 / isha 13 (FCNA's Canadian pair) | **0** | **0 %** |

**The 13/13 statement against the measurement.** FCNA's page states 13/13 for Canada. Not one of the
26 Canadian mosques configures it. C47's 16 gave 7 at 15/15 and 10 at a 15 degree fajr. Tonight's
ten Toronto, Kitchener, Halifax, Winnipeg, Quebec and prairie mosques add 7 more at 15/15, so the
Canadian fajr sits at 15 degrees on three quarters of the sample and at 18 degrees on a fifth.

**Canada's isha is the interesting column, and it is an interval on three mosques.** Toronto's two
largest mosques print no isha angle at all:

| Mosque | Fajr | Isha | Evidence |
|---|--:|---|---|
| Masjid Toronto (MAC) | 14.87 | **maghrib + 80** | exactly 80 on 365 of 365 days, one distinct value (`relations.json`) |
| Islamic Institute of Toronto | 14.86 | **maghrib + 90** | 90 on 345 days, 89 on the 20 April days |
| Saskatoon Mosque | 14.74 | **maghrib + 85** | 85 on 335 days, 90 on 30 days |

Read back as an angle, Masjid Toronto's interval runs from 11.7 degrees in June to 15.7 in October
(`fit5/REPORT.md`), which is what a fixed interval looks like when forced into an angle. That wobble
is the whole of the record's "implied seasonal angle" in Canada.

Saskatoon's 30 days at +90 are not a summer fallback: they run 18 February to 19 March 2026, which
is Ramadan 1447. The mosque lengthens its isha interval by five minutes through Ramadan and returns
to 85. Saskatoon also prints dhuhr 2.0 minutes before the midpoint of its own sunrise and maghrib pair, so
a caution sits inside the printed pair rather than on a stated offset. Its recipe is fajr 15, isha
maghrib + 85 (90 through Ramadan), Hanafi asr.

**Kitchener's summer ceiling still stands and is not an angle.** Isha is pinned at exactly 22:10:00
on 89 consecutive days, 11 May to 7 August 2026. The largest ordinary isha is 22:09, the day before
the cap engages. With those 89 days excluded the underlying column fits 15.03 degrees at 0.42 minutes
of dark-quarter residual (`measure.json`). The cap is a mosque-authored ceiling the app cannot derive
from an angle.

**Quebec is the cleanest Canadian pair.** Both Quebec City mosques read 14.99/14.99, the Conseil at
0.42 minutes of dark residual and the Mosquee de la Capitale at 0.44, on published coordinates. Two
mosques, one identical 15/15 configuration, their own separate jumua times.

**The prairie defect cluster is six installs, not one.** All six print a block one hour late: three
Winnipeg and Brandon for November, two Edmonton profiles to the end of December, and one Edmonton
profile for November. The defect crosses both products, so it sits in the shared generator. For
Brandon the fault hides inside the civil transition: sunrise runs 08:28 on 31 October and 08:30 on
1 November, which looks continuous only because the +60 error cancels the real −60 clock change
(`relations.json`).

## 3. The engine artefact, and what it dissolves

`fit7` established that the publisher-side engine is a PrayTimes v2-family implementation: both
mawaqit tables and the Masjidbox table reproduce **exactly at zero margins** on it, five of six
columns on 365 of 365 rows for each mawaqit table and seven of seven for the Masjidbox one, while
adhan 4.4.6 does not. Two residues that an adhan-anchored fit
reports as mosque decisions are engine artefacts: a phantom −1 minute dhuhr margin, because adhan's
transit sits about a minute after this engine's, and a ±1.2 minute seasonal skew on asr, because
adhan takes the declination at the day's start where this engine takes a 13h seed.

**The ±1 layer of the prior map's margins dissolves, and no family call moves.**

| | within ±1 minute | exactly 0 |
|---|--:|--:|
| C47 fajr margin | 131 of 151 (86.8 %) | 101 |
| C47 isha margin | 121 of 151 (80.1 %) | 94 |

C47's own precision statement is that an angle is resolved to about a quarter degree. One minute of
clock at these latitudes is 0.2 to 0.3 degrees of fajr angle. A ±1 minute margin therefore sits at
or below the identification floor of a table printed to the minute, and `fit7` shows it vanishes
entirely on the engine the table was built with. The margin column is not a second parameter. Read it
as engine noise, not as a mosque caution. Where a caution is large and structured it is real and
stays: Honduras at +5 on maghrib and isha, and Venezuela at +2 on three columns.

No family call depends on the margin layer, because C47 drew its families on a half degree window,
which is wider than every residue in the table. The 15/15 count of 97 does not change under this
finding. What the finding does remove is the temptation to read a 14.75 or 15.25 column as a distinct
sub-convention.

**One prediction failed, and the negative belongs in the record.** C47 explains its 14.75 bucket as
the 15.0 line read through a sunrise printed one minute early. I tested that on tonight's 20
measurable mosques, by regressing the fitted fajr angle on the printed sunrise offset. The slope is
**+0.104 degrees per minute**, the right sign and about half C47's implied 0.20, so the mechanism is
real and explains roughly half the sub-half-degree spread. I also predicted that measuring the
depression against the printed solar noon instead of the printed sunrise would collapse the spread.
It did not: the noon-referenced angles centre on 15.0 (mean 14.964) but scatter slightly wider, sd
0.145 against 0.119 for the gap measure (`noon.json`, `sunrise.json`). The residual is minute
quantisation, not a sunrise offset. Either way no mosque in the sample sits nearer 14 or 18 than 15,
so the family call is unaffected.

## 4. The honest North American default, with counts

| | Mosques | Fajr 15 / isha 15 | Fajr 15 | Fajr 18 family |
|---|--:|--:|--:|--:|
| United States | 134 | **105 (78.4 %)** | 111 (82.8 %) | 17 (12.7 %) |
| Canada | 26 | **14 (53.8 %)** | 20 (76.9 %) | 5 (19.2 %) |
| North America | 160 | **119 (74.4 %)** | 131 (81.9 %) | 22 (13.8 %) |

The statement for the master table is:

> **The honest North American community default is fajr 15 and isha 15, at 119 of 160 measured
> mosques (74 per cent), and a 15 degree fajr at 131 of 160 (82 per cent). The 18 degree family is
> 22 mosques (14 per cent). Hanafi asr is 48 of 160 (30 per cent). No mosque in either country
> configures FCNA's Canadian 13/13 pair.**

Three qualifications travel with it. First, this is the delivered computation, not a stated method,
because the payload carries no method field. Second, Canada is materially less uniform than the
United States: 54 per cent at 15/15 against 78 per cent, a 19 per cent 18 degree block against 13
per cent, and the only fixed-interval isha practice in the North American corpus. C47's three
interval rows are Australian and Hong Kong mosques, none of them American or Canadian. Third, the
Canadian sample is 26 mosques against the American 134, so its shares carry the wider uncertainty.

## 5. Defects added to the record tonight

1. **The transition-row class, new.** San Antonio prints individual columns on the outgoing offset
   for one to two days after a clock change: on 9 March 2026 sunrise, dhuhr and isha are 60 minutes
   early while fajr and maghrib are correct, and on 1 and 2 November fajr alone is 60 minutes early
   while the other five are correct. Three rows in 365. This is a fourth distinct class beside the
   serving-2020 stale install, the single-November block and Toledo's whole-window shift, and its
   mark is that the damage is per column rather than per day.
2. **Saskatoon's Ramadan interval.** Isha is maghrib + 85 for 335 days and maghrib + 90 for the 30
   days of Ramadan 1447, 18 February to 19 March 2026. A seasonal five-minute lengthening, printed,
   not derivable from an angle.
3. **Kitchener's cap, confirmed and quantified.** 89 consecutive days at exactly 22:10:00 from
   11 May to 7 August 2026, against a largest ordinary value of 22:09.
4. **The prairie cluster, counted.** Six installs across two products, Manitoba and Alberta, one
   signature.
5. **London, Ontario remains the arithmetic class.** `islamiccentre.ca` carries a different offset on
   each of its six columns and no measurement is possible, so it is excluded from all shares above.

## 6. What this update does not settle

- The method field is still absent from every payload. 15/15 cannot be separated into a mosque's
  choice and a vendor's default, and the two-platform agreement in section 1 makes the default
  reading stronger rather than weaker.
- One Canadian capture is unmeasurable and one Edmonton profile (At-Taqwa) carries a corrupted
  absolute offset, so its angles are read from the gaps but its margins are not reported here. C47
  withheld margins for the same four timezone-defective mosque-years while keeping their angles.
- Canada's 26 mosques are spread thin: Edmonton carries 5, Winnipeg 3, Toronto 3 and Quebec City 2,
  and the other 13 stand alone in 13 towns. The prairie and Atlantic figures rest on three and one
  mosques respectively.
- Every feed is one year except the six three-year Masjidal profiles, so a frozen recipe and a
  slowly drifting one are indistinguishable outside those six.
- No US mosque in 134 uses a fixed isha interval. That is a real asymmetry with Canada and not a
  sampling artefact of the three known interval mosques.

## 7. Paths

| path | content |
|---|---|
| `relations.js`, `relations.json` | printed-relation checks: IANT widget against dpt, isha minus maghrib per mosque, Kitchener's cap, Toledo's half-days, the prairie month jumps |
| `measure2.js`, `measure.json` | the fitter and its 36 mosque-years, with the eight corrections applied |
| `corrections.json` | what each defect correction moved, and how many rows |
| `tally.js`, `tally.json` | C47's 151 as the base, tonight's additions by platform id, the merged US and Canadian counts |
| `noon.js`, `noon.json` | the depression measured against the printed solar noon instead of the printed sunrise |
| `sunrise2.js`, `sunrise.json` | the printed sunrise offset per mosque and the angle-on-offset slope |
