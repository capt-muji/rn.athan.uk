# Plan: Session 6. An alert always does what its bell shows (findings 79, 80 and 82)

| Field | Value |
| --- | --- |
| Brief | `ai/prompts/alert-integrity.md` |
| Planned at | `b5159305` (version 1.27.164), 2026-09-15; the commits on `uat-2` since then change documents only, none of the files this plan anchors on |
| Planned by | Claude, planning session on 2026-09-15 |
| Needs first | nothing |
| Steps | 3, each one branch, one commit, one version, then the device proof |
| Device | OnePlus 3T: two Ramadan mock builds, a local production build, then the latest mock build |
| Owner decisions still needed | None (every one was taken while planning; see section 2) |

## 1. Goal

Today three rare failures can leave the app stuck or let scheduling work collide:

- **79:** tapping an Off bell while notifications are refused can do nothing, because the "Open Settings" path never
  answers when Settings cannot open, and it reads the permission before the user can have changed it.
- **80:** in Ramadan, a start-up error can leave the splash over the error screen, so its Refresh button is out of reach.
- **82:** one refused cancel frees the scheduling lock while other prayers are still arming, so a later change can land
  in the middle of them and leave an Off prayer armed.

When this plan is DONE:
- the "Open Settings" path always answers, and reads the permission once the user is back;
- any start-up error lifts the splash onto the error page, whatever the season;
- the scheduling lock is held until every piece of scheduling work has ended.

The owner notices only when one of these rare failures happens: "Open Settings" always returns and picks up a
permission allowed in Settings; a start-up error shows the error page and its Refresh button instead of a stuck splash.

Finding 81 (a refused cancel during an Off commit, and the all-or-nothing rule) is not in this plan: the owner split it
into session 6b (`ai/prompts/alert-all-or-nothing.md`) after its first design failed review.

The owner's rules that apply, quoted:
- `ai/prompts/alert-integrity.md`, 2026-09-15: "If I, as a user, see that the alert is the bell icon with a slash, then
  I know I'm not going to get notifications. If I have the bell icon, then I'm going to get notifications. If I have
  the sound icon, then I'm going to get notifications. It's as simple as that. If I turn it off, I expect it to turn
  off."
- The same brief: "Waiting for 'the next refresh' to heal a wrong state is not acceptable."
- `ai/prompts/alert-integrity.md`, the owner's decisions after session 5, item 80: "if there's an app error, we should
  always show the error page so that the user can actually reset, click the reset button".

## 2. Decisions

### 2.1 Taken

1. **79 is fixed with the small fix:** a failure to open Settings, or to read the permission, answers "no"; the
   permission is read when the user comes back. Owner, 2026-09-15 (after session 5), `ai/prompts/README.md`.
2. **80: any start-up error shows the error page.** Owner, 2026-09-15, `ai/prompts/README.md`.
3. **Finding 81 is session 6b, not this plan.** The owner split it out on 2026-09-15 after the design review; the
   all-or-nothing decisions for it are recorded in `ai/prompts/alert-all-or-nothing.md` and `ai/prompts/README.md`.
4. **The athan sound change's matching gap becomes its own session later, not fixed here.** Owner, 2026-09-15,
   `ai/prompts/README.md` and `ai/plans/README.md`.
5. **79 is proven on the 3T with the owner's hands:** the owner unlocks the phone and flips Athan's notification switch
   when asked. Owner, 2026-09-15, `ai/prompts/README.md`.
6. **The 3T ends on the latest `uat-2` as a mock build with the Asr-next mock data.** Owner, 2026-09-15,
   `ai/prompts/README.md`.
7. **The permission is read on the first `active` app state after a state other than `active`.** Planner: an `active`
   report with no departure before it is not a return, and listening to Android's `focus` event would fire on the
   dialog's own dismissal.
8. **Finding 80's forced throw lives in a mocks file outside the repository** (`scripts/mocks/force-sync-throw.ts.txt`,
   copied to `~/athan-device-sweep/session6/mocks/` before the build). Planner: the build scripts copy a mocks file over
   `mocks/simple.ts` in their own worktree, so no throwaway commit, hook skip or merge is needed.
9. **No step changes the phone's clock.** Planner: nothing in this plan needs another time, so no armed alarm can be
   fired early.
10. **Open Settings opens the app's own settings page on both platforms (`Linking.openSettings`).** Owner, 2026-09-15,
    after the plan review found, and the planner checked on the 3T, that Android 9 closes its app notification page at
    once when the request names no package, as today's request does. Recorded in `ai/prompts/README.md`.
11. **A dialog Android closes without a button answers no.** Planner: React Native reports that only through the
    dialog's `onDismiss` option, and a second dialog replacing the first closes it that way.
12. **A late return carries on where the user left off.** Coming back to the app hours after tapping Open Settings
    reads the permission then and finishes what was started: the sheet opens, or the chosen option becomes selected.
    Owner, 2026-09-16, `ai/prompts/README.md`.

### 2.2 The executor must not decide

STOP, append what you saw to `LOG.md`, and ask the owner the question given, whenever one of these happens:

1. **An anchor count other than 1**, in the pre-flight or a step's part 0. This is NEEDS REPLAN (`EXECUTOR-BRIEF.md`
   section 1, item 4). Tell the owner: "Anchor `<id>` counts `<n>` in `<file>`, so the plan is out of date. Please run
   the planning prompt."
2. **A test fails that the plan does not name**, or a named test fails with a different line. Ask: "In step `<k>`,
   `<test>` failed with `<first failure line>`, which the plan does not expect. Shall I stop here so the plan can be
   refreshed?"
3. **A Code Reviewer (GLM 5.3) finding that section 10 does not answer word for word.** Ask: "The reviewer asks:
   `<finding in its words>`. The plan gives no fix for it. Do you want it applied (the plan is then refreshed first),
   or shall I merge without it?"
4. **Anything that would touch visuals, a prayer time, `releases.json`, the `uat` branch or EAS.** Ask: "Step `<k>`
   would change `<what>`, which this plan forbids. What do I do?"
5. **A build script prints `FAILED`.** Ask: "`<script>` failed with `<line>`. What do I do?"
6. **The `vision` subagent (GLM 5.3 Flash) gives an answer the plan does not expect**, after the repeats the plan
   allows. Ask: "vision read `<file>` as `<answer>`; the plan expects `<expected>`. What do I do?"
7. **`launch80.py` or `isha_alarms.py` prints a line starting `LAUNCH80 FAILED` or `ISHA ALARMS NOT AS EXPECTED`**, or
   an alarm dump names an app alarm whose tag is neither
   `*walarm*:expo.modules.notifications.NOTIFICATION_EVENT` nor `*walarm*:ACTION_FORCE_STOP_RESCHEDULE`. Ask: "`<script
   or dump>` printed `<line>`. What do I do?"
8. **The phone is locked, off the cable, or adb hangs twice.** Ask: "Please unlock the OnePlus 3T, keep it on the cable
   and on its home screen, and reply when that is done."
9. **The owner does not answer a request for their hands on the phone** (section 7.3). Set the row to BLOCKED with the
   reason "waiting for the owner's hands on the 3T for finding 79's proof" (`EXECUTOR-BRIEF.md` section 4b).
10. **The owner reports that Isha's bell is not Off** (section 7.3, item 10). Ask: "Isha is already on. May I use it for
    the proof and put it back to its current setting afterwards, or do I stop?"

## 3. Pre-flight

Copy the saved script and run it: `cp ai/plans/06-alert-integrity/scripts/preflight.sh $TMPDIR/preflight-6.sh && bash
$TMPDIR/preflight-6.sh <k>`, where `<k>` is the first line of section 6's checklist not ticked DONE (1 for a new plan;
4 when only the device proof is left).

The script, saved as `ai/plans/06-alert-integrity/scripts/preflight.sh`:

```bash
#!/bin/bash
# Session 6 pre-flight. The executor copies this file to $TMPDIR/preflight-6.sh and runs
#   bash $TMPDIR/preflight-6.sh <k>
# where <k> is the first step in PLAN.md section 6 not ticked DONE. It ends "PREFLIGHT OK".
# "PREFLIGHT NEEDS REPLAN" means an anchor no longer counts 1; "PREFLIGHT FAILED" means STOP.
k="$1"
fail() { echo "PREFLIGHT FAILED: $*"; exit 1; }
[ -n "$k" ] || fail "usage: preflight-6.sh <first step not ticked DONE>"
cd /Users/muji/repos/rn.athan.uk || fail "cannot enter /Users/muji/repos/rn.athan.uk"
[ "$(git rev-parse --show-toplevel)" = "/Users/muji/repos/rn.athan.uk" ] || fail "not the main checkout"
branch=$(git branch --show-current)
[ "$branch" = "uat-2" ] || fail "the branch is $branch, not uat-2"
other=$(git status --porcelain | grep -vE '^.. ai/plans/(README\.md|06-alert-integrity/(PLAN|LOG)\.md)$')
[ -z "$other" ] || fail "changes other than the plan files: $other"
git fetch origin uat-2 > /dev/null 2>&1 || fail "git fetch origin uat-2 failed"
git merge-base --is-ancestor origin/uat-2 uat-2 || fail "uat-2 does not contain origin/uat-2"
version=$(node -p 'require("./package.json").version')
echo "VERSION $version"
node -e 'const [a,b,c]=process.argv[1].split(".").map(Number);process.exit(a>1||(a===1&&(b>27||(b===27&&c>=164)))?0:1)' "$version" \
  || fail "version $version is lower than the planned 1.27.164"
echo "NEEDS FIRST nothing"
dir=ai/plans/06-alert-integrity/scripts
while read -r step anchor source from; do
  if [ "$step" -ge "$k" ] && [ "$from" -le "$k" ]; then
    count=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$dir/anchors/$anchor.txt" "$source")
    echo "ANCHOR $anchor $source $count"
    if [ "$count" != "1" ]; then echo "PREFLIGHT NEEDS REPLAN: anchor $anchor counts $count in $source"; exit 1; fi
  fi
done < "$dir/anchors/manifest.txt"
[ -x node_modules/.bin/jest ] || fail "node_modules/.bin/jest is missing"
for tool in node python3 perl; do command -v "$tool" > /dev/null || fail "$tool is missing"; done
[ -f android/app/build.gradle ] || fail "android/app/build.gradle is missing, so set-version.sh cannot run"
echo "PREFLIGHT OK"
```

Expected output for `<k>` = 1, at "Planned at" plus this plan's docs commits:

```text
VERSION <the version uat-2 carries, 1.27.166 or higher>
NEEDS FIRST nothing
ANCHOR 1-1 hooks/useNotification.ts 1
...one ANCHOR line per anchor whose step is k or later and whose code no earlier step changes, each ending 1...
PREFLIGHT OK
```

- The last line is `PREFLIGHT OK`: go on.
- A line starting `PREFLIGHT NEEDS REPLAN`: NEEDS REPLAN (section 2.2, item 1).
- A line starting `PREFLIGHT FAILED`: STOP and ask "The pre-flight failed: `<line>`. What do I do?".

The phone is not checked here: steps 1 to 4 need no device. Section 7 checks it before the device proof starts.

## 4. Background the executor needs

### 4.1 Code map

| File | What it does | This plan |
| --- | --- | --- |
| `hooks/useNotification.ts` | Permission checks, the settings dialog (`showSettingsDialog`), the alert sheet commit (`commitAlertMenuChanges`) and the athan commit | Step 1 changes the dialog |
| `components/prayer/Alert.tsx` | The bell: for a prayer saved Off it awaits `ensurePermissions` before it opens the sheet | Read only |
| `components/sheets/screens/Alert.tsx` | The alert sheet: asks `ensurePermissions` before moving the athan off Off, and commits when it closes | Read only |
| `app/index.tsx` | The launch screen and its splash gate inputs | Step 2 changes `decorationsExpected` |
| `shared/launchGate.ts` | The pure splash rules (`isWaitingForData`, `isRevealReady`) | Read only |
| `components/ui/Error.tsx`, `components/ui/Masjid.tsx` | The error screen draws the Masjid icon, whose image load marks the icon gate | Read only |
| `components/ui/RamadanDecorations.tsx` | The only caller of `markDecorationsLoaded`; mounted only with the lists | Read only |
| `stores/bootstrap.ts`, `stores/sync.ts` | A warm launch draws stored lists before sync; a sync that fails with nothing usable stored leaves the loadable at `hasError` | Read only |
| `stores/notifications.ts` | The scheduling lock, the per-day schedulers, the per-prayer and whole reschedules, the 12-hour gate | Step 3 changes it |
| `device/notifications.ts` | The OS calls: schedule one, cancel one, clear a prayer's at-time alarms or reminders | Step 3 changes the at-time clear |
| `device/listeners.ts`, `device/tasks.ts` | The return-from-background and background-task callers | Read only |

What the platform does, read from the installed source:
- `node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/modules/intent/IntentModule.kt`:
  `sendIntent` rejects when no activity resolves the action, and resolves right after `startActivity`; `openSettings`
  opens the app details page for the app's own package and resolves once it has started it.
- On the OnePlus 3T (Android 9), checked while planning: `android.settings.APP_NOTIFICATION_SETTINGS` without the
  `android.provider.extra.APP_PACKAGE` extra, which is what the app sends today, opens and closes at once, back to the
  launcher; with the extra it stays open. `android.settings.APPLICATION_DETAILS_SETTINGS` for the package opens Athan's
  App info page.
- `node_modules/react-native/Libraries/LinkingIOS/RCTLinkingManager.mm`: `openSettings` resolves when the Settings URL
  opens and rejects when it cannot.
- `node_modules/expo-notifications/android/src/main/java/expo/modules/notifications/notifications/scheduling/NotificationScheduler.kt`:
  a cancel rejects with `ERR_NOTIFICATIONS_FAILED_TO_CANCEL` when the notifications service's work throws; iOS's cancel
  cannot reject.
- `node_modules/expo-notifications/android/src/main/java/expo/modules/notifications/service/delegates/ExpoSchedulingDelegate.kt`:
  a cancel disarms the alarm, then removes the stored request.
- `app/_layout.tsx` lines 41 to 44 export `ErrorBoundary`, which expo-router wraps around the route in `Try`
  (`node_modules/expo-router/build/views/Try.js`), and `Try` hides the splash when a render throws. Only a failed sync
  on a launch that already drew its lists reaches the stuck splash of finding 80.

### 4.2 Anchors

Every anchor is saved in full under `ai/plans/06-alert-integrity/scripts/anchors/`, listed in `anchors/manifest.txt`
(step, anchor, file, first step at whose start the pre-flight may count it), and counted 1 at `b5159305`. Line
numbers are hints only.

| Anchor | File | Lines at `b5159305` | What it holds |
| --- | --- | --- | --- |
| `1-1` | `hooks/useNotification.ts` | 2 | the react-native import |
| `1-2` | `hooks/useNotification.ts` | 20 to 49 | `showSettingsDialog` |
| `1-3` | `hooks/__tests__/useNotification.test.ts` | 12 | the react-native import |
| `1-4` | `hooks/__tests__/useNotification.test.ts` | 32 to 33 | `alertMock` |
| `1-5` | `hooks/__tests__/useNotification.test.ts` | 166 to 170 | the iOS Open Settings test |
| `1-6` | `hooks/__tests__/useNotification.test.ts` | 186 to 189 | the granted-after-settings test |
| `1-7` | `hooks/__tests__/useNotification.test.ts` | 205 to 208 | the denied-after-settings test |
| `1-8` | `hooks/__tests__/useNotification.test.ts` | 108 to 112 | the dialog title and message assertion |
| `2-1` | `app/index.tsx` | 71 to 72 | `decorationsExpected` |
| `2-2` | `__tests__/app/index.test.tsx` | 314 to 324 | the last Ramadan splash test |
| `3-1` | `stores/notifications.ts` | 65 to 70 | the end of `withSchedulingLock` |
| `3-2` | `stores/notifications.ts` | 638 to 642 | the at-time days |
| `3-3` | `stores/notifications.ts` | 788 to 790 | the reminder days |
| `3-4` | `stores/notifications.ts` | 869 to 870 | `updatePrayerNotifications` |
| `3-5` | `stores/notifications.ts` | 901 to 902 | the at-time prayers of a schedule |
| `3-6` | `stores/notifications.ts` | 937 to 938 | the reminder prayers of a schedule |
| `3-7` | `stores/notifications.ts` | 1066 to 1067 | the four schedule groups |
| `3-8` | `device/notifications.ts` | 123 to 125 | `clearAllScheduledNotificationForPrayer` |

### 4.3 How the pieces interact

Every scheduling operation goes through `withSchedulingLock`, a promise queue: each operation starts after the one
before it settles.

| Caller | Path | Lock operation | 12-hour gate |
| --- | --- | --- | --- |
| Launch, 1.5 seconds after mount | `app/index.tsx`: `reopenRefreshGateOnColdLaunch` (Android), then `initializeNotifications`, `checkInitialPermissions`, `refreshNotifications`, `registerBackgroundTask` | `refreshNotifications` | Runs only when open |
| After the launch sync lands | `app/index.tsx`, the effect on `state === 'hasData'` | `refreshNotifications` | Runs only when open |
| Return from the background | `device/listeners.ts`: `initializeNotifications` then `refreshNotifications`; then `sync()` and, when its download changed an armed day, `refreshNotifications` again | `refreshNotifications` | Runs only when open |
| Background task | `device/tasks.ts`, `rescheduleAllNotificationsFromBackground`: `sync()` outside the lock, then the lock | `backgroundReschedule` | Ignored; stamped on success |
| Alert sheet close | `components/sheets/screens/Alert.tsx` `handleDismiss`, `commitAlertMenuChanges`: preferences written first, then `updatePrayerNotifications` | `updatePrayerNotifications` | Ignored |
| Athan sheet close | `commitSoundSelection`, then `rescheduleAllNotifications` | `rescheduleAllNotifications` | Ignored |
| A download | `stores/sync.ts` `saveDownloadedDays` reopens the gate, outside the lock | None | Reopens it |
| 00:00 | The countdown moves; nothing schedules | None | None |
| A stalled network | The fetch never settles: the after-sync refresh, the refresh after a resume's sync, and the background task's lock never run. The 1.5-second launch refresh and the resume refresh still run | Unchanged by this plan | Unchanged |

### 4.4 Existing tests that cover this code

| Test file | What it proves today | This plan |
| --- | --- | --- |
| `hooks/__tests__/notificationSettingsFallback.test.ts` | The dialog opens each platform's settings; a throwing permission API counts as a refusal | Step 1 rewrites it |
| `hooks/__tests__/useNotification.test.ts` | The dialog, the commit matrix, the preference rollback on failure, the athan commit | Step 1 changes four tests |
| `__tests__/app/index.test.tsx` | Every splash path, including the Ramadan decorations wait | Step 2 adds two tests |
| `shared/__tests__/launchGate.test.ts` | All 32 reveal states | Unchanged |
| `stores/__tests__/notificationOffCancelFailure.test.ts` | A refused cancel of an Off prayer keeps its records and the gate open, and the next refresh cancels it | Unchanged |
| `stores/__tests__/notificationStaleCancelFailure.test.ts` | A refused stale cancel is logged and the sweep retries it | Unchanged |
| `stores/__tests__/notificationRefreshGate.test.ts` | The gate; a failing reschedule leaves the gate open and the queue keeps running | Unchanged |
| `stores/__tests__/notificationSinglePrayerUpdate.test.ts` | One prayer's commit arms and cancels exactly | Unchanged |
| `stores/__tests__/notifications.test.ts` | The reschedule strategy, a failed schedule keeping the old alarm, the sweep | Unchanged |
| `device/__tests__/reminderCancelFailure.test.ts` | Clearing reminders resolves when cancels are refused | Unchanged |
| `stores/__tests__/notificationGateRace.test.ts` | A download landing during a reschedule leaves the gate open | Unchanged |

### 4.5 Why the obvious simple fixes are wrong

- **79:** catching the failure and answering no is not enough. Both native calls answer as Settings opens, so a read
  straight after them still sees the old permission.
- **80:** lifting the splash whenever sync fails, without the Masjid icon, would reveal a frame whose icon is still
  loading. The gate keeps waiting for the icon, which the error screen draws, and stops waiting only for decorations.
- **82:** a `.catch` on each piece would hide the failure that keeps the gate open and tells the caller.
- **81** is not in this plan: its first design failed review and it is session 6b (`ai/prompts/alert-all-or-nothing.md`).

## 5. Design

### 5.1 Step 1, finding 79

- **Approach.** The Open Settings handler starts listening to app state changes before it opens the app's own settings
  page with `Linking.openSettings` (both platforms, decision 10). If opening rejects, it stops listening and answers no.
  Otherwise it waits for the first `active` state that follows a state other than `active`, stops listening, reads the
  permission, and answers whether it is granted; a read that throws answers no. The dialog's `onDismiss` answers no
  when Android closes it without a button.
- **Invariant:** `ensurePermissions` always settles, and after Open Settings it reads the permission only after the app
  has left the foreground and come back.
- **Rejected:** a timeout (it would answer before a slow user returns); answering no at once (the owner decided the read
  happens on return); Android's `focus` event (the dialog closing fires it before Settings opens).
- **Callers.** The bell (`components/prayer/Alert.tsx`) awaits the answer before it opens the sheet, so for a prayer
  saved Off the sheet now opens on the return. The sheet's athan selection (`components/sheets/screens/Alert.tsx`) moves
  to the tapped option on the return when the permission is granted. The commit on close asks only when a change turns
  an alert on, and gets the same answer. No caller holds the scheduling lock while it waits.
- **Limits.** A user who never comes back leaves the answer waiting with its listener attached; the next return to the
  app, possibly hours later, then opens the sheet or moves the selection. The owner chose that on 2026-09-16 (decision
  12). After Android recreates the activity (a font scale, locale or density change, or the system reclaiming it) a
  dialog still on screen has lost its button callbacks, as every dialog in the app has today: the planner accepts that,
  for the audit to confirm.

### 5.2 Step 2, finding 80

- **Approach.** `decorationsExpected` in `app/index.tsx` is false once sync has failed. The error screen never mounts
  the decorations, while it does draw the Masjid icon, whose load already opens the icon gate.
- **Invariant:** when the sync loadable is `hasError` on a launch that drew stored lists first, the splash lifts once
  the Masjid icon has loaded, whatever `isRamadan()` and the decorations setting say.
- **Rejected:** lifting on any error without waiting for the icon (the first revealed frame could miss its icon, a
  visible change); a new input to `shared/launchGate.ts` (more surface for the same rule). A render throw is already
  covered: `app/_layout.tsx` lines 41 to 44 export `ErrorBoundary`, which expo-router wraps in `Try`, and `Try` hides
  the splash itself.

### 5.3 Step 3, finding 82

- **Approach.** A private `settleAll` in `stores/notifications.ts` waits for every promise, then rejects with the first
  failure. It replaces each `Promise.all` whose pieces can reject: the days of one prayer (at-time and reminders), one
  prayer's two halves in `updatePrayerNotifications`, the prayers of a schedule (at-time and reminders), and the four
  schedule groups. `clearAllScheduledNotificationForPrayer` in `device/notifications.ts` lets every cancel settle before
  it reports the first refusal. The two `Promise.all` calls left wrap promises that catch their own failures.
- **Invariant:** no operation inside `withSchedulingLock` settles while any piece of work it started is still running.
- **Rejected:** a `.catch` on each piece (it would hide the failure that keeps the gate open); a per-prayer lock (every
  caller in section 4.3 would change).
- **Concurrency trace.** Every caller in section 4.3 keeps its order: an operation still starts only after the one
  before it settles, and now settles only after all its own work. Failures still reject with the same first error, so
  the refresh gate, the background task's failed result and the commit's rollback behave as before.
- **Design review.** A Software Architect (Claude Opus 5), 2026-09-15, attacked this step together with the first design
  for finding 81. For this step it found that `settleAll` correctly replaces every `Promise.all` whose pieces can reject,
  and recorded two limits, both taken to session 6b:
  - a day whose stored row cannot be read loses its record while its alarm stays armed; this was already so before the
    change;
  - a native call that never answers now holds the lock even when another piece has failed, where a rejection used to
    release it. Android's result receiver answers only from the service's catch of `Exception`.

  Its findings on finding 81's design moved that finding out of this plan (decision 3).

## 6. Steps

- [x] Step 1: DONE in 3499b765
- [x] Step 2: DONE in b6e2bf26
- [ ] Step 3: The scheduling lock waits for every piece of work before reporting a failure (finding 82)
- [ ] Device proof: section 7

Each step is written out in full in its own file, in this order:
1. `ai/plans/06-alert-integrity/steps/1-open-settings-answers.md`
2. `ai/plans/06-alert-integrity/steps/2-error-screen-lifts-splash.md`
3. `ai/plans/06-alert-integrity/steps/3-lock-waits-for-every-piece.md`

Read a step's file in full before starting it. Start a step only once the step before it is merged.

## 7. Device proof

Run this after step 3 is merged. Every command runs from `/Users/muji/repos/rn.athan.uk`. No step changes the phone's
clock. The owner receives no screenshots: only the `vision` subagent (GLM 5.3 Flash) reads them.

### 7.0 Preparation and safety reading

1. Run `date '+%H:%M'`. If the time is 23:45 or later, stop and continue after 00:15 (`EXECUTOR-BRIEF.md` section 3).
   Tell the owner, word for word: "The device proof starts now and needs about an hour. The phone is on a test build, so
   your real alerts are not armed until the production build goes on about halfway through, which re-arms your saved
   alerts. The two throwaway Ramadan builds may ring test alerts a minute or two after each launch. I'll ask for your
   hands on the phone about halfway through." 
2. Run `mkdir -p ~/athan-device-sweep/session6/build ~/athan-device-sweep/session6/mocks`.
3. Run `cp ai/plans/06-alert-integrity/scripts/mocks/force-sync-throw.ts.txt ~/athan-device-sweep/session6/mocks/force-sync-throw.ts`.
4. Run `git rev-parse uat-2` and write the sha in `LOG.md` as `FINAL=<sha>`. Every `<FINAL>` below is that sha.
5. Run `adb -s 8f7ada76 get-state`. Expected: `device`.
6. Run `adb -s 8f7ada76 shell settings get global auto_time`. Expected: `1`.
7. Run `adb -s 8f7ada76 shell dumpsys window policy | grep -c 'showing=true' || true`. Expected: `0`. `1` means the
   phone is locked: section 2.2, item 8. The `|| true` is needed because `grep -c` exits 1 when it counts none, which
   here is the good path.
8. Run `adb -s 8f7ada76 shell svc power stayon usb`, so the screen stays on while the cable is in. Section 7.5 turns it
   back off.
9. Run `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session6/alarms-start.txt`, then
   `grep -A1 'com.mugtaba.athan}' ~/athan-device-sweep/session6/alarms-start.txt | grep -o 'tag=\*walarm\*:[A-Za-z_.]*' | sort | uniq -c`.
   Expected: one line ending `tag=*walarm*:ACTION_FORCE_STOP_RESCHEDULE` with count 1 (the year-2036 WorkManager alarm,
   `when=2036-09-12 04:40:40.505`, on every 3T dump), and at most one line ending
   `tag=*walarm*:expo.modules.notifications.NOTIFICATION_EVENT`, whose count is the alarms the installed build armed. Any other tag:
   section 2.2, item 7. No clock change is made in this plan, so none of these alarms is fired early.

### 7.1 Finding 80 before the fix

1. Build in the background:
   `zsh ~/athan-device-sweep/session5/bin/build-mock-ramadan.zsh b5159305 ~/athan-device-sweep/session6/mocks/force-sync-throw.ts ~/athan-device-sweep/session6/build/athan-6-80-before.apk > $TMPDIR/build-80-before.log 2>&1`.
   Expected: the log holds the line `BUILD-MOCK OK`, and after it a line starting `versionName` that ends `1.27.164`.
2. Run `python3 ~/athan-device-sweep/session5/bin/devcheck.py install ~/athan-device-sweep/session6/build/athan-6-80-before.apk`
   in the background, writing to `$TMPDIR/install-80-before.log`.
   Expected: a line containing `Success`, then a state line with `version ['1.27.164']`.
3. Run `python3 ai/plans/06-alert-integrity/scripts/device/launch80.py seed before-seed > $TMPDIR/launch80-before-seed.log 2>&1`
   in the background; before it launches it waits for the right point in the device's minute, so it takes up to two
   minutes. Expected in the log: one line starting `LAUNCH80 seed before-seed` with `forced-throw-lines 0 fatal 0`.
   `forced-throw-lines` 1 or more on a seed launch: section 10.1's row for it.
4. Run `python3 ai/plans/06-alert-integrity/scripts/device/launch80.py throw before-throw > $TMPDIR/launch80-before-throw.log 2>&1`
   in the background; it waits for its own point in the device's minute, so it too takes up to two minutes. Expected
   in the log: one line starting `LAUNCH80 throw before-throw` with `forced-throw-lines` 1 or more and `fatal 0`.
5. Spawn `vision` with the prompt `VISION_80` below, for `~/athan-device-sweep/session6/80-before-throw.png`. Expected
   answer: `SPLASH`.
   - `ERROR`: the decorations won the race this time. Repeat items 3 to 5 with the labels `before-seed-2` and
     `before-throw-2`, then `before-seed-3` and `before-throw-3`. Still `ERROR` after the third pair: section 2.2, item 6.
   - Write the label whose screenshot read `SPLASH` in `LOG.md` as `BEFORE_PNG=80-<label>.png`.
   - `LISTS` or `OTHER`: section 2.2, item 6.

### 7.2 Finding 80 after the fix

1. Build in the background:
   `zsh ~/athan-device-sweep/session5/bin/build-mock-ramadan.zsh <FINAL> ~/athan-device-sweep/session6/mocks/force-sync-throw.ts ~/athan-device-sweep/session6/build/athan-6-80-after.apk > $TMPDIR/build-80-after.log 2>&1`.
   Expected: the log holds the line `BUILD-MOCK OK`, and after it a line starting `versionName` that ends with the
   version `node -p 'require("./package.json").version'` prints.
2. Run `python3 ~/athan-device-sweep/session5/bin/devcheck.py install ~/athan-device-sweep/session6/build/athan-6-80-after.apk`
   in the background, writing to `$TMPDIR/install-80-after.log`. Expected: a line containing `Success`, then a state
   line naming that version.
3. Run `python3 ai/plans/06-alert-integrity/scripts/device/launch80.py seed after-seed > $TMPDIR/launch80-after-seed.log 2>&1`,
   then `python3 ai/plans/06-alert-integrity/scripts/device/launch80.py throw after-throw > $TMPDIR/launch80-after-throw.log 2>&1`,
   each in the background, with the same expectations as 7.1 items 3 and 4, and each taking up to two minutes for the
   same reason.
4. Spawn `vision` with `VISION_80` for `~/athan-device-sweep/session6/80-after-throw.png`. Expected: `ERROR`. Any
   other answer: repeat item 3 and this item once with the labels `after-seed-2` and `after-throw-2`; still not
   `ERROR`: section 2.2, item 6.
5. Write the label whose screenshot read `ERROR` in `LOG.md` as `AFTER_PNG=80-<label>.png`.

The `vision` prompt `VISION_80`:

```text
Read the image at <path>. It is a screenshot of an Android phone running a prayer times app. Answer with exactly one
word:
SPLASH if the screen shows only a launch splash: a logo or icon on a plain background, with no words and no list;
ERROR if the screen shows the words "Oh no!" or "Something went wrong." with a button labelled "Refresh";
LISTS if the screen shows a list of prayer names with times;
OTHER for anything else.
```

### 7.3 Findings 79 and 82 on a local production build

1. Build in the background:
   `zsh ~/athan-device-sweep/session3/bin/build-prod.zsh <FINAL> ~/athan-device-sweep/session6/build/athan-6-prod.apk > $TMPDIR/build-prod-6.log 2>&1`.
   Expected: the log holds the line `BUILD-PROD OK`, and after it a line starting `package` that ends
   `versionName <version>`, with the version `package.json` holds.
2. Run `python3 ~/athan-device-sweep/session5/bin/devcheck.py install ~/athan-device-sweep/session6/build/athan-6-prod.apk`
   in the background, writing to `$TMPDIR/install-prod-6.log`. Expected: a line containing `Success`, then a state
   line naming that version.
3. Run `python3 ~/athan-device-sweep/session5/bin/devcheck.py cold prod-cold > $TMPDIR/cold-prod-6.log 2>&1` in the
   background. The screen read may print `DUMP FAILED`, which is expected while the countdown runs. Then run
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py wait 15` twice, one after the other. Expected each time: a line
   containing `waited 15s`.
4. Run `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session6/alarms-prod-cold.txt`. The Android cold
   launch reopened the gate, so this is the owner's saved alerts armed again by the changed reschedule.
5. Run `python3 ai/plans/06-alert-integrity/scripts/device/isha_alarms.py ~/athan-device-sweep/session6/alarms-prod-cold.txt ~/athan-device-sweep/session6/alarms-prod-cold.txt off 5`.
   - `ISHA ALARMS AS EXPECTED (off)`: Isha is armed for no day, as it is when saved Off. Go on.
   - `ISHA TOO CLOSE`: Isha or its reminder is due within 30 minutes. The line gives the command to wait with,
     `until [ "$(date +%s)" -gt <seconds> ]; do sleep 15; done`. Run it exactly as printed, in the background, then repeat
     items 4 and 5.
   - `ISHA ALARMS NOT AS EXPECTED (off)` with Isha instants in `extra`: the owner has Isha on. Section 2.2, item 10.
6. Run `adb -s 8f7ada76 shell am start -a android.settings.APP_NOTIFICATION_SETTINGS --es android.provider.extra.APP_PACKAGE com.mugtaba.athan`.
   Expected: a line starting `Starting: Intent`, and after it, possibly, a line starting `Warning: Activity not started`.
7. Ask the owner, word for word: "On the 3T, Android's notification settings for Athan are open. Please turn OFF 'Show
   notifications' for Athan, then reply 'done'. Please don't touch anything else."
8. Run `adb -s 8f7ada76 shell dumpsys notification | grep 'AppSettings: com.mugtaba.athan' || true` and write the
   line to `LOG.md`. Expected (unverified while planning, so it is recorded, not required): the line contains
   `importance=NONE`. The `|| true` is needed because no match is a permitted outcome here and `grep` exits 1
   when it matches nothing.
9. Run `adb -s 8f7ada76 shell am start -n com.mugtaba.athan/.MainActivity`. Expected: a line starting
   `Starting: Intent`, and after it, possibly, a line starting `Warning: Activity not started`.
10. Ask the owner, word for word: "Athan is open. Please do these in order, then reply 'done' and leave the phone
    alone:
    1. On the first page, find Isha. Its bell shows a slash when Isha is Off. If it shows no slash, reply 'Isha is on'
       instead.
    2. Tap Isha's bell. A dialog 'Enable Notifications' appears: tap Cancel. The Isha alert sheet opens.
    3. In the sheet, under Athan, tap Silent. The dialog appears again: tap Open Settings.
    4. Android opens Athan's App info page. Tap Notifications, then turn ON 'Show notifications'.
    5. Press Back until Athan is on screen again with the Isha sheet open."
11. Run `python3 ~/athan-device-sweep/session5/bin/devcheck.py shot ~/athan-device-sweep/session6/79-back-from-settings.png`.
12. Spawn `vision` with the prompt `VISION_79` below. Expected: `SILENT 5`. The first word proves finding 79: the
    permission was read after the return, so the selection moved. Any first word other than `SILENT`: section 2.2,
    item 6. A second word that is not a number: section 2.2, item 6. Write the number as `<M>` in `LOG.md`; it is the
    reminder interval the sheet shows.
13. Ask the owner, word for word: "Please turn the Reminder switch ON in the Isha sheet, then press Back once to close
    the sheet. Reply 'done'."
14. Run `python3 ~/athan-device-sweep/session5/bin/devcheck.py wait 15`. Then run
    `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session6/alarms-isha-on.txt`.
15. Run `python3 ai/plans/06-alert-integrity/scripts/device/isha_alarms.py ~/athan-device-sweep/session6/alarms-prod-cold.txt ~/athan-device-sweep/session6/alarms-isha-on.txt on <M>`.
    Expected: `ISHA ALARMS AS EXPECTED (on)`. `ISHA TOO CLOSE`: run the wait command it prints, in the background, then
    repeat item 14 and this item. Anything else: section 2.2, item 7.
16. Ask the owner, word for word: "Please tap Isha's bell again. In the sheet, under Athan, tap Off, then press Back
    once. Reply 'done'."
17. Run `python3 ~/athan-device-sweep/session5/bin/devcheck.py wait 15`. Then run
    `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session6/alarms-isha-off.txt`.
18. Run `python3 ai/plans/06-alert-integrity/scripts/device/isha_alarms.py ~/athan-device-sweep/session6/alarms-isha-on.txt ~/athan-device-sweep/session6/alarms-isha-off.txt off <M>`.
    Expected: `ISHA ALARMS AS EXPECTED (off)`: every Isha alarm and reminder cancelled, the owner's other alarms kept.
    `ISHA TOO CLOSE`: run the wait command it prints, in the background, then repeat item 17 and this item. Anything
    else: section 2.2, item 7.

A refused Android cancel cannot be caused on a phone: the service fails only when its own work throws. So finding 82's
refusal paths are proven by step 3's unit tests, and items 13 to 18 prove that the changed scheduling code still arms
and cancels exactly on the real OS. Finding 81, the refusal itself, is session 6b.

The `vision` prompt `VISION_79`:

```text
Read the image at ~/athan-device-sweep/session6/79-back-from-settings.png. It is a screenshot of an Android phone with a
bottom sheet open for the prayer Isha. The sheet has a card titled "Athan" with three options: Off, Silent and Sound.
Below it is a card titled "Reminder" with a row labelled "Before" showing a number of minutes.
Answer with exactly two words, in capitals and digits, separated by one space:
first, which Athan option is selected: OFF, SILENT or SOUND, or NONE if the Athan card is not visible;
second, the number of minutes shown next to "Before", or X if it is not visible.
Example of the format: OFF X
```

### 7.4 The phone left on the latest mock build

1. Build in the background:
   `zsh ~/athan-device-sweep/session3/bin/build-mock.zsh <FINAL> /Users/muji/repos/rn.athan.uk/mocks/simple.ts ~/athan-device-sweep/session6/build/athan-6-mock-final.apk > $TMPDIR/build-mock-final-6.log 2>&1`.
   Expected: the log holds the line `BUILD-MOCK OK`, and after it a line starting `versionName` that ends with
   `package.json`'s version.
2. Run `python3 ~/athan-device-sweep/session5/bin/devcheck.py install ~/athan-device-sweep/session6/build/athan-6-mock-final.apk`
   in the background, writing to `$TMPDIR/install-mock-final-6.log`. Expected: a line containing `Success`, then a state
   line naming that version.
3. Run these one after the other: `python3 ~/athan-device-sweep/session5/bin/devcheck.py key home`, then
   `adb -s 8f7ada76 shell am kill com.mugtaba.athan`, then
   `adb -s 8f7ada76 shell am start -n com.mugtaba.athan/.MainActivity` (expected: a line starting `Starting: Intent`, and
   after it, possibly, a line starting `Warning: Activity not started`), then
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py wait 10`, then
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py shot ~/athan-device-sweep/session6/mock-final.png`.
4. Spawn `vision` with this prompt. Expected: `YES`. Any other answer: repeat item 3 and this item once; still not
   `YES`: section 2.2, item 6.

   ```text
   Read the image at ~/athan-device-sweep/session6/mock-final.png. It is a screenshot of a prayer times app. Answer
   with exactly one word: YES if the row named Asr is highlighted as the next prayer and the countdown near the top
   shows a time under 2 minutes (such as "45s", "1m" or "1m 30s"); NO otherwise.
   ```

### 7.5 Clean-up and the state left behind

1. Run `adb -s 8f7ada76 shell svc power stayon false`.
2. Run `adb -s 8f7ada76 shell settings get global auto_time`. Expected: `1`.
3. Run `adb -s 8f7ada76 shell dumpsys package com.mugtaba.athan | grep versionName`. Expected: `versionName=` followed
   by `package.json`'s version.
4. Run `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session6/alarms-end.txt`.
5. Copy the files `devcheck.py` wrote for this session:
   `bash -c 'shopt -s nullglob; f=(~/athan-device-sweep/session5/mockcheck/prod-cold.*); [ ${#f[@]} -eq 0 ] || cp "${f[@]}" ~/athan-device-sweep/session6/; echo "copied ${#f[@]}"'`.
   Expected: `copied` followed by 0, 1 or 2. None is expected when the screen read printed `DUMP FAILED`.
6. Spawn a `Reality Checker` subagent (isolation `worktree`, no `model`) with the prompt `REALITY_CHECK` in section 11,
   and write its verdict in `LOG.md`. A final line `evidence does not hold`: STOP and ask "Reality Checker (GLM 5.3)
   found `<its NOT PROVEN lines>`. What do I do?".
7. Only after a final line `evidence holds`: in `PLAN.md` section 6, replace the line `- [ ] Device proof: section 7`
   with `- [x] Device proof: DONE`.

The phone is left on the mock build of `<FINAL>` with the Asr-next mock data, automatic time on, and the screen's
stay-awake setting off. The owner's production data stays in `athan-storage` for the next production build.

## 8. Records

### 8.1 Findings text

Append this to the end of `ai/features/uat-2/AUDIT-FINDINGS.md`, replacing each placeholder with the value measured:

- `<DATE>`: the date the device proof ended, as `D Month YYYY`;
- `<FINAL>`: the sha from section 7.0;
- `<VERSION>`: `package.json`'s version at `<FINAL>`;
- `<TESTS>`: the `Tests:` line of step 3's commit log;
- `<M>`: the reminder minutes read in section 7.3;
- `<BEFORE_PNG>` and `<AFTER_PNG>`: the screenshot names `LOG.md` records in sections 7.1 and 7.2.

```markdown
# Session 6 of the queue: findings 79, 80 and 82, <DATE>

The brief is `ai/prompts/alert-integrity.md`, planned by Claude in `ai/plans/06-alert-integrity/PLAN.md` and executed
by GLM 5.3, with a GLM 5.3 Code Reviewer on every commit. `uat-2` ends at `<FINAL>` (<VERSION>); the last suite run
reported `<TESTS>`, at 100% statements, branches, functions and lines.

## 79. CLOSED: Open Settings always answers

The dialog's Open Settings button opens the app's own settings page on both platforms, answers no when the dialog is
dismissed without a button, Settings cannot open or the permission cannot be read, removes its app state listener, and
otherwise reads the permission the first time the app is active again after leaving for Settings. On Android the old
request named no package, and the 3T closed that settings page at once (checked while planning). On the 3T, with
Athan's notifications switched off, tapping Silent in Isha's sheet, opening Settings, allowing notifications on Athan's
App info page and pressing Back left Silent selected (`~/athan-device-sweep/session6/79-back-from-settings.png`, read
by vision). Before this fix the source read the permission as Settings opened (finding 79, by reading).

## 80. CLOSED: a start-up error lifts the splash, in Ramadan too

The splash waits for the Ramadan decorations only while sync has not failed, because the error screen never draws
them. On the 3T, a Ramadan mock build whose download deletes today to day 2 and throws, launched over stored lists:
at `b5159305` the splash stayed up (`<BEFORE_PNG>`); at `<FINAL>` the error screen showed with its Refresh button
(`<AFTER_PNG>`). The forced throw lived only in a mocks file outside the repository.

## 82. CLOSED: the scheduling lock waits for every piece of work

Every scheduling operation now waits for each day, prayer, schedule group and cancel it started before a failure is
reported, so the next operation in the queue never runs beside work still landing
(`stores/__tests__/notificationSchedulingLock.test.ts`). A refusal cannot be caused on a phone, so that path is proven by
the unit tests. On the 3T's production build the changed code still arms and cancels exactly: turning Isha on (Silent,
reminder <M> minutes) armed exactly its future athan and reminder instants, and turning it Off cancelled exactly those,
leaving the owner's other alarms (`alarms-isha-on.txt`, `alarms-isha-off.txt`, checked by `isha_alarms.py` against the
saved 2026 payload).

Two limits the design review recorded, taken up in session 6b: a day whose stored row cannot be read still loses its
record while its alarm stays armed (as before this change), and a native call that never answers now holds the lock even
when another piece has failed.

Finding 81 is not closed here: it moved to session 6b (`ai/prompts/alert-all-or-nothing.md`).

## State left behind

The 3T runs the mock build of `<FINAL>` with the Asr-next mock data, automatic time on. Nothing was built on or pushed
to EAS, and `releases.json` is untouched. The evidence is in `~/athan-device-sweep/session6/`.
```

### 8.2 Table rows

- **`ai/plans/README.md`:** the executor sets row 1's status to `EXECUTED`.
- **`ai/prompts/README.md`, for the auditor to apply on PASS:** replace row 6's last cell `queued` with
  `**DONE** <DATE>, <first step version> to <VERSION>: Open Settings always answers (79), a start-up error lifts the splash in Ramadan (80), and the scheduling lock waits for every piece of work (82); proven on the 3T. Finding 81 is session 6b`.

### 8.3 Docs commit

The `executed` docs commit (`EXECUTOR-BRIEF.md` section 4b) uses this message, with `<VERSION>` from
`set-version.sh`:

```text
<VERSION> - docs(plans): session 6 executed: findings 79, 80 and 82 closed and proven on the 3T
```

Its files, by name: `ai/plans/README.md`, `ai/plans/06-alert-integrity/PLAN.md`, `ai/plans/06-alert-integrity/LOG.md`,
`ai/features/uat-2/AUDIT-FINDINGS.md`, `app.json`, `package.json`.

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session pushes `uat-2` after a
PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

### 10.1 Symptoms

The general table is `EXECUTOR-BRIEF.md` section 7. This session's own:

| Symptom | Cause | Action |
| --- | --- | --- |
| A red run passes a test the plan says fails | The change is already in the file, or the test was copied wrong | Compare the file with `scripts/tests/` or `scripts/changes/`; if it differs, restore it from there once; still passing: STOP |
| A test hangs for 10 seconds in step 1 | A test awaits a dialog that never answers | STOP and ask: the plan's tests never wait on the dialog |
| `apply.py` prints `ANCHOR COUNT 0` in part 5 | Part 4 or an earlier step already changed that text | NEEDS REPLAN |
| `breaks-<k>.sh` prints `the substitution did not change` | The file differs from the plan's code | STOP |
| `set-version.sh` prints `VERSIONS DIFFER` | A version file was edited by hand | Restore `app.json`, `package.json` and `android/app/build.gradle` to `uat-2`'s version with `git checkout -- app.json package.json` and `perl -pi -e 's/versionName "[^"]*"/versionName "<uat-2 version>"/' android/app/build.gradle`, then run it again once |
| `launch80.py` prints `LAUNCH80 FAILED: the device clock never reached second` | adb answered too slowly | Run the same command again once; a second failure: STOP |
| `forced-throw-lines 0` on a throw launch | The launch began outside the second-half window, or the download came from the background task first | Repeat the seed and throw pair once with new labels; still 0: STOP |
| `forced-throw-lines` 1 or more on a seed launch | The seed's own download ran past second 30 of the minute, so it threw and deleted today to day 2, leaving nothing for the throw launch to draw | Repeat that seed launch once with a new label, then go on to the throw launch; a second seed that throws: STOP |
| `isha_alarms.py` prints `ISHA TOO CLOSE` | Isha or its reminder is within 30 minutes | Wait as the item that printed it says: section 7.3 item 5 repeats items 4 and 5, item 15 repeats item 14 and itself, item 18 repeats item 17 and itself |
| The phone shows Android's lock screen | The keyguard came back | Section 2.2, item 8 |
| A background build prints `another Android build or bundler is running` | Two builds at once | Wait for the first build's notification, then start the second |

### 10.2 Anticipated review fixes

None. Every change, test and message is given verbatim and was run while planning. A reviewer finding therefore means
the plan itself is wrong, and the executor must not fix it: section 2.2, item 3.

### 10.3 Stopping part-way

For `EXECUTOR-BRIEF.md` section 4a:

| Step | Files to restore with `git checkout --` | New files to delete |
| --- | --- | --- |
| 1 | `hooks/useNotification.ts`, `hooks/__tests__/useNotification.test.ts`, `hooks/__tests__/notificationSettingsFallback.test.ts` | None |
| 2 | `app/index.tsx`, `__tests__/app/index.test.tsx` | None |
| 3 | `stores/notifications.ts`, `device/notifications.ts` | `stores/__tests__/notificationSchedulingLock.test.ts` |

After restoring, also run `perl -pi -e 's/versionName "[^"]*"/versionName "<uat-2 version>"/' android/app/build.gradle`
with `uat-2`'s `package.json` version, since that file is not tracked.

## 11. Subagents in this plan

| Step | Agent type | Model | Isolation | Why | Prompt |
| --- | --- | --- | --- | --- | --- |
| 1 to 3 | `Code Reviewer` | GLM 5.3 | `worktree` | Every commit is reviewed before it merges | Each step file, part 9 |
| Docs commit | `Code Reviewer` | GLM 5.3 | `worktree` | The `executed` docs commit | `EXECUTOR-BRIEF.md` section 4b, item 5 |
| 7.1, 7.2, 7.3, 7.4 | `vision` | GLM 5.3 Flash | none | The executor cannot read images | `VISION_80`, `VISION_79` and 7.4's prompt |
| 7.5 | `Reality Checker` | GLM 5.3 | `worktree` | Does the evidence prove every claim in section 8.1? | `REALITY_CHECK` below |
| Any | `Test Results Analyzer` | GLM 5.3 | `worktree` | Only when a full-suite run fails in a way section 10 does not cover; it reports the cause, then the executor STOPs | "Run `git checkout --detach <sha>`. Read `<log path>` in full and name the cause of each failing test, with file and line. Change nothing." |

The prompt `REALITY_CHECK`:

```text
Run git checkout --detach <FINAL>. Then read /Users/muji/repos/rn.athan.uk/ai/plans/06-alert-integrity/PLAN.md sections 7 and 8.1, and
/Users/muji/repos/rn.athan.uk/ai/plans/06-alert-integrity/LOG.md, in full, by those absolute paths: LOG.md holds
readings not committed yet. Then read every file under /Users/muji/athan-device-sweep/session6/ that
section 8.1's text cites, except images, which you must not open; for each image, use the vision answer LOG.md
records. For every claim in section 8.1, say whether the files prove it, quoting the line that does. Reply with one line
per claim, "PROVEN: <claim>: <evidence>" or "NOT PROVEN: <claim>: <what is missing>", then a final line "evidence holds"
or "evidence does not hold".
```

## 12. Report to the owner

The final message of the execution session:

```text
🤖  Model: GLM 5.3 (execution session)
Time: <output of date '+%H:%M:%S %d.%m.%Y'>

Session 6 is executed and waits for its audit. The three fixes are merged into uat-2 on this Mac, not pushed:
- Open Settings always answers, and reads the permission once you are back (finding 79). On the 3T, allowing
  notifications in Settings and coming back left Silent selected.
- A start-up error lifts the splash onto the error page in Ramadan too (finding 80). The same forced error kept the
  splash up before the fix and showed the error page after it.
- The scheduling lock waits for every piece of work (finding 82). The phone cannot be made to refuse, so the tests
  prove that path; on the phone, turning Isha on and off armed and cancelled exactly its alarms.
The phone is on the mock build of the latest uat-2, with Asr next.

<the progress table, in EXECUTOR-BRIEF.md section 6's format>

Nothing waits on you for this session. Next, the audit: start `claude-plan` and paste
"Audit session. Read ai/plans/AUDITOR-BRIEF.md and audit the next plan in ai/plans/README.md."
```
