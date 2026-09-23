# Verification plan — 1.27.326

Three devices, run in parallel. Each owns its own artifact and its own log file, so
nothing they do can collide.

| Device | Serial | Build | Owns |
| --- | --- | --- | --- |
| OnePlus 3T | 8f7ada76 | local Release, `com.mugtaba.athan.fleettest` | the destructive Android cases (reboot, force-stop) |
| OnePlus 8T | 543e5ac2 | 1.24.1 as the user has it, then 1.27.326 last | the before/after contrast on the phone that failed |
| iPhone XS | 00008020-0015585C22D2002E | local Release | the interval change on iOS, where dasd is the risk |

The 8T carries the user's live install, so it stays on 1.24.1 until the other two have
passed. Its `com.mugtaba.athan` and the 3T's `com.mugtaba.athan.fleettest` are different
package ids, so neither install touches the other.

## What each case has to show

### A. The interval actually shipped (all three)

`BACKGROUND_TASK_INTERVAL_MINUTES` must reach the OS as 180, not 360. A constant that
changed only in the bundle proves nothing.

- Android: `Enqueuing worker with identifier EXPO_BACKGROUND_WORKER and '180' minutes delay`,
  then `dumpsys jobscheduler` showing `Minimum latency: +2h59m59s...`
- iOS: the dasd submit line carrying `earliestBeginDate` exactly +3:00:00

### B. Reboot, app never opened (3T, then 8T)

The 3T already passed this on 1.27.323 (fired +5ms). Re-run it on 1.27.326 to show the
interval change did not disturb the boot path.

1. Arm at least two prayers on Sound, record `count-alarms.sh <serial> --list`
2. `adb reboot`, wait for `sys.boot_completed=1`
3. Do NOT open the app
4. Alarms must return at the same instants with `window=0`
5. Let one fire; it must post on its athan channel, not the fallback

### C. Alarms lost, then an app open heals it (3T, then 8T)

The regression that started all of this.

1. Record the armed count
2. `am force-stop` and record it again (expect a drop)
3. Cold launch, doubled `am start` per the install ritual
4. Count must return to the pre-stop set

On 1.24.1 the 8T stays at 0 through step 4. On 1.27.326 it must not.

### D. The gate reopens on its own (3T)

With the app merely backgrounded rather than force-stopped, a refresh must become
possible again after `NOTIFICATION_REFRESH_HOURS`, not after twelve.

### E. iOS soak (XS)

The one case that cannot be hurried: leave the app backgrounded and watch for a natural
fire at or after +3h with no `group is full` deferral. A deferral here is the signal that
rev 4 was wrong on iOS, and it is the only result that would send the background interval
back to 6h.

## Ground rules

- Read the DEVICE clock for anything time-sensitive; hosts drift from phones.
- Allow settling time after boot before believing a verdict: ISSUES #19 recorded the
  re-arm landing up to ~2 minutes after `boot_completed`, and a read at +60s raced it.
- Count alarms with `count-alarms.sh`, never a bare `grep -c`.

## Baselines captured before any install

### 8T, still on the user's 1.24.1 (2026-09-23 23:45 device time)

| Reading | Value |
| --- | --- |
| `versionName` / `versionCode` | 1.24.1 / 9 |
| Prayer alarms | **0** |
| App process | alive |
| Background job `Minimum latency` | **+5h59m59s998ms** (the old 6h) |

Still zero alarms, hours after the reboot and after every app open of the evening. This
is the defect standing live on the phone, and it is the "before" the 1.27.326 install has
to overturn.

## 3T results — 1.27.326, local Release (2026-09-24 00:0x–00:11)

Installed over 1.27.323, `versionName=1.27.326`, `com.mugtaba.athan.fleettest`.

### A. The interval reached the OS ✅

```
BackgroundTaskModule: registerTaskAsync: NOTIFICATION_REFRESH_TASK with options {minimumInterval=180.0}
BackgroundTaskScheduler: Enqueuing worker with identifier EXPO_BACKGROUND_WORKER and '180' minutes delay.
```

`dumpsys jobscheduler`: `Minimum latency: +2h59m59s988ms`, against `+5h59m59s998ms` still
showing on the 8T's 1.24.1. The constant is not merely changed in the bundle; the scheduler
holds the new value.

### C. Alarms lost, then healed by one app open ✅

| Step | Alarms |
| --- | --- |
| Armed (Fajr + Magrib on Sound) | **3** |
| After `am force-stop` | **1** |
| After one cold launch | **3** |

Same shape as the 1.27.323 run, so the retune did not disturb the cold-launch re-arm.

### B. Reboot, app never opened ✅

Rebooted 00:08:14 with 3 armed; booted 00:08:56.

| Reading | Value |
| --- | --- |
| Alarms at +14s, steady to +140s | **4** (the boot restore also brought back a row the pre-reboot set had already passed) |
| Delivery flags | `window=0 flags=0x3` with an `Alarm clock:` block on every one |
| App process | alive at +14s, **gone by +98s while the alarms stayed** |
| Background job | `Minimum latency: +2h58m32s956ms`, re-armed at the new interval |

The process dying while the alarms remain is the point: the restore is AlarmManager state
written by expo's boot receiver, not something the app has to stay alive to hold.

## Tooling note

mobile-mcp stopped working mid-session (`mobilecli ... ENOENT`) and Maestro's Android
driver would not start on the 3T (`driver port 7001` timeout), most likely the host's
midnight cleanup. `uiautomator dump` was also killed under memory pressure with both the
old and new package resident. What worked throughout: `adb shell input tap` against
coordinates read from an earlier successful dump, and `dumpsys` for every verdict. Freeing
memory with `am force-stop` on the package not under test is worth doing first.

### D/F. 3T unattended soak — started 2026-09-24 00:25 device time

Left untouched after the reboot run, app not opened, to prove the 3h background task
actually fires rather than merely being scheduled at 3h.

| Baseline | Value |
| --- | --- |
| Alarms | 4 (20:19, 21:31 on the 24th; 00:11, 20:19 on the 25th) |
| Job `Minimum latency` | +2h58m32s956ms, so due ~03:07 device time |

Pass: a run at or after the due time that re-arms the window and re-enqueues at 180
minutes. Fail: no run long past due, which would mean 3h is being rationed on Android.

## Pre-existing tsc errors, not from this branch

`tsc --noEmit` reports 44 lines of `ViewStyle` / `position: "fixed"` incompatibilities in
`app/Screen.tsx`, `components/overlay/Overlay.tsx`, `components/prayer/*` and
`components/ui/Glow.tsx`. None of those files is touched here.

Verified by bisection rather than asserted: stashing this branch's work leaves the same
errors, and `git checkout uat-2` with a clean tree produces the same **44** lines. This
branch's count is also 44, so it adds none. `react-native` (0.88.0-rc.0) and
`react-native-reanimated` (4.6.0) match their declared versions and `node_modules` has not
been reinstalled since 2026-09-20, so this is a pre-existing RC type mismatch on `uat-2`,
not fallout from the prebuilds run in this session.

Jest and biome are clean: 169 suites, 4620 tests, 100% statements, branches, functions and
lines.

## iPhone XS results — 1.27.326, local Release (2026-09-24 00:29–00:35)

Built with `xcodebuild -configuration Release`, `CFBundleShortVersionString 1.27.326`,
installed with `devicectl`.

### A. The interval reached iOS ✅

`EXTaskService: Restoring tasks configuration` on launch:

```
"NOTIFICATION_REFRESH_TASK" = {
    consumerClass = "ExpoBackgroundTask.BackgroundTaskConsumer";
    options = { minimumInterval = 180; };
};
```

180, not 360, on both platforms now. This is the PERSISTED configuration rather than a
value read from the fresh bundle, which is the one that matters here: ISSUES #8 was caused
by expo-task-manager restoring a stale persisted `minimumInterval` and re-arming from it
forever. `registerBackgroundTask` unregisters before registering precisely so this record
cannot go stale, and the restore above shows the new value took.

### E. Soak — pending

The remaining iOS question is whether a 3h `earliestBeginDate` is honoured or deferred
with `group is full`. Only elapsed time answers it. Note for whoever runs it: the XS is
currently reachable over Wi-Fi but NOT over usbmux (`pymobiledevice3 usbmux list` is
empty, while `devicectl list devices` shows it connected), so `pymobiledevice3 syslog
live` cannot attach. `devicectl device process launch --console` does work and is what
captured the block above.

Also worth knowing: this shell has no `timeout` binary. Backgrounding a capture and
killing it by recorded PID is the pattern that works.
