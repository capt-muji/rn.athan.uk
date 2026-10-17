# Upstream: the patches we carry and the PRs that would remove them

One row per patch under `patches/`. A patch leaves when a published package carries the change.
At every re-pin each patch is rebuilt against the new version and proven on a phone, never by a
green build alone. Measured 2026-10-08 against the installed pins; the detail lives in
`ai/plans/54-patches-and-copy/FINDINGS.md`. PR states updated 2026-10-09 after the owner's
sweep: #50581 rebased and revived, #51290, #51291 and #51292 opened. Patch versions and PR
states re-recorded 2026-10-17 at the SDK 58 stable re-pin (row 111): all three PRs re-checked
open and unmerged that day; every patch was regenerated whole at its new package version with
no hand-merged hunk.

| Patch | Changes | iOS depends today | Android depends today | Upstream |
| --- | --- | --- | --- | --- |
| `expo-background-task+58.0.11` | Adds `requiresNetworkConnectivity` to `BackgroundTaskOptions`, default `true`; the app registers with `false` (`stores/notifications.ts`) so the notification refresh runs offline. The regenerated patch dropped the dead `didRegisterTaskForTesting` symbol | Yes | Yes | PR `expo/expo#50581`, open and unmerged (re-checked 2026-10-17). Issue #48122 carries a `needs review` label. Competing draft `expo/expo#48469` stalled since 2026-08-04. Published builds to 58.0.11 still hardcode both constraints |
| `expo-widgets+58.0.20` | TWO features. (1) `openApp` on the Android widget `Button`, so a tap opens the app; every Android card state wraps itself in it (`widgets/PrayerWidget.tsx`). (2) A local-only device-locale injection (`__expoWidgetDeviceLocale`) feeding the neutral, stale and catch faces (the D44/D79 device-keyed statics); its upstreaming question is row 117's, kept local by the owner's 2026-10-16 ruling | No: WidgetKit opens on tap by platform default | Yes: without it a tap does nothing, and the device-keyed faces lose their locale | PR `expo/expo#51292` (the `openApp` half), open and unmerged (re-checked 2026-10-17). 58.0.19 was broken upstream for Android (`io.github.jakex7.peek` unresolved); 58.0.20 fixed it |
| `expo-location+58.0.17` | Android: 50Hz sensors, no 2-degree emission gate, module compiled from source. iOS: `kCLHeadingFilterNone`. The regenerated patch dropped the write-only `mLastAzimuth` symbol | Yes: every qibla open runs `Location.watchHeadingAsync`, the stream the iOS hunk sits in (`hooks/useQibla.ts`) | No: fused-sensor phones route to our own `modules/qiblaheading` Fused module and never arm the patched listener, and a non-fused phone never draws the compass | PR `expo/expo#51291`, open and unmerged (re-checked 2026-10-17): one `headingFilter` option (iOS maps to `CLLocationManager.headingFilter`, Android replaces the fixed 2-degree gate, every default preserves today's behaviour) plus a numeric `headingAccuracy` field. The patch stays until a published release carries the options |

## Row 51, the three proposed corrections to `expo-location`

1. Set the iOS `headingFilter`: it is never set, and on an iPhone XS 731 of 731 readings were discarded.
2. Make the Android 2-degree emission gate configurable: it starves a slow turn to 0.83 Hz.
3. Expose `headingAccuracy` unbucketed, with the negative invalid-heading sentinel intact: today it is bucketed to 0-3 and the sentinel collapses into bucket 0.

A 5-to-50 Hz rate change is weaker and optional. The Fused Orientation Provider as an npm package
is deliberately not proposed. Corrections go as PRs, there is no process to hand modules to Expo,
and `ai/AGENTS.md` binds every post to anonymity: no app name, repo link, device serial or secret.

**Filed 2026-10-09:** one PR carries all three, `expo/expo#51291`, plus the numeric
`headingAccuracy` field. The Android 5-to-50 Hz rate change was left out as the weak proposal.
Every option defaults to today's exact behaviour, so the patch stays until a published
`expo-location` carries them and the re-pin proves it on a phone.

## Related upstream PRs that remove no patch

| Repo | PR | What it fixes |
| --- | --- | --- |
| expo/expo | #51290, opened 2026-10-09 | The Android Glance converter drops the `fillMaxWidth` fraction (a 0.5 renders at 1.0) and has no `weight` case. This is the true cause behind row 15d's proportional-layout workaround; nothing in this repo changes until it merges, and the workaround can simplify only at the owner's say |
