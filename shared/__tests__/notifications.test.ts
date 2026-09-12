import { formatInTimeZone } from 'date-fns-tz';
import { AndroidImportance, deleteNotificationChannelAsync, setNotificationChannelAsync } from 'expo-notifications';
import { Platform } from 'react-native';

import { PRAYER_TIMEZONE } from '../constants';
import {
  athanAndroidChannelId,
  atTimeAndroidChannelId,
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
  getNotificationSound,
  getReminderNotificationSound,
  initializeNotifications,
  reminderAndroidChannelId,
  type ScheduledNotification,
} from '../notifications';
import { AlertType } from '../types';

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

    it('creates the athan_1_v2 channel with the mp3 sound and the original channel settings', async () => {
      await createDefaultAndroidChannel();

      expect(setNotificationChannelAsync).toHaveBeenCalledTimes(1);
      expect(setNotificationChannelAsync).toHaveBeenCalledWith(
        'athan_1_v2',
        expect.objectContaining({
          name: 'Athan 1',
          sound: 'athan1.mp3',
          importance: AndroidImportance.MAX,
          enableVibrate: true,
          vibrationPattern: [0, 250, 250, 250],
          bypassDnd: true,
        })
      );
    });
  });
});

// =============================================================================
// ANDROID CHANNEL ID HELPERS TESTS
// =============================================================================

describe('athanAndroidChannelId', () => {
  it('builds _v2-suffixed channel IDs', () => {
    expect(athanAndroidChannelId(0)).toBe('athan_1_v2');
    expect(athanAndroidChannelId(31)).toBe('athan_32_v2');
  });
});

describe('reminderAndroidChannelId', () => {
  it('builds per-prayer × interval channel IDs', () => {
    expect(reminderAndroidChannelId('Fajr', 5)).toBe('reminder_fajr_5');
    expect(reminderAndroidChannelId('Istijaba', 30)).toBe('reminder_istijaba_30');
  });

  it('slugs multi-word prayer names to filename-safe underscores', () => {
    expect(reminderAndroidChannelId('Last Third', 15)).toBe('reminder_last_third_15');
  });
});

describe('atTimeAndroidChannelId', () => {
  it('routes the 5 daily prayers to the selected athan channel', () => {
    expect(atTimeAndroidChannelId('Fajr', 0)).toBe('athan_1_v2');
    expect(atTimeAndroidChannelId('Isha', 31)).toBe('athan_32_v2');
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
          importance: AndroidImportance.MAX,
          enableVibrate: true,
          vibrationPattern: [0, 250, 250, 250],
          bypassDnd: true,
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
        'athan_5_v2',
        expect.objectContaining({
          name: 'Athan 5',
          sound: 'athan5.mp3',
          importance: AndroidImportance.MAX,
          enableVibrate: true,
          vibrationPattern: [0, 250, 250, 250],
          bypassDnd: true,
        })
      );
    });

    it('dedups per channel ID, not globally — a second sound index still gets its channel', async () => {
      await createAthanAndroidChannel(9);

      const createdIds = (setNotificationChannelAsync as jest.Mock).mock.calls.map((call) => call[0] as string);
      expect(createdIds).toEqual(['athan_10_v2']);
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

    it('deletes exactly the wav-generation channels: the single reminder channel and athan_1…16', async () => {
      await deleteLegacyAndroidAudioChannels();

      const deletedIds = (deleteNotificationChannelAsync as jest.Mock).mock.calls.map((call) => call[0] as string);
      const expectedIds = ['reminder', ...Array.from({ length: 16 }, (_, i) => `athan_${i + 1}`)];

      expect(deletedIds).toHaveLength(17);
      for (const id of expectedIds) {
        expect(deletedIds).toContain(id);
      }
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

    it('creates the per-prayer × interval channel with the matching mp3 sound and the original channel settings', async () => {
      await createReminderAndroidChannel('Fajr', 15);

      expect(setNotificationChannelAsync).toHaveBeenCalledTimes(1);
      expect(setNotificationChannelAsync).toHaveBeenCalledWith(
        'reminder_fajr_15',
        expect.objectContaining({
          name: 'Fajr in 15m Reminder',
          sound: 'reminder_fajr_15.mp3',
          importance: AndroidImportance.HIGH,
          enableVibrate: true,
          vibrationPattern: [0, 250, 250, 250],
          bypassDnd: true,
        })
      );
    });

    it('slugs multi-word prayer names into the channel id and sound file', async () => {
      await createReminderAndroidChannel('Last Third', 5);

      expect(setNotificationChannelAsync).toHaveBeenCalledWith(
        'reminder_last_third_5',
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
