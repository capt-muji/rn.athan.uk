# O1h seasonal audit: the annual mean as a hiding place

A method can sit inside two minutes of a country on the yearly mean and still miss every June morning by eight. This audit cuts the same 2026 scoring year into January and July and reports the two month means beside the annual one, so a decision table can see what the annual figure averages away.

## Scope and harness identity

- 48 targets, 7 methods, 672 country x method x prayer cells. Every `countries.json` entry with reference coordinates, less the special forms.
- Targets: 47 recipe targets plus London, which is scored against the published minutes rather than a recipe. Four targets carry no policy-layer object (`ID-KEMENAG`, `PK-DEFACTO`, `IN-DEFACTO`, `NG-SPA`) and are scored on the angles `countries.json` carries.
- Skipped, with reason: 20 with no reference coordinates, 3 `seasonalSweep` targets (`SI-VAKTIJA`, `AT-IZW`, `FR-GMS`), 1 `intervalTable` target (`UA-DUMU`), 1 whose fitted angles are null (`CI-COSIM`).
- Methods: `mwl`, `egyptian`, `karachi` (Hanafi asr), `moonsighting`, `mabims` (20/18), `ummalqura` (18.5, isha +90 outside Ramadan and +120 inside, 2026 window 2026-02-18 to 2026-03-19, 30 days), `diyanet-eu` (18/16). Carriers are the study's: the adhan preset verbatim where one exists, a constructed `Other` body otherwise.
- Metric: mean absolute deviation in wall-clock minutes, per prayer. Spread is the July mean minus the January mean.
- Clock convention: both sides are read on the country's IANA zone, which is how the study scores and what the brief's wall-clock rule states. The printed clocks the policy layer carries are therefore not applied. Under them Jerusalem's January mean would move 60 minutes, Morocco's annual mean about five (its Ramadan month only), and Niger's nothing. Only the Jerusalem case would change a seasonal figure here.
- London is pooled over the published 2027-2038 minutes, the only real minute series the brief carries. 2026 has no published London truth, so its January and July means come from twelve Januaries and twelve Julys.
- **Identity check.** The annual means computed here match `sim/out` on all 665 comparable cells to 0.000 minutes. The seasonal split is therefore the same harness the leaderboard ran, cut differently.

## (a) Methods ranked by worst seasonal spread

All latitudes. `worst` is the largest July-minus-January gap in any cell, `mean` and `median` are over each method's 92 cells, `>4` counts cells whose gap exceeds four minutes.

| method | worst | where | Jan to Jul | annual | mean | median | >4 |
|---|---|---|---|---|---|---|---|
| egyptian | 141.5 | United Kingdom (Wifaqul Ulama), isha | 17.4 to 158.9 | 59.4 | 11.7 | 1.4 | 28/92 |
| mwl | 141.2 | United Kingdom (Wifaqul Ulama), isha | 13.9 to 155.1 | 55.4 | 10.2 | 0.5 | 18/92 |
| karachi | 141.0 | United Kingdom (Wifaqul Ulama), isha | 20.8 to 161.8 | 63.3 | 10.9 | 0.5 | 20/92 |
| mabims | 141.0 | United Kingdom (Wifaqul Ulama), isha | 20.8 to 161.8 | 63.3 | 12.5 | 2.7 | 33/92 |
| diyanet-eu | 136.9 | United Kingdom (Wifaqul Ulama), isha | 6.9 to 143.8 | 47.1 | 10.1 | 1.2 | 20/92 |
| moonsighting | 98.4 | Russia (Tatarstan), isha | 19.5 to 118.0 | 35.7 | 14.6 | 7.5 | 53/92 |
| ummalqura | 89.8 | United Kingdom (London), fajr | 23.0 to 112.8 | 45.3 | 10.6 | 1.8 | 34/92 |

Below 50 degrees, where the high-latitude guard does not fire and the spread is pure angle or curve behaviour:

| method | worst | where | Jan to Jul | annual | mean | >4 |
|---|---|---|---|---|---|---|
| moonsighting | 41.2 | Montenegro, isha | 8.7 to 49.9 | 24.9 | 11.0 | 41/79 |
| ummalqura | 25.2 | Montenegro, isha | 8.3 to 33.5 | 16.1 | 4.6 | 23/79 |
| mabims | 14.8 | Uzbekistan, fajr | 24.5 to 39.3 | 29.2 | 2.8 | 20/79 |
| egyptian | 12.8 | Uzbekistan, fajr | 21.8 to 34.5 | 25.8 | 2.1 | 15/79 |
| karachi | 10.2 | Portugal, isha | 28.6 to 38.8 | 31.7 | 1.4 | 8/79 |
| mwl | 8.0 | Portugal, isha | 23.4 to 31.4 | 25.7 | 1.1 | 6/79 |
| diyanet-eu | 7.2 | Uzbekistan, fajr | 13.7 to 20.9 | 15.9 | 1.4 | 8/79 |

Two readings follow. The five half-night bodies above 50 are ranked by how badly they fail the same summer rule, not by any difference between them, so their position there is an artefact of one UK rule. Below 50 the ranking separates real method behaviour, and Moonsighting Committee is the outlier: 41 of its 79 cells swing more than four minutes, and its summer isha runs 30 to 54 minutes early across the Balkans, Italy, Spain and Turkey. Its median cell swings 7.5 minutes against 0.5 to 2.7 for the others.

## (b) Cells the annual mean hides

Every cell with an annual mean within two minutes and a season mean above four:

| target | method | prayer | annual | January | July |
|---|---|---|---|---|---|
| Tunisia (`TN-INM`) | moonsighting | fajr | 1.85 | 0.35 | 5.55 |

One strict cell. Loosening the annual bound to three minutes returns three more, all of the same shape: a fixed-angle authority scored against a seasonal curve or a wider angle.

| target | method | prayer | annual | January | July |
|---|---|---|---|---|---|
| Portugal (`PT-HSALAH-HUB`) | moonsighting | fajr | 2.62 | 0.32 | 8.74 |
| Greece, Athens (`GR-ATHENS`) | moonsighting | fajr | 2.05 | 0.03 | 7.55 |
| Kyrgyzstan (`KG-MUFTIYAT`) | ummalqura | fajr | 2.91 | 2.19 | 4.45 |

The Tunisia cell is verified day by day: on 2026-07-01 and 2026-07-15 the method is six minutes late, and the annual mean reads 1.85.

Masking is common even where no cell crosses both thresholds. Of the 574 cells whose annual mean exceeds 0.2 minutes, 100 (17.4 pc) have a season mean at least double the annual mean, and 136 (23.7 pc) at least 1.5 times. The extreme is Diyanet-Europe isha at Tatarstan: annual 9.8, July 49.8, a ratio of 5.1. A leaderboard keyed on the annual mean therefore understates the summer error of a sixth of the table by a factor of two or more.

## (c) The high-latitude pattern

Eight targets sit above 50 degrees. July means, January in brackets. `n/a` means the authority's own rule publishes no time that month, so no deviation can be scored.

**Fajr, July mean (January).**

| target | lat | mwl | egyptian | karachi | moonsighting | mabims | ummalqura | diyanet-eu |
|---|---|---|---|---|---|---|---|---|
| Iceland | 64.1 | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| Russia (Tatarstan) | 55.8 | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| Russia (Moscow) | 55.8 | 88 (0) | 88 (11) | 88 (0) | 65 (34) | 88 (14) | 88 (4) | 88 (0) |
| United Kingdom (Wifaqul Ulama) | 53.7 | 0 (0) | 0 (10) | 0 (0) | 112 (27) | 0 (14) | 0 (4) | 0 (0) |
| United Kingdom (London) | 51.5 | 107 (20) | 122 (29) | 107 (20) | 1 (1) | 125 (33) | 113 (23) | 107 (20) |
| Kazakhstan | 51.2 | 97 (20) | 114 (29) | 97 (20) | 8 (1) | 117 (33) | 104 (23) | 97 (20) |
| Belgium | 50.9 | 62 (0) | 81 (10) | 62 (0) | 39 (19) | 85 (13) | 69 (3) | 62 (0) |
| Czechia | 50.1 | 103 (39) | 127 (48) | 103 (39) | 11 (22) | 132 (52) | 112 (42) | 103 (39) |

**Isha, July mean (January).**

| target | lat | mwl | egyptian | karachi | moonsighting | mabims | ummalqura | diyanet-eu |
|---|---|---|---|---|---|---|---|---|
| Iceland | 64.1 | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| Russia (Tatarstan) | 55.8 | 50 (14) | 50 (18) | 50 (21) | 118 (20) | 50 (21) | 95 (24) | 50 (7) |
| Russia (Moscow) | 55.8 | 52 (15) | 52 (18) | 52 (22) | 116 (19) | 52 (22) | 94 (23) | 52 (7) |
| United Kingdom (Wifaqul Ulama) | 53.7 | 155 (14) | 159 (17) | 162 (21) | 9 (13) | 162 (21) | 25 (16) | 144 (7) |
| United Kingdom (London) | 51.5 | 131 (14) | 139 (17) | 146 (20) | 2 (7) | 146 (20) | 19 (12) | 110 (7) |
| Kazakhstan | 51.2 | 78 (13) | 87 (16) | 95 (20) | 46 (7) | 95 (20) | 29 (9) | 55 (6) |
| Belgium | 50.9 | 39 (0) | 49 (3) | 58 (7) | 80 (19) | 58 (7) | 63 (21) | 40 (6) |
| Czechia | 50.1 | 78 (32) | 90 (36) | 101 (39) | 26 (15) | 101 (39) | 10 (13) | 55 (26) |

What each method does, counted across the eight targets for July. `substituted` is the number of July prayer-days where the method's output differs from its own naked angle instant, `undefined` the days that angle never occurs at all, `dragged` the cells where an existing angle time was moved and by how much on average.

| method | substituted | undefined | cells dragged | mean drag |
|---|---|---|---|---|
| moonsighting | 1031 | 685 | 8 | 97 min |
| mabims | 825 | 825 | 0 | - |
| egyptian | 751 | 751 | 0 | - |
| karachi | 685 | 685 | 0 | - |
| mwl | 592 | 592 | 0 | - |
| diyanet-eu | 475 | 475 | 0 | - |
| ummalqura | 392 | 392 | 0 | - |

The pattern is consistent across five of the seven. MuslimWorldLeague, Egyptian, Karachi, MABIMS and the Diyanet-Europe carrier publish or implement no high-latitude bound in this study, so adhan's default middle-of-the-night rule invents fajr and isha whenever the angle vanishes, and touches nothing when it exists: eight to eleven dragged days in the whole year, every substitution an undefined angle. Diyanet-Europe's own entry documents a 45th-parallel thirds rule which a constructed `Other` body cannot express, so its high-latitude row here is the library default and must be read as such. Umm al-Qura behaves the same way on fajr, but its isha is a fixed maghrib interval, so it is the only body whose summer isha survives the latitude at all: 19 minutes at London in July and 10 at Czechia, against 131 for MuslimWorldLeague. Moonsighting Committee is the only method that rewrites an angle that exists: its season curve and seventh-of-the-night rule substitute on 1031 of the July days and drag the time by 97 minutes on average.

The United Kingdom rows carry an extra lesson. The Wifaqul-Ulama target uses half the night for fajr, which is exactly the library default, so five methods score 0.0 there in July. That is a rule coincidence, not accuracy. Its isha uses one seventh of the night, and the same five methods then sit 144 to 162 minutes late. London, scored against published minutes rather than a rule, inverts the table: Moonsighting lands 1 minute from fajr and 2 from isha, while the five half-night bodies are 107 to 125 minutes out at fajr and 110 to 146 at isha. The high-latitude verdict is therefore about which rule a method carries, not about which method is better in the abstract.

Four targets cannot be scored in July at all because their own authority publishes no time: Iceland both prayers for all 31 days, Tatarstan fajr 31 and isha 27, Moscow isha 27, Iran isha 31. A high-latitude league table built on annual means silently excludes them.

## Verdict

Moonsighting Committee is the method that hides a seasonal blowup. It is inside two minutes of the yearly mean in Tunisia and inside three in Portugal and Greece while running 5.5 to 8.7 minutes late every July morning, and below 50 degrees its summer isha misses European authorities by 30 to 54 minutes. Umm al-Qura comes close at Kyrgyzstan fajr, annual 2.91 against a July mean of 4.45, through its 18.5 degree angle alone. The five half-night bodies hide nothing at low latitude: their seasonal spread is the smallest of the set, and their damage is concentrated wholly above 50 degrees, where, outside the UK fajr coincidence, they are 62 to 132 minutes out at fajr and 144 to 162 out at isha. An annual-mean column rewards Moonsighting at exactly the countries it fails in summer.
