# O1l-47 — megacity second sources (ten largest Muslim-population cities)

Built 2026-11-11, capture window 05:50–06:21 UTC, in
`$HOME/athan-gitree/census/o1l-city/megacities/`. Repository untouched. No subagents.
Engine for every fit: adhan 4.4.6 (`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`),
`Rounding.None`, TZ pinned per city, dates from literal capture strings, second resolution then
explicit per-column rounding. Angle recovery is per-day bisection on the printed time, so a true
angle rule shows a tight implied-angle spread and a fixed-interval rule shows a seasonal drift.

| City | Second surface | Rows | Tier | Fit |
|---|---|---|---|---|
| Cairo | none found | — | — | negative |
| Istanbul | turktakvim.com yearly 2026 | 365 | community | fajr 17.93 clean, isha seasonal |
| Karachi | masjidway mosque 11160 | 30 | platform | 18/18 Hanafi zero margins |
| Jakarta | jadwalsholat.org Jakarta Pusat | 365 | community | 19.51/18.50 +2 min |
| Dhaka | namaz.habibur.com one day | 1 | community | one-day candidate |
| Lagos | none found | — | — | negative |
| Delhi | none found | — | — | negative |
| Mumbai | none found | — | — | negative |
| Baghdad | mawaqit Jami al-Hasanayn | 366 | platform | 18.08/16.93 with temkin |
| Tehran | skipped (closed per mission) | — | — | — |

## 1. Cairo — honest negative

Held: ESA 82-city tables (`o1l-city/egypt-82/`), and Dar al-Ifta's Cairo November 2026
(`data/dar-alifta-cairo-2026-11.json`), which that wave adjudicated as the SAME publication, not a
second computation.

- **Ministry of Awqaf (`awkafonline.gov.eg`)**: curl returns 403 (WAF). Read in a real browser
  (`AGENT_BROWSER_SESSION=o1l-47`): the full nav is الرئيسية / عن الوزارة / المركز الإعلامي /
  خدماتنا (صك الأضحية، صك الإطعام، عمارة المساجد، حجز دور المناسبات، النذور) / خطبة الجمعة /
  مواسم ومناسبات. **No مواقيت الصلاة section anywhere on the ministry site.** `captures/eg-awqaf-home.html`.
- **Al-Azhar**: no timetable (record); `azhar.eg` carries the Fatwa Center only.
- **NRIAG, provincial committees**: record negatives stand; re-searched in Arabic (4 phrasings) and
  every hit resolves to ESA, Dar al-Ifta, or a platform calculator (timesprayer, islamicfinder,
  masrawy, salatcalendar).
- Stack: TinyFish (ar) ×4, curl, agent-browser. Surface closed at the publisher, not at the index.

## 2. Istanbul — NEW second surface (365 rows, community)

`https://www.turktakvim.com/index.php?link=yillikvakitler.php` (Türkiye Takvimi, a private Turkish
calendar publisher, NOT Diyanet). `captures/turktakvim-yillik.html`, 437 KB, full-year 2026 table,
8 columns (İmsâk, Sabâh, Güneş, İşrak, Öğle, İkindi, Akşam, Yatsı). Rows:
`data/tr-istanbul-turktakvim-2026.json` (365).

**Gate PASS**: the site's own front page (`captures/turktakvim-home.html`) prints today's eight
values 05:55 / 06:12 / 07:39 / 08:32 / 12:59 / 15:39 / 17:58 / 19:30, byte-identical to the annual
row for 2026-11-11.

Fit (41.0082, 28.9784, Europe/Istanbul, Shafi, 365 days 2026-01-01..2026-12-31):

- fajr **17.93** (implied angle median 17.93, spread 0.19, quarters 17.92|17.95|17.93|17.93) — a
  clean angle rule. Margin -0.03, MAE 0.27, 365/365 within 1, 336 exact.
- isha **18.98** does NOT hold: implied angle 19.05 winter, 18.39 spring, spread 1.08; MAE 2.09,
  217/365 within 1, worst 8.4. A seasonal correction rides the isha column.
- margins: sunrise -7.62, dhuhr +11.23, asr +11.22, maghrib +8.42 (MAE 0.25-0.43, 360-365/365).
- İmsak is a separate row, fajr minus 18 min (median -18, range -17..-22).
- Seasonal amplitude fajr: Jan 06:49, Jul 03:46, span 182 min.

NEW: a second Turkish publisher whose temkin is roughly double Diyanet's (held recipe: sunrise -7,
dhuhr +5, asr +4, maghrib +7). Do not adjudicate. Single year, so provisional under #6943.

## 3. Karachi — NEW second surface (30 rows, platform)

`https://en.masjidway.com/masjid/11160/prayer` — a Shahrah-e-Faisal mosque, page coordinates
24.8872538 / 67.1269746, method label "University of Islamic Sciences, Karachi" (a platform label,
never provenance). `captures/masjidway-karachi-11160.html`, rows
`data/pk-karachi-masjidway-11160-2026-11.json` (30, 2026-11-01..30).

**Gate PASS**: the page's own "Wednesday, November 11, 2026" block (05:27 / 12:15 / 16:10 / 17:46 /
19:04) equals the parsed 2026-11-11 row.

Fit (Shafi first, then Hanafi — the asr column settles it):

- Hanafi asr: fajr **17.99**, isha **18.02**, margins sunrise 0.00, dhuhr -0.05, asr +0.23,
  maghrib +0.10, isha +0.02. MAE 0.20-0.25, **30/30 within 1**, 28-30 exact. This is the
  Karachi/UISK 18/18 Hanafi zero-margin family.
- Shafi reading: asr margin +46.0 (13/30 within 1) — the mosque prays Hanafi asr.

CONFIRMS the record's Karachi construction. NEW: a dated mosque-layer table with published
coordinates, where the record held only community charts and DHA's fixed jamaat clocks.

**API TRAP on record**: masjidway's `/prayer/<mmyyyy>` path is ignored. `012026`, `072026` and
`122026` all returned the November 2026 table (same 32 date strings, same values). A crawler banking
"January 2026" would be banking November.

Named options closed: Sindh Auqaf (`arazud.sindh.gov.pk`) walked — no namaz-timing page (urs
calendar, waqf property lists, zakat budgets only); Karachi Metropolitan Corporation
(`kmc.gos.pk`) has no prayer surface. `captures/sindh-auqaf-home.html`, `sindh-auqaf-religious.html`,
`kmc-home.html`.

## 4. Jakarta — NEW second surface (365 rows, community)

`https://jadwalsholat.org/jadwal-sholat/monthly.php?type=2&id=308&m=<1-12>&y=2026` (Jakarta Pusat,
city id 308). Twelve month captures in `captures/jadwalsholat-jakarta-pusat-2026-*.html`, rows
`data/id-jakarta-pusat-jadwalsholat-2026.json` (365).

**Gate PASS**: the site's own adzan page (`captures/jadwalsholat-jakarta-today.html`) prints today's
block 04:06 / 11:39 / 14:59 / 17:50 / 19:03, equal to the 2026-11-11 row.

Fit (-6.1805, 106.8284, Asia/Jakarta, Shafi, 365 days):

- fajr **19.51** (spread 0.51, quarters 19.56|19.51|19.47|19.52), isha **18.50** (spread 0.52).
- margins: sunrise -1.95, dhuhr +2.05, asr +2.07, maghrib +2.12, isha 0.00.
- MAE 0.30-0.36; fajr 361/365, isha 357/365, dhuhr/maghrib 365/365 within 1.
- **imsak = fajr - 10 minutes on all 365 days** (exact), matching the Kemenag-family imsak interval.
- Seasonal amplitude fajr: Jan 04:45, Jul 04:44, span 17 min (near-equator, as expected).

NEW: a second Indonesian publisher, and it is NOT a Kemenag mirror — its fajr sits at 19.5 deg, not
Kemenag's stated -20. That is 4-5 minutes of fajr drift against the stated parameter set; flagged,
not adjudicated.

Named options closed: `dki.kemenag.go.id` times out and `jakarta.kemenag.go.id` does not resolve;
Masjid Istiqlal's own site (`istiqlal.or.id`) carries no jadwal sholat (nav read, `/jadwal-sholat`
404). `captures/istiqlal.html`, `istiqlal-jadwal.html`.

## 5. Dhaka — one dated day (community, computed)

`https://namaz.habibur.com/districts/dhaka/` prints 2026-11-11 at 23.7000 N / 90.3750 E, timezone
Asia/Dhaka, in both rounded and second-resolution form: fajr 4:52:27, sunrise 6:10:10, dhuhr
11:42:29, asr (Hanafi) 3:38:39, maghrib 5:14:34, isha 6:32:17.
`captures/salat-habibur-dhaka.html`, `habibur-dhaka-yearly.html`, row
`data/bd-dhaka-habibur-2026-11-11.json`.

One-day fit (Hanafi): fajr **18.10**, isha **17.94**, margins sunrise -0.17, dhuhr -0.48, asr +0.43,
maghrib -0.55 — a computed MWL-family table at essentially zero margins. Candidate, not a fit.

Negatives: the site's own month (`2026-11/`) and year (`2026/`) links both 404, so only the
single-day page renders; Baitul Mukarram's own board is not on the web (`baitulmukarram.org` is
Regina, Canada — the same-name trap; `baitulmukarram.gov.bd` does not resolve); the IFB Dhaka
divisional office pages already captured in `o1l-city/bangladesh-cities/captures/` are shells with
no table.

Record note honoured: the census already rules that computed tables cannot confirm IFB's printed
bands. This is a dated second surface, not a band confirmation.

## 6. Lagos — honest negative

Held: masjidway Central Mosque Ikorodu (Egyptian label), prayertimesnigeria.

- **Alausa Secretariat Masjid** (`lagossccm.com`): its "Prayer Times" nav item points to
  `http://www.lagossccm.org/#prayers`, and `lagossccm.org` **does not resolve** (NXDOMAIN).
  WordPress REST enumeration returns three pages (Ask the Imaam, Home, Blog), none a timetable.
  `captures/lagos-sccm.html`, `lagos-pages.json`, `lagos-prayer.html` (404).
- **Lekki Central Mosque** (`lekkicentralmosque.org`): no timetable link, confirming the record.
- **NASFAT** (`nasfat.org`, Ilupeju Lagos): no timetable page (`/prayer-times` 404).
- **NSCIA / state council**: announcements only (record).
- Stack: TinyFish (en) ×3, curl, WordPress REST.

## 7. Delhi — honest negative

- **Delhi Waqf Board**: `delhiwaqfboard.org` does not resolve; the record's negative stands.
- **Jama Masjid's own**: `jamamasjid.in` is a heritage "archive" site with no timings;
  `jamamasjid.org` is a parked domain (46 bytes of boilerplate); `shahijahanmasjid.com` does not
  resolve. `captures/delhi-jamamasjid-in.html`, `delhi-jamamasjid-org.html`.
- **Central Waqf Council** `waqf.gov.in`: connection timeout (two attempts).
- **masjidway 7002**: the record's Pilibhit trap, unchanged.
- Stack: TinyFish (en, hi) ×4, curl.

## 8. Mumbai — honest negative, with a trap

- Held: three mawaqit tenants (`o1l-city/india-cities/`).
- **masjidway 9631 "Ahle Hadees Masjid"** ranks for Mumbai but its page coordinates are
  17.4292030 / 78.5104220 — **Hyderabad**. Same-name trap; rejected, not filed.
  `captures/masjidway-mumbai-9631.html`.
- **masjidway 3462**: four attempts, timeouts. The platform answered 502/503 for much of the window.
- **Maharashtra Waqf Board**: no prayer surface found (searches en, mr).
- Stack: TinyFish (en, mr) ×3, curl.

## 9. Baghdad — NEW second surface (366 rows, platform/mosque layer)

`https://mawaqit.net/en/jm-lhsnyn-bgdd-964-iraq` (جامع الحسنين), coordinates 33.294 / 44.291 from
the page's own `confData`. `captures/mawaqit-baghdad-hasanayn.html`, rows
`data/iq-baghdad-mawaqit-hasanayn-2026.json` (366, of which one is an impossible date — see below).

**Gate PASS**: the page's rendered `times` (05:05 / 11:51 / 14:45 / 17:06 / 18:23, shuruq 06:29)
equal the calendar row for 2026-11-11 exactly.

Fit (Asia/Baghdad, Shafi, 366 days):

- fajr **18.08** (spread 0.17 excluding one bad day), isha **16.93** (spread 0.20).
- margins: sunrise -1.32, dhuhr +4.62, asr +2.75, maghrib +2.53, isha 0.02.
- MAE 0.33-0.41. The only outlier is **2026-02-29**, a date that does not exist: the publisher's
  calendar carries a 29th February in a non-leap year, and that row sits 34-40 minutes off every
  column. Score it out and all **365 real days are within 1 minute on all six columns**.
- Seasonal amplitude fajr: Jan 05:38, Jul 03:26, span 132 min.

**DRIFT against the held Diwan object, reported not adjudicated.** The Diwan recipe is 18/17 with
ZERO margins on every prayer. This Baghdad mosque prints, on the same solar geometry, dhuhr +4.6,
asr +2.8, maghrib +2.5 and sunrise -1.3, with angles 18.08/16.93. Direction: the mosque's clock runs
later than the Diwan on dhuhr, asr and maghrib. That is a temkin-shaped additive layer, not a
re-fit. Two publishers, one country, different clocks.

Named option closed: the Diwan's own site `dws.gov.iq` has **no prayer-times section** — nav is
الرئيسية / عن الديوان / أخبار الديوان / الاستبيانات / التبرعات / المساجد / القرآن / الفتاوى /
شؤون المواطنين / تواصل — and the host refused connections on the second pass. Shrine lines stay out
of scope by owner ruling.

## 10. Tehran — skipped

Closed per the mission. The record's Iran row already documents the geo-fronted Calendar Centre and
the shrine endpoint as the national table's wrapper.

## Method notes

- `tools/fit.js` recovers the implied depression angle per day by bisection, then fits one recipe
  over the whole span (angle pair, per-column margins, MAE, within-1, exact, worst, quarterly
  medians, Jan/Jul amplitude). `tools/parse-turktakvim.py`, `tools/harvest-jadwalsholat.py`,
  `tools/parse-masjidway.py`, `tools/flatten-mawaqit.py` build the row files. All fit output in
  `data/fits.log`.
- Three defects are on record this wave: masjidway `/prayer/<mmyyyy>` ignores the month (012026,
  072026 and 122026 all returned November 2026); jadwalsholat's `bulan`/`tahun` parameters are
  ignored on the first URL shape (`type=2&m=&y=` does honour the month); and the Baghdad mawaqit
  calendar prints a 2026-02-29 in a non-leap year.
- Every surface above was gated against its own live page on 2026-11-11 before any row was banked.

## What this wave does not claim

Not one of these cities is complete, and none of these negatives is a closure: each is "not found
under these terms", with the stack named above. Cairo, Lagos, Delhi and Mumbai still hold one
surface each and want a second publisher, a mosque board or a print source.
