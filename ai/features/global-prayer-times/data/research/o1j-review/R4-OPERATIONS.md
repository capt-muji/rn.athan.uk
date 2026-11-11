# R4 operations: what each direction costs the shipped app

Review seat R4 of the worldwide prayer-times panel. This document judges four candidate
directions by what they do to the app that already exists and to the people who maintain it.
Accuracy appears only where it is an operational fact, such as a country nine minutes out on
first run. Study elegance is not scored here, and neither is the panel's own preference.

Read for this review: `RESUME-FROM.md`, the head and Parts 0, 5 and 7 of `bake-RUNBOOK.md`,
`o1h-global/sim`, `o1h-global/top30`, `o1h-global/seasonal`, `o1h-global/gapfill`,
`o1h-global/indonesia`, `o1i-package/PACKAGE-REPORT.md` and `o1i-package/homeground`, and the
app source at `2.52.25`. Nothing outside this directory was written.

## 0. The app as it stands, which bounds every direction

Six facts decide most of this review. Each is read from the code, not assumed.

| Fact | Evidence |
| --- | --- |
| There is no network in the time path. Times come from a bundled artifact, `assets/data/london-2026-2076.bin`, 223,548 bytes: a 12-byte header then 18,628 day rows of six uint16 minutes | `shared/timetableDecode.ts:17-30`, `stores/sync.ts:1-11` |
| `adhan` is not a dependency. The version studied, 4.4.6, was installed outside this repo | `package.json` has no `adhan` key, `o1i-package/PACKAGE-REPORT.md:5-6` |
| The alarm identifier carries the schedule, the prayer and the date, and never the minute | `device/notifications.ts:50-51` |
| The stale sweep diffs identifier sets, so a moved minute is invisible to it | `shared/notifications.ts:214-221` |
| Timezone is a process-wide constant, and the offset caches are keyed by UTC day and by quarter hour only, with no zone in the key | `shared/constants.ts:272`, `shared/time.ts:65-94` |
| There is no OTA channel. `app.config.ts` carries no `updates` block and `eas.json` has no update profile, so every JS change reaches users through store review | `app.config.ts`, `eas.json` |

Add one surface fact the panel has not priced. The place name is a translated constant in 75
catalogs (`'day.location': 'London, UK'`) and the widget's neutral card prints "Prayer times for
London" in 75 locales from `shared/i18n/widget-statics.json`, which the widget reads in the
device language with no access to app state. A worldwide build re-keys 150 catalog entries
before it serves a second city, and those are user-visible strings, which this repo settles only
with the owner's say.

## 1. Operational cost of each direction

Four directions. D1 is the thirteen package presets, mapped per country, nothing else. D2 adds
per-country school, high-latitude rule and rounding on top of a preset. D3 routes any country
whose published pair no preset carries through the package's `Other` template with the fitted
pair. D4 is the hybrid, with London always on its baked bin.

Measured sizes, not estimates: the London bin is 223,548 bytes for 50 years, which is 4,380
bytes per country-year (365 days x 6 rows x 2 bytes). The adhan CommonJS source totals 63,459
bytes, and the bundled delta is at most that after tree shaking. The census carries 69 country
objects, of which 56 are pure angle pairs, 42 carry non-zero minute margins and 63 carry a
rounding that is not nearest for at least one field.

| | D1 presets only | D2 presets plus config | D3 pairs through Other | D4 hybrid |
| --- | --- | --- | --- | --- |
| Shipped bytes, code | about 63 KB of adhan plus no data | same plus about 12 KB of config source | same plus about 3 KB of pairs | same plus everything below |
| Shipped bytes, data | none | none | none | 223,548 B for London, plus 4,380 B per baked country-year |
| Config rows | 1 field per country, 13 values | 4 fields per country, 69 rows | 6 fields per country, 56 rows | all of D2 and D3 |
| User-facing settings | place picker only | place picker only | place picker only | place picker plus a source-state display |
| Test surface | 13 preset snapshots | 69 country fixtures | 69 country fixtures plus a fit pin | every one of them plus expiry, decode and source-switch tests |
| Yearly ritual | none | none | none | the January calendar in `bake-RUNBOOK.md` Part 5 |

**D1 costs less than it looks and buys less than it claims.** The mapping table does not
disappear, it only shrinks its value domain: a country still needs one row naming which of the
thirteen presets it takes, which is the same 69-row table D2 and D3 need. What D1 buys is
exactly the preset's arithmetic. What it cannot buy is a pair no preset carries, and the panel
should read that as a fact about arithmetic rather than about coverage. Morocco sits at 7.49
minutes mean deviation with a worst day 61 minutes out, Kazakhstan at 9.12 with a worst day of
77, Russia at 13.31 with a worst day of 101. Uzbekistan is inside 2 minutes on 17 percent of
days. The eleven targets the gap-fill could place, which include Oslo, Helsinki and Tallinn, put
the best available method at 9.91 minutes combined. That is a table ten minutes wrong on a
Nordic morning.

**D2 fixes the rule and not the angle, and without margins it fixes very little.** The measured
target side carries, on average, a one to three minute ihtiyat on fajr and isha and up to seven
on a single row. Umm al-Qura carries +1 on all six. Diyanet carries a temkin of -7, +5, +4 and
+7. JAKIM carries +2 on both ends. A configuration of school, high-latitude rule and rounding
alone therefore cannot reproduce any authority's printed table, which is the claim the study
scored. Adding margins makes it a four-field row and changes the price only slightly. The reason
to say this plainly is that D2 is the direction most likely to be mistaken for "D3 with less
work". It is not. It keeps the preset's angles, and Morocco's worst day stays 61 minutes out.

**D3 is D2 plus 112 numbers, and it is the only direction the measurements support.** The census
computed every target with adhan itself, from the country's own fitted pair, its margins, its
rounding and its school. A pair shipped through `Other` with that same configuration reproduces
the target to the rounding, which is why the top-30 table reports 0.00 for Egypt, Turkey,
Nigeria, Malaysia and Indonesia on the method that carries the fitted pair, and 0.05 for Iran.
The operational point is the price: the expensive part of D2 is the 69-row table, and the pair
that makes it accurate is two more columns. D3's cost is D2's cost plus a fit.

Its cost is also a new class of defect that no preset can have. `Other` starts at zero angles
and nothing in the library rejects a degenerate configuration, so an unfitted or missing pair
ships a table with fajr after sunrise. The package report measured it: 04:56 fajr against 04:49
sunrise at London on 2026-06-01. A build that loses one row of the pair table draws a nonsense
day and arms alarms on it.

**D4 is D3 plus an external calendar, and the calendar is the whole cost.** Part 5 of the
runbook names a probe window and a hard stop per source: Brunei stops on 31 December, Turkey on
5 January, Thailand on 20 January, Singapore, Egypt and Indonesia on 31 January, UAE on 31
December. Jordan and Qatar are daily captures with no year door. Indonesia is twelve requests
per city per year across 516 cities. Sri Lanka is 13 zones x 12 monthly files, delivered as
images and needing OCR. Thailand is behind Cloudflare and needs a browser-grade fetch. Saudi
takes one request per Hijri year until 1500H, which is November 2077. That is an owner-run
operational calendar with roughly 17 full entries and 27 batch feeds, several of them daily or
monthly rather than annual, and every one of its failures is silent by design.

The bake's own rule states the consequence: "Expiry is silent and total for that source;
nothing crashes." A country whose artifact expired falls to its computed recipe on a date the
data chose, not on a date the owner chose.

## 2. The update trap

The trap is documented and it is worse than a stale cache. `findStaleScheduledNotificationIds`
compares the identifier set the phone holds against the identifier set the app recorded, and the
identifier is `athan_${scheduleType}_${id}_${date}`. It names the day and the prayer and never
the minute. A method change that moves fajr from 05:12 to 05:07 leaves the identifier byte
identical, so the sweep finds nothing stale, cancels nothing and reports a clean pass, while the
phone keeps the 05:12 instant armed.

Three things make this recoverable rather than fatal, and each is a condition a direction must
keep true.

Re-scheduling the same identifier replaces in place on both platforms. That is why the trap is
survivable at all, and it means the repair is always an explicit re-arm rather than a cancel and
schedule.

A version bump does force a re-arm, through `forceNotificationReschedule`, which
`handleAppUpgrade` calls on every upgrade. That function reads `Constants.expoConfig.version`,
which is the store build's version and not an update identifier. An OTA that keeps the version
would not trigger it. There is no OTA channel configured today, so the condition holds by
accident rather than by design, and it is one `updates` block away from failing.

The refresh gate is two hours. A launch inside that window skips the reschedule entirely, so
even the launch that applies a new build can leave the old instants armed until the next
foreground past the gate.

What a country change must therefore do, in full:

1. Re-arm every candidate row rather than trust the sweep. The budget is 64 requests and the
   walk reaches 66 days, so a fully armed user holds about ten days of instants and a sparse one
   can hold 64 days of them.
2. Re-arm whole, never per prayer. A method change that moves fajr later can leave a suhoor
   reminder armed before its athan, which the repo forbids outright.
3. Re-push the widget timelines, because both platforms carry absolute instants: iOS entries in
   a timeline, Android in a stored snapshot.
4. Invalidate the day cache under a source-scoped key, and bump `CACHE_SCHEMA_VERSION` when the
   shape changes rather than the values.
5. Show the delta, since a silent two-minute move on a prayer someone relies on is the worst
   thing this app can do quietly.

**Which direction minimises silent moves.** D3 does, and the reason is a distinction the panel
has not drawn. Under D3 a country's times are a build-time constant that changes only when a
version is bumped, and a version bump forces the re-arm. Under D4 a country's times can also
change on a calendar date, when a bin expires and the computed fallback takes over, and that
move needs no release, no version bump and no re-arm. It lands inside an armed window of up to
64 requests and it is silent by the bake's own design.

D1 and D2 share D3's release-bound property, so they are equally safe on this axis and equally
wrong on the arithmetic.

The rule I would enforce, whatever ships: a change that can move a time may only ship with a
version bump, an explicit whole-candidate re-arm, a widget re-push and a one-time delta notice,
and a baked artifact may not expire unless its fallback reproduces it within two minutes on
every day the artifact covers. The second half of that rule turns expiry from a silent move into
a no-op, and it is measurable with the scripts this programme already has.

## 3. Package version policy

Pin `adhan` to an exact version, no caret and no tilde, on the precedent this repo already sets
for `expo-widgets` and `@expo/ui`. The package has no tests of its own, ships no fixtures, and
exposes no metadata about a preset beyond a name and four numbers, so a range would let a
registry publish change a prayer time on a device with no code change and no review.

What a 4.5 bump could change, per direction:

| | What an engine bump can move | What a preset re-tune can move |
| --- | --- | --- |
| D1 | every country, consistently | one or more countries, silently, and the mapping table still points at them |
| D2 | every country | every country using that preset, with its own config laid on top |
| D3 | every country, through the shared engine | only the countries using a preset, which under D3 is the set where the preset is the body's own claim |
| D4 | every computed country, never a baked bin | as D3, and nothing inside a bin |

Four behaviours make a preset re-tune particularly hard to notice. `MoonsightingCommittee` is
recognised by a string comparison on the method name, so a copied parameter set silently loses
its season curve. `Rounding.Up` adds a whole minute to a value already on the minute, because
60 minus 0 is 60. The night clamp assigns in one direction only, so a change to it can silence a
London summer day rather than fail loudly. And `Other` at zero angles is degenerate but valid.

The evidence that a bump is testable already exists: `verify-methods.mjs` replays eight upstream
fixture files, 2,772 prayer values, in their own time zones, and diffs all thirteen factories
field by field. That is the gate a bump must pass, and it is cheap because it is written.

Rollback story. With an exact pin, rollback is a one-line revert plus a rebuild plus a store
release. The cost is the release latency, not the revert: users who took the bad build have
alarms armed at the moved instants until their next reschedule, and a rollback release repairs
them because it bumps the version. Under a caret range there is no rollback at all, only a
forward fix. That asymmetry is why the pin is worth more than the convenience it costs.

One more policy point, because it decides D3's safety. Pinning protects against an engine
change. It does not protect against a fitted pair that is wrong on the day it is written. A pair
must therefore carry its provenance into the repo and a regression that pins its output for a
year, exactly as the London artifact's header validation pins its span.

## 4. Failure modes nobody else will name

**First install offline in a fallback country.** The app's launch is gated on `hasUsableDays()`,
which asks whether any of today to today plus two is readable, and the reschedule refuses to run
against an empty cache. A computed source in a polar country produces no instant for weeks at a
time, because `polarCircleResolution` defaults to `Unresolved` and leaves invalid dates in
place. Those become rows with no moment, which is a supported state, or become NaN minutes,
which is not. In the first case a first install in Tromsø in June lands on the error screen whose
only action is a Refresh that wipes, and in the second it arms nothing and draws a table of
dashes. Norway is the one authority the programme never closed, which is the worst possible
country to leave this untested.

**A DST-law change.** Timezone is one process-wide constant today, and the offset caches are
keyed by UTC day and quarter hour with no zone in the key. The moment a second country ships,
that cache must be re-keyed or one country's offset is served for another, and the failure looks
like a one-hour error on one app, on one day, that nobody reproduces. Morocco runs a fixed UTC+0
clock while civil time is UTC+1, Lebanon is fixed at UTC+2, Belgium publishes a frozen clock, and
Ireland's feed carries a DST defect that switches on 1 April and 1 November. A direction that
stores an offset rather than deriving it from IANA at read time will be wrong on exactly those
sources and right everywhere the tests look.

**A preset quietly re-tuned upstream.** Covered in section 3. The operational version is worse
than the technical one: nothing in the app, the store listing or the release notes would say
that a country's fajr moved. The pin is the only control.

**An orphaned source preference.** `UPGRADE_KEEP_PREFIXES` keeps every `preference_` key across
an upgrade wipe. A stored source id therefore survives a build that no longer carries that
source, and the app reads times from a source with no data. Source ids must never be reused, and
a migration must map an unknown id to the fallback rather than to a blank.

**A degenerate pair.** An `Other` object with a missing angle draws fajr after sunrise and
nothing rejects it. D3 makes this reachable by data entry, which no other direction does. A
build-time assertion that every shipped pair produces six ordered times for a sample of
latitudes is the whole mitigation, and it must run before the artifact is built rather than in a
test that a data edit can bypass.

**A bake that expires mid-window.** D4's calendar can move a country's times on 1 January while
64 requests of alarms are armed across the boundary. Someone hears an athan at a time the app
no longer displays. This is the single worst interaction in the design space, and it is created
by baking rather than by computing.

**Store-review latency on a January refresh.** With no OTA configured, a baked country's refresh
is a store release. Every user who does not update keeps the computed fallback, which is fine if
the fallback matches the digits and a lie if the release notes claim published times.

## 5. Verdict per direction, and what I would ship

**D1, presets only: reject.** It is cheap and it is wrong in the places the census spent a month
measuring. Morocco at 7.5 minutes, Kazakhstan at 9.1, Russia at 13.3, the Baltic and Nordic
targets at a best of 9.9, and a summer error that the annual mean hides in a sixth of all cells.
A prayer app nine minutes out is not a rounding difference, and no amount of pinning makes it
right.

**D2, presets plus school, high-latitude and rounding: adopt as a layer, never as the answer.**
It is a real improvement wherever a country's error is a rule rather than an angle, and it is
the table D3 needs anyway. Without margins it cannot reproduce a single authority's printed
table, so it must not be sold as reproduction.

**D3, fitted pairs through `Other`: the backbone.** It is the only direction whose accuracy the
programme actually measured, because the targets were computed with the same library and the
same pairs. Its operational cost over D2 is 112 numbers and one build-time assertion. Its
weakness is the thirteen objects a frozen pair cannot express, and those are the only countries
that should ever see a bin.

**D4, the hybrid: take London's bin and almost nothing else.** London's bin is the one artifact
that earns its place. It is 50 years deep, it is the publisher's own digits, the best computed
method is still 2.95 minutes out on fajr and 4.37 on isha across 4,383 published days, and the
publisher is the app's own producer. Every other bin is one year deep, needs an annual ritual
with a named hard stop, and hands the app a scheduled silent move on 1 January. Admit a second
bin only where the rule has no closed form, which is the seasonal-sweep and interval-table class,
and only with a fallback proven to match it within two minutes for the whole year it covers.

**Ship: D3 as the body of the app, with London on its baked bin, presets retained only where the
preset is the authority's own claim, and `adhan` pinned exact behind the 2,772-value fixture
gate.** The one rule that makes this safe is the expiry rule above: no bin may expire unless its
fallback already reproduces it. The one rule that makes it honest is the update rule: a time that
moves ships with a version bump, a whole-candidate re-arm, a widget re-push and a delta notice,
never with a sweep.

## Assumptions

- The four directions are read as the panel brief states them. D2's configuration is taken as
  school, high-latitude rule and rounding only, and margins are priced separately because the
  brief does not name them. Evidence: the brief's own wording, against `policy-layer.v2.4.json`
  where 42 of 69 objects carry non-zero margins.
- "Per-country preset" means one of the thirteen shipped factories, chosen per country, with no
  hand-built parameter object. Evidence: `PACKAGE-REPORT.md` sections "The thirteen methods" and
  "What the package does NOT contain".
- The 9.91 combined figure for the eleven targets the gap-fill could place is read as the best
  available method on that set, not as an average of all methods. Evidence:
  `o1h-global/gapfill/GAPFILL-REPORT.md` section 3.
- No OTA channel exists, so "OTA/app update" in the brief collapses to an app update today.
  Evidence: `app.config.ts` has no `updates` block and `eas.json` defines no update profile.
