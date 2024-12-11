import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import logger from '@/shared/logger';

// Configure notifications to show when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const useNotification = () => {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  const registerForPushNotificationsAsync = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') return;
    logger.warn('Notification permission not granted');
  };

  const scheduleNotification = async (prayerName: string) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Prayer Time', body: `Time for ${prayerName}` },
        trigger: { seconds: 5 },
      });
    } catch (error) {
      logger.error('Failed to schedule notification:', error);
    }
  };

  return { scheduleNotification };
};
