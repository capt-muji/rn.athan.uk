/**
 * Hook for accessing the full prayer sequence
 * Part of the new prayer-centric timing system
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { useAtomValue } from 'jotai';

import { findNextReadable, isRowPassed } from '@/shared/sequence';
import * as TimeUtils from '@/shared/time';
import { type Prayer, ScheduleType } from '@/shared/types';
import {
  extraDisplayDateAtom,
  extraSequenceAtom,
  standardDisplayDateAtom,
  standardSequenceAtom,
} from '@/stores/schedule';

/**
 * Prayer with derived status fields
 * A row keeps its own shape, readable or not, with isPassed and isNext added
 */
export type PrayerWithStatus = Prayer & {
  /** Whether this prayer has passed (isRowPassed in shared/sequence.ts) */
  isPassed: boolean;
  /** Whether this is the next upcoming prayer */
  isNext: boolean;
};

interface PrayerStatuses {
  /** Every row with isPassed and isNext */
  prayers: PrayerWithStatus[];
  /** Index of the next prayer in the prayers array (-1 when no readable row is still to come) */
  nextPrayerIndex: number;
}

interface UsePrayerSequenceResult extends PrayerStatuses {
  /** The display date (resolveDisplayDate in shared/sequence.ts) */
  displayDate: string | null;
  /** Whether the sequence is initialized */
  isReady: boolean;
}

/**
 * Each row's status at a moment
 *
 * Taken from shared/sequence.ts rather than worked out here, so the rows, the countdown and the stores
 * cannot disagree about which row is next or which rows have passed. Exported because the test tree has
 * no renderer: a test that cannot reach this would have to copy it.
 *
 * @param rawPrayers The sequence, in list order
 * @param now The moment to judge the rows at
 */
export const computePrayerStatuses = (rawPrayers: Prayer[], now: Date): PrayerStatuses => {
  const next = findNextReadable(rawPrayers, now);
  const nextPrayerIndex = next ? rawPrayers.indexOf(next) : -1;

  const prayers = rawPrayers.map(
    (prayer, index): PrayerWithStatus => ({
      ...prayer,
      isPassed: isRowPassed(rawPrayers, prayer, now),
      isNext: index === nextPrayerIndex,
    })
  );

  return { prayers, nextPrayerIndex };
};

/**
 * Returns the full prayer sequence for rendering prayer lists
 * Uses sequence atoms for automatic updates when prayers change
 * Each prayer includes derived isPassed and isNext fields
 *
 * @param type Schedule type (Standard or Extra)
 * @returns Object with prayers array (with status), displayDate, nextPrayerIndex, and isReady
 *
 * @example
 * const { prayers, displayDate, isReady } = usePrayerSequence(ScheduleType.Standard);
 * if (isReady) {
 *   prayers.forEach((prayer) => {
 *     logger.debug({ prayer: prayer.english, isPassed: prayer.isPassed, isNext: prayer.isNext }, 'Prayer sequence state');
 *   });
 * }
 */

export const usePrayerSequence = (type: ScheduleType): UsePrayerSequenceResult => {
  const sequenceAtom = type === ScheduleType.Standard ? standardSequenceAtom : extraSequenceAtom;
  const displayDateAtom = type === ScheduleType.Standard ? standardDisplayDateAtom : extraDisplayDateAtom;

  const sequence = useAtomValue(sequenceAtom);
  const displayDate = useAtomValue(displayDateAtom);

  const { prayers, nextPrayerIndex } = computePrayerStatuses(sequence?.prayers ?? [], TimeUtils.createInstant());

  return {
    prayers,
    displayDate,
    nextPrayerIndex,
    isReady: sequence !== null,
  };
};
