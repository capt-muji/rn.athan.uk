# Step 1 — the Android countdown label takes the app component's face

**Requirements:** R3.1, R3.2, R5.1
Weight: 2

## Anchor check

`scripts/anchors/widget-strings-bake.txt` counts exactly 1 in
`shared/widgetTimeline.ts`, and `scripts/anchors/widget-strings-docblock.txt` counts
exactly 1 in `shared/widgetTypes.ts` (pre-flight proves both).

## Goal

The Android countdown label renders the app countdown component's face at HEAD
sizing (her 2026-10-18 amendment): unpadded Latin digits at the hero size with
lowercase Latin `h` `m` tight against each digit run at 0.95 x the digit size,
same colour and weight, groups 12 points apart, zero-valued groups dropped,
minutes clamped at 1. Under Arabic the letters are `h` `m`, never `س` `د`.

## Branch

`fix/135-android-letters` off `uat`, in the lane worktree.

## Files

- `shared/widgetTimeline.ts` — `widgetStrings()`.
- `shared/widgetTypes.ts` — the `WidgetStrings` docblock only.
- `widgets/PrayerWidget.tsx` — `ALabel` and the two trio sites that render it.

## Red tests

Add to `shared/__tests__/widgetSnapshot.test.ts`:

1. `bakes fixed Latin unit letters under the Arabic app locale` — seed with
   `setActiveLocale('ar')` and reset with `setActiveLocale('en')` in a `finally`
   block (the pattern `widgetTimeline.test.ts:200-221` carries; the snapshot suite
   has no locale harness of its own), build a snapshot, expect `strings.h === 'h'`,
   `strings.m === 'm'`, `strings.s === 's'`. Red today: the bake returns `س`, `د`,
   `ث`.
2. `bakes the same fixed unit letters under every locale` — loop `LOCALE_IDS`
   (`shared/i18n/locale.ts:15`), expect the same three bytes for all six. Red
   today under ar only, so assert the loop to make the law explicit.

Add to `shared/__tests__/widgetRenderer.test.ts` (the suite renders the REAL
module under jetpack globals):

3. `composes the countdown label as digit runs with tight 0.95 letters` — render a
   medium snapshot whose target sits 4h20m out; the hero label is a Row of tight
   inner Rows: `AText('4')` and `AText('h')` at 0.95 x the digit size share colour
   and weight, then a 12 point Spacer, then `AText('20')` and `AText('m')`. Red
   today: the label is one `AText` carrying the string `4h 20m`.
4. `drops zero groups and clamps the final minute in the composed label` — at a
   whole-hour target the label holds one group (`4h`); at 40 seconds it clamps to
   one minute (`1m`). Red today: the string form renders these shapes, but as one
   `AText`.

Record the exact failing expectation lines in `LOG.md` before touching the code.

## Change contracts

- `widgetStrings()`: the `h`, `m`, `s` fields become the literals `'h'`, `'m'`,
  `'s'` with a one-line comment stating the law (fixed lowercase Latin unit bytes
  in every locale, rows 85/102/83 and her 2026-10-18 amendment; they never
  localise), the comment on its own line ABOVE the three fields so the break
  script's byte anchor holds. The `now`, `staleTitle`, `refreshLine`,
  `refreshLead`, `refreshTail` fields keep their `t()` calls unchanged.
- `WidgetStrings` docblock in `shared/widgetTypes.ts`: replace the sentence "The
  unit fields mirror the catalog's duration.h/m/s keys so a future locale reuses
  them directly" with the fixed-Latin law and its provenance. Nothing else in the
  interface changes.
- `ALabel` in `widgets/PrayerWidget.tsx` keeps its arithmetic untouched (the
  `Math.max(1, Math.ceil(...))` clamp, the unpadded values, the zero-group drops)
  and returns the parts — one `{ digits, letter }` pair per live group — instead of
  one string. A new `ALabelParts` renders the composition beside it: an outer
  `Row` (verticalAlignment center) holding one tight inner `Row` per group
  (`AText(digits, heroSize, weight, color)` then `AText(letter, heroSize * 0.95,
  weight, color)`), with `<Spacer modifiers={[width(12)]} />` between groups (the
  converter maps arrangements to alignments only, so Row spacing cannot carry the
  gap). Both trio sites (the medium's shared `trio` and the small composition)
  render `ALabelParts`; no other element of the trio moves, and the label Row
  never mirrors (D135.9: `4h 20m` reads left to right inside the mirrored card).
- The digit size stays the settled hero size 26; the letters take 26 x 0.95 with
  no rounding (the app uses the exact product at HEAD, `UNIT_SIZE_SHARE`).
- No change to the v1 fallback words inside `androidRender` (already Latin
  literals).

## Green run

`npx jest shared/__tests__/widgetSnapshot.test.ts shared/__tests__/widgetRenderer.test.ts --watchman=false --selectProjects=unit`
prints all green including the four new cases. Then `yarn validate`
(tsc, Biome, Jest) green, coverage 100 percent on all four measures
(`scripts/check-changed-coverage.js` runs in the hook).

## Break script

`scripts/break-135-letters.sh` (committed beside this plan):

```bash
#!/usr/bin/env bash
# Breaks D135.4: relocalise the unit letters and the red suite must catch it.
set -e
cd "$(dirname "$0")/../../../.."
# The fix is uncommitted in the tree at break time, so restore by copying the
# pristine file back from $TMPDIR, never `git checkout` (it would revert the fix).
TS=shared/widgetTimeline.ts
cp "$TS" "$TMPDIR/letters-135.ts"
restore() { cp "$TMPDIR/letters-135.ts" "$TS"; }
trap restore EXIT
python3 - <<'PYEOF'
from pathlib import Path
p = Path("shared/widgetTimeline.ts")
s = p.read_text()
old = "  h: 'h',\n  m: 'm',\n  s: 's',"
new = "  h: t('duration.h'),\n  m: t('duration.m'),\n  s: t('duration.s'),"
assert s.count(old) == 1, "anchor drifted"
p.write_text(s.replace(old, new))
PYEOF
npx jest shared/__tests__/widgetSnapshot.test.ts -t "fixed Latin unit letters" --watchman=false --selectProjects=unit 2>&1 | tail -5
echo "BREAK 135-LETTERS: expected FAIL above, file restored from TMPDIR"
```

Expected: the jest run exits 1 with the ar-locale expectation diff (`س` received).
A second break, run once at review time, flips `UNIT_SIZE_SHARE`-equivalent 0.95
to 1.0 in `ALabelParts` and expects the renderer's tight-letters case to fail;
restore the same way.

## Version and commit

Version: next patch after `uat` at commit time (read `package.json` on `uat` under
`$HOME/athan-gitree/version.lock`; lanes 136 and 137 land concurrently, so never
carry a number forward from this plan).
Bump `app.json` FIRST, then `package.json`, then the gitignored
`android/app/build.gradle` `versionName` in the MAIN tree under
`$HOME/athan-gitree/build.lock` after the merge (a worktree commit cannot touch it).
Commit message: `<VERSION> - feat(widgets): the Android countdown label takes the app component's face (135 step 1)`.

## Review

Read the diff cold: three files. The letters are bytes, never catalog keys; the
`now` word still localises (unread today, row 130's parked item). The composed
label's inner Rows are tight and the outer gap is the 12 point Spacer; no other
trio pixel moves. The mutation pass: flip the 0.95 share to 1.0, the Spacer width
to 0, and the group order once each; a named red case must fail per mutant.

## Merge

`$HOME/athan-gitree/uat.lock` around the merge; `git fetch -q origin uat`, rebase
the branch if `uat` moved, `node scripts/check-version-uniqueness.js` green, merge
`--no-ff` into `uat` in the MAIN tree, then sync the main tree's
`android/app/build.gradle` `versionName`.

## Done when

The four reds are green, `yarn validate` is green, the break script shows the red,
the commit is merged, and the hook's `Tests:` line is in `LOG.md`.
