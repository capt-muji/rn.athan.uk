# Step 1: The compass subtitle fits one line

0. **Anchor check.** Run before anything else, from the repository root:

   ```bash
   python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
     ai/plans/52-qibla-wait/scripts/anchors/1-1.txt components/sheets/screens/Qibla.tsx
   ```
   Expect exactly `1`. Any other count means NEEDS REPLAN (`PLAN.md` section 2.2, item 1).

1. **Goal.** The compass subtitle reads `Hold flat and turn slowly` on one line, so the sheet header keeps one
   height through the cross-fade.

2. **Branch.**
   ```bash
   git checkout -b fix/qibla-subtitle-one-line uat-2
   ```

3. **Files.** Exactly these two:
   - `components/sheets/screens/Qibla.tsx`
   - `components/sheets/screens/__tests__/Qibla.test.tsx`

   Nothing else, apart from `app.json`, `package.json`, `ai/plans/README.md` and this plan folder's `PLAN.md`
   and `LOG.md`.

4. **Tests first (red).**

   Suite: `components/sheets/screens/__tests__/Qibla.test.tsx` (existing).

   **Two existing tests already assert the old literal and MUST be updated, at lines 127 and 136 at "Planned
   at".** They were found by running the grep below in a scratch worktree during planning, so the count is
   known rather than assumed:

   ```bash
   grep -c 'Hold flat, turn until it vibrates' components/sheets/screens/__tests__/Qibla.test.tsx
   ```
   Expect exactly `2`. A different count means the suite moved under the plan: STOP (`PLAN.md` section 2.2,
   item 2).

   **Existing tests that change, and the only change each takes:**

   | Test name | Line | The change | Why |
   | --- | --- | --- | --- |
   | `tells the user what to do without naming a number to read` | 127 | its `getByText` literal becomes `Hold flat and turn slowly` | It pins the owner's wording, and the wording changed |
   | `carries both subtitles, so the change costs a fade rather than a resize` | 136 | the second `getByText` literal becomes `Hold flat and turn slowly` | Same literal, same reason. Its `Just a moment` assertion is untouched |

   Neither test's name changes, and neither gains or loses an assertion. **Do not add a test asserting the new
   wording: test 127 already is that test.**

   **One test is NEW**, because nothing in the suite covers the one-line cap:

   | Test name | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | `caps both subtitles at one line, so the header keeps its height` | Neither line can wrap, which is what guarantees the header's height through the fade | Render the sheet with no arguments, exactly as the two tests above do | `screen.getByText('Just a moment').props.numberOfLines` is `1` AND `screen.getByText('Hold flat and turn slowly').props.numberOfLines` is `1` |

   It goes directly after the `carries both subtitles` test, inside the same `describe`.

   Existing tests that must NOT change: every other test in the file, and all of
   `components/sheets/screens/__tests__/QiblaDiagnostic.test.tsx`.

   Run only this suite:
   ```bash
   npx jest components/sheets/screens/__tests__/Qibla.test.tsx --watchman=false --selectProjects=components
   ```

   **Expected failures before the change.** Write all three test edits first, then run the command. Exactly
   three tests fail, each on this line:
   ```
   Unable to find an element with text: Hold flat and turn slowly
   ```
   The three are `tells the user what to do without naming a number to read`, `carries both subtitles, so the
   change costs a fade rather than a resize`, and `caps both subtitles at one line, so the header keeps its
   height`. If any other test fails, or if fewer than three fail, STOP (`PLAN.md` section 2.2, item 2).

   **The new test fails on the TEXT before the change, not on the prop**, because the new wording does not
   exist yet. That is expected and it still proves the cap: break 2 in part 7 is what proves the prop assertion
   has teeth, by leaving the text alone and changing only the prop.

5. **Change.** This step is **(specified)**.

   One string and one prop in `components/sheets/screens/Qibla.tsx`, inside `QiblaSubtitle`, at anchor `1-1`.

   **The text, verbatim and exactly once:**
   ```
   Hold flat and turn slowly
   ```

   **The contract of `QiblaSubtitle`, which does not otherwise change:**
   - Signature: `({ showsCompass }: { showsCompass: boolean })`, unchanged.
   - It answers: the sheet's subtitle, cross-fading between the waiting line and the compass line on
     `showsCompass`.
   - It must never: resize the header mid-fade, which is why the compass line stays absolutely positioned under
     `styles.subtitleOver`; and never collapse to a single `Text`, because both lines must be mounted for the
     opacity cross-fade to work.
   - It writes no log lines.

   **Both `Animated.Text` elements in this component carry `numberOfLines={1}`.** Both, not just the compass
   one: the waiting line is shorter today and a future wording change must not be able to wrap it either, and
   the header's height is only guaranteed when neither line can grow.

   **The invariant:** the sheet header's height is the same whether the compass is up or the hint is.

   No styling value changes. No spacing, no font size, no colour: the owner's visuals are settled and section
   2.2 item 5 applies to everything except this one string.

6. **Green.** Same command:
   ```bash
   npx jest components/sheets/screens/__tests__/Qibla.test.tsx --watchman=false --selectProjects=components
   ```
   Every test passes. The `Tests:` line reads `Tests:       <n> passed, <n> total` with no failures, where
   `<n>` is the suite's own count plus the two added.

   Then both, each expected to exit 0:
   ```bash
   npx tsc --noEmit
   npx biome check . --error-on-warnings
   ```

7. **Breaks.** Save as `ai/plans/52-qibla-wait/scripts/breaks-1.sh` and run `bash ai/plans/52-qibla-wait/scripts/breaks-1.sh`
   from the repository root.

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

   run_break "the owner's wording" "Hold flat and turn slowly" "Hold flat and turn"
   run_break "the compass line's one-line cap" "numberOfLines={1}" "numberOfLines={2}"

   echo "CAUGHT: $CAUGHT of $TOTAL"
   echo "ALL AS EXPECTED: $([ "$UNEXPECTED" = "0" ] && echo 1 || echo 0)"
   ```

   **Expected result per break:**

   | Break | Expected | Which test fails |
   | --- | --- | --- |
   | the owner's wording | CAUGHT | `draws the compass subtitle on one line`, on `Unable to find an element with text` |
   | the compass line's one-line cap | CAUGHT | `draws the compass subtitle on one line`, on the `numberOfLines` assertion |

   The script's last line must read `ALL AS EXPECTED: 1`. Note that the second break's `perl` substitution
   replaces the FIRST `numberOfLines={1}` in the file, which is the waiting line's; that still fails the
   assertion because both lines carry the prop and the test reads the compass one through the same component.
   If the script prints `CAUGHT: 2 of 2` and `ALL AS EXPECTED: 1`, the step's tests are worth something.

8. **Version and commit.**
   ```bash
   node -e 'const v=require("./package.json").version.split(".").map(Number);v[2]+=1;console.log(v.join("."))'
   ```
   Set that version in `app.json` (`expo.version`), `package.json` (`version`), and
   `android/app/build.gradle` (`versionName`) if `android/` exists.

   Add exactly:
   ```bash
   git add components/sheets/screens/Qibla.tsx components/sheets/screens/__tests__/Qibla.test.tsx app.json package.json
   ```
   Add `android/app/build.gradle` as well only if that file exists and is tracked.

   Commit, replacing `<VERSION>` with what the command printed:
   ```bash
   git commit -F - <<'EOF'
   <VERSION> - fix: the qibla compass subtitle fits one line

   The compass subtitle wrapped to two lines on the 3T, so the sheet header grew
   when the compass arrived and the cross-fade was not a pure fade.

   The owner chose the wording from five candidates on 2026-10-03: "Hold flat and
   turn slowly", 25 characters against the 32 that wrapped. His dictated phrase
   ("Hold flat and turn until it vibrates") is longer still at 35, so it could not
   have fitted without shrinking the type.

   Both lines of the cross-fade now carry numberOfLines={1}, not only the compass
   one, because the header's height is guaranteed only when neither line can grow.

   Tests: the wording and the one-line cap are both asserted, and both breaks are
   caught.
   EOF
   ```

   The pre-commit hook runs the full suite and the coverage gate. In its output the last `Tests:` line ends
   `passed, <n> total` and four `100%` coverage lines are present.

9. **Review.** Read the diff back cold (`git show --stat` then `git show`), against this list:

   - [ ] The string is exactly `Hold flat and turn slowly`, once, with no trailing space.
   - [ ] Both `Animated.Text` elements in `QiblaSubtitle` carry `numberOfLines={1}`.
   - [ ] `styles.subtitleOver` still holds `position: 'absolute'`, so the lines are still stacked.
   - [ ] No styling value changed: no spacing, no font size, no colour, no `marginTop`.
   - [ ] No comment was added that explains WHAT or HOW. A comment here would be clutter; the code says it.
   - [ ] Nothing outside the two files and the version files changed.
   - [ ] The two new tests assert the literal and the prop, and neither passes against the old code.

   A clean read is: two files changed, a one-word string change plus two props, two tests added, version bumped.
   A finding is handled by `EXECUTOR-BRIEF.md` section 4, item 8, or by `PLAN.md` section 10's anticipated
   fixes; anything else is a STOP.

10. **Merge.**
    ```bash
    git checkout uat-2 && git merge --no-ff fix/qibla-subtitle-one-line \
      -m "Merge fix/qibla-subtitle-one-line into uat-2: session 52 step 1, the compass subtitle fits one line"
    ```

11. **Done when:**
    ```bash
    grep -c 'Hold flat and turn slowly' components/sheets/screens/Qibla.tsx
    ```
    prints `1`, and
    ```bash
    grep -c 'Hold flat, turn until it vibrates' components/sheets/screens/Qibla.tsx
    ```
    prints `0`, and
    ```bash
    npx jest components/sheets/screens/__tests__/Qibla.test.tsx --watchman=false --selectProjects=components
    ```
    reports no failures, and `bash ai/plans/52-qibla-wait/scripts/breaks-1.sh` ends `ALL AS EXPECTED: 1`.
