# BUG-3: Android Delayed Notifications Investigation Plan

**Critical Insight**: This issue occurs on **SOME** Android devices, not ALL. This suggests device-specific, OEM-specific, or Android version-specific behavior rather than a universal Android limitation.

---

## Investigation Objectives

1. **Identify which devices have the issue vs. which work fine**
2. **Determine if there's a pattern** (OEM, Android version, chipset, battery management)
3. **Measure actual delay magnitude** (is it consistently 1-3 mins or variable?)
4. **Understand when delays occur** (only in Doze? All the time? Specific times of day?)
5. **Test if different scheduling approaches eliminate delays on affected devices**

---

## Phase 1: Data Collection & Profiling

### Step 1.1: Add Comprehensive Logging

**Goal**: Track WHEN notifications are scheduled vs. WHEN they actually fire

**Implementation**:

Add logging in `device/notifications.ts`:

```typescript
export const addOneScheduledNotificationForPrayer = async (
  englishName: string,
  arabicName: string,
  date: string,
  time: string,
  alertType: AlertType
): Promise<NotificationUtils.ScheduledNotification> => {
  const sound = NotificationStore.getSoundPreference();
  const triggerDate = NotificationUtils.genTriggerDate(date, time);
  const content = NotificationUtils.genNotificationContent(englishName, arabicName, alertType, sound);

  // NEW: Log detailed scheduling information
  const scheduledAt = new Date();
  const triggerTimestamp = triggerDate.getTime();
  const scheduledTimestamp = scheduledAt.getTime();
  const msUntilTrigger = triggerTimestamp - scheduledTimestamp;

  logger.info('NOTIFICATION_SCHEDULE_DEBUG', {
    prayer: englishName,
    date,
    time,
    scheduledAt: scheduledAt.toISOString(),
    triggerDate: triggerDate.toISOString(),
    triggerTimestamp,
    msUntilTrigger,
    hoursUntil: (msUntilTrigger / 1000 / 60 / 60).toFixed(2),
    deviceTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    londonTimeNow: formatInTimeZone(scheduledAt, 'Europe/London', 'yyyy-MM-dd HH:mm:ss'),
    triggerTimeLondon: formatInTimeZone(triggerDate, 'Europe/London', 'yyyy-MM-dd HH:mm:ss'),
  });

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: alertType === AlertType.Sound ? `athan_${sound + 1}` : undefined,
      },
    });

    const notification = { id, date, time, englishName, arabicName, alertType };

    // NEW: Store scheduled time in MMKV for later comparison
    Database.setScheduledNotificationMetadata(id, {
      scheduledTimestamp,
      triggerTimestamp,
      prayer: englishName,
      date,
      time,
    });

    logger.info('NOTIFICATION_SCHEDULED', { id, prayer: englishName, triggerDate: triggerDate.toISOString() });
    return notification;
  } catch (error) {
    logger.error('NOTIFICATION_SYSTEM: Failed to schedule:', error);
    throw error;
  }
};
```

Add notification received tracking in `hooks/useNotification.ts`:

```typescript
// Track when notification actually fires
Notifications.addNotificationReceivedListener((notification) => {
  const receivedAt = new Date();
  const notificationId = notification.request.identifier;

  // Retrieve scheduled metadata
  const metadata = Database.getScheduledNotificationMetadata(notificationId);

  if (metadata) {
    const actualTriggerTime = receivedAt.getTime();
    const scheduledTriggerTime = metadata.triggerTimestamp;
    const delayMs = actualTriggerTime - scheduledTriggerTime;
    const delaySeconds = Math.round(delayMs / 1000);

    logger.info('NOTIFICATION_RECEIVED_DEBUG', {
      id: notificationId,
      prayer: metadata.prayer,
      scheduledTriggerTime: new Date(scheduledTriggerTime).toISOString(),
      actualTriggerTime: receivedAt.toISOString(),
      delayMs,
      delaySeconds,
      delayMinutes: (delaySeconds / 60).toFixed(2),
      wasEarly: delayMs < 0,
      wasOnTime: Math.abs(delaySeconds) <= 5, // ±5 seconds tolerance
      wasDelayed: delayMs > 5000,
    });

    // Store delay data for analytics
    Database.recordNotificationDelay({
      date: metadata.date,
      prayer: metadata.prayer,
      delaySeconds,
      timestamp: actualTriggerTime,
    });
  }
});
```

**New MMKV storage functions** (add to `stores/database.ts`):

```typescript
// Store notification scheduling metadata
export const setScheduledNotificationMetadata = (notificationId: string, metadata: any) => {
  storage.set(`notification_metadata_${notificationId}`, JSON.stringify(metadata));
};

export const getScheduledNotificationMetadata = (notificationId: string) => {
  const data = storage.getString(`notification_metadata_${notificationId}`);
  return data ? JSON.parse(data) : null;
};

// Record delay analytics
export const recordNotificationDelay = (delayData: any) => {
  const delays = getNotificationDelays();
  delays.push(delayData);

  // Keep only last 100 entries
  if (delays.length > 100) {
    delays.shift();
  }

  storage.set('notification_delays', JSON.stringify(delays));
};

export const getNotificationDelays = () => {
  const data = storage.getString('notification_delays');
  return data ? JSON.parse(data) : [];
};
```

### Step 1.2: Create Debug Screen

**Goal**: Display delay analytics to users/testers

Add a debug screen (`components/DebugNotificationStats.tsx`):

```typescript
import { View, Text, ScrollView } from 'react-native';
import * as Database from '@/stores/database';

export default function DebugNotificationStats() {
  const delays = Database.getNotificationDelays();

  const stats = delays.reduce((acc, delay) => {
    if (Math.abs(delay.delaySeconds) <= 5) acc.onTime++;
    else if (delay.delaySeconds > 5) acc.delayed++;
    else acc.early++;

    acc.totalDelay += delay.delaySeconds;
    acc.maxDelay = Math.max(acc.maxDelay, delay.delaySeconds);
    acc.minDelay = Math.min(acc.minDelay, delay.delaySeconds);

    return acc;
  }, { onTime: 0, delayed: 0, early: 0, totalDelay: 0, maxDelay: 0, minDelay: 0 });

  const avgDelay = delays.length > 0 ? stats.totalDelay / delays.length : 0;

  return (
    <ScrollView>
      <Text>Total Notifications: {delays.length}</Text>
      <Text>On Time (±5s): {stats.onTime}</Text>
      <Text>Delayed (>5s): {stats.delayed}</Text>
      <Text>Early (<-5s): {stats.early}</Text>
      <Text>Average Delay: {avgDelay.toFixed(1)}s ({(avgDelay/60).toFixed(2)}min)</Text>
      <Text>Max Delay: {stats.maxDelay}s ({(stats.maxDelay/60).toFixed(2)}min)</Text>
      <Text>Min Delay: {stats.minDelay}s ({(stats.minDelay/60).toFixed(2)}min)</Text>

      <Text style={{ marginTop: 20 }}>Recent Delays:</Text>
      {delays.slice(-20).reverse().map((delay, i) => (
        <View key={i}>
          <Text>
            {delay.prayer} on {delay.date}: {delay.delaySeconds}s ({(delay.delaySeconds/60).toFixed(1)}min)
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
```

### Step 1.3: Add Device Information Logging

**Goal**: Correlate delays with device characteristics

Add to app initialization (`app/index.tsx` or wherever appropriate):

```typescript
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// On app launch, log device information
logger.info('DEVICE_INFO', {
  platform: Platform.OS,
  version: Platform.Version,
  manufacturer: Constants.deviceName, // May need react-native-device-info for more details
  model: Constants.deviceYearClass,
  androidSdkVersion: Platform.OS === 'android' ? Platform.Version : null,
  expoVersion: Constants.expoVersion,
  appVersion: Constants.manifest?.version,
});
```

**Better alternative**: Install `react-native-device-info`:

```bash
npx expo install react-native-device-info
```

Then log:
```typescript
import DeviceInfo from 'react-native-device-info';

logger.info('DEVICE_INFO_DETAILED', {
  manufacturer: DeviceInfo.getManufacturerSync(),
  brand: DeviceInfo.getBrand(),
  model: DeviceInfo.getModel(),
  deviceId: DeviceInfo.getDeviceId(),
  systemVersion: DeviceInfo.getSystemVersion(),
  apiLevel: DeviceInfo.getApiLevelSync(),
  batteryLevel: await DeviceInfo.getBatteryLevel(),
  isPinOrFingerprintSet: await DeviceInfo.isPinOrFingerprintSet(),
});
```

---

## Phase 2: Pattern Analysis

### Step 2.1: Collect Data from Multiple Devices

**Testing Matrix**:

| Device Category | Examples | Expected Result |
|----------------|----------|----------------|
| **Stock Android (Google Pixel)** | Pixel 6, 7, 8, 9 | Baseline - should be most reliable |
| **Samsung (One UI)** | Galaxy S22, S23, S24 | May have delays due to One UI battery optimization |
| **Xiaomi (MIUI/HyperOS)** | Redmi Note, Mi series | Known for aggressive battery management |
| **OnePlus (OxygenOS)** | OnePlus 9, 10, 11 | Variable based on version |
| **Oppo/Realme (ColorOS)** | Find X, Realme GT | App freeze feature may cause delays |
| **Older Android (API 30-31)** | Any device on Android 11-12 | Different alarm API behavior |
| **Newer Android (API 33+)** | Any device on Android 13+ | SCHEDULE_EXACT_ALARM default-deny |

**Data to collect for each device**:
1. Number of notifications fired
2. Number on-time (±5 seconds)
3. Number delayed (>5 seconds)
4. Average delay
5. Maximum delay
6. Pattern: Do delays occur at specific times? (e.g., overnight during deep sleep)

### Step 2.2: Analyze Delay Patterns

**Questions to answer**:

1. **Is delay correlated with device OEM?**
   - If YES: Which OEMs have the worst delays?
   - Action: Research OEM-specific battery management APIs

2. **Is delay correlated with Android API level?**
   - If YES: Which Android versions?
   - Action: May need version-specific handling

3. **Is delay correlated with time of day?**
   - If delays happen mostly overnight (midnight - 6am Fajr time): Deep Doze mode issue
   - If delays happen randomly: Different root cause

4. **Is delay correlated with app state?**
   - Track if app was in foreground/background when notification fired
   - Track time since last user interaction

5. **Is delay correlated with number of scheduled notifications?**
   - Does the 60-notification buffer cause alarm storms?
   - Test with smaller buffer (e.g., 2 days instead of 6)

---

## Phase 3: Hypothesis Testing

### Hypothesis 1: Timezone Calculation Issue

**Theory**: Date object conversion from London time causes timing drift on specific devices

**Test**:
1. Log the exact millisecond timestamp being passed to Android
2. On notification fire, compare with system clock
3. Check if delay is CONSISTENT (same amount each time) vs VARIABLE

**How to test**:
```typescript
// In genTriggerDate(), log raw values
logger.info('TIMEZONE_DEBUG', {
  inputDate: date,
  inputTime: time,
  createdLondonDate: triggerDate.toISOString(),
  utcTimestamp: triggerDate.getTime(),
  deviceTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  deviceOffset: new Date().getTimezoneOffset(),
  londonFormatted: formatInTimeZone(triggerDate, 'Europe/London', 'yyyy-MM-dd HH:mm:ss'),
});
```

**Expected Result**:
- If timezone issue: Delay will be CONSISTENT (e.g., always +2 mins)
- If NOT timezone issue: Delay will be VARIABLE (±1-3 mins)

### Hypothesis 2: Alarm Batching Due to Multiple Notifications

**Theory**: Scheduling 60 notifications at once causes Android to batch/defer some

**Test**:
1. Reduce `NOTIFICATION_ROLLING_DAYS` from 6 to 2
2. Measure if delays decrease
3. Try scheduling ONE notification at a time with delays between each

**Implementation**:
```typescript
// In stores/notifications.ts, modify rescheduleAllNotifications()
export const rescheduleAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await cancelAllScheduleNotificationsForSchedule(ScheduleType.Standard);
  await cancelAllScheduleNotificationsForSchedule(ScheduleType.Extra);

  // CHANGE: Stagger scheduling with small delays
  for (const scheduleType of [ScheduleType.Standard, ScheduleType.Extra]) {
    await addAllScheduleNotificationsForSchedule(scheduleType);

    // Wait 1 second between schedule types
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  logger.info('NOTIFICATION: Rescheduled all notifications');
};
```

Or test with reduced buffer:
```typescript
// In shared/constants.ts
export const NOTIFICATION_ROLLING_DAYS = 2; // Changed from 6
```

**Expected Result**:
- If batching is the issue: Fewer delays with smaller buffer
- If NOT batching: No change in delay frequency

### Hypothesis 3: Doze Mode Exemption Incomplete

**Theory**: App needs additional Doze mode exemptions beyond battery optimization

**Test**:
1. Check if app is whitelisted for Doze exemptions programmatically
2. Request REQUEST_IGNORE_BATTERY_OPTIMIZATIONS if not already
3. Measure delays before and after exemption

**Implementation**:
```typescript
import { PermissionsAndroid, Platform } from 'react-native';
import { startActivityAsync, ActivityAction } from 'expo-intent-launcher';

const checkBatteryOptimization = async () => {
  if (Platform.OS !== 'android') return;

  // This requires adding permission to AndroidManifest:
  // <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />

  try {
    const PowerManager = NativeModules.PowerManager; // Would need native module
    const isIgnoringBatteryOptimizations = await PowerManager.isIgnoringBatteryOptimizations();

    logger.info('BATTERY_OPTIMIZATION', { isIgnoring: isIgnoringBatteryOptimizations });

    if (!isIgnoringBatteryOptimizations) {
      // Prompt user to disable battery optimization
      await startActivityAsync(ActivityAction.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, {
        data: 'package:uk.athan',
      });
    }
  } catch (error) {
    logger.error('Failed to check battery optimization:', error);
  }
};
```

**Expected Result**:
- If Doze is the issue: Delays should decrease after exemption
- If NOT Doze: No change

### Hypothesis 4: Android AlarmManager API Choice

**Theory**: expo-notifications is using the wrong AlarmManager method for our use case

**Test**:
1. Verify what exact AlarmManager method expo-notifications is calling
2. Check if we can force use of `setAlarmClock()` instead of `setExactAndAllowWhileIdle()`

**How to verify**:

Check expo-notifications source code or use native module to log:

```java
// In native Android module
public void scheduleExactAlarm(long triggerTimeMs, PendingIntent intent) {
    AlarmManager alarmManager = (AlarmManager) getSystemService(ALARM_SERVICE);

    // setAlarmClock() is the MOST precise method, but:
    // - Shows icon in status bar
    // - Ignores Doze mode completely
    // - Guaranteed to fire at exact time

    AlarmManager.AlarmClockInfo info = new AlarmManager.AlarmClockInfo(
        triggerTimeMs,
        null // No show intent
    );

    alarmManager.setAlarmClock(info, intent);
}
```

**Expected Result**:
- If `setAlarmClock()` works perfectly: This is the solution (trade-off: status bar icon)
- If still delayed: AlarmManager itself is not the issue

### Hypothesis 5: Notification Priority/Channel Misconfiguration

**Theory**: Despite MAX importance, channel config is causing Android to defer

**Test**:
1. Simplify to ONE notification channel with minimal config
2. Test with different importance levels
3. Check if `interruptionLevel: 'timeSensitive'` is being ignored on Android

**Implementation**:
```typescript
// Test with simplified channel
await Notifications.setNotificationChannelAsync('test_simple', {
  name: 'Test Simple',
  sound: 'athan1.wav',
  importance: Notifications.AndroidImportance.MAX,
  // Remove vibration
  // Remove other config
});

// Schedule test notification with this channel
```

**Expected Result**:
- If channel config is the issue: Simplified channel has better timing
- If NOT channel issue: No change

---

## Phase 4: Advanced Diagnostics

### Step 4.1: Native Alarm Verification

**Goal**: Verify that the alarm is ACTUALLY being scheduled at the correct time in Android's AlarmManager

**Requires**: Creating a native module or using ADB to dump AlarmManager state

**ADB Command** (run while app is installed and has scheduled notifications):
```bash
adb shell dumpsys alarm | grep uk.athan
```

This shows:
- All alarms scheduled by the app
- Exact trigger times
- Alarm type (ELAPSED_REALTIME_WAKEUP, RTC_WAKEUP, etc.)
- Whether they're whitelisted for Doze

**Expected Output**:
```
RTC_WAKEUP #0: Alarm{abc123 type 0 when 1736512200000 uk.athan}
  operation=PendingIntent{...}
  tag=*walarm*:uk.athan
  type=0 when=+23h59m58s
```

**What to look for**:
- `when=` should match our triggerDate timestamp exactly
- `type=` should be 0 (RTC_WAKEUP) or 2 (ELAPSED_REALTIME_WAKEUP)
- Should see ~60 alarms listed

### Step 4.2: Foreground Service Test

**Theory**: Running a foreground service keeps app alive and prevents alarm deferral

**Test**:
1. Create a minimal foreground service that runs during prayer times
2. Keep service running for 5 minutes before each scheduled notification
3. Measure if delays disappear

**Implementation** (requires native Android module or expo-task-manager alternative):

```typescript
// Start foreground service 5 minutes before each prayer
// Keep it running until notification fires
```

**Expected Result**:
- If foreground service eliminates delays: Android was killing app process
- If delays persist: Issue is in AlarmManager, not app lifecycle

### Step 4.3: Compare with Native AlarmManager Direct Integration

**Theory**: expo-notifications abstraction layer introduces timing issues

**Test**:
1. Create a native module that calls AlarmManager directly
2. Schedule ONE test notification using native module
3. Compare timing precision with expo-notifications

**Native Module** (`modules/ExactAlarmModule.kt`):
```kotlin
package uk.athan.exactalarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExactAlarmModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExactAlarm")

    AsyncFunction("scheduleExactAlarm") { triggerTimeMs: Long ->
      val context = appContext.reactContext ?: return@AsyncFunction
      val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

      val intent = Intent(context, AlarmReceiver::class.java)
      val pendingIntent = PendingIntent.getBroadcast(
        context,
        0,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )

      // Use setAlarmClock for maximum precision
      val info = AlarmManager.AlarmClockInfo(triggerTimeMs, null)
      alarmManager.setAlarmClock(info, pendingIntent)
    }
  }
}
```

**Expected Result**:
- If native module has perfect timing: expo-notifications is the bottleneck
- If native module also has delays: Android OS is the limitation

---

## Phase 5: User Feedback Collection

### Step 5.1: Add In-App Feedback Form

**Goal**: Let users report delays and provide device information

**Fields**:
1. Did your notification arrive on time? (Yes / No / Don't know)
2. If delayed, by how much? (30s / 1min / 2min / 3min / 5min+)
3. Device manufacturer (auto-populated)
4. Android version (auto-populated)
5. Was your phone screen on or off?
6. Was your phone charging?
7. Additional comments

### Step 5.2: Analytics Dashboard

**Goal**: Aggregate data from all users

**Metrics to track**:
- Delay rate by OEM
- Delay rate by Android version
- Delay rate by time of day
- Delay rate by day of week
- Correlation between battery level and delays

---

## Success Criteria

We will know we've identified the root cause when:

1. **Pattern Emerges**: Clear correlation between delays and specific device/OEM/Android version
2. **Reproducible**: Can consistently reproduce delays on affected devices
3. **Hypothesis Validated**: One of the hypotheses explains the behavior
4. **Solution Direction**: Have a clear path to either:
   - Eliminate delays entirely, OR
   - Reduce delay frequency/magnitude to acceptable levels (<10 seconds), OR
   - Identify that it's unavoidable and document it

---

## Timeline

**Week 1**: Implement logging and data collection (Phase 1)
**Week 2**: Gather data from test devices and users (Phase 2)
**Week 3**: Analyze patterns and test hypotheses (Phase 3)
**Week 4**: Advanced diagnostics if needed (Phase 4)
**Ongoing**: User feedback collection (Phase 5)

---

## Next Steps

After completing this investigation, we'll have enough data to:
1. Determine if a fix is possible
2. Document affected devices
3. Propose workarounds or alternative approaches
4. Set realistic expectations with users

See `BUG3_PROPOSED_SOLUTIONS.md` for potential solutions based on findings.
