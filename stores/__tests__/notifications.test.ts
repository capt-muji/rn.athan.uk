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
import * as TaskManager from 'expo-task-manager';
import { createStore } from 'jotai';

import {
  PRAYERS_ENGLISH,
  PRAYERS_ARABIC,
  EXTRAS_ENGLISH,
  EXTRAS_ARABIC,
  NOTIFICATION_REFRESH_HOURS,
  DEFAULT_REMINDER_INTERVAL,
  BACKGROUND_TASK_NAME,
  BACKGROUND_TASK_INTERVAL_HOURS,
} from '@/shared/constants';
import { AlertType, ScheduleType } from '@/shared/types';
import {
  getPrayerArrays,
  createPrayerAlertAtom,
  standardPrayerAlertAtoms,
  extraPrayerAlertAtoms,
  soundPreferenceAtom,
  getPrayerAlertAtom,
  shouldRescheduleNotifications,
  lastNotificationScheduleAtom,
  createReminderAlertAtom,
  createReminderIntervalAtom,
  standardReminderAlertAtoms,
  extraReminderAlertAtoms,
  standardReminderIntervalAtoms,
  extraReminderIntervalAtoms,
  getReminderAlertAtom,
  getReminderIntervalAtom,
  setPrayerAlertType,
  getReminderAlertType,
  registerBackgroundTask,
  unregisterBackgroundTask,
  getBackgroundTaskStatus,
  rescheduleAllNotificationsFromBackground,
} from '@/stores/notifications';

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
    const atom = createPrayerAlertAtom(ScheduleType.Standard, 0);
    expect(atom).toBeDefined();
  });

  it('creates atom for Extra schedule prayer', () => {
    const atom = createPrayerAlertAtom(ScheduleType.Extra, 0);
    expect(atom).toBeDefined();
  });

  it('creates atoms with default value of 0 (AlertType.Off)', () => {
    const store = createStore();
    const atom = createPrayerAlertAtom(ScheduleType.Standard, 0);
    const value = store.get(atom);
    expect(value).toBe(0); // AlertType.Off
  });

  it('creates different atoms for different prayers', () => {
    const atom1 = createPrayerAlertAtom(ScheduleType.Standard, 0);
    const atom2 = createPrayerAlertAtom(ScheduleType.Standard, 1);

    // They should be different atom instances
    expect(atom1).not.toBe(atom2);
  });

  it('creates different atoms for different schedule types', () => {
    const standardAtom = createPrayerAlertAtom(ScheduleType.Standard, 0);
    const extraAtom = createPrayerAlertAtom(ScheduleType.Extra, 0);

    expect(standardAtom).not.toBe(extraAtom);
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
    const atom = createReminderAlertAtom(ScheduleType.Standard, 0);
    expect(atom).toBeDefined();
  });

  it('creates atom for Extra schedule prayer', () => {
    const atom = createReminderAlertAtom(ScheduleType.Extra, 0);
    expect(atom).toBeDefined();
  });

  it('creates atoms with default value of 0 (AlertType.Off)', () => {
    const store = createStore();
    const atom = createReminderAlertAtom(ScheduleType.Standard, 0);
    const value = store.get(atom);
    expect(value).toBe(0); // AlertType.Off
  });

  it('creates different atoms for different prayers', () => {
    const atom1 = createReminderAlertAtom(ScheduleType.Standard, 0);
    const atom2 = createReminderAlertAtom(ScheduleType.Standard, 1);
    expect(atom1).not.toBe(atom2);
  });
});

describe('createReminderIntervalAtom', () => {
  it('creates atom for Standard schedule prayer', () => {
    const atom = createReminderIntervalAtom(ScheduleType.Standard, 0);
    expect(atom).toBeDefined();
  });

  it('creates atom for Extra schedule prayer', () => {
    const atom = createReminderIntervalAtom(ScheduleType.Extra, 0);
    expect(atom).toBeDefined();
  });

  it('creates atoms with default value of DEFAULT_REMINDER_INTERVAL', () => {
    const store = createStore();
    const atom = createReminderIntervalAtom(ScheduleType.Standard, 0);
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
