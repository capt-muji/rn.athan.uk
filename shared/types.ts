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
  /** Maghrib prayer time in HH:mm format */
  magrib: string;
  /** Maghrib congregation time (not used in app) */
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

/**
 * Transformed and enriched prayer times for a single day
 *
 * This is the processed version of IApiSingleTime with derived extra prayers added.
 * Transformation happens in shared/prayer.ts:transformApiData()
 *
 * Derived prayers calculated from API data:
 * - midnight: Midpoint between Maghrib and Fajr (Islamic midnight, not 00:00)
 * - last third: Start of last third of night + 5 min adjustment
 * - suhoor: 40 minutes before Fajr (pre-dawn meal)
 * - duha: 20 minutes after Sunrise (forenoon prayer)
 * - istijaba: 59 minutes before Maghrib on Fridays only (supplication time)
 *
 * Stored in MMKV with key format: prayer_YYYY-MM-DD
 * Cache lifetime: Until next app upgrade (see stores/version.ts)
 */
export interface ISingleApiResponseTransformed {
  /** Calendar date in YYYY-MM-DD format */
  date: string;
  /** 6 main prayers from API (HH:mm format) */
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  magrib: string;
  isha: string;
  /** 5 derived extra prayers (HH:mm format) */
  midnight: string;
  'last third': string;
  suhoor: string;
  duha: string;
  istijaba: string;
}

/**
 * Schedule type enum defining the two prayer schedules in the app
 *
 * Standard Schedule (6 prayers):
 * - Fajr: Pre-dawn prayer
 * - Sunrise: Marks end of Fajr time
 * - Dhuhr: Midday prayer
 * - Asr: Afternoon prayer
 * - Maghrib: Sunset prayer
 * - Isha: Night prayer
 *
 * Extra Schedule (4-5 prayers):
 * - Midnight: Islamic midnight (midpoint Maghrib-Fajr, not 00:00)
 * - Last Third: Last third of night begins (blessed time for prayer)
 * - Suhoor: Pre-dawn meal time (40 min before Fajr)
 * - Duha: Forenoon prayer (20 min after Sunrise)
 * - Istijaba: Supplication time (59 min before Maghrib, Fridays only)
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
 * Stored per-prayer in MMKV with key format:
 * - preference_alert_standard_{index} (e.g., preference_alert_standard_0 for Fajr)
 * - preference_alert_extra_{index}
 *
 * Values are stored as integers (0, 1, 2) to save space.
 */
export enum AlertType {
  /** No notification */
  Off = 0,
  /** Silent notification (vibration only) */
  Silent = 1,
  /** Notification with Athan sound */
  Sound = 2,
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
}

// =============================================================================
// NEW TIMING SYSTEM TYPES (Prayer-Centric Model)
// See: ai/adr/005-timing-system-overhaul.md
// =============================================================================

/**
 * Prayer with full datetime object
 *
 * Key difference from ITransformedPrayer:
 * - datetime is a full Date object, so datetime > now is ALWAYS correct
 * - No midnight-crossing bugs possible
 * - belongsToDate tracks which Islamic day the prayer belongs to (per ADR-004)
 */
export interface Prayer {
  /** Schedule type: 'standard' or 'extra' */
  type: ScheduleType;
  /** English name: "Fajr", "Isha", "Midnight", etc. */
  english: string;
  /** Arabic name: "الفجر", "العشاء", etc. */
  arabic: string;
  /** Full datetime - the actual moment in time (Date object) */
  datetime: Date;
  /** Original time string (for display purposes, e.g., "06:12") */
  time: string;
  /** Which Islamic day this prayer belongs to (per ADR-004)
   * May differ from datetime's calendar date (e.g., Isha at 1am belongs to previous day) */
  belongsToDate: string;
}

/**
 * Prayer sequence - single sorted array replacing yesterday/today/tomorrow structure
 * Contains 48-72 hours of prayers, sorted by datetime
 */
export interface PrayerSequence {
  /** Schedule type: 'standard' or 'extra' */
  type: ScheduleType;
  /** Prayers sorted by datetime, next 48-72 hours */
  prayers: Prayer[];
}

/**
 * Serialized prayer for MMKV storage
 * JavaScript Date objects cannot be stored directly in MMKV
 * datetime is converted to ISO string (without 'Z' suffix for local time)
 */
export interface StoredPrayer {
  type: ScheduleType;
  english: string;
  arabic: string;
  /** ISO string format: "2026-01-18T06:12:00" (local time, no 'Z') */
  datetime: string;
  time: string;
  belongsToDate: string;
}

/**
 * Serialized prayer sequence for MMKV storage
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
  Overlay = 'overlay',
}

export interface CountdownStore {
  timeLeft: number;
  name: string;
}

export interface OverlayStore {
  isOn: boolean;
  selectedPrayerIndex: number;
  scheduleType: ScheduleType;
}
