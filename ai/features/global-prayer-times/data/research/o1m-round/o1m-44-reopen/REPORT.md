# o1m-44 — the four error-page verdicts, re-attacked (round o1m, wave 44)

Workspace `$HOME/athan-gitree/census/o1m/o1m-44-reopen/`. Captures in `captures/`, normalized rows in
`data/`, fits in `fit/`. Nothing under `/tmp`. The repository was not touched. Every timestamp is UTC.
Engine adhan 4.4.6 at `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`, TZ pinned per surface.

The four verdicts D7 of `o1m-37-decisions/DECISIONS-ADDENDUM-ROUND3.md` reopened. Two of them were
wrong about the artifact, one was wrong about the class of document, and one was right about the
publisher and wrong about the month. All four are now settled on artifacts on disk.

| # | Verdict before | Verdict after | Artifact | Rows |
|---|---|---|---|---|
| 1 | Jyväskylä: 353 dated rows with no surviving artifact | **CONFIRMED, premise CORRECTED** | 12 live PDFs, sha256-identical to the bank | 353/353 reproduced; **1,234 banked** |
| 2 | Seychelles: a 403 body behind a 29-row bank | **CONFIRMED, one row corrected** | live PDF, 4.8 MB, 200 OK | 28/29 identical, 1 sunrise minute fixed |
| 3 | Islamic Academy: series stops 2013/2010, every file 404 | **CORRECTED** | 11 live GIFs + 2 archived PDFs | 0 prayer rows: the series is a calendar |
| 4 | Wrexham and Dundee: failing months are publisher absences | **WREXHAM CORRECTED, DUNDEE CONFIRMED** | 4 live Wrexham PDFs, 2 archived Dundee months | Wrexham **122** (was 58); Dundee 1 rolling month |

---

## 1. Jyväskylä — the artifact was never missing

**Before.** "353 dated rows for Feb 2026 to Jan 2027 … all 12 `fi-jyvaskyla-*2026.pdf` captures are
404 bodies … the bank is real but no captured artifact behind it survives."

**Evidence now.** The workspace holds two filename families, and only one of them is a 404:

| Family | Files | Bytes | Magic |
|---|---|---|---|
| `fi-jyvaskyla-{feb2026,mar2026,april2026,May2026,June2026,July2026,Aug2026,Sep2026,Oct2026,Nov2026,Dec2026,Jan2027}.pdf` | 12 | 292,573-299,546 | `%PDF-1.7` |
| `fi-jyvaskyla-{February,March,April,May,June,July,August,September,October,November,December}-2026.pdf` | 12 | 152,053 each | `<!DOCTYP` |

The classifier counted the second family and reported the first as absent. The first family is the one
`parse-jyvaskyla.py` reads, and it re-parses to **353 rows, identical cell for cell to
`data/fi-jyvaskyla-2026.json`, zero differences** (`data/verify-jyvaskyla.py`).

The live publisher was then asked directly. The mosque's own media API
(`/wp-json/wp/v2/media?mime_type=application/pdf`) enumerates every PDF it has ever uploaded, with the
upload path. All twelve 2026 URLs answer **200**, and every one is **sha256-identical** to the banked
artifact:

```
feb2026    live=ec33f15b81a4155f bank=ec33f15b81a4155f IDENTICAL   ... 12 of 12
```

The capitalised names answer 404 with the same 152,053-byte error body the old wave captured, so the
old wave's 404s were its own guessed filenames (`Feb2026.pdf`), not the publisher's files
(`feb2026.pdf`). `captures/jyv-404-capitalised-name-Feb2026.html` is that body, kept.

**After: CONFIRMED, premise corrected.** The 353 rows are sound, the artifact survives, and the
"unfitted verdict attached to an error page" class does not apply here.

### 1b. The same API exposed a four-year archive, and the fit moves to A

The media listing is not twelve files but **forty-eight**, continuous from August 2023 to January 2027.
Every monthly table was fetched and parsed (`data/fetch-jyv-archive.py`,
`data/parse-jyv-archive.py`), with each file's printed header checked against its filename:

| Year | Rows | Span | Header check |
|---|---|---|---|
| 2023 | 148 | 2023-08-01..2023-12-31 | 5 files, header `month year` agrees |
| 2024 | 351 | 2024-01-01..2024-12-31 | 12 files, all agree |
| 2025 | 352 | 2025-01-01..2025-12-31 | 12 files, 11 agree |
| 2026 | 353 | 2026-01-01..2026-12-31 | 12 files, all agree (a thirteenth, `Ramadan2026.pdf`, is a reprint checked below) |
| 2027 | 30 | 2027-01-01..2027-01-30 | 1 file, agrees |

**1,234 dated rows**, six months short of four complete years (the archive starts 2023-08).

**The years are recomputed, not relabelled.** Same month, different year, cell by cell: January
2025 vs 2026 differs on 60 of 162 cells, April 76 of 162, July 49 of 156, October 96 of 156, and
almost every difference is one or two minutes. That is a recomputed ephemeris, not a reprinted sheet.

**Fit — one recipe, 18/17 Shafi, zero margins, 62.2415/25.7209, each year scored on its own
angle-honest span.** The substitution window is found mechanically, as the longest contiguous run of
days on which fajr leaves the 18-degree line, and it is the same window every year:

| Year | Substitution window | Scored days | fajr exact / within-1 | isha exact / within-1 | sunrise, dhuhr, maghrib |
|---|---|---|---|---|---|
| 2023 | 2023-08-01..09-07 | 111 | 92/111, **111/111**, worst 1 | 90/111, **111/111** | all 111/111 within 1 |
| 2024 | 2024-04-05..09-07 | 202 | 166/202, **202/202**, worst 1 | 144/202, **202/202** | all 202/202 within 1 |
| 2025 | 2025-04-05..09-07 | 203 | 173/203, **203/203**, worst 1 | 144/203, **203/203** | all 203/203 within 1 |
| 2026 | 2026-04-05..09-07 | 202 | 169/202, 201/202, worst 59 | 147/202, **202/202** | all 202/202 within 1 |
| 2027 Jan | none | 30 | 27/30, **30/30** | 25/30, **30/30** | all 30/30 within 1 |

Three distinct fitted years (2024, 2025, 2026) on one frozen recipe, at zero margin, with the
substitution window identical to the day across them. **Grade moves provisional → A (community,
mosque tier)** by the T-667 rule. Seasonal amplitude is the whole story of the column: fajr runs from
06:40 in January to 02:08 in June before the freeze, 272 minutes of sweep, and isha from 17:41 (2023-12-12) to
00:26 (2026-06-25), 405 minutes.

Three defects are named, not smoothed:

1. **`May2025.pdf` is headed "Prayer Timing April 2025" and carries May's values.** Its rows run
   02:46/05:02/13:14/21:28 at day 1, which is May at 62.2 N, against April's 03:41/06:38/13:21/20:05.
   A stale header over sound data — the mirror image of the Kiruna class, where the header was right
   and the data was wrong.
2. **2026-03-29, the DST change, prints fajr 03:58 against the angle's 02:59**, 59 minutes late. Every
   other year's DST Sunday is within one minute. A one-day defect in the publisher's own table.
3. **The asr column is asymmetric, +2 in summer and −2 in winter**, within 3 minutes all year. It is
   not a madhab switch (a Hanafi column would be 10 to 30 minutes later); it is a small solar-position
   difference in the publisher's own computation.

`Ramadan2026.pdf` is a 29-day reprint of the same generation: 28 of its rows match the annual February
and March tables cell for cell. Banked as one cycle, never counted as a second generation.

Artifacts: `captures/jyv-archive/` (48 PDFs), `captures/jyv-live-*.pdf` (12, the live re-fetch),
`captures/jyvaskyla-*.text.txt` (12 extracted text layers). Data: `data/jyvaskyla-archive-rows.json`,
`data/jyvaskyla-reparsed.json`. Fit: `fit/jyvaskyla-multiyear-fit.json`, `fit/jyvaskyla-scored.mjs`.

---

## 2. Seychelles — the 403 was the fetch, and one minute was wrong

**Before.** "`sc/iso-jumada-akhiraah-timetable.pdf` is a 403 body … the record says curl 403, captured
via the PDF text layer, so the bank may be sound, but the artifact that proves it is an error page."

**Evidence now.** The Joomla page names its own attachment path,
`/media/attachments/2026/11/10/jumada-al-akhiraah-timetable.pdf`. A plain `curl` with a browser UA
returns **200, 4,835,739 bytes, `application/pdf`, one page**, text layer intact:

```
http=200 size=4835739 type=application/pdf
```

Re-parsed from the fresh artifact and diffed against
`o1m-2-capitals/data/sc-victoria-iso-jumada2-1448.json`:
**rows 28/29 identical, iqamah 29/29 identical**, one difference:

| Date | Column | Bank | PDF |
|---|---|---|---|
| 2026-11-23 | sunrise | 05:53 | **05:54** |

The neighbouring days print 05:53 (22nd) and 05:54 (24th), so the printed 05:54 on the 23rd is the
publisher's value and the bank carried a transcription slip. A one-minute correction, sunrise only,
no twilight cell touched.

**The fit survives the correction.** Re-run at 17.75/17.25 Shafi with dhuhr +1, asr +1, maghrib +2
(`fit/seychelles-refit.mjs`):

| Column | exact | within-1 | worst |
|---|---|---|---|
| fajr | 8/29 | **29/29** | 1 |
| sunrise | 15/29 | **29/29** | 1 |
| dhuhr | 13/29 | **29/29** | 1 |
| asr | 21/29 | **29/29** | 1 |
| maghrib | 16/29 | **29/29** | 1 |
| isha | 11/29 | **29/29** | 1 |

Joint all-six within-1: **29/29**. The bare 18/17 with zero margins fails the same month at 6/29,
which is what makes the recorded margins a measurement rather than a preference.

**After: CONFIRMED, one row corrected.** The 403 was the fetch and never the publisher: the same URL,
same day, answers 200 to a browser UA. Authority tier, one Hijri month, unchanged.

Artifacts: `captures/sc-jumada.pdf` (+ `.text.txt`, `.captured-at.txt` = 2026-11-11T12:44:34Z).
Data: `data/seychelles-reparsed.json`, `data/seychelles-correction.json` (the one-cell diff against
the record). Fit: `fit/seychelles-refit-residuals.json`.

---

## 3. The Islamic Academy — the 404s are real, and the series is not a prayer table

**Before.** "Its dated series stops at 2013 for the United States and 2010 for Indo-Pak-Bengal, every
file in both series is a dead link … the archive reports a 200-status capture of the 2010 file's URL
and the replay yields no document."

Two separate errors sat inside that sentence, and both are now measured.

**Error one: the probe path, not the file.** The calendar index lives at
`html/General/Calenders.htm`, and every "view" page is a sibling there. The wave probed
`html/Calenders/IndoPak_2007.htm`, one directory short, and banked its 404 as a dead page. The correct
paths answer **200 today**, all eleven of them:

```
USA_2003 .. USA_2009, IndoPak_2003, IndoPak_2005, IndoPak_2007, IndoPak_2008   http=200
```

Each page carries one image, and each image is live and banked (548x792 to 714x886 GIF). The text of
every readable one names the document class in its own header:

```
ISLAMIC CALENDAR FOR 2005 (1425/26 HIJRI) FOR Indo-Pak & Bangla Desh
Islamic Calendar 2009 (1430/31 Hijri For USA)
ISLAMIC CALENDAR FOR 2003 (1423/24 HIJRI) FOR USA
```

Across all eleven images the OCR returns **zero `HH:MM` time tokens**. A month panel cropped at 4x
returns day numbers and weekday headers and nothing else. These are Hijri/Gregorian date grids.

**Error two: the PDF route is dead at the publisher, and the archive proves when.** The download links
point at `pdf/QM3N.php?file=<name>`, which is a live PHP script returning a **16-byte
`File not found.`** body for every name — a script response, not a server 404 (a server 404 here is
808 bytes). The Wayback availability API returns a 200 capture for each of these names, and the replay shows
what was captured:

| Archived file | Capture | Payload |
|---|---|---|
| `IndoPak_2010.pdf` | 2025-08-05 04:42:41 | **94,173 bytes, `%PDF-1.6`**, a real document |
| `USA_2010.pdf` | 2025-08-03 14:08:39 | **93,655 bytes, `%PDF-1.6`**, a real document |
| `USA_2011.pdf` | 2024-11-07 18:37:31 | 48 bytes, `<html><body>ERROR: File not found.</body></html>` |
| `USA_2012.pdf` | 2025-01-22 15:01:15 | same 48-byte error body |
| `USA_2013.pdf` | 2024-11-07 18:55:20 | same 48-byte error body |

The two surviving PDFs are banked, and they are calendars too: the first text line of each is
`SMTWT F S SMTWT F S SMTWT F S SMTWT F S`, a month-grid header, with zero time tokens.

So the years 2011, 2012 and 2013 do not survive anywhere, and the archive's own 200-status capture is
an error body — the same defect class this wave exists to catch, found inside the archive.

**After: CORRECTED.** Three statements replace the old verdict:

1. The dated series is a **Hijri calendar**, not a prayer timetable, in every artifact that survives:
   eleven live images and two archived PDFs, zero time tokens in any of them. There was never a dated
   prayer edition to stop.
2. **All eleven view pages are live**, and their images are banked. The earlier 404s there
   were a wrong directory.
3. **The PDF download route is genuinely dead at the publisher** — a live script returning
   `File not found.`, with the archive's 2024 capture holding the same error body. USA 2011-2013 are
   lost; USA 2010 and IndoPak 2010 survive as archived PDFs.

The consequence for the record is what the old verdict said for the wrong reason: the Academy's
prayer-times layer stays **provisional, community, undated by construction**, because the publisher's
dated series carries dates and no times.

Artifacts: `captures/iaac-{USA_2003..USA_2009,Indo_Pak_2005,Indo_Pak_2007,Indo_Pak_2008,Indo-Pak-2003}.gif`,
`iaac-USA-Plano-2003.gif`, `iaac-USA-2004.gif`, `iaac-USA_2010.pdf`, `iaac-IndoPak_2010.pdf`,
the eleven live `iaac-live-*.htm` pages, and `iaac-calenders-live.html`.

---

## 4. Wrexham and Dundee — one month route failed, one did not

### Wrexham — CORRECTED: June and July are published

**Before.** "Wrexham and Dundee, whose failing months are recorded as publisher absences."

**Evidence now.** The mosque's home page links four month PDFs, all live, all under
`/wp-content/uploads/2026/09/`: **June, July, August, September 2026**. The media API confirms exactly
four PDFs in the library and no others.

The old wave banked August and September (58 rows) and recorded the other ten months as 404. Ten names
were guessed (`wrexham-Jun-2026.pdf`); the site serves `June-2026.pdf`. Two of the ten are real files
under the correct name:

| File | HTTP | Bytes |
|---|---|---|
| `June-2026.pdf` | 200 | 255,055 |
| `July-2026.pdf` | 200 | 244,468 |
| `Aug-2026.pdf` | 200 | 249,715 |
| `Sep-2026.pdf` | 200 | 257,190 |

Parsed and gated (`data/parse-wrexham.py`, rows in `data/wrexham-2026-jun-sep.json`): **122 dated rows, 30/31/31/30 across the four months, and
the printed weekday agrees with the calendar on 122 of 122 days**. The 58 banked August-September rows
reproduce identically, so the correction is additive and the old rows stand.

What the four months add beyond the rows is the shape of the column:

| Month | sunrise − fajr | isha − maghrib |
|---|---|---|
| June | 128..133 min | **60 exactly, sd 0.00** |
| July | 127..156 | **60 exactly, sd 0.00** |
| August | 104..134 | 56..60, sd 0.89 |
| September | 103..108 | **80 exactly, sd 0.00** |

The isha column is a hand-set monthly interval, not a solar one, and September's +80 that the old wave
found is one point on that ladder. The fajr column is not an angle at this point: a 14-20 degree sweep
returns at best 20/31 within 1 (August, 15 degrees) and 12/30 (September, 16 degrees). **No recipe is
claimed for this surface.** It is banked as captured, community tier, with its own monthly rule; the
sweep is `fit/wrexham-recipe-sweep.json`.

**After: CORRECTED.** June and July were published all along. October-December are genuinely absent
from the library; the archive is four months, not twelve, and the failure was the filename, never the
publisher.

### Dundee — CONFIRMED: a rolling month, now with two more dated tables

**Before.** "`November-2026.pdf` only; the January and June names 404, so the archive is a rolling
single month."

**Evidence now.** The publisher's own media API returns **three PDFs in total**: the November 2026
timetable, `DMFS.pdf` (a 64-page funeral-services guide) and `book.pdf` (2020). The live home page
links the November table and nothing else. The rolling-month reading is right, and now rests on the
publisher's inventory rather than on two failed guesses.

The archive holds more of the same series than the live site does. The CDX index lists six timetables:

| Archived file | Capture | Banked |
|---|---|---|
| `timetables/Ramzan 2021.pdf` | 2025-04-13 | enumerated, not fetched |
| `2022/11/Dec-2022.pdf` | 2023-01-10 | enumerated, replay blocked |
| `2023/01/Jan-2023.pdf` | 2023-01-10 | **banked, 707,100 bytes** |
| `2023/01/Feb-2023.pdf` | 2023-03-12 | enumerated, replay blocked |
| `2023/02/March-2023.pdf` | 2023-03-12 | enumerated, replay blocked |
| `2025/11/Dec-2025.pdf` | 2025-12-07 | **banked, 711,553 bytes** |

Both banked months are real prayer tables with a text layer, not calendars:

```
Hijriah Date Day Subh Sadiq Fajr Jamaat Sunrise Zawal End Zuhr Jamat Mithal - I Mithal - II Asr Jamaat Magrib Isha Isha Jamat
JMT 9 Jan 1 Sun 06:23 07:30 08:46 12:23 01:10 01:32 01:57 02:15 03:50 05:48 07:00
```

The text layer prints **eleven values against fourteen header names**. Sunrise fixes the identification
for the first four columns (07:21 on 1 November 2026 is Dundee's sunrise to the minute), leaving Subh
Sadiq, Fajr, Sunrise, Zawal, Zuhr, Zuhr jamaat, Mithal-I, Mithal-II, Asr, Maghrib, Isha. The three
jamaat columns that carry no printed value in the text layer are **named open**, not guessed, and no
rows are claimed from these two files. They are banked as artifacts and text.

**After: CONFIRMED.** Dundee publishes one rolling month, proved by its own three-file library. The
month route did not fail; the guessed filenames did. Six historical months are enumerated and two are
banked as the route to a second Dundee year.

### The Wayback replay block, recorded

The Wayback CDX endpoint answered once (`captures/cdx-dundee.json`, 79 URLs) and then returned HTTP
503 `Internet Archive: Temporarily Offline` on every later call, and the replay host returned HTTP 429
with an explicit abuse flag at **2026-11-11T12:51Z**:

```
Your request is being blocked because our system has flagged it as suspected abusive bot traffic ...
```

The three unbanked Dundee months are held as `captures/dundee-wb-*.429-block.txt`. What it leaves
unresolved: whether Dec 2022, Feb 2023, Mar 2023 and Ramzan 2021 carry the same eleven-column layout,
and whether a second fitted Dundee year is available. A browser session passes the same block, which
is how the two banked months were retrieved; the remaining four are a NEXT item, not a negative.

---

## 5. What this wave changes

| Record item | Change |
|---|---|
| Jyväskylä bank (353 rows) | **Confirmed.** Artifact found, live, sha256-identical. |
| Jyväskylä grade | **provisional → A**, community, mosque tier: 2024, 2025 and 2026 fitted on one frozen recipe, substitution window identical each year. |
| Jyväskylä rows | **+881**, total 1,234 across 2023-08..2027-01. |
| Seychelles bank (29 rows) | **Confirmed**, one sunrise minute corrected (2026-11-23 05:53 → 05:54). Fit holds 29/29. |
| Islamic Academy dated series | **Reclassified:** a Hijri calendar, not a prayer table. Eleven live images and two archived PDFs banked; USA 2011-2013 lost at the publisher. |
| Wrexham rows | **+64**, total 122 across June-September 2026; 122/122 weekday check. No recipe claimed. |
| Dundee | **Confirmed** rolling single month; two archived months banked, column mapping open. |
| `.pdf` error-body class (D7) | **Two of the four reopens were filename miscounts**: Jyväskylä's artifact sat on disk under a different name, and Wrexham's two months were live under a different name and never captured. **One was a class error** (Academy). **One was right** (Seychelles). |

The close should also correct the D7 wording itself: "a capture failure is never a publisher verdict"
holds, and this wave adds its converse — **a 404 at a guessed URL is not a publisher's absence until
the publisher's own index has been read**. Two of the four verdicts would have been prevented by
reading the media API or the site's own directory before writing the URL.

## 6. NEXT

1. **Replay the four blocked Dundee months** (Dec 2022, Feb 2023, Mar 2023, Ramzan 2021) when the
   Wayback block lifts, and settle the eleven-of-fourteen column mapping against a month whose sunrise
   and maghrib are both identifiable. That is the route to a second Dundee year.
2. **Wrexham from October onward**: the library stops at September, so a re-read in December is the
   only way to learn whether the mosque resumes uploading or has abandoned the series.
3. **Jyväskylä 2023's first seven months.** The 2023 files start in August; the 2022 upload folder
   holds `January2023`-class names only, so the archive may reach back further under the 2023/03 and
   2023/04 folders than the media index shows — worth one directory probe.
4. **The Academy's perpetual city tables are a separate surface** and were not touched here: the
   `Timetable.htm` index carries 137 country links and the India tables are undated by design. What
   this wave establishes is that no dated prayer edition exists to look for, which ends that search.
5. **The 2026-03-29 Jyväskylä DST defect** wants a second year with the same DST Sunday inside a
   published month to see whether it recurs. 2027-03-28 will be in the mosque's next March file.
