/**
 * Schedule store - prayer sequence management
 * Uses the prayer-centric sequence model
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import logger from '@/shared/logger';
import * as PrayerUtils from '@/shared/prayer';
import * as TimeUtils from '@/shared/time';
import { Prayer, PrayerSequence, ScheduleType } from '@/shared/types';

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
    return sequence.prayers.find((p) => p.datetime > now) ?? null;
  });
};

/**
 * Creates a derived atom that returns the previous prayer (before next)
 * Used for progress bar calculation
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

    // If no next prayer or it's the first, no previous
    if (nextIndex <= 0) return null;

    return sequence.prayers[nextIndex - 1];
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
    if (!sequence || sequence.prayers.length === 0) return null;

    const now = TimeUtils.createLondonDate();
    const nextPrayer = sequence.prayers.find((p) => p.datetime > now);

    // If no next prayer, use the last prayer's belongsToDate
    return nextPrayer?.belongsToDate ?? sequence.prayers[sequence.prayers.length - 1].belongsToDate;
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

  // Filter prayers: keep future prayers OR passed prayers for current display date
  // This ensures Midnight (23:17 Jan 18, belongsTo Jan 19) is kept when displaying Jan 19
  // Memory-safe: passed prayers for OTHER dates are removed
  const relevantPrayers = sequence.prayers.filter((p) => {
    // Always keep future prayers
    if (p.datetime > now) return true;
    // Keep passed prayers that belong to current display date (for display purposes)
    if (currentDisplayDate && p.belongsToDate === currentDisplayDate) return true;
    return false;
  });

  // Check if we need more prayers (less than 24 hours of buffer)
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  const lastPrayer = relevantPrayers[relevantPrayers.length - 1];
  const needsMorePrayers = !lastPrayer || lastPrayer.datetime.getTime() - now.getTime() < TWENTY_FOUR_HOURS_MS;

  if (needsMorePrayers) {
    // Fetch more days starting from tomorrow
    const tomorrow = TimeUtils.createLondonDate();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const newSequence = PrayerUtils.createPrayerSequence(type, tomorrow, 3);

    // Merge: keep current relevant prayers + add new prayers that aren't duplicates
    const existingIds = new Set(relevantPrayers.map((p) => p.id));
    const newPrayers = newSequence.prayers.filter((p) => !existingIds.has(p.id));

    const mergedPrayers = [...relevantPrayers, ...newPrayers].sort(
      (a, b) => a.datetime.getTime() - b.datetime.getTime()
    );

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
