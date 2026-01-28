import { addDays, format, setHours, setMinutes, intervalToDuration, isFuture, isToday, isYesterday } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

import { TIME_ADJUSTMENTS } from '@/shared/constants';

// =============================================================================
// DATE CREATION & CONVERSION
// =============================================================================

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

// =============================================================================
// DATE FORMATTING
// =============================================================================

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

// =============================================================================
// DATE CHECKS
// =============================================================================

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
 * Checks if a given date is January 1st (needed for CountdownBar yesterday's data)
 * @param date Date object
 * @returns boolean indicating if the date is January 1st
 */
export const isJanuaryFirst = (date: Date): boolean => {
  return date.getMonth() === 0 && date.getDate() === 1;
};

/**
 * Returns current year in London timezone
 * @returns Current year number
 */
export const getCurrentYear = (): number => createLondonDate().getFullYear();

// =============================================================================
// NIGHT TIME CALCULATIONS (Islamic)
// =============================================================================

/**
 * Night boundary result for Islamic night calculations
 */
interface NightBoundaries {
  /** Magrib datetime (today's sunset) */
  magrib: Date;
  /** Fajr datetime (tomorrow's dawn) */
  fajr: Date;
}

/**
 * Parses Magrib and Fajr times into Date objects for night calculations
 *
 * This helper extracts the common parsing logic used by getLastThirdOfNight
 * and getMidnightTime. It creates Date objects representing:
 * - Magrib: Today's sunset (night starts)
 * - Fajr: Tomorrow's dawn (night ends)
 *
 * @param magribTime Magrib time in HH:mm format (e.g., "18:45")
 * @param fajrTime Fajr time in HH:mm format (e.g., "06:15")
 * @returns Object with magrib (today) and fajr (tomorrow) as Date objects
 *
 * @example
 * const { magrib, fajr } = parseNightBoundaries("18:45", "06:15");
 * const nightDuration = fajr.getTime() - magrib.getTime();
 */
function parseNightBoundaries(magribTime: string, fajrTime: string): NightBoundaries {
  const [mHours, mMinutes] = magribTime.split(':').map(Number);
  const [fHours, fMinutes] = fajrTime.split(':').map(Number);

  // Magrib from today
  const magribBase = createLondonDate();
  const magribWithMinutes = setMinutes(magribBase, mMinutes);
  const magrib = setHours(magribWithMinutes, mHours);

  // Fajr from tomorrow
  const fajrBase = createLondonDate();
  const fajrWithMinutes = setMinutes(fajrBase, fMinutes);
  const fajrWithHours = setHours(fajrWithMinutes, fHours);
  const fajr = addDays(fajrWithHours, 1);

  return { magrib, fajr };
}

/**
 * Calculates the start time of the last third of the night (Islamic calculation)
 *
 * Islamic Night Division:
 * In Islamic tradition, the night is divided into thirds for prayer purposes.
 * The night spans from Magrib (sunset) to Fajr (dawn), not system midnight.
 * The last third begins 2/3 through this period and is a blessed time for prayer.
 *
 * Calculation:
 * 1. Night starts: Today's Magrib (e.g., 18:45 Jan 19)
 * 2. Night ends: Tomorrow's Fajr (e.g., 06:15 Jan 20)
 * 3. Night duration: 11 hours 30 minutes (690 minutes)
 * 4. Last third starts: 2/3 through = 460 minutes after Magrib = 02:25 Jan 20
 * 5. +5 minute adjustment applied (see TIME_ADJUSTMENTS.lastThird)
 * 6. Final time: 02:30 Jan 20
 *
 * The +5 minute adjustment provides a safety buffer to ensure the prayer time
 * is well within the last third period.
 *
 * @param magribTime Magrib time from today in HH:mm format (e.g., "18:45")
 * @param fajrTime Fajr time from tomorrow in HH:mm format (e.g., "06:15")
 * @returns Start time of the last third in HH:mm format (e.g., "02:30")
 *
 * @see parseNightBoundaries - Helper that parses the input times
 *
 * @example
 * getLastThirdOfNight("18:45", "06:15")
 * // Returns: "02:30" (accounting for the +5 min adjustment)
 */
export const getLastThirdOfNight = (magribTime: string, fajrTime: string): string => {
  const { magrib, fajr } = parseNightBoundaries(magribTime, fajrTime);

  // Calculate night duration and last third start
  const nightDuration = fajr.getTime() - magrib.getTime();
  const lastThirdStart = createLondonDate(magrib.getTime() + (nightDuration * 2) / 3);

  // Add minutes to the last third start time
  const minutesToAdd = TIME_ADJUSTMENTS.lastThird;
  lastThirdStart.setMinutes(lastThirdStart.getMinutes() + minutesToAdd);

  // Return formatted time string in 24-hour format (HH:mm)
  return format(lastThirdStart, 'HH:mm');
};

/**
 * Calculates Islamic midnight (midpoint between Magrib and Fajr)
 *
 * Islamic vs System Midnight:
 * Islamic midnight is NOT 00:00 (system midnight). It is the exact midpoint
 * of the Islamic night, which spans from Magrib (sunset) to Fajr (dawn).
 *
 * Why the difference?
 * - System midnight: Fixed at 00:00 every day
 * - Islamic midnight: Varies daily based on sunset/sunrise times
 * - In summer (long days): Islamic midnight can be as late as ~01:00
 * - In winter (short days): Islamic midnight can be as early as ~23:15
 *
 * Calculation:
 * 1. Night starts: Today's Magrib (e.g., 18:45 Jan 19)
 * 2. Night ends: Tomorrow's Fajr (e.g., 06:15 Jan 20)
 * 3. Night duration: 11 hours 30 minutes (690 minutes)
 * 4. Midpoint: 345 minutes after Magrib = 00:30 Jan 20
 * 5. Final time: 00:30 Jan 20 (Islamic midnight)
 *
 * No adjustment is applied to this calculation - it's the pure midpoint.
 *
 * @param magribTime Magrib time from today in HH:mm format (e.g., "18:45")
 * @param fajrTime Fajr time from tomorrow in HH:mm format (e.g., "06:15")
 * @returns Islamic midnight time in HH:mm format (e.g., "00:30")
 *
 * @see parseNightBoundaries - Helper that parses the input times
 *
 * @example
 * getMidnightTime("18:45", "06:15")
 * // Returns: "00:30" (exact midpoint, no adjustment)
 */
export const getMidnightTime = (magribTime: string, fajrTime: string): string => {
  const { magrib, fajr } = parseNightBoundaries(magribTime, fajrTime);

  // Calculate night duration and midpoint
  const nightDuration = fajr.getTime() - magrib.getTime();
  const midnight = createLondonDate(magrib.getTime() + nightDuration / 2);

  // Return formatted time string in 24-hour format (HH:mm)
  return format(midnight, 'HH:mm');
};

/**
 * Adjusts a time string by adding or subtracting minutes
 *
 * Used for calculating derived prayer times (e.g., Suhoor = Fajr - 20min).
 * Handles day boundary crossing (e.g., 00:10 - 20min = 23:50).
 *
 * Timezone: Uses London timezone internally via createLondonDate().
 * The returned time string is in 24-hour format and represents London time.
 *
 * @param time Time string in HH:mm format (e.g., "06:15")
 * @param minutesDiff Minutes to add (positive) or subtract (negative)
 * @returns Adjusted time string in HH:mm format
 *
 * @example
 * adjustTime("06:15", -20) // "05:55" (Suhoor = 20min before Fajr)
 * adjustTime("07:00", 20)  // "07:20" (Duha = 20min after Sunrise)
 * adjustTime("00:10", -20) // "23:50" (crosses midnight boundary)
 */
export const adjustTime = (time: string, minutesDiff: number): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const baseDate = createLondonDate();
  const dateWithHours = setHours(baseDate, hours);
  const date = setMinutes(dateWithHours, minutes);
  date.setMinutes(date.getMinutes() + minutesDiff);
  return format(date, 'HH:mm');
};

// =============================================================================
// COUNTDOWN & DISPLAY FORMATTING
// =============================================================================

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
 * Converts seconds into human-readable time format with flexible precision
 *
 * Formatting Rules:
 * 1. Negative seconds: Always returns "0s"
 * 2. Days are converted to hours (48 hours, not 2 days)
 * 3. Seconds visibility:
 *    - If hideSeconds=false: Always show seconds (e.g., "1h 30m 45s")
 *    - If hideSeconds=true: Show seconds ONLY in last 60 seconds (e.g., "45s")
 *    - After 60s with hideSeconds=true: Hide seconds (e.g., "1h 30m")
 * 4. Zero handling:
 *    - Only units with non-zero values are shown
 *    - If all units are zero: Returns "0s"
 * 5. Spacing: Units separated by single space
 *
 * Use Cases:
 * - Countdown: Use hideSeconds=true to avoid flicker in UI
 * - Precise display: Use hideSeconds=false for exact timing
 * - Last minute urgency: hideSeconds=true shows seconds in final 60s
 *
 * @param seconds Time in seconds (can be negative, but returns "0s")
 * @param hideSeconds If true, hides seconds when time > 60s (default: false)
 * @returns Formatted time string
 *
 * @example
 * formatTime(3665) // "1h 1m 5s" (default shows seconds)
 * formatTime(3665, true) // "1h 1m" (hideSeconds in effect)
 * formatTime(45, true) // "45s" (shows seconds in last 60s)
 * formatTime(0) // "0s"
 * formatTime(-100) // "0s"
 * formatTime(90000) // "25h 0s" (days converted to hours)
 */
export const formatTime = (seconds: number, hideSeconds = false): string => {
  if (seconds < 0) return '0s';

  const ms = seconds * 1000;
  const duration = intervalToDuration({ start: 0, end: ms });
  const { days, hours, minutes, seconds: secs } = duration;

  const totalHours = (days || 0) * 24 + (hours || 0);

  // Hide seconds if requested and time is over ~10 minutes (show seconds only in last 10m)
  const shouldShowSeconds = !hideSeconds || seconds <= 599;

  const parts = [totalHours && `${totalHours}h`, minutes && `${minutes}m`].filter(Boolean);

  // Always show seconds if shouldShowSeconds is true, or if there are no other parts (e.g., "0s")
  if (shouldShowSeconds || parts.length === 0) {
    parts.push(`${secs ?? 0}s`);
  }

  return parts.join(' ');
};

/**
 * Formats seconds elapsed into "ago" text without seconds display
 *
 * @param seconds - Seconds since prayer occurred (can be 0 or positive)
 * @returns "now" (<60s), "Xm" (1-59m), "Xh Ym" (1h+)
 *
 * @example
 * formatTimeAgo(45)      // Returns: "now"
 * formatTimeAgo(120)     // Returns: "2m"
 * formatTimeAgo(5400)    // Returns: "1h 30m"
 * formatTimeAgo(7200)    // Returns: "2h"
 * formatTimeAgo(0)       // Returns: "now"
 */
export const formatTimeAgo = (seconds: number): string => {
  if (seconds < 60) return 'now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};
