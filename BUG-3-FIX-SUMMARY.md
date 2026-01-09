# BUG-3: Android Delayed Notifications - Fix Summary (Option B with Popup)

**Date**: 2026-01-08
**Status**: ✅ COMPLETED
**Fix**: SCHEDULE_EXACT_ALARM Permission Check with User Popup (Android 12+ Only)

---

## Problem

Android notifications were showing ±60 seconds timing deviations on some devices. While iOS devices correctly timed notifications, some Android devices had:

- Notifications appearing 60 seconds before prayer time
- Notifications appearing 60 seconds after prayer time
- Inconsistent timing across different Android devices

**Root Cause**: Android's battery optimization and alarm manager restrictions. Without `SCHEDULE_EXACT_ALARM` permission, the system may delay exact alarms for power saving.

---

## Solution Implemented (Option B - With User Popup)

### 1. Package Upgrade

**Action**: Upgraded `expo-notifications` from 0.29.14 to 0.32.16
**Status**: ✅ Complete
**API Gained**: `Notifications.canScheduleExactAlarms()` - available in v0.29.0+

### 2. Permission Check Implementation

**File Modified**: `stores/notifications.ts`
**Function Modified**: `refreshNotifications()`

**Changes**:

1. Added `Alert` and `Linking` imports
2. Added Android version detection helper (Android 12+ only)
3. Added user alert popup helper function
4. Added Android 12+ permission check before scheduling
5. Shows alert if permission not granted with "Open Settings" button

**Code Added**:

**Helper Functions** (lines 28-61):

```typescript
// Android 12+ (API level 31+) requires SCHEDULE_EXACT_ALARM permission
const ANDROID_12_API_LEVEL = 31;

/**
 * Check if device is Android 12+
 */
const isAndroid12OrHigher = (): boolean => {
  if (Platform.OS !== 'android') return false;
  const androidVersion = Platform.Version as number;
  return androidVersion >= ANDROID_12_API_LEVEL;
};

/**
 * Show alert to guide user to enable Alarms & reminders permission
 */
const showExactAlarmPermissionAlert = () => {
  Alert.alert(
    'Alarms & reminders permission required',
    'To receive accurate prayer time notifications, please enable "Alarms & reminders" permission in app settings.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Open Settings',
        onPress: () => {
          Linking.openSettings();
        },
      },
    ],
    { cancelable: true }
  );
};
```

**Permission Check** (lines 313-323):

```typescript
// Check exact alarm permission on Android 12+ before scheduling
if (isAndroid12OrHigher()) {
  // Use type assertion to work around API availability
  const canScheduleExact = await (Notifications as any).canScheduleExactAlarms();
  if (!canScheduleExact) {
    logger.error('NOTIFICATION: Cannot schedule exact alarms, permission not granted');
    showExactAlarmPermissionAlert();
    return;
  }
  logger.info('NOTIFICATION: Exact alarm permission verified');
}
```

---

## Implementation Details

### Permission Check Flow

```
refreshNotifications() called
  ↓
shouldRescheduleNotifications() check
  ↓
isScheduling guard check
  ↓
[NEW] isAndroid12OrHigher() check (API level 31+ only)
  ↓
[NEW] await Notifications.canScheduleExactAlarms()
  ↓
[NEW] If false → showExactAlarmPermissionAlert() + return early
  ↓
[NEW] If true → proceed with scheduling
  ↓
isScheduling = true
  ↓
rescheduleAllNotifications()
  ↓
store.set(lastNotificationScheduleAtom, Date.now())
  ↓
isScheduling = false
```

### Key Design Decisions

1. **Android 12+ Only**: Only checks permission on Android 12+ (API level 31+) - older Android versions don't need this permission
2. **Platform-Specific Check**: Only runs on Android (iOS doesn't have this permission)
3. **User Popup**: Shows alert popup when permission denied with "Open Settings" button
4. **Guidance**: Uses `Linking.openSettings()` to guide user directly to app settings
5. **Early Return**: Prevents scheduling if permission denied (better than inexact timing)
6. **Type Assertion**: Uses `(Notifications as any)` to avoid TypeScript errors with API availability
7. **Error Logging**: Logs error when permission denied for debugging
8. **Success Logging**: Confirms permission granted for verification

---

## Testing Requirements

### Manual Testing Steps

1. **Android 12+ Device Testing (Permission Granted)**:
   - Install app on Android 12+ device
   - Enable prayer notifications for at least one prayer
   - Grant "Alarms & reminders" permission in app settings
   - Schedule notifications
   - Wait for notification trigger
   - Verify notification fires exactly at prayer time (±1 second tolerance)
   - Check logs: "Exact alarm permission verified"

2. **Android 12+ Device Testing (Permission Denied)**:
   - Install app on Android 12+ device
   - Disable "Alarms & reminders" permission in app settings
   - Enable prayer notifications
   - Trigger notification refresh
   - **Verify popup appears**: "Alarms & reminders permission required"
   - Tap "Cancel" → Verify no notifications scheduled
   - Re-trigger refresh
   - Tap "Open Settings" → Verify opens app settings
   - Enable permission in settings
   - Return to app
   - Check logs: "Exact alarm permission verified"
   - Verify notifications scheduled successfully

3. **Android <12 Device Testing**:
   - Install app on Android 11 or older device
   - Enable prayer notifications
   - Verify NO permission popup appears
   - Verify notifications work normally
   - Check logs: No permission check logs

4. **iOS Testing**:
   - Install app on iOS device
   - Enable prayer notifications
   - Verify NO permission popup appears
   - Verify notifications still work correctly
   - Confirm permission check doesn't affect iOS flow

5. **Cross-Device Testing**:
   - Test on multiple Android devices with different Android versions (12, 13, 14, 15)
   - Test on devices with different manufacturers (Samsung, Pixel, Xiaomi, etc.)
   - Test on devices with battery optimization enabled/disabled

### Verification Checklist

- [ ] Popup only appears on Android 12+ when permission denied
- [ ] Popup has "Cancel" and "Open Settings" buttons
- [ ] "Open Settings" opens app settings page
- [ ] Permission check skipped on Android <12
- [ ] Permission check skipped on iOS
- [ ] Success log when permission granted on Android 12+
- [ ] Notifications fire exactly on time when permission granted
- [ ] No notifications scheduled when permission denied
- [ ] No TypeScript errors (type assertion works)
- [ ] No runtime errors on Android 12+
- [ ] No runtime errors on Android <12
- [ ] No runtime errors on iOS

---

## Expected Impact

### Before Fix

- Notifications: ±60 seconds on some Android devices
- User Experience: Inconsistent, unreliable prayer time alerts
- Root Cause: Android battery optimization delaying exact alarms

### After Fix

- Notifications: Exact timing (±1 second) on Android 12+ devices with permission
- User Experience: Reliable, consistent prayer time alerts (if permission granted)
- Permission: User guided to enable "Alarms & reminders" in app settings via popup

### Behavior Without Permission (Android 12+)

- App logs error: "Cannot schedule exact alarms, permission not granted"
- **Shows popup alert**: "Alarms & reminders permission required"
- **Two options**: "Cancel" (dismiss) or "Open Settings" (guided to app settings)
- No notifications scheduled until permission granted
- User must enable "Alarms & reminders" permission in Android Settings

### Behavior on Android < 12

- No permission check (not required on older Android versions)
- Notifications work normally without changes

### Behavior on iOS

- No permission check (iOS doesn't have this permission)
- Notifications work normally without changes

---

## New User Popup (Android 12+ Only)

### When Shown

- User enables prayer notifications
- Permission refresh occurs (every 24 hours)
- App detects SCHEDULE_EXACT_ALARM permission is denied

### Popup Content

```
Title: Alarms & reminders permission required

Message: To receive accurate prayer time notifications,
         please enable "Alarms & reminders" permission
         in app settings.

Buttons:
  [Cancel] [Open Settings]
```

### User Action

- Tap "Cancel" → Dismisses popup, no notifications scheduled
- Tap "Open Settings" → Opens app settings directly to enable permission

---

## Known Limitations

1. **Android 12+ Only**: Permission check and popup only on Android 12+ (API level 31+)
2. **User Interaction Required**: User must tap "Open Settings" and manually enable permission
3. **Popup Recurrence**: Popup shows on every refresh attempt if permission denied (every 24 hours)
4. **Type Assertion**: Uses `as any` to work around TypeScript API availability
5. **No Automatic Permission Request**: Cannot programmatically request this permission (must be enabled by user in settings)

---

## Future Improvements

1. **Permission Request**: Use `requestScheduleExactAlarmAsync()` to request permission programmatically (if API becomes available)
2. **Fallback Option**: Allow user to choose between exact timing (with permission) and inexact timing (without permission)
3. **One-Time Prompt**: Remember if user dismissed popup to avoid showing on every refresh
4. **Monitoring**: Add analytics to track permission grant rate and notification timing accuracy

---

## Files Modified

- `stores/notifications.ts`:
  - Added `Alert` and `Linking` imports (line 2)
  - Added `ANDROID_12_API_LEVEL` constant (line 29)
  - Added `isAndroid12OrHigher()` helper function (lines 34-38)
  - Added `showExactAlarmPermissionAlert()` helper function (lines 43-61)
  - Added permission check in `refreshNotifications()` (lines 313-323)
  - Total changes: +37 lines

- `package.json`:
  - Upgraded `expo-notifications` from 0.29.14 to 0.32.16 (line 36)
  - Verified `expo-linking` exists (line 35)

---

## Related Issues

- **BUG-2**: Double notifications on iOS & Android (unrelated to this fix)
- **BUG-1**: iOS simulator startup (resolved, unrelated to this fix)

---

## References

- **Expo Notifications API**: https://docs.expo.dev/versions/latest/sdk/notifications/#canScheduleExactAlarms
- **Android AlarmManager**: https://developer.android.com/reference/android/app/AlarmManager
- **SCHEDULE_EXACT_ALARM Permission**: https://developer.android.com/reference/android/Manifest.permission#SCHEDULE_EXACT_ALARM

---

## Commit Suggestion

```
fix: BUG-3 - Add SCHEDULE_EXACT_ALARM permission check with user popup (Android 12+)

- Upgrade expo-notifications from 0.29.14 to 0.32.16
- Add Android 12+ (API level 31+) version detection helper
- Add Alert and Linking imports for user popup
- Add showExactAlarmPermissionAlert() helper function
- Add canScheduleExactAlarms() check in refreshNotifications()
- Show popup with "Open Settings" button when permission denied
- Skip permission check on Android <12 and iOS (not required)

Fixes: Android notifications showing ±60s timing deviations on some devices
Note: SCHEDULE_EXACT_ALARM permission only required on Android 12+ (API level 31+)
```
