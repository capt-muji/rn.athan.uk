# Plan: Session 9. Keep yesterday's still-due rows after 00:00

| Field | Value |
| --- | --- |
| Brief | `ai/prompts/keep-still-due-rows-after-midnight.md` |
| Planned at | `7289894a` (version 1.27.214), 2026-09-17; refreshed the same evening after the step 2 coverage stop |
| Planned by | Planning session on 2026-09-17, GLM 5.3 (design review: Software Architect on GLM 5.3); replanned 2026-09-17, GLM 5.3, after the owner ordered the missing coverage test added |
| Needs first | nothing |
| Steps | 2, each one branch, one commit, one version; then the device proof, section 7 |
| Device | OnePlus 3T: the installed 1.27.202 mock build is baselined (purge and disarm), then mock builds of `uat-2` head, then the final Asr-next mock build |
| Owner decisions still needed | None (every one was taken while planning; see section 2) |

## 1. Goal

A Magrib or Isha that falls after 00:00, or a Friday Istijaba beside a Magrib at 01:00 or later,
belongs to its own list day, but two parts of the app use the calendar day instead: a sequence
rebuilt after 00:00 starts at the new day, so those rows leave the screen on the next cold launch or
foreground sync, and the rolling alarm window counted from today makes the next reschedule treat
their armed alarms as stale and cancel them (finding 74, proven on the 3T on 2026-09-13). London is
unaffected today, and the defect goes live with the first high-latitude city in v2.0, which is why
this session must land before then.

When this plan is DONE, a day stays current until its last readable row has passed, on the screen and
in the alarms: a launch or reschedule at 00:00:40 still shows yesterday's list with its 00:40 Magrib
counted down to, re-attempts that row's alarm under its own identifier instead of cancelling it, and
the list and the window move on the moment the row has passed. The owner would notice, on a
high-latitude mock, that nothing goes silent after midnight any more.

The owner's rules that apply, quoted:
- `ai/prompts/keep-still-due-rows-after-midnight.md`, 2026-09-13: *"A day stays current until its
  last prayer has passed, not until 00 for both the screen and the alarms. Exactly, exactly,
  exactly."*
- The same brief's open question was answered by the owner on 2026-09-17 while planning this session:
  a day hands over after its last **readable** row, even when that row falls after 00:00 London, so
  the dashed-times rule of session 3 and this session's rule are one rule.
- The same brief: "Silent alerts, so the phone stays quiet" (the device proof arms nothing that can
  sound).
- The owner's 2026-09-17 delegation, recorded in `ai/prompts/README.md`: "The planning session owns
  every planning question", and the 2026-09-16 testing licence: "you can build whatever you want,
  you can throw away whatever you want. It needs to be bulletproof."

## 2. Decisions

### 2.1 Taken

1. **A day hands over after its last readable row, never at 00:00 while a readable row of that day is
   still to come.** Owner, 2026-09-17, answering this session's first question, confirming the
   2026-09-13 ruling and the session-3 default as one rule. On the mock's Friday with Isha dashed,
   the list stays until the 00:40 Magrib has passed. Recorded in `ai/prompts/README.md`.
2. **The evening-Suhoor buffer loss (gap map L4) stays out of this session.** Owner, 2026-09-17: a
   Suhoor wrapped onto the evening before loses a day of buffer, but this session fixes the
   post-midnight rows only; that defect keeps its place in "Waiting on the owner, not yet sessions".
   Recorded in `ai/prompts/README.md`.
3. **The screen half is fixed inside `setSequence`, through one new helper.** Planner: every path that
   rebuilds a sequence (cold launch, foreground sync, the cache bootstrap) goes through
   `setSequence`, and `resolveDisplayDate` in `shared/sequence.ts` already holds the rule, so nothing
   in the pure rules module changes. The helper `firstStillDueListDay` looks back exactly one day.
4. **The alarm window's start moves; its length never does.** Planner, under the owner's delegation:
   while yesterday is still due the window is [yesterday, today], so the newest day drops out until
   yesterday's last row passes. `rollingDaysForPrayer` and `NOTIFICATION_ROLLING_DAYS` are untouched,
   which keeps the iOS 64-pending ceiling arithmetic in `shared/__tests__/constants.test.ts` exactly
   valid (widening to three list days would reach 70 of 64).
5. **`canStillFire` counts a record of yesterday's list until the 06:00 cutoff.** Planner, adopting
   the design review's finding 1: the old date test treated a still-due yesterday record as spent, so
   a phone that refused to cancel one would have its record deleted, the refusal uncounted and the
   repair unable to reach an alarm that then fires for a prayer the user turned off. The cutoff shape
   (not a re-read of the prayer data) also keeps the record for a row whose data turned unreadable
   after arming, matching how today-dated records already behave.
6. **The `findPreviousPrayer` storage guard is kept, not deleted.** Planner: the fixed build can no
   longer produce a sequence that lacks a still-due yesterday, so the guard's rejection branch is
   unreachable through the app, but it protects the bar against exactly a future edit that brings
   such a sequence back. It stays, pinned by a test that hand-builds the pre-fix sequence shape, the
   input that edit would bring.
7. **`refreshSequence`, `extendUntilReadable`, `stores/bootstrap.ts`, the empty-cache guard and
   `stores/widget.ts` are not changed.** Planner: the merge and filter paths of `refreshSequence`
   already keep still-due rows that are in the sequence; the bootstrap only decides whether to
   hydrate at all; the guard's bail is the safe direction (it arms and cancels nothing, and the
   download that lands reopens the gate), so only its comment is corrected; the widget layer builds
   its own sequence and is flagged off.
8. **The window retreat's starvation edge is accepted and documented.** Planner: while yesterday is
   still due (at most about six hours), the newest list day is unarmed until the next reschedule,
   which the 12-hour gate and the 6-hour background task bound; a silence beyond that needs both
   refresh layers starved for over a day, which the pre-fix code also needed. No code is built for
   it. Recorded in the findings text.
9. **The device proof arms Friday's Magrib and Isha at Silent only, after purging every armed alarm
   and disarming the three bells the last session left stored.** Planner, under the owner's
   delegation and standing 3T rulings: silent alerts keep the phone quiet, the purge and disarm give
   the proof a zero baseline it creates itself (the session 7 lesson), and the owner's real data in
   `athan-storage` is never touched because a mock build only opens `athan-storage-dev`.
10. **Two steps, the screen half first.** Planner: each leaves `uat-2` green, each is one branch, one
    commit, one version, one review.
11. **The step 2 coverage gap is closed by a test, not by narrowing the change.** Owner, 2026-09-17,
    answering the executor's stop: the step 2 commit was refused by the 100% coverage gate because no
    named test ever called `canStillFire` with a record older than yesterday (`stores/notifications.ts`
    line 120's `return false`). The owner chose "add the missing test" over merging without it, so the
    refreshed step 2 carries a sixth alarm test that refuses a cancel of a record two days old and
    asserts the record is dropped, and a fifth break pins the same decision. Recorded in
    `ai/prompts/README.md`.

### 2.2 The executor must not decide

STOP, append what you saw to `LOG.md`, and ask the owner the question given, whenever one of these
happens:

1. **An anchor count other than 1**, in the pre-flight or a step's part 0. This is NEEDS REPLAN
   (`EXECUTOR-BRIEF.md` section 1, item 4). Tell the owner: "Anchor `<id>` counts `<n>` in `<file>`,
   so the plan is out of date. Please run the planning prompt."
2. **The pre-flight prints any line it does not predict, or a `PREFLIGHT FAILED` line.** Ask: "The
   pre-flight failed: `<line>`. What do I do?"
3. **The phone's installed `versionName` at 7.0 is not `1.27.202`.** Ask: "The 3T runs
   `versionName=<value>`, not 1.27.202, so it is not the build this plan baselined. What do I do?"
4. **A test fails that the step's red or green prediction does not name, or a named test passes in
   the red run.** Ask: "The `<step> <red|green> run printed `<Tests line>`; the plan expects
   `<prediction>`. What do I do?"
5. **A break prints `BREAK NOT APPLIED` or `NOT AS EXPECTED`.** Ask: "break `<name>` did not behave
   as the plan says: `<that line>`. What do I do?"
6. **A Code Reviewer (GLM 5.3) finding that section 10 does not answer word for word and that does
   not meet all three conditions of `EXECUTOR-BRIEF.md` section 4, item 8.** Ask: "The reviewer asks:
   `<finding in its words>`. The plan gives no fix for it. Do you want it applied (the plan is then
   refreshed first), or shall I merge without it?"
7. **An alarm dump holds any app alarm, tag or armed instant the item reading it does not predict.**
   Ask: "The alarm dump at section 7 `<item>` holds `<line>`. What do I do?" A clock drive fires
   every armed alarm it passes, so this check comes before every drive.
8. **An armed instant later than `2026-09-25 06:00:00` appears in the baseline inventory.** Ask: "The
   phone holds an alarm at `<instant>`, past the purge bound this plan gives. What do I do?"
9. **A `read` after a tap shows a sheet on the wrong prayer, or a stored state other than the one the
   item predicts.** Ask: "The sheet at section 7 `<item>` showed `<what the read shows>`, not
   `<the prediction>`. What do I do?" Never tap around a wrong sheet.
10. **A `posts.py` or `tray.py` reading is not what its item predicts.** Ask: "The fire in section 7
    `<item>` produced `<posts.py or tray.py output>`. What do I do?"
11. **A logcat grep the plan names finds nothing (the sequence start, a Scheduled identifier, or a
    forbidden Cancelled line).** Ask: "The log at section 7 `<item>` does not hold `<the grep>`; what
    it holds instead is `<the closest lines>`. What do I do?"
12. **The `vision` subagent (GLM 5.3 Flash) answers anything but YES on the retry.** Ask: "vision read
    `<file>` as `<answer>`; the plan expects YES. What do I do?"
13. **Another session is driving the phone: a `ps` listing holds an `opencode` process this session
    does not own, or a file under `~/athan-device-sweep/session5/mockcheck/` changes that this
    session did not write.** Stand down at once, change nothing, and ask: "Another session is driving
    the 3T. Which one owns the proof?"
14. **The phone is locked, off the cable, or adb hangs twice.** Ask: "Please unlock the OnePlus 3T,
    keep it on the cable and on its home screen, and reply when that is done."
15. **Anything that would touch visuals, a prayer time, `releases.json`, the `uat` branch or EAS.**
    Ask: "Step `<where>` would change `<what>`, which this plan forbids. What do I do?"

## 3. Pre-flight

Copy the saved script and run it: `cp
ai/plans/09-keep-still-due-rows-after-midnight/scripts/preflight.sh $TMPDIR/preflight-9.sh && bash
$TMPDIR/preflight-9.sh <k>`, where `<k>` is the first item of section 6's checklist not ticked DONE
(1, 2 or 3; 3 is the device proof).

The script is saved as `ai/plans/09-keep-still-due-rows-after-midnight/scripts/preflight.sh`. It
checks the checkout, the branch, the tree (only the three plan files may be dirty), `origin/uat-2`,
the version (never lower than 1.27.214, the refreshed planning commit's), "Needs first", this step's
anchors, step 1's work being present when `<k>` is 2 or 3, the fixed-days mock's keying on the five driven
dates, the device scripts, jest, node, python3, perl, `android/app/build.gradle`, `mocks/simple.ts`,
and the 3T itself. Expected output:

```text
VERSION <the version uat-2 carries, 1.27.214 or higher>
NEEDS FIRST nothing
ANCHOR <id> <file> 1
<one line per anchor of step <k>>
STEP1 PRESENT <only printed when <k> is 2 or 3>
MOCK KEYED
PREFLIGHT OK
```

- The last line is `PREFLIGHT OK`: go on.
- A line starting `PREFLIGHT NEEDS REPLAN`: NEEDS REPLAN (section 2.2, item 1).
- A line starting `PREFLIGHT FAILED`: STOP and ask "The pre-flight failed: `<line>`. What do I do?".

## 4. Background the executor needs

### 4.1 Code map

| File | What it does | This plan |
| --- | --- | --- |
| `shared/sequence.ts` | The pure rules: which list day shows, what is next, the row the bar measures from. `resolveDisplayDate` already picks the earliest list day with a readable row to come, and `waitsForItsEnd` already hands a day over at its own 00:00 only when no readable row of it is left | Read only: the rules are right; the sequence simply never contained yesterday after 00:00 |
| `shared/prayer.ts` | The list builders over storage: `createPrayerSequence` (explicit start day), `createPrayersForDate`, `getPrayerForDate`. Midnight/Last Third and Istijaba carry exact instants; Magrib and Isha in the small hours shift their instant to the next calendar day and keep their own list day | Step 1 adds `firstStillDueListDay`; step 2 adds `firstStillDueListDayForPrayer` |
| `stores/schedule.ts` | Holds the sequences and the derived atoms. `setSequence` builds three list days from a start instant and skips identical writes; `refreshSequence` filters passed rows and fetches more, keeping still-to-cue rows; `findPreviousPrayer` falls back to the list before from storage with a guard against a still-to-come row | Step 1 changes where `setSequence` starts |
| `shared/notifications.ts` | The window arithmetic: `genNextXDays` (today-anchored), `rollingDaysForPrayer` (2 list days, 3 for Midnight and Last Third), `genScheduleDatesForPrayer` (the single source both schedule paths read) | Step 2 gives `genNextXDays` an optional start and `genScheduleDatesForPrayer` the still-due start |
| `stores/notifications.ts` | The scheduling paths, the stale-cancel, the repair marks, the sweep, the empty-cache guard, `canStillFire` | Step 2 changes `canStillFire`, its `ISLAMIC_DAY,` import line and one comment only |
| `stores/sync.ts`, `stores/bootstrap.ts`, `device/listeners.ts`, `stores/countdown.ts` | The rebuild and tick paths that call `setSequence` (launch, foreground return, bootstrap) and the boundary ticker | Read only: they inherit the fix |
| `shared/constants.ts` + `shared/__tests__/constants.test.ts` | `NOTIFICATION_ROLLING_DAYS = 2` with the iOS 64-pending ceiling computed from `rollingDaysForPrayer` | Read only: the window length is untouched, so the ceiling proof stands |
| `stores/__tests__/alarmHarness.ts` | The in-memory OS the alarm suites arm through | Read only: step 2's tests import more of it |

### 4.2 Anchors

Every anchor is saved in full under `scripts/anchors/`, listed in `anchors/manifest.txt`, and counted
by `scripts/check-anchors.sh`. All were counted 1 at `07042baf`, and all eleven of step 2's were
counted 1 again at `7289894a` after step 1 merged: anchor `2-2` anchors the import line step 1
inserts (`import { findNextReadable } from '@/shared/sequence';`), which now sits on `uat-2` itself.
Its file is `shared/prayer.ts`.

| Anchor | File | What it locates | Used by |
| --- | --- | --- | --- |
| `1-1` | `shared/prayer.ts` | the constants import block's end and the TimeUtils import: the sequence-import line goes between | step 1 |
| `1-2` | `shared/prayer.ts` | the `getPrayerForDate` export: the new helper goes after it | step 1 |
| `1-3` | `stores/schedule.ts` | `setSequence`'s opening lines | step 1 |
| `1-4` | `stores/schedule.ts` | the `findPreviousPrayer` storage guard line (kept unchanged; break 1c's target) | step 1 |
| `1-5`, `1-6` | `stores/__tests__/schedule.test.ts` | the prayer mock declarations and factory | step 1 |
| `1-7`, `1-8` | `stores/__tests__/schedule.test.ts` | the interim comment (rewrite start) and the `it.each([` that follows the rewritten region (rewrite end) | step 1 |
| `1-9`, `1-10` | `stores/__tests__/schedule.test.ts` | the two scripted `toHaveBeenCalledWith` assertions | step 1 |
| `1-11`, `1-12` | `stores/__tests__/schedule.test.ts` | the real-builder `beforeEach` destructure and wiring | step 1 |
| `1-13`, `1-14` | `shared/__tests__/prayer.test.ts` | the import list's neighbourhood and the file's end | step 1 |
| `2-1` | `shared/prayer.ts` | the `getPrayerForDate` export again (unchanged by step 1): the second helper goes between it and step 1's helper | step 2 |
| `2-2` | `shared/prayer.ts` | step 1's inserted import line (gains `, isReadable`) | step 2 |
| `2-3` | `shared/notifications.ts` | the logger/TimeUtils import pair: the PrayerUtils import goes between | step 2 |
| `2-4`, `2-5` | `shared/notifications.ts` | `genNextXDays` and `genScheduleDatesForPrayer` | step 2 |
| `2-6`, `2-7` | `stores/notifications.ts` | `canStillFire` and the empty-cache guard's first comment line | step 2 |
| `2-11` | `stores/notifications.ts` | the constants import pair `EXTRAS_ARABIC,`/`EXTRAS_ENGLISH,`: the `ISLAMIC_DAY,` line goes after | step 2 |
| `2-8`, `2-9` | `stores/__tests__/notificationsAroundMidnight.test.ts` | the import block and the file's end | step 2 |
| `2-10` | `shared/__tests__/notifications.test.ts` | the `generates consecutive days` test: the new test goes before it | step 2 |

### 4.3 How the pieces interact

| Event | What happens today | What happens after this plan |
| --- | --- | --- |
| Cold launch / foreground sync (`sync` → `initializeAppState` → `setSequence`; `bootstrap` hydrate) | The sequence starts at today, so yesterday's still-due rows are absent and the screen shows the new day | `setSequence` asks `firstStillDueListDay` and starts at yesterday while it is still due; `resolveDisplayDate` then keeps yesterday's list on screen |
| The wall clock reaching 00:00 with the app open | The sequence still holds yesterday (it was built before), so the screen already stays; nothing is a boundary while a row is due | Unchanged; the ticker's boundary is the row itself, never a 00:00 while the row is due |
| A reschedule between 00:00 and the row (cold launch gate, 12-hour gate, a sheet commit, the background task) | The window starts at today; the yesterday record is stale, its alarm cancelled | The window starts at the still-due day; the yesterday identifier is re-attempted atomically under its own id; only a reminder whose moment passed is stale |
| The row's instant passing | (If the alarm survived) nothing reschedules by itself; the window still starts at today | The next reschedule's start is today again; the yesterday records go stale exactly then; the screen rolls at the row's boundary |
| A download landing while a reschedule runs | `getArmedDayChanges` reopens the gate | Unchanged; the shifted window changes nothing about the ordering |
| A refused cancel of a still-due yesterday record | `canStillFire` called it spent, the record was deleted and the repair lost the handle | The record is kept until the 06:00 cutoff, the refusal counted, the repair can reach the alarm |
| A long suspension across 00:00 and the rows | `resyncCountdowns` → `refreshSequence` keeps still-due rows only if already in the sequence; a rebuild dropped them | The sequence from before is kept as today; any rebuild starts at the still-due day, so the rows survive either way |

### 4.4 Existing tests that cover this code

`shared/__tests__/sequence.test.ts` pins every rule the fix rides on (including the mock's Friday and
the dashed-Magrib walk); `stores/__tests__/schedule.test.ts` pins the store over the real builder,
including the two interim blocks this plan rewrites and gap map L3; the alarm suites
(`notificationsAroundMidnight`, `notificationsFridayIstijaba`, `notificationsClockChange`, the
`reschedule strategy` and unreadable-times describes in `notifications.test.ts`) pin window shapes
whose frozen clocks and seeded days never leave a yesterday row still due, so they stay green and
prove London unchanged; `shared/__tests__/constants.test.ts` pins the ceiling arithmetic.

### 4.5 Why the obvious simple fixes are wrong

- **Start every sequence at yesterday unconditionally** (the widget layer's own precedent): it
  changes the sequence shape for every London day, re-rendering rows no pixel needs, and for the
  alarm window it is a three-list-day window of 70 pending requests against iOS's 64 ceiling.
- **Widen the window to three list days instead of shifting it:** the same 70-of-64 breach, and it
  arms two dead days to reach one live row.
- **Special-case the prayers by name (Isha, Magrib, Istijaba):** the rule is about rows and instants,
  not names; a named list is a second copy of `MIDNIGHT_CROSSING_PRAYERS` that the next prayer edit
  breaks silently. The generic one-day look-back is provably sufficient (a row of any earlier list
  falls before 06:00 of the day after its own).
- **Delete the `findPreviousPrayer` storage guard as dead code:** it is exactly the protection this
  bug was about; the codebase's rule is to keep such a line and pin it with the input a future edit
  would bring.

## 5. Design

- **Approach.** One rule, one wording, applied at the two places that read the calendar day: the
  sequence build (`setSequence` via `firstStillDueListDay`) and the alarm window
  (`genScheduleDatesForPrayer` via `firstStillDueListDayForPrayer`). The pure rules in
  `shared/sequence.ts`, the window's length, the guard, the bootstrap, the sweep and the widget layer
  are untouched. `canStillFire` learns the same one-day look-back so the refusal bookkeeping this
  session protects stays honest.
- **Invariant, one sentence a test can check:** after 00:00, while yesterday's list still has a
  readable row to come, the sequence holds yesterday's list (the screen shows it, the countdown names
  its row, the bar measures into it) and every alarm window that covers a prayer of yesterday
  includes yesterday's list day, re-arming its identifier; from the row's own instant, both start at
  today again.
- **Proof the look-back needs only one day:** a row of the day-before-yesterday's list falls no later
  than 05:59 yesterday (the 06:00 cutoff bounds every midnight-crossing shift, Istijaba precedes
  Magrib's instant, night rows fall the evening before their list day), so no moment today can be
  before one.
- **Alternatives rejected:** see section 4.5, and: moving the start-day decision inside
  `createPrayerSequence` (rejected: `refreshSequence`'s rebuild passes an explicit first day and
  would then pull yesterday in behind the merge's back); one helper with an optional prayer name
  (rejected: two names with two contracts read clearer in the tests and give the breaks stable
  targets).
- **Concurrency trace:** section 4.3.
- **Design review.** A Software Architect subagent (GLM 5.3) attacked the design on 2026-09-17 and
  returned "design flawed" on one finding, which this plan adopts as decision 5 and step 2 carries:
  the old `canStillFire` broke exactly the refusal path this session protects. Its finding 2 (the
  window retreat leaves the newest day unarmed briefly) became decision 8; finding 3 (two clock reads
  in one build) is step 1's single-instant rule; finding 4 (the empty-cache guard comment) is step
  2's comment-only edit; findings 5 and 6 confirmed the planned test rewrites and the asymmetry of
  the two helpers as justified. Everything else it attacked survived: the one-day look-back, the
  identity-skip, the interleavings, London byte-identical across both clock changes and 1 January,
  the widget layer, and the ceiling arithmetic.
- **Spike.** The whole change was built in a throwaway worktree at `07042baf` and thrown away, as the
  brief requires, and rebuilt at `7289894a` for the replan from the executor's saved step 2 work,
  with the owner's missing test added, and thrown away again. Measured there, and quoted in the
  steps: the step 1 red run
  (`Tests: 10 failed, 211 passed, 221 total`) with each named failure's first line; the step 2 red
  run (`Tests: 11 failed, 194 passed, 205 total`); both green runs (step 2:
  `Tests: 205 passed, 205 total`); the step-1-only tree passing the
  whole suite at `Tests: 2 skipped, 4515 passed, 4517 total`; the final tree at
  `Tests: 2 skipped, 4528 passed, 4530 total` (159 suites) with `npx tsc --noEmit` and
  `npx biome check . --error-on-warnings` both exit 0, coverage 100% on all four measures; and all
  eight breaks landing (`ALL AS EXPECTED: 1`, step 2's five including the replan's `2e`). One trap
  the spike caught that the plan carries: `Date.parse` rejects an
  unpadded `T6:00`, so `canStillFire`'s cutoff hour is padded. One more, caught by the replan's own
  first attempt: a `perl` substitution whose search text holds a bare `(` opens a regex group instead
  of matching the literal parenthesis, so break `2e`'s search text escapes both of `if (...)`'s
  parens.

## 6. Steps

- [x] Step 1: the sequence starts from the earliest list day that is still current (specified;
      `steps/1-sequence-starts-from-still-due-day.md`) DONE in 248d971d10b055e449743af6f065300e97123305
- [x] Step 2: DONE in 88be6ef004112cb2faf7358bd757ebfbabf07ca8
- [x] Device proof: DONE

Each step is written out in full in its file under `steps/`, is one branch, one commit, one version,
one review, one merge, and leaves `uat-2` green. Do not start a step until the previous one is
merged; do not start the device proof until both are merged.

## 7. Device proof

Run this after the pre-flight with `<k>` = 3, in ONE session, start to end. Every command runs from
`/Users/muji/repos/rn.athan.uk`. The owner receives no screenshots: only the `vision` subagent
(GLM 5.3 Flash) reads them. Every silent alert posts on the Silent fallback channel, so nothing
sounds.

Measured while planning and used below (session 7's audited end state, `AUDIT.md` of
`ai/plans/07-replace-previous-notification/`): the 3T runs the mock build `versionName=1.27.202`,
real clock, `auto_time` 1, unlocked with Athan open and stay-awake on, and holds four app alarms
(2026-09-18 03:43 twice, 04:03, 16:58) beside the year-2036 WorkManager alarm
(`ACTION_FORCE_STOP_RESCHEDULE`, `when=2036-09-12 04:40:40.505`, on every 3T dump), from the three
bells that build left stored: Fajr Sound with its 20-minute reminder at Sound, Suhoor Sound, Asr
Silent, every other row Off. Anything the baseline below finds outside these predictions is a STOP,
not an adaptation. The bell column is `x=970`, rows 150 pixels apart (Fajr 674, Sunrise 824, Dhuhr
974, Asr 1124, Magrib 1274, Isha 1424 on Standard); the alert sheet's options sit at Off (250,1030),
Silent (540,1030), Sound (831,1030); the Extras page swipe is `input swipe 900 300 150 300 300`.
Every tap is verified by the next `read`, which works while a sheet is open.

### 7.0 Preparation and the zero baseline

1. Run `date '+%H:%M'` and write the time in `LOG.md` as this session's start. If the time is 23:00
   or later, stop and continue after 00:15 (`EXECUTOR-BRIEF.md` section 3): the proof needs about 50
   minutes plus two builds, must not cross midnight, and the nightly job clears build folders at
   00:00. Tell the owner, word for word, before anything else: "The device proof starts now and
   needs about an hour. The phone is on test builds throughout; your real alerts come back with the
   final Asr-next mock build, which the last step installs. Nothing here needs your hands, and every
   alert it arms is silent."
2. Run `mkdir -p ~/athan-device-sweep/session9/build ~/athan-device-sweep/session9/mocks`.
3. Run `cp ai/plans/09-keep-still-due-rows-after-midnight/scripts/mocks/fixed-days.ts.txt ~/athan-device-sweep/session9/mocks/fixed-days.ts`.
4. Run `git rev-parse uat-2` and write the sha in `LOG.md` as `FINAL=<sha>`: every `<FINAL>` below is
   that sha.
5. Run `adb -s 8f7ada76 get-state`. Expected: `device`.
6. Run `adb -s 8f7ada76 shell settings get global auto_time`. Expected: `1`.
7. Run `adb -s 8f7ada76 shell dumpsys window policy | grep -c 'showing=true' || true`. Expected: `0`.
   `1` means the phone is locked: section 2.2, item 14.
8. Run `adb -s 8f7ada76 shell svc power stayon usb`.
9. Run `adb -s 8f7ada76 shell dumpsys package com.mugtaba.athan | grep versionName`. Expected:
   `versionName=1.27.202`. Any other version: section 2.2, item 3.
10. Single-driver check: run `ps -axo pid,lstart,command | grep '[o]pencode'` and
    `ls -lt ~/athan-device-sweep/session5/mockcheck | head -4`, and record both in `LOG.md`. An
    `opencode` process whose start time is later than this session's start is another session
    arriving: section 2.2, item 13. A process that predates this session may be the orchestrator:
    record it, do not stop on it, and watch the other signal, a file under
    `~/athan-device-sweep/session5/mockcheck/` that changes when this session did not write it.
11. Baseline alarm inventory: run
    `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session9/alarms-baseline.txt`. Two
    commands read every dump below; run them on the dump each item names. The tag count:
    `grep -A1 'com.mugtaba.athan}' <dump> | grep -o 'tag=\*walarm\*:[A-Za-z_.]*' | sort | uniq -c`.
    The instant list:
    `grep -A2 'com.mugtaba.athan}' <dump> | awk '/^ +tag=/{tag=$1} /when=/{sub(/.*when=/,"when="); print tag, $0}' | sort | uniq -c`.
    Expected here: one `ACTION_FORCE_STOP_RESCHEDULE` line with count 1, and one `NOTIFICATION_EVENT`
    line whose count is `BASELINE_ALARMS=<n>` with every instant among 2026-09-18 03:43, 04:03,
    16:58 or on the real today/tomorrow (the mock build's own refresh may have re-armed). Write
    `BASELINE_ALARMS` and every instant in `LOG.md`. Any other tag: section 2.2, item 7. Any armed
    instant later than `2026-09-25 06:00:00`: section 2.2, item 8.
12. The purge, only if `BASELINE_ALARMS` is not 0: compute the purge target as the latest armed
    `NOTIFICATION_EVENT` instant plus 5 minutes, formatted `YYYY-MM-DD HH:MM:SS`, and write it in
    `LOG.md` as `PURGE_TO=`. Then `adb -s 8f7ada76 shell logcat -c`, then
    `python3 ~/athan-device-sweep/session5/bin/devcheck.py clock "$PURGE_TO"`, then
    `python3 ~/athan-device-sweep/session5/bin/devcheck.py wait 15`. Every armed alarm fires once
    under the shared tag (some carry the session-7 bells' sounds; the owner licensed exactly this).
    Then `adb -s 8f7ada76 shell logcat -d -b system,events > ~/athan-device-sweep/session9/fire-purge.logcat.txt`,
    then `python3 ai/plans/09-keep-still-due-rows-after-midnight/scripts/device/posts.py ~/athan-device-sweep/session9/fire-purge.logcat.txt '<PURGE_TO minus 1 minute, MM-DD HH:MM:SS>' '<PURGE_TO plus 10 minutes, MM-DD HH:MM:SS>' | tee $TMPDIR/posts-purge.txt`.
    Expected: `POSTS <BASELINE_ALARMS>`, `MUTED` any value (record), `REFUSED 0`. Then
    `python3 ~/athan-device-sweep/session5/bin/devcheck.py auto`, then
    `adb -s 8f7ada76 shell settings get global auto_time` (expected `1`), then a fresh dump as
    `~/athan-device-sweep/session9/alarms-after-purge.txt` and the tag count: expected
    `NOTIFICATION_EVENT` count 0. If it is not 0, run this item's purge once more from the new dump's
    latest instant; a second nonzero result: section 2.2, item 7. Write `PURGE_POSTS=<n>` in `LOG.md`.
13. The disarm, on the installed build. Cold launch:
    `python3 ~/athan-device-sweep/session5/bin/devcheck.py cold disarm-cold > $TMPDIR/cold-9-disarm.log 2>&1`
    in the background, then `devcheck.py wait 15` twice. If the app did not come up (the launcher
    holds focus), run `devcheck.py resume disarm-resumed` once and `wait 15`; a second failure:
    section 2.2, item 14. Then disarm the three bells the mock storage holds:
    1. Fajr (Sound, with its reminder): `devcheck.py tap 970 674`, `wait 3`,
       `read disarm-fajr-sheet`. Expected in the read: the text `Fajr` and Fajr's notification state
       reading `sound`. Then `tap 250 1030` (Off; one Off tap disarms the row's reminder too),
       `key back`, `wait 10`.
    2. Asr (Silent): `tap 970 1124`, `wait 3`, `read disarm-asr-sheet`. Expected: the text `Asr`, the
       state `silent`. Then `tap 250 1030`, `key back`, `wait 10`.
    3. Suhoor (Sound): `adb -s 8f7ada76 shell input swipe 900 300 150 300 300`, `wait 3`,
       `tap 970 974`, `wait 3`, `read disarm-suhoor-sheet`. Expected: the text `Suhoor`, the state
       `sound`. Then `tap 250 1030`, `key back`, `wait 10`.

    A read that fails while the countdown animates: `wait 3` and `read` once more with a `-2` label;
    a second failure, or a sheet on any other prayer or state: section 2.2, item 9.
14. The zero verify: `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session9/alarms-disarmed.txt`,
    then the tag count. Expected: exactly one line, `ACTION_FORCE_STOP_RESCHEDULE` count 1, and
    `NOTIFICATION_EVENT` count 0. Nonzero: section 2.2, item 7. Write `DISARMED_ALARMS=0` in
    `LOG.md`. The baseline is done; every prediction from here is exact.

### 7.1 The fixed-days build, Friday's list armed

1. Build in the background:
   `zsh ~/athan-device-sweep/session3/bin/build-mock.zsh <FINAL> ~/athan-device-sweep/session9/mocks/fixed-days.ts ~/athan-device-sweep/session9/build/athan-9.apk > $TMPDIR/build-9.log 2>&1`.
   Expected: the log holds `BUILD-MOCK OK`, and after it a line starting `versionName` that ends with
   the version `node -p 'require("./package.json").version'` prints. This is the mock storage
   (`athan-storage-dev`); the owner's data is untouched.
2. Drive the clock to Friday morning, passing nothing (the baseline holds zero app alarms):
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py clock '2026-09-25 07:00:00'`. Expected: a
   line naming the device time it set.
3. Install: `python3 ~/athan-device-sweep/session5/bin/devcheck.py install ~/athan-device-sweep/session9/build/athan-9.apk > $TMPDIR/install-9.log 2>&1`.
   Expected: a line containing `Success`, then a state line with `<FINAL>`'s version.
4. Cold launch: `devcheck.py cold friday-morning > $TMPDIR/cold-9-friday.log 2>&1` in the
   background, then `wait 15` twice. The launcher retry is 7.0 item 13's. The launch downloads the
   five fixed days and builds both lists from Friday.
5. Arm Magrib at Silent: `devcheck.py tap 970 1274`, `wait 3`, `read magrib-sheet`. Expected in the
   read's summary: the text `Magrib`. Then `tap 540 1030` (Silent), `key back`, `wait 10` (the commit
   arms two list days).
6. Arm Isha at Silent: `devcheck.py tap 970 1424`, `wait 3`, `read isha-sheet`. Expected: the text
   `Isha`. Then `tap 540 1030`, `key back`, `wait 10`.
7. Run `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session9/alarms-armed.txt`, then
   the tag count and the instant list. Expected: `ACTION_FORCE_STOP_RESCHEDULE` 1, and
   `NOTIFICATION_EVENT` exactly 4, armed at `2026-09-26 00:40:00.000` (Friday's Magrib),
   `2026-09-26 01:30:00.000` (Friday's Isha), `2026-09-26 22:00:00.000` (Saturday's Magrib) and
   `2026-09-26 23:30:00.000` (Saturday's Isha): two list days, silent, no reminders. Anything else:
   section 2.2, item 7. Write `ARMED_ALARMS=4` in `LOG.md`.
8. `devcheck.py shot ~/athan-device-sweep/session9/friday-list.png`. Spawn `vision` (GLM 5.3 Flash)
   with this prompt. Expected: `YES`. Any other answer: repeat the shot once (the countdown keeps
   rendering); still not `YES`: section 2.2, item 12.

   ```text
   Read the image at ~/athan-device-sweep/session9/friday-list.png. It is a screenshot of a prayer
   times app. Answer with exactly one word: YES if the header dates the list "Fri, 25 Sep 2026" and
   the six rows include Magrib at 00:40 and Isha at 01:30; NO otherwise.
   ```

### 7.2 The return after 00:00, the reschedule, and the fires

1. Safety dump, then drive to the minute before midnight, passing nothing (every armed instant is at
   or after 00:40 on the 26th):
   `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session9/alarms-before-midnight.txt`,
   then the tag count and instant list (expected: the same four), then
   `devcheck.py clock '2026-09-25 23:59:00'`, `wait 5`.
2. The return after 00:00, passing nothing: `devcheck.py clock '2026-09-26 00:00:40'`, `wait 5`.
3. The cold launch that rebuilds and reschedules: `devcheck.py cold after-midnight > $TMPDIR/cold-9-midnight.log 2>&1`
   in the background, then `wait 15` twice, resume retry as before. On Android a cold launch reopens
   the refresh gate, so this one launch exercises both halves at once.
4. `devcheck.py logs after-midnight`. The saved log must hold, and `LOG.md` records one line of each:
   - a line containing `SEQUENCE: Set sequence` and `2026-09-25` (the build started from Friday's
     list; the old code logged `2026-09-26`);
   - a line containing `NOTIFICATION SYSTEM: Scheduled` and `athan_standard_magrib_2026-09-25`;
   - a line containing `NOTIFICATION SYSTEM: Scheduled` and `athan_standard_isha_2026-09-25`;
   - no line containing `Cancelled` together with `athan_standard_magrib_2026-09-25` or
     `athan_standard_isha_2026-09-25`.
   Any miss: section 2.2, item 11.
5. `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session9/alarms-after-return.txt`,
   then the tag count and instant list. Expected: `NOTIFICATION_EVENT` exactly 4, the same instants
   as 7.1 item 7 (both of Friday's alarms re-attempted, neither cancelled, Saturday's kept). Anything
   else: section 2.2, item 7. Write `ARMED_AFTER_RETURN=4` in `LOG.md`.
6. `devcheck.py shot ~/athan-device-sweep/session9/after-midnight.png`. Spawn `vision` (GLM 5.3
   Flash) with this prompt. Expected: `YES`, twice if needed, else section 2.2, item 12.

   ```text
   Read the image at ~/athan-device-sweep/session9/after-midnight.png. It is a screenshot of a prayer
   times app taken just after midnight. Answer with exactly one word: YES if the header still reads
   "Fri, 25 Sep 2026", the rows include Magrib 00:40 and Isha 01:30, and the countdown area names
   Magrib; NO otherwise.
   ```

7. Fire 1, Friday's Magrib at 00:40. Safety dump first: a fresh dump as
   `alarms-before-magrib.txt` whose four instants are all at or after `00:40` (else section 2.2,
   item 7). Then `adb -s 8f7ada76 shell logcat -c`, then `devcheck.py clock '2026-09-26 00:39:30'`
   (passes nothing), then `devcheck.py clock '2026-09-26 00:40:03'`, then `wait 15`. Then
   `adb -s 8f7ada76 shell logcat -d -b system,events > ~/athan-device-sweep/session9/fire-magrib.logcat.txt`,
   then `python3 ai/plans/09-keep-still-due-rows-after-midnight/scripts/device/posts.py ~/athan-device-sweep/session9/fire-magrib.logcat.txt '09-26 00:40:03' '09-26 00:45:03' | tee $TMPDIR/posts-magrib.txt`,
   then `python3 ai/plans/09-keep-still-due-rows-after-midnight/scripts/device/tray.py ~/athan-device-sweep/session9/tray-magrib.txt`.
   Expected: `POSTS 1`, its printed line (truncated at 220 characters by posts.py) holding
   `com.mugtaba.athan,0,athan-notification,0`, `expo_notifications_fallback_notification_channel`
   and `sound=null` (a Silent alert), `MUTED 0`, `REFUSED 0`, and `TRAY 1` with exactly one
   `NOTIFY tag=athan-notification` line on that fallback channel. Anything else: section 2.2,
   item 10. Write `MAGRIB_POSTS=1` in `LOG.md`.
8. Fire 2, Friday's Isha at 01:30. Safety dump as `alarms-before-isha.txt`: expected `NOTIFICATION_EVENT`
   exactly 3 (01:30, 22:00, 23:30; the fired Magrib is gone from the OS), else section 2.2, item 7.
   Then `logcat -c`, `devcheck.py clock '2026-09-26 01:29:30'` (passes nothing),
   `devcheck.py clock '2026-09-26 01:30:03'`, `wait 15`, then the same three saves with the labels
   `fire-isha.logcat.txt`, `posts-isha.txt` (window `'09-26 01:30:03' '09-26 01:35:03'`) and
   `tray-isha.txt`. Expected: `POSTS 1`, `MUTED 0`, `REFUSED 0`, `TRAY 1` with one shared-tag line.
   Anything else: section 2.2, item 10. Write `ISHA_POSTS=1` in `LOG.md`.

### 7.3 After the rows pass, and the phone left behind

1. The reschedule after the rows have passed: `devcheck.py cold after-rows > $TMPDIR/cold-9-after-rows.log 2>&1`
   in the background, then `wait 15` twice, resume retry as before. Then
   `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session9/alarms-after-rows.txt` and
   the tag count and instant list. Expected: `NOTIFICATION_EVENT` exactly 4, armed at
   `2026-09-26 22:00:00.000` and `2026-09-26 23:30:00.000` (Saturday's rows) and `2026-09-27 21:00:00.000`
   and `2026-09-27 22:30:00.000` (Sunday's): the window moved on the moment Friday's rows passed, and
   Friday's alarms are gone. Anything else: section 2.2, item 7. Write `AFTER_ROWS_ALARMS=4` in
   `LOG.md`.
2. `devcheck.py shot ~/athan-device-sweep/session9/saturday-list.png`. Spawn `vision` (GLM 5.3 Flash)
   with this prompt. Expected: `YES`, twice if needed, else section 2.2, item 12.

   ```text
   Read the image at ~/athan-device-sweep/session9/saturday-list.png. It is a screenshot of a prayer
   times app. Answer with exactly one word: YES if the header reads "Sat, 26 Sep 2026" and the
   countdown names Fajr; NO otherwise.
   ```

3. Return the clock: `devcheck.py auto` (a backward jump to the real date; it passes nothing armed),
   then `adb -s 8f7ada76 shell settings get global auto_time`. Expected: `1`.
4. Build the final mock in the background:
   `zsh ~/athan-device-sweep/session3/bin/build-mock.zsh <FINAL> /Users/muji/repos/rn.athan.uk/mocks/simple.ts ~/athan-device-sweep/session9/build/athan-9-mock-final.apk > $TMPDIR/build-9-final.log 2>&1`.
   Expected: `BUILD-MOCK OK` and the `versionName` line with `<FINAL>`'s version.
5. Install and launch it: `devcheck.py install ~/athan-device-sweep/session9/build/athan-9-mock-final.apk`,
   then `devcheck.py cold final-cold > $TMPDIR/cold-9-final.log 2>&1` in the background, then
   `wait 15` twice, resume retry as before.
6. `adb -s 8f7ada76 shell dumpsys package com.mugtaba.athan | grep versionName`. Expected:
   `versionName=` followed by `package.json`'s version. Then
   `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session9/alarms-end.txt` and the tag
   count and instant list. Only Magrib and Isha are Silent now (7.0's disarm left every other bell
   Off, and 7.1 armed no other), so every bell that can arm anything is one of them. Expected:
   `ACTION_FORCE_STOP_RESCHEDULE` 1, and `NOTIFICATION_EVENT` 4, or 2 once today's two have fired:
   on the real today, the seeded Magrib and Isha of `mocks/simple.ts` (one and two minutes after the
   Asr the launch's download put 60 to 119 seconds away), and on the real date's tomorrow the fixed
   day1 rows `20:19:00.000` (Magrib) and `21:31:00.000` (Isha). The mock-days alarms of the fixed
   build are stale against the real window and cancelled by this launch. Anything else: section 2.2,
   item 7. Write `END_ALARMS=<n>` in `LOG.md`.
7. Leave the phone as the owner's standing rule holds it: unlocked (the keyguard check of 7.0 item 7
   reads 0), Athan open in the foreground, `svc power stayon usb` still set from 7.0 item 8. Do NOT
   run `svc power stayon false`. The owner's real data stays in `athan-storage`.
8. Spawn a `Reality Checker` subagent (a `general` subagent), isolation `worktree`, no `model`, with
   the prompt `REALITY_CHECK` in section 11, and write its verdict in `LOG.md`. A final line
   `evidence does not hold`: STOP and ask "Reality Checker (GLM 5.3) found `<its NOT PROVEN lines>`.
   What do I do?"
9. Only after a final line `evidence holds`: in `PLAN.md` section 6, replace the line
   `- [ ] Device proof: section 7` with `- [x] Device proof: DONE`.

The phone is left on the final Asr-next mock build of `<FINAL>`, real clock, automatic time on,
unlocked, Athan open, stay-awake on. The evidence is in `~/athan-device-sweep/session9/`.

## 8. Records

### 8.1 Findings text

Append this to the end of `ai/features/uat-2/AUDIT-FINDINGS.md`, replacing each placeholder with the
value measured:

- `<DATE>`: the date the device proof ended, as `D Month YYYY`;
- `<FINAL8>`: the first eight characters of the sha from section 7.0;
- `<VERSION>`: `package.json`'s version at `<FINAL>`;
- `<TESTS1>`, `<TESTS2>`: the `Tests:` lines of steps 1 and 2's commit logs;
- `<BASELINE_ALARMS>`, `<PURGE_POSTS>`, `<ARMED_ALARMS>`, `<ARMED_AFTER_RETURN>`, `<MAGRIB_POSTS>`,
  `<ISHA_POSTS>`, `<AFTER_ROWS_ALARMS>`, `<END_ALARMS>`: the readings `LOG.md` records in section 7.

```markdown
# Session 9 of the queue: yesterday's still-due rows stay on screen and keep their alarms, <DATE>

The brief is `ai/prompts/keep-still-due-rows-after-midnight.md`, planned in
`ai/plans/09-keep-still-due-rows-after-midnight/PLAN.md` by a GLM 5.3 planning session (design review:
Software Architect on GLM 5.3, whose finding about `canStillFire` is part of the change), executed on
GLM 5.3 with a GLM 5.3 Code Reviewer on every commit. `uat-2` ends at `<FINAL8>` (<VERSION>); the
last suite run reported `<TESTS2>`, at 100% statements, branches, functions and lines.

## 74. CLOSED: a day stays current until its last readable row has passed

Two changes, one rule (owner, 2026-09-13, confirmed with the dashed-times rule 2026-09-17):

- **The screen.** `firstStillDueListDay` (`shared/prayer.ts`) answers the earliest list day that
  still has a readable row to come, looking back exactly one day (provably enough: a row of any
  earlier list falls before 06:00 of the day after its own), and `setSequence` builds from it, so a
  launch or foreground sync after 00:00 keeps yesterday's list on screen with its post-midnight rows
  counted down to, the bar and the ago badge measured into them. The interim behaviour (the bar and
  badge hiding until the next day's Fajr) is gone with its cause; the two tests that pinned it are
  rewritten for the ruling, and the storage guard that kept the bar from running backwards is
  re-pinned through a hand-built pre-fix sequence.
- **The alarms.** `firstStillDueListDayForPrayer` answers the same question per prayer, and
  `genScheduleDatesForPrayer` starts both scheduling paths there, so a reschedule between 00:00 and a
  still-due row re-attempts its alarm under its own identifier instead of cancelling it as stale. The
  window keeps its length (it is [yesterday, today] while yesterday is due, and moves on the moment
  the row passes), so the iOS 64-pending ceiling arithmetic stands untouched. `canStillFire` counts a
  record of yesterday's list until the 06:00 cutoff, so a refused cancel of a still-due yesterday
  alarm keeps the record the repair needs (found by the design review; the old date test deleted it
  and left a live alarm with no handle). Known edge, accepted: while yesterday is still due (at most
  about six hours), the newest list day is unarmed until the next reschedule, which the 12-hour gate
  and the 6-hour background task bound; a silence beyond that needs both refresh layers starved for
  over a day, which the pre-fix code also needed.

On the 3T, from the baseline the proof created itself (every armed alarm purged with one bounded
forward drive, <PURGE_POSTS> posts; the three bells the last session left stored turned Off; the dump
proven zero), on the brief's five fixed high-latitude days with the clock on Friday 25 September 2026:

- Friday's Magrib and Isha armed Silent: exactly <ARMED_ALARMS> alarms, at 00:40 and 01:30 under
  Friday's list day and at Saturday's own 22:00 and 23:30.
- A cold launch at 00:00:40 (which on Android also forces a full reschedule) kept Friday's list on
  screen (vision-read: header, rows, countdown into the 00:40 Magrib), rebuilt the sequence from
  2026-09-25 (logcat), and left exactly <ARMED_AFTER_RETURN> alarms: both of Friday's re-attempted
  under their own `athan_standard_*_2026-09-25` identifiers, neither cancelled. Finding 74's
  cancellation never happened.
- Driving the clock to each row: <MAGRIB_POSTS> post at 00:40 and <ISHA_POSTS> post at 01:30, each on
  the Silent fallback channel, the tray holding exactly one shared-tag notification throughout.
- A reschedule after the rows passed: exactly <AFTER_ROWS_ALARMS> alarms, Saturday's and Sunday's;
  Friday's gone. The list and countdown had rolled to Saturday (vision-read).

London is unchanged by mechanism and by suite: no London row is ever still due after 00:00, so both
helpers always answer today and every London sequence and window stays byte-identical, pinned across
the 2026 payload, both clock changes and 1 January. The evening-Suhoor buffer loss (gap map L4)
stays a separate owner decision, declined for this session on 2026-09-17.

## State left behind

The 3T runs the final Asr-next mock build of `<FINAL8>` (<END_ALARMS> alarms, all on the real today
or its tomorrow), real clock, automatic time on, unlocked with Athan open and stay-awake on (the
owner's standing rule). Nothing was built on or pushed to EAS, and `releases.json` is untouched. The
evidence is in `~/athan-device-sweep/session9/`.
```

### 8.2 Table rows

- **`ai/plans/README.md`:** the executor sets row 5's status to `EXECUTED`.
- **`ai/prompts/README.md`, for the auditor to apply on PASS:** replace row 9's `queued` cell with
  `**DONE** <DATE>, <step versions>: yesterday's still-due rows stay on the screen and keep their
  alarms after 00:00 (a day stays current until its last readable row has passed); proven on the 3T
  on the brief's five fixed high-latitude days, from a zero baseline the proof created itself:
  Friday's list still on screen after a midnight cold launch, both alarms re-attempted and fired, the
  window moved on once the rows passed; London byte-identical`.

### 8.3 Docs commit

The `executed` docs commit (`EXECUTOR-BRIEF.md` section 4b) uses this message, with `<VERSION>` from
`set-version.sh`:

```text
<VERSION> - docs(plans): session 9 executed: yesterday's still-due rows stay on screen and keep their alarms, proven on the 3T
```

Its files, by name: `ai/plans/README.md`, `ai/plans/09-keep-still-due-rows-after-midnight/PLAN.md`,
`ai/plans/09-keep-still-due-rows-after-midnight/LOG.md`, `ai/features/uat-2/AUDIT-FINDINGS.md`,
`app.json`, `package.json`.

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session pushes
`uat-2` after a PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

### 10.1 Symptoms

The general table is `EXECUTOR-BRIEF.md` section 7. This session's own:

| Symptom | Cause | Action |
| --- | --- | --- |
| A `read` after a tap prints `DUMP FAILED` | The countdown animates; dumps fail on the bare page but work with a sheet open | `wait 3` and `read` once more with a `-2` label; a second failure: section 2.2, item 9 |
| A cold launch lands on the launcher | The known post-install first-start behaviour | `devcheck.py resume <label>` once, `wait 15`; a second failure: section 2.2, item 14 |
| A build prints `another Android build or bundler is running` | Two builds at once | Wait for the first build's notification, then start the second |
| The purge's second dump still holds alarms | An armed instant appeared after the first purge | Section 2.2, item 7: STOP and ask |
| The zero verify after the disarm holds alarms | A bell the plan did not predict is stored on | Section 2.2, item 7: STOP and ask; never open extra sheets to guess |
| `MUTED` is 1 where an item records either | The one-second muting window is a race | Record it and go on |
| The log at 7.2 item 4 misses a `Scheduled` line | The launch's refresh bailed or logged differently | Section 2.2, item 11: quote the closest lines and ask |
| The pre-commit hook fails only on `audioMatrix.test.ts` timing out | The machine is busy | `EXECUTOR-BRIEF.md` section 3: wait for the load and commit again, up to 3 times |
| A mockcheck file changes that this session did not write | Another session is driving the phone | Section 2.2, item 13: stand down and ask |

### 10.2 Anticipated review fixes

None is given word for word: the two steps' code is almost entirely verbatim from this plan, and
every name, string, behaviour and test the plan fixes is pinned by its tests. A reviewer finding on
either commit is handled by `EXECUTOR-BRIEF.md` section 4, item 8's three conditions and nothing
else. For the docs commit, the same. One bounded exception, because the owner's rule is at stake: if
a reviewer finds that a log line this plan names (`SEQUENCE: Set sequence`, `SEQUENCE: Set sequence
skipped (identical)`) had its text changed, restore the exact text from this paragraph and record the
finding in `LOG.md`.

### 10.3 Stopping part-way

For step 1, restore with `git checkout -- shared/prayer.ts stores/schedule.ts
stores/__tests__/schedule.test.ts shared/__tests__/prayer.test.ts app.json package.json` and delete
no file (the step adds none). For step 2, restore with `git checkout -- shared/prayer.ts
shared/notifications.ts stores/notifications.ts stores/__tests__/notificationsAroundMidnight.test.ts
shared/__tests__/prayer.test.ts shared/__tests__/notifications.test.ts app.json package.json` and
delete no file. Then `EXECUTOR-BRIEF.md` section 4a's remaining steps. Mid-proof, which changes no
repository file: run `devcheck.py auto`, leave the phone on whatever build is installed with
`auto_time` 1, and record in `LOG.md` which item the proof reached and what the phone holds; a
successor re-runs 7.0's baseline before anything else, because a stopped proof's phone state is
exactly the unknown the baseline exists to remove.

## 11. Subagents in this plan

| Step | Agent type | Model | Isolation | Why | Prompt |
| --- | --- | --- | --- | --- | --- |
| Step 1 | `Code Reviewer` (a `general` subagent) | GLM 5.3 | `worktree` | The commit's review | `steps/1-sequence-starts-from-still-due-day.md`, part 9 |
| Step 2 | `Code Reviewer` (a `general` subagent) | GLM 5.3 | `worktree` | The commit's review | `steps/2-alarm-window-and-refusal-records.md`, part 9 |
| Docs commit | `Code Reviewer` (a `general` subagent) | GLM 5.3 | `worktree` | The `executed` docs commit | `EXECUTOR-BRIEF.md` section 4b, item 5 |
| 7.1, 7.2, 7.3 | `vision` | GLM 5.3 Flash | none | The executor cannot read images | The three prompts in section 7 |
| 7.3 | `Reality Checker` (a `general` subagent) | GLM 5.3 | `worktree` | Does the evidence prove every claim in section 8.1? | `REALITY_CHECK` below |
| Any | `Test Results Analyzer` (a `general` subagent) | GLM 5.3 | `worktree` | Only when a full-suite run fails in a way section 10 does not cover; it reports the cause, and the executor then STOPs | "Read `<log path>` in full and name the cause of each failing test, with file and line. Change nothing." |

Only the agents listed may be used, and no `model` override is ever passed: every subagent inherits
GLM 5.3, except `vision`, which runs on GLM 5.3 Flash.

The prompt `REALITY_CHECK` (worktree isolation; it reads the main checkout's files by absolute path,
which is why it must never run a git command):

```text
You are read-only. Run no git command and change no file; read everything by absolute path. Read
/Users/muji/repos/rn.athan.uk/ai/plans/09-keep-still-due-rows-after-midnight/PLAN.md sections 7 and
8.1 and /Users/muji/repos/rn.athan.uk/ai/plans/09-keep-still-due-rows-after-midnight/LOG.md, in full:
LOG.md holds readings not committed yet. Then read every file under /Users/muji/athan-device-sweep/session9/
that section 8.1's text cites, except images, which you must not open; for each image, use the vision
answer LOG.md records. For every claim in section 8.1, say whether the files prove it, quoting the
line that does. Reply with one line per claim, "PROVEN: <claim>: <evidence>" or "NOT PROVEN:
<claim>: <what is missing>", then a final line "evidence holds" or "evidence does not hold".
```

## 12. Report to the owner

The final message of the execution session:

```text
🤖  Model: GLM 5.3 (execution session)
Time: <output of date '+%H:%M:%S %d.%m.%Y'>

Session 9 is executed and waits for its audit. Two merged commits, and a device proof run end to end
in one session with no questions:
- A day now stays current until its last readable row has passed. After 00:00, yesterday's list stays
  on screen with its post-midnight rows counted down to and the bar measured into them, and a
  reschedule re-attempts those rows' alarms under their own identifiers instead of cancelling them.
  A refused cancel of such an alarm now keeps the record the repair needs (the design review's
  finding). London is byte-identical, pinned across the payload, both clock changes and 1 January.
- The proof built its own zero baseline first (every armed alarm purged, the last session's three
  bells disarmed), then, on the brief's five fixed high-latitude days: Friday's list still on screen
  after a midnight cold launch, both alarms re-attempted and fired silent at 00:40 and 01:30, the
  window moved on once the rows passed, and the tray held one notification throughout.
The phone is on the final Asr-next mock build of the latest uat-2, unlocked, Athan open, stay-awake
on.

<the progress table, in EXECUTOR-BRIEF.md section 6's format>

Nothing waits on you for this session. Next, the audit.
```
