import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import logger from '@/shared/logger';
import { getSoundPreference } from '@/stores/notifications';

// Configure notifications to show when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const registerForPushNotifications = async () => {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return;
  await Notifications.requestPermissionsAsync();
};

export const useNotification = () => {
  useEffect(() => {
    registerForPushNotifications().catch((error) => {
      logger.error('Failed to register for notifications:', error);
    });
  }, []);

  const scheduleNotification = async (englishName: string, arabicName: string) => {
    const sound = getSoundPreference();

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: englishName,
          body: `\u200E${arabicName}`, // LTR mark to force left alignment
          sound: `athan${sound + 1}.wav`,
        },
        trigger: { seconds: 3 },
      });

      logger.info('Scheduled notification:', { englishName, arabicName, sound });
    } catch (error) {
      logger.error('Failed to schedule notification:', error);
    }
  };

  return { scheduleNotification };
};
