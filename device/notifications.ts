import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import logger from '@/shared/logger';
import * as NotificationUtils from '@/shared/notifications';
import { AlertType, ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';
import * as NotificationStore from '@/stores/notifications';

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
  alertType: AlertType
): Promise<NotificationUtils.ScheduledNotification> => {
  const sound = NotificationStore.getSoundPreference();
  const triggerDate = NotificationUtils.genTriggerDate(date, time);
  const content = NotificationUtils.genNotificationContent(englishName, arabicName, alertType, sound);

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        // Only include channelId for Android when alert type is Sound
        channelId: alertType === AlertType.Sound ? `athan_${sound + 1}` : undefined,
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

/**
 * Sends an immediate silent notification on iOS to trigger the time-sensitive permissions prompt.
 *
 * Problem:
 * On iOS, the time-sensitive permission dialog only appears when the first time-sensitive
 * notification is delivered. This creates a poor UX since the user wouldn't see the prompt
 * until hours later when the first prayer notification triggers.
 *
 * Solution:
 * We send an empty notification with time-sensitive interruption level immediately after
 * the user grants standard notification permissions. This makes the time-sensitive prompt
 * appear right away, giving the user a better onboarding experience.
 *
 * Note:
 * - iOS only (function returns early on Android)
 * - Uses null trigger for immediate delivery
 * - No sound or visual elements to minimize user disruption
 * - Should only be called once after standard permissions are granted
 */
export const sendSilentNotification = async () => {
  if (Platform.OS !== 'ios') return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '',
        body: '',
        sound: false,
        interruptionLevel: 'timeSensitive',
      },
      trigger: null,
    });
    logger.info('NOTIFICATION SYSTEM: Sent silent notification for iOS time-sensitive permissions');
  } catch (error) {
    logger.error('NOTIFICATION SYSTEM: Failed to send silent notification:', error);
  }
};
