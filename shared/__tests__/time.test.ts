import { formatInTimeZone } from 'date-fns-tz';

import { TIME_ADJUSTMENTS } from '../constants';
import {
  addDaysToDateString,
  adjustTime,
  createLondonDate,
  createPrayerDatetime,
  formatDateLong,
  formatDateShort,
  formatHijriDateLong,
  formatPrayerTime,
  formatTime,
  formatTimeAgo,
  getCurrentYear,
  getDayAnchor,
  getNightTimes,
  getPreviousDateString,
  getSecondsBetween,
  getSecondsRemaining,
  getTodayDateString,
  getWallSecondDelay,
  isDateYesterdayOrFuture,
  isDecember,
  isDecorationSeason,
  isFriday,
  isJanuaryFirst,
  isRamadan,
} from '../time';

const londonDate = (offsetMs = 0) => formatInTimeZone(Date.now() + offsetMs, 'Europe/London', 'yyyy-MM-dd');

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
    expect(formatTime(60)).toBe('1m'); // whole minute: never "1m 0s"
    expect(formatTime(61)).toBe('1m 1s');
    expect(formatTime(90)).toBe('1m 30s');
    expect(formatTime(599)).toBe('9m 59s');
  });

  it('formats hours correctly', () => {
    expect(formatTime(3600)).toBe('1h'); // whole hour: never "1h 0s"
    expect(formatTime(3665)).toBe('1h 1m 5s');
    expect(formatTime(7200)).toBe('2h'); // whole 2h: never "2h 0s"
  });

  it('converts days to hours', () => {
    expect(formatTime(90000)).toBe('25h'); // whole hours: no trailing "0s"
  });

  it('handles the 24h and multi-day boundaries', () => {
    expect(formatTime(86399)).toBe('23h 59m 59s');
    expect(formatTime(86400)).toBe('24h'); // exactly one day -> 24h, no "0s"
    expect(formatTime(90061)).toBe('25h 1m 1s'); // day + hour + minute + second
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

describe('getNightTimes', () => {
  it('calculates Islamic midnight and the last third of a winter night', () => {
    // Magrib 18:45 on Jan 19, Fajr 06:15 on Jan 20 = 11.5h night (GMT)
    // Midpoint = 5h 45m after Magrib = 00:30; last third = 7h 40m after Magrib = 02:25
    const { midnight, lastThird } = getNightTimes('2026-01-19', '18:45', '2026-01-20', '06:15');
    expect(midnight.toISOString()).toBe('2026-01-20T00:30:00.000Z');
    expect(lastThird.toISOString()).toBe('2026-01-20T02:25:00.000Z');
  });

  it('calculates a short summer night (BST)', () => {
    // Magrib 21:00 on Jun 20, Fajr 03:30 on Jun 21 = 6.5h night
    // Midpoint 00:15 BST; last third 4h 20m after Magrib = 01:20 BST
    const { midnight, lastThird } = getNightTimes('2026-06-20', '21:00', '2026-06-21', '03:30');
    expect(midnight.toISOString()).toBe('2026-06-20T23:15:00.000Z');
    expect(lastThird.toISOString()).toBe('2026-06-21T00:20:00.000Z');
    expect(formatPrayerTime(midnight)).toBe('00:15');
    expect(formatPrayerTime(lastThird)).toBe('01:20');
  });

  it('puts the midpoint of a 12-hour night exactly at 00:00', () => {
    // Magrib 18:00, Fajr 06:00 = 12h night: midpoint 00:00, last third 02:00
    const { midnight, lastThird } = getNightTimes('2026-01-19', '18:00', '2026-01-20', '06:00');
    expect(midnight.toISOString()).toBe('2026-01-20T00:00:00.000Z');
    expect(lastThird.toISOString()).toBe('2026-01-20T02:00:00.000Z');
  });

  it('drops the seconds: a half-minute midpoint shows and fires at the start of its minute', () => {
    // 581-minute night: midpoint 290.5 min after Magrib (23:18:30), last third 387.33 min (00:55:20)
    const { midnight, lastThird } = getNightTimes('2026-03-27', '18:28', '2026-03-28', '04:09');
    expect(midnight.toISOString()).toBe('2026-03-27T23:18:00.000Z');
    expect(lastThird.toISOString()).toBe('2026-03-28T00:55:00.000Z');
  });

  it('measures the spring clock-change night in real time (9h 37m, not the 10h 37m on the clock face)', () => {
    // Magrib Sat 28 Mar 18:30 GMT, Fajr Sun 29 Mar 05:07 BST (04:07 GMT)
    const { midnight, lastThird } = getNightTimes('2026-03-28', '18:30', '2026-03-29', '05:07');
    expect(midnight.toISOString()).toBe('2026-03-28T23:18:00.000Z'); // 23:18 GMT
    expect(lastThird.toISOString()).toBe('2026-03-29T00:54:00.000Z'); // 00:54 GMT, before the clocks jump
    expect(formatPrayerTime(midnight)).toBe('23:18');
    expect(formatPrayerTime(lastThird)).toBe('00:54');
  });

  it('measures the autumn clock-change night in real time (12h 12m, not the 11h 12m on the clock face)', () => {
    // Magrib Sat 24 Oct 17:52 BST (16:52 GMT), Fajr Sun 25 Oct 05:04 GMT
    const { midnight, lastThird } = getNightTimes('2026-10-24', '17:52', '2026-10-25', '05:04');
    expect(midnight.toISOString()).toBe('2026-10-24T22:58:00.000Z'); // 23:58 BST
    // The last third starts at the second 01:00 (GMT): an exact instant, not an ambiguous clock reading
    expect(lastThird.toISOString()).toBe('2026-10-25T01:00:00.000Z');
    expect(formatPrayerTime(midnight)).toBe('23:58');
    expect(formatPrayerTime(lastThird)).toBe('01:00');
  });

  it('keeps Midnight before the last third, and both inside the night', () => {
    const nights: [string, string, string, string][] = [
      ['2026-01-19', '15:50', '2026-01-20', '07:15'], // long winter night
      ['2026-06-20', '21:25', '2026-06-21', '02:40'], // short summer night
      ['2026-03-28', '18:30', '2026-03-29', '05:07'], // spring clock change
      ['2026-10-24', '17:52', '2026-10-25', '05:04'], // autumn clock change
    ];

    for (const [previousDate, magrib, date, fajr] of nights) {
      const { midnight, lastThird } = getNightTimes(previousDate, magrib, date, fajr);
      expect(createPrayerDatetime(previousDate, magrib).getTime()).toBeLessThan(midnight.getTime());
      expect(midnight.getTime()).toBeLessThan(lastThird.getTime());
      expect(lastThird.getTime()).toBeLessThan(createPrayerDatetime(date, fajr).getTime());
    }
  });

  it('matches plain clock-face arithmetic on every night without a clock change (sweep)', () => {
    const hhmm = (minutes: number) =>
      `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    const mismatches: string[] = [];

    // A GMT night (January) and a BST night (July), with local midnight of the first date as a UTC instant
    const nights = [
      { previousDate: '2026-01-19', date: '2026-01-20', localMidnight: Date.UTC(2026, 0, 19) },
      { previousDate: '2026-07-19', date: '2026-07-20', localMidnight: Date.UTC(2026, 6, 18, 23) },
    ];

    for (const { previousDate, date, localMidnight } of nights) {
      for (let magrib = 15 * 60 + 30; magrib <= 22 * 60; magrib++) {
        for (let fajr = 90; fajr <= 7 * 60 + 30; fajr += 13) {
          const night = fajr + 24 * 60 - magrib;
          const expectedMidnight = localMidnight + Math.floor(magrib + night / 2) * 60_000;
          const expectedLastThird =
            localMidnight + Math.floor(magrib + (night * 2) / 3 + TIME_ADJUSTMENTS.lastThird) * 60_000;
          const { midnight, lastThird } = getNightTimes(previousDate, hhmm(magrib), date, hhmm(fajr));
          if (midnight.getTime() !== expectedMidnight || lastThird.getTime() !== expectedLastThird) {
            mismatches.push(`${previousDate} Magrib ${hhmm(magrib)} → Fajr ${hhmm(fajr)}`);
          }
        }
      }
    }

    expect(mismatches).toEqual([]);
  });
});

describe('night times do not depend on when they are calculated', () => {
  afterEach(() => jest.useRealTimers());

  it.each([
    '2026-01-20T12:00:00.000Z', // ordinary day, second 0
    '2026-01-20T12:00:45.000Z', // ordinary day, second 45
    '2026-06-20T11:59:59.900Z', // summer (BST), second 59.9
    '2026-10-24T11:00:00.000Z', // Saturday before the clocks go back
    '2026-03-28T12:00:00.000Z', // Saturday before the clocks go forward
  ])('gives the same instants when run at %s', (iso) => {
    jest.useFakeTimers().setSystemTime(new Date(iso));

    expect(getNightTimes('2026-01-19', '17:50', '2026-01-20', '05:40')).toEqual({
      midnight: new Date('2026-01-19T23:45:00.000Z'),
      lastThird: new Date('2026-01-20T01:43:00.000Z'),
    });
    expect(getNightTimes('2026-10-24', '17:52', '2026-10-25', '05:04')).toEqual({
      midnight: new Date('2026-10-24T22:58:00.000Z'),
      lastThird: new Date('2026-10-25T01:00:00.000Z'),
    });
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
    expect(isJanuaryFirst(new Date('2026-01-01T23:59:59Z'))).toBe(true);
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
    jest.setSystemTime(new Date('2026-12-15T12:00:00Z'));
    expect(isDecember()).toBe(true);
  });

  it('returns true on December 1st', () => {
    jest.setSystemTime(new Date('2026-12-01T00:00:00Z'));
    expect(isDecember()).toBe(true);
  });

  it('returns true on December 31st', () => {
    jest.setSystemTime(new Date('2026-12-31T23:59:59Z'));
    expect(isDecember()).toBe(true);
  });

  it('returns false in January', () => {
    jest.setSystemTime(new Date('2026-01-15T12:00:00Z'));
    expect(isDecember()).toBe(false);
  });

  it('returns false in November', () => {
    jest.setSystemTime(new Date('2026-11-30T12:00:00Z'));
    expect(isDecember()).toBe(false);
  });

  it('returns false in June', () => {
    jest.setSystemTime(new Date('2026-06-15T12:00:00Z'));
    expect(isDecember()).toBe(false);
  });
});

describe('isRamadan', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns true during Ramadan (2026-03-10 falls in Ramadan 1447)', () => {
    jest.setSystemTime(new Date('2026-03-10T12:00:00Z'));
    expect(isRamadan()).toBe(true);
  });

  it('returns false outside Ramadan', () => {
    jest.setSystemTime(new Date('2026-06-15T12:00:00Z'));
    expect(isRamadan()).toBe(false);
  });

  it("returns true 15 days before Ramadan (Sha'ban 15, 1447 = 2026-02-03)", () => {
    jest.setSystemTime(new Date('2026-02-03T12:00:00Z'));
    expect(isRamadan()).toBe(true);
  });

  it("returns true in late Sha'ban (Sha'ban 27, 1447 = 2026-02-15)", () => {
    jest.setSystemTime(new Date('2026-02-15T12:00:00Z'));
    expect(isRamadan()).toBe(true);
  });

  it("returns false 16+ days before Ramadan (Sha'ban 14, 1447 = 2026-02-02)", () => {
    jest.setSystemTime(new Date('2026-02-02T12:00:00Z'));
    expect(isRamadan()).toBe(false);
  });
});

describe('isDecorationSeason', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns true during Ramadan', () => {
    jest.setSystemTime(new Date('2026-03-10T12:00:00Z'));
    expect(isDecorationSeason()).toBe(true);
  });

  it('returns true during pre-Ramadan window', () => {
    jest.setSystemTime(new Date('2026-02-03T12:00:00Z'));
    expect(isDecorationSeason()).toBe(true);
  });

  it('returns false outside decoration seasons', () => {
    jest.setSystemTime(new Date('2026-06-15T12:00:00Z'));
    expect(isDecorationSeason()).toBe(false);
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
    expect(Number.isNaN(date.getTime())).toBe(false);
  });

  it('keeps the London calendar date for a winter date (GMT)', () => {
    // Read the day through formatDateShort, never the phone-local getters (ISSUES #30)
    expect(formatDateShort(createLondonDate('2026-01-15'))).toBe('2026-01-15');
  });

  it('keeps the London calendar date for a summer date (BST)', () => {
    expect(formatDateShort(createLondonDate('2026-07-15'))).toBe('2026-07-15');
  });

  it('is the same instant it was given, to the millisecond', () => {
    const instant = new Date('2026-09-11T19:05:05.123Z');
    expect(createLondonDate(instant).toISOString()).toBe('2026-09-11T19:05:05.123Z');
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

  it('returns the London calendar date even when the device timezone differs', () => {
    // 23:30 UTC on June 15 is 00:30 London (BST, UTC+1) on June 16 — a device
    // in New York would locally read June 15. The London date must win.
    const instant = new Date('2026-06-15T23:30:00Z');
    expect(formatDateShort(instant)).toBe('2026-06-16');
  });

  it('returns the London calendar date around winter midnight (GMT)', () => {
    // 23:30 UTC on Dec 20 is 23:30 London (GMT, UTC+0) — still Dec 20.
    const instant = new Date('2026-12-20T23:30:00Z');
    expect(formatDateShort(instant)).toBe('2026-12-20');
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
    expect(Number.isNaN(result.getTime())).toBe(false);
  });

  it('creates valid datetime for early morning times', () => {
    const result = createPrayerDatetime('2026-01-18', '05:30');
    expect(result).toBeInstanceOf(Date);
    expect(Number.isNaN(result.getTime())).toBe(false);
  });

  it('creates valid datetime for late night times', () => {
    const result = createPrayerDatetime('2026-01-18', '23:45');
    expect(result).toBeInstanceOf(Date);
    expect(Number.isNaN(result.getTime())).toBe(false);
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

describe('formatPrayerTime', () => {
  it('reads an instant on the London wall clock (GMT in winter, BST in summer)', () => {
    expect(formatPrayerTime(new Date('2026-01-18T06:12:00Z'))).toBe('06:12');
    expect(formatPrayerTime(new Date('2026-06-15T05:12:00Z'))).toBe('06:12');
  });

  it('round-trips createPrayerDatetime', () => {
    expect(formatPrayerTime(createPrayerDatetime('2026-10-23', '23:58'))).toBe('23:58');
    expect(formatPrayerTime(createPrayerDatetime('2026-03-30', '01:54'))).toBe('01:54');
  });
});

describe('getPreviousDateString', () => {
  it('steps back one calendar day', () => {
    expect(getPreviousDateString('2026-09-11')).toBe('2026-09-10');
  });

  it('crosses month and year boundaries', () => {
    expect(getPreviousDateString('2026-03-01')).toBe('2026-02-28');
    expect(getPreviousDateString('2026-01-01')).toBe('2025-12-31');
  });

  it('knows leap years', () => {
    expect(getPreviousDateString('2024-03-01')).toBe('2024-02-29');
  });

  it('is unaffected by the clock-change days', () => {
    expect(getPreviousDateString('2026-03-30')).toBe('2026-03-29');
    expect(getPreviousDateString('2026-03-29')).toBe('2026-03-28');
    expect(getPreviousDateString('2026-10-26')).toBe('2026-10-25');
  });
});

describe('prayer-timezone clock (remembered offsets)', () => {
  // A reference that asks Intl directly every time, with no memory
  const reference = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const referenceReading = (instant: number): string => {
    const parts = reference.formatToParts(instant);
    const field = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
    const hour = field('hour') === '24' ? '00' : field('hour');
    return `${field('year')}-${field('month')}-${field('day')} ${hour}:${field('minute')}`;
  };
  const appReading = (instant: number): string =>
    `${formatDateShort(new Date(instant))} ${formatPrayerTime(new Date(instant))}`;

  it('matches Intl at every quarter hour of 2026', () => {
    const mismatches: string[] = [];
    for (let instant = Date.UTC(2026, 0, 1); instant < Date.UTC(2027, 0, 1); instant += 15 * 60_000) {
      if (appReading(instant) !== referenceReading(instant)) mismatches.push(new Date(instant).toISOString());
    }
    expect(mismatches).toEqual([]);
  });

  it('matches Intl minute by minute across both 2026 clock changes', () => {
    const mismatches: string[] = [];
    for (const [from, to] of [
      [Date.UTC(2026, 2, 28, 22), Date.UTC(2026, 2, 29, 4)],
      [Date.UTC(2026, 9, 24, 22), Date.UTC(2026, 9, 25, 4)],
    ]) {
      for (let instant = from; instant <= to; instant += 60_000) {
        if (appReading(instant) !== referenceReading(instant)) mismatches.push(new Date(instant).toISOString());
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('asks Intl at most twice per UTC day touched, then never again for that day', () => {
    const intlReads = jest.spyOn(Intl.DateTimeFormat.prototype, 'formatToParts');
    try {
      // A day no other test reads, so nothing is remembered yet
      const times = ['04:56', '06:28', '13:02', '16:27', '19:25', '20:39'];
      const moments = times.map((time) => createPrayerDatetime('2031-05-14', time));
      // The ±12h probes touch three UTC days: 13, 14 and 15 May
      expect(intlReads.mock.calls.length).toBeLessThanOrEqual(6);

      intlReads.mockClear();
      for (const moment of moments) formatPrayerTime(moment);
      for (const time of times) createPrayerDatetime('2031-05-14', time);
      expect(intlReads).not.toHaveBeenCalled();
    } finally {
      intlReads.mockRestore();
    }
  });
});

describe('calendar helpers (prayer timezone, ISSUES #30)', () => {
  afterEach(() => jest.useRealTimers());

  it('adds days across month, year and leap-year boundaries', () => {
    expect(addDaysToDateString('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysToDateString('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDaysToDateString('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDaysToDateString('2026-10-25', 2)).toBe('2026-10-27');
  });

  it("reads today from London's calendar: 23:30 UTC in summer is already tomorrow there", () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-15T23:30:00Z'));
    expect(getTodayDateString()).toBe('2026-06-16');
    expect(isFriday()).toBe(false); // Tuesday 16 June in London
  });

  it('anchors a calendar day at 12:00 London time', () => {
    expect(getDayAnchor('2026-01-18').toISOString()).toBe('2026-01-18T12:00:00.000Z');
    expect(getDayAnchor('2026-06-18').toISOString()).toBe('2026-06-18T11:00:00.000Z');
    expect(formatDateShort(getDayAnchor('2026-03-29'))).toBe('2026-03-29');
  });

  it('takes the weekday of an instant from its London date', () => {
    // 23:30 UTC on Thu 11 June 2026 is 00:30 BST on Fri 12 June
    expect(isFriday(new Date('2026-06-11T23:30:00Z'))).toBe(true);
    expect(isFriday('2026-06-12')).toBe(true);
  });

  it('wraps clock arithmetic past midnight in both directions', () => {
    expect(adjustTime('00:10', -20)).toBe('23:50');
    expect(adjustTime('23:50', 20)).toBe('00:10');
    expect(adjustTime('12:00', -24 * 60)).toBe('12:00');
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
    const dateStr = londonDate(-86400000);
    expect(isDateYesterdayOrFuture(dateStr)).toBe(true);
  });

  it('returns true for today', () => {
    expect(isDateYesterdayOrFuture(londonDate())).toBe(true);
  });

  it('returns true for tomorrow', () => {
    const dateStr = londonDate(86400000);
    expect(isDateYesterdayOrFuture(dateStr)).toBe(true);
  });

  it('returns false for two days ago', () => {
    const dateStr = londonDate(-2 * 86400000);
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
  describe('Spring forward (last Sunday of March 2026: 01:00 GMT -> 02:00 BST)', () => {
    it('maps a pre-transition time with GMT offset', () => {
      expect(createPrayerDatetime('2026-03-29', '00:30').toISOString()).toBe('2026-03-29T00:30:00.000Z');
    });

    it('maps the nonexistent skipped hour via the pre-transition offset (date-fns-tz 3.2.0 semantics)', () => {
      // 01:30 wall time never exists on this date; the library resolves it as if
      // the old GMT offset still applied. No prayer time is read from the clock in
      // this hour: the night rows are exact instants (getNightTimes)
      expect(createPrayerDatetime('2026-03-29', '01:30').toISOString()).toBe('2026-03-29T00:30:00.000Z');
    });

    it('maps a post-transition time with BST offset', () => {
      expect(createPrayerDatetime('2026-03-29', '02:30').toISOString()).toBe('2026-03-29T01:30:00.000Z');
    });
  });

  describe('Fall back (last Sunday of October 2026: 02:00 BST -> 01:00 GMT)', () => {
    it('maps a pre-transition time with BST offset', () => {
      expect(createPrayerDatetime('2026-10-25', '00:30').toISOString()).toBe('2026-10-24T23:30:00.000Z');
    });

    it('maps the duplicated hour to the LATER occurrence (date-fns-tz 3.2.0 semantics)', () => {
      // 01:30 happens twice (01:30 BST then 01:30 GMT); the library picks GMT. No
      // prayer time is read from the clock in this hour: the night rows are exact
      // instants (getNightTimes)
      expect(createPrayerDatetime('2026-10-25', '01:30').toISOString()).toBe('2026-10-25T01:30:00.000Z');
    });

    it('maps a post-transition time with GMT offset', () => {
      expect(createPrayerDatetime('2026-10-25', '02:30').toISOString()).toBe('2026-10-25T02:30:00.000Z');
    });
  });
});

describe('getSecondsRemaining (ceil display contract)', () => {
  const targetFromNow = (msAhead: number) => new Date(Date.now() + msAhead);
  let nowSpy: jest.SpyInstance;

  beforeEach(() => {
    nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
  });

  afterEach(() => {
    nowSpy.mockRestore();
  });

  it('rounds up: 2.5s remaining displays as 3s', () => {
    expect(getSecondsRemaining(targetFromNow(2500))).toBe(3);
  });

  it('exact second boundaries are exact: 2.0s remaining displays as 2s', () => {
    expect(getSecondsRemaining(targetFromNow(2000))).toBe(2);
  });

  it('whole minutes flip on the boundary: 59.9995s remaining displays as 60s', () => {
    expect(getSecondsRemaining(targetFromNow(59_999.5))).toBe(60);
  });

  it('final second always displays 1s: 0.5s remaining', () => {
    expect(getSecondsRemaining(targetFromNow(500))).toBe(1);
  });

  it('never displays 0s: 0ms remaining holds at 1s', () => {
    expect(getSecondsRemaining(targetFromNow(0))).toBe(1);
  });

  it('holds at 1s once the target has passed (latch until caller advances target)', () => {
    expect(getSecondsRemaining(targetFromNow(-5000))).toBe(1);
  });

  it('any overshoot past a whole second rounds to the next digit: 1001ms remaining -> 2', () => {
    expect(getSecondsRemaining(targetFromNow(1001))).toBe(2);
  });

  it('large horizons keep exact ceil semantics', () => {
    expect(getSecondsRemaining(targetFromNow(1001))).toBe(2);
    expect(getSecondsRemaining(targetFromNow(365 * 86400 * 1000 + 1))).toBe(365 * 86400 + 1);
  });
});

describe('getWallSecondDelay (phase alignment)', () => {
  let nowSpy: jest.SpyInstance;

  beforeEach(() => {
    nowSpy = jest.spyOn(Date, 'now');
  });

  afterEach(() => {
    nowSpy.mockRestore();
  });

  it('returns ms to the next :000 boundary', () => {
    nowSpy.mockReturnValue(1700000001234);
    expect(getWallSecondDelay()).toBe(766);
  });

  it('lands shortly after the boundary, never at zero delay', () => {
    nowSpy.mockReturnValue(1700000001000);
    expect(getWallSecondDelay()).toBe(1000);
  });

  it('always returns a value in (0, 1000]', () => {
    nowSpy.mockReturnValue(1700000000999);
    const delay = getWallSecondDelay();
    expect(delay).toBeGreaterThan(0);
    expect(delay).toBeLessThanOrEqual(1000);
  });

  it('mid-second phases map to their exact complement', () => {
    nowSpy.mockReturnValue(1700000000500);
    expect(getWallSecondDelay()).toBe(500);
    nowSpy.mockReturnValue(1700000000999);
    expect(getWallSecondDelay()).toBe(1);
    nowSpy.mockReturnValue(1700000000001);
    expect(getWallSecondDelay()).toBe(999);
  });
});

describe('countdown targets are true UTC instants (Fix A foundation)', () => {
  it('createPrayerDatetime returns the exact UTC instant (GMT, winter)', () => {
    const datetime = createPrayerDatetime('2026-01-18', '06:12');
    expect(datetime.toISOString()).toBe('2026-01-18T06:12:00.000Z');
  });

  it('createPrayerDatetime returns the exact UTC instant (BST +01:00, summer)', () => {
    const datetime = createPrayerDatetime('2026-06-15', '06:12');
    expect(datetime.toISOString()).toBe('2026-06-15T05:12:00.000Z');
  });

  it('diffing a target against Date.now() needs no timezone conversion (offsets cancel)', () => {
    // Target 13:00 BST = 12:00 UTC; now 11:00 UTC -> exactly 1h remaining
    const datetime = createPrayerDatetime('2026-06-15', '13:00');
    const fakeNow = new Date('2026-06-15T11:00:00Z').getTime();
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(fakeNow);
    const seconds = getSecondsRemaining(datetime);
    nowSpy.mockRestore();
    expect(seconds).toBe(3600);
  });

  it('countdown window crossing the October fallback counts the real elapsed time (8.5h, not 7.5h)', () => {
    // Last Sunday of October 2026: clocks fall back 02:00 BST -> 01:00 GMT.
    // From Sat 23:00 BST (22:00Z) to Sun 06:30 GMT (06:30Z) = 8h30m of real time —
    // the fallback hour is included because the phone really waits that long.
    const target = createPrayerDatetime('2026-10-25', '06:30'); // after fallback -> GMT
    expect(target.toISOString()).toBe('2026-10-25T06:30:00.000Z');

    const fakeNow = new Date('2026-10-24T22:00:00Z').getTime(); // Sat 23:00 BST
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(fakeNow);
    const seconds = getSecondsRemaining(target);
    nowSpy.mockRestore();
    expect(seconds).toBe(8.5 * 3600);
  });

  it('countdown window crossing the March spring-forward counts the real elapsed time (6.5h, not 7.5h)', () => {
    // Last Sunday of March 2026: clocks spring forward 01:00 GMT -> 02:00 BST.
    // From Sat 23:00 GMT (23:00Z) to Sun 06:30 BST (05:30Z) = 6h30m of real time —
    // the skipped hour is excluded because it never happens (naive wall math: 7.5h).
    const target = createPrayerDatetime('2026-03-29', '06:30'); // after spring-forward -> BST
    expect(target.toISOString()).toBe('2026-03-29T05:30:00.000Z');

    const fakeNow = new Date('2026-03-28T23:00:00Z').getTime(); // Sat 23:00 GMT
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(fakeNow);
    const seconds = getSecondsRemaining(target);
    nowSpy.mockRestore();
    expect(seconds).toBe(6.5 * 3600);
  });
});
