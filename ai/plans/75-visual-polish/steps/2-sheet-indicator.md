# Step 2: no scrollbar on any sheet

**Requirements:** R2.1, R2.2
Weight: 2

## Anchor check

Run from the worktree root. `sheet-contentwrapper.txt` counts exactly 1 in
`components/sheets/parts/Sheet.tsx`:

```bash
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
  ai/plans/75-visual-polish/scripts/anchors/sheet-contentwrapper.txt components/sheets/parts/Sheet.tsx
```

Expected output: `1`. Anything else: stop.

## Goal

The `RCTScrollView` a scrollable sheet renders carries
`showsVerticalScrollIndicator: false`. A non-scrollable sheet keeps rendering no scroll
view at all.

## Branch

`ticket/75`, the run's single branch. No step branch, no `uat` merge, no push.

## Files

- `components/sheets/parts/Sheet.tsx` (changed)
- `components/sheets/parts/__tests__/Sheet.test.tsx` (extended)

## Red tests

Add to the `a sheet as it mounts` describe block, beside the `lets its content scroll`
claim:

1. `hides the scroll indicator on its scroll view` - render `settingsSheet()`, assert
   `scrollViews()[0].props.showsVerticalScrollIndicator` is `false`.

Run before the change:

```bash
npx jest components/sheets/parts/__tests__/Sheet.test.tsx --watchman=false --selectProjects=components 2>&1 | tail -20
```

Record the failing line: the prop reads `undefined` while the library default draws
the indicator. The `lays out a sheet that is not scrollable with no scroll view` claim
must stay green untouched; it carries R2.2. Any other outcome: stop.

## Change contracts

In `components/sheets/parts/Sheet.tsx`, the scrollable branch of `contentStyle`
becomes:

```ts
const contentStyle = scrollable
  ? { contentContainerStyle: { paddingBottom: contentPadding }, showsVerticalScrollIndicator: false }
  : { style: { paddingBottom: contentPadding } };
```

With a one-line comment naming the rule: no scrollable in the app draws an indicator
(the owner's 2026-10-13 ruling), and the library default is true at the pinned 5.2.14.
Nothing else changes: snap points, the fixed branch, the paddings, the lifecycle.

## Green run

```bash
npx jest components/sheets/parts/__tests__/Sheet.test.tsx --watchman=false --selectProjects=components 2>&1 | tail -5
```

The whole suite passes, the non-scrollable claim included. Then `yarn validate`.

## Version and commit

Bump `app.json` then `package.json` to `2.0.452`. Commit:

```
2.0.452 - no sheet draws a scrollbar: the shared scroll wrapper hides its indicator,
the library default was true
```

## Break script

Runs after the step's commit. The script drops the prop from the committed file, the
indicator test goes red, then `git checkout --` restores the committed change:

```bash
node -e '
const fs = require("fs");
const p = "components/sheets/parts/Sheet.tsx";
fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace(", showsVerticalScrollIndicator: false", ""));
' && npx jest components/sheets/parts/__tests__/Sheet.test.tsx -t "hides the scroll indicator" --watchman=false --selectProjects=components 2>&1 | tail -5
```

Expected: the indicator test fails. Then
`git checkout -- components/sheets/parts/Sheet.tsx` and rerun the suite green.

## Review checklist

- The fixed branch was not touched; `BottomSheetView` receives no scroll prop.
- The comment carries the ruling, not the history (the history lives in `LOG.md`).

## Merge

None this run. The commit stays on `ticket/75`.

## Done when

The indicator test is green after proving red, the non-scrollable claim stayed green
throughout, the hook lines are in `LOG.md`, and the commit carries 2.0.452.
