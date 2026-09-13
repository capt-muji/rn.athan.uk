# Session: on Android, each notification replaces the one before it

**Status: NOT STARTED. Queued by the owner on 2026-09-13 as session 6. Android only: iOS is session
7 (`ios-replace-previous-notification.md`).**

## The ask, in the owner's framing

> *"Basically, what I want for both platforms is, If I get a notification for 30 minutes and then
> another notification for 5 minutes, the 30 minute notification should disappear and be
> overwritten with the 5 minute notification. Same thing for any notification that the application
> produces. It should overwrite the previous notifications, so the user doesn't have to keep
> swiping, to delete all the notifications, and That's it."*

And for this session: *"Let's implement this for Android. Let's do this for Android, yes, by adding
a tag like you mentioned."*

So on Android the newest notification the app produces is the only one left showing: reminder or
at-time, Standard or Extras. Finding 78 records the ask and the owner's decisions below.

## Read the real code and documentation first

The owner asked for this explicitly. Read expo-notifications through the `opensrc` CLI and its
documentation through `docs-mcp-server` (`ai/AGENTS.md`, AI Tooling), at the installed version
(57.0.18), before writing anything. That server is opencode-only, so in Claude Code read the same
pages with WebFetch, and record which was used. Never work from memory.

## Why notifications stack today

- Android replaces a showing notification only when a new one is posted with the same tag and id.
- expo-notifications posts every notification with its request identifier as the tag and a fixed id
  of 0 (`service/delegates/ExpoPresentationDelegate.kt` in its Android source, `:37`, `:108-112`
  and `:127-129`). Only the id goes through the overridable `getNotifyId`.
- The app's identifiers are unique per row, list day and reminder interval
  (`device/notifications.ts:33-46`). Scheduling depends on that, so they stay unique. Only the tag a
  notification is posted under changes.

## The approach

Post every notification under one shared tag and id. expo has no hook for the tag, so the change
overrides `presentNotification`. There are two routes:
- a `NotificationsService` subclass whose `getPresentationDelegate` returns the new delegate,
  declared by a config plugin, as `plugins/` already does, that also removes expo's own receiver
  from the merged manifest (expo takes the first match, `NotificationsService.kt:403-405`);
- a patch to expo-notifications.

Choose one, and write down why. Alarm PendingIntents name the receiver class and use its hash as the
request code (`NotificationsService.kt:416-440`), so prove on the 3T that alarms armed before the
change are cancelled or still post correctly, with no duplicates. A shared tag also breaks expo's
`dismissNotifications`, which the app does not call today. The change keeps the app far below
Android's 50-notification cap (finding 73).

Prove on the 3T, before building on it, that an update which moves to a different channel (an athan
channel, a reminder channel, the silent fallback) still sounds exactly as its own channel says.

## Owner decision, 2026-09-13: notifications due at the same instant are left to the system

> *"Let's not even bother to deal with it. Let just let this system deal with it... It's a side
> effect of the user scheduling things at the exact same time. Yeah, I think we shouldn't complicate
> things for us. Let's just leave it."*

The owner attached one condition: *"As long as it's not a default sound, ... then that's fine."*
All nine runs below met it. Prove it still holds once notifications share a tag.

This replaces an earlier ruling, withdrawn the same day, that an at-time notification beats a
reminder. Build no precedence between notifications.

In London 2026 these pairs fall due at the same instant, on every day that the user has picked those
alerts and intervals (each row has one reminder interval, `stores/notifications.ts:517`):
- Suhoor with Fajr's 20-minute reminder, and Sunrise with Duha's 20-minute reminder;
- Suhoor's 5- and 10-minute reminders with Fajr's 25- and 30-minute ones, and Sunrise's 5- and
  10-minute reminders with Duha's 25- and 30-minute ones.

No athan shares its instant with any other notification: the nearest comes 33 minutes after one.

## What the system does with such a pair today, measured on the 3T

Suhoor at Sound and Fajr's 20-minute reminder at Sound, both due at 04:39:00 on 14 September, nine
runs on the prod build at the close of session 1. "Played" is read from logcat's AudioTrack lines
and the media extractor, not by ear.

| Run | Saved last | Alarms delivered | Posted first | Played |
| --- | --- | --- | --- | --- |
| 1 | neither (full reschedule) | same millisecond | Fajr reminder | Fajr reminder; Suhoor muted |
| 2 | neither | same millisecond | Suhoor | Suhoor; Fajr reminder muted |
| 3 | neither | same millisecond | Suhoor | Suhoor; Fajr reminder muted |
| 4 | Suhoor | same millisecond | Suhoor | Suhoor; Fajr reminder muted |
| 5 | Suhoor | Suhoor 1 s later | Fajr reminder | Fajr reminder; Suhoor muted |
| 6 | Suhoor | Suhoor 1 s later | Fajr reminder | Fajr reminder, then Suhoor over it |
| 7 | Fajr reminder | Suhoor 1 s later | Fajr reminder | Fajr reminder; Suhoor muted |
| 8 | Fajr reminder | Suhoor 1 s later | Fajr reminder | Fajr reminder; Suhoor muted |
| 9 | Fajr reminder | same millisecond | Fajr reminder | Fajr reminder; Suhoor muted |

- Both notifications were posted every time.
- The first to post kept its sound. Android muted the app's next alert that arrived within about a
  second, logging "Muting recently noisy" (`NotificationManagerService.java:4893-4898`, Android 9).
  In run 6 the second arrived just outside that window, so its sound cut over the first.
- Which posted first varied, and the order of saving did not decide it. In runs 5 to 8
  Android delivered Suhoor's alarm a second after the reminder's, for a reason these runs did not
  establish. When both arrived in the same millisecond the order still varied; expo builds each
  notification on a background thread (`ExpoPresentationDelegate.kt:105-113`), which would
  explain it (read from the source).
- Read from the source, not tried: with one shared tag the later post replaces the earlier on
  screen. A muted later post never starts its sound. A silent later post stops the earlier sound
  (`NotificationManagerService.java:4832-4836`). Record what the device does once the change is
  built.

## How to run it

- The standing rules in `README.md` apply: one branch, one commit, version bump, deep review, merged
  `--no-ff` into `uat-2`, and nothing shipped without the owner's go-ahead.
- Prove it on the 3T with the clock driven, Silent wherever sound is not under test. After every
  fire, read what is still showing (`dumpsys notification`), not only what fired. Cover a reminder
  and then its at-time, a pair due at the same instant, and alarms armed before the change.
- Only the notification tray changes. The app's own screens stay exactly as they are.

## Deliverable

The Android change, unit tests that pin it, device evidence of what the tray holds after each fire,
and a finding recording the result.
