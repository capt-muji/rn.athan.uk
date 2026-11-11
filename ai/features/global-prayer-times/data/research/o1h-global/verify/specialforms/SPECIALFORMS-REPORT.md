# O1h special forms: the four non-angle-form targets

Study: naked worldwide methods vs country authorities, 2026, fajr and isha, wall-clock minutes in each target's tz. Harness: adhan-js 4.4.6, Rounding.None at second resolution, explicit rounding per body; TZ=Europe/Ljubljana and Europe/Kyiv per invocation; no real clock reads. Metrics per target x method x prayer: mean |deviation|, worst |deviation|, percent of days within 2 minutes (|dev| <= 2). 365 days of 2026. Generated 2026-11-10.

## Implemented vs skipped

| Target | Status | One-line basis |
| --- | --- | --- |
| SI-VAKTIJA (Ljubljana) | implemented | seasonal cosine sweeps with fully documented formulas, margins 0/0, rounding nearest (policy-layer fajrRule/ishaRule sweep.formula; world-table Slovenia row) |
| UA-DUMU (Kyiv) | implemented | fixed intervals with dated ramps: fajr sunrise-100 constant, isha maghrib+90/100 with recorded day-by-day ramps; solarBase -2.11 (policy-layer intervalTable + solarBase; world-table Ukraine row) |
| AT-IZW | skipped | seasonal sweeps documented only as verbal implied ranges (fajr "15.0-15.7 Oct-Apr, trough ~12.5 mid-May..early Aug"; isha "15.8-15.9 ... trough ~11.3-11.5 ... autumn plateau ~16.2-16.3") with no formula or per-day values in policy-layer; the per-day anchors (c16-fits/data/izw_final_quant.json) sit outside the brief's allowed input list, so no day-by-day value is recoverable without inventing one. |
| FR-GMS | skipped | conventions-only object by its own verdict ("no frozen object buildable", recipeStatus partial): fajr/isha sweeps carried as endpoint ranges only (18 -> 12 deg, 16 -> 11.5 deg) with no formula, no per-day values, and null fajr/isha margins - daily values are not recoverable from the record. |

## SI-VAKTIJA (Ljubljana)

Encoded from the record:
- policy-layer.v2.4.json SI-VAKTIJA: fajrRule.sweep.formula "fajr_deg = 18.91 + 0.25*cos(doy - 94)"
- policy-layer.v2.4.json SI-VAKTIJA: ishaRule.sweep.formula "isha_deg = 16.62 + 1.32*cos(doy - 346)"
- policy-layer.v2.4.json SI-VAKTIJA: sweep "effective" strings pin cos to degrees (max doy 94 / min doy 274; 15.3 June / 17.9 December)
- policy-layer.v2.4.json SI-VAKTIJA: margins.fajr 0, margins.isha 0
- policy-layer.v2.4.json SI-VAKTIJA: rounding "nearest" (all six columns)
- policy-layer.v2.4.json SI-VAKTIJA: highLatitude.kind "none"
- policy-layer.v2.4.json SI-VAKTIJA: timezone iana Europe/Ljubljana, dstMode iana
- policy-layer.v2.4.json SI-VAKTIJA: solarBase -1.78/-1.77: sunrise/sunset columns only, not scored here
- policy-layer.v2.4.json SI-VAKTIJA: asr primary shafi
- world-table-v2.md Slovenia row (lines 238-248): "fajr 18.91+0.25cos(doy-94); isha 16.62+1.32cos(doy-346); margins sunrise -6, dhuhr +2, maghrib +6; Shafi; Clock: IANA"
- Assumption: the object publishes no coordinates (its own gaps list says so); scoring point is Ljubljana 46.0569, 14.5058. Both sides run at the same point, so the comparison is internally consistent; a 2 km coordinate choice moves a twilight instant well under a minute.

Spot samples (target side): {"2026-01-01":{"fajr":"05:50","isha":"18:15","fajrDeg":18.897,"ishaDeg":17.895},"2026-03-01":{"fajr":"04:55","isha":"19:22","fajrDeg":19.117,"ishaDeg":16.984},"2026-04-04":{"fajr":"04:44","isha":"21:08","fajrDeg":19.16,"ishaDeg":16.212},"2026-05-22":{"fajr":"02:48","isha":"22:30","fajrDeg":19.077,"ishaDeg":15.414},"2026-05-31":{"fajr":"02:30","isha":"22:44","fajrDeg":19.046,"ishaDeg":15.345},"2026-06-15":{"fajr":"02:10","isha":"23:01","fajrDeg":18.987,"ishaDeg":15.3},"2026-06-21":{"fajr":"02:09","isha":"23:03","fajrDeg":18.962,"ishaDeg":15.307},"2026-09-01":{"fajr":"04:29","isha":"21:17","fajrDeg":18.693,"ishaDeg":16.346},"2026-09-11":{"fajr":"04:46","isha":"20:56","fajrDeg":18.675,"ishaDeg":16.574},"2026-10-25":{"fajr":"04:48","isha":"18:36","fajrDeg":18.682,"ishaDeg":17.503},"2026-12-12":{"fajr":"05:41","isha":"18:05","fajrDeg":18.833,"ishaDeg":17.94}}

| Method | fajr mean |dev| | fajr worst | fajr within 2 min | isha mean |dev| | isha worst | isha within 2 min | isha past-midnight days | asr match |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| mwl | 7.66 | 19 (2026-06-18) | 0% | 7.49 | 23 (2026-06-23) | 21.6% | 0 | yes |
| isna | 30.35 | 60 (2026-06-18) | 0% | 10.39 | 18 (2026-01-03) | 0% | 0 | yes |
| umm-al-qura | 4.07 | 10 (2026-06-06) | 31.5% | 15.54 | 36 (2026-06-15) | 3% | 0 | yes |
| egyptian | 5.04 | 13 (2026-06-21) | 15.3% | 9.33 | 30 (2026-06-16) | 33.7% | 0 | yes |
| karachi | 7.66 | 19 (2026-06-18) | 0% | 12.32 | 38 (2026-06-16) | 25.5% | 0 | yes |
| moonsighting | 25.03 | 68 (2026-06-16) | 0% | 24.42 | 48 (2026-06-07) | 0% | 0 | yes |
| diyanet-domestic | 7.66 | 19 (2026-06-18) | 0% | 7.49 | 23 (2026-06-23) | 21.6% | 0 | yes |
| diyanet-europe | 7.66 | 19 (2026-06-18) | 0% | 6.37 | 12 (2026-01-04) | 18.6% | 0 | yes |
| mabims | 9.77 | 28 (2026-06-21) | 0% | 12.32 | 38 (2026-06-16) | 25.5% | 0 | yes |
| jakim | 8.14 | 19 (2026-06-14) | 0% | 12.82 | 38 (2026-06-12) | 22.2% | 0 | yes |
| kemenag | 10.25 | 29 (2026-06-21) | 0% | 11.86 | 38 (2026-06-22) | 28.5% | 0 | yes |
| kuwait | 7.15 | 18 (2026-06-14) | 0% | 9.33 | 30 (2026-06-16) | 33.7% | 0 | yes |
| qatar | 7.66 | 19 (2026-06-18) | 0% | 14.05 | 37 (2026-06-19) | 3% | 0 | yes |
| singapore-muis | 9.27 | 28 (2026-06-21) | 0% | 12.82 | 38 (2026-06-12) | 22.2% | 0 | yes |
| dubai | 6.06 | 15 (2026-06-14) | 2.7% | 13.93 | 41 (2026-06-16) | 17% | 0 | yes |
| tehran | 10.05 | 24 (2026-06-18) | 0% | 17.5 | 24 (2026-01-03) | 0% | 0 | yes |
| fazilet-a | 7.86 | 22 (2026-06-21) | 0% | 10.94 | 35 (2026-06-18) | 31.5% | 0 | yes |
| fazilet-b | 18.83 | 71 (2026-06-30) | 0% | 18.07 | 51 (2026-06-18) | 0% | 0 | yes |
| ecfr | 5.66 | 17 (2026-06-18) | 19.2% | 8.01 | 25 (2026-06-23) | 27.1% | 0 | yes |
| russia-sam | 23.06 | 48 (2026-06-18) | 0% | 10.39 | 18 (2026-01-03) | 0% | 0 | yes |
| isna-2010 | 7.66 | 19 (2026-06-18) | 0% | 12.32 | 38 (2026-06-16) | 25.5% | 0 | yes |

## UA-DUMU (Kyiv)

Encoded from the record:
- policy-layer.v2.4.json UA-DUMU: fajrRule.intervalTable {base "sunrise", minutes -100, keying "constant, every day of the year"}
- policy-layer.v2.4.json UA-DUMU: ishaRule.intervalTable.ranges: Sep 11-May 21 = 90; Jun 1-Aug 31 = 100; rampUp May 22-31 = [92,94,94,94,95,96,97,98,99,100]; rampDown Sep 1-11 = [100,99,98,97,96,95,94,93,92,92,90]
- policy-layer.v2.4.json UA-DUMU: solarBase sunriseAltitudeDeg -2.11, sunsetAltitudeDeg -2.11 (adhanStandard -0.833 NOT used)
- policy-layer.v2.4.json UA-DUMU: margins fajr 0, isha 0 (marginsProvenance.perField: "the instant is sunrise - 100 min; no margin on top")
- policy-layer.v2.4.json UA-DUMU: roundingProvenance.default: "the interval offsets are applied to already-rounded sunrise/maghrib"
- policy-layer.v2.4.json UA-DUMU: highLatitude.kind "none"
- policy-layer.v2.4.json UA-DUMU: reference.point Kyiv 50.4501, 30.5233; timezone iana Europe/Kyiv
- policy-layer.v2.4.json UA-DUMU: asr shafi (+5, not scored)
- world-table-v2.md Ukraine row (lines 442-452): "fajr = sunrise - 100 min EVERY day of the year; isha = maghrib + 90 (Sep 11-May 21) / + 100 (Jun 1-Aug 31) with explicit dated ramps; solarBase -2.11 deg altitude; nearest"

Spot samples (target side): {"2026-01-01":{"fajr":"06:09","isha":"17:44","ishaIntervalMin":90},"2026-03-01":{"fajr":"04:54","isha":"19:17","ishaIntervalMin":90},"2026-04-04":{"fajr":"04:40","isha":"21:13","ishaIntervalMin":90},"2026-05-22":{"fajr":"03:12","isha":"22:30","ishaIntervalMin":92},"2026-05-31":{"fajr":"03:02","isha":"22:50","ishaIntervalMin":100},"2026-06-15":{"fajr":"02:55","isha":"23:02","ishaIntervalMin":100},"2026-06-21":{"fajr":"02:56","isha":"23:04","ishaIntervalMin":100},"2026-09-01":{"fajr":"04:24","isha":"21:31","ishaIntervalMin":100},"2026-09-11":{"fajr":"04:39","isha":"20:59","ishaIntervalMin":90},"2026-10-25":{"fajr":"04:48","isha":"18:25","ishaIntervalMin":90},"2026-12-12":{"fajr":"05:59","isha":"17:34","ishaIntervalMin":90}}

Reading note: the harness compares minutes past midnight (brief discipline), with no midnight wrap. At 50.45 N the stock adhan high-latitude default (MiddleOfTheNight) pushes naked isha past midnight for the angle methods in late spring and summer; each such day reads as a >720-minute deviation (the midnightCrossings column counts them). This is the stock configuration behaving as shipped at 50.45 N, not a harness error.

| Method | fajr mean |dev| | fajr worst | fajr within 2 min | isha mean |dev| | isha worst | isha within 2 min | isha past-midnight days | asr match |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| mwl | 30.56 | 130 (2026-07-15) | 22.5% | 196.3 | 1371 (2026-07-16) | 0% | 50 | yes |
| isna | 18.37 | 58 (2026-06-21) | 3.8% | 45.99 | 1384 (2026-06-26) | 19.7% | 9 | yes |
| umm-al-qura | 34.39 | 133 (2026-07-18) | 0% | 12.63 | 23 (2026-02-19) | 0% | 0 | yes |
| egyptian | 43.01 | 140 (2026-07-23) | 0% | 219.9 | 1369 (2026-07-19) | 0% | 56 | yes |
| karachi | 30.56 | 130 (2026-07-15) | 22.5% | 236.39 | 1363 (2026-07-21) | 0% | 60 | yes |
| moonsighting | 9.12 | 16 (2026-09-23) | 9.9% | 21.87 | 43 (2026-08-08) | 1.9% | 0 | yes |
| diyanet-domestic | 30.56 | 130 (2026-07-15) | 22.5% | 196.3 | 1371 (2026-07-16) | 0% | 50 | yes |
| diyanet-europe | 30.56 | 130 (2026-07-15) | 22.5% | 143.76 | 1378 (2026-07-09) | 35.3% | 36 | yes |
| mabims | 46.94 | 143 (2026-07-25) | 0% | 236.39 | 1363 (2026-07-21) | 0% | 60 | yes |
| jakim | 30.1 | 130 (2026-07-15) | 24.1% | 236.67 | 1362 (2026-07-21) | 0% | 60 | yes |
| kemenag | 47.41 | 143 (2026-07-25) | 0% | 236.01 | 1363 (2026-07-21) | 0% | 60 | yes |
| kuwait | 31.09 | 131 (2026-07-15) | 19.7% | 219.9 | 1369 (2026-07-19) | 0% | 56 | yes |
| qatar | 30.56 | 130 (2026-07-15) | 22.5% | 11.9 | 21 (2026-05-31) | 0% | 0 | yes |
| singapore-muis | 46.42 | 142 (2026-07-25) | 0% | 236.67 | 1362 (2026-07-21) | 0% | 60 | yes |
| dubai | 32.3 | 131 (2026-07-16) | 13.4% | 244.37 | 1362 (2026-07-22) | 0% | 62 | yes |
| tehran | 28.33 | 128 (2026-07-13) | 30.1% | 13.38 | 36 (2026-06-19) | 3.8% | 0 | yes |
| fazilet-a | 45.38 | 142 (2026-07-24) | 0% | 228.41 | 1365 (2026-07-20) | 0% | 58 | yes |
| fazilet-b | 53.03 | 149 (2026-07-29) | 0% | 267.68 | 1361 (2026-07-25) | 0% | 68 | yes |
| ecfr | 32.56 | 132 (2026-07-15) | 5.8% | 197.76 | 1369 (2026-07-16) | 0% | 50 | yes |
| russia-sam | 19.9 | 98 (2026-06-21) | 9.6% | 45.99 | 1384 (2026-06-26) | 19.7% | 9 | yes |
| isna-2010 | 30.56 | 130 (2026-07-15) | 22.5% | 236.39 | 1363 (2026-07-21) | 0% | 60 | yes |

## Harness decisions register

- Method side: presets verbatim (CONSTRAINTS 1); constructed bodies take only their documented pair on adhan Other, with the library default highLatitudeRule (MiddleOfTheNight) standing, which is the stock configuration.
- Umm al-Qura isha: maghrib+120 inside Ramadan 1447 (2026-02-18 to 2026-03-19, a 30-day month), +90 outside; rounding floor(raw + 1 min) as documented.
- Diyanet-domestic: Turkey preset verbatim, which carries the temkin (sunrise -7, dhuhr +5, asr +4, maghrib +7); no temkin touches fajr/isha (doctrine page per world-table Turkey row).
- Method-side margins on the scored prayers: only ECFR -2/+2 applied (the council's own resolution, quoted in methods.json sources). JAKIM +2/+2 NOT applied (carried in the record as a census fit, barred by CONSTRAINTS 1). Singapore +1, Dubai, Kemenag margins: census-fitted, not applied.
- Method-side rounding where the body documents it: Umm al-Qura floor(raw+1), JAKIM ceil, Kemenag down, Kuwait fajr floor / isha nearest, Singapore ceil; MABIMS, Fazilet and Dubai leave fajr/isha rounding undocumented, so the harness default nearest applies.
- Qatar naked = preset verbatim: interval added at second resolution before rounding (the documented post-rounding quirk is not reproduced; worst-case effect 1 minute).
- Moonsighting: preset verbatim, seasonal curves included; above 55 deg the preset switches to night/7, irrelevant at 46-50 N.
- UA-DUMU order of operations per roundingProvenance: round the solarBase sunrise/sunset to the nearest minute first, then apply -100/+interval.
- ISNA-2010 18/18 constructed as a separate 21st method; ISNA (15/15, NorthAmerica preset) scored separately.
- UA ramp verification (script-run): May 26 = 95, May 31 = 100, Jun 1 = 100, Sep 1 = 100, Sep 11 = 90, Sep 12 = 90 (base range resumes after the ramp), Dec 31 = 90.
- Deviations compare minutes past midnight with no wrap; midnightCrossings counts the days where a method instant landed on the next local day while the target stayed before midnight (zero crossings at Ljubljana for every method).
- SI-VAKTIJA coordinate assumption (Ljubljana 46.0569, 14.5058) is recorded in its section above; the object publishes no coordinates.
- Asr: school-match flag only (all 21 methods shafi, both targets shafi: all match). Dhuhr/maghrib not scored.
