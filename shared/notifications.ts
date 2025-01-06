import { format, addDays, isBefore } from 'date-fns';

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

export interface NotificationSchedule {
  [prayerIndex: number]: ScheduledNotification[];
}

/**
 * Creates notification trigger date from prayer date and time
 */
export const createTriggerDate = (date: string, time: string): Date => {
  const [hours, minutes] = time.split(':').map(Number);
  const triggerDate = new Date(date);

  triggerDate.setHours(hours, minutes, 0, 0);
  return triggerDate;
};

/**
 * Gets notification sound based on alert type
 */
export const getNotificationSound = (alertType: AlertType, soundIndex: number): string | null => {
  if (alertType === AlertType.Sound) {
    return `athan${soundIndex + 1}.wav`;
  }
  return null;
};

/**
 * Creates notification content based on alert type
 */
export const createNotificationContent = (
  englishName: string,
  arabicName: string,
  alertType: AlertType,
  soundIndex: number
) => {
  return {
    title: englishName,
    body: `\u200E${arabicName}`, // LTR mark
    sound: getNotificationSound(alertType, soundIndex),
  };
};

/**
 * Checks if a scheduled notification is outdated
 */
export const isNotificationOutdated = (notification: ScheduledNotification): boolean => {
  const triggerDate = createTriggerDate(notification.date, notification.time);
  const now = TimeUtils.createLondonDate(new Date());

  return isBefore(triggerDate, now);
};

/**
 * Checks if a given prayer time is in the future
 */
export const isPrayerTimeInFuture = (date: string, time: string): boolean => {
  const triggerDate = createTriggerDate(date, time);
  const now = TimeUtils.createLondonDate(new Date());
  return triggerDate > now;
};

/**
 * Generates next 5 dates from given date
 */
export const getNext5Days = (startDate: Date = new Date()): string[] => {
  return Array.from({ length: 5 }, (_, i) => {
    const date = addDays(startDate, i);
    return format(date, 'yyyy-MM-dd');
  });
};

/**
 * Creates notification identifier
 */
export const createNotificationId = (scheduleType: ScheduleType, prayerIndex: number, date: string): string => {
  return `${scheduleType}_${prayerIndex}_${date}`;
};
