# O1h slice C (Asia) — independent verification report

Agent: slice-c verification agent. Date: 2026-11-10. Inputs per SHARED-BRIEF.md only.
Grid: 21 methods (20 in methods.json + ISNA-2010 18/18) x 15 dispatched targets, 2026, fajr and isha,
second-resolution computation with explicit per-side rounding, wall-clock minute comparison in the
country tz. 13 scoreable targets x 21 methods x 365 days; 2 targets skipped (see Skips).
Outputs: `results.json` (every cell: meanAbs, worstAbs, within2Pct, meanSigned, nDays, skips with
reasons; per-zone MY cells under `targets_meta`), `grid.mjs` (the harness), `parts/` (one file per
target with daily deviations), `checks.mjs` (38 assertions, all PASS).

## Headline: slice mean |deviation| minutes (unweighted over the 13 scoreable targets)

| method | fajr | isha | combined | | method | fajr | isha | combined |
|---|---|---|---|---|---|---|---|---|
| moonsighting | 4.99 | 6.54 | **11.53** | | diyanet-europe | 7.45 | 9.87 | 17.32 |
| karachi | 7.45 | 6.49 | 13.94 | | egyptian | 10.19 | 7.22 | 17.41 |
| isna-2010 (18/18) | 7.45 | 6.49 | 13.94 | | fazilet-a | 11.08 | 6.76 | 17.84 |
| dubai | 7.60 | 6.70 | 14.30 | | singapore-muis | 11.55 | 6.49 | 18.04 |
| kuwait | 7.42 | 7.22 | 14.63 | | mabims | 11.97 | 6.49 | 18.46 |
| mwl | 7.45 | 8.09 | 15.54 | | kemenag (=mabims) | 11.97 | 6.49 | 18.46 |
| diyanet-domestic | 7.45 | 8.09 | 15.54 | | qatar | 7.45 | 12.21 | 19.67 |
| ecfr (pair-only) | 7.45 | 8.09 | 15.54 | | umm-al-qura | 7.90 | 15.02 | 22.91 |
| jakim | 8.47 | 7.28 | 15.76 | | fazilet-b | 16.06 | 8.22 | 24.28 |
| | | | | | russia-sam | 12.23 | 12.86 | 25.09 |
| | | | | | tehran | 7.89 | 17.37 | 25.27 |
| | | | | | isna (15/15) | 15.23 | 12.86 | 28.09 |

Moonsighting wins the slice: its season curve keeps both twilight rows inside ~5-7 min across
everything from 51N to 1N. The 18/18 family (karachi, isna-2010) and Dubai 18.2/18.2 follow. The
15/15 ISNA label is the worst worldwide export in this slice: it wins Kazakhstan and Uzbekistan but
loses everywhere else by 13-23 minutes.

## Indonesia (ID-KEMENAG, Jakarta) — the owner's priority row, every method

Target recipe as carried: Subuh 20 / Isya 18 (world-table "central"), margins 0, rounding nearest
(candidate grade, published parameters, MABIMS family; the policy layer has no ID object).

| method | fajr meanAbs | isha meanAbs | worst F/I | within2 % F/I | signed F/I |
|---|---|---|---|---|---|
| mabims | **0.000** | **0.000** | 0/0 | 100/100 | +0.00/+0.00 |
| kemenag | **0.000** | **0.000** | 0/0 | 100/100 | +0.00/+0.00 |
| singapore-muis | 0.455 | 0.433 | 1/1 | 100/100 | +0.46/+0.43 |
| fazilet-a | 0.868 | 0.841 | 1/1 | 100/100 | +0.87/-0.84 |
| dubai | 7.622 | 0.858 | 9/1 | 0/100 | +7.62/+0.86 |
| moonsighting | 8.422 | 0.088 | 10/1 | 0/100 | +8.42/-0.09 |
| karachi | 8.422 | 0.000 | 10/0 | 0/100 | +8.42/+0.00 |
| isna-2010 | 8.422 | 0.000 | 10/0 | 0/100 | +8.42/+0.00 |
| kuwait | 7.962 | 2.099 | 9/3 | 0/90 | +7.96/-2.10 |
| egyptian | 2.085 | 2.099 | 3/3 | 92/90 | +2.08/-2.10 |
| fazilet-b | 3.392 | 2.981 | 4/4 | 0/6 | -3.39/+2.98 |
| jakim | 10.942 | 2.433 | 12/3 | 0/57 | +10.94/+2.43 |
| mwl | 8.422 | 4.227 | 10/5 | 0/0 | +8.42/-4.23 |
| diyanet-domestic | 8.422 | 4.227 | 10/5 | 0/0 | +8.42/-4.23 |
| ecfr | 8.422 | 4.227 | 10/5 | 0/0 | +8.42/-4.23 |
| diyanet-europe | 8.422 | 8.477 | 10/10 | 0/0 | +8.42/-8.48 |
| tehran | 9.748 | 16.899 | 11/19 | 0/0 | +9.75/-16.90 |
| isna | 21.121 | 12.688 | 23/14 | 0/0 | +21.12/-12.69 |
| russia-sam | 16.918 | 12.688 | 19/14 | 0/0 | +16.92/-12.69 |
| qatar | 8.422 | 17.742 | 10/21 | 0/0 | +8.42/+17.74 |
| umm-al-qura | 6.852 | 20.699 | 8/52 | 0/0 | +6.85/+20.70 |

Reading: at Jakarta the naked 20/18 pair IS the target, so mabims and kemenag score exact by
construction — the census's Indonesia object is still candidate-grade with null margins/rounding,
not the fitted Kemenag practice (+3/-3/+4/+3/+3/+3 with per-field rounding, methods.json kemenag
row). If that fitted form becomes the target, every 18-fajr method gains ~+3 min systematic error
and mabims/kemenag move from 0.000 to roughly 2.5-3; the family ranking above it does not change.
Physics notes: 1 degree of twilight ≈ 4.2 minutes at 6.2S, which is why the 18-vs-20 fajr gap is a
uniform +8.42 across every 18-degree method; qatar and umm-al-qura isha carry the fixed-interval
penalty (+17.7/+20.7 mean, UAC worst 52 in-branch); the moon-ruled isha (moonsighting) lands within
1 minute of Indonesia's 18-degree isha without using an angle at all.

## Per-target winners (combined meanAbs)

| target | 1st | 2nd | 3rd |
|---|---|---|---|
| KZ-MUFTIYAT | isna 18.2 | moonsighting 27.5 | russia-sam 30.2 |
| KG-MUFTIYAT | diyanet-europe 1.3 | mwl 6.5 | diyanet-domestic 6.5 |
| UZ-ISLOM | isna 6.2 | russia-sam 6.2 | diyanet-europe 19.1 |
| BD-IFB | jakim 0.8 | dubai 4.2 | karachi 4.2 |
| LK-ACJU | singapore-muis 1.0 | fazilet-a 1.9 | mabims 1.9 |
| MV-MUIS | dubai 5.8 | jakim 7.4 | karachi 7.4 |
| TH-CICOT | singapore-muis 0.4 | fazilet-a 1.3 | mabims 1.3 |
| SG-MUIS | singapore-muis 2.0 | mabims 3.0 | kemenag 3.0 |
| HK-MASJIDAL | dubai 6.0 | karachi 7.5 | isna-2010 7.5 |
| ID-KEMENAG | mabims 0.0 | kemenag 0.0 | singapore-muis 0.9 |
| PK-DEFACTO | karachi 0.0 | isna-2010 0.0 | dubai 1.9 |
| IN-DEFACTO | karachi 0.0 | isna-2010 0.0 | dubai 2.0 |
| MY-JAKIM (3-zone pooled) | jakim 1.4 | karachi 4.7 | isna-2010 4.7 |

The MABIMS-sphere targets (LK, TH, SG) and the de-facto Karachi targets (PK, IN) are won by the
methods they already run — identity by construction, same caveat as Indonesia. The informative
columns are BD (jakim 0.8 — the +2 ihtiyati + ceil lands on IFB's band quantisation), MV (nothing
under 5.8: the +5/+4 safety margins are the gap), HK (dubai 6.0 on fajr, isha interval +83 vs +90
costs qatar/uac), KG (diyanet-europe's 16-degree isha tracks the twilight-ratio rule to 0.8 min),
and KZ below.

## Kazakhstan: naked methods vs the twilight-angle clamp

The DUMK target runs 15/15 with the TwilightAngle clamp (portion angle/60 = 0.25 of night,
adhan-js implements it natively) and margin set B. Every method carrying >= 17-degree angles has no
valid 18-degree instant at 51.16N from mid-May to end of July; the library's middle-of-the-night
default then substitutes 0.5 x night, roughly twice the target's clamp distance. Consequences:
fajr meanAbs 37-61 min for the whole >= 18-degree family (worst 133, fazilet-b); isha meanAbs
21-45 with June worsts 114-123. Only the 15-degree-class methods (isna 9.1/9.1, russia-sam
21.1/9.1, tehran fajr 36.9) and moonsighting's curve (fajr 4.5, best single fajr in the slice) stay
near the target. KZ is the strongest single argument in the census for region-fitted clamps over
any naked worldwide preset.

## Skips (with reasons, carried in results.json)

- **TJ-SHURO** — window-class source (Shuroi Ulamo monthly table publishes windows, not instants;
  isha crosses midnight), additionally unfitted: null angles, null coordinates, null asr. Dispatch
  says skip if unfittable; skipped whole-country, all 21 cells.
- **PH-NCMF** — no parameters published (NCMF Ramadhan calendar = 29 per-city JPEGs, Ramadan-only);
  null angles, null coordinates. Skipped whole-country, all 21 cells.

## Interpretation rulings (all carried in results.json META.interpretations)

1. Presets verbatim (MWL, NorthAmerica, UmmAlQura, Egyptian, Karachi, MoonsightingCommittee,
   Turkey, Kuwait, Qatar, Singapore, Dubai) with rounding applied manually at second resolution
   (params.rounding=None) so all 21 methods round through one code path.
2. Umm al-Qura = methods.json body form: +1 margins, floor(raw+1), isha interval 90/120 with the
   brief's Ramadan window 2026-02-18..2026-03-19 = 30 days.
3. Singapore runs the preset angles with ceiling and NO +1 margins (those are the census's
   Singapore target-side measurements; constraint 1).
4. Constructed Other methods from the brief's pair list only, nearest, zero margins,
   library-default high-latitude: mabims 20/18, kemenag = mabims, diyanet-europe 18/16, ecfr 18/17,
   russia-sam 16/15, fazilet-a 19.8/17.8, fazilet-b 20.8/18.7, isna-2010 18/18. ECFR's resolution
   carries +-2 minute margins; the brief constructs from the pair, so they are NOT applied — with
   them, every ECFR cell shifts ~2 min and ECFR separates from the mwl/diyanet-domestic tie.
5. Tehran (in neither brief list) = methods.json pair 17.7/14 via Other, nearest.
6. JAKIM (in neither brief list) = methods.json body form: 18/18 with its own +2 ihtiyati and
   ceiling — the ihtiyati is JAKIM stock practice, same principle as the Diyanet temkin.
7. Kuwait body rounding per methods.json notes: fajr floor, isha nearest.
8. Targets: null rounding -> harness nearest (constraint 4); null margins -> 0; up = mathematical
   ceiling (exact-minute instants stay).
9. KZ target = policy-layer twilightAngleClamp 0.25/0.25 (== adhan TwilightAngle nightPortions)
   + margin set B at Astana 51.16N.
10. KG isha twilight ratio SIGN RULING: the world-table text "round(7/9 x (fajr - sunrise) + 3.5)"
    puts isha before maghrib all year taken literally, contradicting the recorded fit (MAE 0.487,
    Bishkek 359/365 within-1). The grid runs the only fit-consistent reading: isha =
    maghrib_disp + round(0.7778 x (sunrise_disp - fajr_disp) + 3.5), displayed values, ratio 0.7778
    exactly as carried, maghrib_disp = nearest(sunset + 7), fajr_disp = floor, sunrise_disp =
    nearest.
11. HK isha = nearest(sunset + 83) per the world-table special form (countries.json carries kind
    interval with no minute value).
12. MY-JAKIM has no single national point (zone table; the brief's null-coordinate fallback names
    only JAMIAT-KZN and EU-DIYANET-UNIFIED). Scored from the policy-layer zones that carry points:
    WLY01 (KL/Putrajaya), KTN01 (isha 17 per zone override), PLS01; the country cell pools the
    1095 daily deviations; per-zone cells are in results.json targets_meta. SGR01 and the unnamed
    fifth swept zone carry no point and are excluded.
13. UZ display margins (+5 / Ishroq +20 / Shom +4) are not documented for fajr/isha; the object's
    0/0 runs. LK storey-band corrections are likewise not carried by the object.
14. Midnight normalisation: signed deviations compare instants; a method isha pushed past midnight
    (library middle-of-the-night at KZ summer) contributes +-1440 via wall date, never reads as
    -23 h. Target-side instants are asserted same-day.

## Bugs found and fixed during the build

- adhan-js `CalculationMethod.Other()` takes no arguments; the first run silently computed every
  constructed method (and every target recipe) at 0/0 angles. Fixed by constructing
  `CalculationParameters` directly.
- Umm al-Qura's +1 was double-counted (library adjustment plus floor(m+1)). Fixed: the +1 travels
  in adjustments, the manual step is plain floor. Verified by the exact +30 Ramadan boundary step.
- Midnight crossing: raw minute-of-day comparison produced -23 h deviations for KZ summer isha.
  Fixed with day-ordinal normalisation; global worst |dev| is now 133 min (fazilet-b fajr at KZ).

## Verification (checks.mjs, 38 PASS)

Day counts (365 everywhere); identity cells zero (ID kemenag/mabims, PK/IN karachi and isna-2010);
SG singapore-muis exactly -1 daily; KZ isna identical Oct-Apr, all-June divergence, worst 76;
UAC +30.7/-30.1 Ramadan boundary steps and 30-day window; KG formula physical sanity; HK qatar
+7.0 vs the 83-minute interval; MY pooled == mean of per-zone means and the KTN01 17-degree
override moves the karachi cell (1.74 vs 2.48); skips present with reasons on all 42 skipped cells;
asr flags correct on all cells; global worst |dev| 133 min.

## Reproduce

```
cd $HOME/athan-gitree/census/o1h-global/verify/slice-c
ln -sfn $HOME/athan-gitree/census/adhan-build/node_modules node_modules
for T in KZ-MUFTIYAT:Asia/Almaty KG-MUFTIYAT:Asia/Bishkek UZ-ISLOM:Asia/Tashkent \
         BD-IFB:Asia/Dhaka LK-ACJU:Asia/Colombo MV-MUIS:Indian/Maldives \
         TH-CICOT:Asia/Bangkok SG-MUIS:Asia/Singapore HK-MASJIDAL:Asia/Hong_Kong \
         ID-KEMENAG:Asia/Jakarta PK-DEFACTO:Asia/Karachi IN-DEFACTO:Asia/Kolkata; do
  IFS=: read id tz <<<"$T"; TZ=$tz node grid.mjs compute $id
done
for Z in WLY01 KTN01 PLS01; do TZ=Asia/Kuala_Lumpur node grid.mjs compute MY-JAKIM $Z; done
node grid.mjs merge && node checks.mjs
```

adhan-js 4.4.6, node v24.14.1. Every number in results.json regenerates from grid.mjs.
