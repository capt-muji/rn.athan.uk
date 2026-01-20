import { addDays, getHours } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

import {
  PRAYERS_ENGLISH,
  PRAYERS_ARABIC,
  EXTRAS_ENGLISH,
  EXTRAS_ARABIC,
  TIME_ADJUSTMENTS,
  ANIMATION,
  ISLAMIC_DAY,
} from '@/shared/constants';
import * as TimeUtils from '@/shared/time';
import { createPrayerDatetime } from '@/shared/time';
import {
  ISingleApiResponseTransformed,
  IApiResponse,
  IApiTimes,
  Prayer,
  PrayerSequence,
  ScheduleType,
} from '@/shared/types';
import * as Database from '@/stores/database';

// =============================================================================
// DATA TRANSFORMATION FUNCTIONS
// Used by API client for processing prayer data
// =============================================================================

/**
 * Filters API response data to only include yesterday, today and future dates
 * Yesterday is included to support progress bar calculation for first prayer (Fajr)
 * @param apiData Raw API response data
 * @returns Filtered API response containing yesterday and future dates
 */
export const filterApiData = (apiData: IApiResponse): IApiResponse => {
  const timesFiltered: IApiTimes = {};

  const entries = Object.entries(apiData.times);

  entries.forEach(([date, times]) => {
    // Include yesterday, today, and future dates
    if (!TimeUtils.isDateYesterdayOrFuture(date)) return;
    timesFiltered[date] = times;
  });

  return {
    city: apiData.city,
    times: timesFiltered,
  };
};

/**
 * Transforms API response data into normalized prayer schedule format
 * Adds calculated times for additional prayers and special times
 * @param apiData Filtered API response data
 * @returns Array of transformed prayer schedules
 */
export const transformApiData = (apiData: IApiResponse): ISingleApiResponseTransformed[] => {
  const transformations: ISingleApiResponseTransformed[] = [];

  const entries = Object.entries(apiData.times);

  entries.forEach(([date, times]) => {
    const schedule: ISingleApiResponseTransformed = {
      date,
      fajr: times.fajr,
      sunrise: times.sunrise,
      dhuhr: times.dhuhr,
      asr: times.asr,
      magrib: times.magrib,
      isha: times.isha,
      midnight: TimeUtils.getMidnightTime(times.magrib, times.fajr),
      'last third': TimeUtils.getLastThirdOfNight(times.magrib, times.fajr),
      suhoor: TimeUtils.adjustTime(times.fajr, TIME_ADJUSTMENTS.suhoor),
      duha: TimeUtils.adjustTime(times.sunrise, TIME_ADJUSTMENTS.duha),
      istijaba: TimeUtils.adjustTime(times.magrib, TIME_ADJUSTMENTS.istijaba),
    };

    transformations.push(schedule);
  });

  return transformations;
};

// =============================================================================
// UI HELPER FUNCTIONS
// Used by components for animations and measurements
// =============================================================================

export const getCascadeDelay = (index: number, type: ScheduleType): number => {
  const isStandard = type === ScheduleType.Standard;
  const length = isStandard ? PRAYERS_ENGLISH.length : PRAYERS_ARABIC.length;

  return (length - index) * ANIMATION.cascadeDelay;
};

export const getLongestPrayerNameIndex = (type: ScheduleType): number => {
  const names = type === ScheduleType.Standard ? PRAYERS_ENGLISH : EXTRAS_ENGLISH;
  let maxLength = 0;
  let maxIndex = 0;

  names.forEach((name, index) => {
    if (name.length > maxLength) {
      maxLength = name.length;
      maxIndex = index;
    }
  });

  return maxIndex;
};

/**
 * Gets the hour in London timezone for a given date
 * Used for determining if a prayer crosses midnight in London
 * @param date Date object (UTC internally)
 * @returns Hour (0-23) in London timezone
 */
const getLondonHours = (date: Date): number => {
  const londonDate = toZonedTime(date, 'Europe/London');
  return getHours(londonDate);
};

/**
 * Calculates which Islamic day a prayer belongs to
 *
 * Islamic Day Rule: The day changes after Isha passes.
 * If Isha is between 00:00-06:00, it belongs to the previous day.
 *
 * @param type Schedule type (Standard or Extra)
 * @param prayerEnglish English name of the prayer
 * @param calendarDate Calendar date string (YYYY-MM-DD)
 * @param prayerDateTime Full datetime (must be created via createPrayerDatetime)
 * @returns The Islamic day this prayer belongs to (YYYY-MM-DD)
 */
export const calculateBelongsToDate = (
  type: ScheduleType,
  prayerEnglish: string,
  calendarDate: string,
  prayerDateTime: Date
): string => {
  const hours = getLondonHours(prayerDateTime);

  // STANDARD: Isha between 00:00-06:00 belongs to previous day
  if (type === ScheduleType.Standard && prayerEnglish === 'Isha' && hours < ISLAMIC_DAY.EARLY_MORNING_CUTOFF_HOUR) {
    return TimeUtils.formatDateShort(addDays(prayerDateTime, -1));
  }

  // EXTRAS: Night prayers before midnight belong to next day
  if (type === ScheduleType.Extra) {
    const nightPrayers = ['Midnight', 'Last Third', 'Suhoor'];
    if (nightPrayers.includes(prayerEnglish) && hours >= 12) {
      return TimeUtils.formatDateShort(addDays(prayerDateTime, 1));
    }
  }

  return calendarDate;
};

/**
 * Parameters for creating a Prayer object
 */
export interface CreatePrayerParams {
  type: ScheduleType;
  english: string;
  arabic: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:mm format
}

/**
 * Factory function to create a Prayer object from parameters
 * Combines date and time into a full datetime, generates unique id
 *
 * Note: belongsToDate is calculated using calculateBelongsToDate() and may differ
 * from the input date parameter (e.g., Isha at 1am belongs to previous day)
 *
 * @param params Prayer creation parameters
 * @returns Complete Prayer object
 *
 * @example
 * // Normal case: belongsToDate matches input date
 * createPrayer({ type: ScheduleType.Standard, english: "Fajr", arabic: "الفجر", date: "2026-01-18", time: "06:12" })
 * // Returns: { ..., belongsToDate: "2026-01-18" }
 *
 * // Edge case: Summer Isha at 1am - belongsToDate is PREVIOUS day
 * createPrayer({ type: ScheduleType.Standard, english: "Isha", arabic: "العشاء", date: "2026-06-22", time: "01:00" })
 * // Returns: { ..., belongsToDate: "2026-06-21" }  // Note: June 21, not 22!
 */
export const createPrayer = (params: CreatePrayerParams): Prayer => {
  const { type, english, arabic, date, time } = params;
  const datetime = createPrayerDatetime(date, time);

  return {
    type,
    english,
    arabic,
    datetime,
    time,
    belongsToDate: calculateBelongsToDate(type, english, date, datetime),
  };
};

/**
 * Helper: Get prayer names for a given date and schedule type
 * Filters out Istijaba on non-Fridays for Extra schedule
 */
function getPrayerNamesForDate(type: ScheduleType, date: Date): { english: string[]; arabic: string[] } {
  const isStandard = type === ScheduleType.Standard;

  if (isStandard) {
    return { english: PRAYERS_ENGLISH, arabic: PRAYERS_ARABIC };
  }

  // Extras schedule: filter out Istijaba on non-Fridays
  if (!TimeUtils.isFriday(date)) {
    return {
      english: EXTRAS_ENGLISH.filter((name) => name.toLowerCase() !== 'istijaba'),
      arabic: EXTRAS_ARABIC.filter((name) => name !== 'استجابة'),
    };
  }

  return { english: EXTRAS_ENGLISH, arabic: EXTRAS_ARABIC };
}

/**
 * Helper: Adjust prayer date for midnight-crossing prayers
 * Handles Isha after midnight (Standard) and night prayers (Extras)
 */
function adjustPrayerDateForMidnightCrossing(
  type: ScheduleType,
  prayerName: string,
  baseDate: Date,
  hours: number
): string {
  const isStandard = type === ScheduleType.Standard;
  const baseDateString = TimeUtils.formatDateShort(baseDate);

  // STANDARD: Isha 00:00-06:00 occurs on NEXT calendar day (for countdown)
  if (isStandard && prayerName === 'Isha' && hours < ISLAMIC_DAY.EARLY_MORNING_CUTOFF_HOUR) {
    return TimeUtils.formatDateShort(addDays(baseDate, 1));
  }

  // EXTRAS: Night prayers >=12:00 occurred on PREVIOUS calendar day
  if (!isStandard) {
    const nightPrayers = ['Midnight', 'Last Third', 'Suhoor'];
    if (nightPrayers.includes(prayerName) && hours >= 12) {
      return TimeUtils.formatDateShort(addDays(baseDate, -1));
    }
  }

  return baseDateString;
}

/**
 * Helper: Create all prayers for a single day
 * Returns array of Prayer objects for the given date and raw data
 */
function createPrayersForSingleDay(
  type: ScheduleType,
  currentDate: Date,
  rawData: ISingleApiResponseTransformed
): Prayer[] {
  const prayers: Prayer[] = [];
  const { english: namesEnglish, arabic: namesArabic } = getPrayerNamesForDate(type, currentDate);

  namesEnglish.forEach((name, index) => {
    const prayerTime = rawData[name.toLowerCase() as keyof ISingleApiResponseTransformed] as string;
    const [hours] = prayerTime.split(':').map(Number);
    const prayerDateString = adjustPrayerDateForMidnightCrossing(type, name, currentDate, hours);

    prayers.push(
      createPrayer({
        type,
        english: name,
        arabic: namesArabic[index],
        date: prayerDateString,
        time: prayerTime,
      })
    );
  });

  return prayers;
}

/**
 * Creates a PrayerSequence containing prayers for multiple days
 * Uses Database.getPrayerByDate() for raw data and createPrayer() for each prayer
 *
 * @param type Schedule type (Standard or Extra)
 * @param startDate Date object for the first day
 * @param dayCount Number of days to include in the sequence
 * @returns PrayerSequence with prayers sorted by datetime
 *
 * @example
 * // Standard: 6 prayers per day × 3 days = 18 prayers
 * createPrayerSequence(ScheduleType.Standard, new Date("2026-01-18"), 3)
 * // Returns: { type: "standard", prayers: [...18 prayers...] }
 *
 * // Extras: 4 prayers (non-Friday) or 5 (Friday with Istijaba) per day
 * createPrayerSequence(ScheduleType.Extra, new Date("2026-01-18"), 3)
 * // Returns: { type: "extra", prayers: [...12-15 prayers...] }
 */
export const createPrayerSequence = (type: ScheduleType, startDate: Date, dayCount: number): PrayerSequence => {
  const prayers: Prayer[] = [];

  for (let i = 0; i < dayCount; i++) {
    const currentDate = addDays(startDate, i);

    // Get raw prayer data for this date from MMKV cache
    const rawData = Database.getPrayerByDate(currentDate);
    if (!rawData) continue; // Skip if no data for this date

    // Create all prayers for this day using helper
    const dayPrayers = createPrayersForSingleDay(type, currentDate, rawData);
    prayers.push(...dayPrayers);
  }

  // Sort prayers by datetime (chronological order)
  prayers.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());

  return {
    type,
    prayers,
  };
};
