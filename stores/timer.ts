/**
 * Timer store - countdown timers for prayer times
 * Uses the prayer-centric sequence model
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

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
  [TimerKey.Standard]: undefined,
  [TimerKey.Extra]: undefined,
  [TimerKey.Overlay]: undefined,
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

  clearInterval(timers[timerKey]!);
  timers[timerKey] = undefined;
};

/**
 * Sequence-based timer using prayer-centric model
 *
 * Uses getNextPrayer(type) to get countdown target
 * Calculates countdown from nextPrayer.datetime - now
 * Calls refreshSequence() when prayer passes
 */
const startSequenceTimer = (type: ScheduleType) => {
  const nextPrayer = getNextPrayer(type)!;
  const now = TimeUtils.createLondonDate();
  const timeLeft = TimeUtils.getSecondsBetween(now, nextPrayer.datetime);
  const name = nextPrayer.english;

  const isStandard = type === ScheduleType.Standard;
  const timerKey = isStandard ? TimerKey.Standard : TimerKey.Extra;
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
    clearTimer(TimerKey.Overlay);
    store.set(overlayTimerAtom, { timeLeft: 0, name: 'Prayer' });
    return;
  }

  const now = TimeUtils.createLondonDate();

  // Get today's prayers and selected prayer by index
  const todayPrayers = sequence.prayers.filter((p) => p.belongsToDate === displayDate);
  const prayer = todayPrayers[overlay.selectedPrayerIndex];

  // If prayer passed, show next occurrence (tomorrow's prayer)
  // 3-day buffer contains all prayers sorted, so find next matching prayer name
  const isPassed = prayer.datetime < now;
  const selectedPrayer = isPassed
    ? sequence.prayers.find((p) => p.english === prayer.english && p.datetime > prayer.datetime)!
    : prayer;

  // Calculate countdown from prayer datetime
  const timeLeft = TimeUtils.getSecondsBetween(now, selectedPrayer.datetime);
  const name = selectedPrayer.english;

  clearTimer(TimerKey.Overlay);
  store.set(overlayTimerAtom, { timeLeft, name });

  timers[TimerKey.Overlay] = setInterval(() => {
    const currentTime = store.get(overlayTimerAtom).timeLeft - 1;
    if (currentTime <= 0) return clearTimer(TimerKey.Overlay);

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
