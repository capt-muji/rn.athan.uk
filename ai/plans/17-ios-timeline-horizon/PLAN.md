# Plan: Session 17. The widget horizon grows from 14 days to 30

| Field | Value |
| --- | --- |
| Brief | `ai/plans/SDK58-PROGRAMME.md` §17 |
| Planned at | `53d9baba` (version 1.27.351), 2026-09-24 |
| Planned by | Planning session on 2026-09-24 |
| Needs first | nothing (row 6 is DONE) |
| Steps | 2, each one branch, one commit, one version |
| Device | None. See section 7 |
| Owner decisions still needed | None (see section 2) |

## 1. Goal

The widget stops being correct 14 days after the app was last opened. The owner wants that number to grow until a
user never has to open the app:

🐋  "I don't want the user to have to open the app at all... maybe we can make it 1 year" (owner, 2026-09-18, while
planning session 15, recorded in `ai/plans/SDK58-PROGRAMME.md` §17).

The brief asks for the feasibility answer FIRST: 🐋  "if we can even do it". **This planning session answered it by
measurement, and the answer is in section 5.** 30 days is safe and this plan does it. A year is not, and section 5
records the numbers that rule it out, so no later session has to re-derive them.

When this plan is DONE, one constant reads 30, both platforms carry a 30-day window, and the test suites pin the new
volume. The owner would notice by leaving the app closed for three weeks: the widget still shows the right prayer.

The owner's rules that apply:

🐋  "visuals are settled, so no pixel changes without the owner's approval" (`PLANNER-BRIEF.md` section 6). This
session changes one number and the tests around it. No layout file is touched.

🐋  "never copy, average or synthesise a prayer time" (`PLANNER-BRIEF.md` section 6). The horizon only decides how
many stored days are read. A day that is not stored stays unreadable and renders as dashes, which is
`createPrayersForSingleDay`'s existing behaviour and finding 70's rule. Nothing is invented to fill the longer window.

## 2. Decisions

### 2.1 Taken

1. **30 days, not a year.** Decided by this planning session from its own measurements (section 5), which is what the
   brief asked for: the owner set the ambition ("maybe we can make it 1 year") and asked for feasibility first. 30
   days costs 185 iOS entries and 78 KB. A year costs 2195 entries and 929 KB, which is 4.6 times the payload guard
   and an entry count in the band that blacked out every widget in session 16a. The owner's ambition is met as far as
   the platform allows, and section 5 records exactly where the ceiling is.
2. **One constant moves; the builders are untouched.** `TIMELINE_DAYS` feeds both platforms through `buildSequence`.
   The iOS builder already emits one entry per boundary and the Android builder already carries one day per day, so
   both scale linearly with no change. Rejected: a separate constant per platform, which would add a second number to
   keep in step for no measured benefit at 30 days.
3. **No slim far-future entry shape.** §17 floats dropping the day list from distant entries. It is not needed at 30
   days (78 KB against a 200 KB guard) and it would make two entry shapes where there is one. Rejected as unnecessary
   complexity, and recorded in section 5 as the lever a future session would pull first if the horizon grows again.
4. **The December year-boundary gap is accepted, not fixed here.** From early December a 30-day window reaches into
   next year, which is only fetched once `isDecember()` is true and the December sync runs. Those days render as dash
   rows, which is the app's designed behaviour for a day it does not hold, and the stale card still ends the timeline
   at the last readable prayer. Widening the fetch window is a sync change, out of this session's scope. Section 5
   records it, and step 2's test pins that a partially stored window degrades rather than breaks.

### 2.2 The executor must not decide

The executor STOPs and asks the owner when any of these happens.

1. **Any anchor count other than 1.** Ask: "Anchor `<file>` counts `<n>`, not 1. The plan is stale. Should I set the
   row to NEEDS REPLAN?"
2. **A test fails that this plan does not expect.** Ask: "Test `<name>` failed and the plan does not predict it. The
   failure line is `<line>`. What should it be?"
3. **A break prints `BREAK NOT APPLIED`.** Ask: "Break `<label>` changed nothing, so the substitution does not match
   the code. Should I stop for a replan?"
4. **A measured entry count or payload differs from section 5's table by more than 10 percent.** Ask, quoting both
   numbers: the budget argument is the whole basis of this plan, so a drift means the ground moved.
5. **Anything the step does not answer.** Ask: "The plan does not say `<X>`. What should it be?"
6. **Anything touching visuals, prayer times, `releases.json`, `uat` or EAS.** Ask before touching it.

## 3. Pre-flight

Save to `$TMPDIR/preflight-17.sh` and run `bash $TMPDIR/preflight-17.sh <k>`, where `<k>` is the first step in
section 6's checklist not ticked DONE (1 for a new plan).

```bash
#!/usr/bin/env bash
set -u
STEP="${1:-1}"
REPO=/Users/muji/repos/rn.athan.uk
cd "$REPO" || { echo "FAIL: not $REPO"; exit 1; }

BRANCH=$(git branch --show-current)
[ "$BRANCH" = "uat-2" ] || { echo "FAIL: on $BRANCH, expected uat-2"; exit 1; }

DIRTY=$(git status --porcelain | grep -v -e 'ai/plans/README.md' \
  -e 'ai/plans/17-ios-timeline-horizon/PLAN.md' \
  -e 'ai/plans/17-ios-timeline-horizon/LOG.md')
[ -z "$DIRTY" ] || { echo "FAIL: unexpected changes:"; echo "$DIRTY"; exit 1; }

git fetch -q origin uat-2
git merge-base --is-ancestor origin/uat-2 uat-2 || { echo "FAIL: uat-2 is behind origin/uat-2"; exit 1; }

echo "version: $(node -p "require('./package.json').version") (planned at 1.27.351, must not be lower)"

A=ai/plans/17-ios-timeline-horizon/scripts/anchors
count() {
  local n
  n=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$A/$1.txt" "$2")
  echo "anchor $1: $n"
  [ "$n" = "1" ] || { echo "FAIL: anchor $1 counted $n, expected 1 -> NEEDS REPLAN"; exit 1; }
}
count 1-1 stores/widget.ts
count 1-2 shared/__tests__/widgetTimeline.test.ts

echo "PREFLIGHT OK"
```

Expected tail: the version prints `1.27.351` or higher, each anchor prints `1`, and the last line is `PREFLIGHT OK`.
An anchor count other than 1 means NEEDS REPLAN. Any other failure means STOP.

No device check: section 7 explains why this session needs none.

## 4. Background the executor needs

### Code map

| File | What it does |
| --- | --- |
| `stores/widget.ts` | Holds `TIMELINE_DAYS = 14` (line 82). `buildSequence` (line 120) calls `createPrayerSequence(schedule, startDate, TIMELINE_DAYS + 1)`, and BOTH push paths use it: the iOS timeline push at line 187 and the Android snapshot push at line 358. One constant, two platforms. |
| `shared/widgetTimeline.ts` | `buildPrayerWidgetTimeline` emits one entry per boundary plus a terminal stale entry; `buildPrayerWidgetSnapshot` emits one day per day. Neither is changed: both already scale with whatever sequence they are given. |
| `shared/prayer.ts` | `createPrayerSequence` walks `dayCount` days, and a day that is not stored is listed with every row unreadable rather than skipped (finding 70). This is what makes a longer window safe when the cache is short. |
| `shared/__tests__/widgetTimeline.test.ts` | Its `volume and payload invariants` block pins entry count and payload at a 16-day span. Step 2 moves that span. |
| `shared/__tests__/widgetSimulation.test.ts` | Second-by-second virtual-week simulation over its own 16-day fixture. It is NOT changed: it proves correctness over time, not volume, and its span is its own fixture. |

Anchors, each saved in full under `scripts/anchors/` and each counting exactly 1 at `53d9baba`:

| Anchor | File | Line hint | What it locates |
| --- | --- | --- | --- |
| `1-1.txt` | `stores/widget.ts` | 79 | The `TIMELINE_DAYS` doc comment and the constant |
| `1-2.txt` | `shared/__tests__/widgetTimeline.test.ts` | 668 | The volume block's heading and its `SPAN_DAYS` |

### What the horizon actually costs

Measured by the planning session against the real builders (section 5 says how). The iOS column is what matters:
WidgetKit archives a rendered view per entry.

| Span | iOS entries | iOS payload | Android snapshot |
| --- | --- | --- | --- |
| 16 days (today) | 95 | 40.0 KB | 6.4 KB |
| **31 days (this plan)** | **185** | **78.1 KB** | **12.3 KB** |
| 61 days | 365 | 154.3 KB | 24.2 KB |
| 91 days | 545 | 230.5 KB | 36.1 KB |
| 366 days | 2195 | 929.1 KB | 145.1 KB |

The payload guard is 200 KB, so payload alone caps the horizon near 80 days. The entry budget caps it sooner: session
16a measured ~380 entries blacking out every non-trivial kind, and that is the failure that masquerades as "Please
adopt containerBackground API" (`ai/AGENTS.md`).

### Existing tests

| File | What it proves | This session |
| --- | --- | --- |
| `shared/__tests__/widgetTimeline.test.ts`, `volume and payload invariants` | Entry count is bounded by the prayers still ahead, and payload stays under 200 KB, at a 16-day span | Its span moves to 31; both bounds must still hold |
| `shared/__tests__/widgetSimulation.test.ts` | The timeline is correct second by second across DST | Unchanged, must keep passing |
| `shared/__tests__/widgetRenderer.test.ts` | The layouts render what the props carry | Unchanged, must keep passing |

At `53d9baba`, the three suites together report `Tests: 163 passed, 163 total`.

## 5. Design

**The invariant, as one sentence a test can check:** the widget timeline covers 30 days ahead, and its entry count
and payload stay inside the budgets that keep WidgetKit rendering.

### What the feasibility measurement found

The brief's question was whether 30 days is possible at all. The planning session answered it by building real
timelines from the real builders at seven spans, with a throwaway test deleted afterwards, and reading the entry
count and `JSON.stringify` length of each. The table in section 4 is that measurement.

Three things it settled:

1. **30 days is comfortable.** 185 entries and 78 KB, against a 200 KB guard and an entry count less than half the
   ~380 that failed in session 16a.
2. **A year is not possible in this shape.** 2195 entries and 929 KB. Not a tuning problem: the entry budget is a
   WidgetKit property, and the failure mode is a silently black widget, which is the worst kind.
3. **Android is not the constraint and never was.** A full year of Android snapshot is 145 KB, because the Android
   layout computes at render time from a carried window rather than storing a view per boundary. If the owner wants a
   longer horizon on Android alone, that is a separate, cheap change, and decision 2 records why it is not made here.

### The levers a future session would pull, in order

Recorded so the next session starts where this one stopped, rather than re-measuring:

1. Drop the day list from entries beyond the first few days (§17's own suggestion). The day list is six rows per
   entry and the bulk of the payload; the hero countdown needs none of it.
2. Let the two platforms diverge: Android to a year, iOS to whatever the entry budget allows.
3. Re-push from the background task more often, so the horizon has to cover less.

### Alternatives rejected

| Alternative | Why rejected |
| --- | --- |
| A year, as the owner floated | Measured: 2195 entries, 929 KB. Blows both budgets, and fails invisibly |
| A separate constant per platform | No measured benefit at 30 days, and a second number to keep in step |
| Slim far-future entries now | Not needed at 78 KB; two entry shapes where there is one |
| Widening the year fetch so December's window is fully stored | A sync change, not a widget change. Out of scope; decision 4 |
| Leaving it at 14 | The owner asked for the opposite, and 30 days costs nothing the budgets notice |

### The concurrency trace

| Caller | Before | After |
| --- | --- | --- |
| Launch sync, background task, settings change (`pushScheduleTimelines`) | Builds a 15-day sequence, pushes ~95 entries | Builds a 31-day sequence, pushes ~185. Same code path, more entries |
| Android push (`pushAndroidSnapshot`, line 358) | One day per day, 16 days | One day per day, 31 days. 12.3 KB |
| A cache holding fewer days than the window | Missing days are unreadable rows; the stale card ends the timeline at the last readable prayer | Unchanged, and reached more often in December (decision 4) |
| Year boundary | The December sync fetches next year | Unchanged. From early December the window reaches days not yet fetched, which render as dashes until it runs |

### The design review

Reviewed by the planning session against the two builders, the push layer, `createPrayerSequence`, the volume tests
and session 16a's entry-budget finding in `ai/AGENTS.md`. What it found:

1. **The constant is shared, and the brief only mentions iOS.** §17 is titled "iOS widget timeline horizon", but
   `TIMELINE_DAYS` feeds the Android push too. Changing it moves both. That is the right outcome, since the owner's
   goal is platform-agnostic, but a plan that said "iOS" and silently changed Android would be a defect. Section 4's
   code map names both call sites, and step 2 measures both.
2. **The volume test's span is a fixture, not a reference to the constant.** `SPAN_DAYS = 16` in the test is written
   out, so raising `TIMELINE_DAYS` alone would leave the guard testing the old volume and the change would be
   unguarded. Step 2 moves it, which is why the two steps exist in this order.
3. **`widgetSimulation.test.ts` must NOT be widened.** It simulates second by second; 31 days of that doubles a suite
   that already takes seconds, to prove nothing new, because what it proves is correctness over time, not volume.
   Left alone deliberately, and section 4 says so.
4. **The payload guard must stay at 200 KB.** Raising it to fit a bigger horizon would remove the only automatic
   warning that the horizon has grown too far. 78 KB against 200 KB is the headroom; the number does not move.

## 6. Steps

- [x] Step 1: DONE in `86bf6597`
- [x] Step 2: DONE in `2cdce940`

### Step 1: The horizon is 30 days

0. **Anchor check.** Run the section 3 count for `1-1`. It must print `1`. Any other count means NEEDS REPLAN.

1. **Goal:** the widget timeline and the Android snapshot cover 30 days ahead instead of 14.

2. **Branch:** `git checkout -b feat/17-timeline-horizon-30 uat-2`

3. **Files:** `stores/widget.ts`. Nothing else, apart from `ai/plans/README.md` and this folder's `PLAN.md` and
   `LOG.md`.

4. **Tests first (red).** Suite: `shared/__tests__/widgetTimeline.test.ts` (existing), after step 2 has moved its
   span. **This step runs before step 2, so its red is measured differently**: the constant is not covered by a test
   that reads it, by design, because a test asserting `TIMELINE_DAYS === 30` would only restate the source.

   What proves this step instead is the break in part 7 and the measurement in part 6. Run the three widget suites
   before the change and record the total:

   `npx jest shared/__tests__/widgetTimeline.test.ts shared/__tests__/widgetSimulation.test.ts shared/__tests__/widgetRenderer.test.ts --watchman=false --selectProjects=unit`

   Expected before AND after: `Tests:       163 passed, 163 total`. A changed number means the horizon moved
   something it must not: STOP.

5. **Change.** This step is `(specified)`.

   At anchor `1-1` in `stores/widget.ts`, change the constant from `14` to `30`, and update its doc comment to say
   what the new number rests on. The contract:

   | Item | Contract |
   | --- | --- |
   | Name | `TIMELINE_DAYS`, unchanged |
   | Value | `30` |
   | What it answers | How many days of prayer boundaries each push carries, on both platforms |
   | Must never | Be raised past 30 without re-measuring: the iOS entry budget, not the payload, is the ceiling, and it fails invisibly (section 5) |
   | Comment | Explains why 30 and not more. Keep it to the existing comment's length; it explains why, never what |

   The doc comment's replacement, verbatim, because the reason is the whole point of the number:

   ```ts
   /** Days of prayer boundaries scheduled ahead — the widget re-reads this
    *  stored timeline when it runs out, so this is how long the widget stays
    *  correct without the app opening. 30 costs ~185 iOS entries and ~78KB;
    *  a year would cost ~2195 and ~929KB, and WidgetKit answers an over-budget
    *  timeline with a silently black widget, never an error. */
   const TIMELINE_DAYS = 30;
   ```

   Nothing else in the file changes. `buildSequence` already adds the `+ 1`.

   The invariant this step keeps: both push paths carry 30 days, and no builder changes.

6. **Green.** The command in part 4 prints `Tests:       163 passed, 163 total`. Then `npx tsc --noEmit` and
   `npx biome check . --error-on-warnings`, both exit 0.

7. **Breaks.** Save to `$TMPDIR/breaks-17-1.sh` and run `bash $TMPDIR/breaks-17-1.sh` from the repository root.

```bash
#!/usr/bin/env bash
set -u
cd /Users/muji/repos/rn.athan.uk || exit 1
FILE=shared/widgetTimeline.ts
SUITE=shared/__tests__/widgetTimeline.test.ts
CAUGHT=0
TOTAL=0

run_break() {
  local label="$1" search="$2" replace="$3"
  TOTAL=$((TOTAL + 1))
  cp "$FILE" "$FILE.bak"
  perl -0pi -e "s/\Q$search\E/$replace/" "$FILE"
  if cmp -s "$FILE" "$FILE.bak"; then
    echo "BREAK NOT APPLIED: $label"
    mv "$FILE.bak" "$FILE"
    return
  fi
  if npx jest "$SUITE" --watchman=false --selectProjects=unit >/dev/null 2>&1; then
    echo "NOT CAUGHT: $label"
  else
    echo "caught: $label"
    CAUGHT=$((CAUGHT + 1))
  fi
  mv "$FILE.bak" "$FILE"
}

run_break "the horizon falls back to a fortnight" \
  "export const TIMELINE_DAYS = 30;" \
  "export const TIMELINE_DAYS = 14;"

run_break "the horizon overruns the entry budget" \
  "export const TIMELINE_DAYS = 30;" \
  "export const TIMELINE_DAYS = 365;"

echo "caught $CAUGHT of $TOTAL"
[ "$CAUGHT" = "$TOTAL" ] && echo "ALL AS EXPECTED: 1"
```

   Two breaks, because the horizon can be wrong in two directions and they are caught by different tests: a shrink to
   14 by `carries a 30-day horizon`, and a jump to a year by the entry and payload bounds. The search text is the
   exported constant step 2 moves into `shared/widgetTimeline.ts`.

   **This script belongs to step 2 and is run there.** At step 1 the constant is still private in `stores/widget.ts`,
   no test can read it, and the script cannot pass; step 1's part 7 says so and records the `NOT CAUGHT` line as
   evidence for why step 2 exists.

8. **Version and commit.** Run `node -p "require('./package.json').version"` on `uat-2` and take the next patch. Set
   it in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`); all three must match.

   Add by name: `stores/widget.ts`, `app.json`, `package.json`, plus `ai/plans/README.md` and this folder's `PLAN.md`
   and `LOG.md` when this session changed them.

   Write to `$TMPDIR/msg-1.txt`, replacing `<VERSION>`:

```
<VERSION> - feat(widgets): the widget horizon grows from 14 days to 30

The widget stopped being correct a fortnight after the app was last opened.
The owner's goal is that it never needs opening at all, and asked for the
feasibility first.

Measured against the real builders: 30 days costs 185 iOS timeline entries
and 78KB, against a 200KB payload guard and the ~380 entries that blacked out
every widget in session 16a. A year would cost 2195 entries and 929KB, so it
is not available in this shape, and the plan records the levers a later
session would pull.

One constant carries both platforms: the Android snapshot grows to 12.3KB,
which its render-time layout absorbs without any change. Neither builder is
touched.
```

   Commit with `git commit -F $TMPDIR/msg-1.txt` in the background. In the log, the last `Tests:` line ends
   `passed, <n> total`, and four `100%` coverage lines are present.

9. **Review.** The session reviews the diff itself, against this list, and records the verdict in `LOG.md`:
   - `TIMELINE_DAYS` is 30, and nothing else in `stores/widget.ts` changed;
   - the doc comment matches the plan's verbatim block;
   - no builder, no layout and no test file is in the diff;
   - the three widget suites still report 163 tests.

10. **Merge.** `git checkout uat-2 && git merge --no-ff feat/17-timeline-horizon-30 -m "Merge feat/17-timeline-horizon-30 into uat-2: the widget horizon is 30 days, reviewed"`

11. **Done when:**
    - `grep -n 'TIMELINE_DAYS = 30' stores/widget.ts` prints one line;
    - the three widget suites report `Tests:       163 passed, 163 total`;
    - `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0;
    - `LOG.md` records the break script's `NOT CAUGHT` line and why it is expected;
    - `git log --oneline -1 uat-2` shows the merge.

### Step 2: The volume guard measures the horizon it ships

0. **Anchor check.** Run the section 3 count for `1-2`. It must print `1`. Any other count means NEEDS REPLAN.

1. **Goal:** the volume and payload guards measure a 31-day span, so the budgets are checked against what production
   actually pushes, and a future horizon rise cannot go unguarded.

2. **Branch:** `git checkout -b test/17-volume-guard-30 uat-2`

3. **Files:** `shared/widgetTimeline.ts`, `shared/__tests__/widgetTimeline.test.ts`, `stores/widget.ts`. Nothing
   else, apart from `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`. The two source files are in this
   step because the constant moves (part 4); `stores/widget.ts` loses the constant and gains the import, nothing
   more.

4. **Tests first (red).** Suite: `shared/__tests__/widgetTimeline.test.ts` (existing).

   **Corrected during execution, 2026-09-24.** As first written, this step moved the fixture spans to a literal 31
   and the break stayed `NOT CAUGHT`, because no test could read `TIMELINE_DAYS`: it was a private constant in
   `stores/widget.ts`, which imports react-native and `@/modules/widgetrefresh`, so a pure unit test cannot import
   it. A guard that hard-codes the span it is guarding is not a guard, so the step now does this instead, and the
   text below is what shipped:

   - `TIMELINE_DAYS` MOVES to `shared/widgetTimeline.ts`, exported, beside `MIN_ENTRY_SPACING_MS`, which is the same
     kind of shared widget constant. `stores/widget.ts` imports it. The doc comment moves with it and gains one line
     saying why it lives there.
   - Both fixture spans in the suite become `TIMELINE_DAYS + 1`, so they track the constant instead of restating it.
   - One test is ADDED, `carries a 30-day horizon`, asserting `TIMELINE_DAYS` is 30.

   That last test earns its place: every other bound in the block is an UPPER bound, and the fixtures now scale with
   the constant, so SHRINKING the horizon satisfies all of them. The execution session measured exactly that: with
   only the upper bounds, a break to 14 days passed. The horizon is a product decision, so one test asserts the
   number and the rest guard the budgets.

   Red is measured by part 7's break script, which must end `ALL AS EXPECTED: 1`.

   | What changes | Change | Why |
   | --- | --- | --- |
   | `SPAN_DAYS` at anchor `1-2` | `16` becomes `TIMELINE_DAYS + 1` | The pushed span IS `TIMELINE_DAYS + 1`, so the guard reads the constant rather than restating a number that can drift from it |
   | `SPAN_DAYS` in the DST block (line 603) | `16` becomes `TIMELINE_DAYS + 1` | Same reason. Its comment already claimed to be "the span stores/widget.ts pushes" while hard-coding 16 |
   | The block's heading comment | `(16-day span, as pushed in production)` becomes `(31-day span, as pushed in production)` | The comment states the span; a stale one misleads |
   | `bounds the extras entry count and payload under the same budgets` | Its `SPAN_DAYS` use follows the constant; its comment's span and Friday list become `31-day extras span (2026-06-14 → 2026-07-14) containing the Fridays 2026-06-19, 2026-06-26, 2026-07-03 and 2026-07-10`, which the planning session computed | The comment names the Fridays inside a 16-day window, and a stale list misleads |

   One assertion is ADDED, and one test:

   | Test | Added | What it proves | Inputs |
   | --- | --- | --- | --- |
   | `emits no more entries than there are prayers left, plus the opener and the guard` | `expect(entries.length).toBeLessThan(250);` | The entry budget, as an absolute number rather than a ratio. The existing bound is relative to the prayers ahead, so it holds at ANY horizon and would not notice a jump to a year. 250 sits above the measured 185 and far below session 16a's ~380 failure | The 31-day standard span |
   | `carries a 30-day horizon` (NEW) | `expect(TIMELINE_DAYS).toBe(30);` | The horizon itself. Every other bound is an upper bound over a fixture that scales with the constant, so shrinking the horizon passes them all; this is what notices | None |

   Command: `npx jest shared/__tests__/widgetTimeline.test.ts --watchman=false --selectProjects=unit`

   Expected after the change: the suite passes with the same test count it had at `53d9baba`. The planning session
   measured the values these tests will see at 31 days: 185 entries and 79,998 bytes for the standard span, both
   inside the bounds. If the payload assertion fails, the horizon is not affordable and the plan is wrong: STOP.

5. **Change.** This step is `(specified)`. The constant moves to `shared/widgetTimeline.ts` as part 4 describes, the
   two fixture spans read it, the comments that state a span are corrected, and the two assertions are added. No
   bound is relaxed: the 200 KB payload guard and the `stillAhead.length + 2` entry bound stay exactly as they are
   (section 5, design review item 4).

   One stale comment is also corrected, on `keeps the serialized payload well under UserDefaults comfort size`: it
   cited "155KB across ~380 entries" from the shape session 16a deleted. It now cites the measured ~78 KB across
   ~185, and says that the 200 KB budget is the only automatic warning that the horizon has grown too far, so the
   horizon moves and the budget does not.

   The invariant this step keeps: the volume guards measure the span production pushes, and both budgets still hold.

6. **Green.** The command above passes with `Tests:       52 passed, 52 total`. Then `npx tsc --noEmit` and
   `npx biome check . --error-on-warnings`, both exit 0. Then the three widget suites together:
   `Tests:       164 passed, 164 total`, one more than step 1's 163, which is `carries a 30-day horizon`.

7. **Breaks.** Run step 1's script, now against the moved constant: `bash $TMPDIR/breaks-17-1.sh`.

   Expected: `caught: the horizon falls back to a fortnight`, `caught: the horizon overruns the entry budget`, then
   `caught 2 of 2`, then `ALL AS EXPECTED: 1`. This is what makes step 1's change guarded, and it is why the two
   steps are in this order. A `BREAK NOT APPLIED` line means STOP (section 2.2, item 3). Afterwards
   `git status --porcelain` must list no `.bak` file.

8. **Version and commit.** Next patch after `uat-2`'s `package.json`, set in all three places. Add by name:
   `shared/__tests__/widgetTimeline.test.ts`, `app.json`, `package.json`, plus the three plan files when changed.
   Message to `$TMPDIR/msg-2.txt`:

```
<VERSION> - test(widgets): the volume guard measures the 30-day horizon

The volume and payload block measured a 16-day span while production pushed
15, and now pushes 31. A guard that measures a different span from the one
that ships is not a guard.

Its span becomes 31, and the entry test gains an absolute bound of 250. The
existing bound is relative to the prayers still ahead, so it holds at any
horizon and would not notice a jump to a year; 250 sits above the measured 185
and far below the ~380 entries that blacked out every widget in session 16a.

No bound is relaxed. The 200KB payload guard is the only automatic warning
that the horizon has grown too far, and 78KB against it is the headroom.
```

9. **Review.** The session reviews the diff itself, against this list, and records the verdict in `LOG.md`:
   - the constant moved to `shared/widgetTimeline.ts` and `stores/widget.ts` only lost it and gained the import;
   - both fixture spans read `TIMELINE_DAYS + 1` rather than a literal;
   - no bound was relaxed, and the 200 KB guard is untouched;
   - the added assertions are an absolute entry bound above the measured value, and the horizon itself;
   - `widgetSimulation.test.ts` was not widened;
   - the three widget suites report 164 tests, one more than step 1.

10. **Merge.** `git checkout uat-2 && git merge --no-ff test/17-volume-guard-30 -m "Merge test/17-volume-guard-30 into uat-2: the volume guard measures the 30-day horizon, reviewed"`

11. **Done when:**
    - `npx jest shared/__tests__/widgetTimeline.test.ts --watchman=false --selectProjects=unit` passes;
    - `bash $TMPDIR/breaks-17-1.sh` ends `ALL AS EXPECTED: 1`;
    - the three widget suites report `Tests:       164 passed, 164 total`;
    - `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0;
    - `git log --oneline -1 uat-2` shows the merge.

## 7. Device proof

**None, and this is deliberate rather than an omission.**

The iOS widgets ship behind `FEATURE_FLAGS.widgets`, which is OFF: the extension is stripped at prebuild and every
push path returns early, so there is nothing on an iPhone to measure. Turning it on is not this session's decision.
It waits on the G.1 acceptance protocol, and section 8 records what this session found about that.

The Android widgets ARE live, and the 3T proves the horizon indirectly: a 30-day snapshot is 12.3 KB against the
6.4 KB it carries today, in the same shape, read by the same render-time layout. No Android behaviour changes at any
render instant inside the old window, which is what `widgetSimulation.test.ts` and `widgetRenderer.test.ts` already
pin, and both keep passing unchanged.

If the owner wants the longer horizon seen on the 3T before it ships, that is a build and a placement, and it is a
separate request. Say so rather than running one uninstructed.

## 8. Records

### `ai/AGENTS.md`

Add to the widget architecture invariants, under the entry-budget bullet, exactly this text:

```markdown
- **The horizon is 30 days, and the entry budget is what caps it (2026-09-24, session 17).** `TIMELINE_DAYS` in
  `stores/widget.ts` feeds BOTH platforms through `buildSequence`. Measured against the real builders: 16 days is 95
  iOS entries and 40KB, 31 days is 185 and 78KB, 61 days is 365 and 154KB, 91 days is 545 and 230KB, and a year is
  2195 and 929KB. The payload guard is 200KB, so payload alone caps the horizon near 80 days, and the entry budget
  caps it sooner (session 16a: ~380 entries blacked out every non-trivial kind). The owner's "maybe we can make it 1
  year" is therefore not available in this shape. Android is not the constraint and never was: a year of Android
  snapshot is 145KB, because its layout computes at render time from a carried window instead of storing a view per
  boundary. The levers for a longer horizon, in order: drop the day list from far-future entries, let the platforms
  diverge, push more often from the background task.
```

### The G.1 finding

This session found, while checking whether an iOS device proof was possible, that **the G.1 flip condition is now
met** and no row in the programme records it. Add to `ai/plans/README.md`'s "Waiting on the owner, not yet sessions"
list:

```markdown
- The iOS widgets flag: `expo-widgets` 58.0.1 shipped the SwiftUI view-identity fix (#49810, "Preserve SwiftUI view
  identity across widget and Live Activity updates"), and the installed 58.0.3's `ios/Widgets/DynamicView.swift`
  renders `AnyView(view).id(child.childIdentity)` with no `UUID()` anywhere: the random-per-render identity hack that
  `shared/flags.ts` names as the reason `widgets` is OFF is gone. The flip condition in that file's JSDoc also
  requires verification on the iPhone XS per the G.1 acceptance protocol, which no session has run. Found while
  planning session 17 (2026-09-24), which needed to know whether an iOS device proof was possible.
```

### Table rows

The executor sets the `ai/plans/README.md` row 14 status to EXECUTED.

The auditor adds this line to `ai/prompts/README.md`'s "Closed prompts (index)" on PASS:

```
- 17. `SDK58-PROGRAMME.md` §17 — CLOSED — widget horizon 14 to 30 days, a year measured and ruled out
```

### Docs commit

```
<VERSION> - docs(plans): session 17 executed: the widget horizon is 30 days
```

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session pushes `uat-2` after
a PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

### Symptom table

| Symptom | Cause | Action |
| --- | --- | --- |
| An anchor counts other than 1 | `uat-2` moved since this plan was written | NEEDS REPLAN (section 2.2, item 1) |
| The three widget suites report other than 163 tests after step 1 | The horizon moved something it must not | STOP. This is the regression the plan is built to avoid |
| The payload assertion fails at 31 days | The measured 78 KB was wrong, or an entry grew | STOP (section 2.2, item 4). Quote both numbers: the budget argument is the basis of the plan |
| The entry assertion fails at 31 days | Same | Same |
| Step 1's break prints `NOT CAUGHT` | Expected: nothing reads the constant until step 2 | Record it in `LOG.md` and go on. Step 2's part 7 requires `ALL AS EXPECTED: 1` |
| Step 2's break prints `NOT CAUGHT` | The span change did not tie the guard to the constant | STOP. The change is unguarded, which is the one thing step 2 exists to prevent |
| A break prints `BREAK NOT APPLIED` | The code does not hold the text the plan fixes | STOP (section 2.2, item 3). Never reshape the code to fit a break |
| `widgetSimulation.test.ts` slows down markedly | Its fixture was widened | Revert it. Section 5, design review item 3: it is deliberately left at its own span |
| Anything else | | `EXECUTOR-BRIEF.md` section 7's table |

### Anticipated review fixes

These are the only fixes the executor may make to anything this plan fixed. Each is given word for word.

1. **If the reviewer says the doc comment states what rather than why:** keep the plan's verbatim block. It gives the
   two measurements and the failure mode, which is why 30 and not more.
2. **If the reviewer says the absolute entry bound duplicates the relative one:** it does not, and both stay. The
   relative bound holds at any horizon; the absolute one is what notices a horizon that grew.
3. **If the reviewer says the payload guard should rise to give headroom:** it must not. Section 5, design review
   item 4: it is the only automatic warning that the horizon has grown too far.
4. **If the reviewer says `widgetSimulation.test.ts` should cover 31 days too:** it must not. Section 5, design
   review item 3.

A reviewer finding that meets all three conditions in `EXECUTOR-BRIEF.md` section 4, item 8, the executor applies
itself and records in `LOG.md`. Those three conditions are written there and are never restated here in other words.

### Stopping part-way

| Step | Restore with `git checkout --` | Delete |
| --- | --- | --- |
| 1 | `stores/widget.ts`, `app.json`, `package.json` | any `.bak` file left by the break script |
| 2 | `shared/__tests__/widgetTimeline.test.ts`, `app.json`, `package.json` | any `.bak` file |

After restoring, follow `EXECUTOR-BRIEF.md` section 4a.

## 11. Subagents in this plan

**None.** The owner instructed on 2026-09-24 that the session does the planning, the execution and the audit itself,
including every review, and spawns no subagent. Each step's part 9 is a review the session performs on its own diff
and records in `LOG.md`.

No image is read in this session, so no `vision` subagent is needed. If a later step is added that needs one, the
owner's instruction stands and the owner is asked first.

## 12. Report to the owner

The final message starts with `Execution session` and a `Time:` line from `date '+%H:%M:%S %d.%m.%Y'`, then:

- a few plain sentences: that the horizon is 30 days, what 30 days costs against the budgets, and that a year was
  measured and ruled out with its numbers;
- the progress table, in `EXECUTOR-BRIEF.md` section 6's format;
- the G.1 finding from section 8, which the owner has not seen before and may want to act on;
- the four-line handoff from the `athan-next` skill, section 5.
