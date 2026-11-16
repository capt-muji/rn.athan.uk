# OnePlus 3T device atlas (1080x1920, serial 3T_SERIAL, OxygenOS / Android 9)

Density 420: dump and screencap pixels are dp x 2.625 (the language sheet's 16dp line pin
reads 42px, 24dp reads 63px - the step-2 and step-3 reads agree).

Every coordinate below was measured by reading a real screenshot during session 15 (2026-09-19)
unless marked otherwise. Drives: `adb -s 3T_SERIAL shell input tap X Y`. Long-press is
`input swipe X Y X Y <ms>`. Coordinates are pixels on the 1080x1920 panel.

**Read this before screenshotting anything.** An atlas exists so a screen is measured once and
replayed thereafter, instead of re-reading the same pixels every session. Look here first; add what
you learn; re-measure only when a check below fails.

**The key every coordinate hangs off, and why all four parts matter.** A coordinate is only valid
for one `model + panel + density + screen state`. The heading names the first three, and each table
row names the state. Change any part and the numbers are void: the Find X8 carries a display-size
override (560 physical, 480 effective) that moves every tap point while the panel stays the same,
which is exactly the trap that makes a remembered coordinate worse than no coordinate. One atlas
file per device, named `device-atlas-<model>.md`.

**Verify before you trust, and it is one cheap command.** A saved coordinate is a hypothesis about
a screen that may have scrolled, re-laid out or updated since. Confirm the expected screen is up
before replaying a sequence (a logcat line, a `dumpsys` reading, or one screenshot), then replay
without further reads. The strip-scroll warning in the widget-picker section below is this rule
learned the hard way: after a horizontal scroll the cell under a remembered coordinate CHANGED, and
a dead ColorNote widget got placed by accident.

**What earns a row here:** anything a structured reader cannot see, which is what forced the
screenshot in the first place. `mobile-mcp`'s element list and Maestro's inspect return refs that
survive a layout change, so anything they can reach is better driven by them and does not belong in
an atlas. What lands here is the rest: OEM dialogs outside the app's hierarchy, launcher and
widget-picker mechanics, surfaces `uiautomator dump` will not serve.

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
| Prayer row's alert bell | (969, 1012) | one glyph run x 950-988 in the row band 970-1054, measured from pixels 2026-10-31 (Android 9's AX dump served neither bounds nor liveness for the RNGH Pressable hosts; the bell column x is shared by every row) |
| Prayer row (overlay-open tap) | (540, 1012) | the row's own centre at the bell's y; the frame-audit and interleave drivers' overlay-open point |
| Row-band swipe (the interleave) | (864, 700) to (216, 700), 150ms | T-565's tap-then-swipe proof: a leftward page turn across the rows, high enough to clear the countdown; y 700 crosses the list above the 1012 row band, both endpoints inside the pager's page |
| Settings sheet: Athan row | (540, 851) | first row of the Prayer card, sheet open at its default snap |
| Settings sheet scrolled to Other: Language row | (516, 1509) | Arabic face; row اللغة at [143,1480][890,1538], sheet scrolled until the أخرى section (measured 2026-10-19). Below the fold at the default snap, and Maestro cannot text-find it there: scroll first, then tap |
| Language sheet: English row | (888, 1450) | second list row, right-aligned [825,1421][952,1479] under the RTL sheet; list at its top, Arabic face (measured 2026-10-19) |
| Settings sheet scrolled to Other: Language / Help / What's new / Check for updates rows | (540, 1247) / (540, 1373) / (540, 1500) / (540, 1625) | English face after two `input swipe 540 1500 540 1000 400` flings at the default snap, centers from the live tree (re-measured 2026-10-27 when T-381 swapped What's New below Help and the update row settled last; row pitch ~127 px, so shift by the pitch for any deeper or shallower scroll); What's new hides on a silent release and every row below it moves up one pitch. The update row carries the download badge and the refresh ring in place of a chevron, and settles green after its one check per launch |

## OEM settings: system locale (measured 2026-11-01, T-538 step 3)

| Mechanic | Command / coordinates | Notes |
|---|---|---|
| Open the Languages list directly | `am start -a android.settings.LOCALE_SETTINGS` | lands on the "Languages" preference list; no Settings-root walk needed |
| Add a language | 'Add a language' row (bottom of the list) > Search button [937,123][1064,249] > type ASCII (e.g. `chinese`) > tap the endonym row | ASCII search matches the endonym's English name too ('简体中文|Simplified Chinese'); tapping the language opens a REGION picker (中国/澳门/香港/新加坡...) - the region tap inserts the locale |
| New locale lands LAST | drag its row handle (x~1006, the ImageView right edge zone) above row 1 | NO move-to-top prompt on Android 9; `input swipe 1006 <rowY> 1006 <targetY> 900` reorders live; verify with `getprop persist.sys.locale` |
| Remove a locale | header overflow ('More options' [969,123][1064,249]) > Remove > tick the row's CheckBox > Remove > confirm dialog OK | rows show checkboxes in remove mode; row taps alone open no menu |

Row positions move with every add/remove/reorder: find rows in the live tree (Maestro
hierarchy serves these OEM screens), never by remembered coordinate.

## OEM settings: font scale, keyguard, wake (measured 2026-11-01, T-538 step 2)

| Mechanic | Command / coordinates | Notes |
| --- | --- | --- |
| Font size steps | Settings > Display > Font size: radio row at scale 1.0 = Small (244,1758) 0.85 / Default (430,1758) 1.0 / Large (650,1758) 1.15 / Largest (836,1758) 1.3 | the only four stops (0.85 also cross-checked by setting it directly and reading the row summary as "Small"); `settings put system font_scale <v>` matches them exactly and applies live, verified by read-back per stop |
| Keyguard (swipe-only, no PIN) | `wm dismiss-keyguard` | injected `input swipe` does NOT dismiss this keyguard, awake or freshly woken; only the shell command does |
| Keep awake through a long protocol | `svc power stayon usb` | the panel sleeps mid-protocol otherwise (input to a dark screen is dropped silently); unset when the protocol ends |

- The Font-size screen's radio row RE-LAYS-OUT at every scale change (row y moves
  ~8-130px): never replay radio coordinates across a scale change - re-dump and tap
  the live bounds, or set the value and read it back. At 1.15 the row sat at
  y 1687-1813, at 1.0 at y 1695-1821.
- The Font-size screen is reachable only through the Display list (the
  Settings$FontSizeSettingsActivity component falls back to the Settings root);
  the Display list needs 3+ flings at 1.0 to reach DISPLAY SIZE, two at 0.85.

## Driver notes (T-538 step 3, 2026-11-01)

- Maestro's `hierarchy` serves an EMPTY or partial tree right after a process relaunch
  (a 1-byte dump and a 30-node launcher tree, both on fresh launches), and once served a
  minute-old tree of a dead process: after any kill/relaunch, re-dump until the content
  matches the expected screen (its language, its live countdown), and pair load-bearing
  dumps with a same-moment screencap when in doubt.
- Under the T-538 device licence one in-app language switch (zh-Hans) reverted to en
  unattended within ~3 minutes, app foregrounded, no input, cause not established;
  later switches held after a 15s settle before the kill. Verify the active language
  from each read's own dump content rather than trusting the switch.

## Known dialogs

| Element | Tap point | Notes |
| --- | --- | --- |
| Play Protect "security check" prompt on install | varies | PREVENTED for adb installs by `settings put global verifier_verify_adb_installs 0` and `package_verifier_enable 0` (session 15; original values were 1 and 1) |
| Location permission: DENY / ALLOW | (607, 1113) / (783, 1113) | Android 9 asks once with NO precise/approximate choice; that split arrives at API 31 (session 37) |
| Play Services "Location Accuracy": No thanks / Turn on | (657, 1543) / (878, 1543) | a SECOND prompt after the grant, from Play Services rather than the app; declining it leaves `getCurrentPositionAsync` with no fix (session 37) |

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
  to advance, verify by screenshot before long-pressing: after a strip scroll the cell under a
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
