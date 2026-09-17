# Plan: Session 7. Android: each notification replaces the one before it

| Field | Value |
| --- | --- |
| Brief | `ai/prompts/replace-previous-notification.md` |
| Planned at | `7c800915` (version 1.27.201), 2026-09-17 |
| Planned by | Planning session on 2026-09-17, GLM 5.3 (replan; first plan `fc2dd139`, amended `b6e2df27`, both superseded by the owner's 13:20 replan order) |
| Needs first | nothing |
| Steps | 1, DONE and merged (`45754e60`, 1.27.198); then the device proof, section 7, re-baselined and exact |
| Device | OnePlus 3T: the installed 1.27.198 mock build is re-baselined first (one purge drive, three bells disarmed), then mock builds of `aaabb12a` and of `uat-2` head, then the final Asr-next mock build |
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

The code has been built, reviewed, merged and unit-proven since 1.27.198. What the owner ordered at
13:20 on 2026-09-17 is the whole task replanned from scratch and executed once, properly
(`LOG.md`'s 13:25 entry): so this replan keeps the merged step and rebuilds everything around it, and
its device proof runs start to finish in one session, from a baseline the plan itself creates, with
every alarm count, post count and tray reading predicted exactly. A question the executor has to ask
mid-proof is a defect in this plan (owner, 2026-09-16); the first proof's questions, and the readings
that answered them, are folded into the predictions below.

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
- The 13:20 replan order, 2026-09-17 (LOG.md's 13:25 entry): "You seem to be asking me a lot of
  questions. Perhaps we should replan this entire task and execute it properly like stop all the
  sessions, replan everything, execute it, etc. Like do it from scratch again."

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
8. **The repository's `opencode.json` sets `"experimental": {"subagent_depth": 2}`.** Owner, 2026-09-17,
   recorded in `ai/prompts/README.md`. Done while planning the first version of this plan.
9. **Posts are counted from the system's `notification_enqueue` events, and the tray is asserted as
   exactly one shared-tag notification after each fire.** Owner, 12:34 on 2026-09-17, after the first
   proof found this device drops the `NotificationService: enqueueNotificationInternal` DEBUG lines while
   the events buffer logs every enqueue, and that the update itself clears the stacked pile. Recorded in
   `ai/prompts/README.md`; `scripts/device/posts.py` already reads the events buffer through a two-sided
   device-clock window.
10. **The whole task was replanned from scratch and is executed once.** Owner, 13:20 on 2026-09-17,
    quoted in section 1; recorded in `LOG.md`'s 13:25 entry and in `ai/prompts/README.md`. Step 1 stays
    merged and DONE (its code is reviewed, merged and unit-proven, and unmerging merged work is not a
    thing this programme does); everything the owner ordered redone, the single clean execution, is the
    device proof, rebuilt in section 7 from a baseline this plan creates.
11. **The proof creates its own baseline before it starts: every armed alarm is purged with one bounded
    forward clock drive, and every stored bell on the mock storage is turned Off.** Planner, under the
    owner's 2026-09-17 delegation of every planning question. The first proof stopped four times because
    the phone held state no prediction covered: a stored Magrib preference (owner disarmed it, 12:16),
    real-date orphan alarms from re-runs (13:03, 13:12), and the final mock's own rolling buffer
    (13:30). A proof that begins from zero armed alarms and every bell Off has no such state, so every
    later dump and count is exact. Purging means letting the armed alarms fire under the shared tag
    (harmless: the installed build posts them all under `athan-notification`, and the tray stays at one);
    disarming touches only `athan-storage-dev`, the mock storage, which the owner's 12:16 ruling already
    licensed; the owner's real data, `athan-storage`, is never read or written by a mock build.
12. **The stacking build the update path installs is pinned to `aaabb12a26b0a0d23206263074eaf4d4d73cb9c4`
    (1.27.197), the last commit without the plugin.** Planner: the first plan called it `uat-2^`, which
    was only true while no docs commit followed the merge. The replacing build is `uat-2` head at
    execution time, `<FINAL>`; every commit after `aaabb12a` carries the plugin, and the artifact check
    in 7.1 proves the built APK holds it.
13. **The proof ends with the phone unlocked, Athan open and stay-awake on.** Owner, 2026-09-16 standing
    rule ("I have purposefully left the screen unlocked, and the app is open and stay awake is on... This
    should be the state always"), recorded in `ai/prompts/README.md`. The first plan's final
    `svc power stayon false` contradicted it; this replan keeps `stayon usb` set and Athan foreground.
14. **The `Reality Checker` runs with isolation `worktree` and runs no git command at all.** Planner: the
    first proof's checker was spawned without isolation and its `git checkout --detach` in the shared
    checkout wiped the working tree's records (LOG.md's 13:41 correction, item 3). Its rewritten prompt
    in section 11 reads everything by absolute path and forbids git.

### 2.2 The executor must not decide

STOP, append what you saw to `LOG.md`, and ask the owner the question given, whenever one of these happens:

1. **An anchor count other than 1**, in the pre-flight. This is NEEDS REPLAN (`EXECUTOR-BRIEF.md`
   section 1, item 4). Tell the owner: "Anchor `<id>` counts `<n>` in `<file>`, so the plan is out of
   date. Please run the planning prompt."
2. **The pre-flight prints any line it does not predict, or a `PREFLIGHT FAILED` line.** Ask: "The
   pre-flight failed: `<line>`. What do I do?"
3. **The phone's installed version at 7.0 is not `1.27.198`.** Ask: "The 3T runs `versionName=<value>`,
   not 1.27.198, so it is not the build this plan baselined. What do I do?"
4. **An alarm dump at the item that reads it holds any tag, count or armed instant the item does not
   predict.** Ask: "The alarm dump at section 7 `<item>` holds `<line>`. What do I do?" A clock drive
   fires every armed alarm it passes, so this check comes before every drive.
5. **A `tray.py` reading after a fire is not exactly `TRAY 1` with exactly one
   `NOTIFY tag=athan-notification` line, or the purge's tray is not `TRAY 1`.** Ask: "After the fire in
   section 7 `<item>`, the tray holds `<tray.py output>`. What do I do?"
6. **A `posts.py` count is not the number its item predicts.** Ask: "The fire in section 7 `<item>`
   produced `<posts.py first lines>`. What do I do?"
7. **A `read` shows a sheet on the wrong prayer, or a stored state other than the one the item
   predicts.** Ask: "The sheet at section 7 `<item>` showed `<what the read shows>`, not
   `<the prediction>`. What do I do?" Never tap around a wrong sheet.
8. **The Fajr reminder stepper does not read 20 minutes.** Ask: "Fajr's reminder stepper reads
   `<value>`, not 20 minutes, so the stored interval changed. What do I do?"
9. **An armed instant later than 2026-09-20 00:00 appears in the baseline inventory.** Ask: "The phone
   holds an alarm at `<instant>`, past the purge bound this plan gives. What do I do?"
10. **Another session is driving the phone: a `ps` listing holds an `opencode` process this session does
    not own, or a file under `~/athan-device-sweep/session5/mockcheck/` changes that this session did not
    write.** Stand down at once, change nothing, and ask: "Another session is driving the 3T. Which one
    owns the proof?"
11. **The phone is locked, off the cable, or adb hangs twice.** Ask: "Please unlock the OnePlus 3T, keep it
    on the cable and on its home screen, and reply when that is done."
12. **The `vision` subagent (GLM 5.3 Flash) gives an answer the plan does not expect.** Ask: "vision read
    `<file>` as `<answer>`; the plan expects `<expected>`. What do I do?"
13. **A Code Reviewer (GLM 5.3) finding that section 10 does not answer word for word.** Ask: "The
    reviewer asks: `<finding in its words>`. The plan gives no fix for it. Do you want it applied (the
    plan is then refreshed first), or shall I merge without it?"
14. **Anything that would touch visuals, a prayer time, `releases.json`, the `uat` branch or EAS.** Ask:
    "Step `<where>` would change `<what>`, which this plan forbids. What do I do?"

## 3. Pre-flight

Copy the saved script and run it: `cp ai/plans/07-replace-previous-notification/scripts/preflight.sh
$TMPDIR/preflight-7.sh && bash $TMPDIR/preflight-7.sh <k>`. Only `<k>` = 2 can occur: step 1 is DONE, so
the first item of section 6's checklist not ticked is the device proof.

The script runs on a tree the planning sessions left committed: this plan folder, `ai/plans/README.md`
and `ai/prompts/README.md` are all on `uat-2` before execution starts, so the working tree holds nothing
but the three plan files an execution session may change. If `git status --porcelain` lists any of the
planning session's own outputs, the planning commit is missing: STOP and ask "The plan folder or the
READMEs are uncommitted, so the planning session never finished. Please run the planning prompt."

The script is saved as `ai/plans/07-replace-previous-notification/scripts/preflight.sh`. It checks the
checkout, the branch, the tree, `origin/uat-2`, the version (never lower than 1.27.201), "Needs first",
step 1's work being present (the plugin file and its `app.json` line), the fixed-days mock's keying on
the three dates the proof drives to, the device scripts, jest, node, python3, perl,
`android/app/build.gradle` and `aapt`. Expected output:

```text
VERSION <the version uat-2 carries, 1.27.201 or higher>
NEEDS FIRST nothing
STEP1 PRESENT
MOCK KEYED
PREFLIGHT OK
```

- The last line is `PREFLIGHT OK`: go on.
- A line starting `PREFLIGHT NEEDS REPLAN`: NEEDS REPLAN (section 2.2, item 1).
- A line starting `PREFLIGHT FAILED`: STOP and ask "The pre-flight failed: `<line>`. What do I do?".

The phone is not checked here; section 7 checks it.

## 4. Background the executor needs

### 4.1 Code map

The code has not changed since step 1 merged; this table is the map of what runs, not a change list.

| File | What it does | This plan |
| --- | --- | --- |
| `plugins/replacePreviousNotification.js` | The config plugin, merged at 1.27.198: manifest edits plus the two Kotlin sources, run at every prebuild | Present; 7.1 proves the built artifact carries it |
| `plugins/__tests__/replacePreviousNotification.test.ts` | The suite pinning the plugin and the upstream it rides on | Present; runs in every hook |
| `app.json` | The plugins array, holding the plugin line since step 1 | Read only |
| `device/notifications.ts`, `stores/notifications.ts`, `shared/notifications.ts` | Identifiers, scheduling, the lock, channels, the sweep | Read only: nothing changes |
| `stores/notifications.ts:624-633` | `setPrayerAlertType`: turning a row's at-time Off also sets its reminder Off | Why one `Off` tap disarms a whole row in 7.0 |
| `stores/notifications.ts:757-761` | The scheduler skips any prayer whose instant has passed | Why a row On can never arm only past instants |
| `shared/notifications.ts:238-249` | The two-list-day rolling window, one extra day for Midnight and Last Third | Where every window count below comes from |
| `stores/notifications.ts:1375-1417` | The post-reschedule sweep: cancels OS entries beyond the records, and refuses to cancel anything when there are no records at all; its own comment names the all-off case: "When the user genuinely turns every alert off the per-prayer paths have already cancelled the OS entries" | Why 7.0's disarm ends at zero armed alarms |
| `mocks/simple.ts` | The Asr-next mock: today's six rows seeded from each download (Asr the first whole minute 60 to 119 seconds ahead; Fajr, Sunrise, Dhuhr before it, Magrib, Isha after it), and ten fixed days ahead whose day1 row is Fajr 04:03, Asr 16:58 | 7.5's predictions |
| `node_modules/expo-notifications/android/...` | The posting path step 1 overrides; unchanged | Read only |

What the platform does, read from the installed source and verified on the 3T across the first proof:

- Every post, from every path, funnels through `ExpoPresentationDelegate.presentNotification`, the only
  `NotificationManagerCompat.notify` in the library; the subclass rebuilds the request under the shared
  tag and calls the parent, so scheduling, cancelling and the stored request keep the app's identifiers.
- Alarms are PendingIntents whose explicit component is the designated receiver. After an update installs
  this plan's build, an old alarm whose PendingIntent names expo's removed receiver delivers nothing;
  `MY_PACKAGE_REPLACED` reaches the new receiver, whose inherited `onSetupScheduledNotifications` re-arms
  every still-future stored request under the new receiver, and the app's first cold launch reschedules
  everything again. An old alarm that a later cancel cannot reach fires once as a no-op. Requests whose
  date has passed are dropped by the re-arm, not re-armed (all four behaviours measured in LOG.md's
  13:03 final run).
- Android cancels an app's posted notifications when its package is replaced: both installs of the first
  proof moved the stacked pile into `dumpsys notification`'s `mArchive` (LOG.md, 12:31 and 12:33).
- This device drops the `NotificationService: enqueueNotificationInternal` DEBUG lines from its buffers
  but logs every `notification_enqueue` event, and the events buffer survives `logcat -c`; the `Muting
  recently noisy` system line appears for same-second pairs and not for single posts (LOG.md, 12:33 and
  the restored 13:45 record).
- A forward clock jump fires every armed alarm it passes, each posting once under the shared tag
  (LOG.md's 12:11, 12:36 and 13:22 auto-returns: five posts inside 100ms left the tray at one).

### 4.2 Anchors

One code anchor exists, step 1's, saved under `scripts/anchors/` and listed in `anchors/manifest.txt`:

| Anchor | File | What it holds | Status |
| --- | --- | --- | --- |
| `1-1` | `app.json` | the two existing local plugin lines, `gradleJvmMemory` and `portraitOnlyIpad`, which step 1's line follows | counted 1 at `7c800915`; step 1 is DONE, so no step's part 0 reads it again, and the pre-flight checks step 1's presence by the plugin line itself |

The device proof anchors no code. Its fixed points are the tap coordinates and the mock's keyed days,
both pinned in the pre-flight, and every prediction in section 7 cites the reading that established it.

### 4.3 How the pieces interact

| Event | What happens |
| --- | --- |
| 7.0's purge drive | A forward jump past every armed instant fires each once under the shared tag; the tray ends at one notification; `devcheck.py auto` returns the real clock. Nothing re-arms: a notification-event broadcast only presents, it never reschedules |
| 7.0's disarm commits | Each `Off` tap closes a sheet whose commit reschedules that row's two list days; with the row Off nothing is armed and its stale records are cancelled; the final sweep finds an OS emptied by the per-prayer paths |
| `npx expo prebuild` inside both build scripts | The plugin writes both Kotlin files and both manifest nodes, idempotently |
| An alarm fires, app killed | The app's receiver posts under `athan-notification`, replacing whatever showed |
| `MY_PACKAGE_REPLACED`, boot | The app's receiver restores the stored requests under its own class; the update's package replace has already cancelled every posted notification |
| A cancel | New PendingIntents name the app's receiver and match only alarms it armed; an old-receiver double cannot be matched and dies by firing once as a no-op |

### 4.4 Existing tests that cover this code

Step 1's suite, `plugins/__tests__/replacePreviousNotification.test.ts`, runs unchanged in every hook,
along with `shared/__tests__/config.test.ts`, `configBuildSwitches.test.ts`, `flags.test.ts`,
`device/__tests__/notifications.test.ts` and `stores/__tests__/notifications*.test.ts`. The device proof
changes no code and no test.

### 4.5 Why the obvious simple fixes are wrong

- **Running the proof from whatever state the phone happens to hold:** the first proof tried that and
  stopped four times on state no prediction covered (the stored Magrib bell, re-run orphans, the final
  mock's own buffer). The baseline phase costs ten minutes and removes the entire class.
- **`pm clear` instead of the sheet disarms:** it wipes the whole app-data directory, which holds the
  owner's real `athan-storage` beside the mock `athan-storage-dev`. Forbidden
  (`EXECUTOR-BRIEF.md` section 2).
- **Clearing the old pile on update with code:** the owner explicitly declined the extra work (decision
  1), and Android's package-replace cancellation clears the pile without any code.
- **Keeping expo's receiver and adding ours:** `findDesignatedBroadcastReceiver` takes the first match,
  so posts would sometimes reach the stacking delegate.

### 4.6 The phone the proof starts from

Read by the planning session at 13:54 on 2026-09-17 and re-derived by the executor at 7.0: the 3T runs
the final Asr-next mock build of `45754e60` (`versionName=1.27.198`, installed 13:26), real clock,
`auto_time` 1, and holds exactly four app alarms (2026-09-18 03:43 twice, 04:03, 16:58) beside the
year-2036 WorkManager alarm, which is the mock's own two-list-day buffer for the three bells the first
proof left stored: Asr silent, Fajr Sound with its 20-minute reminder at Sound, Suhoor Sound, every
other row Off, Fajr's reminder interval stored at 20. The baseline phase does not trust this snapshot:
7.0 inventories the alarms and the three bells live, purges and disarms whatever is there, and proves
the zero with a dump. Anything the inventory shows outside section 7's predictions is a STOP, not an
adaptation.

## 5. Design

- **Approach.** The code is merged (step 1). This plan's remaining work is one device proof in one
  session: create a zero baseline (purge drive, disarm three bells, dump-prove zero), then re-run the
  four phases of the proof (the artifact, the update path, the same-instant pair and the channel
  crossing, the final mock) with every count exact.
- **Invariant, one sentence a test can check:** every notification the app posts on Android is posted
  under exactly the tag `athan-notification` with id 0, so after any number of fires the tray holds
  exactly one notification of the app's. The Jest suite (merged) pins the tag, the classes and the
  manifest surgery; the device proof pins the tray and the posts.
- **Where every exact prediction comes from.** Each number in section 7 was measured by the first
  proof's final run (LOG.md, 12:44 to 13:30, and the restored 13:45 record) with exactly two
  contaminants that the baseline phase removes: the two real-date orphan alarms (which turned
  `OLD_ALARMS` 2 into 4 and `PAIR_ALARMS` 9 into 11) and the final mock's surprise (which the corrected
  7.5 now predicts from `mocks/simple.ts`). The zero-alarm end state of the disarm is pinned by the
  sweep's own comment at `stores/notifications.ts:1389-1396`.
- **Alternatives rejected:** see section 4.5.
- **Concurrency and update trace:** section 4.3. The single-driver rule (section 2.2, item 10) exists
  because two execution sessions shared this phone on 2026-09-17 and corrupted each other's phases
  (LOG.md, 12:07 and 12:36).
- **Design review.** A Software Architect subagent (GLM 5.3) reviewed the first plan's design on
  2026-09-17 and called it sound; its findings are folded into decisions 2, 3 and 6 and into 7.1. This
  replan changes no code and no app behaviour, so its design check is the plan review itself
  (section 11's table): a Code Reviewer (GLM 5.3) read the rewritten proof as the executor will and
  attacked every prediction, command and count against the code and the LOG's readings; what it found
  is recorded in `LOG.md`'s replan entry.
- **Spike.** The risky parts of this proof were run for real before being written down: not in a scratch
  worktree, because nothing here builds code, but in the first proof's final run, whose readings
  (`POSTS 1` at the update path, `POSTS 2`/`MUTED 1`/`TRAY 1` at the pair, `POSTS 1` at the crossing,
  `TRAY 1` after four fires, `AUTO_FIRES` 5, the four tomorrow-instants of the final mock) are quoted
  as the expected values below. The purge drive's mechanics are the three measured auto-returns. The
  one claim no run has yet demonstrated end to end, the all-bells-off dump reading zero, is proved from
  the sweep's code and is the baseline's own verify step, with a STOP behind it.

## 6. Steps

- [x] Step 1: DONE in 45754e6094c5e7d1724fdb24ff97b9e18f3c47cb (specified; `steps/1-shared-tag-plugin.md`)
- [ ] Device proof: section 7 (specified)

The step is written out in full in `ai/plans/07-replace-previous-notification/steps/1-shared-tag-plugin.md`
and is finished; nothing in it runs again. The device proof starts from a clean tree on `uat-2` and runs
in one session, start to end.

## 7. Device proof

Run this after the pre-flight, in ONE session, start to end. Every command runs from
`/Users/muji/repos/rn.athan.uk`. The owner receives no screenshots: only the `vision` subagent
(GLM 5.3 Flash) reads them.

Measured while planning and the first proof, and used below: the bell column is `x=970`, rows 150
pixels apart on both pages (Fajr 674, Sunrise 824, Dhuhr 974, Asr 1124, Magrib 1274, Isha 1424 on
Standard; Midnight 674, Last Third 824, Suhoor 974, Duha 1124, Istijaba 1274 on Extras, Friday only),
verified live on the 3T for Fajr, Asr, Magrib, Isha, Midnight, Last Third and Suhoor; the alert sheet's
Athan options sit at Off (250,1030), Silent (540,1030), Sound (831,1030); the Reminder switch at
(926,1266); the reminder's Sound option at (831,1476); the interval stepper's plus at (924,1614); the
Extras page swipe is `input swipe 900 300 150 300 300`. Every tap is verified by the next `read`, which
works while a sheet is open, so a wrong coordinate is caught, never guessed around.

### 7.0 Preparation, baseline purge and disarm

1. Run `date '+%H:%M'` and write the time in `LOG.md` as this session's start. If the time is 23:00 or
   later, stop and continue after 00:15 (`EXECUTOR-BRIEF.md` section 3): the proof needs about an
   hour, must not cross midnight, and the nightly job clears build folders at 00:00. Tell the owner,
   word for word, before anything else: "The device proof starts now and needs about an hour. The
   phone is on test builds throughout; your real alerts come back with the final Asr-next mock
   build, which the last step installs. Nothing here needs your hands."
2. Run `mkdir -p ~/athan-device-sweep/session7/build ~/athan-device-sweep/session7/mocks`.
3. Run `cp ai/plans/07-replace-previous-notification/scripts/mocks/fixed-days.ts.txt ~/athan-device-sweep/session7/mocks/fixed-days.ts`.
4. Run `git rev-parse uat-2` and write the sha in `LOG.md` as `FINAL=<sha>`: every `<FINAL>` below is
   that sha. The stacking build is fixed: `PARENT=aaabb12a26b0a0d23206263074eaf4d4d73cb9c4` (1.27.197).
   Write it in `LOG.md`.
5. Run `adb -s 8f7ada76 get-state`. Expected: `device`.
6. Run `adb -s 8f7ada76 shell settings get global auto_time`. Expected: `1`.
7. Run `adb -s 8f7ada76 shell dumpsys window policy | grep -c 'showing=true' || true`. Expected: `0`. `1`
   means the phone is locked: section 2.2, item 11.
8. Run `adb -s 8f7ada76 shell svc power stayon usb`.
9. Run `adb -s 8f7ada76 shell dumpsys package com.mugtaba.athan | grep versionName`. Expected:
   `versionName=1.27.198`. Any other version: section 2.2, item 3.
10. Single-driver check: run `ps -axo pid,lstart,command | grep '[o]pencode'` and
    `ls -lt ~/athan-device-sweep/session5/mockcheck | head -4`, and record both in `LOG.md`. An
    `opencode` process whose start time is later than this session's start (item 1's `date`) is
    another session arriving: section 2.2, item 10. A process that predates this session may be the
    orchestrator that spawned it: record it, do not stop on it, and watch item 10's other signal. The
    certain signal, at every later pause, is a file under
    `~/athan-device-sweep/session5/mockcheck/` that changes when this session did not write it:
    section 2.2, item 10.
11. Run `python3 ai/plans/07-replace-previous-notification/scripts/device/tray.py ~/athan-device-sweep/session7/tray-start.txt`.
    Expected: `TRAY` followed by any count and one `NOTIFY` line per showing notification. Write the
    count in `LOG.md` as `TRAY_START=<n>` and the tags as `PILE=<tags>`; the findings text names what
    the first install's package replace cancelled.
12. Baseline alarm inventory: run
    `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session7/alarms-baseline.txt`. Two
    commands read it, and every later item that says "the tag count" or "the instant list" runs them
    on the dump it names. The tag count:
    `grep -A1 'com.mugtaba.athan}' <dump> | grep -o 'tag=\*walarm\*:[A-Za-z_.]*' | sort | uniq -c`.
    The instant list (the `-A2` reaches the `when=` line, which the tag count's `-A1` does not):
    `grep -A2 'com.mugtaba.athan}' <dump> | awk '/^ +tag=/{tag=$1} /when=/{sub(/.*when=/,"when="); print tag, $0}' | sort | uniq -c`.
    Expected here: in the tag count, one line `ACTION_FORCE_STOP_RESCHEDULE` with count 1 (the
    year-2036 WorkManager alarm, `when=2036-09-12 04:40:40.505`, on every 3T dump), plus one
    `NOTIFICATION_EVENT` line whose count is `BASELINE_ALARMS=<n>`; in the instant list, every app
    alarm's instant beside its tag. Write `BASELINE_ALARMS` and every `NOTIFICATION_EVENT` instant in
    `LOG.md`. Any other tag: section 2.2, item 4. Any armed instant later than `2026-09-20 00:00:00`:
    section 2.2, item 9.
13. The purge, only if `BASELINE_ALARMS` is not 0: compute the purge target as the latest armed
    `NOTIFICATION_EVENT` instant plus 5 minutes, formatted `YYYY-MM-DD HH:MM:SS`, and write it in
    `LOG.md` as `PURGE_TO=`. Then `adb -s 8f7ada76 shell logcat -c`, then
    `python3 ~/athan-device-sweep/session5/bin/devcheck.py clock "$PURGE_TO"`, then
    `python3 ~/athan-device-sweep/session5/bin/devcheck.py wait 15`. Every armed alarm fires once under
    the shared tag; each posts, and the tray keeps one notification. Then save and count:
    `adb -s 8f7ada76 shell logcat -d -b system,events > ~/athan-device-sweep/session7/fire-purge.logcat.txt`,
    then `python3 ai/plans/07-replace-previous-notification/scripts/device/posts.py ~/athan-device-sweep/session7/fire-purge.logcat.txt '<PURGE_TO minus 1 minute, MM-DD HH:MM:SS>' '<PURGE_TO plus 10 minutes, MM-DD HH:MM:SS>' | tee $TMPDIR/posts-purge.txt`,
    then `python3 ai/plans/07-replace-previous-notification/scripts/device/tray.py ~/athan-device-sweep/session7/tray-purge.txt`.
    Expected: `POSTS <BASELINE_ALARMS>`, every printed post line holding
    `com.mugtaba.athan,0,athan-notification,0`; `MUTED` any value (record); `REFUSED 0`; `TRAY 1`
    with exactly one `NOTIFY tag=athan-notification` line. Then `python3 ~/athan-device-sweep/session5/bin/devcheck.py auto`,
    then `adb -s 8f7ada76 shell settings get global auto_time` (expected `1`), then a fresh dump as
    `~/athan-device-sweep/session7/alarms-after-purge.txt` and the tag count: expected
    `NOTIFICATION_EVENT` count 0. If it is not 0, run this item's purge once more from the new dump's
    latest instant; a second nonzero result: section 2.2, item 4. Write `PURGE_POSTS=<n>` in `LOG.md`.
14. The disarm. Cold launch the installed build:
    `python3 ~/athan-device-sweep/session5/bin/devcheck.py cold disarm-cold > $TMPDIR/cold-7-disarm.log 2>&1`
    in the background, then `python3 ~/athan-device-sweep/session5/bin/devcheck.py wait 15` twice. If
    the app did not come up (the launcher holds focus), run
    `python3 ~/athan-device-sweep/session5/bin/devcheck.py resume disarm-resumed` once and `wait 15`;
    a second failure: section 2.2, item 11. Then disarm the three bells the mock storage holds:
    1. Fajr (Sound, with its reminder): `tap 970 674`, `wait 3`,
       `read disarm-fajr-sheet`. Expected in the read: the text `Fajr`, and Fajr's notification state
       reading `sound`. Then `tap 250 1030` (Off; one tap disarms the row's reminder too,
       `stores/notifications.ts:628-632`), `key back`, `wait 10`.
    2. Asr (Silent): `tap 970 1124`, `wait 3`, `read disarm-asr-sheet`. Expected: the text `Asr`, the
       state `silent`. Then `tap 250 1030`, `key back`, `wait 10`.
    3. Suhoor (Sound): `adb -s 8f7ada76 shell input swipe 900 300 150 300 300`, `wait 3`, `tap 970 974`,
       `wait 3`, `read disarm-suhoor-sheet`. Expected: the text `Suhoor`, the state `sound`. Then
       `tap 250 1030`, `key back`, `wait 10`.

    A read that fails while the countdown animates: `wait 3` and `read` once more with a `-2` label; a
    second failure: section 2.2, item 7. A read showing any other prayer name, or a state other than
    the one predicted: section 2.2, item 7.
15. The zero verify: `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session7/alarms-disarmed.txt`,
    then the tag count. Expected: exactly one line, `ACTION_FORCE_STOP_RESCHEDULE` count 1, and
    `NOTIFICATION_EVENT` count 0: with every bell Off, no row armed anything
    (`stores/notifications.ts:1389-1396`). Nonzero: section 2.2, item 4. Write `DISARMED_ALARMS=0` in
    `LOG.md`. The baseline is done; every prediction from here is exact.

### 7.1 The built artifact carries the change

1. Build in the background:
   `zsh ~/athan-device-sweep/session3/bin/build-mock.zsh <FINAL> ~/athan-device-sweep/session7/mocks/fixed-days.ts ~/athan-device-sweep/session7/build/athan-7-new.apk > $TMPDIR/build-7-new.log 2>&1`.
   Expected: the log holds `BUILD-MOCK OK`, and after it a line starting `versionName` that ends with the
   version `node -p 'require("./package.json").version'` prints.
2. Build in the background, after the first build's notification:
   `zsh ~/athan-device-sweep/session3/bin/build-mock.zsh aaabb12a26b0a0d23206263074eaf4d4d73cb9c4 ~/athan-device-sweep/session7/mocks/fixed-days.ts ~/athan-device-sweep/session7/build/athan-7-old.apk > $TMPDIR/build-7-old.log 2>&1`.
   Same expectations, with version `1.27.197`.
3. Run `$HOME/Library/Android/sdk/build-tools/37.0.0/aapt dump xmltree ~/athan-device-sweep/session7/build/athan-7-new.apk AndroidManifest.xml > ~/athan-device-sweep/session7/new-apk-manifest.txt`.
   Then `grep -c 'AthanNotificationsService' ~/athan-device-sweep/session7/new-apk-manifest.txt`. Expected:
   `1`. Then `grep -c 'expo.modules.notifications.service.NotificationsService' ~/athan-device-sweep/session7/new-apk-manifest.txt`.
   Expected: `0`. The shipped APK itself holds our receiver and not expo's. Any other counts: STOP and ask
   "The new APK's manifest holds `<the two counts>`. What do I do?".
4. The same two greps on a dump of `athan-7-old.apk`, saved as `~/athan-device-sweep/session7/old-apk-manifest.txt`,
   must print `0` and `1`: the stacking build carries expo's receiver and not ours.

### 7.2 The update path: alarms armed by the stacking build

The baseline left zero app alarms, so this phase's first clock move fires nothing, and every count below
is exact. Before each forward drive the item names every armed instant, and the drive passes only what
the item says.

1. Install the old build in the background:
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py install ~/athan-device-sweep/session7/build/athan-7-old.apk > $TMPDIR/install-7-old.log 2>&1`.
   Expected: a line containing `Success`, then a state line with version `1.27.197`. This is the mock
   storage (`athan-storage-dev`); the owner's data is untouched. The install's package replace cancels
   whatever the tray held (`TRAY_START`'s pile moves to the archive).
2. Drive the clock BACK to the fixed mock's Saturday morning:
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py clock '2026-09-12 08:00:00'`. Expected: a line
   naming the device time it set. A backward jump fires no alarm; the baseline holds none anyway.
3. Cold launch: `python3 ~/athan-device-sweep/session5/bin/devcheck.py cold old-cold > $TMPDIR/cold-7-old.log 2>&1`
   in the background, then `wait 15` twice. If the launcher holds focus (the known post-install
   first-start), `devcheck.py resume old-resumed` once, `wait 15`; a second failure: section 2.2,
   item 11.
4. Arm Asr at Silent. Asr's bell is at (970,1124):
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py tap 970 1124`, then
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py wait 3`, then
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py read old-asr-sheet`.
   Expected in the read's summary: the text `Asr`. Any other prayer name: section 2.2, item 7.
5. `python3 ~/athan-device-sweep/session5/bin/devcheck.py tap 540 1030` (Silent), then
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py key back`, then
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py wait 10` (the commit arms two days of alarms).
6. Run `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session7/alarms-old-armed.txt`, then the
   tag count and the instant list from 7.0 item 12 on it. Expected: `ACTION_FORCE_STOP_RESCHEDULE` 1, and
   `NOTIFICATION_EVENT` exactly 2, armed at `2026-09-12 16:42:00.000` and `2026-09-13 16:40:00.000`:
   Asr's two list days, nothing else, because every other bell is Off and past instants are never armed.
   Write `OLD_ALARMS=2` in `LOG.md`. Anything else: section 2.2, item 4.
7. Install the new build over it, keeping the data, with NO force-stop or `am kill` in between (the
   update's own re-arm is what holds the alarms):
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py install ~/athan-device-sweep/session7/build/athan-7-new.apk > $TMPDIR/install-7-new.log 2>&1`.
   Expected: `Success`, then `<FINAL>`'s version. Then
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py wait 15` twice, so the update's asynchronous
   re-arm lands before item 8 reads it. The package replace cancels the tray again; from here
   the tray holds only the shared tag's own notification.
8. `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session7/alarms-after-update.txt`, then the
   tag count and the instant list. Expected: `NOTIFICATION_EVENT` exactly 4:
   `2026-09-12 16:42:00` twice and `2026-09-13 16:40:00` twice, the update's re-arm having copied each
   armed instant under the new receiver while the old receiver's PendingIntent lives on as a dead
   double. Write `AFTER_UPDATE_ALARMS=4` in `LOG.md`. Anything else: section 2.2, item 4.
9. Move to the minute before Asr, passing nothing (both armed instants are at or after 16:42):
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py clock '2026-09-12 16:41:00'`, then
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py wait 10`, then
   `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session7/alarms-before-asr.txt` and the tag
   count and instant list. Expected: the same four alarms, every armed instant at or after `16:42`.
   Anything else: section 2.2, item 4.
10. Clear the log and drive the last 90 seconds: `adb -s 8f7ada76 shell logcat -c`, then
    `python3 ~/athan-device-sweep/session5/bin/devcheck.py clock '2026-09-12 16:42:30'`, then
    `python3 ~/athan-device-sweep/session5/bin/devcheck.py wait 15`.
11. Save the log and read the posts and the tray:
    `adb -s 8f7ada76 shell logcat -d -b system,events > ~/athan-device-sweep/session7/fire-asr.logcat.txt`, then
    `python3 ai/plans/07-replace-previous-notification/scripts/device/posts.py ~/athan-device-sweep/session7/fire-asr.logcat.txt '09-12 16:42:30' '09-12 16:47:30' | tee $TMPDIR/posts-asr.txt`, then
    `python3 ai/plans/07-replace-previous-notification/scripts/device/tray.py ~/athan-device-sweep/session7/tray-asr.txt`.
    Expected: `POSTS 1` (the live alarm posted; its printed line holds
    `com.mugtaba.athan,0,athan-notification,0,Notification(channel=expo_notifications_fallback_notification_channel`;
    the dead double's PendingIntent delivered nothing), `MUTED 0` (one post cannot trip the muting
    window), `REFUSED 0`, and `TRAY 1` with exactly one `NOTIFY tag=athan-notification` line whose
    channel is `expo_notifications_fallback_notification_channel` (a Silent alert's channel). Write
    `ASR_POSTS`, `ASR_MUTED` and the tray line in `LOG.md`. Anything else: section 2.2, items 5 and 6.

### 7.3 Replace, channel-crossing, and the same-instant pair

1. Drive to the small hours of the mock's Sunday, passing nothing (the only armed instants are
   2026-09-13 16:40 twice, and 03:00 precedes them), then cold launch so the app reschedules:
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py clock '2026-09-13 03:00:00'`, then
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py cold new-cold > $TMPDIR/cold-7-new.log 2>&1` in
   the background, then `wait 15` twice. The launcher retry is 7.2 item 3's.
2. Arm Fajr at Sound with a 20-minute reminder at Sound. Fajr's bell is at (970,674): `tap 970 674`,
   `wait 3`, `read new-fajr-sheet` (expected text `Fajr`; else section 2.2, item 7), `tap 831 1030`
   (Sound), `wait 2`, `tap 926 1266` (the Reminder switch), `wait 2`, `tap 831 1476` (the reminder's
   Sound), `wait 2`, `read new-fajr-20` (expected in the descs: `20 min` and `Increase to 25 min`; any
   other interval: section 2.2, item 8), `key back`, `wait 10`.
3. Arm Suhoor at Sound. Swipe to the Extras page: `adb -s 8f7ada76 shell input swipe 900 300 150 300 300`,
   `wait 3`. Suhoor's bell is at (970,974): `tap 970 974`, `wait 3`, `read new-suhoor-sheet` (expected
   text `Suhoor`; else section 2.2, item 7), `tap 831 1030` (Sound), `key back`, `wait 10`.
4. Run the alarm dump and the tag count and instant list, saved as `alarms-pair.txt`. Expected:
   `ACTION_FORCE_STOP_RESCHEDULE` 1, `NOTIFICATION_EVENT` exactly 9, and every armed instant one of
   these, each at the multiplicity given: 2026-09-13 `04:22:00` twice (Suhoor and the Fajr reminder,
   which is Fajr minus 20), 2026-09-13 `04:42:00` once (Fajr), 2026-09-13 `16:40:00` twice (the live
   re-arm and the update's dead double), 2026-09-14 `04:24:00` twice (Suhoor and the reminder),
   2026-09-14 `04:44:00` once (Fajr), 2026-09-14 `16:39:00` once (Asr, silent since 7.2). Write
   `PAIR_ALARMS=9` in `LOG.md`. Anything else: section 2.2, item 4. Then move to the minute before the
   pair, passing nothing (no armed instant sits between 03:00 and 04:21):
   `devcheck.py clock '2026-09-13 04:21:00'`, then `wait 10`, then a fresh dump as
   `alarms-before-pair.txt` whose tag count and instant list are the same nine, every instant at or
   after `04:22`. Anything else: section 2.2, item 4.
5. The same-instant pair: `adb -s 8f7ada76 shell logcat -c`,
   `devcheck.py clock '2026-09-13 04:22:00'`, `wait 15`, then
   `adb -s 8f7ada76 shell logcat -d -b system,events > ~/athan-device-sweep/session7/fire-pair.logcat.txt`, then
   `python3 ai/plans/07-replace-previous-notification/scripts/device/posts.py ~/athan-device-sweep/session7/fire-pair.logcat.txt '09-13 04:22:00' '09-13 04:27:00' | tee $TMPDIR/posts-pair.txt`, then
   `python3 ai/plans/07-replace-previous-notification/scripts/device/tray.py ~/athan-device-sweep/session7/tray-pair.txt`.
   Expected: `POSTS 2` (both notifications posted, each printed line holding
   `com.mugtaba.athan,0,athan-notification,0`, one on `reminder_fajr_20` and one on `extras_at_time`,
   in either order), `MUTED 0` or `MUTED 1` (the one-second muting window is a race the plan records,
   not predicts; write it down either way), `REFUSED 0`, and `TRAY 1` with exactly one
   `NOTIFY tag=athan-notification` line whose channel is `reminder_fajr_20` or `extras_at_time` and
   never `expo_notifications_fallback_notification_channel`. The surviving channel is whichever posted
   last; the plan does not predict it, and the owner ruled the system decides (decision 2). Write
   `PAIR_POSTS`, `PAIR_MUTED` and `PAIR_CHANNEL` in `LOG.md`. Anything else: section 2.2, items 5 and 6.
6. The channel-crossing replace, twenty minutes later, passing nothing (the next armed instant after the
   pair is Fajr at 04:42): `adb -s 8f7ada76 shell logcat -c`,
   `devcheck.py clock '2026-09-13 04:42:00'`, `wait 15`, then `wait 5`, then the same three saves with
   the labels `fire-fajr.logcat.txt`, `posts-fajr.txt`, `tray-fajr.txt` (the posts window
   `'09-13 04:42:00' '09-13 04:47:00'`). Expected: `POSTS 1`, its printed line holding
   `com.mugtaba.athan,0,athan-notification,0,Notification(channel=athan_1_v2`, `MUTED 0`, `REFUSED 0`,
   and `TRAY 1` with exactly one `NOTIFY tag=athan-notification channel=athan_1_v2` line (the default
   athan). The notification showing on the reminder's channel was replaced by one on the athan's
   channel, exactly as its own channel says. Anything else: section 2.2, items 5 and 6.

### 7.4 Four fires, one shared-tag notification

Run `python3 ai/plans/07-replace-previous-notification/scripts/device/tray.py ~/athan-device-sweep/session7/tray-end.txt`.
Expected: `TRAY 1` with exactly one `NOTIFY tag=athan-notification channel=athan_1_v2`. Four shared-tag
posts have happened since 7.2 (Asr, the pair's two, Fajr) and they left exactly one notification between
them: finding 73's 50-notification cap cannot be reached by this app again. Write it in `LOG.md`.

### 7.5 The phone left on the latest mock build

1. Build in the background:
   `zsh ~/athan-device-sweep/session3/bin/build-mock.zsh <FINAL> /Users/muji/repos/rn.athan.uk/mocks/simple.ts ~/athan-device-sweep/session7/build/athan-7-mock-final.apk > $TMPDIR/build-7-final.log 2>&1`.
   Expected: `BUILD-MOCK OK` and the `versionName` line with `<FINAL>`'s version.
2. Before returning the clock, take the host window stamps:
   `W1=$(date -v-1M '+%m-%d %H:%M:%S')` and `W2=$(date -v+10M '+%m-%d %H:%M:%S')`, and record both in
   `LOG.md`. Then `python3 ~/athan-device-sweep/session5/bin/devcheck.py auto`. Returning to the real
   clock passes every alarm still armed on the driven days: 2026-09-13 16:40 twice (one post; the dead
   double delivers nothing), 2026-09-14 04:24 twice, 04:44, and 16:39: five posts in total, each under
   the shared tag, within seconds of each other. Then `wait 15`, then
   `adb -s 8f7ada76 shell logcat -d -b system,events > ~/athan-device-sweep/session7/fire-auto.logcat.txt`, then
   `python3 ai/plans/07-replace-previous-notification/scripts/device/posts.py ~/athan-device-sweep/session7/fire-auto.logcat.txt "$W1" "$W2" | tee $TMPDIR/posts-auto.txt`, then
   `python3 ai/plans/07-replace-previous-notification/scripts/device/tray.py ~/athan-device-sweep/session7/tray-auto.txt`.
   Expected: `POSTS 5`, every printed line holding `com.mugtaba.athan,0,athan-notification,0`;
   `MUTED` any value (record); `REFUSED 0`; `TRAY 1` with exactly one `NOTIFY tag=athan-notification`
   line. Write `AUTO_FIRES=5` in `LOG.md`. Anything else: section 2.2, items 5 and 6.
3. Install the final mock build:
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py install ~/athan-device-sweep/session7/build/athan-7-mock-final.apk > $TMPDIR/install-7-final.log 2>&1`
   in the background. Expected: `Success`, then `<FINAL>`'s version.
4. `python3 ~/athan-device-sweep/session5/bin/devcheck.py cold final-cold > $TMPDIR/cold-7-final.log 2>&1`
   in the background, then `wait 15` twice. If the first post-install launch lands on the launcher or
   the lock screen, `devcheck.py resume final-resumed` once, `wait 15`; a second failure:
   section 2.2, item 11.
5. `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session7/alarms-end.txt`, then the tag
   count and the instant list. Expected: `ACTION_FORCE_STOP_RESCHEDULE` 1, and `NOTIFICATION_EVENT` 4
   or 5 (the count is 5 while today's Asr, armed at the cold launch's download plus 60 to 119
   seconds, has not yet fired, and 4 after it has), with every armed instant exactly one of: today's
   Asr at the real date, and, on the real date's tomorrow, `03:43:00` twice (Suhoor and the Fajr
   reminder), `04:03:00` (Fajr) and `16:58:00` (Asr), the fixed day1 row of `mocks/simple.ts`. Any
   other tag, count or instant: section 2.2, item 4. Write `END_ALARMS=<n>` in `LOG.md`.
6. `python3 ~/athan-device-sweep/session5/bin/devcheck.py shot ~/athan-device-sweep/session7/mock-final.png`.
7. Spawn `vision` (GLM 5.3 Flash) with this prompt. Expected: `YES`. Any other answer: repeat items 4
   and 6 once (a fresh cold launch re-seeds Asr next); still not `YES`: section 2.2, item 12.

   ```text
   Read the image at ~/athan-device-sweep/session7/mock-final.png. It is a screenshot of a prayer times app. Answer
   with exactly one word: YES if the row named Asr is highlighted as the next prayer and the countdown near the top
   shows a time under 2 minutes (such as "45s", "1m" or "1m 30s"); NO otherwise.
   ```

8. Run `adb -s 8f7ada76 shell settings get global auto_time`. Expected: `1`.
9. Run `adb -s 8f7ada76 shell dumpsys package com.mugtaba.athan | grep versionName`. Expected:
   `versionName=` followed by `package.json`'s version.
10. Leave the phone as the owner's 2026-09-16 standing rule holds it: unlocked (the keyguard check of
    7.0 item 7 reads 0), Athan open in the foreground (item 4's cold launch), and
    `svc power stayon usb` still set from 7.0 item 8. Do NOT run `svc power stayon false`.
11. Spawn a `Reality Checker` subagent (a `general` subagent), isolation `worktree`, no `model`, with
    the prompt `REALITY_CHECK` in section 11, and write its verdict in `LOG.md`. A final line
    `evidence does not hold`: STOP and ask "Reality Checker (GLM 5.3) found `<its NOT PROVEN lines>`.
    What do I do?".
12. Only after a final line `evidence holds`: in `PLAN.md` section 6, replace the line
    `- [ ] Device proof: section 7 (specified)` with `- [x] Device proof: DONE`.

The phone is left on the mock build of `<FINAL>` with the Asr-next mock data, real clock, automatic
time on, unlocked, Athan open, stay-awake on. The owner's production data stays in `athan-storage`.

## 8. Records

### 8.1 Findings text

Append this to the end of `ai/features/uat-2/AUDIT-FINDINGS.md`, replacing each placeholder with the
value measured:

- `<DATE>`: the date the device proof ended, as `D Month YYYY`;
- `<FINAL8>`: the first eight characters of the sha from section 7.0;
- `<VERSION>`: `package.json`'s version at `<FINAL>`;
- `<TESTS>`: the `Tests:` line of step 1's commit log (`4511 passed, 4511 total`);
- `<TRAY_START>`, `<PURGE_POSTS>`: the baseline readings `LOG.md` records in 7.0;
- `<OLD_ALARMS>`, `<AFTER_UPDATE_ALARMS>`, `<PAIR_ALARMS>`, `<END_ALARMS>`: the alarm counts `LOG.md`
  records in 7.2, 7.3 and 7.5;
- `<ASR_POSTS>`, `<PAIR_POSTS>`, `<PAIR_MUTED>`, `<PAIR_CHANNEL>`, `<AUTO_FIRES>`: the `posts.py`
  numbers `LOG.md` records.

```markdown
# Session 7 of the queue: each notification replaces the one before it, <DATE>

The brief is `ai/prompts/replace-previous-notification.md`, planned in
`ai/plans/07-replace-previous-notification/PLAN.md` by a GLM 5.3 planning session (design review: GLM 5.3
Software Architect, "design sound"), executed on GLM 5.3 with a GLM 5.3 Code Reviewer on the commit.
After the owner ordered the task replanned from scratch and executed once (2026-09-17, 13:20), the plan
was rebuilt around the merged code and the proof re-run end to end in one session from a baseline the
plan itself creates. `uat-2` ends at `<FINAL8>` (<VERSION>); the last suite run reported `<TESTS>`, at
100% statements, branches, functions and lines.

## 78. CLOSED on Android: every post lands under one shared tag

A config plugin (`plugins/replacePreviousNotification.js`) removes expo-notifications' own receiver from
the merged manifest, declares `AthanNotificationsService` with the same six actions, and writes the Kotlin
that swaps the request identifier for `athan-notification` only at the posting layer: scheduling,
cancelling and the stored requests keep the app's unique identifiers. The suite
`plugins/__tests__/replacePreviousNotification.test.ts` pins the manifest surgery, the Kotlin, the plugin's
place in `app.json` and `app.config.ts`, and the upstream seams the change rides on. Posts are counted
from the system's `notification_enqueue` events (owner, 2026-09-17): this device drops the
`NotificationService: enqueueNotificationInternal` DEBUG lines, while the events buffer logs every
enqueue.

On the 3T, from a baseline the proof created itself (every armed alarm purged by one bounded forward
drive, `<PURGE_POSTS>` posts all under the shared tag; every stored bell on the mock storage turned Off;
the alarm dump then reading zero app alarms):

- **The artifact:** the new APK's own manifest holds the app's receiver and not expo's (7.1); the
  stacking build's holds expo's and not ours.
- **The update path:** the stacking build armed exactly the two Asr alarms (<OLD_ALARMS>); after the
  update the dump held exactly the doubled four (<AFTER_UPDATE_ALARMS>); driving to the instant produced
  exactly <ASR_POSTS> post and a tray of exactly one, under the shared tag on the Silent fallback
  channel: the old build's PendingIntents, whose receiver is no longer in the manifest, delivered
  nothing. No duplicates. The <TRAY_START> notifications showing before the first install were
  cancelled by the package replace itself (they sit in the tray save's archive section): Android clears
  an app's posted notifications when its package is replaced, so the update removed the pile without the
  app dismissing anything.
- **Replace:** a Sound reminder on `reminder_fajr_20` and, twenty minutes later, the athan on `athan_1_v2`:
  <PAIR_POSTS> posts at the shared instant left the tray at exactly one under the shared tag on
  `<PAIR_CHANNEL>` (<PAIR_MUTED> muted, recorded), and the athan's fire left exactly one shared-tag
  notification on `athan_1_v2`. Returning to the real clock fired the remaining five armed alarms
  (<AUTO_FIRES> posts) and the tray still held one. Finding 73's 50-notification cap is unreachable
  through this app's posts.
- Every sound that played was the app's own file or none: the owner's one condition held.

The owner's rulings carried here: no cleanup code for notifications stacked by earlier builds
(2026-09-17), Android's own package-replace cancellation clearing that pile at the update, verified
twice; same-instant pairs are left to the system, one sound at a time, which the owner's own earlier
nine-run test had already shown (2026-09-13 and 2026-09-17); posts read from the events buffer and the
tray asserted as exactly one (2026-09-17, 12:34).

iOS is session 8 (`ai/prompts/ios-replace-previous-notification.md`).

## State left behind

The 3T runs the mock build of `<FINAL8>` with the Asr-next mock data, real clock, automatic time on,
unlocked with Athan open and stay-awake on (the owner's standing rule). Nothing was built on or pushed
to EAS, and `releases.json` is untouched. The evidence is in `~/athan-device-sweep/session7/`.
```

### 8.2 Table rows

- **`ai/plans/README.md`:** the executor sets row 3's status to `EXECUTED`.
- **`ai/prompts/README.md`, for the auditor to apply on PASS:** replace row 7's last cell `queued` with
  `**DONE** <DATE>, <step 1 version>: every Android notification posts under one shared tag, so the newest
  replaces the one before it; the update path, a same-instant Sound pair and a channel-crossing replace
  proven on the 3T in one run from a baseline the plan creates. The update itself clears the old stacked
  pile: Android cancels an app's posted notifications on package replace (no dismissal code, owner,
  2026-09-17)`.

### 8.3 Docs commit

The `executed` docs commit (`EXECUTOR-BRIEF.md` section 4b) uses this message, with `<VERSION>` from
`set-version.sh`:

```text
<VERSION> - docs(plans): session 7 executed: each notification replaces the one before it, proven on the 3T in one run
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
| A `read` after a tap prints `DUMP FAILED` | The countdown animates; dumps fail on the bare page but work with a sheet open | `wait 3` and `read` once more with a `-2` label; a second failure: section 2.2, item 7 |
| A cold launch lands on the launcher | The known post-install first-start behaviour | `devcheck.py resume <label>` once, `wait 15`; a second failure: section 2.2, item 11 |
| A build prints `another Android build or bundler is running` | Two builds at once | Wait for the first build's notification, then start the second |
| `MUTED` is 1 where an item records either | The one-second muting window is a race | Record it and go on |
| The purge's second dump still holds alarms | An armed instant appeared after the first purge | Section 2.2, item 4: STOP and ask |
| The zero verify after the disarm holds alarms | A bell the plan did not predict is stored on | Section 2.2, item 4: STOP and ask; never open extra sheets to guess |
| The pre-commit hook fails only on `audioMatrix.test.ts` timing out | The machine is busy | `EXECUTOR-BRIEF.md` section 3: wait for the load and commit again, up to 3 times |
| A mockcheck file changes that this session did not write | Another session is driving the phone | Section 2.2, item 10: stand down and ask |

### 10.2 Anticipated review fixes

None is given word for word: the remaining work changes no code, and every name, string and behaviour
the merged step fixed is pinned by its tests. A reviewer finding on the docs commit is handled by
`EXECUTOR-BRIEF.md` section 4, item 8's three conditions and nothing else.

### 10.3 Stopping part-way

Step 1 is DONE and merged; its restore row is history. For the device proof, which changes no repository
file: mid-proof, run `devcheck.py auto`, leave the phone on whatever build is installed with `auto_time`
1, and record in `LOG.md` which item the proof reached and what the phone holds. A successor resumes by
re-deriving the state exactly as the first proof's successors did (LOG.md, 11:45 and 13:19), then re-runs
section 7.0's baseline before anything else, because a stopped proof's phone state is exactly the
unknown the baseline exists to remove.

## 11. Subagents in this plan

| Step | Agent type | Model | Isolation | Why | Prompt |
| --- | --- | --- | --- | --- | --- |
| Step 1 | `Code Reviewer` (a `general` subagent) | GLM 5.3 | `worktree` | The commit's review, done at 1.27.198 (2 rounds, `merge`) | `steps/1-shared-tag-plugin.md`, part 9 |
| Docs commit | `Code Reviewer` (a `general` subagent) | GLM 5.3 | `worktree` | The `executed` docs commit | `EXECUTOR-BRIEF.md` section 4b, item 5 |
| 7.5 | `vision` | GLM 5.3 Flash | none | The executor cannot read images | 7.5 item 7 |
| 7.5 | `Reality Checker` (a `general` subagent) | GLM 5.3 | `worktree` | Does the evidence prove every claim in section 8.1? | `REALITY_CHECK` below |
| Any | `Test Results Analyzer` (a `general` subagent) | GLM 5.3 | `worktree` | Only when a full-suite run fails in a way section 10 does not cover; it reports the cause, then the executor STOPs | "Read `<log path>` in full and name the cause of each failing test, with file and line. Change nothing." |

The prompt `REALITY_CHECK` (worktree isolation; it reads the main checkout's files by absolute path,
which is why it must never run a git command):

```text
You are read-only. Run no git command and change no file; read everything by absolute path. Read
/Users/muji/repos/rn.athan.uk/ai/plans/07-replace-previous-notification/PLAN.md sections 7 and 8.1 and
/Users/muji/repos/rn.athan.uk/ai/plans/07-replace-previous-notification/LOG.md, in full: LOG.md holds
readings not committed yet. Then read every file under /Users/muji/athan-device-sweep/session7/ that
section 8.1's text cites, except images, which you must not open; for each image, use the vision answer
LOG.md records. For every claim in section 8.1, say whether the files prove it, quoting the line that
does. Reply with one line per claim, "PROVEN: <claim>: <evidence>" or "NOT PROVEN: <claim>: <what is
missing>", then a final line "evidence holds" or "evidence does not hold".
```

## 12. Report to the owner

The final message of the execution session:

```text
🤖  Model: GLM 5.3 (execution session)
Time: <output of date '+%H:%M:%S %d.%m.%Y'>

Session 7 is executed and waits for its audit. One merged commit, and a device proof run end to end in
one session with no questions:
- A config plugin posts every Android notification under one shared tag, so the newest replaces the one
  before it. Scheduling, identifiers and every bell are untouched; the notifications stacked by earlier
  builds are cleared by the update itself, because Android cancels an app's posted notifications on
  package replace, so no cleanup code was needed.
- The proof created its own baseline first (every armed alarm purged, every stored bell on the mock
  storage turned Off, the dump proven zero), then: the update produced no duplicate posts, a
  same-instant Sound pair left one notification with at most one sound, an athan replaced a reminder
  across channels, and after four fires and the clock's return the tray still held exactly one.
The phone is on the mock build of the latest uat-2, with Asr next, unlocked, Athan open, stay-awake on.

<the progress table, in EXECUTOR-BRIEF.md section 6's format>

Nothing waits on you for this session. Next, the audit.
```
