# The source catalog: every prayer-time source, every parameter, every conflict resolved

**Status: RESEARCH ONLY.** No app code, no builds, no dependency installed in the repository. This is R12, wave 4
of `ai/features/global-prayer-times`, written 2026-09-30 on branch `research/global-prayer-times` in the worktree
`/Users/muji/athan-global-wt`.

**What this document is.** Nine reports measured dozens of authorities at different times, with different column
sets, and they now disagree with each other in places. This document is the single consolidated catalog: one row
per source, every measured parameter in one place, every inter-report conflict resolved with a verdict, and a
specification a planning session can build against. It replaces no report; it supersedes their parameter tables.

**The machine-readable catalog is the source of truth.** Every table below marked as generated is rendered FROM
`data/catalog/sources.json` by `data/catalog/build-catalog.mjs`. The markdown is never hand-edited. Run
`node data/catalog/build-catalog.mjs --check` to prove the two have not drifted.

**Marking, per the standing rules.** **measured** means this programme computed it, and the report that computed
it is named. **cited** means a named source asserts it. **UNVERIFIED** means neither. Where R12 re-measured to
break a tie, the row says so and the loser is recorded in the conflict section so nobody re-litigates it.

**Licensing is out of scope.** The owner corresponded with the authorities and holds permission (BRIEF.md). No
section below discusses terms, copyright or licensing, and no session contacts anyone for any reason.

| Input | What it carried into this catalog |
| --- | --- |
| `agent-reports/R1-authorities-and-conventions.md` | the first parameter sweep of every authority worldwide |
| `agent-reports/R2-country-adoption-map.md` | what mosques and states actually use; the Imsak trap both ways |
| `agent-reports/R4-apis-and-data-sources.md` | which authorities serve a whole keyless year; the correction table |
| `agent-reports/R5-country-map-completion.md` | the five tier-C giants; the temkin resolution; the population weighting |
| `agent-reports/R6-correction-table-generality.md` | the four-category classification and the rounding discovery |
| `agent-reports/R7-library-validation.md` | Egypt across 22 cities; the high-latitude spread; Canada 13/13 |
| `agent-reports/R8-product-and-app-impact.md` | the concept-to-row map and the source-identity model |
| `agent-reports/R9-remaining-countries.md` | Europe's and Africa's remainder; five corrections to earlier reports |
| `agent-reports/R3-offline-libraries.md` | the library and its polar behaviour |
| R11, running in parallel | the high-latitude rule catalogue. Rule names here are placeholders pending it |

---

## Findings in one page

1. **The catalog holds 39 sources across 30 countries, and 29 of them are tier A outright.** Ten are keyless
   whole-year authority feeds. One is exactly computable, fourteen are computable plus constants, one is seasonal,
   one is genuinely irregular, and that last one is the app's own current London source. Twenty-two carry no R6
   category at all, which is the catalog's largest single gap.
2. **JAKIM is 18 degrees plus a 2-minute ihtiyati, not 20 degrees.** This is the catalog's template case and R12
   settled it by measurement. JAKIM's cited 20 is the angle of its **IMSAK** row, measured 19.93 to 20.08 across
   six zones and a full year each. Its **SUBUH** row measures 17.55 to 17.89 and reproduces at 18 degrees plus a
   correction of +1 or +2, which is the ihtiyati JAKIM's own literature documents. The 8 minutes R4 read as a
   Mufti's addition to Fajr is the Imsak-to-Fajr distance, not an addition to Fajr. Measured, R12.
3. **The same cited number binds to different rows in Malaysia and Indonesia, and that is the strongest argument
   for the concept-to-row field in the whole programme.** Both cite 20 degrees. Both print the same eight-row set
   with the same 10-minute Imsak gap. But JAKIM's 20 is its **Imsak** and Kemenag's 20 is its **Subuh**, measured
   19.40 to 20.06, with Kemenag's Imsak a derived offset that inverts to 22 degrees and is not a published angle
   at all. A map that carries only the row NAME is not sufficient. Measured, R12, new.
4. **Two authorities publish something that is not an angle and every earlier report recorded an angle.** The
   Grande Mosquée de Paris's own 366-day calendar sweeps 18.0 in December to 13.05 in June, and its Isha is
   Maghrib plus exactly 87 minutes on 278 of 366 days. Iran publishes no Isha at all. R12 reproduced the Paris
   sweep independently: whole-year Fajr range 13.03 to 18.10, Isha interval median exactly 87 minutes.
5. **A decreed offset on a common angle is a different model from an unusual angle, and the catalog now
   distinguishes them.** Turkey's flat 7-minute temkin is identical at 0 m and 1,900 m of elevation, which is what
   makes it a decree rather than a correction. Brunei's Belait district is the national table plus a decreed +3.
   JAKIM's +2 is a national ihtiyati. None of these is reachable from a coordinate, which is why a source identity
   is a zone and not a point.
6. **Two sources for one country is normal, not exceptional, and in South Africa it is worth most of an hour.**
   The Muslim Judicial Council's own Cape Town table is 18/17 with a **standard** Asr. Jamiatul Ulama KZN's fatwa
   tells users to set Karachi with a **Hanafi** Asr and Maghrib +3. R12 priced the gap across a year at both
   cities: **0 minutes on Fajr, 40 to 78 on Asr, 3 on Maghrib, 5 to 7 on Isha.** Asr is the decisive one.
7. **France needs the disambiguation worse than anywhere, and naming the authority is not enough.** R12 priced the
   two French positions at Paris against the Grande Mosquée's own calendar: Musulmans de France runs **13 to 39
   minutes later on Fajr, median 24**, and its Isha **reverses sign across the year**, 26 minutes earlier in
   December and 14 later in June. A picker must show the delta the user would actually see.
8. **Rounding is load-bearing and it is not the authority's fault.** R6 measured that `adhan`'s own nearest-minute
   default was the single biggest source of apparent disagreement with authorities in the entire programme. The
   catalog carries a rounding rule per source, and **18 of 39 rows carry it as UNVERIFIED**, because no authority
   found anywhere in the programme publishes its rounding rule. That is itself a finding.
9. **Most of the catalog's coverage is honest fallback, not authority fidelity, and the specification says so.**
   Only **38.5%** of the world's Muslims live where a convention was established at tier A, and **59.9%** have no
   national convention an app can claim to follow (R5, computed, reproduced by R12). The `computed-fallback` row
   exists because the alternative is showing most of the world nothing at all, and it must never be labelled as an
   authority.
10. **The launch set recommendation holds and the reason is stronger than R8 argued.** Malaysia first, because it
    exercises zones, a distinct Imsak, a published Duha and a whole-year keyless feed simultaneously, and because
    R12's own measurement found **two per-zone anomalies inside it** that a per-country model would have shipped
    wrong. Egypt second, because it is the only category 1 in the programme and needs no correction table at all.

---

## Part 1: the conflict reconciliations

Each conflict states both readings, gives a verdict with its reason, and records the loser so it is not
re-litigated. Sample width and whether a reading was a single day decide most of them.

### Conflict 1: Egypt, three reports and three Fajr figures

| Reading | Sample | Fajr | Isha | Report |
| --- | --- | --- | --- | --- |
| One Cairo row | 1 city, 1 day | 19.59 | 17.43 | R1 |
| Five cities | 5 cities, 1 day | 19.40 to 19.62 | 17.40 to 17.55 | R5 |
| The authority's own 78-city table | 22 cities, 1 day | **19.51** | **17.49** | R7 |
| R12 re-read, wider anchor set | **47 cities, 1 day** | **median 19.46, mean 19.47** | **median 17.46, mean 17.47** | R12 |

**Verdict: 19.5 / 17.5 stands, and it is the catalog's best-verified row.** R12 re-read the authority's own page
today and inverted 47 of the 78 city rows for which a coordinate anchor is known, gating out two cities whose
implied Dhuhr sits more than a minute from true noon and which therefore fail the anchor test. The measured spread
is **0.45 degrees on Fajr and 0.42 on Isha**, which is the authority's own one-minute rounding across 7 degrees of
latitude, not a varying angle. The discriminator that proves it is an angle rather than an interval is the
Isha-after-Maghrib gap: it spans **73 to 79 minutes across cities**, and a fixed interval could not do that.

**The loser, recorded.** R1's 19.59 / 17.43 was one city on one day. R7 named the correction itself and R12
confirms it at twice R7's sample width. R5's range brackets the truth and its midpoint is right. Nobody should
re-measure Egypt: `data/catalog/measure-egypt-tiebreak.mjs` is runnable and its output is
`data/catalog/results-egypt.txt`.

### Conflict 2: JAKIM Malaysia, 20 degrees or 18 plus a decree

This is the conflict the task named as the template, and it is the most consequential in the catalog because it
is the shape of the general question: **is an authority's unusual number an unusual angle, or a common angle plus
a decreed offset?** The two are distinguishable by measurement, and R12 distinguished them three ways.

| Reading | Source | Fajr |
| --- | --- | --- |
| JAKIM's own `Jurnal Falak`, 2015 | cited | 20 degrees |
| JAKIM's own `e-solat.gov.my` API | measured, R1, 2 dates | 17.4 to 17.6 |
| R6's fitted correction against a 20-degree baseline | measured, R6 | 20 degrees, constant +11 |
| R4's reading of the +11 | cited plus inference | 2-minute ihtiyati plus an 8-minute Mufti ruling |
| **R12, six zones, 365 days each** | **measured** | **18 degrees, constant +1 or +2** |

**Test one: is the residual flat or does it vary?** A fixed angle converts to a different number of minutes at
different latitudes and seasons; a decreed offset does not. JAKIM's zones span 1.47 N to 6.44 N. Measured across
365 days at each of six zones (`data/catalog/results-jakim-model.txt`):

| Model | Worst mean residual across zones | Worst spread within a zone |
| --- | --- | --- |
| A, Fajr 20 degrees | 10.30 min | 2.89 min |
| B, Fajr 18 degrees plus a decreed 10 | 9.56 min | 2.33 min |
| B', Fajr 18 degrees bare | **1.89 min** | **2.33 min** |

Neither "20 degrees" nor "18 plus 10" describes the Fajr row. A bare 18 degrees leaves **-0.68 to +3.15 minutes**
across all six zones and 2,190 days, with the per-zone means running 0.44 to 1.89, which is the size of a small
ihtiyati and nothing else.

**Test two: where does the cited 20 actually land?** On the **Imsak** row, and the fit is near-exact
(`data/catalog/results-jakim-imsak.txt`):

| Zone | Published Imsak implied angle | Imsak minus a 20-degree computation | Published Fajr implied angle | Imsak-to-Fajr gap |
| --- | --- | --- | --- | --- |
| JHR02 Johor Bahru | 19.78 to 20.26, mean 20.05 | -1.07 to +0.96 min, mean -0.22 | mean 17.67 | 10 min, all 365 days |
| MLK01 Melaka | 19.75 to 20.23, mean 20.01 | -0.92 to +1.12, mean -0.01 | mean 17.62 | 10 min, all 365 |
| WLY01 Kuala Lumpur | 19.57 to 20.25, mean 19.93 | -1.02 to +1.87, mean +0.30 | mean 17.55 | 10 min, all 365 |
| PNG01 Penang | 19.83 to 20.32, mean 20.08 | -1.29 to +0.76, mean -0.33 | mean 17.71 | 10 min, all 365 |
| KTN01 Kota Bharu | 19.72 to 20.24, mean 20.01 | -0.95 to +1.27, mean -0.01 | mean 17.64 | 10 min, all 365 |
| PLS01 Perlis | **17.68 to 18.15** | **+8.31 to +9.81** | mean 17.89 | **0 min, all 365** |

**Test three: which model's correction constant is explained rather than fitted?** A national policy produces a
uniform constant; a fudge produces a varying one. Scored across eight zones
(`data/catalog/results-jakim-verdict.txt`): Model A's constant takes the values +9 and +10; Model B's takes +1 and
+2. **Model B's Fajr constant equals that zone's own Isha constant at 7 of the 8 zones**, which is exactly what a
single uniform national ihtiyati predicts and what an arbitrary Fajr-only offset does not. The one exception is
KTN01 Kota Bharu at +2 against -3, and that zone is independently known to use a different Isha angle from the
rest of Malaysia, so it is the exception that confirms the reading.

**Verdict: JAKIM is best modelled as Fajr 18 degrees plus a documented 2-minute ihtiyati, with a separate Imsak
row at 20 degrees exactly 10 minutes earlier.** Model B reproduces JAKIM's published year better on both
measures: a smaller residual (worst mean 1.89 minutes against Model A's 10.30) and a smaller, uniform, explained
constant. And Model B explains the 20 rather than contradicting it: **JAKIM's journal is correct, it is just
describing the Imsak row.** The authority does not contradict itself; the software that read its cited number onto
the wrong row does.

**The loser, recorded.** R1's flag of "an open contradiction, about 10 minutes" is resolved: there was no
contradiction, only a row mismatch. R6's +11 against a 20-degree baseline is arithmetically correct and is the
wrong parameterisation, because it hides an explained 2-minute policy inside an unexplained 11-minute fit. R4's
`2 + 8 = 10` reading is the part that must not be re-litigated: the 8 minutes is the Imsak-to-Fajr distance.

**Two per-zone anomalies R12 found while doing this, both of which a per-country model would have shipped wrong:**

- **PLS01 Perlis publishes no distinct Imsak.** It is the one zone of 60 where `imsak` equals `fajr` exactly on
  all 365 days. Bind `imsak` there and the app prints the same time twice under two names.
- **59 of the 60 zones that answered carry a 10-minute gap and one carries zero.** The Imsak semantics are a
  per-ZONE property, not a per-authority one.

### Conflict 3: the Grande Mosquée de Paris, a fixed angle or a sweep

| Reading | Sample | Fajr | Isha |
| --- | --- | --- | --- |
| French reporting, carried by two reports | cited | 18 degrees | 18 degrees |
| R9, the mosque's own calendar | measured, 366 days | **13.03 to 18.10, sweeping** | **Maghrib + 87 min** |
| R12, re-run of R9's harness | **measured, 366 days** | **13.03 to 18.10, median 15.68** | **median exactly 87 min** |

**Verdict: the mosque does not publish a fixed angle, and it does not publish an Isha angle at all.** R12 re-ran
R9's measurement against the same saved calendar and reproduced it: monthly Fajr medians of 17.88 in December,
16.33 in February, 13.05 in June, 17.61 by mid-October, and an Isha-after-Maghrib interval whose interquartile
range is exactly 87 to 87 minutes with a maximum of 101 in the winter widening. The mosque matches an exact 18
degrees on 78 of its 348 solvable days, all in late autumn and winter, and in June runs 75 to 113 minutes later
than 18 degrees would give.

**The loser, recorded.** R1's and R5's "18 degrees" is a faithful citation of what the mosque and its
commentators say, and it is wrong about what the mosque prints. The correction is not carelessness: a French
body's stated angle and its printed table are different objects, and French reporting itself hedges, saying the
mosque uses 18 `durant l'année` but `semble-t-il, en été, elle préconise le 15`. Carry the rule
`seasonally-varying-angle`, never the 18.

### Conflict 4: Bosnia, one day against a year

| Reading | Sample | Fajr | Isha | Maghrib | Sunrise |
| --- | --- | --- | --- | --- | --- |
| R5 | 1 day | 18.24 | **16.54** | sunset +9 | 2.18 deg |
| R9 | 41 days across 2026 | 18.01 | **15.89** | sunset +6 | 1.71 deg |
| R12, re-run | **88 days across 2026** | **median 18.00** | **median 15.95, q1 15.88** | sunset +6 | 1.71 q1 |

**Verdict: R9 stands and R12 widens it.** Re-running R9's harness returned 88 sampled days rather than 41 and
reproduced the same distribution: Fajr median 18.00 with an interquartile range of 17.96 to 18.03, Isha median
15.95 with q1 15.88, Maghrib sunset +6, sunrise 1.71 degrees at q1. R5's Fajr was inside the ordinary day-to-day
scatter. **R5's Isha was 0.65 degrees deep**, which at Sarajevo's latitude is several minutes, and its Maghrib
margin was 3 minutes long.

**The loser, recorded.** R5's single-day Sarajevo reading. R5 flagged in its own caveats table that a month was
needed, which is the right behaviour and is why this is a widening rather than an error. **The general lesson the
catalog carries forward: a single-day angle reading is good enough to separate a 12-degree convention from an
18-degree one and to rule a Hanafi Asr in or out, and it is not good enough to distinguish 15.9 from 16.5.**

### Conflict 5: the Turkish temkin, present or abolished in 1982

| Reading | Basis | Claim |
| --- | --- | --- |
| R1 | measured, 32 consecutive days | a temkin is present: Güneş -7, Öğle +5, İkindi +4, Akşam +7 |
| R2 | cited, Turkish sources on the 1982 reform | the temkin was abolished in 1982 |
| R5 | measured, 32 days plus a 7-city elevation test | **R1 is right, and R2 read a partial claim as a total one** |
| R12, re-run of R5's harness | **measured** | **exactly -7 and +7 at all seven cities, 0 m to 1,900 m** |

**Verdict: Diyanet still applies a temkin, and the proof is stronger than a measurement of the offset.** The
decisive test is elevation, and R12 reproduced it exactly. Diyanet publishes its own **unadjusted** astronomical
sunrise and sunset beside the prayer rows, so the offset can be recovered by differencing the authority's own two
columns with no solar model at all. Measured:

| City | Elevation | `Güneş` minus `GüneşDoğuş` | `Akşam` minus `GüneşBatış` |
| --- | ---: | ---: | ---: |
| Trabzon | 0 m | -7 | +7 |
| Samsun | 4 m | -7 | +7 |
| Izmir | 25 m | -7 | +7 |
| Antalya | 30 m | -7 | +7 |
| Istanbul | 40 m | -7 | +7 |
| Ankara | 938 m | -7 | +7 |
| Erzurum | 1,900 m | -7 | +7 |

**An elevation correction scales with height; Ankara alone would be 5.7 minutes at its 938 m and 1.063 degrees of
horizon dip. A flat constant across 1,900 metres is a decree.** What the 1983 reform removed is the temkin **on
Imsak and Yatsı specifically**, and R12 reproduced that too: those two measure 17.95 and 17.20 degrees with no
margin, exactly as the reform's critics describe.

**The loser, recorded.** R2's "no temkin margin since 1982". The citation behind it is real and it is about two
rows, not six. Nobody should reopen this: `data/countries/measure-diyanet-temkin.mjs` runs in seconds and prints
the seven-city elevation table.

### Conflict 6: South Africa, two bodies 40 to 78 minutes apart

Not a measurement conflict. Two authorities in one country, both tier A in their own terms, publishing different
things. The catalog's job is to price the gap and carry both.

| Body | Artefact | Fajr | Isha | Asr | Maghrib |
| --- | --- | --- | --- | --- | --- |
| Muslim Judicial Council, Cape Town | its own published month | 17.96 measured | 16.99 measured | **1.0 standard**, factor 0.982 to 0.995 measured | plain sunset |
| Jamiatul Ulama KZN | a fatwa naming app settings | 18 cited, as `Karachi` | 18 cited | **2.0 Hanafi** | sunset +3 |
| Jamiatul Ulama SA | both Asr columns, plus a named method | 18 cited, as MWL | 17 cited | both published | not stated |

**R12 priced what following the wrong one costs**, across a year at both cities
(`data/catalog/results-za-asr.txt`):

| Time | Cost of the wrong choice | Where it bites |
| --- | --- | --- |
| Fajr | **0 minutes** | nowhere; 18 and 17.96 are the same number |
| Asr | **40 to 78 minutes** | everywhere, all year; worst in December |
| Maghrib | 3 minutes | everywhere |
| Isha | 5 to 7 minutes | everywhere |

**Verdict: both are carried as separate catalog rows, and the deciding field is `asrShadowFactor`.** The Fajr
angles agree to 0.04 degrees, so the whole disagreement is the madhhab of the Asr plus a 3-minute margin. This is
the catalog's canonical case that **a source is an authority plus a place, and a country may hold more than one.**
A user in Durban following their local ulama body needs a different source from a user in Cape Town following the
MJC, and no computation reconciles them because it is a juristic choice and not a calculation.

### Conflict 7: Umm al-Qura, 18.5 cited against 18.3 measured

| Reading | Basis | Fajr |
| --- | --- | --- |
| `praytimes.org`, `islamicfinder.org`, every library | cited third-hand | 18.5 |
| R1 | measured, Makkah and Medina, 1 day | 18.28 to 18.33 |
| R12 | **the discriminator, computed** | **the two are not distinguishable** |

**Verdict: keep the cited 18.5, because the difference cannot be measured from a table printed to the minute.**
R12 asked the only question that settles it: how many minutes apart are 18.3 and 18.5 at Saudi latitudes?

| City | Latitude | 18.3 sits this long after 18.5 |
| --- | ---: | --- |
| Makkah | 21.43 | 0.86 to 1.03 min |
| Riyadh | 24.71 | 0.88 to 1.08 min |
| Tabuk | 28.38 | 0.91 to 1.16 min |

**0.2 degrees is worth about one minute anywhere in Saudi Arabia**, including its highest-latitude city, so a
one-minute-rounded table cannot separate the two. R6's independent result closes it: with 18.5, the Ramadan
120-minute Isha rule and a round-down rule, Umm al-Qura reaches 85.4% exact and 100% within 1 minute on 14,910
values. A parameter that reproduces the authority's own year to the minute is the right parameter regardless of
which decimal the third-hand citation gives.

**The loser, recorded.** Neither. This is a conflict that dissolves rather than resolving, and that outcome is
worth recording as its own class: **two readings 0.2 degrees apart at a low latitude are the same reading.**

### Conflict 8: MUIS Singapore, 20/18 cited against 19.88/18.13 measured

**Verdict: the cited 20/18 stands.** R12 re-measured the whole published year: Subuh 19.68 to 20.08 with a median
of 19.88, Isyak 17.90 to 18.37 with a median of 18.13. The 0.12-degree shortfall is the authority's own
round-down rule, which R6 identified independently as the strongest rounding inference in the programme, the one
case where the residual mean lands within 0.05 of an integer under exactly one rule. **A measured angle that sits
systematically shallow by a tenth of a degree is a rounding artefact, not a different angle.** This is the same
pattern as Egypt's 0.45-degree spread and it should be read the same way everywhere in the catalog.

### Conflict 9: Kosovo, one day measured three times

R5 measured Fajr 13.48 / Isha 18.93 from one day and flagged that a month was needed. R9 re-read on a different
day and reproduced it to two decimal places. R12 read it a third time and reproduced it again: Fajr 13.48, Isha
18.93, Asr factor 1.074, Dhuhr +3.7 minutes, Maghrib sunset +8, Isha 91 minutes after Maghrib.

**Verdict: the figures stand and the caveat stands with them.** Three independent readings on three dates agreeing
to two decimal places is strong evidence the numbers are right. It is not a month, because `bislame.net` serves
today only and ignores `?date=` and `?data=`, so no seasonal behaviour could be observed at all. A 13.5-degree
Fajr paired with a 19-degree Isha is the most asymmetric pair in the programme, and Kosovo's high-latitude
behaviour is completely unknown. **Carried as measured with a standing one-day caveat**, which is different from
carried as unverified.

### Conflict 10: Indonesia against Malaysia, the same number on different rows

Not a conflict between reports. A conflict between two authorities that R12 measured because the JAKIM verdict
made it answerable, and it turns out to be the catalog's strongest single argument for the concept-to-row field.

| Authority | Cites | Row set | Imsak gap | 20 degrees lands on | Imsak's own implied angle |
| --- | --- | --- | --- | --- | --- |
| JAKIM Malaysia | 20 / 18 | Imsak, Subuh, Syuruk, Duha, Zohor, Asar, Maghrib, Isyak | 10 min | **IMSAK**, measured 19.93 to 20.08 | it IS the angle |
| Kemenag Indonesia | 20 / 18 plus 2 min ihtiyati | Imsak, Subuh, Terbit, Dhuha, Dzuhur, Ashar, Maghrib, Isya | 10 min | **SUBUH**, measured 19.40 to 20.06 | **21.77 to 22.42, never published** |

Measured by R12 across three Indonesian cities that pass an anchor gate, 123 days each
(`data/catalog/results-id-imsak.txt`). A fourth probed code measures 24 to 33 degrees, which no convention
reaches, so that code does not resolve to the city assumed and the row is reported rather than used.

**Verdict: the concept-to-row map must bind each concept to its own parameter, not merely to a row name.** Two
neighbouring countries print the same eight rows with the same 10-minute gap and the same cited number, and the
number means different things. In Malaysia `Imsak` is a published angle and `Subuh` is that angle's offspring
plus an ihtiyati. In Indonesia `Subuh` is the published angle and `Imsak` is a derived offset with no angle behind
it. **A `derivation` field is therefore mandatory on every extra row: `angle` or `offset`.** The catalog carries it.

### Where no conflict was found, checked and recorded

| Checked | Result |
| --- | --- |
| Diyanet's 18/17 angles across R1, R2, R5, R6 | all four agree; only the temkin was ever contested |
| The UAE as a real angle against the `Gulf Region` 19.5 / 90-minute interval | R5 and R6 agree; the Isha-after-Maghrib gap spans 73 to 76 min, which no interval does |
| Oman likewise | R1 and R6 agree at 17.95 / 18.2 with a uniform +5 |
| Kemenag's sunrise sign flip, -3 where every other field is +3 | R1 cited it as policy and R6 measured it; it is deliberate, because sunrise ENDS the Fajr window |
| Azerbaijan's Hanafi Asr beside a Shia Maghrib | R5 only, one report, but internally consistent on 30 of 30 days |
| Kazakhstan's ISNA 15/15 with a Hanafi Asr | R2 and R5 agree, and it is read from the muftiate's own page source |
| Egypt's category 1 status | R6 measured six zero constants on four cities; R12's 47-city angle sweep is consistent with it |

---

## Part 2: the catalog

Every table in this part is generated from `data/catalog/sources.json`. Do not hand-edit them. Regenerate with
`node data/catalog/build-catalog.mjs` and verify with `--check`.

### What the catalog holds

<!-- BEGIN catalog-summary -->
<!-- generated from data/catalog/sources.json by build-catalog.mjs; do not hand-edit -->

| Count | Value |
| --- | --- |
| Sources in the catalog | 39 |
| Countries covered | 30 |
| Evidence tier A outright | 29 |
| Evidence tier A in part, qualified on the row | 9 |
| Evidence tier D, a library constant only | 1 |
| Serve a whole year in one pass | 22 |
| Keyless | 34 |
| R6 category 1, exactly computable | 1 |
| R6 category 2, computable plus constants | 14 |
| R6 category 3, computable plus a seasonal curve | 1 |
| R6 category 4, genuinely irregular | 1 |
| Not measured by R6 | 22 |
| Obtain kinds in use | provider-api 1, authority-feed 10, authority-page 11, open-data 1, third-party-proxy 1, digitised-perpetual 1, authority-image 2, computation 7, authority-pdf 4, mosque-platform 1 |

<!-- END catalog-summary -->

### Identity: who the source is and where it applies

A source is an authority plus the place or zone it covers. Two sources may share an authority (JAKIM's zones,
Diyanet's cities) and two may share a country (South Africa's two bodies, France's two positions). The `id` is
stable, lowercase, `<iso2>-<authority>-<place-or-zone>`, and is never reused or renumbered.

<!-- BEGIN catalog-identity -->
<!-- generated from data/catalog/sources.json by build-catalog.mjs; do not hand-edit -->

| `id` | Authority | Country | Place, zone, coordinates | IANA timezone | URL |
| --- | --- | --- | --- | --- | --- |
| `gb-london-unified` | Unified Prayer Timetable for London | United Kingdom | London, inside the M25 / 51.5072, -0.1276 | `Europe/London` | `https://www.londonprayertimes.com/` |
| `my-jakim-wly01` | Jabatan Kemajuan Islam Malaysia (JAKIM) | Malaysia | Kuala Lumpur and Putrajaya / zone `WLY01` / 3.139, 101.6869 | `Asia/Kuala_Lumpur` | `https://www.e-solat.gov.my/` |
| `my-jakim-ktn01` | Jabatan Kemajuan Islam Malaysia (JAKIM) | Malaysia | Kota Bharu, Bachok, Pasir Puteh, Tumpat, Pasir Mas, Tanah Merah, Machang, Kuala Krai, Gua Musang / zone `KTN01` / 6.1254, 102.2381 | `Asia/Kuala_Lumpur` | `https://www.e-solat.gov.my/` |
| `my-jakim-pls01` | Jabatan Kemajuan Islam Malaysia (JAKIM) | Malaysia | Kangar, Perlis / zone `PLS01` / 6.4414, 100.1986 | `Asia/Kuala_Lumpur` | `https://www.e-solat.gov.my/` |
| `tr-diyanet-ankara` | Diyanet Isleri Baskanligi, Din Isleri Yuksek Kurulu | Turkey | Ankara / zone `9206` / 39.9334, 32.8597 | `Europe/Istanbul` | `https://namazvakitleri.diyanet.gov.tr/` |
| `tr-diyanet-istanbul` | Diyanet Isleri Baskanligi, Din Isleri Yuksek Kurulu | Turkey | Istanbul / zone `9541` / 41.0082, 28.9784 | `Europe/Istanbul` | `https://namazvakitleri.diyanet.gov.tr/` |
| `eg-esa-cairo` | Egyptian General Authority of Survey (al-Hay'a al-Misriyya al-'Amma li-l-Misaha) | Egypt | Cairo / 30.0444, 31.2357 | `Africa/Cairo` | `https://www.esa.gov.eg/praytimes.aspx` |
| `sg-muis-singapore` | Majlis Ugama Islam Singapura (MUIS) | Singapore | Singapore / 1.3521, 103.8198 | `Asia/Singapore` | `https://www.muis.gov.sg/resources/islamic-calendar/` |
| `id-kemenag-jakarta` | Kementerian Agama Republik Indonesia (Kemenag) | Indonesia | Jakarta / zone `1301` / -6.2088, 106.8456 | `Asia/Jakarta` | `https://bimasislam.kemenag.go.id/jadwalshalat` |
| `sa-ummalqura-makkah` | Umm al-Qura Calendar | Saudi Arabia | Makkah / 21.4267, 39.8317 | `Asia/Riyadh` | `https://www.ummulqura.org.sa/` |
| `qa-moi-doha` | Ministry of Interior, Qatar | Qatar | Doha / 25.2854, 51.531 | `Asia/Qatar` | `https://portal.moi.gov.qa/` |
| `ae-awqaf-dubai` | General Authority of Islamic Affairs, Endowments and Zakat (Awqaf) | United Arab Emirates | Dubai / 25.2048, 55.2708 | `Asia/Dubai` | `https://www.awqaf.gov.ae/en/prayer-times` |
| `om-mara-muscat` | Ministry of Endowments and Religious Affairs (MARA) | Oman | Muscat / 23.588, 58.3829 | `Asia/Muscat` | `https://www.mara.gov.om/calendar_page2.asp` |
| `ma-habous-rabat` | Ministere des Habous et des Affaires Islamiques | Morocco | Rabat / zone `1` / 34.0209, -6.8416 | `Etc/GMT` | `https://www.habous.gov.ma/prieres/` |
| `bn-mora-brunei` | Ministry of Religious Affairs (MORA / KHEU) | Brunei | Brunei-Muara / 4.9031, 114.9398 | `Asia/Brunei` | `https://www.mora.gov.bn/SitePages/WaktuSembahyang.aspx` |
| `bn-mora-belait` | Ministry of Religious Affairs (MORA / KHEU) | Brunei | Belait district / zone `belait` | `Asia/Brunei` | `https://www.mora.gov.bn/SitePages/WaktuSembahyang.aspx` |
| `ir-calendarcentre-tehran` | Calendar Centre, Institute of Geophysics, University of Tehran | Iran | Tehran / 35.6892, 51.389 | `Asia/Tehran` | `https://calendar.ut.ac.ir/` |
| `az-cmb-baku` | Caucasus Muslims Board (Qafqaz Muselmanlari Idaresi) | Azerbaijan | Baku / zone `baki` / 40.4093, 49.8671 | `Asia/Baku` | `https://caucasus-muslims.org/az/namaz-calendar` |
| `kz-muftiyat-astana` | Spiritual Administration of Muslims of Kazakhstan (Muftiyat) | Kazakhstan | Astana / 51.1605, 71.4704 | `Asia/Almaty` | `https://muftyat.kz/` |
| `bd-islamicfoundation-dhaka` | Islamic Foundation Bangladesh | Bangladesh | Dhaka district / 23.8103, 90.4125 | `Asia/Dhaka` | `http://islamicfoundation.gov.bd/` |
| `ye-awqaf-sanaa` | General Authority of Awqaf and Guidance | Yemen | Sanaa / 15.3694, 44.191 | `Asia/Aden` | `https://www.awqaf.gov.ye/` |
| `lk-acju-zone01` | All Ceylon Jamiyyathul Ulama (ACJU) | Sri Lanka | Colombo, Gampaha and Kalutara districts / zone `01` / 6.9271, 79.8612 | `Asia/Colombo` | `https://www.acju.lk/prayer-times/` |
| `dz-marw-alger` | Ministry of Religious Affairs and Endowments | Algeria | Algiers and its linked cities / zone `Alger` / 36.7538, 3.0588 | `Africa/Algiers` | `https://marw.gov.dz/` |
| `tn-inm-tunis` | Institut National de la Meteorologie, Ministere du Transport | Tunisia | Tunis / 36.8065, 10.1815 | `Africa/Tunis` | `https://www.meteo.tn/fr/heures-prieres` |
| `mr-affairesislamiques-rosso` | Ministry of Islamic Affairs and Original Education | Mauritania | Rosso / 16.5138, -15.805 | `Africa/Nouakchott` | `https://affairesislamiques.mr/` |
| `za-mjc-capetown` | Muslim Judicial Council (MJC) | South Africa | Cape Town / -33.9249, 18.4241 | `Africa/Johannesburg` | `https://mjc.org.za/salaah-times/` |
| `za-jamiatkzn-fatwa` | Jamiatul Ulama KwaZulu-Natal | South Africa | South Africa, Hanafi community | `Africa/Johannesburg` | `https://jamiat.org.za/hanafi-settings-for-salaah-apps/` |
| `be-emb-brussels` | Executief van de Moslims van Belgie, Conseil des Theologiens | Belgium | Brussels / 50.8503, 4.3517 | `Europe/Brussels` | `https://www.emb-net.be/nl/gebedstijden` |
| `se-ifis-stockholm` | Islamiska Forbundet i Sverige | Sweden | Stockholm / 59.3293, 18.0686 | `Europe/Stockholm` | `https://www.islamiskaforbundet.se/bonetider/` |
| `se-ifis-kiruna` | Islamiska Forbundet i Sverige | Sweden | Kiruna / 67.8558, 20.2253 | `Europe/Stockholm` | `https://www.islamiskaforbundet.se/bonetider/` |
| `no-irn-oslo` | Islamsk Rad Norge, Felles bonnetid | Norway | Oslo / 59.9139, 10.7522 | `Europe/Oslo` | `https://bonnetid.no/` |
| `ba-rijaset-sarajevo` | Islamic Community in Bosnia and Herzegovina (Rijaset) | Bosnia and Herzegovina | Sarajevo / zone `77` / 43.8563, 18.4131 | `Europe/Sarajevo` | `https://vaktija.ba/` |
| `xk-bik-pristina` | Bashkesia Islame e Kosoves (BIK) | Kosovo | Pristina / 42.6629, 21.1655 | `Europe/Belgrade` | `https://bislame.net/namazet/` |
| `fr-gmparis-paris` | Grande Mosquee de Paris (Societe des Habous et des Lieux Saints de l'Islam) | France | Paris / 48.8424, 2.3548 | `Europe/Paris` | `https://www.grandemosqueedeparis.fr/` |
| `fr-musulmansdefrance` | Musulmans de France (formerly UOIF) | France | France, national calendar | `Europe/Paris` | `https://www.musulmansdefrance.fr/` |
| `gb-wifaqululama` | Wifaqul Ulama | United Kingdom | United Kingdom, Hanafi community | `Europe/London` | `https://www.wifaqululama.co.uk/salahtimes/` |
| `us-fcna` | Fiqh Council of North America (FCNA) | United States | United States | per user | `https://fiqhcouncil.org/the-suggested-calculation-method-for-fajr-and-isha/` |
| `ca-fcna` | Fiqh Council of North America (FCNA) | Canada | Canada | per user | `https://fiqhcouncil.org/the-suggested-calculation-method-for-fajr-and-isha/` |
| `computed-fallback` | COMPUTED, no authority | any | anywhere no authority could be sourced | per user | none |

<!-- END catalog-identity -->

### Parameters: everything a computation needs

Offsets are in minutes, positive later, in the order Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha. A `?` means the
field was not measured, which is different from zero. The high-latitude column names a rule from the rule catalog
below; R11 owns that catalogue and these names are placeholders pending its report.

<!-- BEGIN catalog-parameters -->
<!-- generated from data/catalog/sources.json by build-catalog.mjs; do not hand-edit -->

| `id` | Fajr | Isha | Asr factor | Offsets F Su Dh A M I | High-latitude rule | Rounding |
| --- | --- | --- | --- | --- | --- | --- |
| `gb-london-unified` | rule `moonsighting-seasonal` | rule `moonsighting-seasonal` | 1.0 standard, plus 2 published | `? ? ? ? ? ?` | `moonsighting-seasonal` | UNVERIFIED |
| `my-jakim-wly01` | 18 deg | 18 deg | 1.0 standard | `+2 -1 +3 +2 +2 +2` | `none` | F:down S:nearest D:nearest A:nearest M:nearest I:nearest |
| `my-jakim-ktn01` | 18 deg | 17.5 deg | 1.0 standard | `+2 +1 +3 +2 +2 +1` | `none` | F:down S:nearest D:nearest A:nearest M:nearest I:nearest |
| `my-jakim-pls01` | 18 deg | 18 deg | 1.0 standard | `+1 0 +2 +1 +1 +1` | `none` | F:down S:nearest D:nearest A:nearest M:nearest I:nearest |
| `tr-diyanet-ankara` | 18 deg | 17 deg | 1.0 standard | `0 -7 +5 +4 +7 0` | `diyanet-brussels-45` | nearest |
| `tr-diyanet-istanbul` | 18 deg | 17 deg | 1.0 standard | `0 -7 +5 +4 +7 0` | `diyanet-brussels-45` | nearest |
| `eg-esa-cairo` | 19.5 deg | 17.5 deg | 1.0 standard | `0 0 0 0 0 0` | `none` | nearest |
| `sg-muis-singapore` | 20 deg | 18 deg | 1.0 standard | `+1 +1 +2 +1 +1 +1` | `none` | down |
| `id-kemenag-jakarta` | 20 deg | 18 deg | 1.0 standard | `+3 -3 +4 +3 +3 +3` | `none` | F:down S:nearest D:down A:down M:up I:down |
| `sa-ummalqura-makkah` | 18.5 deg | Maghrib +90 min, +120 in Ramadan | 1.0 standard | `+1 0 +1 +1 +1 +1` | `none` | down |
| `qa-moi-doha` | 17.8 deg | Maghrib +90 min | 1.0 standard | `-2 0 0 0 +2 +2` | `none` | nearest |
| `ae-awqaf-dubai` | 18.19 deg | 18.18 deg | 1.0 standard | `0 -3 +3 +1 +3 0` | `none` | F:nearest S:down D:nearest A:nearest M:nearest I:nearest |
| `om-mara-muscat` | 17.95 deg | 18.2 deg | 1.0 standard | `0 0 +5 +5 +5 -1` | `none` | nearest |
| `ma-habous-rabat` | 19 deg | 17 deg | 1.0 standard | `-1 -3 +5 +1 +4 0` | `none` | F:up S:nearest D:nearest A:nearest M:nearest I:nearest |
| `bn-mora-brunei` | 20 deg | 18 deg | 1.0 standard | `0 0 +1 0 0 0` | `none` | nearest |
| `bn-mora-belait` | 20 deg | 18 deg | 1.0 standard | `+3 +3 +4 +3 +3 +3` | `none` | nearest |
| `ir-calendarcentre-tehran` | 18 deg | rule `NOT-PUBLISHED` | none published | `0 0 0 ? +17 ?` | `none` | nearest |
| `az-cmb-baku` | 15.85 deg | 14.76 deg | 2.0 Hanafi | `0 0 0 0 +14 0` | `none` | UNVERIFIED |
| `kz-muftiyat-astana` | 15 deg | 15 deg | 2.0 Hanafi | `0 -5 +5 +5 +5 0` | `angle-based` | UNVERIFIED |
| `bd-islamicfoundation-dhaka` | 18 deg | rule `NOT-PUBLISHED` | none published | `0 ? ? ? 0 ?` | `none` | up |
| `ye-awqaf-sanaa` | 18 deg | 15.8 deg | 1.0 standard | `0 0 0 0 +7 0` | `none` | UNVERIFIED |
| `lk-acju-zone01` | 19.8 deg | 18.2 deg | 1.0 standard | `0 ? +1 0 +2 0` | `none` | UNVERIFIED |
| `dz-marw-alger` | 17.91 deg | 17.09 deg | 1.0 standard | `0 ? +1 0 +4 0` | `none` | UNVERIFIED |
| `tn-inm-tunis` | 18.06 deg | 18.1 deg | 1.0 standard | `0 ? +7 0 +3 0` | `none` | UNVERIFIED |
| `mr-affairesislamiques-rosso` | 19.37 deg | 17.46 deg | 1.0 standard | `0 ? 0 0 +3 0` | `none` | UNVERIFIED |
| `za-mjc-capetown` | 17.96 deg | 16.99 deg | 1.0 standard | `0 0 0 0 0 0` | `none` | UNVERIFIED |
| `za-jamiatkzn-fatwa` | 18 deg | 18 deg | 2.0 Hanafi | `0 0 0 0 +3 0` | `none` | not applicable |
| `be-emb-brussels` | 17.99 deg | 18 deg | 1.0 standard | `0 ? 0 0 +2 0` | `frozen-clock-time` | UNVERIFIED |
| `se-ifis-stockholm` | 18 deg | 16 deg | 1.0 standard | `0 0 0 0 0 0` | `frozen-fraction-of-night` | UNVERIFIED |
| `se-ifis-kiruna` | rule `UNKNOWN-arctic` | rule `UNKNOWN-arctic` | 1.0 standard | `? ? ? ? ? ?` | `UNKNOWN-arctic` | UNVERIFIED |
| `no-irn-oslo` | 16 deg | 15 deg | 1.0 standard, plus 2 published | `0 ? 0 0 +4 0` | `frozen-clock-time` | UNVERIFIED |
| `ba-rijaset-sarajevo` | 18 deg | 15.89 deg | 1.0 standard | `0 -7 +1 0 +6 0` | `none` | UNVERIFIED |
| `xk-bik-pristina` | 13.48 deg | 18.93 deg | 1.0 standard | `0 -8 +4 0 +8 0` | `UNVERIFIED` | UNVERIFIED |
| `fr-gmparis-paris` | rule `seasonally-varying-angle` | Maghrib +87 min | 1.0 standard | `? ? +5 0 +3 ?` | `UNVERIFIED` | UNVERIFIED |
| `fr-musulmansdefrance` | 12 deg | 12 deg | 1.0 standard | `0 ? ? 0 +3 0` | `UNVERIFIED` | UNVERIFIED |
| `gb-wifaqululama` | 18 deg | 15 deg at 48N and above, 18 deg below 48N | 1.0 standard, plus 2 published | `0 0 +4 0 +5 0` | `aqrab-al-ayyam-three-day-average` | UNVERIFIED |
| `us-fcna` | 15 deg | 15 deg | none published | `0 0 0 ? 0 0` | `UNVERIFIED` | not applicable |
| `ca-fcna` | 13 deg | 13 deg | none published | `0 0 0 ? 0 0` | `UNVERIFIED` | not applicable |
| `computed-fallback` | 18 deg | 17 deg | 1.0 standard, plus 2 published | `0 0 0 0 0 0` | `seventh-of-the-night` | nearest |

<!-- END catalog-parameters -->

### Rows: the concept-to-row map and the extra published rows

**This is the field that prevents a 10-minute error, and conflicts 2 and 10 are why.** The left column binds a
prayer concept to the row the authority actually prints. The right column lists everything beyond the six
standard rows, with each row's `derivation` where R12 measured it: `angle` means the row has its own published
angle, `offset` means it is derived from another row.

<!-- BEGIN catalog-rows -->
<!-- generated from data/catalog/sources.json by build-catalog.mjs; do not hand-edit -->

| `id` | Concept to published row | Extra published rows |
| --- | --- | --- |
| `gb-london-unified` | fajr=`Fajr`, sunrise=`Sunrise`, dhuhr=`Dhuhr`, asr=`Asr (1 Mithl)`, maghrib=`Magrib`, isha=`Isha` | `Jama'ah` jamaah; `2 Mithl` asr-alternate |
| `my-jakim-wly01` | imsak=`IMSAK`, fajr=`SUBUH`, sunrise=`SYURUK`, duha=`DUHA`, dhuhr=`ZOHOR`, asr=`ASAR`, maghrib=`MAGHRIB`, isha=`ISYAK` | `IMSAK` imsak -10 min from fajr as angle; `SYURUK` sunrise; `DUHA` duha |
| `my-jakim-ktn01` | imsak=`IMSAK`, fajr=`SUBUH`, sunrise=`SYURUK`, duha=`DUHA`, dhuhr=`ZOHOR`, asr=`ASAR`, maghrib=`MAGHRIB`, isha=`ISYAK` | `IMSAK` imsak -10 min from fajr as angle; `DUHA` duha |
| `my-jakim-pls01` | fajr=`SUBUH`, sunrise=`SYURUK`, duha=`DUHA`, dhuhr=`ZOHOR`, asr=`ASAR`, maghrib=`MAGHRIB`, isha=`ISYAK` | `IMSAK` fajr-duplicate 0 min from fajr; `DUHA` duha |
| `tr-diyanet-ankara` | fajr=`İmsak`, sunrise=`Güneş`, dhuhr=`Öğle`, asr=`İkindi`, maghrib=`Akşam`, isha=`Yatsı` | `Astronomik Güneş Doğuş` astronomical-sunrise; `Astronomik Güneş Batış` astronomical-sunset; `Kıble Saati` qibla-time |
| `tr-diyanet-istanbul` | fajr=`İmsak`, sunrise=`Güneş`, dhuhr=`Öğle`, asr=`İkindi`, maghrib=`Akşam`, isha=`Yatsı` | `Astronomik Güneş Doğuş` astronomical-sunrise; `Astronomik Güneş Batış` astronomical-sunset |
| `eg-esa-cairo` | fajr=`فجر`, sunrise=`شروق`, dhuhr=`ظهر`, asr=`عصر`, maghrib=`مغرب`, isha=`عشاء` | none |
| `sg-muis-singapore` | fajr=`Subuh`, sunrise=`Syuruk`, dhuhr=`Zohor`, asr=`Asar`, maghrib=`Maghrib`, isha=`Isyak` | `Imsakiah` imsak |
| `id-kemenag-jakarta` | imsak=`Imsak`, fajr=`Subuh`, sunrise=`Terbit`, duha=`Dhuha`, dhuhr=`Dzuhur`, asr=`Ashar`, maghrib=`Maghrib`, isha=`Isya` | `Imsak` imsak -10 min from fajr as offset; `Dhuha` duha |
| `sa-ummalqura-makkah` | fajr=`الفجر`, sunrise=`الشروق`, dhuhr=`الظهر`, asr=`العصر`, maghrib=`المغرب`, isha=`العشاء` | none |
| `qa-moi-doha` | fajr=`Fajer`, sunrise=`Sunrise`, dhuhr=`Dhuhr`, asr=`Asr`, maghrib=`Maghrib`, isha=`Isha` | none |
| `ae-awqaf-dubai` | fajr=`fajr`, sunrise=`sunrise`, dhuhr=`zuhr`, asr=`asr`, maghrib=`magrib`, isha=`isha` | `emsak` fajr-duplicate 0 min from fajr; `azanSettings` iqama |
| `om-mara-muscat` | fajr=`الفجر`, sunrise=`الشروق`, dhuhr=`الظهر`, asr=`العصر`, maghrib=`المغرب`, isha=`العشاء` | none |
| `ma-habous-rabat` | fajr=`الصبح`, sunrise=`الشروق`, dhuhr=`الظهر`, asr=`العصر`, maghrib=`المغرب`, isha=`العشاء` | none |
| `bn-mora-brunei` | imsak=`Imsak`, fajr=`Suboh`, sunrise=`Syuruk`, duha=`Doha`, dhuhr=`Zohor`, asr=`Asar`, maghrib=`Maghrib`, isha=`Isyak` | `Imsak` imsak; `Doha` duha |
| `bn-mora-belait` | imsak=`Imsak`, fajr=`Suboh`, sunrise=`Syuruk`, duha=`Doha`, dhuhr=`Zohor`, asr=`Asar`, maghrib=`Maghrib`, isha=`Isyak` | `Imsak` imsak; `Doha` duha |
| `ir-calendarcentre-tehran` | fajr=`اذان صبح`, sunrise=`طلوع آفتاب`, dhuhr=`اذان ظهر`, maghrib=`اذان مغرب`, midnight=`نیمه شب شرعی` | `نیمه شب شرعی` shari-midnight |
| `az-cmb-baku` | imsak=`İmsak vaxtı`, fajr=`Sübh azanı`, sunrise=`Gün çıxır`, dhuhr=`Zöhr azanı`, asr=`Əsr azanı`, maghrib=`Məğrib azanı`, isha=`İşa azanı`, midnight=`Gecə yarısı` | `İmsak vaxtı` imsak -5 min from fajr; `Gün batır` astronomical-sunset; `Gecə yarısı` shari-midnight |
| `kz-muftiyat-astana` | fajr=`Фаджр`, sunrise=`Восход`, dhuhr=`Зухр`, asr=`Аср`, maghrib=`Магриб`, isha=`Иша` | none |
| `bd-islamicfoundation-dhaka` | imsak=`সাহরীর শেষ সময়`, fajr=`ফজরের আজান`, maghrib=`ইফতার` | `সাহরীর শেষ সময়` imsak -3 min from fajr |
| `ye-awqaf-sanaa` | fajr=`fajr`, sunrise=`sunrise`, dhuhr=`duhur`, asr=`asr`, maghrib=`maghrib`, isha=`isha` | `amsek` fajr-duplicate 0 min from fajr |
| `lk-acju-zone01` | fajr=`Fajr`, sunrise=`Sunrise`, dhuhr=`Luhar`, asr=`Asar`, maghrib=`Maghrib`, isha=`Isha` | none |
| `dz-marw-alger` | fajr=`الفجر`, dhuhr=`الظهر`, asr=`العصر`, maghrib=`المغرب`, isha=`العشاء` | `القبلة` qibla-time |
| `tn-inm-tunis` | fajr=`AL SOBH`, dhuhr=`AL DHOHR`, asr=`AL ASR`, maghrib=`AL MAGHREB`, isha=`AL ICHA` | `الإمساك` imsak |
| `mr-affairesislamiques-rosso` | imsak=`الإمساك`, fajr=`الفجر`, dhuhr=`الظهر`, asr=`العصر`, maghrib=`المغرب`, isha=`العشاء` | `الإمساك` imsak -5 min from fajr |
| `za-mjc-capetown` | fajr=`Fajr`, sunrise=`Sunrise`, dhuhr=`Zuhr`, asr=`Asr`, maghrib=`Maghrib`, isha=`Isha` | none |
| `za-jamiatkzn-fatwa` | fajr=`Fajr`, sunrise=`Sunrise`, dhuhr=`Zuhr`, asr=`Asr`, maghrib=`Maghrib`, isha=`Isha` | none |
| `be-emb-brussels` | fajr=`Fajr`, dhuhr=`Dhuhr`, asr=`Asr`, maghrib=`Maghrib`, isha=`Icha` | none |
| `se-ifis-stockholm` | fajr=`Fajr`, sunrise=`Shuruk`, dhuhr=`Dhohr`, asr=`Asr`, maghrib=`Magrib`, isha=`Isha` | none |
| `se-ifis-kiruna` | fajr=`Fajr`, sunrise=`Shuruk`, dhuhr=`Dhohr`, asr=`Asr`, maghrib=`Magrib`, isha=`Isha` | none |
| `no-irn-oslo` | fajr=`Fajr`, fajrEnd=`Fajr slutt`, dhuhr=`Duhr`, asr=`Asr`, maghrib=`Maghrib`, isha=`Isha`, midnight=`Midnatt` | `Morgengry 16` astronomical-dawn; `Kveldsgry 15` astronomical-dusk; `Fajr slutt` fajr-end; `1x-skygge` asr; `2x-skygge` asr-alternate; `Midnatt` midnight |
| `ba-rijaset-sarajevo` | fajr=`Zora`, sunrise=`Izlazak sunca`, dhuhr=`Podne`, asr=`Ikindija`, maghrib=`Akšam`, isha=`Jacija` | none |
| `xk-bik-pristina` | fajr=`Sabahu`, sunrise=`L. e Diellit`, dhuhr=`Dreka`, asr=`Ikindia`, maghrib=`Akshami`, isha=`Jacia` | none |
| `fr-gmparis-paris` | fajr=`Fajr`, sunrise=`Chourouk`, dhuhr=`Dhohr`, asr=`Asr`, maghrib=`Maghreb`, isha=`Icha` | none |
| `fr-musulmansdefrance` | fajr=`Fajr`, sunrise=`Chourouk`, dhuhr=`Dhohr`, asr=`Asr`, maghrib=`Maghreb`, isha=`Icha` | none |
| `gb-wifaqululama` | fajr=`Fajr`, sunrise=`Sunrise`, dhuhr=`Zuhr`, asr=`Asr (Shaf'ae)`, asrAlternate=`Asr (Hanafi)`, maghrib=`Maghrib`, isha=`Isha` | `Asr (Hanafi)` asr-alternate |
| `us-fcna` | fajr=`Fajr`, sunrise=`Sunrise`, dhuhr=`Dhuhr`, asr=`Asr`, maghrib=`Maghrib`, isha=`Isha` | none |
| `ca-fcna` | fajr=`Fajr`, sunrise=`Sunrise`, dhuhr=`Dhuhr`, asr=`Asr`, maghrib=`Maghrib`, isha=`Isha` | none |
| `computed-fallback` | fajr=`Fajr`, sunrise=`Sunrise`, dhuhr=`Dhuhr`, asr=`Asr`, maghrib=`Maghrib`, isha=`Isha` | none |

<!-- END catalog-rows -->

### Provenance: category, obtainability, evidence and the report that measured it

R6's categories: **1** exactly computable, a correctly configured library IS the authority's table; **2**
computable plus a small fixed per-field constant; **3** computable plus a seasonal curve; **4** genuinely
irregular, no computation reaches it.

<!-- BEGIN catalog-provenance -->
<!-- generated from data/catalog/sources.json by build-catalog.mjs; do not hand-edit -->

| `id` | R6 category | Obtained as | Evidence | Report |
| --- | --- | --- | --- | --- |
| `gb-london-unified` | 4 | provider-api (whole year, keyed) | A | R2, wave 1 |
| `my-jakim-wly01` | 2 | authority-feed (whole year, keyless) | A | R1/R2/R4/R6, verdict R12 |
| `my-jakim-ktn01` | 2 | authority-feed (whole year, keyless) | A | R6 |
| `my-jakim-pls01` | 2 | authority-feed (whole year, keyless) | A | R6, the Imsak anomaly R12 |
| `tr-diyanet-ankara` | 2 | authority-feed (whole year, keyless) | A | R1/R5, corrects R2 |
| `tr-diyanet-istanbul` | 2 | authority-feed (whole year, keyless) | A | R1/R5/R6 |
| `eg-esa-cairo` | 1 | authority-page (part year, keyless) | A | R1/R5/R7, re-measured R12 |
| `sg-muis-singapore` | 2 | open-data (whole year, keyless) | A | R1/R4/R6, re-measured R12 |
| `id-kemenag-jakarta` | 2 | third-party-proxy (part year, keyless) | A for the criteria, C for the feed | R1/R2/R4/R6, Subuh angle and Imsak derivation re-measured R12 |
| `sa-ummalqura-makkah` | 2 | authority-feed (whole year, keyless) | A | R1/R2/R6, settled R12 |
| `qa-moi-doha` | 2 | digitised-perpetual (whole year, keyless) | A | R1/R2/R6 |
| `ae-awqaf-dubai` | 2 | authority-feed (whole year, keyless) | A | R5/R6 |
| `om-mara-muscat` | 2 | authority-page (part year, keyless) | A | R1/R6 |
| `ma-habous-rabat` | 2 | authority-page (part year, keyless) | A | R1/R2/R6 |
| `bn-mora-brunei` | 2 | authority-feed (whole year, keyless) | A | R1/R2/R6 |
| `bn-mora-belait` | 2 | authority-feed (whole year, keyless) | A | R2 |
| `ir-calendarcentre-tehran` | not measured | authority-page (part year, keyless) | A | R1/R5 |
| `az-cmb-baku` | not measured | authority-image (whole year, keyless) | A | R5 |
| `kz-muftiyat-astana` | not measured | computation (part year, keyless) | A | R2/R5 |
| `bd-islamicfoundation-dhaka` | not measured | authority-pdf (part year, keyless) | A | R5 |
| `ye-awqaf-sanaa` | not measured | authority-page (part year, keyless) | A | R5 |
| `lk-acju-zone01` | not measured | authority-image (whole year, keyless) | A | R5 |
| `dz-marw-alger` | not measured | authority-pdf (whole year, keyed) | A | R9, upgraded from R5's tier D |
| `tn-inm-tunis` | not measured | authority-page (part year, keyless) | A | R9, upgraded from R5's tier D |
| `mr-affairesislamiques-rosso` | not measured | authority-pdf (part year, keyed) | A | R9 |
| `za-mjc-capetown` | not measured | authority-page (part year, keyless) | A for the MJC's own table, NULL for a South African national convention | R9 |
| `za-jamiatkzn-fatwa` | not measured | computation (part year, keyless) | A as a recommendation, NULL as a timetable | R1/R5/R9 |
| `be-emb-brussels` | not measured | authority-pdf (whole year, keyed) | A | R9, correcting R5's NULL |
| `se-ifis-stockholm` | not measured | authority-page (whole year, keyless) | A | R9, correcting R5's NULL |
| `se-ifis-kiruna` | not measured | authority-page (whole year, keyless) | A for the published times, NULL for the rule behind them | R9, attacked again by R11 |
| `no-irn-oslo` | not measured | authority-page (whole year, keyless) | A | R9, correcting R5's NULL |
| `ba-rijaset-sarajevo` | not measured | authority-feed (whole year, keyless) | A | R9, correcting R5 |
| `xk-bik-pristina` | not measured | authority-page (part year, keyless) | A, measured, with a standing one-day caveat | R5/R9, re-measured R12 |
| `fr-gmparis-paris` | 3 | mosque-platform (whole year, keyless) | A for the mosque's own published year | R9, correcting R1 and R5 |
| `fr-musulmansdefrance` | not measured | computation (part year, keyed) | A for the body's own stated position, B for what mosques print | R1/R9 |
| `gb-wifaqululama` | not measured | computation (part year, keyless) | A | R1/R2 |
| `us-fcna` | not measured | computation (part year, keyless) | A for the ruling, C for what mosques actually do | R1/R2 |
| `ca-fcna` | not measured | computation (part year, keyless) | A for the ruling, NULL for Canadian mosque adoption | R1 |
| `computed-fallback` | not measured | computation (whole year, keyless) | D, a library constant with no authority behind it | R1/R3/R5 |

<!-- END catalog-provenance -->

### The rule catalog

The named non-angle rules the parameter table points into. Every one of these is something a real authority
publishes or a real authority's table was measured to do, except the two library rules which are named so they
can be avoided or chosen deliberately.

<!-- BEGIN catalog-rules -->
<!-- generated from data/catalog/sources.json by build-catalog.mjs; do not hand-edit -->

| Rule | What it does | Used by | Evidence |
| --- | --- | --- | --- |
| `none` | The source's latitude never denies a solution, so no estimation rule is engaged. | every source below about 48 degrees latitude | see description |
| `seventh-of-the-night` | Fajr and Isha bounded to one seventh of the night from sunrise and sunset. R3 measured that this makes two independently written engines agree within 1 minute on every day of the year at London, Oslo, Reykjavik and Anchorage, where `middle-of-the-night` reaches 28 minutes apart. The recommended default where an authority publishes no rule of its own. | the app's own default recommendation, not any authority measured | A, measured, R3 |
| `middle-of-the-night` | Fajr and Isha bounded to the midpoint of the night. Measured to produce a 28-minute library-to-library spread at Anchorage, so it is recorded to be avoided rather than chosen. | no authority measured | A, measured, R3 |
| `diyanet-brussels-45` | Above 45 degrees latitude Isha is Maghrib plus 1 hour 20 minutes, capped so it never falls after one third of the shar'i night. For Imsak, from March to September, 10 minutes are added to the Maghrib-to-Isha interval and that interval is subtracted from sunrise. Diyanet's own published rule, the Brussels Conference decision. | tr-diyanet-*, and every Diyanet diaspora city | A, cited, Diyanet's own words via DITIB, R1 |
| `frozen-fraction-of-night` | On the boundary day, the last day the angle solves, record the published time's fraction of that night. Hold that fraction and apply it to each subsequent day's own night. R9 measured this reproduces Islamiska Forbundet's 118 unsolvable Stockholm days to a median 1.0 and worst 1.9 minutes. The fraction is the authority's OWN, derived from its own boundary day: Stockholm Fajr 0.2148 which is 1/4.66, Isha 0.1923 which is 1/5.20; Malmo 0.2159 and 0.1919. A plain one-seventh rule misses the same table by a median 29 to 31 minutes. | se-ifis-stockholm, se-ifis-malmo | A, measured, R9 |
| `frozen-clock-time` | Carry the last angle-derived clock time unchanged through the unsolvable stretch. This is Aqrab al-Ayyam, the nearest day, applied as a clock time rather than as a proportion. R9 measured Islamsk Rad Norge printing Fajr 03:37 unchanged for 34 days and 03:17 for 46, with the value carried across the boundary unchanged: 4 April prints 03:37 with its own `Morgengry 16` column filled, 5 April prints 03:37 with it blank. | no-irn-oslo, be-emb-brussels | A, measured, R9 |
| `relative-estimate-latitude-45` | The Executief van de Moslims van Belgie states this rule in Arabic on its own calendar, `التقدير النسبي لخط عرض 45`, the relative estimate at latitude 45, from the start of May to the end of July. R9 tested it literally and it does NOT reproduce the printed table: computing at latitude 45 with Brussels's longitude leaves a median 20.9-minute error on Fajr, and latitude 46 leaves 10.7. What the table actually does is freeze a clock time. The stated rule and the printed table are different objects, and that gap is the finding. | be-emb-brussels, as its STATED rule | A cited for the statement, measured for the contradiction, R9 |
| `aqrab-al-ayyam-three-day-average` | Wifaqul Ulama's published rule: a three-day average rather than the absolute last solvable day. Its own FAQ states that Aqrab al-Ayyam and Nisful-Layl must not be mixed. | gb-wifaqululama | A, cited, the body's own FAQ, R1 |
| `moonsighting-seasonal` | A seasonal function of latitude and day, bounded by the 18-degree time, with one seventh of the night above 55 degrees. Three Shafaq variants for Isha. Audited in depth by the 2026-09-14 moonsighting wave and not re-researched here. | gb-london-unified, indirectly, through the Blackburn interval tables | A, cited, wave 1 |
| `NOT-PUBLISHED` | The authority publishes NO ROW for this prayer at all, which is different from publishing one this research could not read. Iran's state table prints `azan maghrib` and `nimeshab` and no Isha; the Islamic Foundation Bangladesh's Ramadan artefact gives sahri, Fajr azan and iftar only. The app renders `--:--` and NEVER substitutes a library constant, because a substituted value is indistinguishable on screen from a published one. | ir-calendarcentre-tehran for isha, bd-islamicfoundation-dhaka for isha | A, the absence read on the authority's own output, R5 |
| `seasonally-varying-angle` | The published Fajr is not a fixed angle: its implied angle is a smooth function of the day of the year. R9 measured the Grande Mosquee de Paris's own 366-day calendar sweeping 18.0 in December and January to 13.05 in June and back, whole-year range 13.03 to 18.10, matching an exact 18 degrees on only 78 of 348 solvable days. R12 reproduced it. The one clean category 3 the programme found, and the reason `fr-gmparis-paris` must never carry the 18 degrees every earlier report cited. | fr-gmparis-paris | A, measured on the mosque's own published year, R9, reproduced R12 |
| `angle-based` | Fajr and Isha held at their own angle relative to sunrise and sunset when the angle itself has no solution, which is `praytimes.org`'s `AngleBased` and the rule the Kazakh muftiate's vendored `prayTimes.js` leaves at its default. Named because it is what the muftiate's own code does rather than a rule the muftiate published, so it is the weakest high-latitude attribution in the catalog. | kz-muftiyat-astana | A for the code read in the page source, NULL as a stated muftiate position, R5 |
| `UNKNOWN-arctic` | Islamiska Forbundet publishes a full year for Kiruna, Gallivare, Jokkmokk, Haparanda and Pajala, all at or above the Arctic Circle, and no construction tested reproduces it. R9's frozen fraction leaves a median 23.5 and worst 89.3 minutes; R11's sweep of Aqrab al-Bilad, frozen clock time and a frozen printed-Shuruk offset all fail too, and at Kiruna the printed Shuruk itself runs a median 27.2 and worst 142.2 minutes from true sunrise, so even the SUNRISE column is substituted. Named so it is not silently defaulted. | se-ifis-kiruna and the four other Swedish Arctic cities | NULL, the rule could not be identified, R9 and R11 |

<!-- END catalog-rules -->

---

## Part 3: what a source must provide, and what happens when it cannot

A specification a planning session can build against. It is written as requirements on the data, not as a design
for the app.

### 3.1 The minimum viable source

A source that cannot supply all of these cannot be shipped, because without them the app either cannot render a
day or cannot attribute what it renders.

| Field | Why it is mandatory |
| --- | --- |
| `id` | the MMKV key prefix. R8 measured that today's `prayer_${date}` key has no location in it (`stores/database.ts:138`), so two cities' data collide silently under one key and every guard checks shape rather than provenance. This is the largest silent risk in the codebase and the `id` is its fix |
| `authority` | the app names the authority on the screen where the times are. A source with no nameable authority is the `computed-fallback` row and must say so |
| `timezone` | an IANA zone, because a stored wall-clock time is meaningless without one. R6 measured that a stale tz database made every Moroccan prayer time an hour wrong on 103 days of 2026, and Morocco needs `Etc/GMT` rather than `Africa/Casablanca` because the ministry serves at UTC+0 through permanent DST |
| `conceptToRow` for `fajr` | `fajr` must always be populated from whichever row carries the concept. Turkey's `İmsak` IS Fajr; bind it as an Imsak and a Turkish user has no Fajr row at all |
| `conceptToRow` for `dhuhr`, `asr`, `maghrib`, `isha` | the four remaining obligatory prayers. Sunrise is NOT in this list; see 3.2 |
| `obtain` | how a day is retrieved, and whether a whole year comes in one pass. This decides the caching shape |
| `evidence` and `report` | an unattributed parameter cannot be audited, and every parameter in this catalog was contested by at least one report |

**`asrShadowFactor` is mandatory for any source that publishes an Asr**, because conflict 6 measured that getting
it wrong costs 40 to 78 minutes, which is larger than any Fajr disagreement in the catalog outside the polar
regions.

**`rounding` is mandatory in the sense that UNVERIFIED is an acceptable value and absent is not.** R6 measured
that `adhan`'s own nearest-minute default was the single largest source of apparent disagreement with authorities
in the programme, moving Umm al-Qura from 42.8% to 85.4% exact and Indonesia from 62.5% to 90.3%. A source whose
rounding is unknown must carry `UNVERIFIED` so that a future comparison against it knows not to trust an
exact-match rate. **Eighteen of the 39 rows carry it that way**, which is every source R6 did not measure.

### 3.2 What the app does when a source lacks a field

The standing rule forbids inventing a time. So a missing field is never filled, and the specification is about
what the app shows instead. Three real cases in the catalog establish the pattern.

| Missing field | Real case | What the app must do |
| --- | --- | --- |
| **Isha** | `ir-calendarcentre-tehran`. Iran publishes `azan maghrib` and `nimeshab` and **no Isha row at all**. The 14-degree Isha in every library is untestable against the state table | render `--:--` for Isha, and never substitute the library constant. Iran also publishes a `shar'i midnight` that R5 proved empirically is the Jafari sunset-to-Fajr midpoint, 42 minutes from the Sunni midpoint every library computes by default. The extra row is shown; the absent one is not invented |
| **Sunrise** | `tn-inm-tunis`. Tunisia's year-round day view prints exactly **five rows** and no sunrise. This is the catalog's canonical missing-field case | render `--:--` for Sunrise. Sunrise is not an obligatory prayer, so its absence degrades the display and does not block the day. But note the second-order cost: the app's `Duha` is `Sunrise + 20`, so a missing sunrise silently removes a derived Extra too, and that must be explicit rather than blank |
| **Asr** | `ir-calendarcentre-tehran` and `bd-islamicfoundation-dhaka` both publish no Asr in the artefact obtained | `--:--`, and `asrShadowFactor` stays `null` rather than defaulting to 1.0. A defaulted factor is a computed time wearing an authority's name |
| **Every parameter** | `xk-bik-pristina` measured three times on three days and still one day each; its high-latitude behaviour is completely unknown | the parameters that were measured are used, and `highLatitudeRule` carries `UNVERIFIED`. A source may be shippable on the days its parameters hold and not shippable on the days they do not; see 3.3 |

**The rule that generalises.** A source declares which concepts it can answer. A concept it cannot answer renders
`--:--` for that prayer on every day. **The app never fills one source's gap from another source**, because the
result would be a day whose rows come from two authorities, attributable to neither.

### 3.3 How a source declares it cannot answer for a given day

The app renders `--:--` per prayer, so the mechanism exists. What the catalog adds is that **a source can fail on
some days and not others, and the reason matters**, because two of the reasons are correct behaviour and one is a
defect.

| Reason a day has no answer | Real case, measured | What it is |
| --- | --- | --- |
| **The angle has no solution and the authority publishes a rule** | `se-ifis-stockholm`: an 18-degree Fajr has no solution on 118 days and IFiS prints a Fajr on all 365. Its rule is a frozen fraction of the night, 0.2148, which reproduces all 118 to a median 1.0 minute | not a gap. The source answers, via its own published rule. The rule goes in `highLatitudeRule` and the answer is the authority's |
| **The angle has no solution and the authority publishes a rule this programme could not identify** | `se-ifis-kiruna`: at 67.86 N an 18-degree Fajr has no solution on 166 days, IFiS prints a number on all 365, and nothing reproduces it. The frozen fraction that fits Stockholm to 1 minute leaves a median 23.5 and worst 89.3 minutes here, and the printed SUNRISE itself runs a median 27.2 minutes from true sunrise, so even the solar columns are substituted | **an explicit unknown, and it must be carried as one.** `highLatitudeRule` is `UNKNOWN-arctic`. The app must not default such a source to a library rule, because a library rule would produce a number the authority did not print and could not be told apart from one it did |
| **The angle has no solution and the source is a computation** | `computed-fallback` above about 48.6 N, which R7 measured as the exact latitude where an 18-degree Fajr first loses a day | the high-latitude rule fires, and it is the app's choice rather than an authority's, so it must be labelled as the app's. R7 measured the spread BETWEEN rules at one library as 47.8 minutes at London and 112.7 at Tromsø, so this choice is worth up to four hours and cannot be silent |
| **Polar: no answer exists at any angle** | `adhan` returns `Invalid Date` on 69 to 116 days a year at Tromsø, which R7 confirmed against the USNO on 350 of 350 null days at 18 degrees | `--:--` is correct. R7 further measured that even filling the nulls produces an out-of-order prayer card on 18 of 248 days, so filling is not a fix |
| **The feed is wrong** | `bn-mora-brunei`: 367 rows for 364 distinct dates, 3 duplicate dates carrying two different timetables each, 3 unparseable time strings, and one value jumping more than 4 minutes from both neighbours | **a defect, and the only one in the programme.** Any ingest needs a monotonicity check on the prayer sequence, which is what detected all six. A row that fails it is `--:--`, never a guess |

**So a source declares three things per day, not one:** whether it has an answer, and if not, whether the absence
is the authority's (a published rule fired), the app's (a library rule fired, labelled as such) or nobody's (no
answer exists). The third is `--:--`. The second is `--:--` or a labelled estimate. The first is a real time.

**One more case the catalog must carry, because two authorities publish it and it looks like a defect.** Belgium's
EMB prints 25 days whose `Icha` falls **after midnight**, up to 00:07, and publishes a standing permission to
combine Maghrib and Isha during that window. Sweden publishes a computed table for the whole year **and** a
standing fatwa permission not to follow it. A day whose Isha belongs to the next calendar date is not an error and
must not be dropped by a `belongsToDate` check.

### 3.4 How two sources for the same place are distinguished to a user

France needs this worst, and R12 measured why. R9 established the distribution: **48.1% of 52 measured French
mosques print a Fajr at or near 12 degrees and 11.5% near 18**, with 28.8% between 13 and 15. So the two published
French positions between them describe about three in five mosques, and the plurality answer is the one nobody
cites.

**Naming the authority is not enough, because the two French sources are not two angles.** R12 priced them at
Paris against the Grande Mosquée's own 366-day calendar (`data/catalog/results-fr-gap.txt`), Musulmans de France
minus Grande Mosquée de Paris, in minutes:

| Month | Fajr delta, median | Isha delta, median |
| --- | ---: | ---: |
| January | +23 | -15 |
| March | +25 | -21 |
| May | +18 | -1 |
| **June** | **+14** | **+12** |
| September | +24 | -21 |
| **December** | **+38** | **-26** |
| **Whole year** | **+13 to +39, median +24** | **-26 to +14, median -18** |

**The Isha delta reverses sign across the year.** A user told only that one source is "12 degrees" and the other
is "18 degrees" would expect the 12-degree source to be later on Fajr and earlier on Isha by a stable amount.
Neither is true: the Fajr gap nearly triples between June and December, and the Isha gap crosses zero in May.

**So the specification is that a source choice is presented with its measured delta at the user's own place, on
the day they are looking at.** Four requirements follow, each answering something the catalog measured:

1. **Name the authority, always.** The app shows what a named authority published. A source with no authority is
   the computed fallback and is labelled as a computation, not as a body.
2. **Show the delta against the currently selected source, per prayer, for today.** This is the only
   representation that tells a user whether the choice matters to them. In South Africa it matters by 40 to 78
   minutes on Asr and by nothing at all on Fajr; in France it matters by 24 minutes on Fajr and reverses on Isha.
   A single headline number would mislead in both.
3. **Say what kind of body it is, because they are not comparable.** The catalog holds state authorities
   (`tr-diyanet-*`, `eg-esa-cairo`), statutory bodies (`lk-acju-zone01`), national representative councils
   (`be-emb-brussels`), a single mosque's own calendar (`fr-gmparis-paris`), a fatwa that publishes app settings
   rather than times (`za-jamiatkzn-fatwa`), and a bare parameter set (`computed-fallback`). A user choosing
   between the MJC's published table and the KZN Jamiat's fatwa is choosing between a timetable and a
   recommendation, and that difference is the substance of the choice.
4. **Never claim the user's mosque.** R4 measured nine central London mosques disagreeing by 26 minutes on Fajr
   and 48 on Asr, and R9 measured that a majority of Mawaqit mosque records in West Africa fail a solar sanity
   gate because the published Dhuhr sits 20 to 83 minutes after true noon: the mosque platform record IS the iqama
   schedule in much of the region. **An accuracy claim can be scoped to an authority and can never be scoped to a
   mosque.**

**A fifth requirement that only appears where a country has no national body.** R9 measured that French mosque
clustering is **municipal, not national**: Marseille is 12.5 to 13.1 at nine of ten, Lille 12.5 to 12.7 at all
ten, Lyon a tight 14.24 to 14.42 which is neither published position, and Strasbourg splits into a 12-degree
French group and a 17.9-degree group with a 7-to-9 minute Maghrib margin, which is the Diyanet temkin signature.
Strasbourg is not a French disagreement at all: it is a Turkish timetable and a French one sharing a city. **So a
country-level default is the wrong granularity in France, and the honest default there is to ask.**

---

## Part 4: the launch set

Ranked on users served, evidence quality, obtainability, and how much new machinery each source requires. The
fourth criterion is the one that orders the list, because the first source of each new kind pays for all the
later ones.

### The ranking inputs

| Source | Muslims served, cited R5 | Evidence | R6 category | Obtain | New machinery it forces |
| --- | ---: | --- | --- | --- | --- |
| `gb-london-unified` | the app's existing users | A | **4** | keyed provider year | none; it is the status quo |
| `my-jakim-*` | 20.1 M | A | 2 | keyless whole year | **zones, a distinct Imsak with an angle, a published Duha, Malay month names** |
| `eg-esa-cairo` | 87.5 M | A | **1** | keyless page, month at a time | Arabic meridiem markers, 12-hour afternoon values |
| `id-kemenag-jakarta` | 249.8 M | A criteria, **C feed** | 2 | third-party proxy, 12 calls | an Imsak as an OFFSET, a Duha at 4.5 degrees above the horizon |
| `tr-diyanet-*` | 81.2 M | A | 2 | keyless whole year | **the concept map's hardest case: `İmsak` IS Fajr** |
| `sg-muis-singapore` | 0.8 M | A | 2 | keyless open data | 12-hour with NO meridiem |
| `sa-ummalqura-makkah` | 31.5 M | A | 2 | keyless Hijri year | **a Hijri-conditional rule**, the Ramadan 120-minute Isha |
| `ae-awqaf-dubai` | part of 355.5 M band | A | 2 | keyless, browser-origin gated | **published iqama offsets**, 60 areas in one 13.6 MB response |
| `ba-rijaset-sarajevo` | small | A | not measured | keyless any date | none beyond the basics |
| `computed-fallback` | **59.9% of the world** | **D** | n/a | local computation | **the high-latitude rule and the polar policy** |

### Does R8's Malaysia-first argument hold against the full catalog?

**Yes, and R12's own measurement strengthens it.** R8 argued for Malaysia because it exercises zones, Imsak, Duha
and a whole-year feed simultaneously. Tested against the catalog:

| R8's claim | Holds? | What the catalog adds |
| --- | --- | --- |
| It exercises zones | **yes, and more than R8 knew** | R12 measured 60 zones answering, and found two per-zone anomalies a per-country model would ship wrong: PLS01 publishes no distinct Imsak at all, and KTN01 uses a 17.5-degree Isha against the national 18 |
| It exercises Imsak | **yes, and it is the harder of the two Imsak cases** | R12 measured JAKIM's Imsak as its own 20-degree ANGLE, where Indonesia's identically named row is a 10-minute offset. Building against Malaysia forces the `derivation` field that Indonesia would not have revealed |
| It exercises Duha | **yes** | measured at 20 to 28 minutes after Syuruk depending on the zone, invariant within a zone. This collides with the app's own `Duha` of `Sunrise + 20`, which R8 correctly called worse than a missing row because it looks right |
| It exercises a whole-year keyless feed | **yes, with two traps** | the `&year` parameter is ignored, so JAKIM offers exactly one year; and the feed emits Malay month abbreviations for 5 of 12 months, so parsing as English silently drops 153 rows of 365 |

**One correction to R8's reasoning, not its conclusion.** R8 ranked Malaysia first partly on it being a large
source. It is not: 20.1 million Muslims, ranked 21st. **Malaysia is the right first source because it is the
hardest cheap one, not because it is big.** Every structural problem the catalog contains except the concept
inversion and the high-latitude rule appears in Malaysia, and it appears with a keyless whole-year feed and a
category 2 classification, so the machinery can be built against a source that is easy to obtain and hard to
model. That is the right order.

### The launch set

**Three sources, in this order.**

| # | Source | Why here |
| --- | --- | --- |
| 1 | `gb-london-unified` | not a choice. Every existing install is pinned to it explicitly on upgrade, with the same provider, key scheme and times. R8 measured that a computed source would move an existing user's Fajr by -7 to +6 minutes and Isha by -4 to +11, which for a user who chose this app for London's unified timetable is a defect |
| 2 | `my-jakim-wly01`, plus `my-jakim-ktn01` and `my-jakim-pls01` | the hardest cheap source, per above. Ship all three zones rather than one, because the two anomalous zones are the evidence that the zone is the unit and not the country, and shipping only Kuala Lumpur would encode the wrong model |
| 3 | `eg-esa-cairo` | **the only category 1 in the programme, so it needs no fetch and no correction table at all.** All six correction constants are zero on all four cities R6 measured and 8,400 of 8,400 values land within 1 minute, which means a correctly configured library IS the Egyptian authority's timetable. That matters more than its obtainability, which is poor: its page serves one day for all 78 cities or one month per ASP.NET postback, and no whole year. 87.5 M Muslims, the third-largest population with an established convention |

**Why not the computed fallback in the launch set.** It serves the most people and it requires the most new
machinery: the high-latitude rule, whose choice R7 measured as worth up to four hours, and the polar policy, which
R7 measured still produces an out-of-order prayer card on 18 of 248 days even under the honest option. It is also
the one source that cannot be verified against any authority, because there is no authority. Ship it once the
three attributable sources have proved the model.

### The second wave

| Source | Why second, not first |
| --- | --- |
| `tr-diyanet-ankara` and `tr-diyanet-istanbul` | it is the concept map's hardest case and it is worth doing after the map exists rather than while building it. Turkey is also the ONE exception to the per-city rule, one constant set covering all ten cities measured, so it is cheap once the machinery is there |
| `id-kemenag-jakarta` | the largest Muslim population on earth, and the feed is the problem: tier C, a third-party proxy whose Kemenag provenance is UNVERIFIED, twelve calls per city-year, and R12 found one probed city code that does not resolve to the city assumed. Worth the wait for a better path |
| `sg-muis-singapore` | small population, easy source, and its value is that it is the cleanest test of the rounding machinery, being the programme's strongest round-down inference |
| `sa-ummalqura-makkah` | needs the Hijri-conditional Ramadan Isha rule, which is one conditional and nothing else in the launch set requires it |
| `ba-rijaset-sarajevo` | the friendliest feed in the catalog, every location for any date, keyless. A good second-wave source precisely because it adds nothing new and therefore proves the machinery is general |
| `ae-awqaf-dubai` | it publishes the state's own iqama offsets, which nothing else does, and R8 measured that jamaah is already typed in the app and never read. Pairing the two is the cheapest large feature available |
| `computed-fallback` | see above. It belongs in the second wave with the high-latitude work, not after it |

### The sources not to attempt yet, each with its reason

| Source | Reason |
| --- | --- |
| `se-ifis-kiruna` and the four other Swedish Arctic cities | **the rule is not known.** R9 and R11 both attacked it and nothing reproduces it, and the printed sunrise itself runs a median 27.2 minutes from true sunrise, so even the solar columns are substituted. Shipping it means shipping a guess |
| `az-cmb-baku` | the only source in the catalog read by OCR of an image, which is the programme's weakest evidence link. Its internal consistency is strong, an exactly 5-minute Imsak gap and a 14-to-15-minute Maghrib on all 30 days, but a production ingest of a WebP calendar is a different kind of work |
| `lk-acju-zone01` | measured at one zone for one month, with the zone's anchor point unknown. JAKIM's case showed an unknown zone anchor can shift a measured angle by degrees, so this needs the anchor before it needs an implementation |
| `xk-bik-pristina` | three readings on three days agreeing exactly, and still no month, no seasonal behaviour and no high-latitude rule. Kosovo also heads its first row `Sabahu` where its neighbour Albania uses `Imsaku`, so a Balkans default would be wrong for one of the two |
| `fr-gmparis-paris` and `fr-musulmansdefrance` | France needs the disambiguation UI before it needs either source, because R9 measured that the clustering is municipal and neither published position describes the plurality |
| `ir-calendarcentre-tehran` | publishes no Isha, no Asr in the obtained artefact, serves one day at a time, and `calendar.ut.ac.ir` returned HTTP 504 on every attempt through three paths over about 20 minutes |
| `bn-mora-brunei` | the only authority in the programme whose own feed contains errors. Shippable, but only behind the monotonicity check, and it serves a small population |
| `qa-moi-doha` | its live endpoint and its digitised perpetual table **disagree by 1 to 2 minutes** and the catalog records that rather than resolving it. Pick one and prove it first |
| `za-mjc-capetown` and `za-jamiatkzn-fatwa` | these need the two-sources-one-country UI, which is the same machinery France needs. Do France's version once and South Africa is nearly free |
| `bd-islamicfoundation-dhaka` | a Ramadan-only artefact with no Isha and no Asr, and plain fetch fails with a TLS chain error. 150.8 million Muslims and no year-round table |
| Thailand's 77-province tables | **a genuine national authority table behind a Cloudflare rule rather than behind an absence.** R9 established the authority and the table at tier A and got none of the numbers. This is the highest-value single unmeasured source in the programme |

---

## Part 5: the gaps

Stated bluntly, because the specification is worth less if it implies a coverage it does not have.

### 5.1 The headline: most of the catalog's coverage is fallback, not fidelity

R5 computed it and R12 reproduced it from `data/countries/population-weighting.mjs`:

| Evidence state, within the top 25 Muslim populations | Muslims | Share of world Muslims |
| --- | ---: | ---: |
| **A: measured or read on the authority's own site** | 770,969,347 | **38.5%** |
| **NULL: nothing sourceable at all** | 597,378,244 | **29.9%** |
| C: asserted second-hand, Pakistan alone | 233,000,000 | 11.7% |
| D: a library constant only | 61,500,000 | 3.1% |

Summed across every country where the convention IS established, including those outside the top 25, the total is
**40.1% of the world's Muslims. The remaining 59.9% have no national convention an app can honestly claim to
follow.** No single convention family reaches 20% of the world's Muslims: the deepest band, Fajr 19 to 20, covers
19.8%, and the 18-to-18.2 band covers 17.8%.

**So the `computed-fallback` row is the app's answer for the majority of the world, and it is honest rather than
good.** It must never be labelled as an authority. Its own parameter pair is the `praytimes.org` default 18/17,
and the name `Muslim World League` is not available for it: R5 read the MWL Fiqh Academy's collected resolutions
from twenty sessions, 448,078 characters published by the MWL itself, and found **zero occurrences of the Arabic
root for degree**, while R7 found MWL's own software country-switches to Umm al-Qura's 90-minute Isha inside Saudi
Arabia.

### 5.2 Fields that could not be filled

| Field | Rows affected | Why |
| --- | --- | --- |
| `rounding` | **18 of 39** carry `UNVERIFIED` | **no authority found in the entire programme publishes its rounding rule.** R6 inferred it from the digits for the eleven authorities it measured, and the inference is strong only where the residual mean lands within 0.05 of an integer under exactly one rule. Every source R6 did not measure has no rounding evidence at all, which is the whole of the 18 |
| `highLatitudeRule` | **5 rows**: Kosovo, France's two, and the two FCNA rows | all five engage a rule at their latitude and none publishes one. FCNA's own paper discusses the problem and prescribes nothing |
| `offsetsMin`, individual fields | `?` on sunrise for Tunisia, Algeria, Mauritania, Belgium, Norway, Sri Lanka; on several fields for Iran, Bangladesh, the Grande Mosquée | each is a field the source does not publish or whose artefact did not contain it. A `?` is deliberately distinct from a 0 |
| `coordinates` | null on **7 rows** | a national parameter set (`us-fcna`, `ca-fcna`, `fr-musulmansdefrance`, `gb-wifaqululama`, `za-jamiatkzn-fatwa`, `computed-fallback`) has no single anchor, and Brunei's Belait is a decreed offset rather than a place |
| `r6Category` | **20 of 39 not measured** | R6 measured eleven authorities. Everything R9 and R5 found afterwards has no category, which means it is not known whether a small constant set closes it |

### 5.3 Sources whose parameters remain unknown

| Source | What is unknown |
| --- | --- |
| `se-ifis-kiruna` and Gällivare, Jokkmokk, Haparanda, Pajala | **the entire high-latitude construction.** Two reports attacked it. The frozen fraction that fits Stockholm to 1 minute leaves a median 23.5 and worst 89.3 minutes; frozen clock time leaves a median 71; Aqrab al-Bilad gives an implied latitude swinging across 63 degrees; and the printed sunrise is itself substituted |
| `be-emb-brussels` | **its stated rule does not reproduce its printed table.** The EMB names `التقدير النسبي لخط عرض 45`, the relative estimate at latitude 45, on its own calendar. Tested literally, latitude 45 leaves a median 20.9-minute error and latitude 46 leaves 10.7. What the table does is freeze a clock time. The stated rule and the printed table are different objects and the gap is unexplained |
| `xk-bik-pristina` | any seasonal behaviour, and the high-latitude rule |
| `lk-acju-zone01` | the zone's anchor point, which is what a measured angle depends on |
| `id-kemenag-jakarta` | Kemenag's own province codes. Its endpoint was located and the codes were not, so the feed runs through a third party whose Kemenag provenance is UNVERIFIED. R12 additionally found one probed code that does not resolve to the city assumed |
| `my-jakim-ktn01` | **why** Kota Bharu uses a 17.5-degree Isha against the national 18. R6 swept the angle and found it, and no source explains it |
| `qa-moi-doha` | which of its two artefacts is authoritative, since they disagree by 1 to 2 minutes |
| Karachi 18/18, which underwrites `za-jamiatkzn-fatwa` and every subcontinental default | **permanently unverifiable.** No University of Islamic Sciences publication exists and the university is not a state body. R7 priced the uncertainty: choosing 18 over 15 moves Fajr by 14.1 to 15.5 minutes across Karachi, Lahore, Delhi and Dhaka |

### 5.4 Countries where the app falls back to a plain computation

Every one of these was searched, and for most of them the finding is structural rather than a gap in the
searching. R9's UNVERIFIED and NULL section names what was searched in each case.

| Group | Countries | Muslims affected |
| --- | --- | --- |
| **No national authority found, largest first** | India, Pakistan, Nigeria, Iraq, Sudan, Afghanistan, Ethiopia, Uzbekistan, China, Niger, Mali, Tanzania, Senegal, Syria | about 597 M in the top 25 alone |
| **An authority exists and publishes no timetable, its own site read** | Kenya (SUPKEM), Ethiopia (Islamic Affairs Supreme Council), Libya (Awqaf), Nigeria (NSCIA), Tanzania (BAKWATA), the Netherlands (CMO), Spain (Comisión Islámica), Italy (UCOII), Trinidad and Tobago (ASJA), Guyana (CIOG) | a weaker finding than no body existing, and a different one |
| **An authority and a national table exist and the numbers could not be obtained** | **Thailand**, 77 provinces behind Cloudflare | the only case in this class |
| **A decreed authority exists and its artefact was not located** | Sudan, whose Islamic Fiqh Academy is documented as the official body for issuing and approving the national imsakia | 38.6 M |
| **Mosque practice measurable, no convention** | Libya, Somalia, Kenya, Tanzania, Ghana, Chad, Japan, South Korea, Brazil, Argentina, Suriname, Australia, the Netherlands, Spain, Italy | one to seventeen mosques each. Every one measures in the 17.8-to-18.5 Fajr band, which is **a discovery about international prayer-time software, not about local conventions**, and must not be read as one |
| **Nothing at all** | China, the Philippines, New Zealand, Mexico, Fiji, North Macedonia, Ivory Coast | Mexico returned zero mosques |

### 5.5 Limits that are permanent

- **No oracle can ever verify a Fajr angle, an Isha rule or an Asr factor**, because those are juristic inputs and
  not astronomy. R7 built 37,340 USNO comparisons with 0 failures and they verify the solver, not the parameters.
  Knowing where verification stops is part of the specification.
- **The exact residual expires annually.** R6 measured that carrying Singapore's 2025 residual onto a 2026
  baseline reproduces 55.1% of values exactly, which is worse than reusing 2025's published times verbatim. A
  purely offline correction table is not durable without a yearly refresh.
- **The authorities themselves say Fajr and Isha are not determinable.** FCNA's own paper states the timings "are
  not directly dependent on the position of the sun but rather on the amount of light in the sky", which "is not
  scientifically predictable for each location on Earth". The observational record spans 9 to 20 degrees.
- **This catalog measured authorities, not mosques, and nothing in it helps with a mosque.** Nine central London
  mosques disagree by 26 minutes on Fajr. In West Africa the mosque platform record IS the iqama schedule.

### 5.6 What a future wave should take first

Ordered by value against effort, from this catalog's gaps rather than from the earlier reports' wish lists.

1. **Thailand's 77-province tables.** The only case in the programme of a real national authority table sitting
   behind a Cloudflare rule rather than behind an absence. Highest value per unit of effort in the catalog.
2. **An R6 categorisation of the 20 sources R6 never measured.** Without it, nobody knows whether Bosnia, Norway,
   Belgium, Algeria, Mauritania or South Africa is closable by a small constant set, and that is the single fact
   that decides how each is shipped.
3. **The Swedish Arctic rule.** A real user-facing question for five cities, and two reports have now failed at
   it, which makes it worth scoping honestly rather than attacking a third time.
4. **Kemenag's own province codes**, which would move the largest Muslim population on earth from a tier C
   third-party proxy to a tier A authority feed.
5. **A rounding rule for the 18 sources carrying UNVERIFIED**, because R6 measured that rounding is the single
   biggest source of apparent disagreement and those eighteen cannot be compared against reliably without it.

---

## Sources

Everything below was read or run for this report. The nine agent reports are the primary input and are not
re-listed per fact; each catalog row names the report that established it.

### Measured by R12, re-running or extending existing harnesses

All under `ai/features/global-prayer-times/data/catalog/`. R5's `solar-harness.mjs` and `validate-harness.mjs`
were reused unchanged; `validate-harness.mjs` was run first and exits 0, reproducing the Egyptian authority's own
Cairo row for 2026-09-30 on all six times to the minute. **No new astronomy was written.**

| Script | What it settles | Output |
| --- | --- | --- |
| `measure-egypt-tiebreak.mjs` | conflict 1. Inverts 47 of the authority's own 78 city rows behind an anchor gate | `results-egypt.txt` |
| `measure-jakim-model.mjs` | conflict 2, test one. Six zones, 365 days each, Model A against Model B | `results-jakim-model.txt` |
| `measure-jakim-imsak.mjs` | conflict 2, test two. Where the cited 20 degrees lands, plus the Imsak gap at all 60 answering zones | `results-jakim-imsak.txt` |
| `measure-jakim-verdict.mjs` | conflict 2, test three. Whether each model's correction constant is uniform across zones | `results-jakim-verdict.txt` |
| `measure-id-imsak-angle.mjs` | conflict 10, new. Whether Kemenag's cited 20 sits on Subuh or Imsak, three cities, 123 days each | `results-id-imsak.txt` |
| `measure-za-asr-gap.mjs` | conflict 6. Prices the South African split on each time at both cities across a year | `results-za-asr.txt` |
| `measure-remaining-ties.mjs` | conflicts 7, 8 and 9. Kosovo's third reading, the Umm al-Qura discriminator, the MUIS year | `results-remaining-ties.txt` |
| `measure-fr-source-gap.mjs` | part 3.4, new. Prices the French choice at Paris against the mosque's own calendar | `results-fr-gap.txt` |
| `build-catalog.mjs` | generates every catalog table in this document from `sources.json`; `--check` guards drift | this file |

### Re-run to confirm another report's verdict

| Script | Confirms |
| --- | --- |
| `data/countries/measure-diyanet-temkin.mjs` | conflict 5. Exactly -7 and +7 at all seven Turkish cities from 0 m to 1,900 m |
| `data/countries/measure-bosnia-year.mjs` | conflict 4. 88 sampled days reproducing R9's distribution |
| `data/countries/measure-france-gmparis.mjs` | conflict 3. The 366-day sweep, 13.03 to 18.10, Isha interquartile exactly 87 to 87 minutes |
| `data/countries/population-weighting.mjs` | part 5.1. The 38.5% and 59.9% figures |

### Authority endpoints read live by R12 on 2026-09-30

| URL | What it served |
| --- | --- |
| `esa.gov.eg/praytimes.aspx` | the Egyptian General Authority of Survey's same-day table, 78 city rows |
| `e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=year&zone=<Z>` | JAKIM's keyless year, probed at 126 zone codes of which 60 answered |
| `api.myquran.com/v2/sholat/jadwal/<id>/2026/<m>` | the Kemenag-derived monthly tables, four city codes, four months each |
| `api.vaktija.ba/vaktija/v1/77/<y>/<m>/<d>` | the Bosnian Rijaset's Sarajevo rows, 88 sampled days |
| `bislame.net/namazet/` | Kosovo's Islamic Community, today only, the third independent reading |
| `ezanvakti.emushaf.net/vakitler?ilce=<id>` | Diyanet's Turkish rows including the unadjusted astronomical sunrise and sunset |
| `muis.gov.sg` via the `data.gov.sg` open-data CSV | the MUIS published year |

### Data files read rather than fetched

| File | What it is |
| --- | --- |
| `data/countries/fr-gmparis-mawaqit.json` | the Grande Mosquée de Paris's own 366-day calendar, captured by R9 from its Mawaqit `confData` |
| `data/highlat/sweden-rule-summary.json`, `sweden-nightfloor-summary.json` | R11's in-progress Swedish rule fits, read for the rule names only |
| `data/countries/za-mjc-capetown-2026-09.tsv` | the Muslim Judicial Council's published September 2026 month, captured by R9 |
