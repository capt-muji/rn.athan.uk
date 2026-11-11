# O1k wide research: South Asia (Pakistan, India, Bangladesh, Sri Lanka)

Tag `southasia`. Research date 2026-11-10. Read-only against the census
(`world-table-v2.md`), which is treated as the prior record.

## Headline

**Pakistan's federal Nizam-e-Salat timetable IS published, and always was.** The
Ministry of Religious Affairs and Interfaith Harmony hosts a single-page chart,
"**Nizam-e-Salat Chart 2016 and Onward**", listed in its publication register as
**Active, dated 01-01-2016**. It carries a full year of dated daily rows for
Islamabad district (366 rows including 29 February), with adhan and jamaat times
per prayer, sunset, and a dual note for maghrib jamaat ("immediately after").

The chart's own heading reads "کیلنڈر اوقات نماز برائے ضلع اسلام آباد" (prayer-times
calendar for Islamabad district), subtitled as compiled from the unanimous
decision and consultation of the **Nizam-e-Salat committee** and covering all
schools of thought. It carries no year.

This is an authority-tier, machine-legible, year-round daily artifact for the
capital, which the census records as absent. The separate **2026 unified
timetable** (Islamabad + Rawalpindi, approved November 2025) is still
**unpublished** as at 2026-11-10, on the evidence below.

## Pakistan

### Surface table

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| Ministry of Religious Affairs, Nizam-e-Salat chart (PDF, 1 page) | `mora.gov.pk/PublicationDetail/MTg1NmIyZjAtZmY5Zi00OGU3LTgyYWMtMzMwNjUyZTM1ZDY0` -> `mora.gov.pk/SiteImage/Publication/New_Chart_2016_One.pdf` | authority (federal) | 366 dated rows, Islamabad district, 11 columns | "2016 and onward", perpetual, leap-anchored |
| Ministry publication register | `mora.gov.pk/Publications` | authority | metadata: entry 22, "Nizam-e-Salat Chart 2016 and Onward", 01-01-2016, Active | — |
| Ministry news (consultative meeting) | `urdupoint.com/en/pakistan/religious-ministry-announces-to-issue-unified-2127923.html` | authority via APP wire | no table; states a unified calendar was *agreed* 29-01-2026 | 2026 |
| Daily Pakistan (Urdu) | `dailypakistan.com.pk/30-Jan-2026/1906458` | press | "the unified calendar will be issued soon" | 2026 |
| Samaa Urdu | `urdu.samaa.tv/2087345543-` | press | scholars agree to uniform adhan/prayer times | 2025-11-19 |
| Punjab Auqaf | `auqaf.punjab.gov.pk` | authority | HTTP 403 to this client | — |
| Sindh Auqaf | `auqaf.sindh.gov.pk` | authority | no DNS response | — |
| KP Auqaf | `auqaf.kp.gov.pk` | authority | 200; no prayer table, no relevant PDF | — |

### What confirms the record

- The census "largest watch item" ordering is right about the *2026 unified*
  artifact: no calendar, notification, or gazette text for it exists on the
  ministry site, and the last official word (29-01-2026) is a consultative
  meeting that "agreed to issue" one, with the minister saying the ministry is
  "working towards legislation".
- The framing needs one correction: the federal Nizam-e-Salat *chart* has been
  live and Active since 2016. What is missing is not "the Nizam-e-Salat
  calendar" but "the 2026 twin-city unified edition".

### What is NEW

**366 dated rows, Islamabad district, authority tier** ->
`data/pk-islamabad-nizam-2026.json` (plus the full 11-column transcription in
`data/pk-islamabad-nizam-m*.json`).

Properties measured:

- Template is leap-anchored and year-agnostic: February carries 29 rows,
  September 30 with a blank 31st slot, and **no year string appears anywhere** on
  the page. It is a perpetual artifact in the same class as ACJU.
- Internally coherent: 24-hour ordering (fajr < sunrise < dhuhr < asr < sunset <
  maghrib < isha) holds on all 366 rows, and no adhan column moves more than
  3 minutes day over day except at the chart's own round-number iqamah switches.
- One genuine discontinuity: isha adhan drops 8:00 pm (30 Sep) to 7:30 pm
  (1 Oct), a 30-minute step that the September panel does not anticipate.
  Verified against the source image, so it is the publisher's, not a
  transcription slip.
- The chart's own footer says the system will continue ("یہ نظام ... مسلسل جاری
  رہے گا"), matching the "and onward" title.

**Recipe read** (Islamabad, 33.6844 N 73.0479 E, Karachi 18/18 Hanafi as the
reference):

| Column | Chart vs computed |
|---|---|
| fajr | within 1 min (18 degrees, no margin) |
| sunrise | within 1 min |
| asr | +2 to +3 min (Hanafi) |
| maghrib | +1 min (June) to +6 min (January) |
| dhuhr | fixed clock, not a margin: 1:00 pm winter, 1:15 pm summer |
| isha | fixed clock: +10 min (June) to +21 min (January) over 18 degrees |

So fajr is an exact 18-degree computation with no safety margin, while dhuhr and
isha are scheduled institutional clock times. That is a different construction
from the ACJU and IFB artifacts (which offset every prayer) and it is worth
carrying as its own generation.

### Honest negatives

- Searched Urdu and English for the 2026 unified calendar and for any issuance
  after January 2026: "نظام صلاۃ ٹائم ٹیبل", "نظام صلوۃ کیلنڈر جاری 2026", "Nizam
  e Salat calendar 2026", "unified prayer timings Islamabad Rawalpindi". Every
  hit is either the November 2025 announcement, the January 2026 consultation,
  an aggregator, or a diaspora mosque. **No 2026 twin-city table exists online.**
- Rawalpindi has no separate chart of its own on the ministry site; the single
  PDF is titled for Islamabad district.
- Punjab Auqaf blocks automated clients (403), Sindh's domain does not resolve,
  and KP's site carries no prayer data. No provincial board publishes a dated
  table.
- Karachi/DHA and Islamabad mosque layers: nothing new surfaced beyond the
  census's existing DHA iqamah and mawaqit captures. Aggregators (hamariweb,
  islamicfinder, anwaar-e-madina) are computed feeds, not authorities.

## India

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| J&K Waqf Board notices | `waqfboard.jk.gov.in/notices.aspx` | authority (statutory board) | notices register live, items to 08-11-2026; Friday-prayer notices present (e.g. 30-03-2026 Hazratbal) | 2025-2026 |
| Makkah Masjid "Hyderabad" | `makkahmasjid.net` | **same-name trap** | full-year dated monthly tables, but for Garland, Texas | 2025 |
| Delhi Waqf Board, Telangana Waqf Board, Deoband, Kerala bodies | — | — | no dated daily table found | — |

**Confirms:** the J&K board remains the one Indian board publishing dated
congregational material, and its register is current into November 2026.

**Same-name trap recorded:** `makkahmasjid.net` is Makkah Masjid, 3301 W
Buckingham Rd, Garland TX 75042, not the Hyderabad mosque of the same name. Its
January 2025 sheet prints Garland solar times (dhuhr 12:31, maghrib 5:38). Anyone
fitting "Hyderabad Makkah Masjid" from this domain would import Texas times. The
census's negative on Hyderabad stands.

**Honest negatives:** searched Malayalam ("നമസ്കാര സമയം 2026"), Tamil
("தொழுகை நேரம் 2026"), Hindi ("नमाज़ का समय 2026 दिल्ली जामा मस्जिद") and English.
Every dated table returned was a computed aggregator (aladhan, islamicfinder,
namazvakti, al-habib, timesprayer) or a foreign mosque. Delhi Jama Masjid,
Hyderabad, Kerala and Deoband publish no campus daily table on the web; Kerala
still needs print.

## Bangladesh

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| Islamic Foundation Bangladesh | `islamicfoundation.gov.bd` | authority | home page and full navigation crawled: **no prayer-time page, no prayer PDF** (link crawl found zero prayer links, zero PDFs) | — |
| kivabe.com district tables | `kivabe.com/namaz/?zilla=65&month=1` | community republication | complete 2026 dated tables per district (64 districts x 12 months), Bengali | 2026 |

**New, and a trap of its own kind:** kivabe states it follows "ইসলামিক ফাউন্ডেশন
এর নামায ও রোযার স্থায়ী সময়সূচী" and offers a 64-district 2026 dated table.
Measured against the band question, it **fails as a witness**: Dhaka November
runs fajr 4:49, 4:50, 4:50, 4:51, 4:51, 4:52 on consecutive days, a smooth daily
curve with no 3-6 day plateaus. It is a computed reconstruction wearing IFB's
name, not a transcription of the band artifact. Record it as a decoy, not a
second witness.

**Confirms:** IFB's public CMS still carries no year-round prayer artifact.

**Honest negatives:** searched Bengali ("নামাজের সময়সূচি ২০২৬ ইসলামিক
ফাউন্ডেশন", "ইসলামিক ফাউন্ডেশন নামাজের সময়সূচি ডিসেম্বর ২০২৬ জেলা") and English.
The district-portal layer and the IFB CMS both expose notices and tenders only.
News-desk daily schedules (jagonews24, jugantor) are a different artifact family
and carry district minute offsets, not IFB bands. The print task stands.

## Sri Lanka

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| ACJU prayer-times page | `acju.lk/prayer-times/` | authority (statutory) | 156 PDF links: 13 zones x 12 months | current |
| Zone 03 November sheet (re-issued) | `acju.lk/wp-content/uploads/2026/11/03.-Mullaitivu-District-Except-Nallur-...-_11_011.pdf` | authority | 30 dated rows, dual Asr | 2026 |
| Zone 01 September sheet | `acju.lk/wp-content/uploads/2026/10/01.-Colombo-9.pdf` | authority | 30 dated rows | 2026 |
| Repo transcription for comparison | `data/countries/lk-colombo-sep.tsv` | — | 30 rows, prior capture | — |

**The regenerated-edition question, answered: NO.**

- Twelve zones serve their November sheets from `uploads/2026/10`. **One zone
  (03) moved to `uploads/2026/11`**, re-titled to name its districts explicitly:
  "Mullaitivu District (Except Nallur), Kilinochchi District, Vavuniya District".
  The rename adds a zone-boundary correction (Nallur excluded), nothing else.
- Values are unchanged. The page still pairs zone 03's November **preview image
  from October** with the **November PDF**, which gives a direct old-versus-new
  comparison: all 30 rows match cell for cell, and the PDF text carries **no year
  string**.
- Independent check on a zone that never moved: current Colombo September
  (`2026/10`) against the repository's own older transcription is **0 mismatches
  in 180 cells**.

So the perpetual-artifact ruling survives a second year and a re-upload. Sri
Lanka's lift ("a regenerated edition") is still open, and the one November
re-upload is a title fix rather than a regeneration.

**New:** the ACJU sheet format is now text-extractable PDF (not OCR class) for
zones 01-13 at the new naming, which removes the OCR caveat for future captures.

## What deserves a fit

1. **Pakistan, Islamabad district** -> the federal chart at
   `data/pk-islamabad-nizam-2026.json`. Authority-tier, 366 rows, 18-degree fajr
   with no margin, Hanafi asr +2..+3, maghrib +1..+6, and two scheduled clock
   times (dhuhr, isha). This is a state timetable for the capital, so Pakistan
   stops being a Karachi-method fallback for Islamabad; Karachi itself stays
   fallback until Karachi's own board publishes.
2. **Sri Lanka** -> no change to the recipe. The second-year check clears the
   perpetual artifact and should downgrade the "regenerated edition" lift from
   open to answered-negative for 2026.
3. **Bangladesh / India** -> no fit; both keep their recorded state.

## Captures

`captures/pk-mora-nizam-e-salat.html`, `pk-mora-nizam-e-salat-chart-2016.pdf`,
`pk-mora-chart-page-render.png`, `pk-mora-publications.html`,
`lk-acju-prayer-times.html`, `lk-acju-z03-nov2026.pdf`,
`lk-acju-z03-nov-preview-oct.jpg`, `lk-acju-z01-sep-2026-10.pdf`,
`bd-ifb-home.html`, `bd-kivabe-dhaka-jan.html`, `in-jk-waqf-notices.html`,
`in-hyd-makkahmasjid.html`, `in-hyd-makkah-calendar.html`,
`in-hyd-makkah-jan2025.png`.
