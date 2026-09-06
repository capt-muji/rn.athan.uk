/**
 * Overlay state management
 * Part of the new prayer-centric timing system
 *
 * @see ai/adr/005-timing-system-overhaul.md
 * @see ai/adr/014 (in-place re-architecture; the ≤2s pre-boundary open lock is
 * removed — the overlay rides the cascade via selection-follows-next-prayer)
 */

import { getDefaultStore } from 'jotai/vanilla';

import { perfMark } from '@/shared/perf';
import type { ScheduleType } from '@/shared/types';
import { overlayAtom as overlayAtomImport } from '@/stores/atoms/overlay';
import { resetOverlayCountdown, startCountdownOverlay } from '@/stores/countdown';

// Re-export for backward compatibility
export { overlayAtom } from '@/stores/atoms/overlay';

// Local alias for internal use
const overlayAtom = overlayAtomImport;

const store = getDefaultStore();

// --- Actions ---

/**
 * Toggles the overlay visibility
 *
 * Can force a specific state or toggle current state.
 *
 * @param force Optional boolean to force specific state (true = open, false = close)
 */
const toggleOverlay = (force?: boolean) => {
  const overlay = store.get(overlayAtom);
  const newState = force !== undefined ? force : !overlay.isOn;

  perfMark(newState ? 'overlay_open_start' : 'overlay_close_start', { scheduleType: overlay.scheduleType });
  store.set(overlayAtom, { ...overlay, isOn: newState });

  // The overlay countdown ticker is on-demand: start it when the overlay
  // becomes visible, stop it (and reset the placeholder) when it closes —
  // a closed overlay must not keep a per-second ticker alive
  if (newState) startCountdownOverlay();
  else resetOverlayCountdown();
};

/**
 * Sets the selected prayer for overlay display
 *
 * Updates the overlay state with the new prayer index and schedule type.
 * Restarts the overlay countdown for the selected prayer.
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param index Prayer index within the schedule
 */
const setSelectedPrayerIndex = (scheduleType: ScheduleType, index: number) => {
  const overlay = store.get(overlayAtom);
  store.set(overlayAtom, { ...overlay, selectedPrayerIndex: index, scheduleType });
  startCountdownOverlay();
};

export { setSelectedPrayerIndex, toggleOverlay };
