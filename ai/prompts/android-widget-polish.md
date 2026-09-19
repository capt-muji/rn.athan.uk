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

## 2. Solid cards, keep the glow (Android only)

All 8 Android widgets render with translucent/faded backgrounds; the owner dislikes ONLY the
fade. Keep the card styling exactly as designed (the dark cards keep their glow orbs; the
light cards keep their look) and make the base OPAQUE - alpha 1.0 instead of the 0.92/0.88
translucency - for both themes, all 8. (Owner, verbatim: "I still like the glow that you
have on the dark cards... make it solid with the glow or the PNG or whatever you did.")
iOS keeps its translucent design. The card backgrounds are the generated PNGs
(`scripts/generate-widget-assets.py`).

## 3. Footer alignment

The "DDD · Lon" footer's vertical position differs across the 8 widgets; 7 sit too low, and
the dark medium (the closest of the eight) is STILL a little low too. Push EVERY widget's
footer up from the bottom edge with more bottom padding - including the dark medium - and
make all 8 share one uniform height. Do not treat any current widget as the finished
reference.

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

## 6. Grid-aligned sizing: small = 50% width, medium = 100% width, resizable

Make the Android widgets resizable AND aligned to the home-screen grid:
- SMALLS: 50% of screen width (2 of 4 columns). Today they land thin-and-tall (2 cells wide
  x 3 tall on the 3T launcher, 364x540px); the owner wants them closer to square like iOS.
- MEDIUMS: 100% of screen width. Today they take ~90% and leave an unusable ~10% strip where
  nothing else fits - "we might as well make it extend to 100%".

RESEARCH ITEM for planning (the owner asked for the investigation): how much control the
appwidget-provider declaration (`minWidth`/`minHeight`/`targetCellWidth`/`targetCellHeight`)
actually gives over the launcher's chosen span on OEM launchers (OxygenOS 3T first, stock
Android second), and what recipe lands 2-of-4 and 4-of-4 spans reliably. `targetCell*` only
applies on API 31+; the 3T is API 28, so minWidth arithmetic is the lever there. Also verify
how `resizeMode` interacts with the initial span. Decide the final recipe in planning and
prove it on the 3T with screenshots.

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
