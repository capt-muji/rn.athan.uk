# O1l-27 South Asia fringe (Nepal, Bhutan, Maldives, Sri Lanka)

Round two, city level. Research date 2026-11-11. Read-only against the census; nothing in this
workspace touches the repository. Engine adhan 4.4.6 at `$HOME/athan-gitree/census/adhan-build/
node_modules/adhan`, `Rounding.None` then explicit rounding, TZ pinned per country, dates built
from literal capture strings, no clock read.

## Nepal (third pass)

| Surface | URL | Tier | Dated rows | Verdict |
|---|---|---|---|---|
| Khidmat Foundation Nepal, Kathmandu page | `khidmat.org.np/prayer-times.php` | platform wrapper (community) | none held | AlAdhan `timingsByCity` method=4 (Umm al-Qura), school 0, `city:"Kathmandu"`. First `.org.np` domain with a prayer page; computed, not a Nepali timetable. |
| mawaqit JAMA MASJID RAHMANIYA, Bhairahawa | `mawaqit.net/en/m/jama-masjid-rahmaniya-45800-siddharthanagar-nepal` | community | 366 slots, unusable | **Dead install.** 27.506 N 83.449 E, Asia/Kathmandu, uuid `7b4c8d02-2486-4e6b-9e61-462ca1feef38`. Months 1-5 and 9-12 are ONE tuple repeated on every day; only June-August vary, and there fajr 04:15 / dhuhr 13:30 / asr 17:10-17:15 are frozen iqama clocks beside a computed sunrise and maghrib. |
| masjidbox same mosque | `masjidbox.com/prayer-times/jamamasjidrahmaniya` | community | 1 day | Live and plausible: 11 Nov 2026 fajr 5:08, shuruq 6:29, dhuhr 11:56, asr 3:00, maghrib 5:21, isha 6:37, plus iqama and jumu'ah 12:45. Today-only: `?date=` is ignored server-side and the JSON API is key-gated. **Candidate, not a fit.** |
| Islami Sangh Nepal, Balkhu Kathmandu | `islamisangh.org/press-release/calendar-2083-bs` | authority (organisation) | none | Two 6-page scanned PDFs (Calendar 2083 BS / 2026 AD). A BS-AD-Hijri DATE calendar with no prayer columns recoverable. Authority tier, wrong artifact. |

**Fit verdict: none.** No Nepali surface publishes a dated daily table, so nothing lands a month.

**Honest negatives.** Nepali and English, at least these phrasings: `नमाज समय काठमाडौं`,
`prayer time Nepal mosque Kathmandu timetable`, `Kathmandu Jame Masjid prayer times`,
`Pokhara mosque prayer times`, `Biratnagar mosque namaz time`,
`Nepal Muslim organization prayer timetable नेपाल मुस्लिम`, `नेपाल मुस्लिम ईद नमाज समय काठमाडौं
२०८३`, `Kathmandu mosque ramadan timetable 2026 iftar sehri Nepal`, `site:mawaqit.net nepal`,
`site:masjidbox.com nepal`, `site:masjidal.com nepal OR kathmandu`. Results are aggregators
(islamicfinder, muslimpro, hamariweb, athanpro, prayertimes.date, salahtimes, matwproject,
time.now) plus Facebook posts. masjidal.com carries no Nepal entry.

**The named lift, located but not taken.** `facebook.com/DarulIftaNepal/posts/12-months-namaz-
time-table-of-kathmandu/817161672105972` — a 12-month Kathmandu namaz table from Darul Ifta
Nepal, an authority-by-publisher artifact. Both `www.facebook.com` and `mbasic.facebook.com`
answer HTTP 400 to an anonymous fetch. `allnepalmuslim` carries the same family for Ramadan
(sehri/iftar, Kathmandu Valley 2026). A browser session with an existing sign-in is the route.

## Bhutan (first pass)

| Target | Result |
|---|---|
| dawa.center Islamic-centres directory, Bhutan | Exactly ONE entry: "Bhutan mosque - Dantak Mosque", Thimphu (id 1379). No times, no coordinates published. |
| ilmify.app directory | "Bhutan Muslim Community Organisation" — described as "Muslim community coordination and basic Islamic education". No prayer page, no times, no outbound site. |
| mawaqit / masjidbox / masjidal | No Bhutan entry. `mawaqit.net/en/m/thimphu-bhutan` 404; `site:` probes empty on all three. |
| Aggregators | islamicfinder, muslimpro, aladhan, hamariweb, athanpro, prayertimes.date, matwproject, quranbookk, almusaly. Computed, every one. |

**Verdict: negative, first pass, nothing added.** Languages searched: English and Dzongkha
(`འབྲུག མུས་ལིམ མཚན་མོ` returns Buddhist liturgical text only — in Dzongkha the word for prayer is
the Buddhist one, so the phrasal search has no Muslim sense). Additional English phrasings:
`Bhutan mosque prayer times Thimphu`, `Bhutan Islamic community association mosque`,
`Bhutan mosque Phuentsholing prayer hall`, `Bhutan Jama Masjid prayer schedule`,
`"Dantak Mosque" Thimphu prayer`, `Bhutan Muslim Association Thimphu`,
`bhutan muslim community facebook prayer timings Thimphu`, `Bhutan "prayer time" OR "namaz"
Thimphu mosque monthly`. The record's "nothing" stands; the surface is closed at the publisher
(there is one mosque and it publishes nothing).

## Maldives (5 more islands + the 403 recheck)

**Selector enumerated: 202 islands across 20 atolls plus Male — the record's count reconfirmed**
(`assets/ajax/select_island.php?lang=en`, atoll ids 1-21). The real URL grammar is
`namaadhuvaguthu.com/en/prayertimes/<island>/<year>/<month>`; the form POST 302s there.

Five new islands plus a Male control, November 2026, 30 rows each:

| Island | id | Coordinates | Fit |
|---|---|---|---|
| HA. Thuraakunu | 1 | 6.9553 N 73.1006 E | every column within 1 on 30/30; trio carries +1.3..+1.5 (assumed coordinate) |
| K. Thulusdhoo | 421 | 4.3742 N 73.6497 E | 29/30 all-six within 1 |
| M. Mulah | 603 | 2.9467 N 73.5853 E | 30/30 within 1 |
| Gn. Fuvahmulah | 951 | 0.2989 S 73.4239 E | 30/30 within 1 |
| Addu Hithadhoo | 953 | 0.6094 S 73.0900 E | 30/30 within 1 |
| Male (control) | 415 | 4.1755 N 73.5093 E | 30/30 within 1, 11 exact days |

**Fit verdict: CONFIRMS the census recipe at both latitude extremes.** Recipe as recorded —
MABIMS 20/18, fajr +5, dhuhr +4, asr +1, maghrib +2, isha +4, sunrise -2, Shafi, nearest — gives
**1,080 cells across 180 island-days, every one within 1 minute**, over 7.57 degrees of latitude
(6.96 N to 0.61 S). No latitude trend: within-island deltas stay inside the rounding band.
Span: one month per island, so the object stays provisional; the sample is no longer the
thinnest in the file. Amplitude for the latitude framing: Thuraakunu fajr is 10 min later than
Hithadhoo on the same November day, against a Male annual fajr swing of only 15 min (04:54 on
1 January to 04:39 on 1 July) — the near-equator flatness FIT-RULES predicts.

**Yearlessness re-confirmed on a NEW island.** Hithadhoo November served under year labels 2026,
2027 and 2031 returns **0 differing days** on all six columns. The frozen-generation caution
holds; 2027 is not a second year.

**MUIS 403 recheck: still closed.** `https://islamicaffairs.gov.mv/`, `https://www.` and
`http://` all answer **403** with a Cloudflare interstitial. `api.islamicaffairs.gov.mv` is
NXDOMAIN. `/api/prayer-times` and `/api/v1/prayer-times` answer 403.

**NEW capability: Wayback CDX is reachable this round** (it was connection-refused last round).
Enumerated `islamicaffairs.gov.mv` (3,000 HTML keys, 200 PDF keys): the archive holds khutbah
PDFs, gazettes and a 2015 "calendar information" file, **no prayer timetable**. The archived
homepage (2025-11-03) is an "Age restricted content" interstitial, not the site. So the archive
does not close the official-PDF lift either.

## Sri Lanka (the November watch, zone accrual, second publisher)

**The uploads/2026/11 watch: nothing new landed.** `acju.lk/prayer-times/` re-captured
2026-11-11 (527,014 bytes): **300 links under `uploads/2026/10`, 12 under `uploads/2026/11`**.
All twelve November-dated files are zone 03, all twelve months. Zone 03's November sheet is
**byte-identical** to the round-1 capture, md5 `aa86f791515975e55dee9b97ff433f0f`. The other
twelve zones still serve from October. Fourth observation, same result: no regeneration.

**Zone accrual, two zones, full year each.** Zones 09 (Trincomalee) and 12 (Galle + Matara)
downloaded for all twelve months: **366 rows each**, February carrying 29 rows — the leap-anchored
cycle reconfirmed on two more zones. Both carry the new descriptive naming with a double
underscore (`09.-Trincomalee-District-Sri-Lanka-Hanafi__MM_NNN.pdf`), the same rename pattern
zone 03 took.

Fit at the recorded recipe (fajr 19.75 / isha 18.2, adhan 4.4.6, Asia/Colombo), 365 dated rows
on a 2026 anchor:

| Zone | Column | Mean | sd | Range |
|---|---|---|---|---|
| 12 Galle (6.0535/80.2210) | fajr | -0.02 | 0.35 | -0.78..0.82 |
| | isha | 0.00 | 0.33 | -0.73..0.75 |
| | sunrise | +0.34 | 0.36 | |
| | dhuhr | +1.45 | 0.31 | |
| | asr Shafi | +1.45 | 0.37 | |
| | maghrib | +1.55 | 0.32 | |
| 09 Trincomalee (8.5874/81.2152) | fajr | +0.65 | 0.71 | |
| | isha | +0.87 | 0.57 | |
| | dhuhr | +2.24 | 0.32 | |

**Zone 12 confirms the record to sub-minute.** **Zone 09 degrades at the district capital**, and a
latitude scan resolves why: the zone's computational point sits at **8.98-9.01 N** (fajr sd 0.35,
isha sd 0.38, the same quality as zone 12), about 0.4 degrees north of Trincomalee town. The
safety trio lands at +2.2 rather than +1.5 there, inside the recorded 1.1-2.2 band.

**Second publisher beside ACJU: three live mawaqit mosques.** All three embed a 366-row
leap-anchored calendar (February 29 rows again), so all three are yearless templates like the
authority sheets.

| Mosque | Coordinates | vs ACJU November |
|---|---|---|
| Kollupitiya Jummah Masjid, Colombo 03 | 6.9130 N 79.8507 E | dhuhr -1.60, maghrib -1.57, asr -1.03, isha -0.83, fajr +0.93, sunrise -0.47 over 30 days |
| Al-Hassan Masjid, Colombo 03 | 6.9007 N 79.8514 E | live January-November; **December defective** |
| Masjidus Saif Aruppola Jummah Masjid, Kandy | 7.3112 N 80.6432 E | **identical to ACJU zone 07 on five columns, 30/30 days (150/150 cells)**; fajr identical 29/30 with one +16 outlier |

**Kollupitiya runs exact solar at the noon-anchored prayers** (adhan residual mean +0.04 dhuhr,
+0.03 asr, +0.06 maghrib, sd 0.3-0.6) with its own twilight pair, **fajr 20.19 deg (sd 0.31) and
isha 17.74 deg (sd 0.35)** — the same class the record already holds for Masjidul Hijriya, now a
second Colombo mosque. It is a genuinely independent witness and it disagrees with the authority
by 1-2 minutes on four columns.

**The Kandy mosque is not a witness.** Aruppola reproduces the ACJU zone 07 sheet cell for cell,
so the record's "the mosque layer only partly tracks the sheet" needs a locality qualifier: in
Kandy the mosque layer IS the sheet.

**Al-Hassan's December is a defect, not a rule.** Against November's own values on the same day
slots: fajr +141..157, sunrise +145..158, dhuhr +49..57, asr -39..-41, maghrib -53..-54, isha
-48..-49 minutes. Each column is displaced by a different amount, so it is a broken month rather
than a DST-class shift. January-November is clean and usable; December must not be fitted.

**Honest negatives.** masjidal.com returns no Sri Lanka entry. `jawattemasjid.com` timed out
(40 s, zero bytes) on two attempts. `slhub.com/jummah-schedule` captured (52,419 bytes) as a
jumu'ah-schedule page, not a dated table.

## Data held

- `data/lk-zones-2026.json` — zones 09 and 12, 365 dated rows each, seven printed columns.
- `data/lk-acju-zones-09-12-perpetual.json` — the same as 12 month-tables, 366 rows each.
- `data/lk-zones-fit.json`, `data/lk-mawaqit-fit.json`, `data/lk-mosque-vs-acju.json` — fits.
- `data/lk-mawaqit-{kollupitiya,alhassan,aruppola}-calendar.json` — three 366-row mosque years.
- `data/mv-5-islands-2026-11.json`, `data/mv-5-islands-fit.json` — 5 islands + Male, 30 days.
- `data/np-mawaqit-siddharthanagar-calendar.json` — the dead install, kept as evidence.
- `captures/` — 93 raw pages and PDFs, named by source.

## Blocked, for the record

Nothing blocked the round. The two surfaces that stayed shut are the MUIS site (403, as
recorded) and Facebook's public post view (HTTP 400 anonymous), the latter carrying Nepal's only
named 12-month table.
