# Plan: Session 7. Android: each notification replaces the one before it

| Field | Value |
| --- | --- |
| Brief | `ai/prompts/replace-previous-notification.md` |
| Planned at | `fc2dd139` (version 1.27.195), 2026-09-17 |
| Planned by | Planning session on 2026-09-17, GLM 5.3 |
| Amended | 2026-09-17: the posts reading re-derived from the system's `notification_enqueue` events and the tray model corrected for package-replace cancellation (owner, 12:34 ruling and 12:39 delegation); see `LOG.md` |
| Needs first | nothing |
| Steps | 1, one branch, one commit, one version, then the device proof |
| Device | OnePlus 3T: a mock build of the parent commit, the new mock build, then the latest mock build with the Asr-next data |
| Owner decisions still needed | None (every one was taken while planning; see section 2) |

## 1. Goal

Today every notification the app posts on Android stacks in the tray: expo-notifications posts each
notification under its request identifier as the tag with a fixed id of 0, and the app's identifiers are
unique per prayer, day and interval, so nothing ever replaces anything (`ExpoPresentationDelegate.kt:108-112`
in expo-notifications 57.0.18). A user who never swipes reaches Android's 50-notification cap (finding 73)
and always has a pile to clear.

When this plan is DONE, the newest notification the app produces is the only one showing: reminder or
at-time, Standard or Extras, silent or sound. Each post lands under one shared tag and id, so Android
replaces what was showing before. No cleanup code is built for the notifications stacked by earlier
builds: the owner decided that on 2026-09-17. Android itself cancels an app's posted notifications when
its package is replaced (verified on the 3T on 2026-09-17, LOG.md's 12:31 and 12:33 readings), so a user
updating from a stacking build has the pile cleared by the update, not by the app. Scheduling is
untouched: identifiers, alarms, the sweep and every bell keep today's behaviour exactly.

The owner notices in the notification shade only: after any fire, one notification, never a pile.

The owner's rules that apply, quoted:
- `ai/prompts/replace-previous-notification.md`, 2026-09-13: "It should overwrite the previous
  notifications, so the user doesn't have to keep swiping, to delete all the notifications, and That's it."
- The same brief, the owner's decision the same day: "Let's not even bother to deal with it. Let just let
  this system deal with it... Let's just leave it." and the one condition: "As long as it's not a default
  sound, ... then that's fine."
- The same brief, 2026-09-17, on the notifications stacked by earlier builds: "The users can swipe away the
  ones that were there before... the old ones can just be cleared away by hand. We don't want to make extra
  work for us."
- The same brief, 2026-09-17, on two Sound notifications landing in the same second: "I only ever heard 1
  make a sound... we should stack them. The user, it's up to the user... I don't think anything breaks."

## 2. Decisions

### 2.1 Taken

1. **No dismissal call is added anywhere, and the pile does not survive an update.** Owner, 2026-09-17,
   quoted above, with the corrected readings ruled at 12:34 the same day; recorded in
   `ai/prompts/README.md`. Android cancels an app's posted notifications when its package is replaced,
   verified on the 3T during 7.2 (LOG.md, 12:31 and 12:33): the installs moved every stacked notification
   into `dumpsys notification`'s archive, so from the update on the tray holds only what the new build
   posts. The model this plan first carried, a pile surviving the update, was wrong; the decision's code
   consequence, no dismissal code anywhere, is unchanged.
2. **Same-instant pairs are left to the system, including the sound consequence.** The design review found
   that when two Sound notifications land in the same second, the second is muted and its post can stop the
   first's sound mid-play, leaving about a second of athan. The owner was shown exactly that and chose to go
   ahead: one sound at a time is what their own earlier nine-run test already showed. Owner, 2026-09-17,
   quoted above; recorded in `ai/prompts/README.md`. The device proof measures what actually plays.
3. **The change rides a `NotificationsService` subclass declared by a config plugin, not a patch to
   expo-notifications.** Planner: the brief names both routes. The patch route needs the new
   `patch-package` dependency, which the owner's rules ask first for, and it modifies `node_modules` at
   every install; the plugin route is the repo's own pattern (`plugins/gradleJvmMemory.js`,
   `plugins/portraitOnlyIpad.js`, `modules/tls13`), needs no new dependency, and fails loudly at build time
   if a future expo-notifications moves what it overrides. Its cost, old alarms becoming undeliverable
   PendingIntents after an update, is bounded (they fire once as no-ops) and is proven on the 3T in
   section 7.
4. **One shared tag and id for everything the app posts.** Owner, 2026-09-13 ("by adding a tag like you
   mentioned"). The tag is `athan-notification`, the id stays expo's fixed 0.
5. **expo's own receiver is removed from the merged manifest.** Planner: `findDesignatedBroadcastReceiver`
   takes the first receiver matching the action (`NotificationsService.kt:403-406`), so two receivers would
   make routing nondeterministic between the stacking and the replacing delegate. The brief names this
   mechanism.
6. **The Kotlin sources are written by the plugin at prebuild under a fixed package,
   `com.mugtaba.athan.notifications`.** Planner: `android/` is a gitignored prebuild artifact, so nothing
   can live there permanently; the package is deliberately NOT derived from `config.android.package`,
   because `EXPO_ANDROID_SUFFIX=fleettest` builds change the package id while the class must not move
   (design review finding 9).
7. **Nothing in `app/ components/ hooks/ stores/ device/ shared/` changes.** Planner: the posting layer is
   native; the app's JavaScript never sees the tag. The one JavaScript seam is the plugin file and its
   tests.
8. **This planning session also set `"experimental": {"subagent_depth": 2}` in the repository's
   `opencode.json`.** Owner, 2026-09-17, asked for the harness's nested-subagent block to be looked at and
   fixed if simple: the error named `experimental.subagent_depth`, the project's own `opencode.json` is the
   right home (execution sessions need their Code Reviewer subagents one level down too), and the setting
   took effect immediately. The file is repository wiring, not OpenCode's own configuration under
   `~/.config/opencode/`.

### 2.2 The executor must not decide

STOP, append what you saw to `LOG.md`, and ask the owner the question given, whenever one of these happens:

1. **An anchor count other than 1**, in the pre-flight or the step's part 0. This is NEEDS REPLAN
   (`EXECUTOR-BRIEF.md` section 1, item 4). Tell the owner: "Anchor `<id>` counts `<n>` in `<file>`, so the
   plan is out of date. Please run the planning prompt."
2. **A test fails that the plan does not name**, or a named test fails with a different line. Ask: "In step
   1, `<test>` failed with `<first failure line>`, which the plan does not expect. Shall I stop here so the
   plan can be refreshed?"
3. **A break prints `BREAK NOT APPLIED` or `NOT AS EXPECTED`.** Ask: "Break `<name>` did not behave as the
   plan says: `<that line>`. What do I do?"
4. **A Code Reviewer (GLM 5.3) finding that section 10 does not answer word for word.** Ask: "The reviewer
   asks: `<finding in its words>`. The plan gives no fix for it. Do you want it applied (the plan is then
   refreshed first), or shall I merge without it?"
5. **Anything that would touch visuals, a prayer time, `releases.json`, the `uat` branch or EAS.** Ask:
   "Step 1 would change `<what>`, which this plan forbids. What do I do?"
6. **A build script prints `FAILED`.** Ask: "`<script>` failed with `<line>`. What do I do?"
7. **An alarm dump names an app alarm whose tag is neither `*walarm*:expo.modules.notifications.NOTIFICATION_EVENT`
   nor `*walarm*:ACTION_FORCE_STOP_RESCHEDULE`**, or holds more app alarms than section 7 predicts at that
   point. Ask: "The alarm dump at section 7 `<item>` holds `<line>`. What do I do?" A clock drive fires
   every armed alarm it passes, so this check comes before every drive.
8. **`tray.py` prints a `TRAY` count other than 1 after a fire, a second `NOTIFY` line with the tag
   `athan-notification`, or any `NOTIFY` line whose tag is one of `PILE`'s.** Ask: "After the fire in
   section 7 `<item>`, the tray holds `<tray.py output>`. What do I do?" (The package replace of each
   install cancels the app's posted notifications, so from 7.2 item 11 on the tray holds only the shared
   tag's own notification; only that count is asserted.)
9. **`posts.py` prints a `POSTS` count other than the one section 7 predicts.** Ask: "The fire in section 7
   `<item>` produced `<posts.py output>`. What do I do?"
10. **A `read` of a sheet shows a title other than the prayer section 7 says was tapped, or a control the
    plan's coordinates were meant to move did not move.** Ask: "The tap at `<x>,<y>` did not open
    `<expected>`: `<what the dump shows>`. What do I do?"
11. **The phone is locked, off the cable, or adb hangs twice.** Ask: "Please unlock the OnePlus 3T, keep it
    on the cable and on its home screen, and reply when that is done."
12. **The `vision` subagent (GLM 5.3 Flash) gives an answer the plan does not expect.** Ask: "vision read
    `<file>` as `<answer>`; the plan expects `<expected>`. What do I do?"

## 3. Pre-flight

Copy the saved script and run it: `cp ai/plans/07-replace-previous-notification/scripts/preflight.sh
$TMPDIR/preflight-7.sh && bash $TMPDIR/preflight-7.sh <k>`, where `<k>` is the first item of section 6's
checklist not ticked DONE (1 for a new plan; 2 when only the device proof is left).

The script runs on a tree the planning session left committed: this plan folder, `ai/plans/README.md`,
`ai/prompts/README.md` and `opencode.json` are all on `uat-2` before execution starts, so the working tree
holds nothing but the three plan files an execution session may change. If `git status --porcelain` lists
any of the planning session's own outputs, the planning commit is missing: STOP and ask "The plan folder or
the READMEs are uncommitted, so the planning session never finished. Please run the planning prompt."

The script is saved as `ai/plans/07-replace-previous-notification/scripts/preflight.sh`. It checks the
checkout, the branch, the tree, `origin/uat-2`, the version (never lower than 1.27.195), the one anchor,
jest, node, python3, perl, `android/app/build.gradle` and `aapt`. Expected output for `<k>` = 1:

```text
VERSION <the version uat-2 carries, 1.27.195 or higher>
NEEDS FIRST nothing
ANCHOR 1-1 app.json 1
PREFLIGHT OK
```

- The last line is `PREFLIGHT OK`: go on.
- A line starting `PREFLIGHT NEEDS REPLAN`: NEEDS REPLAN (section 2.2, item 1).
- A line starting `PREFLIGHT FAILED`: STOP and ask "The pre-flight failed: `<line>`. What do I do?".

The phone is not checked here; section 7 checks it.

## 4. Background the executor needs

### 4.1 Code map

| File | What it does | This plan |
| --- | --- | --- |
| `plugins/replacePreviousNotification.js` | New. The config plugin: manifest edits plus the two Kotlin sources, run at every prebuild | Step 1 adds it |
| `plugins/__tests__/replacePreviousNotification.test.ts` | New. The suite that pins the plugin and the upstream it rides on | Step 1 adds it |
| `app.json` | The plugins array | Step 1 adds one line |
| `plugins/gradleJvmMemory.js`, `plugins/portraitOnlyIpad.js` | The repo's existing config plugins, the pattern the new one follows | Read only |
| `app.config.ts` | Rebuilds `config.plugins`, stripping `expo-widgets` when the flag is off; everything else passes through | Read only; step 1 pins the pass-through |
| `device/notifications.ts`, `stores/notifications.ts`, `shared/notifications.ts` | Identifiers, scheduling, the lock, channels, the sweep | Read only: nothing changes |
| `node_modules/expo-notifications/android/.../service/delegates/ExpoPresentationDelegate.kt` | Posts each notification with `notify(identifier, getNotifyId())`, id 0; `presentNotification` is an override without `final`, so open | The Kotlin overrides it |
| `node_modules/expo-notifications/android/.../service/NotificationsService.kt` | The dispatcher receiver; `findDesignatedBroadcastReceiver` takes the first match; `createNotificationTrigger` pins the receiver class into every alarm PendingIntent | The Kotlin subclasses it; the manifest replaces it |
| `node_modules/expo-notifications/android/src/main/AndroidManifest.xml` | Declares expo's receiver with six actions | Step 1 pins it in the test |

What the platform does, read from the installed source and verified while planning:

- Every post, from every path, funnels through one method. A scheduled alarm with the app killed:
  `ExpoSchedulingDelegate.triggerNotification` sends `receive`, `ExpoHandlingDelegate.handleNotification`
  calls `NotificationsService.present` with a null behavior. The foreground handler in
  `hooks/useNotification.ts` answers and the module presents with a behavior. Both land in
  `onPresentNotification`, which calls `getPresentationDelegate(context).presentNotification`. That method
  is the only `NotificationManagerCompat.notify` in the library.
- The Kotlin subclass rebuilds the request under the shared tag and calls the parent's
  `presentNotification`, so the parent's own posting code does the work; the identifier is swapped only at
  the posting layer, and scheduling, cancelling and the stored request keep the app's identifiers.
- The app never reads a posted notification back: no `dismissNotificationsAsync`, no
  `getPresentedNotificationsAsync`, no response listeners anywhere in `app/ components/ device/ hooks/
  shared/ stores/` (checked by grep and again by the design review). The sweep uses
  `getAllScheduledNotificationsAsync`, which lists the stored requests, not the tray.
- Alarms are PendingIntents whose explicit component is the designated receiver and whose request code is
  the component class name's hash (`NotificationsService.kt:416-440`). After the update installs this plan's
  build, expo's receiver is gone from the merged manifest, so an old alarm's broadcast delivers nothing;
  `MY_PACKAGE_REPLACED` reaches the new receiver, whose inherited `onSetupScheduledNotifications` re-arms
  every still-future stored request under the new receiver, and the app's first cold launch reschedules
  everything again. An old alarm that a later cancel cannot reach (its PendingIntent names the removed
  receiver) fires once as a no-op. Requests whose date has passed are dropped by the re-arm, not re-armed.
- The prebuilt `android/` folder already declares `xmlns:tools` on its manifest root, and the plugin adds it
  when missing, so a clean prebuild and a re-run over an existing folder both work.
- Proven while planning, in a scratch worktree at `fc2dd139` plus this change: `npx expo prebuild -p
  android --no-install` writes both Kotlin files and both manifest nodes; `./gradlew
  :app:compileReleaseKotlin :app:processReleaseMainManifest` ends `BUILD SUCCESSFUL`; the merged manifest
  holds exactly one `com.mugtaba.athan.notifications.AthanNotificationsService` and zero
  `expo.modules.notifications.service.NotificationsService`.

### 4.2 Anchors

Every anchor is saved in full under `ai/plans/07-replace-previous-notification/scripts/anchors/`, listed in
`anchors/manifest.txt`, and counted 1 at `fc2dd139`.

| Anchor | File | What it holds |
| --- | --- | --- |
| `1-1` | `app.json` | the two existing local plugin lines, `gradleJvmMemory` and `portraitOnlyIpad`, where the new entry goes after |

### 4.3 How the pieces interact

Nothing asynchronous in the app changes. The one new moving part is prebuild:

| Event | Before this plan | After |
| --- | --- | --- |
| `npx expo prebuild` (every version bump, and inside both build scripts) | Two local plugins run | The new plugin also runs: manifest nodes added once (idempotent), both Kotlin files written |
| An alarm fires, app killed | Receiver: expo's; posts under the request identifier | Receiver: ours; posts under `athan-notification`, replacing whatever showed |
| A foreground notification | Same posting path, behavior from the JS handler | Same, through the same override |
| `MY_PACKAGE_REPLACED`, boot | expo's receiver restores alarms from its store | Our receiver restores them, under our class |
| A cancel | PendingIntent names the designated receiver | Same code; new PendingIntents name our receiver, and only match alarms our receiver armed |

### 4.4 Existing tests that cover this code

None: the plugin is new. The suites that cover what it touches but must not change:
`shared/__tests__/config.test.ts` and `configBuildSwitches.test.ts` (app config), `shared/__tests__/flags.test.ts`
(the app.config.ts plugin filter), `device/__tests__/notifications.test.ts` and
`stores/__tests__/notifications*.test.ts` (scheduling, identifiers, the sweep). All run unchanged.

### 4.5 Why the obvious simple fixes are wrong

- **A patch to `node_modules` (patch-package):** smallest diff, but a new dependency the owner's rules ask
  first for, and it rewrites a library at every install; an SDK bump then fails at install time rather than
  at build time.
- **Keeping expo's receiver and adding ours:** `findDesignatedBroadcastReceiver` takes the first match, so
  posts would sometimes reach the stacking delegate: the feature would work or not at random.
- **A JavaScript-only change:** expo-notifications offers no API for the tag; no amount of JS changes the
  tag a post carries.
- **Clearing the old pile on update:** the owner explicitly declined the extra work (decision 1), and
  Android's package-replace cancellation clears the pile without any code anyway.

## 5. Design

- **Approach.** One config plugin, `plugins/replacePreviousNotification.js`: at prebuild it removes expo's
  receiver from the merged manifest, declares `com.mugtaba.athan.notifications.AthanNotificationsService`
  with exactly expo's six actions, and writes the two Kotlin sources under
  `android/app/src/main/java/com/mugtaba/athan/notifications/`. The service subclass overrides
  `getPresentationDelegate`; the delegate subclass overrides `presentNotification` to rebuild the request
  under `SHARED_NOTIFICATION_TAG = "athan-notification"` and hand it to the parent. `app.json` names the
  plugin.
- **Invariant, one sentence a test can check:** every notification the app posts on Android is posted under
  exactly the tag `athan-notification` with id 0, so after any fire the tray holds at most one notification
  of the app's. The Jest suite pins the tag, the classes and the manifest surgery; the device proof pins the
  tray.
- **Alternatives rejected:** see section 4.5.
- **Concurrency and update trace:** section 4.3. The one risk carried, old alarms becoming dead
  PendingIntents after an update, is bounded, expected and proven in section 7.2.
- **Design review.** A Software Architect subagent (GLM 5.3), 2026-09-17, attacked the design against the
  installed source; its verdict was "design sound". Its findings that changed the plan: the same-instant
  sound truncation went to the owner (decision 2); the test suite gained the upstream-source pins, the
  receiver-name pin and the `app.config.ts` pass-through pin (all in the step); the device proof must not
  force-stop the app before the update and must expect past requests to be dropped by the re-arm; the
  fleettest package invariant went into decision 6; the artifact check in section 7.1 (the built APK's own
  manifest) came from its finding that a stale `android/` folder would silently keep stacking.
- **Spike.** Everything in the step was built and run in a scratch worktree at `fc2dd139`: the red run
  fails at the require with `Cannot find module` (`Tests: 0 total`), the green run reports
  `Tests: 10 passed, 10 total`, `npx tsc --noEmit` exits 0, Biome is clean after its own `--write` fixed the
  import order and line wrapping, all five breaks were caught (break 1d failing two tests), and prebuild
  plus `:app:compileReleaseKotlin :app:processReleaseMainManifest` ended `BUILD SUCCESSFUL` with the merged
  manifest holding ours only. One test-design flaw was found and fixed by the spike itself: comparing the
  manifest's actions against the plugin's own export proves nothing, so the test asserts a literal list.

## 6. Steps

- [x] Step 1: DONE in 45754e6094c5e7d1724fdb24ff97b9e18f3c47cb
- [ ] Device proof: section 7

The step is written out in full in `ai/plans/07-replace-previous-notification/steps/1-shared-tag-plugin.md`.
Read it in full before starting it. The device proof starts only after step 1 is merged.

## 7. Device proof

Run this after step 1 is merged. Every command runs from `/Users/muji/repos/rn.athan.uk`. The owner
receives no screenshots: only the `vision` subagent (GLM 5.3 Flash) reads them.

Measured while planning, and used below: the bell column is `x=970`, rows 150 pixels apart on both pages
(Magrib 1274 verified live on the 3T on 2026-09-17, Isha 1424 from session 6b, so Fajr 674, Sunrise 824,
Dhuhr 974, Asr 1124; the Extras page starts on the same rows, so Midnight 674, Last Third 824, Suhoor 974);
the alert sheet's Athan options sit at Off (250,1030), Silent (540,1030), Sound (831,1030); the Reminder
switch at (926,1266); the reminder's Sound option at (831,1476); the interval stepper's plus at (924,1614).
Every tap is verified by the next `read`, which works while a sheet is open (proven on the 3T while
planning), so a wrong coordinate is caught, never guessed around.

### 7.0 Preparation and safety reading

1. Run `date '+%H:%M'`. If the time is 23:45 or later, stop and continue after 00:15 (`EXECUTOR-BRIEF.md`
   section 3). Tell the owner, word for word: "The device proof starts now and needs about 45 minutes. The
   phone is on test builds throughout; your real alerts come back with the final Asr-next mock build, which
   the last step installs. Nothing here needs your hands."
2. Run `mkdir -p ~/athan-device-sweep/session7/build ~/athan-device-sweep/session7/mocks`.
3. Run `cp ai/plans/07-replace-previous-notification/scripts/mocks/fixed-days.ts.txt ~/athan-device-sweep/session7/mocks/fixed-days.ts`.
4. Run `git rev-parse uat-2` and write the sha in `LOG.md` as `FINAL=<sha>`. Every `<FINAL>` below is that
   sha. Run `git rev-parse uat-2^` and write `PARENT=<sha>`: the parent commit, whose build still stacks.
5. Run `adb -s 8f7ada76 get-state`. Expected: `device`.
6. Run `adb -s 8f7ada76 shell settings get global auto_time`. Expected: `1`.
7. Run `adb -s 8f7ada76 shell dumpsys window policy | grep -c 'showing=true' || true`. Expected: `0`. `1`
   means the phone is locked: section 2.2, item 11.
8. Run `adb -s 8f7ada76 shell svc power stayon usb`.
9. Run `python3 ai/plans/07-replace-previous-notification/scripts/device/tray.py ~/athan-device-sweep/session7/tray-start.txt`.
   Expected: `TRAY` followed by any count, one `NOTIFY` line per notification the installed build last
   left showing. Write the count in `LOG.md` as `TRAY_START=<n>` and list the tags as `PILE=<tags>`.
   The pile does not survive this proof's installs: Android cancels an app's posted notifications when
   its package is replaced (verified on the 3T on 2026-09-17, LOG.md's 12:31 and 12:33 readings), so
   from 7.2 item 11 on every tray reading is exactly one notification, the shared tag's own.
   `TRAY_START` and `PILE` are recorded so the findings text can name what the replace cancelled.
   Anything else: section 2.2, item 8.
10. Run `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session7/alarms-start.txt`, then
    `grep -A1 'com.mugtaba.athan}' ~/athan-device-sweep/session7/alarms-start.txt | grep -o 'tag=\*walarm\*:[A-Za-z_.]*' | sort | uniq -c`.
    Expected: one line ending `tag=*walarm*:ACTION_FORCE_STOP_RESCHEDULE` with count 1 (the year-2036
    WorkManager alarm, `when=2036-09-12 04:40:40.505`, on every 3T dump), and at most one line ending
    `tag=*walarm*:expo.modules.notifications.NOTIFICATION_EVENT`, whose count is the alarms the installed
    build armed. Any other tag: section 2.2, item 7.

### 7.1 The built artifact carries the change

1. Build in the background:
   `zsh ~/athan-device-sweep/session3/bin/build-mock.zsh <FINAL> ~/athan-device-sweep/session7/mocks/fixed-days.ts ~/athan-device-sweep/session7/build/athan-7-new.apk > $TMPDIR/build-7-new.log 2>&1`.
   Expected: the log holds `BUILD-MOCK OK`, and after it a line starting `versionName` that ends with the
   version `node -p 'require("./package.json").version'` prints.
2. Build in the background, after the first build's notification:
   `zsh ~/athan-device-sweep/session3/bin/build-mock.zsh <PARENT> ~/athan-device-sweep/session7/mocks/fixed-days.ts ~/athan-device-sweep/session7/build/athan-7-old.apk > $TMPDIR/build-7-old.log 2>&1`.
   Same expectations with the parent's version.
3. Run `$HOME/Library/Android/sdk/build-tools/37.0.0/aapt dump xmltree ~/athan-device-sweep/session7/build/athan-7-new.apk AndroidManifest.xml > ~/athan-device-sweep/session7/new-apk-manifest.txt`.
   Then `grep -c 'AthanNotificationsService' ~/athan-device-sweep/session7/new-apk-manifest.txt`. Expected:
   `1`. Then `grep -c 'expo.modules.notifications.service.NotificationsService' ~/athan-device-sweep/session7/new-apk-manifest.txt`.
   Expected: `0`. The shipped APK itself holds our receiver and not expo's. Any other counts: STOP and ask
   "The new APK's manifest holds `<the two counts>`. What do I do?".
4. The same two greps on a dump of `athan-7-old.apk`, saved as `~/athan-device-sweep/session7/old-apk-manifest.txt`,
   must print `0` and `1`: the parent still carries expo's receiver and not ours.

### 7.2 The update path: alarms armed by the stacking build

The fixed mock days sit in the past (2026-09-12 and 2026-09-13), so this phase's first clock move is a
backward jump, which fires nothing. Later drives within the mock days are forward, so before each one the
alarm dump is read and every armed instant between the two clock readings is named here first. Alarms the
mock storage already holds from earlier sessions may also be armed for the driven days: their counts are
predicted relative to what this phase records, never as fixed numbers.

1. Install the old build in the background:
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py install ~/athan-device-sweep/session7/build/athan-7-old.apk > $TMPDIR/install-7-old.log 2>&1`.
   Expected: a line containing `Success`, then a state line with the parent's version. This is the mock
   storage (`athan-storage-dev`); the owner's data is untouched.
2. Drive the clock BACK to the fixed mock's Saturday morning:
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py clock '2026-09-12 08:00:00'`. Expected: a line
   naming the device time it set. A backward jump fires no alarm.
3. Cold launch: `python3 ~/athan-device-sweep/session5/bin/devcheck.py cold old-cold > $TMPDIR/cold-7-old.log 2>&1`
   in the background, then `python3 ~/athan-device-sweep/session5/bin/devcheck.py wait 15` twice. The screen
   read may print `DUMP FAILED`, which is expected while the countdown animates. The mock storage's saved
   preferences may arm rows besides the ones this phase taps: the dump in item 6 records whatever they are.
4. Arm Asr at Silent. Asr's bell is at (970,1124):
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py tap 970 1124`, then
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py wait 3`, then
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py read old-asr-sheet`.
   Expected in the read's summary: the text `Asr`. Any other prayer name: section 2.2, item 10.
5. `python3 ~/athan-device-sweep/session5/bin/devcheck.py tap 540 1030` (Silent), then
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py key back`, then
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py wait 10` (the commit arms two days of alarms).
6. Run `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session7/alarms-old-armed.txt`, then the
   tag count command from 7.0 item 10 on it. Expected: `NOTIFICATION_EVENT` count at least 2, and every
   armed instant it lists sits inside 2026-09-12 08:00 to 2026-09-13 17:00 (Asr's two days, plus whatever
   the mock storage's saved preferences armed). An armed instant before 2026-09-12 16:40 other than none,
   or after 2026-09-13 17:00: section 2.2, item 7. Write the count in `LOG.md` as `OLD_ALARMS=<n>` and
   note, from the dump's `when=` lines, which instants between 08:00 and 16:42 on 2026-09-12 are armed:
   driving to item 9's minute passes exactly those.
7. Install the new build over it, keeping the data, with NO force-stop or `am kill` in between (the update's
   own re-arm is what holds the alarms):
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py install ~/athan-device-sweep/session7/build/athan-7-new.apk > $TMPDIR/install-7-new.log 2>&1`.
   Expected: `Success`, then the new version.
8. `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session7/alarms-after-update.txt`, then the
   tag count. Expected: `NOTIFICATION_EVENT` count from `OLD_ALARMS` to twice `OLD_ALARMS`: the update's
   re-arm and the cold launch reschedule re-armed the same instants under the new receiver, and each old
   PendingIntent may still sit in AlarmManager as an undeliverable double. More than twice `OLD_ALARMS`:
   section 2.2, item 7. Write it in `LOG.md` as `AFTER_UPDATE_ALARMS=<n>`.
9. Move to the minute before Asr, firing whatever item 6 said is armed on the way (their posts are the new
   build's own, under the shared tag; they are recorded, not asserted):
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py clock '2026-09-12 16:41:00'`, then
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py wait 10`, then
   `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session7/alarms-before-asr.txt` and the tag
   count. Expected: every armed instant the dump names is at or after 16:42 (nothing further fires before
   Asr). An armed instant between 16:41 and 16:42 other than Asr's own: section 2.2, item 7.
10. Clear the log and drive the last 90 seconds: `adb -s 8f7ada76 shell logcat -c`, then
    `python3 ~/athan-device-sweep/session5/bin/devcheck.py clock '2026-09-12 16:42:30'`, then
    `python3 ~/athan-device-sweep/session5/bin/devcheck.py wait 15`.
11. Save the log and read the posts and the tray:
    `adb -s 8f7ada76 shell logcat -d -b system,events > ~/athan-device-sweep/session7/fire-asr.logcat.txt`, then
    `python3 ai/plans/07-replace-previous-notification/scripts/device/posts.py ~/athan-device-sweep/session7/fire-asr.logcat.txt '09-12 16:42:30' '09-12 16:47:30' | tee $TMPDIR/posts-asr.txt`, then
    `python3 ai/plans/07-replace-previous-notification/scripts/device/tray.py ~/athan-device-sweep/session7/tray-asr.txt`.
    Expected: `POSTS 1` (exactly one enqueue event; its printed line holds
    `com.mugtaba.athan,0,athan-notification,0,Notification(channel=expo_notifications_fallback_notification_channel`;
    the old PendingIntent delivered nothing), `MUTED 0` (nothing else was due in the 90 seconds), `TRAY 1`
    with exactly one `NOTIFY tag=athan-notification` line whose channel is
    `expo_notifications_fallback_notification_channel` (a Silent alert's channel). The pile recorded as
    `TRAY_START` and `PILE` in 7.0 appears nowhere in the Notification List: item 7's package replace
    cancelled it, and its tags sit only in the tray save's archive section. `POSTS 2`, a `TRAY` count
    other than 1, two `athan-notification` lines, or a `PILE` tag as a `NOTIFY` line: section 2.2, items
    8 and 9: that is the duplicate this phase exists to rule out. Write `POSTS`, `MUTED` and `TRAY` in
    `LOG.md`.

### 7.3 Replace, channel-crossing, and the same-instant pair

1. Drive to the small hours of the mock's Sunday, firing whatever item 6 said is armed on the way (Magrib
   19:47 and Isha 20:58 on 2026-09-12, if the storage's preferences arm them), then let the app
   reschedule: `python3 ~/athan-device-sweep/session5/bin/devcheck.py clock '2026-09-13 03:00:00'`, then
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py cold new-cold > $TMPDIR/cold-7-new.log 2>&1` in
   the background, then `wait 15` twice.
2. Arm Fajr at Sound with a 20-minute reminder at Sound. Fajr's bell is at (970,674): `tap 970 674`,
   `wait 3`, `read new-fajr-sheet` (expected text `Fajr`; else section 2.2, item 10), `tap 831 1030`
   (Sound), `wait 2`, `tap 926 1266` (the Reminder switch), `wait 2`, `tap 831 1476` (the reminder's
   Sound), `wait 2`, `tap 924 1614` (plus), `wait 2`, `tap 924 1614` (plus), `wait 2`, `tap 924 1614`
   (plus: 5 to 20), `wait 2`, `read new-fajr-20` (expected in the descs: `20 min` and `Increase to 25 min`;
   else section 2.2, item 10), `key back`, `wait 10`.
3. Arm Suhoor at Sound. Swipe to the Extras page: `adb -s 8f7ada76 shell input swipe 900 300 150 300 300`,
   `wait 3`. Suhoor's bell is at (970,974): `tap 970 974`, `wait 3`, `read new-suhoor-sheet` (expected
   text `Suhoor`; else section 2.2, item 10), `tap 831 1030` (Sound), `key back`, `wait 10`.
4. Run the alarm dump and the tag count. Expected: `PAIR_ALARMS` between 4 and `AFTER_UPDATE_ALARMS`
   plus 5, and every armed instant the dump names at or after 2026-09-13 04:22 is one of these eight —
   Suhoor 04:22 and the Fajr reminder 04:22 (both the pair), Fajr 04:42, Asr 16:40, then the same four
   rows one day later (Suhoor and the reminder at 04:24, Fajr 04:44, Asr 16:39) — with each of the eight
   named at least once and at most twice (the old build's dead double). The rolling window arms two list
   days, and Asr has stayed on since 7.2. Anything else: section 2.2, item 7. Write
   `PAIR_ALARMS=<n>` in `LOG.md`. Then move to the minute before the pair, firing nothing on the way (the
   dump just read names every armed instant, and none sits between 03:00 and 04:21):
   `devcheck.py clock '2026-09-13 04:21:00'`, then `wait 10`, then a fresh alarm dump as
   `alarms-before-pair.txt` whose every armed instant is at or after 04:22. Anything else: section 2.2,
   item 7.
5. The same-instant pair: `adb -s 8f7ada76 shell logcat -c`,
   `devcheck.py clock '2026-09-13 04:22:00'`, `wait 15`, then
   `adb -s 8f7ada76 shell logcat -d -b system,events > ~/athan-device-sweep/session7/fire-pair.logcat.txt`, then
   `python3 ai/plans/07-replace-previous-notification/scripts/device/posts.py ~/athan-device-sweep/session7/fire-pair.logcat.txt '09-13 04:22:00' '09-13 04:27:00' | tee $TMPDIR/posts-pair.txt`, then
   `python3 ai/plans/07-replace-previous-notification/scripts/device/tray.py ~/athan-device-sweep/session7/tray-pair.txt`.
   Expected: `POSTS 2` (both notifications posted, each printed line holding
   `com.mugtaba.athan,0,athan-notification,0`), `MUTED 0` or `MUTED 1` (recorded either way), `TRAY 1`
   with exactly one `NOTIFY tag=athan-notification` whose channel is `reminder_fajr_20`
   or `extras_at_time` and never `expo_notifications_fallback_notification_channel`. The surviving title
   is whichever posted last; the plan does not predict it, and the owner ruled the system decides
   (decision 2). A `TRAY` count other than 1, two `athan-notification` lines, or a fallback channel:
   section 2.2, items 8 and 9. Write the three numbers in `LOG.md`.
6. The channel-crossing replace, twenty minutes later, firing nothing on the way (the next armed instant
   after the pair is Fajr at 04:42): `adb -s 8f7ada76 shell logcat -c`,
   `devcheck.py clock '2026-09-13 04:42:00'`, `wait 20`, then the same three saves with the labels
   `fire-fajr.logcat.txt`, `posts-fajr.txt`, `tray-fajr.txt` (the posts window
   `'09-13 04:42:00' '09-13 04:47:00'`). Expected: `POSTS 1`, its printed line holding
   `com.mugtaba.athan,0,athan-notification,0,Notification(channel=athan_1_v2`, and `TRAY 1` with exactly
   one `NOTIFY tag=athan-notification channel=athan_1_v2` line (the default athan), with `MUTED 0`. The
   notification showing on the reminder's channel was replaced by one on the athan's channel, exactly as
   its own channel says. Anything else: section 2.2, items 8 and 9.

### 7.4 Four fires, one shared-tag notification

Run `python3 ai/plans/07-replace-previous-notification/scripts/device/tray.py ~/athan-device-sweep/session7/tray-end.txt`.
Expected: `TRAY 1` with exactly one `NOTIFY tag=athan-notification`. Four shared-tag posts
have happened since 7.2 (Asr, the pair's two, Fajr) and they left exactly one notification between them:
finding 73's 50-notification cap cannot be reached by this app again. Write it in `LOG.md`.

### 7.5 The phone left on the latest mock build

1. Build in the background:
   `zsh ~/athan-device-sweep/session3/bin/build-mock.zsh <FINAL> /Users/muji/repos/rn.athan.uk/mocks/simple.ts ~/athan-device-sweep/session7/build/athan-7-mock-final.apk > $TMPDIR/build-7-final.log 2>&1`.
   Expected: `BUILD-MOCK OK` and the `versionName` line.
2. `python3 ~/athan-device-sweep/session5/bin/devcheck.py auto`. Returning to the real clock passes every
   alarm still armed on the driven days (at least Asr 2026-09-13 16:40); each fires once under the shared
   tag, so the tray keeps at most one notification. Record the count in `LOG.md` as `AUTO_FIRES=<n>`; no
   value is asserted. Then
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py install ~/athan-device-sweep/session7/build/athan-7-mock-final.apk > $TMPDIR/install-7-final.log 2>&1`
   in the background. Expected: `Success`, then the new version.
3. `python3 ~/athan-device-sweep/session5/bin/devcheck.py cold final-cold > $TMPDIR/cold-7-final.log 2>&1`
   in the background, then `wait 15` twice, then
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py shot ~/athan-device-sweep/session7/mock-final.png`.
4. Spawn `vision` (GLM 5.3 Flash) with this prompt. Expected: `YES`. Any other answer: repeat item 3 and
   this item once; still not `YES`: section 2.2, item 12.

   ```text
   Read the image at ~/athan-device-sweep/session7/mock-final.png. It is a screenshot of a prayer times app. Answer
   with exactly one word: YES if the row named Asr is highlighted as the next prayer and the countdown near the top
   shows a time under 2 minutes (such as "45s", "1m" or "1m 30s"); NO otherwise.
   ```

5. Run `adb -s 8f7ada76 shell svc power stayon false`.
6. Run `adb -s 8f7ada76 shell settings get global auto_time`. Expected: `1`.
7. Run `adb -s 8f7ada76 shell dumpsys package com.mugtaba.athan | grep versionName`. Expected:
   `versionName=` followed by `package.json`'s version.
8. Run `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session7/alarms-end.txt`, then the tag
   count of 7.0 item 10. Expected: the two expected tags only, the `NOTIFICATION_EVENT` count 0 or 1 (the
   mock's Asr is seconds away, so it may already have fired). Any other tag: section 2.2, item 7.
9. Spawn a `Reality Checker` subagent (isolation `worktree`, no `model`) with the prompt `REALITY_CHECK` in
   section 11, and write its verdict in `LOG.md`. A final line `evidence does not hold`: STOP and ask
   "Reality Checker (GLM 5.3) found `<its NOT PROVEN lines>`. What do I do?".
10. Only after a final line `evidence holds`: in `PLAN.md` section 6, replace the line
    `- [ ] Device proof: section 7` with `- [x] Device proof: DONE`.

The phone is left on the mock build of `<FINAL>` with the Asr-next mock data, automatic time on, and the
screen's stay-awake setting off. The owner's production data stays in `athan-storage`.

## 8. Records

### 8.1 Findings text

Append this to the end of `ai/features/uat-2/AUDIT-FINDINGS.md`, replacing each placeholder with the value
measured:

- `<DATE>`: the date the device proof ended, as `D Month YYYY`;
- `<FINAL8>`: the first eight characters of the sha from section 7.0;
- `<VERSION>`: `package.json`'s version at `<FINAL>`;
- `<TESTS>`: the `Tests:` line of step 1's commit log;
- `<OLD_ALARMS>`, `<AFTER_UPDATE_ALARMS>`, `<PAIR_ALARMS>`: the alarm counts `LOG.md` records in sections
  7.2 and 7.3;
- `<TRAY_START>`: the tray count `LOG.md` records in section 7.0 (the pile the update's package replace
  cancelled);
- `<ASR_POSTS>`, `<PAIR_POSTS>`, `<PAIR_MUTED>`, `<FAJR_POSTS>`: the `posts.py` numbers `LOG.md` records;
- `<PAIR_CHANNEL>`: the surviving pair notification's channel from `tray-pair.txt`.

```markdown
# Session 7 of the queue: each notification replaces the one before it, <DATE>

The brief is `ai/prompts/replace-previous-notification.md`, planned in
`ai/plans/07-replace-previous-notification/PLAN.md` by a GLM 5.3 planning session (design review: GLM 5.3
Software Architect, "design sound"), executed on GLM 5.3 with a GLM 5.3 Code Reviewer on the commit.
`uat-2` ends at `<FINAL8>` (<VERSION>); the last suite run reported `<TESTS>`, at 100% statements,
branches, functions and lines.

## 78. CLOSED on Android: every post lands under one shared tag

A config plugin (`plugins/replacePreviousNotification.js`) removes expo-notifications' own receiver from
the merged manifest, declares `AthanNotificationsService` with the same six actions, and writes the Kotlin
that swaps the request identifier for `athan-notification` only at the posting layer: scheduling,
cancelling and the stored requests keep the app's unique identifiers. The suite
`plugins/__tests__/replacePreviousNotification.test.ts` pins the manifest surgery, the Kotlin, the plugin's
place in `app.json` and `app.config.ts`, and the upstream seams the change rides on (the open
`presentNotification`, the protected-open `getPresentationDelegate`, the library's single posting site, its
receiver's declaration and actions). Posts in this proof are counted from the system's
`notification_enqueue` events (owner, 2026-09-17): this device drops the
`NotificationService: enqueueNotificationInternal` DEBUG lines the plan first read, while the events
buffer logs every enqueue.

On the 3T (mock builds of the parent and the new commit, the clock driven to the fixed mock days):

- **The artifact:** the new APK's own manifest holds the app's receiver and not expo's (7.1).
- **The update path:** alarms armed by the stacking build (<OLD_ALARMS>) were still in AlarmManager after
  the update alongside the re-armed ones (<AFTER_UPDATE_ALARMS>), and driving to the instant produced
  exactly <ASR_POSTS> post and a tray of exactly one, under the shared tag: the old build's
  PendingIntents, whose receiver is no longer in the manifest, delivered nothing. No duplicates. The
  <TRAY_START> notifications stacked before the update were cancelled by the package replace itself
  (they sit in the tray save's archive section): Android clears an app's posted notifications when its
  package is replaced, so the update removed the pile without the app dismissing anything.
- **Replace:** a Sound reminder on `reminder_fajr_20` and, twenty minutes later, the athan on `athan_1_v2`:
  <PAIR_POSTS> posts at the shared instant left the tray at exactly one under the shared tag on
  `<PAIR_CHANNEL>` (<PAIR_MUTED> muted, recorded), and the athan's fire left exactly one shared-tag
  notification on `athan_1_v2`. After four fires the shared-tag count was
  one: finding 73's 50-notification cap is unreachable through this app's posts.
- Every sound that played was the app's own file or none: the owner's one condition held.

The owner's rulings carried here: no cleanup code for notifications stacked by earlier builds
(2026-09-17), Android's own package-replace cancellation clearing that pile at the update, verified
during this proof; same-instant pairs are left to the system, one sound at a time, which the owner's own
earlier nine-run test had already shown (2026-09-13 and 2026-09-17).

iOS is session 8 (`ai/prompts/ios-replace-previous-notification.md`).

## State left behind

The 3T runs the mock build of `<FINAL8>` with the Asr-next mock data, automatic time on. Nothing was built
on or pushed to EAS, and `releases.json` is untouched. The evidence is in `~/athan-device-sweep/session7/`.
```

### 8.2 Table rows

- **`ai/plans/README.md`:** the executor sets row 3's status to `EXECUTED`.
- **`ai/prompts/README.md`, for the auditor to apply on PASS:** replace row 7's last cell `queued` with
  `**DONE** <DATE>, <step 1 version>: every Android notification posts under one shared tag, so the newest
  replaces the one before it; the update path, a same-instant Sound pair and a channel-crossing replace
  proven on the 3T. The update itself clears the old stacked pile: Android cancels an app's posted
  notifications on package replace (no dismissal code, owner, 2026-09-17)`.

### 8.3 Docs commit

The `executed` docs commit (`EXECUTOR-BRIEF.md` section 4b) uses this message, with `<VERSION>` from
`set-version.sh`:

```text
<VERSION> - docs(plans): session 7 executed: each notification replaces the one before it, proven on the 3T
```

Its files, by name: `ai/plans/README.md`, `ai/plans/07-replace-previous-notification/PLAN.md`,
`ai/plans/07-replace-previous-notification/LOG.md`, `ai/features/uat-2/AUDIT-FINDINGS.md`, `app.json`,
`package.json`.

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session pushes
`uat-2` after a PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

### 10.1 Symptoms

The general table is `EXECUTOR-BRIEF.md` section 7. This session's own:

| Symptom | Cause | Action |
| --- | --- | --- |
| The red run passes a test | The plugin file already exists | `git status --porcelain`: if `plugins/replacePreviousNotification.js` exists before part 4, STOP |
| `breaks-1.sh` prints `BREAK ... NOT AS EXPECTED: the substitution did not change` | The plugin file differs from the step's contracts | STOP and ask; never reshape the code to fit a break |
| Biome moves the test's imports or rewraps a line after `--write` | Biome's import order and width are part of the file's final shape | Run `npx biome check --write plugins/replacePreviousNotification.js plugins/__tests__/replacePreviousNotification.test.ts`, then the green command again |
| `tsc` reports a missing export on the `require` of the plugin | The plugin's `module.exports` is the composer function, and its other exports ride on it as properties | Check the step's part 5 export block was copied exactly; if it was, STOP |
| A build prints `another Android build or bundler is running` | Two builds at once | Wait for the first build's notification, then start the second |
| `read` after a tap prints `DUMP FAILED` | The countdown animates; dumps fail on the bare page but work with a sheet open | `wait 3` and `read` once more with a new label; a second failure: section 2.2, item 10 |
| The sheet opened on the wrong prayer | A bell coordinate moved | Section 2.2, item 10: STOP; never tap around it |
| `MUTED` is 1 where the plan expects 0 or 0 where it expects 1 | The one-second muting window is a race the plan records, not predicts | Record it and go on |
| The phone shows the lock screen | The keyguard came back | Section 2.2, item 11 |

### 10.2 Anticipated review fixes

None is given word for word: every name, string, template and behaviour the step fixes is pinned by a test
or given verbatim, so a reviewer finding beyond them is handled by `EXECUTOR-BRIEF.md` section 4, item 8's
three conditions and nothing else.

### 10.3 Stopping part-way

For `EXECUTOR-BRIEF.md` section 4a:

| Step | Files to restore with `git checkout --` | New files to delete |
| --- | --- | --- |
| 1 | `app.json` | `plugins/replacePreviousNotification.js`, `plugins/__tests__/replacePreviousNotification.test.ts` |

The device proof changes no repository file; mid-proof, run `devcheck.py auto` and leave the phone on
whatever build is installed, and say so in `LOG.md`.

## 11. Subagents in this plan

| Step | Agent type | Model | Isolation | Why | Prompt |
| --- | --- | --- | --- | --- | --- |
| 1 | `Code Reviewer` (a `general` subagent prompted as the reviewer) | GLM 5.3 | `worktree` | The commit is reviewed before it merges | The step file, part 9 |
| Docs commit | `Code Reviewer` (a `general` subagent) | GLM 5.3 | `worktree` | The `executed` docs commit | `EXECUTOR-BRIEF.md` section 4b, item 5 |
| 7.5 | `vision` | GLM 5.3 Flash | none | The executor cannot read images | 7.5 item 4 |
| 7.5 | `Reality Checker` (a `general` subagent) | GLM 5.3 | `worktree` | Does the evidence prove every claim in section 8.1? | `REALITY_CHECK` below |
| Any | `Test Results Analyzer` (a `general` subagent) | GLM 5.3 | `worktree` | Only when a full-suite run fails in a way section 10 does not cover; it reports the cause, then the executor STOPs | "Run `git checkout --detach <sha>`. Read `<log path>` in full and name the cause of each failing test, with file and line. Change nothing." |

The prompt `REALITY_CHECK`:

```text
Run git checkout --detach <FINAL>. Then read /Users/muji/repos/rn.athan.uk/ai/plans/07-replace-previous-notification/PLAN.md
sections 7 and 8.1, and /Users/muji/repos/rn.athan.uk/ai/plans/07-replace-previous-notification/LOG.md, in full, by those
absolute paths: LOG.md holds readings not committed yet. Then read every file under
/Users/muji/athan-device-sweep/session7/ that section 8.1's text cites, except images, which you must not open; for each
image, use the vision answer LOG.md records. For every claim in section 8.1, say whether the files prove it, quoting the
line that does. Reply with one line per claim, "PROVEN: <claim>: <evidence>" or "NOT PROVEN: <claim>: <what is
missing>", then a final line "evidence holds" or "evidence does not hold".
```

## 12. Report to the owner

The final message of the execution session:

```text
🤖  Model: GLM 5.3 (execution session)
Time: <output of date '+%H:%M:%S %d.%m.%Y'>

Session 7 is executed and waits for its audit. One commit, merged into uat-2 on this Mac, not pushed:
- A config plugin posts every Android notification under one shared tag, so the newest replaces the one
  before it. Scheduling, identifiers and every bell are untouched; the notifications stacked by earlier
  builds are cleared by the update itself, because Android cancels an app's posted notifications on
  package replace, so no cleanup code was needed.
- Proven on the 3T with the clock driven: the update produced no duplicate posts, a same-instant Sound pair
  left one notification with at most one sound, and an athan replaced a reminder across channels, with the
  tray holding exactly one notification after four fires.
The phone is on the mock build of the latest uat-2, with Asr next.

<the progress table, in EXECUTOR-BRIEF.md section 6's format>

Nothing waits on you for this session. Next, the audit.
```
