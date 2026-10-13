# Step 4: the ago badge colon, the list gap and the badge lift

Requirements: R4.1, R5.1
Weight: 2

## Anchor check

`bash ai/plans/81-greenbuild-refinements/scripts/preflight-81.sh 4`. It must
end `PREFLIGHT OK`.

## Goal

The badge's duration colon doubles its gaps and dims to 40 percent of the
badge's own colour state; the gap below the prayer list drops to 75 percent of
30 (22.5), and the badge rises four further points away from the settings
button.

## Branch

```
git checkout -b feat/81-ago-list-gap uat
```

## Files

- `components/prayer/Ago.tsx`
- `components/prayer/List.tsx`
- `components/prayer/__tests__/Ago.test.tsx`
- `components/prayer/__tests__/List.test.tsx`
- Version files

## Red tests

In `Ago.test.tsx`:

1. The constant becomes `const GAP_COLON = '\u2009\u2009:\u2009\u2009';` and
   the two sentence literals in the `it.each` anchored by `ago-test-each.txt`
   are doubled by one mechanical rule: replace every `\u2009` escape in the
   original literal with `\u2009\u2009`, changing nothing else. The first
   original `'Dhuhr 0\u2009:\u200903 ago'` therefore becomes
   `'Dhuhr 0\u2009\u2009:\u2009\u200903 ago'`; apply the same rule to the
   second original `'Dhuhr 0\u2009:\u200958 ago'` character by character.
   Both gap-dependent tests fail against today's single-space render.
2. Add at the end of the file:

```tsx
describe('the badge on Friday 11 September 2026, after Dhuhr at 13:02', () => {
  it('renders its colon at 40 percent of the badge colour and lifts four points', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<PrayerAgo type={ScheduleType.Standard} />);

    // Row 81: the colon sits 60 percent under the badge's own colour, and the badge
    // rises four points away from the settings button after the list gap's 25 percent cut
    const colon = screen.getByText(GAP_COLON, { normalizer: (s) => s });
    const colonStyle = Array.isArray(colon.props.style)
      ? Object.assign({}, ...colon.props.style)
      : colon.props.style;
    expect(colonStyle.opacity).toBe(0.4);
    const badge = colon.parent;
    const badgeStyle = badge === null ? {} : Array.isArray(badge.props.style)
      ? Object.assign({}, ...badge.props.style)
      : badge.props.style;
    expect(badgeStyle.marginTop).toBe(-4);
  });
});
```

In `List.test.tsx`, append at the end of the file:

```tsx
describe('the gap below the list', () => {
  it('renders at 75 percent of the old 30, on both schedules', async () => {
    showLondonDay('2026-09-11', '14:00');

    await render(<List type={ScheduleType.Standard} />);

    // Row 81: the owner's 25 percent cut of the list-to-ago gap
    const rows = screen.root.findAll((node) => node.props.style !== undefined);
    const container = rows.find((node) => {
      const style = Array.isArray(node.props.style) ? Object.assign({}, ...node.props.style) : node.props.style;
      return style.marginHorizontal !== undefined && style.marginBottom !== undefined;
    });
    const style = container === undefined ? {} : Array.isArray(container.props.style)
      ? Object.assign({}, ...container.props.style)
      : container.props.style;
    expect(style.marginBottom).toBe(22.5);
  });
});
```

Expected red: the sentence and gap queries fail `Unable to find an element`,
the opacity pin fails `Expected: 0.4`, the badge pin fails
`Expected: -4`, the list pin fails `Expected: 22.5`. No other suite moves.

## Change contracts

1. `Ago.tsx`, the split render anchored by `ago-parts.txt`: the inner colon
   `Text` becomes `<Text style={styles.colon}>{'\u2009\u2009:\u2009\u2009'}</Text>`.
2. `Ago.tsx`, the style anchored by `ago-style.txt`, gains
   `marginTop: -SPACING.xs,` after the `alignSelf` line, and the styles object
   gains after the `prayerAgo` entry:

```ts
  colon: {
    opacity: 0.4,
  },
```

3. `List.tsx`, the style anchored by `list-styles.txt`: the `marginBottom`
   line becomes `marginBottom: SPACING.xxxl * 0.75,`.

## Green run

Both suites pass; `npx tsc --noEmit` exits 0; `npx biome check .
--error-on-warnings` exits 0; `npx jest __tests__/app/Screen.test.tsx
--selectProjects=components --watchman=false` passes (the screen renders both
schedules' badge from the same components).

## Break script

After the merge: `bash
ai/plans/81-greenbuild-refinements/scripts/break-step4.sh`. It must end
`ALL AS EXPECTED: 1` with all four catches fired and leave the tree clean.

## Version and commit

The version command prints `2.0.244`, so the step version is `2.0.245`. Set it
in the three files. Commit, adding by name: `components/prayer/Ago.tsx`,
`components/prayer/List.tsx`, `components/prayer/__tests__/Ago.test.tsx`,
`components/prayer/__tests__/List.test.tsx`, `app.json`, `package.json`,
`ai/plans/README.md` (ticket 81 to `IN PROGRESS, step 4`), and this plan
folder's `PLAN.md`, `LOG.md` and `steps/4-ago-list-gap.md`. Message:

```
2.0.245 - feat(81): the ago colon gapped and dimmed, the list gap cut a quarter, the badge lifted
```

## Review checklist

- The badge's recent and normal colour paths are byte-identical; only the
  colon node and the badge's top margin changed.
- The `now` badge renders one node with no gap node, unchanged.
- Both schedules read the same components; no per-type branch was added.

## Merge

```
git checkout uat && git merge --no-ff feat/81-ago-list-gap -m "2.0.245 - merge feat/81-ago-list-gap: step 4, ticket 81"
```

## Done when

Step 4 ticked, the LOG entry written, the merge on uat, the tree clean.