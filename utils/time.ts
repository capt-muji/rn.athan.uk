import { IPrayerInfo, ITransformedToday } from "@/types/prayers";

/**
 * Returns today's date in YYYY-MM-DD format. Uses system time for accuracy.
 */
export const getTodaysDate = (): string => new Date().toISOString().split('T')[0];

/**
 * Calculates milliseconds between current time and target time. 
 * Now accepts a date parameter to handle tomorrow's prayers correctly.
 */
export const getTimeDifference = (targetTime: string, date: string = getTodaysDate()): number => {
  const [hours, minutes] = targetTime.split(':').map(Number);
  const now = new Date();
  const target = new Date(date);
  target.setHours(hours, minutes, 0, 0);

  const diff = target.getTime() - now.getTime();
  
  // Only add a day if we're actually past the time
  // and not exactly at the time
  if (diff < -1000) { // using -1000 to account for millisecond precision
    target.setDate(target.getDate() + 1);
    return target.getTime() - now.getTime();
  }

  return diff;
};

/**
 * Formats milliseconds into human readable time string with hours, minutes, seconds. Returns string in format like "1h 30m 45s".
 */
export const formatTimeRemaining = (ms: number): string => {
  if (ms < 0) return '0s';
  
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / 1000 / 60) % 60);
  const hours = Math.floor(ms / 1000 / 60 / 60);

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds >= 0) parts.push(`${seconds}s`);

  return parts.join(' ');
};

/**
 * Checks if a given time has already passed today. Returns true if time is in the past.
 */
export const isTimePassed = (time: string): boolean => {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  
  target.setHours(hours, minutes, 0);

  return now > target;
};

/**
 * Calculates milliseconds until a future time today or tomorrow. Always returns a positive number.
 */
export const getTimeUntil = (targetTime: string): number => {
  const [hours, minutes] = targetTime.split(':').map(Number);
  const now = new Date();
  const target = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes
  );

  let diff = target.getTime() - now.getTime();
  if (diff < 0) {
    target.setDate(target.getDate() + 1);
    diff = target.getTime() - now.getTime();
  };

  return diff;
};

/**
 * Formats milliseconds into condensed time string. Optimized for display in timer components.
 */
export const formatTime = (ms: number): string => {
  if (ms < 0) return '0s';

  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);

  return [h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean).join(' ');
};

/**
 * Adds specified minutes to a time string. Returns new time in HH:mm format.
 */
export const addMinutes = (time: string, minutes: number): string => {
  const [h, m] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m + minutes);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

/**
 * Gets current prayer information including name and countdown.
 * Modified to handle tomorrow's prayers correctly.
 */
export const getCurrentPrayerInfo = (
  todaysPrayers: ITransformedToday,
  overlayVisible: number,
  nextPrayerIndex: number,
  selectedDate: 'today' | 'tomorrow' = 'today'
): IPrayerInfo => {
  if (!todaysPrayers || Object.keys(todaysPrayers).length === 0) {
    return { timerName: '', timeDisplay: '' };
  }

  const currentPrayer = overlayVisible > -1
    ? todaysPrayers[overlayVisible]
    : todaysPrayers[nextPrayerIndex];

  if (!currentPrayer) {
    return { timerName: 'All prayers passed', timeDisplay: '' };
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split('T')[0];

  const diff = getTimeDifference(
    currentPrayer.time, 
    selectedDate === 'tomorrow' ? tomorrowDate : getTodaysDate()
  );
  const timeDisplay = formatTime(diff);

  return {
    timerName: currentPrayer.english,
    timeDisplay,
    timeDifference: diff,
    currentPrayer
  };
};

/**
 * Checks if a date is today or in the future. Used for filtering prayer times.
 */
export const isDateTodayOrFuture = (date: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  return checkDate >= today;
};
