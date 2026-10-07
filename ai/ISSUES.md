# Issue Ledger

Every issue this project has numbered. Code comments, tests and records cite them as `ISSUES #NN`, `F.x` and `G.x`,
so a number is permanent and never reused. Open issues carry what a session needs to act on them. Closed issues carry
one line: the cause, the fix and when it closed. The next free number is 45.

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
- **Still to do:** nothing of its own. It closes with #17. On closing, remove the known-issue line in `README.md`
  that cites #10.
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

| # | Issue | Root cause | Fix | Closed |
| --- | --- | --- | --- | --- |
| 1 | An empty year counted as fetched | `validateApiResponse` checked the shape, not the content | An empty `times` throws, so the year is retried. A partial year is never published, so no minimum count is checked | 1.5.3 |
| 2 | The December fetch was all or nothing | `Promise.all` rejected after the cache wipe while next year was unpublished | `Promise.allSettled`: each year saves and flags on its own | 1.5.3 |
| 3 | Every December retry wiped and refetched the year | Nothing checked that the current year was already cached | `isCurrentYearCached()` fetches next year only | 1.5.3 |
| 4 | 1 January downloaded the whole previous year | The wipe removed 31 December, which the countdown bar and the Extras night need | The refresh saves yesterday back across the wipe | 1.24.14 |
| 5 | 31 December night times used the same day's Fajr | Next year's Fajr was not in the payload | Superseded by #29: night times are no longer stored | 1.24.12 |
| 6 | Old-year records linger for months | Only a full refresh drops them, and nothing reads them | Accepted by design | accepted |
| 7 | The alert horizon was two days | Sized to the iOS limit of 64 pending requests. The owner rejected a per-platform horizon | Superseded: the buffer is a request budget (`NOTIFICATION_REQUEST_BUDGET`), armed a whole row at a time, the same on both platforms | wontfix 2026-08-29, superseded 1.29.5 |
| 8 | The background task never ran | `minimumInterval` takes minutes and received seconds (10800 is 7.5 days), and every launch re-armed the persisted value | `BACKGROUND_TASK_INTERVAL_MINUTES`, and `registerBackgroundTask` always unregisters first | 1.18.0 |
| 9 | ADR-007 drift and a registration gap | The ADR described a skip lock where the code queues, and foreground return did not register the task | ADR corrected, registration added | 1.5.3 |
| 11 | Alerts fire up to a minute early | Device clock skew. No Android alarm API fires early | Not fixable in the app. Compare the phone's clock with a reference when it happens | wontfix 2026-08-29 |
| 12 | Double notifications | Random identifiers, so a process death between scheduling and the record left an orphan alarm | Deterministic identifiers replace in place, and a sweep cancels strays | 1.6.0 |
| 13 | The shipped Android manifest was unverified | Prebuild merges permissions from libraries | Both exact-alarm permissions confirmed in the release APK. `RECORD_AUDIO` removed at its source | 1.5.3, 1.12.3 |
| 14 | No exact-alarm observability in the app | expo-notifications exposes no `canScheduleExactAlarms` | An in-app module was rejected by the owner. `yarn check:device` reads the same state over adb | wontfix 2026-08-29 |
| 15 | Zero alerts during a reschedule | The reschedule cancelled everything before scheduling | Schedule first under the same identifiers, then cancel only what is stale | 1.6.0 |
| 16 | iOS keeps only the soonest 64 pending requests | Platform limit | It is the budget the buffer fills (#7) | closed with #7 |
| 18 | Android force-stop cancels every alarm | AOSP behaviour, on every phone | None possible. The next app open re-arms (#36) | accepted 2026-09-03 |
| 19 | The 8T loses its job and its alarms on every reboot | OnePlus Auto-launch, off by default, withholds the boot broadcast with no state adb can read | Only the user's own toggle. The part that is ours is #36 | mitigated 2026-09-03 |
| 20 | After an Android reboot the headless task body never completes | Upstream and untraced. The signature is `No task registered for key expo-task-manager` at +2 s, then a cancel at 10 minutes | Accepted: boot restores the alarms already scheduled, and the next app open refreshes. iOS is unaffected | accepted 2026-09-09 |
| 21 | Android 9 failed every real fetch | The API accepts TLS 1.3 only, Android 9 ships it disabled, and okhttp snapshots the SSL context before any JS runs | `modules/tls13`: a ContentProvider installs the GMS provider before `Application.onCreate` | 1.22.10 |
| 22 | "Sunrise" wrapped onto two lines on the 3T | The write-once width measure could land narrow on a congested first launch | A grow-only cache, with the measuring texts kept mounted | 1.22.19 |
| 23 | Extras at-time alerts played the athan | The sound choice ignored which prayer it was | Only the five daily prayers play the selected athan. Sunrise and every extra play the fixed `reminder.mp3` on their own channel | 1.22.23 |
| 24 | The splash held through the whole first-launch fetch | The splash hid only once content existed | A cold launch hides it at the spinner frame. A warm launch keeps the complete-first-frame gate | 1.22.24 |
| 25 | Sound preview dead on the first tap after a clip ends | `useAudioPlayerStatus` keeps the released player's last status, which reaped each new player | Status is ignored unless `status.id` is the current player's | 1.23.2 |
| 26 | The Android overlay dimmed the header | Seen once on an emulator | Not reproducible on any owned target. No change | 2026-09-09 |
| 27 | One row on the list after a day roll | `filterRelevantPrayers` kept a passed row only when its list day equalled the display date | The dashes work replaced the equality with `>=`. A test guards the day roll | 1.27.0, guarded 1.29.34 |
| 28 | A fetch on a clock-change eve shifted night times by 20 to 40 minutes | The helpers built Maghrib and Fajr on the fetch day's date | Computed from the time strings, then superseded by #29 | 1.24.9 |
| 29 | Extras Midnight and Last Third were a night late, and alerts could fire on another night | The night ran from the day's own Maghrib, and triggers were rebuilt from a date plus a time string | A night runs from the previous Maghrib to this Fajr as real instants and is never stored. Alerts fire at the list row's `datetime` | 1.24.12 |
| 30 | A phone in another timezone read London's calendar from its own clock | Day keys, Friday, the year and the alert window used device-local getters | Days follow `PRAYER_TIMEZONE` through Intl and travel as `YYYY-MM-DD`. `yarn test:tz` guards it | 1.24.14 |
| 31 | After three days in the background the list skipped today's prayers | `refreshSequence` rebuilt from tomorrow | It builds from today when nothing from today is left | 1.24.14 |
| 32 | Cold launch on the 3T measured 6.6 s | 3.1 s was the TLS provider install of #21, on Android 9 and below only. About 1.9 s was JS evaluation and mount | Characterised, no fix. The provider install must stay where it is. A build at 1.27.394 read 3.1 s in total | 1.24.17 |
| 33 | A test failed one run in sixty | A bare `jest.useFakeTimers()` seeds from the real clock | Clock pinned | 1.24.28 |
| 34 | An app update cancelled every alert, then stayed quiet for 12 hours | The upgrade wipe removed the bookkeeping, the sweep cancelled the alarms Android had restored, and the gate was stamped anyway | Bail with no prayer data, never sweep on empty records, stamp only after a real reschedule. The cache is wiped only when `CACHE_SCHEMA_VERSION` changes | 1.24.31, 1.24.33 |
| 35 | The update prompt read a hand-edited file | `releases.json` on GitHub needed an edit after every release, and a failed check cost a day | iOS reads iTunes Lookup. Android asks Play through `expo-in-app-updates`. A failed check retries in an hour. The file is deleted | 1.29.30 |
| 36 | Lost alarms stayed lost | The refresh gate trusted a recent timestamp while no alarm existed | `reopenRefreshGateOnColdLaunch` on Android. Background interval 3 hours, foreground gate 2 hours (ADR-007 rev 4) | 1.27.326 |
| 38 | Android widgets clipped prayer names outside the 3T | 332dp of fixed columns inside a 310dp `minWidth`, which is a floor and not a grant | Columns are shares of the width the launcher grants | 1.27.343 |
| 39 | Android's dark widget card did not match iOS | The card is a pre-rendered bitmap with its own colour literal | One dark card colour on both platforms | 2026-09-24 |
| 40 | The Android active pill overhung the times | The pill filled the list column while the rows sat padded inside it | Equal margins either side of the row text | 2026-09-24 |
| 41 | Five notification tests failed after 12:00 London | The seed took the day from the real clock and put a fixed time on it | Clock pinned before the seed. The rule is in `__tests__/README.md` | 1.29.23 |
| 42 | The previous-row keep in `filterRelevantPrayers` survives mutation to `===` | The mutation is equivalent over every reachable state | Closed by a test that fails when the clause is removed | 1.29.41 |
| 43 | Magrib and Isha past midnight at polar latitudes | A question from the owner, not a defect | Verified safe against real Tromso, Reykjavik and Nuuk data. No change | 2026-09-27 |
| 44 | `widgetAndroid.test.ts` failed for part of every hour | Fixed wall-clock seeds on an unpinned clock, the trap of #41 in another file | Clock pinned | 1.29.51 |

### F. SDK 57 migration findings (2026-08-28)

| # | Issue | Root cause | Fix | Closed |
| --- | --- | --- | --- | --- |
| F.1 | Render crash on selecting a prayer during a refresh | `usePrayer` indexed the filtered list unguarded | A missing row renders the loading placeholder | 2026-08-28 |
| F.2 | `@expo/ui` bottom sheets | The native sheets could not be styled, and custom replacements failed on drag handling | Back to `@gorhom/bottom-sheet`. Android back dismisses the top sheet | reverted 1.6.0 |
| F.3 | Alert settings were keyed by row index | Index and name agree while times are in order | Preferences are now keyed by prayer name. The scheduled-notification records still carry the index | accepted |
| F.4 | Friday Extras order | The chronological render pushed Istijaba mid-list | `canonicalDisplayOrder`: the Extras order is fixed and Istijaba is always last | 1.5.3 |
| F.5 | The font-scaling guard was dead on SDK 57 | React 19 dropped `defaultProps` on function components | `jsx-runtime-shim.ts` through a Metro `resolveRequest` hook | 2026-08-28 |
| F.6 | The countdown stretched in its final seconds | `setInterval` drift, floor rounding and stacked tickers | A wall-second `setTimeout` chain, a ceil display that never shows 0, one ticker | 1.5.3 |
| F.7 | The status bar flipped the minute before the countdown | The same drift | Fixed by F.6 | 1.5.3 |
| F.8 | 77 Biome warnings | Backlog from the Biome migration | Cleared with the rule left on | 1.5.3 |
| F.9 | The overlay drew about 70px high | The `@expo/ui` native pager shifts its children's coordinate space | Back to `react-native-pager-view`. `@expo/ui` is allowed only in widget layouts | 1.5.3 |
| F.10 | The Android overlay sat one status bar too low | An old `+ insets.top` double-counted once `measureInWindow` became window-absolute under edge-to-edge | Term removed | 1.6.0 |

### G. First device test on the iPhone XS (2026-09-02)

| # | Issue | Root cause | Fix | Closed |
| --- | --- | --- | --- | --- |
| G.1 | Five home widgets stayed blank | expo-widgets gave every view a new random identity per render, so each reload rebuilt the whole tree at 5 to 13 CPU-seconds per kind. Per-minute pushes of ten kinds exhausted the extension's CPU budget and WidgetKit retried an hour later | Upstream expo/expo#49810, in expo-widgets 58.0.1. The app pushes only when data changes, never on a timer. The iOS widgets flag ships on, and its comment in `shared/flags.ts` holds the acceptance check | 1.27.378 |
| G.2 | A newly placed widget shows a blank card for a few seconds | The extension's cold start evaluates a 153 KB bundle before it can draw. Nothing of ours runs before it | None. The owner no longer sees it | 1.29.47 |
| G.3 | A settings toggle thumb out of step with its value | An effect-driven `withTiming` could be interrupted | `useDerivedValue` | 1.17.6 |
| G.4 | Sound preview silent on the iPhone | 32 concurrent players and no audio mode | One shared player, and `setAudioModeAsync` at startup | 1.17.6 |
| G.5 | The preview countdown was missing | No status stream, from G.4 | Fixed by G.4 | 1.17.6 |
| G.6 | The app felt slow on the device | Episodic JS-thread freezes | The performance campaign cut idle CPU on the 3T from 80.6% to 19.3%. The owner accepts the rest | accepted 2026-09-09 |
| G.7 | A `widgetSettingsSync` test fired a third push in 1 to 2% of runs | An unpinned fake clock crossed a minute flip | Clock pinned | 1.17.6 |
| G.8 | Rapid toggle presses crashed the app once | Intermittent. Suspected the same race as G.3 | No crash since the G.3 fix | 1.17.6 |

### Facts that nothing else records

| From | Fact | Why it matters |
| --- | --- | --- |
| 35 | The Android update flow has never run its happy path on a phone. Play answers `ERROR_APP_NOT_OWNED` to a side-loaded build | Check it on the first build installed from Play |
| 35 | `setTimeout` clamps a delay above 2^31-1 ms to 1 ms | A break script cannot disable a timer by enlarging its delay. Remove what the callback does |
| 35 | `aapt2 dump strings` missed a native module that sat in `classes2.dex`, and R8 renames Play Core's class paths | To prove a module reached an APK, search each dex file for the module's own string literals |
| 8 | On an iPhone `getStatusAsync()` answers `available` on every real device, so the restricted check in `registerBackgroundTask` cannot see Background App Refresh switched off or Low Power Mode | The log line that names those two causes never fires on a phone. Upstream expo/expo#48786 |
