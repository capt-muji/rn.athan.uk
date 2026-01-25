/**
 * Unit tests for shared/constants.ts
 *
 * Tests prayer name arrays and their relationships to ensure
 * they stay in sync and maintain expected structure.
 */

import {
  PRAYERS_ENGLISH,
  PRAYERS_ARABIC,
  EXTRAS_ENGLISH,
  EXTRAS_ARABIC,
  NIGHT_PRAYER_NAMES,
  ISTIJABA_INDEX,
  EXTRAS_EXPLANATIONS,
  EXTRAS_EXPLANATIONS_ARABIC,
  REMINDER_INTERVALS,
  DEFAULT_REMINDER_INTERVAL,
  REMINDER_BUFFER_SECONDS,
  validateReminderInterval,
} from '../constants';

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
  it('is 15 minutes', () => {
    expect(DEFAULT_REMINDER_INTERVAL).toBe(15);
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
