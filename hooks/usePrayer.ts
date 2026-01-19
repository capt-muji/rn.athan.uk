/**
 * Hook for accessing individual prayer data with derived status
 * Part of the new prayer-centric timing system
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { useAtomValue } from 'jotai';

import { usePrayerSequence } from '@/hooks/usePrayerSequence';
import { ScheduleType } from '@/shared/types';
import { englishWidthStandardAtom, englishWidthExtraAtom } from '@/stores/ui';

export const usePrayer = (type: ScheduleType, index = 0, isOverlay = false) => {
  // NEW: Use sequence-based prayer data with derived isPassed and isNext
  const { prayers, displayDate, isReady } = usePrayerSequence(type);
  const isStandard = type === ScheduleType.Standard;
  const maxEnglishWidth = useAtomValue(isStandard ? englishWidthStandardAtom : englishWidthExtraAtom);

  // Filter prayers to current displayDate
  const todayPrayers = prayers.filter((p) => p.belongsToDate === displayDate);
  const prayer = todayPrayers[index];

  // Loading state only
  if (!isReady) {
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

  // Overlay: If prayer passed, show next occurrence (tomorrow's prayer)
  // 3-day buffer contains all prayers sorted, so find next matching prayer name
  const displayPrayer =
    isPassed && isOverlay ? prayers.find((p) => p.english === prayer.english && p.datetime > prayer.datetime)! : prayer;

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
