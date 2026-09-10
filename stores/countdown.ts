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
};

// --- Initial values ---

const createInitialCountdown = (): CountdownStore => ({ timeLeft: 10, name: 'Fajr' });

// --- Atoms ---

/** Countdown state for Standard schedule (Fajr, Sunrise, Dhuhr, Asr, Magrib, Isha) */
export const standardCountdownAtom = atom<CountdownStore>(createInitialCountdown());

/** Countdown state for Extra schedule (Midnight, Last Third, Suha, Duha, Istijaba) */
export const extraCountdownAtom = atom<CountdownStore>(createInitialCountdown());

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

// --- Bar selectors (#10: progress at 1/s cadence + exact warning flip) ---

const getPrevPrayerAtom = (type: ScheduleType) =>
  type === ScheduleType.Standard ? standardPrevPrayerAtom : extraPrevPrayerAtom;

const getNextPrayerAtom = (type: ScheduleType) =>
  type === ScheduleType.Standard ? standardNextPrayerAtom : extraNextPrayerAtom;

/**
 * Elapsed progress percentage, raw at second resolution. Depends on the
 * countdown atom purely for the 1/s recompute cadence — the value derives
 * from the schedule's prev/next boundaries and the wall clock. The bar
 * re-issues its width animation on every change, which is also the resume
 * self-heal: a write dropped while the host was suspended is replaced by
 * the next tick's, so a stale bar can never outlive one second.
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

    return (elapsedMs / totalMs) * 100;
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
 * Sequence-based countdown using prayer-centric model
 *
 * Boundary detection always runs against the true next prayer via
 * getNextPrayer(type); the atom write is display-aware (ADR-014 countdown
 * merge): while the overlay is open on this schedule the page countdown atom
 * carries the SELECTED prayer's countdown, otherwise the next prayer's.
 * Calculates countdowns from datetime - Date.now() (true UTC instants: the
 * offset cancels in a difference, so no timezone conversion per tick).
 * Calls refreshSequence() when prayer passes
 */
const startSequenceCountdown = (type: ScheduleType) => {
  const isStandard = type === ScheduleType.Standard;
  const countdownKey = isStandard ? CountdownKey.Standard : CountdownKey.Extra;
  const which = isStandard ? 'std' : 'extra';

  const tick = () => {
    const upcoming = getNextPrayer(type);
    if (!upcoming) return;

    const nowMs = Date.now();
    const overlay = store.get(overlayAtom);

    if (nowMs >= upcoming.datetime.getTime()) {
      clearCountdown(countdownKey);

      // A suspended host crosses the boundary without ever running the T-3s
      // close tick, so the overlay owes its close here instead
      if (overlay.isOn && overlay.scheduleType === type) {
        store.set(overlayAtom, { ...overlay, isOn: false });
      }

      // Refresh sequence to advance to next prayer
      const transitionStart = Date.now();
      refreshSequence(type);
      logger.debug('TICK: transition', { which, transitionMs: Date.now() - transitionStart });

      // Restart countdown with new next prayer
      return startSequenceCountdown(type);
    }

    // Pre-boundary lock: close the overlay as it enters the final 3-second
    // window so it never straddles the boundary
    const overlayMsLeft = upcoming.datetime.getTime() - nowMs;
    if (overlay.isOn && overlay.scheduleType === type && overlayMsLeft <= 3000) {
      store.set(overlayAtom, { ...overlay, isOn: false });
    }

    writeDisplayCountdown(type);
  };

  // Initial write before the first aligned tick — display-aware (ceil: never
  // displays 0s)
  writeDisplayCountdown(type);

  startWallClockTicker(countdownKey, tick);
};

/**
 * Resolves the prayer the overlay display currently targets: the selected
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
 * Writes the schedule's page countdown atom with what its page must display
 * right now: the overlay's selected target while the overlay is open on this
 * schedule, the sequence's next prayer otherwise (ADR-014 countdown merge —
 * the overlay target rides its schedule's sequence ticker; no separate
 * overlay countdown atom or timer exists).
 *
 * Called every wall second by the tick, and instantly on overlay open,
 * selection change and close (stores/overlay.ts) so the display never waits
 * for the next tick. A passed display target holds at 1s via
 * getSecondsRemaining's clamp (the display contract never shows 0s) until
 * the boundary advance or a new selection retargets it; a missing overlay
 * target (stale index mid-roll) falls back to the next prayer.
 */
const writeDisplayCountdown = (type: ScheduleType) => {
  const upcoming = getNextPrayer(type);
  if (!upcoming) return;

  const countdownAtom = getCountdownAtom(type);

  const overlay = store.get(overlayAtom);
  const overlayOwnsPage = overlay.isOn && overlay.scheduleType === type;

  const selected = overlayOwnsPage ? getOverlayTarget() : null;
  const target = selected ?? upcoming;

  const timeLeft = TimeUtils.getSecondsRemaining(target.datetime);
  store.set(countdownAtom, { timeLeft, name: target.english });
};

/**
 * Initializes all countdowns for the app
 *
 * Starts the sequence tickers for Standard and Extra schedules — the only two
 * countdown timers in the app (ADR-014 countdown merge: the open overlay's
 * selected target is written into its schedule's page countdown atom by that
 * schedule's ticker). Called during app initialization after prayer sequences
 * are loaded, and again on every foreground-return sync. Tickers are keyed:
 * each start replaces any previous one, so repeated initialization never
 * stacks intervals.
 */
const startCountdowns = () => {
  startSequenceCountdown(ScheduleType.Standard);
  startSequenceCountdown(ScheduleType.Extra);
};

export { startCountdowns, writeDisplayCountdown };
