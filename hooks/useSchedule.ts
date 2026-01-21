/**
 * Hook for accessing prayer schedule data
 * Uses the prayer-centric sequence model
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { usePrayerSequence } from '@/hooks/usePrayerSequence';
import { ScheduleType } from '@/shared/types';

export const useSchedule = (type: ScheduleType) => {
  const isStandard = type === ScheduleType.Standard;

  // Use sequence model (prayer-centric)
  const { prayers, displayDate, isReady } = usePrayerSequence(type);

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
    isReady,
  };
};
