/**
 * Unit tests for stores/notifications.ts
 *
 * Tests notification store helpers and atoms:
 * - getPrayerArrays helper
 * - createPrayerAlertAtom factory
 * - Alert atom arrays (standardPrayerAlertAtoms, extraPrayerAlertAtoms)
 * - shouldRescheduleNotifications logic
 */

import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { createStore } from 'jotai';

import { prayerNotificationIdentifier, reminderNotificationIdentifier } from '@/device/notifications';
import {
  BACKGROUND_TASK_INTERVAL_HOURS,
  BACKGROUND_TASK_NAME,
  DEFAULT_REMINDER_INTERVAL,
  EXTRAS_ARABIC,
  EXTRAS_ENGLISH,
  NOTIFICATION_REFRESH_HOURS,
  PRAYERS_ARABIC,
  PRAYERS_ENGLISH,
} from '@/shared/constants';
import logger from '@/shared/logger';
import type { ScheduledNotification } from '@/shared/notifications';
import { AlertType, type ISingleApiResponseTransformed, type ReminderInterval, ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';
import {
  createPrayerAlertAtom,
  createReminderAlertAtom,
  createReminderIntervalAtom,
  extraPrayerAlertAtoms,
  extraReminderAlertAtoms,
  extraReminderIntervalAtoms,
  getBackgroundTaskStatus,
  getPrayerAlertAtom,
  getPrayerArrays,
  getReminderAlertAtom,
  getReminderAlertType,
  getReminderIntervalAtom,
  lastNotificationScheduleAtom,
  migrateIndexKeyedAlertPreferences,
  refreshNotifications,
  registerBackgroundTask,
  rescheduleAllNotifications,
  rescheduleAllNotificationsFromBackground,
  setPrayerAlertType,
  shouldRescheduleNotifications,
  soundPreferenceAtom,
  standardPrayerAlertAtoms,
  standardReminderAlertAtoms,
  standardReminderIntervalAtoms,
  unregisterBackgroundTask,
  updatePrayerNotifications,
} from '@/stores/notifications';

// Explicit logger mock: the moduleNameMapper's generic '^@/(.*)$' key resolves
// '@/shared/logger' before the dedicated mock entry can, so logger assertions
// in this file need a module factory (same pattern as api/__tests__/client.test.ts).
jest.mock('@/shared/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  isProd: () => false,
  isPreview: () => false,
  isTest: () => true,
}));

// Mock Widget store: notification reschedules also push widget timelines;
// stub it so tests never load the widget extension modules
jest.mock('@/stores/widget', () => ({
  refreshPrayerWidgets: jest.fn(async () => undefined),
}));

// =============================================================================
// getPrayerArrays HELPER TESTS
// =============================================================================

describe('getPrayerArrays', () => {
  describe('Standard schedule', () => {
    it('returns PRAYERS_ENGLISH for english array', () => {
      const result = getPrayerArrays(ScheduleType.Standard);
      expect(result.english).toBe(PRAYERS_ENGLISH);
    });

    it('returns PRAYERS_ARABIC for arabic array', () => {
      const result = getPrayerArrays(ScheduleType.Standard);
      expect(result.arabic).toBe(PRAYERS_ARABIC);
    });

    it('returns arrays with 6 prayers', () => {
      const result = getPrayerArrays(ScheduleType.Standard);
      expect(result.english).toHaveLength(6);
      expect(result.arabic).toHaveLength(6);
    });

    it('first prayer is Fajr', () => {
      const result = getPrayerArrays(ScheduleType.Standard);
      expect(result.english[0]).toBe('Fajr');
      expect(result.arabic[0]).toBe('الفجر');
    });

    it('last prayer is Isha', () => {
      const result = getPrayerArrays(ScheduleType.Standard);
      expect(result.english[5]).toBe('Isha');
      expect(result.arabic[5]).toBe('العشاء');
    });
  });

  describe('Extra schedule', () => {
    it('returns EXTRAS_ENGLISH for english array', () => {
      const result = getPrayerArrays(ScheduleType.Extra);
      expect(result.english).toBe(EXTRAS_ENGLISH);
    });

    it('returns EXTRAS_ARABIC for arabic array', () => {
      const result = getPrayerArrays(ScheduleType.Extra);
      expect(result.arabic).toBe(EXTRAS_ARABIC);
    });

    it('returns arrays with 5 prayers', () => {
      const result = getPrayerArrays(ScheduleType.Extra);
      expect(result.english).toHaveLength(5);
      expect(result.arabic).toHaveLength(5);
    });

    it('first prayer is Midnight', () => {
      const result = getPrayerArrays(ScheduleType.Extra);
      expect(result.english[0]).toBe('Midnight');
      expect(result.arabic[0]).toBe('نصف الليل');
    });

    it('last prayer is Istijaba', () => {
      const result = getPrayerArrays(ScheduleType.Extra);
      expect(result.english[4]).toBe('Istijaba');
      expect(result.arabic[4]).toBe('استجابة');
    });
  });

  describe('array alignment', () => {
    it('english and arabic arrays have same length for Standard', () => {
      const result = getPrayerArrays(ScheduleType.Standard);
      expect(result.english.length).toBe(result.arabic.length);
    });

    it('english and arabic arrays have same length for Extra', () => {
      const result = getPrayerArrays(ScheduleType.Extra);
      expect(result.english.length).toBe(result.arabic.length);
    });
  });
});

// =============================================================================
// createPrayerAlertAtom FACTORY TESTS
// =============================================================================

describe('createPrayerAlertAtom', () => {
  it('creates atom for Standard schedule prayer', () => {
    const atom = createPrayerAlertAtom(ScheduleType.Standard, 'Fajr');
    expect(atom).toBeDefined();
  });

  it('creates atom for Extra schedule prayer', () => {
    const atom = createPrayerAlertAtom(ScheduleType.Extra, 'Duha');
    expect(atom).toBeDefined();
  });

  it('creates atoms with default value of 0 (AlertType.Off)', () => {
    const store = createStore();
    const atom = createPrayerAlertAtom(ScheduleType.Standard, 'Fajr');
    const value = store.get(atom);
    expect(value).toBe(0); // AlertType.Off
  });

  it('persists under a name-based storage key', () => {
    const store = createStore();
    const atom = createPrayerAlertAtom(ScheduleType.Standard, 'Fajr');
    store.set(atom, AlertType.Sound);

    expect(Database.database.getString('preference_alert_standard_fajr')).toBe('2');
  });

  it('creates different atoms for different prayers', () => {
    const atom1 = createPrayerAlertAtom(ScheduleType.Standard, 'Fajr');
    const atom2 = createPrayerAlertAtom(ScheduleType.Standard, 'Asr');

    // They should be different atom instances
    expect(atom1).not.toBe(atom2);
  });

  it('creates different atoms for different schedule types', () => {
    const standardAtom = createPrayerAlertAtom(ScheduleType.Standard, 'Fajr');
    const extraAtom = createPrayerAlertAtom(ScheduleType.Extra, 'Fajr');

    expect(standardAtom).not.toBe(extraAtom);
  });
});

// =============================================================================
// migrateIndexKeyedAlertPreferences TESTS
// =============================================================================

describe('migrateIndexKeyedAlertPreferences', () => {
  it('copies index-keyed alert values to name keys and removes the old keys', () => {
    Database.database.set('preference_alert_standard_0', '2'); // Fajr = Sound
    Database.database.set('preference_reminder_alert_extra_4', '1'); // Istijaba reminder = Silent
    Database.database.set('preference_reminder_interval_standard_2', '20'); // Dhuhr interval

    migrateIndexKeyedAlertPreferences();

    expect(Database.database.getString('preference_alert_standard_fajr')).toBe('2');
    expect(Database.database.getString('preference_reminder_alert_extra_istijaba')).toBe('1');
    expect(Database.database.getString('preference_reminder_interval_standard_dhuhr')).toBe('20');

    expect(Database.database.contains('preference_alert_standard_0')).toBe(false);
    expect(Database.database.contains('preference_reminder_alert_extra_4')).toBe(false);
    expect(Database.database.contains('preference_reminder_interval_standard_2')).toBe(false);
  });

  it('keeps the name-keyed value when both old and new keys exist', () => {
    Database.database.set('preference_alert_standard_0', '1');
    Database.database.set('preference_alert_standard_fajr', '2');

    migrateIndexKeyedAlertPreferences();

    expect(Database.database.getString('preference_alert_standard_fajr')).toBe('2');
    expect(Database.database.contains('preference_alert_standard_0')).toBe(false);
  });

  it('is a no-op when no index-keyed keys remain', () => {
    migrateIndexKeyedAlertPreferences();
    const keysAfterFirstRun = Database.database.getAllKeys();

    migrateIndexKeyedAlertPreferences();
    expect(Database.database.getAllKeys()).toEqual(keysAfterFirstRun);
  });
});

// =============================================================================
// ALERT ATOM ARRAYS TESTS
// =============================================================================

describe('standardPrayerAlertAtoms', () => {
  it('has 6 atoms (one for each standard prayer)', () => {
    expect(standardPrayerAlertAtoms).toHaveLength(6);
  });

  it('all atoms are defined', () => {
    standardPrayerAlertAtoms.forEach((atom) => {
      expect(atom).toBeDefined();
    });
  });

  it('atoms have default value of 0', () => {
    const store = createStore();
    standardPrayerAlertAtoms.forEach((atom) => {
      expect(store.get(atom)).toBe(0);
    });
  });
});

describe('extraPrayerAlertAtoms', () => {
  it('has 5 atoms (one for each extra prayer)', () => {
    expect(extraPrayerAlertAtoms).toHaveLength(5);
  });

  it('all atoms are defined', () => {
    extraPrayerAlertAtoms.forEach((atom) => {
      expect(atom).toBeDefined();
    });
  });

  it('atoms have default value of 0', () => {
    const store = createStore();
    extraPrayerAlertAtoms.forEach((atom) => {
      expect(store.get(atom)).toBe(0);
    });
  });
});

// =============================================================================
// getPrayerAlertAtom TESTS
// =============================================================================

describe('getPrayerAlertAtom', () => {
  it('returns correct atom from standardPrayerAlertAtoms', () => {
    const atom = getPrayerAlertAtom(ScheduleType.Standard, 0);
    expect(atom).toBe(standardPrayerAlertAtoms[0]);
  });

  it('returns correct atom from extraPrayerAlertAtoms', () => {
    const atom = getPrayerAlertAtom(ScheduleType.Extra, 0);
    expect(atom).toBe(extraPrayerAlertAtoms[0]);
  });

  it('returns different atoms for different indices', () => {
    const atom0 = getPrayerAlertAtom(ScheduleType.Standard, 0);
    const atom1 = getPrayerAlertAtom(ScheduleType.Standard, 1);
    const atom5 = getPrayerAlertAtom(ScheduleType.Standard, 5);

    expect(atom0).toBe(standardPrayerAlertAtoms[0]);
    expect(atom1).toBe(standardPrayerAlertAtoms[1]);
    expect(atom5).toBe(standardPrayerAlertAtoms[5]);
  });
});

// =============================================================================
// soundPreferenceAtom TESTS
// =============================================================================

describe('soundPreferenceAtom', () => {
  it('is defined', () => {
    expect(soundPreferenceAtom).toBeDefined();
  });

  it('has default value of 0', () => {
    const store = createStore();
    const value = store.get(soundPreferenceAtom);
    expect(value).toBe(0);
  });

  it('can be updated to different sound index', () => {
    const store = createStore();

    store.set(soundPreferenceAtom, 5);
    expect(store.get(soundPreferenceAtom)).toBe(5);

    store.set(soundPreferenceAtom, 15);
    expect(store.get(soundPreferenceAtom)).toBe(15);
  });
});

// =============================================================================
// shouldRescheduleNotifications TESTS
// ADR-001: Rolling Window Notification Buffer
// - Refresh every NOTIFICATION_REFRESH_HOURS (4 hours)
// - Returns true when refresh is needed, false otherwise
// =============================================================================

describe('shouldRescheduleNotifications', () => {
  // Use the Jotai vanilla store to set atom values for testing
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getDefaultStore } = require('jotai/vanilla');
  const store = getDefaultStore();

  beforeEach(() => {
    // Reset the last schedule atom before each test
    store.set(lastNotificationScheduleAtom, 0);
  });

  it('returns true when never scheduled before (lastSchedule is 0)', () => {
    store.set(lastNotificationScheduleAtom, 0);
    expect(shouldRescheduleNotifications()).toBe(true);
  });

  it('returns true when more than NOTIFICATION_REFRESH_HOURS have passed', () => {
    // Set last schedule to 1 hour past the threshold
    const pastThreshold = Date.now() - (NOTIFICATION_REFRESH_HOURS + 1) * 60 * 60 * 1000;
    store.set(lastNotificationScheduleAtom, pastThreshold);

    expect(shouldRescheduleNotifications()).toBe(true);
  });

  it('returns true when exactly NOTIFICATION_REFRESH_HOURS have passed', () => {
    // Set last schedule to exactly the threshold
    const exactlyAtThreshold = Date.now() - NOTIFICATION_REFRESH_HOURS * 60 * 60 * 1000;
    store.set(lastNotificationScheduleAtom, exactlyAtThreshold);

    expect(shouldRescheduleNotifications()).toBe(true);
  });

  it('returns false when less than NOTIFICATION_REFRESH_HOURS have passed', () => {
    // Set last schedule to 1 hour before the threshold
    const beforeThreshold = Date.now() - (NOTIFICATION_REFRESH_HOURS - 1) * 60 * 60 * 1000;
    store.set(lastNotificationScheduleAtom, beforeThreshold);

    expect(shouldRescheduleNotifications()).toBe(false);
  });

  it('returns false when scheduled just now', () => {
    // Set last schedule to current time
    store.set(lastNotificationScheduleAtom, Date.now());

    expect(shouldRescheduleNotifications()).toBe(false);
  });

  it('returns false when scheduled 1 hour ago', () => {
    const oneHourAgo = Date.now() - 1 * 60 * 60 * 1000;
    store.set(lastNotificationScheduleAtom, oneHourAgo);

    expect(shouldRescheduleNotifications()).toBe(false);
  });

  it('returns false when scheduled at half the threshold ago', () => {
    const halfThresholdAgo = Date.now() - (NOTIFICATION_REFRESH_HOURS / 2) * 60 * 60 * 1000;
    store.set(lastNotificationScheduleAtom, halfThresholdAgo);

    expect(shouldRescheduleNotifications()).toBe(false);
  });

  it('returns true when scheduled at double the threshold ago', () => {
    const doubleThresholdAgo = Date.now() - NOTIFICATION_REFRESH_HOURS * 2 * 60 * 60 * 1000;
    store.set(lastNotificationScheduleAtom, doubleThresholdAgo);

    expect(shouldRescheduleNotifications()).toBe(true);
  });
});

// =============================================================================
// lastNotificationScheduleAtom TESTS
// =============================================================================

describe('lastNotificationScheduleAtom', () => {
  it('is defined', () => {
    expect(lastNotificationScheduleAtom).toBeDefined();
  });

  it('has default value of 0', () => {
    const store = createStore();
    const value = store.get(lastNotificationScheduleAtom);
    expect(value).toBe(0);
  });

  it('can store timestamp values', () => {
    const store = createStore();
    const timestamp = Date.now();

    store.set(lastNotificationScheduleAtom, timestamp);
    expect(store.get(lastNotificationScheduleAtom)).toBe(timestamp);
  });
});

// =============================================================================
// REMINDER ATOM FACTORY TESTS
// =============================================================================

describe('createReminderAlertAtom', () => {
  it('creates atom for Standard schedule prayer', () => {
    const atom = createReminderAlertAtom(ScheduleType.Standard, 'Fajr');
    expect(atom).toBeDefined();
  });

  it('creates atom for Extra schedule prayer', () => {
    const atom = createReminderAlertAtom(ScheduleType.Extra, 'Duha');
    expect(atom).toBeDefined();
  });

  it('creates atoms with default value of 0 (AlertType.Off)', () => {
    const store = createStore();
    const atom = createReminderAlertAtom(ScheduleType.Standard, 'Fajr');
    const value = store.get(atom);
    expect(value).toBe(0); // AlertType.Off
  });

  it('creates different atoms for different prayers', () => {
    const atom1 = createReminderAlertAtom(ScheduleType.Standard, 'Fajr');
    const atom2 = createReminderAlertAtom(ScheduleType.Standard, 'Asr');
    expect(atom1).not.toBe(atom2);
  });
});

describe('createReminderIntervalAtom', () => {
  it('creates atom for Standard schedule prayer', () => {
    const atom = createReminderIntervalAtom(ScheduleType.Standard, 'Fajr');
    expect(atom).toBeDefined();
  });

  it('creates atom for Extra schedule prayer', () => {
    const atom = createReminderIntervalAtom(ScheduleType.Extra, 'Duha');
    expect(atom).toBeDefined();
  });

  it('creates atoms with default value of DEFAULT_REMINDER_INTERVAL', () => {
    const store = createStore();
    const atom = createReminderIntervalAtom(ScheduleType.Standard, 'Fajr');
    const value = store.get(atom);
    expect(value).toBe(DEFAULT_REMINDER_INTERVAL);
  });
});

// =============================================================================
// REMINDER ATOM ARRAYS TESTS
// =============================================================================

describe('standardReminderAlertAtoms', () => {
  it('has 6 atoms (one for each standard prayer)', () => {
    expect(standardReminderAlertAtoms).toHaveLength(6);
  });

  it('all atoms are defined', () => {
    standardReminderAlertAtoms.forEach((atom) => {
      expect(atom).toBeDefined();
    });
  });

  it('atoms have default value of 0', () => {
    const store = createStore();
    standardReminderAlertAtoms.forEach((atom) => {
      expect(store.get(atom)).toBe(0);
    });
  });
});

describe('extraReminderAlertAtoms', () => {
  it('has 5 atoms (one for each extra prayer)', () => {
    expect(extraReminderAlertAtoms).toHaveLength(5);
  });

  it('all atoms are defined', () => {
    extraReminderAlertAtoms.forEach((atom) => {
      expect(atom).toBeDefined();
    });
  });
});

describe('standardReminderIntervalAtoms', () => {
  it('has 6 atoms (one for each standard prayer)', () => {
    expect(standardReminderIntervalAtoms).toHaveLength(6);
  });

  it('atoms have default value of DEFAULT_REMINDER_INTERVAL', () => {
    const store = createStore();
    standardReminderIntervalAtoms.forEach((atom) => {
      expect(store.get(atom)).toBe(DEFAULT_REMINDER_INTERVAL);
    });
  });
});

describe('extraReminderIntervalAtoms', () => {
  it('has 5 atoms (one for each extra prayer)', () => {
    expect(extraReminderIntervalAtoms).toHaveLength(5);
  });
});

// =============================================================================
// REMINDER HELPER TESTS
// =============================================================================

describe('getReminderAlertAtom', () => {
  it('returns correct atom from standardReminderAlertAtoms', () => {
    const atom = getReminderAlertAtom(ScheduleType.Standard, 0);
    expect(atom).toBe(standardReminderAlertAtoms[0]);
  });

  it('returns correct atom from extraReminderAlertAtoms', () => {
    const atom = getReminderAlertAtom(ScheduleType.Extra, 0);
    expect(atom).toBe(extraReminderAlertAtoms[0]);
  });

  it('returns different atoms for different indices', () => {
    const atom0 = getReminderAlertAtom(ScheduleType.Standard, 0);
    const atom1 = getReminderAlertAtom(ScheduleType.Standard, 1);
    expect(atom0).not.toBe(atom1);
  });
});

describe('getReminderIntervalAtom', () => {
  it('returns correct atom from standardReminderIntervalAtoms', () => {
    const atom = getReminderIntervalAtom(ScheduleType.Standard, 0);
    expect(atom).toBe(standardReminderIntervalAtoms[0]);
  });

  it('returns correct atom from extraReminderIntervalAtoms', () => {
    const atom = getReminderIntervalAtom(ScheduleType.Extra, 0);
    expect(atom).toBe(extraReminderIntervalAtoms[0]);
  });
});

// =============================================================================
// CONSTRAINT ENFORCEMENT TESTS
// =============================================================================

describe('setPrayerAlertType constraint enforcement', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getDefaultStore } = require('jotai/vanilla');
  const store = getDefaultStore();

  beforeEach(() => {
    // Reset atoms for testing
    store.set(standardPrayerAlertAtoms[0], AlertType.Sound);
    store.set(standardReminderAlertAtoms[0], AlertType.Sound);
  });

  it('disables reminder when at-time alert is set to Off', () => {
    // First verify reminder is enabled
    expect(getReminderAlertType(ScheduleType.Standard, 0)).toBe(AlertType.Sound);

    // Disable at-time alert
    setPrayerAlertType(ScheduleType.Standard, 0, AlertType.Off);

    // Reminder should also be disabled
    expect(getReminderAlertType(ScheduleType.Standard, 0)).toBe(AlertType.Off);
  });

  it('does not affect reminder when at-time alert is set to Silent', () => {
    // Verify initial state
    expect(getReminderAlertType(ScheduleType.Standard, 0)).toBe(AlertType.Sound);

    // Set at-time to Silent
    setPrayerAlertType(ScheduleType.Standard, 0, AlertType.Silent);

    // Reminder should remain Sound
    expect(getReminderAlertType(ScheduleType.Standard, 0)).toBe(AlertType.Sound);
  });

  it('does not affect reminder when at-time alert is set to Sound', () => {
    // Set reminder to Silent first
    store.set(standardReminderAlertAtoms[0], AlertType.Silent);

    // Set at-time to Sound
    setPrayerAlertType(ScheduleType.Standard, 0, AlertType.Sound);

    // Reminder should remain Silent
    expect(getReminderAlertType(ScheduleType.Standard, 0)).toBe(AlertType.Silent);
  });
});

// =============================================================================
// BACKGROUND TASK TESTS
// ADR-007: Background Task Notification Refresh
// =============================================================================

describe('registerBackgroundTask', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('checks system status before registering', async () => {
    await registerBackgroundTask();

    expect(BackgroundTask.getStatusAsync).toHaveBeenCalled();
  });

  it('skips registration when background tasks are restricted', async () => {
    (BackgroundTask.getStatusAsync as jest.Mock).mockResolvedValueOnce(BackgroundTask.BackgroundTaskStatus.Restricted);

    await registerBackgroundTask();

    expect(BackgroundTask.registerTaskAsync).not.toHaveBeenCalled();
  });

  it('checks if task is already registered', async () => {
    await registerBackgroundTask();

    expect(TaskManager.isTaskRegisteredAsync).toHaveBeenCalledWith(BACKGROUND_TASK_NAME);
  });

  it('skips registration when task is already registered', async () => {
    (TaskManager.isTaskRegisteredAsync as jest.Mock).mockResolvedValueOnce(true);

    await registerBackgroundTask();

    expect(BackgroundTask.registerTaskAsync).not.toHaveBeenCalled();
  });

  it('registers task with correct name and interval', async () => {
    (TaskManager.isTaskRegisteredAsync as jest.Mock).mockResolvedValueOnce(false);

    await registerBackgroundTask();

    expect(BackgroundTask.registerTaskAsync).toHaveBeenCalledWith(BACKGROUND_TASK_NAME, {
      minimumInterval: BACKGROUND_TASK_INTERVAL_HOURS * 60 * 60,
    });
  });

  it('does not throw when registration fails', async () => {
    (BackgroundTask.registerTaskAsync as jest.Mock).mockRejectedValueOnce(new Error('Registration failed'));

    // Should not throw
    await expect(registerBackgroundTask()).resolves.toBeUndefined();
  });
});

describe('unregisterBackgroundTask', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('checks if task is registered before unregistering', async () => {
    await unregisterBackgroundTask();

    expect(TaskManager.isTaskRegisteredAsync).toHaveBeenCalledWith(BACKGROUND_TASK_NAME);
  });

  it('skips unregistration when task is not registered', async () => {
    (TaskManager.isTaskRegisteredAsync as jest.Mock).mockResolvedValueOnce(false);

    await unregisterBackgroundTask();

    expect(BackgroundTask.unregisterTaskAsync).not.toHaveBeenCalled();
  });

  it('unregisters task when it is registered', async () => {
    (TaskManager.isTaskRegisteredAsync as jest.Mock).mockResolvedValueOnce(true);

    await unregisterBackgroundTask();

    expect(BackgroundTask.unregisterTaskAsync).toHaveBeenCalledWith(BACKGROUND_TASK_NAME);
  });

  it('does not throw when unregistration fails', async () => {
    (TaskManager.isTaskRegisteredAsync as jest.Mock).mockResolvedValueOnce(true);
    (BackgroundTask.unregisterTaskAsync as jest.Mock).mockRejectedValueOnce(new Error('Unregistration failed'));

    // Should not throw
    await expect(unregisterBackgroundTask()).resolves.toBeUndefined();
  });
});

describe('getBackgroundTaskStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns registration status and system status', async () => {
    (TaskManager.isTaskRegisteredAsync as jest.Mock).mockResolvedValueOnce(true);
    (BackgroundTask.getStatusAsync as jest.Mock).mockResolvedValueOnce(BackgroundTask.BackgroundTaskStatus.Available);

    const status = await getBackgroundTaskStatus();

    expect(status.isRegistered).toBe(true);
    expect(status.systemStatus).toBe(BackgroundTask.BackgroundTaskStatus.Available);
    expect(status.systemStatusLabel).toBe('Available');
  });

  it('returns Restricted label when system status is restricted', async () => {
    (TaskManager.isTaskRegisteredAsync as jest.Mock).mockResolvedValueOnce(false);
    (BackgroundTask.getStatusAsync as jest.Mock).mockResolvedValueOnce(BackgroundTask.BackgroundTaskStatus.Restricted);

    const status = await getBackgroundTaskStatus();

    expect(status.isRegistered).toBe(false);
    expect(status.systemStatusLabel).toBe('Restricted');
  });

  it('returns error status when check fails', async () => {
    (TaskManager.isTaskRegisteredAsync as jest.Mock).mockRejectedValueOnce(new Error('Check failed'));

    const status = await getBackgroundTaskStatus();

    expect(status.isRegistered).toBe(false);
    expect(status.systemStatusLabel).toBe('Error');
  });
});

describe('rescheduleAllNotificationsFromBackground', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getDefaultStore } = require('jotai/vanilla');
  const store = getDefaultStore();

  beforeEach(() => {
    jest.clearAllMocks();
    store.set(lastNotificationScheduleAtom, 0);
  });

  it('updates lastNotificationScheduleAtom on success', async () => {
    const beforeCall = Date.now();

    await rescheduleAllNotificationsFromBackground();

    const lastSchedule = store.get(lastNotificationScheduleAtom);
    expect(lastSchedule).toBeGreaterThanOrEqual(beforeCall);
  });

  it('does not check shouldRescheduleNotifications (always reschedules)', async () => {
    // Set a very recent schedule time
    store.set(lastNotificationScheduleAtom, Date.now());

    const beforeCall = Date.now();

    // Should still reschedule despite recent schedule
    await rescheduleAllNotificationsFromBackground();

    const lastSchedule = store.get(lastNotificationScheduleAtom);
    expect(lastSchedule).toBeGreaterThanOrEqual(beforeCall);
  });
});

// =============================================================================
// BACKGROUND TASK CONSTANTS TESTS
// =============================================================================

describe('Background task constants', () => {
  it('BACKGROUND_TASK_NAME is defined', () => {
    expect(BACKGROUND_TASK_NAME).toBe('NOTIFICATION_REFRESH_TASK');
  });

  it('BACKGROUND_TASK_INTERVAL_HOURS is 3 hours', () => {
    expect(BACKGROUND_TASK_INTERVAL_HOURS).toBe(3);
  });

  it('foreground and background intervals are offset (not equal)', () => {
    // ADR-007: Intervals are offset to reduce collision risk
    expect(NOTIFICATION_REFRESH_HOURS).not.toBe(BACKGROUND_TASK_INTERVAL_HOURS);
  });

  it('background interval is above Android minimum (15 min)', () => {
    const backgroundIntervalMinutes = BACKGROUND_TASK_INTERVAL_HOURS * 60;
    expect(backgroundIntervalMinutes).toBeGreaterThan(15);
  });
});

// =============================================================================
// RESCHEDULE STRATEGY (issue #15: zero-notification window)
// =============================================================================

describe('reschedule strategy (issue #15: zero-notification window)', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getDefaultStore } = require('jotai/vanilla');
  const store = getDefaultStore();

  // Frozen at 09:00 London (BST) on Saturday 2026-08-29 — deterministic
  // genNextXDays window [2026-08-29, 2026-08-30] and future-safe seed times.
  const FROZEN_NOW = new Date('2026-08-29T08:00:00Z');
  const TODAY = '2026-08-29';
  const TOMORROW = '2026-08-30';
  const YESTERDAY = '2026-08-28';
  const SEED_TIME = '12:00'; // 3h after frozen now — future for at-time and reminders

  // In-memory OS model: identifier-keyed pending notifications with the same
  // replace/cancel semantics the platform notification centers provide.
  const osState = new Set<string>();

  const scheduleMock = Notifications.scheduleNotificationAsync as jest.Mock;
  const cancelMock = Notifications.cancelScheduledNotificationAsync as jest.Mock;
  const getAllMock = Notifications.getAllScheduledNotificationsAsync as jest.Mock;
  const cancelAllMock = Notifications.cancelAllScheduledNotificationsAsync as jest.Mock;

  const fajrId = (date: string) => prayerNotificationIdentifier(ScheduleType.Standard, 'Fajr', date);
  const fajrReminderId = (date: string, interval: number) =>
    reminderNotificationIdentifier(ScheduleType.Standard, 'Fajr', date, interval as ReminderInterval);

  const seedPrayerDay = (date: string, time = SEED_TIME) => {
    const prayer: ISingleApiResponseTransformed = {
      date,
      fajr: time,
      sunrise: time,
      dhuhr: time,
      asr: time,
      magrib: time,
      isha: time,
      midnight: time,
      'last third': time,
      suhoor: time,
      duha: time,
      istijaba: time,
    };
    Database.database.set(`prayer_${date}`, JSON.stringify(prayer));
  };

  const seedPrayerWindow = () => {
    seedPrayerDay(TODAY);
    seedPrayerDay(TOMORROW);
  };

  const notificationRecord = (id: string, englishName = 'Fajr'): ScheduledNotification => ({
    id,
    date: TODAY,
    time: SEED_TIME,
    englishName,
    arabicName: 'الفجر',
    alertType: AlertType.Sound,
  });

  const seedRecords = (ids: string[]) => {
    ids.forEach((id) => {
      Database.addOneScheduledNotificationForPrayer(ScheduleType.Standard, 0, notificationRecord(id));
    });
  };

  const seedReminderRecords = (ids: string[]) => {
    ids.forEach((id) => {
      Database.addOneScheduledReminderForPrayer(ScheduleType.Standard, 0, notificationRecord(id));
    });
  };

  const enableFajrAlerts = (atTime: AlertType, reminder: AlertType = AlertType.Off) => {
    store.set(standardPrayerAlertAtoms[0], atTime);
    store.set(standardReminderAlertAtoms[0], reminder);
  };

  const osIdentifiers = () => Array.from(osState).sort();

  const cancelCalls = () => cancelMock.mock.calls.map((call) => call[0] as string);

  const orderOfLastCallWith = (mock: jest.Mock, arg: string) => {
    const calls = mock.mock.calls.map((call) => call[0]);
    const index = calls.lastIndexOf(arg);
    return mock.mock.invocationCallOrder[index];
  };

  const orderOfLastScheduleWith = (identifier: string) => {
    const calls = scheduleMock.mock.calls.map((call) => (call[0] as { identifier: string }).identifier);
    const index = calls.lastIndexOf(identifier);
    return scheduleMock.mock.invocationCallOrder[index];
  };

  const maxScheduleOrder = () => Math.max(0, ...scheduleMock.mock.invocationCallOrder);

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FROZEN_NOW);

    osState.clear();
    Database.database.clearAll();
    jest.clearAllMocks();

    [standardPrayerAlertAtoms, extraPrayerAlertAtoms, standardReminderAlertAtoms, extraReminderAlertAtoms].forEach(
      (atoms) => {
        atoms.forEach((atom) => {
          store.set(atom, AlertType.Off);
        });
      }
    );
    [standardReminderIntervalAtoms, extraReminderIntervalAtoms].forEach((atoms) => {
      atoms.forEach((atom) => {
        store.set(atom, DEFAULT_REMINDER_INTERVAL);
      });
    });
    store.set(lastNotificationScheduleAtom, 0);
    store.set(soundPreferenceAtom, 0);

    scheduleMock.mockImplementation(({ identifier }: { identifier: string }) => {
      osState.add(identifier);
      return Promise.resolve(identifier);
    });
    cancelMock.mockImplementation((id: string) => {
      osState.delete(id);
      return Promise.resolve(undefined);
    });
    getAllMock.mockImplementation(() => Promise.resolve(Array.from(osState).map((identifier) => ({ identifier }))));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    scheduleMock.mockResolvedValue('mock-notification-id');
    cancelMock.mockResolvedValue(undefined);
    getAllMock.mockResolvedValue([]);
  });

  // -- global ordering guarantees --------------------------------------------

  it('never bulk-cancels or bulk-wipes during a global reschedule', async () => {
    const scheduleWipe = jest.spyOn(Database, 'clearAllScheduledNotificationsForSchedule');
    const reminderWipe = jest.spyOn(Database, 'clearAllScheduledRemindersForSchedule');

    enableFajrAlerts(AlertType.Sound);
    seedPrayerWindow();

    await rescheduleAllNotifications();

    expect(cancelAllMock).not.toHaveBeenCalled();
    expect(scheduleWipe).not.toHaveBeenCalled();
    expect(reminderWipe).not.toHaveBeenCalled();
  });

  it('never bulk-cancels via refreshNotifications or the background reschedule', async () => {
    enableFajrAlerts(AlertType.Sound);
    seedPrayerWindow();

    await refreshNotifications();
    expect(cancelAllMock).not.toHaveBeenCalled();

    await rescheduleAllNotificationsFromBackground();
    expect(cancelAllMock).not.toHaveBeenCalled();
  });

  it('re-schedules identical identifiers without a single cancel (zero window)', async () => {
    enableFajrAlerts(AlertType.Sound);
    seedPrayerWindow();

    const todayId = fajrId(TODAY);
    const tomorrowId = fajrId(TOMORROW);
    seedRecords([todayId, tomorrowId]);
    osState.add(todayId);
    osState.add(tomorrowId);

    await rescheduleAllNotifications();

    expect(cancelMock).not.toHaveBeenCalled();
    expect(osIdentifiers()).toEqual([todayId, tomorrowId].sort());

    const recordIds = Database.getAllScheduledNotificationsForPrayer(ScheduleType.Standard, 0)
      .map((record) => record.id)
      .sort();
    expect(recordIds).toEqual([todayId, tomorrowId].sort());
  });

  it('cancels rolled-out window days only after the new window is scheduled', async () => {
    enableFajrAlerts(AlertType.Sound);
    seedPrayerWindow();

    const yesterdayId = fajrId(YESTERDAY);
    const todayId = fajrId(TODAY);
    const tomorrowId = fajrId(TOMORROW);
    seedRecords([yesterdayId, todayId]);
    osState.add(yesterdayId);
    osState.add(todayId);

    await rescheduleAllNotifications();

    expect(osIdentifiers()).toEqual([todayId, tomorrowId].sort());

    const staleCancelOrder = orderOfLastCallWith(cancelMock, yesterdayId);
    expect(staleCancelOrder).toBeGreaterThan(0);
    expect(staleCancelOrder).toBeGreaterThan(maxScheduleOrder());
  });

  // -- failure resilience ------------------------------------------------------

  it('keeps the existing OS notification alive when re-scheduling it fails', async () => {
    enableFajrAlerts(AlertType.Sound);
    seedPrayerWindow();

    const todayId = fajrId(TODAY);
    const tomorrowId = fajrId(TOMORROW);
    seedRecords([todayId, tomorrowId]);
    osState.add(todayId);
    osState.add(tomorrowId);

    scheduleMock.mockImplementation(({ identifier }: { identifier: string }) => {
      if (identifier === tomorrowId) return Promise.reject(new Error('OS refused'));
      osState.add(identifier);
      return Promise.resolve(identifier);
    });

    await rescheduleAllNotifications();

    // The failed identifier was never cancelled — its previous alarm survives
    expect(osState.has(tomorrowId)).toBe(true);
    expect(cancelCalls()).not.toContain(tomorrowId);

    // Bookkeeping records it so the sweep does not remove it either
    const recordIds = Database.getAllScheduledNotificationsForPrayer(ScheduleType.Standard, 0).map(
      (record) => record.id
    );
    expect(recordIds).toContain(tomorrowId);
    expect(logger.error).toHaveBeenCalled();
  });

  it('keeps the existing OS reminder alive when re-scheduling it fails', async () => {
    enableFajrAlerts(AlertType.Sound, AlertType.Sound);
    seedPrayerWindow();

    const oldTodayId = fajrReminderId(TODAY, DEFAULT_REMINDER_INTERVAL);
    seedReminderRecords([oldTodayId]);
    osState.add(oldTodayId);

    scheduleMock.mockImplementation(({ identifier }: { identifier: string }) => {
      if (identifier === oldTodayId) return Promise.reject(new Error('OS refused'));
      osState.add(identifier);
      return Promise.resolve(identifier);
    });

    await rescheduleAllNotifications();

    expect(osState.has(oldTodayId)).toBe(true);

    const reminderIds = Database.getAllScheduledRemindersForPrayer(ScheduleType.Standard, 0).map((record) => record.id);
    expect(reminderIds).toContain(oldTodayId);
  });

  // -- reminders ---------------------------------------------------------------

  it('schedules the new reminder interval before cancelling the old one', async () => {
    enableFajrAlerts(AlertType.Sound, AlertType.Sound);
    store.set(standardReminderIntervalAtoms[0], 10);
    seedPrayerWindow();

    const oldTodayId = fajrReminderId(TODAY, 5);
    const newTodayId = fajrReminderId(TODAY, 10);
    const oldTomorrowId = fajrReminderId(TOMORROW, 5);
    seedReminderRecords([oldTodayId, oldTomorrowId]);
    osState.add(oldTodayId);
    osState.add(oldTomorrowId);

    await rescheduleAllNotifications();

    expect(osState.has(newTodayId)).toBe(true);
    expect(osState.has(oldTodayId)).toBe(false);

    const oldCancelOrder = orderOfLastCallWith(cancelMock, oldTodayId);
    const newScheduleOrder = orderOfLastScheduleWith(newTodayId);
    expect(oldCancelOrder).toBeGreaterThan(newScheduleOrder);
  });

  it('cancels reminder records whose reminder time already passed (skipped days)', async () => {
    enableFajrAlerts(AlertType.Sound, AlertType.Sound);
    seedPrayerDay(TODAY, '09:03'); // reminder 08:58 < now 09:00 → skipped
    seedPrayerDay(TOMORROW);

    const oldTodayId = fajrReminderId(TODAY, DEFAULT_REMINDER_INTERVAL);
    const tomorrowId = fajrReminderId(TOMORROW, DEFAULT_REMINDER_INTERVAL);
    seedReminderRecords([oldTodayId]);
    osState.add(oldTodayId);

    await rescheduleAllNotifications();

    expect(osState.has(oldTodayId)).toBe(false);
    expect(osState.has(tomorrowId)).toBe(true);
  });

  // -- sweep -------------------------------------------------------------------

  it('sweeps OS notifications of prayers the user turned off', async () => {
    enableFajrAlerts(AlertType.Sound);
    seedPrayerWindow();

    const strayDhuhrId = prayerNotificationIdentifier(ScheduleType.Standard, 'Dhuhr', TODAY);
    osState.add(strayDhuhrId);

    await rescheduleAllNotifications();

    expect(osState.has(strayDhuhrId)).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith('NOTIFICATION: Sweep found stale OS notifications:', expect.anything());
  });

  it('heals the post-upgrade state: empty records, populated OS', async () => {
    enableFajrAlerts(AlertType.Sound);
    seedPrayerWindow();

    // clearUpgradeCache wipes scheduled_* records; the OS keeps its notifications
    osState.add('legacy-uuid-1');
    osState.add('legacy-uuid-2');
    const staleDhuhrId = prayerNotificationIdentifier(ScheduleType.Standard, 'Dhuhr', TOMORROW);
    osState.add(staleDhuhrId);

    await rescheduleAllNotifications();

    const todayId = fajrId(TODAY);
    const tomorrowId = fajrId(TOMORROW);
    expect(osIdentifiers()).toEqual([todayId, tomorrowId].sort());
    expect(osState.has('legacy-uuid-1')).toBe(false);
    expect(osState.has('legacy-uuid-2')).toBe(false);

    const recordIds = Database.getAllScheduledNotificationsForPrayer(ScheduleType.Standard, 0)
      .map((record) => record.id)
      .sort();
    expect(recordIds).toEqual([todayId, tomorrowId].sort());
  });

  it('logs a post-reschedule verification count', async () => {
    enableFajrAlerts(AlertType.Sound);
    seedPrayerWindow();

    await rescheduleAllNotifications();

    expect(logger.info).toHaveBeenCalledWith('NOTIFICATION: Post-reschedule verification:', {
      dbRecords: 2,
      osPending: 2,
      staleCancelled: 0,
    });
  });

  it('surfaces a sweep failure instead of silently losing verification', async () => {
    enableFajrAlerts(AlertType.Sound);
    seedPrayerWindow();

    getAllMock.mockRejectedValue(new Error('OS query failed'));

    await expect(rescheduleAllNotifications()).rejects.toThrow('OS query failed');
    expect(logger.error).toHaveBeenCalled();
  });

  it('clears notifications of prayers whose alert is off (heals interrupted settings commit)', async () => {
    enableFajrAlerts(AlertType.Sound);
    seedPrayerWindow();

    // Alert was turned off but the process died before its notifications were
    // cancelled — records and OS notifications both still present
    const dhuhrTodayId = prayerNotificationIdentifier(ScheduleType.Standard, 'Dhuhr', TODAY);
    Database.addOneScheduledNotificationForPrayer(ScheduleType.Standard, 2, notificationRecord(dhuhrTodayId, 'Dhuhr'));
    osState.add(dhuhrTodayId);

    await rescheduleAllNotifications();

    expect(osState.has(dhuhrTodayId)).toBe(false);
    expect(Database.getAllScheduledNotificationsForPrayer(ScheduleType.Standard, 2)).toHaveLength(0);
  });

  it('clears reminders when the reminder alert is off but at-time stays on', async () => {
    enableFajrAlerts(AlertType.Sound, AlertType.Sound);
    seedPrayerWindow();

    // Reminder turned off after reminders were already scheduled
    const reminderId = fajrReminderId(TODAY, DEFAULT_REMINDER_INTERVAL);
    seedReminderRecords([reminderId]);
    osState.add(reminderId);
    store.set(standardReminderAlertAtoms[0], AlertType.Off);

    await rescheduleAllNotifications();

    expect(osState.has(reminderId)).toBe(false);
    expect(Database.getAllScheduledRemindersForPrayer(ScheduleType.Standard, 0)).toHaveLength(0);

    // The at-time notification survives
    expect(osState.has(fajrId(TODAY))).toBe(true);
  });

  // -- single-prayer toggle path ----------------------------------------------

  it('updatePrayerNotifications replaces in place without cancelling live identifiers', async () => {
    seedPrayerWindow();
    const todayId = fajrId(TODAY);
    const tomorrowId = fajrId(TOMORROW);
    seedRecords([todayId, tomorrowId]);
    osState.add(todayId);
    osState.add(tomorrowId);

    await updatePrayerNotifications(ScheduleType.Standard, 0, 'Fajr', 'الفجر', AlertType.Sound, AlertType.Off);

    expect(cancelMock).not.toHaveBeenCalled();
    expect(osIdentifiers()).toEqual([todayId, tomorrowId].sort());
  });

  it('updatePrayerNotifications turning alerts off cancels only that prayer', async () => {
    seedPrayerWindow();
    const todayId = fajrId(TODAY);
    const ishaTodayId = prayerNotificationIdentifier(ScheduleType.Standard, 'Isha', TODAY);
    seedRecords([todayId]);
    Database.addOneScheduledNotificationForPrayer(ScheduleType.Standard, 5, notificationRecord(ishaTodayId, 'Isha'));
    osState.add(todayId);
    osState.add(ishaTodayId);

    await updatePrayerNotifications(ScheduleType.Standard, 0, 'Fajr', 'الفجر', AlertType.Off, AlertType.Off);

    expect(osState.has(todayId)).toBe(false);
    expect(osState.has(ishaTodayId)).toBe(true);
  });

  // -- extras ------------------------------------------------------------------

  it('schedules the Extra schedule through the same strategy', async () => {
    store.set(extraPrayerAlertAtoms[3], AlertType.Silent); // Duha
    seedPrayerWindow();

    await rescheduleAllNotifications();

    const duhaTodayId = prayerNotificationIdentifier(ScheduleType.Extra, 'Duha', TODAY);
    const duhaTomorrowId = prayerNotificationIdentifier(ScheduleType.Extra, 'Duha', TOMORROW);
    expect(osState.has(duhaTodayId)).toBe(true);
    expect(osState.has(duhaTomorrowId)).toBe(true);
    expect(cancelAllMock).not.toHaveBeenCalled();
  });
});
