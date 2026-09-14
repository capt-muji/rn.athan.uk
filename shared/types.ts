/**
 * Raw API response structure for a single day's prayer times
 *
 * This represents the unprocessed data received from the prayer times API.
 * Contains both individual prayer times and congregation (jamat) times.
 *
 * Note: Only the 6 main prayer times (fajr, sunrise, dhuhr, asr, magrib, isha)
 * are used by the app. Jamat times and asr_2 are fetched but not displayed.
 *
 * All times are in HH:mm format (24-hour, e.g., "06:12", "18:45")
 */
export interface IApiSingleTime {
  /** Calendar date in YYYY-MM-DD format (e.g., "2026-01-20") */
  date: string;
  /** Fajr prayer time in HH:mm format */
  fajr: string;
  /** Fajr congregation time (not used in app) */
  fajr_jamat: string;
  /** Sunrise time in HH:mm format */
  sunrise: string;
  /** Dhuhr prayer time in HH:mm format */
  dhuhr: string;
  /** Dhuhr congregation time (not used in app) */
  dhuhr_jamat: string;
  /** Asr prayer time in HH:mm format (Hanafi calculation) */
  asr: string;
  /** Alternative Asr time (Shafi calculation, not used in app) */
  asr_2: string;
  /** Asr congregation time (not used in app) */
  asr_jamat: string;
  /** Magrib prayer time in HH:mm format */
  magrib: string;
  /** Magrib congregation time (not used in app) */
  magrib_jamat: string;
  /** Isha prayer time in HH:mm format */
  isha: string;
  /** Isha congregation time (not used in app) */
  isha_jamat: string;
}

/**
 * Dictionary mapping dates to prayer times
 * Used internally during API data processing
 */
export interface IApiTimes {
  /** Key: date string (YYYY-MM-DD), Value: prayer times for that date */
  [date: string]: IApiSingleTime;
}

/**
 * Top-level API response structure
 *
 * The API returns prayer times for an entire year, grouped by city.
 * Each city contains a dictionary of dates mapped to prayer times.
 *
 * Example structure:
 * {
 *   "city": "London",
 *   "times": {
 *     "2026-01-20": { fajr: "06:12", sunrise: "08:05", ... },
 *     "2026-01-21": { fajr: "06:11", sunrise: "08:04", ... },
 *     ...
 *   }
 * }
 */
export interface IApiResponse {
  /** City name (e.g., "London") */
  city: string;
  /** Dictionary of dates to prayer times */
  times: Record<string, IApiSingleTime>;
}

/** The six provider times every list row is built from */
export type RequiredTimeName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'magrib' | 'isha';

/**
 * A payload after api/client.ts has checked it: each of the six times is a readable HH:mm, or null
 * where the provider's value was not
 */
export interface IValidatedApiResponse {
  city: string;
  times: Record<string, Record<RequiredTimeName, string | null>>;
}

/**
 * Transformed and enriched prayer times for a single day
 *
 * This is the processed version of IApiSingleTime with derived extra prayers added.
 * Transformation happens in shared/prayer.ts:transformApiData()
 *
 * Derived prayers calculated from the day's own API times:
 * - suhoor: 20 minutes before Fajr (pre-dawn meal)
 * - duha: 20 minutes after Sunrise (forenoon prayer)
 * - istijaba: 60 minutes before Magrib on Fridays only (supplication time)
 *
 * Midnight and Last Third are not stored: they belong to the night leading into
 * the day (the previous day's Magrib to this day's Fajr), so shared/prayer.ts
 * works them out from two records when the lists are built (getNightTimesForDay)
 *
 * Stored in MMKV with key format: prayer_YYYY-MM-DD
 * Cache lifetime: Until next app upgrade (see stores/version.ts)
 *
 * A time is null when the provider's value was not a readable HH:mm (api/client.ts), and a derived
 * time is null when the time it comes from is. Null rather than a placeholder string, because a
 * placeholder type-checks everywhere and reaches arithmetic; `--:--` is how absence is drawn, never
 * what is stored. Records written before times could be null are all strings, which this still reads.
 */
export interface ISingleApiResponseTransformed {
  /** Calendar date in YYYY-MM-DD format */
  date: string;
  /** 6 main prayers from API (HH:mm format) */
  fajr: string | null;
  sunrise: string | null;
  dhuhr: string | null;
  asr: string | null;
  magrib: string | null;
  isha: string | null;
  /** 3 derived extra prayers (HH:mm format) */
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
 * State for the AlertMenu popup component
 * Tracks both at-time alert and pre-prayer reminder settings
 */
export interface AlertMenuState {
  /** At-time alert type (Off/Silent/Sound) */
  atTimeAlert: AlertType;
  /** Pre-prayer reminder alert type (Off/Silent/Sound) */
  reminderAlert: AlertType;
  /** Reminder interval in minutes */
  reminderInterval: ReminderInterval;
}

export enum Icon {
  BELL_RING = 'BELL_RING',
  BELL_SLASH = 'BELL_SLASH',
  SPEAKER = 'SPEAKER',
  PLAY = 'PLAY',
  PAUSE = 'PAUSE',
  INFO = 'INFO',
  CHECK = 'CHECK',
  CLOSE = 'CLOSE',
  WIDGET = 'WIDGET',
  APPLE = 'APPLE',
  ANDROID = 'ANDROID',
}

// =============================================================================
// NEW TIMING SYSTEM TYPES (Prayer-Centric Model)
// See: ai/adr/005-timing-system-overhaul.md
// =============================================================================

/** What every row on a list has, whether or not its time could be read */
interface PrayerRow {
  /** Schedule type: 'standard' or 'extra' */
  type: ScheduleType;
  /** English name: "Fajr", "Isha", "Midnight", etc. */
  english: string;
  /** Arabic name: "الفجر", "العشاء", etc. */
  arabic: string;
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

/**
 * NOT A DESCRIPTION OF WHAT IS ON DISK. Nothing serializes to this shape, and
 * no runtime module reads or writes it.
 *
 * What the app actually persists is `ISingleApiResponseTransformed`, one record
 * per calendar day under `prayer_YYYY-MM-DD` (see `saveAllPrayers` in
 * `stores/database.ts`): a date plus `HH:mm` strings, with no Date objects and
 * no datetime strings of any kind. A `Prayer`, and the `PrayerSequence` holding
 * it, is rebuilt from those `HH:mm` strings on every launch by
 * `createPrayerSequence()` in `shared/prayer.ts` and never written back. So the
 * "local time, no 'Z'" format below is a proposal, not a contract — the
 * timezone hazard it warns about does not exist anywhere in the app today, and
 * reasoning about a stored `datetime` will send you looking for a bug that
 * cannot be there.
 *
 * Kept because `mocks/timing-system-schema.ts` documents this as the shape a
 * future sequence cache would take, should sequences ever be persisted rather
 * than rebuilt. Anything adopting it has to settle the parse rules for real
 * first, in code with tests behind it.
 */
export interface StoredPrayer {
  type: ScheduleType;
  english: string;
  arabic: string;
  /** Proposed format, unused: "2026-01-18T06:12:00" (local time, no 'Z') */
  datetime: string;
  time: string;
  belongsToDate: string;
}

/**
 * The sequence counterpart to StoredPrayer, and unused in the same way: no
 * sequence is persisted. See the note on StoredPrayer above.
 */
export interface StoredPrayerSequence {
  type: ScheduleType;
  prayers: StoredPrayer[];
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
  name: string;
}

export interface OverlayStore {
  isOn: boolean;
  selectedPrayerIndex: number;
  scheduleType: ScheduleType;
}
