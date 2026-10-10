/**
 * Shared prop contract for the Athan iOS widgets (home screen + Lock Screen).
 *
 * These props are JSON-serialized across the widget bridge, so every value must
 * be JSON-safe: dates are epoch milliseconds, never Date objects (the widget
 * rebuilds Dates inside its own JS runtime).
 */

import type { PrayerId } from './constants';

/**
 * Current schema version of the widget props contract. Bump when the props
 * shape changes: it lets layouts detect and tolerate entries written by an
 * older app version still sitting in the shared timeline store.
 *
 * v6: every row carries `id` beside the baked `name` (layouts key rows by
 * `id ?? name` so a future locale's colliding names stay distinct).
 */
export const WIDGET_PROPS_VERSION = 6;

/**
 * Current schema version of the Android widget snapshot contract. Android has
 * no timeline: one snapshot carries the whole window and the layout computes
 * what to show at render time. Bump when the snapshot shape changes.
 *
 * v2: rows carry `id`, and every string the layout computed at render time
 * arrives baked as `strings` (the layout imports nothing).
 */
export const ANDROID_SNAPSHOT_VERSION = 2;

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
 * `id` is the closed vocabulary; `name` is the baked label the row draws.
 * Entries written by v5 apps carry `name` alone, so every `id` read guards
 * on presence.
 */
export interface WidgetPrayerRow {
  /** The prayer's id, e.g. "fajr"; absent on entries from v5 app versions */
  id: PrayerId;
  /** Baked display label, e.g. "Fajr" (prayerLabel(id)) */
  name: string;
  /** Prayer time in HH:mm, e.g. "05:35", or "--:--" when the source's time could not be read */
  time: string;
}

/**
 * Timeline props pushed to all four widgets at every prayer boundary (the
 * standard pair and the extras pair each receive their own schedule's
 * timeline). Exactly one entry per prayer segment: the countdown ticks
 * itself from the segment bounds, so nothing in the card changes between
 * boundaries and extra entries would only cost archive budget.
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
  /**
   * Start of the current segment (previous prayer) as epoch ms. With
   * nextEpochMs this is the interval the layouts hand to SwiftUI's ticking
   * countdown, which iOS redraws every second without a timeline entry.
   */
  prevEpochMs: number;
  /** Date of the upcoming prayer in the app's format (Hijri when enabled) */
  dateLabel: string;
  /**
   * The displayed day's prayers for the medium widget's list: the list day
   * the app shows at the entry's moment (usually the upcoming prayer's day;
   * a day with no readable time stays until 00:00 London at its end, as it
   * does in the app). Standard entries are chronological; extras entries are in
   * canonical EXTRAS_ENGLISH order with Istijaba present only on Fridays
   * (4 rows normally, 5 on Fridays). Rows before the active one are past,
   * rows after it are upcoming. Absent on entries from older app versions
   * (the medium layout degrades to the single-prayer composition).
   */
  prayers?: WidgetPrayerRow[];
  /**
   * Index of the active (next) prayer within `prayers` — the row carrying
   * the blue active background. -1 when the next prayer is not on the
   * displayed day, which happens while a day with no readable time is held
   * on screen (the medium layout then shows the single-prayer composition).
   */
  activeIndex?: number;
  /**
   * Terminal "out of date" entry — rendered when the whole timeline has
   * passed and the app has not re-pushed. Shows an "open Athan to refresh"
   * card instead of silently stale times. Absent on normal entries.
   */
  stale?: boolean;
}

/**
 * One row of the Android widget's carried data. `epochMs` is 0 for rows
 * whose time could not be read: they render as `--:--` and can never be the
 * next prayer (0 predates every epoch the app deals in). JSON null cannot
 * cross the Kotlin bridge nested inside the snapshot's maps and lists, so
 * 0 is the unavailable encoding. `id` is the closed vocabulary; `name` is
 * the baked label the row draws (snapshots from v1 apps carry `name` alone).
 */
export interface AndroidWidgetDayRow {
  /** The prayer's id, e.g. "fajr"; absent on snapshots from v1 app versions */
  id: PrayerId;
  /** Baked display label, e.g. "Fajr" (prayerLabel(id)) */
  name: string;
  /** Prayer time in HH:mm, or "--:--" when unreadable */
  time: string;
  /** The prayer's moment as epoch ms, or 0 when the row is unreadable */
  epochMs: number;
}

/**
 * Every string the Android layout would otherwise compute or hold at render
 * time, baked by the app from the catalog. The widget runtime imports nothing
 * (the closure law forbids it), so the layout's copy arrives as data. The
 * unit fields mirror DurationLabels so a future locale reuses its labels
 * directly; the countdown is minutes-only today, so `s` and `now` ride for
 * that shape and stay unread until it changes.
 */
export interface WidgetStrings {
  h: string;
  m: string;
  s: string;
  now: string;
  /** The stale card's title, e.g. "Out of date" */
  staleTitle: string;
  /** The stale card's refresh line on the medium composition */
  refreshLine: string;
  /** The refresh line's two halves on the small composition */
  refreshLead: string;
  refreshTail: string;
}

/**
 * One day of the Android snapshot: the list-day label the app would show,
 * the London midnight starting the day (the render-time day picker compares
 * against it), and the day's rows in its page's order.
 */
export interface AndroidWidgetDay {
  /** The day's date in the app's display format (Hijri when enabled) */
  dateLabel: string;
  /** London midnight starting this day, as epoch ms */
  startEpochMs: number;
  rows: AndroidWidgetDayRow[];
}

/**
 * The Android widget snapshot: everything the layout needs to compute its
 * content at ANY render instant inside the carried window. The theme and
 * size are stamped per widget kind by the push layer, not the builder.
 */
export interface PrayerWidgetAndroidProps {
  /** Snapshot schema version (ANDROID_SNAPSHOT_VERSION) */
  v: number;
  /** Which schedule the snapshot describes */
  schedule: 'standard' | 'extra';
  /** Palette, stamped per kind (the gallery's Light/Dark pairs) */
  theme: WidgetTheme;
  /** Which size composition to render, stamped per kind */
  size: 'small' | 'medium';
  /**
   * Launcher-granted width in dp, stamped by the native tick. Optional
   * because only native can read a grant: the JS push renders at the
   * declared minimum until the next tick.
   */
  grantedWidthDp?: number;
  /** The window's days, in order */
  days: AndroidWidgetDay[];
  /** The last readable prayer in the window: renders past this go stale */
  horizonEpochMs: number;
  /**
   * The layout's copy, baked from the catalog. Absent on snapshots from v1
   * app versions, which the layout renders with its English fallback.
   */
  strings: WidgetStrings;
}
