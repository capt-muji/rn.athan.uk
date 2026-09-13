/**
 * Schedule store - prayer sequence management
 * Uses the prayer-centric sequence model
 *
 * Which row is next, which list is on screen and when that changes are decided by the pure rules in
 * shared/sequence.ts; this store only holds the sequence and applies them to it.
 *
 * @see ai/adr/005-timing-system-overhaul.md
 * @see ai/features/uat-2/DASHES-DESIGN.md
 */

import { type Atom, atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import { TIME_CONSTANTS } from '@/shared/constants';
import logger from '@/shared/logger';
import * as PrayerUtils from '@/shared/prayer';
import {
  compareListOrder,
  getNextBoundary as findNextBoundary,
  findNextReadable,
  findPreviousReadable,
  isReadable,
  resolveDisplayDate,
} from '@/shared/sequence';
import * as TimeUtils from '@/shared/time';
import { type Prayer, type PrayerSequence, type ReadablePrayer, ScheduleType } from '@/shared/types';

const store = getDefaultStore();

/**
 * Most list days a sequence grows to while it has no readable row still to come
 *
 * Two weeks outlasts any realistic gap in the provider's data, and bounds the work when storage holds
 * nothing readable at all.
 */
const MAX_SEQUENCE_DAYS = 14;

// --- Sequence Atoms (Prayer-Centric Model) ---

/** Standard schedule prayer sequence (null until initialized) */
export const standardSequenceAtom = atom<PrayerSequence | null>(null);

/** Extra schedule prayer sequence (null until initialized) */
export const extraSequenceAtom = atom<PrayerSequence | null>(null);

/** Helper to get the sequence atom for a schedule type */
export const getSequenceAtom = (type: ScheduleType) => {
  return type === ScheduleType.Standard ? standardSequenceAtom : extraSequenceAtom;
};

// --- Helper Functions ---

/**
 * The row the countdown bar measures from
 *
 * Looked for in the sequence first. When it holds none, the list before next's is built from storage with
 * the same builder as the sequence, so a post-midnight Isha comes back at its own instant rather than 24
 * hours early (gap map L3). When that list has no readable row either, as on a 1 January whose 31
 * December is not stored or after a day with no readable time, there is nothing to measure from and the
 * bar cannot be worked out (R13, R14).
 *
 * @param type Schedule type (Standard or Extra)
 * @param prayers The stored sequence
 * @param next The next readable row
 * @returns The latest readable row before next, or null when there is none
 */
const findPreviousPrayer = (type: ScheduleType, prayers: Prayer[], next: ReadablePrayer): ReadablePrayer | null => {
  const inSequence = findPreviousReadable(prayers, next);
  if (inSequence) return inSequence;

  const listBefore = TimeUtils.getPreviousDateString(next.belongsToDate);
  const fromStorage = findPreviousReadable(PrayerUtils.createPrayersForDate(type, listBefore), next);

  if (!fromStorage) {
    logger.info('SCHEDULE: No readable row before next, progress bar unavailable', {
      type,
      next: next.english,
      listBefore,
    });
  }

  return fromStorage;
};

/**
 * Adds list days after the last one until a readable row is still to come, up to MAX_SEQUENCE_DAYS
 *
 * A run of days with no readable time (a week missing from storage) would otherwise leave nothing to count
 * down to, and the countdown would disappear until the list reached the far side of the gap.
 *
 * @param type Schedule type (Standard or Extra)
 * @param prayers A sequence in list order
 * @param now Current instant
 * @returns The same rows, followed by any days added
 */
const extendUntilReadable = (type: ScheduleType, prayers: Prayer[], now: Date): Prayer[] => {
  // No list day to continue from
  if (prayers.length === 0) return prayers;

  const extended = [...prayers];
  const listDays = new Set(extended.map((prayer) => prayer.belongsToDate));
  let lastListDay = extended[extended.length - 1].belongsToDate;

  while (!findNextReadable(extended, now) && listDays.size < MAX_SEQUENCE_DAYS) {
    lastListDay = TimeUtils.addDaysToDateString(lastListDay, 1);
    extended.push(...PrayerUtils.createPrayersForDate(type, lastListDay));
    listDays.add(lastListDay);
  }

  return extended;
};

// --- Derived Selector Atoms ---

/**
 * Creates a derived atom that returns the next upcoming prayer
 *
 * The readable row with the earliest instant after now. A row with no readable time is never next.
 *
 * Like every atom here, it depends on the sequence alone, so its answer is worked out when the sequence
 * changes and then held until the next refresh, even as the clock moves on.
 *
 * @param type Schedule type (Standard or Extra)
 * @returns Derived atom resolving to the next readable prayer, or null
 *
 * @see getNextPrayer - Direct accessor for imperative code
 */
export const createNextPrayerAtom = (type: ScheduleType) => {
  return atom((get) => {
    const sequence = get(getSequenceAtom(type));
    if (!sequence) return null;

    return findNextReadable(sequence.prayers, TimeUtils.createInstant());
  });
};

/**
 * Creates a derived atom that returns the previous prayer (before next)
 *
 * Used for progress bar calculation to show elapsed time since last prayer.
 *
 * @param type Schedule type (Standard or Extra)
 * @returns Derived atom resolving to the latest readable prayer before next, or null when there is no
 * next prayer or nothing readable to measure from
 *
 * @see findPreviousPrayer - Where the list before comes from when the sequence does not hold it
 * @see getPrevPrayer - Direct accessor for imperative code
 */
export const createPrevPrayerAtom = (type: ScheduleType) => {
  return atom((get) => {
    const sequence = get(getSequenceAtom(type));
    if (!sequence) return null;

    const next = findNextReadable(sequence.prayers, TimeUtils.createInstant());
    if (!next) return null;

    return findPreviousPrayer(type, sequence.prayers, next);
  });
};

/**
 * Creates a derived atom that returns the display date
 *
 * The earliest list day with a readable row still to come, or a list day with no readable row at all
 * until 00:00 London at its end (resolveDisplayDate). This can differ from the calendar date due to
 * Islamic day boundaries:
 * - Isha at 1am on Jan 19 calendar date belongs to Jan 18 Islamic day
 * - Midnight at 23:17 on Jan 18 calendar date belongs to Jan 19 Islamic day
 *
 * Null when nothing in the sequence is still to come. A day that is not stored is a list of rows with no
 * readable time, so on the evening of 31 December before next year is published this is 1 January, held
 * on screen, rather than null. Consumers already handle null, which matches the no-sequence branch.
 *
 * @param type Schedule type (Standard or Extra)
 * @returns Derived atom resolving to date string (YYYY-MM-DD) | null
 *
 * @see getDisplayDate - Direct accessor for imperative code
 * @see ADR-004 - Islamic day boundary handling
 *
 * @example
 * // At 2am on Jan 19 (before Fajr), Standard schedule:
 * // Returns: "2026-01-18" (belongs to previous Islamic day)
 */
export const createDisplayDateAtom = (type: ScheduleType) => {
  return atom((get) => {
    const sequence = get(getSequenceAtom(type));
    if (!sequence) return null;

    return resolveDisplayDate(sequence.prayers, TimeUtils.createInstant());
  });
};

/** The earlier of two instants, either of which may be missing */
const earlierOf = (a: Date | null, b: Date | null): Date | null => {
  if (!a || !b) return a ?? b;
  return a < b ? a : b;
};

/**
 * Creates a derived atom that returns the next moment what the schedule shows changes: its next readable
 * prayer, or 00:00 London ending a list day on screen with no readable row
 *
 * Must stay a derived atom held until the sequence changes. The countdown ticker transitions when the
 * clock reaches this instant, and worked out afresh at that moment it would already be behind, giving the
 * boundary after it, so the list would never move on.
 *
 * Never later than the next-prayer atom's own instant. Both are worked out on their first read after the
 * sequence changes, and those reads can fall either side of a prayer: the countdown bar keeps the next
 * prayer subscribed, so it is worked out the moment a sync writes new data, while this may not be read
 * until the countdown restarts. Read after the prayer, the boundary alone would name the one after it while
 * the countdown still showed the passed prayer at 1s, and nothing would move on until then.
 *
 * @param type Schedule type (Standard or Extra)
 * @param nextPrayerAtom The same schedule's next-prayer atom
 * @returns Derived atom resolving to the boundary instant, or null when nothing is still to come
 */
const createNextBoundaryAtom = (type: ScheduleType, nextPrayerAtom: Atom<ReadablePrayer | null>) => {
  return atom((get) => {
    const sequence = get(getSequenceAtom(type));
    if (!sequence) return null;

    const boundary = findNextBoundary(sequence.prayers, TimeUtils.createInstant());
    return earlierOf(get(nextPrayerAtom)?.datetime ?? null, boundary);
  });
};

// Pre-created derived atoms for convenience
export const standardNextPrayerAtom = createNextPrayerAtom(ScheduleType.Standard);
export const extraNextPrayerAtom = createNextPrayerAtom(ScheduleType.Extra);
export const standardPrevPrayerAtom = createPrevPrayerAtom(ScheduleType.Standard);
export const extraPrevPrayerAtom = createPrevPrayerAtom(ScheduleType.Extra);
export const standardDisplayDateAtom = createDisplayDateAtom(ScheduleType.Standard);
export const extraDisplayDateAtom = createDisplayDateAtom(ScheduleType.Extra);
const standardNextBoundaryAtom = createNextBoundaryAtom(ScheduleType.Standard, standardNextPrayerAtom);
const extraNextBoundaryAtom = createNextBoundaryAtom(ScheduleType.Extra, extraNextPrayerAtom);

// --- Actions ---

/**
 * Identity of a prayer within a sequence: which prayer, on which Islamic day.
 *
 * Not the instant. A day has exactly one Fajr however its time is later
 * corrected, and createPrayerSequence emits each name at most once per day it
 * builds, with belongsToDate always equal to that day — the date-shifting pair
 * adjustPrayerDateForMidnightCrossing/calculateBelongsToDate move the INSTANT
 * across midnight and then hand the grouping back. Verified over the 2024
 * London year (2,928 sequences, 40,692 rows, zero collisions) and over a
 * synthetic >60N block whose Magrib and Isha both fall after midnight.
 */
const prayerIdentity = (prayer: Prayer): string => `${prayer.english}_${prayer.belongsToDate}`;

/**
 * Signature identifying a sequence's content, used by setSequence to skip identical writes.
 *
 * Every row, not just the ends: a corrected time on any prayer between them was
 * invisible to a length-plus-endpoints signature, so the store went on serving the stale
 * sequence until something else happened to rebuild it. Joining ~18 entries is still far
 * cheaper than the row re-render pass the skip exists to avoid, and length is implied by
 * the join, so a Friday gaining Istijaba still differs.
 *
 * Each row is its identity and its instant, or '-' for a row with no readable time. The
 * identity is what keeps an unreadable row's place in the signature, so the same unreadable
 * row rebuilt is still identical and skipped, while a row losing or regaining its time is a
 * change and written.
 */
const sequenceSignature = (sequence: PrayerSequence): string =>
  sequence.prayers
    .map((prayer) => `${prayerIdentity(prayer)}@${isReadable(prayer) ? prayer.datetime.getTime() : '-'}`)
    .join('|');

/**
 * Sets the prayer sequence for a schedule type
 * Creates a 3-day buffer of prayers starting from the given date, extended while it has no readable row
 * still to come (extendUntilReadable)
 *
 * Identical writes are skipped: the cache bootstrap hydrates sequences before
 * first paint and sync() rebuilds them afterwards — when both produce the same
 * sequence (warm cache), skipping the store.set avoids a full row re-render
 * pass that no pixel ever sees (perf22 render audit: rows rendered ~2.4x at
 * launch pre-skip)
 *
 * @param type Schedule type (Standard or Extra)
 * @param date Start date for the sequence
 */
export const setSequence = (type: ScheduleType, date: Date): void => {
  const sequenceAtom = getSequenceAtom(type);
  const built = PrayerUtils.createPrayerSequence(type, date, 3);
  const sequence: PrayerSequence = {
    type,
    prayers: extendUntilReadable(type, built.prayers, TimeUtils.createInstant()),
  };

  const current = store.get(sequenceAtom);
  if (current && sequenceSignature(current) === sequenceSignature(sequence)) {
    logger.info('SEQUENCE: Set sequence skipped (identical)', {
      type,
      startDate: TimeUtils.formatDateShort(date),
      prayerCount: sequence.prayers.length,
    });
    return;
  }

  store.set(sequenceAtom, sequence);

  logger.info('SEQUENCE: Set sequence', {
    type,
    startDate: TimeUtils.formatDateShort(date),
    prayerCount: sequence.prayers.length,
  });
};

/**
 * Helper: Filter prayers to keep only relevant ones
 *
 * Keeps readable rows still to come, the previous readable row (for the progress bar: Isha→Fajr), and
 * every row of the list day on screen and of the list days after it. Those rows are kept or dropped by
 * their list day as a whole, because a row with no readable time can never be "still to come": dropped
 * by time, a later day with no readable row would vanish and be skipped (R8), and a list on screen would
 * lose its unreadable rows. An earlier list day keeps nothing but the previous row.
 *
 * @param prayers The sequence
 * @param now Current instant
 * @param currentDisplayDate The list day on screen, or null when nothing is still to come
 * @param previous The previous readable row, or null
 */
function filterRelevantPrayers(
  prayers: Prayer[],
  now: Date,
  currentDisplayDate: string | null,
  previous: ReadablePrayer | null
): Prayer[] {
  return prayers.filter((prayer) => {
    if (isReadable(prayer) && prayer.datetime > now) return true;
    if (prayer === previous) return true;
    return currentDisplayDate !== null && prayer.belongsToDate >= currentDisplayDate;
  });
}

/**
 * Helper: Check if we need to fetch more prayers
 * Returns true if less than 24 hours of prayer buffer remains
 *
 * Measured by the latest readable row, since a row with no readable time says nothing about how far the
 * buffer reaches; a buffer with no readable row at all always fetches.
 */
function shouldFetchMorePrayers(prayers: Prayer[], now: Date): boolean {
  const instants = prayers.filter(isReadable).map((prayer) => prayer.datetime.getTime());
  return instants.length === 0 || Math.max(...instants) - now.getTime() < TIME_CONSTANTS.ONE_DAY_MS;
}

/**
 * Helper: Merge existing and new prayers, removing duplicates
 *
 * The cache-derived copy wins. Keying on the instant instead let a prayer whose
 * time changed between the in-memory sequence and the rebuild survive as two
 * rows — the same prayer rendered twice for one day, with the countdown aimed
 * at the stale one. The rebuild just read storage, so where the two disagree it
 * is the corrected copy (same reasoning as the sequence signature in #13).
 *
 * Sorted into list order, not by instant: a row with no readable time has no instant to sort by.
 */
function mergeAndDeduplicatePrayers(existingPrayers: Prayer[], newPrayers: Prayer[]): Prayer[] {
  const byIdentity = new Map<string, Prayer>();

  for (const prayer of existingPrayers) byIdentity.set(prayerIdentity(prayer), prayer);
  for (const prayer of newPrayers) byIdentity.set(prayerIdentity(prayer), prayer);

  return [...byIdentity.values()].sort(compareListOrder);
}

/**
 * Refreshes the prayer sequence by removing passed prayers and fetching more if needed
 * Called when a boundary passes (a prayer, or the end of a list day held on screen) to keep the sequence
 * fresh
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

  const now = TimeUtils.createInstant();

  const currentDisplayDate = resolveDisplayDate(sequence.prayers, now);
  const next = findNextReadable(sequence.prayers, now);
  const previous = next ? findPreviousReadable(sequence.prayers, next) : null;

  // Filter relevant prayers using helper
  const relevantPrayers = filterRelevantPrayers(sequence.prayers, now, currentDisplayDate, previous);

  // Check if we need to fetch more prayers using helper
  if (shouldFetchMorePrayers(relevantPrayers, now)) {
    // Normally the buffer still holds today's list and only the days after it
    // are missing. After a long suspension nothing from today on may be left,
    // and then today's remaining prayers must come back too, not only tomorrow's
    const today = TimeUtils.getTodayDateString();
    const reachesToday = relevantPrayers.some((prayer) => prayer.belongsToDate >= today);
    const firstNewDay = reachesToday ? TimeUtils.addDaysToDateString(today, 1) : today;
    const firstNewDayAnchor = TimeUtils.getDayAnchor(firstNewDay);

    const newSequence = PrayerUtils.createPrayerSequence(type, firstNewDayAnchor, 3);

    // Merge and deduplicate using helper
    const mergedPrayers = extendUntilReadable(
      type,
      mergeAndDeduplicatePrayers(relevantPrayers, newSequence.prayers),
      now
    );

    store.set(sequenceAtom, { type, prayers: mergedPrayers });

    logger.info('SEQUENCE: Refreshed with new prayers', {
      type,
      firstNewDay,
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
 * @returns Next readable prayer or null if sequence not initialized or nothing readable is still to come
 *
 * @example
 * const next = getNextPrayer(ScheduleType.Standard);
 * if (!next) {
 *   refreshSequence(type);
 *   // Then retry or handle loading state
 * }
 */
export const getNextPrayer = (type: ScheduleType): ReadablePrayer | null => {
  const nextPrayerAtom = type === ScheduleType.Standard ? standardNextPrayerAtom : extraNextPrayerAtom;
  return store.get(nextPrayerAtom);
};

/**
 * Gets the previous prayer (before the next upcoming prayer)
 * Used for progress bar calculation
 *
 * @param type Schedule type (Standard or Extra)
 * @returns Previous readable prayer or null if not available
 */
export const getPrevPrayer = (type: ScheduleType): ReadablePrayer | null => {
  const prevPrayerAtom = type === ScheduleType.Standard ? standardPrevPrayerAtom : extraPrevPrayerAtom;
  return store.get(prevPrayerAtom);
};

/**
 * Gets the current display date for a schedule
 *
 * @param type Schedule type (Standard or Extra)
 * @returns Display date string (YYYY-MM-DD) or null
 */
export const getDisplayDate = (type: ScheduleType): string | null => {
  const displayDateAtom = type === ScheduleType.Standard ? standardDisplayDateAtom : extraDisplayDateAtom;
  return store.get(displayDateAtom);
};

/**
 * Gets the next moment what a schedule shows changes: its next readable prayer, or 00:00 London ending a
 * list day on screen with no readable row
 *
 * The one boundary the countdown ticker, the foreground resync and the overlay's open guard and close
 * deadline all compare the clock against, so the list cannot change day under any of them unannounced.
 *
 * @param type Schedule type (Standard or Extra)
 * @returns The boundary instant, or null when there is no sequence or nothing is still to come
 */
export const getNextBoundary = (type: ScheduleType): Date | null => {
  const nextBoundaryAtom = type === ScheduleType.Standard ? standardNextBoundaryAtom : extraNextBoundaryAtom;
  return store.get(nextBoundaryAtom);
};
