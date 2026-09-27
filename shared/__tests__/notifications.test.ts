import { formatInTimeZone } from 'date-fns-tz';
import {
  AndroidAudioUsage,
  AndroidImportance,
  deleteNotificationChannelAsync,
  setNotificationChannelAsync,
} from 'expo-notifications';
import { Platform } from 'react-native';

import { london, saveLondonDays } from '@/hooks/__tests__/londonDays';

import { PRAYER_TIMEZONE } from '../constants';
import {
  ALARM_AUDIO_ATTRIBUTES,
  athanAndroidChannelId,
  atTimeAndroidChannelId,
  buildSchedulePlan,
  type CandidateRow,
  collectCandidateRows,
  createAthanAndroidChannel,
  createDefaultAndroidChannel,
  createExtrasAndroidChannel,
  createReminderAndroidChannel,
  deleteLegacyAndroidAudioChannels,
  EXTRAS_NOTIFICATION_SOUND,
  extrasAndroidChannelId,
  findStaleScheduledNotificationIds,
  genNextXDays,
  genNotificationContent,
  genReminderNotificationContent,
  genScheduleDatesForPrayer,
  getNotificationSound,
  getReminderNotificationSound,
  initializeNotifications,
  reminderAndroidChannelId,
  type ScheduledNotification,
} from '../notifications';
import { AlertType, ScheduleType } from '../types';

/**
 * Today's date in the prayer timezone, from date-fns-tz rather than the app's own helper,
 * so this stays an independent oracle. Keyed off PRAYER_TIMEZONE so that moving the app off
 * London fails the app's code rather than this fixture.
 */
const prayerZoneDate = (offsetMs = 0) => formatInTimeZone(Date.now() + offsetMs, PRAYER_TIMEZONE, 'yyyy-MM-dd');

// =============================================================================
// genNextXDays TESTS
// =============================================================================

describe('genNextXDays', () => {
  it('generates correct number of days', () => {
    const days = genNextXDays(3);
    expect(days).toHaveLength(3);
  });

  it('generates 1 day (just today)', () => {
    const days = genNextXDays(1);
    expect(days).toHaveLength(1);
  });

  it('generates 7 days', () => {
    const days = genNextXDays(7);
    expect(days).toHaveLength(7);
  });

  it('returns dates in YYYY-MM-DD format', () => {
    const days = genNextXDays(1);
    expect(days[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('starts from today', () => {
    const days = genNextXDays(1);
    expect(days[0]).toBe(prayerZoneDate());
  });

  it('starts from a given start date when one is given', () => {
    const days = genNextXDays(3, '2026-08-28');

    expect(days).toEqual(['2026-08-28', '2026-08-29', '2026-08-30']);
  });

  it('generates consecutive days', () => {
    const days = genNextXDays(3);
    const date0 = new Date(days[0]);
    const date1 = new Date(days[1]);
    const date2 = new Date(days[2]);

    // Each subsequent day should be 1 day after the previous
    expect(date1.getTime() - date0.getTime()).toBe(24 * 60 * 60 * 1000);
    expect(date2.getTime() - date1.getTime()).toBe(24 * 60 * 60 * 1000);
  });
});

// =============================================================================
// PER-PRAYER ROLLING WINDOW TESTS
//
// Rows are armed in time order, each one whole, until the next will not fit in the iOS
// request budget. A day count no longer decides anything: a night row is simply a row
// whose instant falls where it falls, and Istijaba is absent from the list on six days
// in seven rather than being a special case.
// =============================================================================

/** One candidate row, named the way buildSchedulePlan takes them */
const candidate = (englishName: string, date: string, isoInstant: string, requestCost: number): CandidateRow => ({
  scheduleType: ScheduleType.Standard,
  englishName,
  date,
  instant: new Date(isoInstant),
  requestCost,
});

describe('buildSchedulePlan', () => {
  it('arms whole rows in time order until the budget is full', () => {
    const rows = [
      candidate('Fajr', '2026-09-11', '2026-09-11T03:54:00.000Z', 3),
      candidate('Dhuhr', '2026-09-11', '2026-09-11T12:02:00.000Z', 3),
      candidate('Fajr', '2026-09-12', '2026-09-12T03:56:00.000Z', 3),
    ];

    const plan = buildSchedulePlan(rows, 6);

    // The budget holds the first two rows; the third is beyond it
    expect(plan.get('standard_Fajr')).toEqual(['2026-09-11']);
    expect(plan.get('standard_Dhuhr')).toEqual(['2026-09-11']);
  });

  it('never arms a row in part, so a row too big for the remaining budget is left whole', () => {
    const rows = [
      candidate('Fajr', '2026-09-11', '2026-09-11T03:54:00.000Z', 3),
      candidate('Dhuhr', '2026-09-11', '2026-09-11T12:02:00.000Z', 3),
    ];

    // Room for the first row and one request of the second: the second must not be armed at all
    const plan = buildSchedulePlan(rows, 4);

    expect(plan.get('standard_Fajr')).toEqual(['2026-09-11']);
    expect(plan.has('standard_Dhuhr')).toBe(false);
  });

  it('stops at the first row that does not fit rather than skipping it for a cheaper one', () => {
    const rows = [
      candidate('Fajr', '2026-09-11', '2026-09-11T03:54:00.000Z', 3),
      candidate('Dhuhr', '2026-09-11', '2026-09-11T12:02:00.000Z', 3),
      candidate('Duha', '2026-09-11', '2026-09-11T13:00:00.000Z', 1),
    ];

    // Skipping Dhuhr would leave a gap mid-span, making "covered until X" untrue
    const plan = buildSchedulePlan(rows, 4);

    expect(plan.has('standard_Duha')).toBe(false);
  });

  it('reads the rows in time order whatever order they arrive in', () => {
    const rows = [
      candidate('Dhuhr', '2026-09-11', '2026-09-11T12:02:00.000Z', 3),
      candidate('Fajr', '2026-09-11', '2026-09-11T03:54:00.000Z', 3),
    ];

    const plan = buildSchedulePlan(rows, 3);

    // Fajr is earlier, so it is the row the budget buys
    expect(plan.get('standard_Fajr')).toEqual(['2026-09-11']);
    expect(plan.has('standard_Dhuhr')).toBe(false);
  });

  it('gathers every armed day of one prayer under that prayer', () => {
    const rows = [
      candidate('Fajr', '2026-09-11', '2026-09-11T03:54:00.000Z', 1),
      candidate('Fajr', '2026-09-12', '2026-09-12T03:56:00.000Z', 1),
      candidate('Fajr', '2026-09-13', '2026-09-13T03:58:00.000Z', 1),
    ];

    const plan = buildSchedulePlan(rows, 64);

    expect(plan.get('standard_Fajr')).toEqual(['2026-09-11', '2026-09-12', '2026-09-13']);
  });

  it('keeps the two schedules apart, so a shared name cannot merge them', () => {
    const rows = [
      candidate('Fajr', '2026-09-11', '2026-09-11T03:54:00.000Z', 1),
      { ...candidate('Fajr', '2026-09-11', '2026-09-11T03:54:00.000Z', 1), scheduleType: ScheduleType.Extra },
    ];

    const plan = buildSchedulePlan(rows, 64);

    expect(plan.get('standard_Fajr')).toEqual(['2026-09-11']);
    expect(plan.get('extra_Fajr')).toEqual(['2026-09-11']);
  });

  it('arms nothing when the budget cannot hold even the first row', () => {
    const rows = [candidate('Fajr', '2026-09-11', '2026-09-11T03:54:00.000Z', 3)];

    expect(buildSchedulePlan(rows, 2).size).toBe(0);
  });
});

describe('genScheduleDatesForPrayer, on the stored London days from 10 to 12 September 2026', () => {
  /** Every prayer armed at-time with both reminders: the worst case the budget must hold */
  const fullyArmed = () => 3;
  const onlyFajr = (_scheduleType: ScheduleType, englishName: string) => (englishName === 'Fajr' ? 1 : 0);

  beforeEach(() => {
    jest.useFakeTimers({ now: london('2026-09-10', '12:00') });
    saveLondonDays();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts a prayer on the first list day whose row can still fire', () => {
    const isha = genScheduleDatesForPrayer(ScheduleType.Standard, 'Isha', fullyArmed);

    expect(isha[0]).toBe('2026-09-10');
  });

  it('gives a prayer nothing while its bell is off, so an unarmed row costs no budget', () => {
    expect(genScheduleDatesForPrayer(ScheduleType.Standard, 'Isha', onlyFajr)).toEqual([]);
  });

  it('arms every stored day of the one prayer a light user switched on', () => {
    // Fajr on the 10th has passed at 12:00, so the 11th and 12th are what remain
    expect(genScheduleDatesForPrayer(ScheduleType.Standard, 'Fajr', onlyFajr)).toEqual(['2026-09-11', '2026-09-12']);
  });

  it('stops at the end of the stored days rather than inventing more', () => {
    const fajr = genScheduleDatesForPrayer(ScheduleType.Standard, 'Fajr', onlyFajr);

    expect(fajr.every((date) => date <= '2026-09-12')).toBe(true);
  });

  it('leaves out a day whose time the provider did not give, so no alert can fire for it', () => {
    // The 11th's Fajr came through unreadably; the 12th's did not (R5). Its row still exists, with
    // a null datetime, so the plan must drop it rather than carry a candidate with no instant.
    saveLondonDays({ '2026-09-11': ['fajr'] });

    const days = genScheduleDatesForPrayer(ScheduleType.Standard, 'Fajr', onlyFajr);

    expect(days).toEqual(['2026-09-12']);
    expect(days).not.toContain('2026-09-11');
  });

  it('never plans a row whose instant is missing, whatever order the walk reached it in', () => {
    saveLondonDays({ '2026-09-11': ['fajr'] });

    const rows = collectCandidateRows((_scheduleType, englishName) => (englishName === 'Fajr' ? 1 : 0));

    expect(rows.every((row) => row.instant instanceof Date)).toBe(true);
    expect(rows.map((row) => row.date)).not.toContain('2026-09-11');
  });
});

// =============================================================================
// getNotificationSound TESTS
// =============================================================================

describe('getNotificationSound', () => {
  it('returns false for non-Sound alert types', () => {
    expect(getNotificationSound(AlertType.Off, 'Fajr', 0)).toBe(false);
    expect(getNotificationSound(AlertType.Silent, 'Fajr', 0)).toBe(false);
    expect(getNotificationSound(AlertType.Off, 'Sunrise', 0)).toBe(false);
    expect(getNotificationSound(AlertType.Silent, 'Last Third', 0)).toBe(false);
  });

  it('returns the selected athan for the 5 daily prayers', () => {
    expect(getNotificationSound(AlertType.Sound, 'Fajr', 0)).toBe('athan1.mp3');
    expect(getNotificationSound(AlertType.Sound, 'Dhuhr', 1)).toBe('athan2.mp3');
    expect(getNotificationSound(AlertType.Sound, 'Asr', 2)).toBe('athan3.mp3');
    expect(getNotificationSound(AlertType.Sound, 'Magrib', 15)).toBe('athan16.mp3');
    expect(getNotificationSound(AlertType.Sound, 'Isha', 31)).toBe('athan32.mp3');
  });

  it('returns the fixed extras sound for Sunrise + all extras regardless of the selected athan (ISSUES #23 boundary)', () => {
    expect(getNotificationSound(AlertType.Sound, 'Sunrise', 0)).toBe(EXTRAS_NOTIFICATION_SOUND);
    expect(getNotificationSound(AlertType.Sound, 'Midnight', 7)).toBe(EXTRAS_NOTIFICATION_SOUND);
    expect(getNotificationSound(AlertType.Sound, 'Last Third', 7)).toBe(EXTRAS_NOTIFICATION_SOUND);
    expect(getNotificationSound(AlertType.Sound, 'Suhoor', 7)).toBe(EXTRAS_NOTIFICATION_SOUND);
    expect(getNotificationSound(AlertType.Sound, 'Duha', 7)).toBe(EXTRAS_NOTIFICATION_SOUND);
    expect(getNotificationSound(AlertType.Sound, 'Istijaba', 31)).toBe(EXTRAS_NOTIFICATION_SOUND);
  });

  it('is case-insensitive on the prayer name', () => {
    expect(getNotificationSound(AlertType.Sound, 'magrib', 0)).toBe('athan1.mp3');
    expect(getNotificationSound(AlertType.Sound, 'sunrise', 0)).toBe(EXTRAS_NOTIFICATION_SOUND);
  });
});

// =============================================================================
// genNotificationContent TESTS
// =============================================================================

describe('genNotificationContent', () => {
  it('creates content with correct English-only title', () => {
    const content = genNotificationContent('Fajr', 'الفجر', AlertType.Sound, 0);
    expect(content.title).toBe('Fajr now');
    expect(content.body).toBeUndefined();
  });

  it('includes sound for Sound alert type', () => {
    const content = genNotificationContent('Fajr', 'الفجر', AlertType.Sound, 0);
    expect(content.sound).toBe('athan1.mp3');
  });

  it('uses the fixed extras sound for Sunrise + extras at-time content', () => {
    const sunrise = genNotificationContent('Sunrise', 'الشروق', AlertType.Sound, 4);
    const lastThird = genNotificationContent('Last Third', 'آخر ثلث', AlertType.Sound, 4);
    expect(sunrise.title).toBe('Sunrise now');
    expect(sunrise.sound).toBe(EXTRAS_NOTIFICATION_SOUND);
    expect(lastThird.sound).toBe(EXTRAS_NOTIFICATION_SOUND);
  });

  it('returns false for sound on Silent alert type', () => {
    const content = genNotificationContent('Fajr', 'الفجر', AlertType.Silent, 0);
    expect(content.sound).toBe(false);
  });

  it('returns false for sound on Off alert type', () => {
    const content = genNotificationContent('Fajr', 'الفجر', AlertType.Off, 0);
    expect(content.sound).toBe(false);
  });
});

// =============================================================================
// genNextXDays BOUNDARY TESTS
// =============================================================================

describe('genNextXDays boundary cases', () => {
  it('handles month boundary crossing', () => {
    const days = genNextXDays(35);
    expect(days).toHaveLength(35);

    days.forEach((day) => {
      expect(day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('all generated dates are valid', () => {
    const days = genNextXDays(40);
    expect(days).toHaveLength(40);

    days.forEach((day) => {
      const date = new Date(day);
      expect(date).toBeInstanceOf(Date);
      expect(Number.isNaN(date.getTime())).toBe(false);
    });
  });
});

// =============================================================================
// createDefaultAndroidChannel TESTS
// =============================================================================

describe('createDefaultAndroidChannel', () => {
  it('does not throw on iOS (returns early)', async () => {
    // Default mock has Platform.OS = 'ios'
    await expect(createDefaultAndroidChannel()).resolves.toBeUndefined();
  });

  describe('on Android', () => {
    beforeEach(() => {
      Platform.OS = 'android';
      (setNotificationChannelAsync as jest.Mock).mockClear();
    });

    afterEach(() => {
      Platform.OS = 'ios';
    });

    it('creates the athan_1_v4 channel on the alarm stream with the mp3 sound', async () => {
      await createDefaultAndroidChannel();

      expect(setNotificationChannelAsync).toHaveBeenCalledTimes(1);
      expect(setNotificationChannelAsync).toHaveBeenCalledWith(
        'athan_1_v4',
        expect.objectContaining({
          name: 'Athan 1',
          sound: 'athan1.mp3',
          importance: AndroidImportance.HIGH,
          enableVibrate: true,
          vibrationPattern: [0, 250, 250, 250],
          bypassDnd: true,
          audioAttributes: {
            usage: AndroidAudioUsage.ALARM,
            flags: { enforceAudibility: true, requestHardwareAudioVideoSynchronization: false },
          },
        })
      );
    });
  });
});

// =============================================================================
// ANDROID CHANNEL ID HELPERS TESTS
// =============================================================================

describe('athanAndroidChannelId', () => {
  it('builds _v4-suffixed channel IDs', () => {
    expect(athanAndroidChannelId(0)).toBe('athan_1_v4');
    expect(athanAndroidChannelId(31)).toBe('athan_32_v4');
  });
});

describe('reminderAndroidChannelId', () => {
  it('builds _v3-suffixed per-prayer × interval channel IDs', () => {
    expect(reminderAndroidChannelId('Fajr', 5)).toBe('reminder_fajr_5_v3');
    expect(reminderAndroidChannelId('Istijaba', 30)).toBe('reminder_istijaba_30_v3');
  });

  it('slugs multi-word prayer names to filename-safe underscores', () => {
    expect(reminderAndroidChannelId('Last Third', 15)).toBe('reminder_last_third_15_v3');
  });
});

describe('atTimeAndroidChannelId', () => {
  it('routes the 5 daily prayers to the selected athan channel', () => {
    expect(atTimeAndroidChannelId('Fajr', 0)).toBe('athan_1_v4');
    expect(atTimeAndroidChannelId('Isha', 31)).toBe('athan_32_v4');
  });

  it('routes Sunrise + all extras to the fixed extras channel', () => {
    expect(atTimeAndroidChannelId('Sunrise', 7)).toBe(extrasAndroidChannelId);
    expect(atTimeAndroidChannelId('Midnight', 7)).toBe(extrasAndroidChannelId);
    expect(atTimeAndroidChannelId('Last Third', 7)).toBe(extrasAndroidChannelId);
    expect(atTimeAndroidChannelId('Suhoor', 7)).toBe(extrasAndroidChannelId);
    expect(atTimeAndroidChannelId('Duha', 7)).toBe(extrasAndroidChannelId);
    expect(atTimeAndroidChannelId('Istijaba', 7)).toBe(extrasAndroidChannelId);
  });
});

describe('ALARM_AUDIO_ATTRIBUTES', () => {
  it('asks for the alarm stream, which the ringer silent switch never mutes', () => {
    // STREAM_ALARM is absent from the ringer-affected mask (0x1a6) that mutes STREAM_NOTIFICATION
    expect(ALARM_AUDIO_ATTRIBUTES.usage).toBe(AndroidAudioUsage.ALARM);
    expect(ALARM_AUDIO_ATTRIBUTES.usage).not.toBe(AndroidAudioUsage.NOTIFICATION);
  });

  it('enforces audibility so a skin muting the stream still sounds', () => {
    expect(ALARM_AUDIO_ATTRIBUTES.flags.enforceAudibility).toBe(true);
  });
});

describe('every channel this app creates plays on the alarm stream', () => {
  beforeEach(() => {
    Platform.OS = 'android';
    (setNotificationChannelAsync as jest.Mock).mockClear();
  });

  afterEach(() => {
    Platform.OS = 'ios';
  });

  // A channel created on the notification stream is muted by the silent switch for good:
  // Android freezes a channel's audio attributes at creation.
  // Each case uses an index this file creates nowhere else, because creation dedups per process.
  it.each([
    ['default athan', () => createDefaultAndroidChannel()],
    ['selected athan', () => createAthanAndroidChannel(11)],
    ['reminder', () => createReminderAndroidChannel('Isha', 20)],
  ])('%s', async (_label, create) => {
    await create();

    const [, config] = (setNotificationChannelAsync as jest.Mock).mock.calls[0];
    expect(config.audioAttributes).toEqual(ALARM_AUDIO_ATTRIBUTES);

    // IMPORTANCE_MAX (5) is deprecated and not a valid channel importance: OxygenOS left a
    // channel created with it with no behaviour selected at all, so it played nothing and
    // did not even vibrate. HIGH is the loudest importance a channel may actually carry.
    expect(config.importance).toBe(AndroidImportance.HIGH);
    expect(config.importance).not.toBe(AndroidImportance.MAX);
  });
});

describe('createExtrasAndroidChannel', () => {
  it('does not throw on iOS (returns early)', async () => {
    await expect(createExtrasAndroidChannel()).resolves.toBeUndefined();
  });

  describe('on Android', () => {
    beforeEach(() => {
      Platform.OS = 'android';
      (setNotificationChannelAsync as jest.Mock).mockClear();
    });

    afterEach(() => {
      Platform.OS = 'ios';
    });

    it('creates the channel once per process with the fixed sound and at-time settings', async () => {
      await createExtrasAndroidChannel();
      await createExtrasAndroidChannel();

      expect(setNotificationChannelAsync).toHaveBeenCalledTimes(1);
      expect(setNotificationChannelAsync).toHaveBeenCalledWith(
        extrasAndroidChannelId,
        expect.objectContaining({
          name: 'Extra Times',
          sound: EXTRAS_NOTIFICATION_SOUND,
          importance: AndroidImportance.HIGH,
          enableVibrate: true,
          vibrationPattern: [0, 250, 250, 250],
          bypassDnd: true,
          audioAttributes: ALARM_AUDIO_ATTRIBUTES,
        })
      );
    });
  });
});

describe('createAthanAndroidChannel', () => {
  it('does not throw on iOS (returns early)', async () => {
    await expect(createAthanAndroidChannel(3)).resolves.toBeUndefined();
  });

  describe('on Android', () => {
    beforeEach(() => {
      Platform.OS = 'android';
      (setNotificationChannelAsync as jest.Mock).mockClear();
    });

    afterEach(() => {
      Platform.OS = 'ios';
    });

    it('creates the selected athan channel with the same settings createDefaultAndroidChannel uses', async () => {
      await createAthanAndroidChannel(4);
      await createAthanAndroidChannel(4);

      expect(setNotificationChannelAsync).toHaveBeenCalledTimes(1);
      expect(setNotificationChannelAsync).toHaveBeenCalledWith(
        'athan_5_v4',
        expect.objectContaining({
          name: 'Athan 5',
          sound: 'athan5.mp3',
          importance: AndroidImportance.HIGH,
          enableVibrate: true,
          vibrationPattern: [0, 250, 250, 250],
          bypassDnd: true,
          audioAttributes: {
            usage: AndroidAudioUsage.ALARM,
            flags: { enforceAudibility: true, requestHardwareAudioVideoSynchronization: false },
          },
        })
      );
    });

    it('dedups per channel ID, not globally — a second sound index still gets its channel', async () => {
      await createAthanAndroidChannel(9);

      const createdIds = (setNotificationChannelAsync as jest.Mock).mock.calls.map((call) => call[0] as string);
      expect(createdIds).toEqual(['athan_10_v4']);
    });
  });
});

describe('deleteLegacyAndroidAudioChannels', () => {
  it('does not throw on iOS (returns early)', async () => {
    await expect(deleteLegacyAndroidAudioChannels()).resolves.toBeUndefined();
  });

  describe('on Android', () => {
    beforeEach(() => {
      Platform.OS = 'android';
      (deleteNotificationChannelAsync as jest.Mock).mockClear();
    });

    afterEach(() => {
      Platform.OS = 'ios';
    });

    it('deletes every superseded generation: the wav channels and the notification-stream ones', async () => {
      await deleteLegacyAndroidAudioChannels();

      const deletedIds = (deleteNotificationChannelAsync as jest.Mock).mock.calls.map((call) => call[0] as string);
      const wavGeneration = ['reminder', ...Array.from({ length: 16 }, (_, i) => `athan_${i + 1}`)];
      const notificationStreamGeneration = [
        'extras_at_time',
        ...Array.from({ length: 32 }, (_, i) => `athan_${i + 1}_v2`),
        'reminder_fajr_5',
        'reminder_last_third_15',
        'reminder_istijaba_30',
      ];
      const importanceMaxGeneration = [
        'extras_at_time_v2',
        ...Array.from({ length: 32 }, (_, i) => `athan_${i + 1}_v3`),
        'reminder_fajr_5_v2',
        'reminder_istijaba_30_v2',
      ];

      for (const id of [...wavGeneration, ...notificationStreamGeneration, ...importanceMaxGeneration]) {
        expect(deletedIds).toContain(id);
      }

      // 11 prayers × 6 intervals × 2 reminder generations, 32 athans × 3, and the 3 fixed ids
      expect(deletedIds).toHaveLength(231);
      expect(new Set(deletedIds).size).toBe(deletedIds.length);
      expect(deletedIds).not.toContain(athanAndroidChannelId(0));
      expect(deletedIds).not.toContain(extrasAndroidChannelId);
      expect(deletedIds).not.toContain(reminderAndroidChannelId('Fajr', 5));
    });
  });
});

// =============================================================================
// initializeNotifications TESTS
// =============================================================================

describe('initializeNotifications', () => {
  it('calls refreshFn when permissions are granted', async () => {
    const checkPermissions = jest.fn().mockResolvedValue(true);
    const refreshFn = jest.fn().mockResolvedValue(undefined);

    await initializeNotifications(checkPermissions, refreshFn);

    expect(checkPermissions).toHaveBeenCalledTimes(1);
    expect(refreshFn).toHaveBeenCalledTimes(1);
  });

  it('does not call refreshFn when permissions are denied', async () => {
    const checkPermissions = jest.fn().mockResolvedValue(false);
    const refreshFn = jest.fn().mockResolvedValue(undefined);

    await initializeNotifications(checkPermissions, refreshFn);

    expect(checkPermissions).toHaveBeenCalledTimes(1);
    expect(refreshFn).not.toHaveBeenCalled();
  });

  it('handles errors gracefully', async () => {
    const checkPermissions = jest.fn().mockRejectedValue(new Error('Permission check failed'));
    const refreshFn = jest.fn().mockResolvedValue(undefined);

    // Should not throw
    await expect(initializeNotifications(checkPermissions, refreshFn)).resolves.toBeUndefined();
    expect(refreshFn).not.toHaveBeenCalled();
  });
});

// =============================================================================
// REMINDER NOTIFICATION TESTS
// =============================================================================

describe('getReminderNotificationSound', () => {
  it('returns false for Off alert type', () => {
    expect(getReminderNotificationSound(AlertType.Off, 'Fajr', 15)).toBe(false);
  });

  it('returns false for Silent alert type', () => {
    expect(getReminderNotificationSound(AlertType.Silent, 'Fajr', 15)).toBe(false);
  });

  it('returns the prayer × interval audio file for Sound alert type', () => {
    expect(getReminderNotificationSound(AlertType.Sound, 'Fajr', 5)).toBe('reminder_fajr_5.mp3');
    expect(getReminderNotificationSound(AlertType.Sound, 'Isha', 30)).toBe('reminder_isha_30.mp3');
  });

  it('slugs multi-word prayer names to filename-safe underscores', () => {
    expect(getReminderNotificationSound(AlertType.Sound, 'Last Third', 15)).toBe('reminder_last_third_15.mp3');
  });
});

describe('genReminderNotificationContent', () => {
  it('creates content with correct title format', () => {
    const content = genReminderNotificationContent('Fajr', 'الفجر', 15, AlertType.Sound);
    expect(content.title).toBe('Fajr in 15m');
    expect(content.body).toBeUndefined();
  });

  it('creates content with different intervals', () => {
    expect(genReminderNotificationContent('Dhuhr', 'الظهر', 5, AlertType.Sound).title).toBe('Dhuhr in 5m');
    expect(genReminderNotificationContent('Asr', 'العصر', 30, AlertType.Sound).title).toBe('Asr in 30m');
  });

  it('includes sound for Sound alert type', () => {
    const content = genReminderNotificationContent('Fajr', 'الفجر', 15, AlertType.Sound);
    expect(content.sound).toBe('reminder_fajr_15.mp3');
  });

  it('returns false for sound on Silent alert type', () => {
    const content = genReminderNotificationContent('Fajr', 'الفجر', 15, AlertType.Silent);
    expect(content.sound).toBe(false);
  });

  it('sets autoDismiss to true', () => {
    const content = genReminderNotificationContent('Fajr', 'الفجر', 15, AlertType.Sound);
    expect(content.autoDismiss).toBe(true);
  });
});

describe('createReminderAndroidChannel', () => {
  it('does not throw on iOS (returns early)', async () => {
    // Default mock has Platform.OS = 'ios'
    await expect(createReminderAndroidChannel('Fajr', 15)).resolves.toBeUndefined();
  });

  describe('on Android', () => {
    beforeEach(() => {
      Platform.OS = 'android';
      (setNotificationChannelAsync as jest.Mock).mockClear();
    });

    afterEach(() => {
      Platform.OS = 'ios';
    });

    it('creates the per-prayer × interval channel on the alarm stream with the matching mp3 sound', async () => {
      await createReminderAndroidChannel('Fajr', 15);

      expect(setNotificationChannelAsync).toHaveBeenCalledTimes(1);
      expect(setNotificationChannelAsync).toHaveBeenCalledWith(
        'reminder_fajr_15_v3',
        expect.objectContaining({
          name: 'Fajr in 15m Reminder',
          sound: 'reminder_fajr_15.mp3',
          importance: AndroidImportance.HIGH,
          enableVibrate: true,
          vibrationPattern: [0, 250, 250, 250],
          bypassDnd: true,
          audioAttributes: {
            usage: AndroidAudioUsage.ALARM,
            flags: { enforceAudibility: true, requestHardwareAudioVideoSynchronization: false },
          },
        })
      );
    });

    it('slugs multi-word prayer names into the channel id and sound file', async () => {
      await createReminderAndroidChannel('Last Third', 5);

      expect(setNotificationChannelAsync).toHaveBeenCalledWith(
        'reminder_last_third_5_v3',
        expect.objectContaining({ sound: 'reminder_last_third_5.mp3' })
      );
    });

    it('creates a channel once per prayer × interval across repeated calls (reschedule cycles)', async () => {
      await createReminderAndroidChannel('Suhoor', 10);
      await createReminderAndroidChannel('Suhoor', 10);

      expect(setNotificationChannelAsync).toHaveBeenCalledTimes(1);
    });
  });
});

// =============================================================================
// findStaleScheduledNotificationIds TESTS
// =============================================================================

describe('findStaleScheduledNotificationIds', () => {
  const record = (id: string): ScheduledNotification => ({
    id,
    date: '2026-08-29',
    time: '06:00',
    englishName: 'Fajr',
    arabicName: 'الفجر',
    alertType: AlertType.Silent,
  });

  it('returns empty when the OS matches the records exactly', () => {
    const osIds = ['athan_standard_fajr_2026-08-29', 'athan_standard_isha_2026-08-30'];
    const records = [record('athan_standard_fajr_2026-08-29'), record('athan_standard_isha_2026-08-30')];

    expect(findStaleScheduledNotificationIds(osIds, records)).toEqual([]);
  });

  it('returns OS identifiers that have no record (orphans)', () => {
    const osIds = ['athan_standard_fajr_2026-08-29', 'legacy-uuid-orphan'];
    const records = [record('athan_standard_fajr_2026-08-29')];

    expect(findStaleScheduledNotificationIds(osIds, records)).toEqual(['legacy-uuid-orphan']);
  });

  it('returns every OS identifier when records are empty (post-upgrade wipe)', () => {
    const osIds = ['athan_standard_fajr_2026-08-29', 'athan_extra_duha_2026-08-29'];

    expect(findStaleScheduledNotificationIds(osIds, [])).toEqual(osIds);
  });

  it('returns empty when the OS holds nothing', () => {
    const records = [record('athan_standard_fajr_2026-08-29')];

    expect(findStaleScheduledNotificationIds([], records)).toEqual([]);
  });

  it('does NOT report records without an OS entry (already-fired prayers)', () => {
    // One-directional diff: a fired notification is gone from the OS — it is
    // not stale, and must never be "cancelled" or counted as a problem.
    const osIds = ['athan_standard_isha_2026-08-29'];
    const records = [record('athan_standard_isha_2026-08-29'), record('athan_standard_fajr_2026-08-29')];

    expect(findStaleScheduledNotificationIds(osIds, records)).toEqual([]);
  });

  it('preserves the OS order of the stale identifiers', () => {
    const osIds = ['stale-b', 'kept', 'stale-a', 'stale-c'];
    const records = [record('kept')];

    expect(findStaleScheduledNotificationIds(osIds, records)).toEqual(['stale-b', 'stale-a', 'stale-c']);
  });

  it('handles duplicate records for the same identifier', () => {
    const osIds = ['kept', 'stale'];
    const records = [record('kept'), record('kept')];

    expect(findStaleScheduledNotificationIds(osIds, records)).toEqual(['stale']);
  });

  it('returns empty for empty inputs', () => {
    expect(findStaleScheduledNotificationIds([], [])).toEqual([]);
  });
});
