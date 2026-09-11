import { subMinutes } from 'date-fns';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import logger from '@/shared/logger';
import * as NotificationUtils from '@/shared/notifications';
import { AlertType, type Prayer, type ReminderInterval, type ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';

export const updateAndroidChannel = async (sound: number) => {
  if (Platform.OS !== 'android') return;

  const channelId = NotificationUtils.athanAndroidChannelId(sound);

  await Notifications.setNotificationChannelAsync(channelId, {
    name: `Athan ${sound + 1}`,
    sound: `athan${sound + 1}.mp3`,
    importance: Notifications.AndroidImportance.MAX,
    enableVibrate: true,
    vibrationPattern: [0, 250, 250, 250],
    bypassDnd: true,
  });

  return channelId;
};

/**
 * Builds the deterministic identifier for an at-time prayer notification.
 * Same identifier = idempotent replace on both platforms (Android PendingIntent is
 * derived from the identifier; iOS UNUserNotificationCenter replaces by identifier),
 * so re-scheduling can never create a duplicate even if MMKV bookkeeping is lost.
 */
export const prayerNotificationIdentifier = (scheduleType: ScheduleType, englishName: string, date: string) =>
  `athan_${scheduleType}_${englishName.toLowerCase()}_${date}`;

/**
 * Builds the deterministic identifier for a pre-prayer reminder notification.
 * Includes the interval so changed intervals get a fresh identity (old one is
 * cancelled via the per-prayer clear before re-scheduling).
 */
export const reminderNotificationIdentifier = (
  scheduleType: ScheduleType,
  englishName: string,
  date: string,
  intervalMinutes: ReminderInterval
) => `reminder_${scheduleType}_${englishName.toLowerCase()}_${date}_${intervalMinutes}`;

/**
 * Schedules the at-time notification for one prayer on one day's list
 *
 * Fires at the prayer's own datetime — the exact moment its list row and the
 * countdown show — never at a date/time pair re-read on the device's clock.
 *
 * @param scheduleType Schedule type (Standard or Extra) - part of the deterministic identifier
 * @param date Day of the list the prayer belongs to (YYYY-MM-DD) - part of the identifier
 * @param prayer The prayer as its list row has it (PrayerUtils.getPrayerForDate)
 * @param alertType Alert type (Off/Silent/Sound)
 * @param soundPreference Selected athan index
 * @returns Scheduled notification data
 */
export const addOneScheduledNotificationForPrayer = async (
  scheduleType: ScheduleType,
  date: string,
  prayer: Prayer,
  alertType: AlertType,
  soundPreference: number
): Promise<NotificationUtils.ScheduledNotification> => {
  const { english: englishName, arabic: arabicName, time } = prayer;
  const triggerDate = prayer.datetime;
  const content = NotificationUtils.genNotificationContent(englishName, arabicName, alertType, soundPreference);
  const identifier = prayerNotificationIdentifier(scheduleType, englishName, date);
  // Only include channelId for Sound alerts; the channel is prayer-aware
  // (selected athan for the 5 daily prayers, fixed extras channel for
  // Sunrise + extras — ISSUES.md #23)
  const atTimeChannelId =
    alertType === AlertType.Sound ? NotificationUtils.atTimeAndroidChannelId(englishName, soundPreference) : undefined;

  // The extras channel is created at schedule time too: headless background-task
  // reschedules run without UI init, and Android drops notifications posted to
  // nonexistent channels (same reasoning as the reminder channels)
  if (alertType === AlertType.Sound && Platform.OS === 'android' && !NotificationUtils.isDailyPrayer(englishName)) {
    await NotificationUtils.createExtrasAndroidChannel();
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      identifier,
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: atTimeChannelId,
      },
    });

    const notification = { id, date, time, englishName, arabicName, alertType };
    logger.info('NOTIFICATION SYSTEM: Scheduled:', { ...notification, identifier });
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

// =============================================================================
// REMINDER DEVICE FUNCTIONS
// =============================================================================

/**
 * Schedules a single reminder notification for a prayer
 *
 * Fires `intervalMinutes` before the prayer's own datetime — the moment its list
 * row and the countdown show.
 *
 * @param scheduleType Schedule type (Standard or Extra) - part of the deterministic identifier
 * @param date Day of the list the prayer belongs to (YYYY-MM-DD) - part of the identifier
 * @param prayer The prayer as its list row has it (PrayerUtils.getPrayerForDate)
 * @param intervalMinutes Minutes before prayer time
 * @param alertType Alert type (Off/Silent/Sound)
 * @returns Scheduled notification data
 */
export const addOneScheduledReminderForPrayer = async (
  scheduleType: ScheduleType,
  date: string,
  prayer: Prayer,
  intervalMinutes: ReminderInterval,
  alertType: AlertType
): Promise<NotificationUtils.ScheduledNotification> => {
  const { english: englishName, arabic: arabicName, time } = prayer;
  const triggerDate = subMinutes(prayer.datetime, intervalMinutes);
  const content = NotificationUtils.genReminderNotificationContent(englishName, arabicName, intervalMinutes, alertType);
  const identifier = reminderNotificationIdentifier(scheduleType, englishName, date, intervalMinutes);
  const isAndroidSound = alertType === AlertType.Sound && Platform.OS === 'android';
  const reminderChannelId = isAndroidSound
    ? NotificationUtils.reminderAndroidChannelId(englishName, intervalMinutes)
    : undefined;

  if (isAndroidSound) {
    await NotificationUtils.createReminderAndroidChannel(englishName, intervalMinutes);
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      identifier,
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: reminderChannelId,
      },
    });

    const notification = { id, date, time, englishName, arabicName, alertType };
    logger.info('REMINDER SYSTEM: Scheduled:', { ...notification, identifier });
    return notification;
  } catch (error) {
    logger.error('REMINDER SYSTEM: Failed to schedule:', error);
    throw error;
  }
};

/**
 * Cancels all scheduled reminders for a specific prayer
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule
 */
export const clearAllScheduledRemindersForPrayer = async (scheduleType: ScheduleType, prayerIndex: number) => {
  const reminders = Database.getAllScheduledRemindersForPrayer(scheduleType, prayerIndex);

  // Cancel all reminders
  const promises = reminders.map((reminder) =>
    Notifications.cancelScheduledNotificationAsync(reminder.id).catch((error) =>
      logger.warn('REMINDER SYSTEM: Failed to cancel reminder:', { id: reminder.id, error })
    )
  );
  await Promise.all(promises);

  logger.info('REMINDER SYSTEM: Cancelled all reminders for prayer:', { scheduleType, prayerIndex });
};
