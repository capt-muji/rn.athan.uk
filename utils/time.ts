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

  if (target.getTime() < now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return Math.max(0, target.getTime() - now.getTime());
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
