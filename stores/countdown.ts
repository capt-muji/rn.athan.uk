/**
 * Countdown store - manages countdown intervals for prayer times
 * Uses the prayer-centric sequence model
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { type Atom, atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import { COUNTDOWN_BAR } from '@/shared/constants';
import logger from '@/shared/logger';
import * as TimeUtils from '@/shared/time';
import { CountdownKey, type CountdownStore, type Prayer, ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/atoms/overlay';
import {
  extraDisplayDateAtom,
  extraNextPrayerAtom,
  extraPrevPrayerAtom,
  getNextPrayer,
  getSequenceAtom,
  refreshSequence,
  standardDisplayDateAtom,
  standardNextPrayerAtom,
  standardPrevPrayerAtom,
} from '@/stores/schedule';
import { showSecondsAtom } from '@/stores/ui';

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

/** Countdown state for Extra schedule (Midnight, Last Third, Suha, Duha, Istijaba) */
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

// --- Render-granular derived selectors (#10) ---

/**
 * Builds a name selector over a countdown source: emits only when the NAME
 * string actually changes (per-prayer, not per-second).
 */
const makeCountdownNameAtom = (source: Atom<CountdownStore>) => atom((get) => get(source).name);

/**
 * Builds a display-string selector over a countdown source: emits only when
 * the FORMATTED string changes — per second with the seconds preference (or
 * the final-10-minutes window formatTime enforces), per minute otherwise.
 * The raw atoms keep ticking 1/s for boundary correctness; consumers of these
 * never re-render on a second that doesn't change what they draw.
 */
const makeCountdownDisplayAtom = (source: Atom<CountdownStore>) =>
  atom((get) => formatTimeSecondsAware(get(source).timeLeft, get(showSecondsAtom)));

const formatTimeSecondsAware = (seconds: number, showSeconds: boolean) => TimeUtils.formatTime(seconds, !showSeconds);

/** Next-prayer name as displayed by the Standard hero countdown */
export const standardCountdownNameAtom = makeCountdownNameAtom(standardCountdownAtom);
/** Standard hero countdown display string (render-granular) */
export const standardCountdownDisplayAtom = makeCountdownDisplayAtom(standardCountdownAtom);
/** Next-prayer name as displayed by the Extra hero countdown */
export const extraCountdownNameAtom = makeCountdownNameAtom(extraCountdownAtom);
/** Extra hero countdown display string (render-granular) */
export const extraCountdownDisplayAtom = makeCountdownDisplayAtom(extraCountdownAtom);
/** Selected-prayer name as displayed by the overlay countdown */
export const overlayCountdownNameAtom = makeCountdownNameAtom(overlayCountdownAtom);
/** Overlay countdown display string (render-granular) */
export const overlayCountdownDisplayAtom = makeCountdownDisplayAtom(overlayCountdownAtom);

/**
 * Gets the name selector for a schedule type
 *
 * @param type - Schedule type (Standard or Extra)
 * @returns Name atom for the specified schedule
 */
export const getCountdownNameAtom = (type: ScheduleType) =>
  type === ScheduleType.Standard ? standardCountdownNameAtom : extraCountdownNameAtom;

/**
 * Gets the display-string selector for a schedule type
 *
 * @param type - Schedule type (Standard or Extra)
 * @returns Display atom for the specified schedule
 */
export const getCountdownDisplayAtom = (type: ScheduleType) =>
  type === ScheduleType.Standard ? standardCountdownDisplayAtom : extraCountdownDisplayAtom;

// --- Bar selectors (#10: quantized progress + exact warning flip) ---

/** One bar pixel of progress: sub-pixel per-second creep is invisible, so it rounds away */
const BAR_STEP_PCT = 100 / COUNTDOWN_BAR.WIDTH;

const getPrevPrayerAtom = (type: ScheduleType) =>
  type === ScheduleType.Standard ? standardPrevPrayerAtom : extraPrevPrayerAtom;

const getNextPrayerAtom = (type: ScheduleType) =>
  type === ScheduleType.Standard ? standardNextPrayerAtom : extraNextPrayerAtom;

/**
 * Elapsed progress percentage, quantized to bar-pixel steps. Depends on the
 * countdown atom purely for the 1/s recompute cadence — the value derives
 * from the schedule's prev/next boundaries and the wall clock.
 */
const makeBarProgressAtom = (type: ScheduleType) =>
  atom((get) => {
    get(getCountdownAtom(type));
    const prev = get(getPrevPrayerAtom(type));
    const next = get(getNextPrayerAtom(type));
    if (!prev?.datetime || !next?.datetime) return 0;

    const elapsedMs = Date.now() - prev.datetime.getTime();
    const totalMs = next.datetime.getTime() - prev.datetime.getTime();
    if (totalMs <= 0) return 0;

    const rawPct = (elapsedMs / totalMs) * 100;
    return Math.round(rawPct / BAR_STEP_PCT) * BAR_STEP_PCT;
  });

/**
 * Exact warning threshold flip (second resolution — not quantized, so the
 * color transition fires at the true threshold crossing).
 */
const makeBarWarningAtom = (type: ScheduleType) =>
  atom((get) => {
    get(getCountdownAtom(type));
    const prev = get(getPrevPrayerAtom(type));
    const next = get(getNextPrayerAtom(type));
    if (!prev?.datetime || !next?.datetime) return false;

    const elapsedMs = Date.now() - prev.datetime.getTime();
    const totalMs = next.datetime.getTime() - prev.datetime.getTime();
    if (totalMs <= 0) return false;

    const remainingPct = 100 - (elapsedMs / totalMs) * 100;
    return remainingPct <= COUNTDOWN_BAR.WARNING_THRESHOLD;
  });

const standardBarProgressAtom = makeBarProgressAtom(ScheduleType.Standard);
const extraBarProgressAtom = makeBarProgressAtom(ScheduleType.Extra);
const standardBarWarningAtom = makeBarWarningAtom(ScheduleType.Standard);
const extraBarWarningAtom = makeBarWarningAtom(ScheduleType.Extra);

/**
 * Gets the quantized bar-progress selector for a schedule type
 *
 * @param type - Schedule type (Standard or Extra)
 * @returns Bar progress atom for the specified schedule
 */
export const getBarProgressAtom = (type: ScheduleType) =>
  type === ScheduleType.Standard ? standardBarProgressAtom : extraBarProgressAtom;

/**
 * Gets the exact warning-flip selector for a schedule type
 *
 * @param type - Schedule type (Standard or Extra)
 * @returns Warning atom for the specified schedule
 */
export const getBarWarningAtom = (type: ScheduleType) =>
  type === ScheduleType.Standard ? standardBarWarningAtom : extraBarWarningAtom;

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
 * load). Scheduling from the wall clock self-corrects — a late tick is followed by a
 * shorter delay, keeping digits aligned with the system clock (F.7).
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
 * Whether the overlay's selected index (within the passing prayer's display
 * day) is the prayer that is passing right now — the condition for the
 * selection-follows-next-prayer advance (ADR-014).
 */
const isSelectedIndex = (type: ScheduleType, selectedIndex: number, passingPrayer: Prayer): boolean => {
  const sequenceAtom = getSequenceAtom(type);
  const sequence = store.get(sequenceAtom);
  if (!sequence) return false;

  const todayPrayers = sequence.prayers.filter((p) => p.belongsToDate === passingPrayer.belongsToDate);
  const selected = todayPrayers[selectedIndex];

  return (
    !!selected &&
    selected.english === passingPrayer.english &&
    selected.datetime.getTime() === passingPrayer.datetime.getTime()
  );
};

/**
 * Advances the open overlay's selection to the schedule's new next prayer and
 * retargets the overlay countdown at it (ADR-014 boundary semantic: the veil's
 * row hole jumps to the next row, which rises bright, and the countdown
 * retargets ≡ the sequence countdown).
 */
const advanceOverlaySelectionToNextPrayer = (type: ScheduleType) => {
  const nextPrayer = getNextPrayer(type);
  if (!nextPrayer) return;

  const sequenceAtom = getSequenceAtom(type);
  const sequence = store.get(sequenceAtom);
  if (!sequence) return;

  const todayPrayers = sequence.prayers.filter((p) => p.belongsToDate === nextPrayer.belongsToDate);
  const nextIndex = todayPrayers.findIndex(
    (p) => p.english === nextPrayer.english && p.datetime.getTime() === nextPrayer.datetime.getTime()
  );
  if (nextIndex < 0) return;

  const overlay = store.get(overlayAtom);
  store.set(overlayAtom, { ...overlay, selectedPrayerIndex: nextIndex });
  startCountdownOverlay();
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

      // Overlay rides the cascade (ADR-014): when the open overlay highlights
      // the prayer that just passed, its selection follows to the new next
      // prayer — no auto-close, no open-refusal (the 2s lock is gone)
      const overlay = store.get(overlayAtom);
      const overlayFollowsBoundary =
        overlay.isOn && overlay.scheduleType === type && isSelectedIndex(type, overlay.selectedPrayerIndex, upcoming);

      // Refresh sequence to advance to next prayer
      const transitionStart = Date.now();
      refreshSequence(type);
      if (overlayFollowsBoundary) advanceOverlaySelectionToNextPrayer(type);
      logger.debug('TICK: transition', { which, transitionMs: Date.now() - transitionStart });

      // Restart countdown with new next prayer
      return startSequenceCountdown(type);
    }

    const secondsLeft = TimeUtils.getSecondsRemaining(upcoming.datetime);

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
 * Resolves the prayer the overlay countdown currently targets: the selected
 * prayer within its schedule's display day, with tomorrow's-occurrence
 * fallback when it has passed (matches usePrayer.ts overlay semantics).
 */
const getOverlayTarget = (): Prayer | null => {
  const overlay = store.get(overlayAtom);
  const isStandard = overlay.scheduleType === ScheduleType.Standard;

  const sequenceAtom = getSequenceAtom(overlay.scheduleType);
  const displayDateAtom = isStandard ? standardDisplayDateAtom : extraDisplayDateAtom;

  const sequence = store.get(sequenceAtom);
  const displayDate = store.get(displayDateAtom);

  // Not ready (or schedule refreshed mid-selection): stopped placeholder
  if (!sequence || !displayDate) return null;

  const todayPrayers = sequence.prayers.filter((p) => p.belongsToDate === displayDate);
  const prayer = todayPrayers[overlay.selectedPrayerIndex];
  if (!prayer) return null;

  const now = TimeUtils.createLondonDate();
  const isPassed = prayer.datetime < now;

  // 3-day buffer contains all prayers sorted, so find next matching prayer name
  // Fallback to original prayer if no future occurrence exists (e.g., weekly prayers like Istijaba)
  const nextOccurrence = isPassed
    ? sequence.prayers.find((p) => p.english === prayer.english && p.datetime > prayer.datetime)
    : null;

  return nextOccurrence ?? prayer;
};

/**
 * Starts the overlay countdown for the selected prayer
 * Uses sequence-based approach to get prayer by index
 *
 * The tick re-derives its target every second instead of closing over it:
 * the selection can advance at a boundary (selection-follows-next-prayer) and
 * a stale tick firing after the retarget must not freeze the fresh countdown.
 */
const startCountdownOverlay = () => {
  const target = getOverlayTarget();
  if (!target) {
    return resetOverlayCountdown();
  }

  // Calculate countdown from prayer datetime (ceil: never displays 0s)
  const timeLeft = TimeUtils.getSecondsRemaining(target.datetime);
  const name = target.english;

  store.set(overlayCountdownAtom, { timeLeft, name });

  // Wall-second-aligned ticks recomputing from the clock (same model as the
  // sequence tickers): digits flip with the system clock and never freeze
  startWallClockTicker(CountdownKey.Overlay, () => {
    const currentTarget = getOverlayTarget();
    if (!currentTarget) {
      return resetOverlayCountdown();
    }

    const nowMs = Date.now();
    if (nowMs >= currentTarget.datetime.getTime()) {
      clearCountdown(CountdownKey.Overlay);
      // Hold at 1s: the display contract never shows 0s
      store.set(overlayCountdownAtom, { timeLeft: 1, name: currentTarget.english });
      return;
    }

    const secondsLeft = TimeUtils.getSecondsRemaining(currentTarget.datetime);
    store.set(overlayCountdownAtom, { timeLeft: secondsLeft, name: currentTarget.english });
  });
};

/**
 * Initializes all countdowns for the app
 *
 * Starts the sequence tickers for Standard and Extra schedules; the overlay
 * countdown is ON-DEMAND (#4): reset to a placeholder here, started on overlay
 * open, restarted on selection change and boundary advance, reset on close.
 * Called during app initialization after prayer sequences are loaded, and again
 * on every foreground-return sync. Tickers are keyed: each start replaces any
 * previous one, so repeated initialization never stacks intervals.
 */
const startCountdowns = () => {
  startSequenceCountdown(ScheduleType.Standard);
  startSequenceCountdown(ScheduleType.Extra);

  resetOverlayCountdown();
};

export { resetOverlayCountdown, startCountdownOverlay, startCountdowns };
