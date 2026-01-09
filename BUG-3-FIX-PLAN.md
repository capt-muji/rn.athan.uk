# BUG-3 Fix Implementation Plan

**Estimated Time**: 2-3 hours  
**Risk Level**: LOW  
**Files Modified**: 3 files  
**Lines Changed**: ~50 lines total  

---

## Implementation Steps

### Step 1: Add Exact Alarm Permission Check (hooks/useNotification.ts)

**File**: `hooks/useNotification.ts`  
**Lines to modify**: 20-34 (checkInitialPermissions function)  
**Time**: 30 minutes  

**Changes**:

```typescript
// OLD CODE (lines 20-34)
const checkInitialPermissions = async () => {
  try {
    const { status: existingStatus} = await Notifications.getPermissionsAsync();

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      return isNotifictionGranted(status);
    }

    return isNotifictionGranted(existingStatus);
  } catch (error) {
    logger.error('NOTIFICATION: Failed to check initial notification permissions:', error);
    return false;
  }
};
```

**NEW CODE**:

```typescript
const checkInitialPermissions = async () => {
  try {
    // Step 1: Check POST_NOTIFICATIONS permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      if (!isNotifictionGranted(status)) {
        logger.warn('NOTIFICATION: POST_NOTIFICATIONS permission denied');
        return false;
      }
    }

    // Step 2: Check SCHEDULE_EXACT_ALARM permission (Android 12+ only)
    if (Platform.OS === 'android') {
      const canScheduleExact = await Notifications.canScheduleExactAlarms();
      
      if (!canScheduleExact) {
        logger.warn('NOTIFICATION: SCHEDULE_EXACT_ALARM permission not granted');
        
        // Show user alert to enable exact alarms
        Alert.alert(
          'Enable Exact Prayer Times',
          'For accurate prayer notifications, please enable "Alarms & reminders" in app settings.',
          [
            {
              text: 'Not Now',
              style: 'cancel',
              onPress: () => logger.info('NOTIFICATION: User declined exact alarm permission')
            },
            {
              text: 'Open Settings',
              onPress: async () => {
                try {
                  await Linking.openSettings();
                  logger.info('NOTIFICATION: Opened settings for exact alarm permission');
                } catch (error) {
                  logger.error('NOTIFICATION: Failed to open settings:', error);
                }
              }
            }
          ]
        );
        
        return false;
      }
      
      logger.info('NOTIFICATION: SCHEDULE_EXACT_ALARM permission granted');
    }

    return true;
  } catch (error) {
    logger.error('NOTIFICATION: Failed to check initial notification permissions:', error);
    return false;
  }
};
```

**Import additions needed** (top of file):
```typescript
import { Platform, Alert, Linking } from 'react-native';
```

---

### Step 2: Update ensurePermissions Function (hooks/useNotification.ts)

**File**: `hooks/useNotification.ts`  
**Lines to modify**: 36-75 (ensurePermissions function)  
**Time**: 20 minutes  

**Changes**:

Add exact alarm check to `ensurePermissions` as well (called when user enables notifications):

```typescript
const ensurePermissions = async (): Promise<boolean> => {
  try {
    // Step 1: Check POST_NOTIFICATIONS
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    if (existingStatus === 'granted') {
      // Still need to check exact alarm permission
      if (Platform.OS === 'android') {
        const canScheduleExact = await Notifications.canScheduleExactAlarms();
        if (!canScheduleExact) {
          return new Promise((resolve) => {
            Alert.alert(
              'Enable Exact Prayer Times',
              'For accurate prayer notifications, please enable "Alarms & reminders" in app settings.',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                  onPress: () => resolve(false),
                },
                {
                  text: 'Open Settings',
                  onPress: async () => {
                    await Linking.openSettings();
                    // Wait a bit for user to enable, then check again
                    setTimeout(async () => {
                      const recheck = await Notifications.canScheduleExactAlarms();
                      resolve(recheck);
                    }, 1000);
                  },
                },
              ]
            );
          });
        }
      }
      return true;
    }

    // First try requesting POST_NOTIFICATIONS
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      // Show settings dialog for POST_NOTIFICATIONS
      return new Promise((resolve) => {
        Alert.alert(
          'Enable Notifications',
          'Prayer time notifications are disabled. Would you like to enable them in settings?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(false),
            },
            {
              text: 'Open Settings',
              onPress: async () => {
                if (Platform.OS === 'ios') await Linking.openSettings();
                else await Linking.sendIntent('android.settings.APP_NOTIFICATION_SETTINGS');

                const { status: finalStatus } = await Notifications.getPermissionsAsync();
                resolve(isNotifictionGranted(finalStatus));
              },
            },
          ]
        );
      });
    }

    // POST_NOTIFICATIONS granted, now check exact alarm on Android
    if (Platform.OS === 'android') {
      const canScheduleExact = await Notifications.canScheduleExactAlarms();
      if (!canScheduleExact) {
        return new Promise((resolve) => {
          Alert.alert(
            'Enable Exact Prayer Times',
            'For accurate prayer notifications, please enable "Alarms & reminders" in app settings.',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => resolve(false),
              },
              {
                text: 'Open Settings',
                onPress: async () => {
                  await Linking.openSettings();
                  setTimeout(async () => {
                    const recheck = await Notifications.canScheduleExactAlarms();
                    resolve(recheck);
                  }, 1000);
                },
              },
            ]
          );
        });
      }
    }

    return true;
  } catch (error) {
    logger.error('NOTIFICATION: Failed to check notification permissions:', error);
    return false;
  }
};
```

---

### Step 3: Add Diagnostic Logging (app/index.tsx)

**File**: `app/index.tsx`  
**Lines to add**: After line 38 (in useEffect)  
**Time**: 10 minutes  

**Changes**:

```typescript
useEffect(() => {
  // Deregister deprecated background task
  deregisterBackgroundFetchAsync();

  // Add diagnostic logging for exact alarm permission
  if (Platform.OS === 'android') {
    Notifications.canScheduleExactAlarms().then((result) => {
      logger.info('DIAGNOSTIC: canScheduleExactAlarms', { result });
    });
  }

  initializeNotifications(checkInitialPermissions);
  initializeListeners(checkInitialPermissions);
}, []);
```

**Import additions needed**:
```typescript
import { Platform } from 'react-native';
```

---

### Step 4: Add Permission Check on App Resume (device/listeners.ts)

**File**: `device/listeners.ts`  
**Lines to modify**: 19-21  
**Time**: 10 minutes  

**Changes**:

```typescript
const handleAppStateChange = (newState: AppStateStatus) => {
  if (newState === 'active') {
    // Only initialize notifications when coming from background
    if (previousAppState === 'background') {
      // Check permissions again in case user changed them in Settings
      checkPermissions().then((hasPermissions) => {
        if (hasPermissions) {
          initializeNotifications(checkPermissions);
        } else {
          logger.warn('NOTIFICATION: Permissions not granted on app resume');
        }
      });
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
```

---

### Step 5: Update Notification Scheduling Functions (stores/notifications.ts)

**File**: `stores/notifications.ts`  
**Lines to modify**: 265-269 (refreshNotifications function)  
**Time**: 15 minutes  

**Changes**:

```typescript
export const refreshNotifications = async () => {
  if (!shouldRescheduleNotifications()) {
    logger.info(`NOTIFICATION: Skipping reschedule, last schedule was within ${NOTIFICATION_REFRESH_HOURS} hours`);
    return;
  }

  if (isScheduling) {
    logger.info('NOTIFICATION: Already scheduling, skipping duplicate call');
    return;
  }

  // Check exact alarm permission on Android before scheduling
  if (Platform.OS === 'android') {
    const canScheduleExact = await Notifications.canScheduleExactAlarms();
    if (!canScheduleExact) {
      logger.error('NOTIFICATION: Cannot schedule exact alarms, permission not granted');
      // Don't throw error, just log and skip scheduling
      return;
    }
    logger.info('NOTIFICATION: Exact alarm permission verified');
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

**Import additions needed** (top of file):
```typescript
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
```

---

## Testing Checklist

### Pre-Test Setup
- [ ] Build new version with changes
- [ ] Install on Android 12+ device
- [ ] Uninstall existing app (fresh install)

### Test 1: Permission Denied Scenario
- [ ] Install app
- [ ] Disable "Alarms & reminders" in Android Settings before opening
- [ ] Open app
- [ ] Enable a prayer notification
- [ ] **Expected**: Alert shown asking to enable "Alarms & reminders"
- [ ] Tap "Open Settings"
- [ ] **Expected**: Android Settings opens to app info
- [ ] Enable "Alarms & reminders"
- [ ] Return to app
- [ ] **Expected**: Notification scheduling succeeds

### Test 2: Permission Granted Scenario
- [ ] Fresh install
- [ ] Enable "Alarms & reminders" in Android Settings
- [ ] Open app
- [ ] Enable Fajr notification for 5 minutes from now
- [ ] Wait for notification
- [ ] **Expected**: Fires within ±5 seconds of scheduled time
- [ ] Check logs for "SCHEDULE_EXACT_ALARM permission granted"

### Test 3: Permission Revoked Scenario
- [ ] App already installed with permissions
- [ ] Revoke "Alarms & reminders" in Android Settings
- [ ] Background app
- [ ] Return to app (triggers permission recheck)
- [ ] **Expected**: Alert shown about missing permission
- [ ] Grant permission again
- [ ] **Expected**: Notifications continue working

### Test 4: iOS Unaffected
- [ ] Install on iOS device
- [ ] Enable notifications
- [ ] **Expected**: No extra prompts (no exact alarm permission on iOS)
- [ ] **Expected**: Notifications fire at exact time (unchanged behavior)

---

## Rollback Plan

If the fix causes issues:

1. **Immediate**: Revert changes to these files:
   - `hooks/useNotification.ts`
   - `app/index.tsx`
   - `device/listeners.ts`
   - `stores/notifications.ts`

2. **Rebuild and redeploy** previous version

3. **Document** what went wrong for investigation

---

## Deployment Strategy

### Phase 1: Development Build
- [ ] Make changes
- [ ] Test on development build
- [ ] Verify all 4 test scenarios pass

### Phase 2: Preview Build
- [ ] Deploy to TestFlight/Internal Testing
- [ ] Test with 2-3 users who reported BUG-3
- [ ] Monitor for 24-48 hours

### Phase 3: Production Release
- [ ] Deploy to App Store/Play Store
- [ ] Monitor crash reports
- [ ] Track user feedback on notification timing

---

## Success Criteria

After deployment:
- [ ] No increase in crash rate
- [ ] 85-90% reduction in "late notification" reports
- [ ] Users confirm notifications fire at exact time
- [ ] Android 12+ users report exact timing (±5 seconds)

---

## Post-Deployment Monitoring

### Week 1
- Check crash analytics daily
- Monitor user reviews mentioning "late" or "timing"
- Review logs for "SCHEDULE_EXACT_ALARM permission denied" frequency

### Week 2-4
- Compare notification timing reports: Before vs. After
- Calculate percentage of users who grant exact alarm permission
- Identify any remaining edge cases

---

## Documentation Updates

After successful deployment, update:
- [ ] README.md - Mark BUG-3 as RESOLVED
- [ ] Add note about Android 12+ requiring "Alarms & reminders" permission
- [ ] Update app store description if needed

---

## Estimated Timeline

| Task | Time | Cumulative |
|------|------|------------|
| Step 1: Modify checkInitialPermissions | 30 min | 30 min |
| Step 2: Modify ensurePermissions | 20 min | 50 min |
| Step 3: Add diagnostic logging | 10 min | 1h |
| Step 4: Update listeners | 10 min | 1h 10min |
| Step 5: Update notifications store | 15 min | 1h 25min |
| Testing (all 4 scenarios) | 30 min | 1h 55min |
| Buffer for issues | 30 min | **2h 25min** |

**Total estimated time**: 2-3 hours

