# Issue Ledger — rn.athan.uk

Last updated: 2026-09-24 — #36 added and fixed (lost alarms stayed lost, because the refresh gate
trusted a timestamp), #37 opened (the background task demands a network it does not use). Ledger
compacted 2026-09-20: closed issues moved to the one-line index at the bottom (full detail in git
history); open issues keep their detail verbatim. Open now: #10, #17, #27, #37, #39, #40, G.1, G.2, #35.

Notes: the fleet gained a Huawei/Honor phone 2026-09-09 (owner-installed 1.24.1 via the EAS
link; its USB never enumerated on the Mac). Upstream watches dropped: #44540 (closed upstream via
#44646) and #43136 (guard shipped, maintainer-confirmed intentional). The audio 30s iOS-cap audit
CLEARED (athan15, 29.975s decoded, verified audible on the XS; re-verify any >30s flag with
ffmpeg decoded duration). Live upstream watches sit inside #17 and G.1.

Status legend: [FIXED 1.5.3] shipped in commit 438f8e5 / PR #164 · [OPEN] not yet fixed · [DEFERRED] accepted, revisit later · [ACCEPTED] intended behavior, documented

---

## C. Notifications — ColorOS-family timing problems (OnePlus 8T, Oppo Find X8)

### 10. [OPEN] ±60s LATE — silent inexact-alarm fallback + process freezing

- **Native code (verified, unchanged in latest)**: expo-notifications `setupAlarm`
  (ExpoSchedulingDelegate.kt:105-121, both installed 0.32.16 AND current main/57.0.11):
  `if (SDK_INT < S || canScheduleExactAlarms()) setExactAndAllowWhileIdle else setAndAllowWhileIdle`
  — SILENT fallback, no log, no error, no JS-visible state.
  RE-CONFIRMED against installed expo-notifications 57.0.15 (2026-09-02 session):
  same code at delegates/ExpoSchedulingDelegate.kt:106-114 — still silent, still no
  JS-visible observability. The next Android device session should START with the
  #14 adb ground-truth checklist (`dumpsys package … EXACT` + `deviceidle whitelist`)
  before anything else — it disambiguates suspect 1 (permission actually revoked at
  runtime) from suspect 2 (ColorOS process-freeze deferring delivery).
- **Device matrix confirms mechanism**: iPhone (UNUserNotificationCenter) = perfect;
  OnePlus 5T (Android ≤10, `SDK_INT < S` → always exact) = perfect; Galaxy = perfect;
  ONLY the two ColorOS-family Android 13+ phones (8T, Find X8) drift.
- **Already tried by owner (eliminated)**: battery optimization off, app priority,
  "Alarms & reminders" special-access toggle on/off — no luck.
- **Surviving suspects**:
  1. Runtime `canScheduleExactAlarms()` actually false despite toggle UI (ColorOS
     revoke layer / permission stripped from shipped manifest — see #13).
  2. ColorOS freezing the cached app process: alarm fires on time but broadcast
     delivery is queued until unfreeze → delayed + clumped deliveries.
- **Inexact alarm guarantees** (Android docs): never early; batched in idle/maintenance
  windows → the observed ~1-min-late signature.
- **Key evidence on library choice**: prayer app on flutter_local_notifications #2369
  reports prayers delivered EXACTLY 4 HOURS LATE even with `alarmClock` schedule mode —
  OEM delivery deferral beats even setAlarmClock in some configurations.
  DECISION: stay on expo-notifications; no library swap without new evidence.

### 17. [OPEN — UPSTREAM FIX MERGED, RIDES SDK 58] OEM windowed delivery of scheduled notifications (root cause of #10's late fires)

- **Status (2026-09-03, deep-dive session with 4-device bench)**: root cause empirically
  characterized; upstream fix proposed as [expo/expo#49687](https://github.com/expo/expo/pull/49687)
  (opt-in `alarmClock: true` on DateTriggerInput → `AlarmManager.setAlarmClock()`).
- **Status (2026-09-08, upstream watch delta)**: #49687 MERGED to `main` at 2026-09-08T13:10Z
  (vonovak). The fix sits in the changelog's Unpublished block, so it rides the SDK 58 line.
  No 57.x backport exists: no backport PR references it, and the newest npm 57.x
  (`57.0.17`, 2026-09-04) predates the merge; the first npm artifact carrying the fix is
  `58.0.0-canary-20260908-e343e6e`. Per owner rule, no speculative SDK 58 upgrade: adoption
  waits for the SDK 58 release (recorded under Owner-facing implications below). Watch
  signal: `npm dist-tag ls expo` gaining `sdk-58`, or a `58.0.0-beta.x` publish; as of
  2026-09-08 only per-commit canaries exist and no beta has been announced.
- **Backport experiment (owner-ordered 2026-09-08, sequenced AFTER the large-screen
  feature, at the very end)**: patch-package backport of the MERGED #49687 state (merge
  commit `257006e` on expo/expo main - includes the maintainer's pre-merge adjustments;
  NOT our draft) onto installed `expo-notifications@57.0.17`. Mechanism per the G.1
  fallback precedent: extract the merged diff for `NotificationScheduler.kt`,
  `NotificationTriggers.kt`, `ExpoSchedulingDelegate.kt`, `NotificationScheduler.types.ts`,
  `Notifications.types.ts`, `scheduleNotificationAsync.ts`; reconcile any main-vs-57.0.17
  drift; `patch-package` devDependency + postinstall (branch-only, never merged);
  add `delivery: 'alarmClock'` to our DateTriggerInputs on the branch; branch
  `experiment/alarmclock-backport` from uat; EAS preview build (Android) for weeks/months
  of owner testing ahead of SDK 58. DELETE branch + patch the day an SDK release carries
  the fix.
- **Shipped API differs from the draft**: the merged option is `delivery: 'alarmClock'`
  (`NotificationDelivery = 'bestEffort' | 'alarmClock'` in `Notifications.types.ts`, default
  `'bestEffort'`, Android-only, degrades to best-effort without the exact-alarm permission)
  on `DateTriggerInput` and the daily/weekly/monthly/yearly triggers. The draft's boolean
  `alarmClock: true` did not ship; the hardware verification below ran on the draft branch,
  the alarm-clock path itself (`setAlarmClock()`, `window=0 flags=0x9`) is unchanged.
- **SDK 58 upgrade flag**: the same Unpublished changelog block carries a breaking change
  ([#49072](https://github.com/expo/expo/pull/49072)): notifications arriving in the
  foreground now present by default unless `setNotificationHandler` says otherwise. Audit
  our handler behavior during the SDK 58 upgrade.
- **Mechanism (all measured, none inferred)**: on OnePlus 8T (OxygenOS 12) and Oppo Find X8
  (ColorOS 16), alarms scheduled through expo-notifications' EXACT path are stored by the OS
  with a 1-hour deferral window (dumpsys: `window=+1h0m0s0ms flags=0x4`) and delivered inside
  it per battery policy — +21s (lenient, charging/screen-on) → +2m21.4s ×3 identical (batching
  quantum) → +2h23m planned worst (unattended state, from ColorOS `policyWhenElapsed`).
  App-side post latency stays ~0.3s throughout; the deferral is 100% OS alarm queue.
- **Bare-metal control** (hand-built receiver-only APK, no expo/RN/Kotlin): `setAlarmClock()`
  delivers **+3–43ms on all four fleet phones** in EVERY tested condition (incl. restricted
  standby bucket, 2-day distance); bare `setExactAndAllowWhileIdle` +12–42ms; inexact APIs
  +20s–5m12s. The OS alarm queues are NOT broken — the windowed storage applied to the
  library-scheduled alarms is the differential.
- **Bisection (all ruled out as the cause of the windowed storage)**: targetSdk 33 vs 36,
  PendingIntent mutability/URI/foreground-flag, alarm count (30+ burst), standby bucket
  (RESTRICTED bare app still exact; ACTIVE expo app still windowed), schedule distance
  (2-day arms), androidx version (single-instruction passthrough verified in the shipped dex),
  shipped delegate bytecode (verified correct). Cause is per-package OS policy, not observable
  from adb — documented in the PR; the alarm-clock channel sidesteps it entirely.
- **Bare-EXPO control (2026-09-03, the level-1 experiment — app exonerated):** a blank
  `create-expo-app --template blank-typescript` + `expo-notifications` only (~10 lines, ONE
  DATE trigger) reproduces the windowed storage **identically**: 8T `window=+7m29s985ms
  flags=0x4` and F8 `window=+7m29s990ms flags=0x4` (WINDOWED, exact-path permission verified
  granted), 3T/5T `window=0 flags=0x5` (EXACT) — 4/4 correlation with the full app.
  Delivery when it fired: 8T **+14.2s** / F8 **+27.8s** (frozen process unfrozen by dispatch)
  vs 3T/5T **+0-1ms**. Conclusion: app weight/behavior (alarm count, channels, other modules)
  is RULED OUT — expo-notifications' exact-path alarms are windowed by these OEM layers
  regardless of which expo app schedules them. PR #49687 body updated with this as the minimal
  reproducer (and an unverified `flags=0x9` claim corrected to `window=0`).
- **PR fix hardware-verified (2026-09-03, same session)**: all three `/verify` defects fixed
  and the alarm-clock path proven on the affected hardware — `DATE` and `DAILY` `alarmClock`
  arms store `window=0 flags=0x9` on both 8T and Find X8 while plain siblings store windowed
  (`flags=0x4`); F8 same-minute delivery **+0ms** (alarmClock) vs **+12.7s** (plain); the
  pinned `serialVersionUID` survived a real install-over update; the sub-API-31 guard works on
  API 28/29. Option extended to daily/weekly/monthly/yearly triggers (measured SUID pins);
  PR retitled to "scheduled triggers".
- **Corroboration**: owner audibly received on-time notifications on the 8T (06:00:11, 06:04:00)
  while the F8's same-instant notifications deferred (+21.6s heard; 06:00 alarm deferred past
  +5m unheard) — the exact lived inconsistency that opened #10.
- **Owner-facing implications**: (a) #49687 merged 2026-09-08 but rides SDK 58, so the
  adoption step is: on the SDK 58 upgrade, set `delivery: 'alarmClock'` on our
  `DateTriggerInput`s for exact Athan/reminder notifications in `stores/notifications.ts`,
  then device-verify on the 4-device bench per the #10/#17 protocol (8T/F8 alarms store
  `window=0 flags=0x9`, same-minute delivery +0ms vs windowed plain siblings); (b) the Play
  app's CURRENT stale alarms
  (1.5.2, scheduled during the revoke-era) remain inexact until the store app updates and
  reschedules — the 1.18.x reschedule-on-open self-heals them on update; (c) "early" fires
  remain #11 clock-skew territory (not app-fixable).

### 36. [FIXED 1.27.326 — device-verified] Lost alarms stayed lost, because the refresh gate trusted a timestamp

- **Reported**: the 8T's user had all 6 standard prayers on Sound and heard nothing after
  Asr. Notification history showed the last fire at 16:10; Magrib (~18:58) and Isha (~20:07)
  never arrived.
- **Found on the device (2026-09-23)**: 82 pending alarm batches, none belonging to the app.
  Ruled out by reading, not by assumption: `stopped=false`, process alive,
  `SCHEDULE_EXACT_ALARM granted=true`, standby bucket ACTIVE, clock in sync with the host,
  `zen_mode=0` with every Zen Log line `set_zen_mode: off`, `ringer mode muted streams 0x0`,
  `STREAM_NOTIFICATION` unmuted at 14/16, channels `mImportance=5` and not deleted. Neither
  Do Not Disturb nor silent mode was involved.
- **Sequence**: reboot at ~16:45 (`bootreason: shutdown,userrequested`) cleared every alarm;
  no app process existed until 18:50:48, so expo-notifications' boot receiver never ran
  (#19's OnePlus Auto-launch mechanism); and then **18 app opens armed nothing**, because
  `refreshNotifications` read a recent `lastNotificationScheduleAtom` and skipped while zero
  alarms existed. The stamp is not evidence that alarms exist, and nothing reconciled the two.
- **Reproduced on demand** on the same 8T: `am force-stop` then launch leaves 0 prayer alarms
  after 30s in the foreground, while logcat proves `initializeNotifications` ran.
- **The fix is two things, both already on uat-2 before this investigation**:
  `reopenRefreshGateOnColdLaunch` (1.25.30) clears the stamp on every Android cold launch, and
  `createAthanAndroidChannel` at schedule time (1.25.35) stops the selected athan falling back
  to the default tone. Verified on the 3T: force-stop cut 4 armed alarms to 1, and one cold
  launch restored 4.
- **Retuned with it (ADR-007 rev 4)**: `BACKGROUND_TASK_INTERVAL_HOURS` 6 → 3 and
  `NOTIFICATION_REFRESH_HOURS` 12 → 2. The background interval is the ceiling on how long an
  unattended phone stays silent after losing its alarms — measured at `+5h59m59s998ms` on the
  8T, which is why Magrib and Isha were never recovered.
- **What remains OEM-bound**: a phone whose boot broadcast is suppressed and whose app is
  never opened still waits for the background task. Our own boot receiver would be suppressed
  identically, and battery/auto-launch toggles are ruled out as a user-facing fix, so a
  shorter unattended recovery is the whole of the remedy.
- **Evidence**: `ai/features/reboot-rearm/EVIDENCE.md` (every reading, both devices).

### 37. [PATCHED locally, PR OPEN upstream] The background task refuses to run without a network it does not use

- **Upstream PR (ours)**: [expo/expo#50581](https://github.com/expo/expo/pull/50581), opened
  2026-09-24 against `main` from `capt-muji:feat/background-task-requires-network-connectivity`.
  Adds `requiresNetworkConnectivity?: boolean` to `BackgroundTaskOptions`, default `true`, with
  XCTest coverage on iOS and the package's first Android unit tests. Anonymous: no app name, no
  repo link, no serials, no bundle ids. Also commented on
  [#48122](https://github.com/expo/expo/issues/48122#issuecomment-5809639597) with the
  three-device reproduction and the run-time-versus-enqueue-time finding.
  **STATE: open, awaiting first maintainer review. Check it every session.**

- **Found**: owner question during the 1.27.326 soak, 2026-09-24. This app is offline-first:
  the rolling buffer is armed from the MMKV cache and the API is fetched about once a year.
  The background refresh needs no network, and `rescheduleAllNotificationsFromBackground`
  already treats its `sync()` as best-effort in its own try/catch so a failed fetch cannot
  stop the reschedule.
- **Cause (library, hardcoded, both platforms)**: `Constraints.Builder()
  .setRequiredNetworkType(NetworkType.CONNECTED)` in expo-background-task's
  `BackgroundTaskScheduler.kt:107`, and `request.requiresNetworkConnectivity = true` in
  `BackgroundTaskScheduler.swift:93`. `BackgroundTaskOptions` carries `minimumInterval` and
  nothing else, so there is no supported way to drop it.
- **Cost**: a phone offline overnight, in airplane mode, or holding a stale connectivity flag
  loses its unattended recovery entirely. Measured on the 3T: the job sat unrun for 3h16m
  behind this constraint while the device pinged 8.8.8.8 at 0% loss, and Google's own
  `tachyon` was blocked by the same flag, so the staleness is device-wide rather than ours.
- **NOT the cause of #36**: the 8T's job recorded `Satisfied constraints: CONNECTIVITY` and
  was merely waiting out its six-hour interval. The two are independent.
- **Mitigation today**: the foreground gate, which needs nothing from the network and re-arms
  on the next app open (#36).
- **Enqueue time or run time? RUN TIME** (answered 2026-09-24, WorkManager source plus device):
  `SystemJobInfoConverter.convert()` maps the constraint onto the `JobInfo` at enqueue, and
  JobScheduler then tracks it continuously (`Tracking: CONNECTIVITY TIME`), moving it between
  the satisfied and unsatisfied lists as the link changes. So a device that regains a network
  runs the job late rather than never. The exposure is the length of the offline window, not
  permanent loss. iOS matches by Apple's contract: the condition defers the launch.
- **Fixed locally (1.27.336)**: `patches/expo-background-task+58.0.3.patch` adds
  `requiresNetwork?: boolean` to `BackgroundTaskOptions`, **defaulting `true` so no existing
  caller changes behaviour**, and `registerBackgroundTask` passes `false`. Proven on all three
  devices, including a headless cold-start execution with the radio off.
- **The patch must remove the `publication` block too.** `expo-module.config.json` declares a
  `local-maven-repo` publication, so Gradle consumes the module's **prebuilt AAR** and never
  compiles `android/src`. A source-only patch builds clean and changes nothing at runtime
  (the shipped AAR's bytecode still holds `registerTask(Context, long)` and
  `NetworkType.CONNECTED`). Verify any native patch by runtime behaviour, never by a green build.
- **Faster than waiting out the interval**: `cmd jobscheduler run` **without** `-f` refuses a
  job whose constraints are unmet and says so, giving an immediate verdict. `-f` bypasses
  constraints and proves nothing about them.
- **Upstream is stale, so we lead**: issue
  [#48122](https://github.com/expo/expo/issues/48122) is open and unassigned since 2026-07-25;
  PR [#48469](https://github.com/expo/expo/pull/48469) has sat in **draft with zero reviews
  since 2026-08-04**. That PR also defaults the option to `false`, silently dropping the
  requirement for every existing user, and ships no tests. Ours defaults `true` and carries
  XCTest coverage in the package's existing `ios/Tests` pattern.
- **Full write-up**: `ai/features/reboot-rearm/ISSUE-37-NETWORK-CONSTRAINT.md` — the exact
  library lines, the measurements, why #36 is unrelated, four options with trade-offs, the
  open questions for a debugging session and the repro commands.
- **Device evidence**: `ai/features/reboot-rearm/ISSUE-37-EVIDENCE.md` — before/after dumps per
  device, the Find X8 patched-vs-unpatched control run, and the device matrix.

---

## E. Decisions & pending diagnostics (context for future sessions)

- **NO library swap** (owner decision, evidence-backed): notify-kit/Notifee offer
  setAlarmClock + BOOT_COUNT recovery, but OEM delivery deferral can beat even
  alarmClock (4h-late prayer report, flutter_local_notifications #2369); migration cost
  unjustified without first exhausting in-place fixes. (Reaffirmed in #10: stay on
  expo-notifications.)
- **Partial-year API publication**: ruled out by owner — will never happen. Validation
  non-emptiness check is sufficient; no min-count validation needed.
- **Phase 0 diagnostics still pending (owner's phones)**: system-wide Battery → Deep
  optimization / Adaptive Battery / Sleep Standby Optimization off on the 8T (these are
  DIFFERENT toggles from the per-app battery optimization already tried) — feeds #10. The
  dumpsys EXACT ground-truth check lives in #10/#14; the clock-skew test only if #11-style
  early fires recur.

---

## G. TestFlight device test — release blockers (iPhone XS, iOS 18.7.7, 2026-09-02)

Context: first release+real-device widget/audio validation (all prior widget work
was verified debug/release on iOS 26 simulator). Device: iPhone XS (A12, 4GB RAM,
iOS 18.7.7 — XS cannot go past iOS 18), factory reset, only this app installed,
build 1.17.4 TestFlight. Owner ruling: every G.1–G.5 must be fixed before
production release; G.6 noted but deferred by owner.

### G.1 [OPEN — RELEASE BLOCKER] Five home screen widgets permanently blank

- **STATUS (end of session 2026-09-02)**: failure chain PROVEN on device and
  REPRODUCED on an iOS 18.5 simulator as sustained ~100% CPU render loop.
  Construct-level bisection STARTED (two data points in, see Bisect Log) —
  this is the exact resume point for the next session.
- **STATUS (end of session 2026-09-02, ROUND 2 — ROOT CAUSE FOUND AND
  SOURCE-PROVEN; construct bisection CLOSED)**: the "render loop" is NOT a
  livelock and NOT construct-specific. It is expo-widgets' own view-identity
  architecture making every SwiftUI body re-evaluation a full-tree teardown:
  bursts of 100% CPU per reload that scale with widget count/tree mass
  (~5–13 CPU-seconds per kind-placement), which converge (decay) only when
  WidgetKit's post-reload update sequence stops. Per-minute pushes × 10 kinds
  overlap the bursts → permanent saturation on-device. Full mechanism and fix
  options below ("ROOT CAUSE — SOURCE-PROVEN" + "FIX DESIGN — decision
  needed").
- **THE FAILURE CHAIN (all steps evidenced from the XS via USB syslog +
  crash reports)**: the widget extension gets CPU-saturated by an in-widget
  SwiftUI render oscillation → it misses WidgetKit's ~30s watchdog for
  `getTimelines` → syslog signature: `CHSErrorDomain Code=1050
  "timelineReloadFailed"` wrapping `Code=1001 "Watchdog provision violated
  for getTimelines(1)"` → chronod schedules the next retry **+1 HOUR out**
  → the app's every-minute pushes keep spawning replacement attempts that
  merge into the same doomed task → kinds that lose the render race stay
  blank "permanently" (recovery is perpetually an hour away), and kinds
  whose retry budget exhausts stop being served at all. The rendered output
  of a kind that DID succeed once stays visible as a stale good snapshot
  even while its reloads fail (observed: `PrayerWidget` visually working
  while its own reloads timed out).
- **Device evidence, enumerated**:
  1. Four `ExpoWidgetsTarget.cpu_resource-*.ips` on 2026-09-02 alone
     (01:54, 02:59, 04:29, 04:53 — spanning TestFlight, baseline dev build
     and fix dev build): "90 seconds cpu time over 136 seconds (66% cpu
     average), exceeding limit of 50% cpu over 180 seconds". Heaviest stack
     = DEEP RECURSIVE SwiftUICore/AttributeGraph traversal (render churn,
     not JSON/parse work).
  2. Every `reload:` begin → 30 s → `Reload failed` (watchdog) in the
     syslog window; the cycle repeats every ~30 s for as long as watched.
  3. Render-side read storm (NOT request-side): layout-key lookups in the
     app-group prefs at `PrayerWidget` 1,519 / 2 min (~12/sec),
     `PrayerWidgetMedium` 848, `ExtrasWidget` 548, `PrayerWidgetDark` 333,
     `PrayerLockWidget` 4,212 (~35/sec while the lock screen was visible),
     while `ExtrasWidgetMedium` + `ExtrasWidgetDarkMedium` got only **2**
     (retry budgets exhausted — the permanently-blank set) and actual
     chronod→extension `Request began` events were only **22** in the same
     window.
  4. One-by-one re-add experiment on device (owner narrated): FIRST kind
     added (`PrayerWidget` light small) renders; every subsequent kind red —
     first-come-first-served CPU starvation, NOT a per-kind defect. Gallery
     previews flipped from red to rendering as load eased mid-experiment.
  5. Only JetsamEvent on device is 2026-03-24 (predates all testing) —
     **memory-kill theory is DEAD**.
  6. Lock Screen widgets unaffected throughout (tiny trees, same process,
     same storage).
- **Ruled out (with evidence)**:
  - Storage/entitlements: dissected the EAS dev IPA (`/tmp/fixipa`) — both
    binaries carry `ExpoWidgetsAppGroupIdentifier=group.com.mugtaba.athan`
    in Info.plist AND in code-signature entitlements; both ad-hoc profiles
    (`*[expo] com.mugtaba.athan [ExpoWidgetsTarget] AdHoc …`) allow the
    group; XS UDID provisioned. The app-side pushes pass expo-widgets'
    updateTimeline no-layout guard (it throws if the layout key is
    missing), proving layouts+timelines are written and readable. Lock
    widgets read the same suite fine.
  - Dev-vs-release extension runtime: `ExpoWidgets.bundle` inside the dev
    build's extension is a PRODUCTION Metro bundle (`__DEV__=false`) —
    identical in dev and release builds.
  - Request storm as the primary driver: only 22 timeline requests in the
    device window (see #3) — the storm is the render side.
  - Data volume, mute switch, build config: ruled out earlier (see below).
- **Simulator experiments (iOS 18.5 runtime 22F77 on sim `iPhone-185`,
  created this session — Xcode 26 refuses to download 18.7; 18.5 runs under
  Rosetta x86_64 which is FINE, the slower host even helps)**:
  - All 8 kinds RENDER correctly and within seconds on the sim (owner
    eyewitnessed placements + previews). The sim never blanks — the host is
    too fast for the watchdog to trip. The loop shows up ONLY as CPU.
  - **THE REPRO**: home screen visible with widget placements → extension
    ramps 0 → 90 → ~100% CPU sustained. App foregrounded (screen showing
    the app): extension IDLES at 0% between the ~2-per-30s push requests.
    Measurement: `EXT_PID=$(pgrep -x ExpoWidgetsTarget | head -1); top
    -pid $EXT_PID -l 8 -s 3`.
  - iOS 26.5 control (iPhone 16 sim): 4 requests/30s, renders fine — but
    NOTE: only request-rate was sampled there; CPU was never sampled with
    the home screen visible. Do not cite 26.5 as "calm" until re-measured
    the same way.
  - **BISECT LOG (removal-based, screen visible, no code changes needed —
    remove widgets via jiggle mode, sample CPU after each)**:
    1. Light page visible: 2 light smalls + 2 light mediums → **~100%**.
    2. Removed BOTH light mediums (2 light smalls remain visible) → **0%**.
       ⇒ LIGHT SMALLS ARE CALM; the light MEDIUM composition loops.
    3. Dark page visible: dark extras medium + 2 dark smalls → **~100%**.
    4. Removed the dark medium (2 dark SMALLS remain visible) → **~100%**.
       ⇒ DARK SMALLS LOOP — orbs implicated independent of the medium tree.
    5. NOT YET RUN: light mediums re-added alone (re-confirm #2 was not a
       fluke of page/position); the code-level construct bisect (orbs-off
       variant — an early `return null;` was inserted in `Blobs` at session
       end and REVERTED before handoff; redo it as step one).
    - **ROUND 2 CORRECTIONS (2026-09-02 session 2, all re-measured with an
      explicit ignition protocol)**: the previous session's page model was
      partly an illusion — the oscillating extension serves TORN frames, so
      element-tree snapshots mid-churn showed arbitrary subsets of ONE widget
      page as if they were separate pages. Points 2 and 4's attributions do
      not survive ignition control:
      - "Calm" readings taken WITHOUT fresh reload requests are meaningless:
        after sim boot (or any quiet period) the extension sits at 0.0% no
        matter what is placed; the loop only ignites when fresh
        `reloadTimelines` requests arrive (app foreground push → HOME).
        Point 2 and the 06:15 idle reading were both un-ignited states.
      - Orb removal (Blobs early `return null`, cold-evaluated via pkill +
        relaunch): dark set STILL ignites 91→100%. ⇒ **orbs EXONERATED**
        (point 4's "orbs implicated" is dead).
      - 2 light smalls alone, ignited: 0→86→100→99.7→88→0 — a ~10–12 s
        BURST that DECAYS. Repeatable. ⇒ point 2's "light smalls calm" was
        an un-ignited misread; even the tiniest trees burst.
      - 4 smalls (light pair + dark pair, orbless), ignited: ~52 s at ~100%,
        then decay to 0. Burst length scales with widget count/tree mass.
      - 1 light medium + 3 smalls, ignited: burst ≥ measured window; mediums
        behave as mass-scaling, not as a distinct livelock (mechanism below
        makes construct-bisection moot).
      - Loop persists with NO Athan widget on-screen (App Library visible,
        adjacent-page render trees stay live in SpringBoard) and across
        extension respawns (poisoned reload queue re-ignites each new
        process) — "sustained 100%" readings were overlapping bursts from
        still-firing per-minute pushes.
  - **ROOT CAUSE — SOURCE-PROVEN (2026-09-02 session 2; read from the pinned
    node_modules sources, `sample` stack, and measurements)**:
    1. `expo-modules-core` `SwiftUIViewDefinition.swift:22` — `Children()` =
       `ForEach(props.children ?? [], id: \.id)`, keyed on `ObjectIdentifier`.
    2. `expo-widgets` `Widgets/DynamicView.swift:26` — every `WidgetsDynamicView`
       struct init generates a FRESH RANDOM UUID (`NodeIdentityWrapper(id:
       UUID())`; upstream TODO literally calls it a "Hack"). `updateChildren`
       (line 155) rebuilds the whole child array on EVERY parent body eval.
       ⇒ every body evaluation produces an all-new identity set → ForEach
       removes+reinserts the ENTIRE subtree → recursive
       `DynamicViewList.applyNodes` / `SubgraphElements.makeElements` /
       AttributeGraph update storm (exact `sample` stack: 1263/1263 main
       thread samples in `AG::Graph::update_attribute` + friends).
    3. `expo-widgets` `Widgets/EntryView.swift:27-31` — the ROOT body reads
       the app-group UserDefaults layout key AND `@Environment(\.self)` (the
       whole environment as a dependency) and re-runs the JS layout eval +
       environment JSON serialization per evaluation. This is the device's
       12/sec per-kind layout-read storm.
    4. `expo-widgets` `ios/WidgetObject.swift:21` — every JS
       `updateTimeline()` call ends in its own
       `WidgetCenter.shared.reloadTimelines(ofKind:)`. Our
       `refreshPrayerWidgets()` calls it 10× (8 home kinds + 2 lock kinds)
       per minute-flip → 10 reload tasks/minute, each triggering the burst
       above for that kind's visible placements.
    5. Net effect: each kind-placement costs ~5–13 CPU-seconds of render
       churn per reload pass. On A12: bursts overlap the per-minute cadence →
       `getTimelines` misses the ~30 s watchdog → chronod +1 h backoff → the
       label-flip scheduler keeps spawning doomed reloads → first-come-
       first-served starvation → permanent blanks (G.1) and delayed first
       renders (G.2). On fast hosts bursts are ms-scale → widgets "work".
    6. **Upstream status**: expo/expo@main STILL carries the random-UUID hack
       (identical file, fetched via opensrc 2026-09-02). No fixed version
       exists to upgrade to. No public issue/report found — we are the first
       to characterize this (it needs many kinds + per-minute reloads +
       slow hardware to surface). Filing an upstream issue is worthwhile.
    7. Timeline archive itself is HEALTHY (348 entries, 285× exactly-5-min
       steps + boundary flips; verified from the sim app-group plist) —
       entry density is NOT a driver.
  - Interpretation so far: the calm tree is the light small (hero trio
    only). Both ORBS (dark smalls) and the MEDIUM composition (2-col
    HStack + day list + floating pill + footerLift) oscillate. No single
    shared construct — either two independent loops, or a size/depth-
    triggered recursive layout path in iOS 18's AttributeGraph.
- **Construct suspects (all inside `widgets/PrayerWidget.tsx`; known-fragile
  geometry per ai/AGENTS.md lessons)**: oversized-orb rendering (94pt frame
  + `scaleEffect(size/94)` + `blur(blur/scale)` — 1.17.0 lesson),
  `Spacer`-centering inside `maxHeight: Infinity` stacks (1.14.0 lesson),
  the medium pill track (`RoundedRectangle` + `strokeBorder` + `shadow` +
  `offset`), `footerLift` half-point offset (offset applies at DOUBLE
  strength in the widget runtime — 1.17.0 lesson), translucent
  `containerBackground` (`rgba(255,250,253,0.55)` on light kinds).
  Lock layout uses NONE of these and never loops.
  - **FIX DESIGN — decision taken 2026-09-02 (owner): WAIT for the upstream
    fix as the primary path; our-side hygiene landed as 1.17.8.**
    0. **[2026-09-12 — #49244 IS DEAD. THE FIX IS NOW #49810, MERGED BUT
       UNRELEASED, SHIPPING ON THE SDK 58 LINE.]** Verified this session,
       do not re-derive:
       - `#49244` was **closed UNMERGED** on 2026-09-11. Maintainer jakex7:
         *"Thank you, however we decided to take a different approach in
         keeping stable identities, so I'm going to close this PR."*
       - He then implemented it himself: **expo/expo#49810**, "[widgets][iOS]
         Preserve view identity across widget and Live Activity updates",
         commit `d7a46994`, landed on `main` **2026-09-11** (same day).
       - **It ships on SDK 58, not a 57.0.x patch.** The expo-widgets
         CHANGELOG's `## Unpublished` section carries #49810, and the section
         immediately below it is `## 58.0.0 — 2026-09-10`. The old expectation
         of "`expo-widgets@57.0.16`" was based on #49244's changelog placement
         and is void.
       - **57.0.16, 57.0.17 and 57.0.18 each say "This version does not
         introduce any user-facing changes."** A higher version number proves
         nothing here.
       - **Verified in the installed source**, not inferred:
         `node_modules/expo-widgets/ios/Widgets/DynamicView.swift:26` still
         reads `let uuid = NodeIdentityWrapper(id: UUID())` under the comment
         `// TODO(@jakex7): Hack to satisfy ExpoSwiftUI.AnyChild with random
         UUID value`. The root cause is still installed.
       - **Therefore the `widgets` flag stays OFF.** Having the iPhone XS
         connected does not unblock this; there is nothing shipped to verify.
       - **The patch-package fallback below is now LIVE** (merged, unreleased,
         clock started 2026-09-11). Backport target is #49810, NOT #49244, and
         resolve against the installed 57.0.18 sources. Note the old backport
         note's `render()`/#49535 conflict warning refers to #49244's diff and
         may not apply to #49810.
       - **OWNER DECISION 2026-09-12: we WILL patch it, deferred to its own
         session.** *"We will do the same thing we did for the alarm clock. We
         will also patch it, but we're gonna defer that as well."* Shape it like
         `ai/prompts/alarmclock-backport.md`: patch the merged upstream code on
         its own branch, delete the patch when the real release ships. Needs the
         `widgets` flag flipped ON as well as the patch — while it is off,
         `app.config.ts` strips the expo-widgets plugin at prebuild, so there is
         no extension in the build and a patched `node_modules` changes nothing
         observable. Also needs the iPhone XS reconnected (deliberately
         disconnected 2026-09-12) for the acceptance protocol below.
       - Also merged in the same window: **#50038** (Android Gradle build
         failure when no Android widget is configured) — only relevant if
         Android widgets are ever configured.
       - Separately, **#48786 is an open ISSUE, not a PR**:
         `[expo-background-task] iOS getStatusAsync() never reads the real
         Background App Refresh permission`. Unrelated to widgets; relevant to
         our background-task path.

    1. ~~**UPSTREAM FIX TRACKING — expo/expo PR #49244 — THIS IS THE FIX
       (owner: "our bread and butter"). CHECK IT EVERY SESSION.**~~
       **SUPERSEDED — see item 0. Kept for the diagnosis, which still holds.**
       <https://github.com/expo/expo/pull/49244> — "[expo-widgets][iOS]
       Keep SwiftUI view identity stable across updates so animations work"
       by mahdidavoodi7, opened 2026-08-22, last activity 2026-09-01.
       It replaces the random-UUID-per-render identity with stable
       path-based identities (honoring JSX `key` — our day-list rows use
       `key={row.name}`), deliberately EXCLUDES `entryIndex` so timeline
       advances update in place instead of demolishing the tree, with a
       bounded 4096-entry LRU identity cache. Expo's review bot verified
       "the diagnosis in this pull request is correct"; maintainer jakex7
       (author of the original hack) ran verify/review passes 2026-08-31;
       bot status "Ready for human review". This kills the G.1/G.2 failure
       chain at the root: renders drop from ~5–13 CPU-s per widget to
       millisecond in-place updates.
       - **Watch procedure**: `curl -s
         https://api.github.com/repos/expo/expo/pulls/49244 | jq
         '.state, .merged_at, .updated_at'` + the expo-widgets releases:
         `curl -s
         https://api.github.com/repos/expo/expo/releases?per_page=100 |
         jq '.[] | select(.tag_name | contains("expo-widgets")) |
         .tag_name' | head -5` — or watch
         <https://github.com/expo/expo/blob/main/packages/expo-widgets/CHANGELOG.md>.
         The PR sits in the UNRELEASED 57.0.x bug-fix section of the
         changelog → expected to ship as `expo-widgets@57.0.16` (patch
         bump, `npx expo install`), NOT an SDK-58 upgrade.
       - **On release**: bump `expo-widgets` + matching `@expo/ui`, re-run
         the sim ignite-protocol burst measurement (expect ms-scale),
         EAS dev build, XS acceptance protocol (all 8 home kinds render +
         stay ≥10 min, zero new cpu_resource reports, zero watchdog
         lines). WATCH-ITEM: stable identity may enable system default
         update animations (text fades) — owner's no-settling rule says
         suppress if visible (one-line layout change).
       - **Fallback if merged-but-unreleased past ~a week** and the XS
         needs fixing sooner: patch-package backport of the MERGED code
         (low risk at that point — human-approved). Delete the patch at
         57.0.16. Backport note: one hunk touches `render()`, which main
         has changed separately (#49535, unreleased) — resolve against
         57.0.15's file.
       - **Not fixed by the PR (ours)**: the JS push-path cost (G.6) and
         the 10-reloads/min floor (10 kinds × minute-exact labels is the
         UX; minute-aligned London times make both schedules flip at every
         wall-clock :00 together, so per-schedule timers coincide by
         design — reload count is unchanged and becomes harmless once
         renders are cheap).
    2. **Landed 2026-09-02 (1.17.8) — `stores/widget.ts` rework (our-side
       prep)**: PER-SCHEDULE label-flip timers + pushers (a flip re-pushes
       only that schedule's five kinds; schedules fail independently; one
       empty schedule no longer blocks the other's timer) + a London-date-
       keyed prayer-sequence cache so the per-minute flip pushes never
       re-read the prayer DB or re-run the tz sequence math (the G.6 JS
       cost) — full refreshes always rebuild before caching, so data wipes
       and settings changes can never serve stale. Pinned by two new
       tests in `stores/__tests__/widgetSettingsSync.test.ts` (flip pushes
       each schedule's kinds only; flip pushes reuse the cached sequence
       across a DB wipe). `yarn validate` 33 suites / 895 tests green.
    3. Tree-mass reduction in layouts — deferred: owner walked every pixel
       of the design; visual risk for a linear gain.
  - **SHIP + VERIFY protocol (after the 57.0.16 update)**: bump BOTH
    app.json + package.json (was 1.17.10 at time of writing — 1.17.8 = Phase 1 prep, 1.17.9 =
    the session-2 docs/branch sync; neither shipped to a store), `yarn
    validate`, `npx eas-cli build --profile development --platform ios
    --non-interactive --no-wait`, owner verifies on the XS: all 8 home kinds
    render AND stay rendered ≥10 min, zero new `ExpoWidgetsTarget.
    cpu_resource` reports, zero `Watchdog provision violated` lines in a
    fresh `idevicesyslog` capture. Sim-side smoke: ignite protocol (foreground
    app → push → HOME) shows bursts ≤ a few seconds and full decay between
    minute-flips.
- **Evidence files (all in /tmp — survive until reboot)**:
  `/tmp/xs-syslog.txt` (full device syslog, ~1.5M lines; analysis window
  offset in `/tmp/syslog-mark.txt` = 906268; slice at `/tmp/window.log`),
  `/tmp/xs-crashlogs/` (4× cpu_resource + JetsamEvent-2026-03-24 + old
  Athan-2026-08-17 crash), `/tmp/sim18-ext.log` (sim chronod+extension
  stream, session 1), `/tmp/sim18-live.log` (session-2 live log stream —
  kind-level Request/liveView lines + "Ignored view update for reason:
  [timelineAdvancedOrNewArchive]"), `/tmp/extsample1.txt` (macOS `sample`
  of the burning extension — the DynamicViewList/AttributeGraph stack),
  `/tmp/fix-build.ipa` + `/tmp/fixipa/` (dissected dev build),
  `/tmp/build18.log`, `/tmp/build18d.log`, `/tmp/metro-athan-baseline.log`
  (89 s JS-freeze evidence), `/tmp/metro-athan-fix-session1.log` (session-1
  fix-build log, archived) + `/tmp/metro-athan-fix.log` (session-2 log).
  App-group archive for kind timelines (sim):
  `~/Library/Developer/CoreSimulator/Devices/15DD…/data/Containers/Shared/
  AppGroup/AA2FE8C7…/Library/Preferences/group.com.mugtaba.athan.plist`.
  Device syslog tooling: `idevicesyslog`/`idevicecrashreport` installed via
  brew (libimobiledevice); pairing validated for XS UDID
  `00008020-0015585C22D2002E` — replug + re-trust if asked.
- **RED boxes note (dev builds only)**: DEBUG `DynamicView.swift` renders
  failures as red boxes; release maps them to invisible `EmptyView`.
  Two red sources exist: `EntryView` "No layout found for
  `<group>::<Kind>`" and unknown-node `Unable to get the view for: <type>`
  (red + text). The owner's red boxes showed no readable text on-device —
  never resolved which; irrelevant now that the CPU/watchdog chain is
  proven, but remember red ≠ necessarily "layout string missing".
- **Symptom**: `PrayerWidgetMedium`, `ExtrasWidgetMedium`,
  `PrayerWidgetDarkMedium`, `ExtrasWidgetDarkMedium` (all four mediums) and
  `ExtrasWidgetDark` (small) render a blank system-tinted surface (purple on
  light kinds, dark on dark kinds) permanently — never render content across
  30+ minutes of watching, a device restart (app reopened, waited 10 + 10 min
  again), and app relaunches. Tapping them opens the app correctly.
- **Working on the same device**: `PrayerWidget`, `ExtrasWidget`,
  `PrayerWidgetDark` (the three non-dark-extras smalls) render instantly and
  stay correct. Both Lock Screen kinds were blank at placement but recovered
  after ~60 s and work perfectly (delayed first render — see G.2, not a
  permanent blank).
- **Why this is hard**: `ExtrasWidgetDark` shares the EXACT same serialized
  layout function, render path, and props shape as the working
  `PrayerWidgetDark`/`ExtrasWidget` smalls (only color/data fields differ) —
  no layout-code difference can explain it. All 10 kinds share one extension
  process; 5 widgets render fine there, so the runtime/bundle/storage work
  generally.
- **Ruled out** (with evidence): data volume/slowness (owner rebuttal upheld —
  same data renders in three working smalls); build configuration (owner
  confirmed Release config was verified working on simulator, incl. mediums);
  global expo-widgets regression (upstream #47963 "widgets render blank on
  SDK 57/iOS 26" — closed unresolved without repro; our locks recovering and
  5 healthy widgets contradict a global failure); reload-budget throttle as
  the primary cause (fresh pushes after restart never healed the blanks);
  `Toast`/layout code path for ExtrasWidgetDark (identical to working kinds).
- **Release-build observability trap**: `expo-widgets` `DynamicView.swift`
  maps render failures/unknown nodes to `EmptyView()` outside `#if DEBUG` —
  every failure mode is an invisible blank on TestFlight. The simulator's
  release pass proves the layouts are correct code; the failure is
  environmental to the device (iOS 18 / A12 / 4GB).
- **Candidate root causes (SUPERSEDED — root cause found above, kept for
  history)**:
  1. Per-process widget-extension memory ceiling (jetsam): all 10 placed
     widgets render in one process; mediums are the heaviest trees (6-row
     list + pill + stroke/shadow; dark kinds add 4 blurred orbs — blur up to
     82, corner orb 255pt/blur 75). A deterministic kill mid-render freezes
     the same set blank on every retry; the recovered locks (tiny text-only
     trees) fit. NOTE: per-process ceiling is unrelated to free RAM/storage —
     an empty factory-reset phone does not exonerate this.
  2. iOS-18-specific failure in medium-only modifiers (pill
     `strokeBorder`/`shadow`/`offset`) — cannot explain ExtrasWidgetDark.
  3. App-group UserDefaults write failures for specific kind keys — silent
     `cfprefsd` losses are documented platform-wide; we write ~10 × ~155KB
     timeline arrays every minute while foregrounded. Would explain
     ExtrasWidgetDark if its key specifically fails.
- **Agreed diagnostics (Phase 0, owner's phone, no code)**:
  1. Clean page → add ONLY `PrayerWidgetMedium` → wait 2 min. Renders ⇒
     load-dependent ⇒ memory. Blank alone ⇒ medium-path bug.
  2. Clean page → add ONLY `ExtrasWidgetDark` → wait 2 min. Renders ⇒
     load-dependent. Blank alone ⇒ its storage key.
  3. Settings → Privacy & Security → Analytics & Improvements → Analytics
     Data → `JetsamEvent-*.ips` timestamped during blank episodes = positive
     proof of memory kills.
  - Follow-ups: dev-signed Release build on device → Console.app WidgetKit
    per-widget render results (`Request ended for <kind> — success/error`);
    container download → inspect `group.com.mugtaba.athan` plist for the 5
    kinds' `__expo_widgets_*_timeline`/`*_layout` keys; in-app `getTimeline()`
    readback diagnostic after each push.
- **Fix branches per verdict**: memory ⇒ lighten medium render cost (orbs/
  blur/corner-orb design trade-offs — owner decision, no device branch exists
  in the widget layout env); iOS-18 modifier bug ⇒ bisect medium composition
  with diagnostic layouts; storage ⇒ reliable persistence (file-in-container
  patch for expo-widgets' hardcoded UserDefaults path).

### G.2 [OPEN — RELEASE BLOCKER] ~60 s blank window when adding any widget

- **Symptom**: a freshly added widget shows the blank/purple placeholder for
  up to ~60 s before its first render (observed: extras light small blank
  until "the widget updates"; both lock widgets ~60 s). Users will read this
  as broken widgets on first use.
- **Suspected mechanism**: first-render delivery latency — the same ~60 s
  WidgetKit reload latency already documented in ai/AGENTS.md under push
  barrages. `stores/widget.ts` label-flip scheduler re-pushes all 10 widgets
  every minute while foregrounded (~10 `WidgetCenter` reloads/min against
  Apple's documented 40–70 reloads/day per widget budget).
- **Owner constraint**: minute-accurate label updates must stay — cadence
  reduction is REJECTED. Fix must preserve visible freshness while making a
  freshly placed widget render immediately from already-stored timelines
  (stored timelines exist at placement — the delay is delivery, not data).
  Candidates: ensure placement-time snapshot renders without waiting for a
  reload; consolidate reload calls (one `reloadAllTimelines` instead of 10
  per-kind reloads per push); push on launch/backgrounding/settings/data
  changes while relying on the precomputed 5-min step entries between.
- **2026-09-02 update**: G.1's root cause (render-loop CPU saturation →
  watchdog → +1 h retry backoff) explains most of this window on-device;
  the same consolidation (one `reloadAllTimelines` per flip) is the leading
  candidate fix for BOTH G.1 and G.2. Re-assess the residual delay after
  the G.1 layout fix lands. Sim note: on iOS 18.5 sim placements render
  within seconds (owner witnessed), so ~60 s is largely a DEVICE/
  reload-latency phenomenon.
- **2026-09-24 update (owner, on the XS at 1.27.337)**: still open, and now
  about **5 s** rather than ~60 s, seen both on placement and while PREVIEWING
  the widget in the picker. The owner asked whether session 17's horizon rise
  from 14 to 30 days caused it: it did NOT. The XS was running 1.27.337, whose
  `TIMELINE_DAYS` is 14, and session 17's build was never installed on it. The
  horizon cannot be the cause and shortening it is not a fix; the horizon was
  separately dropped to 7 days for its own reason (widget survival without
  background refresh), which leaves this unchanged. Queued as its own row, and
  read together with the row that flips the iOS widgets flag on, because that
  flip is what makes this user-visible.

## H. UI bugs (2026-09-09)

### 39. [OPEN, queued as row 15] Android's dark widget palette never matched iOS

- **Found**: 2026-09-24, the owner comparing the two platforms side by side.
- **Symptom**: the Android dark card is a bright, vibrant purple; the iOS dark card is a very
  dark near-black navy. The owner wants Android to match iOS exactly.
- **Cause**: two separate literals that were never reconciled. iOS's `DARK.card` in
  `widgets/PrayerWidget.tsx` is `rgba(2, 13, 38, 0.95)`; Android's `CARD_DARK` in
  `scripts/generate-widget-assets.py` is `#252387`. Android's card is a pre-rendered opaque
  bitmap (Glance draws no rounded corners, strokes or shadows), so it carries its own colour
  rather than reading the layout's palette. `shared/__tests__/widgetAssets.test.ts` pins the
  script's literals as a SUBSET of the layout palette, which a drifted-but-present colour
  satisfies.
- **Fix**: composite the iOS colour over black for the opaque equivalent, and audit the rest of
  the dark palette for the same drift rather than the card alone.

### 40. [OPEN, queued as row 15] The Android active pill overhangs the times

- **Found**: 2026-09-24, the owner on an Android phone: "perfectly aligned on the left, but on
  the right side, it's extended even further out."
- **Symptom**: the active-row background extends past the prayer times on the right, while
  looking correct on the left. It worsens as the screen widens.
- **Cause (arithmetic)**: in the medium composition the pill is `fillMaxWidth()` inside a Box of
  `width(LIST_WIDTH)`, so it spans the whole list column, while the rows sit in a sibling column
  padded `APad(12, 0, 12, 0)`. The name and time columns do not fill the remainder, so the slack
  lands to the right of the times: 21dp at a 310dp grant, 27dp at 360dp, 31dp at 400dp. The left
  edge reads as a deliberate 12dp inset, which is why only the right looks wrong.
- **Distinct from the 2026-09-19 finding** already covered by
  `bounds the active pill to the list column, not the card remainder`: that bounded the pill to
  the COLUMN, and this is the pill inside that column, so the guard tightens rather than changes.
- **Owner ruling**: bound the pill to the text, keeping equal breathing room each side.

### 38. [OPEN, queued as row 15d] Android widgets clip their prayer names on any launcher but the 3T's

- **Found**: 2026-09-24, the owner placing the widgets on the Oppo Find X8, the second
  Android phone they have ever been on. The 3T has been the only Android reference since
  session 15b, so "it works on Android" has always meant "it works on one launcher".
- **Symptom**: the medium kinds render with prayer names sliced off on the LEFT. `Sunrise`
  reads `se`, `Dhuhr` reads `ar`, `Magrib` reads `ib`; the dark extras medium reads `ight`,
  `Third`, `or`. Fajr and Isha are missing entirely. Times, palette, pill and hero are all
  correct, so this is clipping, not a data or render failure. The small kind is structurally
  fine but its letters sit wider apart.
- **Cause (arithmetic, not the OEM)**: `HERO_WIDTH` 170dp plus `LIST_WIDTH` 162dp is 332dp
  of fixed content inside a provider declared `android:minWidth="310dp"`, before
  `APad(13, 13, 20, …)` padding. `minWidth` is a floor the launcher must respect, not a
  width it will grant. A launcher granting close to the declared minimum overflows the
  `Row` and Glance clips its first child. The 3T passed by coincidence.
- **Compounding factor**: the X8 runs a display-size override (`Physical density: 560`,
  `Override density: 480`). Text scales with the override; the hardcoded dp boxes do not.
  That is the owner's "too much letter spacing" and "a little bit too big".
- **Why the constants are fixed**: the source comments record the history. A `fillMaxWidth`
  fraction on the first `Row` child starved the list to zero width on the 3T
  (`widgets/PrayerWidget.tsx:207`), and three separate fill/overlay two-column attempts
  mislaid the times (:372-379). The fix for one launcher became the bug on the next.
- **Owner ruling (2026-09-24)**: the widgets are meant to be dynamic across phone, tablet
  and both platforms. Do NOT fix this by tuning a second set of constants against the X8.
- **NOT this issue**: widget taps failing to open the app. Confirmed on both Android phones
  and tracked as queue row 15c; AGENTS.md records the likely cause (expo-widgets routes taps
  for layout buttons only).
- **Evidence**: `ai/features/android-widgets-x8/FINDINGS.md`, with the broken X8 screenshot
  and the owner's iOS reference look beside it.
- **Session brief**: `ai/prompts/android-widget-proportional-sizing.md` (queue row 15d).

### 27. [OPEN, found 2026-09-10, presentation-rearchitecture session] Prayer list shows only one row for a period after a day-roll cascade instead of the full six

- **Symptom (S23, Android 16, mock data, Release build)**: after the sequence cascades past the final prayer of one day into the next (observed via the mock rig's compressed near-term window), the list briefly renders only the new day's Isha row — Fajr, Sunrise, Dhuhr, Asr, and Magrib are entirely absent, not dimmed or collapsed. The countdown hero and date header are correct and the countdown ticks correctly (confirmed across two captures 5 minutes apart, decrementing by exactly 5 minutes). A fresh cold relaunch (which reseeds the mock) showed the full six-row list correctly; continuing to watch the same process past that point also self-resolved to six rows once the display date advanced further into the new day. Not yet confirmed whether this reproduces on real (non-mock) data or only at the specific moment the display date first rolls over.
- **Where to look**: `components/prayer/List.tsx:33`, `components/prayer/ActiveBackground.tsx:24`, `hooks/usePrayer.ts:36`, and `hooks/useSchedule.ts:35` all independently filter `prayers` to `p.belongsToDate === displayDate`; `displayDate` is the `belongsToDate` of the next future prayer (`stores/schedule.ts:184`). Since only Isha rendered, either `displayDate` was set to a value that only Isha's entry matches, or the other five prayers of the same intended day were computed with a different `belongsToDate` than Isha's. `calculateBelongsToDate` (`shared/prayer.ts:141`) only special-cases Isha before its early-morning cutoff hour, which does not apply here (the observed Isha was at 21:31, not early morning) — the mismatch is not explained by that rule, and is not a mock-authoring artifact either (`mocks/simple.ts` stamps one `date` per whole day-block, so a per-prayer date mismatch in the raw fixture is structurally impossible). Root cause not yet found; likely in how the sequence is built or how `displayDate`/`getNextPrayer` is selected across the cascade, in `stores/schedule.ts`.
- **Out of scope for the presentation-rearchitecture fix** (ai/features/presentation-rearchitecture/): this is a schedule/sequence data-layer question, not a Reanimated/animation-ownership one — flagged here rather than folded into that session's work.
- **Verify**: reproduce on the mock rig by watching a day-roll happen live (or forcing one), screenshot immediately after and once more a few minutes later; separately check whether this reproduces against real API data near a real day boundary.

---

## J. Release distribution & the update prompt (2026-09-12)

### 35. [OPEN, needs its own session] The update prompt depends on a hand-edited file on GitHub, and one failed fetch costs a whole day's check

Raised by the owner on 2026-09-12, during the upgrade-research session: *"I really don't
like having to manually update the releases.json after releasing to the store... if I have
like a million users it's not scalable... does the app break if GitHub errors?"* Researched
read-only, no code changed. This entry records the findings so the decision session does
not start cold.

**How it works today.** `device/updates.ts` fetches a store version once per 24 hours
(`TIME_CONSTANTS.ONE_DAY_MS`, throttled through `getPopupUpdateLastCheck`), compares it to
`Constants.expoConfig.version` with `isNewerVersion` from `shared/versionUtils.ts`, and
sets `popupUpdateEnabled`. Two sources feed it:

- **Production iOS**: `https://itunes.apple.com/lookup?bundleId=com.mugtaba.athan&country=gb`.
  Fully automatic already. No manual step exists on this path.
- **Everything else** (production Android, UAT iOS, UAT Android):
  `https://raw.githubusercontent.com/capt-muji/rn.athan.uk/main/releases.json`, hand-edited
  on `main` after each store release.

It is called fire-and-forget from `app/index.tsx:101`, inside a `setTimeout(..., 1500)`:
`checkForUpdates().then((hasUpdate) => setPopupUpdateEnabled(hasUpdate))`.

**Question 1: does the app break if GitHub errors? No.** `getStoreVersion()` wraps both
fetches in `try/catch` and returns `false` on any failure, including a 429, a 404, a DNS
failure and malformed JSON. `checkForUpdates()` returns `false` when the store version is
falsy, and it is never awaited on the render path. A GitHub outage produces no popup and no
other symptom. That part of the design is sound.

**Two real defects found while confirming that**, both small, both in `device/updates.ts`:

1. **A failed check burns the 24-hour window.** The `finally` block runs
   `setPopupUpdateLastCheck(now)` unconditionally, so a fetch that threw is recorded as a
   check that happened. A user who launches the app with no signal, which this app is
   explicitly designed to support offline, silently loses that day's check. The stamp
   belongs on the success path, or the throttle needs a shorter retry interval after a
   failure.
2. **Neither fetch has a timeout or an `AbortController`.** A hung connection leaves a
   pending promise for the life of the process. Harmless in practice because nothing awaits
   it, but it means the check neither resolves nor retries within the day.

A third, lower: `openStore()` uses `market://details?id=...` on Android with no
`https://play.google.com/...` fallback. On a device without the Play client,
`Linking.openURL` throws and the failure is only logged, so the button does nothing.

**Question 2: scale and rate limits.** GitHub announced on 2025-05-08 that unauthenticated
rate limits now cover `raw.githubusercontent.com` downloads, and does not publish a number
for raw. The limits are IP-based and abuse-triggered rather than a documented quota. The
shape of the exposure is not what it first looks like: each phone is its own IP making at
most one request per 24 hours, so a million users is a million IPs at one request a day,
not a million requests from one source. The real objections are different and still
decisive:

- `raw.githubusercontent.com` carries no SLA and is not intended as a configuration CDN.
- The limit is IP-based, so users behind carrier-grade NAT share one bucket.
- A file on `main` is a deploy channel with no staging, no rollback and no review gate.
- It is a manual step after every release, which is the failure mode the owner actually
  cares about: forget it and nobody is ever prompted.

**Question 3: can it read the stores directly? Per platform.**

| Channel | Automatic today? | Best available approach |
|---|---|---|
| Production iOS | **Yes** | Already on iTunes Lookup. Two improvements: drop the hard-coded `country=gb`, since a user in another storefront gets a wrong or empty result, and note the listing can lag a release by hours |
| Production Android | No | **Google Play In-App Updates.** Google removed the public "latest version" API deliberately; the sanctioned replacement asks Play itself. It supports a flexible or an immediate flow entirely in-app, with no store redirect. `expo-in-app-updates` (0.12.0, peer `expo: "*"`) wraps it with a config plugin and exposes `checkForUpdate()`, `startUpdate()`, `checkAndStartUpdate()` and update listeners. It also covers iOS by wrapping the same iTunes Search lookup |
| UAT iOS (TestFlight) | No | **No public API exists.** A hosted JSON is the only option |
| UAT Android (internal test) | No | **No public API exists.** Internal-test versions are not publicly queryable |

**Recommended shape**, for the decision session to accept or reject: move production
Android onto Play In-App Updates, keep production iOS on iTunes Lookup, and let
`releases.json` survive as a **testers-only** file. That removes the manual step from every
production release, which is the owner's actual complaint, and it collapses the scale
question entirely, because the remaining consumers are a handful of testers rather than the
whole user base.

**Known constraint on verifying it**: Play In-App Updates only works for builds installed
from Play. A side-loaded `fleettest` APK on the 3T cannot exercise it, so acceptance needs
an internal-test-track install.

**Not done this session.** Session 1 of the upgrades programme is research-only and adds no
dependency. `expo-in-app-updates` is a new native dependency on the release path and
deserves its own session with its own device verification.

---

## Fixed (index)

One line each; full detail is in git history. The numbers are permanent — other files
reference them (`ISSUES #NN`, `F.x`, `G.x`). A status word other than `fixed` marks how the
issue closed (accepted, wontfix, superseded, mitigated, reverted, cleared, closed,
characterised).

- #1 — Empty-year API response treated as success (fixed)
- #2 — All-or-nothing December dual-year fetch (fixed)
- #3 — Redundant cache wipe + full current-year refetch on every December retry (fixed)
- #4 — Jan 1 redundant previous-year fetch, non-seamless path only (fixed)
- #5 — Dec 31 derived times used same-day Fajr fallback (superseded)
- #6 — Old-year records linger ~13 months by design, nothing reads them (accepted)
- #7 — 2-day rolling notification horizon is the ceiling; platform split rejected (wontfix)
- #8 — Background task never ran: minimumInterval seconds-vs-minutes bug + re-arm starvation (fixed)
- #9 — ADR-007 documentation drift + registration gap (fixed)
- #11 — ±60s EARLY fires are device clock skew, not app-fixable (wontfix)
- #12 — Double notifications from the orphan-alarm race (fixed)
- #13 — Shipped Android manifest never verified (closed)
- #14 — Exact-alarm / power-state observability module (wontfix)
- #15 — Zero-notification window during global reschedule (fixed)
- #16 — iOS 64-pending cap constrains any horizon increase (wontfix)
- #18 — Android force-stop cancels scheduled alarms; recovery is next app open only (accepted). Re-measured 2026-09-23 on the 3T: 4 armed, 1 survived — the imminent `setAlarmClock` one. A single-alarm test can therefore show a survivor and read as "force-stop is harmless"; the buffer is still destroyed and the recovery rule is unchanged
- #19 — 8T lost the WorkManager chain + alarms on every reboot unless OnePlus Auto-launch is enabled (mitigated). Recurred 2026-09-23 on the user's 8T: see #36, which is the part that is ours to fix
- #20 — Post-reboot headless background-task body never completes; reboot persistence is chain-only (accepted)
- #21 — Android 9 TLS 1.3-only API blocked every real fetch (fixed)
- #22 — "Sunrise" wrapped to two lines on the 3T (fixed)
- #23 — Extras at-time notifications played the athan sound instead of the Extras sound (fixed)
- #24 — Splash held through the entire first-launch fetch (fixed)
- #25 — Sound-sheet preview dead on first tap after natural clip completion (fixed)
- #26 — Android overlay dimmed the header / dropped "London, UK" (closed)
- #28 — Fetch on a clock-change-eve Saturday shifted every Midnight/Last Third 20–40 min (fixed)
- #29 — Extras Midnight/Last Third were a night late; alerts could fire on another night than their row (fixed)
- #30 — Phone in another timezone read London's calendar from the phone's clock (fixed)
- #31 — Stop-gap list skipped today's prayers after 3+ days backgrounded (fixed)
- #32 — 3T cold launch 6.6 s; 3.1 s TLS provider install, ~1.9 s JS path (characterised)
- #33 — One-in-sixty flaky test from an unpinned fake clock (fixed)
- #34 — App update cancelled every armed alert, then stayed quiet 12 h (fixed)
- F.1 — Render crash selecting a prayer during a schedule refresh (fixed)
- F.2 — @expo/ui community bottom sheets migration (reverted)
- F.3 — Per-prayer alert config is index-keyed, not name-keyed (accepted)
- F.4 — Friday Extras display order differed from the canonical array (fixed)
- F.5 — Global font-scaling guard dead code on SDK 57 / React 19 (fixed)
- F.6 — Countdown final-seconds intermittent stretch from setInterval drift (fixed)
- F.7 — Android minute-boundary skew, status bar vs countdown (fixed)
- F.8 — Biome useExhaustiveDependencies backlog, 77 warnings (cleared)
- F.9 — Overlay rendered ~70px high via @expo/ui pager's shifted coordinate space (fixed)
- F.10 — Android overlay one status-bar too low after edge-to-edge (fixed)
- G.3 — Settings toggle thumb desynced from track/value (fixed)
- G.4 — Sound preview silent on iOS device: 32 concurrent AVPlayers + no audio mode (fixed)
- G.5 — Sound preview countdown not displaying (fixed)
- G.6 — App-wide sluggishness on device (accepted)
- G.7 — widgetSettingsSync flaky third push ~1–2% of runs (fixed)
- G.8 — Rapid settings-toggle crash (fixed)
