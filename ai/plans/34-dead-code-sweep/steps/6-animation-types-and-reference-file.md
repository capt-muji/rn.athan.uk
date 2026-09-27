# Step 6: Delete the animation chain, the two stored types and the reference file

0. **Anchor check:** run `bash $TMPDIR/preflight-34.sh 6`. Anchors `6-1`, `6-2` and `6-3` must each
   print `1`. Any other count, or `EMPTY ANCHOR`, means NEEDS REPLAN.

1. **Goal:** the last three dead exports leave the tree with the private code and the 791-line
   reference file they orphan, and the standing guard is un-skipped because it can finally pass.

2. **Branch:** `git checkout -b chore/34-animation-types-and-reference uat-2`

3. **Files:**
   - `hooks/useAnimation.ts`, `shared/types.ts`
   - `mocks/timing-system-schema.ts` (deleted)
   - `hooks/__tests__/imperativeAnimations.test.ts`
   - `shared/__tests__/unusedExports.test.ts` (un-skipped)
   - `ai/AGENTS.md` (its repo map names the deleted file)
   - `app.json`, `package.json`
   - `ai/plans/README.md`, `ai/plans/34-dead-code-sweep/PLAN.md`, `ai/plans/34-dead-code-sweep/LOG.md`

4. **Tests first (red).**

   **The cascade animation is NOT touched by this step.** The word "cascade" in this repository means
   the date-roll cascade, which lives in `components/prayer/Prayer.tsx`, `Time.tsx` and `Alert.tsx`
   and animates through `useDerivedOpacity`, `useDerivedColor` and `useDerivedFill`. All three of
   those hooks stay, as do `ANIMATION.cascadeDelay` and `getCascadeDelay`. `useAnimationOpacity` is a
   separate, uncalled hook. Owner, 2026-09-27.

   Make the production edits of part 5 first, then run:

   ```bash
   npx tsc --noEmit
   ```

   **Expected, exactly these two lines:**

   ```
   hooks/__tests__/imperativeAnimations.test.ts(11,10): error TS2305: Module '"../useAnimation"' has no exported member 'useAnimationOpacity'.
   mocks/timing-system-schema.ts(13,69): error TS2724: '"@/shared/types"' has no exported member named 'StoredPrayerSequence'.
   ```

   The second disappears as soon as that file is deleted, which part 5 does.

   | Suite | Change | What it proves after |
   | --- | --- | --- |
   | `hooks/__tests__/imperativeAnimations.test.ts` | remove `useAnimationOpacity` from the import clause, delete its `describe` block, and narrow the shared `hooks` table to `useAnimationScale` alone | every `useAnimationScale` assertion is unchanged, including the two shared tables about delay and the JS-thread callback |
   | `shared/__tests__/unusedExports.test.ts` | remove the `.skip` and the comment above it | the guard now runs, and passes, for the first time |

   **The `hooks` table** becomes, verbatim:

   ```ts
   const hooks = [['useAnimationScale', useAnimationScale]] as const;
   ```

   Its two shared `it.each` tables keep their names and their assertions; they simply run over one
   hook rather than two.

   **The guard's un-skip.** Delete this comment line and change `describe.skip(` back to `describe(`:

   ```ts
   // Skipped until session 34's last deletion lands: the symbols it reports are still in the tree
   ```

   Run:

   ```bash
   npx jest hooks/__tests__/imperativeAnimations.test.ts shared/__tests__/unusedExports.test.ts --watchman=false --selectProjects=unit
   ```

   Expected after the edits: both pass, and `unusedExports.test.ts` reports
   `Tests: 2 passed, 2 total`. If the guard FAILS here, the sweep still reports a symbol outside the
   allow-list: STOP (`PLAN.md` section 2.2, item 5), because an earlier step left something behind.

   Tests that must NOT change: every `useAnimationScale` assertion, and every other suite in the repo.

5. **Change.** This is a `(specified)` step.

   **Anchor `6-2`, then `6-1`, `hooks/useAnimation.ts`.** Delete in this order, so each deletion's
   orphan is visible before the next:

   1. the `useAnimationOpacity` doc comment and its whole `export const`, and the blank line after it;
   2. `createTimingAnimation` (anchor `6-2`), its doc comment and whole body, now with no caller;
   3. `DEFAULT_TIMING` (anchor `6-1`), now with no reader.

   This is the chain of dead code the owner ruled goes whole: 🐋 "Delete the hook and its
   now-orphaned helpers". Biome names each link in turn, so run
   `npx biome check . --error-on-warnings` after each deletion and act on what it says.

   **Keep everything else in that file**, and check each by name after the deletions:
   `useAnimationScale`, `createSpringAnimation`, `DEFAULT_SPRING`, `useDerivedOpacity`,
   `useDerivedColor`, `useDerivedFill` and `AnimationOptions`. `createSpringAnimation` still uses
   `withDelay` and `runOnJS`, and the derived hooks still use `withTiming`, so no import is orphaned;
   Biome decides that, not the plan.

   **Anchor `6-3`, `shared/types.ts`:** delete `StoredPrayer` and `StoredPrayerSequence`, each with
   its whole doc comment. The anchor covers `StoredPrayer`; `StoredPrayerSequence` follows it
   directly, with its own three-line comment. Delete both, and the blank line after the second.

   **Delete `mocks/timing-system-schema.ts` entirely**, with `git rm mocks/timing-system-schema.ts`.
   It is a 791-line reference document that nothing imports, no test loads and coverage does not
   measure, though `tsc` typechecks it on every run. It was the only file naming either type. The
   design decision it documented, that a prayer sequence is rebuilt on every launch and never
   persisted, is already recorded in `ai/AGENTS.md` under "One moment per prayer (ISSUES #29)" and in
   `ai/adr/005-timing-system-overhaul.md`, so nothing is lost.

   **`ai/AGENTS.md`'s repo map names the deleted file.** Delete this line from the `mocks/` block:

   ```
   │   └── timing-system-schema.ts  # Timing system type reference (unused)
   ```

   and change the line above it so `full.ts` becomes the block's last entry, with `└──` in place of
   `├──`.

   **The invariant this step keeps:** every exported symbol is reachable from production code by an
   import, or is named in the allow-list with the mechanism that reaches it. After this step the
   sweep reports exactly five symbols, all allow-listed, and the guard enforces it from here on.

6. **Green.**

   ```bash
   npx jest hooks/__tests__/imperativeAnimations.test.ts shared/__tests__/unusedExports.test.ts --watchman=false --selectProjects=unit
   npx jest components/prayer --watchman=false --selectProjects=components
   ```

   All pass. `components/prayer` is run here deliberately: those are the three components that own the
   date-roll cascade, so this is the check that the cascade animation is untouched. It reports
   `Tests: 58 passed, 58 total`.

   Then:

   ```bash
   npx tsc --noEmit
   npx biome check . --error-on-warnings
   ```

   Both exit 0.

   ```bash
   python3 scripts/find-unused-exports.py
   ```

   prints `NEVER reachable from production code: 5`, and lists only `ErrorBoundary` and the four
   `MAX_WHATS_NEW_*` constants.

   Finally, the whole suite, because this is the step where the guard goes live:

   ```bash
   yarn validate
   ```

   Expected: 100% on statements, branches, functions and lines, and `Test Suites: 176 passed`.

7. **Breaks.** Save as `$TMPDIR/breaks-34-6.sh` and run `bash $TMPDIR/breaks-34-6.sh` from the
   repository root.

   ```bash
   #!/bin/bash
   # Step 6 breaks: the kept animation hook must still be guarded, the cascade must still be
   # wired, and the guard must catch a new orphan.
   set -u
   cd /Users/muji/repos/rn.athan.uk || exit 1
   caught=0
   total=0

   try() { # try <label> <file> <perl> <suites> <project> <expected>
     total=$((total + 1))
     cp "$2" "$2.bak"
     perl -pi -e "$3" "$2"
     if cmp -s "$2" "$2.bak"; then
       echo "BREAK NOT APPLIED: $1"
       mv "$2.bak" "$2"
       return
     fi
     if npx jest $4 --watchman=false --selectProjects=$5 --silent > "$TMPDIR/b34-6.log" 2>&1; then
       echo "NOT CAUGHT: $1 (expected $6 to fail)"
     else
       echo "caught: $1 (expected $6)"
       caught=$((caught + 1))
     fi
     mv "$2.bak" "$2"
   }

   # The hook this step KEEPS must still spring, and still on the house spring
   try "the scale hook does not animate" hooks/useAnimation.ts \
     "s/^      value\.value = createSpringAnimation\(toValue, options\);\$/      \/\/ broken/" \
     "hooks/__tests__/imperativeAnimations.test.ts" unit \
     "springs to the target with the house press spring, and draws the spring"

   # Its delay handling is one of the two shared tables that narrowed
   try "the scale hook ignores a delay" hooks/useAnimation.ts \
     "s/^  return options\?\.delay \? withDelay\(options\.delay, animation\) : animation;\$/  return animation;/" \
     "hooks/__tests__/imperativeAnimations.test.ts" unit \
     "useAnimationScale, given a delay of 150 ms, holds its animation back only when the delay is above zero"

   # The date-roll cascade must still stagger its rows. This step does not touch it, and the
   # break is here to prove that.
   try "the cascade delay is always zero" shared/prayer.ts \
     "s/^  return \(length - index\) \* ANIMATION\.cascadeDelay;\$/  return 0;/" \
     "shared/__tests__/prayer.test.ts" unit \
     "returns correct delay for standard schedule"

   # And the guard must still catch a brand-new orphan
   cp shared/time.ts shared/time.ts.bak
   printf '\n/** Planted by the break script */\nexport const plantedDeadExport = (): number => 1;\n' >> shared/time.ts
   total=$((total + 1))
   if npx jest shared/__tests__/unusedExports.test.ts --watchman=false --selectProjects=unit --silent > "$TMPDIR/b34-6.log" 2>&1; then
     echo "NOT CAUGHT: a new orphan (expected the guard to fail)"
   else
     echo "caught: a new orphan (expected both guard tests)"
     caught=$((caught + 1))
   fi
   mv shared/time.ts.bak shared/time.ts

   echo "caught $caught of $total"
   [ "$caught" = "4" ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
   ```

   | Break | Expected to fail |
   | --- | --- |
   | the scale hook does not animate | `springs to the target with the house press spring, and draws the spring` |
   | the scale hook ignores a delay | `useAnimationScale, given a delay of 1 ms, holds its animation back only when the delay is above zero` (the narrowed shared table, which runs a case per delay) |
   | the cascade delay is always zero | `returns correct delay for standard schedule`, proving the cascade is still wired |
   | a new orphan | both guard tests, proving the guard is live from this commit on |

   Ends `ALL AS EXPECTED: 1`. All four were run while planning and all four failed their named test.

   **If a break prints `BREAK NOT APPLIED`,** STOP (`PLAN.md` section 2.2, item 4). Never reshape the
   code to fit a break.

   Afterwards, `git status --porcelain` must list only this step's files and the three plan files,
   and no `.bak` file may remain.

8. **Version and commit.** Version command as step 1. Add by name (note `git rm` already staged the
   deleted file):

   ```
   hooks/useAnimation.ts
   shared/types.ts
   mocks/timing-system-schema.ts
   hooks/__tests__/imperativeAnimations.test.ts
   shared/__tests__/unusedExports.test.ts
   ai/AGENTS.md
   app.json
   package.json
   ai/plans/README.md
   ai/plans/34-dead-code-sweep/PLAN.md
   ai/plans/34-dead-code-sweep/LOG.md
   ```

   Commit message, to `$TMPDIR/msg-6.txt` with `<VERSION>` replaced:

   ```
   <VERSION> - chore(hooks, types): delete the last dead exports, and turn the guard on

   useAnimationOpacity had no caller, and deleting it left createTimingAnimation
   with none, which left DEFAULT_TIMING with none: a chain three deep that Biome
   named one link at a time. It goes whole.

   This is NOT the date-roll cascade. That animation lives in Prayer.tsx, Time.tsx
   and Alert.tsx, runs through useDerivedOpacity, useDerivedColor and
   useDerivedFill, and is untouched here, along with ANIMATION.cascadeDelay and
   getCascadeDelay. useAnimationScale keeps its own spring path and every one of
   its tests. The paired it.each tables narrow to the one hook that exists.

   StoredPrayer and StoredPrayerSequence describe a sequence cache this app does
   not have. shared/types.ts's own comment warned that reasoning about the stored
   datetime "will send you looking for a bug that cannot be there".
   mocks/timing-system-schema.ts was the only file naming them, and it is a
   791-line reference document nothing imports, no test loads and coverage does not
   measure, while tsc typechecks it on every run. The design decision it recorded,
   that a sequence is rebuilt on every launch rather than persisted, already lives
   in ai/AGENTS.md and ADR-005.

   shared/__tests__/unusedExports.test.ts is un-skipped. The sweep now reports five
   symbols and every one is allow-listed with the mechanism that reaches it, so
   from this commit the next orphan fails the commit that creates it.
   ```

9. **Review.** Read `git show <sha>` back cold against this list:

   - `useAnimationScale`, `createSpringAnimation`, `DEFAULT_SPRING`, `useDerivedOpacity`,
     `useDerivedColor` and `useDerivedFill` are all still present in `hooks/useAnimation.ts`;
   - `components/prayer/Prayer.tsx`, `Time.tsx` and `Alert.tsx` are NOT in the diff;
   - `ANIMATION.cascadeDelay` is still in `shared/constants.ts` and `getCascadeDelay` still in
     `shared/prayer.ts`, neither file in the diff;
   - the `hooks` table is byte-identical to the plan's one-line form;
   - both shared `it.each` tables keep their names and assertions;
   - `ReadablePrayer`, `Prayer` and `PrayerSequence` are all still exported from `shared/types.ts`;
   - `mocks/timing-system-schema.ts` shows as deleted, and `mocks/simple.ts` and `mocks/full.ts` are
     untouched;
   - `ai/AGENTS.md`'s `mocks/` block is well-formed, with `full.ts` as its last entry;
   - `shared/__tests__/unusedExports.test.ts` differs from step 1's version by exactly the removed
     `.skip` and the removed comment line;
   - the allow-list is unchanged at five entries;
   - no deleted symbol's name survives in a comment;
   - the version is bumped in both files and they match;
   - nothing beyond part 3's files changed.

   A clean read is: one hook and two private helpers gone, two types gone, one reference file gone,
   one repo-map line corrected, and a guard that now runs.

   A finding is handled by `EXECUTOR-BRIEF.md` section 4, item 8.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff chore/34-animation-types-and-reference -m "Merge chore/34-animation-types-and-reference into uat-2: the last dead exports removed and the sweep guard turned on, reviewed"
    ```

11. **Done when:**

    - `python3 scripts/find-unused-exports.py` prints
      `NEVER reachable from production code: 5`, listing only `ErrorBoundary` and the four
      `MAX_WHATS_NEW_*`;
    - `npx jest shared/__tests__/unusedExports.test.ts --watchman=false --selectProjects=unit` prints
      `Tests:       2 passed, 2 total`;
    - `npx tsc --noEmit` exits 0;
    - `npx biome check . --error-on-warnings` exits 0;
    - `grep -rn 'useAnimationOpacity\|createTimingAnimation\|DEFAULT_TIMING\|StoredPrayer' app/ components/ shared/ stores/ hooks/ device/ mocks/` prints nothing;
    - `grep -c 'useDerivedOpacity\|useAnimationScale' hooks/useAnimation.ts` prints `2` or more;
    - `grep -c 'cascadeDelay' shared/constants.ts` prints `1`;
    - `ls mocks/` lists `full.ts` and `simple.ts` only;
    - `yarn validate` passes with four `100%` lines and `Test Suites: 176 passed`.

    Tick the step in `PLAN.md` section 6, and append to `LOG.md` as step 1 part 11 says, plus the
    `yarn validate` totals, because this is the step that proves the whole sweep.
