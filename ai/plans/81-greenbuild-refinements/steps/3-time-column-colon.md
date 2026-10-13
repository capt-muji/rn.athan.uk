# Step 3: the prayer time column splits its colon

Requirements: R3.1, R3.2
Weight: 2

## Anchor check

`bash ai/plans/81-greenbuild-refinements/scripts/preflight-81.sh 3`. It must
end `PREFLIGHT OK`.

## Goal

A readable row time renders as two digit groups around one colon node: the
colon padded with two thin spaces per side at 40 percent opacity, riding the
row's own colour state, with the whole `HH:MM` string as one accessibility
label. The unread sentinel stays one unsplit node.

## Branch

```
git checkout -b feat/81-time-colon uat
```

## Files

- `components/prayer/Time.tsx`
- `components/prayer/__tests__/Time.test.tsx`
- Version files

## Red tests

In `Time.test.tsx`:

1. Add the constant after the `import PrayerTime from '../Time';` line (with
   the suite's existing import of nothing else new; `splitSingleColon` is not
   imported, the tests query by rendering):

```tsx
const GAP_COLON = '\u2009\u2009:\u2009\u2009';
```

2. In the `it.each` anchored by `time-test-each.txt`, the assertion becomes
   `expect(screen.getByLabelText(time)).toBeOnTheScreen();`. In the Suhoor and
   Duha describe, `screen.getByText('06:46')` (both occurrences) and in the
   overlay describe `screen.getByText('06:28')` become `screen.getByLabelText(...)`.
   Every `--:--` query stays `getByText`: the sentinel is one node.
3. Add at the end of the file:

```tsx
describe('the readable row time on Friday 11 September 2026 at 14:00', () => {
  it('splits its colon into a gap node at two thin spaces per side', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<PrayerTime type={ScheduleType.Extra} index={3} />);

    expect(screen.getByText(GAP_COLON, { normalizer: (s) => s })).toBeOnTheScreen();
  });

  it('renders the split colon at 40 percent of its digits, and labels the whole time', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<PrayerTime type={ScheduleType.Extra} index={3} />);

    // Row 81: the colon sits 60 percent under its own row's digits, whichever state the row is in
    const colon = screen.getByText(GAP_COLON, { normalizer: (s) => s });
    const style = Array.isArray(colon.props.style) ? Object.assign({}, ...colon.props.style) : colon.props.style;
    expect(style.opacity).toBe(0.4);
    expect(screen.getByLabelText('06:46')).toBeOnTheScreen();
  });

  it('renders the unread sentinel as one node with no gap node', async () => {
    showLondonDay('2026-09-11', '14:00', { '2026-09-11': 'not stored' });
    await render(<PrayerTime type={ScheduleType.Standard} index={2} />);

    expect(screen.getByText('--:--')).toBeOnTheScreen();
    expect(screen.queryByText(GAP_COLON)).toBeNull();
  });
});
```

Expected red: the label queries fail `Unable to find an element` (the label
does not exist and the split does not exist), the gap query fails `Unable to
find an element`, and the opacity assertion fails `Expected: 0.4` against
`undefined`. The sentinel test passes before and after, it is the invariant
guard. No other suite moves.

## Change contract

`Time.tsx`: add `Text` to the react-native import, add the new import line
`import { splitSingleColon } from '@/shared/time';` in Biome's import order,
and replace the render anchored by `time-render.txt` with exactly:

```tsx
  const parts = displayTime === UNAVAILABLE_TIME ? null : splitSingleColon(displayTime);

  return (
    <View style={[styles.container]}>
      <Animated.Text
        style={[styles.text, colorStyle]}
        accessibilityLabel={parts === null ? undefined : displayTime}>
        {parts === null ? (
          displayTime
        ) : (
          <>
            {parts[0]}
            <Text style={styles.colon}>{'\u2009\u2009:\u2009\u2009'}</Text>
            {parts[1]}
          </>
        )}
      </Animated.Text>
    </View>
  );
```

And the styles object gains after the `text` entry:

```ts
  colon: {
    opacity: 0.4,
  },
```

Nothing else: the colour fade, the cascade delays and the container stay.

## Green run

The suite passes; `npx tsc --noEmit` exits 0; `npx biome check .
--error-on-warnings` exits 0; `npx jest components/prayer/__tests__/Prayer.test.tsx
components/prayer/__tests__/List.test.tsx __tests__/app/Screen.test.tsx
--selectProjects=components --watchman=false` passes (they never query a time
string; the run proves the split did not leak).

## Break script

After the merge: `bash
ai/plans/81-greenbuild-refinements/scripts/break-step3.sh`. It must end
`ALL AS EXPECTED: 1` with both catches fired and leave the tree clean.

## Version and commit

The version command prints `2.0.243`, so the step version is `2.0.244`. Set it
in the three files. Commit, adding by name: `components/prayer/Time.tsx`,
`components/prayer/__tests__/Time.test.tsx`, `app.json`, `package.json`,
`ai/plans/README.md` (ticket 81 to `IN PROGRESS, step 3`), and this plan
folder's `PLAN.md`, `LOG.md` and `steps/3-time-column-colon.md`. Message:

```
2.0.244 - feat(81): the row time splits its colon into a gapped 40 percent node
```

## Review checklist

- The sentinel path renders `displayTime` untouched with no label override.
- The label equals the whole string, so a screen reader's announcement is
  unchanged from before the split.
- The colour fade and its timings are byte-identical.

## Merge

```
git checkout uat && git merge --no-ff feat/81-time-colon -m "2.0.244 - merge feat/81-time-colon: step 3, ticket 81"
```

## Done when

Step 3 ticked, the LOG entry written, the merge on uat, the tree clean.