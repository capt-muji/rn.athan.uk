# O1i home-ground: the adhan presets against their own governments

Round two of the methods study. Round one scored fajr and isha with the harness applying
its own rounding. This round scores the full six-row table the user sees, because
`methodAdjustments`, rounding and the asr school are part of what the package delivers.
Each local preset runs verbatim, straight from `CalculationMethod[name]()`, with nothing
added and nothing removed, against its own country's fitted recipe or published minutes.

## Method

- Engine: adhan-js 4.4.6. Node under TZ=UTC, every date built from a literal at noon
  UTC, so the process clock is never read and no date can slip a day.
- Preset side: `CalculationMethod[preset]()` exactly as shipped, including its
  `methodAdjustments` and its `rounding`. `Rounding.Up` on Singapore and the Dubai and
  Diyanet margin blocks come from the package, not from the census.
- The one caller-side field is the madhab, which no preset sets. It takes the school the
  body itself documents: Karachi Hanafi (CONSTRAINTS.md rule 2 names it a body constant),
  every other body here Shafi. A school that disagrees with the target is flagged and
  never enters a score.
- Target side: the policy-layer v2.4 recipe at the object's own point, computed at second
  resolution then margined and rounded as the object declares. Objects carrying
  `highLatitude.kind: none` get the library's night substitution disabled, so no clamp
  leaks into a low-latitude table. Diyanet's frozen-latitude-45 rule never binds at 41 N,
  which the object's own provenance states.
- Deviation is preset minute minus authority minute on that country's IANA wall clock,
  taken on the 24-hour circle. `maghrib` is the sunset row unless the object carries a
  maghrib angle, which only Iran does.
- Interval isha is composed on the printed maghrib, the census invariant.
- Both sides are printed whole minutes, so every deviation in this study is an integer.
  That is why the within-1 and within-2 columns coincide wherever no row is three or more
  out: a table that is never 2 minutes off is also never 1.5 off.

## Assumptions and inputs

- Ramadan windows, per the announcing body's own Hijri calendar: 1447 2026-02-18..2026-03-19
  (30 days), 1448 2027-02-08..2027-03-08 (29), 1449
  2028-01-28..2028-02-25 (29), from the KACST capture in
  `s1-saudi/FINDINGS.md`.
- Years 2026, 2027 and 2028, whole Gregorian years, for every recipe pair. London uses its
  own real table, 2027 plus 2028-2038, 4,383 days.
- The US reference is the practice map's 15/15 row at 40.71, -74.01, labelled community.

## Summary: does the preset reproduce its own government?

Three-year pooled mean absolute deviation over the six printed rows, plus the same figure
with asr removed, the share of prayer-days within two minutes, and the worst single day.
`all` pools every prayer-day of the period.

| Pair | Preset | Pooled mean | without asr | Worst row | <=1 min | <=2 min | asr | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SA-KACST | UmmAlQura | **0.91** | 0.99 | 31.00 | 98.7 | 98.7 | match | close |
| AE-AWQAF | Dubai | **1.08** | 0.70 | 3.00 | 83.3 | 83.3 | match | close |
| QA-MOI | Qatar | **0.74** | 0.80 | 1.00 | 100.0 | 100.0 | match | close |
| KW-AJIRI | Kuwait | **0.17** | 0.20 | 1.00 | 100.0 | 100.0 | match | reproduces |
| TR-DIYANET-DOMESTIC | Turkey | **0.00** | 0.00 | 0.00 | 100.0 | 100.0 | match | reproduces |
| SG-MUIS | Singapore | **0.98** | 0.98 | 1.00 | 100.0 | 100.0 | match | close |
| IR-NATIONAL | Tehran | **0.11** | 0.11 | 1.00 | 100.0 | 100.0 | n/a | reproduces |
| PK-DEFACTO | Karachi | **0.17** | 0.20 | 1.00 | 100.0 | 100.0 | match | reproduces |
| IN-DEFACTO | Karachi | **0.17** | 0.20 | 1.00 | 100.0 | 100.0 | match | reproduces |
| MY-JAKIM (bonus) | Karachi | **11.10** | 1.48 | 72.00 | 41.2 | 67.5 | mismatch | off |
| EG-ESA | Egyptian | **0.17** | 0.20 | 1.00 | 100.0 | 100.0 | match | reproduces |
| US-COMMUNITY | NorthAmerica | **0.17** | 0.20 | 1.00 | 100.0 | 100.0 | match | reproduces |
| GB-LONDON | MoonsightingCommittee | **2.12** | 2.14 | 11.00 | 45.6 | 57.9 | match | drifting |

`verdict` bands: reproduces at <= 0.5 min pooled, close at <= 1.5, drifting at <= 4, off
above 4. Every band is about the six-row table the user sees, so a single systematic
one-minute margin on one row moves a pair by 0.17 and not by 1. The bonus row carries a
school mismatch on asr, so its six-row figure is not comparable: read its "without asr"
column, 1.48, and the paragraph on it below.

## Per pair, per year, per prayer

### SA-KACST - UmmAlQura

Umm al-Qura (adhan preset) vs KACST Umm al-Qura service. Makkah 21.4225, 39.8262, Asia/Riyadh. Authority grade A.
Known gap: preset has no +1 margins and no Ramadan +120 switch.
asr: preset shafi, authority shafi (match).

Recipe: fajr {"angle":18.5}, isha {"kind":"ramadanInterval","interval":90,"ramadanInterval":120}.
Margins {"fajr":1,"sunrise":0,"dhuhr":1,"asr":1,"maghrib":1,"isha":1}, rounding {"fajr":"down","sunrise":"down","dhuhr":"down","asr":"down","maghrib":"down","isha":"down"}.

**2026** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.53 | -0.53 | 1.00 | 46.8 | 100.0 | 100.0 |
| sunrise | 0.54 | 0.54 | 1.00 | 46.3 | 100.0 | 100.0 |
| dhuhr | 0.53 | -0.53 | 1.00 | 46.8 | 100.0 | 100.0 |
| asr | 0.49 | -0.49 | 1.00 | 51.2 | 100.0 | 100.0 |
| maghrib | 0.50 | -0.50 | 1.00 | 49.6 | 100.0 | 100.0 |
| isha | 2.97 | -2.97 | 31.00 | 46.0 | 91.8 | 91.8 |
| **all** | 0.93 | -0.75 | 31.00 | 47.8 | 98.6 | 98.6 |

**2027** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.52 | -0.52 | 1.00 | 48.2 | 100.0 | 100.0 |
| sunrise | 0.51 | 0.51 | 1.00 | 49.0 | 100.0 | 100.0 |
| dhuhr | 0.52 | -0.52 | 1.00 | 48.5 | 100.0 | 100.0 |
| asr | 0.48 | -0.48 | 1.00 | 52.1 | 100.0 | 100.0 |
| maghrib | 0.52 | -0.52 | 1.00 | 48.5 | 100.0 | 100.0 |
| isha | 2.90 | -2.90 | 31.00 | 44.4 | 92.1 | 92.1 |
| **all** | 0.91 | -0.74 | 31.00 | 48.4 | 98.7 | 98.7 |

**2028** (366 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.45 | -0.45 | 1.00 | 55.2 | 100.0 | 100.0 |
| sunrise | 0.52 | 0.52 | 1.00 | 48.1 | 100.0 | 100.0 |
| dhuhr | 0.52 | -0.52 | 1.00 | 48.4 | 100.0 | 100.0 |
| asr | 0.47 | -0.47 | 1.00 | 52.7 | 100.0 | 100.0 |
| maghrib | 0.50 | -0.50 | 1.00 | 50.0 | 100.0 | 100.0 |
| isha | 2.88 | -2.88 | 31.00 | 45.6 | 92.1 | 92.1 |
| **all** | 0.89 | -0.72 | 31.00 | 50.0 | 98.7 | 98.7 |

**pooled 2026-2028** (6576 prayer-days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.50 | -0.50 | 1.00 | 50.1 | 100.0 | 100.0 |
| sunrise | 0.52 | 0.52 | 1.00 | 47.8 | 100.0 | 100.0 |
| dhuhr | 0.52 | -0.52 | 1.00 | 47.9 | 100.0 | 100.0 |
| asr | 0.48 | -0.48 | 1.00 | 52.0 | 100.0 | 100.0 |
| maghrib | 0.51 | -0.51 | 1.00 | 49.4 | 100.0 | 100.0 |
| isha | 2.92 | -2.92 | 31.00 | 45.3 | 92.0 | 92.0 |
| **all** | 0.91 | -0.73 | 31.00 | 48.8 | 98.7 | 98.7 |

### AE-AWQAF - Dubai

Dubai (adhan preset) vs UAE AWQAF federal feed. Dubai 25.2048, 55.2708, Asia/Dubai. Authority grade A.
Known gap: preset halves are -3/+3/+3/+3 against the authority 0/-3/+2/0/+2/-1.
asr: preset shafi, authority shafi (match).

Recipe: fajr {"angle":18.2}, isha {"kind":"angle","angle":18.2}.
Margins {"fajr":0,"sunrise":-3,"dhuhr":2,"asr":0,"maghrib":2,"isha":-1}, rounding {"fajr":"nearest","sunrise":"down","dhuhr":"nearest","asr":"nearest","maghrib":"nearest","isha":"nearest"}.

**2026** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| sunrise | 0.50 | 0.50 | 1.00 | 49.6 | 100.0 | 100.0 |
| dhuhr | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| asr | 3.00 | 3.00 | 3.00 | 0.0 | 0.0 | 0.0 |
| maghrib | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| isha | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| **all** | 1.08 | 1.08 | 3.00 | 24.9 | 83.3 | 83.3 |

**2027** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| sunrise | 0.47 | 0.47 | 1.00 | 52.6 | 100.0 | 100.0 |
| dhuhr | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| asr | 3.00 | 3.00 | 3.00 | 0.0 | 0.0 | 0.0 |
| maghrib | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| isha | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| **all** | 1.08 | 1.08 | 3.00 | 25.4 | 83.3 | 83.3 |

**2028** (366 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| sunrise | 0.49 | 0.49 | 1.00 | 51.4 | 100.0 | 100.0 |
| dhuhr | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| asr | 3.00 | 3.00 | 3.00 | 0.0 | 0.0 | 0.0 |
| maghrib | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| isha | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| **all** | 1.08 | 1.08 | 3.00 | 25.2 | 83.3 | 83.3 |

**pooled 2026-2028** (6576 prayer-days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| sunrise | 0.49 | 0.49 | 1.00 | 51.2 | 100.0 | 100.0 |
| dhuhr | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| asr | 3.00 | 3.00 | 3.00 | 0.0 | 0.0 | 0.0 |
| maghrib | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| isha | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| **all** | 1.08 | 1.08 | 3.00 | 25.2 | 83.3 | 83.3 |

### QA-MOI - Qatar

Qatar (adhan preset) vs Ministry of Interior Doha. Doha 25.25, 51.6, Asia/Qatar. Authority grade A.
asr: preset shafi, authority shafi (match).

Recipe: fajr {"angle":18}, isha {"kind":"intervalAfterRounding","interval":90}.
Margins {"fajr":1,"sunrise":1,"dhuhr":0,"asr":0.5,"maghrib":1,"isha":0}, rounding {"fajr":"nearest","sunrise":"nearest","dhuhr":"nearest","asr":"nearest","maghrib":"nearest","isha":"nearest"}.

**2026** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 1.00 | -1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| sunrise | 1.00 | -1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| dhuhr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| asr | 0.46 | -0.46 | 1.00 | 53.7 | 100.0 | 100.0 |
| maghrib | 1.00 | -1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| isha | 1.00 | -1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| **all** | 0.74 | -0.74 | 1.00 | 25.6 | 100.0 | 100.0 |

**2027** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 1.00 | -1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| sunrise | 1.00 | -1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| dhuhr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| asr | 0.45 | -0.45 | 1.00 | 55.3 | 100.0 | 100.0 |
| maghrib | 1.00 | -1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| isha | 1.00 | -1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| **all** | 0.74 | -0.74 | 1.00 | 25.9 | 100.0 | 100.0 |

**2028** (366 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 1.00 | -1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| sunrise | 1.00 | -1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| dhuhr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| asr | 0.46 | -0.46 | 1.00 | 54.4 | 100.0 | 100.0 |
| maghrib | 1.00 | -1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| isha | 1.00 | -1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| **all** | 0.74 | -0.74 | 1.00 | 25.7 | 100.0 | 100.0 |

**pooled 2026-2028** (6576 prayer-days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 1.00 | -1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| sunrise | 1.00 | -1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| dhuhr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| asr | 0.46 | -0.46 | 1.00 | 54.5 | 100.0 | 100.0 |
| maghrib | 1.00 | -1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| isha | 1.00 | -1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| **all** | 0.74 | -0.74 | 1.00 | 25.7 | 100.0 | 100.0 |

### KW-AJIRI - Kuwait

Kuwait (adhan preset) vs Al-Ajiri official calendar. Kuwait City 29.3759, 47.9774, Asia/Kuwait. Authority grade provisional.
asr: preset shafi, authority shafi (match).

Recipe: fajr {"angle":18}, isha {"kind":"angle","angle":17.5}.
Margins {"fajr":0,"sunrise":0,"dhuhr":0,"asr":0,"maghrib":0,"isha":0}, rounding {"fajr":"down","sunrise":"down","dhuhr":"nearest","asr":"nearest","maghrib":"nearest","isha":"nearest"}.

**2026** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.52 | 0.52 | 1.00 | 47.9 | 100.0 | 100.0 |
| sunrise | 0.52 | 0.52 | 1.00 | 48.5 | 100.0 | 100.0 |
| dhuhr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| asr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| maghrib | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| isha | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| **all** | 0.17 | 0.17 | 1.00 | 82.7 | 100.0 | 100.0 |

**2027** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.50 | 0.50 | 1.00 | 49.9 | 100.0 | 100.0 |
| sunrise | 0.50 | 0.50 | 1.00 | 50.1 | 100.0 | 100.0 |
| dhuhr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| asr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| maghrib | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| isha | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| **all** | 0.17 | 0.17 | 1.00 | 83.3 | 100.0 | 100.0 |

**2028** (366 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.49 | 0.49 | 1.00 | 50.5 | 100.0 | 100.0 |
| sunrise | 0.48 | 0.48 | 1.00 | 51.9 | 100.0 | 100.0 |
| dhuhr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| asr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| maghrib | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| isha | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| **all** | 0.16 | 0.16 | 1.00 | 83.7 | 100.0 | 100.0 |

**pooled 2026-2028** (6576 prayer-days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.51 | 0.51 | 1.00 | 49.5 | 100.0 | 100.0 |
| sunrise | 0.50 | 0.50 | 1.00 | 50.2 | 100.0 | 100.0 |
| dhuhr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| asr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| maghrib | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| isha | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| **all** | 0.17 | 0.17 | 1.00 | 83.3 | 100.0 | 100.0 |

### TR-DIYANET-DOMESTIC - Turkey

Turkey (adhan preset) vs Diyanet domestic tables. Istanbul 41.0082, 28.9784, Europe/Istanbul. Authority grade A.
Known gap: the preset carries the same temkin, so the question is how close that lands.
asr: preset shafi, authority shafi (match).

Recipe: fajr {"angle":18}, isha {"kind":"angle","angle":17}.
Margins {"fajr":0,"sunrise":-7,"dhuhr":5,"asr":4,"maghrib":7,"isha":0}, rounding {"fajr":"nearest","sunrise":"nearest","dhuhr":"nearest","asr":"nearest","maghrib":"nearest","isha":"nearest"}.

**2026** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| sunrise | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| dhuhr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| asr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| maghrib | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| isha | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| **all** | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |

**2027** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| sunrise | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| dhuhr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| asr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| maghrib | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| isha | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| **all** | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |

**2028** (366 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| sunrise | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| dhuhr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| asr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| maghrib | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| isha | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| **all** | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |

**pooled 2026-2028** (6576 prayer-days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| sunrise | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| dhuhr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| asr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| maghrib | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| isha | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| **all** | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |

### SG-MUIS - Singapore

Singapore (adhan preset) vs MUIS. Singapore 1.3521, 103.8198, Asia/Singapore. Authority grade A.
Known gap: preset ships the ceiling and dhuhr +1 only, and the other five +1 margins are ours.
asr: preset shafi, authority shafi (match).

Recipe: fajr {"angle":20}, isha {"kind":"angle","angle":18}.
Margins {"fajr":1,"sunrise":1,"dhuhr":2,"asr":1,"maghrib":1,"isha":1}, rounding {"fajr":"up","sunrise":"up","dhuhr":"up","asr":"up","maghrib":"up","isha":"up"}.

**2026** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.98 | -0.98 | 1.00 | 1.6 | 100.0 | 100.0 |
| sunrise | 0.96 | -0.96 | 1.00 | 3.8 | 100.0 | 100.0 |
| dhuhr | 1.00 | -1.00 | 1.00 | 0.3 | 100.0 | 100.0 |
| asr | 0.98 | -0.98 | 1.00 | 1.9 | 100.0 | 100.0 |
| maghrib | 0.98 | -0.98 | 1.00 | 1.9 | 100.0 | 100.0 |
| isha | 0.99 | -0.99 | 1.00 | 1.4 | 100.0 | 100.0 |
| **all** | 0.98 | -0.98 | 1.00 | 1.8 | 100.0 | 100.0 |

**2027** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.99 | -0.99 | 1.00 | 0.8 | 100.0 | 100.0 |
| sunrise | 0.99 | -0.99 | 1.00 | 1.4 | 100.0 | 100.0 |
| dhuhr | 0.99 | -0.99 | 1.00 | 1.1 | 100.0 | 100.0 |
| asr | 0.98 | -0.98 | 1.00 | 1.6 | 100.0 | 100.0 |
| maghrib | 0.98 | -0.98 | 1.00 | 1.9 | 100.0 | 100.0 |
| isha | 0.98 | -0.98 | 1.00 | 1.6 | 100.0 | 100.0 |
| **all** | 0.99 | -0.99 | 1.00 | 1.4 | 100.0 | 100.0 |

**2028** (366 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.97 | -0.97 | 1.00 | 2.7 | 100.0 | 100.0 |
| sunrise | 0.98 | -0.98 | 1.00 | 2.2 | 100.0 | 100.0 |
| dhuhr | 0.98 | -0.98 | 1.00 | 2.5 | 100.0 | 100.0 |
| asr | 0.98 | -0.98 | 1.00 | 2.5 | 100.0 | 100.0 |
| maghrib | 0.98 | -0.98 | 1.00 | 1.6 | 100.0 | 100.0 |
| isha | 0.98 | -0.98 | 1.00 | 1.9 | 100.0 | 100.0 |
| **all** | 0.98 | -0.98 | 1.00 | 2.2 | 100.0 | 100.0 |

**pooled 2026-2028** (6576 prayer-days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.98 | -0.98 | 1.00 | 1.7 | 100.0 | 100.0 |
| sunrise | 0.98 | -0.98 | 1.00 | 2.5 | 100.0 | 100.0 |
| dhuhr | 0.99 | -0.99 | 1.00 | 1.3 | 100.0 | 100.0 |
| asr | 0.98 | -0.98 | 1.00 | 2.0 | 100.0 | 100.0 |
| maghrib | 0.98 | -0.98 | 1.00 | 1.8 | 100.0 | 100.0 |
| isha | 0.98 | -0.98 | 1.00 | 1.6 | 100.0 | 100.0 |
| **all** | 0.98 | -0.98 | 1.00 | 1.8 | 100.0 | 100.0 |

### IR-NATIONAL - Tehran

Tehran (adhan preset) vs the Iran national table. Tehran 35.6892, 51.389, Asia/Tehran. Authority grade provisional.
Known gap: preset fajr 17.70 vs 17.71, maghrib 4.50 vs 4.47, and an isha row the authority does not print.
asr: preset shafi, authority not stated (n/a).

Recipe: fajr {"angle":17.71}, isha {"kind":"notPublished"}, maghrib {"angle":4.47}.
Margins {"fajr":0,"maghrib":0}, rounding {"fajr":"nearest","maghrib":"nearest"}.

**2026** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.05 | 0.05 | 1.00 | 95.1 | 100.0 | 100.0 |
| maghrib | 0.14 | 0.14 | 1.00 | 86.0 | 100.0 | 100.0 |
| **all** | 0.09 | 0.09 | 1.00 | 90.5 | 100.0 | 100.0 |

**2027** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.07 | 0.07 | 1.00 | 93.4 | 100.0 | 100.0 |
| maghrib | 0.21 | 0.21 | 1.00 | 79.5 | 100.0 | 100.0 |
| **all** | 0.14 | 0.14 | 1.00 | 86.4 | 100.0 | 100.0 |

**2028** (366 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.04 | 0.04 | 1.00 | 95.6 | 100.0 | 100.0 |
| maghrib | 0.14 | 0.14 | 1.00 | 85.8 | 100.0 | 100.0 |
| **all** | 0.09 | 0.09 | 1.00 | 90.7 | 100.0 | 100.0 |

**pooled 2026-2028** (2192 prayer-days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.05 | 0.05 | 1.00 | 94.7 | 100.0 | 100.0 |
| maghrib | 0.16 | 0.16 | 1.00 | 83.8 | 100.0 | 100.0 |
| **all** | 0.11 | 0.11 | 1.00 | 89.2 | 100.0 | 100.0 |

### PK-DEFACTO - Karachi

Karachi (adhan preset) vs Pakistan community de facto. Karachi 24.86, 67.01, Asia/Karachi. Authority grade community de facto.
asr: preset hanafi, authority hanafi (match).

Recipe: fajr {"angle":18}, isha {"kind":"angle","angle":18}.
Margins {"fajr":0,"sunrise":0,"dhuhr":0,"asr":0,"maghrib":0,"isha":0}, rounding {"fajr":"nearest","sunrise":"nearest","dhuhr":"nearest","asr":"nearest","maghrib":"nearest","isha":"nearest"}.

**2026** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| sunrise | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| dhuhr | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| asr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| maghrib | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| isha | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| **all** | 0.17 | 0.17 | 1.00 | 83.3 | 100.0 | 100.0 |

**2027** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| sunrise | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| dhuhr | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| asr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| maghrib | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| isha | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| **all** | 0.17 | 0.17 | 1.00 | 83.3 | 100.0 | 100.0 |

**2028** (366 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| sunrise | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| dhuhr | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| asr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| maghrib | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| isha | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| **all** | 0.17 | 0.17 | 1.00 | 83.3 | 100.0 | 100.0 |

**pooled 2026-2028** (6576 prayer-days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| sunrise | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| dhuhr | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| asr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| maghrib | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| isha | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| **all** | 0.17 | 0.17 | 1.00 | 83.3 | 100.0 | 100.0 |

### IN-DEFACTO - Karachi

Karachi (adhan preset) vs India community de facto. Delhi 28.61, 77.21, Asia/Kolkata. Authority grade community de facto.
asr: preset hanafi, authority hanafi (match).

Recipe: fajr {"angle":18}, isha {"kind":"angle","angle":18}.
Margins {"fajr":0,"sunrise":0,"dhuhr":0,"asr":0,"maghrib":0,"isha":0}, rounding {"fajr":"nearest","sunrise":"nearest","dhuhr":"nearest","asr":"nearest","maghrib":"nearest","isha":"nearest"}.

**2026** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| sunrise | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| dhuhr | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| asr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| maghrib | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| isha | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| **all** | 0.17 | 0.17 | 1.00 | 83.3 | 100.0 | 100.0 |

**2027** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| sunrise | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| dhuhr | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| asr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| maghrib | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| isha | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| **all** | 0.17 | 0.17 | 1.00 | 83.3 | 100.0 | 100.0 |

**2028** (366 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| sunrise | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| dhuhr | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| asr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| maghrib | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| isha | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| **all** | 0.17 | 0.17 | 1.00 | 83.3 | 100.0 | 100.0 |

**pooled 2026-2028** (6576 prayer-days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| sunrise | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| dhuhr | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| asr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| maghrib | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| isha | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| **all** | 0.17 | 0.17 | 1.00 | 83.3 | 100.0 | 100.0 |

### MY-JAKIM - Karachi

BONUS: Karachi (adhan preset) vs JAKIM WLY01 Kuala Lumpur. Kuala Lumpur 3.139, 101.6869, Asia/Kuala_Lumpur. Authority grade provisional.
asr: preset hanafi, authority shafi (mismatch).

Recipe: fajr {"angle":18}, isha {"kind":"angle","angle":18}.
Margins {"fajr":2,"sunrise":-1,"dhuhr":1.5,"asr":2,"maghrib":0,"isha":2}, rounding {"fajr":"up","sunrise":"down","dhuhr":"nearest","asr":"up","maghrib":"up","isha":"up"}.

**2026** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 2.47 | -2.47 | 3.00 | 0.0 | 0.0 | 53.4 |
| sunrise | 1.51 | 1.51 | 2.00 | 0.0 | 48.8 | 100.0 |
| dhuhr | 0.49 | -0.49 | 1.00 | 51.0 | 100.0 | 100.0 |
| asr | 59.18 | 59.18 | 72.00 | 0.0 | 0.0 | 0.0 |
| maghrib | 0.47 | -0.47 | 1.00 | 53.2 | 100.0 | 100.0 |
| isha | 2.48 | -2.48 | 3.00 | 0.0 | 0.0 | 52.3 |
| **all** | 11.10 | 9.13 | 72.00 | 17.4 | 41.5 | 67.6 |

**2027** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 2.47 | -2.47 | 3.00 | 0.0 | 0.0 | 52.9 |
| sunrise | 1.53 | 1.53 | 2.00 | 0.0 | 46.8 | 100.0 |
| dhuhr | 0.50 | -0.50 | 1.00 | 50.4 | 100.0 | 100.0 |
| asr | 59.21 | 59.21 | 72.00 | 0.0 | 0.0 | 0.0 |
| maghrib | 0.46 | -0.46 | 1.00 | 53.7 | 100.0 | 100.0 |
| isha | 2.47 | -2.47 | 3.00 | 0.0 | 0.0 | 52.6 |
| **all** | 11.11 | 9.14 | 72.00 | 17.4 | 41.1 | 67.6 |

**2028** (366 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 2.47 | -2.47 | 3.00 | 0.0 | 0.0 | 53.3 |
| sunrise | 1.53 | 1.53 | 2.00 | 0.0 | 46.7 | 100.0 |
| dhuhr | 0.49 | -0.49 | 1.00 | 51.4 | 100.0 | 100.0 |
| asr | 59.17 | 59.17 | 72.00 | 0.0 | 0.0 | 0.0 |
| maghrib | 0.43 | -0.43 | 1.00 | 56.6 | 100.0 | 100.0 |
| isha | 2.49 | -2.49 | 3.00 | 0.0 | 0.0 | 51.1 |
| **all** | 11.10 | 9.14 | 72.00 | 18.0 | 41.1 | 67.4 |

**pooled 2026-2028** (6576 prayer-days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 2.47 | -2.47 | 3.00 | 0.0 | 0.0 | 53.2 |
| sunrise | 1.53 | 1.53 | 2.00 | 0.0 | 47.4 | 100.0 |
| dhuhr | 0.49 | -0.49 | 1.00 | 50.9 | 100.0 | 100.0 |
| asr | 59.19 | 59.19 | 72.00 | 0.0 | 0.0 | 0.0 |
| maghrib | 0.46 | -0.46 | 1.00 | 54.5 | 100.0 | 100.0 |
| isha | 2.48 | -2.48 | 3.00 | 0.0 | 0.0 | 52.0 |
| **all** | 11.10 | 9.14 | 72.00 | 17.6 | 41.2 | 67.5 |

### EG-ESA - Egyptian

Egyptian (adhan preset) vs Egyptian General Authority. Cairo 30.0444, 31.2357, Africa/Cairo. Authority grade A.
Known gap: preset ships dhuhr +1 and the authority zeroes it.
asr: preset shafi, authority shafi (match).

Recipe: fajr {"angle":19.5}, isha {"kind":"angle","angle":17.5}.
Margins {"fajr":0,"sunrise":0,"dhuhr":0,"asr":0,"maghrib":0,"isha":0}, rounding {"fajr":"nearest","sunrise":"nearest","dhuhr":"nearest","asr":"nearest","maghrib":"nearest","isha":"nearest"}.

**2026** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| sunrise | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| dhuhr | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| asr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| maghrib | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| isha | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| **all** | 0.17 | 0.17 | 1.00 | 83.3 | 100.0 | 100.0 |

**2027** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| sunrise | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| dhuhr | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| asr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| maghrib | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| isha | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| **all** | 0.17 | 0.17 | 1.00 | 83.3 | 100.0 | 100.0 |

**2028** (366 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| sunrise | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| dhuhr | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| asr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| maghrib | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| isha | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| **all** | 0.17 | 0.17 | 1.00 | 83.3 | 100.0 | 100.0 |

**pooled 2026-2028** (6576 prayer-days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| sunrise | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| dhuhr | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| asr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| maghrib | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| isha | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| **all** | 0.17 | 0.17 | 1.00 | 83.3 | 100.0 | 100.0 |

### US-COMMUNITY - NorthAmerica

NorthAmerica (adhan preset) vs the US community default 15/15, New York. New York 40.71, -74.01, America/New_York. Authority grade community.
Caveat: reference point is the practice map 15/15 row, and that New York mosque prints Hanafi asr, carried as a flag only.
asr: preset shafi, authority shafi (match).

Recipe: fajr {"angle":15}, isha {"kind":"angle","angle":15}.
Margins {"fajr":0,"sunrise":0,"dhuhr":0,"asr":0,"maghrib":0,"isha":0}, rounding {"fajr":"nearest","sunrise":"nearest","dhuhr":"nearest","asr":"nearest","maghrib":"nearest","isha":"nearest"}.

**2026** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| sunrise | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| dhuhr | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| asr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| maghrib | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| isha | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| **all** | 0.17 | 0.17 | 1.00 | 83.3 | 100.0 | 100.0 |

**2027** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| sunrise | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| dhuhr | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| asr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| maghrib | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| isha | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| **all** | 0.17 | 0.17 | 1.00 | 83.3 | 100.0 | 100.0 |

**2028** (366 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| sunrise | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| dhuhr | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| asr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| maghrib | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| isha | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| **all** | 0.17 | 0.17 | 1.00 | 83.3 | 100.0 | 100.0 |

**pooled 2026-2028** (6576 prayer-days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| sunrise | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| dhuhr | 1.00 | 1.00 | 1.00 | 0.0 | 100.0 | 100.0 |
| asr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| maghrib | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| isha | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| **all** | 0.17 | 0.17 | 1.00 | 83.3 | 100.0 | 100.0 |

### GB-LONDON - MoonsightingCommittee

MoonsightingCommittee (adhan preset) vs London published minutes. London 51.5074, -0.1278, Europe/London. Authority grade A.
Caveat: authority prints both shadows, the Shafi row carries +2 and the preset is Shafi. Never a recipe: the target is the publisher's own minute.
asr: preset shafi, authority shafi (match).
Target: real published minute table, 4,383 days (2027 + 2028-2038 truth), never a recipe.

**2027** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 2.95 | 0.92 | 7.00 | 9.6 | 27.7 | 43.3 |
| sunrise | 2.99 | 2.99 | 4.00 | 0.0 | 0.0 | 18.4 |
| dhuhr | 0.01 | 0.01 | 1.00 | 98.9 | 100.0 | 100.0 |
| asr | 1.99 | -1.99 | 4.00 | 4.7 | 39.5 | 61.1 |
| maghrib | 0.36 | -0.03 | 1.00 | 64.1 | 100.0 | 100.0 |
| isha | 4.42 | -3.94 | 11.00 | 1.9 | 6.3 | 23.0 |
| **all** | 2.12 | -0.34 | 11.00 | 29.9 | 45.6 | 57.6 |

**2028** (366 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 2.94 | 0.91 | 7.00 | 9.0 | 29.0 | 43.4 |
| sunrise | 2.97 | 2.97 | 4.00 | 0.0 | 0.0 | 18.9 |
| dhuhr | 0.01 | 0.01 | 1.00 | 99.2 | 100.0 | 100.0 |
| asr | 1.99 | -1.99 | 4.00 | 4.4 | 39.6 | 62.0 |
| maghrib | 0.36 | 0.01 | 1.00 | 63.7 | 100.0 | 100.0 |
| isha | 4.24 | -3.85 | 11.00 | 2.5 | 8.5 | 30.3 |
| **all** | 2.09 | -0.32 | 11.00 | 29.8 | 46.2 | 59.1 |

**2029** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 2.95 | 0.93 | 8.00 | 9.9 | 27.9 | 43.0 |
| sunrise | 3.01 | 3.01 | 4.00 | 0.0 | 0.0 | 18.1 |
| dhuhr | 0.01 | 0.00 | 1.00 | 99.2 | 100.0 | 100.0 |
| asr | 2.00 | -2.00 | 4.00 | 5.2 | 37.8 | 62.2 |
| maghrib | 0.42 | -0.01 | 1.00 | 57.8 | 100.0 | 100.0 |
| isha | 4.41 | -3.90 | 10.00 | 1.9 | 5.8 | 20.5 |
| **all** | 2.13 | -0.33 | 10.00 | 29.0 | 45.3 | 57.3 |

**2030** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 2.98 | 0.91 | 7.00 | 9.3 | 27.9 | 42.7 |
| sunrise | 2.99 | 2.99 | 4.00 | 0.0 | 0.0 | 18.6 |
| dhuhr | 0.01 | 0.00 | 1.00 | 98.6 | 100.0 | 100.0 |
| asr | 1.97 | -1.97 | 4.00 | 6.6 | 39.2 | 61.9 |
| maghrib | 0.37 | 0.01 | 1.00 | 62.7 | 100.0 | 100.0 |
| isha | 4.40 | -3.92 | 11.00 | 1.6 | 6.0 | 22.5 |
| **all** | 2.12 | -0.33 | 11.00 | 29.8 | 45.5 | 57.6 |

**2031** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 2.95 | 0.93 | 7.00 | 10.1 | 26.8 | 43.6 |
| sunrise | 3.02 | 3.02 | 4.00 | 0.0 | 0.0 | 17.5 |
| dhuhr | 0.01 | 0.00 | 1.00 | 98.9 | 100.0 | 100.0 |
| asr | 1.99 | -1.99 | 4.00 | 4.4 | 38.9 | 61.1 |
| maghrib | 0.39 | -0.04 | 1.00 | 60.8 | 100.0 | 100.0 |
| isha | 4.43 | -3.95 | 11.00 | 1.9 | 6.0 | 22.7 |
| **all** | 2.13 | -0.34 | 11.00 | 29.4 | 45.3 | 57.5 |

**2032** (366 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 2.95 | 0.93 | 7.00 | 9.0 | 28.7 | 44.8 |
| sunrise | 2.98 | 2.98 | 4.00 | 0.0 | 0.0 | 17.5 |
| dhuhr | 0.01 | 0.01 | 1.00 | 98.6 | 100.0 | 100.0 |
| asr | 1.99 | -1.99 | 4.00 | 4.6 | 39.3 | 61.5 |
| maghrib | 0.33 | 0.01 | 1.00 | 66.7 | 100.0 | 100.0 |
| isha | 4.27 | -3.86 | 11.00 | 2.5 | 8.5 | 29.8 |
| **all** | 2.09 | -0.32 | 11.00 | 30.2 | 46.1 | 58.9 |

**2033** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 2.95 | 0.93 | 7.00 | 9.9 | 28.2 | 43.6 |
| sunrise | 3.02 | 3.02 | 4.00 | 0.0 | 0.0 | 17.8 |
| dhuhr | 0.01 | 0.00 | 1.00 | 99.5 | 100.0 | 100.0 |
| asr | 2.01 | -2.01 | 4.00 | 4.9 | 38.9 | 61.6 |
| maghrib | 0.42 | -0.02 | 1.00 | 58.1 | 100.0 | 100.0 |
| isha | 4.40 | -3.91 | 11.00 | 1.6 | 5.8 | 21.6 |
| **all** | 2.13 | -0.33 | 11.00 | 29.0 | 45.5 | 57.4 |

**2034** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 2.97 | 0.93 | 7.00 | 9.9 | 27.9 | 42.7 |
| sunrise | 2.99 | 2.99 | 4.00 | 0.0 | 0.0 | 18.9 |
| dhuhr | 0.00 | 0.00 | 1.00 | 99.7 | 100.0 | 100.0 |
| asr | 1.99 | -1.99 | 4.00 | 6.6 | 38.4 | 61.4 |
| maghrib | 0.37 | 0.02 | 1.00 | 63.3 | 100.0 | 100.0 |
| isha | 4.38 | -3.90 | 11.00 | 1.9 | 7.1 | 22.7 |
| **all** | 2.12 | -0.32 | 11.00 | 30.2 | 45.6 | 57.6 |

**2035** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 2.96 | 0.92 | 7.00 | 10.1 | 26.8 | 43.6 |
| sunrise | 3.01 | 3.01 | 4.00 | 0.0 | 0.0 | 17.5 |
| dhuhr | 0.01 | 0.01 | 1.00 | 98.9 | 100.0 | 100.0 |
| asr | 1.98 | -1.98 | 4.00 | 4.4 | 39.2 | 61.6 |
| maghrib | 0.39 | -0.01 | 1.00 | 60.8 | 100.0 | 100.0 |
| isha | 4.42 | -3.95 | 11.00 | 1.9 | 6.0 | 21.9 |
| **all** | 2.13 | -0.34 | 11.00 | 29.4 | 45.3 | 57.4 |

**2036** (366 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 2.93 | 0.92 | 7.00 | 9.6 | 27.9 | 43.4 |
| sunrise | 2.96 | 2.96 | 4.00 | 0.0 | 0.0 | 18.6 |
| dhuhr | 0.01 | 0.00 | 1.00 | 99.2 | 100.0 | 100.0 |
| asr | 1.99 | -1.99 | 4.00 | 4.9 | 38.8 | 61.5 |
| maghrib | 0.33 | 0.02 | 1.00 | 66.7 | 100.0 | 100.0 |
| isha | 4.26 | -3.85 | 11.00 | 2.2 | 9.3 | 29.5 |
| **all** | 2.08 | -0.32 | 11.00 | 30.4 | 46.0 | 58.8 |

**2037** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 2.97 | 0.93 | 7.00 | 9.6 | 27.4 | 43.8 |
| sunrise | 3.02 | 3.02 | 4.00 | 0.0 | 0.0 | 17.8 |
| dhuhr | 0.01 | 0.00 | 1.00 | 98.9 | 100.0 | 100.0 |
| asr | 1.99 | -1.99 | 4.00 | 4.7 | 39.5 | 61.9 |
| maghrib | 0.40 | -0.02 | 1.00 | 59.7 | 100.0 | 100.0 |
| isha | 4.39 | -3.89 | 11.00 | 1.6 | 6.0 | 21.4 |
| **all** | 2.13 | -0.33 | 11.00 | 29.1 | 45.5 | 57.5 |

**2038** (365 days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 2.94 | 0.93 | 7.00 | 10.4 | 28.5 | 42.7 |
| sunrise | 3.02 | 3.02 | 4.00 | 0.0 | 0.0 | 17.0 |
| dhuhr | 0.01 | 0.00 | 1.00 | 98.6 | 100.0 | 100.0 |
| asr | 1.99 | -1.99 | 4.00 | 6.0 | 38.4 | 61.4 |
| maghrib | 0.35 | 0.01 | 1.00 | 65.5 | 100.0 | 100.0 |
| isha | 4.38 | -3.90 | 11.00 | 1.4 | 8.2 | 23.3 |
| **all** | 2.12 | -0.32 | 11.00 | 30.3 | 45.8 | 57.4 |

**pooled 2027-2038** (26298 prayer-days)

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 2.95 | 0.92 | 8.00 | 9.7 | 27.9 | 43.4 |
| sunrise | 3.00 | 3.00 | 4.00 | 0.0 | 0.0 | 18.0 |
| dhuhr | 0.01 | 0.00 | 1.00 | 99.0 | 100.0 | 100.0 |
| asr | 1.99 | -1.99 | 4.00 | 5.1 | 38.9 | 61.6 |
| maghrib | 0.38 | -0.01 | 1.00 | 62.5 | 100.0 | 100.0 |
| isha | 4.37 | -3.90 | 11.00 | 1.9 | 7.0 | 24.1 |
| **all** | 2.12 | -0.33 | 11.00 | 29.7 | 45.6 | 57.9 |

## Preset against the publishers' raw captures

The same presets against the machine-readable captures held in the census tree, so the
fitted recipe and the publisher's own printed minute can be read side by side. The preset
is evaluated at the capture's own point, which for Dubai is the AWQAF area coordinate
rather than the fitted point, so the raw column carries a coordinate difference as well.
The pooled row covers the whole capture. Saudi's capture opens with a 2025 tail and ends
in spring 2028, and the UAE's 2027 half stops on 2027-06-05. The per-year rows show each
split.

### Side by side: preset vs recipe and preset vs the publisher

Pooled mean absolute deviation per row. `recipe` is the policy-layer target at its own
point, `raw` is the publisher's printed minute at the capture point.

| Pair | Side | fajr | sunrise | dhuhr | asr | maghrib | isha | all | days |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SA-KACST | recipe | 0.50 | 0.52 | 0.52 | 0.48 | 0.51 | 2.92 | 0.91 | 6576 |
| SA-KACST | raw | 0.56 | 0.51 | 0.53 | 0.53 | 0.51 | 2.99 | 0.94 | 1064 |
| AE-AWQAF | recipe | 0.00 | 0.49 | 1.00 | 3.00 | 1.00 | 1.00 | 1.08 | 6576 |
| AE-AWQAF | raw | 0.54 | 1.07 | 0.88 | 2.82 | 0.43 | 0.90 | 1.11 | 521 |
| QA-MOI | recipe | 1.00 | 1.00 | 0.00 | 0.46 | 1.00 | 1.00 | 0.74 | 6576 |
| QA-MOI | raw | 1.11 | 1.00 | 0.00 | 0.89 | 0.93 | 0.93 | 0.81 | 28 |

### SA-KACST raw - KACST GetPrayerHijriYear, Hijri 1447-1449

Point UmmAlQura at Makkah 21.4267/39.8317, 21.4267, 39.8317, Asia/Riyadh. 1064 published days,
2025-06-26 to 2028-05-24, from `s1-saudi`.

| period | days | fajr | sunrise | dhuhr | asr | maghrib | isha | all |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2025 | 189 | 0.83 | 0.48 | 0.53 | 0.81 | 0.56 | 0.56 | 0.63 |
| 2026 | 365 | 0.57 | 0.52 | 0.53 | 0.52 | 0.50 | 2.96 | 0.93 |
| 2027 | 365 | 0.56 | 0.50 | 0.54 | 0.53 | 0.53 | 2.91 | 0.93 |
| 2028 | 145 | 0.22 | 0.52 | 0.52 | 0.20 | 0.46 | 6.46 | 1.40 |
| pooled | 1064 | - | - | - | - | - | - | **0.94** |

Pooled detail:

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.56 | -0.50 | 2.00 | 43.9 | 99.8 | 100.0 |
| sunrise | 0.51 | 0.50 | 2.00 | 49.3 | 99.9 | 100.0 |
| dhuhr | 0.53 | -0.53 | 1.00 | 46.5 | 100.0 | 100.0 |
| asr | 0.53 | -0.52 | 2.00 | 48.1 | 98.9 | 100.0 |
| maghrib | 0.51 | -0.51 | 2.00 | 49.2 | 99.6 | 100.0 |
| isha | 2.99 | -2.99 | 31.00 | 44.8 | 91.4 | 91.7 |
| **all** | 0.94 | -0.76 | 31.00 | 47.0 | 98.3 | 98.6 |

### AE-AWQAF raw - AWQAF federal feed, area-level published minutes

Point Dubai (AWQAF area 32, 25.113055/55.108333), 25.113055, 55.108333, Asia/Dubai. 521 published days,
2026-01-01 to 2027-06-05, from `c19-year2/uae`.

| period | days | fajr | sunrise | dhuhr | asr | maghrib | isha | all |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026 | 365 | 0.57 | 1.08 | 0.90 | 2.76 | 0.44 | 0.89 | 1.11 |
| 2027 | 156 | 0.46 | 1.05 | 0.85 | 2.96 | 0.41 | 0.94 | 1.11 |
| pooled | 521 | - | - | - | - | - | - | **1.11** |

Pooled detail:

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 0.54 | 0.54 | 1.00 | 46.1 | 100.0 | 100.0 |
| sunrise | 1.07 | 1.07 | 2.00 | 10.7 | 82.0 | 100.0 |
| dhuhr | 0.88 | 0.88 | 2.00 | 12.5 | 99.4 | 100.0 |
| asr | 2.82 | 2.82 | 4.00 | 0.0 | 0.0 | 20.5 |
| maghrib | 0.43 | 0.43 | 1.00 | 57.0 | 100.0 | 100.0 |
| isha | 0.90 | 0.90 | 2.00 | 18.6 | 91.0 | 100.0 |
| **all** | 1.11 | 1.11 | 4.00 | 24.2 | 78.7 | 86.8 |

### QA-MOI raw - MOI portal, 31 Wayback day captures

Point Qatar at the portal point 25.25/51.6, 25.25, 51.6, Asia/Qatar. 28 published days,
2017-03-13 to 2026-07-17, from `c40-wayback`.

| period | days | fajr | sunrise | dhuhr | asr | maghrib | isha | all |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2017 | 1 | 1.00 | 1.00 | 0.00 | 0.00 | 1.00 | 1.00 | 0.67 |
| 2018 | 1 | 1.00 | 1.00 | 0.00 | 1.00 | 1.00 | 1.00 | 0.83 |
| 2019 | 8 | 1.00 | 1.00 | 0.00 | 1.00 | 0.88 | 0.88 | 0.79 |
| 2021 | 1 | 0.00 | 1.00 | 0.00 | 1.00 | 1.00 | 1.00 | 0.67 |
| 2022 | 9 | 1.22 | 1.00 | 0.00 | 0.56 | 0.89 | 0.89 | 0.76 |
| 2025 | 5 | 1.20 | 1.00 | 0.00 | 1.60 | 1.00 | 1.00 | 0.97 |
| 2026 | 3 | 1.33 | 1.00 | 0.00 | 0.67 | 1.00 | 1.00 | 0.83 |
| pooled | 28 | - | - | - | - | - | - | **0.81** |

Pooled detail:

| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 1.11 | -1.11 | 2.00 | 3.6 | 85.7 | 100.0 |
| sunrise | 1.00 | -1.00 | 2.00 | 3.6 | 96.4 | 100.0 |
| dhuhr | 0.00 | 0.00 | 0.00 | 100.0 | 100.0 | 100.0 |
| asr | 0.89 | -0.89 | 2.00 | 28.6 | 82.1 | 100.0 |
| maghrib | 0.93 | -0.93 | 1.00 | 7.1 | 100.0 | 100.0 |
| isha | 0.93 | -0.93 | 1.00 | 7.1 | 100.0 | 100.0 |
| **all** | 0.81 | -0.81 | 2.00 | 25.0 | 94.0 | 100.0 |

## The three biggest preset-versus-authority gaps

Ranked by the mean absolute deviation of a single prayer row, which is where a user feels
it. The bonus row is excluded here and reported on its own below.

1. **GB-LONDON isha**: mean 4.37 min (signed -3.90), worst 11.00, inside two minutes on 24.1 percent of 4383 days, and beyond five minutes on 1401 days.
2. **AE-AWQAF asr**: mean 3.00 min (signed 3.00), worst 3.00, inside two minutes on 0.0 percent of 1096 days.
3. **GB-LONDON sunrise**: mean 3.00 min (signed 3.00), worst 4.00, inside two minutes on 18.0 percent of 4383 days.

Runners-up: GB-LONDON fajr 2.95, SA-KACST isha 2.92, GB-LONDON asr 1.99, AE-AWQAF dhuhr 1.00.

The first and third entries are the same failure in two directions: London publishes
date-keyed interval tables that no angle formula reproduces, so the preset runs three
minutes late on sunrise and, on isha, four minutes early with a 24 percent inside-two
record and 1,401 days beyond five minutes. The second is a one-line margin error: UAE
AWQAF carries asr at zero and the preset at +3, and the result is three minutes late on
every single day, never once inside two.

The largest single-day miss in the whole study is not in that list because its mean is
diluted: Umm al-Qura's isha is 30 to 31 minutes early on each of the 88 Ramadan days of the three years,
and a fraction of a minute outside them. Print that beside the half-minute margins
everywhere else: the preset is not wrong about the year, it is missing a month.

## The same gaps read as what the package is missing

Each preset gap maps to a named part of the authority recipe that the preset does not
carry, which is the point of running the preset naked:

| Pair | What the package lacks | Size |
| --- | --- | --- |
| UmmAlQura | the +1 margin on five rows, and the Ramadan isha +120 switch | 0.5 min, and 30-31 min on 88 Ramadan days a year |
| Dubai | asr, dhuhr and maghrib margins, and the isha -1 | 3.0 min on asr, 1.0 on dhuhr and maghrib and isha |
| Qatar | the +1 margin on five rows and the +0.5 asr, and its isha is composed on raw sunset | 1.0 min on four rows, 0.5 on asr |
| Kuwait | the floor on fajr and shuruq | 0.5 min on two rows |
| Turkey | nothing measurable | zero |
| Singapore | the five +1 margins and the second dhuhr minute | 1.0 min on all six rows |
| Tehran | fajr 17.70 against 17.71, maghrib 4.50 against 4.47, and an isha row with no publisher | under 0.2 min on the two scored rows |
| Karachi (PK, IN) | nothing but the dhuhr +1 it ships | 1.0 min on dhuhr |
| Egyptian | nothing but the dhuhr +1 it ships | 1.0 min on dhuhr |
| NorthAmerica | nothing but the dhuhr +1 it ships | 1.0 min on dhuhr |
| MoonsightingCommittee | the publisher's own date-keyed interval tables | 4.4 min on isha, 3.0 on sunrise, 3.0 on fajr |

The dhuhr +1 is a package-wide constant: every preset that ships it (Muslim World League,
Egyptian, Karachi, North America) lands exactly one minute late against a recipe that
carries a zero dhuhr margin. It is a property of the package, not of the country.

## Karachi against JAKIM, the bonus row

Karachi run naked at Kuala Lumpur scores 1.48 pooled on the five non-asr
rows, 2.47 early on fajr and 2.48 early on isha, with
53.2 percent of fajr days and 52.0 percent of isha days inside two
minutes. Its asr is 59.19 late because the preset carries Karachi's Hanafi school
while JAKIM prints the Shafi shadow: a school flag, never a score. The angle pair is identical at
18/18, so the whole of the fajr and isha gap is JAKIM's two-minute ihtiyati ceiling, which
the preset does not have.

## Checks that the harness is right

Three independent confirmations, each one able to fail:

- **The Diyanet identity.** The Turkey preset scored against the Diyanet recipe is exactly
  zero on all 6576 prayer-days, every year, no rounding slack: 100 percent exact,
  worst 0. The preset's own `methodAdjustments` are byte-for-byte Diyanet's temkin and its
  rounding is Diyanet's nearest, so two independently built sides agreeing to the minute is
  the strongest proof the pipeline has: any day-slip, zone error or rounding inversion would
  show up here first.
- **Spot days against the publishers.** The first captured day of each raw source, preset
  beside published:

| Source | Day | Side | fajr | sunrise | dhuhr | asr | maghrib | isha |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SA-KACST | 2025-06-26 | preset | 04:13 | 05:41 | 12:24 | 15:43 | 19:07 | 20:37 |
| SA-KACST | 2025-06-26 | published | 04:13 | 05:40 | 12:24 | 15:44 | 19:07 | 20:37 |
| AE-AWQAF | 2026-01-01 | preset | 05:42 | 07:02 | 12:26 | 15:25 | 17:44 | 19:04 |
| AE-AWQAF | 2026-01-01 | published | 05:42 | 07:00 | 12:25 | 15:22 | 17:44 | 19:03 |
| QA-MOI | 2017-03-13 | preset | 04:29 | 05:45 | 11:43 | 15:08 | 17:42 | 19:12 |
| QA-MOI | 2017-03-13 | published | 04:30 | 05:46 | 11:43 | 15:08 | 17:43 | 19:13 |

- **Round one repeats where it should and differs where it must.** Round one recorded the
  Umm al-Qura row exactly 1.0 minute early on fajr and 1.0 on isha for 2026, with a method
  row that floored and that carried the Ramadan +120 switch. This round's preset rounds to
  nearest, so fajr lands at 0.50, and it has no switch, so isha adds the Ramadan miss on
  top. Same direction on both rows, and every difference is the rounding convention or the
  switch. Nothing in this harness reads the round-one output.

## Reproduce

```
TZ=UTC node grid.mjs
```

Writes `results.json` and this file to the same directory.

Generated 2026-11-10 by grid.mjs.
