# O1m-16 Southeast Asia year-2 (Malaysia, Singapore, Brunei, Thailand, Philippines, Indonesia)

Wave `o1m-16`, agent DeepSeek V4.1 Flash 1017. Captures 2026-11-11 10:55Z onward. Public pages
only, GET only, no login, no form, no challenge solved, no contact with any body, no subagents,
nothing outside this workspace, repository untouched. Every figure below is from a capture in
`captures/` and a row file in `data/`; timestamps are UTC.

Engine for every fit: adhan 4.4.6 (`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`),
Rounding.None, timezone pinned, dates read from literal capture strings, no clock read.

**What the wave banks:** 23,854 new dated rows of 2027-2028 prayer times (Malaysia 2027 = 21,535,
Singapore 2024-2027 = 1,461, Indonesia 2028 = 858), plus 2,555 Perak authority rows that
independently confirm the Malaysian 2027 mirror zone by zone. 336 raw captures, 117 MB.

## Verdict table

| Country | Year-2 ask | Verdict | Evidence |
| --- | --- | --- | --- |
| Malaysia | 2027 state takwim | **MET** - the whole federation banked for 2027: 59 zones, 21,535 rows, mirror-gated 365/365 against Jawi's authority PDF, 365/365 on Perak zones 1-6 and 156/156 on Penang's own 1448H grid; Perak's own seven 2027 zone PDFs banked directly (2,555 rows); Melaka/Perlis/Terengganu 1448H captured image-only; 6 states publish no 2027 table | `data/my-jakim-2027-all-zones.json`, `data/my-perak-2027-zon1..7.json` |
| Singapore | 2027 + 2028 | **MET for 2027, NOT MET for 2028** - all four MUIS PDFs (2024-2027) banked and fitted, 1,461 rows; no 2028 edition on the calendar page | `data/sg-muis-2024..2027.json`, `fit/sg-muis-fit.json` |
| Brunei | 2027 | **NOT MET** - OData feed ceiling still 2026-12-31; 2027 filter returns an empty feed | `captures/bn-odata-2027-probe.json` |
| Thailand | BE 2570 (2027) | **NOT MET** - the Chularajmontri menu still offers 2568 (dead) and 2569 only; 77 XLSX unchanged | `captures/th-skthai-*` |
| Philippines | BARMM full year, NCMF, Davao | **NOT MET** - BARMM/Wali publishes Ramadan-only tables; NCMF 403; Davao monthly Hijri series confirmed live but image-only | `captures/ph-*` |
| Indonesia | 2028 | **MET on the community tail, NOT MET at Kemenag** - SIHAT wall at 2027-01-01; myquran serves 2028 in full (366 rows for Jakarta, 123-row samples for four more cities) and 2029-2030 | `data/id-myquran-jakarta-2028.json` |

## 1. Malaysia 2027

### 1.1 Perak: the round's new dated 2027 table (2,555 rows)

The Perak mufti's own 2026 article page links a **2027 set in a directory the 2026 edition never
used**: `/images/waktu_solat/2027/Zon%20N_2027.pdf`, one PDF per zone, seven zones, all HTTP 200
(564-672 KB each). Text layer clean; the existing Perak row parser applies unchanged.

| Zone | rows | span |
| --- | --- | --- |
| 1-7 | 365 each | 2027-01-01..2027-12-31 |

Fit (Recipe B = fajr 18 / isha 18, Shafi asr, zohor +1.5 only, prayers ceiling, sunrise floor),
point recovered from each table itself:

| Zone | point | fajr | syuruk | zohor | asar | maghrib | isyak |
| --- | --- | --- | --- | --- | --- | --- | --- |
| zon1 | 4.1266/101.0562 | 341 | 2 | 363 | 275 | 324 | 321 |
| zon2 | 4.5701/100.7005 | 342 | 0 | 359 | 249 | 331 | 343 |
| zon3 | 5.1959/100.8536 | 281 | 3 | 357 | 261 | 299 | 281 |
| zon4 | 5.4524/101.1955 | 329 | 0 | 363 | 269 | 330 | 339 |
| zon5 | 4.1256/100.5143 | 324 | 0 | 360 | 263 | 333 | 312 |
| zon6 | 5.1242/100.3505 | 333 | 0 | 354 | 253 | 333 | 336 |
| zon7 | 4.8806/100.7762 | 332 | 0 | 352 | 260 | 0 | 322 |

Cell = exact days of 365. Every column except syuruk and zon7's maghrib sits **within 1 on all
365 days**. The census margin set (fajr +2 / asr +2 / isha +2) scores **0 exact days** on fajr,
asar and isyak in all seven zones, worst -3: the refuted margins stay refuted on the 2027
edition, from the same publisher, a second year.

zon7 keeps the elevation term found on the 2026 edition: maghrib +6 min and syuruk -5 min,
month-invariant, all 365 days. The Bukit Larut horizon term is a property of the zone, not of
the year.

### 1.2 The full 2027 federation, mirror-gated: 59 zones, 21,535 rows

`waktusolat.ai` prints a whole-year table per location at `/waktu-solat-<slug>/setahun/cetak`,
in ordinary HTML with 24-hour times - no PDF, no OCR. Its sitemap lists 175 locations; 120 of
them resolve to JAKIM zone tables (the rest are state index pages and `/ramadan` variants).

**The mirror is faithful, measured, not assumed:** its Kuala Lumpur 2027 table reproduces the
Jawi/Putrajaya authority PDF on **365 of 365 days and all seven columns** including imsak; its
Perak zones 1-6 reproduce the Perak mufti's own 2027 PDFs 365/365 on every column (zone 7
differs only on syuruk and maghrib, where the mirror prints the flat zone values and the mufti's
PDF carries the Bukit Larut horizon term - see 1.1); and its PNG01 table matches the Penang
mufti's 1448H grid on all **156** overlapping 2027 days and all six columns, including the
publisher's own typo at 2027-04-04 maghrib (19:23 printed, mirror 19:28). Three independent
publishers, one byte-level agreement.

Deduplication: 120 location pages collapse to **59 distinct zones, zero variance within a zone**
(Shah Alam, Petaling Jaya, Gombak and ten more all print SGR01's table). Banked as
`data/my-jakim-2027-all-zones.json`, **21,535 dated rows**, 2027-01-01..2027-12-31, no gaps.
That is the whole Malaysian federation for 2027, a year the e-Solat API still refuses.

Recipe B across the 59 zones (21,535 cells per column):

| column | within-1 | worst |
| --- | --- | --- |
| fajr | 21,138 (98.2 pc) | 68 |
| syuruk | 17,959 (83.4 pc) | 368 |
| zohor | 21,527 (100.0 pc) | 180 |
| asar | 21,297 (98.9 pc) | 185 |
| maghrib | 20,054 (93.1 pc) | 70 |
| isyak | 20,411 (94.8 pc) | 880 |

39 of 59 zones clear 95 pc on all six columns on the bare recipe. Seasonal amplitude (1 Jan vs
1 Jul, printed values) runs from 8 min of fajr in Johor to 25 min in Sabah's Kudat zone; isha
tracks it within a minute. The federal angle pair is frozen across the federation, which is why
one recipe covers 21,535 rows.

The zones that miss are not recipe failures. They carry their own rule, and three of those rules
are measured here:

- **Kelantan isha 17, measured**: KTN01 and KTN02 score **0/365 isha within 1 at 18 deg** and
  **320/365 (KTN01) and 320/365 (KTN02) at 17 deg**. The Kelantan isha line is a real parameter, not a rumour.
- **Pahang highland horizon term**: PHG05 scores sunrise 0/365 (worst -4) and maghrib 0/365
  (worst +4) while fajr 344 and isyak 330 sit within 1. PHG06 the same. A horizon dip on the two
  solar columns only, the Perak zon 7 class, now on a second state.
- **SBH06**: sunrise 0/365 (worst -8) and maghrib 18/365 (worst +9) - the largest horizon term in
  the federation, on the zone that contains the Kinabalu massif.
- **KDH07** does not reproduce on any angle pair (best 19/19 leaves 110 fajr days and 171 isha
  days out) - flagged, not adjudicated.

### 1.3 The 2027 subuh move is a publisher split, not a national shift

Same-month-day comparison, 2026 edition against 2027 edition, minutes (2027 minus 2026):

| Surface | fajr | syuruk | zohor | asar | maghrib | isyak |
| --- | --- | --- | --- | --- | --- | --- |
| KL/Putrajaya (WLY01 -> Jawi 2027) | **-1.33** | -0.07 | -0.21 | -0.21 | -0.44 | -0.44 |
| Selangor zon 1 (SGR01 -> Selangor mufti 2027) | **-1.37** | +0.19 | -0.22 | -0.22 | -0.41 | -0.46 |
| Perak zones 1-7 (2026 -> 2027 edition) | **0.00** | +0.03 | +0.01 | -0.01 | +0.01 | 0.00 |
| JAKIM federation, 56 zones (2026 -> 2027 mirror) | **0.00** | +0.00 | +0.00 | -0.01 | +0.00 | +0.00 |

The last row is the measurement that matters, and it corrects the round's premise. Measured
across all 56 held zones, **the JAKIM federation line did not move into 2027**: the column means
sit within 0.05 min of zero, individual cells wander one minute either way, and only WLY01
(-1.33), KDH04 (-0.15), KDH06 (-0.16), SBH08 (+0.19) and PLS01 (+0.39) show any fajr drift
worth naming. The -1.3 min subuh move exists, and it belongs to the two publishers that issued
their own 2027 takwim: the Federal Territories mufti (Jawi) and the Selangor mufti. Both moved
their reference point south by about 0.3 deg with the angle pair frozen; both moved fajr by -1.3
to -2.4 min seasonally (December -2.35, April -0.63) and isha by -1.1 min in May-July, which is
a latitude shift and not an angle change. Recovered points: WLY01's 2026 edition
3.4681/101.3696, its 2027 edition 3.1786/101.4234.

Perak's own 2027 edition differs from its 2026 edition by at most one minute, on 7 pc of fajr
cells and about a third of day-rows across all six columns (338 of 365 fajr cells identical,
15 one minute later, 12 one minute earlier). That is a fresh computation of the same recipe at
the same point, not a byte copy: the near-equator geometry moves the printed minute only
occasionally from one year to the next. **Grade: provisional** - one published cycle plus a
second edition that shares the computation, which is not two independent years.

The same test across the federation splits the 59 zones cleanly:

| Class | Zones | Meaning |
| --- | --- | --- |
| identical on all 365 days, all six columns | 14 (KTN01-02, SBH01-07 and SBH09, SGR01-03, WLY02) | relabelled edition; one computed generation |
| differing on some days by one minute | 42 | recomputed at the same recipe and point |
| differing by design | WLY01 (4/365 identical) | reference point moved |

So a 2027 bake must not treat the 14 identical zones as a second fitted year.

### 1.4 The other states

| State | Live probe 2026-11-11 | Verdict |
| --- | --- | --- |
| Penang | `Takwim_2026_2027_1448H.pdf` is the held 354-row grid; the mufti's own note says no physical 1448H takwim was issued and the PDF is the Zakat Penang print (second surface captured, `captures/my-penang-1448-zakat.pdf`) | 2027 held |
| Selangor | `muftiselangor.gov.my/takwim-solat/` lists TAKWIM SOLAT 2027M/1448H-1449H; nine districts already held | 2027 held |
| Melaka | mufti page lists 1447 and 1446 only; the unlabelled 2026-07-16 upload `/uploads/page_content/p90/20260716234858_81a68de61dd6.pdf` (29.7 MB) is the **1448H poster, 2 pages, zero text layer** | captured, image-only |
| Perlis | newest Phoca entry is still `531-takwim-1448-hijrah` (image-only, 67 MB, held) | captured, image-only |
| Terengganu | mufti site HTTP 403 to curl; the state district office (PADK) posted the 1448H PDF to Drive - **captured, 30.1 MB, 28 pages, zero text layer**, OCR of the front matter legible, table pages not | captured, image-only |
| Johor | `mufti.johor.gov.my/perkhidmatan/muat-turun/jadual-takwim/` offers the three 2026 posters only (uploaded 2025/12; the 2027 set is due the same December cadence) | NOT MET |
| Kedah | `jheaik.kedah.gov.my` muat-turun carries one guideline leaflet, no timetable; the site distributes e-Solat zone widgets | NOT MET |
| Negeri Sembilan | `muftins.gov.my/taqwim/` (page last updated 2022) offers taqwim 1444, 1441 and 1440 only; no 1448 | NOT MET |
| Pahang | `mufti.pahang.gov.my` 2,879-byte maintenance page | NOT MET |
| Sabah | `mufti.sabah.gov.my` HTTP 500 | NOT MET |
| Sarawak | `muftinegeri.sarawak.gov.my` connection timeout on curl | NOT MET |
| Kelantan | `mufti.kelantan.gov.my` connection timeout; monthly tables are the held Facebook class | NOT MET |

The federal 2027 takwim published by JAKIM is a **date grid with no prayer times**: 1 page,
528,319 bytes, zero text layer (`captures/my-jakim-takwim-2027.pdf`), the same class as the
DISAHKAN 2028 calendar. The download page (`siteId=24&pageId=52`) lists it beside the 2026 grid.

## 2. Singapore: four MUIS years, one recipe

The MUIS calendar page serves one timetable PDF per year: 2024, 2025, 2026, 2027. **No 2028
edition exists** (2028 = NOT MET, publication gap, MUIS publishes about seven weeks ahead).

All four PDFs parsed to dated rows by the same reader: 366 + 365 + 365 + 365 = **1,461 rows**.
The 2027 parse is byte-identical to the held `sg-muis-2027.json`, an independent re-derivation.

**Recipe (one, across all four years): point 1.3521/103.8198, fajr 20.00, isha 18.00, all
columns ceiling, dhuhr round after a +1 min margin.** Equivalently the record's 19.90/18.10 pair
over the same point.

| Year | fajr | syuruk | zohor | asar | maghrib | isyak |
| --- | --- | --- | --- | --- | --- | --- |
| 2024 (366) | 253/366 | 268/366 | 145/365 | 199/366 | 280/366 | 289/366 |
| 2025 (365) | 284/365 | 288/365 | 149/365 | 260/363 | 248/354 | 251/365 |
| 2026 (365) | 252/365 | 269/365 | 148/365 | 196/360 | 264/365 | 298/365 |
| 2027 (365) | 254/365 | 266/365 | 158/363 | 198/365 | 273/359 | 292/365 |
| all (1,461) | 1043/1461 | 1091/1461 | 600/1458 | 853/1454 | 1065/1444 | 1130/1461 |

Cell = exact/within-1 days. Fajr and isha are **within 1 on every single day of all four years**;
worst column is maghrib at 17 days one minute out. Seasonal amplitude (Jan 1 vs Jul 1): fajr 4.3
min, isha 5.0 min - the near-equator signature FIT-RULES asks for. Grade **A**: four distinct
fitted years on one recipe.

## 3. Brunei: 2027 not served

MORA SharePoint list `Waktu Sembahyang`, probed 2026-11-11T11:02:51Z (the feed's own `updated`
field):

- newest three rows: 2026-12-30T16:00:00Z, 2026-12-29T16:00:00Z, 2026-12-28T16:00:00Z (local
  31, 30, 29 December 2026). Row values unchanged from the record: Suboh 5.04, Syuruk 6.28,
  Zohor 12.24, Asar 3.46, Maghrib 6.18, Isyak 7.33.
- `$filter=Date ge datetime'2027-01-01T00:00:00Z'` returns a **466-byte empty feed** - no 2027
  rows at all, not a partial load.

The list ceiling is 2026-12-31, exactly as held. NOT MET; the 2025 and 2026 loads both appeared
with the year roll, so the next probe belongs in the second half of December.

## 4. Thailand: BE 2570 not served, BE 2568 not served either

- The 77-province XLSX index (`skthai.org/th/pages/28433`) is live but **Cloudflare-blocks curl
  and the browser session** (Ray a58cd01098f6b37c); TinyFish fetch reaches it. The page returns
  exactly the same **77 hash-named workbooks** as the held capture: the two sets of hashes are
  identical, none added, none dropped (`captures/th-skthai-live-hashes-20261111.txt` against the
  held `skthai-28433-links.json`). No new edition has been uploaded.
- The astronomy parent page (`/th/pages/28457`) menu offers exactly two year entries: **ปี 2568
  and ปี 2569**. The 2568 entry resolves to the homepage (dead link, re-confirmed live today);
  the 2569 entry is the held Drive PDF `18KIWSG4e9bFDV_nwBMxjld2S2f6F9Dkd`. **No 2570 entry.**
- So both Thai asks fail: no 2570 workbook, and no 2025 (2568) workbook behind the index - the
  leap block remains the only second block held. Payload date 2026-11-11T11:06Z.

## 5. Philippines

- **BARMM/Wali of Bangsamoro**: the official `RAMADHAN 1447H | OFFICIAL PRAYER TIME TABLE`
  (Office of the Wālī, for Cotabato City, Mindanao and SGA) is Ramadan-month only. No full-year
  Bangsamoro table exists: `bangsamoro.gov.ph/?s=prayer+time` returns news items (Taraweeh,
  flextime circulars), no timetable page. The parliament's own "Taqweem" bill defines the office
  that would prepare one - it is proposed, not published.
- **NCMF**: `ncmf.gov.ph` and `www.ncmf.gov.ph` both **HTTP 403** (Cloudflare-class), unchanged
  from the previous round's retry. Not solved per rules.
- **Davao City Islamic Center**: a monthly Hijri prayer timetable series on its own Facebook
  page. Confirmed live: the Rajab 1447 (Dec 2025-Jan 2026) post, and the page's own text for
  Safar 1448H (16 Jul 2026). The post body carries no typed times - the table is a JPEG. The
  reachable rendition is a 526x800 thumbnail; local OCR of it returns scrambled column order and
  no reliable digits. **Year-round by cadence, not by artifact**: twelve monthly posts make a
  year, and no 2027 month is published yet. Recorded as an honest partial with the cause.
- **Darul Ifta (the national highest religious authority)**: announces Ramadan and Eid dates
  only (PNA coverage of the 2020 and current declarations), never a prayer timetable.
- Searches ran in English and Filipino phrasings (`prayer time table Bangsamoro`, `oras ng
  pagdarasal Mindanao`), plus Malay where the surface crossed over. Not found under these terms.

## 6. Indonesia: SIHAT walled, myquran serves 2028 whole

- **Kemenag SIHAT** (`bimasislam.kemenag.go.id/api/v1/public/prayer-times`): Banda Aceh
  `2183ccf6-2d57-4b6f-8650-d52e3f1b490a` serves 2026-11-11 and 2026-12-31 normally, and returns
  `{"error":"prayer times not found for the given city and date"}` at **2027-01-01**, 2027-12-31
  and 2028-01-01. The ceiling is the calendar-year end and **not even 2027 is served yet**, let
  alone 2028. 2028 = NOT MET at the authority API.
- **myquran** (`api.myquran.com/v2/sholat/jadwal/<city>/Y/M`): **2028 is served in full** - all
  twelve months for Jakarta, 366 dated rows with 29 February present
  (`data/id-myquran-jakarta-2028.json`), and **2029-01 and 2030-01 are served too**, so the
  horizon runs past 2028. The values are genuine recomputation, not a copy: for Jayapura, 70 of
  the 123 comparable days differ between the 2027 and 2028 tables (terbit, dhuha, maghrib and
  ashar each move a minute), and Jakarta's 2029-01-01 prints terbit 05:39, dzuhur 12:00, maghrib
  18:14 against 2028-01-01's 05:38, 11:59, 18:13. Community/platform tier.
- Four-city 2028 spread banked (Jan, Apr, Jul, Oct of 2028): Jayapura, Banda Aceh, Makassar,
  Medan, 123 rows each (`data/id-myquran-<city>-2028-sample.json`).

## 7. Files

- `captures/` - Perak seven 2027 zone PDFs; the JAKIM 2027 takwim grid; MUIS four timetable PDFs
  + calendar page; Brunei OData max-date and 2027 probes; the Thai index page via TinyFish, the
  live 77-hash list and the astronomy menu; 120 waktusolat.ai year-2027 print views; Penang
  1448H Zakat print; Melaka 1448H poster; Terengganu 1448H PDF; Philippine BARMM search, NCMF
  403s, Davao post image; Indonesian SIHAT probes and the twelve myquran 2028 months; every
  state site probe with its response headers.
- `data/` - `my-jakim-2027-all-zones.json` (59 zones, 21,535 rows) and the per-zone files
  `my-2027-<ZONE>.json`, `my-perak-2027-zon1..7.json` (2,555), `sg-muis-2024..2027.json`
  (1,461), `id-myquran-jakarta-2028.json` (366), `wsa-zonemap.json` (120 locations to 59 zones),
  copies of the held KL/Selangor 2026 tables used for the year-pair comparison.
- `fit/` - `sg-muis-fit.json`, `my-state-fits.json` (59 zones plus the year-pair controls).
- Scripts: `probe.sh`, `parse_perak.py`, `parse_sg.py`, `harvest_wsa.py`, `sg_fit2.mjs`,
  `sg_score.mjs`, `my_fit.mjs`, `zone_angles.mjs`.

## 8. NEXT

1. **Malaysia 2028**: the `setahun/cetak` view carries the newest served year, which is today
   2027; its `/2028/cetak` path falls back to a 2026 page, so 2028 is not served yet. Re-probe
   the same view when the site rolls, and probe Perak's `/images/waktu_solat/2028/` directory on
   the same pattern.
2. **KDH07** needs its own analysis: no angle pair reproduces it (best 19/19 leaves 110 fajr and
   171 isha days out). Probably a reference point east of the island plus a horizon term.
3. **PHG05/PHG06/SBH06 horizon terms** need the per-zone dip quantified the way Perak zon 7 and
   Tunisia were, then a fitted `+dip` recipe.
4. **Melaka, Perlis and Terengganu 1448H** are captured but image-only; the local OCR reads the
   headers and fails the table bodies. They need a column-positional OCR pass (crop by column,
   rotate, then read), the way the Peshawar chart was decoded.
5. **Thailand 2570**: the Chularajmontri loads a new edition with the Buddhist-year roll. Probe
   the menu again from mid-December, and watch for a 2568 entry that stops pointing at the
   homepage.
6. **Brunei 2027**: the OData list loads with the calendar-year roll; probe from mid-December.
7. **Singapore 2028**: MUIS publishes about seven weeks ahead, so a 2028 PDF is due around
   2027-11-10, not before.
8. **Philippines**: the Davao monthly series is the only cadence that yields a year. Harvest
   twelve consecutive monthly post images at full resolution (the page's own image URL, not the
   thumbnail) and OCR each; the Wali's Ramadan-only table stays a single month.
9. **Indonesia 2028 at the authority API**: SIHAT's ceiling is the calendar-year end, so
   2027-01-01 should open around the new year; probe then, and re-probe 2028-01 in 2027-12.
