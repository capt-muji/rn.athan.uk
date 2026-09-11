import { addDays, getHours } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

import {
  ANIMATION,
  EXTRAS_ARABIC,
  EXTRAS_ENGLISH,
  ISLAMIC_DAY,
  NIGHT_PRAYER_NAMES,
  PRAYERS_ARABIC,
  PRAYERS_ENGLISH,
  TIME_ADJUSTMENTS,
} from '@/shared/constants';
import * as TimeUtils from '@/shared/time';
import { createPrayerDatetime } from '@/shared/time';
import {
  type IApiResponse,
  type IApiTimes,
  type ISingleApiResponseTransformed,
  type Prayer,
  type PrayerSequence,
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
 * Adds the calculated Suhoor, Duha and Istijaba times (each from the day's own times)
 *
 * Midnight and Last Third are not stored: they belong to the night before a day,
 * which spans two days' records, so they are worked out when the lists are built
 * (getNightTimesForDay)
 *
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
      suhoor: TimeUtils.adjustTime(times.fajr, TIME_ADJUSTMENTS.suhoor),
      duha: TimeUtils.adjustTime(times.sunrise, TIME_ADJUSTMENTS.duha),
      istijaba: TimeUtils.adjustTime(times.magrib, TIME_ADJUSTMENTS.istijaba),
    };

    transformations.push(schedule);
  });

  return transformations;
};

// =============================================================================
// NIGHT TIMES
// The Extras list opens with the night leading into its day
// =============================================================================

/**
 * Midnight and Last Third of the Extras list for a day: the night leading into it
 *
 * A night belongs to the day that follows it (ISSUES #29), so it runs from the
 * previous day's Magrib to this day's Fajr — two stored records. When the previous
 * day isn't stored (only ever the first stored day), its Magrib is taken as this
 * day's Magrib time one day earlier: within a minute or two.
 *
 * @param day Stored record of the day the night belongs to
 * @param previousDay Stored record of the day before, or null when not stored
 * @returns Midnight and the start of the last third, as exact instants
 *
 * @example
 * // Friday 23 Oct 2026: Magrib 17:54 BST; Saturday 24 Oct: Fajr 06:02 BST
 * getNightTimesForDay(saturday24Oct, friday23Oct)
 * // { midnight: Fri 23 Oct 23:58, lastThird: Sat 24 Oct 01:59 } (London)
 */
export const getNightTimesForDay = (
  day: ISingleApiResponseTransformed,
  previousDay: ISingleApiResponseTransformed | null
): TimeUtils.NightTimes => {
  const previousDate = TimeUtils.getPreviousDateString(day.date);
  const magribTime = previousDay?.date === previousDate ? previousDay.magrib : day.magrib;

  return TimeUtils.getNightTimes(previousDate, magribTime, day.date, day.fajr);
};

/** The instant of an Extras night row, or undefined for rows timed from the day's own record */
const getNightRowTime = (nightTimes: TimeUtils.NightTimes, prayerName: string): Date | undefined => {
  if (prayerName === 'Midnight') return nightTimes.midnight;
  if (prayerName === 'Last Third') return nightTimes.lastThird;
  return undefined;
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
    if (NIGHT_PRAYER_NAMES.includes(prayerEnglish as (typeof NIGHT_PRAYER_NAMES)[number]) && hours >= 12) {
      return TimeUtils.formatDateShort(addDays(prayerDateTime, 1));
    }
  }

  return calendarDate;
};

/**
 * Parameters for creating a Prayer object
 */
interface CreatePrayerParams {
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
 * Handles Isha after midnight (Standard) and night prayers with a stored time (Extras);
 * Midnight and Last Third carry exact instants instead (getNightTimesForDay)
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
    if (NIGHT_PRAYER_NAMES.includes(prayerName as (typeof NIGHT_PRAYER_NAMES)[number]) && hours >= 12) {
      return TimeUtils.formatDateShort(addDays(baseDate, -1));
    }
  }

  return baseDateString;
}

/**
 * Helper: Create all prayers for a single day
 * Returns array of Prayer objects for the given date and raw data
 *
 * The Extras night rows (Midnight, Last Third) take exact instants from the night
 * leading into the day; every other row combines the day's date with its stored time
 */
function createPrayersForSingleDay(
  type: ScheduleType,
  currentDate: Date,
  rawData: ISingleApiResponseTransformed,
  previousDayData: ISingleApiResponseTransformed | null
): Prayer[] {
  const prayers: Prayer[] = [];
  const { english: namesEnglish, arabic: namesArabic } = getPrayerNamesForDate(type, currentDate);
  const nightTimes = type === ScheduleType.Extra ? getNightTimesForDay(rawData, previousDayData) : null;

  namesEnglish.forEach((name, index) => {
    const nightRowTime = nightTimes ? getNightRowTime(nightTimes, name) : undefined;
    if (nightRowTime) {
      prayers.push({
        type,
        english: name,
        arabic: namesArabic[index],
        datetime: nightRowTime,
        time: TimeUtils.formatPrayerTime(nightRowTime),
        belongsToDate: TimeUtils.formatDateShort(currentDate),
      });
      return;
    }

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

  // Extras night rows need the day before each listed day (getNightTimesForDay)
  let previousDayData = type === ScheduleType.Extra ? Database.getPrayerByDate(addDays(startDate, -1)) : null;

  for (let i = 0; i < dayCount; i++) {
    const currentDate = addDays(startDate, i);

    // Get raw prayer data for this date from MMKV cache
    const rawData = Database.getPrayerByDate(currentDate);
    if (!rawData) {
      previousDayData = null;
      continue; // Skip if no data for this date
    }

    // Create all prayers for this day using helper
    const dayPrayers = createPrayersForSingleDay(type, currentDate, rawData, previousDayData);
    prayers.push(...dayPrayers);
    previousDayData = rawData;
  }

  // Sort prayers by datetime (chronological order)
  prayers.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());

  return {
    type,
    prayers,
  };
};

/**
 * One prayer on one day's list, exactly as its row has it
 *
 * The single source for anything that fires at a prayer's moment: notifications
 * and reminders use the row's own datetime, so an alert can never land on a
 * different moment, or a different night, than the countdown and the list show.
 *
 * @param type Schedule type (Standard or Extra)
 * @param english English prayer name
 * @param date Day of the list the prayer belongs to (YYYY-MM-DD)
 * @returns The prayer, or null when the day isn't stored or the prayer isn't on
 *   its list (Istijaba outside Fridays)
 *
 * @example
 * // Extras night rows fall on the night before their day
 * getPrayerForDate(ScheduleType.Extra, 'Midnight', '2026-10-24')
 * // Returns: { ..., time: '23:58', datetime: Fri 23 Oct 23:58 London, belongsToDate: '2026-10-24' }
 */
export const getPrayerForDate = (type: ScheduleType, english: string, date: string): Prayer | null => {
  const currentDate = TimeUtils.createLondonDate(date);
  const rawData = Database.getPrayerByDate(currentDate);
  if (!rawData) return null;

  const previousDayData = type === ScheduleType.Extra ? Database.getPrayerByDate(addDays(currentDate, -1)) : null;
  const dayPrayers = createPrayersForSingleDay(type, currentDate, rawData, previousDayData);

  return dayPrayers.find((prayer) => prayer.english === english) ?? null;
};

/**
 * Returns the display order of prayers as a list of sequence indices.
 *
 * The prayer sequence is chronologically sorted (countdown/progress logic depends on
 * it), but the Extra page displays in canonical array order - EXTRAS_ENGLISH - so that
 * Friday Istijaba (magrib - 60 min) shows last instead of between Midnight and Last
 * Third (Midnight belongs to the displayed day while chronologically falling late
 * evening, which is what pushed Istijaba mid-list chronologically).
 *
 * Standard prayers are chronological == canonical, so indices pass through unchanged.
 *
 * @param prayers Prayers for one display date (chronologically ordered)
 * @param type Schedule type (Standard or Extra)
 * @returns Indices into the input array, in canonical display order
 *
 * @example
 * // Friday extras chronologically: [Duha 09:00, Istijaba 15:14, Midnight 23:17]
 * canonicalDisplayOrder(prayers, ScheduleType.Extra)
 * // Returns: [2, 0, 1] -> Midnight, Duha, Istijaba
 */
export const canonicalDisplayOrder = (prayers: Prayer[], type: ScheduleType): number[] => {
  const identityOrder = prayers.map((_, index) => index);
  if (type !== ScheduleType.Extra) return identityOrder;

  const canonicalRank = (english: string): number => {
    const rank = EXTRAS_ENGLISH.indexOf(english);
    return rank === -1 ? EXTRAS_ENGLISH.length : rank;
  };

  return identityOrder.sort((a, b) => canonicalRank(prayers[a].english) - canonicalRank(prayers[b].english));
};
