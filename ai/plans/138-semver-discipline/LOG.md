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

