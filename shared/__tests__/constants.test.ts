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
  NOTIFICATION_ROLLING_DAYS,
  PRAYERS_ARABIC,
  PRAYERS_ENGLISH,
  REMINDER_BUFFER_SECONDS,
  REMINDER_INTERVALS,
  validateReminderInterval,
} from '../constants';
import { rollingDaysForPrayer } from '../notifications';
import { REMINDER_SLOTS, ScheduleType } from '../types';

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

describe('the rolling buffer fits inside the iOS pending-request ceiling', () => {
  const prayersPerDay = PRAYERS_ENGLISH.length + EXTRAS_ENGLISH.length;

  /** Every list day the app actually arms, summed prayer by prayer through the production rule */
  const listDaysArmed =
    PRAYERS_ENGLISH.reduce((sum, name) => sum + rollingDaysForPrayer(ScheduleType.Standard, name), 0) +
    EXTRAS_ENGLISH.reduce((sum, name) => sum + rollingDaysForPrayer(ScheduleType.Extra, name), 0);

  const worstCase = listDaysArmed * ALERTS_PER_PRAYER;

  /** Rows granted more than the base window, counted from the rule rather than named here */
  const nightRows = EXTRAS_ENGLISH.filter(
    (name) => rollingDaysForPrayer(ScheduleType.Extra, name) > NOTIFICATION_ROLLING_DAYS
  ).length;

  /**
   * The same shape at a hypothetical base window: every prayer for `baseDays`, plus one more
   * day for each night row. Tied to production by the test below, so it cannot drift.
   */
  const worstCaseAt = (baseDays: number) => (prayersPerDay * baseDays + nightRows) * ALERTS_PER_PRAYER;

  it('schedules at most 64 requests with every prayer fully armed', () => {
    expect(worstCase).toBeLessThanOrEqual(IOS_PENDING_REQUEST_CEILING);
  });

  it('pins the arithmetic, so a change to any input has to come through here', () => {
    expect({
      prayersPerDay,
      days: NOTIFICATION_ROLLING_DAYS,
      nightRows,
      worstCase,
      headroom: IOS_PENDING_REQUEST_CEILING - worstCase,
    }).toEqual({
      prayersPerDay: 11,
      days: 1,
      nightRows: 2,
      worstCase: 39,
      headroom: 25,
    });
  });

  it('counts the night-row day through the production rule, not a restatement of it', () => {
    expect(worstCase).toBe(worstCaseAt(NOTIFICATION_ROLLING_DAYS));
  });

  it('grants the extra day to the two evening-before rows and to nothing else', () => {
    const extended = EXTRAS_ENGLISH.filter(
      (name) => rollingDaysForPrayer(ScheduleType.Extra, name) > NOTIFICATION_ROLLING_DAYS
    );
    const standardExtended = PRAYERS_ENGLISH.filter(
      (name) => rollingDaysForPrayer(ScheduleType.Standard, name) > NOTIFICATION_ROLLING_DAYS
    );

    // Suhoor is a night row on the list, but its instant is on its own date: no extra day
    expect(extended).toEqual(['Midnight', 'Last Third']);
    expect(standardExtended).toEqual([]);
  });

  it('shows that one more day would breach the ceiling', () => {
    expect(worstCaseAt(NOTIFICATION_ROLLING_DAYS + 1)).toBeGreaterThan(IOS_PENDING_REQUEST_CEILING);
  });

  // The pairing the owner ruled on: the second reminder is only affordable because the window
  // dropped with it, so a later raise must re-read this rather than assume the old headroom
  it('could not carry a second reminder at the window it replaced', () => {
    const atTwoDays = (prayersPerDay * 2 + nightRows) * ALERTS_PER_PRAYER;

    expect(atTwoDays).toBe(72);
    expect(atTwoDays).toBeGreaterThan(IOS_PENDING_REQUEST_CEILING);
  });

  it('counts one at-time alert and one request per reminder slot', () => {
    expect(ALERTS_PER_PRAYER).toBe(3);
  });
});

// =============================================================================
// ROLLING HORIZON TESTS
//
// The buffer is counted in LIST days, not hours, and at one day that is TODAY'S LIST
// ALONE. So the horizon is not a fixed span: it shrinks through the day and reaches
// zero once the day's last prayer has passed, which is the cost the owner accepted
// when the second reminder took the place of the second day. These pin that shape, so
// a cadence can never again be sized against a span the window does not have.
// =============================================================================

describe('the rolling horizon is one list day, so it shrinks through the day', () => {
  /** Winter worst case from the repo's own fixture: 2024-12-31 is Fajr 06:26, Isha 17:42 */
  const WINTER_FAJR_HOUR = 6 + 26 / 60;
  const WINTER_ISHA_HOUR = 17 + 42 / 60;

  /** A refresh that lands just before midnight reaches the least far */
  const LATEST_REFRESH_HOUR = 23 + 50 / 60;

  /** What today's list still has armed after a refresh at this hour */
  const hoursStillArmed = (refreshHour: number) => Math.max(0, WINTER_ISHA_HOUR - refreshHour);

  it('reaches nothing at all once the day\u2019s last prayer has passed', () => {
    expect(hoursStillArmed(LATEST_REFRESH_HOUR)).toBe(0);
  });

  it('leaves the next morning to the background task alone', () => {
    const hoursToNextFajr = 24 - LATEST_REFRESH_HOUR + WINTER_FAJR_HOUR;
    const attempts = Math.floor(hoursToNextFajr / BACKGROUND_TASK_INTERVAL_HOURS);

    expect(hoursToNextFajr).toBeGreaterThan(BACKGROUND_TASK_INTERVAL_HOURS);
    expect(attempts).toBeGreaterThan(1);
  });

  it('is never the whole day the day count reads like', () => {
    expect(hoursStillArmed(WINTER_FAJR_HOUR)).toBeLessThan(NOTIFICATION_ROLLING_DAYS * 24);
  });
});
