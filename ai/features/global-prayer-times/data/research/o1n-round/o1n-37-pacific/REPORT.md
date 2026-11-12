# O1n-37 Pacific and Oceania re-cover - REPORT

Wave o1n-37, session three, round four (o1n), started 2026-11-12. Workspace:
`$HOME/athan-gitree/census/o1n/o1n-37-pacific/`. One section per entry, written
incrementally as entries bank. Times UTC. Never blended across a dated regime
change. All fits on adhan 4.4.6 (`census/adhan-build/node_modules/adhan`),
Rounding.None, HighLatitudeRule.MiddleOfTheNight unless stated.

Held state inherited untouched: the turktakvim tree rows for every entry here
(`o1n-3-turktakvim/data/tt/`), the O1n-29 Kiribati Ahmadiyya witness, the O1n-32
monthly-route verdict (monthly pages are re-serves of the annual rows; shells
stay shell). New Zealand out of scope this wave (another wave's re-cover).

## Fiji - LOCAL AUTHORITY SURFACE FOUND (the depth-pass answer is YES)

The depth pass asked: does ANY Fiji city hold a local surface beyond the
platform? Answer: yes, two classes.

1. **FML-FMLCOMFJ-2024 (authority, provisional)**: the Fiji Muslim League's own
   site (fml.com.fj, founded 1926, centenary 2026 branding on site) serves a
   Prayer Time page (https://www.fml.com.fj/prayer-time/) linking twelve monthly
   JPG timetables (uploads 2024/06; April-December self-labelled 2024; January-
   March same batch, no year suffix, dated 2024 by the upload path and the
   identical layout). All twelve JPGs captured (`captures/fml-2024-*.jpg`, 220-253
   KB each) and OCR'd through the local Vision fast binary via column strips
   (`scripts/fml-strips2.py`, `captures/fml-ocr/`).
   - Sheet convention: 8 columns (Date, Fajr, Sunrise, Dhuhr, Asr(S), Asr(H),
     Maghrib, Isha) at a Suva base town, plus a per-town TIME DIFFERENCE block
     (towns at +1/+2/+3 min later, one town earlier; partially OCR'd, kept as
     `captures/fml-ocr/*-full.txt` open item).
   - **January 2024 parsed whole**: 31 dated rows x 7 time columns
     (`data/fml-fiji-2024-rows.json`; 2024-01-29 asr_shafi, 2024-01-31 sunrise
     and dhuhr cells unreadable, left null, never interpolated; dhuhr 2:xx-class
     crops repaired to 12:xx per `data/fml-fiji-2024-pm-note.txt`).
   - **Recipe (data/fj-fml-fit.json)** at Suva (-18.1416, 178.4419), clock
     UTC+12 constant - the print does NOT shift for Fiji DST (constant +5/+6
     transit margin across the 2024-01-13 DST-end boundary): fajr 17.75 deg
     (31/31 within-1, worst -1), sunrise +0 (30/30 within-1), dhuhr transit+6
     (30/30 within-1, 19 exact), asr Shafi +0 (30/30), asr Hanafi adhan-model
     as-is (31/31), maghrib sunset+3 (31/31), isha 18.5 deg (24/31 within-1,
     worst -2). Grade provisional (one month, one published cycle); tier
     authority (national Muslim body's own site).
   - February/March/April/October strip parses are on disk but incomplete
     (many unreadable cells; the 2024 JPGs' thin glyphs resist strip OCR) -
     OPEN ITEM for a successor with per-cell re-reads. December's layout
     differs (Salat Timetable, fewer columns) - open.
2. **FJ-SUVA-ALHAQQ (community board witness)**: Masjid al-Haqq, 33 Milverton
   Rd, Suva - a masjidbox tenant, board live and captured
   (`captures/mbx-masjid-al-haqq-suva.html.gz`, board text
   `captures/mbx-alhaqq-board-2026-11-13.txt`). Board prints no year
   (year-blind, NP-RAHMANIYA-BOARD precedent). Same-date cell diff against the
   platform Suva row (`data/fj-suva-board-witness.json`): fajr -1, shuruq +4,
   asr +38 (the board's asr is the Hanafi asr), maghrib -5, isha -8. The board
   is a distinct community generation, not the platform line. Jumuah 13:10
   recorded (not comparable to the dhuhr transit column).

Negative/false-positive recorded: masjidbox "FJIA SSF" is 373 Alta Vista Drive,
South San Francisco, CA, USA - NOT Fiji (search-phrase collision; board stale
since 2024-01-04, never used as data). fjia.org serves no table (606-byte stub).

Platform inheritance stands: 79 Fiji settlements / 72 tables / 26,280 dated rows
(TT-TREE), recipe at the publisher-ladder median. The FML fit is the first
local-authority recipe for Fiji in the census.

## Hawaii - Hilo masjidbox witness banked; MAH no live table

**HI-HILO-ICOH (community board witness)**: Islamic Center of Hawaii, 688
Kinoole St unit 101, Hilo - masjidbox tenant, board live and captured
(`captures/mbx-hilo-icoh.html.gz`, `captures/mbx-hilo-board-2026-11-12.txt`,
2026-11-12T10:28Z, Hilo local). Same-date cell diff against the platform Hilo
row (`data/hi-hilo-board-witness.json`): fajr -1, shuruq +4, dhuhr -7, asr -8,
maghrib -5, isha -8. The board is its own generation (uniform negative margins
against the platform line), year-blind, community tier.
**Negative**: the Muslim Association of Hawaii (hawaiimasjid.com, Manoa - the
only Oahu mosque) carries NO prayer-times page on the live site (nav is
home/about/announcements/contact); the Google-indexed "Fajr 5:22 AM" table is a
stale older crawl, absent live. Recorded, not fetched further.

## New Caledonia - Centre Islamique de Noumea mawaqit board banked

**NC-NOUMEA-CIN (community board witness)**: Centre Islamique de Noumea,
mawaqit tenant id 17035, board live and captured
(`captures/mawaqit-noumea-board-2026-11-12.txt`, 2026-11-12 ~10:3xZ, UTC+11).
Board: imsak 03:33, fajr 03:43, dhuhr 12:10, asr 15:10, maghrib 18:17, isha
19:45, jumua 12:00 (the board's own +N suffixes are its jamaah offsets).
Same-date cell diff against the platform Noumea settlement row
(`data/nc-noumea-board-witness.json`): imsak +2, fajr -1, dhuhr +24, asr +3,
maghrib -1, isha +9. Distinct generation (the dhuhr +24 pad is the mosque's
own convention), year-blind, community tier. Second named surface: Bourail
Islamic Centre (Nessadiou, beside the Arab cemetery) - Facebook/RISEAP news
only, no timetable. Facebook page Mosquee.Noumea = named lead (login-walled).

## Palau - first own-site surface, board banked AS PRINTED with anomaly

**PW-PALAUCENTRAL (community board, not proven as a Koror record)**: Palau
Central Mosque's own site (palaucentralmosque.com) captured live
2026-11-12T10:30Z (`captures/pw-palaucentral.html.gz`; rendered board text
saved). Dated 2 Jumada al-Thani 1448 = Thu 12 Nov 2026, label "Palau", with
Fajr 7:51 AM, Zuhr 2:43 PM, Asr 5:52 PM, Magrib 8:14 PM, Isha 9:44 PM, Jumah
2:00 PM, Sunrise 9:11 AM, Sunset 8:14 PM. These do NOT reproduce Koror solar
values: the whole board sits about +3h off the platform Koror row (suspected
misconfigured location or a doubled timezone offset on the mosque site; the
list items carry a data-offset="9" attribute). Recorded AS PRINTED, never
corrected, community tier, year-blind (Hijri date only). False positive
recorded: "ICP alminaret" is the Islamic Center of Pennsylvania (Mechanicsburg,
PA), not Palau.

## Shell probes (Tonga, Samoa, Wallis and Futuna) - publisher routes closed

Live probes 2026-11-12 (~10:2x-10:5xZ), one settlement per shell country from
the tree's own province inventories (Tonga 82058 Eua; Samoa 63191 Savai'i;
Wallis 62323 Fuduna): the publisher serves the BYTE-IDENTICAL no-table shell
on ALL THREE routes - annual (yillikvakitler), monthly (aylikvakitler with
tarih), and the default city page (index.php?cityID=, no link). Captures:
`captures/shell-{tonga,samoa,wallis}-{annual,monthly,city}-*.html.gz`. The
shell title is the site homepage title; the settlement name appears nowhere in
the response; no per-settlement table is reachable from any route tried.
**Alternate route names**: the link inventory inside banked annual captures
carries only siteniz_icin.html, kitaplar.php, seslidinle.php - no other vakit
route exists in the served HTML. The O1n-32 monthly-route verdict (shells stay
shell) is confirmed and extended to the default city route.
**Wayback**: CDX for the Tonga settlement annual URL returns ZERO captures
(probe 2026-11-12); the Samoa and Wallis CDX probes hit "Internet Archive
Temporarily Offline" mid-thread - the thread stopped there per standing
orders, so Samoa/Wallis archive absence is NOT proven, only the Tonga empty.

## Honest negatives (routes named, full detail in data/negatives-o1n-37.json)

- **Papua New Guinea**: Hohola Mosque (Malas Street, Hohola, Port Moresby) has
  no own-site timetable; Facebook groups/RISEAP video/YouTube only - named
  leads, login-walled, never fetched. Platform rows stand (116 settlements).
- **Solomon Islands**: aggregators only; the "Islamic Association" hit is
  Toronto, Canada - name collision. Platform rows stand (14).
- **Vanuatu**: Port Vila Grand Mosque and the Vanuatu Muslim Centre are
  Facebook-news only. Platform rows stand (5).
- **Marshall Islands**: aggregators only (11 named in the data file). (14.)
- **Micronesia**: aggregators only; lead = Ahmadiyya Muslim Community FSM
  Facebook (Kolonia). (20.)
- **Nauru**: no mosque surface at all. (4.)
- **Tuvalu**: the Ahmadiyya Tuvalu Mosque (Funafuti) has no timetable; lead =
  Instagram @amj.tuvalu. (7.)
- **American Samoa**: no mosque web surface; the dispatch's "shell-only" label
  for American Samoa does not match the held store (27 tables banked) - store
  wins, recorded. (27 / 9,855 rows.)
- **Samoa**: Masjid Miriam (only mosque) Facebook-only; lead named. Shell
  probe negative. (36 settlements, 0 tables.)
- **Tonga**: Al-Taiyab mosque Nuku'alofa Facebook-group mention only; lead
  named. Shell probe negative. (94 settlements, 0 tables.)
- **Wallis and Futuna**: nothing beyond aggregators. Shell probe negative.
  (28 settlements, 0 tables.)
- **Northern Marianas**: Saipan Baitus Salam Jam-e Masjid (Ahmadiyya) is
  Facebook-only; lead named. (1 settlement, Saipan Island.)
- **French Polynesia**: the Papeete prayer room was shut a day after its
  2013-10-15 inauguration (France24/RNZ coverage); Tahiti Islamic Centre has
  no timetable; press leads named. The held FALLBACK-class line stands.
  (51 / 18,615 rows.)
- **Guam**: Masjid An-Noor Guam (Mangilao, opened 2000) is Facebook-only;
  lead named. (4.)
- **Easter Island**: no mosque, no Muslim community surface; aggregators
  only; the turktakvim tree carries NO Easter Island settlement (store checked
  under chile and tree-wide - none). The census entry holds aggregator rows.

## Wayback evidence for the FML surface (Fiji)

CDX for fml.com.fj/prayer-time/ lists eight 200 captures 2024-08-08..2026-04-17.
The 2024-08-08 and 2026-04-17 bodies were fetched and both carry the IDENTICAL
twelve 2024/06 monthly JPG links served live today: one published generation
across the whole archive span, never rotated (`captures/fml-wayback-*.html`).
This supports grading FML-FMLCOMFJ-2024 as one published 2024 cycle.

## Session totals

- Banked dated rows this wave: 31 (FML January 2024, 7 columns, 3 cells null).
- Board witnesses banked: 4 (Suva al-Haqq, Hilo ICOH, Noumea CIN, Palau
  Central - the last as-printed with the +3h anomaly, not proven as Koror).
- Recipe: Fiji FML (fajr 17.75 / isha 18.5, Shafi asr, dhuhr +6, maghrib +3,
  sunrise +0, UTC+12 constant) - provisional, authority tier.
- Shells re-proven on all publisher routes: Tonga, Samoa, Wallis and Futuna.
- Negatives with routes/leads: 15 entries (data/negatives-o1n-37.json).
