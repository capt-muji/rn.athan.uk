# Plan: Session 8. iOS: a way for each notification to replace the one before it

| Field | Value |
| --- | --- |
| Brief | `ai/prompts/ios-replace-previous-notification.md` |
| Planned at | `fa3337b3` (version 1.27.204), 2026-09-17 |
| Planned by | Planning session on 2026-09-17, GLM 5.3 |
| Needs first | nothing (rows 1 to 3 are DONE) |
| Steps | 0 merged code. One iPhone XS study, section 7, run start to end in one session, plus the records |
| Device | iPhone XS `00008020-0015585C22D2002E`, iOS 18.7.10, driven entirely from this Mac. The owner does nothing |
| Owner decisions still needed | Which behaviour to build, read from the finding this study delivers. Nothing is built by this plan |

## 1. Goal

Today every notification the app delivers on iOS stays in Notification Center until the user clears
it: the app's identifiers are unique per prayer, day and interval (`device/notifications.ts:33-46`),
iOS replaces nothing at delivery, and the owner's ask is unmet on the one platform left. Session 1
read Apple's documentation as allowing no replacement for notifications scheduled on the phone; the
owner rejected that reading as unproven: *"For iOS, you said it's not possible. I don't know if I
believe you. So add it as a point for future sessions to investigate further."*

When this plan is DONE, a finding in `ai/features/uat-2/AUDIT-FINDINGS.md` states what iOS can and
cannot do, each device claim measured on the owner's iPhone XS and each documentation claim cited,
with the best achievable behaviours and what each costs, for the owner to choose from. Nothing is
built: the brief says *"Nothing is built until the owner chooses."* The owner notices this session
only as a conversation: the choice this finding puts in front of them.

The research already happened, in the planning session, from the installed source and Apple's own
pages (section 4.2). This plan's remaining work is the device study the brief demands, and the
record of what it measured.

The owner's rules that apply, quoted:
- `ai/prompts/ios-replace-previous-notification.md`, 2026-09-13: *"For iOS, you said it's not
  possible. I don't know if I believe you. So add it as a point for future sessions to investigate
  further."*
- The same brief: *"A finding that states what iOS can and cannot do, each point proven on the
  device, with the best achievable behaviour and what it costs, for the owner to choose from.
  Nothing is built until the owner chooses."*
- `ai/prompts/replace-previous-notification.md`, 2026-09-13, the ask this serves: *"It should
  overwrite the previous notifications, so the user doesn't have to keep swiping, to delete all the
  notifications, and That's it."*
- Owner, 2026-09-17, on hands during the study: *"you do everything"*.
- Owner, 2026-09-17, on the study build: separate app id, and if on-the-fly provisioning fails the
  executor stops and asks rather than falling back (section 2.1, decision 3).

## 2. Decisions

### 2.1 Taken

1. **The study runs on the iPhone XS, as throwaway builds, and nothing merges.** Owner, 2026-09-17,
   answering this session's first question. The deliverable is the finding plus options; the choice
   is the owner's, later.
2. **The owner does nothing during the study.** Owner, 2026-09-17: *"you do everything"*. No tap,
   no gesture, no unlock schedule. Consequences the design carries: provisional authorization
   (decision 4), Mac-driven launch and kill (decision 5), and one designed STOP if the foreground
   phase meets a locked phone (section 2.2, item 4).
3. **The study runs under its own app id, `com.mugtaba.athan.experiments`, display name
   `Athan Lab`.** Owner, 2026-09-17: the owner's installed Athan (1.26.28) and its data are never
   touched; any install, kill or uninstall touches only the study app. On-the-fly provisioning of
   the new id was proven during planning (section 5): the build signed and the embedded profile
   reads `9V3WAU9Z54.com.mugtaba.athan.experiments`. If provisioning fails at execution time the
   executor STOPs and asks; it never falls back to the owner's app id.
4. **The study asks for PROVISIONAL notification authorization.** Planner, under decision 2:
   `requestPermissionsAsync({ ios: { allowProvisional: true } })` is granted by iOS with no dialog
   (the option is wired through expo-notifications 57.0.18 to
   `UNAuthorizationOptions.provisional`, `TriggerRecords.swift:398,414`), which removes the one
   system dialog no Mac-side tool can tap. Its cost is recorded honestly in the finding:
   provisional notifications deliver quietly (Notification Center and lock screen listing, no
   banner, no sound), which changes nothing any phase measures, and the finding says so.
5. **The phone is driven only with `xcrun devicectl` and `pymobiledevice3`.** Planner: install,
   launch, terminate, screenshot and syslog are all provably available (verified during planning,
   section 5). Locking, unlocking, taps and Notification Center gestures do not exist on any tool
   this Mac has; the study is designed so none is needed, and the lock state is measured, never
   assumed: every launch logs `AppState`, and the one phase that needs an active app runs last and
   retries by relaunch.
6. **The evidence is the app's own reading of the system, logged as single lines.** Planner: the
   study harness logs `NOTIFY-STUDY` lines through `console.log` (pino is disabled in release
   builds), captured by `pymobiledevice3 syslog live`; each line records the delivered set
   (identifiers, titles, thread identifiers) exactly as iOS reports it through
   `getPresentedNotificationsAsync`. Screenshots are taken and saved as corroboration only: no
   Mac-side tool can show Notification Center, and no claim in the finding rests on an image.
7. **One phase per cold launch, selected by a persisted cursor, and the whole study is
   restartable.** Planner, revised in execution: the cursor is a never-firing PENDING
   NOTIFICATION in iOS's own notification store (`study-cursor-<n>`, scheduled with a far-future
   time-interval trigger, older cursors cancelled after the new one is scheduled), because the
   first design kept it in the app's MMKV and every relaunch read it back as 0 (58 identical
   phase-1 runs; `LOG.md`). The native store is persistent by construction and is the very system
   under study. Any interruption resumes by re-running the driver, which reads the cursor from
   the `RUN` log line each launch writes, and a stuck-cursor guard ends a non-advancing run
   within three launches. The foreground-dependent phase runs last (cursor 4) so a locked phone
   costs nothing until then.
8. **Variant B's thread patch is two lines in a private copy of the expo-notifications package
    inside the worktree's own `node_modules`.** Planner: expo-notifications parses a
    `threadIdentifier` off the JS content but never applies it to `UNMutableNotificationContent`
    (section 4.2). The Pods project compiles the pod straight from `node_modules`, and the
    worktree's `node_modules` starts as a symlink to the main checkout's, which no step may touch:
    so for variant B the build script replaces the symlink with a directory of per-package
    symlinks plus ONE real copy, `expo-notifications`, patches exactly that gap in the copy, and
    re-runs `pod install` so the Pods project points at the worktree's own copy. A probe
    notification reports through the delivered set whether the running build is patched, so the
    driver can never mistake variant A for B.
9. **No subagent is used anywhere in this plan.** Owner, 2026-09-17: *"Do everything yourself. Do
   not use any subagents for now."* The plan review the planner brief asks for was performed by the
   planning session itself, reading the plan as its executor (section 5).
10. **The study app is uninstalled at the end, and the phone is left exactly as found.** Planner:
    the final phase clears every delivered study notification, the driver uninstalls the study app,
    and the owner's own Athan, its data, its alarms and its delivered notifications are untouched
    throughout: no step of this plan addresses `com.mugtaba.athan`.

### 2.2 The executor must not decide

STOP, append what you saw to `LOG.md`, and ask the owner the question given, whenever one of these happens:

1. **Any pre-flight failure or anchor count other than 1.** An anchor count other than 1 is NEEDS
   REPLAN: tell the owner "Anchor `<file>` counts `<n>`, so the plan is out of date. Please run the
   planning prompt." Any other pre-flight line starting `PREFLIGHT FAILED`: ask "The pre-flight
   failed: `<line>`. What do I do?"
2. **A splice prints `SPLICE FAILED` or `POD SPLICE FAILED`.** Ask: "The splice printed `<the
   message>`, so the worktree's file no longer holds what the plan's anchors counted. This is NEEDS
   REPLAN: please run the planning prompt."
3. **`build-study.sh` fails: no `** BUILD SUCCEEDED **`, or the provisioning grep prints nothing.**
   Ask: "The study build failed at `<the log's last error lines>`. The owner chose stopping over
   falling back to the real app id. What do I do?" Quote the last 10 lines of the failing build log.
4. **`study.sh` exits 3 (`PHASE 2 LOCKED`).** Ask the owner, in these words: "The phone is locked,
   and one phase needs the screen unlocked with the app in front. Please unlock the iPhone once;
   you do not need to tap anything else. Reply when it is unlocked." Then re-run `study.sh`; it
   resumes from the cursor.
5. **`study.sh` exits 4 (`UNPATCHED TWICE`) or 2 (a wait timeout).** Ask: "The study stopped:
   `<the script's last lines, including the NOTIFY-STUDY tail>`. What do I do?"
6. **The phone disappears from `devicectl list devices`, or an install or launch fails twice.**
   Ask: "The iPhone XS is no longer reachable. Is it plugged in and powered on?"
7. **A log line the plan does not predict appears in the digest** (a phase reporting a count,
   state or error this plan's predictions do not cover, including `SCHEDULE-FAILED` or
   `P4 PROBE {"patched":false,...}` on the first try). Ask: "Phase `<n>` logged `<line>`, which the
   plan does not predict. What do I do?"
8. **The study app's delivered set is not empty after `P5 CLEANED`, or the uninstall fails.** Ask:
   "Cleanup left `<digest lines>`. What do I do?"
9. **Anything that would touch the owner's own app, `releases.json`, the `uat` branch, EAS, or any
   prayer time.** Ask: "Step `<where>` would change `<what>`, which this plan forbids. What do I do?"

## 3. Pre-flight

Copy the saved script and run it:
`cp ai/plans/08-ios-replace-previous-notification/scripts/preflight.sh $TMPDIR/preflight-8.sh && bash $TMPDIR/preflight-8.sh 1`.

It checks the checkout (`/Users/muji/repos/rn.athan.uk` on `uat-2`), the working tree (nothing but
this folder's files and `ai/plans/README.md`), `origin/uat-2` being an ancestor of `uat-2` after a
fetch, the version (printed, never lower than 1.27.204), row 3 being DONE, the six anchors (five in
`app/index.tsx`, one against the `node_modules` copy of `NotificationRecords.swift`), and the tools:
`xcodebuild`, `pymobiledevice3`, the iPhone XS visible to `devicectl`, and `expo-keep-awake` present
in `node_modules`. It notes, without failing, if a study build is already installed.

Expected output:

```text
VERSION <the version uat-2 carries, 1.27.206 or higher>
ANCHOR 1-index-import-listeners.txt OK
ANCHOR 2-index-import-useNotification.txt OK
ANCHOR 3-index-const.txt OK
ANCHOR 4-index-call-listeners.txt OK
ANCHOR 5-index-call-init.txt OK
ANCHOR 6-pod-interruptionlevel.txt OK
PREFLIGHT OK
```

The last line `PREFLIGHT OK` means go on. A line starting `PREFLIGHT NEEDS REPLAN` is NEEDS REPLAN
(section 2.2, item 1). Any other `PREFLIGHT FAILED` line: STOP and ask (section 2.2, item 1).

## 4. Background the executor needs

### 4.1 Code map

Nothing in the repository changes. This table maps what the study touches and reads.

| File | What it does | This plan |
| --- | --- | --- |
| `device/notifications.ts:33-46` | The app's deterministic identifiers, unique per prayer, day and interval | Read only: these are why notifications stack on iOS |
| `hooks/useNotification.ts:11-18` | The app's one `setNotificationHandler`, foreground presentation only | Read only; the study harness carries its own handler in the worktree |
| `app/index.tsx:82-115` | The mount effect: `initializeListeners` at once, `initializeNotifications` 1.5 s later | The worktree splice replaces exactly this with the harness call, so no permission dialog is shown and no real bell is armed |
| `device/listeners.ts:45-50` | The resume path calls `initializeNotifications` again | Why the splice removes `initializeListeners` entirely, not just its first call |
| `shared/notifications.ts:108-123` | `genNotificationContent`: title only, `sound` false for Silent, `interruptionLevel: 'timeSensitive'` | Read only: the study's test notifications use the same shape (title, `sound: false`) |
| `stores/notifications.ts` | The scheduling store, the lock, the sweep | Read only; nothing in it runs in the study build, because the splice removes every path that calls it |
| `ai/plans/08-.../scripts/files/notifyStudy.ts.txt` | The study harness, carried by this plan verbatim | Copied into the worktree as `device/notifyStudy.ts`; never committed |
| `ai/plans/08-.../scripts/splice-*.py` | The three count-asserted worktree patches | Run by `build-study.sh` only |
| `ai/plans/08-.../scripts/build-study.sh` | Worktree setup, both builds | The executor runs it once |
| `ai/plans/08-.../scripts/study.sh` | The run matrix on the phone | The executor runs it, and re-runs it after any designed stop |
| `node_modules/expo-notifications/ios/.../NotificationRecords.swift` | The content builder expo uses when scheduling | Read only here; variant B patches the worktree's Pods copy of it |

### 4.2 The research this plan stands on (planning session, 2026-09-17)

Read from the installed source (`expo-notifications@57.0.18`, verified in `node_modules`) and from
Apple's own pages (fetched 2026-09-17 through the TinyFish Fetch API, Apple's `.md` documentation
endpoints; no search engine, no memory):

| Claim | Source, exact |
| --- | --- |
| Reusing an identifier replaces the previously **scheduled** notification; nothing is said about delivered ones | `developer.apple.com/documentation/usernotifications/unnotificationrequest/identifier`: "If you use the same identifier when scheduling a new notification, the system removes the previously scheduled notification with that identifier and replaces it with the new one." |
| The delivered surface is exactly: read, remove some, remove all; no API replaces delivered content | The `UNUserNotificationCenter` class page (© 2026): `getDeliveredNotifications`, `removeDeliveredNotifications(withIdentifiers:)` ("ignores the identifiers of requests whose notifications are not currently displayed"), `removeAllDeliveredNotifications()` ("does not affect any notification requests that are scheduled, but have not yet been delivered") |
| A notification service extension runs for remote notifications only, and only with `mutable-content: 1` | `UNNotificationServiceExtension`: "When your app receives a remote notification ... `mutable-content` key with the value set to `1`" |
| `threadIdentifier` groups notifications visually | `UNMutableNotificationContent` overview: "a thread identifier for visually grouping related notifications" |
| expo 57.0.18 never applies `threadIdentifier` | `Notifications.types.ts` `NotificationContentInput` (no such field) and `NotificationRecords.swift` `toUNMutableNotificationContent()` (copies title, subtitle, body, launchImageName, badge, userInfo, categoryIdentifier, sound, attachments, interruptionLevel; not threadIdentifier, not targetContentIdentifier) |
| The JS dismiss APIs exist and map one-to-one | `PresentationModule.swift`: `getPresentedNotificationsAsync` → `deliveredNotifications()`, `dismissNotificationAsync` → `removeDeliveredNotifications(withIdentifiers:)`, `dismissAllNotificationsAsync` → `removeAllDeliveredNotifications()` |
| The schedule identifier passes straight through | `SchedulerModule.swift:133-137`: `UNNotificationRequest(identifier: identifier, ...)` |
| Provisional authorization needs no dialog | `Notifications.types.ts` `allowProvisional` → `TriggerRecords.swift:414` `.provisional` → `requestAuthorization(options:)` |
| The phone | iPhone XS (`iPhone11,2`), iOS 18.7.10, `devicectl` paired, Athan 1.26.28 installed; read during planning |

### 4.3 How the study pieces interact

| Event | What happens |
| --- | --- |
| `build-study.sh` | Detached worktree at `uat-2`, `node_modules` symlinked, three splices, the harness copied in, `expo prebuild`, `pod install`, variant A built and copied out, the pod patch, variant B built and copied out |
| Each `study.sh` launch | `devicectl` launches the study app fresh (`--terminate-existing`); the harness requests provisional authorization, logs `RUN {"cursor":N}`, and runs phase N |
| A schedule | A `TIME_INTERVAL` trigger fires by the OS whether the app lives or not; the harness only needs JavaScript at schedule time and, for phase P2, at delivery time |
| The kill between cursors 1 and 2 | `pymobiledevice3 developer dvt kill`: the three scheduled notifications deliver while the app is dead, which the next launch measures |
| The P4 probe | One threaded notification; if the delivered set reports its thread, the build is B and the phase continues; if not, it logs `UNPATCHED`, the cursor stays, the driver installs B and relaunches |
| The cleanup launch | `dismissAllNotificationsAsync`, a final delivered dump, then the driver uninstalls the study app |

### 4.4 Existing tests that cover this code

None change. The repository is untouched; the pre-commit hook runs on the docs commit only, over the
same tree the planning sessions left (4,511 tests, 100% on all four measures at 1.27.205).

### 4.5 Why the obvious approaches are wrong

- **Asking the owner for taps after all:** the owner said *"you do everything"*, and the design
  honors it: the only designed ask is one unlock, and only if the phone happens to be locked at the
  one phase that needs an active app.
- **Building the real permission dialog in and having someone tap Allow:** the study app is
  disposable and provisional authorization exists precisely for no-dialog delivery.
- **Patch the main checkout's `node_modules` for variant B:** the worktree's `node_modules` is a
  symlink to the owner's checkout, so the build script replaces it (per-package symlinks plus one
  real, patched copy of `expo-notifications`) before the variant B build. The main checkout is
  never written.
- **Screenshots as evidence:** without a gesture no tool reaches Notification Center; an image can
  show a banner or a lock screen at best. The delivered-set logs are the evidence; images only
  corroborate.
- **Trusting session 1's reading of Apple's documentation as the answer:** the owner rejected
  exactly that. Every device question gets measured.

## 5. Design

- **Approach.** A throwaway study app on the iPhone XS, carrying a harness this plan supplies
  verbatim, driven phase by phase from the Mac, reading iOS's own answers out of the system log.
  The invariant, one sentence a test can check: after the study, `~/athan-device-sweep/session8/study-digest.txt`
  holds one `NOTIFY-STUDY` record for every step of every phase, and the finding's every device
  claim quotes one of those lines.
- **The spike.** The risky part was built for real during planning, in
  `~/athan-device-sweep/worktrees/plan-8` (removed afterwards): a detached worktree at `fa3337b3`,
  `node_modules` symlinked, `app.json` repointed at `com.mugtaba.athan.experiments`,
  `expo prebuild -p ios --no-install`, `pod install`, and
  `xcodebuild -workspace ios/AthanLab.xcworkspace -scheme AthanLab -configuration Release -destination 'generic/platform=iOS' DEVELOPMENT_TEAM=9V3WAU9Z54 CODE_SIGN_STYLE=Automatic -allowProvisioningUpdates build`.
  Result: `** BUILD SUCCEEDED **`, the product signed with `TeamIdentifier=9V3WAU9Z54`, and its
  embedded profile reading `application-identifier 9V3WAU9Z54.com.mugtaba.athan.experiments`:
  on-the-fly provisioning of the new id works. The plan's build script is the spike's command with
  `-derivedDataPath ios/build` added, so the product lands at a deterministic path.
- **What was deliberately not spiked:** installing and running on the phone, which changes device
  state during planning. The install command, the launch command, the syslog capture and the
  screenshot command were each verified for syntax and availability only. Their behaviours are the
  study's own measurements; every wait is bounded and every unexpected line is a STOP
  (section 2.2).
- **Design review.** None was spawned: the owner barred subagents for these sessions on 2026-09-17
  (decision 9). In their place the planning session reviewed the plan as its executor, against the
  checks `PLANNER-BRIEF.md` section 3 item 11 lists; the review's findings are recorded in
  `LOG.md`'s planning entry.
- **Alternatives rejected:** see section 4.5.

## 6. Steps

- [x] Study run: DONE (section 7; rounds 1 and 2 stopped on harness and cursor bugs, round 3
  completed end to end; `LOG.md` records all three)

There is no code step: nothing merges. The study run is of the `(files)` kind: the executor runs
the scripts this plan carries, compares their output with the predictions in section 7, and changes
nothing else. Its records are section 8, applied as `EXECUTOR-BRIEF.md` section 8 describes, and
its docs commit is the plan's single commit.

## 7. Device study

Run this after the pre-flight, in ONE session. Every command runs from `/Users/muji/repos/rn.athan.uk`.
The owner receives no screenshots and is asked for nothing unless section 2.2 says so.

Safety: no clock change exists on any tool for this phone, and none is needed (every notification
is a seconds-from-now time-interval trigger). The owner's own app is never addressed: every install,
launch, kill and uninstall names `com.mugtaba.athan.experiments`. The study app's own storage is
disposable with it.

### 7.1 Build both variants

1. Run `zsh ai/plans/08-ios-replace-previous-notification/scripts/build-study.sh` in the
   background, with its output to `$TMPDIR/build-study.log`. A build takes 10 to 25 minutes the
   first time (prebuild, pods, one full compile); variant B's rebuild is incremental.
2. Expected, in order: `APPJSON SPLICE OK`, `INDEX SPLICE OK`, the prebuild finishing with
   `✔ Finished prebuild`, pod install ending `Pod installation complete!`, `** BUILD SUCCEEDED **`,
   the provisioning grep printing one profile line naming `com.mugtaba.athan.experiments`,
   `VARIANT A OK: ...`, then the worktree's `node_modules` being rebuilt (per-package symlinks plus
   the real copy), `POD SPLICE OK`, a second `Pod installation complete!` (its log is
   `$OUT/pod-reinstall-variant-b.log`), the same build and profile lines again, `VARIANT B OK: ...`,
   and the final line `STUDY BUILDS OK`. Anything else: section 2.2, item 3.
3. The script leaves the worktree at `~/athan-device-sweep/worktrees/study-8` in place (variant B's
   pod patch lives only there); remove it only at the very end of the session, after the records.

### 7.2 Run the study

1. Run `zsh ai/plans/08-ios-replace-previous-notification/scripts/study.sh` in the background, with
   its output to `$TMPDIR/study.log`. It ends `STUDY RUN DONE`, or exits 2, 3 or 4 as section 2.2
   describes. Expected phase order and per-phase predictions are below; the script itself prints
   `PHASE CURSOR=<n>` before each. Every launch, whatever its phase, first logs a `PERM` line, a
   `RUN` line and possibly `STATE` lines as the app moves between foreground and background; the
   predictions below name only the phase-specific lines, and those repeated lines are expected in
   every launch.
2. **Cursor 0, phase 1: does re-scheduling under a delivered notification's identifier replace
   the delivered one?** Expected log lines, in order: `NOTIFY-STUDY PERM {...}` with
   `"iosStatus":3` (provisional, granted by iOS with no dialog; expo's own `granted`/`status`
   fields map provisional to `false`/`undetermined`, and the study never gates on them),
   `RUN {"cursor":0,...}`, `P1 START {...}`, `SCHEDULED {"identifier":"x1",...}`,
   `P1 PENDING ["x1"]`, `P1-AFTER-FIRST DELIVERED [{"id":"x1","title":"P1 first","thread":""}]`,
   a second `SCHEDULED {"identifier":"x1",...}` with `"title":"P1 second"`,
   `P1-AFTER-SECOND PENDING ["x1"]` (the first copy has already delivered, so the one pending
   request is the second), and then the answer: `P1-FINAL DELIVERED [...]`. **Predicted two
   entries; measured ONE, `[{"id":"x1","title":"P1 second","thread":""}]`, fifty-nine times
   (58 in a stuck-cursor loop that ran the phase repeatedly, 1 in the clean run): iOS replaces
   the delivered notification when its identifier is scheduled again.** The dumps do not
   distinguish whether the delivered copy flips at add-time or when the new one fires; the net
   behaviour, only the newest showing, is what they prove. A `SCHEDULE-FAILED` line or any other
   delivered count is section 2.2, item 7.
3. **Cursor 1, phase 3a: schedule three, then die.** Expected: `RUN {"cursor":1,...}`, `P3A START`,
   three `SCHEDULED` lines (x3a, x3b, x3c, firing 12, 20 and 28 seconds after scheduling),
   `P3A DONE`. The script then kills the app (`KILLED pid=<n>`) within a few seconds of that line,
   comfortably before the first fire, and waits out all three deliveries with the app dead.
4. **Cursor 2, phase 3b: what delivered while dead, and one call clears it.** Expected:
   `RUN {"cursor":2,...}`, `P3B START`, `P3-BEFORE DELIVERED` holding FOUR entries — x3a, x3b
   and x3c delivered with the app killed between launches, plus phase 1's leftover x1 (the
   original prediction of three forgot that nothing clears x1 after phase 1; corrected in
   execution) — then `P3 DISMISSED-ALL` and `P3-AFTER DELIVERED []` (one call, empty tray),
   `P3 DONE`. Any other count is section 2.2, item 7.
5. **Cursor 3, phase 4: thread grouping.** The script installs variant B as phase 3 completes, so
   this launch runs it directly. Expected: `RUN {"cursor":3,...}`, `P4 START {...}`, `SCHEDULED
   {"identifier":"x4p",...,"thread":"athan-study"}`, `P4 PROBE {"patched":true,...}` (the probe's
   delivered entry carries the thread: the two-line pod patch reaches the system's content), three
   more `SCHEDULED` lines, and `P4-FINAL DELIVERED` holding four entries, every one with
   `"thread":"athan-study"` (the probe plus three). A second `RUN {"cursor":3,...}` line with a
   `P4 UNPATCHED` between them can appear only if the script was re-run with variant A somehow
   still installed; the script then reinstalls variant B and retries once, and a second `UNPATCHED`
   is exit 4 (section 2.2, item 5).
6. **Cursor 4, phase 2: the foreground handler clears earlier delivered ones.** Expected:
   `RUN {"cursor":4,...}`, `P2 START {"state":"active"}`, three `SCHEDULED` lines (x2a, x2b, x2c),
   and for each delivery one `P2 HANDLER {...}` and one `P2 CLEARED {...}` line. The first
   handler run finds phase 4's four delivered notifications beside the incoming one
   (`"deliveredBefore":4` or `5`), and clears them (`"cleared":4` or `5`); the second and third
   runs find `1` or `2` and clear `1` (or `2` if the incoming one was already listed). The
   `"incomingPresent"` boolean is a measurement, not a prediction: whether iOS lists the arriving
   notification as delivered before the handler returns is exactly what it exists to record. The
   phase's answer is the last line: `P2-FINAL DELIVERED [{"id":"x2c",...}]`: one notification
   left, the newest.
   `P2 START {"state":"background"}` followed by `P2 LOCKED` is the designed stop: the script exits
   3 and the executor asks section 2.2 item 4's question, then re-runs the script; the cursor
   retries the phase on the next launch. The `state` value in every phase's `START` line is a
   measurement the plan does not predict; only phase 2 acts on it.
7. **Cursor 5, cleanup.** Expected: `RUN {"cursor":5,...}`, `P5 START`, `P5 DISMISSED-ALL`,
   `P5-FINAL DELIVERED []`, `P5 CLEANED`, then `UNINSTALLED com.mugtaba.athan.experiments` and
   `STUDY RUN DONE`.
8. Collect the evidence into `~/athan-device-sweep/session8/`: `study-digest.txt` (written by the
   script), `study-syslog.txt` (the full capture), the screenshots `00-baseline.png` to
   `05-after-p2.png` (corroboration; nobody but the audit reads them), both build logs, and
   `syslog-stderr.txt`.

### 7.3 After the study

1. Read `~/athan-device-sweep/session8/study-digest.txt` in full and compare every line against
   section 7.2's predictions. Any line the predictions do not cover: section 2.2, item 7.
2. Verify the phone is as found: `xcrun devicectl device info apps --device 00008020-0015585C22D2002E`
   lists no `com.mugtaba.athan.experiments`, and the owner's Athan 1.26.28 is still installed,
   untouched.
3. Remove the build worktree: `git worktree remove --force ~/athan-device-sweep/worktrees/study-8`.

The phone is left exactly as the study found it: the owner's app, data, alarms and notifications
untouched, nothing of the study installed.

## 8. Records

### 8.1 Findings text

Append this to the end of `ai/features/uat-2/AUDIT-FINDINGS.md`, with `<DATE>` (17 September
2026), `<LOCKED_ASKED>` (no: the owner unlocked once, unprompted, before the run) and `<TESTS>`
(the last hook `Tests:` line, 4511 passed, 4511 total) filled in; every other value below is the
measured one, quoted from `LOG.md` and the digest:

```markdown
# Session 8 of the queue: what iOS can and cannot do, <DATE>

The brief is `ai/prompts/ios-replace-previous-notification.md`, planned in
`ai/plans/08-ios-replace-previous-notification/PLAN.md` and executed with no subagents (owner,
2026-09-17: the session does everything itself). The study ran on the iPhone XS
(`00008020-0015585C22D2002E`, iOS 18.7.10) as a throwaway app, `com.mugtaba.athan.experiments`:
the owner's installed Athan was never addressed by any step. Driven entirely from the Mac
(`xcrun devicectl`, `pymobiledevice3`): provisional authorization meant no permission dialog, so
the whole study needed no tap from anyone (owner, 2026-09-17: "you do everything"; one unlock was
asked for: <LOCKED_ASKED>). Nothing was built, nothing merged: the choice is the owner's.

## The documented facts, read before anything ran (17 September 2026)

- Apple, on `UNNotificationRequest.identifier`: "If you use the same identifier when scheduling a
  new notification, the system removes the previously scheduled notification with that identifier
  and replaces it with the new one." Scheduled: delivered notifications are not mentioned.
- `UNUserNotificationCenter`'s entire delivered surface is `getDeliveredNotifications`,
  `removeDeliveredNotifications(withIdentifiers:)` and `removeAllDeliveredNotifications()`. No API
  replaces a delivered notification's content.
- A notification service extension runs for remote notifications only, and only with
  `mutable-content: 1`. A local notification never reaches it: nothing of the app runs at a local
  notification's delivery.
- `threadIdentifier` groups notifications visually (Apple, `UNMutableNotificationContent`), and
  expo-notifications 57.0.18 parses the field off the JavaScript content but never applies it to
  the system content: `NotificationContentInput` has no such field, and
  `toUNMutableNotificationContent()` copies neither it nor `targetContentIdentifier`.
- expo-notifications 57.0.18 exposes `getPresentedNotificationsAsync`, `dismissNotificationAsync`
  and `dismissAllNotificationsAsync` to JavaScript, each mapped one-to-one onto the Apple calls
  above.

## What the phone measured

- **Reusing a DELIVERED notification's identifier replaces it.** After `x1` "P1 first" had
  delivered, scheduling `x1` "P1 second" left the delivered set holding exactly
  `[{"id":"x1","title":"P1 second","thread":""}]` (P1-FINAL; sixty consistent observations).
  Apple's documentation promises this only for "previously scheduled" requests; the phone does
  it for delivered ones too. The dumps do not distinguish add-time from fire-time replacement;
  only the newest shows, which is what matters. NOTE for the app: one shared identifier for
  everything is NOT therefore viable, because on iOS the identifier is also the PENDING key —
  a shared id would leave the app able to hold one pending notification at a time, and the
  2-day rolling buffer needs one per prayer and day.
- **Delivery needs no app, and one call clears everything.** Three notifications scheduled and
  then delivered with the app killed between launches: `P3-BEFORE` held them beside phase 1's
  leftover (four entries). One `dismissAllNotificationsAsync` on the next launch:
  `P3-AFTER DELIVERED []`. Clearing on every app run works, and costs only that runs are the
  only moments it happens.
- **The foreground handler can clear the earlier ones.** With the app active, each arriving
  notification's handler dismissed every earlier delivered one (x2a cleared 4 — phase 4's
  leftovers — then x2b cleared 1, x2c cleared 1; `incomingPresent:false` each time: the arriving
  notification is NOT yet in the delivered set when the handler runs). After three deliveries,
  one notification remained (P2-FINAL: exactly `x2c`, the newest). This is the only moment iOS
  gives app code at delivery, and it exists only while the app is foregrounded.
- **Grouping by thread works, behind a two-line native change.** The study's variant B patched
  the worktree's private copy of expo-notifications to copy `threadIdentifier` onto the system
  content; the delivered set reported `"thread":"athan-study"` on every notification
  (`P4 PROBE {"patched":true}`, P4-FINAL: four threaded entries). Visual grouping is Apple's
  documented behaviour of that field. Provisional delivery is quiet (no banner, no sound), which
  none of the measurements above depends on.

## The answer to session 1's question

iOS DOES replace a delivered notification, but only when the app itself schedules again under
the same identifier: there is no delivery-time hook for local notifications (the service
extension is remote-only), so the system cannot swap the old one out as each new notification
arrives on its own. What the app CAN do, all measured: clear delivered notifications with one
call whenever it runs; clear the earlier ones from the foreground handler the instant a new one
arrives while the app is open; and group everything into one stack with a two-line native
change, so the user clears the app's notifications in one swipe.

## The options for the owner, nothing built

1. **Do nothing.** The pile stays until cleared by hand.
2. **Clear on every app run** (launch, return to foreground, background refresh): no native
   change; notifications still stack between runs.
3. **Foreground handler plus clear on every run**: still no native change; while the app is open
   the newest is the only one showing; between runs they still stack.
4. **Thread grouping** (the two-line pod patch, via patch-package or a small local module):
   every notification stays inside one grouped stack, cleared with one swipe; not
   newest-only, but no pile. Combineable with 2 or 3.

## State left behind

The phone exactly as found: the study app uninstalled, the owner's Athan 1.26.28 untouched
throughout. The evidence is in `~/athan-device-sweep/session8/` (digest, full syslog, build logs,
screenshots as corroboration). `uat-2` carries this note and nothing else new; the last suite run
reported `<TESTS>`.
```

The findings text above already carries the measured values, corrected by the planning session
(the executor's two divergences from the original predictions, phase 1's single entry and phase
3's four, are folded in, with the corrections marked where they happened).

### 8.2 Table rows

- **`ai/plans/README.md`:** at session start the executor sets row 4 to `IN PROGRESS`
  (`EXECUTOR-BRIEF.md` section 1, item 5), and at the end to `EXECUTED`; both changes land in the
  session's single docs commit, this plan having no other.
- **`ai/prompts/README.md`, for the auditor to apply on PASS:** replace row 8's last cell `queued`
  with `**DONE** <DATE>: iOS studied on the XS with a throwaway app and no owner hands: no API
  replaces a delivered notification (identifier reuse measured), the foreground handler can clear
  earlier ones, one call clears everything on any app run, and grouping needs a two-line native
  change; four options with costs recorded in AUDIT-FINDINGS for the owner to choose from, nothing
  built`.

### 8.3 Docs commit

The `executed` docs commit (`EXECUTOR-BRIEF.md` section 4b) uses the next patch version after
`uat-2`'s `package.json`, printed by
`node -p "require('./package.json').version.split('.').map((v,i)=>i===2?+v+1:v).join('.')"` and
set in all three files as that brief's step 6 describes. The message, with `<VERSION>` that value:

```text
<VERSION> - docs(plans): session 8 executed: iOS notification study run on the XS, finding recorded
```

Its files, by name: `ai/plans/README.md`, this folder's `PLAN.md` and `LOG.md`,
`ai/features/uat-2/AUDIT-FINDINGS.md`, `app.json`, `package.json`.

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session
pushes `uat-2` after a PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

### 10.1 Symptoms

The general table is `EXECUTOR-BRIEF.md` section 7. This session's own:

| Symptom | Cause | Action |
| --- | --- | --- |
| A splice prints `SPLICE FAILED` | `app.json` or `app/index.tsx` drifted from the anchors | Section 2.2, item 2 |
| `xcodebuild` fails with a signing or provisioning error | The team cannot provision the id (it could on 2026-09-17) | Section 2.2, item 3; never fall back to the owner's app id |
| `pod install` fails | CocoaPods repo or network | Re-run `build-study.sh` once from the start; a second failure is section 2.2, item 3 |
| `study.sh` prints `WAIT TIMEOUT` and a `NOTIFY-STUDY` tail | A phase stalled (most likely the phone locked mid-study, freezing JavaScript) | Section 2.2, item 5; after any answer, re-running `study.sh` resumes from the cursor |
| `study.sh` exits 3 | The foreground phase found the phone locked | Section 2.2, item 4: the one unlock ask, then re-run |
| `study.sh` exits 4 | Variant B's patch did not reach the build twice | Section 2.2, item 5 |
| `devicectl` install or launch fails | Phone unreachable or rebooting | Section 2.2, item 6 |
| A digest line the predictions do not cover | iOS did something this plan does not predict | Section 2.2, item 7: that is a finding, not an error to hide |
| The hook fails only on `audioMatrix.test.ts` timing out | The machine is busy | `EXECUTOR-BRIEF.md` section 3: wait for the load and commit again, up to 3 times |

### 10.2 Anticipated review fixes

None is given word for word: the executor changes no code, so there is no code to fix. A reviewer
finding on the docs commit is handled by `EXECUTOR-BRIEF.md` section 4, item 8's three conditions
and nothing else.

### 10.3 Stopping part-way

The repository never holds study work: the worktree and the study app are outside it. Mid-study,
STOP means: leave everything as it stands (the phone holds whatever phase it reached; the cursor
persists), and record in `LOG.md` which section 7 item the run reached and what `study.sh` last
printed. A successor re-runs the pre-flight and `study.sh`, which resumes from the cursor. Only
after the records: remove `~/athan-device-sweep/worktrees/study-8` and, if the study completed but
records did not land, first `xcrun devicectl device uninstall app --device 00008020-0015585C22D2002E
com.mugtaba.athan.experiments`.

## 11. Subagents in this plan

None, at any point. The owner instructed on 2026-09-17: *"Do everything yourself. Do not use any
subagents for now."* (`ai/plans/08-ios-replace-previous-notification/LOG.md` records it.) The
executor session therefore spawns no Code Reviewer; its docs commit is checked by the audit
session, which reads it as `AUDITOR-BRIEF.md` section 3 item 1's reread of every planning and
docs commit.

## 12. Report to the owner

The final message of the execution session:

```text
🤖  Model: GLM 5.3 (execution session)
Time: <output of date '+%H:%M:%S %d.%m.%Y'>

Session 8 is executed and waits for its audit. No code changed and nothing merged; a throwaway
study app on the iPhone XS measured what iOS actually does, driven entirely from this Mac:
- No API replaces a delivered notification: reusing its identifier leaves both in the tray
  (<P1_FINAL>).
- Notifications deliver with the app dead (<P3_BEFORE>), and one call on the next launch clears
  everything (<P3_AFTER>).
- The foreground handler cleared every earlier one as each new notification arrived: after three
  deliveries, one remained (<P2_FINAL>).
- Thread grouping reached the system through a two-line patch (<P4_FINAL>).
The finding records all of it with four options and their costs for you to choose from. Your own
app and data on the phone were never touched, and the study app is gone.

<the progress table, in EXECUTOR-BRIEF.md section 6's format>

Next, the audit. Then your choice: which behaviour, if any, gets built.
```
