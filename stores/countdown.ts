import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import { overlayAtom } from './overlay';

import * as TimeUtils from '@/shared/time';
import { CountdownStore, ScheduleType } from '@/shared/types';
import { getSchedule, incrementNextIndex } from '@/stores/schedule';
import { dateAtom, sync } from '@/stores/sync';

const store = getDefaultStore();

type TimerKey = 'standard' | 'extra' | 'overlay' | 'midnight';
const timers: Record<TimerKey, ReturnType<typeof setInterval> | undefined> = {
  standard: undefined,
  extra: undefined,
  overlay: undefined,
  midnight: undefined,
};

// --- Initial values ---

const createInitialCountdown = (): CountdownStore => ({ timeLeft: 10, name: 'Fajr' });

// --- Atoms ---

export const standardCountdownAtom = atom<CountdownStore>(createInitialCountdown());
export const extraCountdownAtom = atom<CountdownStore>(createInitialCountdown());
export const overlayCountdownAtom = atom<CountdownStore>(createInitialCountdown());

// Clears the interval timer for the specified timer key
const clearTimer = (timerKey: TimerKey) => {
  if (!timers[timerKey]) return;

  clearInterval(timers[timerKey]);
  delete timers[timerKey];
};

// Starts a countdown timer for a prayer schedule
const startTimerSchedule = (type: ScheduleType, timeLeft: number, name: string) => {
  const isStandard = type === ScheduleType.Standard;
  const timerKey = isStandard ? 'standard' : ('extra' as TimerKey);
  const countdownAtom = isStandard ? standardCountdownAtom : extraCountdownAtom;

  // 2. Clear existing timer and set initial state
  clearTimer(timerKey);
  store.set(countdownAtom, { timeLeft, name });

  // 3. Start countdown interval
  timers[timerKey] = setInterval(() => {
    const currentTime = store.get(countdownAtom).timeLeft - 1;

    if (currentTime <= 0) {
      clearTimer(timerKey);
      incrementNextIndex(type);

      const { nextIndex } = getSchedule(type);
      // 4. Handle midnight transition or update next prayer
      if (nextIndex === 0) return startTimerMidnight();
      return updateTimerSchedule(type);
    }

    // 5. Update countdown atom
    store.set(countdownAtom, { timeLeft: currentTime, name });
  }, 1000);
};

// Starts the overlay countdown timer for selected prayer
// Updates the overlay atom and clears timer when countdown reaches zero
const startTimerOverlay = (timeLeft: number, name: string) => {
  clearTimer('overlay');

  store.set(overlayCountdownAtom, { timeLeft, name });

  timers['overlay'] = setInterval(() => {
    const currentTime = store.get(overlayCountdownAtom).timeLeft - 1;
    if (currentTime <= 0) return clearTimer('overlay');

    store.set(overlayCountdownAtom, { timeLeft: currentTime, name });
  }, 1000);
};

// Starts the midnight transition timer
// Checks for date changes to trigger sync
const startTimerMidnight = () => {
  clearTimer('midnight');

  const savedDate = store.get(dateAtom);

  timers['midnight'] = setInterval(() => {
    const currentDate = TimeUtils.formatDateShort(TimeUtils.createLondonDate());

    if (currentDate !== savedDate) sync();
  }, 1000);
};

const updateTimerSchedule = (type: ScheduleType) => {
  const schedule = getSchedule(type);

  const prayer = schedule.today[schedule.nextIndex];
  const { timeLeft, name } = TimeUtils.calculateCountdown(prayer);

  startTimerSchedule(type, timeLeft, name);
};

// --- Public API ---

// Initializes all countdown timers - standard, extra, overlay, midnight
// Called during midnight transition to start new day countdowns
export const startCountdowns = () => {
  const standardSchedule = getSchedule(ScheduleType.Standard);
  const extraSchedule = getSchedule(ScheduleType.Extra);

  const isStandardFinished = TimeUtils.isLastPrayerPassed(standardSchedule);
  const isExtraFinished = TimeUtils.isLastPrayerPassed(extraSchedule);

  if (!isStandardFinished) updateTimerSchedule(ScheduleType.Standard);
  if (!isExtraFinished) updateTimerSchedule(ScheduleType.Extra);

  if (isStandardFinished && isExtraFinished) startTimerMidnight();

  updateTimerOverlay();
};

// Updates the overlay timer based on selected prayer
// Calculates countdown for the selected prayer and starts timer
export const updateTimerOverlay = () => {
  const overlay = store.get(overlayAtom);

  const prayer = getSchedule(overlay.scheduleType).today[overlay.selectedPrayerIndex];
  const { timeLeft, name } = TimeUtils.calculateCountdown(prayer);

  startTimerOverlay(timeLeft, name);
};
