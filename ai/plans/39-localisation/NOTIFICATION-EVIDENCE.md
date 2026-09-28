# Can a notification localise at delivery time? Read from the installed source

Owner decision D12 rules that notification copy follows the selected language. The cost of that
ruling depends entirely on WHEN the copy resolves. This file answers it from
`expo-notifications@58.0.3` as installed, not from documentation.

## The question

Both platforms have a native mechanism for a notification whose text resolves when it is
DELIVERED rather than when it is scheduled:

- iOS: `UNNotificationContent.titleLocalizationKey` / `bodyLocalizationKey`, and
  `NSString.localizedUserNotificationString(forKey:arguments:)`. These name a key in the app's
  `.strings` bundle, and iOS resolves it against the user's language at delivery.
- Android: a notification can carry a string resource id that resolves at post time.

If either were reachable, a language change would need no re-arm at all, which would remove the
single most expensive part of this session.

## The answer: no, not through expo-notifications

### iOS

`node_modules/expo-notifications/ios/ExpoNotifications/Notifications/NotificationRecords.swift`,
`toUNMutableNotificationContent()` at line 336, is the one place a scheduled notification's
content is built:

```swift
func toUNMutableNotificationContent() -> UNMutableNotificationContent {
  let content = UNMutableNotificationContent()

  if let title = title {
    content.title = title
  }
  ...
  if let body = body {
    content.body = body
  }
```

The title and body are assigned as **plain Swift strings**, taken from the JS content object.
`content.titleLocalizationKey` is never set, and nothing in the scheduling path reads a
localisation key.

`titleLocalizationKey` and `bodyLocalizationKey` DO appear in the TypeScript types, at
`src/Notifications.types.ts:229` and `:250`. Reading them in context, they are fields of the
notification object the app RECEIVES, populated when parsing an incoming remote push payload
(`aps.alert.title-loc-key`). They are an output, not an input. Passing them to
`scheduleNotificationAsync` does nothing, because the Swift builder above never looks for them.

**iOS verdict: copy is frozen at schedule time.** Reaching the native mechanism would require a
patch to expo-notifications plus real `.strings` files in the app bundle, which means maintaining
a second catalog format in a different place from the JS one, kept in lockstep by hand.

### Android

`RemoteMessageSerializer.java` is the only file mentioning localisation keys, and it serialises an
incoming FCM `RemoteMessage`. Same shape as iOS: an inbound push concern, not a scheduling input.

**Android verdict: copy is frozen at schedule time.**

## What this costs, and the one thing that makes it affordable

Under session 28's request budget the app holds up to `NOTIFICATION_REQUEST_BUDGET = 64` armed
requests, armed a whole row at a time. A language change must cancel and re-arm all of them.

The saving grace is that **this repo already does exactly this operation, for exactly this
reason.** `stores/notifications.ts:1711`, `commitSoundSelection`, changes a value baked into every
armed request and re-arms the whole plan under `withSchedulingLock`, with a rollback on failure.
A language commit is the same operation with a different payload.

So the ruling is affordable, but it is not free, and it inherits two known hazards recorded in
`ai/AGENTS.md`:

1. Session 33 was queued because this operation is not atomic: a partial failure leaves some
   prayers re-armed and the rest stale while the rolled-back preference makes Settings disagree
   with both. Row 33 is DONE, so its ruling is the precedent this session follows.
2. Session 28 found that `commitPrayerAlertChange` wrote its preference BEFORE taking the lock, so
   a second queued commit read the first's values. The language commit must compute once from the
   values it was called with and pass them to both halves.

## The Android channel name, which is a separate question

`ai/AGENTS.md` records from session 27 that a channel's sound, audio attributes and importance are
frozen at creation, which is why the ids carry a `_v4` generation. The NAME is the open question:
`createNotificationChannel` on an existing id is documented to update the name and description
while ignoring the rest.

If the name can be updated in place, a language change renames the existing channels and no new
generation is needed. If it cannot, a language change would need a fresh channel generation per
language, which multiplies channels by the number of languages a user tries and leaves tombstones.

This is the one notification question the installed source does not settle, and it needs a device
check on the 3T rather than a desk answer. The plan carries it as a named experiment.

## The time-sensitive label the owner asked about

🐋  "On an iPhone, where we have time sensitive notifications enabled, the first line is taken up
by the time sensitive text. If we can hide that, that would be great, but I don't think so."

The owner is right that it cannot be hidden. `shared/notifications.ts` sets
`interruptionLevel: 'timeSensitive'` and session 27 added the matching iOS entitlement, so the
level is genuinely in force. iOS draws the "Time Sensitive" label itself, as part of how it
presents an alert that is allowed to break through Focus and Do Not Disturb. An app cannot
suppress it while keeping the interruption level, and dropping the level would give up the
breakthrough that session 27 existed to win.

The app already ships title only and no body, recorded twice in `shared/notifications.ts` as
"English-only, title only (no body)". So the display budget is one short line beneath a system
label, which is what makes the bilingual-notification idea expensive. See
`OPEN-DESIGN-QUESTION.md`.

## Reproducing

```bash
cd /Users/muji/repos/rn.athan.uk
sed -n '336,352p' node_modules/expo-notifications/ios/ExpoNotifications/Notifications/NotificationRecords.swift
grep -n "LocalizationKey" node_modules/expo-notifications/src/Notifications.types.ts
```
