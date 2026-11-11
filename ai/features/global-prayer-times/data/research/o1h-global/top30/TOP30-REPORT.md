# O1h top-30 independent grid

Second, independent decision table for the O1h study: the 30 countries with the largest Muslim
populations, 21 worldwide methods run naked, calendar year 2026, fajr and isha.
Built from `methods/methods.json`, `countries.json`, `policy-layer.v2.4.json` and
`world-table-v2.md` only, under `CONSTRAINTS.md` and `SHARED-BRIEF.md`. Every number in this
file is emitted by `grid.mjs` in the same run that wrote `results.json`.

## What was scored

- 21 methods: the 20 in `methods.json` plus the ISNA-2010 18/18 position.
- 24 of the 30 countries carry a computable target, 3 have no target at all in the record and 3 carry a target whose rule form the brief excludes.
- 1637.3 million Muslims across the 30 countries, 1514.1 million of them inside a scored target.
- 365 days of 2026. Deviation is method minute minus target minute on the local wall clock,
  reported absolute, on the 24 h circle so a prayer that crosses midnight is still the same
  night's prayer.

### Method-side conventions (the naked rule)

Preset methods run with the adhan preset only: MWL, ISNA, Egyptian, Karachi, Umm al-Qura,
Dubai, MoonsightingCommittee, Kuwait, Qatar, Singapore, Turkey. Non-preset bodies run on `Other`
with the body's own documented pair and its own published margins: JAKIM +2/+2, Kemenag +3/+3,
ECFR -2/+2, Fazilet effective 19.8/17.8 and 20.8/18.7, MABIMS 20/18, Diyanet-Europe 18/16,
Russia-SAM 16/15, ISNA-2010 18/18. Census-measured margins are never applied to a method, per
the brief's last method-side sentence, so Umm al-Qura carries no +1 and Singapore carries the
preset's dhuhr +1 only.

Interval isha is the printed maghrib plus the interval, which is the census's measured
invariant (isha minus maghrib = 90 or 120 exactly). Umm al-Qura takes +120 on the 30 Ramadan
days 2026-02-18 to 2026-03-19 and +90 otherwise.

High latitude stays with the library: middle-of-the-night is the default every adhan preset
inherits, MoonsightingCommittee keeps its own body curve, ECFR is run as the proportional rule
(angle/60) because proportion is what the council documents. Targets keep their own documented
kind, so DUM RT gets its astronomically bounded sunrise-120 / sunset+90 substitute and DUMK its
angle/60 clamp.

## (a) Winner map

| # | Country | Pop (m) | Target | Grade | Closest method | fajr | isha | mean | worst | days<=2 | asr | also <=2 min |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Indonesia | 249.80 | ID-KEMENAG | candidate | mabims | 0.00 | 0.00 | **0.00** | 0.0 | 100.0 | match | singapore-muis, fazilet-a |
| 2 | Pakistan | 233.00 | PK-DEFACTO | community de facto | isna-2010 | 0.00 | 0.00 | **0.00** | 0.0 | 100.0 | mismatch | karachi, dubai, kuwait |
| 3 | India | 200.00 | IN-DEFACTO | community de facto | isna-2010 | 0.00 | 0.00 | **0.00** | 0.0 | 100.0 | mismatch | karachi, dubai, kuwait |
| 4 | Bangladesh | 150.80 | BD-IFB | provisional | jakim | 0.39 | 0.40 | **0.40** | 2.0 | 100.0 | mismatch | - |
| 5 | Nigeria | 96.00 | NG-SPA | community | mwl | 0.00 | 0.00 | **0.00** | 0.0 | 100.0 | match | diyanet-domestic, kuwait, moonsighting, ecfr |
| 6 | Egypt | 87.50 | EG-ESA | A | egyptian | 0.00 | 0.00 | **0.00** | 0.0 | 100.0 | match | fazilet-a |
| 7 | Iran | 85.70 | IR-NATIONAL | provisional | tehran | 0.05 | - | **0.05** | 1.0 | 100.0 | n/a | jakim, moonsighting, mwl, isna-2010, karachi, diyanet-domestic, diyanet-europe, qatar |
| 8 | Turkey | 81.20 | TR-DIYANET-DOMESTIC | A | mwl | 0.00 | 0.00 | **0.00** | 0.0 | 100.0 | match | diyanet-domestic, kuwait, ecfr |
| 10 | Iraq | 39.00 | IQ-DIWAN | provisional | mwl | 0.08 | 0.44 | **0.26** | 1.0 | 100.0 | match | diyanet-domestic, kuwait, ecfr |
| 11 | Sudan | 38.60 | SD-MINISTRY | provisional | qatar | 3.82 | 0.00 | **1.91** | 5.0 | 50.0 | match | - |
| 13 | Morocco | 36.40 | MA-HABOUS | A (conditional) | egyptian | 7.03 | 7.95 | **7.49** | 61.0 | 60.8 | match | - |
| 14 | Saudi Arabia | 31.50 | SA-KACST | A | umm-al-qura | 1.00 | 1.00 | **1.00** | 1.0 | 100.0 | match | - |
| 15 | Uzbekistan | 29.90 | UZ-ISLOM | provisional | isna | 3.11 | 3.10 | **3.11** | 5.0 | 17.0 | mismatch | - |
| 16 | Yemen | 26.80 | YE-AWQAF-SANAA | provisional | diyanet-europe | 0.00 | 0.00 | **0.00** | 0.0 | 100.0 | match | - |
| 17 | Niger | 21.10 | NE-BUTIN | A | moonsighting | 0.00 | 2.06 | **1.03** | 5.0 | 82.1 | match | isna-2010, karachi, dubai, kuwait |
| 18 | Malaysia | 20.10 | MY-JAKIM | provisional | jakim | 0.00 | 0.00 | **0.00** | 0.0 | 100.0 | match | - |
| 19 | Tanzania | 19.40 | JAMIAT-KZN | community | diyanet-europe | 0.00 | 5.53 | **2.77** | 7.0 | 50.0 | match | - |
| 21 | Russia | 15.00 | RU-DUMRT | A | ecfr | 6.17 | 20.44 | **13.31** | 101.0 | 37.8 | mismatch | - |
| 22 | Kazakhstan | 13.20 | KZ-MUFTIYAT | A | isna | 9.12 | 9.12 | **9.12** | 77.0 | 79.2 | mismatch | - |
| 24 | Tunisia | 10.20 | TN-INM | provisional | isna-2010 | 0.52 | 0.44 | **0.48** | 1.0 | 100.0 | match | karachi, dubai, kuwait |
| 25 | Jordan | 10.20 | JO-AWQAF | A | isna-2010 | 0.49 | 0.44 | **0.47** | 1.0 | 100.0 | match | karachi, dubai, kuwait |
| 28 | Libya | 6.60 | LY-MUAZZIN | provisional | dubai | 0.73 | 0.42 | **0.58** | 1.0 | 100.0 | match | isna-2010, karachi |
| 29 | United Arab Emirates | 6.30 | AE-AWQAF | A | dubai | 0.00 | 1.00 | **0.50** | 1.0 | 100.0 | match | isna-2010, karachi, kuwait, ecfr |
| 30 | Mozambique | 5.80 | JAMIAT-KZN | community | diyanet-europe | 0.00 | 5.53 | **2.77** | 7.0 | 50.0 | match | - |

Headline: 18 of the 24 scored countries have at least one method
inside 2 minutes mean deviation, 16 inside 1 minute, 21 inside 5.

Read that headline twice. 12 of the 18 countries inside 2 minutes reach it with a
method whose angle pair is the target's own pair: the census fitted the country to that body, so
the score measures the harness, not the method. Those countries are
Indonesia (mabims), Pakistan (isna-2010), India (isna-2010), Nigeria (mwl), Egypt (egyptian), Turkey (mwl), Saudi Arabia (umm-al-qura), Yemen (diyanet-europe), Malaysia (jakim), Tunisia (isna-2010), Jordan (isna-2010), United Arab Emirates (dubai).
The remaining 6 are reached with a pair that was not fitted to them:
Bangladesh (jakim 0.40), Iran (tehran 0.05), Iraq (mwl 0.26), Sudan (qatar 1.91), Niger (moonsighting 1.03), Libya (dubai 0.58).

Coincident targets, with the best method that uses a foreign pair:

| Country | Best method | Best mean | Best method with a foreign pair |
| --- | --- | --- | --- |
| Indonesia | mabims (20.00/18.00) | 0.00 | fazilet-a 0.85 |
| Pakistan | isna-2010 (18.00/18.00) | 0.00 | dubai 0.94 |
| India | isna-2010 (18.00/18.00) | 0.00 | dubai 1.00 |
| Nigeria | mwl (18.00/17.00) | 0.00 | kuwait 1.35 |
| Egypt | egyptian (19.50/17.50) | 0.00 | fazilet-a 1.53 |
| Turkey | mwl (18.00/17.00) | 0.00 | kuwait 1.83 |
| Saudi Arabia | umm-al-qura (18.50/+90|+120) | 1.00 | qatar 2.38 |
| Yemen | diyanet-europe (18.00/16.00) | 0.00 | mwl 2.20 |
| Malaysia | jakim (18.00/18.00) | 0.00 | dubai 2.48 |
| Kazakhstan | isna (15.00/15.00) | 9.12 | moonsighting 13.75 |
| Tunisia | isna-2010 (18.00/18.00) | 0.48 | dubai 0.66 |
| Jordan | isna-2010 (18.00/18.00) | 0.47 | dubai 1.03 |
| United Arab Emirates | dubai (18.20/18.20) | 0.50 | isna-2010 0.51 |

Asr schools agree between the winning method and the target in 17 of 24 countries. A mismatch is carried as a flag and never enters the score.

## (b) Population share inside 1, 2 and 5 minutes

Share of the 30-country population (1637.3 m). The scored-only denominator is
(1514.1 m) and excludes the six countries with no computable target.

| Method | <=1 min | <=2 min | <=5 min | weighted mean |
| --- | --- | --- | --- | --- |
| kuwait | 0.0% | 42.6% | 65.6% | 4.06 |
| isna-2010 | 28.1% | 35.0% | 75.5% | 3.62 |
| karachi | 28.1% | 35.0% | 75.5% | 3.62 |
| dubai | 15.6% | 29.8% | 73.9% | 4.16 |
| fazilet-a | 15.3% | 20.6% | 35.8% | 6.50 |
| mwl | 13.2% | 18.4% | 60.3% | 4.46 |
| diyanet-domestic | 13.2% | 18.4% | 60.3% | 4.46 |
| jakim | 15.7% | 15.7% | 53.7% | 5.20 |
| mabims | 15.3% | 15.3% | 35.2% | 6.76 |
| singapore-muis | 15.3% | 15.3% | 35.6% | 6.71 |
| ecfr | 0.0% | 13.6% | 80.9% | 4.10 |
| moonsighting | 0.0% | 12.4% | 71.1% | 5.08 |
| qatar | 0.0% | 7.6% | 45.0% | 7.18 |
| diyanet-europe | 1.6% | 6.9% | 49.3% | 6.32 |
| egyptian | 5.3% | 5.3% | 43.0% | 6.11 |
| tehran | 5.2% | 5.2% | 6.8% | 10.93 |
| umm-al-qura | 1.9% | 1.9% | 9.9% | 8.84 |
| isna | 0.0% | 0.0% | 1.8% | 15.09 |
| kemenag | 0.0% | 0.0% | 47.3% | 6.64 |
| fazilet-b | 0.0% | 0.0% | 15.3% | 10.08 |
| russia-sam | 0.0% | 0.0% | 1.8% | 12.66 |

Kuwait reaches 42.6 percent inside 2 minutes and nothing inside 1: its fajr floors where almost
every target rounds to nearest, so it is half a minute out everywhere and never inside the
tighter band. ECFR is the mirror image, 81 percent inside 5 and nothing inside 1, because its
-2 minute fajr margin is a systematic half-step.

## (c) Population-weighted ranking

Weighted mean absolute deviation across the scored countries, weighted by Muslim population.

| Rank | Method | All scored (1514.1 m) | Without Pakistan and India (1081.1 m) |
| --- | --- | --- | --- |
| 1 | isna-2010 | 3.62 | 5.07 (2) |
| 2 | karachi | 3.62 | 5.07 (3) |
| 3 | kuwait | 4.06 | 5.11 (4) |
| 4 | ecfr | 4.10 | 4.78 (1) |
| 5 | dubai | 4.16 | 5.44 (7) |
| 6 | mwl | 4.46 | 5.28 (5) |
| 7 | diyanet-domestic | 4.46 | 5.28 (6) |
| 8 | moonsighting | 5.08 | 6.02 (8) |
| 9 | jakim | 5.20 | 6.29 (9) |
| 10 | egyptian | 6.11 | 6.61 (10) |
| 11 | diyanet-europe | 6.32 | 6.91 (11) |
| 12 | fazilet-a | 6.50 | 7.14 (12) |
| 13 | kemenag | 6.64 | 7.33 (13) |
| 14 | singapore-muis | 6.71 | 7.44 (14) |
| 15 | mabims | 6.76 | 7.50 (15) |
| 16 | qatar | 7.18 | 8.36 (16) |
| 17 | umm-al-qura | 8.84 | 9.69 (17) |
| 18 | fazilet-b | 10.08 | 10.68 (18) |
| 19 | tehran | 10.93 | 11.13 (19) |
| 20 | russia-sam | 12.66 | 12.88 (20) |
| 21 | isna | 15.09 | 15.30 (21) |

The spread is 3.62 minutes for the best method to 15.09 for the worst. Drop Pakistan and India
and the order turns over: those two carry 433 million people and both publish an 18/18 pair, so
any 18/18 method rides their weight to the top of the all-scored table. Without them ECFR leads
at 4.78 and the 18/18 family sits at 5.07. Iran enters every column on fajr alone, its
national table printing no isha row, so its weight counts once and not twice.
## Countries with no close method

| Country | Pop (m) | Best method | Best mean | Cause |
| --- | --- | --- | --- | --- |
| Morocco | 36.40 | egyptian | 7.5 | the object prints a fixed UTC+1 clock while every method renders in the IANA zone, which drops to UTC+0 for 35 days of 2026. That alone is ~60 minutes on those days |
| Russia | 15.00 | ecfr | 13.3 | DUM RT substitutes sunrise-120 / sunset+90 on the 95 days the angle is unreachable, while the library default is Islamic midnight, about two hours earlier on exactly those days |
| Kazakhstan | 13.20 | isna | 9.1 | DUMK clamps fajr and isha to angle/60 of the night and the naked library does not, so the same 15/15 pair is 9 minutes out |

## Sensitivity: the choices that move the answer

Russia has three publishers in the record. Scored against DUM RT at Kazan, no method is close.
Scored against CDUM at Moscow the same grid puts MWL at 2.00 minutes, because CDUM is exactly
18/17. The Russian verdict is a publisher choice, not a method gap.

| Target variant | Best method | Best mean |
| --- | --- | --- |
| Russia (CDUM at Moscow) | mwl | 2.00 |
| Russia (DUM RF at Moscow) | diyanet-europe | 4.11 |
| Tanzania (at Dar es Salaam) | diyanet-europe | 2.36 |
| Mozambique (at Maputo) | diyanet-europe | 2.65 |

The southern-African members of the Jamiat federation are anchored at Durban in the primary
grid, per the brief. Run at their own capitals the same recipe and the same grid put Tanzania at
2.36 and Mozambique at 2.65, so neither is a method failure either.

## Unscored countries

| # | Country | Pop (m) | Reason |
| --- | --- | --- | --- |
| 9 | Algeria | 43.70 | no row in countries.json. World table Algeria is a candidate (marw.gov.dz unreachable, no series, no fit) |
| 12 | Afghanistan | 37.00 | no row in countries.json. World table Afghanistan is a candidate on a 30-day image transcription with no second witness |
| 20 | Syria | 15.00 | no row in countries.json. World table Syria carries a documented ministry policy (MWL 18/17 with maghrib +2 to +3) but the table is unobtainable, 6 days only |
| 23 | Cote d'Ivoire | 11.30 | CI-COSIM carries null angles (not fitted, the surface is an AlAdhan ISNA proxy, today-only) |
| 26 | Tajikistan | 9.30 | TJ-SHURO is window-class (start-end windows, not instants) and carries null angles. The brief skips window-class targets |
| 27 | France | 6.90 | FR-GMS fajr and isha are seasonal sweeps (from 18 down to 12 degrees and from 16 down to 11.5) with null angles. The brief skips seasonal sweep targets |

## Fit points derived where `countries.json` is null

- **Malaysia** `MY-JAKIM`: 3.139, 101.6869, zone WLY01, Kuala Lumpur and Putrajaya. That is the
  object's own zone anchor, cited in the policy layer as the Lampiran B westernmost-point
  reference (`SOURCE-CATALOG my-jakim-wly01`, `#6905 E4`), and the world table calls the zone
  reference points Lampiran B westernmost-point computations verified by fit.
- **Tanzania** and **Mozambique** `JAMIAT-KZN`: -29.8587, 31.0218, Durban, the brief's fixed
  fallback. The world table records this federation as covering 11 Tanzanian and 2 Mozambican
  towns, but the 494-town table is not on the board, so the anchor is Durban and the numbers
  measure Durban. Both are marked `scored-anchor` and both have a sensitivity row at the
  national capital in `results.json`.
- **Russia** `RU-DUMRT` keeps its own board point, Kazan 55.7963/49.1088.

## Checks

Twelve country-method pairs reproduce the target exactly, and each one is the pair it has to be:
Indonesia/MABIMS 20/18, Pakistan and India against ISNA-2010 and Karachi 18/18, Nigeria against
MWL 18/17, Egypt against the Egyptian 19.5/17.5, Turkey against Diyanet and MWL 18/17, Yemen
against Diyanet-Europe 18/16, Malaysia against JAKIM. An arithmetic error anywhere in the
pipeline would break that set.

Three results to read with their cause:

- Umm al-Qura scores exactly 1.0 minute against Saudi Arabia. The preset carries no +1 margin
  and the target's printed row does, so the naked preset is one minute early every day. That is
  the brief's rule working, not a defect.
- Russia is 13 minutes out at best, because the Kazan body substitutes sunrise-120 on the 95
  days the 18 degree angle is unreachable while the library default is Islamic midnight, about
  two hours earlier on those days.
- Kazakhstan's ISNA 15/15 is 9.1 minutes out against the target that uses the same pair, because
  DUMK clamps fajr and isha to angle/60 of the night and the naked library does not.

## Expected divergences from the main simulation

1. Census-measured method margins are not applied (Umm al-Qura +1, Singapore's five, Dubai's
   four). The brief orders presets verbatim. A run that applied them would gain about a minute
   on three methods and lose nothing.
2. Interval isha is composed on the printed maghrib rather than on raw sunset (a 1 minute
   difference on Umm al-Qura and Qatar).
3. Russia uses DUM RT Kazan, the grade A Russian target. CDUM and DUM RF are sensitivity rows.
4. Tanzania and Mozambique are anchored at Durban per the brief.

## Method inventory

| Method | Pair / rule | asr | high latitude |
| --- | --- | --- | --- |
| mwl | Muslim World League 18/17 | shafi | library default (mid-night) |
| isna | ISNA / FCNA 15/15 | shafi | library default (mid-night) |
| isna-2010 | ISNA 2010 position 18/18 | shafi | library default (mid-night) |
| umm-al-qura | Umm al-Qura 18.5 / maghrib+90 (+120 Ramadan) | shafi | library default (mid-night) |
| egyptian | Egyptian General Authority 19.5/17.5 | shafi | library default (mid-night) |
| karachi | Karachi 18/18 | shafi | library default (mid-night) |
| moonsighting | Moonsighting Committee 18/18 + season curve | shafi | body (1/7 above 55, season curve) |
| diyanet-domestic | Diyanet domestic 18/17 + temkin | shafi | library default (mid-night) |
| diyanet-europe | Diyanet European unified 18/16 | shafi | library default (mid-night) |
| mabims | MABIMS 20/18 | shafi | library default (mid-night) |
| jakim | JAKIM 18/18 + ihtiyati | shafi | library default (mid-night) |
| kemenag | Kemenag 20/18 + ihtiyati | shafi | library default (mid-night) |
| kuwait | Kuwait 18/17.5 | shafi | library default (mid-night) |
| qatar | Qatar 18/1.5h (interval after rounding) | shafi | library default (mid-night) |
| singapore-muis | MUIS Singapore 20/18, ceiling | shafi | library default (mid-night) |
| dubai | Dubai / UAE AWQAF 18.2/18.2 | shafi | library default (mid-night) |
| tehran | Tehran 17.7/14 | shafi | library default (mid-night) |
| fazilet-a | Fazilet Profile A (world) 19.8/17.8 | shafi | library default (mid-night) |
| fazilet-b | Fazilet Profile B (Ottoman) 20.8/18.7 | shafi | library default (mid-night) |
| ecfr | ECFR 18/17 +-2, proportional | shafi | body (proportional, angle/60) |
| russia-sam | Russia SAM 16/15 | shafi | library default (mid-night) |

