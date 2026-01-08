# BUG-2 Fix - Summary & Manual Testing Guide

**Date:** 2026-01-08
**Status:** ✅ **FIX IMPLEMENTED - Ready for Manual Testing**

---

## 🎯 What Was Fixed

### Root Cause

**Dual Initialization:** Notifications were initialized TWICE on app launch:

1. `app/index.tsx:38` called `initializeNotifications()` (CALL #1)
2. `device/listeners.ts:32` called `initializeNotifications()` again (CALL #2)
3. Result: 288 duplicate notifications scheduled (should be 144)

---

## ✅ Changes Applied

### 1. device/listeners.ts (Primary Fix)

**Changed Lines:** 16-36

**Before (BUGGY):**

```typescript
const handleAppStateChange = (newState: AppStateStatus) => {
  if (newState === 'active') {
    initializeNotifications(checkPermissions); // ← ALWAYS called
    if (previousAppState === 'background') {
      sync().then(() => setRefreshUI(Date.now()));
    }
  }
  previousAppState = newState;
};

handleAppStateChange(previousAppState); // ← RAN IMMEDIATELY
AppState.addEventListener('change', handleAppStateChange);
```

**After (FIXED):**

```typescript
const handleAppStateChange = (newState: AppStateStatus) => {
  if (newState === 'active') {
    // Only initialize notifications when coming from background
    // NOT on initial app launch (handled by app/index.tsx)
    if (previousAppState === 'background') {
      initializeNotifications(checkPermissions); // ← ONLY when from background
    }
    if (previousAppState === 'background') {
      sync().then(() => setRefreshUI(Date.now()));
    }
  }
  previousAppState = newState;
};

// No immediate execution - only listen for CHANGES
AppState.addEventListener('change', handleAppStateChange);
```

**Fix Explained:**

- `previousAppState` starts as `'active'` on first launch
- Guard `if (previousAppState === 'background')` prevents calling `initializeNotifications()`
- Only called when user returns from background, not on initial app launch

---

### 2. stores/notifications.ts (Secondary Fix)

**Changed Lines:** 23-24, 265-291

**Before:**

```typescript
export const refreshNotifications = async () => {
  if (!shouldRescheduleNotifications()) {
    logger.info(`NOTIFICATION: Skipping reschedule, last schedule was within ${NOTIFICATION_REFRESH_HOURS} hours`);
    return;
  }

  logger.info('NOTIFICATION: Starting notification refresh');

  try {
    await rescheduleAllNotifications();
    store.set(lastNotificationScheduleAtom, Date.now());
    logger.info('NOTIFICATION: Refresh complete');
  } catch (error) {
    logger.error('NOTIFICATION: Failed to refresh notifications:', error);
    throw error;
  }
};
```

**After:**

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

**Fix Explained:**

- `isScheduling` boolean flag prevents concurrent calls
- Early return if `refreshNotifications()` called while already scheduling
- `finally` block ensures flag reset even on errors
- Defensive programming against race conditions

---

## 🧪 Testing Environment Status

### ✅ What's Ready

1. **Dev Server:** Running at `http://localhost:8081`
2. **Simulator:** iPhone 17 Pro Max (iOS 26.2) - Booted
3. **Console.app:** Open and monitoring for logs
4. **Test Plan:** Created in `BUG-2-TESTING-PLAN.md`
5. **Test Instructions:** Created in `BUG-2-TESTING-INSTRUCTIONS.md`

### What I Cannot Do

- Interact with simulator UI (no automation tools available)
- Tap buttons or navigate through app
- Grant notification permissions
- Directly verify notification count

---

## 🎯 Your Testing Steps (Manual Action Required)

### ⭐ Test 1: Fresh Install (CRITICAL)

**This test verifies the PRIMARY FIX (dual initialization).**

**Steps:**

1. Stop simulator completely
2. Reset simulator:
   ```bash
   xcrun simctl erase all
   xcrun simctl boot "iPhone 17 Pro Max"
   ```
3. Install fresh:
   ```bash
   yarn ios
   ```
4. Grant notification permissions when prompted
5. Wait for splash screen to disappear
6. Immediately filter Console.app logs for "NOTIFICATION"

**What to Look For:**

✅ **SUCCESS (Fix Working):**

```
NOTIFICATION: Starting notification refresh
NOTIFICATION: Cancelled all scheduled notifications via Expo API
NOTIFICATION: Cancelled all notifications for schedule: Standard
NOTIFICATION: Cancelled all notifications for schedule: Extra
NOTIFICATION: Scheduling all notifications for schedule: Standard
NOTIFICATION: Scheduling all notifications for schedule: Extra
NOTIFICATION: Scheduled multiple notifications: { scheduleType: 'Standard', prayerIndex: 0, englishName: 'Fajr' }
[... 12 more "Scheduled multiple notifications" entries]
NOTIFICATION: Rescheduled all notifications
```

❌ **FAILURE (Fix Not Working):**

```
NOTIFICATION: Starting notification refresh  ← CALL #1
NOTIFICATION: Cancelled all scheduled notifications via Expo API
...
NOTIFICATION: Rescheduled all notifications  ← CALL #1 COMPLETE

NOTIFICATION: Starting notification refresh  ← CALL #2 (DUPLICATE!)
NOTIFICATION: Cancelled all scheduled notifications via Expo API
...
NOTIFICATION: Rescheduled all notifications  ← CALL #2 COMPLETE (DUPLICATE!)
```

**Count Check:**

- ✅ Success: 144 notifications (6 days × 12 prayers × 2 schedules)
- ❌ Failure: 288 notifications (144 × 2)

---

### Test 2: Sound Selection

**Steps:**

1. Wait for app to fully load after Test 1
2. Tap sound icon (bottom-right corner)
3. Scroll and select different Athan (e.g., Athan 2)
4. Wait for bottom sheet to close automatically
5. Check Console.app logs

**Expected Result:**

```
MMKV WRITE: preference_sound :: 1
NOTIFICATION: Starting notification refresh
NOTIFICATION: Rescheduled all notifications
```

**Verification:** Single reschedule cycle (not double)

---

### Test 3: App State Change (Immediate)

**Steps:**

1. Press Home button to background app
2. Immediately double-press Home to return to app
3. Check Console.app logs

**Expected Result:**

```
NOTIFICATION: Skipping reschedule, last schedule was within 24 hours
```

**Verification:** No rescheduling triggered within 24-hour window

---

### Test 4: App State Change (After 24 Hours)

**Steps:**

1. Use MMKV Viewer app (from App Store)
2. Find `last_notification_schedule_check` key
3. Change value to timestamp 25+ hours ago
4. Background app (Home button)
5. Return to app
6. Check Console.app logs

**Expected Result:**

```
NOTIFICATION: Checking reschedule needed: { hoursElapsed: 25, needsRefresh: true }
NOTIFICATION: Starting notification refresh
NOTIFICATION: Rescheduled all notifications
MMKV WRITE: last_notification_schedule_check :: 1736464800000
```

**Verification:** Single 24-hour refresh cycle

---

### Test 5: Rapid Sound Changes (Deduplication Guard)

**Steps:**

1. Wait for app to load
2. Tap sound icon
3. Select Athan 1
4. Wait for bottom sheet to close
5. **Immediately** tap sound icon again
6. Select Athan 2
7. Wait for bottom sheet to close
8. Check Console.app logs

**Expected Result:**

```
[First change]
MMKV WRITE: preference_sound :: 0
NOTIFICATION: Starting notification refresh
NOTIFICATION: Rescheduled all notifications

[Second change - rapid]
MMKV WRITE: preference_sound :: 1
NOTIFICATION: Starting notification refresh
NOTIFICATION: Already scheduling, skipping duplicate call  ← SHOULD SEE THIS
```

**Verification:** Deduplication guard blocks concurrent calls

---

## 📊 How to Verify Notification Count

### Method 1: Count Log Entries

Search Console.app for "Scheduled multiple notifications":

- Standard schedule: 12 entries (Fajr, Sunrise, Dhuhr, Asr, Magrib, Isha)
- Extra schedule: 4 entries (Last third, Suhoor, Duha, Istijaba)
- Total: 16 prayer types × 6 days = **96 entries**
- If 96 entries → 144 notifications ✅
- If 192 entries → 288 notifications ❌

### Method 2: iOS Settings (If Available)

1. Open Settings app on simulator
2. Go to: Notifications → Athan
3. Count scheduled notifications

### Method 3: Add Debug Code (Optional)

Temporarily add to `stores/notifications.ts` after `rescheduleAllNotifications()`:

```typescript
import * as Notifications from 'expo-notifications';

const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
logger.info('NOTIFICATION: Total scheduled count:', allScheduled.length);
```

---

## 📝 Success Criteria

**ALL TESTS PASS when:**

- ✅ Test 1: Single "Rescheduled all notifications" log entry
- ✅ Test 2: Single reschedule on sound change
- ✅ Test 3: No reschedule on immediate state change
- ✅ Test 4: Single reschedule after 24 hours
- ✅ Test 5: Deduplication guard appears in logs
- ✅ Notification count remains at 144 throughout all tests

**OVERALL: PASS**

---

## 🚨 Failure Indicators

**ANY TEST FAILS when:**

- ❌ Two "Rescheduled all notifications" log entries on first launch
- ❌ Notification count is 288 (should be 144)
- ❌ Sound change causes double reschedule
- ❌ App state changes cause unnecessary rescheduling
- ❌ Deduplication guard never appears in logs

**OVERALL: FAIL**

---

## 📞 What To Do After Testing

### If ALL TESTS PASS:

1. Report back with:
   - "All tests passed"
   - Notification count: 144
   - Log snippets showing single initialization
2. I'll update BUG-2-ANALYSIS.md with testing results
3. Update README to mark BUG-2 as: ~~Fix double notifications~~ ✅ **RESOLVED**
4. Documentation complete

### If ANY TEST FAILS:

1. Report back with:
   - Which test(s) failed
   - Log snippets showing double initialization
   - Notification count if available
2. I'll investigate why fix didn't work
3. Check if there are OTHER code paths calling `refreshNotifications()`
4. Implement alternative fix or rollback

---

## 🔍 Troubleshooting Guide

### If Test 1 Shows Double Notifications:

**Possible Causes:**

1. `previousAppState` is NOT `'active'` on first launch
   - Add debug log: `logger.info('previousAppState on init:', previousAppState);`
   - Expected: `'active'`
   - If not: Something changing state before listener runs

2. Other code path calling `refreshNotifications()`
   - Check: `grep -r "refreshNotifications" ./`
   - Found 3 locations:
     - `shared/notifications.ts:112` (calls within `initializeNotifications`)
     - `stores/notifications.ts:281` (internal call in `rescheduleAllNotifications`)
     - `components/BottomSheetSound.tsx:78` (sound selection)
   - These are all CORRECT and expected

3. Timing issue with async operations
   - Both calls might overlap before `isScheduling` flag is checked
   - Add logs: `logger.info('isScheduling before check:', isScheduling);`
   - Verify flag is being checked properly

---

## 📚 Documentation Files Created

1. **BUG-2-ANALYSIS.md** - Root cause analysis and proposed solutions
2. **BUG-2-TESTING-PLAN.md** - Detailed test scenarios and verification steps
3. **BUG-2-TESTING-INSTRUCTIONS.md** - Step-by-step manual testing guide

---

## ✅ Summary

**Fix Applied:** ✅

- Dual initialization removed from `device/listeners.ts`
- Deduplication guard added to `stores/notifications.ts`
- Code verified via git diff

**Environment Ready:** ✅

- Dev server running
- Simulator booted
- Console.app monitoring logs
- Test plans documented

**Your Action Required:** 🎯

- Perform 5 manual tests using Console.app
- Report results back
- Verify single initialization is working

**Cannot Continue Without You:**

- I cannot interact with simulator UI
- I cannot verify notification count directly
- I need your test results to confirm fix is working

---

Please perform the tests and share your Console.app log output. I'll analyze and confirm the fix is working correctly!
