# Execution log: Session 22

Planned, executed and audited in one session on 2026-09-26, with no subagents, under the owner's ruling of that day.

## Pre-flight

`bash $TMPDIR/preflight-22.sh 1` printed `PREFLIGHT OK`. Its registry check confirmed both planned versions are
still the `latest` dist-tag at execution time: `@types/node: latest is still 26.6.3`,
`lint-staged: latest is still 17.6.0`. No anchors to check, because neither step edits a source file.

## Step 1: `@types/node` 26.6.2 to 26.6.3

- Branch: `chore/bump-types-node-26-6-3`.
- `yarn add --dev @types/node@26.6.3` exited 0 and reapplied both patch-package patches
  (`expo-background-task@58.0.3 ✔`, `expo-widgets@58.0.3 ✔`).
- `node -p "require('./node_modules/@types/node/package.json').version"` printed `26.6.3`, as the step requires.
- Green: `tsc` 0, Biome 0, `Test Suites: 170 passed, 170 total`, `Tests: 4662 passed, 4662 total`, and 100% on
  statements (4234/4234), branches (1892/1892), functions (857/857) and lines (3825/3825). These match the plan's
  predicted totals exactly.
- Breaks: none applies (no decision in this project's code changed).
- Version 1.28.30, commit `16132762`. Hook: `Test Suites: 170 passed`, `Tests: 4662 passed, 4662 total`, four 100%
  coverage lines.
- Review, one pass, no findings: `git show` lists exactly `package.json`, `yarn.lock`, `app.json` and this plan's
  bookkeeping. The `package.json` change is the version bump plus the one dependency string; `yarn.lock` moved only
  the `@types/node` entry, with no transitive churn. No source file, no test.
- Merged into `uat-2`.

## Step 2: `lint-staged` 17.5.1 to 17.6.0

- Branch: `chore/bump-lint-staged-17-6-0`.
- Preconditions re-verified before the install: `git version 2.54.0` (floor 2.32.0), `node v24.14.1` (floor
  22.22.1), and the `lint-staged` config printed as JSON inside `package.json` rather than a YAML rc file.
- `yarn add --dev lint-staged@17.6.0` exited 0; `npx lint-staged --version` printed `17.6.0`.
- Green: `tsc` 0, Biome 0, `Test Suites: 170 passed, 170 total`, `Tests: 4662 passed, 4662 total`, and 100% on
  statements (4234/4234), branches (1892/1892), functions (857/857) and lines (3825/3825), identical to step 1's
  totals, as the plan predicted.
- `yarn.lock` moved the `lint-staged` entry and bumped its optional `yaml` dependency from `^2.9.0` to `^2.9.1`, a
  patch range the plan did not name but which is inside `lint-staged`'s own dependency set rather than a change to
  this project. No other entry moved.
- 17.6.0's new auto-staging behaviour was re-checked against this repo before committing: `find . -name
  __snapshots__` returns nothing, so no task can write an unstaged snapshot, and both staged tasks take the staged
  filenames as arguments.
- Breaks: none applies (no decision in this project's code changed).
