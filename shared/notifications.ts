import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  EXTRAS_ENGLISH,
  NOTIFICATION_REQUEST_BUDGET,
  PRAYERS_ENGLISH,
  REMINDER_INTERVALS,
  SCHEDULE_CANDIDATE_DAYS,
} from '@/shared/constants';
import logger from '@/shared/logger';
import * as PrayerUtils from '@/shared/prayer';
import { isReadable } from '@/shared/sequence';
import * as TimeUtils from '@/shared/time';
import { AlertType, type ReminderInterval, ScheduleType } from '@/shared/types';

export interface ScheduledNotification {
  id: string;
  date: string;
  time: string;
  englishName: string;
  arabicName: string;
  alertType: AlertType;
}

/**
 * How long one call into the notification system may take before it is treated as refused.
 *
 * Owner, 2026-09-16. A healthy phone answers in milliseconds, so this can only be reached by a call that is never
 * coming back.
 */
const NATIVE_CALL_TIMEOUT_MS = 15_000;

/** Set when a call runs out of time, and read once by the scheduling lock; see takeNativeCallTimedOut */
let nativeCallTimedOut = false;

/**
 * Whether a call has run out of time since this was last asked, and forgets it.
 *
 * A call given up on can still land afterwards and arm an alarm this app has no record of. Only the post-reschedule
 * sweep can find one of those, so the scheduling lock uses this to reopen the refresh gate, which puts a full
 * reschedule and its sweep on the next foreground.
 */
export const takeNativeCallTimedOut = (): boolean => {
  const timedOut = nativeCallTimedOut;
  nativeCallTimedOut = false;
  return timedOut;
};

/**
 * Rejects when a call into the notification system does not answer.
 *
 * expo-notifications' Android service answers through a ResultReceiver that is sent only from its catch of
 * `Exception`, so an `Error` on the worker thread, or a receiver that has gone, leaves the promise pending for ever.
 * The scheduling queue waits for every piece of work it started (finding 82), so one such call would otherwise stop
 * the app arming or cancelling anything for the rest of the process, with the bell already showing what the user
 * picked.
 *
 * @param work The call into the notification system, already started
 * @param description What that call was doing, for the rejection its caller logs
 * @returns What the call resolved with, when it answered in time
 */
export const withNativeTimeout = async <T>(work: Promise<T>, description: string): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      nativeCallTimedOut = true;
      reject(new Error(`NOTIFICATION SYSTEM: ${description} did not answer in ${NATIVE_CALL_TIMEOUT_MS} ms`));
    }, NATIVE_CALL_TIMEOUT_MS);
  });

  try {
    // Promise.race attaches a handler to both, so the loser settling later is never an unhandled rejection
    return await Promise.race([work, timeout]);
  } finally {
    clearTimeout(timer);
  }
};

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
 * The Android delivery class every trigger this app schedules asks for. Alarm-clock alarms are
 * never deferred by OEM battery policy (ISSUES #17), which is why every at-time alert and every
 * reminder carries it, silent ones included.
 */
export const ALARM_CLOCK_DELIVERY: Notifications.NotificationDelivery = 'alarmClock';

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
export const genNextXDays = (numberOfDays: number, startDate?: string): string[] => {
  const first = startDate ?? TimeUtils.getTodayDateString();

  return Array.from({ length: numberOfDays }, (_, i) => TimeUtils.addDaysToDateString(first, i));
};

/** One prayer's row on one list day, and what arming it costs against the budget */
export interface CandidateRow {
  scheduleType: ScheduleType;
  englishName: string;
  date: string;
  instant: Date;
  /** The at-time alert plus one per reminder slot that is on for this prayer */
  requestCost: number;
}

/**
 * What one prayer's alerts cost against the budget, 0 when the user has it switched off.
 *
 * Passed in rather than read here: the preferences live in the store, which imports this
 * module, so reading them here would close an import cycle.
 */
export type RequestCostReader = (scheduleType: ScheduleType, englishName: string) => number;

/** How a prayer is keyed in a schedule plan, so the two lists cannot merge on a shared name */
export const schedulePlanKey = (scheduleType: ScheduleType, englishName: string): string =>
  `${scheduleType}_${englishName}`;

/**
 * The list days each prayer arms, chosen by request budget rather than by day count.
 *
 * A day is the wrong unit for a prayer schedule: counting days armed rows the user may not
 * need while refusing the one row they did, purely because it sat after midnight. Rows are
 * taken in time order instead, each one WHOLE, because a reminder fires before the athan it
 * warns about, so cutting mid-row would leave the phone warning about an athan it never
 * plays. The walk stops at the first row it cannot afford rather than skipping on to a
 * cheaper one, which would put a gap in the middle of the covered span.
 *
 * @param rows Every candidate row, in any order
 * @param budget The most requests the app may hold at once
 */
export const buildSchedulePlan = (rows: CandidateRow[], budget: number): Map<string, string[]> => {
  const inTimeOrder = [...rows].sort((a, b) => a.instant.getTime() - b.instant.getTime());
  const plan = new Map<string, string[]>();
  let spent = 0;

  for (const row of inTimeOrder) {
    if (spent + row.requestCost > budget) break;
    spent += row.requestCost;

    const key = schedulePlanKey(row.scheduleType, row.englishName);
    const days = plan.get(key) ?? [];
    days.push(row.date);
    plan.set(key, days);
  }

  return plan;
};

/**
 * Every row the app could arm, from each prayer's first still-due list day forward.
 *
 * A row with nothing armed is left out rather than costed at zero, so it cannot take a place
 * in the time order that a row the user does want would otherwise hold.
 *
 * @param requestCostFor What each prayer's alerts cost, 0 when it is switched off
 */
export const collectCandidateRows = (requestCostFor: RequestCostReader): CandidateRow[] => {
  const now = TimeUtils.createInstant();
  const rows: CandidateRow[] = [];

  const collectSchedule = (scheduleType: ScheduleType, names: readonly string[]) => {
    for (const englishName of names) {
      const requestCost = requestCostFor(scheduleType, englishName);
      if (requestCost === 0) continue;

      const firstDay = PrayerUtils.firstStillDueListDayForPrayer(scheduleType, englishName, now);

      for (const date of genNextXDays(SCHEDULE_CANDIDATE_DAYS, firstDay)) {
        const prayer = PrayerUtils.getPrayerForDate(scheduleType, englishName, date);
        if (!prayer) continue;

        // No alert may fire for a time the provider did not give (R5). Tested explicitly rather
        // than left to the past-row check below, which drops it only because `null <= now`
        // coerces to `0 <= now`, and logged because the arming paths never see such a day now.
        if (!isReadable(prayer)) {
          logger.info('Skipping prayer with no readable time:', { date, englishName });
          continue;
        }

        if (prayer.datetime <= now) continue;

        rows.push({ scheduleType, englishName, date, instant: prayer.datetime, requestCost });
      }
    }
  };

  collectSchedule(ScheduleType.Standard, PRAYERS_ENGLISH);
  collectSchedule(ScheduleType.Extra, EXTRAS_ENGLISH);

  return rows;
};

/**
 * Every list day that holds a row the app could still arm, whatever the user switched on.
 *
 * The empty-cache bail asks this rather than counting days: the windows start at each
 * prayer's first still-due day, so a day count gets the night rows and a still-due yesterday
 * wrong in opposite directions.
 */
export const candidateListDays = (): string[] => {
  const everyPrayerCosted = () => 1;
  const dates = collectCandidateRows(everyPrayerCosted).map((row) => row.date);

  return [...new Set(dates)].sort();
};

/**
 * The list days to schedule one prayer on — the single source both schedule paths read, so
 * the at-time and reminder windows cannot drift apart.
 *
 * The whole schedule is planned on every call because one prayer's days depend on what the
 * other ten have already spent, which a per-prayer answer cannot know.
 *
 * @param requestCostFor What each prayer's alerts cost, 0 when it is switched off
 */
export const genScheduleDatesForPrayer = (
  scheduleType: ScheduleType,
  englishName: string,
  requestCostFor: RequestCostReader
): string[] => {
  const plan = buildSchedulePlan(collectCandidateRows(requestCostFor), NOTIFICATION_REQUEST_BUDGET);

  return plan.get(schedulePlanKey(scheduleType, englishName)) ?? [];
};

/**
 * Plays every alert on the alarm stream, which the ringer's silent switch never mutes
 * (STREAM_ALARM is absent from the ringer-affected mask), unlike STREAM_NOTIFICATION.
 * enforceAudibility keeps it audible where a skin mutes the stream anyway.
 */
export const ALARM_AUDIO_ATTRIBUTES = {
  usage: Notifications.AndroidAudioUsage.ALARM,
  flags: { enforceAudibility: true, requestHardwareAudioVideoSynchronization: false },
} as const;

/**
 * Android channel ID for an at-time Athan sound
 * `_v4` because a channel's sound, importance and audio attributes are all immutable once
 * created: the wav→mp3 swap forced `_v2`, alarm-stream audio forced `_v3`, and dropping the
 * deprecated IMPORTANCE_MAX forces this one
 * (legacy channels are deleted by deleteLegacyAndroidAudioChannels)
 */
export const athanAndroidChannelId = (soundIndex: number): string => `athan_${soundIndex + 1}_v4`;

/**
 * Android channel ID for a pre-prayer reminder sound (one channel per prayer × interval audio)
 * `_v3` tracks the athan generations for the same reason: neither the audio attributes nor the
 * importance of an existing channel can be changed in place
 */
export const reminderAndroidChannelId = (englishName: string, intervalMinutes: ReminderInterval): string => {
  const slug = prayerNameSlug(englishName);
  return `reminder_${slug}_${intervalMinutes}_v3`;
};

/**
 * Android channel ID for the fixed at-time Sunrise + extras sound
 * `_v3` tracks the athan and reminder generations, for the same immutability reason
 */
export const extrasAndroidChannelId = 'extras_at_time_v3';

/**
 * Android channel for an at-time notification: the selected athan's channel
 * for the 5 daily prayers, the fixed extras channel for everything else
 */
export const atTimeAndroidChannelId = (englishName: string, soundIndex: number): string =>
  isDailyPrayer(englishName) ? athanAndroidChannelId(soundIndex) : extrasAndroidChannelId;

/**
 * The one definition of an athan channel, shared by every path that may create it first:
 * whichever call wins decides the channel for good, so they must ask for the same thing.
 */
export const athanAndroidChannelConfig = (soundIndex: number) => ({
  name: `Athan ${soundIndex + 1}`,
  sound: `athan${soundIndex + 1}.mp3`,
  importance: Notifications.AndroidImportance.HIGH,
  enableVibrate: true,
  vibrationPattern: [0, 250, 250, 250],
  bypassDnd: true,
  audioAttributes: ALARM_AUDIO_ATTRIBUTES,
});

export const createDefaultAndroidChannel = async () => {
  if (Platform.OS !== 'android') return;

  const channelId = athanAndroidChannelId(0);

  await withNativeTimeout(
    Notifications.setNotificationChannelAsync(channelId, athanAndroidChannelConfig(0)),
    `creating the ${channelId} channel`
  );
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

  await withNativeTimeout(
    Notifications.setNotificationChannelAsync(extrasAndroidChannelId, {
      name: 'Extra Times',
      sound: EXTRAS_NOTIFICATION_SOUND,
      importance: Notifications.AndroidImportance.HIGH,
      enableVibrate: true,
      vibrationPattern: [0, 250, 250, 250],
      bypassDnd: true,
      audioAttributes: ALARM_AUDIO_ATTRIBUTES,
    }),
    `creating the ${extrasAndroidChannelId} channel`
  );

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

  await withNativeTimeout(
    Notifications.setNotificationChannelAsync(channelId, athanAndroidChannelConfig(soundIndex)),
    `creating the ${channelId} channel`
  );

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

  await withNativeTimeout(
    Notifications.setNotificationChannelAsync(channelId, {
      name: `${englishName} in ${intervalMinutes}m Reminder`,
      sound: `reminder_${slug}_${intervalMinutes}.mp3`,
      importance: Notifications.AndroidImportance.HIGH,
      enableVibrate: true,
      vibrationPattern: [0, 250, 250, 250],
      bypassDnd: true,
      audioAttributes: ALARM_AUDIO_ATTRIBUTES,
    }),
    `creating the ${channelId} channel`
  );

  createdReminderChannels.add(channelId);
};

/**
 * Deletes every superseded channel generation: the pre-mp3 `athan_1`…`athan_16` and `reminder`,
 * then the notification-stream `_v2` athans, `extras_at_time` and every prayer × interval reminder.
 * A channel's sound and audio attributes are immutable on Android, so each generation can only be
 * replaced by a new ID; leaving the old ones would show the user dead duplicates in Settings.
 * Safe on every init: deleting an absent channel is a system no-op and no live code recreates these IDs.
 */
export const deleteLegacyAndroidAudioChannels = async () => {
  if (Platform.OS !== 'android') return;

  const everyPrayerName = [...PRAYERS_ENGLISH, ...EXTRAS_ENGLISH];
  const supersededReminderIds = everyPrayerName.flatMap((englishName) =>
    REMINDER_INTERVALS.flatMap((interval) => {
      const base = `reminder_${prayerNameSlug(englishName)}_${interval}`;
      return [base, `${base}_v2`];
    })
  );
  const supersededAthanIds = Array.from({ length: 32 }, (_, i) => [
    `athan_${i + 1}`,
    `athan_${i + 1}_v2`,
    `athan_${i + 1}_v3`,
  ]).flat();
  const legacyChannelIds = [
    'reminder',
    'extras_at_time',
    'extras_at_time_v2',
    ...supersededAthanIds,
    ...supersededReminderIds,
  ];
  const promises = legacyChannelIds.map((channelId) =>
    withNativeTimeout(
      Notifications.deleteNotificationChannelAsync(channelId),
      `deleting the ${channelId} channel`
    ).catch(() => undefined)
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
    // A channel that cannot be created changes how a notification sounds, never whether it fires, so it must not stop
    // the refresh: the launch and the return from the background are two of the three events on which a prayer the
    // phone refused is put right again
    try {
      await deleteLegacyAndroidAudioChannels();
      await createDefaultAndroidChannel();
      await createExtrasAndroidChannel();
    } catch (error) {
      logger.error('NOTIFICATION: Failed to prepare the Android channels, carrying on:', error);
    }

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
