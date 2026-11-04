import type { COUNTDOWN_WAITING_NAME, PrayerId } from '@/shared/constants';

/**
 * The six provider times every list row is built from
 */
export type RequiredTimeName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'magrib' | 'isha';

/**
 * One day of the timetable as the app reads it: the six published times plus
 * the three derived extras, each null where the time it comes from is.
 *
 * Produced by shared/timetableDecode.ts minutesToRecord - the only producer -
 * from six minutes past midnight: the baked artifact decodes them from its
 * bytes, a dev build from the launch-relative mock window.
 *
 * Derived from the day's own times: suhoor 20 minutes before Fajr, duha 20
 * minutes after Sunrise, istijaba 60 minutes before Magrib (shown on Fridays
 * only - a list-building question, never a storage one). Midnight and Last
 * Third are not stored: they belong to the night leading into the day (the
 * previous day's Magrib to this day's Fajr), so shared/prayer.ts works them
 * out from two records when the lists are built (getNightTimesForDay).
 *
 * Asr is the timetable's single published Asr - the standard shadow
 * calculation; the publisher's later Hanafi column is never baked
 * (scripts/lupt/generate.mjs).
 *
 * A time is null rather than a placeholder string because a placeholder
 * type-checks everywhere and reaches arithmetic; `--:--` is how absence is
 * drawn, never what is stored.
 */
export interface DayRecord {
  /** Calendar date in YYYY-MM-DD format */
  date: string;
  /** The six published times (HH:mm format) */
  fajr: string | null;
  sunrise: string | null;
  dhuhr: string | null;
  asr: string | null;
  magrib: string | null;
  isha: string | null;
  /** The three derived times (HH:mm format) */
  suhoor: string | null;
  duha: string | null;
  istijaba: string | null;
}

/**
 * Schedule type enum defining the two prayer schedules in the app
 *
 * Standard Schedule (6 prayers):
 * - Fajr: Pre-dawn prayer
 * - Sunrise: Marks end of Fajr time
 * - Dhuhr: Midday prayer
 * - Asr: Afternoon prayer
 * - Magrib: Sunset prayer
 * - Isha: Night prayer
 *
 * Extra Schedule (4-5 prayers):
 * - Midnight: Islamic midnight (midpoint Magrib-Fajr, not 00:00)
 * - Last Third: Last third of night begins (blessed time for prayer)
 * - Suhoor: Pre-dawn meal time (20 min before Fajr)
 * - Duha: Forenoon prayer (20 min after Sunrise)
 * - Istijaba: Supplication time (60 min before Magrib, Fridays only)
 *
 * The three offsets above are TIME_ADJUSTMENTS in shared/constants.ts, which is
 * the only place they are defined; do not restate a number here without it.
 *
 * Users can toggle between schedules via the tab navigation.
 * Each schedule has independent notification preferences and display state.
 */
export enum ScheduleType {
  /** Standard schedule: 6 main daily prayers */
  Standard = 'standard',
  /** Extra schedule: 4-5 voluntary/blessed times */
  Extra = 'extra',
}

/** The Sahur row's scheduling modes, in picker order */
export type FastingMode = 'everyDay' | 'muhammad' | 'dawood' | 'whiteDays';

/** The fasting selection the Sahur row's sheet commits beside its alerts */
export interface FastingSelection {
  mode: FastingMode;
  whiteDaysAddOn: boolean;
}

export interface PageCoordinates {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
}

/**
 * Alert type enum for prayer notification preferences
 *
 * Each prayer can have its notification set to one of three modes:
 *
 * Off (0):
 * - No notification scheduled for this prayer
 * - Prayer time passes silently
 * - Default state for most prayers
 *
 * Silent (1):
 * - Notification scheduled but with no sound
 * - Shows banner/notification with vibration only
 * - Useful for discreet reminders (e.g., at work)
 *
 * Sound (2):
 * - Full notification with Athan audio
 * - Plays selected Athan sound from bottom sheet
 * - Default for important prayers (Fajr, Dhuhr, etc.)
 *
 * Stored per-prayer in MMKV with name-based keys (index keys were migrated):
 * - preference_alert_standard_{prayer_name} (e.g., preference_alert_standard_fajr)
 * - preference_alert_extra_{prayer_name}
 *
 * Values are stored as integers (0, 1, 2) to save space.
 *
 * Those integers are a STORAGE CONTRACT, not an implementation detail: MMKV holds the
 * literal "0", "1" or "2", so inserting a member or reordering these three silently
 * re-reads every existing user's choice as a different one — Sound becomes Silent and
 * the athan stops playing, with no error. Append new members with explicit values only.
 * `shared/__tests__/types.test.ts` pins the three numbers; symbol-to-symbol assertions
 * cannot, because they stay true through a reorder.
 */
export enum AlertType {
  /** No notification */
  Off = 0,
  /** Silent notification (vibration only) */
  Silent = 1,
  /** Notification with Athan sound */
  Sound = 2,
}

/**
 * Valid reminder intervals in minutes before prayer time
 * Used for pre-prayer reminder notifications
 */
export type ReminderInterval = 5 | 10 | 15 | 20 | 25 | 30;

/**
 * Which of a prayer's two reminders a setting belongs to.
 *
 * The numbers are a STORAGE CONTRACT in the same way `AlertType`'s are: slot 0 keys are the
 * single-reminder keys every existing install already wrote, so it can never be renumbered.
 */
export type ReminderSlot = 0 | 1;

/** Both reminder slots, in the order the sheet draws them */
export const REMINDER_SLOTS = [0, 1] as const satisfies readonly ReminderSlot[];

/** One reminder's own settings: each slot carries its own sound, so two can differ */
export interface ReminderSetting {
  /** Reminder alert type (Off/Silent/Sound) */
  alert: AlertType;
  /** Minutes before prayer time */
  interval: ReminderInterval;
}

/** One per slot, in slot order */
export type PerReminderSlot<T> = readonly [T, T];

/**
 * State for the AlertMenu popup component
 * Tracks the at-time alert and both pre-prayer reminders
 */
export interface AlertMenuState {
  /** At-time alert type (Off/Silent/Sound) */
  atTimeAlert: AlertType;
  /** Both reminders, indexed by slot */
  reminders: PerReminderSlot<ReminderSetting>;
  /** Present only on the Sahur row: the fasting selection riding the same commit */
  fasting?: FastingSelection;
}

export enum Icon {
  BELL_RING = 'BELL_RING',
  BELL_SLASH = 'BELL_SLASH',
  SPEAKER = 'SPEAKER',
  PLAY = 'PLAY',
  PAUSE = 'PAUSE',
  QUESTION = 'QUESTION',
  MUSIC_NOTE = 'MUSIC_NOTE',
  COMPASS = 'COMPASS',
  APPLE = 'APPLE',
  ANDROID = 'ANDROID',
  GLOBE = 'GLOBE',
  DOWNLOAD = 'DOWNLOAD',
  REFRESH = 'REFRESH',
}

// =============================================================================
// NEW TIMING SYSTEM TYPES (Prayer-Centric Model)

// =============================================================================

/** What every row on a list has, whether or not its time could be read */
interface PrayerRow {
  /** Schedule type: 'standard' or 'extra' */
  type: ScheduleType;
  /** The prayer's id: the stored key and identifier form; display resolves it through prayerLabel */
  id: PrayerId;
  /** Which Islamic day this prayer belongs to (per ADR-004)
   * May differ from datetime's calendar date (e.g., Isha at 1am belongs to previous day) */
  belongsToDate: string;
}

/**
 * Prayer with full datetime object
 *
 * Key difference from ITransformedPrayer:
 * - datetime is a full Date object, so datetime > now is ALWAYS correct
 * - No midnight-crossing bugs possible
 * - belongsToDate tracks which Islamic day the prayer belongs to (per ADR-004)
 */
export interface ReadablePrayer extends PrayerRow {
  /** Full datetime - the actual moment in time (Date object) */
  datetime: Date;
  /** Original time string (for display purposes, e.g., "06:12") */
  time: string;
}

/**
 * A row whose time could not be read, or could not be worked out because a time it depends on could
 * not (see shared/prayer.ts). It is still on its list and is drawn as `--:--`, but it has no moment:
 * it can never be next, never be counted down to, and never have an alert armed for it.
 */
export interface UnreadablePrayer extends PrayerRow {
  datetime: null;
  time: null;
}

/**
 * One row of a list. A union rather than optional fields, so that anything doing arithmetic on a
 * moment must first establish that the row has one (`isReadable` in shared/sequence.ts)
 */
export type Prayer = ReadablePrayer | UnreadablePrayer;

/**
 * Prayer sequence - single array replacing yesterday/today/tomorrow structure
 * Contains 48-72 hours of prayers, in list order (compareListOrder in shared/sequence.ts)
 */
export interface PrayerSequence {
  /** Schedule type: 'standard' or 'extra' */
  type: ScheduleType;
  /** Prayers by list day, then position on the list; readable rows are therefore in time order */
  prayers: Prayer[];
}

// =============================================================================
// COUNTDOWN AND OVERLAY STATE TYPES
// =============================================================================

export enum CountdownKey {
  Standard = 'standard',
  Extra = 'extra',
}

export interface CountdownStore {
  /**
   * Seconds left, or null when there is nothing to count: the overlay shows an occurrence whose time could not
   * be read, or the list on screen has no readable time left to come
   */
  timeLeft: number | null;
  /** The prayer's id, or the waiting marker; the display atom resolves the label */
  name: PrayerId | typeof COUNTDOWN_WAITING_NAME;
}

export interface OverlayStore {
  isOn: boolean;
  selectedPrayerIndex: number;
  scheduleType: ScheduleType;
}
