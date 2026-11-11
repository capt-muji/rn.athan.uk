# O1l-4 China, provincial capitals: the 15/15 grid, verified city by city

Tag: `china-capitals`. Baseline: the China row of `world-table-v2.md` (FALLBACK) and the
O1k-W1 block of `CONSOLIDATION.md` (table negative, method now quotable, 15 deg measured
once at Lanzhou).

**Headline.** The norislam grid's stated 15/15 Hanafi basis is CONFIRMED by measurement at
every one of the 29 provincial capitals, and the 18/17 line the same site's form still
prints is REFUTED at every one of them. The grid is also measurably a **2004 computation**:
the portal's own form note says "依据2004年（366天）赤纬数据计算", and recomputing 2026
drifts fajr +0.34 to +0.82 min against the printed rows while 2004 sits at 0.00. Nothing
Chinese is published by a mosque or an association: the only dated city tables on the open
web are three calculators, and one of them (Guangzhou's Ramadan 1448 sheet) is the first
dated mainland-Chinese city row set this census has ever held from a mainland publisher.

## Surfaces

| Source | URL | Tier | Rows held | Years |
|---|---|---|---|---|
| norislam national grid (伊斯兰之光) | `norislam.com/tool/lb/run.asp`, POST `longt`/`latit` | community, **calculator** | **4,176 printed city-days** (29 capitals x 144 sampled days) | none; engine frozen at 2004 declination |
| norislam query form | `norislam.com/tool/lb/selectin.htm` | community, calculator | states 18/17 **and** 2004 data; its writer `cha.asp` answers HTTP 500 to every field set | n/a |
| islamichina.com city tables | `islamichina.com/<city>-prayer-times/<id>-2026.html` | platform (commercial travel site, calculator widget) | **10,220 dated rows** (28 capitals x 365) | 2026 |
| cheen.cn Guangzhou Ramadan sheet | `cheen.cn/demo/gz/zy/` | community (personal blog) | **30 dated rows** (imsak + iftar) | 1448 / 2026 |
| Nanjing Islamic Association | `njislam.com/zjqzs.asp` | authority publisher | 0 (mosque directory, no timetable) | n/a |
| China Islamic Association | `chinaislam.net.cn` | authority | 0 (unchanged from O1k) | n/a |

The grid takes arbitrary coordinates, so each capital is captured at **the portal's own
gazetteer point** for that city, not at a point of ours (`data/grid-points.json`). The
live grid reproduces the O1k Lanzhou capture **byte for byte**, one day later.

## The fit

Engine adhan 4.4.6, `Rounding.None`, TZ pinned `Asia/Shanghai`, dates built from the printed
strings, no clock read. Columns are compared as printed: 晨礼 fajr, 日出 sunrise, 日中
**solar noon**, 晡礼 asr, 日没 **geometric sunset**, 宵礼 isha. The grid's margins
(dhuhr = noon + 5, maghrib = sunset + 5, imsak = fajr - 10) are prose instructions and are
NOT inside the printed columns, so the fit is against the columns, not against the margins.

**One recipe, 29 cities:** fajr 15.0 deg, isha 15.0 deg, Hanafi asr (2x shadow), disc at
-0.83 deg, nearest-minute rounding. Measured twilight angles (0.1-deg scan, half-sample of
the 2004 rows, MAE minimised): fajr **15.0 at all 29 capitals** (MAE 0.24-0.41 min), isha
**15.0 at 25, 15.1 at four** (Changchun, Harbin, Urumqi, Kunming; MAE 0.34-0.86). The scan
never prefers 18 or 17 anywhere.

| City | Grid point | Days | fajr mean / rms | isha mean / rms | asr mean | 18/17 fajr | 18/17 isha | measured fajr | measured isha |
|---|---|---|---|---|---|---|---|---|---|
| 北京 | 116.46E 39.92N | 144 | -0.01 / 0.33 | +0.09 / 0.71 | +0.05 | +17.9 | -11.8 | 15 | 15 |
| 上海 | 121.48E 31.22N | 144 | +0.09 / 0.34 | +0.06 / 0.54 | +0.06 | +15.4 | -10.1 | 15 | 15 |
| 天津 | 117.2E 39.13N | 144 | +0.07 / 0.34 | +0.13 / 0.74 | +0.08 | +17.7 | -11.6 | 15 | 15 |
| 重庆 | 106.54E 29.59N | 144 | +0.05 / 0.32 | +0.09 / 0.60 | +0.07 | +15.0 | -9.8 | 15 | 15 |
| 广州 | 113.23E 23.16N | 144 | +0.03 / 0.30 | +0.11 / 0.46 | +0.10 | +13.9 | -9.1 | 15 | 15 |
| 昆明 | 102.73E 25.04N | 144 | +0.06 / 0.32 | +0.13 / 0.51 | +0.10 | +14.2 | -9.3 | 15 | 15.1 |
| 乌鲁木齐 | 87.68E 43.77N | 144 | +0.07 / 0.32 | +0.09 / 0.93 | +0.07 | +20.0 | +26.9 * | 15 | 15.1 |
| 银川 | 106.27E 38.47N | 144 | +0.08 / 0.35 | +0.07 / 0.72 | +0.08 | +17.5 | -11.5 | 15 | 15 |
| 兰州 | 103.73E 36.03N | 144 | +0.10 / 0.34 | +0.11 / 0.70 | +0.15 | +16.6 | -10.9 | 15 | 15 |
| 西宁 | 101.74E 36.56N | 144 | +0.05 / 0.34 | +0.07 / 0.68 | +0.09 | +16.8 | -11.0 | 15 | 15 |
| 西安 | 108.95E 34.27N | 144 | +0.04 / 0.33 | +0.10 / 0.58 | +0.09 | +16.1 | -10.6 | 15 | 15 |
| 郑州 | 113.65E 34.76N | 144 | +0.02 / 0.34 | +0.06 / 0.57 | +0.07 | +16.2 | -10.7 | 15 | 15 |
| 济南 | 117E 36.65N | 144 | +0.05 / 0.35 | +0.04 / 0.62 | +0.09 | +16.8 | -11.1 | 15 | 15 |
| 沈阳 | 123.38E 41.8N | 144 | +0.07 / 0.38 | +0.10 / 0.77 | +0.10 | +18.9 | -12.4 | 15 | 15 |
| 长春 | 125.35E 43.88N | 144 | +0.06 / 0.38 | +0.12 / 0.85 | +0.12 | +20.1 | -13.1 | 15 | 15.1 |
| 哈尔滨 | 126.63E 45.75N | 144 | +0.07 / 0.47 | +0.05 / 0.84 | +0.07 | +21.5 | -14.1 | 15 | 15.1 |
| 呼和浩特 | 111.65E 40.82N | 144 | +0.04 / 0.38 | +0.07 / 0.74 | +0.09 | +18.4 | -12.1 | 15 | 15 |
| 成都 | 104.06E 30.67N | 144 | +0.07 / 0.33 | +0.08 / 0.57 | +0.07 | +15.2 | -10.0 | 15 | 15 |
| 武汉 | 114.31E 30.52N | 144 | +0.05 / 0.34 | +0.09 / 0.56 | +0.04 | +15.2 | -10.0 | 15 | 15 |
| 长沙 | 113E 28.21N | 144 | +0.05 / 0.36 | +0.08 / 0.52 | +0.11 | +14.7 | -9.7 | 15 | 15 |
| 南京 | 118.78E 32.04N | 144 | +0.06 / 0.34 | +0.09 / 0.57 | +0.08 | +15.5 | -10.2 | 15 | 15 |
| 杭州 | 120.19E 30.26N | 144 | +0.06 / 0.32 | +0.09 / 0.55 | +0.09 | +15.1 | -9.9 | 15 | 15 |
| 福州 | 119.3E 26.08N | 144 | +0.03 / 0.29 | +0.09 / 0.46 | +0.07 | +14.3 | -9.4 | 15 | 15 |
| 南宁 | 108.33E 22.84N | 144 | +0.00 / 0.31 | +0.09 / 0.47 | +0.09 | +13.8 | -9.1 | 15 | 15 |
| 贵阳 | 106.71E 26.57N | 144 | +0.09 / 0.31 | +0.10 / 0.51 | +0.11 | +14.5 | -9.5 | 15 | 15 |
| 合肥 | 117.27E 31.86N | 144 | +0.08 / 0.34 | +0.08 / 0.56 | +0.09 | +15.5 | -10.2 | 15 | 15 |
| 石家庄 | 114.48E 38.03N | 144 | +0.02 / 0.36 | +0.09 / 0.69 | +0.13 | +17.2 | -11.3 | 15 | 15 |
| 太原 | 112.53E 37.87N | 144 | +0.10 / 0.34 | +0.11 / 0.68 | +0.10 | +17.3 | -11.3 | 15 | 15 |
| 拉萨 | 91.11E 29.97N | 144 | +0.09 / 0.33 | +0.05 / 0.57 | +0.09 | +15.1 | -9.9 | 15 | 15 |

Residuals in minutes (printed minus computed at 15/15 Hanafi, 2004). Every column fits:
sunrise mean +0.01..+0.09, noon +0.01..+0.12, sunset +0.05..+0.13. Worst single row in the
whole corpus is 1.9 min (Urumqi isha), which is a twilight-rate effect, not a parameter.
Nearest-minute rounding is the best classifier on every column (fajr 3,543/4,176, the rest
being sub-minute engine-table differences); ceil 2,364 and floor 1,895 are both worse, so
the grid does not pad.

`* Urumqi's +26.9` on the 18/17 isha line is an adhan artefact, not a releasable finding:
at 17 deg the night-fraction guard binds at 43.8 N in June. At 15 deg nothing binds, which
is why the 15/15 column is clean there. The same guard inflates the 18-deg **fajr** annual
mean at Harbin and Changchun (p95 34.7, max 39.7 at Harbin); in the guard-free November to
February window the separation is still decisive: fajr +17.6 (Harbin), +17.0 (Changchun),
+16.9 (Urumqi), +15.9 (Beijing), isha -11.9 / -11.5 / -11.5 / -10.8.

**Stability and span.** There are no published years to test between, so the between-year
question is replaced by the year-fixity question. Answer: the object is frozen at its stated
2004 table, and it drifts +0.34..+0.82 min (fajr, median +0.49) by 2026, isha +0.01..+0.16.
That is the same class as a frozen generation, and it means the surface cannot accrue years:
grade stays FALLBACK, but the object moves from "a calculator nobody measured" to "a
calculator reproduced to rms <= 0.93 at 29 cities".

**Seasonal amplitude** (fajr span, 1 Jan to 1 Jul, from the captured rows): 91 min at
Guangzhou and Nanning, 100 Kunming, 104 Fuzhou, through 184 Beijing, 198 Shenyang, 216
Urumqi, 218 Changchun, **237 Harbin**. High latitude, wide swing, as the owner's framing
predicts.

**High-latitude substitute (rule 8, sunset+70 / sunrise-70) never fires** at any captured
point: no isha row departs from the 15 deg curve by more than 1.9 min, Harbin in June
included.

## The three calculators disagree, and that is the country's shape

1. **The grid: 15/15 Hanafi**, noon-based dhuhr and sunset-based maghrib, margins in prose.
2. **islamichina.com: 18/17 Shafi.** Measured on three cities at 365 dated rows each:
   fajr 17.8 (Shanghai) / 17.9 (Lanzhou) / 18.0 (Harbin), isha 17.1 / 17.1 / 16.9, **asr
   Shafi** (Hanafi sits 52-56 min later and matches nothing), maghrib = sunset + ~1,
   dhuhr = noon + ~1, sunrise/sunset residuals <= 1.4. That is the Karachi default with no
   Chinese adjustment at all: a platform default wearing a city name.
   **Defect: its "Urumqi" table is computed at 117.5 E** (best-fit longitude, MAE 0.28 min),
   i.e. about 2 hours east of Urumqi, so every Urumqi column is ~119 min early. Not a
   Urumqi table; never harvest it as one.
3. **cheen.cn, Guangzhou, Ramadan 1448:** imsak = fajr at **18.2 deg minus 10** (MAE 1.28
   over 30 days), iftar = **sunset + 4.25** (range 3.4-5.5; the house rounding of sunset+5 on
   its own engine). So the only Chinese-published dated city rows this census holds sit on
   the 18 deg line, not the grid's 15, and no Chinese surface states a method the two of them
   share.

The country therefore holds **three mutually incompatible Chinese recipes on one national
coordinate set**, and none of them is a mosque's or an association's publication.

## Per-city ledger

Every capital: grid captured at the portal's own point (144 sampled days), the islamichina
2026 table held as a platform second surface (365 dated rows, Nanning excepted), and the
mosque/association layer negative. Rows below name only what differs.

- 北京 Beijing: grid confirmed (fajr mean -0.01, angle 15.0); islamichina 2026 365 rows.
  牛街礼拜寺 has no site; all hits are tourism copy (visitbeijing, Wikipedia, Baidu).
- 上海 Shanghai: grid confirmed; islamichina 2026 365 rows (its fajr is 17.8 deg). 小桃园
  清真寺: no site; hits are aladhan/IslamicFinder clones.
- 天津 Tianjin: grid confirmed; 365 rows; 天津清真东寺 only Baidu/Wikipedia.
- 重庆 Chongqing: grid confirmed; 365 rows; 重庆清真寺 only Baidu.
- 广州 Guangzhou: grid confirmed (13.9 min of 18/17 separation — the smallest in the
  country); **NEW: cheen.cn Ramadan 1448, 30 dated rows (imsak/iftar)**; plus its
  today-widget read 2026-11-11 (fajr 5:19-6:37, dhuhr 12:26, asr 16:08, maghrib 17:52,
  isha 19:02) — community, today-class, never dated evidence. 怀圣寺: no timetable.
- 昆明 Kunming: grid confirmed; 365 rows; 顺城清真寺 only Wikipedia/baike/tourism.
- 乌鲁木齐 Urumqi: grid confirmed (isha angle 15.1, rms 0.93, the widest twilight residual in
  the corpus); islamichina 365 rows **defective at 117.5 E**; Uyghur and Chinese searches
  return tourism and news only.
- 银川 Yinchuan: grid confirmed; 365 rows; 南关清真大寺 only tourism/baike.
- 兰州 Lanzhou: grid confirmed (O1k's single-day 15-deg measurement now spans the year);
  365 rows; 西关清真大寺 only tourism.
- 西宁 Xining: grid confirmed; 365 rows; 东关清真大寺 only tourism/baike.
- 西安 Xi'an: grid confirmed; 365 rows; 化觉巷清真大寺 only tourism. **Lead, not data:** a
  stock photo of a 大学习巷大清真寺 wall timetable exists on huitu.com — proof a printed
  wall table exists in the city, unreadable behind a watermarked preview.
- 郑州 Zhengzhou: grid confirmed; 365 rows; 郑州北大清真寺 only baike/museum copy.
- 济南 Jinan: grid confirmed; 365 rows; negative.
- 沈阳 Shenyang: grid confirmed; 365 rows; 沈阳清真寺 only baike; the city's 民委 site has
  no timetable.
- 长春 Changchun: grid confirmed; 365 rows; negative.
- 哈尔滨 Harbin: grid confirmed (the widest 18/17 separation, 21.5 min); 365 rows;
  道外/鞑靼清真寺 only Wikipedia/baike.
- 呼和浩特 Hohhot: grid confirmed; 365 rows; 清真大寺 only Wikipedia/tourism.
- 成都 Chengdu: grid confirmed; 365 rows; 皇城清真寺 only tourism.
- 武汉 Wuhan: grid confirmed; 365 rows; negative (aggregators only).
- 长沙 Changsha: grid confirmed; 365 rows; negative.
- 南京 Nanjing: grid confirmed; 365 rows; **the association exists** (`njislam.com`) and
  lists ten mosques, **and publishes no timetable** — the strongest negative in the set.
- 杭州 Hangzhou: grid confirmed; 365 rows; 杭州清真寺 only wiki/baike.
- 福州 Fuzhou: grid confirmed; 365 rows; 福州清真寺 only baike; the city 民宗局 site has none.
- 南宁 Nanning: grid confirmed; **no islamichina year link** (the only capital without one);
  南宁清真寺 only baike.
- 贵阳 Guiyang: grid confirmed; 365 rows; the provincial 民宗委 site has no timetable.
- 合肥 Hefei: grid confirmed; 365 rows; negative.
- 石家庄 Shijiazhuang: grid confirmed; 365 rows; 清真东寺 only baike.
- 太原 Taiyuan: grid confirmed; 365 rows; 清真古寺 only wiki/baike.
- 拉萨 Lhasa: grid confirmed; 365 rows; 拉萨清真寺 only tripadvisor/tibet.cn copy. Served
  without any block: the country page covers 西藏 and the grid covers the point.

## Honest negatives, with the queries used

Search engine: TinyFish (throttled once, fell back to curl with a browser UA for captures).
Languages: Simplified Chinese, Traditional Chinese, Uyghur, English. No page required a
login, and none was submitted to.

Queries that returned **no mosque or association timetable anywhere**: 兰州 礼拜时间表 2026;
银川 礼拜时间表 2026 清真寺; 乌鲁木齐 礼拜时间表 2026; 北京 牛街礼拜寺 礼拜时间表; 西安
化觉巷清真大寺 礼拜时间; 广州 怀圣寺 礼拜时间表; 昆明 顺城清真寺 礼拜时间表; 上海 小桃园
清真寺 礼拜时间表 2026; 银川 南关清真大寺 礼拜时间表 2026; 兰州 西关清真大寺 礼拜时间表;
西宁 东关清真大寺 礼拜时间表; 郑州 清真寺 礼拜时间表; 天津 清真寺 礼拜时间表 2026; 重庆
清真寺 礼拜时间表 2026; 沈阳 清真寺 礼拜时间表 2026; 哈尔滨 清真寺 礼拜时间表 2026;
呼和浩特 清真寺 礼拜时间表 2026; 成都 清真寺 礼拜时间表 2026; 武汉 清真寺 礼拜时间表 2026;
长沙 清真寺 礼拜时间表 2026; 南京 清真寺 礼拜时间表 2026; 杭州 清真寺 礼拜时间表 2026;
福州 清真寺 礼拜时间表 2026; 南宁 清真寺 礼拜时间表 2026; 贵阳 清真寺 礼拜时间表 2026;
合肥 清真寺 礼拜时间表; 石家庄 清真寺 礼拜时间表; 太原 清真寺 礼拜时间表; 拉萨 清真寺
礼拜时间表; 甘肃省伊斯兰教协会 礼拜时间表; 宁夏伊斯兰教协会 礼拜时间; 青海省伊斯兰教协会
礼拜时间表; 2026 斋月 封斋 开斋 时间表 中国; 中国 清真寺 礼拜时间表 2026 图片;
乌鲁木齐 艾提尕尔 礼拜时间表 2026 张贴; ئۈرۈمچى ناماز ۋاقتى 2026; Muslimwww 礼拜时间表 城市;
"China mosque prayer timetable 2026 city published".

What those searches actually return, per city: tourism copy (Trip.com, Ctrip, Qunar,
visitbeijing), encyclopedia (Baidu Baike, Wikipedia), government news feeds
(民宗局/民委), and five aggregator families (hamariweb, Muslim Pro, IslamicFinder,
prayertimes.date, quranmajeed). Aggregator rows are not harvested: they carry no publisher
and no city-level authority.

Other closures, recorded rather than harvested:

- `njislam.com/zjqzs.asp` (Nanjing association): ten mosques, zero times.
- `cha.asp` (the grid's own form writer): HTTP 500 on every field set; the site's only live
  writer is `run.asp`.
- `time.my-masjid.com/timingscreen/be77d4ed-…`: a Mymasjid display screen surfaced by a
  Gansu query; a JS app with no city named in the page, so it cannot be attributed.
- `huitu.com` stock photo of a Xi'an mosque wall timetable: watermarked preview only.
- `szgmc.gov.ae` (Sharjah) appears in nearly every Chinese query: irrelevant, ignored.

## Files

- `captures/` — 100 files; `CAPTURE-NOTES.md` names each and what it is.
- `data/grid_<city>.json` — the grid's printed rows per capital (12 months, 144 sampled
  days, printed strings verbatim), plus `grid-points.json` and `grid-fetch-log.json`.
- `data/normalized/grid_<city>.json` — the same rows in 24h with the printed column names,
  plus a `derived` block holding the grid's own margins (dhuhr = noon+5, maghrib =
  sunset+5, imsak = fajr-10) so a consumer cannot mistake prose for print.
- `data/islamichina_<city>_2026.json` — 365 dated rows per capital (28).
- `data/guangzhou_cheen-ramadan-1448.json` — 30 dated rows.
- `data/adhan-verification.json` — every residual, per city, per column, per year tested,
  with the rounding classifier and the angle scans.
- `fetch_grid.py`, `fetch_islamichina.py`, `normalize_grid.py`, `verify_adhan.js` — the
  scripts that produced all of the above.
