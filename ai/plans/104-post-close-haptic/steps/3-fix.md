# Step 3: the fix, the commit defers past the next paint

Requirements: R1.1, R1.2, R1.3, R3.1
Weight: 2

Anchor check: `sound-handleDismiss` and `saturation-comment` still count exactly 1 (the preflight
covers both; if either moved, STOP: the plan is stale).

## Goal

For verdicts T and T2: the sound sheet's dismiss defers the commit start past the next paint, so
the close haptic's dispatch and execution win the thread against the commit's saturation. The
unchanged close path is untouched.

This step runs only after step 2 confirmed verdict T or T2. Verdict N or X STOPs in step 2 and
this step never runs; verdict X that the owner rules to accept closes the ticket without this
step.

## Branch

`git checkout -b fix/close-haptic-on-time uat` (fetch `origin` first).

## Files

- `components/sheets/screens/Sound.tsx`
- the Sound suite that covers the dismiss commit (map it from the file's imports at red-test
  time)

## Red tests

Add one case to the Sound suite: `defers the commit start past the next paint when a draft
exists` - with the suite's jest fake timers (which fake `requestAnimationFrame` on the same
clock, as the deferred widget push's suite does, `stores/__tests__/notifications.test.ts:1439`),
spy on the store's `commitSoundSelection` (`stores/notifications.ts:1687`) with
`mockResolvedValueOnce(true)`, seed a draft, fire the dismiss
path, and assert the commit has NOT been called before the frame callback and its timer run;
then advance them and assert it has. Run it; record the exact failing name and its first failing
line (expected shape: the commit was called synchronously in the dismiss tick). Add the guard
assertions: exactly one `ImpactFeedbackStyle.Light` call for the close and no haptic call follows
the commit's resolution. Any other test failing is a STOP.

## Change contracts

In `components/sheets/screens/Sound.tsx`, inside `handleDismiss` only:

- At module scope beside `SHEET_PERF_NAME`, define the deferral once (it is stateless; a
  component-scope helper would churn the dismiss callback against Biome's dependency rule):
  `const deferPastNextPaint = () => new Promise<void>((resolve) => { requestAnimationFrame(() => { setTimeout(resolve, 0); }); });`
  (the repo's own idiom for this saturation class, `stores/notifications.ts:1612-1614`).
- After the early return and before the `await commitSoundSelection(...)` line, add
  `await deferPastNextPaint();`.
- Nothing else moves: the no-draft early return stays first, the commit call stays last, the
  draft clear stays after the commit on both outcomes, and the shared Sheet's `handleDismiss` is
  not touched.

## Green run

1. The Sound suite green, including the new case and the guard assertions.
2. The Sheet suite green (step 1's marks still intact).
3. `yarn validate`.

## Break script

`bash <TMPDIR-copy>/scripts/break-104.sh defer` from the repository root.
It comments out the `await deferPastNextPaint();` line only, runs the new case, expects it to
fail with the commit called before the frame, then restores the file from its backup copy.
Output ends `BREAK OK`.

## Version and commit

The version is the next patch after `uat`'s `package.json` when the step runs (bump `app.json`
first, then `package.json`, then `android/app/build.gradle`). Commit message:
`<VERSION> - fix(sound-sheet): the changed-pick commit defers past the next paint so the close haptic lands on time (verdict <T|T2>)`.

## Review checklist

- The diff touches the sound sheet and its test only.
- The deferral sits after the no-draft early return (the unchanged close runs it never).
- The verdict from step 2 is in the commit message.

## Merge

`git checkout uat && git merge --no-ff fix/close-haptic-on-time -m "<VERSION> - merge fix/close-haptic-on-time: the close haptic on time"`.
Never push.

## Done when

Reds recorded, suites green, `yarn validate` green, merged into `uat`, the hook's `Tests:` and
coverage lines pasted into `LOG.md`, and the step entry ends with its `session:` line.
