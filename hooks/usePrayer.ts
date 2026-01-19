/**
 * Hook for accessing individual prayer data with derived status
 * Part of the new prayer-centric timing system
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { useAtomValue } from 'jotai';

import { usePrayerSequence, PrayerWithStatus } from '@/hooks/usePrayerSequence';
import { ScheduleType } from '@/shared/types';
import { englishWidthStandardAtom, englishWidthExtraAtom } from '@/stores/ui';

export const usePrayer = (type: ScheduleType, index = 0, isOverlay = false) => {
  // NEW: Use sequence-based prayer data with derived isPassed and isNext
  const { prayers, displayDate, isReady } = usePrayerSequence(type);
  const isStandard = type === ScheduleType.Standard;
  const maxEnglishWidth = useAtomValue(isStandard ? englishWidthStandardAtom : englishWidthExtraAtom);

  // Filter prayers to current displayDate to get "today's" prayers
  // This maintains backward compatibility with index-based access
  const todayPrayers = prayers.filter((p) => p.belongsToDate === displayDate);
  const prayer: PrayerWithStatus | undefined = todayPrayers[index];

  // Fallback for loading state or invalid index
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
      ui: {
        initialColorPos: 0,
        maxEnglishWidth,
      },
    };
  }

  // Get tomorrow's prayer for overlay display when current prayer is passed
  const tomorrowPrayers = prayers.filter((p) => p.belongsToDate !== displayDate);
  const tomorrowPrayer = tomorrowPrayers[index];

  // isPassed and isNext are already derived in usePrayerSequence
  // prayer.datetime < now = isPassed
  // prayer.id === nextPrayer.id = isNext
  const { isPassed, isNext } = prayer;

  // Use tomorrow's prayer if the current prayer is passed and shown in overlay
  const displayPrayer = isPassed && isOverlay && tomorrowPrayer ? tomorrowPrayer : prayer;

  const ui = {
    initialColorPos: isPassed || isNext ? 1 : 0,
    maxEnglishWidth,
  };

  return {
    ...displayPrayer,
    // Transform Prayer fields to match old interface
    date: displayPrayer.belongsToDate,
    isStandard,
    isPassed,
    isNext,
    isOverlay,
    ui,
  };
};
