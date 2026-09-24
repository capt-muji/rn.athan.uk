# ISSUE #37 — device evidence for the network-constraint patch

Measured 2026-09-24 on branch `fix/issue-37-network-constraint`. Every claim below comes
from a command in this file, run against the device named in its heading.

---

## 1. Upstream state, checked before writing any code

The fault is already reported upstream, and the report is stale.

| Item | State | Opened | Last activity | Age at 2026-09-24 |
| --- | --- | --- | --- | --- |
| [issue #48122](https://github.com/expo/expo/issues/48122) | open, `needs review`, unassigned | 2026-07-25 | 2026-09-22 | 61 days |
| [PR #48469](https://github.com/expo/expo/pull/48469) | **draft**, 0 reviews, 0 review comments | 2026-08-04 | 2026-08-04 | **51 days untouched** |

The PR author marked their own work draft after another user commented "Should not make
PRs to fix unvalidated issues", and no maintainer has responded since.

`expo-background-task@58.0.6` (the newest SDK 58 build, published 2026-09-23) and
`expo/expo@main` both still carry the hardcoded constraint, so upgrading the package is
not a fix:

```
# 58.0.6 from npm
ios/BackgroundTaskScheduler.swift:93    request.requiresNetworkConnectivity = true
android/.../BackgroundTaskScheduler.kt:108  .setRequiredNetworkType(NetworkType.CONNECTED)
```

### Why a second PR rather than reviving #48469

PR #48469 defaults `requiresNetworkConnectivity` to `false`. That silently drops the
network requirement for every app already using the package, including the sync-oriented
uses the library's own docs recommend. Our change defaults to `true`, so no existing
caller changes behaviour. The stale PR also ships no tests, which the package requires
(`ios/Tests/BackgroundTaskSchedulerTests.swift` exists upstream).

---

## 2. Where the constraint is evaluated: run time, not enqueue time

This matters for severity. Read from the WorkManager source
(`androidx/androidx@androidx-main`, `work/work-runtime`) and confirmed on device.

`SystemJobInfoConverter.convert()` translates the WorkManager `Constraints` into a
platform `JobInfo` at enqueue time, mapping `NetworkType.CONNECTED` onto the job's network
request. JobScheduler then evaluates that requirement continuously: the 3T's dump shows
the constraint moving between the satisfied and unsatisfied lists as the link changes,
and the job carries an explicit tracker.

```
Required constraints:    TIMING_DELAY CONNECTIVITY
Unsatisfied constraints: CONNECTIVITY
Tracking:                CONNECTIVITY TIME       <- actively tracked, not snapshotted
```

**Verdict: deferral, not cancellation.** A device that regains a network runs the job
late rather than never. That lowers the severity from "lost forever" to "silent for as
long as the device stays offline", which for this app is exactly the overnight or
dead-signal window the unattended recovery exists to cover.

The same holds on iOS by Apple's contract: `requiresNetworkConnectivity` is a condition
the scheduler waits on, not a reason to drop the request.

### A faster lever than waiting out the interval

`cmd jobscheduler run` **without** `-f` refuses to start a job whose constraints are
unmet, and reports why. That converts a 3-hour wait into an immediate verdict, and it is
how every before/after below was measured:

```
# constraint unmet
$ adb shell cmd jobscheduler run com.mugtaba.athan.fleettest 11
Job 11 ... has functional constraints but --force not specified   (exit 22)

# constraint gone
$ adb shell cmd jobscheduler run com.mugtaba.athan.fleettest 15
Running job                                                        (exit 0)
```

`-f` bypasses constraints and therefore proves nothing about them; it only ever showed
that the task body works.

---

## 3. The Android build consumes a prebuilt AAR, not the patched source

This cost a full build cycle and is the single most useful thing learned here.

`expo-background-task`'s `expo-module.config.json` carries a `publication` block:

```json
"android": {
  "modules": ["expo.modules.backgroundtask.BackgroundTaskModule"],
  "publication": {
    "groupId": "host.exp.exponent",
    "artifactId": "expo.modules.backgroundtask",
    "version": "58.0.3",
    "repository": "local-maven-repo"
  }
}
```

With it present, autolinking resolves the module to the prebuilt
`local-maven-repo/.../expo.modules.backgroundtask-58.0.3.aar` and Gradle never compiles
the Kotlin in `android/src`. A source-only patch builds clean, installs clean, and
changes nothing at runtime. Proof, from the shipped AAR's own bytecode:

```
$ javap -p -c classes.jar!/expo/modules/backgroundtask/BackgroundTaskScheduler.class
  public final void registerTask(android.content.Context, long);      <- old 2-arg signature
  432: getstatic  Field androidx/work/NetworkType.CONNECTED           <- hardcoded
```

The patch therefore removes the `publication` block as well, which returns the module to
source compilation. The build log confirms the switch:

```
> Task :expo-background-task:compileReleaseKotlin
```

**Durable lesson:** patching an Expo module's Android source is a no-op while its
`expo-module.config.json` declares a `publication`. Verify a native patch by its runtime
effect, never by a successful build.

---

## 4. OnePlus 3T (`8f7ada76`, Android 9, API 28) — before and after

Package `com.mugtaba.athan.fleettest`, local Release build, mock prayer data.

### Before the patch (1.27.335)

Online, the job enqueues with a network requirement:

```
JOB #u0a113/13: com.mugtaba.athan.fleettest/androidx.work...SystemJobService
  Network type: NetworkRequest [ ... INTERNET&NOT_RESTRICTED&TRUSTED&VALIDATED ... ]
  Required constraints:    TIMING_DELAY CONNECTIVITY
  Tracking:                CONNECTIVITY TIME
```

Offline (`svc wifi disable` + `svc data disable`, `ping 8.8.8.8` unreachable), it is
blocked and refuses to run:

```
Required constraints:    TIMING_DELAY CONNECTIVITY
Satisfied constraints:   TIMING_DELAY DEVICE_NOT_DOZING BACKGROUND_NOT_RESTRICTED
Unsatisfied constraints: CONNECTIVITY
Ready: false

$ cmd jobscheduler run com.mugtaba.athan.fleettest 11
Job 11 ... has functional constraints but --force not specified
```

### After the patch (1.27.336)

Registration carries the new option through to native:

```
D/BackgroundTaskModule: registerTaskAsync: NOTIFICATION_REFRESH_TASK
                        with options {minimumInterval=180.0, requiresNetwork=false}
```

The job enqueues with no network requirement at all:

```
JOB #u0a113/15: com.mugtaba.athan.fleettest/androidx.work...SystemJobService
  (no "Network type:" line)
  Required constraints:    TIMING_DELAY
  Tracking:                TIME
```

| | before (1.27.335) | after (1.27.336) |
| --- | --- | --- |
| `Network type:` in dump | present | **absent** |
| Required constraints | `TIMING_DELAY CONNECTIVITY` | `TIMING_DELAY` |
| Tracking | `CONNECTIVITY TIME` | `TIME` |
| Non-forced run while offline | refused, exit 22 | `Running job`, exit 0 |

### The headless offline run

Device offline, app force-stopped and killed, no process resident. Android cold-started
the app purely to service the job:

```
I am_proc_start: [0,12447,10113,com.mugtaba.athan.fleettest,service,
                  com.mugtaba.athan.fleettest/androidx.work.impl.background.systemjob.SystemJobService]

I/BackgroundTaskWork:       doWork: Running worker
I/TaskService:              Registered task with name 'NOTIFICATION_REFRESH_TASK'
D/BackgroundTaskScheduler:  runTasks: executing tasks for consumer of type expo-background-task
D/BackgroundTaskConsumer:   Executing task 'NOTIFICATION_REFRESH_TASK'
I/TaskService:              Started headless task 1 to keep JS timers alive
```

`ping 8.8.8.8` returned `Network is unreachable` immediately before and after. The armed
alarm count held at 4 across the run (`count-alarms.sh`).

This is the pass condition from the session prompt: the task runs with no network at all.

---

## 5. Oppo Find X8 (`G6RWBAQ4VKWWEAIZ`, Android 16, API 36) — the controlled comparison

This device carries the owner's real data, so nothing was wiped, reset or rebooted. The
patched build installs as `com.mugtaba.athan.fleettest`, a **different package** from the
user's `com.mugtaba.athan`, so both run side by side. That turns the phone into a
controlled experiment: same OS, same scheduler, same instant, one patched app and one
unpatched app.

The install is user-confirmed on ColorOS ("Athan FleetTest, Version 1.27.336, No risks
found", Continue installation) and the notification permission was granted the same way.

### Both jobs, offline, at the same moment

```
# PATCHED  (com.mugtaba.athan.fleettest)
JOB #u0a43/0:
  (no "Network type:" line)
  Required constraints:    TIMING_DELAY FLEXIBILITY
  Unsatisfied constraints: TIMING_DELAY
  Tracking:                TIME QUOTA

# UNPATCHED CONTROL  (com.mugtaba.athan, the user's own app)
JOB #u0a423/786:
  Network type: NetworkRequest [ ... INTERNET&TRUSTED&VALIDATED ... ]
  Required constraints:    TIMING_DELAY CONNECTIVITY FLEXIBILITY
  Unsatisfied constraints: TIMING_DELAY CONNECTIVITY
  Tracking:                CONNECTIVITY TIME QUOTA
```

### The same command against both, offline

```
$ adb shell cmd jobscheduler run com.mugtaba.athan.fleettest 0
Running job                                                            exit 0

$ adb shell cmd jobscheduler run com.mugtaba.athan 786
Job 786 ... has functional constraints but --force not specified       exit 22
```

The patched app ran headlessly while offline:

```
I/BackgroundTaskWork:      doWork: Running worker
D/BackgroundTaskConsumer:  Executing task 'NOTIFICATION_REFRESH_TASK'
I/TaskService:             Started headless task 1 to keep JS timers alive
I/TaskService:             Finished headless task 1
```

API 36 adds `FLEXIBILITY` and `QUOTA` to the constraint set, and neither interferes: the
network requirement is the only thing the patch removes, and removing it is sufficient.

### Owner-device integrity, checked after the run

| Check | Before | After |
| --- | --- | --- |
| `com.mugtaba.athan` versionName | 1.24.1 | 1.24.1 |
| `firstInstallTime` | 2026-09-09 14:12:38 | 2026-09-09 14:12:38 |
| Armed alarms (`count-alarms.sh`) | 21 | 21 |
| WiFi / mobile data | on | on, `ping 8.8.8.8` 0% loss |

Nothing on the user's app was touched.

---

## 6. iPhone XS (`00008020-0015585C22D2002E`) — the option reaches `BGProcessingTaskRequest`

iOS compiles `expo-background-task` from source through its podspec
(`s.source_files = "**/*.{h,m,swift}"`), so there is no prebuilt-artifact problem to work
around. The build packaged `libExpoBackgroundTask.a` from the patched Swift and installed
1.27.336.

`BGTaskScheduler` cannot be driven on demand in a Release build, and this machine cannot
reach dasd's fire log, so the verifiable claim is the one the upstream reporter used: what
the library persists and resubmits. From `devicectl ... --console` at launch:

```
EXTaskService: Restoring tasks configuration: {
    mainApplication = {
        tasks = {
            "NOTIFICATION_REFRESH_TASK" = {
                consumerClass = "ExpoBackgroundTask.BackgroundTaskConsumer";
                name = "NOTIFICATION_REFRESH_TASK";
                options = {
                    minimumInterval = 180;
                    requiresNetwork = 0;      <- reaches the consumer, and survives restore
                };
            };
        };
    };
}
```

`BackgroundTaskConsumer.didRegisterTask` reads exactly this key and passes it to
`BackgroundTaskScheduler`, which now assigns it to `request.requiresNetworkConnectivity`
instead of the hardcoded `true`. The restore path matters here: ISSUES #8 showed the
native side resubmits from these persisted options, so a flag that survives restore is a
flag that survives every future resubmit.

**Deliberately not tested on iOS:** an actual offline BGTask fire. It needs the system to
choose to launch the app, which cannot be forced on a Release build, and dasd's log is
unreachable without a sudo `usbmuxd` restart the owner is not available to perform. The
Android side carries the end-to-end offline execution proof; iOS carries the request-level
proof. This split is stated plainly in the PR rather than glossed.

---

## 7. Device matrix

| Device | OS / API | Build | Constraint before | Constraint after | Offline run |
| --- | --- | --- | --- | --- | --- |
| OnePlus 3T `8f7ada76` | Android 9, API 28 | 1.27.336 Release | `TIMING_DELAY CONNECTIVITY` | `TIMING_DELAY` | **ran headless, cold start** |
| Oppo Find X8 `G6RWBAQ4VKWWEAIZ` | Android 16, API 36 | 1.27.336 Release | `TIMING_DELAY CONNECTIVITY FLEXIBILITY` | `TIMING_DELAY FLEXIBILITY` | **ran headless** |
| Find X8, user's app (control) | Android 16, API 36 | 1.24.1 unpatched | `TIMING_DELAY CONNECTIVITY FLEXIBILITY` | unchanged | **refused, exit 22** |
| iPhone XS `00008020-...` | iOS 18.7.x | 1.27.336 Release | `requiresNetworkConnectivity = true` | `requiresNetwork = 0` persisted | not forceable, see §6 |

Seven Android major versions apart, both ends behave identically.
