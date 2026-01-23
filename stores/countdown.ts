/**
 * Countdown store - manages countdown intervals for prayer times
 * Uses the prayer-centric sequence model
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import * as TimeUtils from '@/shared/time';
import { CountdownStore, ScheduleType, CountdownKey } from '@/shared/types';
import { overlayAtom } from '@/stores/atoms/overlay';
import {
  refreshSequence,
  getNextPrayer,
  getSequenceAtom,
  standardDisplayDateAtom,
  extraDisplayDateAtom,
} from '@/stores/schedule';

const store = getDefaultStore();

const countdowns: Record<CountdownKey, ReturnType<typeof setInterval> | undefined> = {
  [CountdownKey.Standard]: undefined,
  [CountdownKey.Extra]: undefined,
  [CountdownKey.Overlay]: undefined,
};

// --- Initial values ---

const createInitialCountdown = (): CountdownStore => ({ timeLeft: 10, name: 'Fajr' });

// --- Atoms ---

/** Countdown state for Standard schedule (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha) */
export const standardCountdownAtom = atom<CountdownStore>(createInitialCountdown());

/** Countdown state for Extra schedule (Midnight, Last Third, Suhoor, Duha, Istijaba) */
export const extraCountdownAtom = atom<CountdownStore>(createInitialCountdown());

/** Countdown state for overlay display (selected prayer) */
export const overlayCountdownAtom = atom<CountdownStore>(createInitialCountdown());

// --- Actions ---

// Clears the interval for the specified countdown key
const clearCountdown = (countdownKey: CountdownKey) => {
  if (!countdowns[countdownKey]) return;

  clearInterval(countdowns[countdownKey]!);
  countdowns[countdownKey] = undefined;
};

/**
 * Sequence-based countdown using prayer-centric model
 *
 * Uses getNextPrayer(type) to get countdown target
 * Calculates countdown from nextPrayer.datetime - now
 * Calls refreshSequence() when prayer passes
 */
const startSequenceCountdown = (type: ScheduleType) => {
  const nextPrayer = getNextPrayer(type)!;
  const now = TimeUtils.createLondonDate();
  const timeLeft = TimeUtils.getSecondsBetween(now, nextPrayer.datetime);
  const name = nextPrayer.english;

  const isStandard = type === ScheduleType.Standard;
  const countdownKey = isStandard ? CountdownKey.Standard : CountdownKey.Extra;
  const countdownAtom = isStandard ? standardCountdownAtom : extraCountdownAtom;

  // Clear existing countdown and set initial state
  clearCountdown(countdownKey);
  store.set(countdownAtom, { timeLeft, name });

  // Start countdown interval
  countdowns[countdownKey] = setInterval(() => {
    const currentTime = store.get(countdownAtom).timeLeft - 1;

    if (currentTime <= 0) {
      clearCountdown(countdownKey);

      // Refresh sequence to advance to next prayer
      refreshSequence(type);

      // Restart countdown with new next prayer
      return startSequenceCountdown(type);
    }

    // Auto-close overlay when countdown is 2 seconds or less
    const overlay = store.get(overlayAtom);
    if (overlay.isOn && overlay.scheduleType === type && currentTime <= 2) {
      store.set(overlayAtom, { ...overlay, isOn: false });
    }

    // Update countdown atom
    store.set(countdownAtom, { timeLeft: currentTime, name });
  }, 1000);
};

/**
 * Starts the overlay countdown for selected prayer
 * Uses sequence-based approach to get prayer by index
 *
 * Includes tomorrow prayer fallback for passed prayers (matches usePrayer.ts logic)
 */
const startCountdownOverlay = () => {
  const overlay = store.get(overlayAtom);
  const isStandard = overlay.scheduleType === ScheduleType.Standard;

  // Get sequence and displayDate for selected schedule type
  const sequenceAtom = getSequenceAtom(overlay.scheduleType);
  const displayDateAtom = isStandard ? standardDisplayDateAtom : extraDisplayDateAtom;

  const sequence = store.get(sequenceAtom);
  const displayDate = store.get(displayDateAtom);

  if (!sequence || !displayDate) {
    clearCountdown(CountdownKey.Overlay);
    store.set(overlayCountdownAtom, { timeLeft: 0, name: 'Prayer' });
    return;
  }

  const now = TimeUtils.createLondonDate();

  // Get today's prayers and selected prayer by index
  const todayPrayers = sequence.prayers.filter((p) => p.belongsToDate === displayDate);
  const prayer = todayPrayers[overlay.selectedPrayerIndex];

  // If prayer passed, show next occurrence (tomorrow's prayer)
  // 3-day buffer contains all prayers sorted, so find next matching prayer name
  // Fallback to original prayer if no future occurrence exists (e.g., weekly prayers like Istijaba)
  const isPassed = prayer.datetime < now;
  const nextOccurrence = isPassed
    ? sequence.prayers.find((p) => p.english === prayer.english && p.datetime > prayer.datetime)
    : null;
  const selectedPrayer = nextOccurrence ?? prayer;

  // Calculate countdown from prayer datetime
  const timeLeft = TimeUtils.getSecondsBetween(now, selectedPrayer.datetime);
  const name = selectedPrayer.english;

  clearCountdown(CountdownKey.Overlay);
  store.set(overlayCountdownAtom, { timeLeft, name });

  countdowns[CountdownKey.Overlay] = setInterval(() => {
    const currentTime = store.get(overlayCountdownAtom).timeLeft - 1;
    if (currentTime <= 0) return clearCountdown(CountdownKey.Overlay);

    store.set(overlayCountdownAtom, { timeLeft: currentTime, name });
  }, 1000);
};

/**
 * Initializes all countdowns for the app
 *
 * Starts countdown intervals for Standard schedule, Extra schedule, and overlay.
 * Called during app initialization after prayer sequences are loaded.
 * Each countdown ticks every second and refreshes the sequence when a prayer passes.
 */
const startCountdowns = () => {
  startSequenceCountdown(ScheduleType.Standard);
  startSequenceCountdown(ScheduleType.Extra);

  startCountdownOverlay();
};

export { startCountdowns, startCountdownOverlay };
