# Session prompt — ISSUES #37, the background task's network constraint

Paste this to open the session.

---

Read `ai/AGENTS.md` and begin as Orchestrator.

Then read, in this order:

1. `ai/features/reboot-rearm/ISSUE-37-NETWORK-CONSTRAINT.md` — the full case, already written
2. `ai/ISSUES.md` #37, and #36 above it for the investigation that surfaced this
3. `ai/features/reboot-rearm/VERIFICATION.md` — how the devices were driven, and the tooling
   that broke while doing it

## The problem in one line

`expo-background-task` refuses to run our notification refresh without a network, and the
refresh never uses the network.

## What is already established (do not re-derive)

- The constraint is hardcoded in the library on both platforms:
  `BackgroundTaskScheduler.kt:107` (`setRequiredNetworkType(NetworkType.CONNECTED)`) and
  `BackgroundTaskScheduler.swift:93` (`requiresNetworkConnectivity = true`).
  `BackgroundTaskOptions` has one field, `minimumInterval`, so there is no opt-out.
- Our task body is already correct for an offline device. `rescheduleAllNotificationsFromBackground`
  wraps `sync()` in its own try/catch by design, and the arming that follows reads MMKV.
- Measured on the 3T: the job sat unrun for 3h16m with `TIMING_DELAY` satisfied and
  `CONNECTIVITY` not, while the device held a validated WiFi link and pinged 8.8.8.8 at 0% loss.
- Two problems are stacked there and must stay separate: the library requiring a network it
  never uses (the design flaw), and that 3T's stale JobScheduler flag (a device fault that
  also blocks Google's `tachyon`). The library flaw is what turns the device fault into silence.
- This did NOT cause #36. The 8T's job recorded `CONNECTIVITY` satisfied.

## What this session is for

Answer the open questions, then fix it.

1. Does WorkManager evaluate the constraint at enqueue time or run time? If at run time, a
   device that regains a network runs the job late rather than never, which changes the severity.
2. What does iOS do with `requiresNetworkConnectivity = true` in airplane mode — defer until
   connectivity returns, or skip the window?
3. Does the constraint survive reboot and `MY_PACKAGE_REPLACED` re-enqueues?
4. Is an alarm-driven refresh worth having instead, the way `modules/widgetrefresh` already
   drives widgets? It would sidestep WorkManager constraints entirely.
5. Would upstream take `requiresNetwork?: boolean` on `BackgroundTaskOptions`, defaulting true?

Preferred outcome: an upstream PR making the constraint opt-out, with `patch-package` as the
bridge if the release lag is long (the alarmClock backport in `experiment/alarmclock-backport`
is the precedent for how that is done here). Editing `node_modules` in place is rejected: it
vanishes on the next install and leaves nothing for the next reader.

## Prove it on a device, not in a build

The acceptance test is the reproduction, inverted:

```bash
adb -s <serial> shell svc wifi disable
adb -s <serial> shell svc data disable
# arm alarms, wait out BACKGROUND_TASK_INTERVAL_HOURS
adb -s <serial> shell dumpsys jobscheduler | grep -A20 com.mugtaba.athan | \
  grep -E "Required|Satisfied|Unsatisfied|Ready"
```

Pass: the task runs with no network at all and the rolling window moves.

## Bench and gotchas

OnePlus 3T `8f7ada76` and iPhone XS `00008020-0015585C22D2002E` are on the desk for weeks.
The 8T went back to its user on a production build and is gone.

- Count alarms with `ai/features/reboot-rearm/count-alarms.sh <serial>`, never a bare
  `grep -c`: the dump repeats each alarm under "Next wake from idle" as well as in its batch.
- This 3T's connectivity flag is unreliable. Confirm with `ping` from the device before
  believing any `Unsatisfied constraints: CONNECTIVITY`, and check whether other packages
  carry it too.
- The 3T is a local build serving MOCK times, launch-relative. Only a production build shows
  real prayer times.
- mobile-mcp and Maestro's Android driver both failed mid-session; `uiautomator dump` gets
  killed under memory pressure with two app versions resident. `adb shell input tap` with
  coordinates from a good dump, plus `dumpsys` for verdicts, worked throughout.
- The XS is reachable by `devicectl` but not `pymobiledevice3`: usbmux will not pair and
  restarting `usbmuxd` needs sudo. `devicectl device process launch --console` reads the
  persisted task config; it cannot read dasd's fire log.
- This shell has no `timeout` binary. Background a capture and kill it by recorded PID.
- Version bump on every commit, `app.json` and `package.json` together, then
  `npx expo prebuild -p android --no-install` or `versionLockstep.test.ts` fails.
