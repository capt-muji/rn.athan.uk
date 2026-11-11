# O1l-52: second witnesses for four attribution gaps

Agent `O1l-52`, 2026-11-11. Workspace `$HOME/athan-gitree/census/o1l-city/second-witnesses/`.
Public pages only, no login, no form, no challenge solved, no subagent, repository untouched.
Engine for every fit: adhan 4.4.6 at `$HOME/athan-gitree/census/adhan-build`, TZ pinned per
country, dates built from literal capture strings, no clock read.

| Gap | Result |
| --- | --- |
| Norway: Jamiat/islamweb line named as Moonsighting Committee by fit only | **Absent.** No page at islamweb.no names a method or a body other than IRN |
| Sweden: IF table attributed to Diyanet's engine by margins only | **Witness found.** IF's own statement names Diyanet as the producer of the national table |
| Morocco: post-rebuild angle identification degenerate on two months | **Third month scored.** Degeneracy survives; 19/17 is not the only reading |
| Kelantan: transcription rests on Zulkaedah 1441 | **Later month found, transcribed, fitted.** The banked 18/17 rule holds |

---

## 1. Norway: the islamweb.no / Jamiat Ulama line: no method statement exists

**Verdict: absent.** No page on the publisher's own site names the method, the body or the
engine behind its tables. The site names **IRN** and nobody else.

### What was read

| Surface | URL | Result |
| --- | --- | --- |
| Front page | `https://islamweb.no/` | 200, 24,830 B. Prayer-time block names IRN only |
| "Bønnetider" page | `https://islamweb.no/index.php?expand=41&show=41&topmenu_2=` | 200, 7,176 B. Same block, no method text |
| Menu pages | `index.php?expand=1,2,3,4,5,6,7,8,9,10,11,12,13,18,40` | 200 each. No prayer-time page, no method page |
| PDF endpoint | `https://islamweb.no/phpToPdf/createPDF.php?place=1,2,3` | 200, ~23.5 KB each. Header only, no method |
| `robots.txt`, `sitemap.xml` | none | 404 |

`islamweb.no` serves a TLS certificate for `www.nodesmarket.com`, expired 2020-04-18, so plain
HTTPS fails verification. Pages were read with verification bypassed for a read-only capture,
recorded here so the state of the host is on record.

### What the pages actually say

Front page, verbatim: **"Nye bønnetider fra IRN — IRN har utgitt nye standardiserte bønnetider
for Norge. Se bønnetidene her"**, linking to `http://www.irn.no/bonnetider`.

Every PDF carries one header line: **"Bønnetider for Oslo 2026 / Levert av islamweb.no og
utarbeidet av Jamiat Ulama Norway"**. No angle, no method, no body, no engine. A keyword scan of
all six extracted pages finds `Jamiat Ulama Norway` once per page and nothing else.

So the publisher's only named attribution is to **IRN**, and the artifact the fits were run on
names only its producer. **Moonsighting Committee appears nowhere on this domain.** The fit
identification in `fit8` stands as a fit, with no documentary corroboration, and the record
should say so. The front page's IRN attribution is a live inconsistency worth carrying: the site
points readers at IRN's standardised times while its own PDF endpoint prints a table that is not
IRN's (the fit separates them by 33.6 min on fajr at Bergen).

The PDF rows were checked against the banked file: `place=2` (Oslo) 2026-01-01 prints
`07:34 09:19 12:26 13:36 15:28 17:06`, byte-equal to `europe/data/no-islamweb-oslo-2026.json`.
The artifact fitted by `fit4`/`fit8` is the one this endpoint serves today.

**Not closed by this:** the Wayback Machine returned HTTP 503 for every CDX request during this
run, so the site's history could not be read for a retired method page. Re-read when it returns.

---

## 2. Sweden: IF's own statement names Diyanet

**Verdict: witness found.** The identification was made by margins; it is now a documentary
statement on the publisher's own domain.

- URL: `https://www.islamiskaforbundet.se/uttalande-betraffande-bonetider-i-sverige/`
- Page date 2016-05-28; statement signed Stockholm, Friday 27 May 2016; issued by **Sveriges
  Imamråd** and reprinted by Islamiska Förbundet.
- Raw capture: `captures/se-if-uttalande-bonetider-2016.tinyfish.md`

The decisive sentence, Swedish: **"Att anta bönetider utförda av det Turkiska Religiösa
Direktoratet – Diyanet för hela året och från och med 1:a maj 2016."** Arabic, same page:
**"إعتماد توقيت هيئة الشؤون الدينية التركية الرسمية في جميع الصلوات وعلى مدار العام كله ابتداءاً
من أول مايو 2016م"**: the times of the official Turkish Religious Affairs Authority, all
prayers, year-round, from 1 May 2016. The same paragraph records that the times were approved
by the European Fatwa Council at Berlin on 12 March 2016 and sit close to the Muslim World
League's Islamic Fiqh Council.

The statement also says the tables are published on IF's own site ("De flesta svenska städers
bönetider finns på Islamiska Förbundet i Sveriges"), which is the link from statement to the
surface the census fitted.

A second IF page, `uttalande-gallande-fastetiderna-och-dess-bestammelser-i-de-skandinaviska-landerna/`
(2015-06-10), names Diyanet in a committee role: the Fatwa Council calls for a committee that,
together with Diyanet, "följer upp månadernas tider". Weaker, but the same attribution direction.

**Reading.** The 2016 statement is the origin of the engine the 2026 fit measured, and it
predates the January 2023 Diyanet EU isha 17→16 amendment the span ledger already dates. The
attribution is documentary, not inferential.

**Route note.** Direct `curl` to the IF host is closed by a proof-of-work WAF (HTTP 454,
"Checking your browser", SHA-256 difficulty 16, `splash.simply.com`). The challenge was **not**
solved; the page was read through the public fetch API. The day page's "Bönetiders källa" control
loads its text on click and was not opened.

---

## 3. Morocco: a third month, and the angle stays degenerate

**Verdict: 19/17 is not the only reading the surface admits.** The degeneracy is structural, not
a two-month artefact.

### The third month

The live portal serves current + previous only: `data/horaires-2026-12.js` returns 404 today
(2026-11-11), as do 2026-09 and 2027-01. Wayback returned 503 for every CDX request. The third
month therefore comes from the ministry's **pre-rebuild** surface, `prieres/horaire_hijri_2.php`,
whose Wayback captures the prior wave banked on disk:

| Month | City | Days | Source |
| --- | --- | --- | --- |
| 2025-01-02 → 2025-01-31 | Casablanca | 30 | `c31-year2/data/wb/ma/horaire_hijri_2_ville_58_20250120171540.html` |
| 2024-02-11 → 2024-03-11 | Rabat | 30 | `horaire_hijri_2_ville_1_20240211141015.html` |
| 2024-06-04 → 2024-07-03 | Laayoune | 30 | `horaire_hijri_2_ville_156_20240604140741.html` |

Two live rebuilt months (`morocco1/data/2026-10.json`, `2026-11.json`) sit beside them. Per the
brief, the rebuild is a dated regime change and no fit is pooled across it; each month carries
its own margins.

### The scan

Casablanca 2025-01, at the city's own point (33.5731 N, 7.5898 W), margins free per column,
rounding nearest, adhan 4.4.6, 30 days:

| Column | Angles within 1 min on every one of the 30 days | Best exact |
| --- | --- | --- |
| fajr | **18.00 through 20.00**, every quarter degree | 18.75, 19.25 and 19.75 tie at 29/30, MAE 0.03 |
| isha | **16.00 through 18.25**, every quarter degree | 16.25 at 30/30, MAE 0.00 |

Rabat 2024-02, at 34.0209 N, 6.8416 W, same treatment, 30 days parsed: no angle holds every day
(the ministry's city point sits about 4 minutes off the city centre, the effect `morocco1` already
documented), and the ordering is still flat. Fajr 19.00 and 19.50 tie at 25/30 exact with 28/30
within 1, and 18.50 and 19.75 sit at 24/30. Isha 17.00 leads at 27/30 exact, with 16.50 and 17.75
at 26/30.

Laayoune 2024-06 did not score: the capture's month boundary did not parse cleanly and every
angle returned zero hits. Recorded as not scored rather than guessed.

**Reading.** Every +0.5 degree of angle is worth about one minute, so the angle and the margin
trade against each other exactly and a wide band passes. On a third month with a 0.03-minute MAE
the band is **18.0-20.0 for fajr and 16.0-18.25 for isha**, every quarter degree inside it
reaching within 1 minute on all 30 days. 19/17 sits inside both bands and is the reading the
census's pooled multi-year fit supports, but **it is not uniquely identified by this surface**
and no third month changes that. The record's attribution should read "19/17 by pooled
multi-year fit; the monthly surface admits 18.0-20.0 and 16.0-18.25 at one-minute resolution".

---

## 4. Kelantan: a later month, transcribed, and the banked rule holds

**Verdict: a later month exists, and the banked 18/17 rule reproduces it.**

### The surface

| Field | Value |
| --- | --- |
| Poster | Ramadan 1446H / 2025M, Kelantan zon 1 + zon 2, 29 days |
| Publisher | Majlis Daerah Jeli (state district council) republishing the Kelantan state table |
| Post | `https://www.facebook.com/MDJeliOfficial/posts/1032085232287524/`, dated 2025-02-26 |
| Poster | `captures/my-ktn/mdjeli-1446-ramadan-poster.jpg`, 774 x 1097, 354,629 B |
| Rows | `data/my-ktn-mufti-1446-ramadan.json`, 29 days x 2 zones x 7 columns |

Captured through the public post permalink with a crawler user agent, the route `kel2`
established; no account, no cookie, no challenge. Columns printed left to right: asar, zuhur,
syuruk, subuh, **imsak**, isha, maghrib. The poster is five years later than the 1441 series and
is the first Kelantan table on record with an **imsak** column.

Printed frame: 1 Ramadan = Sunday 2 March 2025; Eid 1 Syawal = Monday 31 March 2025, so the month
is 29 days. The footer places Nuzul Al-Quran on Monday 17 March, which its own table makes 18
March; a one-day internal inconsistency in the footer, with no effect on the times.

### The banked rule against it

Kota Bharu (6.1200 N, 102.2400 E), Shafi, no high-latitude rule, **fajr 18, isha 17**, nearest,
+1.5 min on both twilight columns:

| Column | Exact | Within 1 | Worst |
| --- | --- | --- | --- |
| subuh | 27/29 | 29/29 | 1 |
| isha | 27/29 | 29/29 | 1 |

Solar columns on the same table: syuruk ceil +0 → 28/29; zuhur nearest +2.5 → 26/29; asar ceil
+1 → 23/29; maghrib nearest +1.5 → 28/29; every column 29/29 within 1. Hanafi asr scores 0/29
with MAE 66 minutes, so the Shafi reading is confirmed again.

Twelve of the 29 days carry one column at a 1-minute residual and no day carries more; every
subuh cell is exact. The residual pattern is the rounding boundary, and it is also the
transcription check: no 2-minute outlier exists, so no cell is misread.

**New, and it closes a `kel2` negative:** the poster prints imsak, and **imsak = subuh − 10 on
all 58 zone-days**. The 1441 posters had no imsak column, so the JAKIM imsak rule could not be
tested there; it can now, and it holds.

### The dated regime change the record lacked

Kelantan's fajr angle changed **from 19 to 18 degrees** effective **1 Ramadan 1441 = 24 April
2020**, adding four minutes to subuh and imsak with every other prayer unchanged. Named by the
Mufti of Kelantan in Sinar Harian, 2020-04-21, and reposted from the Jabatan Mufti by the state
committee chairman:

- `https://www.sinarharian.com.my/article/79910/edisi/kelantan/waktu-solat-subuh-di-kelantan-ditambah-empat-minit`
- `https://www.facebook.com/dr.izani/posts/1530650343765519/`

Both banked 1441 months (Syawal and Zulkaedah, May-July 2020) sit **after** that date, so they
are already the 18-degree era. Any Kelantan span crossing 2020-04-24 must split there. This is
the documentary confirmation the fajr angle lacked: the 18 the fit measured is the 18 the state
declared.

### Zon 2 changed between 1441 and 1446

Printed zon 2 minus zon 1, 2025: subuh +1..+4, syuruk +1..+3, zuhur +1..+2, asar 0..+1,
maghrib +1..+3, isha +1..+3, every median +2. In 1441 the evening was compressed instead
(maghrib 0..+1, isha −1..0). The 2025 zon 2 table is zon 1's recipe shifted about 0.5 degree west:
at 6.12 N, 101.74 E the same recipe and margins reproduce syuruk, zuhur and maghrib at MAE 0.16.
A near-equinox month pins longitude and not latitude, so the reference point cannot be located
more tightly than that, and whether the point moved or only the rendering did cannot be
separated from this month.

### Also found

- The 1441 poster's zon 2 subuh anomaly repeats in kind: zon 2 subuh and imsak step **up** one
  minute on 28 March and back down on 29 March, and zon 2 maghrib steps up to 19:26 on 22 March
  between 19:25 neighbours. Printed as is, both verified at 9x.
- Zon 2 subuh/imsiak at 18/17: 22/29 exact on a 17.05 floor reading, worse than zon 1, because
  zon 2's own point is west of the fit point. Expected, not a defect.

---

## Honest negatives

- **Wayback was down for the whole run** (HTTP 503 on every CDX request, all hosts). Both
  Wayback-dependent legs were served from captures already on disk: Morocco's third month, and
  the check for a retired islamweb.no method page (which therefore remains unchecked).
- **Norway's history is unread.** A method page may have existed and been retired; nothing on the
  live site says so either way.
- **Laayoune 2024-06 did not score.** Its month boundary did not parse cleanly; recorded, not
  guessed.
- **The IF "Bönetiders källa" control was not opened.** It loads on click and needs a browser.
- **Morocco's December 2026 file is not published** and 2027 is 404, so the rebuilt surface still
  has no third month of its own.

## Files

- `captures/no-islamweb-root.html`, `captures/no-islamweb-bonnetider.html`,
  `captures/no-islamweb-pages/`, `captures/no-islamweb-place{1,2,3}.pdf`
- `captures/se-if-uttalande-bonetider-2016.tinyfish.md`
- `captures/my-ktn/mdjeli-1446-ramadan-poster.jpg`, `captures/my-ktn/mdjeli-1446-post.html`
- `data/my-ktn-mufti-1446-ramadan.json`
- `scripts/ktn-1446-fit.cjs`, `scripts/ktn-1446-audit.cjs`, `scripts/ma-scan2.cjs`
