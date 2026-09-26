# Step 2: `lint-staged` 17.5.1 to 17.6.0

0. **Anchor check:** none. This step changes no source file. Instead it has three environment preconditions, all
   verified while planning on 2026-09-26. Re-verify them first:

   ```bash
   git --version        # must be at least 2.32.0; was 2.54.0 when planned
   node -v              # must be at least 22.22.1; was v24.14.1 when planned
   node -p "JSON.stringify(require('./package.json')['lint-staged'])"
   ```

   The third must print the config as JSON inside `package.json`, not a path to a `.lintstagedrc` file. If any of the
   three differs, STOP: v17 refuses to run below those versions, and a bare `.lintstagedrc` would be parsed as YAML
   and need the now-optional `yaml` package installed separately.

1. **Goal:** `lint-staged` runs at 17.6.0 and the pre-commit hook still lints and tests only the staged files.

2. **Branch:** `git checkout -b chore/bump-lint-staged-17-6-0 uat-2`

3. **Files:** `package.json`, `yarn.lock`, `app.json`. Nothing else, apart from `ai/plans/README.md` and this
   folder's `PLAN.md` and `LOG.md`.

4. **Tests first (red).** No new test, and no red. This is a minor with identical dependencies
   (`tinyexec@^1.3.1`, `picomatch@^4.0.7`, `string-argv@^0.3.2`, all unchanged from 17.5.1) and an unchanged
   `engines.node` floor of `>=22.22.1`.

   **The one behavioural change in 17.6.0, and why it does not reach this project.** Release 17.6.0 makes
   lint-staged stage a task's edits to ALL tracked files the task modifies, including files that were never staged.
   That matters for a config whose task rewrites files it was not handed, such as `() => "prettier --write ."`.
   This project's two tasks are `biome check --write --no-errors-on-unmatched` and
   `jest --bail --findRelatedTests --passWithNoTests`: both receive the staged filenames as arguments and write only
   those files. The repo also has no snapshot tests, the other common way a task writes an unstaged file
   (`find . -name __snapshots__` returns nothing and no test calls `toMatchSnapshot`). The owner declined the
   optional `--hide-unstaged` guard on 2026-09-26, so the hook is NOT edited in this step.

   Install:

   ```bash
   yarn add --dev lint-staged@17.6.0
   ```

5. **Change.** This is a `(specified)` step, and the version string is the whole change. The `lint-staged` block in
   `package.json` is NOT edited, and neither is `.husky/pre-commit`.

6. **Green.**

   ```bash
   npx lint-staged --version
   npx tsc --noEmit
   npx biome check . --error-on-warnings
   npx jest --silent --coverage --watchman=false
   ```

   The first prints `17.6.0`. `tsc` and Biome exit 0. The suite prints `Test Suites: 170 passed, 170 total` and
   `Tests: 2 skipped, 4660 passed, 4662 total`, with four `100%` coverage lines: statements 4234/4234, branches
   1892/1892, functions 857/857, lines 3825/3825.

   Then prove lint-staged still RUNS ITS TASKS, which neither the suite nor this step's own commit can show. This
   step stages only `package.json`, `yarn.lock`, `app.json` and markdown, and none of those match the tasks' glob
   (`**/*.{js,jsx,ts,tsx,mjs}`), so its commit prints `lint-staged could not find any staged files matching
   configured tasks`. That line proves lint-staged started, not that a task works.

   So run it directly against a file that does match, from a clean tree:

   ```bash
   printf '\n' >> shared/logger.ts
   git add shared/logger.ts
   npx lint-staged
   git reset -q HEAD shared/logger.ts; git checkout -- shared/logger.ts
   ```

   Expect `Running tasks for staged files…`, the line `**/*.{js,jsx,ts,tsx,mjs} — 1 file`, and a ticked line for each
   of the two tasks:

   ```
   ✔ biome check --write --no-errors-on-unmatched
   ✔ jest --bail --findRelatedTests --passWithNoTests
   ```

   It then exits 1 with `lint-staged prevented an empty git commit`, which is correct and expected: Biome strips the
   added newline, so nothing is left to commit. The ticked task lines are the proof; the exit code is not. Confirm
   `git status --porcelain` prints nothing afterwards. If either task errors, or no task line appears, STOP.

7. **Breaks.** None applies: no decision in this project's code changed.

8. **Version and commit.** Version command:

   ```bash
   node -e "const v=require('./package.json').version.split('.');v[2]=+v[2]+1;console.log(v.join('.'))"
   ```

   Set it in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). Edit each version string in
   place; never rewrite `app.json` by parsing and re-serialising it, because that reformats its arrays. Add by name:
   `package.json`, `yarn.lock`, `app.json`, plus `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.

   ```
   <VERSION> - chore(deps): lint-staged 17.6.0

   A minor with the same three dependencies and the same Node floor as 17.5.1.

   17.6.0 now stages a task's edits to every tracked file it modifies, including
   unstaged ones. Neither task here can do that: both take the staged filenames
   as arguments and write only those files, and the repo has no snapshot tests.
   The hook is unchanged, and --hide-unstaged is deliberately not added.

   The hook that runs it is the gate on this very commit, so the commit log is
   the proof it still works.
   ```

   In the commit log, expect `lint-staged could not find any staged files matching configured tasks`, because this
   step stages no file matching the tasks' glob. That is the healthy reading here; part 6's direct run is what proves
   the tasks themselves. If the log instead shows a task ERROR, STOP.

   **If any file appears in the commit that this step did not stage, STOP** (`PLAN.md` section 10). That is
   17.6.0's new behaviour reaching further than this plan measured, and it is a real finding.

9. **Review.** No subagent (`PLAN.md` section 11). Read the commit back with `git show <sha>` and check: exactly
   three files changed, the only `package.json` changes are the `lint-staged` version string and the version bump,
   the `lint-staged` config block is untouched, `.husky/pre-commit` is untouched, and no source file or test is
   touched. Record the read in `LOG.md`.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff chore/bump-lint-staged-17-6-0 -m "Merge chore/bump-lint-staged-17-6-0 into uat-2: lint-staged 17.6.0"
    ```

11. **Done when:**
    - `npx lint-staged --version` prints `17.6.0`;
    - part 6's direct run shows both ticked task lines, and the tree is clean afterwards;
    - the commit's log shows `Tests: 4662 passed, 4662 total` and four `100%` lines;
    - `git show --stat <sha>` lists exactly `package.json`, `yarn.lock`, `app.json` and this plan's bookkeeping;
    - `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0.
