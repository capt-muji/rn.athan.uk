# D1: notification sound through silent mode

Session 27, 2026-09-26. Android is fixed and proven. iOS is blocked on the owner's handset, with a real
path for everyone else.

## The question the owner asked

Both phones have a physical silent switch, both were switched to silent, and every prayer on both schedules
was set to Sound with a 5 minute reminder. The alerts must be heard anyway.

## Silent mode and Do Not Disturb are different systems

This distinction decided the whole session, and the D1 brief in `SDK58-PROGRAMME.md` had it wrong.

| | Silent / ringer mode | Do Not Disturb (zen mode) |
| --- | --- | --- |
| Mechanism | Mutes audio STREAMS | Suppresses notifications by POLICY |
| Set by | The hardware switch, or the volume keys | A software toggle |
| Countered by | Which stream the channel declares | `bypassDnd` on the channel |
| On the 3T, 2026-09-26 | `ringer mode (internal) = SILENT` | `mZenMode=ZEN_MODE_OFF` |

The brief prescribed `setBypassDnd(true)`. The code has carried `bypassDnd: true` on every channel since the
channels were written, and it did nothing for this, because DND was never on. **A DND fix cannot solve a
ringer-mode problem.** The owner was asked whether to enable DND and told not to: it would test a mechanism
that is not the one silencing the athan.

## Root cause on Android, measured

`adb shell dumpsys audio` on the 3T with the switch on:

```
- mode (internal) = SILENT
- ringer mode affected streams = 0x1a6 (STREAM_SYSTEM,STREAM_RING,STREAM_NOTIFICATION,STREAM_SYSTEM_ENFORCED,STREAM_DTMF)
- STREAM_NOTIFICATION:  Muted: true
- STREAM_ALARM:         Muted: false
```

`0x1a6` has bit 4 clear, and bit 4 is `STREAM_ALARM`. The ringer's silent switch mutes the notification
stream and never touches the alarm stream. That is the whole mechanism.

`adb shell dumpsys notification` showed where our audio was going:

```
NotificationChannel{mId='athan_1_v2', mImportance=5, mBypassDnd=false,
  mSound=android.resource://com.mugtaba.athan/raw/athan1,
  mAudioAttributes=AudioAttributes: usage=USAGE_NOTIFICATION content=CONTENT_TYPE_SONIFICATION flags=0x0
```

Three facts in one line: the athan played on `USAGE_NOTIFICATION`, no audibility flag was set, and
`mBypassDnd=false` even though the code asks for `true`, because DND policy access was never granted by the
user. The last one is a separate latent defect for DND users and is recorded below.

## Why `alarmClock` delivery did not already fix it

The owner asked, reasonably, whether SDK 58's `alarmClock` delivery (adopted in session 12, and carried by
every trigger through `ALARM_CLOCK_DELIVERY`) had already solved this untested. It had not, and cannot.
`ExpoSchedulingDelegate.kt` shows it selects the AlarmManager API only:

```kotlin
alarmClock -> alarmManager.setAlarmClock(AlarmManager.AlarmClockInfo(triggerAtMillis, launchAppIntent()), ...)
```

That governs WHEN the alarm fires and stops OEM battery policy deferring it. The sound still plays through
the notification channel, on whatever stream that channel declared at creation. Delivery class and audio
stream are independent.

## The fix

`expo-notifications` exposes the lever and wires it to native code.
`AndroidXNotificationsChannelManager.java`:

```java
AudioAttributes soundAttributes = createAttributesFromArguments(args.getArguments(SOUND_AUDIO_ATTRIBUTES_KEY));
channel.setSound(soundUri, soundAttributes);
...
attributesBuilder.setUsage(AudioUsage.fromEnumValue(args.getInt(AUDIO_ATTRIBUTES_USAGE_KEY)).getNativeValue());
if (flagsArgs.getBoolean(AUDIO_ATTRIBUTES_FLAGS_ENFORCE_AUDIBILITY_KEY)) flags |= AudioAttributes.FLAG_AUDIBILITY_ENFORCED;
```

`AudioUsage.java` maps `ALARM(AudioAttributes.USAGE_ALARM, 4)`, and the enum's runtime value was confirmed as
`4` by loading the built module. So `ALARM_AUDIO_ATTRIBUTES` in `shared/notifications.ts` sets
`usage: ALARM` plus `enforceAudibility: true` on all four channel creators.

### The trap: channels are immutable

**A channel's sound and audio attributes are frozen when Android first creates it.** Shipping the attribute
change alone would have done nothing on any phone that already had the app, because `athan_1_v2` already
existed on the notification stream. Every ID therefore moves to a new generation: athans to `_v3`, reminders
and extras to `_v2`. `deleteLegacyAndroidAudioChannels` now removes all 116 superseded IDs at init, so the
user's Settings does not fill with dead duplicates.

This is the same reason the wav to mp3 swap once forced `_v2`, recorded in `ai/AGENTS.md`.

### A defect found while fixing it

`updateAndroidChannel` in `device/notifications.ts` held a THIRD copy of the athan channel settings and had
no audio attributes. It runs when the user picks an athan, which is usually BEFORE any scheduling, so it
would have won the race and created every athan channel on the notification stream permanently, while the
two other call sites looked correct. `device/__tests__/androidChannelUpdate.test.ts` caught it, which is
exactly what that suite was written for. The settings now live once, in `athanAndroidChannelConfig`.

## iOS: the honest position

**The mute switch on iOS can only be overridden by Critical Alerts**, which needs an entitlement Apple
grants narrowly. From `expo-notifications`' own types:

- `'timeSensitive'`: "breaks through system notification controls" (Focus and DND). Says nothing about the
  mute switch. This is what the app already sends.
- `'critical'`: "bypasses the mute switch to play a sound". Needs the entitlement.

The owner applied for the entitlement before and was rejected. Research says re-applying is not worth it:

- Apple's standard rejection text names the eligible categories as "medical- and health-related
  notifications, home- and security-related notifications, and public safety notifications". Prayer times
  are not among them.
- The SuperAlarm developer, building an actual alarm app, was rejected, re-applied citing another alarm app
  that HAD been granted it, and received the identical copy-pasted refusal.
- Apple's own developer forums: "Use of critical alerts is not suitable for alarm..."
- Critical Alerts requests go through a separate contact form that the normal App Review appeals process
  does not cover.

So it is not that approval is uncertain; for this category it is routinely refused.

### AlarmKit is the real answer, and the XS cannot run it

iOS 26 shipped **AlarmKit**, which lets third-party apps schedule system alarms that sound through silent
mode, Focus and DND, with no special entitlement. It is the sanctioned replacement for Critical Alerts for
exactly this use case.

The owner's iPhone XS is `iPhone11,2` on iOS 18.7.10, read with `xcrun devicectl`. **iOS 26 dropped the XS,
XS Max and XR**, so AlarmKit can never run on that handset. It is reachable for every user on an iPhone 11
or newer.

| Platform | Bypasses the mute switch | Status |
| --- | --- | --- |
| Android | `usage: ALARM` on the channel | Fixed in 1.28.47 |
| iOS 26+ | AlarmKit | Available, not built. Needs a device on iOS 26 to develop against |
| iOS 18 on the XS | Nothing | Genuinely blocked. Not a code problem |

## Follow-up session: show the three bypass statuses in Settings (owner, 2026-09-26)

🐋  "I want to show 2 options at the bottom, bypass D&D and bypass silent mode... And then also a 3rd one
also for background activity... Is there a read API for these 3 things."

Researched against the installed packages. Two of the three need no new dependency; one needs a small
native addition. The app can only READ these, never set them, which is what the owner asked for.

| Row to show | Android read | iOS read |
| --- | --- | --- |
| Do Not Disturb | `getPermissionsAsync().android.interruptionFilter`, already exposed by expo-notifications and filled from `notificationManager.currentInterruptionFilter` (`NotificationPermissionsModule.kt:63`). Values: ALL, PRIORITY, NONE, ALARMS | Not available. iOS exposes no Focus or DND state to apps by design. Show `allowsCriticalAlerts` instead, which is the honest answer to "can we be heard" |
| Silent mode bypass | Our channels declare `USAGE_ALARM` from 1.28.47, so the bypass is a property of the build. The live ringer mode needs `AudioManager.getRingerMode`, which is native | `allowsCriticalAlerts` from `getPermissionsAsync().ios`, already exposed. It reads false and will stay false |
| Background activity | `BackgroundTask.getStatusAsync()`, already a dependency. Returns `Available` or `Restricted` | Same call, reflects Background App Refresh |

**The one gap worth knowing before scoping it.** `NotificationManager.isNotificationPolicyAccessGranted()`
is the exact answer to "are we allowed to bypass DND", and it is NOT in expo-notifications' JS surface. It
needs a small native module or a config plugin. Everything else on the table above is reachable today.

Android version naming differs across skins, but `currentInterruptionFilter` is stable platform API, so the
row reads the constant and maps it to words rather than reading any OEM label.

## Open items

1. **AlarmKit for iOS 26+ users** is a real session, blocked only on a test device running iOS 26. It would
   sit beside the notification path, not replace it, because the XS and every other pre-26 phone keeps the
   current behaviour.
2. **`mBypassDnd=false`.** The code asks for `bypassDnd: true` and Android refuses it silently because the
   app has never been granted DND policy access. `ACCESS_NOTIFICATION_POLICY` is declared in `app.json`, but
   the user must additionally grant "Do Not Disturb access" in system settings, and nothing in the app asks.
   Any user who turns DND on today loses their athan. Worth its own session, with a permission flow.
3. The 3T's alarm stream volume was found at 1 of 7 on speaker and raised to 6 for the proof. Silent mode
   does not mute the alarm stream, but a user who has turned the alarm volume down will still hear a quiet
   athan. Whether the app should warn about that is an owner decision.
