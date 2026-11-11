# O1k wide research: China, Taiwan, Hong Kong, Macau

Tag: `china`. Census baseline read from `world-table-v2.md`: China is FALLBACK (the norislam portal's yearless 2,460-county computed grid; the association publishes nothing), Taiwan is FALLBACK with "no stable rule", Hong Kong is grade A on the Kowloon Masjidal feed, Macau is absent.

**Headline.** China stays a fallback, but its method statement is now quotable end to end and three pages of the same portal contradict each other, which is the finding. Hong Kong gains a second and third publisher, including the Trustees' own printed full-year sheet and their 2026 fasting table. Taiwan gains three years of the association's dated tables and, for the first time, an exact arithmetic rule, which turns "no stable rule" into "fixed offsets, stable".

## Surface table

| Source | URL | Tier | Dated data held | Years |
|---|---|---|---|---|
| China Islamic Association (中国伊斯兰教协会) | chinaislam.net.cn | authority | **no prayer times anywhere on the site.** Its only dated 2026 artefact is a wall-calendar image of Gregorian/lunar/Hijri dates plus festival days | 2026 (calendar only) |
| norislam portal, national grid (伊斯兰之光) | norislam.com/tool/lb/lbskbsy.htm → run.asp | community, calculator | computed 2-page year grid for 2,460 counties, 3-day sampling, yearless, qibla azimuth per point | none (edition-stamped 2005 / 2010) |
| norislam portal, query form | norislam.com/tool/lb/selectin.htm | community, calculator | same engine, different stated parameters | none |
| norislam portal, three method essays | norislam.com/tool/lb/skbzl/*.doc | community, stated method | prose only | article 2002, revised 2004/2006 |
| Incorporated Trustees of the Islamic Community Fund of HK | iuhk.org/images/Prayer_Time_Table.pdf | **authority** | **full year, 60 sampled days, two tables in one printing:** astronomical (9 columns, Asar Shafee *and* Hanafee) and masjid jama'ah (13 columns incl. iqamah) | the scan carries no year; both reprints label it 2000 |
| Incorporated Trustees, 2026 fasting table | iuhk.org/images/2026/poster/02_feb/timetable2026.pdf | **authority** | **30 dated rows, Ramadan 1447** (suhoor + iftar) | 2026 |
| Islamic Union of Hong Kong live module | iuhk.org home | authority | today's row + Khutbah 13:15, stated "University of Islamic Sciences, Karachi" / "Asr Hanafi" | live |
| 中華回教博愛社 / 伊斯蘭之光 HK | islam.org.hk/current event/HKmasjid_prayer_time.asp | community, second publisher | the same 2000 masjid table, Big5, all 60 rows | 2000 |
| 中國回教協會 (Chinese Muslim Association, ROC) | cmainroc.org.tw hot_530318 / hot_511195 / hot_486022 | **authority** (states imams'-council review) | **Ramadan tables, 3 editions**, 6 columns + suhoor, plus an 8-city offset table that changes every year | 1445/1446/1447 (2024-2026) |
| Taipei Grand Mosque (台北清真寺) | taipeimosque.org.tw news_detail.php?id=64 and about_ramadan.php | **authority** (mosque) | Ramadan poster, 3 columns, **plus a stated method** (MWL Fajr 18.0, CWB 2026 almanac, +4 min ihtiyat) | 1447 (2026) |
| Taipei Grand Mosque, Jumu'ah | news_detail.php?id=74 | authority | one rule: Jumu'ah fixed 12:15 all year | 2026 |
| Islamic Association of Macau | facebook.com/iam1923, facebook.com/mosquemacau | authority by publisher | nothing machine-readable; no site | n/a |

## What CONFIRMS the census

- **Hong Kong's fitted fajr angle is confirmed on an independent surface 26 years earlier.** Page 1 of the Trustees' sheet, the astronomical one, computes fajr at **−18.1° to −19.0°** on the five 2000 dates measured (1 Jan, 1 Feb, 1 Mar, 1 Apr, 1 May), against the census's fitted 18.4° from the Masjidal feed. Two publishers, two eras, one number, and this time it is stated by computation rather than fitted.
- **The fixed isha interval is confirmed too.** Page 2, the masjid sheet, prints isha minus maghrib at exactly **80 minutes on 59 of the 60 sampled days** (the exception is 2000-09-01 at 90). The census measured 80 exactly on all 365 days of 2025. The 2026 Ramadan sheet keeps the same shape.
- **The two pages of one printing disagree, and the feed follows each page separately.** Page 1 computes isha at −20.9° to −21.8° and fajr at −18.5°; page 2 uses fixed minutes (sunrise − 80, sunset + 4/+5, maghrib + 80). The Kowloon feed's fajr matches page 1's angle and its isha matches page 2's interval. That is not a contradiction in the feed: it is a hybrid, and any fit should be told which page each column comes from.
- **Hong Kong's dhuhr is a jama'ah convention, not a solar time.** The masjid sheet prints dhuhr 13:00 with iqamah 13:15 on all 60 sampled days while its own noon column moves 12:07-12:38. This is why the Masjidal dhuhr margin looked like a small constant.
- **Taiwan's "two timetables in one city" stands, now quantified.** On 2026-02-18 the Grand Mosque prints fajr 05:10 and maghrib 17:54; the association prints fajr 05:16 and maghrib 17:56. The mosque is at MWL 18.0° (sunrise minus 76 min); the association is at sunrise minus 70.
- **China remains a calculator.** The portal's grid is computed, not published: 2,460 county points, 3-day sampling, two printed pages, no year.

## What is NEW

**1. Hong Kong: the Trustees' own full-year printed sheet, 60 sampled days, two conventions.** `data/hongkong_iuhk-masjid-full-year.json`
Two pages in one 2015 scan (PDF created 2015-05-10), hosted on the Islamic Union's site since at least September 2016. The scan itself carries no year; the year 2000 comes from the two reprints, one of which was posted four days before the scan was made, so it is a copy of an earlier printing of the same sheet. Page 1 is astronomical and prints **both** asr schools; page 2 is the masjid jama'ah sheet with adhan and iqamah pairs. The norislam reprint was checked against the scan and matches page 2 on all 13 columns for 2000-01-01, so the machine-readable copy is faithful. This is the first time the census's HK row has a printed second witness with iqamah.

**2. Hong Kong: the Trustees' 2026 Ramadan table, 30 dated rows.** `data/hongkong_trustees-ramadan-1447.json`
Suhoor and iftar only, with two printed rules worth carrying: day 1 is conditional on sighting (printed as 19 February, with 18 February if the moon is seen on the 17th), and "call Azan for Fajr prayer 5 minutes after the time of Suhoor".

**3. Hong Kong: a stated live method.** The Islamic Union's home page module prints "Method of Calculation: University of Islamic Sciences, Karachi" and "Asr Juristic Method: Hanafi" under today's row. That is a named recipe from an authority-tier publisher, and it does not match the fitted Masjidal recipe, which is what a mosque-vs-feed divergence looks like.

**4. Taiwan: three years of the association's dated tables and an exact rule.** `data/taiwan-taipei_cma-ramadan-1447.json` (full 2026), `data/taiwan-taipei_cma-ramadan-1445_sample.json`, `-1446_sample.json` and `data/taiwan-taipei_tgm-ramadan-1447_sample.json` (sampled 2024, 2025 and the mosque's poster)
Measured against solar noon at 25.033 N, 121.565 E:

- fajr = sunrise − 70 min, in all three editions (69-70 min in 2026, rounding).
- isha = maghrib + 90 min, **exactly, on every row of all three editions**.
- maghrib = geometric sunset + 6 or 7 min.
- dhuhr = solar noon + 18 to 20 min.
- asr is effectively a fixed clock time, 16:05-16:07 across the whole month, which is 39-43 min after the Shafi asr and 6-16 min before the Hanafi one. It is a jama'ah time, not a shadow ratio.
- The 8-city offset table is reissued with different numbers each year: Taichung +3/+4, +3/+3, +3/+4; Kaohsiung +3/+7, +4/+4, +4/+7; Hualien −1/+1, 0/−1, −1/+1; Hengchun +3/+6, +4/+3, +2/+6; Penghu +7/+9, +8/+8, +8/+9 (suhoor/iftar minutes).

So the drift the census saw is in the **per-city offset table and the iftar buffer**, not in the base columns. The base columns are the most stable thing in the territory.

**5. Hong Kong: the second publisher for the same table.** islam.org.hk (中華回教博愛社) serves the identical 2000 masjid table in Big5. Two HK bodies, one table: useful for deciding whether the 2000 sheet is the Trustees' own work or a shared convention.

**6. China: the portal contradicts itself three ways, and the grid is now measured.** The query form still states Fajr 18° / Isha 17° with a ±5-minute rule. The grid's own output footnote states **15° / 15°**, dhuhr = noon + 5, maghrib and iftar = sunset + 5, imsak = fajr − 10, Hanafi asr with a stated Shafi conversion (summer −70, winter −30, spring/autumn −50 min), terrain ±3-7 min for 300-1,000 m, high-latitude substitute sunrise −70 / sunset +70, and longitude ±2 min per 100 li. The essay carries the same 15° with its justification, and states it was published in 《中国穆斯林》 2002 no. 6, the China Islamic Association's own journal.

The grid was then measured rather than read: Lanzhou (103.80 E, 36.06 N), 1 January, prints fajr 07:00 and sunrise 08:16. At 15° the computed fajr is 06:59; at 18° it would be 06:44. **The live grid emits 15°.** The 18/17 line on the form page is stale text on a page the engine no longer follows.

## What deserves a fit

- **Hong Kong.** The 2000 sheet gives an out-of-sample test 26 years wide: fit on the 2024-2026 feed, predict 2000 page 1. Expect maghrib to miss by 5-8 minutes, because page 1's maghrib sits 5-8 minutes above its own sunset column. Fajr and isha should land inside a degree. Use page 2, not page 1, to test the iqamah offsets.
- **Taiwan.** Do not fit an angle. The territory is now a **fixed-offset** family: sunrise − 70, sunset + 6.7, maghrib + 90, noon + 19. A one-parameter fit will beat any angle model, and the residuals will expose the published defects rather than the astronomy. Treat the per-city offset table as a yearly-edition artifact.
- **China.** Nothing to fit; there are no publisher rows. The grid's own output is the only Chinese row set and it is a calculator's, which the census already says. If the census ever needs a Chinese row set, the portal's 15°/15° + Hanafi + fixed-margin construction is reproducible from the essay, but its output must be labelled a calculation, never a publication.

## Honest negatives

**China.** Searched Mandarin, Uyghur and English: 礼拜时间表 2026, 礼拜时间查询, 清真寺 礼拜时间, 五时拜时间表, 拜时表, 礼拜时刻表 每月, 入时 出时, 中国伊斯兰教协会 礼拜时间, 甘肃省／青海省／宁夏／上海市 伊斯兰教协会, 兰州市伊斯兰教协会, plus mosque names (牛街礼拜寺, 小桃园清真寺, 西关清真大寺, 南关清真大寺, 东关清真大寺, 汗腾格里, 艾提尕尔, 化觉巷), and Uyghur "ناماز ۋاقتى" / "ئۈرۈمچى ناماز ۋاقتى". Results:

- **No mosque or association in mainland China publishes a dated table on the open web.** Every hit is tourism copy, encyclopedia, or an aggregator. Uyghur-language searches surface only news and the Turkish-hosted tawkit calculators.
- **The China Islamic Association publishes a calendar, not times.** Its site has no prayer-time section in any menu; its 2026 artefact is a poster calendar with festival dates (入斋月 2/19, 开斋节 3/21, 古尔邦节 5/27). Captured.
- **Provincial associations have no timetable web surface.** Gansu, Qinghai, Ningxia and Shanghai appear only through government news feeds and the national association's news stream.
- The norislam essays are `.doc` files served from a directory with raw Chinese filenames; both were retrieved and converted. Nothing else in that directory was indexed.

**Taiwan.** Searched Traditional Chinese and English: 台北清真寺 禮拜時間表 2026, 禮拜時間及封開齋時間, 齋月時刻表, 中國回教協會, Taiwan mosque prayer timetable. Results:

- **No year-round dated table exists.** All three association editions are Ramadan-only. The mosque's own poster is Ramadan-only too. Outside Ramadan the only surfaces are the mosque's live "today" block and third-party calculators.
- `thpc.taiwantrade.com/Taiwan_mosque` returns 403 to a browser user agent; it is a mosque directory page, not a table, and was not pursued further.
- islamtaiwan.com publishes a monthly Taipei table, but it is an aggregator page with no publisher identity behind the numbers, so it was captured and not used as a witness.

**Hong Kong.** The URL printed on the Trustees' own sheet, `www.islamictrusthk.org`, now serves a parked page carrying another party's template. The domain no longer resolves to the Trustees. Recorded, not used.
The Islamic Union's 2022 `Jummah_timetable.jpg` is an imam roster, not a timetable; captured and discarded.

**Macau.** Searched Traditional Chinese, English and Portuguese: 澳門 伊斯蘭 祈禱時間, 澳門伊斯蘭會, 禮拜時間表, Macau mosque prayer time table 2026, horário de oração mesquita Macau, iam.org.mo. Results: **no dated table of any kind, and no association website.** The mosque and the association exist only as Facebook pages (`mosquemacau`, `iam1923`), which return HTTP 400 to a browser user agent and cannot be read without login. The territory's prayer times on the open web are all aggregator output (IslamicFinder, Muslim Pro, prayertimes.date, al-habib) and were not harvested. Macau remains silent in the record.

## Files

- `captures/` — every raw page, PDF and JPEG named for its source, with `CAPTURE-NOTES.md` saying what each one is and which crops the transcriptions were read from.
- `data/` — six JSON files: HK masjid full-year (60 sampled days), HK Trustees Ramadan 1447 (30 rows), Taiwan CMA 1447 (32 dated rows), and three sampled files (CMA 1445, CMA 1446, Taipei Grand Mosque 1447).
