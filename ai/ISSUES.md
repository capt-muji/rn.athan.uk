# Issue Ledger

Every issue this project has numbered. Code comments, tests and records cite them as `ISSUES #NN`, `F.x` and `G.x`,
so a number is permanent and never reused. Open issues carry what a session needs to act on them. Closed issues
keep their number, title and closing stamp; the full cause-and-fix record lives in this file's git history and in
the repository's commit history, and the campaign records in `ai/plans/README.md` carry the resolution detail. The
next free number is 45.

State as of 2026-10-07. Versions are repository versions, not store releases.

## Open

| # | Issue | State |
| --- | --- | --- |
| 10 | Alerts arrive late on ColorOS-family phones | The fix is on `uat`. Closes with #17 |
| 17 | OEM windowed delivery of exact alarms, the cause of #10 | The fix is on `uat`. Waits on a store release and one reading on an affected phone |
| 37 | The background task requires a network it never uses | Patched locally. The upstream pull request is open and unreviewed |

### 10. Alerts arrive late on ColorOS-family phones

- **Symptom:** at-time alerts land late on the OnePlus 8T (OxygenOS 12) and the Oppo Find X8 (ColorOS 16), usually
  by about a minute. The iPhone, the OnePlus 3T and 5T and a Galaxy are exact.
- **Cause:** #17. Early fires are #11, a different cause.
- **Ruled out by the owner on the phones:** per-app battery optimisation, app priority, and the Alarms and
  reminders toggle.
- **Still to do:** nothing of its own. It closes with #17. On closing, remove the known-issue
  bullet in `README.md`'s Roadmap (the ColorOS/OxygenOS lateness line).
- **If lateness survives #17's fix:** run `yarn check:device X8_SERIAL`, which fails when exact alarms are not
  permitted and reports the doze allowlist. Then switch off the system-wide battery features on the 8T (Deep
  optimisation, Adaptive Battery, Sleep Standby Optimisation). They differ from the per-app toggle and were never
  tried. They are diagnostics only: the owner rules out any battery or auto-launch toggle as a remedy for users.

### 17. OEM windowed delivery of exact alarms

- **Cause, measured:** on those two phones the OS stores an alarm set through expo-notifications' exact path with a
  deferral window (`dumpsys alarm`: `window=+1h0m0s0ms flags=0x4`) and delivers it inside that window by battery
  policy. Measured delays run from +21 s to +2 m 21 s, with a planned worst case over two hours on an unattended
  phone. The app posts within 0.3 s of delivery, so the whole delay is the OS alarm queue.
- **The app is not the cause:** a blank Expo app with one date trigger is windowed identically on both phones and
  exact on the 3T and 5T. It is per-package OEM policy that adb cannot read. A bare APK calling `setAlarmClock()`
  delivers within 43 ms on all four phones in every condition tried.
- **Upstream fix (ours):** [expo/expo#49687](https://github.com/expo/expo/pull/49687), merged 2026-09-08, ships in
  SDK 58. `delivery: 'alarmClock'` on a trigger calls `AlarmManager.setAlarmClock()`. It is Android only and
  degrades silently to best effort without the exact-alarm permission. On the pull request's branch both phones
  stored `window=0 flags=0x9`, and the Find X8 delivered at +0 ms against +12.7 s for a plain sibling.
- **In place today:** `uat` is on the SDK 58 preview, and every at-time alert and every reminder carries
  `ALARM_CLOCK_DELIVERY` (`shared/notifications.ts`). Proven on the 3T (Android 9): every armed alarm reads
  `window=0` with an `Alarm clock:` sub-block and holds the system's next-alarm-clock slot. Android 9 shows no
  `0x8` flag bit, so do not expect `flags=0x9` there. The status-bar alarm icon cannot be hidden, and the owner
  accepts it.
- **Still to do:**
  1. Ship it. The store builds predate the adoption, so users of these phones keep late alerts until a release.
     No store release goes out before the SDK 58 stable re-pin, which is queued in `ai/plans/README.md`.
  2. On a Find X8 or an 8T running a build of `uat`, read `adb -s X8_SERIAL shell dumpsys alarm`. Every
     `NOTIFICATION_EVENT` alarm must read `window=0` with alarm-clock class (`flags=0x9` on Android 12 and above),
     and an alert must sound in its own minute.
  3. Close #10 and #17 when both hold.
- **Decision that stands:** no notification library swap. Another prayer app reported alerts four hours late even
  in alarm-clock mode (flutter_local_notifications #2369), so OEM policy can beat any library.

### 37. The background task requires a network it never uses

- **Symptom:** a phone that is offline, in airplane mode or holding a stale connectivity flag does not run the
  background notification refresh, so it loses its unattended recovery of lost alarms until a network returns.
- **Cause:** `expo-background-task` hardcodes a network requirement on both platforms, and its options type offered
  no way to drop it. The refresh arms alarms from the MMKV cache and treats its `sync()` as best effort, so it
  needs no network.
- **In place today:** `patches/expo-background-task+58.0.7.patch` adds `requiresNetworkConnectivity?: boolean` to
  `BackgroundTaskOptions`, default `true`, and `registerBackgroundTask` in `stores/notifications.ts` passes
  `false`. The foreground gate of #36 needs no network and re-arms on the next app open.
- **Upstream:**

  | Item | State on 2026-10-07 |
  | --- | --- |
  | [expo/expo#50581](https://github.com/expo/expo/pull/50581), ours, opened 2026-09-24 | Open, no maintainer review. Same option and default, with tests on both platforms |
  | [expo/expo#48122](https://github.com/expo/expo/issues/48122), the issue | Open and unassigned. Our reproduction is [a comment on it](https://github.com/expo/expo/issues/48122#issuecomment-5809639597) |
  | Newest published `expo-background-task`, 58.0.10 | Still hardcodes the requirement on both platforms |

- **Still to do:**
  1. Read #50581 at the start of any session that touches patches or the background task. Nothing is owed until a
     maintainer reviews it.
  2. On every bump of `expo-background-task`, starting with the SDK 58 stable re-pin, rebuild the patch against
     the new version and prove it on a phone, never by a green build.
  3. When a published version carries the option, delete the patch and keep the caller's `false`.
- **Record:** `ai/features/reboot-rearm/ISSUE-37-NETWORK-CONSTRAINT.md` holds the readings per phone, the commands
  that give an immediate verdict, the rules for patching an Expo module, and what is still unwitnessed.

## Closed

### Numbered issues

| # | Issue | Closed |
| --- | --- | --- |
| 1 | An empty year counted as fetched | 1.5.3 |
| 2 | The December fetch was all or nothing | 1.5.3 |
| 3 | Every December retry wiped and refetched the year | 1.5.3 |
| 4 | 1 January downloaded the whole previous year | 1.24.14 |
| 5 | 31 December night times used the same day's Fajr | 1.24.12 |
| 6 | Old-year records linger for months | accepted |
| 7 | The alert horizon was two days | wontfix 2026-08-29, superseded 1.29.5 |
| 8 | The background task never ran | 1.18.0 |
| 9 | ADR-007 drift and a registration gap | 1.5.3 |
| 11 | Alerts fire up to a minute early | wontfix 2026-08-29 |
| 12 | Double notifications | 1.6.0 |
| 13 | The shipped Android manifest was unverified | 1.5.3, 1.12.3 |
| 14 | No exact-alarm observability in the app | wontfix 2026-08-29 |
| 15 | Zero alerts during a reschedule | 1.6.0 |
| 16 | iOS keeps only the soonest 64 pending requests | closed with #7 |
| 18 | Android force-stop cancels every alarm | accepted 2026-09-03 |
| 19 | The 8T loses its job and its alarms on every reboot | mitigated 2026-09-03 |
| 20 | After an Android reboot the headless task body never completes | accepted 2026-09-09 |
| 21 | Android 9 failed every real fetch | 1.22.10 |
| 22 | "Sunrise" wrapped onto two lines on the 3T | 1.22.19 |
| 23 | Extras at-time alerts played the athan | 1.22.23 |
| 24 | The splash held through the whole first-launch fetch | 1.22.24 |
| 25 | Sound preview dead on the first tap after a clip ends | 1.23.2 |
| 26 | The Android overlay dimmed the header | 2026-09-09 |
| 27 | One row on the list after a day roll | 1.27.0, guarded 1.29.34 |
| 28 | A fetch on a clock-change eve shifted night times by 20 to 40 minutes | 1.24.9 |
| 29 | Extras Midnight and Last Third were a night late, and alerts could fire on another night | 1.24.12 |
| 30 | A phone in another timezone read London's calendar from its own clock | 1.24.14 |
| 31 | After three days in the background the list skipped today's prayers | 1.24.14 |
| 32 | Cold launch on the 3T measured 6.6 s | 1.24.17 |
| 33 | A test failed one run in sixty | 1.24.28 |
| 34 | An app update cancelled every alert, then stayed quiet for 12 hours | 1.24.31, 1.24.33 |
| 35 | The update prompt read a hand-edited file | 1.29.30 |
| 36 | Lost alarms stayed lost | 1.27.326 |
| 38 | Android widgets clipped prayer names outside the 3T | 1.27.343 |
| 39 | Android's dark widget card did not match iOS | 2026-09-24 |
| 40 | The Android active pill overhung the times | 2026-09-24 |
| 41 | Five notification tests failed after 12:00 London | 1.29.23 |
| 42 | The previous-row keep in `filterRelevantPrayers` survives mutation to `===` | 1.29.41 |
| 43 | Magrib and Isha past midnight at polar latitudes | 2026-09-27 |
| 44 | `widgetAndroid.test.ts` failed for part of every hour | 1.29.51 |

### F. SDK 57 migration findings (2026-08-28)

| # | Issue | Closed |
| --- | --- | --- |
| F.1 | Render crash on selecting a prayer during a refresh | 2026-08-28 |
| F.2 | `@expo/ui` bottom sheets | reverted 1.6.0 |
| F.3 | Alert settings were keyed by row index | accepted |
| F.4 | Friday Extras order | 1.5.3 |
| F.5 | The font-scaling guard was dead on SDK 57 | 2026-08-28 |
| F.6 | The countdown stretched in its final seconds | 1.5.3 |
| F.7 | The status bar flipped the minute before the countdown | 1.5.3 |
| F.8 | 77 Biome warnings | 1.5.3 |
| F.9 | The overlay drew about 70px high | 1.5.3 |
| F.10 | The Android overlay sat one status bar too low | 1.6.0 |

### G. First device test on the iPhone XS (2026-09-02)

| # | Issue | Closed |
| --- | --- | --- |
| G.1 | Five home widgets stayed blank | 1.27.378 |
| G.2 | A newly placed widget shows a blank card for a few seconds | 1.29.47 |
| G.3 | A settings toggle thumb out of step with its value | 1.17.6 |
| G.4 | Sound preview silent on the iPhone | 1.17.6 |
| G.5 | The preview countdown was missing | 1.17.6 |
| G.6 | The app felt slow on the device | accepted 2026-09-09 |
| G.7 | A `widgetSettingsSync` test fired a third push in 1 to 2% of runs | 1.17.6 |
| G.8 | Rapid toggle presses crashed the app once | 1.17.6 |

### Facts that nothing else records

| From | Fact | Why it matters |
| --- | --- | --- |
| 6 | Nothing reads old-year records; only a full refresh drops them. Accepted by design | Do not spend a session on the lingering rows |
| 13 | `RECORD_AUDIO` was removed at its source; both exact-alarm permissions were confirmed in a release APK | The manifest has no mic permission; do not re-add it or re-verify |
| 14 | An in-app exact-alarm module was rejected by the owner; `yarn check:device` is the observability | Do not propose it again |
| 1 | A partial year is never published | No minimum-count check is needed anywhere |
| 11 | Remedy for early alerts: compare the phone's clock with a reference when it happens | The only actionable response |
| 35 | The Android update flow has never run its happy path on a phone. Play answers `ERROR_APP_NOT_OWNED` to a side-loaded build | Check it on the first build installed from Play |
| 35 | `setTimeout` clamps a delay above 2^31-1 ms to 1 ms | A break script cannot disable a timer by enlarging its delay. Remove what the callback does |
| 35 | `aapt2 dump strings` missed a native module that sat in `classes2.dex`, and R8 renames Play Core's class paths | To prove a module reached an APK, search each dex file for the module's own string literals |
| 8 | On an iPhone `getStatusAsync()` answers `available` on every real device, so the restricted check in `registerBackgroundTask` cannot see Background App Refresh switched off or Low Power Mode | The log line that names those two causes never fires on a phone. Upstream expo/expo#48786 |
