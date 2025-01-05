import * as Notifications from 'expo-notifications';
import { getDefaultStore } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import { PRAYERS_ENGLISH, EXTRAS_ENGLISH } from '@/shared/constants';
import logger from '@/shared/logger';
import * as NotificationUtils from '@/shared/notifications';
import { NotificationSchedule, ScheduledNotification } from '@/shared/notifications';
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

export const standardScheduledNotificationsAtom = atomWithStorage<NotificationSchedule>(
  'scheduled_notifications_standard',
  {},
  Database.mmkvStorage,
  { getOnInit: true }
);

export const extraScheduledNotificationsAtom = atomWithStorage<NotificationSchedule>(
  'scheduled_notifications_extra',
  {},
  Database.mmkvStorage,
  { getOnInit: true }
);

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
  const atom = type === ScheduleType.Standard ? standardNotificationsMutedAtom : extraNotificationsMutedAtom;
  return store.get(atom);
};

export const setNotificationsMuted = (type: ScheduleType, muted: boolean) => {
  const atom = type === ScheduleType.Standard ? standardNotificationsMutedAtom : extraNotificationsMutedAtom;
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

    logger.info('Scheduled notification:', { id, englishName, date, time });
    return id;
  } catch (error) {
    logger.error('Failed to schedule notification:', error);
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
  const atom =
    scheduleType === ScheduleType.Standard ? standardScheduledNotificationsAtom : extraScheduledNotificationsAtom;

  const current = store.get(atom);
  const notifications = current[prayerIndex] || [];

  store.set(atom, {
    ...current,
    [prayerIndex]: [...notifications, notification],
  });
};

/**
 * Cancel all notifications for a single prayer
 */
export const cancelAllNotificationsForPrayer = async (scheduleType: ScheduleType, prayerIndex: number) => {
  const atom =
    scheduleType === ScheduleType.Standard ? standardScheduledNotificationsAtom : extraScheduledNotificationsAtom;

  const schedule = store.get(atom);
  const notifications = schedule[prayerIndex] || [];

  // Cancel all notifications
  await Promise.all(
    notifications.map(async (notification) => {
      try {
        await Notifications.cancelScheduledNotificationAsync(notification.id);
        logger.info('Cancelled notification:', notification.id);
      } catch (error) {
        logger.error('Failed to cancel notification:', error);
      }
    })
  );

  // Clear from store
  store.set(atom, {
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
    const prayerData = Database.getPrayerByDate(new Date(date));
    if (!prayerData) continue;

    // Skip if not Friday for Istijaba
    if (englishName.toLocaleLowerCase() === 'istijaba') {
      const dayOfWeek = new Date(date).getDay();
      if (dayOfWeek !== 5) continue; // 5 is Friday
    }

    try {
      const id = await scheduleSingleNotification(
        englishName,
        arabicName,
        date,
        prayerData[englishName.toLowerCase()],
        alertType
      );

      addSingleNotificationToStore(scheduleType, prayerIndex, {
        id,
        date,
        time: prayerData[englishName.toLowerCase()],
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
  const atom =
    scheduleType === ScheduleType.Standard ? standardScheduledNotificationsAtom : extraScheduledNotificationsAtom;

  const schedule = store.get(atom);
  const notifications = schedule[prayerIndex] || [];
  const remaining = notifications.filter((n) => !NotificationUtils.isNotificationOutdated(n));

  // Only update store if we found outdated notifications
  if (remaining.length < notifications.length) {
    store.set(atom, {
      ...schedule,
      [prayerIndex]: remaining,
    });

    logger.info('Cleaned up outdated notifications:', {
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
  const atom =
    scheduleType === ScheduleType.Standard ? standardScheduledNotificationsAtom : extraScheduledNotificationsAtom;

  const schedule = store.get(atom);

  // Clean all prayers in the schedule
  await Promise.all(
    Object.keys(schedule).map((index) => cleanupOutdatedNotificationsForPrayer(scheduleType, Number(index)))
  );

  logger.info('Cleaned up schedule notifications:', { scheduleType });
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
