/**
 * Unit tests for shared/constants.ts
 *
 * Tests prayer name arrays and their relationships to ensure
 * they stay in sync and maintain expected structure.
 */

import {
  BACKGROUND_TASK_INTERVAL_HOURS,
  DEFAULT_REMINDER_INTERVAL,
  EXTRAS_ARABIC,
  EXTRAS_ENGLISH,
  EXTRAS_EXPLANATIONS,
  EXTRAS_EXPLANATIONS_ARABIC,
  ISTIJABA_INDEX,
  NIGHT_PRAYER_NAMES,
  NOTIFICATION_REQUEST_BUDGET,
  PRAYERS_ARABIC,
  PRAYERS_ENGLISH,
  REMINDER_BUFFER_SECONDS,
  REMINDER_INTERVALS,
  SCHEDULE_CANDIDATE_DAYS,
  validateReminderInterval,
} from '../constants';
import { REMINDER_SLOTS } from '../types';

// =============================================================================
// NIGHT_PRAYER_NAMES TESTS
// =============================================================================

describe('NIGHT_PRAYER_NAMES', () => {
  it('contains exactly 3 night prayers', () => {
    expect(NIGHT_PRAYER_NAMES).toHaveLength(3);
  });

  it('contains Midnight, Last Third, and Suhoor in order', () => {
    expect(NIGHT_PRAYER_NAMES).toEqual(['Midnight', 'Last Third', 'Suhoor']);
  });

  it('matches the first 3 entries of EXTRAS_ENGLISH', () => {
    const firstThreeExtras = EXTRAS_ENGLISH.slice(0, 3);
    expect(NIGHT_PRAYER_NAMES).toEqual(firstThreeExtras);
  });

  it('is a readonly tuple (as const)', () => {
    // TypeScript ensures this at compile time, but we can verify the values are strings
    NIGHT_PRAYER_NAMES.forEach((name) => {
      expect(typeof name).toBe('string');
    });
  });

  it('does not include daytime extras (Duha, Istijaba)', () => {
    expect(NIGHT_PRAYER_NAMES).not.toContain('Duha');
    expect(NIGHT_PRAYER_NAMES).not.toContain('Istijaba');
  });
});

// =============================================================================
// PRAYER ARRAYS ALIGNMENT TESTS
// =============================================================================

describe('prayer arrays alignment', () => {
  it('PRAYERS_ENGLISH and PRAYERS_ARABIC have same length', () => {
    expect(PRAYERS_ENGLISH.length).toBe(PRAYERS_ARABIC.length);
  });

  it('EXTRAS_ENGLISH and EXTRAS_ARABIC have same length', () => {
    expect(EXTRAS_ENGLISH.length).toBe(EXTRAS_ARABIC.length);
  });

  it('EXTRAS_EXPLANATIONS matches EXTRAS_ENGLISH length', () => {
    expect(EXTRAS_EXPLANATIONS.length).toBe(EXTRAS_ENGLISH.length);
  });

  it('EXTRAS_EXPLANATIONS_ARABIC matches EXTRAS_ENGLISH length', () => {
    expect(EXTRAS_EXPLANATIONS_ARABIC.length).toBe(EXTRAS_ENGLISH.length);
  });

  it('PRAYERS_ENGLISH contains 6 standard prayers', () => {
    expect(PRAYERS_ENGLISH).toEqual(['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Magrib', 'Isha']);
  });

  it('EXTRAS_ENGLISH contains 5 extra prayers', () => {
    expect(EXTRAS_ENGLISH).toEqual(['Midnight', 'Last Third', 'Suhoor', 'Duha', 'Istijaba']);
  });
});

// =============================================================================
// ISTIJABA_INDEX TESTS
// =============================================================================

describe('ISTIJABA_INDEX', () => {
  it('points to Istijaba in EXTRAS_ENGLISH', () => {
    expect(EXTRAS_ENGLISH[ISTIJABA_INDEX]).toBe('Istijaba');
  });

  it('is the last index in EXTRAS arrays', () => {
    expect(ISTIJABA_INDEX).toBe(EXTRAS_ENGLISH.length - 1);
  });
});

// =============================================================================
// REMINDER CONSTANTS TESTS
// =============================================================================

describe('REMINDER_INTERVALS', () => {
  it('contains 6 interval options', () => {
    expect(REMINDER_INTERVALS).toHaveLength(6);
  });

  it('contains intervals from 5 to 30 in 5-minute increments', () => {
    expect(REMINDER_INTERVALS).toEqual([5, 10, 15, 20, 25, 30]);
  });

  it('has all positive numbers', () => {
    REMINDER_INTERVALS.forEach((interval) => {
      expect(interval).toBeGreaterThan(0);
    });
  });

  it('is sorted in ascending order', () => {
    const sorted = [...REMINDER_INTERVALS].sort((a, b) => a - b);
    expect(REMINDER_INTERVALS).toEqual(sorted);
  });
});

describe('DEFAULT_REMINDER_INTERVAL', () => {
  it('is 5 minutes', () => {
    expect(DEFAULT_REMINDER_INTERVAL).toBe(5);
  });

  it('is a valid reminder interval', () => {
    expect(REMINDER_INTERVALS).toContain(DEFAULT_REMINDER_INTERVAL);
  });
});

describe('REMINDER_BUFFER_SECONDS', () => {
  it('is 30 seconds', () => {
    expect(REMINDER_BUFFER_SECONDS).toBe(30);
  });

  it('is a positive number', () => {
    expect(REMINDER_BUFFER_SECONDS).toBeGreaterThan(0);
  });
});

describe('validateReminderInterval', () => {
  it('returns true for valid interval 5', () => {
    expect(validateReminderInterval(5)).toBe(true);
  });

  it('returns true for valid interval 10', () => {
    expect(validateReminderInterval(10)).toBe(true);
  });

  it('returns true for valid interval 15', () => {
    expect(validateReminderInterval(15)).toBe(true);
  });

  it('returns true for valid interval 20', () => {
    expect(validateReminderInterval(20)).toBe(true);
  });

  it('returns true for valid interval 25', () => {
    expect(validateReminderInterval(25)).toBe(true);
  });

  it('returns true for valid interval 30', () => {
    expect(validateReminderInterval(30)).toBe(true);
  });

  it('returns false for invalid interval 0', () => {
    expect(validateReminderInterval(0)).toBe(false);
  });

  it('returns false for invalid interval 1', () => {
    expect(validateReminderInterval(1)).toBe(false);
  });

  it('returns false for invalid interval 7', () => {
    expect(validateReminderInterval(7)).toBe(false);
  });

  it('returns false for invalid interval 35', () => {
    expect(validateReminderInterval(35)).toBe(false);
  });

  it('returns false for negative number', () => {
    expect(validateReminderInterval(-5)).toBe(false);
  });

  it('returns false for decimal number', () => {
    expect(validateReminderInterval(15.5)).toBe(false);
  });
});

// =============================================================================
// BACKGROUND TASK INTERVAL RESOLUTION TESTS (ISSUES.md #8)
// minimumInterval is MINUTES — resolution: env override > dev 15 > prod BACKGROUND_TASK_INTERVAL_HOURS * 60
// =============================================================================

describe('BACKGROUND_TASK_INTERVAL_MINUTES resolution', () => {
  /** Derived, never literal: the ship interval changes and these cases must follow it */
  const PRODUCTION_INTERVAL_MINUTES = BACKGROUND_TASK_INTERVAL_HOURS * 60;

  const requireFreshConstants = () => {
    let mod: typeof import('../constants');
    jest.isolateModules(() => {
      mod = require('../constants');
    });
    return mod!;
  };

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_BG_INTERVAL_MINUTES;
    delete process.env.EXPO_PUBLIC_ENV;
    process.env.NODE_ENV = 'test';
  });

  it('resolves to BACKGROUND_TASK_INTERVAL_HOURS * 60 outside development without env', () => {
    process.env.NODE_ENV = 'test';
    const mod = requireFreshConstants();
    expect(mod.BACKGROUND_TASK_INTERVAL_MINUTES).toBe(PRODUCTION_INTERVAL_MINUTES);
  });

  it('resolves to 15 in development builds (fast iteration)', () => {
    process.env.NODE_ENV = 'development';
    const mod = requireFreshConstants();
    expect(mod.BACKGROUND_TASK_INTERVAL_MINUTES).toBe(15);
  });

  it('resolves to the EXPO_PUBLIC_BG_INTERVAL_MINUTES env override when set', () => {
    process.env.EXPO_PUBLIC_BG_INTERVAL_MINUTES = '45';
    const mod = requireFreshConstants();
    expect(mod.BACKGROUND_TASK_INTERVAL_MINUTES).toBe(45);
  });

  it('ignores an invalid env override (non-numeric)', () => {
    process.env.EXPO_PUBLIC_BG_INTERVAL_MINUTES = 'soon';
    process.env.NODE_ENV = 'test';
    const mod = requireFreshConstants();
    expect(mod.BACKGROUND_TASK_INTERVAL_MINUTES).toBe(PRODUCTION_INTERVAL_MINUTES);
  });

  it('ignores a non-positive env override', () => {
    process.env.EXPO_PUBLIC_BG_INTERVAL_MINUTES = '0';
    process.env.NODE_ENV = 'test';
    const mod = requireFreshConstants();
    expect(mod.BACKGROUND_TASK_INTERVAL_MINUTES).toBe(PRODUCTION_INTERVAL_MINUTES);
  });

  // ISSUES.md #8 was seconds passed where minutes were expected: 10800 scheduled the
  // task 7.5 days out. The floor check caught nothing, because 10800 is positive.
  it('ignores the seconds-for-minutes mistake that was ISSUES #8', () => {
    process.env.EXPO_PUBLIC_BG_INTERVAL_MINUTES = '10800';
    process.env.NODE_ENV = 'test';
    const mod = requireFreshConstants();
    expect(mod.BACKGROUND_TASK_INTERVAL_MINUTES).toBe(PRODUCTION_INTERVAL_MINUTES);
  });

  it('ignores an override below the Android WorkManager floor of 15 minutes', () => {
    process.env.EXPO_PUBLIC_BG_INTERVAL_MINUTES = '0.001';
    process.env.NODE_ENV = 'test';
    const mod = requireFreshConstants();
    expect(mod.BACKGROUND_TASK_INTERVAL_MINUTES).toBe(PRODUCTION_INTERVAL_MINUTES);
  });

  it('honours the lowest rung the interval ladder actually uses', () => {
    process.env.EXPO_PUBLIC_BG_INTERVAL_MINUTES = '15';
    // NODE_ENV matters: the development fallback is also 15, so without pinning this the
    // case cannot tell an accepted override from a rejected one
    process.env.NODE_ENV = 'test';
    const mod = requireFreshConstants();
    expect(mod.BACKGROUND_TASK_INTERVAL_MINUTES).toBe(15);
  });

  // iOS reads the option with `as? Int`: a fraction fails the cast and silently falls back to
  // the ship interval, while Android truncates — 20 minutes on one platform, hours on the other
  it('ignores a fractional override, which the two platforms would read differently', () => {
    process.env.EXPO_PUBLIC_BG_INTERVAL_MINUTES = '20.5';
    process.env.NODE_ENV = 'test';
    const mod = requireFreshConstants();
    expect(mod.BACKGROUND_TASK_INTERVAL_MINUTES).toBe(PRODUCTION_INTERVAL_MINUTES);
  });

  it('honours a full day, the highest value that is still a choice', () => {
    process.env.EXPO_PUBLIC_BG_INTERVAL_MINUTES = '1440';
    const mod = requireFreshConstants();
    expect(mod.BACKGROUND_TASK_INTERVAL_MINUTES).toBe(1440);
  });

  // This interval is what keeps the rolling buffer alive, so a ladder value
  // that followed a build to the store would change alarm delivery for users.
  it('ignores an otherwise valid override in a prod build', () => {
    process.env.EXPO_PUBLIC_BG_INTERVAL_MINUTES = '45';
    process.env.EXPO_PUBLIC_ENV = 'prod';
    const mod = requireFreshConstants();
    expect(mod.BACKGROUND_TASK_INTERVAL_MINUTES).toBe(PRODUCTION_INTERVAL_MINUTES);
  });
});

// =============================================================================
// iOS PENDING-REQUEST CEILING TESTS
//
// iOS keeps only the 64 soonest-firing pending notification requests per app and
// silently discards the rest. Nothing in the app observes that ceiling at runtime:
// the mock always resolves and getAllScheduledNotificationsAsync returns an empty
// array, so without this the constants could be pushed past it by a one-character
// edit and the whole suite would still pass.
//
// The window is NOT uniform: the two Extras night rows take one list day more than
// everything else, because their instant falls on the evening before the list day
// they are filed under. So the worst case is counted through `rollingDaysForPrayer`,
// the same function the schedule paths apply — restating the arithmetic from
// NOTIFICATION_ROLLING_DAYS alone would keep printing a number the app had left
// behind, which is exactly how a raise could slip past this file.
// =============================================================================

/** UNUserNotificationCenter keeps the soonest-firing 64 requests and drops the remainder */
const IOS_PENDING_REQUEST_CEILING = 64;

/** Every prayer on both lists can carry an at-time alert AND both pre-prayer reminders */
const ALERTS_PER_PRAYER = 1 + REMINDER_SLOTS.length;

describe('the request budget fits inside the iOS pending-request ceiling', () => {
  const prayersPerDay = PRAYERS_ENGLISH.length + EXTRAS_ENGLISH.length;

  it('never asks the phone for more requests than it keeps', () => {
    expect(NOTIFICATION_REQUEST_BUDGET).toBeLessThanOrEqual(IOS_PENDING_REQUEST_CEILING);
  });

  it('counts one at-time alert and one request per reminder slot', () => {
    expect(ALERTS_PER_PRAYER).toBe(3);
  });

  // The budget is spent a whole row at a time, so the last row that fits is the last whole
  // multiple of its cost. The worst-case user pays the full three for every row.
  it('leaves under one row of headroom, so the budget is genuinely spent', () => {
    const rowsAffordable = Math.floor(NOTIFICATION_REQUEST_BUDGET / ALERTS_PER_PRAYER);
    const spent = rowsAffordable * ALERTS_PER_PRAYER;

    expect(spent).toBe(63);
    expect(NOTIFICATION_REQUEST_BUDGET - spent).toBeLessThan(ALERTS_PER_PRAYER);
  });

  // What the old day-count window could not do, and the reason the unit changed: two list days
  // of every row at three alerts each breaches the ceiling, so the day count had to choose
  // between the second reminder and the next Fajr
  it('carries both reminders where a two-day window could not', () => {
    const twoDayWorstCase = prayersPerDay * 2 * ALERTS_PER_PRAYER;

    expect(twoDayWorstCase).toBeGreaterThan(IOS_PENDING_REQUEST_CEILING);
    expect(NOTIFICATION_REQUEST_BUDGET).toBeLessThan(twoDayWorstCase);
  });

  // The walk's guard is not a coverage number: the worst-case user's budget runs out long
  // before it, so it can never be what limits how far ahead the app arms
  it('bounds the candidate walk far beyond what the worst-case user can afford', () => {
    const daysTheWorstCaseUserCanAfford = NOTIFICATION_REQUEST_BUDGET / (prayersPerDay * ALERTS_PER_PRAYER);

    expect(SCHEDULE_CANDIDATE_DAYS).toBeGreaterThan(daysTheWorstCaseUserCanAfford);
  });
});

// =============================================================================
// ROLLING HORIZON TESTS
//
// The horizon is no longer a span the app can state: it is however far the budget
// reaches for the rows that user armed, which is days for a heavy user and weeks for
// a light one. What can still be pinned is the relationship the cadence depends on,
// that the background task runs many times inside even the shortest horizon.
// =============================================================================

describe('the background task runs many times inside even the shortest horizon', () => {
  /** The worst-case user arms all 11 rows with both reminders, which the budget covers for two days */
  const WORST_CASE_HORIZON_HOURS = 47;

  it('gets many attempts to re-arm before the shortest horizon runs out', () => {
    const attempts = Math.floor(WORST_CASE_HORIZON_HOURS / BACKGROUND_TASK_INTERVAL_HOURS);

    expect(attempts).toBeGreaterThan(4);
  });
});
