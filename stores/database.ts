/**
 * Database layer - MMKV storage wrapper
 *
 * Provides typed access to local storage for:
 * - Prayer time data (prayer_YYYY-MM-DD)
 * - User preferences (preference_*)
 * - Notification tracking (scheduled_notifications_*)
 * - App state (fetched_years, app_installed_version)
 */

import { format } from 'date-fns';
import { createJSONStorage } from 'jotai/utils';
import { createMMKV } from 'react-native-mmkv';

import logger from '@/shared/logger';
import * as NotificationUtils from '@/shared/notifications';
import * as TimeUtils from '@/shared/time';
import { ISingleApiResponseTransformed, ScheduleType } from '@/shared/types';

/** MMKV database instance - explicit ID required for Android production persistence */
export const database = createMMKV({ id: 'athan-storage' });

/**
 * Gets a JSON-parsed item from storage
 * @param key Storage key
 * @returns Parsed value or null if not found
 */
export const getItem = (key: string) => {
  const value = database.getString(key);
  const data = value ? JSON.parse(value) : null;
  logger.info(`MMKV READ: ${key} ::`, data);

  return data;
};

/**
 * Sets a JSON-stringified item in storage
 * @param key Storage key
 * @param value Value to store (will be JSON stringified)
 */
export const setItem = (key: string, value: unknown) => {
  logger.info(`MMKV WRITE: ${key} ::`, value);
  database.set(key, JSON.stringify(value));
};

/**
 * Removes an item from storage
 * @param key Storage key to remove
 */
export const removeItem = (key: string) => {
  logger.info(`MMKV DELETE: ${key}`);
  database.remove(key);
};

/** Jotai-compatible storage interface for atomWithStorage */
export const mmkvStorage = createJSONStorage(() => ({ getItem, setItem, removeItem }));

/**
 * Gets all items with a given key prefix
 * @param prefix Key prefix to match (e.g., "prayer_", "scheduled_notifications_")
 * @returns Array of parsed values
 */
export const getAllWithPrefix = (prefix: string) => {
  const allKeys = database.getAllKeys();
  const matchingKeys = allKeys.filter((key) => key.startsWith(prefix));

  const items = matchingKeys.map((key) => getItem(key)).filter(Boolean);

  logger.info(`MMKV READ ALL: ${prefix} ::`, items);

  return items;
};

/**
 * Clears all items with a given key prefix
 * @param prefix Key prefix to match for deletion
 */
export const clearPrefix = (prefix: string) => {
  const allKeys = database.getAllKeys();
  const matchingKeys = allKeys.filter((key) => key.startsWith(prefix));

  matchingKeys.forEach((key) => {
    database.remove(key);
    logger.info(`MMKV DELETE: ${key}`);
  });

  logger.info(`MMKV INFO: Cleared ${matchingKeys.length} entries with prefix "${prefix}"`);
};

/**
 * Clears ALL keys EXCEPT those matching the keep prefixes (whitelist approach)
 * This is safer than blacklist deletion - unknown/orphaned keys get cleaned up
 * @param keepPrefixes Array of string prefixes for keys to preserve
 */
export const clearAllExcept = (keepPrefixes: string[]) => {
  const allKeys = database.getAllKeys();
  const keysToDelete: string[] = [];
  const keysToKeep: string[] = [];

  for (const key of allKeys) {
    const shouldKeep = keepPrefixes.some((prefix) => key.startsWith(prefix));
    if (shouldKeep) {
      keysToKeep.push(key);
    } else {
      keysToDelete.push(key);
    }
  }

  for (const key of keysToDelete) {
    database.remove(key);
    logger.info(`MMKV DELETE: ${key}`);
  }

  logger.info(`MMKV CLEANUP: Deleted ${keysToDelete.length} keys, kept ${keysToKeep.length} keys`);
  if (keysToKeep.length > 0) {
    logger.info(`MMKV KEPT: [${keysToKeep.join(', ')}]`);
  }
};

/**
 * Saves all prayer times to storage
 * Each prayer is stored with key format: prayer_YYYY-MM-DD
 * @param prayers Array of transformed prayer data from API
 */
export const saveAllPrayers = (prayers: ISingleApiResponseTransformed[]) => {
  prayers.forEach((prayer) => {
    const key = `prayer_${prayer.date}`;

    database.set(key, JSON.stringify(prayer));
    logger.info(`MMKV WRITE: ${key}`);
  });

  logger.info(`MMKV INFO: ${prayers.length} prayers saved`);
};

/**
 * Gets prayer data for a specific date
 * @param date Date to fetch prayer times for
 * @returns Prayer data or null if not found
 */
export const getPrayerByDate = (date: Date): ISingleApiResponseTransformed | null => {
  const londonDate = TimeUtils.createLondonDate(date);
  const keyDate = format(londonDate, 'yyyy-MM-dd');
  const key = `prayer_${keyDate}`;

  const data = database.getString(key);

  logger.info(`MMKV READ: ${key}`);

  return data ? JSON.parse(data) : null;
};

/**
 * Marks a year as having been fetched from the API
 * @param year Year to mark as fetched
 */
export const markYearAsFetched = (year: number) => {
  const key = `fetched_years`;
  const fetchedYears = getItem(key) || {};
  setItem(key, { ...fetchedYears, [year]: true });
};

/**
 * Clears all scheduled notification records for a schedule type
 * @param scheduleType Schedule type (Standard or Extra)
 */
export function clearAllScheduledNotificationsForSchedule(scheduleType: ScheduleType) {
  clearPrefix(`scheduled_notifications_${scheduleType}`);
}

/**
 * Clears all scheduled notification records for a specific prayer
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule
 */
export function clearAllScheduledNotificationsForPrayer(scheduleType: ScheduleType, prayerIndex: number) {
  clearPrefix(`scheduled_notifications_${scheduleType}_${prayerIndex}`);
}

/**
 * Adds a scheduled notification record for a prayer
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule
 * @param notification Notification data to store
 */
export const addOneScheduledNotificationForPrayer = (
  scheduleType: ScheduleType,
  prayerIndex: number,
  notification: NotificationUtils.ScheduledNotification
) => {
  const key = `scheduled_notifications_${scheduleType}_${prayerIndex}_${notification.id}`;

  setItem(key, notification);

  logger.info('NOTIFICATION DB: Added:', notification);
};

/**
 * Gets all scheduled notifications for a schedule type
 * @param scheduleType Schedule type (Standard or Extra)
 * @returns Array of scheduled notifications
 */
export const getAllScheduledNotificationsForSchedule = (
  scheduleType: ScheduleType
): NotificationUtils.ScheduledNotification[] => {
  const prefix = `scheduled_notifications_${scheduleType}`;
  const notifications: NotificationUtils.ScheduledNotification[] = getAllWithPrefix(prefix);

  logger.info('NOTIFICATION DB: Read:', notifications);
  return notifications;
};

/**
 * Gets all scheduled notifications for a specific prayer
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule
 * @returns Array of scheduled notifications
 */
export const getAllScheduledNotificationsForPrayer = (scheduleType: ScheduleType, prayerIndex: number) => {
  const prefix = `scheduled_notifications_${scheduleType}_${prayerIndex}`;
  const notifications = getAllWithPrefix(prefix);

  logger.info('NOTIFICATION DB: Read:', notifications);
  return notifications;
};

// =============================================================================
// REMINDER DATABASE FUNCTIONS
// =============================================================================

/**
 * Adds a scheduled reminder record for a prayer
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule
 * @param notification Notification data to store
 */
export const addOneScheduledReminderForPrayer = (
  scheduleType: ScheduleType,
  prayerIndex: number,
  notification: NotificationUtils.ScheduledNotification
) => {
  const key = `scheduled_reminders_${scheduleType}_${prayerIndex}_${notification.id}`;

  setItem(key, notification);

  logger.info('REMINDER DB: Added:', notification);
};

/**
 * Gets all scheduled reminders for a specific prayer
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule
 * @returns Array of scheduled reminders
 */
export const getAllScheduledRemindersForPrayer = (scheduleType: ScheduleType, prayerIndex: number) => {
  const prefix = `scheduled_reminders_${scheduleType}_${prayerIndex}`;
  const reminders = getAllWithPrefix(prefix);

  logger.info('REMINDER DB: Read:', reminders);
  return reminders;
};

/**
 * Clears all scheduled reminder records for a specific prayer
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule
 */
export function clearAllScheduledRemindersForPrayer(scheduleType: ScheduleType, prayerIndex: number) {
  clearPrefix(`scheduled_reminders_${scheduleType}_${prayerIndex}`);
}

/**
 * Clears all scheduled reminder records for a schedule type
 * @param scheduleType Schedule type (Standard or Extra)
 */
export function clearAllScheduledRemindersForSchedule(scheduleType: ScheduleType) {
  clearPrefix(`scheduled_reminders_${scheduleType}`);
}

/**
 * Full cleanup - clears ALL data from storage (keeps nothing)
 * Uses whitelist approach: deletes everything not in keep list
 * Since keep list is empty, this wipes all data
 */
export const cleanup = () => {
  // Full cleanup keeps NOTHING - complete wipe
  clearAllExcept([]);
};
