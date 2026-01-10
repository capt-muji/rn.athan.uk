# BUG-3: Proposed Solutions for Android Notification Delays

**Context**: Android notifications delayed by ±1-3 minutes on SOME devices (not all)
**Root Cause**: Android OS alarm deferral for battery optimization
**Constraint**: Cannot rely on `SCHEDULE_EXACT_ALARM` permission or battery optimization settings

---

## Solution Ranking

| Rank | Solution | Success Likelihood | Difficulty | Trade-offs |
|------|----------|-------------------|------------|-----------|
| 1 | Use `setAlarmClock()` via Native Module | **HIGH** (90%) | Medium | Status bar clock icon |
| 2 | Reduce Rolling Buffer to 2-3 Days | **MEDIUM** (60%) | Very Low | More frequent rescheduling |
| 3 | Pre-Trigger + Verification Loop | **MEDIUM** (50%) | High | Battery drain, complexity |
| 4 | Foreground Service (5 min before prayer) | **MEDIUM** (50%) | High | Battery drain, user-visible |
| 5 | Hybrid: AlarmManager + WorkManager Backup | **MEDIUM** (40%) | Medium | Duplicate notifications risk |
| 6 | OEM-Specific Workarounds | **LOW** (30%) | Very High | Maintenance nightmare |
| 7 | User Education + Acceptance | **LOW** (20%) | Very Low | Poor UX |

---

## SOLUTION 1: Native AlarmManager with `setAlarmClock()`

### Overview

Use Android's `setAlarmClock()` API directly via a native module instead of expo-notifications' `setExactAndAllowWhileIdle()`.

### Why This Works

`setAlarmClock()` is Android's **MOST PRECISE** alarm type:
- Bypasses ALL Doze mode restrictions
- Bypasses ALL battery optimization deferrals
- Fires at the EXACT millisecond specified
- Wakes the device from deep sleep
- Has highest priority in Android's alarm system

**Trade-off**: Shows a small clock icon in the status bar to indicate a scheduled alarm.

### Implementation

#### Step 1: Create Native Module

**File**: `modules/exact-alarm/android/src/main/java/uk/athan/exactalarm/ExactAlarmModule.kt`

```kotlin
package uk.athan.exactalarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.util.Log

class ExactAlarmModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExactAlarm")

    // Schedule an exact alarm that WILL fire on time
    AsyncFunction("scheduleAlarmClock") { triggerTimeMs: Long, title: String, body: String, soundUri: String? ->
      val context = appContext.reactContext ?: throw Exception("Context not available")
      val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

      // Check permission (Android 12+)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        if (!alarmManager.canScheduleExactAlarms()) {
          throw Exception("SCHEDULE_EXACT_ALARM permission not granted")
        }
      }

      // Create intent for BroadcastReceiver
      val intent = Intent(context, AlarmReceiver::class.java).apply {
        putExtra("title", title)
        putExtra("body", body)
        putExtra("soundUri", soundUri)
      }

      val pendingIntent = PendingIntent.getBroadcast(
        context,
        triggerTimeMs.toInt(), // Use timestamp as unique request code
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )

      // setAlarmClock: Shows status bar icon BUT guarantees exact timing
      val info = AlarmManager.AlarmClockInfo(triggerTimeMs, null)
      alarmManager.setAlarmClock(info, pendingIntent)

      Log.d("ExactAlarm", "Scheduled alarm clock for $triggerTimeMs ($title)")
      return@AsyncFunction triggerTimeMs.toString() // Return ID
    }

    AsyncFunction("cancelAlarmClock") { alarmId: String ->
      val context = appContext.reactContext ?: throw Exception("Context not available")
      val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

      val intent = Intent(context, AlarmReceiver::class.java)
      val pendingIntent = PendingIntent.getBroadcast(
        context,
        alarmId.toInt(),
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )

      alarmManager.cancel(pendingIntent)
      Log.d("ExactAlarm", "Cancelled alarm clock $alarmId")
    }

    AsyncFunction("cancelAllAlarmClocks") {
      // Would need to track all alarm IDs
      // For simplicity, could store them in SharedPreferences
    }
  }
}
```

**File**: `modules/exact-alarm/android/src/main/java/uk/athan/exactalarm/AlarmReceiver.kt`

```kotlin
package uk.athan.exactalarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import expo.modules.notifications.notifications.NotificationSerializer
import expo.modules.notifications.service.NotificationsService

class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val title = intent.getStringExtra("title") ?: "Prayer Time"
    val body = intent.getStringExtra("body") ?: ""
    val soundUri = intent.getStringExtra("soundUri")

    Log.d("AlarmReceiver", "Alarm fired: $title at ${System.currentTimeMillis()}")

    // Trigger Expo notification immediately
    // This uses expo-notifications to display, ensuring consistency
    val notificationIntent = Intent(context, NotificationsService::class.java).apply {
      putExtra("title", title)
      putExtra("body", body)
      putExtra("sound", soundUri)
    }

    context.startService(notificationIntent)
  }
}
```

#### Step 2: Register Module

**File**: `modules/exact-alarm/expo-module.config.json`

```json
{
  "platforms": ["android"],
  "android": {
    "modules": ["uk.athan.exactalarm.ExactAlarmModule"]
  }
}
```

#### Step 3: Update Android Manifest

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<receiver
  android:name="uk.athan.exactalarm.AlarmReceiver"
  android:enabled="true"
  android:exported="false">
</receiver>
```

#### Step 4: Use in TypeScript

**File**: `device/exactAlarm.ts` (new file)

```typescript
import { NativeModules } from 'react-native';

const { ExactAlarm } = NativeModules;

export const scheduleExactAlarm = async (
  triggerDate: Date,
  title: string,
  body: string,
  soundUri?: string
): Promise<string> => {
  const triggerTimeMs = triggerDate.getTime();
  return await ExactAlarm.scheduleAlarmClock(triggerTimeMs, title, body, soundUri);
};

export const cancelExactAlarm = async (alarmId: string) => {
  await ExactAlarm.cancelAlarmClock(alarmId);
};
```

#### Step 5: Replace expo-notifications Scheduling

**File**: `device/notifications.ts`

```typescript
import * as ExactAlarm from './exactAlarm';

export const addOneScheduledNotificationForPrayer = async (
  englishName: string,
  arabicName: string,
  date: string,
  time: string,
  alertType: AlertType
): Promise<NotificationUtils.ScheduledNotification> => {
  const sound = NotificationStore.getSoundPreference();
  const triggerDate = NotificationUtils.genTriggerDate(date, time);

  try {
    // Use native setAlarmClock instead of expo-notifications
    const id = await ExactAlarm.scheduleExactAlarm(
      triggerDate,
      `${englishName} \u2004`,
      `\u200E${arabicName}`,
      alertType === AlertType.Sound ? `athan${sound + 1}.wav` : undefined
    );

    const notification = { id, date, time, englishName, arabicName, alertType };
    logger.info('EXACT_ALARM: Scheduled:', notification);
    return notification;
  } catch (error) {
    logger.error('EXACT_ALARM: Failed to schedule:', error);
    throw error;
  }
};
```

### Pros
- **Guaranteed exact timing** - no more delays
- **Works on ALL Android devices** - bypasses OEM customizations
- **Simple implementation** - direct API call
- **Reliable** - highest priority alarm type

### Cons
- **Status bar icon** - shows a small clock icon while alarms are scheduled
- **User-visible** - users see there's an active alarm
- **May confuse users** - icon looks like they set an alarm clock

### Mitigation
- Add explanation in app: "The clock icon ensures prayer notifications arrive exactly on time"
- Make it optional: Settings toggle between "Exact timing (shows icon)" vs "Standard (may have small delays)"

---

## SOLUTION 2: Reduce Rolling Buffer Size

### Overview

Instead of scheduling 60 notifications (6 days × 10 prayers), reduce to 20-30 notifications (2-3 days).

### Why This Might Work

Android may defer alarms when too many are scheduled at once:
- Reduces "alarm storm" perception
- Allows Android to idle more between alarm clusters
- Reduces memory/battery footprint

### Implementation

**File**: `shared/constants.ts`

```typescript
// Change from 6 to 2 or 3
export const NOTIFICATION_ROLLING_DAYS = 2; // Was 6
```

**File**: `stores/notifications.ts`

```typescript
// Refresh more frequently to maintain buffer
export const NOTIFICATION_REFRESH_HOURS = 12; // Was 24

// Or trigger refresh when buffer falls below threshold
export const shouldRescheduleNotifications = (): boolean => {
  const lastSchedule = store.get(lastNotificationScheduleAtom);
  const now = Date.now();

  if (!lastSchedule) return true;

  // Refresh every 12 hours instead of 24
  const hoursElapsed = differenceInHours(now, lastSchedule);
  return hoursElapsed >= NOTIFICATION_REFRESH_HOURS;
};
```

### Pros
- **Very easy** to implement (one line change)
- **No trade-offs** - functionally identical to user
- **Lower memory footprint**
- **May reduce alarm batching**

### Cons
- **May not solve the issue** - delays might persist
- **More frequent rescheduling** - app needs to wake up every 12 hours instead of 24
- **Potential gaps** - if app doesn't open for 2+ days, notifications might not be scheduled

### Testing
1. Change to 2 days, test for 1 week
2. If delays persist, this is NOT the solution
3. If delays reduce/disappear, gradually increase to find sweet spot (3 days? 4 days?)

---

## SOLUTION 3: Pre-Trigger + Verification Loop

### Overview

Schedule notification to trigger 30 seconds BEFORE prayer time, then use a foreground service or interval to check every second and fire at exact moment.

### How It Works

```
1. Schedule alarm for prayer_time - 30 seconds
2. When alarm fires:
   a. Start foreground service (keeps app alive)
   b. Check current time every 100ms
   c. When current_time >= prayer_time, show notification
   d. Stop foreground service
```

### Implementation

**File**: `device/exactNotification.ts`

```typescript
import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const PRE_TRIGGER_BUFFER_MS = 30000; // 30 seconds before

export const scheduleExactNotification = async (
  triggerDate: Date,
  content: any
) => {
  // Schedule alarm 30 seconds early
  const preTriggerDate = new Date(triggerDate.getTime() - PRE_TRIGGER_BUFFER_MS);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Background Wakeup', // Hidden notification
      body: '',
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: preTriggerDate,
    },
  });

  // Store actual trigger time and content in MMKV
  Database.setPendingNotification(triggerDate.getTime().toString(), {
    triggerTime: triggerDate.getTime(),
    content,
  });
};

// Set up notification received listener
Notifications.addNotificationReceivedListener(async (notification) => {
  // Check if this is a pre-trigger wakeup
  if (notification.request.content.title === 'Background Wakeup') {
    await startVerificationLoop();
  }
});

const startVerificationLoop = async () => {
  const pendingNotifications = Database.getAllPendingNotifications();

  // Sort by trigger time
  pendingNotifications.sort((a, b) => a.triggerTime - b.triggerTime);

  for (const pending of pendingNotifications) {
    const now = Date.now();
    const timeUntilTrigger = pending.triggerTime - now;

    // If within 30 seconds, start tight loop
    if (timeUntilTrigger > 0 && timeUntilTrigger <= PRE_TRIGGER_BUFFER_MS) {
      await waitAndTrigger(pending);
    }
  }
};

const waitAndTrigger = async (pending: any) => {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const now = Date.now();

      if (now >= pending.triggerTime) {
        clearInterval(interval);

        // Fire notification NOW
        Notifications.scheduleNotificationAsync({
          content: pending.content,
          trigger: null, // Immediate
        });

        // Remove from pending
        Database.removePendingNotification(pending.id);

        resolve(true);
      }
    }, 100); // Check every 100ms for precision
  });
};
```

### Pros
- **Exact timing** - fires at precise moment
- **No status bar icon** - unlike setAlarmClock
- **Works with expo-notifications** - no native module needed

### Cons
- **Battery drain** - tight loop checking time every 100ms for up to 30 seconds
- **Complex** - lots of moving parts
- **Foreground requirement** - may need foreground service to keep loop running
- **Unreliable** - if pre-trigger notification itself is delayed, whole system fails

---

## SOLUTION 4: Foreground Service Before Each Prayer

### Overview

Start a foreground service 5 minutes before each prayer time to keep app alive and ensure alarm fires.

### Implementation

**File**: `device/foregroundService.ts`

```typescript
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

const FOREGROUND_TASK = 'prayer-foreground-task';

TaskManager.defineTask(FOREGROUND_TASK, async () => {
  // This task runs in the background to keep app alive
  // Just need to return success
  return BackgroundFetch.BackgroundFetchResult.NewData;
});

export const startForegroundService = async () => {
  await BackgroundFetch.registerTaskAsync(FOREGROUND_TASK, {
    minimumInterval: 60, // 1 minute
    stopOnTerminate: false,
    startOnBoot: true,
  });
};

// Schedule foreground service to start 5 mins before prayer
export const schedulePrePrayerWakeup = async (prayerTime: Date) => {
  const wakeupTime = new Date(prayerTime.getTime() - 5 * 60 * 1000);

  // Schedule notification to trigger foreground service
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Wakeup', body: '', sound: false },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: wakeupTime,
    },
  });
};
```

### Pros
- **Keeps app alive** - prevents Android from killing process
- **May reduce delays** - app is running when alarm fires

### Cons
- **Battery drain** - foreground service uses battery
- **User-visible notification** - foreground services require persistent notification
- **Complex** - needs to manage service lifecycle for each prayer
- **May not solve issue** - alarm deferral is independent of app lifecycle

---

## SOLUTION 5: Hybrid AlarmManager + WorkManager Backup

### Overview

Schedule alarm with AlarmManager (primary) AND WorkManager (backup). Whichever fires first wins.

### Implementation

```typescript
// Schedule both
await scheduleAlarmManagerNotification(triggerDate, content);
await scheduleWorkManagerNotification(triggerDate, content);

// In notification handler
const handleNotification = (notification) => {
  const notificationId = notification.request.identifier;

  // Check if we've already shown this prayer notification
  if (Database.hasShownNotification(notificationId)) {
    return; // Duplicate, ignore
  }

  // Show notification
  showNotification(notification);

  // Mark as shown
  Database.markNotificationShown(notificationId);

  // Cancel the backup (either AlarmManager or WorkManager)
  cancelBackupNotification(notificationId);
};
```

### Pros
- **Redundancy** - two systems increase reliability
- **Fallback** - if one system defers, other might fire on time

### Cons
- **Duplicate notifications risk** - both might fire
- **Complexity** - need deduplication logic
- **Battery** - scheduling twice the notifications
- **May not help** - if both systems are deferred, no benefit

---

## SOLUTION 6: OEM-Specific Workarounds

### Overview

Detect device manufacturer and apply specific workarounds for each.

### Implementation

```typescript
import DeviceInfo from 'react-native-device-info';

const applyOEMSpecificWorkarounds = async () => {
  const manufacturer = DeviceInfo.getManufacturerSync().toLowerCase();

  switch (manufacturer) {
    case 'xiaomi':
    case 'redmi':
      await applyXiaomiWorkaround();
      break;

    case 'samsung':
      await applySamsungWorkaround();
      break;

    case 'oppo':
    case 'realme':
      await applyOppoWorkaround();
      break;

    case 'huawei':
      await applyHuaweiWorkaround();
      break;

    default:
      // Stock Android, no special workaround
      break;
  }
};

const applyXiaomiWorkaround = async () => {
  // Xiaomi: Direct user to settings to disable MIUI battery optimization
  // AND disable memory optimization
  // AND enable autostart
  Alert.alert(
    'Xiaomi Device Detected',
    'For accurate prayer notifications, please:\n' +
    '1. Go to Settings > Apps > Athan > Other permissions > Display pop-up windows (Enable)\n' +
    '2. Go to Settings > Apps > Athan > Battery saver > No restrictions\n' +
    '3. Go to Settings > Apps > Manage apps > Athan > Autostart (Enable)',
    [
      { text: 'Open Settings', onPress: () => openAppSettings() },
      { text: 'Later' }
    ]
  );
};

const applySamsungWorkaround = async () => {
  // Samsung: Add to "Never sleeping apps" list
  Alert.alert(
    'Samsung Device Detected',
    'For accurate prayer notifications, please:\n' +
    '1. Go to Settings > Battery > Background usage limits\n' +
    '2. Add Athan to "Never sleeping apps"',
    [{ text: 'OK' }]
  );
};
```

### Pros
- **Targets specific issues** - addresses known OEM problems
- **Educational** - teaches users how to fix their device

### Cons
- **High maintenance** - different for each OEM and Android version
- **User burden** - requires users to navigate complex settings
- **May not work** - OEMs change settings locations frequently
- **Incomplete** - can't cover all devices

---

## SOLUTION 7: User Education + Acceptance

### Overview

Document that 1-3 minute delays are normal on some Android devices and educate users.

### Implementation

**In-app message**:
```
⏰ Note for Android Users

Due to Android's battery optimization, prayer notifications may arrive 1-3 minutes after the scheduled time on some devices. This is a limitation of the Android operating system to preserve battery life.

For most accurate timing:
• Keep the app open in the background
• Check prayer times manually for critical prayers (e.g., Fajr)
• Consider using an additional alarm for important prayers

We apologize for this inconvenience. This affects all prayer time apps on Android, not just Athan.
```

### Pros
- **Zero development effort**
- **Honest** - sets realistic expectations
- **No trade-offs**

### Cons
- **Poor UX** - users expect notifications to work
- **Competitive disadvantage** - users may try other apps (which have same issue)
- **Acceptance of defeat** - not really a solution

---

## Recommended Approach

### Phase 1: Quick Wins (Week 1)

1. **Reduce buffer to 2-3 days** (Solution 2) - Easy, low-risk
2. **Add comprehensive logging** (from Investigation Plan) - Gather data
3. **Test on multiple devices** - Confirm which devices have issues

### Phase 2: Native Solution (Week 2-3)

If buffer reduction doesn't help:

4. **Implement `setAlarmClock()` native module** (Solution 1) - Most likely to work
5. **Make it optional** - Settings toggle: "Exact timing (shows clock icon)" vs "Standard"
6. **A/B test** - Measure delay improvements

### Phase 3: Hybrid Approach (Week 4+)

If status bar icon is unacceptable:

7. **Implement OEM detection** (Solution 6) - Guide affected users
8. **Consider hybrid approach** (Solution 5) - For specific OEMs only

---

## Testing Plan

For each solution:

1. **Test on stock Android** (Pixel) - baseline
2. **Test on Xiaomi/Redmi** - known problematic
3. **Test on Samsung** - large user base
4. **Test on other OEMs** - OnePlus, Oppo, etc.

Measure:
- Delay frequency (% of notifications delayed)
- Delay magnitude (average delay in seconds)
- Battery impact
- User-visible changes

---

## Conclusion

**Highest probability of success**: Solution 1 (setAlarmClock native module)

**Easiest to implement**: Solution 2 (reduce buffer size)

**Best user experience**: Solution 1 with optional toggle

**Recommended**: Start with Solution 2 to gather data, then implement Solution 1 as primary fix.
