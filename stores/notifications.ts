import { differenceInHours, differenceInMinutes, differenceInSeconds, addHours, formatISO, subMinutes } from 'date-fns';
import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { getDefaultStore } from 'jotai';

import * as Device from '@/device/notifications';
import {
  PRAYERS_ENGLISH,
  EXTRAS_ENGLISH,
  EXTRAS_ARABIC,
  PRAYERS_ARABIC,
  NOTIFICATION_ROLLING_DAYS,
  NOTIFICATION_REFRESH_HOURS,
  DEFAULT_REMINDER_INTERVAL,
  REMINDER_BUFFER_SECONDS,
  BACKGROUND_TASK_NAME,
  BACKGROUND_TASK_INTERVAL_HOURS,
} from '@/shared/constants';
import logger from '@/shared/logger';
import * as NotificationUtils from '@/shared/notifications';
import * as TimeUtils from '@/shared/time';
import { AlertType, ReminderInterval, ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';
import { atomWithStorageNumber } from '@/stores/storage';

const store = getDefaultStore();

// Guard against concurrent notification scheduling
let isScheduling = false;

/**
 * Helper function to wrap async operations with scheduling lock
 * Prevents concurrent notification scheduling operations
 * @param operation The async operation to execute
 * @param operationName Name of the operation for logging
 * @returns Result of the operation or void if already scheduling
 */
async function withSchedulingLock<T>(operation: () => Promise<T>, operationName: string): Promise<T | void> {
  if (isScheduling) {
    logger.info(`NOTIFICATION: Already scheduling, skipping ${operationName}`);
    return;
  }

  isScheduling = true;

  try {
    return await operation();
  } finally {
    isScheduling = false;
  }
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

// =============================================================================
// ATOMS
// =============================================================================

/**
 * Factory function to create a prayer alert atom for persisting notification preferences
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule (0-based)
 * @returns Jotai atom with MMKV persistence for the alert type
 *
 * @example
 * const fajrAlertAtom = createPrayerAlertAtom(ScheduleType.Standard, 0);
 */
export const createPrayerAlertAtom = (scheduleType: ScheduleType, prayerIndex: number) => {
  const isStandard = scheduleType === ScheduleType.Standard;
  const type = isStandard ? 'standard' : 'extra';

  return atomWithStorageNumber(`preference_alert_${type}_${prayerIndex}`, AlertType.Off);
};

/**
 * Array of alert atoms for all standard prayers (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha)
 * Each atom persists the user's notification preference for that prayer
 */
export const standardPrayerAlertAtoms = PRAYERS_ENGLISH.map((_, index) =>
  createPrayerAlertAtom(ScheduleType.Standard, index)
);

/**
 * Array of alert atoms for all extra prayers (Duha, Istijaba, Midnight, Last Third, Suhoor)
 * Each atom persists the user's notification preference for that prayer
 */
export const extraPrayerAlertAtoms = EXTRAS_ENGLISH.map((_, index) => createPrayerAlertAtom(ScheduleType.Extra, index));

// =============================================================================
// REMINDER ATOMS
// =============================================================================

/**
 * Factory function to create a reminder alert atom for persisting reminder notification preferences
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule (0-based)
 * @returns Jotai atom with MMKV persistence for the reminder alert type
 */
export const createReminderAlertAtom = (scheduleType: ScheduleType, prayerIndex: number) => {
  const isStandard = scheduleType === ScheduleType.Standard;
  const type = isStandard ? 'standard' : 'extra';

  return atomWithStorageNumber(`preference_reminder_alert_${type}_${prayerIndex}`, AlertType.Off);
};

/**
 * Factory function to create a reminder interval atom for persisting reminder timing preferences
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule (0-based)
 * @returns Jotai atom with MMKV persistence for the reminder interval
 */
export const createReminderIntervalAtom = (scheduleType: ScheduleType, prayerIndex: number) => {
  const isStandard = scheduleType === ScheduleType.Standard;
  const type = isStandard ? 'standard' : 'extra';

  return atomWithStorageNumber(`preference_reminder_interval_${type}_${prayerIndex}`, DEFAULT_REMINDER_INTERVAL);
};

/**
 * Array of reminder alert atoms for all standard prayers
 * Each atom persists the user's reminder notification preference for that prayer
 */
export const standardReminderAlertAtoms = PRAYERS_ENGLISH.map((_, index) =>
  createReminderAlertAtom(ScheduleType.Standard, index)
);

/**
 * Array of reminder alert atoms for all extra prayers
 * Each atom persists the user's reminder notification preference for that prayer
 */
export const extraReminderAlertAtoms = EXTRAS_ENGLISH.map((_, index) =>
  createReminderAlertAtom(ScheduleType.Extra, index)
);

/**
 * Array of reminder interval atoms for all standard prayers
 * Each atom persists the user's reminder interval preference for that prayer
 */
export const standardReminderIntervalAtoms = PRAYERS_ENGLISH.map((_, index) =>
  createReminderIntervalAtom(ScheduleType.Standard, index)
);

/**
 * Array of reminder interval atoms for all extra prayers
 * Each atom persists the user's reminder interval preference for that prayer
 */
export const extraReminderIntervalAtoms = EXTRAS_ENGLISH.map((_, index) =>
  createReminderIntervalAtom(ScheduleType.Extra, index)
);

/**
 * Atom storing the user's preferred Athan sound index (0-15)
 * Persisted to MMKV storage
 */
export const soundPreferenceAtom = atomWithStorageNumber('preference_sound', 0);

/**
 * Atom storing timestamp of last notification schedule refresh
 * Used to determine if notifications need rescheduling (12-hour cycle)
 */
export const lastNotificationScheduleAtom = atomWithStorageNumber('last_notification_schedule_check', 0);

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
 * Returns a promise that resolves when notification is scheduled
 * or undefined if the notification was skipped.
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule
 * @param date Date string in YYYY-MM-DD format
 * @param englishName English prayer name
 * @param arabicName Arabic prayer name
 * @param alertType Alert type (Off, Silent, Sound)
 * @param sound Sound preference index
 * @returns Promise resolving when complete, or undefined if skipped
 */
async function scheduleNotificationForDate(
  scheduleType: ScheduleType,
  prayerIndex: number,
  date: string,
  englishName: string,
  arabicName: string,
  alertType: AlertType,
  sound: number
): Promise<void> {
  const dateObj = TimeUtils.createLondonDate(date);
  const prayerData = Database.getPrayerByDate(dateObj);
  if (!prayerData) return;

  const prayerTime = prayerData[englishName.toLowerCase() as keyof typeof prayerData];

  // Skip past prayers
  if (!NotificationUtils.isPrayerTimeInFuture(date, prayerTime)) {
    logger.info('Skipping past prayer:', { date, time: prayerTime, englishName });
    return;
  }

  // Skip Istijaba on non-Fridays
  if (englishName.toLowerCase() === 'istijaba' && !TimeUtils.isFriday(dateObj)) {
    logger.info('Skipping Istijaba on non-Friday:', { date, time: prayerTime });
    return;
  }

  const notification = await Device.addOneScheduledNotificationForPrayer(
    englishName,
    arabicName,
    date,
    prayerTime,
    alertType,
    sound
  );

  await Database.addOneScheduledNotificationForPrayer(scheduleType, prayerIndex, notification);
}

/**
 * Schedule multiple notifications (X days) for a single prayer
 *
 * Clears existing notifications, then schedules new ones for the next X days
 * based on the NOTIFICATION_ROLLING_DAYS constant.
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
  // Cancel all existing notifications for this prayer
  await clearAllScheduledNotificationForPrayer(scheduleType, prayerIndex);

  const nextXDays = NotificationUtils.genNextXDays(NOTIFICATION_ROLLING_DAYS);
  const sound = getSoundPreference();

  // Schedule notifications for each day in parallel
  await Promise.all(
    nextXDays.map((date) =>
      scheduleNotificationForDate(scheduleType, prayerIndex, date, englishName, arabicName, alertType, sound).catch(
        (error) => logger.error('Failed to schedule prayer notification:', error)
      )
    )
  );

  logger.info('NOTIFICATION: Scheduled multiple notifications:', { scheduleType, prayerIndex, englishName });
};

/**
 * Schedule multiple notifications for a single prayer (public entry point)
 *
 * Guards against concurrent scheduling using withSchedulingLock.
 * Schedules notifications for the next NOTIFICATION_ROLLING_DAYS days.
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule (0-based)
 * @param englishName English prayer name (e.g., "Fajr", "Midnight")
 * @param arabicName Arabic prayer name (e.g., "الفجر", "نصف الليل")
 * @param alertType Alert type (Off, Silent, Sound)
 * @returns Promise that resolves when scheduling is complete
 *
 * @example
 * await addMultipleScheduleNotificationsForPrayer(
 *   ScheduleType.Standard,
 *   0, // Fajr
 *   "Fajr",
 *   "الفجر",
 *   AlertType.Sound
 * );
 */
export const addMultipleScheduleNotificationsForPrayer = async (
  scheduleType: ScheduleType,
  prayerIndex: number,
  englishName: string,
  arabicName: string,
  alertType: AlertType
) => {
  return withSchedulingLock(
    () => _addMultipleScheduleNotificationsForPrayer(scheduleType, prayerIndex, englishName, arabicName, alertType),
    'addMultipleScheduleNotificationsForPrayer'
  );
};

/**
 * Clears all scheduled notifications for a specific prayer
 *
 * Cancels notifications via Expo API and removes database records.
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule (0-based)
 */
export const clearAllScheduledNotificationForPrayer = async (scheduleType: ScheduleType, prayerIndex: number) => {
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
 * Returns a promise that resolves when reminder is scheduled
 * or undefined if the reminder was skipped.
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule
 * @param date Date string in YYYY-MM-DD format
 * @param englishName English prayer name
 * @param arabicName Arabic prayer name
 * @param alertType Alert type (Off, Silent, Sound)
 * @param intervalMinutes Reminder interval in minutes
 * @returns Promise resolving when complete, or undefined if skipped
 */
async function scheduleReminderNotificationForDate(
  scheduleType: ScheduleType,
  prayerIndex: number,
  date: string,
  englishName: string,
  arabicName: string,
  alertType: AlertType,
  intervalMinutes: ReminderInterval
): Promise<void> {
  const dateObj = TimeUtils.createLondonDate(date);
  const prayerData = Database.getPrayerByDate(dateObj);
  if (!prayerData) return;

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
    return;
  }

  // Skip Istijaba on non-Fridays
  if (englishName.toLowerCase() === 'istijaba' && !TimeUtils.isFriday(dateObj)) {
    logger.info('REMINDER: Skipping Istijaba on non-Friday:', { date, prayerTime });
    return;
  }

  const notification = await Device.addOneScheduledReminderForPrayer(
    englishName,
    arabicName,
    date,
    prayerTime,
    intervalMinutes,
    alertType
  );

  await Database.addOneScheduledReminderForPrayer(scheduleType, prayerIndex, notification);
}

/**
 * Schedule multiple reminders (X days) for a single prayer
 *
 * Clears existing reminders, then schedules new ones for the next X days
 * based on the NOTIFICATION_ROLLING_DAYS constant.
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
  // Cancel all existing reminders for this prayer
  await clearAllScheduledRemindersForPrayer(scheduleType, prayerIndex);

  const nextXDays = NotificationUtils.genNextXDays(NOTIFICATION_ROLLING_DAYS);
  const intervalMinutes = getReminderInterval(scheduleType, prayerIndex);

  // Schedule reminders for each day in parallel
  await Promise.all(
    nextXDays.map((date) =>
      scheduleReminderNotificationForDate(
        scheduleType,
        prayerIndex,
        date,
        englishName,
        arabicName,
        alertType,
        intervalMinutes
      ).catch((error) => logger.error('Failed to schedule reminder:', error))
    )
  );

  logger.info('REMINDER: Scheduled multiple reminders:', { scheduleType, prayerIndex, englishName });
};

/**
 * Schedule multiple reminders for a single prayer (public entry point)
 *
 * Guards against concurrent scheduling using withSchedulingLock.
 * Schedules reminders for the next NOTIFICATION_ROLLING_DAYS days.
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule (0-based)
 * @param englishName English prayer name
 * @param arabicName Arabic prayer name
 * @param alertType Alert type (Off, Silent, Sound)
 * @returns Promise that resolves when scheduling is complete
 */
export const addMultipleScheduleRemindersForPrayer = async (
  scheduleType: ScheduleType,
  prayerIndex: number,
  englishName: string,
  arabicName: string,
  alertType: AlertType
) => {
  return withSchedulingLock(
    () => _addMultipleScheduleRemindersForPrayer(scheduleType, prayerIndex, englishName, arabicName, alertType),
    'addMultipleScheduleRemindersForPrayer'
  );
};

/**
 * Clears all scheduled reminders for a specific prayer
 *
 * Cancels reminders via Expo API and removes database records.
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param prayerIndex Index of the prayer in its schedule (0-based)
 */
export const clearAllScheduledRemindersForPrayer = async (scheduleType: ScheduleType, prayerIndex: number) => {
  await Device.clearAllScheduledRemindersForPrayer(scheduleType, prayerIndex);
  Database.clearAllScheduledRemindersForPrayer(scheduleType, prayerIndex);
};

/**
 * Schedule all notifications for a schedule based on current preferences (internal)
 */
const _addAllScheduleNotificationsForSchedule = async (scheduleType: ScheduleType) => {
  logger.info('NOTIFICATION: Scheduling all notifications for schedule:', { scheduleType });

  const { english: prayers, arabic: arabicPrayers } = getPrayerArrays(scheduleType);

  const promises = prayers.map(async (_, index) => {
    const alertType = getPrayerAlertType(scheduleType, index);
    if (alertType === AlertType.Off) return;

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
 */
const _addAllScheduleRemindersForSchedule = async (scheduleType: ScheduleType) => {
  logger.info('REMINDER: Scheduling all reminders for schedule:', { scheduleType });

  const { english: prayers, arabic: arabicPrayers } = getPrayerArrays(scheduleType);

  const promises = prayers.map(async (_, index) => {
    const reminderAlertType = getReminderAlertType(scheduleType, index);
    if (reminderAlertType === AlertType.Off) return;

    // Constraint: reminder requires at-time alert to be enabled
    const atTimeAlertType = getPrayerAlertType(scheduleType, index);
    if (atTimeAlertType === AlertType.Off) return;

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
 * Reschedules all notifications for both Standard and Extra schedules (internal)
 */
const _rescheduleAllNotifications = async () => {
  // Cancel ALL scheduled notifications globally (includes reminders)
  await Notifications.cancelAllScheduledNotificationsAsync();
  logger.info('NOTIFICATION: Cancelled all scheduled notifications via Expo API');

  // Clear database records for both schedules (notifications and reminders)
  Database.clearAllScheduledNotificationsForSchedule(ScheduleType.Standard);
  Database.clearAllScheduledNotificationsForSchedule(ScheduleType.Extra);
  Database.clearAllScheduledRemindersForSchedule(ScheduleType.Standard);
  Database.clearAllScheduledRemindersForSchedule(ScheduleType.Extra);
  logger.info('NOTIFICATION: Cleared database records');

  // Schedule all enabled notifications and reminders for both schedules
  await Promise.all([
    _addAllScheduleNotificationsForSchedule(ScheduleType.Standard),
    _addAllScheduleNotificationsForSchedule(ScheduleType.Extra),
    _addAllScheduleRemindersForSchedule(ScheduleType.Standard),
    _addAllScheduleRemindersForSchedule(ScheduleType.Extra),
  ]);

  logger.info('NOTIFICATION: Rescheduled all notifications and reminders');
};

/**
 * Reschedules all notifications for both Standard and Extra schedules
 *
 * Used when changing sound preferences or when a full refresh is needed.
 * Cancels all existing notifications and re-schedules based on current preferences.
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

    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);

    if (isRegistered) {
      logger.info('BACKGROUND_TASK: Task already registered', { taskName: BACKGROUND_TASK_NAME });
      return;
    }

    const intervalSeconds = BACKGROUND_TASK_INTERVAL_HOURS * 60 * 60;

    await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_NAME, {
      minimumInterval: intervalSeconds,
    });

    logger.info('BACKGROUND_TASK: Task registered successfully', {
      taskName: BACKGROUND_TASK_NAME,
      minimumIntervalHours: BACKGROUND_TASK_INTERVAL_HOURS,
      minimumIntervalSeconds: intervalSeconds,
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
