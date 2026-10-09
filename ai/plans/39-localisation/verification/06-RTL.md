# Verification 06: RTL pinning (expo-localization plugin, supportsRTL false)

Independent adversarial verification of the claim that the layout is pinned LTR via the
`expo-localization` config plugin with `supportsRTL: false`, applied natively before React loads on
both platforms, so everything is deterministic on the first frame, and that a JS
`I18nManager.allowRTL(false)` is wrong on SDK 58. Branch
`verify/39-localisation-deepseek-20261009` at `52109ec0`. No file was modified. The published
`expo-localization@58.0.3` tarball was fetched from the npm registry to read the plugin source.

## Findings

### F1. `expo-localization` is not installed or configured. CONTRADICTED as stated.
`package.json` lists no `expo-localization`, `yarn.lock` has zero matches, `node_modules` is absent
from this worktree, and the `app.json` plugins array (`app.json:45-383`) has no `expo-localization`
entry. There is no `supportsRTL`, `supportedLocales`, `locales` or `CFBundleLocalizations` key anywhere
in `app.json`. The pin is a ruling and a plan, not a present fact. The record itself says so at
`SINGLE-LANGUAGE-PIVOT.md:60` ("expo-localization is not installed") and lists the plugin work in
stage two (row 39, `NOT PLANNED`).

### F2. Nothing pins LTR today, so Android mirrors on an Arabic-locale device. CONFIRMED.
There is no committed `android/` or `ios/` (both generated at prebuild), so no manifest to read. The
Expo SDK 58 bare template ships `android:supportsRtl="true"`, and the tree has zero `I18nManager`
calls. Under RN 0.88's gate `isRTL = applicationHasRtlSupport && (isRTLForced || (isRTLAllowed &&
isDevicePreferredLanguageRTL))` the Android app resolves RTL on an Arabic-locale device today. iOS
stays LTR only by omission: nothing declares `ar` in `knownRegions`/`CFBundleLocalizations`, so
`isApplicationPreferredLanguageRTL` is false. This matches `SINGLE-LANGUAGE-PIVOT.md:58` code fact 5.

### F3. The plugin mechanism matches the record, verified against the published SDK 58 source. CONFIRMED.
From `expo-localization@58.0.3`:
- `plugin/build/withExpoLocalization.js:83-85` `setAndroidSupportsRtl` writes `android:supportsRtl`.
  `:96-97` sets `config.ios.infoPlist.ExpoLocalization_supportsRTL = false` when `supportsRTL` is
  false. `:103` sets `CFBundleLocalizations` from `supportedLocales`. `:126` applies the manifest
  write, and `:167-171` writes the `ExpoLocalization_supportsRTL` Android string resource.
- `ios/LocalizationModule.swift:52-59` reads the Info.plist key and calls `i18nUtil.allowRTL(...)` in
  `OnCreate`, under the comment "We call these methods before React loads to ensure it gets rendered
  correctly the first time the app is opened."
- `android/.../LocalizationModule.kt:38,55-61` reads the string resource and calls
  `I18nUtil.instance.allowRTL(context, supportsRTL)` in `OnCreate`.
The mechanism is real on SDK 58. It is simply not applied in this tree.

### F4. "Everything is left-aligned" does not describe the record or the tree. CONTRADICTED.
The rulings are "names left, time centre, alert icons right, identical regardless of language"
(`SINGLE-LANGUAGE-PIVOT.md:301`, `OWNER-DECISIONS.md:458-464`), not "everything left". The tree has 14
`textAlign` declarations in production code, 12 of them `center` (including `Time.tsx:70`,
`Countdown.tsx:64,76`, Qibla, Alert, Ago, Update, WhatsNew, Help chevron) and 2 `right` on the Arabic
surfaces slated for removal (`Prayer.tsx:115`, `Explanation.tsx:163`). There are ZERO `textAlign:
'left'` declarations and no `writingDirection` usage. Under the pin, iOS `NSWritingDirectionNatural`
can still anchor a pure-Arabic paragraph right inside a stretched Text, so if literal left alignment
is wanted, that work is missing.

### F5. `I18nManager.allowRTL(false)` from JS is the wrong tool, confirmed. CONFIRMED.
`R10-RTL-PINNING.md:39-52` and the plugin source (F3) support the record. The plugin writes the
preference natively before React loads, so a JS call is redundant and next-launch-only. A JS route is
also overwritten by the module on every launch. The record's choice is correct.

### F6. Declaring `ar` interacts with the RTL trap, and no pre-flight artifact exists. CONTRADICTED (as
verified).
`withExpoLocalization.js:103` sets `CFBundleLocalizations` from `supportedLocales`, which is the lever
that opts iOS native surfaces (permission prompts, share sheet, action sheets) into RTL semantics for
an Arabic-locale user. `R3-RTL-AND-SCRIPTS.md:104-108` records the trade.
`SINGLE-LANGUAGE-PIVOT.md:272` claims this is "verified against the `supportsRTL: false` pin in the
plan's pre-flight", but no pre-flight script or artifact exists in this tree, so the interaction is
asserted, not verified.

### F7. The fixed row and centred time cell are direction-agnostic. CONFIRMED.
`STYLES.prayer.height = 57` (`shared/constants.ts:984`) and `Time.tsx:64-71` (`flex: 1`,
`textAlign: 'center'`) use no logical edges, so neither breaks under the pin. The milestone scripts
(excluding Nastaliq Urdu) fit.

## Break attempts

- What pins LTR today: nothing on Android, the manifest template defaults to `supportsRtl="true"` and
  there are zero `I18nManager` calls. iOS stays LTR only because no RTL locale is declared.
- Does `supportsRTL: false` reach `allowRTL(false)` before React loads on iOS: the source intent is
  confirmed (`LocalizationModule.swift:52-59`), the timing rests on the module `OnCreate` running
  before the first Fabric surface. The comment asserts it. No independent in-repo evidence. UNCERTAIN.
- Declared locales and the RTL trap: real (`withExpoLocalization.js:103`), not pre-flight-verified (F6).
- Missing left-alignment props: real, zero `textAlign: 'left'` (F4).
- The 57px row and centred time under the pin: no break (F7).

## Better alternative and real cost

The ruled mechanism is technically correct for RN-rendered layout. The defect is that the claim is
written as fact while nothing is installed, configured, prebuilt or device-verified. Restate it as a
ruling with an explicit implementation step, then do the smallest sufficient work: install
`expo-localization` at the pinned 58.x line (a bare `expo install` resolves an older `latest`, so name
the version), add `["expo-localization", { "supportsRTL": false, "supportedLocales": [...] }]`,
prebuild, and prove the iOS first frame on a fresh install. Cost: one dependency, one prebuild, one
device check. The cheaper variant is not to declare `ar` in `supportedLocales` at 2.0.0, which avoids
the native UIKit RTL opt-in entirely, at the cost of no iOS per-app language row.
