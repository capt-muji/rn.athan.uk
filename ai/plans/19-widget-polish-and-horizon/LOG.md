# Execution log: Session 19

Executed 2026-09-24. Subagents were unavailable this whole session (the harness
answered `Model unavailable` on every spawn), and the owner directed the session
to run without them, so every review in this log is the execution session's own,
against the plan's review prompt as a checklist.

## Pre-flight

`bash $TMPDIR/preflight-19.sh 1` printed `PREFLIGHT OK`: all five anchors counted
1, Pillow present, the 3T answered `device` and the XS answered `connected`.
Version at start 1.27.360, planned at 1.27.357.

## Step 1: The active pill wraps the row text with equal air each side

- Branch `fix/19-pill-wraps-row-text`, commit `e58c4363`, version 1.27.361,
  merged `7bbff7b0`.
- Red, before the change: exactly the two tests the plan named failed.
  `bounds the active pill to the list column, not the card remainder` gave
  `Expected: ArrayContaining [{"modifier": "padding", "value": [17, 1, 0, 0]}]`
  against `Received: [{"modifier": "padding", "value": [0, 1, 0, 0]}]`, and
  `gives the active pill equal air each side of the row text, at every grant`
  gave `Expected: 29 / Received: 12`. Both are the plan's predicted lines.
- Green: `Tests:       49 passed, 49 total`. `npx tsc --noEmit` and
  `npx biome check . --error-on-warnings` both exited 0.
- Breaks: all four caught, ending `ALL AS EXPECTED: 1`.
- Hook: `Test Suites: 170 passed, 170 total`, `Tests: 4646 passed, 4646 total`,
  four 100% coverage lines.
- Review: the session's own, one round, verdict merge. Checked the diff against
  the plan's step 1 review prompt point by point: the pill column carries
  `PILL_LEAD` with its 1dp drop intact, the rows column carries `ROWS_LEAD`, the
  gutter is clamped exactly as the plan's verbatim line gives it, `PILL_LEAD`
  cannot go negative (the clamp's break proves the test notices when it can), no
  reference constant or sizing arithmetic moved, and nothing outside
  `widgets/PrayerWidget.tsx` and `shared/__tests__/widgetRenderer.test.ts`
  changed besides the version and plan files.

## Step 2: The Android dark card matches iOS

- Branch `fix/19-android-dark-card`, commit `b9b66457` (amended once, for the
  comment rewrite below), version 1.27.362, merged `173ca58f`.
- Red: `bakes the Android-only card and geometry contract...` failed on
  `Expected substring: "CARD_DARK = css(\"#020c24\")"`, the plan's line.
- Regeneration rewrote exactly the two dark card PNGs, and the medium's centre
  pixel read `(2, 12, 36, 255)`, the predicted value.
- Green: `Tests: 3 passed, 3 total`; tsc and Biome 0. Breaks: 3 of 3,
  `ALL AS EXPECTED: 1`. Hook: 170 suites, 4646 tests.
- **Amended before merge, on the owner's instruction**: every comment written
  this session was too long and several explained WHAT rather than WHY. All of
  them were cut back (`widgets/PrayerWidget.tsx`, the generator, both test
  files). Tests and Biome re-run green after the rewrite.
- Review: the session's own, one round, verdict merge. `CARD_DARK` is the iOS
  colour over black, `CARD_LIGHT` untouched, two PNGs changed, both test pins
  moved together, no layout palette colour touched.

## Step 3: The timeline horizon drops to 7 days

- Branch `fix/19-horizon-seven-days`, commit `8d2621c8`, version 1.27.363,
  merged `068d85d7`.
- Red: the three predicted failures, with the predicted numbers: `Received: 178`
  for the entry bound, `Received: 30` for the horizon, `Received: 121` for the
  extras bound.
- Green: `Tests: 52 passed, 52 total`; tsc and Biome 0. Breaks: 3 of 3,
  `ALL AS EXPECTED: 1`. Hook: 170 suites, 4646 tests.
- Review: the session's own, one round, verdict merge. The constant is 7, both
  bounds are literals sized between what 7 days emits and what 10 would, the
  200KB budget is unchanged, and the extras fixture comment names the right
  span and Friday for an 8-day window.

## Step 5a: the 3T, measured rather than eyeballed

The `vision` subagent was unavailable, so the screenshot was measured in Python
instead of described, which is stronger evidence anyway.

- Build: `build-prod-widgets.zsh uat-2` ended `BUILD-PROD OK`, versionName
  1.27.363, real API key, arm64-v8a, 333s. Installed with `install -r`
  (`Success`), launched, and the widget refresh alarm was seen firing in
  logcat.
- The owner already had eight widgets placed, including a dark medium, so no
  placement was needed.
- **The pill (finding 40): fixed, and symmetric on glass.** Measuring the
  standard dark pill band in `3t-widgets.png`: the pill spans x 566..974 and
  the active row's text spans x 600..940, giving a **34px left gap and a 34px
  right gap** across every row of the glyph band. At 420dpi that is 12.9dp each
  side, which is the 12dp gutter plus antialiasing. The reported overhang is
  gone.
- **The card (finding 39): the baked colour is on screen.** The dominant pixel
  inside the dark medium card is exactly `rgb(2, 12, 36)`, both above the pill
  and below the rows: `#020c24`, the iOS colour over black.
- Alarms were read before any device work
  (`~/athan-device-sweep/session19/alarms-before.txt`, 15 lines) and no clock
  was changed, so nothing could fire.
- The phone is left on this production build with automatic time on.

## Step 5b: the iPhone XS, blocked on a USB connection

The XS answers `xcrun devicectl list devices` as `connected`, but that is the
network pairing: `pymobiledevice3 usbmux list` returns `[]`, so the syslog
capture the G.1 acceptance protocol depends on cannot run, and neither can the
crash-report pull. The protocol needs the phone on the cable.

Step 4 is therefore NOT run: its part 0 gate is explicit that the flag flips
only after the protocol passes.

## Checkpoint 1, and the two reverts after it

`checkpoint-1-android-good` tags `068d85d7`, the state the owner called 🐋  "it
looks identical actually to iOS... right now it's actually perfect", with its APK
and screenshot saved under `~/athan-device-sweep/session19/`.

Two attempts followed, both on the owner's instruction, and both reverted on the
owner's device evidence. Neither is a defect in the plan: the plan's four jobs
are untouched by either.

| Version | What it tried | Outcome |
| --- | --- | --- |
| 1.27.364 | Copy every iOS metric to Android value for value | REVERTED in 1.27.367. The medium's left content sat too far left and the day list rendered "really tiny" |
| 1.27.365 | Square smalls (110x110) and full-width mediums (250x150) | REVERTED in 1.27.366. Both kinds came out as tall rectangles, and the medium lost its prayer times |

**The metric copy failed for a structural reason.** iOS's values are tuned for a
329x155pt card; the Android medium is 380x110dp. A padding or a gutter is judged
by its relationship to the space around it, so the same number reads differently
in a card of a different shape. The platform-specific tuning that looked like
drift WAS the shape difference.

**The box-size change failed because I mis-modelled the launcher.** I assumed a
grid cell is square, so equal minWidth and minHeight would give a square widget.
A cell is TALLER than it is wide, so 110x110 produced a portrait box. The
original 160x110 was a landscape declaration compensating for exactly that, and
nothing recorded why. My arithmetic table verified the INNER layout across 180 to
560dp and was still correct; the declared box is a different question that only a
device can answer.

**Two durable facts, now in `PARITY.md`:** an appwidget cell is not square, so
never infer a widget's shape from its dp declaration (read it back from
`dumpsys appwidget`, where `min=(WxH)` is `dp << 8`); and Android keeps each
widget's box from the moment it was placed, so a declaration change is invisible
until the widget is removed and re-added.

1.27.367 restores the widget look to checkpoint 1 byte for byte, confirmed by
regenerating the PNGs and diffing against the tag: the only difference from the
tag anywhere is the version string. Re-verified on the 3T after install: 771,501
pixels of `rgb(2,12,36)` (the checkpoint dark card), the indigo gone, and the
extras pill symmetric at 34px left and 39px right, the 5px being the glyph's own
side bearing.

**What this session KEEPS from its own plan:** the pill wrapping its row text
(finding 40) and the 7-day horizon. The colour fix (finding 39) is in checkpoint
1 and survives both reverts.

## Owner-requested work after the reverts, all landed and verified on the 3T

| Version | What | Verified |
| --- | --- | --- |
| 1.27.369 | The dark palette softens: eyebrow `#ff69b4` to `#f774b6`, hero and passed rows `#ffffff` to `#f6f8fc`, card `rgba(2, 13, 38)` to `rgba(9, 21, 47)` | Measured on the 3T: the new pink at 3,800px, the new hero at 6,768px, the new card at 780,540px, and every old value at zero. All three shifts measure 12 to 14 units of colour distance, gentle by design |
| 1.27.370 | The medium splits in half and centres its trio | 50/50 halves within 1dp at every grant from 258 to 560dp, pinned by a new test that fails on the previous code |

**The centring bug is the most useful find of the session.** The trio's `Column`
carried `horizontalAlignment='center'` with no width. A Column that shrink-wraps
its content has nothing to centre WITHIN, so it parked at its parent's leading
edge and the trio sat 17dp left of its own half's centre, measured from the
device screenshot. Two smaller causes stacked on it: `HERO_WIDTH` was 170/347 of
the inner width rather than half, and the card padding was 13 leading against 20
trailing, together worth another 4.8dp.

It was reported on the dark theme and then on the light. One code path serves
both, so both were wrong and one fix cured both, which the new test proves by
asserting the fill modifier on each theme.

DURABLE LESSON for `ai/AGENTS.md`: in a Glance composition an alignment only
acts inside the space its container occupies, so a shrink-wrapped container
centres nothing. Any `horizontalAlignment` that must position content inside a
larger box needs `fillMaxWidth()` beside it.

## Raised mid-execution by the owner: full iOS/Android visual parity

The owner asked for the Android widgets to match the iPhone exactly: sizing,
proportions, padding, font, letter spacing, everything except shadows, keeping
Android's own time format. That is outside this plan's four jobs, and the
measurement behind it is in `PARITY.md` beside this log. The headline: the two
cards are different shapes (iOS 329x155pt, Android 380x110dp, an inner height
of 129 against 81), so a 6-row list at iOS's 23pt rows needs 138dp of height
that Android does not have. Colour parity is done; several typographic gaps are
single literals; three of the values involved were tuned by the owner on device
in earlier sessions, and the card's height is the one change that risks the
widget vanishing from the 3T picker, which is how session 15b lost it at 400dp.

## Step 5b: the G.1 acceptance protocol on the iPhone XS (run 2026-09-25)

Run in a later session than steps 1 to 3, because the protocol needs the owner
to place the widgets. The build already on the phone is 1.27.369, which carries
the extension; nothing was rebuilt or reinstalled, so parts 2 to 4 were not
needed.

- Watch window: 06:23:43 to 06:33:51 (10m 8s). Evidence under
  `~/athan-device-sweep/session19b/`.
- **Crash baseline BEFORE:** 15 `ExpoWidgetsTarget.cpu_resource` reports,
  newest 2026-09-20 (`crash-before.txt`), matching what session 19's AUDIT.md
  recorded.
- **Reading 1, the owner:** all eight home widgets still showing prayer times
  after ten minutes. Nothing blank, no containerBackground message.
- **Reading 2, watchdog:** `grep -c 'Watchdog provision violated'` = **0**
  across 346,199 captured lines.
- **Reading 3, crash reports AFTER:** **15**, unchanged, none dated
  2026-09-25 (`crash-after.txt`).

**VERDICT: PASS on all three readings. Step 4 ran.**

Corroborating evidence the protocol does not require, saved in
`widget-render-evidence.txt`: iOS's own `WidgetRenderer_Default` powerlog names
every one of the eight home kinds plus both Lock Screen kinds as rendered, and
reports per-view `renderTime` of 0.012s to 0.063s. G.1 cost 5 to 13 CPU-seconds
per kind-placement, so this is about three orders of magnitude below the failure
mode. Four kinds show ~475s of continuous on-screen time with ~47,000 frames
submitted, which is `Text(timerInterval:)` ticking for roughly eight unbroken
minutes: the countdown is alive, not a frozen last render.

A false start worth recording: `grep -iE 'jetsam|memory_?limit'` returned 13
hits, every one routine `runningboardd` bookkeeping for Reminders, Siri, Find My
and SpringBoard. Filtering to real terminations left only an Apple Watch daemon
and `searchd`. Nothing Athan-related was killed.

## Step 4: The iOS widgets flag ships on

- Branch: `feat/19-ios-widgets-flag-on`
- Gate: step 5b PASSED above.
- Baseline and after: `flags.test.ts` + `flagDefaults.test.ts`
  `Tests: 32 passed, 32 total`, unchanged. The parity check reports
  `Tests: 20 skipped, 3 passed, 23 total`, as the plan predicts.
- `tsc` exit 0, Biome exit 0.
- `.env.example`: `EXPO_PUBLIC_WIDGETS=0` becomes `1`.
  `EXPO_PUBLIC_ANDROID_WIDGETS` untouched.
- `shared/flags.ts`: the `widgets` JSDoc rewritten. The parse is untouched,
  per decision 6.
- Commit: `ce3b3029`, version 1.27.378. Hook: `Tests: 4647 passed, 4647 total`,
  170 suites, four 100% coverage lines.
- Review: merge, one round, performed by the session itself (the owner
  instructed on 2026-09-25 that this session use no subagents; the review ran
  against step 4's own checklist). Verified: the parse line is absent from the
  diff, so `EXPO_PUBLIC_WIDGETS === '1'` is untouched; `androidWidgets` is
  unchanged; only the six files the step lists appear; the JSDoc carries no
  "Flip condition" paragraph, no 57.0.x history and no unreleased claim.
