/**
 * TIMING SYSTEM SCHEMA REFERENCE
 *
 * This file documents the data structures for the timing system overhaul.
 * It shows the transformation from API response → MMKV storage → Runtime state.
 *
 * KEY INSIGHT: The new system uses full DateTime objects instead of separate
 * date/time strings, eliminating midnight-crossing bugs.
 *
 * @see ai/adr/005-timing-system-overhaul.md
 * @see ai/features/timing-system-overhaul/
 */

import { ScheduleType } from '@/shared/types';

// =============================================================================
// SECTION 1: CURRENT SYSTEM (Date-Centric) - FOR REFERENCE
// =============================================================================

/**
 * CURRENT: How prayers are stored (separate date and time strings)
 *
 * THE PROBLEM: At 11pm, isTimePassed("01:00") returns TRUE because it
 * compares 23:00 > 01:00 without considering the date.
 */
export interface ITransformedPrayerCurrent {
  index: number;
  date: string; // "2026-01-18" - calendar date
  english: string; // "Fajr"
  arabic: string; // "الفجر"
  time: string; // "06:12" - time only, NO DATE
  type: ScheduleType;
}

/**
 * CURRENT: Schedule store with yesterday/today/tomorrow maps
 *
 * THE PROBLEM: After Isha passes, schedule.today contains TOMORROW's data.
 * The variable name "today" lies.
 */
export interface ScheduleStoreCurrent {
  type: ScheduleType;
  yesterday: { [index: number]: ITransformedPrayerCurrent };
  today: { [index: number]: ITransformedPrayerCurrent };
  tomorrow: { [index: number]: ITransformedPrayerCurrent };
  nextIndex: number; // Manually incremented: 0, 1, 2, 3, 4, 5, 0...
}

/**
 * EXAMPLE: Current system at 10:00am on January 18
 */
export const CURRENT_SYSTEM_EXAMPLE: ScheduleStoreCurrent = {
  type: ScheduleType.Standard,
  yesterday: {
    0: { index: 0, date: '2026-01-17', english: 'Fajr', arabic: 'الفجر', time: '06:10', type: ScheduleType.Standard },
    1: {
      index: 1,
      date: '2026-01-17',
      english: 'Sunrise',
      arabic: 'الشروق',
      time: '07:45',
      type: ScheduleType.Standard,
    },
    2: { index: 2, date: '2026-01-17', english: 'Dhuhr', arabic: 'الظهر', time: '12:14', type: ScheduleType.Standard },
    3: { index: 3, date: '2026-01-17', english: 'Asr', arabic: 'العصر', time: '14:15', type: ScheduleType.Standard },
    4: {
      index: 4,
      date: '2026-01-17',
      english: 'Maghrib',
      arabic: 'المغرب',
      time: '16:45',
      type: ScheduleType.Standard,
    },
    5: { index: 5, date: '2026-01-17', english: 'Isha', arabic: 'العشاء', time: '18:15', type: ScheduleType.Standard },
  },
  today: {
    0: { index: 0, date: '2026-01-18', english: 'Fajr', arabic: 'الفجر', time: '06:12', type: ScheduleType.Standard },
    1: {
      index: 1,
      date: '2026-01-18',
      english: 'Sunrise',
      arabic: 'الشروق',
      time: '07:48',
      type: ScheduleType.Standard,
    },
    2: { index: 2, date: '2026-01-18', english: 'Dhuhr', arabic: 'الظهر', time: '12:14', type: ScheduleType.Standard },
    3: { index: 3, date: '2026-01-18', english: 'Asr', arabic: 'العصر', time: '14:15', type: ScheduleType.Standard },
    4: {
      index: 4,
      date: '2026-01-18',
      english: 'Maghrib',
      arabic: 'المغرب',
      time: '16:45',
      type: ScheduleType.Standard,
    },
    5: { index: 5, date: '2026-01-18', english: 'Isha', arabic: 'العشاء', time: '18:15', type: ScheduleType.Standard },
  },
  tomorrow: {
    0: { index: 0, date: '2026-01-19', english: 'Fajr', arabic: 'الفجر', time: '06:14', type: ScheduleType.Standard },
    1: {
      index: 1,
      date: '2026-01-19',
      english: 'Sunrise',
      arabic: 'الشروق',
      time: '07:50',
      type: ScheduleType.Standard,
    },
    2: { index: 2, date: '2026-01-19', english: 'Dhuhr', arabic: 'الظهر', time: '12:14', type: ScheduleType.Standard },
    3: { index: 3, date: '2026-01-19', english: 'Asr', arabic: 'العصر', time: '14:16', type: ScheduleType.Standard },
    4: {
      index: 4,
      date: '2026-01-19',
      english: 'Maghrib',
      arabic: 'المغرب',
      time: '16:46',
      type: ScheduleType.Standard,
    },
    5: { index: 5, date: '2026-01-19', english: 'Isha', arabic: 'العشاء', time: '18:16', type: ScheduleType.Standard },
  },
  nextIndex: 2, // Dhuhr is next (Fajr and Sunrise have passed)
};

// =============================================================================
// SECTION 2: NEW SYSTEM (Prayer-Centric) - THE SOLUTION
// =============================================================================

/**
 * NEW: Prayer with full datetime object
 *
 * THE FIX: datetime is a full moment in time, so datetime > now is ALWAYS correct.
 * No midnight-crossing bugs possible.
 */
export interface Prayer {
  /** Unique identifier: "standard_fajr_2026-01-18" */
  id: string;

  /** Schedule type: 'standard' or 'extra' */
  type: ScheduleType;

  /** English name: "Fajr", "Isha", "Midnight", etc. */
  english: string;

  /** Arabic name: "الفجر", "العشاء", etc. */
  arabic: string;

  /**
   * FULL DATETIME - The actual moment in time
   *
   * This is the key difference from the current system.
   * Instead of { date: "2026-06-22", time: "01:00" }
   * We have:   datetime: new Date("2026-06-22T01:00:00")
   *
   * Comparisons are now trivial:
   * - isPassed = datetime < now
   * - isNext = datetime > now
   * - countdown = datetime - now
   */
  datetime: Date;

  /**
   * Original time string (for display purposes)
   * Kept for backward compatibility with UI components
   */
  time: string;

  /**
   * Which Islamic day this prayer belongs to (per ADR-004)
   *
   * IMPORTANT: This is NOT always the calendar date of the datetime!
   *
   * Example: Summer London, Isha at 1am on June 22
   * - datetime: 2026-06-22T01:00:00 (actual moment)
   * - belongsToDate: "2026-06-21" (Islamic day it belongs to)
   *
   * This is used for:
   * - Display date in the UI
   * - Grouping prayers by Islamic day
   */
  belongsToDate: string;
}

/**
 * NEW: Serialized prayer for MMKV storage
 *
 * JavaScript Date objects cannot be stored in MMKV directly.
 * We convert datetime to ISO string before storage.
 */
export interface StoredPrayer {
  id: string;
  type: ScheduleType;
  english: string;
  arabic: string;
  datetime: string; // ISO string: "2026-01-18T06:12:00.000Z"
  time: string;
  belongsToDate: string;
}

/**
 * NEW: Prayer sequence - single sorted array
 *
 * Replaces the yesterday/today/tomorrow structure.
 * Contains 48-72 hours of prayers, sorted by datetime.
 */
export interface PrayerSequence {
  /** Schedule type: 'standard' or 'extra' */
  type: ScheduleType;

  /** Prayers sorted by datetime, next 48-72 hours */
  prayers: Prayer[];
}

/**
 * NEW: Serialized sequence for MMKV storage
 */
export interface StoredPrayerSequence {
  type: ScheduleType;
  prayers: StoredPrayer[];
}

// =============================================================================
// SECTION 3: REAL-WORLD EXAMPLES
// =============================================================================

/**
 * EXAMPLE 1: Winter day (normal case)
 *
 * Date: January 18, 2026 (Saturday)
 * Time: 10:00am
 * Scenario: Normal winter day, all prayers within same calendar day
 */
export const EXAMPLE_WINTER_STANDARD: Prayer[] = [
  // Yesterday's Isha (for ProgressBar calculation)
  {
    id: 'standard_isha_2026-01-17',
    type: ScheduleType.Standard,
    english: 'Isha',
    arabic: 'العشاء',
    datetime: new Date('2026-01-17T18:15:00'),
    time: '18:15',
    belongsToDate: '2026-01-17',
  },
  // Today's prayers
  {
    id: 'standard_fajr_2026-01-18',
    type: ScheduleType.Standard,
    english: 'Fajr',
    arabic: 'الفجر',
    datetime: new Date('2026-01-18T06:12:00'),
    time: '06:12',
    belongsToDate: '2026-01-18',
  },
  {
    id: 'standard_sunrise_2026-01-18',
    type: ScheduleType.Standard,
    english: 'Sunrise',
    arabic: 'الشروق',
    datetime: new Date('2026-01-18T07:48:00'),
    time: '07:48',
    belongsToDate: '2026-01-18',
  },
  {
    id: 'standard_dhuhr_2026-01-18',
    type: ScheduleType.Standard,
    english: 'Dhuhr',
    arabic: 'الظهر',
    datetime: new Date('2026-01-18T12:14:00'),
    time: '12:14',
    belongsToDate: '2026-01-18',
  },
  {
    id: 'standard_asr_2026-01-18',
    type: ScheduleType.Standard,
    english: 'Asr',
    arabic: 'العصر',
    datetime: new Date('2026-01-18T14:15:00'),
    time: '14:15',
    belongsToDate: '2026-01-18',
  },
  {
    id: 'standard_maghrib_2026-01-18',
    type: ScheduleType.Standard,
    english: 'Maghrib',
    arabic: 'المغرب',
    datetime: new Date('2026-01-18T16:45:00'),
    time: '16:45',
    belongsToDate: '2026-01-18',
  },
  {
    id: 'standard_isha_2026-01-18',
    type: ScheduleType.Standard,
    english: 'Isha',
    arabic: 'العشاء',
    datetime: new Date('2026-01-18T18:15:00'),
    time: '18:15',
    belongsToDate: '2026-01-18',
  },
  // Tomorrow's prayers
  {
    id: 'standard_fajr_2026-01-19',
    type: ScheduleType.Standard,
    english: 'Fajr',
    arabic: 'الفجر',
    datetime: new Date('2026-01-19T06:14:00'),
    time: '06:14',
    belongsToDate: '2026-01-19',
  },
  // ... more prayers for 48-72 hour window
];

/**
 * EXAMPLE 2: Summer day with Isha AFTER midnight (CRITICAL EDGE CASE)
 *
 * Date: June 21, 2026 (Saturday)
 * Time: 11:00pm
 * Scenario: London summer, Isha is at 1:00am the next calendar day
 *
 * THIS IS THE BUG THE NEW SYSTEM FIXES:
 * - Current system: isTimePassed("01:00") at 23:00 returns TRUE (WRONG!)
 * - New system: datetime > now returns TRUE (CORRECT!)
 */
export const EXAMPLE_SUMMER_ISHA_AFTER_MIDNIGHT: Prayer[] = [
  // Earlier prayers from June 21
  {
    id: 'standard_fajr_2026-06-21',
    type: ScheduleType.Standard,
    english: 'Fajr',
    arabic: 'الفجر',
    datetime: new Date('2026-06-21T02:45:00'),
    time: '02:45',
    belongsToDate: '2026-06-21',
  },
  {
    id: 'standard_sunrise_2026-06-21',
    type: ScheduleType.Standard,
    english: 'Sunrise',
    arabic: 'الشروق',
    datetime: new Date('2026-06-21T04:43:00'),
    time: '04:43',
    belongsToDate: '2026-06-21',
  },
  {
    id: 'standard_dhuhr_2026-06-21',
    type: ScheduleType.Standard,
    english: 'Dhuhr',
    arabic: 'الظهر',
    datetime: new Date('2026-06-21T13:02:00'),
    time: '13:02',
    belongsToDate: '2026-06-21',
  },
  {
    id: 'standard_asr_2026-06-21',
    type: ScheduleType.Standard,
    english: 'Asr',
    arabic: 'العصر',
    datetime: new Date('2026-06-21T17:17:00'),
    time: '17:17',
    belongsToDate: '2026-06-21',
  },
  {
    id: 'standard_maghrib_2026-06-21',
    type: ScheduleType.Standard,
    english: 'Maghrib',
    arabic: 'المغرب',
    datetime: new Date('2026-06-21T21:21:00'),
    time: '21:21',
    belongsToDate: '2026-06-21',
  },
  /**
   * CRITICAL: Isha at 1am on June 22, but belongs to June 21's schedule
   *
   * At 11pm on June 21:
   * - datetime = 2026-06-22T01:00:00
   * - now = 2026-06-21T23:00:00
   * - datetime > now = TRUE (Isha is upcoming, 2 hours away)
   *
   * The OLD system would compare:
   * - isTimePassed("01:00") at 23:00
   * - 23 > 1 = TRUE (WRONG! Isha is still 2 hours away!)
   */
  {
    id: 'standard_isha_2026-06-21',
    type: ScheduleType.Standard,
    english: 'Isha',
    arabic: 'العشاء',
    datetime: new Date('2026-06-22T01:00:00'), // NOTE: June 22 at 1am!
    time: '01:00',
    belongsToDate: '2026-06-21', // But belongs to June 21's Islamic day
  },
  // Next day's prayers
  {
    id: 'standard_fajr_2026-06-22',
    type: ScheduleType.Standard,
    english: 'Fajr',
    arabic: 'الفجر',
    datetime: new Date('2026-06-22T02:47:00'),
    time: '02:47',
    belongsToDate: '2026-06-22',
  },
  // ... more prayers
];

/**
 * EXAMPLE 3: Extras schedule with Midnight prayer AFTER system midnight (CRITICAL)
 *
 * Date: June 21, 2026 (Saturday)
 * Time: 11:30pm
 * Scenario: Summer, Midnight prayer is at 12:30am (after system midnight)
 *
 * The Midnight prayer is calculated as: (Maghrib + Fajr) / 2
 * In summer: Maghrib 21:21, Fajr 02:47 → Midnight ≈ 00:04
 */
export const EXAMPLE_SUMMER_EXTRAS_MIDNIGHT_AFTER_00: Prayer[] = [
  // Yesterday's Duha (for context)
  {
    id: 'extra_duha_2026-06-20',
    type: ScheduleType.Extra,
    english: 'Duha',
    arabic: 'الضحى',
    datetime: new Date('2026-06-20T05:03:00'),
    time: '05:03',
    belongsToDate: '2026-06-20',
  },
  /**
   * CRITICAL: Midnight prayer at 00:04 on June 22
   *
   * At 11:30pm on June 21:
   * - datetime = 2026-06-22T00:04:00
   * - now = 2026-06-21T23:30:00
   * - datetime > now = TRUE (Midnight is 34 minutes away)
   *
   * The OLD system would fail:
   * - isTimePassed("00:04") at 23:30
   * - 23 > 0 = TRUE (WRONG!)
   */
  {
    id: 'extra_midnight_2026-06-21',
    type: ScheduleType.Extra,
    english: 'Midnight',
    arabic: 'منتصف الليل',
    datetime: new Date('2026-06-22T00:04:00'), // NOTE: June 22 at 00:04!
    time: '00:04',
    belongsToDate: '2026-06-21', // Belongs to June 21's Extras
  },
  {
    id: 'extra_lastthird_2026-06-21',
    type: ScheduleType.Extra,
    english: 'Last Third',
    arabic: 'الثلث الأخير',
    datetime: new Date('2026-06-22T01:38:00'),
    time: '01:38',
    belongsToDate: '2026-06-21',
  },
  {
    id: 'extra_suhoor_2026-06-21',
    type: ScheduleType.Extra,
    english: 'Suhoor',
    arabic: 'السحور',
    datetime: new Date('2026-06-22T02:07:00'),
    time: '02:07',
    belongsToDate: '2026-06-21',
  },
  /**
   * Duha at 05:03 on June 22, but belongs to June 21's Extras schedule
   *
   * WHY: The Extras Islamic day starts AFTER Duha passes.
   * So Duha at 05:03 on June 22 is the FINAL prayer of June 21's Extras schedule.
   * Once Duha passes, the Extras schedule advances to June 22.
   *
   * This is analogous to how Standard's Isha at 01:00 on June 22
   * belongs to June 21's Standard schedule.
   */
  {
    id: 'extra_duha_2026-06-21',
    type: ScheduleType.Extra,
    english: 'Duha',
    arabic: 'الضحى',
    datetime: new Date('2026-06-22T05:03:00'),
    time: '05:03',
    belongsToDate: '2026-06-21',
  },
  // Next day's Extras (after Duha advances)
  {
    id: 'extra_midnight_2026-06-22',
    type: ScheduleType.Extra,
    english: 'Midnight',
    arabic: 'منتصف الليل',
    datetime: new Date('2026-06-23T00:05:00'),
    time: '00:05',
    belongsToDate: '2026-06-22',
  },
  // ... more prayers
];

/**
 * EXAMPLE 4: Full PrayerSequence object
 *
 * This is what's stored in the Jotai atom and used by components.
 */
export const EXAMPLE_FULL_SEQUENCE: PrayerSequence = {
  type: ScheduleType.Standard,
  prayers: EXAMPLE_WINTER_STANDARD,
};

/**
 * EXAMPLE 5: Friday Extras with Istijaba (day boundary edge case)
 *
 * Date: January 24, 2026 (Friday)
 * Time: 11:00am
 * Scenario: On Fridays, Istijaba is added as the 5th prayer.
 *           The day advances AFTER Istijaba, not after Duha.
 *
 * IMPORTANT: On Friday, Duha does NOT advance the day - Istijaba does!
 * This means Duha's belongsToDate is the SAME as the other night prayers,
 * because they're all waiting for Istijaba to pass.
 */
export const EXAMPLE_FRIDAY_EXTRAS_WITH_ISTIJABA: Prayer[] = [
  // Previous day's Istijaba (for context - this is when Jan 23's Extras ended)
  {
    id: 'extra_istijaba_2026-01-23',
    type: ScheduleType.Extra,
    english: 'Istijaba',
    arabic: 'الإستجابة',
    datetime: new Date('2026-01-23T12:30:00'),
    time: '12:30',
    belongsToDate: '2026-01-23',
  },
  // January 24 (Friday) Extras - all belong to Jan 24
  {
    id: 'extra_midnight_2026-01-24',
    type: ScheduleType.Extra,
    english: 'Midnight',
    arabic: 'منتصف الليل',
    datetime: new Date('2026-01-23T23:15:00'), // Night of Jan 23 → morning of Jan 24
    time: '23:15',
    belongsToDate: '2026-01-24', // Belongs to Friday's Extras
  },
  {
    id: 'extra_lastthird_2026-01-24',
    type: ScheduleType.Extra,
    english: 'Last Third',
    arabic: 'الثلث الأخير',
    datetime: new Date('2026-01-24T02:40:00'),
    time: '02:40',
    belongsToDate: '2026-01-24',
  },
  {
    id: 'extra_suhoor_2026-01-24',
    type: ScheduleType.Extra,
    english: 'Suhoor',
    arabic: 'السحور',
    datetime: new Date('2026-01-24T05:32:00'),
    time: '05:32',
    belongsToDate: '2026-01-24',
  },
  /**
   * On Friday, Duha is NOT the day boundary - Istijaba is.
   * So Duha's belongsToDate is Jan 24, same as the night prayers.
   */
  {
    id: 'extra_duha_2026-01-24',
    type: ScheduleType.Extra,
    english: 'Duha',
    arabic: 'الضحى',
    datetime: new Date('2026-01-24T08:08:00'),
    time: '08:08',
    belongsToDate: '2026-01-24', // Same as night prayers (Istijaba is day boundary)
  },
  /**
   * ISTIJABA: The day boundary on Fridays
   *
   * After Istijaba passes at 12:30, the Extras schedule advances to Jan 25.
   * This is similar to how Duha is the day boundary on non-Fridays.
   */
  {
    id: 'extra_istijaba_2026-01-24',
    type: ScheduleType.Extra,
    english: 'Istijaba',
    arabic: 'الإستجابة',
    datetime: new Date('2026-01-24T12:30:00'),
    time: '12:30',
    belongsToDate: '2026-01-24', // FINAL prayer of Friday's Extras
  },
  // After Istijaba passes, schedule advances to Saturday (Jan 25)
  {
    id: 'extra_midnight_2026-01-25',
    type: ScheduleType.Extra,
    english: 'Midnight',
    arabic: 'منتصف الليل',
    datetime: new Date('2026-01-24T23:20:00'), // Night of Jan 24
    time: '23:20',
    belongsToDate: '2026-01-25', // Belongs to Saturday's Extras
  },
  // ... more prayers
];

/**
 * EXAMPLE 6: Empty sequence handling
 *
 * Scenario: All prayers in sequence have passed (edge case)
 *
 * This can happen if:
 * - App was closed for a long time and all cached prayers are in the past
 * - Sequence wasn't refreshed and ran out of prayers
 *
 * SOLUTION: When deriveNextPrayer returns undefined, trigger refreshSequence()
 */
export const EXAMPLE_EMPTY_SEQUENCE_SCENARIO = {
  /**
   * Sequence with all prayers passed
   */
  staleSequence: {
    type: ScheduleType.Standard,
    prayers: [
      {
        id: 'standard_fajr_2026-01-17',
        type: ScheduleType.Standard,
        english: 'Fajr',
        arabic: 'الفجر',
        datetime: new Date('2026-01-17T06:10:00'), // In the past
        time: '06:10',
        belongsToDate: '2026-01-17',
      },
      {
        id: 'standard_isha_2026-01-17',
        type: ScheduleType.Standard,
        english: 'Isha',
        arabic: 'العشاء',
        datetime: new Date('2026-01-17T18:15:00'), // Also in the past
        time: '18:15',
        belongsToDate: '2026-01-17',
      },
    ],
  } as PrayerSequence,

  /**
   * Current time (all prayers are in the past)
   */
  now: new Date('2026-01-18T10:00:00'),

  /**
   * What happens when we try to derive next prayer
   */
  derivationResult: {
    nextPrayer: undefined, // No prayer > now!
    // This triggers: refreshSequence(type)
  },

  /**
   * How to handle this in code:
   *
   * ```typescript
   * function getNextPrayer(type: ScheduleType): Prayer | 'loading' {
   *   const sequence = store.get(getSequenceAtom(type));
   *   const next = sequence.prayers.find(p => p.datetime > now);
   *
   *   if (!next) {
   *     // All prayers passed - need to refresh
   *     refreshSequence(type);
   *     return 'loading';
   *   }
   *
   *   return next;
   * }
   * ```
   */
  handlingCode: 'See comment above',

  /**
   * UI behavior during refresh:
   * - Show loading spinner instead of countdown
   * - Don't show stale/incorrect prayer
   * - Retry with exponential backoff if refresh fails
   */
  uiBehavior: {
    showLoadingSpinner: true,
    showStaleData: false, // NEVER show wrong data
    retryOnFailure: true,
    maxRetries: 3,
    backoffMs: [1000, 2000, 4000], // Exponential backoff
  },
};

/**
 * EXAMPLE 7: DST (Daylight Saving Time) transition
 *
 * UK DST transitions:
 * - Spring forward: Last Sunday of March (clocks go 01:00 → 02:00)
 * - Fall back: Last Sunday of October (clocks go 02:00 → 01:00)
 *
 * Scenario: March 29, 2026 (Sunday) - Clocks spring forward at 1am
 *
 * KEY INSIGHT: JavaScript Date handles DST automatically.
 * new Date("2026-03-29T01:30:00") in UK timezone will correctly
 * represent the moment (which doesn't exist due to DST skip).
 *
 * The API provides prayer times already adjusted for DST.
 * We just need to parse them correctly.
 */
export const EXAMPLE_DST_SPRING_FORWARD: Prayer[] = [
  // Night before DST change (still GMT)
  {
    id: 'standard_isha_2026-03-28',
    type: ScheduleType.Standard,
    english: 'Isha',
    arabic: 'العشاء',
    datetime: new Date('2026-03-28T19:30:00'), // GMT (no DST yet)
    time: '19:30',
    belongsToDate: '2026-03-28',
  },
  /**
   * DST TRANSITION HAPPENS AT 01:00 → 02:00
   *
   * Fajr might be at 05:15 GMT, but after DST it shows as 06:15 BST.
   * The API returns "06:15" (BST), and we create:
   * new Date("2026-03-29T06:15:00") which is correct in local time.
   */
  {
    id: 'standard_fajr_2026-03-29',
    type: ScheduleType.Standard,
    english: 'Fajr',
    arabic: 'الفجر',
    datetime: new Date('2026-03-29T06:15:00'), // BST (after DST)
    time: '06:15', // This is BST, not GMT
    belongsToDate: '2026-03-29',
  },
  {
    id: 'standard_sunrise_2026-03-29',
    type: ScheduleType.Standard,
    english: 'Sunrise',
    arabic: 'الشروق',
    datetime: new Date('2026-03-29T07:45:00'), // BST
    time: '07:45',
    belongsToDate: '2026-03-29',
  },
  // ... more prayers in BST
];

/**
 * DST Fall Back: October 25, 2026 (Sunday) - Clocks go 02:00 → 01:00
 *
 * This creates an ambiguous hour (01:00-02:00 happens twice).
 * JavaScript Date handles this by using the FIRST occurrence.
 *
 * For prayer times, this rarely matters because:
 * - Fajr is typically before 01:00 (no ambiguity)
 * - Other prayers are well after 02:00 (no ambiguity)
 * - Only Isha might fall in the 01:00-02:00 range in late October
 *
 * The API should provide unambiguous times.
 */
export const EXAMPLE_DST_FALL_BACK: Prayer[] = [
  // Day before DST ends (still BST)
  {
    id: 'standard_isha_2026-10-24',
    type: ScheduleType.Standard,
    english: 'Isha',
    arabic: 'العشاء',
    datetime: new Date('2026-10-24T19:00:00'), // BST
    time: '19:00',
    belongsToDate: '2026-10-24',
  },
  /**
   * DST TRANSITION: Clocks go 02:00 → 01:00
   *
   * Fajr at 06:00 BST becomes 05:00 GMT.
   * The API returns "05:00" (GMT), and we create:
   * new Date("2026-10-25T05:00:00") which is correct in local time.
   */
  {
    id: 'standard_fajr_2026-10-25',
    type: ScheduleType.Standard,
    english: 'Fajr',
    arabic: 'الفجر',
    datetime: new Date('2026-10-25T05:00:00'), // GMT (after DST ends)
    time: '05:00', // This is GMT, not BST
    belongsToDate: '2026-10-25',
  },
  {
    id: 'standard_sunrise_2026-10-25',
    type: ScheduleType.Standard,
    english: 'Sunrise',
    arabic: 'الشروق',
    datetime: new Date('2026-10-25T06:30:00'), // GMT
    time: '06:30',
    belongsToDate: '2026-10-25',
  },
  // ... more prayers in GMT
];

/**
 * DST TESTING NOTES:
 *
 * UK TIMEZONE REFERENCE:
 * - GMT (Greenwich Mean Time) = UTC+0 (Winter: late October to late March)
 * - BST (British Summer Time) = UTC+1 (Summer: late March to late October)
 *
 * HOW IT WORKS:
 * 1. The API (londonprayertimes.com) returns times already adjusted for DST
 * 2. We parse times using: new Date(`${date}T${time}:00`)
 * 3. JavaScript's Date automatically handles timezone conversion
 * 4. No special DST logic needed in our code
 *
 * POTENTIAL ISSUES:
 * - If user's device timezone is wrong, prayers will display incorrectly
 * - This is a device configuration issue, not our bug
 *
 * TESTING CHECKLIST (progress.md Task 8.7):
 * - [ ] Mock date to March 29 (spring forward)
 * - [ ] Verify prayer times display correctly after DST change
 * - [ ] Verify countdown handles the 1-hour "skip"
 * - [ ] Mock date to October 25 (fall back)
 * - [ ] Verify no duplicate or missing prayers
 */

// =============================================================================
// SECTION 4: MMKV STORAGE FORMAT
// =============================================================================

/**
 * How prayers are serialized for MMKV storage
 *
 * JavaScript Date objects cannot be stored directly in MMKV.
 * We convert to ISO strings before storage, and parse back on load.
 *
 * NOTE: We store LOCAL time without timezone suffix (no 'Z').
 * This ensures the time is interpreted correctly when parsed back.
 * Example: "2026-06-22T01:00:00" (local) NOT "2026-06-22T01:00:00Z" (UTC)
 */
export const EXAMPLE_STORED_PRAYER: StoredPrayer = {
  id: 'standard_isha_2026-06-21',
  type: ScheduleType.Standard,
  english: 'Isha',
  arabic: 'العشاء',
  datetime: '2026-06-22T01:00:00', // Local time ISO string (no 'Z' suffix)
  time: '01:00',
  belongsToDate: '2026-06-21',
};

/**
 * MMKV storage keys for the new system
 *
 * The prayer data storage format (prayer_YYYY-MM-DD) remains UNCHANGED.
 * We add new keys for the sequence cache.
 */
export const MMKV_KEYS = {
  // Existing keys (unchanged)
  PRAYER_DATA: 'prayer_YYYY-MM-DD', // ISingleApiResponseTransformed
  FETCHED_YEARS: 'fetched_years', // { [year: number]: boolean }
  DISPLAY_DATE_STANDARD: 'display_date_standard', // Will be DEPRECATED (derived)
  DISPLAY_DATE_EXTRA: 'display_date_extra', // Will be DEPRECATED (derived)

  // New keys for sequence cache (optional - can be rebuilt from prayer data)
  SEQUENCE_STANDARD: 'sequence_standard', // StoredPrayerSequence
  SEQUENCE_EXTRA: 'sequence_extra', // StoredPrayerSequence
  SEQUENCE_LAST_REFRESH: 'sequence_last_refresh', // timestamp
};

// =============================================================================
// SECTION 5: STATE DERIVATION EXAMPLES
// =============================================================================

/**
 * How state is derived from the sequence
 *
 * Everything is computed from the prayer array - no manual sync needed.
 */

// Mock current time for examples
const NOW = new Date('2026-01-18T10:00:00');

/**
 * Find next prayer: First prayer with datetime > now
 */
export function deriveNextPrayer(prayers: Prayer[], now: Date): Prayer | undefined {
  return prayers.find((p) => p.datetime > now);
}

/**
 * Check if prayer has passed: datetime < now
 */
export function deriveIsPassed(prayer: Prayer, now: Date): boolean {
  return prayer.datetime < now;
}

/**
 * Calculate countdown in seconds: datetime - now
 */
export function deriveCountdown(prayer: Prayer, now: Date): number {
  return Math.floor((prayer.datetime.getTime() - now.getTime()) / 1000);
}

/**
 * Get previous prayer: The prayer before nextPrayer in the array
 */
export function derivePrevPrayer(prayers: Prayer[], now: Date): Prayer | undefined {
  const nextIndex = prayers.findIndex((p) => p.datetime > now);
  return nextIndex > 0 ? prayers[nextIndex - 1] : undefined;
}

/**
 * Get display date: The belongsToDate of the next prayer
 */
export function deriveDisplayDate(prayers: Prayer[], now: Date): string {
  const nextPrayer = deriveNextPrayer(prayers, now);
  return nextPrayer?.belongsToDate ?? prayers[prayers.length - 1].belongsToDate;
}

/**
 * Calculate progress bar percentage
 */
export function deriveProgress(prayers: Prayer[], now: Date): number {
  const nextPrayer = deriveNextPrayer(prayers, now);
  const prevPrayer = derivePrevPrayer(prayers, now);

  if (!nextPrayer || !prevPrayer) return 0;

  const total = nextPrayer.datetime.getTime() - prevPrayer.datetime.getTime();
  const elapsed = now.getTime() - prevPrayer.datetime.getTime();

  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

// Example usage:
export const DERIVATION_EXAMPLE = {
  now: NOW,
  prayers: EXAMPLE_WINTER_STANDARD,
  nextPrayer: deriveNextPrayer(EXAMPLE_WINTER_STANDARD, NOW),
  prevPrayer: derivePrevPrayer(EXAMPLE_WINTER_STANDARD, NOW),
  displayDate: deriveDisplayDate(EXAMPLE_WINTER_STANDARD, NOW),
  countdown: deriveNextPrayer(EXAMPLE_WINTER_STANDARD, NOW)
    ? deriveCountdown(deriveNextPrayer(EXAMPLE_WINTER_STANDARD, NOW)!, NOW)
    : 0,
  progress: deriveProgress(EXAMPLE_WINTER_STANDARD, NOW),
};

// =============================================================================
// SECTION 6: SERIALIZATION FUNCTIONS
// =============================================================================

/**
 * Convert Prayer to StoredPrayer (for MMKV storage)
 */
export function serializePrayer(prayer: Prayer): StoredPrayer {
  return {
    ...prayer,
    datetime: prayer.datetime.toISOString(),
  };
}

/**
 * Convert StoredPrayer to Prayer (from MMKV storage)
 */
export function deserializePrayer(stored: StoredPrayer): Prayer {
  return {
    ...stored,
    datetime: new Date(stored.datetime),
  };
}

/**
 * Convert PrayerSequence to StoredPrayerSequence
 */
export function serializeSequence(sequence: PrayerSequence): StoredPrayerSequence {
  return {
    type: sequence.type,
    prayers: sequence.prayers.map(serializePrayer),
  };
}

/**
 * Convert StoredPrayerSequence to PrayerSequence
 */
export function deserializeSequence(stored: StoredPrayerSequence): PrayerSequence {
  return {
    type: stored.type,
    prayers: stored.prayers.map(deserializePrayer),
  };
}

// =============================================================================
// SECTION 7: belongsToDate CALCULATION
// =============================================================================

/**
 * Calculate which Islamic day a prayer belongs to
 *
 * This follows ADR-004 rules:
 * - Standard: Day advances after Isha passes
 * - Extras: Day advances after Duha/Istijaba passes
 *
 * IMPORTANT: A prayer's belongsToDate may differ from its datetime's calendar date!
 *
 * Example: Isha at 1am on June 22
 * - datetime calendar date: June 22
 * - belongsToDate: June 21 (it's the final prayer of June 21's Islamic day)
 */
export function calculateBelongsToDate(
  type: ScheduleType,
  prayerEnglish: string,
  calendarDate: string,
  prayerDateTime: Date
): string {
  // For Standard schedule:
  // All prayers belong to their calendar date (the day Fajr starts a new Islamic day)
  if (type === ScheduleType.Standard) {
    // If Isha is after midnight (e.g., 01:00), it belongs to YESTERDAY
    // because the Islamic day started with yesterday's Fajr
    const hours = prayerDateTime.getHours();
    if (prayerEnglish === 'Isha' && hours < 12) {
      // Isha before noon means it crossed midnight - belongs to previous day
      const prevDate = new Date(prayerDateTime);
      prevDate.setDate(prevDate.getDate() - 1);
      return prevDate.toISOString().split('T')[0];
    }
    return calendarDate;
  }

  // For Extras schedule:
  // Midnight, Last Third, Suhoor belong to the NEXT day (the day they're preparing for)
  // Because the Extras day starts after Duha/Istijaba
  if (type === ScheduleType.Extra) {
    const nightPrayers = ['Midnight', 'Last Third', 'Suhoor'];
    if (nightPrayers.includes(prayerEnglish)) {
      // These prayers occur at night but belong to the day that starts with Duha
      // If Midnight is at 23:00 on Jan 17, it belongs to Jan 18's Extras schedule
      // If Midnight is at 00:30 on Jan 18, it STILL belongs to Jan 18's Extras schedule
      const hours = prayerDateTime.getHours();
      if (hours >= 12) {
        // Night prayer before midnight - belongs to tomorrow
        const nextDate = new Date(prayerDateTime);
        nextDate.setDate(nextDate.getDate() + 1);
        return nextDate.toISOString().split('T')[0];
      }
      // Night prayer after midnight - belongs to same calendar day
      return calendarDate;
    }
    // Duha and Istijaba belong to their calendar date
    return calendarDate;
  }

  return calendarDate;
}

// =============================================================================
// SECTION 8: COMPARISON TABLE
// =============================================================================

/**
 * SIDE-BY-SIDE COMPARISON
 *
 * ┌─────────────────┬────────────────────────────────┬────────────────────────────────┐
 * │ Aspect          │ Current System                 │ New System                     │
 * ├─────────────────┼────────────────────────────────┼────────────────────────────────┤
 * │ Storage         │ 3 maps: yesterday/today/       │ 1 array: prayers[]             │
 * │                 │ tomorrow                       │                                │
 * ├─────────────────┼────────────────────────────────┼────────────────────────────────┤
 * │ Prayer data     │ { date: "2026-01-18",          │ { datetime: Date,              │
 * │                 │   time: "01:00" }              │   belongsToDate: "2026-01-17" }│
 * ├─────────────────┼────────────────────────────────┼────────────────────────────────┤
 * │ Next prayer     │ schedule.today[nextIndex]      │ prayers.find(p => p.datetime   │
 * │                 │ (manual increment)             │   > now)                       │
 * ├─────────────────┼────────────────────────────────┼────────────────────────────────┤
 * │ isPassed        │ date === today &&              │ prayer.datetime < now          │
 * │                 │ isTimePassed(time)             │                                │
 * ├─────────────────┼────────────────────────────────┼────────────────────────────────┤
 * │ Countdown       │ calculateCountdown() with      │ datetime.getTime() -           │
 * │                 │ yesterday fallback (40+ lines) │ now.getTime() (1 line)         │
 * ├─────────────────┼────────────────────────────────┼────────────────────────────────┤
 * │ Previous prayer │ schedule.yesterday[5]          │ prayers[currentIndex - 1]      │
 * ├─────────────────┼────────────────────────────────┼────────────────────────────────┤
 * │ Display date    │ Stored in atom, manually       │ Derived: nextPrayer.           │
 * │                 │ synced                         │ belongsToDate                  │
 * ├─────────────────┼────────────────────────────────┼────────────────────────────────┤
 * │ Midnight        │ BUG: isTimePassed("01:00")     │ WORKS: datetime > now is       │
 * │ crossing        │ at 23:00 = true                │ unambiguous                    │
 * └─────────────────┴────────────────────────────────┴────────────────────────────────┘
 */
