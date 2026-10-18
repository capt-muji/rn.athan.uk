# Step 3 — the iOS native direction from the stamped rtl field

**Requirements:** R2.1, R2.2, R2.3, R5.1
Weight: 2

## Anchor check

`scripts/anchors/entryview-body.txt` counts exactly 1 in
`node_modules/expo-widgets/ios/Widgets/EntryView.swift` and
`scripts/anchors/patch-test-hunk-count.txt` counts exactly 1 in
`shared/__tests__/widgetOpenAppPatch.test.ts` (pre-flight proves both).

## Goal

The patched entry view applies SwiftUI's native layout direction from the entry's
stamped `rtl` field, so every iOS kind (the 8 home kinds and the 6 lock kinds, which
all render through `WidgetsEntryView`) mirrors natively under an Arabic app locale:
HStack halves swap, leading/trailing paddings and frame alignments flip, centered
compositions stay put. The field's fate (row 129) lands here: consumed by native
code.

Measured ground (recorded in PLAN.md section 2): the probe on the iOS 26 simulator
under system Arabic proved `.environment(\.layoutDirection, .rightToLeft)` flips an
`HStack { Arabic word, Spacer, timer }` to word-right/countdown-left. The iOS
countdown itself takes NO change: her 2026-10-18 amendment keeps the system timer
interval face exactly as it is, and the planning evidence (the SDK's single
`Text(timerInterval:)` initializer, row 22's concatenation finding, the probe's
Latin-digit default under system Arabic) agrees; this step never touches a text
format, a formatter or the locale.

## Branch

`fix/135-ios-direction` off `uat`, in the lane worktree.

## Files

- `patches/expo-widgets+58.0.20.patch` — one new hunk on
  `ios/Widgets/EntryView.swift`.
- `shared/__tests__/widgetOpenAppPatch.test.ts` — the hunk-count pin and the new
  hunk's assertions.
- `shared/__tests__/widgetContract.test.ts` — the rtl docblock guard (red test 4).
- `shared/widgetTypes.ts` — the two `rtl` docblocks (iOS field, Android field) move
  from "blocked" prose to the named consumers.

## Red tests

Add to `shared/__tests__/widgetOpenAppPatch.test.ts`:

1. `applies the entry's rtl as the native layout direction` — read the installed
   `node_modules/expo-widgets/ios/Widgets/EntryView.swift` and expect it to contain
   `entry.props?["rtl"]` and `.environment(\.layoutDirection,` with both direction
   cases. Red today: the file is upstream.
2. `carries exactly six diff --git headers, all inside the package` — re-pin
   `toHaveLength(5)` to `toHaveLength(6)` and extend the file list comment with the
   iOS entry view. Red today: five headers.
3. `stamps rtl on both widget shapes for the entry view to read` — already covered
   by the timeline/snapshot suites; add nothing. (Named here so the reviewer does
   not re-add a duplicate.)

Also extend `shared/__tests__/widgetContract.test.ts` with:

4. `documents rtl as consumed, not stamped-and-unread` — read
   `shared/widgetTypes.ts` and expect the two `rtl` FIELD docblocks to name the
   consumer (the wording "the patched entry view" on iOS, the Android composition
   mirror) and, scoped to those two docblocks alone, to contain neither `blocked`
   nor `P16`; the v8/v4 version-history comments keep their `(blocked, P16)`
   provenance words (D135.3 keeps them). Red today: the field docblocks name no
   consumer (they say "once it renders a Host").

Record the failing names first.

## Change contracts

- The patch hunk adds to `EntryView.body`, inside the `if let layout` branch, the
  direction read and the environment application around `WidgetsDynamicView`:

```swift
let rtl = (entry.props?["rtl"] as? Bool) ?? false
WidgetsDynamicView(
  name: entry.name,
  kind: .widget,
  node: node,
  entryIndex: entry.entryIndex,
  environmentString: widgetEnvironmentString
).environment(\.layoutDirection, rtl ? .rightToLeft : .leftToRight)
```

  No `return` keyword anywhere in the branch: `body` is a ViewBuilder, an explicit
  return disables `buildEither` and the extension does not compile (verified by
  `swiftc` on the exact shape; the error hides from `-typecheck` and would surface
  only at the step-4 iOS build). The explicit `.leftToRight` on falsy is
  deliberate: it pins LTR even on a device whose system direction is RTL (the
  app-locale law: never the device locale). One comment line carries that law.
- No locale pin hunk and no formatter change of any kind: her 2026-10-18
  amendment bans them outright on iOS (D135.5, D135.6).
- Regenerate the whole patch with `npx patch-package expo-widgets` (never hand-edit
  the diff), so the file's five existing hunks and the new one stay one artefact.
- `shared/widgetTypes.ts`: the `PrayerWidgetProps.rtl` docblock reads "Whether the
  app locale this blob was composed for is RTL. Consumed by the patched entry view
  as the native layout direction; blobs from the prior schema read as false." The
  `PrayerWidgetAndroidProps.rtl` docblock names the composition mirror. The version
  comments on v8/v4 stay untouched (D135.3).

## Green run

The new patch-test cases green; `npx patch-package expo-widgets` applied clean;
`npx jest shared/__tests__/widgetRuntimeLoads.test.ts --watchman=false` green (the
widget runtime load suite after any patch change, per `ai/AGENTS.md`); `yarn
validate` green, coverage 100 percent.

## Break script

`scripts/break-135-ios-direction.sh`:

```bash
#!/usr/bin/env bash
# Breaks R2.1: flip the hunk's LTR default and the patch guard must catch it.
# Restores by copying the pristine file back from $TMPDIR; patch-package is
# never run here (with a package argument it regenerates the patch from the
# mutated tree, which would bake the break into the committed patch).
set -e
cd "$(dirname "$0")/../../../.."
SWIFT=node_modules/expo-widgets/ios/Widgets/EntryView.swift
cp "$SWIFT" "$TMPDIR/entryview-135.swift"
restore() { cp "$TMPDIR/entryview-135.swift" "$SWIFT"; }
trap restore EXIT
python3 - <<'PYEOF'
from pathlib import Path
p = Path("node_modules/expo-widgets/ios/Widgets/EntryView.swift")
s = p.read_text()
old = 'let rtl = (entry.props?["rtl"] as? Bool) ?? false'
assert s.count(old) == 1, "hunk not installed"
p.write_text(s.replace(old, 'let rtl = (entry.props?["rtl"] as? Bool) ?? true'))
PYEOF
npx jest shared/__tests__/widgetOpenAppPatch.test.ts --watchman=false 2>&1 | tail -5
echo "BREAK 135-IOS-DIRECTION: expected FAIL above (the guard pins the false default); file restored from TMPDIR"
```

The restore copies the pristine file back from `$TMPDIR`; `npx patch-package
expo-widgets` is never run inside a break (with a package argument it regenerates
the patch from the mutated tree, baking the break into the committed patch).

If the flipped default does not fail a test, the pin is unguarded: extend red
test 1 to pin the `?? false` default byte-for-byte, then this break is red by
construction.

## Version and commit

Next patch under the version lock; message:
`<VERSION> - feat(widgets): iOS widget direction from the app locale via the patched entry view (135 step 3)`.
Main-tree `android/app/build.gradle` sync after the merge.

## Review

Read the diff cold: one Swift hunk, two test files, one docblock pair. The patch file
must show exactly six `diff --git` headers and no absolute paths
(`expect(patch).not.toContain('/Users/')` already guards).

## Merge

As step 1.

## Done when

Reds green, the load suite green, the break script red (or the added guard makes it
red), `yarn validate` green, merged. The XS simulator/glass proof is step 4's, not
this step's.
