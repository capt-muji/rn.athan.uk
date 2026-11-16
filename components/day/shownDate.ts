/**
 * The date Day shows. Pure, so it can be tested without a renderer (same split as
 * components/overlay/catcherGeometry.ts).
 */

import { currentLocaleId } from '@/shared/i18n/locale';
import { formatDateLocalized, formatHijriDateLocalized } from '@/shared/time';

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
 * one falls back to the Gregorian one from inside its own catch and throws again, uncaught. With no date it
 * prints nothing.
 *
 * Formatted once per (locale, calendar, date) and served from the cache after: both formatters compose from the
 * active locale's catalog, and the Hijri one pays an Intl DateTimeFormat construction per call - expensive on
 * the floor device, and paid at every overlay open for a date string that only changes when the day or the
 * selection does. The cache holds one short string per locale, calendar and day shown: a few entries a day,
 * never worth a bound.
 *
 * @param dateSource The list day (getShownDateSource)
 * @param hijriEnabled Whether the Hijri date is chosen in settings
 */
const formattedDates = new Map<string, string>();

export const formatShownDate = (dateSource: string | null, hijriEnabled: boolean): string => {
  if (!dateSource) return '';
  const key = `${currentLocaleId()}|${hijriEnabled ? 'hijri' : 'gregorian'}|${dateSource}`;
  const cached = formattedDates.get(key);
  if (cached !== undefined) return cached;

  const formatted = hijriEnabled ? formatHijriDateLocalized(dateSource) : formatDateLocalized(dateSource);
  formattedDates.set(key, formatted);
  return formatted;
};
