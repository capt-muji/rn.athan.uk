# Android widgets on the Oppo Find X8: fixed dp layout breaks outside the 3T

Found 2026-09-24 by the owner placing the widgets on a second Android phone for the
first time. Everything below is measured from `adb` and from the device screenshot
`x8-home-1.png` / `x8-home-4.png` in this folder, not inferred.

## The device, and why it differs from the 3T

| | OnePlus 3T | Oppo Find X8 |
| --- | --- | --- |
| Android | 9 (API 28) | 16 (API 36) |
| Resolution | 1080x1920 | 1080x2376 |
| Physical density | 420 | **560** |
| Effective density | 420 | **480 (user display-size override)** |
| Widget host | AOSP-ish launcher | ColorOS launcher |

The X8 runs a **display-size override**: `wm density` reports `Physical density: 560`
and `Override density: 480`. Text scales with that override. A layout built from
hardcoded dp boxes does not.

## What the screenshot shows

All three placed widgets render, so this is not the blank-widget class of failure.
The card, the palette, the hero countdown, the active pill and the times column are
all correct. The prayer NAMES are destroyed.

Medium light: the name column reads `se`, `ar`, `ib` where it should read `Sunrise`,
`Dhuhr`, `Magrib`. Medium dark: `ight`, `Third`, `or` where it should read `Midnight`,
`Last Third`, `Suhoor`. Fajr's and Isha's names are missing altogether.

The names are not ellipsized and not wrapped. They are **clipped on their left edge**,
which means the list block is positioned partly outside the card rather than the text
being too long for its box. The times column (`05:18`, `06:47`, `12:58`) is intact and
correctly right-justified, so only the name side is displaced.

The small widget is structurally fine (hero only, no list) but its letters sit wider
apart than on the 3T, which is the same density override acting on text inside a box
whose width never changed.

## Root cause: the medium's fixed widths exceed the card

`widgets/PrayerWidget.tsx`, Android branch:

```
const HERO_WIDTH = 170;   // :212
const LIST_WIDTH = 162;   // :199
const ROW_NAME_WIDTH = 82; // :213
const ROW_TIME_WIDTH = 54; // :214
const A_ROW_HEIGHT = 24;   // :191
const ROW_TEXT_SIZE = 13;  // :192
```

`HERO_WIDTH + LIST_WIDTH = 332dp`, plus `APad(13, 13, 20, ...)` horizontal padding,
inside a provider declared at `android:minWidth="310dp"`
(`android/app/src/main/res/xml/prayer_widget_medium_info.xml:3`). The content is
**over 22dp wider than the card's own declared minimum** before padding is counted.

`minWidth` is a floor, not a grant. The 3T's launcher happened to hand these providers
enough width that the overflow did not show. The X8's launcher grants what its grid
says, the Row overflows, and Glance clips the first child's left edge. That is exactly
the symptom: names sliced from the left, times unaffected because they sit at the
right anchor.

The comment at `:207` records that `HERO_WIDTH` was made fixed because a
`fillMaxWidth` fraction starved the list to zero width on the 3T. The fix for one
device became the bug on another: both numbers were tuned against a single launcher.

## Why this is one root cause, not three complaints

The owner reported three things. They are the same defect seen from three angles.

| Symptom | Mechanism |
| --- | --- |
| "the list is cut off", "medium widgets unusable" | fixed content wider than the card, clipped left |
| "too much letter spacing", "fonts different" | text scales with the 480 density override, the dp boxes do not |
| "a little bit too big" | `minWidth` 160/310dp resolves to more physical pixels at 560dpi |

Nothing here is ColorOS being exotic. Any device whose launcher grants a different
cell width, or whose user changed display size, reproduces it. The 3T passed by
coincidence.

## The target look

`reference-ios-target-look.png` in this folder is the owner's reference (iPhone XS
replica simulator, 2026-09-20; the owner confirms the physical XS matches it). The
medium there shows all six rows with FULL names, `Fajr` through `Isha`, names
left-aligned, times right-aligned, the active pill spanning the whole list block.
That is what the Android medium must look like.

It is a reference for the LOOK, not for the implementation: iOS renders through
SwiftUI with its own `MEDIUM_LIST_WIDTH = 146`, Android renders through Glance.
Copying the iOS numbers across is what produced the current fixed-width Android
layout in the first place.

## What a fix has to be

Proportional, not another set of tuned constants. The owner's ruling (2026-09-24):
the widgets are meant to be dynamic across phone, tablet and both platforms, so the
next attempt must not hardcode a second device's numbers.

Constraints a design has to respect, both already learned the hard way:

- A `fillMaxWidth` FRACTION on the first Row child starved the list to zero on the 3T
  (`:207`). Whatever replaces the fixed widths has to be verified on the 3T as well,
  or it re-breaks the device that currently works.
- The expo-widgets plugin writes grid-relative `targetCell*` attributes that Android
  12+ prefers over `minWidth`; `plugins/androidWidgetGrid.js` strips them after
  prebuild. Any sizing change interacts with that plugin.
- The 3T launcher computes spans as `ceil((minWidth + 30) / 70)` and HIDES providers
  that are too wide rather than clamping them (AGENTS.md, session 15b). Raising
  `minWidth` to fit the content is therefore not a free move: 400dp made the provider
  invisible in the 3T picker.

Untested and unknown: whether the X8 clips because of the grant alone, or because the
density override compounds it. Both devices are on the bench and the override can be
reset with `wm density reset`, so the next session can separate them instead of
guessing.

## Second defect, already queued separately

Widget taps do not open the app, confirmed by the owner on BOTH the 3T and the X8.
That is queue row 15c (`NOT PLANNED`) and AGENTS.md already records the likely cause:
expo-widgets routes taps for layout buttons only. It is not part of this rendering
bug and should not be folded into it.

## Fixed: the medium sizes itself from the granted width (session 15d, 2026-09-24)

The medium composition no longer holds widths. It holds proportions, taken against the width
the launcher actually granted, which the native refresh tick stamps into each kind's props from
`OPTION_APPWIDGET_MIN_WIDTH`. Measured on the X8 at 1.27.342:

| Density | Widget | Inner | Hero | List | Name box | Row text | Names |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 480 (user override) | 324dp | 291 | 143 | 148 | 69 | 11sp | all 11 complete |
| 560 (native) | 278dp | 245 | 120 | 125 | 58 | 10sp | all 11 complete |

At both densities every name shares one left origin (x 559-560 and x 555-556), the times stay
right-aligned to within 2px, the pill spans the full list block, and nothing ellipsizes or wraps.
`Sunrise` is no longer `se`, `Magrib` no longer `ib`, `Midnight` no longer `ight`.

### Why neither Glance proportional primitive was used

`expo-widgets` 58.0.3 cannot reach either. Its Glance converter maps `fillMaxWidth(fraction)` to
a bare `GlanceModifier.fillMaxWidth()`, discarding the `fraction` field that `@expo/ui`'s
`FillMaxWidthParams` carries, and its `when` has no `weight` case, so `weight()` falls through to
`else -> null` and becomes a no-op
(`node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/ExpoWidgetEmittableTree.kt`,
lines 400 to 421).

That is also the real cause of the failure recorded in `widgets/PrayerWidget.tsx`'s old comment,
where a `fillMaxWidth` fraction "took the full card and squeezed the day list to zero width" on
the 3T. The fraction was dropped, so 0.5 became 1.0. Session 15b read it as a Glance quirk and
pinned the widths, which is how the fixed dp arrived. A candidate for an upstream PR; not raised
by this session.

### Two things the fix has to keep doing

**Text scales with its box.** Glance has no autoshrink, so a name box narrowed by a tight grant
would clip `Last Third` at a fixed 13sp however wide the box arithmetic got. The row text is
`13 * scale`, floored at 10sp. The 560dpi reading above is the proof: 10sp text in a 58dp box.

**The stamp is re-read, not written once.** A JS push carries no grant, so a pushed snapshot
renders at the declared 310dp minimum until the next minute tick restamps it. That is a correct,
uncropped card sitting narrow for at most 60 seconds, never a broken one.

### This was never an X8 defect

The widget's granted width falls below what a fixed layout assumes whenever the launcher's grid
is narrower than the one the constants were tuned on, and a user can cause that on any phone by
re-columning their home screen. The proportional layout holds at every width measured, down to
the 258dp a 6-column grid yields on the X8 at native density.
