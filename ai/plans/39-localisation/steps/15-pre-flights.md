# Step 15: the 3T pre-flights

Two measurements on the floor device with a production build, and one design note recorded.
The timing experiment decides the loader's body; because step 05 indirected the catalog behind
`shared/i18n/loader.ts`, the decision rewrites one module, never a call site (the ARCH-17
repair).

Requirements: R2.1, R9.1

- Branch: `feat/38-15-preflights`
- Files: `shared/i18n/loader.ts` (only if the experiment loses the TS require), LOG.md (the
  numbers, always), and no other file

## The build

`zsh ~/athan-gitree/bin/build-prod.zsh` per `ai/AGENTS.md` (never two at once; the APK lands
outside `/tmp` and the repo; success prints `BUILD-PROD OK`). Install on the 3T with
`adb -s $3T_SERIAL install -r <apk>` (`-r` keeps data). Before ANY clock work, read
`adb -s $3T_SERIAL shell dumpsys alarm | grep -A2 'com.mugtaba.athan}'` and compare with the
armed list; the expected-alarm list also names the unexplained app alarm at
`when 2104803640505`. This step changes no clock and arms nothing new; the dump is the
identifier-bytes proof, compared against the same dump taken on the 1.29.x build before the
upgrade install.

## Experiment 1: first-catalog require timing (R16 forced change 3)

Decision rule written down BEFORE the experiment: if requiring `shared/i18n/en.ts` at first
paint measures above 5 ms of JS-thread time on the 3T in the production build (logcat
`perfMeasure` around the first `t()` call), the loader switches to `JSON.parse` of an
embedded JSON string constant in `loader.ts` (the pre-decided contingency), and the parity
suite from step 07 already covers the format. Otherwise the TS require stays.

Measure: add nothing to the app; read the existing `perfMark`/`perfMeasure` lines the launch
path already emits around module evaluation and first render (`adb logcat -s …`), and the
catalog require time from a one-off `perfMeasure('catalog_require', …)` wrapper INSIDE
`loader.ts` committed with this step and kept (it measures a real boundary and costs one
call). Record the number in LOG.md with the build's version.

## Experiment 2: the width seed and the identifier bytes on a real upgrade

1. With the 1.29.x production build installed and populated (days fetched, bells armed), take
   the alarm dump and the two legacy width keys (`adb shell run-as com.mugtaba.athan` is
   unavailable for release builds; the width keys prove out through the app's own reflow
   behaviour - the seeded `en` keys hold when the first measurement does NOT reflow the list,
   observed as no layout change on first launch).
2. Install the step-15 build over it (`-r`). First launch: the row renders one name, times
   aligned; `preference_language` reads `en` through the app's debug screen or logcat line
   `VERSION: Stamped upgrade language to en`; the dead-key removal logs once.
3. Fresh-install proof on the second device image or after the owner's consent only: a fresh
   install keeps `preference_language` absent - proven in the Jest suite (step 12 test 1b);
   the device proof is the upgrading install (the owner's daily driver state is never wiped).

## The design note (replaces the old month-name probe)

Month and weekday names are catalog entries at row 39 (31 keys per locale, A2). The `ur bn
fr de` `Intl` probe is retired with the mechanism it probed. Record in LOG.md: the milestone
set `en ar ms so hi th` sources its month keys from CLDR-derived tables at row 39, each key
one line in the flat catalog, reviewed like any term.

## Red / green

No production change unless experiment 1 loses the require (then `loader.ts` changes and the
full i18n plus bridge suites re-run green). The step's acceptance is the numbers in LOG.md
and the device observations, not a new test.

## Break script

None (no guarded logic). The step's checks are the device reads.

## Version and commit

`<VERSION> - docs(i18n): 3T pre-flights recorded; loader decision written down`

Add by name: `shared/i18n/loader.ts` (if changed), LOG.md. The device evidence files land
under `~/athan-gitree/sessions/38/` (logcat, alarm dumps), never in the repo.

## Review checklist

The LOG.md numbers name their builds. No screenshot is committed or sent to the owner.
Shipped classes: Rule (the alarm dump must show identical identifiers; any diff is a STOP).

## Done when

Both experiments' numbers are in LOG.md with their build versions, the upgrade install
behaved as R18's corrected table predicts, `yarn validate` green, merged `--no-ff`.

## Restore

`git checkout -- shared/i18n/loader.ts` if the experiment changed it and the step stops
part-way.
