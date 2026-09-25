# Step 7: `husky` 8.0.3 to 9.1.7, with the hooks and the gate's own test

**Read this before starting.** This step rewires the only quality gate this project has. There is no CI: the
pre-commit hook is the whole of it. A mistake here does not fail loudly, it silently stops checking, so part 11's
checks are not a formality and the step is not finished until every one of them passes.

0. **Anchor check.** From the repository root; both must print `1`:

   ```bash
   python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/21-bump-everything-latest/scripts/anchors/7-1.txt shared/__tests__/qualityGate.test.ts
   python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/21-bump-everything-latest/scripts/anchors/7-2.txt .husky/pre-commit
   ```

   Any count other than `1` means NEEDS REPLAN (section 2.2, item 1).

1. **Goal:** husky runs at 9.1.7, both hooks fire in their v9 form, and `qualityGate.test.ts` pins the v9 wiring.

2. **Branch:** `git checkout -b chore/bump-husky-9 uat-2`

3. **Files:** `package.json`, `yarn.lock`, `.husky/pre-commit`, `.husky/pre-push`,
   `shared/__tests__/qualityGate.test.ts`, `app.json`.

4. **Tests first (red).** Install husky 9 and set the `prepare` script, then run the guard suite:

   ```bash
   yarn add --dev husky@9.1.7
   ```

   Now set both scripts in `package.json` to the bare `husky`: `prepare` and `husky`. v9 deprecates `husky install`,
   which prints `husky - install command is DEPRECATED`. Then:

   ```bash
   npx jest shared/__tests__/qualityGate.test.ts --watchman=false --selectProjects=unit
   ```

   Exactly one test must fail, and this is the step's red:

   ```
   ● husky is wired into install › declares a prepare script, so yarn install arms the hook

     Expected substring: "husky install"
     Received string:    "husky"
   ```

   That test is a guard doing its job: it pinned the v8 spelling of the install command. If any OTHER test in that
   suite fails, STOP: the rest of the file pins the hook being tracked, executable, and running lint-staged and
   validate, and none of that may change in this step.

   **The test that changes, and why.** `shared/__tests__/qualityGate.test.ts`, the test named
   `declares a prepare script, so yarn install arms the hook`. Its premise is unchanged: `prepare` must still arm the
   hook on install. Only the command's spelling moved, so the assertion moves from `husky install` to `husky`. What it
   proves, the input it reads and what it asserts are otherwise identical. Every other test in the file must pass
   untouched.

5. **Change.** This is a `(specified)` step.

   **5a. `package.json` scripts.** `prepare` and `husky` both become exactly `husky`. Do not use `husky install`: it
   warns in v9 and fails in v10.

   **5b. The two hook files.** v9 drops the two-line shim. Delete these two lines from the top of BOTH
   `.husky/pre-commit` and `.husky/pre-push`, leaving the rest of each file exactly as it is:

   ```sh
   #!/usr/bin/env sh
   . "$(dirname -- "$0")/_/husky.sh"
   ```

   `.husky/pre-commit` is then one line, the lint-staged and validate chain. `.husky/pre-push` keeps its whole
   `while read` loop unchanged. Both files must stay executable: v9 runs them through `sh`, and
   `qualityGate.test.ts` asserts the executable bit on `pre-commit`.

   **5c. The guard test.** In `shared/__tests__/qualityGate.test.ts`, the assertion becomes
   `expect(scripts().prepare).toContain('husky');`, with this comment above it, which records WHY the spelling moved:

   ```ts
       // husky 9 renamed the install command to a bare `husky`; `husky install` warns and dies in v10
   ```

   **What v9 changes underneath, so the checks in part 11 make sense.** v9 points `core.hooksPath` at `.husky/_`
   rather than `.husky`, and generates a dispatcher in `.husky/_/` for every hook name. Each dispatcher resolves back
   to the tracked file one directory up, so `.husky/_/pre-commit` runs `.husky/pre-commit`. `.gitignore` already
   ignores `.husky/_`, which is correct for v9 as it was for v8, and `qualityGate.test.ts` already asserts that only
   `.husky/_` is ignored. Nothing in `.gitignore` changes.

6. **Green.**

   ```bash
   yarn husky
   git config core.hooksPath
   npx jest shared/__tests__/qualityGate.test.ts --watchman=false --selectProjects=unit
   npx tsc --noEmit
   npx biome check . --error-on-warnings
   npx jest --silent --coverage
   ```

   `git config core.hooksPath` must print `.husky/_`. If it still prints `.husky`, the plumbing was not regenerated:
   run `yarn husky` again, and STOP if it still disagrees. The guard suite passes all its tests. `tsc` and Biome exit
   0. The full suite prints `Test Suites: 170 passed, 170 total` and `Tests: 2 skipped, 4647 passed, 4649 total`,
   with four `100%` coverage lines.

7. **Breaks.** `bash ai/plans/21-bump-everything-latest/scripts/breaks-7.sh`, which ends `ALL AS EXPECTED: 1`. It
   breaks the two things this step's test guards: the `prepare` script, and the hook's validate chain.

8. **Version and commit.** Version command:

   ```bash
   node -e "const v=require('./package.json').version.split('.');v[2]=+v[2]+1;console.log(v.join('.'))"
   ```

   Set it in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). Add by name: `package.json`,
   `yarn.lock`, `.husky/pre-commit`, `.husky/pre-push`, `shared/__tests__/qualityGate.test.ts`, `app.json`, plus
   `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.

   ```
   <VERSION> - chore(deps): husky 9.1.7

   husky 9 points core.hooksPath at .husky/_ and generates a dispatcher per hook
   there, which resolves back to the tracked file above it, so both hooks lose
   the two-line shim that sourced husky.sh themselves. The v8 shim warns today
   and fails outright in v10.

   `prepare` and `husky` become the bare `husky` command, and
   qualityGate.test.ts follows: it pinned the v8 spelling, which is the guard
   working rather than breaking. Its premise is unchanged, that prepare arms the
   hook on install.

   This commit is gated by the hook it rewrites, so its own log is the proof:
   lint-staged, validate and the coverage gate all ran through husky 9.
   ```

   **This commit is its own proof.** It is gated by the very hook it rewrites, so read the log carefully: lint-staged
   must run, then `Tests:` ending `passed, <n> total`, then four `100%` coverage lines. If the commit succeeds without
   those lines, the hook did NOT run and the gate is silently gone: STOP immediately, and do not merge.

9. **Review.** No subagent (section 11). The session reviews its own diff: both hooks keep their bodies and their
   executable bit, only the shim is gone, `.gitignore` is untouched, and only the one assertion in the guard suite
   changed. Recorded in `LOG.md`.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff chore/bump-husky-9 -m "Merge chore/bump-husky-9 into uat-2: husky 9.1.7"
    ```

11. **Done when:**
    - `node -p "require('./node_modules/husky/package.json').version"` prints `9.1.7`;
    - `git config core.hooksPath` prints `.husky/_`;
    - `node -p "require('./package.json').scripts.prepare"` prints `husky`;
    - `test -x .husky/pre-commit && test -x .husky/pre-push` exits 0;
    - `head -1 .husky/pre-commit` is NOT `#!/usr/bin/env sh`;
    - the commit's log shows `Running tasks for staged files`, the two ticked task lines (`✔ biome check --write --no-errors-on-unmatched` and `✔ jest --bail --findRelatedTests --passWithNoTests`), then `Tests: ... passed` and four `100%` lines, proving the hook ran. lint-staged 17 does NOT print its own name, so never grep for the word `lint-staged`;
    - `npx jest --silent --coverage` prints `Test Suites: 170 passed, 170 total`.
