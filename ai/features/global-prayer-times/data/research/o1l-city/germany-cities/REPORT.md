# O1l-42 Germany cities — the DITIB/Diyanet city layer beyond the six, and the 2027 roll

Workspace `$HOME/athan-gitree/census/o1l-city/germany-cities/`. Public pages only, GET only, no
login, no form, no challenge solved, no contact with any body, no subagents. Nothing written under
`/tmp`, nothing written to the repository. Probe window 2026-11-11, 04:0xZ to 06:2xZ. User agent
`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36`.

Every capture is in `captures/`; normalized dated rows are in `data/`; fits and fit output in `fit/`.
Engine adhan 4.4.6, `Rounding.None` at second resolution, margin and rounding applied per column
afterwards, TZ `Europe/Berlin`, dates built from the printed strings, no clock read anywhere.

## 1. The 18 city-years, banked

The portal's own region API (`/de-DE/home/GetRegList`, `ChangeType=country|state`, `CountryId=13`,
`Culture=de-DE`) enumerates 16 states and 1,241 districts (`captures/de-states.json`,
`captures/de-districts-<state>.json`). All 18 target cities resolve to their own district id; each
city page carries the full 2026 civil year in three inline tables (7-row today widget, 31-row month
widget, 365-row year table). The year table is parsed alone and cross-checked against the other two:
**zero conflicting date across the three tables at every city**.

| City | District | URL | Rows | Span |
|---|---|---|---|---|
| Leipzig | 11100 | `namazvakitleri.diyanet.gov.tr/de-DE/11100/gebetszeit-fur-leipzig` | 365 | 2026-01-01..2026-12-31 |
| Dresden | 11035 | `.../de-DE/11035/gebetszeit-fur-dresden` | 365 | same |
| Nürnberg | 11024 | `.../de-DE/11024/gebetszeit-fur-nurnberg` | 365 | same |
| Bremen | 11005 | `.../de-DE/11005/gebetszeit-fur-bremen` | 365 | same |
| Hannover | 11013 | `.../de-DE/11013/gebetszeit-fur-hannover` | 365 | same |
| Dortmund | 11006 | `.../de-DE/11006/gebetszeit-fur-dortmund` | 365 | same |
| Essen | 11009 | `.../de-DE/11009/gebetszeit-fur-essen` | 365 | same |
| Duisburg | 11007 | `.../de-DE/11007/gebetszeit-fur-duisburg` | 365 | same |
| Düsseldorf | 11008 | `.../de-DE/11008/gebetszeit-fur-dusseldorf` | 365 | same |
| Bonn | 11004 | `.../de-DE/11004/gebetszeit-fur-bonn` | 365 | same |
| Mannheim | 11021 | `.../de-DE/11021/gebetszeit-fur-mannheim` | 365 | same |
| Karlsruhe | 11014 | `.../de-DE/11014/gebetszeit-fur-karlsruhe` | 365 | same |
| Freiburg | 11011 | `.../de-DE/11011/gebetszeit-fur-freiburg` | 365 | same |
| Kiel | 11016 | `.../de-DE/11016/gebetszeit-fur-kiel` | 365 | same |
| Rostock | 10551 | `.../de-DE/10551/gebetszeit-fur-rostock` | 365 | same |
| Magdeburg | 10875 | `.../de-DE/10875/gebetszeit-fur-magdeburg` | 365 | same |
| Erfurt | 10874 | `.../de-DE/10874/gebetszeit-fur-erfurt` | 365 | same |
| Saarbrücken | 11026 | `.../de-DE/11026/gebetszeit-fur-saarbrucken` | 365 | same |

6,570 city-days, authority tier, distinct per city (18 distinct sha256 over the parsed tables; the
identical byte lengths at Leipzig/Dresden, Dortmund/Duisburg and Mannheim/Freiburg are fixed-width
row arithmetic, not a repeated page).

## 2. The reference point is the publisher's own gazetteer point, and it is recoverable

The IGMG payload publishes the point the table is computed at, rounded to 0.1 degree
(`captures/igmg-times-<city>.json`, `sun` field). Solving the portal's own solar columns for
latitude from the seasonal shape of sunrise, sunset and asr with one constant removed per column
(`fit/solve-lat.mjs`, `fit/recovered-lat.json`) returns every city's published latitude within
0.06 degree: Leipzig 51.398 against 51.4, Hannover 52.396 against 52.4, Karlsruhe 49.018 against
49.0, Kiel 54.320 against 54.3, Freiburg 47.980 against 48.0.

Longitude is **not** recoverable from the columns: a longitude error and the dhuhr temkin shift
every column by one and the same constant. That degeneracy is stated rather than papered over. The
fits below therefore run at the publisher's own 0.1-degree point, which the mirror publishes.

## 3. Fit verdict: one recipe, 24 cities, and the pair closes

One recipe across the whole span, at every one of the 18 new cities (`fit/fit-all.mjs`,
`fit/germany-city-fit.json`). Margins are the best (margin, rounding) pair per column found by the
0.5-minute sweep; the counts are exact/365.

| City | lat/lon | sunrise | dhuhr | asr (Shafi) | maghrib | fajr 18° | isha 16° | amp fajr | amp isha |
|---|---|---|---|---|---|---|---|---|---|
| Leipzig | 51.4/12.4 | 246 (-6.5 floor) | 314 (+5.5 floor) | 104 (+3.5) | 153 (+6.5) | 175/307 | 73/319 | 152.2 | 268.2 |
| Dresden | 51.1/13.7 | 248 (-6.5) | 319 (+5.5) | 109 (+3) | 128 (+6.5) | 164/310 | 68/340 | 149.2 | 265.2 |
| Nürnberg | 49.5/11.1 | 229 (-6) | 292 (+5.5) | 114 (+3.5) | 141 (+6.5) | 169/332 | 73/365 | 144.1 | 257.6 |
| Bremen | 53.1/8.8 | 248 (-6.5) | 333 (+5.5) | 91 (+3) | 124 (+6) | 171/291 | 71/310 | 159.9 | 276.8 |
| Hannover | 52.4/9.7 | 239 (-6.5) | 317 (+5.5) | 98 (+3) | 129 (+6) | 165/297 | 77/319 | 157.5 | 273.9 |
| Dortmund | 51.5/7.5 | 249 (-6.5) | 312 (+5.5) | 93 (+3) | 141 (+6.5) | 175/305 | 76/317 | 155.1 | 271.0 |
| Essen | 51.5/7.0 | 238 (-6.5) | 324 (+5.5) | 98 (+3) | 134 (+6.5) | 170/305 | 71/332 | 156.3 | 271.9 |
| Düsseldorf | 51.3/6.8 | 231 (-6.5) | 323 (+5.5) | 109 (+3) | 136 (+6.5) | 166/308 | 67/319 | 149.6 | 265.7 |
| Bonn | 50.7/7.1 | 234 (-6.5) | 322 (+5.5) | 94 (+3) | 142 (+6.5) | 187/315 | 86/353 | 153.0 | 267.9 |
| Mannheim | 49.5/8.5 | 250 (-6.5) | 290 (+5.5) | 117 (+3.5) | 145 (+6.5) | 192/332 | 81/365 | 147.5 | 260.5 |
| Karlsruhe | 49.0/8.4 | 277 (-6.5) | 325 (+5.5) | 107 (+3.5) | 159 (+6.5) | 190/343 | 98/365 | 145.3 | 256.9 |
| Freiburg | 48.0/7.8 | 253 (-6.5) | 316 (+5.5) | 111 (+3) | 146 (+6.5) | 206/365 | 89/365 | 150.1 | 256.3 |
| Kiel | 54.3/10.1 | 235 (-6.5) | 324 (+5.5) | 91 (+6.5) | 135 (+6) | 159/281 | 71/298 | 166.0 | 283.7 |
| Rostock | 54.1/12.1 | 246 (-6.5) | 326 (+5.5) | 91 (+3) | 135 (+6) | 164/283 | 76/299 | 164.0 | 281.7 |
| Magdeburg | 52.1/11.6 | 250 (-6.5) | 324 (+5.5) | 90 (+3) | 130 (+6.5) | 180/299 | 84/323 | 157.6 | 273.8 |
| Erfurt | 51.0/11.0 | 245 (-6.5) | 310 (+5.5) | 105 (+3) | 133 (+6.5) | 178/311 | 77/343 | 151.8 | 267.4 |
| Saarbrücken | 49.2/7.0 | 259 (-6.5) | 319 (+5.5) | 101 (+3.5) | 146 (+6.5) | 189/337 | 88/365 | 144.1 | 257.0 |

**Dhuhr +5.5 floor is exact at 290-333 of 365 days at all 18 cities; sunrise -6.5 floor at 17 of
18 (Nürnberg lands on -6); maghrib +6.5 floor at 14 of 18, with Bremen, Hannover, Kiel and Rostock
on +6.** The domestic temkin set the held six cities measured is therefore confirmed at the whole
country, not at six points. Asr sits on Shafi at +3 to +3.5 floor with the
scattered worst error (2-4 min) the held note already records; the asr and maghrib margin sweep on
the wider mirror window drifts to +6.5 and +8.5-9, so those two margins are seasonal rather than
constant.

**The angle pair closes.** Zero-margin nearest-minute exact counts on the 182-day winter window
(January-March plus October-December), `fit/winter0.mjs` and `fit/winter0.json`:

- **fajr**: 128-148 of 182 exact at 18.0 degrees at all 18 cities, **182/182 within one minute**,
  and **exact 0 at 17.5, 18.25 and 18.5 at every city**. A single clean angle.
- **isha**: exact 0 at 15.0, 16.5 and 17.0 at every city; a peak across 16.0 (26-43 exact) with the
  shoulder at 16.25 (30-38) and 15.75 (40-62). The held 16.0 sits inside the identified band.

A finer sweep on the mirror's 243 winter days (`fit/isha-band.mjs`, `fit/isha-band.json`) puts the
band at 15.8-16.3 with exact counts flat to within about ten across it and **zero above 16.45**. The
honest statement is that a minute-rounded column carrying a seasonal temkin cannot separate 16.0
from 16.2; the record's 18/16 stands, and 16.45 and above is excluded outright.

Seasonal amplitude (January mean minus July mean) is 144-166 minutes on fajr and 256-284 on isha,
the largest in the European set, and the reason one fitted season cannot be extrapolated.

**Grade.** Six banked city-years plus 18 new ones, all one published cycle each: the object stays
provisional, exactly as O1l-10 left it. The lift still needs a second cycle, and section 4 shows
where it is and what it is worth.

## 4. The 2027 roll: absent at the portal, served by a mirror, and the mirror is the same generation

**Portal.** `2027` occurs zero times in all 18 year tables. The page carries no year selector; the
only `yil=` on it belongs to the religious-holidays link. `?yil=2027` and `?year=2027` answer 200
with **tables byte-identical to 2026** (365 rows, 2026-01-01..2026-12-31, `fit`-level equality
checked on the parsed table, not on the HTML); `/2027` answers 404. The parameter is accepted and
ignored. Roll due 2027-01-01.

**IGMG serves it.** The Islamische Gemeinschaft Millî Görüş calendar
(`www.igmg.org/wp-json/igmg-gebetszeiten/v1/`, WP REST namespace with routes `cities`, `search`,
`nearest`, `month`, `times`) serves **2026-10 through 2027-11, fourteen months**, for 1,272 German
entries. `month=2026-09` and `month=2027-12` answer 400 `igmg_gz_bad_month`. All 24 cities are
banked, Duisburg through its three district entries: **26 tables at 426 dated rows each, 11,076
city-days** (`data/igmg-<city>.json`), and the payload publishes the sun point it computes at.

The gazetteer has **no plain "Duisburg"**: it splits the city into Hochfeld (20280), Meiderich
(20281) and Rumeln (19001432), each at its own 0.1-degree point, and the three tables differ by up
to one minute (298 of 426 days between Hochfeld and Meiderich). **Duisburg (Meiderich) is the one
the portal's own district 11007 computes at**: 92/92 days identical, worst 0, against Hochfeld's
35/92 and Rumeln's 5/92.

**The mirror is byte-identical.** Over the 92 overlapping days (2026-10-01..2026-12-31) the mirror
equals the portal at **every city: 2,116 of 2,116 city-days identical on all six columns, worst
difference 0** across the 23 single-entry cities (`check-mirror.py`; the six held cities come from
the two earlier workspaces, and the o1k files name the imsak column `fajr_imsak`), and 92/92 again
at Duisburg through its Meiderich entry. IGMG is not a second publisher with its own engine; it
republishes the Diyanet table.

The consequence is exact and it is not a lift: **the 2027 Diyanet values exist and are banked, but
they are the same computed generation.** Under the frozen-generation rule they cannot raise the
object from provisional to A. What they do give is a **proven-to-2027-11** forward horizon on the
recipe, and the forward fit confirms the shape of it (`fit/y2027.mjs`, `fit/y2027-angle.json`,
334 days of 2027 per city): fajr exact 0 at 18.25 and 18.5 degrees at every city and 126-171 exact
at 18.0, and isha exact 0 at 16.5 and 17.0 at every city. The isha exact count at 16.0 falls from
26-43 (2026 winter window) to 4-20 (2027 days) — a between-year parameter drift worth recording and
not worth adjudicating on a minute-rounded column. The 2027 half-year is a forward-longevity result,
not a second-year independence result.

## 5. Second publishers and platform layers

**mawaqit (platform).** Two German mosques captured whole; each page embeds the full-year
`calendar` array, and the March DST jump (29 March) dates it 2026 unambiguously.

- **DİTİB İlim ve İrfan Camii, Hannover** (`mawaqit.net/de/m/ditib-ilim-ve-irfan-camii-hannover-hannover-3079-germany`):
  365 rows. Margins sunrise -6.5 floor, dhuhr +5.5 floor, asr +3.5, maghrib +7 — **the Diyanet
  temkin set exactly** — and against the portal's own Hannover table 25/365 days identical and
  255/365 within one minute on every column. A DITIB mosque carries the Diyanet table at its own
  reference point (52.4173/9.7603 against the portal's 52.4/9.7). An independent confirmation of
  the recipe family from a platform artifact.
- **Masjid Ali, Duisburg** (`mawaqit.net/de/m/ali-duisburg`): 365 rows, **a genuinely different
  engine** — sunrise -2.5 floor, dhuhr +0.5 floor, asr +0.5, maghrib +3.5; free fit fajr 17.9 /
  isha 16.85 bare. Against the portal's Duisburg table: **0/365 identical, 0/365 within one on all
  columns**; medians fajr -1, sunrise +4, dhuhr -5, asr -4, maghrib -4, isha +8. Two Duisburg
  mosques, two different tables, 8 minutes apart on isha.
- **Defect recorded**: both mawaqit calendars carry a **29 February in 2026**, a non-leap year
  (366 rows). The row is dropped from the fit and the defect stands as published.

**IslamicFinder (platform).** `islamicfinder.org/world/germany/2879139/leipzig-prayer-times/` 200,
the live day only: Leipzig reads fajr 05:27 / dhuhr 11:56 against the portal's 05:25 / 11:59. A
different calculator, one-day witness, no dated year reachable without the site's own JS API. Not
fitted.

**Ahmadiyya (community).** `ahmadiyya.de/tools/gebetsplan/` 200 but a client-side calculator over a
Here-maps widget with no dated artifact (its visible dates are 2018 devotional notices); the Köln
Bait-un-Nasr mosque page (`ahmadiyya.de/gebetsstaette/moscheen/koeln/`) carries **no timetable at
all**, zero time strings in 490 KB. Honest negative.

**ZMD (Central Council).** `zentralrat.de` publishes statements and notices; searches in German
returned no prayer table, and the site's own pages carry none. Honest negative.

**DITIB national and local.** `ditib.de` offers an academy page and a Ramadan calendar but no city
year table. Local congregations split: `ditib-leipzig.de` publishes notices and no table. The
Diyanet portal is the DITIB table.

**al-habib.info (platform).** A full-year 2026 Dortmund table exists at
`al-habib.info/prayer-time/for/Germany/Dortmund.../2026/` with its own point (51.517/7.458) and a
five-day-interval default view; its 1 January row (06:20/08:35/12:37/14:16/16:33/18:50) is a third
engine again, 26 minutes off the portal on isha. Captured, not fitted (the all-days reveal is a
client call).

## 6. Honest negatives

- **Duisburg has no plain entry in the IGMG gazetteer**, only three districts; the portal's own
  Duisburg table matches the Meiderich entry exactly, so the district split is a gazetteer form
  rather than a coverage gap. Recorded, and the three district tables differ by up to one minute.
- **The portal serves no year but the current one** and no year parameter has any effect; 2027 must
  come from a mirror or wait for the roll.
- **Longitude is not recoverable** from the columns (degenerate with the dhuhr temkin); only the
  latitude is, and only to about 0.05 degree.
- `prayer-times.e-corlu.com` (which mirrors the portal's district ids and advertises Berlin January
  2027) answers **403** to this host. Not read.
- The DITIB Leverkusen Facebook post announcing a "2027 Yılı Diyanet Namaz Vakitleri Takvimi" is a
  public post but the platform is login-gated to this host; the 2027 artifact behind it was not
  read.
- **Searches run** (German, Turkish, English): DITIB Gebetszeiten <city> 2026, IGMG Gebetszeiten,
  Ahmadiyya Gebetszeiten, ZMD Gebetszeiten, mawaqit/masjidbox/masjidal, IslamicFinder <city>,
  namaz vakti Almanya 2027, Gebetszeiten <city> Jahreskalender PDF. Nothing else dated surfaced.

## Assumptions

- The German page's first time column (`Morgengebet (Fastenbeginn)`) is the imsak row and is
  treated as fajr, as the record's scheme note holds.
- The fit point is the IGMG-published `sun` lat/lon, taken as the point the portal computes at,
  because the two surfaces agree to the minute on 2,116 of 2,116 overlapping city-days.
- "Winter window" is the held 182 days, January-March plus October-December.
- The mawaqit calendar year is read from the March DST jump day (29 March = 2026), since the payload
  carries no year field and its 29 February contradicts a leap year.
- IGMG's 2027 rows are the Diyanet 2027 computation because the overlap is byte-identical; that is
  an inference from 92 days, stated as one.
