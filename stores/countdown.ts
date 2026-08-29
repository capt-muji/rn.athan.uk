/**
 * Countdown store - manages countdown intervals for prayer times
 * Uses the prayer-centric sequence model
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import logger from '@/shared/logger';
import * as TimeUtils from '@/shared/time';
import { CountdownKey, type CountdownStore, ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/atoms/overlay';
import {
  extraDisplayDateAtom,
  getNextPrayer,
  getSequenceAtom,
  refreshSequence,
  standardDisplayDateAtom,
} from '@/stores/schedule';

const store = getDefaultStore();

const countdowns: Record<CountdownKey, ReturnType<typeof setTimeout> | undefined> = {
  [CountdownKey.Standard]: undefined,
  [CountdownKey.Extra]: undefined,
  [CountdownKey.Overlay]: undefined,
};

// --- Initial values ---

const createInitialCountdown = (): CountdownStore => ({ timeLeft: 10, name: 'Fajr' });

// --- Atoms ---

/** Countdown state for Standard schedule (Fajr, Sunrise, Dhuhr, Asr, Magrib, Isha) */
export const standardCountdownAtom = atom<CountdownStore>(createInitialCountdown());

/** Countdown state for Extra schedule (Midnight, Last Third, Suhoor, Duha, Istijaba) */
export const extraCountdownAtom = atom<CountdownStore>(createInitialCountdown());

/** Countdown state for overlay display (selected prayer) */
export const overlayCountdownAtom = atom<CountdownStore>(createInitialCountdown());

/**
 * Gets the countdown atom for a schedule type
 *
 * @param type - Schedule type (Standard or Extra)
 * @returns Countdown atom for the specified schedule
 */
export const getCountdownAtom = (type: ScheduleType) => {
  return type === ScheduleType.Standard ? standardCountdownAtom : extraCountdownAtom;
};

// --- Actions ---

// Cancels the pending tick for the specified countdown key (timeout and interval ids
// share one timer space, so clearTimeout covers both)
const clearCountdown = (countdownKey: CountdownKey) => {
  if (!countdowns[countdownKey]) return;

  clearTimeout(countdowns[countdownKey]!);
  countdowns[countdownKey] = undefined;
};

/**
 * Runs tick once per wall-clock second, flipping just after :000.
 *
 * Each next tick is a fresh setTimeout aimed at the next :000 boundary: a plain
 * setInterval re-arms from actual delivery time, so every millisecond of JS-thread
 * latency compounds and the phase drifts later forever (measured +17ms/s under
 * load). Scheduling from the wall clock self-corrects — a late tick is followed by
 * a shorter delay, keeping digits aligned with the system clock (F.7).
 */
const startWallClockTicker = (countdownKey: CountdownKey, tick: () => void) => {
  clearCountdown(countdownKey);

  const loop = () => {
    // The id that armed this invocation; still in countdowns until replaced
    const invocationId = countdowns[countdownKey];

    tick();

    // tick() may restart the ticker (sequence transition) or clear it (overlay
    // countdown ended) — only re-arm while this loop is still the owning ticker,
    // otherwise we would clobber the replacement's handle and leak this chain
    if (countdowns[countdownKey] !== invocationId) return;

    countdowns[countdownKey] = setTimeout(loop, TimeUtils.getWallSecondDelay());
  };

  countdowns[countdownKey] = setTimeout(loop, TimeUtils.getWallSecondDelay());
};

/**
 * Sequence-based countdown using prayer-centric model
 *
 * Uses getNextPrayer(type) to get countdown target
 * Calculates countdown from nextPrayer.datetime - Date.now() (true UTC instants:
 * the offset cancels in a difference, so no timezone conversion per tick)
 * Calls refreshSequence() when prayer passes
 */
const startSequenceCountdown = (type: ScheduleType) => {
  const nextPrayer = getNextPrayer(type)!;

  const isStandard = type === ScheduleType.Standard;
  const countdownKey = isStandard ? CountdownKey.Standard : CountdownKey.Extra;
  const countdownAtom = getCountdownAtom(type);
  const which = isStandard ? 'std' : 'extra';

  const tick = () => {
    const upcoming = getNextPrayer(type);
    if (!upcoming) return;

    const nowMs = Date.now();
    if (nowMs >= upcoming.datetime.getTime()) {
      clearCountdown(countdownKey);

      // Refresh sequence to advance to next prayer
      const transitionStart = Date.now();
      refreshSequence(type);
      logger.debug('TICK: transition', { which, transitionMs: Date.now() - transitionStart });

      // Restart countdown with new next prayer
      return startSequenceCountdown(type);
    }

    const secondsLeft = TimeUtils.getSecondsRemaining(upcoming.datetime);

    // Auto-close overlay when its countdown displays "2s" or less
    // (ceil rounding: 2s covers the final full 3-second window before the prayer)
    const overlay = store.get(overlayAtom);
    const overlayMsLeft = upcoming.datetime.getTime() - nowMs;
    if (overlay.isOn && overlay.scheduleType === type && overlayMsLeft <= 3000) {
      store.set(overlayAtom, { ...overlay, isOn: false });
    }

    logger.debug('TICK', { which, wall: nowMs, computed: secondsLeft });

    // Update countdown atom
    store.set(countdownAtom, { timeLeft: secondsLeft, name: upcoming.english });
  };

  // Initial state before the first aligned tick (ceil: never displays 0s)
  const timeLeft = TimeUtils.getSecondsRemaining(nextPrayer.datetime);
  store.set(countdownAtom, { timeLeft, name: nextPrayer.english });

  startWallClockTicker(countdownKey, tick);
};

/**
 * Resets the overlay countdown to a stopped state
 */
const resetOverlayCountdown = () => {
  clearCountdown(CountdownKey.Overlay);
  store.set(overlayCountdownAtom, { timeLeft: 0, name: 'Prayer' });
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

  // Early return if sequence or displayDate not ready
  if (!sequence || !displayDate) {
    return resetOverlayCountdown();
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

  // Calculate countdown from prayer datetime (ceil: never displays 0s)
  const timeLeft = TimeUtils.getSecondsRemaining(selectedPrayer.datetime);
  const name = selectedPrayer.english;

  store.set(overlayCountdownAtom, { timeLeft, name });

  // Wall-second-aligned ticks recomputing from the clock (same model as the
  // sequence tickers): digits flip with the system clock and never freeze
  startWallClockTicker(CountdownKey.Overlay, () => {
    const nowMs = Date.now();
    const secondsLeft = TimeUtils.getSecondsRemaining(selectedPrayer.datetime);

    logger.debug('TICK', { which: 'overlay', wall: nowMs, computed: secondsLeft });

    if (nowMs >= selectedPrayer.datetime.getTime()) {
      clearCountdown(CountdownKey.Overlay);
      // Hold at 1s: the display contract never shows 0s
      store.set(overlayCountdownAtom, { timeLeft: 1, name });
      return;
    }

    store.set(overlayCountdownAtom, { timeLeft: secondsLeft, name });
  });
};

/**
 * Initializes all countdowns for the app
 *
 * Starts countdown tickers for Standard schedule, Extra schedule, and overlay.
 * Called during app initialization after prayer sequences are loaded, and again
 * on every foreground-return sync. Tickers are keyed: each start replaces any
 * previous one, so repeated initialization never stacks intervals.
 */
const startCountdowns = () => {
  startSequenceCountdown(ScheduleType.Standard);
  startSequenceCountdown(ScheduleType.Extra);

  startCountdownOverlay();
};

export { startCountdownOverlay, startCountdowns };
