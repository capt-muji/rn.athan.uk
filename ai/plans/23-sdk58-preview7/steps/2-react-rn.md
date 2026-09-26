# Step 2: React 19.3.0 and React Native 0.88.0-rc.2

0. **Anchor check:** none. This step changes no source file.

1. **Goal:** React and React DOM run at 19.3.0, and React Native at 0.88.0-rc.2 with its two `@react-native/*`
   tools in lockstep.

2. **Branch:** `git checkout -b chore/react-19-3-rn-088-rc2 uat-2`

3. **Files:** `package.json`, `yarn.lock`, `app.json`. Nothing else, apart from `ai/plans/README.md` and this
   folder's `PLAN.md` and `LOG.md`.

4. **Tests first (red).** No new test, and no red expected. `expo@58.0.0-preview.7` pins `react` and `react-dom` at
   19.3.0 and `react-native` at `0.88.0-rc.1`; this step takes **rc.2**, which is the owner's instruction to be on
   the latest regardless of RC status (`PLAN.md` decision 1).

   rc.2 over rc.1 is two changes, neither of which this project touches:

   | rc.2 change | Why it does not reach us |
   | --- | --- |
   | Metro minimum bumped to 0.87.1 | Metro is resolved through `@react-native/metro-config`, which moves with it in the same command |
   | `RCTArrayBuffer` codegen revert, restoring `NSMutableData *` for ObjC TurboModules | This project ships no ObjC TurboModule taking or returning an `ArrayBuffer`; `modules/tls13` is Android-only Kotlin |

   Install, one command, because React and its renderer must never resolve apart:

   ```bash
   yarn add react@19.3.0 react-dom@19.3.0 react-native@0.88.0-rc.2
   yarn add --dev @react-native/jest-preset@0.88.0-rc.2 @react-native/metro-config@0.88.0-rc.2
   ```

   Confirm the resolved versions, which must print `19.3.0`, `19.3.0` and `0.88.0-rc.2`:

   ```bash
   node -p "require('./node_modules/react/package.json').version"
   node -p "require('./node_modules/react-dom/package.json').version"
   node -p "require('./node_modules/react-native/package.json').version"
   ```

   If any prints something else, STOP (`PLAN.md` section 2.2, item 4).

5. **Change.** This is a `(specified)` step, and the version strings ARE the whole change. No source file is edited.
   `@types/react` stays at 19.3.0, where session 21 already put it, and now describes the runtime exactly rather
   than running ahead of it.

6. **Green.**

   ```bash
   npx tsc --noEmit
   npx biome check . --error-on-warnings
   npx jest --silent --coverage --watchman=false
   ```

   All three exit 0. The suite prints `Test Suites: 170 passed, 170 total` and
   `Tests: 2 skipped, 4660 passed, 4662 total`, with four `100%` coverage lines.

   A React major-minor move can change how `react-test-renderer`-based suites behave, so if a `components` project
   suite fails here, that is real and it is a STOP (`PLAN.md` section 2.2, item 2). Do not adjust a test to suit it.

7. **Breaks.** None applies: no decision in this project's code changed.

8. **Version and commit.** Version command:

   ```bash
   node -e "const v=require('./package.json').version.split('.');v[2]=+v[2]+1;console.log(v.join('.'))"
   ```

   Set it in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). Edit each version string in
   place; never re-serialise `app.json`. Add by name: `package.json`, `yarn.lock`, `app.json`, plus
   `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.

   ```
   <VERSION> - chore(sdk58): React 19.3.0 and React Native 0.88.0-rc.2

   preview.7 pins react and react-dom at 19.3.0 and react-native at rc.1. RN is
   taken at rc.2 instead, on the owner's instruction to be on the latest
   regardless of RC status: rc.2 is a Metro floor bump plus a revert of an ObjC
   ArrayBuffer codegen change, and this project ships no ObjC TurboModule.

   @types/react has been at 19.3.0 since session 21, where it ran ahead of the
   runtime on purpose. It now describes the installed React exactly.
   ```

9. **Review.** No subagent (`PLAN.md` section 11). Read `git show <sha>` back and check: exactly three files plus
   bookkeeping, every changed line a version string, no source file touched. Record the read in `LOG.md`.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff chore/react-19-3-rn-088-rc2 -m "Merge chore/react-19-3-rn-088-rc2 into uat-2: React 19.3.0, RN 0.88.0-rc.2"
    ```

11. **Done when:**
    - the three `node -p` commands print `19.3.0`, `19.3.0` and `0.88.0-rc.2`;
    - `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0;
    - the suite prints `Test Suites: 170 passed, 170 total` with four `100%` lines.
