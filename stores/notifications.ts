import { getDefaultStore } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import * as Device from '@/device/notifications';
import { PRAYERS_ENGLISH, EXTRAS_ENGLISH } from '@/shared/constants';
import logger from '@/shared/logger';
import * as NotificationUtils from '@/shared/notifications';
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

export const standardAlertPreferencesAtom = atomWithStorage<AlertPreferences>(
  'preferences_alert_standard',
  initialAlertPreferences(PRAYERS_ENGLISH),
  Database.mmkvStorage,
  { getOnInit: true }
);

export const extraAlertPreferencesAtom = atomWithStorage<AlertPreferences>(
  'preferences_alert_extra',
  initialAlertPreferences(EXTRAS_ENGLISH),
  Database.mmkvStorage,
  { getOnInit: true }
);

export const soundPreferenceAtom = atomWithStorage<number>('preferences_sound', 0, Database.mmkvStorage, {
  getOnInit: true,
});

export const standardNotificationsMutedAtom = atomWithStorage<boolean>(
  'preferences_muted_standard',
  false,
  Database.mmkvStorage,
  { getOnInit: true }
);

export const extraNotificationsMutedAtom = atomWithStorage<boolean>(
  'preferences_muted_extra',
  false,
  Database.mmkvStorage,
  {
    getOnInit: true,
  }
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
 * Schedule multiple notifications (5 days) for a single prayer in the system and database
 */
export const addMultipleScheduleNotificationsForPrayer = async (
  scheduleType: ScheduleType,
  prayerIndex: number,
  englishName: string,
  arabicName: string,
  alertType: AlertType
) => {
  const next5Days = NotificationUtils.genNext5Days();

  // Cancel existing notifications first
  await clearAllScheduledNotificationForPrayer(scheduleType, prayerIndex);

  // Schedule new notifications
  for (const dateI of next5Days) {
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
    if (englishName.toLowerCase() === 'istijaba') {
      if (!TimeUtils.isFriday(date)) continue;
    }

    try {
      const notification = await Device.addOneScheduledNotificationForPrayer(
        englishName,
        arabicName,
        dateI,
        prayerTime,
        alertType
      );

      Database.addOneScheduledNotificationForPrayer(scheduleType, prayerIndex, notification);
    } catch (error) {
      logger.error('Failed to schedule prayer notification:', error);
    }
  }

  logger.info('NOTIFICATION: Scheduled multiple notifications:', {
    scheduleType,
    prayerIndex,
    englishName,
  });
};

export const clearAllScheduledNotificationForPrayer = async (scheduleType: ScheduleType, prayerIndex: number) => {
  await Device.clearAllScheduledNotificationForPrayer(scheduleType, prayerIndex);
  Database.clearAllScheduledNotificationsForPrayer(scheduleType, prayerIndex);
};

// /**
//  * Clean up outdated notifications for a single prayer
//  */
// export const cleanupOutdatedNotificationsForPrayer = async (scheduleType: ScheduleType, prayerIndex: number) => {
//   const schedule = Database.getScheduledNotifications(scheduleType);
//   const notifications = schedule[prayerIndex] || [];
//   const remaining = notifications.filter((n) => !NotificationUtils.isNotificationOutdated(n));

//   // Only update store if we found outdated notifications
//   if (remaining.length < notifications.length) {
//     Database.setScheduledNotifications(scheduleType, {
//       ...schedule,
//       [prayerIndex]: remaining,
//     });

//     logger.info('NOTIFICATION: Cleaned up outdated:', {
//       scheduleType,
//       prayerIndex,
//       removedCount: notifications.length - remaining.length,
//       remainingCount: remaining.length,
//     });
//   }
// };

// /**
//  * Clean up all outdated notifications for a specific schedule
//  */
// export const cleanupOutdatedNotificationsForSchedule = async (scheduleType: ScheduleType) => {
//   const schedule = Database.getScheduledNotifications(scheduleType);

//   // Clean all prayers in the schedule
//   await Promise.all(
//     Object.keys(schedule).map((index) => cleanupOutdatedNotificationsForPrayer(scheduleType, Number(index)))
//   );

//   logger.info('NOTIFICATION: Cleaned up schedule:', { scheduleType });
// };

// /**
//  * Clean up all outdated notifications for all schedules
//  */
// export const cleanupAllOutdatedNotifications = async () => {
//   await Promise.all([
//     cleanupOutdatedNotificationsForSchedule(ScheduleType.Standard),
//     cleanupOutdatedNotificationsForSchedule(ScheduleType.Extra),
//   ]);
// };

// /**
//  * Cancel and clear all notifications for a schedule type
//  */
// export const cancelAllScheduleNotifications = async (scheduleType: ScheduleType) => {
//   const schedule = Database.getScheduledNotifications(scheduleType);

//   // Cancel all notifications for each prayer index
//   await Promise.all(
//     Object.keys(schedule).map(async (index) => {
//       await cancelAllNotificationsForPrayer(scheduleType, Number(index));
//     })
//   );

//   // Clear the schedule
//   Database.setScheduledNotifications(scheduleType, {});

//   logger.info('NOTIFICATION: Cancelled all notifications for schedule:', { scheduleType });
// };

// /**
//  * Reschedule all notifications for a schedule based on current preferences
//  */
// export const rescheduleAllNotifications = async (scheduleType: ScheduleType) => {
//   const isStandard = scheduleType === ScheduleType.Standard;

//   const preferences = getAlertPreferences(scheduleType) as AlertPreferences;
//   const prayers = isStandard ? PRAYERS_ENGLISH : EXTRAS_ENGLISH;
//   const arabicPrayers = isStandard ? PRAYERS_ARABIC : EXTRAS_ARABIC;

//   await Promise.all(
//     Object.entries(preferences).map(async ([index, alertType]) => {
//       if (alertType === AlertType.Off) return;

//       const prayerIndex = Number(index);
//       await scheduleMultipleNotificationsForPrayer(
//         scheduleType,
//         prayerIndex,
//         prayers[prayerIndex],
//         arabicPrayers[prayerIndex],
//         alertType
//       );
//     })
//   );

//   logger.info('NOTIFICATION: Rescheduled all notifications for schedule:', { scheduleType });
// };
