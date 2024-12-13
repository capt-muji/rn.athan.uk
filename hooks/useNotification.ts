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

  const scheduleNotification = async (englishName: string, arabicName: string) => {
    try {
      logger.info('Scheduling notification:', englishName, arabicName);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: englishName,
          body: `\u200E${arabicName}`, // LTR mark to force left alignment
          // is this needed?
          categoryIdentifier: 'my-local-category',
        },
        trigger: { seconds: 5 },
      });
      logger.info('Notification scheduled:', englishName, arabicName);
    } catch (error) {
      logger.error('Failed to schedule notification:', error);
    }
  };

  return { scheduleNotification };
};
