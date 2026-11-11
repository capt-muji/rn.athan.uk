# O1l-16r balkan-cities: Bosnia 61 cities, Serbia/Montenegro/Croatia/Macedonia/Albania/Kosovo

Agent O1l-16r. Predecessor banked 76 data files and 129 captures, then died on a provider failure
before writing any report. Nothing was re-captured that existed. This report reads the banked
archive, re-runs the fits on it, and adds six vaktija.eu city pages, three Croatian pages already
in `captures/`, one Kosovo watch probe, and one Macedonian accrual row.

Engine: adhan 4.4.6 (`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`), `Rounding.None`,
second resolution then explicit per-column rounding. Time zones pinned per country
(Europe/Sarajevo, Europe/Belgrade, Europe/Podgorica, Europe/Zagreb, Europe/Skopje, Europe/Tirane).
No clock read: every date is built from the literal capture string.

## Inventory carried in

| group | files | shape |
|---|---|---|
| Bosnia (api.vaktija.ba) | 61 city-years | `{YYYY-MM-DD:{fajr,sunrise,dhuhr,asr,maghrib,isha}}`, 365 rows each, 2026 |
| Bosnia support | `ba_coords.json`, `ba_elev.json`, `ba_residuals.*`, `ba_fit_ess.json`, `ba_lat_solve.json`, `ba_daylen.json` | coordinates, SRTM elevation + terrain rings, fitted margins |
| Montenegro (vaktijame.me) | 6 PDFs -> 6 JSON | 365 rows each, 2026 |
| Serbia (mesihat.org) | Novi Pazar 2025 + offset table | 365 rows, 10 offset rows |
| Croatia (vaktija.eu) | Zagreb, Split, Rijeka | 30 rows each, Nov 2026 |
| Macedonia (bfi.mk) | home widget | 1 day, 5 columns |
| Albania (kmsh.gov.al) | home page | times render client-side as `--:--` |

The 61 Bosnian files are all distinct (no duplicate hashes), so each is its own table, not a
regional file copied around.

## BOSNIA: 61 cities, 22,265 days, 133,590 cells

Source `https://api.vaktija.ba/vaktija/v1/{id}/{year}`, ids 0-106 (BiH) plus 107-117 (the Sandžak
block: Bijelo Polje, Gusinje, Nova Varoš, Novi Pazar, Plav, Pljevlja, Priboj, Prijepolje, Rožaje,
Sjenica, Tutin). Tier: **authority by mirror** - the W11 block recorded the printed Takvim 2026
byte-identical to this API (0 diffs on 365 days), so the API is the official Rijaset table, not a
recomputation. Coordinates from `api.vaktija.eu/v4/locations` (name match, country-checked);
elevation and terrain rings from opentopodata SRTM90m.

### The recipe

One recipe serves the country, with per-column minute temkin:

| column | rule | margin | mode | cities sharing |
|---|---|---|---|---|
| fajr | 18 deg | +k (per city) | round | - |
| sunrise | 18 deg solar | -5.5 | floor | 57 / 61 |
| dhuhr | transit | +0.5 | round | 58 / 61 |
| asr | Shafi (shadow 1) | 0 or +0.5 | round | 29 / 18 |
| maghrib | solar | +5.5 | round | 48 / 61 (+6.5 in 10) |
| isha | 16 deg | -k (per city) | floor | - |

The only per-city freedom is **one scalar k**: fajr +k and isha -k together, k in
{-1.5, -0.5, 0, +0.5, +1.5, +2.5}. 23 distinct margin vectors over 61 cities, and in every one
fajr = -isha. That scalar is the whole city-level difference in the twilight columns.

Scores at that object, all 61 cities, 365 days, six columns:

- exact 47,016 / 133,590 = **35.2%**
- within 1 minute 95,540 / 133,590 = **71.5%**
- per-city residual sd, median across 61 cities: dhuhr 0.46 (tightest, 0.36-0.51), maghrib 1.00,
  sunrise 1.20, asr 1.39, isha 1.40, fajr 1.48. The worst cities reach sd 5-7 min in the twilight
  columns - Bileća, Ljubinje, Čapljina, Čitluk, Nevesinje, Trebinje, Gusinje, Plav - which are
  exactly the cities furthest from Sarajevo's latitude.

Per-city verdicts and margins: `data/ba_city_table.md` (61 rows, elevation and east horizon
beside each).

### Structural finding: one Sarajevo-anchored generation, redistributed by longitude

Published(city) minus published(Sarajevo) is a **constant minute offset per column** for the whole
year in 21 of 60 cities (max deviation <= 1 min), and the median city deviates by only 2.0 min.
That offset equals **4 minutes per degree of longitude difference from Sarajevo to within 0.31 min
mean (max 1.68)**. Examples: Bihać -2.54 deg -> +10.16 predicted, +9.9 observed; Banja Luka
-1.22 deg -> +4.88 predicted, +4.7 observed; Mostar -0.60 deg -> +2.41 predicted, +2.4 observed;
Bijeljina +0.80 deg -> -3.19 predicted, -3.4 observed.

So the country is **one computed generation** at Sarajevo's geometry, republished per city with an
editorial minute offset that is the longitude correction. Seven tables are *exact* constant shifts
of the Sarajevo table (sd 0.00 all year, all six columns): Hlivno, Prozor, Pljevlja, Bijelo Polje,
Gusinje, Plav, Rožaje. The rest carry a partial latitude term: the published day-length spread
across 61 cities is 11 min in June against a true solar spread of 21 min, and the published day
length tracks the true one at slope 0.32-0.38 (r2 0.30-0.40). The tables carry roughly a third of
the latitude difference and all of the longitude difference.

Consequence for grading: 61 city-years are **not** 61 independent tests. Byte-different tables
built from one generation never lift a provisional object to A (frozen-generation precedent
T-668 #6986). Bosnia stays **provisional, one published cycle (2026)**.

### The elevation-ladder verdict: REFUTED

The Sarajevo rung holds *at Sarajevo only*. At 611 m the geometric dip is 0.79 deg, worth 4-6 min
at sunrise, and Sarajevo's measured sunrise residual runs -5.2 min (Dec) to -7.3 min (Jun) - the
dip plus a ~1.3 min temkin. That reproduces Sarajevo to ~0.3 min.

It does not transfer:

- the fitted sunrise margin is **-5.5 min for 57 of 61 cities**, from Orašje at 82 m to Rožaje at
  1,050 m. A per-city elevation dip would range 1.5-7 min over that span.
- corr(mean sunrise residual, elevation) = **+0.21**; corr(mean sunrise residual, SRTM east
  horizon) = **+0.02**; corr(mean maghrib residual, west horizon) = **+0.20**. Elevation and
  terrain explain 0-4% of the variance.
- an effective-sunrise-depression solve per city returns 1.64-1.96 deg (mean ~1.8) with
  corr(angle, elevation) = **-0.04**. One shared horizon convention, no ladder.
- a shared horizon angle fitted across all 61 cities does not beat the fixed-minute temkin:
  best A = 1.5 deg gives 71.6% within-1 against 71.5% for the plain -5.5 min temkin, i.e. no gain.
- a discrete latitude-rung search (43.40-45.00 in 0.05 steps, 61 cities) lands on 23 different
  rungs with scatter 0.97 mean / 1.50 max - no rung set exists.

**Answer: no. One recipe reproduces 71.5% of cells within a minute, and the per-city term is a
single twilight scalar plus a longitude offset, not elevation. The remaining 28.5% is the latitude
the tables do not carry, and no elevation term reaches it.**

### Span ceiling and forward longevity

2026 only: 61 cities x 365 days. `api.vaktija.ba` accepts a year parameter and serves 2027, but the
2027-01 echo is byte-identical to 2026-01-01 (recorded in W11), so it is a frozen reprint, not a
second year. Verdict: **stable across one published cycle, no second year held, forward longevity
unproven.**

## SERBIA: Devridaim base + the 3-group offset design

Source `https://mesihat.org/devridaim-2/`, class community (Mešihat IZ u Srbiji), Devridaim 2025 /
1446 AH. 365 dated rows for Novi Pazar banked; the page carries no per-city tables, only the
offset table titled "Vremenske razlike u odnosu na Novi Pazar".

The offset design is **three groups**, confirmed from the printed table (10 rows):

| group | zora+sunrise | podne | ikindija+aksam+jacija |
|---|---|---|---|
| Beograd | +2 | 0 | -2 |
| Novi Sad | 0 | +2 | -1 |
| Subotica | +10 | +3 | -3 |
| Preševo | -1 | -5 | -7 |
| Niš | -5 | -6 | -5 |
| Tutin, Sjenica, Berane, Plav, Gusinje | +2 | +2 | +3 |
| Rožaje | +1 | +1 | +2 |
| Priboj, Prijepolje, Bijelo Polje | +4 | +4 | +5 |
| Nova Varoš | +3 | +3 | +4 |
| Podgorica, Bar, Ulcinj, Pljevlja | +5 | +5 | +6 |

So Belgrade, Niš, Sjenica and Tutin are covered by the design rather than by their own published
tables: **honest negative** - the Mešihat publishes one base year plus offsets, no per-city rows.
Sjenica and Tutin sit in one group, and the Bosnian mirror agrees: in the vaktija.ba Sandžak block
their six offsets against Sarajevo are identical to the minute.

Novi Pazar base fit, 365 rows, 2,190 cells, best joint angle search:

- fajr **19.6 deg** +8.5 round, sunrise -5.5 floor, dhuhr +0.5 round, asr Shafi +0.5 round,
  maghrib +5.5 round, isha **17.8 deg** -9.5 floor
- exact 516 / 2,190 = 23.6%; within 1 = 1,017 / 2,190 = **46.4%**
- The night edges carry a ~9 min inward temkin (fajr +8.5, isha -9.5) - the Ottoman temkin
  magnitude, four times Bosnia's ±1.5.

Grade: **candidate**, one edition, fit below the within-1 bar on half the cells. The 9-min temkin
is the likely reason the free fit cannot do better: it is a fixed minute rule on a seasonal curve.

Second surface, `https://vaktija.eu/beograd` and `/nis`, November 2026, 30 rows each, 18/16 Shafi:
Belgrade **180/180 within 1** (fajr -2.5, sunrise -5.5, dhuhr +0.5, asr 0, maghrib +5.5, isha +3.5);
Niš **176/180**. Belgrade is the cleanest Balkan surface measured this session.

## MONTENEGRO: the six city-groups are one table plus six minute offsets

Source `vaktija.me` yearly PDF generator, six files, 365 rows each, 2026.

**Proven:** the six PDFs are one table and five integer shifts. Every cell of every day:
grp-5 = grp0 + 5, grp-3 = +3, grp-1 = +1, grp2 = -2, grp4 = -4, on all six columns. The "6
city-groups" are a display ladder, not six computations. One published generation.

Base (grp0) fitted at the Podgorica anchor (42.4304, 19.2594) on the IZCG stated method
19.5/17.5 Shafi:

- fajr -0.5 floor (mae 4.63, sd 6.82), sunrise -7.5 floor (3.81/5.98), dhuhr -0.5 floor
  (0.67/4.47), asr -1.5 floor (2.83/5.30), maghrib +4.5 round (3.46/5.64), isha -0.5 floor
  (4.11/6.22)
- exact 376 / 2,190 = 17.2%; within 1 = 773 / 2,190 = **35.3%**

The stated method does **not** reproduce the table. The monthly residuals show why: the published
summer day is up to 14 min longer than the sun's and the summer twilight up to 11 min longer
(fajr -11.5 in June, +3.5 in January), while dhuhr stays flat at -0.7. The table's solar columns
are amplified in summer on a curve no fixed horizon depression reproduces (a 1.8 deg horizon would
give 16 min in June and 9 in December; the table gives 11.5 and 1.7). The 19.5/17.5 statement is
recorded as stated, not as verified.

Second surface, `https://vaktija.eu/podgorica`, November 2026, 30 rows, 18/16 Shafi:
**170/180 within 1** (fajr -4.5, sunrise -2.5, dhuhr 0, asr -3.5, maghrib +1.5, isha +3.5).
Note the disagreement: the IZCG PDF base and the vaktija.eu Podgorica table are different
generations of the same city, ~1-3 min apart in the evening.

## CROATIA: three cities, one month

`https://vaktija.eu/zagreb`, `/split`, `/rijeka`, November 2026, 30 rows each, 18/16 Shafi.
Wayback CDX for the same slugs returns only 3 Zagreb snapshots (2024-10, 2025-03, 2026-03) and
nothing for Split or Rijeka, so no second month exists on this route.

- Zagreb **172/180 within 1** - fajr -3.5 floor, sunrise -3.5 floor, dhuhr +1.5 round, asr 0 round,
  maghrib +4.5 round, isha -6.5 floor (worst column 24/30)
- Rijeka **170/180** - fajr -2.5, sunrise -2.5, dhuhr +1.5, asr -1.5, maghrib +2.5, isha -7.5
- Split **164/180** - isha -13.5 floor scores 17/30 and asr -10.5; Split's evening is not the
  Zagreb/Rijeka construction at its own coordinates

Grade: **candidate**, one month. The Zagreb temkin (sunrise -3.5, maghrib +4.5, dhuhr +1.5) is the
same publisher family as Bosnia's (-5.5/+5.5/+0.5), a smaller edition of it.

## MACEDONIA: bfi.mk accrual, five columns, one day

`https://bfi.mk/` home widget, Skopje, 2026-11-11: fajr 05:28, dhuhr 11:25, asr 13:56,
maghrib 16:25, isha 17:35. **No sunrise column**, one day. Saved as
`data/mk_bfi_2026-11-11.json`. Accrual surface only - not fittable.

Second surface, `https://vaktija.eu/skopje`, November 2026, 30 rows, 18/16 Shafi:
**164/180 within 1** (fajr 0, sunrise +0.5, dhuhr +0.5, asr -5.5, maghrib 0, isha +1.5).

**The two Macedonian surfaces disagree, and the disagreement is a finding.** On the same day,
2026-11-11, the national body's own widget against the vaktija.eu mirror:

| column | bfi.mk | vaktija.eu | delta |
|---|---|---|---|
| fajr | 05:28 | 04:43 | **+45 min** |
| dhuhr | 11:25 | 11:19 | +6 |
| asr | 13:56 | 13:48 | +8 |
| maghrib | 16:25 | 16:17 | +8 |
| isha | 17:35 | 17:45 | -10 |

The national body prints a fajr 45 minutes later and an isha 10 minutes earlier than the mirror -
the night is compressed by ~55 min, and the solar columns sit 6-8 min later. Whatever the bfi
widget computes, it is not 18/16 at Skopje. `ivz.mk` remains dead (W11).

## ALBANIA: Shkodra + Tirana, one month each

KMSH's own home page (`kmsh.gov.al`) renders every time as `--:--`: the values are fetched
client-side and no JSON endpoint is exposed in the HTML. Honest negative on the authority surface.

The community-mirror surface serves both cities: `https://vaktija.eu/shkodra` and `/tirana`,
November 2026, 30 rows each, 18/16 Shafi:

- Shkodra **162/180 within 1** - fajr -4.5, sunrise -1.5, dhuhr 0, asr -5.5, maghrib 0, isha +2.5
- Tirana **149/180** - isha 18/30 and maghrib 21/30 are the weak columns

Grade: **candidate**. Shkodra is the better-fitted Albanian surface; Tirana's evening needs a
second month before any recipe is claimed.

## KOSOVO: 2027 probe, not due

Watch from the operations calendar: the Kosovo 2027 edition lands late December (last year's
landed 14 January). Probed anyway at **2026-11-11T04:19:33Z**.

- `https://dituriaislame.com/takvimi/` -> HTTP 200, 72,409 bytes, saved as
  `captures/xk_takvimi_probe_2027.html`
- The page lists "Vaktija e Ramazanit 2026" and 2025; the string `2027` occurs **0 times**, and
  no Hijri year token (1446-1449) appears.
- Verdict: **not due until late December 2026, probed anyway at 2026-11-11T04:19:33Z: no 2027
  edition published.**

## Honest negatives

- Serbia: no per-city Devridaim tables exist on mesihat.org; Belgrade, Niš, Sjenica and Tutin are
  reachable only through the offset table. Searched `bs`, `sr` ("vaktija", "namasko vrijeme",
  "devridaim", "takvim", "vremenske razlike").
- Montenegro: the 19.5/17.5 statement does not reproduce the IZCG PDF base; the PDF's solar columns
  are amplified in summer by a curve not identified this session.
- Croatia: no second month on vaktija.eu or Wayback for Split/Rijeka.
- Macedonia: no national year table at bfi.mk (today-only widget), ivz.mk dead.
- Albania: KMSH's own times are client-rendered; no public JSON found.
- Bosnia: the printed Takvim 2026 was not re-captured this session (the W11 comparison stands as
  recorded).

Searched in `bs`, `sr`, `hr`, `sq`, `mk` as well as English. No page was logged into, no form
submitted, no captcha touched.

## Files written this session

- `data/ba_city_table.md` - 61 per-city verdicts with elevation and east horizon
- `data/ba_point_solve.json`, `data/ba_ladder.json`, `data/ba_daylen.json`,
  `data/ba_sunrise_angle.json`, `data/ba_fit_final.json` - the elevation-ladder evidence
- `data/hr_vaktijaeu_2026.json`, `data/eu_vaktijaeu_2026.json` - Croatia and the six new cities
- `data/hr_fit.json`, `data/eu_fit.json`, `data/me_grp0_fit.json`, `data/rs_novipazar_fit.json`
- `data/mk_bfi_2026-11-11.json`
- `captures/eu_vaktijaeu_{shkodra,tirana,skopje,beograd,nis,podgorica}_2026-11-11.html`
- `captures/xk_takvimi_probe_2027.html`
- scripts: `diag1.mjs`, `daylen.mjs`, `daylen2.mjs`, `ladder.mjs`, `klat.mjs`, `solve_ba_point.mjs`,
  `sunrise_angle.mjs`, `fit_ba_final.mjs`, `fit_me_rs.mjs`, `diag_me.mjs`, `fit_hr.mjs`,
  `fit_eu.mjs`, `parse_hr.py`, `parse_eu.py`
