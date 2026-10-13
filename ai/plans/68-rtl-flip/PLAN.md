# Ticket 68: RTL flip: supportsRTL, forceRTL-at-switch, relaunch, widget layoutDirection (58b)

| Brief | RTL flip: supportsRTL, forceRTL-at-switch, relaunch, widget layoutDirection (58b) |
| --- | --- |
| Planned at | `5f46246b`, version 2.0.148, 2026-10-13 (anchors re-verified at this sha after ticket 59's closes; the fact packs of 2026-10-12 sit in section 4) |
| Planned by | Planning session 2026-10-12 |
| Needs first | nothing (58 DONE; group free while 67 stays DEFERRED and 69 stays owner-blocked) |
| Parent | 58 (the two-stage mirroring goal, D60; 58a landed as row 58) |
| Group | widget props and widget modules plus the app shell's direction machinery (free while 67 is deferred; serializes with 67 and 69 whenever either returns to flight) |
| Batch budget | 2 (one code step per dispatch; the device step always dispatches alone) |
| Session budget | 5 |
| Steps count | 4 (three code steps, one device step) |
| Device | the 3T mock build, step 4, weight 3, alone |
| Owner decisions still needed | none. D59 (relaunch on crossing the RTL boundary), D60 (two-stage split), D68 (this row) taken 2026-10-11/12; the owner's 2026-10-12 instruction governs this planning: no questions |

## 1. Goal

Today Arabic text renders RTL inside an English-coded LTR shell: `supportsRTL`
is false (`app.json:75`), `I18nManager` has zero uses in code, and the layout
never mirrors. The owner wants proper native mirroring: when the active
language is RTL, the layout mirrors like native Arabic apps.

When DONE: `app.json` carries `supportsRTL: true`; a stored or newly picked
`ar` preference drives `I18nManager.allowRTL(true)` plus `forceRTL(true)`
before first render; crossing the RTL boundary in the language sheet (either
direction) completes persistence, activation and convergence, then forces the
new direction and relaunches the app through `Updates.reloadAsync()` (D59:
Fabric treats direction as launch-time); a same-direction switch never
relaunches; the countdown tip, the SegmentedControl pill, the toggle thumb
and the qibla wave mirror under RTL; the window-space overlay catchers, the
veil glow and the Ramadan decorations keep their physical coordinates through
transforms the auto-swap cannot touch; every pushed widget blob carries an
`rtl` boolean (schema v8/v4) and every widget tree renders under
`Host layoutDirection` resolved from it.

The owner's rules that apply: no pixel changes under LTR (every conversion is
position-identical when direction is LTR), the catalog gates hold, widget
props stay JSON-only with schema versions and a `props == null` guard, and
the widget runtime imports nothing outside its bundle.

## 2. Decisions

### 2.1 Taken

| ID | Decision | Who, when | Recorded |
| --- | --- | --- | --- |
| D59 | The app relaunches itself when switching to or from an RTL locale; Fabric treats direction as launch-time | Owner, 2026-10-11 | Queue rows 58 and 68 |
| D60 | Two-stage split: 58a converted the convertible styles (row 58, DONE), 58b flips and mirrors | Owner, 2026-10-11 | Queue rows 58 and 68 |
| D68 | 58b is its own row | Owner, 2026-10-12 | Queue row 68 |
| P10 | The relaunch mechanism is `Updates.reloadAsync()` behind `I18nManager.allowRTL(true)` and `forceRTL(<new direction>)`, the repo's only existing reload (Error.tsx); it fires after `reconcileLanguageSurfaces` resolves, never before | Planner, from D59 and the Error.tsx precedent | Step 1 |
| P11 | Launch-time direction: `stores/bootstrap.ts` (the synchronous pre-render module) applies `allowRTL(true)` and, when a stored preference exists, `forceRTL(localeDirection(stored) === 'rtl')`; no stored preference leaves the native default (the device decides, D33) | Planner, from the bootstrap design | Step 1 |
| P12 | `localeDirection(id: LocaleId): 'ltr' | 'rtl'` lives in `shared/i18n/locale.ts` beside `LOCALE_IDS`; `ar` is the only RTL id in the shipped six | Planner, from the closed union | Step 1 |
| P13 | The four mirrors read direction from `I18nManager.getConstants().isRTL` at render time (app code may import react-native; the value is constant within a process because crossing the boundary relaunches) | Planner | Step 2 |
| P14 | The physical window-space sites (overlay catchers, veil glow, Ramadan decorations) convert their `left:` absolutes to `transform: [{ translateX }]`, and the direction pin goes on each site's CONTAINING View (`direction: 'ltr'`), because the pinned Yoga resolves an inset-less absolute's insets and static position with the containing node's direction, never the node's own — without it the converted sites mirror to the right edge under RTL. At the five Ramadan sites already carrying an animated transform, the translateX joins that array as its first entry. Their allowlist entries leave the list, the Bar.tsx worklet entry stays with an updated reason | Planner, from the gate's design and the pinned Yoga anchoring | Step 2 |
| P15 | The widget direction field is a dedicated boolean `rtl?: boolean` on both prop shapes (versions 7 to 8 and 3 to 4): the stamp ships as schema groundwork, and the deferred 67 `locale` field, if it ever lands, keys off the same stamp without conflict | Planner, from D78's lesson (device locale is the wrong key) and 67's deferral | Step 3 |
| P16 | The Host wrap is blocked, not built: the pinned `@expo/ui` 58.0.14 `Host` compiles to `requireNativeView('ExpoUI', 'HostView')`, and the widget runtime renders no such node (iOS falls to `ViewRenderer.swift`'s default, a red box in DEBUG and `EmptyView` in release; Android prints `View not found`), so step 3 ships the `rtl` stamp alone, R5.2 is removed and recorded as blocked on the widget runtime, and step 4's widget screenshot becomes mandatory evidence of today's unstamped rendering | Planner, from the pinned runtime sources | Step 3, queue row |

### 2.2 The executor must not decide

- Whether `en`, `ms`, `so`, `hi` or `th` ever mirror: they never do; only
  `ar` is RTL in the shipped six.
- Any relaunch mechanism beyond P10, any seeding of direction state, any
  widget field shape beyond P15.
- Whether the deferred 67 work happens here: it does not; 67's folder and
  saved patch stay untouched.

## 3. Pre-flight

`scripts/preflight-68.sh`, committed in this folder. The executor saves a copy
to `$TMPDIR` and runs `bash $TMPDIR/preflight-68.sh` from the repository root.
It checks: `uat` checked out, clean tree, `origin/uat` merged in,
`package.json` at 2.0.141 or higher, row 67 still DEFERRED (the widget group
must stay free), and every anchor counting exactly 1. It ends `PREFLIGHT OK`.

## 4. Background the executor needs

The direction machinery, from the fact packs, verified against `61fb7675`:

- The switch flow: `components/sheets/screens/Language.tsx:44` calls
  `pickLanguage` (`languageSheet.ts:18-32`), which runs
  `commitLanguagePreference` (`stores/language.ts:55-64`): persist
  `preference_language`, `setActiveLocale`, `await
  reconcileLanguageSurfaces()` (`stores/language.ts:35-47`: channel-cache
  reset, one locked reschedule pass, last-armed stamp), busy false in
  `finally`. The D51 progress face (`languageCommitBusyAtom`) rides the busy
  flag; the restart must sit after the reconcile resolves so the face completes.
- The launch path: `app/_layout.tsx` imports `@/stores/bootstrap`
  synchronously before first render; `stores/bootstrap.ts` is the designed
  pre-render hook. Locale resolution is lazy at first `currentLocaleId()`
  (`shared/i18n/locale.ts:38-43`), reading `preference_language` raw
  (`:88-99`).
- The only reload in the repo: `components/ui/Error.tsx:26-34` —
  `Updates.reloadAsync()` from `expo-updates` (`~58.0.15`,
  `package.json:61`); its test mocks the module
  (`components/ui/__tests__/Error.test.tsx:6,13`).
- `I18nManager` at the pinned `react-native 0.88.0-rc.3`:
  `node_modules/react-native/Libraries/ReactNative/I18nManager.js` carries
  `allowRTL`, `forceRTL`, `swapLeftAndRightInRTL` (`:68`) and
  `getConstants().isRTL`. The auto-swap fires on remaining physical
  `left:`/`right:` style keys under RTL, which is why the P14 sites convert
  to transforms.
- The four mirror sites: the countdown tip worklet
  (`components/countdown/tipGeometry.ts:31-37`, called from
  `components/countdown/Bar.tsx:147-151`; tests
  `components/countdown/__tests__/tipGeometry.test.ts`), the
  SegmentedControl pill (`components/sheets/parts/SegmentedControl.tsx:131-138`
  plus the static transform at `:154`; tests at
  `components/sheets/parts/__tests__/SegmentedControl.test.tsx:72-121`), the
  toggle travel (`components/sheets/parts/Toggle.tsx:35-47`, the target
  constant `SIZE.toggle.translateX` at `shared/constants.ts:562`; tests at
  `components/sheets/parts/__tests__/Toggle.test.tsx:31-65`), and the qibla
  wave (`shared/qiblaWave.ts:41-49` `wavePoint`, `:65-73` `waveHeading`,
  `:81-85` `wavePath`, `:94-105` `waveTrail`; the screen
  `components/sheets/screens/QiblaWave.tsx:69-98`; tests
  `shared/__tests__/qiblaWave.test.ts`).
- The physical sites: the overlay catchers
  (`components/overlay/Overlay.tsx:105-113`, `left: region.left` inline;
  geometry from `pageX`/`pageY` window coordinates in
  `components/overlay/catcherGeometry.ts:42-51`), the veil glow
  (`components/overlay/VeilBackdrop.tsx:36-43`), and ten decorative
  absolutes in `components/ui/RamadanDecorations.tsx` (the nine allowlisted
  `left:` snippets at `scripts/directional-styles-allowlist.json:7-56` plus
  `left: 0, top: cloudTop` at `:49`).
- The 58a gate: `scripts/check-directional-styles.js` (banned patterns
  `:23-33`, scope `:20` excludes `widgets/`, test files skipped `:35,41`,
  one allowlist entry absorbs exactly one hit `:63-76`, stale entries fail
  `:78-91`); the allowlist is
  `scripts/directional-styles-allowlist.json` (21 entries, shrinking to 9
  after step 2: Bar plus the six catcherGeometry and two prose entries); the
  Jest guard is
  `shared/__tests__/directionalStyleGate.test.ts`.
- The widgets: `expo-widgets` and `@expo/ui` pinned exact `58.0.14`
  (`package.json:39,62`). `Host` is exported from both
  `@expo/ui/swift-ui` and `@expo/ui/jetpack-compose` (their build index files
  re-export `./Host`), and accepts
  `layoutDirection?: 'leftToRight' | 'rightToLeft'`
  (`@expo/ui/src/universal/Host/types.ts:50`), defaulting to the process
  I18nManager direction. iOS applies it through `LayoutDirectionModifier`
  (`@expo/ui/ios/HostView.swift:72,262-271`); Android through
  `CompositionLocalProvider(LocalLayoutDirection provides ...)`
  (`@expo/ui/android/src/main/java/expo/modules/ui/HostView.kt:138-144`).
  The widget layouts are already logical: Glance `contentAlignment
  centerStart/centerEnd` (`widgets/PrayerWidget.tsx:563-567`), SwiftUI
  `leading`/`trailing` padding (`widgets/PrayerWidget.tsx:786-792`,
  `widgets/LockPrayerWidget.tsx:250-275,493-505`). The intended direction
  vehicle, `Host`, cannot render in this runtime: `@expo/ui` 58.0.14's Host
  is `requireNativeView('ExpoUI', 'HostView')`
  (`node_modules/@expo/ui/build/jetpack-compose/Host/index.js:8`), the
  widget runtime turns an unknown native view into a plain node
  (`node_modules/expo-widgets/bundle/expo-stub.ts`), and the renderers reject
  it — iOS falls through `ViewRenderer.swift`'s `default:` (`:90-99`, a red
  box in DEBUG, `EmptyView()` in release) and Android returns
  `View not found` (`ExpoWidgetEmittableTree.kt:142-161`). P16 therefore
  ships the stamp alone and R5.2 is recorded blocked.
- The widget props contracts: `PrayerWidgetProps`
  (`shared/widgetTypes.ts:79-143`) and `PrayerWidgetAndroidProps`
  (`shared/widgetTypes.ts:210-234`) carry no direction field today;
  `WIDGET_PROPS_VERSION = 7` (`:14-21`) and `ANDROID_SNAPSHOT_VERSION = 3`
  (`:23-33`). The stamp sites: `makeEntry`'s props
  (`shared/widgetTimeline.ts:204-218`, `v` at `:207`), the stale terminal
  entry, and `buildPrayerWidgetSnapshot` (`:344-350`, `v` at `:345`). The
  version pin sites a bump touches: `widgetContract.test.ts:470,485`;
  `widgetTimeline.test.ts:295,1135` and the stale-entry whole-object
  assertion; `widgetSettingsSync.test.ts:351` (reads the constant);
  `widgetSnapshot.test.ts:175`; `widgetAndroid.test.ts:161`; the legacy
  literal fixtures (`widgetRenderer.test.ts:234,376,737`,
  `widgetLockRenderer.test.ts:114`) tolerate the field unchanged. The twelve
  `REAL_YEAR_TIMELINES` digests (`widgetSimulation.test.ts:684-699`, hashed
  at `:711-724`) change with any serialized field addition: re-gold per the
  table's own protocol, the v7 precedent (job 39 step 7).

Concurrency: the restart fires once per boundary crossing, from the commit
path after the reconcile lock releases; the widget stamp rides the existing
push path (main thread, before `updateTimeline`/`updateSnapshot`); the
bootstrap direction call runs at module evaluation before React renders. No
new timers, no new locks.

Proof (scratch worktree, deleted): the mirror math and the restart sequence
were proven as pure logic — `tipLeftForProgress(100, true)` returns the
left-clamped mirror of `(100)` under LTR; the segmented target
`(length - 1 - index) * 100` lands the pill on the visually mirrored segment;
the toggle target negates under RTL; the wave point negates x. The restart
order (persist, activate, reconcile, allowRTL, forceRTL, reload) was sequenced
against the existing `languageConvergence.test.ts` mocks with `expo-updates`
and `react-native`'s I18nManager mocked the Error.test.tsx way. The widget
Host wrap was proven structurally: the renderer suites return the same texts
under a `layoutDirection`-carrying Host wrapper.

## 5. Design

The approach: flip the native switch and own the direction explicitly at the
two moments that matter — launch (bootstrap) and boundary crossing (the
commit path) — mirror the four sites whose math has no logical form, convert
the window-space sites to swap-proof transforms, and carry the direction into
the widgets as data the Host applies.

The invariant, one sentence a test can check: under LTR every rendered
position and style, and every serialized field except the v8/v4 stamp, equals
`Planned at`; under RTL the named sites mirror, the P14 sites hold their
physical coordinates, every pushed widget blob carries `rtl`, and crossing
the boundary relaunches exactly once per crossing.

Alternatives rejected: reading direction inside worklets (worklets cannot
import react-native; the value passes in as a parameter, P13); converting the
P14 sites to logical keys (start/end re-mirror under RTL — the opposite of
physical); keying widgets off the device locale (D78's lesson: the device
key renders mixed cards); waiting for row 66's always-restart investigation
(it may absorb the D59 relaunch later, but the flip needs a correct restart
now).

**Acceptance criteria:**

- [R1.1] WHEN app.json is read THE SYSTEM SHALL carry the expo-localization plugin supportsRTL true
- [R1.2] WHILE the app bootstraps with a stored preference THE SYSTEM SHALL call I18nManager allowRTL true and forceRTL matching the stored locale's direction before first render
- [R2.1] WHEN commitLanguagePreference crosses the RTL boundary THE SYSTEM SHALL persist, activate and converge first, then allowRTL, forceRTL to the new direction, and relaunch via Updates reloadAsync
- [R2.2] WHEN commitLanguagePreference keeps the direction THE SYSTEM SHALL not call forceRTL or reloadAsync
- [R3.1] WHEN the countdown bar renders under RTL THE SYSTEM SHALL grow its fill from the trailing edge and place the tip by the auto-swapped offset, with no direction parameter in the geometry
- [R3.2] WHEN the SegmentedControl pill target is computed under RTL THE SYSTEM SHALL use the visually mirrored segment index
- [R3.3] WHEN the toggle thumb target is computed under RTL THE SYSTEM SHALL negate the on travel
- [R3.4] WHEN the qibla wave points are computed under RTL THE SYSTEM SHALL negate x
- [R4.1] WHEN the overlay catchers, veil glow or Ramadan decorations position under either direction THE SYSTEM SHALL place them at unchanged physical coordinates through transforms under a left-to-right containing view
- [R5.1] WHEN the app pushes an iOS widget entry or Android snapshot THE SYSTEM SHALL stamp rtl boolean on the props (schema v8 and v4)
- [R6.1] WHEN the directional-style gate runs THE SYSTEM SHALL report no remainder and no stale allowlist entries

## 6. Steps

Checklist:

1. Step 1 — the flip, the bootstrap direction, the boundary relaunch
   (`steps/1-flip-and-restart.md`)
2. Step 2 — the four mirrors and the swap-proof conversions
   (`steps/2-mirror-sites.md`)
3. Step 3 — the widget direction stamp (`steps/3-widget-direction.md`)
4. Step 4 — the 3T device proof (`steps/4-device-proof.md`)

Scope guard: the catalogs, the prayer-name strings, the width store and
ticket 67's folder are out; `widgets/LockPrayerWidget.tsx` changes only where
the Host wrap and the rtl read demand it.

## 7. Device proof

Step 4, the 3T mock build: switch en to ar in the language sheet, observe the
relaunch, verify the mirrored shell (countdown bar, a segmented control, a
toggle, the prayer list) through screenshots read per the device atlas, then
switch ar back to en and verify the restore. The widget face rides the D41
confidence build; the launcher widget screenshot under ar is recorded when the
mock build renders one.

## 8. Records

The findings text the executor appends to `LOG.md` under
`## Ticket 68 (2026-10-12)`:

```
The RTL flip landed: supportsRTL true, bootstrap applies the stored
direction before first render, crossing the RTL boundary converges then
relaunches (D59), the four no-logical-form sites mirror, the window-space
sites hold their coordinates through transforms, and every widget blob
carries rtl with the tree wrapped in Host layoutDirection (v8/v4).
```

The queue cell the lead applies on DONE:

```
DONE <date>, audited: supportsRTL flipped, direction forced at bootstrap and
at boundary crossings with a post-convergence relaunch (D59), the mirror
sites landed (the tip's mirror rides the layout swap), window-space sites
transform-pinned under LTR containing views, widget rtl field stamped
(v8/v4; the Host application recorded blocked on the widget runtime); LTR
byte-identical, proven on the 3T mock.
```

Docs commit message: `<VERSION> - docs(plans): ticket 68 READY: the RTL flip,
4 steps`.

## LOG.md ledger contract

Every step entry in `LOG.md` opens with the heading `### Step <NN> — <state>`
and ends with a line `session: <ses_id>`. Planning sections use
`## Planning (<date>)` and `## Ticket <N>`.

## 9. Push

None. The executor worker never pushes. The lead pushes after the reviews pass.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| The app relaunches on a same-direction switch | The boundary check compares locale ids instead of directions | Compare `localeDirection` values; en to ms must never restart |
| A jest suite fails on `Updates.reloadAsync` hanging | The mock does not resolve | Copy the Error.test.tsx mock shape; the switch test resolves it |
| The gate reports stale allowlist entries after step 2 | A converted site's entry stayed in the list | Remove the entries whose snippets no longer match; the Bar.tsx entry stays |
| A widget suite fails on an entry-shape `toEqual` after the stamp | The assertion pins the whole props object | Add `rtl: <the suite's direction>` to the expected object; the proof names the stale-entry assertion |
| A golden digest fails after the version bump | The `rtl` field changed the serialization | Re-gold per the table's own protocol; a received digest whose only delta is the field is expected, anything else is a STOP |
| The device will not mirror after the flip | The prebuild did not regenerate native config | The build script prebuilds; `app.json` bumps first per the version rule |

Anticipated review fixes, word for word:

- A docblock still saying the tip oval centers on `left`: rewrite to "the
  start edge".
- A test title still saying "right" for the on toggle under RTL: rewrite to
  "the leading side".
- The RamadanDecorations conversions missing one of the ten sites: the gate's
  remainder names it; convert it the same way.

Restore list: step 1 reverts `app.json`, `stores/language.ts`,
`stores/bootstrap.ts`, `shared/i18n/locale.ts`, `jest.config.js`,
`shared/__mocks__/expo-updates.ts`, `shared/__mocks__/react-native.ts`,
`stores/__tests__/rtlSwitch.test.ts`,
`stores/__tests__/bootstrap.test.ts` and `shared/__tests__/nativeConfig.test.ts`;
step 2 reverts
`components/countdown/tipGeometry.ts`, `components/countdown/Bar.tsx`,
`components/sheets/parts/SegmentedControl.tsx`,
`components/sheets/parts/Toggle.tsx`, `shared/qiblaWave.ts`,
`components/sheets/screens/QiblaWave.tsx`,
`components/overlay/Overlay.tsx`, `components/overlay/VeilBackdrop.tsx`,
`components/ui/RamadanDecorations.tsx`,
`scripts/directional-styles-allowlist.json` and their five test files; step 3
reverts `shared/widgetTypes.ts`, `shared/widgetTimeline.ts`,
`widgets/PrayerWidget.tsx`, `widgets/LockPrayerWidget.tsx` and the six pin
and digest suites named there.

## 11. Subagents

Planning: `explore` workers answer fact questions, `athan-plan-griller`
grills the draft. Delivery: the lead dispatches the `athan-executor` and
`athan-reviewer` workers. Every worker may call `vision` for an image it
cannot see. Nothing else, ever.

## 12. Report to the owner

Plain sentences on what changed and what was proven, the progress table, no
decisions waiting (D59, D60, D68 taken), the four-line handoff.
