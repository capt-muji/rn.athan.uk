# Step 1: Measure every prayer name

Requirements: R1.1, R1.2
Weight: 2

## Anchor check

```bash
cd "$(git rev-parse --show-toplevel)"
for a in measurer-body:components/ui/InitialWidthMeasurement.tsx prayer-longest:shared/prayer.ts \
         test-banner:shared/__tests__/prayer.test.ts test-import:shared/__tests__/prayer.test.ts \
         layout-key:app/_layout.tsx row-width:components/prayer/Prayer.tsx; do
  n="${a%%:*}"; src="${a#*:}"
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
    "ai/plans/61-widest-label-measure/scripts/anchors/$n.txt" "$src"
done
```

Expected: six lines, each `1`. The last two pin section 4's read-only
context (the remount key and the row's reserve). Any other count: `NEEDS_CONTEXT: NEEDS
REPLAN, <the anchor and its count>`.

## Goal

One hidden measurer Text per prayer id on both lists, reporting into the
widen-only store, so the reserve is the widest label in rendered points.

## Branch

`git checkout -b code/61-1-measure-every-name uat`

## Files

- `components/ui/InitialWidthMeasurement.tsx` (rewritten body)
- `components/ui/__tests__/InitialWidthMeasurement.test.tsx` (the existing
  suite, extended: its three describes stay, two tests append, its doc
  comment's second line becomes `the hidden texts that measure every name,
  and the list each measured width is stored for`)
- `shared/prayer.ts` (`getLongestPrayerNameIndex` deleted)
- `shared/__tests__/prayer.test.ts` (its describe block and import entry
  deleted)
- `ai/plans/README.md` (ticket line: `IN PROGRESS, step 1`)
- this plan folder's `PLAN.md` and `LOG.md`

## Red tests

The existing `components/ui/__tests__/InitialWidthMeasurement.test.tsx`
keeps its three describes (they still pass once every name mounts: their
queried labels stay unique among the eleven). Extend its header with the two
imports it does not already carry, and import nothing the header already has
(`fireEvent`, `render`, `screen`, `getDefaultStore`, `ScheduleType`,
`englishWidthAtomFor` and the default import are all present; Biome regroups
but never merges duplicates, and the jest transform fails the parse on a
re-declaration):

```tsx
import { EXTRA_PRAYER_IDS, STANDARD_PRAYER_IDS } from '@/shared/constants';
import { prayerLabel } from '@/shared/i18n';
```

Update the suite's doc comment to `the hidden texts that measure every name,
and the list each measured width is stored for`. Then append:

```tsx
describe('the hidden measurers', () => {
  it('mounts one measurer per prayer name on both lists', async () => {
    await render(<InitialWidthMeasurement />);

    for (const id of [...STANDARD_PRAYER_IDS, ...EXTRA_PRAYER_IDS]) {
      expect(screen.getByText(prayerLabel(id))).toBeOnTheScreen();
    }
  });

  it('widens the reserve from any single name, not only the longest by characters', async () => {
    await render(<InitialWidthMeasurement />);
    const before = getDefaultStore().get(englishWidthAtomFor(ScheduleType.Standard));

    // A short name with wide glyphs is the Somali defect's shape: its measure must count
    const aShorterName = screen.getByText(prayerLabel('fajr'));
    await fireEvent(aShorterName, 'layout', { nativeEvent: { layout: { width: before + 40 } } });

    expect(getDefaultStore().get(englishWidthAtomFor(ScheduleType.Standard))).toBe(before + 40);
  });
});
```

Run:

```bash
npx jest components/ui/__tests__/InitialWidthMeasurement.test.tsx --watchman=false --selectProjects=components
```

Expected red: the two new tests fail - each on its first unmounted label's
`getByText` query, printing `Unable to find an element with text:` (only
`Sunrise` and `Last Third` mount today) - while the three existing
describes pass. Any other failure, or a new test passing: `STOP:`.

## Change contracts

In `components/ui/InitialWidthMeasurement.tsx`, the component body becomes
(the docblock is replaced with the one below; `getLongestPrayerNameIndex`
leaves the imports; `STANDARD_PRAYER_IDS` and `EXTRA_PRAYER_IDS` stay):

```tsx
/**
 * Continuously measures the width of every prayer name for both schedules:
 * the widest label in rendered points is the reserve, and character count
 * only approximates it (the Somali report had a shorter wide-glyph name
 * wrapping inside the character-longest's reserve). The hidden texts stay
 * mounted for the app's lifetime and the store accepts only measurements
 * that WIDEN the cached value, so a bad first-launch measure (pre-custom-
 * font fallback metrics are narrower - ISSUES #22) self-heals on the next
 * launch. Transparent absolutely-positioned Texts cost nothing while
 * mounted.
 */
export default function InitialWidthMeasurement() {
  return (
    <>
      {STANDARD_PRAYER_IDS.map((id) => (
        <Text
          key={id}
          style={styles.hidden}
          onLayout={(e) => setEnglishWidth(ScheduleType.Standard, e.nativeEvent.layout.width)}>
          {prayerLabel(id)}
        </Text>
      ))}
      {EXTRA_PRAYER_IDS.map((id) => (
        <Text
          key={id}
          style={styles.hidden}
          onLayout={(e) => setEnglishWidth(ScheduleType.Extra, e.nativeEvent.layout.width)}>
          {prayerLabel(id)}
        </Text>
      ))}
    </>
  );
}
```

In `shared/prayer.ts`, delete `getLongestPrayerNameIndex` (anchor
`prayer-longest.txt`) including its leading comment block if one sits
directly above it inside the anchor's neighbourhood, leaving the surrounding
sections intact. The `currentPrayerLabels` import leaves with it: the
function was its sole user, and Biome's `noUnusedImports` at
`--error-on-warnings` fails the build on the orphan.

In `shared/__tests__/prayer.test.ts`, delete the banner and describe block
(anchors `test-banner.txt` through the block's closing `});`) and the
`getLongestPrayerNameIndex,` import entry (anchor `test-import.txt`).

## Green run

```bash
npx jest components/ui/__tests__/InitialWidthMeasurement.test.tsx shared/__tests__/prayer.test.ts stores/__tests__/ui.test.ts --watchman=false --selectProjects=components,unit
npx tsc --noEmit
npx biome check . --error-on-warnings
```

Expected: all pass (both projects selected; the paths route to their own
projects), tsc exit 0, Biome exit 0. Then the coverage gate:

```bash
yarn validate
```

Expected: exit 0 with the four 100% coverage lines. The existing suite's
per-locale describes fire one layout event per list, and the new tests fire
a Standard event, so both lists' `onLayout` arrows stay covered.

`grep -rn getLongestPrayerNameIndex --include='*.ts' --include='*.tsx'
components/ shared/ app/ hooks/ stores/` returns nothing.

## Break script

`$TMPDIR/break-61-1.sh`, run with `bash` from the repository root:

```bash
#!/bin/bash
# Break: the Standard map drops its last id; the per-name test must fail
cd "$(git rev-parse --show-toplevel)" || exit 1
perl -0pi -e 's/STANDARD_PRAYER_IDS\.map/STANDARD_PRAYER_IDS.slice(0, -1).map/' components/ui/InitialWidthMeasurement.tsx
npx jest components/ui/__tests__/InitialWidthMeasurement.test.tsx --watchman=false --selectProjects=components > "$TMPDIR/break-61-1.log" 2>&1
if grep -q "1 failed" "$TMPDIR/break-61-1.log" && grep -qF "getByText" "$TMPDIR/break-61-1.log"; then
  echo 'ALL AS EXPECTED: 1'
else
  echo 'BREAK NOT APPLIED'
fi
perl -0pi -e 's/STANDARD_PRAYER_IDS\.slice\(0, -1\)\.map/STANDARD_PRAYER_IDS.map/' components/ui/InitialWidthMeasurement.tsx
```

Expected last line: `ALL AS EXPECTED: 1` (the dropped id's label is no longer
mounted), then `git status --porcelain` lists only this step's files and the
plan files.

## Version and commit

Fetch `origin` under the version lock. Next patch after uat's `package.json`
(`app.json` first, then `package.json`, then the gitignored gradle
`versionName`). Commit message:

```
<VERSION> - fix(list): the prayer-name reserve measures every label, the widest wins (61)
```

## Review checklist

- The component renders one Text per id; no `getLongestPrayerNameIndex`
  anywhere; no store file touched.
- The reserve can only grow: widen-only untouched (`stores/ui.ts` absent
  from the diff).
- No pixel styling changed: `styles.hidden` byte identical.

## Merge

```bash
git checkout uat && git merge --no-ff code/61-1-measure-every-name -m "<VERSION> - merge code/61-1-measure-every-name: widest-label reserve (61)"
```

Delete the branch after the merge. Then Finishing: records text into LOG.md,
ticket set to EXECUTED, executed docs commit, merge, no push.

## Done when

Checklist ticked, LOG.md entry under `### Step 01 — done` with the
`session:` line, Finishing complete.
