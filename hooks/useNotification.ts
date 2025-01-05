import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';

import logger from '@/shared/logger';
import { AlertType, ScheduleType } from '@/shared/types';
import * as NotificationUtils from '@/stores/notifications';
import { scheduleMultipleNotificationsForPrayer, setAlertPreference } from '@/stores/notifications';

// Configure notifications to show when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const requestPermissions = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') return existingStatus;

    const { status } = await Notifications.requestPermissionsAsync();
    return status;
  } catch (error) {
    logger.error('Error requesting permissions:', error);
    return 'denied';
  }
};

export const useNotification = () => {
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

  useEffect(() => {
    requestPermissions()
      .then((status) => setPermissionStatus(status))
      .catch((error) => {
        logger.error('Failed to request notification permissions:', error);
        setPermissionStatus('denied');
      });
  }, []);

  const handleAlertChange = async (
    scheduleType: ScheduleType,
    prayerIndex: number,
    englishName: string,
    arabicName: string,
    alertType: AlertType
  ) => {
    try {
      if (permissionStatus !== 'granted') {
        logger.warn('Notification permissions not granted');
        return;
      }

      // Update preference in store
      setAlertPreference(scheduleType, prayerIndex, alertType);

      // If notifications are turned off, we don't need to schedule anything
      if (alertType === AlertType.Off) {
        await NotificationUtils.cancelAllNotificationsForPrayer(scheduleType, prayerIndex);
        return;
      }

      // Schedule notifications for next 5 days
      await scheduleMultipleNotificationsForPrayer(scheduleType, prayerIndex, englishName, arabicName, alertType);

      logger.info('Updated notification settings:', {
        scheduleType,
        prayerIndex,
        englishName,
        alertType,
      });
    } catch (error) {
      logger.error('Failed to update notification settings:', error);
    }
  };

  return { handleAlertChange, permissionStatus };
};
