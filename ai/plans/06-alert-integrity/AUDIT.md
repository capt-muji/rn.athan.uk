# Audit: Session 6. An alert always does what its bell shows (findings 79, 80 and 82)

| Field | Value |
| --- | --- |
| Plan | `ai/plans/06-alert-integrity/PLAN.md` |
| Audited by | Claude Opus 5, audit session on 2026-09-16 |
| Executed by | GLM 5.3, with a Code Reviewer (GLM 5.3) on every step commit (section 1.5 on the docs commit) |
| Range audited | `origin/uat-2..uat-2` at `64d3da85`: 8 commits (3 step commits, their 3 merges, 1 docs commit, its merge) |
| Added by this audit | `7b66d8cf` and its merge `0f6ded1d` (finding A), `575272f8` and its merge `97a3c3c4` (finding C), then this audit's own docs commit and merge |
| Scratch worktree | `~/athan-device-sweep/worktrees/audit-6`, detached at `64d3da85`, `node_modules` symlinked |
| Verdict | **PASS**, after three fixes made in this session |

## 1. What was checked

### 1.1 The range

`git log --oneline origin/uat-2..uat-2` lists 8 commits and nothing else: `bf42c705` (step 1), `3499b765` (its merge),
`582ec838` (step 2), `b6e2bf26` (its merge), `c57b5721` (step 3), `5881b9f2` (its merge), `c8754092` (the `executed`
docs commit) and `64d3da85` (its merge). There is no planning or audit commit in the range — session 6's planning
commit is already on `origin/uat-2`, which holds the whole plan folder — so nothing else needed rereading for the push
rule. `git diff origin/uat-2..uat-2 --name-only` lists 14 files: the three steps' eight source and test files
(`hooks/useNotification.ts`, `hooks/__tests__/useNotification.test.ts`,
`hooks/__tests__/notificationSettingsFallback.test.ts`, `app/index.tsx`, `__tests__/app/index.test.tsx`,
`stores/notifications.ts`, `device/notifications.ts`, `stores/__tests__/notificationSchedulingLock.test.ts`),
`ai/features/uat-2/AUDIT-FINDINGS.md`, the three plan files, and `app.json` and `package.json`. No file outside the
plan.

### 1.2 Plan against commits, compared verbatim

Rather than read the diffs by eye, each step's files were **reconstructed** from its parent commit by applying the
plan's own saved anchors and changes (`scripts/anchors/`, `scripts/changes/`, `scripts/apply.py`'s single-occurrence
replace rule) and diffed against what was committed:

| Step | File | Anchors applied | Result |
| --- | --- | --- | --- |
| 1 | `hooks/useNotification.ts` | `1-1`, `1-2` | identical to the commit |
| 1 | `hooks/__tests__/useNotification.test.ts` | `1-3` to `1-8` | identical to the commit |
| 2 | `app/index.tsx` | `2-1` | identical to the commit |
| 2 | `__tests__/app/index.test.tsx` | `2-2` | identical to the commit |
| 3 | `stores/notifications.ts` | `3-1` to `3-7` | identical to the commit |
| 3 | `device/notifications.ts` | `3-8` | identical to the commit |

Every anchor counted exactly 1 in its parent file, so no anchor matched loosely. The two whole-file test replacements
are byte-identical to the plan's saved files: `hooks/__tests__/notificationSettingsFallback.test.ts` to
`scripts/tests/1-notificationSettingsFallback.test.ts.txt`, and `stores/__tests__/notificationSchedulingLock.test.ts`
to `scripts/tests/3-notificationSchedulingLock.test.ts.txt`.

Every saved artifact was also checked to be embedded verbatim in the plan text that gives it, so the plan's prose and
the files the executor applied say the same thing: all 18 anchors, all 18 changes, both test files and the three break
scripts in their step files, and `preflight.sh` in `PLAN.md` section 3 — 42 of 42. No extra file, line or comment;
no missing test; no changed expectation.

**Commit messages** equal the step files' messages with `<VERSION>` filled in, character for character, for all three
steps. The three merge messages equal the step files' part 10 commands.

**Versions in sequence**, `app.json` and `package.json` matching at every commit: parent `1.27.176`, then `1.27.177`
(step 1), `1.27.178` (step 2), `1.27.179` (step 3), `1.27.180` (docs).

Step 1 changes four tests that already existed, which the plan's section 4.4 states it will. Reading them, none is
weakened: two of the three Open Settings tests keep their `expect(result).toBe(true)` and `toBe(false)` assertions and
the third keeps its `expect(Linking.openSettings).toHaveBeenCalled()`; all three only add the return from Settings so
the promise can settle. The dialog title test **gains** an assertion,
`{ onDismiss: expect.any(Function) }`.

### 1.3 The tests still guard

`grep -n /Users/muji/repos/rn.athan.uk` on each break script prints only its line 2 comment, no executable path, so
the scripts act on the worktree they run in. All three were run from the scratch worktree's root:

- `breaks-1.sh`: 10 lines `BREAK 1 … AS EXPECTED`, last line `ALL AS EXPECTED: 1`;
- `breaks-2.sh`: 2 lines `BREAK 2 … AS EXPECTED`, last line `ALL AS EXPECTED: 1`;
- `breaks-3.sh`: 8 lines `BREAK 3 … AS EXPECTED`, last line `ALL AS EXPECTED: 1`.

`git status --porcelain` in the worktree was empty after each script.

The red check was rerun for **all three** steps, not just the riskiest, by reverting each step's source files to its
parent commit in the scratch worktree and running that step's named tests. Each reproduced the plan's expected red
line exactly:

| Step | Reverted | Plan expects | Observed |
| --- | --- | --- | --- |
| 1 | `hooks/useNotification.ts` | `Tests: 10 failed, 87 passed, 97 total` | `Tests: 10 failed, 87 passed, 97 total` |
| 2 | `app/index.tsx` | `Tests: 2 failed, 35 passed, 37 total` | `Tests: 2 failed, 35 passed, 37 total` |
| 3 | `stores/notifications.ts`, `device/notifications.ts` | `Tests: 7 failed, 7 total` | `Tests: 7 failed, 7 total` |

The tree was restored and `git status --porcelain` was empty afterwards.

The new suite was read against `__tests__/README.md` and follows it: a doc comment, imports in Biome's order, a
`describe` naming the fixed situation, `it` titles as present-tense sentences, three blocks per test, and `it.each`
with a comment naming its columns. It also obeys that page's "choosing inputs that can fail" rule, holding work in
flight on Dhuhr (index 2) and on the second of two days rather than on a starting value.

### 1.4 The whole suite

`yarn validate --watchman=false` in the scratch worktree exits 0:

```text
Statements   : 100% ( 3801/3801 )
Branches     : 100% ( 1649/1649 )
Functions    : 100% ( 785/785 )
Lines        : 100% ( 3412/3412 )
Test Suites: 154 passed, 154 total
Tests:       2 skipped, 4492 passed, 4494 total
```

The two skipped tests are not a regression and not a records error. `shared/__tests__/audioMatrix.test.ts:117` reads
`const itIfPrebuilt = (dir: string) => (existsSync(dir) ? it : it.skip);`, so those two run only where the native
`android`/`ios` folders exist. The main checkout has both and the scratch worktree has neither. Measured rather than
assumed: `npx jest shared/__tests__/audioMatrix.test.ts --selectProjects=unit` reports `Tests: 2 skipped, 7 passed,
9 total` in the scratch worktree and `Tests: 9 passed, 9 total` in the main checkout. That is the whole of the
difference, so `LOG.md`'s `Tests: 4494 passed, 4494 total` is accurate for the machine the hook ran on; this session's
own commits ran the hook in the main checkout and reported the same 4494 passed at 100% on all four measures. Total
and coverage agree.

### 1.5 Reviews

`LOG.md` records `Code Reviewer (GLM 5.3), verdict merge, 1 round` for each of the three step commits, with no
findings on steps 1 and 2 and one cosmetic note on step 3 that did not hold up the merge. No reviewer asked for a fix,
so `PLAN.md` section 10.2 ("Anticipated review fixes: None") was never reached and no fix outside the plan was
written. The `executed` docs commit was reread here in full rather than taken on its record; that reread produced
finding A.

`LOG.md` records no review verdict for the `executed` docs commit itself, although `EXECUTOR-BRIEF.md` section 4b item
5 asks for one and the merge message says "reviewed". `AUDITOR-BRIEF.md` section 3 item 5 asks for a recorded verdict
for step commits and for the auditor to reread each docs commit itself, which is what was done.

### 1.6 Device evidence

Every claim in section 8.1 is backed by a file under `~/athan-device-sweep/session6/`, and the numbers were recounted
here rather than read from `LOG.md`:

| Check | Command or file | Result |
| --- | --- | --- |
| Forced throws, before build | `80-before-seed.logcat.txt`, `80-before-throw.logcat.txt` | seed `0`, throw `4`; `FATAL EXCEPTION` `0` in both |
| Forced throws, after build | `80-after-seed.logcat.txt`, `80-after-throw.logcat.txt` | seed `0`, throw `4`; `FATAL EXCEPTION` `0` in both |
| Alarm tags, every dump | `alarms-start/prod-cold/isha-on/isha-off/end.txt` | only `ACTION_FORCE_STOP_RESCHEDULE` (1, the 2036 WorkManager alarm) and `expo.modules.notifications.NOTIFICATION_EVENT` (1, 3, 7, 3, 3). No other tag |
| Isha off, before the owner's steps | `isha_alarms.py alarms-prod-cold.txt alarms-prod-cold.txt off 5` | `ISHA ALARMS AS EXPECTED (off): 3 app alarms` |
| Isha on | `isha_alarms.py alarms-prod-cold.txt alarms-isha-on.txt on 5` | `ISHA ALARMS AS EXPECTED (on): 7 app alarms` |
| Isha off again | `isha_alarms.py alarms-isha-on.txt alarms-isha-off.txt off 5` | `ISHA ALARMS AS EXPECTED (off): 3 app alarms` |

The oracle reads "now" from each dump's own `nowRTC=`, so re-running it against the saved dumps is deterministic and
reproduces what the session saw. Turning Isha on added exactly four instants — the athan at 2026-09-16 20:31 and
2026-09-17 20:29, and the reminders five minutes before each — and turning it Off removed exactly those four, keeping
the owner's other three alarms throughout. The changed scheduling code therefore arms and cancels exactly on the real
OS.

The four screenshots were read here directly, not taken from the `vision (GLM 5.3 Flash)` answers `LOG.md` records.
Each agrees with what `vision` reported:

| File | `vision` said | Read here |
| --- | --- | --- |
| `80-before-throw.png` | `SPLASH` | Masjid icon on a plain background, no words, no list, clock 8:23 |
| `80-after-throw.png` | `ERROR` | "Oh no!", "Something went wrong. Try refreshing!" and a Refresh button, clock 8:30 |
| `79-back-from-settings.png` | `SILENT 5` | Isha sheet open, Athan **Silent** selected, Reminder "Before 5 min", clock 8:47 |
| `mock-final.png` | `YES` | Asr row highlighted, countdown `1m 3s`, Wed 16 Sep 2026, clock 8:57 |

The phone was then read with read-only adb: `get-state` `device`, `settings get global auto_time` `1`,
`dumpsys package com.mugtaba.athan | grep versionName` `versionName=1.27.179` (the mock build of `5881b9f2`), and the
live alarm dump holding the same tags as `alarms-end.txt`. One reading did not match the plan; see finding B.

### 1.7 The owner's rules

- **No visual change.** The only source changes are `hooks/useNotification.ts` (a promise and an app state listener),
  `app/index.tsx` (one boolean conjunct and a two-line comment) and the two `notifications.ts` files (awaiting). No
  colour, size, spacing, text, icon or animation is touched. `app/index.tsx`'s change makes the error screen appear
  *sooner* in a case where it was previously hidden by the splash; the screen itself is unchanged.
- **No substituted prayer time.** Nothing in the range copies, averages or invents a time.
- **`releases.json`, `uat`, EAS.** `git diff origin/uat-2..uat-2` touches none of them; the only occurrence of the
  string `releases.json` in the range is the records sentence saying it is untouched. No work was done on `uat`, and
  the builds were the local `build-prod.zsh`, `build-mock-ramadan.zsh` and `build-mock.zsh`.
- **No API key** appears in the range.
- **No ignore comment.** A scan for `istanbul ignore`, `c8 ignore` and `v8 ignore` over the range finds none.
- **No skipped hook.** No `--no-verify` anywhere in the range, and every step commit carries the hook's 100% coverage
  lines in `LOG.md`.

### 1.8 The records

`ai/features/uat-2/AUDIT-FINDINGS.md`'s session 6 text was compared with `PLAN.md` section 8.1's template by
extracting the template, substituting its seven placeholders with the values `LOG.md` records, and diffing. Three
lines differed: finding A. After finding A's fix the two are identical, with `<FINAL>` in its short form; see that
finding for why the short form was kept and how `PLAN.md` was corrected to match.

`ai/plans/README.md` row 1 read `EXECUTED` as audited, and `PLAN.md` section 6's four checklist lines are ticked with
the merge shas `3499b765`, `b6e2bf26` and `5881b9f2`, all of which resolve to the right commits.

`LOG.md`'s own records were then checked rather than quoted, which is what turned up finding C: its step 3 entry
claimed to have removed a blank line that the file still carried.

### 1.9 Judging the code itself, not only its match to the plan

The plan's own design was attacked here rather than assumed:

- **Finding 79, the dismissal path.** `showSettingsDialog` now passes `{ onDismiss: () => resolve(false) }`. If
  Android fired `onDismiss` *after* a button press, that would resolve `false` before the async Open Settings path
  could answer `true`, and the fix would be worse than the bug — and the suite, which drives a mocked `Alert`, could
  not see it. `node_modules/react-native/ReactAndroid/.../dialog/DialogModule.kt` lines 73 to 93 settle it: the
  listener holds a `callbackConsumed` flag, `onClick` invokes the JS callback and sets the flag, and `onDismiss`
  returns without invoking it once the flag is set. Both are guarded by `hasActiveReactInstance()`, so with no live
  React instance neither reaches JS and the Open Settings path never starts; with one, a button press always consumes
  the callback first. Either way `onDismiss` cannot answer behind a press, which is what the plan's decision 11
  claims. On iOS `Alert.alert` routes to `Alert.prompt`, which reads only `options?.userInterfaceStyle` and never
  `onDismiss`, so the path cannot fire there at all. The device proof agrees: the owner pressed Open Settings and came
  back to a sheet with Silent selected, which only happens if the promise answered `true`.
- **Finding 79, the listener.** `subscription` is referenced inside its own callback, which is safe because
  `AppState.addEventListener` never fires synchronously; the callback removes the subscription on the return, and
  `stop()` removes it when Settings fails to open, so no path leaks it. `shared/__mocks__/react-native.ts` already
  provided `AppState.addEventListener` returning `{ remove }` and `Linking.openSettings`, which is why the step needed
  no change there.
- **Finding 80.** `state` in `app/index.tsx:57` is `useAtomValue(syncLoadable).state`, so the `state !== 'hasError'`
  added at line 74 is the sync loadable's failure and nothing else.
- **Finding 82.** The plan claims the two `Promise.all` calls it leaves in the two files it changes cannot reject
  early. Both were read: `stores/notifications.ts:119` (`_cancelStaleNotificationIds`) and
  `device/notifications.ts:205` (`clearAllScheduledRemindersForPrayer`) map over promises that each carry their own
  `.catch`, so neither can reject. The claim holds. A repo-wide grep finds one more `Promise.all` in app source,
  `shared/notifications.ts:337` in `deleteLegacyAndroidAudioChannels`; it was read too, its promises carry
  `.catch(() => undefined)`, and it is outside the scheduling lock in any case.
- **One imprecision in the plan's prose, no change in behaviour.** `PLAN.md` section 5.3 says failures "still reject
  with the same first error". `Promise.all` rejects with the first rejection *in time*; `settleAll` rejects with the
  first rejection *by position*. With more than one simultaneous failure the two can name different errors. Nothing
  branches on which error it is — `withSchedulingLock` logs and rethrows, the refresh gate stays open either way, and
  the commit's rollback does not read it — so only a log line could differ. Recorded here rather than changed.

## 2. Findings

### Finding A: the records dropped the backticks around the final sha — FIXED

`ai/features/uat-2/AUDIT-FINDINGS.md` did not match `PLAN.md` section 8.1's template. The template writes the
placeholder as code, `` `<FINAL>` ``, in three places; the executed text wrote `5881b9f2` bare, while the planned-at
sha `` `b5159305` `` beside it in the same paragraph kept its backticks. A diff of the template with its placeholders
filled against the committed text showed these three lines and nothing else.

**Fixed** on `fix/audit-6-records-sha-backticks`, commit `7b66d8cf`, version 1.27.181, merged as `0f6ded1d`. The
pre-commit hook reported `Tests: 4494 passed, 4494 total` at 100% on all four measures. A `Code Reviewer`
(Claude Opus 5, isolation `worktree`) reviewed it in 1 round with no findings, verdict `merge`; it confirmed the match
independently by extracting section 8.1's template, filling the placeholders and comparing checksums, and confirmed
that stripping every backtick from the parent and the new blob leaves two byte-identical files, so nothing but those
three pairs changed.

**The short sha was kept, and `PLAN.md` corrected to say so.** `PLAN.md` section 8.1 defined `<FINAL>` as "the sha
from section 7.0", and section 7.0 item 4 writes the full 40 characters into `LOG.md`. The records are therefore
identical to the template only with `<FINAL>` in its short form. The short form was kept rather than expanded,
because the template's own comparison sha `` `b5159305` `` sits in the same sentence at eight characters, and because
`AUDIT-FINDINGS.md` quotes shas at seven or eight characters 26 times and never at any greater length. (A first count
of "27 against 2" was wrong: its pattern also caught the 3T's serial `8f7ada76` and, as the two longer matches, the
PID literal `1234512399` and the epoch `1789209000000`, none of them shas.) Under
`AUDITOR-BRIEF.md` section 4, FIX IT item 3 — "where the plan's own code was wrong, correct that step file too, so
the plan records what actually shipped" — section 8.1's definition of `<FINAL>` is amended to name the short form,
and section 7.0 item 4 now points at it, so the two no longer disagree. Section 7's build commands are untouched and
still take the full sha. That amendment rides in this audit commit rather than in finding A's step, because the need
for it was only found when this commit was reviewed, after `7b66d8cf` had merged.

### Finding B: the phone's stay-awake setting was on, not off — FIXED

`PLAN.md` section 7.5 item 1 runs `svc power stayon false` and its closing paragraph says the phone is left with "the
screen's stay-awake setting off"; `LOG.md` records `7.5: stayon false`. Read here,
`adb -s 8f7ada76 shell settings get global stay_on_while_plugged_in` returned `7` — stay-awake on for AC, USB and
wireless. Neither command the plan runs produces `7`: `stayon false` sets `0` and the `stayon usb` of section 7.0 item
8 sets `2`, so `7` is the value Android's Developer options "Stay awake" toggle writes. No file under
`~/athan-device-sweep/session6/` records either command's output, so which of them ran cannot be shown from the
evidence.

**Fixed** by running the plan's own clean-up command, `adb -s 8f7ada76 shell svc power stayon false`; the setting now
reads `0`, and `auto_time` still reads `1`. This is flagged to the owner in the session report, because the value
found is one only a hand on the phone produces: if the owner turned "Stay awake" on deliberately after the session
ended, it is one toggle in Developer options to put back.

### Finding C: the log claimed to have removed a blank line it still carried — FIXED

`LOG.md`'s step 3 entry answered its reviewer's one cosmetic note by saying the trailing blank line at the file's end
"was removed when this record was appended". It was not. The file still ended with two newlines — 48 lines, the 48th
empty — where `PLAN.md` and `AUDIT-FINDINGS.md` each end with one. The step 3 commit left two blank lines at the
file's end; `c8754092` only inserted lines, so one became the separator before the section it appended and one stayed
at the end.

This audit's own first draft of section 1.5 quoted the reviewer's note that sits beside that sentence and passed over
the sentence itself without checking it; the `Code Reviewer` (Claude Opus 5) on the audit commit caught it. It is the
same class of defect as finding A — a records claim that is not true — in the same session's records, and it is the
reason section 1.8 above now checks `LOG.md`'s own statements rather than quoting them.

**Fixed** on `fix/audit-6-log-trailing-blank-line`, commit `575272f8`, version 1.27.182, merged as `97a3c3c4`: the
record's correcting sentence now leads with the correction, says the blank line was not removed then and that the
audit session removed it, and the file ends with a single newline. The evidence is in the commit message:
`c8754092`, the docs commit that
appended the record, has numstat `24 0` for `LOG.md` — 24 insertions, no deletions — so nothing was removed then. A
`Code Reviewer` (Claude Opus 5) reviewed it over three rounds, verdict `merge`, re-deriving that numstat and the
newline comparison itself; its first round asked for the correction to be front-loaded so no reading of the sentence
could affirm the claim it exists to correct.

### Not findings, recorded

- **The `executed` docs commit has no review verdict in `LOG.md`.** See section 1.5.
- **Two agent worktrees predating this programme are left inside the repository**,
  `.claude/worktrees/agent-a4a4f7792d3c40794` and `agent-a602d3fc9ff621f86`. Both are dated 2026-09-14 and sit on
  coverage-session branches, so they are not session 6's; `git worktree list` shows the executor's own GLM reviewer
  worktrees were removed. They are left alone here, since the briefs only ever ask a session to remove its own. This
  audit's own reviewer worktrees, and its scratch worktree `~/athan-device-sweep/worktrees/audit-6`, are removed at the
  end of this session (`AUDITOR-BRIEF.md` section 5, item 1).

## 3. Verdict

**PASS.** The three steps match the plan character for character, every test still guards its line, the whole suite
passes at 100% on all four measures, the device evidence proves what the records claim, and no owner rule is broken.
The three findings above were all repaired in this session; none of them touched shipped behaviour — two were records
errors and one was a setting on the phone.

Row 1 of `ai/plans/README.md` is set to `DONE`, and row 6 of `ai/prompts/README.md` takes the text from `PLAN.md`
section 8.2. The next step is a planning session for row 2, session 6b.
