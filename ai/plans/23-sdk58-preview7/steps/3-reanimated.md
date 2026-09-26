# Step 3: Reanimated 4.7.0 and worklets 0.13.0

0. **Anchor check:** none. This step changes no source file. Its risk is behavioural and the device proof in step 4
   is what covers it.

1. **Goal:** Reanimated runs at 4.7.0 with worklets 0.13.0, on the NEW layout-animations engine, which 4.7.0 makes
   the default.

2. **Branch:** `git checkout -b chore/reanimated-4-7 uat-2`

3. **Files:** `package.json`, `yarn.lock`, `app.json`. Nothing else, apart from `ai/plans/README.md` and this
   folder's `PLAN.md` and `LOG.md`.

4. **Tests first (red).** No new test, and no red expected in the suite. The risk here is not one a unit test can
   see: **4.7.0 makes the new layout-animations engine the default**, replacing the engine that drew every
   `entering`/`exiting` animation until now.

   The blast radius is ONE file, confirmed at "Planned at" by grepping `components/`, `app/` and `hooks/` for
   `FadeIn`, `FadeOut`, `SlideIn`, `ZoomIn`, `LinearTransition`, `entering=` and `exiting=`:

   | Site | What it animates |
   | --- | --- |
   | `components/modals/Modal.tsx` | `FadeIn`/`FadeOut` on the scrim; `SlideInDown`/`SlideOutDown` on the card, with the Android cubic easing and the iOS 220ms spring at dampingRatio 0.9 |

   Nothing else in the app uses a layout animation, so nothing else can regress from this change.

   The owner ruled on 2026-09-26 to take the new engine and prove it, rather than pin the legacy flag
   (`PLAN.md` decision 4). `USE_LEGACY_LAYOUT_ANIMATIONS_PROXY` is therefore NOT set in this step. It is the
   recorded fallback if step 4's measurement fails, and setting it would then be the owner's decision with the
   number in hand.

   Install, one command, because Reanimated and worklets are a matched pair:

   ```bash
   yarn add react-native-reanimated@4.7.0 react-native-worklets@0.13.0
   ```

   Confirm, which must print `4.7.0` and `0.13.0`:

   ```bash
   node -p "require('./node_modules/react-native-reanimated/package.json').version"
   node -p "require('./node_modules/react-native-worklets/package.json').version"
   ```

   If either prints something else, STOP (`PLAN.md` section 2.2, item 4).

5. **Change.** This is a `(specified)` step, and the version strings ARE the whole change. `components/modals/Modal.tsx`
   is NOT edited: its durations, easings and the iOS spring are the owner's settled visuals, and the point of this
   step is to find out whether the new engine renders them unchanged. Changing the file would destroy the
   comparison.

6. **Green.**

   ```bash
   npx tsc --noEmit
   npx biome check . --error-on-warnings
   npx jest --silent --coverage --watchman=false
   ```

   All three exit 0. The suite prints `Test Suites: 170 passed, 170 total` and
   `Tests: 2 skipped, 4660 passed, 4662 total`, with four `100%` coverage lines.

   A green suite here proves the API did not break. It proves NOTHING about how the modal looks or how smoothly it
   runs, because the test environment has no compositor: that is step 4's job, and `ai/AGENTS.md` performance rule 8
   says so directly ("perf marks measure JS-commit phases, not smoothness").

7. **Breaks.** None applies: no decision in this project's code changed.

8. **Version and commit.** Version command:

   ```bash
   node -e "const v=require('./package.json').version.split('.');v[2]=+v[2]+1;console.log(v.join('.'))"
   ```

   Set it in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). Edit each version string in
   place; never re-serialise `app.json`. Add by name: `package.json`, `yarn.lock`, `app.json`, plus
   `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.

   ```
   <VERSION> - chore(sdk58): Reanimated 4.7.0 and worklets 0.13.0

   4.7.0 makes the new layout-animations engine the default. The owner chose to
   take that default and prove it rather than pin the legacy flag, so
   USE_LEGACY_LAYOUT_ANIMATIONS_PROXY is deliberately not set.

   The blast radius is one file: components/modals/Modal.tsx is the only place
   in the app that uses entering/exiting animations. It is deliberately NOT
   edited, because its durations and easings are the owner's settled visuals and
   an unchanged file is what makes the before/after comparison meaningful.

   A green suite proves only that the API did not break. The device proof is
   what judges the animation, on both phones.
   ```

9. **Review.** No subagent (`PLAN.md` section 11). Read `git show <sha>` back and check: exactly three files plus
   bookkeeping, both version strings moved together, and `components/modals/Modal.tsx` untouched. Record the read in
   `LOG.md`.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff chore/reanimated-4-7 -m "Merge chore/reanimated-4-7 into uat-2: Reanimated 4.7.0, worklets 0.13.0"
    ```

11. **Done when:**
    - the two `node -p` commands print `4.7.0` and `0.13.0`;
    - `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0;
    - the suite prints `Test Suites: 170 passed, 170 total` with four `100%` lines;
    - `components/modals/Modal.tsx` is unchanged in the diff.
