# Findings 123: the Android widget refresh path, the OEM out-of-sync record, the SDK 58 stable delta

Draft committed at READY and refined in place by steps 1 to 3. Every claim carries one of two
tags. **Cited** means a device reading, a commit message or a source line backs it, and the
citation sits beside it. **Recollected** means nothing in the repository backs it.

Planned at `8a44f0ab` 2.0.885, 2026-10-16. Sources: the working tree, git history, and the
installed `node_modules` of the lane worktree.

## 1. The refresh path end to end

### 1.1 Two render drivers, one stored snapshot

Android widgets are pushed as a snapshot, not a timeline (`stores/widget.ts:258-263`). A push
stores one props blob per kind and every render recomputes the label from the absolute epochs
inside it, so a render is always current and an old snapshot of current data renders
correctly. Two drivers then trigger those renders.

- The **JS driver** runs only while the app process lives. `refreshPrayerWidgets`
  (`stores/widget.ts:237-256`) pushes both schedules, then calls `armWidgetRefreshChain()`.
  `scheduleLabelFlipReload` (`:319-337`) keeps one timer per schedule: at each minute flip
  while the countdown target is ahead it calls `reloadAndroidKinds` (`:306-310`), which calls
  `kind.widget.reload()` on the four home kinds; when the target has passed it re-pushes.
- The **native driver** runs with no JS at all. `WidgetRefreshScheduler.armNext`
  (`WidgetRefreshScheduler.kt:186`) arms one `setExactAndAllowWhileIdle` alarm 500 ms past the
  next wall minute on `RTC_WAKEUP`; `WidgetRefreshReceiver.onReceive` (`:12`) redraws and
  re-arms; `WidgetRefreshSystemListener.kt:39-61` redraws on `ACTION_TIME_TICK` and
  `ACTION_SCREEN_ON`; `WidgetRefreshWatchdogWorker.kt:21-26` re-arms every 15 minutes;
  `WidgetRefreshBootReceiver.kt:12-26` re-arms on boot and package replace.

### 1.2 The layer table

| Layer | File | Trigger | Cadence | Window it covers | Lost when it does not run |
| --- | --- | --- | --- | --- | --- |
| Exact alarm tick | `WidgetRefreshScheduler.kt:186-208` | `armWidgetRefreshChain` (a push), the receiver, the watchdog, boot | one exact alarm per wall minute, plus 500 ms | everything, while alarms are delivered | the label freezes until another layer fires |
| Minute receiver | `WidgetRefreshReceiver.kt:12-27` | the alarm | per minute | redraw and re-arm | the chain ends at the next minute |
| WorkManager watchdog | `WidgetRefreshScheduler.kt:173-183`, `WidgetRefreshWatchdogWorker.kt` | enqueued with the chain; `KEEP` policy | 15 minutes, the Android floor | an alarm lost to a low-memory kill | the alarm stays lost until an app open or a reboot |
| System listener | `WidgetRefreshSystemListener.kt:39-61` | `WidgetRefreshModule` `OnCreate` (`:16-19`), the receiver, the boot receiver | `ACTION_TIME_TICK` per minute, `ACTION_SCREEN_ON` on wake | the minute while the screen is on, and the first frame after a wake | the widget shows the last composition on wake |
| Boot receiver | `WidgetRefreshBootReceiver.kt:12-26` | `BOOT_COMPLETED`, `MY_PACKAGE_REPLACED` | per event | alarms and WorkManager jobs lost to a reboot or an update | the chain stays dead until an app open |
| JS push | `stores/widget.ts:237-256` | launch, foreground sync, the 3-hour background task, every notification reschedule | per event | fresh data, and the props rewrite | the widget keeps the last pushed snapshot |
| JS flip reload | `stores/widget.ts:319-337` | the push's flip target | per minute while the process lives | the minute, with no native alarm at all | the native layers cover it |

### 1.3 Where the pushes come from

`refreshPrayerWidgets` is reached from `stores/sync.ts:253` and `:259` (launch, foreground and
the background task, deferred or awaited), from `stores/notifications.ts:1616` and `:1627`
(after every notification reschedule, deferred or awaited), and twice inside its own module:
`stores/widget.ts:135` (the settings-change debounce) and `:335` (the flip chain re-pushing
once the countdown target has passed). `sync` is the loadable launch path (`stores/sync.ts:47`).
A widget-visible setting change re-pushes through `initWidgetSettingsSync`
(`stores/widget.ts:124-140`), debounced 1000 ms.

### 1.4 The Android JS render path

`updateSnapshot` (`node_modules/expo-widgets/src/Widgets.ts:67-73`) is Android-only in effect.
`WidgetObject.updateSnapshot` stores the props under `__expo_widgets_<name>_props` and calls
`reload`; `reload` calls `WidgetsUpdater.reload`; `WidgetsUpdater.reload` takes a mutex on
`Dispatchers.Default` and calls `ExpoWidgetsPeekWidget.refresh` for every placed id
(`node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/WidgetsUpdater.kt:20-28` and `:42-50`).
`reload()` from JS takes the same route with no props write (`WidgetObject.kt:21-23` and `:25-28`).

The native tick instead sends `ACTION_APPWIDGET_UPDATE` per kind
(`WidgetRefreshScheduler.kt:139-152`); the generated provider passes anything that is not an
interaction to `GlanceAppWidgetReceiver` (`ExpoWidgetsAppWidgetProvider.kt:13-21`).

### 1.5 Two shipped reasons are already known stale

`updateAll`'s comment (`WidgetRefreshScheduler.kt:118-131`) justifies its second broadcast
with "Glance's own update path ... when no session is running it starts one and returns WITHOUT
composing". The repository's own later measurement refutes that reason: see 2.4.

`WidgetRefreshModule`'s comment (`WidgetRefreshModule.kt:17-20`) says the watchdog "is what
survives an OEM force-stop". The repository's own later measurement refutes that too: a
force-stopped app sits in Android's stopped state, which runs none of its jobs and delivers it
no broadcasts, so the watchdog cannot fire there either (recovered `FINDINGS.md` section 12,
re-measured in `MEASURED-DRIFT.md`). The watchdog's real window is a process killed without the
stopped flag, such as a low-memory kill. The layer table in 1.2 records the true window.

## 2. The out-of-sync record: cited and recollected

Evidence is recovered from the deleted plan folder `ai/plans/25-android-widget-drift/`, removed
by the deep clean at `eb86b063` (2026-10-08). Recovery command, one file at a time:
`git show eb86b063^:ai/plans/25-android-widget-drift/MEASURED-DRIFT.md`.

### 2.1 Cited readings

| Reading | Value | Build | Citation |
| --- | --- | --- | --- |
| 3T, force-stopped, label watched across three minute edges | `1h 54m` held while the truth walked `1h 53m` to `1h 51m`: one minute of error per suspended minute, always too much time remaining | 1.28.14 era | recovered `FINDINGS.md` section 2; the mechanism shipped as `6909abba` (1.28.17) and `85a837d8` (1.28.18) |
| Find X8, three widgets on one prayer, read in one dump | `5h 17m`, `5h 14m`, `5h 12m` against a true `5h 11m`: plus 6, plus 3, plus 1, disagreeing with each other | 1.27.384, old build | recovered `FINDINGS.md` section 13 |
| 3T, force-stop, pre-1.28.21 | the label drifted to plus 8, then to plus 47 while frozen | 1.28.20 | recovered `GLANCE-ROOT-CAUSE.md:128` and `:160` |
| 3T, backgrounded, 8-minute watch | plus 2, exact, exact, plus 2, exact, plus 2, plus 5: intermittent, accumulating between lucky ticks | 1.28.20 | recovered `GLANCE-ROOT-CAUSE.md` |
| 3T, controlled broadcast experiment | one tick left the label 8 minutes stale; two broadcasts three seconds apart corrected it to exact | 1.28.20 | recovered `GLANCE-ROOT-CAUSE.md`; shipped as `11d6584e` (1.28.21) |
| Find X8, ColorOS alarm dump | the exact alarm carries a window and an app-standby push: `window=+32s197ms`, `app_standby=-1m6s187ms`, `exactAllowReason=policy_permission`, a combination AOSP never emits | 1.27.384 | recovered `FINDINGS.md` section 13 |
| Find X8, deferred tick window | `origWhen=12:18:00.500 window=+25s729ms ... maxWhenElapsed=+34s440ms` | 1.28.24 | recovered `FINDINGS.md` section 15 |
| Find X8, first frame after a wake | `1h 7m` against a true `1h 6m`, corrected 21 seconds later at the next minute edge | 1.28.24 | recovered `FINDINGS.md` section 15 |
| Find X8 and 3T, receiver count after the process-bound registration fix | `#receivers` 4 to 8, the list containing `TIME_TICK` | 1.28.23 | recovered `MEASURED-DRIFT.md`; shipped as `e58be5c9` |
| Find X8, 9 reads across three minute edges | 9 of 9 exact, the label flipping 1 to 4 seconds after the edge | 1.28.23 | recovered `MEASURED-DRIFT.md` |
| Find X8, screen-off sampling, 4-minute gaps | 6 of 7 exact, worst plus 1 | 1.28.24 | recovered `MEASURED-DRIFT.md` |
| Find X8, induced deep doze | the app's own alarm fired once where three or four were due while `ACTION_TIME_TICK` arrived six times, and the label was exact on both wakes | 1.28.24 | recovered `MEASURED-DRIFT.md` |
| Find X8, launch host callbacks while the screen is off | 58 `widget is not ready` deferrals against 3 delivered `updateViews` in one window; `widget.host.callbacks: null` | 1.28.21 | recovered `MEASURED-DRIFT.md:73-83` |
| 3T, force-stop cost, re-tested | `stopped=true` receives no broadcasts and runs no jobs; the label froze at `4h 16m` against `4h 13m` and stayed frozen 90 seconds later; an app open restored exactness by the next edge | 1.28.24 | recovered `MEASURED-DRIFT.md` |
| Both phones, the chain's own counters | 410 alarms to 410 wakeups on the 3T, 355 to 355 on the Find X8: the alarm is not being dropped | 1.28.21-1.28.24 | recovered `MEASURED-DRIFT.md` |
| Ruled out, each by measurement | dead alarm chain, OEM force-stop in the sampled windows, doze whitelist and standby bucket, `app_standby` policy floors, broadcast queue backlog, missing `FLAG_RECEIVER_FOREGROUND`, stale snapshot data, and the Glance "never composes" theory | 1.28.21-1.28.24 | recovered `MEASURED-DRIFT.md` |

What the readings establish: the OEM symptom was never one fault. It was a dead chain after a
force-stop, an OEM-widened alarm window, a launcher that held no host callbacks while the
screen was off, and a runtime layer registered as a side effect of a data push. Each was found
by measurement and closed by a commit between `68444194` (1.27.276) and `2014efad` (1.28.25),
except the last gap, which was closed and never A/B-proven in production (2.3).

### 2.2 The owner's report

Her recollection, quoted from the row: "it worked, but on some OEMs some widgets fell out of
sync and stopped updating". The specific number on record is 20 to 24 minutes late on the Find
X8, always showing too much time remaining.

**Owner-reported, partly reproduced.** The direction is reproduced in every reading: the error
is always positive, never early. The mechanism is reproduced three ways: the frozen label after
a force-stop at one minute of error per suspended minute, the three-widget disagreement at
plus 6, plus 3, plus 1, and the deferred alarm window at up to 34 seconds. The magnitude is
reached, and exceeded, only by the artificial force-stop: the 3T label read plus 8 and then
plus 47 while frozen, pre-1.28.21. No OEM action on a build from 1.28.21 onward reproduces it:
the worst there is plus 7 on the 3T (a six-sample run) and plus 2 on the Find X8, and from
1.28.23 the worst is plus 1. The recovered record itself states this (`MEASURED-DRIFT.md:53`): "The owner reported 20
to 24 minutes late on the old build. Nothing in this window approaches that." Its reading is
that the 20 to 24 minute case is the tail of the intermittent distribution on the pre-1.28.21
build, and that a sampler which wakes the phone every few minutes never lets the deficit build.

**Recollected, unbacked:** whether her report was on the preview build, how long the phone had
idled, and whether the widget was placed before or after the app update that changed the data.

### 2.3 What no reading covers

- The stable pins. Every reading in 2.1 is from the preview line (`expo ~58.0.0-preview.3` with
  `expo-widgets ~58.0.3` from 1.27.384 through 1.28.25, and `expo ~58.0.6` with
  `expo-widgets 58.0.14` at the re-pin). Nothing has been read on the re-pinned build
  (`expo ~58.0.12`, `expo-widgets 58.0.19`).
- The screen-wake fix. `2014efad` (1.28.25) added `ACTION_SCREEN_ON`. The recovered record
  states plainly that the fix's drift reduction "is NOT established": its after-run was taken
  on a mock-data build, so the comparison was void.
- The worst state. Every reading was taken on a phone that was charging or on simulated
  discharge. A genuinely unplugged phone left overnight is the untested case, recorded as such
  in the recovered record.
- Two phones. The fleet is four. The refresh chain has readings on the 3T and the Find X8
  only. The S23 atlas (`e2e/device-atlas-sm-s911b.md`) records an install ritual, a widget
  picker route and the gallery labels, and states no Athan widget was hosted when it was
  written; the 8T has no atlas and no widget reading anywhere in the history.
- The chain since 1.28.25.
  `git log --oneline 2014efad..uat -- modules/widgetrefresh` prints nothing: the refresh module
  is untouched for the whole stable re-pin and for every localisation, digit and RTL ticket
  since. The chain has never been re-proven after any of them.

### 2.4 The shipped comment's reason is refuted by the repository's own later evidence

`WidgetRefreshScheduler.updateAll` (`:118-131`) states that Glance composes only when a session
is already running, and that the second broadcast exists so the first can start a session and
the second can compose. The same session later withdrew that explanation: `GLANCE-ROOT-CAUSE.md`
records that a second pass arriving inside the observed 45-second session window still closed
`wasOpen=false`, so `wasRunning` was not the mechanism, and `MEASURED-DRIFT.md`'s ruled-out
table states the theory is refuted (the session's `_isOpen` initialises true, `wasOpen=false`
is the normal post-timeout line, and a third-party widget on the same phone composed with
`wasRunning == false`). The failure the repository finally measured is delivery: the launcher
holds no host callbacks while the screen is off, so 58 of 61 updates were deferred.

The double broadcast therefore stays on a reason the repository has already retracted. It is
either redundant against 58.0.11's fix or it helps for a reason nobody has written down. This
is the first reserve fix in section 5.

## 3. What SDK 58 stable changed in the widget runtime

### 3.1 The pins

| Package | Preview era (`840aa613`, 2.0.863) | Installed (`8a44f0ab`, 2.0.885) |
| --- | --- | --- |
| `expo` | `~58.0.6` | `~58.0.12` |
| `expo-widgets` | `58.0.14` | `58.0.19` |
| `@expo/ui` | `58.0.14` | `58.0.19` |
| `expo-background-task` | `~58.0.10` | `~58.0.11` |
| `expo-location` | `58.0.12` | `~58.0.16` |
| `react-native` | `0.88.0-rc.3` | `0.88.0` |

The re-pin landed at `bc9699d3` (row 111 step 1). The row's premise holds: SDK 58 stable is
already what `uat` carries.

The Glance fork under both pins is `androidx.glance:glance:1.2.0` plus the expo peek packages
declared in `node_modules/expo-widgets/android/build.gradle` and
`node_modules/expo-widgets/expo-module.config.json` (`io.github.expo.peek:peek-emittables:0.3.2`
and the `io.github.expo.peek.glance-fork` gradle plugin at 0.3.2). Neither resolves through
`yarn.lock` (they come from Gradle), and no copy of the preview-era resolution exists locally,
so the fork delta between the pins is not measurable here. It is named for completeness and the
wave's reading is its test.

### 3.2 The changelog delta, 58.0.14 to 58.0.19

`node_modules/expo-widgets/CHANGELOG.md`. The Android entries in the range:

- 58.0.15, 58.0.18, 58.0.19: dependency bumps only.
- 58.0.16: three Android entries. The layout registry stops failing on Windows paths; the
  library now ships consumer R8 keep rules for `RoomDatabase` and `InputMerger` subclasses;
  `work-runtime-ktx` is pinned forward to 2.9.1.
- 58.0.17: custom notifications, plus an iOS bundle rebuild on every Xcode build.

Nothing in the range touches the alarm, the receivers, the watchdog, the update broadcast or
the render path. The one refresh-adjacent entry in the wider 58.x line is 58.0.11, "Fix update
during active Glance sessions", which is already inside the preview-era 58.0.14. The
double-broadcast workaround predates it: `11d6584e` was written against `expo-widgets ~58.0.3`.

### 3.3 The R8 keeps

The library now ships `android/proguard-rules.pro` as `consumerProguardFiles`:

```
-keep class * extends androidx.room.RoomDatabase { <init>(); }
-keep class * extends androidx.work.InputMerger { <init>(); }
```

`app.json`'s `extraProguardRules` keeps `androidx.work.** { *; }` and `androidx.glance.** { *; }`
whole, plus the Expo Modules v2 reflection keeps. The library's rules cover the exact two
classes the preview-era strip broke on the 3T (`e2e/device-atlas-oneplus3t.md:99`, the
`WM-InputMerger NoSuchMethodException` reading, whose fix was `5d3cc01e` at 1.27.250, before any
58.0.16 existed). The app's rules remain broader. Which set is load-bearing today is unmeasured:
this is the second reserve fix.

### 3.4 The patched runtime

`patches/expo-widgets+58.0.19.patch` carries two features, no refresh behaviour: the openApp
button action (`ExpoWidgetEmittableTree.kt`, `WidgetButtonProps.openApp`) and the device-locale
injection (the C++ render signature and all four runtime files). Row 111 rebuilt both in step
1. Neither touches the alarm, the receiver, the watchdog or the update path, so the patch
cannot be a refresh variable. Cited by hunk feature, never by line: row 111 rebuilds the file.

## 4. The residual gaps

| # | Gap | What measures it |
| --- | --- | --- |
| G1 | No reading on the stable pins | one build, one sampling session per phone |
| G2 | The screen-wake fix was never A/B-proven | the same protocol before and after on one phone, same build data |
| G3 | The worst state (unplugged, overnight) was never sampled | one overnight window per phone |
| G4 | The 8T and the S23 have no refresh reading | the same protocol on both |
| G5 | The double broadcast's reason is retracted and its value unmeasured | count compositions per minute with one pass against two, on a release build |
| G6 | The two R8 rule sets overlap and neither is isolated | a scratch release build with the `app.json` keeps removed, on one phone |
| G7 | The 15-minute watchdog never renders, cannot beat the platform floor, and its comment's claimed force-stop coverage is refuted by the repo's own measurement (1.5): its real window is a low-memory kill | reading only; no code change is proposed |
| G8 | A force-stopped app cannot be recovered in the background by any mechanism | reading only; the app-open recovery path is the whole cure |

## 5. The options and the recommendation

- **Option A, status quo.** The chain is unchanged since 1.28.25 and carries preview-era proof.
  Nothing is re-verified. Cheapest. Leaves G1 to G6 open and the row's second half unexecuted.
- **Option B, prove then fix (recommended).** Install the stable build on each fleet phone, run
  the protocol of section 6 in the worst state, record every reading, and fix only what fails
  the threshold. Two reserve fixes stand ready and land only on a failing reading: G5 (count
  compositions with one broadcast against two) and G6 (isolate the R8 rule sets), the second
  ask-first because it edits `app.json`.
- **Option C, harden now.** Insure without a reading: a second watchdog cadence, a foreground
  service tick, or a launcher-drawn `Chronometer`. Rejected: the `Chronometer` was withdrawn on
  measurement and cannot roll onto the next prayer; a second watchdog cannot beat the 15-minute
  platform floor; a foreground service is a battery cost and a store-review question with no
  reading behind it.

**The recommendation, argued twice.** For B: every layer is already built, the preview-era
defects were measured and closed, and the open questions are exactly the ones a reading
answers. The cost is one build and one sampling session per phone, and no code change on a
pass. Challenge: does this repeat work already done? Partly, and that is the row's point: the
runtime under the chain changed (expo 58.0.6 to 58.0.12, expo-widgets 58.0.14 to 58.0.19, the
R8 consumer rules), and every preview-era reading was taken on the older
runtime. B survives. Challenge the strongest rival, A: A is honest and free, but it leaves G1
to G6 open and the owner's recollection unanswered on the build she would ship. B stands.

## 6. The device-proof design and the condition it waits on

Design only. This wave makes no device contact and no build; the plan's section 7 carries the
protocol, the threshold and the evidence list.

Waits on: her scope ruling (option A, B or C), the build bay free of `build.lock`, and the
phones' presence. The 3T is the one phone whose access is on record as interrupted (row 54,
2026-10-14); if it is still absent the wave records it absent and proves the other three.
