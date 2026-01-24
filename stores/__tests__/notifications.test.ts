/**
 * Unit tests for stores/notifications.ts
 *
 * Tests notification store helpers and atoms:
 * - getPrayerArrays helper
 * - createPrayerAlertAtom factory
 * - Alert atom arrays (standardPrayerAlertAtoms, extraPrayerAlertAtoms)
 * - shouldRescheduleNotifications logic
 */

import { createStore } from 'jotai';

import {
  PRAYERS_ENGLISH,
  PRAYERS_ARABIC,
  EXTRAS_ENGLISH,
  EXTRAS_ARABIC,
  NOTIFICATION_REFRESH_HOURS,
} from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import {
  getPrayerArrays,
  createPrayerAlertAtom,
  standardPrayerAlertAtoms,
  extraPrayerAlertAtoms,
  soundPreferenceAtom,
  getPrayerAlertAtom,
  shouldRescheduleNotifications,
  lastNotificationScheduleAtom,
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
// - Refresh every NOTIFICATION_REFRESH_HOURS (12 hours)
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
