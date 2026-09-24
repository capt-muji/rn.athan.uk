# Plan: Session 19. Widget polish: the Android dark card, the active pill, the horizon, and the iOS flag

| Field | Value |
| --- | --- |
| Brief | `ai/prompts/widget-polish-and-horizon.md` |
| Planned at | `5926e35f` (version 1.27.357), 2026-09-24 |
| Planned by | Planning session on 2026-09-24 |
| Needs first | nothing |
| Steps | 5: four code steps, each one branch, one commit, one version, plus step 5, the device proof, which writes no source and commits nothing of its own |
| Device | OnePlus 3T (`8f7ada76`) on a local production build with `EXPO_PUBLIC_ANDROID_WIDGETS=1`, and the iPhone XS (`00008020-0015585C22D2002E`) on a local Release build. The owner holds both phones for the placements. |
| Owner decisions still needed | None (every one was taken while planning; see section 2) |

## 1. Goal

Four things the owner found testing on the iPhone XS and an Android phone on 2026-09-24. Android's dark widget card is
a bright purple (`#252387`) while iOS's is a near-black navy, because the two literals were never reconciled. The
Android active pill fills the whole list column while the row text sits 12dp inside it, so the pill hangs past the
times by 21dp at a 310dp grant and more as the screen widens. The widget timeline carries a 30-day horizon, which is
longer than the horizon's job needs. And the iOS widgets flag is still OFF although the upstream fix it waits on has
shipped.

When this plan is DONE: the Android dark card renders the same near-black navy as iOS; the active pill wraps the row
text with the same 12dp of air on both sides at every granted width; `TIMELINE_DAYS` is 7 and its guards are re-sized
to that horizon; and `FEATURE_FLAGS.widgets` ships ON, verified on the XS by the G.1 acceptance protocol. The owner
would notice by looking at the Android home screen (a dark card that matches the iPhone, and a pill that no longer
runs past the times) and by finding the widget gallery populated on the iPhone without a special build.

The owner's rules that apply:

🐋  "the iOS has like a dark, really, really dark purple, close to black, and I really love the colour of it. So I
want Android background colour to match. I want Android to match exactly like iPhone actually." (owner, 2026-09-24,
`ai/prompts/widget-polish-and-horizon.md`)

🐋  "we can shift the whole list to the right and then make the active background smaller on the left side, you know,
shorter on the left side too." (owner, 2026-09-24, same brief, choosing between two options the session offered)

🐋  "the iOS widgets, you said, can probably be turned on. Yes, we do want to turn it on. It should be on anyway."
(owner, 2026-09-24, same brief)

🐋  "visuals are settled, so no pixel changes without the owner's approval" (`PLANNER-BRIEF.md` section 6). Jobs 1 and
2 ARE pixel changes, and both are the owner's own instruction, quoted above. Nothing else in the widget look moves:
the palette beyond the dark card, the pill shape, the row heights, the fonts and the footer lift stay exactly as the
15b, 15c, 15d and 16a rulings left them.

## 2. Decisions

### 2.1 Taken

1. **The Android dark card becomes `#020c24`.** Decided by the planning session, from the owner's "match exactly like
   iPhone" ruling. iOS's `DARK.card` is `rgba(2, 13, 38, 0.95)`, a translucent colour over a wallpaper. Android's card
   is an opaque bitmap by the 2026-09-01 ruling recorded in the generator's own comments, so the match is the iOS
   colour composited over black: `round(2 × 0.95), round(13 × 0.95), round(38 × 0.95)` = `(2, 12, 36)` = `#020c24`.
   Measured while planning. Compositing over black rather than dropping the alpha is what makes it the colour the
   owner is actually looking at on the iPhone, where the card sits on a dark wallpaper.
2. **The rest of the dark palette is already matched, and the audit is recorded rather than acted on.** Decided by the
   planning session, from a measurement the brief asked for. The generator holds 11 colour literals; exactly two sit
   outside the layout's palette, and both are the deliberate opaque card forms (`#fcfcfe` light, `#252387` dark). Every
   other generator literal (the four pill fills, the three pill strokes, the two moon colours) is byte-identical to the
   layout's. So the dark card is the only drift, and job 1 closes the whole finding. Recorded in section 8.
3. **The light card is NOT changed.** Decided by the planning session. iOS's `LIGHT.card` is
   `rgba(252, 252, 254, 0.92)`; over black that is `#e8e8ea`, a grey card. The owner's ruling names the dark card only,
   and the light card's existing `#fcfcfe` is the alpha-dropped form that has been on the phone since 2026-09-19 with
   no complaint. Changing it would be an unrequested pixel change, which the owner's settled-visuals rule forbids.
4. **The pill wraps the row text with 12dp each side, clamped on a narrow grant.** Decided by the owner, 2026-09-24
   (the question offered a fixed 12dp or a width-scaled margin; the owner chose fixed). 12dp is the inset the owner
   already called "perfectly aligned" on the left, so mirroring it on the right is the smallest change that answers
   the complaint. The clamp is the planning session's: at a grant narrower than about 236dp a flat 12dp each side
   costs more than the column has, so the margin takes half the slack instead, which keeps the two sides equal and can
   never overflow. Proven at 11 widths in the scratch worktree, section 5.
5. **The horizon becomes 7 days, and the entry bound becomes a literal 60.** Decided by the owner (7 days,
   2026-09-24, `ai/prompts/widget-polish-and-horizon.md` job 3) and by the planning session (the bound). Session 17's
   bound of 250 was sized for 30 days; at 7 days the builder emits 40 entries, so a 250 bound would guard nothing. 60
   sits above the 40 that ships and below the 58 a 10-day horizon would emit, so it notices a horizon raised past its
   ruling. It stays a literal: a bound derived from `TIMELINE_DAYS` would follow the horizon upward and notice
   nothing, which is the mistake session 17's own comment warns about.
6. **The iOS flag flips by changing `.env.example` and the JSDoc, NOT by inverting the parse.** Decided by the
   planning session, from a measurement. `FEATURE_FLAGS.widgets` is `process.env.EXPO_PUBLIC_WIDGETS === '1'`, and
   `shared/flags.ts` states its own fail direction: "mistakes disable, never enable". Inverting it to `!== '0'`
   reverses that rule and fails 13 tests across 5 suites, including the suite whose entire purpose is to pin the
   shipped default (`flagDefaults.test.ts`). The flag is build-time transport: a build turns widgets on by passing
   `EXPO_PUBLIC_WIDGETS=1`, which every widget build already does. So "on" means the catalog documents it as on and
   the JSDoc stops saying "wait for upstream", not that an absent variable starts enabling a feature. Recorded in
   section 5.
7. **The flag flip is gated on the XS acceptance protocol passing, in the same session.** Decided by the owner,
   2026-09-24 (they confirmed the XS is available and that they will do the taps). The brief is explicit that this
   protocol is part of the job, "not a formality: the flag's whole history is a fix that looked right and was not". So
   step 5 runs the protocol BEFORE step 4's documentation lands, and a failure stops the session with the flag
   untouched.
8. **The flag flips even though G.2 is open.** Decided by the owner, 2026-09-24, asked directly because flipping the
   flag is what makes G.2's ~5 second blank card user-visible. The owner chose to flip now; G.2 is row 16, the very
   next session.
9. **`shared/whatsNew.ts`'s parked widgets item is NOT stamped in this session.** Decided by the planning session. The
   item is parked at `version: null` and its comment says it ships "with the release that enables the widgets flag".
   This session does not make a store release (the SDK 58 programme forbids one until row 17 is DONE and RN 0.88 is
   out of RC, `ai/plans/README.md` row 6), so stamping it would advertise a feature in a release that is not
   happening. Recorded in section 8 so the release session stamps it.

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
6. **Anything touching visuals beyond the two this plan specifies, prayer times, `releases.json`, `uat` or EAS.** Ask
   before touching it.
7. **A phone is not on the bench.** `adb -s 8f7ada76 get-state` does not print `device`, or
   `xcrun devicectl list devices` does not list `00008020-0015585C22D2002E` as `connected`. Ask: "The `<phone>` does
   not answer. Step `<k>`'s proof needs it. Should I wait, or stop here?"
8. **The XS acceptance protocol fails** (any home kind blank past 10 minutes, any new `cpu_resource` report, or any
   `Watchdog provision violated` line). Ask: "The XS acceptance protocol failed: `<what was seen>`. G.1's fix is not
   proven on the device, so the flag must not flip. Should I stop here and leave step 4 unrun?"
9. **The owner reports the pill still looks wrong on the 3T after step 5's build.** Ask: "You reported the pill still
   overhangs at a granted width of `<n>`dp. The plan's arithmetic predicted 12dp each side. Should I stop for a
   replan?"

## 3. Pre-flight

Save this to `$TMPDIR/preflight-19.sh` and run `bash $TMPDIR/preflight-19.sh <k>`, where `<k>` is the first step in
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
  -e 'ai/plans/19-widget-polish-and-horizon/PLAN.md' \
  -e 'ai/plans/19-widget-polish-and-horizon/LOG.md')
[ -z "$DIRTY" ] || { echo "FAIL: unexpected changes:"; echo "$DIRTY"; exit 1; }

git fetch -q origin uat-2
git merge-base --is-ancestor origin/uat-2 uat-2 || { echo "FAIL: uat-2 is behind origin/uat-2"; exit 1; }

VERSION=$(node -p "require('./package.json').version")
echo "version: $VERSION (planned at 1.27.357, must not be lower)"

A=ai/plans/19-widget-polish-and-horizon/scripts/anchors
count() {
  local n
  n=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$A/$1.txt" "$2")
  echo "anchor $1: $n"
  [ "$n" = "1" ] || { echo "FAIL: anchor $1 counted $n, expected 1 -> NEEDS REPLAN"; exit 1; }
}
[ "$STEP" -le 1 ] && { count 1-1 widgets/PrayerWidget.tsx; count 1-2 widgets/PrayerWidget.tsx; count 1-3 widgets/PrayerWidget.tsx; }
[ "$STEP" -le 2 ] && count 2-1 scripts/generate-widget-assets.py
[ "$STEP" -le 3 ] && count 3-1 shared/widgetTimeline.ts

python3 -c 'import PIL' 2>/dev/null || { echo "FAIL: Pillow missing; step 2 regenerates the PNGs"; exit 1; }
echo "pillow: present"

STATE=$(adb -s 8f7ada76 get-state 2>&1 | tr -d '\r')
echo "device 8f7ada76: $STATE"
[ "$STATE" = "device" ] || { echo "FAIL: the 3T is not attached (section 2.2 item 7)"; exit 1; }

if xcrun devicectl list devices 2>/dev/null | grep -q '00008020-0015585C22D2002E.*connected'; then
  echo "device XS: connected"
else
  echo "FAIL: the iPhone XS is not connected (section 2.2 item 7)"; exit 1
fi

echo "PREFLIGHT OK"
```

Expected tail: each anchor prints `1`, `pillow: present`, `device 8f7ada76: device`, `device XS: connected`, and the
last line `PREFLIGHT OK`. An anchor count other than 1 means NEEDS REPLAN. Any other failure means STOP.

## 4. Background the executor needs

### Code map

| File | What it does |
| --- | --- |
| `widgets/PrayerWidget.tsx` | The one `'widget'` layout backing all 8 home kinds. `androidRender`'s medium branch stacks two sibling columns inside a Box of `width(LIST_WIDTH)`: the pill column and the rows column. Their leading insets are what job 2 changes. |
| `scripts/generate-widget-assets.py` | Draws the Android PNG drawables. Glance cannot render rounded corners, strokes or shadows, so the cards, pills and moon ship as bitmaps. `CARD_DARK` is what job 1 changes. |
| `assets/widgets/*.png` | The 10 committed drawables. Job 1 regenerates exactly two: `athan_widget_card_dark_small` and `athan_widget_card_dark_medium`. |
| `shared/widgetTimeline.ts` | `TIMELINE_DAYS` (job 3) plus the pure iOS timeline builder and the Android snapshot builder. |
| `stores/widget.ts` | Reads `TIMELINE_DAYS` through `buildSequence` for BOTH platforms. Job 3 changes nothing here. |
| `shared/flags.ts` | `FEATURE_FLAGS.widgets`, its JSDoc flip condition, and the fail-direction rule. Job 4 changes the JSDoc only. |
| `.env.example` | The committed variable catalog. Job 4 changes `EXPO_PUBLIC_WIDGETS=0` to `1`. |

Anchors, each saved in full under `scripts/anchors/` and each counting exactly 1 at `5926e35f`:

| Anchor | File | Line hint | What it locates |
| --- | --- | --- | --- |
| `1-1.txt` | `widgets/PrayerWidget.tsx` | 216 | The reference constants, where `ROW_GUTTER` joins them |
| `1-2.txt` | `widgets/PrayerWidget.tsx` | 400 | The row box widths, where the pill geometry is computed after them |
| `1-3.txt` | `widgets/PrayerWidget.tsx` | 441 | The two sibling columns whose leading insets change |
| `2-1.txt` | `scripts/generate-widget-assets.py` | 50 | `CARD_LIGHT` and `CARD_DARK` |
| `3-1.txt` | `shared/widgetTimeline.ts` | 62 | `TIMELINE_DAYS` and its JSDoc |

### How the pieces interact

**The pill and the rows are siblings, not parent and child.** Inside the Box of `width(LIST_WIDTH)`, the medium
stacks a pill column (a Spacer of `activeIndex × A_ROW_HEIGHT`, then the pill image at `fillMaxWidth()`) over a rows
column. The pill's width therefore comes from its column's own width, and today that column has no leading inset, so
`fillMaxWidth()` spans the whole list. The rows column is inset `APad(12, 0, 12, 0)`. The two insets are what put the
text 12dp inside a pill that starts at 0, which is the bug: the slack lands entirely on the right.

| Granted | List column | Name + time | Pill right edge past the times, today |
| --- | --- | --- | --- |
| 310dp | 141 | 108 | 21dp |
| 360dp | 167 | 128 | 27dp |
| 380dp | 177 | 136 | 29dp |
| 420dp | 197 | 151 | 34dp |

**The horizon feeds both platforms.** `TIMELINE_DAYS` is read once, by `buildSequence` in `stores/widget.ts`, which
builds `TIMELINE_DAYS + 1` days (the extra day is yesterday). iOS turns that into one entry per boundary; Android
carries the days themselves and computes at render time. So one constant moves both, and the tests that read it scale
their fixtures with it, which is exactly why the volume bounds must be literals.

**The flag has two readers that must agree.** `shared/flags.ts` gates the JS push paths; `app.config.ts` mirrors the
same variable to strip the `expo-widgets` plugin at prebuild. `shared/__tests__/flags.test.ts` pins them in lockstep.
Neither is changed by this plan: both already do the right thing when a build passes `EXPO_PUBLIC_WIDGETS=1`.

### Existing tests

| File | Test | What it proves |
| --- | --- | --- |
| `shared/__tests__/widgetRenderer.test.ts` | `bounds the active pill to the list column, not the card remainder` | The list column is the grant's share and the pill spans it. **Its pill-column assertion pins the 0 inset and must change.** |
| `shared/__tests__/widgetRenderer.test.ts` | `sizes the row name and time boxes from the granted width` | The name and time boxes are shares of the grant. Must NOT change. |
| `shared/__tests__/widgetRenderer.test.ts` | `never lets the medium columns sum past the granted width` | Hero plus list equals the inner width at six grants. Must NOT change. |
| `shared/__tests__/widgetTimeline.test.ts` | `emits no more entries than there are prayers left, plus the opener and the guard` | The entry budget. Its absolute bound of 250 was sized for 30 days and must be re-sized. |
| `shared/__tests__/widgetTimeline.test.ts` | `carries a 30-day horizon` | The horizon constant. Its name and its number both change. |
| `shared/__tests__/widgetTimeline.test.ts` | `keeps the serialized payload well under UserDefaults comfort size` | The 200KB payload budget. The budget stays; its comment's measurements change. |
| `shared/__tests__/widgetTimeline.test.ts` | `bounds the extras entry count and payload under the same budgets` | The extras volume. Its 500 bound was sized for 30 days and must be re-sized. |
| `shared/__tests__/widgetAssets.test.ts` | `bakes the Android-only card and geometry contract, and keeps every other literal in the layout palette` | The generator's two opaque card literals, pinned exactly, and every other literal as a subset of the layout palette. **Pins `#252387` twice and must change.** |
| `shared/__tests__/flagDefaults.test.ts` | the whole suite | The ambient flag state is the SHIPPED value, produced by a delete. This is why decision 6 does not invert the parse. |

### Why the obvious simple fix is wrong

**Padding the pill image instead of its column.** The pill is an `AImageEl` at `fillMaxWidth()`; a padding modifier on
the image would have to pass through expo-widgets' Glance converter, which is the same converter that silently drops
`fillMaxWidth`'s fraction and ignores `weight` entirely (session 15d, `ExpoWidgetEmittableTree.kt:400-421`). Insetting
the COLUMN uses `APad`, the exact modifier the rows column already uses successfully on device, so it rides a path the
3T has proven.

**Giving the pill a fixed width instead of an inset.** `width(PILL_WIDTH)` on the pill column would size it correctly
but would not move it: the column sits at the list's leading edge, so the pill would shrink toward the names and the
dead space would stay on the right, which is the complaint. The inset is what moves it.

**Taking the 12dp margin as a flat constant.** It overflows a narrow grant. At 220dp the list column is 95dp and the
row text needs 73dp, leaving 22dp of slack: a flat 12dp each side needs 24dp and pushes the pill's own inset negative,
which is a pill wider than the column it sits in. Measured in the scratch worktree; the clamp in decision 4 is the
answer, and step 1's break proves the clamp is load-bearing.

**Inverting the flag parse to make widgets default-on.** Decision 6: it reverses the file's own stated fail direction
and fails 13 tests across 5 suites, one of which exists purely to pin the shipped default.

## 5. Design

**The invariant, as one sentence a test can check:** the Android medium's active pill leaves exactly the same air to
the left of the first prayer name as to the right of the last prayer time, at every granted width, and never extends
past the list column.

### The chosen approach

The pill column takes a leading inset equal to the slack the rows leave, and the rows column takes that inset plus one
gutter. The pill then starts where the rows' air starts and ends where their air ends.

```
rowContentWidth = ROW_NAME_WIDTH + ROW_TIME_WIDTH
gutter          = clamp(floor((LIST_WIDTH - rowContentWidth) / 2), 0, 12)
PILL_LEAD       = LIST_WIDTH - rowContentWidth - 2 × gutter
ROWS_LEAD       = PILL_LEAD + gutter
```

`ROW_GUTTER` is 12, the inset the owner approved. The clamp is what makes a narrow grant safe: when the column cannot
afford 12dp each side, both sides take half the slack instead, so they stay equal and never overflow.

Measured against the REAL renderer at every grant both phones, a tablet and a re-columned home grid can produce:

| Granted | List | Name + time | Pill inset | Rows inset | Left air | Right air | Overflow |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 560 | 269 | 207 | 38 | 50 | 12 | 12 | none |
| 420 | 197 | 151 | 22 | 34 | 12 | 12 | none |
| 380 (3T) | 177 | 136 | 17 | 29 | 12 | 12 | none |
| 360 | 167 | 128 | 15 | 27 | 12 | 12 | none |
| 330 | 151 | 116 | 11 | 23 | 12 | 12 | none |
| 310 (declared min) | 141 | 108 | 9 | 21 | 12 | 12 | none |
| 285 | 129 | 99 | 6 | 18 | 12 | 12 | none |
| 258 | 115 | 88 | 3 | 15 | 12 | 12 | none |
| 236 | 104 | 80 | 0 | 12 | 12 | 12 | none |
| 220 | 95 | 73 | 0 | 11 | 11 | 11 | none |
| 200 | 85 | 65 | 0 | 10 | 10 | 10 | none |

Session 15d's proportional sizing is untouched: the hero and list widths, the name and time boxes and the row text
size all come out of the same arithmetic as before, which the table above confirms at every width.

### The horizon

`TIMELINE_DAYS` 30 becomes 7. Measured with the real builders in the scratch worktree:

| Horizon | iOS entries (standard) | Payload | Extras entries | Extras payload |
| --- | --- | --- | --- | --- |
| 7 (this plan) | 40 | 17KB | 26 | 10KB |
| 10 | 58 | 24KB | 38 | 14KB |
| 14 | 82 | 35KB | 55 | 20KB |
| 30 (today) | 178 | 75KB | 121 | 45KB |

The bounds re-size to 60 entries (standard and extras alike) against the 200KB payload budget, which stays. 60 is
above the 40 that ships and below the 58 a 10-day horizon emits, so a horizon raised past the owner's ruling fails the
guard rather than sliding through.

**The accepted risk, recorded plainly** (the brief asks for this): a user whose Background App Refresh is off, or who
force-quits the app, has a widget that goes stale after 7 days instead of 30. `ai/AGENTS.md` already carries the
2026-09-09 note that such users go silent after the 2-day notification buffer; this shortens the widget's own grace
period to a week. The owner took that trade deliberately: the horizon's job is survival without a refresh, and a week
is what they judged enough.

### The flag

`FEATURE_FLAGS.widgets` stays `process.env.EXPO_PUBLIC_WIDGETS === '1'`. What changes is what the repository says
about it: `.env.example` documents it as `1`, and the JSDoc stops describing an unreleased upstream fix and starts
describing a live flag. Decision 6 has the measurement behind that; in short, inverting the parse would reverse the
file's stated fail direction and fail 13 tests, and it would not change what any build does, because every widget
build already passes the variable explicitly.

### Alternatives rejected

| Alternative | Why rejected |
| --- | --- |
| Pad the pill image rather than its column | Rides expo-widgets' Glance converter, which already silently drops modifier arguments (15d). The column's `APad` is device-proven. |
| Give the pill a fixed width | Sizes it without moving it: the dead space stays on the right, which is the complaint. |
| A flat 12dp margin with no clamp | Overflows below about 236dp: the pill's own inset goes negative. Measured. |
| Scale the margin with the granted width | Offered to the owner; they chose the fixed 12dp, which is the inset they had already approved on the left. |
| Drop the iOS card's alpha for the Android colour (`#020d26`) | Off by one step per channel from what the owner is looking at. Compositing over black is what the opaque bitmap actually stands in for. |
| Match the light card too | Not asked for, and `#e8e8ea` is a visible grey where a near-white card ships today. The settled-visuals rule forbids it. |
| Invert the flag parse to `!== '0'` | Reverses `shared/flags.ts`'s own fail direction and fails 13 tests across 5 suites. Decision 6. |
| Derive the entry bound from `TIMELINE_DAYS` | It would follow the horizon upward and guard nothing, the exact trap session 17's comment names. |

### The concurrency trace

| Caller | Before the change | After the change |
| --- | --- | --- |
| JS snapshot push (`stores/widget.ts`, Android) | Pushes props without a grant; the layout falls back to 310dp | Unchanged. The pill geometry derives from the same fallback, so a pre-tick render is correct, just less generous. |
| Native minute tick (`WidgetRefreshScheduler`) | Stamps `size` and `grantedWidthDp`, re-renders | Unchanged. The new geometry recomputes from the stamped grant on the same render. |
| User re-columns the home grid | The next tick re-stamps the grant | Unchanged: the margins recompute with the columns, so they stay equal at the new width. |
| iOS timeline push | Builds `TIMELINE_DAYS + 1` days per kind | Builds 8 days instead of 31: 40 entries per kind instead of 178. Same code path. |
| Android snapshot push | Carries `TIMELINE_DAYS + 1` days | Carries 8 days. The render-time day picker is unaffected; only the window shortens. |
| A widget rendered past the horizon | Stale card after 30 days | Stale card after 7 days. Same card, same trigger, sooner. |

### The design review

Reviewed by the planning session against the code, the tests and the installed library sources on 2026-09-24, and
proven in a scratch worktree at `~/athan-device-sweep/worktrees/plan-19` (removed after the proof, code deleted). What
the review found, and what changed as a result:

1. **The first draft of the pill test was not red.** It asserted a 12dp margin each side, which the OLD code already
   satisfied on the left, so only half of it could fail. Rewritten as one test asserting left equals right at nine
   grants; it now fails on the old code with `Expected: 29, Received: 12`. A test that can only half-fail is a test
   that half-guards.
2. **The clamp escaped its first break.** Replacing the clamp with a flat `ROW_GUTTER` kept every assertion passing,
   because a negative pill inset is still symmetric. Added `expect(pill).toBeGreaterThanOrEqual(0)`, which makes the
   clamp load-bearing: the break now fails as it should.
3. **Biome rejects the obvious way to read a padding value back.** `(found?.value as number[])[0]` trips
   `lint/correctness/noUnsafeOptionalChaining`. Step 1 gives the accepted form verbatim.
4. **Biome reformats the rows column once its modifier grows.** The single-line `<Column modifiers={...}>{...}</Column>`
   is re-wrapped across three lines. Step 1 gives the wrapped form verbatim so the executor does not fight the
   formatter.
5. **Flipping the flag's default breaks 13 tests.** Measured, not assumed: 5 suites fail, including `flagDefaults`,
   whose whole purpose is pinning the shipped default. That measurement is what produced decision 6.
6. **The extras volume comment names dates a 7-day span no longer covers.** It says "31-day extras span (2026-06-14 →
   2026-07-14)" with four Fridays; at 8 days the span ends 2026-06-21 and holds one Friday, 2026-06-19. Step 3
   corrects it, or the comment would lie about its own fixture.

What the spike proved, and what it taught:

- All three code jobs applied together: `npx tsc --noEmit` exits 0 and `npx biome check . --error-on-warnings` exits 0.
- The full suite reports `Test Suites: 170 passed, 170 total` and `Tests: 2 skipped, 4644 passed, 4646 total`.
- Before the pill change, exactly two renderer tests fail:
  `bounds the active pill to the list column, not the card remainder` with
  `Expected: ArrayContaining [{"modifier": "padding", "value": [17, 1, 0, 0]}] / Received: [{"modifier": "padding", "value": [0, 1, 0, 0]}]`,
  and `gives the active pill equal air each side of the row text, at every grant` with `Expected: 29, Received: 12`.
- Before the horizon change, three timeline tests fail; before the colour change, one asset test fails.
- `python3 scripts/generate-widget-assets.py` rewrites exactly the two dark card PNGs, and their centre pixel reads
  `(2, 12, 36, 255)`.
- Every break in steps 1 to 3 was run and caught its named tests.

The spike's code was deleted and does not become the plan.

## 6. Steps

- [ ] Step 1: The active pill wraps the row text with equal air each side (specified)
- [ ] Step 2: The Android dark card matches iOS (specified)
- [ ] Step 3: The timeline horizon drops to 7 days (specified)
- [ ] Step 4: The iOS widgets flag ships on (specified)
- [ ] Step 5: Device proof on both phones (device)

**The running order is 1, 2, 3, 5, then 4.** Steps 1 to 3 are independent of each other and each leaves `uat-2` green.
Step 5 is the device proof, and it must run after steps 1 to 3 are merged, because it builds from `uat-2` and shows
their result on the phones. Step 4 runs LAST, because the XS half of step 5 is its gate: the flag flips only once the
G.1 acceptance protocol has passed, which is the owner's ruling (decision 7) and the brief's own demand. Step 4 is
written before step 5 in this document so that its contracts sit beside the other code steps; its part 0 states the
gate, and step 5b part 9 states the verdict that opens it.

If the protocol fails, steps 1 to 3 still stand and ship: the session ends with step 4 unrun, the row EXECUTED for
what was done, and the flag question going back to the owner.

### Step 1: The active pill wraps the row text with equal air each side

0. **Anchor check.** Run the section 3 count for `1-1`, `1-2` and `1-3`. Each must print `1`. Any other count means
   NEEDS REPLAN.
1. **Goal:** the Android medium's active pill leaves the same air left of the first name as right of the last time, at
   every granted width.
2. **Branch:** `git checkout -b fix/19-pill-wraps-row-text uat-2`
3. **Files:** `widgets/PrayerWidget.tsx`, `shared/__tests__/widgetRenderer.test.ts`. Nothing else may change, apart
   from `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.
4. **Tests first (red).** Suite: `shared/__tests__/widgetRenderer.test.ts` (existing).

   One existing test CHANGES, because it pins the pill's zero inset:

   | Test | Why it changes |
   | --- | --- |
   | `bounds the active pill to the list column, not the card remainder` | Its `pillColumn` assertion expects `{ modifier: 'padding', value: [0, 1, 0, 0] }` and its `rowsColumn` search looks for `'[12,0,12,0]'`. At the 380dp grant the test already uses, the pill inset becomes 17 and the rows inset becomes 29. Change the expected padding to `[17, 1, 0, 0]` and the searched string to `'[29,0,0,0]'`. Replace its "The pill WRAPS the row content" comment with one recording the 2026-09-24 ruling and the 380dp arithmetic (list 177, content 136, pill 160, inset 17). |

   These tests must NOT change: `sizes the row name and time boxes from the granted width`,
   `sizes the medium columns from the granted width`, `never lets the medium columns sum past the granted width`,
   `falls back to the declared minimum when the width is not stamped`,
   `falls back to the declared minimum when the stamped width is not usable`,
   `shrinks the row text with the box so long names are not clipped`,
   `never shrinks the row text below its legible floor`, `keeps the row text at 13sp when the grant is generous`,
   `pads the active pill 2dp above and below its row`, and every iOS-path test.

   One new test, added to the `Android path (jetpack globals)` describe block, immediately above the
   `// The medium's columns are shares of the width the launcher granted, so` comment:

   | Test name | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | `gives the active pill equal air each side of the row text, at every grant` | The invariant: the pill wraps the text symmetrically and never overflows its column | `grantedWidthDp` of 380, 360, 330, 310, 285, 258, 236, 220 and 200, each frozen at `at(DAY_ONE, '14:08')` | For each grant: `rows - pill` equals `list - (rows + name + time)`; that value is at most 12 and greater than 0; the pill's own inset is at least 0; and `rows + name + time` is at most `list` |

   It needs a helper, `pillAndRowsLead(grantedWidthDp)`, returning the leading padding of the pill column and of the
   rows column. Define it directly above the new test. The pill column is the Column containing an Image whose
   `source.uri` starts `athan_widget_pill_`; the rows column is the Column whose texts include `Fajr`. Read each one's
   first padding value. Biome rejects `(found?.value as number[])[0]`, so the reader is given verbatim:

   ```tsx
        const value = (found?.value ?? []) as number[];
        return value[0] as number;
   ```

   The existing `rowBoxWidths` and `heroAndList` helpers give the name, time and list widths; they are defined BELOW
   this point in the file, and that is fine, because function declarations and `const` arrow helpers in the same
   describe body are both in scope by the time a test body runs.

   Command: `npx jest shared/__tests__/widgetRenderer.test.ts --watchman=false --selectProjects=unit`

   Expected BEFORE the change: exactly two tests fail.
   `bounds the active pill to the list column, not the card remainder` fails with
   `Expected: ArrayContaining [{"modifier": "padding", "value": [17, 1, 0, 0]}]` and
   `Received: [{"modifier": "padding", "value": [0, 1, 0, 0]}]`.
   `gives the active pill equal air each side of the row text, at every grant` fails with `Expected: 29` and
   `Received: 12`. If any other test fails, or these pass, STOP.

5. **Change.** This step is `(specified)`: build it from the contracts below.

   At anchor `1-1`, add one constant beside the reference constants:

   | Name | Value | What it means |
   | --- | --- | --- |
   | `ROW_GUTTER` | `12` | The air between the pill's edge and the row text, each side. The inset the owner approved on the left (2026-09-19), now mirrored on the right. |

   At anchor `1-2`, after `ROW_TIME_WIDTH` is computed and before the `rowTextSize` line, compute the pill geometry.
   The contract, as locals of the medium branch:

   | Local | Answers | Must never |
   | --- | --- | --- |
   | `rowContentWidth` | `ROW_NAME_WIDTH + ROW_TIME_WIDTH`, the width the row text actually occupies | Include the gutters; it is the content alone |
   | `gutter` | The air each side: `ROW_GUTTER`, or half the column's slack when the column cannot afford `ROW_GUTTER`, never below 0 | Exceed `ROW_GUTTER`, which would spread the approved look, or go negative, which would inset the text outside its column |
   | `PILL_LEAD` | `LIST_WIDTH - rowContentWidth - 2 × gutter`, the dead space the pill must not cover | Be negative: that is a pill wider than its column |
   | `ROWS_LEAD` | `PILL_LEAD + gutter`, the rows' own leading inset | Disagree with `PILL_LEAD`; the two are one geometry |

   The `gutter` line is given verbatim, because its clamp is what step 7's break targets and its exact shape is what
   Biome accepts:

   ```tsx
    const gutter = Math.max(0, Math.min(ROW_GUTTER, Math.floor((LIST_WIDTH - rowContentWidth) / 2)));
   ```

   At anchor `1-3`, the two sibling columns take their new insets. The pill column's `APad(0, 1, 0, 0)` becomes
   `APad(PILL_LEAD, 1, 0, 0)`; its `1` is the owner-tuned 1dp drop and does not change. The rows column's
   `APad(12, 0, 12, 0)` becomes `APad(ROWS_LEAD, 0, 0, 0)`: the trailing 12 goes, because the pill no longer needs the
   rows to sit inside a full-width fill, and the leading inset now carries the whole geometry. Biome re-wraps that
   line, so it is given verbatim in its formatted form:

   ```tsx
              <Column modifiers={[APad(ROWS_LEAD, 0, 0, 0)]}>
                {dayRows.map((row, index) => ARowLine(row, index))}
              </Column>
   ```

   The comment above the pill column records WHY the inset exists: the pill used to span the column while the rows sat
   inside it, so every dp of slack landed right of the times. Comments explain why, never what.

   The invariant this step keeps: the pill leaves exactly the same air left of the first name as right of the last
   time, at every granted width, and never extends past the list column.

6. **Green.** The same command. Expected: `Tests:       49 passed, 49 total`. Then `npx tsc --noEmit` and
   `npx biome check . --error-on-warnings`, both exit 0.

7. **Breaks.** Save to `$TMPDIR/breaks-19-1.sh` and run `bash $TMPDIR/breaks-19-1.sh` from the repository root. Note
   the `perl` substitution uses `{}` delimiters throughout: the replacement text holds `/` characters, which break the
   usual `s/.../.../` form (found while planning).

```bash
#!/usr/bin/env bash
set -u
cd /Users/muji/repos/rn.athan.uk || exit 1
FILE=widgets/PrayerWidget.tsx
SUITE=shared/__tests__/widgetRenderer.test.ts
CAUGHT=0
TOTAL=0

try() {
  LABEL="$1"; FROM="$2"; TO="$3"
  TOTAL=$((TOTAL + 1))
  cp "$FILE" "$FILE.bak"
  perl -0pi -e "s{\\Q$FROM\\E}{$TO}" "$FILE"
  if cmp -s "$FILE" "$FILE.bak"; then
    echo "BREAK NOT APPLIED: $LABEL"
    mv "$FILE.bak" "$FILE"
    return
  fi
  if npx jest "$SUITE" --watchman=false --selectProjects=unit > "$TMPDIR/break-19-1.log" 2>&1; then
    echo "NOT CAUGHT: $LABEL"
  else
    echo "caught: $LABEL"
    CAUGHT=$((CAUGHT + 1))
  fi
  mv "$FILE.bak" "$FILE"
}

try "pill spans the whole column again" "APad(PILL_LEAD, 1, 0, 0)" "APad(0, 1, 0, 0)"
try "rows keep their old fixed inset" "APad(ROWS_LEAD, 0, 0, 0)" "APad(12, 0, 12, 0)"
try "the narrow-grant clamp is dropped" "Math.max(0, Math.min(ROW_GUTTER, Math.floor((LIST_WIDTH - rowContentWidth) / 2)))" "ROW_GUTTER"
try "the gutter widens past the approved inset" "const ROW_GUTTER = 12;" "const ROW_GUTTER = 20;"

echo "caught $CAUGHT of $TOTAL"
[ "$CAUGHT" = "$TOTAL" ] && echo "ALL AS EXPECTED: 1"
```

   Expected: every line reads `caught: <label>`, then `caught 4 of 4`, then `ALL AS EXPECTED: 1`. Break 1 and break 2
   each fail both pill tests; break 3 fails `gives the active pill equal air each side of the row text, at every grant`
   at the 220dp grant; break 4 fails both pill tests. Afterwards `git status --porcelain` lists only this step's files
   and the three plan files.

8. **Version and commit.** Run `node -p "const v=require('./package.json').version.split('.');v[2]=+v[2]+1;v.join('.')"`
   and set that version in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). Add, by name:
   `widgets/PrayerWidget.tsx`, `shared/__tests__/widgetRenderer.test.ts`, `app.json`, `package.json`,
   `ai/plans/README.md`, `ai/plans/19-widget-polish-and-horizon/PLAN.md` and `.../LOG.md`. Write the message to
   `$TMPDIR/msg-1.txt` and commit with `git commit -F $TMPDIR/msg-1.txt` in the background.

```
<VERSION> - fix(widgets): the Android active pill wraps the row text

The pill filled the list column while the rows sat 12dp inside it, so every
dp of slack landed to the right of the times: 21dp at a 310dp grant, 29dp at
380dp, and worse as the screen widened. The owner saw it as "perfectly
aligned on the left, but on the right side, it's extended even further out".

The pill column now takes the dead space as a leading inset and the rows take
that inset plus one 12dp gutter, so the pill starts where the rows' air starts
and ends where it ends. Where a narrow grant cannot afford 12dp each side,
both sides take half the slack instead, which keeps them equal and keeps the
pill inside its column.

Session 15d's proportional sizing is untouched: hero, list, name, time and row
text all come out of the same arithmetic, at every grant in its table.
```

   The pre-commit hook runs the full suite and the coverage gate: the last `Tests:` line ends `passed, <n> total` and
   four `100%` coverage lines are present.

9. **Review.** Spawn a `Code Reviewer` subagent, isolation `worktree`, with this prompt:

```
Run git checkout --detach <sha>.

Review this commit against ai/plans/19-widget-polish-and-horizon/PLAN.md step 1. Check:
- the pill column's leading inset is PILL_LEAD and the rows column's is ROWS_LEAD, with the
  1dp drop on the pill column preserved;
- gutter is clamped to at most ROW_GUTTER and at least 0, exactly as the plan's verbatim line gives it;
- PILL_LEAD can never be negative at any granted width;
- the new test asserts symmetry at nine grants and would fail on the previous code;
- session 15d's proportional sizing is untouched: no reference constant, no hero, list, name, time
  or row-text arithmetic changed;
- no other visual changed: row heights, pill height, fonts, footer lift, palette;
- comments explain why, not what;
- nothing beyond widgets/PrayerWidget.tsx and shared/__tests__/widgetRenderer.test.ts changed,
  besides the version files and the plan files.

Reply merge or fix first.
```

   A "merge" verdict means go on. A "fix first" verdict is handled by `EXECUTOR-BRIEF.md` section 4, item 8: a fix
   section 10 gives word for word, or a fix meeting all three of that item's conditions, is applied; anything else is
   a STOP.

10. **Merge.** `git checkout uat-2 && git merge --no-ff fix/19-pill-wraps-row-text -m "Merge fix/19-pill-wraps-row-text into uat-2: the Android active pill wraps the row text, reviewed"`
11. **Done when:** `npx jest shared/__tests__/widgetRenderer.test.ts --watchman=false --selectProjects=unit` reports
    `Tests:       49 passed, 49 total`; `bash $TMPDIR/breaks-19-1.sh` ends `ALL AS EXPECTED: 1`;
    `git log --oneline -1 uat-2` shows the merge.

### Step 2: The Android dark card matches iOS

0. **Anchor check.** Run the section 3 count for `2-1`. It must print `1`.
1. **Goal:** the Android dark widget card renders the near-black navy iOS renders, instead of a bright purple.
2. **Branch:** `git checkout -b fix/19-android-dark-card uat-2`
3. **Files:** `scripts/generate-widget-assets.py`, `shared/__tests__/widgetAssets.test.ts`,
   `assets/widgets/athan_widget_card_dark_small.png`, `assets/widgets/athan_widget_card_dark_medium.png`. Nothing else
   may change, apart from `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.
4. **Tests first (red).** Suite: `shared/__tests__/widgetAssets.test.ts` (existing).

   One existing test CHANGES, in two places:

   | Test | Why it changes |
   | --- | --- |
   | `bakes the Android-only card and geometry contract, and keeps every other literal in the layout palette` | It pins `CARD_DARK = css("#252387")` and exempts `'#252387'` from the subset rule. Both become `#020c24`. Its comment gains one sentence: the opaque dark card is the iOS `rgba(2, 13, 38, 0.95)` composited over black (owner ruling 2026-09-24). |

   These tests must NOT change: `every drawable the layout references exists as a committed PNG`, and
   `the config plugin copies assets into res/drawable-nodpi byte-equal and idempotently`.

   No new test. The changed test is the guard: it pins the exact literal, and the subset rule catches any other
   generator colour that drifts from the layout palette.

   Command: `npx jest shared/__tests__/widgetAssets.test.ts --watchman=false --selectProjects=unit`

   Expected BEFORE the change: one test fails,
   `bakes the Android-only card and geometry contract, and keeps every other literal in the layout palette`, at the
   `expect(generator).toContain('CARD_DARK = css("#020c24")')` assertion. If any other test fails, or it passes, STOP.

5. **Change.** This step is `(specified)`.

   At anchor `2-1`, `CARD_DARK` becomes `css("#020c24")`. `CARD_LIGHT` is NOT touched (decision 3).

   The comment above the two constants records WHY the dark value is what it is: iOS renders
   `rgba(2, 13, 38, 0.95)` over the wallpaper, Android's bitmap is opaque by the 2026-09-01 ruling, and `#020c24` is
   that colour composited over black (owner ruling 2026-09-24, "I want Android to match exactly like iPhone").

   Then regenerate the drawables:

   ```
   python3 scripts/generate-widget-assets.py
   ```

   Expected: ten `wrote assets/widgets/<name>.png <w>x<h>` lines. Exactly two files change in git:
   `athan_widget_card_dark_small.png` and `athan_widget_card_dark_medium.png`. If `git status --porcelain` lists any
   other PNG as modified, STOP: the generator is not deterministic for the untouched colours and that is a finding.

   Verify the baked colour:

   ```
   python3 -c "from PIL import Image; im=Image.open('assets/widgets/athan_widget_card_dark_medium.png').convert('RGBA'); print(im.getpixel((im.size[0]//2, im.size[1]//2)))"
   ```

   Expected exactly: `(2, 12, 36, 255)`.

6. **Green.** The same jest command. Expected: `Tests:       3 passed, 3 total`. Then `npx tsc --noEmit` and
   `npx biome check . --error-on-warnings`, both exit 0.

7. **Breaks.** Save to `$TMPDIR/breaks-19-2.sh` and run `bash $TMPDIR/breaks-19-2.sh` from the repository root.

```bash
#!/usr/bin/env bash
set -u
cd /Users/muji/repos/rn.athan.uk || exit 1
FILE=scripts/generate-widget-assets.py
SUITE=shared/__tests__/widgetAssets.test.ts
CAUGHT=0
TOTAL=0

try() {
  LABEL="$1"; FROM="$2"; TO="$3"
  TOTAL=$((TOTAL + 1))
  cp "$FILE" "$FILE.bak"
  perl -0pi -e "s{\\Q$FROM\\E}{$TO}" "$FILE"
  if cmp -s "$FILE" "$FILE.bak"; then
    echo "BREAK NOT APPLIED: $LABEL"
    mv "$FILE.bak" "$FILE"
    return
  fi
  if npx jest "$SUITE" --watchman=false --selectProjects=unit > "$TMPDIR/break-19-2.log" 2>&1; then
    echo "NOT CAUGHT: $LABEL"
  else
    echo "caught: $LABEL"
    CAUGHT=$((CAUGHT + 1))
  fi
  mv "$FILE.bak" "$FILE"
}

try "the dark card drifts back to the bright purple" 'CARD_DARK = css("#020c24")' 'CARD_DARK = css("#252387")'
try "the dark card drifts to any other colour" 'CARD_DARK = css("#020c24")' 'CARD_DARK = css("#030d25")'
try "a pill colour drifts off the layout palette" 'css("#2743e0")' 'css("#2743e1")'

echo "caught $CAUGHT of $TOTAL"
[ "$CAUGHT" = "$TOTAL" ] && echo "ALL AS EXPECTED: 1"
```

   Expected: three `caught:` lines, then `caught 3 of 3`, then `ALL AS EXPECTED: 1`. Breaks 1 and 2 fail the pinned
   literal; break 3 fails the subset rule. Afterwards `git status --porcelain` lists only this step's files and the
   three plan files.

8. **Version and commit.** The same version command as step 1. Add, by name:
   `scripts/generate-widget-assets.py`, `shared/__tests__/widgetAssets.test.ts`,
   `assets/widgets/athan_widget_card_dark_small.png`, `assets/widgets/athan_widget_card_dark_medium.png`, `app.json`,
   `package.json`, `ai/plans/README.md`, `.../PLAN.md` and `.../LOG.md`. Message in `$TMPDIR/msg-2.txt`:

```
<VERSION> - fix(widgets): the Android dark card matches the iOS card

iOS renders its dark card as rgba(2, 13, 38, 0.95), a near-black navy over the
wallpaper. Android's card is a pre-rendered opaque bitmap, because Glance draws
no rounded corners, and it carried #252387, a bright purple that was never
reconciled with the iOS palette. The owner, comparing the two phones: "I want
Android to match exactly like iPhone actually."

The opaque equivalent is the iOS colour composited over black, #020c24, which
is what the two dark card PNGs now bake. The light card keeps #fcfcfe: the
owner's ruling names the dark card, and its opaque form over black would be a
visible grey.

Audited the rest of the dark palette for the same drift, as the brief asked:
the generator holds 11 colour literals and exactly two sit outside the layout
palette, both the deliberate opaque card forms. Every pill fill, pill stroke
and moon colour is already byte-identical to the layout's.
```

9. **Review.** `Code Reviewer`, isolation `worktree`, prompt:

```
Run git checkout --detach <sha>.

Review this commit against ai/plans/19-widget-polish-and-horizon/PLAN.md step 2. Check:
- CARD_DARK is #020c24, which is rgba(2, 13, 38, 0.95) composited over black: round(2*0.95)=2,
  round(13*0.95)=12, round(38*0.95)=36;
- CARD_LIGHT is unchanged;
- exactly two PNGs changed, both dark cards, and their centre pixel is (2, 12, 36, 255);
- the test pins the new literal in both places it pinned the old one, and the subset rule still
  exempts only the two opaque card colours;
- no layout palette colour changed in widgets/PrayerWidget.tsx;
- comments explain why, not what.

Reply merge or fix first.
```

   Verdict handling as step 1, part 9.

10. **Merge.** `git checkout uat-2 && git merge --no-ff fix/19-android-dark-card -m "Merge fix/19-android-dark-card into uat-2: the Android dark card matches iOS, reviewed"`
11. **Done when:** the asset suite reports `Tests:       3 passed, 3 total`; the centre-pixel command prints
    `(2, 12, 36, 255)`; `bash $TMPDIR/breaks-19-2.sh` ends `ALL AS EXPECTED: 1`.

### Step 3: The timeline horizon drops to 7 days

0. **Anchor check.** Run the section 3 count for `3-1`. It must print `1`.
1. **Goal:** both platforms carry a 7-day widget horizon, with guards sized to it.
2. **Branch:** `git checkout -b fix/19-horizon-seven-days uat-2`
3. **Files:** `shared/widgetTimeline.ts`, `shared/__tests__/widgetTimeline.test.ts`. Nothing else may change, apart
   from `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.
4. **Tests first (red).** Suite: `shared/__tests__/widgetTimeline.test.ts` (existing).

   Four existing tests CHANGE:

   | Test | Why it changes |
   | --- | --- |
   | `carries a 30-day horizon` | Renamed to `carries a 7-day horizon` and asserts `TIMELINE_DAYS` is 7. Its comment says a week is how long a widget stays correct with no background refresh and no app launch, which is the horizon's whole job (owner ruling 2026-09-24). |
   | `emits no more entries than there are prayers left, plus the opener and the guard` | Its absolute bound of 250 was sized for 30 days; at 7 days the builder emits 40. Becomes `toBeLessThan(60)`. Its comment records that 7 days emits 40 and 10 days would emit 58, and says the literal is deliberate: a bound derived from `TIMELINE_DAYS` would follow the horizon up and notice nothing. |
   | `keeps the serialized payload well under UserDefaults comfort size` | The 200KB budget STAYS. Its comment's measurements change: a 7-day horizon measures ~17KB across 40 entries. |
   | `bounds the extras entry count and payload under the same budgets` | Its bound of 500 was sized for 30 days; at 7 days the extras builder emits 26. Becomes `toBeLessThan(60)`. Its fixture comment says "31-day extras span (2026-06-14 → 2026-07-14)" with four Fridays; at 8 days the span ends 2026-06-21 and holds one Friday, 2026-06-19. Correct it, and write the arrow as "to". |

   The describe block's own banner, `VOLUME & PAYLOAD INVARIANTS (31-day span, as pushed in production)`, becomes
   `(8-day span, as pushed in production)`.

   No new test: the four above are the guards, and the fixtures scale with the constant.

   These tests must NOT change: every test in the `counts down to the true next prayer at every minute of the span`
   sweep, `never leaves an entry counting down to a prayer that has already passed`, and every unreadable-row test.

   Command: `npx jest shared/__tests__/widgetTimeline.test.ts --watchman=false --selectProjects=unit`

   Expected BEFORE the change: three tests fail. `carries a 7-day horizon` fails with `Expected: 7, Received: 30`.
   `emits no more entries than there are prayers left, plus the opener and the guard` fails at
   `expect(entries.length).toBeLessThan(60)` with `Received: 178`. `bounds the extras entry count and payload under the
   same budgets` fails at `toBeLessThan(60)` with `Received: 121`. If any other test fails, or these pass, STOP.

5. **Change.** This step is `(specified)`.

   At anchor `3-1`, `TIMELINE_DAYS` becomes `7`. Its JSDoc keeps its first sentence (the constant's job: how long a
   widget stays correct without the app opening) and replaces its measurements with the ones this plan measured: 7
   days costs 40 iOS entries and ~17KB; 30 days cost 178 and ~75KB; and WidgetKit answers an over-budget timeline with
   a silently black widget, never an error. It keeps the paragraph explaining why the constant lives in `shared/`
   rather than beside its caller. Add the owner's reason for 7: a week is the survival time the owner judged enough
   for a widget whose app is never opened and whose background refresh never runs (owner ruling 2026-09-24).

   Nothing else changes. `stores/widget.ts` reads the constant and needs no edit.

   The invariant this step keeps: both platforms build `TIMELINE_DAYS + 1` days from one constant, and the volume
   guards fail if the horizon grows past the owner's ruling.

6. **Green.** The same command. Expected: `Tests:       52 passed, 52 total`. Then `npx tsc --noEmit` and
   `npx biome check . --error-on-warnings`, both exit 0.

7. **Breaks.** Save to `$TMPDIR/breaks-19-3.sh` and run `bash $TMPDIR/breaks-19-3.sh` from the repository root.

```bash
#!/usr/bin/env bash
set -u
cd /Users/muji/repos/rn.athan.uk || exit 1
FILE=shared/widgetTimeline.ts
SUITE=shared/__tests__/widgetTimeline.test.ts
CAUGHT=0
TOTAL=0

try() {
  LABEL="$1"; FROM="$2"; TO="$3"
  TOTAL=$((TOTAL + 1))
  cp "$FILE" "$FILE.bak"
  perl -0pi -e "s{\\Q$FROM\\E}{$TO}" "$FILE"
  if cmp -s "$FILE" "$FILE.bak"; then
    echo "BREAK NOT APPLIED: $LABEL"
    mv "$FILE.bak" "$FILE"
    return
  fi
  if npx jest "$SUITE" --watchman=false --selectProjects=unit > "$TMPDIR/break-19-3.log" 2>&1; then
    echo "NOT CAUGHT: $LABEL"
  else
    echo "caught: $LABEL"
    CAUGHT=$((CAUGHT + 1))
  fi
  mv "$FILE.bak" "$FILE"
}

try "the horizon creeps back to 30 days" "TIMELINE_DAYS = 7" "TIMELINE_DAYS = 30"
try "the horizon creeps to 10 days" "TIMELINE_DAYS = 7" "TIMELINE_DAYS = 10"
try "the horizon shrinks below the ruling" "TIMELINE_DAYS = 7" "TIMELINE_DAYS = 3"

echo "caught $CAUGHT of $TOTAL"
[ "$CAUGHT" = "$TOTAL" ] && echo "ALL AS EXPECTED: 1"
```

   Expected: three `caught:` lines, then `caught 3 of 3`, then `ALL AS EXPECTED: 1`. Break 1 fails the horizon test and
   both volume bounds; break 2 fails the horizon test and the standard volume bound (58 entries against the 60 bound
   is under it, so the horizon assertion is what catches 10 days, which is the point of keeping it); break 3 fails the
   horizon test.

8. **Version and commit.** The same version command. Add, by name: `shared/widgetTimeline.ts`,
   `shared/__tests__/widgetTimeline.test.ts`, `app.json`, `package.json`, `ai/plans/README.md`, `.../PLAN.md` and
   `.../LOG.md`. Message in `$TMPDIR/msg-3.txt`:

```
<VERSION> - fix(widgets): the timeline horizon drops to 7 days

TIMELINE_DAYS feeds both platforms through buildSequence: iOS turns it into
one entry per boundary, Android carries the days and computes at render time.
The horizon's job is how long a widget stays correct with no background
refresh and no app launch, and the owner judged a week enough.

Measured with the real builders: 7 days is 40 iOS entries and 17KB, where 30
was 178 and 75KB. The entry bound moves from 250 to 60 and the extras bound
from 500 to 60, because a bound sized for 30 days guards nothing at 7. Both
stay literals: a bound derived from TIMELINE_DAYS would follow the horizon
upward and notice nothing.

Accepted risk, recorded: a user whose Background App Refresh is off, or who
force-quits, now has a widget that goes stale after a week instead of a month.
```

9. **Review.** `Code Reviewer`, isolation `worktree`, prompt:

```
Run git checkout --detach <sha>.

Review this commit against ai/plans/19-widget-polish-and-horizon/PLAN.md step 3. Check:
- TIMELINE_DAYS is 7 and nothing else in shared/widgetTimeline.ts changed;
- the entry bound and the extras bound are literals, not derived from TIMELINE_DAYS, and each sits
  above what 7 days emits (40 and 26) and below what 10 days would emit (58 and 38);
- the 200KB payload budget is unchanged;
- every comment's numbers match what the builders actually emit at 7 days;
- the extras fixture comment names the right span and the right Fridays for 8 days;
- no prose uses an arrow or an em dash (ai/AGENTS.md writing rules).

Reply merge or fix first.
```

   Verdict handling as step 1, part 9.

10. **Merge.** `git checkout uat-2 && git merge --no-ff fix/19-horizon-seven-days -m "Merge fix/19-horizon-seven-days into uat-2: the widget horizon drops to 7 days, reviewed"`
11. **Done when:** the timeline suite reports `Tests:       53 passed, 53 total`; `bash $TMPDIR/breaks-19-3.sh` ends
    `ALL AS EXPECTED: 1`.

### Step 4: The iOS widgets flag ships on

0. **Anchor check.** None: this step changes documentation and a catalog line, neither of which is anchored. Instead,
   confirm the gate: step 5's XS acceptance protocol has PASSED and its readings are written in `LOG.md`. If it has
   not run, or it failed, do not start this step (section 2.2 item 8).
1. **Goal:** the repository ships the iOS widgets flag as ON: the catalog documents it, and its JSDoc describes a live
   flag instead of an unreleased upstream fix.
2. **Branch:** `git checkout -b feat/19-ios-widgets-flag-on uat-2`
3. **Files:** `shared/flags.ts`, `.env.example`. Nothing else may change, apart from `ai/plans/README.md` and this
   folder's `PLAN.md` and `LOG.md`.
4. **Tests first (red).** None, and this is deliberate. The flag's PARSING is already covered by
   `shared/__tests__/flags.test.ts`, its shipped default by `shared/__tests__/flagDefaults.test.ts`, and its native
   mirror by the `app.config widget plugin parity` suite. This step changes neither the parse nor the default nor the
   mirror (decision 6): it changes what the catalog documents and what the JSDoc says. There is nothing a test can
   assert that is not already asserted, and adding one that reads the JSDoc's prose would pin wording, not behaviour.

   Run the three suites before the change to record the baseline:

   `npx jest shared/__tests__/flags.test.ts shared/__tests__/flagDefaults.test.ts --watchman=false --selectProjects=unit`

   Expected: `Tests:       32 passed, 32 total`. The same command must report the same after the change. If any test
   fails at either point, STOP.

5. **Change.** This step is `(specified)`.

   In `.env.example`, `EXPO_PUBLIC_WIDGETS=0` becomes `EXPO_PUBLIC_WIDGETS=1`. `EXPO_PUBLIC_ANDROID_WIDGETS` is NOT
   touched: the Android flag's flip condition is the owner judging a release, which this session does not do.

   In `shared/flags.ts`, the `widgets` JSDoc is rewritten. The parse expression itself does NOT change. The new JSDoc
   must say, in the file's existing voice:
   - what the flag gates: the iOS Home and Lock Screen widget extension and every push path;
   - that it is ON: builds pass `EXPO_PUBLIC_WIDGETS=1`, and `.env.example` documents it;
   - why it is on now: `expo-widgets` 58.0.1 shipped expo/expo#49810, "Preserve SwiftUI view identity across widget
     and Live Activity updates", and the installed 58.0.3's `ios/Widgets/DynamicView.swift` renders
     `AnyView(view).id(child.childIdentity)` with no `UUID()` anywhere, so the random-per-render identity hack the flag
     existed to avoid is gone;
   - that the G.1 acceptance protocol was run on the iPhone XS on 2026-09-24 and passed, with the reading step 5
     recorded;
   - what remains: the flag is now scaffolding awaiting deletion, per the lifecycle rule in `ai/AGENTS.md` ("once
     stable, delete the flag: gate, .env.example line, and all").

   The JSDoc must NOT keep the old "Flip condition" paragraph, the 57.0.x version history, or the claim that the fix
   is unreleased. All three are now false.

6. **Green.** The baseline command above reports `Tests:       32 passed, 32 total`, unchanged. Then `npx tsc --noEmit`
   and `npx biome check . --error-on-warnings`, both exit 0.

7. **Breaks.** None, and the reason is the step's own shape. A break proves a test catches a change to behaviour; this
   step changes no behaviour, only documentation and a catalog default, so there is no substitution that could make a
   test fail without changing something this step did not touch. The behaviour the flag gates is proven on the device
   by step 5, which is this step's real acceptance.

   Instead, confirm the two readers still agree, which IS behaviour:

   ```
   npx jest shared/__tests__/flags.test.ts --watchman=false --selectProjects=unit -t 'app.config widget plugin parity'
   ```

   Expected: `Tests:       20 skipped, 3 passed, 23 total`.

8. **Version and commit.** The same version command. Add, by name: `shared/flags.ts`, `.env.example`, `app.json`,
   `package.json`, `ai/plans/README.md`, `.../PLAN.md` and `.../LOG.md`. Message in `$TMPDIR/msg-4.txt`:

```
<VERSION> - feat(widgets): the iOS widgets flag ships on

The flag existed to keep a broken render chain out of a build: every
expo-widgets render regenerated random SwiftUI view identities, so each body
evaluation tore down the whole tree, saturated the extension's CPU, missed
WidgetKit's watchdog and left widgets permanently blank (ISSUES.md G.1).

That fix has shipped. expo-widgets 58.0.1 carries expo/expo#49810, and the
installed 58.0.3 renders AnyView(view).id(child.childIdentity) with no UUID()
anywhere. The G.1 acceptance protocol ran on the iPhone XS on 2026-09-24 and
passed: all eight home kinds rendered and stayed rendered past 10 minutes,
with no new cpu_resource report and no watchdog line.

The parse is untouched. shared/flags.ts states its own fail direction,
"mistakes disable, never enable", and inverting it to default-on would reverse
that rule and fail the suite that pins the shipped default. The flag is
build-time transport: .env.example now documents EXPO_PUBLIC_WIDGETS=1, which
is what every widget build already passes.

G.2, the blank card for a few seconds at placement, stays open and is the next
queued session. The owner was asked directly and chose to flip the flag now.
```

9. **Review.** `Code Reviewer`, isolation `worktree`, prompt:

```
Run git checkout --detach <sha>.

Review this commit against ai/plans/19-widget-polish-and-horizon/PLAN.md step 4. Check:
- the FEATURE_FLAGS.widgets expression is UNCHANGED (still === '1'): the plan's decision 6 forbids
  inverting it, because shared/flags.ts states "mistakes disable, never enable" and the inversion
  fails the suite that pins the shipped default;
- .env.example sets EXPO_PUBLIC_WIDGETS=1 and leaves EXPO_PUBLIC_ANDROID_WIDGETS alone;
- the JSDoc no longer claims the upstream fix is unreleased, and no longer carries the 57.0.x
  version history;
- the JSDoc records the XS acceptance protocol result and the flag's remaining lifecycle step;
- no push path, no app.config.ts logic and no test changed;
- the prose carries no em dash, no arrow and no exclamation mark (ai/AGENTS.md writing rules).

Reply merge or fix first.
```

   Verdict handling as step 1, part 9.

10. **Merge.** `git checkout uat-2 && git merge --no-ff feat/19-ios-widgets-flag-on -m "Merge feat/19-ios-widgets-flag-on into uat-2: the iOS widgets flag ships on, reviewed"`
11. **Done when:** `grep -n 'EXPO_PUBLIC_WIDGETS' .env.example` prints `EXPO_PUBLIC_WIDGETS=1`;
    `grep -c "=== '1'" shared/flags.ts` prints `2` (both flags still parse the same way);
    `npx jest shared/__tests__/flags.test.ts shared/__tests__/flagDefaults.test.ts --watchman=false --selectProjects=unit`
    reports `Tests:       32 passed, 32 total`.

### Step 5: Device proof on both phones

0. **Anchor check.** None: no source anchor. Steps 1, 2 and 3 must be merged before this step builds anything.
1. **Goal:** the Android changes are seen on the 3T, and the iOS flag flip is earned by the G.1 acceptance protocol on
   the XS. This step is `(device)`: it writes no source and commits nothing but `LOG.md` evidence.
2. **Branch:** none. This step runs on `uat-2` after steps 1 to 3 are merged. Its findings are committed with step 4's
   commit, or with the `executed` docs commit when step 4 does not run.
3. **Files:** none in the repository. Evidence is saved under `~/athan-device-sweep/session19/`.

   Create it first: `mkdir -p ~/athan-device-sweep/session19`

#### 5a. The 3T: the dark card and the pill

The Android widgets need the PRODUCTION package. A mock build installs under `com.mugtaba.athan.fleettest`, whose
providers are never placed, so the launcher never measures them and the proof cannot run (`ai/AGENTS.md`, session 15d's
durable lesson 6).

1. **Safety read, before anything else.** No clock change happens in this step, but the alarm dump is read anyway so
   the executor knows what is armed:

   ```
   adb -s 8f7ada76 shell dumpsys alarm | grep -A2 "com.mugtaba.athan}" > ~/athan-device-sweep/session19/alarms-before.txt
   ```

   Expected: the app's own alarms, including the one alarm every 3T dump shows at `when 2104803640505` (year 2036, not
   identified). **This step changes no clock**, so no armed alarm can be passed and fired. If the dump is empty, that
   is not a blocker for this step: it proves nothing about widgets. Record what it printed in `LOG.md`.

2. **Build.** Run in the background with a log (`EXECUTOR-BRIEF.md` section 3):

   ```
   zsh ~/athan-device-sweep/session15/bin/build-prod-widgets.zsh uat-2 ~/athan-device-sweep/session19/athan-19-prod.apk
   ```

   That script is `build-prod.zsh` with `EXPO_PUBLIC_ANDROID_WIDGETS=1` appended to the worktree's `.env` (verified
   while planning). Success ends `BUILD-PROD OK`. A build takes about 4 minutes. If it prints `FAILED`, STOP and quote
   the line.

3. **Install**, keeping the app's data:

   ```
   adb -s 8f7ada76 install -r ~/athan-device-sweep/session19/athan-19-prod.apk
   ```

   Expected: `Success`.

4. **Launch once**, so the app pushes a snapshot and arms the native refresh chain:

   ```
   adb -s 8f7ada76 shell am start -n com.mugtaba.athan/.MainActivity
   ```

   Then wait 90 seconds in the background (a loop of `sleep 15`), so at least one native minute tick stamps
   `grantedWidthDp` into each placed kind's props. A pushed snapshot renders at the declared minimum until that tick.

5. **Ask the owner to place the widgets.** The owner holds the phone. Ask exactly:

   > Please put a DARK medium Athan widget on the 3T's home screen, and leave a dark small beside it if there is room.
   > Tell me when they are placed, and whether the card colour now matches your iPhone and whether the active
   > background still runs past the times on the right.

6. **Read the screen, with the owner's answer as the verdict.** Take a screenshot for the executor's own eyes:

   ```
   python3 ~/athan-device-sweep/session5/bin/devcheck.py shot ~/athan-device-sweep/session19/3t-widgets.png
   ```

   The executor cannot see images. Ask the `vision` subagent, with the path and this exact question:

   > In this Android home screen screenshot, look at the Athan prayer times widget with the list of prayer names and
   > times on its right side. One row has a coloured pill behind it. Measure, in pixels: the gap between the pill's
   > left edge and the first letter of that row's prayer name, and the gap between the last digit of that row's time
   > and the pill's right edge. Report both numbers and say whether they look equal. Also describe the colour of the
   > widget's card background in plain words.

   Expected: the two gaps read as equal within a few pixels, and the card reads as a very dark navy or near-black, not
   a bright or vibrant purple. Save the reply in `LOG.md`.

   **The owner's own answer is what decides it.** If the owner says the pill still overhangs, ask section 2.2 item 9's
   question. If the owner says the colour still does not match, STOP and ask: "You reported the dark card still does
   not match the iPhone. It is baked as #020c24, which is the iOS colour over black. What colour should it be?"

7. **Leave the phone** on this production build, with automatic time on (no clock change was made, so nothing to
   restore; confirm with `adb -s 8f7ada76 shell settings get global auto_time`, expected `1`).

#### 5b. The iPhone XS: the G.1 acceptance protocol

This is the gate on step 4. `ai/ISSUES.md` G.1 defines the protocol: all eight home kinds render AND stay rendered for
at least 10 minutes, zero new `ExpoWidgetsTarget.cpu_resource` reports, and zero `Watchdog provision violated` lines in
a fresh syslog capture.

1. **Count the crash reports BEFORE**, so "new" means something:

   ```
   ls ~/Library/Logs/CrashReporter/MobileDevice/*/ 2>/dev/null | grep -c 'ExpoWidgetsTarget.cpu_resource' || echo 0
   ```

   Record the number in `LOG.md`. If the directory does not exist, pull them instead with
   `pymobiledevice3 crash ls --udid 00008020-0015585C22D2002E` and record that count. Either way, the number recorded
   is the baseline.

2. **Build for the device.** The ritual from `ai/AGENTS.md` and the 16a LOG, in this exact order, because
   `expo run:*`/`xcodebuild` never re-syncs an existing native directory:

   ```
   grep -q '^EXPO_PUBLIC_WIDGETS=1$' .env || echo 'EXPO_PUBLIC_WIDGETS=1' >> .env
   npx expo prebuild -p ios --no-install
   (cd ios && pod install)
   ```

   Then the build, in the background with a log:

   ```
   export EXPO_PUBLIC_WIDGETS=1 EXPO_PUBLIC_ENV=local EXPO_PUBLIC_API_KEY=key && xcodebuild -workspace ios/Athan.xcworkspace -scheme Athan -configuration Release -destination 'id=00008020-0015585C22D2002E' DEVELOPMENT_TEAM=9V3WAU9Z54 -allowProvisioningUpdates build
   ```

   Expected: the log ends `** BUILD SUCCEEDED **`. Anything else: STOP and quote the failing line.

   `.env` is untracked and stays that way; it is never committed (`EXECUTOR-BRIEF.md` section 2).

3. **Install and launch:**

   ```
   xcrun devicectl device install app --device 00008020-0015585C22D2002E <the .app path from the build log>
   xcrun devicectl device process launch --terminate-existing --device 00008020-0015585C22D2002E com.mugtaba.athan
   ```

4. **Reboot the phone.** Repeated installs drop the widget extension from the gallery until a restart, which bit the
   16a session four times. Ask the owner to restart the iPhone and to reopen Athan once after it comes back.

5. **Ask the owner to place all eight home kinds.** Ask exactly:

   > Please add every Athan home screen widget from the gallery: the small and the medium, in both Light and Dark, for
   > both Prayer and Extras. That is eight widgets. Tell me when they are all placed, and whether any of them is
   > blank.

6. **Start a syslog capture** before the 10 minute watch, in the background:

   ```
   pymobiledevice3 syslog live --udid 00008020-0015585C22D2002E > ~/athan-device-sweep/session19/xs-syslog.txt
   ```

7. **Watch for 10 minutes**, in the background, as a loop of `sleep 15`. Then ask the owner exactly:

   > It has been ten minutes. Are all eight widgets still showing prayer times, or has any of them gone blank or shown
   > a message about containerBackground?

8. **Read the evidence.** Stop the capture, then:

   ```
   grep -c 'Watchdog provision violated' ~/athan-device-sweep/session19/xs-syslog.txt
   ```

   Expected: `0`.

   Count the crash reports again with the same command as part 1, and compare with the baseline. Expected: unchanged.

9. **The verdict.** The protocol PASSES only when all three hold: the owner reports eight kinds rendering and still
   rendering after ten minutes, the watchdog count is 0, and the crash count is unchanged. Write all three readings in
   `LOG.md`.

   - **PASS:** run step 4.
   - **FAIL:** do not run step 4. Ask section 2.2 item 8's question, and leave the flag as it is.

   Note for the executor: the owner reported a black card reading "please adopt containerBackground API" for about 5
   seconds when PLACING a widget. That is ISSUES G.2, it is expected, and it is NOT a protocol failure. The protocol
   asks whether the kinds render and STAY rendered; a few seconds of placeholder at placement is the open G.2 row,
   queued as the next session. A kind still blank after ten minutes IS a failure.

10. **Leave the phone** on this build. Nothing to restore.

## 7. Device proof

Section 6's step 5 IS the device proof, written as a step because it gates step 4. Its commands, expected readings and
evidence paths are given there in full. Summary of what is saved under `~/athan-device-sweep/session19/`:

| File | What it holds |
| --- | --- |
| `alarms-before.txt` | The 3T's alarm dump, read before any device work (no clock change is made in this plan) |
| `athan-19-prod.apk` | The production build with Android widgets enabled |
| `3t-widgets.png` | The 3T home screen, read by the `vision` subagent, never sent to the owner |
| `xs-syslog.txt` | The XS syslog capture across the 10 minute watch |

Safety: **this plan changes no clock**, so no armed alarm can be passed and fired. The alarm dump is read anyway, and
its contents recorded, so the executor can see what is armed. Every 3T dump lists one app alarm at `when 2104803640505`
(year 2036, not identified); that alarm is expected and is not a finding.

The phones are left on: the 3T on the production build from step 5a with automatic time on; the XS on the Release
build from step 5b.

The owner receives no screenshots. Where a screenshot must be read, the `vision` subagent reads it and the executor
describes what it reported.

## 8. Records

### Findings text

Add to `ai/features/uat-2/AUDIT-FINDINGS.md`, under the exact heading
`## Session 19: widget polish, the horizon, and the iOS flag (2026-09-24)`:

```
Four jobs from the owner's testing on the iPhone XS and an Android phone on 2026-09-24.

**Android's dark card now matches iOS (ISSUES 39).** iOS renders rgba(2, 13, 38, 0.95) over the
wallpaper; Android's card is an opaque bitmap because Glance draws no rounded corners, and it
carried #252387, a bright purple nobody had reconciled with the iOS palette. It is now #020c24,
the iOS colour composited over black. The brief asked for an audit of the whole dark palette
rather than the card alone: the generator holds 11 colour literals, and exactly two sit outside
the layout palette, both the deliberate opaque card forms. Every pill fill, pill stroke and moon
colour was already byte-identical. The light card keeps #fcfcfe by ruling: its opaque form over
black is a visible grey, and the owner's ruling named the dark card.

**The Android active pill wraps its row text (ISSUES 40).** The pill filled the list column while
the rows sat 12dp inside it, so all the slack landed right of the times: 21dp at a 310dp grant,
29dp at 380dp, more as the screen widened. The pill column now takes the dead space as a leading
inset and the rows take that inset plus one 12dp gutter, so both margins are the 12dp the owner
already approved on the left. Where a narrow grant cannot afford 12dp each side, both sides take
half the slack, which keeps them equal and keeps the pill inside its column. Verified against the
real renderer at nine grants from 200dp to 560dp, and on the 3T: <PILL_VISION_READING>.

**The horizon is 7 days.** TIMELINE_DAYS feeds both platforms through buildSequence. Measured with
the real builders: 7 days is 40 iOS entries and 17KB, where 30 was 178 and 75KB. The entry bounds
moved from 250 and 500 to 60 and 60, because a bound sized for 30 days guards nothing at 7, and
both stay literals: a bound derived from the constant would follow the horizon upward and notice
nothing. Accepted risk, recorded plainly: a user whose Background App Refresh is off, or who
force-quits, has a widget that goes stale after a week instead of a month. The owner took that
trade deliberately, because survival without a refresh is the horizon's whole job.

**The iOS widgets flag ships on.** expo-widgets 58.0.1 shipped expo/expo#49810, and the installed
58.0.3 renders AnyView(view).id(child.childIdentity) with no UUID() anywhere, so the random
per-render identity hack behind G.1 is gone. The G.1 acceptance protocol ran on the XS:
<XS_PROTOCOL_READING>. The parse was deliberately NOT inverted: shared/flags.ts states its own
fail direction, "mistakes disable, never enable", and defaulting it on reverses that rule and
fails 13 tests across 5 suites, one of which exists purely to pin the shipped default. The flag is
build-time transport, so .env.example documents EXPO_PUBLIC_WIDGETS=1, which every widget build
already passes.

DURABLE LESSONS. (1) **A margin measured from a container is not a margin measured from its
content**: the pill and the rows are siblings inside the list column, so insetting only the rows
put the air on one side and the slack on the other, which is exactly what the eye reads as
"extended even further out". (2) **A symmetric assertion can be satisfied by nonsense**: asserting
left equals right passed on a negative pill inset, a pill wider than its own column, until a
non-negative bound was added beside it. (3) **A volume guard sized against one horizon guards
nothing at another**, and the fix is not to derive it from the horizon, which would follow it
upward, but to re-measure and re-pin the literal. (4) **A feature flag's default is not the same
question as whether the feature ships**: this one is build-time transport with a documented fail
direction, so shipping it on is a catalog and documentation change, not a parse change.
```

The executor replaces `<PILL_VISION_READING>` with what the `vision` subagent reported about the two gaps and the card
colour, plus the owner's own verdict, and `<XS_PROTOCOL_READING>` with the three readings from step 5b part 9 (the
owner's report on the eight kinds, the watchdog count, and the crash count against its baseline).

### Table rows

The executor sets the `ai/plans/README.md` row 15 to EXECUTED.

For the auditor, to apply on PASS. In `ai/prompts/README.md`, the `widget-polish-and-horizon.md` row's status cell
becomes:

```
DONE 2026-09-24: the Android dark card is #020c24 (the iOS colour over black), the active pill wraps its row text with equal air both sides at every grant, TIMELINE_DAYS is 7 with its bounds re-measured, and the iOS widgets flag ships on after the G.1 acceptance protocol passed on the XS
```

Also on PASS, in `ai/ISSUES.md`: findings 39 and 40 move from `[OPEN, queued as row 15]` to `[CLOSED 2026-09-24]`, and
G.1's status line records that the flag flipped after its acceptance protocol passed. G.2 stays OPEN and keeps its
row.

And in `ai/AGENTS.md`, the horizon paragraph under "Widget architecture invariants" ("The horizon is 30 days, and the
entry budget is what caps it") is rewritten to the 7-day ruling with this plan's measurements, keeping its explanation
of why the constant lives in `shared/`.

### Docs commit

```
<VERSION> - docs(plans): session 19 executed: the Android dark card and pill, the 7-day horizon, and the iOS widgets flag
```

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session pushes `uat-2` after a
PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

### Symptom table

| Symptom | Cause | Action |
| --- | --- | --- |
| An anchor counts other than 1 | `uat-2` moved under the plan | NEEDS REPLAN (`EXECUTOR-BRIEF.md` section 1, item 4) |
| Step 1's new test passes before the change | The helper is reading the wrong column | STOP and ask: the test is not proving what the plan says it proves |
| `BREAK NOT APPLIED` on step 1's third break | The `gutter` line was not written in the verbatim form the plan gives | STOP and ask (section 2.2 item 3) |
| Biome reports `noUnsafeOptionalChaining` in the new helper | The padding reader was written as `(found?.value as number[])[0]` | Use the plan's verbatim two-line form. This is work still to do, not a finding |
| Biome reformats the rows column | Its modifier grew past the line width | Accept the plan's verbatim wrapped form |
| A `perl` substitution in a break script errors with `Unknown regexp modifier` | The replacement text holds `/` | The plan's scripts already use `{}` delimiters. If a new one is needed, use `{}` too |
| Step 2 regenerates more than two PNGs | The generator is not deterministic for untouched colours | STOP and ask. That is a finding about the generator |
| The centre pixel is not `(2, 12, 36, 255)` | The literal or the compositing is wrong | STOP and ask |
| Step 3's extras bound of 60 fails | The extras builder emits more than measured | STOP and ask, quoting the count |
| The XS build fails at the bundle phase with widgets missing | `EXPO_PUBLIC_WIDGETS` did not reach the bundle | The step exports it AND appends it to `.env`; both are required (16a LOG). Retry once with both in place, then STOP |
| The XS gallery shows no Athan widgets after install | Repeated installs drop the extension until a restart | Reboot the phone (step 5b part 4). A second failure is STOP |
| A widget shows the containerBackground card for a few seconds at placement | ISSUES G.2, open, queued as the next row | Expected. NOT a protocol failure. Record it and carry on |
| A widget is still blank after 10 minutes | The G.1 chain is not fixed on this device | Protocol FAILS. Do not run step 4. Ask section 2.2 item 8's question |
| The owner says the pill still overhangs | The arithmetic does not match the device | Ask section 2.2 item 9's question |
| Anything not listed | | `EXECUTOR-BRIEF.md` section 7's table |

### Anticipated review fixes

Each is given word for word. These are the only fixes the executor may make to anything this plan fixed. A reviewer
finding that meets all three conditions in `EXECUTOR-BRIEF.md` section 4, item 8, the executor applies itself and
records in `LOG.md`; those three conditions are written there and are never restated here.

1. **If a reviewer says the new test's grant list should include the 3T's real grant:** it already does. 380dp is the
   first entry. No change.
2. **If a reviewer says `gutter` should be a named constant rather than a local:** it must stay a local. It derives
   from `LIST_WIDTH`, which is itself computed per render from the stamped grant, so a module constant could not hold
   it. No change.
3. **If a reviewer asks for the pill geometry to be extracted into a helper function:** do not. The widget body is
   serialized by the `'widget'` directive and every helper must live inside it; three locals used once each in the
   same branch is not a helper's worth of work. No change.
4. **If a reviewer says step 3's bounds should be derived from `TIMELINE_DAYS`:** do not. Decision 5 and the test's own
   comment give the reason: a derived bound follows the horizon upward and guards nothing. No change.
5. **If a reviewer says step 4 should invert the flag's parse so widgets default on:** do not. Decision 6 gives the
   measurement: it reverses the file's stated fail direction and fails 13 tests across 5 suites. No change.
6. **If a reviewer asks step 4 to stamp the parked What's New widgets item:** do not. Decision 9: no store release
   happens in this session, so stamping it would advertise a feature in a release that is not happening. No change.

### Stopping part-way

| Step | Restore with `git checkout --` | Delete |
| --- | --- | --- |
| 1 | `widgets/PrayerWidget.tsx`, `shared/__tests__/widgetRenderer.test.ts`, `app.json`, `package.json` | nothing |
| 2 | `scripts/generate-widget-assets.py`, `shared/__tests__/widgetAssets.test.ts`, `assets/widgets/athan_widget_card_dark_small.png`, `assets/widgets/athan_widget_card_dark_medium.png`, `app.json`, `package.json` | nothing |
| 3 | `shared/widgetTimeline.ts`, `shared/__tests__/widgetTimeline.test.ts`, `app.json`, `package.json` | nothing |
| 4 | `shared/flags.ts`, `.env.example`, `app.json`, `package.json` | nothing |
| 5 | nothing in the repository | nothing (the APK and evidence stay under `~/athan-device-sweep/session19/`) |

`EXECUTOR-BRIEF.md` section 4a has the full procedure, including saving the unfinished diff.

## 11. Subagents in this plan

No model is named: a subagent always runs the spawning session's own model.

| Step | Agent type | Isolation | Why | Where its prompt is |
| --- | --- | --- | --- | --- |
| 1 | `Code Reviewer` | `worktree` | Reviews the pill geometry commit before merge | Step 1, part 9 |
| 2 | `Code Reviewer` | `worktree` | Reviews the dark card commit before merge | Step 2, part 9 |
| 3 | `Code Reviewer` | `worktree` | Reviews the horizon commit before merge | Step 3, part 9 |
| 4 | `Code Reviewer` | `worktree` | Reviews the flag commit before merge | Step 4, part 9 |
| 5a | `vision` | none | Reads the 3T screenshot; the executor cannot see images | Step 5a, part 6 |

Only the agents listed may be used.

## 12. Report to the owner

The final message starts with `Execution session` and a `Time:` line from `date '+%H:%M:%S %d.%m.%Y'`, and contains:

- a few plain sentences: what changed on each platform, what the 3T showed, and what the XS protocol read;
- the progress table (format in `EXECUTOR-BRIEF.md` section 6);
- any decision now waiting on the owner (there should be none: every one was taken while planning);
- the four-line handoff from the `athan-next` skill, section 5.
