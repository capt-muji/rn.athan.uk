import { differenceInHours, formatISO, addHours, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { getDefaultStore } from 'jotai';

import * as Device from '@/device/notifications';
import { PRAYERS_ENGLISH, EXTRAS_ENGLISH, EXTRAS_ARABIC, PRAYERS_ARABIC } from '@/shared/constants';
import logger from '@/shared/logger';
import * as NotificationUtils from '@/shared/notifications';
import * as TimeUtils from '@/shared/time';
import { AlertType, ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';
import { atomWithStorageNumber, atomWithStorageBoolean } from '@/stores/storage';

const store = getDefaultStore();

// --- Atoms ---

// --- Individual Prayer Atoms ---
export const createPrayerAlertAtom = (scheduleType: ScheduleType, prayerIndex: number) => {
  const isStandard = scheduleType === ScheduleType.Standard;
  const type = isStandard ? 'standard' : 'extra';

  return atomWithStorageNumber(`preference_alert_${type}_${prayerIndex}`, AlertType.Off);
};

export const standardPrayerAlertAtoms = PRAYERS_ENGLISH.map((_, index) =>
  createPrayerAlertAtom(ScheduleType.Standard, index)
);

export const extraPrayerAlertAtoms = EXTRAS_ENGLISH.map((_, index) => createPrayerAlertAtom(ScheduleType.Extra, index));

export const soundPreferenceAtom = atomWithStorageNumber('preference_sound', 0);

export const standardNotificationsMutedAtom = atomWithStorageBoolean('preference_mute_standard', false);

export const extraNotificationsMutedAtom = atomWithStorageBoolean('preference_mute_extra', false);

export const lastNotificationScheduleAtom = atomWithStorageNumber('last_notification_schedule_check', 0);

// --- Actions ---

// --- Alert Helpers ---

export const getPrayerAlertType = (scheduleType: ScheduleType, prayerIndex: number): AlertType => {
  const atom = getPrayerAlertAtom(scheduleType, prayerIndex);
  return store.get(atom);
};

export const getScheduleMutedState = (scheduleType: ScheduleType): boolean => {
  const isStandard = scheduleType === ScheduleType.Standard;
  const atom = isStandard ? standardNotificationsMutedAtom : extraNotificationsMutedAtom;

  return store.get(atom);
};

export const getSoundPreference = () => store.get(soundPreferenceAtom);

export const setSoundPreference = (selection: number) => store.set(soundPreferenceAtom, selection);

export const setScheduleMutedState = (scheduleType: ScheduleType, muted: boolean) => {
  const isStandard = scheduleType === ScheduleType.Standard;
  const atom = isStandard ? standardNotificationsMutedAtom : extraNotificationsMutedAtom;
  store.set(atom, muted);
};

export const getPrayerAlertAtom = (scheduleType: ScheduleType, prayerIndex: number) => {
  const isStandard = scheduleType === ScheduleType.Standard;
  const atoms = isStandard ? standardPrayerAlertAtoms : extraPrayerAlertAtoms;

  return atoms[prayerIndex];
};

export const setPrayerAlertType = (scheduleType: ScheduleType, prayerIndex: number, alertType: AlertType) => {
  const atom = getPrayerAlertAtom(scheduleType, prayerIndex);
  store.set(atom, alertType);
};

/**
 * Schedule multiple notifications (5 days) for a single prayer in the system and database
 */
export const addMultipleScheduleNotificationsForPrayer = async (
  scheduleType: ScheduleType,
  prayerIndex: number,
  englishName: string,
  arabicName: string,
  alertType: AlertType
) => {
  // Check if schedule is muted first
  if (getScheduleMutedState(scheduleType)) {
    logger.info('NOTIFICATION: Schedule is muted, skipping notification scheduling:', {
      scheduleType,
      prayerIndex,
      englishName,
    });
    return;
  }

  const next3Days = NotificationUtils.genNextXDays(3);

  // Cancel existing notifications first
  const cancelPromise = clearAllScheduledNotificationForPrayer(scheduleType, prayerIndex);

  const notificationPromises = [];

  for (const dateI of next3Days) {
    const date = TimeUtils.createLondonDate(dateI);
    const prayerData = Database.getPrayerByDate(date);
    if (!prayerData) continue;

    const prayerTime = prayerData[englishName.toLowerCase() as keyof typeof prayerData];

    // Skip if prayer time has passed
    if (!NotificationUtils.isPrayerTimeInFuture(dateI, prayerTime)) {
      logger.info('Skipping past prayer:', { date, time: prayerTime, englishName });
      continue;
    }

    // Skip if not Friday for Istijaba
    if (englishName.toLowerCase() === 'istijaba' && !TimeUtils.isFriday(date)) {
      logger.info('Skipping Istijaba on non-Friday:', { date, time: prayerTime });
      continue;
    }

    // Schedule notification
    const promise = Device.addOneScheduledNotificationForPrayer(englishName, arabicName, dateI, prayerTime, alertType)
      .then((notification) => Database.addOneScheduledNotificationForPrayer(scheduleType, prayerIndex, notification))
      .catch((error) => logger.error('Failed to schedule prayer notification:', error));

    notificationPromises.push(promise);
  }

  await Promise.all([cancelPromise, notificationPromises]);

  logger.info('NOTIFICATION: Scheduled multiple notifications:', { scheduleType, prayerIndex, englishName });
};

/**
 * Reschedule all notifications for a schedule based on current preferences
 */
export const addAllScheduleNotificationsForSchedule = async (scheduleType: ScheduleType) => {
  // Check if schedule is muted first
  if (getScheduleMutedState(scheduleType)) {
    logger.info('NOTIFICATION: Schedule is muted, skipping notification scheduling:', { scheduleType });
    return;
  }

  const isStandard = scheduleType === ScheduleType.Standard;
  const prayers = isStandard ? PRAYERS_ENGLISH : EXTRAS_ENGLISH;
  const arabicPrayers = isStandard ? PRAYERS_ARABIC : EXTRAS_ARABIC;

  const promises = prayers.map(async (_, index) => {
    const alertType = getPrayerAlertType(scheduleType, index);
    if (alertType === AlertType.Off) return;

    return addMultipleScheduleNotificationsForPrayer(
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

export const clearAllScheduledNotificationForPrayer = async (scheduleType: ScheduleType, prayerIndex: number) => {
  await Device.clearAllScheduledNotificationForPrayer(scheduleType, prayerIndex);
  Database.clearAllScheduledNotificationsForPrayer(scheduleType, prayerIndex);
};

/**
 * Cancel and clear all notifications for a schedule type
 */
export const cancelAllScheduleNotificationsForSchedule = async (scheduleType: ScheduleType) => {
  const schedule = Database.getAllScheduledNotificationsForSchedule(scheduleType);

  const promises = schedule.map((notification) => Device.cancelScheduledNotificationById(notification.id));

  // Cancel all notifications for each prayer index
  await Promise.all(promises);

  // Clear the schedule
  Database.clearAllScheduledNotificationsForSchedule(scheduleType);

  logger.info('NOTIFICATION: Cancelled all notifications for schedule:', { scheduleType });
};

// Constants for notification scheduling
const NOTIFICATION_REFRESH_HOURS = 24;

// Check if notifications need rescheduling (more than 24 hours since last schedule)
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

export const refreshNotifications = async () => {
  if (!shouldRescheduleNotifications()) {
    logger.info('NOTIFICATION: Skipping reschedule, last schedule was within 24 hours');
    return;
  }

  logger.info('NOTIFICATION: Starting notification refresh');

  try {
    // Cancel all notifications for both schedules
    await Promise.all([
      cancelAllScheduleNotificationsForSchedule(ScheduleType.Standard),
      cancelAllScheduleNotificationsForSchedule(ScheduleType.Extra),
    ]);

    // Reschedule all notifications for both schedules
    await Promise.all([
      addAllScheduleNotificationsForSchedule(ScheduleType.Standard),
      addAllScheduleNotificationsForSchedule(ScheduleType.Extra),
    ]);

    // Update last schedule timestamp
    store.set(lastNotificationScheduleAtom, Date.now());

    logger.info('NOTIFICATION: Refresh complete');
  } catch (error) {
    logger.error('NOTIFICATION: Failed to refresh notifications:', error);
    throw error;
  }
};
