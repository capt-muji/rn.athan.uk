import { format, intervalToDuration, isFuture, isToday, isYesterday, setHours, setMinutes } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

import { ISLAMIC_DAY, PRAYER_TIMEZONE, TIME_ADJUSTMENTS } from '@/shared/constants';

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
  // Millisecond precision matters at boundaries: the wall-clock ticker commits
  // the boundary transition in the first ~100ms after :00, and a second-truncated
  // "now" equals the prayer datetime exactly, so `datetime < now` reads the
  // just-passed prayer as still future and its row settles with the future color
  const londonTime = formatInTimeZone(targetDate, 'Europe/London', 'yyyy-MM-dd HH:mm:ss.SSSXXX');
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
  // Create datetime string and interpret it in the prayer timezone
  // fromZonedTime: "this datetime IS in the prayer timezone, give me the UTC equivalent"
  const isoString = `${date}T${time}:00`;
  return fromZonedTime(isoString, PRAYER_TIMEZONE);
};

/**
 * Formats an exact instant as HH:mm on the prayer timezone's wall clock
 * @param date Date object (an exact instant)
 * @returns Time string in HH:mm format
 *
 * @example
 * formatPrayerTime(createPrayerDatetime("2026-10-23", "23:58")) // "23:58"
 */
export const formatPrayerTime = (date: Date): string => formatInTimeZone(date, PRAYER_TIMEZONE, 'HH:mm');

/**
 * Returns the calendar date before a YYYY-MM-DD date
 * Pure calendar arithmetic — independent of every timezone
 * @param date Date string in YYYY-MM-DD format
 * @returns The previous date in YYYY-MM-DD format
 *
 * @example
 * getPreviousDateString("2026-01-01") // "2025-12-31"
 */
export const getPreviousDateString = (date: string): string => {
  const noonUtc = new Date(`${date}T12:00:00Z`);
  noonUtc.setUTCDate(noonUtc.getUTCDate() - 1);
  return noonUtc.toISOString().slice(0, 10);
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
 * Formats a date into YYYY-MM-DD format (London timezone)
 *
 * Converts through London wall time first (like formatDateLong), so the result
 * is the London calendar date of the instant regardless of the device's
 * timezone — required for cache keys and belongsToDate matching.
 *
 * @param date Date object
 * @returns Date string in YYYY-MM-DD format
 */
export const formatDateShort = (date: Date): string => {
  const londonDate = createLondonDate(date);
  return format(londonDate, 'yyyy-MM-dd');
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
 * Checks if the current date falls within Ramadan or the last days of Sha'ban
 * Uses ISLAMIC_DAY.RAMADAN_DECORATION_DAYS_BEFORE to determine the pre-Ramadan window
 * Uses the islamic-umalqura calendar via Intl.DateTimeFormat
 * @returns boolean indicating if current date is during Ramadan season
 */
export const isRamadan = (): boolean => {
  // Build-time preview gate, statically folded OFF in production builds (the
  // EXPO_PUBLIC_BG_DEBUG idiom): building with EXPO_PUBLIC_FORCE_RAMADAN=1
  // flips the whole season — icon variant, decorations, settings toggle —
  // for off-season device evaluation
  if (process.env.EXPO_PUBLIC_FORCE_RAMADAN === '1') return true;
  try {
    const date = createLondonDate();
    const monthFmt = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', { month: 'numeric' });
    const month = monthFmt.format(date);

    // During Ramadan (month 9)
    if (month === '9') return true;

    // Pre-Ramadan window in Sha'ban
    if (month === '8') {
      const dayFmt = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', { day: 'numeric' });
      const day = parseInt(dayFmt.format(date), 10);
      return day >= 30 - ISLAMIC_DAY.RAMADAN_DECORATION_DAYS_BEFORE;
    }

    return false;
  } catch {
    return false;
  }
};

/**
 * Checks if the current date falls within any decoration season (Ramadan, Eid, etc.)
 * Single extension point — add future season checks here.
 * @returns boolean indicating if decorations should be available
 */
export const isDecorationSeason = (): boolean => {
  return isRamadan();
};

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

const MINUTE_MS = 60 * 1000;

/** Midnight and the last third of one night, as exact instants */
export interface NightTimes {
  /** Islamic midnight: the midpoint of the night */
  midnight: Date;
  /** Start of the last third of the night */
  lastThird: Date;
}

/** Start of the whole minute an instant falls in (seconds dropped, like every HH:mm time shown) */
const floorToMinute = (ms: number): Date => new Date(Math.floor(ms / MINUTE_MS) * MINUTE_MS);

/**
 * Calculates Islamic midnight and the start of the last third for one night
 *
 * The Islamic date begins at Magrib, and a night belongs to the day that follows it:
 * the night of Friday runs from Thursday's Magrib to Friday's Fajr (ISSUES #29). The
 * night spans Magrib (sunset) to Fajr (dawn), not system midnight:
 * - Midnight is its midpoint (the end of Isha's time)
 * - The last third starts two-thirds of the way through (plus TIME_ADJUSTMENTS.lastThird)
 *
 * Measured between real instants, so a night that crosses a clock change (a 23- or
 * 25-hour day) comes out exact, and the result depends only on the four inputs —
 * never on the device's timezone or on when this runs (ISSUES #28). Floored to the
 * whole minute.
 *
 * @param previousDate Date the night starts on, YYYY-MM-DD
 * @param magribTime Magrib on that date, HH:mm in the prayer timezone
 * @param date Date the night ends on (the day it belongs to), YYYY-MM-DD
 * @param fajrTime Fajr on that date, HH:mm in the prayer timezone
 * @returns Midnight and the start of the last third
 *
 * @example
 * // Magrib 18:45 on Jan 19, Fajr 06:15 on Jan 20: a 690-minute night
 * getNightTimes('2026-01-19', '18:45', '2026-01-20', '06:15')
 * // { midnight: 2026-01-20 00:30, lastThird: 2026-01-20 02:25 } (London)
 */
export const getNightTimes = (previousDate: string, magribTime: string, date: string, fajrTime: string): NightTimes => {
  const start = createPrayerDatetime(previousDate, magribTime).getTime();
  const length = createPrayerDatetime(date, fajrTime).getTime() - start;

  return {
    midnight: floorToMinute(start + length / 2),
    lastThird: floorToMinute(start + (length * 2) / 3 + TIME_ADJUSTMENTS.lastThird * MINUTE_MS),
  };
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
 * Whole seconds remaining until a target instant, for live countdown display.
 *
 * Rounding model (countdown display contract):
 * - Rounds UP (ceil): each digit owns exactly the wall second being lived
 *   through, so digits flip on the :000 boundary like the system clock.
 * - The final second displays "1s" — never "0s" — because a countdown reads
 *   "N seconds remaining" and the swap to the next prayer happens at zero.
 * - Once the target has passed, holds at 1 until the caller advances the
 *   target (prevents a frozen "0s" while the sequence refresh runs).
 *
 * Uses Date.now() directly: countdown targets are true UTC instants (built
 * via createPrayerDatetime/fromZonedTime), so no timezone conversion is
 * needed for a difference — the offset cancels.
 *
 * @param target Target instant (prayer datetime)
 * @returns Seconds remaining, always >= 1
 *
 * @example
 * getSecondsRemaining(prayer.datetime) // 42 during the second the display reads "42s"
 */
export const getSecondsRemaining = (target: Date): number => {
  const msLeft = target.getTime() - Date.now();
  return Math.max(1, Math.ceil(msLeft / 1000));
};

/**
 * Delay needed to align a timer with the next wall-clock second boundary.
 *
 * Tickers started with a bare setInterval fire at an arbitrary sub-second
 * phase; scheduling the first tick with this delay makes digits flip just
 * after :000, matching the system clock (F.7 status-bar parity).
 *
 * @returns Milliseconds until the next :000 wall-second boundary (1-1000)
 *
 * @example
 * const delay = getWallSecondDelay();
 * setTimeout(() => setInterval(tick, 1000), delay);
 */
export const getWallSecondDelay = (): number => {
  return 1000 - (Date.now() % 1000);
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
 * @param forceHideSeconds If true, seconds never render at any distance —
 *   the label is hours+minutes only (widget countdown label; default: false)
 * @returns Formatted time string
 *
 * @example
 * formatTime(3665) // "1h 1m 5s" (default shows seconds)
 * formatTime(3665, true) // "1h 1m" (hideSeconds in effect)
 * formatTime(45, true) // "45s" (shows seconds in last 60s)
 * formatTime(45, true, true) // "1m" (forceHideSeconds: hours+minutes only)
 * formatTime(0) // "0s"
 * formatTime(-100) // "0s"
 * formatTime(90000) // "25h 0s" (days converted to hours)
 */
export const formatTime = (seconds: number, hideSeconds = false, forceHideSeconds = false): string => {
  if (seconds < 0) return '0s';

  const ms = seconds * 1000;
  const duration = intervalToDuration({ start: 0, end: ms });
  const { days, hours, minutes, seconds: secs } = duration;

  const totalHours = (days || 0) * 24 + (hours || 0);

  // Hide seconds if requested and time is over ~10 minutes (show seconds only in last 10m)
  const shouldShowSeconds = !forceHideSeconds && (!hideSeconds || seconds <= 599);

  const parts = [totalHours && `${totalHours}h`, minutes && `${minutes}m`].filter(Boolean);

  // "0s" never appears beside another unit — a whole minute reads "1m", not "1m 0s".
  // Seconds render only when non-zero (and permitted), or when alone (e.g., "45s", "0s")
  if ((shouldShowSeconds && secs) || parts.length === 0) {
    parts.push(`${secs ?? 0}s`);
  }

  return parts.join(' ');
};

/**
 * Formats remaining seconds as a minute-ceil countdown label — the widget's
 * display policy: hours + minutes only, seconds never render, and the value
 * always rounds UP to the next minute (1h 59m 01s → "2h", 59s → "1m").
 *
 * @param seconds Time remaining in seconds (values ≤ 0 clamp to "1m" —
 *   the label holds its final minute until the next-prayer flip)
 * @returns "Xh Ym" over an hour ("2h", "5h 21m"), else "Xm" ("45m", "1m")
 *
 * @example
 * formatCountdownMinutes(7141) // "2h" (1h 59m 1s rounds up)
 * formatCountdownMinutes(19201) // "5h 21m"
 * formatCountdownMinutes(59) // "1m"
 * formatCountdownMinutes(1) // "1m"
 * formatCountdownMinutes(0) // "1m"
 */
export const formatCountdownMinutes = (seconds: number): string => {
  const totalMinutes = Math.max(1, Math.ceil(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
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
