# O1l us-states — mosque surfaces in the states beyond the 20 big metros

Agent O1l-5 (wave O1l, city-level round two). Workspace: `us-states/`. Engine: adhan 4.4.6
(Rounding.None equivalent — second resolution, explicit round-to-minute) plus the carried
solar fitter (latitude/longitude/maghrib-caution solved from each capture's own sunrise and
maghrib curves, rms printed per surface). All fits run per calendar year with literal dates;
the real clock is never read. Community tier throughout; platform tables are the platform's
own, never the user's mosque. 37 fit lines in `out/fit_masjidal_all.tsv`; raw JSON per
surface in `out/fit_*.json`; canonical rows + iqamah layers in `data/`; raw captures in
`captures/` (207 files).

## Headline

40 mosque surfaces with dated data across 19 metros; 31,784 banked Masjidal rows (29 ids x
3 years) + 730 dpt Houston rows + 2,590 mawaqit rows (7 pages x 365) + 426 athanplus
Providence rows + 7 masjidbox Albuquerque rows. **The 15/15 default HOLDS outside the big
metros: of the 29 surfaces that hold a verdict (9 defective or hand-edited, 2 candidate-class
excluded), 20 sit exactly at plain ISNA 15/15 at round-to-minute (worst ±1), and 3 more sit
in the 15-deg family.** The 18-deg family concentrates in Hanafi-leaning mosques (6 surfaces:
two Karachi 18/18, three 18/17-Hanafi, one 18/17-Shafi Honolulu).

Per-metro one-liner, then detail:

| Metro | Surfaces (rows/years) | 15/15 verdict |
|---|---|---|
| Atlanta GA | 5 Masjidal (1,096 d each) | 2 clean 15/15, 1 Karachi 18/18 Hanafi, 1 defect, 1 distorted |
| Miami FL | 2 mawaqit (365 each) — FIRST | 1 clean 15/15, 1 mixed (fajr 15 + isha 18 + Hanafi) |
| Charlotte NC | 1 Masjidal (3 y) | 1 clean 15/15 |
| Nashville TN | 2 Masjidal (3 y each) | 2 clean 15/15 |
| Memphis TN recheck | 1 Masjidal (3 y) + second domain | 15/15-family, platform ±0.3 drift |
| Birmingham AL | 0 — negative | — |
| New Orleans LA | 1 mawaqit, DEFECTIVE | no clean verdict |
| Houston 2nd tier | 2 dpt (365 each) + 3 Masjidal (3 y) | 2 clean 15/15, 1 Karachi 18/18 Hanafi, 1 defective feed |
| Denver CO | 2 mawaqit (365 each) — FIRST | 1 clean 15/15, 1 18/17-Hanafi |
| Salt Lake City UT | 0 — negative | — |
| Phoenix AZ | 1 Masjidal NEW (3 y) | 0 — MWL-angles + Hanafi + dhuhr +5, no-DST |
| Las Vegas NV | 1 mawaqit, hand-edited | no clean verdict |
| Albuquerque NM | 1 masjidbox (7 d, athan+iqamah) | ISNA-family on the visible days |
| Seattle WA | 10 Masjidal (3 y each) | 7 clean 15/15, 2 hand classes, 1 Hanafi+dhuhr+5 |
| Portland OR | 2 Masjidal (3 y each) | 2 clean 15/15 |
| Boise ID | 1 mawaqit (365) — FIRST | 1 clean 15/15 |
| Hartford CT | 1 Masjidal NEW (Waterbury, 3 y) | 1 clean 15/15 (60-63 all-exact days/yr) |
| Providence RI | 1 athanplus NEW (426 d, 14 months) | 0 — angles wander 17.6-20.1 (candidate) |
| Buffalo NY | 2 Masjidal NEW (3 y each) | 1 clean 15/15, 1 MWL 18/17-Hanafi |
| Anchorage AK | 0 clean — site prints MAKKAH | — (defect documented) |
| Honolulu HI | 1 Masjidal NEW (3 y) — FIRST | 0 — MWL 18/17 Shafi, clean |

## Metro detail

### Atlanta GA — Masjidal x5, three years each (5AvPx2KX, VrdRZqdG, pQKMMBKB, PAPy7ZdJ, 4nL1XlKa)

- **Masjid al-Husna, Buford** (`5AvPx2KX`): recipe plain ISNA 15/15 Shafi, maghrib sunset+3,
  fit 34.07/-83.94 rms 0.73. ISNA round-to-minute 2026: fajr 92.6/isha 87.4 exact, all
  columns within 1. Three years; ISNA all-six-exact days 4 (2025), 58 (2024). Amplitude
  fajr Jan 388 (06:28) → Jul 314 (05:14). CONFIRMS the record.
- **Masjid al-Quba, Buford Hwy** (`VrdRZqdG`): DEFECT CLASS — hand-entered or mis-fed table.
  Solar columns fine (rms 0.77) but fajr implies 9.3 deg, isha 20.5 deg, asr scores 25 min
  off Shafi. Fajr exact 14 pct worst +31. Recorded defective; no recipe claim.
- **Gwinnett Islamic Circle, Suwanee** (`pQKMMBKB`): 15-deg family but DISTORTED mid-year —
  fajr worst -15, isha worst +14, dhuhr/maghrib half exact. An editorial mid-year shift sits
  inside an otherwise 15-deg table. Candidate, flagged.
- **Masjid Ibraaheem, Loganville** (`PAPy7ZdJ`): NEW RECIPE FOR THE METRO — Karachi 18/18
  **Hanafi** asr, exactly, three years (2026 fajr 92.9/isha 90.1 exact at Karachi params,
  worst ±1). The 18-deg family's first clean Atlanta find.
- **Masjid Jafar, Johns Creek** (`4nL1XlKa`): clean ISNA 15/15 Shafi (fajr 93.4/isha 85.5),
  three years, ISNA all-exact 104/365 (2026) and 104/366 (2024). CONFIRMS.

### Miami FL — FIRST SURFACES, mawaqit x2 (2026 calendars, coordinates from the payload)

- **Masjid Al-Ihsaan, 33157** (`masjid-al-ihsaan-miami-33157`): clean ISNA 15/15 Shafi —
  fajr 96.4 pct, isha 92.9 pct exact, all columns within 1, at 25.59/-80.36 (rms 0.57).
  Jumua 13:30. Miami's first clean dated surface.
- **The Islamic School of Miami - Masjid Noor, 33186** (`masjid-noor-miami-33186`): MIXED
  recipe — fajr plain 15 deg, isha plain **18 deg**, asr **Hanafi** (MAE 0.57 vs 58.9
  Shafi), dhuhr carries a +1 caution (exact 4.4 pct). A one-mosque hybrid: ISNA dawn, MWL
  night prayer, Hanafi afternoon. Recorded as its own micro-line.

### Charlotte NC — Pillars Mosque (`xdyqvadX`), three years

Clean ISNA 15/15 Shafi, the cleanest 2026 table of the whole sweep: fajr 97.3, sunrise 96.7,
dhuhr 97.8, maghrib 98.6, isha 87.7 exact, nothing worse than ±1. Geo 35.37/-80.76 rms 0.74.
Three years; ISNA all-exact 91/365 (2025), 88/366 (2024). CONFIRMS the default at 35.3 N.

### Nashville TN — ICT Antioch (`rdRvm3dG`, recheck) + ICWC Franklin (`zVKpbbAP`, NEW)

- **Islamic Center of Tennessee, Antioch**: still serving; 15/15 Shafi clean (94.2/88.5),
  three years, ISNA all-exact 70/365 (2025) and 79/366 (2024). CONFIRMS O1k-W14.
- **Islamic Center of Williamson County, Franklin** (`zVKpbbAP`, NEW id from icwctn.org's own
  HTML): clean ISNA 15/15 Shafi (91.2/88.5), three years, all-exact 91 (2025) and 94 (2024).
  Nashville now holds two clean 15/15 mosques.

### Memphis TN — recheck (`1QL0gbKZ`), three years

Memphis Islamic Center, Cordova: still serving 1,096 days. Measured angles 14.82/15.18 —
the platform's ±0.3 min rounding drift around a plain 15/15 core (ISNA within-1 across the
year; exact 7.1 pct is the half-minute convention, not a different recipe — O1k-F7's engine
artefact class). NEW domain: `micmemphis.org` carries the same id in its own HTML (second
gate for the same tenant). CONFIRMS.

### Birmingham AL — HONEST NEGATIVE

Sites checked: `bisweb.org` (Birmingham Islamic Society) — schedule page is a **Mohid**
app embed (`elementor-mohid`, `plugins/Mohid`), iqamah-only, no dated year table; dpt REST
404; no masjidal/mawaqit/masjidbox references. `alhijrahtrust.org` is **Birmingham UK**
(decoy avoided — title checked). Languages searched: English. No surface.

### New Orleans LA — mawaqit calendar DEFECTIVE

Islamic Center of New Orleans (`islamic-center-of-new-orleans-70116-1541`, mawaqit page
captured): the served 2026 calendar is internally broken — the sunrise offset runs in
blocks of -90/-60/-30 min across the year (five distinct clock blocks), so the table mixes
UTC offsets month by month (the San Antonio per-column class, month-scale). No clean NOLA
surface; recorded with the block boundaries in `out/fit_*.json`.

### Houston TX, second tier — dpt x2 + Masjidal x3

- **MCI (`masjid.mcisonline.net`), dpt 2026 full year**: CLEAN ISNA 15/15 Shafi at
  29.76/-95.35 (rms 0.50) — fajr 74.2 pct exact worst +1, isha 44.1 pct worst +2 (the dpt
  engine's rounding), asr Shafi. NEW DEFECT: six Saturday `zuhr_begins` cells walk +24 →
  +12 minutes off the solar midline (2026-11-14 to 2026-12-19) — hand-entered block; the
  jamah (iqamah) layer is a clean fixed 13:00 on the same days, so only the begins layer
  carries the fault.
- **ISGH Masjid Hamza (`isghmasjidhamza.org`), dpt 2025 full year**: DEFECTIVE FEED —
  per-column mixed offsets (fajr -4:45, sunrise -4:11, zuhr -5:22 on the same December day;
  worse than Toledo's clean +60 class). The 2025 board feed cannot be repaired by any
  single shift. ISGH HQ itself 403s the REST route. Recorded honestly.
- **Alnoor Masjid (`BYADgwLN`), three years**: NEW RECIPE FOR THE METRO — Karachi 18/18
  **Hanafi**, exactly, worst ±1 every year (fajr 96.4-97.0 pct exact). Frozen across three
  years. The metro's second distinct recipe beside the 15/15 pool.
- **Al Huda, Katy (`8KXma5LM`)**: clean ISNA 15/15 Shafi (97.3/93.4), three years, all-exact
  111/365 (2025). **Richmond ICC (`keLQn7AM`)**: 15-deg fajr with rounding drift (15.19),
  Hanafi asr — confirms O1k-W14/F6.

### Denver CO — FIRST SURFACES, mawaqit x2

- **CMCC, Aurora** (`cmcc-colorado-80013`): clean ISNA 15/15 Shafi — fajr 93.2, dhuhr 99.5,
  isha 86 exact worst ±1, jumua 12:10. Denver's first clean dated surface.
- **MILE HIGH Islamic Center BEKCC, Denver** (`bekcc-denver-80212`): 18-deg family with
  **Hanafi** asr — fajr angle 18.24, isha 16.95, asr Hanafi MAE 0.9. MWL params score fajr
  exact 10.7 pct worst ±2 — the angle sits 1-2 min off adhan-MWL (platform engine at 18/17).
  Denver's second recipe, distinct from CMCC's.

### Salt Lake City UT — HONEST NEGATIVE

Checked: `utislamiccenter.org` (dpt 404, no platform refs), `micutah.org` (Madina Islamic
Center — jumu'ah times only, 1:00/1:30 PM cells), `utahmuslims.com` (ISGSL portal — donate/
YouTube buttons, no table), `hicutah.org` (UnitedMomins — a mosque-apps vendor, not a
mosque), `uvislam.com` (Utah Valley — Provo, outside the metro). Languages searched:
English. No surface.

### Phoenix AZ — NEW Masjidal, three years (`zKz3zRLO`)

United Islamic Center of Arizona, Glendale (id from uislamicca.com's own HTML): MWL angles
+ **Hanafi** asr + a **+5 dhuhr caution**, at 33.66/-112.15 (rms 0.78) — fajr angle 17.76,
isha 16.97, MWL test fajr exact 18.9 pct worst +7 (seasonal wander of ~0.1-0.3 deg),
maghrib clean. **No DST rows at all** (America/Phoenix) — the platform renders the no-DST
zone correctly. Phoenix's first dated surface; not 15/15.

### Las Vegas NV — mawaqit hand-edited

Masjid Tawheed (`masjid-tawheed`): the calendar does not solve — geo rms 1.67 min, fajr
angle median 13.29 but winter-month median 14.98, worst +79 — the summer months carry
hand-edited values over the computed base. Recorded as hand-edited; no recipe claim.

### Albuquerque NM — masjidbox inline payload (7 days)

Islamic Center of New Mexico (`masjidbox.com/prayer-times/islamic-center-of-new-mexico-(abq)`,
landing page embeds the whole payload keyless, as the record holds): 7 dated days banked
(athan + iqamah layers, dated instants with explicit -07:00 offsets). The visible days read
ISNA-family (Nov fajr 05:24 ≈ 15-deg). Candidate class (7 rows, no fit).

### Seattle WA — Masjidal x10, three years each

Clean ISNA 15/15 Shafi, seven mosques, three years each: **Idris Mosque** (`keLQjWAM`,
87.9/75.9), **Islamic House of Seattle** (`RKxwXOdO`, 74/75.9), **Masjid Jamiul Muslimeen**
(`lJAmRjdR`, 90.1/79.2), **ICOPS Lynnwood** (`1QL0VydZ`, 75.1/74.5), **Puyallup ICC**
(`y0LbBXLo`, 89.9/84.7), **Ethiopian Muslim Association SeaTac** (`6adJ5qAk`, 73.4/77.5),
plus `xwLVXMdJ` Abubakr Tukwila at the 15-deg core with rounding visible at 47.5 N (worst
+3/+9). Hand-class: **MAPS Redmond** (`VrdRbPdG`, tight geo rms 0.34 but prayer columns
carry a mid-year manual shift — fajr worst +15, isha worst -25); **ICK Kent** (`QL0MGBAZ`,
**Hanafi** asr, dhuhr +5 caution, angles wander 14.64-15.47); **MAPS Snohomish**
(`0AWpj0dj`, 15/15 core with an isha anomaly block, worst +54). The metro's default is
15/15; the 47-48 N tables show the rounding the latitude forces.

### Portland OR — Masjidal x2, three years each

**Islamic Center of Portland - Masjid As-Saber** (`adJmGxAk`, 83.3/81.4) and **Masjid
An-Noor** (`XAlzQrKb`, 83.6/83.3): both clean ISNA 15/15 Shafi at round-to-minute, worst
±1, frozen across three years (all-exact 29/37 and 26/20 days). CONFIRMS at 45.5 N.

### Boise ID — FIRST SURFACE, mawaqit (365 rows)

Islamic Center of Boise (`islamic-center-of-boise-83704`): clean ISNA 15/15 Shafi — fajr
84.9 pct, isha 82.5 pct exact, worst ±1, at 43.61/-116.30 (rms 1.08, Idaho rounding).
Boise's first dated surface, on the default recipe.

### Hartford CT — NEW Masjidal at Waterbury, three years (`8L7mGbd5`)

Islamic American Society of Connecticut (id from iasconnect.org's own HTML): clean ISNA
15/15 Shafi — fajr 93.7/isha 87.7 exact, worst ±1, three years, ISNA all-six-exact 63/365
(2025) and 60/366 (2024) — the cleanest long span of the sweep. Waterbury serves the
Hartford metro; Hartford's own `berlinmosque.org` still answers with no feed (reconfirmed).

### Providence RI — NEW athanplus surface, 14 months (426 rows)

Masjid Al-Islam, North Smithfield (`timing.athanplus.com` widget id `YAD4yNAN`, embedded in
the mosque's islamic-calendar.html): the monthly widget walks its own history server-side
(`action=previous&date=`), archive floor ~2023. Harvested 2025-10 through 2026-11 (426
dated rows). The table is an angle construction but NOT a stable pair: fajr implied angle
17.58 median, winter months 20.09; isha 15.36, winter 18.34 — seasonally editorial.
Candidate grade (dated data, no stable recipe). Providence's three other mosques
(Al-Rahman Pawtucket, Masjid Ali, Zumratul Jannah) carry no dated table.

### Buffalo NY — NEW Masjidal x2, three years each

Two ids read out of isnfwny.org's own page script:
- **Masjid An-Noor / ISNF, Getzville** (`1XAlZzKb`): clean ISNA 15/15 Shafi (94.5/86.6,
  worst ±1), three years, all-exact 69 (2025) and 27 (2024). Buffalo's default confirmed.
- **Masjid At-Taqwa, Buffalo** (`p8KXgNdM`): **MWL 18/17 + Hanafi** asr (fajr 83.0/isha
  80.3 exact at MWL params, worst ±1), three years. The metro's Hanafi counter-line.
- Jami Masjid Buffalo: loads the Masjidal timetable widget but the id is script-configured
  (absent from public HTML); its schedule ships in a Mohid app. Partial negative.

### Anchorage AK — DEFECT DOCUMENTED, otherwise negative

`alaskamasjid.org` (Islamic Community Center of Anchorage) renders its Praying Times page
by computing times **in the browser** with hardcoded demo parameters —
`prayTimes.getTimes(new Date, [21.3891, 39.8579], +3, ...)` with method **Makkah** — i.e.
the page prints MAKKAH's prayer times, never Anchorage's (invocation saved:
`captures/anchorage_prayertimes_invoke.js`). No dated table for Anchorage anywhere public
(`alaskanmuslimcommunity.org` checked; no feed). Honest negative plus the defect record.

### Honolulu HI — FIRST SURFACE, Masjidal three years (`nzKzgvLO`)

Muslim Association of Hawaii (id from hawaiimasjid.com's own HTML): **MWL 18/17 Shafi,
clean** — fajr 95.3 pct, isha 94.8 pct exact, worst ±1, at 21.28/-157.82 (rms 0.60),
maghrib caution k=0, three years, no DST. Honolulu's first dated surface sits on the world
default, not the US one — the first US mosque in the census on plain MWL angles at Shafi
with zero margins.

## The 15/15 default outside the big metros

Of 29 verdict-holding surfaces (defectives and candidates excluded), **20 sit exactly at
plain ISNA 15/15 at round-to-minute** (69 pct), 3 more sit in the 15-deg family (platform
rounding drift), 6 carry the 18-deg family (two exact Karachi 18/18 Hanafi: Loganville GA
and Alnoor Houston; three 18/17 + Hanafi: Buffalo At-Taqwa, Phoenix UICA, Denver BEKCC; one
18/17 Shafi: Honolulu), and 1 is a mixed ISNA-fajr/MWL-isha/Hanafi table (Miami Islamic
School). The default therefore HOLDS but thins with distance from the old metros: every
clean verdict east of the Mississippi in this sweep is 15/15 except Loganville; the 18
family lives in Hanafi congregations and the western/Hawaii metros.

## Platform notes for the record

- The Masjidal range API answered all 29 ids, first request, at three years — 25,208 rows
  with zero negatives. iqamah layers exist for all three years on every US tenant checked
  (banked beside the athan layer per the two-layer rule).
- mawaqit pages embed `confData` with calendar + iqamaCalendar + coordinates + tz + jumua;
  the iqamaCalendar arrays were empty on all seven US pages (iqamah lives in the live
  widget, not a year archive) — the jumua time is in `data/meta_mawaqit_*.json`.
- The dpt `filter=year` trap repeats: filter=month params are ignored; parse what d_date
  covers. The Hamza 2025 install adds a new defect species (per-column mixed clocks).
- athanplus is NOT today-poll-only: its monthly widget serves whole months and walks
  history server-side (floor ~2023); cells print bare 12-hour times with no meridiem.
- masjidbox landing page embeds dated instants with explicit UTC offsets, keyless.

## Gates

Every feed gated against its own live page: Masjidal ids via the mosque's own page (id
present in HTML at al-Husna, Gwinnett, Abubakr, Idris, ICK, Pillars, al-Huda, Memphis IC,
ICT/Waterbury-by-proxy, ICWC, UICA, MAH Honolulu, ISNF/At-Taqwa via their own fetch code)
or the platform widget page (`captures/gate_*_widget.html`); dpt Houston via both
homepages loading dpt.js; mawaqit/athanplus/masjidbox via the captured pages themselves
(`captures/mawaqit_*.html`, `captures/athanplus_*`, `captures/masjidbox_icnm_abq.html`).
MAPS Redmond's site 403s plain curl (403 saved); its gate is the widget page.
