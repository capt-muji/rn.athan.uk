# Step 3: No success haptic on an instant open

0. **Anchor check.** From the repository root:

   ```bash
   python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
     ai/plans/52-qibla-wait/scripts/anchors/3-1.txt components/sheets/screens/Qibla.tsx
   ```
   Expect exactly `1`. Any other count means NEEDS REPLAN (`PLAN.md` section 2.2, item 1).

   **Step 1 does not move this anchor**, verified in the planning worktree: step 1 changes `QiblaSubtitle`, which
   sits above this effect, and the anchor's own five lines are untouched by it.

1. **Goal.** The arrival haptic fires only when the compass genuinely arrived, so a warm reopen that draws on its
   first frame announces nothing.

2. **Branch.**
   ```bash
   git checkout -b fix/qibla-no-haptic-on-instant-open uat-2
   ```

3. **Files.** Exactly these two:
   - `components/sheets/screens/Qibla.tsx`
   - `components/sheets/screens/__tests__/Qibla.test.tsx`

   Nothing else, apart from `app.json`, `package.json`, `ai/plans/README.md` and this plan folder's `PLAN.md`
   and `LOG.md`. **`hooks/useQibla.ts` is NOT in this step**: step 2 already reports `arrivedWarm` and this step
   only consumes it.

4. **Tests first (red).**

   Suite: `components/sheets/screens/__tests__/Qibla.test.tsx` (existing). Two tests, both inside the existing
   `describe('reopening the sheet in the same place', ...)`, after the four step 2 added.

   | Test name | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | `fires no arrival haptic on a warm reopen, because nothing arrived` | The owner's decision 4: nothing arrived, so nothing is announced | `openSheet()`, `reportHeadings(95)`, dismiss, `jest.mocked(Haptics.notificationAsync).mockClear()`, present, `await act(async () => {})`, `reportWarmConfirmation(95)` | `Haptics.notificationAsync` was NOT called |
   | `fires the arrival haptic on a reopen that had to wait, because the compass did arrive` | The haptic is suppressed by the warm path alone, not by reopening as such | identical, but `reportHeadings(200)` in place of `reportWarmConfirmation(95)` | `Haptics.notificationAsync` WAS called |

   **The `mockClear()` is load-bearing.** The first visit fires the haptic legitimately, so without clearing, the
   first test would read the first visit's call and pass against broken code.

   **The second test is what gives the first one meaning.** A test asserting only "no haptic" passes if the
   haptic is deleted outright. The pair pins both directions.

   Both tests use `reportWarmConfirmation`, the helper step 2 added. If it is absent, step 2 was not merged:
   STOP.

   Existing tests that change: **none**. Existing tests that must NOT change: every test in the file, and all of
   `components/sheets/screens/__tests__/QiblaDiagnostic.test.tsx`.

   Run only this suite:
   ```bash
   npx jest components/sheets/screens/__tests__/Qibla.test.tsx --watchman=false --selectProjects=components
   ```

   **Expected failure before the change:** exactly one test fails,
   `fires no arrival haptic on a warm reopen, because nothing arrived`, on:
   ```
   expect(jest.fn()).not.toHaveBeenCalled()
   ```
   The second test passes before the change, which is correct and expected: today's code fires the haptic on
   every arrival, including that one. If the second test fails, or if the first passes, STOP (`PLAN.md`
   section 2.2, item 2).

5. **Change.** This step is **(specified)**.

   Two edits in `components/sheets/screens/Qibla.tsx`, both inside `BottomSheetQibla`.

   **First, the hook's return is destructured with the new field.** The line becomes, verbatim, wrapped because
   it passes 120 characters:

   ```typescript
     const { bearing, hasHeading, permissionDenied, place, heading, aligned, diagnostic, arrivedWarm, start, stop } =
       useQibla();
   ```

   **Second, the effect at anchor `3-1` becomes**, verbatim:

   ```typescript
     // The user is told the compass has arrived by FEEL, because they are most likely looking at the phone they
     // are moving rather than at its screen. A warm reopen announces nothing, because nothing arrived: the compass
     // is there on the first frame and the tap would land as part of the sheet opening
     useEffect(() => {
       if (!showsCompass || arrivedWarm) return;

       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
     }, [showsCompass, arrivedWarm]);
   ```

   **Both the new guard and the new dependency are required.** Biome's `useExhaustiveDependencies` is never
   disabled in this repository (`ai/AGENTS.md` section 11), so omitting `arrivedWarm` from the array fails
   `biome check --error-on-warnings`.

   **The contract of the effect:**
   - It answers: nothing. It is a side effect only.
   - It fires: `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)`, exactly once per transition
     into a compass that was waited for.
   - It must never: fire when `arrivedWarm` is true; fire more than once per arrival; or affect the ALIGNMENT
     haptic, which is `Haptics.impactAsync` in `hooks/useQibla.ts` and is untouched by this step.
   - It writes no log lines.

   **The invariant:** the success haptic fires exactly when `showsCompass` becomes true and `arrivedWarm` is
   false.

   **Nothing else changes.** No visual, no spacing, no copy, and not the alignment haptic.

6. **Green.** Same command:
   ```bash
   npx jest components/sheets/screens/__tests__/Qibla.test.tsx --watchman=false --selectProjects=components
   ```
   Every test passes, zero failures. **Expected in the planning worktree: `Tests: 81 passed, 81 total`** once all
   three steps are in.

   Then both, each expected to exit 0:
   ```bash
   npx tsc --noEmit
   npx biome check . --error-on-warnings
   ```

7. **Breaks.** Save as `ai/plans/52-qibla-wait/scripts/breaks-3.sh`, run with
   `bash ai/plans/52-qibla-wait/scripts/breaks-3.sh` from the repository root.

   ```bash
   #!/usr/bin/env bash
   set -u
   cd "$(git rev-parse --show-toplevel)" || exit 1

   SUITE=components/sheets/screens/__tests__/Qibla.test.tsx
   TARGET=components/sheets/screens/Qibla.tsx
   CAUGHT=0
   TOTAL=0
   UNEXPECTED=0

   run_break() {
     local label="$1" search="$2" replace="$3"
     TOTAL=$((TOTAL + 1))
     cp "$TARGET" "$TARGET.bak"
     perl -0pi -e "s/\Q$search\E/$replace/" "$TARGET"
     if cmp -s "$TARGET" "$TARGET.bak"; then
       echo "BREAK NOT APPLIED: $label"
       UNEXPECTED=$((UNEXPECTED + 1))
       mv "$TARGET.bak" "$TARGET"
       return
     fi
     if npx jest "$SUITE" --watchman=false --selectProjects=components >/dev/null 2>&1; then
       echo "SURVIVED: $label"
       UNEXPECTED=$((UNEXPECTED + 1))
     else
       echo "CAUGHT: $label"
       CAUGHT=$((CAUGHT + 1))
     fi
     mv "$TARGET.bak" "$TARGET"
   }

   run_break "the suppression removed" \
     "if (!showsCompass || arrivedWarm) return;" "if (!showsCompass) return;"
   run_break "the haptic removed outright" \
     "Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);" ""
   run_break "the guard inverted" \
     "if (!showsCompass || arrivedWarm) return;" "if (!showsCompass || !arrivedWarm) return;"

   echo "CAUGHT: $CAUGHT of $TOTAL"
   echo "ALL AS EXPECTED: $([ "$UNEXPECTED" = "0" ] && echo 1 || echo 0)"
   ```

   **Expected result per break:**

   | Break | Expected | Test that fails |
   | --- | --- | --- |
   | the suppression removed | CAUGHT | `fires no arrival haptic on a warm reopen, because nothing arrived` |
   | the haptic removed outright | CAUGHT | `fires the arrival haptic on a reopen that had to wait...`, which is why that test exists |
   | the guard inverted | CAUGHT | `fires the arrival haptic on a reopen that had to wait...` |

   `CAUGHT: 3 of 3` then `ALL AS EXPECTED: 1`.

8. **Version and commit.**
   ```bash
   node -e 'const v=require("./package.json").version.split(".").map(Number);v[2]+=1;console.log(v.join("."))'
   ```
   Set it in `app.json` (`expo.version`), `package.json` (`version`), and `android/app/build.gradle`
   (`versionName`) if `android/` exists.

   ```bash
   git add components/sheets/screens/Qibla.tsx components/sheets/screens/__tests__/Qibla.test.tsx app.json package.json
   ```

   ```bash
   git commit -F - <<'EOF'
   <VERSION> - fix: no arrival haptic when the qibla compass was already there

   The success haptic exists to tell the user the compass has arrived while they
   are looking at the phone they are moving rather than at its screen. On a warm
   reopen the compass is there on the first frame, so nothing arrived and the tap
   would land as part of the sheet opening instead.

   The alignment haptic is untouched: that one reports the phone crossing onto the
   line, which is the reading a blind user depends on.

   Tests: both directions are pinned, so deleting the haptic fails as loudly as
   failing to suppress it. All 3 breaks caught.
   EOF
   ```

   The hook runs the full suite and the coverage gate. The last `Tests:` line ends `passed, <n> total` and four
   `100%` coverage lines are present.

9. **Review.** Read the diff back cold against this list:

   - [ ] The guard is `if (!showsCompass || arrivedWarm) return;`, not `&&`, and not `!arrivedWarm`.
   - [ ] `arrivedWarm` is in the effect's dependency array.
   - [ ] No `biome-ignore` was added for `useExhaustiveDependencies`.
   - [ ] The ALIGNMENT haptic in `hooks/useQibla.ts` is untouched, and `hooks/useQibla.ts` is not in the diff.
   - [ ] The comment explains WHY the warm case is silent. It does not describe the guard.
   - [ ] Both tests are present, and the positive one would fail if the haptic were deleted.
   - [ ] Nothing outside the two files and the version files changed. No visual changed.

   A clean read is: one destructure, one guard, one dependency, one comment extended, two tests. A finding is
   handled by `EXECUTOR-BRIEF.md` section 4, item 8, or by `PLAN.md` section 10; anything else is a STOP.

10. **Merge.**
    ```bash
    git checkout uat-2 && git merge --no-ff fix/qibla-no-haptic-on-instant-open \
      -m "Merge fix/qibla-no-haptic-on-instant-open into uat-2: session 52 step 3, no arrival haptic when the compass was already there"
    ```

11. **Done when:**
    ```bash
    grep -c 'if (!showsCompass || arrivedWarm) return;' components/sheets/screens/Qibla.tsx
    ```
    prints `1`, and
    ```bash
    grep -c 'impactAsync' hooks/useQibla.ts
    ```
    prints `1`, proving the alignment haptic survived, and
    ```bash
    npx jest components/sheets/screens/__tests__/Qibla.test.tsx --watchman=false --selectProjects=components
    ```
    reports no failures, and `bash ai/plans/52-qibla-wait/scripts/breaks-3.sh` ends `CAUGHT: 3 of 3` then
    `ALL AS EXPECTED: 1`.
