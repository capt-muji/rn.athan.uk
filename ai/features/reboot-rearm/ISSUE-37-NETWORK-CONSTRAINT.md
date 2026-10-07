# ISSUES #37: the readings, the commands and the rules

`ai/ISSUES.md` #37 holds the symptom, the cause, the patch in place and the upstream state. This file
holds what it points here for: the readings per phone, the commands that give an immediate verdict,
the rules for patching an Expo module, and what is still unwitnessed. The last section is the
procedure that verifies alarms after a reboot.

## What was measured

| Fact | Reading |
| --- | --- |
| Cost on the OnePlus 3T, 2026-09-24 | the job sat 3h16m overdue with `Unsatisfied constraints: CONNECTIVITY`, `Ready: false`, while the phone held a validated link and pinged at 0% loss |
| The stale flag is the phone's | other packages' jobs, a Google app among them, sat behind the same flag; a Wi-Fi off and on cycle did not clear it |
| Enqueue time or run time | run time. The dump shows `Tracking: CONNECTIVITY TIME`, and the constraint moves between the satisfied and unsatisfied lists as the link changes. The job is deferred, never dropped |
| Not the cause of ISSUES #36 | the 8T's job recorded `CONNECTIVITY` satisfied and was waiting out its interval |

## Proof, with and without the patch

Local Release builds, mock data, 2026-09-24. Unpatched is 1.27.335, patched is 1.27.336.

| Phone | Build | Required constraints | Non-forced run while offline |
| --- | --- | --- | --- |
| OnePlus 3T, Android 9, API 28 | unpatched | `TIMING_DELAY CONNECTIVITY` | refused, exit 22 |
| OnePlus 3T, Android 9, API 28 | patched | `TIMING_DELAY`, no `Network type:` line | `Running job`, exit 0, headless cold start with no app process |
| Oppo Find X8, Android 16, API 36 | patched, `com.mugtaba.athan.fleettest` | `TIMING_DELAY FLEXIBILITY` | `Running job`, exit 0, headless |
| Oppo Find X8, same moment | unpatched, the installed `com.mugtaba.athan` | `TIMING_DELAY CONNECTIVITY FLEXIBILITY` | refused, exit 22 |
| iPhone XS, iOS 18 | patched | the persisted task options hold the flag as `0` and survive a restore | cannot be forced on a Release build |

- The patched and unpatched packages ran side by side on the Find X8, so that pair is a controlled
  comparison on one phone at one instant.
- The alarm count held across each run: 4 on the 3T, 21 on the Find X8's installed app.
- The iOS proof is at request level only. The Android side carries the end to end offline run.

## The commands that give an immediate verdict

`cmd jobscheduler run` without `-f` refuses a job whose constraints are unmet and names the reason.
It turns a three hour wait into an immediate answer.

```bash
adb -s <serial> shell dumpsys jobscheduler | grep -A20 <package> | grep -E "Required|Satisfied|Unsatisfied|Ready|Tracking|Network type"
adb -s <serial> shell cmd jobscheduler run <package> <jobId>
```

| Output | Meaning |
| --- | --- |
| `Running job`, exit 0 | every constraint is met |
| `has functional constraints but --force not specified`, exit 22 | a constraint is unmet |

`-f` bypasses constraints. It proves the task body runs and nothing about the constraints.

## Rules for patching an Expo module

- A patch to an Expo module's Android source is a no-op while its `expo-module.config.json` declares
  a `publication` block. Autolinking then resolves the module to its prebuilt AAR and Gradle never
  compiles the patched Kotlin. The patch removes that block. The build log then shows
  `:expo-background-task:compileReleaseKotlin`.
- Verify a native patch by its runtime effect, never by a green build.
- iOS compiles the module from source through its podspec, so it has no such trap.

## Still unwitnessed

| Item | Detail |
| --- | --- |
| Natural fire at the 3 hour interval | not seen on either platform. The 3T's connectivity flag was stale and the iPhone's scheduler log was unreachable. The interval reaches the OS correctly on both (`Minimum latency: +2h59m`, `minimumInterval = 180`) |
| Offline fire on iOS | not tested; the system cannot be forced to launch a Release build |
| The Android path below API 26 | upstream applies no constraint there (`PeriodicWorkRequest`), so the two Android paths disagree. Raise it if a maintainer asks |

## Witness a natural background refresh on Android

Source: in git history under `ai/RUNBOOK-background-tasks.md` (`:361-363`, `:442-457`, `:517-526`).
Re-read against the installed `expo-background-task` 58.0.7.

1. Launch the app once. Read the job: `adb -s 3T_SERIAL shell dumpsys jobscheduler | grep -A20 com.mugtaba.athan`.
   Note the job number and the time. Due is that time plus the interval (`BACKGROUND_TASK_INTERVAL_HOURS`,
   `shared/constants.ts:168`).
2. Do not launch the app again before due. Every launch unregisters and registers the task, which restarts the
   interval (`stores/notifications.ts:1935-1943`).
3. Choose the state to test. Foreground: leave the app open. Backgrounded:
   `adb -s 3T_SERIAL shell input keyevent KEYCODE_HOME`. Process death: HOME, then
   `adb -s 3T_SERIAL shell am kill com.mugtaba.athan`. Never use `am force-stop` for this: it cancels the job and
   every alarm (ISSUES #18).
4. A fire is proven by two readings, never by `Minimum latency`. On OxygenOS and ColorOS that field shows the
   requested delay and does not count down. Read the job number again: it increments on each enqueue. Read logcat
   for the tags `BackgroundTaskWork` and `BackgroundTaskScheduler`: `doWork: Running worker`
   (`BackgroundTaskWork.kt:19`), then `Enqueuing worker ...` with the interval in minutes
   (`BackgroundTaskScheduler.kt:123`).
5. Pass: the fire lands within minutes of due and the next enqueue is one interval later. With the app in the
   foreground the library defers the run by the smaller of 60 minutes and the interval
   (`BackgroundTaskScheduler.kt:241-246`), so a foreground run that is late by that much is correct.
6. A shorter wait needs a build with `EXPO_PUBLIC_BG_INTERVAL_MINUTES` between 15 and 1440
   (`shared/constants.ts:179-214`). `EXPO_PUBLIC_BG_DEBUG=1` logs a launch snapshot of the persisted interval
   (`device/backgroundTaskDebug.ts:65`). Neither works in a production build.

On an iPhone the same check reads the system log for `submitTaskRequest:`, which prints the earliest begin date.
Low Power Mode and a user force-quit both suppress the task, and iOS rate-limits intervals under an hour. The
record already says the iPhone's scheduler log was unreachable and a Release build cannot be forced.

## Verify alarms after a reboot

Run on a phone that is free to reboot. Count with `count-alarms.sh`, never a bare `grep -c`: the
dump repeats each alarm under "Next wake from idle" as well as inside its batch.

```bash
ai/features/reboot-rearm/count-alarms.sh <serial>          # the count
ai/features/reboot-rearm/count-alarms.sh <serial> --list   # the armed instants, then the count
```

| Case | Steps | Pass |
| --- | --- | --- |
| Reboot, app never opened | arm two prayers on Sound, record `--list`, `adb reboot`, wait for `sys.boot_completed=1`, do not open the app | the same instants return with `window=0`; one fires on its athan channel, not the fallback |
| Alarms lost, then healed | record the count, `am force-stop`, count again, cold launch, count again | the count drops, then returns to the first set after one launch |
| The interval reached the OS | read `dumpsys jobscheduler` after a launch | `Minimum latency` matches `BACKGROUND_TASK_INTERVAL_HOURS` |

- Read the phone's own clock for anything timed.
- Wait up to two minutes after `boot_completed` before judging: the restore can land that late.
- A force-stop can leave the one imminent alarm armed. One survivor does not mean the buffer
  survived.
- Reference readings on the 3T at 1.27.326: 3 armed, 1 after force-stop, 3 after one cold launch;
  after a reboot the set returned within 14 seconds and a prayer fired 5 ms after its instant.
