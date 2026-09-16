import * as Notifications from 'expo-notifications';
import { Alert, AppState, Linking } from 'react-native';

import * as Device from '@/device/notifications';
import logger from '@/shared/logger';
import { perfMark, perfMeasure } from '@/shared/perf';
import { type AlertMenuState, AlertType, type ScheduleType } from '@/shared/types';
import * as NotificationStore from '@/stores/notifications';

// Configure notifications to show when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Resolves the first time the app is active again after it has left the foreground
 *
 * Listening starts before Settings opens, so the move to the background that opening it causes cannot be missed. An
 * active state with no departure before it is not a return.
 *
 * @returns The return, and a way to stop listening when Settings never opened
 */
const listenForReturnToApp = () => {
  let markReturned!: () => void;
  const returned = new Promise<void>((resolve) => {
    markReturned = resolve;
  });
  let leftApp = false;

  const subscription = AppState.addEventListener('change', (state) => {
    if (state !== 'active') {
      leftApp = true;
      return;
    }
    if (!leftApp) return;

    subscription.remove();
    markReturned();
  });

  return { returned, stop: () => subscription.remove() };
};

/**
 * Shows a dialog prompting user to enable notifications in settings
 * @returns Promise resolving to true if the permission is granted once the user is back from settings, and to false
 *   when the user cancels or dismisses the dialog, Settings cannot open, or the permission cannot be read, so the
 *   caller never waits forever
 */
const showSettingsDialog = (): Promise<boolean> => {
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
            const returnToApp = listenForReturnToApp();

            try {
              // The app's own settings page on both platforms: Android closes its notification settings page at once
              // when the request names no package
              await Linking.openSettings();
            } catch (error) {
              returnToApp.stop();
              logger.error('NOTIFICATION: Failed to open notification settings:', error);
              resolve(false);
              return;
            }

            // Opening answers as Settings opens, when the permission cannot have changed yet
            await returnToApp.returned;

            try {
              const { status: finalStatus } = await Notifications.getPermissionsAsync();
              resolve(finalStatus === 'granted');
            } catch (error) {
              logger.error('NOTIFICATION: Failed to read notification permissions after settings:', error);
              resolve(false);
            }
          },
        },
      ],
      // Android reports a dialog closed without a button, such as by a second dialog replacing it, only here
      { onDismiss: () => resolve(false) }
    );
  });
};

/**
 * Hook for managing notification permissions and scheduling
 *
 * Provides functions for:
 * - Checking initial notification permissions on app launch
 * - Requesting permissions with settings fallback
 * - Handling alert type changes for individual prayers
 *
 * @returns Object containing notification handlers
 *
 * @example
 * const { commitAlertMenuChanges, checkInitialPermissions, ensurePermissions } = useNotification();
 *
 * // On app launch
 * const hasPermission = await checkInitialPermissions();
 *
 * // Before enabling notifications
 * const granted = await ensurePermissions();
 */
export const useNotification = () => {
  /**
   * Checks if notification status is granted
   * @param status Notification permission status string
   * @returns boolean indicating if granted
   */
  const isNotificationGranted = (status: string) => status === 'granted';

  /**
   * Checks and requests initial notification permissions
   *
   * Called on app launch to determine if notifications are enabled.
   * If not granted, automatically requests permission.
   *
   * @returns Promise resolving to boolean indicating if permissions are granted
   *
   * @example
   * useEffect(() => {
   *   checkInitialPermissions().then(hasPermission => {
   *     if (hasPermission) refreshNotifications();
   *   });
   * }, []);
   */
  const checkInitialPermissions = async (): Promise<boolean> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        return isNotificationGranted(status);
      }

      return true;
    } catch (error) {
      logger.error('NOTIFICATION: Failed to check initial notification permissions:', error);
      return false;
    }
  };

  /**
   * Ensures notification permissions are granted, with settings fallback
   *
   * Flow:
   * 1. Check current permission status
   * 2. If granted, return true
   * 3. If not granted, request permissions
   * 4. If still denied, show alert with option to open settings
   * 5. After user returns from settings, check status again
   *
   * @returns Promise resolving to boolean indicating if permissions are granted
   *
   * @example
   * const handleEnableSound = async () => {
   *   const hasPermission = await ensurePermissions();
   *   if (!hasPermission) return; // User cancelled or denied
   *   // Proceed with enabling notifications
   * };
   */
  const ensurePermissions = async (): Promise<boolean> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      if (existingStatus === 'granted') return true;

      // First try requesting permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') return true;

      // If denied, show settings dialog
      return showSettingsDialog();
    } catch (error) {
      logger.error('NOTIFICATION: Failed to check notification permissions:', error);
      return false;
    }
  };

  /**
   * Commits alert menu changes using deferred commit pattern
   *
   * Compares the original state with the current state and only schedules
   * notifications/reminders if there were actual changes. This prevents
   * unnecessary rescheduling when the menu is closed without changes.
   *
   * @param scheduleType Schedule type (Standard or Extra)
   * @param prayerIndex Index of the prayer in its schedule (0-based)
   * @param englishName English prayer name
   * @param arabicName Arabic prayer name
   * @param originalState The original state when the menu was opened
   * @param currentState The current state when the menu is being closed
   * @returns Promise resolving to boolean indicating success
   */
  const commitAlertMenuChanges = async (
    scheduleType: ScheduleType,
    prayerIndex: number,
    englishName: string,
    arabicName: string,
    originalState: AlertMenuState,
    currentState: AlertMenuState
  ): Promise<boolean> => {
    const atTimeChanged = originalState.atTimeAlert !== currentState.atTimeAlert;
    const reminderChanged =
      originalState.reminderAlert !== currentState.reminderAlert ||
      originalState.reminderInterval !== currentState.reminderInterval;

    // No changes, skip scheduling
    if (!atTimeChanged && !reminderChanged) {
      logger.info('NOTIFICATION: No changes detected, skipping commit');
      return true;
    }

    // Check permissions if enabling any notification
    if (
      (currentState.atTimeAlert !== AlertType.Off || currentState.reminderAlert !== AlertType.Off) &&
      !(await ensurePermissions())
    ) {
      logger.warn('NOTIFICATION: Permissions not granted');
      return false;
    }

    // The store writes the preferences, does the work and, when the phone refuses any part of it, puts BOTH back
    // inside the same lock acquisition. Doing that here made the undo a second acquisition, which anything queued
    // meanwhile ran in front of (measured while planning session 6b). Deliberately no error haptic: an on-device
    // feel-test (owner, 2026-09-08) found expo-haptics' Heavy single-shot indistinguishable from the normal Light
    // feedback, so the revert plays visually only — the icon snapping back is the signal.
    const committed = await NotificationStore.commitPrayerAlertChange(
      scheduleType,
      prayerIndex,
      englishName,
      arabicName,
      currentState,
      originalState
    );

    logger.info('NOTIFICATION: Alert menu changes settled:', {
      scheduleType,
      prayerIndex,
      englishName,
      atTimeChanged,
      reminderChanged,
      currentState,
      committed,
    });

    return committed;
  };

  /**
   * Commits a new Athan sound selection, with rollback
   *
   * The preference write has to come FIRST and stay first: the Android channel
   * and `rescheduleAllNotifications` both read the stored preference while they
   * run, so reordering would schedule the old sound. That makes it an
   * optimistic update, and it needs the same rollback `commitAlertMenuChanges`
   * has — without one, a rejected reschedule leaves Settings showing an Athan
   * the OS will not play until the periodic refresh heals it, which is up to
   * NOTIFICATION_REFRESH_HOURS later.
   *
   * Two consequences of a failed commit are NOT reversible, and are
   * deliberately not attempted:
   * - notifications already re-scheduled with the new sound before the throw
   *   keep it until the next successful sweep;
   * - a channel `updateAndroidChannel` created still exists, because an Android
   *   channel's sound is immutable once created and deleting it would discard
   *   the user's own per-channel settings.
   * Both self-heal on the next successful commit or refresh.
   *
   * @param selection Athan sound index to commit
   * @returns Promise resolving to boolean indicating success
   */
  const commitSoundSelection = async (selection: number): Promise<boolean> => {
    const previousSelection = NotificationStore.getSoundPreference();

    perfMark('sound_commit_start');
    NotificationStore.setSoundPreference(selection);

    try {
      await Device.updateAndroidChannel(selection);
      await NotificationStore.rescheduleAllNotifications();
      perfMeasure('sound_commit', 'sound_commit_start');

      logger.info('NOTIFICATION: Committed athan selection:', { previousSelection, selection });
      return true;
    } catch (error) {
      NotificationStore.setSoundPreference(previousSelection);
      logger.error('NOTIFICATION: Failed to commit athan selection, rolled back:', error);
      return false;
    }
  };

  return {
    checkInitialPermissions,
    ensurePermissions,
    commitAlertMenuChanges,
    commitSoundSelection,
  };
};
