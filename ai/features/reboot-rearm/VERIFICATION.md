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

## 8T results — the user's own phone, 1.24.1 replaced by 1.27.326 (2026-09-24 00:58–01:09)

Clean install of the REAL package (`com.mugtaba.athan`, no fleettest suffix) at the owner's
instruction: uninstall then install, so MMKV went with it and the app came up with no
preferences. Five daily prayers set back to Sound for the test.

### Interval, before and after on the same handset ✅

| | 1.24.1 | 1.27.326 |
| --- | --- | --- |
| Job `Minimum latency` | +5h59m59s998ms | **+2h59m59s997ms** |
| `registerTaskAsync` options | — | `{minimumInterval=180.0}` |

### The regression, on the phone that reported it ✅

| Step | 1.24.1 (measured earlier tonight) | 1.27.326 |
| --- | --- | --- |
| Armed | — | 7 |
| After `am force-stop` | 0 | 0 |
| **After one cold launch** | **0** | **8** |

The 1.24.1 column is not inferred: the same `force-stop` then doubled `am start` sequence
was run on it at 22:56 and left zero alarms after 30s in the foreground, with logcat
showing `TaskService: Registered task` so initialisation had definitely completed.

### Reboot, app never opened — the OEM ceiling, reproduced ✅❌

Rebooted 01:03:42 with 8 armed.

| Reading | Value |
| --- | --- |
| Alarms from +4min to +5.5min, every 14s | **0** |
| App process | **0**, never started |
| Alarms after ONE app open | **8**, all `window=0` |

This is ISSUES #19 exactly: OxygenOS 12 never delivered the boot broadcast, so
expo-notifications' re-arm never ran and no process existed to run it. The 3T, on the same
build, restored its alarms unattended at +14s. The OEM half is not fixable from inside the
app and was never claimed to be.

What IS fixed is everything after that. On 1.24.1 the phone stayed at zero through 18 app
opens; on 1.27.326 the first open restores the full set. The user's lived failure —
Magrib and Isha passing in silence with the app opened repeatedly in between — cannot
recur.

### Left on the device

1.27.326, five daily prayers on Sound, 8 alarms armed, background job due in 3h. Two things
the owner should know: the clean install wiped the user's own preferences (sound choice,
reminders, Extras), and this is a LOCAL build running mock times, so the armed instants are
launch-relative and meaningless. A production build is required before the phone goes back.

## 8T handed back — production build (2026-09-24 01:15)

Rebuilt with the production environment injected the documented way:

```
npx eas env:exec production 'cd android && ./gradlew assembleRelease -q'
```

The first attempt was a Gradle no-op (unchanged APK timestamp), so the bundle and apk
outputs were deleted to force a re-bundle. Confirmed the right artifact by finding the
production API key in `index.android.bundle`, rather than trusting the command exited 0.

| Check | Reading |
| --- | --- |
| Package | `com.mugtaba.athan`, the only athan package on the device |
| Version | 1.27.326 (`versionCode=1000000`) |
| Times on screen | 05:18, 06:47, 12:58, 16:08, **18:58**, **20:14** |
| Background job | `Minimum latency: +2h59m59s997ms` |

Those are real London times, not the launch-relative mocks a local build serves, and the
last two are the Maghrib and Isha that started this investigation.

Left for the owner to do: the app has no preferences set, because the clean install wiped
MMKV. The user re-picks their alerts, sound and reminders.

## Two blockers cleared to get a green push (1.27.327, 1.27.328)

The pre-push hook runs `yarn validate`, and it was already failing on `uat-2` before this
work started. Both causes were pre-existing and neither belonged to the notification fix,
so each landed as its own commit.

**Types (1.27.327).** Under React Native 0.88 the package root resolves to
`types_generated`, where `ViewStyle` is the loose authoring shape and carries the web-only
`position: 'fixed' | 'sticky'`. `View` accepts a narrower internal type, so five components
annotating computed styles or style props as `ViewStyle` were compile errors: 8 across
`app/Screen.tsx`, `components/overlay/Overlay.tsx`, `components/prayer/ActiveBackground.tsx`,
`components/prayer/Explanation.tsx` and `components/ui/Glow.tsx`.

The fix is `ViewProps['style']`. RN's own doc comment recommends `ViewStyleProp`, but that
type is declared and never re-exported from the package root, so it cannot be imported;
`StyleProp<ViewStyle>` fails for the same reason `ViewStyle` does. Both were tried against
the compiler rather than reasoned about, and a scratch probe file confirmed
`ViewProps['style']` before any component was touched.

**Beacon (1.27.328).** The auto-handoff plugin moved its transient status file from
`handoffs/.status.json` to `.handoffs/.status/<id>.json`. The existing ignore line no
longer matched, so biome kept failing on a one-line JSON nobody authors by hand.

`yarn validate` now passes end to end for the first time this session: tsc clean, biome
clean, 169 suites, 4620 tests, 100% statements, branches, functions and lines. Branch
pushed with the hook running, not bypassed.

## 3T soak result — headless run proven, natural fire NOT proven (2026-09-24 06:23)

The window came and went while the bench was unattended. At 06:23 the job was overdue by
3h16m and had not run, and the reason is in the dump rather than in the change:

```
Satisfied constraints:   TIMING_DELAY DEVICE_NOT_DOZING BACKGROUND_NOT_RESTRICTED
Unsatisfied constraints: CONNECTIVITY
```

`TIMING_DELAY` is satisfied, so the 3-hour interval elapsed exactly as asked. What blocked
the run is `CONNECTIVITY`, and that is an environment fault, not a policy one: the 3T holds
a validated WiFi link (`VALIDATED`, SSID "Hallway 5GHz", signal -63) and pings 8.8.8.8 with
0% loss from the same shell. JobScheduler's own view of the constraint is stale, a known
Android 9 quirk on this handset, and `expo-background-task` requires network by design
(`requiresNetworkConnectivity = true` on iOS, `NetworkRequest INTERNET&VALIDATED` here).

Forcing the job proves the half that is ours:

```
cmd jobscheduler run -f com.mugtaba.athan.fleettest 7
BackgroundTaskConsumer: Executing task 'NOTIFICATION_REFRESH_TASK'
TaskService: Started headless task 1 to keep JS timers alive
```

The app had no process before this and the task still ran, which is the headless path the
whole rolling buffer depends on. The alarm set stayed correct at 4 and the next run
re-enqueued at `+2h58m32s956ms`.

**What this does and does not establish.** The task body, the headless launch and the
180-minute re-enqueue are all verified. A natural, unforced fire at the 3-hour mark is NOT,
because the OS never scheduled one while the constraint read unsatisfied. That is a gap in
the evidence and is recorded as such rather than glossed: re-run the soak on a device whose
connectivity flag is healthy before claiming the natural cadence.

### The stale CONNECTIVITY flag is device-wide, not ours

Worth isolating before anyone reads the soak gap as a defect in the change. A WiFi off/on
cycle did not clear it, and the same `Unsatisfied constraints: CONNECTIVITY` is sitting on
other packages' jobs on the same device:

- `com.google.android.apps.tachyon`
- `com.qualcomm.qti.qms.service.connectionsecurity`
- `com.mugtaba.athan.fleettest`

Google's own app is stuck behind the identical flag while the device pings 8.8.8.8 at 0%
loss. So the blocked run is this 3T's JobScheduler, not the 3-hour interval and not
expo-background-task. Verifying the natural cadence needs a device without this fault.

## Where the evidence stands

| Claim | 3T | 8T | XS |
| --- | --- | --- | --- |
| 180 minutes reaches the OS | ✅ `+2h59m59s988ms` | ✅ `+2h59m59s997ms` | ✅ `minimumInterval = 180` |
| Alarms lost then healed by one app open | ✅ 3→1→3 | ✅ 7→0→8 | n/a, iOS keeps pending across termination |
| Reboot, app never opened | ✅ re-armed at +14s, fired +5ms | ❌ OEM suppressed (ISSUES #19), healed on first open | not re-run; recorded ✅ in the RUNBOOK at the 15-minute interval |
| Background task runs headlessly | ✅ forced run, no app process | — | — |
| Natural unforced fire at 3h | ❌ blocked by a device-wide stale flag | — | ❌ not observed |

The retune and the re-arm are verified on real hardware. The one thing still unproven on
either platform is a natural, unforced background fire at the new interval: Android was
blocked by this 3T's own JobScheduler fault, and iOS cannot be watched from here because
usbmux will not pair (`pymobiledevice3 usbmux list` is empty with the phone on USB, and
restarting `usbmuxd` needs sudo). `devicectl` reads the persisted config but not dasd's
fire log.

That gap is bounded. `earliestBeginDate` and `TIMING_DELAY` both elapsed correctly, so the
interval is being asked for properly; what is unwitnessed is the OS choosing to run it. The
prior 6-hour cadence was never proven to fire naturally in this session either, so nothing
regressed. Anyone continuing: watch a healthy Android device across a 3h window, or get
usbmux pairing and grep dasd for `group is full` on the XS.
