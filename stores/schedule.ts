/**
 * Schedule store - prayer sequence management
 * Uses the prayer-centric sequence model
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { subDays } from 'date-fns';
import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import { PRAYERS_ENGLISH, PRAYERS_ARABIC, EXTRAS_ENGLISH, EXTRAS_ARABIC, TIME_CONSTANTS } from '@/shared/constants';
import logger from '@/shared/logger';
import * as PrayerUtils from '@/shared/prayer';
import * as TimeUtils from '@/shared/time';
import { ISingleApiResponseTransformed, Prayer, PrayerSequence, ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';

const store = getDefaultStore();

// --- Sequence Atoms (Prayer-Centric Model) ---

/** Standard schedule prayer sequence (null until initialized) */
export const standardSequenceAtom = atom<PrayerSequence | null>(null);

/** Extra schedule prayer sequence (null until initialized) */
export const extraSequenceAtom = atom<PrayerSequence | null>(null);

/** Helper to get the sequence atom for a schedule type */
export const getSequenceAtom = (type: ScheduleType) => {
  return type === ScheduleType.Standard ? standardSequenceAtom : extraSequenceAtom;
};

// --- Derived Selector Atoms ---

/**
 * Creates a derived atom that returns the next upcoming prayer
 * Finds the first prayer with datetime > now
 *
 * @param type Schedule type (Standard or Extra)
 * @returns Derived atom with Prayer | null
 */
export const createNextPrayerAtom = (type: ScheduleType) => {
  return atom((get) => {
    const sequence = get(getSequenceAtom(type));
    if (!sequence) return null;

    const now = TimeUtils.createLondonDate();
    // 3-day buffer guarantees next prayer exists, but satisfy TypeScript
    return sequence.prayers.find((p) => p.datetime > now) ?? null;
  });
};

/**
 * Creates a derived atom that returns the previous prayer (before next)
 * Used for progress bar calculation
 *
 * EDGE CASE: When next prayer is first in sequence (e.g., 1am before Fajr),
 * fetches yesterday's final prayer from database to ensure progress bar works correctly.
 * Matches January 1st handling pattern in sync.ts.
 *
 * @param type Schedule type (Standard or Extra)
 * @returns Derived atom with Prayer | null
 */
export const createPrevPrayerAtom = (type: ScheduleType) => {
  return atom((get) => {
    const sequence = get(getSequenceAtom(type));
    if (!sequence) return null;

    const now = TimeUtils.createLondonDate();
    const nextIndex = sequence.prayers.findIndex((p) => p.datetime > now);

    // Normal case: Previous prayer is in sequence
    if (nextIndex > 0) {
      return sequence.prayers[nextIndex - 1];
    }

    // EDGE CASE: Next prayer is first in sequence (nextIndex === 0)
    // This happens at 1am when Fajr (6am) is next prayer
    // Fetch yesterday's final prayer from database for progress bar calculation
    // Sync layer guarantees yesterday's data exists (see sync.ts:52-67)
    if (nextIndex === 0) {
      const yesterday = subDays(TimeUtils.createLondonDate(), 1);
      const prevDayData = Database.getPrayerByDate(yesterday)!;

      // Sync layer ensures data exists - no null check needed
      // See ADR-004: "Trust the data layer: UI never has fallbacks"
      const isStandard = type === ScheduleType.Standard;
      const namesEnglish = isStandard ? PRAYERS_ENGLISH : EXTRAS_ENGLISH;
      const namesArabic = isStandard ? PRAYERS_ARABIC : EXTRAS_ARABIC;

      // Filter out Istijaba on non-Fridays for Extras
      let englishNames = namesEnglish;
      let arabicNames = namesArabic;

      if (!isStandard && !TimeUtils.isFriday(yesterday)) {
        englishNames = englishNames.filter((name) => name.toLowerCase() !== 'istijaba');
        arabicNames = arabicNames.filter((name) => name !== 'استجابة');
      }

      const finalPrayerIndex = englishNames.length - 1;
      const prayerKey = englishNames[finalPrayerIndex].toLowerCase();
      const prayerTime = prevDayData[prayerKey as keyof ISingleApiResponseTransformed];

      const prevPrayer = PrayerUtils.createPrayer({
        type,
        english: englishNames[finalPrayerIndex],
        arabic: arabicNames[finalPrayerIndex],
        date: TimeUtils.formatDateShort(yesterday),
        time: prayerTime,
      });

      logger.info('PREV_PRAYER: Fetched yesterday final prayer for progress bar', {
        type,
        prevPrayer: prevPrayer.english,
        prevTime: prevPrayer.time,
      });

      return prevPrayer;
    }

    // No future prayers found - should never happen with 3-day sequence buffer
    return null;
  });
};

/**
 * Creates a derived atom that returns the display date
 * The display date is the belongsToDate of the next prayer
 *
 * @param type Schedule type (Standard or Extra)
 * @returns Derived atom with string | null (YYYY-MM-DD format)
 */
export const createDisplayDateAtom = (type: ScheduleType) => {
  return atom((get) => {
    const sequence = get(getSequenceAtom(type));
    if (!sequence) return null;

    const now = TimeUtils.createLondonDate();
    // 3-day buffer guarantees next prayer exists
    return sequence.prayers.find((p) => p.datetime > now)!.belongsToDate;
  });
};

// Pre-created derived atoms for convenience
export const standardNextPrayerAtom = createNextPrayerAtom(ScheduleType.Standard);
export const extraNextPrayerAtom = createNextPrayerAtom(ScheduleType.Extra);
export const standardPrevPrayerAtom = createPrevPrayerAtom(ScheduleType.Standard);
export const extraPrevPrayerAtom = createPrevPrayerAtom(ScheduleType.Extra);
export const standardDisplayDateAtom = createDisplayDateAtom(ScheduleType.Standard);
export const extraDisplayDateAtom = createDisplayDateAtom(ScheduleType.Extra);

// --- Actions ---

/**
 * Sets the prayer sequence for a schedule type
 * Creates a 3-day buffer of prayers starting from the given date
 *
 * @param type Schedule type (Standard or Extra)
 * @param date Start date for the sequence
 */
export const setSequence = (type: ScheduleType, date: Date): void => {
  const sequenceAtom = getSequenceAtom(type);
  const sequence = PrayerUtils.createPrayerSequence(type, date, 3);

  store.set(sequenceAtom, sequence);

  logger.info('SEQUENCE: Set sequence', {
    type,
    startDate: TimeUtils.formatDateShort(date),
    prayerCount: sequence.prayers.length,
  });
};

/**
 * Helper: Filter prayers to keep only relevant ones
 * Keeps future prayers, passed prayers for current display date, and previous prayer
 */
function filterRelevantPrayers(
  prayers: Prayer[],
  now: Date,
  currentDisplayDate: string | null,
  nextIndex: number
): Prayer[] {
  return prayers.filter((p, index) => {
    // Always keep future prayers
    if (p.datetime > now) return true;
    // Keep passed prayers that belong to current display date (for display purposes)
    if (currentDisplayDate && p.belongsToDate === currentDisplayDate) return true;
    // Keep the immediate previous prayer (for progress bar: Isha→Fajr transition)
    if (nextIndex > 0 && index === nextIndex - 1) return true;
    return false;
  });
}

/**
 * Helper: Check if we need to fetch more prayers
 * Returns true if less than 24 hours of prayer buffer remains
 */
function shouldFetchMorePrayers(prayers: Prayer[], now: Date): boolean {
  const lastPrayer = prayers[prayers.length - 1];
  return !lastPrayer || lastPrayer.datetime.getTime() - now.getTime() < TIME_CONSTANTS.ONE_DAY_MS;
}

/**
 * Helper: Merge existing and new prayers, removing duplicates
 * Deduplication based on prayer name and datetime
 */
function mergeAndDeduplicatePrayers(existingPrayers: Prayer[], newPrayers: Prayer[]): Prayer[] {
  const existingSet = new Set(existingPrayers.map((p) => `${p.english}_${p.datetime.getTime()}`));
  const uniqueNewPrayers = newPrayers.filter((p) => !existingSet.has(`${p.english}_${p.datetime.getTime()}`));

  return [...existingPrayers, ...uniqueNewPrayers].sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
}

/**
 * Refreshes the prayer sequence by removing passed prayers and fetching more if needed
 * Called when a prayer passes to keep the sequence fresh
 *
 * IMPORTANT: Keeps passed prayers that belong to the current display date.
 * This ensures Midnight (23:17 Jan 18, belongsTo Jan 19) remains visible when displaying Jan 19.
 * Memory-safe: passed prayers for OTHER dates are removed.
 *
 * @param type Schedule type (Standard or Extra)
 */
export const refreshSequence = (type: ScheduleType): void => {
  const sequenceAtom = getSequenceAtom(type);
  const sequence = store.get(sequenceAtom);

  if (!sequence) {
    logger.warn('SEQUENCE: Cannot refresh - sequence not initialized', { type });
    return;
  }

  const now = TimeUtils.createLondonDate();

  // Find the next future prayer to determine the current display date
  const nextFuturePrayer = sequence.prayers.find((p) => p.datetime > now);
  const currentDisplayDate = nextFuturePrayer?.belongsToDate ?? null;

  // Find index of next prayer
  const nextIndex = sequence.prayers.findIndex((p) => p.datetime > now);

  // Filter relevant prayers using helper
  const relevantPrayers = filterRelevantPrayers(sequence.prayers, now, currentDisplayDate, nextIndex);

  // Check if we need to fetch more prayers using helper
  if (shouldFetchMorePrayers(relevantPrayers, now)) {
    // Fetch more days starting from tomorrow
    const tomorrow = TimeUtils.createLondonDate();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const newSequence = PrayerUtils.createPrayerSequence(type, tomorrow, 3);

    // Merge and deduplicate using helper
    const mergedPrayers = mergeAndDeduplicatePrayers(relevantPrayers, newSequence.prayers);

    store.set(sequenceAtom, { type, prayers: mergedPrayers });

    logger.info('SEQUENCE: Refreshed with new prayers', {
      type,
      previousCount: sequence.prayers.length,
      newCount: mergedPrayers.length,
    });
  } else {
    // Just update with filtered prayers (no new fetch needed)
    store.set(sequenceAtom, { type, prayers: relevantPrayers });

    logger.info('SEQUENCE: Refreshed (filtered passed prayers)', {
      type,
      previousCount: sequence.prayers.length,
      newCount: relevantPrayers.length,
    });
  }
};

/**
 * Gets the next upcoming prayer from the sequence
 * Pure read operation - does NOT trigger refresh
 * Callers must handle null case and refresh if needed
 *
 * @param type Schedule type (Standard or Extra)
 * @returns Next prayer or null if sequence not initialized or empty
 *
 * @example
 * const next = getNextPrayer(ScheduleType.Standard);
 * if (!next) {
 *   refreshSequence(type);
 *   // Then retry or handle loading state
 * }
 */
export const getNextPrayer = (type: ScheduleType): Prayer | null => {
  const nextPrayerAtom = type === ScheduleType.Standard ? standardNextPrayerAtom : extraNextPrayerAtom;
  return store.get(nextPrayerAtom);
};

/**
 * Gets the previous prayer (before the next upcoming prayer)
 * Used for progress bar calculation
 *
 * @param type Schedule type (Standard or Extra)
 * @returns Previous prayer or null if not available
 */
export const getPrevPrayer = (type: ScheduleType): Prayer | null => {
  const prevPrayerAtom = type === ScheduleType.Standard ? standardPrevPrayerAtom : extraPrevPrayerAtom;
  return store.get(prevPrayerAtom);
};

/**
 * Gets the current display date for a schedule
 * The display date is the belongsToDate of the next prayer
 *
 * @param type Schedule type (Standard or Extra)
 * @returns Display date string (YYYY-MM-DD) or null
 */
export const getDisplayDate = (type: ScheduleType): string | null => {
  const displayDateAtom = type === ScheduleType.Standard ? standardDisplayDateAtom : extraDisplayDateAtom;
  return store.get(displayDateAtom);
};
