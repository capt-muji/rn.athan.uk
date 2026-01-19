import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import logger from '@/shared/logger';
import * as NotificationUtils from '@/shared/notifications';
import { AlertType, ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';

export const updateAndroidChannel = async (sound: number) => {
  if (Platform.OS !== 'android') return;

  const channelId = `athan_${sound + 1}`;

  await Notifications.setNotificationChannelAsync(channelId, {
    name: `Athan ${sound + 1}`,
    sound: `athan${sound + 1}.wav`,
    importance: Notifications.AndroidImportance.MAX,
    enableVibrate: true,
    vibrationPattern: [0, 250, 250, 250],
  });

  return channelId;
};

export const addOneScheduledNotificationForPrayer = async (
  englishName: string,
  arabicName: string,
  date: string,
  time: string,
  alertType: AlertType,
  soundPreference: number
): Promise<NotificationUtils.ScheduledNotification> => {
  const triggerDate = NotificationUtils.genTriggerDate(date, time);
  const content = NotificationUtils.genNotificationContent(englishName, arabicName, alertType, soundPreference);

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        // Only include channelId for Android when alert type is Sound
        channelId: alertType === AlertType.Sound ? `athan_${soundPreference + 1}` : undefined,
      },
    });

    const notification = { id, date, time, englishName, arabicName, alertType };
    logger.info('NOTIFICATION SYSTEM: Scheduled:', notification);
    return notification;
  } catch (error) {
    logger.error('NOTIFICATION SYSTEM: Failed to schedule:', error);
    throw error;
  }
};

export const cancelScheduledNotificationById = async (notificationId: string) => {
  await Notifications.cancelScheduledNotificationAsync(notificationId);

  logger.info('NOTIFICATION SYSTEM: Cancelled:', notificationId);
};

export const clearAllScheduledNotificationForPrayer = async (scheduleType: ScheduleType, prayerIndex: number) => {
  const notifications = Database.getAllScheduledNotificationsForPrayer(scheduleType, prayerIndex);

  // Cancel all notifications
  const promises = notifications.map((notification) => Notifications.cancelScheduledNotificationAsync(notification.id));
  await Promise.all(promises);

  logger.info('NOTIFICATION SYSTEM: Cancelled all notifications for prayer:', { scheduleType, prayerIndex });
};
