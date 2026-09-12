import { format, intervalToDuration } from 'date-fns';

import { ISLAMIC_DAY, PRAYER_TIMEZONE, TIME_ADJUSTMENTS } from '@/shared/constants';

// =============================================================================
// PRAYER-TIMEZONE CLOCK
// =============================================================================
//
// Calendar days follow the prayer timezone (PRAYER_TIMEZONE), never the phone's
// own: a phone set to another timezone still reads London's date, weekday and
// year (ISSUES #30). Calendar days travel as YYYY-MM-DD strings, moments as Dates;
// never read getDate()/getMonth()/getFullYear() off a Date for a prayer day.
//
// The prayer timezone's clock is read by Intl from the instant itself. Helpers
// that first rebuild a Date on the phone's own clock (date-fns-tz toZonedTime,
// getTimezoneOffset) can shift by an hour when that clock skips or repeats an
// hour of its own, so none of them are used for prayer time.

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const MINUTES_IN_DAY = 24 * 60;

const pad2 = (value: number): string => String(value).padStart(2, '0');

const prayerClockFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: PRAYER_TIMEZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** The prayer timezone's calendar and clock at one instant */
interface PrayerClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/**
 * Offset of the prayer timezone's clock from UTC at an instant, read by Intl
 * @param instant Epoch milliseconds (whole seconds)
 * @returns Offset in milliseconds (positive east of UTC, e.g. 3600000 for BST)
 */
const readOffsetByIntl = (instant: number): number => {
  const parts = prayerClockFormatter.formatToParts(instant);
  const field = (type: Intl.DateTimeFormatPartTypes): number => Number(parts.find((part) => part.type === type)?.value);
  // Some engines print midnight as 24 even with hourCycle h23
  const hour = field('hour') % 24;
  const clockAsUtc = Date.UTC(field('year'), field('month') - 1, field('day'), hour, field('minute'), field('second'));
  return clockAsUtc - Math.floor(instant / 1000) * 1000;
};

// Intl is slow on the phone's JavaScript engine and the lists read the clock for
// every row, so offsets are remembered. A UTC day whose offset is the same at its
// first and last minute has no clock change in it (clocks change at most once a
// day): one pair of reads covers all of it. On the two days a year the clocks do
// change, offsets are remembered per quarter hour (every clock change falls on one)
const QUARTER_HOUR_MS = 15 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const dayOffsets = new Map<string, number | null>();
const quarterHourOffsets = new Map<number, number>();

/**
 * Offset of the prayer timezone's clock from UTC at an instant
 * @param instant Epoch milliseconds
 * @returns Offset in milliseconds (positive east of UTC, e.g. 3600000 for BST)
 */
const prayerTimezoneOffset = (instant: number): number => {
  const utcDay = new Date(instant).toISOString().slice(0, 10);
  let dayOffset = dayOffsets.get(utcDay);
  if (dayOffset === undefined) {
    const dayStart = Date.parse(`${utcDay}T00:00:00Z`);
    const first = readOffsetByIntl(dayStart);
    const last = readOffsetByIntl(dayStart + DAY_MS - MINUTE_MS);
    dayOffset = first === last ? first : null;
    dayOffsets.set(utcDay, dayOffset);
  }
  if (dayOffset !== null) return dayOffset;

  const quarterHour = Math.floor(instant / QUARTER_HOUR_MS);
  let offset = quarterHourOffsets.get(quarterHour);
  if (offset === undefined) {
    offset = readOffsetByIntl(quarterHour * QUARTER_HOUR_MS);
    quarterHourOffsets.set(quarterHour, offset);
  }
  return offset;
};

/**
 * Reads the prayer timezone's calendar and clock at an instant
 * @param instant Date or epoch milliseconds
 * @returns Year, month (1-12), day, hour (0-23), minute and second there
 */
const readPrayerClock = (instant: Date | number): PrayerClock => {
  const ms = typeof instant === 'number' ? instant : instant.getTime();
  const clock = new Date(ms + prayerTimezoneOffset(ms));

  return {
    year: clock.getUTCFullYear(),
    month: clock.getUTCMonth() + 1,
    day: clock.getUTCDate(),
    hour: clock.getUTCHours(),
    minute: clock.getUTCMinutes(),
    second: clock.getUTCSeconds(),
  };
};

// =============================================================================
// DATE CREATION & CONVERSION
// =============================================================================

/**
 * Returns the current instant (or the given one) as a Date
 *
 * A Date is an absolute instant, kept to the millisecond: the wall-clock ticker
 * commits a boundary transition in the first ~100ms after :00, and a
 * second-truncated "now" would equal the prayer datetime exactly. Its calendar
 * day in the prayer timezone comes from formatDateShort, never from its
 * device-local getters.
 *
 * @param date Optional date to convert (defaults to now)
 * @returns Date for that instant
 */
export const createInstant = (date?: Date | number | string): Date => (date ? new Date(date) : new Date());

/**
 * Creates a full Date object from date and time strings
 * Used to combine API data (separate date/time) into Prayer.datetime
 *
 * IMPORTANT: Prayer times are clock readings in the prayer timezone (London).
 * The reading is shifted by whichever offset really applies at that instant —
 * worked out from the timezone rules alone, so the result is the same on a phone
 * set to any timezone. Around a clock change: a repeated reading (clocks back)
 * takes the later occurrence and a skipped one (clocks forward) the new offset.
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
  const reading = Date.parse(`${date}T${time}:00Z`);
  const offsetBefore = prayerTimezoneOffset(reading - 12 * HOUR_MS);
  const offsetAfter = prayerTimezoneOffset(reading + 12 * HOUR_MS);

  // No clock change within half a day: one offset, one answer
  if (offsetBefore === offsetAfter) return new Date(reading - offsetBefore);

  const holds = (offset: number) => prayerTimezoneOffset(reading - offset) === offset;
  if (holds(offsetAfter)) return new Date(reading - offsetAfter);
  if (holds(offsetBefore)) return new Date(reading - offsetBefore);

  // A reading the clocks skip over
  return new Date(reading - offsetAfter);
};

/**
 * Formats an exact instant as HH:mm on the prayer timezone's wall clock
 * @param date Date object (an exact instant)
 * @returns Time string in HH:mm format
 *
 * @example
 * formatPrayerTime(createPrayerDatetime("2026-10-23", "23:58")) // "23:58"
 */
export const formatPrayerTime = (date: Date): string => {
  const clock = readPrayerClock(date);
  return `${pad2(clock.hour)}:${pad2(clock.minute)}`;
};

/**
 * Adds whole days to a YYYY-MM-DD date
 * Pure calendar arithmetic — independent of every timezone and of clock changes
 * @param date Date string in YYYY-MM-DD format
 * @param days Days to add (negative to go back)
 * @returns The resulting date in YYYY-MM-DD format
 *
 * @example
 * addDaysToDateString("2026-12-31", 1) // "2027-01-01"
 */
export const addDaysToDateString = (date: string, days: number): string => {
  const noonUtc = new Date(`${date}T12:00:00Z`);
  noonUtc.setUTCDate(noonUtc.getUTCDate() + days);
  return noonUtc.toISOString().slice(0, 10);
};

/**
 * Returns the calendar date before a YYYY-MM-DD date
 * @param date Date string in YYYY-MM-DD format
 * @returns The previous date in YYYY-MM-DD format
 *
 * @example
 * getPreviousDateString("2026-01-01") // "2025-12-31"
 */
export const getPreviousDateString = (date: string): string => addDaysToDateString(date, -1);

/**
 * Today's date in the prayer timezone
 * @returns Date string in YYYY-MM-DD format
 */
export const getTodayDateString = (): string => formatDateShort(new Date());

/**
 * A moment inside a calendar day of the prayer timezone (12:00 there), for APIs
 * that take a Date to name a day
 * @param date Date string in YYYY-MM-DD format
 * @returns Date at 12:00 prayer-timezone time on that date
 */
export const getDayAnchor = (date: string): Date => createPrayerDatetime(date, '12:00');

// =============================================================================
// DATE FORMATTING
// =============================================================================

/**
 * Formats a date string into a readable format
 * @param date Date string in YYYY-MM-DD format
 * @returns Formatted date string (e.g., "Fri, 20 Nov 2024")
 */
export const formatDateLong = (date: string): string => {
  const [year, month, day] = date.split('-').map(Number);
  // A calendar date needs no timezone: noon on the phone's own clock always exists
  return format(new Date(year, month - 1, day, 12), 'EEE, d MMM yyyy');
};

/**
 * Formats a date string into Hijri format using Intl.DateTimeFormat
 * Falls back to Gregorian if conversion fails
 * @param date Date string in YYYY-MM-DD format
 * @returns Formatted Hijri date string (e.g., "Rajab 1, 1447")
 */
export const formatHijriDateLong = (date: string): string => {
  try {
    const hijriFormatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: PRAYER_TIMEZONE,
    });
    // Remove "AH" suffix from formatted date
    return hijriFormatter.format(getDayAnchor(date)).replace(/ AH$/, '');
  } catch {
    return formatDateLong(date);
  }
};

/**
 * Formats an instant as its calendar date in the prayer timezone (YYYY-MM-DD)
 *
 * The same on a phone set to any timezone — required for cache keys and
 * belongsToDate matching.
 *
 * @param date Date object
 * @returns Date string in YYYY-MM-DD format
 */
export const formatDateShort = (date: Date): string => {
  const clock = readPrayerClock(date);
  return `${clock.year}-${pad2(clock.month)}-${pad2(clock.day)}`;
};

// =============================================================================
// DATE CHECKS
// =============================================================================

/**
 * Checks if a date is yesterday or in the future (prayer timezone)
 * Used for filtering API response data
 * @param date Date string in YYYY-MM-DD format
 * @returns boolean indicating if date is yesterday or future
 */
export const isDateYesterdayOrFuture = (date: string): boolean => {
  const today = getTodayDateString();
  return date >= getPreviousDateString(today);
};

/**
 * Checks if a day is a Friday
 * @param date Optional date string (YYYY-MM-DD) or instant; defaults to today (prayer timezone)
 * @returns boolean indicating if the date is Friday
 */
export const isFriday = (date?: string | Date): boolean => {
  let day = getTodayDateString();
  if (typeof date === 'string') day = date.slice(0, 10);
  if (date instanceof Date) day = formatDateShort(date);

  return new Date(`${day}T12:00:00Z`).getUTCDay() === 5;
};

/**
 * Checks if the current month is December in the prayer timezone
 * @returns boolean indicating if current month is December
 */
export const isDecember = (): boolean => getTodayDateString().slice(5, 7) === '12';

/**
 * Checks if the current date falls within Ramadan or the last days of Sha'ban
 * Uses ISLAMIC_DAY.RAMADAN_DECORATION_DAYS_BEFORE to determine the pre-Ramadan window
 * Uses the islamic-umalqura calendar via Intl.DateTimeFormat (prayer timezone)
 * @returns boolean indicating if current date is during Ramadan season
 */
export const isRamadan = (): boolean => {
  // Build-time preview gate, statically folded OFF in production builds (the
  // EXPO_PUBLIC_BG_DEBUG idiom): building with EXPO_PUBLIC_FORCE_RAMADAN=1
  // flips the whole season — icon variant, decorations, settings toggle —
  // for off-season device evaluation
  if (process.env.EXPO_PUBLIC_FORCE_RAMADAN === '1') return true;
  try {
    const date = new Date();
    const monthFmt = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      month: 'numeric',
      timeZone: PRAYER_TIMEZONE,
    });
    const month = monthFmt.format(date);

    // During Ramadan (month 9)
    if (month === '9') return true;

    // Pre-Ramadan window in Sha'ban
    if (month === '8') {
      const dayFmt = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
        day: 'numeric',
        timeZone: PRAYER_TIMEZONE,
      });
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
 * Checks if an instant falls on January 1st in the prayer timezone
 * (needed for CountdownBar yesterday's data)
 * @param date Date object
 * @returns boolean indicating if the date is January 1st
 */
export const isJanuaryFirst = (date: Date): boolean => formatDateShort(date).endsWith('-01-01');

/**
 * Returns the current year in the prayer timezone
 * @returns Current year number
 */
export const getCurrentYear = (): number => Number(getTodayDateString().slice(0, 4));

// =============================================================================
// NIGHT TIME CALCULATIONS (Islamic)
// =============================================================================

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
 * Pure clock arithmetic that wraps past midnight (e.g., 00:10 - 20min = 23:50) —
 * independent of the date, the device's timezone and when it runs.
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
  const total = (((hours * 60 + minutes + minutesDiff) % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
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
 * via createPrayerDatetime), so no timezone conversion is needed for a
 * difference — the offset cancels.
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
 *    - If hideSeconds=true: Show seconds only at 599s or less — the final
 *      ~10 minutes, NOT the final minute (e.g., "9m 59s", "45s")
 *    - Above 599s with hideSeconds=true: Hide seconds ("10m", "1h 30m")
 * 4. Zero handling:
 *    - Only units with non-zero values are shown
 *    - A zero seconds value never renders beside another unit: a whole
 *      minute reads "1m", a whole 25 hours reads "25h"
 *    - If all units are zero: Returns "0s"
 * 5. Spacing: Units separated by single space
 *
 * Use Cases:
 * - Countdown: Use hideSeconds=true to avoid flicker in UI
 * - Precise display: Use hideSeconds=false for exact timing
 * - Final-stretch urgency: hideSeconds=true shows seconds in the final 599s
 *
 * @param seconds Time in seconds (can be negative, but returns "0s")
 * @param hideSeconds If true, hides seconds when time > 599s (default: false)
 * @param forceHideSeconds If true, seconds are suppressed beside hours and
 *   minutes at any distance — but they still render when they are the only
 *   unit, because an empty parts list always falls back to "Ns" (default:
 *   false). For a label that never shows seconds, use formatCountdownMinutes
 *   below, which is what the widget actually calls.
 * @returns Formatted time string
 *
 * Every example below is pinned by "pins every example in the JSDoc" in
 * shared/__tests__/time.test.ts. Change one and change both.
 *
 * @example
 * formatTime(3665) // "1h 1m 5s" (default shows seconds)
 * formatTime(3665, true) // "1h 1m" (hideSeconds in effect)
 * formatTime(45, true) // "45s" (shows seconds inside the final 599s)
 * formatTime(45, true, true) // "45s" (forceHideSeconds: seconds still render alone)
 * formatTime(0) // "0s"
 * formatTime(-100) // "0s"
 * formatTime(90000) // "25h" (days converted to hours; no trailing "0s")
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
