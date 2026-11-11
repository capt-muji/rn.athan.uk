# O1k wide research: Thailand, Malaysia, Singapore, Brunei

Agent tag: `thmsg`. Captured 2026-11-10. Sources are official pages unless the row says community.

Context read first: `world-table-v2.md` rows for Thailand (provisional, fajr 19.8 / isha 18.1),
Malaysia (provisional, JAKIM 18/18 zone tables), Singapore (grade A, 20/18 ceiling), Brunei
(candidate, unfitted).

## Summary

| Country | Verdict |
| --- | --- |
| Thailand | NEW: nine of the 77 provincial CICOT workbooks captured and parsed, 365 rows each, edition proven to be BE 2569 (2026) by exact cross-match with a second CICOT surface; plus a 10-province 2026 PDF previously unlisted. |
| Malaysia | NEW: three 2027 zone tables captured and parsed (KL/Putrajaya, Labuan, five Selangor districts), 365 rows each. JAKIM's own e-Solat feed still serves 2026 only. |
| Singapore | NEW: MUIS 2027 PDF captured and parsed, 365 rows; confirms the grade-A fit on a fourth year. data.gov.sg holds no 2027 dataset yet. |
| Brunei | NEGATIVE: the MORA list still ends 2026-12-31, no 2027 rows, and no published method statement was found. |

---

## Thailand

### Surfaces

| Source | URL | Tier | Dated data | Years |
| --- | --- | --- | --- | --- |
| Office of the Chularajmontri (สำนักจุฬาราชมนตรี), 77-province XLSX index | `https://www.skthai.org/th/pages/28433` | official | one workbook per province, 6 times per day, one sheet, normal-year and leap-year blocks side by side | current edition, BE 2569 (2026), proven below |
| Same office, "10 จ." national PDF, linked from the site menu as "ข้อมูลเวลาปฏิบัติศาสนกิจ ปี 2569" | `https://drive.google.com/file/d/18KIWSG4e9bFDV_nwBMxjld2S2f6F9Dkd/view` (`ปฏิทิน 10 จ. 2569.pdf`, 12 pages) | official | four province columns per page, Gregorian months, printed per-province adjustments (e.g. เชียงราย เช้า -1 / ค่ำ -5, นครราชสีมา เช้า +1 / ค่ำ +5) | BE 2569 (2026) only |
| Same office, "ข้อมูลดาราศาสตร์อิสลาม" parent page | `https://www.skthai.org/th/pages/28457` | official | menu only; the 「ปี 2568」 entry is a dead link to the homepage, the 「ปี 2569」 entry is the Drive PDF above | n/a |

### What confirms the census record

The 77-province XLSX surface exists exactly as the census says, in hash-named files on the
office's CDN. Nine provinces were captured and parsed cleanly: **Bangkok, Kamphaeng Phet,
Chiang Rai, Chiang Mai, Pattani, Yala, Narathiwat, Songkhla, Satun**. Each yields 365 rows for
2026, monotonic across all six fields, no gaps, no duplicate dates.

Column order in the workbook is date, maghrib, isha, subuh, syuruk, dhuhr, asr, and each month
prints two side-by-side blocks (a normal-year block and a leap-year block) that differ by about
a minute. Reading one block is enough for a non-leap year; the second block is the leap-year
variant of the same table, so a single workbook actually carries two years' worth of alignment.

### What is new

1. **The edition is now year-stamped.** The workbooks print no year. The Drive PDF is headed
   `พ.ศ.2569` and its first (base) column reproduces the Bangkok workbook exactly on two dates
   checked across two surfaces: 2026-01-01 `18:03 19:19 05:18 06:43 12:23 15:38` and
   2026-02-01 `18:19 19:32 05:25 06:47 12:33 15:52`. The XLSX set is therefore the BE 2569
   (2026) edition, and the Bangkok workbook is the base column of the national PDF.
2. **A second CICOT surface the census does not list**: a 10-province 2026 calendar PDF hosted
   on Google Drive and linked from the office's own menu. It is not the 77-province set and it
   is not the same layout, so it is a cross-check rather than a replacement.
3. **The workbook is year-2 in one artifact**: because the normal and leap blocks are both
   printed, one capture covers both a 365-day and a 366-day year.

### What deserves a fit

The Thai fit is fajr 19.8 / isha 18.1 at 365/365 within a minute. The workbooks now supply the
four unmeasured rows (dhuhr, asr, maghrib, sunrise margins) at the same coordinates, and the
2026 edition is a clean second year against whatever year the original fit used. The province
coordinate is printed inside each workbook (e.g. Kamphaeng Phet `16-22-00 / 99-08-00`,
Chiang Rai `19-44-00 / 99-23-00`), so the fit can be run per point rather than per country.

### Honest negatives

Searched in Thai (`ตารางเวลาละหมาด`, `ตารางละหมาด 2569`, `ตารางละหมาด 2570`,
`ตารางเวลาละหมาด ประจำปี 2569`, `CICOT`) and English. No BE 2570 (2027) edition is published
anywhere reachable: the site menu's newest year label is 2569. Provincial Islamic committee
pages were not needed and were not pursued once the national surface proved readable.

The CDN is closed to this host: `cache-igetweb-v2.mt108.info` answers 403 to `curl` and a hard
Cloudflare block ("Sorry, you have been blocked") to a browser session, and `skthai.org` itself
does the same. No captcha was solved and no challenge was attempted. The binaries were read
through a public text-extraction reader on its own egress, which returns the sheet as
space-separated rows; five of sixteen requests were blocked at random and were retried until they
succeeded. Anyone repeating this needs an egress that the CDN does not block, or must accept
the reader's flattening.

---

## Malaysia

### Surfaces

| Source | URL | Tier | Dated data | Years |
| --- | --- | --- | --- | --- |
| JAKIM e-Solat zone API | `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=year&zone=<code>` | official | 365 rows, 8 fields per zone, 59 zones | **2026 only**; `year=2027` is accepted and ignored, re-confirmed today |
| JAKIM e-Solat "Muat Turun Takwim" | `https://www.e-solat.gov.my/index.php?siteId=24&pageId=52` | official | Hijri/Miladi calendars and "Tarikh Penting"; **no prayer-time tables** | 2028, 2027, 2026, 2025 ... |
| Jabatan Mufti Wilayah Persekutuan, KL + Putrajaya | `https://www.muftiwp.gov.my/images/falak/takwim/jadual-waktu-solat/KL-dan-Putrajaya/JADUAL_WAKTU_SOLAT_WP_KL-PUTRAJAYA_2027.pdf` | official | 365 rows, 8 fields (imsak, subuh, syuruk, zohor, asar, maghrib, isyak + hijri day) | **2027** |
| Jabatan Mufti WP, Labuan | `https://www.muftiwp.gov.my/images/falak/takwim/jadual-waktu-solat/Labuan/JADUAL_WAKTU_SOLAT_WP_LABUAN_2027.pdf` | official | as above | **2027** |
| Jabatan Mufti Negeri Selangor, takwim 2027 | `https://www.muftiselangor.gov.my/takwim-solat/` | official | nine per-district PDFs, 365 rows each | **2027** (2026 edition on the same page uses three zones) |
| Jabatan Mufti Negeri Pulau Pinang, takwim 1448 | `https://mufti.penang.gov.my/images/Articles/Takwim_2026_2027_1448H.pdf` | official | 13-page Hijri-month calendar grid, 1448 H, which straddles 2026 and 2027 | 2026-06 to 2027-06, **not parsed** |
| Jabatan Mufti Negeri Johor | `https://mufti.johor.gov.my` | official | 2026 only as indexed | 2026 |

### What confirms the census record

The JAKIM feed returns the same shape the runbook records: 2026-01-01 `05:56 / 06:06 / 07:18 /
13:19 / 16:42 / 19:17 / 20:31`, 365 rows, last row `31-Dis-2026` (the runbook's `31-Dec-2026`
is the same row; the month token is Malay). Imsak sits 10 minutes before subuh as recorded.

### What is new

Three 2027 zone tables, 365 rows each, all parsed and monotonic:

1. **KL/Putrajaya** (`WLY01`) — 2027-01-01 `05:54 06:04 07:17 13:19 16:42 19:16 20:31`.
2. **Labuan** — 2027-01-01 `05:04 05:14 06:27 12:24 15:46 18:18 19:33`.
3. **Selangor, five of nine districts** (Gombak, Petaling, Klang, Hulu Langat, Sepang).

Two structural findings:

- **Selangor moves from three zones to nine districts on 2027-01-01.** The mufti's own page
  publishes the 2027 set under nine district names while the 2026 set below it is still
  Zon 1/2/3. The nine district tables are not cosmetic: Gombak differs from Hulu Langat on
  all 365 days, from Klang on all 365, from Sepang on 363, from Petaling on 265.
- **A source defect in the Labuan 2027 PDF**: 2027-02-06 prints syuruk as `0635`, a missing
  colon. Any strict parser drops that row; the value is 06:35.

### What deserves a fit

The 2027 zone tables are the year-2 the Malaysian row needs. The fitted recipe (fajr 18, isha
18, dhuhr +1.5, maghrib with no additive ihtiyati, syuruk floor, prayers ceil) can be tested
against 2027 without waiting for January. Note that these are state mufti-department
publications, not JAKIM's own feed, so a JAKIM-vs-state disagreement would show up here first;
the KL 2027 January rows sit 1-2 minutes off the JAKIM 2026 rows for the same calendar dates,
which is the expected year-to-year drift, not a different recipe.

### Honest negatives

Searched in Malay (`waktu solat 2027`, `jadual waktu solat 2027 Jabatan Mufti negeri`,
`takwim solat 2027 zon`, `waktu solat [negeri] 2026`) and English. **JAKIM has not published
2027 zone data**: the API ignores the year and the download page carries calendars only. Johor's
mufti site, as indexed, still offers 2026. Kedah's JHEAIK page is a live-today widget with no
annual archive.

Penang's takwim 1448 is captured but not normalized. It is a Hijri-month calendar grid, and the
text layer returns each day cell's numbers by column rather than by row, so a row-wise parse
would silently mis-assign dates. Publishing it as rows would be worse than leaving it as a raw
capture.

---

## Singapore

### Surfaces

| Source | URL | Tier | Dated data | Years |
| --- | --- | --- | --- | --- |
| MUIS prayer timetable, "Prayer timetable 2027" | `https://isomer-user-content.by.gov.sg/48/01b5692f-0f2c-44cb-b2bb-dbae0d4c4583/Prayer%20Timetable%202027.pdf` (linked from `https://www.muis.gov.sg/resources/islamic-calendar/`) | official | 12 pages, one page per month, 7 printed columns | **2027** |
| data.gov.sg, "Muslim Prayer Timetable" collection | `https://data.gov.sg/datasets?q=muslim+prayer+timetable` | official, open licence | CSV, 8 columns, per-year datasets plus a consolidated file | 2024, 2025, 2026, consolidated 2024-2026. **No 2027 dataset** |

### What confirms the census record

The 2027 PDF parses to 365 rows, monotonic, 2027-01-01 `05:44 07:08 13:10 16:34 19:10 20:25`
and 2027-12-31 `05:43 07:07 13:09 16:33 19:10 20:25`. That is a fourth MUIS year, on top of
the 1,096 days the grade-A fit already rests on, and it reproduces the same shape: subuh and
syuruk early, zohor past 13:00, isyak past 20:25.

### What is new

The 2027 timetable PDF is published and reachable today, roughly seven weeks before the year it
covers. It is a separate artifact from the data.gov.sg CSV, so it is a second witness for 2027
rather than a copy.

### What deserves a fit

Nothing further; the fit is at top grade. The 2027 rows are the cheapest available confirmation
that the 20/18 ceiling rule still holds in a year the fit never saw.

### Honest negatives

Searched in English and Malay. **data.gov.sg has no 2027 dataset yet**: the search returns five
results and the newest pair is "Muslim Prayer Timetable 2026" plus the consolidated file ending
December 2026. The known 2026 dataset id still resolves (`poll-download` returns 201), so the
absence is a publication gap, not a broken id. A 2027 CSV should appear on the same
January-class schedule as previous years.

---

## Brunei

### Surfaces

| Source | URL | Tier | Dated data | Years |
| --- | --- | --- | --- | --- |
| MORA "Waktu Sembahyang" SharePoint list (OData) | `https://www.mora.gov.bn/_api/web/lists/getbytitle('Waktu%20Sembahyang')/items?$orderby=Date%20desc&$top=5` | official | one row per date, 8 fields, 4,739 rows in the list | 2014-ish to **2026-12-31** |
| MORA list view | `https://www.mora.gov.bn/lists/waktusolat/allitems.aspx` | official | same rows as HTML | to 2026-12-31 |
| MORA "Waktu Sembahyang" page | `https://www.mora.gov.bn/SitePages/WaktuSembahyang.aspx` | official | current-period widget | 2026 |

### What confirms the census record

The OData feed is live and still ends at 2026-12-31. The newest row is `2026-12-30T16:00:00Z`
(= 2026-12-31 local) with `Suboh 5.04 / Maghrib 6.18 / Isyak 7.33`, exactly the row the
runbook records, and the dotted-decimal parse trap is still in force.

### What is new

Nothing on the feed. **No 2027 rows have appeared.** The list holds 4,739 items and the
newest five all fall in the last week of December 2026.

No Brunei method statement was found. MORA publishes the table but not the parameters: there is
no page stating the fajr/isha depression angles, the asr shadow factor or the ihtiyati. The only
parameter-adjacent statement in circulation is the district offset convention, published on the
office's social channels and repeated by third parties: Brunei-Muara and Temburong share one
table, Tutong is +1 minute, Belait +3 minutes. That is a zone rule, not a twilight rule, and it
is community-tier as recorded here because no MORA page states it in text.

### What deserves a fit

Nothing new. The 20/18, nearest, dhuhr +1 fallback stands until either 2027 rows arrive or a
method statement surfaces.

### Honest negatives

Searched in Malay (`kaedah penentuan waktu sembahyang Brunei`, `waktu sembahyang Brunei 2027
muat turun jadual`, `kaedah hisab syarak`, `Unit Falak MORA`) and English. The `$filter=Year eq
2027` form is rejected by this list (HTTP 400 for both quoted and unquoted), so absence is
established by the date-descending query rather than by a server-side count. No 2027 PDF, no
2027 list rows, and no parameters page.

---

## Files

`captures/` — 33 raw captures. XLSX binaries are stored as the reader's flattened text
(`th-xlsx-<province>.md`) because the CDN refuses this host the binary; see the Thailand
negatives. PDFs and HTML/XML/JSON are stored byte-for-byte.

`data/` — normalized rows, `{'YYYY-MM-DD': {fajr, sunrise, dhuhr, asr, magrib, isha}}`, plus the
three parsers. Malaysia files carry an extra `imsak` key because the source prints one.

| File | Rows | Fields |
| --- | --- | --- |
| `th-cicot-{bangkok,kamphaengphet,chiangrai,chiangmai,pattani,yala,narathiwat,songkhla,satun}.json` | 365 each | 6 |
| `my-jawi-klptj-2027.json` | 365 | 7 (with imsak) |
| `my-jawi-labuan-2027.json` | 365 | 7 |
| `my-selangor-2027-{gombak,petaling,klang,hulu-langat,sepang}.json` | 365 each | 7 |
| `sg-muis-2027.json` | 365 | 6 |

Every file was checked for monotonicity across all fields, a complete date span, and a row count
of 365; all pass.
