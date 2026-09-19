# Session brief: Android widget polish + mock build loop (owner rulings, 2026-09-19)

Dictated by the owner after reviewing session 15's device proof on the OnePlus 3T. Every item
below is an owner ruling unless marked as a design question for the planning session.

## 1. Self-refresh (the big one)

The widgets never update on their own on Android: counters freeze until the app is opened.
The owner expects iOS-like behaviour: the counter ticks down by itself. Root context from
session 15: Android pauses JS timers when the host pauses, so the app-side flip chain dies;
the layout already recomputes correctly at ANY render (proven: a +60h clock jump rendered the
jumped day's prayers perfectly). What is missing is a render DRIVER that works with the app
closed. Design candidates for planning: exact-alarm receiver chain (the app already holds the
alarm permissions for prayer notifications; a native receiver calling
`expo.modules.widgets.WidgetsUpdater.reload` needs no JS), WorkManager periodic (15-min floor),
or hybrid (exact alarms at minute flips while a recent app session arms them, boundaries after).
Owner expectation to design against: minute-visible countdown movement without opening the app.

## 2. Solid cards (Android only)

All 8 Android widgets render with translucent/faded backgrounds; the owner dislikes it. Cards
must be SOLID on Android, both themes, all 8 (iOS keeps its translucent design). The card
backgrounds are the generated PNGs (`scripts/generate-widget-assets.py`): bake them opaque
(same palette colours, alpha 1.0) for Android.

## 3. Footer alignment

The "DDD · Lon" footer's vertical position differs across the 8 widgets; 7 sit too low, the
dark medium is "almost good". All 8 must share one vertical position with more bottom padding.
(The owner accepts the dark medium's current height as the reference, maybe a touch higher.)

## 4. Active pill (the next-prayer highlight)

- Left/right padding is correct (keep the 8dp insets).
- Add TOP and BOTTOM padding: it currently hugs the row text vertically.
- Keep the corner radius as-is; with vertical padding the rounding will read properly.
- REMOVE the drop shadow on Android: "it looks really really bad" on the 3T (the owner
  suspects the 3T's weak shadow rendering, like the app's own active background history).
  Regenerate the Android pill PNGs without the shadow; iOS keeps its shadow.

## 5. Card corner radius

The widget cards' four corners are "very bendy, very soft, too rounded" on Android. Make the
radius stronger (smaller) in the generator (`CARD_RADIUS_PT = 22` today; pick the sharper
value in planning against iOS's look on the 3T).

## 6. Resizable + square-ish smalls

Make the Android widgets resizable (`resizeMode`). The 4 smalls currently land thin-and-tall
(2 cells wide x 3 tall on the 3T launcher, 364x540px); the owner wants them closer to square
like iOS. Planning must decide the min-dimension recipe (minWidth/minHeight/targetCell) that
lands squarer spans on OxygenOS and allows resizing; mediums resizable too.

## 7. Stale card centering

The stale card's text is not horizontally centered. Fix (all 8, both themes).

## 8. Mock build loop for styling review (do this EARLY in the session)

Restore the launch-relative mock resting state the owner wants, for BOTH platforms:
Fajr at minus 3 minutes from download, every following prayer 1 minute apart, Asr next at
plus 3 minutes (order: Fajr -3, [each +1], ..., Asr +3). Build with widgets ENABLED on both
platforms (EXPO_PUBLIC_WIDGETS=1 AND EXPO_PUBLIC_ANDROID_WIDGETS=1) against the mocks, and
install on the phone(s) so the owner can judge styling live. This is the iteration loop for
items 2-7.

## Facts carried from session 15

- Coverage IS 100% on both platforms (4603 tests, widgets/ collected; renderer suites evaluate
  the real layouts against both platforms' component sets). Keep it there.
- The build variants live in `~/athan-device-sweep/session15/bin/` (build-prod-widgets.zsh,
  build-mock-widgets.zsh - the mock one forces the fleettest suffix now).
- The device atlas (`e2e/device-atlas-oneplus3t.md`) holds every launcher coordinate, the
  placement mechanics, and both render-failure causes. Read it before driving the device.
- The fleettest mock app is installed beside the real app; the real app is on production
  v14 (1.27.266) with widgets placed across 4 launcher pages.
- Aligned jetpack names only in widget layouts (contract-guarded); fixed-width boxes + pure
  alignment for rows (the Glance starvation family - see LOG.md steps 13-20).
