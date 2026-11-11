# O1l-2 Thailand: CICOT provincial workbooks, national coverage

Agent tag `thailand-provinces`, captured 2026-11-11. Every surface is the Office of the
Chularajmontri (สำนักจุฬาราชมนตรี, CICOT) unless a row says otherwise.

## Verdict

| Item | Result |
| --- | --- |
| Provincial workbooks | **77 of 77 captured as XLSX binaries** (68 new, 9 held re-parsed identically) |
| Dated rows | 28,104 for the normal-year block, 28,182 for the leap-year block |
| Equipment | adhan 4.4.6, held recipe fajr 19.8 / isha 18.1, Shafi, Asia/Bangkok |
| Fit | one recipe for the whole country: **166,433 of 166,434 values within one minute in 2026**, 166,885 of 166,896 in the leap block |
| Year-2 | **NEGATIVE for a second edition**: BE 2570 (2027) is not published (searched Thai and English) |
| Grade | the record's Thailand object moves from one year to two year-blocks of one edition; the cross-edition year is still absent |

## Capture path

The documented CDN (`cache-igetweb-v2.mt108.info`) and `www.skthai.org` both answer 403 to
this host, as the O1k wave recorded. The same file objects are served as real XLSX binaries
from `https://www.igetweb.com/uploads/images-cache/520/filemanager/<hash>.xlsx`, which
returns `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`. All 77 were
fetched there and stored in `captures/th-xlsx-<province>.xlsx` (3.7 MB total). This replaces
the O1k workaround, which could only read a text-extraction reader's flattening.

The province index is `captures/skthai-28433-province-index.json` (77 rows: Thai name, hash,
documented URL), read from the office's page 28433 through the text reader
(`captures/th-skthai-28433-jina.md`). The hash list and its order are byte-identical to the
O1k capture, so no file was replaced between the two nights.

## Workbook anatomy

One sheet per province. Row 1 prints the province, the district that is the reference point,
and the coordinate in degrees-minutes-seconds. Each month prints two side-by-side blocks: the
normal-year block in columns A..G and the leap-year block in I..O, both with the columns
date, maghrib, isha, subuh, syuruk, dhuhr, asr. Times are Excel day fractions, so the sheet
carries the computed value, not a printed string; `parse_xlsx.py` converts to the minute.

Verification: the nine provinces the O1k wave parsed from flattened text (Bangkok, Kamphaeng
Phet, Chiang Rai, Chiang Mai, Pattani, Yala, Narathiwat, Songkhla, Satun) were re-parsed from
the binaries. **3,285 rows, zero differences on any of the six fields.**

The reference point is a district, not the provincial capital, in most provinces: Chiang Rai
is Amphoe Mae Suai, Chiang Mai is Mae Chaem, Tak is Mae Sot, Khon Kaen is Chum Phae, Phuket
is Laem Promthep, Satun is Ko Tarutao, Ranong is Ko Chang. Coverage is therefore a single
point per province, named and measurable, not a provincial capital series.

## Files and years

| File | Rows each | Year |
| --- | --- | --- |
| `data/th-cicot-<province>-2569.json` | 365 (Ranong 364) | BE 2569 = 2026, normal-year block |
| `data/th-cicot-<province>-2569-leap.json` | 366 | the same BE 2569 edition's leap-year block (year not printed) |

The leap block is the same edition's leap-year alignment, not a second published edition, and
the workbook prints no year for either block. Its rows differ from the normal block by up to a
minute per field because a leap year shifts the date-to-solar-position mapping; the pair
therefore tests the recipe on two date alignments, never on two publication years. The
alignment year is not recoverable: scoring the leap block against 2024, 2028 and 2032 favours
2024 by 4 to 14 exact values out of 2,196 per province, a margin at noise level, so the file
suffix marks the block and not a year.

`data/th-province-coordinates.json` holds the printed coordinate and district for every
province, read from row 1 of each workbook.

## Fit

Recipe held from the census: **fajr 19.8, isha 18.1, Shafi, no additive margin**; engine
adhan 4.4.6 at second resolution (`Rounding.None`) then explicit per-column rounding. The
grid search over margin and rounding per column returns, summed across all 77 provinces and
both blocks:

| Column | Margin | Rounding | Reading |
| --- | --- | --- | --- |
| fajr | 0 | half-up (−0.5, ceil) | nearest minute at 19.8 |
| sunrise | 0 | up (+1, floor) | ceiling of sunrise |
| dhuhr | 0 | up (+1, floor) | ceiling of transit |
| asr | 0 | up (ceil) | ceiling, Shafi shadow factor 1 |
| magrib | 0 | up (ceil) | ceiling of sunset |
| isha | 0 | half-up (−0.5, ceil) | nearest minute at 18.1 |

Margins are zero on all six columns, which fills the record's "the other four are null". The
publisher rounds the four sun-derived prayers up to the next minute and rounds the two
twilight prayers to the nearest minute.

Scores at that one recipe:

| Block | Printed values | Exact | Within 1 min | Worst |
| --- | --- | --- | --- | --- |
| BE 2569 (2026) | 166,434 | 139,851 (84.0%) | **166,433 (100.0%)** | 2 min, one value |
| Leap block | 166,896 | 139,289 (83.5%) | **166,885 (99.99%)** | 2 min, 11 values |

Nan is excluded from both totals and scored separately below. Every other value in both
blocks falls within a minute except eleven, which are the artefacts listed under Defects.

Between-block stability (two date alignments of one edition): **parameters frozen**. Fitting each block independently returns the
same angle pair, the same zero margins and the same rounding for five columns; sunrise moves
between `+1 floor` and `+0.5 ceil`, two forms of the same round-up rule that differ only on an
exact half minute.

Seasonal amplitude, printed fajr from 1 January to 1 July: −21 minutes at Yala (5.80 N) to
−76 minutes at the Chiang Rai reference point (19.73 N). The north-south swing the record
expects is present and shrinks with latitude.

## Defects found

- **Nan prints a wrong longitude.** The header reads 18-44-00 / **103-45-00**; at that point
  the whole table sits 12 to 13 minutes from the model on every column. At the implied point
  (about 18.70 N, 100.66 E, inside Nan province and near the provincial seat) **2,190 of
  2,190 values fall within a minute**. The table is consistent with the national recipe; the
  printed longitude is three degrees out.
- **Ranong's normal-year block stops at 30 December.** The 31 December row carries the leap
  block's values but no normal-block cells, so that file holds 364 rows. No value was
  synthesised.
- **Eleven two-minute artefacts in the leap block and one in 2026.** Chonburi fajr on
  2026-06-25, plus its 28 June and 7 July leap slots; Krabi asr at the 31 August leap slot;
  Kalasin sunrise at seven March and April leap slots and isha at the 9 September slot. Each
  is a two-minute departure on an otherwise exact column.
- **Chonburi prints at a coarser phase than the rest**: 1,210 exact of 2,190 in 2026 against a
  national median near 1,850, while staying 2,189 of 2,190 within a minute. The island
  reference point (Ko Sichang) is the likeliest cause; the table is still recipe-consistent.

## What confirms the record

The 77-province XLSX surface, the 19.8/18.1 recipe and the 365-row-per-province shape all hold
exactly as the census records them. The nine O1k provinces re-parse without a single
difference. The 2026 edition is confirmed year-stamped, as O1k established against the
10-province PDF's Bangkok column.

## What is new

1. **Full national coverage**: 68 provinces added, so the whole 77-province set is now held as
   binaries with both year-blocks normalized (56,286 dated rows).
2. **The unmeasured margins are measured**: zero on all four sun-derived columns, with ceiling
   rounding for sunrise, dhuhr, asr and maghrib, and half-up for fajr and isha.
3. **The reference points are named and measurable** for every province, so the fit runs per
   point rather than per country, and the district choice (not the capital) is on record.
4. **The Nan coordinate defect**, measured and bounded: a printed longitude three degrees out,
   with the implied point reproducing the table to the minute.
5. **Between-block stability**: the recipe survives a second date alignment without a
   parameter change.

## Honest negatives

- **BE 2570 (2027) does not exist yet.** The office's menu tops out at the label `ปี 2569`, and page
  28457 lists only 2568 and 2569 (`captures/th-skthai-28457-jina.md`). The 77-file index is
  unchanged in content and order from the O1k capture. Searched in Thai (`ตารางเวลาละหมาด
  2570`, `ตารางละหมาด 77 จังหวัด ประจำปี 2570`, `สำนักจุฬาราชมนตรี เวลาละหมาด 2570`,
  `ตารางเวลาละหมาด ประจำปี 2569`) and English (`CICOT Thailand prayer timetable 2027
  provinces xlsx`) through TinyFish. No 2027 provincial edition is published anywhere public
  today. Year-2 across editions waits on the BE 2570 cycle.
- **`prayertimes.muslimthaipost.com` is a calculator, not a publisher.** Its calendar form
  offers years 2567 to 2571 and a method selector. Its default output does not reproduce
  CICOT: for Bangkok on 2026-01-01 it prints subuh 05:22 against CICOT's 05:18, with imsak at
  fajr − 10. Platform tier, and its 2570 and 2571 years are computed previews, never editions.
  Recorded, not used.
- **The 10-province national PDF is a separate publication, not a second witness for
  provinces.** Its pages carry four columns, and the columns do not hold the workbook values
  for the provinces named in the header: the Chiang Rai column reads +7 / +6 / +4 / +3 / +6 / +6
  against the Chiang Rai workbook on 2026-01-01, and the Nakhon Ratchasima column reads +8 /
  +10 / +15 / +14 / +12 / +10. Only the base column reproduces Bangkok exactly, which is what
  O1k used to stamp the edition year. Its own page-1 columns do match three workbooks exactly
  (Chiang Mai, Tak, Khon Kaen), so the PDF's column order does not follow its header order.
  Treat the two surfaces as two publications of one office; do not cross-read them.
- The saved text of that PDF covers 4 of its 12 pages, which is why the column identities
  above are established by exact sextuple match and not by page reading.

## Files

- `captures/` — 77 XLSX binaries, the province index, the two site pages (text reader), the
  blocked-host evidence, the 10-province PDF text, the Muslim Thai Post probe.
- `data/` — 154 normalized files (77 × 2 blocks), `th-province-coordinates.json`,
  `th-fit.json` (per-province, per-column, per-block scores).
- `parse_xlsx.py`, `normalize_all.py`, `th-fit.mjs`, `probe-nan.mjs`, `probe-stability.mjs`,
  `probe-outliers.mjs`, `probe-leapyear.mjs`.

## Per-province table

`within1` counts values (6 columns x days) landing within one minute of the model; `exact`
counts agreement on the printed minute. Amplitude is printed fajr at 1 July minus 1 January.

| Province | Reference point | Lat/Lon | 2026 rows | 2026 exact | 2026 within1 | Leap within1 | Fajr amplitude | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Amnat Charoen | อ. เมือง | 15.917/104.550 | 365 | 1841 | 2190/2190 | 2196/2196 | -60 | new |
| Ang Thong | อ. สามโก้ | 14.633/100.233 | 365 | 1839 | 2190/2190 | 2196/2196 | -55 | new |
| Bangkok | เขตหนองแขม | 13.700/100.333 | 365 | 1876 | 2190/2190 | 2196/2196 | -51 | held |
| Bueng Kan | อ.  ปากคาด | 18.350/103.317 | 365 | 1815 | 2190/2190 | 2196/2196 | -71 | new |
| Buriram | อ. ลำปลายมาศ | 14.933/102.733 | 365 | 1868 | 2190/2190 | 2196/2196 | -56 | new |
| Chachoengsao | อ.เมือง | 13.717/100.933 | 365 | 1873 | 2190/2190 | 2196/2196 | -52 | new |
| Chai Nat | อ.หันคา | 15.133/99.817 | 365 | 1857 | 2190/2190 | 2196/2196 | -57 | new |
| Chaiyaphum | อ.ภักดีชุมพล | 16.033/101.483 | 365 | 1831 | 2190/2190 | 2196/2196 | -61 | new |
| Chanthaburi | อ. นายายอาม | 12.683/101.800 | 365 | 1848 | 2190/2190 | 2196/2196 | -48 | new |
| Chiang Mai | อ. แม่แจ่ม | 18.850/98.100 | 365 | 1818 | 2190/2190 | 2196/2196 | -72 | held |
| Chiang Rai | อ. แม่สรวย | 19.733/99.383 | 365 | 1794 | 2190/2190 | 2196/2196 | -76 | held |
| Chonburi | อ.เกาะสีชัง | 13.150/100.817 | 365 | 1210 | 2189/2190 | 2194/2196 | -50 | NEW |
| Chumphon | อ. เมือง | 10.467/99.100 | 365 | 1895 | 2190/2190 | 2196/2196 | -39 | NEW |
| Kalasin | อ.ห้วยเม็ก | 16.617/103.233 | 365 | 1824 | 2190/2190 | 2188/2196 | -64 | new |
| Kamphaeng Phet | อ.คลองลาน | 16.367/99.133 | 365 | 1835 | 2190/2190 | 2196/2196 | -63 | held |
| Kanchanaburi | อ. สังขละ | 14.950/98.367 | 365 | 1826 | 2190/2190 | 2196/2196 | -57 | NEW |
| Khon Kaen | อ.ชุมแพ | 16.667/101.983 | 365 | 1817 | 2190/2190 | 2196/2196 | -64 | NEW |
| Krabi | อ. เมือง | 8.083/98.767 | 365 | 1876 | 2190/2190 | 2195/2196 | -30 | NEW |
| Lampang | อ.  ห้างฉัตร | 18.383/99.233 | 365 | 1812 | 2190/2190 | 2196/2196 | -71 | new |
| Lamphun | อ. ป่าซาง | 18.467/98.833 | 365 | 1829 | 2190/2190 | 2196/2196 | -71 | new |
| Loei | อ. ด่านซ้าย | 17.267/101.117 | 365 | 1826 | 2190/2190 | 2196/2196 | -66 | NEW |
| Lopburi | อ. บ้านหมี่ | 15.067/100.483 | 365 | 1823 | 2190/2190 | 2196/2196 | -57 | new |
| Mae Hong Son | อ. ปาย | 19.350/98.417 | 365 | 1820 | 2190/2190 | 2196/2196 | -75 | new |
| Maha Sarakham | อ. โกสุมพิสัย | 16.217/102.867 | 365 | 1840 | 2190/2190 | 2196/2196 | -62 | new |
| Mukdahan | อ. ดงหลวง | 16.783/104.150 | 365 | 1836 | 2190/2190 | 2196/2196 | -64 | new |
| Nakhon Nayok | อ. บ้านนา | 14.267/100.967 | 365 | 1839 | 2190/2190 | 2196/2196 | -53 | new |
| Nakhon Pathom | อ. เมือง | 13.900/99.933 | 365 | 1864 | 2190/2190 | 2196/2196 | -52 | new |
| Nakhon Phanom | อ. เมือง | 17.300/104.467 | 365 | 1833 | 2190/2190 | 2196/2196 | -66 | new |
| Nakhon Ratchasima | อ. สีคิ้ว | 15.033/101.500 | 365 | 1835 | 2190/2190 | 2196/2196 | -57 | NEW |
| Nakhon Sawan | อ. แม่วงก์ | 15.800/99.383 | 365 | 1849 | 2190/2190 | 2196/2196 | -60 | new |
| Nakhon Si Thammarat | อ. ทุ่งใหญ่ | 8.367/99.267 | 365 | 1910 | 2190/2190 | 2196/2196 | -31 | new |
| Nan | อ. เมือง | 18.733/103.750 | 365 | 0 | 0/2190 | 0/2196 | -73 | new |
| Narathiwat | อ.ศรีสาคร | 6.217/101.417 | 365 | 1914 | 2190/2190 | 2196/2196 | -23 | held |
| Nong Bua Lamphu | อ. นากลาง | 17.217/102.100 | 365 | 1818 | 2190/2190 | 2196/2196 | -66 | new |
| Nong Khai | อ. สังคม | 18.083/102.083 | 365 | 1833 | 2190/2190 | 2196/2196 | -69 | NEW |
| Nonthaburi | อ. ไทรน้อย | 13.917/100.300 | 365 | 1826 | 2190/2190 | 2196/2196 | -52 | NEW |
| Pathum Thani | อ. ลาดหลุมแก้ว | 14.000/100.383 | 365 | 1868 | 2190/2190 | 2196/2196 | -52 | NEW |
| Pattani | อ. โคกโพธิ์ | 6.667/101.100 | 365 | 1898 | 2190/2190 | 2196/2196 | -24 | held |
| Phang Nga | อ.  ตะกั่วป่า | 8.900/98.267 | 365 | 1883 | 2190/2190 | 2196/2196 | -33 | new |
| Phatthalung | อ. ศรีนครินทร์ | 7.567/99.833 | 365 | 1875 | 2190/2190 | 2196/2196 | -27 | new |
| Phayao | อ. เมือง | 19.183/99.867 | 365 | 1799 | 2190/2190 | 2196/2196 | -74 | new |
| Phetchabun | อ. ชนแดน | 16.233/100.733 | 365 | 1821 | 2190/2190 | 2196/2196 | -62 | new |
| Phetchaburi | อ. แก่งกระจาน | 12.883/99.217 | 365 | 1867 | 2190/2190 | 2196/2196 | -48 | new |
| Phichit | อ. โพธิ์ประทับช้าง | 16.300/100.067 | 365 | 1852 | 2190/2190 | 2196/2196 | -62 | new |
| Phitsanulok | อ. เมือง | 16.817/100.250 | 365 | 1830 | 2190/2190 | 2196/2196 | -64 | NEW |
| Phra Nakhon Si Ayutthaya | อ. บางซ้าย | 14.317/100.283 | 365 | 1860 | 2190/2190 | 2196/2196 | -54 | new |
| Phrae | อ. ลอง | 18.283/99.950 | 365 | 1818 | 2190/2190 | 2196/2196 | -70 | new |
| Phuket | แหลมพรหมเทพ | 7.750/98.300 | 365 | 1884 | 2190/2190 | 2196/2196 | -29 | NEW |
| Prachin Buri | อ. เมือง | 14.150/101.317 | 365 | 1858 | 2190/2190 | 2196/2196 | -54 | new |
| Prachuap Khiri Khan | อ. เมือง | 11.750/99.650 | 365 | 1900 | 2190/2190 | 2196/2196 | -44 | new |
| Ranong | เกาะช้าง | 9.833/98.450 | 364 | 1705 | 2184/2184 | 2196/2196 | -36 | new |
| Ratchaburi | อ. สวนผึ้ง | 13.500/99.217 | 365 | 1855 | 2190/2190 | 2196/2196 | -51 | NEW |
| Rayong | อ. นิคมพัฒนา | 12.817/101.083 | 365 | 1883 | 2190/2190 | 2196/2196 | -48 | NEW |
| Roi Et | อ. จตุรพักตร์พิมาน | 15.917/103.500 | 365 | 1839 | 2190/2190 | 2196/2196 | -61 | new |
| Sa Kaeo | อ. เมือง | 13.883/101.933 | 365 | 1863 | 2190/2190 | 2196/2196 | -52 | new |
| Sakon Nakhon | อ. สว่างแดนดิน | 17.300/103.317 | 365 | 1808 | 2190/2190 | 2196/2196 | -66 | new |
| Samut Prakan | อ. พระสมุทรเจดีย์ | 13.583/100.450 | 365 | 1842 | 2190/2190 | 2196/2196 | -51 | new |
| Samut Sakhon | อ. บ้านแพ้ว | 13.567/100.050 | 365 | 1853 | 2190/2190 | 2196/2196 | -51 | new |
| Samut Songkhram | อ. อัมพวา | 13.367/99.883 | 365 | 1874 | 2190/2190 | 2196/2196 | -50 | new |
| Saraburi | อ. ดอนพุด | 14.633/100.633 | 365 | 1845 | 2190/2190 | 2196/2196 | -55 | new |
| Satun | เกาะตะรุเตา | 6.567/99.633 | 365 | 1921 | 2190/2190 | 2196/2196 | -24 | held |
| Si Sa Ket | อ. ห้วยทับทัน | 14.950/104.050 | 365 | 1854 | 2190/2190 | 2196/2196 | -57 | new |
| Sing Buri | อ. บางระจัน | 14.917/100.217 | 365 | 1850 | 2190/2190 | 2196/2196 | -56 | new |
| Songkhla | อ.  สะเดา | 6.733/100.283 | 365 | 1911 | 2190/2190 | 2196/2196 | -24 | held |
| Sukhothai | อ. บ้านด่านลานหอย | 16.967/99.483 | 365 | 1817 | 2190/2190 | 2196/2196 | -65 | NEW |
| Suphan Buri | อ. ด่านช้าง | 14.817/99.383 | 365 | 1823 | 2190/2190 | 2196/2196 | -56 | new |
| Surat Thani | เขาสก | 9.100/98.550 | 365 | 1908 | 2190/2190 | 2196/2196 | -34 | NEW |
| Surin | อ. เมือง | 14.950/103.433 | 365 | 1842 | 2190/2190 | 2196/2196 | -56 | new |
| Tak | อ.  แม่สอด | 16.683/98.517 | 365 | 1846 | 2190/2190 | 2196/2196 | -64 | NEW |
| Trang | หาดปากเม็ง | 7.500/99.283 | 365 | 1894 | 2190/2190 | 2196/2196 | -28 | new |
| Trat | อ.  แหลมงอบ | 12.200/102.283 | 365 | 1854 | 2190/2190 | 2196/2196 | -46 | new |
| Ubon Ratchathani | อ. เขื่องใน | 15.350/104.500 | 365 | 1868 | 2190/2190 | 2196/2196 | -58 | NEW |
| Udon Thani | อ. เมือง | 17.367/102.800 | 365 | 1808 | 2190/2190 | 2196/2196 | -66 | NEW |
| Uthai Thani | อ. บ้านไร่ | 15.400/99.100 | 365 | 1837 | 2190/2190 | 2196/2196 | -58 | NEW |
| Uttaradit | อ. เมือง | 17.733/100.100 | 365 | 1836 | 2190/2190 | 2196/2196 | -68 | new |
| Yala | อ. เบตง | 5.800/101.033 | 365 | 1908 | 2190/2190 | 2196/2196 | -21 | held |
| Yasothon | อ. เมือง | 15.933/104.067 | 365 | 1844 | 2190/2190 | 2196/2196 | -60 | new |
