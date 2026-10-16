# Ticket 123: Android widget refresh on OEMs: re-evaluate against SDK 58 stable

| Field | Value |
| --- | --- |
| Brief | Queue row 123: inventory today's Android widget refresh path end to end, test the owner's OEM out-of-sync recollection against the repo's own evidence, measure what SDK 58 stable changed in the widget runtime, and return one recommendation plus the device-proof design; she rules the scope after the inventory |
| Planned at | `8a44f0ab` 2.0.885, 2026-10-16 |
| Planned by | lane 123 (agent-ruled frontier, standing hands-off order 2026-10-16) |
| Needs first | nothing |
| Parent | nothing |
| Group | none (docs-only; the queue row and the two tracked version files, `package.json` and `app.json` with the main tree's gitignored `android/app/build.gradle` `versionName` kept in step, serialize as lane weather) |
| Batch budget | 3 weight units |
| Session budget | 3 weight units (one lane session carries all three docs steps) |
| Steps count | 3 (all weight 1, docs) |
| Device | none this wave (no device contact, no builds; the device wave waits on her scope ruling) |
| Owner decisions still needed | her scope ruling on section 5's options; the row's own ending |

## 1. Goal

The owner ordered this row at planning 111 (2026-10-16), on her walk through the SDK 58
changelog: re-evaluate the Android widgets' update reliability on OEMs now the full stable
release is in. Her recollection of the preview era, paraphrased: it worked, but on a subset of
OEMs a subset of widgets fell out of sync and stopped updating. The row orders an inventory
first and her scope ruling after it, and the row's own facts are that the repo carries a
refresh ground of its own (`modules/widgetrefresh`, landed as row 10's self-refresh), that the
WorkManager keeps the `app.json` R8 rules protect, and that `expo-widgets` 58.0.19 still
carries the openApp and device-locale patch row 111 rebuilt.

When DONE, the queue row carries: the refresh path mapped end to end with a citation for every
layer, the out-of-sync record separated into proven and recollected with the reading behind
each, the measured delta between the preview-era pins and the installed stable pins, one
recommendation with its rejected rivals, the device-proof experiment design with its drift
threshold, and the condition that wave waits on. Nothing outside `ai/plans/`, the queue row
and the two tracked version files changes before her word.

The owner's rules that govern, quoted:

- Row 123, the order: "then it device-proves each OEM phone and fixes what drifts. She rules
  the scope after the inventory".
- Row 123, her recollection: "RE-EVALUATE ... her recollection of the preview era: it worked,
  but on some OEMs some widgets fell out of sync and stopped updating".
- `ai/AGENTS.md:98`: "Visuals are settled. Fixes change behaviour only." A refresh fix changes
  behaviour, so no pixel moves with it.
- `ai/AGENTS.md:106-107`: "Ask first: installing dependencies, deleting non-empty files, MMKV
  schema keys, notification scheduling logic, `app.json` and `eas.json`." The `app.json` R8
  block is in the ask-first set.
- `ai/AGENTS.md:143-144`: "Local device builds go through `build-prod.zsh` and `build-mock.zsh`.
  Never run two at once." The device wave builds under `build.lock`.
- `ai/AGENTS.md:85`: "Never name a model in any file". This plan and its findings name work,
  never a model.

## 2. Decisions

### 2.1 Taken

| ID | Decision | Who | When | Recorded |
| --- | --- | --- | --- | --- |
| D123.1 | Evidence hierarchy: the repo's own device readings and commit messages first, the installed packages' source second, the installed package changelog third, an unverifiable claim last and marked recollected. Memory is never a source | agent-ruled | 2026-10-16 | here, section 4 |
| D123.2 | Proven versus recollected convention: a claim carrying a device reading, a commit message or a source line is "cited"; a claim with none is "recollected". The owner's 20 to 24 minute report is owner-reported, and the findings state which reading bounds it and which part is reproduced | agent-ruled | 2026-10-16 | here, section 5 and FINDINGS section 2 |
| D123.3 | The recommendation to her is option B, prove-then-fix (section 5), argued twice | agent-ruled | 2026-10-16 | here, section 5 |
| D123.4 | The deliverable folds into the queue row; no findings file survives DONE, because no shipped code or config would cite it. Precedent: rows 65, 66, 117, 118, 119 | agent-ruled | 2026-10-16 | here, section 8 |
| D123.5 | The lane executes all three docs steps itself; the grill and both audit reviewers are dispatched as workers | agent-ruled | 2026-10-16 | LOG.md; why: the three steps are measurement and writing with no red-green code loop, and the lane already holds the measurements from planning, while the grill and the blind audit are exactly the worker jobs that add rigor |
| D123.6 | The drift threshold for the future wave: drift is the widget's shown countdown minus the true minute-ceil remaining, in whole minutes; plus 0 and plus 1 pass, plus 2 or more fails, a frozen label fails. Readings are taken on wake from a screen-off window of at least 10 minutes, on a discharging unplugged phone | agent-ruled | 2026-10-16 | here, section 7 |
| D123.7 | The patched runtime is cited by its two feature hunks (openApp, `__expoWidgetDeviceLocale`), never by line number, because row 111 rebuilds `patches/expo-widgets+58.0.19.patch` mid-flight and line numbers in it are lane weather | agent-ruled | 2026-10-16 | here, section 4 |
| D123.8 | The device wave covers all four phones the row names. If the 3T is absent (row 54 records the owner without access to it on 2026-10-14), the wave records it absent and proves the other three, because the Find X8 carries the OEM reports | agent-ruled | 2026-10-16 | here, section 7 |

### 2.2 The executor must not decide

- `require('expo-widgets/package.json').version` answering other than 58.0.19, or `expo`
  answering other than 58.0.12: STOP. Row 111 moved the pins; the lead re-verifies the delta
  table against the new pin before any further step.
- `git log --oneline 2014efad..uat -- modules/widgetrefresh` printing any line: STOP. The
  refresh chain moved; the lead re-verifies the inventory against the new code. This is the
  one anchor of this ticket that a sibling lane can move.
- Any command printing something FINDINGS.md does not predict: STOP and report the exact
  divergence. Never widen the reading list to chase it.
- A live reading at 20 minutes of drift or more: STOP and report. That is the owner's reported
  magnitude; a defect opens its own wave with her ruling, never a silent re-scope of this one.
- A live reading at plus 2 to plus 19 minutes: record it, and never widen this wave into a fix.

## 3. Pre-flight

`scripts/preflight-123.sh`, saved to `$TMPDIR` and executed from the worktree root
(`bash "$TMPDIR/preflight-123.sh"` with the working directory at the worktree root). It
checks: the worktree is on `lane/123` with a clean tree, `origin/uat` is fetched, the merge
base against the local `uat` ref (the integration branch holding the unpushed audited
commits) is at or past `8a44f0ab`, `package.json` is not lower than 2.0.885, every anchor
under `scripts/anchors/` counts exactly 1 in its source file, the installed `expo-widgets` is
58.0.19 and `expo` is 58.0.12 (the row's premise, that SDK 58 stable is in), and
`git log --oneline 2014efad..uat -- modules/widgetrefresh` is empty (the refresh chain is
still frozen at 1.28.25). It ends `PREFLIGHT OK`.

## 4. Background the executor needs

Files this row reads. None of them changes outside the plan folder, the queue row and the two
tracked version files.

Repository code, with the anchor that holds it:

- `stores/widget.ts` - the JS push layer. `refreshPrayerWidgets` (anchor
  `js-refresh-entry.txt`) has one platform branch: on Android it pushes both schedules'
  snapshots and then calls `armWidgetRefreshChain()`; on iOS it pushes both schedules'
  timelines. `scheduleLabelFlipReload` (anchor `js-flip-chain.txt`) arms one timer per
  schedule that reloads the four Android home kinds at each minute flip while the countdown
  target is ahead, and re-pushes when it has passed. `pushScheduleAndroid` (anchor
  `js-android-push.txt`) builds the snapshot, stamps theme and size per kind, and hands the
  flip target to the timer. `reloadAndroidKinds` (:306-310) calls `kind.widget.reload()`.
- `modules/widgetrefresh/index.ts` - the JS binding (anchor `module-doc.txt`). One call
  starts three revivers; the native module is Android-only and resolves to null elsewhere.
- `modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/WidgetRefreshScheduler.kt`
  - the native cadence. `updateAll` (anchor `kt-update-all.txt`) broadcasts
  `ACTION_APPWIDGET_UPDATE` to every placed home kind, then repeats it 2500 ms later, because
  Glance's update path composes only when a session is already running. `armNext` (anchor
  `kt-arm-next.txt`) arms one exact alarm 500 ms past the next wall minute and re-arms itself
  from the receiver. `ensureArmed` (:162) arms unconditionally. `ensureWatchdog` (:173)
  enqueues one unique 15-minute periodic WorkManager job under `ExistingPeriodicWorkPolicy.KEEP`.
  `hasPlacedWidgets` (:83) gates every layer on the eight home kinds. `patchCompositionSize`
  writes the size and granted width into the stored props before each render.
- `modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/WidgetRefreshWatchdogWorker.kt`
  - the watchdog body (anchor `kt-watchdog.txt`): re-arm, never render.
- `modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/WidgetRefreshSystemListener.kt`
  - the process-bound listener (anchor `kt-listener.txt`) on `ACTION_TIME_TICK` and
  `ACTION_SCREEN_ON`, registered at runtime because Android refuses both to manifest
  receivers. Its body is one guarded redraw and no re-arm, because a re-arm from the tick
  pushes the pending alarm forward forever.
- `modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/WidgetRefreshModule.kt`
  - `OnCreate` claims the system listener with the process (anchor `kt-module.txt`), and
  `armWidgetRefreshChain` arms the alarm, the watchdog and the listener.
- `modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/WidgetRefreshReceiver.kt`
  and `WidgetRefreshBootReceiver.kt` - the minute-edge receiver re-arms the alarm and
  re-claims the system listener; the boot receiver re-arms on `BOOT_COMPLETED` and
  `MY_PACKAGE_REPLACED`.
- `modules/widgetrefresh/android/src/main/AndroidManifest.xml` - declares the minute receiver
  (not exported) and the boot receiver (exported, with both intent filters).
- `app.json` - the R8 keeps (anchor `appjson-r8.txt`) carried as
  `expo-build-properties.android.extraProguardRules`, and the `expo-widgets` plugin entry at
  :218-399 declaring the eight home kinds and the six iOS lock kinds.
- `patches/expo-widgets+58.0.19.patch` - five file diffs: the openApp button action
  (`ExpoWidgetEmittableTree.kt`, `WidgetButtonProps.openApp`) and the device-locale injection
  (the C++ render signature, `WidgetsJSRuntime.kt`, `WidgetsHermesRuntime.kt`,
  `WidgetsJSRuntime.swift`). Cited by hunk feature, never by line (D123.7).
- `stores/sync.ts` (:229-260, :520-546) and `stores/notifications.ts` (:1551-1630) - the
  triggers that reach `refreshPrayerWidgets`: launch and foreground sync, the 3-hour
  background task, and every notification reschedule.
- `android/app/src/main/AndroidManifest.xml` (:43-105) - the eight generated widget providers,
  each carrying `APPWIDGET_UPDATE` and the interaction action. A prebuild output, gitignored
  and absent from the worktree; the main tree's copy at `uat` is the one to read.

Installed packages, cited by path and line in FINDINGS (never anchored, because `node_modules`
is not versioned):

- `node_modules/expo-widgets/src/Widgets.ts` (:45-73) - the JS widget API: `reload()`,
  `updateTimeline()` (iOS only) and `updateSnapshot()` (Android; iOS maps it onto a
  one-entry timeline).
- `node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/WidgetObject.kt` -
  `updateSnapshot` stores the props and calls `reload`; `reload` calls
  `WidgetsUpdater.reload`.
- `node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/WidgetsUpdater.kt` -
  a mutex-guarded launch on `Dispatchers.Default` that calls `ExpoWidgetsPeekWidget.refresh`
  for every placed id.
- `node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/ExpoWidgetsAppWidgetProvider.kt`
  and `ExpoWidgetsPeekWidget.kt` - the generated provider's `onReceive` passes anything that is
  not an interaction to `GlanceAppWidgetReceiver`; `provideRoot` reads the stored layout and
  props and renders through the Hermes runtime.
- `node_modules/expo-widgets/android/build.gradle` - `androidx.glance:glance:1.2.0`,
  `work-runtime-ktx:2.9.1`, `io.github.expo.peek:peek-emittables:0.3.2`,
  `consumerProguardFiles("proguard-rules.pro")`.
- `node_modules/expo-widgets/android/proguard-rules.pro` - two keeps shipped by the library:
  `RoomDatabase` and `InputMerger` subclasses.
- `node_modules/expo-widgets/CHANGELOG.md` - the 58.x entries.

How the pieces interact. Two independent render drivers reach the same eight providers. The
native chain (alarm, watchdog, system listener, boot receiver) runs with no JS at all: the
alarm fires 500 ms past each wall minute, the receiver broadcasts `ACTION_APPWIDGET_UPDATE`
twice, and each Glance provider recomposes from the stored props, which hold absolute epochs,
so the countdown recomputes at render time. The JS chain runs only while the app process
lives: every push rewrites the snapshot and then reloads the kinds at each minute flip. The
two agree because both read the same stored props.

Why the obvious fix is wrong. Switching the label to a launcher-drawn `Chronometer` was
approved by the owner in the preview era and then withdrawn on measurement (the deleted
`ai/plans/25-android-widget-drift` record, its FINDINGS section 6): a Chronometer ticks a frozen target and cannot roll onto the next
prayer, which is the same failure one prayer later, and it costs the `6h 8m` format. The chain
is what to fix, never the label.

One shipped reason is already known stale. The `updateAll` comment justifies the second
broadcast with "Glance's own update path ... when no session is running it starts one and
returns WITHOUT composing". The same session's later measurement (`MEASURED-DRIFT.md`, the
ruled-out table) refutes that reason: the session's `_isOpen` initialises true, `wasOpen=false`
is the normal post-timeout log line, and the failure it actually measured is the launcher
holding no host callbacks while the screen is off. So the second pass may still help, but not
for the reason the code states, and the wave re-measures it.

## 5. Design

The inventory frame, one table in FINDINGS: for each layer, the trigger that arms it, the
cadence, the window it covers, and what happens when it is lost. The delta frame: for each
widget-runtime fact, the preview-era value against the installed value, cited from
`package.json` at the two `uat` shas and from the installed source.

The options for her ruling:

- **Option A, status quo.** The chain is unchanged since 1.28.25 and carries device proof from
  the preview era. Re-verify nothing, change nothing. Cheapest, and it leaves the two open
  readings from the widget-drift session exactly as they are: the screen-wake fix was never A/B-proven in
  production, and no reading exists on the stable pins or on two of the four fleet phones.
- **Option B, prove then fix (recommended).** Install the stable build on each fleet phone and
  run the drift protocol of section 7 in the worst state (unplugged, discharging, screen off
  for at least 10 minutes, read on wake), record every reading, and fix only what fails the
  threshold. Two candidate fixes are held in reserve and land only on a failing reading: (1)
  the double broadcast is re-measured against expo-widgets 58.0.11's "Fix update during active
  Glance sessions", because the workaround was written against 58.0.3 and may now be one pass
  too many; (2) the `app.json` R8 keeps are re-measured beside the library's own consumer
  rules, which now cover the two classes the preview-era strip broke. The `app.json` edit is
  ask-first (`ai/AGENTS.md:107`), so it lands only with her word.
- **Option C, harden now.** Add refresh insurance without a device reading: a second watchdog
  cadence, a foreground-service tick, or a `Chronometer` label. Rejected on the record: the
  Chronometer was withdrawn on measurement, a second watchdog does not beat the platform's own
  15-minute floor, and a background service is a battery and store-review cost with no reading
  behind it. Hardening without a measurement is how the preview-era regression (the tick
  listener re-arming the alarm forward forever, the widget-drift session's section 14) reached a
phone.

The recommendation argued twice. For B: every layer of the chain is already in place, the
evidence says the preview-era defects were fixed and re-measured on real hardware, and the
only unknowns left are exactly the ones a reading answers (the stable pins, two untested
phones, the worst state, and whether the two reserve fixes are still needed). The cost is one
build and one sampling session per phone, no code change on a pass. Challenge: does a
prove-then-fix wave just repeat work the preview era already did? Partly, and that is the
point of the row: the delivery path changed under the chain (expo 58.0.6 to 58.0.12,
expo-widgets 58.0.14 to 58.0.19, the R8 consumer rules), and the preview-era
readings were taken on a different runtime. B survives. Flipped-argument check on the
strongest rival, A: A is honest about the evidence and costs nothing, but it leaves the row's
second half ("then it device-proves each OEM phone and fixes what drifts") unexecuted, and
the owner's recollection is a symptom report with no reading on the current build. B stands.

**Acceptance criteria:**

- [R1.1] WHEN the executor reads `stores/widget.ts` THE SYSTEM SHALL record every call site that reaches `refreshPrayerWidgets`, each cited by `path:line`, in FINDINGS.md section 1.
- [R1.2] WHEN FINDINGS.md section 1 is read THE SYSTEM SHALL name each of the four native layers (the exact alarm, the 15-minute WorkManager watchdog, the runtime minute and screen listener, the boot and package-replaced receiver) with its trigger, cadence and the window it covers.
- [R1.3] WHEN the executor reads `WidgetRefreshScheduler.updateAll` THE SYSTEM SHALL record the two-pass broadcast, the 2500 ms gap and the Glance session reason that comment gives, and record whether the repository's own later evidence supports that reason, cited by the recovered path.
- [R1.4] WHEN the executor reads `WidgetObject.kt` and `WidgetsUpdater.kt` THE SYSTEM SHALL record the Android JS path from `updateSnapshot` through `reload` to `ExpoWidgetsPeekWidget.refresh`, cited by path and line.
- [R2.1] WHEN the executor reads the out-of-sync evidence THE SYSTEM SHALL record the 3T frozen-label reading, the Find X8 three-widget disagreement, the Find X8 on-wake reading, and the ColorOS alarm-window readings, each cited to a commit sha, a source path or a recovered plan-folder path.
- [R2.2] WHEN FINDINGS.md section 2 is read THE SYSTEM SHALL mark the owner's 20 to 24 minute report as owner-reported, name the readings that bound it, and state which part the repository reproduced and which part it did not.
- [R2.3] WHEN the executor runs `git log --oneline 2014efad..uat -- modules/widgetrefresh` THE SYSTEM SHALL record the empty output as the proof that the refresh chain is unchanged since 1.28.25, quoted with the command.
- [R3.1] WHEN the executor reads `node_modules/expo-widgets/CHANGELOG.md` THE SYSTEM SHALL list every Android entry from 58.0.14 to 58.0.19 with its version, and record that none of them changes the alarm, receiver or watchdog path.
- [R3.2] WHEN FINDINGS.md section 3 is read THE SYSTEM SHALL record the preview-era pins beside the installed pins, cited from `package.json` at `840aa613` and at `8a44f0ab`.
- [R3.3] WHEN the executor reads `node_modules/expo-widgets/android/proguard-rules.pro` THE SYSTEM SHALL record the two keeps it ships and compare them with the `app.json` `extraProguardRules` block, naming which classes each covers.
- [R4.1] WHEN the queue row is updated at DONE THE SYSTEM SHALL carry the inventory summary, the single recommendation with its rejected rivals, the experiment design with the drift threshold, and the condition the device wave waits on.

## 6. Steps

Checklist (all three inline in this file; the ledger in `LOG.md`):

- [x] Step 1 the refresh-path inventory (R1.1 to R1.4)
- [x] Step 2 the out-of-sync evidence and the SDK 58 stable delta (R2.1 to R2.3, R3.1 to R3.3)
- [x] Step 3 the recommendation and the experiment design (R4.1)

### Step 1 - the refresh-path inventory

Requirements: R1.1, R1.2, R1.3, R1.4
Weight: 1
Anchor check: all ten anchors count 1 (the pre-flight covers them).
Goal: FINDINGS.md section 1 written as the layer table plus the call-site list, every line cited.
Branch: `docs/123-1-inventory` off `lane/123`. Files: `ai/plans/123-android-widget-refresh/FINDINGS.md`
(section 1 refined in place from the READY-committed draft), `ai/plans/123-android-widget-refresh/LOG.md`,
`ai/plans/README.md` (status IN PROGRESS, step 1), plus the two tracked version files under the lock.
Red tests: none, a docs step; the check is the criteria below.
Change contract: read the seven repository files of section 4 and the four installed
expo-widgets sources; write section 1 as a table with one row per layer: layer, file, trigger,
cadence, window covered, what is lost when it does not run.
Green run: every row carries a `path:line` citation and every citation greps back.
Break script: none, a docs step with no code to break.
Version and commit: next patch after `uat`'s `package.json` under the version lock, message
`<VERSION> - docs(plans): ticket 123 step 1, the refresh path end to end`.
Review: read the diff cold against the sources.
Merge: `--no-ff` into `uat` under the `uat` lock.
Done when: R1.1 to R1.4 hold.

### Step 2 - the out-of-sync evidence and the SDK 58 stable delta

Requirements: R2.1, R2.2, R2.3, R3.1, R3.2, R3.3
Weight: 1
Anchor check: all ten anchors count 1.
Goal: FINDINGS.md sections 2 and 3 written, every claim cited or marked recollected.
Branch: `docs/123-2-evidence` off `lane/123`. Files: FINDINGS.md sections 2 and 3, LOG.md,
`ai/plans/README.md` (step 2), plus the two tracked version files under the lock.
Change contract: recover the deleted widget-drift evidence with
`git show eb86b063^:ai/plans/25-android-widget-drift/<file>` for `MEASURED-DRIFT.md`,
`FINDINGS.md` and `GLANCE-ROOT-CAUSE.md`; record the readings with their direction and their
magnitude; tag every line cited or recollected; then read the installed `expo-widgets`
changelog, `build.gradle` and `proguard-rules.pro`, and record the pin table from
`git show 840aa613:package.json` against the worktree's `package.json`. One commit carries both
subjects because both are reading-only notes about the same build pair, taken and written in
one sitting.
Green run: every FINDINGS claim in sections 2 and 3 carries a citation tag, and
`git log --oneline 2014efad..uat -- modules/widgetrefresh` prints nothing.
Break script: none.
Version and commit: as step 1, message
`<VERSION> - docs(plans): ticket 123 step 2, the out-of-sync evidence and the stable delta`.
Review: read the diff cold against the recovered files and the installed sources, one citation
at a time.
Done when: R2.1 to R2.3 and R3.1 to R3.3 hold.

### Step 3 - the recommendation and the experiment design

Requirements: R4.1
Weight: 1
Anchor check: all ten anchors count 1.
Goal: FINDINGS.md sections 4 and 5 written, and the queue row set EXECUTED with its outcome text.
Branch: `docs/123-3-recommendation` off `lane/123`. Files: FINDINGS.md sections 4 and 5, LOG.md,
`ai/plans/README.md` (EXECUTED, the outcome text), plus the two tracked version files under the lock.
Change contract: write the residual-gap list with one line per unknown and what measures it;
write the three options with the recommendation argued twice; write the experiment design as
the per-phone protocol, the drift threshold of D123.6, the states to sample, the evidence to
save, and the condition the wave waits on.
Green run: the row text carries the options, the recommendation and the wait condition.
Break script: none.
Version and commit: as step 1, message
`<VERSION> - docs(plans): ticket 123 executed: the inventory, the recommendation, the device-wave design`.
Review: read the diff cold against the sources and against section 7's protocol.
Finishing: set EXECUTED, the executed docs commit, merge `--no-ff`, no push.

## 7. Device proof

None this wave. The row's constraint is no device contact and no builds. The design the future
wave executes, recorded here so her ruling has a cost beside it:

- Build: `build-prod.zsh` under `build.lock`, one build for the whole wave, installed on each
  phone with `adb -s <SERIAL> install -r`, after `aapt2 dump badging` confirms the production
  package id. Never two builds at once.
- Phones: the 3T (`3T_SERIAL`, Android 9), the Find X8 (`X8_SERIAL`, ColorOS), the S23
  (`S23_SERIAL`, One UI) and the 8T (`8T_SERIAL`, OxygenOS). D123.8 governs an absent phone.
- Protocol per phone: place one home widget of each theme and size; unplug the phone; leave the
  screen off for a window of at least 10 minutes; wake it and read the widget within three
  seconds; compute drift as `shown minus ceil(true remaining in minutes)` from the device clock
  read in the same second. Repeat across at least three minute edges and one prayer rollover.
  The reading method and the screen-off requirement come from the recovered
  `MEASURED-DRIFT.md`. The sampler it used is a deleted path; recover it with
  `git show eb86b063^:ai/plans/25-android-widget-drift/scripts/drift-sampler.sh`.
- States to sample: screen on and off, discharging unplugged, one force-stop recovered by an
  app open, one reboot, and one overnight idle window.
- Threshold (D123.6): plus 0 and plus 1 pass; plus 2 or more fails; a label frozen across two
  minute edges fails; a widget that stops rolling onto the next prayer fails.
- Evidence per reading: the device clock, the widget's shown value, the computed true value,
  `dumpsys alarm` for the refresh chain, `dumpsys activity broadcasts` for the listener, and
  the logcat line that shows the render. Saved under `$HOME/athan-gitree/sessions/123/`, never
  committed.
- Readings to take for the two reserve fixes: with the chain running, count compositions per
  minute with one broadcast against two, to test whether expo-widgets 58.0.11 made the second
  pass redundant; and, on a release build with the `app.json` keeps removed in a scratch
  branch, whether the library's consumer rules alone keep the widget off its loading layout.
- Waits on: her scope ruling (option A, B or C), the build bay free of `build.lock`, and the
  phones' presence.

## 8. Records

- `LOG.md`: every step entry opens `### Step <NN> — <state>` and ends `session: <id>`; planning
  sections use `## Planning (2026-10-16)` and `## Ticket 123`.
- The queue cell the lead applies on DONE (draft, refined by what execution measured):
  `DONE 2026-10-16, audited: the widget-refresh investigation answers and folds here, its
  folder closed - the refresh path mapped end to end (the JS push and per-minute flip chain in
  stores/widget.ts; the native exact-alarm tick, the 15-minute WorkManager watchdog, the
  runtime TIME_TICK and SCREEN_ON listener and the boot receiver in modules/widgetrefresh),
  the out-of-sync record separated into cited and recollected (the 3T frozen-label reading at
  1 minute of error per suspended minute under force-stop, reaching plus 47 while frozen on the
  pre-1.28.21 build; the Find X8 three-widget disagreement at plus 6, plus 3, plus 1 on the old
  build; the on-wake plus 1 minute; the ColorOS alarm window at 25 to 34 seconds; the owner's
  20 to 24 minute report owner-reported and matched only by an artificial force-stop, never by
  an OEM action on a build from 1.28.21 onward, whose worst reading is plus 7 on the 3T and
  plus 2 on the Find X8), and the SDK 58 stable delta measured (expo 58.0.6
  to 58.0.12, expo-widgets 58.0.14 to 58.0.19; no upstream entry changes the alarm, receiver
  or watchdog path; 58.0.11's Glance-session update fix postdates the double-broadcast
  workaround and 58.0.16 ships the R8 consumer rules the app.json block was written for). The
  chain is unchanged since 1.28.25 and no reading exists on the stable pins, on the 8T or the
  S23, or in the worst state. Recommendation: option B prove-then-fix with the two reserve
  fixes held. The device-wave design: one `build-prod.zsh` build under build.lock, installed on
  the 3T, 8T, S23 and Find X8; per phone, widgets placed, unplugged and discharging, screen off
  at least 10 minutes, read within 3 seconds of waking; drift is shown minus the true
  minute-ceil remaining, plus 0 and plus 1 pass, plus 2 or more fails, a frozen label fails; a
  genuine 20 minute reading STOPs. The full protocol sits at
  `git show <the executed docs sha>:ai/plans/123-android-widget-refresh/PLAN.md` section 7.
  No code changed.` 
- Docs commit messages: per step, `<VERSION> - docs(plans): ticket 123 ...` as section 6 gives them.

## 9. Push

None. The lane never pushes; the orchestrator pushes `uat` when every unpushed commit is audited.

## 10. When something goes wrong

| Symptom | Action |
| --- | --- |
| `expo-widgets` or `expo` resolves to a new pin | STOP per 2.2; the lead re-verifies the delta table, then continues |
| `git log 2014efad..uat -- modules/widgetrefresh` prints a line | STOP per 2.2; the lead re-verifies the inventory against the moved chain |
| `git show eb86b063^:ai/plans/25-android-widget-drift/MEASURED-DRIFT.md` prints nothing | The recovery sha moved; STOP and report, never reconstruct a reading from memory |
| A live reading shows drift at plus 2 or more | Record it; at 20 minutes or more STOP and report; never widen this wave into a fix |
| The pre-commit hook's `Tests:` line missing or coverage below 100 | Never commit; investigate the hook log first |
| Merge conflict on `ai/plans/README.md` or the two tracked version files | Lane weather: abort, rebase onto uat, keep both lanes' rows and the higher version, retry once, then STOP if it still conflicts |

Anticipated review fixes, word for word: none expected beyond records wording; any finding
lands in `AUDIT.md` with its verdict.

Restore lists: every step's diff touches only `ai/plans/123-android-widget-refresh/`, the queue
row and the two tracked version files on its own branch; `git checkout lane/123 -- .` inside the
worktree restores the prior state, and an unmerged branch deletes with `git branch -D`.

## 11. Subagents

Planning: fact questions were measured directly by the lane (the sources are the primary
evidence); `athan-plan-griller` grills this draft cold. Delivery: the lane executes all three
docs steps itself (D123.5), recorded in LOG.md; the audit dispatches one `athan-reviewer` blind
(the diff plus `ai/AGENTS.md`, every number re-measured) and one `athan-reviewer`
plan-conformance (this folder plus the diff). `vision` is not needed; no image arises.

## 12. Report to the owner

Plain sentences: the investigation maps the refresh path end to end and finds it unchanged
since 1.28.25, with its device proof taken on the preview pins; her out-of-sync recollection is
half-proven, because the 3T freeze and the Find X8 three-widget disagreement are measured and
cited while the 20 to 24 minute magnitude was never reproduced; SDK 58 stable changed nothing in
the alarm, receiver or watchdog path, and the two runtime facts that did move (the Glance
session fix, the R8 consumer rules) make the repo's own workarounds worth re-measuring, not
worth changing on trust. The recommendation is option B, prove-then-fix on all four phones in
the worst state, with the two reserve fixes held until a reading calls for them; nothing
changes until her word. Then the progress table, then the handoff block the lane's final
return carries.
