import { IPrayerInfo, ITransformedToday } from "@/types/prayers";

// Returns current date string in YYYY-MM-DD format from system time.
// Example output: "2024-01-20". Uses ISO string for consistent formatting.
export const getTodaysDate = (): string => new Date().toISOString().split('T')[0];

// Returns milliseconds between current time and target time (format: HH:mm).
// Handles both today's and tomorrow's times, auto-adjusts if time has passed.
export const getTimeDifference = (targetTime: string, date: string = getTodaysDate()): number => {
  const [hours, minutes] = targetTime.split(':').map(Number);
  const now = new Date();
  const target = new Date(date);
  target.setHours(hours, minutes, 0, 0);

  const diff = target.getTime() - now.getTime();
  
  const threshold = -1000;
  
  // Only add a day if we're actually past the time and not exactly at the time
  // using threshold to account for millisecond precision
  if (diff < threshold) { 
    target.setDate(target.getDate() + 1);
    return target.getTime() - now.getTime();
  }

  return diff;
};

// Takes time string in HH:mm format and compares with current system time.
// Returns true if given time has already passed today, false if time is still upcoming.
export const isTimePassed = (time: string): boolean => {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  
  target.setHours(hours, minutes, 0);

  return now > target;
};

// Converts milliseconds into human readable format like "1h 30m 45s".
// Optimizes display by removing zero values and handling negative inputs.
export const formatTime = (ms: number): string => {
  if (ms < 0) return '0s';

  const MS_IN_HOUR = 3600000;
  const MS_IN_MINUTE = 60000;
  const MS_IN_SECOND = 1000;

  const h = Math.floor(ms / MS_IN_HOUR);
  const m = Math.floor((ms % MS_IN_HOUR) / MS_IN_MINUTE);
  const s = Math.floor((ms % MS_IN_MINUTE) / MS_IN_SECOND);

  return [h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean).join(' ');
};

// Takes time string (HH:mm) and number of minutes to add.
// Returns new time string in HH:mm format, handles day wraparound.
export const addMinutes = (time: string, minutes: number): string => {
  const [h, m] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m + minutes);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// Returns prayer info object with name, countdown, and timing details.
// Handles overlay state, prayer transitions, and tomorrow's prayer times.
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

// Validates if a date string (YYYY-MM-DD) is either today or a future date.
// Returns true for today/future dates, false for past dates. Used for prayer filtering.
export const isDateTodayOrFuture = (date: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  return checkDate >= today;
};
