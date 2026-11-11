# O1m-11 East Asia depth: China's prefecture layer, Japan and Korea's cities, the Taiwan/Hong Kong/Macau years

Workspace `$HOME/athan-gitree/census/o1m/o1m-11-eastasia/`. Captures 2026-11-11T10:15Z-13:05Z,
each file written under `captures/`. Every fit runs adhan 4.4.6 at
`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`, `Rounding.None`, the country's IANA zone
pinned, dates built from the printed date strings. No clock is read into data.

Counts below are script-counted from the artefacts named beside them.

---

## 1. The Diyanet tree is the East Asia prefecture layer, and it was already captured

The prior Diyanet wave (o1m-r7) crawled 489 East Asian city pages and never parsed them. They are
here: 489 pages, sha1-verified against that wave's manifest, copied to `captures/diyanet/`
(191 MB), parsed to `data/diyanet_*_2026.json`.

| Country entry | Cities | Dated rows (2026) |
|---|---|---|
| CIN (China) | 222 | 81,030 |
| JAPONYA (Japan) | 143 | 52,195 |
| MOGOLISTAN (Mongolia) | 67 | 24,455 |
| GUNEY KORE (South Korea) | 40 | 14,600 |
| TAYVAN (Taiwan) | 10 | 3,650 |
| HONG KONG | 5 | 1,825 |
| MAKAO (Macau) | 1 | 365 |
| KUZEY KORE (North Korea) | 1 | 365 |
| **Total** | **489** | **178,485** |

Each page carries the annual table (365 dated rows, six columns) beside the weekly and monthly
tables; the parse takes the annual block and drops the duplicates the monthly block repeats
(`scripts/parse_diyanet.py`).

### 1.1 The point of each city is solved from its own year

The pages publish no coordinates and no zone. Latitude is solved from the printed day-length curve
(the latitude whose day lengths, once one constant horizon offset is removed, are flattest across
the year). Longitude is solved from the printed solar noon against the country's standard offset.
`scripts/fit_diyanet.mjs`. The solved points land where the cities are: Hong Kong 22.27/114.00,
Taipei 24.97/121.38, Ulaanbaatar 48.94/105.88, Harbin 45.8.

### 1.2 One recipe per country family

Scored over the full year at the solved point, with the canonical Diyanet temkin
(sunrise −7, dhuhr +5, asr +4, maghrib +7, fajr and isha 0) — `scripts/verify_diyanet.mjs`,
`data/verify_*.json`:

| Country | fajr | isha | asr | cities at 100 pc all-six | median all-six | worst city |
|---|---|---|---|---|---|---|
| China | 18 | **16** | Shafi | 121 / 222 | 100.0 | 47.1 (Altay 47.8N) |
| Japan | 18 | 17 | Shafi | 93 / 143 | 100.0 | 84.7 (Aizuwakamatsu) |
| South Korea | 18 | 17 | Shafi | 23 / 40 | 100.0 | 87.7 (Cheongju) |
| Taiwan | 18 | 17 | Shafi | 9 / 10 | 100.0 | 99.7 |
| Hong Kong | 18 | 17 | Shafi | 5 / 5 | 100.0 | 100 |
| Macau | 18 | 17 | Shafi | 1 / 1 | 100.0 | 100 |
| North Korea | 18 | 17 | Shafi | 0 / 1 | 98.6 | 98.6 |
| Mongolia | 18 | **16** | Shafi | 0 / 67 | 58.1 | 37.8 |

Per-column within-1 at the median city is 100 pc on every column in every country. Exact rates run
45-90 pc, which is what six independently rounded columns allow.

**China and Mongolia are an 18/16 family, not 18/17.** The 17-degree isha misses every Chinese city
by 4.5 min mean at zero margin (Guangzhou 4.54, 365/365 days out); 16.0 deg scores 0.25 with zero
days out. The same holds at Erdenet and every Mongolian city in the non-summer months. This is a
publisher parameter, measured, not a rounding artefact.

### 1.3 China's failures are two different things, and only one is a block

47 of 222 Chinese cities fall under 95 pc all-six. They are not one class:

- **The far north is a summer substitution.** Above 45N the 18-degree fajr and 16-degree isha do not
  exist in June. Hailar 49.16N prints 55.1 pc, Altay 47.8N 47.1, Bugt 48.7N 47.9, Aihui 50.2N 57.8;
  the failing columns are fajr (worst 163 min) and isha (114). The printed pair moves to a smooth
  night portion (section 1.4).
- **The middle latitudes are sub-minute model difference, not defect.** Beijing (39.8N) scores 80.8
  pc all-six on a residual that never leaves −1.4..+0.7 min and swings smoothly by season on asr,
  maghrib and isha; every column is within 1 on most days. Six columns at half a minute of model
  difference each is what an 80 pc joint rate looks like.
- **A second 1-minute temkin variant** carries 43 cities: sunrise −8, dhuhr +4, asr +3, maghrib +6
  against the majority's −7/+5/+4/+7. Scoring those on their own variant lifts the median from 97.5
  to 99.5 pc (Quzhou Hebei 79.2 to 100, Lianyungang 93.2 to 100); a residue (Hotan, Kotan, Hami,
  Korla, Golmud, Xining) stays between 77 and 95 and is **flagged open**.

### 1.4 The northern block: measured, not modelled

Mongolia is the same class on every city. Measured at Bayangol (48.94N): the solar columns stay
within 1 min all year; fajr is at 18.05 deg outside the block and the depression at the printed fajr
runs −18.2 deg on 20 April, −11.2 deg at the solstice, back to −16.9 deg on 13 August. adhan's three
night-portion rules do not reproduce it (seventh MAE fajr 15.2, middle 22.6, twilight 12.1), so the
substitution is recorded and **flagged, not modelled** (`scripts/highlat_test.mjs`,
`scripts/angle_months.mjs`). Mongolia's data ceiling is the solar columns plus 8 months of fajr/isha.

### 1.5 Grade

**Provisional, platform tier, one published cycle (2026).** The 2025 or 2027 page is refused: the
current host canonicalises to the civil year (the r7 wave proved it on four parameter forms). No
country in this tree can reach A on one cycle.

---

## 2. China: islamichina is exhausted, norislam's prefecture gazetteer is banked

### 2.1 islamichina.com — the served list is 42 tables, all held

The site's own `prayer-times.html` index lists **42 distinct city tables** (the A-Z list re-linked
twice per city). That is exactly the 42 the prior wave banked, plus the two page-only cities
(Nanchang, Nanning) that carry no year article. Recount today: 42 slugs on the index, 42 with
tables in `eastasia2/data/`. **No city remains to add at this publisher.**

### 2.2 The four clock defects verified from the tables themselves

Re-measured on the held 2026 rows, adhan 4.4.6, `Asia/Shanghai`, Shafi 18/17, at each city's named
point and at the same point shifted +30 deg of longitude (which is −120 min of clock):

| City | mean error at the named point (six columns) | after the −120 min reading |
|---|---|---|
| Urumqi | 118.8-119.9 | 0.18-1.41 |
| Turpan | 118.9-119.9 | 0.19-1.41 |
| Dunhuang | 119.0-120.1 | 0.15-1.21 |
| Lhasa | 118.8-119.8 | 0.19-1.19 |

The defect is a **two-hour clock, not a gazetteer error**, and it covers the four cities. Shijiazhuang
(2.7 at fajr/isha at the named point) and Sanya (1.7) stay latitude-offset cases: neither responds to
the clock shift (both go to ~120 min when shifted). Never bake the defect: the four tables are UTC+6
prints.

### 2.3 norislam: the full prefecture gazetteer, and the county layer confirmed

The portal's own county list (`selectin.htm`, GB2312, captured byte-for-byte) carries **32 province
blocks and 2,265 named points with coordinates**. Extracted to `data/norislam_points.json` — the
enumeration the brief asked for, and a coordinate layer for the ledger. The brief's 2,460 estimate
was high by 195.

Its `run.asp` computes at any of those points and prints **no year**. Ten county points banked
(24.9N Quanzhou to 53.5N Mohe, 1,424 printed days, `data/norislam_county_rows.json`), and the
statement on the page is confirmed by measurement: **15/15 Hanafi, margins 0-1 min on all six
columns, MAE 0.25-1.09 min** (`data/norislam_county_fit.json`). The page's own footnote names the
rule in words: 15 deg both twilights, dhuhr noon +5, asr shadow 2, sunrise/sunset at 0.83 deg,
imsak fajr −10, 2 min per 100 li of longitude.

The remaining 2,255 points are **not banked, by reason**: the grid is one frozen 2004 computation
with no date on it, and 59 cities plus these 10 counties already measure it. Banking 2,255 identical
pages would add rows, not data.

### 2.4 cheen.cn

The Guangzhou Ramadan 1448 sheet (30 rows, held) is the site's only timetable. The front page today
is a personal blog index; no `/demo/` city set is linked. No further city.

---

## 3. Japan: Nagoya's own full-year table, and the rest of the city layer

### 3.1 Nagoya — NEW authority surface, 365 dated rows

`nagoyamosque.com/about/prayertime` links the mosque's own full-year table,
`wp-content/uploads/Daily-Prayer-Time-Table.pdf` (12 pages, 122,834 bytes,
`captures/nagoya_daily_prayer_table.pdf`). Transcribed: **365 rows**, February 29 present, no year
stamp (`scripts/parse_nagoya.py`, `data/nagoya_mosque_year_table.json`).

Fit at the solved point 35.18N/136.75E (the mosque's address is 35.17/136.87), `Asia/Tokyo`:

| Column | within 1 | exact | MAE | worst |
|---|---|---|---|---|
| fajr | 361/365 | 248 | 0.33 | 2 |
| sunrise | 355/365 | 225 | 0.42 | 3 |
| dhuhr | 365/365 | 240 | 0.34 | 1 |
| asr (Shafi) | 362/365 | 202 | 0.45 | 2 |
| maghrib | 344/365 | 175 | 0.58 | 2 |
| isha | 360/365 | 188 | 0.50 | 3 |

**18/17 Shafi with sunrise −1 and maghrib +1**, all-six 91.5 pc. Hanafi asr excludes itself
(54.7 mean). The year is **undated and undecidable**: the table is leap-shaped, and 2024 and 2028
reproduce alike (91.5 and 91.2 pc all-six), so this is one computed generation stamped on the site,
never a second year. Provisional.

### 3.2 Osaka — negative reconfirmed, and now with the mechanism

`osakamasjid.org/prayer-times` is live and publishes **congregation times only**; the waqt columns
are computed in the browser from an aladhan-shaped payload with a Shafi/Hanafi toggle, and the site
prints no date. `/prayer-times.md` carries services, no times. `osakamosque.org` (Ibaraki) still
serves a construction announcement. No dated table exists at either body under these terms.

### 3.3 The rest of the named cities, re-probed today

- **Fukuoka** — `fukuokamasjid.org` still reads "website temporarily offline while it is being
  rebuilt"; the one block is a prayer-times widget, no table.
- **Sapporo** — `sapporomasjid.or.jp` is a WordPress site with an iqamah widget frozen on "Saturday,
  November 07" and a `ramadan-calendar-2026` page; no year-round table (the prior reading stands).
- **Sendai** — `iccsendai.org` (Google Sites) carries two Ramadan timetables (2021, 2022) and a
  third-party iframe; no year-round table.
- **Hiroshima** — `hiroshimamosque.com` does not resolve (curl 000). No domain.

### 3.4 The national calculator surfaces, labelled community

`islam.ne.jp/salattime` and `dokidoki.ne.jp/home2/islam/salat/salatschedule.htm` are a 22-city
national list (Sapporo to Naha) with a JavaScript widget and **no dates**; `assalaamfoundation.jp`
(Tokyo) serves a PrayTimes.js widget with iqamah only and names the engine. `masjidbox`'s Otsuka
Tenant (Tokyo) serves a one-day window in embedded JSON. None is a dated year table.

---

## 4. Korea

The KMF list (`koreaislam.org/예배시간표/`, captured today) still ends at **2026년 2월-2027년 1월**;
no 2027-28 edition and no January 2027 monthly post exists. Its one table is labelled
세계무슬림연맹 (MWL) at **37.6N/127E — Seoul only**, so the national body publishes no city layer.

City searches in Korean (부산/인천/대전/광주 성원 예배시간표) return tourism pages, news and
encyclopedia entries; Busan's page carries the Jumu'ah time only. **Busan, Incheon, Gwangju and
Daejeon stay negative for their own tables.** What changes is that each now has a dated 2026 table
through the Diyanet tree (40 Korean cities, section 1), so the country's city layer is no longer
Seoul-only.

---

## 5. Taiwan: the 1448 edition is still not published

The association's announcement index (`cmainroc.org.tw/hot.html`, captured today) runs newest-first
from **2026-07-24**; the newest Ramadan item is **2026-02-08, "2026年度齋月時刻表" (1447)**. Payload
date check passed: the index itself carries no 2027-dated item at all, so the absence is the
publisher's, not a cache.

`taipeimosque.org.tw/about_ramadan.php` serves a **today-only widget** (Fajr 04:50, Dhuhr 12:05,
Asr 15:40, Maghrib 17:26, Isha 18:55 on the capture date) with the method in words: MWL 18.0 deg,
the Central Weather Bureau's 2026 almanac, and a manual 4-minute iftar buffer approved by the imam.
It is the mosque's own daily surface, not a dated table; nothing to fit. The 1447 rule and the
8-city offset table stand as held.

**What Taiwan gains this round is a dated year, from a different publisher:** the Diyanet tree
carries ten Taiwanese cities (Taipei, Kaohsiung, Tainan, Taichung, Hsin-chu, Chiayi, Hualien,
Pingtung, Panchiao, Chu-nan) with a full 2026 table each, 3,650 rows, reproduced at 100 pc all-six
on 18/17 with the standard temkin (`data/verify_tayvan.json`). The CMA's Ramadan-only cycles are no
longer the country's only dated rows.

---

## 6. Hong Kong: 2028 served, five years on one recipe

`masjidal.com/api/v1/time/range?masjid_id=pVdwkode` serves **2028 in full**: 366 rows, HTTP 200,
132,463 bytes (`captures/hk_masjidal_2028_probe.json`, rows `data/hk_masjidal_2028.json`). The feed
names itself TADREES-UL-QURAN, 208 Kowloon City Rd, `Asia/Hong_Kong`.

Five years on one harness (`scripts/fit_hk5.mjs`, `fit/hk_5year_fit.json`), joint optimum
**fajr 17.9, isha 18.5, Hanafi asr +1, dhuhr noon +5, maghrib sunset +3**:

| Year | rows | all-six within 1 |
|---|---|---|
| 2024 | 366 | 69.1 pc |
| 2025 | 365 | **100** |
| 2026 | 365 | **100** |
| 2027 | 365 | **100** |
| 2028 | 366 | **100** |

1,827 days. 2024 is the separate generation the record already names (maghrib 320/366, isha 255/366
on the 2025-28 recipe); 2025 through 2028 carry the same recipe to the minute on every column. The
record's "fajr 18.0 / isha 18.4" is confirmed within the 0.05-deg scan resolution (joint optimum
17.9/18.5, per-year 18.0/18.4). Forward longevity: **proven to 2028**.

The Trustees' sheet (`iuhk.org/images/Prayer_Time_Table.pdf`, 2,015,297 bytes) is byte-identical in
size to the held copy and still carries the two constructions that disagree on every column; no new
reading is claimed here.

---

## 7. Macau: the page is reachable, the 1448 table is not there

`facebook.com/mosquemacau/` read through a real session (session `o1m-11`, no login, no form): the
page is public, 355 followers, the newest visible post dated **5 November 2026**, and the timeline
carries no timetable image. The Ramadan-1447 table (30 dated rows) remains the only table this body
publishes, and no 1448 edition and no full year exists under these terms
(`captures/macau_fb_page_read.txt`). Portuguese and Cantonese terms were searched in the prior wave
and returned only aggregators.

**The full year exists at a platform, not at the body:** the Diyanet tree carries Macau as one city
with 365 dated rows for 2026, reproduced at **100 pc all-six on 18/17** with the standard temkin
(`data/verify_makao.json`). It is a computed table, not the association's, and it is the territory's
first full-year surface.

---

## 8. Mongolia: the tree answers it, the summer rule stays open

The Diyanet tree carries **67 Mongolian cities** with a full 2026 table each (24,455 rows) — the
country's first dated city layer. The capital appears as `ULAN BATOR` with eight sub-entries beside
it (`BAYANGOL(Ulan Batur)`, `JARGALANT(Ulan Batur)`, `BULAG(Ulan Batur)`, five more) — a name search
for the Mongolian spelling returns none of them.

Recipe 18/16 Shafi, solar columns exact all year, and the summer block flagged (section 1.4). tawkit
(`tawkit.net`) is an app shell with language pages and no dated table service; Diyanet is the
surface. Mongolian-language searches for a mosque table returned nothing in the prior wave and the
search API returned empty today, recorded as a tool limitation rather than a negative.

---

## 9. Honest negatives, with the languages searched

- **China, mosque layer:** 31 prefecture cities were searched in Simplified Chinese in the prior
  wave; today's Chinese queries (斋月时刻表 per city) returned no result set through the search API,
  which returned empty for every query this session. islamichina has no 43rd city; cheen.cn has no
  second city.
- **Japan:** Osaka (client-side), Fukuoka (construction), Sapporo (widget), Sendai (2022 PDFs),
  Hiroshima (no domain) — Japanese, today.
- **Korea:** Busan, Incheon, Gwangju, Daejeon — Korean, today.
- **Taiwan:** 1448 edition absent at the publisher, index dated 2026-07-24.
- **Macau:** no 1448, no full year, page read today.
- **Mongolia:** no Mongolian-language dated table; Diyanet is the surface.

---

## 10. Files

- `captures/` — 522 files, 205 MB. `captures/diyanet/` (489 sha1-verified pages),
  `captures/norislam/` (10 county pages), the Nagoya PDF, the Trustees' sheet, the HK 2028 response,
  the Japan/Korea/Taiwan/Macau probes.
- `data/diyanet_<country>_2026.json` — 8 country files, **178,485 dated rows**.
- `data/diyanet_manifest.json` — id, city, country, sha1, capture UTC, copy check (489/489 ok).
- `data/fit_diyanet_<country>.json` — per city: solved point, measured angles, school, margins.
- `data/verify_<country>.json` — per city: the fixed recipe's per-column scores.
- `data/norislam_points.json` — 2,265 gazetteer points; `data/norislam_county_rows.json`,
  `data/norislam_county_fit.json` — the 10-point county confirmation.
- `data/nagoya_mosque_year_table.json`, `fit/fit_nagoya_2024.json`, `fit/fit_nagoya_2028.json`.
- `data/hk_masjidal_2028.json`, `fit/hk_5year_fit.json`.
- Scripts: `parse_diyanet.py`, `fit_diyanet.mjs`, `verify_diyanet.mjs`, `fit_table.mjs`,
  `diag_months.mjs`, `angle_months.mjs`, `highlat_test.mjs`, `parse_nagoya.py`, `fit_hk5.mjs`.

## 11. NEXT

1. **Mongolia's summer rule**: identify the publisher's substitution from a second Arctic-latitude
   Diyanet country (Iceland, Norway) where the same block appears, and name the formula.
2. **The northern block**: the same exercise on Hailar/Altay/Mohe; if the rule is a fixed night
   portion, one formula closes the far-north Chinese cities and all 67 Mongolian ones.
3. **KMF 2027-28**: re-probe in December; the edition has posted in January in both prior years.
4. **Taiwan 1448**: re-probe after 2027-01; the 1447 edition posted 2026-02-08.
5. **Japan**: the 143 Diyanet cities plus Nagoya give a two-family map; the next buy is a second
   authority mosque table (Kobe is one generation, Nagoya one, Kyoto Ramadan-only).
6. **Diyanet tree re-crawl**: the r7 crawl banked 8,959 of 18,582 cities; East Asia is complete, the
   rest of Asia is not.
