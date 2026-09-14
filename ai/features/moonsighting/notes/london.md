# London: how the Unified Prayer Timetable is built, and how exactly it can be replicated

Researcher notes, 2026-09-14. This file supersedes the earlier version of itself.
- Research only.
- Every number comes from a named file or URL, or from a script under `~/athan-research/london/`.
- Δ = published minus rule, in minutes. "Exact" means the minute is equal.
- Framing: matching the moonsighting method to London is a **sanity check**, not a claim about accuracy anywhere else.

---

## 0. Answer in one page

**Source identity is PROVEN for 2026** (`data/source_identity_2026.txt`). All three copies below agree on 365/365 days × 12 fields = 4,380/4,380 cells, with 0 differences:
- the London Prayer Times API year (`london/lpt-2026.json`);
- East London Mosque's 2026 timetable PDF;
- the timetable table embedded in ELM's website page.

The app's own fixture rows (`nightTimes.test.ts`, 13 days of 2026) also equal the API.

**What London ships (2022 to today) is the moonsighting.com base with two things replaced:**

| Prayer | Rule | 2026 exact vs API |
|---|---|---|
| **Sunrise** | computed sunrise **− 3 min** | 359/365 (computed) |
| **Dhuhr** | noon + 5 (same as the moonsighting base) | 362/365 (computed) |
| **Asr** (API `asr`) | Mithl 1 (Shafi'i), same as base `asr_s` | 353/365 (computed) |
| **Asr** (API `asr_2`) | Mithl 2 (Hanafi), same as base `asr_h` | 356/365 (computed) |
| **Maghrib** | sunset + 3 (same as the moonsighting base) | 360/365 (computed) |
| **Fajr** | **(sunrise + 3) − Hizbul Ulama Table 5 interval** | **365/365** chained on API sunrise; 359/365 fully computed (misses = sunrise's) |
| **Isha** | **(Maghrib − 3) + Hizbul Ulama Table 6 interval, with 21 London-edited slots** | **365/365** chained on API Maghrib; 360/365 fully computed (misses = Maghrib's) |

1. **Replacement 1: Fajr and Isha.** Both drop moonsighting.com's latitude-and-season function. They come from the 1987–88 Blackburn observation chart, applied to London's own sunrise and sunset:
   - Tables 5 and 6 of Y.A. Miftahi, *Fajar and Isha*.
   - Fajr: exact on **3,653/3,653** days, over 2015, 2017–2022 and 2024–2026.
   - Isha: the chart plus 21 London-edited slots.
   - The moonsighting.com function itself matches only 35–43 Fajr days and 5–11 Isha days per year.
2. **Replacement 2: sunrise −3 minutes.** This is Hizbul Ulama's 2009 advice. ELM states it: "3 minutes taken off for safety".
3. **Kept as base:** Dhuhr (+5), Maghrib (+3), and both Asr.

**Zero-unexplained-minutes status for 2026:**
- The chart rules explain **every** Fajr and Isha minute.
- The sun-based minutes miss on **3–12 days per prayer**. Every miss has the computed event within **0.06 min (under 4 s)** of a rounding boundary.
- The ELM text says those times come from HMNAO, whose algorithm is not public. The HMNAO Websurf service at astro.ukho.gov.uk returns 503.
- No model tested reproduces those boundary days. §3.3 lists the models; §3.2 lists every miss.

**The rule changed over time:**
- **Era A (2012–2014):** no −3 on sunrise; Fajr ≈ moonsighting function; Isha matches nothing tested.
- **Era B1 (2015–2021):** chart Fajr/Isha as above; sun computed at about **51°30′ N, 0°07.65′ W** (grid optimum −0.1275°).
- **Era B2 (2022–2026):** identical chart rules; sun computed at **51°30′ N, 0°10′ W**.
- **June edit:** Isha 16–19 Jun gained +1 in 2025–2026 (and on 16 Jun in 2020).

---

## 1. Data used (all read in full; see §8)

| Year | Source | Days | Identity to API |
|---|---|---|---|
| 2026 | `london/lpt-2026.json`: London Prayer Times API, fetched 2026-09-14T04:45Z by the lead with the owner's key (not stored; `lpt-2026.meta.json`) | 365 | reference |
| 2026 | ELM timetable PDF, https://www.eastlondonmosque.org.uk/Handlers/Download.ashx?IDMF=0a9e5418-6204-4d81-a374-9b7836148e2d (fetched 2026-09-14) → `data/elm_timetable_2026.json` | 365 | 4,380/4,380 cells identical |
| 2026 | Table embedded in https://www.eastlondonmosque.org.uk/prayer-times and in /prayer-times-and-calendar-explained (fetched 2026-09-14) → `data/elm_web_explainer_embedded_2026.json` | 365 | 4,380/4,380 identical |
| 2025 | ELM PDF IDMF=d276cafe-1b4c-4e6e-bb67-834cd842c129 (live) → `data/elm_timetable_2025.json` | 365 | UNVERIFIED vs API (no API 2025) |
| 2024 | App repo `mocks/full.ts`: a single-line JSON API dump, first committed as `mocks/data_full.ts` in c78c36e (2024-11-16) → `data/upttl_2024_fullts.json` | 366 | is API output |
| 2022, 2021, 2020 | ELM PDFs, IDMF 43e400b2-10a1-4cbd-9ddd-a43d120ad8fd, cf70f27e-e215-45e4-b6ab-5d07ea82f8c4, 412cad42-a836-45e8-b6b3-3c2644612b0f (links found in Wayback copies of /prayer-times, files still live; `london/elm/downloads.tsv`) | 365, 365, 366 | UNVERIFIED vs API |
| 2019 | ELM PDF IDMF 60663843-9a7d-44d7-b1f9-05d2d742125d (live) | 365 | UNVERIFIED vs API |
| 2012–2015, 2017, 2018 | ELM PDFs via Wayback `id_` captures (log `london/elm/wayback_downloads.tsv`) | full years | UNVERIFIED vs API |
| 2016 | ELM PDF: both Wayback captures parse as 0 pages | none | not used |
| 2012–2019 | 29 dated snapshots of the londonprayertimes.com home page (Wayback, `london/wayback_lpt/`) | single days | spot-checks only |

Other points:
- **Leap years:** handled normally. The 29 Feb slot gives F = 100 and I = 89 in both 2020 and 2024. Table 5 carries 1-40 there; Table 6 prints 1-29 for 29 Feb.
- **Finding 43 ("21 June Fajr 02:43, Magrib 21:21"):** these are not API values. The 2026 API gives 21 Jun Fajr 02:40 and Magrib 21:25; the 2024 API dump gives the same.
  - 02:43 equals the moonsighting m0 Fajr for that date.
  - 21:21 is the hand-written example in `mocks/timing-system-schema.ts` (lines 160–161 and 204; history back to 8a0f590, 2026-01-18). It also happens to equal the theoretical sunset truncated (21:21:35–47).
  - Finding 43 was added in commit 9ca0b25 (2026-09-12).
- **Asr labels in the app are reversed.** `~/athan-research-wt/shared/types.ts` lines 25–28 call `asr` Hanafi and `asr_2` Shafi. The data shows `asr` = Mithl 1 (Shafi'i), because it equals ELM's "1 Mithl" column on every day. `asr_2` = Mithl 2 (Hanafi). **The app displays the Shafi'i time.**

---

## 2. Fajr and Isha: the chart (the core London modification)

### 2.1 The chart and why
Primary source: Y.A. Miftahi, *Fajar and Isha*, Hizbul Ulama UK.
- PDF "Fajar&IshainBritain", created 2006-12-07.
- URL: moonsighting.com/articles/fajr&isha-yam.pdf, Wayback capture 20070410171730.
- Local copy: `~/athan-research/pdfs/wayback/articles__fajr&isha-yam.pdf`.

Tables:
- **Table 5**, "TIME TABLE OF SUBHA SADIQ IN UK": book p. 117 = pdf page 118.
- **Table 6**, "TIME TABLE OF ISHA IN UK": book p. 118 = pdf page 119.

Book p. 116 gives the method:
> "To fix the time of Subha Sadiq for your city, look at the Sunrise time for your city and deduct the time shown on the chart for that day … To fix the time of Isha for your city, look at the Sunset time for your city and add the time shown on the chart for that day."

**Transcription** (`data/miftahi_tables_5_6_image_transcription.json`; code form `london/miftahi_tables.py`):
- Read by eye at 170 dpi (`london/miftahi/book_pdfp118.png`, `…119.png`).
- Independently re-read at 300 dpi (`london/tables_mine/table{5,6}_{top,bottom}_300.png`).
- The two readings are identical. The PDF text layer was **not** used.
- "-" means carry forward the last printed value in that month's column. This reading fits the data: Fajr is exact on 3,653/3,653 days, and Isha is exact on every slot except the 21 edits.
- The following cells are printed and are recorded exactly as printed:
  - Table 6 May: 1-08 (1st), 1-05 (2nd), 1-00 (4th), 1-05 (7th), 1-08 (9th), 1-10 (11th). This is a real printed dip, not a transcription error.
  - Table 6 April row 31: "1-10".
  - Table 5 June row 31: "1-59".
  - Table 6 row 29 of February: "1-29".

Why the chart has this shape — Hizbul Ulama, "Why our fasting times and timetable are not wrong" (Y.A. Miftahi, 19 August 2011 / 19 Ramadan 1432). Source: http://www.hizbululama.org.uk/articles/english/Why_our_fasting_times_are_not_wrong.pdf, fetched 2026-09-14, read in full.
> "It was agreed at this meeting [2 January 1989] to use First Light times generally for Subha Sadiq but to use Tabayyun times (spreading of light) during summer months. It was also agreed to use Shafaqe Abyadh (disappearance of whiteness) for Isha generally but to use Shafaqe Ahmer (disappearance of red after glow) during summer due to haraj (hardship). Phasing of times to get to one method to the other was agreed for both Subha and Isha. Accordingly, a chart based on the agreement of the Ulama was distributed to UK Masajids."

> "This timetable, based on the observations in Blackburn, from September 1987 to August 1988 yielded 98 successful observations … These observations were used to construct a timetable for a full year which can be applied to all parts of the UK using the gaps in twilight length determined by the observations."

The same article records London's adoption:
> "…this timetable, just before Ramadan, accepted by key London Umbrella Organisations and Masajid comprising at least 36 organisations including the Islamic Cultural Centre & London Central Mosque (ICC), Mayfair Islamic Centre, East London Mosque, … This decision came on the back of an initial meeting hosted by ICC at Regents Park, London, on Thursday 25th March 2010 … an Ijma (consensus) was reached by these organisations to adopt this timetable just before Ramadan 1432 (July 2011)."

ELM's explainer states the London application:
- https://www.eastlondonmosque.org.uk/prayer-times-and-calendar-explained, "Published: 22nd June, 2018; Updated: 3rd July, 2026; Author: Usamah Ward", fetched 2026-09-14, read in full.
> "Fajr … The daybreak time is based on the work of Hizbul Ulama. The sunrise time is taken from His Majesty's Nautical Almanac Office (HMNAO), with 3 minutes taken off for safety to allow coverage of the whole M25 region."

> "Zuhr … taken from HMNAO, with 5 minutes added"

> "‘Asr … Mithl 1 and Mithl 2 … taken from HMNAO"

> "Maghrib … taken from HMNAO, with 3 minutes added for safety"

> "‘Ishā … based on the work of Hizbul Ulama."

- Noor Ul Islam (https://www.noorulislam.org.uk/prayer-times-explained/, datePublished 2020-12-07, modified 2025-10-28, read in full) repeats these rules for the same London Unified Prayer Timetable.
- The ICC page (https://www.iccuk.org/page.php?section=media&page=unifiedpt, "July 2012", read in full) carries the adoption announcement, with no rules.

### 2.2 The rule, the fit, and the London edits (`interval_table.py`, `data/london_interval_table.{json,txt}`)
Definitions:
- F = (published sunrise + 3) − published Fajr
- I = published Isha − (published Maghrib − 3)

Computed for every calendar slot in every era-B year: 2015, 2017, 2018, 2019, 2020, 2021, 2022, 2024, 2025, 2026.
- **Fajr:** F equals Table 5 on **every slot in every year**. There are 0 disagreements over 3,653 days.
- **Isha:** I equals Table 6 except in these 21 slots. The notation "value: years" gives the value used and the years using it.

| Slot | Table 6 (book) | London value, by year |
|---|---|---|
| 02-01 | 98 (1-38) | 99: all 10 years |
| 03-31 | 80 | 80: 9 years; **79: 2020 only** |
| 04-29, 04-30 | 73 (1-13) | 74: all years |
| 05-01 | 68 (1-08) | 74: all years |
| 05-02, 05-03 | 65 (1-05) | 74: all years |
| 05-04, 05-05, 05-06 | 60 (1-00) | 74: all years |
| 05-07, 05-08 | 65 | 74: all years |
| 05-09, 05-10 | 68 | 74: all years |
| 05-11, 05-12 | 70 (1-10) | 74: all years |
| 06-16 | 83 (1-23) | 83: 2015, 2017–2019, 2021, 2022, 2024; **84: 2020, 2025, 2026** |
| 06-17 | 83 | 83: 2015–2024 years; **84: 2025, 2026** |
| 06-18, 06-19 | 82 (1-22) | 82: 2015–2024 years; **83: 2025, 2026** |
| 11-29 | 100 (1-40) | 99: all years |

Reading the edits:
- **The 29 Apr–12 May flat 1-14 removes the book's early-May dip to 1-00.** That dip is the printed Abyad→Ahmar phasing. London holds 1-14 until the chart climbs back to 1-13 on 13 May.
- **1 Feb and 29 Nov** each shift a chart step by one day.
- **16–19 Jun** changed in the 2025 timetable (ELM PDF created 2024-11-25) and persists in 2026.
- **No documented basis was found** for any edit. I searched:
  - all prose in every ELM timetable/calendar PDF 2012–2026 (`london/elm/prose_lines_all_elm_pdfs.txt`, read in full);
  - the ELM explainer and prayer-times pages (read in full);
  - Noor Ul Islam;
  - ICC;
  - HU `Prayer_times.pdf`, `Unified.pdf` and `Why_our_fasting_times…pdf`;
  - moonsighting.com `faq_pt.html` and `how-we.html` (read in full).

  The ELM timetables say only "Based on the London Unified Prayer Timetable. Explanation of prayer times is on our website."

  Miftahi book p. 114 mentions software by Mohammed Arshad Baig that "automatically works out the times of Subha Sadiq if you enter the time of sunrise … and the time of Isha if you enter the time of sunset". That software might be where the edits come from. UNVERIFIED.

**Deliverable table:** `data/london_intervals_final.json`. It has 366 slots:
- `fajr_interval` (Table 5, no edits);
- `isha_interval_2026` (Table 6 + the edits above, 2025–2026 version);
- `isha_interval_2015_2024`;
- per-year values.

Checked: 0 Fajr disagreements; 0 disagreements between `isha_interval_2026` and the API.

### 2.3 Against the moonsighting.com Fajr/Isha (the base) — `rules.py`, `data/rules_summary.txt`
Base endpoint at the HU point (`endpoint/moonsighting.ahmedbukhamsin.sa_hulondon_<year>_m<m>.json`, fetched 2026-09-14):

| Rule, exact days | 2015 | 2017 | 2018 | 2019 | 2024 | 2025 | 2026 |
|---|---|---|---|---|---|---|---|
| Fajr = base m0 Fajr | 43 | 37 | 37 | 40 | 36 | 35 | 40 |
| Isha = base m0 (General) | 5 | 6 | 7 | 7 | 11 | 5 | 5 |
| Isha = base m1 (Abyad) | 16 | 19 | 13 | – | 8 | 18 | 9 |
| Isha = base m2 (Ahmar) | 5 | 5 | 6 | – | 10 | 6 | 7 |

London's Fajr and Isha therefore do not come from the moonsighting.com function in any method. The base's Fajr Δ spans −7..+6 over the year.

The Hizbul Ulama city directory that Shaukat computed (2006 and 2009 editions) is not the source either.
- UPTTL minus HU London: Fajr −9..+7, Isha −8..+8 (`data/analyze_hu.txt`).
- That directory equals the 2007 base endpoint (Fajr/sunrise/Zuhr/Maghrib 0 on 249–339 days). Its Isha is base General + 3 on 288 days.

---

## 3. The sun-based prayers

### 3.1 Rules and fit (`replicate_final_2026.py`, `data/replicate_final_2026.txt`, `data/fit_era_coords.txt`)
- **Sun calculation:** `solar.py` (NOAA/Meeus), iterated at each event instant.
- **Point:** 51°30′ N, 0°10′ W, the Hizbul Ulama "LONDON" header.
- **Horizon:** altitude −0.8333° for sunrise and sunset.
- **Asr:** shadow = k + cot(refracted noon altitude), with the target treated as an apparent altitude (Bennett refraction). Asr without refraction scores far lower: 296/342 in 2026 (`data/fit_convention.txt`).
- **Rounding:** round to nearest.

| Prayer | Rule | 2026 | 2025 | 2024 | 2022 |
|---|---|---|---|---|---|
| Sunrise | round(sunrise) − 3 | 359 | 360 | 362 | 356 |
| Dhuhr | round(transit + 5) | 362 | 360 | 355 | 359 |
| Asr (Mithl 1) | round(Asr1) | 353 | 356 | 362 | 356 |
| Asr (Mithl 2) | round(Asr2) | 356 | 357 | 355 | 353 |
| Maghrib | round(sunset + 3) | 360 | 360 | 361 | 356 |

The moonsighting base endpoint at the same point scores lower for these prayers in 2026:
- sunrise − 3: 338
- Dhuhr: 361
- asr_s: 250
- asr_h: 207
- Maghrib: 340

It also scores lower at generic London 51.5072, −0.1276: sunrise 316, Dhuhr 309, Maghrib 306.

### 3.2 Every 2026 miss (Δ = API − rule; f = fraction of the computed minute)
- **Sunrise (6):** 01-31 −1 (f 0.517), 02-14 −1 (0.526), 06-02 −1 (0.500), 10-15 +1 (0.494), 10-26 +1 (0.466), 10-30 +1 (0.486). Fajr [fully computed] inherits exactly these six.
- **Dhuhr (3):** 01-23 −1 (0.506), 08-26 +1 (0.493), 10-27 +1 (0.491).
- **Asr Mithl 1 (12):** 01-22 −1 (0.549), 02-14 −1 (0.529), 03-01 −1 (0.520), 04-22 −1 (0.510), 05-22 −1 (0.506), 06-01 −1 (0.535), 06-08 −1 (0.517), 06-28 −1 (0.512), 09-12 −1 (0.536), 09-22 −1 (0.516), 09-28 −1 (0.510), 11-11 +1 (0.442).
- **Asr Mithl 2 (9):** 02-10 −1 (0.560), 05-13 −1 (0.501), 06-06 −1 (0.501), 08-11 +1 (0.494), 08-21 +1 (0.486), 11-03 +1 (0.498), 11-17 +1 (0.498), 12-02 +1 (0.486), 12-25 −1 (0.525).
- **Maghrib (5):** 01-30 −1 (0.526), 06-03 −1 (0.517), 06-04 −1 (0.504), 10-15 +1 (0.496), 10-31 +1 (0.484). Isha [fully computed] inherits exactly these five.

What the misses have in common:
- **Every miss is a rounding-boundary day.** The computed time lies within 0.06 min (3.6 s) of hh:mm:30.
- **The sign follows the season.** HMNAO is earlier January–June and later August–December, for all events alike. That is an equation-of-time-like difference of about ±3 s between HMNAO's ephemeris and ours.

### 3.3 Models tested to close those days (none reaches 365/365)
All scripts are in `london/`; outputs are in `data/`.

| Model | Best 2026 result | Script |
|---|---|---|
| Point grid: lat 51.40–51.60 × lon −0.27..−0.07 at 0.005°; horizon −0.8167..−0.8667°; ±0.15 min bias. Fit on 2024+2025, validated on 2026 | sunrise 358, Maghrib 361, Dhuhr 359 | `fine_solar.py` |
| JPL DE421 ephemeris (skyfield 1.x in `london/.venv-sky`), exact bisection | sunrise 358, Dhuhr 362, Maghrib 352, Asr 357/357 | `sky_events.py` |
| Astronomical Almanac low-precision Sun (UT and TT) | sunrise 357, Dhuhr 363, Maghrib 360, Asr 352/358 | `fit_aa_lowprec.py` |
| Single-pass sun position (noon, 0h UT, 12h UT) | Dhuhr 362, sunrise 246 | `fit_convention.py` |
| Smooth annual time offset (sinusoid, global or per prayer), fitted on 2024–2026 | best 363/365 per prayer; 1,798/1,825 global | `fit_eot_offset.py` |
| Rounding threshold floor(t + r), r in 0..1 | r = 0.50 best for 2022–2026 | `fit_round_threshold.py` |

**Conclusion.** Replicating the last 3–12 sun-based minutes per prayer needs HMNAO's own computation. The alternative is to accept ±1 on those boundary days. This is a limit of the published rounding, not an unexplained rule.

- **HMNAO Websurf:** its "Islamic Prayer Times" service sits behind a conditions form.
  - Wayback copy of http://astro.ukho.gov.uk/psp/index_beta.html (20170314) saved at `london/hmnao/psp_index_beta_wb20170314.html`.
  - The live page returned HTTP 503 on 2026-09-14.
  - Its terms say "for personal use only and may not be provided to third parties".

### 3.4 The coordinate changed in 2022 (`fit_era_coords.py`, `data/fit_era_coords.txt`)
Round to nearest, exact matches out of 365/366. Columns: sunrise / Dhuhr / Maghrib / Asr1 / Asr2.

| Year | HU 51.5, −0.16667 | 51.5, −0.1278 |
|---|---|---|
| 2015 | 326 / 315 / 307 / 309 / 303 | **360 / 359 / 358 / 351 / 362** |
| 2017 | 313 / 312 / 302 / 303 / 311 | **359 / 359 / 359 / 355 / 358** |
| 2018 | 307 / 318 / 307 / 313 / 312 | **362 / 360 / 357 / 358 / 356** |
| 2019 | 310 / 313 / 305 / 305 / 305 | **358 / 362 / 358 / 351 / 360** |
| 2020 | 310 / 309 / 309 / 300 / 317 | **360 / 361 / 355 / 351 / 360** |
| 2021 | 311 / 314 / 303 / 308 / 309 | **364 / 355 / 358 / 356 / 357** |
| 2022 | **356 / 359 / 356 / 356 / 353** | 314 / 322 / 315 / 320 / 318 |
| 2024 | **362 / 355 / 361 / 362 / 355** | 304 / 315 / 317 / 307 / 327 |
| 2025 | **360 / 360 / 360 / 356 / 357** | 306 / 314 / 301 / 313 / 320 |
| 2026 | **359 / 362 / 360 / 353 / 356** | 309 / 317 / 309 / 316 / 311 |

Grid optimum on sunrise + Maghrib + Dhuhr (lat step 0.0025°, lon step 0.0025°):
- **2015–2021:** 51.5000, −0.1275 (6,463/6,573).
- **2022–2026:** 51.5000, −0.1650 (4,315/4,383).

The Fajr/Isha interval rules were unchanged across that switch (§2.2).

### 3.5 Era A (2012–2014, the timetable at adoption)
- 2013 and 2014 are identical in GMT on every column (365/365, `data/era_a_analysis.txt`).
- Sunrise has no −3 (2014: 352/365 against round(sunrise)).
- Fajr ≈ base m0 (2014: 340/365).
- Isha matches none of m0/m1/m2, base + 3, HU London or Table 6 (≤ 52/366). Its intervals reach 103 min on 20 Jun (today 79).
- Best coordinate fit for era A is poor (2,389/3,288 at 51.4975, −0.17).
- The switch to era B happened between 20 Dec 2014 (`wayback_lpt/lpt_20141220051455.html`) and 9 Jan 2015 (`…20150109110749.html`). The ELM 2015 PDF was created 2014-10-17.
- No announcement of the switch was found (ELM news CDX, Oct 2014 – Dec 2015). UNVERIFIED who decided it, or why.

---

## 4. Jamaah fields (ELM's own; API 2026)
- `fajr_jamat` = fajr + 20: 365/365.
- `magrib_jamat` = magrib + 7 on 335 days, and + 15 on 30 days (2026-02-18 … 2026-03-19, Ramadan). ELM: "7 minutes after the start time (15 minutes in Ramadān)".
- `dhuhr_jamat`, `asr_jamat` and `isha_jamat` are set by ELM:
  - Zuhr 12:45 in GMT and 13:30 in BST, with Fridays differing;
  - Asr "about 15 to 30 minutes after Mithl 2";
  - Isha "never before 7.30pm throughout the winter months".
- They are not derived from any rule here.

---

## 5. What an implementation needs to reproduce London exactly
1. A sun calculation for sunrise, transit, sunset and Asr at 51°30′ N 0°10′ W, rounded to nearest. This gives 353–362 exact per prayer. The 3–12 boundary days per prayer (§3.2) need HMNAO's own values to match to the minute.
2. sunrise = S − 3; dhuhr = N + 5; magrib = round(sunset + 3).
3. fajr = (sunrise + 3) − `fajr_interval[MM-DD]`: exact given the published sunrise.
4. isha = (magrib − 3) + `isha_interval_2026[MM-DD]`: exact given the published Maghrib.
5. The interval table is `data/london_intervals_final.json`. It is year-independent except the 16–19 Jun (2025+) and 2020-only edits.
6. The London rule is not the moonsighting.com function. If moonsighting is offered in London as a second option, expect these differences from the API (2024–2026, generic London m0):
   - Fajr −7..+6 min;
   - Isha −4..+11;
   - sunrise +2..+4;
   - Dhuhr, Asr and Maghrib 0/+1.

---

## 6. Earlier findings still valid
- The moonsighting.com endpoint equals moonsighting.com `praytable.php` on 365/365 days for London 2026, m0/m1/m2 (`data/final_checks.txt`).
- The HU 2006 and 2009 LONDON tables are identical (0 differing cells). They equal the 2007 base endpoint except Isha (+3).
- The 2012–2019 Wayback snapshots of londonprayertimes.com agree with the era tables above (`data/intervals.txt`).
- Archived `/api/times` responses exist in Wayback, but their URLs embed an API key. **They were not fetched**, and the key is not recorded.

---

## 6b. London Central Mosque (ICC) 2026 calendar: checked, not a copy of the API
Sources, fetched 2026-09-14:
- https://www.iccuk.org/2026/ICC_Calendar_2026b.pdf (29 pages; text read in full, all 5,262 lines) → `london/icc2026/`.
- https://www.iccuk.org/2026/ICC_Calendar_2026.pdf: 16 pages, image only (198 characters of text). Its daily times were not checked.
- https://www.iccuk.org/2026/Ramadan_timetable_2026.pdf: image only. Its daily times were not checked.

The only method note in the calendar is "Adjustments with respect to London, Please confirm with your local mosque.", plus a per-city minute-offset table (Birmingham … Manchester). It gives no Fajr/Isha basis.

Comparison with the API (`data/icc2026_vs_api.txt`):
- Rows were parsed by page and month and matched to the best API day.
- **152/365** rows equal an API day on all six prayers. About 208 rows differ in every field.
- The differences cluster in the BST months: late-March to October pages carry GMT-like or shifted values.
- The calendar also has typos (";" and "." as separators).

It is therefore a separately produced table, not a faithful UPTTL copy. It cannot confirm or explain the Isha edits.

---

## 7. Open questions
1. **Documented basis for the 21 Isha edits:** not found in any ELM, ICC, Noor Ul Islam, Hizbul Ulama or moonsighting.com source read. Hizbul Ulama's successor chart (if any), or the Baig software, may hold them. UNVERIFIED.
2. **HMNAO's algorithm** for the boundary days: service unavailable (503), with personal-use-only terms.
3. **Who changed the coordinate** (2015–2021 → 2022) and the June 16–19 edits (2025), and why: no announcement found.
4. **API identity for years before 2026:** not verifiable without the API's own years. The 2024 dump is API output and fits the same rules.

---

## 8. Read-in-full record (owner's no-truncation rule)
Read completely in this session (Read tool or full printout; no slices):
- **ELM pages:**
  - the "Prayer times and calendar explained" page text: all 6,680 lines, 3 Read calls;
  - the prose part of the /prayer-times page: lines 1–821 and 6662–6663, printed in full. Its 365-day table was parsed and compared cell by cell with the PDF: 0 differences.
- **Hizbul Ulama:**
  - `Why_our_fasting_times_are_not_wrong.pdf` text, all 1,031 lines;
  - `Prayer_times.pdf` text;
  - `18Degree_fatwa.pdf` text.
- **Other pages:**
  - moonsighting.com `faq_pt.html`, full text printed;
  - moonsighting.com `how-we.html` text (full);
  - the ICC unifiedpt page (all 149 lines);
  - the Noor Ul Islam explainer (all 188 lines).
- **Every ELM PDF 2012–2026 (timetables, calendars 2025/2026, Ramadan magazine 2015):**
  - every non-numeric line printed and read: `london/elm/prose_lines_all_elm_pdfs.txt`, 2,608 lines, 3 Read calls;
  - every timetable page's numbers parsed with a 12-times-per-day count check (all months passed).
- **Miftahi pdf pages 114–119:** text read in full, and Tables 4, 5 and 6 read visually at 170 and 300 dpi.
- **HU salat directory, 2006 and 2009 editions:** parsed programmatically, all cities. The London, Croydon, Ealing and Essex pages were checked.

Earlier in the session, some sources were only partly printed at first:
- the `faq_pt.html` preview;
- the HU guide first 12 pages;
- the `uk-prayercharts` previews.

The first two were re-read in full or fully parsed as listed above. The notes page of `uk-prayercharts1` equals the 2009 guide, which was parsed in full.
