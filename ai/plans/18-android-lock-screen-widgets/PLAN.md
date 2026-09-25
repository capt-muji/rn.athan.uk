# Session 18: Android lock screen widgets — investigation, and the verdict

## Status: CLOSED, nothing shipped

This was an investigation-first session by the owner's ruling (2026-09-20): find out whether Android
lock screen widgets are possible at all, prove it on device, and build nothing before the owner
rules.

The investigation ran on both Android phones on 2026-09-25. **The answer is no.** The full evidence
is in `FINDINGS.md`; this page records the outcome and why no code ships.

## What the investigation established

1. **No public lock-screen widget API exists on any Android version since 5.0 removed it in 2014.**
   Confirmed on both phones: no keyguard widget host, no hosted keyguard-category provider, no
   keyguard widget settings. The only widget host on either device is the launcher.
2. **The AOSP Glanceable Hub, the one modern surface that hosts real AppWidgets on a lock screen,
   is inert on the Find X8.** Its code and feature flags are present, but the container view is
   GONE at 0x0, no communal widget host is ever created, and the activity that would place a widget
   is not exported. ColorOS ships the classes and removes the UI. Android 9 has none of it.
3. **OPPO's own lock screen cards are signature-gated** (`system_ext`, `minSdk 35`,
   `prot=signature`), so no third-party APK can register one, and they do not exist on the 3T.
4. **A persistent notification is the only vehicle that works**, and it works on both phones. It was
   built, proven on device and in the suite, and then **rejected by the owner** (2026-09-25):
   a constant notification on the lock screen is not wanted.

## Why nothing ships

With the notification vehicle rejected by the owner, every remaining route is signature-gated,
inert, or carries Play-policy and battery risk. There is no implementation left that is both
possible and acceptable, so the session closes with the investigation as its deliverable.

The Android home screen widgets already carry this content, and iOS keeps its Lock Screen widgets.

## Durable lessons recorded

- Android's `Chronometer` ticks for free with zero app alarms but can only render `06:08:32`. A
  free-ticking countdown and the owner's `6h 8m` shape are mutually exclusive on Android.
- A phone can carry a whole AOSP feature's code and flags while the OEM has removed its UI. Feature
  flags and class names prove nothing; the host list and the view's visibility are the evidence.

## If this is ever revisited

Two questions worth answering before any work starts, both in `FINDINGS.md`: whether Samsung devices
are in scope (One UI has its own lock-screen widget surface), and whether a notification shown only
while the app is in active use would clear the owner's objection.
