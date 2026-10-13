# Step 1: the ruled dim levels and the tabular pin

Requirements: R1.1, R1.2, R1.3, R2.1
Weight: 2

## Anchor check

Run `bash ai/plans/79-countdown-dim-noshift/scripts/preflight-79.sh` from the
repository root (a saved copy in `$TMPDIR` runs the same). It must end
`PREFLIGHT OK`. Any anchor count other than 1 is `NEEDS_CONTEXT: NEEDS REPLAN`.

## Goal

The timer's spent digit groups paint white reduced 30 percent, its colons white
reduced 60 percent, and its text style carries tabular figures. Nothing else
changes: not `COLORS.text.muted`, not the colon gap text, not the seconds
preference path, not one other pixel.

## Branch

```
git checkout -b feat/79-dim-tabular uat
```

## Files

- `shared/constants.ts` (two new entries under `COLORS.countdown`)
- `components/countdown/Countdown.tsx` (three edits)
- `components/countdown/__tests__/Countdown.test.tsx` (one mock block, one test
  replaced, two tests added)
- Version files: `app.json`, `package.json`, `android/app/build.gradle`

## Red tests

Apply the test edits first, run the suite, and record the failing lines. The
suite is `components/countdown/__tests__/Countdown.test.tsx`, run with:

```
npx jest components/countdown/__tests__/Countdown.test.tsx --selectProjects=components --watchman=false
```

1. Beside the imports (after the `import Countdown from '../Countdown';` line,
   before `const MAGRIB = 4;`), add:

```tsx
// The dim transition's colours are this suite's subject, so the hook answers
// deterministically at its two anchors instead of through an animation
jest.mock('@/hooks/useAnimation', () => {
  const actual = jest.requireActual('@/hooks/useAnimation');
  return {
    ...actual,
    useDerivedColor: (target: number, input: { fromColor: string; toColor: string }) => ({
      color: target === 0 ? input.fromColor : input.toColor,
    }),
  };
});
```

2. Replace the test anchored by `test-colon-dim.txt` (its full body is the
   anchor) with:

```tsx
  it('renders the colons at white reduced by 60 percent', async () => {
    showLondonDay('2026-09-11', '14:00');
    startCountdowns();
    await render(<Countdown type={ScheduleType.Standard} />);

    const colon = screen.getByText(GAP_COLON, { normalizer: (s) => s });
    const style = Array.isArray(colon.props.style) ? Object.assign({}, ...colon.props.style) : colon.props.style;
    // Row 79: the colon sits 60 percent under the bright digits, the owner's corrected figure
    expect(style.color).toBe('rgba(255, 255, 255, 0.4)');
  });
```

3. Add these two tests directly after it:

```tsx
  it('renders a spent 00 group at white reduced by 30 percent, and a live group at full white', async () => {
    showLondonDay('2026-09-11', '15:30');
    startCountdowns();
    await render(<Countdown type={ScheduleType.Standard} />);

    // Row 79: a 00 group sits 30 percent under the bright digits; the group still counting stays white
    const spent = screen.getByText('00');
    const spentStyle = Array.isArray(spent.props.style) ? Object.assign({}, ...spent.props.style) : spent.props.style;
    expect(spentStyle.color).toBe('rgba(255, 255, 255, 0.7)');
    const live = screen.getByText('59');
    const liveStyle = Array.isArray(live.props.style) ? Object.assign({}, ...live.props.style) : live.props.style;
    expect(liveStyle.color).toBe(COLORS.text.primary);
  });

  it('carries tabular figures on the timer text style, so no digit change can shift the layout', async () => {
    showLondonDay('2026-09-11', '14:00');
    startCountdowns();
    await render(<Countdown type={ScheduleType.Standard} />);

    // Row 79's no-shift rule: every group renders equal-width digits, pinned on the
    // style every section inherits; only the changing digit pair may move
    const colon = screen.getByText(GAP_COLON, { normalizer: (s) => s });
    const timer = colon.parent;
    const style = Array.isArray(timer?.props.style)
      ? Object.assign({}, ...(timer?.props.style as unknown[]))
      : ((timer?.props.style as object) ?? {});
    expect(style.fontVariant).toEqual(['tabular-nums']);
  });
```

Expected red, recorded with the exact lines (verified against uat 9cf6f43d in
the planning scratch worktree):

- `renders the colons at white reduced by 60 percent` fails
  `Expected: "rgba(255, 255, 255, 0.4)" Received: "rgba(138, 169, 214, 0.38)"`.
- `renders a spent 00 group at white reduced by 30 percent, and a live group at full white`
  fails `Expected: "rgba(255, 255, 255, 0.7)" Received: "rgba(138, 169, 214, 0.38)"`
  on the spent assertion; the live assertion passes both before and after, it is
  the invariant guard.
- `carries tabular figures on the timer text style` fails
  `Expected: ["tabular-nums"] Received: undefined`.
- No other test in the suite fails, and no other suite changes.

## Change contracts

1. `shared/constants.ts`, the `COLORS.countdown` object anchored by
   `constants-colors-countdown.txt`, becomes exactly:

```ts
  /** Countdown bar */
  countdown: {
    background: 'rgba(126, 189, 241, 0.19)',
    dimDigit: 'rgba(255, 255, 255, 0.7)',
    colon: 'rgba(255, 255, 255, 0.4)',
  },
```

   `COLORS.text` keeps every entry byte-identical to the
   `constants-colors-text.txt` anchor.

2. `components/countdown/Countdown.tsx`, in the `CountdownSectionText` anchored
   by `countdown-section-text.txt`: the `fromColor` line becomes
   `fromColor: COLORS.countdown.dimDigit,`. The `toColor`, `duration` and the
   returned element stay as they are.

3. In the `styles` object, inside the `countdown` entry anchored by
   `countdown-styles.txt`: the line after `fontFamily: ty.familyDigits,` gains
   `fontVariant: ['tabular-nums'],`. Every other line of that entry stays.

4. In the same `styles` object, the `countdownColon` entry's colour becomes
   `color: COLORS.countdown.colon,`.

Nothing else: the gap text `'\u2009:\u2009'` (row 81 owns its doubling), the
splitColonSections logic, the Bar, the ago badge, and every other reader of
`COLORS.text.muted` are untouched.

## Green run

1. `npx jest components/countdown/__tests__/Countdown.test.tsx --selectProjects=components --watchman=false`
   passes every test.
2. `npx tsc --noEmit` exits 0.
3. `npx biome check . --error-on-warnings` exits 0.

## Version and commit

The version command prints uat's current version, the step version is the next
patch number:

```
python3 -c "import json;print(json.load(open('package.json'))['version'])"
```

Prints `2.0.231`, so the step version is `2.0.232`. Set it in `app.json` (first),
`package.json` and `android/app/build.gradle` `versionName`, all three matching.
No prebuild in this step: no native file changes.

Commit, adding by name: `shared/constants.ts`,
`components/countdown/Countdown.tsx`,
`components/countdown/__tests__/Countdown.test.tsx`, `app.json`,
`package.json`, `ai/plans/README.md` (set ticket 79 to `IN PROGRESS, step 1`),
and this plan folder's `PLAN.md` and `LOG.md`.

Message:

```
2.0.232 - feat(79): the countdown's dim levels on the owner's figures, and tabular digits pinned
```

## Review checklist

- The diff touches only the listed files.
- `COLORS.text.muted` is byte-identical to the anchor.
- The gap text `'\u2009:\u2009'` is byte-identical.
- The colon test was replaced, not deleted, and its ar wrapper is gone with the
  locale branch gone from the render path (row 82 made the timer one design).
- The rule comments sit only beside the assertions they name, and nowhere else.
- No new comment inside `shared/constants.ts`.

## Merge

```
git checkout uat && git merge --no-ff feat/79-dim-tabular -m "2.0.232 - merge feat/79-dim-tabular: step 1, ticket 79"
```

## Break script

Run on `uat` after the merge, so the mutations apply to the merged state and the
restore leaves a clean tree:

```
bash ai/plans/79-countdown-dim-noshift/scripts/break-step1.sh
```

It must end `ALL AS EXPECTED: 1` with both catches fired. After it,
`git status --porcelain` prints nothing.

## Done when

Checklist ticked for step 1 in `PLAN.md` section 6, the LOG entry written, the
merge on uat, and the tree clean.