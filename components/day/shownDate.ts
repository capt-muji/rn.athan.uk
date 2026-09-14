/**
 * The date Day shows. Pure, so it can be tested without a renderer (same split as
 * components/overlay/catcherGeometry.ts).
 */

import { formatDateLong, formatHijriDateLong } from '@/shared/time';

/**
 * The list day the date is taken from: the highlighted occurrence's while the overlay highlights a prayer on
 * this schedule, so a passed row shows the next day it falls on, and the list day on screen otherwise
 *
 * @param showOverlayDate Whether the open overlay highlights a prayer on this schedule
 * @param overlayDate The highlighted occurrence's list day (usePrayer with isOverlay), '' when it has none
 * @param displayDate The list day on screen
 */
export const getShownDateSource = (
  showOverlayDate: boolean,
  overlayDate: string,
  displayDate: string | null
): string | null => (showOverlayDate ? overlayDate : displayDate);

/**
 * The date as Day prints it, Gregorian or Hijri
 *
 * Day is the only list-day consumer with no isReady gate, and both formatters throw on an empty date: the Hijri
 * one falls back to the Gregorian one from inside its own catch and throws again, uncaught. So no date prints
 * nothing.
 *
 * @param dateSource The list day (getShownDateSource)
 * @param hijriEnabled Whether the Hijri date is chosen in settings
 */
export const formatShownDate = (dateSource: string | null, hijriEnabled: boolean): string => {
  if (!dateSource) return '';
  return hijriEnabled ? formatHijriDateLong(dateSource) : formatDateLong(dateSource);
};
