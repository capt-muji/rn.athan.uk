import * as Notifications from 'expo-notifications';
import { getDefaultStore } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import { PRAYERS_ENGLISH, EXTRAS_ENGLISH, EXTRAS_ARABIC, PRAYERS_ARABIC } from '@/shared/constants';
import logger from '@/shared/logger';
import * as NotificationUtils from '@/shared/notifications';
import { ScheduledNotification } from '@/shared/notifications';
import * as TimeUtils from '@/shared/time';
import { AlertPreferences, AlertType, ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';

const store = getDefaultStore();

// --- Initial values ---

const initialAlertPreferences = (prayers: string[]): AlertPreferences => {
  const preferences: AlertPreferences = {};

  prayers.forEach((_, index) => {
    preferences[index] = AlertType.Off;
  });

  return preferences;
};

// --- Atoms ---

export const standardAlertPreferencesAtom = atomWithStorage(
  'preferences_alert_standard',
  initialAlertPreferences(PRAYERS_ENGLISH),
  Database.mmkvStorage,
  { getOnInit: true }
);

export const extraAlertPreferencesAtom = atomWithStorage(
  'preferences_alert_extra',
  initialAlertPreferences(EXTRAS_ENGLISH),
  Database.mmkvStorage,
  { getOnInit: true }
);

export const soundPreferenceAtom = atomWithStorage<number>('preferences_sound', 0, Database.mmkvStorage, {
  getOnInit: true,
});

export const standardNotificationsMutedAtom = atomWithStorage(
  'preferences_muted_standard',
  false,
  Database.mmkvStorage,
  { getOnInit: true }
);

export const extraNotificationsMutedAtom = atomWithStorage('preferences_muted_extra', false, Database.mmkvStorage, {
  getOnInit: true,
});

// --- Actions ---

export const getSoundPreference = () => store.get(soundPreferenceAtom);

export const getAlertPreferences = (type: ScheduleType) => {
  const isStandard = type === ScheduleType.Standard;
  const alertPreferencesAtom = isStandard ? standardAlertPreferencesAtom : extraAlertPreferencesAtom;

  return store.get(alertPreferencesAtom);
};

export const setAlertPreference = (scheduleType: ScheduleType, prayerIndex: number, alertType: AlertType) => {
  const isStandard = scheduleType === ScheduleType.Standard;
  const preferences = getAlertPreferences(scheduleType);
  const scheduleAtom = isStandard ? standardAlertPreferencesAtom : extraAlertPreferencesAtom;

  store.set(scheduleAtom, { ...preferences, [prayerIndex]: alertType });
};

export const setSoundPreference = (selection: number) => store.set(soundPreferenceAtom, selection);

export const getNotificationsMuted = (type: ScheduleType) => {
  const isStandard = type === ScheduleType.Standard;
  const atom = isStandard ? standardNotificationsMutedAtom : extraNotificationsMutedAtom;

  return store.get(atom);
};

export const setNotificationsMuted = (type: ScheduleType, muted: boolean) => {
  const isStandard = type === ScheduleType.Standard;
  const atom = isStandard ? standardNotificationsMutedAtom : extraNotificationsMutedAtom;

  store.set(atom, muted);
};

/**
 * Schedule a single notification and return its identifier
 */
export const scheduleSingleNotification = async (
  englishName: string,
  arabicName: string,
  date: string,
  time: string,
  alertType: AlertType
): Promise<string> => {
  const sound = await getSoundPreference();
  const triggerDate = NotificationUtils.createTriggerDate(date, time);

  const content = NotificationUtils.createNotificationContent(englishName, arabicName, alertType, sound);

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: triggerDate,
    });

    logger.info('NOTIFICATION: Scheduled:', { id, englishName, date, time });
    return id;
  } catch (error) {
    logger.error('NOTIFICATION: Failed to schedule:', error);
    throw error;
  }
};

/**
 * Add single notification to store
 */
export const addSingleNotificationToStore = (
  scheduleType: ScheduleType,
  prayerIndex: number,
  notification: ScheduledNotification
) => {
  const current = Database.getScheduledNotifications(scheduleType);
  const notifications = current[prayerIndex] || [];

  Database.setScheduledNotifications(scheduleType, {
    ...current,
    [prayerIndex]: [...notifications, notification],
  });
};

/**
 * Cancel all notifications for a single prayer
 */
export const cancelAllNotificationsForPrayer = async (scheduleType: ScheduleType, prayerIndex: number) => {
  const schedule = Database.getScheduledNotifications(scheduleType);
  const notifications = schedule[prayerIndex] || [];

  // Cancel all notifications
  await Promise.all(
    notifications.map(async (notification) => {
      try {
        await Notifications.cancelScheduledNotificationAsync(notification.id);
        logger.info('NOTIFICATION: Cancelled:', notification.id);
      } catch (error) {
        logger.error('NOTIFICATION: Failed to cancel:', error);
      }
    })
  );

  // Clear from store
  Database.setScheduledNotifications(scheduleType, {
    ...schedule,
    [prayerIndex]: [],
  });
};

/**
 * Schedule multiple notifications (5 days) for a single prayer
 */
export const scheduleMultipleNotificationsForPrayer = async (
  scheduleType: ScheduleType,
  prayerIndex: number,
  englishName: string,
  arabicName: string,
  alertType: AlertType
) => {
  const next5Days = NotificationUtils.getNext5Days();

  // Cancel existing notifications first
  await cancelAllNotificationsForPrayer(scheduleType, prayerIndex);

  // Schedule new notifications
  for (const date of next5Days) {
    const dateI = TimeUtils.createLondonDate(date);
    const prayerData = Database.getPrayerByDate(dateI);
    if (!prayerData) continue;

    const prayerTime = prayerData[englishName.toLowerCase() as keyof typeof prayerData];

    // Skip if prayer time has passed
    if (!NotificationUtils.isPrayerTimeInFuture(date, prayerTime)) {
      logger.info('Skipping past prayer:', { date, time: prayerTime, englishName });
      continue;
    }

    // Skip if not Friday for Istijaba
    if (englishName.toLowerCase() === 'istijaba') {
      if (!TimeUtils.isFriday(date)) continue;
    }

    try {
      const id = await scheduleSingleNotification(englishName, arabicName, date, prayerTime, alertType);

      addSingleNotificationToStore(scheduleType, prayerIndex, {
        id,
        date,
        time: prayerTime,
        englishName,
        arabicName,
        alertType,
      });
    } catch (error) {
      logger.error('Failed to schedule prayer notification:', error);
    }
  }
};

/**
 * Clean up outdated notifications for a single prayer
 */
export const cleanupOutdatedNotificationsForPrayer = async (scheduleType: ScheduleType, prayerIndex: number) => {
  const schedule = Database.getScheduledNotifications(scheduleType);
  const notifications = schedule[prayerIndex] || [];
  const remaining = notifications.filter((n) => !NotificationUtils.isNotificationOutdated(n));

  // Only update store if we found outdated notifications
  if (remaining.length < notifications.length) {
    Database.setScheduledNotifications(scheduleType, {
      ...schedule,
      [prayerIndex]: remaining,
    });

    logger.info('NOTIFICATION: Cleaned up outdated:', {
      scheduleType,
      prayerIndex,
      removedCount: notifications.length - remaining.length,
      remainingCount: remaining.length,
    });
  }
};

/**
 * Clean up all outdated notifications for a specific schedule
 */
export const cleanupOutdatedNotificationsForSchedule = async (scheduleType: ScheduleType) => {
  const schedule = Database.getScheduledNotifications(scheduleType);

  // Clean all prayers in the schedule
  await Promise.all(
    Object.keys(schedule).map((index) => cleanupOutdatedNotificationsForPrayer(scheduleType, Number(index)))
  );

  logger.info('NOTIFICATION: Cleaned up schedule:', { scheduleType });
};

/**
 * Clean up all outdated notifications for all schedules
 */
export const cleanupAllOutdatedNotifications = async () => {
  await Promise.all([
    cleanupOutdatedNotificationsForSchedule(ScheduleType.Standard),
    cleanupOutdatedNotificationsForSchedule(ScheduleType.Extra),
  ]);
};

/**
 * Debug helper to get all scheduled notifications
 */
export const getScheduledNotificationsDebug = () => {
  const standardSchedule = Database.getScheduledNotifications(ScheduleType.Standard);
  const extraSchedule = Database.getScheduledNotifications(ScheduleType.Extra);

  return {
    standard: Object.entries(standardSchedule).map(([index, notifications]) => ({
      prayerIndex: Number(index),
      count: notifications.length,
      notifications: notifications.map((n) => ({
        name: n.englishName,
        date: n.date,
        time: n.time,
        alertType: n.alertType,
      })),
    })),
    extra: Object.entries(extraSchedule).map(([index, notifications]) => ({
      prayerIndex: Number(index),
      count: notifications.length,
      notifications: notifications.map((n) => ({
        name: n.englishName,
        date: n.date,
        time: n.time,
        alertType: n.alertType,
      })),
    })),
  };
};

/**
 * Cancel and clear all notifications for a schedule type
 */
export const cancelAllScheduleNotifications = async (scheduleType: ScheduleType) => {
  const schedule = Database.getScheduledNotifications(scheduleType);

  // Cancel all notifications for each prayer index
  await Promise.all(
    Object.keys(schedule).map(async (index) => {
      await cancelAllNotificationsForPrayer(scheduleType, Number(index));
    })
  );

  // Clear the schedule
  Database.setScheduledNotifications(scheduleType, {});

  logger.info('NOTIFICATION: Cancelled all notifications for schedule:', { scheduleType });
};

/**
 * Reschedule all notifications for a schedule based on current preferences
 */
export const rescheduleAllNotifications = async (scheduleType: ScheduleType) => {
  const isStandard = scheduleType === ScheduleType.Standard;

  const preferences = getAlertPreferences(scheduleType) as AlertPreferences;
  const prayers = isStandard ? PRAYERS_ENGLISH : EXTRAS_ENGLISH;
  const arabicPrayers = isStandard ? PRAYERS_ARABIC : EXTRAS_ARABIC;

  await Promise.all(
    Object.entries(preferences).map(async ([index, alertType]) => {
      if (alertType === AlertType.Off) return;

      const prayerIndex = Number(index);
      await scheduleMultipleNotificationsForPrayer(
        scheduleType,
        prayerIndex,
        prayers[prayerIndex],
        arabicPrayers[prayerIndex],
        alertType
      );
    })
  );

  logger.info('NOTIFICATION: Rescheduled all notifications for schedule:', { scheduleType });
};
