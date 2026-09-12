/**
 * Overlay state management
 *
 * `isOn` changes only on the owner's tap, app close, and the 2 second schedule
 * boundary. `openOverlay` and `closeOverlay` are the only writers.
 *
 * @see ai/features/overlay/spec.md
 * @see ai/adr/015/ADR.md
 */

import { getDefaultStore } from 'jotai/vanilla';

import { OVERLAY } from '@/shared/constants';
import { perfMark } from '@/shared/perf';
import type { ScheduleType } from '@/shared/types';
import { overlayAtom as overlayAtomImport } from '@/stores/atoms/overlay';
import { armOverlayBoundary, clearOverlayBoundary, writeDisplayCountdown } from '@/stores/countdown';
import { getNextPrayer } from '@/stores/schedule';

// Re-export for backward compatibility
export { overlayAtom } from '@/stores/atoms/overlay';

// Local alias for internal use
const overlayAtom = overlayAtomImport;

const store = getDefaultStore();

// --- Actions ---

/**
 * Guards against the TRUE remaining milliseconds, not the displayed atom which
 * can be up to a second stale. An all-passed schedule has no boundary to straddle.
 */
const canOpenOverlay = (type: ScheduleType): boolean => {
  const nextPrayer = getNextPrayer(type);
  if (!nextPrayer) return true;

  return nextPrayer.datetime.getTime() - Date.now() > OVERLAY.closeWindowMs;
};

const openOverlay = (type: ScheduleType, index: number) => {
  const overlay = store.get(overlayAtom);
  if (overlay.isOn) return;
  if (!canOpenOverlay(type)) return;

  perfMark('overlay_open_start', { scheduleType: type });
  armOverlayBoundary(type);
  store.set(overlayAtom, { isOn: true, selectedPrayerIndex: index, scheduleType: type });

  // Flip the hero display on the toggle instant, not the next wall-second tick
  writeDisplayCountdown(type);
};

const closeOverlay = () => {
  const overlay = store.get(overlayAtom);
  if (!overlay.isOn) return;

  perfMark('overlay_close_start', { scheduleType: overlay.scheduleType });
  clearOverlayBoundary();
  store.set(overlayAtom, { ...overlay, isOn: false });
  writeDisplayCountdown(overlay.scheduleType);
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

export { closeOverlay, openOverlay, toggleOverlay };
