import { format } from 'date-fns';
import { createJSONStorage } from 'jotai/utils';
import { createMMKV } from 'react-native-mmkv';

import logger from '@/shared/logger';
import * as NotificationUtils from '@/shared/notifications';
import * as TimeUtils from '@/shared/time';
import { ISingleApiResponseTransformed, ScheduleType } from '@/shared/types';

export const database = createMMKV();

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
  database.remove(key);
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
  logger.info(`MMKV CHECK: ${keys}`);

  keys.forEach((key) => {
    if (!key.startsWith(prefix)) return;

    database.remove(key);
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
 * Clears data from storage - uncomment lines to clear specific data
 * Organized by category for easy selection
 */
export const cleanup = () => {
  // --- Prayer Data (safe to clear, will re-sync from API) ---
  clearPrefix('prayer_'); // Daily prayer times data
  clearPrefix('display_date'); // Current display date
  clearPrefix('fetched_years'); // Years that have been fetched from API
  clearPrefix('measurements_list'); // List component position
  clearPrefix('measurements_date'); // Date component position
  clearPrefix('prayer_max_english_width_standard'); // Max width for standard prayers
  clearPrefix('prayer_max_english_width_extra'); // Max width for extra prayers
  clearPrefix('preference_alert_standard_'); // Standard prayer alerts (6 prayers)
  clearPrefix('preference_alert_extra_'); // Extra prayer alerts (4 prayers)
  clearPrefix('preference_sound'); // Selected Athan sound
  clearPrefix('preference_mute_standard'); // Standard schedule mute state
  clearPrefix('preference_mute_extra'); // Extra schedule mute state
  clearPrefix('preference_progressbar_visible'); // Progress bar visibility state
  clearPrefix('preference_hijri_date'); // Hijri date display preference
  clearPrefix('preference_hide_seconds'); // Hide seconds preference
  // clearPrefix('preference_onboarding_completed'); // First-launch onboarding completion state
  clearPrefix('scheduled_notifications_'); // All scheduled notification tracking
  clearPrefix('last_notification_schedule_check'); // Last notification refresh timestamp
  clearPrefix('popup_update_last_check'); // Last app update check timestamp
  // NOTE: measurements_masjid is NOT persisted to MMKV (ephemeral atom), so no cleanup needed
};
