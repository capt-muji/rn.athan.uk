# Step 3: The alignment state machine, with hysteresis

0. **Anchor check.** None: this step adds one new file and its suite.

1. **Goal.** Decide, from one heading reading at a time, whether the phone has **just** come onto the qibla, so
   the screen can tap the user's hand once and never buzz.

2. **Branch.** `git checkout -b feat/43-alignment uat-2`

3. **Files.**
   - `shared/qiblaAlignment.ts` (new)
   - `shared/__tests__/qiblaAlignment.test.ts` (new)
   - `components/sheets/screens/Qibla.tsx` is NOT touched here. **`unusedExports.test.ts` will therefore fail
     on the new exports.** See part 4's note: this step is merged together with step 4, or the export test
     fails. Read the sequencing note below before starting.

**SEQUENCING, and it is the one trap in this plan.** `shared/__tests__/unusedExports.test.ts` fails when an
exported symbol no production file imports. Steps 2 and 3 add modules whose only consumer is step 4's screen.
So **steps 2, 3 and 4 are built in that order and committed as three commits on ONE branch**, and the branch
merges once. Each commit is still version-bumped and reviewed. The pre-commit hook runs the full suite on every
commit, so **commits for steps 2 and 3 will fail the hook on `unusedExports`**.

**The resolution, decided by the planner so the executor never has to:** build steps 2, 3 and 4 on the single
branch `feat/43-the-screen`, and make **one commit** covering all three at the end of step 4. The three steps
keep their own red-green cycles and their own break scripts; only the commit is shared. Step 4's part 9 carries
the one commit message.

4. **Tests first (red).**

Suite: `shared/__tests__/qiblaAlignment.test.ts`, new.

A helper `countTaps(headings: number[], qibla = QIBLA): number` feeds each heading through `stepAlignment`,
carrying the state, and counts the readings where `hasCrossed` is true. A helper
`sweep(from: number, to: number, by: number): number[]` builds a list of headings, normalised into `[0, 360)`.
`QIBLA` is `118.876`, the owner's own qibla.

| Test name | What it proves | Inputs | Asserts |
| --- | --- | --- | --- |
| `taps once when the phone turns slowly onto the line` | The ordinary case | `sweep(100, 140, 2)` | `toBe(1)` |
| `taps again when the phone turns past and comes back` | The owner's stated case | `sweep(100,140,2)` then `sweep(138,100,-2)` | `toBe(2)` |
| `taps once and then stays silent while the phone holds still on the line` | No continuous buzz | 50 samples of `QIBLA + sin(i)*1.5` | `toBe(1)` |
| `never taps while the phone holds still away from the line` | Silence when off | 50 samples of `QIBLA + 60 + sin(i)*1.5` | `toBe(0)` |
| `never taps at the bearing directly away from the qibla` | **The antipode defect** | 50 samples of `QIBLA + 180 + sin(i)*1.5` | `toBe(0)` |
| `taps once per revolution when the phone spins faster than it samples` | A crossing between samples still counts | `sweep(0, 690, 30)` | `toBe(2)` |
| `taps once, not repeatedly, when the reading jitters across the entry edge` | **The chatter defect** | 100 samples of `QIBLA + ENTER_DEGREES + (i%2 ? 0.3 : -0.3)` | `toBe(1)` |
| `never taps when the reading jitters outside the entry edge without reaching it` | The far side of the gap is silent | 100 samples of `QIBLA + LEAVE_DEGREES + (i%2 ? 0.3 : -0.3)` | `toBe(0)` |
| `taps once when the line sits just clockwise of north` | Wrapping at 0/360 | `sweep(350, 370, 2)`, qibla `2` | `toBe(1)` |
| `taps once when the line sits just anticlockwise of north` | Wrapping the other way | `sweep(10, -10, -2)`, qibla `358` | `toBe(1)` |
| `taps once over one full slow revolution` | Exactly one line exists in a circle | `sweep(0, 359, 1)` | `toBe(1)` |
| `never taps on a sign change where only one of the two readings is near the line` | The crossing bound needs BOTH readings near | `[QIBLA + 100, QIBLA - 10]` | `toBe(0)` |
| `taps when the phone turns clean through the line without ever sampling inside it` | **The crossing branch, genuinely** | `sweep(0, 700, 35)` | first assert **every** heading is further than `ENTER_DEGREES` from the line, then `countTaps` `toBe(2)` |
| `measures the turn the short way round the circle, not the long way` | **Wrapping at north** | see below | three asserts, below |

**The last three rows exist because the break script caught this plan's own tests being too weak, and each one
cost a diagnosis.** Do not simplify them.

- **Row 12** covers a branch the spike left at 92.3%, which fails the 100% gate.
- **Row 13 asserts its own premise first.** The obvious spin test, `sweep(0, 690, 30)`, happens to land 1.12
  degrees from the line, so it never exercises the crossing branch at all and the break "sign change no longer
  detected" SURVIVED against it. A 35-degree step never lands inside the window. The premise assertion is what
  stops a later edit quietly returning it to a test of nothing.
- **Row 14 needs all three asserts.** `Math.abs(shortestDelta(358, 2))` is `toBeCloseTo(4, 9)`;
  `countTaps([358, 2], 2)` is `1`; `countTaps([180, 181], 2)` is `0`; and
  `countTaps([340, 350, 358], 2)` is `1`. **That last one is the only assert that catches an unwrapped
  subtraction**, because an unwrapped difference reads 357 there and can never enter the window, while at the
  line itself the raw difference still reaches zero and hides the defect. Carry its comment.

Command:

```bash
npx jest shared/__tests__/qiblaAlignment.test.ts --watchman=false --selectProjects=unit
```

**Before the change** every row fails with:

```
Cannot find module '@/shared/qiblaAlignment' from 'shared/__tests__/qiblaAlignment.test.ts'
```

5. **Change.** This step is **(specified)**.

Create `shared/qiblaAlignment.ts`.

**Constants, exported, with these exact names and values:**

| Name | Value | Why, for its comment |
| --- | --- | --- |
| `ENTER_DEGREES` | `4` | Inside this the phone counts as aligned |
| `LEAVE_DEGREES` | `8` | Alignment is only given up past this. The gap stops a shaking hand buzzing: a single threshold measured 49 taps in 100 samples of 0.3-degree jitter |
| `CROSSING_LIMIT_DEGREES` | `90` | The signed offset flips sign at the qibla AND at the bearing directly away from it, so an unbounded crossing test taps when the user faces away from Makkah |

**Types, exported:**

```ts
export interface AlignmentState {
  isAligned: boolean;
  previousOffset: number | null;
}

export interface AlignmentStep {
  state: AlignmentState;
  hasCrossed: boolean;
}
```

**`initialAlignment`**

| Field | Value |
| --- | --- |
| Signature | `() => AlignmentState` |
| Answers | `{ isAligned: false, previousOffset: null }` |
| Never does | Read a clock, a sensor or storage |

**`stepAlignment`**

| Field | Value |
| --- | --- |
| Signature | `(state: AlignmentState, heading: number, qibla: number) => AlignmentStep` |
| Answers | The state after this reading, and `hasCrossed` true on exactly the reading that arrives on the line |
| Never does | Mutate `state`, return `hasCrossed` true twice for one arrival, or fire at the antipode |
| Throws | Nothing |
| Logs | Nothing |

It carries the `'worklet'` directive as its first statement, because step 4 calls it from a Reanimated reaction
on the UI thread.

The rule, in order:
1. `offset` is `shortestDelta(heading, qibla)` and `distance` is its absolute value.
2. Not aligned and `distance <= ENTER_DEGREES`: become aligned, `hasCrossed` true.
3. Aligned and `distance > LEAVE_DEGREES`: stop being aligned, `hasCrossed` false.
4. Otherwise `hasCrossed` is true only when all four hold: not aligned, `previousOffset` is not null, the sign
   of `offset` differs from the sign of `previousOffset`, and BOTH `distance` and `|previousOffset|` are under
   `CROSSING_LIMIT_DEGREES`.
5. Every return carries `previousOffset: offset`.

6. **Green.** `Tests: 12 passed, 12 total`. Coverage of `shared/qiblaAlignment.ts` is 100% on all four
   measures. `npx tsc --noEmit` and `npx biome check . --error-on-warnings` exit 0.

**Proven in the planning session's scratch worktree:** 12 tests, 100% statements, branches, functions and
lines.

7. **Breaks.** `bash ai/plans/43-qibla-haptic/scripts/breaks-3.sh`, ending `ALL AS EXPECTED: 1`.

8. **Records.** None.

9. **Commit.** None of its own: see the sequencing note in part 3. Step 4 carries the commit.

10. **Stopping part-way.** Delete `shared/qiblaAlignment.ts` and `shared/__tests__/qiblaAlignment.test.ts`.
