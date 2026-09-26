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

## THE REAL BOUNDARY: notification-channel sound is gated on ringer mode, whatever the channel says

The alarm-stream channels, the valid importance and the DND access are all correct, and the athan was
STILL silent on the 3T through every one of them. The decisive test was the stock Clock app: an alarm set
for one minute SOUNDED AND VIBRATED with the silent switch on, which proves the phone allows alarm-stream
audio and the defect is ours.

Reverse engineering `/system/app/DeskClock/DeskClock.apk` shows why the Clock succeeds where a channel
cannot. Its own notification channel carries NO SOUND AT ALL:

```
CLOCK_SHOW_ALARM_CHANNEL   mSound=null   (no audio attributes)
```

and its dex carries the machinery instead:

```
com/oneplus/deskclock/alarms/AlarmKlaxon
com/oneplus/deskclock/AsyncRingtonePlayer $ MediaPlayerPlaybackDelegate, RingtonePlaybackDelegate
"Play ringtone via android.media.MediaPlayer."
android/media/AudioAttributes$Builder
AudioManager$OnAudioFocusChangeListener
startForegroundService, setFullScreenIntent, FLAG_INSISTENT
com/oneplus/deskclock/alarms/AlarmService, AlarmActivity
```

So the Clock wakes on an exact alarm, starts a FOREGROUND SERVICE, plays the tone ITSELF through
`MediaPlayer` with alarm `AudioAttributes`, takes audio focus, and raises a full-screen activity.

**Conclusion: `NotificationManagerService` decides whether to play a channel's sound BEFORE it consults
that channel's `AudioAttributes`, and in silent ringer mode it decides not to.** `usage: ALARM` governs
which volume and routing apply once audio plays; it does not exempt the notification path from the ringer
gate. No channel configuration can reach this goal, which is why every serious alarm app plays its own
audio. This is an Android platform boundary, not an expo-notifications defect and not a misconfiguration.

DURABLE LESSON: **compare against a working system app FIRST.** One stock Clock alarm, plus one line of
its channel dump, answered in two minutes what a long series of channel-flag iterations could not. When
an app cannot do something the OS obviously can, read the OS app's APK before tuning your own flags.

### What this does NOT change

`delivery: 'alarmClock'` (the project's own SDK 58 contribution) is untouched and still required: it
chooses `setAlarmClock()` so the trigger is never deferred by OEM battery policy. It governs WHEN a
notification fires, never HOW its sound plays, which is why it could not have fixed this. expo-notifications
also keeps scheduling, the rolling buffer, cancellation, identifiers, the shared tag, all of iOS, and
Android Silent alerts. Only the audio of an Android Sound alert moves.

## iOS: a real defect found, and the ceiling reached (1.28.52)

Looking at iOS properly turned up a silent bug that predates this session. Both
`genNotificationContent` and `genReminderNotificationContent` have always sent
`interruptionLevel: 'timeSensitive'`, but `app.json` declared no `ios.entitlements` at all, and
**iOS silently downgrades the level to `active` when the app has not claimed the capability**. So every
iOS prayer alert has been failing to break through Focus and Do Not Disturb, exactly the thing the code
asked for, with no error anywhere to say so.

Apple requires the capability to be enabled for the app (WWDC21, "Send communication and Time Sensitive
notifications"), and Expo lists `com.apple.developer.usernotifications.time-sensitive` as a supported
capability synced from `ios.entitlements`, so the whole fix is one key. Verified end to end rather than
assumed: after `npx expo prebuild -p ios`, `ios/Athan/Athan.entitlements` carries the key beside
`aps-environment` and the app group. `shared/__tests__/nativeConfig.test.ts` pins it so a later `app.json`
edit cannot drop the entitlement while the content still asks for the level.

**This does not touch the mute switch**, which only Critical Alerts can bypass. The iOS position is
unchanged from the section above: the entitlement is refused for this category, and AlarmKit, the real
answer, needs iOS 26 and the XS can never run it.

### What the entitlement is actually worth, measured (owner's challenge, 2026-09-26)

The owner tested it and pushed back: if a user can add the app to a Focus's Allowed Apps and be heard
anyway, what does the entitlement add? The answer, and the correction to this document's first draft:
**less than "alerts never broke through Focus" implied.** There are two independent routes through a
Focus, and only one of them needs the entitlement.

| Route | What the user does | Needs the entitlement |
| --- | --- | --- |
| A. Allowed Apps | Adds this app to the Focus by name | NO. This has always worked |
| B. Time Sensitive | Flips the Focus's single "Time Sensitive Notifications" switch | YES. Without it the app is not eligible and the switch silently skips it |

So for a user who has already hand-added the app, the entitlement changes nothing, which is exactly what
the owner observed on the XS. What it genuinely buys:

1. route B exists at all, which is one switch covering every eligible app rather than a per-app hunt;
2. **Scheduled Summary is bypassed**: an `active` notification is held and batched into the digest, a
   time-sensitive one is delivered at its moment. This is independent of DND and needs no allow-list,
   and for a prayer time a notification delivered hours late in a digest is simply wrong;
3. the long-press "Deliver Immediately" option appears only for time-sensitive alerts.

It stays because the content already asks for the level, the entitlement makes that request honest rather
than silently dropped, and it costs one config key. It is NOT the breakthrough the first draft of this
file called it. Verified in iOS's own log at 22:12:00 with DND on: `urgency: Time-Sensitive`,
`interruptionSuppression: none`, `suppression=0`, `resolutionReason: mode configuration for application`.

DURABLE LESSON: **an iOS notification level can be requested and silently not granted.** The JS reads
correct, the native content object reads correct, and nothing throws. The entitlements file is the only
place the truth appears, so check it whenever a level, not just a permission, is being relied on.

## The mute switch cannot be overridden by the user either, on either platform (tested 2026-09-26)

The owner's closing question: granted the app cannot bypass the silent switch, can the USER permit it
somewhere? Tested on the XS with the silent switch ON and DND OFF, so Time Sensitive was the only thing in
play: the notification appeared on the lock screen, with **no sound and no screen wake**. Time Sensitive
governs when a notification is delivered and how long it stays, never whether the mute switch applies.

There is no such setting on either platform:

- **iOS**: no user-facing override exists. The mute switch is treated as an unambiguous instruction, and
  only the Critical Alerts entitlement can ignore it, which is developer-side and Apple-granted, not
  something a user can enable.
- **Android**: no user-facing override for the notification path. The ringer-affected stream mask is
  system state, and the only escape is an app playing its own audio on the alarm stream, which is exactly
  what the Clock does and what this session declined to replicate.

So the matrix below is final, and the blank cell is by design on both platforms rather than a gap left
unclosed.

## Where D1 ends up, both platforms

| Mode | Android | iOS |
| --- | --- | --- |
| Normal ringer | Sounds | Sounds |
| Do Not Disturb | `bypassDnd` + alarm-stream channels, and DND access can now be granted | Time Sensitive, fixed in 1.28.52 |
| Silent / mute switch | Only a self-played foreground service could, investigated and declined | Only Critical Alerts could, and Apple refuses it for this category |

Both platforms now sit at the ceiling their OS allows without a second audio system.

## CLOSED, same day it was raised: no status panel is built (owner, 2026-09-26)

The owner asked for a Settings panel showing DND, silent mode, background activity and notification
status, then reconsidered once the research came back and **closed it**. 🐋  "I'm thinking quite honestly,
we've done as much as we can. We shouldn't bother with anything else... honestly, it just feels like we're
complicating it."

The reasoning, which is sound and is recorded so no later session re-opens it:

- **DND and silent mode are deliberate user acts.** Someone who turns DND on knows they did. Telling them
  is stating the obvious.
- **The app cannot give useful guidance.** The setting lives in a different place on every device: the 3T
  puts the DND override in the app's own notification settings, the Find X8 in a DND exception list, the
  iPhone in Focus > Allowed Apps. A warning that says "something is blocking this, go and find it" is
  worse than no warning.
- **iOS can only answer 2 of the 5 questions**, so the panel would be rich on Android and nearly empty on
  iPhone, which invites its own support question.
- **It would rot.** Every Android version reshuffles these settings.

Background activity was argued for as the one INVISIBLE failure and the owner corrected that:
**background refresh is ON by default on both platforms**, so a user who turns it off did so
deliberately, exactly like DND and the silent switch, and it earns no special treatment.

Two genuine exceptions remain where it is off without the user choosing it, and neither changes the
decision: OEM battery management, which is this project's own 8T incident in `ai/AGENTS.md`
[2026-09-23] where OnePlus Auto-launch suppressed the boot receiver with no user action; and iOS Low
Power Mode, which silently disables Background App Refresh, a link few users would make. In both, a
status row would only say "it is off" and then point at the OEM battery screen the owner has already
ruled out as a remedy. The 3-hour background task and the 2-hour foreground refresh, both sized after
that incident, are the real mitigation and already exist.

**Do not re-queue this.** The research below is kept only so a future session does not repeat it.

### The research, kept for reference

| Question | Android | iOS |
| --- | --- | --- |
| Is DND on? | Yes, `interruptionFilter` from `getPermissionsAsync`, already exposed | No. Apple exposes no Focus state to apps |
| Are we allowed through DND? | Yes, `getNotificationChannelAsync(id).bypassDnd`. Android has no app-level list: the per-channel flag IS the mechanism | No. The Focus allow-list is unreadable |
| Can we grant it ourselves? | No, user-only. `isNotificationPolicyAccessGranted` is not in expo's JS surface and would need native code | No |
| Is silent mode on? | Yes, but `AudioManager.getRingerMode()` needs a small native module | No public API |
| Are notifications enabled? | Yes, `getPermissionsAsync().granted` | Yes, same call |
| Is background activity allowed? | **NO. See the correction below: `getStatusAsync` is hardcoded** | No, same reason |

### Correction: `BackgroundTask.getStatusAsync()` checks nothing (read in the source, 2026-09-26)

An earlier version of this table listed background status as free on both platforms. That was wrong, read
from the type signature rather than the implementation. The Android body is one line:

```kotlin
AsyncFunction("getStatusAsync") { return@AsyncFunction 2 } // WorkManager is always available on Android
```

It returns a hardcoded `Available` and never asks the system anything. iOS returns `true` unless it is on
a simulator, and never reads `UIApplication.backgroundRefreshStatus`. So the call can never report a
restriction on either platform.

A real check would need native code, and would still not solve it:

- **iOS**: `UIApplication.shared.backgroundRefreshStatus` is the honest API and is readable in a small
  native module. But iOS Low Power Mode self-heals (it switches off automatically above 80% charge and
  never alters the user's toggle), so the platform that CAN be read is the one that does not need it.
- **Android**: there is no reliable API. `ActivityManager.isBackgroundRestricted()` (API 28+) catches
  some cases, but the OEM killers that actually break this app, OnePlus Auto-launch and ColorOS app
  battery management, are invisible to it. **The exact failure that silenced the 8T is undetectable.**

Opening the setting is possible on iOS (`Linking.openSettings()` lands on the app page with the toggle)
and only partly on Android, where the OEM battery screens have no stable intent.

This strengthens the decision not to build the panel: on Android a status row would be permanently green
and meaningless, and the honest recovery already exists, being the alarm-tracking gate and the 3h/2h
intervals that replaced the timestamp gate after the 8T incident. Recovering from the failure beats
detecting a cause that cannot be seen or remedied.

## Superseded: the original follow-up note (owner, 2026-09-26)

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

## The device proof, and what it exposed

The channel side is proven on the 3T with the silent switch ON. All 13 live channels read
`usage=USAGE_ALARM`, `flags=0x1` (FLAG_AUDIBILITY_ENFORCED), `mBypassDnd=true`, `mImportance=5`, and zero
channels remain on the notification stream. The superseded generations all carry `mDeleted=true`, which is
the tombstone Android keeps in `dumpsys` after a deletion; they are gone from the user's Settings. A verify
script that counts them as live reports a false FAIL, which is how this was first misread.

**The sound still did not play, and the channel is not the reason.** Evidence gathered in order:

1. The first run used a mock build, whose `athan-storage-dev` database is blank, so no prayer carried a
   Sound alert and `genNotificationContent` correctly sent `sound: false`. Only two channels existed. That
   run proved nothing about audio and was wrongly reported as a pass.
2. With the owner setting Sound plus a 5 minute reminder on every prayer of both schedules, all 12 channels
   appeared and `alertType: 2` (Sound) was logged for the scheduled Magrib. Still no sound, and **no
   vibration either**, though the channel carries `mVibration=[0, 250, 250, 250]`.
3. Silence AND no vibration together rule out the audio stream: a muted stream would still vibrate. The
   whole alert is being suppressed, not just its audio.
4. `raw/athan1` resolves in the installed APK (`aapt2 dump resources` gives `resource 0x7f110020 raw/athan1
   -> res/6N.mp3`, 136 raw entries), so the sound resource is present and correct.
5. Every posted notification carries ONE key: `0|com.mugtaba.athan|0|athan-notification|10191`.

**The suspected cause is the shared tag from session 7.** `plugins/replacePreviousNotification.js` posts
every notification under `SHARED_NOTIFICATION_TAG = "athan-notification"` so each replaces the one before
it (finding 78). Android does not re-alert when a notification is UPDATED in place under the same tag and
id: the first post of a series alerts, later ones change the shade silently. Five stale Athan notifications
were sitting on the shade during every test, so each new fire was an update rather than a new post. That
matches the silence and the missing vibration exactly, and it is unrelated to the alarm-stream work.

`setOnlyAlertOnce` is NOT set anywhere in the app or in `ExpoPresentationDelegate`, so this is Android's own
same-key update behaviour rather than something the app asks for.

The shared tag was NOT the cause. A fire against a cleared shade was still silent, which ruled it out.

## ROOT CAUSE: IMPORTANCE_MAX is deprecated and creates a channel with no behaviour

Found by the owner, in Settings, after five silent test fires. Opening
Settings > Apps > Athan > Notifications > Athan 1 > Behaviour showed **every radio button blank**: not
"make sound", not "show silently", nothing. Selecting one by hand immediately populated sound, pop-up and
override-DND, and dropped `mImportance` from 5 to 4.

`AndroidImportance.MAX` maps to `NotificationManagerCompat.IMPORTANCE_MAX`, which is 5 and **deprecated
since Android 8.0**. The documented ceiling for a channel is `IMPORTANCE_HIGH` (4). Android accepts a
channel created with 5 and then leaves its behaviour undefined, so it plays no sound AND does not vibrate.
Sources agree: "IMPORTANCE_MAX or 5, Deprecated in Android 8.0. Use IMPORTANCE_HIGH or 4", and "Importance
must be IMPORTANCE_DEFAULT or IMPORTANCE_HIGH to play sounds."

**This predates the session.** The athan channels have carried MAX since they were written, which is why
the athan never sounded in silent mode and why the alarm-stream change alone changed nothing. The session
also briefly raised the reminder channels from HIGH to MAX on the owner's instruction, which moved them
in the same wrong direction; both are now HIGH.

**Why no log could find it.** Nothing throws, nothing warns, and every dump reads healthy:
`mImportance=5`, `mBypassDnd=true`, `usage=USAGE_ALARM`, `flags=0x1`, the sound URI resolving to a real
`res/*.mp3`. The only visible symptom is in the Settings UI, where the behaviour group is empty. A dump
shows the importance VALUE, never that the value is one the platform no longer honours.

DURABLE LESSON: when a notification is silent AND does not vibrate, suspect the channel's importance
before the audio stream. A muted stream still vibrates; an undefined behaviour does neither. And read the
channel in the system Settings UI early, because that is the only surface that reveals it.

Fixed in 1.28.50: all three creators use HIGH, the ids move a generation again (athan `_v4`, reminders
`_v3`, extras `_v3`) because importance is immutable at creation exactly like the sound and the audio
attributes, and `deleteLegacyAndroidAudioChannels` clears all 231 superseded ids.

One consequence for the owner's own phone: selecting a behaviour by hand set `mUserLockedFields=4` on
`athan_1_v3`, and Android then honours the user's choice over the app's for that channel forever. The
`_v4` generation is fresh and unlocked, so it is unaffected.

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
