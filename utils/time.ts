export const getTimeDifference = (targetTime: string): number => {
  const [hours, minutes] = targetTime.split(':').map(Number);
  const now = new Date();
  const target = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    0,
    0
  );

  const diff = target.getTime() - now.getTime();
  
  // Only add a day if we're actually past the time
  // and not exactly at the time
  if (diff < -1000) { // using -1000 to account for millisecond precision
    target.setDate(target.getDate() + 1);
    return target.getTime() - now.getTime();
  }

  return diff;
};

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

export const isTimePassed = (time: string): boolean => {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0);
  return now > target;
};

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
  }
  return diff;
};

export const formatTime = (ms: number): string => {
  if (ms < 0) return '0s';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return [h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean).join(' ');
};

export const addMinutes = (time: string, minutes: number): string => {
  const [h, m] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m + minutes);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};
