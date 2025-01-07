import { format, addDays } from 'date-fns';

import * as TimeUtils from '@/shared/time';
import { AlertType, ScheduleType } from '@/shared/types';

export interface ScheduledNotification {
  id: string;
  date: string;
  time: string;
  englishName: string;
  arabicName: string;
  alertType: AlertType;
}

// export interface NotificationSchedule {
//   [prayerIndex: number]: ScheduledNotification[];
// }

/**
 * Creates notification trigger date from prayer date and time
 */
export const genTriggerDate = (date: string, time: string): Date => {
  const [hours, minutes] = time.split(':').map(Number);
  const triggerDate = TimeUtils.createLondonDate(date);

  triggerDate.setHours(hours, minutes, 0, 0);
  return triggerDate;
};

/**
 * Gets notification sound based on alert type
 */
export const getNotificationSound = (alertType: AlertType, soundIndex: number): string | null => {
  if (alertType !== AlertType.Sound) return null;

  return `athan${soundIndex + 1}.wav`;
};

/**
 * Creates notification content based on alert type
 */
export const genNotificationContent = (
  englishName: string,
  arabicName: string,
  alertType: AlertType,
  soundIndex: number
) => {
  return {
    title: englishName,
    body: `\u200E${arabicName}`, // LTR mark
    sound: getNotificationSound(alertType, soundIndex) || undefined,
  };
};

// /**
//  * Checks if a scheduled notification is outdated
//  */
// export const isNotificationOutdated = (notification: ScheduledNotification): boolean => {
//   const triggerDate = createTriggerDate(notification.date, notification.time);
//   const now = TimeUtils.createLondonDate();

//   return isBefore(triggerDate, now);
// };

/**
 * Checks if a given prayer time is in the future
 */
export const isPrayerTimeInFuture = (date: string, time: string): boolean => {
  const triggerDate = genTriggerDate(date, time);
  const now = TimeUtils.createLondonDate();
  return triggerDate > now;
};

/**
 * Generates next 5 dates from given date
 */
export const genNext5Days = (startDate: Date = TimeUtils.createLondonDate()): string[] => {
  return Array.from({ length: 5 }, (_, i) => {
    const date = addDays(startDate, i);
    return format(date, 'yyyy-MM-dd');
  });
};

// /**
//  * Creates notification identifier
//  */
// export const genNotificationId = (scheduleType: ScheduleType, prayerIndex: number, date: string): string => {
//   return `${scheduleType}_${prayerIndex}_${date}`;
// };

/**
 * Creates storage key for scheduled notifications array based on schedule type and prayer index
 */
export const genKeyScheduledNotificationsForPrayer = (scheduleType: ScheduleType, prayerIndex: number): string => {
  return `scheduled_notifications_${scheduleType}_${prayerIndex}`;
};
