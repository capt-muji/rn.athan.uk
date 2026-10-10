# D1: notification sound through silent mode

Sob 27, 2026-09-26. Android and iOS both sit at the ceiling their OS allows. This file backs the
answers the Help feature gives (`shared/help.ts`). The platform rows the old text got wrong while it was
being written are settled in the source today.

## The mechanism

Silent mode and Do Not Disturb are different systems. The ringer switch mutes audio STREAMS; DND
suppresses notifications by POLICY. A DND fix cannot solve a ringer-mode problem, and `bypassDnd: true`
did nothing here because DND was never on.

`adb shell dumpsys audio` on a 3T with the switch on:

```
- mode (internal) = SILENT
- ringer mode affected streams = 0x1a6 (STREAM_SYSTEM,STREAM_RING,STREAM_NOTIFICATION,STREAM_SYSTEM_ENFORCED,STREAM_DTMF)
- STREAM_NOTIFICATION:  Muted: true
- STREAM_ALARM:         Muted: false
```

`0x1a6` has bit 4 clear, and bit 4 is `STREAM_ALARM`: the switch mutes the notification stream and never
touches the alarm stream.

## Android: why the athan was still silent with alarm-stream channels

The alarm-stream channels, the valid importance and the DND access were all correct, and the athan was
still silent. The decisive test was the stock Clock app: an alarm set for one minute SOUNDED AND
VIBRATED with the silent switch on, which proves the phone allows alarm-stream audio and the defect was
ours.

Reverse engineering the OEM Clock APK shows why it succeeds where a channel cannot: its notification
channel carries NO SOUND AT ALL, and its dex carries the machinery instead (`AlarmKlaxon`,
`AsyncRingtonePlayer` with `MediaPlayerPlaybackDelegate`, `AudioAttributes$Builder`, audio focus,
`startForegroundService`, `setFullScreenIntent`, `FLAG_INSISTENT`). The Clock wakes on an exact alarm,
starts a FOREGROUND SERVICE, and plays the tone ITSELF through `MediaPlayer` with alarm
`AudioAttributes`.

**Conclusion: `NotificationManagerService` decides whether to play a channel's sound BEFORE it consults
that channel's `AudioAttributes`, and in silent ringer mode it decides not to.** `usage: ALARM` governs
volume and routing once audio plays; it does not exempt the notification path from the ringer gate. No
channel configuration can reach this goal, which is why every serious alarm app plays its own audio.
This is an Android platform boundary, not an expo-notifications defect.

`delivery: 'alarmClock'` is untouched and still required: it chooses `setAlarmClock()` so the trigger is
never deferred by OEM battery policy. It governs WHEN a notification fires, never HOW its sound plays.

DURABLE LESSON: **compare against a working system app FIRST.** One stock Clock alarm plus one line of
its channel dump answered in two minutes what a long series of channel-flag iterations could not. When
an app cannot do something the OS obviously can, read the OS app's APK before tuning your own flags.

## iOS: the mute switch and Critical Alerts

The iOS mute switch can only be overridden by Critical Alerts, which needs an entitlement Apple grants
narrowly. `timeSensitive` breaks through Focus and DND and says nothing about the switch; `critical`
bypasses the switch but needs the entitlement.

The owner applied for the entitlement before and was rejected. Re-applying is not worth it: Apple's
standard rejection text names only medical, home-security and public-safety categories; an alarm-app
developer was rejected, re-applied citing another alarm app that had been granted it, and received the
identical refusal; Apple's own developer forums say critical alerts are not suitable for alarms; requests
go through a separate contact form the normal appeals process does not cover. For this category it is
routinely refused.

## The user cannot permit it either, on either platform (tested 2026-09-26)

Tested with the silent switch ON and DND OFF, so Time Sensitive was the only thing in play: the
notification appeared on the lock screen, with no sound and no screen wake. Time Sensitive governs when
a notification is delivered and how long it stays, never whether the mute switch applies.

- **iOS**: no user-facing override exists. Only the Critical Alerts entitlement can ignore the switch,
  and Apple grants that, not the user.
- **Android**: no user-facing override for the notification path. The ringer-affected stream mask is
  system state; the only escape is an app playing its own audio on the alarm stream.

| Mode | Android | iOS |
| --- | --- | --- |
| Normal ringer | Sounds | Sounds |
| Do Not Disturb | `bypassDnd` + alarm-stream channels, and DND access can now be granted | Time Sensitive, fixed in 1.28.52 |
| Silent / mute switch | Only a self-played foreground service could, investigated and declined | Only Critical Alerts could, and Apple refuses it for this category |

## iOS: the time-sensitive entitlement, what it is worth (1.28.52)

Both `genNotificationContent` and `genReminderNotificationContent` have always sent
`interruptionLevel: 'timeSensitive'`, but `app.json` declared no `ios.entitlements`, and **iOS silently
downgrades the level to `active` when the app has not claimed the capability**. Every iOS prayer alert
was failing to break through Focus and DND with no error anywhere. The fix is one key,
`com.apple.developer.usernotifications.time-sensitive`, synced from `ios.entitlements`;
`shared/__tests__/nativeConfig.test.ts` pins it.

The owner challenged what it buys, since a user can hand-add the app to a Focus anyway. Two independent
routes through a Focus exist, and only one needs the entitlement:

| Route | What the user does | Needs the entitlement |
| --- | --- | --- |
| A. Allowed Apps | Adds this app to the Focus by name | NO. This has always worked |
| B. Time Sensitive | Flips the Focus's single "Time Sensitive Notifications" switch | YES. Without it the app is not eligible and the switch silently skips it |

What it genuinely buys: route B exists at all; **Scheduled Summary is bypassed** (an `active`
notification is held and batched into the digest, a time-sensitive one is delivered at its moment,
which for a prayer time is the difference between right and hours late); and the long-press "Deliver
Immediately" option appears only for time-sensitive alerts. Verified in iOS's own log with DND on:
`urgency: Time-Sensitive`, `suppression=0`.

## No status panel is built, and none should be (closed by the owner, 2026-09-26)

The owner asked for a Settings panel showing DND, silent mode, background activity and notification
status, then closed it once the research came back. The reasoning, recorded so no later session re-opens it:

- **DND and silent mode are deliberate user acts.** Someone who turns DND on knows they did. Telling
  them is stating the obvious.
- **The app cannot give useful guidance.** The setting lives in a different place on every device: one
  phone puts the DND override in the app's own notification settings, another in a DND exception list,
  the iPhone in Focus and then Allowed Apps. A warning that says "something is blocking this, go and
  find it" is worse than no warning.
- **iOS can only answer 2 of the 5 questions**, so the panel would be rich on Android and nearly empty
  on iPhone.
- **It would rot.** Every Android version reshuffles these settings.
- **Background refresh is ON by default on both platforms**, so a user who turns it off did so
  deliberately, exactly like DND and the switch. Two exceptions where it is off without the user
  choosing it, and neither changes the decision: OEM battery management (this project's own 8T incident,
  where OnePlus Auto-launch suppressed the boot receiver with no user action), and iOS Low Power Mode,
  which silently disables Background App Refresh. In both, a status row would only say "it is off" and
  then point at the OEM battery screen the owner has ruled out as a remedy. The 3-hour background task
  and the 2-hour foreground refresh are the real mitigation and already exist.

**Do not re-queue this.** The research is kept only so a future session does not repeat it.

### `BackgroundTask.getStatusAsync()` checks nothing (read in the source, 2026-09-26)

The Android body is one line: `AsyncFunction("getStatusAsync") { return@AsyncFunction 2 }`, WorkManager
assumed always available. It returns a hardcoded `Available` and never asks the system anything. iOS
returns `true` unless it is on a simulator, and never reads
`UIApplication.backgroundRefreshStatus`. So the call can never report a restriction on either platform.

A real check would need native code, and would still not solve it. iOS:
`UIApplication.shared.backgroundRefreshStatus` is the honest API, but Low Power Mode self-heals (it
switches off automatically above 80% charge and never alters the user's toggle), so the platform that
CAN be read is the one that does not need it. Android: there is no reliable API. `ActivityManager.isBackgroundRestricted()`
(API 28+) catches some cases, but the OEM killers that break this app (OnePlus Auto-launch,
ColorOS app battery management) are invisible to it. The exact failure that silenced the 8T is
undetectable. Opening the setting is possible on iOS (`Linking.openSettings()`), only partly on Android,
where the OEM battery screens have no stable intent.

On Android a status row would be permanently green and meaningless, and the honest recovery already
exists: the alarm-tracking gate and the 3h/2h intervals. Recovering from the failure beats detecting a
cause that cannot be seen or remedied.

## Owed, and still owed

1. **AlarmKit for iOS 26+ users** is a real session, blocked only on a test device running iOS 26. It
   would sit beside the notification path, not replace it, because the XS and every other pre-26 phone
   keeps the current behaviour. iOS 26 dropped the XS, XS Max and XR, so AlarmKit can never run on that
   handset; it is reachable for every user on an iPhone 11 or newer.
2. **`mBypassDnd=false`.** The code asks for `bypassDnd: true` and Android refuses it silently because
   the app has never been granted DND policy access. `ACCESS_NOTIFICATION_POLICY` is declared in
   `app.json`, but the user must additionally grant "Do Not Disturb access" in system settings. Built
   since this finding: `device/notifications.ts:20` asks for DND access and the Help feature guides to
   it, so a user who turns DND on is covered. The remaining gap is only the policy-access grant the user
   has not made.
3. The alarm stream volume was found at 1 of 7 on speaker and raised to 6 for the proof. Silent mode
   does not mute the alarm stream, but a user who has turned the alarm volume down will still hear a
   quiet athan. Whether the app should warn about that is an owner decision.
