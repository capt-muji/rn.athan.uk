/**
 * Overlay state management
 *
 * `isOn` changes only on the owner's tap, app close, and the 2 second schedule
 * boundary. `openOverlay` and `closeOverlay` are the only tap-path writers;
 * the boundary close in stores/countdown.ts writes the atoms directly to keep
 * that module free of a cycle. Every isOn write drops the fade-hold flag in
 * the same batch, and `markOverlayFadeSettled` raises it once the fade ends.
 */

import { getDefaultStore } from 'jotai/vanilla';

import { OVERLAY } from '@/shared/constants';
import { perfMark } from '@/shared/perf';
import type { ScheduleType } from '@/shared/types';
import { overlayAtom as overlayAtomImport, overlayFadeSettledAtom } from '@/stores/atoms/overlay';
import { armOverlayBoundary, clearOverlayBoundary, writeDisplayCountdown } from '@/stores/countdown';
import { getNextBoundary } from '@/stores/schedule';

// Re-export for backward compatibility
export { overlayAtom } from '@/stores/atoms/overlay';

// Local alias for internal use
const overlayAtom = overlayAtomImport;

const store = getDefaultStore();

// --- Actions ---

/**
 * Guards against the TRUE remaining milliseconds, not the displayed atom which
 * can be up to a second stale. The boundary is the next prayer, or 00:00 London
 * ending a list on screen that waits for its day to end, since the list changes day
 * at either. A schedule with nothing still to come has no boundary to straddle.
 */
const canOpenOverlay = (type: ScheduleType): boolean => {
  const boundary = getNextBoundary(type);
  if (!boundary) return true;

  return boundary.getTime() - Date.now() > OVERLAY.closeWindowMs;
};

const openOverlay = (type: ScheduleType, index: number) => {
  const overlay = store.get(overlayAtom);
  if (overlay.isOn) return;
  if (!canOpenOverlay(type)) return;

  perfMark('overlay_open_start', { scheduleType: type });
  armOverlayBoundary(type);
  // Same batch as the flip itself: every subtree the overlay holds displayable
  // re-renders once, and holds through the incoming fade
  store.set(overlayFadeSettledAtom, false);
  store.set(overlayAtom, { isOn: true, selectedPrayerIndex: index, scheduleType: type });

  // Flip the hero display on the toggle instant, not the next wall-second tick
  writeDisplayCountdown(type);
};

const closeOverlay = () => {
  const overlay = store.get(overlayAtom);
  if (!overlay.isOn) return;

  perfMark('overlay_close_start', { scheduleType: overlay.scheduleType });
  clearOverlayBoundary();
  store.set(overlayFadeSettledAtom, false);
  store.set(overlayAtom, { ...overlay, isOn: false });
  writeDisplayCountdown(overlay.scheduleType);
};

/**
 * Raises the fade-hold flag when the overlay family's fade has truly settled.
 * Called from the animation's completion (useDerivedProgress's onSettled), so
 * the one batched display flip lands after the fade ended — never inside it.
 * Deferred one Promise microtask because the completion can fire from a
 * render-phase animation mapper (a store write there would land mid-render),
 * and on the real queueMicrotask, which jest's fake timers stub and never
 * flush.
 */
const markOverlayFadeSettled = () => {
  void Promise.resolve().then(() => store.set(overlayFadeSettledAtom, true));
};

/**
 * No production caller opens through this: both pass `false`, or call
 * `closeOverlay` directly. Opening implicitly would reuse whatever
 * `selectedPrayerIndex` the atom still holds, which after a day rollover or a
 * schedule change is a stale row. Open with `openOverlay(type, index)` and an
 * index chosen at the call site.
 */
const toggleOverlay = (force?: boolean) => {
  const overlay = store.get(overlayAtom);
  const newState = force !== undefined ? force : !overlay.isOn;

  if (newState) openOverlay(overlay.scheduleType, overlay.selectedPrayerIndex);
  else closeOverlay();
};

export { closeOverlay, markOverlayFadeSettled, openOverlay, toggleOverlay };
