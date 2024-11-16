import { DaySelection } from "@/types/prayers";
import { format, addDays, setHours, setMinutes, isAfter, addMinutes as addMins, intervalToDuration, isFuture, isToday, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export const createLondonDate = (date?: Date | string): Date => {
  const targetDate = date ? new Date(date) : new Date();
  const londonTime = formatInTimeZone(targetDate, 'Europe/London', 'yyyy-MM-dd HH:mm:ssXXX');
  return new Date(londonTime);
};

export const getTodayOrTomorrowDate = (daySelection: DaySelection = 'today'): string => {
  let date = createLondonDate();
  
  if (daySelection === 'tomorrow') {
    date = addDays(date, 1);
  }

  return format(date, 'yyyy-MM-dd');
};

export const getTimeDifference = (targetTime: string, date: string = getTodayOrTomorrowDate('today')): number => {
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

export const isTimePassed = (time: string): boolean => {
  const [hours, minutes] = time.split(':').map(Number);
  const now = createLondonDate();
  let target = createLondonDate();
  target = setHours(setMinutes(target, minutes), hours);

  return isAfter(now, target);
};

// Formats milliseconds into readable time units (hours, minutes, seconds).
// Handles edge cases like zero values and returns condensed format (e.g., "1h 30m 5s").
export const formatTime = (ms: number): string => {
  if (ms < 0) return '0s';
  
  const duration = intervalToDuration({ start: 0, end: ms });
  const { hours, minutes, seconds } = duration;
  
  return [
    hours && `${hours}h`,
    minutes && `${minutes}m`,
    seconds !== undefined ? `${seconds}s` : '0s'
  ].filter(Boolean).join(' ');
};

export const addMinutes = (time: string, minutes: number): string => {
  const [h, m] = time.split(':').map(Number);
  let date = createLondonDate();
  date = setHours(setMinutes(date, m), h);
  date = addMins(date, minutes);
  return format(date, 'HH:mm');
};

export const isDateTodayOrFuture = (date: string): boolean => {
  const parsedDate = createLondonDate(date);
  return isToday(parsedDate) || isFuture(parsedDate);
};

export const formatDate = (date: string): string => {
  return format(createLondonDate(date), 'EEE, dd MMM yyyy');
};