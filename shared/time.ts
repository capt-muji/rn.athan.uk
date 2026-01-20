import { format, setHours, setMinutes, intervalToDuration, isFuture, isToday, isYesterday, subDays } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

import { TIME_ADJUSTMENTS } from '@/shared/constants';

/**
 * Creates a new Date object in London timezone
 * @param date Optional date to convert (defaults to current date)
 * @returns Date object in London timezone
 */
export const createLondonDate = (date?: Date | number | string): Date => {
  const targetDate = date ? new Date(date) : new Date();
  const londonTime = formatInTimeZone(targetDate, 'Europe/London', 'yyyy-MM-dd HH:mm:ssXXX');
  return new Date(londonTime);
};

/**
 * Checks if a date is yesterday or in the future
 * Used for filtering API response data
 * @param date Date string in YYYY-MM-DD format
 * @returns boolean indicating if date is yesterday or future
 */
export const isDateYesterdayOrFuture = (date: string): boolean => {
  const parsedDate = createLondonDate(date);
  return isYesterday(parsedDate) || isToday(parsedDate) || isFuture(parsedDate);
};

/**
 * Formats a date string into a readable format
 * @param date Date string in YYYY-MM-DD format
 * @returns Formatted date string (e.g., "Fri, 20 Nov 2024")
 */
export const formatDateLong = (date: string): string => {
  return format(createLondonDate(date), 'EEE, d MMM yyyy');
};

/**
 * Formats a date string into Hijri format using Intl.DateTimeFormat
 * Falls back to Gregorian if conversion fails
 * @param date Date string in YYYY-MM-DD format
 * @returns Formatted Hijri date string (e.g., "Rajab 1, 1447")
 */
export const formatHijriDateLong = (date: string): string => {
  try {
    const gregorian = createLondonDate(date);
    const hijriFormatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    // Remove "AH" suffix from formatted date
    return hijriFormatter.format(gregorian).replace(/ AH$/, '');
  } catch {
    return formatDateLong(date);
  }
};

/**
 * Formats a date into YYYY-MM-DD format
 * @param date Date object
 * @returns Date string in YYYY-MM-DD format
 */
export const formatDateShort = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Calculates the start time of the last third of the night
 * @param magribTime Maghrib time string in HH:mm format
 * @param fajrTime Fajr time string in HH:mm format
 * @returns Start time of the last third of the night in HH:mm format
 */
export const getLastThirdOfNight = (magribTime: string, fajrTime: string): string => {
  const [mHours, mMinutes] = magribTime.split(':').map(Number);
  const [fHours, fMinutes] = fajrTime.split(':').map(Number);

  // Maghrib from yesterday
  let maghrib = createLondonDate();
  maghrib = subDays(setHours(setMinutes(maghrib, mMinutes), mHours), 1);

  // Fajr from today
  let fajr = createLondonDate();
  fajr = setHours(setMinutes(fajr, fMinutes), fHours);

  // Calculate night duration and last third start
  const nightDuration = fajr.getTime() - maghrib.getTime();
  const lastThirdStart = createLondonDate(maghrib.getTime() + (nightDuration * 2) / 3);

  // add minutes to the last third start time
  const minutesToAdd = TIME_ADJUSTMENTS.lastThird;
  lastThirdStart.setMinutes(lastThirdStart.getMinutes() + minutesToAdd);

  // Return formatted time string in 24-hour format (HH:mm)
  return format(lastThirdStart, 'HH:mm');
};

/**
 * Calculates the midnight time (midpoint between Maghrib and Fajr)
 * @param magribTime Maghrib time string in HH:mm format
 * @param fajrTime Fajr time string in HH:mm format
 * @returns Midnight time in HH:mm format
 */
export const getMidnightTime = (magribTime: string, fajrTime: string): string => {
  const [mHours, mMinutes] = magribTime.split(':').map(Number);
  const [fHours, fMinutes] = fajrTime.split(':').map(Number);

  // Maghrib from yesterday
  let maghrib = createLondonDate();
  maghrib = subDays(setHours(setMinutes(maghrib, mMinutes), mHours), 1);

  // Fajr from today
  let fajr = createLondonDate();
  fajr = setHours(setMinutes(fajr, fMinutes), fHours);

  // Calculate night duration and midpoint
  const nightDuration = fajr.getTime() - maghrib.getTime();
  const midnight = createLondonDate(maghrib.getTime() + nightDuration / 2);

  // Return formatted time string in 24-hour format (HH:mm)
  return format(midnight, 'HH:mm');
};

/**
 * Adjusts a time string by adding or subtracting minutes
 * @param time Time string in HH:mm format
 * @param minutesDiff Minutes to add (positive) or subtract (negative)
 * @returns Adjusted time string in HH:mm format
 */
export const adjustTime = (time: string, minutesDiff: number): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const date = setMinutes(setHours(createLondonDate(), hours), minutes);
  date.setMinutes(date.getMinutes() + minutesDiff);
  return format(date, 'HH:mm');
};

/**
 * Checks if a given date string is Friday
 * @param date Optional date string or Date object
 * @returns boolean indicating if the date is Friday
 */
export const isFriday = (date?: string | Date): boolean => {
  const parsedDate = createLondonDate(date);
  return format(parsedDate, 'EEEE') === 'Friday';
};

/**
 * Checks if current month is December in London timezone
 * @returns boolean indicating if current month is December
 */
export const isDecember = (): boolean => createLondonDate().getMonth() === 11;

/**
 * Returns current year in London timezone
 * @returns Current year number
 */
export const getCurrentYear = (): number => createLondonDate().getFullYear();

// =============================================================================
// NEW TIMING SYSTEM UTILITIES (Prayer-Centric Model)
// See: ai/adr/005-timing-system-overhaul.md
// =============================================================================

/**
 * Creates a full Date object from date and time strings
 * Used to combine API data (separate date/time) into Prayer.datetime
 *
 * IMPORTANT: Prayer times from API are in London timezone.
 * This function interprets the datetime as London time and converts to UTC.
 *
 * @param date Date string in YYYY-MM-DD format
 * @param time Time string in HH:mm format
 * @returns Date object representing the exact moment (internally UTC)
 *
 * @example
 * createPrayerDatetime("2026-01-18", "06:12")
 * // Returns: Date representing 2026-01-18T06:12:00 London time
 */
export const createPrayerDatetime = (date: string, time: string): Date => {
  // Create datetime string and interpret it as London time
  // fromZonedTime: "this datetime IS in London timezone, give me the UTC equivalent"
  const isoString = `${date}T${time}:00`;
  return fromZonedTime(isoString, 'Europe/London');
};

/**
 * Calculates the difference in seconds between two dates
 * Used for countdown calculation: nextPrayer.datetime - now
 *
 * @param from Start date (typically "now")
 * @param to End date (typically prayer.datetime)
 * @returns Difference in seconds (positive if 'to' is in future)
 *
 * @example
 * getSecondsBetween(now, prayerTime)
 * // Returns: 7234 (seconds until prayer)
 */
export const getSecondsBetween = (from: Date, to: Date): number => {
  return Math.floor((to.getTime() - from.getTime()) / 1000);
};

/**
 * Converts seconds into human-readable time format
 * @param seconds Time in seconds
 * @returns Formatted time string (e.g., "1h 30m 45s")
 */
export const formatTime = (seconds: number): string => {
  if (seconds < 0) return '0s';

  const ms = seconds * 1000;
  const duration = intervalToDuration({ start: 0, end: ms });
  const { days, hours, minutes, seconds: secs } = duration;

  const totalHours = (days || 0) * 24 + (hours || 0);

  return [totalHours && `${totalHours}h`, minutes && `${minutes}m`, secs !== undefined ? `${secs}s` : '0s']
    .filter(Boolean)
    .join(' ');
};
