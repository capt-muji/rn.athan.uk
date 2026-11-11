# WATCHES — the December pre-stage, o1m-53

Compiled 2026-11-11T13:15-13:22Z. Machine-readable twin: `watches.json`. Every probe in this wave
is a row in `probes.tsv` with its body in `captures/`. Rows marked carried were probed earlier
today by o1m-r5 at the timestamp given and were not re-probed.

## The gate

Two traps were paid for this round and both are live on this list.

1. **The year parameter that echoes.** JAKIM's `&year=2027` and Diyanet's `?yil=2027` return the
   current year's payload. Reading the parameter, or the query string, reports a success that
   does not exist.
2. **The label that advances while the computation does not.** mawaqit's `?year=2027` now rewrites
   the PDF date column to 2027-01-01 while all 365 prayer rows stay identical to the 2026 call.
   A payload-date gate PASSES here. Only the value diff catches it.

So the check column below is one of three: `payload_date` (the object's own date column must move),
`value_diff` (values must differ against the prior period, aligned by month-day), or `hash_change`
(an opaque file must hash differently from the held artifact).

## The list

| # | Country | Surface | URL | Last verdict | Payload date at that verdict | Window | First probe | Check | Owner wave |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Morocco | Habous monthly JS | habous.gov.ma/data/horaires-2026-12.js | NOT MET | 404; control 2026-11 = 200, annee 2026 mois 11, 190 cities | 2026-11-29..12-05 | 2026-12-01 | payload_date | o1m-r5 |
| 2 | Chile | CICh monthly sheets | radioislam.cl/horarios-diciembre/ | NOT MET | 404; November page 200, sheets in uploads/2026/10 | 2026-11-27..12-03 | 2026-11-29 | payload_date | o1m-r5 |
| 3 | Spain | CCIM Madrid monthly PDF | centro-islamico.com/Doc/Horario/2026/Diciembre-2026.pdf | NOT MET | 404; Enero..Noviembre 2026 all 200 | 2026-11-30..12-03 | 2026-12-01 | payload_date | o1m-r5 |
| 4 | France | GMP Paris monthly poster | grandemosqueedeparis.fr/horaire-des-prieres-paris/ | NOT MET | NOVEMBRE 2026 poster still live | 2026-12-01..12-11 | 2026-12-01 | hash_change | o1m-r5 |
| 5 | Sri Lanka | ACJU zone PDFs | acju.lk/prayer-times/ | NOT MET | zero uploads/2026/12; uploads/2026/11 = 12 PDFs, all zone 03 | 2026-12-03..12-10 | 2026-12-05 | payload_date | o1m-r5 |
| 6 | Fiji | FML monthly sheet | fml.com.fj/prayer-time/ | NOT MET (carried) | December link still uploads/2024/06/December-2024.jpg | 2026-12-01..12-31 | 2026-12-10 | payload_date | o1m-r5 |
| 7 | Brunei | MORA OData feed | mora.gov.bn `Waktu Sembahyang` | NOT MET | newest row 2026-12-30T16:00Z = 2026-12-31 local | 2026-12-20..12-31 | 2026-12-20 | payload_date | o1m-r5 |
| 8 | Kosovo | Dituria takvimi | dituriaislame.com media API, search=2027 | NOT MET | search returns []; newest edition 2026-01-14 | 2026-12-27..2027-01-20 | 2026-12-28 | payload_date | o1m-r5 |
| 9 | Malaysia | JAKIM yearly feed | e-solat.gov.my takwimsolat, zone WLY01 | NOT MET, parameter inert | 01-Jan-2026..31-Dis-2026 on both calls, arrays byte-equal | 2027-01-01..01-05 | 2027-01-01 | payload_date | o1m-r5 |
| 10 | Turkey | Diyanet yearly table | namazvakitleri.diyanet.gov.tr/tr-TR/9541 | NOT MET, parameter inert | 01..31 Aralik 2026 present, zero 2027 tokens | 2027-01-01..01-05 | 2027-01-01 | payload_date | o1m-r5 |
| 11 | Thailand | SKTHAI workbook | skthai.org/th/pages/28433 | NOT MET | BE 2568 and 2569 only, zero 2570 | 2027-01-01..01-20 | 2027-01-01 | hash_change | o1m-r5 |
| 12 | Indonesia | Kemenag SIHAT | sihat.kemenag.go.id (carried) | NOT MET, ceiling 2026-12-31 | served units end 2026-12-31 | 2027-01-01..01-31 | 2027-01-01 | payload_date | o1m-r5 |
| 13 | Ireland | IFI timetable API | islamicfoundation.ie/api/timetable?year=2027 | NOT MET, parameter blind (carried) | sha256-equal to ?year=2026 | 2027-01-01..02-01 | 2027-01-01 | value_diff | o1m-r5 |
| 14 | Belarus | islambel.by | islambel.by/vremya-namazov | NOT MET (carried) | 365 tokens of 2025 against 2 of 2026 | 2027-01-01..01-31 | 2027-01-01 | payload_date | o1m-r5 |
| 15 | Platform | mawaqit year parameter | mawaqit.net/en/calendar/\<uuid\>.pdf?year=2027 | NOT MET, the trap (carried) | dates print 2027-01-01; 365/365 values identical to 2026 | 2027-01-01..03-31 | 2027-01-15 | value_diff | o1m-r5 |
| 16 | Bahrain | Supreme Council almanac | almajles.gov.bh/Programs/calendar/ | NOT MET for 1449 (carried) | 1448 edition runs to 2027-06-05 | 2027-05-01..06-06 | 2027-05-15 | payload_date | o1m-41 |

## The December-1 cohort, by day

Eight of the sixteen surfaces in the table publish in December. The order matters: probing them all on 1 December
wastes six probes, and probing Morocco on 1 December may already be a day late.

- **2026-11-29 — Morocco and Chile.** Morocco keeps exactly the current and the previous month
  file: this wave measured 2026-01..09 all 404, 2026-10 at 200 (301,588 B) and 2026-11 at 200
  (292,088 B). A series with that retention cannot serve November on 1 December, so the December
  file is written at the month roll. Chile's November sheets sit in `uploads/2026/10`, one folder
  ahead of the month they cover.
- **2026-11-30 — Madrid.** Eleven of twelve 2026 months are served, so December is lateness, not
  absence. The single Wayback datum for the tree, `2025/Septiembre-2025.pdf` captured 2025-09-02,
  puts publication at or just after the month start.
- **2026-12-01 — Grande Mosquée de Paris.** Four Wayback captures bracket the roll: 2026-02-10
  carried FEVRIER, 2026-06-09 carried JUIN, 2026-07-11 already carried Juillet. The poster is
  live inside the first ten days of its own month. The 2026-05-13 capture carried an undated
  `PARIS - GMP.jpg`, so the filename is not a safe key on every month; match the month token and
  fall back to the image hash.
- **2026-12-03 — Sri Lanka.** Uploads arrive per depot in waves. November reached 12 of 13 zones
  and all twelve are zone 03, with 300 references still pointing at `uploads/2026/10` for the
  rest. This is a multi-day watch, not a single check.
- **2026-12-10 — Fiji.** No cadence is inferable: the December link still points at
  `uploads/2024/06/December-2024.jpg`, so the surface is two years stale and a repeated 404 is
  publisher dormancy, not a missing route.
- **2026-12-20 — Brunei.** The feed terminates exactly at 2026-12-31 local, so the extension is an
  end-of-year event by construction.
- **2026-12-28 — Kosovo.** Four edition dates from the publisher's own media library: 2022-02-14,
  2022-12-30, 2023-12-27, 2026-01-14. The window is late December to mid January.

## The 1449 almanac cohort

**1449 AH opens 2027-06-06.** One Muharram 1448 plus one lunar year, read off the Bahrain
edition's own terminus of 2027-06-05. The consequence is that no Hijri-year almanac is due in
December 2026, and a December probe of one can only record absence.

- **Bahrain.** The 1448 edition already carries the calendar to 2027-06-05, so Bahrain has no 2027
  gap before June. First honest probe 2027-05-15, not December.
- **Saudi umqserv.** 1449 and 1450 are already banked at 82,128 city-days this round. No watch.
- **Kosovo and Brunei** are Gregorian-year editions that carry Hijri labels in-row; they sit in the
  December list above on their Gregorian schedule.

## What this wave changed

Three findings, all measured here.

1. **Morocco's retention is the watch.** Only two month files exist at any time. That converts an
   open-ended "probe from 1 December" into a dated expectation and explains why earlier months
   404: they were never missing, they were dropped.
2. **Chile has a faster gate than its page.** `uploads/2026/11/Diciembre-2026-1.pdf` returned 404
   (1,249 B) while the November twin under `2026/10` returned 200 (201,911 B). The upload path is
   answerable before the page is rebuilt, and the site's REST media API is 401.
3. **Madrid is continuity, not discovery.** Eleven consecutive 2026 months proves the series runs
   monthly, so December needs no new route, only a later date.

## Honest negatives and what is not banked

- The Wayback CDX index has one snapshot of the Morocco series (2026-10-23) and none for any other
  month, so the month-ahead publication hypothesis rests on retention, not on an archive.
- `skthai.org` answers 403 to a browser-UA curl (5,661 B) and 200 through the reader route
  (19,390 B). The direct route is blocked and stays recorded as such.
- `radioislam.cl/wp-json/wp/v2/media` answers 401 on both searches; the page and the upload path
  are the only two routes.
- Not re-probed this wave, verdicts carried with their timestamps: mawaqit value diff, Fiji,
  Ireland, Belarus, Kemenag SIHAT, Bahrain almajles.
- The Kosovo takvim page itself was not opened; only the media API was read.
- The Brunei 161-list catalogue was not re-read for a second prayer list.
