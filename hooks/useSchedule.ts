/**
 * Hook for accessing prayer schedule data
 * Uses the prayer-centric sequence model
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { usePrayerSequence } from '@/hooks/usePrayerSequence';
import { ScheduleType } from '@/shared/types';

/**
 * Hook for accessing filtered prayer schedule data
 *
 * Filters the prayer sequence to show only today's prayers (matching displayDate).
 * Provides schedule metadata for UI rendering.
 *
 * @param type Schedule type (Standard or Extra)
 * @returns Object with today's prayers, display date, and schedule metadata
 *
 * @example
 * const { prayers, displayDate, nextPrayerIndex, isReady } = useSchedule(ScheduleType.Standard);
 * if (isReady) {
 *   prayers.forEach((prayer, index) => {
 *     const isNext = index === nextPrayerIndex;
 *   });
 * }
 */
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
