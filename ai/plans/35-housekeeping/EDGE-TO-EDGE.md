# Edge-to-edge on Android 15: what the migration actually is

The row queued this as "drop `react-native-edge-to-edge` for RN's built-in `edgeToEdgeEnabled`",
BLOCKED on an Android 10+ device. This page records what is true on 2026-09-28, measured against the
installed tree and an Android 15 (API 35) emulator, `athan_test_avd`.

## The row conflated two different things, and only one of them is gone

There are **two** spellings of `edgeToEdgeEnabled`, and the earlier finding in `FINDINGS.md` was
right about one and wrong about the other. Corrected here.

| Where | Status in SDK 58 / RN 0.88 | Evidence |
| --- | --- | --- |
| `android.edgeToEdgeEnabled` in `app.json` | **REMOVED.** Setting it earns a prebuild warning telling you to delete it | `@expo/prebuild-config/.../withEdgeToEdge.js`: "`edgeToEdgeEnabled` customization is no longer available - Android 16 makes edge-to-edge mandatory" |
| `edgeToEdgeEnabled` as a **Gradle property** | **EXISTS.** Read by RN's Gradle plugin into a BuildConfig field | `@react-native/gradle-plugin/.../PropertyUtils.kt:29`, and `AgpConfiguratorUtils.kt:70` writes `IS_EDGE_TO_EDGE_ENABLED` |

So the migration target is not simply absent, as the first pass concluded. It is a Gradle property,
and the honest question is whether it can replace what the library does.

## What the library supplies that RN does not

Three separate things, and RN 0.88 replaces none of them completely:

1. **`SystemBars`, the component.** Used in `app/_layout.tsx:82` and `device/listeners.ts:45-46`,
   which re-applies the style when the app returns from the background. **RN 0.88 exports no
   `SystemBars` of any kind** (grep of `react-native/Libraries/` returns nothing). The library's own
   README says to pair the built-in property with `@zoontek/react-native-navigation-bar` if you want
   to control the navigation bar style, which is a SECOND dependency to replace one.
2. **The theme.** `android/app/src/main/res/values/styles.xml` declares
   `<style name="AppTheme" parent="Theme.EdgeToEdge">`, and the library ships that parent across
   `values/`, `values-v27/`, `values-v29/` and `values-v30/`, each tuning
   `windowLayoutInDisplayCutoutMode`, `enforceStatusBarContrast` and `windowLightNavigationBar` per
   API level. Dropping the library means writing those four theme variants by hand.
3. **`enforceNavigationBarContrast`.** A custom attribute the library declares
   (`values/attrs.xml`) and the app sets to `false`. This is the one the row said needed Android 10+
   to verify, because the scrim it governs is only drawn from API 29.

RN's own `enableEdgeToEdge()` in `WindowUtil.kt` reads
`android.R.attr.enforceNavigationBarContrast` (the PLATFORM attribute, API 29+) rather than the
library's, so the two are not interchangeable: the library's attribute is resolved by its own module
(`EdgeToEdgeModuleImpl.isNavigationBarTransparent`).

## The deciding fact: RN already forces edge-to-edge on this app regardless

`WindowUtil.updateEdgeToEdgeFeatureFlag`, called from `ReactActivityDelegate`, turns the flag on
whenever the app targets SDK 35+ and the device runs Android 15+, **without any property being set**:

```kotlin
if (AndroidVersion.isAtLeastTargetSdk35(activity)) {
  if (Build.VERSION.SDK_INT >= VERSION_CODE_BAKLAVA) { isEdgeToEdgeFeatureFlagOn = true }
  else { /* reads windowOptOutEdgeToEdgeEnforcement */ }
}
if (isEdgeToEdgeFeatureFlagOn) { activity.window.enableEdgeToEdge() }
```

This app targets SDK 36 (`android/app/build.gradle` via `targetSdkVersion`, read as 37 in the
resolved lint model). So on the Android 15 emulator and on any Android 15+ phone, edge-to-edge is
**already enforced by the platform and by RN**, and setting the Gradle property would change nothing
about whether the app draws edge to edge. It would only change the BuildConfig field.

## Verdict: CANCELLED, not blocked, and not for the reason first recorded

The first pass called it cancelled because the target was "removed". The sharper reason, now that an
Android 15 device is on the bench:

- The app is **already edge-to-edge** on Android 15+, enforced by the platform, with no change.
- Setting the Gradle property replaces **none** of the three things the library supplies.
- Removing the library costs: hand-writing four API-level theme variants, replacing `SystemBars` at
  two call sites with a second dependency (`@zoontek/react-native-navigation-bar`), and re-declaring
  a custom attribute. To delete one working dependency.
- The 3T (Android 9) is the floor device and is NOT edge-to-edge enforced, so the library's theme is
  what makes the two platforms agree. This is the same shape as the owner's 2026-09-26 ruling on the
  widget card PNGs: keep the working path when the floor device needs it.

**What SHOULD be done instead, and is:** verify on Android 15 that the current setup behaves, since
that is the thing nobody had ever checked. That is the device proof below, and it is the real value
this row was holding.
