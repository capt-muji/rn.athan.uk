import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import * as TimeUtils from '@/shared/time';
import { CountdownStore, ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/overlay';
import { getSchedule, incrementNextIndex } from '@/stores/schedule';

const store = getDefaultStore();

// Convert constants to mutable variables
let standardCleanup: (() => void) | null = null;
let extraCleanup: (() => void) | null = null;
const overlayCleanup: (() => void) | null = null;

// Export the cleanup variables
export { standardCleanup, extraCleanup, overlayCleanup };

// --- Atoms ---

const createCountdownAtom = () =>
  atom<CountdownStore>({
    timeLeft: 10,
    name: 'Fajr',
  });

export const standardCountdownAtom = createCountdownAtom();
export const extraCountdownAtom = createCountdownAtom();
export const overlayCountdownAtom = createCountdownAtom();

// --- Actions ---

const updateCountdown = (type: ScheduleType) => {
  const isStandard = type === ScheduleType.Standard;
  const countdownAtom = isStandard ? standardCountdownAtom : extraCountdownAtom;

  const schedule = getSchedule(type);
  const prayer = schedule.today[schedule.nextIndex];
  const countdown = TimeUtils.calculateCountdown(prayer);

  // Clear any existing countdown
  if (isStandard && standardCleanup) {
    standardCleanup();
    standardCleanup = null;
  }
  if (!isStandard && extraCleanup) {
    extraCleanup();
    extraCleanup = null;
  }

  // Start new countdown
  TimeUtils.countdown(countdown.timeLeft, {
    onTick: (secondsLeft) => {
      store.set(countdownAtom, { timeLeft: secondsLeft, name: countdown.name });
    },
    onFinish: () => {
      incrementNextIndex(type);
      updateCountdown(type);
    },
  });
};

export const updateOverlayCountdown = (type: ScheduleType, selectedIndex: number) => {
  const schedule = getSchedule(type);
  const prayer = schedule.today[selectedIndex];

  const countdown = TimeUtils.calculateCountdown(prayer);
  store.set(overlayCountdownAtom, { timeLeft: countdown.timeLeft, name: countdown.name });
};

export const startCountdowns = () => {
  updateCountdown(ScheduleType.Standard);
  updateCountdown(ScheduleType.Extra);

  const overlay = store.get(overlayAtom);
  if (overlay.isOn) updateOverlayCountdown(overlay.scheduleType, overlay.selectedPrayerIndex);
};
