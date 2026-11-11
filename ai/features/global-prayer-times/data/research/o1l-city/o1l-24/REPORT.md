# O1l-24 — Japan, South Korea, Philippines city layer (round two)

Probed 2026-11-11, 04:36Z–05:5xZ. Every capture under `captures/`, normalized rows under `data/`,
fit script `scripts/fit_mq.mjs` (adhan 4.4.6, `Rounding.None`, TZ pinned per country, no clock read),
mawaqit parser `scripts/mawaqit_parse.py`.

Engine note: the platform fits below reproduce on adhan 4.4.6 at **zero margins on all six columns**,
which is the signature the brief asks us to record. `mawaqit` serves a 12-month grid of **366 rows**
with a phantom **29 February** present in 2026 (not a leap year); every fit drops it and says so.

---

## JAPAN

### Osaka — rechecked, no dated table (confirmed negative, new site)

`osakamasjid.org/prayer-times` is a rebuilt Next.js site (uploads dated 2025-11 onward). It publishes
a **congregation table only**: Fajr 05:55, Dhuhr 13:00, Asr 15:45, **Maghrib = sunset + 10 min**,
Isha 19:30, Jummah 13:30, plus a "prohibited time" block. The waqt columns are computed in the browser
from an aladhan-shaped payload (`shafi.data.timings` / `hanafi.data.timings` in the page chunk), with a
Hanafi/Shafi toggle and the publisher's own words: *"Countdowns follow the selected waqt calculation.
Jamaat times are set by Osaka Masjid."* No method is stated, no date is printed, nothing to fit.
`/prayer-times.md` (the site's own machine-readable twin) carries services and no times.
CONFIRMS the held reading: Osaka is jamā'ah-only.

Second Osaka body: `osakamosque.org` (Osaka Ibaraki Mosque) publishes a construction announcement and
no prayer table. `MIO — Masjid Istiqlal Osaka` surfaced in a third-party guide only; no site.

### Kyoto — NEW surface: Ramadan 1447 calendar (30 rows)

`kyotomuslims.net/ramadancalendar.html` (Kyoto Muslim Association / Kyoto Grand Mosque) renders one
image: `_src/49/ramadan_calendar__for_insta_2026-19.jpg`, 1080x1398, saved as
`captures/kyoto-ramadan-2026-1447.jpg`, transcribed to `data/kyoto-kma-ramadan-1447-2026.json`.
30 dated rows, 2026-02-19 … 2026-03-20, six columns. Footnote: *"Adopt from Islamic Finder org. with
gratitude and appreciation."*

| Column | Recipe | within-1 | exact | MAE |
| --- | --- | --- | --- | --- |
| fajr | 18.09° | 29/30 | 27 | 0.13 |
| sunrise | 0.833°, margin 0 | 30/30 | 26 | 0.13 |
| dhuhr | solar noon, +1 (rounding) | 30/30 | 18 | 0.40 |
| asr | Shafi, margin 0 | 30/30 | 17 | 0.43 |
| maghrib | sunset, margin 0 | 30/30 | 18 | 0.40 |
| isha | 17.16° | 30/30 | 28 | 0.07 |

all-six 29/30, amplitude fajr 38 min. **18/17 Shafi, no margins** — the Nagoya family, at a second
city, and now with the publisher naming its engine (IslamicFinder). Ramadan-only, so candidate tier.

### Tokyo — Tokyo Camii tenant is machine-readable and reproduces the held margins

`masjidbox.com/prayer-times/tokyo-camii` embeds a 7-day `timetable` in `window.REDUX_STATE`
(absolute ISO instants, +09:00). 7 dated rows, 2026-11-11 … 2026-11-17
(`data/masjidbox-tokyo-camii-2026-11.json`).

Measured against adhan 4.4.6 at 35.6667/139.6867: fajr **18** (7/7 exact), isha **17** (7/7 exact),
sunrise **−7** (7/7), dhuhr **+5/+6**, asr **+4/+5**, maghrib **+7/+8**. all-six 7/7.
So the platform tenant carries the mosque's own per-column margins and CONFIRMS the held Tokyo Camii
recipe (sunrise −7, dhuhr +5, asr +5, maghrib +8) in a form a feeder can parse. Masjidbox serves a
rolling week only; no date parameter moves the window (three probed).

### Sapporo — today-only widget, not a year-round table (negative on the held gap)

`sapporomasjid.or.jp` home carries an `iqamahTable` rendered server-side for one day: *"Saturday,
November 07"*, values 04:36 / 11:18 / 13:57 / 16:20 / 17:50 (fajr, dhuhr, asr, maghrib, isha) with
Jumu'ah 12:15 / iqamah 12:45. The block is produced by the WordPress plugin
`salah-world-prayer-iqamah-timings-for-your-masjids` (PrayTimes.js), so it is a calculator with the
mosque's own offsets, and the mosque states in its FAQ that the congregation schedule is set
**monthly** and published on the home page or social media. `wp-json/wp/v2/posts` returns 29 posts,
none an iqamah sheet; `ramadan-calendar-2026/` and `-2025/` remain the only dated artifacts.
A year-round Sapporo table does not exist under these terms.

### Sendai — negative

`iccsendai.org` (ICC Sendai) carries "今日の礼拝時間" as an embedded third-party iframe widget, plus
two Ramadan timetables (2021, 2022). No year-round table, no dated rows.

### Fukuoka — negative, with a stated jamā'ah rule

`fukuokamasjid.org` is live but reads *"Our website is temporarily offline while it is being rebuilt…
Only the website is affected."* The one page served publishes the congregation rule: Jumu'ah Friday
**12:30**, Sunday Dhuhr **13:00 all year**, *"These are the congregation (jama'ah) times set by the
masjid."* No table.

### Hiroshima — negative

No mosque domain resolves (`hiroshimamosque.com`, `hiroshima-mosque.jp` NXDOMAIN). The mosque body
appearing in guides is *Masjid Kasumi Hiroshima* (a room in a building, Friday 12:00–13:00 per a
third-party guide); no site, no table. Searches run in Japanese.

### Kobe — RECORD OVERTURNED: the mosque has an official site with full-year tables

The census holds "Kobe Mosque has NO official website". That is wrong. **`kobemosque.com`** is the
official site (banner: *"Welcome to the official website of Kobe Muslim Mosque — Beware of the fake
websites"*, which is exactly what `kobemosque.info` is; that farm was not opened).
`/prayers/prayer-timings/` carries a today row, **twelve monthly HTML tables**, twelve monthly PDFs
and a full-year PDF (`wp-content/uploads/2025/09/Kobe-Mosque-Prayer-Timings.pdf`, 13 pages).

The embedded tables are **2024** — all 366 printed weekdays match the 2024 calendar exactly (0
mismatches) — transcribed to `data/kobe-mosque-2024.json`, 366 rows.

| Column | Recipe | within-1 | exact | MAE |
| --- | --- | --- | --- | --- |
| fajr | 17.93° | 361/365 | 261 | 0.30 |
| sunrise | 0.833°, margin −1 | 334/365 | 218 | 0.50 |
| dhuhr | solar noon, +1 | 364/365 | 199 | 0.53 |
| asr | Shafi, +1 | 362/365 | 195 | 0.55 |
| maghrib | **printed iqama**, sunset +2 | 357/365 | 169 | 0.56 |
| isha | 17.10° | 359/365 | 182 | 0.52 |

all-six 322/365, amplitude fajr 158, isha 163. **18/17 Shafi with +1 margins on the solar columns**,
and the Maghrib column is the **iqama** (sunset + 2..3), not the start — a feeder must not read it as
sunset.

The 2025 PDFs (`january-2025.pdf`, `nov-pdf.pdf`, captured) are **the same numbers to the minute** as
the 2024 tables, with only the weekday column changed (verified Nov 1 and Nov 30: 4:55/6:19/11:43/
14:43/17:08/18:27 and 5:19/6:46/11:48/14:30/16:50/18:13 in both). One computed generation, two
year-stamps — **provisional, not A**, by the frozen-generation precedent. The iqama block is a mosque
convention that moves in steps (Fajr 6:30 → 6:15 mid-month; Isha 7:30 January, 7:45 November).

### Japan platform layer (mawaqit tenants, outside the named cities)

Enumerated from mawaqit's public mosque pages (its search API answers 401 to anonymous clients, and
`mawaqit.net/en/` redirects to a login, so enumeration came from search engines):

| Mosque | Page | Rows | Fit |
| --- | --- | --- | --- |
| As-Salaam Masjid Okachimachi, Taito | `mawaqit.net/en/m/assalam-masjid-taito-110-0016-japan` | 365 | **18/17 Shafi, all margins 0**; all-six 316/365 |
| MAKKI MASJID TOKYO | `mawaqit.net/en/makki-masjid-tokyo` | 365 | **fixed schedule**: fajr amplitude 20 min, isha 22, dhuhr one value all year — jamā'ah-only, not fittable |
| Masjid Indonesia Asahi, Chiba | `mawaqit.net/en/masjid-indonesia-asahi-asahi-289-2522-japan` | 365 | mixed: dhuhr fixed, isha amplitude 54 — partially fixed |
| MADINA MASJID TOKYO, Kita | `mawaqit.net/en/madina-masjid-tokyo-mateina-masuzido-kita-city-tokyo` | 365 | fixed isha (19:50 all year), fajr offset — not fitted |

The finding worth carrying: **inside one platform, Japanese tenants split into computed (Okachimachi,
18/17 zero margins) and fixed-schedule (Makki, Madina) classes**, and a fixed class must not be fitted.

---

## SOUTH KOREA

### KMF 2027-28 edition — NOT PUBLISHED (probe, honest negative)

Probed 2026-11-11T04:48Z through a browser session (`koreaislam.org` refuses plain curl from this
network: TLS stall, HTTP 503). `koreaislam.org/예배시간표/` lists: the full-year
**"2026년 2월-2027년 1월 예배시간표"** (uid=7400) and monthly posts February 2026 … **December 2026**
(uid 7371–7399). No 2027-28 document, no January 2027 monthly. The held PDF remains the latest
edition. Body saved: `captures/kmf-yeabae-list.html`.

### Daegu — NEW, full year, exact fit

`mawaqit.net/en/m/dar-ul-emaan-islamic-center-dkic-daegu-41567-south-korea`
(Daruleeman Kyungpook Islamic Center, 35.0 N 128.0 E). 365 rows, 2026
(`data/mawaqit-dar-ul-emaan-islamic-center-dkic-daegu-41567-south-korea.json`).

Recipe: **18/18, Hanafi asr, zero margins on all six columns**. fajr 18.00° (365/365 within 1),
isha 18.01°, sunrise/dhuhr/maghrib margin 0, asr Hanafi margin 0. **all-six 365/365.** Amplitude fajr
160 min, isha 167. The Shafi reading of asr misses by +53 min median — the mosque is configured
Hanafi, and only the Hanafi fit closes.

### Seoul — NEW second surface: Masjid Noor

`mawaqit.net/en/m/masjid-noor-seoul-seoul-05000-south-korea` (37.556, 127.073). 365 rows, 2026.
**18/18, Hanafi asr, maghrib +1, other margins 0; all-six 365/365.** Amplitude fajr 178.

### Yangju (Gyeonggi) — NEW: Gatbawi Mosque

`mawaqit.net/en/m/gatbawi-mosque-islamic-center-yangjusi-11426-south-korea` (37.8695, 127.0033).
365 rows. **18/17, Hanafi asr, zero margins; all-six 365/365.** Amplitude fajr 180.

### Busan, Incheon, Gwangju — negative (reconfirmed)

Korean searches (부산/인천/대구/광주 성원 예배시간표) return press, tourism pages and church sites.
`islaminkorea.net` city categories carry mosque directories with no times; the KMF PDF's 24-masjid
directory carries addresses and phones only. No mawaqit or masjidbox tenant exists for these three
cities under these terms. The KMF national table remains their only surface.

---

## PHILIPPINES

### Cebu, Iligan, Zamboanga, Marawi — negative (a year-round city surface is still absent)

Every result for all four cities is a calculator (islamicfinder, muslimpro, prayertimes.date,
hamariweb, athanpro, zabihah, quranmajeed) or a news page. Checked specifically:

- `planomasjid.org/monthly-prayer-schedule-2025/` is **Plano, Texas** (IACC), not Philippine.
- Zamboanga has a Facebook Ramadan timetable (2024) and a Scribd "Monthly Prayer Times — Zamboanga
  City" upload; neither is a publisher's public page, and the Facebook post is login-walled.
- Masjid Al-Khairah (Cebu), the Marawi Grand Mosque and Iligan's mosques publish no site.
- NCMF's site still serves the Ramadan 1447 JPEG set only; no year-round national or city table.

Searches run in English and Filipino terms (prayer times, oras ng pagdarasal, mosque schedule).

---

## What this changes in the record

- **Korea lifts from "two Seoul mawaqit captures" to three mosque-level full-year surfaces with exact
  recipes** (Daegu 18/18 Hanafi, Masjid Noor 18/18 Hanafi, Gatbawi 18/17 Hanafi). All are platform
  reproductions at zero margins; none is an authority publication.
- **Japan gains Kobe as a full-year authority surface** (18/17 Shafi, +1 solar margins, 366 rows,
  official site discovered; the "no official website" record is dead) and **Kyoto** (18/17 Shafi, no
  margins, Ramadan-only, publisher names IslamicFinder) plus a machine-readable Tokyo Camii tenant
  that reproduces the held margins.
- **The KMF 2027-28 probe is a negative with a date**, not an assumption.
- **Philippines unchanged**: no year-round city surface found under these terms.
- **Kobe's two year-stamps are one generation**: the 2025 PDFs repeat the 2024 tables to the minute.
