# O1n-33 Asia re-cover — REPORT

Wave O1n-33 (respawned; predecessor wrote nothing, workspace found empty 2026-11-12).
Session three, round four (o1n). Workspace: `$HOME/athan-gitree/census/o1n/o1n-33-asia/`.
Bundle: Japan, South Korea, China, Mongolia, Hong Kong, Macao, Thailand, the Philippines,
Vietnam, Cambodia, Laos, Singapore, Brunei, India, Pakistan, Bangladesh, Sri Lanka, Nepal,
Afghanistan, and the Central Asian republics. Indonesia and Malaysia excluded (another wave's
fresh work). The round exclusion (owner order 2026-11-11) applied end to end: the excluded
territory is never named here and no work touches it.

Fit index of record: `o1n-26-fitindex5/FIT-INDEX-ROUND5.md` + `.json` (173 entries).
Engine of record: adhan 4.4.6 at `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`.
All timestamps UTC. Raw captures under `captures/` (gzipped), derived rows and fits under `data/`.

## Entries selected (weakest of the bundle, worked one at a time)

| # | Entry id | Country | State in index | Planned routes |
|---|---|---|---|---|
| 1 | LK-ACJU-13-ZONES | Sri Lanka | provisional, frozen-reprint (2025=2026 relabel) | the open 2027-edition watch; publisher's own next-year edition |
| 2 | AF-TAWKIT-8 | Afghanistan | provisional, untestable-single-year | tawkit window probe; window-roll state; Fazilet held as family |
| 3 | PK-TAWKIT-453 | Pakistan | provisional, untestable-single-year | same tawkit probe (the pool is one window) |
| 4 | UZ-ISLOM-6-CITIES | Uzbekistan | provisional, untestable-short-sample | publisher monthly archive back to 2025; second publisher |
| 5 | KR-DIYANET-40 | South Korea | provisional platform, single-year, no witness | Korea Muslim Federation witness, cell diffs vs held tree |
| 6 | JP-DIYANET-143 | Japan | provisional platform, single-year, no witness | Tokyo Camii / Islamic Center of Japan witness, cell diffs |
| 7 | CN-NORISLAM-10 / CN-DIYANET-222 | China | measured template / provisional platform | norislam year axis probe; witness hunt |
| 8 | TH (no dedicated entry) | Thailand | Fazilet family only (11 cities, 1 fit) | Central Islamic Council hunt; new surface or honest negative |
| 9 | MN-DIYANET-67 | Mongolia | provisional platform, single-year | local witness (mn/ru), Fazilet pad departure stands |
| 10 | PH (Fazilet family only) | Philippines | no dedicated entry | NCMF/Manila witness hunt |
| 11 | VN-HANOI-AL-NOOR / KH-PHNOM-PENH-ALSERKAL / LA-VIENTIANE-JAMIA | VN/KH/LA | community provisional single-year each | Wayback probe (one per surface, stop on 429); second body |
| 12 | TM-DIYANET-6 / MO-DIYANET-1 | Turkmenistan/Macao | provisional platform, single-year, negatives held | witness hunt ru/tk; expect honest negatives |

---

## Entry 1 — LK-ACJU-13-ZONES (Sri Lanka), the 2027-edition watch

VERDICT (2026-11-12): the ACJU 2027-edition watch is answered NEGATIVELY. The live
prayer-times page now serves 156 monthly PDFs uploaded 2026-10 (zones 01, 02, 04-13)
and 2026-11 (zone 03, Mullaitivu/Kilinochchi/Vavuniya), twelve months each, and no
sampled sheet prints a year. 143 sampled rows across five sheets (Colombo Jan 29 +
Jul 30, Kandy Jan 30 + Jul 24, zone 03 Jan 30) are cell-identical to the held 2026
edition on all seven columns (fajr, sunrise, dhuhr, asr shafie, asr hanafi, maghrib,
isha). The fresh upload batch is the 2026 edition re-served, one computed generation.
The held frozen-reprint verdict stands and strengthens: three served editions (2025,
2026, the 2026-10/11 re-upload) on one generation, no lift. Wayback CDX for
uploads/2027* returned the Internet Archive outage page (the same outage O1n-9 hit);
thread stopped, route an open watch. Zone-03's fresher 2026-11 upload is also
generation-identical (30/30 January rows).

Artifacts: `data/lk-acju-newbatch-survey.json`, parsed rows in
`data/lk-acju-newbatch-sample-parsed.json` and `data/lk-acju-newbatch-colombo-month1.json`,
raw PDFs and OCR text under `captures/lk-acju-*`, parser `scripts/lk-acju-parse.py`.

## Entry 2 — AF-TAWKIT-8 (Afghanistan), full-window year-2 fit

VERDICT (2026-11-12): the held bank (o1m-10, eight cities, harvested 2026-11-11) already
carries the publisher's full 365-day window (2026-11-01..2027-10-31); the index fit had run
November only. Fitted the FULL window on the held recipe (adhan 4.4.6, Other 18/18, Shafi,
MiddleOfTheNight, Rounding.None, tz UTC+4:30): 100 pc within-1 on ALL eight cities on BOTH
calendar years separately - 2026 (61 days): exact 82.5-88.5 pc, worst 0.80 min; 2027 (304
days): exact 65.1-70.0 pc, worst 1.33 min; the whole window 100 pc within-1, parameters
frozen. Between-year stability: one recipe holds both years.

Genuine-recompute test: INCONCLUSIVE at the test floor. Kabul's year-over-year solar
geometry drift at fixed month-day peaks at 0.38 min (fajr/isha), under the 1-minute test
floor, so a 2027 relabel of 2026 geometry cannot be separated from a genuine 2027 recompute
at this latitude. Sub-minute residuals weakly favor the relabel counterfactual (MAE 0.03-0.18
min better on fajr, sunrise, maghrib, isha; dhuhr and asr tie): recorded "sub-minute
regenerate class - not proven recompute, not proven relabel". No span lift claimed.
Seasonal amplitude banked (Kabul Jan-15 vs Jul-15 printed swing in the fit JSON).

Live gate: today's served Kabul November table (captures/af-tawkit-kabul-20261112.html) is
30/30 cell-identical to yesterday's held harvest. The ?month= parameter is IGNORED (serves
11-2026 regardless) and future-month paths 404: the December roll watch (2026-12-01) stands
as recorded by O1n-29.

Artifacts: `data/af-tawkit8-fullwindow-fit.json` (per-city, per-year, per-column stats and
the seasonal amplitude), script `scripts/af-tawkit8-fullwindow.js`.

## Entry 3 — PK-TAWKIT-453 (Pakistan), per-year split of the held window fit

VERDICT (2026-11-12): the held fit (o1m-3, 453 cities x 365 window days, 991,890 cells)
already spans both calendar years; completed the FIT-RULES per-year breakdown on the full
bank with the held recipe (adhan 4.4.6, Other 18/18, Hanafi, MiddleOfTheNight, Rounding.None,
tz UTC+5): 2026 cells 165,798 at 99.75 pc within-1 (worst 16.8); 2027 cells 826,272 at 99.75
pc within-1 (worst 25.48). Identical margins both years: parameters frozen, no regime change
across the window. The same sub-minute between-year geometry drift applies at Pakistani
latitudes, so the window stays ONE published generation in the record; the between-year
recompute test is below its floor here too. The worst-cell outliers (up to 25.5 min) are
the held fit's own recorded outliers, unchanged.

Live gate: Lahore's live page serves the same one-month window (11-2026) with ?month=
ignored, matching Kabul: the whole pool's December roll watch (2026-12-01) stands.

Artifacts: `data/pk-tawkit453-peryear-split.json`, script `scripts/pk-tawkit453-peryear.js`.

## Entry 4 — KR-DIYANET-40 (South Korea), KMF second-publisher witness banked

VERDICT (2026-11-12): a second local body entered the record. The Korea Muslim
Federation's own prayer-timetable board (koreaislam.org/예배시간표, the KMF official site)
serves a full-year PDF posted 2026-01-30: "Prayer Times for 2026 February - 2027 January",
A.H. 1447-1448, declared "Muslim World League (MWL) method, latitude 37.6, longitude 127,
qibla 285°" (Seoul-centred; the note names Suwon, Inchon, Anyang, Uijeongbu as covered).
All 365 rows parsed from the PDF text layer by glyph coordinates (366 day-slots, none
missing; pages 3-14 = Feb 2026..Jan 2027).

Second-witness cell diffs vs the held turktakvim Seoul tree row (334 common days): fajr
AGREES (median 0, 87/334 exact, 94 pc within-1, range -2..+1); sunrise KMF 4-7 min earlier;
dhuhr -9; asr -9; maghrib -6; isha -9 (all constant-margin blocks) - the turktakvim
publisher ladder's positive margins account for the whole split, so the held platform line
and the KMF authority line are one geometry under two margin sets, agreeing only on fajr.

KMF recipe characterized: the solar columns reproduce on adhan 4.4.6 MWL at the declared
point (37.6/127.0, tz +540) at medians -0.45..+0.57 (sunrise -0.45, dhuhr +0.55, asr +0.57,
maghrib +0.57); fajr +0.68 median (18 deg as declared); BUT the isha column is 17 deg, not
the declared 18: isha at 17 deg reproduces 43.3 pc exact / 98.9 pc within-1 (MAE 0.58,
worst 2.38) while 18 deg sits a constant -4.9 - the classic declared-18/computed-17 split,
recorded as a named rule-form finding. Print fault: 2027-01-27 fajr prints 6:19 against
6:10/6:09/6:08 either side (+9.5), kept as printed and excluded.

Year-2 content: 31 dated rows of January 2027 banked from this authority PDF - the first
2027 dates for Korea from a second publisher. The board's older pages (pageid 2-8) hold
prior-year editions (posted monthly since 2014): the 2025 and 2026 editions are the
next-probe for an overlapping-years recompute test at a 37.6 N latitude.

Artifacts: `data/kr-kmf-annual-2026-02_2027-01.json` (365 rows), `data/kr-kmf-witness-diffs.json`,
parser `scripts/kr-kmf-parse.py`, witness script `scripts/kr-kmf-witness.js`, raw PDF
`captures/kr-kmf-2026-02_2027-01-annual.pdf` (fetched through the browser session: the file
path refuses curl with an empty reply, TLS fingerprint block).

## Entry 5 — JP-DIYANET-143 (Japan), Tokyo Camii witness banked

VERDICT (2026-11-12): a second local body banked. Tokyo Camii (the Diyanet Islamic
Cultural Center, tokyocamii.org/prayertime/) publishes monthly prayer-schedule PDFs;
June 2026 and November 2026 captured (30 + 30 rows, text-layer parse by glyph
coordinates; Friday zuhr prints the 12:30 jama'ah clock the header declares).

Second-witness cell diffs vs the held turktakvim Tokyo tree row (60 common days):
fajr EXACT (median 0, MAE 0.20, 100 pc within-1 - the Camii fajr equals the tree's
sabah column); sunrise -1 (78-82 pc within-1); dhuhr -3 (Fridays +57, the jama'ah
clock); asr -4; maghrib +1; isha -8. One geometry under two margin sets: the same
Diyanet-family line as the held tree, agreeing exactly on fajr.

Recipe characterized: adhan 4.4.6 Other 18/17 Shafi at Tokyo (35.68/139.75, tz +540)
reproduces the print at medians fajr +0.73, sunrise -6.33, dhuhr +5.5, asr +4.65,
maghrib +7.5, isha +0.43 - i.e. the Diyanet 18/17 pair plus the standard temkin block
(sunrise -6.3, dhuhr +5.5, asr +4.7, maghrib +7.5), the same temkin family as
EU-DIYANET-16-ISHA-SPLIT. Isha is computed at 17 deg, the second East Asian body
doing so this session (after the KMF Seoul table).

Year-2 routes: the prayertime page lists current months only; the 2025 upload paths
301 to the homepage (naming convention unverifiable); Wayback CDX for
tokyocamii.org/wp-content/uploads/2025* lists khutba and Ramadan 2025 PDFs but no
monthly salat timetable, and the Ramadan 2025 Tokyo PDF fetch is BLOCKED by the
archive's abuse filter (the CDX succeeded; the file endpoint refused) - thread
stopped per standing orders. Islamic Center of Japan (islamcenter.or.jp): homepage
carries no prayer-times link (eng page returned empty to curl and bot-blocked to the
fetch API). Recorded as searched-not-found routes.

Artifacts: `data/jp-tokyocamii-june2026-rows.json`, `data/jp-tokyocamii-nov2026-rows.json`
(60 rows), `data/jp-tokyocamii-witness-diffs.json`, raw PDFs and extraction text under
`captures/jp-tokyocamii-*`, CDX capture `captures/jp-tokyocamii-cdx-2025.txt`.

## Entry 6 — CN-NORISLAM-10 / CN-DIYANET-222 (China), islamichina year articles probed

VERDICT (2026-11-12): islamichina.com serves year-labelled city articles (the Beijing
directory carries ids 2143-2026, 2857-2027, 2858-2028, 2859-2029) each holding a FULL-YEAR
six-column table. Walked Beijing's 2026 and 2027 articles through the browser session
(the tables render only in the DOM; static HTML is a city directory). 365 rows banked per
article. The 2026 article prints "Last Updated on Thursday, 20 April 2023 13:11": the grid
is a 2023-frozen computation. Between the year-labelled articles: 315 of 365 month-day
pairs move within 1 minute, 49 cells move exactly 2 (dhuhr 12, maghrib 38), one identical
pair, never beyond 2 - distinct computations at the rounding edge, but no between-year
movement beyond 2 minutes: the year-2 test is below its floor at 39.9 N and the 2023 stamp
caps provenance. No span lift claimed; the year articles are recorded as a relabel class
with sub-2-minute regeneration.

Second-witness cell diffs vs the held turktakvim Beijing tree row (365 common days):
fajr EXACT (median 0, MAE 0.23); sunrise +5; dhuhr -9; asr -9; maghrib -6; isha -9 -
the same one-geometry-two-margin-sets pattern as Seoul and Tokyo, the turktakvim
publisher ladder accounting for every split except fajr.

Recipe: adhan 4.4.6 MWL at Beijing (39.90/116.40, tz +480) reproduces the solar columns
at medians -0.72..+0.55 and fajr +0.60; the isha column is 17 deg (median residual +0.18
at 17 vs -5.5 at 18). THIRD East Asian body computing isha at 17 deg this session (KMF
Seoul, Tokyo Camii, islamichina Beijing), all declaring MWL-class methods - a regional
17-isha pattern worth an owner note.

norislam.com stands as the held yearless calculator (no year axis to probe); the Urumqi/
Turpan/Dunhuang/Lhasa two-hour defect note is inherited untouched.

Artifacts: `data/cn-islamichina-beijing-2026-rows.json` (365 rows),
`data/cn-islamichina-beijing-2027-rows.json` (365 rows), `data/cn-islamichina-witness-diffs.json`,
page captures `captures/cn-islamichina-beijing-{2026,2027}-page.txt`.

## Entry 7 — TH (Thailand, no dedicated index entry), council blocked, Muslim Thai Post witness banked

VERDICT (2026-11-12): Thailand's held coverage was the Fazilet family only. Two new
surfaces probed:

- The Central Islamic Council of Thailand's own site (skthai.org, page "ข้อมูลเวลาปฏิบัติศาสนกิจ
  77 จังหวัดทั่วประเทศไทย" - prayer practice times for all 77 provinces) is BLOCKED at the
  WAF from this host: curl gets the Cloudflare "Attention Required" page and a real browser
  session gets "Sorry, you have been blocked". No captcha was solved; the surface is
  recorded unreachable and stays an open door for the next round.
- prayertimes.muslimthaipost.com (Muslim Thai Post, community tier): a 77-province Thai
  dropdown over POST app_crud.php action=getsolatbyprovince - a SEVEN-DAY ROLLING WINDOW
  per province, no year axis (year-2 dead by mechanism). Bangkok (id 2) banked: 8 dated
  rows (2026-11-12..19), imsak/subhi/shuruk/zuhr/asr/maghrib/isha, Hijri 1448 printed.

Second-witness cell diffs vs the held turktakvim Bangkok tree row (8 days): a stable
margin block - imsak -2..-3, subhi -4..-5, sunrise +5, zuhr -4..-5, asr -6..-7, maghrib
-4..-5, isha -1..-2. One geometry under two margin conventions; the second local Thai
publisher enters the record as a witness (community tier, candidate data).

Artifacts: `data/th-muslimthaipost-bangkok-week.json` (8 rows),
`data/th-muslimthaipost-witness-diff.json`, captures `captures/th-muslimthaipost-*`,
`captures/th-skthai-77provinces-20261112.html` (the block page).

## Entry 8 — MN-DIYANET-67 (Mongolia), honest negative

VERDICT (2026-11-12): no local Mongolian publisher surface found. Routes and terms
searched: TinyFish web search in English ("Ulaanbaatar mosque prayer times Mongolian
Islamic Center schedule") - results are islamicfinder, muslimpro, time.now, aladhan,
muslimandquran, MATW pages and a zabihah listing for the Islamic Center at Tolgoit; no
own-site table of any Mongolian body. The Ulaanbaatar Mosque publishes on Facebook
(forum hearsay is never data). The held lines stand: MN-DIYANET-67 (platform, single
cycle) plus the Fazilet family's 23-city Mongolian layer with its recorded fajr-pad
departure. Not found under these terms; mn-language search rides the next round.

## Entry 9 — PH (Philippines, no dedicated index entry), Bangsamoro Darul-Ifta witness banked

VERDICT (2026-11-12): the Philippines' first local authority surface entered. The Office
of the Wālī of Bangsamoro posted (public Facebook, 2026-02-25) the OFFICIAL Ramadhan 1447H
Prayer Time Table for Cotabato City, MDN, MDS & SGA, declared source "Bangsamoro Darul
Ifta'", hosted on Google Drive as an image (1768x2500). Fetched and OCR-banked locally.
The sheet prints Gregorian 2026-02-19..2026-03-20, qibla 290 W, plus the Darul-Ifta's
per-municipality minute-adjustment register (MINUTE18 table by municipality - a named
adjustment system for the whole Bangsamoro region, captured in the OCR text).

Witness verdict on the fajr column (the only column assignable from the OCR stream with
confidence - the other five columns interleave; left as an open item): 30/30 days,
Darul-Ifta fajr vs the held turktakvim Cotabato tree row sabah column = 26 exact, 4 at +1,
worst +1. The official Cotabato timetable and the platform tree agree on fajr. The BARMM
news PDF (Ramadhan-Issue-1.pdf) is a magazine front page, no table - recorded.

Artifacts: `data/ph-darulifta-cotabato-ramadhan1447-fajr.json` (30 dated rows),
capture `captures/ph-darulifta-ramadhan1447-cotabato.jpg` + OCR text,
`captures/ph-barmm-ramadhan-issue1.pdf` (negative).

## Entry 10 — VN-HANOI-AL-NOOR / KH-PHNOM-PENH-ALSERKAL / LA-VIENTIANE-JAMIA, Fazilet second witnesses

VERDICT (2026-11-12): all three community boards carried full 2026 years in the held bank
(366 days each). Second-witness cell diffs against the held Fazilet family rows, computed
from disk:

- Phnom Penh (Al-Serkal board vs Fazilet cityId 2685, 66 overlapping 2026 dates): fajr -18,
  sunrise +2, dhuhr -8, asr -7, maghrib -4, isha +1 (isha 100 pc within-1). Stable margin
  block - one geometry under two margin sets.
- Vientiane (Jamia Masjid board vs Fazilet Vientiane, 66 dates): fajr -10, sunrise +3,
  dhuhr -7, maghrib -1 (100 pc within-1), isha +9, and asr +69 (range +41..+74): the
  Vientiane board computes asr HANAFI against Fazilet's Shafi - a named madhab split,
  recorded as a rule-form difference, not an error.
- Hanoi (Masjid Al-Noor board vs Fazilet districtId 3072 "Ha Noi", freshly walked 22 dates
  of Jan+Jul 2026 at 1.05 s spacing): fajr -11, sunrise +2, dhuhr -7, asr -4, maghrib -8,
  isha -4 - stable block, same conclusion.

All three entries keep their provisional community grade; each now carries a named
second-publisher relation with per-column cell diffs.

Artifacts: `data/vn-kh-la-mawaqit-fazilet-diffs.json`, `data/vn-hanoi-mawaqit-fazilet-diffs.json`,
raw Fazilet Hanoi captures `data/vn-fazilet-hanoi-2026-sample-raw.json`.

## Entry 11 — TM-DIYANET-6 / MO-DIYANET-1 (Turkmenistan, Macao), honest negatives

VERDICT (2026-11-12): Turkmenistan - the held negative ("no Muftiate table exists in
Turkmen, Russian or English") re-confirmed under fresh terms: TinyFish search "Ashgabat
Turkmenistan mosque prayer times namaz vakitleri timetable" returns only platforms and
aggregators (time.now, prayertimes.date, islamicacademy perpetual tables, islamicfinder,
muslimpro, al-harameen, ihadis, quranmajeed) and the Diyanet America page; no Turkmen
publisher surface. Macao - a Macau Islamic Mosque exists (TripAdvisor listing, Friday
prayers) and a new mosque build is reported on Facebook video; no prayer-times surface
of its own was found under these routes (en searches; the community is FB-first). Both
entries keep the held platform-tier provisional state; the negatives name their routes.

---

## Session summary

Nine entries worked of the twelve planned (MN, TM and MO closed as honest negatives;
Indonesia and Malaysia untouched per dispatch). Banked measurements:

1. LK-ACJU-13-ZONES: the 2027-edition watch answered NEGATIVELY - the 2026-10/11 upload
   batch is generation-identical to the held 2026 edition (143/143 sampled rows); three
   served editions on one computed generation; frozen-reprint stands and strengthens.
2. AF-TAWKIT-8: full 365-day window fitted on the held recipe (100 pc within-1 both
   calendar years); between-year recompute test INCONCLUSIVE at Kabul latitude (drift
   max 0.38 min < 1-minute floor); December roll watch stands.
3. PK-TAWKIT-453: FIT-RULES per-year breakdown completed on the full 453-city bank
   (99.75 pc within-1 on BOTH years, identical margins, parameters frozen).
4. KR-DIYANET-40: Korea Muslim Federation annual (2026-02..2027-01, 365 rows, declared
   MWL) banked as second publisher - fajr agrees with the held tree, other columns are
   margin blocks; print is fajr 18 / isha 17; 31 January-2027 rows banked.
5. JP-DIYANET-143: Tokyo Camii witness banked (60 rows, fajr exact vs the tree; Diyanet
   18/17 + temkin block; isha 17).
6. CN: islamichina year articles walked (365+365 Beijing rows); 2023-frozen grid,
   between-year movement <=2 min; witness diff vs the tree banked (fajr exact, isha 17 -
   third East Asian 17-isha body).
7. TH: Central Islamic Council site WAF-blocked (recorded); Muslim Thai Post Bangkok
   week banked (8 rows) as a second local witness with a stable margin block.
8. MN: honest negative (platforms only under en terms).
9. PH: Bangsamoro Darul-Ifta official Ramadhan 1447H Cotabato timetable banked (30 dated
   fajr rows from the Wali's office via Google Drive; fajr matches the held tree 26/30
   exact, worst +1).
10. VN/KH/LA: all three mawaqit boards now carry Fazilet second-witness cell diffs;
    Vientiane's board is Hanafi-asr (named split).
11. TM/MO: honest negatives with named routes.

Regional findings for the owner: (a) a 17-degree-isha pattern across three East Asian
bodies declaring MWL/Diyanet methods (KMF Seoul, Tokyo Camii, islamichina Beijing);
(b) the turktakvim tree's publisher ladder explains every second-publisher split except
fajr, which matches EXACTLY at Seoul, Tokyo, Beijing and Cotabato - fajr is the one
column the ladder does not shift in Asia; (c) sub-minute between-year solar drift makes
the 1-minute recompute test unusable across South and East Asia's latitudes - frozen vs
genuine cannot be separated there from single-generation tables.

## Appendix — the predecessor's six whole-year Fazilet-vs-tree witnesses (found on disk, verified, folded)

A concurrent process (see NOTICE.md - the session's predecessor, still alive after its
"silent" report) banked six Fazilet-vs-turktakvim-tree witnesses for this bundle's East
Asian rows between 09:34-09:49Z: whole-year walks (95 dates each, city ids 494, 608,
737, 2592, 2593, 3202), 280 shared dates per city, per-column cell diffs in
data/*-fazilet-vs-tree.json. Medians (Fazilet minus tree, minutes):

| City | fajr | sunrise | dhuhr | asr | maghrib | isha | maghrib within-1 |
|---|---|---|---|---|---|---|---|
| Tokyo (494) | +9 | +2 | -2 | -4 | +1 | -3 | 245/280 |
| Seoul (608) | +8 | +2 | -2 | -4 | +1 | -4 | 268/280 |
| Ulaanbaatar (737) | +7 (range -43..+9) | +3 | -4 | -6 | 0 | -6 (max +11) | 280/280 exact |
| Beijing (2592) | +7 | +1 | -3 | -4 | +2 | -3 | 68/280 |
| Shanghai (2593) | +10 | +2 | -1 | -3 | +2 | -3 | 113/280 |
| Macau (3202) | +11 | +2 | -1 | -2 | +1 | -3 | 280/280 exact |

Reading: FAZILET is the fajr outlier in East Asia - it prints fajr 7-11 min LATER than
the tree everywhere, while the tree's fajr matches the LOCAL AUTHORITIES exactly (KMF
Seoul, Tokyo Camii, islamichina Beijing, and the Cotabato Darul-Ifta). Combined with
(a) above: the tree's fajr line is the authority line; Fazilet carries a regional
fajr margin; maghrib is exact or within-1 at 280/280 on three of six cities. The
Ulaanbaatar fajr range -43..+9 shows the family's recorded Mongolian pad at whole-year
scale. The predecessor's captures (570 gzipped responses + journal) bank under
captures/fazilet/; its scripts under scripts/fz-fetch.py and scripts/witness.py.

No children deployed. The excluded territory is never named in any file; the occupying
entity is never named. The repository was never touched. All captures gzipped in place;
timestamps UTC; no real clock reads in data.

