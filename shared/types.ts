export interface IApiSingleTime {
  date: string;
  fajr: string;
  fajr_jamat: string;
  sunrise: string;
  dhuhr: string;
  dhuhr_jamat: string;
  asr: string;
  asr_2: string;
  asr_jamat: string;
  magrib: string;
  magrib_jamat: string;
  isha: string;
  isha_jamat: string;
}

export interface IApiTimes {
  [date: string]: IApiSingleTime;
}

export interface IApiResponse {
  city: string;
  times: Record<string, IApiSingleTime>;
}

export interface ISingleApiResponseTransformed {
  date: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  magrib: string;
  isha: string;
  midnight: string;
  'last third': string;
  suhoor: string;
  duha: string;
  istijaba: string;
}

export enum ScheduleType {
  Standard = 'standard',
  Extra = 'extra',
}

export enum DaySelection {
  Today = 'today',
  Tomorrow = 'tomorrow',
}

export interface PageCoordinates {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
}

export enum AlertType {
  Off = 0,
  Silent = 1,
  Sound = 2,
}

export enum AlertIcon {
  BELL_RING = 'BELL_RING',
  BELL_SLASH = 'BELL_SLASH',
  SPEAKER = 'SPEAKER',
  PLAY = 'PLAY',
  PAUSE = 'PAUSE',
  INFO = 'INFO',
  ARROW_UP = 'ARROW_UP',
}

export interface AlertPreferences {
  [prayerIndex: number]: AlertType;
}

export interface AlertPreferencesStore {
  standard: AlertPreferences;
  extra: AlertPreferences;
}

export interface SoundPreferences {
  selected: number;
}

export interface Preferences {
  alert: AlertPreferences;
  athan: number;
}

export interface PreferencesStore {
  preferences: Preferences;
}

export interface OverlayStore {
  isOn: boolean;
  selectedPrayerIndex: number;
  scheduleType: ScheduleType;
}

export interface FetchedYears {
  [year: number]: boolean;
}

export interface TimerStore {
  timeLeft: number;
  name: string;
}

export interface TimerCallbacks {
  onTick: (secondsLeft: number) => void;
  onFinish: () => void;
}

export interface FetchDataResult {
  currentYearData: ISingleApiResponseTransformed[];
  nextYearData: ISingleApiResponseTransformed[] | null;
  currentYear: number;
}

export type TimerKey = 'standard' | 'extra' | 'overlay';

// intefae with valu property
export interface PrimitiveAtom<T> {
  value: T;
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

  /**
   * Full datetime - the actual moment in time
   * Comparisons are trivial: isPassed = datetime < now
   */
  datetime: Date;

  /** Original time string (for display purposes) */
  time: string;

  /**
   * Which Islamic day this prayer belongs to (per ADR-004)
   * May differ from datetime's calendar date (e.g., Isha at 1am belongs to previous day)
   */
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
