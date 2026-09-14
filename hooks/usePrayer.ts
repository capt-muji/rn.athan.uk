/**
 * Hook for accessing individual prayer data with derived status
 * Part of the new prayer-centric timing system
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { useAtomValue } from 'jotai';

import { usePrayerSequence } from '@/hooks/usePrayerSequence';
import { findNextOccurrence } from '@/shared/sequence';
import { AlertType, type Prayer, ScheduleType } from '@/shared/types';
import { englishWidthExtraAtom, englishWidthStandardAtom } from '@/stores/ui';

/** What a row needs to decide which occurrence it shows */
interface ShownRow {
  isPassed: boolean;
  time: string | null;
}

/**
 * The occurrence a row stands for: itself, or, for the overlay on a passed row, the same prayer on the
 * next list day
 *
 * Found by list day, so a next occurrence whose time could not be read still opens, and draws as
 * unreadable (R12). With no later list day in the sequence (Istijaba is weekly) the row stands for itself.
 */
export const resolveOccurrence = (prayers: Prayer[], row: Prayer, isPassed: boolean, isOverlay: boolean): Prayer =>
  isPassed && isOverlay ? (findNextOccurrence(prayers, row) ?? row) : row;

/**
 * The time a row shows: its next occurrence's while the overlay has it selected and it has passed, its
 * own otherwise. Null when that occurrence has no readable time
 *
 * The one choice behind both the time drawn and whether the bell can be used, so the two cannot describe
 * different occurrences.
 *
 * @param row The row as usePrayer returns it
 * @param nextOccurrence The same row from usePrayer with isOverlay
 */
export const getShownTime = (isSelectedForOverlay: boolean, row: ShownRow, nextOccurrence: ShownRow): string | null =>
  isSelectedForOverlay && row.isPassed ? nextOccurrence.time : row.time;

/**
 * Whether the bell is unavailable: the occurrence on screen has no readable time, so nothing could ever
 * fire for it, and a press explains that instead of offering options (R5). The saved preference is left
 * as it is, so it applies again to readable days.
 */
export const isShownOccurrenceUnavailable = (
  isSelectedForOverlay: boolean,
  row: ShownRow,
  nextOccurrence: ShownRow
): boolean => getShownTime(isSelectedForOverlay, row, nextOccurrence) === null;

/**
 * The alert a bell draws: Off while its shown occurrence has no readable time, whatever is saved, since
 * nothing can fire for it. Only the glyph says so; the bell keeps the row's own colour like any other, and
 * the saved preference is left as it is (R5)
 */
export const getShownAlert = (isUnavailable: boolean, saved: AlertType): AlertType =>
  isUnavailable ? AlertType.Off : saved;

/**
 * Hook for accessing individual prayer data with derived status
 *
 * Returns prayer data at the specified index with computed isPassed and isNext.
 * For overlay mode: if prayer passed, shows the next occurrence (tomorrow's prayer).
 *
 * @param type Schedule type (Standard or Extra)
 * @param index Prayer index within today's filtered prayers (default: 0)
 * @param isOverlay Whether this is for the overlay display (default: false)
 * @returns Prayer data with status flags and UI configuration
 *
 * @example
 * const prayer = usePrayer(ScheduleType.Standard, 2); // Get Dhuhr
 * const { english, arabic, time, isPassed, isNext } = prayer;
 */
export const usePrayer = (type: ScheduleType, index = 0, isOverlay = false) => {
  // NEW: Use sequence-based prayer data with derived isPassed and isNext
  const { prayers, displayDate, isReady } = usePrayerSequence(type);
  const isStandard = type === ScheduleType.Standard;
  const maxEnglishWidth = useAtomValue(isStandard ? englishWidthStandardAtom : englishWidthExtraAtom);

  // Filter prayers to current displayDate
  const todayPrayers = prayers.filter((p) => p.belongsToDate === displayDate);
  const prayer = todayPrayers[index];

  // Loading state or index out of range (schedule refreshed mid-selection)
  if (!isReady || !prayer) {
    return {
      english: '',
      arabic: '',
      time: '',
      date: '',
      index: 0,
      type,
      isStandard,
      isPassed: false,
      isNext: false,
      isOverlay,
      ui: { initialColorPos: 0, maxEnglishWidth },
    };
  }

  const { isPassed, isNext } = prayer;

  const displayPrayer = resolveOccurrence(prayers, prayer, isPassed, isOverlay);

  return {
    ...displayPrayer,
    date: displayPrayer.belongsToDate,
    isStandard,
    isPassed,
    isNext,
    isOverlay,
    ui: {
      initialColorPos: isPassed || isNext ? 1 : 0,
      maxEnglishWidth,
    },
  };
};
