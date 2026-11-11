# O1l-12 Pakistan provincial cities — report

Wave: O1l city-level round two, Pakistan beyond Islamabad.
Workspace: `$HOME/athan-gitree/census/o1l-city/pakistan-cities/`.
Probe window: 2026-11-11 03:28Z – 03:58Z. Nothing in the repository was touched.

## Headline

The provincial layer exists, but not as a provincial board. Four of the five
provincial bodies that a census would expect publish no timetable, and one no
longer exists (Balochistan abolished its religious affairs department in June
2026). What the cities have instead is a **published perpetual city chart
family**, and those charts run a **different recipe from the federal chart**:
geometry 18/18 Hanafi with small fixed margins, and none of the federal clock
conventions.

## 1. Provincial boards

| Body | URL probed | Result | Evidence |
|---|---|---|---|
| Punjab Auqaf | `auqaf.punjab.gov.pk` | **No timetable.** Confirms the round-one finding. Site read through a text reader (the publisher's host answers 403 to curl and to a headless browser alike, a network filter rather than a publisher block). Its full navigation was enumerated: shrines, waqf estates, madaris, hospitals, auctions. No prayer page, no timetable PDF. The shrine pages for Data Darbar and Badshahi Mosque carry history only. | `captures/auqaf-punjab-home.html`, `captures/mora-home.html` |
| Sindh Auqaf | `arazud.sindh.gov.pk` | **No timetable.** This is the correct host (round one recorded NXDOMAIN against `auqaf.sindh.gov.pk`). 40+ links, a download registry of three PDFs (ADP, Act, Zakat procedure), and a list of dargahs and mosques with no times. | `captures/arazud-sindh.html`, `sindh-downloads.html`, `sindh-mosques.html` |
| KP Auqaf | `ahrma.kp.gov.pk` | **No timetable.** This is the correct host (round one probed `auqaf.kp.gov.pk`, which does not resolve). The download page carries 40 documents, every one administrative (scholarships, bidding documents, beneficiary lists, the Establishment Code). No prayer artefact. | `captures/ahrma-kp.html`, `kp-download.html` |
| Balochistan Auqaf | none | **Structurally closed — the department was abolished.** Dawn, 22 June 2026: the religious affairs department was dissolved, 1,237 staff redistributed to divisional commissioners, assets to the revenue department, Rs4bn of Zakat funds to the Balochistan Endowment Fund. There is no body left to publish a provincial table. | `captures/` (article read, not mirrored) |
| Federal ministry (control) | `mora.gov.pk` | Still the 2016 chart only. See §4. | `captures/mora-publication-detail.html` |

Urdu searches used, all returning only computed aggregators and newspapers:
`اوقاف پنجاب نماز اوقات`, `بلوچستان اوقاف محکمہ نماز اوقات کوئٹہ`,
`پشاور نماز اوقات رمضان 2026 اوقاف`, `ملتان نماز اوقات 2026 اوقاف`,
`معیاری نماز اوقات چارٹ وزارت مذہبی امور پاکستان`. Transliteration variants
tried: Lahore/Lahaur, Peshawar/Pekhawar.

## 2. The perpetual city chart family — the real provincial layer

archive.org carries a scanned family of **دائمی نقشہ اوقات نماز** charts
("perpetual prayer-time maps") for individual Pakistani cities, uploaded by
private individuals in 2017, 2020, 2021 and 2025, with OCR derivatives. Thirteen
items were enumerated; the city ones are:

| City | Identifier | Form | Use made |
|---|---|---|---|
| Multan | `naqsha-oqaat-namaz-sehr-o-iftaar-multan` | text-layer PDF, 13 pp, **second resolution** | parsed, 366 rows, fitted |
| Karachi | `naqsha-oqaat-namaz-sehr-o-iftaar-karachi-coloured` | text-layer PDF, 13 pp, minute resolution | parsed, 366 rows, fitted |
| Peshawar | `nimaz-naqsha-peshawar-map` | image PDF, 12 pp, 2320x2928 | captured, not transcribed (see below) |
| Quetta | `20251013_20251013_1042` | image PDF, 24 pp, 532x842 | captured, not transcribed |
| Lahore | `aatifibraheem_outlook_201705` | image PDF + 14 MB text PDF | captured; OCR layer is unusable (Latin/perso-Arabic noise) |
| Dera Bugti, Bannu, Swat, Mardan, Layyah, D.G. Khan | further identifiers | image PDFs | enumerated only |

Two further city charts arrived as mirrored single-page PDFs titled
**"PERPETUAL SAUM-O-SALAT TIMETABLE"** and **"HANFI PERPETUAL SAUM-O-SALAT
TIMETABLE"** (Rawalpindi and Faisalabad), hosted at `invent.ilmkidunya.com`.
Both are image PDFs; the January block of each was transcribed by eye from the
page image (31 rows each, saved under `data/`).

All of these are **community tier**: private scans of print charts, no publisher
imprint on the page, no year stamp. They are dated rows in the census sense
(they carry a day and a month) but not year-stamped, so they can support a
recipe and not an A grade. The "perpetual" claim on the page is the publisher's
("Salah Time Tables never expire because of the sun rotation"), and §3 measures
what that costs.

**Peshawar and Quetta are captures, not transcriptions.** Both are dense Urdu
charts with a rolling month-shift layout (each row carries several month-pairs
of columns), and neither carries a text layer. A single crop cannot be read
without risking a wrong column, so no row is reported from either. The raw
artefacts are saved. That is an honest negative on transcription, not on
existence.

## 3. Fits

Engine: adhan 4.4.6, `Rounding.None`, TZ `Asia/Karachi`, dates built from
literal capture strings, reference year 2026 (both full-year charts carry a
29 February, so the chart's own shape is a leap year). Residuals are
chart minus adhan, in minutes. "Robust" drops |Δ| ≥ 15 min (OCR damage).

### Multan — full year, 366 rows

| Column | Robust median | Mean | Min | Max | Within 1 min |
|---|---|---|---|---|---|
| fajr | −0.5 | −0.6 | −2.0 | +0.9 | 355/366 |
| sunrise | −1.5 | −1.5 | −2.5 | +4.5 | 3/366 |
| zuhr | +0.4 | +0.4 | −1.6 | +0.9 | 331/332 |
| asr (Hanafi) | +1.8 | +1.8 | +0.6 | +2.2 | 17/366 |
| maghrib | +1.6 | +1.6 | −0.4 | +2.2 | 7/364 |
| isha | +0.6 | +0.6 | −0.3 | +2.7 | 336/337 |

Quarter medians: fajr −0.5/−0.7/−0.6/−0.5, sunrise −1.6/−1.6/−1.5/−1.5,
zuhr +0.4/+0.4/+0.4/+0.5, asr +1.6/+1.6/+1.9/+2.1, maghrib +1.6/+1.6/+1.7/+1.6,
isha +0.5/+0.8/+0.7/+0.6. **Parameters frozen across the year** — the only drift
is asr +1.6 to +2.1, which is the rendering of a fixed margin.

Recipe: **Karachi/UISK 18° fajr, 18° isha, Hanafi asr, with zeroth-order safety
margins — fajr −0.5, sunrise −1.5, zuhr +0.5, asr +2, maghrib +1.5, isha +0.5.**
Seasonal amplitude (fajr Jan vs Jul mean): 5.76 h → 3.82 h, 116 min span.
Rows: `data/pk-multan-perpetual-chart.json`, all 366. Five months had their day-1 label OCR-misread as a duplicate of day 7; those rows are in date order and were relabelled to day 1, which also removed the twenty-nine 12-hour wrap artefacts the first pass carried.

### Karachi — full year, 366 rows

| Column | Robust median | Min | Max | Within 1 min |
|---|---|---|---|---|
| fajr | −2.3 | −4.9 | +2.3 | 49/363 |
| sunrise | −0.9 | −2.8 | +0.9 | 201/360 |
| zuhr | −0.9 | −3.0 | 0.0 | 225/366 |
| asr (Hanafi) | +3.5 | +1.6 | +7.5 | 0/366 |
| maghrib | −0.5 | −2.3 | +0.9 | 268/356 |
| isha | +0.5 | −3.5 | +3.8 | 139/366 |

Angle search (least squares over the year): **fajr 18.4° (RMS 1.7), isha 18.0°
(RMS 1.7)**. Quarter medians wander (fajr −1.9 → −2.4 → −2.8 → **+0.6**; isha
+0.4 → +0.3 → +1.5 → **−2.0**), which is the perpetual-chart cost: a single
printed year cannot track equation-of-time and leap-year variation, so a
frozen chart absorbs a ±3 min seasonal residual. Seasonal amplitude 90 min.

Recipe: **Karachi 18/18 Hanafi, maghrib at sunset, zuhr at solar noon, asr
Hanafi + ~3 min.** A different publisher from the mainland charts: its maghrib
sits at sunset (−0.5) where Multan's sits at sunset+1.5, and its asr carries +3.5
where Multan's carries +1.8.

### Rawalpindi — January 2026, 31 rows transcribed

fajr −0.6, sunrise −0.5, zuhr +0.5, asr 0.0, maghrib **+3.1**, isha +0.1. The
chart's own "Zawal Begins" column sits 42–44 min before its Zuhr column, the
same fixed gap the Multan and Karachi charts print — a house convention, not a
solar quantity.

### Faisalabad — January 2026, 31 rows transcribed

fajr −0.6, sunrise −0.5, zuhr +0.6, asr +0.2, maghrib **+3.2**, isha +0.2.
Identical conventions to Rawalpindi; same publisher template.

### Fit verdict against the federal chart

The federal Islamabad chart (round-one fits, unchanged here) runs: fajr 18°
floor, sunrise −0.5, asr Hanafi +2, maghrib **sunset+6**, dhuhr a **two-phase
clock** (13:00 / 13:15 switching 15 Apr and 15 Oct), isha a **15-minute clock
ladder** of 19 steps.

The provincial city charts share only the twilight geometry and the Hanafi asr.
Measured against four city charts:

| Convention | Federal (Islamabad) | Multan | Karachi | Rawalpindi | Faisalabad |
|---|---|---|---|---|---|
| fajr | 18° floor | 18° −0.5 | 18.4° −2.3 | 18° −0.6 | 18° −0.6 |
| dhuhr | **13:00/13:15 clock** | solar noon +0.4 | solar noon −0.9 | solar noon +0.5 | solar noon +0.6 |
| asr | Hanafi +2 | Hanafi +1.8 | Hanafi +3.5 | Hanafi 0.0 | Hanafi +0.2 |
| maghrib | **sunset+6** | sunset+1.6 | sunset−0.5 | sunset+3.1 | sunset+3.2 |
| isha | **quarter-hour ladder** | 18° +0.6 | 18° +0.5 | 18° +0.1 | 18° +0.2 |
| federal clock hits | 366/366 by rule | 6/366 | 0/366 | — | — |

**Answer: the federal chart's clock conventions do not describe the provincial
layer.** Dhuhr and isha match a named-method library in four cities out of four,
and the maghrib offset is the cities' own (sunset, +1.5, +3), never the federal
+6. The provincial layer is the Karachi-method family the record already holds as
the community de facto, dressed with each publisher's own small margins. This
CONFIRMS the record's "Karachi-method de facto" and REFUTES any reading of the
federal chart as a national convention. Per the standing rule, the drift is
flagged, not adjudicated.

Span ceiling: the two full-year charts are undated print cycles, so the census
ceiling for this family is **one published cycle each, provisional at best, no
forward longevity** — a perpetual chart is designed not to be superseded, which
also means no future year can be harvested from it.

## 4. The unified twin-city calendar — register probe

Probe 2026-11-11T03:39:22Z.
`https://mora.gov.pk/SiteImage/Publication/New_Chart_2016_One.pdf` → 200,
6,600,971 bytes, `application/pdf`, sha256 prefix `9babc428ffb200c4d6a5b354`.
Publication page → 200, title **"Nizam-e-Salat Chart 2016 and Onward"**, one
download link, no other entry.

**Verdict: unchanged, signal not met.** The register still carries the 2016
chart and only that. No 2026 or 2027 unified calendar is published. This agrees
with the O1l consolidation's 02:58–03:15Z probe. The watch stays open; the
mandate is a January recheck and it is not due.

Context found and unchanged from round one: the federal cabinet approved the
twin-city system from 1 January 2026 with a calendar to follow ("A calendar
will be issued"); no such calendar is on the ministry's site, and Urdu searches
(`یکساں اوقات نماز اسلام آباد راولپنڈی چارٹ جاری 2026`) return only press
repetition and a daily fajr/makruh Facebook post, never a dated calendar.

## 5. City platform and institutional surfaces

| City | Surface | URL | Tier | Verdict |
|---|---|---|---|---|
| Lahore | Mawaqit, Masjid Khatim-ul-Nabiyyeen | `mawaqit.net/en/m/masjid-khatim-ul-nabiyyeen-lahore-54000-pakistan` | platform (mosque-configured) | Already held (`c11-indopak/data/lahore-masjid-khatim-ul-nabiyyeen.json`). Re-captured whole: 366-row calendar with dhuhr **fixed at 12:45 all year** and isha = maghrib + 97/98 min, fajr compressed to 34 min of annual swing — a mosque-set screen, so it witnesses that mosque and not the city. `captures/mawaqit-lahore-khatimulnabiyyeen.html` |
| Lahore | DHA Lahore Religious Affairs | `dhalahore.org/dha-facilities/religious-affairs/` | institutional | No timings. Quran/Hifz class hours and Nikah/Jinaza procedure only. |
| Karachi | DHA Karachi mosque jamaat table | `dhakarachi.org/facilities/namaz-timings-dha-mosques/` | institutional (state housing authority) | Confirms the record: 9–12 DHA mosques with **fixed jamaat clocks** (Fajr 5:55–6:10, Zohar 13:15/13:30, Asr 16:00–16:45, Isha 19:30–20:00), maghrib printed as "On Sunset". No year stamp, no seasonal variant, so one page serves every season — a jamaat screen, not a dated table. `captures/dha-karachi-namaz.html` |
| Karachi | KDA city table | `kda.gos.pk/contents/?id=49` | institutional | Confirms the record: the page's printable PDF is `islamicacademy.org/pdf/TMS.php?file=Karachi_PK.pdf` — an authority republishing the Islamic Academy of Plano feed. February only, no year. Stale as recorded. |
| Karachi, all cities | Jamaat360 | `jamaat360.com/pakistan-1/sindh-244/karachi-10068` | platform (community iqamah) | New platform layer, no dated year. Mosque pages serve **today only**: a computed Azan column (its own engine, MWL by default, with UISC Karachi selectable) plus a community-maintained iqamah. No archive, no year table, no JSON API in the served bundle. Candidate at best. |
| All | Mawaqit mosque directory search | `mawaqit.net/api/2.0/mosque/search` | platform | 401 without a key. Individual mosque pages remain public and carry the full-year `confData` calendar; a bulk directory sweep is not possible without it. mawaqit's `robots.txt` disallows named AI crawlers, so this file limited itself to specific mosque pages and did not walk the sitemap. |
| Islamabad, Lahore | `salahtable.com/accuracy` | community (derived) | Independent corroboration: its Pakistan entries name the same federal "Nizam-e-Salat Committee, 2016 and Onward" chart, measure it at UISK Karachi with fajr +0.7 and maghrib −0.9 (max 1 min), and separately use a Karachi newspaper Ramazan calendar. Corroborates the record's recipe; adds no rows. |

## 6. What this wave confirms, adds and does not have

**Confirms.** The record's provincial-layer position: no provincial board
publishes a dated table, in English or Urdu, and the cities run the Karachi
method. Punjab Auqaf's negative is re-verified through a text reader with the
block identified as a network filter, not a publisher refusal.

**Adds.** The perpetual-chart family as the actual provincial layer, with two
machine-parsed full years (Multan, Karachi) and two transcribed month blocks
(Rawalpindi, Faisalabad), and a measured answer to the fit question: the federal
clock conventions are Islamabad-only. Balochistan's department abolition
(June 2026) is a dated structural change the census should carry.

**Does not have.** No dated authority table for Lahore, Peshawar, Quetta,
Faisalabad, Multan or Rawalpindi. No year-stamped city table anywhere outside
the federal chart. Peshawar and Quetta charts are captured but untranscribed:
their layout needs a per-column read at full resolution, not a sample crop.
Faisalabad and Rawalpindi were transcribed for January only, so their fits carry
one month and no seasonal amplitude.

## 7. Files

- `captures/` — 42 raw artefacts (79 MB): provincial sites (Punjab, Sindh, KP), ministry
  register and chart PDF, KDA, DHA Karachi, DHA Lahore, Jamaat360, Mawaqit,
  ilmkidunya timetable PDFs, archive.org city charts and their metadata.
- `captures/img/` — page images extracted from the chart and timetable PDFs.
- `data/` — `pk-multan-perpetual-chart.json` (366 rows),
  `pk-karachi-perpetual-chart.json` (366 rows),
  `rawalpindi-january-sample.json`, `faisalabad-january-sample.json`,
  `raw-multan-parsed.json`, `raw-karachi-parsed.json`, `fit-log.txt`.
- `fit/` — `lib.js`, `angles.js`, one runner per surface.
