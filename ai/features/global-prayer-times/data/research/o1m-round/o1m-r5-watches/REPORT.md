# O1m-R5 — dated watches, December accrual, cheapest year-2

Workspace `$HOME/athan-gitree/census/o1m/o1m-r5-watches/`. Public pages only, GET only, no login,
no challenge solved, no subagents, nothing under /tmp, the repository untouched. Every probe is a
dated row in `probes.tsv` (270 records: UTC time, name, URL, status, bytes, content type) with its
raw body in `captures/` (254 files, 24 MB). Banked rows in `data/` (33,581 dated rows across 95
files), fits in `fit/`. Engine: adhan 4.4.6 at
`~/athan-gitree/census/adhan-build/node_modules/adhan`, `Rounding.None`, TZ pinned per surface,
dates built from literal capture strings, no clock reads into data.

Probe window: 2026-11-11 08:14Z to 08:43Z, plus the masjidway 2028 harvest (08:21-08:27Z).

## Front 1 — the dated watches (10 surfaces, 1 MET)

| Watch | Probe (UTC) | Payload evidence | Verdict |
|---|---|---|---|
| Morocco horaires-2026-12 | 08:14:59 | 404 (555 B); November control 200, 292,088 B unchanged | NOT MET; due 2026-12-01 |
| Chile horarios-diciembre | 08:16:48 | 404; November page 200; Vina del Mar still `uploads/2026/10/Octubre-2026.xlsm-Grupo_Parte7.pdf` | NOT MET; due 2026-11-29; the stale Vina link survives a third month |
| Kosovo takvimi2027 | 08:15:09/10 | media search `2027` → `[]`; `takvim` search unchanged (18,663 B), newest `takvimi2026*.pdf` uploaded 2026-01-14 | NOT MET; due late December |
| Thailand 2570 | 08:17:21 | reader 200 (19,335 B): menu carries ปี 2568 and ปี 2569 only, zero `2570` | NOT MET; due 2027-01-01 |
| JAKIM e-Solat 2027 | 08:15:15 | `&year=2027` 200, 77,257 B, 365 rows, payload opens `01-Jan-2026`, closes `31-Dis-2026`; prayerTime array identical to the no-parameter call (only serverTime differs) | NOT MET; parameter silently ignored; due 2027-01-01 |
| Indonesia myquran tail | 08:16:07-08:16:34 | all twelve months of 2027 return 200 with correct first/last dates (01/01/2027 … 31/12/2027) | **MET — full 2027 banked** |
| Turkey 2027 | 08:16:40 + 08:19 | yearly table closes `31 Aralık 2026`, `2027` occurs once (the echoed form action); `?yil=2027` byte-equal but for the echo; awqatsalah root serves an API-docs landing page (credential-gated, no login attempted) | NOT MET; due 2027-01-01 |
| Sri Lanka ACJU 2026/12 | 08:16:42 | index carries zero `uploads/2026/12` references; `2026/11` holds zone 03 only (12 page links); 300 references keep the other 12 zones on `2026/10` | NOT MET; due ~2026-12-05 |
| Brunei OData 2027 | 08:15:11/13 | newest `Date` 2026-12-30T16:00Z = 2026-12-31 local; 161 lists, the only prayer surface still `Waktu Sembahyang` | NOT MET; due 2026-12-20 |
| mawaqit calendar ?year=2027 | 08:18:18/29 | `?year=2027` 200, 12-page PDF, **date column prints 2027-01-01…2027-12-31**, but all 365 month-day-aligned rows are IDENTICAL to the plain (2026) call — 365/365 equal cells | NOT MET — the trap has sharpened: the label advances, the computation does not |

**The mawaqit relabel, precisely.** The o1l finding ("returns the 2026 table relabelled") holds on
the values and has changed on the dates: the year parameter now rewrites the PDF's date column
(first page `2027-01-01 22 Rajab 1448`) while every prayer time is the 2026 value. Any
payload-date-only check would now pass; the value diff is the gate that catches it. Both PDFs
captured and parsed (`data/mawaqit-gibraltar-calendar-{2026,2027}.json`), Sunrise Hotel mosque,
uuid `5d57a1da-a26e-4a94-8a1f-4bab0bef22bd`; the first uuid in the page's markup 404s on the
calendar route.

**Indonesia detail.** Jakarta (KOTA JAKARTA, id 1301) 2027-01..12 banked as one 365-row year
(`data/id-myquran-jakarta-2027.json`). Fit (`fit/indonesia-2027-fit.json`): the Kemenag SIHAT
conventions reproduce unchanged — fajr 20 deg +2.6 (92.3 pc exact, 100 pc within-1, worst 0.6),
isha 18 deg +2.5..3.6 (93.7/100, worst 0.8), sunrise -3.15, dhuhr +2.58, asr +2.57, maghrib +3.3.
One recipe across 2026 (held) and 2027 (this capture): the year-2 lift is real, same generation.
Fajr amplitude 18 min (04:27 Jan 15 → 04:45 Jul 15), the near-equator frame.

## Front 2 — December accrual (6 surfaces, 1 MET)

| Surface | Probe | Verdict |
|---|---|---|
| GMP France | 08:20:00, Paris page 200 (813,529 B) | NOT MET — poster is still `HEURES PRIERE - PARIS - GMP - NOVEMBRE 2026.jpg`; zero DECEMBRE hits |
| Madrid CCIM | 08:20-08:21 | NOT MET — `Diciembre-2026.pdf` and `diciembre-2026.pdf` both 404; the December-2025 control serves 200 (304,724 B PDF) |
| Gibraltar masjidway | 08:21:21 + 08:21-08:27 harvest | **MET — the platform now serves 2028** |
| Fiji FML | 08:20:01 | NOT MET — the December link is still `uploads/2024/06/December-2024.jpg`; no 2026 sheet on the site |
| Ireland IFI | 08:21:49 | NOT MET — `?year=2027` sha256-equal to `?year=2026` (99e600d0…), the frozen generation holds |
| Belarus Minsk | 08:21:50 | NOT MET — page carries 365 `2025` tokens against 2 `2026`; still serving the 2025 roll |

**Gibraltar 2028 — the headline.** `en.masjidway.com/masjid/12520/prayer/MM2028` serves the full
leap year: 366 rows banked (`data/gi-masjidway-gibraltar-2028.json`), 2028-01-01 through
2028-12-31, 29 February present, no clamping (the month-of-request matched on all twelve pages).
Rate-limit note: months 02-08 returned 503 on the first pass (3 s spacing) and served on retry at
25 s spacing; 09-12 served first pass. Forward longevity moves **proven-to-2027-12-31 →
proven-to-2028-12-31**.

Fit (`fit/gibraltar-2028-fit.json`), the held recipe at the masjidway point
(36.1120042, -5.3454668), 366/366 days: fajr 18.1 (87.4 pc exact, 100 pc within-1, worst 0.7),
isha 16.9 (86.6/100, worst 0.8), sunrise 95.6 pc exact, dhuhr 97.3, maghrib 97.0 (worst 0.5),
asr Shafi 43.2/81.7 worst 1.3 — the documented engine skew, not a recipe change. One recipe now
spans 2011, 2014, 2026, 2027 and 2028 (four clean years in the span ledger's sense, three in this
decade). Amplitude fajr 90 min.

## Front 3 — cheapest year-2 (8 surfaces, 1 large MET, 1 small MET)

### Norway mawaqeet — 88 of 89 places banked, 32,120 rows

Enumeration: the `bonnetider/` index page and the WP sitemaps agree on **89 place slugs**
(`data/no-mawaqeet-slugs-all.txt`). Each place page embeds one annual PDF
(`wp-content/uploads/2025/01/<Place>.pdf`, 12 monthly pages). All 88 reachable PDFs captured,
parsed and banked (`data/no-mawaqeet-<slug>-2026.json`, 365 rows each).

- **The lift:** 83 places NEW (the record held five: Trondheim, Kristiansand, Ålesund,
  Copenhagen, plus Stavanger/Haugesund class from O1l-31). 32,120 rows in one sweep.
- **Kopervik serves 2025** (`no-mawaqeet-kopervik-2025.json`, 365 rows, day-of-week verified:
  1 January = Wednesday) — a genuine second year on one place of the network; every other place's
  file is the 2026 generation.
- **Defect:** Mysen's PDF link is dead on the publisher side
  (`uploads/2025/01/Mysen-1.pdf` 404, twice) — 89th place unreachable, publication defect.
- **Non-Norway slugs:** kobenhavn, goteborg, vanersborg, saffle — the network covers south
  Sweden and Copenhagen.
- **Fit** (`fit/mawaqeet-fit.json`): fajr 18 / isha 15, adhan 4.4.6, 20 sampled
  cities at gazetteer points, honest days only (the `--:--` summer-isha nulls skipped; 223-271
  days per city). The line reproduces at 18 of 20: fajr 93.2-98.0 pc exact / 99.2-99.6 within-1
  (worst 1.6-2.5), isha 88.3-91.2 / 100 (worst 0.6-0.8), sunrise/dhuhr/maghrib worst ≤ 0.9, asr
  worst 1.9-4.4 (the platform skew). Two outliers are point mismatches, not recipe failures:
  Moss (68 pc fajr exact, 94.3 within-1) and Säffle (31.3/68.3) sit off the gazetteer point and
  resolve at a mosque-specific coordinate.
- **Amplitude:** 299-310 min fajr span across the sample (near-polar frame, honest days).
- No 2024/2026 files exist at the uploads pattern (both probed 404): one file per place, one
  generation, breadth is the only year-2 here — and the network breadth is now banked.

### The rest of Front 3

| Surface | Probe | Verdict |
|---|---|---|
| Iceland Ísafjörður/Selfoss | 08:39 | NOT MET — API still `{"error":"Unknown city"}` for Ísafjörður, Selfoss and Egilsstaðir (HTTP 400); the nine-city surface stands |
| Luxembourg 2027 | 08:40 | NOT MET — `uploads/2026/{12,11}/Horaire-des-prieres-2027-FR.pdf` and `-1` variant all 404; 2026 control 200 |
| Belgium 2027 | 08:40:46-48 | NOT MET — EMB `horaire_priere_emb_2027.pdf` 404 and Sanabel 2027 path 404; EMB 2026 control 200 (1,438,151 B) |
| Austria IZW workbook | 08:41:00 | RENDERS — 366 sheet rows, 2,927 cells, one sheet named `2026`, sha256-identical to the O1l-held capture; the declared 2029 correction stays declaration-only (the file carries no 2028/2029 sheet to test) |
| Slovenia feed window | 08:41:26-40 | CONFIRMED — the v2 feed serves only the 2026 calendar (365 entries, 2026-01-19..12-31); `?month=9`, `?month=1&year=2025`, `?date=2025-06-15`, `?year=2025` all return the same years/months set (serverTime varies, calendar does not): past months not retained, parameters ignored |
| Estonia past years | 08:42:01 | RESOLVED AS A CALCULATOR — `app.js` computes client-side from its CITIES config (15/15 + night portion) with the year clamped to 2024..2100; the "built-in CSV" is generated in the browser for any clamped year, never served. No published past-year artifact exists; the published object stays the 2026+2027 grid |
| Denmark salah.dk | 08:42:47 | year-2 NOT MET — today-only hand site (four city subdomains); `/2026/11` 404, no archive path |
| Denmark Khair al Bariya | 08:42-43 | year-2 NOT MET — My Masjid timingscreen has no public history API (`/api/timingscreen/<uuid>`, `/api/mosque/<uuid>/timings` 404; api host 000) |

## Defects recorded

1. **mawaqit date-column relabel** (Front 1 #10): the year parameter rewrites dates, not values —
   payload-date checks alone now pass; the value diff is the only honest gate.
2. **Mysen dead PDF** (mawaqeet): publisher link 404s; 1 of 89 places unreachable.
3. **Vina del Mar stale link, third month** (Chile): still pointing at the October file.
4. **masjidway dual uuid** (mawaqit page): the first `mosque/<uuid>` string in the markup 404s on
   the calendar route; the second serves it.

## NEXT

- Re-probe the December cohort 2026-12-01..05: Morocco 2026-12 (the file pattern is one GET),
  Chile horarios-diciembre, Madrid Diciembre-2026, GMP DECEMBRE poster, ACJU uploads/2026/12.
- Kosovo takvimi2027 and Brunei 2027 lists re-probe 2026-12-20..31.
- JAKIM/Thailand/Turkey roll-check 2027-01-01.
- mawaqeet: sweep the remaining 69 unsampled places for the fit (or accept the 20-sample verdict);
  re-check Mysen after the publisher repairs the link; look for a 2026-uploads refresh in January.
- Gibraltar: masjidway may extend further — probe 2029 quarterly; the platform is now the only
  Gibraltar surface that renders forward.
- Estonia: if a served past-year artifact is wanted, drive the page in the browser and export its
  own CSV (2024 floor) — a derived surface, label it as such.
- The mawaqit calendar value-diff check should run on any future year-parameter probe anywhere.
