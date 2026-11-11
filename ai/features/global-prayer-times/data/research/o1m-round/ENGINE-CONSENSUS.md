# ENGINE-CONSENSUS — where five calculator families agree, and where they dispute the convention

Wave O1m-26, round o1m, worldwide prayer-times census. Workspace
`$HOME/athan-gitree/census/o1m/o1m-26-consensus/`. Local analysis over banked tables only: nothing
was crawled for this wave, and no page, feed or clock was read. Engine for every number below is
**adhan 4.4.6** at `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`, `Rounding.None`, its
own `SolarTime` core evaluated directly so that the library's silent high-latitude substitution
cannot fabricate a twilight. Dates come from the rows themselves; time zones are pinned per city.

Machine-readable: `data/engine-consensus.json` (full), `data/engine-consensus-matrix.json` (one row
per country), `data/engine-consensus-summary.json` (aggregates), `data/measure.json` (per
family-per-country fits and offsets), `data/special.json` (the three contested conventions).

---

## 1. The five families

| family | what it is | countries measured | cities sampled | rows measured |
| --- | --- | --- | --- | --- |
| Diyanet | Türkiye's authority, `namazvakitleri.diyanet.gov.tr`, 8,537 cities, civil year 2026 | 197 | 1,136 | 27,264 |
| tawkit | tawkit.net, PrayTimes-v2 family, GeoNames points, 8,708 cities, 2026-11 to 2027-10 | 75 | 473 | 11,345 |
| athanpro | athanpro.com, 2,689 city pages, one frozen September 2026 cycle | 231 | 1,512 | 3,024 |
| masjidi | masjidi.app tenant tables, 167 tables, 366-day scaffold, no year and no coordinates | 24 | 101 | 2,424 |
| turktakvim | turktakvim.com, 2,391 tables (73 geocoded), civil year 2026 | 9 | 57 | 1,368 |

A sixth family (pishkhanak, Iran's national print) is **not** in this matrix: it is one publisher in
one country and it is cited only in section 9.2.

## 2. Method

1. **Every table is measured at its own point.** For each sampled city, the published row is
   subtracted from the engine's row on the same civil date, per column, and the residual is wrapped
   to ±720 minutes. Published rows are local wall-clock minutes, converted through the pinned zone,
   so DST is the table's own.
2. **Sampling.** Up to eight cities per country, stratified by latitude, so a country's span is
   represented rather than its capital. Two dates per month (near the 6th and the 20th) for the
   measured spread; one date per month for the fit. Countries with a single published cycle
   (athanpro: September) use every other day of that month.
3. **The convention is fitted, not assumed.** Per country and column: the twilight angle (fajr,
   isha), the maghrib depression, the asr shadow factor, and an integer-minute margin. An isha
   printed as an interval is identified without a fit: isha minus maghrib is the same integer on
   every row and equals a published constant (60, 75, 80, 90 or 120). A margin above 12 minutes is
   charged, because a free angle plus a half-hour margin can mimic an interval and the honest
   decomposition must win.
4. **The crosspoint.** Each country gets one reference point — the median-latitude city among the
   families that publish coordinates, preferring a published point over a solved one. Every family's
   *fitted* convention is then evaluated at that one point on 2026-09-15, and its per-column offset
   against the shared base (18/17, Shafi, horizon 0.833°) is the number the matrix compares. This is
   what makes five publishers that serve different cities comparable: they are all moved to one
   place and one date.
5. **Clock, not convention.** A table that runs on a fixed clock shows a whole-hour step on all six
   columns; that step is removed and recorded (`clockShift`), because a clock is not a convention.

**The synthesis is validated against the measurement.** Crosspoint offsets reproduce the measured
per-city medians — the same family measured at its own cities — to a median of **0.1 minutes** and a
90th percentile of **0.2 to 0.7 minutes** on every family. The crosspoint is therefore not a model
guess: it is the measurement moved to a common place.

| family | pairs compared | median abs difference | p90 |
| --- | --- | --- | --- |
| Diyanet | 1,068 | 0.1 | 0.3 |
| tawkit | 342 | 0.1 | 0.4 |
| athanpro | 1,068 | 0.1 | 0.3 |
| masjidi | 66 | 0.1 | 0.7 |
| turktakvim | 54 | 0.1 | 0.2 |

**Diyanet's points are solved, and the solve is good.** That surface publishes no coordinates and no
zone. Latitude comes from the r7 day-length solution; longitude from the sunrise/maghrib midpoint,
which carries the temkin symmetrically and therefore recovers true noon; the zone from the nearest
gazetteer city of that zone. Against the published coordinates of 1,136 sampled cities the solved
point sits at a median of **9 km**, 75 per cent within 52 km, 90 per cent within 140 km.

## 3. Per-column agreement, 184 countries with two or more families

| column | countries | within 1 min | within 2 min | over 4 min | median spread | p90 |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 184 | 149 | 158 | 19 | 0.2 | 5.3 |
| sunrise | 184 | 4 | 5 | 178 | 7.0 | 7.3 |
| dhuhr | 184 | 5 | 6 | 169 | 5.0 | 5.1 |
| asr | 184 | 1 | 6 | 60 | 3.6 | 5.1 |
| maghrib | 184 | 1 | 5 | 175 | 6.9 | 7.1 |
| isha | 184 | 108 | 113 | 60 | 0.6 | 8.1 |

Read the two halves separately.

**The geometry is one convention.** The fajr angle lands within 1° of every other family in
**163 of 184 countries** and within 0.5° in 158; the isha angle lands within 1° in 131. The solar
core — transit, sunrise, sunset — is the same astronomy in all five families, at every latitude
tested.

**The printed margins are not.** Sunrise diverges by more than 4 minutes in 178 of 184 countries,
maghrib in 175 and dhuhr in 169. The cause is one publisher's stated ladder, not a disagreement
about the sun.

## 4. The margin ladder

Median fitted margin per column, per family, over every comparable country. A margin is the
publisher's own declared adjustment on top of the computed instant.

| family | countries | fajr | sunrise | dhuhr | asr | maghrib | isha |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Diyanet | 193 | 0.0 | **−7.0** | **+5.0** | **+4.0** | **+6.9** | +1.4 |
| turktakvim | 9 | +0.5 | **−4.5** | **+7.0** | **+7.0** | **+5.5** | **+7.3** |
| tawkit | 58 | +0.2 | 0.0 | +0.2 | +0.1 | +0.5 | +0.9 |
| masjidi | 11 | +0.2 | −1.7 | +1.2 | +0.1 | +1.0 | −0.8 |
| athanpro | 207 | −0.1 | 0.0 | 0.0 | +0.6 | 0.0 | +0.4 |

The Diyanet ladder is the sharpest constant in this whole round. Across 193 countries its tenth and
ninetieth percentiles are sunrise −7.1 to −6.9, dhuhr +4.9 to +5.0, asr +3.8 to +4.1, maghrib +6.7 to
+7.1. That is a national convention printed to the minute on three continents, and it independently
confirms the r7 finding of 105 exact countries from a different pipeline, a different sample and a
recovered point rather than a cited one.

turktakvim carries a second, distinct Turkish ladder: sunrise −4.5, dhuhr +7, asr +7, maghrib +5.5,
isha +7.3. It is not the Diyanet ladder and not the zero-margin platform convention.

tawkit, masjidi and athanpro print zero margins almost everywhere. **The Turkish pair and the three
computed platforms are therefore two conventions that differ by 5 to 7 minutes on the margin
columns while agreeing on the geometry.**

Spot check, computed by hand and not by the pipeline: Diyanet Al Mansurah 2026-09-15 prints
05:17 06:32 12:55 16:24 19:08 20:18; adhan 4.4.6 at 31.04 N 31.38 E gives 05:17.2 06:38.6 12:49.7
16:19.5 19:00.4 20:16.8, so the margins are −0.2 −6.6 +5.3 +4.5 +7.6 +1.3. The ladder reproduces on
one city, one day, by hand.

## 5. The classes

Two hundred and thirty-two countries carry at least one of the five families. Thirty carry exactly
one and cannot be compared. Two hundred and two carry two or more; of those, 184 keep at least two
families past the one-recipe gate and enter the matrix.

| class | countries | meaning |
| --- | --- | --- |
| ONE CONVENTION | 3 | every family within 2 minutes on all six columns |
| MARGIN DISPUTE | 107 | geometry agrees within 2 minutes; a stated margin differs by more than 2 |
| CONVENTION DISPUTE | 74 | the geometry itself differs by more than 2 minutes on fajr, isha or asr |
| NOT COMPARABLE | 18 | fewer than two families survive their own fit, or the points cannot be placed |
| SINGLE | 30 | one family only |

`MARGIN DISPUTE` is not in the brief's three-way vocabulary, and it is the largest class, so it is
named rather than folded into the dispute count. Folding it in would say that a 7-minute temkin is
the same kind of disagreement as a 25-minute isha — which is exactly what this matrix exists to
separate.

The three `ONE CONVENTION` countries are **turkey** (Diyanet, tawkit, athanpro — the three Turkish
tables share both the geometry and the ladder), **aland-islands** and **american-samoa**.

## 6. Headline table — every country with three or more families

Diy = Diyanet, Twk = tawkit, Ath = athanpro, Msj = masjidi, Ttk = turktakvim. `spread` is the widest
column's range across the families at the crosspoint; `lower / upper` are the two families at the
ends of that column, in minutes from the shared base.

| country | n | families | class | column | spread (min) | lower / upper |
| --- | --- | --- | --- | --- | --- | --- |
| turkey | 3 | Diy Twk Ath | ONE CONVENTION | isha | 1.9 | Diy -0.4 / Ath +1.5 |
| uganda | 3 | Diy Twk Ath | MARGIN DISPUTE | sunrise | 7.6 | Diy -7.1 / Twk +0.5 |
| burundi | 3 | Diy Twk Ath | MARGIN DISPUTE | sunrise | 7.5 | Diy -7.0 / Twk +0.5 |
| mali | 3 | Diy Twk Ath | MARGIN DISPUTE | sunrise | 7.5 | Diy -6.9 / Twk +0.6 |
| mauritania | 3 | Diy Twk Ath | MARGIN DISPUTE | maghrib | 7.5 | Twk -0.5 / Diy +7.0 |
| andorra | 3 | Diy Twk Ath | MARGIN DISPUTE | sunrise | 7.4 | Diy -7.0 / Ath +0.4 |
| kenya | 3 | Diy Twk Ath | MARGIN DISPUTE | sunrise | 7.4 | Diy -6.9 / Twk +0.5 |
| niger | 3 | Diy Twk Ath | MARGIN DISPUTE | sunrise | 7.4 | Diy -7.0 / Twk +0.4 |
| rwanda | 3 | Diy Twk Ath | MARGIN DISPUTE | sunrise | 7.4 | Diy -7.0 / Twk +0.4 |
| thailand | 3 | Diy Twk Ath | MARGIN DISPUTE | sunrise | 7.4 | Diy -6.9 / Twk +0.5 |
| dr-congo | 3 | Diy Twk Ath | MARGIN DISPUTE | sunrise | 7.3 | Diy -6.9 / Twk +0.4 |
| south-korea | 3 | Diy Twk Ath | MARGIN DISPUTE | sunrise | 7.3 | Diy -7.1 / Ath +0.2 |
| armenia | 3 | Diy Twk Ath | MARGIN DISPUTE | sunrise | 7.2 | Diy -7.2 / Twk +0.0 |
| iraq | 3 | Diy Twk Ath | MARGIN DISPUTE | sunrise | 7.2 | Diy -7.0 / Ath +0.2 |
| albania | 3 | Diy Twk Ath | MARGIN DISPUTE | sunrise | 7.1 | Diy -7.0 / Twk +0.1 |
| antigua-and-barbuda | 3 | Diy Twk Ath | MARGIN DISPUTE | sunrise | 7.1 | Diy -7.1 / Ath +0.0 |
| argentina | 3 | Diy Twk Ath | MARGIN DISPUTE | sunrise | 7.1 | Diy -7.1 / Twk +0.0 |
| australia | 3 | Diy Twk Ath | MARGIN DISPUTE | sunrise | 7.1 | Diy -7.0 / Twk +0.1 |
| syria | 3 | Diy Msj Ath | MARGIN DISPUTE | sunrise | 7.1 | Diy -7.0 / Ath +0.1 |
| aruba | 3 | Diy Twk Ath | MARGIN DISPUTE | sunrise | 7.0 | Diy -7.0 / Twk +0.0 |
| indonesia | 3 | Twk Msj Ath | MARGIN DISPUTE | sunrise | 3.2 | Twk -3.3 / Ath -0.1 |
| grenada | 3 | Diy Twk Ath | CONVENTION DISPUTE | asr | 62.3 | Ath +0.8 / Twk +63.1 |
| pakistan | 3 | Diy Twk Ath | CONVENTION DISPUTE | asr | 55.1 | Ath +0.7 / Twk +55.8 |
| uzbekistan | 3 | Diy Twk Ath | CONVENTION DISPUTE | asr | 53.5 | Ath +0.7 / Twk +54.2 |
| kyrgyzstan | 3 | Diy Twk Ath | CONVENTION DISPUTE | asr | 53.0 | Ath +0.8 / Twk +53.8 |
| kazakhstan | 3 | Diy Twk Ath | CONVENTION DISPUTE | asr | 52.5 | Ath +0.7 / Twk +53.2 |
| tanzania | 3 | Diy Twk Ath | CONVENTION DISPUTE | isha | 25.1 | Ath +0.0 / Twk +25.1 |
| russia | 3 | Diy Twk Ath | CONVENTION DISPUTE | fajr | 17.0 | Diy +0.0 / Twk +17.0 |
| spain | 3 | Diy Twk Ath | CONVENTION DISPUTE | fajr | 16.5 | Diy +0.0 / Twk +16.5 |
| jordan | 4 | Diy Twk Msj Ath | CONVENTION DISPUTE | fajr | 14.5 | Twk -0.2 / Msj +14.3 |
| sweden | 3 | Diy Twk Ath | CONVENTION DISPUTE | isha | 11.0 | Diy -10.7 / Ath +0.3 |
| nepal | 3 | Diy Ttk Ath | CONVENTION DISPUTE | isha | 8.1 | Diy -0.1 / Ttk +8.0 |
| myanmar | 3 | Diy Ttk Ath | CONVENTION DISPUTE | isha | 7.4 | Diy -0.1 / Ttk +7.3 |
| vanuatu | 3 | Diy Ttk Ath | CONVENTION DISPUTE | isha | 7.3 | Diy -0.3 / Ttk +7.0 |
| italy | 3 | Diy Twk Ath | CONVENTION DISPUTE | isha | 7.1 | Diy -6.3 / Twk +0.8 |
| guyana | 3 | Diy Ttk Ath | CONVENTION DISPUTE | isha | 6.9 | Diy +0.1 / Ttk +7.0 |
| liberia | 3 | Diy Ttk Ath | CONVENTION DISPUTE | isha | 6.9 | Ath -0.1 / Ttk +6.8 |
| libya | 3 | Diy Twk Ath | CONVENTION DISPUTE | isha | 6.9 | Diy -0.4 / Ath +6.5 |
| papua-new-guinea | 3 | Diy Ttk Ath | CONVENTION DISPUTE | isha | 6.9 | Ath +0.0 / Ttk +6.9 |
| south-sudan | 3 | Diy Ttk Ath | CONVENTION DISPUTE | isha | 6.9 | Diy +0.0 / Ttk +6.9 |
| egypt | 3 | Diy Twk Ath | CONVENTION DISPUTE | fajr | 6.6 | Twk -6.6 / Diy +0.0 |
| angola | 3 | Diy Twk Ath | CONVENTION DISPUTE | fajr | 6.1 | Twk -6.0 / Ath +0.1 |
| tunisia | 4 | Diy Twk Msj Ath | CONVENTION DISPUTE | isha | 6.0 | Diy -0.2 / Ath +5.8 |
| nigeria | 3 | Diy Twk Ath | CONVENTION DISPUTE | fajr | 5.6 | Twk -5.5 / Diy +0.1 |
| iran | 3 | Diy Twk Ath | CONVENTION DISPUTE | isha | 5.4 | Diy -0.3 / Twk +5.1 |
| ivory-coast | 3 | Diy Twk Ath | CONVENTION DISPUTE | fajr | 5.3 | Twk -5.3 / Ath +0.0 |
| afghanistan | 3 | Diy Twk Ath | CONVENTION DISPUTE | isha | 5.2 | Diy -0.2 / Twk +5.0 |
| oman | 4 | Diy Twk Msj Ath | CONVENTION DISPUTE | isha | 5.0 | Diy +0.0 / Ath +5.0 |
| united-arab-emirates | 3 | Diy Twk Ath | CONVENTION DISPUTE | isha | 5.0 | Diy +0.1 / Twk +5.1 |
| palestine | 4 | Diy Twk Msj Ath | CONVENTION DISPUTE | isha | 4.9 | Diy -0.3 / Ath +4.6 |
| malaysia | 4 | Diy Twk Msj Ath | CONVENTION DISPUTE | isha | 4.6 | Diy +0.5 / Ath +5.1 |
| bangladesh | 3 | Diy Twk Ath | CONVENTION DISPUTE | isha | 4.5 | Diy -0.1 / Twk +4.4 |
| india | 3 | Diy Twk Ath | CONVENTION DISPUTE | isha | 4.4 | Diy -0.1 / Twk +4.3 |
| bahrain | 4 | Diy Twk Msj Ath | CONVENTION DISPUTE | isha | 3.7 | Diy +0.4 / Msj +4.1 |
| kuwait | 4 | Diy Twk Msj Ath | CONVENTION DISPUTE | isha | 3.5 | Diy -0.1 / Ath +3.4 |
| algeria | 4 | Diy Twk Msj Ath | CONVENTION DISPUTE | fajr | 3.1 | Msj -1.6 / Ath +1.5 |
| morocco | 3 | Twk Msj Ath | CONVENTION DISPUTE | fajr | 2.9 | Msj -7.6 / Twk -4.7 |

Thirty-six of the fifty-seven countries with three or more families are convention disputes, twenty
are margin disputes, one is one convention. The full 184-country table is
`data/engine-consensus.json`.

## 7. The disputes, named

### 7.1 Asr school — five countries, and one more

The largest clean convention split in the set. tawkit reads **Hanafi** asr in five countries where
Diyanet and athanpro read **Shafi**, and the difference is stable across latitude within each
country: pakistan 55.1 min, uzbekistan 53.5, kyrgyzstan 53.0, kazakhstan 52.5, grenada 62.3. The
latitude trend is flat (pakistan 57.7 at 24.2 N against 53.8 at 36.3 N), which is the signature of a
shadow factor and not of a sky model.

A sixth country records the same split but is not claimed: **united-kingdom**, 49.2 min. tawkit's
British layer is a blend of per-city recipes rather than one national statement — its country fit
solves fajr at 14.3 with a 27.7-minute margin — so the school difference is measured and recorded,
and the o1m-3 ruling that the British pick is not claimable stands.

### 7.2 Isha — interval against angle, and an angle ladder

Two distinct disputes share the isha column.

**Model.** tawkit's own fits resolve isha to maghrib + 90 in nine countries (yemen, syria, tanzania,
ethiopia, burkina-faso, sudan, somalia, china, qatar), which agrees with eight of the countries the
o1m-3 fit called intervals, from a different sample and a different window. In the one of those nine
that survives the gate on both sides — **tanzania** — the interval sits 25.1 minutes from the
angle. athanpro's five Qatar pages print a median 90-minute gap (range 72 to 90) under a
label of 18/17: the label and the printed rows disagree, and the rows are the rule.

**Angle.** Where both use an angle, the ladder in the high and middle latitudes is 8 to 11 minutes
apart: sweden 11.0 (Diyanet isha 16.0 against athanpro 17.0), lithuania 9.9 (15.9 against 17.05),
isle-of-man 9.6, belarus 9.4, poland 8.8, latvia 8.2. The split widens towards the pole, which is
what separates a 16° isha from a 17° isha.

The low-latitude isha disputes are the small ones and they are the Gulf and South Asia: kuwait 3.5,
bahrain 3.7, india 4.4, bangladesh 4.5, malaysia 4.6, palestine 4.9, oman 5.0, the emirates 5.0,
afghanistan 5.2. In each, Diyanet's isha sits at 16.9 to 17.0 while tawkit and athanpro sit at 17.5
to 18.25 — about a degree deeper, worth 3.5 to 5 minutes at these latitudes.

### 7.3 Fajr — a country-level angle, not a latitude ladder

The fajr column agrees within 1° in 163 of 184 countries. The nineteen that depart are country
decisions, not latitude effects:

- **egypt 6.6** — tawkit (19.40) and athanpro (19.45) both run a degree and a half deeper than
  Diyanet (17.95), and the split is flat: 6.3 minutes at 22.3 N against 6.7 at 31.6 N.
- **nigeria 5.6, ivory-coast 5.3, angola 6.1** — here tawkit alone runs 19.35 to 19.50 while Diyanet
  and athanpro both sit at 18.00, so the same size of split has the opposite membership.
- **russia 17.0, spain 16.5** — the tawkit country fits here are not clean (Russia 73 per cent of
  cells, Spain a 15/15 pair), so the size is real but the convention behind it is a blend of
  per-city recipes rather than one stated angle.
- **jordan 14.5** — masjidi's four Jordan tables sit 14.3 minutes later on fajr than tawkit (-0.2)
  and Diyanet (0.0). A mosque-tier table, not a platform convention.
- **monaco 30.8, liechtenstein 19.7, vatican 28.7** — athanpro's Monaco page is a named regional
  body's rule (UMAM, 14/14), its five Liechtenstein pages are the same 14° rule, and its Vatican page
  is a mosque table. The split is 14° against 18°, correctly measured and correctly attributed: it is
  the regional body's convention, not the platform's.

### 7.4 The latitude trend, stated once

Convention splits that grow with latitude: isha (11 min at 60 N, 3 to 5 min at 25 N). Splits that do
not: asr (flat, a shadow factor), fajr in Egypt and Nigeria (flat, a country angle), the margin
ladder (flat at every latitude, because a temkin is printed). The matrix therefore separates a
latitude-driven twilight disagreement from a country decision and from a printed margin, and no
country's dispute is described by one number alone.

## 8. NOT COMPARABLE — eighteen countries, and why

The `NOT COMPARABLE` class is not a gap in the data. It is a family that failed its own one-recipe
gate on its own tables, and it is named so the exclusion is auditable. The commonest cause is
athanpro's mosque-source pages, which o1l-56 already separated: athanpro's Ireland set is 7 of 10
mosque pages, Germany 8 of 10, the Netherlands 9 of 10, Martinique 10 of 10, Mauritius 9 of 9. A
mosque's own schedule is not a platform convention and cannot be fitted to one.

| country | families that survive | excluded |
| --- | --- | --- |
| barbados | Diyanet | athanpro |
| brunei | Diyanet | athanpro |
| denmark | Diyanet | tawkit, athanpro |
| eswatini | Diyanet | athanpro |
| finland | — | Diyanet, athanpro |
| germany | Diyanet | tawkit, masjidi, athanpro |
| greenland | athanpro | Diyanet |
| ireland | Diyanet | athanpro |
| kosovo | Diyanet | athanpro |
| lebanon | Diyanet | masjidi, athanpro |
| martinique | Diyanet | athanpro |
| mauritius | Diyanet | athanpro |
| mayotte | Diyanet | athanpro |
| montenegro | Diyanet | athanpro |
| netherlands | Diyanet | tawkit, athanpro |
| norway | tawkit | Diyanet, masjidi, athanpro |
| saint-lucia | Diyanet | athanpro |
| switzerland | Diyanet | athanpro |

The gate is a median absolute residual above 2 minutes on any column, with the margin penalty
applied. It is not a claim that the excluded table is wrong; it is a claim that the table does not
reduce to one convention for that country, so no per-country offset can be stated for it.

## 9. The three contested conventions

### 9.1 US and China — the isha 18/16 claim

| country | family | fajr angle | isha angle | isha at the crosspoint | fit loss |
| --- | --- | --- | --- | --- | --- |
| united-states | Diyanet | 18.05 | 15.85 | −5.9 | 1.07 |
| united-states | athanpro | 18.00 | 17.05 | +0.1 | 0.62 |
| united-states | tawkit | 15.70 | 15.85 | −5.2 | 10.46 |
| china | Diyanet | 18.00 | **16.00** | −5.2 | 0.41 |
| china | athanpro | 18.00 | 17.05 | 0.0 | 0.26 |
| china | tawkit | 18.50 | maghrib + 90 | −4.9 | 6.14 |

The claim survives, at the family that made it. Diyanet's China column solves at **exactly 18.00 /
16.00**, and its US column at 18.05 / 15.85 — the 18/16 pair is a Diyanet signature in both.

No other family reproduces it. athanpro holds 18.00 / 17.05 in both countries, exactly one degree
shallower. tawkit publishes isha as maghrib + 90 in China, and its US layer does not fit one recipe
at all (loss 10.46 over seven cities, fajr solving at 15.7 with a 13.5-minute margin — a broken
surface, not an 18/16 statement).

So **18/16 is Diyanet's rule in the US and China and belongs to no one else in the set**. Where the
matrix says the US and China are comparable, it is comparing 18/16 to 18/17.

### 9.2 Iran — the maghrib depression

| family | maghrib model | depression | printed margin | monthly amplitude |
| --- | --- | --- | --- | --- |
| Diyanet | horizon | 0.83 | +6.9 | 1.8 |
| tawkit | horizon | 0.83 | +0.1 | 1.1 |
| athanpro | horizon | 0.83 | 0.0 | — (one month) |

**No family in the set carries the depression.** All three print maghrib on the horizon and differ
only in the margin: Diyanet adds 6.9 minutes, tawkit 0.1, athanpro 0.0. The 4.5° depression is
pishkhanak's rule, and it stays there: a fixed margin reproduces 64 per cent of Iran's national print,
the depression reproduces 100 per cent, and none of the five families reproduces either.

The Iranian agreement that does exist is at fajr and isha: all three solve 17.9 to 18.1 at fajr and
17.1 to 17.9 at isha, with tawkit's isha at +5.1 against Diyanet — the round's smallest Iranian
spread and the one the headline table records.

### 9.3 Saudi Arabia — the Ramadan +120

Measured as the daily isha-minus-maghrib gap, median over each family's Saudi cities, on the days the
family's own table carries.

| family | Saudi tables | ordinary gap | Ramadan gap | days at the step |
| --- | --- | --- | --- | --- |
| masjidi | 25 | 90.0 | **120.0** | 31 |
| tawkit | 204 | 90.0 | 90.0 | 0 |
| athanpro | 10 | 90.0 (8 of 10 cities; two at 74 and 82) | September only, no Ramadan in the span | 0 |
| Diyanet | 10 | 68.5 | 65.0 | 0 |

**masjidi reproduces it exactly.** All 25 of its Saudi tables print isha at maghrib + 90 all year
and at maghrib + 120 for 31 consecutive days whose scaffold dates fall 2028-02-18 to 2028-03-19 —
the Ramadan window of the table's own design. The scaffold is an index, not a year claim, so the
window is stated as the table prints it.

**tawkit does not.** 203 of its 204 Saudi cities hold a flat +90 across the whole year, with no step
at Ramadan 2027 (the 204th reads 810 and is a defective page). **Diyanet does not**: its Saudi isha is an angle (16.8), so the gap drifts (68.5
ordinary, 65.0 in Ramadan 2026). The +120 is a mosque-tenant platform's inheritance from the Umm
al-Qura convention, and it is the one place in this matrix where a tenant platform is the stricter
witness.

## 10. What this matrix does not say

- It does not say any family is right. It measures convention, not correctness, and the owner rules
  on which convention a country's record carries.
- Three families publish a single cycle (athanpro: one September), so their angle fits are poorer
  than a year-long fit: an angle and a margin are nearly degenerate over thirty days, which is why
  the reported angle is the zero-margin effective angle and the reported offset is the crosspoint
  measurement, never the fitted pair alone.
- A solved point can absorb a defective clock. Diyanet's Birobidzhan page prints two hours from
  Vladivostok's own noon; the solve moves the city instead of flagging the page, so a Diyanet point
  beyond 300 km of the nearest gazetteer city (4 per cent of the sample) should be read as a solved
  position, not as a location.
- The margin layer is measured, not adjudicated. A 7-minute temkin is a stated convention and this
  wave records it as one.
