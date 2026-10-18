# LOG - ticket 138, the semver discipline

## Planning (2026-10-18)

Row opened: lane worktree created at `e37a3210`, `yarn install` under `commit.lock`
(10.22 s, hooks armed), row supersession recorded at 2.0.1052 (`0bd92795`, hook Tests:
2 skipped, 5759 passed).

Research (cited in PLAN.md 4.4): semver.org spec text verbatim; Expo App version
management (`version` = user-facing store version, `versionCode` = developer-facing
counter); Android in-app updates data table; Apple iTunes Lookup; live GB storefront
measurements 2026-10-18 (this app publishes 1.5.1; WhatsApp publishes 26.40.77 for a
comparator shape). Local measurements: no `updates` block in `app.json`, `versionCode`
fixed at 1000000, every live lane commit bumps (693f986a -> 2.0.1051, a8220b8e ->
2.0.1038), the 2.0 line has no non-2.0.x version in history.

Frontier taken agent-ruled: D138.1 to D138.9 (PLAN.md 2.1), each argued twice inline.

Draft: PLAN.md and four step files written, anchors extracted byte-exact (6 anchors,
4 to 13 lines each), preflight and three break scripts committed in the plan folder.

Grill round one (13 findings) and round two (9 findings) applied: staged fixture
candidates, `&&`-chained hook lines (plain-sh masking), parent-plus-one version
arithmetic with a weather STOP, pinned script shapes for the break mutations,
`ALL AS EXPECTED: 1` endings, the scoped sweep, the standalone renumbering sentence,
record accuracy.

Lane weather at the READY merge, 2026-10-18: `uat` advanced under lane/135's merges
(2.0.1053, 2.0.1054) while this lane planned; the first rebase attempt committed
conflict markers into one replay (the sequencer bypasses hooks - caught by the
hand-verification pass, aborted cleanly), the second rebase renumbered but left
2.0.1055 on two replays (a clean apply skipped the resolver). Resolution: the five
plan-phase commits (row supersession, plan draft, grill repairs one and two, READY)
squashed into one commit off `uat` at 2.0.1055, hooks run for real on the squash;
the pre-rebase history sits in this session's reflog. The queue row union also lost
the newline between rows 138 and 137 (the row-70 corruption class) - repaired before
the squash. The pre-rebase shas named above are reflog-only now.

session: ses_eb16f7078ffeLzeR40NvnWMrqH

### Step 1 - DONE

Branch `step/138-discipline` off `lane/138` (parent `1a7ebffe`, 2.0.1055). Anchor
`uniqueness-merge-handling.md` in `scripts/check-version-uniqueness.js` counts 1.
Pre-flight (copy run from `$TMPDIR`): `PREFLIGHT OK`.

Red: `scripts/__tests__/checkVersionDiscipline.test.ts` written first; first run
`npx jest scripts/__tests__/checkVersionDiscipline.test.ts --watchman=false` =
`Tests: 14 failed, 14 total`, every case red on the spawn (`node` exit 1, stderr
`Error: Cannot find module '.../scripts/check-version-discipline.js'`; the jest
assertion line reads `Expected: 0 / Received: 1` on the status checks, empty
stdout on the FAIL-line checks). Red log: `$TMPDIR/138-step1-red.log`.

Change: `scripts/check-version-discipline.js` (new, CommonJS, no dependency,
shaped like the uniqueness script), `scripts/version-major-allowlist.json` (new,
`[]`, entry contract in the script header), `.husky/commit-msg` now one
`&&`-chained line: identifiers then discipline `--message-file "$1"`.

Green: suite `Tests: 14 passed, 14 total`; `npx tsc --noEmit` exit 0;
`npx biome check . --error-on-warnings` exit 0 (456 files); `yarn validate`
exit 0: `Test Suites: 223 passed, 223 total`, `Tests: 2 skipped, 5774 passed,
5776 total`. Logs: `$TMPDIR/138-step1-green.log`, `$TMPDIR/138-step1-validate.log`.

Break (`bash ai/plans/138-semver-discipline/scripts/break-138-discipline.sh`
from the worktree root), pre-commit run: last two lines
`BREAK OK` / `ALL AS EXPECTED: 1`. Post-commit re-run recorded below.

Version: 2.0.1056 (parent 2.0.1055 + one patch), uniqueness arbitration green
pre-bump (`VERSIONS OK 37 commits across 6 refs, 0 unreadable, no shared
version`; 2.0.1056 unheld), `version.lock` held around the bump and released.
`android/app/build.gradle` absent in this worktree (gitignored prebuild
output; the lockstep test asserts gitignore in its absence), so no gradle
sync applies at step scope.

Commit subject: `2.0.1056 - build(scripts): 138 step 1 the version discipline
gate (feat-requires-minor, majors allowlisted)`. Merged `--no-ff` into
`lane/138`.

Commit `22d4ca66` (2.0.1056), hook chain green, last `Tests:` line
`Tests: 2 skipped, 5774 passed, 5776 total` with four 100% coverage lines
(statements 5417/5417, branches 2352/2352, functions 1131/1131, lines
4853/4853) and the gate's own live verdict
`DISCIPLINE OK 2.0.1055 -> 2.0.1056 (patch, build)`. Post-commit break
re-run: `BREAK OK` / `ALL AS EXPECTED: 1`. Merge `a4171586` onto `lane/138`
(pre-merge uniqueness `VERSIONS OK 38 commits across 6 refs`, commit-msg
`DISCIPLINE SKIP merge in flight` - R1.5 proven live). Commit log:
`$TMPDIR/138-step1-commit.log`, merge log: `$TMPDIR/138-step1-merge.log`.

session: ses_eb1418e09ffeq7HHXZZKDx98yk

### Step 2 - DONE

Branch `step/138-merge-gate` off `lane/138` (parent `a4171586`, 2.0.1056).
Anchor `lane-merge-bullet.md` in `.opencode/agents/athan-lane.md` counts 1.

Red: `describe('check-version-discipline merge check')` appended (4 cases);
first run `npx jest scripts/__tests__/checkVersionDiscipline.test.ts
--watchman=false` = `Tests: 4 failed, 14 passed, 18 total`. Actual first
failure lines: `increasing incoming version passes` - `Expected: 0 /
Received: 1`; `equal incoming version fails` - `Expected pattern:
/^MERGE VERSION FAIL/` against `Received string: "DISCIPLINE FAIL no
message file"`; `lower incoming version fails` - toBe diff, received
`DISCIPLINE FAIL no message file`; `missing staged app.json fails` -
`Expected pattern: /^MERGE VERSION FAIL no staged app.json/` against the
same `DISCIPLINE FAIL no message file`. All four red exactly per the plan's
prediction (`--merge-check` ignored, class path with no message file). Red
log: `$TMPDIR/138-step2-red.log`.

Change: `--merge-check` arm in `scripts/check-version-discipline.js` (reads
HEAD and the staged merge result, compares with `incomingTotal > headTotal`
inside one major line and `incoming.major > head.major` across lines - both
pinned names verified present once each); `.husky/pre-merge-commit` now one
`&&`-chained line: uniqueness `--no-candidate` then discipline
`--merge-check`.

Green: suite `Tests: 18 passed, 18 total`; `npx tsc --noEmit` exit 0;
`npx biome check . --error-on-warnings` exit 0; `yarn validate` exit 0:
`Test Suites: 223 passed, 223 total`, `Tests: 2 skipped, 5778 passed,
5780 total`. Logs: `$TMPDIR/138-step2-green.log`,
`$TMPDIR/138-step2-validate.log`.

Break (`bash ai/plans/138-semver-discipline/scripts/break-138-merge-gate.sh`
from the worktree root): last two lines `BREAK OK` / `ALL AS EXPECTED: 1`;
the perl's cmp guard proves the mutation landed.

Version: 2.0.1057 (parent 2.0.1056 + one patch), uniqueness arbitration
green pre-bump (`VERSIONS OK 38 commits across 7 refs, 0 unreadable, no
shared version`; 2.0.1057 unheld), `version.lock` held around the bump and
released. Gradle file still absent in this worktree (prebuild output).

Commit `c501c785` (2.0.1057), hook chain green, last `Tests:` line
`Tests: 2 skipped, 5778 passed, 5780 total` with four 100% coverage lines
and the gate's own live verdict
`DISCIPLINE OK 2.0.1056 -> 2.0.1057 (patch, build)`. Merge `5c44eced` onto
`lane/138`: the new pre-merge hook fired live with
`MERGE VERSION OK 2.0.1056 -> 2.0.1057` (R2.2 proven on a real merge) and
commit-msg printed `DISCIPLINE SKIP merge in flight`. Commit log:
`$TMPDIR/138-step2-commit.log`, merge log: `$TMPDIR/138-step2-merge.log`.
This ledger completion rides its own plan commit so the tree ends clean for
the step 3 pre-flight.

session: ses_eb1418e09ffeq7HHXZZKDx98yk

### Step 3 - STOPPED (break script defect, needs the lead's repair)

Branch `step/138-lockstep-shape` off `lane/138` (parent `72a99841`, 2.0.1058).
Anchor `lockstep-shape.md` in `shared/__tests__/versionLockstep.test.ts`
counts 1.

Code landed and proven, then reverted uncommitted (patch saved):
tightened live assertion
`/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/` plus the new case
`rejects a suffixed or zero-padded version shape` (own copy of the regex,
three literal assertions). Red proof: `app.json`/`package.json` temporarily
`2.0.1054-rc1` (the plan's literal string), suite
`Tests: 1 failed, 3 passed, 4 total`, failing line `Expected pattern:
/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/ Received string: "2.0.1054-rc1"`,
reverted, green `Tests: 4 passed, 4 total`. tsc 0, biome 0,
`yarn validate` 0 (`Tests: 2 skipped, 5779 passed, 5781 total`).

Break: `bash ai/plans/138-semver-discipline/scripts/break-138-lockstep.sh`
prints `BREAK LOCKSTEP COULD NOT MUTATE (perl matched nothing)` and exits 1
against the correct implementation. Root cause (verified in isolation, see
`$HOME/athan-gitree/sessions/138/step3-break-diagnosis.md`): the perl
pattern's `$/` immediately before `\E` interpolates Perl's input record
separator (NUL under `-0`) instead of matching the literal `$/`, so the
substitution cannot match any file content; the pinned literal is present in
the suite source exactly twice. The step file's prose contract ("loosens the
tightened regex back to the loose /\d+\.\d+\.\d+/ with perl, cmp guard fails
loudly when the perl changed nothing") is implementable only after a
one-character repair to the plan-given script (`\$/` for `$/` in the
pattern) - a plan artifact, so the executor's call is STOP, not a silent
edit. Step 4 (docs, no break script) is unaffected but unstarted: the batch
order is step 3 first.

Work saved: `$HOME/athan-gitree/sessions/138/step3-unfinished.patch` (the
suite edit), `step3-break-diagnosis.md`, `step3-break-failure.log`,
`step3-red-proof.log`. Tree restored clean, empty step branch deleted.
Resume from: step 3, part break (apply the patch, run the repaired break
script, then version/commit/merge; step 4 after).

session: ses_eb1418e09ffeq7HHXZZKDx98yk
