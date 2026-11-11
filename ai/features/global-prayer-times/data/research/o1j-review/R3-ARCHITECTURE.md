# R3 architecture: worldwide prayer times for Athan.uk

Written 2026-11-10 from the evidence alone. Inputs: `o1h-global/` (CONSTRAINTS, SHARED-BRIEF, SIM-REPORT, TOP30-REPORT, SEASONAL-REPORT, GAPFILL-REPORT, INDONESIA-REPORT, verify slices A-D, specialforms), `o1i-package/` (PACKAGE-REPORT, HOMEGROUND-REPORT, INDONESIA-PKG-REPORT, package-methods.json), `o1g-decade/` (DECADE-REPORT), and `ai/features/global-prayer-times/data/census/` (policy-layer.v2.4.json, world-table-v2.md, platform-VERDICT.md). Every number below is quoted from those files.

## 0. The three facts that decide the design

1. **A fitted recipe is generation-stable.** The recipe recovered from London's 2027 table alone reproduces the published 2028–2038 tables on 24,108/24,108 cells within one minute (98.24% exact, worst error 1, MAE 0.0176 min), with no upward drift (slope 0.000195 min/year) — o1g DECADE-REPORT. So times should be **computed on the phone from recipes, not shipped as baked minutes**. One fitted recipe serves a decade offline.
2. **One pair wins the world below the high latitudes, and one family wins above them.** 18/18 Shafi is the best single global pair at 3.38 minutes population-weighted (fajr 3.30, isha 3.56; 4.71 excluding Pakistan and India, 5.22 on authority-graded targets only) — SIM-REPORT §4/§9. Above ~50°, no naked angle method survives the summer: half-night bodies land 107–125 minutes out at London fajr in July, and Moonsighting Committee is the only body that tracks the London published minutes (2.95 fajr / 4.37 isha across 4,383 days, against a 23.3-minute runner-up and a 47.3-minute median) — SIM-REPORT §7, SEASONAL-REPORT §c. The high latitudes need a different family than the tropics.
3. **The package is an engine, not a method table.** adhan 4.4.6 ships 13 presets with four silent class defaults (Shafi, MiddleOfTheNight, Unresolved, General), a load-bearing method-name gate for Moonsighting, no Ramadan branch, no timezone/DST layer, and no preset for Indonesia, Nigeria, Malaysia, Kazakhstan or Morocco — PACKAGE-REPORT. Every body beyond the thirteen, and every margin, rounding, clock and high-latitude rule, must live in the app's own data. That app-owned data already exists: it is the census policy layer (69 objects, grades A 16 / provisional 34 / community 4 / candidate 14 / F 1, every field provenance-tagged).

## 1. The architecture, end to end

### 1.1 What runs on the phone

One solar engine, five wrappers, one resolver.

**Engine.** adhan-js 4.4.6, pinned exact, as the solar core only. It computes UTC instants at second resolution (`Rounding.None`). It is never asked to make policy: the package's class defaults are treated as uninitialized memory, not configuration.

**Wrapper rules (each one exists because a study found the failure):**

1. **Explicit parameters, always.** Set `madhab`, `highLatitudeRule`, `rounding` and `polarCircleResolution` from the object on every call. The study's single largest failure mode is the library's MiddleOfTheNight default silently substituting in summer (Frankfurt 2026-06-21: MWL prints 01:27/01:27 against a target of 03:05/22:59 — GAPFILL §6). Objects with `highLatitude.kind: none` get the clamp disabled outright, which is what HOMEGROUND did for low-latitude tables.
2. **Name gate.** MoonsightingCommittee is constructed by name. Copying its numbers onto another name silently disables the season curve (PACKAGE-REPORT, "Moonsighting branch").
3. **Interval isha composes on the printed maghrib** — the census invariant (isha − maghrib = 90/120 exactly, SIM §10) — and after rounding where the object records that ordering (Qatar, slice-A decisions). The package's interval branch takes raw sunset and no clamp; that is the bodies' own behaviour and we keep it.
4. **Rounding is ours, in the recorded order.** Margin-then-round, per field, exactly as the object declares. Singapore's `Rounding.Up` is body-faithful including its quirk of adding a whole minute at exactly :00 (PACKAGE-REPORT). No harness-side rounding ever leaks in (CONSTRAINTS rule 4).
5. **Clock and calendar are app-side.** Instants format against the object's zone, explicit, never the host clock; dates are built from literal strings (a UTC-epoch parse reads as the previous day west of UTC — PACKAGE-REPORT). Three objects render at fixed printed offsets (Morocco UTC+1, Jerusalem UTC+3, Niger), because their tables ignore DST: scored in the civil zone, Morocco breaks by ~60 minutes on 35 days (TOP30 §Countries with no close method). Ramadan windows come from shipped announced-window data (1447: 2026-02-18..03-19; 1448: 2027-02-08..03-08; 1449: 2028-01-28..02-25 — HOMEGROUND assumptions), never from arithmetic Hijri, which runs about five days late unshifted (SIM §2).

**Resolver.** Location → country (offline bbox table) → object id → recipe → compute at the **user's coordinates**. A recipe is location-independent configuration (angles, intervals, margins, rounding, clock, high-latitude kind, asr school); the solar core runs at the user's point. This is why recipe-tier accuracy claims hold anywhere in the country: nothing is baked to an anchor. Zone-table federations (Malaysia WLY01, JAMIAT-KZN's 494 towns, Fazilet's 110 cities) ship their recorded anchor point for v1 with the blend caveat carried (WLY01 and SGR01 differ on 199/365 days, "multipoint blend jitter" — GAPFILL §6).

### 1.2 What data ships

Recipes, not minutes. Concretely:

| Block | Content | Size |
|---|---|---|
| London bin | `stores/timetable.ts`, unchanged, 2026–2076 | 7.5 KB (existing) |
| Recipe table | 69 objects stripped of provenance prose: angles/interval, margins, per-field rounding, clock mode, high-lat kind, asr, tz, anchor point | ~10 KB |
| Country index | ISO → object id or assignment + band, ~200 rows | ~8 KB |
| Ramadan windows | KACST-announced windows, shipped 5+ years ahead | ~0.5 KB |
| Special forms | SI-VAKTIJA cosine formulas, UA-DUMU ramp tables, Indonesia's six Papuan regencies, zone anchors | ~2 KB |

Nothing else. The Moonsighting curve and the 18/18 pair are in-engine. Total new data ≈ 20 KB; hard ceiling 100 KB (§7).

### 1.3 How a country resolves to times

The ladder, evaluated top-down:

- **Tier 0 — London.** The baked LUPT bin (2026–2076) stays the source of truth, per the product invariant. It is the printed table; no computed value replaces it. The conflict rule already on record holds: LUPT inside London, Wifaqul elsewhere (world-table UK rows).
- **Tier 1 — authority recipe.** The country's graded object (A or provisional) with a complete computable recipe is computed on device. 48 objects qualify (A 16 + provisional 34, minus the two exclusions in §4: BE-EMB's undecidable window and RU-CDUM's uncarried coordinates; Russia serves from its grade-A object RU-DUMRT with the publisher named on the country screen — Russia has three publishers and TOP30's sensitivity section shows the verdict is a publisher choice, CDUM-at-Moscow reading MWL at 2.00).
- **Tier 2 — measured assignment.** Where no fitted object exists but the census measured the practice, ship the practice: Indonesia from the o1h annex recipe (20/18 + 2-minute ihtiyat each prayer, nearest, six Papuan highland regencies at 21/19 + 2 — reproduces Kemenag's printed minutes on 98.9–100% of days at all six study cities); Pakistan and India as the community de facto 18/18 (scores 0.00 against the de facto target by construction); Nigeria as MWL 18/17 (the national SPA reads MWL, 0.00 by construction).
- **Tier 3 — latitude-banded fallback.** FALLBACK rows (41), candidate rows without recipes, and unrecorded countries:
  - **Below 45°:** 18/18 Shafi — the study's winning pair (3.38 weighted). Asr Shafi by package default, which matches 39 of 49 targets.
  - **45°–55°:** Moonsighting Committee — the only family that tracks an observation table at these latitudes (London 1–2 minutes in July where the half-night bodies sit 107–125 out; SEASONAL §c).
  - **Above 55°:** Moonsighting with its own 1/7 rule (the body curve is bounded there), computed, badged "computed fallback — no local authority publishes" (§1.5). Polar days where even the fallback body's rule is degenerate still compute; the badge carries the claim.

Every tier renders its tier on the country screen: authority recipe (publisher named, grade), community practice (named, never claimed as the user's mosque), or fallback (one-line reason, per the world table's own reading rules).

### 1.4 What happens where no data exists

The fallback band serves a claim about a country we have not measured, so it is honest by construction: it serves a named, published method and says so. The three largest populations in the band are Algeria, Afghanistan and Syria (roughly 100 million combined on the rebased weights), all below 45°, all served 18/18 with the fallback badge until a surface is fitted. The band is never presented as local authority, and every FALLBACK row keeps its one-line reason from the world table.

### 1.5 How updates and version bumps work without moving a user's alarm silently

- **Generations.** The shipped data carries a `policyGen` version and a per-country recipe hash. Recipes are decade-stable (fact 1), so generations are rare; they ride ordinary app releases (offline from install — no OTA data path).
- **The build produces the diff.** A release script diffs old vs new recipes per country at sample dates and emits a change list into the bundle.
- **On update.** Alarms are keyed to prayer identity + armed instant. After a generation change the app recomputes, re-arms, and — if any prayer at the user's location moved ≥ 1 minute — shows a one-time notice listing the moved prayers. Scheduled instants must always equal displayed instants; an alarm is never left armed at a time the app no longer displays. The user's athan sound, reminder offsets and enabled prayers carry over untouched: times are data, not user state.
- **The between-year risk is named, not hidden.** 34 of the graded objects are provisional — one published cycle. The record's own risk list (Diyanet-European isha 17→16 in January 2023; IFiS Sweden's 2023 amendment; Fazilet London's asr madhab switch between print and live engine) is the reason the diff notice exists.

## 2. Accuracy claimed, per tier, with the evidence line

| Tier | Claim | Evidence |
|---|---|---|
| 0 London | Identical to the LUPT printed minutes, 2026–2076 | The bin is the publisher's own table (world-table GB row; o1f fit 100% within-1 as corroboration) |
| 1 grade A (16 objects) | ±1 minute of the authority's printed minutes at the user's coordinates, held over years | o1g decade test: 24,108/24,108 within 1 min over eleven years, worst 1, MAE 0.0176, no drift; HOMEGROUND reproduces band pooled ≤ 0.5 (Diyanet 0.00, Kuwait 0.17, Tehran 0.11, EG 0.17); slice-A home-ground cells 0.00–1.00 min |
| 1 provisional (34 objects) | ±1 minute within the observed cycle; a between-year authority change is possible and named | Indonesia recipe reproduces printed minutes 98.9–100% of days (o1h annex); Wifaqul 365/365 within 1 (world table); the multi-year ruling caps single-cycle evidence deliberately |
| 2 measured assignments | The census's own per-country figures, printed per row | Indonesia 98.9–100%; PK/IN 0.00 by construction; NG 0.00 by construction |
| 3 fallback < 45° | 18/18 Shafi: 3.38 min population-weighted mean vs national authorities (fajr 3.30, isha 3.56) | SIM §4/§9; wins every aggregate column |
| 3 fallback 45–55° | Moonsighting vs London's real published minutes: 2.95 fajr / 4.37 isha mean across 4,383 days | SIM §7; second-best body 23.3 |
| 3 fallback > 55° | No accuracy claim. Computed fallback, badged | SEASONAL §c: every computed family misses the measured Nordic surfaces badly (EE-EIC MWL 42–70 min across readings of one sentence; Iceland's authority prints nothing all summer) |

Two claims this architecture deliberately does **not** make: per-minute equality with any national *app* or third-party mirror (the record measures authorities and community surfaces, and `api.myquran.com` reads one minute late — INDONESIA §9); and any sub-minute claim anywhere (the widest honest resolution is the publisher's own rounding granularity — DECADE §1).

## 3. What I would not ship

1. **EU-DIYANET-UNIFIED — grade F.** The only F: no series exists behind it, and its high-latitude rule needed an interpretation whose window reading moves 16-degree isha cells by 25.28 minutes (GAPFILL §5). An F cannot ship under any architecture that cites provenance.
2. **AT-IZW and FR-GMS seasonal sweeps.** Documented only as verbal implied ranges with no formula or per-day values; C18's own verdict is "do not build a frozen object". Building them would invent daily values. They take the fallback band until a per-day capture lands.
3. **EE-EIC's extreme-season policy as a point value.** The scored reading spans 42.09–70.36 minutes for MWL across the readings of one sentence (GAPFILL §5). The record itself says treat the cell as a range. Not shippable as a recipe; fallback band instead.
4. **The 14 candidate objects with null recipes** (CI-COSIM, DJ-COMMUNITY, PH-NCMF, AU-UMA, NZ-FIANZ, TJ-SHURO window-class, TT-MASJIDBOX, and the row-less Algeria/Afghanistan/Syria/Côte d'Ivoire/Tajikistan/France set). There is nothing to compute from; serving them would be invention. All sit in the fallback band.
5. **BE-EMB.** Provisional but undecidable per day: `frozenLatitude45` with a declared summer window and `windowDates: null` (slice-B skip). A rule that cannot be evaluated cannot be shipped.
6. **Moonsighting Committee below 45°.** The seasonal audit is explicit: it hides a blowup — inside 2 minutes of Tunisia's annual mean while running 5.55 minutes late every July morning, median seasonal swing 7.5 minutes against 0.5–2.7 for the fixed-angle bodies, summer isha 30–54 minutes early across the Balkans, Italy, Spain and Turkey (SEASONAL verdict). It is a high-latitude family, not a world default; the standing world-table rule that unrecorded countries ship Moonsighting by default is the one standing rule this architecture amends.
7. **Tehran, Russia-SAM, Fazilet-B, Qatar and Umm al-Qura as general bodies.** Tehran's 14-degree isha is a software default Iran itself never publishes (worst isha in the grid, 18.46 mean); Russia-SAM 16/15 is known only from secondary tables (12.54 weighted, no constituency); Fazilet-B is 9.88 weighted with no country inside 2 minutes; Qatar's and Umm al-Qura's fixed 90-minute isha intervals fail outside the tropics (Umm al-Qura isha 13.51 weighted, 20.21 mean at Indonesia with a 52-minute worst day, 10.74 against London's published minutes). They ship only as an object's own recipe (Iran) or nowhere. Likewise ISNA 15/15 (14.98 weighted, the study's worst) is never shipped anywhere.
8. **Community recipes as authority.** The four community-grade objects ship only badged as community practice, never as the authority's table — the world table's own rule. Indonesia rides the ministry-measured annex instead of its old community carriage, which the annex proved reads one minute late (the third-party feed offset).

## 4. The three risks the design still carries

1. **Provisional drift.** Half the graded book (34 of 69) rests on one published cycle, and the record names three real between-year changes (Diyanet-EU isha, IFiS, Fazilet London asr). A silent authority tweak moves times by minutes until the next generation is fitted. The diff notice contains it; it cannot prevent it. This is the price of the multi-year ruling being honest: A-grade certainty cannot be bought in one year.
2. **The fallback band is an unmeasured claim.** For the 41 FALLBACK rows, the candidates and the unrecorded countries, the served method is justified by its fit to *other* countries (3.38 weighted), never to the country it serves. A country on a 20-degree community practice or a fixed printed clock (the Morocco class: ~60 minutes on 35 days if the clock is read wrong) will diverge, and we will not know until a surface is found. The badge is honest; honesty is not accuracy.
3. **Package and curve inheritance.** The fallback band's behaviour above 45° is adhan's Moonsighting implementation: a name-gated branch, latitude-scaled coefficients, a 55-degree threshold, no Ramadan or polar policy — all version-coupled to 4.4.6, verified against upstream fixtures only to 2 minutes (PACKAGE-REPORT). A package upgrade can move every 45°+ user silently. Mitigation: pin exact, and gate any upgrade on the fixture replay plus a full re-run of the seasonal audit — but the exposure is real, and above 55° there is no honest computed answer at all; the app prints a number where Iceland's own authority declines to.

## 5. Total shipped-data budget

| Block | Size |
|---|---|
| London bin (existing, unchanged) | 7.5 KB |
| Recipe table (69 objects, stripped) | ~10 KB |
| Country index (~200 rows) | ~8 KB |
| Ramadan windows (5+ years announced) | ~0.5 KB |
| Special forms (SI formulas, UA ramps, 6 Papuan regencies, zone anchors) | ~2 KB |
| **Total shipped** | **~28 KB; hard ceiling 100 KB** |

For scale: the London bin alone is 7.5 KB for one city for fifty years; the recipe table serves roughly fifty authorities worldwide in about one and a half times that, and — because recipes are generation-stable — it does not grow with years. Data growth is per-country, not per-year.

## 6. The decision this design puts to the owner

**The sub-45° default.** The evidence picks 18/18 Shafi outright (3.38 weighted; wins the fajr half at 3.30 and the isha half at 3.56; at or near the top of all four aggregate columns, which no other pair manages), but the pair has no live worldwide publisher behind it: ISNA itself moved to 15/15 in 2017, JAKIM publishes it as a national table, and Karachi — the live carrier — is a South Asian body whose home practice is Hanafi-asr. The alternative is MWL 18/17 at 4.22 (0.84 minutes worse, isha 5.35 vs 3.56) with a genuinely worldwide body behind it. Shipping the measured winner means printing "Karachi method (Shafi asr)" or the bare pair as the world default; shipping the body means conceding 0.84 minutes everywhere below 45°. Both are honest. This also formally amends the world table's blanket Moonsighting-fallback rule, which the seasonal audit shows is the wrong low-latitude family. The choice of pair-plus-name versus body, and the latitude bands (18/18 < 45°, Moonsighting 45°+), is the owner's call; everything else in this document follows from the evidence without a decision.
