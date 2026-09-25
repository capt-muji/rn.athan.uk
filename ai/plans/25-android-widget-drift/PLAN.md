# Plan: Session 25. The Android widget freezes when the OS kills the app

| Field | Value |
| --- | --- |
| Brief | `ai/plans/25-android-widget-drift/FINDINGS.md` (this session's own investigation) |
| Planned at | `02b063f6` (version 1.28.16), 2026-09-25 |
| Planned by | Planning session on 2026-09-25 |
| Needs first | nothing |
| Steps | 3, each one branch, one commit, one version |
| Device | OnePlus 3T `8f7ada76`, local production build. The Find X8 is the owner's and gets a diagnostic, not a build |
| Owner decisions still needed | None (every one was taken 2026-09-25; see section 2) |

## 1. Goal

An Android widget stops updating the moment the OS kills the app, and never recovers by itself. The
owner saw it on the OPPO Find X8: a medium widget read `8h 25m` when the truth was `8h 1m`, about 24
minutes late. `FINDINGS.md` reproduced it on the 3T by force-stopping the app: the alarm count went 3 to
**0**, the label froze at `1h 54m` while the truth walked from `1h 53m` to `1h 51m`, and the error grew
one minute per minute of suspension, always showing too much time remaining.

When this plan is DONE, three things are true: opening the app always re-arms the tick, the widget cannot
go stale at all while the screen is on and the app is alive, and a killed app has its tick restored
within about 15 minutes without the owner touching anything. The owner notices by the widget agreeing
with the app's own countdown after leaving the phone alone for hours.

The owner's rules that apply:

- 🐋  "it is very, very crucial that the widgets stay in sync. Otherwise they are absolutely useless to
  everyone."
- 🐋  "Don't do any hacks. Don't do any tricky stuff. Just make it work... We don't want any drift."
- No PR or patch against expo-widgets or any Expo package (owner, 2026-09-25).
- The `6h 8m` format is KEPT. No `Chronometer`, for the reason in `FINDINGS.md` section 6.

## 2. Decisions

### 2.1 Taken

1. **All four layers ship** (owner, 2026-09-25 22:38), because each covers a different failure window:
   the unconditional re-arm heals on app open, `TIME_TICK` makes staleness impossible while the app is
   alive and the screen is on, the watchdog covers a killed app, and the diagnostic measures what
   ColorOS really allows on the X8.
2. **The format stays `6h 8m`, and no `Chronometer` is built** (owner, 2026-09-25, reversing their
   earlier approval once `FINDINGS.md` section 6 showed a Chronometer cannot retarget the next prayer and
   would reach zero on a passed one).
3. **`BACKGROUND_TASK_INTERVAL_HOURS` stays at 3** (owner question answered, `FINDINGS.md` section 10).
   The watchdog is a second, near-free job, not a re-tuning of the existing task.
4. **15 minutes is the watchdog's period because Android forbids less**:
   `PeriodicWorkRequest.MIN_PERIODIC_INTERVAL_MILLIS = 900000`, read from the resolved
   `work-runtime-2.9.1-api.jar`. A shorter request is silently clamped.
5. **WorkManager is the watchdog vehicle**, at `androidx.work:work-runtime-ktx:2.9.1`, the exact version
   `expo-background-task` already puts in the build. Measured on the 3T: a force-stop leaves the alarm at
   0 while WorkManager's jobs survive. No new dependency reaches the app, and no Expo package is patched.
6. **`ensureArmed`'s `FLAG_NO_CREATE` guard is deleted, not repaired** (planner). `FINDINGS.md` section 3
   measured that the PendingIntent survives a force-stop while the alarm does not (1 versus 0), so the
   guard reads a signal that does not track what it claims. `setExactAndAllowWhileIdle` replaces an
   existing alarm, so arming unconditionally is idempotent and the guard protects nothing.
7. **`TIME_TICK` is registered at runtime, never in the manifest** (planner). Android blocks the manifest
   form from API 26, and the app's `minSdk` is 24, so a manifest entry would work on two API levels and
   silently stop on every later one. The receiver lives with the module's own lifecycle.
8. **The watchdog only re-arms; it never renders** (planner). Rendering is the alarm's job. A watchdog
   that also pushed would double every render on a healthy phone for no gain.

### 2.2 The executor must not decide

STOP and ask the owner when any of these happens.

1. **Any anchor count other than 1.** NEEDS REPLAN, per `EXECUTOR-BRIEF.md` section 1, item 4. Name the
   anchor and quote the pre-flight.
2. **A Gradle sync or build failure mentioning `androidx.work`.** Ask: "Adding
   `androidx.work:work-runtime-ktx:2.9.1` to `modules/widgetrefresh` failed with `<the error line>`. Is
   the version wrong for this build, or should the watchdog use a different vehicle?"
3. **A test fails that this plan does not name.** Ask: "Test `<name>` failed and the plan does not
   predict it: `<first failing line>`. Is this a real defect in what I wrote?"
4. **The break script prints `BREAK NOT APPLIED` or `NOT CAUGHT`.** As `EXECUTOR-BRIEF.md` section 7
   says; widen the test once for `NOT CAUGHT`, then ask.
5. **The device proof in section 7 shows the widget still frozen after a force-stop and 20 minutes.**
   Ask: "The watchdog did not restore the tick on the 3T within 20 minutes. `dumpsys jobscheduler` shows
   `<state>`. Should the watchdog change vehicle, or is a longer bound acceptable?"
6. **Coverage below 100% on any changed TypeScript file.** Add the test; never add an ignore comment.
7. **Anything the step does not answer that you would otherwise decide.** Ask: "The plan does not say
   `<X>`. What should it be?"
8. **Anything touching visuals, a prayer time, `releases.json`, `uat` or EAS.** The widget's rendered
   output must not change at all in this plan: it fixes WHEN a render happens, never what it draws.

## 3. Pre-flight

Save and run `ai/plans/25-android-widget-drift/scripts/preflight.sh`:

```bash
cp ai/plans/25-android-widget-drift/scripts/preflight.sh "$TMPDIR/preflight-25.sh"
bash "$TMPDIR/preflight-25.sh" 1
```

It checks the checkout and branch, a tree holding only this plan folder, that `uat-2` descends from
`origin/uat-2`, the `package.json` version, that the 3T answers `device`, that every anchor counts
exactly 1, and that `androidx.work:work-runtime-ktx:2.9.1` is the version `expo-background-task` resolves.
It ends `PREFLIGHT OK`.

## 4. Background the executor needs

### Code map

| File | What it does | This plan |
| --- | --- | --- |
| `modules/widgetrefresh/android/.../WidgetRefreshScheduler.kt` | Arms the minute alarm, re-renders placed widgets, patches size props | `ensureArmed` loses its guard; gains `isTickAlive` and the watchdog's enqueue |
| `modules/widgetrefresh/android/.../WidgetRefreshReceiver.kt` | The minute tick: re-render, then re-arm | Unchanged |
| `modules/widgetrefresh/android/.../WidgetRefreshBootReceiver.kt` | Re-arms after boot and package replace | Also enqueues the watchdog |
| `modules/widgetrefresh/android/.../WidgetRefreshModule.kt` | The JS-facing `armWidgetRefreshChain` | Also starts the watchdog and the tick listener |
| `modules/widgetrefresh/android/.../WidgetRefreshWatchdogWorker.kt` | **New.** The 15-minute re-arm check | Step 2 |
| `modules/widgetrefresh/android/.../WidgetRefreshTickListener.kt` | **New.** The runtime `TIME_TICK` receiver | Step 3 |
| `modules/widgetrefresh/android/build.gradle` | The module's Gradle config | Gains the WorkManager dependency |
| `modules/widgetrefresh/index.ts` | The JS binding | Unchanged in signature; its doc comment gains the watchdog |

Anchors are under `ai/plans/25-android-widget-drift/scripts/anchors/`, with line numbers at `02b063f6`
as hints only. Find each place by its anchor text.

### How the pieces interact

| Trigger | Today | After this plan |
| --- | --- | --- |
| App open (a JS push) | `ensureArmed`, which the guard can make a no-op | Arms unconditionally, and enqueues the watchdog |
| Minute alarm fires | Re-render, re-arm | Unchanged |
| OS force-stops the app | Alarm destroyed, PendingIntent survives, chain dead forever | Watchdog re-arms within about 15 minutes |
| Screen on, app alive | Only the alarm ticks | `TIME_TICK` also re-arms every minute, so a lost alarm is invisible |
| Reboot or package replace | Boot receiver re-arms | Also re-enqueues the watchdog |

### Existing tests over this code

There are none for the Kotlin: `modules/widgetrefresh` has no test source set, and the repo's Jest
projects cover TypeScript only. The JS binding `modules/widgetrefresh/index.ts` is covered indirectly by
`stores/__tests__/widgetAndroid.test.ts` and `widgetAndroidFlagOff.test.ts`, which assert that
`armWidgetRefreshChain` is called after an Android push. Those must keep passing untouched.

**This is why section 7's device proof is the real acceptance for steps 1 to 3**, and why each step's
break script works on the Kotlin by substitution rather than by unit test.

### Why the obvious simple fix is wrong

Making the watchdog period 1 minute is the intuitive fix and Android refuses it: the request is clamped
to 15 minutes (decision 4). Raising the existing 3-hour background task's frequency instead would pay a
heavy job's cost for a trivial check, and would still leave the `FLAG_NO_CREATE` guard blocking recovery,
which is the actual defect.

## 5. Design

**The invariant, as one sentence a test can check:** after anything destroys the tick alarm, the alarm is
armed again by the next app open, the next system minute while the app is alive, or the watchdog within
its period, and `dumpsys alarm` proves it.

**The approach.** Three independent revivers over one unchanged tick mechanism. The tick stays exactly as
it is, because `FINDINGS.md` section 1 measured it re-arming correctly every minute and rejoining the
wall-clock grid after a late fire. What is missing is any way to notice the alarm has been destroyed, so
each step adds one notice-and-revive path at a different level of the platform.

**Alternatives rejected:**

| Alternative | Why not |
| --- | --- |
| Native `Chronometer` | `FINDINGS.md` section 6: it cannot retarget the next prayer, so it would reach zero on a passed one and keep the stale name and time. Also costs the `6h 8m` format |
| `setRepeating` instead of a self-re-arming chain | A repeating alarm is still destroyed by force-stop, so it does not remove the watchdog. Worth revisiting later, out of scope here |
| Shorten the 3-hour background task | Pays a heavy job's price for a cheap check, and leaves the real defect (the guard) in place |
| `TIME_TICK` in the manifest | Blocked from API 26; would work on 24 and 25 only and silently stop above |
| A foreground service to guarantee the tick | Play policy forbids a service without matching user-facing functionality (`ai/AGENTS.md`, the 2026-09-10 background-ticking ruling) |

**Design review.** Reviewed by the planning session against the measurements in `FINDINGS.md`. Three
things it changed:

1. The first draft repaired `ensureArmed` to query AlarmManager for a live alarm. There is no such API
   below API 31 (`AlarmManager.getNextAlarmClock` answers only for `setAlarmClock`), so the design
   became "arm unconditionally", which needs no query and is idempotent.
2. The first draft had the watchdog also re-render. Dropped: the alarm renders, and a watchdog that
   rendered would double every render on a healthy phone.
3. The first draft registered `TIME_TICK` in the manifest, which is inert from API 26. Moved to runtime
   registration in step 3.

## 6. Steps

- [ ] Step 1: Arm unconditionally, so an app open always heals the chain (specified)
- [ ] Step 2: A 15-minute WorkManager watchdog that survives the OEM kill (specified)
- [ ] Step 3: A runtime TIME_TICK listener, so a live app is never stale (specified)

Each step is one branch, one commit, one version, one review, one merge. The device proof in section 7
runs once, after step 3 merges, because the three layers are measured together.

### Step 1: Arm unconditionally

0. **Anchor check.** `bash "$TMPDIR/preflight-25.sh" 1` must print `PREFLIGHT OK`.
1. **Goal.** Delete the `FLAG_NO_CREATE` guard from `ensureArmed`, so every call arms the tick.
2. **Branch.** `git checkout -b fix/25-arm-unconditionally uat-2`
3. **Files.** `modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/WidgetRefreshScheduler.kt`,
   `app.json`, `package.json`, plus `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.
4. **Tests first (red).** None, and this is deliberate: the change is Kotlin, the module has no test
   source set, and the repo's Jest projects cover TypeScript only. The acceptance is the break script in
   part 7 and the device proof in section 7. Do not add a Kotlin test framework for this step.
5. **Change.** This step is **specified**.

   Replace `ensureArmed`'s body so it calls `armNext(context.applicationContext)` with no `PendingIntent`
   lookup, and delete the now-unused `FLAG_NO_CREATE` import if nothing else uses it.

   | Contract | Value |
   | --- | --- |
   | Name and signature | `fun ensureArmed(context: Context)`, unchanged, so the module and both receivers keep compiling |
   | What it answers | Nothing. It guarantees an armed tick alarm on return |
   | What it must never do | Query for an existing PendingIntent as proof of an armed alarm. That is the defect: a force-stop leaves the PendingIntent and destroys the alarm (measured 1 versus 0) |
   | Idempotence | `setExactAndAllowWhileIdle` on the same PendingIntent replaces the alarm, so repeated calls cost one system call and leave exactly one alarm |
   | Logs | None. This module writes no log lines today and this step adds none |

   The KDoc above `ensureArmed` currently reads "Arms the next minute-edge alarm when none is pending, so
   every caller may call freely." Replace it with a comment that says why it never checks first: a
   PendingIntent outlives the alarm it was registered with, so the only reliable arm is an unconditional
   one, and replacing an alarm is idempotent.

6. **Green.** `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0 (neither reads
   Kotlin, so this only proves nothing else broke). Then the Kotlin must compile, which part 7's script
   proves by building the module.
7. **Breaks.** `bash ai/plans/25-android-widget-drift/scripts/breaks-1.sh`. It asserts the source no
   longer contains `FLAG_NO_CREATE` in `ensureArmed`, that `ensureArmed` calls `armNext`, and that
   restoring the guard makes its check fail. It ends `ALL AS EXPECTED: 1`.
8. **Version and commit.** `node -p "const v=require('./package.json').version.split('.'); v[2]=+v[2]+1; v.join('.')"`,
   set in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). Add by name. Message:

   ```
   <VERSION> - fix(widgets): arm the Android tick unconditionally, so an app open heals it

   ensureArmed asked whether a PendingIntent existed and treated that as an
   armed alarm. Those are different objects with different lifetimes: a
   force-stop cancels the AlarmManager registration and leaves the
   PendingIntent record behind, so the guard saw a live reference, concluded the
   chain was healthy, and never re-armed. Measured on the 3T after a force-stop:
   PendingIntent records 1, armed alarms 0.

   Arming is now unconditional. setExactAndAllowWhileIdle replaces an alarm
   registered with the same PendingIntent, so this is idempotent and costs one
   system call.

   This is the same class of defect as the ISSUES #36 lesson already in
   ai/AGENTS.md: a stamp is not evidence that alarms exist.
   ```

9. **Review.** A `Code Reviewer` subagent, isolation `worktree`, prompt starting
   `Run git checkout --detach <sha>.`, asking it to confirm: `ensureArmed` no longer queries a
   PendingIntent, its signature is unchanged, arming is idempotent, no log line was added, the rendered
   widget output is untouched, and nothing beyond the file list changed. **If the owner's no-subagent
   instruction is still in force, the session performs this review itself against the same list and
   records in `LOG.md` that it did, with the evidence per item.**
10. **Merge.** `git checkout uat-2 && git merge --no-ff fix/25-arm-unconditionally -m "Merge fix/25-arm-unconditionally into uat-2: session 25 step 1, reviewed"`
11. **Done when.** `grep -c FLAG_NO_CREATE` on the scheduler returns 0, the break script ends
    `ALL AS EXPECTED: 1`, and `tsc` and Biome exit 0.

### Step 2: The 15-minute WorkManager watchdog

0. **Anchor check.** `bash "$TMPDIR/preflight-25.sh" 2` prints `PREFLIGHT OK`.
1. **Goal.** A periodic worker that re-arms the tick, so a killed app recovers without an app open.
2. **Branch.** `git checkout -b feat/25-watchdog uat-2`
3. **Files.** `modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/WidgetRefreshWatchdogWorker.kt` (new),
   `WidgetRefreshScheduler.kt`, `WidgetRefreshBootReceiver.kt`, `WidgetRefreshModule.kt`,
   `modules/widgetrefresh/android/build.gradle`, `app.json`, `package.json`, plus the three plan files.
4. **Tests first (red).** None, for the same reason as step 1. Acceptance is part 7 and section 7.
5. **Change.** This step is **specified**.

   **5a. `build.gradle`:** add `implementation 'androidx.work:work-runtime-ktx:2.9.1'` to the
   `dependencies` block, beside the existing `implementation project(':expo-modules-core')`. That exact
   version is what `expo-background-task` already resolves, so the app's graph does not change.

   **5b. `WidgetRefreshWatchdogWorker.kt`,** a new file:

   | Contract | Value |
   | --- | --- |
   | Class | `class WidgetRefreshWatchdogWorker(context: Context, params: WorkerParameters) : Worker(context, params)` |
   | `doWork()` | Calls `WidgetRefreshScheduler.ensureArmed(applicationContext)` when `WidgetRefreshScheduler.hasPlacedWidgets(applicationContext)` is true, then returns `Result.success()`. Returns `Result.success()` unchanged when no widget is placed |
   | What it must never do | Render a widget, push a snapshot, read prayer data, or touch the network. Rendering is the alarm's job, and a watchdog that rendered would double every render on a healthy phone |
   | Why `Worker` and not `CoroutineWorker` | The body is two synchronous calls; a coroutine would add a dispatcher for nothing |
   | Logs | None |

   **5c. `WidgetRefreshScheduler.kt`:** add two members.

   | Member | Contract |
   | --- | --- |
   | `private const val WATCHDOG_WORK_NAME` | `"expo.modules.widgetrefresh.watchdog"`. A unique name, so repeated enqueues collapse to one job |
   | `fun ensureWatchdog(context: Context)` | Enqueues a `PeriodicWorkRequestBuilder<WidgetRefreshWatchdogWorker>(15, TimeUnit.MINUTES)` through `WorkManager.getInstance(appContext).enqueueUniquePeriodicWork(WATCHDOG_WORK_NAME, ExistingPeriodicWorkPolicy.KEEP, request)`. **`KEEP`, never `UPDATE` or `REPLACE`**: `REPLACE` would restart the 15-minute period on every app open, so a phone opened often would never reach a run |

   15 minutes is the platform floor (`PeriodicWorkRequest.MIN_PERIODIC_INTERVAL_MILLIS = 900000`); a
   smaller number is silently clamped, so it is written as 15 and not as something hopeful.

   No `Constraints` are set. The default is no constraints, which is what a watchdog needs: requiring
   network or charging would withhold exactly the repair the user is waiting for.

   **5d. `WidgetRefreshModule.kt`:** in the `armWidgetRefreshChain` function, call
   `WidgetRefreshScheduler.ensureWatchdog(...)` on the same context, after `ensureArmed`. Update its
   comment to say the watchdog is what survives an OEM kill.

   **5e. `WidgetRefreshBootReceiver.kt`:** call `WidgetRefreshScheduler.ensureWatchdog(context)` beside
   the existing `armNext`, so a reboot restores the watchdog as well as the tick.

6. **Green.** `tsc` and Biome exit 0. The module compiles, proven by part 7.
7. **Breaks.** `bash ai/plans/25-android-widget-drift/scripts/breaks-2.sh`, asserting: the worker file
   exists and calls `ensureArmed`; `ensureWatchdog` uses `ExistingPeriodicWorkPolicy.KEEP` (a break
   switching it to `REPLACE` must be caught, since REPLACE is the subtle bug that would stop the watchdog
   ever firing on a frequently opened phone); the period is 15 minutes; the worker does not call
   `updateAll`. Ends `ALL AS EXPECTED: 1`.
8. **Version and commit.** As step 1. Message:

   ```
   <VERSION> - feat(widgets): a 15-minute watchdog that re-arms the Android tick

   An OEM battery manager force-stops the app, which destroys the tick alarm and
   leaves the widget frozen until the next app open. Measured on the 3T: after a
   force-stop the armed alarms go to 0 and the label froze at 1h 54m while the
   truth walked from 1h 53m to 1h 51m, one minute of error per minute of
   suspension.

   WorkManager survives what kills the alarm, which is the measurement this
   choice rests on: the same force-stop leaves the app's WorkManager jobs in
   place. It arrives with expo-background-task already, at the same
   work-runtime-ktx 2.9.1, so no new dependency reaches the app and no Expo
   package is patched.

   15 minutes is Android's floor for periodic work
   (PeriodicWorkRequest.MIN_PERIODIC_INTERVAL_MILLIS = 900000); a shorter period
   is silently clamped. The policy is KEEP rather than REPLACE so that a
   frequently opened app cannot restart the period before a run happens. The
   worker only re-arms: rendering stays the alarm's job.

   BACKGROUND_TASK_INTERVAL_HOURS is untouched at 3. This is a second, trivial
   job, not a re-tuning of the existing one.
   ```

9. **Review.** As step 1's part 9, checking additionally: `KEEP` is used, the period is 15 minutes, no
   constraints are set, the worker never renders, and the Gradle version matches
   `expo-background-task`'s.
10. **Merge.** `--no-ff`, message `Merge feat/25-watchdog into uat-2: session 25 step 2, reviewed`.
11. **Done when.** The break script ends `ALL AS EXPECTED: 1`; `tsc` and Biome exit 0.

### Step 3: The runtime TIME_TICK listener

0. **Anchor check.** `bash "$TMPDIR/preflight-25.sh" 3` prints `PREFLIGHT OK`.
1. **Goal.** While the app process is alive, re-arm on every system minute, so a destroyed alarm is
   invisible to the user.
2. **Branch.** `git checkout -b feat/25-time-tick uat-2`
3. **Files.** `modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/WidgetRefreshTickListener.kt` (new),
   `WidgetRefreshModule.kt`, `modules/widgetrefresh/index.ts`, `app.json`, `package.json`, plus the three
   plan files.
4. **Tests first (red).** None in Kotlin. `modules/widgetrefresh/index.ts` keeps its existing signature,
   so `stores/__tests__/widgetAndroid.test.ts` and `widgetAndroidFlagOff.test.ts` must keep passing
   unchanged; run both and confirm before and after.
5. **Change.** This step is **specified**.

   **5a. `WidgetRefreshTickListener.kt`,** a new file:

   | Contract | Value |
   | --- | --- |
   | Object | `internal object WidgetRefreshTickListener` |
   | `fun ensureRegistered(context: Context)` | Registers a `BroadcastReceiver` for `Intent.ACTION_TIME_TICK` on the application context, exactly once. Guarded by a private `@Volatile var registered = false`, so repeated calls register one receiver |
   | The receiver's body | Calls `WidgetRefreshScheduler.ensureArmed(context)` only when `WidgetRefreshScheduler.hasPlacedWidgets(context)` is true. **Nothing else.** It fires every minute while the app lives, so anything heavier is a battery complaint |
   | What it must never do | Render, push, or be registered in the manifest. `ACTION_TIME_TICK` is refused to manifest receivers from API 26 and `minSdk` here is 24, so a manifest entry would work on two API levels and silently stop above |
   | Logs | None |

   **5b. `WidgetRefreshModule.kt`:** call `WidgetRefreshTickListener.ensureRegistered(...)` inside
   `armWidgetRefreshChain`, beside `ensureArmed` and `ensureWatchdog`.

   **5c. `modules/widgetrefresh/index.ts`:** its doc comment describes only the alarm chain. Extend it to
   name all three revivers, so the next reader knows the JS call arms a tick, starts a watchdog and
   registers a minute listener. **The exported function's name, signature and behaviour do not change.**

6. **Green.** `npx jest stores/__tests__/widgetAndroid.test.ts stores/__tests__/widgetAndroidFlagOff.test.ts --watchman=false --selectProjects=unit`
   passes. `tsc` and Biome exit 0.
7. **Breaks.** `bash ai/plans/25-android-widget-drift/scripts/breaks-3.sh`, asserting: the listener file
   exists, it registers `ACTION_TIME_TICK` at runtime, it is NOT in any `AndroidManifest.xml`, it is
   guarded against double registration, and its body calls `ensureArmed`. Ends `ALL AS EXPECTED: 1`.
8. **Version and commit.** As step 1. Message:

   ```
   <VERSION> - feat(widgets): re-arm the Android tick on every system minute

   While the app process is alive, ACTION_TIME_TICK arrives every minute from
   the system and cannot be missed, so re-arming on it means a destroyed alarm
   is invisible: the next minute restores it. This is the layer that covers the
   window between the OS killing the alarm and the 15-minute watchdog noticing.

   Registered at runtime, not in the manifest: Android refuses ACTION_TIME_TICK
   to manifest receivers from API 26, and this module's minSdk is 24, so a
   manifest entry would work on two API levels and silently stop on every later
   one.

   The receiver body is one guarded call to ensureArmed and nothing else,
   because it runs every minute for the life of the process.
   ```

9. **Review.** As step 1's part 9, checking additionally: runtime registration only, no manifest entry,
   the double-registration guard, and a body that does nothing but re-arm.
10. **Merge.** `--no-ff`, message `Merge feat/25-time-tick into uat-2: session 25 step 3, reviewed`.
11. **Done when.** The break script ends `ALL AS EXPECTED: 1`, both named Jest suites pass, `tsc` and
    Biome exit 0.

## 7. Device proof

Runs once, after step 3 merges. The 3T, serial `8f7ada76`, on a local production build.

**Build and install.** The version must be bumped before the build, then:

```bash
zsh ~/athan-device-sweep/session3/bin/build-prod.zsh uat-2 ~/athan-device-sweep/session25/athan-<VERSION>-prod.apk
```

Success ends `BUILD-PROD OK`, in about 9 minutes. Run it in the background with its log and wait for the
notification.

**Before installing, verify the APK declares its widget providers** (`ai/AGENTS.md`, learned by shipping
a widget-less build):

```bash
AAPT=/Users/muji/Library/Android/sdk/build-tools/37.0.0/aapt
"$AAPT" dump xmltree <apk> AndroidManifest.xml | grep -oE '"com\.mugtaba\.athan\.[A-Za-z]+Provider"' | sort -u
```

Expect all 8 `*WidgetProvider` names. A bare `grep -c PrayerWidgetProvider` gives a false negative
because of the quoting, so use the pattern above.

Then `adb -s 8f7ada76 install -r <apk>` (expect `Success`), and launch with a DOUBLED `am start`.

**No clock change is needed in this proof, so `dumpsys alarm` is read for evidence rather than for
safety.** Every 3T dump also lists one app alarm at `when 2104803640505` (year 2036, not identified) plus
the `ACTION_FORCE_STOP_RESCHEDULE` entry; both are expected in every reading below.

### Check 1: an app open arms the tick (step 1)

```bash
adb -s 8f7ada76 shell am force-stop com.mugtaba.athan
adb -s 8f7ada76 shell dumpsys alarm | grep -c WidgetRefreshReceiver     # expect 0
adb -s 8f7ada76 shell am start -n com.mugtaba.athan/.MainActivity
# wait 20 seconds, then
adb -s 8f7ada76 shell dumpsys alarm | grep -c WidgetRefreshReceiver     # expect 1 or more
```

Before this plan the last reading was **0**, which is the bug. Save both readings to
`~/athan-device-sweep/session25/check1-app-open.txt`.

### Check 2: the widget keeps ticking while the app is alive (step 3)

Read the widget's own label from the launcher, three samples at least 70 seconds apart:

```bash
adb -s 8f7ada76 shell input keyevent KEYCODE_HOME
adb -s 8f7ada76 shell uiautomator dump /sdcard/w.xml
adb -s 8f7ada76 shell cat /sdcard/w.xml | grep -oE 'text="[0-9]+h [0-9]+m"|text="[0-9]+m"'
adb -s 8f7ada76 shell date '+%H:%M:%S'
```

Each label must equal the true remaining time to the prayer the widget names, computed from the DEVICE
clock read in the same second (the 3T runs about 3.3s behind this Mac, `ai/AGENTS.md`). The label must
decrease by one minute across each edge. `uiautomator dump` fails on roughly a third of attempts while
the countdown animates; retry rather than treating an empty result as a failure. Save to
`check2-live-ticking.txt`.

### Check 3: the watchdog revives a killed app (step 2)

This is the proof that matters, and it takes up to 20 minutes:

```bash
adb -s 8f7ada76 shell dumpsys jobscheduler | grep -c 'expo.modules.widgetrefresh'   # expect 1 or more
adb -s 8f7ada76 shell am force-stop com.mugtaba.athan
adb -s 8f7ada76 shell dumpsys alarm | grep -c WidgetRefreshReceiver                 # expect 0
```

Then poll every 15 seconds, in the background, for up to 20 minutes, recording each sample's clock and
alarm count, and stop at the first non-zero. Expect the count to reach 1 or more within about 15 minutes
without any app open. Save the whole series to `check3-watchdog.txt`: the series is the evidence, not
just the final reading.

WorkManager may be nudged for a faster verdict with
`adb -s 8f7ada76 shell cmd jobscheduler run -f com.mugtaba.athan <jobId>`, but **a forced run proves only
that the worker's body works, never that the schedule fires**, so the unforced series above is the real
check and a forced run is recorded separately if used (`ai/AGENTS.md`, the `-f` lesson from ISSUES #37).

### Check 4: no regression

`adb -s 8f7ada76 logcat -d -t 400 | grep -iE 'FATAL|AndroidRuntime'` prints nothing for the package, and
the widget's rendered content is unchanged from before the plan (same colours, same layout, same rows):
this plan changes WHEN a render happens, never what it draws.

### The X8 diagnostic (owner-run, layer 4)

The executor writes `~/athan-device-sweep/session25/x8-diagnostic.sh`, which the owner runs with the X8
connected to any Mac with adb. It must, with no clock change and no install:

1. print the app's version, standby bucket and battery-optimisation state;
2. print the armed `WidgetRefreshReceiver` alarm count and the `expo.modules.widgetrefresh` job count;
3. force-stop the app, then poll the alarm count every 15 seconds for 30 minutes, printing each sample;
4. print whether the count ever recovered, and after how long.

That series is what establishes ColorOS's real worst case, which this Mac cannot measure. The script only
reads and force-stops; it installs nothing and changes no setting.

**The phone is left** on the production build of this plan's version, automatic time on, and the app
opened once at the end so the tick is armed.

## 8. Records

**Findings text.** Add to `ai/features/uat-2/AUDIT-FINDINGS.md` under
`### Session 25: the Android widget froze when the OS killed the app`:

```
An Android widget stopped updating whenever the OS killed the app, and never recovered by itself. The
owner saw it on the Find X8 at about 24 minutes late; it was reproduced on the 3T by force-stopping the
app, which took the armed alarms from 3 to 0 and froze the label at 1h 54m while the truth walked from
1h 53m to 1h 51m: one minute of error per minute of suspension, always showing too much time remaining.

The root defect was that nothing could notice the alarm had died. ensureArmed asked whether a
PendingIntent existed and treated that as an armed alarm, but a force-stop cancels the AlarmManager
registration and leaves the PendingIntent behind (measured: 1 PendingIntent, 0 alarms), so the guard
reported health and never re-armed. Three revivers now cover three windows: arming is unconditional so
any app open heals it, ACTION_TIME_TICK re-arms every system minute while the process lives, and a
15-minute WorkManager watchdog re-arms after an OEM kill. WorkManager was chosen because it survives what
kills the alarm, and because expo-background-task already puts the same work-runtime-ktx 2.9.1 in the
build, so no new dependency and no Expo patch were needed.

DURABLE LESSON: a PendingIntent outlives the alarm it was registered with, so its existence is not
evidence that anything is scheduled. This is the ISSUES #36 lesson again in a new module ("a stamp is not
evidence that alarms exist"), which suggests the pattern to distrust is any health check that reads a
proxy instead of the thing it cares about.

Also recorded: the 6h 8m format is KEPT and no Chronometer was built. A Chronometer ticks in the
launcher's process and would fix a frozen label, but choosing the next prayer is JS logic over the
snapshot, so it would reach zero on a passed prayer and sit there with the stale name and time still
drawn. The owner approved the Chronometer first and reversed it on this evidence.

Device proof on the 3T at <VERSION>: <CHECK1>, <CHECK2>, <CHECK3>. Suite <TESTS_AFTER> at 100% on all
four measures.
```

**Table rows.** The executor sets `ai/plans/README.md` row 24 to EXECUTED. The `ai/prompts/README.md`
cell text for the auditor on PASS:
`DONE (session 25, <VERSION>): the Android widget tick now has three revivers; the 6h 8m format is kept.`

**Docs commit.** `<VERSION> - docs(plans): session 25 executed: three revivers for the Android widget tick`

## 9. Push

None. The executor never pushes (`EXECUTOR-BRIEF.md` section 2); the audit session pushes after PASS.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| An anchor counts 0 or more than 1 | `uat-2` moved under the plan | NEEDS REPLAN |
| Gradle cannot resolve `androidx.work` | The module needs the dependency added in step 2's 5a | Add it; if it still fails, section 2.2 item 2 |
| The build fails with a Kotlin error in the new files | A contract was mis-transcribed | Fix your own code against the contract; it is work to do, not a finding |
| `dumpsys alarm` still reads 0 after an app open | Step 1's change did not land, or the app crashed at launch | Check logcat for a fatal, then section 2.2 item 3 |
| The watchdog never fires within 20 minutes on the 3T | Doze, or the job was deferred | Record the series, then section 2.2 item 5. Do NOT use `-f` and call it proven |
| `uiautomator dump` returns nothing | Documented: it fails while the countdown animates | Retry; never read an empty dump as a frozen widget |
| The widget's colours or layout changed | Something beyond this plan's scope was touched | STOP. This plan changes only WHEN a render happens |
| `versionLockstep.test.ts` fails | The three versions differ | Set all three and commit again |
| Anything else | | `EXECUTOR-BRIEF.md` section 7 |

**Anticipated review fixes,** word for word, the only ones the executor may apply to what this plan
specifies:

1. If the reviewer says `ensureWatchdog` should use `ExistingPeriodicWorkPolicy.UPDATE` or `REPLACE`:
   keep `KEEP`, and reply that `REPLACE` restarts the 15-minute period on every app open, so a
   frequently opened phone would never reach a run.
2. If the reviewer says the `TIME_TICK` receiver belongs in the manifest: keep it at runtime, and reply
   that Android refuses `ACTION_TIME_TICK` to manifest receivers from API 26 while this module's `minSdk`
   is 24.
3. If the reviewer asks the watchdog to also re-render: keep it re-arming only, and reply that the alarm
   renders, so a rendering watchdog would double every render on a healthy phone.

**Stopping part-way.** Step 1: `git checkout --` the scheduler, `app.json`, `package.json`. Step 2: the
same plus `WidgetRefreshBootReceiver.kt`, `WidgetRefreshModule.kt`, `build.gradle`, and delete
`WidgetRefreshWatchdogWorker.kt`. Step 3: `git checkout --` `WidgetRefreshModule.kt`, `index.ts`, and
delete `WidgetRefreshTickListener.kt`. Then `EXECUTOR-BRIEF.md` section 4a.

## 11. Subagents in this plan

| Step | Agent type | Isolation | Why | Prompt |
| --- | --- | --- | --- | --- |
| 1, 2, 3 | `Code Reviewer` | `worktree` | The standing rule: every commit reviewed before merge | Each step's part 9 |

No model is named. **The owner instructed this session to use no subagents at all; while that holds, the
session performs each review itself against the step's list and records in `LOG.md` that it did so, with
per-item evidence.**

## 12. Report to the owner

Start with `Execution session` and a `Time:` line. Then: what the three layers do in plain words, the
three device checks with their readings, the X8 diagnostic and how to run it, anything still unproven
(ColorOS's real behaviour), and the four-line handoff from the `athan-next` skill.
