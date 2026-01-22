/**
 * Overlay state management
 * Part of the new prayer-centric timing system
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { getDefaultStore } from 'jotai/vanilla';

import { ScheduleType } from '@/shared/types';
import { overlayAtom as overlayAtomImport } from '@/stores/atoms/overlay';
import { startCountdownOverlay, standardCountdownAtom, extraCountdownAtom } from '@/stores/countdown';
import { getNextPrayer } from '@/stores/schedule';

// Re-export for backward compatibility
export { overlayAtom } from '@/stores/atoms/overlay';

// Local alias for internal use
const overlayAtom = overlayAtomImport;

const store = getDefaultStore();

// --- Actions ---

/**
 * Checks if overlay can be shown for a schedule type
 * Uses sequence-based check: if no next prayer, all prayers have passed
 *
 * @param type Schedule type to check
 * @returns true if overlay can be shown (all passed or countdown > 2 seconds)
 */
const canShowOverlay = (type: ScheduleType): boolean => {
  // NEW: Use sequence-based check for "all prayers passed"
  // If getNextPrayer returns null, all prayers in sequence have passed
  const nextPrayer = getNextPrayer(type);
  if (!nextPrayer) return true; // All prayers passed, always allow

  // Check countdown - don't allow overlay if prayer is about to pass
  const countdownAtom = type === ScheduleType.Standard ? standardCountdownAtom : extraCountdownAtom;
  const timeLeft = store.get(countdownAtom).timeLeft;
  return timeLeft > 2;
};

const toggleOverlay = (force?: boolean) => {
  const overlay = store.get(overlayAtom);
  const newState = force !== undefined ? force : !overlay.isOn;

  // Don't allow opening if countdown is too low
  if (!overlay.isOn && newState && !canShowOverlay(overlay.scheduleType)) return;

  store.set(overlayAtom, { ...overlay, isOn: newState });
};

const setSelectedPrayerIndex = (scheduleType: ScheduleType, index: number) => {
  if (!canShowOverlay(scheduleType)) return;

  const overlay = store.get(overlayAtom);
  store.set(overlayAtom, { ...overlay, selectedPrayerIndex: index, scheduleType });
  startCountdownOverlay();
};

export { toggleOverlay, setSelectedPrayerIndex };
