import * as Notifications from 'expo-notifications';
import { useState } from 'react';

import logger from '@/shared/logger';
import { AlertType, ScheduleType } from '@/shared/types';
import * as NotificationUtils from '@/stores/notifications';

// Configure notifications to show when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const useNotification = () => {
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

  const ensurePermissions = async (): Promise<boolean> => {
    try {
      console.log('1111');

      const { status } = await Notifications.requestPermissionsAsync();
      console.log('2222');
      console.log(status);

      return status === 'granted';
    } catch (error) {
      logger.error('Failed to check notification permissions:', error);
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
        NotificationUtils.setAlertPreference(scheduleType, prayerIndex, alertType);
        await NotificationUtils.cancelAllNotificationsForPrayer(scheduleType, prayerIndex);
        return true;
      }

      // Check/request permissions for enabling notifications
      const hasPermission = await ensurePermissions();
      if (!hasPermission) {
        // todo: enable popup to ask for permission
        logger.warn('Notification permissions not granted');
        return false;
      }

      // Update preference and schedule notifications
      NotificationUtils.setAlertPreference(scheduleType, prayerIndex, alertType);
      await NotificationUtils.scheduleMultipleNotificationsForPrayer(
        scheduleType,
        prayerIndex,
        englishName,
        arabicName,
        alertType
      );

      logger.info('Updated notification settings:', {
        scheduleType,
        prayerIndex,
        englishName,
        alertType,
      });

      return true;
    } catch (error) {
      logger.error('Failed to update notification settings:', error);
      return false;
    }
  };

  return { handleAlertChange };
};
