# GAPS-CLOSED-2: the wtdiff2 flags closed from banked data

Agent O1l-65, 2026-11-11. Workspace `$HOME/athan-gitree/census/o1l-city/flags2/`. Four flags,
four verdicts, no web, no clock read, no repository edit. Evidence per flag in `REPORT.md`,
scripts in `fit/`, normalized results in `data/`.

| flag | item | state before | verdict | rule-form named |
|---|---|---|---|---|
| F2 | Quetta asr | OPEN, "cause not named" | **CLOSED: a hand-ruled asr convention.** Not rounding (the swing is 10 print quanta wide and seasonal), not an error of point or ephemeris (sunrise 325/365, dhuhr 364/365, maghrib 311/365 within 1 on the same table and point). The chart prints TWO asr columns: the Shafi is the half-afternoon fraction `noon + 0.5 (sunset - noon)` (fraction 0.4977, sd 0.0046, 252/361 within 1), the Hanafi is shadow-2 plus a declination-tracking seasonal term of plus or minus 5 min (r2 0.61 on sin d, zero crossings mid-April and early August). No shadow-family member absorbs the term (best leaves a worst of 6 and 109 rows outside 1), so its generator stays undecidable at the print quantum | **PK-QUETTA-ASR**: Shafi = half-afternoon fraction, Hanafi = shadow-2 plus a seasonal declination term |
| F3 | Macedonia fajr +45 | OPEN AND WIDENED, "both stay" | **CLOSED: bfi.mk is the anomaly, and none of the three named causes holds.** Not the timezone field (spread 55 min, not a whole hour), not DST (no uniform 60 min), not the city point (dhuhr +6.7, maghrib +7.9 but asr +1.4, so not one point's output at 4 min per degree). bfi's row needs fajr about 9.8 deg and isha about 14.7 deg at Skopje, or 51 min before sunrise and 70 min after maghrib. vaktija.eu's month is a consistent 18/16 Shafi table at the Skopje point (fajr +0.23 mean, 27/30 within 1) and is the recipe of record | **MK-BFI-DIVERGENT**: a different twilight rule at Skopje, angle or interval undecidable on one day |
| F4 | Porto monthly asr +39 to +54 | OPEN, "convention against error unresolved" | **CLOSED: the monthly is a convention sheet, the annual is the publisher's own computed table.** Sunrise and maghrib are copied from the annual to the minute, while dhuhr is one fixed value (12:30) and asr, fajr and isha are fixed rungs. The annual fits 18/17 Shafi at fajr +1.07, asr +0.70 (0 to 1), maghrib +3.70, isha = own maghrib +77 exactly. Lisboa's and Coimbra's monthlies are byte-identical to their annuals, so the monthly format normally carries the computation and Porto is the exception | **PT-PORTO-MONTHLY-LADDER**: dhuhr fixed 12:30, asr 15:45 then 15:30, fajr 5:45 / 6:00 / 6:15, isha 19:00 then 18:50, sunrise and maghrib solar |
| F5 | India isha line | OPEN, "17 sits 4 to 5 min before 18" | **CLOSED: a 17-degree isha.** Eight of ten banked city tables sit within 1 min of 17 deg on 365/365 rows and outside 1 min of 18 deg on 0/365. The 4.3 to 5.4 min separation is 4 to 5 print quanta, so it is a real angle, not a rounding convention. The interval family is refuted (the printed isha to maghrib spread runs 10 to 22 min, sd 2.8 to 6.9, and the best fixed interval scores at most 37/365 exact). The residual mean of -0.5 with every value at or below zero is a floor to the minute. Bengaluru and Srinagar carry 18 deg as a mosque override | **IN-ISHA-17**: isha at 17 deg floored to the minute, 18 deg as the minority city line |

No flag is blocked. Two sub-questions stay open for want of data that is not in the bank: F2's exact
seasonal generator and F3's angle-versus-interval form. Both are recorded as honest limits in
`REPORT.md`, and neither changes the class of its flag's verdict.

## Engine and pins

adhan 4.4.6 at `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`, `Rounding.None`, second
resolution then explicit per-column rounding. Timezones pinned: `Asia/Karachi` (F2), `Europe/Skopje`
(F3), `Europe/Lisbon` (F4), `Asia/Kolkata` (F5). Every date built from a literal capture string.
