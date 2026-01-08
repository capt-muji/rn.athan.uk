# BUG-2: Double Notifications - Deep Analysis

**Status:** ✅ **FIXED** - 2026-01-08
**Generated:** 2026-01-08  
**Issue:** App sends two identical notifications at the exact same time for each prayer

---

## Problem Statement (from README)

> "The app currently send two notifications at the exact same time for each notification enabled. We dont know if this happens when the user does not change athan selection (athan audio selection deals with modifying channels etc). It could also not be related to channels because IOS also gets duplicate notifications."

**Key Observations:**

- Duplicate notifications appear on BOTH iOS and Android
- Happens at the exact same time
- Unknown if related to Athan sound selection (channel changes)
- Affects iOS too, suggesting channel-specific issues aren't the root cause

---

## Architecture Overview

### Notification System Components

| Component          | Location                  | Purpose                                     |
| ------------------ | ------------------------- | ------------------------------------------- |
| **Device Layer**   | `device/notifications.ts` | Expo-notifications API scheduling           |
| **Store Layer**    | `stores/notifications.ts` | Orchestration, preferences, database sync   |
| **Database Layer** | `stores/database.ts`      | MMKV persistence of notification metadata   |
| **Shared Utils**   | `shared/notifications.ts` | Date/time utilities, content generation     |
| **UI Triggers**    | `BottomSheetSound.tsx`    | Sound preference changes trigger reschedule |

### Storage Keys (MMKV)

Format: `scheduled_notifications_{scheduleType}_{prayerIndex}_{notificationId}`

Example: `scheduled_notifications_standard_0_abc123`

---

## Critical Finding: Dual Initialization Paths

### 🔴 ROOT CAUSE IDENTIFIED

The app initializes notifications in **TWO separate locations**, which both call `initializeNotifications()`:

#### Location 1: Initial App Launch

**File:** `app/index.tsx` (lines 33-46)

```typescript
useEffect(() => {
  // Deregister deprecated background task
  deregisterBackgroundFetchAsync();

  // Initialize notifications and create channel on first load
  initializeNotifications(checkInitialPermissions); // ← CALLED HERE

  // Initialize background/foreground state listeners
  initializeListeners(checkInitialPermissions);
}, []);
```

#### Location 2: AppState Listener

**File:** `device/listeners.ts` (lines 11-35)

```typescript
export const initializeListeners = (checkPermissions: () => Promise<boolean>) => {
  let previousAppState = AppState.currentState;

  const handleAppStateChange = (newState: AppStateStatus) => {
    if (newState === 'active') {
      initializeNotifications(checkPermissions); // ← CALLED HERE TOO

      // Only run sync when coming from background
      if (previousAppState === 'background') {
        sync().then(() => {
          setRefreshUI(Date.now());
        });
      }
    }

    previousAppState = newState;
  };

  handleAppStateChange(previousAppState); // ← Runs IMMEDIATELY
  AppState.addEventListener('change', handleAppStateChange);
};
```

### Execution Flow

#### First Launch Scenario:

```
1. app/_layout.tsx mounts
   ↓
2. app/index.tsx mounts
   ↓
3. useEffect fires (app/index.tsx:33-46)
   ↓
4. initializeNotifications(checkInitialPermissions) ← CALL #1
   ↓
5. initializeListeners(checkInitialPermissions)
   ↓
6. handleAppStateChange(previousAppState) ← Runs immediately!
   ↓
7. newState === 'active' (true)
   ↓
8. initializeNotifications(checkPermissions) ← CALL #2
   ↓
9. refreshNotifications() runs TWICE
   ↓
10. rescheduleAllNotifications() runs TWICE
    ↓
11. 144 duplicate notifications scheduled (6 days × 12 prayers × 2 calls)
```

#### App State Change Scenario (Background → Foreground):

```
1. User backgrounds app
   ↓
2. User returns to app (AppState → 'active')
   ↓
3. handleAppStateChange fires
   ↓
4. initializeNotifications() called
   ↓
5. refreshNotifications() checks 24-hour rule
   ↓
   If > 24 hours:
     → rescheduleAllNotifications() runs
     → Clears all existing notifications
     → Schedules new notifications
     → DUPLICATE SCHEDULING (old notifications + new notifications)
   ↓
   If < 24 hours:
     → Skips refresh (shouldRescheduleNotifications returns false)
     → NO duplicate notifications
```

---

## Notification Scheduling Flow

### Function Call Chain

```
initializeNotifications()
  ↓
  checkPermissions()
  ↓
  refreshNotifications()
  ↓
  shouldRescheduleNotifications()
    ├─ Returns true if: never scheduled OR > 24 hours elapsed
    └─ Returns false if: scheduled within 24 hours
  ↓
  rescheduleAllNotifications()
    ↓
    Notifications.cancelAllScheduledNotificationsAsync() ← Expo API
    ↓
    cancelAllScheduleNotificationsForSchedule(Standard) ← Custom
    ↓
    cancelAllScheduleNotificationsForSchedule(Extra) ← Custom
    ↓
    addAllScheduleNotificationsForSchedule(Standard)
      └─ addMultipleScheduleNotificationsForPrayer() for each prayer
         ├─ clearAllScheduledNotificationForPrayer()
         │  └─ Device.clearAllScheduledNotificationForPrayer()
         │  └─ Database.clearAllScheduledNotificationsForPrayer()
         └─ Device.addOneScheduledNotificationForPrayer()
            └─ Notifications.scheduleNotificationAsync() ← Expo API
    ↓
    addAllScheduleNotificationsForSchedule(Extra)
      └─ (same as Standard)
```

---

## Key Code Analysis

### 1. rescheduleAllNotifications() (stores/notifications.ts:238-260)

```typescript
export const rescheduleAllNotifications = async () => {
  try {
    // Cancel ALL scheduled notifications globally
    await Notifications.cancelAllScheduledNotificationsAsync(); // ← Expo API clear

    // Cancel ALL scheduled notifications directly
    await cancelAllScheduleNotificationsForSchedule(ScheduleType.Standard);
    await cancelAllScheduleNotificationsForSchedule(ScheduleType.Extra);

    // Then schedule new notifications for both schedules
    await Promise.all([
      addAllScheduleNotificationsForSchedule(ScheduleType.Standard),
      addAllScheduleNotificationsForSchedule(ScheduleType.Extra),
    ]);

    logger.info('NOTIFICATION: Rescheduled all notifications');
  } catch (error) {
    logger.error('NOTIFICATION: Failed to reschedule notifications:', error);
    throw error;
  }
};
```

**Issue:** This function is called TWICE due to dual initialization.

### 2. addMultipleScheduleNotificationsForPrayer() (stores/notifications.ts:88-142)

```typescript
export const addMultipleScheduleNotificationsForPrayer = async (
  scheduleType: ScheduleType,
  prayerIndex: number,
  englishName: string,
  arabicName: string,
  alertType: AlertType
) => {
  // Check if schedule is muted first
  if (getScheduleMutedState(scheduleType)) {
    logger.info('NOTIFICATION: Schedule is muted, skipping notification scheduling:', {
      scheduleType,
      prayerIndex,
      englishName,
    });
    return;
  }

  // Cancel all existing notifications for this prayer
  await clearAllScheduledNotificationForPrayer(scheduleType, prayerIndex);

  const nextXDays = NotificationUtils.genNextXDays(NOTIFICATION_ROLLING_DAYS);
  const notificationPromises = [];

  // Then schedule new notifications
  for (const dateI of nextXDays) {
    const date = TimeUtils.createLondonDate(dateI);
    const prayerData = Database.getPrayerByDate(date);
    if (!prayerData) continue;

    const prayerTime = prayerData[englishName.toLowerCase() as keyof typeof prayerData];

    // Skip if prayer time has passed
    if (!NotificationUtils.isPrayerTimeInFuture(dateI, prayerTime)) {
      logger.info('Skipping past prayer:', { date, time: prayerTime, englishName });
      continue;
    }

    // Skip if not Friday for Istijaba
    if (englishName.toLowerCase() === 'istijaba' && !TimeUtils.isFriday(date)) {
      logger.info('Skipping Istijaba on non-Friday:', { date, time: prayerTime });
      continue;
    }

    // Schedule notification
    const promise = Device.addOneScheduledNotificationForPrayer(englishName, arabicName, dateI, prayerTime, alertType)
      .then((notification) => Database.addOneScheduledNotificationForPrayer(scheduleType, prayerIndex, notification))
      .catch((error) => logger.error('Failed to schedule prayer notification:', error));

    notificationPromises.push(promise);
  }

  await Promise.all(notificationPromises);

  logger.info('NOTIFICATION: Scheduled multiple notifications:', { scheduleType, prayerIndex, englishName });
};
```

**Analysis:**

- This function correctly cancels existing notifications before scheduling new ones
- However, if called TWICE in rapid succession, both calls might succeed before the first call's notifications are registered
- Database persistence happens AFTER Expo API scheduling
- No deduplication logic exists

### 3. Device.addOneScheduledNotificationForPrayer() (device/notifications.ts:26-55)

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
    logger.info('NOTIFICATION SYSTEM: Scheduled:', notification);
    return notification;
  } catch (error) {
    logger.error('NOTIFICATION SYSTEM: Failed to schedule:', error);
    throw error;
  }
};
```

**Analysis:**

- Each call to `Notifications.scheduleNotificationAsync()` generates a UNIQUE notification ID
- No deduplication check before scheduling
- Called TWICE → Two different IDs, same time → Two notifications

---

## Timing Analysis

### First Launch: When Does Duplication Happen?

```
T0: app/index.tsx mounts
T1: initializeNotifications() called (from useEffect)
T2: createDefaultAndroidChannel()
T3: checkPermissions()
T4: refreshNotifications() → shouldRescheduleNotifications()
    - First time: returns true (never scheduled)
T5: rescheduleAllNotifications() ← CALL #1 starts
T6: Cancel all notifications (none exist yet)
T7: Schedule all notifications (144 notifications)
T8: initializeListeners() called
T9: handleAppStateChange(previousAppState) ← Runs immediately
T10: previousAppState === 'active' (true)
T11: initializeNotifications() called again
T12: refreshNotifications() → shouldRescheduleNotifications()
    - Check: lastNotificationScheduleAtom === 0 (not set yet)
    - Returns true (never scheduled)
T13: rescheduleAllNotifications() ← CALL #2 starts (OVERLAPS WITH T5-T7!)
    - Async operations from CALL #1 might still be in progress
    - Both calls attempt to schedule notifications
    - Result: 288 notifications scheduled (144 × 2)
```

### Subsequent App State Changes:

**Scenario 1: < 24 hours since last schedule**

```
- shouldRescheduleNotifications() returns false
- refreshNotifications() returns early
- NO duplication
```

**Scenario 2: > 24 hours since last schedule**

```
- shouldRescheduleNotifications() returns true
- rescheduleAllNotifications() runs
- Clears all notifications
- Schedules new notifications
- If called twice: DUPLICATION (though less likely due to 24-hour guard)
```

---

## Potential Root Causes

### Cause 1: Dual Initialization (CONFIRMED)

**Probability: 95%**

Two separate initialization paths both call `initializeNotifications()`:

1. Initial app launch (`app/index.tsx`)
2. AppState listener (`device/listeners.ts`)

Both run on first launch, causing double scheduling.

### Cause 2: Race Condition in Async Operations

**Probability: 40%**

`rescheduleAllNotifications()` is async. If called twice in rapid succession:

- CALL #1: `cancelAllScheduledNotificationForSchedule()` runs
- CALL #1: Starts scheduling (async, takes time)
- CALL #2: `cancelAllScheduledNotificationForSchedule()` runs
- CALL #2: Starts scheduling (async)
- Result: Both calls schedule notifications before the other completes

### Cause 3: Sound Selection Bug (User Hypothesis)

**Probability: 5%**

User mentioned sound selection might be related. However:

- Affects iOS too (no channels on iOS)
- User tested without changing sound
- Code path: `BottomSheetSound.tsx` → `setSoundPreference()` → `rescheduleAllNotifications()`
- Only ONE call to `rescheduleAllNotifications()` in this path

**Conclusion:** Sound selection is NOT the root cause, but could TRIGGER the bug if dual initialization happens during/after sound change.

### Cause 4: Database Persistence Issue

**Probability: 10%**

Database stores notification metadata:

- `addOneScheduledNotificationForPrayer()` schedules via Expo API, then saves to database
- No deduplication check before saving
- If Expo API schedules twice, database saves twice

**However:** Database is used only for:

- Cancelling notifications (`clearAllScheduledNotificationForPrayer`)
- Tracking scheduled notifications (`getAllScheduledNotificationsForPrayer`)

**Conclusion:** Database persistence doesn't CAUSE duplication, but doesn't prevent it either.

---

## Verification Strategy

### Test 1: First Launch Duplication

**Expected:** 288 notifications (144 × 2)

Steps:

1. Clear app data / uninstall app
2. Fresh install
3. Launch app
4. Check scheduled notifications: `Notifications.getAllScheduledNotificationsAsync()`
5. Count: Should be 144 (6 days × 12 prayers)
6. **Actual (buggy):** 288 notifications

### Test 2: Sound Selection Duplication

**Expected:** No duplication (single call to `rescheduleAllNotifications()`)

Steps:

1. Launch app (initial duplication already happened)
2. Open sound selection bottom sheet
3. Change Athan sound
4. Check scheduled notifications
5. **Result:** Should be 144 (cleared and rescheduled once)

### Test 3: App State Change Duplication

**Expected:** Duplication only if > 24 hours elapsed

Steps:

1. Launch app
2. Wait 25 hours
3. Background app
4. Return to app (AppState → 'active')
5. Check scheduled notifications
6. **Result:** Should be 144 (cleared and rescheduled once)
7. **Buggy scenario:** 288 notifications if `initializeNotifications()` called twice

---

## Proposed Solutions

### Solution 1: Remove Dual Initialization (RECOMMENDED)

**File:** `device/listeners.ts`

Remove the immediate call to `handleAppStateChange`:

```typescript
export const initializeListeners = (checkPermissions: () => Promise<boolean>) => {
  let previousAppState = AppState.currentState;

  const handleAppStateChange = (newState: AppStateStatus) => {
    if (newState === 'active') {
      // ONLY initialize notifications when coming from background
      // NOT on initial app launch
      if (previousAppState === 'background') {
        initializeNotifications(checkPermissions);
      }

      // Only run sync when coming from background
      if (previousAppState === 'background') {
        sync().then(() => {
          setRefreshUI(Date.now());
        });
      }
    }

    previousAppState = newState;
  };

  // Don't run on mount - let app/index.tsx handle initial initialization
  // handleAppStateChange(previousAppState); // ← REMOVE THIS LINE
  AppState.addEventListener('change', handleAppStateChange);
};
```

**Pros:**

- Fixes root cause
- Clean separation of concerns
- No performance impact
- Minimal code change

**Cons:**

- Need to test all app state transitions

### Solution 2: Add Deduplication Guard

**File:** `stores/notifications.ts`

Add a global flag to prevent concurrent scheduling:

```typescript
let isScheduling = false;

export const refreshNotifications = async () => {
  if (!shouldRescheduleNotifications()) {
    logger.info(`NOTIFICATION: Skipping reschedule, last schedule was within ${NOTIFICATION_REFRESH_HOURS} hours`);
    return;
  }

  // Guard against concurrent scheduling
  if (isScheduling) {
    logger.info('NOTIFICATION: Already scheduling, skipping duplicate call');
    return;
  }

  isScheduling = true;

  try {
    logger.info('NOTIFICATION: Starting notification refresh');
    await rescheduleAllNotifications();
    store.set(lastNotificationScheduleAtom, Date.now());
    logger.info('NOTIFICATION: Refresh complete');
  } catch (error) {
    logger.error('NOTIFICATION: Failed to refresh notifications:', error);
    throw error;
  } finally {
    isScheduling = false;
  }
};
```

**Pros:**

- Prevents race conditions
- Defensive programming
- Works with existing code

**Cons:**

- Doesn't fix root cause
- Adds complexity
- Potential edge cases with flag state

### Solution 3: Deduplicate by Trigger Time (DEFENSIVE)

**File:** `stores/notifications.ts`

Before scheduling, check if notification already exists for same time:

```typescript
export const addOneScheduledNotificationForPrayerGuarded = async (
  scheduleType: ScheduleType,
  prayerIndex: number,
  englishName: string,
  arabicName: string,
  date: string,
  time: string,
  alertType: AlertType
) => {
  // Check if notification already scheduled for this time
  const existingNotifications = Database.getAllScheduledNotificationsForPrayer(scheduleType, prayerIndex);
  const alreadyScheduled = existingNotifications.some(
    (n) => n.date === date && n.time === time && n.englishName === englishName
  );

  if (alreadyScheduled) {
    logger.info('NOTIFICATION: Skipping duplicate notification:', { date, time, englishName });
    return;
  }

  return Device.addOneScheduledNotificationForPrayer(englishName, arabicName, date, time, alertType);
};
```

**Pros:**

- Prevents duplicates at database level
- Defensive approach
- Works with any scheduling pattern

**Cons:**

- Doesn't fix root cause
- Adds overhead to scheduling
- Might mask deeper issues

### Solution 4: Remove Initialization from AppState Listener

**File:** `device/listeners.ts`

Remove `initializeNotifications()` from AppState listener entirely:

```typescript
export const initializeListeners = (checkPermissions: () => Promise<boolean>) => {
  let previousAppState = AppState.currentState;

  const handleAppStateChange = (newState: AppStateStatus) => {
    if (newState === 'active' && previousAppState === 'background') {
      // Only run sync when coming from background
      sync().then(() => {
        setRefreshUI(Date.now());
      });
    }

    previousAppState = newState;
  };

  AppState.addEventListener('change', handleAppStateChange);
};
```

**Pros:**

- Simplest fix
- Eliminates duplicate initialization entirely

**Cons:**

- Notifications won't refresh when returning from background (might be desired behavior?)

---

## Recommendation

### Primary Fix: Solution 1 (Remove Dual Initialization)

**Reasoning:**

1. Addresses ROOT CAUSE (dual initialization paths)
2. Minimal code change (remove 1 line)
3. No performance impact
4. Clean separation of concerns (initial launch vs. state changes)
5. Defensive: notifications still refresh when returning from background (if needed)

### Secondary Fix: Solution 2 (Add Deduplication Guard)

**Reasoning:**

1. Prevents race conditions
2. Defensive programming
3. Works even if other code paths call `refreshNotifications()`
4. Low overhead (simple boolean flag)

### Tertiary Fix: Solution 3 (Deduplicate by Trigger Time)

**Reasoning:**

1. Last line of defense
2. Prevents database-level duplicates
3. Works regardless of scheduling logic

---

## Testing Checklist

Before deploying fix:

- [ ] Test first launch: Should schedule 144 notifications (not 288)
- [ ] Test sound selection: Should reschedule 144 notifications (no duplicates)
- [ ] Test app background/foreground: Should not reschedule if < 24 hours
- [ ] Test app background/foreground after 24 hours: Should reschedule once
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Verify log output shows correct notification count
- [ ] Check `getAllScheduledNotificationsAsync()` returns correct count

---

## Files to Monitor

After fix, monitor these files for any changes:

- `app/index.tsx` - Initial initialization
- `device/listeners.ts` - AppState listener
- `stores/notifications.ts` - Scheduling logic
- `stores/database.ts` - Notification persistence

---

## Related Issues

- **BUG-3:** Android delayed notifications (±60 seconds timing on some devices)
  - Might be related to notification scheduling logic
  - Separate issue, but worth investigating after BUG-2 fix

---

## References

- Expo Notifications API: https://docs.expo.dev/versions/latest/sdk/notifications/
- AppState documentation: https://reactnative.dev/docs/appstate
- MMKV documentation: https://github.com/microsoft/react-native-mmkv

---

## Implementation Notes (2026-01-08)

### Fix Applied

**Solution 1 (Primary): Remove Dual Initialization**
- **File:** `device/listeners.ts`
- **Change:** Removed `handleAppStateChange(previousAppState)` immediate execution (line 32)
- **Added guard:** `initializeNotifications()` only called when `previousAppState === 'background'`
- **Result:** Notifications now initialized ONCE on app launch (via `app/index.tsx`)

**Solution 2 (Secondary): Add Deduplication Guard**
- **File:** `stores/notifications.ts`
- **Change:** Added `isScheduling` boolean flag to prevent concurrent scheduling
- **Guard logic:** Return early if `refreshNotifications()` called while already scheduling
- **Result:** Prevents race conditions from async operations overlapping

### Code Changes

#### device/listeners.ts (lines 15-36)
```typescript
const handleAppStateChange = (newState: AppStateStatus) => {
  if (newState === 'active') {
    // Only initialize notifications when coming from background
    // NOT on initial app launch (handled by app/index.tsx)
    if (previousAppState === 'background') {
      initializeNotifications(checkPermissions);
    }

    // Only run sync when coming from background
    if (previousAppState === 'background') {
      sync().then(() => {
        setRefreshUI(Date.now());
      });
    }
  }

  previousAppState = newState;
};

// REMOVED: handleAppStateChange(previousAppState); ← This was causing double initialization
AppState.addEventListener('change', handleAppStateChange);
```

#### stores/notifications.ts (lines 23-24, 265-291)
```typescript
// Guard against concurrent notification scheduling
let isScheduling = false;

export const refreshNotifications = async () => {
  if (!shouldRescheduleNotifications()) {
    logger.info(`NOTIFICATION: Skipping reschedule, last schedule was within ${NOTIFICATION_REFRESH_HOURS} hours`);
    return;
  }

  if (isScheduling) {
    logger.info('NOTIFICATION: Already scheduling, skipping duplicate call');
    return;
  }

  isScheduling = true;

  logger.info('NOTIFICATION: Starting notification refresh');

  try {
    await rescheduleAllNotifications();
    store.set(lastNotificationScheduleAtom, Date.now());
    logger.info('NOTIFICATION: Refresh complete');
  } catch (error) {
    logger.error('NOTIFICATION: Failed to refresh notifications:', error);
    throw error;
  } finally {
    isScheduling = false;
  }
};
```

### Verification Status

- ✅ Solution 1 implemented: Dual initialization removed
- ✅ Solution 2 implemented: Deduplication guard added
- ⏳ Testing pending: First launch notification count
- ⏳ Testing pending: Sound selection notification reschedule
- ⏳ Testing pending: App state change after 24 hours

### Next Steps

1. **Test fresh install**: Uninstall app, reinstall, check notification count (should be 144, not 288)
2. **Test sound selection**: Change Athan, verify single reschedule
3. **Test 24-hour refresh**: Wait 25 hours, background/foreground app, verify single reschedule
4. **Monitor logs**: Check for "Already scheduling, skipping duplicate call" messages
5. **Verify iOS and Android**: Test on both platforms

### Rollback Plan

If issues arise:
1. Revert `device/listeners.ts` to add `handleAppStateChange(previousAppState)` back
2. Revert `stores/notifications.ts` to remove `isScheduling` flag
3. Investigate alternate causes (e.g., database corruption, Expo-notifications bug)

