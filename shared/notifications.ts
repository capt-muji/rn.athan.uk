import { format, addDays, isBefore, subMinutes } from 'date-fns';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import logger from '@/shared/logger';
import * as TimeUtils from '@/shared/time';
import { AlertType, ReminderInterval } from '@/shared/types';

export interface ScheduledNotification {
  id: string;
  date: string;
  time: string;
  englishName: string;
  arabicName: string;
  alertType: AlertType;
}

/**
 * Creates notification trigger date from prayer date and time
 *
 * Timezone handling:
 * - Input date/time are interpreted as London timezone (Europe/London)
 * - Output Date object is in system local time but represents the same moment
 * - This ensures notifications fire at the correct prayer time regardless of device timezone
 *
 * @param date Date string in YYYY-MM-DD format (London timezone)
 * @param time Time string in HH:mm format (London timezone)
 * @returns Date object for notification scheduling
 *
 * @example
 * genTriggerDate("2026-01-24", "06:15")
 * // Returns: Date representing 06:15 London time on Jan 24, 2026
 */
export const genTriggerDate = (date: string, time: string): Date => {
  const [hours, minutes] = time.split(':').map(Number);
  const triggerDate = TimeUtils.createLondonDate(date);

  triggerDate.setHours(hours, minutes, 0, 0);
  return triggerDate;
};

/**
 * Gets notification sound based on alert type
 * Returns false for silent notifications (SDK 54 requirement)
 */
export const getNotificationSound = (alertType: AlertType, soundIndex: number): string | false => {
  if (alertType !== AlertType.Sound) return false;

  return `athan${soundIndex + 1}.wav`;
};

/**
 * Creates notification content based on alert type
 * English-only, title only (no body)
 */
export const genNotificationContent = (
  englishName: string,
  _arabicName: string,
  alertType: AlertType,
  soundIndex: number
): Notifications.NotificationContentInput => {
  return {
    title: englishName,
    sound: getNotificationSound(alertType, soundIndex),
    color: '#5a3af7',
    autoDismiss: false,
    sticky: false,
    priority: Notifications.AndroidNotificationPriority.MAX,
    interruptionLevel: 'timeSensitive',
  };
};

/**
 * Gets notification sound for reminder based on alert type
 * Reminders use a separate sound file (reminder.wav)
 */
export const getReminderNotificationSound = (alertType: AlertType): string | false => {
  if (alertType !== AlertType.Sound) return false;

  return 'reminder.wav';
};

/**
 * Creates notification content for pre-prayer reminder
 * English-only, title only (no body)
 * @param englishName English prayer name
 * @param _arabicName Arabic prayer name (unused, kept for API compatibility)
 * @param intervalMinutes Minutes before prayer time
 * @param alertType Alert type (Off/Silent/Sound)
 * @returns Notification content input
 */
export const genReminderNotificationContent = (
  englishName: string,
  _arabicName: string,
  intervalMinutes: ReminderInterval,
  alertType: AlertType
): Notifications.NotificationContentInput => {
  return {
    title: `${englishName} in ${intervalMinutes}m`,
    sound: getReminderNotificationSound(alertType),
    color: '#5a3af7',
    autoDismiss: true,
    sticky: false,
    priority: Notifications.AndroidNotificationPriority.HIGH,
    interruptionLevel: 'timeSensitive',
  };
};

/**
 * Creates trigger date for reminder notification
 * @param date Date string in YYYY-MM-DD format
 * @param time Time string in HH:mm format
 * @param intervalMinutes Minutes before prayer time to trigger reminder
 * @returns Date object for reminder scheduling
 */
export const genReminderTriggerDate = (date: string, time: string, intervalMinutes: ReminderInterval): Date => {
  const prayerTime = genTriggerDate(date, time);
  const reminderTime = subMinutes(prayerTime, intervalMinutes);
  return reminderTime;
};

/**
 * Checks if a scheduled notification is outdated
 */
export const isNotificationOutdated = (notification: ScheduledNotification): boolean => {
  const triggerDate = genTriggerDate(notification.date, notification.time);
  const now = TimeUtils.createLondonDate();

  return isBefore(triggerDate, now);
};

/**
 * Checks if a given prayer time is in the future
 */
export const isPrayerTimeInFuture = (date: string, time: string): boolean => {
  const triggerDate = genTriggerDate(date, time);
  const now = TimeUtils.createLondonDate();
  return triggerDate > now;
};

/**
 * Generates X consecutive dates starting from given date (inclusive)
 * Index 0 is the start date (today if not specified)
 */
export const genNextXDays = (numberOfDays: number): string[] => {
  const today = TimeUtils.createLondonDate();

  return Array.from({ length: numberOfDays }, (_, i) => {
    const date = addDays(today, i);
    return format(date, 'yyyy-MM-dd');
  });
};

export const createDefaultAndroidChannel = async () => {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('athan_1', {
    name: 'Athan 1',
    sound: 'athan1.wav',
    importance: Notifications.AndroidImportance.MAX,
    enableVibrate: true,
    vibrationPattern: [0, 250, 250, 250],
    bypassDnd: true,
  });
};

/**
 * Creates Android notification channel for reminders
 * Uses a separate channel for pre-prayer reminder notifications
 */
export const createReminderAndroidChannel = async () => {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('reminder', {
    name: 'Prayer Reminders',
    sound: 'reminder.wav',
    importance: Notifications.AndroidImportance.HIGH,
    enableVibrate: true,
    vibrationPattern: [0, 250, 250, 250],
    bypassDnd: true,
  });
};

/**
 * Initializes notifications
 * Uses dependency injection to avoid circular import with stores/notifications.ts
 *
 * @param checkPermissions Function to check notification permissions
 * @param refreshFn Function to refresh notifications (injected to break cycle)
 * @param registerBackgroundTaskFn Optional function to register background task (injected to break cycle)
 */
export const initializeNotifications = async (
  checkPermissions: () => Promise<boolean>,
  refreshFn: () => Promise<void>,
  registerBackgroundTaskFn?: () => Promise<void>
) => {
  try {
    await createDefaultAndroidChannel();
    await createReminderAndroidChannel();

    const hasPermission = await checkPermissions();
    if (hasPermission) {
      await refreshFn();

      // Register background task for notification refresh when app is closed
      if (registerBackgroundTaskFn) {
        await registerBackgroundTaskFn();
      }
    } else {
      logger.info('NOTIFICATION: Notifications disabled, skipping refresh and background task registration');
    }
  } catch (error) {
    logger.error('NOTIFICATION: Failed to initialize notifications:', error);
  }
};
