# Step 1: `@types/node` 26.6.2 to 26.6.3

0. **Anchor check:** none. This step changes no source file, so it anchors on nothing. The pre-flight's branch and
   version checks are the whole gate.

1. **Goal:** `@types/node` runs at 26.6.3.

2. **Branch:** `git checkout -b chore/bump-types-node-26-6-3 uat-2`

3. **Files:** `package.json`, `yarn.lock`, `app.json`. Nothing else, apart from `ai/plans/README.md` and this
   folder's `PLAN.md` and `LOG.md`.

4. **Tests first (red).** No new test, and no red: this is a version move with no API change reaching this project.
   Node typings only, erased at build, and 26.6.3 is the `latest` dist-tag, released 2026-09-25.

   The acceptance is that the existing suite, which covers the whole app at 100%, still passes. Install:

   ```bash
   yarn add --dev @types/node@26.6.3
   ```

   Then confirm the version resolved, which must print `26.6.3`:

   ```bash
   node -p "require('./node_modules/@types/node/package.json').version"
   ```

   If it prints anything else, STOP (`PLAN.md` section 2.2, item 5).

5. **Change.** This is a `(specified)` step, and the version string IS the whole change. No source file is edited.
   If `tsc`, Biome or any suite fails after the install, that is a real incompatibility the plan did not predict:
   STOP and ask (section 2.2, item 2). Never pin back to 26.6.2 to make it pass, and never edit a test to suit it.

6. **Green.**

   ```bash
   npx tsc --noEmit
   npx biome check . --error-on-warnings
   npx jest --silent --coverage --watchman=false
   ```

   `tsc` and Biome exit 0. The suite prints `Test Suites: 170 passed, 170 total` and
   `Tests: 2 skipped, 4660 passed, 4662 total`, with four `100%` coverage lines: statements 4234/4234, branches
   1892/1892, functions 857/857, lines 3825/3825. These are the totals the planning session measured in its scratch
   worktree with this exact version installed.

7. **Breaks.** None applies: no decision in this project's code changed, so there is no behaviour to break. The
   existing suite at 100% coverage is the guard.

8. **Version and commit.** Version command:

   ```bash
   node -e "const v=require('./package.json').version.split('.');v[2]=+v[2]+1;console.log(v.join('.'))"
   ```

   Set it in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). Edit each version string in
   place; never rewrite `app.json` by parsing and re-serialising it, because that reformats its arrays and produces a
   diff of hundreds of lines. Add by name: `package.json`, `yarn.lock`, `app.json`, plus `ai/plans/README.md` and
   this folder's `PLAN.md` and `LOG.md`.

   ```
   <VERSION> - chore(deps): @types/node 26.6.3

   A types-only patch, released 2026-09-25 and the current latest. Node typings
   are erased at build, so nothing reaches either phone.

   Found by the session 22 freshness sweep, which re-measured all 30 non-SDK
   packages against the registry: 28 were already at their absolute latest.
   ```

9. **Review.** No subagent (`PLAN.md` section 11). Read the commit back with `git show <sha>` and check: exactly
   three files changed, the only `package.json` change is the one version string plus the version bump, `yarn.lock`
   moved only the `@types/node` entry, and no source file or test is touched. Record the read in `LOG.md`.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff chore/bump-types-node-26-6-3 -m "Merge chore/bump-types-node-26-6-3 into uat-2: @types/node 26.6.3"
    ```

11. **Done when:**
    - `node -p "require('./node_modules/@types/node/package.json').version"` prints `26.6.3`;
    - the commit's hook log ends with a `Tests:` line reading `2 skipped, 4660 passed, 4662 total` and four `100%`
      coverage lines;
    - `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0.
