import * as Notifications from 'expo-notifications';
import { Platform, Alert, Linking } from 'react-native';

import logger from '@/shared/logger';
import { AlertType, ScheduleType } from '@/shared/types';
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
 * Shows a dialog prompting user to enable notifications in settings
 * @returns Promise resolving to true if user grants permission after visiting settings
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
            if (Platform.OS === 'ios') await Linking.openSettings();
            else await Linking.sendIntent('android.settings.APP_NOTIFICATION_SETTINGS');

            // Check if permissions were granted after returning from settings
            const { status: finalStatus } = await Notifications.getPermissionsAsync();
            resolve(finalStatus === 'granted');
          },
        },
      ]
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
 * const { handleAlertChange, checkInitialPermissions, ensurePermissions } = useNotification();
 *
 * // On app launch
 * const hasPermission = await checkInitialPermissions();
 *
 * // When user taps alert icon
 * const success = await handleAlertChange(
 *   ScheduleType.Standard,
 *   0, // Fajr index
 *   "Fajr",
 *   "الفجر",
 *   AlertType.Sound
 * );
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
   * Handles alert type changes for a prayer
   *
   * Called when user taps the alert icon to cycle through Off → Silent → Sound.
   * Manages permission checks and notification scheduling.
   *
   * @param scheduleType Schedule type (Standard or Extra)
   * @param prayerIndex Index of the prayer in its schedule (0-based)
   * @param englishName English prayer name (e.g., "Fajr")
   * @param arabicName Arabic prayer name (e.g., "الفجر")
   * @param alertType New alert type (Off, Silent, Sound)
   * @returns Promise resolving to boolean indicating success
   *
   * @example
   * const success = await handleAlertChange(
   *   ScheduleType.Standard,
   *   0,
   *   "Fajr",
   *   "الفجر",
   *   AlertType.Sound
   * );
   *
   * if (success) {
   *   // Update UI to reflect new alert type
   *   setPrayerAlertType(type, index, alertType);
   * } else {
   *   // Revert UI to previous state
   * }
   */
  const handleAlertChange = async (
    scheduleType: ScheduleType,
    prayerIndex: number,
    englishName: string,
    arabicName: string,
    alertType: AlertType
  ): Promise<boolean> => {
    try {
      // Always allow turning off notifications without permission check
      if (alertType === AlertType.Off) {
        await NotificationStore.clearAllScheduledNotificationForPrayer(scheduleType, prayerIndex);
        return true;
      }

      // Check/request permissions for enabling notifications
      const hasPermission = await ensurePermissions();
      if (!hasPermission) {
        logger.warn('NOTIFICATION: Permissions not granted');
        return false;
      }

      // Schedule notifications
      await NotificationStore.addMultipleScheduleNotificationsForPrayer(
        scheduleType,
        prayerIndex,
        englishName,
        arabicName,
        alertType
      );

      logger.info('NOTIFICATION: Updated settings:', {
        scheduleType,
        prayerIndex,
        englishName,
        alertType,
      });

      return true;
    } catch (error) {
      logger.error('NOTIFICATION: Failed to update settings:', error);
      return false;
    }
  };

  return {
    handleAlertChange,
    checkInitialPermissions,
    ensurePermissions,
  };
};
