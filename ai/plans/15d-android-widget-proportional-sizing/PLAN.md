# Plan: Session 15d. Android widgets size themselves from the width the launcher grants

| Field | Value |
| --- | --- |
| Brief | `ai/prompts/android-widget-proportional-sizing.md` |
| Planned at | `7b38e5a6` (version 1.27.338), 2026-09-24 |
| Planned by | Planning session on 2026-09-24, GLM 5.3 |
| Needs first | nothing |
| Steps | 4, each one branch, one commit, one version |
| Device | OnePlus 3T (`8f7ada76`) and Oppo Find X8 (`G6RWBAQ4VKWWEAIZ`), both on a local mock build with `EXPO_PUBLIC_ANDROID_WIDGETS=1` |
| Owner decisions still needed | None (every one was taken while planning; see section 2) |

## 1. Goal

The Android medium widgets lay themselves out from hardcoded dp: `HERO_WIDTH` 170 plus `LIST_WIDTH` 162 is 332dp of
fixed columns, inside a card whose provider declares `minWidth` 310dp. `minWidth` is a floor the launcher must respect,
not a width it will grant. On the Oppo Find X8 the launcher grants less than the content demands, the Glance `Row`
overflows, and the first child is clipped: the prayer names lose their left edge and read `se`, `ar`, `ib` instead of
`Sunrise`, `Dhuhr`, `Magrib`. When this plan is DONE, every Android medium widget computes its columns from the width
the launcher actually granted, so the six rows show their full names on both phones, at native density and under a
display-size override, and on a home grid the user has re-columned. The owner would notice by looking at the X8's home
screen page 4: the names read in full instead of sliced.

The owner's rules that apply:

🐋  "Our widgets are honestly supposed to be dynamic so that they can work great on all sizes." (owner, 2026-09-24,
recorded in `ai/prompts/android-widget-proportional-sizing.md`). Phone, tablet, both platforms. The same ruling
forbids the obvious repair: "Do not fix this by tuning a second set of constants against the X8."

🐋  "visuals are settled, so no pixel changes without the owner's approval" (`PLANNER-BRIEF.md` section 6). This
session changes SIZING only. The palette, the pill shape, the fonts and the footer lift are settled by the 15b and 16a
rulings. A sizing fix that visibly moves a colour or a weight is a bug in the fix. The proportions this plan keeps at
the 3T's granted width are exactly the proportions the owner approved on 2026-09-20, which is what makes this a fix
rather than a redesign.

## 2. Decisions

### 2.1 Taken

1. **The widget learns its width from a props stamp, not from a Glance fraction.** Decided by the owner, 2026-09-24,
   after the planning session measured that neither Glance proportional primitive is reachable.
   `modules/widgetrefresh` already reads every placed id's `OPTION_APPWIDGET_MIN_WIDTH` to stamp `size` into the
   kind's stored props; it stamps the granted width the same way, and the layout computes its columns from that
   number at render time. Recorded in `ai/prompts/README.md`'s decided section and in section 5 below.
2. **The converter bug is reported but not patched in this session.** Decided by the planning session, from the
   owner's choice of option 1 over option 3. `expo-widgets` 58.0.3's Glance converter
   (`ExpoWidgetEmittableTree.kt:415`) maps `fillMaxWidth(fraction)` to a bare `fillMaxWidth()` and has no `weight`
   case at all. The layout's correctness must not depend on a patched dependency, so the fix rides the props stamp.
   Section 8 records the finding so a later session can raise it upstream.
3. **Both Android phones are on the bench for this session.** Decided by the owner, 2026-09-24. Both answered
   `adb devices` while planning. The device proof therefore uses both phones, at native density and under a
   display-size override.
4. **The row text scales with its box, with a 10sp floor.** Decided by the planning session, from a measurement:
   Glance has no autoshrink (the converter can set `fontSize` but nothing fits text to a box), so a name box narrowed
   by a tight grant would clip `Last Third` at a fixed 13sp. Scaling the row text by the same factor as the box keeps
   every name whole down to a 258dp grant; the floor keeps it legible. Proven in the scratch worktree, section 5.
5. **`grantedWidthDp` is optional on the snapshot, not required.** Decided by the planning session, from a tsc error
   in the scratch worktree: `buildPrayerWidgetSnapshot` is a pure builder shared with iOS and cannot know a launcher
   grant. The stamp is applied per kind by the native tick, exactly as `theme` and `size` are, so the field is
   optional and the layout falls back to the declared minimum until the first tick stamps it.
6. **The small kinds are not touched.** Decided by the planning session, from the brief's step 5 and the measurement
   in section 4: the small composition is hero-only, has no multi-column arithmetic, and therefore cannot overflow.
   Its wide letters on the X8 are the density override acting on text, which is the user's own display-size setting.

### 2.2 The executor must not decide

The executor STOPs and asks the owner when any of these happens.

1. **Any anchor count other than 1.** Ask: "Anchor `<file>` counts `<n>`, not 1. The plan is stale. Should I set the
   row to NEEDS REPLAN?"
2. **A test fails that this plan does not expect.** Ask: "Test `<name>` failed and the plan does not predict it. The
   failure line is `<line>`. What should it be?"
3. **A break prints `BREAK NOT APPLIED`.** Ask: "Break `<label>` changed nothing, so the substitution does not match
   the code. Should I stop for a replan?"
4. **A reviewer finding that section 10 does not answer and that does not meet all three conditions in
   `EXECUTOR-BRIEF.md` section 4, item 8.** Ask with the finding in the reviewer's words.
5. **Anything the step does not answer.** Ask: "The plan does not say `<X>`. What should it be?"
6. **Anything touching visuals, prayer times, `releases.json`, `uat` or EAS.** Ask before touching it.
7. **A phone is not on the bench.** `adb -s 8f7ada76 get-state` or `adb -s G6RWBAQ4VKWWEAIZ get-state` does not print
   `device`. Ask: "The `<phone>` does not answer adb. Step 4's proof needs it. Should I wait, or stop here?"
8. **The rendered names are still clipped after step 4's build.** Ask: "You reported the names are still clipped at
   a granted width of `<n>`dp. The plan's arithmetic predicted they would fit. Should I stop for a replan?"

## 3. Pre-flight

Save this to `$TMPDIR/preflight-15d.sh` and run `bash $TMPDIR/preflight-15d.sh <k>`, where `<k>` is the first step in
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
  -e 'ai/plans/15d-android-widget-proportional-sizing/PLAN.md' \
  -e 'ai/plans/15d-android-widget-proportional-sizing/LOG.md')
[ -z "$DIRTY" ] || { echo "FAIL: unexpected changes:"; echo "$DIRTY"; exit 1; }

git fetch -q origin uat-2
git merge-base --is-ancestor origin/uat-2 uat-2 || { echo "FAIL: uat-2 is behind origin/uat-2"; exit 1; }

VERSION=$(node -p "require('./package.json').version")
echo "version: $VERSION (planned at 1.27.338, must not be lower)"

A=ai/plans/15d-android-widget-proportional-sizing/scripts/anchors
K=modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/WidgetRefreshScheduler.kt
count() {
  local n
  n=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$A/$1.txt" "$2")
  echo "anchor $1: $n"
  [ "$n" = "1" ] || { echo "FAIL: anchor $1 counted $n, expected 1 -> NEEDS REPLAN"; exit 1; }
}
[ "$STEP" -le 1 ] && { count 1-1 widgets/PrayerWidget.tsx; count 1-2 widgets/PrayerWidget.tsx; count 1-3 widgets/PrayerWidget.tsx; }
[ "$STEP" -le 2 ] && count 2-1 shared/widgetTypes.ts
[ "$STEP" -le 3 ] && { count 3-1 "$K"; count 3-2 "$K"; }

for SERIAL in 8f7ada76 G6RWBAQ4VKWWEAIZ; do
  STATE=$(adb -s "$SERIAL" get-state 2>&1 | tr -d '\r')
  echo "device $SERIAL: $STATE"
  [ "$STATE" = "device" ] || { echo "FAIL: $SERIAL not attached (section 2.2 item 7)"; exit 1; }
done

echo "PREFLIGHT OK"
```

Expected tail: each anchor prints `1`, each device prints `device`, and the last line is `PREFLIGHT OK`. An anchor
count other than 1 means NEEDS REPLAN. Any other failure means STOP.

## 4. Background the executor needs

### Code map

| File | What it does |
| --- | --- |
| `widgets/PrayerWidget.tsx` | The one `'widget'` layout backing all 8 home kinds. Its `androidRender` builds the Glance composition; the medium branch is the final return, where the fixed widths are used. |
| `shared/widgetTypes.ts` | The props contract. `PrayerWidgetAndroidProps` is the Android snapshot, stamped per kind with `theme` and `size`. |
| `modules/widgetrefresh/.../WidgetRefreshScheduler.kt` | The native minute chain. `patchCompositionSize` already reads each placed id's `OPTION_APPWIDGET_MIN_WIDTH` and stamps `size` into the kind's stored props before the re-render. |
| `shared/__tests__/widgetRenderer.test.ts` | Renders the real layout against mocked component globals and asserts the Android composition. Pins the current fixed widths. |
| `shared/widgetTimeline.ts` | `buildPrayerWidgetSnapshot`, the PURE snapshot builder shared with iOS. It never learns a launcher grant, which is why the stamp is not its job. |

Anchors, each saved in full under `scripts/anchors/` and each counting exactly 1 at `7b38e5a6`:

| Anchor | File | Line hint | What it locates |
| --- | --- | --- | --- |
| `1-1.txt` | `widgets/PrayerWidget.tsx` | 207 | The fixed-width constants and the comment recording the 3T failure |
| `1-2.txt` | `widgets/PrayerWidget.tsx` | 395 | The medium branch's return, where `HERO_WIDTH` and `LIST_WIDTH` are consumed |
| `1-3.txt` | `widgets/PrayerWidget.tsx` | 380 | `ARowLine`, where the name and time boxes are sized |
| `2-1.txt` | `shared/widgetTypes.ts` | 154 | `PrayerWidgetAndroidProps` |
| `3-1.txt` | `.../WidgetRefreshScheduler.kt` | 31 | The scheduler's constants |
| `3-2.txt` | `.../WidgetRefreshScheduler.kt` | 64 | `patchCompositionSize` |

### How the pieces interact

The Android widget has no timeline. One snapshot carries the whole window, and the layout computes what to show at
render time. Two writers touch a kind's stored props, and the order between them is what makes the stamp correct.

| Event | Who writes | What it writes | Effect on `grantedWidthDp` |
| --- | --- | --- | --- |
| App pushes a snapshot | JS, `stores/widget.ts` | The whole props object, per kind, with `theme` and `size` | The stamp is LOST: JS cannot know the grant. The layout falls back to the declared minimum until the next tick. |
| Native minute tick | `WidgetRefreshScheduler.updateAll` | Patches `size` into the stored props, then broadcasts the update | Re-stamps `grantedWidthDp` from the live `OPTION_APPWIDGET_MIN_WIDTH`, at most 60 seconds after a push |
| User changes the home grid, or display size | The launcher re-grants each placed id | Nothing of ours | The next tick reads the new grant and re-stamps it, so the layout re-proportions within a minute |
| Widget is placed | The launcher | Nothing of ours | The first tick after placement stamps the grant |

The fallback window is what makes the design safe: a freshly pushed snapshot renders at the declared minimum, which is
310dp for the medium. Section 5's arithmetic shows the content fits inside 310dp, so the fallback render is correct,
never clipped. It is only less generous than the phone could afford, and the next tick corrects it.

### Existing tests

| File | Test | What it proves |
| --- | --- | --- |
| `shared/__tests__/widgetRenderer.test.ts` | `bounds the active pill to the list column, not the card remainder` | The list column is exactly `LIST_WIDTH` and the pill spans it. **This is the test that pins the fixed 162dp and must change.** |
| `shared/__tests__/widgetRenderer.test.ts` | `pads the medium composition 16dp at the bottom, both themes` | The outer row's padding is `[13,13,20,16]`, the numbers this plan's arithmetic subtracts |
| `shared/__tests__/widgetRenderer.test.ts` | `pads the active pill 2dp above and below its row` | The pill's height and offset track `A_ROW_HEIGHT`, which this plan does not change |
| `shared/__tests__/widgetContract.test.ts` | the whole suite | The layout stays serializable: no module-scope references inside the widget body |
| `shared/__tests__/widgetTimeline.test.ts` | the whole suite | The pure builder's output, which this plan does not change |

All 33 renderer tests and all 61 contract and timeline tests passed in the scratch worktree with the change applied,
once the one pinning test was updated. Verified 2026-09-24.

### Why the obvious simple fix is wrong

Three obvious fixes were measured and rejected.

**Raising `minWidth` to fit the content.** The 3T's launcher computes spans as `ceil((minWidth + 30) / 70)` and HIDES
a provider too wide for the grid rather than clamping it: 400dp made the provider invisible in the 3T picker
(`ai/AGENTS.md`, session 15b). Raising the declared minimum buys width on one phone by removing the widget from
another. It also does not help, because `minWidth` is still only a floor.

**Using a `fillMaxWidth` fraction or a `weight`.** Neither is reachable. `expo-widgets` 58.0.3's Glance converter
maps `fillMaxWidth` to a bare `GlanceModifier.fillMaxWidth()`, discarding the `fraction` field that `@expo/ui`'s
`FillMaxWidthParams` carries, and its `when` has no `weight` case, so `weight()` falls through to the
`else -> null` branch and becomes a no-op. This is verified twice over: in the converter source at
`ExpoWidgetEmittableTree.kt:400-421`, and against the Glance 1.2.0 API itself, where `RowScope.defaultWeight` and
`fillMaxWidth` exist but the converter reaches neither with a fraction. **This also explains the failure the source
comment at `PrayerWidget.tsx:207` records**: the hero's `fillMaxWidth` fraction "took the full card and squeezed the
day list to zero width" on the 3T because the dropped fraction became 1.0. Session 15b read that as a Glance quirk
and pinned the widths; it was a converter bug all along.

**Tuning a second set of constants against the X8.** Forbidden by the owner's ruling, and wrong on the measurement:
the X8 is not special. Section 5's table shows that a user re-columning the 3T's home grid to 6 columns reproduces
the same clipping on the phone that currently works.

## 5. Design

**The invariant, as one sentence a test can check:** the Android medium composition's column widths sum to exactly
the granted width minus the card's horizontal padding, at every granted width, so no child is ever clipped.

### The chosen approach

The layout stops holding widths and starts holding PROPORTIONS. Four reference constants describe the look the owner
approved, expressed against the width the 3T grants; every rendered width is that proportion of the width the
launcher actually granted, which arrives on the snapshot as `grantedWidthDp`.

```
innerWidth = grantedWidth - 13 (start pad) - 20 (end pad)
scale      = innerWidth / 347          (347 = the 3T's inner width, the reference)
HERO_WIDTH = round(170 * scale)
LIST_WIDTH = innerWidth - HERO_WIDTH   (the remainder, so the two always sum exactly)
```

`LIST_WIDTH` takes the remainder rather than its own rounded share, which is what makes the invariant exact: two
independently rounded shares can sum to one dp more than the inner width, and one dp of overflow is one clipped
glyph in Glance.

The row text scales with its box. Glance cannot shrink text to fit, so a name box narrowed by a tight grant would
clip `Last Third` at a fixed 13sp. `rowTextSize` is `13 * scale`, clamped to a 10sp floor and a 13sp ceiling.

Measured at every width both phones and a re-columned grid can produce:

| Granted | Inner | Hero | List | Name box | Row text | `Last Third` | Sums exactly |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 380 (3T today) | 347 | 170 | 177 | 82 | 13sp | fits | yes |
| 360 (X8, 480 override) | 327 | 160 | 167 | 77 | 12sp | fits | yes |
| 330 | 297 | 146 | 151 | 70 | 11sp | fits | yes |
| 310 (declared minimum, the fallback) | 277 | 136 | 141 | 65 | 10sp | fits | yes |
| 309 (X8, native 560) | 276 | 135 | 141 | 65 | 10sp | fits | yes |
| 258 (6-column grid, X8 native) | 225 | 110 | 115 | 53 | 10sp | fits | yes |

At the 3T's real grant the arithmetic returns 170 and 177, so the phone the look was approved on keeps its approved
proportions. That is the pixel-stability argument: this is a fix, not a redesign.

### Alternatives rejected

| Alternative | Why rejected |
| --- | --- |
| Glance `weight()` / `fillMaxWidth(fraction)` | Unreachable: the converter drops the fraction and has no weight case. Verified in source. This is also the true cause of the 15b 3T failure. |
| Patch `expo-widgets`' converter and use real weights | The owner chose the props stamp. A layout whose correctness lives inside a patched dependency is fragile, and a fraction cannot express "this name column needs at least N dp of text". |
| Raise the providers' `minWidth` | The 3T hides providers too wide for its grid (400dp vanished from the picker). Buys width on one phone by losing the widget on another. |
| Tune a second constant set for the X8 | Forbidden by the owner's ruling, and it would not survive a user re-columning their home grid. |
| Let the small kinds scale too | The small composition is hero-only, has no multi-column arithmetic and cannot overflow. Out of scope by the brief's step 5. |

### The concurrency trace

| Caller | Before the change | After the change |
| --- | --- | --- |
| JS snapshot push (`stores/widget.ts`) | Writes props per kind with `theme` and `size` | Unchanged. `grantedWidthDp` is absent, so the layout uses the 310dp fallback until the next tick, which renders correctly. |
| Native minute tick (`updateAll`) | Patches `size`, broadcasts the update | Also patches `grantedWidthDp` from the live `OPTION_APPWIDGET_MIN_WIDTH`. Same single `commit()`, so no new write path. |
| Boot / `MY_PACKAGE_REPLACED` | Re-arms the chain | Unchanged. The first tick after re-arming stamps the width. |
| User changes grid or display size | Nothing re-proportioned; the layout clipped | The launcher re-grants; the next tick re-stamps; the layout re-proportions within a minute. |
| Widget freshly placed | First tick stamps `size` | First tick stamps `size` and the width together. |

### The design review

Reviewed by the planning session against the code and the library source on 2026-09-24, and proven in a scratch
worktree at `~/athan-device-sweep/worktrees/plan-15d` (removed after the proof). What the review found, and what
changed as a result:

1. **`grantedWidthDp` cannot be required on the snapshot.** `buildPrayerWidgetSnapshot` is pure and shared with iOS;
   making the field required failed `tsc` with
   `shared/widgetTimeline.ts(298,3): error TS2741: Property 'grantedWidthDp' is missing`. Changed to optional, which
   also matches how `theme` and `size` are stamped. Decision 5.
2. **Proportional scaling alone still clips `Last Third`.** At a 309dp grant the name box is 65dp while `Last Third`
   needs about 68dp at 13sp, and Glance has no autoshrink. Added the scaled row text with a 10sp floor. Decision 4.
3. **Two independently rounded shares can overflow by a dp.** Changed `LIST_WIDTH` to take the remainder, which makes
   the invariant exact at every width in the table above.

What the spike proved, and what it taught:

- The change compiles: `npx tsc --noEmit` exits 0.
- Exactly one existing test fails before the test is updated, and it is the one pinning the old fixed width:
  `bounds the active pill to the list column, not the card remainder`, failing at
  `shared/__tests__/widgetRenderer.test.ts:625` with `expect(received).toBeDefined() / Received: undefined`, because
  it searches for a Box of `width === 162`.
- With that test updated to the 3T's real grant, the suite reports `Tests: 33 passed, 33 total`.
- `widgetContract.test.ts` and `widgetTimeline.test.ts` together report `Tests: 61 passed, 61 total`, unchanged.
- Biome requires the `grantedWidth` ternary on ONE line; split across two it reports a formatter error. Step 1 gives
  that line verbatim for this reason.

The spike's code was deleted and does not become the plan.

## 6. Steps

- [x] Step 1: DONE in 609d28be (amended), merged 56e51a40
- [x] Step 2: folded into step 1, DONE with it
- [x] Step 3: DONE in 170a5dc0, merged c833df34
- [x] Step 4: DONE, proven on the Find X8 at 480 and 560 density

**Correction, made while executing 2026-09-24.** The plan originally claimed step 1 could land before step 2 because
the layout reads the field "through an optional access that type-checks before the field exists". That is false:
`tsc` rejects reading an undeclared property, with
`widgets/PrayerWidget.tsx(387,32): error TS2339: Property 'grantedWidthDp' does not exist on type
'PrayerWidgetAndroidProps'`. The contract must exist before the code that reads it, so step 1 carries
`shared/widgetTypes.ts` and step 2's field with it. Step 2 is therefore folded into step 1, and the checklist above
records it as DONE by step 1. Each step still leaves `uat-2` green, which was the point of the ordering.

### Step 1: The medium composition computes its columns from the granted width

0. **Anchor check.** Run the section 3 count for `1-1`, `1-2` and `1-3`. Each must print `1`. Any other count means
   NEEDS REPLAN.
1. **Goal:** the Android medium composition derives every column width from the width the launcher granted, so the
   columns can never sum past the card.
2. **Branch:** `git checkout -b fix/15d-proportional-medium uat-2`
3. **Files:** `widgets/PrayerWidget.tsx`, `shared/widgetTypes.ts`, `shared/__tests__/widgetRenderer.test.ts`. Nothing
   else may change, apart from `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`. `shared/widgetTypes.ts`
   is here because of the correction above: the field must exist before the layout can read it.
4. **Tests first (red).** Suite: `shared/__tests__/widgetRenderer.test.ts` (existing).

   One existing test CHANGES, because it pins the width this step makes dynamic:

   | Test | Why it changes |
   | --- | --- |
   | `bounds the active pill to the list column, not the card remainder` | It searches for a Box of `width === 162`. Change the two `androidProps({ size: 'medium' })` calls inside THIS test to `androidProps({ size: 'medium', grantedWidthDp: 380 })`, and the `mod.value === 162` comparison to `mod.value === 177`. 380dp is the 3T's real grant, and 177 is what the arithmetic returns for it. |

   These tests must NOT change: `pads the medium composition 16dp at the bottom, both themes`,
   `pads the active pill 2dp above and below its row`, `rolls the medium day list to the next prayer's day after the
   last row passes`, and every iOS-path test.

   New tests, added to the `Android path (jetpack globals)` describe block:

   | Test name | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | `sizes the medium columns from the granted width` | The columns are shares of the grant, not constants | `androidProps({ size: 'medium', grantedWidthDp: 360 })`, now frozen at `at(DAY_ONE, '14:08')` | A Box exists with `{ modifier: 'width', value: 167 }` (the list) and a Box with `{ modifier: 'width', value: 160 }` (the hero) |
   | `never lets the medium columns sum past the granted width` | The invariant, across the range | For each of 380, 360, 330, 310, 285 and 258 as `grantedWidthDp`, frozen at `at(DAY_ONE, '14:08')` | The hero width plus the list width equals `grantedWidthDp - 33`, exactly, at every one of the six widths |
   | `falls back to the declared minimum when the width is not stamped` | A fresh JS push renders correctly | `androidProps({ size: 'medium' })` with no `grantedWidthDp`, frozen at `at(DAY_ONE, '14:08')` | The hero width is 136 and the list width is 141, the values for a 310dp grant |
   | `shrinks the row text with the box so long names are not clipped` | Names survive a tight grant | `androidProps({ size: 'medium', grantedWidthDp: 309 })`, frozen at `at(DAY_ONE, '14:08')` | Every row-name Text carries `style.fontSize` of 10, not 13 |
   | `keeps the row text at 13sp when the grant is generous` | The approved look is unchanged on the 3T | `androidProps({ size: 'medium', grantedWidthDp: 380 })`, frozen at `at(DAY_ONE, '14:08')` | Every row-name Text carries `style.fontSize` of 13 |

   Follow `__tests__/README.md`, which the executor reads before writing the first one. Find the widths by collecting
   the tree and reading each Box's `width` modifier, the way the existing pill test does.

   Command: `npx jest shared/__tests__/widgetRenderer.test.ts --watchman=false --selectProjects=unit`

   Expected BEFORE the change: the five new tests fail, and the changed test fails at
   `shared/__tests__/widgetRenderer.test.ts` with `expect(received).toBeDefined()` / `Received: undefined`, because
   no Box has `width === 177` while the constant is still 162. If any other test fails, or these pass, STOP.

5. **Change.** This step is `(specified)`: build it from the contracts below.

   Replace the fixed-width constants with reference proportions. At anchor `1-1`, the four constants `HERO_WIDTH`,
   `ROW_NAME_WIDTH` and `ROW_TIME_WIDTH` are replaced by reference constants, and at the `LIST_WIDTH` declaration
   that constant is replaced by the fallback and padding constants. The contracts:

   | Name | Value | What it means |
   | --- | --- | --- |
   | `REFERENCE_INNER_WIDTH` | `347` | The inner width the 3T grants, the denominator every proportion is taken against |
   | `REFERENCE_HERO_WIDTH` | `170` | The hero's approved width at the reference inner width |
   | `REFERENCE_NAME_WIDTH` | `82` | The name box's approved width at the reference inner width |
   | `REFERENCE_TIME_WIDTH` | `54` | The time box's approved width at the reference inner width |
   | `ANDROID_MEDIUM_MIN_WIDTH` | `310` | The medium provider's declared minimum, used until a tick stamps the real grant |
   | `CARD_PAD_START` | `13` | The card's start padding, already passed to `APad` in the medium's outer Row |
   | `CARD_PAD_END` | `20` | The card's end padding, already passed to `APad` in the medium's outer Row |
   | `ROW_TEXT_MIN_SIZE` | `10` | The floor the row text never scales below |

   `A_ROW_HEIGHT`, `ROW_TEXT_SIZE`, `FOOTER_BOTTOM_PAD`, `PILL_VPAD`, `ROW_CORNER_RADIUS`, `MEDIUM_LIST_WIDTH` and
   `ROW_HEIGHT` are unchanged. `MEDIUM_LIST_WIDTH` is the iOS list width and this step must not touch it.

   Inside `androidRender`, after the `if (!isMedium || !listValid) { return ACard(footer, trio); }` guard at anchor
   `1-2` and before the `ARowLine` definition at anchor `1-3`, compute the widths. The contract, as locals of the
   medium branch:

   | Local | Answers | Must never |
   | --- | --- | --- |
   | `grantedWidth` | The width to lay out against: the stamped grant when it is a positive number, otherwise `ANDROID_MEDIUM_MIN_WIDTH` | Be zero or negative, which would make every width negative |
   | `innerWidth` | `grantedWidth - CARD_PAD_START - CARD_PAD_END` | Disagree with the `APad` values in the same return |
   | `scale` | `innerWidth / REFERENCE_INNER_WIDTH` | Be recomputed per row; it is one value for the whole composition |
   | `HERO_WIDTH` | `Math.round(REFERENCE_HERO_WIDTH * scale)` | |
   | `LIST_WIDTH` | `innerWidth - HERO_WIDTH`, the REMAINDER | Be independently rounded: two rounded shares can sum past `innerWidth`, and one dp of overflow clips a glyph |
   | `ROW_NAME_WIDTH` | `Math.round(REFERENCE_NAME_WIDTH * scale)` | |
   | `ROW_TIME_WIDTH` | `Math.round(REFERENCE_TIME_WIDTH * scale)` | |
   | `rowTextSize` | `Math.max(ROW_TEXT_MIN_SIZE, Math.min(ROW_TEXT_SIZE, Math.round(ROW_TEXT_SIZE * scale)))` | Exceed `ROW_TEXT_SIZE`, which would enlarge the approved look on a wide grant |

   Two lines are given verbatim, because Biome's formatter rejects the alternative shapes and because the fallback's
   type guard must be exact:

   ```tsx
    const stampedWidth = input.grantedWidthDp;
    const grantedWidth = typeof stampedWidth === 'number' && stampedWidth > 0 ? stampedWidth : ANDROID_MEDIUM_MIN_WIDTH;
   ```

   In `ARowLine` at anchor `1-3`, the two `AText`/`ATimeText` calls pass `rowTextSize` in place of `ROW_TEXT_SIZE`.
   The `Box` modifiers keep `width(ROW_NAME_WIDTH)` and `width(ROW_TIME_WIDTH)`, which now hold the computed values.
   `ARowLine` must be defined AFTER the width computation so it closes over the computed locals.

   The comment at anchor `1-1` that records the 3T `fillMaxWidth` failure is replaced by a comment recording the real
   cause: the converter drops the fraction and ignores weight, so neither Glance proportional primitive is reachable
   and the width arrives on the snapshot instead. Comments explain why, never what.

   The invariant this step keeps: the medium composition's column widths sum to exactly the granted width minus the
   card's horizontal padding, at every granted width.

6. **Green.** The same command. Expected: `Tests:       38 passed, 38 total`. Then `npx tsc --noEmit` and
   `npx biome check . --error-on-warnings`, both exit 0.

7. **Breaks.** Save to `$TMPDIR/breaks-15d-1.sh` and run `bash $TMPDIR/breaks-15d-1.sh` from the repository root.

```bash
#!/usr/bin/env bash
set -u
cd /Users/muji/repos/rn.athan.uk || exit 1
FILE=widgets/PrayerWidget.tsx
SUITE=shared/__tests__/widgetRenderer.test.ts
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

run_break "list takes its own rounded share instead of the remainder" \
  "const LIST_WIDTH = innerWidth - HERO_WIDTH;" \
  "const LIST_WIDTH = Math.round(innerWidth - REFERENCE_HERO_WIDTH * scale) + 1;"

run_break "hero ignores the scale and stays fixed" \
  "const HERO_WIDTH = Math.round(REFERENCE_HERO_WIDTH * scale);" \
  "const HERO_WIDTH = REFERENCE_HERO_WIDTH;"

run_break "the fallback ignores the declared minimum" \
  "ANDROID_MEDIUM_MIN_WIDTH;" \
  "347;"

run_break "the name box ignores the scale" \
  "const ROW_NAME_WIDTH = Math.round(REFERENCE_NAME_WIDTH * scale);" \
  "const ROW_NAME_WIDTH = REFERENCE_NAME_WIDTH;"

run_break "the row text never shrinks" \
  "const rowTextSize = Math.max(ROW_TEXT_MIN_SIZE, Math.min(ROW_TEXT_SIZE, Math.round(ROW_TEXT_SIZE * scale)));" \
  "const rowTextSize = ROW_TEXT_SIZE;"

run_break "the row text ignores its ceiling and grows on a wide grant" \
  "Math.min(ROW_TEXT_SIZE, Math.round(ROW_TEXT_SIZE * scale))" \
  "Math.round(ROW_TEXT_SIZE * scale)"

run_break "the inner width forgets the card padding" \
  "const innerWidth = grantedWidth - CARD_PAD_START - CARD_PAD_END;" \
  "const innerWidth = grantedWidth;"

echo "caught $CAUGHT of $TOTAL"
[ "$CAUGHT" = "$TOTAL" ] && echo "ALL AS EXPECTED: 1"
```

   Every break's search text is text this plan fixes: a name a contract gives, or a line given verbatim. Expected:
   each of the seven prints `caught: <label>`, then `caught 7 of 7`, then `ALL AS EXPECTED: 1`. Each break is caught
   by `never lets the medium columns sum past the granted width` or `sizes the medium columns from the granted
   width`, except the text breaks, caught by the two row-text tests, and the fallback break, caught by `falls back to
   the declared minimum when the width is not stamped`. A `BREAK NOT APPLIED` line means STOP (section 2.2, item 3).
   Afterwards `git status --porcelain` must list no `.bak` file.

8. **Version and commit.** Run `node -p "require('./package.json').version"` on `uat-2` and take the next patch. Set
   it in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`); all three must match.

   Add by name: `widgets/PrayerWidget.tsx`, `shared/__tests__/widgetRenderer.test.ts`, `app.json`, `package.json`,
   plus `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md` when this session changed them.

   Write to `$TMPDIR/msg-1.txt`, replacing `<VERSION>`:

```
<VERSION> - fix(widgets): the Android medium sizes its columns from the granted width

The medium composition laid itself out from 332dp of fixed columns inside a
card the provider declares at minWidth 310dp. minWidth is a floor the launcher
must respect, not a width it grants, so a launcher granting close to the
minimum overflowed the Row and Glance clipped the first child: the Find X8
showed prayer names sliced from the left.

Every column is now a share of the width the launcher actually granted, which
arrives on the snapshot. The list takes the remainder rather than its own
rounded share, so the columns sum to the inner width exactly at every grant.
The row text scales with its box, floored at 10sp, because Glance cannot
shrink text to fit and a narrowed name box would clip "Last Third".

At the 3T's granted width the arithmetic returns the approved 170dp hero, so
the look the owner settled on 2026-09-20 is unchanged on that phone.

Neither Glance proportional primitive was available: expo-widgets 58.0.3's
converter maps fillMaxWidth(fraction) to a bare fillMaxWidth() and has no
weight case. That is also the real cause of the 3T failure recorded in the
comment this commit replaces.
```

   Commit with `git commit -F $TMPDIR/msg-1.txt` in the background. In the log, the last `Tests:` line ends
   `passed, <n> total`, and four `100%` coverage lines are present.

9. **Review.** No subagent (section 11). Read `git show <sha>` in full and check each line below, recording the
   verdict and any finding in `LOG.md`:

   - every contract in part 5 is kept: the eight constants with the values the table gives, and each computed local
     answering what its row says;
   - `LIST_WIDTH` is the remainder (`innerWidth - HERO_WIDTH`), never an independently rounded share;
   - `rowTextSize` is clamped both ways, floored at `ROW_TEXT_MIN_SIZE` and capped at `ROW_TEXT_SIZE`;
   - the two verbatim lines the plan gives appear exactly as given;
   - `ARowLine` is defined after the width computation and closes over the computed locals;
   - nothing outside `widgets/PrayerWidget.tsx` and `shared/__tests__/widgetRenderer.test.ts` changed, apart from
     `app.json`, `package.json`, `ai/plans/README.md` and the plan folder;
   - `MEDIUM_LIST_WIDTH`, `ROW_HEIGHT`, `A_ROW_HEIGHT`, `FOOTER_BOTTOM_PAD`, `PILL_VPAD` and the iOS branch are
     untouched;
   - no colour, weight, padding or corner radius changed: this commit changes sizing only;
   - comments explain why, never what.

   Every line passing is the "merge" verdict. A line failing is fixed before the merge, by amending the commit, and
   the fix is recorded in `LOG.md`.

10. **Merge.** `git checkout uat-2 && git merge --no-ff fix/15d-proportional-medium -m "Merge fix/15d-proportional-medium into uat-2: the Android medium sizes its columns from the granted width, reviewed"`

11. **Done when:**
    - `npx jest shared/__tests__/widgetRenderer.test.ts --watchman=false --selectProjects=unit` prints
      `Tests:       38 passed, 38 total`;
    - `npx tsc --noEmit` exits 0;
    - `npx biome check . --error-on-warnings` exits 0;
    - `bash $TMPDIR/breaks-15d-1.sh` ends `ALL AS EXPECTED: 1`;
    - `git log --oneline -1 uat-2` shows the merge.

### Step 2: The snapshot carries the granted width

0. **Anchor check.** Run the section 3 count for `2-1`. It must print `1`.
1. **Goal:** the Android snapshot contract carries the width the launcher granted, so the native tick has a field to
   stamp and the layout a field to read.
2. **Branch:** `git checkout -b feat/15d-granted-width-prop uat-2`
3. **Files:** `shared/widgetTypes.ts`, `shared/__tests__/widgetContract.test.ts`. Nothing else, apart from
   `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.
4. **Tests first (red).** Suite: `shared/__tests__/widgetContract.test.ts` (existing).

   | Test name | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | `carries the granted width as an optional snapshot field` | The field exists and tolerates absence, so an older build's snapshot still renders | Two `PrayerWidgetAndroidProps` values built from the suite's existing fixture helper: one with `grantedWidthDp: 360`, one without the field | The first reads back `360`; the second reads back `undefined`, and neither construction throws |

   Command: `npx jest shared/__tests__/widgetContract.test.ts --watchman=false --selectProjects=unit`

   Expected BEFORE the change: the new test fails to compile under `tsc`, because `grantedWidthDp` is not a property
   of `PrayerWidgetAndroidProps`. If it passes, STOP.

5. **Change.** This step is `(specified)`.

   At anchor `2-1`, add ONE optional field to `PrayerWidgetAndroidProps`, after `size`:

   | Field | Type | What each value means |
   | --- | --- | --- |
   | `grantedWidthDp` | `number` (optional) | The width the launcher granted this kind, in dp, stamped by `modules/widgetrefresh` from `OPTION_APPWIDGET_MIN_WIDTH`. Absent on a fresh JS push, which cannot know the grant, and on snapshots written by older builds; the layout then falls back to the declared minimum for its size. |

   It is OPTIONAL, not required: `buildPrayerWidgetSnapshot` in `shared/widgetTimeline.ts` is a pure builder shared
   with iOS and cannot know a launcher grant. Making it required fails `tsc` at `shared/widgetTimeline.ts(298,3)`.

   `ANDROID_SNAPSHOT_VERSION` is NOT bumped. The field is additive and optional, and the layout's fallback is what
   handles an older snapshot, so no version gate is needed.

6. **Green.** The same command; the new test passes. Then `npx tsc --noEmit` and
   `npx biome check . --error-on-warnings`, both exit 0.

7. **Breaks.** Save to `$TMPDIR/breaks-15d-2.sh`, run with `bash` from the repository root.

```bash
#!/usr/bin/env bash
set -u
cd /Users/muji/repos/rn.athan.uk || exit 1
FILE=shared/widgetTypes.ts
CAUGHT=0
TOTAL=1

cp "$FILE" "$FILE.bak"
perl -0pi -e "s/\Qgrantedwidthdp?: number;\E/grantedWidthDpMissing?: number;/i" "$FILE"
if cmp -s "$FILE" "$FILE.bak"; then
  echo "BREAK NOT APPLIED: the granted width field is renamed away"
  mv "$FILE.bak" "$FILE"
else
  if npx tsc --noEmit >/dev/null 2>&1; then
    echo "NOT CAUGHT: the granted width field is renamed away"
  else
    echo "caught: the granted width field is renamed away"
    CAUGHT=$((CAUGHT + 1))
  fi
  mv "$FILE.bak" "$FILE"
fi

echo "caught $CAUGHT of $TOTAL"
[ "$CAUGHT" = "$TOTAL" ] && echo "ALL AS EXPECTED: 1"
```

   Expected: `caught: the granted width field is renamed away`, then `caught 1 of 1`, then `ALL AS EXPECTED: 1`. The
   break is caught by `tsc`, because step 1's layout reads the field.

8. **Version and commit.** Next patch after `uat-2`'s `package.json`, set in all three places. Add by name:
   `shared/widgetTypes.ts`, `shared/__tests__/widgetContract.test.ts`, `app.json`, `package.json`, plus the three
   plan files when changed. Message to `$TMPDIR/msg-2.txt`:

```
<VERSION> - feat(widgets): the Android snapshot carries the granted width

One optional field, grantedWidthDp, stamped per kind by the native refresh
tick from OPTION_APPWIDGET_MIN_WIDTH. The medium layout reads it to size its
columns.

Optional rather than required because buildPrayerWidgetSnapshot is a pure
builder shared with iOS and can never know a launcher grant: only the native
tick can. A snapshot without the field renders at the declared minimum, which
is what a fresh JS push and an older build's snapshot both produce.
```

9. **Review.** No subagent (section 11). Read `git show <sha>` in full and check each line below, recording the
   verdict in `LOG.md`:

   - exactly one field was added, `grantedWidthDp`, optional, on `PrayerWidgetAndroidProps`;
   - `ANDROID_SNAPSHOT_VERSION` was NOT bumped;
   - the doc comment says what the value means, where it comes from, and what absence means;
   - nothing else in `shared/widgetTypes.ts` changed, and the iOS `PrayerWidgetProps` is untouched;
   - comments explain why, never what.

   Every line passing is the "merge" verdict. A line failing is fixed before the merge and recorded in `LOG.md`.

10. **Merge.** `git checkout uat-2 && git merge --no-ff feat/15d-granted-width-prop -m "Merge feat/15d-granted-width-prop into uat-2: the Android snapshot carries the granted width, reviewed"`

11. **Done when:** the contract suite passes, `npx tsc --noEmit` exits 0, `npx biome check . --error-on-warnings`
    exits 0, `bash $TMPDIR/breaks-15d-2.sh` ends `ALL AS EXPECTED: 1`, and `git log --oneline -1 uat-2` shows the
    merge.

### Step 3: The native tick stamps the granted width

0. **Anchor check.** Run the section 3 count for `3-1` and `3-2`. Each must print `1`.
1. **Goal:** every minute tick stamps each kind's real granted width into its stored props, so the layout
   re-proportions within a minute of a grid change, a display-size change or a first placement.
2. **Branch:** `git checkout -b feat/15d-stamp-granted-width uat-2`
3. **Files:** `modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/WidgetRefreshScheduler.kt`.
   Nothing else, apart from `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.
4. **Tests first (red).** None. This is Kotlin in a local Expo module, which the Jest projects do not compile: the
   `unit` project runs `*.test.ts` against a hand-written React Native mock, and
   `modules/widgetrefresh/__tests__/index.test.ts` covers only the JS binding, which this step does not change. The
   step's proof is step 4's device proof, where the stamped value is read back from the phone with
   `adb shell dumpsys`. This is stated here so the executor does not go looking for a suite to run.

   Run `npx jest modules/widgetrefresh/__tests__/index.test.ts --watchman=false --selectProjects=unit` before and
   after the change. It must pass both times, unchanged, proving the JS binding is untouched.

5. **Change.** This step is `(specified)`.

   At anchor `3-2`, `patchCompositionSize` already computes `widestDp` from every placed id's
   `OPTION_APPWIDGET_MIN_WIDTH` and writes the kind's props once. Extend that same function so its single write
   carries both stamps. The contract:

   | Item | Contract |
   | --- | --- |
   | Function name | `patchCompositionSize`, unchanged, because its job is still "stamp what the placed ids measure into the kind's props" |
   | Signature | `(context: Context, manager: AppWidgetManager, kind: String, ids: IntArray)`, unchanged |
   | Answers | Nothing; it writes the kind's stored props |
   | Must never | Write twice, or write when nothing changed. One `commit()` carries both fields, and the early return still fires when BOTH the size and the width already match |
   | Must never | Stamp a non-positive width: `widestDp <= 0` already returns early and must keep doing so |
   | Logs | Nothing. This runs on every minute tick and a log line per tick would flood logcat |

   The stored props gain one key, matching step 2's field exactly:

   | Key | Type | What each value means |
   | --- | --- | --- |
   | `grantedWidthDp` | JSON number | The widest placed id's `OPTION_APPWIDGET_MIN_WIDTH` for this kind, in dp |

   The existing early return currently reads `if (props.optString("size") == desired) return`. It must become a check
   that BOTH stamps already match, so a width change alone still triggers a write: return only when the stored
   `size` equals `desired` AND the stored `grantedWidthDp` equals `widestDp`. Read the stored width with
   `optInt("grantedWidthDp", 0)`, so a snapshot written before this field existed compares as 0 and gets stamped.

   `MEDIUM_COMPOSITION_MIN_DP`, `HOME_KINDS`, `updateAll`, `armNext`, `ensureArmed` and `hasPlacedWidgets` are
   unchanged. The comment at anchor `3-1` that explains the size patch is extended to say the same tick now carries
   the granted width, and why: the JS push cannot know the grant, so the native side is the only writer that can.

6. **Green.** `npx jest modules/widgetrefresh/__tests__/index.test.ts --watchman=false --selectProjects=unit` passes,
   unchanged. Then `npx tsc --noEmit` and `npx biome check . --error-on-warnings`, both exit 0. Kotlin is compiled by
   step 4's build, not here.

7. **Breaks.** None, and this is deliberate rather than an omission. The break mechanism is a `perl` substitution
   followed by a Jest run, and no Jest project compiles this Kotlin file, so every substitution here would report
   `NOT CAUGHT` regardless of whether the code is right. Step 4's device proof is what tests this step: the stamped
   value is read back from the phone, and the rendered names are read from a screenshot. A break script that cannot
   fail would be false evidence.

8. **Version and commit.** Next patch, all three places. Add by name: the Kotlin file, `app.json`, `package.json`,
   plus the three plan files when changed. Message to `$TMPDIR/msg-3.txt`:

```
<VERSION> - feat(widgets): the refresh tick stamps each kind's granted width

patchCompositionSize already read every placed id's OPTION_APPWIDGET_MIN_WIDTH
to choose the small or medium composition. It now stamps that width itself, in
the same single write, so the layout can size its columns against what the
launcher actually granted.

The JS push cannot carry this: it has no way to read a launcher grant. The
native tick is the only writer that can, which is why the stamp lives here and
why a freshly pushed snapshot renders at the declared minimum until the next
tick, at most a minute later.

The early return now compares both stamps, so a width change alone still
writes. A grid change, a display-size change or a first placement therefore
re-proportions the widget within a minute.
```

9. **Review.** No subagent (section 11). Read `git show <sha>` in full and check each line below, recording the
   verdict in `LOG.md`:

   - `patchCompositionSize` still writes the kind's props exactly once per tick, with one `commit()`;
   - the early return fires only when BOTH the stored `size` and the stored `grantedWidthDp` already match, so a
     width change alone still writes;
   - the stored width is read with a default of 0, so props written before this field existed are stamped;
   - the `widestDp <= 0` early return is intact, so a non-positive width is never stamped;
   - the JSON key is exactly `grantedWidthDp`, matching `shared/widgetTypes.ts`;
   - nothing logs on the tick path;
   - `MEDIUM_COMPOSITION_MIN_DP`, `HOME_KINDS`, `updateAll`, `armNext`, `ensureArmed` and `hasPlacedWidgets` are
     unchanged;
   - comments explain why, never what.

   Every line passing is the "merge" verdict. A line failing is fixed before the merge and recorded in `LOG.md`.

10. **Merge.** `git checkout uat-2 && git merge --no-ff feat/15d-stamp-granted-width -m "Merge feat/15d-stamp-granted-width into uat-2: the refresh tick stamps each kind's granted width, reviewed"`

11. **Done when:** the widgetrefresh binding suite passes, `npx tsc --noEmit` exits 0,
    `npx biome check . --error-on-warnings` exits 0, and `git log --oneline -1 uat-2` shows the merge.

### Step 4: Device proof on both phones, three densities

0. **Anchor check.** None: this step changes no source file.
1. **Goal:** prove on both Android phones that the six rows show full names, at native density and under a
   display-size override, and that the 3T does not regress.
2. **Branch:** `git checkout -b proof/15d-device uat-2`
3. **Files:** `ai/features/android-widgets-x8/FINDINGS.md` only, plus `ai/plans/README.md` and this folder's `PLAN.md`
   and `LOG.md`.
4. **Tests first (red).** None: this step runs no test suite. Its evidence is the device readings below.
5. **Change.** This step is `(specified)`. No source changes. Run section 7's device proof, then append its readings
   to `ai/features/android-widgets-x8/FINDINGS.md` using section 8's findings text.
6. **Green.** No suite. `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0, unchanged.
7. **Breaks.** None: no code changes in this step.
8. **Version and commit.** Next patch, all three places. Add by name: `ai/features/android-widgets-x8/FINDINGS.md`,
   `app.json`, `package.json`, plus the three plan files. Message to `$TMPDIR/msg-4.txt`:

```
<VERSION> - docs(widgets): the proportional Android medium, proven on both phones

Readings from the OnePlus 3T and the Oppo Find X8, at each phone's native
density and under a display-size override. Records the width each launcher
granted, the columns the layout computed from it, and what the rendered names
read.
```

9. **Review.** No subagent (section 11). Read `git show <sha>` in full and check that every number recorded in
   `ai/features/android-widgets-x8/FINDINGS.md` is one section 7 measured, that no claim goes beyond what those
   commands showed, and that nothing but that file, `app.json`, `package.json` and the plan folder changed. Record
   the verdict in `LOG.md`.

10. **Merge.** `git checkout uat-2 && git merge --no-ff proof/15d-device -m "Merge proof/15d-device into uat-2: the proportional Android medium proven on both phones, reviewed"`

11. **Done when:** section 7's checks all read as its table predicts, the findings text is appended, and
    `git log --oneline -1 uat-2` shows the merge.

## 7. Device proof

Both phones are on the bench and both must answer `adb` (section 2.2, item 7).

| Device | Serial | Android | Density |
| --- | --- | --- | --- |
| OnePlus 3T | `8f7ada76` | 9 (API 28) | 420 |
| Oppo Find X8 | `G6RWBAQ4VKWWEAIZ` | 16 (API 36) | 560 physical, 480 override |

### Safety: the alarm dump before anything else

This session changes NO clock. It needs no clock change, because the widget's minute tick fires on its own every
minute and nothing here depends on a prayer time arriving. Still, read the alarms first, so the executor knows what
is armed:

```
adb -s 8f7ada76 shell dumpsys alarm | grep -A2 "com.mugtaba.athan}"
```

Expected: the app's notification alarms, the widget refresh chain's next minute-edge alarm, and one app alarm at
`when 2104803640505` (year 2036, not identified), which every 3T dump shows. If an alarm appears that this list does
not name, STOP and ask.

**No clock change in this session.** If any step seems to need one, that is a defect in this plan: STOP and ask.

### The build

Both phones need a build with the Android widgets flag on, because a plain `uat-2` build has both widget flags OFF
and shows no widgets at all.

The 3T needs its suffix variables on BOTH prebuild and build:

```
EXPO_ANDROID_SUFFIX=fleettest EXPO_NAME_SUFFIX=FleetTest npx expo prebuild -p android --no-install
```

Bump the version FIRST, then prebuild, then build: `expo run:*` never re-syncs an existing native directory, and
violating that order once shipped code stamped with the wrong version (`ai/AGENTS.md`).

Build the PRODUCTION package, not a mock one, and run it in the background with its log:

```
zsh ~/athan-device-sweep/session15/bin/build-prod-widgets.zsh uat-2 ~/athan-device-sweep/session15d/athan-15d-prod.apk
```

Success ends `BUILD-PROD OK`. That script sets `EXPO_PUBLIC_ANDROID_WIDGETS=1` itself; without the flag no widgets
appear at all. If the script prints `FAILED`, STOP and quote the line.

**It must be the production package.** A mock build installs under `com.mugtaba.athan.fleettest`, and every widget
the owner has PLACED belongs to `com.mugtaba.athan`. An unplaced provider is never measured by the launcher, so the
native tick reads no width and the proof cannot run. `adb install -r` on the production package upgrades in place
and keeps both the app's data and the existing placements. This was found by doing it the wrong way first.

Install with `adb -s <serial> install -r <apk>`, which keeps the app's data. On the X8, ColorOS shows an
install-confirmation dialog for every sideload and `adb install` returns only after it is confirmed: the button reads
"Continue installation", and `uiautomator dump` works on the X8 to read its coordinates.

### The readings

For each phone and each density below, wait for one minute tick to pass so the native stamp lands, then take the
three readings.

| # | Phone | Density | How to set it |
| --- | --- | --- | --- |
| 1 | 3T | 420 (native) | nothing to set |
| 2 | X8 | 480 (the user's override) | nothing to set; this is how the phone arrived |
| 3 | X8 | 560 (native) | `adb -s G6RWBAQ4VKWWEAIZ shell wm density reset` |

**Reading A: the width the launcher granted.** This is the number the whole session turns on.

```
adb -s <serial> shell dumpsys appwidget | grep -A6 "PrayerWidgetMediumProvider"
```

Record the granted width for the placed medium id. Expected: a value at or above the declared 310dp on the 3T, and a
value near 330dp on the X8 at its 480 override. The exact number is what gets recorded; the plan does not predict it
to the dp, because it is the launcher's choice and measuring it is the point.

**Reading B: the columns the layout computed.** Confirm the arithmetic from the granted width:

```
innerWidth = granted - 33
hero       = round(170 * innerWidth / 347)
list       = innerWidth - hero
```

Record all three. The invariant to check by hand: `hero + list` equals `innerWidth` exactly.

**Reading C: what the names read.** Take a screenshot and have it read:

```
python3 ~/athan-device-sweep/session5/bin/devcheck.py shot ~/athan-device-sweep/session15d/<phone>-<density>.png
```

The session cannot see images. Spawn a subagent on the SAME model as this session (section 11), give it the
screenshot's absolute path, and ask it this exact question:

> This screenshot is an Android home screen showing a prayer-times widget. Read the widget's day list from top to
> bottom and write out each row exactly as it appears: the prayer name on the left, the time on the right. If any
> prayer name is cut off at its left edge or missing letters, say which rows and what you see instead. Do not guess
> at what a truncated word was meant to be. Report only what is visible.

When the owner is present, ask them the same question about the phone in front of them instead; their reading wins
over a subagent's.

A PASS is: every row's name is complete, no row is missing letters from its left edge, the times are still
right-aligned, and the pill still spans the list block. On the 3T additionally: the medium is NOT hero-only and the
times are not mislaid, which are the two regressions session 15b's comments record.

If the owner reports names still clipped, STOP (section 2.2, item 8).

Save every screenshot and every dump under `~/athan-device-sweep/session15d/`, as evidence for the audit. The
screenshots are not sent to the owner: they are looking at the phone itself.

### Afterwards

Restore the X8's display-size override, which is the user's own setting and must not be left changed:

```
adb -s G6RWBAQ4VKWWEAIZ shell wm density 480
```

Confirm with `adb -s G6RWBAQ4VKWWEAIZ shell wm density`, which must again print `Override density: 480`.

Both phones are left on the build this step installed, with automatic time ON (no clock was changed, so it was never
turned off). Confirm with `adb -s <serial> shell settings get global auto_time`, which must print `1` on both.

## 8. Records

### Findings text

Append to `ai/features/android-widgets-x8/FINDINGS.md`, under the exact heading
`## Fixed: the medium sizes itself from the granted width (session 15d, 2026-09-__)`:

```markdown
## Fixed: the medium sizes itself from the granted width (session 15d, 2026-09-__)

The medium composition no longer holds widths. It holds proportions, taken against the
width the launcher actually granted, which the native refresh tick stamps into each
kind's props from `OPTION_APPWIDGET_MIN_WIDTH`.

Measured on both phones, at <VERSION>:

| Phone | Density | Granted | Inner | Hero | List | Names read |
| --- | --- | --- | --- | --- | --- | --- |
| OnePlus 3T | 420 | <3T_GRANTED>dp | <3T_INNER>dp | <3T_HERO>dp | <3T_LIST>dp | <3T_NAMES> |
| Find X8 | 480 override | <X8_480_GRANTED>dp | <X8_480_INNER>dp | <X8_480_HERO>dp | <X8_480_LIST>dp | <X8_480_NAMES> |
| Find X8 | 560 native | <X8_560_GRANTED>dp | <X8_560_INNER>dp | <X8_560_HERO>dp | <X8_560_LIST>dp | <X8_560_NAMES> |

At the 3T's granted width the arithmetic returns the 170dp hero the owner approved on
2026-09-20, so that phone's look is unchanged.

### Why neither Glance proportional primitive was used

`expo-widgets` 58.0.3 cannot reach either. Its Glance converter maps
`fillMaxWidth(fraction)` to a bare `GlanceModifier.fillMaxWidth()`, discarding the
`fraction` that `@expo/ui`'s `FillMaxWidthParams` carries, and its `when` has no
`weight` case, so `weight()` falls through to `else -> null` and becomes a no-op
(`node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/ExpoWidgetEmittableTree.kt`,
lines 400 to 421).

That is also the real cause of the failure recorded in `widgets/PrayerWidget.tsx`'s old
comment, where a `fillMaxWidth` fraction on the hero "took the full card and squeezed the
day list to zero width" on the 3T. The fraction was dropped, so 0.5 became 1.0. Session
15b read it as a Glance quirk and pinned the widths, which is how the fixed dp arrived.
Not raised upstream by this session; it is a candidate for a future PR.

### What this means for other launchers

The bug was never specific to the Find X8. A widget's granted width falls below what a
fixed layout assumes whenever the launcher's grid is narrower than the one the constants
were tuned on, which a user can cause on any phone by re-columning their home screen. The
proportional layout holds at every width measured, down to a 258dp grant, which is what a
6-column grid yields on the X8 at native density.
```

Every `<...>` is a placeholder the executor replaces with a value it measured.

### Table rows

The executor sets the `ai/plans/README.md` row 12 status to EXECUTED.

The exact new cell text for the `ai/prompts/README.md` row, which the AUDITOR applies on PASS:

```
DONE (session 15d, <VERSION>): the Android medium composition sizes its columns from the width the launcher grants, stamped per kind by the native refresh tick. Proven on the OnePlus 3T and the Oppo Find X8, at native density and under a display-size override.
```

### Docs commit

The `executed` docs commit message:

```
<VERSION> - docs(plans): session 15d executed: the Android medium sizes itself from the granted width
```

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session pushes `uat-2` after
a PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

### Symptom table

| Symptom | Cause | Action |
| --- | --- | --- |
| An anchor counts other than 1 | `uat-2` moved since this plan was written | NEEDS REPLAN (section 2.2, item 1) |
| `tsc` reports `Property 'grantedWidthDp' is missing` in `shared/widgetTimeline.ts` | The field was made required rather than optional | Make it optional, as step 2's contract says. This is work still to do, not a finding |
| Biome reports a formatter error on the `grantedWidth` line | The ternary was split across two lines | Use the verbatim single line step 1 gives |
| `bounds the active pill to the list column` fails after step 1 | Its `162` and its props were not both updated | Apply step 1's part 4 table exactly: `grantedWidthDp: 380` and `177` |
| A break prints `BREAK NOT APPLIED` | The code does not hold the text the plan fixes | STOP (section 2.2, item 3). Never reshape the code to fit a break |
| A phone does not answer `adb` | It left the bench | STOP (section 2.2, item 7) |
| The X8's install hangs | ColorOS wants its sideload confirmation | Read "Continue installation" from `uiautomator dump` and tap it. Not a failure |
| No widgets appear after install | The build lacked `EXPO_PUBLIC_ANDROID_WIDGETS=1` | Rebuild with the flag set. A plain `uat-2` build has both widget flags OFF |
| The widget still shows old proportions | No minute tick has landed since the push | Wait one minute and re-read. The stamp lands at the next tick, by design |
| The owner reports names still clipped | The arithmetic did not hold on that launcher | STOP (section 2.2, item 8) |
| The 3T's medium renders hero-only | The hero starved the list, the 15b regression | STOP and ask. This is the failure the design is built to avoid |
| Anything else | | `EXECUTOR-BRIEF.md` section 7's table |

### Anticipated review fixes

These are the only fixes the executor may make to anything this plan fixed. Each is given word for word.

1. **If the reviewer says the two rounded shares can overflow:** change `LIST_WIDTH` to `innerWidth - HERO_WIDTH`,
   the remainder, which is what step 1's contract already requires.
2. **If the reviewer says `rowTextSize` can exceed the approved size:** wrap the scaled value in
   `Math.min(ROW_TEXT_SIZE, ...)`, which is what step 1's contract already requires.
3. **If the reviewer says a width of 0 would produce negative columns:** the guard
   `typeof stampedWidth === 'number' && stampedWidth > 0` is what step 1 gives verbatim; restore it exactly.
4. **If the reviewer says step 3 could write twice per tick:** keep the single `commit()` and widen the early return
   to compare both stamps, which is what step 3's contract already requires.

A reviewer finding that meets all three conditions in `EXECUTOR-BRIEF.md` section 4, item 8, the executor applies
itself and records in `LOG.md`. Those three conditions are written there and are never restated here in other words.

### Stopping part-way

| Step | Restore with `git checkout --` | Delete |
| --- | --- | --- |
| 1 | `widgets/PrayerWidget.tsx`, `shared/__tests__/widgetRenderer.test.ts`, `app.json`, `package.json` | any `.bak` file left by the break script |
| 2 | `shared/widgetTypes.ts`, `shared/__tests__/widgetContract.test.ts`, `app.json`, `package.json` | any `.bak` file |
| 3 | `modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/WidgetRefreshScheduler.kt`, `app.json`, `package.json` | nothing |
| 4 | `ai/features/android-widgets-x8/FINDINGS.md`, `app.json`, `package.json` | nothing |

After restoring, follow `EXECUTOR-BRIEF.md` section 4a.

## 11. Subagents in this plan

**None required.** The session does the planning, the execution and the audit itself, looping on its own work until
it is right (`ai/prompts/README.md`, 2026-09-24).

A subagent may be spawned, but only on the SAME model as the session that spawns it, for any task including reading
an image. No model is named here or anywhere in this repository: the harness chooses it, and these pages are read by
different models over the life of the build.

| Instead of | This plan does |
| --- | --- |
| A reviewer subagent per commit | The session reviews its own diff before each merge, against the checklist in each step's part 9, and records the verdict and every finding in `LOG.md` |
| A vision subagent reading each screenshot | The session asks the OWNER the question in section 7, Reading C, and waits. A same-model subagent may read the screenshot instead when the owner is away |

## 12. Report to the owner

The final message starts with `🤖  Model: GLM 5.3 (execution session)` and a `Time:` line from
`date '+%H:%M:%S %d.%m.%Y'`, then:

- a few plain sentences: what changed, what the granted width measured on each phone, and what the owner read back
  from each screen;
- the progress table, in `EXECUTOR-BRIEF.md` section 6's format;
- any decision now waiting on the owner;
- the four-line handoff from the `athan-next` skill, section 5.
