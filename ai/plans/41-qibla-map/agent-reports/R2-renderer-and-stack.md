# R2: is there a renderer that works on THIS stack, and what does it take?

> **Note, added by the planning session.** The research server restarted mid-wave and R2's work ran twice,
> so this folder holds TWO R2 reports. They are kept because they are complementary rather than duplicates,
> and they agree on every verdict. This one is the longer pass and carries the upstream and WebView detail:
> issue `#1650`'s SPM-into-every-target crash, the finding that MapLibre GL JS v6 cannot construct its
> worker from a `file://` origin at all while v5 ships a blob worker, and the Expo prebuild evidence.
> `R2-renderer-and-size.md` is the shorter pass and carries the binary measurements taken with the NDK
> linker. Read this one for what breaks and that one for what it weighs.

Research agent R2, session 41, 2026-09-30. Stack verified from `package.json`, not from the brief:
`react-native@0.88.0-rc.2`, `expo@~58.0.0-preview.7`, `react@19.3.0` (the brief says 19.2.3; the manifest
says 19.3.0; both satisfy every peer range studied here, so the discrepancy changes nothing), New
Architecture, `react-native-reanimated@4.7.0`, `react-native-worklets@0.13.0`,
`react-native-svg@15.15.5`, `react-native-gesture-handler@~3.2.1`, `@expo/dom-webview@~58.0.1`,
TypeScript `~7.0.2`, Yarn 1, Expo CNG. Floor devices: OnePlus 3T (Android 9, API 28, SD820, arm64-v8a)
and iPhone XS (A12, deployment target 16.4).

A sibling report exists at `agent-reports/R2-renderer-and-size.md` covering the same question with an
emphasis on measured native sizes. Where the two agree, confidence rises. Where they differ, the
difference is named in section 7.

Per the owner's ruling recorded in `BRIEF.md` section 2: size is RECORDED, never a verdict. Working is
the only bar. Compatibility with the stack is a hard filter.

## Verdict table

| Candidate | Works on RN 0.88.0-rc.2 | Needs a key | Offline | MB added (recorded, not a verdict) | Fabric-ready | Floor-device perf risk | Effort to first proof |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `@maplibre/maplibre-react-native@11.4.0` | Yes (peer `>=0.80.0`, no known 0.88 break; see 1.3) | No | Yes (`pmtiles://file://`, `mbtiles://`, bundled assets) | +10.35 MiB Android arm64 `.so` uncompressed (single-ABI build); +39.07 MiB all four ABIs; +7.46 MiB iOS arm64 device binary; 2.14 MB JS unpacked | Yes (full migration shipped) | Low-medium: native GL renders off the RN tree, own render loop | Medium: new native dep, config plugin, one open upstream conflict with this repo's widgets (1.6) |
| MapLibre GL JS v5 in `@expo/dom-webview` | Yes (zero new native code; the WebView is already compiled into this app) | No | Yes (bundled HTML+JS+PMTiles; blob worker verified in dist, 3.1) | ~1.06 MiB minified WebView JS (`dist/maplibre-gl.js`) plus the PMTiles bytes (R1's domain) | N/A (one native view) | HIGH and UNVERIFIED: WebGL vector map on Adreno 530 and A12 in a system WebView; no published measurement exists; sibling report adds a floor-device WebView-version ceiling, see 3.1 | Low-medium: pin v5 (v6 is broken on `file://`), bridge the PMTiles as a Blob |
| `react-native-maps@1.29.11` | Yes (peer `>=0.76.0`) | Android: YES, Google key plus billing. iOS Apple Maps: no key | Android: no (LocalTile still fetches the basemap). iOS: no offline API | Not measured; eliminated on rules | Yes | N/A | ELIMINATED: fails the no-key rule on Android, no offline on either |
| `react-native-svg@15.15.5` + local GeoJSON | Yes (installed today) | No | Yes (bundled JSON or decoded MVT, all pure JS) | 0 native; ~110 KB of pure-JS decode libs if decoding MVT, 0 if pre-extracting GeoJSON on the dev machine | Yes (in use) | Medium: 17 to 24 paths per 33 ms frame IF re-recorded; one-off record proven at 84 elements | Low: hours |
| `@shopify/react-native-skia@2.13.1` | Yes (peer `>=0.78`; all four peers already satisfied by this repo) | No | Yes | 10.25 MiB npm unpacked; sibling report link-measured 8.76 MB arm64 stripped `libskia.so`, 34.1 MB four ABIs | Yes (codegen `rnskia`) | Low for drawing (GPU), same record-once architecture | Medium: new native dep on an RC stack |
| `expo-maps@58.0.3` | Yes (SDK 58's own) | Android: YES, Google Cloud key. iOS: no key | No offline support at all (zero mentions in the SDK docs) | Not measured; eliminated on rules | Yes | N/A | ELIMINATED: Google key on Android, no offline, and it wants deployment target iOS 17 or 18 against this repo's 16.4 |
| Raster tiles as plain `Image`s | Yes (zero deps) | No | Yes (files bundled in the APK/IPA) | Equals the tile bytes (R1's domain) | N/A | Low: images plus transforms, compositor-friendly; no measurement exists for 20+ images per screen, UNVERIFIED on 3T | Lowest for one fixed zoom; medium if zoom levels are wanted |

The one I would build first: the `react-native-svg` proof (section 6). It needs no new package beyond
optional pure-JS decoders, it reuses the record-once architecture session 37 proved on the 3T at 84
elements, and its failure mode teaches the next step rather than wasting a native integration.

---

## 1. `@maplibre/maplibre-react-native`

### 1.1 Version and peer range

Current version is `11.4.0`, published 2026-09-19
(`npm view @maplibre/maplibre-react-native version`, output `11.4.0`). Peer dependencies:

```
"expo": ">=54.0.0",
"react": ">=19.1.0",
"@types/react": ">=19.1.0",
"react-native": ">=0.80.0",
"@types/geojson": "^7946.0.0"
```

Source: `npm view @maplibre/maplibre-react-native peerDependencies --json`, and the published package
manifest at `https://raw.githubusercontent.com/maplibre/maplibre-react-native/main/package/package.json`
(same values, verified 2026-09-30).

The repo's `expo@~58.0.0-preview.7`, `react@19.3.0` and `react-native@0.88.0-rc.2` sit inside or above
every floor. One precision on semver: under strict `node-semver`, a prerelease like `0.88.0-rc.2` only
satisfies `>=0.80.0` when a comparator carries the same tuple, so npm 7+ would flag the peer as unmet.
This repo uses Yarn 1, which does not enforce peer ranges at all (it warns, never fails), so the flag is
install noise, not a block. The honest compat question is runtime, covered next.

### 1.2 New Architecture / Fabric

Fully migrated. The package manifest declares a `codegenConfig` of type `all` with Fabric
`componentProvider` entries for every view: `MLRNMapView`, `MLRNCamera`, `MLRNImages`,
`MLRNImageSource`, `MLRNLayer`, `MLRNPointAnnotation`, `MLRNNativeUserLocation`, `MLRNCallout`,
`MLRNGeoJSONSource`, `MLRNVectorSource`, `MLRNRasterSource`, `MLRNRasterDEMSource`
(`https://raw.githubusercontent.com/maplibre/maplibre-react-native/main/package/package.json`,
`codegenConfig` block). The migration landed through a series of merged PRs, all closed:
`#861` (MapView and Camera), `#1114` (UserLocation), `#1182` and `#1195` and `#1223` (Sources),
`#1234` (PointAnnotation, MarkerView, Callout), `#1243` (Images)
(GitHub issue search `repo:maplibre/maplibre-react-native Fabric New Architecture`, 33 results,
2026-09-30).

### 1.3 RN 0.88 and React 19 evidence

- No open or closed issue mentions `0.88` (GitHub issue search for `0.88` in title and body returned
  `total_count: 0`, 2026-09-30). So nobody has reported it broken on 0.88, and nobody has reported it
  working either. UNVERIFIED either way; the claim is "no known break, in peer range".
- The library tracks RN releases closely: `11.3.4` (2026-06-08) fixed `getReactTag` for
  `react-native >= 0.87` compatibility, PR `#1583`
  (`https://github.com/maplibre/maplibre-react-native/blob/main/CHANGELOG.md`). A 0.87 API change was
  patched within its release cadence, which is the pattern you want under an 0.88 RC.
- The library's own apps run one to three minors behind: the Expo example is Expo 55 / RN 0.83.6 /
  React 19.2.0 (`examples/expo-app/package.json` on `main`), the RN example is RN 0.85.3 /
  React 19.2.3 (`examples/react-native-app/package.json` on `main`). An open dependabot PR `#1642`
  proposes bumping the RN example to 0.87.1. Upstream CI builds those example apps on every PR
  (`.github/workflows/review-android.yml`, `review-ios.yml`), so RN 0.85 is the newest version the
  maintainers build against. RN 0.88 is in range but one step past upstream's tested line.
- React 19: both example apps run React 19.2.x, and the peer floor is `>=19.1.0`. React 19.3.0 is
  in range.

### 1.4 Expo config plugin and prebuild survival

It ships a config plugin: `app.plugin.js` at the package root plus
`src/plugin/{withMapLibre.ts,android.ts,ios.ts}`
(`https://api.github.com/repos/maplibre/maplibre-react-native/git/trees/main?recursive=1`, paths
`package/app.plugin.js`, `package/src/plugin/*`). Read from source:

- Android: `withGradleProperties` merges `org.maplibre.reactnative.*` entries into
  `android/gradle.properties` (`src/plugin/android.ts`). Idempotent merge, re-applies each prebuild.
- iOS: `withPodfilePostInstall` injects `$MLRN.post_install(installer)` into the Podfile's
  `post_install` block, `withPodfileGlobalVariables` adds optional version variables, and
  `withDwarfDsym` sets the debug information format (`src/plugin/ios.ts`).
- The docs say the plugin is REQUIRED for iOS: "The plugin is required to properly install MapLibre
  Native on iOS, where it adds `$MLRN.post_install(installer)` to the `post_install` block in the
  `ios/Podfile`" (`https://raw.githubusercontent.com/maplibre/maplibre-react-native/main/docs/content/setup/expo.md`).

Prebuild survival is proven by a real failure and its fix: issue `#1623` (Expo SDK 56, RN 0.85.3,
Expo prebuild `--clean`) reported the iOS build failing with `'MapLibre/MapLibre.h' file not found`
because the SPM package reference was missing. The reporter closed it themselves: adding
`"@maplibre/maplibre-react-native"` to the `plugins` array of `app.json` resolved it
(`https://github.com/maplibre/maplibre-react-native/issues/1623`). That is the CNG contract working as
designed: plugin present, prebuild regenerates the SPM wiring; plugin absent, iOS fails.

The iOS native dependency is an SPM binary target pointing at
`https://github.com/maplibre/maplibre-native/releases/download/ios-v6.31.0/MapLibre.dynamic.xcframework.zip`
(`MapLibreReactNative.podspec`, `$MLRN_NATIVE_VERSION ||= "6.31.0"` and `$MLRN_SPM_SPEC`). On Android
the wrapper pins `org.maplibre.gl:android-sdk-opengl:13.6.1`, minSdk 24, compileSdk 35, Kotlin 2.0.21,
NDK 27.1.12297006 (`package/android/gradle.properties` on tag `v11.4.0`). The 3T on API 28 clears
minSdk 24.

### 1.5 Local PMTiles and MBTiles, no network, no key

No key of any kind is involved: MapLibre Native has no provider lock-in, and the wrapper's demo style
URL is only a default you replace (`README.md`, "MapLibre React Native", maplibre.org).

PMTiles is supported in the native SDK and therefore in the wrapper:

- The MapLibre Android docs state: "Starting MapLibre Android 11.7.0, PMTiles archives are supported
  as tile sources. Prefix any tile source URL with `pmtiles://`", with the local forms
  `pmtiles://file://` for device storage and `pmtiles://asset://<name>.pmtiles` or
  `pmtiles://file:///android_asset/<name>.pmtiles` for files in `src/main/assets/`
  (`https://maplibre.org/maplibre-native/android/examples/data/PMTiles/`). The wrapper pins 13.6.1,
  well past 11.7.0.
- The wrapper's maintainer closed the `addProtocol` request (`#28`) with "PMTiles support is available"
  and a `VectorSource` example using `url="pmtiles://https://..."`; iOS 17 usage was fixed in `#625`
  ("fix: usage of PMTiles on iOS 17 through VectorSource"). So both platforms work through the
  existing source components.
- Caveat from the same Android docs: "PMTiles sources do not support offline pack downloads or
  caching". Irrelevant here: the offline pack API is for downloading regions over a network, which this
  feature forbids anyway. A local file needs no pack.

MBTiles also works, with one Android wrinkle:

- Maintainer example in discussion `#591`: bundle the file with `expo-asset` (Metro config needs
  `config.resolver.assetExts.push("mbtiles")`), then use
  `assets[0].localUri.replace("file://", "mbtiles://")` as the source URL inside an inline style JSON
  (`https://github.com/maplibre/maplibre-react-native/discussions/591`). The same discussion has a
  second user confirming raster MBTiles via `tileUrlTemplates={["mbtiles:///" + path]}`.
- The Android wrinkle, from maplibre-compose discussion `#745` (2026-02-21): "you can't point
  `mbtiles://` directly at your APK assets folder on Android. You need to copy the file to internal
  storage first, then use `mbtiles:///absolute/path`". So an MBTiles file must be copied out of assets
  at first run, or shipped via `expo-asset` which already lands it in a real filesystem location.
  PMTiles with `pmtiles://asset://` does read APK assets directly, which makes PMTiles the lower-friction
  archive format on Android.
- iOS `mbtiles://` works: maplibre-native issue `#1366` shows a complete local style with
  `mbtiles:///...` sources and `file://` sprites and glyphs on iOS (the issue was a rendering bug,
  since closed, not a missing scheme).

### 1.6 Bundling sprites and glyphs locally

A MapLibre style normally points `sprite` and `glyphs` at remote URLs. Both can be local:

- `file://` absolute paths work in style JSON for sprites and glyphs. Verified by the working local
  style in maplibre-native `#1366` (`"sprite": "file:///.../sprites/basic-v8"`,
  `"glyphs": "file:///.../glyphs/{fontstack}/{range}.pbf"`) and by the maintainer example in
  discussion `#591`, whose inline style needs no sprite at all for fill and line layers.
- On Android, `asset://` URLs reach APK assets; there is one open quirk on iOS: maplibre-native `#3196`
  (open, iOS 6.11.0) reports console errors when `asset://` glyphs resolve, though the map still loads.
  The safe form is `file://` paths into the app container, which `expo-asset` provides for any bundled
  file.
- The cheapest path of all: a qibla map does not need symbol layers or text labels. A style of
  background, line and fill layers, which is what streets and buildings are, references no sprite and
  no glyphs. Protomaps' own basemap needs glyphs only for place labels, and those can be dropped from
  the style.

### 1.7 The one open conflict that touches THIS repo

Issue `#1650` (open, filed 2026-09-08, reconfirmed by a second user 2026-09-25):
`MapLibreReactNative.podspec`'s `$MLRN.post_install` walks every aggregate target in the Podfile and
adds the MapLibre SPM dependency to every `user_target`, with no check that the target depends on
MapLibre. In an app with a second native target, a WidgetKit extension crashes at launch with
`Library not loaded: @rpath/MapLibre.framework/MapLibre`, because nothing embeds the framework in the
extension. The issue text names WidgetKit specifically: the crash happens before the extension reports
its widget kinds, so widgets vanish from the gallery with no build error
(`https://github.com/maplibre/maplibre-react-native/issues/1650`).

This repo ships `expo-widgets` with an iOS WidgetKit extension, so this is a direct hit. Whether it
fires depends on whether the expo-generated Podfile gives the widget target its own CocoaPods
aggregate target. UNVERIFIED, and it must be checked on the first prebuild with the plugin enabled.
The mitigation is already in the repo's toolset: `patch-package` is installed and running
(`package.json` `postinstall`), and the fix is a one-clause filter in the podspec's `post_install` loop
to skip targets that do not link `MapLibreReactNative`. The upstream thread has the maintainer's "happy
to review a PR", so a local patch is also an upstreamable fix. The sibling report confirms this risk
and cites `ios/Podfile:29,75` as the two-target shape.

## 2. Native binary size of MapLibre GL Native, for the record

All numbers measured on 2026-09-30 with `curl` and `unzip -l` on the exact artifacts the wrapper pins.
Maven Central artifact: `org.maplibre.gl:android-sdk-opengl:13.6.1` (from
`package/android/gradle.properties` on tag `v11.4.0`).

### Android, per ABI

Downloaded `https://repo1.maven.org/maven2/org/maplibre/gl/android-sdk-opengl/13.6.1/android-sdk-opengl-13.6.1.aar`
(15,598,638 bytes, 14.87 MiB, `content-length` via `curl -sI`). The AAR is unified: per-ABI splits do
not exist on Maven for 13.x (404 on `...-13.6.1-${abi}.aar` for all four ABIs). The `.so` files inside:

| ABI | `libmaplibre.so` bytes | MiB |
| --- | --- | --- |
| arm64-v8a | 10,846,016 | 10.35 |
| armeabi-v7a | 7,917,088 | 7.55 |
| x86 | 10,994,720 | 10.49 |
| x86_64 | 11,207,424 | 10.69 |
| all four | 40,965,248 | 39.07 |

Source: `unzip -l` on the downloaded AAR, run 2026-09-30. This app's baseline APK holds
`lib/arm64-v8a` at a single ABI (`BRIEF.md` section 2), so the APK addition is the arm64-v8a row:
10.35 MiB of native library on top of the 67 MB baseline, before any tile data.

Companion artifacts, all measured: `android-plugin-annotation-v9:3.0.2` AAR is 84,117 bytes
(classes only, no `.so`), `android-plugin-scalebar-v9:3.0.2` is 18,073 bytes,
`android-sdk-turf:6.0.1` jar is 27,945 bytes. The JS package unpacks to 2.14 MB
(`npm view @maplibre/maplibre-react-native@11.4.0 dist.unpackedSize`, 2,135,633 bytes), of which the
bundled native sources are the bulk.

### iOS, per slice

The podspec consumes the dynamic XCFramework via SPM. From the release
`https://api.github.com/repos/maplibre/maplibre-native/releases/tags/ios-v6.31.0` (published
2026-09-11):

| Artifact | Bytes | MiB |
| --- | --- | --- |
| `MapLibre.dynamic.xcframework.zip` (what the podspec fetches) | 10,312,052 | 9.83 |
| `ios-arm64/MapLibre.framework/MapLibre` (device binary, uncompressed) | 7,823,648 | 7.46 |
| `ios-arm64_x86_64-simulator/.../MapLibre` (simulator slice, uncompressed) | 16,141,080 | 15.39 |
| `MapLibre.static.xcframework.zip` (not used by the podspec) | 404,362,189 | 385.6 |
| `MapLibre_ios_device.framework.dSYM.zip` (debug symbols, not shipped) | 47,464,736 | 45.3 |

Source: release asset sizes from the GitHub API, and `unzip -l` on the downloaded dynamic zip
(run 2026-09-30). The App Store slice is the 7.46 MiB device binary plus framework resources
(`Assets.car` 198,632 bytes and headers).

### Android release AARs for the record, from the same native release

`https://api.github.com/repos/maplibre/maplibre-native/releases/tags/android-v13.6.1`:
opengl release AAR 15.6 MB (the Maven artifact above), vulkan release 17.6 MB, multiBackend release
31.6 MB. The wrapper defaults to the opengl variant (`nativeVariant=opengl` in `gradle.properties`),
which is also the smaller one, and the one with the longer support tail on old GPUs.

## 3. Alternatives

### 3.1 MapLibre GL JS inside a WebView (dug hard, per the brief)

**The vehicle already ships.** `@expo/dom-webview@~58.0.1` is in `package.json` and is an Expo native
module: `expo-module.config.json` declares `DomWebViewModule` for apple and
`expo.modules.webview.DomWebViewModule` for android, with a prebuilt AAR in `local-maven-repo`
(read from `node_modules/@expo/dom-webview/`). It is not a thin JS shim over something else; it is a
Kotlin `DomWebView.kt` wrapping Android `WebView` and a Swift `DomWebView.swift` wrapping `WKWebView`.
Using it for a map adds ZERO native code to this app's build. Expo SDK 58 also pins
`react-native-webview@14.0.1` in `bundledNativeModules.json`, so that route is equally sanctioned;
`react-native-webview` develops against RN 0.86 / React 19.2.7 (repo root `package.json` devDeps on
master), removed legacy-arch support in v16 (2026-07-11 release notes) and has no open issue mentioning
0.88. Either works; `@expo/dom-webview` is already paid for.

**Local file access is wired in, explicitly.** On Android, `DomWebView.kt` lines 199 to 200:
`settings.allowFileAccess = true` and `settings.allowFileAccessFromFileURLs = true`, with the comment
"API 30+ default disables file access; DOM bundles need it for sibling assets". On iOS,
`DomWebView.swift` line 185: `webView?.loadFileURL(url, allowingReadAccessTo: URL(fileURLWithPath: "/"))`
with the comment "Grant read access to the bundle so DOM components can load sibling assets". The
TypeScript types document the intent: "they're enabled implicitly so DOM bundles served from `file://`
work without configuration" (`src/DomWebView.types.ts`, `UnsupportedWebViewProps`). So a bundled HTML
file with sibling JS can load and read sibling files on both platforms out of the box.

**The map library must be v5, not v6. This is the load-bearing finding.**

- MapLibre GL JS v6 moved its worker to an ESM module loaded as a real URL, and dropped v5's
  CSP-friendly blob worker on purpose. From the maintainer-confirmed discussion `#8225`
  ("Help bundling v6 for local use (double-click & open)? (worker issue)",
  `https://github.com/maplibre/maplibre-gl-js/discussions/8225`): a user gets
  `SecurityError: Failed to construct 'Worker': Script at 'file://...' cannot be accessed from origin
  'null'`; the blob workaround then fails with "Refused to cross-origin redirects of the top-level
  worker script"; a second commenter who dug into the v6 architecture states "the old CSP-friendly
  bundle from v5 (the one that let everything run through blob: with worker-src blob:) was dropped on
  purpose" and "constructing a Worker from a `file://` origin (origin "null") is blocked by chromium
  regardless of bundler setup". A `file://` page cannot run v6.
- v5 does it the way a WebView needs. Verified in the actual shipped artifact: I downloaded
  `https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.0/dist/maplibre-gl.js` (1,056,837 bytes) and read the
  bootstrap, which contains verbatim:
  `maplibregl.setWorkerUrl(window.URL.createObjectURL(new Blob([workerBundleString], { type: 'text/javascript' })))`.
  The worker ships as a string inside the bundle and is instantiated from a `blob:` URL. Blob URLs are
  same-origin with the page that created them, so the worker starts fine from a `file://` page. v5's
  latest is `5.24.0` (`npm view maplibre-gl@5 version`).
- Version pin to record: `maplibre-gl@^5.24.0`, never v6, for any `file://` WebView use.
- Sibling-report disagreement, named: the sibling report (`R2-renderer-and-size.md` section 3.2) cites
  maplibre-gl-js issue `#8157` as evidence that maplibre-gl newer than 5.22 does not render on an
  Android 10 WebView (Chromium 88) and pins 5.22 accordingly, and issue `#8461` for iOS killing
  backgrounded workers. I did not fetch those two issues (rate limits; their conclusion is compatible
  with mine: an old WebView caps the library version). The combined safe pin is therefore
  `maplibre-gl@5.22.x`, the older of the two ceilings. An app built on a year-old library line is a
  real maintenance cost, and the plan must record it.

**Reading a local PMTiles in the WebView: what blocks it and what does not.**

- `fetch()` and XHR against `file://` URLs are blocked in modern WebViews (Chromium blocks file
  fetches; WKWebView gives origin `null`). So the JS `pmtiles` library's `FetchSource`, which sends
  HTTP `Range` requests, cannot read a local file directly. That is the CORS and range-request blocker,
  named.
- It is bypassed by not fetching at all. The `pmtiles` JS package (4.5.0, 380 KB unpacked, single
  dependency `fflate`, `npm view pmtiles@4.5.0`) exposes `FileSource`, whose `getBytes` is
  `this.file.slice(offset, offset + length).arrayBuffer()`
  (`https://raw.githubusercontent.com/protomaps/pmtiles/main/js/src/index.ts`, `FileSource` class). A
  `Blob` has the same `.slice().arrayBuffer()` API as a `File`, so a Blob-backed source is the same
  three lines. The flow: RN reads the bundled `.pmtiles` bytes, passes them to the WebView once
  (base64 through `injectedJavaScriptObject` or `postMessage`), the page decodes to an `ArrayBuffer`,
  wraps it in a `Blob`, and hands the wrapper a Blob source. A city-scale archive is around 10 MB
  (PMTiles discussion `#594`: "a PMTiles of a city... about 10mb"), which decodes to a 13 MB string in
  base64 and fits comfortably in a one-off bridge transfer. The PMTiles maintainer's own answer in
  `#594` endorses the pattern: "Best case is you can expose a raw file via the filesystem and then
  write a small `pmtiles.Source` implementation to read ranges from it."
- One user report of the whole-file-as-Blob approach being slow: the same `#594` author says MapLibre
  "is trying to get the partial content instead of the full file, which is extremely slow". That report
  predates using a proper `Source` with `.slice()` (they passed the blob URL to MapLibre directly,
  which makes MapLibre itself issue range fetches against it). The Blob-source pattern avoids that
  entirely. UNVERIFIED on device; this is the exact thing the proof must measure.
- Glyphs and sprites in the WebView: same style spec as native. Relative URLs resolve against the
  page's base URL, so sibling `assets/glyphs/{fontstack}/{range}.pbf` files load through the granted
  file read access. Or drop labels and need neither, as in 1.6.

**Real performance on an A12 and an SD820: no published number exists.** I searched for any
measurement of MapLibre GL JS in a system WebView on those chips and found none; every "maplibre in
react-native webview" thread is about wiring, not frame rates (Reddit r/reactnative thread
"Anyone got fully offline vector maps working in React Native?" 2026-07, the PMTiles discussions, and
the maplibre-gl-js discussion above). What is known: the SD820's Adreno 530 supports GLES 3.1 and
WebGL 1; Android WebView exposes WebGL when the view is hardware-accelerated, which is the default for
API 14+ (developer.android.com, "Hardware acceleration"); the A12's WKWebView supports WebGL 1 and 2.
MapLibre GL JS v5 targets browsers back to Safari 11 and Chrome 60 era, so API 28's WebView is within
its support matrix. Whether it holds 30fps while panning a vector map on an 8-year-old GPU is the
single largest unverified performance claim in this report, and only a device build answers it
(`e2e/scripts/frame-audit.sh` exists for exactly this).

**Effort estimate.** A proof is: bundle one HTML file with `maplibre-gl@5.22` and `pmtiles` inlined (the
dev machine can run esbuild once; no runtime build), bundle a London PMTiles, pass it across the
bridge, render. No native code, no prebuild, no key, no network. The moving parts are all JS.

### 3.2 `react-native-maps`

- Version 1.29.11, peers `react >= 18.3.1`, `react-native >= 0.76.0` (`npm view react-native-maps
  peerDependencies`), so 0.88 is in range, and Expo SDK 58 pins 1.29.0 in `bundledNativeModules.json`.
- Apple Maps on iOS needs no key: "The native Apple Maps based implementation works out-of-the-box"
  (`https://raw.githubusercontent.com/react-native-maps/react-native-maps/master/docs/installation.md`).
- Google on Android does: "one has to use Google Maps, which in turn requires you to obtain an API key
  for the Android SDK", plus the billing-account warning in the same document. The config plugin takes
  `androidGoogleMapsApiKey` for exactly this.
- Offline is effectively absent. The README's local-tiles section says: "For Android: LocalTile is
  still just overlay over original map tiles. It means that if device is online, underlying tiles will
  be still downloaded" and suggests `mapType` to `none` as the workaround, which leaves you drawing
  your own tiles over a blank Google view that still expects a key. Apple Maps on iOS has no offline
  tile API at all.
- Verdict: fails the no-key rule on Android and the offline rule on iOS. Clean elimination, recorded.

### 3.3 Vector geometry with `react-native-svg` (already installed)

- Zero new native code. `react-native-svg@15.15.5` is in `package.json` and renders under Fabric today
  (the qibla dial and the Masjid icon both use it).
- Drawing a simplified street network from local GeoJSON is feasible with the exact architecture
  session 37 proved: a memoised static tree, recorded once, with any motion applied as a transform on
  the layer above. `components/qibla/Dial.tsx:42` memoises `Face` for this documented reason:
  "react-native-svg re-walks its whole drawing pipeline on any attribute change, measured at 40 to
  56ms for 30 paths on the floor device".
- MVT decoding in JS is real and Hermes-clean. The packages: `@mapbox/vector-tile@3.0.0` (17.6 KB
  unpacked; deps `@mapbox/point-geometry ~1.1.0`, `pbf ^5.0.0`, `@types/geojson`) and `pbf@5.1.2`
  (90 KB unpacked). Read from source via `opensrc`:
  - `VectorTile` takes a `PbfReader` directly: `new VectorTile(pbf, end)` where `pbf` wraps a
    `Uint8Array` (`index.js` of vector-tile-js 3.0.0, class `VectorTile`).
  - `pbf`'s runtime `index.js` has no `fs`, no `node:` imports, no `process`; it operates on
    `ArrayBuffer`/`Uint8Array` and inlines a feross-derived UTF-8 reader for long strings. The
    `resolve-protobuf-schema` dependency and the `fs` import live only in `compile.js`, the CLI
    code-generation step, which never ships to a device.
  - So both run in Hermes with no Node builtins. Verified from source, not from docs.
- gzip: MVT tiles inside MBTiles and PMTiles are gzip-compressed. Hermes has no
  `DecompressionStream` (that is a web-platform streaming API; no evidence of it in Hermes, and no RN
  changelog claim found). The clean answer is `fflate@0.8.3` (796 KB unpacked, zero dependencies,
  pure JS, `npm view fflate`): `ungzipSync(uint8Array)` on each tile's bytes. This is the same
  library `pmtiles` itself depends on.
- Reading the PMTiles container in RN-side JS: the `pmtiles` npm package's sources are
  `FetchSource` (uses `fetch`, absent in RN) and `FileSource` (uses the browser `File` API, absent in
  RN), so the package does not run unmodified in Hermes. The PMTiles v3 format is small enough to
  parse by hand (127-byte header, then a rooted directory of offsets and lengths), or the whole file
  can be read into JS via `expo-file-system` and handed to the WebView path instead. UNVERIFIED how
  much of `pmtiles` runs in Hermes unmodified; the honest statement is: decode MVT with
  `@mapbox/vector-tile` + `pbf` + `fflate` (all verified Hermes-clean), and parse the PMTiles
  directory yourself or reuse the page-side approach of 3.1.
- The cheapest variant needs no decoder at all: extract and simplify the street network on the dev
  machine (osmium or similar), ship a JSON of polylines, draw them. The no-network rule binds the
  phone, not the build pipeline; the repo already treats downloaded-once assets (audio, 32 athans plus
  66 reminders) as bundled bytes.

### 3.4 `@shopify/react-native-skia`

- Version 2.13.1, released 2026-09-29 (npm and GitHub releases). Peers: `react >=19.0`,
  `react-native >=0.78`, `react-native-worklets >=0.7.0`, `react-native-reanimated >=4.0.0`
  (`https://raw.githubusercontent.com/Shopify/react-native-skia/main/packages/skia/package.json`).
  This repo satisfies all four today: React 19.3.0, RN 0.88.0-rc.2, worklets 0.13.0, reanimated 4.7.0.
  Expo SDK 58 pins 2.11.2 (`bundledNativeModules.json`), so `npx expo install` lands a slightly older
  but SDK-blessed line.
- Fabric: yes, `codegenConfig` name `rnskia`, type `all`, with `SkiaPictureView` as the iOS component
  provider (same package.json). The example app runs RN 0.83.1 / React 19.0.0
  (`apps/example/package.json`), and releases are frequent (2.13.1 on 2026-09-29, 2.13.0 on 09-24,
  2.12.0 on 09-16).
- Drawing tiles and geometry: Skia draws `Path` objects on a GPU canvas and has a `Picture` API that
  records once and replays, which is the same architecture insight the dial already uses, with a much
  faster rasteriser than react-native-svg. A street network of hundreds of paths is well within its
  normal workload. No published floor-device measurement for this exact scene exists; UNVERIFIED, but
  the failure mode is absent: Skia's whole purpose is path-heavy GPU drawing.
- Cost, for the record: 10.25 MB npm unpacked (`npm view @shopify/react-native-skia@2.13.1
  dist.unpackedSize`, 10,252,531 bytes), plus prebuilt Skia native libraries. The sibling report
  link-measured `libskia.so` at 8.76 MB arm64 stripped and 34.1 MB across four ABIs, which puts Skia
  in the same weight band as the full MapLibre engine while buying no tile decoding. That measured
  parity is what keeps it below the zero-native options in the ranking, not the megabytes themselves
  (size is deferred): it solves a problem the svg record-once architecture may already solve for free.
- The honest cost is integration: a new native dependency on an RC stack this repo has never shipped,
  against an alternative (`react-native-svg`) that is already installed.

### 3.5 `expo-maps`

- Exists in SDK 58: `expo-maps@58.0.3` on the `next` dist-tag (`npm view expo-maps dist-tags`),
  `58.0.2` pinned in `expo/bundledNativeModules.json`. It wraps Google Maps on Android
  (`com.google.maps.android:maps-compose:6.10.0` in `packages/expo-maps/android/build.gradle`) and
  Apple Maps on iOS (`https://docs.expo.dev/versions/unversioned/sdk/maps/`).
- Google key on Android: the docs walk through Google Cloud project creation, Maps SDK for Android
  enablement, SHA-1 fingerprint, and `android.config.googleMaps.apiKey` in app.json. Fails the no-key
  rule.
- Offline: the word "offline" appears zero times in the entire SDK documentation page for expo-maps
  (counted over the fetched page text, 2026-09-30). There is no offline API.
- Deployment target: the package README on main says "Requires a minimum deployment target of iOS
  18.0"; the docs page says iOS 17 or later for the basics and iOS 18 for marker callbacks. This repo
  targets 16.4, so adoption would force raising it and dropping iOS 16 devices.
- Verdict: eliminated on the no-key rule (Android), the offline rule (both platforms), and a
  deployment-target conflict. Recorded.

### 3.6 Raster tiles as plain `Image` components

- Zero dependencies, today. Tiles become bundled assets, placed with absolute layout, panned and
  zoomed with `react-native-gesture-handler` transforms over them.
- Performance is the strongest of all candidates: images are decoded once into textures and moved by
  compositor transforms, the same class of work as any ScrollView. Nothing here re-records on the JS
  thread per frame. The 30fps floor is met by construction for a static or transform-animated view.
  One caveat, UNVERIFIED: no measurement exists of 20+ simultaneously mounted tile images on the 3T;
  the decode cost at first mount wants a frame-audit check like everything else.
- The qibla line still needs drawing, which `react-native-svg` does on top as a handful of paths.
- The ceiling is content, not rendering. Raster tiles are fixed-resolution: a z14 London tile is
  256px, and the app is London-only (a stated non-goal is multi-city), so the tile set is bounded.
  Zooming past the bundled range goes soft or blank. Bytes are R1's domain; the record here is that
  the rendering side has no known failure mode.
- Effort: lowest of all for one fixed zoom, which may be all the qibla use needs (the user aligns a
  line against their own street; one good zoom is arguably the product). Medium if multiple zoom
  levels with tile swapping are wanted.

## 4. Verdict table

At the top of this report, per the brief's format requirement. One addition the table cannot carry:
the two eliminations (`react-native-maps`, `expo-maps`) are eliminated on hard rules, not on effort or
size.

## 5. The Performance Design Rules, applied

Rules referenced from `ai/AGENTS.md` section 4 "Performance Design Rules" (device-verified on the 3T,
ADR-013). The measured fact: `components/ui/Masjid.tsx` costs 40 to 56 ms per record for 30 paths on
the SD820, which is 1.33 to 1.87 ms per path
(`ai/plans/37-qibla-compass/RESEARCH.md:387`).

### 5.1 The arithmetic

Paths per frame at the 30fps floor (rule 1, 33 ms frame budget):

- Worst case: 33 / 1.87 = 17.6 paths
- Best case: 33 / 1.33 = 24.8 paths

So 17 to 24 paths per 33 ms frame, if the tree re-records every frame. At 60fps (16.67 ms): 8.9 to
12.5 paths. Session 37's own table agrees: 8 paths is 10.7 to 14.9 ms (fits a 60fps frame), 12 paths
is 16.0 to 22.4 ms (already over), 32 paths is 42.7 to 59.7 ms, 72 paths is 96 to 134 ms
(`RESEARCH.md`, the ornament budget table). The dial's 84 elements at one-off record cost 117 to
165 ms (`ai/AGENTS.md`, the 2026-09-29 entry), which is 7 to 10 frames paid once.

### 5.2 The one-off versus per-frame distinction, and why it reorders the ranking

Rule 1 binds ANIMATIONS: "30fps floor for big animations... frame gaps <=33ms". A qibla map that
draws once and then sits still, or moves only by a transform on a recorded layer, pays its path cost
ONCE, at mount, off the animation clock. The dial is the proof: 84 elements that would cost 117 to
165 ms per re-record measured a median frame gap of 16.7 ms with 89% of gaps at 60fps, because the
tree never re-records; a Reanimated transform on the layer above does all the motion
(`ai/AGENTS.md`, session 37 entry; `components/qibla/Dial.tsx:121` documents the pattern:
"a transform on one recorded layer, which is a compositor matrix multiply rather than a redraw").

Consequences per candidate:

- **`react-native-svg`**: a street network of, illustratively, 100 paths costs 133 to 187 ms once at
  mount; 300 paths cost 399 to 561 ms once; 1000 paths cost 1.33 to 1.87 s once. Every one of those
  is acceptable for a surface the user opens and studies (rule 4's Overlay pattern: pre-mount, keep
  hidden, reveal). None is acceptable per frame. The design rule that follows is the dial's: the map
  face is memoised on its inputs, and any motion (a rotate-to-north nudge, a scroll) is a transform on
  the layer, never a prop change inside the tree. Rule 2 (static-in-render) and rule 6 (never animate
  Yoga layout per frame) both point the same way. The count of paths in a London extract is
  build-time measurable with osmium and is R1-adjacent; the per-path cost is the verified number here.
- **MapLibre Native**: renders in its own GL view off the RN tree. The RN cost is one host view; the
  render loop is MapLibre's own, GPU-driven, the same class as any game view. Rule 1 applies to its
  internal frame rate, which native GL maps handle on SD820-class GPUs routinely (OpenGL ES 3.0 era
  hardware was MapLibre's original target). The one 3T-specific note: `preferredFramesPerSecond`
  exists as a Map prop on both platforms (docs, section 1 source), so the floor can be pinned at 30
  deliberately.
- **WebView MapLibre GL JS**: same logic, one native view, render loop inside the WebView process.
  The risk is not the RN tree, it is WebGL throughput on the Adreno 530 and the A12, which is
  UNVERIFIED (3.1). Rule 8 applies with full force: any smoothness claim needs frame evidence, and
  `e2e/scripts/frame-audit.sh` with the multiple-of-vsync check (session 37's durable lesson) is the
  instrument.
- **Skia**: GPU rasterisation with a record-once Picture API. Path cost per frame is not the
  react-native-svg cost; it is Skia's, which is what Skia exists to make fast. UNVERIFIED on the 3T
  for this scene.
- **Raster `Image`s**: compositor work only. Rule 1 is met by construction, with the 20-image decode
  caveat above.

Rule 7 (gate invisible work) applies to whichever surface wins: the map must not tick or subscribe
while hidden. Rule 12 (state-merging) applies if the map view replaces or sits beside the dial.

### 5.3 What changes the ranking

The static-map insight is why `react-native-svg` ranks first despite the ugliest per-path number of
the drawing candidates: its cost is one-off, its architecture is already proven on the floor device,
and its per-frame cost after record is a matrix multiply. The per-path arithmetic only kills it if the
design animates the tree's contents per frame, which the dial pattern already forbids. The honest cap,
which section 6 records: mount-time cost is paid on the JS thread on the floor device, so thousands of
paths mean seconds of frozen UI at open. The svg path is "simplified network, hundreds of paths", not
"full map".

## 6. The decisive question: ranking by time-to-working

Ranked by "how quickly could this be got working at all", fastest first:

1. **`react-native-svg` with a pre-extracted, dev-machine-simplified GeoJSON street network.** Hours.
   No new packages at all for the first proof (extract polylines on the mac, bundle JSON, draw Paths,
   memoise, transform for motion). The decoder stack (`@mapbox/vector-tile` + `pbf` + `fflate`, about
   110 KB of pure JS, all verified Node-free in 3.3) is only needed once the proof graduates to
   shipping PMTiles. Everything it needs is installed and proven on the floor device today.
2. **Raster tiles as `Image`s, with an svg qibla line on top.** Also hours, and content-rich if R1's
   tile pipeline produces a small London set. Zero packages. Its ceiling is fixed resolution.
3. **MapLibre GL JS v5.22 inside `@expo/dom-webview`.** A day or two. Zero new native code; the
   vehicle is compiled into the app already. The two hard parts are solved in source: v5's blob worker
   (verified in the dist artifact, 3.1) and the Blob-backed PMTiles source (the maintainer-endorsed
   pattern). The open parts are floor-device WebGL performance and the old-WebView version ceiling
   both UNVERIFIED, only a build answers them.
4. **`@maplibre/maplibre-react-native@11.4.0`.** Days. Peer range admits the stack, Fabric is done,
   the config plugin survives prebuild (proven by `#1623`'s resolution), local PMTiles and MBTiles are
   maintainer-verified on both platforms. Two named risks: nobody upstream builds against RN 0.88 yet
   (their examples sit at 0.83 and 0.85), and open issue `#1650` adds the MapLibre SPM dependency to
   every Podfile target, which crashes WidgetKit extensions and this repo ships one. Both are
   testable on the first prebuild; the second has a patch-package mitigation.
5. **`@shopify/react-native-skia`.** Days. All peers satisfied, but it is a new native dependency on
   an RC stack, and it solves a problem (fast path drawing) that the svg record-once architecture may
   already solve well enough for a static picture.
6. **`react-native-maps` and `expo-maps`.** Eliminated on hard rules: Google key on Android, no
   offline, and (expo-maps) a deployment-target conflict with 16.4.

**The one to build first: the `react-native-svg` proof.** Reasons, in order:

- It needs nothing that is not already installed. No native build, no prebuild, no new dependency
  approval, no key, no network. The only bar the brief sets is "working", and this candidate can be
  working inside one session.
- The floor-device behaviour of its exact rendering path is already measured: 1.33 to 1.87 ms per
  path, and the memoise-plus-transform pattern already proven at 84 elements with a 16.7 ms median
  frame gap. No other candidate carries this much pre-verified device evidence.
- Its failure mode is informative rather than wasteful. If a simplified street picture is not
  recognisable enough for a user to align against, that is a finding about the VISUAL (brief question
  3), and it redirects to MapLibre (native or WebView) with the geometry pipeline already built. If it
  is recognisable, the feature may be done with zero new dependencies.
- It tests the actual user job, which is aligning a drawn line to something they can see, at the
  lowest possible cost.

**Assumptions recorded** (owner unavailable, per the session's standing instruction):

- A1: `react@19.3.0` in the manifest supersedes the brief's 19.2.3. Both satisfy every peer range
  studied. Recorded, not asked.
- A2: "Works on RN 0.88" is graded as peer-range admission plus absence of known breaks. Nothing less
  than a build proves it, and this session builds nothing (planning-only, per `ASSUMPTIONS.md` A2/A3).
- A3: WebView GL performance on the 3T and XS is UNVERIFIED. No published measurement exists. The
  proof build must measure it before any smoothness claim.
- A4: The no-network rule binds the phone at runtime. The dev machine may download OSM extracts and
  render tiles at build time, exactly as it downloaded the athan audio once. This reading is what
  makes candidates 1, 2 and 3 viable at all.
- A5: Whether the expo-widgets Podfile layout triggers upstream `#1650` at all is unknown until a
  prebuild runs with the MapLibre plugin. Flagged as a first-prebuild check, not resolved here.
- A6: The safe maplibre-gl pin for the WebView is taken as 5.22.x, the more conservative of my 5.24
  ceiling (v6 worker regression) and the sibling report's 5.22 ceiling (old Chromium WebView, issue
  `#8157`). I did not fetch `#8157` myself; the pin assumes the sibling's citation is accurate.

## 7. Where this report and the sibling report differ

Both reports answered brief question 2 independently. Agreements: the MapLibre RN peer range and
Fabric status, the `#1623` prebuild fix, the `#1650` widget-extension conflict, the `#591` MBTiles
pattern, the eliminations of `react-native-maps` and `expo-maps`, and the 1.33 to 1.87 ms per path
measurement. Divergences worth the planner's attention:

| Topic | This report | Sibling (`R2-renderer-and-size.md`) |
| --- | --- | --- |
| WebView maplibre-gl pin | `5.24.0` from the v6 worker regression alone | `5.22` from issue `#8157` (old Android WebView Chromium ceiling) plus `#8461` (iOS kills backgrounded workers) |
| First-build recommendation | `react-native-svg` proof | Not ranked by time-to-working; sized focus |
| Skia weight | npm-unpacked 10.25 MB, per-ABI UNVERIFIED | Link-measured `libskia.so` 8.76 MB arm64, 34.1 MB four ABIs |
| APK cost framing | 10.35 MiB per arm64 ABI (this repo builds single-ABI) | 39.9 MB at the current four-ABI build, 18.7 MB restricted to phone ABIs |

The two are compatible on every number; the differences are coverage, not contradiction. The WebView
pin should follow the sibling's stricter 5.22 until someone fetches `#8157` and confirms the ceiling
applies to the 3T's actual WebView version, which no one has read off the device in either session.

## What I attacked in my own conclusion

- **I attacked the "svg is too slow" instinct, and it survived the attack.** The 1.33 to 1.87 ms per
  path number looks disqualifying next to a 1000-path street network. It is not, because the cost is
  one-off: the dial proves an 84-element tree records once and then transforms at 60fps on the same
  device. The per-frame arithmetic only bites if the design re-records per frame, which the
  established pattern forbids. The counter-attack that lands: mount-time cost is paid on the JS thread
  on the floor device, so 1000 paths is 1.33 to 1.87 s of frozen UI at open. That is a real product
  cost, and it caps the svg path at "simplified network, hundreds of paths", not "full map". The
  ranking survives with that cap stated.
- **I attacked the WebView ranking, and it survived with a scar.** The lowest-friction claim depends
  entirely on maplibre-gl v5, because v6 cannot construct its worker from a `file://` origin at all. I
  verified the v5 blob-worker bootstrap in the shipped dist file rather than trusting the discussion
  thread. Two scars remain: pinning v5 (or 5.22, per the sibling's stricter ceiling) means adopting a
  line the maintainers have moved off, so any future v5-only bug is mine to carry; and the performance
  risk is genuinely unmeasured, I searched for any SD820 or A12 WebView GL number and found none. It
  ranks third, not first, despite its zero-native-code advantage.
- **I attacked the MapLibre React Native elimination-by-widget-conflict, and the elimination failed.**
  Issue `#1650` crashes WidgetKit extensions, and this repo ships one, so my first draft demoted the
  candidate below Skia. Reading the issue again: it fires when the extension has its own CocoaPods
  aggregate target, and whether expo-widgets generates one is unverified. The repo also runs
  patch-package today, and the fix is a one-clause filter in the podspec. A named, patchable,
  testable-on-first-prebuild risk does not eliminate a candidate; it schedules a check. Restored to
  fourth, behind only the zero-native-code options.
- **I attacked the raster-tile option as unserious, and it refused to die.** It is the only candidate
  with no unknown on the rendering side at all: compositor images and transforms, the 30fps floor met
  by construction. Its ceiling is content, and the app is London-only, which bounds the tile set. It
  stays second, and the brief's question 3 (is a map even the right picture) may reveal that one good
  zoom is the whole product.
- **I attacked my own version ceiling and lost.** My first draft pinned the WebView library at 5.24
  from the v6 worker regression alone. The sibling report's citation of issue `#8157` (an old Android
  WebView Chromium cannot run newer maplibre-gl at all) means my ceiling was optimistic, and the safe
  pin moves down to 5.22. I did not fetch `#8157` myself, so the corrected pin carries an assumption
  label (A6) rather than a verified one. That is the one place this report's conclusion was materially
  changed by evidence I did not gather.
- **What I could not attack away:** no renderer among these has a single published frame measurement
  on the 3T or the XS for a map scene, and this session builds nothing. Every performance verdict
  above is architecture reasoning over one verified number (the Masjid per-path cost) plus the dial's
  device proof. The plan that follows this research must put a frame-audit build before any
  presentation claim.
