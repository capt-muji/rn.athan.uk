import * as Notifications from 'expo-notifications';
import { Platform, Alert, Linking } from 'react-native';

import logger from '@/shared/logger';
import { AlertType, ScheduleType } from '@/shared/types';
import * as NotificationStore from '@/stores/notifications';

// Configure notifications to show when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const useNotification = () => {
  const checkInitialPermissions = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
      }

      return true;
    } catch (error) {
      logger.error('NOTIFICATION: Failed to check initial notification permissions:', error);
      return false;
    }
  };

  const ensurePermissions = async (): Promise<boolean> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      if (existingStatus === 'granted') return true;

      // First try requesting permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') return true;

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
                resolve(finalStatus === 'granted');
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

      // Always allow turning off notifications without permission check
      if (alertType === AlertType.Off) {
        await NotificationStore.clearAllScheduledNotificationForPrayer(scheduleType, prayerIndex);
        return true;
      }

      // Only update preference if muted, don't schedule notifications
      if (isMuted) return true;

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
      if (mute) {
        // Cancel all notifications first
        await NotificationStore.cancelAllScheduleNotificationsForSchedule(scheduleType);
        NotificationStore.setScheduleMutedState(scheduleType, true);
      } else {
        // Check permissions before unmuting
        const hasPermission = await ensurePermissions();
        if (!hasPermission) {
          logger.warn('NOTIFICATION: Permissions not granted for unmute');
          return false;
        }

        // Reschedule notifications based on existing preferences
        await NotificationStore.rescheduleAllNotifications(scheduleType);
        NotificationStore.setScheduleMutedState(scheduleType, false);
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
