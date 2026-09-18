# Audit: session 9

| Field | Value |
| --- | --- |
| Audited by | Audit session on GLM 5.3, 18 September 2026 |
| Verdict | PASS, nothing to fix |
| Range audited | `origin/uat-2..uat-2` at `3a0f6b6f`: `e66ab502`, `248d971d`, `c6035802`, `7289894a`, `85f4d9dd`, `407894ea`, `eb7bdde5`, `88be6ef0`, `59d33221`, `3a0f6b6f` |
| Row | 5 set to DONE; `ai/prompts/README.md` row 9 applied from the plan's section 8.2 |
| Pushed | Yes, `git push origin uat-2` after the audit docs commit merged |

## What I checked, and the evidence for each

**The range.** `git log --oneline origin/uat-2..uat-2` lists ten commits: two step commits, their
merges, two replan docs commits and their merges, and the executed docs commit and its merge. Every
one was reread; both planning commits (`c6035802`, `85f4d9dd`) and the executed docs commit
(`59d33221`) were read in full, diff and message. Each merge (`git show --stat` against its first
parent) carries exactly its branch's changes and nothing else. Nothing in the range touches
`releases.json` (diff empty), `mocks/`, `e2e/`, `app/`, `components/`, `hooks/` or `device/`
(`git log origin/uat-2..uat-2 -- <paths>` prints nothing). No `uat`, no EAS, no key, and
`git grep -nE 'istanbul ignore|c8 ignore|v8 ignore'` over `shared/` and `stores/` prints nothing.

**Plan against commits.** `git show e66ab502` and `git show eb7bdde5`, read in full against the
steps' contracts:

- Every function the plan named exists with its exact name, signature, doc comment and body:
  `firstStillDueListDay` and the `findNextReadable` import (step 1), `firstStillDueListDayForPrayer`
  with the `isReadable` import widening, the optional-start `genNextXDays`, the
  `genScheduleDatesForPrayer` rewrite, the `ISLAMIC_DAY,` import line, the padded-cutoff
  `canStillFire` and the comment-only empty-cache-guard rewrite (step 2). All are byte-for-byte the
  plan's verbatim blocks.
- `setSequence` uses the caller's one instant for the look-back and the `extendUntilReadable` call,
  both log lines name `firstDate`, and both log texts are unchanged; the `findPreviousPrayer`
  storage guard is untouched (it is not in the step 1 diff).
- Every test the plan listed exists with its name, inputs and assertions: the six
  `firstStillDueListDay` cases, the six `firstStillDueListDayForPrayer` cases, the rewritten
  `postMidnightIsha` fixture and both rewritten `it.each` blocks, the two scripted-`setSequence`
  assertions, the mock extension and `beforeEach` wiring, the replaced import block, the six alarm
  tests including the replan's sixth, and the `genNextXDays` start test. No extra file, and no
  behaviour the plan did not ask for. The only textual deltas from the plan's blocks are the Biome
  reflows the steps themselves instruct (quote normalization, one line joined to 120 columns), each
  recorded in `LOG.md`.
- Versions in sequence: 1.27.212 (parent) then 1.27.213, 1.27.214, 1.27.215, 1.27.216, 1.27.217
  across the five non-merge commits. Commit messages equal the plan's with `<VERSION>` filled
  (verified in full for both steps, subject and body).

**The tests still guard.** Both break scripts ran from the scratch worktree
(`~/athan-device-sweep/worktrees/audit-9`, detached at `3a0f6b6f`, `node_modules` symlinked):
`breaks-1.sh` prints `BREAK 1a/1b/1c AS EXPECTED` (2, 27 and 2 failing tests) and `ALL AS EXPECTED: 1`;
`breaks-2.sh` prints `BREAK 2a/2b/2c/2d/2e AS EXPECTED` (3, 2, 4, 1 and 1 failing tests) and
`ALL AS EXPECTED: 1`. The grep the brief asks for hits only the scripts' own header comments ("run
from /Users/muji/repos/rn.athan.uk"); every operative path is relative, and the main checkout's
`git status --porcelain` stayed empty throughout the runs.

**The red check for the riskiest step.** Step 2 (scheduling and refusal records) was reverted in the
worktree (`git checkout 248d971d -- shared/prayer.ts shared/notifications.ts
stores/notifications.ts`) and the plan's red command rerun: `Tests: 11 failed, 194 passed, 205
total`, the six `firstStillDueListDayForPrayer` cases each `TypeError ... is not a function`, the
four named alarm tests and the `genNextXDays` start test. Exactly the plan's prediction; the tree
was restored afterwards.

**The whole suite.** `yarn validate` in the worktree exits 0: 159 suites,
`Tests: 2 skipped, 4528 passed, 4530 total` (the plan's named no-native-folders variant), and
`Statements/Branches/Functions/Lines` all 100% (3968/3968, 1712/1712, 826/826, 3565/3565).

**Reviews.** `LOG.md` records a `merge` verdict from a Code Reviewer (GLM 5.3) for each step commit,
one round each. The executed docs commit's first round was `fix first` on one LOG.md wording; the
executor applied it under `EXECUTOR-BRIEF.md` section 4, item 8's three conditions (its own LOG
prose, nothing the plan specified, every criterion still met) and recorded both the finding and the
fix in `LOG.md`; the amended commit `59d33221` carries the corrected enumeration. Not a finding.

**Device evidence.** Every reading re-derived from the raw files under `~/athan-device-sweep/session9/`
with the plan's own two dump commands and scripts:

- Baseline `alarms-baseline.txt`: `ACTION_FORCE_STOP_RESCHEDULE` 1, `NOTIFICATION_EVENT` 4 at
  2026-09-18 03:43 (x2), 04:03, 16:58. `alarms-disarmed.txt`: `NOTIFICATION_EVENT` 0.
  `alarms-after-purge.txt`: 0. The zero baseline holds.
- `alarms-armed.txt`: exactly 4, at 2026-09-26 00:40, 01:30, 22:00, 23:30. `alarms-after-return.txt`:
  the same four. `alarms-before-isha.txt`: exactly 3 (the fired Magrib gone). `alarms-after-rows.txt`:
  exactly 4 at Saturday's 22:00 and 23:30 and Sunday's 21:00 and 22:30, Friday's gone.
  `alarms-end.txt`: exactly 4 at 2026-09-19 00:53, 00:54, 20:19, 21:31.
- `after-midnight.logcat.txt`: the 09-26 00:00:57.646 line holds `startDate: '2026-09-25'` with
  `'SEQUENCE: Set sequence'`; `NOTIFICATION SYSTEM: Scheduled` lines hold both
  `athan_standard_magrib_2026-09-25` and `athan_standard_isha_2026-09-25`; zero lines hold
  `Cancelled` with either identifier. Finding 74's cancellation never happened.
- `posts.py` on `fire-magrib.logcat.txt` (window 09-26 00:40:03 to 00:45:03): `POSTS 1`, `MUTED 0`,
  `REFUSED 0`, the line on the Silent fallback channel with `sound=null`; on `fire-isha.logcat.txt`
  (01:30:03 to 01:35:03): the same. The saved `tray-magrib.txt` and `tray-isha.txt` re-parsed with
  tray.py's own regex: `TRAY 1` each, one `athan-notification` on the fallback channel.
- The purge readings: the re-run's fire log holds exactly 4 `notification_enqueue` posts from this
  purge's process (PID 3893) beside the first purge's 9 from two processes, which is the
  double-delivery over-count the owner ruled on and `LOG.md` records; the operative reading, the
  zero after-purge dump, is verified above. `PURGE_POSTS=4` is honest.
- The three screenshots re-read by `vision` (GLM 5.3 Flash) with the plan's exact questions:
  `friday-list.png` YES (header Fri, 25 Sep 2026; Magrib 00:40; Isha 01:30), `after-midnight.png`
  YES (same header and rows, countdown names Magrib), `saturday-list.png` YES (header Sat,
  26 Sep 2026, countdown names Fajr).

**The phone.** Read-only adb now: state `device`, `auto_time` 1, keyguard `showing=true` count 0,
`versionName=1.27.216` (the final mock build of `88be6ef0`), `NOTIFICATION_EVENT` exactly 4 at the
same instants as `alarms-end.txt`, plus the year-2036 WorkManager alarm. Left exactly as the plan
and the owner's standing rule hold it.

**The records.** `ai/features/uat-2/AUDIT-FINDINGS.md`'s session 9 text was checked line by line
against `LOG.md` and the raw files: every filled placeholder (18 September 2026, `88be6ef0`,
1.27.216, the `Tests:` line, 4, 4, 4, 1, 1, 4, 4) matches the evidence. The executed docs commit
carries the `EXECUTED` row; this audit sets it DONE and applies the `ai/prompts/README.md` row.

## Findings

None. Three observations, none a defect:

1. The break scripts' header comments name the main checkout's path, so the brief's grep prints
   them; the operative paths are all relative, and the main checkout was proven untouched during
   the runs.
2. `breaks-1` at head counts 227 tests, not the step-time 221: step 2 added six tests to a suite
   the step 1 breaks share. The failing counts are identical, so the guards hold.
3. The purge's `POSTS 9` and `POSTS 13` readings are the events buffer's double-delivery
   over-count, ruled on by the owner and recorded in `LOG.md`; the dump-based baseline it feeds is
   verified zero from the raw files.

## Verdict

PASS. Row 5 of `ai/plans/README.md` is DONE, `ai/prompts/README.md` row 9 carries the plan's
section 8.2 text, and this audit's docs commit (version 1.27.218) was reviewed by a Code Reviewer
(GLM 5.3) and merged `--no-ff` before `uat-2` was pushed. The scratch worktrees were removed.
