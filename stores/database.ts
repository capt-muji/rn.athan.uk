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

/** MMKV database instance */
export const database = createMMKV();

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

/**
 * Clears data from storage - uncomment lines to clear specific data
 * Organized by category for easy selection
 */
export const cleanup = () => {
  // --- Prayer Data ---
  clearPrefix('prayer_'); // Daily prayer times data
  clearPrefix('fetched_years'); // Years that have been fetched from API
  clearPrefix('display_date'); // Current display date
  clearPrefix('measurements_list'); // List component position
  clearPrefix('measurements_date'); // Date component position
  clearPrefix('prayer_max_english_width_standard'); // Max width for standard prayers
  clearPrefix('prayer_max_english_width_extra'); // Max width for extra prayers
  clearPrefix('preference_alert_standard_'); // Standard prayer alerts (6 prayers)
  clearPrefix('preference_alert_extra_'); // Extra prayer alerts (4 prayers)
  clearPrefix('preference_sound'); // Selected Athan sound
  clearPrefix('preference_countdownbar_shown'); // Countdown bar visibility
  clearPrefix('preference_countdownbar_color'); // Countdown bar color
  clearPrefix('preference_hijri_date'); // Hijri date display
  clearPrefix('preference_show_seconds'); // Show seconds
  clearPrefix('preference_show_time_passed'); // Show time passed
  clearPrefix('preference_show_arabic_names'); // Show Arabic names
  clearPrefix('scheduled_notifications_'); // All scheduled notification tracking
  clearPrefix('last_notification_schedule_check'); // Last notification refresh timestamp
  clearPrefix('popup_update_last_check'); // Last app update check timestamp
  clearPrefix('app_installed_version'); // Installed app version
};
