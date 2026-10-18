# Step 2 — the Android composition mirror under the app locale

**Requirements:** R1.1, R1.2, R1.3, R3.1, R5.1
Weight: 2

## Anchor check

`scripts/anchors/medium-composition.txt` counts exactly 1 in `widgets/PrayerWidget.tsx`
and `scripts/anchors/alabel.txt` counts exactly 1 (pre-flight proves both).

## Goal

When the snapshot's `rtl` is true, the medium widget's composition mirrors: the list
column takes the visual left and the hero the visual right, each prayer row draws the
time on the left and the name on the right, and every start/end alignment, lead
padding and textAlign swaps with it. The mirrored face is the English face flipped,
nothing redesigned. Falsy `rtl` renders the tree byte-identical to the Planned-at
composition.

## Branch

`fix/135-android-mirror` off `uat`, in the lane worktree.

## Files

- `widgets/PrayerWidget.tsx` — `androidRender` only.

## Red tests

Add to `shared/__tests__/widgetRenderer.test.ts` (the suite already renders the REAL
module under jetpack globals; the fixtures carry a snapshot builder — extend one
snapshot to `rtl: true`):

1. `mirrors the medium row order under rtl: time before name` — under `rtl: true`,
   the first `Row` line's first `Box` child is the TIME box (width
   `ROW_TIME_WIDTH`, alignment `centerStart`, textAlign `start`) and the second is
   the NAME box (width `ROW_NAME_WIDTH`, alignment `centerEnd`). Red today: the name
   box is first under every snapshot.
2. `mirrors the medium halves under rtl: list before hero` — under `rtl: true`, the
   outer `Row` renders the list wrapper `Box` before the hero `Box`, the list wrapper
   aligns `centerStart`, its inner box `topEnd`. Red today: hero first.
3. `mirrors the pill and rows insets to the END edge under rtl` — the pill `Column`
   pads `APad(0, 1, PILL_LEAD, 0)` and the rows `Column` pads
   `APad(0, 0, ROWS_LEAD, 0)` under `rtl: true`. Red today: both pad the START edge.
4. `renders the LTR medium byte-identical under rtl falsy` (guard, green at red
   time because nothing reads `rtl` today): render the same snapshot with
   `rtl: false` and diff the marker tree against the `rtl`-field-absent tree,
   expecting deep equality, and assert the falsy time `Text` carries NO `textAlign`
   prop. It proves R1.2 stays true after the change.
5. `leaves the small composition and the stale card direction-neutral under rtl`
   (guard, green at red time, same reason): under `rtl: true`, the small trio and
   the stale card render the same marker trees as under `rtl: false` (R1.3).

Cases 1 to 3 are the reds: record their failing names and lines in `LOG.md`
   before touching the code. Cases 4 and 5 are regression guards that are green
   before the change by construction (nothing reads `rtl` at HEAD); they must stay
   green through it.

## Change contracts

Inside `androidRender`, after the `strings` fallback block, read
`const rtl = input.rtl === true;` (the only new control flow; absent on v1 to v3
snapshots, falsy, LTR). The mirror applies through the medium branch's directional
inputs, exactly this table and nothing else:

| Element | LTR (today) | RTL |
| --- | --- | --- |
| outer `Row` children | hero `Box`, list wrapper `Box` | list wrapper `Box`, hero `Box` |
| hero `Box` modifiers | `width(HERO_WIDTH)` | unchanged (position comes from order) |
| list wrapper `Box` contentAlignment | `centerEnd` | `centerStart` |
| inner list `Box` contentAlignment | `topStart` | `topEnd` |
| pill `Column` padding | `APad(PILL_LEAD, 1, 0, 0)` | `APad(0, 1, PILL_LEAD, 0)` |
| rows `Column` padding | `APad(ROWS_LEAD, 0, 0, 0)` | `APad(0, 0, ROWS_LEAD, 0)` |
| row line children | name `Box` then time `Box` | time `Box` then name `Box` |
| time `Box` contentAlignment / textAlign | `centerEnd`, no `textAlign` prop on the `Text` | `centerStart`, plus `textAlign: 'start'` on the `Text` |
| name `Box` contentAlignment | `centerStart` | `centerEnd` |

Delete the two stale textAlign comments (the cast's `textAlign` note above
`ATimeEl`, and the rows' right-justify note) when the prop's truth changes. The
hero trio, footer, card paddings (`CARD_PAD_START` equals `CARD_PAD_END`), row
gutter math, widths, colors, the `ALabel` string, the small composition, `AStale`,
`ANeutral` and `ACard` centered states change not at all. The countdown label needs
no isolate (D135.9: it never shares a text node with Arabic content). Implement the
swap with the values chosen once at the top of the medium branch (the pattern
`const rowFirst = rtl ? timeBox : nameBox`), not by duplicating the JSX, so the two
compositions cannot drift apart; the marker-tree tests above are the guard.

The `ATimeEl` cast's `textAlign?: 'end'` widens to `'start' | 'end'`.

## Green run

The five new cases green; the whole `widgetRenderer.test.ts` suite green (the
existing LTR assertions must not move); `yarn validate` green, coverage 100 percent.

## Break script

`scripts/break-135-mirror.sh`:

```bash
#!/usr/bin/env bash
# Breaks R1.1: pin the mirror off and the red suite must catch it.
set -e
cd "$(dirname "$0")/../../../.."
# The fix is uncommitted in the tree at break time, so restore by copying the
# pristine file back from $TMPDIR, never `git checkout` (it would revert the fix).
W=widgets/PrayerWidget.tsx
cp "$W" "$TMPDIR/mirror-135.tsx"
restore() { cp "$TMPDIR/mirror-135.tsx" "$W"; }
trap restore EXIT
python3 - <<'PYEOF'
from pathlib import Path
p = Path("widgets/PrayerWidget.tsx")
s = p.read_text()
old = "const rtl = input.rtl === true;"
new = "const rtl = false;"
assert s.count(old) == 1, "anchor drifted"
p.write_text(s.replace(old, new))
PYEOF
npx jest shared/__tests__/widgetRenderer.test.ts -t "under rtl" --watchman=false --selectProjects=unit 2>&1 | tail -5
echo "BREAK 135-MIRROR: expected FAIL above, file restored from TMPDIR"
```

Expected: exit 1, the `mirrors the medium row order` case fails on tree order.

## Version and commit

Next patch under `$HOME/athan-gitree/version.lock`; message:
`<VERSION> - feat(widgets): the Android widget mirrors under an RTL app locale (135 step 2)`.
Main-tree `android/app/build.gradle` sync after the merge, under the build lock.

## Review

Read the diff cold: one new boolean, one swap table, no duplicated composition, no
transform, no pixel constant moved. Then the mutation pass: flip each of the
table's eight swappable rows in turn (child order, wrapper alignment, inner
alignment, pill inset, rows inset, row-line order, time alignment+textAlign, name
alignment — eight mutants), confirm a named red case fails per mutant, restore.

## Merge

As step 1: `uat.lock`, fetch, uniqueness check, `--no-ff`, main-tree versionName sync.

## Done when

Reds green, `yarn validate` green, the break script red, the six-mutant pass
recorded in `LOG.md`, merged.
