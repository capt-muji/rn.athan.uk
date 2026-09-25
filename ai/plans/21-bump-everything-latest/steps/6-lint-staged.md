# Step 6: `lint-staged` 15.5.2 to 17.5.1

0. **Anchor check:** none. This step changes no source file. Instead it has three environment preconditions, which
   `lint-staged` 17's own `MIGRATION.md` sets, and all three were verified while planning. Re-verify them first:

   ```bash
   git --version        # must be at least 2.32.0; was 2.54.0 when planned
   node -v              # must be at least 22.22.1; was v24.14.1 when planned
   node -p "JSON.stringify(require('./package.json')['lint-staged'])"
   ```

   The third must print the config as JSON inside `package.json`, not a path to a `.lintstagedrc` file. If any of the
   three differs, STOP: v17 refuses to run below those versions, and a bare `.lintstagedrc` would be parsed as YAML
   and need the now-optional `yaml` package installed separately.

1. **Goal:** `lint-staged` runs at 17.5.1 and the pre-commit hook still lints and tests only the staged files.

2. **Branch:** `git checkout -b chore/bump-lint-staged-17 uat-2`

3. **Files:** `package.json`, `yarn.lock`, `app.json`.

4. **Tests first (red).** No new test, and no red. Two majors are crossed here and neither breaking change touches
   this project, which is why the anchor check above is the real gate rather than a failing test:

   | v16/v17 breaking change | Why it does not apply |
   | --- | --- |
   | Node 20 dropped, 22.22.1 is the floor | This project is on v24.14.1 |
   | Git must be 2.32.0 or newer | 2.54.0 |
   | `yaml` is now an optional dependency | The config is JSON, inside `package.json` |
   | The `--shell` option is removed | No task uses shell syntax; both are plain binaries with arguments |
   | Processes spawn via `nano-spawn`, not `execa` | Neither task is a bare `.js` script; both are binaries |
   | Refuses to run on files staged with `--intent-to-add` | This programme never stages that way |

   Install:

   ```bash
   yarn add --dev lint-staged@17.5.1
   ```

5. **Change.** This is a `(specified)` step, and the version string is the whole change. The `lint-staged` block in
   `package.json` is NOT edited: its two tasks, `biome check --write --no-errors-on-unmatched` and
   `jest --bail --findRelatedTests --passWithNoTests`, are both binaries taking arguments, which is exactly the shape
   v17 still supports.

6. **Green.**

   ```bash
   npx lint-staged --version
   npx tsc --noEmit
   npx biome check . --error-on-warnings
   npx jest --silent --coverage
   ```

   The first prints `17.5.1`. `tsc` and Biome exit 0. The suite prints `Test Suites: 170 passed, 170 total` and
   `Tests: 2 skipped, 4647 passed, 4649 total`, with four `100%` coverage lines.

   Then prove lint-staged itself still runs, which the suite cannot show, by letting the real hook exercise it in
   step 8's commit. The commit in part 8 IS that proof: its log must contain a lint-staged task list.

7. **Breaks.** None applies: no decision in this project's code changed.

8. **Version and commit.** Version command:

   ```bash
   node -e "const v=require('./package.json').version.split('.');v[2]=+v[2]+1;console.log(v.join('.'))"
   ```

   Set it in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). Add by name: `package.json`,
   `yarn.lock`, `app.json`, plus `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.

   ```
   <VERSION> - chore(deps): lint-staged 17.5.1

   Two majors, neither breaking change reaching this project: the config is JSON
   inside package.json rather than a YAML file, so the now-optional yaml
   dependency is not needed, and both staged tasks are binaries with arguments
   rather than shell strings, so the removal of --shell changes nothing. Git
   2.54.0 and Node v24.14.1 clear v17's floors of 2.32.0 and 22.22.1.

   The hook that runs it is the gate on this very commit, so the commit log is
   the proof it still works.
   ```

   In the commit log, confirm a lint-staged task list appears above the `Tests:` line. If lint-staged errors, STOP.

9. **Review.** No subagent (section 11). The session reviews its own diff: three files, one version string, and the
   `lint-staged` config block untouched. Recorded in `LOG.md`.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff chore/bump-lint-staged-17 -m "Merge chore/bump-lint-staged-17 into uat-2: lint-staged 17.5.1"
    ```

11. **Done when:**
    - `npx lint-staged --version` prints `17.5.1`;
    - the commit's log shows lint-staged ran, then `Tests: ... passed` and four `100%` lines;
    - `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0.
