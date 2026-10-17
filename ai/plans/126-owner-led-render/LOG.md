# Job 126 ledger

## Planning (2026-10-17)

Lane 126 opened on `lane/126` off `uat` `7e029a34` (2.0.958). Worktree
`$HOME/athan-gitree/worktrees/lane-126`, `yarn install` green, husky shim present.

Measurements taken before drafting (scratch fixture, `node board/reader.mjs`):
an OWNER-LED row maps to column `Owner-led` with `statusText` carrying the
recommendation; the Needs-first cell text (`her ruling on option B`) is discarded
by `parseNeeds` (digits only); `doneCount` excludes the row today with no test
pinning it; the template badges it `Owner steered` and the Blocked diversion in
`displayColumn` would move it on unmet needs.

Frontier closed in PLAN.md section 2: D126.1 to D126.9, all agent-ruled
2026-10-17.

Probes: the import-guard pattern (realpath both sides) proven silent under
`node --test` and live under direct spawn; `node --test
--experimental-test-coverage` table shape recorded (`file | line % | branch % |
funcs % | uncovered lines`); the glob form `node --test 'board/tests/*.test.mjs'`
is the working invocation on node 24.14.1 (a bare directory form misruns).

## Grill round 1 (2026-10-17)

`athan-plan-griller` dispatched cold on the plan folder. 12 findings: 11 applied
(fixture done-count arithmetic 2 not 1; row 905 rewritten to the true five-field
shape; preflight baseline guarded on the suite file existing because a no-match
glob exits 0 on node 24; break M1 now one perl pass over one pristine backup;
test 6's exit stub throws after recording and stderr is captured; M3/M4 red sets
corrected; `waitingLine` exported with three null-input unit assertions; test 9
asserts the wiring line verbatim and M6 added; test 4 pins 901/903/905 unmoved;
the queue cell's IN PROGRESS text pinned verbatim; test 7's red note and test 3's
unfailbable clause dropped). Finding 12 applied with a correction: the ledger
contract IS locatable, at `ai/plans/TEMPLATE.md` line 43; section 8 now names
the heading and cites the contract's home. Gate re-run: PLAN OK.

session: ses_eb8752c07ffe2COk531xvsg1MD


### Step 01 — executed

Branch `feat/126-owner-led-render` off `uat` `ad503c60` (2.0.965). Preflight
`PREFLIGHT OK` (branch, base, clean tree, fetch, version floor, node 24, all
ten anchors count 1, suite baseline red).

Red: `node --test 'board/tests/*.test.mjs'` reports
`SyntaxError: The requested module '../reader.mjs' does not provide an export
named 'main'` and the whole file fails - the recorded red for all ten tests,
test 8 included per the plan's import-failure note.

Change: the plan's contracts verbatim - exports on the six functions,
`waitingLine` under `parseNeeds`, the `awaitingOwner` local plus the
`awaitingOwner`/`waitingOn` pair after `column` in `ticketFromOpenRow`, the
two fields in `main`'s five-field DONE literal, the realpath guard at the
foot; template `displayColumn` OWNER-LED exclusion, `Awaiting owner` badge,
`waitingEl` beside `reasonOf`, the wiring line after the reason append, the
`.waiting` rule beside `.context`.

Green: `node --test --experimental-test-coverage 'board/tests/*.test.mjs'`
10 pass, 0 fail. Coverage table `reader.mjs` row: `64.62 | 70.83 | 56.76 |
64-65 89-93 109-113 125-135 137-141 143-162 164-188 190-198 200-202 210-213
218-224 229-234 236-260 265-276 294-296 381-382`; every range is
pre-existing fixture-dead code (unmapped-status branch, plan-folder
machinery, steps callback, version catch), none inside a touched range.
`npx tsc --noEmit` exit 0; `npx biome check . --error-on-warnings` exit 0.

Break defect and repair: the first run of `break-126.sh` printed
`run_suite: command not found` six times yet ended `ALL AS EXPECTED: 6` -
`expect_red` calls `run_suite`, which the planning commit never defined, so
the suite never ran and the pass was vacuous. Repair: added the missing
`run_suite()` running the plan's verbatim command
`node --test 'board/tests/*.test.mjs'` (four lines in this plan folder's
script; no mutant, output or criterion changed). Second run, genuine:
M1-M6 each `red as expected`, ends `ALL AS EXPECTED: 6`, restores clean,
post-break suite green, `git status --porcelain` lists only this step's
files.

Version 2.0.968 under the version lock (next patch above local uat 2.0.965
and lane/125 2.0.967; origin/uat still 2.0.857, unpushed), `app.json`
`expo.version` first then `package.json`. Queue row 126 Status cell set
verbatim to `IN PROGRESS, step 1 (plan at ai/plans/126-owner-led-render)`.

Commit `754add4d` on `feat/126-owner-led-render`, hooked: `Tests: 2 skipped,
5735 passed, 5737 total`; coverage summary Statements/Branches/Functions/Lines
all `100%` (5400/5400, 2326/2326, 1130/1130, 4837/4837). Review: read cold
against the step checklist and the shipped classes, two passes, no findings;
the stdout line is byte-identical, no other status's fields moved, the
waiting line is OWNER-LED-only and truthiness-guarded, no dead code.

Blocked at the merge, then resumed. The first merge attempt (03:22) was
refused by `check-version-uniqueness`: lane weather in the main tree (an
uncommitted sibling bump to 2.0.968 that later landed as part of lanes
111/125 finishing - `83d4dcd8` 2.0.968 merge, `3aee9f4d` 2.0.969 docs,
`62a4f024`/`bb6efb7c` 2.0.969 merges, `1788e83c` "2.0.970" fix whose tree
is 2.0.969). Those lanes left two landed non-merge commits sharing
tree-version 2.0.969, so the pre-commit gate exited 1 repo-wide until the
lead allowlisted the pair at merge `70684082` (gat then `VERSIONS OK`, uat
at 2.0.971). Evidence: `$HOME/athan-gitree/sessions/126/` (gate.txt,
gate2.txt, blocked-main-tree-status.txt, both watch logs,
commit-126-step1.log). Resumed per the lead's dispatch: the step commit
amended off the collided 2.0.968 onto the next free patch, the branch
rebased onto the settled uat (row 126's IN PROGRESS cell and the higher
version kept), merged `--no-ff` in the main tree, gradle synced, Finishing
run. The amended sha, merge sha and docs values are recorded below.

Amended to 2.0.972: the first amend was refused by the gate in this
worktree because its pre-rebase checkout carried the pre-allowlist
`scripts/`, so the order became rebase-then-amend (the rebase replay runs
no hook; the README conflict resolved to uat's row 125 DONE cell, one row
126 in uat's position carrying the IN PROGRESS cell, and the duplicate
NOT PLANNED 126 dropped; the version files resolved to 2.0.972). Amended
step commit `7df85e3d` `2.0.972 - feat(board): an OWNER-LED row reads as
awaiting the owner (126)`, hooked: `Tests: 2 skipped, 5737 passed, 5739
total`; coverage Statements/Branches/Functions/Lines all `100%`. Merged
into `uat` as `7994faa0` `2.0.972 - merge feat/126-owner-led-render:
ticket 126 step 1` under uat.lock, gate `VERSIONS OK` first; the main
tree's gradle versionName synced to 2.0.972 under build.lock (one
substitution). Finishing: this docs commit at 2.0.974 (uat had moved to
2.0.973 under lane/122's merge while the version lock was held), queue row
126 set to the plan's DONE cell, ticket EXECUTED.

session: ses_eb85bcb88ffeFrk5TjzypO9MDF

