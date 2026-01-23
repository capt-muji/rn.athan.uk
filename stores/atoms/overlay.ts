/**
 * Overlay atom - extracted to break circular dependency
 * between stores/overlay.ts and stores/countdown.ts
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { atom } from 'jotai';

import { OverlayStore, ScheduleType } from '@/shared/types';

/**
 * Overlay state atom
 *
 * Tracks whether the full-screen prayer overlay is visible,
 * which prayer is selected, and which schedule type is active.
 *
 * @property isOn - Whether overlay is currently visible
 * @property selectedPrayerIndex - Index of selected prayer in schedule
 * @property scheduleType - Current schedule type (Standard or Extra)
 */
export const overlayAtom = atom<OverlayStore>({
  isOn: false,
  selectedPrayerIndex: 0,
  scheduleType: ScheduleType.Standard,
});
