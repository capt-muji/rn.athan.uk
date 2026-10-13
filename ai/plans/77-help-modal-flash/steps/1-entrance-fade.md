# Step 1: the Close row joins the entrance fade

Requirements: R1.1, R1.2, R1.3, R1.4, R1.5
Weight: 2
Branch: `fix/77-help-close-row-fade`, off `uat`
Version: the next patch after uat's `package.json` at execution, `git fetch origin`
first (D4; planning measured the floor at 2.0.204, since uat `ad6a1c89` took 2.0.203).
Bump package.json, app.json, and the gradle `versionName` on disk where `android/`
exists, all together, per the version rule.

## Anchor check

Run the preflight in place from the checkout root:
`bash ai/plans/77-help-modal-flash/scripts/preflight-77.sh`. Expected: `PREFLIGHT OK`.
Any other output stops the step.

## Goal

The Help modal's Close row paints opaque from its first frame while the container's
FadeIn raises the card around it (her 2026-10-13 report; measured alphas in PLAN.md
section 1). This step gives the row the container's own entrance fade and pins the
contract in jest. Requirements R1.1 and R1.4 are the jest-gated halves; R1.2 is the
capture-gated half; R1.3 and R1.5 are the unchanged-behaviour halves the suites guard.

## Red tests first

Add to `components/modals/__tests__/Help.test.tsx` a new describe after the chevron
describe. The imports gain `FadeIn` and `LinearTransition` from
`react-native-reanimated` and `import type { ReactTestInstance } from '@testing-library/react-native'`
(Biome order: with the other package imports at the top).

```tsx
describe("the Help modal's Close row entrance", () => {
  // ai/AGENTS.md: animated components first-frame in their settled state. The row once
  // painted opaque while the card faded in around it (owner report, 2026-10-13), so the
  // nearest entering ancestor of Close is read: a rule the app keeps. Today that
  // ancestor is the card's slide, which is the defect; after the fix it is the row's
  // own fade on the container's builder.
  const enteringAncestorOf = (node: ReactTestInstance): ReactTestInstance | null => {
    let current: ReactTestInstance | null = node.parent;
    while (current && !current.props?.entering) current = current.parent;
    return current;
  };

  it('fades in with the card on the modal container entrance fade', async () => {
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);

    const row = enteringAncestorOf(screen.getByRole('button', { name: 'Close' }));

    expect(row?.props.entering).toBe(FadeIn);
    expect(row?.props.layout).toBe(LinearTransition);
  });
});
```

Run: `npx jest components/modals/__tests__/Help.test.tsx --watchman=false --selectProjects=components`.
Expected RED: the new test fails at the `toBe(FadeIn)` assertion, jest printing
`BaseAnimationMock {}` on both sides (the mock builders carry no printable name; the
red is the failing test name plus that assertion line, the walk having found the
card's slide). Every other test in the file passes. Anything else failing, or this one
passing, is a STOP (PLAN.md section 2.2).

Mock limit, recorded so nobody "strengthens" the test into a lie: under the mock,
`FadeIn.duration(x)` mutates and returns the same singleton
(node_modules/react-native-reanimated/src/mock.ts:264-267), so jest cannot tell a bare
builder from a chained one. The bare-builder contract is enforced by review against
this step's change contract, and the fade-curve sync is proven by the capture (R1.2).

## Change contract

One hunk in `components/modals/Help.tsx`. The Close row's Animated.View
(Help.tsx:151) gains `entering={FadeIn}`:

```tsx
<Animated.View layout={GROW} entering={FadeIn} style={styles.buttonRow}>
```

- `FadeIn` is already imported in Help.tsx (line 5, used by the answer panel at line
  76), so the import line itself needs no change; adding it again would be a duplicate
  Biome rejects.
- `FadeIn` is bare on the row: no `.duration`, no `.easing`, no `.delay`, no
  `.springify`, no `.withInitialValues` (D1; the container at Modal.tsx:81 runs the
  same bare builder, so both take the library default 300 ms and easing).
- Nothing else in the file changes: `GROW` stays on the row (R1.4), the opaque
  `backgroundColor` stays (R1.3), no style value moves, no other component changes.

## Green run

1. `npx jest components/modals/__tests__/Help.test.tsx components/modals/__tests__/Modal.test.tsx --watchman=false --selectProjects=components`.
   Expected: the new test passes; every prior test still passes (R1.5 among them).
2. Frame proof per PLAN.md section 7: the red capture (before the change, saved under
   `$HOME/athan-gitree/sessions/77/`), the change, the green capture. Expected GREEN:
   matched row-card alpha pairs within 0.05 at every sample (R1.2); alpha tables
   appended to LOG.md.
3. `yarn validate`. Expected: tsc, Biome and the full suite pass, coverage at 100 on
   all four measures. If Biome complains about the edit's formatting, run `yarn format`
   and re-run.

## Break script

Against the green state, each mutant must turn the new test red; restore after each.

1. Delete the `entering={FadeIn}` prop from Help.tsx:151. Expected: the test fails
   (the walk finds the card, `SlideInDown` received). Restore.
2. Move the prop onto the Close Pressable instead of the row. Expected: the test fails
   the same way (the walk starts above the Pressable and finds the card). Restore.
3. Delete `layout={GROW}` from the row. Expected: the test fails on the
   `LinearTransition` identity. Restore.

## Version and commit

Run the D4 rule: `git fetch origin`, read uat's `package.json` version, take the next
patch. Planning's floor is 2.0.204. Commit message, with `<VERSION>` replaced by the
number the rule yields:

```
<VERSION> - fix(modals): ticket 77: the Help Close row joins the card's entrance fade
```

The pre-commit hook runs lint-staged, `yarn validate` and the changed-coverage gate,
3 to 4 minutes.

## Review checklist

- The prop is on the row's Animated.View, bare, no chained overrides (R1.1).
- `GROW` and the opaque background are untouched (R1.3, R1.4).
- Modal.tsx, Update.tsx, WhatsNew.tsx are untouched (D1, D3).
- The test asserts `FadeIn` and `LinearTransition` identity on the same node.
- LOG.md carries the red and green alpha tables, the simulator name, and the session
  line.
- No capture, frame or recording under `sessions/77/` is committed; the folder is
  evidence, not git content (ai/AGENTS.md: never commit a device screenshot or
  recording).

## Merge

`git checkout uat && git merge --no-ff fix/77-help-close-row-fade -m "<VERSION> - merge fix/77-help-close-row-fade: ticket 77 step 1: the Help Close row joins the entrance fade"`.
Never push.

## Done when

- Preflight printed `PREFLIGHT OK` before work started.
- The new test went red for the named reason, then green after the one-hunk change.
- Red and green captures exist under `$HOME/athan-gitree/sessions/77/` with alpha
  tables in LOG.md, and the green table satisfies R1.2 (or the no-flash outcome is
  recorded, section 2.2).
- `yarn validate` passes.
- The commit lands on `uat` at the version the D4 rule yielded.
