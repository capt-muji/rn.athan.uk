# O1h slice A: MENA (17 targets) x 21 methods, 2026

Independent recompute per SHARED-BRIEF.md. Script: `grid.mjs` (one invocation per country under that country's own TZ; merge step). Raw cells: `results.json` (693 scored cells = 17 x 21 x 2 minus 21 IR isha skips). Metrics per cell: mean |deviation|, worst |deviation|, percent of days within 2 minutes, over 365 days of 2026.

## Decisions the other slice will want when diffing

- Comparison clock is the target authority print clock: fixed UTC+3 for JERUSALEM-AWQAF and fixed UTC+1 for MA-HABOUS, IANA civil elsewhere; both target and method times are read on that same clock.
- Method rounding is nearest minute everywhere except singapore-muis, whose preset carries Rounding.Up verbatim; no census-fitted method rounding or margins are applied (constraint 1), so umm-al-qura/kuwait/qatar/dubai/jakim/kemenag naked forms round nearest.
- ECFR is scored as the bare 18/17 pair: the brief construction spec for non-preset bodies carries pairs only, so the MWL-Fiqh-Academy +/-2 body margins are not applied.
- JAKIM naked = 18/18 (its fitted fajr), Kemenag = 20/18 = MABIMS pair, per the brief; their census margins/roundings are target-side property and never ride the method.
- SA-KACST isha interval is keyed to the PRINTED maghrib (floor(raw+1)), because the census measured isha-minus-maghrib exact on every Ramadan day with zero violations; plain floor(raw+interval+1) would violate it.
- QA-MOI isha = printed maghrib (nearest(raw+1)) + 90, per ishaRule kind intervalAfterRounding; SD-MINISTRY isha = nearest(raw sunset + 90), its 90-minute interval is carried in the policy layer.
- IR-NATIONAL isha skipped: notPublished. Its fajr rounding is silent, so harness nearest applies.
- CY-KKTC emulation records a 3-term seasonal harmonic (amplitudes only, no phases) and a per-edition constant; no values exist to implement them, so the fitted base recipe (17.5/-1, 17.3/0, nearest) is scored and the refinement is recorded, not invented.
- TR-DIYANET-DOMESTIC highLatitude kind frozenLatitude45 never binds at 41.008N (policy provenance), so domestic Istanbul is the plain 18/17+temkin recipe; temkin never touches fajr/isha.
- Ramadan window 2026-02-18..2026-03-19 (30 days) drives both the umm-al-qura method switch and the SA-KACST target switch.

## Per-method slice means (minutes, unweighted mean of country means)

| method | params | fajr | isha | (fajr+isha)/2 | worst fajr country | worst isha country |
|---|---|---|---|---|---|---|
| karachi | preset Karachi | 1.74 | 4.86 | 3.30 | EG-ESA 7.67 | SD-MINISTRY 15.07 |
| jakim | Other 18/18 (fitted fajr 18; census margins/rounding withheld per constraint 1) | 1.74 | 4.86 | 3.30 | EG-ESA 7.67 | SD-MINISTRY 15.07 |
| isna-2010 | Other 18/18 (ISNA pre-2015 18/18 as told to ICOP 2010) | 1.74 | 4.86 | 3.30 | EG-ESA 7.67 | SD-MINISTRY 15.07 |
| kuwait | preset Kuwait | 1.74 | 5.08 | 3.41 | EG-ESA 7.67 | SD-MINISTRY 17.28 |
| dubai | preset Dubai (library adjustments verbatim) | 1.89 | 5.22 | 3.55 | EG-ESA 6.67 | SD-MINISTRY 14.21 |
| mwl | preset MuslimWorldLeague | 1.74 | 6.22 | 3.98 | EG-ESA 7.67 | SA-KACST 19.50 |
| diyanet-domestic | preset Turkey (temkin rides in the preset) | 1.74 | 6.22 | 3.98 | EG-ESA 7.67 | SA-KACST 19.50 |
| ecfr | Other 18/17 (body pair only; the +/-2 body margins are not in the brief construction spec) | 1.74 | 6.22 | 3.98 | EG-ESA 7.67 | SA-KACST 19.50 |
| qatar | preset Qatar (isha = raw sunset + 90, no Ramadan switch) | 1.74 | 7.27 | 4.51 | EG-ESA 7.67 | YE-AWQAF-SANAA 23.92 |
| egyptian | preset Egyptian | 6.64 | 5.08 | 5.86 | CY-KKTC 10.21 | SD-MINISTRY 17.28 |
| umm-al-qura | preset UmmAlQura; isha interval 90, 120 inside the brief Ramadan window | 2.73 | 9.42 | 6.08 | EG-ESA 5.10 | YE-AWQAF-SANAA 26.39 |
| diyanet-europe | Other 18/16 | 1.74 | 10.77 | 6.25 | EG-ESA 7.67 | SA-KACST 24.10 |
| moonsighting | preset MoonsightingCommittee (season curves + shafaq general, library verbatim) | 2.13 | 10.66 | 6.40 | EG-ESA 7.67 | SA-KACST 17.94 |
| fazilet-a | Other 19.8/17.8 effective | 8.22 | 4.94 | 6.58 | CY-KKTC 11.89 | SD-MINISTRY 15.95 |
| singapore-muis | preset Singapore; Rounding.Up verbatim (only preset that changes rounding) | 8.78 | 4.91 | 6.84 | TR-DIYANET-DOMESTIC 12.61 | SD-MINISTRY 14.58 |
| mabims | Other 20/18 | 9.27 | 4.86 | 7.06 | TR-DIYANET-DOMESTIC 13.13 | SD-MINISTRY 15.07 |
| kemenag | Other 20/18 (= MABIMS per brief) | 9.27 | 4.86 | 7.06 | TR-DIYANET-DOMESTIC 13.13 | SD-MINISTRY 15.07 |
| fazilet-b | Other 20.8/18.7 effective | 13.47 | 6.91 | 10.19 | TR-DIYANET-DOMESTIC 18.54 | SD-MINISTRY 12.01 |
| tehran | preset Tehran 17.7/14, maghrib 4.5 | 2.72 | 20.89 | 11.80 | EG-ESA 9.22 | SA-KACST 33.25 |
| russia-sam | Other 16/15 | 11.43 | 15.84 | 13.64 | EG-ESA 17.82 | SA-KACST 28.68 |
| isna | preset NorthAmerica | 16.53 | 15.84 | 16.18 | MA-HABOUS 23.15 | SA-KACST 28.68 |

Identical numbers are genuine ties: every method carrying an 18-degree angle shares one fajr column, every 17-degree isha shares one isha column, because the naked method differs only by the pair. All 21 methods are Shafi at asr, matching every slice target except IR-NATIONAL (school not on the record; flag no-data).

## Closest and worst for MENA

Closest methods: karachi (3.30), jakim (3.30), isna-2010 (3.30) - the 18-degree family dominates its home region. Worst: isna (16.18), russia-sam (13.64), tehran (11.80).

The same 18/18 pair scores twice under two labels: `karachi` and `isna-2010` are numerically identical on every cell, while the software-label `isna` (15/15, the exported pair since the 2017 FCNA decision) is the single worst method across the slice. The Teheran 14-degree isha default, which Iran itself never publishes, is the worst single column in the grid.

## Per-country spread

| target | best method (mean both) | worst method |
|---|---|---|
| TR-DIYANET-DOMESTIC | mwl 0.00 | isna 15.65 |
| CY-KKTC | kuwait 1.45 | isna 13.70 |
| JERUSALEM-AWQAF | karachi 0.00 | isna 15.58 |
| JO-AWQAF | karachi 0.53 | isna 16.15 |
| QA-MOI | qatar 1.00 | isna 18.90 |
| SA-KACST | umm-al-qura 0.52 | isna 22.11 |
| AE-AWQAF | dubai 0.50 | isna 14.77 |
| OM-MARA | karachi 0.49 | isna 14.06 |
| YE-AWQAF-SANAA | diyanet-europe 0.00 | umm-al-qura 14.29 |
| IQ-DIWAN | mwl 0.26 | isna 13.54 |
| IR-NATIONAL | tehran 0.05 | fazilet-b 17.61 |
| EG-ESA | egyptian 0.00 | isna 17.77 |
| LY-MUAZZIN | dubai 0.58 | isna 17.52 |
| TN-INM | karachi 0.48 | isna 17.55 |
| MA-HABOUS | egyptian 1.98 | isna 16.93 |
| KW-AJIRI | kuwait 0.26 | isna 14.06 |
| SD-MINISTRY | qatar 1.91 | isna 22.63 |

## Home-ground cells (method vs its own authority's fitted recipe)

| cell | fajr mean/worst | isha mean/worst |
|---|---|---|
| diyanet-domestic x TR-DIYANET-DOMESTIC | 0.00 / 0 | 0.00 / 0 |
| egyptian x EG-ESA | 0.00 / 0 | 0.00 / 0 |
| dubai x AE-AWQAF | 0.00 / 0 | 1.00 / 1 |
| qatar x QA-MOI | 1.00 / 1 | 1.00 / 1 |
| kuwait x KW-AJIRI | 0.52 / 1 | 0.00 / 0 |
| umm-al-qura x SA-KACST | 0.53 / 1 | 0.50 / 1 |

These six cells are the harness validation: the naked Diyanet preset reproduces the fitted Turkish recipe minute-exact on all 730 cells, the Egyptian preset is exact on both prayers, Dubai misses only by its own -1 isha margin, Qatar and Kuwait sit inside the margin-then-round boundary, and Umm al-Qura stays within 1 minute of KACST all year including the Ramadan switch.

## Skips

- IR-NATIONAL isha: ishaRule.kind=notPublished: the authority prints no isha row (all 21 methods).

Ramadan window applied to both the umm-al-qura method and the SA-KACST target: 2026-02-18..2026-03-19 (30 days).

