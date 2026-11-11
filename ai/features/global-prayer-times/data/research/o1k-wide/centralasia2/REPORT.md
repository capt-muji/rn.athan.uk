# O1k wide research — centralasia2 (Turkmenistan, Tajikistan, Kyrgyzstan, Kazakhstan, Uzbekistan, Afghanistan)

Agent tag: `centralasia2`. Captured 2026-11-10 (UTC) against the live web. Public pages only; nothing behind a login; no captcha encountered except where noted.

Reading order: each country gives the surface table first, then what CONFIRMS the census record, what is NEW, what deserves a fit, and the honest negative.

---

## Kazakhstan — CONFIRMED, YEAR-6, ONE NEW CITY (plus a second)

### Surfaces

| Source | URL | Tier | Data | Years |
|---|---|---|---|---|
| DUMK prayer page | `https://muftyat.kz/kk/namaz_times/` | authority | 6 columns, per day, client-computed from the page's own `prayTimes.js` + city coordinate list in its own `<select>` | unbounded; year choice is the visitor's date range |
| DUMK city list | same page, 384 `<option data-lat data-lng data-tz>` entries (4 duplicates of each named city) | authority | exact 6-decimal coordinates per settlement | n/a |
| DUMK name lookup | `https://api.muftyat.kz/api/v1/get/cities/?search=` | authority | JSON city records used by the select2 picker | n/a |

### What confirms the census

The page's own recipe is verbatim as the census recorded it: `prayTimes.setMethod('ISNA')`, `adjust({asr:'Hanafi'})`, `adjust({highLats:'AngleBased'})`, then a hard latitude test `if (lat < 48)` selecting the margin set — `sunrise −3, dhuhr/asr/maghrib +3` below the line, `−5/+5` at or above it, with fajr and isha never corrected. Both branch bodies are in the captured `captures/kz-namaz_times.html`.

Reproduction check: running the site's own `captures/kz-prayTimes.js` under Node with `dst=0` reproduces the rendered page **cell for cell, 6/6 days** at Astana 2026-11-10..15, and **6/6 days** at Astana 2028-01-01..06. Raw rendered rows are in `captures/kz-live-render-notes.json`.

### What is new

- **Astana 2028, full year, 366 rows** (`data/kz-astana-2028.json`). That is the sixth year on record for the city (2025/2026/2027/2028/2030/2036).
- **Karaganda 2028, 366 rows** (`data/kz-karaganda-2028.json`), id 39, 49.806406 / 73.085485 — a **≥48 °N settlement**, so the set-B branch. New city.
- **Shymkent 2028, 366 rows** (`data/kz-shymkent-2028.json`), id 57, 42.368009 / 69.612769 — a **<48 °N settlement**, set A. Also new. Both branches are therefore now witnessed by a second city.
- Live render of 2028 confirmed on the page itself, not only by reproduction: the page's `date-now`/`end-date` inputs accept 2028 and the table renders it.

### Trap re-measured, and it is exactly one hour

The census recorded that `prayTimes.getDst` compares the **visitor's** clock to the city, so a DST-zone browser adds an hour to summer dates. The page calls `getTimes($startdate, coords, $timezone, 'auto', '24h')` — `dst` is literally `'auto'` in `timesByPeriod()`, `calculateTimes()` and the download handler.

Measured on 2028-06-20..25 from a Europe/London browser:
- Karaganda live render `03:04 04:54 13:14 18:48 21:24 23:14` against the `dst=0` reading `02:04 03:54 12:14 17:48 20:24 22:14`.
- Shymkent live render `03:59 05:42 13:26 18:44 21:05 22:47` against `02:59 04:42 12:26 17:44 20:05 21:47`.

All six columns, both cities, all six days: **+60 minutes exactly**. Winter dates are unaffected because the visitor's offset equals the city's minimum. Any crawl must force `dst=0`.

### What deserves a fit

Nothing new. The existing grade-A fit holds; 2028 is a straight continuation. The new signal is coverage: a second city on each side of the 48 °N line, which is the one place the census flagged as unsmoothed.

---

## Kyrgyzstan — CONFIRMED, and the ceiling is gone: full-year 2027 for both cities

### Surfaces

| Source | URL | Tier | Data | Years |
|---|---|---|---|---|
| Muftiyat calendar page | `https://muftiyat.kg/ru/calendar/` (Bishkek), `/ru/calendar/2/` (Osh) | authority | table body is empty in the HTML — filled by JS | current window |
| **Documented JSON API** | `https://muftiyat.kg/ru/api/v1/calendar/{locationCode}/?start=DD-MM-YYYY&end=DD-MM-YYYY` | authority | fajr, sunrise, dhuhr, asr, **sunset**, maghrib, isha, tahajjud | any window ≤ 2 calendar months, any year tried |
| API documentation | `https://muftiyat.kg/ru/calendar/api/` | authority | endpoint shapes, language codes, **all 100+ location codes** | n/a |

The API is documented on the muftiyat's own site. It is not mentioned in the census, which recorded only the page and its 21-day slice.

### Ceiling measurement

- The UI calendar shows a **21-day slice** (`10-11-2026 – 30-11-2026`), matching the census.
- The API serves **2 calendar months** per call. A wider range does not error: it **302-redirects** to `start .. start+2 months`. `01-01-2026 .. 31-12-2026` redirects to `01-01-2026 .. 01-03-2026`.
- The window is **not** pinned to today: `10-01-2027 .. 09-03-2027` returned 59 rows, 200 OK.
- **2028 serves**: `01-01-2028 .. 29-02-2028` returned 60 rows.

So the digit ceiling the census removed from the *recipe* is also absent from the *surface*, once the API is used instead of the page. A full year costs six calls per city.

### Captured

`data/kg-bishkek-2027.json` and `data/kg-osh-2027.json`: **365 rows each, 2027-01-01 .. 2027-12-31, zero gaps, zero ordering violations** in either city. Window dates and rules are in `data/kg-2027-metadata.json`.

### What confirms the census

`maghrib − sunset = 7 minutes` on **365/365 days in both cities** — an independent year confirming the L1-superseding `+7.0` display margin exactly, not within a band.

`isha − maghrib` ranges 76–110 min (Bishkek) and 73–101 (Osh), consistent with the twilight-ratio rule rather than a fixed interval.

### What is new

- The **API as a surface** (a documented endpoint, not a page scrape).
- **Full-year 2027** for Bishkek and Osh — year-2 evidence, which was the census's stated lift.
- The **`sunset` column**, previously unavailable from the page, which is what makes the `+7` check exact.
- The **full location list** (100+ settlements, with codes) in `captures/kg-api-alllocations.json`.

### What deserves a fit

The 2027 year is fit-ready against the existing ratio constant. The `sunset` column allows the maghrib margin to be re-derived rather than assumed, and `tahajjud` gives a free cross-check on the night division.

---

## Tajikistan — CONFIRMED as window-class, with an ARCHIVE, and the window's left bound IS the instant

### Surfaces

| Source | URL | Tier | Data | Years |
|---|---|---|---|---|
| Shuroi Ulamo prayer page | `https://shuroiulamo.tj/tj/namaz` (also `/ru/namaz`, `/en/namaz`) | authority | windows for the current 10-day slice, Dushanbe only | current |
| **Shuroi Ulamo month endpoint** | `POST https://shuroiulamo.tj/tj/namaz/ntime` with `fmonth`, `fyear`, `fday=0` | authority | **a whole requested month**, one row per day, 6 window columns | **2014-12 .. 2026-11** |
| Shuroi Ulamo homepage widget | `https://shuroiulamo.tj/` | authority | **today's five prayer INSTANTS**, Dushanbe | today |
| takvim.tj / taqvim.tj | `https://takvim.tj/`, `https://www.taqvim.tj/` | community mirror | today's windows **with seconds**; 19 cities declared | today |

The month endpoint was found in the page's own inline `getNamazTime()` handler (`captures/tj-namaz.html`), which the form calls. It takes no CSRF token and answers plain HTML `<tr>` fragments.

### Captured

`data/tj-windows-2014-12_2026-11.json` — **4,343 days** of windows, 2014-12-08 .. 2026-11-30, from **143 monthly captures** (`captures/tj-months/`). Three gaps: 2018-12 missing, 2019-08-14 and 2023-02-13 absent from their months.

Archive bounds measured: 2014-11 and earlier return the literal string `no`; **2026-12 onward also returns `no`** — the surface publishes a month when it begins and keeps it forever.

### The instant-form question, answered

The brief asked for an instant-form table. **One exists, on the authority's own homepage**: for 11.11.2026 it prints Бомдод 05:32, Пешин 12:40, Аср 15:32, Шом 17:26, Хуфтан 18:56 (`captures/home-shuroiulamo-tj.html`).

Checked against the same day's window row — fajr `05:32 - 07:01`, dhuhr `12:40 - 15:31`, asr `15:32 - 17:05`, maghrib `17:26 - 18:06`, isha `18:56 - 05:31` — **every published instant equals the left bound of its window**. So the window class is decodable without a new consumer path: take the left bound. `data/tj-instants-derived-2014-12_2026-11.json` is that derivation, and it is valid by this check rather than by assumption.

Column semantics, as read from the table: the fajr window's right bound is sunrise; the "Фурӯ рафтани офтоб" column is a disliked-interval bracket around sunset and is **not** a prayer; isha's window crosses midnight.

### Window stability, month to month

**The windows are recomputed, not a template.** Zero of 365 month-days are identical across the twelve years; median spread on the fajr window start across years is 15 minutes. Full-year behaviour is therefore real data, not a reused page.

Two defects found in the archive, both datable:
- **A dhuhr convention change**: the dhuhr window start is `13:00` through **2019-06-30** and `12:40` from **2019-07-01** onward, with a transitional `12:50` throughout **2020-10-01..10-31**.
- **104 null cells** printed as `00:00`, sparse (e.g. 2019-03-21 fajr, 2023-05-19 dhuhr), plus isolated absurdities (2017-06-23 dhuhr `00:13`, 2023-02-19 dhuhr `12:00`, 2023-10-09 fajr `04:09` among `04:5x` neighbours).

### Second witness

takvim.tj states in its own footer: "Вақтҳои намоз аз Маркази Исломии Ҷумҳурии Тоҷикистон гирифта шудааст" — prayer times taken from the Islamic Centre. It is a **republisher**, not an independent witness, and its numbers track the official day to ±1 min on the boundaries. Its 19-city selector is inert in the served output: the widget is Dushanbe-locked whatever `OptionIndex` cookie is sent (`captures/tj-takvim-city*.html` are byte-identical).

### Honest negative

No instant-form table covering more than the current day exists. `shuroiulamo.tj` publishes instants only through the homepage widget; the month endpoint is windows only. No Tajik or Russian search returned an official daily-instant PDF or feed.

---

## Uzbekistan — **the state board and the portal do NOT publish the same numbers**

This is the answer to the open attribution question, and it goes against the census's "the numbers agree".

### Surfaces

| Source | URL | Publisher | Tier | Data | Dates |
|---|---|---|---|---|---|
| islom.uz widget | `https://islom.uz/` header | «Islamic Portal» MChJ, a private company (Гувоҳнома №1566) | secondary, computed | 6 columns, **90 cities** in a picker | the **visitor's** calendar day |
| muslim.uz widget | `https://muslim.uz/oz/c/category/namoz` (every page) | **Ўзбекистон мусулмонлари идораси** — the state board | authority | 6 numeric columns, server-rendered | the **current Asia/Tashkent** day |
| islom.uz prayer route | `https://islom.uz/namoz-vaqtlari` | as above | — | renders no numbers at all; the widget lives on the homepage | — |

### What the state board actually serves

`muslim.uz` prints six numbers in its header on every page — for 11 Nov 2026, Тошкент: Бомдод 05:45, Қуёш 07:06, Пешин 12:12, Аср 15:26, Шом 17:10, Хуфтон 18:26.

It has **no city selector and no date control**. Parameters `?date=`, `?d=&m=&y=`, `?day=&month=&year=`, `?city=`, and `?region=1..13` were all tried; every one is ignored and the same Tashkent/today block comes back. There are no regional prayer pages: `/oz/region/N`, `/oz/viloyat/N`, `/oz/hudud/N` all 404, and the "Вакилликҳо" (representations) page carries no times.

So the state board publishes **one city and one day**. The census's "the state board's own regional pages corroborate the measured 15.5/15.5 Hanafi" cannot be reproduced: no such regional numeric pages exist today.

### The same-day diff

Both surfaces were forced onto the same calendar day by loading islom.uz with the browser clock in `Asia/Tashkent` (its date is the visitor's date). Tashkent, **2026-11-11**, minutes:

| | fajr | sunrise | dhuhr | asr | maghrib | isha |
|---|---|---|---|---|---|---|
| islom.uz (portal) | 05:45 | 07:06 | **12:07** | 15:26 | **17:12** | **18:29** |
| muslim.uz (state board) | 05:45 | 07:06 | **12:12** | 15:26 | **17:10** | **18:26** |
| portal − board | 0 | 0 | **−5** | 0 | **+2** | **+3** |

Three of five prayers disagree. Fajr and asr agree exactly.

The dhuhr gap has a clean reading: 12:07 is apparent solar noon for 69.24 °E on that date (mean noon 12:23 at the UTC+5 meridian, minus the ~16 min equation of time), so the portal publishes noon itself while the **state board adds a five-minute precaution**. That inverts the census's account of the portal's "+5 display margin": the five minutes are the board's, not the portal's.

Three dates × three cities, as asked:
- islom.uz, 3 cities × 2 dates (10 and 11 Nov — the two days the visitor-clock rule can reach) are in `data/uz-twopublisher.json`.
- muslim.uz can supply **exactly one** of those nine cells: Tashkent, 11 Nov. The other eight do not exist on the state board's site.

### Verdict on the publisher

**islom.uz is the publisher of the table of record; the state board is not.** The board's surface is real, numeric and authority-tier, but it is one city, one day, no city picker, no date parameter, no regional pages — it cannot be the source of a 60-day, two-city evidence set, and it does not agree with the portal at dhuhr, maghrib or isha. The corpus line "the numbers agree" is refuted at three of five prayers.

### What deserves a fit

- Keep the islom.uz fit, but **re-state its provenance as a private portal** with no state corroboration at three columns. The defect the census listed ("state attribution unsettled") should be closed as *settled against state authorship*.
- The `differ_minute` field in the portal's city records is **dead in the current bundle** — it appears only on the hard-coded Tashkent default object and is never read by the calculation. The census's per-region `differ_minute` reading no longer matches the code that ships.
- The board's dhuhr `+5` is the one constant a state-grade fit for Uzbekistan would need, and it is measurable from this single block.

---

## Afghanistan — CONFIRMED as image-only, ONE NEW ARTIFACT, and a FOUR-YEAR-APART EDITION THAT AGREES CELL FOR CELL

### Surfaces

| Source | URL | Tier | Data | Years |
|---|---|---|---|---|
| Permanent table, Pashto | `https://mohia.gov.af/sites/default/files/2025-02/اوقات نماز وزارت حج و اوقاف 1.pdf` | authority | **3 pp, 9 rasters, no text layer** — CorelDRAW 2024 export, created 2025-01-06 | 1404 SH / 2025 |
| Permanent table, Dari | `https://mohia.gov.af/sites/default/files/2025-02/اوقات نماز دری.pdf` | authority | 1 p poster, no text layer, created 2025-02-17 | same |
| **Monthly series, 1400 SH** | `https://mohia.gov.af/sites/default/files/2021-03/اوقات نماز.pdf` | authority | **12 pp — one per Afghan solar month — one row per DAY**, with a زوال column | 1400 SH |
| Ministry page for the table | `https://mohia.gov.af/dr/اوقات-نماز-های-پنجگانه-شهر-کابل` | authority | the page that links both files | n/a |
| National portal calculator | `https://afghanistan.af/pages/namaz/` | state portal, **computed** | 20 cities, self-selected date, Hanafi Karachi 18/18 and Ja'fari Tehran 16/14, "no internet needed" | any date |
| Kabul Municipality block | `km.gov.af` | authority site, **aladhan widget** | — | — |

### What the permanent table actually is

Read at 2600 px from `captures/af-mohia-namaz-1.pdf` (and confirmed on the Dari poster, which is the same sheet in Dari):

- Title: "جدول دایمی اوقات نماز های پنجگانه شهر کابل و نواحی آن" — permanent table, Kabul city and its districts.
- Body: **one block per Afghan solar month** (برج حمل، ثور، جوزا، سرطان، اسد، سنبله، میزان، عقرب، قوس، جدی، دلو، حوت), each block carrying **one row per day of that month** over six columns: طلوع فجر، طلوع آفتاب، ظهر، عصر، مغرب، عشاء.
- So it **is** a daily table, and it can witness a specific date. It is not a monthly-resolution poster.
- Printed note, verbatim: "نوت: اوقات تعیین شده فوق اوراق شهر کابل الی ساحه (۱۲ کیلو) متری آن معتبر است" — valid for Kabul up to 12 km. Imprint: "سال چاپ: ۱۴۰۴ هـ.ش - ۲۰۲۵ میلادی".
- Publisher line: "ریاست عمومی ارشاد و انسجام امور مساجد" under "وزارت ارشاد، حج و اوقاف / امارت اسلامی افغانستان".

### What confirms the census

- **Image-only**: both current PDFs carry zero `/Font` and zero `/ToUnicode` entries; `pypdf` extracts 0 characters from all 3 pages of the poster and all 12 pages of the 1400 series. Nine rasters across three pages, exactly as recorded.
- **The 12 km radius**: printed verbatim on the sheet's own note.
- The older edition is equally raster-only, so no text-extractable edition exists at either date.

### What is new

- **A second edition of the same table, four years older, at a stable URL**: the 1400 SH series, `https://mohia.gov.af/sites/default/files/2021-03/اوقات نماز.pdf`, 12 pages (one page per month), `captures/af-mohia-namaz-1400.pdf`.
- The **Dari edition** of the current table (1 p poster, created 2025-02-17), `captures/af-mohia-namaz-dari.pdf.png`.
- The ministry's **own page** for the table, the correct place to watch for new editions: `https://mohia.gov.af/dr/اوقات-نماز-های-پنجگانه-شهر-کابل`. Its other linked files are unrelated — `combinepdf.pdf` is a memorial booklet portrait page, not prayer data.

**The 1400 sheet and the 1404 poster agree exactly.** For برج حمل day 1 both print fajr `4:33`, sunrise `5:57`, ظهر `12:01`, asr `4:20`, maghrib `6:08`, isha `7:30`. (Both read from the rasters at 2600 px; the 1400 page and the poster's حمل block are legible at that zoom.) Four years apart, same six numbers. That is a **stability result, not an independent witness** — same publisher, same ministry.

The 1400 sheet adds **زوال** as a named column where the current poster prints **ظهر**; both mark the noon entry. Neither carries an explicit "zawal" instant separate from dhuhr.

### Honest negative on a second witness

Searched Pashto, Dari and English: `لمونځ وختونه 2026`, `اوقات الصلاة كابل 2026 وزارت حج و اوقاف`, `باختر اوقات نماز جدول کابل`, `اوقات نماز هرات جدول وزارت ۱۴۰۵`, `افغانستان اوقات الصلاة بلخ مزار شریف جدول رسمی`, plus the ministry's own site and file tree.

- **No province publishes its own numeric table.** Herat, Balkh and Kandahar return only ministry reposts and computed sites.
- **No state-media republication carries numbers.** Bakhtar and the ministry's X/Facebook/Instagram accounts redistribute the ministry's own posters and Ramadan PDFs — the same publisher, image-only, no independent figures.
- `afghanistan.af/pages/namaz/` is a **calculator** (Karachi 18/18 Hanafi, Tehran 16/14 Ja'fari, "روش محاسبه" stated on the page), not a republication of the ministry's table. It is a computed surface and cannot witness the ministry's numbers.
- `km.gov.af` still serves the aladhan ISNA block — the census trap stands.

### What deserves a fit

The 1400 series is a second, per-day, machine-addressable artifact of the same table and is OCR-ready (12 clean pages, one month each, day-ordered): 12 pages × one month is a full solar year of Kabul rows. It is a cheaper OCR target than the 3-page poster, which packs twelve month blocks per page at small type. Neither file has a text layer (zero `/Font`, zero `/ToUnicode` in both PDFs), so transcription or OCR remains the only route.

---

## Turkmenistan — CONFIRMED NOTHING (retried in Turkmen and Russian)

Searched, in both languages and in English: `namaz wagty 2026 Aşgabat Türkmenistan`, `namaz wagty Aşgabat metjit 2026`, `Türkmenistanyň müslümanlarynyň dini dolandyryş merkezi namaz wagty`, `время намаза Туркменистан официальный муфтият сайт`, `время намаза Ашхабад 2026 расписание`, `site:turkmenistan.gov.tm намаз`, `site:tdh.gov.tm намаз время`.

- **No muftiate site exists.** The state religious body (Türkmenistanyň Müslümanlarynyň Dini Dolandyryş Merkezi) has no domain; `metjit.gov.tm` does not resolve.
- **The state portals carry religion as news, not as tables.** `turkmenistan.gov.tm` and `tdh.gov.tm` return articles about spiritual tradition and holidays; their search endpoints 404, and no page in the site-restricted results carries a prayer-time table.
- **No mosque in Ashgabat publishes its own times.** No `namaz wagty` announcement, no iqamah board, no Facebook page with a monthly table.
- Every times surface reachable is **third-party and computed**: aladhan, namazvakti/salattimes (Diyanet-derived), islamicfinder, muslimpro, 5namaz, 1namaz, al-harameen, raspisanienamaza, prayertimes.date — plus a private iOS/Android app "Namaz Wagty" (`id6744238772`, `com.akyolnm`) that claims nationwide times with no stated authority.

**Verdict unchanged: fallback, no surface.** The census's "confirmed nothing" holds after a second pass in the local languages. There is nothing here to fit, and no candidate worth a third pass.

---

## Files

- `captures/` — every raw page, JSON, PDF and extracted raster, named by source.
- `data/kz-*.json` — 2026 and 2028, Astana / Karaganda / Shymkent, 366 rows each for 2028.
- `data/kg-{bishkek,osh}-2027.json` — 365 rows each; `data/kg-2027-metadata.json` — windows, API shape, rule.
- `data/tj-windows-2014-12_2026-11.json` — 4,343 days of windows; `data/tj-instants-derived-*.json` — left-bound instants; `data/tj-2014-2026-metadata.json`.
- `data/uz-twopublisher.json` — both publishers, both dates, three cities, and the same-day diff.
- `scripts/` — the generators and accrual scripts used, so every number is reproducible.
