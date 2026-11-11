# Malaysia year-2: the 2027 state tables, and the federation test

Agent tag `my2027`. Captured 2026-11-10. Every source below is an official publication of a
state mufti department, JAKIM, or the Federal Territories mufti. Public pages only, GET only, no
login, no challenge solved, no contact with any body, no subagents. Nothing written outside this
workspace.

Inputs are the 57 JAKIM zone tables for 2026 harvested from e-Solat (365 rows each), the eleven
2027 tables published so far, and JAKIM's own `Lampiran B` reference-point register. The engine
is the in-repo adhan 4.4.6 build at second resolution with explicit rounding afterwards; no clock
is read anywhere.

## 1. What exists for 2027, state by state

Malaysia publishes its annual tables in the last quarter of the preceding year. Today, seven
weeks before the year, two publishers have shipped: the Federal Territories mufti and the
Selangor mufti.

| State / territory | 2027 table | 2026 table | Verdict |
| --- | --- | --- | --- |
| Perlis | none | none on the mufti site | NEGATIVE |
| Kedah | none | none on the mufti site | NEGATIVE |
| Penang | partial: one 1448 H grid, 2026-06 to 2027-06 | same artifact | PARTIAL |
| Perak | not yet published | 7 zones, captured and parsed | 2026 ONLY |
| **Selangor** | **9 district PDFs, 365 rows each** | 3 zones | **CAPTURED** |
| Negeri Sembilan | none | 2024 image-only zone PDFs | NEGATIVE |
| Melaka | 1448 H poster, 2 pages, image-only | 1446/1447 posters | PARTIAL |
| Johor | none | 2026 poster set (JPEG) plus a scanned PDF | 2026 ONLY |
| Pahang | none | e-Solat only | NEGATIVE |
| Terengganu | none | e-Solat only | NEGATIVE |
| Kelantan | none | e-Solat only (monthly Facebook posters) | NEGATIVE |
| Sabah | none | e-Solat only | NEGATIVE |
| Sarawak | none | e-Solat only | NEGATIVE |
| **WP Kuala Lumpur + Putrajaya** | **365 rows** | 365 rows | **CAPTURED** |
| **WP Labuan** | **365 rows** | 365 rows | **CAPTURED** |

Eleven 2027 tables, 4,015 dated rows, all parsed monotonic with no gaps and no duplicate dates.

### Surfaces

| Source | URL | Tier | Dated data | Years |
| --- | --- | --- | --- | --- |
| JAKIM e-Solat zone API | `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=year&zone=<code>` | authority | 7 fields per day, 57 zones | 2026 only; `year=2027` still ignored |
| JAKIM `Lampiran B`, "Titik Rujukan Hitungan Waktu Solat" | `https://www.e-solat.gov.my/portalassets/files/Lampiran%20B.pdf` | authority | the reference point of every zone, east and west where a zone carries two, with elevations | undated register |
| JAKIM 2027 Hijri-Miladi calendar | `https://www.e-solat.gov.my/portalassets/files/Takwim%20Hijri%20Miladi%202027.pdf` | authority | calendar only, image-only, no prayer times | 2027 |
| Jabatan Mufti WP, KL + Putrajaya | `.../jadual-waktu-solat/KL-dan-Putrajaya/JADUAL_WAKTU_SOLAT_WP_KL-PUTRAJAYA_2027.pdf` | authority | 365 rows, 7 fields | **2027** |
| Jabatan Mufti WP, Labuan | `.../jadual-waktu-solat/Labuan/JADUAL_WAKTU_SOLAT_WP_LABUAN_2027.pdf` | authority | 365 rows | **2027** |
| Jabatan Mufti Selangor, nine district PDFs | `https://www.muftiselangor.gov.my/takwim-solat/` | authority | 365 rows each | **2027** |
| Jabatan Mufti Perak, seven zone PDFs | `https://mufti.perak.gov.my/images/waktu_solat/2026/Zon%20N%202026.pdf` | authority | 365 rows each | 2026 |
| Jabatan Mufti Penang, 1448 H grid | `https://mufti.penang.gov.my/images/Articles/Takwim_2026_2027_1448H.pdf` | authority | Hijri-month grid, 13 pages | 2026-06 to 2027-06 |
| Jabatan Mufti Melaka, 1448 H poster | `https://muftimelaka.gov.my/uploads/page_content/p90/20260716234858_81a68de61dd6.pdf` | authority | 2 pages, image-only | 1448 H |
| Jabatan Mufti Johor, takwim | `https://mufti.johor.gov.my/perkhidmatan/muat-turun/jadual-takwim/` | authority | 2026 JPEG set, plus a 14-page scan | 2026 |
| Selangor mufti, 2027 coordination workshop | `https://www.muftiselangor.gov.my/2026/02/12/bengkel-penyelarasan-takwim-waktu-solat-negeri-selangor-tahun-2027/` | authority | notice only | 2027 |
| Selangor mufti, westernmost-point ruling | `https://www.muftiselangor.gov.my/2023/10/27/...pulau-perak...` | authority | the national westernmost reference moved from Tanjung Chinchin to Pulau Perak for calendar computation, effective 2022 | 2022 |

## 2. What confirms the census record

The 2026 harvest covers the whole federation: 57 zone tables, 20,805 dated rows. At
the reference point each table implies, the printed rows follow one arithmetic:

| Field | Rule that reproduces 2026 | Exact / 20,805 |
| --- | --- | --- |
| fajr | ceil(18°) | 17,536 (84.3%) |
| sunrise | floor(sunrise) | 11,490 (55.2%) |
| dhuhr | round(transit + 1.5) | 19,746 (94.9%) |
| asr | ceil(Shafi shadow) | 16,355 (78.6%) |
| maghrib | ceil(sunset) | 16,684 (80.2%) |
| isha | ceil(18°) | 17,828 (85.7%) |

The angle sweep is a delta function, which is the strongest confirmation in this report: for
every zone, the count of exactly reproduced days is at its maximum at one angle and is **zero** at
every neighbouring half-degree tested.

| Zone | isha 16.0 | 16.5 | **17.0** | 17.5 | **18.0** | 18.5 | 19.0 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| KTN01 | 0 | 0 | **331** | 0 | 0 | 0 | 0 |
| KTN02 | 0 | 0 | **337** | 0 | 0 | 0 | 0 |
| JHR02 | 0 | 0 | 0 | 0 | **323** | 0 | 0 |
| TRG01 | 0 | 0 | 0 | 0 | **330** | 0 | 0 |
| SWK08 | 0 | 0 | 0 | 0 | **335** | 0 | 0 |

Fajr peaks the same way at 18.0 for every zone swept (WLY01 259, SGR01 249, KTN01 343, SWK08 342,
SBH05 333). So fajr 18 whole federation is confirmed on 57 zones and the Kelantan exception is
confirmed on isha.

`Pulau Pinang`'s multipoint rule is also on the record and measurable: `Lampiran B` gives Pantai
Acheh as the zone point with "Bukit Bendera minus 3 minutes on subuh, syuruk and dhuha, plus 3
minutes on maghrib".

### The one correction to the census recipe

The board's margin set +2 / -1 / +1.5 / +2 / 0 / +2 does not reproduce the tables it was fitted on:

| Field | Census margins | Exact on 2026 | Measured margins | Exact on 2026 |
| --- | --- | --- | --- | --- |
| fajr | +2 | 43 (0.2%) | 0 | 17,536 (84.3%) |
| asr | +2 | 114 (0.5%) | 0 | 16,355 (78.6%) |
| isha | +2 | 16 (0.1%) | 0 | 17,828 (85.7%) |

This is point-independent and not an engine artefact. Inside one table every field is computed at
the same point, so a longitude error cancels in the difference between two fields. Holding zohor
at +1.5, which reproduces 94.9% of rows, the printed subuh sits on the plain 18° ceiling to within
0.17 minutes; a +2 margin would have to print it 1.85 minutes later than it does. The same test
kills the margin on isha and asr. Only zohor carries an additive ihtiyati (+1.5); the other five
fields are the plain astronomical value. The census's maghrib 0 and dhuhr 1.5 survive; its three
+2 margins do not.

Sunrise is the one field a single point cannot carry, and it is the multipoint rule made visible.
Solving each 2026 table for the longitude that reproduces its own syuruk:

| Zone | Zohor point | Implied syuruk point | Offset | Exact at that point |
| --- | --- | --- | --- | --- |
| WLY01 | 101.370 | 101.730 | +0.36° | 262/365 |
| SGR01 | 101.370 | 101.940 | +0.57° | 184/365 |
| PRK01 | 101.057 | 101.600 | +0.54° | 253/365 |
| PNG01 | 100.171 | 100.600 | +0.43° | 324/365 |
| KDH01 | 100.173 | 100.670 | +0.50° | 329/365 |
| KTN01 | 101.973 | 101.990 | +0.02° | 349/365 |
| TRG01 | 102.958 | 102.960 | 0.00° | 342/365 |

The implied points reproduce `Lampiran B`'s own eastern entries: 101.730 against Cheras 101.758 for
Kuala Lumpur, 101.600 against Hulu Bernam 101.625 for Perak zone 1. Compact zones do not move at
all. Sunrise is therefore not a defect in the recipe; it is the same reference-point machinery
that the 2027 subuh move uses, and a bake needs the second point per zone.

## 3. The between-year test

Method. Each table's own reference point is recovered from that table: longitude from zohor (the
transit is exactly linear in longitude, 4 minutes per degree), latitude from the other five fields.
The recovery reproduces JAKIM's own `Lampiran B` longitudes to within 0.03° (0.12 minutes) on six of
the seven zones checked and 0.08° on Selangor zone 2, which is what licenses using it as a point
estimate.

| Zone | Recovered 2026 point | `Lampiran B` point | Difference |
| --- | --- | --- | --- |
| WLY01 | 101.370 | Kg. Gedangsa 101.383 | 0.013° |
| WLY02 | 115.122 | Pulau Kuraman 115.140 | 0.018° |
| SGR01 | 101.370 | Kg. Gedangsa 101.383 | 0.013° |
| SGR03 | 101.236 | Pulau Ketam 101.250 | 0.014° |
| KTN01 | 101.973 | Rantau Panjang 101.983 | 0.010° |
| PLS01 | 100.103 | Kuala Perlis 100.122 | 0.019° |
| JHR02 | 103.508 | Kg. Sedenak 103.533 | 0.026° |

Exact-match counts are delicate: a 0.01° point error costs about a tenth of them, because the
ceiling flips whenever the computed second lands near an integer. The percentages below are
therefore relative measures, and the conclusions drawn from them rest on effects 6 to 30 times
that sensitivity.

Result, 2027 tables scored at their own recovered point:

| Field | Exact / 4,015 | Within 1 min |
| --- | --- | --- |
| dhuhr | 3,950 (98.4%) | 100.0% |
| asr | 3,464 (86.3%) | 100.0% |
| maghrib | 3,784 (94.2%) | 100.0% |
| isha | 3,807 (94.8%) | 100.0% |
| fajr | 513 (12.8%) | 98.7% |
| sunrise | 130 (3.2%) | 53.3% |

Four of the six fields are **better** in 2027 than in 2026 (dhuhr 98.4 against 94.9, asr 86.3
against 78.6, maghrib 94.2 against 80.2, isha 94.8 against 85.7). The twilight angles, the asr
shadow factor, the ceiling and the zohor ihtiyati all transfer unchanged.

**The one thing that moved is subuh's reference point, and it moved on the peninsula only.** The
printed 2027 subuh sits one minute earlier than an 18° ceiling at the zohor point. Solving for the
longitude that reproduces it:

| Table | Zohor point | Subuh point | Offset | Exact at that point |
| --- | --- | --- | --- | --- |
| WP KL + Putrajaya | 101.423 | 101.665 | +0.242° | 358/365 |
| Selangor: Petaling | 101.423 | 101.665 | +0.242° | 358/365 |
| Selangor: Gombak | 101.425 | 101.670 | +0.245° | 356/365 |
| Selangor: Klang | 101.221 | 101.460 | +0.239° | 351/365 |
| Selangor: Hulu Langat | 101.719 | 101.950 | +0.231° | 337/365 |
| Selangor: Sepang | 101.566 | 101.780 | +0.214° | 327/365 |
| Selangor: Hulu Selangor | 101.316 | 101.550 | +0.234° | 346/365 |
| Selangor: Kuala Selangor | 101.082 | 101.345 | +0.263° | 358/365 |
| Selangor: Sabak Bernam | 100.805 | 101.055 | +0.251° | 360/365 |
| Selangor: Kuala Langat | 101.269 | 101.540 | +0.271° | 345/365 |
| WP Labuan | 115.121 | 115.145 | +0.023° | 347/365 |

The same solve on the 2026 tables returns an offset of -0.06° to +0.03° for every zone. So 2026 put
subuh at the zone's single point, and 2027 puts peninsula subuh at a second point a quarter of a
degree east. Labuan, one small island with no east-west extent, does not move. With that one
reference moved, subuh reproduces 3,843 of 4,015 rows (95.7%), the same quality as 2026.

### Federation verdict

**One recipe serves the federation in 2027: fajr 18, isha 18, Shafi asr, zohor 1.5, everything
else the plain astronomical value, prayers rounded up, sunrise rounded down.** The between-year
verdict is parameters frozen, reference point shifted: five fields reproduce 2027 at least as well
as the year they were fitted on, and subuh does too once its 2027 second reference point is used.

The subuh move is ~0.24° east, which is one minute, which is also 0.23° of twilight angle. No
published document I found states which of them describes it. It is a deliberate-looking,
uniform, jurisdiction-wide change: nine Selangor districts, KL and Putrajaya all sit between +0.21°
and +0.27°, with Kuala Langat at the top and Sepang at the bottom.

## 4. The wrinkles

**KTN01's isha is 17 degrees, and so is KTN02's.** The census records the exception on zone 1
only. Zone 2 (Jeli, Gua Musang Galas and Bertam, Lojing) also peaks at 17.0 (337/365) and is flat
zero at 18.0. The whole state of Kelantan runs a 17° isha. Neither zone has a 2027 table: the
mufti department times out from this egress and its site publishes prayer data only as monthly
posters on Facebook, the newest of which is 1441 H. The 2027 exception is therefore untestable
this year, and the 2026 evidence says apply it to both zones.

**The Selangor split.** 2026 published three zones; 2027 publishes nine districts. The nine
district reference points are distinct and are recovered above. They are not the 2026 zone points
carried forward: Sabak Bernam's own point is 100.805 where zone 2's was 100.783, and Hulu Langat's
is 101.719 where zone 1's was 101.370. Six of the nine sit more than 0.05° from the zone point they
inherit. That is why a 2026 zone point predicts 2027 badly (fajr 17% exact) while the district's
own point predicts it at 95.7%. Anyone baking Selangor for 2027 needs the nine points, not the
three.

**The KL anomaly the wave flagged is the subuh move.** KL 2027 minus KL 2026 on the same calendar
date is -1.33 minutes on subuh and imsak, -0.44 on maghrib and isyak, -0.21 on zohor and asar,
-0.07 on syuruk. The -0.2 and -0.4 parts are ordinary year-over-year astronomy and are removed by
the residual test. The -1.0 on subuh is not astronomy: it is the reference-point move above.
Labuan, published by the same office on the same day, moves by +0.03 minutes on every field.

## 5. Honest negatives, and how each was closed

Searched in Malay (`waktu solat 2027 <negeri> mufti`, `jadual waktu solat 2027 jabatan mufti`,
`takwim waktu solat 2027 zon`, `takwim hijri dan jadual waktu solat 1448H`) and English, plus the
CMS search endpoint of every WordPress mufti site (`/wp-json/wp/v2/search?search=takwim`).

| State | What closed it |
| --- | --- |
| Pahang | `mufti.pahang.gov.my` serves a maintenance notice: "PORTAL SEDANG DISELENGGARA" |
| Terengganu | `mufti.terengganu.gov.my` returns 403 to curl and 403 to the TinyFish egress |
| Sabah | `mufti.sabah.gov.my` returns 500 on pages and on its own PDF paths (`/wp-content/uploads/2026/09/Zon-N.pdf`) |
| Sarawak | `muftinegeri.sarawak.gov.my` times out, answers 504 over http, and reports `proxy_error` from the second egress |
| Kelantan | the mufti host times out; prayer data lives on monthly Facebook posters (newest 1441 H) |
| Kedah | `/bahagian-falak/` and `/falak/` carry no table and no file link |
| Perlis | `/index.php/falak-dan-pengajaran` carries no table; only a workshop notice for 2027 |
| Negeri Sembilan | `/taqwim/` links three zone PDFs dated 2024, image-only, 1446 H |
| Johor | the download page offers 2026 posters and a 14-page scan with no text layer; MAIJ's own time page is sourced from e-Solat |
| Melaka | the 1448 H release is a two-page image-only poster; no text layer on either page |
| Penang | the 1448 H grid is a Hijri-month layout whose text layer returns each column's numbers in reading order, so a row-wise parse would silently mis-assign dates |
| Perak | a 2027 coordination workshop is announced on the mufti site, but no 2027 file is posted; the 2026 folder is complete and was captured instead |

`Bing` returned unrelated results for every `site:` query from this egress, so the discovery
work used TinyFish with a `site:`-scoped query per publisher, then the publisher's own pages.

## 6. Files

- `captures/` holds 11 PDFs (WP x2, Selangor x9), the Selangor index page, 7 Perak zone PDFs, the
  Penang 1448 H grid, the Melaka poster, JAKIM's `Lampiran B` and the 2027 calendar PDF,
  and 57 e-Solat zone responses.
- `data/` holds `my-jakim-2026-all-zones.json` (57 zones by 365), `my-selangor-2027-*.json` (9),
  `my-jawi-klptj-2027.json`, `my-jawi-labuan-2027.json`, `my-perak-2026-zon1..7.json`,
  `between-year.json` (recovered points, per-zone scores, both recipes).
- `run.mjs` (point recovery, margin calibration, between-year scores), `subuh-point.mjs`,
  `angles.mjs`, `numbers.mjs`, and the two PDF parsers.
- `numbers.txt`, `angles.txt`, `subuh-point.txt` hold the raw output every figure above is quoted from.
