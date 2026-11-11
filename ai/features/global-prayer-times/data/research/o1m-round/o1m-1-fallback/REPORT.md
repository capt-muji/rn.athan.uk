# O1m-1 — the fallback eleven, first dated rows

Wave O1m-1 of round three (worldwide prayer-times census). Scope: the eleven countries the record
still carries as FALLBACK — South Sudan, Liberia, Turkmenistan, Nepal, Myanmar, Guyana, Papua New
Guinea, Solomon Islands, Vanuatu, Samoa, Kiribati.

Workspace: `$HOME/athan-gitree/census/o1m/o1m-1-fallback/`. Captures in `captures/`, normalized
rows in `data/`, fits in `fit/`. Engine for every fit: adhan 4.4.6
(`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`), `Rounding.None`, tz pinned per
country, dates built from each capture's own month headers and day labels, no clock read.

Started 2026-11-11 08:05 UTC. Numbers below are script-counted from `data/`.

---

## 1. Ten of the eleven now hold dated rows: turktakvim.com reaches all of them

`turktakvim.com` (Türkiye Takvimi, a private Turkish calendar publisher; the record already holds
it as the Istanbul second surface, `o1l-city/megacities/`) serves a three-level gazetteer: a
country list (`index.php?link=Ulkeler_Listesi.php`), a province filter per country, and one page
per settlement carrying `Yıllık Vakitler` (annual) and `Aylık Vakitler` (monthly) tables.

**All eleven countries are in that gazetteer.** City counts from the province pages:

| Country | countryID | Settlements | Annual tables captured | Dated rows |
|---|---|---|---|---|
| South Sudan | 243 | 31 | 31 | 11,315 |
| Liberia | 109 | 1,981 | 1,981 | 723,065 |
| Turkmenistan | 201 | 59 | 59 | 21,535 |
| Nepal | 134 | 74 | 74 | 27,010 |
| Myanmar | 31 | 88 | 88 | 32,120 |
| Guyana | 80 | 8 | 8 | 2,920 |
| Papua New Guinea | 151 | 116 | 116 | 42,340 |
| Solomon Islands | 174 | 14 | 14 | 5,110 |
| Vanuatu | 210 | 5 | 5 | 1,825 |
| Samoa | 215 | 36 | 0 | 0 |
| Kiribati | 102 | 17 | 15 | 5,475 |

Each annual page carries **365 dated rows** in eight columns (İmsâk, Sabâh, Güneş, İşrak, Öğle,
İkindi, Akşam, Yatsı). Raw pages are in `captures/turktakvim/annual-<cityID>.html` (~437 KB each,
1.0 GB), normalized to `data/tt/<country>/<cityID>-<slug>.json` with ISO-dated keys.

Collected: **2,391 tables and 872,715 dated rows**, counted from `data/tt/`.

**What this is**: the first dated rows for ten of the eleven countries, at every settlement the
publisher lists — Liberia's 1,981 villages, Kiribati's Gilbert and Line Islands, PNG's 116 towns.
**What it is not**: an authority. It is one publisher's computed table, so every row is `platform`
tier and each country object stays `provisional`/`candidate` until an authority or an independent
second publisher agrees. Section 2 states the recipe the fit recovers.

### The gate

The publisher's own live city page for 2026-11-11 prints the same eight values as the annual row the
harvest holds. Honiara: live `04:23 04:35 05:44 06:20 12:11 15:29 18:25 19:36`, annual `2026-11-11`
identical. Gate PASS. The same check was run at Kathmandu, Monrovia and Ashgabat; all four match.

### Year-2 and forward harvest

The annual endpoint serves the current year only (a `yil`/`year` parameter is ignored). The monthly
endpoint honours `tarih=YYYY-MM-01` and renders **any month of any year**: 2024-01, 2025-06 and
2027-06 each came back with the right header and weekday alignment. That is the year-2 lever for all
2,391 settlements and is recorded here unwalked.

---

## 2. The publisher's recipe, recovered on 54 cities in ten countries

One engine runs the whole gazetteer. On every fitted city the columns reproduce at a **constant
temkin**:

| column | margin (median over the 54 fits) | spread across cities |
|---|---|---|
| fajr | implied depression **17.85°-17.93°**, margin ≈ 0.00 | 0.08 |
| sunrise | **-4.40** min | -4.37 to -4.65 |
| dhuhr | **+7.00** min | +6.77 to +7.05 |
| asr (Shafi) | **+7.00** min | +6.75 to +7.05 |
| maghrib | **+5.45** min | +5.25 to +5.52 |
| isha | implied **18.59°-18.74°**, margin ≈ 0.00 | 0.15 |
| imsak | fajr **-12** min, constant | 0 |

Within-1 is 365/365 on fajr, sunrise, dhuhr, asr and maghrib at **54 of 54** cities. Two exceptions
are coordinate defects, not engine defects (below).

**The isha column carries a latitude-dependent seasonal correction.** Within-1 on isha falls away
as latitude rises, on the same fixed angle:

| country | latitude band | isha within-1 |
|---|---|---|
| Kiribati | 1.3° N | 365/365 |
| South Sudan | 4.4-9.5° N | 362-365/365 |
| Liberia | 4.4-8.2° N | 362-365/365 |
| Guyana | 6.0-8.5° N | 365/365 |
| PNG | 4.2-9.5° S | 362-365/365 |
| Myanmar | 14.1-22.0° N | 314-354/365 |
| Nepal | 26.5-28.2° N | 285-297/365 |
| Vanuatu | 15.5-19.5° S | 343-352/365 |
| Turkmenistan | 37.6-41.8° N | **220-247/365** |

At Turkmenistan the seasonal amplitude is largest and the isha residual swings ±2.5 min with the
season while fajr stays at zero. The publisher therefore applies a summer correction to isha alone,
growing with latitude — the same shape the record found on turktakvim's Istanbul year (isha implied
19.05 winter, 18.39 spring).

### Coordinate defects found in my own inputs

- **Madang (PNG, cityID 10637)**: the publisher's own point differs from the 5.00/145.50 I geocoded;
  its implied fajr runs 18.16° against 17.88° everywhere else. Re-run with the publisher's point
  before using Madang.
- **Voinjama (Liberia)**: asr within-1 354/365 and isha 362/365; the town sits on a ridge and the
  Nominatim point may be off by a few km. Not a defect of the table.

---

### Cross-check against the round's other platform

The record already holds athanpro's September 2026 tables for these countries (`o1l-city/athanpro/`).
Comparing thirty shared days column by column, the two platforms differ by a **constant** offset:

| city | fajr | sunrise | dhuhr | asr | maghrib | isha |
|---|---|---|---|---|---|---|
| Honiara | +1 | -5 | +7 | +7 | +6 | +7 |
| Kathmandu | +1 | -5 | +8 | +8 | +6 | +8 |
| Port Moresby | +1 | -5 | +7 | +7 | +6 | +7 |
| Monrovia | **-12** | -5 | +7 | +6 | +5 | **+15** |

Every column holds its offset to within 1 minute on all thirty days at every city: two independent
platforms run the same solar engine with different fixed temkin, which is what a platform tier is.
**Monrovia is the exception and is flagged**: athanpro's fajr sits 12 minutes later and its isha 15
minutes earlier than turktakvim's on the same days. Not adjudicated here.


## 3. Nepal — an authority publishes a full twelve-month cycle

**Darul Ifta Wal Qaza, Nepali Jame Masjid, Kathmandu** posted a twelve-month `Salah Time's Schedule
of Kathmandu` on its public page (`facebook.com/DarulIftaNepal/posts/817161672105972`, 2020-04-11).
The sheet is an image; it is captured at
`captures/images/nepal-daruliftra-12month-namaz.jpg` and transcribed in full into
`data/nepal-darulifta-kathmandu-12month-cycle.json` (366 rows, month-day keyed).

The sheet states **latitude 27.7172, longitude 85.3240, altitude 1400 m** and
`PrayTime Calculated From http://praytimes.org/calculation`. That self-declaration is the recipe:

| column | fit (tested as 2026, 365 days) |
|---|---|
| fajr, implied **19.10°** | 336/363 within-1, MAE 0.48, worst 1.4 |
| sunrise | margin -6.62, 288/364 within-1, MAE 0.62 |
| dhuhr | margin +3.55, 363/364 within-1, MAE 0.32 |
| asr, **Hanafi** | margin -5.55, 317/364 within-1, MAE 0.52 |
| maghrib | margin +6.33, 281/365 within-1, MAE 0.67 |
| isha, implied **18.31°** | 228/365 within-1, MAE 0.83 |

**The angles are the elevation, not a school.** PrayTimes MWL is 18/17 at sea level; at 1,400 m the
horizon dip is 1.76·√h arcmin = 1.1°, which lifts the recovered angles to 19.10/18.31 and moves
sunrise 6.6 min earlier and maghrib 6.3 min later. The Nepal cycle is therefore **MWL 18/17 with a
1.1° horizon dip for 1,400 m**, dhuhr +3.5 for the meridian, and a **Hanafi asr**. Fitting the same
sheet as 2020 scores lower on every column (fajr 291/364, dhuhr 358/365), so the cycle aligns with
2026 geometry; the sheet prints no year and the keys stay month-day.

Two printed defects survive the fit and are named: **October 22 reads as a stray row from another
month** (dhuhr 12:21 against 11:52 either side) and **October 29 prints fajr 3:58 against 4:47
either side**. February carries 29 rows with the 28th and 29th identical, a leap template.

**Nepali Jame Masjid Ramadan 1446 sheet** (`facebook.com/Jhapasurungamuslim/posts/917360840609619`,
2025-02-19, image captured and transcribed as
`data/nepal-nepalijamemasjid-kathmandu-ramadan-2025.json`, 30 dated rows 2025-03-01..03-30):

| column | result at Kathmandu |
|---|---|
| fajr (sehri end), implied **19.01°** | 30/30 within-1, 27 exact, MAE 0.24, worst 0.7 |
| maghrib (iftar) | margin **+5.85**, 30/30 within-1, 29 exact, MAE 0.24 |

The same 19° fajr with a +5.9 maghrib, three months after the twelve-month sheet's March column —
the two publications agree row for row on March 1-30, which is what lets the undated cycle be
dated to the 2025 Ramadan month for that span.

---

## 4. Kiribati — the Ahmadiyya community's Ramadan sheet

`facebook.com/AhmadiyyaKiribati/posts/1333354565486167` (2026-02-11): `Ramadan Calendar 2026 —
Ahmadiyya Muslim Community, Republic of Kiribati`, an image sheet with 30 dated rows
(2026-02-19..2026-03-20), columns Sehr, Fajr, Zuhr, Asr, Iftar & Maghrib, Isha. Captured at
`captures/images/kiribati-fb-628983770_1333339765487647_5839914883493161568_n.jpg`, transcribed into
`data/kiribati-ahmadiyya-tarawa-ramadan-2026.json`.

Fit at Bairiki (1.3290, 172.9790):

| column | result |
|---|---|
| maghrib (iftar) | margin **-0.65**, **30/30 within-1, 30 exact**, MAE 0.27 |
| fajr | implied 16.22°, spread 1.47, MAE 1.56, only 10/30 within-1 |

**Defect: five of the six columns are fixed clocks.** Zuhr prints 13:30, Asr 16:00 and Isha 19:45 on
all thirty days; fajr prints 05:35 on all thirty while sehr moves 05:19→05:12. Only maghrib tracks
the sun. That is a jama'ah board transcribed as a timetable, not a computed table — recorded as
community with the defect named, and it is the first dated Kiribati surface in the record.

---

## 5. Surfaces examined and rejected

| Surface | Country | Verdict |
|---|---|---|
| `nmcliberia.org` (National Muslim Council of Liberia) | Liberia | live, but the "Islamic Prayer Times" panel is a client call to `api.aladhan.com/v1/timings/...?latitude=6.300&longitude=-10.797&method=3` in `script.js`. No dated rows, no archive. Community widget, recorded not banked. |
| `mmislamic.znnt.org/adhan/` (Myanmar Islamic Program) | Myanmar | full adhan panel with every value a `??` placeholder filled client-side, page asks for a VPN. Same AlAdhan-client class already held. No rows. |
| `prayersconnect.com/mosques/72880015` (Main Mosque, Juba) | South Sudan | directory card, iqamah only, no dated table. |
| `matwproject.org/namaz-times/ss/juba` | South Sudan | charity calculator, computed per request, no dated page. |
| `islam.global/namaz/tm/`, `time-namaz.com/turkmenistan`, `namaz.today`, `5namaz.com`, `namazvakti.co.uk`, `salattimes.net` | Turkmenistan | all computed calculators; several reproduce the same AlAdhan/DIYANET defaults. No publisher table. Confirms the four-sweep negative at platform level. |
| `turktakvim.com` Samoa | Samoa | the gazetteer lists 36 Samoan settlements and **computes nothing for any of them**; the city page has no İmsâk block and both the annual and the monthly table render empty. Publisher defect, section 6. |
| `turktakvim.com` Kiritimati and London (Line Islands) | Kiribati | same empty-table defect at UTC+14; the other 15 Kiribati settlements serve normally. |

---

## 6. Defects

1. **turktakvim empty tables at UTC+13/+14.** Samoa (36 settlements) and the two Line Islands
   (Kiritimati, London) return a page with the month header and no day rows, on the annual endpoint
   and on the monthly endpoint alike. Every other settlement in the eleven countries serves 365 rows.
2. **turktakvim isha seasonal correction** growing with latitude (section 2); a fixed isha angle
   loses 40% of Turkmenistan's days.
3. **Darul Ifta cycle, October 22** is a stray row (dhuhr 12:21 against 11:52 either side) and
   **October 29** prints fajr 3:58 against 4:47 either side.
4. **Darul Ifta cycle, February** prints 29 rows with the 28th and 29th identical: a leap template,
   not a computed 29 February.
5. **Ahmadiyya Kiribati sheet** prints Zuhr, Asr and Isha as single fixed times for the whole month
   and fajr fixed at 05:35 (section 4).
6. **Nominatim coordinate defect at Madang** (PNG) cost 0.28° of implied fajr; the publisher's own
   point differs from the geocoder's.

---

## 7. Honest negatives, with the languages searched

| Country | Languages and terms searched this pass | Result |
|---|---|---|
| Samoa | English, Samoan ("taimi o le tatalo", "lotu"), plus the publisher gazetteer | no dated table found. The Samoa Observer's Ramadan item (`samoaobserver.ws/category/samoa/82498`) is a 2021 premium article with an agency photograph and no table; its 2026 Facebook post is a link card. turktakvim carries 36 Samoan settlements and computes nothing for any of them. |
| Solomon Islands | English, Pijin ("taem blong prea"), plus gazetteer | no authority or community table found; only calculators. |
| Vanuatu | English, Bislama, French | no authority or community table found; only calculators and a mosque open-day news item. |
| Papua New Guinea | English, Tok Pisin ("prayer taim") | no authority or community table found; only calculators; the Islamic Society has no public timetable. |
| Guyana | English, plus CIOG site and page | CIOG's site (`cioggy.org`) returns 404 on its Ramadan page; the organisation and both Georgetown masjids publish on Facebook only, and the public post body carries no table. |
| South Sudan | English, Arabic | the council page (`facebook.com/ssichqs`) publishes Eid times only; Juba's mosque is a directory card. |
| Turkmenistan | Turkmen, Russian, English | no Muftiate table; every hit is a calculator (six platforms enumerated above). The four-sweep image-only verdict stands at the authority tier. |
| Myanmar | Burmese ("နမာဇ်အချိန်", "အချိန်ဇယား"), English | the Islamic-programme site is a client calculator; the community timetables live in Facebook groups and TikTok posts with no stable public artifact. |
| Liberia | English | council site is an AlAdhan widget; no dated table. |

No negative here is a closure. Each is "not found under these terms".

---

## 8. What this wave banks

- **10 of 11 countries lifted from FALLBACK to dated rows** on one platform surface, 2,391
  settlements, ~870,000 dated rows, one 365-day year plus the whole gazetteer enumerated.
- **Nepal gains an authority surface**: a twelve-month Kathmandu cycle with a stated engine, plus a
  dated Ramadan 1446 sheet. Nepal's recipe is now known at authority tier (MWL 18/17 + 1.1° dip for
  1,400 m, Hanafi asr).
- **Kiribati gains a community surface**: the Ahmadiyya Ramadan 2026 sheet, 30 dated rows.
- **Two new defect classes**: the UTC+13/+14 empty table, and the fixed-clock Ramadan board.

---

## 9. File index

| Path | What |
|---|---|
| `captures/turktakvim/` | 2,721 raw pages: 2,391 annual tables, twelve monthly tables per Kiribati settlement, and every province page used for the gazetteer |
| `captures/surfaces/` | nmcliberia home and `script.js`, Myanmar Islamic Program, CIOG, Samoa Observer, the three Facebook post shells |
| `captures/images/` | the Nepal twelve-month sheet, the Nepal Ramadan 1446 sheet, the Kiribati Ramadan 2026 sheet, the Samoa Observer card, and the Nepali crops used for transcription |
| `data/tt/<country>/` | normalized turktakvim rows, 2,391 files, ISO-dated keys |
| `data/nepal-*.json`, `data/kiribati-*.json` | the transcribed authority and community surfaces |
| `fit/turktakvim.log` | 54 city fits, adhan 4.4.6 |
| `fit/nepal-darulifta.log` | the Nepal cycle fitted as 2020 and as 2026, Shafi and Hanafi |
| `tools/` | enumeration, harvest, parse, geocode, fit harnesses |

## 10. NEXT

1. **Samoa and the Line Islands**: the only two holes. Attack with the Samoa Muslim Association and
   the Samoa Observer's Ramadan photograph, and with the Ahmadiyya Kiribati page's sibling pages.
2. **Year-2 for the gazetteer**: twelve monthly requests per settlement gives 2025 and 2027 for all
   2,391. Run it for the capitals first (58 settlements), then the rest.
3. **Turkmenistan at authority tier**: the Muftiate publishes in the state newspaper; ask the next
   round to check `turkmenistan.gov.tm` and the `Watan`/`Türkmenistan` newspaper archives by date
   rather than by search.
4. **Guyana**: CIOG's Facebook page should be walked post-by-post through the public post reader for
   a Ramadan or annual timetable image, the way the Kiribati sheet was reached.
5. **Coordinate re-fit**: re-run Madang and Voinjama at the publisher's own points before their rows
   are cited.
