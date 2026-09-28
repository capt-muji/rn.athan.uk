# Audit: session 35, the housekeeping batch

Audited in a scratch worktree at `session/35-housekeeping`, reading each commit's diff back cold.
Verdict: **PASS**, after one finding the audit fixed itself.

## What was checked

| Item | How | Result |
| --- | --- | --- |
| The range holds only this session's commits | `git log --oneline uat-2..session/35-housekeeping` | 5 commits, 1.29.61 to 1.29.65, nothing else |
| Every break still fails its tests | `bash ai/plans/35-housekeeping/scripts/breaks-a11y.sh` | **19 of 19 caught, `ALL AS EXPECTED: 1`** |
| The whole suite | `npx jest --coverage` | **177 suites, 4778 tests, 100% on statements, branches, functions and lines** |
| Types and lint | `npx tsc --noEmit`, `npx biome check . --error-on-warnings` | Both exit 0 |
| No visual change | Diffed every `+` line in `components/` and `app/` against colour, margin, padding, width, height, font size, opacity, radius, background and z-index | **None.** The only style lines in the diff are unchanged props reformatted by adding an accessibility prop beside them |
| No prayer time copied, averaged or invented | The diff touches no prayer maths; `SCHEDULE_CANDIDATE_DAYS` changes how far the walk SCANS, never a time | Clean |
| The request budget is untouched | 216-scenario sweep at `+1` and `+2` | Both arm at most 64; worst-case reminder user 63 with an identical row set |
| No release file, no `uat`, no EAS, no API key, no ignore comment, no skipped hook | Read the diff; every commit ran its pre-commit hook | Clean |
| The records match what happened | Reread `FINDINGS.md`, the queue row, `ai/prompts/README.md` and `AUDIT-FINDINGS.md` against the measurements | Accurate |

## The finding, and its fix

**`Modal.tsx` re-subscribed its back handler on every render.** The effect listed `onRequestClose`
in its dependency array, and all three callers define the handler inline in `app/index.tsx`, so the
identity changed each render and the subscription was torn down and rebuilt. Measured with a probe:
**11 subscribe cycles across 11 renders**.

Impact was low rather than nil: `app/index.tsx` subscribes only to booleans and state flags, with no
per-second ticker, so it re-renders rarely. Fixed anyway, because `ai/AGENTS.md` Rule 5 is explicit
about render-granular work and `Sheet.tsx` already avoids exactly this by calling through a ref.
After the fix, **1 subscription across the same 11 renders**.

The behaviour the dependency guarded is kept: a modal given no handler returns `false`, so the press
still reaches the app rather than being swallowed. That is now its own break (19th), and the two
Modal substitutions were re-pointed at the new shape. Shipped as 1.29.65.

## Two things worth recording about the tests themselves

**A guard split across an iOS prop and an Android prop survives either break alone.** The invisible
Reset is hidden by `accessibilityElementsHidden` (iOS) and `importantForAccessibility` (Android).
React Native Testing Library honours either, so breaking one printed `SURVIVED` against a test that
genuinely works. Measured each way before believing it; the break now removes both, and the code
comment says why both exist.

**One change was reverted during execution because the tests caught it**, which is the suite doing its
job rather than a defect: making `LabeledToggle`'s row the switch broke 7 tests encoding a real
distinction, that pressing the label toggles with no haptic while pressing the switch toggles with a
medium one.

## What was NOT done, with the reason

- **No device build.** The session ran from 02:00 to 04:00 and `EXECUTOR-BRIEF.md` forbids starting a
  build after 23:45, because a nightly job clears build folders at 00:00. The back press was instead
  verified two ways that do not need one: React Native's own Android source for the dispatch path,
  and the **APK actually installed on the 3T**, which reads
  `android:enableOnBackInvokedCallback(0x0101066c)=false`, so the app opts out of predictive back and
  `BackHandler` fires. The 3T's channel count was read live from `dumpsys notification`.
- **Edge-to-edge shipped nothing**, by design: SDK 58 removed the built-in the row wanted, and the
  library still supplies the theme parent, the contrast attribute and `SystemBars`. Cancelled rather
  than blocked, and recorded as such.
