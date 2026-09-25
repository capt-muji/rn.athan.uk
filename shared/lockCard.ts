/**
 * Pure content builder for the Android lock screen card.
 *
 * Android removed its lock-screen widget API in 5.0 and never replaced it,
 * and the vendor surfaces that exist are signature-gated to one OEM, so an
 * ongoing notification is the only vehicle that reaches every phone
 * (session 18). This module decides WHAT that card says; posting it is the
 * native module's job.
 *
 * No react-native import, so the unit suite reads it directly.
 */

import type { PrayerWidgetAndroidProps } from '@/shared/widgetTypes';

/** What the card shows at one instant. */
export interface LockCardContent {
  /** English prayer name, e.g. "Magrib" */
  name: string;
  /** The prayer's time in HH:mm */
  time: string;
  /** Minute-ceil countdown in the app's own shape, e.g. "6h 8m" or "12m" */
  countdown: string;
}

const MINUTE_MS = 60_000;

/**
 * Formats whole minutes the way the app writes a countdown everywhere else:
 * hours and minutes, each omitted when zero, and never "0m" on its own.
 *
 * Deliberately NOT Android's Chronometer, which can only render "06:08:32".
 */
const formatMinutes = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

/**
 * Builds the card's content from the widget snapshot at an instant.
 *
 * @param snapshot The Android widget snapshot (the same data the home widgets carry)
 * @param nowMs The instant to render for, epoch ms
 * @returns The next prayer's name, time and countdown, or null when nothing
 *   readable is still ahead (an empty window, or past the carried horizon)
 */
export const buildLockCardContent = (
  snapshot: Pick<PrayerWidgetAndroidProps, 'days'>,
  nowMs: number
): LockCardContent | null => {
  let next: { name: string; time: string; epochMs: number } | null = null;

  for (const day of snapshot.days) {
    for (const row of day.rows) {
      // epochMs 0 marks a row whose time could not be read, and predates
      // every instant the app deals in, so it can never win this comparison
      if (row.epochMs <= nowMs) continue;
      if (next === null || row.epochMs < next.epochMs) next = row;
    }
  }

  if (next === null) return null;

  // Ceil, so the label never reads a minute the prayer has not yet reached:
  // the same rounding the in-app countdown uses
  const minutesLeft = Math.ceil((next.epochMs - nowMs) / MINUTE_MS);

  return { name: next.name, time: next.time, countdown: formatMinutes(minutesLeft) };
};
