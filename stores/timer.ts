/**
 * Timer store - countdown timers for prayer times
 * Uses the prayer-centric sequence model
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { addDays } from 'date-fns';
import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import * as TimeUtils from '@/shared/time';
import { TimerStore, ScheduleType, TimerKey } from '@/shared/types';
import { overlayAtom } from '@/stores/atoms/overlay';
import {
  refreshSequence,
  getNextPrayer,
  getSequenceAtom,
  standardDisplayDateAtom,
  extraDisplayDateAtom,
} from '@/stores/schedule';

const store = getDefaultStore();

const timers: Record<TimerKey, ReturnType<typeof setInterval> | undefined> = {
  standard: undefined,
  extra: undefined,
  overlay: undefined,
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

/**
 * Sequence-based timer using prayer-centric model
 *
 * Uses getNextPrayer(type) to get countdown target
 * Calculates countdown from nextPrayer.datetime - now
 * Calls refreshSequence() when prayer passes
 */
const startSequenceTimer = (type: ScheduleType) => {
  const nextPrayer = getNextPrayer(type);

  // If no next prayer, sequence needs refresh
  if (!nextPrayer) {
    refreshSequence(type);
    // Retry after refresh
    const retryPrayer = getNextPrayer(type);
    if (!retryPrayer) return; // Still no prayer, exit gracefully
    return startSequenceTimer(type); // Restart with new data
  }

  const now = TimeUtils.createLondonDate();
  const timeLeft = TimeUtils.getSecondsBetween(now, nextPrayer.datetime);
  const name = nextPrayer.english;

  const isStandard = type === ScheduleType.Standard;
  const timerKey = isStandard ? 'standard' : 'extra';
  const timerAtom = isStandard ? standardTimerAtom : extraTimerAtom;

  // Clear existing timer and set initial state
  clearTimer(timerKey);
  store.set(timerAtom, { timeLeft, name });

  // Start countdown interval
  timers[timerKey] = setInterval(() => {
    const currentTime = store.get(timerAtom).timeLeft - 1;

    if (currentTime <= 0) {
      clearTimer(timerKey);

      // Refresh sequence to advance to next prayer
      refreshSequence(type);

      // Restart timer with new next prayer
      return startSequenceTimer(type);
    }

    // Auto-close overlay when timer is 2 seconds or less
    const overlay = store.get(overlayAtom);
    if (overlay.isOn && overlay.scheduleType === type && currentTime <= 2) {
      store.set(overlayAtom, { ...overlay, isOn: false });
    }

    // Update countdown atom
    store.set(timerAtom, { timeLeft: currentTime, name });
  }, 1000);
};

/**
 * Starts the overlay countdown timer for selected prayer
 * Uses sequence-based approach to get prayer by index
 *
 * Includes tomorrow prayer fallback for passed prayers (matches usePrayer.ts logic)
 */
const startTimerOverlay = () => {
  const overlay = store.get(overlayAtom);
  const isStandard = overlay.scheduleType === ScheduleType.Standard;

  // Get sequence and displayDate for selected schedule type
  const sequenceAtom = getSequenceAtom(overlay.scheduleType);
  const displayDateAtom = isStandard ? standardDisplayDateAtom : extraDisplayDateAtom;

  const sequence = store.get(sequenceAtom);
  const displayDate = store.get(displayDateAtom);

  if (!sequence || !displayDate) {
    clearTimer('overlay');
    store.set(overlayTimerAtom, { timeLeft: 0, name: 'Prayer' });
    return;
  }

  const now = TimeUtils.createLondonDate();

  // Get today's prayers and selected prayer by index
  // This matches hooks/usePrayer.ts:22-23
  const todayPrayers = sequence.prayers.filter((p) => p.belongsToDate === displayDate);
  let selectedPrayer = todayPrayers[overlay.selectedPrayerIndex];

  // Check if selected prayer has passed
  const isPassed = selectedPrayer ? selectedPrayer.datetime < now : false;

  // Tomorrow prayer fallback for passed prayers (similar intent to usePrayer.ts:46-55)
  // When a prayer is passed in overlay, show tomorrow's same prayer
  // Uses explicit tomorrow date calculation for robustness (handles DST, multi-day sequences)
  if (isPassed && selectedPrayer) {
    const tomorrow = addDays(new Date(displayDate), 1);
    const tomorrowDate = TimeUtils.formatDateShort(tomorrow);
    const tomorrowPrayers = sequence.prayers.filter((p) => p.belongsToDate === tomorrowDate);
    const tomorrowPrayer = tomorrowPrayers[overlay.selectedPrayerIndex];
    if (tomorrowPrayer) {
      selectedPrayer = tomorrowPrayer;
    }
  }

  // Calculate countdown from prayer datetime
  const timeLeft = selectedPrayer ? TimeUtils.getSecondsBetween(now, selectedPrayer.datetime) : 0;
  const name = selectedPrayer?.english ?? 'Prayer';

  clearTimer('overlay');
  store.set(overlayTimerAtom, { timeLeft, name });

  timers.overlay = setInterval(() => {
    const currentTime = store.get(overlayTimerAtom).timeLeft - 1;
    if (currentTime <= 0) return clearTimer('overlay');

    store.set(overlayTimerAtom, { timeLeft: currentTime, name });
  }, 1000);
};

/**
 * Initializes all countdown timers - standard, extra, overlay
 * Always starts all timers for continuous countdown display
 */
const startTimers = () => {
  startSequenceTimer(ScheduleType.Standard);
  startSequenceTimer(ScheduleType.Extra);

  startTimerOverlay();
};

export { startTimers, startTimerOverlay };
