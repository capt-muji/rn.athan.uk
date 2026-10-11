# Device atlas: iPhone XS (`IPHONE_UDID`)

| Field | Value |
| --- | --- |
| Model | iPhone XS (iPhone11,2), iOS 18.7.10, physical, resolved via `xcrun devicectl list devices` |
| Screen | 375 x 812 pt (1125 x 2436 px @3x), notch |
| Signing | paid team profile pair cached locally (`com.mugtaba.athan`, `com.mugtaba.athan.ExpoWidgetsTarget`, valid to 2027); Xcode holds no live account session, so builds pass the team inline (`DEVELOPMENT_TEAM`), never committed |
| Driver | `agent-device` CLI with the iOS runner prepared (`AGENT_DEVICE_IOS_TEAM_ID=<paid team> agent-device prepare ios-runner --udid $IPHONE_UDID`; the MCP server lacks the team env; the runner installs two apps on the phone, uninstall both afterwards); screenshots via `pymobiledevice3 developer dvt screenshot --udid $IPHONE_UDID`; install/launch via `xcrun devicectl device ... --device $IPHONE_UDID`; screen reads go through the `vision` subagent |

## Coordinates and routes (measured once, replayed)

| Target | Route | Coordinate / selector |
| --- | --- | --- |
| Settings root search | Settings > search field | top of root list, ref-based tap preferred |
| Language & Region | Settings > General > Language & Region | cell by label (below Keyboard, above TV Provider) |
| Preferred language list | Language & Region > (language cell) | cell by label |
| App settings | Settings > Apps > Athan | cell by label under the A index (iOS 18 nests per-app pages under Apps) |
| App Location | Settings > Apps > Athan > Location | cell by label |
| Home screen grid | home | icons 180 px, pitch 261 px (60/87 pt), first row starts y 183 px; 4 columns measured |
| Device build | repo checkout -> prebuild -> Release run:ios | `EXPO_PUBLIC_IOS_WIDGETS=1 prebuild`, plist check, `DEVELOPMENT_TEAM=<paid team> run:ios --configuration Release --device $IPHONE_UDID`; job 39 step 14's stop notes carry the full sequence |
| Device build-only | xcodebuild direct | `expo run:ios --device generic --output` yields a SIMULATOR binary; for a device artifact run `xcodebuild -workspace ios/Athan.xcworkspace -scheme Athan -configuration Release -destination 'generic/platform=iOS' -allowProvisioningUpdates CODE_SIGN_STYLE=Automatic DEVELOPMENT_TEAM=<paid team> build`, then `devicectl device install app` |
| Language change | Settings > عام > اللغة والمنطقة | iOS 18.7: no iPhone-Language row; tap the current language row or إضافة لغة… > search > pick > confirm primary; the picker's Cancel and search field sit mirrored in RTL |
| Leave an app | terminate or app-switcher | `home` and bottom-edge swapes do not reliably work; terminate the app via devicectl, or `app-switcher` then tap clear wallpaper beside the cards |
| Traps | system alerts swallow every tap; the XS never auto-locks while tethered; synthesized long-presses on wallpaper never opened edit mode before the alert trap closed; snapshots wedge on any animated screen (the countdown, a live map) - screenshots are the reliable read |

Measured during job 39 step 14 (2026-10-11). Update this table when a route moves.
