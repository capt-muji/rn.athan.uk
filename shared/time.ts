import { ISLAMIC_DAY, PRAYER_TIMEZONE, TIME_ADJUSTMENTS } from '@/shared/constants';
import { type TranslationKey, t } from '@/shared/i18n';

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
 * Reads the prayer timezone's calendar and clock at an instant. Exported for
 * data paths (the mock API and the day-grouping rules) that need the clock's
 * own numbers, never the localised display formatters
 * @param instant An exact instant
 * @returns Year, month (1-12), day, hour (0-23), minute and second there
 */
export const readPrayerClock = (instant: Date): PrayerClock => {
  const ms = instant.getTime();
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
  const composed = `${pad2(clock.hour)}:${pad2(clock.minute)}`;
  return composed;
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

// Calendar names compose from the active catalog's calendar keys (A2): the key
// tuples are typed against TranslationKey so a computed lookup stays compile-checked
const GREGORIAN_WEEKDAY_KEYS = [
  'calendar.weekdayShort.1',
  'calendar.weekdayShort.2',
  'calendar.weekdayShort.3',
  'calendar.weekdayShort.4',
  'calendar.weekdayShort.5',
  'calendar.weekdayShort.6',
  'calendar.weekdayShort.7',
] as const satisfies readonly TranslationKey[];

const GREGORIAN_MONTH_KEYS = [
  'calendar.monthShort.1',
  'calendar.monthShort.2',
  'calendar.monthShort.3',
  'calendar.monthShort.4',
  'calendar.monthShort.5',
  'calendar.monthShort.6',
  'calendar.monthShort.7',
  'calendar.monthShort.8',
  'calendar.monthShort.9',
  'calendar.monthShort.10',
  'calendar.monthShort.11',
  'calendar.monthShort.12',
] as const satisfies readonly TranslationKey[];

const HIJRI_MONTH_KEYS = [
  'calendar.hijri.1',
  'calendar.hijri.2',
  'calendar.hijri.3',
  'calendar.hijri.4',
  'calendar.hijri.5',
  'calendar.hijri.6',
  'calendar.hijri.7',
  'calendar.hijri.8',
  'calendar.hijri.9',
  'calendar.hijri.10',
  'calendar.hijri.11',
  'calendar.hijri.12',
] as const satisfies readonly TranslationKey[];

/**
 * Formats a date string into the active locale's readable format, in the English
 * shape and order (weekday, day, month, year)
 * @param date Date string in YYYY-MM-DD format
 * @returns Formatted date string (e.g., "Fri, 20 Nov 2024")
 */
export const formatDateLocalized = (date: string): string => {
  const [year, month, day] = date.split('-').map(Number);
  // A calendar date needs no timezone: noon on the phone's own clock always exists
  const weekday = new Date(year, month - 1, day, 12).getDay();
  // The catalog keys are ISO-numbered, Monday 1 to Sunday 7
  const isoWeekday = weekday === 0 ? 7 : weekday;
  const composed = `${t(GREGORIAN_WEEKDAY_KEYS[isoWeekday - 1])}, ${String(day)} ${t(GREGORIAN_MONTH_KEYS[month - 1])} ${String(year)}`;
  return composed;
};

/**
 * Formats a date string into the active locale's Hijri format, composed from the
 * catalog's Hijri month names. The Intl call stays en-US with numeric fields so
 * the shape and order stay frozen, with Latin digits in every locale (row 88);
 * no era affix appears in any locale (R3.1), and a failed conversion
 * falls back to the localized Gregorian label.
 * @param date Date string in YYYY-MM-DD format
 * @returns Formatted Hijri date string (e.g., "Rajab 1, 1447")
 */
export const formatHijriDateLocalized = (date: string): string => {
  try {
    const hijriFormatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      timeZone: PRAYER_TIMEZONE,
    });
    const parts = hijriFormatter.formatToParts(getDayAnchor(date));
    const hijriMonth = Number(parts.find((part) => part.type === 'month')?.value);
    const hijriDay = parts.find((part) => part.type === 'day')?.value;
    const hijriYear = parts.find((part) => part.type === 'year')?.value;
    const composed = `${t(HIJRI_MONTH_KEYS[hijriMonth - 1])} ${String(hijriDay)}, ${String(hijriYear)}`;
    return composed;
  } catch {
    return formatDateLocalized(date);
  }
};

/**
 * The footer a widget draws under its date label: the short weekday alone
 * under the Gregorian preference, the Hijri month's first three graphemes and
 * the day under Hijri — the exact bytes the v6-era layouts produced by parsing
 * the English labels, composed per catalog so the footer follows the active
 * locale instead (R7.1). Lives here so the app and every widget compose it
 * from one source.
 * @param date Date string in YYYY-MM-DD format
 * @param hijriDate Whether the app's Hijri date preference is on
 * @returns The footer text (e.g., "Sun", "Raj 1")
 */
export const footerFor = (date: string, hijriDate: boolean): string => {
  if (hijriDate) {
    try {
      const hijriFormatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        timeZone: PRAYER_TIMEZONE,
      });
      const parts = hijriFormatter.formatToParts(getDayAnchor(date));
      const hijriMonth = Number(parts.find((part) => part.type === 'month')?.value);
      const hijriDay = parts.find((part) => part.type === 'day')?.value;
      const month = t(HIJRI_MONTH_KEYS[hijriMonth - 1]);
      const composed = `${[...month].slice(0, 3).join('')} ${hijriDay}`;
      return composed;
    } catch {
      // Falls through to the Gregorian footer, like formatHijriDateLocalized
    }
  }
  const [year, month, day] = date.split('-').map(Number);
  // A calendar date needs no timezone: noon on the phone's own clock always exists
  const weekday = new Date(year, month - 1, day, 12).getDay();
  // The catalog keys are ISO-numbered, Monday 1 to Sunday 7
  const isoWeekday = weekday === 0 ? 7 : weekday;
  return t(GREGORIAN_WEEKDAY_KEYS[isoWeekday - 1]);
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
  // Build-time preview gate: EXPO_PUBLIC_FORCE_RAMADAN=1 flips the whole
  // season — icon variant, decorations, settings toggle — for off-season
  // device evaluation. The prod check keeps a variable left set out of a
  // store build; both operands are literals, so Metro folds the branch away.
  if (process.env.EXPO_PUBLIC_FORCE_RAMADAN === '1' && process.env.EXPO_PUBLIC_ENV !== 'prod') return true;
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
 * Whole seconds remaining until a target instant, for live countdown display.
 *
 * Rounding model (countdown display contract):
 * - Rounds UP (ceil): each digit owns exactly the wall second being lived
 *   through, so digits flip on the :000 boundary like the system clock.
 * - The final second displays "00:00:01" — never "00:00:00" — because a
 *   countdown reads "N seconds remaining" and the swap to the next prayer
 *   happens at zero.
 * - Once the target has passed, holds at 1 until the caller advances the
 *   target (prevents a frozen "00:00:00" while the sequence refresh runs).
 *
 * Uses Date.now() directly: countdown targets are true UTC instants (built
 * via createPrayerDatetime), so no timezone conversion is needed for a
 * difference — the offset cancels.
 *
 * @param target Target instant (prayer datetime)
 * @returns Seconds remaining, always >= 1
 *
 * @example
 * getSecondsRemaining(prayer.datetime) // 42 during the second the display reads "00:00:42"
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
 * Converts seconds into the countdown display string: the fixed-width colon
 * shapes in every locale (owner ruling 2026-10-13, row 82). Every group is
 * always double digits, so a digit change never shifts the screen.
 *
 * 1. Seconds hidden: HH:MM ("01:32", "00:42", "25:00") — the hours are never hidden
 * 2. Seconds shown: HH:MM:SS ("01:32:05", "00:42:05")
 * 3. hideSeconds still shows seconds inside the final 599 s: "00:09:59" at 599 s,
 *    "00:10" at 600 s
 * 4. Zero and negative clamp to "00:00:00"
 * 5. Days fold into hours ("25:00:00", never a day unit)
 *
 * Every example below is pinned by "pins every example in the JSDoc" in
 * shared/__tests__/time.test.ts. Change one and change both.
 *
 * @example
 * formatTime(3665) // "01:01:05" (default shows seconds)
 * formatTime(3665, true) // "01:01" (hideSeconds in effect)
 * formatTime(45, true) // "00:00:45" (seconds inside the final 599 s)
 * formatTime(0) // "00:00:00"
 * formatTime(-100) // "00:00:00"
 * formatTime(90000) // "25:00:00" (days converted to hours)
 */
export const formatTime = (seconds: number, hideSeconds = false): string => {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const shouldShowSeconds = !hideSeconds || seconds <= 599;

  // Row 72 rule 2: fixed-width sections, every group always double digits, so a digit
  // change never shifts the screen; rule 3 keeps the hours visible as a dim 00
  const composed = shouldShowSeconds
    ? `${pad2(hours)}:${pad2(minutes)}:${pad2(secs)}`
    : `${pad2(hours)}:${pad2(minutes)}`;
  return composed;
};

/**
 * Formats seconds elapsed into the "ago" duration: the catalog `now` word inside
 * the final 60 seconds, the lettered shape otherwise, fixed in every locale
 * (owner ruling 2026-10-15, row 83): unpadded Latin digits with lowercase h m
 * letters that never localise, hours and minutes only, a zero-minute group
 * dropping beside live hours. The lettered duration composes inside Unicode
 * left-to-right isolates so the run reads left to right inside an RTL sentence
 * (row 92: under the RTL base direction the space between the groups resolves
 * RTL and swaps them), the letters lowercase at the sentence's own face, fixed
 * in every locale.
 *
 * @param seconds - Seconds since prayer occurred (0 or positive)
 * @returns "now" (<60 s, the catalog word); "\u20662m\u2069", "\u20661h\u2069",
 * "\u20662h 1m\u2069" otherwise
 *
 * @example
 * formatTimeAgo(45)      // Returns: "now"
 * formatTimeAgo(120)     // Returns: "\u20662m\u2069"
 * formatTimeAgo(3600)    // Returns: "\u20661h\u2069"
 * formatTimeAgo(5400)    // Returns: "\u20661h 30m\u2069"
 * formatTimeAgo(7200)    // Returns: "\u20662h\u2069"
 * formatTimeAgo(0)       // Returns: "now"
 */
export const formatTimeAgo = (seconds: number): string => {
  if (seconds < 60) {
    return t('duration.now');
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `\u2066${minutes}m\u2069`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `\u2066${hours}h\u2069`;
  }
  return `\u2066${hours}h ${remainingMinutes}m\u2069`;
};

/**
 * Splits a display string on its single colon for the prayer row time's gap
 * node, or returns null when the string carries no colon, more than one. The
 * row's digits sit either side, so the halves are not digit-checked.
 */
export const splitSingleColon = (value: string): [string, string] | null => {
  const index = value.indexOf(':');
  if (index === -1 || value.indexOf(':', index + 1) !== -1) return null;
  return [value.slice(0, index), value.slice(index + 1)];
};
