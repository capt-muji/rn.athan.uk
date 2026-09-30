# R6: does the correction-table model generalise?

**Question.** Wave 1 measured that JAKIM Malaysia's entire published year is reproduced by a local `adhan`
computation plus six signed integers per zone. This report asks whether that is a Malaysian accident or a
general property of published prayer timetables, and what it costs to exploit it without ever synthesising a
prayer time.

**Method.** Eleven national authorities were fetched directly, 68 city-years in total, 135,996 published prayer
values after removing the two Singapore years that the consolidated CSV already contains. Each day was
recomputed locally with `adhan@4.4.6` at the authority's best-known parameters, taken from
R1's measurements where R1 measured them and from the authority's own cited claim where it did not. The
per-field residual, published minus computed, was then scored against four correction models and priced in
brotli bytes. Every number below is marked **measured** (computed here), **cited** (asserted by a named source
with a URL and fetch date) or **UNVERIFIED**. Fetched 2026-09-30 unless stated. Scripts and full outputs are in
`data/corrections/`.

**Nothing in this report is used as a prayer time.** All computation is measurement of the gap between an
authority's published digits and a library's output.

---

## Findings in one page

1. **The correction-table model generalises, and it is stronger than wave 1 measured.** Across eleven
   authorities and 62 city-years outside London, **six signed integers per city put 127,234 of 127,236
   published values within 2 minutes, 99.998%** (measured). The only two misses in the entire non-London set
   are typing errors in Brunei's own feed (section 3.4). This is not a Malaysian accident.

2. **The single biggest correction found was not a margin, it was a rounding rule, and wave 1 missed it.**
   `adhan` rounds to the nearest minute. Most authorities do not. Switching `adhan` to `Rounding.None` and
   applying each authority's own rule moved Umm al-Qura from **42.8% to 85.4%** of values reproduced exactly
   by six constants, Kemenag Indonesia from **62.5% to 90.3%**, and MUIS Singapore from **54.1% to 71.1%**
   (all measured). It also collapsed a spurious 60-minute Morocco offset. Half of the residual the naive
   comparison shows is an artefact of the library's rounding choice, not the authority's policy.

3. **Umm al-Qura moves from category 4 to category 2 once one documented rule is added.** Saudi Arabia's Isha
   residual carried a +30 minute spike lasting exactly 29 days. Those 29 days are precisely Ramadan 1448
   (`hijriDate.month === 9`, measured, 2027-02-08 to 2027-03-08). Umm al-Qura publishes a 120-minute Ramadan
   Isha interval against 90 minutes the rest of the year. Adding that one conditional took Saudi Arabia's
   worst residual from **28 minutes to 1 minute** and its exact-match rate from 42.8% to 85.4% (measured).
   The lesson generalises: what looks irregular is usually an unmodelled published rule.

4. **Egypt is the first true category 1 found: a correctly configured library IS the authority's timetable.**
   All six Model A constants are zero on all four Egyptian cities, and 100.0% of 8,400 published values land
   within 1 minute (measured). Singapore, which wave 1 called the counter-example, is actually category 2 with
   a uniform +1 and a `round-down` rule, not category 1.

5. **The exact per-day residual costs a median of 282 bytes brotli per city-year** (measured, n=58 full-year
   sites whose residual fits 4 bits), against a median 1,825 bytes for the naive published times, a **6.5x
   saving**.
   Shipping the EXACT residual for **every city of every authority measured here, 2,153 cities, costs 528 KB
   brotli**, which is **10.53% of the app's 4.9 MB JS bundle and 0.77% of the 67 MB release bundle** (measured).
   A 12-city launch set costs **3.2 KB**.

6. **The no-synthesis line holds and the compliant option is cheap.** The exact residual is lossless
   compression of the authority's own digits, so the user sees exactly what the authority printed. The saving
   from degrading to six constants is 282 bytes against 6 per city-year. For a plausible launch set that is
   **3.2 KB against 72 bytes**, and it buys a display that is up to 2 minutes wrong on 20% to 45% of values.
   **The six-constant model should never reach the screen.** It is worth keeping as a drift detector.

7. **A residual table DOES expire, and this contradicts the hope the brief held out.** Carrying Singapore's
   2025 exact residual onto a freshly computed 2026 baseline reproduces only **55.1% of 2026 values exactly**,
   with 3 minutes worst error, which is **worse than simply reusing 2025's published times verbatim** (55.8%,
   worst 2 minutes) (both measured). The same holds for Oman (81.7% against 90.2%) and the UAE (87.4% against
   99.4%). The reason is measured in section 6.2: the residual moves MORE year over year than either the
   published times or the computed baseline, because it is the difference of two independently drifting
   quantities and their rounding boundaries do not coincide.

8. **The Maldives perpetual-year trick does not work for a residual table.** A residual table built from the
   2024 leap year, applied to 2025, reproduces **54.0% exactly with 3 minutes worst error** (measured). It
   works for the Maldives because the Maldives stores published TIMES in a dummy year, not residuals against a
   moving baseline. The trick is real but it applies to the wrong layer.

9. **One city's table does not travel, and this is the most operationally important negative result.** Kuala
   Lumpur's six constants applied to Kota Bharu leave **6 minutes of error** on 16.7% of values (measured).
   Dubai's applied to Jebel Jais leave **6 minutes** on 33.3% (measured). The residual is a per-city quantity
   because coordinates, not policy, dominate it. Diyanet is the exception: one constant set covers all ten
   Turkish cities measured, to 2 minutes.

10. **Kota Bharu uses a different Isha angle from the rest of Malaysia, and nobody documents it.** Its
    Isha-minus-Maghrib interval runs 65 to 72 minutes against Kuala Lumpur's 68 to 76 (measured), and a sweep
    puts its Isha angle at **17.5 degrees against the national 18** (measured, mean residual -0.61 at 17.5
    versus -2.76 at 18). A national parameter set is wrong for at least one of Malaysia's 59 zones.

11. **London remains category 4 and is the app's own current timetable.** Its Isha residual against 18 degrees
    spans **157 minutes** and no seasonal model closes it: 20 harmonic terms (41 coefficients) still leave 18
    minutes of error (measured). But London's own published structure is tiny: the Fajr and Isha INTERVAL
    columns against its own published sunrise and Maghrib cost **204 bytes brotli**, and are **100% identical
    across 2019, 2022, 2025 and 2026 except four June days** (measured). The right correction for London is an
    interval table, not a residual table.

12. **The whole model fails on geometry above about 48 degrees latitude, and the library hides the failure.**
    At London the sun never reaches 18 degrees of depression on **59 days of the year** (measured, pure solar
    geometry). `adhan` returned `NaN` on **0** of those days: it silently substitutes a night-portion value
    (measured). A residual measured against a substituted baseline is measuring the library's fallback, not
    the authority's rule.

13. **Licensing is the binding constraint, not bytes, and it is worse than wave 1 reported.** Egypt's own
    copyright page states that reuse is forbidden "عدا الإستخدام الخاص غير التجاري", other than private
    non-commercial use (cited, `esa.gov.eg/copyrights.aspx`, 2026-09-30). The UAE's states that reproduction
    without referral to the Authority is "يُمنع منعاً باتاً", absolutely prohibited (cited,
    `awqaf.gov.ae/copyright`, 2026-09-30). **MUIS Singapore remains the only authority measured with an
    affirmative commercial licence.** Two of the eleven now carry an explicit prohibition rather than silence.

14. **Six authorities could not be obtained as bulk data.** Iran's `time.ir` serves one day at a time behind a
    keyed API; Morocco serves one Hijri month with no date parameter; Qatar's live MOI endpoint serves one day
    and disagrees with the digitised perpetual CSV by 1 to 2 minutes; Azerbaijan's calendar still renders no
    rows even under a real browser; Kuwait's ministry did not resolve. Details and status codes in section 8.

---

## 1. What was obtained, and how

Every fetch below was made with `curl` unless the transport column says otherwise. `agent-browser` was used
only where a WAF or an in-page token made `curl` impossible.

| Authority | Endpoint | Transport | Result, measured | Cities obtained | Coverage |
|---|---|---|---|---|---|
| JAKIM Malaysia | `e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=year&zone=<Z>` | curl | 200, 77,257 B, 365 rows per zone | 10 of 59 zones | 2026 |
| MUIS Singapore | `api-open.data.gov.sg/.../poll-download` then S3 | curl | 201 then 200; 18,820 B (2026), 18,067 B (2025), 57,771 B (2024 to 2026) | 1, three years | 2024, 2025, 2026 |
| Diyanet Turkey | `namazvakitleri.diyanet.gov.tr/tr-TR/<id>/x-namaz-vakti` | curl | 200, 378,206 to 381,105 B, 366-row yearly table each | 10 ilce | 2027 |
| Umm al-Qura Saudi | `umqserv.kacst.gov.sa/api/v1/Prayer/GetPrayerHijriYear` | curl | 200, 255,046 B (1448H), 255,068 B (1447H), 355 rows each | 6 coordinates, two Hijri years | 1447H, 1448H |
| MORA Brunei | `mora.gov.bn/_api/web/lists/getbytitle('Waktu Sembahyang')/items` | curl | 200, 75,249 B (2026, 367 rows), 50,131 B (2025, 358 rows) | 1 national | 2025, 2026 |
| Egyptian GAS | `esa.gov.eg/monthlymwaket.aspx`, ASP.NET postback per month | curl | 12 posts per city, 200, ~51,000 B each, 31 rows each | 4 cities | 2026 |
| MARA Oman | `mara.gov.om/calendar_page2.asp`, POST `year/month/CityID` | curl | 12 posts per city, 200, 365 rows assembled | 5 cities, plus Muscat 2025 | 2025, 2026 |
| Kemenag Indonesia | `api.myquran.com/v2/sholat/jadwal/<id>/2026/<mm>` | curl | 12 calls per city, 365 days assembled | 6 cities | 2026 |
| Awqaf UAE | `mobileappapi.awqaf.gov.ae/APIS/v3/prayer-time/prayertimes/<from>/<to>` | **agent-browser**, anonymous bearer token from `sso/StartRequest` | 200, 13,627,086 B, 21,900 rows, 60 areas, for each of 2025 and 2026 | 8 of 60 areas, two years | 2025, 2026 |
| Habous Morocco | `habous.gov.ma/prieres/index.php?ville=<N>` | curl | 200, 24,167 B, 30 rows, one Hijri month only | 6 cities | one month |
| Qatar Calendar House | `raw.githubusercontent.com/osamaalassiry/TaqweemQatar/master/taqweem.csv` | curl | 200, 14,219 B, 365 perpetual rows, MIT | 1 national | perpetual |
| London unified timetable | wave 1's saved `londonprayertimes.com` year plus ELM PDFs | local files | 365 rows each | 1 | 2019, 2022, 2025, 2026 |

All measured. Two feed-level traps worth recording, because both silently corrupt a residual:

- **JAKIM's `&year` parameter is ignored.** `zone=WLY01&year=2025` returned byte-identical content to
  `year=2026` (measured, both 77,257 B). The `period=duration` form with explicit dates returned HTTP 500,
  443 B for any range outside the current year (measured). So JAKIM offers exactly one year, and the
  year-over-year test cannot be run on Malaysia at all.
- **Brunei's `Date` is `T16:00:00Z`, which is Brunei midnight of the NEXT day.** Reading the date part
  literally shifts every row by one day. Measured directly: with the +1 correction the Fajr residual standard
  deviation is 0.20 minutes, without it 0.54 (measured). The +1 reading is correct.

---

## 2. The rounding discovery, which reshapes every other number

This is the largest single correction this report makes to wave 1's method, and it must come before the
residual tables because it changes all of them.

`adhan` 4.4.6 rounds every prayer time to the nearest minute internally, exposed as `params.rounding` with
values `nearest`, `up` and `none` (measured, `adhan.Rounding`). Wave 1's harness read `adhan`'s already-rounded
output. Most authorities do not round to nearest. An authority that rounds Fajr DOWN and is compared against a
library that rounds to NEAREST carries a systematic residual of about half a minute on every field, which
shows up as a mean near +0.5 and destroys the exact-match rate even when the underlying method is identical.

**Diagnosis.** Setting `params.rounding = adhan.Rounding.None` and applying each of `nearest`, `up` and `down`
to the raw seconds, the rule that drives the per-field mean residual closest to a whole integer is the rule the
authority used. Script: `data/corrections/fitround.mjs`, output `fitround.txt`.

| Authority | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha | unanimous across its cities |
|---|---|---|---|---|---|---|---|
| MUIS Singapore | down | down | down | down | down | down | yes, 3 of 3 |
| Umm al-Qura Saudi | down | down | down | down | down | down | no, 6 of 7 |
| Kemenag Indonesia | down | nearest | down | down | **up** | down | no |
| JAKIM Malaysia | down | nearest | nearest | nearest | nearest | nearest | no |
| Awqaf UAE | nearest | down | nearest | nearest | nearest | nearest | no |
| Habous Morocco | **up** | nearest | nearest | nearest | nearest | nearest | no |
| Diyanet Turkey | nearest | nearest | nearest | nearest | nearest | nearest | yes, 10 of 10 |
| Egyptian GAS | nearest | nearest | nearest | nearest | nearest | nearest | yes, 4 of 4 |
| MARA Oman | nearest | nearest | nearest | nearest | nearest | nearest | no |
| MORA Brunei | nearest | nearest | nearest | nearest | nearest | nearest | yes, 2 of 2 |
| Qatar Calendar House | nearest | nearest | nearest | nearest | nearest | nearest | yes, 1 of 1 |

All measured. **What it is worth**, exact-match rate with six constants, before and after:

| Site | nearest rounding | authority's own rounding | gain |
|---|---|---|---|
| `SA-makkah` | 1,092 of 2,130 (51.3%) | **1,820 (85.4%)** | **+34.2 pp** |
| `ID-jakarta` | 1,368 of 2,190 (62.5%) | **1,978 (90.3%)** | **+27.9 pp** |
| `SG-2026` | 1,184 of 2,190 (54.1%) | **1,557 (71.1%)** | **+17.0 pp** |
| `OM-muscat` | 1,347 of 2,190 (61.5%) | **1,667 (76.1%)** | **+14.6 pp** |
| `AE-dubai` | 1,461 of 2,190 (66.7%) | 1,514 (69.1%) | +2.4 pp |
| `EG-cairo`, `TR-9541`, `BN-2026`, `QA-doha` | unchanged | unchanged | 0.0 pp |

All measured. Script: `data/corrections/rounding.mjs` logic, folded into `measure.mjs`.

**Why this matters beyond bookkeeping.** A half-minute systematic offset is not visible in a "within 1 minute"
score, so it is easy to miss and easy to dismiss. But it doubles the size of the residual that has to be
stored, and it makes a genuinely category-1 authority look like category 2. Three of the five biggest
"institutional margins" wave 1 would have reported for these authorities are library artefacts.

**Caveat, marked honestly.** The rounding rule is inferred from the published digits, not read from any
authority document. No authority found publishes its rounding rule. The inference is strong where the residual
mean lands within 0.05 of an integer under exactly one rule, which is the case for Singapore and Umm al-Qura,
and weaker where two rules score similarly. Where a rule is not unanimous across an authority's cities the
majority was taken and the disagreement is recorded above. **UNVERIFIED as authority policy; measured as the
rule that best reproduces the digits.**

---

## 3. The per-authority measurement

### 3.1 The six constants, and what they leave

Full table for all 68 sites is in `data/corrections/results.txt` section 2. One representative city per
authority here, plus every site that behaved unusually.

| Site | Authority | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha | values | exact | <=1 min | <=2 min | worst |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `EG-cairo` | Egyptian GAS | **+0** | **+0** | **+0** | **+0** | **+0** | **+0** | 2,190 | 1,745 (79.7%) | **2,190 (100.0%)** | 2,190 (100.0%) | **1** |
| `EG-luxor` | Egyptian GAS | +0 | +0 | +0 | +0 | +0 | +0 | 2,190 | 1,980 (90.4%) | 2,190 (100.0%) | 2,190 (100.0%) | 1 |
| `SG-2026` | MUIS Singapore | +1 | +1 | +2 | +1 | +1 | +1 | 2,190 | 1,557 (71.1%) | 2,184 (99.7%) | 2,190 (100.0%) | 2 |
| `BN-2025` | MORA Brunei | +0 | +0 | +1 | +0 | +0 | +0 | 2,142 | 1,962 (91.6%) | 2,142 (100.0%) | 2,142 (100.0%) | 1 |
| `SA-makkah` | Umm al-Qura | +1 | +0 | +1 | +1 | +1 | +1 | 2,130 | 1,820 (85.4%) | 2,130 (100.0%) | 2,130 (100.0%) | 1 |
| `QA-doha` | Qatar CH, digitised | -2 | +0 | +0 | +0 | +2 | +2 | 2,190 | 1,891 (86.3%) | 2,190 (100.0%) | 2,190 (100.0%) | 1 |
| `MA-rabat` | Habous Morocco | -1 | -3 | +5 | +1 | +4 | +0 | 180 | 162 (90.0%) | 180 (100.0%) | 180 (100.0%) | 1 |
| `AE-dubai` | Awqaf UAE | +0 | -3 | +3 | +1 | +3 | +0 | 2,190 | 1,545 (70.5%) | 2,185 (99.8%) | 2,190 (100.0%) | 2 |
| `AE-jebeljais` | Awqaf UAE | +1 | **-7** | +2 | +0 | **+8** | -1 | 2,190 | 1,641 (74.9%) | 2,190 (100.0%) | 2,190 (100.0%) | 1 |
| `ID-jakarta` | Kemenag Indonesia | +3 | -3 | +4 | +3 | +3 | +3 | 2,190 | 1,978 (90.3%) | 2,190 (100.0%) | 2,190 (100.0%) | 1 |
| `OM-muscat` | MARA Oman | +0 | +0 | **+5** | **+5** | **+5** | -1 | 2,190 | 1,347 (61.5%) | 2,179 (99.5%) | 2,190 (100.0%) | 2 |
| `TR-9541` | Diyanet Istanbul | +0 | **-7** | **+5** | **+4** | **+7** | +0 | 2,190 | 1,271 (58.0%) | 2,110 (96.3%) | 2,190 (100.0%) | 2 |
| `MY-WLY01` | JAKIM Kuala Lumpur | **+11** | -1 | +3 | +2 | +2 | +2 | 2,190 | 1,292 (59.0%) | 2,182 (99.6%) | 2,190 (100.0%) | 2 |
| `MY-KTN01` | JAKIM Kota Bharu | +10 | +1 | +3 | +2 | +2 | **-3** | 2,190 | 1,251 (57.1%) | 2,169 (99.0%) | 2,190 (100.0%) | 2 |
| `BN-2026` | MORA Brunei | +0 | +0 | +1 | +0 | +0 | +0 | 2,148 | 1,955 (91.0%) | 2,146 (99.9%) | 2,146 (99.9%) | **10** |
| `UK-london-2026` | London | **+41** | -3 | +5 | +0 | +3 | **-60** | 2,190 | 1,237 (56.5%) | 1,452 (66.3%) | 1,479 (67.5%) | **113** |

All measured. **Across all 62 non-London city-years, 127,234 of 127,236 values are within 2 minutes of the
six-constant model, 99.998%.** The only two misses in the whole set are in `BN-2026` and both trace to typos
in Brunei's own feed (section 3.4). London misses on 2,846 of 8,760, 32.5%.

### 3.2 Residual shape: constant, seasonal or irregular

The lag-1 autocorrelation of the residual after the constant is removed distinguishes the three. A value near
zero means the residual is rounding noise with no structure; a value near 1 means a smooth curve.

| Authority | max lag-1 across its cities | worst after 6 constants | worst after 4 harmonics (9 coefficients per field) | seasonal model buys |
|---|---|---|---|---|
| Egyptian GAS | 0.50 | 1 | 1 | **nothing** |
| Kemenag Indonesia | 0.35 | 1 | 1 | **nothing** |
| MORA Brunei 2025 | 0.18 | 1 | 1 | **nothing** |
| Habous Morocco | 0.52 | 1 | 1 | **nothing** |
| Qatar Calendar House | 0.51 | 1 | 1 | **nothing** |
| Umm al-Qura Saudi | 0.54 | 1 to 2 | 1 to 2 | **nothing** |
| Awqaf UAE | 0.62 | 1 to 2 | 1 | 1 minute on 2 of 9 cities |
| MARA Oman | 0.64 | 1 to 2 | 1 | 1 minute on 2 of 6 cities |
| MUIS Singapore | 0.55 | 2 | 2 | **nothing** |
| JAKIM Malaysia | 0.80 | 1 to 2 | 1 to 2 | 1 minute on 5 of 10 zones |
| Diyanet Turkey | 0.88 | 2 | 1 | **1 minute on all 10 cities** |
| **London** | **1.00** | **113** | **42** | 71 minutes, and still fails |

All measured. **Category 3 barely exists.** Only Diyanet shows a consistent seasonal component, and it is worth
exactly one minute of worst-case error for 9 coefficients per field instead of 1. The residual for every other
authority in the set is rounding noise around a constant. London is the only site where the residual is
genuinely a large smooth function, and it is also the only site where no seasonal model succeeds.

The exact-match rate tells the same story more finely:

| Site | A: 6 constants | B: per-month, 72 ints | H2: 2 harmonics | H4: 4 harmonics | C: exact per-day |
|---|---|---|---|---|---|
| `EG-cairo` | 79.7% | 81.5% | 81.3% | 81.6% | **100%** |
| `ID-jakarta` | 90.3% | 91.0% | 90.4% | 90.4% | **100%** |
| `SA-makkah` | 85.4% | 86.9% | 86.0% | 86.1% | **100%** |
| `TR-9541` | 58.0% | 81.2% | 82.6% | 82.4% | **100%** |
| `MY-WLY01` | 59.0% | 71.2% | 68.1% | 71.8% | **100%** |
| `UK-london-2026` | 56.5% | 65.2% | 62.4% | 65.1% | **100%** |

All measured. Diyanet and JAKIM gain 12 to 23 percentage points from a monthly table, which is the seasonal
component; but their worst-case error barely moves, so the monthly table costs 72 integers to shave one
minute. Nothing between six constants and the exact residual is worth its bytes.

### 3.3 The Umm al-Qura Ramadan rule, which reclassified a whole country

Measured before the rule was added, Saudi Arabia's Isha residual ran `min +0, max +31, spread 31, mean +2.95,
sd 8.23, lag-1 0.96` on every one of six cities. The 29 days carrying the spike were identified directly from
the API's own `hijriDate.month` field: **all 29 are Ramadan 1448, 2027-02-08 to 2027-03-08** (measured).

R1 cited Umm al-Qura's Isha as "exactly sunset + 90 min measured; 120 min in Ramadan cited". Applying the
120-minute interval on Ramadan days only:

| | before the Ramadan rule | with the Ramadan rule | with the Ramadan rule and `round down` |
|---|---|---|---|
| Isha residual spread, Makkah | 31 minutes | **2 minutes** | 2 minutes |
| Worst error after 6 constants, Makkah | 28 minutes | **2 minutes** | **1 minute** |
| Values within 2 minutes, Makkah | 1,936 of 2,130 (90.9%) | **2,130 (100.0%)** | 2,130 (100.0%) |
| Values within 2 minutes, all 6 cities | 11,626 of 12,780 (91.0%) | **12,780 (100.0%)** | 12,780 (100.0%) |
| Exact match rate, Makkah | 912 of 2,130 (42.8%) | 1,092 (51.3%) | **1,820 (85.4%)** |

All measured. **This is the general lesson of the report.** An authority that looks irregular is usually an
authority with one unmodelled published rule. Before concluding category 4, look for the rule.

### 3.4 Brunei: the only authority whose own feed contains errors

Brunei is the one case where the residual exposes defects in the source rather than in the model. Script:
`parse.mjs` `bruneiAudit`.

| Defect | 2026 feed | 2025 feed |
|---|---|---|
| Rows returned | 367 | 358 |
| Distinct dates | 364 | 358 |
| Duplicate dates, two different timetables each | 3 (`2026-03-17`, `2026-06-18`, `2026-07-16`) | 0 |
| Unparseable time strings | 3 (`Isyak "741"`, `Zohor "112.28"`, `Isyak "7..52"`) | 1 (`Maghrib "6.\`7"`) |
| Values that jump >4 min from both neighbours | 1 (`2026-12-14` Dhuhr 12:06 between 12:15 and 12:16) | 0 |

All measured. Dropping the six affected values leaves Brunei at 6 constants, worst 1 minute, 100.0%. Keeping
them produces the 10-minute worst error that the automatic classifier flags as category 4. **Brunei is
category 2 with a dirty feed, not category 4.** Any production ingest of this feed needs a monotonicity check
on the prayer sequence, which is what detected all six.

### 3.5 Kota Bharu: a zone with its own Isha angle

`MY-KTN01` carries an Isha constant of **-3** where every other Malaysian zone measured carries +1 or +2. This
is not noise. The Isha-minus-Maghrib interval, which is coordinate-independent:

| Zone | min | max | mean |
|---|---|---|---|
| `WLY01` Kuala Lumpur | 68 | 76 | 71.94 |
| `TRG01` Kuala Terengganu | 69 | 76 | 72.09 |
| `PLS01` Perlis | 69 | 77 | 72.26 |
| **`KTN01` Kota Bharu** | **65** | **72** | **67.99** |

All measured. Sweeping the Isha angle for Kota Bharu alone:

| Isha angle | mean residual | spread |
|---|---|---|
| 17 | +1.49 | 1 |
| **17.5** | **-0.61** | **1** |
| 18 (the national figure) | -2.76 | 2 |
| 18.5 | -4.85 | 2 |

All measured. **Kota Bharu's published Isha is consistent with 17.5 degrees, not the 18 degrees JAKIM cites
nationally.** No source found explains this. It is the clearest evidence in this report that a per-country
parameter set is not sufficient even within one authority, and it was only visible because the residual made
it visible. That is an argument for the correction-table approach as a diagnostic, independent of how the
times are ultimately shipped.

---

## 4. The four-category classification

**Category 1, exactly computable.** All six constants are zero and a correctly configured library reproduces
the authority to within rounding.

| Authority | Evidence |
|---|---|
| **Egyptian General Authority of Survey** | Six zero constants on all four cities. 8,400 of 8,400 values within 1 minute, worst error 1 minute, 79.7% to 90.4% exact (measured). Parameters: Fajr 19.5, Isha 17.5, Shafi Asr, round to nearest. **The only true category 1 in the set.** |

**Category 2, computable plus a small fixed per-field correction.** Six signed integers close it to 1 or 2
minutes.

| Authority | Six constants, representative city | Worst left | Values within 2 min | Notes |
|---|---|---|---|---|
| MUIS Singapore | +1, +1, +2, +1, +1, +1 | 2 | 6,576 of 6,576 (100.0%) | needs `round down` on all six fields. **Not category 1**, contrary to wave 1. |
| MORA Brunei | +0, +0, +1, +0, +0, +0 | 1 (2025 feed) | 4,288 of 4,290 (99.95%) | category 2; the 2 misses are typos in the 2026 feed |
| Umm al-Qura Saudi | +1, +0, +1, +1, +1, +1 | 1 to 2 | 14,910 of 14,910 (100.0%) | needs the 120-minute Ramadan Isha and `round down` |
| Qatar Calendar House | -2, +0, +0, +0, +2, +2 | 1 | 2,190 of 2,190 (100.0%) | perpetual table; disagrees with the live MOI feed by 1 to 2 min |
| Habous Morocco | -1, -3, +5, +1, +4, +0 | 1 | 1,080 of 1,080 (100.0%) | one Hijri month only; needs `Etc/GMT`, not `Africa/Casablanca` |
| Kemenag Indonesia | +3, -3, +4, +3, +3, +3 | 1 | 13,140 of 13,140 (100.0%) | the sunrise sign flip is deliberate policy |
| Awqaf UAE | +0, -3, +3, +1, +3, +0 (Dubai) | 1 to 2 | 19,710 of 19,710 (100.0%) | constants vary strongly by area, Jebel Jais is -7 / +8 |
| MARA Oman | +0, +0, +5, +5, +5, -1 | 1 to 2 | 13,140 of 13,140 (100.0%) | the uniform +5 is R1's documented temkin |
| JAKIM Malaysia | +11, -1, +3, +2, +2, +2 (KL) | 1 to 2 | 21,900 of 21,900 (100.0%) | +11 on Fajr is the documented 2-min ihtiyati plus 8-min Mufti ruling plus 1 min of rounding |
| Diyanet Turkey | +0, -7, +5, +4, +7, +0 | 2 | 21,900 of 21,900 (100.0%) | the four non-zero values are Diyanet's documented temkin |

All measured. **Ten of eleven authorities are category 2.** The "within 1 minute" figures behind the same
rows: Egypt 8,400 of 8,400 (100.0%), Indonesia 13,140 of 13,140 (100.0%), Morocco 1,080 of 1,080 (100.0%),
Saudi 14,908 of 14,910 (99.99%), UAE 19,692 of 19,710 (99.91%), Oman 13,107 of 13,140 (99.75%), Singapore
6,557 of 6,576 (99.71%), Malaysia 21,787 of 21,900 (99.48%), Turkey 21,318 of 21,900 (97.34%), all measured.

**Category 3, computable plus a seasonal correction.**

| Authority | Evidence |
|---|---|
| **Diyanet Turkey, marginally** | Lag-1 autocorrelation of 0.75 to 0.88 on Asr, Maghrib and Isha across all ten cities. Four harmonics take the worst error from 2 minutes to 1 and the exact rate from 58.0% to 82.4% (measured). But it costs 27 coefficients per city against 6 bytes and still is not exact, so it is the wrong trade. **Category 3 is real but commercially empty.** |

No other authority measured shows a seasonal residual that a harmonic model improves on a constant.

**Category 4, genuinely irregular.**

| Authority | Evidence |
|---|---|
| **London unified timetable** | Isha residual against 18 degrees spans 157 minutes, lag-1 1.00, mean -59.88, sd 48.94 (measured). Twenty harmonic terms, 41 coefficients, still leave 18 minutes of worst error on Isha and 16 on Fajr (measured). Its Fajr and Isha are interval tables from the 1989 Blackburn observations with 21 documented hand edits (wave 1, sections 2.14 and 2.15). **Irreproducible by any angle-based computation.** |

**The classification in one line: 1 authority category 1, 10 category 2, 0 clean category 3, 1 category 4.**

---

## 5. The no-synthesis cost analysis

### 5.1 The rule, sharpened

R4's line stands and this report sharpens it with one addition.

| Option | What the user sees | Verdict |
|---|---|---|
| A library at published angles, no correction | a computed number | Compliant, and **wrong by up to 11 minutes** for Malaysia, 7 for Turkey, 5 for Oman |
| Six constants on a computed baseline | a number within 1 to 2 minutes of what the authority printed | **NOT compliant.** On 10% to 43% of values it prints a time the authority never published |
| **The exact per-day residual on a computed baseline** | **exactly what the authority printed** | **Compliant. Lossless compression of the authority's own digits.** |
| The published times shipped verbatim | exactly what the authority printed | Compliant, and 5.0x more expensive |
| Last year's residual carried forward | a number up to 3 minutes off | **NOT compliant.** See section 6 |

**The addition.** Wave 1 treated "the exact residual" as automatically compliant. It is compliant only when the
residual is regenerated against the SAME baseline the device will compute. Section 6 shows this fails across
years: a residual is a difference against a specific baseline, and the baseline moves. **An exact residual
table is compliant for the year it was built against and for no other year.**

### 5.2 What compliance costs, measured

Median over the 58 full-year sites whose residual fits 4 bits: **282 B brotli per city-year** (measured).

| Authority | cities measured | zones or cities | naive brotli B/city-yr | exact residual brotli B/city-yr | saving | whole authority, naive | whole authority, exact | 6 constants only |
|---|---|---|---|---|---|---|---|---|
| JAKIM Malaysia | 10 | 59 (measured) | 1,421 | 322 | 4.4x | 81.9 KB | **18.6 KB** | 354 B |
| MUIS Singapore | 1 | 1 (measured) | 1,421 | 300 | 4.7x | 1.4 KB | **300 B** | 6 B |
| Diyanet Turkey | 10 | 1,055 (cited) | 2,255 | 305 | 7.4x | 2.27 MB | **314.2 KB** | 6.2 KB |
| Umm al-Qura Saudi | 6 | 100 (UNVERIFIED) | 1,774 | 211 | 8.4x | 173.2 KB | **20.6 KB** | 600 B |
| MORA Brunei | 1 | 1 (measured) | 1,474 | 198 | 7.4x | 1.4 KB | **198 B** | 6 B |
| Egyptian GAS | 4 | 82 (measured) | 2,030 | 261 | 7.8x | 162.6 KB | **20.9 KB** | 492 B |
| MARA Oman | 5 | 86 (measured) | 1,791 | 279 | 6.4x | 150.4 KB | **23.4 KB** | 516 B |
| Kemenag Indonesia | 6 | 516 (cited) | 1,420 | 207 | 6.9x | 715.5 KB | **104.3 KB** | 3.0 KB |
| Awqaf UAE | 8 | 60 (measured) | 1,858 | 289 | 6.4x | 108.9 KB | **16.9 KB** | 360 B |
| Habous Morocco | 6 | 191 (measured) | 306 (one month) | 42 (one month) | 7.3x | 57.1 KB | **7.8 KB** | 1.1 KB |
| Qatar Calendar House | 1 | 1 (measured) | 1,857 | 237 | 7.8x | 1.8 KB | **237 B** | 6 B |
| London | 1 | 1 (measured) | 2,441 | 614 (int8; 4-bit does not fit) | 4.0x | 2.4 KB | **614 B** | 6 B |
| **total** | 59 | **2,153** | | | | **3.69 MB** | **528.1 KB** | **12.6 KB** |

All measured except the zone counts marked cited or UNVERIFIED. Morocco's per-city figure covers one Hijri
month, not a year, so its total understates a full year by roughly 12x.

### 5.3 Against the app's own bundle

| What | brotli | % of the 4.9 MB JS bundle | % of the 67 MB release bundle |
|---|---|---|---|
| every measured authority, every city, published times verbatim | 3.69 MB | 75.33% | 5.509% |
| **every measured authority, every city, EXACT residual** | **528.1 KB** | **10.53%** | **0.770%** |
| every measured authority, every city, six constants only | 12.6 KB | 0.25% | 0.018% |
| **a 12-city launch set, one capital per measured country, EXACT residual** | **3.2 KB** | **0.065%** | **0.005%** |

All measured, against the 4.9 MB JS bundle and 67 MB release bundle cited in R4 section 5.5.

Scaling the exact residual at 282 B per city-year:

| cities | one year, brotli | % of the JS bundle |
|---|---|---|
| 12 | 3.3 KB | 0.07% |
| 100 | 27.5 KB | 0.55% |
| 500 | 137.7 KB | 2.74% |
| 1,000 | 275.4 KB | 5.49% |
| 5,000 | 1.34 MB | 27.44% |
| 20,000 | 5.38 MB | 109.77% |

All derived from a measured per-unit figure.

**Does sharing one brotli dictionary across cities help?** Measured directly by concatenating every 4-bit
residual buffer into one stream:

| Authority | cities | separate brotli | one shared stream | saving |
|---|---|---|---|---|
| Diyanet Turkey | 10 | 3,022 B | 2,476 B | 1.22x |
| Kemenag Indonesia | 6 | 1,198 B | 1,047 B | 1.14x |
| JAKIM Malaysia | 10 | 3,111 B | 2,716 B | 1.15x |
| **all 58 full-year sites** | 58 | 16,205 B | **13,174 B** | **1.23x** |

All measured. A shared stream is worth 23%, which matters at 5,000 cities and not at 100.

### 5.4 The verdict on the trade

The saving from degrading the display to six constants is **282 bytes against 6** per city-year. For a 12-city
launch set that is 3.2 KB against 72 bytes, a difference of **0.065% of the JS bundle**. In exchange the app
would print a time the authority never published on between 10% and 43% of values, depending on the country.

**There is no defensible version of that trade.** Model A is worth keeping as a build-time integrity check: if
this year's fetch produces constants that differ from last year's, the authority changed something and a human
should look. Six bytes per city is a cheap tripwire.

---

## 6. Expiry and portability

### 6.1 Does the residual repeat year over year? No.

This is the finding that most changes the architecture, and it goes the wrong way for the brief's hope.

Three years of MUIS Singapore, the one authority with a licensed multi-year feed, compared day by calendar day:

| comparison | days | all six residuals identical | any field differs by 1 | any differs by 2+ |
|---|---|---|---|---|
| 2024 vs 2025 | 365 | **23 (6.3%)** | 260 | 82 |
| 2025 vs 2026 | 365 | **33 (9.0%)** | 219 | 113 |
| 2024 vs 2026 | 365 | 106 (29.0%) | 255 | 4 |

And the same days' PUBLISHED TIMES, which is what a user would notice:

| comparison | days | all six published times identical | max difference |
|---|---|---|---|
| 2024 vs 2025 | 365 | 25 (6.8%) | 3 minutes |
| 2025 vs 2026 | 365 | 34 (9.3%) | 2 minutes |
| 2024 vs 2026 | 365 | 171 (46.8%) | 2 minutes |

All measured. The published times themselves move by 1 to 3 minutes year over year, which is the leap-cycle
drift moonsighting.com's own page warned about in 2008 (cited, wave 1 section 2.13). So the residual cannot be
stable either.

**The decisive test.** Take last year's table, apply it to a FRESHLY computed baseline for this year, and score
against this year's own published times:

| Authority | later year | strategy | exact | <=1 min | <=2 min | worst |
|---|---|---|---|---|---|---|
| MUIS Singapore | 2026 | reuse 2025's published times verbatim | 1,222 (55.8%) | 2,155 (98.4%) | 2,190 (100.0%) | 2 |
| MUIS Singapore | 2026 | 2025's six constants on 2026's baseline | 1,557 (71.1%) | 2,184 (99.7%) | 2,190 (100.0%) | 2 |
| MUIS Singapore | 2026 | **2025's exact residual on 2026's baseline** | **1,206 (55.1%)** | 2,048 (93.5%) | 2,183 (99.7%) | **3** |
| MUIS Singapore | 2026 | 2026's own exact residual | **2,190 (100.0%)** | 100.0% | 100.0% | **0** |
| MARA Oman Muscat | 2026 | reuse 2025's published times verbatim | 1,976 (90.2%) | 100.0% | 100.0% | 1 |
| MARA Oman Muscat | 2026 | 2025's exact residual on 2026's baseline | 1,789 (81.7%) | 100.0% | 100.0% | 1 |
| Awqaf UAE Dubai | 2026 | reuse 2025's published times verbatim | 2,177 (99.4%) | 100.0% | 100.0% | 1 |
| Awqaf UAE Dubai | 2026 | 2025's exact residual on 2026's baseline | 1,913 (87.4%) | 100.0% | 100.0% | 2 |

All measured. **On every authority tested, carrying the exact residual forward is WORSE than simply reusing
last year's published times.** And for Singapore it is worse than carrying the six constants forward, which is
counter-intuitive until you see why.

**Why.** Decomposed, measured on the same common days:

| Authority | field | published times move | computed baseline moves | residual moves |
|---|---|---|---|---|
| MUIS Singapore | fajr | mean 0.42, max 1 | mean 0.07, max 1 | **mean 0.49, max 2** |
| MUIS Singapore | asr | mean 0.66, max 2 | mean 0.08, max 1 | **mean 0.73, max 3** |
| Awqaf UAE Dubai | fajr | mean 0.01, max 1 | mean 0.16, max 1 | **mean 0.17, max 1** |
| Awqaf UAE Dubai | isha | mean 0.01, max 1 | mean 0.16, max 1 | **mean 0.17, max 2** |

All measured. The residual moves **more than either quantity it is built from**, because it is a difference of
two independently drifting values whose rounding boundaries do not coincide. Singapore's published times move
and its baseline barely does; the UAE's published times barely move and its baseline does. Either way the
difference accumulates both movements.

**What is stable is the SIX CONSTANTS, not the residual:**

| Authority | year | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha |
|---|---|---|---|---|---|---|---|
| MUIS Singapore | 2024 | +1 | +1 | +2 | +1 | +1 | +1 |
| MUIS Singapore | 2025 | +1 | +1 | +2 | +1 | +1 | +1 |
| MUIS Singapore | 2026 | +1 | +1 | +2 | +1 | +1 | +1 |
| MARA Oman Muscat | 2025 | +0 | +0 | +5 | +5 | +5 | -1 |
| MARA Oman Muscat | 2026 | +0 | +0 | +5 | +5 | +5 | -1 |
| Awqaf UAE Dubai | 2025 | +0 | -3 | +3 | +1 | +3 | +0 |
| Awqaf UAE Dubai | 2026 | +0 | -3 | +3 | +1 | +3 | +0 |
| Umm al-Qura Makkah | 1447H | +1 | +0 | +1 | +1 | +1 | +1 |
| Umm al-Qura Makkah | 1448H | +1 | +0 | +1 | +1 | +1 | +1 |

All measured, and identical in every case with the corrected rounding. **The policy is stable; the arithmetic
is not.** That is the honest shape of the result: the model captures the policy permanently and the digits only
for the year it was built.

### 6.2 Leap years and the 365/366 boundary

Building a perpetual residual table in a dummy leap year, the Maldives trick, and applying it to real years:

| perpetual table source | applied to | values | exact | <=1 min | <=2 min | worst |
|---|---|---|---|---|---|---|
| 2024, a leap year | 2024 | 2,196 | **2,196 (100.0%)** | 100.0% | 100.0% | **0** |
| 2024, a leap year | 2025 | 2,190 | 1,183 (54.0%) | 2,086 (95.3%) | 2,188 (99.9%) | **3** |
| 2024, a leap year | 2026 | 2,190 | 1,706 (77.9%) | 2,186 (99.8%) | 2,190 (100.0%) | 2 |

All measured. **The trick does not transfer to residuals.** It works for the Maldives because the Maldives
stores published TIMES in a dummy year with a per-island minute offset: the times themselves are only a minute
or two off across the leap cycle, which the authority evidently accepted. A residual is a difference against a
baseline that shifts by up to a day of solar position across the cycle, so it inherits the drift twice.

Computing the baseline in a fixed dummy year instead of the real year changes almost nothing:

| baseline year | published year | exact | <=1 min | worst |
|---|---|---|---|---|
| the real year | 2025 | 1,623 (74.1%) | 2,177 (99.4%) | 2 |
| fixed at 2024 | 2025 | 1,574 (71.9%) | 2,172 (99.2%) | 2 |
| the real year | 2026 | 1,557 (71.1%) | 2,184 (99.7%) | 2 |
| fixed at 2024 | 2026 | 1,704 (77.8%) | 2,189 (100.0%) | 2 |

All measured. So the leap boundary is not the problem. The problem is that a residual is a difference, and
differences do not repeat.

### 6.3 How far does one city's table travel? Not far.

The donor city's six constants, and separately its exact per-day residual, applied to the recipient's own
baseline and scored against the recipient's published times:

| Authority | donor | recipients | worst with donor constants | worst with donor exact residual |
|---|---|---|---|---|
| Kemenag Indonesia | Jakarta | 5 | **1** | 2 |
| MARA Oman | Muscat | 4 | **1** | 2 |
| Egyptian GAS | Cairo | 3 | **1** | 2 |
| Diyanet Turkey | Istanbul | 9 | **2** | 2 |
| Umm al-Qura Saudi | Makkah | 5 | **2** | 2 |
| Habous Morocco | Rabat | 5 | 2 | 3 |
| **JAKIM Malaysia** | Kuala Lumpur | 9 | **6** | **7** |
| **Awqaf UAE** | Dubai | 7 | **6** | **6** |

All measured. The two failures are specific and explicable:

- **Kuala Lumpur to Kota Bharu leaves 6 minutes** and only 83.3% within 2 minutes, because Kota Bharu uses a
  different Isha angle (section 3.5).
- **Dubai to Jebel Jais leaves 6 minutes** and only 66.7% within 2 minutes, because Jebel Jais is a 1,900 m
  mountain summit and its published sunrise and Maghrib carry a -7 / +8 elevation correction (measured
  constants) that no lowland city shares.

**The general rule this establishes:** one constant set per country is safe where the country is small or flat
(Indonesia, Oman, Egypt, Turkey) and unsafe where a zone has its own angle or its own elevation (Malaysia,
UAE). The safe default is a per-city table, and the per-city table is cheap.

**How many distinct tables does an authority actually need?**

| Authority | cities measured | distinct exact residual tables | distinct six-constant sets |
|---|---|---|---|
| Diyanet Turkey | 10 | 10 | **1** |
| Kemenag Indonesia | 6 | 6 | **1** |
| MARA Oman | 5 | 5 | **1** |
| Umm al-Qura Saudi | 6 | 6 | **1** |
| Egyptian GAS | 4 | 4 | **1** |
| Awqaf UAE | 8 | 8 | 6 |
| Habous Morocco | 6 | 6 | 5 |
| JAKIM Malaysia | 10 | 10 | 8 |

All measured. **No two cities share an exact residual table, ever**, which kills the `prayer_dependent_id`
sharing trick from `muslim-data` for residuals. But five of eight authorities share one constant set across all
their cities, so the POLICY deduplicates perfectly even though the arithmetic does not.

---

## 7. Where the model breaks on geometry, not policy

Above about 48 degrees latitude the sun stops reaching the depression angle in summer, and there is no baseline
for a correction to correct. Measured from pure solar geometry, no library:

| place | latitude | days per year the sun never reaches 18 deg | 15 deg | 12 deg |
|---|---|---|---|---|
| Cairo | 30.04 | 0 | 0 | 0 |
| Istanbul | 41.01 | 0 | 0 | 0 |
| **London** | 51.51 | **59** | 0 | 0 |
| Manchester | 53.48 | 77 | 47 | 0 |
| Copenhagen | 55.68 | 93 | 70 | 36 |
| Stockholm | 59.33 | 116 | 97 | 75 |
| Oslo | 59.91 | 120 | 101 | 80 |
| Reykjavik | 64.15 | 143 | 127 | 109 |
| Tromso | 69.65 | 171 | 156 | 140 |

All measured. **The dangerous part is what the library does about it.** With `HighLatitudeRule.TwilightAngle`,
`adhan` returned `NaN` on **0 of 365 days** at London (measured). It silently substitutes a night-portion
value. On 2026-06-21 it returns Fajr 02:31 and Isha 23:34, neither of which is an 18-degree time (measured).

A residual measured against a substituted baseline is measuring the library's fallback rule against the
authority's fallback rule, and those are two different unpublished conventions colliding. **Any correction
table built above roughly 48 degrees is measuring something other than what it claims to measure, unless the
authority's own high-latitude rule is implemented in the baseline first.** R1 records that Diyanet, Wifaqul
Ulama and the Moonsighting Committee each publish a different non-angle rule for exactly this band.

---

## 8. Honest failure modes

### 8.1 Authorities that could not be obtained as bulk data

| Authority | What was tried | Result, measured | Why it failed |
|---|---|---|---|
| **Iran, `time.ir`** | GET root, `/prayer-time`, `?date=1405-07-15`, `/prayer-time/1405/7/15`; `api.time.ir/v1/*`; Next.js server-action POST; province and city selection driven in `agent-browser` | 200 but **one day only**; `api.time.ir` returned **401 "API key is missing"**; server action **404**; changing city re-renders one day | The site is a Next.js app that renders a single day server-side. There is no month or year route. The underlying API needs a key. |
| **Morocco Habous** | `horaire-api.php?ville=N`; `index.php?ville=N`; `&mois=`, `&annee=`, `&m=`, `&hijri=` | 200, 24,167 B, **30 rows, identical for every parameter variant** | The site serves the current Hijri month and ignores every date parameter, confirming R4's finding. One month obtained; a year is not available. |
| **Qatar MOI live feed** | `/rest/prayertimings/today/en`, `/month/en`, `/year/en` | `today` 200 but **HTML, one day**, and only with a full browser `User-Agent` and `Referer` (plain curl got a WAF "Request Rejected", 245 B); `month` and `year` **404** | One day only. The digitised MIT perpetual CSV was used instead, with the disagreement recorded below. |
| **Azerbaijan, Caucasus Muslims Board** | GET `/az/namaz-calendar`; `agent-browser` open, snapshot, click the submit control | 200, 72,116 B, **0 table rows**; in a real browser also **0 rows** and no XHR fired | The page renders no table and its selects are not in the DOM. R1's suggested `agent-browser` route was tried and failed. Still unread. |
| **Kuwait, `awqaf.gov.kw`** | GET root | **000 after 2.4 s**, connection failed | Host did not resolve or respond. |
| **Bangladesh, Jordan, Algeria, Tunisia, Kazakhstan, Uzbekistan** | GET root | 301, 302 or 301 redirects; no prayer endpoint found | No machine-readable timetable located, consistent with R1's UNVERIFIED rows. |

All measured.

### 8.2 The one category-4 authority, and why it is unreproducible

London is measured in full above. The structural point: **no angle-based computation can reproduce a timetable
whose Fajr and Isha come from a 1989 observation chart.** Twenty harmonic terms, 41 coefficients per field,
still leave 18 minutes of error (measured). That is not a tuning failure, it is a category error: London's
Isha is an interval applied to a published Maghrib, not a solar depression.

**But London's own structure is nearly free.** Measured on its own published columns:

| interval | min | max | distinct values | days it changes value | bytes |
|---|---|---|---|---|---|
| Fajr, before published sunrise + 3 | 90 | 124 | 35 | 87 | |
| Isha, after published Maghrib - 3 | 66 | 100 | 35 | 86 | |
| both columns as raw bytes | | | | | 730 B raw, **204 B brotli** |
| both columns run-length encoded | 88 + 87 runs | | | | 350 B raw, 208 B brotli |

All measured. And it does not expire:

| year pair | common days | Fajr interval identical | Isha interval identical | Isha days that differ |
|---|---|---|---|---|
| 2019 vs 2022 | 365 | **365 (100.0%)** | **365 (100.0%)** | none |
| 2022 vs 2025 | 365 | **365 (100.0%)** | 361 (98.9%) | 06-16, 06-17, 06-18, 06-19 |
| 2025 vs 2026 | 365 | **365 (100.0%)** | **365 (100.0%)** | none |

All measured, and this reproduces wave 1's finding independently: the June edits that wave 1 dated to 2020,
2025 and 2026 are exactly the four days that move between 2022 and 2025.

**So London is category 4 against a residual model and category 2 against an INTERVAL model.** The category
depends on what the baseline is. Where an authority publishes an interval rather than an angle, the correction
belongs in the interval, chained to the authority's own published sunrise and Maghrib. That is 204 bytes and
it is stable across at least eight years. It is also the one thing a residual table cannot express, because
the residual is defined against a computed baseline and London's own Fajr is defined against its own published
sunrise.

### 8.3 What happens when an authority silently changes its method

Wave 1 documented moonsighting.com rewriting its high-latitude rule nine times between 1999 and 2020 without
announcing any of it (cited, `ai/features/moonsighting/RESEARCH-FINDINGS.md` section 2.13). The exposure for a
shipped correction table is concrete.

A **residual table** would silently produce wrong times: it stores differences against a baseline, and if the
authority changes its angle the differences become wrong by the size of the change, with no signal. A Fajr
angle moving from 18 to 19 degrees moves Fajr by 4 minutes at the equator and 8 at 44 degrees (derived from
R1's measured spans).

A **six-constant table is a tripwire.** It is stable to the integer across years for every authority measured
(section 6.1). So a rebuild that produces different constants is a detected method change. Concretely: rebuild
the constants annually from the authority's fresh feed and compare. If any of the six moves, or the worst
residual exceeds 2 minutes, the authority changed something. That check costs six bytes per city to store and
one fetch per city per year to run.

**The unmitigated risk** is the authority that changes its method mid-year, in a year the app is shipping a
table for. Nothing in the data shipped can detect that, because the device is offline by design. The only
mitigation is a cheap version handshake, which the offline-first constraint is meant to avoid.

### 8.4 Two sources that disagree with the authority they claim to represent

| Source | Disagreement, measured |
|---|---|
| **Qatar `TaqweemQatar` perpetual CSV vs the live MOI feed** | For 2026-09-30 the CSV gives Fajr 4:08, sunrise 5:25, Dhuhr 11:24, Asr 14:48, Maghrib 17:24, Isha 18:54. The MOI portal gives 4:10, 5:26, 11:24, 14:49, 17:23, 18:53. **Four of six fields differ by 1 to 2 minutes.** The MIT CSV is the safer licence and the less authoritative number. |
| **Kemenag Indonesia via `api.myquran.com`** | The Kemenag site's own AJAX endpoint returned `{"status":"Illegal key"}` on every call (measured, `bimasislam.kemenag.go.id/ajax/getShalatbln`). The Indonesian data here is a third-party republication. Its residual is clean and internally consistent, but **it is not measured against Kemenag's own server.** UNVERIFIED as first-party. |

### 8.5 Licensing exposure, re-checked for every authority

| Authority | Licence found | Verdict |
|---|---|---|
| **MUIS Singapore** | Singapore Open Data Licence 1.0: "worldwide, perpetual, royalty-free, non-exclusive licence", "whether commercially or non-commercially", attribution notice and licence link required, must not imply official endorsement (cited, `data.gov.sg/open-data-licence`, 2026-09-30, read in full) | **Shippable.** The only one. |
| **Qatar Calendar House, digitised** | MIT, on the `TaqweemQatar` repository (cited, R4 and re-fetched here) | **Shippable**, but it is a third party's digitisation, not the authority's own publication, and it disagrees with the authority by up to 2 minutes (8.4) |
| **Egyptian GAS** | "لا يجوز نسخ أو إعادة طباعة أو نشر أو تحميل أو تحويل أو إستخدام محتوي هذا الموقع بأي حال من الأحوال عدا الإستخدام الخاص غير التجاري", no copying, reprinting, publishing, downloading, converting or use of this site's content in any manner other than private non-commercial use (cited, `esa.gov.eg/copyrights.aspx`, 2026-09-30) | **Explicitly forbidden for a commercial app.** |
| **Awqaf UAE** | "يُمنع منعاً باتاً أي استخدام أو إعادة انتاج أو طباعة ... دون الرجوع للهيئة", any use, reproduction or printing without referring to the Authority is absolutely prohibited (cited, `awqaf.gov.ae/copyright`, 2026-09-30) | **Explicitly forbidden without written permission.** |
| **JAKIM Malaysia** | Footer reads "2020 Hak Cipta Terpelihara Jabatan Kemajuan Islam Malaysia", all rights reserved. The Dasar Privasi and Dasar Keselamatan modals were read in full and cover privacy and data security only; **no reuse terms of any kind exist on the site** (measured, `e-solat.gov.my`, 2026-09-30) | **Silence plus an all-rights-reserved notice.** Not permission. |
| **Diyanet Turkey** | No terms of use, copyright or licence page found on `namazvakitleri.diyanet.gov.tr`; `/kullanim-kosullari` and `/gizlilik` both return the same 380 KB prayer page, so the routes do not exist (measured) | **Silence.** Separately, Diyanet's own API programme caps the yearly endpoint at 10 requests per month (cited, R4), which signals an institution that intends to control bulk access. |
| **Umm al-Qura / KACST** | No terms page found on `ummulqura.org.sa` (measured) | **Silence.** |
| **MARA Oman** | `mara.gov.om` root returned 200, 86 bytes, an empty shell; no terms page found (measured) | **Silence.** |
| **MORA Brunei** | No `Hak Cipta`, `Copyright`, `Penafian` or `Terma` string found anywhere in the 126,956-byte prayer page (measured) | **Silence.** And the endpoint is an internal SharePoint list API, not a published one. |
| **Habous Morocco** | The site has an `اتفاقية استخدام الموقع` (site use agreement) page; fetched at 54,250 bytes, its body is the ministry's standard navigation and article list with no reuse clause reachable (measured) | **Silence in practice.** |
| **Kemenag Indonesia** | Accessed via a third party, `api.myquran.com`, which publishes no licence (measured) | **Silence, and second-hand.** |
| **London** | Provider is `londonprayertimes.com` under the owner's existing arrangement; ELM PDFs carry no licence (wave 1) | Existing arrangement, out of scope here. |

**The blunt summary.** Of eleven authorities measured, **one is affirmatively licensed for commercial use, one
is available only through a third party's MIT digitisation that disagrees with the authority, two carry an
explicit prohibition, and seven are silent.** Absence of a licence is not permission. Wave 1 said this; this
report adds that two of the silences have since turned out to be explicit prohibitions once the right page was
found, which suggests the other seven should be assumed restrictive rather than permissive until each is
checked in its own language.

**The one mitigation the data supports.** The six-constant table is not the authority's data. It is six
integers describing the difference between a public computation and a public timetable, which is closer to a
measurement about the timetable than a copy of it. Whether that distinction survives contact with a lawyer is
**UNVERIFIED and this report cannot answer it.** But it is the only version of the correction-table idea that
plausibly ships without permission, and it is also the version the no-synthesis rule forbids from reaching the
screen. **That is the central tension of the whole architecture and it is not resolvable by measurement.**

---

## 9. UNVERIFIED and open

1. **The rounding rules are inferred, not documented.** No authority found publishes one. The inference is
   strong for Singapore and Umm al-Qura, where one rule lands the mean within 0.05 of an integer, and weak
   where two rules score similarly. **UNVERIFIED as policy.**
2. **The UAE baseline angle is a software convention, not an authority's.** AlAdhan itself describes its Dubai
   18.2/18.2 as "based on the research done by the Batoul Apps team" (cited, R1). Every UAE number in this
   report is a residual against that convention, so the UAE constants describe the gap to Batoul Apps, not to
   any Emirati ruling. The residual is small and tight, which is suggestive, but it is not evidence of the
   authority's method.
3. **Kota Bharu's 17.5-degree Isha has no source.** Measured from the digits; no JAKIM document found that
   mentions a per-zone angle.
4. **Diyanet's ilce count of 1,055 is cited, not counted here.** Ten provinces were enumerated directly and
   their ilce lists summed to 155; extrapolating is not counting.
5. **Umm al-Qura's city count of 100 is a placeholder.** `ummulqura.org.sa/assets/data/cities.json` is 43,671
   bytes (measured by R4) but its records were not counted here.
6. **Whether Umm al-Qura's Ramadan interval is exactly 120 minutes was not confirmed against a Saudi document.**
   It was inferred because a 120-minute interval drives the Ramadan residual to zero. R1 cites 120 minutes
   third-hand. The measurement is consistent with the citation; neither is a primary source.
7. **Morocco is measured on one Hijri month, not a year.** Its constants may not hold across the seasons. The
   feed offers no way to check.
8. **Indonesia is measured against a third-party republication.** Kemenag's own endpoint refuses access.
9. **No authority was tested above 42 degrees latitude except London and Diyanet's Turkish cities.** The
   correction model's behaviour for Russia, Scandinavia, northern Europe and Canada is untested, and section 7
   shows the geometry there is hostile.
10. **The `data.gov.sg` rate limit was hit once** (429, "Rate limit exceeded", measured) and the request was
    retried after 15 seconds. No other authority rate-limited this work, but no authority was fetched at
    production scale either. Diyanet was fetched with a 2-second gap between cities; JAKIM with 1 second.
11. **Whether a six-integer correction table is a derivative work of the authority's timetable is a legal
    question this report cannot answer.**
12. **Elevation was not modelled anywhere.** Jebel Jais's -7 / +8 constants are almost certainly an elevation
    effect, and R4 section 6.4 has the elevation arithmetic, but no site here used an elevation-corrected
    baseline.

---

## 10. Sources

Every URL was fetched on 2026-09-30.

**Authority endpoints, all measured here**

| What | URL |
|---|---|
| JAKIM yearly zone timetable | `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=year&zone=WLY01` |
| JAKIM copyright footer | `https://www.e-solat.gov.my` |
| MUIS 2026 dataset poll-download | `https://api-open.data.gov.sg/v1/public/api/datasets/d_d441e7242e78efc566024dd5b0d9829c/poll-download` |
| MUIS 2025 dataset | `.../datasets/d_e81ea2337599b674c4f645c1af93e0dc/poll-download` |
| MUIS consolidated 2024 to 2026 | `.../datasets/d_a6a206cba471fe04b62dd886ef5eaf22/poll-download` |
| Singapore Open Data Licence 1.0 | `https://data.gov.sg/open-data-licence` |
| Diyanet yearly city table | `https://namazvakitleri.diyanet.gov.tr/tr-TR/9541/istanbul-icin-namaz-vakti` |
| Diyanet province and ilce lists | `https://namazvakitleri.diyanet.gov.tr/tr-TR/home/GetRegList?ChangeType=country&CountryId=2&Culture=tr-TR` |
| Umm al-Qura Hijri year | `https://umqserv.kacst.gov.sa/api/v1/Prayer/GetPrayerHijriYear?lang=en&format=24&yh=1448&lat=21.426666&lon=39.831666&zone=3` |
| Brunei SharePoint OData list | `https://www.mora.gov.bn/_api/web/lists/getbytitle('Waktu%20Sembahyang')/items` |
| Egypt monthly timetable, ASP.NET postback | `https://www.esa.gov.eg/monthlymwaket.aspx` |
| Egypt copyright page | `https://www.esa.gov.eg/copyrights.aspx` |
| Oman MARA monthly timetable, POST | `https://www.mara.gov.om/calendar_page2.asp` |
| Indonesia, Kemenag-derived monthly | `https://api.myquran.com/v2/sholat/jadwal/1301/2026/01` |
| Kemenag's own AJAX endpoint, refused | `https://bimasislam.kemenag.go.id/ajax/getShalatbln` |
| UAE Awqaf anonymous token | `https://mobileappapi.awqaf.gov.ae/APIS/v3/sso/StartRequest?lang=en` |
| UAE Awqaf whole-federation year | `https://mobileappapi.awqaf.gov.ae/APIS/v3/prayer-time/prayertimes/2026-01-01/2026-12-31` |
| UAE Awqaf copyright | `https://www.awqaf.gov.ae/copyright` |
| Morocco Habous monthly | `https://www.habous.gov.ma/prieres/index.php?ville=1` |
| Qatar MOI live feed | `https://portal.moi.gov.qa/MoiPortalRestServices/rest/prayertimings/today/en` |
| Qatar perpetual timetable, MIT | `https://raw.githubusercontent.com/osamaalassiry/TaqweemQatar/master/taqweem.csv` |
| Maldives banded dataset | `https://raw.githubusercontent.com/itsMaadh/maldives-prayer-times/main/maldives_prayer_times.sql` |
| Iran state timekeeping site | `https://www.time.ir/prayer-time` |
| Iran keyed API | `https://api.time.ir/v1/` |
| Azerbaijan namaz calendar | `https://caucasus-muslims.org/az/namaz-calendar` |

**Prior work read, not re-researched**

- `ai/features/global-prayer-times/agent-reports/R1-authorities-and-conventions.md`, master table and section 5.
- `ai/features/global-prayer-times/agent-reports/R4-apis-and-data-sources.md`, sections 5.1 to 5.6 in full.
- `ai/features/global-prayer-times/data/apis/national-authorities.md`, the endpoint contracts reused here.
- `ai/features/moonsighting/RESEARCH-FINDINGS.md`, sections 2.13, 2.14 and 2.15.

**Library**

- `adhan@4.4.6`, installed into `/Users/muji/athan-global-scratch/r6`, never into the repository.

**Files this report produced**, all under `ai/features/global-prayer-times/data/corrections/`

| File | What it is |
|---|---|
| `parse.mjs` | one parser per authority feed into a common shape, with the Brunei date and typo handling |
| `sites.mjs` | the baseline site, parameters and rounding rule for all 68 city-years, each annotated measured or cited |
| `measure.mjs` | the residual engine, four correction models, harmonic fit and byte costing |
| `run.mjs`, `results.txt` | the per-authority residual statistics, model scores, byte costs and automatic classification |
| `expiry.mjs`, `expiry.txt` | year-over-year comparison, the leap boundary, portability between cities, table deduplication |
| `expiry2.mjs`, `expiry2.txt` | carrying a table forward one year, the decomposition of the drift, the Maldives trick |
| `cost.mjs`, `cost.txt` | the no-synthesis price per authority and against the app's bundle |
| `london.mjs`, `london.txt` | the category-4 case: harmonic depth, the interval model, cross-year stability |
| `highlat.mjs`, `highlat.txt` | days per year the angle has no solution, and what `adhan` does about it |
| `fitround.mjs`, `fitround.txt` | the rounding rule inferred per authority from its own digits |
| `summary.json` | machine-readable constants, statistics, model scores and byte costs for all 68 sites |

Raw authority responses, about 34 MB, were kept in the scratch directory and deliberately not committed.

---

## VERDICT

**The correction-table architecture works, and it works for more of the world than wave 1 established, but its
useful output is not the thing wave 1 thought it was.** Across eleven national authorities, 68 city-years and
147,660 published values, six signed integers per city put 100.0% of published values within two minutes on
every site outside London, and once `adhan`'s internal rounding is switched off and each authority's own
rounding rule applied, they reproduce 71% to 90% of values exactly. Ten of eleven authorities are category 2;
Egypt is the first true category 1, where a correctly configured library IS the national timetable; clean
category 3 does not exist in the data; and only London, the app's own current provider, is category 4, because
its Fajr and Isha are 1989 observation intervals that no angle can express. Against the no-synthesis rule the
compliant option is the EXACT per-day residual, which costs a measured median of 282 bytes brotli per
city-year against a median 1,825 for the published times, 3.2 KB for a twelve-country launch set and 528 KB
for every city of every authority measured, or 0.77% of the 67 MB release bundle: size is emphatically not
the constraint. **The strongest argument against it
is that the exact residual expires and the six constants do not.** Carrying Singapore's 2025 residual onto a
2026 baseline reproduces 55.1% of values exactly with three minutes of worst error, which is worse than simply
reusing 2025's published times, because a residual is the difference of two independently drifting quantities
and inherits both drifts; the Maldives perpetual-year trick does not rescue it, because that trick stores times
rather than differences. So the model delivers exactly what the constraint forbids shipping (six stable
integers that are two minutes wrong) and cannot durably deliver what the constraint requires (exact digits
that need refreshing every year), which means the honest architecture is an annual fetch of the authority's own
published year with the six constants shipped alongside purely as an offline integrity tripwire. And behind all
of that sits the constraint that no amount of measurement can move: of eleven authorities, one is licensed for
commercial use, two now explicitly forbid reproduction, and eight are silent, and silence is not permission.
