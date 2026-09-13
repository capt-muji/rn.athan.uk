import {
  ANIMATION,
  EXTRAS_ARABIC,
  EXTRAS_ENGLISH,
  ISLAMIC_DAY,
  MIDNIGHT_CROSSING_PRAYERS,
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
  type IValidatedApiResponse,
  type Prayer,
  type PrayerSequence,
  type ReadablePrayer,
  ScheduleType,
  type UnreadablePrayer,
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
 * A derived time is null when the time it comes from is: nothing can be worked out from a value the
 * provider did not give
 *
 * @param apiData Filtered API response data, as validated by api/client.ts
 * @returns Array of transformed prayer schedules
 */
export const transformApiData = (apiData: IValidatedApiResponse): ISingleApiResponseTransformed[] => {
  const transformations: ISingleApiResponseTransformed[] = [];

  const entries = Object.entries(apiData.times);
  const derive = (time: string | null, minutesDiff: number) =>
    time === null ? null : TimeUtils.adjustTime(time, minutesDiff);

  entries.forEach(([date, times]) => {
    const schedule: ISingleApiResponseTransformed = {
      date,
      fajr: times.fajr,
      sunrise: times.sunrise,
      dhuhr: times.dhuhr,
      asr: times.asr,
      magrib: times.magrib,
      isha: times.isha,
      suhoor: derive(times.fajr, TIME_ADJUSTMENTS.suhoor),
      duha: derive(times.sunrise, TIME_ADJUSTMENTS.duha),
      istijaba: derive(times.magrib, TIME_ADJUSTMENTS.istijaba),
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
 * Whether a clock hour is in the small hours. On its own this says nothing about dates —
 * Suhoor, Fajr, Sunrise and Duha are all routinely below six and all belong to their own
 * day. Only the prayers in MIDNIGHT_CROSSING_PRAYERS carry the day-shift meaning, so every
 * caller gates on the name as well.
 */
const isSmallHours = (hours: number): boolean => hours < ISLAMIC_DAY.EARLY_MORNING_CUTOFF_HOUR;

/**
 * Whether a Magrib time is really the next day's. Only reachable above roughly 60N, where
 * sunset falls after midnight (Reykjavik 00:03, Nome 01:48 on 21 June); London's Magrib
 * spans 15:55 to 21:25 across the year, so this is always false for the city shipping today.
 */
const magribCrossesIntoNextDay = (magribTime: string): boolean => {
  const [hours] = magribTime.split(':').map(Number);
  return isSmallHours(hours);
};

/**
 * The instant Istijaba falls on: an hour before Magrib, measured from Magrib's INSTANT.
 *
 * Deriving it from the clock string cannot work once Magrib crosses midnight. `adjustTime`
 * is modular clock arithmetic, so it turns Magrib 01:47 into Istijaba 00:47 and leaves it
 * filed under the old date while Magrib moves to the next — putting Istijaba 25 hours early
 * (Nome, Alaska: sunset 01:47). It only appeared to work below 01:00, where the wrap past
 * midnight happened to cancel the shift. Midnight and Last Third already take instants
 * rather than strings for exactly this reason.
 */
const getIstijabaTime = (rawData: ISingleApiResponseTransformed, date: string): Date | null => {
  if (rawData.magrib === null) return null;

  const magribDate = magribCrossesIntoNextDay(rawData.magrib) ? TimeUtils.addDaysToDateString(date, 1) : date;
  const magribInstant = createPrayerDatetime(magribDate, rawData.magrib);

  return new Date(magribInstant.getTime() + TIME_ADJUSTMENTS.istijaba * 60_000);
};

/**
 * Midnight and Last Third of the Extras list for a day: the night leading into it
 *
 * A night belongs to the day that follows it (ISSUES #29), so it runs from the
 * previous day's Magrib to this day's Fajr — two stored records, and both ends must
 * come from the provider. There is no night to work out when either time is unreadable
 * or the day before is not stored. That day's Magrib is never borrowed in its place:
 * a night built from a borrowed Magrib put an alarm 21 minutes out beside March's
 * clock change (finding 72), and no prayer time may ever be substituted (finding 70).
 *
 * @param day Stored record of the day the night belongs to
 * @param previousDay Stored record of the day before, or null when not stored
 * @returns Midnight and the start of the last third, as exact instants, or null when the night cannot be worked out
 *
 * @example
 * // Friday 23 Oct 2026: Magrib 17:54 BST; Saturday 24 Oct: Fajr 06:02 BST
 * getNightTimesForDay(saturday24Oct, friday23Oct)
 * // { midnight: Fri 23 Oct 23:58, lastThird: Sat 24 Oct 01:59 } (London)
 */
export const getNightTimesForDay = (
  day: ISingleApiResponseTransformed,
  previousDay: ISingleApiResponseTransformed | null
): TimeUtils.NightTimes | null => {
  const previousDate = TimeUtils.getPreviousDateString(day.date);
  if (previousDay?.date !== previousDate) return null;

  const magribTime = previousDay.magrib;
  const fajrTime = day.fajr;
  if (magribTime === null || fajrTime === null) return null;

  // Anchoring a post-midnight Magrib to the date it is filed under would start the night a
  // day early and stretch it to ~26h, throwing Islamic Midnight and Last Third past noon.
  const nightStart = magribCrossesIntoNextDay(magribTime) ? day.date : previousDate;

  return TimeUtils.getNightTimes(nightStart, magribTime, day.date, fajrTime);
};

/** The instant of an Extras night row, or null when its night cannot be worked out */
const getNightRowTime = (nightTimes: TimeUtils.NightTimes | null, prayerName: string): Date | null => {
  if (!nightTimes) return null;
  return prayerName === 'Midnight' ? nightTimes.midnight : nightTimes.lastThird;
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
 * Gets the hour (0-23) of an instant on the prayer timezone's clock
 * Used for determining if a prayer crosses midnight there
 * @param date Date object (an exact instant)
 * @returns Hour (0-23) in the prayer timezone
 */
const getPrayerTimezoneHour = (date: Date): number => {
  const time = TimeUtils.formatPrayerTime(date);
  return Number(time.slice(0, 2));
};

/**
 * Calculates which Islamic day a prayer belongs to
 *
 * Islamic Day Rule: The day changes after Isha passes.
 * If Isha or Magrib is between 00:00-06:00, it belongs to the previous day.
 *
 * @param type Schedule type (Standard or Extra)
 * @param prayerEnglish English name of the prayer
 * @param calendarDate Calendar date string (YYYY-MM-DD) the datetime falls on
 * @param prayerDateTime Full datetime (must be created via createPrayerDatetime)
 * @returns The Islamic day this prayer belongs to (YYYY-MM-DD)
 */
export const calculateBelongsToDate = (
  type: ScheduleType,
  prayerEnglish: string,
  calendarDate: string,
  prayerDateTime: Date
): string => {
  const hours = getPrayerTimezoneHour(prayerDateTime);

  // STANDARD: Isha between 00:00-06:00 belongs to previous day.
  // Magrib needs the identical mapping wherever sunset itself lands after midnight:
  // adjustPrayerDateForMidnightCrossing has already pushed its instant to the next
  // calendar day, and without undoing that here the row would leave its own day's list
  // and appear on the following one. The two functions are a matched pair — shifting the
  // instant without shifting the grouping back moves the row to the wrong card.
  if (type === ScheduleType.Standard && MIDNIGHT_CROSSING_PRAYERS.includes(prayerEnglish) && isSmallHours(hours)) {
    return TimeUtils.getPreviousDateString(calendarDate);
  }

  // EXTRAS: the other half of that pair for Suhoor — its instant has already gone back a
  // day, so the grouping comes forward again and the row stays on the list of the Fajr it
  // precedes rather than on the previous day's
  if (type === ScheduleType.Extra) {
    if (NIGHT_PRAYER_NAMES.includes(prayerEnglish as (typeof NIGHT_PRAYER_NAMES)[number]) && hours >= 12) {
      return TimeUtils.addDaysToDateString(calendarDate, 1);
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
export const createPrayer = (params: CreatePrayerParams): ReadablePrayer => {
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
function getPrayerNamesForDate(type: ScheduleType, date: string): { english: string[]; arabic: string[] } {
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
  date: string,
  hours: number
): string {
  const isStandard = type === ScheduleType.Standard;

  // STANDARD: Isha 00:00-06:00 occurs on NEXT calendar day (for countdown).
  // Magrib joins it above ~60N, where sunset itself lands after midnight while the
  // provider still files it under the old date — without this its alarm is 23h56m early.
  if (isStandard && MIDNIGHT_CROSSING_PRAYERS.includes(prayerName) && isSmallHours(hours)) {
    return TimeUtils.addDaysToDateString(date, 1);
  }

  // EXTRAS: in practice only Suhoor arrives here — Midnight and Last Third carry exact
  // instants and never take this path. Suhoor is Fajr minus twenty through modular clock
  // arithmetic, so a Fajr under 00:20 comes back as 23:4x still filed under Fajr's date.
  // Reading the PM half as "wrapped from the next day" is safe because nothing legitimate
  // puts Suhoor in an afternoon; the reachable band is only 23:40-23:59.
  if (!isStandard) {
    if (NIGHT_PRAYER_NAMES.includes(prayerName as (typeof NIGHT_PRAYER_NAMES)[number]) && hours >= 12) {
      return TimeUtils.getPreviousDateString(date);
    }
  }

  return date;
}

/**
 * Helper: Create all prayers for a single day
 * Returns array of Prayer objects for the given date and raw data, in list order
 *
 * The Extras night rows (Midnight, Last Third) take exact instants from the night
 * leading into the day; every other row combines the day's date with its stored time.
 * A row whose time, or a time it is worked out from, could not be read stays on the
 * list without one, and so does every row of a day that is not stored at all: the day
 * is still shown rather than skipped (R1, R7)
 */
function createPrayersForSingleDay(
  type: ScheduleType,
  date: string,
  rawData: ISingleApiResponseTransformed | null,
  previousDayData: ISingleApiResponseTransformed | null
): Prayer[] {
  const { english: namesEnglish, arabic: namesArabic } = getPrayerNamesForDate(type, date);
  const nightTimes = type === ScheduleType.Extra && rawData ? getNightTimesForDay(rawData, previousDayData) : null;

  return namesEnglish.map((name, index): Prayer => {
    const unreadable: UnreadablePrayer = {
      type,
      english: name,
      arabic: namesArabic[index],
      datetime: null,
      time: null,
      belongsToDate: date,
    };
    if (!rawData) return unreadable;

    // Istijaba joins the night rows on the exact-instant path: it hangs off Magrib, which
    // can be date-shifted, so a clock string cannot express it (see getIstijabaTime)
    const isIstijaba = type === ScheduleType.Extra && name === 'Istijaba';
    const isNightRow = type === ScheduleType.Extra && (name === 'Midnight' || name === 'Last Third');
    if (isIstijaba || isNightRow) {
      const rowInstant = isIstijaba ? getIstijabaTime(rawData, date) : getNightRowTime(nightTimes, name);
      if (!rowInstant) return unreadable;

      return { ...unreadable, datetime: rowInstant, time: TimeUtils.formatPrayerTime(rowInstant) };
    }

    const prayerTime = rawData[name.toLowerCase() as keyof ISingleApiResponseTransformed];
    if (prayerTime === null) return unreadable;

    const [hours] = prayerTime.split(':').map(Number);
    const prayerDateString = adjustPrayerDateForMidnightCrossing(type, name, date, hours);

    return createPrayer({
      type,
      english: name,
      arabic: namesArabic[index],
      date: prayerDateString,
      time: prayerTime,
    });
  });
}

/**
 * Creates a PrayerSequence containing prayers for multiple days
 * Uses Database.getPrayerByDateString() for raw data and createPrayer() for each prayer
 *
 * Built in list order (compareListOrder in shared/sequence.ts): day by day, each day
 * in its list's order. That is also time order for every readable row, and it gives a
 * row with no time a place, which sorting by time could not.
 *
 * @param type Schedule type (Standard or Extra)
 * @param startDate Any instant on the first day (its day is read in the prayer timezone)
 * @param dayCount Number of days to include in the sequence
 * @returns PrayerSequence with every day's full list, readable or not
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
  const firstDate = TimeUtils.formatDateShort(startDate);

  // Extras night rows need the day before each listed day (getNightTimesForDay)
  const dayBeforeFirst = TimeUtils.getPreviousDateString(firstDate);
  let previousDayData = type === ScheduleType.Extra ? Database.getPrayerByDateString(dayBeforeFirst) : null;

  for (let i = 0; i < dayCount; i++) {
    const date = TimeUtils.addDaysToDateString(firstDate, i);

    // A day that is not stored is listed with every row unreadable, not skipped: skipping
    // it presented the following day as today (finding 70)
    const rawData = Database.getPrayerByDateString(date);
    prayers.push(...createPrayersForSingleDay(type, date, rawData, previousDayData));
    previousDayData = rawData;
  }

  return {
    type,
    prayers,
  };
};

/**
 * One day's whole list, exactly as its rows have it, readable or not
 *
 * @param type Schedule type (Standard or Extra)
 * @param date Day of the list (YYYY-MM-DD)
 * @returns The day's rows in list order; every row unreadable when the day is not stored
 */
export const createPrayersForDate = (type: ScheduleType, date: string): Prayer[] => {
  const rawData = Database.getPrayerByDateString(date);
  const previousDate = TimeUtils.getPreviousDateString(date);
  const previousDayData = type === ScheduleType.Extra ? Database.getPrayerByDateString(previousDate) : null;

  return createPrayersForSingleDay(type, date, rawData, previousDayData);
};

/**
 * One prayer on one day's list, exactly as its row has it
 *
 * The single source for anything that fires at a prayer's moment: notifications
 * and reminders use the row's own datetime, so an alert can never land on a
 * different moment, or a different night, than the countdown and the list show.
 * A row without a readable time comes back without one, and nothing may fire for it.
 *
 * @param type Schedule type (Standard or Extra)
 * @param english English prayer name
 * @param date Day of the list the prayer belongs to (YYYY-MM-DD)
 * @returns The prayer, readable or not, or null when it isn't on its list
 *   (Istijaba outside Fridays)
 *
 * @example
 * // Extras night rows fall on the night before their day
 * getPrayerForDate(ScheduleType.Extra, 'Midnight', '2026-10-24')
 * // Returns: { ..., time: '23:58', datetime: Fri 23 Oct 23:58 London, belongsToDate: '2026-10-24' }
 */
export const getPrayerForDate = (type: ScheduleType, english: string, date: string): Prayer | null =>
  createPrayersForDate(type, date).find((prayer) => prayer.english === english) ?? null;

/**
 * Returns the display order of prayers as a list of sequence indices.
 *
 * createPrayerSequence already builds each list in canonical order, so for its rows this
 * is the identity. It still ranks by EXTRAS_ENGLISH because rows gathered in time order
 * would put Friday's Istijaba (Magrib − 60 min) between Midnight, which falls the evening
 * before, and Last Third, instead of last.
 *
 * Standard prayers are chronological == canonical, so indices pass through unchanged.
 *
 * @param prayers Prayers for one display date
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
