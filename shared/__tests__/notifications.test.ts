import {
  genNextXDays,
  isPrayerTimeInFuture,
  isNotificationOutdated,
  genTriggerDate,
  getNotificationSound,
  genNotificationContent,
  createDefaultAndroidChannel,
  initializeNotifications,
  getReminderNotificationSound,
  genReminderNotificationContent,
  genReminderTriggerDate,
  createReminderAndroidChannel,
} from '../notifications';
import { AlertType } from '../types';

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
    const today = new Date().toISOString().split('T')[0];
    expect(days[0]).toBe(today);
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
// genTriggerDate TESTS
// =============================================================================

describe('genTriggerDate', () => {
  it('creates Date from date and time strings', () => {
    const result = genTriggerDate('2026-01-18', '06:12');
    expect(result).toBeInstanceOf(Date);
  });

  it('sets correct hours and minutes', () => {
    const result = genTriggerDate('2026-01-18', '14:30');
    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(30);
  });

  it('sets seconds to 0', () => {
    const result = genTriggerDate('2026-01-18', '06:12');
    expect(result.getSeconds()).toBe(0);
  });
});

// =============================================================================
// isPrayerTimeInFuture TESTS
// =============================================================================

describe('isPrayerTimeInFuture', () => {
  it('returns false for past dates', () => {
    // Use a date far in the past
    expect(isPrayerTimeInFuture('2020-01-01', '06:00')).toBe(false);
  });

  it('returns true for future dates', () => {
    // Use a date far in the future
    expect(isPrayerTimeInFuture('2030-01-01', '06:00')).toBe(true);
  });

  it('returns false for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    expect(isPrayerTimeInFuture(dateStr, '00:00')).toBe(false);
  });

  it('returns true for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    expect(isPrayerTimeInFuture(dateStr, '23:59')).toBe(true);
  });
});

// =============================================================================
// isNotificationOutdated TESTS
// =============================================================================

describe('isNotificationOutdated', () => {
  it('returns true for past notifications', () => {
    const notification = {
      id: 'test-1',
      date: '2020-01-01',
      time: '06:00',
      englishName: 'Fajr',
      arabicName: 'الفجر',
      alertType: AlertType.Sound,
    };
    expect(isNotificationOutdated(notification)).toBe(true);
  });

  it('returns false for future notifications', () => {
    const notification = {
      id: 'test-2',
      date: '2030-01-01',
      time: '06:00',
      englishName: 'Fajr',
      arabicName: 'الفجر',
      alertType: AlertType.Sound,
    };
    expect(isNotificationOutdated(notification)).toBe(false);
  });
});

// =============================================================================
// getNotificationSound TESTS
// =============================================================================

describe('getNotificationSound', () => {
  it('returns false for non-Sound alert types', () => {
    expect(getNotificationSound(AlertType.Off, 0)).toBe(false);
    expect(getNotificationSound(AlertType.Silent, 0)).toBe(false);
  });

  it('returns correct sound file for Sound alert type', () => {
    expect(getNotificationSound(AlertType.Sound, 0)).toBe('athan1.wav');
    expect(getNotificationSound(AlertType.Sound, 1)).toBe('athan2.wav');
    expect(getNotificationSound(AlertType.Sound, 2)).toBe('athan3.wav');
  });

  it('handles various sound indices', () => {
    expect(getNotificationSound(AlertType.Sound, 15)).toBe('athan16.wav');
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
    expect(content.sound).toBe('athan1.wav');
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
      expect(isNaN(date.getTime())).toBe(false);
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
    expect(getReminderNotificationSound(AlertType.Off)).toBe(false);
  });

  it('returns false for Silent alert type', () => {
    expect(getReminderNotificationSound(AlertType.Silent)).toBe(false);
  });

  it('returns reminder.wav for Sound alert type', () => {
    expect(getReminderNotificationSound(AlertType.Sound)).toBe('reminder.wav');
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
    expect(content.sound).toBe('reminder.wav');
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

describe('genReminderTriggerDate', () => {
  it('subtracts correct minutes from prayer time', () => {
    const prayerTrigger = genTriggerDate('2026-01-24', '06:15');
    const reminderTrigger = genReminderTriggerDate('2026-01-24', '06:15', 15);

    // Reminder should be 15 minutes before prayer
    const diffMs = prayerTrigger.getTime() - reminderTrigger.getTime();
    const diffMinutes = diffMs / (60 * 1000);
    expect(diffMinutes).toBe(15);
  });

  it('handles 5 minute interval', () => {
    const reminderTrigger = genReminderTriggerDate('2026-01-24', '12:00', 5);

    expect(reminderTrigger.getHours()).toBe(11);
    expect(reminderTrigger.getMinutes()).toBe(55);
  });

  it('handles 30 minute interval', () => {
    const reminderTrigger = genReminderTriggerDate('2026-01-24', '12:00', 30);

    expect(reminderTrigger.getHours()).toBe(11);
    expect(reminderTrigger.getMinutes()).toBe(30);
  });

  it('handles crossing hour boundary', () => {
    const reminderTrigger = genReminderTriggerDate('2026-01-24', '06:10', 15);

    expect(reminderTrigger.getHours()).toBe(5);
    expect(reminderTrigger.getMinutes()).toBe(55);
  });

  it('handles midnight crossing', () => {
    const reminderTrigger = genReminderTriggerDate('2026-01-24', '00:10', 15);

    // Should go to previous day at 23:55
    expect(reminderTrigger.getHours()).toBe(23);
    expect(reminderTrigger.getMinutes()).toBe(55);
    expect(reminderTrigger.getDate()).toBe(23); // Previous day
  });
});

describe('createReminderAndroidChannel', () => {
  it('does not throw on iOS (returns early)', async () => {
    // Default mock has Platform.OS = 'ios'
    await expect(createReminderAndroidChannel()).resolves.toBeUndefined();
  });
});
