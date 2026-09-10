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
import { getCountdownAtom, writeDisplayCountdown } from '@/stores/countdown';
import { getNextPrayer } from '@/stores/schedule';

// Re-export for backward compatibility
export { overlayAtom } from '@/stores/atoms/overlay';

// Local alias for internal use
const overlayAtom = overlayAtomImport;

const store = getDefaultStore();

// --- Actions ---

/**
 * Guards the pre-boundary window: the overlay may not open or retarget inside
 * the final 2 displayed seconds, so it can never straddle a prayer boundary
 * (an all-passed schedule has no boundary to straddle and is always allowed)
 */
const canShowOverlay = (type: ScheduleType): boolean => {
  const nextPrayer = getNextPrayer(type);
  if (!nextPrayer) return true;

  const timeLeft = store.get(getCountdownAtom(type)).timeLeft;
  return timeLeft > 2;
};

/**
 * Toggles the overlay visibility
 *
 * Can force a specific state or toggle current state.
 * Guards against opening when countdown is too low (≤2 seconds).
 *
 * @param force Optional boolean to force specific state (true = open, false = close)
 */
const toggleOverlay = (force?: boolean) => {
  const overlay = store.get(overlayAtom);
  const newState = force !== undefined ? force : !overlay.isOn;

  // Don't allow opening if countdown is too low
  if (!overlay.isOn && newState && !canShowOverlay(overlay.scheduleType)) return;

  perfMark(newState ? 'overlay_open_start' : 'overlay_close_start', { scheduleType: overlay.scheduleType });
  store.set(overlayAtom, { ...overlay, isOn: newState });

  // Instant page-countdown write (ADR-014 countdown merge): the page atom
  // must flip to its new display target on the toggle instant — waiting for
  // the next wall-second tick would show the stale target for up to 1s
  writeDisplayCountdown(overlay.scheduleType);
};

/**
 * Sets the selected prayer for overlay display
 *
 * Updates the overlay state with the new prayer index and schedule type,
 * then writes the new display target into the page countdown atom instantly.
 * Guards against selection when countdown is too low (≤2 seconds).
 *
 * @param scheduleType Schedule type (Standard or Extra)
 * @param index Prayer index within the schedule
 */
const setSelectedPrayerIndex = (scheduleType: ScheduleType, index: number) => {
  if (!canShowOverlay(scheduleType)) return;

  const overlay = store.get(overlayAtom);
  store.set(overlayAtom, { ...overlay, selectedPrayerIndex: index, scheduleType });
  writeDisplayCountdown(scheduleType);
};

export { setSelectedPrayerIndex, toggleOverlay };
