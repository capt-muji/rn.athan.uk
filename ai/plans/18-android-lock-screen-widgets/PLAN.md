# Session 18: Android lock screen — the persistent prayer card

## 1. Goal

Put the next prayer on the Android lock screen, reading like the iOS Lock Screen widget does: the prayer's
name, its absolute time, and a countdown in the app's own `6h 8m` shape. It must work on every Android phone
the app supports, not on one vendor's bespoke surface.

Owner brief: `ai/prompts/android-lock-screen-widgets.md`. Owner ruling 2026-09-25: run planning, execution and
audit in one session, autonomously, and leave all three phones on the merged build.

## 2. The platform truth, measured on hardware (not assumed)

The brief demanded the investigation confirm the no-API truth on device before anything is designed. It was
confirmed on both Android phones this session.

| Probe | OnePlus 3T (Android 9) | Oppo Find X8 (Android 16 / ColorOS) |
| --- | --- | --- |
| `dumpsys appwidget` keyguard host | none | none |
| Providers in `widgetCategory` KEYGUARD (2) | 0 | only a third-party leftover; nothing hosts them |
| Keyguard widget settings in `settings list secure` | absent | absent |
| Vendor lock surface package | none | `com.oplus.keyguard.style.widgets` |
| A posted notification renders on the locked screen | yes | yes, captured and read |

`com.oplus.keyguard.style.widgets` is OPPO's Pantanal UPK card engine: `system_ext`, `minSdk 35`, its receiver
permission `prot=signature`. A third-party APK cannot register a card with it, and nothing about it exists on
the 3T or on stock Android. Building for it would be one vendor, one OS version, signature-gated.

**Verdict: vehicle 1 from the brief, the persistent lock-screen notification, is the only vehicle that works on
every Android phone.** Vehicles 2, 3 and 4 are rejected below.

### The X8 lock screen, observed

A notification posted while the keyguard was showing rendered as a card under the clock, reading `Athan` /
`Magrib`. The clock sits in the upper third; notification cards stack directly beneath it, each roughly 5% of
screen height. That is exactly the slot the iOS accessoryRectangular widget occupies, which is why this vehicle
reads as a lock screen widget to a user.

### Rejected vehicles

| Vehicle | Verdict | Reason |
| --- | --- | --- |
| OEM lock-screen widget API | Rejected | No public API on any Android version since 5.0 removed it in 2014. Confirmed absent on both phones. |
| OPPO Pantanal UPK card | Rejected | One vendor, one OS version, `prot=signature`. Unavailable to a third-party APK and meaningless on the 3T. |
| `showWhenLocked` activity | Rejected | Hijacks the unlock target. The brief already calls it UX-poor; documenting why not is the deliverable. |
| Overlay / accessibility draw-over | Rejected | Fragile, Play-policy risk, battery cost. The brief's rejected class. |
| Always-On Display | Rejected | OEM-only surface; the 3T's ambient display shows clock and notifications only, which funnels back to vehicle 1. |

## 3. The countdown format decision

Android's native `Chronometer` ticks for free but renders only `06:08:32`. The owner wants the app's own
`6h 8m`. So the card carries a **text countdown recomputed on the existing minute-edge alarm**, not a
chronometer.

This costs nothing new: `modules/widgetrefresh` already arms an exact alarm just past every wall-minute edge to
drive the Android home widgets, re-arms itself, and survives reboot. The lock card rides the same tick. A
minute-resolution label needs no finer cadence, which is why `6h 8m` is the right shape for this surface.

## 4. Design

**Invariant:** while the setting is on and prayer data is readable, a single ongoing notification shows the next
prayer's name, its `HH:mm` time and the minute-ceil countdown to it, and it never alters what any alert bell
shows or what any alarm does.

The card is a separate notification on a separate channel from every alert. The owner's absolute rule stands
untouched: an alert does exactly what its bell shows. This card is silent, `IMPORTANCE_LOW`, ongoing, and never
schedules, cancels or modifies an alert.

| Property | Value | Why |
| --- | --- | --- |
| Channel | `lock_card_v1`, `IMPORTANCE_LOW` | Silent and shade-quiet; never competes with an alert channel |
| Ongoing | true | Persists like a widget rather than dismissing on a swipe |
| Visibility | `VISIBILITY_PUBLIC` | Content must be readable on the locked screen |
| `showWhen` | false | The post time is noise beside a countdown |
| Tap target | opens the app | Matches the owner's ruling for the Android home widgets (session 15c) |
| Cadence | the existing minute-edge alarm | Already built, already reboot-safe, zero new alarms |

Gated behind a new `androidLockCard` feature flag and a user-facing setting, defaulted off, following the exact
lifecycle of the two existing widget flags.

## 5. Steps

1. **Flag + setting + preference atom.** `androidLockCard` in `shared/flags.ts`, `preference_lock_card` atom in
   `stores/ui.ts`, a `Show lock screen card` toggle in the Display card of `components/sheets/screens/Settings.tsx`.
2. **The pure label builder.** `buildLockCardContent` in `shared/lockCard.ts`: takes the snapshot and an
   instant, answers the name, the `HH:mm` and the `6h 8m` countdown, or null past the horizon. No React Native
   import, so unit tests read it directly.
3. **The native card.** A Kotlin notification builder in `modules/widgetrefresh`, posted and updated from the
   minute tick, cancelled when the setting goes off or data goes stale.
4. **Device proof** on both phones, then merge.

## 6. Acceptance

- `yarn validate` green: tsc, Biome, full Jest suite at 100% coverage.
- The card renders on the locked screen of both the 3T and the X8, read from screenshots.
- Its countdown decrements across a minute edge with the app closed.
- `dumpsys alarm` shows no new alarm beyond the existing widget-refresh chain.
- Every alert bell still does exactly what it shows.

## 7. Device safety

Both phones were put on `svc power stayon usb` with a 30-minute screen timeout before any lock test, so the
screen cannot die unattended and adb keeps working behind the keyguard. Verified this session: with the X8
locked (`deviceLocked=1`), `am start`, `dumpsys` and `screencap` all still function. No PIN is ever needed.
