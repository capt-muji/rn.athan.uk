/**
 * Unit tests for stores/database.ts
 *
 * Tests MMKV storage wrapper functions:
 * - getItem, setItem, removeItem
 * - getAllWithPrefix, clearPrefix
 * - saveAllPrayers, getPrayerByDate
 * - Notification record management
 */

import {
  database,
  getItem,
  setItem,
  removeItem,
  getAllWithPrefix,
  clearPrefix,
  saveAllPrayers,
  getPrayerByDate,
  markYearAsFetched,
  clearAllScheduledNotificationsForSchedule,
  clearAllScheduledNotificationsForPrayer,
  addOneScheduledNotificationForPrayer,
  getAllScheduledNotificationsForSchedule,
  getAllScheduledNotificationsForPrayer,
  addOneScheduledReminderForPrayer,
  getAllScheduledRemindersForPrayer,
  clearAllScheduledRemindersForPrayer,
  clearAllScheduledRemindersForSchedule,
} from '../database';

import { ScheduledNotification } from '@/shared/notifications';
import { AlertType, ISingleApiResponseTransformed, ScheduleType } from '@/shared/types';

// =============================================================================
// TEST SETUP
// =============================================================================

beforeEach(() => {
  // Clear all stored data before each test
  database.clearAll();
});

// =============================================================================
// BASIC CRUD OPERATIONS
// =============================================================================

describe('getItem', () => {
  it('returns null for non-existent key', () => {
    const result = getItem('nonexistent_key');
    expect(result).toBeNull();
  });

  it('returns parsed JSON for existing key', () => {
    database.set('test_key', JSON.stringify({ foo: 'bar' }));
    const result = getItem('test_key');
    expect(result).toEqual({ foo: 'bar' });
  });

  it('handles arrays correctly', () => {
    database.set('test_array', JSON.stringify([1, 2, 3]));
    const result = getItem('test_array');
    expect(result).toEqual([1, 2, 3]);
  });

  it('handles nested objects', () => {
    const nested = { a: { b: { c: 'deep' } } };
    database.set('nested', JSON.stringify(nested));
    const result = getItem('nested');
    expect(result).toEqual(nested);
  });
});

describe('setItem', () => {
  it('stores JSON-stringified value', () => {
    setItem('my_key', { hello: 'world' });
    const stored = database.getString('my_key');
    expect(stored).toBe('{"hello":"world"}');
  });

  it('can store arrays', () => {
    setItem('my_array', [1, 2, 3]);
    const result = getItem('my_array');
    expect(result).toEqual([1, 2, 3]);
  });

  it('can store primitives', () => {
    setItem('my_string', 'hello');
    setItem('my_number', 42);
    setItem('my_bool', true);

    expect(getItem('my_string')).toBe('hello');
    expect(getItem('my_number')).toBe(42);
    expect(getItem('my_bool')).toBe(true);
  });

  it('overwrites existing values', () => {
    setItem('key', 'first');
    setItem('key', 'second');
    expect(getItem('key')).toBe('second');
  });
});

describe('removeItem', () => {
  it('removes existing key', () => {
    setItem('to_remove', 'value');
    expect(getItem('to_remove')).toBe('value');

    removeItem('to_remove');
    expect(getItem('to_remove')).toBeNull();
  });

  it('does not throw for non-existent key', () => {
    expect(() => removeItem('nonexistent')).not.toThrow();
  });
});

// =============================================================================
// PREFIX OPERATIONS
// =============================================================================

describe('getAllWithPrefix', () => {
  beforeEach(() => {
    setItem('prayer_2026-01-01', { date: '2026-01-01', fajr: '06:00' });
    setItem('prayer_2026-01-02', { date: '2026-01-02', fajr: '06:01' });
    setItem('prayer_2026-01-03', { date: '2026-01-03', fajr: '06:02' });
    setItem('preference_sound', 3);
    setItem('preference_theme', 'dark');
  });

  it('returns all items matching prefix', () => {
    const prayers = getAllWithPrefix('prayer_');
    expect(prayers).toHaveLength(3);
  });

  it('returns empty array when no matches', () => {
    const result = getAllWithPrefix('nonexistent_');
    expect(result).toEqual([]);
  });

  it('returns correct items for different prefixes', () => {
    const preferences = getAllWithPrefix('preference_');
    expect(preferences).toHaveLength(2);
  });

  it('does not include partial prefix matches', () => {
    setItem('pray', 'not a prayer');
    const prayers = getAllWithPrefix('prayer_');
    expect(prayers).toHaveLength(3);
  });
});

describe('clearPrefix', () => {
  beforeEach(() => {
    setItem('notification_1', { id: 1 });
    setItem('notification_2', { id: 2 });
    setItem('notification_3', { id: 3 });
    setItem('preference_sound', 5);
    setItem('other_key', 'value');
  });

  it('removes all keys with matching prefix', () => {
    clearPrefix('notification_');

    expect(getItem('notification_1')).toBeNull();
    expect(getItem('notification_2')).toBeNull();
    expect(getItem('notification_3')).toBeNull();
  });

  it('does not remove keys with different prefix', () => {
    clearPrefix('notification_');

    expect(getItem('preference_sound')).toBe(5);
    expect(getItem('other_key')).toBe('value');
  });

  it('handles empty prefix match gracefully', () => {
    expect(() => clearPrefix('nonexistent_')).not.toThrow();
  });

  it('removes correct count of items', () => {
    const beforeCount = database.getAllKeys().length;
    expect(beforeCount).toBe(5);

    clearPrefix('notification_');

    const afterCount = database.getAllKeys().length;
    expect(afterCount).toBe(2);
  });
});

// =============================================================================
// PRAYER DATA OPERATIONS
// =============================================================================

describe('saveAllPrayers', () => {
  const createMockPrayer = (date: string, fajr: string): ISingleApiResponseTransformed => ({
    date,
    fajr,
    sunrise: '07:30',
    dhuhr: '12:15',
    asr: '14:30',
    magrib: '16:45',
    isha: '18:15',
    midnight: '00:30',
    'last third': '02:30',
    suhoor: '05:40',
    duha: '07:50',
    istijaba: '12:45',
  });

  it('saves multiple prayers with correct keys', () => {
    const prayers = [createMockPrayer('2026-01-01', '06:00'), createMockPrayer('2026-01-02', '06:01')];

    saveAllPrayers(prayers);

    expect(database.getString('prayer_2026-01-01')).toBeDefined();
    expect(database.getString('prayer_2026-01-02')).toBeDefined();
  });

  it('stores correct prayer data structure', () => {
    const prayer = createMockPrayer('2026-01-15', '06:12');

    saveAllPrayers([prayer]);

    const stored = JSON.parse(database.getString('prayer_2026-01-15')!);
    expect(stored.fajr).toBe('06:12');
    expect(stored.magrib).toBe('16:45');
  });
});

describe('getPrayerByDate', () => {
  beforeEach(() => {
    const prayer = {
      date: '2026-01-20',
      fajr: '06:15',
      sunrise: '07:50',
      dhuhr: '12:25',
      asr: '14:40',
      magrib: '17:00',
      isha: '18:45',
    };
    database.set('prayer_2026-01-20', JSON.stringify(prayer));
  });

  it('returns prayer data for valid date', () => {
    const date = new Date('2026-01-20T12:00:00Z');
    const result = getPrayerByDate(date);

    expect(result).not.toBeNull();
    expect(result?.fajr).toBe('06:15');
  });

  it('returns null for date without data', () => {
    const date = new Date('2026-12-25T12:00:00Z');
    const result = getPrayerByDate(date);

    expect(result).toBeNull();
  });
});

// =============================================================================
// YEAR TRACKING
// =============================================================================

describe('markYearAsFetched', () => {
  it('marks a year as fetched', () => {
    markYearAsFetched(2026);

    const fetchedYears = getItem('fetched_years');
    expect(fetchedYears).toEqual({ 2026: true });
  });

  it('can mark multiple years', () => {
    markYearAsFetched(2026);
    markYearAsFetched(2027);

    const fetchedYears = getItem('fetched_years');
    expect(fetchedYears).toEqual({ 2026: true, 2027: true });
  });

  it('preserves existing years when adding new', () => {
    markYearAsFetched(2025);
    markYearAsFetched(2026);

    const fetchedYears = getItem('fetched_years');
    expect(fetchedYears[2025]).toBe(true);
    expect(fetchedYears[2026]).toBe(true);
  });
});

// =============================================================================
// NOTIFICATION RECORD MANAGEMENT
// =============================================================================

describe('notification scheduling records', () => {
  const createMockNotification = (id: string, englishName = 'Fajr'): ScheduledNotification => ({
    id,
    date: '2026-01-24',
    time: '06:15',
    englishName,
    arabicName: 'الفجر',
    alertType: AlertType.Sound,
  });

  const mockNotification = createMockNotification('test-notification-id');

  describe('addOneScheduledNotificationForPrayer', () => {
    it('stores notification with correct key format', () => {
      addOneScheduledNotificationForPrayer(ScheduleType.Standard, 0, mockNotification);

      const key = `scheduled_notifications_${ScheduleType.Standard}_0_${mockNotification.id}`;
      const stored = getItem(key);
      expect(stored).toEqual(mockNotification);
    });

    it('stores notifications for different prayers separately', () => {
      const fajrNotification = createMockNotification('fajr-id', 'Fajr');
      const dhuhrNotification = createMockNotification('dhuhr-id', 'Dhuhr');

      addOneScheduledNotificationForPrayer(ScheduleType.Standard, 0, fajrNotification);
      addOneScheduledNotificationForPrayer(ScheduleType.Standard, 2, dhuhrNotification);

      const fajrKey = `scheduled_notifications_${ScheduleType.Standard}_0_fajr-id`;
      const dhuhrKey = `scheduled_notifications_${ScheduleType.Standard}_2_dhuhr-id`;

      expect(getItem(fajrKey)).toEqual(fajrNotification);
      expect(getItem(dhuhrKey)).toEqual(dhuhrNotification);
    });
  });

  describe('getAllScheduledNotificationsForSchedule', () => {
    beforeEach(() => {
      addOneScheduledNotificationForPrayer(ScheduleType.Standard, 0, createMockNotification('std-0'));
      addOneScheduledNotificationForPrayer(ScheduleType.Standard, 1, createMockNotification('std-1'));
      addOneScheduledNotificationForPrayer(ScheduleType.Extra, 0, createMockNotification('ext-0'));
    });

    it('returns all notifications for Standard schedule', () => {
      const result = getAllScheduledNotificationsForSchedule(ScheduleType.Standard);
      expect(result).toHaveLength(2);
    });

    it('returns all notifications for Extra schedule', () => {
      const result = getAllScheduledNotificationsForSchedule(ScheduleType.Extra);
      expect(result).toHaveLength(1);
    });

    it('returns empty array when no notifications', () => {
      database.clearAll();
      const result = getAllScheduledNotificationsForSchedule(ScheduleType.Standard);
      expect(result).toEqual([]);
    });
  });

  describe('getAllScheduledNotificationsForPrayer', () => {
    beforeEach(() => {
      // Add multiple notifications for same prayer (different days)
      addOneScheduledNotificationForPrayer(ScheduleType.Standard, 0, createMockNotification('day1'));
      addOneScheduledNotificationForPrayer(ScheduleType.Standard, 0, createMockNotification('day2'));
      addOneScheduledNotificationForPrayer(ScheduleType.Standard, 1, createMockNotification('other'));
    });

    it('returns notifications only for specified prayer', () => {
      const result = getAllScheduledNotificationsForPrayer(ScheduleType.Standard, 0);
      expect(result).toHaveLength(2);
    });

    it('does not include notifications from other prayers', () => {
      const result = getAllScheduledNotificationsForPrayer(ScheduleType.Standard, 1);
      expect(result).toHaveLength(1);
    });
  });

  describe('clearAllScheduledNotificationsForPrayer', () => {
    beforeEach(() => {
      addOneScheduledNotificationForPrayer(ScheduleType.Standard, 0, createMockNotification('fajr-1'));
      addOneScheduledNotificationForPrayer(ScheduleType.Standard, 0, createMockNotification('fajr-2'));
      addOneScheduledNotificationForPrayer(ScheduleType.Standard, 1, createMockNotification('sunrise'));
    });

    it('clears all notifications for specified prayer', () => {
      clearAllScheduledNotificationsForPrayer(ScheduleType.Standard, 0);

      const fajrNotifications = getAllScheduledNotificationsForPrayer(ScheduleType.Standard, 0);
      expect(fajrNotifications).toHaveLength(0);
    });

    it('does not clear notifications for other prayers', () => {
      clearAllScheduledNotificationsForPrayer(ScheduleType.Standard, 0);

      const sunriseNotifications = getAllScheduledNotificationsForPrayer(ScheduleType.Standard, 1);
      expect(sunriseNotifications).toHaveLength(1);
    });
  });

  describe('clearAllScheduledNotificationsForSchedule', () => {
    beforeEach(() => {
      addOneScheduledNotificationForPrayer(ScheduleType.Standard, 0, createMockNotification('std-1'));
      addOneScheduledNotificationForPrayer(ScheduleType.Standard, 1, createMockNotification('std-2'));
      addOneScheduledNotificationForPrayer(ScheduleType.Extra, 0, createMockNotification('ext-1'));
    });

    it('clears all notifications for Standard schedule', () => {
      clearAllScheduledNotificationsForSchedule(ScheduleType.Standard);

      const standardNotifications = getAllScheduledNotificationsForSchedule(ScheduleType.Standard);
      expect(standardNotifications).toHaveLength(0);
    });

    it('does not clear Extra schedule notifications', () => {
      clearAllScheduledNotificationsForSchedule(ScheduleType.Standard);

      const extraNotifications = getAllScheduledNotificationsForSchedule(ScheduleType.Extra);
      expect(extraNotifications).toHaveLength(1);
    });
  });
});

// =============================================================================
// REMINDER RECORD MANAGEMENT
// =============================================================================

describe('reminder scheduling records', () => {
  const createMockReminder = (id: string, englishName = 'Fajr'): ScheduledNotification => ({
    id,
    date: '2026-01-24',
    time: '05:55',
    englishName,
    arabicName: 'الفجر',
    alertType: AlertType.Sound,
  });

  const mockReminder = createMockReminder('test-reminder-id');

  describe('addOneScheduledReminderForPrayer', () => {
    it('stores reminder with correct key format', () => {
      addOneScheduledReminderForPrayer(ScheduleType.Standard, 0, mockReminder);

      const key = `scheduled_reminders_${ScheduleType.Standard}_0_${mockReminder.id}`;
      const stored = getItem(key);
      expect(stored).toEqual(mockReminder);
    });

    it('stores reminders for different prayers separately', () => {
      const fajrReminder = createMockReminder('fajr-reminder', 'Fajr');
      const dhuhrReminder = createMockReminder('dhuhr-reminder', 'Dhuhr');

      addOneScheduledReminderForPrayer(ScheduleType.Standard, 0, fajrReminder);
      addOneScheduledReminderForPrayer(ScheduleType.Standard, 2, dhuhrReminder);

      const fajrKey = `scheduled_reminders_${ScheduleType.Standard}_0_fajr-reminder`;
      const dhuhrKey = `scheduled_reminders_${ScheduleType.Standard}_2_dhuhr-reminder`;

      expect(getItem(fajrKey)).toEqual(fajrReminder);
      expect(getItem(dhuhrKey)).toEqual(dhuhrReminder);
    });
  });

  describe('getAllScheduledRemindersForPrayer', () => {
    beforeEach(() => {
      // Add multiple reminders for same prayer (different days)
      addOneScheduledReminderForPrayer(ScheduleType.Standard, 0, createMockReminder('day1'));
      addOneScheduledReminderForPrayer(ScheduleType.Standard, 0, createMockReminder('day2'));
      addOneScheduledReminderForPrayer(ScheduleType.Standard, 1, createMockReminder('other'));
    });

    it('returns reminders only for specified prayer', () => {
      const result = getAllScheduledRemindersForPrayer(ScheduleType.Standard, 0);
      expect(result).toHaveLength(2);
    });

    it('does not include reminders from other prayers', () => {
      const result = getAllScheduledRemindersForPrayer(ScheduleType.Standard, 1);
      expect(result).toHaveLength(1);
    });

    it('returns empty array when no reminders exist', () => {
      database.clearAll();
      const result = getAllScheduledRemindersForPrayer(ScheduleType.Standard, 5);
      expect(result).toEqual([]);
    });
  });

  describe('clearAllScheduledRemindersForPrayer', () => {
    beforeEach(() => {
      addOneScheduledReminderForPrayer(ScheduleType.Standard, 0, createMockReminder('fajr-1'));
      addOneScheduledReminderForPrayer(ScheduleType.Standard, 0, createMockReminder('fajr-2'));
      addOneScheduledReminderForPrayer(ScheduleType.Standard, 1, createMockReminder('sunrise'));
    });

    it('clears all reminders for specified prayer', () => {
      clearAllScheduledRemindersForPrayer(ScheduleType.Standard, 0);

      const fajrReminders = getAllScheduledRemindersForPrayer(ScheduleType.Standard, 0);
      expect(fajrReminders).toHaveLength(0);
    });

    it('does not clear reminders for other prayers', () => {
      clearAllScheduledRemindersForPrayer(ScheduleType.Standard, 0);

      const sunriseReminders = getAllScheduledRemindersForPrayer(ScheduleType.Standard, 1);
      expect(sunriseReminders).toHaveLength(1);
    });
  });

  describe('clearAllScheduledRemindersForSchedule', () => {
    beforeEach(() => {
      addOneScheduledReminderForPrayer(ScheduleType.Standard, 0, createMockReminder('std-1'));
      addOneScheduledReminderForPrayer(ScheduleType.Standard, 1, createMockReminder('std-2'));
      addOneScheduledReminderForPrayer(ScheduleType.Extra, 0, createMockReminder('ext-1'));
    });

    it('clears all reminders for Standard schedule', () => {
      clearAllScheduledRemindersForSchedule(ScheduleType.Standard);

      const fajrReminders = getAllScheduledRemindersForPrayer(ScheduleType.Standard, 0);
      const sunriseReminders = getAllScheduledRemindersForPrayer(ScheduleType.Standard, 1);
      expect(fajrReminders).toHaveLength(0);
      expect(sunriseReminders).toHaveLength(0);
    });

    it('does not clear Extra schedule reminders', () => {
      clearAllScheduledRemindersForSchedule(ScheduleType.Standard);

      const extraReminders = getAllScheduledRemindersForPrayer(ScheduleType.Extra, 0);
      expect(extraReminders).toHaveLength(1);
    });
  });
});
