# R2: renderer and native size

Session 41, question 2. Is there a renderer that works in THIS app, on THIS stack, and what does it weigh.

Written 2026-09-30. All measurements in this report were taken by this session from the artifacts named beside them, unless a URL or a `file:line` is given. Tools used: `npm view`, `npm pack` plus local extraction, `curl -I` on Maven Central and GitHub release URLs, NDK 27.1.12297006 `clang++` link tests, reading `node_modules` of this repo, the GitHub REST API until its rate limit, then TinyFish `fetch_content` for the pages behind it.

## Verdict table

| Candidate | RN 0.88.0-rc.2 | Needs a key | Offline capable | Added MB to APK (all 4 ABIs, uncompressed `.so`) | Added MB to iOS app | Fabric ready | Floor-device risk (3T SD820, XS A12) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `@maplibre/maplibre-react-native@11.4.0` | Yes (peer `>=0.80.0`, 0.87 fix shipped in 11.3.4) | No | Yes (PMTiles `asset://`/`file://` in native 13.x, offline packs, `file://` styles) | **+18.7 (2 phone ABIs) to +39.9 (current 4-ABI build)**: `libmaplibre.so` 7.92 + 10.85 + 10.48 + 10.69 MB uncompressed, plus 0.8 MB classes | **+7.8** device slice (3.4 MB compressed download) | Yes, new-arch-only since v11 | Moderate: OpenGL renderer, vendor map engines on SD820 are proven; wrapper's Fabric crash list is active but all recent ones are fixed |
| `react-native-maps@1.29.11` | Yes (Fabric table: 1.26.1+ needs `>=0.81.1`) | **Yes on Android** (Google Maps key mandatory); Apple Maps needs none on iOS | Overlay only: `LocalTile` reads xyz tiles from storage, but the base map still phones home unless `mapType: "none"` | ~0 (uses system Google Play Services, present on 3T) | ~0 (system MapKit) | Yes, with open Fabric bugs (marker zIndex, position `{0,0}`) | **Fails the brief's no-key rule on Android.** Out |
| MapLibre GL JS 5.22 in `@expo/dom-webview` (installed, unused) | Yes, zero new native code | No | Yes (local PMTiles via `pmtiles` JS, or inlined tiles) | **+0.0 native**, +0.3 to 1.4 JS payload (see 3.2) | **+0.0 native**, same JS | N/A (system WebView) | High on 3T: Chromium 88 WebView supports only `maplibre-gl` <= 5.22 with polyfills (issue 8157); iOS kills backgrounded web workers (issue 8461) |
| Vector geometry via installed `react-native-svg@15.15.5` | Yes (already installed) | No | Yes, wholly offline | **+0.0** (no `.so` in its 373 KB AAR, JS already bundled) | **+0.0** | Yes (shipped in this app for months) | Low if static-in-render, fatal if re-recorded per frame (measured 1.33 to 1.87 ms per path) |
| `@shopify/react-native-skia@2.13.1` | Yes (peer `>=0.78`, legacy arch removed in 2.13.0) | No | Yes | **+14.5 (2 phone ABIs) to +34.1 (4 ABIs)** (linked, stripped, whole-archive `libskia.so`: 5.78 v7a, 8.76 arm64, 10.00 x86, 9.57 x86_64) | **+3 to +10 after dead-strip** (83.2 MB static archives per device slice pre-link; real linked size UNVERIFIED) | Yes (new-arch only, peers `reanimated >=4.0`, `worklets >=0.7`, both satisfied) | Moderate: GPU raster on A12 fine; SD820 GPU is 2016-era but Skia is designed for it |
| `expo-maps@58.0.3` | Yes (in SDK 58 `bundledNativeModules.json`) | **Yes on Android** (`maps-compose` 6.10.0, Google key) | No (streams Google tiles) | ~0 wrapper (171 KB AAR) + Google Play Services | ~0 (system MapKit) | Yes | **Fails no-key rule on Android, and iOS floor is 18.0 vs this app's 16.4.** Out |
| `@rnmapbox/maps@10.3.5` | Yes (peer `>=0.79`) | **Yes** (Mapbox token) | Partial | n/a | n/a | Yes | Fails no-key rule. Out |
| OpenLayers (`ol@11`) in WebView | Yes | No | Yes | +12.3 MB unpacked JS (worse than maplibre-gl's 1.06 MB) | same | N/A | High, same WebView limits plus 12x the JS payload. Out on weight |
| Raster tiles as plain RN `Image` components | Yes | No | Yes | +0.0 native | +0.0 | Yes | Low: views are already cheap; no measurement exists for 20+ images per screen, UNVERIFIED on 3T |

Bottom line: if a real vector map renderer is wanted, `@maplibre/maplibre-react-native` is the only candidate that passes every rule (no key, offline, Fabric, RN 0.88 peers) and it costs **+39.9 MB on top of the 66 MB APK as this repo currently builds** (4 ABIs, uncompressed `.so`), taking it to about 106 MB. Restricting `reactNativeArchitectures` to the two phone ABIs cuts that to **+18.7 MB, about 85 MB**. The same library on iOS adds about **7.8 MB** to the app slice. Everything else either needs a key, fails the WebView's old Chromium, or weighs more.

## 1. `@maplibre/maplibre-react-native`: version, peers, Fabric, RN 0.88, Expo prebuild

### 1.1 Version and peer range

- Latest: `11.4.0` (published 2026-09-19), dist-tags `alpha: 11.0.0-alpha.47`, `beta: 11.0.0-beta.31`. Source: `npm view @maplibre/maplibre-react-native version dist-tags --json`, run 2026-09-29.
- Peer dependencies of 11.4.0: `expo >=54.0.0`, `react >=19.1.0`, `@types/react >=19.1.0`, `react-native >=0.80.0`, `@types/geojson ^7946.0.0`. Source: same command. This app's `react@19.3.0`, `react-native@0.88.0-rc.2`, `expo@~58.0.0-preview.7` all satisfy the ranges.
- JS payload: `dist.unpackedSize` 2,135,633 bytes, 970 files. Runtime deps: `@turf/length`, `@turf/helpers`, `@turf/distance`, `@turf/nearest-point-on-line` (all `^7.4.0`) and `@maplibre/maplibre-gl-style-spec@26.2.1`. Source: `npm view @maplibre/maplibre-react-native dependencies dist.unpackedSize --json`. The published `lib/commonjs` tree is 688 KB over 70 files, measured with `du -sk` on the extracted tarball. Not all of it lands in the Hermes bundle: Metro tree-shakes per-entry through `lib/module`, and the package sets no `sideEffects` field, so a `<Map>` plus one source and one layer is what the app pays for, not the whole 688 KB. UNVERIFIED how much exactly, because that needs a real Metro build.

### 1.2 New Architecture / Fabric

Fabric support is source-verified, not a claim:

- `package.json` of 11.4.0 carries `codegenConfig.type: "all"` with an `ios.componentProvider` mapping 12 components to `*ComponentView` classes (`MLRNMapView`, `MLRNCamera`, `MLRNGeoJSONSource`, `MLRNLayer`, and 8 more). Extracted from the tarball this session.
- The iOS tree ships `MLRNMapViewComponentView.mm`, `MLRNGeoJSONSourceComponentView.mm`, `MLRNLayerComponentView.mm` and so on: 20+ `*ComponentView` files. Tarball listing.
- The docs state: "From v11 onwards only the new architecture is supported". Source: https://github.com/maplibre/maplibre-react-native/blob/main/docs/content/setup/getting-started.md
- Migration history: PR #861 (MapView and Camera to new architecture, 2025-06), PR #1223 (Sources, 2026-01), PR #1234 (PointAnnotation, MarkerView, Callout, 2026-01), PR #1243 (Images, 2026-01). GitHub issue search, this session.
- RN 0.87 compatibility was explicitly fixed: release 11.3.4, "Android: use getReactTag for react-native >= 0.87 compatibility" (#1583, 2026-06-08). Release notes fetched this session.
- RN 0.88 specifically: no issue, PR or release mentions "0.88" (`total: 0` from the GitHub search API). Nobody has publicly reported it broken on 0.88, and nobody has publicly reported it working either. Their own example apps pin `react-native 0.83.6` (expo-app) and `0.85.3` (react-native-app), read from `examples/*/package.json` on `main` this session. **Verdict on "anyone has it working on RN 0.88": no public evidence either way. The peer range admits it, 0.87 got an explicit fix, and 11.3.9 (2026-09-05) added an AGP-built-in-Kotlin guard that matters for newer Android Gradle Plugins. Marked UNKNOWN, leaning yes.**

### 1.3 Expo config plugin and prebuild (CNG)

- It ships a config plugin: `app.plugin.js` at package root, `module.exports = require("./lib/commonjs/plugin/withMapLibre")`, wrapped in `createRunOncePlugin`. Extracted tarball.
- The plugin writes Android `gradle.properties` overrides (native version, variant, Kotlin version) via `withGradleProperties`, and on iOS adds `$MLRN.post_install(installer)` to the `Podfile` `post_install` plus dSYM handling, via `withPodfileGlobalVariables` and `withPodfilePostInstall`. Source: `lib/module/plugin/withMapLibre.js` and `src/plugin/withMapLibre.ts` in the tarball.
- The docs require `"plugins": ["@maplibre/maplibre-react-native"]` in `app.json` for Expo projects, and say the plugin is REQUIRED on iOS to inject SPM. Source: https://github.com/maplibre/maplibre-react-native/blob/main/docs/content/setup/expo.md
- This app uses CNG with `android/` and `ios/` gitignored: a prebuild regenerates both, so the plugin runs every prebuild. That is the supported path. One user hit "MapLibre native SPM dependency missing" on Expo SDK 56 / RN 0.85.3 (issue #1623, closed 2026-08-19): the cause was the plugin missing from `app.json`, and adding it fixed the build. Source: https://github.com/maplibre/maplibre-react-native/issues/1623
- **Known open bug that hits THIS app's exact shape.** Issue #1650 (open, 2026-09-08): the podspec's `post_install` adds the MapLibre SPM dependency to EVERY user target in the Podfile, including App Extensions, and a WidgetKit extension then crashes on launch with `Library not loaded: @rpath/MapLibre.framework/MapLibre`. This app's `ios/Podfile` has exactly that shape: `target 'Athan'` (line 29) and `target "ExpoWidgetsTarget"` (line 75). If MapLibre RN is added, the widget extension gets the SPM product linked with no framework embedded, per the issue. Mitigation exists (patch the podspec's `post_install` to skip `ExpoWidgetsTarget`, the same `patch-package` flow this repo already uses for `expo-background-task`), but it is an active upstream bug on the day of this report. Source: https://github.com/maplibre/maplibre-react-native/issues/1650 and `/Users/muji/repos/rn.athan.uk/ios/Podfile:29,75`

### 1.4 Native versions it pins

- Android: `org.maplibre.gl:android-sdk-opengl:13.6.1` (variant `opengl`, not the new Vulkan default), plus `android-plugin-annotation-v9:3.0.2`, `android-plugin-scalebar-v9:3.0.2`, `android-sdk-turf:6.0.1`, okhttp 4.12.0. Source: `android/gradle.properties` in the 11.4.0 tarball, every value listed above.
- iOS: MapLibre Native `6.31.0` via SPM from `maplibre/maplibre-gl-native-distribution`, `exactVersion`. Source: `MapLibreReactNative.podspec` in the tarball, `$MLRN_NATIVE_VERSION ||= "6.31.0"`.
- The docs confirm both pins: https://github.com/maplibre/maplibre-react-native/blob/main/docs/content/setup/getting-started.md

### 1.5 Offline and PMTiles capability (why it passes the brief's rules)

- MapLibre Native 13.x supports the `pmtiles://` protocol. PR #4602 (merged 2026-09-24) made `pmtiles://asset://filename.pmtiles` work from APK assets and `pmtiles://file://` from device storage on Android. Source: https://github.com/maplibre/maplibre-native/pull/4602
- The wrapper's `VectorSource` takes a plain `url` string passed to native `VectorSource(mID, url)` (`android/.../vectorsource/MLRNVectorSource.kt:17-18` in the tarball), so a `pmtiles://` URL flows through unmodified.
- iOS 6.31.0 is the current pinned version; the iOS PMTiles situation is UNVERIFIED at that version (the PR trail above is Android-side). The wrapper's offline manager (`createPack`) exists for both platforms but downloads over the network, which the brief forbids at runtime but allows at build time if the region is baked in. Source: https://github.com/maplibre/maplibre-react-native/blob/main/docs/content/modules/offline-manager.md
- Styles can be inline JSON (the wrapper writes style JSON to a temp file on iOS, `MLRNUtils.m:128-148`) or `file://`/`asset://` URLs on Android (`DownloadMapImageTask.java:77` accepts `file://`, `asset://`, `data:`). No network needed for any of this.

## 2. Native binary size, measured

### 2.1 Android, from Maven Central

`curl -sI https://repo1.maven.org/maven2/org/maplibre/gl/android-sdk-opengl/13.6.1/android-sdk-opengl-13.6.1.aar` returns `content-length: 15598638` (15.6 MB, all ABIs). Downloaded and opened this session. Contents:

| Payload | Size (bytes) | Notes |
| --- | --- | --- |
| `jni/arm64-v8a/libmaplibre.so` | 10,846,016 | 10.85 MB uncompressed |
| `jni/armeabi-v7a/libmaplibre.so` | 7,917,088 | 7.92 MB, the 3T's ABI |
| `jni/x86/libmaplibre.so` | 10,994,720 | emulator only |
| `jni/x86_64/libmaplibre.so` | 11,207,424 | emulator only |
| `classes.jar` | 805,208 | 0.8 MB Java/Kotlin, dexes smaller |
| whole AAR | 15,598,638 | Maven `content-length` |

Deflate sizes, measured with `zip -9` this session: arm64 3,772,118 bytes; armeabi-v7a 3,239,850; x86 3,850,184; x86_64 3,792,498.

**What it does to THIS app's APK.** The repo's own `android/app/build.gradle:126-127` sets `useLegacyPackaging enableLegacyPackaging.toBoolean()` with the property defaulting to `'false'`, and `android/gradle.properties:37` sets `reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64`. With `useLegacyPackaging false` and minSdk >= 23, `.so` files are stored in the APK UNCOMPRESSED (page-aligned for `mmap`), so the deflate numbers are irrelevant to APK size:

- All 4 ABIs (current config): 10,846,016 + 7,917,088 + 10,994,720 + 11,207,424 = **40,965,248 bytes = 39.1 MB of `.so`, plus 0.8 MB classes = about +39.9 MB**.
- Phone ABIs only (arm64 + armeabi-v7a): 18,763,104 bytes = **17.9 MB + 0.8 MB classes = about +18.7 MB**.
- The Play Store's AAB delivery serves one ABI per device, so the DOWNLOAD cost is one `.so` (3.2 to 3.8 MB compressed) plus classes. The 66 MB figure the owner cites is the APK, and an APK is what the side-load and fleettest ritual installs (`adb install`), so the honest number for this repo is the APK one.
- Cross-check from a real user: "MapLibre adds 10 MiB ish per build in the APK. I build for armeabi-v7a and arm64-v8a and so MapLibre alone is taking 20 MiB." Source: https://github.com/maplibre/maplibre-react-native/issues/637 (closed, 2025-02-02). That matches the 17.9 MB measured here plus plugins.
- Plugins add a little more: `android-plugin-annotation-v9-3.0.2.aar` is 84,117 bytes and `android-plugin-scalebar-v9-3.0.2.aar` is 18,073 bytes (Maven `content-length`, this session). `android-sdk-turf` ships as a 27,945-byte JAR.

**Options to cut it.** Restricting `reactNativeArchitectures` to `armeabi-v7a,arm64-v8a` halves the cost; the 3T is armeabi-v7a and the XS is arm64. Whether dropping x86 breaks the owner's emulator-based testing is a question for the owner, not this report.

### 2.2 iOS, from the distribution repo

The podspec pins SPM `exactVersion 6.31.0` of `maplibre/maplibre-gl-native-distribution`, whose `Package.swift` is a `binaryTarget` pointing at `https://github.com/maplibre/maplibre-native/releases/download/ios-v6.31.0/MapLibre.dynamic.xcframework.zip` (checksum `de3aaa43...`). Source: `Package.swift` at tag 6.31.0 of `maplibre-gl-native-distribution`.

Measured this session by downloading that zip:

- Whole zip: `content-length: 10,312,052` (10.3 MB, compressed, both slices).
- `ios-arm64` device slice binary, `MapLibre.framework/MapLibre`: **7,823,648 bytes = 7.82 MB uncompressed**. This is the number that lands in the app bundle (App Store slices it, but the uncompressed framework is what the binary carries).
- The device slice alone re-zips to 3,419,138 bytes (3.4 MB), measured. So an App Store download grows by roughly 3.4 MB.
- `MinimumOSVersion` of the framework: **12.0**, read from its `Info.plist` with `plistlib`. The app's deployment target 16.4 is comfortably above it.
- The static xcframework variant (`MapLibre.static.xcframework.zip`) is 404,362,189 bytes (Maven-style `content-length` via redirect), because it contains simulator slices; not the path the podspec uses.

### 2.3 App-size reports from people who added it

- Issue #637 (quoted above): +10 MiB per ABI, 20 MiB for the two phone ABIs.
- No other published "app size increased by X" report was found in the wrapper's issue tracker (search "size apk": 2 hits, one being #637).

## 3. Alternatives, same analysis

### 3.1 `react-native-maps@1.29.11`

- Peer range: `react >= 18.3.1`, `react-native >= 0.76.0`. Fabric table in its README: "1.26.1+ requires >= 0.81.1". Source: README in the 1.29.11 tarball.
- Codegen config declares Fabric component providers (`RNMapsMapView`, `RNMapsGoogleMapView`, and 5 more). It is a genuine new-arch component library, with open Fabric bugs at time of writing: #6004 (Apple Maps New Arch, one Marker zIndex change blanks every other marker), #6002 (Fabric marker position always `{0,0}`), #5987 (Fabric cast crash in MarkerManager). Source: GitHub search "new architecture fabric", this session.
- **Apple Maps on iOS needs no key** and works out of the box. Source: https://github.com/react-native-maps/react-native-maps/blob/master/docs/installation.md ("The native Apple Maps based implementation works out-of-the-box").
- **Android has no Apple Maps: it is Google Maps only, and Google Maps requires an API key with a billing account.** Source: same doc, line 11 ("On Android, one has to use Google Maps, which in turn requires you to obtain an API key for the Android SDK") and the billing warning on line 17. **This fails the brief's hard rule "No API key. Not Mapbox, not Google..." on half the platforms. Out.**
- Offline: `LocalTile` overlays xyz tiles from device storage (`/storage/emulated/0/mytiles/{z}/{x}/{y}.png`), and the README notes the underlying map still downloads unless `mapType` is set to `"none"`. So a keyless "map" is a `LocalTile` overlay over an empty canvas, but at that point the library provides a gesture and view layer over PNG tiles rather than a basemap, and the tile count is R1's megabyte question. Source: README section "Tile Overlay using local tiles".
- Size: the system provides both engines (Play Services on the 3T, MapKit on iOS), so added native weight is near zero. Irrelevant given the key failure.

### 3.2 MapLibre GL JS inside a WebView

The repo already carries `@expo/dom-webview@58.0.1` (in `package.json:33`), and its native wrapper is paid for: the AAR at `node_modules/@expo/dom-webview/local-maven-repo/.../expo.modules.webview-58.0.1.aar` is **82,265 bytes**, and it wraps the system WebView (creates `android.webkit.WebView` in `DomWebView.kt`). No app code imports it today (`grep -rn "dom-webview"` over `app/`, `components/`, `hooks/`, `shared/` returns nothing), but the binary is in the build either way. So the WebView path adds ZERO new native code.

Local file access, source-verified in the installed package:

- Android: `DomWebView.kt:196-199` sets `settings.allowFileAccess = true` AND `settings.allowFileAccessFromFileURLs = true`, with the comment "API 30+ default disables file access; DOM bundles need it for sibling assets." A `file://` page can XHR sibling files.
- iOS: `DomWebView.swift:185` calls `webView?.loadFileURL(url, allowingReadAccessTo: URL(fileURLWithPath: "/"))` for file URLs: the WebView may read the whole filesystem sandbox for that load.

Can it read a local PMTiles file? Mechanically yes, three ways:

1. `file://` page plus `fetch('data.pmtiles')` with the Android settings above. iOS WKWebView's `loadFileURL` grant covers this the same way. CORS: fetch from a `file://` origin to a `file://` sibling is what `allowFileAccessFromFileURLs` permits on Android; on iOS the read-access grant does the same. UNVERIFIED end to end on both floor devices, because no device was available to this session.
2. Bridge transfer: `pmtiles@4.5.0`'s `Source` interface is one function, `getBytes(offset, length): Promise<RangeResponse>` (`package/dist/esm/index.d.ts:173-174`). `@expo/dom-webview` exposes `injectedJavaScriptObject` and a JS bridge, so a custom `Source` that asks the RN side for byte ranges is a small adapter. The `pmtiles` ESM bundle is 14,882 bytes minified (measured), so the decoder itself is trivial in weight.
3. MapLibre GL JS `addProtocol("pmtiles", protocol.tile)`, the documented path. Source: https://docs.protomaps.com/pmtiles/maplibre

JS payload, measured: `maplibre-gl@5.22.0` minified `dist/maplibre-gl.js` is 1,050,563 bytes (1.05 MB), gzip 273,635. `maplibre-gl@5.24.0` is 1,056,837 bytes, gzip 275,176. Plus the `pmtiles` adapter at ~15 KB. If the HTML shell inlines the JS (simplest offline approach), the asset adds about 1.1 MB to both platforms; nothing stops minifying further or using the `csp` build at 971,665 bytes. If served from Metro (remote), it defeats offline, so inlined it is.

Version ceiling, and this is the trap: **MapLibre GL JS 5.23.0 and 5.24.0 fail to render on Chromium 88 WebView, and 5.14+ needs an `AbortSignal.throwIfAborted` polyfill even to reach 5.22.** Source: https://github.com/maplibre/maplibre-gl-js/issues/8157 (closed as not planned, 2026-08-12). The OnePlus 3T on Android 9 relies on the system WebView, which is Chromium-era old; the issue's test device was Android 10 with Chromium 88, and the 3T's WebView is older still, UNVERIFIED which exact version it has. So the WebView path pins `maplibre-gl` at `<= 5.22.0` forever on the floor device, or drops the floor device.

iOS second trap: **iOS kills the map's web workers when the page is backgrounded, and the map can never load tiles again** ("iOS Safari and iOS WebView", 5 to 30 minutes backgrounded). Source: https://github.com/maplibre/maplibre-gl-js/issues/8461 (open, 2026-09-15). For a qibla screen the user opens, closes, reopens at the next prayer, that is a real crash-shaped failure: the workaround would be destroying and recreating the map on foreground.

Performance on the floor devices: UNVERIFIED, no published A12 or SD820 WebGL benchmark for maplibre-gl was found. Two adjacent facts: maplibre-gl-js is the same renderer design as maplibre-native's GL backend, and a 2016 Snapdragon 820 has an Adreno 530 with WebGL 1 support, so a small-viewport, few-layer map is plausible but must be measured before believing. The A12's Safari/WKWebView WebGL is fast; worker kills aside, iOS is the safe half.

`react-native-webview@14.0.1` as the alternative host: 650 KB unpacked, pure source build (no AAR in the tarball), peers `react: *`, `react-native: *`. It adds a second native webview library beside `@expo/dom-webview`'s 82 KB wrapper for no capability this needs. Not preferred.

### 3.3 Vector geometry with the installed `react-native-svg`

Already installed (`package.json:74`), already proven on both floor devices by the shipped qibla dial (session 37's 60fps result). Its AAR (`node_modules/react-native-svg/android/build/outputs/aar/react-native-svg-release.aar`) is 373,383 bytes with no `.so` payload: zero new native weight, and the JS is already in the Hermes bundle.

Feasibility of drawing recognisable surroundings from local GeoJSON:

- A coastline or borough outline at city scale is small. Natural Earth's 1:110m coastline GeoJSON is 136.6 KB, 1:50m is 1.6 MB, 1:10m is 9.9 MB (GitHub API sizes of `nvkelso/natural-earth-vector/geojson/`, this session). For London, a 1:50m outline clipped to a 20 km box around the user is a few tens of KB of coordinates after simplification, and `@turf` is already in the dependency tree via the wrapper (though the app would need its own turf dep, `@turf/simplify` unpacked is 47 KB).
- A street network is heavier: OpenStreetMap extracts for a London borough run to tens of MB unsimplified, but a SIMPLIFIED subset (major roads only, one polygon outline) is a design choice R1 and the owner make, not a renderer limit. No published "simplified street GeoJSON for a city district" size was found; UNVERIFIED, must be generated to be known.
- The cost model is measured and brutal: **1.33 to 1.87 ms per path per full-window re-record on the SD820** (`ai/plans/37-qibla-compass/RESEARCH.md:387`, from `components/ui/Masjid.tsx`'s 30 paths at 40 to 56 ms). The arithmetic against the repo's own frame budgets:

| Paths | Cost at 1.33 to 1.87 ms/path | 33.33 ms (30fps floor, Rule 1) | 16.67 ms (60fps) |
| --- | --- | --- | --- |
| 8 | 10.6 to 15.0 ms | fits, even re-recorded | fits |
| 12 | 16.0 to 22.4 ms | fits, re-recorded | only if never re-recorded |
| 24 | 31.9 to 44.9 ms | borderline to over | over |
| 32 | 42.6 to 59.8 ms | over | over |
| 88 (the shipped dial) | 117 to 165 ms | 3.5 to 5x over | 7 to 10x over |

  So a map drawn as one `<G>` of 30 street paths is affordable ONLY under the dial's architecture: record once, then move the layer with a Reanimated transform. Panning (translate transform) is compositor-cheap under that architecture. Zooming or loading a new tile set forces a re-record, which at 30 paths costs 40 to 56 ms: a one-frame 30fps break per zoom step on the 3T, or 2 to 3 dropped frames. That is the honest ceiling: a pan/rotate-only sketch map is 60fps-capable; an interactive zooming street map is not, on this floor device, with this library.
- The decisive advantage: zero megabytes, zero new native code, zero supply-chain risk, and the repo already has the regression-tested pattern (`components/qibla/Dial.tsx`, memoised on size and bearing, layer rotated above).

### 3.4 `@shopify/react-native-skia@2.13.1`

- Peers: `react >=19.0`, `react-native >=0.78`, `react-native-worklets >=0.7.0`, `react-native-reanimated >=4.0.0`. This repo has 19.3.0, 0.88.0-rc.2, 0.13.0, 4.7.0: all satisfied. Source: `npm view @shopify/react-native-skia peerDependencies`.
- RN 0.88: no "0.88" mention in its releases; 2.13.0 (2026-09-24) REMOVED the legacy architecture, so it is new-arch only, same as this app. Release notes read this session. UNVERIFIED on 0.88 specifically, peers admit it.
- Size, measured this session by linking the shipped static archives with NDK 27.1.12297006:
  - `react-native-skia-android@154.0.0` (its hard dependency) ships `libskia.a` at 24,739,752 bytes (arm64) and 20,085,902 (armeabi-v7a), plus `libskottie`, `libsksg`, `libskshaper`, `libsvg`, `libskparagraph`, `libskunicode_*` (full table in the tarball).
  - A whole-archive link of `libskia.a` alone produces a stripped `.so` of **8,763,136 bytes (arm64) and 5,776,044 (armeabi-v7a)**. That is the floor for what the RN module links, before the RN-Skia C++ and any Skia modules the app uses pull in more.
  - For this repo's 4-ABI APK: **5.78 (v7a) + 8.76 (arm64) + 10.00 (x86) + 9.57 (x86_64) = 34.1 MB of stripped `.so`**, uncompressed under `useLegacyPackaging false`, before the RN-Skia C++ and any used Skia modules merge in (they link into the same `.so`, so this is close to the final number). The two phone ABIs alone are **14.5 MB**. That is the same order as MapLibre's engine, for a canvas with no tile decoding.
  - One real-world report: an App Center build grew 17 MB when adding Skia, and the Play Store AAB went to "56 MB which was very similar to the bundle size before we added Skia" (so the AAB download is much smaller than the APK). Source: https://github.com/Shopify/react-native-skia/issues/1789 (closed, 2023-08). Version 0.1.200 era, so the numbers have moved, but the shape (APK heavy, AAB light) matches the measurement above.
  - iOS: `react-native-skia-apple-ios@154.0.0` ships 83.2 MB of static archives for the device slice (sum measured: libskia 34.4 MB, libskottie 12.3, libskshaper 13.1, libsvg 10.6, libsksg 9.8, libskparagraph 1.3, others small). Dead-strip linking removes unused Skia modules, so the real app growth is somewhere above the MapLibre 7.8 MB and below 83 MB. UNVERIFIED precisely; a build is the only honest answer.
- What it buys: GPU raster of arbitrary geometry, canvas-style, with Reanimated integration the repo already uses. It can draw a street network as paths at GPU speed, which `react-native-svg` cannot. But it cannot decode vector tiles (no MVT/PBF decoder in the JS API; drawing tiles means writing or shipping a decoder, UNVERIFIED any RN-ready MVT renderer exists for Skia) and it costs the same APK order as the full MapLibre engine. If the decision is "spend 30 MB", MapLibre buys a real map for the same money.

### 3.5 Everything else

- `expo-maps@58.0.3`: exists in SDK 58 (`node_modules/expo/bundledNativeModules.json` pins `~58.0.2`), installs clean. "Provides a Map component that uses Google Maps on Android and Apple Maps on iOS. Requires a minimum deployment target of iOS 18.0" (README, tarball). **Two disqualifiers: Google key on Android, and iOS 18 minimum against this app's 16.4 deployment target with an iPhone XS floor device (iOS 26 dropped the XS; it cannot even run iOS 26).** Out.
- `@rnmapbox/maps@10.3.5`: peer `mapbox-gl ^2.9.0` plus a Mapbox access token. Fails no-key. Out.
- OpenLayers (`ol@11`): 12,327,755 bytes unpacked (`npm view ol dist.unpackedSize`). Twelve times maplibre-gl's JS weight for the same WebView constraints. Out on weight.
- Raster tiles as plain `Image` components: zero new dependencies, works today. A 3x3 grid of 256px PNG tiles per screen is 9 `Image` views; RN `Image` on the 3T is a mature path. No frame measurement exists for a scrolling grid of map tiles in this repo; UNVERIFIED, and the tile bytes are R1's problem (PNG tiles of a city at z13 to z16 dwarf a vector basemap). Viable as the "cheapest recognisable surroundings" fallback if R1's PMTiles megabytes come back small, but the byte cost lives in assets, not code.

## 4. Verdict table

At the top of this report.

## 5. Judged against the repo's Performance Design Rules

Rule 1 (30fps floor, `ai/AGENTS.md` section 4):

- `react-native-svg` map: PASSES only under the record-once, transform-only architecture (proven by the dial at a 16.7 ms median frame gap, 89% at 60fps, zero gaps in the 30 to 34 ms band: session 37's measurement). Any per-frame re-record fails at 24+ paths; the arithmetic is the table in 3.3.
- MapLibre Native: the GL renderer runs on a render thread with its own choreography; map panning on an SD820-class GPU is what MapLibre's Android engine was built for in the 2015 to 2020 era (its ancestor ran on slower phones than a 3T). No 3T measurement of THIS library exists in this repo: UNVERIFIED, needs `frame-audit.sh` on the device before any ship decision.
- WebView maplibre-gl: worker + WebGL on a Chromium 88-class engine. Plausible for a static viewport, unproven, and the backgrounding worker kill (issue 8461) is a correctness hole, not a perf one.
- Skia: GPU raster is the fastest of the custom-draw options on paper. No RN-Skia frame measurement exists for this repo: UNVERIFIED.

Rule 7 (gate invisible work): every candidate must subscribe to nothing when the qibla surface is closed. The dial already does this; a MapLibre `MapView` must unmount or idle; a WebView must suspend. Design constraint, not a disqualifier.

Rule 2, 3 (static-in-render, no post-paint init): applies to the svg path exactly as the dial learned it. Native MapLibre and Skia own their first-frame pipelines.

**How many paths before the frame budget breaks, the arithmetic the brief asked for:**

- At 1.33 ms/path (best case): 33.33/1.33 = **25 paths** at the 30fps floor; 16.67/1.33 = 12 paths at 60fps.
- At 1.87 ms/path (worst case): 33.33/1.87 = **17 paths** at the 30fps floor; 16.67/1.87 = 8 paths at 60fps.
- So: **17 to 25 paths is the absolute ceiling for a re-recorded svg map at the repo's own 30fps floor, and 8 to 12 for 60fps.** Anything richer must be recorded once and transformed, or pre-rasterized to PNG (the `Masjid` precedent).

## 6. The lightest thing that still shows recognisable surroundings

Ranked by added megabytes to the current 66 MB APK (and the iOS app):

| Rank | Option | Added MB (APK / iOS) | What the user recognises |
| --- | --- | --- | --- |
| 1 | `react-native-svg` line drawing from a bundled, simplified GeoJSON (roads, rail, coastline, the user's street) | **0.0 / 0.0** (+ tens of KB of bundled coordinates) | Street shapes, angles between roads, the river. The same cues the owner uses on Google Maps, minus buildings |
| 2 | Same geometry drawn in `@expo/dom-webview` (canvas or svg-in-DOM) | **0.0 / 0.0** (+ ~1.1 MB if maplibre-gl is inlined, or ~15 KB with a hand-rolled canvas renderer) | Same as rank 1, with free zoom/pan from the browser engine |
| 3 | MapLibre GL JS 5.22 in the installed `@expo/dom-webview`, local PMTiles, no native code | **0.0 native / 0.0 native**, +1.07 MB JS asset, + R1's PMTiles MB | A real slippy map with labels, zoom, rotation |
| 4 | Plain `Image` components over local raster tiles | 0.0 code / 0.0, tiles are all asset weight | A photographic-style map, at raster-tile byte cost (R1) |
| 5 | `@shopify/react-native-skia` custom renderer | **+14.5 (2 phone ABIs) to +34.1 (4 ABIs)** / several MB after dead-strip | Whatever is hand-built; no tile decoding exists |
| 6 | `@maplibre/maplibre-react-native` full engine | **+39.9 (4 ABIs) or +18.7 (2 phone ABIs) / +7.8** | A full commercial-grade map: buildings, labels, every zoom |

The decisive answer to "if a full map renderer is too heavy, what is the lightest recognisable thing": **ranks 1 and 2 cost zero new native megabytes and the geometry is tens of kilobytes.** The minimum visual that lets a human check a direction is a handful of drawn lines in the right angles: the user's own street, the two or three streets it meets, and a north arrow. Session 40's failure was a needle with nothing to check it against; a correct street angle against a drawn qibla line is exactly the check. Whether that satisfies the owner's "recognisable surroundings" bar is question 3's judgement, but on megabytes, nothing beats zero.

## Assumptions recorded

- The 66 MB APK baseline is the owner's figure from the brief; this session did not rebuild to confirm it.
- "All 4 ABIs" APK math assumes `useLegacyPackaging false` (source-verified in the repo's build.gradle) stores `.so` uncompressed. If a future build flips it, deflate numbers (3.2 to 3.9 MB per ABI) apply instead.
- The iOS app-slice numbers treat the dynamic framework's device slice as the added binary; App Thinning may report smaller download numbers.
- MapLibre RN on RN 0.88.0-rc.2 is judged "leaning yes" from the peer range plus the 0.87-specific fix, not from a build. No device or simulator build was run by this research session.
- The 3T's exact system WebView version was not read (no device access); the Chromium 88 ceiling for maplibre-gl is taken from issue 8157's Android 10 test device, so the 3T's ceiling is assumed to be at or below 5.22 too.

## What I attacked in my own conclusion

**Attack 1: "the peer range says 0.80+, so 0.88 works."** Weak. Peer ranges lag. I went looking for the newest RN the maintainers actually run: example apps on 0.83.6 and 0.85.3, a 0.87-specific code fix in 11.3.4, and zero "0.88" mentions anywhere. So the honest verdict stays UNKNOWN-leaning-yes, and the report says so. A 30-minute dev-client build on the simulator would settle it; this session could not run one.

**Attack 2: "the AAR is 15.6 MB, so that is the cost."** Wrong twice. The AAR holds four `.so` payloads, and this repo's own gradle config stores `.so` files uncompressed across four ABIs, so the real APK cost is 39.9 MB, and the phone-only cost is 18.7 MB. The published user report (+10 MiB per ABI) corroborates the per-ABI number, which is the one that survives.

**Attack 3: "WebView path is free, so it is the winner."** It is free in megabytes and it dodges the widget-extension SPM bug, but it carries two device-truth defects I found only by attacking it: maplibre-gl 5.23+ does not render on the floor device's WebView generation (issue 8157), and iOS kills the map's workers after backgrounding, permanently (issue 8461). A renderer that pins to a year-old version and dies after backgrounding is not "free", it is a maintenance trap. The report carries both with URLs.

**Attack 4: "Skia is lighter than MapLibre because it is a small 2D library."** The link test disproved my expectation: whole-archive `libskia.so` alone is 8.76 MB arm64 stripped, and the four-ABI APK cost is 34.1 MB, past the same band as the full map engine's 39.9 MB. Skia buys less (no tile decoding) for nearly the same weight. This killed the "Skia as the middle option" idea I came in holding.

**Attack 5: "the svg path count ceiling is 25, from the best-case 1.33 ms."** Cherry-picking. The measured band is 1.33 to 1.87, and the worst case gives 17. The report states the band, 17 to 25, and the 60fps band, 8 to 12. Anyone planning a street map against the best case alone would ship a 30fps break on the floor device.

**Attack 6: "MapLibre RN works with Expo prebuild out of the box."** It does, one config-plugin line, but issue #1650 (open) says the podspec's `post_install` links the SPM product into every Podfile target, and this repo's Podfile has a second target, the widget extension, whose crash on launch is the exact reported symptom. That is a patch-package-sized mitigation, but it is a real, dated, upstream-open cost that the verdict table's "works with Expo prebuild" hides unless it is written down. It now is.
