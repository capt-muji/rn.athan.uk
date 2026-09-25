# Execution log: Session 24

## Planning, execution and audit ran in ONE session (owner instruction, 2026-09-25)

The owner asked for all three phases in the same session and, separately and repeatedly, for **no subagents at all**.
Both instructions override the `athan-next` skill's one-phase-per-subagent shape and `EXECUTOR-BRIEF.md` section 4,
item 8's `Code Reviewer` subagent. What that changed, recorded here because an audit reads this file:

- The plan was rewritten from a design brief into a TEMPLATE.md plan by this session, and then executed by it.
- **Step 1's review was done by this session against the plan's own eleven checks**, not by a `Code Reviewer`
  subagent. Its evidence is under "Step 1 review" below: every check was run as a command, and check 7 was proven
  mechanically with a statement-level diff rather than by reading.
- The rescope from four kinds to two came from the owner mid-planning, so the plan and the queue row were rewritten
  before any code was written.

## The plan was not executable when this session found it

Row 23 read READY, but `PLAN.md` was a design brief: no header table, no pre-flight, no step structure, no anchors, no
break script, no commit message, no review prompt, no acceptance criteria. An executor could not have run it without
deciding what to build, which is the defect `PLANNER-BRIEF.md` exists to prevent. So this session did the planning
phase first, at `273abe96`, and committed it as `2572df32` (1.28.12).

### Owner decisions taken while planning (all recorded in `ai/prompts/README.md`)

1. **Two kinds, not four.** One style per schedule: `ExtrasLockWidget4` is the one-column extras face,
   `PrayerLockWidget5` the two-column standard face.
2. **Row tiers:** active solid white and bold, passed at 60%, upcoming at 35%.
3. **Row sizes:** 11pt in the one-column face, 14pt in the two-column face.
4. **No `try`/`catch` in any lock layout**, including the three that already shipped one.
5. **No `accessoryInline` branch** on the new kinds.
6. **A day with no active row lists its rows and marks none.**

### What the scratch worktree taught, and what it changed in the plan

Spiked in `~/athan-device-sweep/worktrees/plan-24` (removed afterwards), and the code thrown away:

| Finding | Effect on the plan |
| --- | --- |
| The `activeIndex` `: -1` default went uncovered with numeric-only fixtures, landing branches at 99.89% against a 100% gate | The held-day test runs over both `-1` and `undefined`, and the acceptance criteria name the coverage lines |
| Removing the `catch` broke exactly three tests in `widgetLockRenderer.test.ts`, each reaching it through a throwing getter | Part 4 names all three by anchor |
| A JSX text array reads as `""` through a string-only helper, so the fallback assertion failed | The suite's `styledTexts` joins array children, specified in part 4 |
| Rewriting `app.json` with a JSON serialiser reflows the file until Biome rejects it | Part 5e says hand-edit in place |

Verified pre-flight at `273abe96`: all thirteen anchors counted 1, `PREFLIGHT OK`.

## Step 1: The two day-list Lock Screen faces

- **Branch:** `feat/24-lock-widget-day-list`
- **Commit:** `bd5610da`, version **1.28.13**
- **Merge:** `21560164`

**Red, before the change:** all 16 tests of the new suite failed with
`TypeError: layouts.ExtrasLockWidget4 is not a function`, which is the failure the plan predicted.

**Green:** `widgetLockListRenderer` 16 passed, `widgetLockRenderer` 28 passed, `widgetContract` 10 passed.
`npx tsc --noEmit` exited 0. `npx biome check . --error-on-warnings` initially failed on
`widgets/LockPrayerWidget.tsx` formatting, exactly as the plan's section 10 predicted: the dedent left three
`Out of date` elements fitting on one line. `npx biome check --write` on that file fixed it, then both exited 0.

**Hook, from the commit log:**

```
Statements   : 100% ( 4277/4277 )
Branches     : 100% ( 1924/1924 )
Functions    : 100% ( 866/866 )
Lines        : 100% ( 3868/3868 )
Tests:       4677 passed, 4677 total
```

**Break script:** `CAUGHT: 6 of 6`, then `ALL AS EXPECTED: 1`. Re-run after the merge: same.

### Step 1 review (by this session, no subagent, per the owner's instruction)

| Plan check | Evidence |
| --- | --- |
| 1. Self-contained, props alone, no module scope, no family read | Both signatures are `(props: PrayerWidgetProps)`; 0 occurrences of `environment` or `widgetFamily` in either body; `widgetContract.test.ts`'s AST guard passes, which is what proves the no-module-scope rule |
| 2. Every row a name and a time at one `ROW_SIZE`, time monospaced | 2 `const ROW_SIZE` declarations, 4 `font({ size: ROW_SIZE` uses (a name and a time per layout), 2 `monospacedDigit()` |
| 3. Active solid and bold, passed 60%, upcoming 35% | Pinned by "marks only the active row on %s"; breaks 1 and 2 both caught |
| 4. `-1` or absent lists and marks none | Pinned by the held-day test over both values; break 3 caught |
| 5. `Math.ceil`, first half left, tier from the whole day | `Math.ceil(rows.length / 2)` at line 650, `index={from + offset}` at line 687; break 4 caught |
| 6. No `timerInterval`, no `try`/`catch`, no date maths | 0 occurrences each of `timerInterval`, `catch`, `new Date`, `getTime`, `Date.parse` in the new bodies |
| 7. The existing three changed no rendered output | Proven mechanically, not by eye: a statement-level diff of the old file against the new one with the two new layouts excised, comments and brace-only lines stripped, reports 14 differences, all of them the `Spacer` import and three `Out of date` elements Biome joined onto one line. Zero behavioural statements differ |
| 8. Builder untouched | `shared/widgetTimeline.ts` and `shared/sequence.ts` are absent from the commit's file list |
| 9. Registered in all four places | 8 `createWidget` exports; 2 `app.json` entries, each `["accessoryRectangular"]` with `android: null`; 2 `updateTimeline` calls; 2 mock kinds |
| 10. Comments explain why, and carry no date or owner rule | No comment in the new code matches `20\d\d` or `owner` |
| 11. Nothing beyond the file list changed | `git show --stat` lists exactly the nine files the plan names |

**Verdict: merge.** One round.

**An independent check the plan did not ask for.** The `activeIndex: -1` state is the premise of two of the new tests,
so it was confirmed against the real builder rather than against my own fixture: the existing
`widgetTimeline.test.ts` test "keeps the list before after its Isha until 00:00, then holds a day with no readable row
until its own 00:00" passes and asserts `activeIndex: -1` beside a full six-row `prayers` array. The state the layouts
render is one the builder genuinely emits.

**Codegraph blast radius,** read before committing: each new layout has exactly one caller (its own `createWidget`),
and the lock kinds' dependants are five store suites. All five were run green before the commit
(`widgetPlatform`, `widgetAndroid`, `widgetIo`, `widgetSettingsSync`, `widgetFlagOff`: 31 passed).

## Device proof: NOT RUN, and why

Section 7 needs a Release build on the iPhone XS and then the owner's eyes on the Lock Screen. Neither can be done from
here: the build needs the owner's machine state and the verdict is visual, on three questions no test can answer
(whether 11pt reads at six rows, whether a half holds `Last Third 02:41`, whether three tiers separate on glass in
vibrant monochrome). **Touch automation is not available on a physical iPhone** (`ai/AGENTS.md`), and the owner receives
no screenshots.

So the row is EXECUTED, not DONE, which is what the plan's section 9 says: "the row stays EXECUTED until they have
looked." The audit below does not push past that.
