# Plan: Session 20. G.2: the blank card at placement, and the horizon to 3 days

| Field | Value |
| --- | --- |
| Brief | `ai/ISSUES.md` G.2, plus the owner's rulings of 2026-09-25 recorded in section 2 |
| Planned at | `1406dc51` (version 1.27.372), 2026-09-25 |
| Planned by | Planning session on 2026-09-25 |
| Needs first | nothing |
| Steps | 2, each one branch, one commit, one version |
| Device | none. Nothing here is provable on a phone this session: the iOS widgets flag is OFF, so no extension is built, and the owner holds the XS. |
| Owner decisions still needed | None (every one was taken while planning; see section 2) |

## 1. Goal

Two jobs, both small, both provable on this Mac.

**The horizon.** `TIMELINE_DAYS` is 7, which emits 47 iOS timeline entries per kind. The owner ruled on 2026-09-25
that 3 days is enough, because the background task runs every 3 hours and the foreground refresh every 2, so a phone
in ordinary use re-pushes dozens of times inside three days. 3 days emits 23 entries and 9.8KB against 47 and 20KB.

**The stale record.** `shared/flags.ts` tells the next reader that the widgets flag waits on an upstream fix that is
"merged but UNRELEASED" and that "installed 57.0.18 still carries the random-UUID identity hack
(`DynamicView.swift:26`)". Both statements are false against the installed tree: expo-widgets is 58.0.3, its
`DynamicView.swift` holds no `UUID()` at all, and children carry a stable string identity. The G.1 fix IS installed.
Row 16 of `ai/plans/README.md`, the row that flips the flag, reads that text to decide whether its condition is met,
so a stale flip condition is a real hazard, not a typo. `ai/ISSUES.md` G.1 and G.2 carry the same stale claim.

When this plan is DONE: `TIMELINE_DAYS` is 3, its guards are re-sized so a creep back up trips them, and every page
that states the flag's flip condition states what the installed tree actually contains, with the measured entry
counts. The owner would notice nothing on a screen, which is correct: no behaviour a person can see changes here.

The owner's rules that apply:

🐋  "do option 1 yor recommendation. i think maybe we should reduce to 3 days instead of 7. that would give us about
under 15 timeline entries? more performant. and we can assume the background task will run at least a few times
during those 3 days to keep it updated no problem." (owner, 2026-09-25)

🐋  "I think honestly, um, it's just a fluke. I don't think this is going to happen in production. I'm not sure
actually. But yeah, still worth a very light investigation, I guess, to see if there's something wrong." (owner,
2026-09-25, on the G.2 blank card)

🐋  "comments explain why" (`PLANNER-BRIEF.md` section 6, the owner's absolute rules). Restated by the owner on
2026-09-25: comments explain only the why, compactly, never the what or the how.

🐋  "visuals are settled, so no pixel changes without the owner's approval" (`PLANNER-BRIEF.md` section 6). This plan
changes no pixel: the horizon changes how many entries a timeline carries, never how one renders.

## 2. Decisions

### 2.1 Taken

1. **The horizon drops 7 to 3.** Owner, 2026-09-25, after the planning session measured every candidate horizon
   against the real builder and put the risk to them twice. Recorded in `ai/prompts/README.md` and in section 8's
   records text. The accepted risk, stated to the owner before they confirmed: a phone whose background refresh has
   stopped entirely (an iOS force-quit, the ISSUES #36 reboot case, a long-idle install) shows the designed "Out of
   date" card after 3 days instead of 7. The owner confirmed with the risk in front of them.
2. **The G.2 investigation ends here, with no code change.** Planner, on the evidence in section 4. The ~5s window
   is the widget extension's cold start, which this repository does not own: a fresh extension process evaluates a
   153KB JavaScript bundle in JavaScriptCore, then evaluates the layout, before it can draw anything. Nothing in our
   timeline, our push path or our layouts runs before that. The owner asked for "a very light investigation"; the
   finding is that the entry count that once caused a real blackout is ~8x below the failure point already, and 3
   days takes it lower still.
3. **`ios.initialLayout` is NOT added in this session.** Planner. The asymmetry is real (all 8 iOS kinds lack it
   while every Android kind has one, so the plugin writes an empty iOS embedded registry), but wiring it changes the
   native prebuild and can only be proven on the XS, which the owner holds. It is recorded in section 8 as the first
   thing to try if the window still bothers the owner once the flag is on, and it is NOT queued as a row: row 16's
   flag flip has to happen first, because until then there is no extension in the build to observe.
4. **The volume guard becomes 22, not a number derived from `TIMELINE_DAYS`.** Planner, keeping session 19's rule:
   a bound derived from the constant follows the horizon upward and guards nothing. 22 is what the guard's own
   fixture emits at 4 days, so any creep past 3 trips it. Verified in the scratch worktree: at 4 days the suite fails
   exactly these two tests and no others.
5. **The payload guard stays 200_000.** Planner. Session 19's comment says "raise the horizon, never this number",
   and the number is a comfort ceiling on the UserDefaults plist, not a horizon-derived bound. Dropping it would
   re-litigate a settled decision for no gain.

### 2.2 The executor must not decide

STOP and ask the owner when any of these happens. Use the question given.

1. **Any anchor count other than 1.** That is NEEDS REPLAN (`EXECUTOR-BRIEF.md` section 1, item 4), not a question.
2. **A test fails that this plan does not name.** Ask: "Step `<k>` expected only `<the named tests>` to fail. `<test
   name>` also failed with `<the exact line>`. What should it be?"
3. **A break prints `BREAK NOT APPLIED`.** Follow `EXECUTOR-BRIEF.md` section 7's row for the kind of step it is.
4. **A reviewer finding this plan's section 10 does not answer, and that does not meet all three conditions in
   `EXECUTOR-BRIEF.md` section 4, item 8.** Give the owner the finding in the reviewer's words.
5. **Anything the step does not answer that you would otherwise decide.** Ask: "The plan does not say `<X>`. What
   should it be?"
6. **Anything touching visuals, prayer times, `releases.json`, `uat` or EAS.** Nothing in this plan does. If a step
   seems to require it, that is a defect in this plan: STOP and ask.
7. **The measured entry count differs from this plan's numbers.** Step 1 predicts exact figures. Ask: "Step 1
   expected `<n>` entries and the run reported `<m>`. What should it be?"

## 3. Pre-flight

Save to `$TMPDIR/preflight-20.sh` and run `bash $TMPDIR/preflight-20.sh <k>`, where `<k>` is the first step in
section 6's checklist not ticked DONE (1 for a new plan).

```bash
#!/bin/bash
set -u
STEP="${1:-1}"
REPO=/Users/muji/repos/rn.athan.uk
cd "$REPO" || { echo "STOP: not $REPO"; exit 1; }

[ "$(pwd)" = "$REPO" ] || { echo "STOP: wrong checkout"; exit 1; }
[ "$(git branch --show-current)" = "uat-2" ] || { echo "STOP: not on uat-2"; exit 1; }

DIRTY=$(git status --porcelain | grep -v -E 'ai/plans/README.md|ai/plans/20-g2-blank-card-and-horizon/' || true)
[ -z "$DIRTY" ] || { echo "STOP: unexpected changes:"; echo "$DIRTY"; exit 1; }

git fetch origin uat-2 || { echo "STOP: fetch failed"; exit 1; }
git merge-base --is-ancestor origin/uat-2 uat-2 || { echo "STOP: uat-2 is behind origin/uat-2"; exit 1; }

echo "version: $(node -p "require('./package.json').version")"

grep -q '^| 17 |.*| NOT PLANNED\|^| 17 |.*| PLANNING\|^| 17 |.*| READY\|^| 17 |.*| IN PROGRESS' ai/plans/README.md \
  || echo "note: row 17 status is not one of NOT PLANNED/PLANNING/READY/IN PROGRESS, check it"

A=ai/plans/20-g2-blank-card-and-horizon/scripts/anchors
count() { python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"; }

if [ "$STEP" -le 1 ]; then
  for n in 1; do
    c=$(count "$A/1-$n.txt" shared/widgetTimeline.ts)
    [ "$c" = "1" ] || { echo "STOP: anchor 1-$n counted $c (expected 1) -> NEEDS REPLAN"; exit 1; }
  done
  for n in 2 3 4 5; do
    c=$(count "$A/1-$n.txt" shared/__tests__/widgetTimeline.test.ts)
    [ "$c" = "1" ] || { echo "STOP: anchor 1-$n counted $c (expected 1) -> NEEDS REPLAN"; exit 1; }
  done
fi

if [ "$STEP" -le 2 ]; then
  c=$(count "$A/2-1.txt" shared/flags.ts)
  [ "$c" = "1" ] || { echo "STOP: anchor 2-1 counted $c (expected 1) -> NEEDS REPLAN"; exit 1; }
fi

node -p "require('expo-widgets/package.json').version" | grep -qx '58.0.3' \
  || { echo "STOP: expo-widgets is not 58.0.3; section 4's findings were read from that version"; exit 1; }

UUIDS=$(grep -c 'UUID()' node_modules/expo-widgets/ios/Widgets/DynamicView.swift || true)
[ "$UUIDS" = "0" ] || { echo "STOP: DynamicView.swift holds $UUIDS UUID() calls; section 4 expected 0"; exit 1; }

echo "PREFLIGHT OK"
```

Expected final line: `PREFLIGHT OK`. An anchor count other than 1 means NEEDS REPLAN. Any other failure means STOP.

## 4. Background the executor needs

### Code map

| File | What it does |
| --- | --- |
| `shared/widgetTimeline.ts` | The pure timeline and snapshot builders. Holds `TIMELINE_DAYS`, the one constant both platforms read. Anchor `1-1.txt` is its JSDoc and the constant, at line 62 at "Planned at" (a hint, not a locator). |
| `shared/__tests__/widgetTimeline.test.ts` | The builder's suite, 52 tests. Its `volume and payload invariants` describe block holds the four guards this plan re-sizes. Anchors `1-2` through `1-5`, near lines 698 to 727. |
| `stores/widget.ts` | The IO layer. Reads `TIMELINE_DAYS` once, in `buildSequence`, as `TIMELINE_DAYS + 1` (the span includes yesterday). Nothing here changes. |
| `shared/flags.ts` | The single flag reader. Its `widgets` JSDoc carries the stale flip condition. Anchor `2-1.txt`, at line 26. |
| `ai/ISSUES.md` | G.1 (line 250) and G.2 (line 633) carry the same stale upstream claim. |
| `ai/AGENTS.md` | The widget invariants block states "The horizon is 7 days" with its measured table. |

### How the pieces interact

`TIMELINE_DAYS` has exactly two readers: `stores/widget.ts` `buildSequence`, which builds a sequence of
`TIMELINE_DAYS + 1` days, and the test suite. Both platforms flow through `buildSequence`, so the constant sets the
iOS timeline span AND the Android snapshot window with one value. There is no concurrency here: the builder is pure,
synchronous and clock-free apart from the `now` its caller passes.

### Existing tests

| Test | What it proves |
| --- | --- |
| `volume and payload invariants > emits no more entries than there are prayers left, plus the opener and the guard` | THE budget guard. Two bounds: one relative to the prayers ahead (holds at any horizon), one absolute literal (notices a horizon rise). |
| `volume and payload invariants > carries a 7-day horizon` | Pins the constant itself. The one test that fails on a horizon change by design, so the change is never silent. |
| `volume and payload invariants > keeps the serialized payload well under UserDefaults comfort size` | The 200KB comfort ceiling on the standard span. |
| `volume and payload invariants > bounds the extras entry count and payload under the same budgets` | The same two budgets over an 8-day extras span including a Friday. |

The other 48 tests in the file are horizon-independent: their fixtures are two-day or six-day sequences built
explicitly, not from `TIMELINE_DAYS`. Verified in the scratch worktree: with the constant dropped to 3 and the four
guards re-sized, all 52 pass, and the whole suite reports 170 files and 4,645 passing tests at 100% on all four
coverage measures.

### What the spike found about G.2, read from the installed tree

Every claim below was read from `node_modules/expo-widgets` at 58.0.3 this session.

1. **The G.1 root cause is gone.** `ios/Widgets/DynamicView.swift` contains zero `UUID()` calls. Children are built
   by `ViewRenderer.makeChild` as `WidgetsChildView(childView:stringIdentity:)`, and `stringIdentity` comes from the
   node's `__expoWidgetIdentity`, which the widget bundle sets to `JSON.stringify([node.type, key ?? node.key ??
   position])`. `expo-modules-core`'s `AnyChild.swift` resolves that to `.string(...)` identity. This is #49810,
   recorded in the expo-widgets CHANGELOG under `58.0.1 — 2026-09-14`.
2. **What still happens at placement.** `WidgetsJSRuntime` holds one lazily-created `JSContext` per extension
   process. On the first render after the process spawns it evaluates `ExpoWidgets.bundle`, 153,055 bytes, then
   evaluates the layout string and caches it. A freshly placed widget is exactly that cold path. This is the
   extension's own start-up cost and no code in this repository runs before it.
3. **Entry count is far below the failure point.** Measured with the real builder in the scratch worktree: 47 entries
   and 20,183 bytes per standard kind at 7 days. The blackout of session 16a was ~380 entries. 3 days takes it to 23
   entries and 9,771 bytes.
4. **The one repository-side asymmetry, deliberately not acted on.** `app.json` gives every Android kind an
   `android.initialLayout` and gives no iOS kind an `ios.initialLayout`. The plugin's `createLayoutRegistryConfig`
   filters on `widget.ios?.initialLayout != null`, so the embedded iOS registry ships empty and
   `WidgetsLayoutRegistry.layout(for:)` can only fall back to the app-group key the app writes. Section 2.1, item 3
   records why this session does not change it.

### Why the obvious simple fix is wrong

The obvious reading of G.2 is "the timeline is too big, cut it". The measurement says otherwise: at 47 entries the
timeline is ~8x under the count that once failed, and the delay reproduces in the widget picker's PREVIEW, which
renders before any placement has a timeline of its own. Cutting the horizon is worth doing on the owner's ruling for
survival-time and leanness reasons; it is not a fix for the blank window, and this plan does not claim it is.

## 5. Design

**None for behaviour.** No function is added, removed or re-signed. One constant changes value, four test bounds are
re-sized to match, and several prose blocks are corrected. The invariant a test can check is unchanged in shape and
restated with the new number: *a built timeline never carries more entries than the prayers still ahead plus an
opener and a stale guard, and never more than 22.*

Design review: not required. `PLANNER-BRIEF.md` section 3, item 5 requires one for behaviour changes to
notifications, data or the schedule. This plan changes none of those. The horizon's risk was instead put to the owner
directly, twice, with the failure cases named, which is the decision that actually needed review.

## 6. Steps

- [ ] Step 1: The horizon drops to 3 days and its guards are re-sized (specified)
- [ ] Step 2: The flag's flip condition and the G.1/G.2 records state what is installed (specified)

### Step 1: The horizon drops to 3 days and its guards are re-sized

0. **Anchor check.** Run the section 3 count for anchors `1-1.txt` against `shared/widgetTimeline.ts` and `1-2.txt`
   through `1-5.txt` against `shared/__tests__/widgetTimeline.test.ts`. Each must print `1`. Any other count means
   NEEDS REPLAN.

1. **Goal:** `TIMELINE_DAYS` is 3, and the volume guards are sized so a rise back to 4 days fails the suite.

2. **Branch:** `git checkout -b fix/widget-horizon-3-days uat-2`

3. **Files:** `shared/widgetTimeline.ts`, `shared/__tests__/widgetTimeline.test.ts`, `app.json`, `package.json`,
   plus `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`. Nothing else may change.

4. **Tests first (red).** No new suite. Four existing tests in
   `shared/__tests__/widgetTimeline.test.ts`, describe block `volume and payload invariants`, change:

   | Test | Change | What it proves after the change | Asserts |
   | --- | --- | --- | --- |
   | `carries a 7-day horizon` | Renamed to `carries a 3-day horizon`; its comment's "A week" becomes "Three days"; `expect(TIMELINE_DAYS).toBe(7)` becomes `toBe(3)` | The horizon is exactly 3 days, so any change to it is deliberate and visible | `expect(TIMELINE_DAYS).toBe(3)` |
   | `emits no more entries than there are prayers left, plus the opener and the guard` | Its absolute bound `toBeLessThan(60)` becomes `toBeLessThan(22)`; the comment's figures become the measured ones | The entry count stays under the bound a 4-day horizon would breach | `entries.length` < 22, and `<= stillAhead.length + 2`, and the last entry `stale === true` |
   | `bounds the extras entry count and payload under the same budgets` | Its `toBeLessThan(60)` becomes `toBeLessThan(22)` | The same bound holds over the extras span including a Friday | `entries.length` < 22, payload < 200000, last entry `stale === true` |
   | `keeps the serialized payload well under UserDefaults comfort size` | Comment only: the "7-day horizon measures ~17KB across 40 entries" figure becomes the measured 3-day one | Unchanged: the payload stays under the 200KB comfort ceiling | `payloadSize` < 200000 |

   Tests that must NOT change: every other test in the file, and every test in
   `shared/__tests__/widgetSimulation.test.ts` and `shared/__tests__/widgetSnapshot.test.ts`. Their fixtures are
   built explicitly, not from `TIMELINE_DAYS`.

   Write the test changes BEFORE the constant change, then run:

   ```
   npx jest shared/__tests__/widgetTimeline.test.ts --watchman=false --selectProjects=unit
   ```

   Expected: exactly three tests fail, and `Tests:       3 failed, 49 passed, 52 total`.

   ```
     ● volume and payload invariants › emits no more entries than there are prayers left, plus the opener and the guard
       Expected: < 22
       Received:   40
     ● volume and payload invariants › carries a 3-day horizon
       Expected: 3
       Received: 7
     ● volume and payload invariants › bounds the extras entry count and payload under the same budgets
       Expected: < 22
       Received:   26
   ```

   All three fail for the same reason: the tests now describe a 3-day horizon while the constant is still 7. The two
   `< 22` failures are what prove the new bound actually bites, which a bound of 60 would not have done. These exact
   three failures were observed in the planning session's scratch worktree. If a fourth test fails, or any of these
   three passes, STOP.

5. **Change.** (specified)

   In `shared/widgetTimeline.ts`, at anchor `1-1.txt`:
   - `export const TIMELINE_DAYS = 3;`
   - Rewrite its JSDoc so it states the current truth. It must say: what the constant is (the days of prayer
     boundaries each push carries, on both platforms); why it is what it is (it is how long a widget stays correct
     with no app launch and no background refresh, and the owner judged three days enough because the background
     task runs every 3 hours and the foreground refresh every 2); the measured cost (3 days is 23 iOS entries and
     ~9.8KB, where 7 was 47 and ~20KB); the failure mode it guards (WidgetKit answers an over-budget timeline with a
     silently black widget, never an error); and why the constant lives in `shared/` rather than beside its caller
     (`stores/widget.ts` imports react-native and a native module, which a pure unit test cannot). Keep it to the
     why. Do not narrate what the constant does mechanically, and do not log the history of its past values.

   Nothing else in the file changes. `stores/widget.ts` is NOT edited: it reads the constant.

   The invariant this keeps: a built timeline never carries more entries than the prayers still ahead plus an opener
   and a stale guard, and never more than 22.

6. **Green.** The same command:

   ```
   npx jest shared/__tests__/widgetTimeline.test.ts --watchman=false --selectProjects=unit
   ```

   Expected `Tests:       52 passed, 52 total`.

   Then `npx tsc --noEmit` and `npx biome check . --error-on-warnings`, both exit 0.

7. **Breaks.** Save as `$TMPDIR/breaks-20-1.sh` and run `bash $TMPDIR/breaks-20-1.sh` from the repository root.

```bash
#!/bin/bash
set -u
SRC=shared/widgetTimeline.ts
CMD="npx jest shared/__tests__/widgetTimeline.test.ts --watchman=false --selectProjects=unit"
CAUGHT=1

run_break() {
  LABEL="$1"; FILE="$2"; SUBST="$3"
  cp "$FILE" "$FILE.bak"
  perl -0pi -e "$SUBST" "$FILE"
  if cmp -s "$FILE" "$FILE.bak"; then
    echo "BREAK NOT APPLIED: $LABEL"
    CAUGHT=0
    mv "$FILE.bak" "$FILE"
    return
  fi
  if $CMD > /dev/null 2>&1; then
    echo "NOT CAUGHT: $LABEL"
    CAUGHT=0
  else
    echo "caught: $LABEL"
  fi
  mv "$FILE.bak" "$FILE"
}

# A one-day rise. The volume bound is sized so even the smallest creep fails,
# which is the whole reason it is a literal. Expected to fail: 'carries a 3-day
# horizon' and 'emits no more entries than there are prayers left, plus the
# opener and the guard'.
run_break "horizon raised to 4" "$SRC" 's/export const TIMELINE_DAYS = 3;/export const TIMELINE_DAYS = 4;/'

# A drop is a regression too: it silently shortens how long a widget survives.
# Expected to fail: 'carries a 3-day horizon'.
run_break "horizon dropped to 2" "$SRC" 's/export const TIMELINE_DAYS = 3;/export const TIMELINE_DAYS = 2;/'

# The jump session 17 once made. Expected to fail: 'carries a 3-day horizon',
# the standard guard and the extras guard.
run_break "horizon raised to 10" "$SRC" 's/export const TIMELINE_DAYS = 3;/export const TIMELINE_DAYS = 10;/'

echo "ALL AS EXPECTED: $CAUGHT"
```

   Expected output:

   ```
   caught: horizon raised to 4
   caught: horizon dropped to 2
   caught: horizon raised to 10
   ALL AS EXPECTED: 1
   ```

   All three were run in the planning session's scratch worktree against the built change, and all three were
   caught. A first draft of this script also substituted the guard's own literal from 22 to 60; it printed
   `NOT CAUGHT`, because at a 3-day horizon the entry count is under both bounds, so the substitution proved
   nothing. It was removed rather than kept as a break that cannot fail.

8. **Version and commit.**

   ```
   node -p "const v=require('./package.json').version.split('.');v[2]=+v[2]+1;v.join('.')"
   ```

   Set that version in `app.json` (`expo.version`), `package.json` (`version`) and
   `android/app/build.gradle` (`versionName`, gitignored, never added).

   Add by name: `shared/widgetTimeline.ts`, `shared/__tests__/widgetTimeline.test.ts`, `app.json`, `package.json`,
   `ai/plans/README.md`, `ai/plans/20-g2-blank-card-and-horizon/PLAN.md`,
   `ai/plans/20-g2-blank-card-and-horizon/LOG.md`.

   Write to `$TMPDIR/msg-1.txt`, replacing `<VERSION>`:

   ```
   <VERSION> - fix(widgets): drop the timeline horizon to 3 days

   The horizon is how long a widget stays correct with no app launch and no
   background refresh. The owner ruled three days is enough: the background
   task runs every 3 hours and the foreground refresh every 2, so a phone in
   ordinary use re-pushes dozens of times inside the window.

   Measured with the real builder: 3 days emits 23 iOS entries and 9.8KB per
   standard kind, where 7 emitted 47 and 20KB. The blackout that made entry
   count matter at all was ~380 entries, so both figures sit far under it.

   The volume guard drops from 60 to 22, which is what a 4-day horizon emits
   in that test's own fixture, so a creep back up fails the suite. The payload
   guard stays at 200KB: it is a comfort ceiling on the UserDefaults plist,
   not a horizon-derived bound.

   Accepted risk, owner-approved: a phone whose background refresh has stopped
   entirely shows the designed "Out of date" card after 3 days instead of 7.
   ```

   Commit with `git commit -F $TMPDIR/msg-1.txt` in the background. In the log, the last `Tests:` line must end
   `passed, 4647 total` and four `100%` coverage lines must be present.

9. **Review.** The session reviews this commit itself, with no subagent (section 11, the owner's instruction of
   2026-09-25). Read it with `git show <sha>` and work through this checklist, recording the verdict in `LOG.md`:

   ```
   Review this commit against its plan, ai/plans/20-g2-blank-card-and-horizon/PLAN.md step 1.

   Check:
   - TIMELINE_DAYS is 3 and nothing else in shared/widgetTimeline.ts changed;
   - its JSDoc states the why and the measured cost, and does not narrate what
     the constant mechanically does, and carries no history log of past values;
   - the four named tests changed exactly as the plan's step 4 table says, and
     no other test in the file changed;
   - the absolute volume bound is 22 in both guard tests;
   - the payload guard is still 200000;
   - stores/widget.ts was NOT edited;
   - the version is bumped in app.json and package.json, in step;
   - the commit message is the plan's, with the version filled in;
   - comments explain why, never what, compactly (the owner's rule).

   Reply merge or fix first.
   ```

   A "merge" verdict is the word `merge`. A "fix first" verdict is handled by `EXECUTOR-BRIEF.md` section 4, item 8:
   a fix this plan's section 10 gives word for word, or a fix meeting all three of that item's conditions, is
   applied; anything else is a STOP.

10. **Merge.**

    ```
    git checkout uat-2 && git merge --no-ff fix/widget-horizon-3-days -m "Merge fix/widget-horizon-3-days into uat-2: the widget timeline horizon drops to 3 days, reviewed"
    ```

11. **Done when:**
    - `grep -n 'TIMELINE_DAYS = 3' shared/widgetTimeline.ts` prints one line;
    - `npx jest shared/__tests__/widgetTimeline.test.ts --watchman=false --selectProjects=unit` prints
      `Tests:       52 passed, 52 total`;
    - `bash $TMPDIR/breaks-20-1.sh` ends `ALL AS EXPECTED: 1`;
    - `git log --oneline -1 uat-2` shows the merge.

### Step 2: The flag's flip condition and the G.1/G.2 records state what is installed

0. **Anchor check.** Run the section 3 count for `2-1.txt` against `shared/flags.ts`. It must print `1`.

1. **Goal:** every page stating the iOS widgets flag's flip condition states what the installed tree actually
   contains, so row 16 is decided on fact.

2. **Branch:** `git checkout -b docs/widget-flag-flip-condition uat-2`

3. **Files:** `shared/flags.ts`, `ai/ISSUES.md`, `ai/AGENTS.md`, `app.json`, `package.json`, plus
   `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`. Nothing else may change.

4. **Tests first (red).** None, and this is deliberate: nothing here changes behaviour. `shared/flags.ts` changes
   only inside a JSDoc comment; the two `.md` files are prose. `shared/__tests__/flags.test.ts` already pins the
   flag's value and its `app.config.ts` mirror, and must keep passing unchanged.

   Before the change, run and record:

   ```
   npx jest shared/__tests__/flags.test.ts --watchman=false --selectProjects=unit
   ```

   Expected: all pass. They must still all pass after the change. If any fails at either point, STOP.

5. **Change.** (specified)

   **`shared/flags.ts`**, the `widgets` flag's JSDoc at anchor `2-1.txt`. Keep the flag's value line exactly as it
   is: `widgets: process.env.EXPO_PUBLIC_WIDGETS === '1',`. Rewrite only the JSDoc so it states:
   - what the flag gates, and that while it is off the extension is stripped at prebuild and the push paths return
     early;
   - that the upstream identity fix it waited on IS installed: expo/expo#49810, shipped in `expo-widgets@58.0.1`,
     and the installed 58.0.3 `DynamicView.swift` carries no random UUID, children carrying a stable string identity
     instead;
   - the flip condition that remains: the G.1 acceptance protocol on the iPhone XS, which needs the owner, and which
     is queued as row 16 of `ai/plans/README.md`;
   - where the full trail lives (`ai/ISSUES.md` G.1).

   Delete the claims that are now false: that the fix is "merged but UNRELEASED", that it "ships on the SDK 58 line,
   not as a 57.0.x patch" as a pending prediction, and that "installed 57.0.18 still carries the random-UUID
   identity hack". Do not replace them with a history of what the page used to say. Comments explain why, compactly.

   The `androidWidgets` flag's JSDoc is NOT changed.

   **`ai/ISSUES.md` G.1**, under the heading at line 250: add a dated status note recording that the fix is
   installed. It states: the date (2026-09-25); that `expo-widgets` is 58.0.3 and `ios/Widgets/DynamicView.swift`
   holds no `UUID()` call; that children now take a stable string identity from `__expoWidgetIdentity`, which the
   widget bundle sets from the JSX type and key; that this is #49810, recorded in the expo-widgets CHANGELOG under
   `58.0.1 — 2026-09-14`; and that what remains is the XS acceptance protocol, which is row 16. Leave the existing
   diagnosis in place: it is the record of how the bug was found.

   **`ai/ISSUES.md` G.2**, under the heading at line 633: add a dated note recording this session's investigation.
   It states: the date (2026-09-25); that the entry count was measured at 47 per standard kind at the 7-day horizon
   and 23 at the 3-day horizon set by step 1, against the ~380 that caused the blackout, so entry count is not the
   driver; that the extension's first render after its process spawns evaluates a 153KB JavaScript bundle in
   JavaScriptCore before it can draw, which is the cold start a freshly placed widget pays and which this repository
   does not own; that the delay also reproduces in the picker's preview, where no placement timeline exists yet;
   and that `app.json` gives no iOS kind an `ios.initialLayout`, so the plugin writes an empty embedded layout
   registry and the app-group key written by the app is the only layout source, which is the first thing to try if
   the window still bothers the owner once the flag is on. Record that it was NOT changed this session because it
   alters the native prebuild and is only provable on the XS.

   **`ai/AGENTS.md`**, the widget invariants block: the bullet beginning "**The horizon is 7 days" becomes a 3-day
   statement carrying the measured figures from step 1 (3 days is 23 iOS entries and ~9.8KB; 7 was 47 and ~20KB;
   ~380 was the blackout), the owner's 2026-09-25 ruling and its reasoning (the background task runs every 3 hours
   and the foreground refresh every 2), the accepted risk, and the existing note that the constant lives in
   `shared/` because `stores/widget.ts` imports react-native. Keep the rule that the volume bound is a literal and
   never derived from `TIMELINE_DAYS`, updating 60 to 22. Do not delete the block's other bullets.

6. **Green.**

   ```
   npx jest shared/__tests__/flags.test.ts --watchman=false --selectProjects=unit
   ```

   Expected: every test passes, the same count as in part 4.

   Then `npx tsc --noEmit` and `npx biome check . --error-on-warnings`, both exit 0.

7. **Breaks.** None, and this is deliberate. A break script proves a test catches a change in behaviour. This step
   changes no behaviour: the only code file it touches changes inside a comment, which no test can observe and no
   substitution can meaningfully break. `shared/__tests__/flags.test.ts` already pins the flag's value, and step 1's
   break script covers the constant this session changed. Inventing a break here would prove nothing.

8. **Version and commit.**

   ```
   node -p "const v=require('./package.json').version.split('.');v[2]=+v[2]+1;v.join('.')"
   ```

   Set that version in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`, never added).

   Add by name: `shared/flags.ts`, `ai/ISSUES.md`, `ai/AGENTS.md`, `app.json`, `package.json`,
   `ai/plans/README.md`, `ai/plans/20-g2-blank-card-and-horizon/PLAN.md`,
   `ai/plans/20-g2-blank-card-and-horizon/LOG.md`.

   Write to `$TMPDIR/msg-2.txt`, replacing `<VERSION>`:

   ```
   <VERSION> - docs(widgets): the flag's flip condition states what is installed

   shared/flags.ts told the next reader that the iOS widgets flag waits on an
   upstream fix that is merged but unreleased, and that the installed
   expo-widgets still carries the random-UUID identity hack. Both are false
   against the tree: expo-widgets is 58.0.3, DynamicView.swift holds no UUID
   call, and children carry a stable string identity from the JSX type and
   key. That is expo/expo#49810, shipped in 58.0.1.

   This matters because the row that flips the flag reads that text to decide
   whether its condition is met. What remains is the G.1 acceptance protocol
   on the XS, which needs the owner.

   G.2 records this session's investigation: entry count is not the driver
   (47 per kind at the old horizon, 23 now, against ~380 at the blackout).
   The window a freshly placed widget pays is the extension's cold start,
   which evaluates a 153KB JavaScript bundle before it can draw, and it
   reproduces in the picker preview where no timeline exists yet. The one
   repository-side lead, no ios.initialLayout on any iOS kind leaving the
   embedded layout registry empty, is recorded and deliberately not acted on:
   it changes the native prebuild and is only provable on the XS.
   ```

   Commit with `git commit -F $TMPDIR/msg-2.txt` in the background. The last `Tests:` line must end
   `passed, 4647 total`, with four `100%` coverage lines.

9. **Review.** The session reviews this commit itself, with no subagent (section 11, the owner's instruction of
   2026-09-25). Read it with `git show <sha>` and work through this checklist, recording the verdict in `LOG.md`:

   ```
   Review this commit against its plan, ai/plans/20-g2-blank-card-and-horizon/PLAN.md step 2.

   Check every factual claim it makes against the installed tree, because the
   point of the commit is that the previous text was factually wrong:
   - node -p "require('expo-widgets/package.json').version" is 58.0.3;
   - grep -c 'UUID()' node_modules/expo-widgets/ios/Widgets/DynamicView.swift is 0;
   - the expo-widgets CHANGELOG records #49810 under 58.0.1;
   - app.json gives no iOS kind an ios.initialLayout.

   Then check:
   - shared/flags.ts changed ONLY inside the widgets flag's JSDoc, and the
     flag's value line is untouched;
   - the androidWidgets JSDoc did not change;
   - no false claim survives anywhere in the three files: no "merged but
     unreleased", no "57.0.18 carries the hack";
   - the new text states the why compactly and carries no history log of what
     the page used to say;
   - ai/AGENTS.md's horizon bullet matches what step 1 actually shipped, and
     still says the volume bound is a literal, never derived;
   - the version is bumped in app.json and package.json, in step;
   - the commit message is the plan's, with the version filled in.

   Reply merge or fix first.
   ```

   Verdict handling as step 1, part 9.

10. **Merge.**

    ```
    git checkout uat-2 && git merge --no-ff docs/widget-flag-flip-condition -m "Merge docs/widget-flag-flip-condition into uat-2: the widgets flag's flip condition states what is installed, reviewed"
    ```

11. **Done when:**
    - `grep -c '57.0.18' shared/flags.ts` prints `0`;
    - `grep -c 'UNRELEASED' shared/flags.ts` prints `0`;
    - `npx jest shared/__tests__/flags.test.ts --watchman=false --selectProjects=unit` passes;
    - `git log --oneline -1 uat-2` shows the merge.

## 7. Device proof

None. Nothing in this plan is observable on a phone this session.

The iOS widgets flag is OFF, so `app.config.ts` strips the expo-widgets plugin at prebuild and no widget extension
exists in any build this session could make. The Android widgets flag is also OFF by default. The horizon change is
proven by the pure unit suite, which is where the builder's behaviour lives; the records change is prose.

The owner holds the iPhone XS, and the G.1 acceptance protocol that would exercise a real placement is row 16 of
`ai/plans/README.md`, owner-led by its own note. This plan does not touch the phone, does not change automatic time,
and leaves both devices exactly as they are.

## 8. Records

### Findings text

Add to `ai/features/uat-2/AUDIT-FINDINGS.md`, under a new heading `## Session 20: the widget horizon and the G.2
investigation (2026-09-25)`:

```
Two jobs, no behaviour a person can see.

**The horizon is 3 days.** `TIMELINE_DAYS` drops from 7 on the owner's ruling of 2026-09-25. Measured with the real
builder: 3 days emits <ENTRIES_3> iOS entries and <BYTES_3> bytes per standard kind, where 7 emitted 47 and 20,183.
The blackout that made entry count matter at all was ~380 entries, so both sit far below it. The horizon's job is how
long a widget stays correct with no app launch and no background refresh; the owner judged three days enough because
the background task runs every 3 hours and the foreground refresh every 2. The volume guard is now the literal 22,
what a 4-day horizon emits in that test's own fixture, so a creep back up fails the suite; the payload guard stays at
200KB, a comfort ceiling rather than a horizon-derived bound. ACCEPTED RISK, owner-approved: a phone whose background
refresh has stopped entirely shows the designed "Out of date" card after 3 days instead of 7.

**G.2 investigated, no code change.** The owner asked for a light look at the blank card seen at placement. Findings,
all read from the installed expo-widgets 58.0.3:

1. The G.1 root cause is GONE. `DynamicView.swift` holds no `UUID()` call; children take a stable string identity
   from `__expoWidgetIdentity`, which the widget bundle sets from the JSX type and key. That is expo/expo#49810,
   shipped in 58.0.1. `shared/flags.ts` had said the opposite, and the row that flips the flag reads that text, so
   the flip condition is corrected in the same session.
2. Entry count is not the driver. See the figures above.
3. What a freshly placed widget actually pays is the extension's cold start: a new extension process evaluates a
   153,055-byte JavaScript bundle in JavaScriptCore, then the layout, before it can draw. No code in this repository
   runs before that, and the delay also appears in the picker's preview, where no placement timeline exists yet.
4. One repository-side lead, recorded and deliberately not acted on: `app.json` gives every Android kind an
   `android.initialLayout` and no iOS kind an `ios.initialLayout`, so the plugin writes an empty embedded layout
   registry and the app-group key the app writes is the only layout source. Wiring it changes the native prebuild
   and is only provable on the XS, which the owner holds. It is the first thing to try if the window still bothers
   the owner once row 16 flips the flag.
```

`<ENTRIES_3>` and `<BYTES_3>` are the only placeholders: the executor fills them from the figures its own run
reports (expected 23 and 9,771).

### Table rows

The executor sets the `ai/plans/README.md` row 17 to EXECUTED.

The auditor applies this to the `ai/prompts/README.md` row on PASS:

```
DONE 2026-09-25 (session 20): the widget timeline horizon is 3 days on the owner's ruling, its volume guard re-sized
to 22, and the iOS widgets flag's flip condition corrected to state what is installed (the G.1 identity fix shipped
in expo-widgets 58.0.1). G.2's blank card investigated: not entry count, but the widget extension's cold start.
```

### Docs commit

```
<VERSION> - docs(plans): session 20 executed: the horizon is 3 days and G.2 is investigated
```

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session pushes `uat-2` after
a PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

### Symptom table

| Symptom | Cause | Action |
| --- | --- | --- |
| An anchor counts 0 | `uat-2` moved since "Planned at" | NEEDS REPLAN (`EXECUTOR-BRIEF.md` section 1, item 4) |
| `carries a 3-day horizon` passes BEFORE the constant changes | The constant was edited before the test | Revert the constant, run the test again, and only then change it |
| A test outside `volume and payload invariants` fails in step 1 | A fixture depends on `TIMELINE_DAYS` in a way this plan did not find | STOP and ask. Give the test name and its failure line |
| `Tests:` totals differ from 4647 | Another session changed the suite | Not a failure in itself. Record the real total in `LOG.md` and carry on |
| The break script prints `BREAK NOT APPLIED` | A substitution's search text is not in the file | STOP and ask (section 2.2, item 3) |
| A break prints `NOT CAUGHT` | This plan's step 1, part 7 predicted wrongly | STOP and ask. Never reshape the code to satisfy a break |
| `flags.test.ts` fails in step 2 | Something outside the JSDoc changed | Restore `shared/flags.ts`, re-apply the comment change alone |
| Anything else | | `EXECUTOR-BRIEF.md` section 7's table |

### Anticipated review fixes

These are the only fixes the executor may make to anything this plan fixed. A reviewer finding that meets all three
conditions in `EXECUTOR-BRIEF.md` section 4, item 8, the executor applies itself and records in `LOG.md`; those three
conditions are written there and are never restated here in different words.

1. **If the reviewer says the JSDoc in step 1 narrates what the constant does rather than why:** cut the narrating
   sentence entirely. Do not replace it.
2. **If the reviewer says a figure in a comment or commit message does not match what the run reported:** change the
   figure to the reported one, in every place this plan's steps wrote it.
3. **If the reviewer says `ai/AGENTS.md`'s horizon bullet still carries a 7-day figure anywhere:** change that figure
   to the 3-day one measured in step 1.

### Stopping part-way

| Step | Restore with `git checkout --` | Delete |
| --- | --- | --- |
| 1 | `shared/widgetTimeline.ts`, `shared/__tests__/widgetTimeline.test.ts`, `app.json`, `package.json` | nothing |
| 2 | `shared/flags.ts`, `ai/ISSUES.md`, `ai/AGENTS.md`, `app.json`, `package.json` | nothing |

Then follow `EXECUTOR-BRIEF.md` section 4a in full.

## 11. Subagents in this plan

**None. The owner instructed on 2026-09-25 that this session uses no subagents at all, and that the one session does
the planning, the execution and the audit itself.** That instruction overrides the standing "every commit is reviewed
by a `Code Reviewer` subagent" rule for this plan.

Every commit is still reviewed before its merge. The session performs the review itself, against the checklist each
step's part 9 gives, reading the commit with `git show <sha>` and verifying each factual claim with the commands
listed there. The verdict and what it checked are recorded in `LOG.md`, exactly as a subagent's verdict would be.

This plan needs no image read and no parallel work, which are the only two jobs a subagent would have been right for.

## 12. Report to the owner

The final message starts with `Execution session` and a `Time:` line from `date '+%H:%M:%S %d.%m.%Y'`, then:

- a few plain sentences: the horizon is 3 days with the measured entry count, the guard that now notices a rise, and
  what the G.2 investigation concluded;
- the progress table (format in `EXECUTOR-BRIEF.md` section 6);
- any decision now waiting on the owner (expected: none);
- the four-line handoff from the `athan-next` skill, section 5.
