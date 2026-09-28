# Android 15 device proof: the overlay is aligned under enforced edge-to-edge

Run on `athan_test_avd`, a Pixel 10 AVD, **Android 15 / API 35, 1080x2424 at 420dpi**, from a debug
build of `session/35-edge-to-edge` served by Metro. This is the device class the row was blocked on,
and the first time this app has been measured on it since RN 0.88.

**Why alignment is the thing to measure, not "does it open".** ISSUES F.10 was exactly this bug:
under edge-to-edge the Android overlay rendered **one status bar too low**, 63px at this density,
because a pre-migration `+ insets.top` correction double-counted once `measureInWindow` became
window-absolute and the root began spanning the full window. It was fixed in 1.6.0 against RN 0.86.
Nothing had re-checked it on RN 0.88, and the status bar here is **63px**, the same figure, so a
regression would be unmistakable.

## How alignment is measured, not eyeballed

The overlay's press-catchers tile the whole screen **except** the selected row: four rectangles with
a hole in the middle. So the hole IS the overlay's idea of where the row is, and the row's own rect
is where it is actually drawn. If the two differ, the overlay is misaligned by exactly that much.
Both are read from the live accessibility tree.

## Standard list, top row (Fajr, index 0), where a status-bar offset shows worst

| Edge | Row as drawn | Catcher hole | Delta |
| --- | ---: | ---: | ---: |
| Top | 600 | 600 | **0** |
| Bottom | 749 | 750 | +1 |
| Left | 32 | 32 | **0** |
| Right | 1049 | 1049 | **0** |

## Standard list, a deep row (Magrib, index 4)

| Edge | Row as drawn | Catcher hole | Delta |
| --- | ---: | ---: | ---: |
| Top | 1199 | 1199 | **0** |
| Bottom | 1349 | 1348 | −1 |
| Left | 32 | 32 | **0** |
| Right | 1049 | 1049 | **0** |

## Extras list (Duha, index 3), which also renders the explanation box

| Edge | Delta |
| --- | ---: |
| Top | **0** |
| Bottom | +1 |
| Left | **0** |
| Right | **0** |

The box renders **above** the row, as `showInfoBoxAbove` requires for index >= 3, with a 100px gap,
and sits inside the content column. Its arrow points at the row's centre. Content correct in both
languages: "20 mins after Sunrise" and "٢٠ دقيقة بعد الشروق".

**Verdict: no status-bar offset anywhere.** Every top, left and right delta is exactly 0. The single
±1px on the bottom edge is the DIP-to-px rounding F.10's own fix recorded, not misalignment, and it
appears as both +1 and −1 across rows, which is what rounding does and what a constant offset does
not. **F.10 has not regressed on RN 0.88.** Screenshots at
`~/athan-device-sweep/session35/android15-list.png` and `android15-overlay-duha.png` show the same
thing to the eye: the active pill flush on its row, the veil dimming everything else.

## The back-press rule, on the device

| What | Result |
| --- | --- |
| Back with the overlay open | Overlay closed, **app still in focus**, list intact |
| Back with the settings sheet open | Sheet closed, **app still in focus** |
| Predictive back | Opted out: the installed APK carries `android:enableOnBackInvokedCallback(0x0101066c)=false`, so `BackHandler` fires |

**A trap worth recording: a stale `uiautomator` dump read as "the app exited".** The first back-press
reading showed the launcher, which looked like the app being left. `dumpsys window` taken three
seconds later showed `mCurrentFocus=com.mugtaba.athan/.MainActivity`, and a settled re-read agreed.
`ai/AGENTS.md` already warns that `uiautomator dump` serves stale trees during animation; this is
that, and it nearly produced a false defect report. **Confirm a suspected failure against
`dumpsys window` before believing the tree.**

## Also observed, unprompted

The **Android home-screen widget renders correctly on Android 15**, reading "FAJR / 23h 16m / 04:03 /
Tue" on the launcher. It has only ever been proven on the 3T (Android 9) and the Find X8.

## Tooling notes, so these are not read as app failures

- **The Maestro flow is committed but has NOT completed a green run on this image**, and the file
  says so. Its driver times out on this arm64 Android 15 AVD more often than it starts
  (`AndroidDriverTimeoutException`, six attempts across two ports and both the CLI and the MCP).
  When it did start, it got as far as the settings tap, which means every assertion before it
  passed: the list drew, the overlay opened on a row, and the back press closed it with the app
  still alive. **Every alignment number in this document comes from the live accessibility tree via
  `mobile-mcp`, not from Maestro**, so none of it depends on that flow running.
- **Maestro and `mobile-mcp` cannot both hold UiAutomation.** Maestro's driver fails to start with
  `UiAutomationService ... already registered!` while mobile-mcp has it. Force-stopping
  `dev.mobile.maestro.test` and killing `mobilecli` frees it, and the two must never be interleaved
  in one session again: each failed Maestro run also leaves the app backgrounded, because its
  `pressKey: back` lands on a screen the flow did not expect.
- **The flow does not assert the settings sheet.** The button is icon-only and Maestro's tree does
  not carry its `accessibilityLabel` on this image, so a `tapOn` fails for a reader limitation, not
  an app defect. The sheet's back handling is covered by `Sheet.test.tsx` and was confirmed here by
  hand. Asserting it would make the flow fail for the wrong reason.
- **The flow carries no `launchApp`**, because on a debug build that restarts into the dev launcher
  and needs a Metro pick. A release build can add it.
