/**
 * Database layer - MMKV storage wrapper
 *
 * Provides typed access to local storage for:
 * - User preferences (preference_*)
 * - Notification tracking (scheduled_notifications_*)
 * - App state (app_installed_version)
 *
 * Prayer days are NOT stored here any more: every day is read from the baked
 * timetable (stores/timetable.ts, the one choke point). What remains here is
 * the one-time removal of the API era's stored days (cleanLegacyDayCacheOnce).
 */

import { createMMKV } from 'react-native-mmkv';

import { isPreview, isProd } from '@/shared/config';
import logger from '@/shared/logger';
import type * as NotificationUtils from '@/shared/notifications';
import type { ScheduleType } from '@/shared/types';

/**
 * MMKV instance id, namespaced by build class: a build that fabricates prayer
 * times (dev) must never share stored preferences and records with a shipped
 * one, and shipped installs keep this id byte for byte.
 */
const DATABASE_ID = isProd() || isPreview() ? 'athan-storage' : 'athan-storage-dev';

/** MMKV database instance - explicit ID required for Android production persistence */
export const database = createMMKV({ id: DATABASE_ID });

/**
 * Gets a JSON-parsed item from storage
 * @param key Storage key
 * @returns Parsed value or null if not found
 */
export const getItem = (key: string) => {
  const value = database.getString(key);
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch (error) {
    // Torn bytes read as absent (T-541's XS capture: one unparseable record took
    // the whole launch down); the value is lost, never invented
    logger.warn('MMKV: a stored value failed to parse, reading it as absent', { key, error });
    return null;
  }
};

/**
 * Gets one stored value exactly as written, without JSON parsing: the string
 * atoms (atomWithStorageString) persist bare values, which getItem cannot read
 * back, so their readers need the raw form to tell a bare value from a quoted one.
 * @param key Storage key
 * @returns The stored string, or undefined when the key holds nothing
 */
export const getRawItem = (key: string): string | undefined => database.getString(key);

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

/**
 * Gets all items with a given key prefix
 * @param prefix Key prefix to match (e.g., "scheduled_notifications_")
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
 * The one-time removal of the API era's stored day cache: the baked timetable
 * replaced it, and dead keys must not sit in every install forever.
 *
 * Day keys and the fetched-year markers go; prayer_max_name_width_ stays (a
 * different family that only shares the prayer_ prefix), and so does every
 * preference and record. The flag makes it cost one key read per sync run and
 * one enumeration ever. A failure leaves the flag unset, so the next sync
 * retries.
 */
const LEGACY_DAY_CACHE_CLEANED_KEY = 'legacy_day_cache_cleaned';

export const cleanLegacyDayCacheOnce = (): void => {
  if (database.getString(LEGACY_DAY_CACHE_CLEANED_KEY) === 'done') return;

  try {
    let removed = 0;
    for (const key of database.getAllKeys()) {
      if (/^prayer_\d{4}-\d{2}-\d{2}$/.test(key) || key === 'fetched_years') {
        database.remove(key);
        removed += 1;
      }
    }
    if (removed > 0) logger.info('DATABASE: Removed legacy cached day keys', { removed });
  } catch (error) {
    logger.warn('DATABASE: Legacy day-cache cleanup failed, will retry', { error });
    return;
  }

  database.set(LEGACY_DAY_CACHE_CLEANED_KEY, 'done');
};

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
 * Removes one scheduled notification record for a prayer
 *
 * The records are deleted one identifier at a time rather than by prefix, so the record of a cancel the phone refused
 * can be kept: that record is the only way back to an alarm the OS still holds, since the sweep refuses to cancel
 * anything when no records exist at all.
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule
 * @param id Identifier of the notification whose record to remove
 */
export const removeOneScheduledNotificationForPrayer = (scheduleType: ScheduleType, prayerIndex: number, id: string) =>
  removeItem(`scheduled_notifications_${scheduleType}_${prayerIndex}_${id}`);

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
 * Gets all scheduled reminders for a prayer
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
 * Gets all scheduled reminders for a schedule type
 * @param scheduleType Schedule type (Standard or Extra)
 * @returns Array of scheduled reminders
 */
export const getAllScheduledRemindersForSchedule = (
  scheduleType: ScheduleType
): NotificationUtils.ScheduledNotification[] => {
  const prefix = `scheduled_reminders_${scheduleType}`;
  const reminders: NotificationUtils.ScheduledNotification[] = getAllWithPrefix(prefix);

  logger.info('REMINDER DB: Read:', reminders);
  return reminders;
};

/**
 * Removes one scheduled reminder record for a prayer
 *
 * Deleted one identifier at a time, for the same reason as the at-time records above.
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule
 * @param id Identifier of the reminder whose record to remove
 */
export const removeOneScheduledReminderForPrayer = (scheduleType: ScheduleType, prayerIndex: number, id: string) =>
  removeItem(`scheduled_reminders_${scheduleType}_${prayerIndex}_${id}`);
