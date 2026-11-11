# O1l-49 East Asia deep: China cities, Hong Kong, Macau, Taiwan, Mongolia

Tag: `eastasia2`. Baseline: the China row of `world-table-v3.md` (FALLBACK), the O1k-W1 and
O1k-4 blocks of the prior night, and the O1l-4 `china-capitals` block (15/15 Hanafi confirmed at
29 capitals; islamichina.com 28 capitals x 2026 with the Urumqi 117.5E defect).

Everything below is measured against adhan 4.4.6, `Rounding.None`, TZ pinned `Asia/Shanghai`
(China) or the country's own zone, dates built from the printed capture strings, no clock read.

## 1. CHINA — islamichina.com, the full served city list

### 1.1 What the site actually serves

The prior wave took 28 provincial capitals for 2026. The site's own A-Z lists **44 city pages**,
of which **42 serve dated tables** (Nanchang and Nanning have a page and no year article), and
every served city carries more than one year:

| Years served | Cities | Count |
|---|---|---|
| 2025-2029 | Guangzhou, Shanghai | 2 |
| 2026-2029 | Beijing, Hangzhou | 2 |
| 2025, 2026 | the rest | 38 |
| none | Nanchang, Nanning | 2 |

Captured: **94 city-years, 34,314 dated rows** (`captures/islamichina_<city>_<year>.html`,
`data/islamichina_<city>_<year>.json`). 2025 is a **new year** for 40 cities; 2027-2029 are a
**forward harvest** for four.

The 14 cities beyond the 28 capitals the prior wave held: Dalian, Dunhuang, Guilin, Haikou,
Kashgar, Luoyang, Ningbo, Qingdao, Quanzhou, Sanya, Shenzhen, Suzhou, Turpan, Xiamen.

### 1.2 The recipe, at every city

One recipe across all 42 cities and all 94 city-years: **fajr 17.8-18.0 deg, isha 17.0-17.2 deg,
Shafi asr, dhuhr = noon + ~0.7, maghrib = sunset + ~0.7**. The angle spread is the 0.1-deg scan
resolution, not a parameter change: no city prefers 15 or 20.

Fit quality at each city's fitted point: mean absolute error across the six columns **0.52 to
1.00 min**, median 0.70, over 2,190 cells per city-year. That is a Karachi default with no
Chinese adjustment at all, which the prior wave said for three cities and this wave confirms for
42.

### 1.3 The Urumqi-class defect is a clock, and it covers four cities

The prior wave found islamichina's "Urumqi" table computed at 117.5 E. This wave fits every
city's solar columns and finds the defect is **a fixed 120-minute clock offset, not a wrong
gazetteer point**:

| City | Fitted point | dlon | dlat | printed minus computed at the named city | after a -120 min shift |
|---|---|---|---|---|---|
| Ürümqi | 117.56-117.61 E, 43.82 N | **+30.0** | 0.00 | -120.1 / -119.4 (all columns) | MAE 0.46-1.08 |
| Turpan | 119.14 E, 42.95-43.00 N | **+29.95** | 0.00 | -120.0 / -119.4 | MAE 0.40-1.02 |
| Dunhuang | 124.66-124.71 E, 40.19 N | **+30.0** | +0.05 | -120.2 / -119.6 | MAE 0.41-0.96 |
| Lhasa | 121.12 E, 29.70 N | **+30.0** | +0.05 | -119.9 / -119.4 | MAE 0.43-0.61 |

Four cities, two years each, latitude identical to the named city to 0.05 deg, longitude exactly
+30.00 deg, every column 119.4-120.6 min early. A 30.00-degree shift at four different
longitudes is not a shared reference point; it is **two hours of solar time**. The tables for
these four cities are printed on a clock 120 minutes behind Beijing time, i.e. UTC+6, while the
other 38 cities print on UTC+8. A reader on the national clock prays fajr two hours early at
these four cities.

This is NEW for Lhasa, Turpan and Dunhuang. The prior wave flagged Urumqi alone and read it as a
longitude defect; the clock reading explains all four with one cause and reproduces every column
at MAE <= 1.08.

### 1.4 The second defect class: a latitude offset

Two cities are computed about a degree from their own centre:

| City | Named point | Fitted point | dlat | mean MAE at named / at fitted |
|---|---|---|---|---|
| Shijiazhuang | 114.51 E, 38.04 N | 114.91 E, **39.04 N** | +1.00 | 2.24 / 0.79 |
| Sanya | 109.50 E, 18.25 N | 109.75 E, **19.05 N** | +0.80 | 1.26 / 0.71 |

Shijiazhuang's worst single column is fajr: 3.52 min at the named point against 0.35 at the
fitted one. Sanya's worst is fajr at 1.67 against 0.40. Both repeat identically in 2025 and 2026,
so neither is a rounding artefact.

Shijiazhuang's table is computed at 39.04 N, 114.91 E, about 111 km north of the city (the
Laiyuan area of Baoding prefecture). Sanya's sits about 89 km north. Neither is a clock error:
the residual spread at the named point is 1-3.5 min with no constant component.

### 1.5 Between-year stability

2025 against 2026, cell for cell on the same calendar date: **71.6% to 90.0% of the 2,190 cells
are byte-identical**. A frozen reprint would read 100%; these tables are **recomputed each year**
from the same recipe, and the differences are the +/-1 minute of a recomputed solar table. The
same holds forward: 2026 against 2027 reads 53.9-59.4%, 2027 against 2028 49.4-69.4%, 2028
against 2029 75.3-85.4%. Fitted angles per city move only inside 17.8-18.0 and 17.0-17.2 across
every year held, so the parameters are frozen and the numbers are not.

**Forward longevity: proven to 2029** at four cities (Guangzhou and Shanghai 2025-2029, five
years each; Beijing and Hangzhou 2026-2029, four years each), all on the one recipe;
stable-across-2-years at the other 38 cities. The country's data ceiling is therefore **42
cities x 2 years plus 4 cities x 4-5 years, 94 city-years, 34,314 rows**, and its forward
longevity is proven to 2029 at the four largest.

### 1.6 One publisher data gap

The Harbin 2025 table prints **2025-01-11 as 12:00 AM on all six columns**, a null row. It is
the only null in 34,314 rows. Excluded from the fit, not from the record.

## 2. CHINA — the norislam grid at 30 prefecture-level cities

The grid takes arbitrary coordinates through `run.asp`, so each of the 30 cities is captured at
**the portal's own gazetteer point** from its county list (`data/grid-points-pref.json`), exactly
as the 29 capitals were. 30 requests, 4,292 printed city-days (144 sampled days each; Aksu
returned 136 and Yining 124 through parse gaps, recorded not padded).

**The 15/15 Hanafi basis holds at all 30**: fajr mean -0.03 to +0.11 min (rms 0.29-0.46), isha
+0.06 to +0.17 (rms 0.45-1.06), asr +0.03 to +0.20, noon +0.02 to +0.12, sunrise +0.02 to +0.10,
sunset +0.05 to +0.17. The measured fajr angle is **15.0 at every one of the 30**; the measured
isha angle is 15.0 at 23, 15.1 at five (Changji, Korla, Mudanjiang, Qiqihar, Shaoyang) and 14.9
at two (Aksu, Yining), all inside the scan's own resolution. The 18/17 line is refuted
everywhere: fajr **+13.8 (Shenzhen) to +23.2 (Qiqihar)**, isha -9.1 to -15.1.

With the 29 capitals this makes **59 Chinese cities measured on one 15/15 Hanafi recipe**, and
the country's two calculator families are now separated by city count rather than by anecdote.

The grid is the 2004 computation everywhere, so it cannot accrue years: the between-year
question is the year-fixity question the prior wave answered (+0.34 to +0.82 min of fajr drift by
2026), and nothing in the 30 new cities departs from it.

## 3. HONG KONG — the Masjidal feed reaches 2027, and the Trustees' sheet rechecked

### 3.1 The feed, four years on one method

`https://masjidal.com/api/v1/time/range?masjid_id=pVdwkode&masjid_detail=yes&from_date=&to_date=`
is keyless and served **2027 in full** (365 rows, HTTP 200, 132,102 bytes,
`captures/masjidal_kowloon_2027_probe.json`). The record held 2024-2026.

Every year is fitted here on one method so that a between-year change is a measurement rather
than a comparison of two reports. Kowloon point 22.34 N, 114.161 E (the feed carries no
coordinates; the point is solved from its own solar curve, as the record does).

| Year | Rows | fajr angle | isha angle | asr | dhuhr | maghrib |
|---|---|---|---|---|---|---|
| 2024 | 366 | 17.9 (MAE 0.50) | 18.3 (MAE 0.82) | Hanafi +0.90 | noon +4.90 | sunset +3.19 |
| 2025 | 365 | **18.0** (0.25) | **18.4** (0.29) | Hanafi +0.89 | noon +4.91 | sunset +2.88 |
| 2026 | 365 | **18.0** (0.26) | **18.4** (0.29) | Hanafi +0.87 | noon +4.90 | sunset +2.89 |
| 2027 | 365 | **18.0** (0.27) | **18.4** (0.29) | Hanafi +0.89 | noon +4.88 | sunset +2.86 |

One recipe across **1,461 days**: fajr 18.0, isha 18.4, **Hanafi asr +1**, dhuhr = noon + 5,
maghrib = sunset + 3. Parameters frozen, no dated regime change, and the 2027 year is NEW.

Two corrections to the world-table row, both against the feed layer it describes. The row reads
"fajr 18.4 rounds down" and "asr Shafi +1". Measured on 1,461 days:

- The feed's **fajr is 18.0**, not 18.4. At 18.4 the MAE is 1.75 min on every year; at 18.0 it is
  0.25-0.27. The prior wave's own per-year table (17.89 / 18.00 / 18.01) agrees with this and not
  with the world-table line, so the 18.4 in the row appears to be the sheet's **isha** angle.
- The feed's **asr is Hanafi**, not Shafi. Shafi sits 61.3 min off on every day of every year.
  The Shafi asr belongs to the Trustees' page-2 jama'ah sheet, not to the feed.

Between-year relation: 2026 against 2027 is **90.0% of 2,190 cells byte-identical**, the rest
+/-1 min. The feed is recomputed, not reprinted, so the years are a genuine multi-year test.

### 3.2 The Trustees' sheet, rechecked from the live artifact

`https://www.iuhk.org/images/Prayer_Time_Table.pdf` (2,015,297 bytes, 2 pages, no text layer,
no year stamp) is the Trustees' full-year sheet, printed by the Islamic Union of Hong Kong. Both
pages rendered to PNG and transcribed by reading the image; 22 rows of page 1 and the January and
June-July blocks of page 2.

**Page 1** (fitted at 22.34 N, 114.161 E, adhan 4.4.6, `Asia/Hong_Kong`):

| Column | Measured | MAE |
|---|---|---|
| fajr | 18.7 deg (or sunrise - 81.9) | 1.85 |
| isha | **21.2 deg** (or maghrib + 88.1) | 1.26 |
| dhuhr | noon + **15.04** | 15.04 (exact) |
| maghrib | sunset + **6.83** | 6.83 |
| asr Shafee | Shafi + 4.68 | 4.68 |
| asr Hanafee | Hanafi + 1.89 | 1.89 |
| sunrise / sunset / noon | -0.95 / +0.65 / +0.04 | <= 0.95 |

The record's page-1 reading (fajr 18.5, isha 21.3) is CONFIRMED within the 0.2-deg the two
samples can carry; isha 21.2 is exact. NEW: page 1's dhuhr is **noon + 15**, which page 2's own
footnote states in words ("Zuhar Waqt starts 15 minutes after (Zawal) noon time").

**The two pages disagree on every column**, measured on the same calendar days:

| Day | fajr p1 / p2 | zuhr p1 / p2 | asr p1 / p2 | maghrib p1 / p2 | isha p1 / p2 |
|---|---|---|---|---|---|
| Jan 1 | 5:42 / 5:43 | 12:42 / **13:00** | 16:17 (Hanafee) / 16:17 | 17:59 / 17:55 | 19:27 / 19:15 |
| Jul 1 | 4:10 / 4:23 | 12:42 / **13:00** | 17:08 (Hanafee) / 17:08 | 19:17 / 19:16 | 20:53 / 20:36 |

Page 2's zuhr adhan is a **fixed 13:00 clock** in every row of both blocks, while page 1's is
noon + 15, so the dhuhr gap moves with the sun: 18 min on 1 January and 1 July, 21 min on 18 June,
17 min on 6 July, across the days transcribed. Page 2's fajr is 1 min later in winter and **12
min later** in summer; its isha is 12 min earlier in winter and **17 min earlier** in summer.
Page 2's asr adhan is page 1's **Hanafee** column, and its iqamah is a 5-minute grid on top.

So the three constructions the record names are all present in the artifact served today: an
angle layer (page 1), a fixed-clock jama'ah layer (page 2), and the feed's own third set. The
withdrawn grade A stays withdrawn.

## 4. MACAU — first surface, authority tier, 30 dated rows

The record's Macau entry is "NEGATIVE (no site; Facebook login-walled)". It is broken.

`agent-browser` (session `o1l-eastasia2`, no login, no form submitted) read
`facebook.com/mosquemacau/posts/886766200757710/` and the attached image was downloaded
(`captures/macau_ramadan_1447_table.jpg`, 1074x1522, 228,523 bytes). The artifact is the
**Macau Islamic Cultural Exchange Promotion Association's own Ramadan 1447 fasting timetable**,
trilingual Arabic / Chinese / Portuguese, printed by the association, posted 2026-02-01.

**30 dated rows** (2026-02-19 to 2026-03-20), imsak and iftar (`data/macau_1447_ramadan_transcribed.json`).

Fit at 22.1987 N, 113.5439 E, adhan 4.4.6, `Asia/Macau`:

- **iftar = geometric sunset + 5** (mean +4.96, range +3.8 to +6.6, 30/30 rows).
- **imsak = an 20.2-degree dawn line**, equivalently fajr(18.0) - 9.4, MAE 0.89 on the 25 rows
  that behave. The classic "18-deg fajr minus 10" imsak convention, measured.
- **Defect, flagged not corrected:** imsak runs down to 5:04 on 17-18 March and then RISES to
  5:05 on 19-20 March, against a monotone solar curve. Those five rows are the whole residual of
  the raw 30-row fit (MAE 1.57 at 20.0 deg becomes 0.89 at 20.2 deg once they are excluded).

Portuguese and Cantonese phrasings were both searched. The Portuguese search returns only
Portuguese *mainland* bodies and aggregators (duakitapligi, sajda, Sajda's `method=27`); the
Cantonese search returns the mosque's Ramadan *date* announcements relayed by community pages.
No Macau association website exists: the mosque's only publication channel is its Facebook page.

## 5. TAIWAN — the 1447 table rechecked against the mosque's stated method; 1448 not yet published

The association's newest edition is **2026年度齋月時刻表 (Ramadan 1447)**, published 2026-02-08
(`cmainroc.org.tw/hot_530318.html`, image `editor_images/131ee067d9c5cac9571138863ef06fbc.jpg`,
2,480x3,508). The 1448 edition is **not yet published**: the association's announcement index
runs to 2026-03-19 and 1448 Ramadan begins about February 2027. Honest negative, with the date.

Transcribed: 30 rows, `data/taiwan_1447_ramadan_transcribed.json`. Fit at 25.033 N, 121.565 E,
adhan 4.4.6, `Asia/Taipei`:

| Column | Measured | Note |
|---|---|---|
| fajr | sunrise **- 69.97** | exactly -70 on 30/30 rows |
| isha | maghrib **+ 90.00** | exactly +90 on 30/30 rows |
| imsak | fajr - 20.3 | 20-21 min |
| maghrib | sunset + 6.18 | |
| iftar | = printed maghrib | the mosque's 4-min buffer sits inside maghrib |
| dhuhr | noon + 19.76 | |
| asr | fixed clock 16:05-16:07 | Hanafi - 12.0, Shafi + 39.8 |

The record's interval rule is CONFIRMED to the minute.

**Algorithm against timetable, the owner's comparison.** The Taipei Mosque's own page
(`taipeimosque.org.tw/about_ramadan.php`) states the method in words: "伊斯蘭世界聯盟（Muslim
World League）慣用的計算標準［Fajr 18.0 degrees］… 中央氣象局編印之二0二六年天文日 … 開齋時間
… 手動加入四分鐘開齋安全緩衝（Ihtiyat）". Measured against that statement:

- fajr at **18.0 deg** misses the printed column by **+6.06 min mean on 30/30 rows** (printed is
  LATER). The printed column is a **16.7-deg equivalent** (scan MAE 0.78) because it is
  sunrise - 70, not an 18-degree angle.
- The stated 4-minute iftar buffer is consistent with the printed iftar (sunset + 6.18) within
  the 2 min by which the association's own almanac sunset differs from the geometric one.

So the stated method and the printed table **drift by about 6 minutes on fajr, printed later**,
and they agree on iftar. The drift is small because the table only covers February-March, where a
70-minute interval and an 18-degree angle nearly coincide; the same rule extrapolated to December
would separate by far more. Flagged for the owner, not adjudicated.

The 8-city offset table is confirmed and transcribed verbatim (新竹 +2/+2, 台中 +3/+4,
台南 +5/+7, 高雄 +4/+7, 花蓮 -1/+3, 台東 +1/+6, 恆春 +2/+9, 澎湖 +8/+9).

## 6. MONGOLIA — negative under Mongolian terms

Searched in Mongolian: "Улаанбаатар намаз цаг 2026", "Улаанбаатар лалын сүм намаз цагийн
хуваарь 2026", "намаз цагийн хуваарь". Every dated result is an aggregator: namazvakti.com
(cityID 9373), salattimes.net, aladhan.com, sajda.com, azaneum.ru, namaz.today, matwprojectca.
No Mongolian mosque, no Mongolian Muslim body, no Mongolian publisher serves a dated table.
The one Mongolian-language item with substance is a news piece (`ubn.mn`) counting 60+ mosques
and 20+ schools in the country, carrying no times.

The record's "Ulaanbaatar mawaqit capture" is not reproduced by any Mongolian-language query
today, and no mawaqit tenant for Ulaanbaatar surfaced. Negative stands: **not found under these
terms**.

## 7. China honest negatives, with the queries used

Searched in Simplified Chinese, Traditional Chinese, English and Uyghur. No page required a login
and none was submitted to. The city-level mosque layer for the 14 new cities is negative for the
same reason the capitals were: every result is tourism copy, encyclopedia, or an aggregator.

Queries returning no mosque or association timetable: 大连 清真寺 礼拜时间表 2026; 青岛 清真寺
礼拜时间 2026; 宁波 清真寺 礼拜时间表; 厦门 清真寺 礼拜时间表 2026; 深圳 清真寺 礼拜时间表 2026;
洛阳 清真寺 礼拜时间表; 泉州 清真寺 礼拜时间表; 苏州 清真寺 礼拜时间表 2026; 包头 清真寺
礼拜时间表; 大同 清真寺 礼拜时间; 宝鸡 清真寺 礼拜时间表; 吐鲁番 清真寺 礼拜时间表 2026;
伊宁 清真寺 礼拜时间表; 临夏 清真寺 礼拜时间表 2026; 天水 清真寺 礼拜时间表; 固原 清真寺
礼拜时间表; 吴忠 清真寺 礼拜时间表; 昌吉 清真寺 礼拜时间表; 库尔勒 清真寺 礼拜时间表;
阿克苏 清真寺 礼拜时间表; 和田 清真寺 礼拜时间表; 张掖 清真寺 礼拜时间表; 平凉 清真寺
礼拜时间表; 沧州 清真寺 礼拜时间表; 开封 清真寺 礼拜时间表; 南阳 清真寺 礼拜时间表;
邵阳 清真寺 礼拜时间表; 桂林 清真寺 礼拜时间表; 齐齐哈尔 清真寺 礼拜时间表; 牡丹江 清真寺
礼拜时间表; 喀什 清真寺 礼拜时间表 2026.

Closures recorded rather than harvested: islamichina's Nanchang and Nanning city pages exist but
carry **no year article** (Nanning confirmed as the prior wave found it; Nanchang new).

## 8. Files

- `captures/` — 185 files, 120.5 MB. islamichina: 42 city indexes and 94 year pages; norislam:
  the live gazetteer plus 30 grid pages; Masjidal: the 2027 range response; the Trustees' PDF and
  its rendered pages; the Macau timetable image; the Taiwan 1447 table image; the Wikipedia
  coordinate response.
- `data/islamichina_<city>_<year>.json` — 94 files, **34,314 dated rows**.
- `data/islamichina-fit.json` — per city-year: fitted point, angles, asr school, per-column
  residuals at the fitted point and at the named city, null count.
- `data/islamichina-diagnose.json` — the western-clock test, the between-year identity counts,
  the Harbin null row, the Kashgar isha check.
- `data/grid_<city>.json` + `data/grid-points-pref.json` — the 30 prefecture-level captures at the
  portal's own gazetteer points, **4,292 printed city-days**.
- `data/adhan-verification-pref.json` — the 30-city 15/15 verification, both years tested.
- `data/masjidal_kowloon_<year>.json` — 2024-2027, **1,461 days**; `data/hk_kowloon_years_fit.json`
  the four-year recipe; `data/hk_trustees_page1_transcribed.json` and `data/hk_trustees_fit.json`
  the page-1 recheck.
- `data/macau_1447_ramadan_transcribed.json` and `data/macau_1447_fit.json`.
- `data/taiwan_1447_ramadan_transcribed.json` and `data/taiwan_1447_fit.json`.
- Scripts: `enumerate_islamichina.py`, `harvest_islamichina.py`, `fit_islamichina.js`,
  `diagnose_islamichina.js`, `fetch_grid_pref.py`, `verify_grid_pref.js`, `fit_hk_years.js`,
  `fit_hk_trustees.js`, `fit_macau.js`, `refine2.js`, `fit_taiwan.js`.

Every script pins `TZ` and throws if it is not the country's zone, so a wrong clock cannot
silently produce a fit.
