# Audit: Session 22. The dependency freshness sweep

Audited 2026-09-26, in a scratch worktree at `~/athan-device-sweep/worktrees/audit-22`, detached at `2d57d237`, with
`node_modules` symlinked from the main checkout.

Planned, executed and audited in one session under the owner's ruling of 2026-09-26, with no subagents. The audit is
still the independent gate: every number below was produced by this audit from the worktree, not copied from the
executor's own run.

## Verdict: PASS

Nothing needed fixing. The one defect this session met was in the PLAN rather than the code, and the execution phase
had already found it, corrected the step file and recorded it (see item 6).

## What was checked

### 1. The range holds only legitimate commits

`git log --oneline origin/uat-2..uat-2` lists 14 commits: 7 non-merge and their 7 merges. Every one belongs to this
session's work, and all four docs commits were reread in full for this audit:

| Version | Commit | What it is |
| --- | --- | --- |
| 1.28.26 | `e21c5c4c` | The workflow rewrite: subagents banned but `vision`, and the model-name scrub |
| 1.28.27 | `1d040dfe` | The device atlas is read before screenshotting |
| 1.28.28 | `d43ab375` | Session 22 planned |
| 1.28.29 | `51f9d729` | The 2026-09-26 rulings recorded in `ai/AGENTS.md` |
| 1.28.30 | `16132762` | Step 1, `@types/node` 26.6.3 |
| 1.28.31 | `7880649e` | Step 2, `lint-staged` 17.6.0 |
| 1.28.32 | `bd9241ac` | The executed docs commit |

**Versions run 1.28.26 to 1.28.32 with no gap and no repeat.** All three version files agree at `HEAD`:
`package.json` 1.28.32, `app.json` 1.28.32, gradle `versionName "1.28.32"`.

### 2. Each step commit does what the plan specified, and nothing else

Read `git show` for both step commits.

- **Step 1** touches `package.json`, `yarn.lock`, `app.json` and this plan's bookkeeping. The `package.json` change
  is the version bump plus `"@types/node": "26.6.2"` to `"26.6.3"`. `yarn.lock` moved only the `@types/node` entry,
  with no transitive churn.
- **Step 2** touches the same file set. The `package.json` change is the version bump plus
  `"lint-staged": "17.5.1"` to `"17.6.0"`. `yarn.lock` moved the `lint-staged` entry and bumped its optional `yaml`
  dependency `^2.9.0` to `^2.9.1`, which is inside lint-staged's own dependency set rather than a change this
  project made. `LOG.md` records that, which is the right call: an unexplained lockfile line is how a real change
  hides.

**No source file was touched at all.** `git diff --name-only origin/uat-2..uat-2` matching
`^(app|components|stores|hooks|shared|device|api|widgets|modules)/` returns **0**. That is the expected shape for
this session: one package is typings erased at build, the other a commit-time tool.

**The hook and the task config are untouched**, which the owner's ruling required: 0 files under `.husky/` in the
range, and no diff line touching `biome check --write` or `findRelatedTests`.

### 3. The installed tree matches what was committed

From the main checkout's `node_modules`, not from `package.json`:

- `@types/node` **26.6.3**
- `lint-staged` **17.6.0**

### 4. The whole suite

`yarn validate` in the scratch worktree: **exit 0**, `Test Suites: 170 passed, 170 total`,
`Tests: 2 skipped, 4660 passed, 4662 total`, and 100% on statements (4234/4234), branches (1892/1892), functions
(857/857) and lines (3825/3825). These match the plan's predicted totals exactly.

### 5. Breaks

None, and correctly so. Neither step changes a decision this project's code makes, so there is no behaviour to
break; the plan says this in both steps' part 7. The existing suite at 100% coverage is the guard, and item 4 ran it
independently.

### 6. The plan defect, and whether the correction was right

Step 2's part 6 originally claimed its own commit would prove lint-staged still works, and that the commit log would
carry "two ticked task lines". That was wrong, and running it proved so: the step stages `package.json`,
`yarn.lock`, `app.json` and markdown, none of which match the tasks' glob `**/*.{js,jsx,ts,tsx,mjs}`, so the hook
printed `lint-staged could not find any staged files matching configured tasks`.

This audit agrees with the execution phase's reading on both counts. That line proves lint-staged STARTED under
husky and nothing more, so accepting it would have left the session's one genuinely behavioural bump unproven. And
the replacement proof is sound: running `npx lint-staged` against a staged file that does match ticked both tasks:

```
    **/*.{js,jsx,ts,tsx,mjs} — 1 file
✔ biome check --write --no-errors-on-unmatched
✔ jest --bail --findRelatedTests --passWithNoTests
```

The non-zero exit that followed (`prevented an empty git commit`) is the healthy outcome, because Biome stripped the
test newline, leaving nothing to commit. The tree was clean afterwards, which this audit confirmed with
`git status --porcelain`.

`steps/2-lint-staged.md` parts 6, 8 and 11 were corrected to match what actually shipped, which is
`AUDITOR-BRIEF.md` section 4, item 3 applied by the executor to its own plan. The finding was promoted to
`AUDIT-FINDINGS.md` as a durable lesson rather than left in `LOG.md`, correctly: it is session 21's lesson recurring
in a new shape, and the next session to bump a hook-adjacent tool needs it.

### 7. The sweep's central claim, re-measured

The audit re-ran the registry measurement itself rather than trusting the plan's table. Of the 30 in-scope non-SDK
packages, **26 now read `same` and 4 read `MOVED`**, and all four movers are the `@babel` packages the plan
deliberately excludes. `@types/node` and `lint-staged` no longer appear as movers, which is the direct evidence that
this session's two bumps landed.

The Babel blocker was re-verified against the installed tree, not inherited from the record:
`babel-preset-expo@58.0.3` carries **36** `@babel/*` dependencies and `@react-native/babel-preset@0.88.0-rc.0` pins
`@babel/core ^7.25.2`. So the four stay with row 18, exactly as the plan and records say.

### 8. The owner's rules

| Rule | Checked | Result |
| --- | --- | --- |
| `releases.json` untouchable | `git diff --name-only` in the range | 0 hits |
| `uat` never touched | no commit in the range targets `uat` | holds |
| No coverage ignore comments | `grep` for `istanbul/c8/v8 ignore` on added lines | 0 |
| No skipped hooks | `grep no-verify` on added lines | 1 hit, and it is PROSE: a line in `PLANNER-BRIEF.md` describing a future session's brief conflict, not a command |
| API key never committed | `grep EXPO_PUBLIC_API_KEY=` on added lines | 0 |
| No visual change | no file under `app/`, `components/`, `widgets/` or any asset | 0 |
| EAS read-only | no EAS command ran | holds |
| Dependencies only by the plan's exact command | both installs were the step's `yarn add --dev <pkg>@<version>` | holds |

### 9. The records

`ai/features/uat-2/AUDIT-FINDINGS.md`'s new section is accurate against everything above: the two versions, the
28-of-30 measurement, the `lint-staged` behavioural change and why it cannot reach this project, the Babel blocker
with its re-measured numbers, the 18 SDK-pinned packages left to row 18, and the test and coverage totals. The
durable lesson it records is the one this session actually learned.

### 10. No device evidence, correctly

The plan claims none and needs none. `@types/node` is TypeScript typings erased at build; `lint-staged` runs at
commit time and is never bundled. Neither can reach a phone, so there is nothing a device could have shown. The
Find X8 has gone back to the owner, which `ai/plans/README.md` row 21 already recorded.

## Findings

**None that require a fix.** Two observations worth recording, neither a defect in this session's work:

1. **A sweep that finds almost nothing is the expected steady state, and that is worth saying plainly** so a future
   session does not treat a short table as a failed measurement. Session 21 moved eight packages because it was the
   first pass after a long gap; session 22 moved two because it ran a day later. The value is the 28 that were
   checked and found current, and the four that were confirmed still blocked.
2. **`yarn.lock` moved a line the plan did not name** (lint-staged's optional `yaml` from `^2.9.0` to `^2.9.1`).
   That is normal for a dependency bump and it is inside the upgraded package's own tree, but it is recorded in
   `LOG.md` rather than passed over, which is the habit that keeps an unexplained lockfile line visible.
