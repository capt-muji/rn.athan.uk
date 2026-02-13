/**
 * TIMING SYSTEM SCHEMA REFERENCE
 *
 * Schema reference for the prayer-centric timing model.
 * Shows the transformation from API response → MMKV storage → Runtime state.
 *
 * KEY INSIGHT: Full DateTime objects instead of separate date/time strings
 * eliminate midnight-crossing bugs.
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import type { Prayer, PrayerSequence, StoredPrayer, StoredPrayerSequence } from '@/shared/types';
import { ScheduleType } from '@/shared/types';

// =============================================================================
// TIMING SYSTEM SCHEMA REFERENCE (Prayer-Centric Model)
// See: ai/adr/005-timing-system-overhaul.md
// =============================================================================

/**
 * Core types: Prayer, StoredPrayer, PrayerSequence, StoredPrayerSequence
 * Defined in shared/types.ts — imported above, re-exported here for reference.
 *
 * @see shared/types.ts for canonical definitions
 */
export type { Prayer, PrayerSequence, StoredPrayer, StoredPrayerSequence };

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
  // Yesterday's Isha (for CountdownBar calculation)
  {
    type: ScheduleType.Standard,
    english: 'Isha',
    arabic: 'العشاء',
    datetime: new Date('2026-01-17T18:15:00'),
    time: '18:15',
    belongsToDate: '2026-01-17',
  },
  // Today's prayers
  {
    type: ScheduleType.Standard,
    english: 'Fajr',
    arabic: 'الفجر',
    datetime: new Date('2026-01-18T06:12:00'),
    time: '06:12',
    belongsToDate: '2026-01-18',
  },
  {
    type: ScheduleType.Standard,
    english: 'Sunrise',
    arabic: 'الشروق',
    datetime: new Date('2026-01-18T07:48:00'),
    time: '07:48',
    belongsToDate: '2026-01-18',
  },
  {
    type: ScheduleType.Standard,
    english: 'Dhuhr',
    arabic: 'الظهر',
    datetime: new Date('2026-01-18T12:14:00'),
    time: '12:14',
    belongsToDate: '2026-01-18',
  },
  {
    type: ScheduleType.Standard,
    english: 'Asr',
    arabic: 'العصر',
    datetime: new Date('2026-01-18T14:15:00'),
    time: '14:15',
    belongsToDate: '2026-01-18',
  },
  {
    type: ScheduleType.Standard,
    english: 'Magrib',
    arabic: 'المغرب',
    datetime: new Date('2026-01-18T16:45:00'),
    time: '16:45',
    belongsToDate: '2026-01-18',
  },
  {
    type: ScheduleType.Standard,
    english: 'Isha',
    arabic: 'العشاء',
    datetime: new Date('2026-01-18T18:15:00'),
    time: '18:15',
    belongsToDate: '2026-01-18',
  },
  // Tomorrow's prayers
  {
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
 * THIS IS THE BUG THE PRAYER-CENTRIC MODEL FIXES:
 * - Old system: isTimePassed("01:00") at 23:00 returns TRUE (WRONG!)
 * - Current system: datetime > now returns TRUE (CORRECT!)
 */
export const EXAMPLE_SUMMER_ISHA_AFTER_MIDNIGHT: Prayer[] = [
  // Earlier prayers from June 21
  {
    type: ScheduleType.Standard,
    english: 'Fajr',
    arabic: 'الفجر',
    datetime: new Date('2026-06-21T02:45:00'),
    time: '02:45',
    belongsToDate: '2026-06-21',
  },
  {
    type: ScheduleType.Standard,
    english: 'Sunrise',
    arabic: 'الشروق',
    datetime: new Date('2026-06-21T04:43:00'),
    time: '04:43',
    belongsToDate: '2026-06-21',
  },
  {
    type: ScheduleType.Standard,
    english: 'Dhuhr',
    arabic: 'الظهر',
    datetime: new Date('2026-06-21T13:02:00'),
    time: '13:02',
    belongsToDate: '2026-06-21',
  },
  {
    type: ScheduleType.Standard,
    english: 'Asr',
    arabic: 'العصر',
    datetime: new Date('2026-06-21T17:17:00'),
    time: '17:17',
    belongsToDate: '2026-06-21',
  },
  {
    type: ScheduleType.Standard,
    english: 'Magrib',
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
    type: ScheduleType.Standard,
    english: 'Isha',
    arabic: 'العشاء',
    datetime: new Date('2026-06-22T01:00:00'), // NOTE: June 22 at 1am!
    time: '01:00',
    belongsToDate: '2026-06-21', // But belongs to June 21's Islamic day
  },
  // Next day's prayers
  {
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
 * The Midnight prayer is calculated as: (Magrib + Fajr) / 2
 * In summer: Magrib 21:21, Fajr 02:47 → Midnight ≈ 00:04
 */
export const EXAMPLE_SUMMER_EXTRAS_MIDNIGHT_AFTER_00: Prayer[] = [
  // Yesterday's Duha (for context)
  {
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
    type: ScheduleType.Extra,
    english: 'Midnight',
    arabic: 'نصف الليل',
    datetime: new Date('2026-06-22T00:04:00'), // NOTE: June 22 at 00:04!
    time: '00:04',
    belongsToDate: '2026-06-21', // Belongs to June 21's Extras
  },
  {
    type: ScheduleType.Extra,
    english: 'Last Third',
    arabic: 'آخر ثلث',
    datetime: new Date('2026-06-22T01:38:00'),
    time: '01:38',
    belongsToDate: '2026-06-21',
  },
  {
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
    type: ScheduleType.Extra,
    english: 'Duha',
    arabic: 'الضحى',
    datetime: new Date('2026-06-22T05:03:00'),
    time: '05:03',
    belongsToDate: '2026-06-21',
  },
  // Next day's Extras (after Duha advances)
  {
    type: ScheduleType.Extra,
    english: 'Midnight',
    arabic: 'نصف الليل',
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
    type: ScheduleType.Extra,
    english: 'Istijaba',
    arabic: 'استجابة',
    datetime: new Date('2026-01-23T12:30:00'),
    time: '12:30',
    belongsToDate: '2026-01-23',
  },
  // January 24 (Friday) Extras - all belong to Jan 24
  {
    type: ScheduleType.Extra,
    english: 'Midnight',
    arabic: 'نصف الليل',
    datetime: new Date('2026-01-23T23:15:00'), // Night of Jan 23 → morning of Jan 24
    time: '23:15',
    belongsToDate: '2026-01-24', // Belongs to Friday's Extras
  },
  {
    type: ScheduleType.Extra,
    english: 'Last Third',
    arabic: 'آخر ثلث',
    datetime: new Date('2026-01-24T02:40:00'),
    time: '02:40',
    belongsToDate: '2026-01-24',
  },
  {
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
    type: ScheduleType.Extra,
    english: 'Istijaba',
    arabic: 'استجابة',
    datetime: new Date('2026-01-24T12:30:00'),
    time: '12:30',
    belongsToDate: '2026-01-24', // FINAL prayer of Friday's Extras
  },
  // After Istijaba passes, schedule advances to Saturday (Jan 25)
  {
    type: ScheduleType.Extra,
    english: 'Midnight',
    arabic: 'نصف الليل',
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
        type: ScheduleType.Standard,
        english: 'Fajr',
        arabic: 'الفجر',
        datetime: new Date('2026-01-17T06:10:00'), // In the past
        time: '06:10',
        belongsToDate: '2026-01-17',
      },
      {
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
   * How this is handled in the actual codebase:
   *
   * @see stores/schedule.ts → getNextPrayer(type) — pure read, returns Prayer | null
   * @see stores/schedule.ts → refreshSequence(type) — prunes passed prayers, fetches more
   *
   * ```typescript
   * // stores/schedule.ts
   * const next = getNextPrayer(ScheduleType.Standard);
   * if (!next) {
   *   refreshSequence(type);
   *   // Then retry or handle loading state
   * }
   * ```
   */
  handlingCode: 'See stores/schedule.ts',

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
    type: ScheduleType.Standard,
    english: 'Fajr',
    arabic: 'الفجر',
    datetime: new Date('2026-03-29T06:15:00'), // BST (after DST)
    time: '06:15', // This is BST, not GMT
    belongsToDate: '2026-03-29',
  },
  {
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
    type: ScheduleType.Standard,
    english: 'Fajr',
    arabic: 'الفجر',
    datetime: new Date('2026-10-25T05:00:00'), // GMT (after DST ends)
    time: '05:00', // This is GMT, not BST
    belongsToDate: '2026-10-25',
  },
  {
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
  type: ScheduleType.Standard,
  english: 'Isha',
  arabic: 'العشاء',
  datetime: '2026-06-22T01:00:00', // Local time ISO string (no 'Z' suffix)
  time: '01:00',
  belongsToDate: '2026-06-21',
};

/**
 * MMKV storage keys
 *
 * The prayer data storage format (prayer_YYYY-MM-DD) is unchanged.
 */
export const MMKV_KEYS = {
  // Active keys
  PRAYER_DATA: 'prayer_YYYY-MM-DD', // ISingleApiResponseTransformed
  FETCHED_YEARS: 'fetched_years', // { [year: number]: boolean }

  // REMOVED: Display dates are now derived from createDisplayDateAtom in stores/schedule.ts
  // DISPLAY_DATE_STANDARD: 'display_date_standard',
  // DISPLAY_DATE_EXTRA: 'display_date_extra',

  // NOT IMPLEMENTED: Sequences are built fresh from prayer data at runtime
  // via createPrayerSequence() in shared/prayer.ts — not cached in MMKV
  // SEQUENCE_STANDARD: 'sequence_standard',
  // SEQUENCE_EXTRA: 'sequence_extra',
  // SEQUENCE_LAST_REFRESH: 'sequence_last_refresh',
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
 * @see stores/schedule.ts → createNextPrayerAtom
 */
export function deriveNextPrayer(prayers: Prayer[], now: Date): Prayer | undefined {
  return prayers.find((p) => p.datetime > now);
}

/**
 * Check if prayer has passed: datetime < now
 * @see hooks/usePrayerSequence.ts → PrayerWithStatus.isPassed
 */
export function deriveIsPassed(prayer: Prayer, now: Date): boolean {
  return prayer.datetime < now;
}

/**
 * Calculate countdown in seconds: datetime - now
 * @see stores/countdown.ts → startSequenceCountdown
 */
export function deriveCountdown(prayer: Prayer, now: Date): number {
  return Math.floor((prayer.datetime.getTime() - now.getTime()) / 1000);
}

/**
 * Get previous prayer: The prayer before nextPrayer in the array
 * @see stores/schedule.ts → createPrevPrayerAtom
 */
export function derivePrevPrayer(prayers: Prayer[], now: Date): Prayer | undefined {
  const nextIndex = prayers.findIndex((p) => p.datetime > now);
  return nextIndex > 0 ? prayers[nextIndex - 1] : undefined;
}

/**
 * Get display date: The belongsToDate of the next prayer
 * @see stores/schedule.ts → createDisplayDateAtom
 */
export function deriveDisplayDate(prayers: Prayer[], now: Date): string {
  const nextPrayer = deriveNextPrayer(prayers, now);
  return nextPrayer?.belongsToDate ?? prayers[prayers.length - 1].belongsToDate;
}

/**
 * Calculate progress bar percentage
 * @see hooks/useCountdownBar.ts
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
// SECTION 6: SERIALIZATION
// =============================================================================

/**
 * Serialization is NOT currently used at runtime.
 *
 * Sequences are built fresh from MMKV raw data (prayer_YYYY-MM-DD keys)
 * on every app init via createPrayerSequence() in shared/prayer.ts.
 *
 * StoredPrayer and StoredPrayerSequence types are defined in shared/types.ts
 * and reserved for potential future caching of sequences to MMKV.
 */

// =============================================================================
// SECTION 7: belongsToDate CALCULATION
// =============================================================================

/**
 * Calculate which Islamic day a prayer belongs to
 *
 * Canonical implementation: shared/prayer.ts → calculateBelongsToDate()
 *
 * Rules (per ADR-004):
 * - STANDARD: Isha between 00:00-06:00 (London time) belongs to previous day
 * - EXTRAS: Night prayers (Midnight, Last Third, Suhoor) at >=12:00 belong to next day
 *
 * Implementation details:
 * - Uses getLondonHours() via toZonedTime() for timezone-correct hour extraction
 * - Isha cutoff: hours < ISLAMIC_DAY.EARLY_MORNING_CUTOFF_HOUR (6)
 * - Night prayer check: NIGHT_PRAYER_NAMES constant from shared/constants.ts
 * - Date math: addDays() from date-fns
 * - Date format: TimeUtils.formatDateShort() → YYYY-MM-DD
 *
 * @see shared/prayer.ts:141-162 for the actual implementation
 * @see shared/constants.ts → ISLAMIC_DAY, NIGHT_PRAYER_NAMES
 */

// =============================================================================
// SECTION 8: COMPARISON TABLE
// =============================================================================

/**
 * HISTORICAL COMPARISON: Before (pre-overhaul) vs Current system
 *
 * Kept for historical context. The "Before" system no longer exists in the codebase.
 *
 * ┌─────────────────┬────────────────────────────────┬────────────────────────────────┐
 * │ Aspect          │ Before (pre-overhaul)          │ Current                        │
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
