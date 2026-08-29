/**
 * Shared prop contract for the Athan iOS widgets (home screen + Lock Screen).
 *
 * These props are JSON-serialized across the widget bridge, so every value must
 * be JSON-safe: dates are epoch milliseconds, never Date objects (the widget
 * rebuilds Dates inside its own JS runtime).
 */

/** State of a single prayer row in the widget's day list */
export type PrayerWidgetRowState = 'passed' | 'next' | 'upcoming';

/**
 * Current schema version of the widget props contract. Bump when the props
 * shape changes: it lets layouts detect and tolerate entries written by an
 * older app version still sitting in the shared timeline store.
 */
export const WIDGET_PROPS_VERSION = 1;

/**
 * The slice of in-app settings the widgets honor. The widget has no
 * configuration of its own — it always mirrors these app preferences.
 * One function reads this snapshot (see stores/widget.ts), and one entry
 * field maps per setting.
 */
export interface PrayerWidgetSettings {
  /** Countdown bar accent color (preference_countdownbar_color) */
  accentColor: string;
  /** Arabic prayer names next to English (preference_show_arabic_names) */
  showArabic: boolean;
  /** Whether the countdown bar renders at all (preference_countdownbar_shown) */
  showBar: boolean;
}

/** One row of the day list shown in the medium home screen widget */
export interface PrayerWidgetDayPrayer {
  /** English prayer name, e.g. "Asr" */
  name: string;
  /** Arabic prayer name, e.g. "العصر" */
  arabic: string;
  /** Display time in HH:mm, e.g. "15:32" */
  time: string;
  /** Row state relative to the timeline entry's date */
  state: PrayerWidgetRowState;
}

/**
 * Timeline props pushed to both widgets at every prayer boundary.
 * One timeline entry per segment between consecutive prayers.
 */
export interface PrayerWidgetProps {
  /** Props schema version (WIDGET_PROPS_VERSION) for cross-release tolerance */
  v: number;
  /** English name of the upcoming prayer, e.g. "Asr" */
  nextName: string;
  /** Arabic name of the upcoming prayer (empty string when Arabic names are off) */
  nextArabic: string;
  /** Upcoming prayer time in HH:mm, e.g. "15:32" */
  nextTime: string;
  /** Upcoming prayer datetime as epoch ms */
  nextEpochMs: number;
  /** Start of the current segment (previous prayer) as epoch ms */
  prevEpochMs: number;
  /** User's countdown bar accent color as hex, e.g. "#ffd000" */
  accentColor: string;
  /** Whether to display Arabic prayer names (user preference) */
  showArabic: boolean;
  /** Whether the countdown bar renders (user preference; bar hidden in-app = hidden on widget) */
  showBar: boolean;
  /** Today's six prayers with per-entry pass/future states (medium widget list) */
  dayPrayers: PrayerWidgetDayPrayer[];
  /**
   * Terminal "out of date" entry — rendered when the whole timeline has
   * passed and the app has not re-pushed. Shows an "open Athan to refresh"
   * card instead of silently stale times. Absent on normal entries.
   */
  stale?: boolean;
}
