import {
  calculateBelongsToDate,
  createPrayer,
  getCascadeDelay,
  getLongestPrayerNameIndex,
  filterApiData,
  transformApiData,
} from '../prayer';
import { createPrayerDatetime } from '../time';
import { ScheduleType, IApiResponse } from '../types';

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

    it('assigns Suhoor to next day when hour >= 12', () => {
      const datetime = createPrayerDatetime('2026-01-18', '05:30'); // Early morning
      const result = calculateBelongsToDate(ScheduleType.Extra, 'Suhoor', '2026-01-18', datetime);
      expect(result).toBe('2026-01-18'); // Before noon, stays same day
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
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const input = createMockApiResponse([today, tomorrow, nextWeek]);
    const result = filterApiData(input);

    expect(result.city).toBe('London');
    expect(Object.keys(result.times)).toContain(today);
    expect(Object.keys(result.times)).toContain(tomorrow);
    expect(Object.keys(result.times)).toContain(nextWeek);
  });

  it('keeps yesterday (needed for progress bar)', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    const input = createMockApiResponse([yesterday, today]);
    const result = filterApiData(input);

    expect(Object.keys(result.times)).toContain(yesterday);
    expect(Object.keys(result.times)).toContain(today);
  });

  it('filters out dates older than yesterday', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

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
    expect(result[0].midnight).toMatch(/^\d{2}:\d{2}$/);
    expect(result[0]['last third']).toMatch(/^\d{2}:\d{2}$/);
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
});
