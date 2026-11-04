import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Unit tests for stores/database.ts
 *
 * Tests MMKV storage wrapper functions:
 * - getItem, setItem, removeItem
 * - getAllWithPrefix, clearPrefix
 * - Notification record management
 * - cleanLegacyDayCacheOnce
 */

import type { ScheduledNotification } from '@/shared/notifications';
import { AlertType, ScheduleType } from '@/shared/types';
import { __installTimetableDays } from '@/stores/timetable';

import {
  addOneScheduledNotificationForPrayer,
  addOneScheduledReminderForPrayer,
  clearAllExcept,
  clearPrefix,
  database,
  getAllScheduledNotificationsForPrayer,
  getAllScheduledNotificationsForSchedule,
  getAllScheduledRemindersForPrayer,
  getAllScheduledRemindersForSchedule,
  getAllWithPrefix,
  getItem,
  removeItem,
  setItem,
} from '../database';

// =============================================================================
// TEST SETUP
// =============================================================================

beforeEach(() => {
  // Clear all stored data before each test
  database.clearAll();
  __installTimetableDays([]);
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

  // cacheSchemaChanged compares the read-back marker with `!==` against the number
  // CACHE_SCHEMA_VERSION. That only works because this round trip preserves the type:
  // if a number ever came back as a string, the comparison would be true on every
  // launch and the prayer cache would be wiped on every single upgrade.
  it('round-trips a number as a number, which the cache schema marker depends on', () => {
    setItem('cache_schema_version', 1);

    const readBack = getItem('cache_schema_version');

    expect(readBack).toBe(1);
    expect(typeof readBack).toBe('number');
    expect(readBack === 1).toBe(true);
  });

  it('round-trips zero as a number rather than null', () => {
    setItem('zero_marker', 0);

    expect(getItem('zero_marker')).toBe(0);
  });
});

describe('clearAllExcept', () => {
  it('removes what no keep-prefix covers and keeps the covered families whole', () => {
    database.set('app_installed_version', '"2.0.0"');
    database.set('preference_alert_standard_fajr', 'true');
    database.set('prayer_max_name_width_standard', '120');
    database.set('scheduled_notifications_standard_0_x', '{}');
    database.set('an_orphan_key', '"gone"');

    clearAllExcept(['app_installed_version', 'preference_', 'prayer_max_name_width_', 'scheduled_notifications_']);

    expect(database.contains('app_installed_version')).toBe(true);
    expect(database.contains('preference_alert_standard_fajr')).toBe(true);
    expect(database.contains('prayer_max_name_width_standard')).toBe(true);
    expect(database.contains('scheduled_notifications_standard_0_x')).toBe(true);
    expect(database.contains('an_orphan_key')).toBe(false);
  });
  it('reads torn bytes as absent rather than throwing, the T-541 law', () => {
    database.set('torn_key', '{not json');

    expect(getItem('torn_key')).toBeNull();
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

// =============================================================================
// YEAR TRACKING
// =============================================================================

// =============================================================================
// NOTIFICATION RECORD MANAGEMENT
// =============================================================================

describe('notification scheduling records', () => {
  const createMockNotification = (id: string, englishName = 'Fajr'): ScheduledNotification => ({
    id,
    date: '2026-01-24',
    time: '06:15',
    englishName,
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
      __installTimetableDays([]);
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
      __installTimetableDays([]);
      const result = getAllScheduledRemindersForPrayer(ScheduleType.Standard, 5);
      expect(result).toEqual([]);
    });
  });

  describe('getAllScheduledRemindersForSchedule', () => {
    beforeEach(() => {
      addOneScheduledReminderForPrayer(ScheduleType.Standard, 0, createMockReminder('std-0'));
      addOneScheduledReminderForPrayer(ScheduleType.Standard, 1, createMockReminder('std-1'));
      addOneScheduledReminderForPrayer(ScheduleType.Extra, 0, createMockReminder('ext-0'));
    });

    it('returns all reminders for Standard schedule across prayers', () => {
      const result = getAllScheduledRemindersForSchedule(ScheduleType.Standard);
      expect(result).toHaveLength(2);
      expect(result.map((reminder) => reminder.id).sort()).toEqual(['std-0', 'std-1']);
    });

    it('returns all reminders for Extra schedule', () => {
      const result = getAllScheduledRemindersForSchedule(ScheduleType.Extra);
      expect(result).toHaveLength(1);
    });

    it('returns empty array when no reminders exist', () => {
      database.clearAll();
      __installTimetableDays([]);
      const result = getAllScheduledRemindersForSchedule(ScheduleType.Standard);
      expect(result).toEqual([]);
    });
  });
});

// =============================================================================
// clearAllExcept CALL-SITE GUARD (audit finding 6)
// =============================================================================

/**
 * `clearAllExcept` is the raw wipe. Two places call it directly: the upgrade path
 * and the sync path's full refresh. Anything else that needs to clear the cache
 * goes through `clearUpgradeCache`, which owns the keep-list.
 *
 * The error screen's Refresh button does clear the cache —
 * reaching that screen means something has gone wrong, and the
 * destruction is acceptable because preferences survive. It routes through
 * `clearUpgradeCache` so it inherits the full keep-list rather than an inline
 * one, which is what the second test below pins.
 */
describe('clearAllExcept call sites', () => {
  const SANCTIONED = ['stores/version.ts'];

  const sourceFiles = (dir: string): string[] => {
    const entries = readdirSync(join(__dirname, '../..', dir), { withFileTypes: true });
    return entries.flatMap((entry) => {
      const relative = `${dir}/${entry.name}`;
      if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(relative);
      return /\.tsx?$/.test(entry.name) ? [relative] : [];
    });
  };

  it('is called only from the upgrade and sync paths', () => {
    const searched = ['app', 'components', 'device', 'hooks', 'shared', 'stores', 'widgets'];
    const callers = searched
      .flatMap((dir) => sourceFiles(dir))
      .filter((relative) => {
        const source = readFileSync(join(__dirname, '../..', relative), 'utf8');
        // Comments discuss this function by name, so strip them before looking
        // for calls; the declaration in database.ts is not a call site either
        const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
        return /\bclearAllExcept\(/.test(code) && relative !== 'stores/database.ts';
      });

    expect(callers.sort()).toEqual(SANCTIONED);
  });

  /**
   * The error screen's reset goes through `clearUpgradeCache`, not through the
   * raw wipe, precisely so it inherits this list. A user reset must never cost
   * them their alert settings: they came here because prayer times are broken,
   * not to start over.
   */
  it("keeps preferences and measured widths through the error screen's clear", () => {
    const version = readFileSync(join(__dirname, '../version.ts'), 'utf8');
    const keepList = version.slice(
      version.indexOf('const UPGRADE_KEEP_PREFIXES'),
      version.indexOf('];', version.indexOf('const UPGRADE_KEEP_PREFIXES'))
    );

    expect(keepList).toContain("'preference_'");
    expect(keepList).toContain("'app_installed_version'");
    expect(keepList).toContain("'prayer_max_name_width_'");

    // Routing through clearUpgradeCache is what earns the keep-list above. An
    // inline list on the call site would drop prayer_max_name_width_, and
    // losing that reflows the prayer list on the next launch (ISSUES #22, #16)
    const errorScreen = readFileSync(join(__dirname, '../../components/ui/Error.tsx'), 'utf8');
    expect(errorScreen).toContain('clearUpgradeCache()');
  });
});

// =============================================================================
// MMKV INSTANCE ID TESTS (AUDIT #25)
// =============================================================================

/**
 * The store is namespaced by the same predicate that decides whether mock
 * prayer times are served, so a mock-serving build cannot leave fabricated
 * rows where a real build will read them.
 *
 * The shared react-native-mmkv mock discards the id, so these cases install a
 * local jest.doMock that records it (the pattern shared/__tests__/perf.test.ts
 * uses) inside jest.isolateModules — scoped so the rest of this file keeps the
 * shared mock. shared/config.ts reads EXPO_PUBLIC_ENV at module evaluation,
 * which is why the graph has to be required fresh per environment.
 */
describe('MMKV instance id', () => {
  const originalEnv = process.env.EXPO_PUBLIC_ENV;

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.EXPO_PUBLIC_ENV;
    else process.env.EXPO_PUBLIC_ENV = originalEnv;

    jest.dontMock('react-native-mmkv');
    jest.resetModules();
  });

  /** Re-evaluates stores/database.ts under the given env and returns the id it asked for */
  const idForEnv = (env: string | undefined): string | undefined => {
    if (env === undefined) delete process.env.EXPO_PUBLIC_ENV;
    else process.env.EXPO_PUBLIC_ENV = env;

    const ids: Array<string | undefined> = [];

    jest.isolateModules(() => {
      jest.doMock('react-native-mmkv', () => ({
        __esModule: true,
        // Only the import-time call matters here; the returned instance is
        // never touched, since nothing in database.ts reads at module scope
        createMMKV: (options: { id?: string }) => {
          ids.push(options?.id);
          return {};
        },
      }));

      require('../database');
    });

    expect(ids).toHaveLength(1);
    return ids[0];
  };

  it('uses athan-storage in production, the id shipped installs already hold', () => {
    expect(idForEnv('prod')).toBe('athan-storage');
  });

  it('uses athan-storage in preview, which serves real data too', () => {
    expect(idForEnv('preview')).toBe('athan-storage');
  });

  it('uses a separate store for local builds, which serve MOCK_DATA_SIMPLE', () => {
    expect(idForEnv('local')).not.toBe('athan-storage');
  });

  it('uses a separate store when the environment is unset', () => {
    expect(idForEnv(undefined)).not.toBe('athan-storage');
  });

  it('agrees with the predicate stores/timetable.ts uses to serve the mock window', () => {
    // The two must move together: the namespace is a guarantee only while the
    // build that serves fabricated days is exactly the build denied the real id
    const timetable = readFileSync(join(__dirname, '../timetable.ts'), 'utf8');
    expect(timetable).toContain('const servesBakedTimetable = (): boolean => isProd() || isPreview();');

    const db = readFileSync(join(__dirname, '../database.ts'), 'utf8');
    expect(db).toContain("isProd() || isPreview() ? 'athan-storage'");
  });
});
