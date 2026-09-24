# Reboot re-arm — device evidence

Investigation opened 2026-09-23 after the 8T went silent for Magrib and Isha.
Every number below is read from a device, never inferred.

## Fleet

| Device | Serial | OS | App | Role |
| --- | --- | --- | --- | --- |
| OnePlus 8T | 543e5ac2 | Android 12, OxygenOS 12 (KB2003_11_C.36) | 1.24.1 | The user's phone, reported the fault |
| OnePlus 3T | 8f7ada76 | Android 9, OxygenOS (A3003_28_191104) | 1.27.323 (uat-2) | Control, free to reboot |
| iPhone XS | 00008020-0015585C22D2002E | iOS | — | Not yet exercised |

## 1. The 8T fault, as found

`dumpsys alarm` held 82 pending batches and not one belonged to the app.

| Check | Reading | Rules out |
| --- | --- | --- |
| `versionName` | 1.24.1, installed 2026-09-09 | — |
| `stopped=` | `false` | User force-stop |
| Process | alive, pid 26160 | Force-stop |
| `SCHEDULE_EXACT_ALARM` | `granted=true` | Permission revoke (ISSUES #10 suspect 1) |
| Standby bucket | 10 (ACTIVE) | Standby throttling |
| Device clock | matched the host to the second | ISSUES #11 clock skew |
| `zen_mode` | `0`, every Zen Log line `set_zen_mode: off` | Do Not Disturb |
| `Sleep` rule 22:00-07:00 | `enabled=FALSE` | Scheduled DND |
| `ringer mode muted streams` | `0x0`, `STREAM_NOTIFICATION` volume 14/16 | Silent mode |
| Channels | `mImportance=5`, `mDeleted=false` | Disabled notifications |

### The day, from usagestats

```
16:10:00  Asr posts on athan_18_v2          <- last notification of the day
~16:45    device reboots (bootreason: shutdown,userrequested)
16:45 to 18:50  no app process at all
18:50:48  user opens the app                 <- arms nothing
~18:58    Magrib passes in silence
~20:07    Isha passes in silence
21:51:09  app init runs, registers the task  <- still arms nothing
```

18 `ACTIVITY_RESUMED` events were recorded that day. None of them armed an alarm.

## 2. Reproduced on the 8T

```
am force-stop com.mugtaba.athan
am start -n com.mugtaba.athan/.MainActivity
```

After 30 seconds of foreground: **0 prayer alarms.** Logcat shows
`TaskService: Registered task 'NOTIFICATION_REFRESH_TASK'`, proving
`initializeNotifications` ran to completion and its sibling `refreshNotifications`
armed nothing. The 12-hour gate is shut and the alarms are gone.

## 3. The 3T control — the boot receiver works where the OEM allows it

Isha set to Sound, then rebooted at 22:52:13. **The app was never opened afterwards.**

| Moment | Reading |
| --- | --- |
| Armed before reboot | 2 alarms: `2026-09-23 22:55:00`, `2026-09-24 21:31:00`, `window=0` |
| Boot completed | 22:52:53 |
| App auto-started | 22:52:53.510, `Start proc 3581 for embryo` |
| Armed after reboot | same 2 alarms, same instants, `window=0` |
| Isha fired | **22:55:00.005**, `+5ms`, channel `athan_1_v2` |

```
22:55:00.005 AlarmManager: Triggering alarm #1 ... expo.modules.notifications.NOTIFICATION_EVENT
22:55:00.077 expo-notifications: Notification request "athan_standard_isha_2026-09-23" ... removing
22:55:00.107 notification_enqueue: ... Notification(channel=athan_1_v2 ...)
```

## 4. What the two devices together prove

`ExpoSchedulingDelegate.setupScheduledNotifications()` re-arms every stored request
from `SharedPreferencesNotificationsStore` on `BOOT_COMPLETED`, `REBOOT` and
`MY_PACKAGE_REPLACED`. The receiver is declared in expo-notifications' own manifest
and `RECEIVE_BOOT_COMPLETED` is held and granted on both phones (`prot=normal`, so
it is install-time and never prompts).

The mechanism is sound. The 3T runs it and delivers at +5ms. The 8T never ran it,
because OxygenOS 12 withheld the broadcast and left no app process for two hours.

So there are two defects, not one:

1. **Ours.** After alarms are lost, the 12-hour gate keeps skipping the reschedule,
   so every app open is a no-op. This is the one that kept the 8T silent through
   18 app opens. Audit finding 59 (ISSUES #18) reached by reboot rather than by
   force-stop.
2. **The OEM's.** Aggressive Android skins suppress the boot broadcast. Our own
   receiver would be suppressed identically, so this is a ceiling, not a bug to fix.

Defect 1 is fixed on uat-2 by `f857dab0` (1.25.30, `reopenRefreshGateOnColdLaunch`),
which the 8T's 1.24.1 predates. Defect 2 is what remains open.

## 5. Fallback channel, answered

Three notifications posted to `expo_notifications_fallback_notification_channel`
(00:09, 01:52, 07:05). Not mute and not DND, both ruled out above.

The cause is audit finding 5. In 1.24.1 `initializeNotifications` creates only
`athan_1_v2` (hardcoded index 0) and `extras_at_time`; the user's sound is index 17,
so `athan_18_v2` exists only because the sound sheet created it. Anything scheduled
before its channel exists is posted to a channel that is absent, and
expo-notifications 57 substitutes the fallback, which carries the device's default
tone at `mImportance=4` instead of the athan at MAX. It rings, so nothing looks
broken.

Fixed on uat-2 by `1056473a` (1.25.35), which creates the selected athan channel at
schedule time. Finding 63 separately proved on the 3T that Silent alerts landing on
the fallback stay silent, so the fallback is a wrong-sound defect, not a
silent-alarm one.

## 6. Settings ruled out by the owner

Battery optimisation, Deep Optimisation, Adaptive Battery and Sleep Standby
Optimisation are not an acceptable fix: the toggles differ across every Android skin
and version, most users cannot find them, and there is no API to set them. The fix
must hold with those untouched.

## 7. The uat-2 cold-launch fix, proven on the 3T

`count-alarms.sh` (this folder) deduplicates on the `Alarm{<id>}` object, because the
dump repeats each alarm under "Next wake from idle" as well as inside its batch and a
plain `grep -c` double-counts.

Magrib and Isha set to Sound, then:

| Step | Prayer alarms | Detail |
| --- | --- | --- |
| Armed, app open | **4** | 23:07, 23:08 today; 20:19, 21:31 tomorrow |
| After `am force-stop` | **1** | only the 23:07 survivor |
| After cold launch | **4** | 23:08, 23:09 today; 20:19, 21:31 tomorrow |

The restore needs `reopenRefreshGateOnColdLaunch` (1.25.30): the stamp was minutes old,
so without it `refreshNotifications` would have skipped and left the count at 1. The 8T
on 1.24.1 does exactly that, reproduced below.

## 8. The 8T, reproduced on demand

```
am force-stop com.mugtaba.athan
am start -n com.mugtaba.athan/.MainActivity   (doubled, as the install ritual requires)
```

After 30 seconds in the foreground: **0 prayer alarms**, while logcat shows
`TaskService: Registered task 'NOTIFICATION_REFRESH_TASK'` proving
`initializeNotifications` ran. Same phone, same session, the fix absent.

## 9. ISSUES #18 holds, with one qualification

Force-stop cancelled 3 of the 4 alarms. It did not cancel the imminent one (23:07,
`flags=0x3`, carrying an `Alarm clock:` block, so `setAlarmClock()`). One survivor out
of four is not a reprieve: the buffer is still destroyed and #18's "recovery is next app
open only" stands. Worth recording because a single-alarm test can read as "force-stop is
harmless" and conclude the opposite of the truth.

## 10. What is actually left to fix

Option D from the brainstorm is already in the code. `device/tasks.ts` calls
`rescheduleAllNotificationsFromBackground`, which goes straight to
`_rescheduleAllNotifications` and never consults `shouldRescheduleNotifications`.
The background task has always ignored the twelve-hour gate. Nothing to change.

So after the cold-launch fix, exactly one hole is left, and it is the one the 8T fell
into:

| Layer | After a reboot, app never opened | Evidence |
| --- | --- | --- |
| expo boot receiver | Runs on the 3T, suppressed on the 8T | §3 vs §1 |
| WorkManager background task | Survives the reboot, but the next run is up to `BACKGROUND_TASK_INTERVAL_HOURS` away | 8T `JOB #u0a668/249`, `Minimum latency: +5h59m59s998ms` |
| Cold-launch re-arm | Needs the user to open the app | §7 |

On the 8T the job survived the 16:45 reboot with a six-hour latency, so the earliest
unattended recovery was hours after Magrib and Isha had already passed in silence.

The gap is therefore: **an OEM that suppresses the boot broadcast leaves the phone
silent until either the background task's next run or the user opening the app,
whichever lands first.** No permission or settings change is permitted as the fix
(owner ruling, §6), and our own boot receiver would be suppressed exactly as expo's
was, so the remedy has to be a shorter unattended recovery rather than a new wake-up
mechanism.

## 11. Why 3 hours is safe on iOS, and what rev 3 actually measured

Rev 3 raised the background interval from 3h to 6h. Re-reading the evidence behind
it, every rate-limit observation was taken at 15 minutes or below:

| RUNBOOK row | Finding | Interval under test |
| --- | --- | --- |
| Sustained cadence | dasd rate-limits after ~4 rapid runs, then recovers | 15 min |
| Rate limit | "sub-hour intervals unsustainable" | sub-hour |

Three hours is not sub-hour. It is twelve times the threshold that was measured
failing, and it is the value ADR-007 shipped originally: ISSUES #8's device
verification on the XS records "dasd windows match the interval exactly" and
"the 180-min value is safe". 3h was never observed failing; 6h was chosen for extra
leniency, not to escape a measured problem.

Apple's own model supports this. `earliestBeginDate` is a "not before" floor, not a
request rate: the system decides the actual cadence from usage patterns, battery
state and its daily budget (WWDC 2020, Background execution demystified). Lowering
the floor cannot make iOS run the task less often; it only makes the app eligible
sooner.

One property worth recording because it is a common misreading of field reports:
expo-background-task submits a `BGProcessingTaskRequest` with

```swift
request.requiresNetworkConnectivity = true
request.requiresExternalPower = false     // BackgroundTaskScheduler.swift:94
```

so the task does NOT need the phone on a charger. Reports of "processing tasks only
run while plugged in" come from apps that set `requiresExternalPower = true`.

## 12. Why the two intervals differ, and why collisions are not the reason

The chosen values are `NOTIFICATION_REFRESH_HOURS = 2` and
`BACKGROUND_TASK_INTERVAL_HOURS = 3` (owner, 2026-09-23).

Offsetting them does not prevent a collision, because a collision was never possible:

- `withSchedulingLock` is a sequential queue, not a skip lock. Two passes that
  overlap run one after the other; neither is dropped and neither corrupts the other.
- The two paths rarely share a process anyway. The foreground gate runs from
  `app/index.tsx` and the foreground-return listener; the background task runs
  headlessly, usually with no UI process alive at all.

The real reason for the split is what each number governs. Two hours is the longest
an opened app may stay stale; three is the longest an unattended phone waits for
recovery after its alarms are lost. The foreground number is cheap (one `if` on a
timestamp, no OS scheduler involved) so it can afford to be the tighter of the two;
the background number is the one the OS rations, so it stays the more lenient.

Equal values would have been safe. Different values are simply a better fit to what
each layer is for.

## 13. This is ISSUES #19, and the mitigation did not hold

#19 recorded exactly this on the 8T on 2026-09-03: after a reboot with the app not
opened, `dumpsys jobscheduler` had no job and `dumpsys alarm` had zero notification
alarms, while the 3T, 5T and Find X8 all re-armed headlessly after the same reboots.
Today's 3T control reproduces that contrast unchanged.

#19 pinned the cause to OnePlus "Auto-launch", default OFF for sideloaded apps, which
silences boot receivers with no adb-visible state, and was marked MITIGATED because
the owner enabled the toggle on 2026-09-03. Confirmed again today: the setting is not
readable over adb (`settings get secure oplus_autostart_apps` is null, and there is no
`AUTO_START` appop), so its state can only be seen in the OEM's own UI.

Two things follow, and both matter:

1. The mitigation is one OEM toggle on one phone. It does not survive a reinstall, it
   cannot be set by the app, and it is exactly the class of fix ruled out in §6. It is
   not a fix for users.
2. **Even with the boot loss accepted, the app should have healed itself at 18:50 and
   did not.** That is ours, and it is the part worth fixing: 18 app opens, every one of
   them refusing to reschedule because a timestamp said the work was recent while the
   alarms were already gone.

So #19 explains why the alarms were lost. It does not explain why they stayed lost.
The twelve-hour gate does, and that is what rev 4 and the 1.25.30 cold-launch re-arm
between them close.

## 14. expo-background-task demands a network this app does not need

Raised by the owner on reading the 3T soak: the app is offline-first, the rolling buffer is
computed from the MMKV cache, and the API is touched about once a year. So why should a
network constraint stop the refresh from running at all?

It should not. The constraint is the library's, hardcoded, and not ours to configure:

```kotlin
// expo-background-task/android/.../BackgroundTaskScheduler.kt:107
val constraints = Constraints.Builder()
  .setRequiredNetworkType(NetworkType.CONNECTED)
  .build()
```

```swift
// expo-background-task/ios/BackgroundTaskScheduler.swift:93
request.requiresNetworkConnectivity = true
```

Both platforms, unconditional. `BackgroundTaskOptions` exposes `minimumInterval` and nothing
else, so there is no supported way to drop it.

**What it costs us.** `rescheduleAllNotificationsFromBackground` calls `sync()` first, but
that call is already best-effort and wrapped in its own try/catch precisely so a failed
fetch cannot stop the reschedule; the arming that follows reads the cache. So the work the
task exists to do needs no network at all, and a device offline overnight, in airplane mode,
or holding a stale connectivity flag silently loses its unattended recovery. On the 3T that
is not hypothetical: the job sat unrun for 3h16m behind this flag while the device pinged
8.8.8.8 at 0% loss.

**What it did NOT cost us.** It is not the cause of the 8T's silence. That phone's job
recorded `Satisfied constraints: CONNECTIVITY ... Unsatisfied: TIMING_DELAY DEADLINE IDLE`,
so the network was fine and it was simply waiting out the six-hour interval. The two
findings are independent.

**Where it leaves us.** A real upstream limitation, worth an issue or PR against
expo-background-task asking for the constraint to be opt-out, since an offline-capable app
has no reason to carry it. Until then the mitigation is the layer we already have: the
foreground gate re-arms on the next open, which needs nothing from the network. Recorded
rather than worked around, because patching a node_modules constraint would be invisible to
the next person and would not survive an install.

## 15. Oppo Find X8 baseline — the same 1.24.1, healthy (2026-09-24 06:58)

Connected for the #37 work. This is a real user's phone with two to three months of
genuine daily use, and it carries the SAME build the 8T failed on, which makes it the
most useful control in the fleet.

| Reading | Value |
| --- | --- |
| OS | Android **16**, API **36**, ColorOS `CPH2659_16.0.10.500(EX01)` |
| Serial | `G6RWBAQ4VKWWEAIZ` |
| App | `com.mugtaba.athan` 1.24.1, installed 2026-09-09 (same day as the 8T) |
| Clock | in sync with the host to the second |
| **Prayer alarms armed** | **21**, all `window=0` with an `Alarm clock:` block |
| Armed instants | 12:28, 12:58, 16:03, 16:08, 18:53, 18:58, 20:09, 20:14 … real London times, in reminder/at-time pairs |
| Background job | `Minimum latency: +5h59m59s998ms` (the old 6h), `Unsatisfied: TIMING_DELAY` only |
| Standby bucket | 10 (ACTIVE) |
| Battery whitelist | NOT whitelisted |

Two things worth carrying into #37.

**The 8T's failure was not universal to 1.24.1.** Same build, same install date, and this
phone is fully armed with 21 alarms while the 8T sat at zero. That isolates #36 further: it
needed the reboot AND the suppressed boot broadcast AND the closed gate. A phone that never
lost its alarms never noticed the gate was wrong.

**Its background job has `CONNECTIVITY` satisfied**, so like the 8T it is only waiting out
its interval. Three devices now show the constraint being applied and only the 3T shows it
stuck, which supports the reading in #37 that the stale flag is that handset's fault while
the constraint itself is the library's.

Also of note for the API matrix: on API 36 the granted permission is `USE_EXACT_ALARM`
(auto-granted, no user prompt), where the 8T on API 31 held `SCHEDULE_EXACT_ALARM`.
