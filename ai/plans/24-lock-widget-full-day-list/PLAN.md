# Plan: Session 24. Lock Screen widgets showing the whole day's list

| Field | Value |
| --- | --- |
| Brief | `ai/plans/24-lock-widget-full-day-list/PLAN.md` section 2 (owner decisions taken on device) |
| Planned at | `273abe96` (version 1.28.11), 2026-09-25 |
| Planned by | Planning session on 2026-09-25 |
| Needs first | nothing |
| Steps | 1, one branch, one commit, one version |
| Device | iPhone XS `00008020-0015585C22D2002E`, Release build with the real API key |
| Owner decisions still needed | None (every one was taken while planning; see section 2) |

**LOCK SCREEN. Not the home screen.** On 2026-09-25 a session built this as a `systemLarge` HOME widget by misreading
the brief, and it was reverted in full. The owner, re-queueing it: 🐋  "I said, create a lock screen widget, not a home
screen widget." Every widget in this plan is an `accessoryRectangular` Lock Screen face.

## 1. Goal

Today the Lock Screen offers six kinds across three compositions, and every one of them shows a single prayer: the next
one, with a countdown or an absolute time. None shows the day. This plan adds the whole day's list as absolute times, in
two shapes: the extras schedule as one column of four rows (five on Fridays), and the standard schedule as two columns
of three. When it is DONE the gallery offers two more Lock Screen faces, `Extra Times (Layout 4)` and
`Next Prayer (Layout 5)`, and placing either shows every row of that day with the next one marked.

The owner's rules that apply:

- 🐋  "we will use absolute times everywhere. HH:MM. That's it. Static." No countdown on either style, and nothing
  that ticks.
- 🐋  "as soon as the last prayer has come, when it's passed, the whole list updates to the new one, updates to the
  next one" — the same rollover the app, the home widgets and the existing lock faces already do.
- 🐋  "So, 1 widget for it, not split... It would just be a list of 4 or 5, I guess a list of 5 on Fridays."
  (extras, 2026-09-25)
- 🐋  "for the standard schedule... we are going to have only 1 widget, not 2 widgets... We just want 1 widget, 3
  plus 3. That's it, 3 plus 3." (standard, 2026-09-25)
- Visuals are settled elsewhere, so no existing face changes: this plan adds two and touches no pixel of the other six.

## 2. Decisions

### 2.1 Taken

1. **Two kinds, not four** (owner, 2026-09-25). The session was queued as four kinds, both styles across both
   schedules. The owner cut it to one style per schedule while this plan was being written: the extras list is short
   enough to read in one column, and the standard list of six is what the two-column split is for. So
   `ExtrasLockWidget4` is the one-column face and `PrayerLockWidget5` is the two-column face, and neither schedule gets
   the other's style.
2. **The kind names stay positional and are not renumbered** (planner). `ExtrasLockWidget4` and `PrayerLockWidget5`
   keep the numbers they were queued under even though 4 is now extras-only and 5 standard-only, because a kind name is
   the identity iOS stores a user's placement against (`ai/AGENTS.md`, session 23's lesson). Renumbering them to 4 and 4
   would read tidier and orphan nothing today, but it sets the precedent that a kind name may be rewritten, which is
   what the AGENTS.md rule exists to forbid.
3. **Row tiers: active solid white and bold, passed at 60%, upcoming at 35%** (owner, 2026-09-25). An accessory face
   renders in vibrant monochrome, so opacity and weight are the only hierarchy available. This adds one literal,
   `rgba(255, 255, 255, 0.35)`, to the widget-specific palette in `widgetContract.test.ts`.
4. **Row text sizes: 11pt in the one-column face, 14pt in the two-column face** (owner, 2026-09-25). A rectangular
   accessory is about 160x72pt. Five rows at 11pt fit the one-column face with its spacing; three rows at 14pt fit the
   two-column face, 14pt being the size the owner settled on for every other lock face.
5. **No `accessoryInline` branch in either new layout** (owner, 2026-09-25, after the planner proved it unreachable).
   `supportedFamilies` is compiled straight into each widget's Swift struct as
   `.supportedFamilies([.accessoryRectangular])` (`node_modules/expo-widgets/plugin/src/ios/withWidgetSourceFiles.ts`
   line 366), so iOS cannot ask these kinds for another family. An inline branch would be dead code and a dead test
   with it.
6. **No `try`/`catch` in any lock layout, and the three existing ones lose theirs** (owner, 2026-09-25). A layout body
   reads JSON props and maps an array, so nothing in it can throw; the catch only added a branch no input reaches, held
   at 100% coverage by three tests that hand-built a throwing property getter. The owner extended the cleanup to the
   existing three: 🐋  "can we also drop it on the existing lock widgets as well? If you can go ahead." Those three
   tests go with it.
7. **A day with no active row renders the list, marking nothing** (owner, 2026-09-25). `activeIndex` is `-1` whenever
   the day on screen holds no readable row, which the builder emits for hours at a time (pinned by
   `shared/__tests__/widgetTimeline.test.ts`, the entries asserting `activeIndex: -1`). The rows still belong on the
   face, so both layouts draw them in the upcoming tier and mark none of them active. This is not a fallback: it is a
   state the data routinely carries.
8. **The builder is not touched** (planner, confirmed by the reverted attempt). `props.prayers` and `props.activeIndex`
   already exist on `PrayerWidgetProps` and are already populated for every entry by `buildDayList` in
   `shared/widgetTimeline.ts`. Rollover comes from `resolveDisplayDate` through that builder, so no layout does date
   arithmetic. `shared/widgetTimeline.ts` and `shared/sequence.ts` are not edited by this plan.
9. **Both new kinds ride the light entries** (planner). The lock faces render in the system's vibrant monochrome, so a
   theme stamp changes nothing on them; the existing six take `lightEntries` and these two do the same.

### 2.2 The executor must not decide

STOP and ask the owner when any of these happens. The question to ask is given with each.

1. **Any anchor count other than 1.** This is NEEDS REPLAN, not a question: follow `EXECUTOR-BRIEF.md` section 1,
   item 4. Say which anchor and what the pre-flight printed.
2. **A test fails that this plan does not name.** Ask: "Test `<name>` failed and the plan does not predict it. Here is
   the failure: `<first failing line>`. Should the plan change, or is this a real defect in the code I wrote?"
3. **The break script prints `BREAK NOT APPLIED: <label>`.** Ask: "Break `<label>` substituted nothing, so the code I
   wrote does not carry the text the plan fixes. Should I rename what carries it, or is the break wrong?"
4. **The break script prints `NOT CAUGHT: <label>`.** The test named for that break passed against broken code, so the
   test is too weak. Widen the test to assert what the break destroyed, then rerun. Only if it still passes, ask: "Break
   `<label>` is not caught even after widening `<test>`. What should the test assert?"
5. **Coverage is below 100% on `widgets/LockPrayerWidget.tsx` after the change.** Add the test for the uncovered branch
   and rerun; never add an ignore comment. If no honest input reaches it, ask: "Branch at line `<n>` of
   `widgets/LockPrayerWidget.tsx` is unreachable by any props the builder emits. Should it be deleted?"
6. **A reviewer finding this plan's section 10 does not answer, and that does not meet all three conditions in
   `EXECUTOR-BRIEF.md` section 4, item 8.** Give the owner the finding in the reviewer's words.
7. **Anything the step does not answer that you would otherwise decide.** Ask: "The plan does not say `<X>`. What
   should it be?"
8. **Anything touching visuals beyond the two new layouts, a prayer time, `releases.json`, `uat` or EAS.** Ask before
   any of it. The six existing lock faces and both home layouts keep every pixel they have; removing their `try`/`catch`
   changes no rendered output and is the only edit this plan makes to them.

## 3. Pre-flight

The script is `ai/plans/24-lock-widget-full-day-list/scripts/preflight.sh`. Copy it and run it:

```bash
cp ai/plans/24-lock-widget-full-day-list/scripts/preflight.sh "$TMPDIR/preflight-24.sh"
bash "$TMPDIR/preflight-24.sh" 1
```

It checks the checkout, the branch, a tree holding nothing but the three plan files, that `uat-2` descends from
`origin/uat-2`, that no other row is in flight, that `node_modules/.bin/jest` exists, that the new suite does not exist
yet, and that all thirteen anchors count exactly 1. It prints the `package.json` version and ends `PREFLIGHT OK`.

Verified at `273abe96`: every anchor counted 1 and the script printed `PREFLIGHT OK`.

An anchor count other than 1 means NEEDS REPLAN (`EXECUTOR-BRIEF.md` section 1, item 4). Any other failure is a STOP.

## 4. Background the executor needs

### Code map

| File | What it does | This plan |
| --- | --- | --- |
| `widgets/LockPrayerWidget.tsx` | The three Lock Screen layout functions and their six `createWidget` exports | Adds two layout functions and two exports; removes three `try`/`catch` wrappers |
| `stores/widget.ts` | The iOS push layer: builds a timeline per schedule and pushes it to each kind | Adds one `updateTimeline` call per new kind |
| `shared/__mocks__/widgets/LockPrayerWidget.ts` | One mock object per registered kind, so store suites can assert pushes | Adds the two new kinds |
| `app.json` | The `expo-widgets` plugin config: one entry per kind, which the prebuild turns into a Swift struct | Adds two `accessoryRectangular` entries |
| `shared/__tests__/widgetContract.test.ts` | AST guards: no module-scope references in a widget body, the palette allow-list, the directive count | Count 3 becomes 5; the faint white joins the allow-list |
| `shared/__tests__/widgetLockRenderer.test.ts` | Renderer tests for the three existing layouts | Loses the three `try`/`catch` tests |
| `shared/__tests__/widgetLockListRenderer.test.ts` | New suite for the two new layouts | Created by this step |
| `shared/widgetTimeline.ts` | The pure builder: one entry per boundary, each carrying `prayers` and `activeIndex` | **Not touched** |
| `shared/sequence.ts` | `resolveDisplayDate`, which decides the day on screen | **Not touched** |

The anchors are saved in full under `ai/plans/24-lock-widget-full-day-list/scripts/anchors/`, with their line numbers
at `273abe96` as a hint only. Find each place by its anchor text, never by line number.

| Anchor file | Locates | Line hint |
| --- | --- | --- |
| `1-layout-tail.txt` | The end of `widgets/LockPrayerWidget.tsx`, where the new layouts are appended | 492 |
| `1-catch-layout1.txt` | Layout 1's `catch`, to remove | 186 |
| `1-catch-layout2.txt` | Layout 2's `catch`, to remove | 330 |
| `1-catch-layout3.txt` | Layout 3's `catch`, to remove | 486 |
| `1-push-standard.txt` | The standard schedule's three lock pushes in `stores/widget.ts` | 203 |
| `1-push-extras.txt` | The extras schedule's three lock pushes in `stores/widget.ts` | 213 |
| `1-mock-tail.txt` | The last two mock kinds | 17 |
| `1-contract-count.txt` | The directive-count assertion | 394 |
| `1-contract-palette.txt` | The Lock Screen palette allow-list | 249 |
| `1-poisoned-1.txt` | Layout 1's standalone `try`/`catch` test, to delete | 330 |
| `1-poisoned-2.txt` | Layout 2's poisoned tail, to trim | 350 |
| `1-poisoned-3.txt` | Layout 3's poisoned tail, to trim | 261 |
| `1-app-json-tail.txt` | The last widget entry in `app.json`, after which the two new entries go | 366 |

### How the pieces interact

The push is synchronous per schedule and there is nothing concurrent in this change: a layout function is a pure
function of its props, called by the widget extension's own JS runtime, and the two new kinds are pushed in the same
loop body as the six existing ones. Nothing in this plan touches a timer, a lock or an async path.

| Caller | Before | After |
| --- | --- | --- |
| `pushScheduleTimelines(Standard)` | Pushes `lightEntries` to 5 kinds and `darkEntries` to 2 | One more kind takes `lightEntries`: `PrayerLockWidget5` |
| `pushScheduleTimelines(Extra)` | Pushes `lightEntries` to 5 kinds and `darkEntries` to 2 | One more kind takes `lightEntries`: `ExtrasLockWidget4` |
| The widget extension, per render | Evaluates one of three serialized bodies | Evaluates one of five |

### Existing tests over this code

| Suite | What it proves | Effect of this change |
| --- | --- | --- |
| `shared/__tests__/widgetLockRenderer.test.ts` | Every branch of the three existing layouts, per family | Three tests are deleted with the `catch` they reached; the other 28 must keep passing unchanged |
| `shared/__tests__/widgetContract.test.ts` | No module-scope reference inside a widget body; the palette allow-list; five directive functions | Two assertions change, listed in part 4 |
| `shared/__tests__/widgetTimeline.test.ts` | The builder, including entries carrying `activeIndex: -1` | Must keep passing untouched: the builder does not change |
| `stores/__tests__/widgetIo.test.ts`, `widgetSettingsSync.test.ts`, `widgetPlatform.test.ts`, `widgetFlagOff.test.ts`, `widgetAndroid.test.ts` | The push layer per platform and flag | Must keep passing; `widgetFlagOff` iterates every mock kind, so the two new mocks are required or it fails |

### Why the obvious simple fix is wrong

Reusing one layout function for both styles and branching on `props.schedule` would look like the home widget, which
backs eight kinds with one body. It does not work here: the `'widget'` directive serializes each function body alone,
and the two styles differ in their whole composition (one `VStack` of rows against an `HStack` of two `VStack`s) rather
than in a value. Sharing a body would mean a runtime branch on every render for no saving, and the contract test that
counts directive functions is what pins this decision.

## 5. Design

**The invariant, as one sentence a test can check:** each new layout renders every row of `props.prayers` as a name and
an absolute time at one size, marks the row at `props.activeIndex` and only that row, and carries no ticking element.

**The approach.** Two new self-contained `'widget'`-directive functions in `widgets/LockPrayerWidget.tsx`, each reading
only `props`. Each takes the same three states in order: `props == null` renders the gallery placeholder, `props.stale`
renders the terminal "Out of date" card, and an empty or absent `prayers` array renders the placeholder. Then the list
draws. The one-column face maps the rows into a `VStack`; the two-column face slices them at `Math.ceil(rows.length / 2)`
and renders each half in its own `VStack` inside an `HStack`, so the first half is left and an odd row goes left.

**Alternatives rejected:**

| Alternative | Why not |
| --- | --- |
| One layout branching on `props.schedule` | The directive serializes a body alone, and the two compositions share no structure. See section 4. |
| Four kinds, both styles per schedule | The owner cut it to two on 2026-09-25: the extras list is short enough for one column and the standard list is what the split is for. |
| A countdown on either face | 🐋  "we will use absolute times everywhere. HH:MM. That's it. Static." |
| Computing the day list in the layout | It would be a second source of truth beside `resolveDisplayDate`. The builder already carries `prayers` and `activeIndex`. |
| Keeping the `try`/`catch` | Nothing in a body that maps a JSON array can throw, and the branch cost three artificial tests to hold coverage. Owner approved removing it here and from the existing three. |
| An inline fallback | `supportedFamilies` compiles into the Swift struct, so iOS never asks these kinds for inline. |

**Design review.** Reviewed by the planning session against the code at `273abe96`, and every risky part was built and
run in a scratch worktree (`~/athan-device-sweep/worktrees/plan-24`, removed at the end). What the spike taught, and
what changed as a result:

1. **The `activeIndex` default was uncovered.** Writing the suite first with only numeric `activeIndex` values left the
   `: -1` fallback of `typeof props.activeIndex === 'number' ? props.activeIndex : -1` unreached, and the full run
   reported branches at 99.89% against a 100% threshold. The fix is in the test table: the held-day row runs over both
   `-1` and `undefined`. The plan's acceptance criteria name the exact coverage lines because of this.
2. **Removing the `catch` from the existing three breaks three of their tests.** The spike ran
   `widgetLockRenderer.test.ts` after the strip and got exactly three failures, each a test whose only purpose was
   reaching the catch through a throwing getter. Part 4 names all three by their anchors.
3. **A JSX text array reads as empty through a naive helper.** The first spike suite asserted the inline fallback and
   failed with `Received string: ""`, because `{props.nextName} {props.nextTime}` arrives as an array of children and the
   helper only read a string. The new suite's `styledTexts` joins array children, which is why part 4 specifies it.
4. **Editing `app.json` with a JSON rewriter reformats the whole file.** The spike's Python `json.dump` reflowed it and
   Biome then failed on it. Part 4 tells the executor to hand-edit the two entries in place.

Measured in the scratch worktree with both layouts and all edits in place: `npx tsc --noEmit` and
`npx biome check . --error-on-warnings` both exit 0, the full suite reports **171 suites, 4675 passed, 2 skipped, 4677
total** at **100% statements, branches, functions and lines**, and the break script prints **`CAUGHT: 6 of 6`** then
**`ALL AS EXPECTED: 1`**.

## 6. Steps

- [x] Step 1: DONE in `bd5610da` (merged `21560164`), version 1.28.13

### Step 1: The two day-list Lock Screen faces

0. **Anchor check.** Run the section 3 pre-flight with `1`. Every one of the thirteen anchors must count `1` and it
   must end `PREFLIGHT OK`. Any count other than `1` means NEEDS REPLAN.

1. **Goal.** Add `ExtrasLockWidget4` (the whole extras day in one column) and `PrayerLockWidget5` (the standard day in
   two columns), and remove the unreachable `try`/`catch` from all five lock layouts.

2. **Branch.** `git checkout -b feat/24-lock-widget-day-list uat-2`

3. **Files.** Exactly these, and nothing else beyond `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`:
   - `widgets/LockPrayerWidget.tsx`
   - `stores/widget.ts`
   - `shared/__mocks__/widgets/LockPrayerWidget.ts`
   - `app.json`
   - `package.json`
   - `shared/__tests__/widgetContract.test.ts`
   - `shared/__tests__/widgetLockRenderer.test.ts`
   - `shared/__tests__/widgetLockListRenderer.test.ts` (new)

4. **Tests first (red).**

   Read `__tests__/README.md` before writing the first one. The new suite is
   `shared/__tests__/widgetLockListRenderer.test.ts`, modelled on `shared/__tests__/widgetLockRenderer.test.ts`: it
   evaluates the real module with `expo-widgets` and the two `@expo/ui` entry points mocked, capturing each layout by
   the name its `createWidget` call registers, and expands function components the way the widget runtime does.

   Three helpers the suite needs, because the spike proved each one necessary:
   - a `renderTree` that expands a function component by calling it with its props, and recurses into arrays;
   - a `marker(name)` factory standing in for each `@expo/ui` component, recording its props;
   - a `styledTexts(tree)` that walks the rendered tree and returns, for every `Text`, its joined text, its `font`
     size and weight, its `foregroundStyle` colour and its full modifier list. **It must join array children**: the
     inline forms arrive as an array and a string-only read returns `""`.

   Fixtures: `STANDARD_ROWS` is the six standard prayers with distinct times, `EXTRAS_ROWS` is the four extras, and
   `FRIDAY_EXTRAS_ROWS` is those four plus `Istijaba`. The live props fixture carries `activeIndex: 3` (Asr), chosen so
   three rows have passed and two are upcoming: a test at index 0 could not tell a passed tier from an absent one.

   | Test | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | renders every extras row as a name and an absolute time in one column | The one-column face is the whole day | `EXTRAS_ROWS`, `activeIndex: 1` | The texts in order are exactly `['Midnight', '00:14', 'Last Third', '02:41', 'Suhoor', '05:15', 'Duha', '07:28']` |
   | renders the Friday extras list at five rows | The five-row Friday case | `FRIDAY_EXTRAS_ROWS`, `activeIndex: 4` | The texts contain `Istijaba` and `16:02`, and number 10 |
   | splits the six standard rows three and three, first half left | The split is by halves, first rows left | `STANDARD_ROWS`, `activeIndex: 3` | The root's first child holds Fajr, Sunrise, Dhuhr with their times; the second holds Asr, Magrib, Isha with theirs |
   | gives the odd row to the left column on a Friday extras list | `ceil`, not `floor` | `FRIDAY_EXTRAS_ROWS`, `activeIndex: 4` | Left column holds three rows (Midnight, Last Third, Suhoor), right holds two (Duha, Istijaba) |
   | marks only the active row on %s, and tiers passed against upcoming | The three-state rule, both faces | Both layouts, `STANDARD_ROWS`, `activeIndex: 3` | Exactly `Asr` and `15:20` are solid white AND bold; exactly the three passed rows' six texts are at 60%; exactly the two upcoming rows' four texts are at 35% |
   | sizes every name AND every time on %s alike | No size drift. **Read both**: a names-only assertion passes while a break inflates every time | Both layouts, `STANDARD_ROWS` | Every `Text`'s font size is 11 on the one-column face and 14 on the two-column face |
   | never ticks anything on %s: absolute times only | The owner's static ruling | Both layouts, live props | No `Text` in the tree carries a `timerInterval` prop |
   | renders the gallery placeholder and the terminal card on %s | The two states the builder really emits | Both layouts: `null`; `stale: true`; `prayers: undefined`; `prayers: []` | `null`, absent and empty rows each reach `Open to load times`; `stale` reaches `Out of date` |
   | lists a held day with no active row on %s, marking nothing | A day on screen with nothing readable still lists | Both layouts, six rows all `--:--`, `activeIndex` as `-1` and again as `undefined` | All twelve texts render in order; every one is at 35% and weight `medium` |

   Changes to `shared/__tests__/widgetLockRenderer.test.ts`, each located by its anchor: delete the whole test at
   `1-poisoned-1.txt`, and trim the poisoned tail from the two tests at `1-poisoned-2.txt` and `1-poisoned-3.txt`,
   leaving each of those two ending at its `Out of date` assertion. Change nothing else in that file: its other 28
   tests must pass untouched.

   Run: `npx jest shared/__tests__/widgetLockListRenderer.test.ts --watchman=false --selectProjects=unit`

   Expected before the change: all tests in the new suite fail, each with
   `TypeError: layouts.ExtrasLockWidget4 is not a function` or the same for `layouts.PrayerLockWidget5`. If any passes,
   or another suite fails, STOP.

5. **Change.** This step is **specified**: build it from these contracts. The plan carries no files to copy.

   **5a. Two new layout functions in `widgets/LockPrayerWidget.tsx`,** appended after the anchor in
   `1-layout-tail.txt`.

   | Contract | Value |
   | --- | --- |
   | Names | `AthanLockWidgetDayColumn` (one column) and `AthanLockWidgetDaySplit` (two columns) |
   | Signature | `(props: PrayerWidgetProps) => ...`. **No `environment` parameter**: neither reads the widget family, because each kind declares `accessoryRectangular` alone |
   | First statement | The `'widget'` directive |
   | Colour constants, inside each body | `WHITE` `'#ffffff'`, `WHITE_MUTED` `'rgba(255, 255, 255, 0.6)'`, `WHITE_FAINT` `'rgba(255, 255, 255, 0.35)'` |
   | Size constant, inside each body | `ROW_SIZE`, `11` in `AthanLockWidgetDayColumn` and `14` in `AthanLockWidgetDaySplit`. It names both the name's size and the time's, so one edit can never move only one of them |
   | Never does | Reads `environment`; references anything at module scope; carries a `timerInterval`; wraps itself in `try`/`catch`; computes a date |
   | Logs | Nothing. A widget body writes no log line |

   Each body, in this order:

   1. A `neutral` helper returning the placeholder: a `VStack` with `spacing={1}` carrying `ATHAN` at 11pt semibold and
      `Open to load times` at 17pt bold, both `WHITE`, with modifiers
      `containerRelativeFrame({ axes: 'horizontal' })`, then `frame({ maxWidth: Infinity, maxHeight: Infinity })`, then
      `containerBackground('rgba(0, 0, 0, 0)', 'widget')`. **The container-relative frame comes first**: the accessory
      slot proposes no width for the root to stretch into, so the root takes the widget container's own width before the
      frame acts. `widgetLockRenderer.test.ts` pins that order for the existing faces.
   2. `if (props == null) return neutral();`
   3. `if (props.stale === true)` returns the terminal card: a `VStack` with `spacing={1}` holding
      `<Image systemName='moon.stars.fill' size={17} color={WHITE} />`, then `Out of date` at 17pt bold, then
      `Open app to refresh` at 14pt medium, all `WHITE`, with the same three root modifiers in the same order. The two
      strings are verbatim, matching the existing faces.
   4. `const rows = Array.isArray(props.prayers) ? props.prayers : [];` then
      `if (rows.length === 0) return neutral();`
   5. `const activeIndex = typeof props.activeIndex === 'number' ? props.activeIndex : -1;`
   6. A `DayRow` component taking `{ name, time, index }`. It computes
      `const colour = index === activeIndex ? WHITE : index < activeIndex ? WHITE_MUTED : WHITE_FAINT;` and
      `const weight = index === activeIndex ? 'bold' : 'medium';`, then returns an `HStack` with `spacing={0}` and
      `frame({ maxWidth: Infinity })`, holding the name `Text`, a `Spacer`, and the time `Text`. Both texts take
      `font({ size: ROW_SIZE, weight })`, `foregroundStyle(colour)`, `lineLimit(1)` and `minimumScaleFactor(0.6)`; the
      time also takes `monospacedDigit()` so the columns of digits line up. Name leading, time trailing, which is the
      app's own row anatomy.
   7. The composition. `AthanLockWidgetDayColumn` returns a `VStack` with `spacing={0}` and the three root modifiers,
      mapping every row to a `DayRow` keyed `row.name`. `AthanLockWidgetDaySplit` computes
      `const splitAt = Math.ceil(rows.length / 2);`, defines a `Half` component taking `{ from, to }` that renders
      `rows.slice(from, to)` in a `VStack` with `spacing={0}` and `frame({ maxWidth: Infinity, maxHeight: Infinity })`
      (each row's `index` being `from + offset`, so the tiers follow the whole day rather than the slice), and returns an
      `HStack` with `spacing={8}` and the three root modifiers holding `<Half from={0} to={splitAt} />` then
      `<Half from={splitAt} to={rows.length} />`.

   `Spacer` must be added to the `@expo/ui/swift-ui` import. Import it under its canonical name: the contract test
   forbids aliasing an `@expo/ui` import.

   Then the two exports, after the new functions:

   ```
   export const ExtrasLockWidget4 = createWidget('ExtrasLockWidget4', AthanLockWidgetDayColumn);
   export const PrayerLockWidget5 = createWidget('PrayerLockWidget5', AthanLockWidgetDaySplit);
   ```

   **5b. Remove the `try`/`catch` from the three existing layouts,** at the anchors `1-catch-layout1.txt`,
   `1-catch-layout2.txt` and `1-catch-layout3.txt`. Delete each `try {` line and its matching
   `} catch { return neutralForFamily(); }` block, and dedent the body that was inside it by two spaces. The rendered
   output must not change: only the wrapper goes. Layout 3's catch carries the comment
   `// Never let a rendering error blank the Lock Surface.`, which goes with it. Layout 3's `neutralForFamily` comment
   mentions "any unexpected rendering error (caught below)", which is no longer true: rewrite that comment to describe
   only the placeholder.

   Update the file's top doc comment to say what is now true: that layouts 4 and 5 carry the day's list and register for
   `accessoryRectangular` alone, and that no layout catches its own render because a body reading JSON props and mapping
   an array cannot throw.

   **5c. `stores/widget.ts`.** At the anchor `1-push-standard.txt`, add
   `lock.PrayerLockWidget5.updateTimeline(lightEntries);` after the `PrayerLockWidget3` line. At the anchor
   `1-push-extras.txt`, add `lock.ExtrasLockWidget4.updateTimeline(lightEntries);` after the `ExtrasLockWidget3` line.
   Both take `lightEntries`: a vibrant accessory ignores a theme stamp. The module's header comment lists the kinds per
   schedule, ending `PrayerLockWidget 1 to 3` and `ExtrasLockWidget 1 to 3`; update both to name the new kind.

   **5d. `shared/__mocks__/widgets/LockPrayerWidget.ts`.** At the anchor `1-mock-tail.txt`, add
   `export const ExtrasLockWidget4 = makeWidgetMock();` and `export const PrayerLockWidget5 = makeWidgetMock();`. Its
   header comment says the module registers "three layouts under six kinds": make it five layouts under eight kinds.
   Without these two, `stores/__tests__/widgetFlagOff.test.ts` fails: it iterates every export of this module.

   **5e. `app.json`.** After the anchor `1-app-json-tail.txt`'s final entry, add two entries, **hand-edited in place**:
   a JSON rewriter reformats the whole file and Biome then rejects it. Match the surrounding indentation exactly.

   | Field | `ExtrasLockWidget4` | `PrayerLockWidget5` |
   | --- | --- | --- |
   | `name` | `ExtrasLockWidget4` | `PrayerLockWidget5` |
   | `displayName` | `Extra Times (Layout 4)` | `Next Prayer (Layout 5)` |
   | `description` | `The whole day's extra times.` | `The whole day's prayers, in two columns.` |
   | `ios.supportedFamilies` | `["accessoryRectangular"]` | `["accessoryRectangular"]` |
   | `android` | `null` | `null` |

   No `contentMarginsDisabled`: the existing lock entries do not carry it.

   **5f. `shared/__tests__/widgetContract.test.ts`.** At the anchor `1-contract-count.txt`, change the expected
   directive count from `3` to `5` and its comment from "three" to "five". At the anchor `1-contract-palette.txt`, add
   `'rgba(255, 255, 255, 0.35)'` to the Lock Screen block of the `widgetSpecific` allow-list, after the 0.6 white.

6. **Green.** Run, in this order:

   ```bash
   npx jest shared/__tests__/widgetLockListRenderer.test.ts --watchman=false --selectProjects=unit
   npx jest shared/__tests__/widgetLockRenderer.test.ts --watchman=false --selectProjects=unit
   npx jest shared/__tests__/widgetContract.test.ts --watchman=false --selectProjects=unit
   npx tsc --noEmit
   npx biome check . --error-on-warnings
   ```

   Expected: the new suite reports `Tests: 16 passed, 16 total`; `widgetLockRenderer` reports
   `Tests: 28 passed, 28 total`; `widgetContract` passes; `tsc` and Biome both exit 0 and print nothing.

   Biome may reformat `widgets/LockPrayerWidget.tsx` after the dedent of 5b, because a JSX element that needed three
   lines inside the `try` fits on one outside it. Run `npx biome check --write widgets/LockPrayerWidget.tsx` and
   include the result; this is formatting, not a behaviour change.

7. **Breaks.** The script is `ai/plans/24-lock-widget-full-day-list/scripts/breaks-1.sh`. Run it from the repository
   root:

   ```bash
   bash ai/plans/24-lock-widget-full-day-list/scripts/breaks-1.sh
   ```

   | Break | Substitutes | Test expected to fail |
   | --- | --- | --- |
   | row tiers flattened to one colour | The three-way `colour` expression becomes `WHITE` | marks only the active row on %s, and tiers passed against upcoming |
   | active row loses its bold | The `weight` expression becomes `'medium'` | marks only the active row on %s, and tiers passed against upcoming |
   | absent activeIndex defaults to 0 | The `: -1` default becomes `: 0` | lists a held day with no active row on %s, marking nothing |
   | layout 5 split uses floor | `Math.ceil` becomes `Math.floor` | gives the odd row to the left column on a Friday extras list |
   | layout 4 row size drifts to 13 | `ROW_SIZE = 11` becomes `13` | sizes every name AND every time on one column alike |
   | stale entry no longer reaches its card | `if (props.stale === true) {` becomes `if (false) {` | renders the gallery placeholder and the terminal card on %s |

   It must end `CAUGHT: 6 of 6` then `ALL AS EXPECTED: 1`. A `BREAK NOT APPLIED` or `NOT CAUGHT` line is section 2.2,
   items 3 and 4. Afterwards, `git status --porcelain` must list only this step's files and the three plan files: the
   script restores the file it edits, so a leftover modification means it exited early.

8. **Version and commit.**

   ```bash
   node -p "const v=require('./package.json').version.split('.'); v[2]=+v[2]+1; v.join('.')"
   ```

   Set that version in `app.json` (`expo.version`), `package.json` (`version`) and, when `android/` exists,
   `android/app/build.gradle` (`versionName`). All three must match or `shared/__tests__/versionLockstep.test.ts`
   fails; the gradle file is gitignored and never added.

   Add by name, never `git add .`:

   ```bash
   git add widgets/LockPrayerWidget.tsx stores/widget.ts shared/__mocks__/widgets/LockPrayerWidget.ts \
     app.json package.json shared/__tests__/widgetContract.test.ts \
     shared/__tests__/widgetLockRenderer.test.ts shared/__tests__/widgetLockListRenderer.test.ts \
     ai/plans/README.md ai/plans/24-lock-widget-full-day-list/PLAN.md ai/plans/24-lock-widget-full-day-list/LOG.md
   ```

   Write the message to `$TMPDIR/msg-1.txt`, replacing `<VERSION>`:

   ```
   <VERSION> - feat(widgets): two Lock Screen faces carrying the whole day's list

   Adds ExtrasLockWidget4, the extras day in one column (four rows, five on
   Fridays), and PrayerLockWidget5, the standard day split three and three with
   the first half left. Both render absolute HH:mm only, marking the active row
   solid white and bold against passed rows at 60% and upcoming rows at 35%.

   The rollover is the builder's: each entry already carries the list day from
   resolveDisplayDate as prayers and activeIndex, so no layout does date
   arithmetic and shared/widgetTimeline.ts is untouched. A day on screen with no
   readable row (activeIndex -1) lists its rows and marks none.

   Both kinds declare accessoryRectangular alone, so neither layout reads the
   widget family: supportedFamilies compiles into the widget's Swift struct and
   iOS cannot ask for another. Neither wraps its render in try/catch, and the
   three existing lock layouts lose theirs too (owner 2026-09-25): a body that
   reads JSON props and maps an array cannot throw, so the catch only held a
   branch no input reaches, propped up by three tests that hand-built a throwing
   property getter.

   Sizes are 11pt in the one-column face and 14pt in the two-column face, both
   from one ROW_SIZE per layout so names and times can never drift apart.
   ```

   Commit in the background: `git commit -F "$TMPDIR/msg-1.txt"`, with its output to a log
   (`EXECUTOR-BRIEF.md` section 3). The hook runs the full suite with coverage and takes 3 to 4 minutes.

   Expected in the log: the last `Tests:` line reads `Tests: 2 skipped, 4675 passed, 4677 total`, and four `100%`
   coverage lines are present (statements 100%, branches 100%, functions 100%, lines 100%). The measured totals from the
   scratch worktree are exactly these; a different total means a suite was added or lost and is section 2.2, item 2.

9. **Review.** Spawn a `Code Reviewer` subagent, isolation `worktree`, with this prompt word for word, the sha filled
   in. Never pass `model`.

   ```
   Run git checkout --detach <sha>.

   Review this commit against ai/plans/24-lock-widget-full-day-list/PLAN.md, step 1. It adds two Lock Screen widget
   layouts to widgets/LockPrayerWidget.tsx and removes the try/catch from the three that were already there.

   Check every one of these:
   1. Each new layout is a self-contained 'widget'-directive function taking props alone, referencing nothing at module
      scope, and reading no widget family.
   2. Each renders every row of props.prayers as a name and an absolute time, both at its own ROW_SIZE (11 in the
      one-column face, 14 in the two-column face), with the time monospaced.
   3. The active row, and only it, is solid white and bold; rows before it are at 60% white; rows after it are at 35%.
   4. An activeIndex of -1 or absent lists the rows and marks none of them.
   5. The two-column face splits at Math.ceil(rows.length / 2), first half left, and each row's tier follows its index
      in the whole day rather than in its slice.
   6. Neither layout carries a timerInterval, a try/catch, or any date arithmetic.
   7. Removing the try/catch from the three existing layouts changed no rendered output: the bodies are the same
      statements, dedented.
   8. shared/widgetTimeline.ts and shared/sequence.ts are not modified.
   9. The two new kinds are registered in all four places: createWidget exports, app.json (accessoryRectangular only),
      stores/widget.ts updateTimeline calls on lightEntries, and the mock module.
   10. Comments explain why, never what, and no comment carries a date, an owner rule or a history note.
   11. Nothing beyond step 1's file list changed.

   Reply merge or fix first.
   ```

   A "merge" verdict is the word `merge` with no outstanding finding. A "fix first" verdict is handled by
   `EXECUTOR-BRIEF.md` section 4, item 8: a fix section 10 gives word for word, or a fix meeting all three of that
   item's conditions, is applied; anything else is a STOP. Do not remove the reviewer's worktree before its final
   verdict.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff feat/24-lock-widget-day-list \
      -m "Merge feat/24-lock-widget-day-list into uat-2: session 24 step 1, reviewed"
    ```

11. **Done when.** Each of these passes:

    ```bash
    npx jest shared/__tests__/widgetLockListRenderer.test.ts --watchman=false --selectProjects=unit   # 16 passed
    npx jest shared/__tests__/widgetLockRenderer.test.ts --watchman=false --selectProjects=unit       # 28 passed
    npx tsc --noEmit                                                                                  # exits 0
    npx biome check . --error-on-warnings                                                              # exits 0
    bash ai/plans/24-lock-widget-full-day-list/scripts/breaks-1.sh                                     # ALL AS EXPECTED: 1
    grep -cE '^\s*\} catch \{' widgets/LockPrayerWidget.tsx                                            # 0, no layout catches
    grep -c "createWidget\('" widgets/LockPrayerWidget.tsx                                              # 8 kinds
    ```

    Then tick the step in section 6 (`- [x] Step 1: DONE in <sha>`) and append to `LOG.md`: the step and its branch, the
    commit sha and version, the hook's last `Tests:` line and its four coverage lines, the break script's last line, the
    review verdict and how many rounds it took, and the merge sha.

## 7. Device proof

The iPhone XS, `00008020-0015585C22D2002E`. The 3T is not involved: these are iOS-only kinds and the Android
resolution drops every lock entry.

**Order matters: bump the version, then prebuild, then build.** `expo run:ios` never re-syncs an existing native
folder, so the other order ships the old version's stamp (`ai/AGENTS.md`).

```bash
npx expo prebuild -p ios --no-install
grep -A1 CFBundleShortVersionString ios/Athan/Info.plist
```

Expected: the plist shows the step's version. The prebuild also regenerates the widget target sources, so the two new
Swift structs appear only after it.

```bash
DEVELOPMENT_TEAM=9V3WAU9Z54 npx eas-cli env:exec preview 'npx expo run:ios --configuration Release --device 00008020-0015585C22D2002E'
```

The Release build with the real API key is required: the mock payload seeds days relative to each download, which makes
a day list meaningless. The environment is positional, not `--environment`.

**Detect the install by polling the device, never by grepping the log for a completion line**: `expo run:ios` keeps
streaming device logs after installing and looks hung. Run this in the background and wait for its notification:

```bash
for i in $(seq 1 60); do
  sleep 15
  xcrun devicectl device info apps --device 00008020-0015585C22D2002E 2>/dev/null \
    | grep -q "<the step's version>" && { echo INSTALLED; break; }
done
```

Once it prints `INSTALLED`, kill the `expo run:ios` process.

Then the owner places both faces on the Lock Screen and rules on:

1. whether the one-column extras face at 11pt is readable, or needs fewer rows;
2. whether the two-column face's halves hold `Last Third 02:41` without shrinking to nothing;
3. whether the three tiers (solid, 60%, 35%) read apart on the glass, in vibrant monochrome.

The owner performs the taps: touch automation is not available on a physical iPhone (`ai/AGENTS.md`). **The owner
receives no screenshots.** A widget's verdict is visual and no test here can give it, so the row stays EXECUTED until
they have looked.

Evidence goes in `~/athan-device-sweep/session24/`: the `devicectl` app list showing the installed version, and the
owner's verdict written into `LOG.md`.

## 8. Records

**Findings text.** Add to `ai/features/uat-2/AUDIT-FINDINGS.md` under the exact heading
`### Session 24: Lock Screen day-list faces`:

```
Two Lock Screen faces now carry the whole day as absolute times: ExtrasLockWidget4 lists the extras day in one column
(four rows, five on Fridays) and PrayerLockWidget5 splits the standard day three and three, first half left. The active
row is solid white and bold, passed rows sit at 60% white and upcoming rows at 35%. Both read the list the builder
already carries (prayers and activeIndex from resolveDisplayDate), so the rollover is the app's own and no layout does
date arithmetic.

Both kinds declare accessoryRectangular alone, so neither layout reads the widget family: supportedFamilies compiles
into the widget's Swift struct, and iOS cannot ask a kind for a family it does not declare. DURABLE LESSON: an
unreachable branch is not free. The three existing lock layouts each wrapped their render in try/catch against a throw
that a body reading JSON props and mapping an array cannot produce, and holding that branch at 100% coverage took three
tests that hand-built a throwing property getter, testing the test rather than the code. All five layouts now render
without a catch, and those three tests are gone (owner 2026-09-25).

Suite after: <TESTS_AFTER>, at 100% statements, branches, functions and lines. Version <VERSION>.
```

`<TESTS_AFTER>` is the hook's last `Tests:` line and `<VERSION>` the step's version.

**Table rows.** The executor sets the `ai/plans/README.md` row 23 status to EXECUTED. The `ai/prompts/README.md` row
is the auditor's to apply on PASS; its new cell text is:
`DONE (session 24, <VERSION>): two Lock Screen day-list faces, one column for extras and two columns for standard.`

**Docs commit.** `<VERSION> - docs(plans): session 24 executed: two Lock Screen day-list faces`

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session pushes `uat-2` after a
PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| An anchor counts 0 or more than 1 | `uat-2` moved under the plan | NEEDS REPLAN (`EXECUTOR-BRIEF.md` section 1, item 4) |
| The new suite passes before the layouts exist | The suite is not reaching the real module | STOP. A passing red step means the test proves nothing |
| `widgetFlagOff.test.ts` fails on `undefined` | 5d was skipped: it iterates every export of the mock module | Add the two mock kinds |
| `widgetContract` fails on the directive count | 5f was skipped, or a third layout was added | Set the count to 5; if it reads more, a layout was duplicated |
| `widgetContract` fails on a colour literal | `rgba(255, 255, 255, 0.35)` is not in the allow-list | Add it to the Lock Screen block, as 5f says |
| `widgetContract` fails with `module-scope reference` | A constant or helper was left outside a widget body | Move it inside the function: the directive serializes the body alone |
| Biome rewrites the whole of `app.json` | It was edited with a JSON rewriter, which reflows the file | Restore it with `git checkout -- app.json` and hand-edit the two entries |
| Biome reformats `widgets/LockPrayerWidget.tsx` after the dedent | A JSX element that needed three lines inside the `try` fits on one outside it | Expected. Run `npx biome check --write` on that file and include the result |
| Coverage below 100% on the layout file | A branch no test reaches, most likely the `activeIndex` default | The held-day test must run over both `-1` and `undefined`. Never add an ignore comment |
| `BREAK NOT APPLIED` | The code does not carry the text the plan fixes | Section 2.2, item 3 |
| `NOT CAUGHT` | The test named for that break is too weak | Widen the test to assert what the break destroyed, rerun, then section 2.2, item 4 |
| The XS shows a blank face | The entry budget, which iOS masks as a containerBackground complaint | STOP and ask. Do not raise `TIMELINE_DAYS` |
| `versionLockstep.test.ts` fails | The three version numbers differ | Set all three to the step's version and commit again |
| Anything else | | The general table in `EXECUTOR-BRIEF.md` section 7 |

**Anticipated review fixes.** Each is given word for word, and these are the only fixes the executor may make to what
this plan specifies. A reviewer finding that meets all three conditions in `EXECUTOR-BRIEF.md` section 4, item 8, the
executor applies itself and records in `LOG.md`.

1. If the reviewer says a root modifier order puts `frame` before `containerRelativeFrame`: reorder so
   `containerRelativeFrame({ axes: 'horizontal' })` is first, then `frame({ maxWidth: Infinity, maxHeight: Infinity })`,
   then `containerBackground('rgba(0, 0, 0, 0)', 'widget')`.
2. If the reviewer says a row's tier in the two-column face reads from its slice rather than the whole day: pass
   `from + offset` as the row's `index`, so the tier follows the day.
3. If the reviewer says the name and the time in a row can drift apart in size: both must read the single `ROW_SIZE`
   constant of that layout, with no second literal anywhere in the row.

**Stopping part-way.** Restore with `git checkout --` : `widgets/LockPrayerWidget.tsx`, `stores/widget.ts`,
`shared/__mocks__/widgets/LockPrayerWidget.ts`, `app.json`, `package.json`,
`shared/__tests__/widgetContract.test.ts`, `shared/__tests__/widgetLockRenderer.test.ts`. Delete
`shared/__tests__/widgetLockListRenderer.test.ts`. Then `EXECUTOR-BRIEF.md` section 4a.

## 11. Subagents in this plan

| Step | Agent type | Isolation | Why | Prompt |
| --- | --- | --- | --- | --- |
| 1 | `Code Reviewer` | `worktree` | The standing rule: every commit is reviewed before it merges | Step 1, part 9 |

No model is named: a subagent always runs the spawning session's own model. No other agent may be used. The device
proof needs no `vision` subagent, because the owner looks at the Lock Screen themselves and no screenshot is read.

## 12. Report to the owner

Start with `Execution session` and a `Time:` line from `date '+%H:%M:%S %d.%m.%Y'`. Then:

- a few plain sentences: the two faces added, what each shows, and that the builder was not touched;
- the progress table (format in `EXECUTOR-BRIEF.md` section 6);
- the three device questions from section 7, which is the decision now waiting on the owner;
- the four-line handoff from the `athan-next` skill, section 5.
