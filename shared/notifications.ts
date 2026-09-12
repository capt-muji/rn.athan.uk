import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import logger from '@/shared/logger';
import * as TimeUtils from '@/shared/time';
import { AlertType, type ReminderInterval } from '@/shared/types';

export interface ScheduledNotification {
  id: string;
  date: string;
  time: string;
  englishName: string;
  arabicName: string;
  alertType: AlertType;
}

/**
 * The 5 daily prayers whose at-time notifications play the user's selected
 * athan. Every other at-time prayer (Sunrise + all extras) plays the fixed
 * built-in reminder sound instead (ISSUES.md #23 — note this boundary is
 * prayer-aware, not schedule-aware: Sunrise sits on the standard page but
 * uses the extras audio).
 */
const DAILY_PRAYERS = new Set(['fajr', 'dhuhr', 'asr', 'magrib', 'isha']);

/**
 * Fixed built-in audio for at-time Sunrise + extras notifications
 * (assets/audio/reminders/reminder.mp3 — owner-created, not user-selectable)
 */
export const EXTRAS_NOTIFICATION_SOUND = 'reminder.mp3';

/**
 * Whether an at-time notification for this prayer plays the selected athan
 */
export const isDailyPrayer = (englishName: string): boolean => DAILY_PRAYERS.has(englishName.toLowerCase());

/**
 * Gets notification sound based on alert type
 * Returns false for silent notifications (SDK 54 requirement)
 */
export const getNotificationSound = (alertType: AlertType, englishName: string, soundIndex: number): string | false => {
  if (alertType !== AlertType.Sound) return false;
  if (!isDailyPrayer(englishName)) return EXTRAS_NOTIFICATION_SOUND;

  return `athan${soundIndex + 1}.mp3`;
};

/**
 * Creates notification content based on alert type
 * English-only, title only (no body)
 */
export const genNotificationContent = (
  englishName: string,
  _arabicName: string,
  alertType: AlertType,
  soundIndex: number
): Notifications.NotificationContentInput => {
  return {
    title: `${englishName} now`,
    sound: getNotificationSound(alertType, englishName, soundIndex),
    color: '#5a3af7',
    autoDismiss: false,
    sticky: false,
    priority: Notifications.AndroidNotificationPriority.MAX,
    interruptionLevel: 'timeSensitive',
  };
};

/**
 * Converts an English prayer name to a filename-safe slug
 * Android res/raw resource names allow [a-z0-9_] only
 *
 * @example
 * prayerNameSlug('Last Third') // 'last_third'
 */
export const prayerNameSlug = (englishName: string): string => englishName.toLowerCase().replace(/\s+/g, '_');

/**
 * Gets notification sound for a pre-prayer reminder based on alert type
 * Every prayer × interval combination has its own audio file
 * (reminder_fajr_5.mp3 … reminder_istijaba_30.mp3)
 */
export const getReminderNotificationSound = (
  alertType: AlertType,
  englishName: string,
  intervalMinutes: ReminderInterval
): string | false => {
  if (alertType !== AlertType.Sound) return false;

  const slug = prayerNameSlug(englishName);
  return `reminder_${slug}_${intervalMinutes}.mp3`;
};

/**
 * Creates notification content for pre-prayer reminder
 * English-only, title only (no body)
 * @param englishName English prayer name
 * @param _arabicName Arabic prayer name (unused, kept for API compatibility)
 * @param intervalMinutes Minutes before prayer time
 * @param alertType Alert type (Off/Silent/Sound)
 * @returns Notification content input
 */
export const genReminderNotificationContent = (
  englishName: string,
  _arabicName: string,
  intervalMinutes: ReminderInterval,
  alertType: AlertType
): Notifications.NotificationContentInput => {
  return {
    title: `${englishName} in ${intervalMinutes}m`,
    sound: getReminderNotificationSound(alertType, englishName, intervalMinutes),
    color: '#5a3af7',
    autoDismiss: true,
    sticky: false,
    priority: Notifications.AndroidNotificationPriority.HIGH,
    interruptionLevel: 'timeSensitive',
  };
};

/**
 * Finds OS-scheduled notifications that no longer have a database record.
 *
 * After a reschedule, the database describes exactly the intended set of
 * notifications (deterministic identifiers, records rewritten per prayer).
 * Anything still pending in the OS beyond those records is stale: turned-off
 * prayers, superseded reminder intervals, or orphans from earlier versions
 * whose bookkeeping was lost. Cancelling exactly these heals the OS to match
 * the database without ever touching live notifications.
 *
 * The diff is one-directional: records without an OS entry (e.g. prayers that
 * fired while the app was closed) are NOT stale — the OS already removed them.
 *
 * @param osIdentifiers Identifiers of notifications currently pending in the OS
 * @param dbRecords Notification records describing the intended scheduled set
 * @returns OS identifiers with no database record, in original order
 *
 * @example
 * findStaleScheduledNotificationIds(
 *   ['athan_standard_fajr_2026-08-29', 'legacy-uuid'],
 *   [{ id: 'athan_standard_fajr_2026-08-29', ... }]
 * ) // ['legacy-uuid']
 */
export const findStaleScheduledNotificationIds = (
  osIdentifiers: string[],
  dbRecords: ScheduledNotification[]
): string[] => {
  const recordedIds = new Set(dbRecords.map((record) => record.id));

  return osIdentifiers.filter((identifier) => !recordedIds.has(identifier));
};

/**
 * Generates X consecutive dates starting from given date (inclusive)
 * Index 0 is the start date (today if not specified)
 */
export const genNextXDays = (numberOfDays: number): string[] => {
  const today = TimeUtils.getTodayDateString();

  return Array.from({ length: numberOfDays }, (_, i) => TimeUtils.addDaysToDateString(today, i));
};

/**
 * Android channel ID for an at-time Athan sound
 * Suffixed `_v2` because channel sounds are immutable once created — the wav→mp3
 * swap required fresh IDs (legacy channels are deleted by deleteLegacyAndroidAudioChannels)
 */
export const athanAndroidChannelId = (soundIndex: number): string => `athan_${soundIndex + 1}_v2`;

/**
 * Android channel ID for a pre-prayer reminder sound (one channel per prayer × interval audio)
 * No `_v2` suffix needed: the legacy generation had a single `reminder` channel, so these IDs never existed before
 */
export const reminderAndroidChannelId = (englishName: string, intervalMinutes: ReminderInterval): string => {
  const slug = prayerNameSlug(englishName);
  return `reminder_${slug}_${intervalMinutes}`;
};

/**
 * Android channel ID for the fixed at-time Sunrise + extras sound
 * Fresh ID that never existed under a different sound (ISSUES.md #23) — same
 * reasoning as the reminder channels: no `_v2` suffix needed on a first generation
 */
export const extrasAndroidChannelId = 'extras_at_time';

/**
 * Android channel for an at-time notification: the selected athan's channel
 * for the 5 daily prayers, the fixed extras channel for everything else
 */
export const atTimeAndroidChannelId = (englishName: string, soundIndex: number): string =>
  isDailyPrayer(englishName) ? athanAndroidChannelId(soundIndex) : extrasAndroidChannelId;

export const createDefaultAndroidChannel = async () => {
  if (Platform.OS !== 'android') return;

  const channelId = athanAndroidChannelId(0);

  await Notifications.setNotificationChannelAsync(channelId, {
    name: 'Athan 1',
    sound: 'athan1.mp3',
    importance: Notifications.AndroidImportance.MAX,
    enableVibrate: true,
    vibrationPattern: [0, 250, 250, 250],
    bypassDnd: true,
  });
};

/** Channel IDs created this session — skips repeat setNotificationChannelAsync calls across reschedules */
const createdReminderChannels = new Set<string>();

/** Athan channel IDs created this session (dedup mirrors createdReminderChannels) */
const createdAthanChannels = new Set<string>();

/** Whether the extras at-time channel was created this process (dedup mirrors createdReminderChannels) */
let extrasChannelCreated = false;

/**
 * Creates the Android notification channel for the fixed at-time Sunrise +
 * extras sound. Called from initializeNotifications and again at schedule time
 * so headless background-task reschedules (which never run UI init) still find
 * the channel — Android drops notifications posted to nonexistent channels.
 */
export const createExtrasAndroidChannel = async () => {
  if (Platform.OS !== 'android') return;
  if (extrasChannelCreated) return;

  await Notifications.setNotificationChannelAsync(extrasAndroidChannelId, {
    name: 'Extra Times',
    sound: EXTRAS_NOTIFICATION_SOUND,
    importance: Notifications.AndroidImportance.MAX,
    enableVibrate: true,
    vibrationPattern: [0, 250, 250, 250],
    bypassDnd: true,
  });

  extrasChannelCreated = true;
};

/**
 * Creates the Android notification channel for the selected athan sound.
 * Called at schedule time for the 5 daily prayers for the same reason the extras
 * channel is: initialization only ever creates index 0, so any other selected
 * sound has no channel after a backup restore (channels are system state and are
 * not restored) and the athan is replaced by expo's fallback channel and its
 * default tone. Identical settings to createDefaultAndroidChannel — re-creating an
 * existing channel changes nothing on Android, so this only ever fills a gap.
 */
export const createAthanAndroidChannel = async (soundIndex: number) => {
  if (Platform.OS !== 'android') return;

  const channelId = athanAndroidChannelId(soundIndex);
  if (createdAthanChannels.has(channelId)) return;

  await Notifications.setNotificationChannelAsync(channelId, {
    name: `Athan ${soundIndex + 1}`,
    sound: `athan${soundIndex + 1}.mp3`,
    importance: Notifications.AndroidImportance.MAX,
    enableVibrate: true,
    vibrationPattern: [0, 250, 250, 250],
    bypassDnd: true,
  });

  createdAthanChannels.add(channelId);
};

/**
 * Creates the Android notification channel for a prayer × interval reminder sound
 * Called at schedule time so only combinations actually scheduled materialize as channels
 */
export const createReminderAndroidChannel = async (englishName: string, intervalMinutes: ReminderInterval) => {
  if (Platform.OS !== 'android') return;

  const channelId = reminderAndroidChannelId(englishName, intervalMinutes);
  if (createdReminderChannels.has(channelId)) return;

  const slug = prayerNameSlug(englishName);

  await Notifications.setNotificationChannelAsync(channelId, {
    name: `${englishName} in ${intervalMinutes}m Reminder`,
    sound: `reminder_${slug}_${intervalMinutes}.mp3`,
    importance: Notifications.AndroidImportance.HIGH,
    enableVibrate: true,
    vibrationPattern: [0, 250, 250, 250],
    bypassDnd: true,
  });

  createdReminderChannels.add(channelId);
};

/**
 * Deletes the pre-mp3 channel generation (`athan_1`…`athan_16` + the single `reminder` channel)
 * Their sounds are immutable on Android and point at removed .wav resources, so old installs
 * must move to the `_v2` / per-prayer channels. Safe on every init: deleting an absent
 * channel is a system no-op (fresh installs never had them), and no live code recreates these IDs.
 */
export const deleteLegacyAndroidAudioChannels = async () => {
  if (Platform.OS !== 'android') return;

  const legacyAthanIds = Array.from({ length: 16 }, (_, i) => `athan_${i + 1}`);
  const legacyChannelIds = ['reminder', ...legacyAthanIds];
  const promises = legacyChannelIds.map((channelId) =>
    Notifications.deleteNotificationChannelAsync(channelId).catch(() => undefined)
  );
  await Promise.all(promises);
};

/**
 * Initializes notifications
 * Uses dependency injection to avoid circular import with stores/notifications.ts
 *
 * @param checkPermissions Function to check notification permissions
 * @param refreshFn Function to refresh notifications (injected to break cycle)
 * @param registerBackgroundTaskFn Optional function to register background task (injected to break cycle)
 */
export const initializeNotifications = async (
  checkPermissions: () => Promise<boolean>,
  refreshFn: () => Promise<void>,
  registerBackgroundTaskFn?: () => Promise<void>
) => {
  try {
    await deleteLegacyAndroidAudioChannels();
    await createDefaultAndroidChannel();
    await createExtrasAndroidChannel();

    const hasPermission = await checkPermissions();
    if (hasPermission) {
      await refreshFn();

      // Register background task for notification refresh when app is closed
      if (registerBackgroundTaskFn) {
        await registerBackgroundTaskFn();
      }
    } else {
      logger.info('NOTIFICATION: Notifications disabled, skipping refresh and background task registration');
    }
  } catch (error) {
    logger.error('NOTIFICATION: Failed to initialize notifications:', error);
  }
};
