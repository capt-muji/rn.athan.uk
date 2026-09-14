import { formatInTimeZone } from 'date-fns-tz';

import * as Database from '@/stores/database';

import { EXTRAS_ARABIC, PRAYER_TIMEZONE, PRAYERS_ARABIC } from '../constants';
import {
  calculateBelongsToDate,
  canonicalDisplayOrder,
  createPrayer,
  createPrayerSequence,
  createPrayersForDate,
  filterApiData,
  getCascadeDelay,
  getLongestPrayerNameIndex,
  getPrayerForDate,
  transformApiData,
} from '../prayer';
import { createPrayerDatetime } from '../time';
import {
  type IApiResponse,
  type ISingleApiResponseTransformed,
  type IValidatedApiResponse,
  type Prayer,
  type ReadablePrayer,
  type RequiredTimeName,
  ScheduleType,
} from '../types';

jest.mock('@/stores/database', () => ({ getPrayerByDateString: jest.fn() }));

/**
 * Today's date in the prayer timezone, from date-fns-tz rather than the app's own helper,
 * so this stays an independent oracle. Keyed off PRAYER_TIMEZONE so that moving the app off
 * London fails the app's code rather than this fixture.
 */
const prayerZoneDate = (offsetMs = 0) => formatInTimeZone(Date.now() + offsetMs, PRAYER_TIMEZONE, 'yyyy-MM-dd');

// =============================================================================
// calculateBelongsToDate TESTS
// =============================================================================

describe('calculateBelongsToDate', () => {
  describe('Standard Schedule', () => {
    it('assigns Isha at 00:45 to previous day', () => {
      // Isha at 00:45 on Jan 19 calendar date belongs to Jan 18 Islamic day
      const datetime = createPrayerDatetime('2026-01-19', '00:45');
      const result = calculateBelongsToDate(ScheduleType.Standard, 'Isha', '2026-01-19', datetime);
      expect(result).toBe('2026-01-18');
    });

    it('assigns Isha at 05:59 to previous day (before 6am cutoff)', () => {
      const datetime = createPrayerDatetime('2026-01-19', '05:59');
      const result = calculateBelongsToDate(ScheduleType.Standard, 'Isha', '2026-01-19', datetime);
      expect(result).toBe('2026-01-18');
    });

    it('assigns Isha at 21:00 to current day (normal evening)', () => {
      const datetime = createPrayerDatetime('2026-01-19', '21:00');
      const result = calculateBelongsToDate(ScheduleType.Standard, 'Isha', '2026-01-19', datetime);
      expect(result).toBe('2026-01-19');
    });

    it('assigns Fajr at 06:15 to current day', () => {
      const datetime = createPrayerDatetime('2026-01-19', '06:15');
      const result = calculateBelongsToDate(ScheduleType.Standard, 'Fajr', '2026-01-19', datetime);
      expect(result).toBe('2026-01-19');
    });

    it('assigns Dhuhr to current day', () => {
      const datetime = createPrayerDatetime('2026-01-19', '12:30');
      const result = calculateBelongsToDate(ScheduleType.Standard, 'Dhuhr', '2026-01-19', datetime);
      expect(result).toBe('2026-01-19');
    });

    it('assigns Asr to current day', () => {
      const datetime = createPrayerDatetime('2026-01-19', '14:30');
      const result = calculateBelongsToDate(ScheduleType.Standard, 'Asr', '2026-01-19', datetime);
      expect(result).toBe('2026-01-19');
    });

    it('assigns Magrib to current day', () => {
      const datetime = createPrayerDatetime('2026-01-19', '17:45');
      const result = calculateBelongsToDate(ScheduleType.Standard, 'Magrib', '2026-01-19', datetime);
      expect(result).toBe('2026-01-19');
    });

    // January 1st edge case
    it('handles January 1st rollover to previous year', () => {
      const datetime = createPrayerDatetime('2026-01-01', '00:45');
      const result = calculateBelongsToDate(ScheduleType.Standard, 'Isha', '2026-01-01', datetime);
      expect(result).toBe('2025-12-31');
    });
  });

  describe('Extra Schedule', () => {
    it('assigns Midnight at 00:30 (stored on previous calendar day) to next day', () => {
      // Night prayers stored with previous evening's data but occur in early morning
      // When calendar date is Jan 18 and time is in PM (>=12), belongs to Jan 19
      const datetime = createPrayerDatetime('2026-01-18', '00:30');
      // If hour < 12, it stays on current calendar date
      const result = calculateBelongsToDate(ScheduleType.Extra, 'Midnight', '2026-01-18', datetime);
      expect(result).toBe('2026-01-18');
    });

    it('assigns Last Third to next day when hour >= 12', () => {
      // This handles the case where midnight/last third are calculated from previous evening's magrib
      // If the datetime shows >= 12 (afternoon), it means it's actually part of NEXT day's night
      const datetime = createPrayerDatetime('2026-01-18', '23:30'); // Late night, belongs to next day
      const result = calculateBelongsToDate(ScheduleType.Extra, 'Last Third', '2026-01-18', datetime);
      expect(result).toBe('2026-01-19');
    });

    it('keeps a morning Suhoor (05:30) on its own calendar day', () => {
      const datetime = createPrayerDatetime('2026-01-18', '05:30'); // Early morning
      const result = calculateBelongsToDate(ScheduleType.Extra, 'Suhoor', '2026-01-18', datetime);
      expect(result).toBe('2026-01-18'); // Before noon, stays same day
    });

    // The pair with adjustPrayerDateForMidnightCrossing turns on hour 12 exactly: that side sends a
    // Suhoor of 12:xx back a day by its clock string, and this side must bring it forward again, or the
    // row lands on the previous day's list. The minutes either side of noon pin the boundary itself.
    it.each([
      ['Suhoor', '11:59', '2026-01-18'],
      ['Suhoor', '12:00', '2026-01-19'],
      ['Last Third', '11:59', '2026-01-18'],
      ['Last Third', '12:00', '2026-01-19'],
    ])('files %s at %s on calendar day 2026-01-18 under %s', (english, time, expected) => {
      const datetime = createPrayerDatetime('2026-01-18', time);
      expect(calculateBelongsToDate(ScheduleType.Extra, english, '2026-01-18', datetime)).toBe(expected);
    });

    it('assigns Duha to current day', () => {
      const datetime = createPrayerDatetime('2026-01-19', '08:30');
      const result = calculateBelongsToDate(ScheduleType.Extra, 'Duha', '2026-01-19', datetime);
      expect(result).toBe('2026-01-19');
    });

    it('assigns Istijaba to current day', () => {
      const datetime = createPrayerDatetime('2026-01-19', '16:30');
      const result = calculateBelongsToDate(ScheduleType.Extra, 'Istijaba', '2026-01-19', datetime);
      expect(result).toBe('2026-01-19');
    });
  });
});

// =============================================================================
// createPrayer TESTS
// =============================================================================

describe('createPrayer', () => {
  it('creates prayer with correct properties', () => {
    const prayer = createPrayer({
      type: ScheduleType.Standard,
      english: 'Fajr',
      arabic: 'الفجر',
      date: '2026-01-19',
      time: '06:15',
    });

    expect(prayer.english).toBe('Fajr');
    expect(prayer.arabic).toBe('الفجر');
    expect(prayer.type).toBe(ScheduleType.Standard);
    expect(prayer.time).toBe('06:15');
    expect(prayer.datetime).toBeInstanceOf(Date);
    expect(prayer.belongsToDate).toBe('2026-01-19');
  });

  it('creates Extra prayer correctly', () => {
    const prayer = createPrayer({
      type: ScheduleType.Extra,
      english: 'Midnight',
      arabic: 'نصف الليل',
      date: '2026-01-19',
      time: '00:30',
    });

    expect(prayer.english).toBe('Midnight');
    expect(prayer.type).toBe(ScheduleType.Extra);
    expect(prayer.datetime).toBeInstanceOf(Date);
  });

  it('handles Isha after midnight correctly', () => {
    // Summer Isha at 1am
    const prayer = createPrayer({
      type: ScheduleType.Standard,
      english: 'Isha',
      arabic: 'العشاء',
      date: '2026-06-22',
      time: '01:00',
    });

    expect(prayer.english).toBe('Isha');
    expect(prayer.belongsToDate).toBe('2026-06-21'); // Belongs to previous day
  });
});

// =============================================================================
// getCascadeDelay TESTS
// =============================================================================

describe('getCascadeDelay', () => {
  it('returns correct delay for standard schedule', () => {
    // Standard schedule has 6 prayers
    // Cascade delay is (length - index) * 150ms
    expect(getCascadeDelay(0, ScheduleType.Standard)).toBe(6 * 150); // First prayer
    expect(getCascadeDelay(5, ScheduleType.Standard)).toBe(1 * 150); // Last prayer
  });

  it('returns correct delay for extra schedule', () => {
    // Extra schedule has 5 prayers
    expect(getCascadeDelay(0, ScheduleType.Extra)).toBe(6 * 150); // Uses PRAYERS_ARABIC.length = 6
    expect(getCascadeDelay(4, ScheduleType.Extra)).toBe(2 * 150);
  });

  it('decreases delay for higher indices', () => {
    const delay0 = getCascadeDelay(0, ScheduleType.Standard);
    const delay1 = getCascadeDelay(1, ScheduleType.Standard);
    const delay2 = getCascadeDelay(2, ScheduleType.Standard);

    expect(delay0).toBeGreaterThan(delay1);
    expect(delay1).toBeGreaterThan(delay2);
  });
});

// =============================================================================
// ADR-004 CRITICAL EDGE CASES
// =============================================================================

describe('ADR-004: Prayer-Based Day Boundary Edge Cases', () => {
  describe('Scenario 4: Isha After System Midnight (Summer)', () => {
    it('assigns summer Isha at 00:45 to previous Islamic day', () => {
      // London summer: Isha can be after midnight
      const datetime = createPrayerDatetime('2026-06-22', '00:45');
      const result = calculateBelongsToDate(ScheduleType.Standard, 'Isha', '2026-06-22', datetime);
      expect(result).toBe('2026-06-21');
    });

    it('assigns summer Isha at 01:15 to previous Islamic day', () => {
      const datetime = createPrayerDatetime('2026-06-22', '01:15');
      const result = calculateBelongsToDate(ScheduleType.Standard, 'Isha', '2026-06-22', datetime);
      expect(result).toBe('2026-06-21');
    });

    it('does NOT assign Isha at 06:00 to previous day (cutoff boundary)', () => {
      const datetime = createPrayerDatetime('2026-06-22', '06:00');
      const result = calculateBelongsToDate(ScheduleType.Standard, 'Isha', '2026-06-22', datetime);
      expect(result).toBe('2026-06-22');
    });
  });

  describe('Scenario 6: Midnight Prayer After System Midnight', () => {
    it('Extra night prayers before noon stay on calendar date', () => {
      const datetime = createPrayerDatetime('2026-01-18', '00:15');
      const result = calculateBelongsToDate(ScheduleType.Extra, 'Midnight', '2026-01-18', datetime);
      expect(result).toBe('2026-01-18');
    });

    it('Extra night prayers in evening (>=12) belong to next day', () => {
      const datetime = createPrayerDatetime('2026-01-18', '23:30');
      const result = calculateBelongsToDate(ScheduleType.Extra, 'Midnight', '2026-01-18', datetime);
      expect(result).toBe('2026-01-19');
    });
  });

  describe('Scenario 8: Year Boundary (Dec 31 to Jan 1)', () => {
    it('handles Isha rollover from Jan 1 to Dec 31', () => {
      const datetime = createPrayerDatetime('2027-01-01', '00:30');
      const result = calculateBelongsToDate(ScheduleType.Standard, 'Isha', '2027-01-01', datetime);
      expect(result).toBe('2026-12-31');
    });
  });
});

// =============================================================================
// createPrayer EDGE CASES
// =============================================================================

describe('createPrayer edge cases', () => {
  it('handles winter Isha (before midnight)', () => {
    const prayer = createPrayer({
      type: ScheduleType.Standard,
      english: 'Isha',
      arabic: 'العشاء',
      date: '2026-01-18',
      time: '18:15',
    });
    expect(prayer.belongsToDate).toBe('2026-01-18');
  });

  it('handles summer Isha (after midnight, up to 6am)', () => {
    const prayer = createPrayer({
      type: ScheduleType.Standard,
      english: 'Isha',
      arabic: 'العشاء',
      date: '2026-06-22',
      time: '01:30',
    });
    expect(prayer.belongsToDate).toBe('2026-06-21');
  });

  it('handles Extra Midnight prayer before system midnight', () => {
    const prayer = createPrayer({
      type: ScheduleType.Extra,
      english: 'Midnight',
      arabic: 'نصف الليل',
      date: '2026-12-15',
      time: '22:45',
    });
    expect(prayer.belongsToDate).toBe('2026-12-16');
  });

  it('handles Extra Last Third prayer after system midnight', () => {
    const prayer = createPrayer({
      type: ScheduleType.Extra,
      english: 'Last Third',
      arabic: 'آخر ثلث',
      date: '2026-01-18',
      time: '02:30',
    });
    expect(prayer.belongsToDate).toBe('2026-01-18');
  });
});

// =============================================================================
// getLongestPrayerNameIndex TESTS
// =============================================================================

describe('getLongestPrayerNameIndex', () => {
  it('returns correct index for Standard schedule', () => {
    const index = getLongestPrayerNameIndex(ScheduleType.Standard);
    // Standard prayers: Fajr, Sunrise, Dhuhr, Asr, Magrib, Isha
    // "Sunrise" is longest (7 chars)
    expect(typeof index).toBe('number');
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(6);
  });

  it('returns correct index for Extra schedule', () => {
    const index = getLongestPrayerNameIndex(ScheduleType.Extra);
    // Extra prayers: Duha, Istijaba, Midnight, Last Third, Suhoor
    // "Last Third" is longest (10 chars)
    expect(typeof index).toBe('number');
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(5);
  });

  it('returns valid index that can be used to access prayer arrays', () => {
    const standardIndex = getLongestPrayerNameIndex(ScheduleType.Standard);
    const extraIndex = getLongestPrayerNameIndex(ScheduleType.Extra);

    // Both should be valid indices
    expect(Number.isInteger(standardIndex)).toBe(true);
    expect(Number.isInteger(extraIndex)).toBe(true);
  });
});

// =============================================================================
// filterApiData TESTS
// =============================================================================

describe('filterApiData', () => {
  const createMockApiResponse = (dates: string[]): IApiResponse => {
    const times: IApiResponse['times'] = {};
    dates.forEach((date) => {
      times[date] = {
        date,
        fajr: '06:00',
        fajr_jamat: '06:30',
        sunrise: '07:30',
        dhuhr: '12:30',
        dhuhr_jamat: '13:00',
        asr: '15:00',
        asr_2: '15:30',
        asr_jamat: '15:45',
        magrib: '17:30',
        magrib_jamat: '17:35',
        isha: '19:00',
        isha_jamat: '19:15',
      };
    });
    return { city: 'London', times };
  };

  it('keeps today and future dates', () => {
    const today = prayerZoneDate();
    const tomorrow = prayerZoneDate(86400000);
    const nextWeek = prayerZoneDate(7 * 86400000);

    const input = createMockApiResponse([today, tomorrow, nextWeek]);
    const result = filterApiData(input);

    expect(result.city).toBe('London');
    expect(Object.keys(result.times)).toContain(today);
    expect(Object.keys(result.times)).toContain(tomorrow);
    expect(Object.keys(result.times)).toContain(nextWeek);
  });

  it('keeps yesterday (needed for progress bar)', () => {
    const yesterday = prayerZoneDate(-86400000);
    const today = prayerZoneDate();

    const input = createMockApiResponse([yesterday, today]);
    const result = filterApiData(input);

    expect(Object.keys(result.times)).toContain(yesterday);
    expect(Object.keys(result.times)).toContain(today);
  });

  it('filters out dates older than yesterday', () => {
    const twoDaysAgo = prayerZoneDate(-2 * 86400000);
    const weekAgo = prayerZoneDate(-7 * 86400000);
    const today = prayerZoneDate();

    const input = createMockApiResponse([weekAgo, twoDaysAgo, today]);
    const result = filterApiData(input);

    expect(Object.keys(result.times)).not.toContain(weekAgo);
    expect(Object.keys(result.times)).not.toContain(twoDaysAgo);
    expect(Object.keys(result.times)).toContain(today);
  });

  it('preserves city name', () => {
    const input: IApiResponse = {
      city: 'London',
      times: {},
    };
    const result = filterApiData(input);
    expect(result.city).toBe('London');
  });

  it('handles empty times object', () => {
    const input: IApiResponse = {
      city: 'London',
      times: {},
    };
    const result = filterApiData(input);
    expect(Object.keys(result.times)).toHaveLength(0);
  });
});

// =============================================================================
// transformApiData TESTS
// =============================================================================

describe('transformApiData', () => {
  it('transforms single day correctly', () => {
    const input: IApiResponse = {
      city: 'London',
      times: {
        '2026-01-18': {
          date: '2026-01-18',
          fajr: '06:15',
          fajr_jamat: '06:45',
          sunrise: '07:45',
          dhuhr: '12:15',
          dhuhr_jamat: '12:45',
          asr: '14:30',
          asr_2: '15:00',
          asr_jamat: '15:15',
          magrib: '16:45',
          magrib_jamat: '16:50',
          isha: '18:30',
          isha_jamat: '18:45',
        },
      },
    };

    const result = transformApiData(input);

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-01-18');
    expect(result[0].fajr).toBe('06:15');
    expect(result[0].sunrise).toBe('07:45');
    expect(result[0].dhuhr).toBe('12:15');
    expect(result[0].asr).toBe('14:30');
    expect(result[0].magrib).toBe('16:45');
    expect(result[0].isha).toBe('18:30');
  });

  it('calculates derived prayer times', () => {
    const input: IApiResponse = {
      city: 'London',
      times: {
        '2026-01-18': {
          date: '2026-01-18',
          fajr: '06:15',
          fajr_jamat: '06:45',
          sunrise: '07:45',
          dhuhr: '12:15',
          dhuhr_jamat: '12:45',
          asr: '14:30',
          asr_2: '15:00',
          asr_jamat: '15:15',
          magrib: '16:45',
          magrib_jamat: '16:50',
          isha: '18:30',
          isha_jamat: '18:45',
        },
      },
    };

    const result = transformApiData(input);

    // Check derived times exist and are in HH:mm format
    expect(result[0].suhoor).toMatch(/^\d{2}:\d{2}$/);
    expect(result[0].duha).toMatch(/^\d{2}:\d{2}$/);
    expect(result[0].istijaba).toMatch(/^\d{2}:\d{2}$/);
  });

  it('transforms multiple days', () => {
    const input: IApiResponse = {
      city: 'London',
      times: {
        '2026-01-18': {
          date: '2026-01-18',
          fajr: '06:15',
          fajr_jamat: '06:45',
          sunrise: '07:45',
          dhuhr: '12:15',
          dhuhr_jamat: '12:45',
          asr: '14:30',
          asr_2: '15:00',
          asr_jamat: '15:15',
          magrib: '16:45',
          magrib_jamat: '16:50',
          isha: '18:30',
          isha_jamat: '18:45',
        },
        '2026-01-19': {
          date: '2026-01-19',
          fajr: '06:14',
          fajr_jamat: '06:44',
          sunrise: '07:44',
          dhuhr: '12:15',
          dhuhr_jamat: '12:45',
          asr: '14:31',
          asr_2: '15:01',
          asr_jamat: '15:16',
          magrib: '16:46',
          magrib_jamat: '16:51',
          isha: '18:31',
          isha_jamat: '18:46',
        },
      },
    };

    const result = transformApiData(input);

    expect(result).toHaveLength(2);
    expect(result.map((r) => r.date)).toContain('2026-01-18');
    expect(result.map((r) => r.date)).toContain('2026-01-19');
  });

  it('handles empty input', () => {
    const input: IApiResponse = {
      city: 'London',
      times: {},
    };

    const result = transformApiData(input);
    expect(result).toHaveLength(0);
  });

  it('calculates suhoor correctly (before fajr)', () => {
    const input: IApiResponse = {
      city: 'London',
      times: {
        '2026-01-18': {
          date: '2026-01-18',
          fajr: '06:00',
          fajr_jamat: '06:30',
          sunrise: '07:30',
          dhuhr: '12:15',
          dhuhr_jamat: '12:45',
          asr: '14:30',
          asr_2: '15:00',
          asr_jamat: '15:15',
          magrib: '16:45',
          magrib_jamat: '16:50',
          isha: '18:30',
          isha_jamat: '18:45',
        },
      },
    };

    const result = transformApiData(input);
    // Suhoor is fajr - 20 minutes = 05:40
    expect(result[0].suhoor).toBe('05:40');
  });

  it('calculates duha correctly (after sunrise)', () => {
    const input: IApiResponse = {
      city: 'London',
      times: {
        '2026-01-18': {
          date: '2026-01-18',
          fajr: '06:00',
          fajr_jamat: '06:30',
          sunrise: '07:30',
          dhuhr: '12:15',
          dhuhr_jamat: '12:45',
          asr: '14:30',
          asr_2: '15:00',
          asr_jamat: '15:15',
          magrib: '16:45',
          magrib_jamat: '16:50',
          isha: '18:30',
          isha_jamat: '18:45',
        },
      },
    };

    const result = transformApiData(input);
    // Duha is sunrise + 20 minutes = 07:50
    expect(result[0].duha).toBe('07:50');
  });

  it('calculates istijaba correctly (before magrib)', () => {
    const input: IApiResponse = {
      city: 'London',
      times: {
        '2026-01-18': {
          date: '2026-01-18',
          fajr: '06:00',
          fajr_jamat: '06:30',
          sunrise: '07:30',
          dhuhr: '12:15',
          dhuhr_jamat: '12:45',
          asr: '14:30',
          asr_2: '15:00',
          asr_jamat: '15:15',
          magrib: '17:00',
          magrib_jamat: '17:05',
          isha: '18:30',
          isha_jamat: '18:45',
        },
      },
    };

    const result = transformApiData(input);
    // Istijaba is magrib - 60 minutes (TIME_ADJUSTMENTS.istijaba = -60) = 16:00
    expect(result[0].istijaba).toBe('16:00');
  });

  it('never stores Midnight or Last Third: they belong to the night before a day (ISSUES #29)', () => {
    const input: IApiResponse = {
      city: 'London',
      times: {
        '2026-12-31': {
          date: '2026-12-31',
          fajr: '06:00',
          fajr_jamat: '06:30',
          sunrise: '07:30',
          dhuhr: '12:15',
          dhuhr_jamat: '12:45',
          asr: '14:30',
          asr_2: '15:00',
          asr_jamat: '15:15',
          magrib: '16:00',
          magrib_jamat: '16:05',
          isha: '17:45',
          isha_jamat: '18:00',
        },
      },
    };

    const [result] = transformApiData(input);

    // Worked out from two days' records when the lists are built (getNightTimesForDay)
    expect(result).not.toHaveProperty('midnight');
    expect(result).not.toHaveProperty('last third');
  });
});

// =============================================================================
// canonicalDisplayOrder TESTS (F.4 - Friday Extra display order)
// =============================================================================

describe('canonicalDisplayOrder', () => {
  const buildPrayers = (entries: { english: string; time: string }[]): Prayer[] =>
    entries.map((entry) => ({
      english: entry.english,
      datetime: createPrayerDatetime('2026-08-28', entry.time),
    })) as unknown as Prayer[];

  it('passes indices through unchanged for the Standard schedule', () => {
    const prayers = buildPrayers([
      { english: 'Fajr', time: '05:30' },
      { english: 'Sunrise', time: '07:00' },
    ]);

    expect(canonicalDisplayOrder(prayers, ScheduleType.Standard)).toEqual([0, 1]);
  });

  it('orders Friday Extras canonically: Istijaba last despite chronological position', () => {
    // Real Friday shape: Midnight belongs to the displayed day but chronologically
    // falls late evening, pushing Istijaba mid-list under pure chronological order
    const prayers = buildPrayers([
      { english: 'Duha', time: '09:00' },
      { english: 'Istijaba', time: '15:14' },
      { english: 'Midnight', time: '23:17' },
    ]);

    expect(canonicalDisplayOrder(prayers, ScheduleType.Extra)).toEqual([2, 0, 1]);
  });

  it('returns identity order when chronological already equals canonical', () => {
    const prayers = buildPrayers([
      { english: 'Midnight', time: '00:30' },
      { english: 'Last Third', time: '03:30' },
      { english: 'Suhoor', time: '04:30' },
      { english: 'Duha', time: '09:00' },
      { english: 'Istijaba', time: '15:14' },
    ]);

    expect(canonicalDisplayOrder(prayers, ScheduleType.Extra)).toEqual([0, 1, 2, 3, 4]);
  });

  it('keeps unknown prayer names after the canonical ones in stable relative order', () => {
    const prayers = buildPrayers([
      { english: 'Mystery', time: '10:00' },
      { english: 'Istijaba', time: '15:14' },
      { english: 'Midnight', time: '23:17' },
    ]);

    expect(canonicalDisplayOrder(prayers, ScheduleType.Extra)).toEqual([2, 1, 0]);
  });
});

// =============================================================================
// UNREADABLE TIMES: `--:--` PER PRAYER (ai/prompts/unavailable-times-dashes.md, R1-R7)
//
// A time the provider did not give readably takes away that row's time and the time of
// every row worked out from it, and nothing else. A test that only looks at the broken
// row cannot see a knock-on, so these compare every row of every list around the break
// with the build in which everything reads.
// =============================================================================

type Field = RequiredTimeName;
const FIELDS: Field[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];
const STANDARD_NAMES = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Magrib', 'Isha'];
const DAY_MS = 86_400_000;

/** Real London times from londonprayertimes.com for 2026, in FIELDS order */
const LONDON_2026: Record<string, string[]> = {
  '2026-03-27': ['04:11', '05:45', '12:11', '15:33', '18:28', '19:46'],
  '2026-03-28': ['04:09', '05:42', '12:11', '15:34', '18:30', '19:48'],
  '2026-03-29': ['05:07', '06:40', '13:10', '16:35', '19:32', '20:49'],
  '2026-03-30': ['05:05', '06:38', '13:10', '16:36', '19:34', '20:51'],
  '2026-09-10': ['04:52', '06:24', '13:03', '16:31', '19:30', '20:43'],
  '2026-09-11': ['04:54', '06:26', '13:02', '16:29', '19:28', '20:42'],
  '2026-09-12': ['04:56', '06:28', '13:02', '16:27', '19:25', '20:39'],
  '2026-09-13': ['04:57', '06:29', '13:02', '16:26', '19:23', '20:37'],
  '2026-09-15': ['05:00', '06:32', '13:01', '16:23', '19:18', '20:33'],
  '2026-10-16': ['05:51', '07:23', '12:51', '15:31', '18:08', '19:31'],
  '2026-10-17': ['05:52', '07:25', '12:51', '15:30', '18:06', '19:29'],
  '2026-10-18': ['05:54', '07:27', '12:51', '15:28', '18:04', '19:27'],
  '2026-10-19': ['05:55', '07:28', '12:51', '15:26', '18:02', '19:25'],
  '2026-10-20': ['05:57', '07:30', '12:50', '15:25', '18:00', '19:23'],
};

const OCTOBER = ['2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20'];
const SEPTEMBER = ['2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13'];
const MARCH = ['2026-03-27', '2026-03-28', '2026-03-29', '2026-03-30'];

const stored = new Map<string, ISingleApiResponseTransformed>();

/**
 * Stores these days the way a download is stored (transformApiData), each `date field` listed in
 * `unreadable` null, as api/client.ts leaves a value it cannot read
 */
const storeDays = (dates: string[], unreadable: string[] = []) => {
  const times: IValidatedApiResponse['times'] = {};
  for (const date of dates) {
    const entry = {} as Record<Field, string | null>;
    FIELDS.forEach((field, index) => {
      entry[field] = unreadable.includes(`${date} ${field}`) ? null : LONDON_2026[date][index];
    });
    times[date] = entry;
  }

  stored.clear();
  for (const record of transformApiData({ city: 'London', times })) stored.set(record.date, record);
};

const plusDays = (date: string, days: number): string =>
  new Date(Date.parse(`${date}T12:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
const isFriday = (date: string): boolean => new Date(`${date}T12:00:00Z`).getUTCDay() === 5;
const extrasNamesOn = (date: string): string[] => [
  'Midnight',
  'Last Third',
  'Suhoor',
  'Duha',
  ...(isFriday(date) ? ['Istijaba'] : []),
];

interface RowView {
  type: ScheduleType;
  english: string;
  arabic: string;
  belongsToDate: string;
  at: string | null;
  time: string | null;
}

/** Everything a row shows or an alarm reads, with the instant as an ISO string so any timezone compares alike */
const view = (row: Prayer): RowView => ({
  type: row.type,
  english: row.english,
  arabic: row.arabic,
  belongsToDate: row.belongsToDate,
  at: row.datetime?.toISOString() ?? null,
  time: row.time,
});

const keyOf = (row: { type: ScheduleType; belongsToDate: string; english: string }) =>
  `${row.type} ${row.belongsToDate} ${row.english}`;
const standardRow = (date: string, english: string) => `${ScheduleType.Standard} ${date} ${english}`;
const extrasRow = (date: string, english: string) => `${ScheduleType.Extra} ${date} ${english}`;

/** Both sequences over these days, Standard then Extras, as the screen builds them */
const buildBoth = (firstDate: string, dayCount: number): RowView[] =>
  [ScheduleType.Standard, ScheduleType.Extra].flatMap((type) =>
    createPrayerSequence(type, new Date(`${firstDate}T12:00:00Z`), dayCount).prayers.map(view)
  );

/** A build with exactly these rows' times taken away, and every other row exactly as it was */
const withoutTimes = (build: RowView[], keys: string[]): RowView[] =>
  build.map((row) => (keys.includes(keyOf(row)) ? { ...row, at: null, time: null } : row));

/** Every row of a list day in a build, both lists */
const wholeDay = (build: RowView[], date: string): string[] =>
  build.filter((row) => row.belongsToDate === date).map(keyOf);

/** The night rows of a list day, which run from the day before's Magrib */
const nightOf = (date: string): string[] => [extrasRow(date, 'Midnight'), extrasRow(date, 'Last Third')];

/** Readable rows that do not come strictly after the readable row before them */
const outOfTimeOrder = (prayers: Prayer[]): string[] => {
  const readable = prayers.filter((row): row is ReadablePrayer => row.datetime !== null);

  return readable.slice(1).flatMap((row, index) => {
    const before = readable[index];
    if (row.datetime > before.datetime) return [];
    return [`${row.belongsToDate} ${row.english} not after ${before.belongsToDate} ${before.english}`];
  });
};

beforeEach(() => {
  (Database.getPrayerByDateString as jest.Mock).mockImplementation((date: string) => stored.get(date) ?? null);
});

describe('transformApiData with times api/client.ts could not read', () => {
  const OCT_16 = { fajr: '05:51', sunrise: '07:23', dhuhr: '12:51', asr: '15:31', magrib: '18:08', isha: '19:31' };
  const OCT_17 = { fajr: '05:52', sunrise: '07:25', dhuhr: '12:51', asr: '15:30', magrib: '18:06', isha: '19:29' };

  // [unreadable on 16 October, its Suhoor, Duha, Istijaba]
  it.each([
    [[], '05:31', '07:43', '17:08'],
    [['fajr'], null, '07:43', '17:08'],
    [['sunrise'], '05:31', null, '17:08'],
    [['dhuhr'], '05:31', '07:43', '17:08'],
    [['asr'], '05:31', '07:43', '17:08'],
    [['magrib'], '05:31', '07:43', null],
    [['isha'], '05:31', '07:43', '17:08'],
    [['fajr', 'magrib'], null, '07:43', null],
    [FIELDS, null, null, null],
  ] as [Field[], string | null, string | null, string | null][])(
    'with %j unreadable: Suhoor %s, Duha %s, Istijaba %s, and every other value as given',
    (unreadable, suhoor, duha, istijaba) => {
      const october16: Record<Field, string | null> = { ...OCT_16 };
      for (const field of unreadable) october16[field] = null;

      // The next day in the same payload keeps its own derived times: nothing leaks across days
      expect(transformApiData({ city: 'London', times: { '2026-10-16': october16, '2026-10-17': OCT_17 } })).toEqual([
        { date: '2026-10-16', ...october16, suhoor, duha, istijaba },
        { date: '2026-10-17', ...OCT_17, suhoor: '05:32', duha: '07:45', istijaba: '17:06' },
      ]);
    }
  );
});

describe('which rows lose their time when one field on a day cannot be read', () => {
  /** The rows each field on day D is worked out into, beyond nothing else (the brief's dependency graph) */
  const KNOCK_ON: Record<Field, { extras: string[]; nextExtras: string[] }> = {
    fajr: { extras: ['Midnight', 'Last Third', 'Suhoor'], nextExtras: [] },
    sunrise: { extras: ['Duha'], nextExtras: [] },
    dhuhr: { extras: [], nextExtras: [] },
    asr: { extras: [], nextExtras: [] },
    magrib: { extras: ['Istijaba'], nextExtras: ['Midnight', 'Last Third'] },
    isha: { extras: [], nextExtras: [] },
  };

  const knockOn = (date: string, field: Field): string[] => [
    standardRow(date, STANDARD_NAMES[FIELDS.indexOf(field)]),
    ...KNOCK_ON[field].extras
      .filter((english) => extrasNamesOn(date).includes(english))
      .map((english) => extrasRow(date, english)),
    ...KNOCK_ON[field].nextExtras.map((english) => extrasRow(plusDays(date, 1), english)),
  ];

  // [run, days stored, D−1 (the first list compared, four lists in all), D]
  const RUNS: [string, string[], string, string][] = [
    ['Sunday 18 October, every row of the day before readable', OCTOBER, '2026-10-17', '2026-10-18'],
    ['Friday 11 September, Istijaba on the list', SEPTEMBER, '2026-09-10', '2026-09-11'],
    ['Saturday 28 March, the clocks going forward that night', MARCH, '2026-03-27', '2026-03-28'],
  ];

  it.each(
    RUNS.flatMap(([run, days, firstList, date]) => FIELDS.map((field) => [field, run, days, firstList, date] as const))
  )(
    'an unreadable %s on %s takes the time from its dependants and nothing else, across D−1 to D+2',
    (field, _, days, firstList, date) => {
      storeDays(days);
      const readable = buildBoth(firstList, 4);
      const expected = knockOn(date, field);

      // Each of those rows had a time to lose, so the comparison below cannot pass by having nothing to change
      expect(readable.filter((row) => expected.includes(keyOf(row))).map((row) => row.at !== null)).toEqual(
        expected.map(() => true)
      );

      storeDays(days, [`${date} ${field}`]);
      expect(buildBoth(firstList, 4)).toEqual(withoutTimes(readable, expected));
    }
  );

  // [fields unreadable on Friday 11 September, every row that loses its time]
  it.each([
    [
      ['fajr', 'magrib'],
      [
        standardRow('2026-09-11', 'Fajr'),
        standardRow('2026-09-11', 'Magrib'),
        ...nightOf('2026-09-11'),
        extrasRow('2026-09-11', 'Suhoor'),
        extrasRow('2026-09-11', 'Istijaba'),
        ...nightOf('2026-09-12'),
      ],
    ],
    [
      ['sunrise', 'asr', 'isha'],
      [
        standardRow('2026-09-11', 'Sunrise'),
        standardRow('2026-09-11', 'Asr'),
        standardRow('2026-09-11', 'Isha'),
        extrasRow('2026-09-11', 'Duha'),
      ],
    ],
    [
      ['dhuhr', 'magrib', 'isha'],
      [
        standardRow('2026-09-11', 'Dhuhr'),
        standardRow('2026-09-11', 'Magrib'),
        standardRow('2026-09-11', 'Isha'),
        extrasRow('2026-09-11', 'Istijaba'),
        ...nightOf('2026-09-12'),
      ],
    ],
  ] as [Field[], string[]][])(
    'several fields on one day (%j) take the times of exactly their dependants',
    (fields, expected) => {
      storeDays(SEPTEMBER);
      const readable = buildBoth('2026-09-10', 4);

      storeDays(
        SEPTEMBER,
        fields.map((field) => `2026-09-11 ${field}`)
      );
      expect(buildBoth('2026-09-10', 4)).toEqual(withoutTimes(readable, expected));
    }
  );

  // An edited backup can store a day without one of its keys at all, which must read exactly like a null. The
  // day's own stored Suhoor and Duha keys are still there, so only the rows read from the missing key lose a time
  it.each([
    ['fajr', [standardRow('2026-09-11', 'Fajr'), ...nightOf('2026-09-11')]],
    ['asr', [standardRow('2026-09-11', 'Asr')]],
    ['magrib', [standardRow('2026-09-11', 'Magrib'), extrasRow('2026-09-11', 'Istijaba'), ...nightOf('2026-09-12')]],
  ] as [Field, string[]][])(
    'a stored Friday 11 September without its %s key takes the time from the rows read from it, without throwing',
    (field, expected) => {
      storeDays(SEPTEMBER);
      const readable = buildBoth('2026-09-10', 4);

      const record = stored.get('2026-09-11') as ISingleApiResponseTransformed;
      const withoutKey = Object.fromEntries(Object.entries(record).filter(([key]) => key !== field));
      stored.set('2026-09-11', withoutKey as unknown as ISingleApiResponseTransformed);

      expect(buildBoth('2026-09-10', 4)).toEqual(withoutTimes(readable, expected));
    }
  );

  it.each(RUNS)(
    'every field unreadable on %s takes every row of that day, Standard and Extras, and the night after it, and a day missing from storage does exactly the same',
    (_, days, firstList, date) => {
      storeDays(days);
      const readable = buildBoth(firstList, 4);
      const expected = [...wholeDay(readable, date), ...nightOf(plusDays(date, 1))];
      expect(wholeDay(readable, date)).toHaveLength(6 + extrasNamesOn(date).length);

      storeDays(
        days,
        FIELDS.map((field) => `${date} ${field}`)
      );
      const everyFieldUnreadable = buildBoth(firstList, 4);
      expect(everyFieldUnreadable).toEqual(withoutTimes(readable, expected));

      // R7: the day is still listed, with nothing standing in for it
      storeDays(days.filter((stored) => stored !== date));
      expect(buildBoth(firstList, 4)).toEqual(everyFieldUnreadable);
    }
  );

  // Across 17 to 20 October, breaking 18 and 19 October
  it.each([
    [
      'both unreadable',
      OCTOBER,
      [...FIELDS.map((field) => `2026-10-18 ${field}`), ...FIELDS.map((field) => `2026-10-19 ${field}`)],
    ],
    ['both missing from storage', ['2026-10-16', '2026-10-17', '2026-10-20'], []],
    [
      'the first missing and the second unreadable',
      ['2026-10-16', '2026-10-17', '2026-10-19', '2026-10-20'],
      FIELDS.map((field) => `2026-10-19 ${field}`),
    ],
  ])(
    'two days in a row, %s, take both whole days and the night after them, and nothing else',
    (_, days, unreadable) => {
      storeDays(OCTOBER);
      const readable = buildBoth('2026-10-17', 4);
      const expected = [
        ...wholeDay(readable, '2026-10-18'),
        ...wholeDay(readable, '2026-10-19'),
        ...nightOf('2026-10-20'),
      ];

      storeDays(days, unreadable);
      expect(buildBoth('2026-10-17', 4)).toEqual(withoutTimes(readable, expected));
    }
  );

  // The app's three-day window over 17 to 19 October, with one day missing from storage at each place
  it.each([
    ['the day before the window', '2026-10-16', () => nightOf('2026-10-17')],
    ['the first day', '2026-10-17', (build: RowView[]) => [...wholeDay(build, '2026-10-17'), ...nightOf('2026-10-18')]],
    [
      'the middle day',
      '2026-10-18',
      (build: RowView[]) => [...wholeDay(build, '2026-10-18'), ...nightOf('2026-10-19')],
    ],
    ['the last day', '2026-10-19', (build: RowView[]) => wholeDay(build, '2026-10-19')],
    ['the day after the window', '2026-10-20', () => []],
  ])(
    'a day missing at %s (%s) leaves the window whole, with only its own rows and the night after it without a time',
    (_, missing, expectedIn) => {
      storeDays(OCTOBER);
      const readable = buildBoth('2026-10-17', 3);

      storeDays(OCTOBER.filter((date) => date !== missing));
      const build = buildBoth('2026-10-17', 3);

      expect(build.filter((row) => row.type === ScheduleType.Standard)).toHaveLength(18);
      expect(build.filter((row) => row.type === ScheduleType.Extra)).toHaveLength(12);
      expect(build).toEqual(withoutTimes(readable, expectedIn(readable)));
    }
  );
});

describe('createPrayerSequence over a range with a day missing from storage', () => {
  it('lists every day whole and in list order, with the missing day and its night without times, and every readable row in time order', () => {
    // Gap map item 11: 14 September is not stored
    storeDays(['2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13', '2026-09-15']);
    const days = ['2026-09-11', '2026-09-12', '2026-09-13', '2026-09-14', '2026-09-15'];
    const start = new Date('2026-09-11T11:00:00Z');
    const standard = createPrayerSequence(ScheduleType.Standard, start, 5);
    const extras = createPrayerSequence(ScheduleType.Extra, start, 5);
    const label = (row: Prayer) => `${row.belongsToDate} ${row.english}`;

    expect(standard.type).toBe(ScheduleType.Standard);
    expect(extras.type).toBe(ScheduleType.Extra);
    expect(standard.prayers.map(label)).toEqual(
      days.flatMap((date) => STANDARD_NAMES.map((english) => `${date} ${english}`))
    );
    expect(extras.prayers.map(label)).toEqual(
      days.flatMap((date) => extrasNamesOn(date).map((english) => `${date} ${english}`))
    );
    expect(standard.prayers).toHaveLength(30);
    expect(extras.prayers).toHaveLength(21); // Friday 11 September carries Istijaba

    const withoutTime = (prayers: Prayer[]) => prayers.filter((row) => row.datetime === null);
    expect(withoutTime(standard.prayers).map(label)).toEqual(STANDARD_NAMES.map((english) => `2026-09-14 ${english}`));
    expect(withoutTime(extras.prayers).map(label)).toEqual([
      '2026-09-14 Midnight',
      '2026-09-14 Last Third',
      '2026-09-14 Suhoor',
      '2026-09-14 Duha',
      '2026-09-15 Midnight',
      '2026-09-15 Last Third',
    ]);
    expect([...withoutTime(standard.prayers), ...withoutTime(extras.prayers)].every((row) => row.time === null)).toBe(
      true
    );
    expect(outOfTimeOrder(standard.prayers)).toEqual([]);
    expect(outOfTimeOrder(extras.prayers)).toEqual([]);
  });
});

describe('createPrayersForDate', () => {
  it('builds one list with its night from the day before', () => {
    storeDays(OCTOBER);

    expect(createPrayersForDate(ScheduleType.Extra, '2026-10-18').map(view)).toEqual([
      {
        type: ScheduleType.Extra,
        english: 'Midnight',
        arabic: EXTRAS_ARABIC[0],
        belongsToDate: '2026-10-18',
        at: '2026-10-17T23:00:00.000Z',
        time: '00:00',
      },
      {
        type: ScheduleType.Extra,
        english: 'Last Third',
        arabic: EXTRAS_ARABIC[1],
        belongsToDate: '2026-10-18',
        at: '2026-10-18T00:58:00.000Z',
        time: '01:58',
      },
      {
        type: ScheduleType.Extra,
        english: 'Suhoor',
        arabic: EXTRAS_ARABIC[2],
        belongsToDate: '2026-10-18',
        at: '2026-10-18T04:34:00.000Z',
        time: '05:34',
      },
      {
        type: ScheduleType.Extra,
        english: 'Duha',
        arabic: EXTRAS_ARABIC[3],
        belongsToDate: '2026-10-18',
        at: '2026-10-18T06:47:00.000Z',
        time: '07:47',
      },
    ]);
  });

  it('lists every row of a Friday missing from storage, Istijaba included, without a time', () => {
    storeDays(SEPTEMBER.filter((date) => date !== '2026-09-11'));

    expect(createPrayersForDate(ScheduleType.Extra, '2026-09-11')).toEqual(
      ['Midnight', 'Last Third', 'Suhoor', 'Duha', 'Istijaba'].map((english, index) => ({
        type: ScheduleType.Extra,
        english,
        arabic: EXTRAS_ARABIC[index],
        datetime: null,
        time: null,
        belongsToDate: '2026-09-11',
      }))
    );
    expect(createPrayersForDate(ScheduleType.Standard, '2026-09-11')).toEqual(
      STANDARD_NAMES.map((english, index) => ({
        type: ScheduleType.Standard,
        english,
        arabic: PRAYERS_ARABIC[index],
        datetime: null,
        time: null,
        belongsToDate: '2026-09-11',
      }))
    );
  });

  // [case, fields unreadable, days not stored, list day]
  it.each([
    ['a readable day', [], [], '2026-09-12'],
    ['the first stored day, with no day before it', [], [], '2026-09-10'],
    ['a Friday with its Magrib unreadable', ['2026-09-11 magrib'], [], '2026-09-11'],
    ['the day after that Magrib', ['2026-09-11 magrib'], [], '2026-09-12'],
    ['a day with every field unreadable', FIELDS.map((field) => `2026-09-12 ${field}`), [], '2026-09-12'],
    ['a day missing from storage', [], ['2026-09-12'], '2026-09-12'],
    ['the day after a day missing from storage', [], ['2026-09-12'], '2026-09-13'],
  ] as [string, string[], string[], string][])(
    'is exactly that day of the sequence, for %s',
    (_, unreadable, missing, date) => {
      storeDays(
        SEPTEMBER.filter((stored) => !missing.includes(stored)),
        unreadable
      );

      for (const type of [ScheduleType.Standard, ScheduleType.Extra]) {
        const inSequence = createPrayerSequence(type, new Date('2026-09-10T12:00:00Z'), 4).prayers.filter(
          (row) => row.belongsToDate === date
        );
        expect(createPrayersForDate(type, date)).toEqual(inSequence);
      }
    }
  );
});

describe('getPrayerForDate with times that could not be read', () => {
  it('returns the row without a time for a field that could not be read, not null', () => {
    storeDays(OCTOBER, ['2026-10-18 asr', '2026-10-17 magrib']);

    expect(getPrayerForDate(ScheduleType.Standard, 'Asr', '2026-10-18')).toEqual({
      type: ScheduleType.Standard,
      english: 'Asr',
      arabic: PRAYERS_ARABIC[3],
      datetime: null,
      time: null,
      belongsToDate: '2026-10-18',
    });
    expect(getPrayerForDate(ScheduleType.Extra, 'Last Third', '2026-10-18')).toEqual({
      type: ScheduleType.Extra,
      english: 'Last Third',
      arabic: EXTRAS_ARABIC[1],
      datetime: null,
      time: null,
      belongsToDate: '2026-10-18',
    });
    // The rest of the day still reads
    expect(getPrayerForDate(ScheduleType.Standard, 'Magrib', '2026-10-18')?.datetime?.toISOString()).toBe(
      '2026-10-18T17:04:00.000Z'
    );
  });

  it('returns a row without a time for every prayer of a day missing from storage, and Istijaba only on a Friday', () => {
    storeDays(OCTOBER.filter((date) => date !== '2026-10-16' && date !== '2026-10-19'));

    for (const english of STANDARD_NAMES) {
      expect(getPrayerForDate(ScheduleType.Standard, english, '2026-10-19')).toMatchObject({
        english,
        datetime: null,
        time: null,
      });
    }
    for (const english of extrasNamesOn('2026-10-16')) {
      expect(getPrayerForDate(ScheduleType.Extra, english, '2026-10-16')).toMatchObject({
        english,
        datetime: null,
        time: null,
      });
    }
    expect(getPrayerForDate(ScheduleType.Extra, 'Istijaba', '2026-10-16')).not.toBeNull();
    expect(getPrayerForDate(ScheduleType.Extra, 'Istijaba', '2026-10-19')).toBeNull();
  });

  it('returns null only for a prayer that is not on the list', () => {
    storeDays(OCTOBER);

    expect(getPrayerForDate(ScheduleType.Extra, 'Istijaba', '2026-10-18')).toBeNull();
    expect(getPrayerForDate(ScheduleType.Standard, 'Istijaba', '2026-10-16')).toBeNull();
    expect(getPrayerForDate(ScheduleType.Extra, 'Fajr', '2026-10-16')).toBeNull();
  });
});

// =============================================================================
// THE OWNER'S RULE: NEVER COPY, AVERAGE OR SYNTHESISE A PRAYER TIME (finding 70)
//
// Over a fixed five-day London window, with many different sets of times unreadable,
// every row must either be exactly what the fully readable build has, or have no time at
// all, and it has no time exactly when a time it is worked out from is missing. A row
// with a time different from the readable build's would be a time made up.
// =============================================================================

describe('never copies, averages or synthesises a prayer time', () => {
  interface Case {
    label: string;
    unreadable: string[];
    missing: string[];
  }

  /** The times each row is worked out from: [list day, field] */
  const dependencies = (row: RowView): [string, Field][] => {
    const date = row.belongsToDate;
    if (row.type === ScheduleType.Standard) return [[date, FIELDS[STANDARD_NAMES.indexOf(row.english)]]];
    if (row.english === 'Suhoor') return [[date, 'fajr']];
    if (row.english === 'Duha') return [[date, 'sunrise']];
    if (row.english === 'Istijaba') return [[date, 'magrib']];
    return [
      [date, 'fajr'],
      [plusDays(date, -1), 'magrib'],
    ];
  };

  const cases = (): Case[] => {
    const all: Case[] = [{ label: 'nothing unreadable', unreadable: [], missing: [] }];

    for (const date of OCTOBER) {
      for (const field of FIELDS)
        all.push({ label: `${date} ${field}`, unreadable: [`${date} ${field}`], missing: [] });
      FIELDS.forEach((first, index) => {
        for (const second of FIELDS.slice(index + 1)) {
          all.push({
            label: `${date} ${first} and ${second}`,
            unreadable: [`${date} ${first}`, `${date} ${second}`],
            missing: [],
          });
        }
      });
      all.push({ label: `${date} every field`, unreadable: FIELDS.map((field) => `${date} ${field}`), missing: [] });
      all.push({ label: `${date} missing`, unreadable: [], missing: [date] });
    }
    for (const field of FIELDS) {
      all.push({ label: `${field} on every day`, unreadable: OCTOBER.map((date) => `${date} ${field}`), missing: [] });
    }
    OCTOBER.slice(1).forEach((date, index) => {
      all.push({
        label: `${OCTOBER[index]} magrib and ${date} fajr`,
        unreadable: [`${OCTOBER[index]} magrib`, `${date} fajr`],
        missing: [],
      });
    });

    // A fixed spread of mixed cases (Park-Miller), identical on every run and every machine
    let seed = 20260913;
    const random = () => {
      seed = (seed * 48271) % 2147483647;
      return seed / 2147483647;
    };
    for (let index = 0; index < 150; index++) {
      const unreadable = OCTOBER.flatMap((date) =>
        FIELDS.filter(() => random() < 0.25).map((field) => `${date} ${field}`)
      );
      const missing = OCTOBER.filter(() => random() < 0.15);
      all.push({
        label: `mixed ${index}: ${unreadable.join(', ')} | missing ${missing.join(', ')}`,
        unreadable,
        missing,
      });
    }

    return all;
  };

  it('gives every row either the readable build’s exact time or none, and none exactly when a time it needs is missing; getPrayerForDate agrees', () => {
    storeDays(OCTOBER);
    const readable = buildBoth(OCTOBER[0], OCTOBER.length);
    const checked = cases();
    const violations: string[] = [];

    for (const { label, unreadable, missing } of checked) {
      storeDays(
        OCTOBER.filter((date) => !missing.includes(date)),
        unreadable
      );
      const build = buildBoth(OCTOBER[0], OCTOBER.length);
      const hasTime = ([date, field]: [string, Field]) =>
        OCTOBER.includes(date) && !missing.includes(date) && !unreadable.includes(`${date} ${field}`);

      if (build.map(keyOf).join() !== readable.map(keyOf).join()) {
        violations.push(`${label}: the lists changed shape`);
        continue;
      }

      build.forEach((row, index) => {
        const needsMissingTime = !dependencies(row).every(hasTime);
        const expected = needsMissingTime ? { ...readable[index], at: null, time: null } : readable[index];
        if (JSON.stringify(row) !== JSON.stringify(expected)) {
          violations.push(`${label}: ${keyOf(row)} ${row.at} ${row.time}, expected ${expected.at} ${expected.time}`);
        }

        const single = getPrayerForDate(row.type, row.english, row.belongsToDate);
        if (!single || JSON.stringify(view(single)) !== JSON.stringify(row)) {
          violations.push(`${label}: getPrayerForDate disagrees with the list on ${keyOf(row)}`);
        }
      });
    }

    // 15 October is not in the window, so only the first day's night had no time to begin with
    expect(readable.filter((row) => row.at === null).map(keyOf)).toEqual(nightOf('2026-10-16'));
    expect(checked.length).toBeGreaterThan(250);
    expect(violations).toEqual([]);
  });
});
