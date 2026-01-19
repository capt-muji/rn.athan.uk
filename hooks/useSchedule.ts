/**
 * Hook for accessing prayer schedule data
 * Uses the prayer-centric sequence model
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { useAtomValue } from 'jotai';

import { usePrayerSequence } from '@/hooks/usePrayerSequence';
import { ScheduleType } from '@/shared/types';
import { getScheduleMutedState } from '@/stores/notifications';
import { getTempMutedAtom } from '@/stores/ui';

export const useSchedule = (type: ScheduleType) => {
  const isStandard = type === ScheduleType.Standard;

  // Use sequence model (prayer-centric)
  const { prayers, displayDate, isReady } = usePrayerSequence(type);

  const tempMuted = useAtomValue(getTempMutedAtom(type));
  const persistedMuted = getScheduleMutedState(type);

  // Use the temporary override if set, otherwise fall back to persisted
  const currentMuted = tempMuted !== null ? tempMuted : persistedMuted;

  // Filter to today's prayers
  const todayPrayers = prayers.filter((p) => p.belongsToDate === displayDate);

  // Calculate nextPrayerIndex relative to filtered todayPrayers
  const nextPrayerIndex = todayPrayers.findIndex((p) => p.isNext);

  return {
    prayers: todayPrayers,
    displayDate,
    nextPrayerIndex: nextPrayerIndex >= 0 ? nextPrayerIndex : -1,
    isStandard,
    isLastPrayerPassed: todayPrayers.every((p) => p.isPassed),
    persistedMuted,
    currentMuted,
    isReady,
  };
};
