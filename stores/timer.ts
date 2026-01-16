import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import * as TimeUtils from '@/shared/time';
import { TimerStore, ScheduleType, TimerKey } from '@/shared/types';
import { overlayAtom } from '@/stores/overlay';
import { getSchedule, incrementNextIndex, advanceScheduleToTomorrow } from '@/stores/schedule';
import { standardDateAtom, sync } from '@/stores/sync';

const store = getDefaultStore();

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

// --- Actions ---

// Clears the interval timer for the specified timer key
const clearTimer = (timerKey: TimerKey) => {
  if (!timers[timerKey]) return;

  clearInterval(timers[timerKey]);
  delete timers[timerKey];
};

// Starts a countdown timer for a prayer schedule
const startTimerSchedule = (type: ScheduleType) => {
  const schedule = getSchedule(type);
  const { timeLeft, name } = TimeUtils.calculateCountdown(schedule, schedule.nextIndex);

  const isStandard = type === ScheduleType.Standard;
  const timerKey = isStandard ? 'standard' : 'extra';
  const timerAtom = isStandard ? standardTimerAtom : extraTimerAtom;

  // Clear existing timer and set initial state
  clearTimer(timerKey);
  store.set(timerAtom, { timeLeft, name });

  // 3. Start countdown interval
  timers[timerKey] = setInterval(async () => {
    const currentTime = store.get(timerAtom).timeLeft - 1;

    if (currentTime <= 0) {
      clearTimer(timerKey);
      incrementNextIndex(type);

      const { nextIndex } = getSchedule(type);
      // 4. Handle prayer-based day transition or update next prayer
      if (nextIndex === 0) {
        await advanceScheduleToTomorrow(type);
      }
      return startTimerSchedule(type);
    }

    // 5. Auto-close overlay when timer is 2 seconds or less
    // Only if overlay is open and showing the same schedule type (standard/extra)
    const overlay = store.get(overlayAtom);
    if (overlay.isOn && overlay.scheduleType === type && currentTime <= 2) {
      store.set(overlayAtom, { ...overlay, isOn: false });
    }

    // 6. Update countdown atom
    store.set(timerAtom, { timeLeft: currentTime, name });
  }, 1000);
};

// Starts the overlay countdown timer for selected prayer
const startTimerOverlay = () => {
  const overlay = store.get(overlayAtom);
  const schedule = getSchedule(overlay.scheduleType);
  const { timeLeft, name } = TimeUtils.calculateCountdown(schedule, overlay.selectedPrayerIndex);

  clearTimer('overlay');
  store.set(overlayTimerAtom, { timeLeft, name });

  timers.overlay = setInterval(() => {
    const currentTime = store.get(overlayTimerAtom).timeLeft - 1;
    if (currentTime <= 0) return clearTimer('overlay');

    store.set(overlayTimerAtom, { timeLeft: currentTime, name });
  }, 1000);
};

// Starts the midnight transition timer
// Checks for date changes to trigger API data sync (freshness only, not UI transition)
const startTimerMidnight = () => {
  clearTimer('midnight');

  const savedDate = store.get(standardDateAtom);

  timers.midnight = setInterval(() => {
    const currentDate = TimeUtils.formatDateShort(TimeUtils.createLondonDate());

    if (currentDate !== savedDate) {
      clearTimer('midnight');
      sync();
    }
  }, 1000);
};

// Initializes all countdown timers - standard, extra, overlay, midnight
// Always starts all timers for continuous countdown display
const startTimers = () => {
  // Always start both schedule timers - they show tomorrow's countdown if today's finished
  startTimerSchedule(ScheduleType.Standard);
  startTimerSchedule(ScheduleType.Extra);

  // Start midnight timer for API data freshness
  startTimerMidnight();

  startTimerOverlay();
};

export { startTimers, startTimerOverlay };
