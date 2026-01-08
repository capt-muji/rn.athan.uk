# BUG-2 Fix - Testing Instructions for User

**Date:** 2026-01-08
**Status:** Ready for Manual Testing
**Environment:** iOS 26.2 Simulator, Console.app open

---

## ✅ Changes Applied (Verified)

### 1. device/listeners.ts

```diff
- handleAppStateChange(previousAppState);  // ← REMOVED (was causing duplicate)
-  if (newState === 'active') {
-    initializeNotifications(checkPermissions);  // ← ALWAYS called
+    if (newState === 'active') {
+      if (previousAppState === 'background') {
+        initializeNotifications(checkPermissions);  // ← ONLY when from background
+      }
```

**Fix Explanation:**

- On first launch, `previousAppState` starts as `'active'`
- Old code: Called `initializeNotifications()` immediately (line 32)
- New code: Only calls when `previousAppState === 'background'`
- This ensures notifications initialized ONCE via `app/index.tsx`

### 2. stores/notifications.ts

```diff
+ let isScheduling = false;

  export const refreshNotifications = async () => {
+   if (isScheduling) {
+     logger.info('NOTIFICATION: Already scheduling, skipping duplicate call');
+     return;
+   }
+   isScheduling = true;
+
    logger.info('NOTIFICATION: Starting notification refresh');
    try {
      await rescheduleAllNotifications();
      ...
    } finally {
+     isScheduling = false;
    }
```

**Fix Explanation:**

- Guard flag prevents concurrent scheduling calls
- `finally` block ensures flag reset even on errors
- Defensive programming against race conditions

---

## 🎯 What Needs Testing (User Action Required)

### Test 1: Fresh Install (PRIMARY TEST) ⭐

**This is the CRITICAL test to verify the fix works.**

**Steps:**

1. Close all simulator windows
2. Reset simulator completely:
   ```bash
   xcrun simctl erase all
   xcrun simctl boot "iPhone 17 Pro Max"
   ```
3. Reinstall app:
   ```bash
   yarn ios
   ```
4. **Grant notification permissions** when prompted
5. Wait for splash screen to disappear
6. Immediately open Console.app (already open, filter for "NOTIFICATION")

**What to Look For:**

✅ **SUCCESS (Fix Working):**

```
NOTIFICATION: Starting notification refresh
NOTIFICATION: Cancelled all scheduled notifications via Expo API
NOTIFICATION: Cancelled all notifications for schedule: Standard
NOTIFICATION: Cancelled all notifications for schedule: Extra
NOTIFICATION: Scheduling all notifications for schedule: Standard
NOTIFICATION: Scheduling all notifications for schedule: Extra
[Multiple lines of: NOTIFICATION: Scheduled multiple notifications...]
NOTIFICATION: Rescheduled all notifications
```

**Count:** ONE occurrence of "Rescheduled all notifications"

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

**Count:** TWO occurrences of "Rescheduled all notifications"

**Expected Notification Count:**

- ✅ Success: 144 notifications (6 days × 12 prayers × 2 schedules)
- ❌ Failure: 288 notifications (144 × 2)

---

### Test 2: Sound Selection

**Steps:**

1. Wait for app to fully load after first test
2. Tap sound icon (bottom-right corner)
3. Scroll to different Athan (e.g., Athan 2 or Athan 5)
4. Tap to select
5. Wait for bottom sheet to close automatically
6. Watch Console.app logs

**What to Look For:**

```
MMKV WRITE: preference_sound :: 1
NOTIFICATION: Starting notification refresh
NOTIFICATION: Cancelled all scheduled notifications via Expo API
...
NOTIFICATION: Rescheduled all notifications
```

**Expected:** ONE reschedule cycle

---

### Test 3: App State Change (Immediate)

**Steps:**

1. Wait 2-3 seconds after first launch
2. Press Home button to background app
3. Immediately double-press Home to return to app
4. Watch Console.app logs

**What to Look For:**

```
NOTIFICATION: Skipping reschedule, last schedule was within 24 hours
NOTIFICATION: Checking reschedule needed: { hoursElapsed: 0, needsRefresh: false }
```

**Expected:** NO rescheduling (within 24 hours)

---

### Test 4: App State Change (After 24 Hours)

**Steps:**

1. Close simulator completely
2. Edit MMKV to simulate 25-hour gap:
   - Open MMKV Viewer app from App Store
   - Find `last_notification_schedule_check` key
   - Change value to timestamp 25 hours ago
   - Example: `17363780000` (current) → `1736288000000` (25 hours ago)
3. Reopen simulator:
   ```bash
   yarn ios
   ```
4. Wait for app to load
5. Background app (Home button)
6. Return to app
7. Watch Console.app logs

**What to Look For:**

```
NOTIFICATION: Checking reschedule needed: { hoursElapsed: 25, needsRefresh: true }
NOTIFICATION: Starting notification refresh
NOTIFICATION: Rescheduled all notifications
MMKV WRITE: last_notification_schedule_check :: [new timestamp]
```

**Expected:** ONE reschedule cycle (correct 24-hour refresh)

---

### Test 5: Rapid Sound Changes (Deduplication Guard)

**Steps:**

1. Launch app (already running)
2. Tap sound icon
3. Select Athan 1
4. Wait for sheet to close
5. **Immediately** tap sound icon again
6. Select Athan 2
7. Wait for sheet to close
8. Watch Console.app logs

**What to Look For:**

```
[First sound change]
MMKV WRITE: preference_sound :: 0
NOTIFICATION: Starting notification refresh
NOTIFICATION: Rescheduled all notifications

[Second sound change - rapid]
MMKV WRITE: preference_sound :: 1
NOTIFICATION: Starting notification refresh
NOTIFICATION: Already scheduling, skipping duplicate call  ← SHOULD SEE THIS
```

**Expected:** Second call blocked by `isScheduling` guard

---

## 🔍 How to Check Notification Count (Optional)

### Method 1: iOS Settings

1. Open Settings app on simulator
2. Go to: Notifications → Athan
3. Count scheduled notifications

### Method 2: Expo Developer Tools (Advanced)

Add temporary debug code to check count:

```typescript
// In stores/notifications.ts, after rescheduleAllNotifications()
import * as Notifications from 'expo-notifications';

const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
logger.info('NOTIFICATION: Total scheduled count:', allScheduled.length);
```

### Method 3: Log Count

Count "Scheduled multiple notifications" log entries:

- 12 entries for Standard schedule (Fajr to Isha)
- 4 entries for Extra schedule (Last third, Suhoor, Duha, Istijaba)
- Total: 16 prayer types × 6 days = **96 entries**
- If 96 entries → 144 notifications working correctly
- If 192 entries → 288 notifications (BUG!)

---

## 📊 Test Results Template

Please fill this in after testing:

```
Test 1: Fresh Install
Result: [SUCCESS / FAILURE]
Evidence: [Log snippet showing single or double initialization]
Notification Count: [144 or 288]

Test 2: Sound Selection
Result: [SUCCESS / FAILURE]
Evidence: [Log snippet]

Test 3: App State Change (Immediate)
Result: [SUCCESS / FAILURE]
Evidence: [Log snippet]

Test 4: App State Change (24 Hours)
Result: [SUCCESS / FAILURE]
Evidence: [Log snippet]

Test 5: Rapid Sound Changes
Result: [SUCCESS / FAILURE]
Evidence: [Log snippet showing "Already scheduling, skipping duplicate call"]

Overall Status: [PASS / FAIL]
```

---

## 🚨 Troubleshooting

### If Test 1 Shows DOUBLE Notifications:

**Possible Causes:**

1. `previousAppState` is NOT `'active'` on first launch
   - Check log: Add `logger.info('previousAppState:', previousAppState);` before line 19
   - Expected: `'active'`
   - If not: Investigate why state is wrong

2. Other code path calling `refreshNotifications()`
   - Search for other callers: `grep -r "refreshNotifications" ./`
   - Found 3 locations (see grep results)
   - Ensure no other triggers

3. Timing issue with async operations
   - Both calls overlap before `isScheduling` flag takes effect
   - Add `logger.info('isScheduling flag set to true');` after line 276

### If Deduplication Guard Doesn't Work:

**Possible Causes:**

1. Multiple instances of `isScheduling` flag
   - Check if `let isScheduling` declared elsewhere
   - Should only be ONE instance in module

2. Flag not being checked properly
   - Add more logs: `logger.info('isScheduling check:', isScheduling);`
   - Verify order of operations

---

## ✅ Success Criteria

**All tests PASS when:**

- ✅ Test 1: Single "Rescheduled all notifications" log entry
- ✅ Test 2: Single reschedule on sound change
- ✅ Test 3: No reschedule on immediate state change
- ✅ Test 4: Single reschedule after 24 hours
- ✅ Test 5: Deduplication guard appears in logs

**Overall:**

- Notification count remains at 144 throughout all tests
- No duplicate log entries
- Deduplication guard works as expected

---

## 📝 Next Steps

### If ALL TESTS PASS:

1. Document test results in BUG-2-ANALYSIS.md
2. Update README to mark BUG-2 as: ~~Fix double notifications~~ ✅ **RESOLVED**
3. Commit changes with message: "Fix BUG-2: Remove dual notification initialization"
4. Create PR or notify user of completion

### If ANY TEST FAILS:

1. Document failure in BUG-2-ANALYSIS.md
2. Investigate root cause based on log evidence
3. Implement alternative fix
4. Re-test until all tests pass

---

## 🎯 Your Role

**I Cannot:**

- Interact with simulator UI (tap buttons, navigate screens)
- Directly check notification count
- Control app execution flow

**I Have:**

- Applied fix correctly (verified via git diff)
- Started dev server (running at localhost:8081)
- Opened Console.app for log monitoring
- Created comprehensive test plan
- Documented success/failure criteria

**You Need To:**

- Perform the 5 tests above
- Share Console.app log snippets
- Report which tests passed/failed
- Provide notification count if visible

---

## 📞 Quick Reference

**Log Keywords to Search in Console.app:**

- `NOTIFICATION:` - All notification-related logs
- `Rescheduled all notifications` - Indicates reschedule completed
- `Starting notification refresh` - Indicates refresh triggered
- `Already scheduling, skipping duplicate call` - Deduplication guard working

**Expected Behavior:**

- Fresh install: 1 reschedule
- Sound change: 1 reschedule
- 24h refresh: 1 reschedule
- Concurrent call: Guard blocks duplicate

**Bug Behavior (BEFORE FIX):**

- Fresh install: 2 reschedules (duplicate)
- Any operation: Risk of double reschedule

---

Please perform the tests and share your results. I'll analyze and confirm the fix is working or create a rollback plan if needed.
