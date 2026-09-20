# Session brief: Android lock screen widgets — deep investigation first

Owner ruling 2026-09-20 (evening): an entire session of its own, deep investigation, 3T first.
"Try to create Android lock screen widgets, just like we have for iOS widgets... I'm not even
sure if the OnePlus 3T can have its own lock screen widgets, but let's have a look. If they
can't, we need to look at other Android devices, because some of them can... let's try to do it
on the 3T first. Deep investigation."

## The platform truth to verify, not assume

Lock screen widgets were a native Android feature only from 4.2 to 4.4; the platform REMOVED
them in 5.0 (2014) and has shipped no public lock-screen widget API since, on any vendor or
version, including the OnePlus 3T's Android 9. Claims of "lock screen widgets" on modern
Android are one of: OEM bespoke features, overlay/accessibility hacks, or notifications. The
investigation CONFIRMS this on the 3T itself before anything is designed.

## Candidate vehicles, to be investigated in order

1. **A persistent lock-screen notification with a live chronometer** (the leading candidate):
   `Notification.Builder.setOngoing(true)` + `setVisibility(VISIBILITY_PUBLIC)` + RemoteViews
   `Chronometer` (or `setUsesChronometer`), counting DOWN to the next prayer's epoch. The system
   renders and ticks it with ZERO app alarms (the same free-ticking class as iOS
   `Text(timerInterval:)`). Content updates ride the existing push paths. Must be verified on
   the 3T: chronometer countdown direction, custom layout limits (RemoteViews only), behaviour
   on the lock screen vs shade, interplay with the 2-day notification buffer and the
   shared-tag replacement rule (session 7) — the standing rule "an alert does exactly what its
   bell shows" must survive a persistent notification existing beside it.
2. **A `showWhenLocked` activity**: technically possible, UX-poor (hijacks the unlock target);
   investigate only to document why not.
3. **Overlay/accessibility hacks** (draw-over-lock apps): document as the rejected class
   (fragile, Play-policy risk, battery).
4. **Always-On Display / ambient integrations**: OEM-only surfaces; the 3T's OxygenOS ambient
   display shows clock and notifications only — which funnels back to vehicle 1.

## Deliverable

A findings table: per vehicle, possible on the 3T or not, with on-device evidence (screenshots
read per the session's ruling at that time, logcat, dumpsys) and the cost of each. A
recommendation the owner rules on. NOTHING is built before the owner picks; if the chronometer
notification is picked, its design (channel, priority, what it shows at each prayer state,
staleness handling past the horizon, opt-in setting) is a follow-up plan.

## Constraints

- The alert system's absolute rules are untouched: a persistent lock notification must never
  alter what any bell shows or what any alarm does.
- Battery: a chronometer notification is system-ticked (~zero marginal cost); the session
  measures to confirm on the 3T.
- Other Android devices (the owner's "some of them can"): only surveyed after the 3T verdict;
  any modern device faces the same no-API truth, so the survey is about OEM lock surfaces, not
  widgets.

## Device + build notes

- OnePlus 3T, serial `8f7ada76`, Android 9, now carries the ORIGINAL id build
  `com.mugtaba.athan` (owner ruling 2026-09-20; fleettest is off this phone). Android widget
  builds require `EXPO_PUBLIC_ANDROID_WIDGETS=1` in `.env` at prebuild AND bundle time or the
  APK silently ships widget-less (durable lesson, same day).
- The notification stack: `stores/notifications.ts`, `shared/notifications.ts`, the shared-tag
  replacement rule (session 7), alarm-clock delivery on every notification (session 12).
