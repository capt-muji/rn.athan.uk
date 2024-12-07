import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import { overlayAtom } from './overlay';

import * as TimeUtils from '@/shared/time';
import { TimerStore, ScheduleType } from '@/shared/types';
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

const createInitialTimer = (): TimerStore => ({ timeLeft: 10, name: 'Fajr' });

// --- Atoms ---

export const standardTimerAtom = atom<TimerStore>(createInitialTimer());
export const extraTimerAtom = atom<TimerStore>(createInitialTimer());
export const overlayTimerAtom = atom<TimerStore>(createInitialTimer());

// Clears the interval timer for the specified timer key
const clearTimer = (timerKey: TimerKey) => {
  if (!timers[timerKey]) return;

  clearInterval(timers[timerKey]);
  delete timers[timerKey];
};

// Starts a countdown timer for a prayer schedule
const startTimerSchedule = (type: ScheduleType) => {
  const schedule = getSchedule(type);
  const prayer = schedule.today[schedule.nextIndex];
  const { timeLeft, name } = TimeUtils.calculateCountdown(prayer);

  const isStandard = type === ScheduleType.Standard;
  const timerKey = isStandard ? 'standard' : ('extra' as TimerKey);
  const timerAtom = isStandard ? standardTimerAtom : extraTimerAtom;

  // Clear existing timer and set initial state
  clearTimer(timerKey);
  store.set(timerAtom, { timeLeft, name });

  // 3. Start countdown interval
  timers[timerKey] = setInterval(() => {
    const currentTime = store.get(timerAtom).timeLeft - 1;

    if (currentTime <= 0) {
      clearTimer(timerKey);
      incrementNextIndex(type);

      const { nextIndex } = getSchedule(type);
      // 4. Handle midnight transition or update next prayer
      if (nextIndex === 0) return startTimerMidnight();
      return startTimerSchedule(type);
    }

    // 5. Update countdown atom
    store.set(timerAtom, { timeLeft: currentTime, name });
  }, 1000);
};

// Starts the overlay countdown timer for selected prayer
const startTimerOverlay = () => {
  const overlay = store.get(overlayAtom);
  const prayer = getSchedule(overlay.scheduleType).today[overlay.selectedPrayerIndex];
  const { timeLeft, name } = TimeUtils.calculateCountdown(prayer);

  clearTimer('overlay');
  store.set(overlayTimerAtom, { timeLeft, name });

  timers['overlay'] = setInterval(() => {
    const currentTime = store.get(overlayTimerAtom).timeLeft - 1;
    if (currentTime <= 0) return clearTimer('overlay');

    store.set(overlayTimerAtom, { timeLeft: currentTime, name });
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

// Initializes all countdown timers - standard, extra, overlay, midnight
// Called during midnight transition to start new day countdowns
const startTimers = () => {
  const standardSchedule = getSchedule(ScheduleType.Standard);
  const extraSchedule = getSchedule(ScheduleType.Extra);

  const isStandardFinished = TimeUtils.isLastPrayerPassed(standardSchedule);
  const isExtraFinished = TimeUtils.isLastPrayerPassed(extraSchedule);

  if (!isStandardFinished) startTimerSchedule(ScheduleType.Standard);
  if (!isExtraFinished) startTimerSchedule(ScheduleType.Extra);

  if (isStandardFinished && isExtraFinished) startTimerMidnight();

  startTimerOverlay();
};

export { startTimers, startTimerOverlay };
