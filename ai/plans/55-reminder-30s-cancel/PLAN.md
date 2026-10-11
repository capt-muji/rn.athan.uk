# Job 55: a reschedule inside 30s of an armed reminder cancels it

| Field | Value |
| --- | --- |
| Brief | Queue row 55. External evidence: `arch/39-localisation-claude-20261009:ai/plans/39-localisation/alternatives/claude/04-surfaces.md` section 2, verified against the code this session |
| Planned at | `uat` `95e5a12e` (2.0.3), 2026-10-11 |
| Planned by | Planning session 2026-10-11 (owner rulings: keep-alive fix, Jest plus 3T proof, row 39 rulings D39 to D50 recorded in `../39-localisation/OWNER-DECISIONS.md`) |
| Needs first | row 53 DONE (verified in the queue) |
| Parent | none |
| Group | notifications scheduling: `stores/notifications.ts`, shared with row 39's convergence work when it plans; same-group rows serialize |
| Batch budget | 2 |
| Session budget | 5 |
| Steps | 2 (step 01 code, step 02 device) |
| Device | OnePlus 3T (`3T_SERIAL`), Android 9, mock fleettest build |
| Owner decisions still needed | none |

## 1. Goal

**What is wrong today:** a scheduling pass that runs while an armed reminder's trigger moment is
inside `REMINDER_BUFFER_SECONDS` (30) and still ahead cancels that reminder. The skip branch in
`scheduleReminderNotificationForDate` returns no identifier, so the armed reminder's record counts
as unattempted, the per-prayer stale sweep removes the record, and `_cancelStaleNotificationIds`
cancels the OS request about to fire. The user silently loses a reminder they armed. Proven red
this session: `cancelsOf(imminentId)` returned 1 where 0 was expected.

**What is true when DONE:** the pass counts an armed imminent reminder as kept. It does not
re-arm it, does not cancel it, and leaves its record intact, so it fires with the content it was
armed with. An imminent reminder with no record is still skipped unarmed. A past reminder is
still cancelled and cleaned up.

**How the owner notices:** a reminder armed before a pass that lands in its final 30 seconds
fires exactly as if no pass had run. Nothing else changes anywhere.

**Owner rules that apply:** an alert does exactly what its bell shows (`ai/AGENTS.md`, Hard
rules); notification scheduling logic is ask-first, and the owner approved the keep-alive fix in
this session's interview; full unit coverage red before green; no test reads the real clock;
version lockstep; comments explain why only.

## 2. Decisions

**2.1 Taken.** Owner, 2026-10-11, this session:

- The keep-alive branch: inside the buffer, an already-armed and recorded reminder counts as
  kept; no re-arm, no cancel. Chosen over guarding the cancel sweep (needs the interval parsed
  back out of the record id) and over removing the buffer (a reminder enabled seconds before its
  moment would fire at once).
- Proof: red-before-green Jest plus a 3T device proof with the clock driven inside the window and
  a cold launch triggering the pass. The XS-first device rule yields here because the clock
  tooling, the alarm dumps and the device atlas live on the 3T.
- Queue order: row 55 before row 39, so the language-switch work plans against a clean surface
  (D39, recorded in `../39-localisation/OWNER-DECISIONS.md`).

**2.2 The executor must not decide.** Any output the plan does not predict: STOP and ask. No
change to `REMINDER_BUFFER_SECONDS`, to the at-time path, to `clearAllScheduledRemindersForPrayer`
(turning a reminder Off inside the window still cancels it: the bell shows Off), or to any log
line the plan does not name.

## 3. Pre-flight

`scripts/preflight-55.sh` in this folder. The executor saves a copy to `$TMPDIR` and runs it from
there. It checks: checkout on `uat`, clean tree, `origin/uat` merged in, version not lower than
2.0.3, row 53 DONE and row 55 READY or PLANNING in the queue, every anchor under
`scripts/anchors/` counting exactly 1 in its source file. Ends `PREFLIGHT OK`.

## 4. Background the executor needs

Code map (all at `95e5a12e`; anchors under `scripts/anchors/`):

- `stores/notifications.ts` — the only changed file. `scheduleReminderNotificationForDate`
  (1003) arms one reminder for one day: three skip branches, then arm, then record. The imminent
  guard is the defect site (`reminder-time-calc`, `reminder-imminent-guard`,
  `reminder-identifier-try` anchors; the docblock at `reminder-skip-docblock`).
  `_addMultipleScheduleRemindersForPrayer` (1089) arms both slots over the day window, collects
  `attemptedIds`, and treats every existing record outside it as stale: record removed, then
  `_cancelStaleNotificationIds` (167) cancels at the OS. `clearAllScheduledRemindersForPrayer`
  (1154) is the Off path. `_addAllScheduleRemindersForSchedule` (1375) walks a schedule;
  `_rescheduleAllNotifications` (1539) drives both schedules then `_sweepStaleScheduledNotifications`;
  `rescheduleAllNotifications` (1640) and `refreshNotifications` (1748) are the exported entries,
  both under `withSchedulingLock` (57).
- `shared/constants.ts:125` — `REMINDER_BUFFER_SECONDS = 30`. Its only functional caller is the
  guard at `stores/notifications.ts:1032`.
- `stores/database.ts` — `getAllScheduledRemindersForPrayer` (271) reads the prayer's reminder
  records by prefix; `addOneScheduledReminderForPrayer`, `removeOneScheduledReminderForPrayer`
  write and delete one record each. Keys `scheduled_reminders_${type}_${index}_${id}`.
- `device/notifications.ts` — `reminderNotificationIdentifier` (63) builds the deterministic id
  `reminder_${type}_${id}_${date}_${interval}`; `cancelScheduledNotificationById` (147) cancels
  one OS request.
- `shared/notifications.ts:215` — `findStaleScheduledNotificationIds`: the post-reschedule sweep
  cancels OS requests with no record. With the fix, the kept reminder has both record and
  request, so the sweep agrees; without the fix the per-prayer sweep already removed both and
  the sweep sees nothing.

How the pieces interact: every pass runs under `withSchedulingLock`, so passes serialize. The
guard reads `TimeUtils.createInstant()` and the prayer's datetime, both inside the pass. The
keep-alive return feeds `attemptedIds` only; nothing else consumes it.

Existing tests and what each proves:

- `stores/__tests__/notificationStaleCancelFailure.test.ts` — a refused stale cancel does not
  abort the batch; the sweep retries. The new suite copies its harness verbatim.
- `stores/__tests__/notifications.test.ts`, `notificationAlertCommit.test.ts`,
  `notificationSchedulingLock.test.ts`, `notificationSinglePrayerUpdate.test.ts`,
  `notificationsClockChange.test.ts`, `notificationsAroundMidnight.test.ts` — the arming,
  commit and lock behaviour the change must not move.
- `device/__tests__/reminderCancelFailure.test.ts`, `device/__tests__/notifications.test.ts` —
  the device-layer identifier and cancel contracts.

Why the obvious fix is wrong: removing the buffer arms reminders that fire at once (what the
buffer exists to prevent). Guarding the sweep instead needs the interval parsed back out of the
record id, a fragile string contract, to compute the same fact the guard already holds. Re-arming
inside the window replaces the request at the fire boundary, a race the buffer exists to avoid.

## 5. Design

**Invariant (one sentence a test can check):** after the change, a pass that runs while an armed
reminder's moment is inside the buffer and still ahead leaves that reminder's OS request, record
and content byte-identical to before the pass.

**The approach:** one branch inside the imminent guard. Compute the identifier before the guard,
look for it among the prayer's stored reminder records, and when the moment is still ahead and
the record exists, return the identifier as kept. The two consumers of a returned identifier,
the stale sweep and the refusal count, then treat the day exactly like a day that armed.

**Alternatives rejected:** see section 1 of `steps/01-keep-alive-branch.md` (sweep guard, buffer
removal), each with the reason.

**Concurrency trace:** passes serialize under `withSchedulingLock`; no new lock, atom or key.
The record read inside the guard happens under the same lock as every other record access in the
pass. If the moment passes while the pass runs between the guard and the sweep, the next pass
cleans the record up under R4. The clock never runs backwards in a pass.

**Design review:** the fix was proven in a scratch worktree this session (red at
`cancelsOf(imminentId)` expecting 0 receiving 1; green after the branch; the full unit project,
153 suites and 4701 tests, passed; tsc and Biome clean). The grill pass ran on this folder
(section 6 of the queue's workflow).

### Acceptance criteria (EARS)

- [R1.1] WHEN a scheduling pass runs while an armed reminder's moment is inside `REMINDER_BUFFER_SECONDS`, still ahead, and its record exists THE SYSTEM SHALL issue no schedule and no cancel for its identifier and leave its record in place
- [R1.2] WHEN the pass keeps an imminent reminder THE SYSTEM SHALL log `REMINDER: Keeping imminent reminder armed:` with `date`, `prayerTime`, `id`, `intervalMinutes`, `secondsUntilReminder`
- [R2.1] WHEN an imminent reminder's moment is ahead but no record exists THE SYSTEM SHALL skip the day unarmed, exactly as before the change
- [R3.1] WHEN a reminder's moment is past THE SYSTEM SHALL cancel its OS request and remove its record, exactly as before the change
- [R4.1] WHEN a second pass runs while the same reminder is still inside the window THE SYSTEM SHALL keep it armed through both passes
- [R5.1] WHEN the 3T proof drives the clock inside the final 30 seconds of an armed reminder and cold-launches the app THE SYSTEM SHALL fire that reminder at its moment with the content it was armed with

## 6. Steps

- [x] 1. `steps/01-keep-alive-branch.md` — the branch, the suite, the break. Weight 2.
- [ ] 2. `steps/02-device-proof.md` — the 3T clock-driven proof. Weight 3.

## 7. Device proof

Step 2 builds the mock (`zsh $HOME/athan-gitree/bin/build-mock.zsh uat <repo>/mocks/simple.ts
$HOME/athan-gitree/sessions/55/mock.apk`, output ending `BUILD-MOCK OK`, `.apk` outside `/tmp`
and the repo), checks the package with `aapt2 dump badging <apk> | grep "^package"` (full
build-tools path, existence checked) and stops unless it prints
`package: name='com.mugtaba.athan' versionCode='1000000'`, installs on `3T_SERIAL`, arms a
5-minute Sound reminder whose armed moment sits on tomorrow's mock row, saves the unfiltered
`dumpsys alarm` output before any clock change and identifies the app's requests structurally:
the dump carries no per-notification identifier, so the app's armed requests are the `RTC_WAKEUP`
lines ending `com.mugtaba.athan` whose bundle carries
`tag=expo.modules.notifications.NOTIFICATION_EVENT`, and the target is the entry whose `when`
sits exactly 300000 ms before its prayer's at-time entry. The expected-fire list is every app
NOTIFICATION_EVENT entry before the target, plus the app's far-future tombstone alarm (`when` in
2036, the exact epoch varying per install). The step drives the clock to 20 seconds before the
target (expected reply `Result: Parcel(00000000`), cold-launches the app (`am kill
com.mugtaba.athan` then launch) so the reopened refresh gate runs a pass inside the window,
proves the target's `when=` line unchanged in a fresh dump, then polls logcat every 10 seconds
at most 6 times for the fire and transcribes the posting, judged once on its unique timestamp.
Automatic time is restored to on and read back.
The mock opens `athan-storage-dev`, never the owner's `athan-storage`; his preferences re-arm
the next time his local production build launches, and the report says so. Evidence under
`$HOME/athan-gitree/sessions/55/`, cited files copied to the plan folder's `LOG.md` record.

## 8. Records

LOG.md heading: `## Job 55`. Row cell the lead applies on DONE: "DONE: a pass inside the final
30 seconds before an armed reminder now keeps it armed, no re-arm and no cancel, record intact;
unarmed imminent reminders still skip and past ones still clean up; red-green in
`stores/__tests__/reminderImminentKeepAlive.test.ts` and clock-proven on the 3T". Docs commit
message: `<VERSION> - docs(plans): job 55 planned, ready for execution`.

## 9. Push

None. The executor never pushes. The lead pushes after the audit passes.

## 10. When something goes wrong

| Symptom | Response |
| --- | --- |
| Any anchor count other than 1 | NEEDS REPLAN |
| A named red test passes before the change, or a test the step did not name fails | STOP |
| `cancelsOf` receives a number other than 1 in the red run | STOP: the tree moved |
| The mock build places no reminder so the window is reachable | STOP: report the prayer times the dump shows |
| The forward clock jump fires an alarm the pre-jump dump did not list | STOP |
| `service call alarm` answers `Permission Denial` | STOP and report |
| The target's `when=` line is missing or moved in the inside-window dump | STOP |
| `adb` hangs twice around `am kill` | STOP and report |
| The reminder does not fire within 60 seconds of the driven moment | STOP: transcribe the last 40 logcat lines and the alarm dump |

Anticipated review fixes, word for word:

- "The record read should live in a variable, not nest inside the condition." Apply: hoist
  `const records = Database.getAllScheduledRemindersForPrayer(...)` above the `if`, then test
  `records.map((each) => each.id).includes(identifier)`.
- "The keep-alive log line duplicates the skip line's fields." Reject: the two lines name
  different outcomes; the fields are the ones the log reader needs to tell them apart.

Restore lists: step 01 reverts `stores/notifications.ts` and deletes
`stores/__tests__/reminderImminentKeepAlive.test.ts`; step 02 restores automatic time and leaves
the phone on the fleettest build.

## 11. Subagents

Planning used `explore` workers and an `athan-plan-griller` pass. Delivery: the lead dispatches
`athan-executor` for each step (step 02 alone in its batch) and `athan-reviewer` blind and
plan-conformance at audit. `vision` only, for an image no reader can see.

## 12. Report to the owner

Plain sentences: the reminder no longer dies to a pass in its final 30 seconds; what the device
proved; the progress table; the four-line handoff.
