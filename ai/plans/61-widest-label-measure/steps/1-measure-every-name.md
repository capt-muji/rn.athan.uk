# Step 1: Measure every prayer name

Requirements: R1.1, R1.2
Weight: 2

## Anchor check

```bash
cd "$(git rev-parse --show-toplevel)"
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
  ai/plans/61-widest-label-measure/scripts/anchors/measurer-body.txt components/ui/InitialWidthMeasurement.tsx
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
  ai/plans/61-widest-label-measure/scripts/anchors/prayer-longest.txt shared/prayer.ts
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
  ai/plans/61-widest-label-measure/scripts/anchors/test-banner.txt shared/__tests__/prayer.test.ts
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
  ai/plans/61-widest-label-measure/scripts/anchors/test-import.txt shared/__tests__/prayer.test.ts
```

Expected: four lines, each `1`. Any other count: `NEEDS_CONTEXT: NEEDS
REPLAN, <the anchor and its count>`.

## Goal

One hidden measurer Text per prayer id on both lists, reporting into the
widen-only store, so the reserve is the widest label in rendered points.

## Branch

`git checkout -b code/61-1-measure-every-name uat`

## Files

- `components/ui/InitialWidthMeasurement.tsx` (rewritten body)
- `components/ui/__tests__/InitialWidthMeasurement.test.tsx` (new suite)
- `shared/prayer.ts` (`getLongestPrayerNameIndex` deleted)
- `shared/__tests__/prayer.test.ts` (its describe block and import entry
  deleted)
- `ai/plans/README.md` (ticket line: `IN PROGRESS, step 1`)
- this plan folder's `PLAN.md` and `LOG.md`

## Red tests

New file `components/ui/__tests__/InitialWidthMeasurement.test.tsx`:

```tsx
/**
 * The hidden measurers: every prayer name is measured, so the reserved width is the widest
 * label in points, whichever locale and glyph widths are in force
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';

import { type PrayerId, STANDARD_PRAYER_IDS, EXTRA_PRAYER_IDS } from '@/shared/constants';
import { prayerLabel } from '@/shared/i18n';
import { ScheduleType } from '@/shared/types';
import { englishWidthAtomFor } from '@/stores/ui';

import InitialWidthMeasurement from '../InitialWidthMeasurement';

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
    const aShorterName = screen.getByText(prayerLabel('fajr' as PrayerId));
    await fireEvent(aShorterName, 'layout', { nativeEvent: { layout: { width: before + 40 } } });

    expect(getDefaultStore().get(englishWidthAtomFor(ScheduleType.Standard))).toBe(before + 40);
  });
});
```

Match the import shapes to the repo's `@/shared/constants` exports
(`PrayerId` is a type import) and let Biome place them.

Run:

```bash
npx jest components/ui/__tests__/InitialWidthMeasurement.test.tsx --watchman=false --selectProjects=components
```

Expected red: both tests fail - the first on the first unmounted label's
`getByText` query (only two labels mount today), the second the same way.
A pass on either: `STOP:`.

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
        <Text key={id} style={styles.hidden} onLayout={(e) => setEnglishWidth(ScheduleType.Standard, e.nativeEvent.layout.width)}>
          {prayerLabel(id)}
        </Text>
      ))}
      {EXTRA_PRAYER_IDS.map((id) => (
        <Text key={id} style={styles.hidden} onLayout={(e) => setEnglishWidth(ScheduleType.Extra, e.nativeEvent.layout.width)}>
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
sections intact.

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
projects), tsc exit 0, Biome exit 0. `grep -rn getLongestPrayerNameIndex`
returns nothing.

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
