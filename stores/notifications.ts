import { addHours, differenceInHours, differenceInMinutes, differenceInSeconds, formatISO, subMinutes } from 'date-fns';
import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { getDefaultStore } from 'jotai';

import * as Device from '@/device/notifications';
import {
  BACKGROUND_TASK_INTERVAL_MINUTES,
  BACKGROUND_TASK_NAME,
  DEFAULT_REMINDER_INTERVAL,
  EXTRAS_ARABIC,
  EXTRAS_ENGLISH,
  NOTIFICATION_REFRESH_HOURS,
  NOTIFICATION_ROLLING_DAYS,
  PRAYERS_ARABIC,
  PRAYERS_ENGLISH,
  REMINDER_BUFFER_SECONDS,
} from '@/shared/constants';
import logger from '@/shared/logger';
import * as NotificationUtils from '@/shared/notifications';
import * as TimeUtils from '@/shared/time';
import { AlertType, type ReminderInterval, ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';
import { atomWithStorageNumber } from '@/stores/storage';
import { sync } from '@/stores/sync';
import * as PrayerWidgets from '@/stores/widget';

const store = getDefaultStore();

// Queue-based scheduling lock — operations run sequentially, never dropped
let schedulingQueue: Promise<void> = Promise.resolve();

/**
 * Helper function to wrap async operations with scheduling queue
 * Operations are chained sequentially — each waits for the previous to finish.
 * Unlike a skip-based lock, no operations are dropped.
 * @param operation The async operation to execute
 * @param operationName Name of the operation for logging
 * @returns Result of the operation
 */
async function withSchedulingLock<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
  const result = new Promise<T>((resolve, reject) => {
    schedulingQueue = schedulingQueue.then(async () => {
      logger.info(`NOTIFICATION: Starting ${operationName}`);
      try {
        const value = await operation();
        resolve(value);
      } catch (error) {
        reject(error);
      }
    });
  });

  return result;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Gets the prayer name arrays for a given schedule type
 * @param scheduleType Schedule type (Standard or Extra)
 * @returns Object with english and arabic prayer name arrays
 */
export const getPrayerArrays = (scheduleType: ScheduleType) => {
  const isStandard = scheduleType === ScheduleType.Standard;
  return {
    english: isStandard ? PRAYERS_ENGLISH : EXTRAS_ENGLISH,
    arabic: isStandard ? PRAYERS_ARABIC : EXTRAS_ARABIC,
  };
};

/**
 * Cancels notifications whose identifiers are no longer part of the intended
 * schedule (schedule-first-then-cancel-stale, issue #15).
 *
 * Per-id failures are logged and skipped — a single uncancelable id must not
 * abort the batch; the post-reschedule sweep retries any survivors.
 *
 * @param ids Identifiers to cancel at the OS level
 */
const _cancelStaleNotificationIds = async (ids: string[]) => {
  if (ids.length === 0) return;

  const promises = ids.map((id) =>
    Device.cancelScheduledNotificationById(id).catch((error) =>
      logger.warn('NOTIFICATION: Failed to cancel stale notification:', { id, error })
    )
  );
  await Promise.all(promises);

  logger.info('NOTIFICATION: Cancelled stale notifications:', { count: ids.length, ids });
};

// =============================================================================
// ATOMS
// =============================================================================

/**
 * Factory function to create a prayer alert atom for persisting notification preferences
 *
 * Keys are name-based (not index-based) so preferences survive schedule/data changes
 * and can never bind to the wrong prayer.
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerName English prayer name (e.g. "Fajr", "Last Third")
 * @returns Jotai atom with MMKV persistence for the alert type
 *
 * @example
 * const fajrAlertAtom = createPrayerAlertAtom(ScheduleType.Standard, 'Fajr');
 */
export const createPrayerAlertAtom = (scheduleType: ScheduleType, prayerName: string) => {
  const isStandard = scheduleType === ScheduleType.Standard;
  const type = isStandard ? 'standard' : 'extra';

  return atomWithStorageNumber(`preference_alert_${type}_${prayerName.toLowerCase()}`, AlertType.Off);
};

/**
 * Array of alert atoms for all standard prayers (Fajr, Sunrise, Dhuhr, Asr, Magrib, Isha)
 * Each atom persists the user's notification preference for that prayer.
 * Array positions align with PRAYERS_ENGLISH so index-based lookups keep working.
 */
export const standardPrayerAlertAtoms = PRAYERS_ENGLISH.map((prayerName) =>
  createPrayerAlertAtom(ScheduleType.Standard, prayerName)
);

/**
 * Array of alert atoms for all extra prayers (Duha, Istijaba, Midnight, Last Third, Suhoor)
 * Each atom persists the user's notification preference for that prayer.
 * Array positions align with EXTRAS_ENGLISH so index-based lookups keep working.
 */
export const extraPrayerAlertAtoms = EXTRAS_ENGLISH.map((prayerName) =>
  createPrayerAlertAtom(ScheduleType.Extra, prayerName)
);

// =============================================================================
// REMINDER ATOMS
// =============================================================================

/**
 * Factory function to create a reminder alert atom for persisting reminder notification preferences
 *
 * Keys are name-based (not index-based); see createPrayerAlertAtom.
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerName English prayer name
 * @returns Jotai atom with MMKV persistence for the reminder alert type
 */
export const createReminderAlertAtom = (scheduleType: ScheduleType, prayerName: string) => {
  const isStandard = scheduleType === ScheduleType.Standard;
  const type = isStandard ? 'standard' : 'extra';

  return atomWithStorageNumber(`preference_reminder_alert_${type}_${prayerName.toLowerCase()}`, AlertType.Off);
};

/**
 * Factory function to create a reminder interval atom for persisting reminder timing preferences
 *
 * Keys are name-based (not index-based); see createPrayerAlertAtom.
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerName English prayer name
 * @returns Jotai atom with MMKV persistence for the reminder interval
 */
export const createReminderIntervalAtom = (scheduleType: ScheduleType, prayerName: string) => {
  const isStandard = scheduleType === ScheduleType.Standard;
  const type = isStandard ? 'standard' : 'extra';

  return atomWithStorageNumber(
    `preference_reminder_interval_${type}_${prayerName.toLowerCase()}`,
    DEFAULT_REMINDER_INTERVAL
  );
};

/**
 * Array of reminder alert atoms for all standard prayers
 * Each atom persists the user's reminder notification preference for that prayer
 */
export const standardReminderAlertAtoms = PRAYERS_ENGLISH.map((prayerName) =>
  createReminderAlertAtom(ScheduleType.Standard, prayerName)
);

/**
 * Array of reminder alert atoms for all extra prayers
 * Each atom persists the user's reminder notification preference for that prayer
 */
export const extraReminderAlertAtoms = EXTRAS_ENGLISH.map((prayerName) =>
  createReminderAlertAtom(ScheduleType.Extra, prayerName)
);

/**
 * Array of reminder interval atoms for all standard prayers
 * Each atom persists the user's reminder interval preference for that prayer
 */
export const standardReminderIntervalAtoms = PRAYERS_ENGLISH.map((prayerName) =>
  createReminderIntervalAtom(ScheduleType.Standard, prayerName)
);

/**
 * Array of reminder interval atoms for all extra prayers
 * Each atom persists the user's reminder interval preference for that prayer
 */
export const extraReminderIntervalAtoms = EXTRAS_ENGLISH.map((prayerName) =>
  createReminderIntervalAtom(ScheduleType.Extra, prayerName)
);

/**
 * One-time migration: index-keyed alert preference keys -> name-keyed keys
 *
 * Alert/reminder preferences were stored as preference_alert_standard_<index> etc.
 * The index only maps to the intended prayer while data is canonical, so keys are now
 * preference_alert_standard_<name>. Copies any old index-key value to the name key
 * (first migration wins) and removes the old key. No-op after the first run; safe to
 * call on every launch. Must run before any atom reads preferences (called from
 * handleAppUpgrade).
 */
export const migrateIndexKeyedAlertPreferences = (): void => {
  let migrated = 0;

  const migrate = (oldKey: string, newKey: string) => {
    const oldValue = Database.database.getString(oldKey);
    if (oldValue === undefined) return;

    if (Database.database.getString(newKey) === undefined) {
      Database.database.set(newKey, oldValue);
      migrated += 1;
    }
    Database.database.remove(oldKey);
  };

  (['standard', 'extra'] as const).forEach((type) => {
    const prayerNames = type === 'standard' ? PRAYERS_ENGLISH : EXTRAS_ENGLISH;
    prayerNames.forEach((prayerName, index) => {
      const name = prayerName.toLowerCase();
      migrate(`preference_alert_${type}_${index}`, `preference_alert_${type}_${name}`);
      migrate(`preference_reminder_alert_${type}_${index}`, `preference_reminder_alert_${type}_${name}`);
      migrate(`preference_reminder_interval_${type}_${index}`, `preference_reminder_interval_${type}_${name}`);
    });
  });

  if (migrated > 0) {
    logger.info('NOTIFICATION: Migrated index-keyed alert preferences to name keys', { migrated });
  }
};

/**
 * Atom storing the user's preferred Athan sound index (0-15)
 * Persisted to MMKV storage
 */
export const soundPreferenceAtom = atomWithStorageNumber('preference_sound', 0);

/**
 * Atom storing timestamp of last notification schedule refresh
 * Used to determine if notifications need rescheduling (4-hour cycle)
 */
export const lastNotificationScheduleAtom = atomWithStorageNumber('preference_last_notification_schedule_check', 0);

// =============================================================================
// ALERT HELPERS
// =============================================================================

/**
 * Gets the current alert type for a specific prayer
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule (0-based)
 * @returns Current AlertType (Off, Silent, or Sound)
 */
export const getPrayerAlertType = (scheduleType: ScheduleType, prayerIndex: number): AlertType => {
  const atom = getPrayerAlertAtom(scheduleType, prayerIndex);
  return store.get(atom);
};

/**
 * Gets the user's preferred Athan sound index
 * @returns Sound index (0-15)
 */
export const getSoundPreference = () => store.get(soundPreferenceAtom);

/**
 * Sets the user's preferred Athan sound index
 * @param selection Sound index (0-15)
 */
export const setSoundPreference = (selection: number) => store.set(soundPreferenceAtom, selection);

/**
 * Gets the Jotai atom for a specific prayer's alert setting
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule (0-based)
 * @returns Jotai atom for the prayer's alert type
 */
export const getPrayerAlertAtom = (scheduleType: ScheduleType, prayerIndex: number) => {
  const isStandard = scheduleType === ScheduleType.Standard;
  const atoms = isStandard ? standardPrayerAlertAtoms : extraPrayerAlertAtoms;

  return atoms[prayerIndex];
};

/**
 * Sets the alert type for a specific prayer
 *
 * When setting at-time alert to Off, also disables the reminder alert
 * (reminder requires at-time to be enabled).
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule (0-based)
 * @param alertType New alert type (Off, Silent, or Sound)
 */
export const setPrayerAlertType = (scheduleType: ScheduleType, prayerIndex: number, alertType: AlertType) => {
  const atom = getPrayerAlertAtom(scheduleType, prayerIndex);
  store.set(atom, alertType);

  // Constraint: when at-time alert is Off, reminder must also be Off
  if (alertType === AlertType.Off) {
    const reminderAtom = getReminderAlertAtom(scheduleType, prayerIndex);
    store.set(reminderAtom, AlertType.Off);
  }
};

// =============================================================================
// REMINDER HELPERS
// =============================================================================

/**
 * Gets the Jotai atom for a specific prayer's reminder alert setting
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule (0-based)
 * @returns Jotai atom for the prayer's reminder alert type
 */
export const getReminderAlertAtom = (scheduleType: ScheduleType, prayerIndex: number) => {
  const isStandard = scheduleType === ScheduleType.Standard;
  const atoms = isStandard ? standardReminderAlertAtoms : extraReminderAlertAtoms;

  return atoms[prayerIndex];
};

/**
 * Gets the current reminder alert type for a specific prayer
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule (0-based)
 * @returns Current AlertType (Off, Silent, or Sound) for reminder
 */
export const getReminderAlertType = (scheduleType: ScheduleType, prayerIndex: number): AlertType => {
  const atom = getReminderAlertAtom(scheduleType, prayerIndex);
  return store.get(atom);
};

/**
 * Sets the reminder alert type for a specific prayer
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule (0-based)
 * @param alertType New alert type (Off, Silent, or Sound)
 */
export const setReminderAlertType = (scheduleType: ScheduleType, prayerIndex: number, alertType: AlertType) => {
  const atom = getReminderAlertAtom(scheduleType, prayerIndex);
  store.set(atom, alertType);
};

/**
 * Gets the Jotai atom for a specific prayer's reminder interval setting
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule (0-based)
 * @returns Jotai atom for the prayer's reminder interval
 */
export const getReminderIntervalAtom = (scheduleType: ScheduleType, prayerIndex: number) => {
  const isStandard = scheduleType === ScheduleType.Standard;
  const atoms = isStandard ? standardReminderIntervalAtoms : extraReminderIntervalAtoms;

  return atoms[prayerIndex];
};

/**
 * Gets the current reminder interval for a specific prayer
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule (0-based)
 * @returns Current reminder interval in minutes
 */
export const getReminderInterval = (scheduleType: ScheduleType, prayerIndex: number): ReminderInterval => {
  const atom = getReminderIntervalAtom(scheduleType, prayerIndex);
  return store.get(atom) as ReminderInterval;
};

/**
 * Sets the reminder interval for a specific prayer
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule (0-based)
 * @param interval Reminder interval in minutes
 */
export const setReminderInterval = (scheduleType: ScheduleType, prayerIndex: number, interval: ReminderInterval) => {
  const atom = getReminderIntervalAtom(scheduleType, prayerIndex);
  store.set(atom, interval);
};

/**
 * Schedules a single notification for a prayer on a specific date
 *
 * Handles validation, Istijaba filtering, and database storage.
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule
 * @param date Date string in YYYY-MM-DD format
 * @param englishName English prayer name
 * @param arabicName Arabic prayer name
 * @param alertType Alert type (Off, Silent, Sound)
 * @param sound Sound preference index
 * @returns Promise resolving to the attempted identifier — scheduled or, on
 *   failure, whatever OS notification the identifier already had — or null
 *   when the day was skipped (no data, past time, non-Friday Istijaba)
 */
async function scheduleNotificationForDate(
  scheduleType: ScheduleType,
  prayerIndex: number,
  date: string,
  englishName: string,
  arabicName: string,
  alertType: AlertType,
  sound: number
): Promise<string | null> {
  const dateObj = TimeUtils.createLondonDate(date);
  const prayerData = Database.getPrayerByDate(dateObj);
  if (!prayerData) return null;

  const prayerTime = prayerData[englishName.toLowerCase() as keyof typeof prayerData];

  // Skip past prayers
  if (!NotificationUtils.isPrayerTimeInFuture(date, prayerTime)) {
    logger.info('Skipping past prayer:', { date, time: prayerTime, englishName });
    return null;
  }

  // Skip Istijaba on non-Fridays
  if (englishName.toLowerCase() === 'istijaba' && !TimeUtils.isFriday(dateObj)) {
    logger.info('Skipping Istijaba on non-Friday:', { date, time: prayerTime });
    return null;
  }

  const identifier = Device.prayerNotificationIdentifier(scheduleType, englishName, date);

  try {
    const notification = await Device.addOneScheduledNotificationForPrayer(
      scheduleType,
      englishName,
      arabicName,
      date,
      prayerTime,
      alertType,
      sound
    );

    await Database.addOneScheduledNotificationForPrayer(scheduleType, prayerIndex, notification);
    return notification.id;
  } catch (error) {
    logger.error('Failed to schedule prayer notification:', error);

    // The identifier is deterministic, so whatever OS notification it already
    // had must survive this failure — record it so neither the per-prayer
    // stale-cancel nor the post-reschedule sweep removes it (issue #15).
    const survivedNotification = { id: identifier, date, time: prayerTime, englishName, arabicName, alertType };
    Database.addOneScheduledNotificationForPrayer(scheduleType, prayerIndex, survivedNotification);

    return identifier;
  }
}

/**
 * Schedule multiple notifications (X days) for a single prayer
 *
 * Schedule-first-then-cancel-stale (issue #15): deterministic identifiers give
 * same-ID scheduling atomic replace semantics, so new notifications are
 * scheduled BEFORE anything is cancelled — the OS never holds fewer
 * notifications than it did before, and process death mid-batch can no longer
 * zero the alarm set. Only identifiers no longer attempted (day rolled out of
 * the window, prayer skipped) are cancelled afterwards.
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule
 * @param englishName English prayer name
 * @param arabicName Arabic prayer name
 * @param alertType Alert type (Off, Silent, Sound)
 *
 * @see scheduleNotificationForDate - Helper for single-day scheduling
 */
const _addMultipleScheduleNotificationsForPrayer = async (
  scheduleType: ScheduleType,
  prayerIndex: number,
  englishName: string,
  arabicName: string,
  alertType: AlertType
) => {
  const existingRecords = Database.getAllScheduledNotificationsForPrayer(scheduleType, prayerIndex);
  Database.clearAllScheduledNotificationsForPrayer(scheduleType, prayerIndex);

  const nextXDays = NotificationUtils.genNextXDays(NOTIFICATION_ROLLING_DAYS);
  const sound = getSoundPreference();

  // Schedule notifications for each day in parallel. Each result is the
  // attempted identifier (null only when the day was skipped), so a failed
  // scheduling keeps the existing OS notification alive instead of staling it.
  const attempts = await Promise.all(
    nextXDays.map((date) =>
      scheduleNotificationForDate(scheduleType, prayerIndex, date, englishName, arabicName, alertType, sound)
    )
  );

  const attemptedIds = new Set(attempts.filter((id): id is string => id !== null));
  const staleIds = existingRecords.map((record) => record.id).filter((id) => !attemptedIds.has(id));

  await _cancelStaleNotificationIds(staleIds);

  logger.info('NOTIFICATION: Scheduled multiple notifications:', {
    scheduleType,
    prayerIndex,
    englishName,
    scheduledDays: attemptedIds.size,
    staleCancelled: staleIds.length,
  });
};

/**
 * Clears all scheduled notifications for a specific prayer
 *
 * Cancels notifications via Expo API and removes database records.
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule (0-based)
 */
const clearAllScheduledNotificationForPrayer = async (scheduleType: ScheduleType, prayerIndex: number) => {
  await Device.clearAllScheduledNotificationForPrayer(scheduleType, prayerIndex);
  Database.clearAllScheduledNotificationsForPrayer(scheduleType, prayerIndex);
};

// =============================================================================
// REMINDER SCHEDULING
// =============================================================================

/**
 * Schedules a single reminder notification for a prayer on a specific date
 *
 * Handles validation, Istijaba filtering, and database storage.
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule
 * @param date Date string in YYYY-MM-DD format
 * @param englishName English prayer name
 * @param arabicName Arabic prayer name
 * @param alertType Alert type (Off, Silent, Sound)
 * @param intervalMinutes Reminder interval in minutes
 * @returns Promise resolving to the attempted identifier — scheduled or, on
 *   failure, whatever OS reminder the identifier already had — or null when
 *   the day was skipped (past/imminent, non-Friday Istijaba)
 */
async function scheduleReminderNotificationForDate(
  scheduleType: ScheduleType,
  prayerIndex: number,
  date: string,
  englishName: string,
  arabicName: string,
  alertType: AlertType,
  intervalMinutes: ReminderInterval
): Promise<string | null> {
  const dateObj = TimeUtils.createLondonDate(date);
  const prayerData = Database.getPrayerByDate(dateObj);
  if (!prayerData) return null;

  const prayerTime = prayerData[englishName.toLowerCase() as keyof typeof prayerData];

  // Calculate reminder trigger time
  const prayerDateTime = NotificationUtils.genTriggerDate(date, prayerTime);
  const reminderDateTime = subMinutes(prayerDateTime, intervalMinutes);
  const now = TimeUtils.createLondonDate();

  // Skip if reminder time is already past or within buffer
  const secondsUntilReminder = (reminderDateTime.getTime() - now.getTime()) / 1000;
  if (secondsUntilReminder < REMINDER_BUFFER_SECONDS) {
    logger.info('REMINDER: Skipping past or imminent reminder:', {
      date,
      prayerTime,
      englishName,
      intervalMinutes,
      secondsUntilReminder,
    });
    return null;
  }

  // Skip Istijaba on non-Fridays
  if (englishName.toLowerCase() === 'istijaba' && !TimeUtils.isFriday(dateObj)) {
    logger.info('REMINDER: Skipping Istijaba on non-Friday:', { date, prayerTime });
    return null;
  }

  const identifier = Device.reminderNotificationIdentifier(scheduleType, englishName, date, intervalMinutes);

  try {
    const notification = await Device.addOneScheduledReminderForPrayer(
      scheduleType,
      englishName,
      arabicName,
      date,
      prayerTime,
      intervalMinutes,
      alertType
    );

    await Database.addOneScheduledReminderForPrayer(scheduleType, prayerIndex, notification);
    return notification.id;
  } catch (error) {
    logger.error('Failed to schedule reminder:', error);

    // Keep whatever OS reminder this deterministic identifier already had
    // alive — record it so the stale-cancel and sweep skip it (issue #15).
    const survivedReminder = { id: identifier, date, time: prayerTime, englishName, arabicName, alertType };
    Database.addOneScheduledReminderForPrayer(scheduleType, prayerIndex, survivedReminder);

    return identifier;
  }
}

/**
 * Schedule multiple reminders (X days) for a single prayer
 *
 * Schedule-first-then-cancel-stale (issue #15), mirroring the at-time
 * notification path: reminders are scheduled before anything is cancelled.
 * Reminder identifiers include the interval, so an interval change schedules
 * the new-interval reminders first and cancels the old-interval identifiers
 * only afterwards — the user briefly has two, never zero.
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule
 * @param englishName English prayer name
 * @param arabicName Arabic prayer name
 * @param alertType Alert type (Off, Silent, Sound)
 */
const _addMultipleScheduleRemindersForPrayer = async (
  scheduleType: ScheduleType,
  prayerIndex: number,
  englishName: string,
  arabicName: string,
  alertType: AlertType
) => {
  const existingRecords = Database.getAllScheduledRemindersForPrayer(scheduleType, prayerIndex);
  Database.clearAllScheduledRemindersForPrayer(scheduleType, prayerIndex);

  const nextXDays = NotificationUtils.genNextXDays(NOTIFICATION_ROLLING_DAYS);
  const intervalMinutes = getReminderInterval(scheduleType, prayerIndex);

  // Schedule reminders for each day in parallel. Each result is the attempted
  // identifier (null only when skipped) — a failed scheduling keeps the
  // existing OS reminder alive instead of staling it (see above).
  const attempts = await Promise.all(
    nextXDays.map((date) =>
      scheduleReminderNotificationForDate(
        scheduleType,
        prayerIndex,
        date,
        englishName,
        arabicName,
        alertType,
        intervalMinutes
      )
    )
  );

  const attemptedIds = new Set(attempts.filter((id): id is string => id !== null));
  const staleIds = existingRecords.map((record) => record.id).filter((id) => !attemptedIds.has(id));

  await _cancelStaleNotificationIds(staleIds);

  logger.info('REMINDER: Scheduled multiple reminders:', {
    scheduleType,
    prayerIndex,
    englishName,
    scheduledDays: attemptedIds.size,
    staleCancelled: staleIds.length,
  });
};

/**
 * Clears all scheduled reminders for a specific prayer
 *
 * Cancels reminders via Expo API and removes database records.
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule (0-based)
 */
const clearAllScheduledRemindersForPrayer = async (scheduleType: ScheduleType, prayerIndex: number) => {
  await Device.clearAllScheduledRemindersForPrayer(scheduleType, prayerIndex);
  Database.clearAllScheduledRemindersForPrayer(scheduleType, prayerIndex);
};

/**
 * Atomically updates all notifications and reminders for a single prayer
 *
 * Wraps clear+schedule in a single lock acquisition to prevent race conditions.
 * At-time and reminder operations run in parallel (independent MMKV keys and OS notification IDs).
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule (0-based)
 * @param englishName English prayer name
 * @param arabicName Arabic prayer name
 * @param atTimeAlert At-time alert type (Off, Silent, Sound)
 * @param reminderAlert Reminder alert type (Off, Silent, Sound)
 */
export const updatePrayerNotifications = async (
  scheduleType: ScheduleType,
  prayerIndex: number,
  englishName: string,
  arabicName: string,
  atTimeAlert: AlertType,
  reminderAlert: AlertType
) => {
  return withSchedulingLock(async () => {
    const promises: Promise<void>[] = [];

    if (atTimeAlert !== AlertType.Off) {
      promises.push(
        _addMultipleScheduleNotificationsForPrayer(scheduleType, prayerIndex, englishName, arabicName, atTimeAlert)
      );
    } else {
      promises.push(clearAllScheduledNotificationForPrayer(scheduleType, prayerIndex));
    }

    if (atTimeAlert !== AlertType.Off && reminderAlert !== AlertType.Off) {
      promises.push(
        _addMultipleScheduleRemindersForPrayer(scheduleType, prayerIndex, englishName, arabicName, reminderAlert)
      );
    } else {
      promises.push(clearAllScheduledRemindersForPrayer(scheduleType, prayerIndex));
    }

    await Promise.all(promises);
  }, 'updatePrayerNotifications');
};

/**
 * Schedule all notifications for a schedule based on current preferences (internal)
 *
 * Prayers whose alert is Off are actively cleared (records + OS notifications)
 * instead of skipped — a global reschedule must leave the database describing
 * exactly the intended set, healing any settings commit that was interrupted
 * by process death (issue #15).
 */
const _addAllScheduleNotificationsForSchedule = async (scheduleType: ScheduleType) => {
  logger.info('NOTIFICATION: Scheduling all notifications for schedule:', { scheduleType });

  const { english: prayers, arabic: arabicPrayers } = getPrayerArrays(scheduleType);

  const promises = prayers.map(async (_, index) => {
    const alertType = getPrayerAlertType(scheduleType, index);
    if (alertType === AlertType.Off) {
      return clearAllScheduledNotificationForPrayer(scheduleType, index);
    }

    return _addMultipleScheduleNotificationsForPrayer(
      scheduleType,
      index,
      prayers[index],
      arabicPrayers[index],
      alertType
    );
  });

  await Promise.all(promises);
  logger.info('NOTIFICATION: Rescheduled all notifications for schedule:', { scheduleType });
};

/**
 * Schedule all reminders for a schedule based on current preferences (internal)
 *
 * Reminders are only kept while BOTH the reminder alert and the at-time alert
 * are enabled; everything else is actively cleared so the post-reschedule
 * sweep sees records that describe exactly the intended set (see above).
 */
const _addAllScheduleRemindersForSchedule = async (scheduleType: ScheduleType) => {
  logger.info('REMINDER: Scheduling all reminders for schedule:', { scheduleType });

  const { english: prayers, arabic: arabicPrayers } = getPrayerArrays(scheduleType);

  const promises = prayers.map(async (_, index) => {
    const reminderAlertType = getReminderAlertType(scheduleType, index);

    // Constraint: reminder requires at-time alert to be enabled
    const atTimeAlertType = getPrayerAlertType(scheduleType, index);
    const reminderEnabled = reminderAlertType !== AlertType.Off && atTimeAlertType !== AlertType.Off;

    if (!reminderEnabled) {
      return clearAllScheduledRemindersForPrayer(scheduleType, index);
    }

    return _addMultipleScheduleRemindersForPrayer(
      scheduleType,
      index,
      prayers[index],
      arabicPrayers[index],
      reminderAlertType
    );
  });

  await Promise.all(promises);
  logger.info('REMINDER: Rescheduled all reminders for schedule:', { scheduleType });
};

/**
 * Check if notifications need rescheduling (more than X hours since last schedule)
 */
export const shouldRescheduleNotifications = (): boolean => {
  const lastSchedule = store.get(lastNotificationScheduleAtom);
  const now = Date.now();

  if (!lastSchedule) {
    logger.info('NOTIFICATION: Never scheduled before, needs refresh');
    return true;
  }

  const hoursElapsed = differenceInHours(now, lastSchedule);
  const minutesElapsed = differenceInMinutes(now, lastSchedule) % 60;
  const secondsElapsed = differenceInSeconds(now, lastSchedule) % 60;
  const nextScheduleTime = addHours(new Date(lastSchedule), NOTIFICATION_REFRESH_HOURS);

  // Calculate time remaining
  const hoursLeft = NOTIFICATION_REFRESH_HOURS - hoursElapsed - 1;
  const minutesLeft = 60 - minutesElapsed - 1;
  const secondsLeft = 60 - secondsElapsed;

  logger.info('NOTIFICATION: Checking reschedule needed:', {
    lastSchedule: formatISO(lastSchedule),
    nextSchedule: formatISO(nextScheduleTime),
    elapsed: `${hoursElapsed}h ${minutesElapsed}m ${secondsElapsed}s`,
    timeUntilNextRefresh: `${hoursLeft}h ${minutesLeft}m ${secondsLeft}s`,
    needsRefresh: hoursElapsed >= NOTIFICATION_REFRESH_HOURS,
  });

  return hoursElapsed >= NOTIFICATION_REFRESH_HOURS;
};

/**
 * Post-reschedule reconciliation (issue #15)
 *
 * Compares the OS's pending notifications against the database records — the
 * intended set — and cancels anything the OS holds beyond them: turned-off
 * prayers, superseded reminder intervals, orphans from before deterministic
 * identifiers, and strays left by earlier versions whose bookkeeping was
 * wiped on upgrade. Live notifications are never touched. Also logs a
 * verification count so degraded states surface in the logs.
 */
const _sweepStaleScheduledNotifications = async () => {
  const records = [
    ...Database.getAllScheduledNotificationsForSchedule(ScheduleType.Standard),
    ...Database.getAllScheduledNotificationsForSchedule(ScheduleType.Extra),
    ...Database.getAllScheduledRemindersForSchedule(ScheduleType.Standard),
    ...Database.getAllScheduledRemindersForSchedule(ScheduleType.Extra),
  ];

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const osIdentifiers = scheduled.map((request) => request.identifier);
  const staleIds = NotificationUtils.findStaleScheduledNotificationIds(osIdentifiers, records);

  if (staleIds.length > 0) {
    logger.warn('NOTIFICATION: Sweep found stale OS notifications:', { count: staleIds.length, staleIds });

    await _cancelStaleNotificationIds(staleIds);
  }

  logger.info('NOTIFICATION: Post-reschedule verification:', {
    dbRecords: records.length,
    osPending: osIdentifiers.length,
    staleCancelled: staleIds.length,
  });
};

/**
 * Reschedules all notifications for both Standard and Extra schedules (internal)
 *
 * Schedule-first strategy (issue #15): nothing is bulk-cancelled. Same-identifier
 * scheduling atomically replaces every notification, the per-prayer paths cancel
 * only their own stale identifiers afterwards, and the final sweep removes
 * anything the OS holds beyond the intended set. Process death mid-batch can no
 * longer leave the app with zero scheduled notifications — unrefreshed prayers
 * keep their previous alarms until the next successful refresh.
 */
const _rescheduleAllNotifications = async () => {
  // Log current preference state for debugging preference-reset reports
  const preferenceSnapshot = PRAYERS_ENGLISH.map((prayer, i) => ({
    prayer,
    alert: getPrayerAlertType(ScheduleType.Standard, i),
    reminder: getReminderAlertType(ScheduleType.Standard, i),
  }));
  logger.info('NOTIFICATION: Preference snapshot before reschedule:', preferenceSnapshot);

  // Schedule all enabled notifications and reminders for both schedules
  await Promise.all([
    _addAllScheduleNotificationsForSchedule(ScheduleType.Standard),
    _addAllScheduleNotificationsForSchedule(ScheduleType.Extra),
    _addAllScheduleRemindersForSchedule(ScheduleType.Standard),
    _addAllScheduleRemindersForSchedule(ScheduleType.Extra),
  ]);

  // Heal the OS to match the database: cancel strays, verify counts
  await _sweepStaleScheduledNotifications();

  // Push fresh data to the iOS widgets — this runs wherever notifications do
  // (foreground refresh gate + background task), keeping widgets in sync with
  // the app even when the app is never opened
  await PrayerWidgets.refreshPrayerWidgets();

  logger.info('NOTIFICATION: Rescheduled all notifications and reminders');
};

/**
 * Reschedules all notifications for both Standard and Extra schedules
 *
 * Used when changing sound preferences or when a full refresh is needed.
 * Replaces every scheduled notification in place (same-identifier replace),
 * cancels stale identifiers, and sweeps anything the OS holds beyond the
 * intended set — no bulk cancel, no zero-notification window (issue #15).
 * Guards against concurrent scheduling using withSchedulingLock.
 *
 * @returns Promise that resolves when rescheduling is complete
 * @throws Error if scheduling fails
 *
 * @example
 * // After changing sound preference
 * await rescheduleAllNotifications();
 */
export const rescheduleAllNotifications = async () => {
  return withSchedulingLock(async () => {
    try {
      await _rescheduleAllNotifications();
    } catch (error) {
      logger.error('NOTIFICATION: Failed to reschedule notifications:', error);
      throw error;
    }
  }, 'rescheduleAllNotifications');
};

/**
 * Refreshes notifications if enough time has elapsed since last refresh
 *
 * Checks if NOTIFICATION_REFRESH_HOURS have passed since the last schedule.
 * If so, reschedules all notifications and updates the last schedule timestamp.
 * This maintains the 2-day rolling notification buffer.
 *
 * Called on app foreground via useNotification hook.
 *
 * @returns Promise that resolves when refresh is complete (or skipped)
 *
 * @example
 * // In useNotification hook
 * useEffect(() => {
 *   refreshNotifications();
 * }, [appState]);
 */
export const refreshNotifications = async () => {
  if (!shouldRescheduleNotifications()) {
    logger.info(`NOTIFICATION: Skipping reschedule, last schedule was within ${NOTIFICATION_REFRESH_HOURS} hours`);
    return;
  }

  logger.info('NOTIFICATION: Starting notification refresh');

  return withSchedulingLock(async () => {
    try {
      await _rescheduleAllNotifications();
      store.set(lastNotificationScheduleAtom, Date.now());
      logger.info('NOTIFICATION: Refresh complete');
    } catch (error) {
      logger.error('NOTIFICATION: Failed to refresh notifications:', error);
      throw error;
    }
  }, 'refreshNotifications');
};

// =============================================================================
// BACKGROUND TASK
// =============================================================================

/**
 * Reschedule notifications from background task
 *
 * Unlike foreground refresh, this does NOT check shouldRescheduleNotifications()
 * because the OS controls background task timing (~3 hours minimum).
 * We always reschedule when the background task runs for consistency.
 *
 * Exported for use by the background task defined in device/tasks.ts
 *
 * @throws Error if rescheduling fails
 */
export const rescheduleAllNotificationsFromBackground = async () => {
  logger.info('BACKGROUND_TASK: Starting background reschedule');

  // Refresh prayer data first so a year boundary can never leave the rolling
  // window dry — needsDataUpdate makes this a no-op when the cache is fresh.
  // Best-effort by design: a sync failure (e.g. API unreachable) must not
  // skip the reschedule itself, which still rolls the window from cache.
  try {
    await sync();
  } catch (error) {
    logger.error('BACKGROUND_TASK: Data refresh failed, rescheduling from cache', { error });
  }

  return withSchedulingLock(async () => {
    try {
      await _rescheduleAllNotifications();
      store.set(lastNotificationScheduleAtom, Date.now());
      logger.info('BACKGROUND_TASK: Background reschedule complete');
    } catch (error) {
      logger.error('BACKGROUND_TASK: Failed to reschedule from background:', error);
      throw error;
    }
  }, 'backgroundReschedule');
};

/**
 * Registers the background task for notification refresh
 *
 * Should be called during app initialization after notification permissions are granted.
 * The task will run approximately every 3 hours (system-controlled).
 *
 * Platform notes:
 * - iOS: Requires physical device (doesn't work on simulators)
 * - Android: Uses WorkManager, 15-minute minimum interval enforced
 * - Both: System controls actual timing, may be delayed based on battery/network/usage
 *
 * @returns Promise that resolves when registration is complete
 */
export const registerBackgroundTask = async () => {
  try {
    // Check if background tasks are available on this device
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) {
      logger.warn(
        'BACKGROUND_TASK: Background tasks restricted by system (Low Power Mode or Background App Refresh disabled)',
        {
          taskName: BACKGROUND_TASK_NAME,
        }
      );
      return;
    }

    // Always unregister first so registration carries CURRENT options —
    // expo-task-manager persists options and the native restore path
    // resubmits the BGTask request with the PERSISTED minimumInterval
    // (ISSUES.md #8: stale 10800 kept re-arming the task +7.5 days)
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
    if (isRegistered) {
      await BackgroundTask.unregisterTaskAsync(BACKGROUND_TASK_NAME);
      logger.info('BACKGROUND_TASK: Unregistered for options refresh', { taskName: BACKGROUND_TASK_NAME });
    }

    await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_NAME, {
      minimumInterval: BACKGROUND_TASK_INTERVAL_MINUTES,
    });

    logger.info('BACKGROUND_TASK: Task registered successfully', {
      taskName: BACKGROUND_TASK_NAME,
      minimumIntervalMinutes: BACKGROUND_TASK_INTERVAL_MINUTES,
    });
  } catch (error) {
    // Log but don't throw - background task is a fallback, not critical
    logger.error('BACKGROUND_TASK: Failed to register task', {
      taskName: BACKGROUND_TASK_NAME,
      error,
    });
  }
};

/**
 * Unregisters the background task
 *
 * Call this if you need to disable background refresh (e.g., for testing or rollback).
 *
 * @returns Promise that resolves when unregistration is complete
 */
export const unregisterBackgroundTask = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);

    if (!isRegistered) {
      logger.info('BACKGROUND_TASK: Task not registered, nothing to unregister', { taskName: BACKGROUND_TASK_NAME });
      return;
    }

    await BackgroundTask.unregisterTaskAsync(BACKGROUND_TASK_NAME);

    logger.info('BACKGROUND_TASK: Task unregistered successfully', { taskName: BACKGROUND_TASK_NAME });
  } catch (error) {
    logger.error('BACKGROUND_TASK: Failed to unregister task', {
      taskName: BACKGROUND_TASK_NAME,
      error,
    });
  }
};

/**
 * Gets the current status of the background task
 *
 * Useful for debugging and monitoring background task state.
 *
 * @returns Promise with task registration status and system availability
 */
export const getBackgroundTaskStatus = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
    const status = await BackgroundTask.getStatusAsync();

    const statusLabel = status === BackgroundTask.BackgroundTaskStatus.Available ? 'Available' : 'Restricted';

    logger.info('BACKGROUND_TASK: Status check', {
      taskName: BACKGROUND_TASK_NAME,
      isRegistered,
      systemStatus: statusLabel,
    });

    return {
      isRegistered,
      systemStatus: status,
      systemStatusLabel: statusLabel,
    };
  } catch (error) {
    logger.error('BACKGROUND_TASK: Failed to get status', {
      taskName: BACKGROUND_TASK_NAME,
      error,
    });
    return {
      isRegistered: false,
      systemStatus: BackgroundTask.BackgroundTaskStatus.Restricted,
      systemStatusLabel: 'Error',
    };
  }
};
