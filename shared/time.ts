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

// Creates a new Date object in London timezone
// Converts input date or current date to London time
export const createLondonDate = (date?: Date | number | string): Date => {
  const targetDate = date ? new Date(date) : new Date();
  const londonTime = formatInTimeZone(targetDate, 'Europe/London', 'yyyy-MM-dd HH:mm:ssXXX');
  return new Date(londonTime);
};

// Returns formatted date string for today or tomorrow
// Based on the provided day selection parameter
export const getDateTodayOrTomorrow = (daySelection: DaySelection): string => {
  let date = createLondonDate();

  if (daySelection === DaySelection.Tomorrow) {
    date = addDays(date, 1);
  }

  return format(date, 'yyyy-MM-dd');
};

// Calculates time difference in milliseconds between now and target time
// Returns adjusted time difference if the target time has passed
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

// Checks if a given time has already passed today
// Compares target time with current London time
export const isTimePassed = (time: string): boolean => {
  const [hours, minutes] = time.split(':').map(Number);
  const now = createLondonDate();
  let target = createLondonDate();
  target = setHours(setMinutes(target, minutes), hours);

  return now.getTime() >= target.getTime();
};

// Converts milliseconds into human-readable time format
// Returns formatted string with hours, minutes, and seconds
export const formatTime = (ms: number): string => {
  if (ms < 0) return '0s';

  const duration = intervalToDuration({ start: 0, end: ms });
  const { hours, minutes, seconds } = duration;

  return [hours && `${hours}h`, minutes && `${minutes}m`, seconds !== undefined ? `${seconds}s` : '0s']
    .filter(Boolean)
    .join(' ');
};

// Adjusts a time string by adding or subtracting minutes
// Returns new time in HH:mm format
export const adjustTime = (time: string, minutesDiff: number): string => {
  const [h, m] = time.split(':').map(Number);
  let date = createLondonDate();
  date = setHours(setMinutes(date, m), h);
  date = addMins(date, minutesDiff);
  return format(date, 'HH:mm');
};

// Checks if a date is either today or in the future
// Returns true for today and future dates, false for past dates
export const isDateTodayOrFuture = (date: string): boolean => {
  const parsedDate = createLondonDate(date);
  return isToday(parsedDate) || isFuture(parsedDate);
};

// Formats a date string into a readable format
// Returns date in format: "Fri, 20 Nov 2024"
export const formatDateLong = (date: string): string => {
  return format(createLondonDate(date), 'EEE, d MMM yyyy');
};

// Formats a date into YYYY-MM-DD format
export const formatDateShort = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

// Calculates the start time of the last third of the night
// Uses Maghrib and Fajr times to determine night duration
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

// Checks if a given date string is Friday
export const isFriday = (date?: string | Date): boolean => {
  const parsedDate = createLondonDate(date);
  return format(parsedDate, 'EEEE') === 'Friday';
};

// Checks if all prayers for the day have passed by checking the last prayer time
export const isLastPrayerPassed = (schedule: ScheduleStore): boolean => {
  const lastIndex = Object.keys(schedule.today).length - 1;
  const lastPrayer = schedule.today[lastIndex];
  return isTimePassed(lastPrayer.time);
};

export const isDecember = (): boolean => createLondonDate().getMonth() === 11;

export const getCurrentYear = (): number => createLondonDate().getFullYear();
