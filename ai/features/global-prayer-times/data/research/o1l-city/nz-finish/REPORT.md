# O1l-54 — NZ sheets and Pacific finish

Agent O1l-54. Workspace `$HOME/athan-gitree/census/o1l-city/nz-finish/`. No repository edits, public
pages only, no login, no subagents. Engine adhan 4.4.6
(`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`), `Rounding.None`, TZ `Pacific/Auckland`,
local dates built from the literal capture strings, no clock reads. Maghrib read as sunset + 5 per the
note printed on every sheet.

## 1. NEW ZEALAND — all 34 FIANZ 1447H city sheets transcribed

**Surface.** `fianz.com/ramzan-calendar/` 1447H (2026) city images, captured live by O1l-19r on
2026-11-11 (`captures/nz-fianzcom-1447-<city>.jpg`, 34 files, copied into this workspace). The
live-page gate passed in the prior wave; the images are the artifact.

**Transcription.** The 34 sheets are images, not text. Vision's accurate text model fails in this
environment (`e5rt_execution_operation_create_precompiled_compute_operation_with_options`, ANE), so
OCR runs the fast model on a 2x upscale and cells are assigned by geometry: header labels fix the
column centres, time cells cluster into 30 row bands. Every cell that lands empty or unparsable is
re-cropped alone at 3-4x. The assembled grid is then held to the sheet's own printed rules and to
day-to-day smoothness; a cell that jumps against both neighbours is re-read wider and replaced only
when the wider read is closer to the neighbour interpolation.

- **34 of 34 sheets, 30 rows each, 1020 dated rows**, all six columns, no cell left null.
  `data/nz-2026-<city>.json`, manifest with every repair in `data/manifest-2026.json`.
- **Reproduces the human transcription.** The prior wave transcribed three sheets by eye
  (Dunedin, Hamilton, Tauranga). The pipeline reproduces all 540 cells byte for byte, zero diffs.
- **Visual spot checks** against the images: Te Kuiti, Rotorua and Taupo, four rows each, all exact.
- Repairs logged, all of one kind: row 19's isha prints as `19:xx` on 28 sheets and reads back as
  `09:xx` after the smoothness pass. One genuine print defect: **Rotorua row 30 asr is overprinted**
  (`4:50` struck through with `5:16`); the sheet's own run gives 04:50 and that is what is banked,
  recorded in the data as a print defect, not a read.
- Clock: the sheets print a 12-hour clock; afternoon columns take +12 where the printed hour is
  below 12. Dates: Ramadan 1 is 19 February 2026 on every sheet, and the printed date column agrees
  on every row where OCR read it (zero mismatches).

**Printed method, verbatim and identical on all 34 sheets** (footer band OCR'd separately per image,
`captures/nz-1447-footer-notes.json`, one distinct string across 34): "5 minutes allowed between end
of Suhur and Fajr. 5 minutes allowed between sunset and Iftar/ Maghrib. Asr time is based on single
shadow. Asr time based on double shadow is 40 mins later."

**Dated regime change, re-confirmed at full width.** The 2006 sheets print the double-shadow asr at
**1 hour 15 mins**; all 34 of the 2026 sheets print **40 mins**. Same federation, same template,
twenty years apart. The printed note is not a constant of the publisher.

## 2. The twenty-year identity, city by city

One procedure on both years, so the comparison is like with like: the pair is fitted on fajr and isha
at the town's own coordinates, exactly as the prior wave fitted the 2006 set. The pair is strongly
identifiable — at Blenheim the best pair leaves 0.5 min and the neighbouring candidate pairs leave
6.6, 12.9 and 19.3 min, so a sheet names its own angles to well inside a degree.

| city | 2026 pair | fit | pair worst | day-length excess | zuhr offset | 2006 pair | 20-year |
|---|---|---|---|---|---|---|---|
| Ashburton | 15/15 | 14.98/15.06 | 0.6 | 0 | −0.08 | — | new city |
| Auckland | 18/18 | 18.06/18.06 | 0.7 | 0.2 | −0.15 | 18/18 | **identical** |
| Balclutha | 15/15 | 14.98/15.04 | 0.5 | 0 | −0.08 | — | new city |
| Blenheim | 15/15 | 15.02/15.06 | 0.6 | 0 | −0.06 | — | new city |
| Christchurch | 16/15 | 15.96/15.10 | 0.7 | 0.5 | −0.3 | 16/15 | **identical** |
| Dannevirke | 18/17 | 17.96/17.02 | 0.7 | 0 | 0.06 | — | new city |
| Dargaville | 18/17 | 17.98/17.00 | 0.6 | 0.1 | 0.01 | — | new city |
| Dunedin | 16/15 | 15.98/15.15 | 2 | 1.2 | −0.02 | 16/15 | **identical** |
| Feilding | 18/17 | 17.96/17.02 | 0.7 | 0 | 0.04 | — | new city |
| Gisborne | 18/17 | 17.96/16.75 | 0.8 | -0.6 | 0.67 | — | new city |
| Gore | 16/15 | 15.81/15.44 | 2.1 | 1.5 | −1.41 | — | new city |
| Greymouth | 15/15 | 14.98/15.06 | 0.5 | 0 | −0.09 | 16/18 | **changed** |
| Hamilton | 18/18 | 17.96/18.00 | 0.9 | 0.2 | −0.23 | 18/18 | **identical** |
| Hastings | 15/15 | 15.00/15.04 | 0.5 | 0.1 | 0.06 | 15/19 | **changed** |
| Hawera | 17/17 | 16.85/17.19 | 0.8 | 0.8 | −0.93 | — | new city |
| Invercargill | 16/15 | 15.92/15.08 | 1.9 | 0.9 | −0.08 | 16/15 | **identical** |
| Masterton | 17/17 | 17.10/17.37 | 0.7 | 4.8 | −0.12 | — | new city |
| Napier | 16/15 | 16.02/15.10 | 0.6 | 0.4 | −0.25 | 16/15 | **identical** |
| Nelson | 16/15 | 16.00/15.10 | 0.6 | 0.4 | −0.23 | 16/15 | **identical** |
| New Plymouth | 17/17 | 17.02/17.25 | 0.6 | 1.4 | −0.13 | 17/17 | **identical** |
| Oamaru | 15/15 | 15.00/15.00 | 0.6 | 0 | 0.04 | — | new city |
| Palmerston North | 17/17 | 17.04/17.02 | 0.6 | 0.4 | 0.11 | 17/17 | **identical** |
| Queenstown | 16/15 | 15.92/15.21 | 1.9 | 7.5 | −0.35 | 16/15 | **identical** |
| Rotorua | 17/17 | 16.83/17.11 | 1 | 5.6 | −0.34 | 17/17 | **identical** |
| Taihape | 17/17 | 17.12/17.35 | 0.6 | 8.4 | −0.05 | — | new city |
| Taupo | 17/17 | 17.17/17.31 | 0.8 | 7.8 | −0.1 | — | new city |
| Tauranga | 17/17 | 16.88/17.15 | 0.8 | 0.6 | −0.13 | 17/17 | **identical** |
| Te Kuiti | 18/17 | 17.98/17.00 | 0.7 | -0.1 | −0.03 | — | new city |
| Te Puke | 18/17 | 17.96/17.08 | 0.7 | -0.1 | −0.03 | — | new city |
| Timaru | 15/15 | 14.98/15.02 | 0.5 | 0 | −0.08 | — | new city |
| Wairoa | 18/17 | 18.04/16.96 | 0.7 | 0 | 0.21 | — | new city |
| Whanganui | 18/17 | 17.94/17.06 | 0.6 | 0 | −0.18 | — | new city |
| Wellington | 16/15 | 16.04/15.19 | 0.9 | 3.3 | 1.47 | 16/15 | **identical** |
| Whangarei | 19/18 | 19.02/18.36 | 2.8 | 0.2 | −0.09 | — | new city |

`pair` is the continuous fit; `pair worst` is the largest fajr or isha residual in minutes at that
pair; `day-length excess` is the printed day length (iftar minus 5, minus sunrise) against adhan's,
in minutes; `zuhr offset` is printed zuhr minus adhan's solar noon at the town, i.e. how far east or
west the sheet's own reference point sits (1 min ≈ 0.25° of longitude).

**The verdict.**

- **Thirteen of fifteen two-year cities carry the identical pair, twenty years apart.** Auckland
  18/18, Hamilton 18/18, Christchurch 16/15, Dunedin 16/15, Wellington 16/15, Invercargill 16/15,
  Napier 16/15, Nelson 16/15, Rotorua 17/17, Tauranga 17/17, Queenstown 16/15, New Plymouth 17/17,
  Palmerston North 17/17. Two do not, and both are broken on the 2006 side.
- **Two changed, and both are the two cities whose 2006 sheet is internally broken.** Greymouth
  2006 prints zuhr 9.0 minutes before solar noon at the town and Hastings 10.5 minutes before, with
  fajr and isha still reading the town; the prior wave reached the same two sheets and read the
  displacement as a reference point about 2.5° east. Those 2006 rows cannot support a pair claim, so
  the honest reading is **not "changed" but "the 2006 side is defective"**: 2006 16/18 and 15/19
  against 2026 15/15 and 15/15, on sheets that disagree with themselves by 9-10 minutes.
- **Nineteen cities are new to the record**: Ashburton 15/15, Balclutha 15/15, Blenheim 15/15,
  Dannevirke 18/17, Dargaville 18/17, Feilding 18/17, Gisborne 18/17, Gore 16/15, Hawera 17/17,
  Masterton 17/17, Oamaru 15/15, Taihape 17/17, Taupo 17/17, Te Kuiti 18/17, Te Puke 18/17,
  Timaru 15/15, Wairoa 18/17, Whanganui 18/17, Whangarei 19/18.
- **The pairs are not one national recipe, in either year.** The 2026 set carries six distinct pairs
  across 34 cities: 16/15 (8), 18/17 (8), 17/17 (8), 15/15 (7), 18/18 (2), 19/18 (1). The 2006 set
  carried 18/18, 17/17, 16/15 and the two defective sheets. So the FIANZ line is a per-city pair
  table that has held for twenty years, not a single national angle set.

**Span.** 2006 Ramadan (25 Sep – 25 Oct, 465 rows, 15 cities) + 2026 Ramadan (19 Feb – 20 Mar, 1020
rows, 34 cities) = **1485 dated rows, 34 cities**. No year-round FIANZ publication exists; the
Ramadan sheet is the whole artifact. Forward longevity: **stable-across-20-years** on thirteen cities,
two fitted years on one pair each. Ceiling unchanged: Ramadan windows only.

**Drift at the degree level, on the thirteen that held.** The continuous fits differ by at most
0.15° on fajr (Auckland +0.04, Christchurch +0.02, Hamilton 0.00, New Plymouth 0.00, Wellington
+0.10, Dunedin −0.15) and by +0.02 to +0.37 on isha, positive in sign on all thirteen (Tauranga
+0.36, New Plymouth +0.37, Rotorua +0.30, Dunedin +0.27). A tenth of a degree is a minute of
twilight at these latitudes, so fajr is frozen to the resolution a 30-day window can carry; the isha
sign consistency is the one systematic movement in twenty years, worth a fraction of a minute, and
it is the same direction as the sunrise/iftar term shrinking between the years.

**Seasonal amplitude** (FIT-RULES 3), Jul 15 minus Jan 15 at each city's fitted pair and point:
fajr **+83 minutes at Dargaville to +163 at Invercargill**; isha **−207 at Dargaville to −283 at
Invercargill**. The north-to-south ladder runs Dargaville 83, Whangarei 84, Auckland 89, Tauranga 92,
Hamilton and Rotorua 95, Gisborne 101, Napier 102, Palmerston North 111, Blenheim and Wellington
114-115, Christchurch and Ashburton 133, Timaru 137, Oamaru 144, Queenstown 148, Balclutha 154,
Dunedin and Gore 157, Invercargill 163. The high-latitude swing the record expects, on a 34-city
ladder rather than a single point.

## 3. The sunrise and iftar defect — a per-city term adhan does not model

Beyond the pair, the sheets carry a defect in the two day-length columns. Printed sunrise runs up to
4 minutes earlier than adhan's and printed iftar up to 4 minutes later, so the printed day is longer
than the solar day at the town:

| group | cities | printed day minus adhan's (minutes) |
|---|---|---|
| clean | 20 cities incl. Auckland 0.2, Christchurch 0.5, Timaru 0.0, Blenheim 0.0 | −0.6 to +1.5 |
| long | Taihape 8.4, Taupo 7.8, Queenstown 7.5, Rotorua 5.6, Masterton 4.8, Wellington 3.3 | +3.3 to +8.4 |

- The six largest track town elevation for four of six (Taihape 439 m, Taupo 385 m, Queenstown 318 m,
  Rotorua 290 m; elevations from `api.open-meteo.com/v1/elevation`, `captures/elevations-*.json`),
  which reads as an observer-height or horizon-dip term. It fails for the other two: Wellington is at
  3 m and Dannevirke at 205 m carries 0.0.
- **It is not a displaced reference point.** A joint fit over all six columns, latitudes −47 to −34
  in 0.5° steps with the angles refitted at each, puts Taupo at −41.5° with 16/16 and still leaves
  1.2 minutes per column; no point reproduces the six columns together. The sheet's zuhr is within
  0.1 minute of solar noon at the town, so its longitude is the town's.
- **It does not touch the pair.** fajr and isha fit within 0.5-1.0 minutes at the fitted pair in 30
  of 34 cities, and the residual is smooth across the month, not scattered by day, so no cell is
  misread. The same six cities show the same habit in 2006 (Rotorua 6.2, Queenstown 9.0), so it is a
  publisher convention that survived the twenty years, and its magnitude roughly halved (Queenstown
  9.0 to 7.5, Rotorua 6.2 to 5.6, Dunedin 2.9 to 1.2, Invercargill 2.5 to 0.9).
- **Flagged for the owner, not adjudicated.** adhan 4.4.6 has no observer-height term, so an
  Athan.uk fit to this surface must either accept the 1-2 minute sunrise/iftar residual or carry a
  per-city dip. Nothing here says which side is right.

## 4. Pacific finish — the closed surfaces and the ten negatives, one more pass each

Probed 2026-11-11, 06:5x-07:1x UTC. Captures in `captures/pacific/`.

**Guam — Baab, re-read word for word, unchanged.** `openbaab.com/masjid/masjid-al-noor-10` (HTTP
200, 9,337 B). The page's own sentence, twice: "Calculated for this location; the masjid has not
posted iqama times" and "The masjid has not posted iqama times yet." Its dated row for 2026-11-11 is
identical to the prior capture (fajr 5:18, dhuhr 12:06, asr 3:23, maghrib 5:51, isha 6:52). A
platform computing for an address is citable, never a surface. **FALLBACK holds.**

**Northern Mariana Islands — Baab, same verdict, both pages.** `openbaab.com/masjid/saipan-central-mosque`
(HTTP 200, 9,578 B) carries the identical disclaimer and the identical dated row (fajr 5:16, dhuhr
12:02, asr 3:19, maghrib 5:45, isha 6:46). Baab lists exactly 2 masjids in Saipan and 1 in Guam, so
the directory is exhausted at three pages. **FALLBACK holds.**

**Guam and Saipan mosque pages.** `facebook.com/p/Masjid-An-Noor-Guam-100064602373210/` renders its
intro and not its posts: the timeline sits behind a login wall on this host (same block the prior
wave hit on the Fiji page). No timetable is reachable without a login, and a login is out of bounds.
Recorded as a block, not a negative.

**Palau — the demo block, now with a dated header.** `palaucentralmosque.com` (HTTP 200, 140,988 B)
prints "1th Jumada-Al-Thani, 1448 - Wed, 11th Nov, 2026 - Palau" above Fajr 7:50 AM, Zuhr 2:42 PM,
Asr 5:52 PM, Magrib 8:14 PM, Isha 9:44 PM, Sunrise 9:10 AM, Sunset 8:14 PM. The header is
date-aware, the numbers are not: at Koror (7.34 N, 134.48 E) sunrise runs 05:50-06:20 and sunset
17:50-18:30 on every day of the year, and this block's 11-hour day with a 14:42 transit is a
mid-northern-latitude winter day. A theme's demo content behind a real mosque's domain. **FALLBACK
holds**, and the prior wave's reading is confirmed rather than overturned.

**The ten negatives, new phrasings and local languages.** One further pass each; every hit is an
aggregator calculator (muslimpro, islamicfinder, athanpro, quranmajeed, hamariweb, salahtimes,
matwproject) or a news article, and not one is a mosque or society publishing a dated table.

| territory | phrasings tried this pass | what came back |
|---|---|---|
| Papua New Guinea | "Port Moresby mosque prayer time Boroko Islamic Society" | PrayWatch/AlAdhan calculator, Tripadvisor, Wikipedia (Hohola Mosque) |
| Solomon Islands | "Honiara Solomon Islands mosque prayer time schedule" | four aggregators only |
| Vanuatu | Bislama `"taem blong prea" mosk Vanuatu Port Vila` | unrelated Facebook posts, one skincare page; no mosque page |
| Samoa | "Apia Samoa mosque prayer times timetable Muslim" | Masjid Mariam Facebook photo posts, Peace Corps essay, aggregators |
| Kiribati | "Tarawa Kiribati mosque prayer times timetable", "Boutabu mosque Tarawa" | aggregators; the Boutabu query returns a US centre |
| Tuvalu | "Funafuti Tuvalu mosque prayer times timetable Muslim" | three aggregators |
| Nauru | "Nauru Yaren mosque prayer times Muslim community" | three aggregators |
| Cook Islands | "Rarotonga Cook Islands Muslim prayer times mosque" | RNZ and Wikipedia on Masjid Fatimah Rarotonga (first mosque, 2018); no timetable |
| Niue | "Niue Alofi Muslim prayer times" | three aggregators |
| Tokelau | "Tokelau Muslim prayer times mosque" | three aggregators |

Two genuine enrichments for the record, both short of a surface: the Cook Islands' mosque is named
and dated (Masjid Fatimah, Titikaveka, Rarotonga, established 2018, RNZ + Wikipedia), and Guam's
mosque is named with an address and phone (Masjid An-Noor, Mangilao). Neither publishes times.

**Fiji — December not published.** `fml.com.fj/prayer-time/` (HTTP 200, 251,794 B, captured) still
serves the twelve 2024 links: the December entry resolves to `wp-content/uploads/2024/06/December-2024.jpg`
and no 2026 month exists anywhere on the page (the only 2026 uploads are branding assets). The
League's Facebook timeline is login-walled this pass, so a December post cannot be excluded there,
only reported unreachable. Verdict: **not due**, probed anyway at 2026-11-11 07:00 UTC; re-probe
after 2026-11-25, when the November post went up on 30 October.

## Data files

`data/nz-2026-<city>.json` (34 files, 1020 dated rows), `data/manifest-2026.json` (repairs per city),
`data/nz-2026-fit.json`, `data/nz-2006-fit.json`, `data/nz-20year.json` (pair test + the 19 new
cities), `data/nz-2006-ramadan-15cities.json` (copied from O1l-19r for the comparison). Captures: the
34 sheet images, the 15 2006 PDFs, the footer-note OCR, the elevation response.
