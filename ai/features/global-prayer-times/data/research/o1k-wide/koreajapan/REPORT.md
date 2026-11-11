# O1k-wide — Japan, South Korea, Mongolia

Research date: 2026-11-10. Tag: `koreajapan`. Every file named below sits under `captures/` or `data/`.

Method note: all times are reproduced as the publisher prints them. Astronomy checks use a NOAA solar
implementation at each city's published coordinates; "printed − computed" is quoted in whole minutes.

---

## Japan

### Surfaces

| Source | URL | Tier | Dated data | Years |
| --- | --- | --- | --- | --- |
| Nagoya Mosque ( religious corporation Nagoya Islamic Center ) | `nagoyamosque.com/about/prayertime` → `en.nagoyamosque.com/wp-content/uploads/Daily-Prayer-Time-Table.pdf` | official | 365 daily rows, 6 columns + a 10-day-block jamā'ah schedule | yearless (created 2019-01-07, page updated 2024-11-24) |
| Tokyo Camii | `tokyocamii.org/ja/reyhaijikan/` → monthly PDFs/PNGs under `/wp-content/uploads/` | official | monthly tables, 6 columns; method notes in EN/TR/JA | 2026-05 … 2026-11, plus 2025-09 |
| Sapporo Masjid | `sapporomasjid.or.jp/ramadan-calendar-2026/`, `…/ramadan-calendar-2025/` | official | Ramadan calendars, 29 and 30 rows | 1446/2025, 1447/2026 |
| Osaka Masjid | `osakamasjid.org/prayer-times` | official | jamā'ah schedule only; daily times calculated client-side | current |
| Japan Islamic Trust | `islam.or.jp` | official body, third-party data | none — a `timesprayer.com` iframe | — |
| Islam.ne.jp | `islam.ne.jp/salattime` | community aggregator | 22 Japanese cities via `islamicfinder.org` iframes | — |

### Nagoya: the full-year PDF

`captures/nagoya-daily-prayer-time-table.pdf` (122,834 bytes, 12 pages, Producer "Microsoft: Print To PDF",
Title "Prayer Time Table-1.xlsx"). The same bytes are served from `nagoyamosque.com/ja/wp-content/uploads/…`
and from the English host, so one file covers both language pages. Extracted text:
`captures/nagoya-pdf-text.txt`, 365 rows, February has 28 days, no leap day.

The document carries **no year**. It is a repeating annual table, not a year-stamped one, and 31 December
(5:30 / 7:00 / 11:56 / 2:32 / 4:50 / 6:16) closes back onto 1 January (5:31 / 7:00 / 11:56 / 2:33 / 4:51 / 6:17).

Recipe fitted over all 365 rows (Nagoya 35.1706 N, 136.8715 E, JST):

| Column | Fit | Mean error | Range |
| --- | --- | --- | --- |
| fajr | 18° | +0.36 min | −1.05 … +2.31 |
| sunrise | standard 0.833° | −0.68 | −2.46 … +2.07 |
| dhuhr | solar noon | +0.30 | −0.57 … +1.05 |
| asr | Shafi (shadow 1) | +0.31 | −0.91 … +1.74 |
| maghrib | standard sunset | +0.35 | −1.15 … +2.21 |
| isha | 17° | +0.33 | −1.02 … +2.31 |

So Nagoya is the **18/17 (Turkish) pair, Shafi, plain solar noon**, rounded to the nearest minute, with no
safety margin printed inside any column. This is the opposite of Tokyo Camii on the same country.

The PDF also prints a jamā'ah block per month, keyed to 10-day ranges, e.g. April 1–10: Fajr 4:40,
Maghrib 6:30, Isha 8:00; Dhuhr 12:30 and Asr 4:00 sit in a separate fixed box on each page.

Data: `data/nagoya-mosque-yearless-mmdd.json` (keys `MM-DD`, the honest shape) and
`data/nagoya-mosque-2026.json` (the same rows stamped 2026, a projection and labelled as one).

### Tokyo Camii: method statement and measured margins

`captures/tokyocamii-reihaijikan.html` lists the monthly files. Two are true PDFs and were captured:
`camii-2026-10.pdf` (205,435 bytes, text layer readable) and `camii-2026-11.pdf` (497,963 bytes, subset
CID fonts, read from the rendered page). May–September 2026 and September 2025 are served only as
`.webp` images.

The published statement, printed identically in English, Turkish and Japanese on every monthly sheet:

1. The mosque opens 1 hour before sunrise for the Fajr prayer.
2. Fajr prayer: 45 minutes before sunrise.
3. Zuhr prayer starts at 12:00.
4. Friday prayer starts at 12:30.
5. Asr prayer of weekends and public holidays starts at 15:00.
6. Adhan of Asr, Maghrib and Isha: recite at the time of worship and then prayer starts.

Items 1–5 are congregation times, not the table's columns: on 1 November the Fajr column reads 04:37
while sunrise is 05:56, so 05:11 is the 45-minute congregation, inside the 04:37 window. The Dhuhr column
prints 11:30 on weekdays and **12:30 on Fridays**, which is the Jumu'ah time written into the Dhuhr cell.

Measured against 18°/17° at 35.6667 N, 139.6867 E over the 61 captured days:

| Column | Printed − computed | Reading |
| --- | --- | --- |
| fajr | −0.2 (−1 … 0) | plain 18° |
| sunrise | −7.1 (−8 … −7) | sunrise **pulled 7 minutes early** |
| dhuhr | +5.2 (+4 … +5), Fridays excluded | +5 minute safety |
| asr | +4.6 (+4 … +5) | +5 minute safety |
| maghrib | +7.8 (+7 … +8) | sunset **pushed 8 minutes late** |
| isha | +0.6 (0 … +1) | plain 17° |

This confirms the census note (6–7 minutes of safety inside sunrise/sunset) and extends it: the margin is
7 minutes on sunrise, 8 on maghrib, and a separate +5 on dhuhr and asr. Fajr and Isha carry none. A feeder
must therefore carry a per-column offset, never one shared shift.

Data: `data/tokyo-camii-2026-10.json` (31 rows), `data/tokyo-camii-2026-11.json` (30 rows).

### Sapporo Masjid: two Ramadan years

`captures/sapporo-ramadan-2026-en.pdf` (7.09 MB) and `captures/sapporo-ramadan-2025-en.pdf` (517 KB).
Neither is a full-year table; both are Ramadan calendars with five columns (no sunrise).

| Year | Days | Fajr printed − 18° | Maghrib printed − sunset | Fixed columns |
| --- | --- | --- | --- | --- |
| 1446 / 2025 (Mar 2 – Mar 30) | 29 | +1 (ceil) | +1 (ceil) | Dhuhr 12:15, Asr 03:15 → 03:30 from Mar 26, Isha 07:30 → 08:00 from Mar 20 |
| 1447 / 2026 (Feb 19 – Mar 20) | 30 | +1 (ceil) | +1 (ceil) | Dhuhr 12:15, Asr 03:15, Isha 08:15 |

Fajr and Maghrib are computed and rounded up; Dhuhr, Asr and Isha are fixed jamā'ah values held constant
for weeks at a time (Asr moves once in 2025). The 2025 sheet also carries a one-day exception: the 15 March
Isha cell is printed **03:00** on a blue highlight, while the sheet's own footnote says "On March 15th,
there will be a Ramadan Party event, so the Isha prayer will be delayed to 8 PM". The data file keeps the
printed 03:00 and the footnote stands as the publisher's stated intent; neither is a value a feeder can use.

Data: `data/sapporo-masjid-ramadan-2025.json` (29 rows), `data/sapporo-masjid-ramadan-2026.json` (30 rows).

### Osaka: no table, a jamā'ah schedule

`captures/osaka-masjid-prayer-times.html`. The site states plainly that "calculated prayer times … require
JavaScript" and renders them client-side from `admin.osakamasjid.org`; nothing dated is published. What is
published is the congregation schedule: Fajr 05:55, Dhuhr 13:00, Asr 15:45, **Maghrib = sunset + 10 min**,
Isha 19:30, Jummah 13:30. Useful as a jamā'ah rule, not as an adhan table.

### Japan negatives

- Fukuoka Masjid: no domain exists (`fukuokamasjid.or.jp`, `fukuokamasjid.com` both NXDOMAIN); the mosque
  publishes on Facebook only. No own table.
- Kobe Muslim Mosque: no official site (confirmed again; `kobemosque.or.jp` NXDOMAIN). `kobemosque.info`
  resolves and was not touched, as instructed.
- Japan Islamic Trust (`islam.or.jp`): its "お祈りの時間表" block is an `<iframe>` to `timesprayer.com`.
  A third-party calculator on a council page, not a council table.
- Islam.ne.jp's national "全国礼拝時刻表" (22 cities) is 22 `islamicfinder.org` iframes. Community tier.
- Searches run in Japanese: 名古屋モスク 礼拝時間, 礼拝時間 2026 モスク 日本, 大阪モスク 礼拝時間,
  福岡マスジド 礼拝時刻表, 札幌モスク/サッポロマスジド 礼拝時刻, 神戸モスク 礼拝時間表, 岐阜モスク 礼拝時刻表,
  東京ジャーミイ 礼拝時間.

---

## South Korea

### Surface

| Source | URL | Tier | Dated data | Years |
| --- | --- | --- | --- | --- |
| Korea Muslim Federation (한국이슬람교중앙회) | `koreaislam.org/예배시간표/` → `/kislam_home/wp-content/uploads/2026/01/…-Prayer-Times-for-2026-February-2027-January.pdf` | national council | **365 daily rows**, 6 columns, one PDF | 2026-02 … 2027-01 |
| same, per-month posts | `koreaislam.org/예배시간표/?uid=…` | national council | one post per month, Feb 2026 … Jan 2027 | 2026–2027 |
| Islam in Korea (islaminkorea.net) | `/ko/예배소`, `/ko/서울중앙성원-1` | community portal | mosque directory, no times | — |
| Visit Seoul (city tourism) | `korean.visitseoul.net/…/KOP004863` | official tourism | explicitly points readers to the KMF monthly table | — |

### The KMF full-year PDF

`captures/kmf-prayer-times-2026-02-to-2027-01.pdf`, 2,493,275 bytes, 12 monthly pages plus a cover, a
24-masjid directory ("전국이슬람 성원 연락처") and school advertising. Text layer: `captures/kmf-text.txt`.

The method is stated twice, on the page and inside the PDF: **"예배시간표(세계무슬림연맹/위도37.6/경도127/
예배방향 서북서285.8도)"** and "This prayer timetable is based on the method of the Muslim World League
(MWL)". So: MWL 18/17, latitude 37.6, longitude 127.0, qibla 285.8°.

All 365 rows parsed. Fitting each column against 18°/17° at 37.6 N / 127.0 E:

| Column | Printed − computed | Printed − ceil(computed) |
| --- | --- | --- |
| fajr | +0.58 (max +9.8) | +0.07 |
| sunrise | −0.45 | −0.98 |
| dhuhr | +0.54 | +0.02 |
| asr | +0.55 | +0.03 |
| maghrib | +0.55 | +0.04 |
| isha | +0.55 | +0.07 |

The near-zero mean against the ceiling is the signature: **every prayer column is the computed MWL time
rounded up to the next whole minute**. Sunrise runs about one minute earlier than a 0.833° computation,
which is a refraction constant difference, not a shift.

One cell disagrees with the rest of the year: **2027-01-27 fajr prints 6:19 where the sequence and the
astronomy give 6:09** (a typesetting slip in the source; 6:19 is what the publisher printed). Recorded as
printed in `data/kmf-seoul-2026-2027.json`, flagged here.

Data: `data/kmf-seoul-2026-2027.json`, 365 rows keyed `YYYY-MM-DD`.

### Korea negatives

- The KMF directory page inside the PDF names 24 masjids (Seoul Central, Busan, Gyeonggi Gwangju, Jeonju,
  Incheon Bupyeong, Paju, Pocheon, Jeolla Gwangju, Daegu ×2, Incheon, Daejeon, Yeoncheon, Incheon Gajwa,
  Gumi, Hwaseong, Changwon, Gimhae, Ansan, Gimpo, Yangju, Gwangju Hanam, Gimpo Yangchon, Jeju) with
  addresses and phone numbers only. Busan, Incheon and Gwangju therefore have **no own timetable**.
- `islaminkorea.net` prayer-place pages expose Friday-prayer and sheikh fields, no times.
- `koreaislam.org` refuses plain HTTPS clients from this network (curl returns 000 on TLS, 503 on port 80).
  The capture was taken through a browser session; the reader should expect the same block.
- Searches run in Korean: 서울중앙성원 예배시간, 이슬람 기도시간 2026 모스크, 한국이슬람교중앙회 기도시간표,
  성원 예배 시간표 부산 인천 광주, koreaislam.org 예배시간.

---

## Mongolia

No own table found. The census lead stays a mawaqit capture.

| Source | URL | Tier | Dated data |
| --- | --- | --- | --- |
| Mawaqit (Ulaanbaatar mosque) | platform tenant | community | the existing census capture |
| aladhan / islamicfinder / muslimpro / namaz.today / time-namaz / 1namaz / sajda | various | calculators | computed, not published by a mosque |

- The Mongolian Islamic Association has no reachable site: `islam.mn` resolves to 202.131.4.35 but SERVFAILs
  on lookup, and no association domain surfaced in Mongolian or Russian searches.
- Bayan-Ölgii (Ölgii, Abu-Bakr Siddiq Central Mosque) publishes photographs and news, no times.
- Searches run in Mongolian (Улаанбаатар лалын шашин залбирал цаг, Монголын лалын шашны холбоо), Russian
  (мечеть Улан-Батор время намаза, Бayan-Ölgii мечеть), and English.

---

## What deserves a fit

1. **Nagoya, 18/17 Shafi, no margins** — 365 rows and a clean ±2.5 min fit. The strongest Japanese candidate
   for a machine recipe, though the table is yearless.
2. **Tokyo Camii is not fittable as one rule** — it needs fajr 18°, isha 17°, sunrise −7, maghrib +8,
   dhuhr +5, asr +5, and a Friday override in the dhuhr column. Anyone fitting Japan from Tokyo Camii alone
   will import an 8-minute maghrib error.
3. **KMF Seoul, MWL ceil** — 365 rows, method stated by the publisher, and a rounding rule verified to
   ±1 minute on 2,190 values. This is the Korean surface to lift.
4. **Sapporo** is Ramadan-only and half its columns are fixed jamā'ah values; use it as evidence of the
   Japanese fixed-jamā'ah pattern, not as a daily feed.

## Access notes

- `koreaislam.org` blocks curl from this network (TLS stall, HTTP 503); the PDF was pulled through a named
  browser session and saved byte-for-byte (2,493,275 bytes matches the server's `content-length`).
- `nagoyamosque.com`, `tokyocamii.org`, `sapporomasjid.or.jp`, `osakamasjid.org`, `islam.or.jp` and
  `islam.ne.jp` all answered plain curl normally.
- No page required a login, a form or a challenge.
