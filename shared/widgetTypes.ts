/**
 * Shared prop contract for the Athan iOS widgets (home screen + Lock Screen).
 *
 * These props are JSON-serialized across the widget bridge, so every value must
 * be JSON-safe: dates are epoch milliseconds, never Date objects (the widget
 * rebuilds Dates inside its own JS runtime).
 */

/**
 * Current schema version of the widget props contract. Bump when the props
 * shape changes: it lets layouts detect and tolerate entries written by an
 * older app version still sitting in the shared timeline store.
 */
export const WIDGET_PROPS_VERSION = 4;

/**
 * Which palette a home widget renders: 'light' or 'dark'. This is a
 * timeline-entry property, not a user setting — the gallery offers a Light
 * and a Dark kind per schedule, and each kind receives its own
 * theme-stamped timeline, so a widget's look is fixed at placement and does
 * not follow the system appearance.
 */
export type WidgetTheme = 'light' | 'dark';

/**
 * The slice of in-app settings the widgets honor. The widget has no
 * configuration of its own — it always mirrors these app preferences.
 * One function reads this snapshot (see stores/widget.ts), and one entry
 * field maps per setting.
 */
export interface PrayerWidgetSettings {
  /** Whether dates render in Hijri (preference_hijri_date) */
  hijriDate: boolean;
}

/**
 * One row of the medium widget's day list — the displayed day's prayers,
 * exactly as the corresponding app page shows them (chronological for the
 * Standard schedule, canonical EXTRAS_ENGLISH order for the Extra schedule).
 */
export interface WidgetPrayerRow {
  /** English prayer name, e.g. "Fajr" */
  name: string;
  /** Prayer time in HH:mm, e.g. "05:35" */
  time: string;
}

/**
 * Timeline props pushed to all four widgets at every prayer boundary (the
 * standard pair and the extras pair each receive their own schedule's
 * timeline). One timeline entry per prayer segment; within the stepped
 * countdown horizon the builder additionally emits one entry every five
 * minutes so the precomputed countdown label stays close to the truth.
 */
export interface PrayerWidgetProps {
  /** Props schema version (WIDGET_PROPS_VERSION) for cross-release tolerance */
  v: number;
  /**
   * Which schedule the timeline describes: 'standard' (the six prayers) or
   * 'extra' (Midnight, Last Third, Suhoor, Duha, Friday Istijaba). Drives the
   * active-pill palette in the medium home widget — indigo for standard,
   * rose for extra. Absent on entries from older app versions, which render
   * in the standard palette (only the standard kind ever stored them).
   */
  schedule?: 'standard' | 'extra';
  /**
   * Palette this entry renders — stamped by the builder per widget kind
   * (the gallery's Light/Dark pairs). Absent on entries from older app
   * versions and on the props-less gallery placeholder, where the layout
   * falls back to the system color scheme.
   */
  theme?: WidgetTheme;
  /** English name of the upcoming prayer, e.g. "Asr" */
  nextName: string;
  /** Upcoming prayer time in HH:mm, e.g. "15:32" */
  nextTime: string;
  /** Upcoming prayer datetime as epoch ms */
  nextEpochMs: number;
  /** Start of the current segment (previous prayer) as epoch ms */
  prevEpochMs: number;
  /**
   * Countdown to the upcoming prayer as a minute-ceil label ("2h", "1h 12m",
   * "9m", "1m") computed for the entry's date — seconds never render, and
   * the value rounds up so it holds until the true minute flips.
   */
  countdownLabel: string;
  /** Date of the upcoming prayer in the app's format (Hijri when enabled) */
  dateLabel: string;
  /**
   * The displayed day's prayers for the medium widget's list — the prayers
   * of the upcoming prayer's belongsToDate (the list rolls to the next day
   * exactly when the countdown target does, mirroring the app's displayDate
   * semantics). Standard entries are chronological; extras entries are in
   * canonical EXTRAS_ENGLISH order with Istijaba present only on Fridays
   * (4 rows normally, 5 on Fridays). Rows before the active one are past,
   * rows after it are upcoming. Absent on entries from older app versions
   * (the medium layout degrades to the single-prayer composition).
   */
  prayers?: WidgetPrayerRow[];
  /**
   * Index of the active (next) prayer within `prayers` — the row carrying
   * the blue active background. -1 when the next prayer is not part of the
   * displayed day (should not happen; guarded in the layout).
   */
  activeIndex?: number;
  /**
   * Terminal "out of date" entry — rendered when the whole timeline has
   * passed and the app has not re-pushed. Shows an "open Athan to refresh"
   * card instead of silently stale times. Absent on normal entries.
   */
  stale?: boolean;
}
