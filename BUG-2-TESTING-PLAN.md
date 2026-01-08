# BUG-2 Fix Testing Plan

**Date:** 2026-01-08
**Status:** In Progress
**Test Environment:** iOS 26.2 Simulator

---

## Fix Summary

**Problem:** Double notifications on app launch due to dual initialization

**Solution:**

1. Removed `handleAppStateChange(previousAppState)` immediate execution in `device/listeners.ts`
2. Added guard: `initializeNotifications()` only called when `previousAppState === 'background'`
3. Added deduplication guard: `isScheduling` flag in `stores/notifications.ts`

---

## Test Scenarios

### ✅ Scenario 1: First Launch (Fresh Install)

**Expected Behavior:**

- App initializes notifications ONCE (via `app/index.tsx`)
- AppState listener DOES NOT call `initializeNotifications()` on first launch
- Notification count: 144 (6 days × 12 prayers × 2 schedules)
- NO duplicate notifications

**How to Verify:**

1. Fresh install / clear app data
2. Launch app
3. Check logs for:
   ```
   NOTIFICATION: Starting notification refresh
   NOTIFICATION: Cancelled all scheduled notifications via Expo API
   NOTIFICATION: Scheduling all notifications for schedule: Standard
   NOTIFICATION: Scheduling all notifications for schedule: Extra
   NOTIFICATION: Scheduled multiple notifications: { scheduleType: 'Standard', prayerIndex: 0, englishName: 'Fajr' }
   ...
   NOTIFICATION: Rescheduled all notifications
   ```
4. Verify only ONE set of "Rescheduled all notifications" log entry
5. If bug exists: TWO sets of logs, duplicate "NOTIFICATION: Starting notification refresh"

**Expected Log Output:**

```
MMKV WRITE: last_notification_schedule_check :: 1736378400000
NOTIFICATION: Starting notification refresh
NOTIFICATION: Cancelled all scheduled notifications via Expo API
NOTIFICATION: Cancelled all notifications for schedule: Standard
NOTIFICATION: Cancelled all notifications for schedule: Extra
NOTIFICATION: Scheduling all notifications for schedule: Standard
NOTIFICATION: Scheduling all notifications for schedule: Extra
NOTIFICATION: Rescheduled all notifications
```

**Bug Log Output (BEFORE FIX):**

```
MMKV WRITE: last_notification_schedule_check :: 1736378400000
NOTIFICATION: Starting notification refresh  ← CALL #1
NOTIFICATION: Cancelled all scheduled notifications via Expo API
NOTIFICATION: Cancelled all notifications for schedule: Standard
NOTIFICATION: Cancelled all notifications for schedule: Extra
NOTIFICATION: Scheduling all notifications for schedule: Standard
NOTIFICATION: Scheduling all notifications for schedule: Extra
NOTIFICATION: Rescheduled all notifications  ← CALL #1 DONE
NOTIFICATION: Starting notification refresh  ← CALL #2 (DUPLICATE!)
NOTIFICATION: Cancelled all scheduled notifications via Expo API
NOTIFICATION: Cancelled all notifications for schedule: Standard
NOTIFICATION: Cancelled all notifications for schedule: Extra
NOTIFICATION: Scheduling all notifications for schedule: Standard
NOTIFICATION: Scheduling all notifications for schedule: Extra
NOTIFICATION: Rescheduled all notifications  ← CALL #2 DONE
```

---

### ✅ Scenario 2: Sound Selection

**Expected Behavior:**

- User opens sound selection bottom sheet
- Selects different Athan sound
- `rescheduleAllNotifications()` called ONCE
- Notification count: 144 (cleared and rescheduled)
- NO duplicate notifications

**How to Verify:**

1. Launch app
2. Tap sound icon to open bottom sheet
3. Tap different Athan sound
4. Close bottom sheet
5. Check logs for:
   ```
   NOTIFICATION: Starting notification refresh
   NOTIFICATION: Rescheduled all notifications
   ```
6. Verify only ONE reschedule cycle

**Expected Log Output:**

```
MMKV WRITE: preference_sound :: 1
NOTIFICATION: Starting notification refresh
NOTIFICATION: Cancelled all scheduled notifications via Expo API
...
NOTIFICATION: Rescheduled all notifications
```

---

### ✅ Scenario 3: App State Change (< 24 Hours)

**Expected Behavior:**

- User backgrounds app
- User returns to app (AppState → 'active')
- `shouldRescheduleNotifications()` returns FALSE (within 24 hours)
- NO notification rescheduling
- Notification count: 144 (unchanged)

**How to Verify:**

1. Launch app
2. Background app (Home button, switch apps)
3. Return to app
4. Check logs for:
   ```
   NOTIFICATION: Skipping reschedule, last schedule was within 24 hours
   ```
5. Verify NO reschedule happened

**Expected Log Output:**

```
NOTIFICATION: Skipping reschedule, last schedule was within 24 hours
NOTIFICATION: Checking reschedule needed: { hoursElapsed: 0, needsRefresh: false }
```

---

### ✅ Scenario 4: App State Change (> 24 Hours)

**Expected Behavior:**

- User backgrounds app
- Wait 25+ hours
- User returns to app
- `shouldRescheduleNotifications()` returns TRUE (> 24 hours)
- `initializeNotifications()` called (previousAppState === 'background')
- Notification count: 144 (cleared and rescheduled)
- NO duplicate notifications

**How to Verify:**

1. Launch app (sets `lastNotificationScheduleAtom`)
2. Background app
3. Wait 25 hours (mock by manually setting timestamp in MMKV)
4. Return to app
5. Check logs for:
   ```
   NOTIFICATION: Starting notification refresh
   NOTIFICATION: Rescheduled all notifications
   ```
6. Verify only ONE reschedule cycle

**Expected Log Output:**

```
NOTIFICATION: Starting notification refresh
NOTIFICATION: Cancelled all scheduled notifications via Expo API
...
NOTIFICATION: Rescheduled all notifications
MMKV WRITE: last_notification_schedule_check :: 1736464800000
```

---

### ✅ Scenario 5: Concurrent Scheduling (Race Condition)

**Expected Behavior:**

- If `refreshNotifications()` called while already scheduling
- Deduplication guard prevents duplicate
- Log shows: "NOTIFICATION: Already scheduling, skipping duplicate call"
- NO duplicate notifications

**How to Verify:**

1. This scenario is harder to trigger manually
2. Would need rapid sequential calls to `rescheduleAllNotifications()`
3. Check logs for guard message

**Expected Log Output:**

```
NOTIFICATION: Starting notification refresh  ← First call
NOTIFICATION: Already scheduling, skipping duplicate call  ← Second call blocked by guard
```

---

## Code Logic Verification

### Before Fix (BUGGY):

```typescript
// device/listeners.ts
const handleAppStateChange = (newState: AppStateStatus) => {
  if (newState === 'active') {
    initializeNotifications(checkPermissions);  ← ALWAYS called when active
    if (previousAppState === 'background') {
      sync().then(() => setRefreshUI(Date.now()));
    }
  }
};

handleAppStateChange(previousAppState);  ← RUNS IMMEDIATELY
AppState.addEventListener('change', handleAppStateChange);

// app/index.tsx
useEffect(() => {
  initializeNotifications(checkInitialPermissions);  ← Also called
  initializeListeners(checkInitialPermissions);
}, []);
```

**Flow:**

1. `app/index.tsx` mounts → calls `initializeNotifications()` (CALL #1)
2. `initializeListeners()` called
3. `handleAppStateChange(previousAppState)` runs immediately with `previousAppState === 'active'`
4. Calls `initializeNotifications()` again (CALL #2)
5. **DUPLICATE SCHEDULING**

---

### After Fix (CORRECT):

```typescript
// device/listeners.ts
const handleAppStateChange = (newState: AppStateStatus) => {
  if (newState === 'active') {
    if (previousAppState === 'background') {
      initializeNotifications(checkPermissions);  ← Only when from background
    }
    if (previousAppState === 'background') {
      sync().then(() => setRefreshUI(Date.now()));
    }
  }
};

// NO immediate execution
AppState.addEventListener('change', handleAppStateChange);

// app/index.tsx
useEffect(() => {
  initializeNotifications(checkInitialPermissions);  ← Only call
  initializeListeners(checkInitialPermissions);
}, []);
```

**Flow:**

1. `app/index.tsx` mounts → calls `initializeNotifications()` (CALL #1 - ONLY CALL)
2. `initializeListeners()` called
3. `AppState.addEventListener('change', ...)` registers listener
4. Listener DOES NOT fire on initial mount (no state change yet)
5. `previousAppState` starts as 'active'
6. **NO DUPLICATE SCHEDULING**

---

## Manual Testing Steps

### Step 1: Verify Fresh Install

1. Stop simulator if running
2. Reset simulator content and settings:
   ```bash
   xcrun simctl erase all
   ```
3. Reboot simulator:
   ```bash
   xcrun simctl boot "iPhone 17 Pro Max"
   ```
4. Install and launch app:
   ```bash
   yarn ios
   ```
5. Grant notification permissions when prompted
6. Wait for app to fully load (splash screen disappears)
7. Monitor logs (see "How to Monitor Logs" below)

### Step 2: Check Notification Count

```bash
# Connect to simulator's Expo Go logs
# OR check app's internal logs via debugger
```

Expected: 144 notifications
Bug: 288 notifications (144 × 2)

### Step 3: Test Sound Selection

1. Tap sound icon (bottom-right)
2. Scroll and select different Athan (e.g., Athan 2)
3. Wait for bottom sheet to close
4. Monitor logs

Expected: Single reschedule cycle
Bug: Double reschedule cycle

### Step 4: Test App State Change

1. Home button (or swipe up) to background app
2. Immediately return to app
3. Monitor logs

Expected: "Skipping reschedule, last schedule was within 24 hours"
Bug: "Starting notification refresh" (rescheduling when not needed)

### Step 5: Test 24-Hour Refresh

1. Manually set last notification timestamp to 25+ hours ago:
   ```bash
   # In MMKV viewer/editor tool:
   # Set last_notification_schedule_check to timestamp 25 hours ago
   ```
2. Background app
3. Return to app
4. Monitor logs

Expected: Single reschedule cycle
Bug: Double reschedule cycle

---

## How to Monitor Logs

### Method 1: React Native Debugger

1. Open app in simulator
2. Shake device (Cmd + Ctrl + Z) to open debug menu
3. Tap "Debug"
4. Open Chrome DevTools: `chrome://inspect`
5. Select React Native target
6. Check Console tab for logs

### Method 2: Xcode Console

1. Run app via Xcode (instead of `yarn ios`)
2. Open Xcode console
3. Filter for "NOTIFICATION" or "MMKV"

### Method 3: Log File (if configured)

If Pino writes to file:

```bash
tail -f ~/Library/Logs/athan.log | grep "NOTIFICATION"
```

---

## Success Criteria

✅ **Primary Success:**

- Fresh install schedules 144 notifications (not 288)
- Single "NOTIFICATION: Rescheduled all notifications" log entry on first launch

✅ **Secondary Success:**

- Sound selection triggers single reschedule
- App state changes don't cause unnecessary rescheduling
- 24-hour refresh works correctly

✅ **Tertiary Success:**

- Deduplication guard appears in logs if triggered
- No duplicate log entries
- Notification count remains at 144 after all operations

---

## Failure Indicators

❌ **Failure:**

- Two "NOTIFICATION: Rescheduled all notifications" log entries on first launch
- 288 notifications scheduled
- Double log entries for any reschedule operation

❌ **Partial Failure:**

- Notifications scheduled but count is wrong (e.g., 150, 200)
- Race condition still occurs (concurrent scheduling)

---

## Next Steps After Testing

### If SUCCESS:

1. Commit changes with descriptive message
2. Update README to mark BUG-2 as resolved
3. Document fix for future reference

### If FAILURE:

1. Investigate why fix didn't work
2. Check if there are OTHER code paths calling `refreshNotifications()`
3. Verify `previousAppState` is actually 'active' on first launch
4. Consider alternative solutions

---

## Rollback Plan

If testing reveals issues:

```bash
# Revert device/listeners.ts
git checkout HEAD~1 device/listeners.ts

# Revert stores/notifications.ts
git checkout HEAD~1 stores/notifications.ts
```

Investigate alternate approaches:

- Remove notification initialization from `app/index.tsx` entirely
- Only initialize from `device/listeners.ts`
- Add timestamp check before scheduling
- Use database to detect and deduplicate
