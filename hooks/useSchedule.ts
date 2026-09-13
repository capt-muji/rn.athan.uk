/**
 * Hook for accessing prayer schedule data
 * Uses the prayer-centric sequence model
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { type PrayerWithStatus, usePrayerSequence } from '@/hooks/usePrayerSequence';
import { isReadable } from '@/shared/sequence';
import { ScheduleType } from '@/shared/types';

interface ScheduleView {
  /** The displayed list's rows */
  prayers: PrayerWithStatus[];
  /** Index of the next prayer on the displayed list (-1 when it is not on this list) */
  nextPrayerIndex: number;
  /** Index of the displayed list's first row with a readable time (-1 when it has none) */
  firstReadableIndex: number;
  /** Whether every row on the displayed list has passed */
  isLastPrayerPassed: boolean;
}

/**
 * The displayed list and what the rows need from it
 *
 * @param prayers The whole sequence with statuses (usePrayerSequence)
 * @param displayDate The list day on screen
 */
export const computeScheduleView = (prayers: PrayerWithStatus[], displayDate: string | null): ScheduleView => {
  const todayPrayers = prayers.filter((p) => p.belongsToDate === displayDate);

  return {
    prayers: todayPrayers,
    nextPrayerIndex: todayPrayers.findIndex((p) => p.isNext),
    firstReadableIndex: todayPrayers.findIndex(isReadable),
    isLastPrayerPassed: todayPrayers.every((p) => p.isPassed),
  };
};

/**
 * Whether a row joins the date-roll cascade, which dims the other rows in turn when a new day's list
 * arrives with its first prayer next
 *
 * An unreadable row is never next, so "first prayer" is the list's first readable row, not row 0. On a
 * fully readable list those are the same row, which keeps the cascade exactly as it was. A list with no
 * row next has nothing to cascade from.
 */
export const isCascadeRow = (
  schedule: Pick<ScheduleView, 'nextPrayerIndex' | 'firstReadableIndex'>,
  index: number
): boolean =>
  schedule.nextPrayerIndex !== -1 &&
  schedule.nextPrayerIndex === schedule.firstReadableIndex &&
  index !== schedule.nextPrayerIndex;

/**
 * Opacity the active pill heads for
 *
 * With no row on the displayed list next, a list with no readable row left, there is no row to sit
 * behind, so the pill fades rather than resting on a row that is not next (R11).
 *
 * @param nextPrayerIndex Index of the next prayer on the displayed list (-1 when it is not on it)
 * @param isHiddenByOverlay Whether the open overlay hides the pill
 */
export const getPillOpacity = (nextPrayerIndex: number, isHiddenByOverlay: boolean): number =>
  isHiddenByOverlay || nextPrayerIndex === -1 ? 0 : 1;

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

  return {
    ...computeScheduleView(prayers, displayDate),
    displayDate,
    isStandard,
    isReady,
  };
};
