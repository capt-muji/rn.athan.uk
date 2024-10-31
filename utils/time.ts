import useStore from "!stores";
import { PrayerController } from "!controllers/Prayer";

export const getToday = (): string => {
  const now = new Date();
  const londonDate = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);

  const [day, month, year] = londonDate.split('/');
  return `${year}-${month}-${day}`;
};

export const convert24hrToMillisecond = (time: string): number => {
  const [hour, minute] = time.split(":").map(Number);

  const now = new Date();
  const londonTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }));
  londonTime.setHours(hour, minute, 0, 0);

  return londonTime.getTime();
};

const isLastMinuteBeforeMidnight = (): boolean => {
  const now = new Date();
  const londonTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(now);

  const [hour, minute] = londonTime.split(':').map(Number);
  return hour === 23 && minute === 59;
};

const isNewDay = (storedDate: string): boolean => getToday() !== storedDate;

const initializeNewDay = async (store: any, intervalId: NodeJS.Timeout): Promise<void> => {
  await new PrayerController(store).init();
  clearInterval(intervalId);
  console.log('New day. Loop closed.');
};

const handleInterval = async (store: any, intervalId: NodeJS.Timeout): Promise<void> => {
  // Always check if it's the last minute before midnight
  if (isLastMinuteBeforeMidnight()) {
    clearInterval(intervalId);
    
    const checkNewDateEvery1sec = 1_000;
    
    intervalId = setInterval(async () => {
      // If the current date is the same as the stored date, do nothing
      if (!isNewDay(store.prayersDate)) return;

      // Initialize a new prayer controller for the new day
      await initializeNewDay(store, intervalId);
    }, checkNewDateEvery1sec);

  } else {
    // If the current date is the same as the stored date, do nothing
    if (!isNewDay(store.prayersDate)) return;

    // Initialize a new prayer controller for the new day
    await initializeNewDay(store, intervalId);
  }
};

/**
 * This function runs a loop until midnight and checks for a new date every 1 minute.
 * If the current date is different from the stored date, it initializes a new prayer controller.
 * If it is within the last minute before midnight, it switches to a 1-second interval until midnight.
 * This function does not return anything and only logs a message when starting the loop.
 * It uses an interval instead of a timeout to avoid throttling.
 */
export const loopUntilMidnight = (): void => {
  console.log('Starting midnight loop...');

  const checkNewDateEvery1min = 60_000;
  const Store = useStore();

  // Determine the initial interval based on the current time
  const initialIntervalMs = isLastMinuteBeforeMidnight() ? 1_000 : checkNewDateEvery1min;

  // Initial interval to check every 1 minute or 1 second based on the current time
  let intervalId = setInterval(() => handleInterval(Store, intervalId), initialIntervalMs);
};

// Example of flow:
// 1. User opens the app at 23:58:30
// 2. loopUntilMidnight is called and checks if it is the last minute before midnight. It's not, so the interval is set to 60,000 ms (1 minute)
// 3. After 60 seconds, it checks if it is 1 minute before midnight. If it is, it switches to a 1-second interval
// 4. If it is not, it continues to check every 60 seconds until it is 1 minute before midnight
// 5. At 23:59:30, it switches to a 1-second interval
// 6. Once it hits midnight and the date changes, it initializes a new prayer controller and clears the interval