# R10. Pinning the layout LTR (research agent report, 2026-10-09)

Dispatched by the owner's instruction; citations as marked. Question: in React Native 0.88 (New
Architecture / Fabric, Expo SDK 58), what is the exact behaviour and the correct way to pin an
app's layout direction to LTR for every locale, while still rendering RTL scripts (Arabic, Urdu)
correctly inside Text nodes?

Context verified against: `android:supportsRtl="true"` in the manifest (Expo prebuild default),
iOS project knownRegions = (en, Base), zero `I18nManager` calls in JS.

## Findings

1. **The app flips to RTL on an Arabic-locale Android device today.** RN 0.88's Android gate is
   `isRTL = applicationHasRtlSupport && (isRTLForced || (isRTLAllowed(default true) &&
   isDevicePreferredLanguageRTL))`, read from the manifest flag, SharedPreferences, and
   `TextUtilsCompat.getLayoutDirectionFromLocale` (I18nUtil.kt, react-native main; identical logic
   verified in the local react-native@0.88.0-rc.3 copy). The Fabric consumption point:
   `FabricUIManager.startSurfaceWithConstraints` passes `I18nUtil.isRTL(context)` into the
   surface's layout constraints, so the whole Yoga tree resolves start/end from it (local
   FabricUIManager.java:377). Official docs restate the condition (reactnative.dev/docs/i18nmanager).
2. **iOS does not flip in this configuration.** `isApplicationPreferredLanguageRTL` intersects the
   app's localizations (from `knownRegions`) with the system language list; the source comment
   says "For RTL support, app must add an RTL lang to .pbxproj's knownRegions" (RCTI18nUtil.m).
   With knownRegions = (en, Base) it resolves to English, so LTR (react-native#51647 documents the
   same).
3. **`supportsRtl="false"` is viable, and it is exactly what Expo's own plugin writes.** Android
   manifest docs: with it false "the RTL APIs are ignored or have no effect, and your app behaves
   the same regardless of the layout direction... your layouts are always left-to-right"
   (developer.android.com application-element). Expo's `expo-localization` config plugin implements
   `supportsRTL: false` by writing that manifest attribute (withExpoLocalization.ts, expo/expo).
4. **What `supportsRtl=false` breaks: layout mirroring only, not text.** Shaping and bidi ordering
   of Arabic glyphs are done by the text stack per the Unicode bidi algorithm regardless of
   container direction, and RN's Android text measurement applies a first-strong heuristic that is
   independent of the manifest (TextLayoutManager.kt at v0.88.0-rc.3).
   `marginStart`/`paddingStart` resolve to left, identical to what a pinned-LTR app wants.
   `BackHandler` has no coupling to RTL in RN's docs or source. Real costs: no RTL mirroring for
   any native screen without a rebuild, and Android `forceRTL` dev-testing stops working because
   the manifest gate fails first.
5. **`I18nManager.allowRTL(false)` from JS entry pins LTR only from the next app start, never for
   already-rendered views.** The docs say it explicitly: "Changes take effect on the next
   application start, not immediately. This setting is persisted across app restarts"
   (reactnative.dev/docs/i18nmanager). On Fabric the direction is resolved when the surface's
   layout constraints are set (RCTFabricSurface.mm; FabricUIManager.java:377). New Arch issues
   #45661 and #48311 confirm only a full restart applies a direction change; #33423 confirms
   `allowRTL(false)` plus restart is the community workaround for pinning LTR.
6. **First-launch race and SDK 58 conflicts.** Because JS runs after the surface is created, a
   fresh install on an Arabic Android device can come up RTL and only be LTR from the second
   launch; this is precisely why Expo's native module writes the prefs before React loads
   ("We call these methods before React loads to ensure it gets rendered correctly the first time
   the app is opened", LocalizationModule.swift, expo/expo). On SDK 58, expo-localization rewrites
   `allowRTL`/`forceRTL` on every module creation from the plugin config, so runtime JS overrides
   never stick (expo/expo#51008). Expo Go resets RTL preferences entirely (expo/expo#26532).
7. **Arabic inside Text with LTR layout: strong RTL characters always display right-to-left,
   independent of base direction.** W3C: "A sequence of strongly-typed RTL characters will be
   displayed from right to left. This is independent of the surrounding base direction... you
   don't need any markup or styling to make this happen" (W3C Unicode Bidirectional Algorithm
   basics). Base direction governs the order of directional runs across the line,
   neutral-character resolution, and default alignment.
8. **Line-box anchoring is what layout direction controls.** RN 0.88's Android Fabric text layout
   handles the LTR-app/RTL-script case in code: "paragraph is LTR but script is RTL, text needs to
   be aligned to the left, which means ALIGN_OPPOSITE needs to be used to align RTL script to the
   left," with script direction from `TextDirectionHeuristics.FIRSTSTRONG_LTR`
   (TextLayoutManager.kt at v0.88.0-rc.3). So on Android the default already anchors Arabic-only
   Text nodes left in an LTR app. On iOS, RN maps `writingDirection: 'auto'` to
   `NSWritingDirectionNatural` (RCTConvert.mm), so a pure-Arabic paragraph takes an RTL natural
   base and can align right within a stretched Text; set `textAlign: 'left'` for deterministic
   left anchoring. RN 0.88's type accepts `'auto' | 'left' | 'right' | 'center' | 'justify' |
   'start' | 'end'` (verified in local StyleSheetTypes.js:1035). Residual caveat: with an LTR base,
   mixed lines (Arabic plus trailing punctuation or numbers) resolve neutrals LTR, which can
   misplace punctuation versus a true RTL base.
9. **LTR-shell precedents:** GitHub Mobile renders Arabic content while shipping no RTL layout
   (github/app#1563); Notion ran an LTR shell for years with RTL support a long-standing community
   complaint; Obsidian keeps an LTR app frame with Arabic note content, RTL layered on via a
   community plugin.

## Recommended mechanism

Pin LTR with the `expo-localization` config plugin: `"plugins": [["expo-localization", {
"supportsRTL": false }]]`, then prebuild. That one setting writes `android:supportsRtl="false"`
into the manifest and sets `ExpoLocalization_supportsRTL = false` in Info.plist, which the native
module applies via `RCTI18nUtil.allowRTL(false)` before React loads, so both platforms resolve LTR
at surface creation on the very first frame with no restart choreography, and it survives
expo-localization's per-launch preference rewrite. Arabic and Urdu strings inside Text nodes
continue to shape and order right-to-left under the Unicode bidi algorithm with the line box
anchored left; set `textAlign: 'left'` explicitly where iOS natural alignment would otherwise
anchor pure-Arabic paragraphs right. Do not pin via JS `I18nManager.allowRTL(false)` on SDK 58: it
applies only from the next launch, races the first surface on fresh installs, and is overwritten
by expo-localization at every launch.

## Confidence

| Claim | Confidence |
| --- | --- |
| Android flips to RTL today given manifest true, defaults, Arabic locale | High |
| iOS stays LTR with knownRegions (en, Base) | High |
| supportsRtl=false pins Android LTR; breaks layout mirroring only, not text shaping | High |
| BackHandler unaffected by supportsRtl | Medium (absence of coupling; not a documented guarantee) |
| allowRTL(false) is next-launch-only, persisted, not retroactive | High |
| New Arch resolves direction at surface creation; full restart needed to change it | High |
| expo-localization SDK 58 plugin is the deterministic pin on both platforms | High |
| Arabic text shaped/ordered RTL inside LTR layout; line box anchored left | High |
| iOS default (natural) alignment anchors pure-Arabic paragraphs right unless textAlign set | Medium |
| GitHub Mobile, Notion, Obsidian as LTR-shell precedents | Medium |
