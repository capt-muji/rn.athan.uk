# Ticket 68: RTL flip: supportsRTL, forceRTL-at-switch, relaunch, widget layoutDirection (58b)

## Planning (2026-10-12, opened 2026-10-13 after midnight)

Opened under the owner's clear-the-board instruction (full workflow
autonomously, no questions). Three explore fact packs feed section 4: the
language-switch flow (entry points, convergence, reload machinery, cold-start
re-reads, the storage keys), the seven RTL-sensitive surfaces (the four
mirror sites with their tests, the 58a gate and its 21 allowlist entries (9 after step 2's surgery),
the window-space catchers), and the widget direction plumbing at the pinned
`expo-widgets`/`@expo/ui` 58.0.14 (the Host `layoutDirection` contract, the
stamp sites, every version pin and digest site).

Verified by the planner at `61fb7675`: `swapLeftAndRightInRTL` exists in the
pinned `react-native 0.88.0-rc.3` (`I18nManager.js:68`), `app.json:75` is the
flip target, `expo-updates ~58.0.15` with the Error.tsx reload precedent, and
`Host` is exported from both `@expo/ui/swift-ui` and
`@expo/ui/jetpack-compose`.

Planner rulings recorded in PLAN.md section 2: P10 (the relaunch mechanism,
after the reconcile resolves), P11 (bootstrap owns the launch-time
direction), P12 (`localeDirection` beside `LOCALE_IDS`), P13 (render-time
`I18nManager.getConstants().isRTL` reads, constant within a process), P14
(transforms for the swap-proof sites, allowlist shrinks), P15 (a dedicated
`rtl` boolean on both widget shapes, v8/v4), P16 (the Host wrap is blocked:
the widget runtime renders no HostView).

Four steps drafted: the flip and restart (weight 2), the mirrors and
transforms (weight 2), the widget direction (weight 2), the 3T device proof
(weight 3, alone). Thirteen anchors extracted; three break scripts written.

Drafted while ticket 59's executor held the checkout (its steps touch the
catalogs and width store, disjoint from every 68 anchor); the grill, the
gate re-run and the READY commit waited for its return so the griller read a
settled tree.

Grill round one (sixteen findings, all applied): the tip mirror geometry
corrected to the centre-symmetric form, the five transform-collision sites
join their existing transform arrays, every converted node gained
`direction: 'ltr'` (later superseded by round two's containing-view fix), the
Jest 30 output-format greps fixed, the project selectors fixed for .tsx
suites, the bootstrap cast and mock hygiene corrected, the react-native mock
file added to every list, the R4.1 assertions made real, the allowlist counts
corrected to 21/9, the widget-renderer stub tables and the lock-renderer
direction case added.

Grill round two (seventeen findings, all applied): P16's Host wrap is deleted
— the pinned `@expo/ui` Host compiles to a `HostView` node the widget runtime
rejects (iOS red box, Android `View not found`) — so step 3 ships the `rtl`
stamp alone and R5.2 is recorded blocked on the runtime, with step 4's widget
screenshot made mandatory evidence of today's unstamped rendering; the tip's
explicit mirror is deleted because the retained `left:` is already swapped to
`start` under RTL (R3.1 rewritten to the swap truth, `tipGeometry.ts` and
`Bar.tsx` now byte-identical); `direction: 'ltr'` moves from the converted
nodes to their CONTAINING views (the pinned Yoga resolves inset-less
absolutes with the containing node's direction); `expo-updates` gains its
jest mapping and mock file (the unit project cannot load the store without
them); `shared/__tests__/nativeConfig.test.ts` replaces the non-existent
path; the break scripts' substitution and grep strings match the repaired
contracts; the RTL .tsx spy mechanism, the waveHeading negated-angle formula,
the lock/return-site corrections, the four-file counts and the atlas and
build-script facts all replaced. Gate after both rounds: `PLAN OK`.

## Planner rulings on the step-1 STOPs (2026-10-13, the lead under the owner's no-questions instruction)

First STOP: the preflight tripped on an untracked `ai/plans/59-prayer-names/AUDIT.md`
stray (the 59 DONE merge's `git rm -r` removed only tracked files). Ruling:
the stray is deleted (59's record lives in its DONE queue cell and commit
2.0.147), and untracked paths under `ai/plans/` other than this plan's own
files are treated as absent for cleanliness — they are the lead's planning
namespace, never an executor's.

Second STOP: step 1's verbatim test failed `tsc` — `mock.invocationCallOrder.at(-1)`
widens to `number | undefined` against `toBeGreaterThan`. Ruling: the plan's
sketch gains the non-null assertions (`at(-1)!` on the three order reads), and
the red expectation is corrected: the two pure-negative cases (the
same-direction rtlSwitch case and the no-preference bootstrap case) pass at
red by construction. The executor's measured red already matches every other
named failure.

### Step 01 — DONE

Branch `feat/68-rtl-flip` off uat (`e3761f15`), version 2.0.151. Preflight
passes every check: on `uat`, `origin/uat` merged, version 2.0.150 at entry,
row 67 DEFERRED, and the three anchors this step edits (`appjson-rtl`,
`commit-flow`, `locale-ids`) each counting 1. The only porcelain entry is the
waived untracked `ai/plans/64-volume-copy/`.

Red verified exactly as the repaired plan predicts: 5 failed, 17 passed. The
two rtlSwitch crossing cases fail on `Expected number of calls: 1, Received
number of calls: 0` (`reloadAsync`), the first two bootstrap cases on 0
`allowRTL`/`forceRTL` calls, and nativeConfig on `{"supportsRTL": true}`
against `{"supportsRTL": false}`; the two pure-negative cases pass at red, as
the repaired expectation records. All four change contracts applied verbatim.

One implementation note: the bootstrap direction spies are read from inside
`jest.isolateModules`, because the isolated registry re-executes the
moduleNameMapper-mapped react-native mock, so a top-level import is a
different instance (a probe proved this before the red run).

Green: unit 6 suites / 52 tests pass, `components/sheets/__tests__/Language.test.tsx`
passes 5/5 unchanged (the sheet never learned about the restart), `npx tsc
--noEmit` exit 0, `npx biome check . --error-on-warnings` exit 0.
`scripts/break-step1.sh`: `caught: the boundary crossing no longer
relaunches`, `ALL AS EXPECTED: 1`.

Review, cold against `git show 01542516`: app.json carries the one flag
beside the version rule's mandated bump; the restart block sits inside the
`try`, after the reconcile `await`; no new storage key (`preference_language`
stays the only locale key written); no worklet, timer or subscription added;
no unread production export. Clean read, no fix applied.

Committed `01542516` (2.0.151, 12 files, +147/-6) under the version lock,
merged `--no-ff` as `a1716f25`; the lock released after the merge. Hook:
Test Suites 208 passed / 208 total, `Tests: 5477 passed, 5477 total`, and the
four coverage lines at 100% (statements 5193/5193, branches 2225/2225,
functions 1082/1082, lines 4649/4649).

This entry is uncommitted on uat: the ledger carries the shas the commit
creates, so it rides into step 2's commit (the ticket 59 precedent).

session: ses_ecd61365cffe8TKeEwD5BM4On0

### Step 02 — DONE

Branch `feat/68-mirror-sites` off uat (`6a714f2f`), version 2.0.153. Anchor
check: all six anchors this step edits (`bar-leftstyle`, `segmented-pill`,
`toggle-travel`, `wave-point`, `overlay-left`, `veil-left`) count 1.

Red: 10 new cases failed across the six suites, all existing cases passing
(290 passed). The two crossings of the segmented pill state the mirrored
slot, the toggle's first-frame and animated travel negate, the wave point,
heading, path and trail twins mirror, the catcher and veil-glow and cloud
flattened styles carry a translateX first entry where they carried `left:`.

Deviations, all recorded rather than guessed:
- The plan's green command writes `--selectProjects=unit,components`, which
  jest 30 rejects ("no projects were found matching the selection", a
  comma-joined name is not a project). The same six paths ran as
  `--selectProjects unit components`.
- `components/overlay/__tests__/VeilBackdrop.test.tsx` is not in the plan's
  Files list, but it is the veil's own suite and the home red item 5's veil
  assertion needs; it is the fourteenth changed file.
- The RTL assertions sit in suites named `... under RTL`, so the break
  script's `-t 'RTL'` filter selects exactly them.
- The SegmentedControl animated-target case: `withTiming(0)` is also emitted
  by the option fade, so that assertion alone passed at red. The case gained
  `expect(withTiming).not.toHaveBeenCalledWith(200, ...)` to isolate the
  pill's own target, which is the assertion the plan asks for.
- The wave functions' trailing `isRTL` parameter carries a `false` default:
  the plan's review checklist requires the pre-existing cases unedited, and
  a required parameter fails tsc on every existing three-argument call.
- The direction pin went on the three containing views of the converted
  decorations (the decorations root, FloatingMoon's root, FloatingStar's
  root). Those are the real containing blocks; the plan names the root alone.
- The Ramadan R4.1 assertion is made on the cloud, the one converted site
  whose old `left` was the constant 0 and therefore the one value the suite
  can state outright; the other nine offsets are internal geometry.

Green: 27 suites / 300 tests pass across both projects, `node
scripts/check-directional-styles.js` prints `DIRECTIONAL STYLES OK` and exits
0, `npx tsc --noEmit` exit 0, `npx biome check . --error-on-warnings` exit 0.
No `left:`/`right:` key remains in the three converted files;
`tipGeometry.ts` and `Bar.tsx` are untouched, so the tip rides the layout
swap byte-identically. `scripts/break-step2.sh`: `caught: the pill no longer
mirrors`, `ALL AS EXPECTED: 1`.

Review, cold: the allowlist keeps nine entries (Bar with the rewritten
reason, six catcherGeometry entries, the two prose entries) and the twelve
converted entries left; every converted node's inset became a transform; the
LTR cases in all six suites are unedited and pass.

Sequence note: the step commit first landed on uat because the branch was not
made first. uat was one unpushed commit ahead of origin/uat, so the commit
was moved onto `feat/68-mirror-sites` at `db50f9db`, uat reset to `6a714f2f`,
and the merge taken `--no-ff` as this step prescribes; no published history
was touched.

Committed `db50f9db` (2.0.153, 18 files, +335/-103) under the version lock,
merged `--no-ff` as `4bd52292`; the lock released after the merge. The commit
carried step 1's ledger entry, closing its reference. Hook: Test Suites 208
passed / 208 total, `Tests: 5493 passed, 5493 total`, coverage 100%
(statements 5198/5198, branches 2239/2239, functions 1082/1082, lines
4655/4655).

session: ses_ecd61365cffe8TKeEwD5BM4On0

### Step 03 — DONE

Branch `feat/68-widget-stamp` off uat (`5ea8e17c`), version 2.0.155. Anchor
check: `widgettypes-ios`, `widgettypes-android` and `timeline-entry` each
count 1.

Red: exactly the seven predicted failures across five suites, with the other
147 cases passing. Two pins failed `Expected: 4, Received: 3`
(`widgetSnapshot`, `widgetAndroid`), the two version constants failed
`Expected: 8/4, Received: 7/3` (`widgetContract`), the every-entry direction
check failed `Expected: true, Received: false`, `snapshot?.rtl` failed
`Received: undefined`, and the stale terminal entry's whole-object assertion
failed on the extra field.

Contracts applied verbatim: the v8 and v4 history lines naming the blocked
Host (P16); `rtl?: boolean` on `PrayerWidgetProps` after `stale?: boolean`
and on `PrayerWidgetAndroidProps` after `strings`; the stamp
`rtl: localeDirection(currentLocaleId()) === 'rtl'` as the third property in
`makeEntry`'s props, in the stale terminal entry's props, and in
`buildPrayerWidgetSnapshot`'s return. Three stamp sites; no widget module
touched.

Deviations, recorded:
- Red item 1 places the snapshot assertion "under the test locale (en)".
  `widgetTimeline.test.ts` has two `buildPrayerWidgetSnapshot` blocks and the
  second runs inside `setActiveLocale('ar')`, where the stamp is true, so the
  assertion went beside the first (en) block; the ar block was left as the
  plan drew it.
- The digest delta is verified by construction rather than by
  re-serialization: the only code that builds the hashed structure gained one
  property per object literal and the two version constants, so the delta is
  exactly `v` and `rtl`. All twelve digests moved and every non-digest case
  is green.
- `rtl` is read by no production code yet: the Host application is blocked on
  the widget runtime (P16), so the field is the schema groundwork the plan
  describes, and the tests are its only readers today.

Green: 11 suites / 271 tests pass, `npx tsc --noEmit` exit 0, `npx biome
check . --error-on-warnings` exit 0. The renderer, lock-renderer,
runtime-loads, static-strings and settings-sync suites pass unchanged.
`scripts/break-step3.sh`: `caught: the entries no longer carry the locale's
direction`, `ALL AS EXPECTED: 1`.

Review, cold against `git show a3d8d282`: the diff is the two constants, the
two interfaces, the three stamp sites, the four pins with their two title
renames, and the digest table; no `widgets/` file changed; the 67 folder and
its saved patch are untouched; both history blocks carry their new line.

Committed `a3d8d282` (2.0.155, 11 files, +111/-24) under the version lock,
merged `--no-ff` as `b9a8a284`; the lock released after the merge. The commit
carried step 2's ledger entry, closing its reference. Hook: Test Suites 208
passed / 208 total, `Tests: 5493 passed, 5493 total`, coverage 100%
(statements 5198/5198, branches 2239/2239, functions 1082/1082, lines
4655/4655).

session: ses_ecd61365cffe8TKeEwD5BM4On0

### Step 04 — DONE (proof captured, both findings ruled by the lead)

Build: `zsh $HOME/athan-gitree/bin/build-mock.zsh uat mocks/simple.ts
$HOME/athan-gitree/sessions/68/athan-68-mock.apk`, ref `uat` ->
`b9a8a284`, `BUILD-MOCK OK` in 620s. `aapt2 dump badging` prints
`package: name='com.mugtaba.athan' versionCode='1000000'
versionName='2.0.155'`; the gradle log carries `BUILD SUCCESSFUL` once; the
script's "0 mock dates found" is expected because `mocks/simple.ts` holds no
`YYYY-MM-DD` literal. Installed with `adb -s 3T_SERIAL install -r`; the
device reports versionCode 1000000 / versionName 2.0.155.

Finding 1, the relaunch is an in-process JS reload, not a process restart.
`adb shell pidof com.mugtaba.athan` reads 8943 both before and after the
crossing, and no `ActivityManager` start-proc line appears, so the process
never restarted. What the logcat does show, once per crossing, is
`W/unknown:BridgelessReact( 8943): ReactHost{0}.getOrCreateReloadTask():
Stopping all React Native surfaces`, then `Destroying ReactContext`,
`Destroying ReactInstance`, and a fresh `APP: feature flags resolved` for the
new JS instance 1.5s later. The crossing also logs
`E/unknown:ReactHost: Unhandled SoftException
com.facebook.react.bridge.ReactNoCrashSoftException:
raiseSoftException(callWithExistingReactInstance(callFunctionOnModule(` from
`AppStateModule.onHostPause`, an AppState event racing the teardown: non-fatal
(the new instance rendered), but it is a soft exception on every crossing.
Counts: `getOrCreateReloadTask(): Destroying ReactContext` = 1 in each of
`logcat-ar-switch.txt` and `logcat-en-restore.txt`, and
`Starting reconcileLanguageSurfaces` = 1 in each. The plan's proof item 2
predicts "the process restarts and the launch line re-appears"; the launch
line re-appears, the process restart does not happen on this build.

Finding 2, no launcher widget is placed, so proof item 4 cannot be captured.
`adb shell dumpsys appwidget` shows `widgets.size=0` on the launcher host and
the eight Athan providers registered but unbound; the three home pages are
wallpaper and dock only. Item 4 is mandatory and presupposes a placed widget;
placing one is the atlas's picker flow and its documented accident risk, so it
was not attempted without the lead's word.

The mirroring itself reads as real. Under ar (`04-ar-list.png`) the prayer
names sit on the right with times centre and bells left, the header is
right-aligned, the mosque mark has moved to the left, the countdown bar fills
from the right edge, and the digits are Arabic-Indic. The ar Settings sheet
(`05-ar-settings.png`) puts the title right, the row icons right and the
chevrons left, with the toggles in the left column. The ar Language sheet
(`09-ar-language.png`) right-aligns its rows and moves the check mark to the
left of `العربية`. Restored to English (`10-en-restored.png`) the shell is
layout-identical to the `01-en-list.png` reference: names left, bells right,
mosque mark right, bar filling from the left. The pixel contents differ only
in the mock's rolling times (Fajr 01:53 -> 02:04), so the restore is
layout-identical rather than byte-identical.

Evidence, `$HOME/athan-gitree/sessions/68/` (nothing committed to the repo):
`01-en-list.png`, `02-settings-en.png`, `03-language-en.png`, `04-ar-list.png`,
`05-ar-settings.png`, `06-ar-home.png`, `07-ar-home-p2.png`,
`08-ar-home-p0.png`, `09-ar-language.png`, `10-en-restored.png`,
`logcat-ar-switch.txt`, `logcat-en-restore.txt`, `build-68.log`,
`athan-68-mock.apk` and its `.build.txt`.

Left on the phone: the mock build 2.0.155, the app in English, automatic time
still on (`settings get global auto_time` = 1). No commit made: the lead reads
the images and rules before the docs commit.

session: ses_ecd61365cffe8TKeEwD5BM4On0

## Lead rulings on step 4's STOP (2026-10-13)

The lead read the screenshots itself (`01-en-list`, `04-ar-list`,
`02-settings-en`, `05-ar-settings`, `09-ar-language`, `10-en-restored` in
`$HOME/athan-gitree/sessions/68/`) and confirms the device face: the ar list
mirrors every LTR anchor (names right, times centre, bells left, header and
date right, mosque mark left, Arabic-Indic digits, the countdown filling
from the right edge); the Settings and Language sheets mirror (titles right,
token icon left, chevrons left, rows right-aligned); the on-toggle's thumb
sits at the track's left end under ar against the right end under en (R3.3
device face); the restored en shell is layout-identical to the reference,
times differing only by the mock's rolling minutes. The segmented control's
device face is not captured (the captured sheets carry none); its mirror is
suite-proven and rides the D41 confidence build.

Finding 1 ruled: the relaunch is an in-process JS reload
(`Updates.reloadAsync`), not a process restart; the plan's step-4 wording was
wrong and now reads correctly. D59's outcome (mirrored shell after the
crossing, one relaunch per crossing) holds as measured. The one
`ReactNoCrashSoftException` from `AppStateModule.onHostPause` racing the
teardown, logged on every crossing, is non-fatal and becomes queue row 71.

Finding 2 ruled: with no launcher widget placed, the `dumpsys appwidget`
structured evidence stands in for the mandatory screenshot (providers
registered, unbound, `widgets.size=0`); the stamp is data-only by design and
the picker flow's documented accident risk is not taken for a face the plan
does not change.

## Ticket 68 (2026-10-12)

The RTL flip landed: supportsRTL true, bootstrap applies the stored direction
before first render, crossing the RTL boundary converges then relaunches
(D59; measured on the 3T as an in-process JS reload, one per crossing), the
four no-logical-form sites mirror, the window-space sites hold their
coordinates through transforms, and every widget blob carries rtl (v8/v4) as
the schema groundwork the blocked Host application will read (P16).
