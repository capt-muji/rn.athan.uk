# Step 1: The settling arithmetic, as a pure module

0. **Anchor check:** none. This step adds two new files and changes nothing existing, so there is nothing to
   anchor against. Run the section 3 pre-flight with `1` and confirm `PREFLIGHT OK`.

1. **Goal:** add `shared/qiblaSettle.ts`, which answers whether a heading stream has converged.

2. **Branch:** `git checkout -b feat/48-1-settle-arithmetic uat-2`

3. **Files:**
   - `shared/qiblaSettle.ts` (new)
   - `shared/__tests__/qiblaSettle.test.ts` (new)
   - `app.json`, `package.json` (version)
   - `ai/plans/README.md`, and this folder's `PLAN.md` and `LOG.md`, if this session changed them

   Nothing else may change.

4. **Tests first (red).**

   Suite: `shared/__tests__/qiblaSettle.test.ts`, NEW. Jest project `unit`.

   This step is `(specified)`, and the test file is **carried verbatim** at
   `ai/plans/48-qibla-heading-accuracy/working-code/shared___tests___qiblaSettle.test.ts.txt`. Copy it to
   `shared/__tests__/qiblaSettle.test.ts` and change nothing in it. It was built and run in a scratch
   worktree at `ad131a51` and reported 16 passing tests against the module this step specifies.

   The 16 tests, one row each:

   | Test | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | `circularMean` averages headings either side of north | A plain mean gives south across the wrap | `[359, 1]` | `toBeCloseTo(0, 5)` |
   | `circularMean` averages a spread inside one quadrant | The mean is right away from the wrap too | `[110, 120, 130]` | `toBeCloseTo(120, 5)` |
   | `headingDelta` five cases, by `it.each` | The short way round, signed | `(10,350)`, `(350,10)`, `(118,118)`, `(180,0)`, `(0,180)` | `20`, `-20`, `0`, `180`, `180` |
   | `trailingWindow` drops the old and keeps the edge | The boundary is inclusive | Samples at 0, 1000, 4000ms, read at 4000 | Only the 1000 and 4000 samples |
   | `hasSettled` refuses one reading under the minimum | The count gate fires | 7 steady samples spanning the window | `false` |
   | `hasSettled` accepts exactly the minimum | The count gate is inclusive | 8 steady samples spanning the window | `true` |
   | **`hasSettled` refuses a window that does not SPAN** | **The load-bearing line.** Enough readings in 400ms is not a settled 3000ms window | 12 steady samples spanning 400ms | `false` |
   | `hasSettled` accepts a window spanning nine tenths | The stated tolerance | 8 samples spanning `3000 * 0.9` | `true` |
   | `hasSettled` refuses a stream still converging | Drift, not spread, is the test | 12 samples decaying from 30 degrees of error across the window | `false` |
   | `hasSettled` accepts halves differing by exactly the threshold | The drift gate is inclusive | 4 at 118, 4 at `118 + 1.5` | `true` |
   | `hasSettled` refuses halves differing by just over | The gate's other side | 4 at 118, 4 at `118 + 1.7` | `false` |
   | `hasSettled` settles across north | Each half's mean must be circular too | Alternating 359.5 and 0.5 | `true` |

   Command, path first:

   ```
   npx jest shared/__tests__/qiblaSettle.test.ts --watchman=false --selectProjects=unit
   ```

   **Before the change**, every test fails at import, because the module does not exist:

   ```
   Cannot find module '../qiblaSettle' from 'shared/__tests__/qiblaSettle.test.ts'
   ```

   If any test passes, or any other suite fails, STOP.

   **No existing test changes in this step**, and none may: this step adds a module nothing imports yet.

5. **Change.** Create `shared/qiblaSettle.ts`. Its contract, which the carried test file is written against:

   **Constants**, each exported:

   | Name | Type | Value | What it means |
   | --- | --- | --- | --- |
   | `SETTLE_WINDOW_MS` | `number` | `3000` | The trailing period the gate judges |
   | `SETTLE_MIN_READINGS` | `number` | `8` | Below this the window is too sparse to mean anything |
   | `SETTLE_DRIFT_DEGREES` | `number` | `1.5` | The two halves must agree within this |

   **Exported interface:**

   ```ts
   export interface HeadingSample {
     degrees: number;
     atMs: number;
   }
   ```

   **Exported functions:**

   | Name | Signature | What it answers | What it must never do |
   | --- | --- | --- | --- |
   | `circularMean` | `(degrees: number[]) => number` | The mean direction, in `[0, 360)` | Never average arithmetically: `[359, 1]` must give 0, not 180 |
   | `headingDelta` | `(to: number, from: number) => number` | The signed turn, the short way, in `(-180, 180]` | Never return a value outside that range |
   | `trailingWindow` | `(samples: HeadingSample[], nowMs: number) => HeadingSample[]` | The samples of the last `SETTLE_WINDOW_MS`, oldest first | Never drop a sample exactly on the boundary |
   | `hasSettled` | `(window: HeadingSample[], nowMs: number) => boolean` | Whether the stream has converged | Never return true for a window that does not span at least `SETTLE_WINDOW_MS * 0.9` |

   `hasSettled` applies three gates in order, and all three must pass:

   1. `window.length >= SETTLE_MIN_READINGS`;
   2. `nowMs - window[0].atMs >= SETTLE_WINDOW_MS * 0.9`;
   3. the circular mean of the newer half is within `SETTLE_DRIFT_DEGREES` of the older half's, by absolute
      `headingDelta`, where the split is `Math.floor(window.length / 2)` and the older half is
      `slice(0, half)`.

   **No log lines.** This module is pure arithmetic and writes nothing.

   The finished module is carried verbatim at
   `ai/plans/48-qibla-heading-accuracy/working-code/shared_qiblaSettle.ts.txt`, built and proven at
   `ad131a51`. Copy it to `shared/qiblaSettle.ts`.

   Comments explain why, never what, and extremely compactly.

6. **Green.** The same command. Expected:

   ```
   Tests:       16 passed, 16 total
   ```

   Then `npx tsc --noEmit` and `npx biome check . --error-on-warnings`, both exit 0.

7. **Breaks.** Save `ai/plans/48-qibla-heading-accuracy/scripts/breaks-step2.sh` and run it with `bash` from
   the repository root. It applies ten substitutions, one per decision the module makes, and restores the
   file after each.

   | Break | Expected |
   | --- | --- |
   | The span check is removed | caught |
   | The minimum-readings check is removed | caught |
   | Drift compared without the absolute | caught |
   | The drift comparison flips to strictly-less | caught |
   | The halves compared older against older | caught |
   | The circular mean becomes an arithmetic mean | caught |
   | `headingDelta` drops its positive wrap | caught |
   | `headingDelta` wraps at the wrong boundary | caught |
   | The trailing window keeps everything | caught |
   | The trailing window excludes its edge | caught |

   It ends:

   ```
   caught 10 of 10
   ALL AS EXPECTED: 1
   ```

   Measured at `ad131a51` in a scratch worktree. If any break prints `SURVIVED` or `BREAK NOT APPLIED`, STOP.

   Afterwards `git status --porcelain` must list only this step's files and the three plan files.

8. **Version and commit.**

   ```
   node -e "const p=require('./package.json');const [a,b,c]=p.version.split('.').map(Number);console.log(\`\${a}.\${b}.\${c+1}\`)"
   ```

   Set that version in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). The gradle
   file is gitignored, so it is never added, but `versionLockstep.test.ts` fails if it differs.

   Add by name: `shared/qiblaSettle.ts`, `shared/__tests__/qiblaSettle.test.ts`, `app.json`, `package.json`,
   and the three plan files if changed. Never `git add .`.

   Message to `$TMPDIR/msg-48-1.txt`, with `<VERSION>` replaced:

   ```
   <VERSION> - feat(qibla): the arithmetic that says whether a heading has settled

   `shared/qiblaSettle.ts`, pure and unused until step 2.

   The gate tests DRIFT between the two halves of a trailing window, never spread, because a stream
   still converging is quiet between consecutive readings: measured, a spread gate passes such a
   stream at 27.22 degrees of error. Smoothness is not correctness.

   The window is counted in TIME and must be SPANNED rather than merely filled. Counting readings
   alone needs 120 seconds to open on a still phone, because `expo-location` suppresses anything
   within 2 degrees of the last reading on both platforms and a converged stream emits almost
   nothing. And without the span check a fast stream fills the count in 400ms, which measured 29.18
   degrees of error at the gate rather than 9.70.

   16 tests, 10 of 10 breaks caught. Every number was swept rather than chosen: the table is in
   `ai/plans/48-qibla-heading-accuracy/MEASURED.md` section 6.
   ```

   Commit with `git commit -F $TMPDIR/msg-48-1.txt` in the background. In the log the last `Tests:` line ends
   `passed, <n> total`, and four `100%` coverage lines are present.

9. **Review.** Read `git show <sha>` back cold, against this checklist:

   - [ ] `shared/qiblaSettle.ts` exports exactly the three constants, one interface and four functions the
         contract names, with those signatures.
   - [ ] `hasSettled` applies all three gates, and the span gate uses `SETTLE_WINDOW_MS * 0.9`.
   - [ ] `circularMean` is genuinely circular: no `reduce` sum divided by length.
   - [ ] `headingDelta` wraps on both sides, `> 180` and `<= -180`.
   - [ ] `trailingWindow`'s boundary is inclusive (`<=`).
   - [ ] The test file is byte-identical to the carried copy.
   - [ ] Every comment explains WHY and is one line where one line does. No comment explains what or how.
   - [ ] No `Platform` check anywhere: this module is platform-agnostic.
   - [ ] No constant beyond the three named, and none of them adjusts a heading.
   - [ ] Nothing outside the step's file list changed.

   A clean read: two new files, three exported constants, four exported functions, no production file
   importing it yet. A finding is handled by `EXECUTOR-BRIEF.md` section 4, item 8.

10. **Merge.**

    ```
    git checkout uat-2 && git merge --no-ff feat/48-1-settle-arithmetic -m "Merge feat/48-1-settle-arithmetic into uat-2: session 48 step 1, reviewed"
    ```

11. **Done when:**

    ```
    npx jest shared/__tests__/qiblaSettle.test.ts --watchman=false --selectProjects=unit
    ```
    prints `Tests:       16 passed, 16 total`;

    ```
    npx tsc --noEmit && npx biome check . --error-on-warnings
    ```
    both exit 0;

    ```
    bash ai/plans/48-qibla-heading-accuracy/scripts/breaks-step2.sh
    ```
    ends `ALL AS EXPECTED: 1`.
