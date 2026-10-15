# Step 8 — the schedule header's ar tighten

Requirements: R8.1, R9.1
Weight: 2

## Anchor check

`python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' scripts/anchors/14-day-location.md components/day/Day.tsx`
prints `1`. Any other count is `NEEDS_CONTEXT: NEEDS REPLAN`.

## Goal

Under ar the location line tightens onto the date line below it: the gap goes from
5 to 2 points on both schedule pages (one shared component renders both).

## Branch

`git checkout -b code/100-day-gap lane/100`

## Files

- `components/day/Day.tsx` (changed, one style line)
- `components/day/__tests__/DayLines.test.tsx` (changed, new case)

## Red tests

In `components/day/__tests__/DayLines.test.tsx`, following the file's own rendering
and style-flattening shape and the `SoundItem.test.tsx` locale pattern:

```ts
it('tightens the location-to-date gap to 2 points under ar', async () => {
  setActiveLocale('ar');
  try {
    await render(<Day type={ScheduleType.Standard} />);
    const location = screen.getByText('لندن، المملكة المتحدة');
    expect(StyleSheet.flatten(location.props.style).marginBottom).toBe(2);
  } finally {
    setActiveLocale('en');
  }
});
```

Adjust the finder and imports to the file's existing helpers (if it seeds a London
day through the harness the way `Ago.test.tsx` does, seed the same way; the location
line renders from the catalog without data). The ar case fails against the planned
sha (the value is `SPACING.quart`, 5). Record the failing name and line in `LOG.md`.

## Change contracts

`components/day/Day.tsx`:

- Beside the module-scope `ty`, read
  `const compactArabic = currentLocaleId() === 'ar';` with the one-line comment
  naming the read (owner, 2026-10-15: no clipping remains, only the gap).
- `styles.location.marginBottom` becomes `compactArabic ? 2 : SPACING.quart`.

## Green run

`npx jest components/day/__tests__/DayLines.test.tsx components/day/__tests__/Day.test.ts --watchman=false`
exits 0, then `npx tsc --noEmit` and `npx biome check . --error-on-warnings` exit 0.

## Break script

`bash scripts/breaks/break-08.sh` from the lane root, created in this step as:

```bash
#!/usr/bin/env bash
set -u
cp components/day/Day.tsx "$TMPDIR/break08-day.tsx"
python3 - <<'EOF'
from pathlib import Path
p = Path('components/day/Day.tsx')
s = p.read_text()
old = "marginBottom: compactArabic ? 2 : SPACING.quart,"
new = "marginBottom: SPACING.quart,"
assert old in s, 'anchor for break missing'
p.write_text(s.replace(old, new))
EOF
npx jest components/day/__tests__/DayLines.test.tsx --watchman=false -t '2 points under ar' >"$TMPDIR/break08.log" 2>&1
status=$?
mv "$TMPDIR/break08-day.tsx" components/day/Day.tsx
if [ $status -ne 0 ]; then
  echo "ALL AS EXPECTED: 1"
else
  echo "BREAK NOT APPLIED"
fi
```

The first failing line names the 2 point expectation. The script restores the file
and ends `ALL AS EXPECTED: 1`.

## Version and commit

Fetch under the version lock, bump `app.json` then `package.json` one patch above
`lane/100`'s tip. Commit message:
`<VERSION> - fix(day): the ar location line tightens onto the date line (D95)`

## Review checklist

- The en value is byte-identical (`SPACING.quart`).
- The diff is one style line plus the test.
- Both schedules render through this one component, so no second site exists.

## Merge

`git checkout lane/100 && git merge --no-ff code/100-day-gap -m "<VERSION> - merge code/100-day-gap: the schedule header's ar tighten"`

## Restore list

`git checkout -- components/day/Day.tsx components/day/__tests__/DayLines.test.tsx` and delete `scripts/breaks/break-08.sh` if untracked.

## Done when

The checklist box is ticked, the merge landed on `lane/100`, and `LOG.md` carries the
step entry with the hook's `Tests:` line.
