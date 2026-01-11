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

export const useNotification = () => {
  const isNotifictionGranted = async (status: string) => status === 'granted';

  const checkInitialPermissions = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

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

  const ensurePermissions = async (): Promise<boolean> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      if (existingStatus === 'granted') return isNotifictionGranted(existingStatus);

      // First try requesting permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') return isNotifictionGranted(status);

      // If denied, show settings dialog
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
                resolve(isNotifictionGranted(finalStatus));
              },
            },
          ]
        );
      });
    } catch (error) {
      logger.error('NOTIFICATION: Failed to check notification permissions:', error);
      return false;
    }
  };

  const handleAlertChange = async (
    scheduleType: ScheduleType,
    prayerIndex: number,
    englishName: string,
    arabicName: string,
    alertType: AlertType
  ) => {
    try {
      // Check if schedule is muted - Use getScheduleMutedState instead of getNotificationsMuted
      const isMuted = NotificationStore.getScheduleMutedState(scheduleType);

      // Only update preference if muted, don't schedule notifications
      if (isMuted) return true;

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

  const handleMuteChange = async (scheduleType: ScheduleType, mute: boolean): Promise<boolean> => {
    try {
      // Update store state immediately to ensure proper state for subsequent operations
      NotificationStore.setScheduleMutedState(scheduleType, mute);

      if (mute) {
        // Cancel all notifications since we're muting
        await NotificationStore.cancelAllScheduleNotificationsForSchedule(scheduleType);
      } else {
        // Check permissions before unmuting
        const hasPermission = await ensurePermissions();
        if (!hasPermission) {
          logger.warn('NOTIFICATION: Permissions not granted for unmute');
          // Revert state change since we couldn't unmute
          NotificationStore.setScheduleMutedState(scheduleType, true);
          return false;
        }
        logger.info('NOTIFICATION: Unmuting schedule:', { scheduleType });

        // Reschedule notifications based on existing preferences
        await NotificationStore.addAllScheduleNotificationsForSchedule(scheduleType);
      }

      logger.info('NOTIFICATION: Updated mute settings:', { scheduleType, mute });
      return true;
    } catch (error) {
      logger.error('NOTIFICATION: Failed to update mute settings:', error);
      return false;
    }
  };

  return {
    handleAlertChange,
    handleMuteChange,
    checkInitialPermissions,
    ensurePermissions,
  };
};
