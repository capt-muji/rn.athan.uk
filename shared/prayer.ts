import { addDays, getHours } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

import {
  PRAYERS_ENGLISH,
  PRAYERS_ARABIC,
  EXTRAS_ENGLISH,
  EXTRAS_ARABIC,
  TIME_ADJUSTMENTS,
  ANIMATION,
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

// Islamic day boundary: Isha after midnight (00:00-06:00) belongs to previous Islamic day
const EARLY_MORNING_CUTOFF_HOUR = 6;

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
  if (type === ScheduleType.Standard && prayerEnglish === 'Isha' && hours < EARLY_MORNING_CUTOFF_HOUR) {
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
  const isStandard = type === ScheduleType.Standard;
  const prayers: Prayer[] = [];

  for (let i = 0; i < dayCount; i++) {
    const currentDate = addDays(startDate, i);
    const dateString = TimeUtils.formatDateShort(currentDate);

    // Get raw prayer data for this date from MMKV cache
    const rawData = Database.getPrayerByDate(currentDate);
    if (!rawData) continue; // Skip if no data for this date

    // Get prayer names for this schedule type
    let namesEnglish = isStandard ? PRAYERS_ENGLISH : EXTRAS_ENGLISH;
    let namesArabic = isStandard ? PRAYERS_ARABIC : EXTRAS_ARABIC;

    // Filter out Istijaba on non-Fridays (Extras schedule only)
    if (!isStandard && !TimeUtils.isFriday(currentDate)) {
      namesEnglish = namesEnglish.filter((name) => name.toLowerCase() !== 'istijaba');
      namesArabic = namesArabic.filter((name) => name !== 'استجابة');
    }

    // Create Prayer objects for each prayer time
    namesEnglish.forEach((name, index) => {
      const prayerTime = rawData[name.toLowerCase() as keyof ISingleApiResponseTransformed] as string;
      const [hours] = prayerTime.split(':').map(Number);
      let prayerDateString = dateString;

      // STANDARD: Isha 00:00-06:00 occurs on NEXT calendar day (for countdown)
      // calculateBelongsToDate() will assign it to previous Islamic day (for display)
      if (isStandard && name === 'Isha' && hours < EARLY_MORNING_CUTOFF_HOUR) {
        prayerDateString = TimeUtils.formatDateShort(addDays(currentDate, 1));
      }

      // EXTRAS: Night prayers >=12:00 occurred on PREVIOUS calendar day
      if (!isStandard) {
        const nightPrayers = ['Midnight', 'Last Third', 'Suhoor'];
        if (nightPrayers.includes(name) && hours >= 12) {
          prayerDateString = TimeUtils.formatDateShort(addDays(currentDate, -1));
        }
      }

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
  }

  // Sort prayers by datetime (chronological order)
  prayers.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());

  return {
    type,
    prayers,
  };
};
