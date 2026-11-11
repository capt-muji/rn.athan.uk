# O1k W4 gulf-levant-2 — Bahrain, Saudi regions, Palestine, Syria, Lebanon, Yemen, Oman 2028

Agent tag `gulf2`. Research only; no repository edits. Public pages only; no login, no
challenge solved. All captures under `captures/`, normalized rows under `data/`, helper
scripts under `scripts/`.

Tooling: `curl` with a browser UA for every capture, TinyFish for Arabic search, the
in-repo `adhan-js 4.4.6` (read-only, from `opensrc`) for residual checks. `agent-browser`
(runner session `o1k-gulf2`) used only to read a page's own network traffic.

---

## 0. Headline — the Bahrain fajr angle

The record says Bahrain publishes "partial parameters, no Fajr angle". That is CONFIRMED
verbatim, and the verdict is now stronger than the record had it:

- **No authority in Bahrain publishes a Fajr degree anywhere.** The Supreme Council for
  Islamic Affairs (المجلس الأعلى للشئون الإسلامية) states the ISHA method in degrees, the
  FAJR method only as a SITE. Its own calendar book and its calendar page carry the same
  wording.
- **The council's method statement is now captured in full** (previously absent from the
  census): Isha = true 18° depression replacing the conventional +90 min; Fajr and sunrise
  computed at Dilmunia (26.27 N, 50.68 E, easternmost Muharraq) and Dhuhr/Asr/Maghrib/Isha
  at Salman (26.22 N, 50.44 E, westernmost Bahrain); Dhuhr at the disc's meridian crossing
  (+1 min over the midpoint); Eid at 4° altitude.
- **The full official table is now on disk**, 355 dated rows spanning 1448 (2026-06-16 →
  2027-06-05), from the council's own daily calendar PDF, cross-checked row-for-row against
  the desk-calendar book.
- **Fitted Fajr from that table: 18.1° at the declared Dilmunia site, 18.2° at Manama**
  (18.2 gives 330/355 exact, MAE 0.07 min). Isha at the declared Salman site fits 17.7°
  (334/355 exact, MAE 0.06). The pair is asymmetric by ~0.4°, and the per-day matched-angle
  band is 18.06-18.14 with no single value admitting all 355 days: the surface is an
  almanac table, not a live geometric computation, so the digit is 18.1-ish, not a point.

Consequence for the object: Fajr is FILLED (18.1 at Dilmunia / 18.2 at Manama, band
18.05-18.25), Isha's 17.75-18.0 band is CONFIRMED by a second, independent measurement
(17.7 at the table's own declared site), and the correct render is the table, not a
computation.

---

## 1. Surface table

| Country | Surface | URL | Tier | Dated data held | Years |
|---|---|---|---|---|---|
| Bahrain | Supreme Council calendar page (method statement) | `almajles.gov.bh/Programs/calendar/` | authority | method only, no rows | — |
| Bahrain | Council daily calendar PDF | `almajles.gov.bh/MediaManager/Media/Documents/taqweem1448/taqweem/CalendarDaily1448Final.pdf` | authority | 355 dated rows, 7 columns | 1448 only (1447/1449 404) |
| Bahrain | Council desk-calendar book PDF | `.../taqweem1448/CalendarBook1448Final-2026.pdf` | authority | same 355 rows + climate/astronomy sections | 1448 |
| Bahrain | Sunni Waqf prayer page | `sunniwaqf.com/online/شؤون-المساجد/Prayertime` | authority (smaller waqf) | method only, no rows | — |
| Saudi Arabia | KACST Umm al-Qura Hijri-year API, per city | `umqserv.kacst.gov.sa/api/v1/Prayer/GetPrayerHijriYear?yh=&lat=&lon=&zone=3` | authority | 355/354 rows per city-year | 1448, 1449 |
| Palestine | Awqaf ministry portal `tawaf.ps` | `https://tawaf.ps/` | authority | unreachable | — |
| Palestine | Jerusalem Awqaf `awqafalquds.org` | `https://www.awqafalquds.org/` | authority | Cloudflare interstitial | — |
| Palestine | `awqaf.ps` | `https://www.awqaf.ps/` | authority | a login stub, no data | — |
| Syria | Ministry portal `mow.gov.sy` | `https://mow.gov.sy/` | authority | news portal, no prayer table | 2026 |
| Syria | `awqaf.gov.sy`, `moawqaf.gov.sy` | — | authority | DNS/connection failure | — |
| Lebanon | Dar al-Fatwa five-region annual table (masjidi platform) | `tv.masjidi.app/upload/json_prayers_times/prayer_times_region_json_{1..5}.json` | authority | 366 undated rows × 5 regions | one year, inferentially 2028 |
| Lebanon | Dar al-Fatwa Beirut screen (binds region 2) | `tv.masjidi.app/26` | authority | config only | — |
| Yemen (Sanaa) | Awqaf authority prayer API | `awqaf.gov.ye/api/method/blue_theme...get_page_data?fetch_date=` | authority | 31 locations × day, ~10-day retention | 2026 |
| Yemen (recognised gov.) | Ministry of Awqaf and Guidance, Aden | `yemenawqaf.org/prayer-times` | authority | full month per city, 6 cities | 2025-2027 selectable |
| Oman | MARA calendar | `mara.gov.om/calendar_page2.asp` (POST year/month/CityID) | authority | full month | 2021-2031 |

---

## 2. Bahrain — CONFIRMED method, NEW table, Fajr filled

**Confirmations.** The record's "angle-over-interval upheld" holds and is now stated by the
publisher, not inferred: Isha is the true 18° depression, which is why the printed
Isha−Maghrib gap runs 75-90 min across the year (mean 79.9) rather than a fixed +90. The
"published partials: Isha 18, Dhuhr +1 (transit), Maghrib geometry" line is exactly what the
council text says. Clock is IANA-fixed (Bahrain has no DST), unchanged.

**New.** Two things the census did not have:

1. The method statement itself, in full, including the two-site rule and the Eid 4° rule.
2. The complete 1448 table as dated rows: `data/bh-bahrain-calendar-1448.json`, 355 days,
   `{fajr, sunrise, dhuhr, asr, magrib, isha, lastThird}`. Parsed from the daily PDF by
   anchoring on the page's own `%` marker (the block is printed twice, mirror-imaged, and
   astronomical notes inject stray times above it; the naive first-seven-tokens parse fails
   on 12 of 355 pages, the anchored parse on none). Zero ordering violations. Cross-checked
   against the desk book on sampled rows: exact on every field.

**What deserves a fit.** The table itself. It is the authority's own rendered output and it
removes the "band not point" defect for Isha and fills Fajr. What it will NOT fix is that
the underlying series is almanac-quantised: no angle reproduces all 355 days.

**Negatives.** 1447 and 1449 calendar PDFs are 404 (`taqweem1447/`, `taqweem1449/`), so
year-2 does not exist yet at this path. The council site carries no numeric Fajr degree in
Arabic or English, and neither does the Sunni Waqf page; both were read in full.

## 3. Saudi Arabia — CONFIRMED surface, NEW cities, year-3 boundary

**Confirmed.** `umqserv` is per-city, not Makkah-only: the same `yh` at different `lat/lon`
returns different minutes (Makkah 04:11 fajr, Jeddah 04:13, Medina 04:02 on the same day), so
the "two anchors" limitation was a capture limitation, not an endpoint limitation.

**New.** Medina (24.4672, 39.6111) and Jeddah (21.4858, 39.1925), Hijri years 1448 and 1449
in full: 709 dated rows per city, no gaps, no overlap at the year seam.

- `data/sa-medina-1448-1449.json`, `data/sa-jeddah-1448-1449.json`
- Structural signature re-proved on 1,418 new rows: `isha − maghrib` is **exactly** 90 min on
  651 days per city and **exactly** 120 min on 58 days per city (29 Ramadan days in each of
  1448 and 1449), zero exceptions. That is the record's load-bearing rule, unchanged at two
  new coordinates.
- A full recipe re-fit at the new anchors is NOT claimed here. A coarse check at 18.5 gives
  Medina fajr MAE 0.62 min and Jeddah 0.53 min, i.e. consistent but not decisive under the
  record's floor-plus-one formulation; the fit belongs to the census, not to this sweep.

**Negatives.** The presidency side (`prh.gov.sa`, `alharamain.gov.sa`) still publishes no
per-city table; the Haramain widget remains the defective iqamah panel the record already
flags. `open.data.gov.sa` unresponsive on this pass. The endpoint's ceiling is unchanged
(yh=1501 returns 400 naming 1318-1500).

## 4. Palestine — honest negative, with three named closures

Swept in Arabic and English: the ministry portal, the Jerusalem Awqaf administration, the
ministry's `awqaf.ps` host, and the usual mirrors.

- `tawaf.ps` (وزارة الأوقاف والشؤون الدينية — فلسطين): TCP connection timeout on four
  attempts, two networks (direct and browser). Dead from here.
- `awqafalquds.org` (إدارة أوقاف القدس وشؤون المسجد الأقصى): Cloudflare challenge on every
  request. Not solvable under the standing rules, so not attempted.
- `awqaf.ps`: a 692-byte "نظام إدارة الوقف" login stub. No public content.
- No per-governorate dated table surfaced from any first-party Palestinian domain.

The record's "candidate, feed-class verdict" therefore stands untouched: nothing found either
confirms or refutes it, and no new surface was captured. `mawaqit.net/ar/m/al-aqsa-palestine`
exists but is a platform mosque page, community tier, and was not used.

## 5. Syria — honest negative; the ministry's new portal found and closed

- The ministry now runs `mow.gov.sy`, a Next.js news portal (a genuine change since the
  record was written). It publishes news, services and the masjidak app's statistics, and
  carries **no prayer table and no calendar page** in either language. Captured.
- `awqaf.gov.sy` and `moawqaf.gov.sy` fail at the network layer (000), consistent with the
  record's "dead".
- `masjidak.sy` and `api.masjidak.sy` remain dead (000); `masjidak.com` is a 404. The app
  channel is still closed.
- `archive.sana.sy` timed out on the 2025-03-06 decree article; the record already holds the
  2025-02-28 SANA policy statement, so no new policy evidence is claimed here.
- Turkish Diyanet mirrors (namazvakti, hurriyet) print Diyanet's own computation for Şam, not
  the Syrian ministry's table. Recording them would launder a Turkish computation as Syrian
  authority, so they were not captured as data.

## 6. Lebanon — NEW: the composite feed is found, and it is five regional tables

This closes the record's "surface: Dar al-Fatwa composite feed" with no URL. The feed is the
Dar al-Fatwa's annual table served by the masjidi display platform, one JSON per region:

`https://tv.masjidi.app/upload/json_prayers_times/prayer_times_region_json_{1..5}.json`

- Five files (region 6 is 404), 366 rows each, keyed only by day index — **no dates in the
  payload**. Region 2 is bound to the Dar al-Fatwa Beirut screen (`tv.masjidi.app/26`,
  "دار الفتوى … رأس بيروت، بيروت"), which names the city for that region only. Regions 1,
  3, 4, 5 are unlabelled; their Dhuhr minutes (11:43 / 11:46 / 11:46 / 11:46 vs Beirut
  11:41) say they are other governorates, not other countries.
- **The fixed UTC+2 clock is confirmed a second time.** July rows print Maghrib 18:58 and
  Sunrise 04:29, i.e. standard time in high summer: the table is UTC+2 year-round while the
  platform config declares `Asia/Beirut`. That is the record's "fixed clock must be handled
  as a rendering shift", now measured on the feed itself.
- **Year is 2028, inferred, not stated.** Row 0 is 1 January by construction; fitting the
  series against 2026/2027/2028/2029 gives the smallest scatter at 2028 on every prayer
  (sunrise MAE 0.82 min vs 1.14 / 0.95 / 1.35), and the −3 min sunrise step after row 59 is
  the 29-February seam. `data/lb-daralfatwa-region2-2028-inferred.json` carries the
  inferred dates; they must not be quoted as published dates.

**Why it is not fitted here, and what a fit will find.** A single coordinate does not
reproduce it — the record's "composite" defect is real and survives measurement. Against
Beirut geometry the best fits are fajr ≈ 19.8°, isha ≈ 17.4°, maghrib +4 min, dhuhr 0, but
each with ~1.4-1.7 min scatter and at most 232/366 days within one minute; testing eight
Lebanese cities moves sunrise scatter only between 0.81 and 1.27. The lift is per-region
coordinates, not a better angle.

## 7. Yemen — both feeds captured, none fitted (owner decision pending)

**Sanaa surface (fitted on record 18/16).** `awqaf.gov.ye` is now a Frappe app whose prayer
panel calls a keyless method:
`/api/method/blue_theme.blue_theme.page.tebyan_prayer_panel.tebyan_prayer_panel.get_page_data`.
`?fetch_date=YYYY-MM-DD` is honoured, but retention is a short rolling window: 2026-11-08
returns an empty document, and 2026-11-15, 2026-12-01 and 2025-06-01 all return empty. Nine
days of November 2026 were obtainable, 31 locations each —
`data/ye-sanaa-31-locations-nov2026.json` (279 rows). A full month needs daily accumulation.

**Recognised-government surface (new).** `yemenawqaf.org/prayer-times` — Ministry of Awqaf
and Guidance, Aden — serves a full month per city in the HTML, six cities (عدن، المكلا،
سيئون، مارب، الغيضة، الحوطة), years 2025-2027 in the selector, driven by Livewire POST (URL
params are ignored). Its own headline calls it "خدمة إلكترونية لمواقيت الصلاة وفق المعيار
اليمني المعتمد", i.e. an approved Yemeni standard. Aden, November 2026, 30 rows:
`data/ye-gov-aden-nov2026.json`.

Both are captured and labelled. **Neither is fitted and neither is chosen** — the label of
record is the owner's (#6912). The two feeds are visibly different surfaces, not two views of
one: on the same day Sanaa prints fajr 04:49 and Aden 04:50 with a different asr and isha.

## 8. Oman 2028 — captured, year-5 for the A fit

`mara.gov.om/calendar_page2.asp`, POST `year=2028&month=1..12&CityID=0` (Muscat), all twelve
months 200, parsed to `data/om-muscat-2028.json`: **365 dated rows, no gaps, no ordering
violations**. Parse trap respected: the page prints dhuhr/asr/maghrib/isha in 12-hour form.

Sanity anchors: 2028-01-01 reproduces 2027-01-01 to the minute (same solar declination on the
same civil date), and the seasonal shape is correct (fajr 03:52 in June, 05:24 at the
December solstice). This is the year-5 year for the grade-A `OM-MARA` object.

## 9. What is on disk

```
captures/
  bh-almajles-calendar.html                 method statement page
  bh-almajles-calendar-daily-1448.pdf       355-day official table (121 MB)
  bh-almajles-calendar-book-1448.pdf        desk book, second witness (72 MB)
  bh-book-1448.txt                          extracted text of the desk book
  bh-sunniwaqf-prayertime.html              Sunni Waqf method page
  sa-umq-{medina,jeddah,makkah}-14xx.json   raw KACST payloads
  om-mara-muscat-2028-01..12.html           raw MARA months
  lb-masjidi-tv-{26,1546}.html              Dar al-Fatwa screens
  lb-masjidi-region-{1..5}.json             five regional annual tables
  ye-awqaf-get_page_data.json               Sanaa API sample
  ye-sanaa-nov2026/2026-11-01..30.json      30 daily Sanaa payloads (8th empty)
  ye-gov-yemenawqaf-prayer-times.html       Aden month table
  sy-mow-home.html                          Syrian ministry portal
  ps-*.html                                 Palestine closures
data/                                       8 normalized row sets (see sections above)
scripts/                                    parsers and residual checks
```

## 10. Honest negatives, summarised

- Bahrain: no published Fajr degree anywhere, Arabic or English; no 1447/1449 calendar.
- Saudi: no per-city table on the presidency sites; the KACST API remains the only surface.
- Palestine: ministry portal unreachable, Jerusalem Awqaf challenge-walled, no table.
- Syria: ministry portal has no table; the app channel is still dead.
- Lebanon: feed found, year inferred not stated, no per-region coordinates published.
- Yemen: Sanaa feed retains ~10 days; recognised-government month capture depends on Livewire.
