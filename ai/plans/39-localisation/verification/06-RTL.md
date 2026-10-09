# Verification: RTL pinning

| Field | Value |
| --- | --- |
| Base | `uat` `52109ec0` (1.29.303) |
| Date | 2026-10-09 |
| Claim under test | The layout is pinned LTR forever through the `expo-localization` config plugin with `supportsRTL: false`, applied natively before React loads and deterministic on the first frame on both platforms. Every string is left-aligned in every language (D7, D31, Q3, Q21). |
| Result | 12 confirmed, 4 contradicted, 2 uncertain |

## Method

Read in full: `ai/AGENTS.md`, `SINGLE-LANGUAGE-PIVOT.md`, `OWNER-DECISIONS.md`, `PLAN.md`,
`research/R10-RTL-PINNING.md`, `research/R3-RTL-AND-SCRIPTS.md`, `R3-FINDINGS.md`,
`research/R8-FIRST-RUN-LOCALE.md`, `LOCALIZATION-API.md`.

Downloaded with `npm pack` into separate empty scratch folders and read, nothing executed:
`expo-localization@58.0.4` and `expo-localization@58.0.3`. Read in full from 58.0.4:
`plugin/src/withExpoLocalization.ts`, `plugin/build/withExpoLocalization.js`,
`android/.../LocalizationModule.kt`, `LocalizationPackage.kt`, `LocalizationUtils.kt`,
`android/src/main/res/values/strings.xml`, `ios/LocalizationModule.swift`, `src/Localization.ts`,
`src/ExpoLocalization.native.ts`, `expo-module.config.json`, `package.json`, `CHANGELOG.md`.
Diffed 58.0.3 against 58.0.4 for the plugin, both native modules and the changelog.

Read in full from the installed tree: `I18nUtil.kt`, `I18nManagerModule.kt`, `RCTI18nUtil.m`,
`RCTI18nUtil.h`, `RCTI18nManager.mm`, `Libraries/ReactNative/I18nManager.js`,
`src/private/specs_DEPRECATED/modules/NativeI18nManager.js`, `RCTFabricSurface.mm`, `RCTTextPrimitivesConversions.h`,
`node_modules/expo/ios/ExpoObjC/AppDelegates/ExpoReactNativeFactory.mm`,
`node_modules/expo-modules-core/ios/Core/ModuleHolder.swift`, `ModuleRegistry.swift`,
`app/_layout.tsx`, `jsx-runtime-shim.ts`, `plugins/portraitOnlyIpad.js`, and from the original
checkout's prebuild folders `android/app/src/main/AndroidManifest.xml`, `res/values/strings.xml`,
`ios/Athan/AppDelegate.swift`, `SceneDelegate.swift`, both `Info.plist` files.

Path prefixes used below: `RN` is `node_modules/react-native`. `RA` is
`RN/ReactAndroid/src/main/java/com/facebook/react`. `TLM` is
`RN/ReactCommon/react/renderer/textlayoutmanager/platform/ios/react/renderer/textlayoutmanager`.
`AOSP-35` is the Android SDK platform source package `android-35` installed with the SDK.

Ran: `npm view` and `npm pack` against the npm registry (the only external source), `tar`,
`diff`, `git grep` and `grep` to locate, then direct reads. Partial reads are listed under
"Not verified". No build, prebuild, install, simulator or device was used. No test was run. No
web page was fetched.

## Findings

### RTL-1. CONFIRMED: `expo-localization` is not installed, and SDK 58 pairs it at `~58.0.3`, which resolves to 58.0.4 today
- **Record says:** `expo-localization` is not installed (pivot code fact 7). The SDK 58 line is 58.0.3 or 58.0.4 (`LOCALIZATION-API.md`, R8 item 1).
- **Evidence:** `package.json` dependencies carry no `expo-localization`. `node_modules/expo-localization` does not exist. `node_modules/expo/bundledNativeModules.json:63` reads `"expo-localization": "~58.0.3"`. The registry tags read `next: 58.0.4`, `latest: 57.0.2`, and the published 58 line is 58.0.0 to 58.0.4.
- **Attack tried:** Diffed 58.0.3 against 58.0.4 to see whether the RTL code moved between the two versions the record cites. It did not. The diff touches `uses24HourClock` on iOS, one Kotlin comment, and the `supportedLocales` resource qualifiers.
- **Consequence:** Require 58.0.4 or later. `expo-localization@58.0.4/CHANGELOG.md:7` fixes the Android resource qualifier for Indonesian (`id` to the legacy `in`). Indonesian is a guaranteed language under D32, and 58.0.3 writes a qualifier Android does not resolve.

### RTL-2. CONFIRMED: what `supportsRTL: false` and `forcesRTL` write, and what happens when neither is set
- **Record says:** The setting writes `android:supportsRtl="false"` and `ExpoLocalization_supportsRTL = false` (pivot, R10 recommended mechanism).
- **Evidence:**
  - Android manifest: `expo-localization@58.0.4/plugin/src/withExpoLocalization.ts:80-87` sets `mainApplication.$['android:supportsRtl'] = String(supportsRTL)`, called unconditionally at `:150-153`.
  - Android string resource: `:210-216` writes `ExpoLocalization_supportsRTL` = `false` to `strings.xml` only when `supportsRTL` is false. `:217-222` writes `ExpoLocalization_forcesRTL` = `true` only when `forcesRTL` is true.
  - iOS: `:107-112` sets `config.ios.infoPlist.ExpoLocalization_supportsRTL = false` and `ExpoLocalization_forcesRTL = true` under the same conditions.
  - Also written: `config.extra.supportsRTL` and `config.extra.forcesRTL` (`:235-243`).
  - Neither option set: the manifest attribute is still written as `"true"` (default at `:137`). The library's own `strings.xml` holds `unset` for both keys (`expo-localization@58.0.4/android/src/main/res/values/strings.xml:3-4`), `toBooleanStrictOrNull()` returns null, and the module falls back to allow true, force false (`android/.../LocalizationModule.kt:54-58`). iOS reads a missing plist key the same way (`ios/LocalizationModule.swift:53-54`).
  - `plugin/build/withExpoLocalization.js:113-136,198-222` matches the source line for line.
- **Attack tried:** Looked for a second writer of the manifest attribute, a `tools:replace`, or any UIKit key. None exists in the plugin.
- **Consequence:** none for the pin itself. See RTL-17 for the three other things the same plugin call writes.

### RTL-3. CONFIRMED: on Android the manifest attribute alone pins the first frame, with no dependence on module timing
- **Record says:** Deterministic on the first frame on Android.
- **Evidence:** `RA/modules/i18nmanager/I18nUtil.kt:21-23` computes `applicationHasRtlSupport(context) && (isRTLForced(context) || (isRTLAllowed(context) && isDevicePreferredLanguageRTL(context)))`. `:30-32` reads `ApplicationInfo.FLAG_SUPPORTS_RTL`. With the flag off the result is false whatever the preferences hold. The surface reads it at `RA/fabric/FabricUIManager.java:377` and `:1110`, and at `RA/runtime/ReactSurfaceImpl.kt:74-83` and `:184-193`.
- **Attack tried:** Looked for a path where a stored `forceRTL` or a system property beats the manifest. `isRTLForced` sits inside the `&&`, so it cannot.
- **Consequence:** none. The Android half of the pin does not need the native module at all.

### RTL-4. CONTRADICTED (MINOR): on iOS the value is not applied "before React loads". It is applied on the JS thread after the runtime is created. The first frame still resolves LTR, by ordering
- **Record says:** The value is "applied natively before React loads" and the module writes the preferences "before React loads" (pivot RTL section, R10 finding 6 and recommended mechanism).
- **Evidence:**
  - The module's only hook is `OnCreate` (`expo-localization@58.0.4/ios/LocalizationModule.swift:24-26`), which calls `RCTI18nUtil.allowRTL` and `forceRTL` (`:52-62`). The package declares no app-delegate subscriber (`expo-module.config.json:1-14`).
  - `OnCreate` fires from `ModuleHolder.init` (`node_modules/expo-modules-core/ios/Core/ModuleHolder.swift:51-57`).
  - Modules are registered in `host:didInitializeRuntime:`, which the file marks `// [JS thread]` (`node_modules/expo/ios/ExpoObjC/AppDelegates/ExpoReactNativeFactory.mm:39-76`, `registerNativeModules` at `:75`). The generated `ios/Athan/AppDelegate.swift:16-17` uses that factory.
  - React Native calls that delegate inside the runtime-initialised callback, then loads the bundle (`RN/ReactCommon/react/runtime/platform/ios/ReactCommon/RCTInstance.mm:462`, read as lines 380 to 475).
  - Meanwhile the main thread has already created the surface and read the direction once: `RN/React/Fabric/Surface/RCTFabricSurface.mm:69` calls `_updateLayoutContext`, which reads `[[RCTI18nUtil sharedInstance] isRTL]` at `:180`.
  - Why the first frame survives: the direction is read again when the surface view is first created (`RCTFabricSurface.mm:146-148`). That happens in `-start` (`:94-114`), and `RCTHost.mm:438-440` defers `-start` to the buffered runtime executor, "after the main JS bundle was fully executed". Nothing touches `surface.view` earlier: `RCTSurfaceHostingView.mm:226-230` only adds the surface view once the stage is running.
- **Attack tried:** Searched `RN/Libraries/AppDelegate`, `RN/React/Base/Surface`, `node_modules/expo/ios`, `expo-modules-core/ios`, `expo-splash-screen/ios` and `expo-router/ios` for an earlier `surface.view` access. Found only `RCTSurfaceHostingView.mm:170` (stage running) and the proxy getter at `RCTSurfaceHostingProxyRootView.mm:69-72`.
- **Consequence:** Correct the wording. The iOS pin rests on an ordering inside React Native (`RCTHost.mm:438-440`), not on running before React. That matters at 2.0.0 because iOS has no stored value on the first launch after an upgrade, and `CFBundleLocalizations` will newly include Arabic. Add one iOS device proof to the pre-flight: fresh install and upgrade install on an Arabic-language iPhone, first launch, rows not mirrored.

### RTL-5. CONFIRMED: the module rewrites both preferences on every creation, into the same stores React Native reads
- **Record says:** The module rewrites `allowRTL` and `forceRTL` every launch (pivot, R10 finding 6).
- **Evidence:** Android `OnCreate` calls `setRTLFromStringResources` (`expo-localization@58.0.4/android/.../LocalizationModule.kt:38-41`), which always calls both `I18nUtil.instance.allowRTL(context, supportsRTL)` and `forceRTL(context, forcesRTL)` (`:54-63`). Those write SharedPreferences file `com.facebook.react.modules.i18nmanager.I18nUtil`, keys `RCTI18nUtil_allowRTL` and `RCTI18nUtil_forceRTL` (`RA/modules/i18nmanager/I18nUtil.kt:42-44,58-60,74-88`). iOS writes `NSUserDefaults` keys of the same names and synchronises (`RN/React/Modules/RCTI18nUtil.m:57-61,73-77`). The module keeps no store of its own.
- **Attack tried:** Looked for a guard that skips the write when the value is unchanged, or for a separate Expo-owned key. Neither exists.
- **Consequence:** none. Note the reverse case: with `supportsRTL: false` any later JS `forceRTL(true)` is also reset to false at the next launch, which is what the pin wants.

### RTL-6. CONFIRMED: a JavaScript `I18nManager.allowRTL(false)` is the wrong mechanism, though two of the three stated reasons need correcting
- **Record says:** It takes effect on the next launch only, races the first launch, and is rewritten by the module on every launch.
- **Evidence:** `RN/Libraries/ReactNative/I18nManager.js:15-22` reads the native constants once at module load, and `:44-50` only forwards the call. The native side stores a preference (`RA/modules/i18nmanager/I18nManagerModule.kt:32-34`, `RN/React/CoreModules/RCTI18nManager.mm:29-32`). On Android the surface reads `isRTL` natively when the surface object is built and when it starts (`RA/runtime/ReactSurfaceImpl.kt:74-83`, `FabricUIManager.java:377`), before any JS call can land.
- **Attack tried:** Checked whether the three reasons hold as written.
  - "Rewritten every launch" holds only once `expo-localization` is installed (RTL-5). Today nothing rewrites it.
  - "Next launch only" is not exact on either platform. Android re-reads the stored value on every root layout-spec update (`FabricUIManager.java:1084-1125`, reached from `RA/runtime/ReactSurfaceView.kt:109,122`), so a JS write can flip the root constraints at the next root measure in the same session. iOS re-reads it after the bundle has executed (RTL-4), so a call at the top of the entry file can land before that read. How the void native-module call is dispatched was not read. In both cases the JS constant `I18nManager.isRTL` stays stale for the session, so native layout and JS-side readers can disagree.
- **Consequence:** none for the design. The source makes the JS route worse than the record says: its timing is undefined, not merely late.

### RTL-7. CONFIRMED: the current-state claims
- **Record says:** Android mirrors today (`android:supportsRtl="true"`, `allowRTL` default true, zero `I18nManager` calls). iOS does not (known regions hold no RTL language). Pivot code fact 5.
- **Evidence:** `android/app/src/main/AndroidManifest.xml:23` carries `android:supportsRtl="true"`. It comes from the Expo prebuild template: `node_modules/expo/template.tgz`, `package/android/app/src/main/AndroidManifest.xml:22`, with the same literal as a fallback at `node_modules/@expo/config-plugins/build/plugins/withAndroidBaseMods.js:75`. `git grep` for `I18nManager`, `isRTL`, `allowRTL`, `forceRTL`, `writingDirection` and `direction: 'rtl'` outside `ai/` returns nothing. `ios/Athan.xcodeproj/project.pbxproj:628-633` holds `developmentRegion = en` and `knownRegions = (en, Base)`. The app target has no `.lproj` folder and `ios/Athan/Info.plist` has no `CFBundleLocalizations`. `RCTI18nUtil.m:32-41` and `I18nUtil.kt:21-40` read as cited.
- **Attack tried:** Checked the cited line ranges at this commit. Both hold.
- **Consequence:** none. Drift note: the iOS check is `[NSParagraphStyle defaultWritingDirectionForLanguage:nil]` (`RCTI18nUtil.m:101-105`). The "intersects known regions" wording comes from the source comment at `:98-100`, not from code React Native runs.

### RTL-8. CONFIRMED: the root direction reaches Yoga, text and view semantics from one value
- **Record says:** The whole Yoga tree resolves start and end from the surface's layout constraints (R10 finding 1).
- **Evidence:** Android passes `isRTL` into `startSurfaceWithConstraints` (`FabricUIManager.java:367-378`). iOS sets `layoutConstraints.layoutDirection` and `swapLeftAndRightInRTL` (`RCTFabricSurface.mm:177-190`). A paragraph takes its direction from its Yoga node (`RN/ReactCommon/react/renderer/components/text/ParagraphShadowNode.cpp:81-84`). On iOS every Fabric component view is forced to match (`RN/React/Fabric/Mounting/UIView+ComponentViewProtocol.mm:111-115`), and scroll views are forced LTR (`RN/React/Fabric/Mounting/ComponentViews/ScrollView/RCTEnhancedScrollView.mm:39-42`).
- **Attack tried:** Looked for a second native reader of locale direction inside React Native that bypasses `I18nUtil`. Found none in the grep of `RA` and `RN/React`.
- **Consequence:** none.

### RTL-9. CONFIRMED: Android anchors RTL script left by default, and iOS needs an explicit `textAlign: 'left'`. The tree has none
- **Record says:** Android anchors RTL script left by default. iOS needs explicit `textAlign: 'left'` (pivot, R10 finding 8, confidence medium for iOS).
- **Evidence:**
  - Android: `RA/views/text/TextLayoutManager.kt:191-221`. Paragraph LTR and script RTL gives `ALIGN_OPPOSITE`, which is left for an RTL paragraph. `textAlign: 'left'` is not a handled value, so it returns the same default. `:224-237` maps the gravity the same way.
  - iOS: `TLM/RCTAttributedTextUtils.mm:220-227` sets a paragraph alignment only when `alignment` has a value or the layout is RTL. `RN/ReactCommon/react/renderer/attributedstring/TextAttributes.cpp:186-197` gives `alignment` no default. With no `textAlign` in an LTR layout the paragraph keeps UIKit's natural alignment. With `textAlign: 'left'`, `RCTResolveTextAlignment` (`RCTAttributedTextUtils.mm:21-37`) returns `Left`, mapped to `NSTextAlignmentLeft` (`TLM/RCTTextPrimitivesConversions.h:14-32`).
  - Census at this commit: 14 `textAlign` declarations in `app`, `components`, `shared`. 12 are `center`, 2 are `right` (`components/prayer/Explanation.tsx:163`, `components/prayer/Prayer.tsx:115`, both dying with the Arabic column). Zero are `left`. There are 79 `Text` or `Animated.Text` JSX sites over 24 files.
- **Attack tried:** Looked for a default alignment injected elsewhere (the JSX shim, a shared Text wrapper). `jsx-runtime-shim.ts:28` injects only `allowFontScaling` and `maxFontSizeMultiplier`.
- **Consequence:** D31 is not met on iOS by the pin alone. Every left-anchored Text today relies on natural alignment. `PLAN.md` section 6 has no step for it, so stage two must carry one. Drift note: `research/R3-RTL-AND-SCRIPTS.md` counts 11 `textAlign` sites. The tree holds 14.

### RTL-10. CONTRADICTED (MINOR): the base direction of a Text paragraph is first-strong on both platforms, not LTR
- **Record says:** `R3-FINDINGS.md` ("Bidi does not go away") reasons "under an LTR base direction": `الفجر 05:42` puts the time on the wrong side, and trailing punctuation lands on the wrong side of an RTL run. It then requires isolate-wrapping every composed string that mixes a name with a number. R10 finding 8 repeats the LTR-base caveat.
- **Evidence:** Android builds the layout without calling `setTextDirection` (`RA/views/text/TextLayoutManager.kt:843-876`, and the file contains no `setTextDirection` call). The platform default is `TextDirectionHeuristics.FIRSTSTRONG_LTR` (`AOSP-35: android/text/StaticLayout.java:111`). iOS sets `baseWritingDirection` only when the `writingDirection` style is present (`TLM/RCTAttributedTextUtils.mm:229-233`), otherwise it stays natural. The pinned layout direction feeds alignment only (RTL-9), never the bidi base.
- **Attack tried:** Tried to produce the two failures the record names. A pure-Arabic sentence with a trailing full stop starts with a strong RTL character, takes an RTL base, and the stop lands at the reading end. `الفجر 05:42` takes an RTL base for the same reason.
- **Consequence:** Design unaffected, rule too broad. The real hazard is narrower: a string in an RTL locale whose first strong character is Latin takes an LTR base, and then its Arabic runs and its closing punctuation land on the wrong side. Replace "isolate everything" with a catalog test: every `ar` string's first strong character is RTL, or the string is wrapped in RLI and PDI.

### RTL-11. CONFIRMED: the concrete strings and truncation sites, checked against first-strong resolution
- **Record says:** Single-line labels are safe left-anchored (Q21, D31).
- **Evidence and attack tried, per site:**
  - `hooks/usePrayerAgo.ts:36` builds `${prevPrayer.english} ${timeAgo} ago`, drawn by `components/prayer/Ago.tsx:53-54` with `styles.prayerAgo` (`textAlign: 'center'`, `:61`). `shared/time.ts:564-574` returns `1h 30m`. With an Arabic word first the line takes an RTL base and the digit-plus-Latin-letter group stays together as one LTR island. It breaks only if a translator puts the duration first, which is the Latin-led case in RTL-10.
  - `shared/time.ts:528-549` returns the countdown as `1h 1m 5s`. It is its own Text (`components/countdown/Countdown.tsx:49`, `styles.countdown`, centred), so no mixing occurs.
  - `shared/notifications.ts:130` and `:181` build `${englishName} now` and `${englishName} in ${intervalMinutes}m`. The OS draws these. Same first-strong rule applies to the translated template.
  - `components/modals/WhatsNew.tsx:45` nests ` (iOS only)` or ` (Android only)` inside a body Text. The Latin token sits mid-string, so the base follows the body.
  - Latin-led candidates if the term stays Latin in Arabic: `components/sheets/screens/Alert.tsx:222` (`Athan`), `shared/whatsNew.ts:80` and `:84`.
  - `numberOfLines` appears three times, all in `components/sheets/screens/Qibla.tsx` (`:84`, `:87`, `:166` with `styles.place`, centred, `:205-211`). Android truncates the logical end (`TextLayoutManager.kt:863-865`), iOS uses the tail mode (`TLM/RCTTextLayoutManager.mm:425-428`). For a pure-RTL line the ellipsis sits at the visual left, which is the reading end.
- **Consequence:** none beyond the catalog test in RTL-10.

### RTL-12. CONFIRMED: on iOS the pin controls React Native's direction only, never UIKit's
- **Record says:** `research/R3-RTL-AND-SCRIPTS.md` section 4 lists system surfaces that flip regardless and warns that declaring Arabic opts UIKit into RTL. Pivot finding 23c defers the interaction to pre-flight.
- **Evidence:** `expo-localization@58.0.4/ios/LocalizationModule.swift:52-62` makes two `RCTI18nUtil` calls and nothing else. The plugin's iOS half writes three plist keys (`withExpoLocalization.ts:104-117`). There is no `semanticContentAttribute`, appearance proxy or UIKit call anywhere in the package.
- **Attack tried:** Inventoried the native, non-Yoga UI this app uses.

| Surface | Where | Mirrors on an Arabic-language iPhone once Arabic is declared |
| --- | --- | --- |
| `Alert.alert` (UIAlertController) | `device/qibla.ts:36`, `hooks/useNotification.ts:57` | Yes, follows UIKit. The pin does not reach it |
| OS permission prompts, notification banners | system | Yes, OS-owned |
| Pager | `app/Navigation.tsx:81` | No. `node_modules/react-native-pager-view/src/PagerView.tsx:62-70` derives the direction from `I18nManager.isRTL` and passes it explicitly |
| Navigation | `app/_layout.tsx:85` renders `<Slot />` | No native stack, header or back gesture exists |
| RN `Modal` | `components/sheets/screens/ColorPicker.tsx:130` (import at `:4`) | No, content is Fabric views (RTL-8). The presentation is a vertical slide |
| App modals (Help, What's New, Update) | `components/modals/Modal.tsx`, used at `components/modals/Help.tsx:124` | No. The component imports only `View` and `Text` primitives (`Modal.tsx:2`), so it is a JS overlay |
| Bottom sheets, colour picker | `@gorhom/bottom-sheet`, `reanimated-color-picker` | No, JS-driven views |
| Scroll views | Fabric | No, forced LTR (RTL-8) |
| Text inputs, toasts, action sheets, share sheet | none in `app`, `components`, `hooks`, `stores`, `shared`, `device` | Not applicable |
| `@expo/ui` | widgets only | See RTL-13 and RTL-14 |

- **Consequence:** The plan must state the choice for the two alert call sites: accept an OS-directed alert, or replace them with the app's own modal. Device work left for 23c: confirm that `CFBundleLocalizations` containing `ar`, with no `.lproj` folder, makes `defaultWritingDirectionForLanguage:nil` return RTL, and confirm the alert's button order.

### RTL-13. CONTRADICTED (MAJOR): the pin cannot reach the Android home-screen widget, and the record carries no mechanism or check for widget direction
- **Record says:** Never mirror, either platform, layout identical regardless of language (Q3). The leftover-surface table (`research/R3-RTL-AND-SCRIPTS.md` section 4) does not list widgets.
- **Evidence:** The widget provider is a `GlanceAppWidgetReceiver` (`node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/ExpoWidgetsAppWidgetProvider.kt:5-10`), so the launcher draws it from remote views. The tree is built from Glance emittables (`ExpoWidgetEmittableTree.kt:62-73`) and maps alignment to Glance's start-relative and end-relative values (`:497-503`, `:541-543`). The list row is a `Row` holding a `centerStart` name box then a `centerEnd` time box (`widgets/PrayerWidget.tsx:437-444`), and the medium card is a `Row` of hero then list with start and end padding (`:451-459`). Remote views inflate in the launcher under `RemoteViewsContextWrapper`, which wraps the host context and overrides resources, theme, package name and user, but not `getApplicationInfo()` (`AOSP-35: android/widget/RemoteViews.java:899-939`, used at `:6155`). A view decides RTL support from `mContext.getApplicationInfo().hasRtlSupport()` (`AOSP-35: android/view/View.java:22451-22453`) and inherits its parent's direction when that is true (`:22497-22539`). So the launcher's manifest decides, not this app's `supportsRtl`.
- **Attack tried:** Looked for a direction override in the widget path. `expo-widgets` Android sources contain no `layoutDirection` or `isRtl` handling. The widget sources set none.
- **Consequence:** The plugin setting does not apply to this surface. Whether the row order visibly reverses needs a device (see "Not verified"), and the answer is the same today as after the pin. Add to the pre-flight: place the widget on a launcher with the device language set to Arabic, and record the column order. If it reverses, the remedy is per-surface (see "Better alternatives"). Severity is MAJOR because the never-mirror ruling has no coverage for a shipped surface.

### RTL-14. UNCERTAIN: whether the iOS widgets mirror once Arabic is a declared localisation
- **Record says:** nothing on widget direction.
- **Evidence:** The widget extension is a separate SwiftUI target. `ios/ExpoWidgetsTarget/Info.plist` declares no localisation, and the plugin's `CFBundleLocalizations` goes to the app's plist only (`withExpoLocalization.ts:104-115`). The lock widgets use `HStack` with leading and trailing frames (`widgets/LockPrayerWidget.tsx:159-184`, `:303-327`), which follow the SwiftUI layout direction. `expo-widgets` iOS sources set no `layoutDirection` environment. Its plugin does look for `Supporting/<language>.lproj/Localizable.strings` in the app project (`node_modules/expo-widgets/plugin/build/ios/xcode/withTargetXcodeProject.js:97-105`).
- **Attack tried:** Could not determine from source which localisation an unlocalised extension resolves on an Arabic-language phone, or what the plugin does with the strings files it finds (the rest of that function was not read).
- **Consequence:** Settle on a device: add the lock and home widgets on an Arabic-language iPhone with the 2.0.0 build and read the left-to-right order of name and time. Also confirm that the extension target gains no `.lproj` when the app declares locales.

### RTL-15. UNCERTAIN: how UIKit resolves natural alignment for a Text with no strong character once the app runs in Arabic
- **Record says:** iOS natural alignment anchors a pure-RTL paragraph right unless `textAlign` is set (R10, medium confidence).
- **Evidence:** React Native leaves both alignment and base writing direction natural when no style is given (RTL-9, RTL-10). React Native's own comparison code treats the natural base as `[NSParagraphStyle defaultWritingDirectionForLanguage:nil]` (`TLM/RCTAttributedTextUtils.mm:540-542`), which is the application language. A digit-only or punctuation-only Text (a date, a version, `05:12` outside `components/prayer/Time.tsx`) has no strong character to decide it.
- **Attack tried:** UIKit's resolution is closed source. Nothing on disk settles it.
- **Consequence:** Settle on a device with an Arabic-language iPhone and the Arabic localisation declared: a digit-only Text without `textAlign` in a wide box, left or right. A global `textAlign: 'left'` default (see "Better alternatives") makes the answer irrelevant.

### RTL-16. CONFIRMED: Android attacks with `supportsRtl="false"`
- **Record says:** `supportsRtl="false"` breaks layout mirroring only, not text (R10 finding 4).
- **Evidence and attack tried:**
  - Per-app language set to Arabic on Android 13 and later changes `configuration.locales[0]`, which only feeds `isDevicePreferredLanguageRTL` (`I18nUtil.kt:63-67`). The manifest gate still returns false (RTL-3).
  - Native dialogs from `Alert.alert` inflate with the app's own context, so `hasRtlSupport()` is false and layout direction stays LTR (`AOSP-35: android/view/View.java:22451-22462`, `:22497-22539`).
  - Toasts: no `ToastAndroid` use in the tree.
  - Notifications: not read directly. They are remote views drawn by the system, so the inflation wrapper in RTL-13 applies and the host's application info decides, not this app's flag. A device check is listed below.
- **Consequence:** none. Limits: only the `android-35` platform source was read. The Android 9 floor was not read, and no dependency manifest under `node_modules` declares `supportsRtl`, but prebuilt Maven artefacts were not inspected (see "Not verified").

### RTL-17. CONTRADICTED (MINOR): the same plugin call writes more than the record lists
- **Record says:** "That one setting writes" the manifest attribute and the plist key (R10 recommended mechanism).
- **Evidence:**
  - `allowDynamicLocaleChangesAndroid` defaults to true (`withExpoLocalization.ts:228-233`) and appends `|locale|layoutDirection` to the main activity's `android:configChanges` (`:121-134`). Today's manifest has neither (`android/app/src/main/AndroidManifest.xml:30`). With them, a device-language change no longer recreates the activity. The module sends `onLocaleSettingsChanged` instead (`android/.../LocalizationPackage.kt:26-34`, `LocalizationModule.kt:42-46`).
  - With `supportedLocales` set, the plugin writes `res/xml/locales_config.xml`, `android:localeConfig`, and a `resourceConfigurations += [...]` line into `android/app/build.gradle` (`:155-207`), which drops every other locale's resources from the build.
  - The package adds a runtime dependency, `rtl-detect` (`expo-localization@58.0.4/package.json:29-31`).
- **Attack tried:** Checked whether the record names these anywhere in the four RTL documents. It does not.
- **Consequence:** Record an explicit value for `allowDynamicLocaleChangesAndroid`. Left at the default, an in-place language change reaches the app as an event with no restart, so R8's "re-derive on every launch" no longer covers it, and notification copy and widget text stay in the old language until the commit runs. That belongs to the first-run and commit themes. `android/app/build.gradle` is also the file the version lockstep edits, so the prebuild order rule applies.

### RTL-18. CONFIRMED: nothing deprecates the mechanism, but its Android half is new in 58.0.0 and the call path changed in 56 and again in 58
- **Record says:** The pin holds permanently (Q3).
- **Evidence:** `expo-localization@58.0.4/CHANGELOG.md:26-38`: writing `android:supportsRtl` from the plugin is new in 58.0.0 (#48080), and 58.0.0 also changed iOS so RTL "now follows React Native's `I18nManager`" (#48086). `:60-64`: 56.0.4 switched the RTL call path. `RN/React/Modules/RCTI18nUtil.h:10-15` marks the class `@experimental`. No entry deprecates `supportsRTL`.
- **Attack tried:** Read the whole changelog for a deprecation or removal notice. Found none.
- **Consequence:** Guard the outputs, not the option. Add a plugin test beside `plugins/__tests__` that runs the config and asserts `android:supportsRtl="false"`, the `ExpoLocalization_supportsRTL` string and the plist key, so an SDK upgrade that moves the mechanism fails `yarn validate`.

## Better alternatives

| Option | What it does | Real cost | Verdict |
| --- | --- | --- | --- |
| A. The record's plugin pin | One `app.json` entry | One new native dependency (owner approval, ask-first list), one `app.json` edit (ask-first), a prebuild, plus the unlisted writes in RTL-17. Binary: one small Kotlin and one Swift module, one JS dependency. Runtime: two preference writes per launch | Right choice, because R8 needs `getLocales()` from the same package. Keep it, with the corrections in RTL-4, RTL-17 and RTL-18 |
| B. Local config plugin, no dependency | `plugins/pinLtr.js`: `withAndroidManifest` sets `android:supportsRtl="false"`. Android needs nothing else (RTL-3). iOS needs one native line, `RCTI18nUtil.sharedInstance().allowRTL(false)`, inserted in `application(_:didFinishLaunchingWithOptions:)` | About 30 lines plus a test in the existing `plugins/__tests__` pattern. No existing plugin uses `withAppDelegate` (`plugins/*.js` call `withInfoPlist`, `withAndroidManifest`, `withGradleProperties` and `withDangerousMod`), so the iOS half is string surgery on a generated Swift file and breaks when the template changes. Locale reading then needs hand-rolled per-platform code, since `I18nManager` exposes a locale identifier on Android only (`I18nManagerModule.kt:22-29`, `RCTI18nManager.mm:49-55`) | Loses to A unless the owner refuses the dependency. Its one real advantage: on iOS it runs on the main thread before the host exists, which removes the ordering dependence in RTL-4 |
| C. Force LTR at the UIKit level on iOS as well | An appearance-proxy `semanticContentAttribute` set to force LTR in the app delegate | Same app-delegate surgery as B. Reaches the two `Alert.alert` sites, not OS-owned prompts. Gives Arabic readers an LTR-ordered system alert, which is not the platform convention | Not recommended. If the alerts must not mirror, replace the two call sites with the app's own modal instead: two files, but a visible change that needs the owner's approval |
| D. Global `textAlign: 'left'` default for iOS | Extend `jsx-runtime-shim.ts:28,45-52` to prepend `{ textAlign: 'left' }` to every Text style | About 5 lines plus tests. No Android change, since `left` equals the default there (RTL-9). No English change, since natural already resolves left. Risk: style merge order must keep the 12 `center` declarations winning | Recommended over editing 65 or more Text sites by hand. It also closes RTL-15 |
| E. Per-surface widget handling | iOS: keep the extension unlocalised and assert it in a prebuild test. Android: set an explicit LTR direction on the widget root, which the platform allows for remote views (`AOSP-35: android/view/View.java:13848-13849`) | iOS: one test. Android: `expo-widgets` exposes no such setter and is pinned exact, so this needs an upstream change or a local native module. Cost unknown until the device check in RTL-13 shows whether the order reverses at all | Do the device check first. Build nothing before it |

## Not verified

- **Devices.** Nothing here ran on a phone or simulator. Outstanding device observations: iOS first launch after fresh install and after upgrade on an Arabic-language iPhone (RTL-4), the alert button order and the effect of `CFBundleLocalizations` without `.lproj` (RTL-12), Android widget column order on an Arabic-language launcher (RTL-13), iOS widget order (RTL-14), natural alignment of neutral-only text (RTL-15), the direction of this app's notifications in the Android shade on an Arabic-language phone (RTL-16), and Arabic text alignment inside a native Android dialog.
- **Build.** No prebuild or Gradle build ran. A manifest-merger conflict on `android:supportsRtl` is possible if any prebuilt Maven artefact declares the attribute as true. No source manifest under `node_modules` does. The plugin adds no `tools:replace`. One local build settles it.
- **Partial reads, located by grep then read only in the cited ranges:** `RA/views/text/TextLayoutManager.kt` (lines 130 to 240 and 785 to 890 of 1722), `RA/fabric/FabricUIManager.java` (355 to 382, 1078 to 1128 of 1676), `RA/runtime/ReactSurfaceImpl.kt` (68 to 86, 180 to 228), `RA/runtime/ReactSurfaceView.kt` (grep only), `TLM/RCTAttributedTextUtils.mm` (21 to 43, 185 to 250, 520 to 572), `TLM/RCTTextLayoutManager.mm` (415 to 430), `TextAttributes.cpp` (1 to 130, 186 to 225), `ParagraphShadowNode.cpp` (70 to 90), `RCTHost.mm` (384 to 447, 520 to 535), `RCTInstance.mm` (380 to 475), `RCTRootViewFactory.mm` (130 to 272), `RCTSurfaceHostingView.mm` (30 to 254 of 254), `RCTSurfaceHostingProxyRootView.mm` (55 to 80), `RCTSurfacePresenter.mm` (140 to 160, 225 to 320), `UIView+ComponentViewProtocol.mm` (95 to 120), `expo-modules-core/ios/Core/AppContext.swift` (396 to 420 of 857), `node_modules/expo/ios/Expo/ExpoReactNativeFactory.swift` and `ExpoAppSceneDelegate.swift` (grep only, root view creation at `ExpoReactNativeFactory.swift:157`), `react-native-pager-view` and `react-native-screens` (grep only), `expo-widgets` Android and iOS sources and its plugin (grep plus `withTargetXcodeProject.js` 78 to 125), `@expo/ui` (grep only), the widget sources `widgets/PrayerWidget.tsx` and `widgets/LockPrayerWidget.tsx` (grep only), `shared/time.ts` (520 to 590), `components/countdown/Countdown.tsx` (20 to 80), `components/sheets/screens/Qibla.tsx` (172 to 212), `device/qibla.ts` (34 to 46), `hooks/useNotification.ts` (55 to 68), `app/Navigation.tsx` (70 to 100), and the three `AOSP-35` files at the cited ranges.
- **Not read at all:** the Android side of `expo-modules-core` (when `OnCreate` fires on Android, which RTL-3 makes moot), the web entry `src/ExpoLocalization.ts` and the type files of the package, Expo's scene delegate, the Glance library's translation of rows into remote views, the Android 9 platform source, and `RN/Libraries/StyleSheet/StyleSheetTypes.js:1035` cited by R10.
- **Not checked:** how the `textAlign: 'auto'` value parses, the GitHub issues and documentation URLs R10 cites (#45661, #48311, #33423, #51008, #26532, #51235), the three LTR-shell precedents, and any React Native or Expo roadmap beyond the package changelog. No web page was fetched.
