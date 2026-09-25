# Step 5: `@types/react` 19.2.18 to 19.3.0

0. **Anchor check:** none. This step changes no source file, so it anchors on nothing. The pre-flight's version and
   branch checks are the whole gate.

1. **Goal:** `@types/react` runs at 19.3.0.

2. **Branch:** `git checkout -b chore/bump-types-react-19-3 uat-2`

3. **Files:** `package.json`, `yarn.lock`, `app.json`. Nothing else, apart from `ai/plans/README.md` and this
   folder's `PLAN.md` and `LOG.md`.

4. **Tests first (red).** No new test, and no red: this is a version move with no API change reaching this project.
   React typings only, erased at build, so neither phone sees them. Proven in the spike against the SDK-pinned `react` 19.2.3: `tsc` 0 and the full suite green.

   The acceptance is that the existing suite, which covers the whole app at 100%, still passes. Install:

   ```bash
   yarn add --dev @types/react@19.3.0
   ```

   Then confirm the version resolved, which must print `19.3.0`:

   ```bash
   node -p "require('./node_modules/@types/react/package.json').version"
   ```

   If it prints anything else, STOP (section 2.2, item 5).

5. **Change.** This is a `(specified)` step, and the version string IS the whole change. No source file is edited.
   If `tsc`, Biome or any suite fails after the install, that is a real incompatibility the plan did not predict:
   STOP and ask (section 2.2, item 2). Never pin back to 19.2.18 to make it pass, and never edit a test to suit it: the
   owner's ruling of 2026-09-25 is that a break is fixed forward, in the code.

6. **Green.**

   ```bash
   npx tsc --noEmit
   npx biome check . --error-on-warnings
   npx jest --silent --coverage
   ```

   `tsc` and Biome exit 0. The suite prints `Test Suites: 170 passed, 170 total` and
   `Tests: 2 skipped, 4647 passed, 4649 total`, with four `100%` coverage lines.

7. **Breaks.** None applies: no decision in this project's code changed, so there is no behaviour to break. The
   existing suite at 100% coverage is the guard, and step 8's break script re-proves it still bites.

8. **Version and commit.** Version command:

   ```bash
   node -e "const v=require('./package.json').version.split('.');v[2]=+v[2]+1;console.log(v.join('.'))"
   ```

   Set it in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). Add by name:
   `package.json`, `yarn.lock`, `app.json`, plus `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.

9. **Review.** No subagent (section 11). The session reviews its own diff: only the three files changed, only the one
   version string in `package.json`. Recorded in `LOG.md`.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff chore/bump-types-react-19-3 -m "Merge chore/bump-types-react-19-3 into uat-2: @types/react 19.3.0"
    ```

11. **Done when:**
    - `node -p "require('./node_modules/@types/react/package.json').version"` prints `19.3.0`;
    - `npx jest --silent --coverage` prints `Test Suites: 170 passed, 170 total`;
    - `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0.
