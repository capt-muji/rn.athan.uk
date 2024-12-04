import {
  format,
  addDays,
  setHours,
  setMinutes,
  addMinutes as addMins,
  intervalToDuration,
  isFuture,
  isToday,
  subDays,
} from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

import { DaySelection, ScheduleStore } from '@/shared/types';

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
 * Returns formatted date string for today or tomorrow
 * @param daySelection Selection of today or tomorrow
 * @returns Date string in YYYY-MM-DD format
 */
export const getDateTodayOrTomorrow = (daySelection: DaySelection): string => {
  let date = createLondonDate();

  if (daySelection === DaySelection.Tomorrow) {
    date = addDays(date, 1);
  }

  return format(date, 'yyyy-MM-dd');
};

/**
 * Calculates time difference in milliseconds between now and target time
 * @param targetTime Target time in HH:mm format
 * @param date Date string in YYYY-MM-DD format
 * @returns Time difference in milliseconds
 */
export const getTimeDifference = (targetTime: string, date: string): number => {
  const [hours, minutes] = targetTime.split(':').map(Number);
  const now = createLondonDate();
  let target = createLondonDate(date);
  target = setHours(setMinutes(target, minutes), hours);

  const diff = target.getTime() - now.getTime();

  const threshold = -1000;

  if (diff < threshold) {
    target = addDays(target, 1);
    return target.getTime() - now.getTime();
  }

  return diff;
};

/**
 * Checks if a given time has already passed today
 * @param time Time string in HH:mm format
 * @returns boolean indicating if the time has passed
 */
export const isTimePassed = (time: string): boolean => {
  const [hours, minutes] = time.split(':').map(Number);
  const now = createLondonDate();
  let target = createLondonDate();
  target = setHours(setMinutes(target, minutes), hours);

  return now.getTime() >= target.getTime();
};

/**
 * Converts milliseconds into human-readable time format
 * @param ms Time in milliseconds
 * @returns Formatted time string (e.g., "1h 30m 45s")
 */
export const formatTime = (ms: number): string => {
  if (ms < 0) return '0s';

  const duration = intervalToDuration({ start: 0, end: ms });
  const { hours, minutes, seconds } = duration;

  return [hours && `${hours}h`, minutes && `${minutes}m`, seconds !== undefined ? `${seconds}s` : '0s']
    .filter(Boolean)
    .join(' ');
};

/**
 * Adjusts a time string by adding or subtracting minutes
 * @param time Time string in HH:mm format
 * @param minutesDiff Number of minutes to adjust
 * @returns Adjusted time string in HH:mm format
 */
export const adjustTime = (time: string, minutesDiff: number): string => {
  const [h, m] = time.split(':').map(Number);
  let date = createLondonDate();
  date = setHours(setMinutes(date, m), h);
  date = addMins(date, minutesDiff);
  return format(date, 'HH:mm');
};

/**
 * Checks if a date is either today or in the future
 * @param date Date string in YYYY-MM-DD format
 * @returns boolean indicating if the date is today or in the future
 */
export const isDateTodayOrFuture = (date: string): boolean => {
  const parsedDate = createLondonDate(date);
  return isToday(parsedDate) || isFuture(parsedDate);
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

  // add 10 minutes to the last third start time
  const minutesToAdd = 10;
  lastThirdStart.setMinutes(lastThirdStart.getMinutes() + minutesToAdd);

  // Return formatted time string in 24-hour format (HH:mm)
  return format(lastThirdStart, 'HH:mm');
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
 * Checks if all prayers for the day have passed by checking the last prayer time
 * @param schedule Schedule object containing prayer times
 * @returns boolean indicating if the last prayer has passed
 */
export const isLastPrayerPassed = (schedule: ScheduleStore): boolean => {
  const lastIndex = Object.keys(schedule.today).length - 1;
  const lastPrayer = schedule.today[lastIndex];
  return isTimePassed(lastPrayer.time);
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

/**
 * Rounds milliseconds to the nearest second
 * @param ms Time in milliseconds
 * @returns Rounded milliseconds
 */
const roundToNearestSecond = (ms: number): number => {
  return Math.round(ms / 1000) * 1000;
};

/**
 * Calculates countdown information for a prayer time
 * @param prayer Prayer object containing time and name
 * @returns Countdown information with formatted time and prayer name
 */
export const calculateCountdown = (prayer: { time: string; english: string }) => {
  const isPassed = isTimePassed(prayer.time);
  const prayerDate = getDateTodayOrTomorrow(isPassed ? DaySelection.Tomorrow : DaySelection.Today);
  const timeDiff = roundToNearestSecond(getTimeDifference(prayer.time, prayerDate));

  const threshold = 1000; // 1 second

  return {
    time: formatTime(timeDiff),
    name: prayer.english,
    hasElapsed: timeDiff <= threshold,
  };
};
