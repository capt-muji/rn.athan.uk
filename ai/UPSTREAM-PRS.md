# Upstream: the patches we carry and the PRs that would remove them

One row per patch under `patches/`. A patch leaves when a published package carries the change.
At every re-pin each patch is rebuilt against the new version and proven on a phone, never by a
green build alone. Measured 2026-10-08 against the installed pins; the detail lives in
`ai/plans/54-patches-and-copy/FINDINGS.md`.

| Patch | Changes | iOS depends today | Android depends today | Upstream |
| --- | --- | --- | --- | --- |
| `expo-background-task+58.0.7` | Adds `requiresNetworkConnectivity` to `BackgroundTaskOptions`, default `true`; the app registers with `false` (`stores/notifications.ts`) so the notification refresh runs offline | Yes | Yes | PR `expo/expo#50581`, open since 2026-09-24, unreviewed. Competing draft `expo/expo#48469` stalled since 2026-08-04. Newer published builds still hardcode both constraints |
| `expo-widgets+58.0.5` | Adds `openApp` to the Android widget `Button`, so a tap opens the app. Every Android card state wraps itself in it (`widgets/PrayerWidget.tsx`) | No: WidgetKit opens on tap by platform default | Yes: without it a tap does nothing | None. No PR and no issue exists. Worth a PR of its own |
| `expo-location+58.0.9` | Android: 50Hz sensors, no 2-degree emission gate, module compiled from source. iOS: `kCLHeadingFilterNone` | Yes: every qibla open runs `Location.watchHeadingAsync`, the stream the iOS hunk sits in (`hooks/useQibla.ts`) | No: fused-sensor phones route to our own `modules/qiblaheading` Fused module and never arm the patched listener, and a non-fused phone never draws the compass | None. Queue row 51 carries the proposals |

## Row 51, the three proposed corrections to `expo-location`

1. Set the iOS `headingFilter`: it is never set, and on an iPhone XS 731 of 731 readings were discarded.
2. Make the Android 2-degree emission gate configurable: it starves a slow turn to 0.83 Hz.
3. Expose `headingAccuracy` unbucketed, with the negative invalid-heading sentinel intact: today it is bucketed to 0-3 and the sentinel collapses into bucket 0.

A 5-to-50 Hz rate change is weaker and optional. The Fused Orientation Provider as an npm package
is deliberately not proposed. Corrections go as PRs, there is no process to hand modules to Expo,
and `ai/AGENTS.md` binds every post to anonymity: no app name, repo link, device serial or secret.
