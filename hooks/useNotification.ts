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
  const isNotificationGranted = async (status: string) => status === 'granted';

  const checkInitialPermissions = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        return isNotificationGranted(status);
      }

      return isNotificationGranted(existingStatus);
    } catch (error) {
      logger.error('NOTIFICATION: Failed to check initial notification permissions:', error);
      return false;
    }
  };

  const ensurePermissions = async (): Promise<boolean> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      if (existingStatus === 'granted') return isNotificationGranted(existingStatus);

      // First try requesting permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') return isNotificationGranted(status);

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
                resolve(isNotificationGranted(finalStatus));
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
