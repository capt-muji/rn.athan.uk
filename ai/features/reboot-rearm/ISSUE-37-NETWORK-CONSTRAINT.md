# ISSUE #37 — the background task demands a network it never uses

Opened 2026-09-24 by the owner's question during the 1.27.326 soak: this app is
offline-first, so why should connectivity decide whether the notification refresh runs?

It should not. Everything below is the case for that, the measurements behind it, and the
options for fixing it.

---

## 1. The constraint, and where it lives

`expo-background-task` applies a network requirement to every task it schedules, on both
platforms, with no way to switch it off.

**Android** — `node_modules/expo-background-task/android/src/main/java/expo/modules/backgroundtask/BackgroundTaskScheduler.kt:107`

```kotlin
val constraints = Constraints.Builder()
  .setRequiredNetworkType(NetworkType.CONNECTED)
  .build()
```

Applied to both scheduling paths in the same file: the `OneTimeWorkRequest` used on API 26
and above (`.setConstraints(constraints)` at :124) and the periodic builder used on
Android 14-15.

**iOS** — `node_modules/expo-background-task/ios/BackgroundTaskScheduler.swift:93`

```swift
let request = BGProcessingTaskRequest(identifier: ...)
request.requiresNetworkConnectivity = true
request.requiresExternalPower = false
request.earliestBeginDate = Date().addingTimeInterval(intervalSeconds)
```

**The public API offers no escape.** `BackgroundTaskOptions` in
`src/BackgroundTask.types.ts` has exactly one field:

```ts
export type BackgroundTaskOptions = {
  minimumInterval?: number;
};
```

Installed version: `expo-background-task@58.0.3`.

---

## 2. Why this app does not need it

The background task exists to roll the 2-day alarm window forward. That work is a pure
read of the MMKV cache.

`rescheduleAllNotificationsFromBackground` (`stores/notifications.ts`) calls `sync()`
first, and already treats it as optional:

```ts
try {
  await sync();
} catch (error) {
  logger.error('BACKGROUND_TASK: Data refresh failed, rescheduling from cache', { error });
}
```

The comment above it states the intent plainly: "Best-effort by design: a sync failure
(e.g. API unreachable) must not skip the reschedule itself, which still rolls the window
from cache."

So the code is already correct for an offline device. The reschedule that follows reads
`Database.getPrayerByDateString` and arms alarms from stored times. The API is fetched
about once a year (`markYearAsFetched`), and the app is documented as fully offline after
first sync.

The result is a contradiction: **our own task body is built to survive having no network,
and the scheduler refuses to start it without one.**

---

## 3. What it costs, measured

OnePlus 3T, 2026-09-24, during the 1.27.326 soak.

The job was overdue by 3h16m and had never run:

```
Required constraints:    TIMING_DELAY CONNECTIVITY
Satisfied constraints:   TIMING_DELAY DEVICE_NOT_DOZING BACKGROUND_NOT_RESTRICTED
Unsatisfied constraints: CONNECTIVITY
Ready: false
```

`TIMING_DELAY` satisfied means the 3-hour interval elapsed exactly as asked. The only
thing holding it was the network flag. Meanwhile, from the same adb shell:

```
2 packets transmitted, 2 received, 0% packet loss   (ping 8.8.8.8)
NetworkAgentInfo ... WIFI CONNECTED/CONNECTED ... VALIDATED ... SSID "Hallway 5GHz"
```

The device had a validated link and working internet. A WiFi off/on cycle did not clear
the flag.

**The staleness is device-wide, not ours.** The same unsatisfied constraint sat on other
packages' jobs at the same moment:

- `com.google.android.apps.tachyon` (Google Meet)
- `com.qualcomm.qti.qms.service.connectionsecurity`
- `com.mugtaba.athan.fleettest`

So there are two separate problems stacked here, and they should not be confused:

| Problem | Owner | Severity |
| --- | --- | --- |
| The task requires a network it never uses | expo-background-task | design flaw, affects every offline device |
| JobScheduler's connectivity flag goes stale | this 3T / Android 9 | device fault, Google's own apps hit it too |

The library flaw is what turns the device fault into silence. Without the constraint, a
stale flag would be irrelevant to us.

**Forcing the job proved the body is fine**:

```
cmd jobscheduler run -f com.mugtaba.athan.fleettest 7
BackgroundTaskConsumer: Executing task 'NOTIFICATION_REFRESH_TASK'
TaskService: Started headless task 1 to keep JS timers alive
```

No app process existed beforehand. The task ran headlessly, the alarm set stayed correct
at 4, and the next run re-enqueued at `+2h58m32s956ms`.

---

## 4. What it did NOT cause

It is not behind ISSUES #36, and saying so would be a tidy, wrong story.

The 8T's job at 21:53 on 2026-09-23 recorded:

```
Required constraints:    TIMING_DELAY DEADLINE IDLE CONNECTIVITY PROTECT_FORE CPU
Satisfied constraints:   CONNECTIVITY DEVICE_NOT_DOZING BACKGROUND_NOT_RESTRICTED WITHIN_QUOTA PROTECT_FORE CPU
Unsatisfied constraints: TIMING_DELAY DEADLINE IDLE
```

`CONNECTIVITY` is in the satisfied list. That phone was simply waiting out its six-hour
interval. #36 was the refresh gate trusting a timestamp; #37 is this. Independent.

---

## 5. Who else is affected

Any offline-capable app using `expo-background-task`. The library's own docs describe the
task as suited to "syncing data with a server", so the constraint matches the assumed use
case; it is the absence of an opt-out that is the defect, not the default.

For a prayer app the exposure is specific and unpleasant: a user in airplane mode
overnight, on a plane, in a dead-signal area, or on a phone with a stuck flag loses the
unattended recovery that keeps alarms armed, and the app is silent until they open it.

---

## 6. Options, with honest trade-offs

| # | Option | Cost | Risk | Verdict |
| --- | --- | --- | --- | --- |
| 1 | Upstream PR: make the constraint opt-out via `BackgroundTaskOptions` | a PR plus release lag | low, additive and backwards-compatible | **the right fix** |
| 2 | `patch-package` the two lines while waiting | small, precedent exists (G.1, the alarmClock backport) | must be re-verified on every SDK bump; invisible if undocumented | viable bridge, only alongside 1 |
| 3 | Own the WorkManager scheduling in `modules/` | a native module we maintain forever | duplicates the library; more surface than the bug | no |
| 4 | Accept it, rely on the foreground gate | nothing | offline users keep losing unattended recovery | current state, not a resolution |

**Recommendation: 1, with 2 as the bridge if the upstream lag is long.** Both need
device proof, not just a green build: arm alarms, put the device in airplane mode, wait
out the interval, and confirm the task runs anyway.

Rejected outright: editing `node_modules` in place. It vanishes on the next install and
leaves no trace for the next reader.

---

## 7. Open questions for the debugging session

1. Does WorkManager evaluate the constraint at enqueue time or at run time? If at run
   time, a device that regains a network later should run the job late rather than never,
   which changes how bad this is.
2. What does iOS actually do with `requiresNetworkConnectivity = true` on a device in
   airplane mode? Deferral until connectivity returns, or a skipped window?
3. Does the constraint survive `MY_PACKAGE_REPLACED` and reboot re-enqueues, or is it
   re-applied fresh each time?
4. Is there a second path worth having entirely, given the task needs no network: an
   alarm-driven refresh like `modules/widgetrefresh` already does for widgets, which would
   sidestep WorkManager constraints altogether?
5. Would upstream accept `requiresNetwork?: boolean` on `BackgroundTaskOptions`, defaulting
   true so nothing changes for existing users?

---

## 8. Reproducing it

```bash
# Arm something, then cut the network and wait out the interval
adb -s <serial> shell svc wifi disable
adb -s <serial> shell svc data disable
adb -s <serial> shell dumpsys jobscheduler | grep -A20 com.mugtaba.athan | \
  grep -E "Required|Satisfied|Unsatisfied|Ready"
# expect: CONNECTIVITY unsatisfied, Ready: false, no run at the interval

# The body itself is fine, which the forced run shows
adb -s <serial> shell cmd jobscheduler run -f com.mugtaba.athan <jobId>
```

Count alarms with `ai/features/reboot-rearm/count-alarms.sh`, never a bare `grep -c`: the
dump repeats each alarm under "Next wake from idle" as well as in its batch.
