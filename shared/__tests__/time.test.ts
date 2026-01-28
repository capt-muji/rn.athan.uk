import {
  formatTime,
  formatTimeAgo,
  getLastThirdOfNight,
  getMidnightTime,
  isFriday,
  isDecember,
  isJanuaryFirst,
  createLondonDate,
  formatDateLong,
  formatDateShort,
  getSecondsBetween,
  createPrayerDatetime,
  formatHijriDateLong,
  isDateYesterdayOrFuture,
  getCurrentYear,
  adjustTime,
} from '../time';

// =============================================================================
// FORMATTING TESTS
// =============================================================================

describe('formatTime', () => {
  it('returns "0s" for negative seconds', () => {
    expect(formatTime(-100)).toBe('0s');
    expect(formatTime(-1)).toBe('0s');
  });

  it('formats seconds correctly', () => {
    expect(formatTime(0)).toBe('0s');
    expect(formatTime(45)).toBe('45s');
    expect(formatTime(59)).toBe('59s');
  });

  it('formats minutes correctly', () => {
    expect(formatTime(60)).toBe('1m 0s');
    expect(formatTime(90)).toBe('1m 30s');
    expect(formatTime(599)).toBe('9m 59s');
  });

  it('formats hours correctly', () => {
    expect(formatTime(3600)).toBe('1h 0s'); // Minutes omitted when 0
    expect(formatTime(3665)).toBe('1h 1m 5s');
    expect(formatTime(7200)).toBe('2h 0s'); // Minutes omitted when 0
  });

  it('converts days to hours', () => {
    expect(formatTime(90000)).toBe('25h 0s'); // 25 hours, minutes omitted when 0
  });

  describe('hideSeconds option', () => {
    it('shows seconds when hideSeconds=false (default)', () => {
      expect(formatTime(3665)).toBe('1h 1m 5s');
      expect(formatTime(3665, false)).toBe('1h 1m 5s');
    });

    it('hides seconds when hideSeconds=true and time > 599s', () => {
      expect(formatTime(3665, true)).toBe('1h 1m');
      expect(formatTime(600, true)).toBe('10m');
    });

    it('shows seconds in last 10 minutes even with hideSeconds=true', () => {
      expect(formatTime(599, true)).toBe('9m 59s');
      expect(formatTime(45, true)).toBe('45s');
    });
  });
});

describe('formatTimeAgo', () => {
  it('returns "now" for < 60 seconds', () => {
    expect(formatTimeAgo(0)).toBe('now');
    expect(formatTimeAgo(45)).toBe('now');
    expect(formatTimeAgo(59)).toBe('now');
  });

  it('returns "now" for negative seconds', () => {
    expect(formatTimeAgo(-100)).toBe('now');
  });

  it('formats minutes correctly', () => {
    expect(formatTimeAgo(60)).toBe('1m');
    expect(formatTimeAgo(120)).toBe('2m');
    expect(formatTimeAgo(3599)).toBe('59m');
  });

  it('formats hours and minutes correctly', () => {
    expect(formatTimeAgo(3600)).toBe('1h');
    expect(formatTimeAgo(5400)).toBe('1h 30m');
    expect(formatTimeAgo(7200)).toBe('2h');
    expect(formatTimeAgo(7260)).toBe('2h 1m');
  });
});

// =============================================================================
// NIGHT TIME CALCULATIONS (Islamic)
// =============================================================================

describe('getLastThirdOfNight', () => {
  it('calculates last third correctly for winter night', () => {
    // Magrib 18:45, Fajr 06:15 = 11.5h night
    // 2/3 of 11.5h = 7h 40m after Magrib = 02:25
    const result = getLastThirdOfNight('18:45', '06:15');
    expect(result).toBe('02:25');
  });

  it('calculates last third for summer night (short)', () => {
    // Summer: Magrib late, Fajr early (short night)
    // Magrib 21:00, Fajr 03:30 = 6.5h night
    // 2/3 of 6.5h = 4h 20m after Magrib = 01:20
    const result = getLastThirdOfNight('21:00', '03:30');
    expect(result).toBe('01:20');
  });

  it('calculates last third for equinox night (equal)', () => {
    // Magrib 18:00, Fajr 06:00 = 12h night
    // 2/3 of 12h = 8h after Magrib = 02:00
    const result = getLastThirdOfNight('18:00', '06:00');
    expect(result).toBe('02:00');
  });
});

describe('getMidnightTime', () => {
  it('calculates Islamic midnight correctly for winter night', () => {
    // Magrib 18:45, Fajr 06:15 = 11.5h night
    // Midpoint = 5h 45m after Magrib = 00:30
    const result = getMidnightTime('18:45', '06:15');
    expect(result).toBe('00:30');
  });

  it('calculates Islamic midnight for summer night (short)', () => {
    // Magrib 21:00, Fajr 03:30 = 6.5h night
    // Midpoint = 3h 15m after Magrib = 00:15
    const result = getMidnightTime('21:00', '03:30');
    expect(result).toBe('00:15');
  });

  it('calculates Islamic midnight for equinox night', () => {
    // Magrib 18:00, Fajr 06:00 = 12h night
    // Midpoint = 6h after Magrib = 00:00
    const result = getMidnightTime('18:00', '06:00');
    expect(result).toBe('00:00');
  });
});

describe('night boundary parsing consistency', () => {
  it('produces mathematically consistent results', () => {
    // Both functions should produce consistent results
    // Islamic midnight should always be before last third
    const magribTime = '18:00';
    const fajrTime = '06:00';

    const midnight = getMidnightTime(magribTime, fajrTime);
    const lastThird = getLastThirdOfNight(magribTime, fajrTime);

    // Parse times to compare
    const [midH, midM] = midnight.split(':').map(Number);
    const [lastH, lastM] = lastThird.split(':').map(Number);
    const midMinutes = midH * 60 + midM;
    const lastMinutes = lastH * 60 + lastM;

    // Last third should be after midnight
    expect(lastMinutes).toBeGreaterThan(midMinutes);
  });

  it('handles summer solstice (short night)', () => {
    const midnight = getMidnightTime('21:00', '03:30');
    const lastThird = getLastThirdOfNight('21:00', '03:30');
    expect(midnight).toBeDefined();
    expect(lastThird).toBeDefined();
  });

  it('handles winter solstice (long night)', () => {
    const midnight = getMidnightTime('16:00', '07:00');
    const lastThird = getLastThirdOfNight('16:00', '07:00');
    expect(midnight).toBeDefined();
    expect(lastThird).toBeDefined();
  });
});

// =============================================================================
// DATE CHECKS
// =============================================================================

describe('isFriday', () => {
  it('correctly identifies Friday', () => {
    // 2026-01-23 is a Friday
    expect(isFriday('2026-01-23')).toBe(true);
  });

  it('correctly identifies non-Friday', () => {
    // 2026-01-22 is a Thursday
    expect(isFriday('2026-01-22')).toBe(false);
    // 2026-01-24 is a Saturday
    expect(isFriday('2026-01-24')).toBe(false);
  });

  it('works with Date objects', () => {
    const friday = new Date('2026-01-23T12:00:00Z');
    const saturday = new Date('2026-01-24T12:00:00Z');
    expect(isFriday(friday)).toBe(true);
    expect(isFriday(saturday)).toBe(false);
  });
});

describe('isJanuaryFirst', () => {
  it('correctly identifies January 1st', () => {
    expect(isJanuaryFirst(new Date('2026-01-01'))).toBe(true);
    expect(isJanuaryFirst(new Date('2026-01-01T23:59:59'))).toBe(true);
  });

  it('correctly identifies non-January 1st', () => {
    expect(isJanuaryFirst(new Date('2026-01-02'))).toBe(false);
    expect(isJanuaryFirst(new Date('2025-12-31'))).toBe(false);
    expect(isJanuaryFirst(new Date('2026-02-01'))).toBe(false);
  });
});

describe('isDecember', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns true in December', () => {
    jest.setSystemTime(new Date('2026-12-15T12:00:00'));
    expect(isDecember()).toBe(true);
  });

  it('returns true on December 1st', () => {
    jest.setSystemTime(new Date('2026-12-01T00:00:00'));
    expect(isDecember()).toBe(true);
  });

  it('returns true on December 31st', () => {
    jest.setSystemTime(new Date('2026-12-31T23:59:59'));
    expect(isDecember()).toBe(true);
  });

  it('returns false in January', () => {
    jest.setSystemTime(new Date('2026-01-15T12:00:00'));
    expect(isDecember()).toBe(false);
  });

  it('returns false in November', () => {
    jest.setSystemTime(new Date('2026-11-30T12:00:00'));
    expect(isDecember()).toBe(false);
  });

  it('returns false in June', () => {
    jest.setSystemTime(new Date('2026-06-15T12:00:00'));
    expect(isDecember()).toBe(false);
  });
});

// =============================================================================
// DATE CREATION & CONVERSION
// =============================================================================

describe('createLondonDate', () => {
  it('creates a Date object', () => {
    const date = createLondonDate();
    expect(date).toBeInstanceOf(Date);
  });

  it('accepts date strings', () => {
    const date = createLondonDate('2026-01-18');
    expect(date).toBeInstanceOf(Date);
  });

  it('accepts Date objects', () => {
    const input = new Date('2026-01-18T12:00:00Z');
    const date = createLondonDate(input);
    expect(date).toBeInstanceOf(Date);
  });

  it('creates valid non-NaN date', () => {
    const date = createLondonDate('2026-06-15');
    expect(isNaN(date.getTime())).toBe(false);
  });

  it('preserves date components for winter date (GMT)', () => {
    // Winter: London is GMT (UTC+0)
    const date = createLondonDate('2026-01-15');
    // The date should represent January 15, 2026 in London
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(0); // January
    expect(date.getDate()).toBe(15);
  });

  it('preserves date components for summer date (BST)', () => {
    // Summer: London is BST (UTC+1)
    const date = createLondonDate('2026-07-15');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(6); // July
    expect(date.getDate()).toBe(15);
  });
});

describe('formatDateLong', () => {
  it('formats date correctly', () => {
    const result = formatDateLong('2026-01-18');
    expect(result).toMatch(/Sun, 18 Jan 2026/);
  });

  it('includes day of week', () => {
    const result = formatDateLong('2026-01-23'); // Friday
    expect(result).toMatch(/Fri/);
  });

  it('formats different months correctly', () => {
    expect(formatDateLong('2026-06-15')).toMatch(/Jun/);
    expect(formatDateLong('2026-12-25')).toMatch(/Dec/);
  });
});

describe('formatDateShort', () => {
  it('formats date to YYYY-MM-DD', () => {
    const date = new Date('2026-01-18T12:00:00Z');
    const result = formatDateShort(date);
    expect(result).toMatch(/2026-01-18/);
  });
});

// =============================================================================
// COUNTDOWN UTILITIES
// =============================================================================

describe('getSecondsBetween', () => {
  it('returns positive seconds for future time', () => {
    const now = new Date('2026-01-18T06:00:00Z');
    const future = new Date('2026-01-18T07:00:00Z');
    expect(getSecondsBetween(now, future)).toBe(3600); // 1 hour
  });

  it('returns negative seconds for past time', () => {
    const now = new Date('2026-01-18T07:00:00Z');
    const past = new Date('2026-01-18T06:00:00Z');
    expect(getSecondsBetween(now, past)).toBe(-3600); // -1 hour
  });

  it('returns 0 for same time', () => {
    const time = new Date('2026-01-18T06:00:00Z');
    expect(getSecondsBetween(time, time)).toBe(0);
  });
});

describe('createPrayerDatetime', () => {
  it('creates datetime from date and time strings', () => {
    const result = createPrayerDatetime('2026-01-18', '06:12');
    expect(result).toBeInstanceOf(Date);
  });

  it('preserves the time correctly', () => {
    const result = createPrayerDatetime('2026-01-18', '14:30');
    // The result should represent 14:30 London time
    expect(result).toBeInstanceOf(Date);
    expect(isNaN(result.getTime())).toBe(false);
  });

  it('creates valid datetime for early morning times', () => {
    const result = createPrayerDatetime('2026-01-18', '05:30');
    expect(result).toBeInstanceOf(Date);
    expect(isNaN(result.getTime())).toBe(false);
  });

  it('creates valid datetime for late night times', () => {
    const result = createPrayerDatetime('2026-01-18', '23:45');
    expect(result).toBeInstanceOf(Date);
    expect(isNaN(result.getTime())).toBe(false);
  });

  it('creates chronologically correct datetimes', () => {
    const earlier = createPrayerDatetime('2026-01-18', '06:00');
    const later = createPrayerDatetime('2026-01-18', '12:00');
    expect(later.getTime()).toBeGreaterThan(earlier.getTime());
  });

  it('handles day boundary correctly', () => {
    const today = createPrayerDatetime('2026-01-18', '23:59');
    const tomorrow = createPrayerDatetime('2026-01-19', '00:01');
    expect(tomorrow.getTime()).toBeGreaterThan(today.getTime());
  });
});

// =============================================================================
// ADDITIONAL COVERAGE TESTS
// =============================================================================

describe('formatHijriDateLong', () => {
  it('formats valid date to Hijri format', () => {
    const result = formatHijriDateLong('2026-01-18');
    // Should return something like "Rajab 28, 1447" (without AH)
    expect(result).toMatch(/\w+\s+\d+,\s+\d{4}$/);
    expect(result).not.toContain('AH');
  });

  it('returns string for any valid date', () => {
    // Test various valid dates return strings
    const result1 = formatHijriDateLong('2026-01-01');
    const result2 = formatHijriDateLong('2025-12-31');
    expect(typeof result1).toBe('string');
    expect(typeof result2).toBe('string');
  });
});

describe('isDateYesterdayOrFuture', () => {
  it('returns true for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    expect(isDateYesterdayOrFuture(dateStr)).toBe(true);
  });

  it('returns true for today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(isDateYesterdayOrFuture(today)).toBe(true);
  });

  it('returns true for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    expect(isDateYesterdayOrFuture(dateStr)).toBe(true);
  });

  it('returns false for two days ago', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const dateStr = twoDaysAgo.toISOString().split('T')[0];
    expect(isDateYesterdayOrFuture(dateStr)).toBe(false);
  });
});

describe('getCurrentYear', () => {
  it('returns current year as number', () => {
    const year = getCurrentYear();
    expect(typeof year).toBe('number');
    expect(year).toBeGreaterThanOrEqual(2024);
    expect(year).toBeLessThanOrEqual(2100);
  });
});

describe('adjustTime', () => {
  it('adds minutes correctly', () => {
    expect(adjustTime('06:00', 20)).toBe('06:20');
  });

  it('subtracts minutes correctly', () => {
    expect(adjustTime('06:40', -40)).toBe('06:00');
  });

  it('handles zero adjustment', () => {
    expect(adjustTime('12:30', 0)).toBe('12:30');
  });

  it('handles large adjustments', () => {
    expect(adjustTime('12:00', 120)).toBe('14:00'); // +2 hours
    expect(adjustTime('12:00', -180)).toBe('09:00'); // -3 hours
  });
});

// =============================================================================
// DST TRANSITION TESTS
// =============================================================================

describe('DST transitions', () => {
  describe('Spring forward (last Sunday of March)', () => {
    it('handles createPrayerDatetime during spring DST', () => {
      // In 2026, clocks spring forward on March 29 at 1:00 AM -> 2:00 AM
      const result = createPrayerDatetime('2026-03-29', '02:30');
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('Fall back (last Sunday of October)', () => {
    it('handles createPrayerDatetime during fall DST overlap', () => {
      // In 2026, clocks fall back on October 25 at 2:00 AM -> 1:00 AM
      const result = createPrayerDatetime('2026-10-25', '01:30');
      expect(result).toBeInstanceOf(Date);
    });
  });
});

// =============================================================================
// NIGHT TIME CALCULATION EDGE CASES
// =============================================================================

describe('getLastThirdOfNight edge cases', () => {
  it('handles very short summer night', () => {
    // Summer solstice: Magrib 21:15, Fajr 02:45 = 5.5h night
    const result = getLastThirdOfNight('21:15', '02:45');
    expect(result).toBeDefined();
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it('handles very long winter night', () => {
    // Winter solstice: Magrib 15:50, Fajr 07:15 = 15h 25m night
    const result = getLastThirdOfNight('15:50', '07:15');
    expect(result).toBeDefined();
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe('getMidnightTime edge cases', () => {
  it('handles early Islamic midnight (winter)', () => {
    // Very early Magrib, late Fajr
    const result = getMidnightTime('15:50', '07:15');
    expect(result).toBeDefined();
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it('handles late Islamic midnight (summer)', () => {
    // Late Magrib, early Fajr
    const result = getMidnightTime('21:15', '02:45');
    expect(result).toBeDefined();
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });
});
