# Session brief: iOS widgets — finish the containerBackground fix, stuck kinds, cadence

Owner ruling 2026-09-19 (evening): investigation first, one agent, no subagents. Status: PARTIALLY
SOLVED the same evening — this brief carries the residual work.

## SOLVED (recorded so it is never re-litigated)

Root cause of "Please adopt container background API": **the widgets flag never reached the iOS JS
bundle.** Metro reads build-time flags from the repo-root `.env` (untracked), which had no
`EXPO_PUBLIC_WIDGETS` line; shell env on the xcodebuild invocation does not reach the bundle phase.
Every iOS build therefore compiled with widgets off: the app never registered layouts into the app
group, the extension found no layout, and iOS 17+ masks a non-conforming/empty widget render with
exactly that diagnostic (on SDK 57 the same empty state rendered the visible RED "No layout found"
box — the owner's historical red widgets — iOS 18 just masks it differently).

Fix applied: `EXPO_PUBLIC_WIDGETS=1` appended to the repo-root `.env` (KEEP IT THERE for any widget
build; local-only, untracked), full rebuild (`export EXPO_PUBLIC_WIDGETS=1 EXPO_PUBLIC_ENV=local
EXPO_PUBLIC_API_KEY=key` + `xcodebuild ... DEVELOPMENT_TEAM=9V3WAU9Z54 -allowProvisioningUpdates`),
reinstall, **device reboot** (the reboot may also have mattered — widget caches) → widgets render and
open the app on tap. The owner confirmed live placements working after the reboot.

Also verified in the investigation (dead ends, do not revisit): JS tree emits
`{$type:'containerBackground', ...}` correctly; the modifier registry, rgba parsing, and ExpoUI
linking in the extension are all fine; the embedded `ExpoWidgetsLayoutRegistry.json` ships empty from
npm by design (the app group is the primary source).

## Residual work (this session)

1. **Stuck kinds**: right after the fix, several placed widgets still showed the placeholder while
   three rendered (NP small light, NP small dark medium, ET small light). They appear to heal "once
   it refreshes" (the first timeline push). Verify all 10 kinds (8 home + 2 lock) push and render on
   the XS after one app launch; if some kinds never render, capture why (per-kind push failure in the
   app's pino logs, or extension evaluation error for that kind's entry).
2. **First-placement UX**: a freshly placed widget shows the placeholder until the app's next push.
   Measure how long that is with the app closed; if unacceptable, investigate WidgetKit's
   `reloadTimelines(ofKind:)` on placement (iOS calls the timeline provider on placement — the
   provider path may need the initial-props route).
3. **Update cadence** (owner expectation vs system limit): Android ticks every wall minute; iOS
   entries are stepped every 5 minutes (WidgetKit's minimum spacing) plus prayer-boundary entries,
   and re-pushes ride the app's reload budget. The owner asked for minute updates on iOS too —
   establish precisely what is possible (timeline entries cannot go below 5 min; more frequent
   `reloadTimelines` calls are budget-limited) and present the options to the owner in one table
   before changing anything.
4. **Mock data**: the owner's standing resting state (Asr next at +1 min, Fajr −3, Isha +3, every
   prayer 1 minute apart) is committed in `mocks/simple.ts` and served by `EXPO_PUBLIC_ENV=local`
   (set in `.env`). Verify the XS build shows it; do not change the offsets.

## Device + build notes

- iPhone XS, iOS 18.7, UDID `00008020-0015585C22D2002E`, paired; devicectl works for install/launch/
  processes. One Athan app only (real id `com.mugtaba.athan`, dev-signed; the store app was deleted
  at the owner's request). Simulator route also available (the interrupted sim build proved nothing;
  prefer the XS per the owner).
- Rebuild ritual: version bump in app.json FIRST, ensure `.env` carries
  `EXPO_PUBLIC_WIDGETS=1`+`EXPO_PUBLIC_ENV=local`+`EXPO_PUBLIC_API_KEY=<placeholder>`, `npx expo
  prebuild -p ios --no-install`, `(cd ios && pod install)`, xcodebuild with the same env exported +
  the team flags, install via devicectl. Reboot the phone if widget caches look stale.
- Logs on the physical device: `pymobiledevice3 syslog` needs iOS 17+ tunneling (usbmux sees
  nothing); `sudo log collect --device-name "Mugtaba's iPhone"` fails with error 6; Console.app
  manual reading works. Simulator consoles are free (`xcrun simctl spawn booted log stream`).
- Session 15b's evidence: `ai/plans/15b-android-widget-polish/` (LOG.md, AUDIT.md) and
  `~/athan-device-sweep/session15b/`.

That message is iOS 17+'s mask for a widget whose rendered view does not adopt
`containerBackground(for: .widget)`: an empty render, an error render, or a render that drops the
modifier all show it. In the GALLERY it appears in place of the preview.

## Everything already verified working (session 15b, do not re-litigate)

Verified from the installed sources (expo-widgets 58.0.3, @expo/ui 58.0.3, expo-modules-core SDK 58):

1. `widgets/PrayerWidget.tsx` calls `containerBackground(palette.card, 'widget')` on every iOS return
   path (main small, medium, StaleCard, NeutralCard). Renderer suites pin the palette and structure.
2. `@expo/ui`'s `createModifier` emits `{ $type: 'containerBackground', style: {type:'color', color:
   'rgba(...)'}, container: 'widget' }` — the JS tree is correct by construction.
3. `@expo/ui/ios/Modifiers/ViewModifierRegistry.swift:2408` registers `containerBackground`;
   `ContainerBackgroundModifier.swift` applies SwiftUI `.containerBackground(shapeStyle, for:)` on
   iOS 17+.
4. `ExpoWidgets.podspec` depends on `ExpoUI`, so the registry IS linked into the extension target.
5. `expo-modules-core`'s UIColor converter parses `rgba(r, g, b, a)` WITH spaces
   (`rgbCommaRegex ?? rgbSpaceRegex`) — our palette strings parse.
6. `EntryView.swift`: when NO layout is found it renders a red box "No layout found for
   <appGroup>::<name>" — NOT the Apple placeholder. So the extension likely FOUND a layout and the
   render still produced no background (or the gallery masks the red box too — check on simulator).
7. `WidgetsViewRenderer.render()` catches ANY prop-conversion throw and returns `EmptyView()` — an
   EmptyView root = exactly the Apple diagnostic. A prop the extension's props classes cannot parse
   anywhere in the ROOT view's props/modifiers is therefore a prime suspect.

## Theories tested and DEAD

- **Build flag died at the bundle phase** (plausible: prebuild had `EXPO_PUBLIC_WIDGETS=1` but the
  first xcodebuild ran without it): REBUILT with `export EXPO_PUBLIC_WIDGETS=1 EXPO_PUBLIC_ENV=local
  EXPO_PUBLIC_API_KEY=key` on the xcodebuild invocation itself (DerivedData Build wiped first, build
  SUCCEEDED, reinstalled, app relaunched) — **widgets still show the placeholder**. The flag may STILL
  be the problem if Metro caches or the `.env` interferes — the rebuild proves env-passing alone did
  not fix it, not that the flag was on. VERIFY the flag actually landed in the bundle (runtime
  behaviour: the app logs `APP: feature flags resolved` via pino at launch).
- **The extension uses a build-time registry that was empty**: `ExpoWidgetsLayoutRegistry.json` inside
  the extension (`ExpoWidgets.bundle/`) is `{"widgets": {}}` as shipped from npm (the pods script
  "Prepare ExpoWidgets Resources" just copies `node_modules/expo-widgets/bundle/build/...`). BUT
  `WidgetsLayoutRegistry.layout(for:)` checks the APP GROUP first
  (`__expo_widgets_<name>_layout` written at runtime by `createWidget`'s `Widget` constructor), the
  embedded registry is only the fallback. Unknown: whether the app-side write ever happened on device.
- **rgba color parsing** — verified fine (see 5 above).

## Reference appendix (from the evening investigation)

- Physical XS is paired (devicectl works: install/launch/processes all fine). `pymobiledevice3
  syslog` fails ("usbmux has no device") because iOS 17+ needs `pymobiledevice3 remote start-tunnel`
  (sudo). `sudo log collect --device-name "Mugtaba's iPhone"` fails with "device not configured" (6).
  Console.app manual reading works but the owner transcribes — prefer the simulator.
- The current dev build on the XS: mock data, real bundle id, group `group.com.mugtaba.athan` pinned
  in app.json (`groupIdentifier`), app icon/name normal. The store app was deleted at the owner's
  request; the phone holds exactly one Athan app.
- Rebuild ritual: version bump in app.json FIRST, `npx expo prebuild -p ios --no-install` with
  `EXPO_PUBLIC_WIDGETS=1 EXPO_PUBLIC_ENV=local EXPO_PUBLIC_API_KEY=key`, `(cd ios && pod install)`,
  xcodebuild with the SAME env exported + `DEVELOPMENT_TEAM=9V3WAU9Z54 -allowProvisioningUpdates`,
  install via `xcrun devicectl device install app --device 00008020-0015585C22D2002E <app>`.
