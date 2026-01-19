/**
 * Overlay atom - extracted to break circular dependency
 * between stores/overlay.ts and stores/timer.ts
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { atom } from 'jotai';

import { OverlayStore, ScheduleType } from '@/shared/types';

export const overlayAtom = atom<OverlayStore>({
  isOn: false,
  selectedPrayerIndex: 0,
  scheduleType: ScheduleType.Standard,
});
