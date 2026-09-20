# Step 2: Centre all four lock kinds with containerRelativeFrame (specified)

0. **Anchor check:** section 3's counts for anchors `2-1` to `2-7` (1, 3, 2, 1, 1, 1, 1). Any other count means NEEDS REPLAN.
1. **Goal:** Every rectangular return path of both lock layouts takes the widget container's width via `containerRelativeFrame({ axes: 'horizontal' })` as its innermost modifier, with no `alignment='leading'` anywhere, so all four lock kinds centre on the glass.
2. **Branch:** `git checkout -b feat/16a-lock-centring uat-2`.
3. **Files:** exactly `widgets/LockPrayerWidget.tsx` and `shared/__tests__/widgetLockRenderer.test.ts`, plus the three plan files when this session changed them.
4. **Tests first (red).** Suite: `shared/__tests__/widgetLockRenderer.test.ts` (existing, extended).
   - Add `'containerRelativeFrame'` to the `MODIFIERS` stub list (anchor `2-6`), alphabetical after `'containerBackground'`. A missing stub does not fail loudly; it silently swaps the whole tree to the fallback (LOG §13f), so this comes FIRST.
   - Append two tests inside the `describe` block, after the last existing test (anchor `2-7`):
     - `it.each` titled `sizes <label> to the widget container before filling the slot` with six rows: `layout 1 live` (LIVE_PROPS), `layout 1 stale` (`{ ...LIVE_PROPS, stale: true }`), `layout 1 placeholder` (`null`), and the same three for layout 2 via `renderTreeFor2`. Each row renders the `accessoryRectangular` tree, reads the ROOT node's `modifiers` array, and asserts: the `containerRelativeFrame` entry exists at index 0; the `frame` entry's index is greater than it; the entry's value equals `{ axes: 'horizontal' }`. It proves: the centring attribute is present, innermost, and horizontal, on every rectangular composition of both layouts.
     - `it('keeps the container-width modifier off the inline faces and centres both live blocks')`: for both render helpers, the `accessoryInline` tree's serialized modifiers contain no `containerRelativeFrame`; and both live rectangular roots' `props.alignment` is `undefined`. It proves: inline stays a system line, and no leading alignment undoes the centring.
   - Existing tests that must NOT change: all eight existing tests of the suite, and every other suite.
   - Command: `npx jest shared/__tests__/widgetLockRenderer.test.ts --watchman=false --selectProjects=unit`
   - Expected red: `Tests: 7 failed, 8 passed, 15 total`. The six `it.each` rows fail at `expect(relativeIndex).toBe(0)` with `Expected: 0, Received: -1`; the alignment test fails at `expect(liveRoot.props.alignment).toBeUndefined()` with `Received: "leading"`. Any other failure, or any of these passing: STOP.
5. **Change.** Contracts:
   - **`containerRelativeFrame` import (anchor `2-1`):** add `containerRelativeFrame,` to the `@expo/ui/swift-ui/modifiers` import, alphabetical after `containerBackground,`. Never import anything else new.
   - **The 6-space `VStack` shape (anchor `2-2`, three occurrences, apply to every one):** becomes
     ```tsx
      <VStack
        spacing={1}
        modifiers={[
          containerRelativeFrame({ axes: 'horizontal' }),
          frame({ maxWidth: Infinity, maxHeight: Infinity }),
          containerBackground('rgba(0, 0, 0, 0)', 'widget'),
        ]}>
     ```
     The `alignment='leading'` prop is deleted; the new modifier is first (innermost).
   - **The 8-space shape (anchor `2-3`, two occurrences):** the same change, one indent deeper.
   - **The L2 live root (anchor `2-4`):** insert `containerRelativeFrame({ axes: 'horizontal' }),` as the first modifier array entry. It has no alignment prop and keeps it that way.
   - **Module docstring (anchor `2-5`):** rewrite to state both layouts centre, why (the slot proposes no width; the container's own width is taken with `containerRelativeFrame`), and the iOS 16 leading degradation (the modifier needs 17; accepted on the three-year-old floor). Keep every other sentence of the existing docstring (the vibrant monochrome note, the timer-concatenation note, the 1.14.1 note, the directive note).
   - Behaviour kept (the invariant): every path renders the same text and timer intervals as before; nothing changes for `accessoryInline`; the transparent `containerBackground` stays the outermost modifier on every path.
   - No log lines (widget layout code logs nothing).
6. **Green:** the command passes `Tests: 15 passed, 15 total`. Then `npx tsc --noEmit` exit 0 and `npx biome check . --error-on-warnings` exit 0.
7. **Breaks.** Save as `$TMPDIR/breaks-16a-2.sh`, run with `bash` from the repository root:
   ```bash
   #!/bin/bash
   set -u
   cd /Users/muji/repos/rn.athan.uk
   FILE=widgets/LockPrayerWidget.tsx
   TEST="shared/__tests__/widgetLockRenderer.test.ts"
   caught=0; total=0
   run_break() {
     label="$1"; want="$2"; shift 2
     cp "$FILE" "$FILE.bak"
     "$@"
     if cmp -s "$FILE" "$FILE.bak"; then
       echo "BREAK NOT APPLIED: $label"; mv "$FILE.bak" "$FILE"; return
     fi
     npx jest "$TEST" --watchman=false --selectProjects=unit > "$TMPDIR/16a-break.log" 2>&1
     if grep -q "$want" "$TMPDIR/16a-break.log"; then echo "CAUGHT: $label"; caught=$((caught+1));
     else echo "NOT CAUGHT: $label"; fi
     mv "$FILE.bak" "$FILE"; total=$((total+1))
   }
   run_break "axes vertical" "6 failed" \
     perl -pi -e "s/containerRelativeFrame\(\{ axes: 'horizontal' \}\)/containerRelativeFrame({ axes: 'vertical' })/g" "$FILE"
   run_break "leading alignment back on layout 2" "1 failed" \
     perl -0777 -pi -e "s/(      <VStack\n)(        modifiers=\{\[)/\$1        alignment='leading'\n\$2/" "$FILE"
   npx jest "$TEST" --watchman=false --selectProjects=unit 2>&1 | tail -3
   echo "caught=$caught total=$total"
   [ "$caught" -eq 2 ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
   ```
   Expected: `CAUGHT: axes vertical` (six rows red), `CAUGHT: leading alignment back on layout 2` (one red), restore run green `15 passed`, last line `ALL AS EXPECTED: 1`. Both substitutions were run against spike code identical in shape to this contract's output; if either prints `BREAK NOT APPLIED`, STOP.
8. **Version and commit.** Version command: `python3 -c "import json,sys;v=json.load(open('package.json'))['version'].split('.');v[2]=str(int(v[2])+1);print('.'.join(v))"` (prints `1.27.313`). Set it in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`; gitignored, never added). Add: `widgets/LockPrayerWidget.tsx`, `shared/__tests__/widgetLockRenderer.test.ts`, the three plan files when changed. Commit message:
   ```
   1.27.313 - feat(16a): centre all four lock kinds via containerRelativeFrame

   The accessory slot proposes no width a root can stretch into, so the
   frame's maxWidth cannot act and every lock composition hugged the
   leading edge. Every rectangular root now takes the widget container's
   own width with containerRelativeFrame (innermost modifier) and the
   stack's default centring places the block; inline faces are untouched;
   iOS 16 renders leading (the modifier needs 17), accepted. Renderer
   suite pins the attribute on all six rectangular paths and the absence
   of a leading alignment.
   ```
   Hook expectations: last `Tests:` line ends `passed, <n> total`; four `100%` coverage lines.
9. **Review:** the executor's own diff review, recorded in `LOG.md`: anchors 2-2 (three) and 2-3 (two) each changed identically; L2 live carries the modifier; no other file changed; the docstring says why, not what.
10. **Merge:** `git checkout uat-2 && git merge --no-ff feat/16a-lock-centring -m "Merge feat/16a-lock-centring into uat-2: session 16a step 2, reviewed"`.
11. **Done when:** checklist ticked; `LOG.md` holds the branch, commit sha and version, the hook's `Tests:` and coverage lines, the break script's last line, and the merge sha.
