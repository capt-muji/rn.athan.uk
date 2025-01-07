import { format } from 'date-fns';
import { createJSONStorage } from 'jotai/utils';
import { MMKV } from 'react-native-mmkv';

import logger from '@/shared/logger';
import * as NotificationUtils from '@/shared/notifications';
import * as TimeUtils from '@/shared/time';
import { ISingleApiResponseTransformed, ScheduleType } from '@/shared/types';

export const database = new MMKV();

export const getItem = (key: string) => {
  const value = database.getString(key);
  const data = value ? JSON.parse(value) : null;
  logger.info(`MMKV READ: ${key} ::`, data);

  return data;
};

export const setItem = (key: string, value: unknown) => {
  logger.info(`MMKV WRITE: ${key} ::`, value);
  database.set(key, JSON.stringify(value));
};

export const removeItem = (key: string) => {
  logger.info(`MMKV DELETE: ${key}`);
  database.delete(key);
};

/** Simple storage interface */
export const mmkvStorage = createJSONStorage(() => ({ getItem, setItem, removeItem }));

export const getAllWithPrefix = (prefix: string) => {
  const allKeys = database.getAllKeys();
  const matchingKeys = allKeys.filter((key) => key.startsWith(prefix));

  const items = matchingKeys.map((key) => getItem(key)).filter(Boolean);

  logger.info(`MMKV READ ALL: ${prefix} ::`, items);

  return items;
};

export const clearPrefix = (prefix: string) => {
  const keys = database.getAllKeys();

  keys.forEach((key) => {
    if (!key.startsWith(prefix)) return;

    database.delete(key);
    logger.info(`MMKV DELETE: ${key}`);
  });

  logger.info(`MMKV INFO: Cleared all entries with prefix "${prefix}"`);
};

export const saveAllPrayers = (prayers: ISingleApiResponseTransformed[]) => {
  prayers.forEach((prayer) => {
    const key = `prayer_${prayer.date}`;

    database.set(key, JSON.stringify(prayer));
    logger.info(`MMKV WRITE: ${key}`);
  });

  logger.info(`MMKV INFO: ${prayers.length} prayers saved`);
};

export const getPrayerByDate = (date: Date): ISingleApiResponseTransformed | null => {
  const londonDate = TimeUtils.createLondonDate(date);
  const keyDate = format(londonDate, 'yyyy-MM-dd');
  const key = `prayer_${keyDate}`;

  const data = database.getString(key);

  logger.info(`MMKV READ: ${key}`);

  return data ? JSON.parse(data) : null;
};

export const markYearAsFetched = (year: number) => {
  const key = `fetched_years`;
  const fetchedYears = getItem(key) || {};
  setItem(key, { ...fetchedYears, [year]: true });
};

export function clearAllScheduledNotificationsForSchedule(scheduleType: ScheduleType) {
  clearPrefix(`scheduled_notifications_${scheduleType}`);
}

export function clearAllScheduledNotificationsForPrayer(scheduleType: ScheduleType, prayerIndex: number) {
  clearPrefix(`scheduled_notifications_${scheduleType}_${prayerIndex}`);
}

export const addOneScheduledNotificationForPrayer = (
  scheduleType: ScheduleType,
  prayerIndex: number,
  notification: NotificationUtils.ScheduledNotification
) => {
  const key = `scheduled_notifications_${scheduleType}_${prayerIndex}_${notification.id}`;

  setItem(key, notification);

  logger.info('NOTIFICATION DB: Added:', notification);
};

export const getAllScheduledNotificationsForSchedule = (
  scheduleType: ScheduleType
): NotificationUtils.ScheduledNotification[] => {
  const prefix = `scheduled_notifications_${scheduleType}`;
  const notifications: NotificationUtils.ScheduledNotification[] = getAllWithPrefix(prefix);

  logger.info('NOTIFICATION DB: Read:', notifications);
  return notifications;
};

export const getAllScheduledNotificationsForPrayer = (scheduleType: ScheduleType, prayerIndex: number) => {
  const prefix = `scheduled_notifications_${scheduleType}_${prayerIndex}`;
  const notifications = getAllWithPrefix(prefix);

  logger.info('NOTIFICATION DB: Read:', notifications);
  return notifications;
};

/**
 * Clears prayer-related data from storage
 * Preserves user preferences
 */
export const cleanup = () => {
  clearPrefix('prayer_');
  clearPrefix('display_date');
  clearPrefix('fetched_years');
  clearPrefix('scheduled_notifications'); // ! TODO: remove this line
};
