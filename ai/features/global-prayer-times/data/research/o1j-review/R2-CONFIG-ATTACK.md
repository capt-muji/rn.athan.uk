# R2 configuration attack: preset plus config, or fitted pair through Other

Review seat R2 of the worldwide prayer-times panel. The claim under attack is one sentence:
C and D beat preset-only on accuracy at almost no complexity cost, so the app should adopt a
hybrid of a baked London bin, preset plus config where a preset is verified close, a fitted
pair through the package's `Other` template where none is, and one global default elsewhere.

The two candidates as written:

- **C.** A per-country preset plus per-country configuration of the package's exposed
  parameters: madhab, high-latitude rule, rounding. Named presets only, each tuned with
  package-native knobs.
- **D.** Where no named preset is close, serve the country's fitted parameter pair (angles,
  margins, rounding, high-lat rule from the policy layer) through `CalculationMethod.Other`.
  Offline, package engine, custom parameters.

This seat judges the evidence and the semantics of configuration. Operations belong to R4's seat
and are cited where they bear on that judgement. Nothing outside this directory was written.

Read for this review: `o1h-global/CONSTRAINTS.md`, `SHARED-BRIEF.md`, `sim/`, `top30/`,
`seasonal/`, `gapfill/`, `indonesia/`, `verify/slice-a`, `verify/slice-b`,
`verify/specialforms`, `o1i-package/PACKAGE-REPORT.md`, `o1i-package/homeground`,
`o1i-package/indonesia-pkg`, `o1g-decade/fit/FIT-REPORT.md`, the adhan 4.4.6 build at
`census/adhan-build/node_modules/adhan`, `policy-layer.v2.4.json`, `world-table-v2.md`, and the
app source the panel cites.

## 0. Three facts that decide the shape of the argument

**Fact 1. The owner ruling forbids exactly what C proposes.** `CONSTRAINTS.md`, owner ruling
2026-11-10, paragraph 1: "No per-country configuration of a body, even where the body permits
it: the documented default is the method." Paragraph 2 keeps only the constants a body defines
as part of itself. C's whole construction is per-country configuration of a body. The ruling
was written to keep the method side of the study fair, and it names the product consequence:
a configured body is not the body. R4 reaches the same conclusion operationally. This seat
reaches it semantically. A user who selects "Muslim World League" and receives 18/15 with a
one-seventh isha is not receiving the Muslim World League.

**Fact 2. The package's two headline knobs are narrower than their names.**
`lib/types/Rounding.d.ts` carries three values, `nearest`, `up`, `none`. There is no floor.
`DateUtils.roundedMinute` also makes `Up` advance a value that already sits exactly on the
minute by a whole further minute, because `60 - 0` is 60. `lib/types/HighLatitudeRule.d.ts`
carries three values and one derived helper, and `CalculationParameters.nightPortions()`
returns one pair from one field. There is no per-prayer portion. `CalculationParameters.js`
shows both: a single `rounding` property and a single `highLatitudeRule` property on the
instance.

**Fact 3. The policy layer's own emulation table prices the gap.** `adhanEmulation.table` has
31 rows. Seventeen read `absent`, one reads `partial`, and the thirteen remaining rows are one
field each. One of those thirteen (`margins`, `params.adjustments`) is the only per-country numeric
channel the package offers. Rounding down is `absent`, with the note that it must be emulated
by computing at `Rounding.None` and truncating seconds in the render zone. Mixed rounding
inside one object is `absent`. `nightPortionSplit` is `partial`, reproduced only by assigning
a literal to `params.nightPortions`. That assignment replaces a method on the instance and no
documented parameter carries the value.

Counted against the 69 objects: 16 fall outside a frozen parameter model altogether, 21 carry a
rounding that is not nearest for at least one field (76 fields in total), and 17 of those need a
floor. Twenty-one objects carry a gap entry that raises a rounding question, nearly all of them
saying the direction is unmeasured. Nineteen carry a gap entry that says a margin is unmeasured.

## 1. Steelman C, honestly

C is the cheap direction, and parts of it are right.

**Its verification is real, and it is the only verification in the corpus that can fail.** O1i
home-ground ran each preset verbatim, six rows, three years, against its own government. Turkey
is 0.00 pooled over 6,576 prayer-days with 100 percent exact and worst day zero. Iran 0.11,
Kuwait 0.17, Pakistan and India 0.17, Egypt 0.17, the US 0.17, Qatar 0.74, Saudi 0.91, Singapore
0.98, the UAE 1.08. That is eleven sources reproduced inside the band the app can defend, on
the six rows the user sees, with the package's own adjustments intact. Nothing else in the study
has an independent oracle of that kind.

**The preset is a name a user can audit.** The app's entire claim, per `RECOMMENDATION.md`, is
that it shows what a named authority published. A preset carries a body's name in the source
list. A fitted pair carries a census object id. For attribution, C is the honest shape.

**Its config half is where the accuracy actually lives, and the study says so twice.** The sim
states that dhuhr and maghrib "are almost entirely margin (+1 to +10 minutes) plus a rounding
direction", and that "the margin is configuration, and configuration is what a deployment adds
afterwards". The top-30 grid says the top four distinct pairs "sit inside 0.84 minutes of each
other, which is less than the rounding granularity of most national tables". So preset choice is
a second-order term and margins are the first-order term. C is honest about which term it is
buying.

**Its cost really is small.** Four fields per country, no new engine, and the preset arithmetic
is the package's own. R4 prices it at about 12 KB of config on top of the same 63 KB of library.
If C only ever added margins to an unmodified preset, this review would support it without
reservation.

That is the steelman. The rest of this document is why the sentence as written does not survive.

## 2. Attack 1: provenance. D claims accuracy where the evidence holds reproduction

**The claim D needs.** "Serving the fitted pair reaches the country's authority." The evidence
D can point to is the sim, where a target built from the object's own angles, margins, rounding
and night rule reproduces that object. That is a tautology with a measurable size: the fit's
in-sample residual. It is not the error of the shipped engine against a tomorrow the fit never
saw.

**The one out-of-sample test in the corpus falsifies the model class.** `o1g-decade/fit` fitted
the London Unified Prayer Timetable blind and then predicted years the fit never saw. Its result
is blunt: no angle and no angle-plus-clamp reproduces fajr or isha. At the best angle the fajr
residual standard deviation is 15.84 minutes and the isha residual 29.09. The published fajr is
an exact whole number of minutes before the published sunrise for 78 consecutive days while the
18-degree separation moves 10.2 minutes over the same span. The report's own sentence: "A value
that stays fixed to the minute while its would-be driver moves by several minutes is a table,
not a formula."

London is the deepest-evidenced object in the corpus, grade A on 50 years. The kind of authority
that prints from a table is on record four more times: UA-DUMU is an interval table (fajr sunrise
minus 100 every day, isha maghrib plus a dated 90-to-100 ramp), SI-VAKTIJA is a cosine sweep with
documented formulas, and AT-IZW and FR-GMS are seasonal sweeps with no frozen pair behind them.
D's answer for these is "the baked bin", which is honest for London and undefined for the rest. A
design whose model class is falsified by its single best-documented case has not earned the word
"accuracy".

**The gauges are provisional by the owner's own ruling, and D would ship them as authority.**
The grading scale is explicit: A means two to three distinct years with one recipe. Provisional
means one cycle or one year, "shippable as a derived recipe only with the year-2 debt recorded",
and "nothing here may claim grade A on a single year". Thirty-four of the sixty-nine objects are
provisional. Under D, each of them is the times a user sees, labelled with a country.

The thin tail is worse than the count suggests. These are provisional objects with the day count
that backs them:

| Object | Grade | Measured days | Notable |
| --- | --- | --- | --- |
| BR-IIB | provisional | 7 | single-city provenance, flagged |
| MV-MUIS | provisional | 24 | "24 days measured, not a full year", rounding null every row |
| GR-ATHENS | provisional | 29 | "29 days, not a year", rounding null |
| KW-AJIRI | provisional | 30 | 30 days against a full-year claim |
| BA-RIJASET | provisional | 30 | rounding null for every row, one-rung elevation ladder |
| SD-MINISTRY | provisional | 30 | Ramadan rows only |
| IR-NATIONAL | provisional | 30 | no isha row exists at the authority |
| JERUSALEM-AWQAF | provisional | 47 | "47 days of wayback capture, not a year" |
| CL-CIS | provisional | 61 | ten months missing |
| GR-KOMOTINI, ME-IZMR, TN-INM, YE-AWQAF-SANAA | provisional | unstated | "Day count unstated", and ME-IZMR publishes a band |
| FJ-FML | community | 61 | isha margin is a band, so every isha figure is "too flattering" |

**The grade field itself does not carry the proof.** Two objects graded A do not meet the A
definition in their own structured fields. JO-AWQAF reads `grade: A` with `measuredDays: 10`,
`fullYear: false`, `fitYears: 0`, `multiYearProven: false`, and a `gradeBasis` about a Wayback
sweep across eight years. QA-MOI reads `grade: A` with `measuredDays: 33` and no `recipeStatus`.
A builder that gates on `grade` ships Jordan on ten official days. A builder that gates on
`fitYears` refuses an object the prose calls A. The artifact cannot answer the question a
shipping decision asks.

MA-HABOUS is `A` only conditionally: "CONDITIONAL A: the grade holds only if the half-minute
margin shift between the pre-rebuild sheets and the current table is ruled a surface difference
rather than a between-year tweak - unresolved on the record." D would ship an unresolved owner
question as a national recipe.

**The layer has no object for the largest Muslim population on earth.** The sim says it plainly:
"`policy-layer.v2.4.json` has no Indonesian object at all." Indonesia is carried in
`countries.json` at 20/18 with zero margins. The Indonesia annex then measures the truth: Kemenag
publishes 20 and 18 each moved two minutes later, on 510 of 516 kabupaten, and "The old census
figure, 'Isya 18 regional', reproduces nowhere" because the earlier fit ran against a
third-party carriage that "reads one minute later than the ministry's own API on every field and
date tested, so the fit measured a shifted recipe rather than Kemenag's". A fitted-pair pipeline
that was already once fitted to a proxy is exactly what D institutionalises. Under D as written,
Indonesia gets a default, and the largest population in the design is served by the fourth
element of the hybrid.

The general finding behind that anecdote is in `remainingGaps`: "HK-MASJIDAL's grade A is
WITHDRAWN at v2.3: the Masjidal athan span is generated on demand, so three years served by that
endpoint are one config evaluated at three date sets". JAMIAT-KZN carries the same shape: its table
is "byte-identical across 2022/2024/2026/2028". XK-BIK is cell-identical across four editions but
for 12 to 42 cells that differ "by exactly 60 min on DST date-edges only". The frozen-generation
precedent cannot lift either. A single configuration evaluated at several date sets is not
multi-year evidence, and three objects in the corpus are exactly that.

**Verdict on provenance.** D can claim reproduction of a fit on its own fitted surface. It
cannot claim accuracy, because the only blind test in the corpus says a frozen pair does not
travel, and because 34 of 69 recipes are single-cycle by the owner's ruling. The claim needs
rewriting before the design can ship: "computed from a recipe fitted to {authority}, {year}, {day
count}" is defensible. "The country's times" is not.

## 3. Attack 2: configuration sprawl. C's school and rule have no evidence trail

C's three knobs are madhab, high-latitude rule and rounding. Each one is a value the record often
does not carry, so C answers it with a default, and a default that is not evidence is an invented
number wearing a setting's clothes.

**Rounding.** 21 objects carry a non-nearest field, 17 of them a floor the package lacks. Nine
carry mixed directions inside one object, which `adhanEmulation` marks `absent` and tells the
builder to compute once at `Rounding.None` and round each row by its own direction. The record is
worse than the count: GB-WIFAQUL-ULAMA's gap reads "Rounding direction null for every row".
LK-ACJU's reads "Rounding direction is still not on the record for any row". BA-RIJASET's reads
"Rounding direction is null for every row". Morocco's rounding is "a 93 pc share, not a rule". A
per-country rounding knob therefore means, for a large share of countries, a direction the census
could not measure, entered once and never revisited. That is the definition of a number no
evidence supports, and it moves every displayed minute by up to one.

**High-latitude rule.** `HighLatitudeRule` holds one value for both prayers. Three objects need a
different portion per prayer: GB-WIFAQUL-ULAMA (fajr one half, isha one seventh, and the object's note
says "The split night portions are the whole recipe: stock MiddleOfTheNight gives fajr 1/2 and
isha 1/2 and is wrong for isha here"), CL-CIS (0.3063 and 0.2779, and the object states these are
"NOT adhan's angle/60"), and RU-DUMRF-MOSCOW (0.2955 fajr, no portion for isha at all). Three more
need a night policy the enum has no value for: BE-EMB, TR-DIYANET-DOMESTIC and EU-DIYANET-UNIFIED,
which substitute the 45th parallel inside a declared window and, for Turkey, add a
`maghribCapMinutes` of 80 with a 62-degree slide-down. Three further objects carry seasonal sweeps
instead of a night rule at all. C's knob cannot express any of the nine, and the tenth object,
IS-FELAG, needs a suppression rule rather than a night rule.
The user-visible instance is Britain outside London, where the record's own July isha is 144 to
162 minutes from every half-night body. At that distance the question is whether the app is usable
after 22:00, and it is settled by the night rule alone.

The seasonal audit says the same thing at the level of verdicts: "The high-latitude verdict is
therefore about which rule a method carries, not about which method is better in the abstract."
A design that treats the rule as a per-country enum treats the one thing that decides the summer
as a dropdown.

**Madhab.** Nine objects carry an alternate school in the record. Forty-two carry Shafi only,
five Hanafi only, thirteen carry no school at all. A per-country school therefore means C invents
a school for thirteen objects and restates the record for forty-seven, while the only objects
where the choice is real are nine. The sim measures the stakes: with a global Shafi, the school
matches 39 of 49 targets, while Karachi's Hanafi matches 7. At London the two shadows differ by 27
to 73 minutes over the year, which is the decade fit's own measured range. A wrong school is the
loudest error the app can make, and C would set it per country from a field the record leaves
empty in one object in five.

**The circularity that undermines C's admission test.** C admits a preset where it is "verified
close". The top-30 grid warns, in its own words, that "12 of the 18 countries inside 2 minutes
reach it with a method whose angle pair is the target's own pair: the census fitted the country
to that body, so the score measures the harness, not the method". Egypt against the Egyptian
preset is 0.00 because the census fitted Egypt at 19.5/17.5. Turkey against the Turkish preset is
0.00 because the preset's temkin is Diyanet's temkin. Those zeros are identities, not
predictions, and C's admission rule would read them as evidence. The same study disqualifies them
if read carefully. A configuration scheme whose gate is satisfied by construction will admit
every country whose authority happens to equal a library body, and no other.

**Morocco is the worked example of how fragile a "close" verdict is.** The same study reports
Morocco at 7.49 minutes in the top-30 grid, which reads the IANA clock, and at 1.98 in the MENA
slice, which reads the authority's printed fixed clock. The entire 5.5-minute difference is a clock
convention. Under C, Morocco's admission depends on which
harness wrote the table. Under D, Morocco is admitted on a recipe whose roundings are a 93 percent
share rather than a rule.

## 4. Attack 3: the mixed-school countries. The premise is mostly wrong

The dispatch names Sri Lanka, Fiji, South Africa, Malaysia and Kosovo as dual-printed asr cases.
The record does not support that list, and the correction matters, because C's school knob would
otherwise be sized against five countries that need it.

| Object | Record says | Consequence for C |
| --- | --- | --- |
| LK-ACJU (Sri Lanka) | `primary: shafi`, `alternate: null`, provenance "single-Asr on the sheets: no dual pair printed, superseding the dual-Asr reading of #6911 I1" | Not dual. The 2026 re-read withdrew the dual reading. A school knob here would add a choice the authority does not print. |
| XK-BIK (Kosovo) | `primary: shafi`, `alternate: null`, provenance "shafi lands 2.8 min MAE; hanafi lands 47 min out" | Not dual. The fit is decisive in one direction by 44 minutes. |
| MY-JAKIM (Malaysia) | `primary: shafi`, `alternate: null` | Not dual. Malaysia's "both" is not on this object. |
| FJ-FML (Fiji) | `primary: shafi`, `alternate: hanafi`, "both schools printed as separate columns" | Genuinely dual. It is also grade `community` on 61 days with an isha margin that is a band. |
| JAMIAT-KZN (South Africa and 22 more) | `primary: shafi`, `alternate: hanafi`, "both Asr schools printed bare" | Genuinely dual, and the object spans 23 countries from one Durban anchor. |

Of the five named, two print both. Across the whole layer, four objects print a second column:
FJ-FML, JAMIAT-KZN, GB-LONDON-INTERVAL-TABLE ("both shadows printed and fitted") and
NO-MAWAQEET ("the archived tables print asr_shafii and asr_hanafi columns"). Two of the four are
country-scale surfaces. The design question is not "which school does the country take" but
"which printed column does the app show when the authority prints both, and does the user get to
choose". `adhanEmulation` answers the mechanical half: "one value per instance; a dual-Asr source
needs a second instance". The record answers the other half nowhere. C as specified answers it by
country, which silently removes one of the printed rows wherever a second one exists, and invents
a school for the thirteen objects where the record is silent.

The practice layer agrees that this is a user question rather than a country question. The practice map
in the policy-layer note reads "US community default 15/15 (77pc), 18-degree family 13pc
(Chicago/Hanafi pattern), Hanafi asr 33pc" and concludes "asr school is the best predictor of the
fajr angle". A third of one country's mosques choose Hanafi asr while two thirds do not. One
value per country cannot serve that, and the app's stated posture, "never claim the user's
mosque", means it should not try.

R1 reaches the opposite recommendation on this one point, assigning Hanafi asr per country for
Pakistan and India. The two positions reconcile on the evidence rather than on preference. Pakistan
and India are not policy objects at all: both are FALLBACK rows described as "community de facto
(the Karachi method)", and their Hanafi asr is a practice reading rather than a printed alternate.
The 42 objects that name one school should take that school, and the 13 that name none should take
the user's setting. The four that print a second column should offer it. A country-wide switch
carries the evidence for exactly the rows where practice is the whole record.

## 5. Attack 4: maintenance across package bumps. Nobody notices

**The package has no tests and ships no fixtures.** `PACKAGE-REPORT.md`: "The package has no
tests inside it", and "no fixture ships inside the package, so a caller cannot regression test
the presets without obtaining upstream test data separately". The oracle the census used,
`o1i-package/verify-methods.mjs`, replays eight upstream fixture files, 2,772 values, and exits
non-zero on drift. It lives in a census directory outside the repository, is not wired to
`yarn validate`, and is not a dependency. When `adhan` moves from 4.4.6 to 4.5, the behaviour that
matters lives in `methodAdjustments` and in `roundedMinute`, and the changelog is not an oracle for
either.

**Two behaviours are already known to be wrong for the product, and both are silent.**
`Rounding.Up` adds a full minute to a value that sits exactly on the minute. Singapore's preset
sets `Up`, and the policy layer's own note on `roundingFormulation.marginThenFloor` says
"Applying Rounding.Up as well double-counts the minute (Saudi Arabia)". O1i home-ground found the
second: "The dhuhr +1 is a package-wide constant: every preset that ships it (Muslim World
League, Egyptian, Karachi, North America) lands exactly one minute late against a recipe that
carries a zero dhuhr margin. It is a property of the package, not of the country." Under C, the
app must either accept a systematic minute on dhuhr in four families or zero the adjustment,
which means no longer serving the preset.

**The method name is load-bearing, which makes "preset plus config" a rename hazard.**
`PrayerTimes.js` compares `calculationParameters.method` against the literal string
`'MoonsightingCommittee'`. The package report: "copying the MoonsightingCommittee parameters onto
any other method name silently disables the whole mechanism", and a probe at 59.9139 N puts fajr
122 minutes from Muslim World League. C and D both mutate parameters after construction. Any
implementation that rebuilds a parameter object, serialises it to JSON, or reconstructs it under
a neutral name loses or gains a mechanism with no error. This is not a hypothetical: D is defined
as "through `Other`", and `Other` is `new CalculationParameters('Other', 0, 0)` with both angles
zero. Two designs built on mutation of a name-keyed object need a name check in tests that no
test currently performs.

**Named presets and explicit parameters age differently, and the difference is who owns the
number.** A preset is a name the package owns: when upstream changes 18 to 18.2, the app moves
with the body and the change is attributable. An explicit pair is a number the app owns: when the
package changes its rounding or its clamp, the app's number stays and silently means something
else, because the clamp it was fitted against belongs to the package while the recipe belongs to
the authority. D therefore inherits every package behaviour while losing the attribution. The
policy layer already knows this: every object carries an `emulation` list naming which package
behaviours it depends on, and 17 of 31 concepts have no package behaviour at all.

**The maintenance answer this forces.** One pinned version, one oracle, one gate: keep
`verify-methods.mjs` equivalent inside the repo, run it on every dependency change, and fail the
build on any preset drift above the fixtures' own declared variance (0 minutes for Makkah, Doha
and London, 1 for Dubai and Tehran, 2 for Ankara, Kuwait and Singapore). Without that, the honest
answer to "who notices when adhan 4.5 changes an adjustment" is: the users, by an alarm that
rings at the wrong minute.

## 6. Attack 5: the app-side trap. Moved times are invisible to the sweep

The mechanism, read from the code.

- `prayerNotificationIdentifier` is `athan_${scheduleType}_${id}_${date}`.
  `reminderNotificationIdentifier` is `reminder_${scheduleType}_${id}_${date}_${interval}`.
  Neither carries the minute (`device/notifications.ts:50-67`).
- `findStaleScheduledNotificationIds` returns OS identifiers absent from the database record
  set, comparing identifiers only (`shared/notifications.ts:214-221`).
- The upgrade path deletes every key not in `UPGRADE_KEEP_PREFIXES`, and that list holds
  `app_installed_version`, `whats_new_shown_version`, `cache_schema_version`, `preference_` and
  `prayer_max_name_width_`. Every `scheduled_notifications_*` and `scheduled_reminders_*` record
  is wiped (`stores/version.ts:144-157`, `stores/notifications.ts:1557-1570`).
- After a wipe the sweep refuses to cancel anything, by design: "an empty record set here means
  'we don't know', not 'nothing should exist', and sweeping would delete exactly what was
  recovered". The recovery is `forceNotificationReschedule`, which reopens the refresh gate so
  the next foreground pass re-arms (`stores/version.ts:195-202`).

R3's section 1.5 is the right shape of answer: alarms keyed to prayer identity plus the armed
instant, the build emitting a per-country diff, and a one-time notice when a prayer moves. This
seat's point is narrower and it is a precondition: today the identifier holds no instant, so the
sweep cannot tell an old alarm from a current one, and R3's key change is what makes its own
discipline enforceable. Ship the two in one commit.

Put together: an app update can leave an alarm armed at the old minute under the same identifier,
and no check in the app can see that the minute moved. The sweep is an identifier-set diff, so a
fajr that moves from 06:12 to 05:52 is perfectly "not stale". The only repair is a reschedule
pass, and a reschedule pass is a foreground refresh, a background task wake, or the post-upgrade
gate reopening. R4 notes there is no OTA channel, so every method change reaches users through
store review with an install, which is exactly the moment the bookkeeping is wiped.

**The discipline any per-country method change forces, named.**

1. The source identity must enter the cache key as well as the config, and it must enter the
   alarm identity. The recommendation already asks for `prayer_${sourceId}_${date}` because
   today's key has no location and "will silently serve one city's times under another city's
   name". A method change is the same defect one level up: same key, different numbers.
2. Any commit that changes what the engine computes for a given coordinate and date must bump
   `CACHE_SCHEMA_VERSION` and force a reschedule, and the commit must say so. The repo already
   has the mechanism, `cacheSchemaChanged` plus `forceNotificationReschedule`. It has no rule
   that a method change must use it.
3. The identifier must gain the computation identity, or a version stamp, so the sweep can prove
   an armed alarm matches the current computation. Without that, the sweep proves only that an
   alarm exists.
4. Verification is on the phone, on a production build, with expected times: `yarn check:device`
   with an `expected-times.json` generated from the timetable the app is using. The script fails
   when a future alarm matches none of the expected moments, and it refuses to trust a build
   behind the tree. Dev and mock builds serve the launch-relative window and prove nothing here.
5. The per-country change must be visible before it ships: a table of country, method, and the
   minute delta on every row against the previous build. A silent two-minute shift on fajr moves
   an alarm and cannot be detected afterwards.

None of that is in the hybrid as stated. The hybrid is a method-selection design, and its largest
unpriced item is that changing a method is a silent alarm change.

## 7. Attack 6: does D invent numbers? Yes, in three places

The product rule is that the app never invents a prayer time. D's own construction breaches it in
three places, and each is named on the record.

**Candidate-tier pairs used as fitted pairs.** Fourteen objects are `candidate`, and the grading
scale defines that as "surface found and dated data available, recipe not yet fitted". Six of
them nevertheless carry an angle pair in the policy layer: NO-RABITA 16/15, NO-MAWAQEET 18/15,
EE-EIC 15/15, SE-MOSQUE 18.1/16.2, FI-PORTAL 18/17, IT-UCOII 18/17. Those pairs are a portal's
stated method or a 30-day sample. No fit exists behind them. D's sentence is "serve the country's
fitted parameter pair", and for these six there is no fitted parameter pair. Serving them is
inventing the number the grade says has not been established. Eight further candidates carry null
angles, so there is nothing to serve at all: CI-COSIM, DJ-COMMUNITY, PH-NCMF, TJ-SHURO, TT-MASJIDBOX, AU-UMA, NZ-FIANZ, plus
FR-GMS on a sweep.

**Community-tier and platform-effective pairs.** FAZILET-WORLD and FAZILET-OTTOMAN are fitted
`community` objects, and the sim is explicit about what their numbers are: "The effective angles
encode a padding that does not travel and the profile is a 110-city print with no global claim
attached", and Profile B's "temkin is larger than Profile A in every row, which is exactly why it
does not travel". Serving 19.8/17.8 as a country's pair would print a number the authority never
printed, at a padding the authority uses to make its own engine agree with its own print. That is
a formula about a publisher's internals and it says nothing a prayer time can carry. The same
objection covers JAMIAT-KZN, a federation generator whose 494-town table is "byte-identical across
years" and whose Blantyre anchor offset is "unexplained", and FJ-FML, where the served set is a 2024
image set that is "CORRECT for 2026 by coincidence".

**Rules that needed an interpretation, shipped as points.** Gap-fill prices the interpretive
band: EE-EIC's fajr is 42.09 to 70.36 minutes for one sentence read three ways, and its own
instruction is "Treat that cell as a range, not a point". EU-DIYANET-UNIFIED's plateau reading
moves the 16-degree isha cell by 25.28 minutes for every 16-degree body. BE-EMB carries
`windowDates: null` while the window is load-bearing, and 25 days inside it print isha after
midnight. NO-RABITA's provenance sentence is "physically false" by the gap-fill's own finding: at
59.9 N the June solstice sun reaches about 6.7 degrees of depression, so a 16-degree twilight
cannot exist, and "the network's real summer handling is in its tables and unmeasured". D would
serve those as authority.

One more, and it is the one that would embarrass the product most: the hybrid's fourth element.
The world table's own convention for no-surface countries is **FALLBACK: Moonsighting Committee
computed**, and 41 of the table's 166 grade rows carry it. The study's recommended single global
default is **18/18 Shafi**, at 3.38 minutes weighted. Those are two different defaults in one corpus. And 18/18 has no
current publishing body: the sim says the pair "has no publishing body behind it", that ISNA's
18/18 is "a statement the body itself moved away from in 2017", and that a deployment needing a
current worldwide claim must take 18/17 at 0.84 minutes worse. Choosing 18/18 as the default for
every country without data is choosing a withdrawn position and naming it nothing. Under the
never-invent rule, a default with no body is the largest invented number in the design.

## 8. The complexity claim, priced

"Almost no complexity cost" holds for C's margin half and fails for everything else.

| What the record requires | Objects | Package facility |
| --- | --- | --- |
| Floor rounding | 17 | none |
| Mixed rounding per field | 9 | none |
| Split night portion per prayer | 3 | none (only by replacing `params.nightPortions`) |
| Frozen latitude 45 with a window and a maghrib cap | 3 | none, and BE's window dates are null |
| Seasonal sweep, documented by formula | 1 | none |
| Seasonal sweep, endpoints only, no per-day values | 2 | none, and not recoverable |
| Interval table | 2 | none |
| Twilight ratio isha | 1 | none |
| Interval after rounding | 1 | none |
| Fixed printed clock | 3 | none |
| Latitudes-switched margin sets | 1 | none |
| Per-edition constant to re-fit | 1 | none |
| Reference zone table, city deltas or elevation ladder | 23 objects, plus 11 gap-fill targets | none |
| Display corrections by storey band | 1 | none |

That is 16 of 69 objects outside a parameter model, 17 of 31 policy concepts absent from the
package and one partial, and a per-object policy engine that owns rounding, night portions, clock
shifts, zone selection, substitutes and suppression. D's sentence is "custom parameters through
the documented `Other`". The honest description is "a policy engine wrapped around adhan, with
`Other` as the entry point".
Costing it as a parameter table is the single largest error in the escalation.

The proof that the cost is real rather than theoretical is the study's own hardest three cases. The
top-30 report's "Countries with no close method" table gives three: Morocco, 7.5 minutes, cause
"the object prints a fixed UTC+1 clock while every method renders in the IANA zone"; Russia, 13.3,
cause "DUM RT substitutes sunrise-120 / sunset+90 on the 95 days the angle is unreachable"; and
Kazakhstan, 9.1, cause "DUMK clamps fajr and isha to angle/60 of the night".

Zero of the three is an angle failure. Apply the authority's own rule and two of them collapse
under a named preset: Morocco reaches 1.98 with the Egyptian preset, Russia reaches 5.15 with
Diyanet-Europe. Only Kazakhstan needs the pair and the clamp together, and its clamp is exactly
`HighLatitudeRule.TwilightAngle` at 15 degrees, which the package does have. So the countries D
was invented to rescue are rescued by rule handling, and the fitted pair adds nothing to two of
the three. The hybrid needs the rule handling regardless. D's incremental value over C-plus-rules
is one of these three countries, and its incremental cost is the engine in the table above.

## 9. Verdicts

### C: adopt with changes

C as described is rejected at its centre and adopted at its edges. The changes, each named.

1. **The preset is a label, never a container for overrides.** If any numeric field differs from
   the factory's output, the object is "computed", and the UI must say so. This restores the owner
   ruling in `CONSTRAINTS.md` and keeps the attribution claim honest.
2. **Drop rounding and the high-latitude rule from the knob set.** Compute at `Rounding.None`,
   apply the per-field direction in the app, supply the night rule in the app. Those two knobs
   cannot be expressed for 21 and 10 objects respectively, so keeping them would ship a
   configuration surface that silently does nothing for a quarter of the world.
3. **Admission is decided per country.** Pooled six-row deviation at or below 0.5 with a
   worst day at or below 2, across at least three years where the object has them, plus an
   explicit Ramadan-window check. Saudi Arabia passes at 0.91 only after its 31-minute Ramadan
   isha is fixed, and the 0.91 pooled figure hides that day. The UAE passes at 1.08 while its asr
   is 3.00 minutes out on every single day.
4. **The school is a user setting, defaulted from the object's printed primary.** Nine objects
   carry an alternate, 42 name one school, and 13 name none. Four of the nine print a second
   column. A country default is wrong for those four and invented for the 13 that name none.
5. **Keep the home-ground oracle in the repository and gate on it.** `verify-methods.mjs` is the
   only test in the corpus that can fail against a package bump.

### D: adopt with changes, narrowed by grade and form

D's premise is sound for the objects it was actually built from and false as a general rule. The
changes.

1. **Grade gate.** Ship only objects graded A, or provisional objects with `measuredDays` above
   one full year and the year-2 debt recorded in the object and shown in the app's provenance
   line. That excludes the 7-day, 24-day, 29-day, 30-day and 47-day fits, and it excludes every
   `candidate` pair, including the six that carry one.
2. **Form gate.** Ship through `Other` only where the rule is in the native enum or a flat
   margin set: angle, interval, `TwilightAngle`, `SeventhOfTheNight`, `MiddleOfTheNight`, flat
   margins. Everything else is the app's own code with its own tests, and it must be costed as
   such, including the two 366-entry tables, the three frozen-latitude windows, the three clock
   modes and the zone tables.
3. **Rename the claim.** "Reproduction of a recipe fitted to {authority} over {days} in {year}"
   is defensible and is what the numbers support. "The country's times" is not, and the London
   decade test, the Indonesia mis-fit and the frozen-generation withdrawals are the three
   documented reasons.
4. **Never ship a range as a point.** EE-EIC carries 42.09 to 70.36 minutes across readings of
   one sentence, BE-EMB carries no window dates, MA-HABOUS is conditionally graded. Those rows
   ship with the narrow reading recorded and the wider one visible, or they do not ship.
5. **Fix the Indonesia hole first.** The largest Muslim population has no object and a
   `countries.json` row two minutes early on both prayers. A fitted-pair pipeline that does not
   cover it is a pipeline whose demonstrated coverage is not the coverage it claims.

### The hybrid as stated: reject

Three of its four parts survive in modified form. The fourth, "one global default for no-data
countries", is unresolved between two defaults already on record (Moonsighting fallback in the
world table, 18/18 Shafi in the study) and the study's recommendation is a pair with no current
publishing body. Land that decision before the rest, because it decides what 41 FALLBACK rows and
24 unscored countries actually say on the screen.

## 10. What would change this verdict

- A blind, out-of-sample prediction test on five non-London authorities: fit on one year, predict
  the next, publish the residual. If frozen pairs hold at that distance, D's class is sound and
  the narrowing above can be relaxed.
- A second distinct year for any of the 34 provisional objects. Each one that clears raises what
  D can ship and lowers what C can claim.
- A package build with floor rounding and a per-prayer night portion. That removes the two
  blockers that put 21 and 10 objects outside C's knobs.
- A home-ground result for a country whose pair no preset carries, showing a preset at or below
  0.5 without a fitted pair. That would be the first evidence that D's incremental value is
  smaller than one country.

## Assumptions

- Assumed the escalation's "fitted pair" means the policy layer's own angles, margins, rounding
  and night rule as a set, since the dispatch names all four. Evidence: the four fields are the
  ones `adhanEmulation` maps, and the dispatch repeats them.
- Assumed "accuracy" in the claim means agreement with a published authority, because that is the
  only accuracy the study measures. Evidence: `SIM-REPORT` section 1 defines the target side as
  the authority's own recipe or published minutes.
- Assumed the 69 policy objects are D's unit of shipment rather than the 166 world-table rows,
  because a fitted pair exists only in the policy layer. Evidence: `world-table-v2.md` carries 41
  FALLBACK and 19 candidate rows with no fitted recipe.
- Assumed the app ships through store updates only, so a method change arrives with an install.
  Evidence: R4's reading of `app.config.ts` and `eas.json`, no updates block and no update
  profile.
- Assumed the notification sweep's identifier-only comparison is the mechanism the dispatch
  describes. Evidence: `shared/notifications.ts:214-221` and `device/notifications.ts:50-67`.
- Rejected the dispatch's premise that Sri Lanka, Kosovo and Malaysia print dual asr. Evidence:
  `LK-ACJU` and `XK-BIK` carry `alternate: null` with superseding provenance, and `MY-JAKIM`
  carries `alternate: null`.
- Counted 21 objects with a non-nearest rounding field (76 fields) and 17 with a floor, from
  `policy-layer.v2.4.json` directly. R4's operational note states 63. The counts differ by
  definition and this document uses its own, recomputed from the same file.
- Did not test the phone. Every notification claim is read from code and none was measured on a
  device.
