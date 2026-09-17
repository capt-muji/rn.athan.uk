# Execution log: Session 7

## STOP, 07:27 17.09.2026, at the pre-flight (GLM 5.3, execution session)

Two defects found before any step ran. No file in the repository was changed by this session;
the working tree was exactly as the planning session left it.

1. **The pre-flight failed: the planning session committed nothing.** `bash $TMPDIR/preflight-7.sh 1`
   printed:

   ```text
   PREFLIGHT FAILED: changes other than the plan files:  M ai/prompts/README.md
   ?? ai/plans/07-replace-previous-notification/
   ```

   The planning session's work sits uncommitted in the tree: `ai/plans/README.md` (row 3 set READY),
   `ai/prompts/README.md` (the owner's 2026-09-17 decisions), `opencode.json`
   (`experimental.subagent_depth: 2`), and the whole plan folder, untracked. The pre-flight's own
   allowlist covers `ai/plans/README.md`, `PLAN.md`, `LOG.md` and `opencode.json` only, so it fails on
   `ai/prompts/README.md` and the untracked folder. Sessions 6 and 6b each have a
   `docs(plans): session N planned` commit from their planning session (6b: `a20e8d42`, 1.27.186);
   session 7 has none. PLAN.md section 3 says of this line: ask
   "The pre-flight failed: `<line>`. What do I do?". Likely the planning session's docs commit is
   missing, but making any commit myself is not mine to decide.

2. **The carried mock file contradicts PLAN.md section 7.**
   `scripts/mocks/fixed-days.ts.txt` copies `mocks/simple.ts`'s blocks, but keys the autumn block two
   days early relative to every prediction section 7 makes and to the file's own docstring:

   - PLAN.md 7.2 items 9-11 drive the clock to 2026-09-12 16:41 then 16:42:30 and expect Asr to fire
     (`POSTS 1`); the table gives 2026-09-12 Asr 16:39 (so the fire passes before the drive, and item
     6's "no armed instant before 16:40" already fails: section 2.2, item 7).
   - PLAN.md 7.3 items 2-6 expect the pair at 04:22 (Fajr 04:42 minus the 20-minute reminder) and
     Fajr at 04:42 on 2026-09-13; the table gives 2026-09-13 Fajr 04:45 (pair 04:25), so the drives
     to 04:21/04:22 fire nothing: section 2.2, items 7-9.
   - PLAN.md 7.3 item 1 expects "Magrib 19:47 and Isha 20:58 on 2026-09-12"; the table gives
     19:42/20:54 there. PLAN.md 7.3 item 4 expects Asr 16:40 on 2026-09-13; the table gives 16:37.
   - The file's own docstring says "On 2026-09-13 the rows the proof uses: Suhoor 04:22 (derived, 20
     minutes before Fajr 04:42), Fajr 04:42, Asr 16:40", which matches its 2026-09-11 row, not its
     2026-09-13 row. The values PLAN.md predicts for 09-12 (Asr 16:42, Magrib 19:47, Isha 20:58) sit
     on its 2026-09-10 row; the values predicted for 09-13 (Fajr 04:42, Asr 16:40) sit on 09-11.

   Run verbatim, the device proof stops at 7.2 item 6 or 9. Re-keying the table myself would decide
   which dates carry which times, a planning decision (and a change to a file the plan carries), so it
   is not mine to make. No question exists for this in section 2.2; my own: should the fixed-days mock
   be replanned (or its table corrected by the owner) before the device proof runs?

Step 1 was not started. The row stays READY. Nothing was committed, merged, built or pushed, and the
phone was not touched.

## Resumed by the planning session, 07:59 17.09.2026 (GLM 5.3, planning session)

Both stops are resolved. No file outside `ai/` changed beyond the version bump in `app.json` and
`package.json`, and the phone was not touched.

1. The planning session's docs commit exists: `d47ea94e` (1.27.196), merged as `ab7f2c6d` and pushed to
   `origin/uat-2`. The owner ruled on 2026-09-17 that a planning session commits and pushes its own
   final docs commit; the pre-flight's tree check now passes on a clean checkout.
2. The fixed-days mock was re-keyed in `scripts/mocks/fixed-days.ts.txt`: every date key moved two days
   later (now 2026-09-08 to 2026-09-19), the value rows unchanged in their drift order. The keys, not
   the predictions, were the defect: the file's own docstring named the values PLAN.md section 7
   predicts, and they sat two days early. After the re-key every prediction sits on the date the proof
   drives the clock to: Asr 16:42, Magrib 19:47, Isha 20:58 on 2026-09-12; the pair at 04:22, Fajr
   04:42, Asr 16:40 on 2026-09-13; the 04:24 pair, Fajr 04:44, Asr 16:39 on 2026-09-14. The owner
   delegated the keying to the planning session on 2026-09-17.

The row stays READY. The execution prompt resumes from the pre-flight.
## STOP, 08:04 17.09.2026, at the pre-flight again (GLM 5.3, execution session)

The resumed session's fix was committed but never merged or pushed. `bash $TMPDIR/preflight-7.sh 1`
printed:

```text
PREFLIGHT FAILED: the branch is docs/plan-7-20260917-0800, not uat-2
```

Git state at the stop:

- `uat-2` and `origin/uat-2` both sit at `ab7f2c6d` (1.27.196), the first planning docs commit.
- The planning session's second docs commit `0f36e7e5` (1.27.197: the re-keyed mock, this LOG entry,
  `ai/prompts/README.md`, the version bump) sits only on `docs/plan-7-20260917-0800`, unmerged and
  unpushed, and the checkout is still on that branch. `PLANNER-BRIEF.md` section 8, item 5 makes
  "merge into uat-2, then push" the planning session's own last step; the commit message says the owner
  authorised the commit and push, and the LOG goodbye says execution resumes, so the session ended
  between its commit and its merge.
- Its reviewer worktree `~/athan-device-sweep/worktrees/plan-7-amend-review` still exists at
  `0f36e7e5`; no verdict for that review is recorded anywhere I can read.

Merging another session's branch or pushing is not mine to do (`EXECUTOR-BRIEF.md` section 2), and
checking out `uat-2` myself would put the broken, pre-re-key mock back in the working tree the device
proof reads. No file was changed; the tree is as the planning session left it.

Question to the owner, the plan's section 3 words: "The pre-flight failed: `PREFLIGHT FAILED: the
branch is docs/plan-7-20260917-0800, not uat-2`. What do I do?" Asked 08:05 17.09.2026.

The owner answered at 08:06 17.09.2026: **resume the planning session** (of the three options offered:
resume planning, this session merges without pushing, or wait). The planning session therefore finishes
its own `PLANNER-BRIEF.md` section 8, item 5 ritual for `0f36e7e5`: merge
`docs/plan-7-20260917-0800` into `uat-2`, then push. This execution session merges and pushes nothing
and step 1 stays unstarted; it resumes with this plan's pre-flight once that merge is on `uat-2`.

## Resumed, 11:45 17.09.2026 (GLM 5.3, execution session, second successor)

The planning merge landed (`uat-2` = `origin/uat-2` = `aaabb12a`, which carries the re-keyed mock). The
predecessor execution session completed step 1 through its commit and died before part 9; LOG.md held
no "Resume from" note, so this session reconstructed the state from git and the predecessor's
`$TMPDIR` logs, all still present and all matching the plan's expectations:

- pre-flight `bash $TMPDIR/preflight-7.sh 1` (08:11) preceded the red run, so it passed;
- red: `Cannot find module '../replacePreviousNotification'`, `Tests: 0 total` (`$TMPDIR/red-1.log`);
- green: `Tests: 10 passed, 10 total` (`$TMPDIR/green-1.log`);
- breaks: 1a/1b/1c/1e `1 failed, 9 passed, 10 total`, 1d `2 failed, 8 passed, 10 total`, last line
  `ALL AS EXPECTED: 1` (`$TMPDIR/breaks-1.log`);
- commit `1fa6913a` (1.27.198) on `feat/shared-notification-tag` off `aaabb12a`, hook log
  (`$TMPDIR/commit-1.log`): last `Tests: 4511 passed, 4511 total`, `Statements/Branches/Functions/Lines`
  all `100%`, no `Coverage gate:` line. The checkout was left detached at the commit; this session
  moved it back onto the branch (same sha, no file change).

The pre-flight was not re-run on resume: its branch check requires `uat-2`, which is necessarily false
mid-step on the step branch; every check it performs was served at 08:11 before the step started.

### Step 1 review, round 1 (Code Reviewer, GLM 5.3): fix first

One finding: `plugins/replacePreviousNotification.js` carries three of the step's four required
why-comment subjects but not the fourth, "why the manifest edits are guarded (prebuild re-runs)". The
reviewer's exact fix (a two-line comment above `const hasOurs`) was applied verbatim. It meets all
three of `EXECUTOR-BRIEF.md` section 4, item 8's conditions: it touches only code the plan did not
give verbatim, it changes no name, signature, behaviour, log line or test, and every acceptance
criterion stays met. Re-verified after the edit: `breaks-1.sh` ended `ALL AS EXPECTED: 1`
(`$TMPDIR/breaks-1-recheck.log`), `npx tsc --noEmit` exit 0, `npx biome check . --error-on-warnings`
clean. ### Step 1 record

- Step 1 (one shared notification tag, through a config plugin) on branch `feat/shared-notification-tag`,
  built by the predecessor session and finished by this one.
- Commit `dd8330ab1165dce8f470068b8eba618e756bfa31` (amended from `1fa6913a`), version 1.27.198.
- Hook (amend run, `$TMPDIR/commit-1-amend.log`): last `Tests:       4511 passed, 4511 total`;
  `Statements   : 100% ( 3952/3952 )`, `Branches     : 100% ( 1699/1699 )`,
  `Functions    : 100% ( 824/824 )`, `Lines        : 100% ( 3551/3551 )`.
- Break script's last line: `ALL AS EXPECTED: 1` (first run `$TMPDIR/breaks-1.log`, recheck after the
  review fix `$TMPDIR/breaks-1-recheck.log`).
- Review: Code Reviewer (GLM 5.3), 2 rounds. Round 1 verdict `fix first` (one finding: the missing
  guards why-comment; fixed verbatim as the reviewer specified, all three of EXECUTOR-BRIEF section 4
  item 8's conditions met, recorded above). Round 2 verdict `merge`, no findings.
- Merged into `uat-2` as `45754e6094c5e7d1724fdb24ff97b9e18f3c47cb`,
  `Merge feat/shared-notification-tag into uat-2: one shared notification tag, reviewed`.

## Device proof, section 7, started 11:53 17.09.2026

The owner's notice (section 7.0 item 1, to be delivered with this session's report): "The device proof
starts now and needs about 45 minutes. The phone is on test builds throughout; your real alerts come
back with the final Asr-next mock build, which the last step installs. Nothing here needs your hands."

FINAL=45754e6094c5e7d1724fdb24ff97b9e18f3c47cb
PARENT=aaabb12a26b0a0d23206263074eaf4d4d73cb9c4

Preparation (7.0): device state `device`, `auto_time` 1, no keyguard, stay-on-usb set.
TRAY_START=1
PILE=athan_standard_magrib_2026-09-17
Baseline alarm dump: `ACTION_FORCE_STOP_RESCHEDULE` count 1, `NOTIFICATION_EVENT` count 1, no other
tags.

### 7.1 The built artifact carries the change

New APK (`athan-7-new.apk`, from FINAL): `BUILD-MOCK OK`, `versionName 1.27.198` (= package.json);
manifest holds `AthanNotificationsService` count 1, `expo.modules.notifications.service.NotificationsService`
count 0.
Old APK (`athan-7-old.apk`, from PARENT): `BUILD-MOCK OK`, `versionName 1.27.197`; manifest holds
`AthanNotificationsService` count 0, expo's receiver count 1.

### 7.2 The update path, to the item 6 stop

- Item 1: old build installed over the mock storage, `Success`, version 1.27.197.
- Item 2: clock driven back to `2026-09-12 08:00:00` (fires nothing).
- Item 3: the first `cold old-cold` landed on the launcher (the known post-install first-start
  behaviour; the repo's memory prescribes a second launch), so one `resume` brought the app forward:
  the Standard page for Sat 12 Sep 2026 with the mock's times (Asr 16:42, Magrib 19:47, Isha 20:58) and
  the mock storage's stored preferences visible: Magrib silent, every other row off. Later reads printed
  `DUMP FAILED` while the countdown animated, as the plan expects.
- Item 4: tapped Asr's bell (970,1124); the sheet read (second attempt, per section 10.1) shows the
  text `Asr` with the Athan/Reminder controls.
- Item 5: tapped Silent (540,1030), back, waited 10.
- Item 6 dump (`alarms-old-armed.txt`): `ACTION_FORCE_STOP_RESCHEDULE` 1,
  `NOTIFICATION_EVENT` 4. OLD_ALARMS=4. Armed instants, from the dump's `when=` lines:
  `2026-09-12 16:42:00.000` (Asr), `2026-09-12 19:47:00.000` (Magrib, the stored silent preference),
  `2026-09-13 16:40:00.000` (Asr), `2026-09-13 19:45:00.000` (Magrib, the same stored preference's
  second list day). Nothing is armed between 08:00 and 16:42 on 2026-09-12, so the drive to item 9's
  minute passes nothing.

## STOP, 12:07 17.09.2026, at the device proof 7.2 item 6 (GLM 5.3, execution session)

What I expected: the plan's item 6 bound "every armed instant it lists sits inside 2026-09-12 08:00 to
2026-09-13 17:00 ... An armed instant before 2026-09-12 16:40 other than none, or after 2026-09-13
17:00: section 2.2, item 7".

What I saw: the dump holds `when=2026-09-13 19:45:00.000`, Magrib silent, armed by the mock storage's
stored preference (Magrib silent was already stored before this session touched the phone; the screen
read at 08:01 shows "Magrib notification: silent", and the preserved tray pile holds
`athan_standard_magrib_2026-09-17`, a Magrib that fired on the previous mock build this morning). That
instant sits after the 17:00 bound, so the item routes here. The same stored preference makes 7.3 item
4's prediction unsatisfiable as written: it enumerates exactly eight armed instants at or after
2026-09-13 04:22 (the pair, Fajr, Asr, twice) with "Anything else: section 2.2, item 7", but the Magrib
silent preference persists through the whole proof and keeps Magrib 19:45 (09-13) and Magrib on 09-14
armed alongside them. The plan hedges over the storage elsewhere ("the mock storage's saved preferences
may arm rows besides the ones this phase taps", "Magrib 19:47 and Isha 20:58 on 2026-09-12, if the
storage's preferences arm them") and its tags and counts are otherwise exactly as predicted; the two
enumerations are the only places that leave the Magrib rows out.

The plan's question (section 2.2, item 7): "The alarm dump at section 7.2 item 6 holds
`when=2026-09-13 19:45:00.000` (Magrib silent, from the mock storage's stored preference). What do I
do?" If the answer changes the proof's predictions, the plan needs a refresh first (NEEDS REPLAN); if
it disarms the stored preference instead (a device action the plan does not give), that is the owner's
to choose.

Mid-proof stop per section 10.3: `devcheck.py auto` was run (recorded below), the phone stays on the
old mock build `athan-7-old.apk` (1.27.197) that item 1 installed, and the working tree holds only
this plan folder's `PLAN.md` and `LOG.md`, uncommitted. Step 1 stays merged and DONE; the row stays IN
PROGRESS with this question.

Wrap-up, 12:11 17.09.2026: `devcheck.py auto` returned the clock to real time (2026-09-17 12:11:22
BST), passing the four armed alarms; the old stacking build posted each under its own unique tag
(`tray-after-stop.txt`: `TRAY 4` with `athan_standard_asr_2026-09-12`,
`athan_standard_magrib_2026-09-12`, `athan_standard_asr_2026-09-13`,
`athan_standard_magrib_2026-09-13`, all on the fallback channel; the 09-17 Magrib of the original pile
no longer shows). `svc power stayon false` set; `auto_time` reads 1. A re-run of the proof re-records
`TRAY_START` from wherever the tray then stands.




## Resumed, 12:01 17.09.2026 (GLM 5.3, execution session, third successor)

No "Resume from" note existed; the state was verified from the repository, the sweep folder and the
predecessor's $TMPDIR logs, and matched the plan at every point:

- `uat-2` = `45754e60` (FINAL), checkout on it, tree holding only `PLAN.md` and `LOG.md` modified.
- Pre-flight re-run for the first unticked item (k=2): `VERSION 1.27.198`, `NEEDS FIRST nothing`,
  `PREFLIGHT OK`.
- 7.1 item 1 done by the predecessor: `build-7-new.log` ends `BUILD-MOCK OK`, `versionName 1.27.198`
  (= package.json), APK at `~/athan-device-sweep/session7/build/athan-7-new.apk` (78 MiB).
- 7.1 item 3 done by the predecessor: `new-apk-manifest.txt` greps `AthanNotificationsService` = 1,
  `expo.modules.notifications.service.NotificationsService` = 0, as predicted.
- 7.1 item 2 (the PARENT build) was still running in the worktree `mock-build` (started by the
  predecessor at 11:59); this session waited for it (it ended `BUILD-MOCK OK`, `versionName 1.27.197`).
  Mocks copy verified byte-identical to `scripts/mocks/fixed-days.ts.txt`.

## STOP, 12:07 17.09.2026, in the device proof at 7.2 item 1 (GLM 5.3, execution session, third successor)

A second execution session is driving the OnePlus 3T concurrently. Everything repository-side this
session did before the stop is recorded above; the phone was touched exactly once (the 7.2 item 1
install, below).

What I was doing: 7.2 item 1, installing the old build
(`devcheck.py install .../athan-7-old.apk`, started 12:03:24). Expected: `Success`, then the state
line with the parent's version and the device still on the real clock (`auto_time 1`, 7.0 item 6's
state, re-verified by this session at 12:00:22).

What happened instead: the post-install state line printed
`auto_time 0 device 2026-09-12 08:00:14 BST` at 12:04:06 — the 7.2 item 2 clock drive had already
run, at about 12:03:52, in the middle of my install. `devcheck.py`'s own `install` step only runs
`adb install -r` then `state()` (source verified, lines 117-121); it never touches the clock. Then
`~/athan-device-sweep/session5/mockcheck/` grew, while this session issued no device command at all:

- `old-cold` 12:04:16 (the cold launch landed on the launcher, so the app had not started),
- `old-after-wait` 12:04:58,
- `old-resumed` 12:05:27 (app up: Sat 12 Sep 2026, Asr 16:42, Magrib 19:47, Isha 20:58, matching
  the re-keyed fixed-days mock),
- `old-asr-sheet-2` 12:05:58 (the Asr alert sheet open, on label `-2`, a retry in the plan's own
  style).

So another live session is at 7.2 item 4-5 right now, arming Asr at Silent. `ps` shows an `opencode .`
process up since about 11:42, which fits the 11:45 predecessor still running: it was waiting on the
old build (finished 12:03:01) and continued on its notification, never having died. The orchestrator
that spawned this session believed it dead.

Two extra hazards. Both sessions share `$TMPDIR`, so plan-named log files can overwrite each other
(`install-7-old.log` already carries an ambiguous single install record). And a shared phone means
double taps would toggle bells off, double installs race adb, and interleaved clock drives corrupt
every prediction section 7 makes.

This session's own device actions in total: the one install (it printed `Success`, version 1.27.197,
correct for item 1; the other session's own item 1 either raced it harmlessly or observed it done).
No clock was moved, nothing tapped, no screenshot taken by this session. The mid-proof cleanup
(`devcheck.py auto`) was deliberately NOT run: the phone is mid-proof under the other session's
control and resetting the clock would sabotage it; the cleanup belongs to whoever finishes the proof.
No repository file changed except `PLAN.md`/`LOG.md` plan records.

Question for the owner: the device proof has two drivers. Shall I stand down and let the running
session finish it (recommended: it is mid-item-4 and on-script), or should that session be stopped
first so this one resumes from wherever the device actually stands? Until the answer, this session
touches neither the phone nor the repository outside this plan folder. Row stays IN PROGRESS. Asked
12:07 17.09.2026.

## Resumed, 12:15 17.09.2026 (GLM 5.3, execution session, fourth successor)

Spawned by the orchestrator at about 12:04 to finish the device proof; no "Resume from" note existed,
so this session reconstructed everything and changed no device state (reads only).

- Repository: checkout on `uat-2` = `45754e60` (FINAL), tree holding only `PLAN.md` and `LOG.md`
  modified. Pre-flight re-run for k=2: `VERSION 1.27.198`, `NEEDS FIRST nothing`, `PREFLIGHT OK`.
- 7.1 re-verified end to end from the artifacts: `build-7-new.log` and `build-7-old.log` both end
  `BUILD-MOCK OK` with `versionName 1.27.198` / `1.27.197`; the manifest greps re-run on both dumps
  give new 1/0 and old 0/1, as predicted.
- The concurrency the third successor stopped on is over: both earlier sessions stopped, the
  second successor (11:45, PID 45558) after its own item-6 stop and 10.3 cleanup. Timeline as the
  files show it: the 12:01 session's install ran 12:03:24-12:04:05 while the 11:45 session (waiting
  only on the old build, alive all along) set the clock back at about 12:03:52, cold-launched into
  the race (launcher showing), `resume`d the app up at 12:05:27, opened the Asr sheet (12:05:58),
  tapped Silent, and saved `alarms-old-armed.txt` at 12:06. It then stopped on the item-6 bound
  below, ran `devcheck.py auto` at 12:11 (clock back to real, the four armed alarms firing under the
  old stacking build: `tray-after-stop.txt` `TRAY 4`), and set `stayon false`, `auto_time` 1. No
  session has driven the phone since 12:11 (verified 12:13 and 12:15; PID 45558 has no device-driving
  children). Phone now: old mock build 1.27.197, real clock, `auto_time` 1, tray at 4.
- This session independently confirms the item-6 wall and its cause: `alarms-old-armed.txt` holds
  `ACTION_FORCE_STOP_RESCHEDULE` 1 and `NOTIFICATION_EVENT` 4 (`OLD_ALARMS=4`): Asr 2026-09-12
  16:42:00, Magrib 2026-09-12 19:47:00, Asr 2026-09-13 16:40:00, Magrib 2026-09-13 19:45:00 — the
  last named by the mock storage's stored Magrib-silent preference (visible in the 08:01 screen
  read), which also makes 7.3 item 4's exhaustive eight-instant list unsatisfiable (Magrib 09-13
  19:45 and 09-14's row stay armed alongside the eight). Nothing is armed between 08:00 and 16:42 on
  2026-09-12. Tags are otherwise exactly as predicted. The 10.3 cleanup consumed the armed state, so
  any continuation re-runs 7.2 from item 1 and re-records `TRAY_START` (now 4).

Asking the owner the plan's question (section 2.2, item 7): "The alarm dump at section 7.2 item 6
holds `when=2026-09-13 19:45:00.000` (Magrib silent, from the mock storage's stored preference).
What do I do?" Options offered: disarm the stored Magrib bell on the mock storage and re-run the
proof as written; refresh the plan (NEEDS REPLAN) so its enumerations include the stored rows; or
rule the rows licensed by the plan's own hedge and proceed. Until the answer this session touches
neither the phone nor the repository outside this plan folder. The row stays IN PROGRESS. Asked
12:15 17.09.2026.

The owner answered 12:16 17.09.2026: **disarm the stored Magrib bell and re-run the proof as
written** (of the three options offered). The ruling's effect: the mock storage's Magrib silent
preference is turned Off (one bell-sheet change on `athan-storage-dev`; the owner's real data is
untouched), after which 7.2 item 6's window and 7.3 item 4's eight-instant list hold as written and
the proof re-runs from 7.2 item 1, re-recording `TRAY_START` from wherever the tray then stands. The
owner was also asked to dismiss the earlier session's still-pending question so only this session
drives the phone.

### The disarm and the re-run's baseline, 12:20 17.09.2026

Keyguard: the 12:11 cleanup had let the screen lock; waking and one swipe cleared it (non-secure
lock; `showing=true` count back to 0), `svc power stayon usb` re-set. The app resumed to the Standard
page (Thu 17 Sep 2026, real times); two bare-page reads printed `DUMP FAILED` (the plan's own
expectation while the countdown animates), so the disarm tap was verified the plan's way, by the
sheet-open read: `disarm-sheet` shows the Magrib sheet; `Off (250,1030)` tapped, back, wait 10;
`disarm-check` then reads `Magrib notification: off` (Asr stays `silent`, as the plan expects it to
hold from 7.2).

New baseline for the re-run (`tray-start-2.txt`, `alarms-start-2.txt`):

- `TRAY_START=4`, the pile the 12:11 auto-return left: `athan_standard_asr_2026-09-12`,
  `athan_standard_magrib_2026-09-12`, `athan_standard_asr_2026-09-13`,
  `athan_standard_magrib_2026-09-13` (all the fallback channel; the original 09-17 Magrib pile entry
  no longer shows). Every `TRAY` prediction below is `TRAY_START + n` with this 4.
- Alarm tags: `ACTION_FORCE_STOP_RESCHEDULE` 1, `NOTIFICATION_EVENT` 2 (the disarm commit's
  reschedule: Asr 2026-09-17 16:34 and 2026-09-18 16:33, real dates, both after every drive this
  proof makes except the final `auto`), no other tags.

### 7.2 re-run

- Item 1: old build reinstalled, `Success`, version 1.27.197, clock still real (`install-7-old-2.log`).
- Item 2: clock driven back to `2026-09-12 08:00:00` (backward jump, nothing armed to fire; the two
  armed Asr alarms sat on real dates 09-17/09-18, both after every drive).
- Item 3: `cold old-cold-2` came up clean on the second post-install launch: Sat 12 Sep 2026, Asr
  16:42, Magrib 19:47 (bell now off), Asr bell silent (held), two `wait 15` passes run.
- Items 4-5: Asr's bell (970,1124) opened the sheet (`old-asr-sheet-3` reads `Asr`); Silent
  (540,1030) tapped, back, wait 10.
- Item 6 (`alarms-old-armed-2.txt`): `ACTION_FORCE_STOP_RESCHEDULE` 1, `NOTIFICATION_EVENT` 2.
  `OLD_ALARMS=2`: Asr 2026-09-12 16:42:00 and Asr 2026-09-13 16:40:00, both inside the plan's
  window, nothing else armed. (The owner's disarm made the plan's enumeration hold exactly.)
- Item 7: new build installed over it, `Success`, version 1.27.198, no force-stop or `am kill`.
- Item 8 (`alarms-after-update-2.txt`): `NOTIFICATION_EVENT` 4 = `AFTER_UPDATE_ALARMS`, each Asr
  instant twice (the re-arm plus the old build's dead double), as predicted.
- Item 9 (`alarms-before-asr-2.txt`): after the drive to 16:41:00 every armed instant is at or after
  16:42; nothing fires before Asr.
- Items 10-11: logcat cleared, clock driven to 16:42:30, wait 15; `fire-asr-2.logcat.txt`,
  `posts-asr-2.txt`, `tray-asr-2.txt` saved. AlarmManager triggered both PendingIntents at
  16:42:30.008/.009; the tray holds exactly one notification, `NOTIFY tag=athan-notification
  channel=expo_notifications_fallback_notification_channel` (a Silent alert's channel, as
  predicted); no old-tag notification was posted (the dead PendingIntent delivered nothing).

## STOP, 12:31 17.09.2026, at 7.2 item 11's readings (GLM 5.3, execution session)

Two letter-divergences, both fully diagnosed from saved evidence before anything else ran:

1. **`POSTS 0` where the plan expects `POSTS 1`.** `posts.py` counts
   `NotificationService: enqueueNotificationInternal` lines, but this device drops that DEBUG log
   line from its buffers (a fresh `logcat -d` shows none for any of the app's posts, including the
   four at 12:11). The system's own `notification_enqueue` EVENTS are logged and hold the truth: the
   last entry for the app is `09-12 16:42:30.095 ... com.mugtaba.athan,0,athan-notification,0,
   Notification(channel=expo_notifications_fallback_notification_channel` — exactly one post at the
   fire, under the shared tag, on the predicted channel, 87ms after the triggers; the second
   (dead-old-build) trigger produced no enqueue. The behavior the plan asserts is proven; only the
   tool's source buffer is wrong for this device state. (`MUTED 0` reads the same missing lines, so
   the muting race at 7.3 will record 0 whatever happens.)
2. **`TRAY 1` where the plan expects `TRAY_START + 1` = 5.** Android itself cancels an app's posted
   notifications when its package is replaced: both installs (12:21 old, 12:24 new) cancelled the
   four-notification pile, which now sits in `dumpsys notification`'s archive
   (`tray-asr-2.txt` lists all four old tags there, cancelled). No code of ours dismisses anything
   (decision 1 honored); the plan's model "the pile stays through the update" is what is wrong. The
   plan's own parenthetical says "only the shared-tag count is asserted", and that count is exactly
   one, on the right channel.

The acceptance criteria of item 11 cannot be satisfied as written, so per section 2.2, items 8 and
9: asking the owner. The phone is parked mid-proof on the frozen mock clock (16:42:45, 09-12), new
build installed, nothing else armed before Asr 09-13 16:40, which would fire at about 20:40 real
time if the proof stalls that long.

## Resumed, 12:22 17.09.2026 (GLM 5.3, execution session, fifth successor)

Spawned by the orchestrator to "continue 7.2 item 2 and finish end to end", on its belief that the
predecessor had died after leaving the old-build reinstall running. Reality differed, and this
session's record of it:

- The fourth successor (its `opencode .` process, up since 12:15:03) was alive and driving the phone
  the whole time. Its items 1-3 (install 12:20:52, clock back, cold `old-cold-2` 12:21:45) were
  already done when this session started reading, verified before touching anything:
  `versionName=1.27.197`, `lastUpdateTime=2026-09-17 12:21:00`, device at Sat 12 Sep 08:02, app up
  on the Standard page with the mock times and the disarm held (Asr silent, Magrib off).
- **This session's one interference, disclosed:** before detecting the other driver, it ran
  `devcheck.py resume old-resumed-2` at 12:24:36 (the launcher held focus, so the app looked like it
  needed bringing forward). That launched the NEW build's process (PID 21055) mid items 7-9, and
  that process then handled the Asr fire from the FOREGROUND, a path items 9-11 never take (the plan
  leaves the app killed by the update). The read raced the fourth successor's item-9 clock drive
  (`DUMP FAILED`, device jumping 08:02:59 to 16:41:06 under it), which is how the second driver
  became visible. After that this session issued no tap, no sheet change, no install and no clock
  drive until the 12:36 wrap-up below.
- The interference did not change the measured behaviour: the fire post landed at `16:42:30.095`
  (87 ms after both AlarmManager triggers at .008/.009), posted by PID 21055, exactly one,
  `tag=athan-notification`, fallback channel. The killed-app path the plan intended and the
  foreground path meet in the same override; only the posting process differs.

### Independent verification of the 12:31 STOP's two diagnoses, 12:33-12:36

Both re-derived from the saved evidence and the phone, reads only:

1. `POSTS 0` (plan expects 1): `logcat -b events -d` holds `09-12 16:42:30.095 ... notification_enqueue:
   [10186,21055,com.mugtaba.athan,0,athan-notification,0,Notification(channel=expo_notifications_fallback_notification_channel
   ...` — exactly one post at the fire, under the shared tag, on the predicted Silent channel, and no
   second enqueue for the dead old-build PendingIntent. The four 12:11 posts sit in the same events
   buffer, so enqueue events are always logged while the `NotificationService:
   enqueueNotificationInternal` DEBUG line `posts.py` greps is not (the fire logcat's system buffer
   begins exactly at the `logcat -c` instant, so nothing rotated away). `posts.py`'s source line is
   blind on this device; the behaviour it was to prove is shown by the events buffer and the tray.
2. `TRAY 1` (plan expects `TRAY_START + 1` = 5): the four pile entries sit in `tray-asr-2.txt`'s
   `mArchive` (all four old tags listed in one alphabetical sweep, beside the morning's 09-17
   Magrib): cancelled, not swiped. No app code dismisses anything: expo's
   `removeScheduledNotifications` only cancels alarm PendingIntents and stored requests, and the only
   `cancelAll` paths (`ExpoPresentationDelegate.dismissAllNotifications`, `BadgeHelper` at badge 0)
   are never called by this app. The two `install -r` runs (12:21 and 12:24) are the only sweep-like
   events in the window: a package replace cancels the app's posted notifications on this device.
   Decision 1 holds in code (no dismissal added); the plan's model of the pile surviving an update is
   what is wrong.

### Wrap-up per section 10.3, 12:36 17.09.2026

The owner question asked at 12:31 is unanswered, and section 2.2 items 8 and 9 are the plan's letter,
so the proof cannot continue past it and this session did not try. It applied the mid-proof wrap-up
the 12:31 STOP had left undone: `devcheck.py auto` (clock back to real 2026-09-17 12:36:26,
`auto_time` 1), which passed the still-armed Asr alarms (2026-09-13 16:40 twice, 2026-09-14 16:39
once); `tray-after-auto-2.txt` records the result: `TRAY 1`, still exactly one
`NOTIFY tag=athan-notification` on the fallback channel. Two more fires under the shared tag, and
the tray still holds one notification. `svc power stayon false` set, keyguard clear, phone left on
the new build 1.27.198.

Resume from: the device proof, the owner question asked at 12:31 (`POSTS 0` and `TRAY 1` at 7.2 item
11); 7.3 to 7.5 not started. The row stays IN PROGRESS; the working tree holds only this folder's
`PLAN.md` and `LOG.md`; this session committed nothing. Warning for the next driver: three execution
sessions have shared this phone today (the 11:42 one still sits dormant in the process list); only
the owner's answer to the 12:31 question may move it again, in whichever session the owner gives it
to.

The owner answered 12:34 17.09.2026: **continue with corrected readings** — `POSTS` from the
system's `notification_enqueue` events (posts.py's buffer gap noted in this LOG), the tray asserted
as "exactly one `tag=athan-notification` notification" (`TRAY` reads 1 after each fire from here,
the update having cleared the old pile), and section 8.1 written with these measured values plus
the note that the package replace itself cleared the pile. Plan text unchanged. From here:
`ASR_POSTS=1`, `ASR_MUTED=0` (from the missing-line source; the events buffer shows no mute is
even possible with one post), `TRAY 1` with the one shared-tag line.

### 7.3, interrupted at 12:36 17.09.2026 by the second driver

Item 1's drive to 2026-09-13 03:00 and `cold new-cold` ran clean (the cold's own read printed
`DUMP FAILED`, expected). Item 2 began: the Fajr sheet opened (`new-fajr-sheet` reads `Fajr`,
Sunday 13 Sep, Fajr 04:42). During the Sound/reminder taps the DEVICE CLOCK SNAPPED TO REAL TIME:
from 12:36:29 every devcheck line reads 2026-09-17 real time, `auto_time` is back to 1, and
`~/athan-device-sweep/session7/tray-after-auto-2.txt` appeared at 12:36 — a tray read this session
did not take, after an `auto` this session did not run. The other execution session (the 11:45 one,
still pending in its own window) resumed driving: the snap fired both armed Asr 16:40 alarms
(`notification_enqueue` 09-17 12:36:18.732 and .758, both under `athan-notification` — the shared
tag collapsed the double delivery into the one notification the tray shows), and consumed the
phase's armed state. My Fajr arming was interrupted mid-sheet (the `new-fajr-20` read printed
`DUMP FAILED`; whether the sheet survived the date re-render is unknown). No app alarms remain
(`ACTION_FORCE_STOP_RESCHEDULE` only).

The 7.2 phase's evidence and the owner's two rulings stand; the 7.3 phase must be re-run from its
item 1 once a single driver owns the phone. This session touches nothing further until the owner
says who drives.

## Plan amended by the planning session, 12:51 17.09.2026 (GLM 5.3, planning session)

The owner's 12:31 question (the two 7.2 item 11 letter-divergences, `POSTS 0` and `TRAY 1`) was
delegated entirely to the planning session by the orchestrator at 12:39, after the owner's 12:34 answer
(continue with corrected readings). Both diagnoses were re-verified from the live device and the saved
evidence before the plan was touched (reads only; the phone was not driven, and it stays as the 12:36
wrap-up left it: new build 1.27.198, real clock, `auto_time` 1):

1. `POSTS 0`: a live `logcat -b events -d` holds `09-12 16:42:30.095 ... notification_enqueue:
   [10186,21055,com.mugtaba.athan,0,athan-notification,0,Notification(channel=expo_notifications_fallback_notification_channel`
   (exactly one post at the re-run's Asr fire, shared tag, predicted channel, and no second enqueue for
   the dead old-build PendingIntent) alongside entries from every earlier clock epoch (09-15 to 09-17),
   so the events buffer survives `logcat -c` and holds every epoch the proof drove. The system-buffer
   save the old letter used (`fire-asr-2.logcat.txt`) holds zero `notification_enqueue` and zero
   `Muting` lines: the tool's source was blind, not the behaviour.
2. `TRAY 1`: `tray-asr-2.txt`'s Notification List holds exactly one record (`tag=athan-notification`,
   fallback channel); all four `TRAY_START` pile tags and the morning's 09-17 Magrib sit only in
   `mArchive` (cancelled, not swiped). No app code dismisses anything; the two `install -r` runs are the
   only sweep-like events in the window. Android cancels an app's posted notifications on package
   replace; the plan's pile-survives-the-update model was wrong.

The amendment, on branch `docs/plan-7-20260917-1252`, version 1.27.199, merged `--no-ff` into `uat-2`
and pushed (same sha range this entry's commit lands in):

- `scripts/device/posts.py` re-derived from the events buffer. It now reads a combined
  `logcat -d -b system,events` save and counts `notification_enqueue` lines for the package inside an
  inclusive `MM-DD HH:MM:SS` window given as two arguments (plain string compare). The window is
  required: real-epoch stamps (`09-17 ...`) sort above a mock-epoch floor (`09-13 ...`), so only a
  two-sided window keeps older epochs out. `MUTED` and `REFUSED` keep their system-line sources in the
  same save; this device drops those DEBUG lines, so `MUTED` records 0, per the owner's 12:34 ruling.
  Verified against a live combined dump before writing it into the plan: window `09-12 16:42:30` to
  `09-12 16:47:30` prints `POSTS 1` with the shared-tag line above; `09-13 04:22:00` to `09-13 04:27:00`
  prints `POSTS 0`; the 12:36 snap pair's window prints `POSTS 2`; the 12:11 window prints `POSTS 4`;
  a system-only save prints `POSTS 0`; bad arguments print usage and exit 2.
- The TRAY model corrected for package-replace cancellation: 2.2 item 8 now stops on any `TRAY` count
  other than 1 after a fire, a second shared-tag `NOTIFY` line, or any `PILE` tag reappearing; 7.0
  item 9 records `TRAY_START`/`PILE` only so the findings text can name what the replace cancelled;
  7.2 item 11, 7.3 items 5 and 6, and 7.4 assert `TRAY 1` with exactly one shared-tag `NOTIFY` line;
  sections 1, 2.1 decision 1, 4.5, 8.1, 8.2 and 12 state the corrected model (the update itself clears
  the stacked pile; decision 1's code consequence, no dismissal code anywhere, is unchanged).
- Every other acceptance line is untouched, and 7.2 item 11's already-measured readings stand as the
  owner ruled at 12:34: `ASR_POSTS=1`, `ASR_MUTED=0`, `TRAY 1` with the one shared-tag line.

Resume from: the device proof at 7.3 item 1, re-run (the 12:36 snap consumed the phase's armed state
and interrupted item 2 mid-sheet), under the amended letter, with one driver owning the phone. The row
stays IN PROGRESS; the working tree holds only this folder's plan files; nothing else changed.

The owner answered 12:41 17.09.2026, after a plain-language explanation of the two-driver
situation: **this session finishes; the owner is closing the 11:45 session's window**. Re-run
planned from 7.2 item 1 with everything already settled: Magrib disarmed, both readings rulings
recorded, both APKs built and verified.

### Reset to a clean slate, 12:43 17.09.2026

The interrupted Fajr sheet was still open (uncommitted: my three plus-taps had taken the stepper to
20 min; Fajr's stored athan was still off). Set clean before closing it, since every close commits:
Off (250,1030), reminder switch off (926,1266), back. The post-commit alarm dump holds exactly the
pre-7.3 baseline again: `NOTIFICATION_EVENT` 2 (Asr 2026-09-17 16:34, Asr 2026-09-18 16:33), the
screen re-woken and `stayon usb` re-set after the other session's cleanup let it lock. No clock
drive runs until the old session's window (PID 45558) is gone.







