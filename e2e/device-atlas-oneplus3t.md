# OnePlus 3T device atlas (1080x1920, serial 8f7ada76, OxygenOS / Android 9)

Every coordinate below was measured by a vision agent reading a real screenshot during session 15
(2026-09-19) unless marked otherwise. Drives: `adb -s 8f7ada76 shell input tap X Y`. Long-press is
`input swipe X Y X Y <ms>`. Coordinates are pixels on the 1080x1920 panel.

## Launcher: long-press home sheet

Open with `input keyevent KEYCODE_HOME` then `input swipe 540 900 540 900 800`.

| Element | Tap point | Notes |
| --- | --- | --- |
| WALLPAPERS | (236, 1675) | icon row y~1605-1690, labels y~1718-1742 |
| WIDGETS | (539, 1675) | opens the widget picker sheet |
| HOME SETTINGS | (844, 1675) | |

## Launcher: widget picker sheet

Scroll carefully with SHORT swipes INSIDE the list (e.g. `input swipe 540 800 540 500 500`).
A swipe that starts on the dimmed home area behind the sheet DISMISSES the picker back to the
long-press sheet (learned the hard way).

| Element | Tap point | Notes |
| --- | --- | --- |
| App list (alphabetical) | scroll | Borealis/Card Package/Chrome at top of list when ~10% scrolled; Athan sorts first |
| Scrollbar track | x~1061-1079 | thumb position tells scroll depth |

## Athan app (release build)

| Element | Tap point | Notes |
| --- | --- | --- |
| Settings (hex-nut) button | bottom-centre, ~ (540, 1830) | dev-client builds also show a blue circle FAB (dev menu) nearby; the FAB never renders on iOS 26.5 scene builds |

## Known dialogs

| Element | Tap point | Notes |
| --- | --- | --- |
| Play Protect "security check" prompt on install | varies | PREVENTED for adb installs by `settings put global verifier_verify_adb_installs 0` and `package_verifier_enable 0` (session 15; original values were 1 and 1) |

## Launcher: widget placement mechanics ( OxygenOS 3 / Android 9 )

| Action | Command / coordinates | Notes |
| --- | --- | --- |
| Place a widget | open picker, navigate so the target preview cell is FULLY visible, then `input swipe X Y X Y 900` (long-press the cell center) | the picker closes and the widget drops straight onto the home screen (no drag needed) |
| Remove a widget | `input swipe X Y X Y 900` on the WIDGET body (not its icon), popup appears ~200px below; tap the Remove item (icon + label between them) | popup items seen: Remove / Uninstall / Edit (icon-anchored menu) or Remove / App info (widget-anchored menu). NEVER tap Uninstall by accident (207px right of Remove) |
| Orphaned "Loading widget" placeholders | long-press ON THE TEXT (e.g. (236,400)) to get the widget menu | long-pressing the app-icon inside a widget gets an app menu instead |

## Widget picker: Athan section (session 15 layout, verified)

- Section sorts alphabetically by app; the Athan section is a HORIZONTAL strip of 8 cells in this
  order: ET(Dark) 2x2, ET(Dark) 4x2, ET(Light) 2x2, ET(Light) 4x2, NP(Dark) 2x2, NP(Dark) 4x2,
  NP(Light) 2x2, NP(Light) 4x2 (ET = Extra Times, NP = Next Prayer).
- Strip at its start: cell row occupies y~284-643 with labels to ~730; centers x=234 / 655 / 987
  (col 3 clipped at the screen edge; swipe the strip horizontally `input swipe 950 460 200 460 400`
  to advance, verify by screenshot before long-pressing — after a strip scroll the cell under a
  remembered coordinate CHANGES; that is how a dead ColorNote widget got placed by accident).
- Previews render the generic app-icon fallback (initialLayout is a loading view); real art appears
  after placement and the first snapshot render.

## Home screen layout (measured)

| Element | Coordinates |
| --- | --- |
| Grid | 5 columns; dock icons at x = 135 / 337 / 540 / 742 / 944, y = 1747 |
| Drawer chevron | (540, 1617) |
| Dock item 3 | Athan app icon (540, 1747) |

## Widget render failures: two root causes found on the 3T (session 15)

| Symptom | Cause | Fix |
| --- | --- | --- |
| Widget stuck on "Loading widget" forever after placement | R8 stripped `androidx.work.OverwritingInputMerger`'s constructor in release builds; the WorkManager worker that composes every Glance update dies (`WM-InputMerger: NoSuchMethodException` in logcat) | `expo-build-properties` android.extraProguardRules: `-keep class androidx.work.** { *; }` and androidx.glance.** (commit 1.27.250) |
| Widget renders literally "Property 'AndroidText' doesn't exist" | The widget runtime injects @expo/ui/jetpack-compose exports as globals under canonical names; aliased imports in the layout (e.g. `Text as AndroidText`) do not exist as globals on device | Layout must spell canonical names (Text/Image/Spacer/Box/Column/Row); platform pick via `typeof Column !== 'undefined'` (commit 1.27.251) |

Diagnostics that worked: `adb shell dumpsys appwidget` (all 8 providers
registered even when the picker looked wrong), `aapt dump xmltree <apk>
AndroidManifest.xml` (receivers present in the APK), and reading the
launcher's own logs (`LauncherAppWidgetHostView: updateAppWidget: null`).

## Session 15 screenshot index

Shots live under `~/athan-device-sweep/session15/shots/` (not committed). This file records what
each taught us so the pixels never need re-reading:

| Shot | Screen | Learned coordinates |
| --- | --- | --- |
| 00-current | Athan home (real data) | none needed |
| 01-longpress | long-press sheet | the three buttons above |
| 02-widgets-list | widget picker, ~10% scrolled | picker layout, scrollbar, alphabetical order |
| 03-widgets-top | (picker dismissed by a bad swipe) | warning recorded above |
| 04-widgets-2 | widget picker reopened, short scroll | see below as verified |
