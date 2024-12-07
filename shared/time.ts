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

import { DaySelection, ScheduleStore, TimerCallbacks } from '@/shared/types';

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
 * Calculates the seconds until a specific time on a given date
 * @param targetTime Time to calculate difference to (HH:mm format)
 * @param date Target date (YYYY-MM-DD format)
 * @returns Difference in seconds (positive if target is in future, negative if passed)
 */
export const secondsRemainingUntil = (targetTime: string, date: string): number => {
  const [hours, minutes] = targetTime.split(':').map(Number);

  const now = createLondonDate();
  let target = createLondonDate(date);

  target = setHours(setMinutes(target, minutes), hours);

  return Math.floor((target.getTime() - now.getTime()) / 1000);
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
 * Converts seconds into human-readable time format
 * @param seconds Time in seconds
 * @returns Formatted time string (e.g., "1h 30m 45s")
 */
export const formatTime = (seconds: number): string => {
  if (seconds < 0) return '0s';

  const ms = seconds * 1000;
  const duration = intervalToDuration({ start: 0, end: ms });
  const { hours, minutes, seconds: secs } = duration;

  return [hours && `${hours}h`, minutes && `${minutes}m`, secs !== undefined ? `${secs}s` : '0s']
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
 * Calculates countdown for a prayer time
 * @param prayer Prayer object containing time and english name
 * @returns Object containing time left until prayer (in ms) and prayer name
 */
export const calculateCountdown1 = (prayer: { time: string; english: string }) => {
  const isPassed = isTimePassed(prayer.time);
  const prayerDate = getDateTodayOrTomorrow(isPassed ? DaySelection.Tomorrow : DaySelection.Today);
  const timeLeft = secondsRemainingUntil(prayer.time, prayerDate);

  return { timeLeft, name: prayer.english };
};

export const calculateCountdown = (schedule: ScheduleStore, index: number) => {
  const todayPrayer = schedule.today[index];
  const tomorrowPrayer = schedule.tomorrow[index];

  // Use tomorrow's prayer time if today's has passed
  const prayer = isTimePassed(todayPrayer.time) ? tomorrowPrayer : todayPrayer;

  return {
    timeLeft: secondsRemainingUntil(prayer.time, prayer.date),
    name: prayer.english,
  };
};

/**
 * Creates a timer that counts down from specified seconds
 * @param timeLeft Number of seconds to count down from
 * @param callbacks Optional callback functions for tick and finish events
 * @returns NodeJS.Timer interval ID
 */
export const timer = (timeLeft: number, callbacks: TimerCallbacks): NodeJS.Timer => {
  const onInterval = () => {
    timeLeft--;

    if (timeLeft === 0) {
      clearInterval(timerId);
      callbacks.onFinish();
      return;
    }

    callbacks.onTick(timeLeft);
  };

  const timerId = setInterval(onInterval, 1000);

  return timerId;
};
